import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { CheckCircle, Download, Github, Loader2, X } from 'lucide-react';
import { useSkillStore, type Skill, type SkillSourceMetadata } from '../store';
import { parseSkillContent } from '../lib/fsCore';
import { cn } from '../lib/utils';
import { evaluateSkillCompliance } from '../lib/compliancePolicy';
import { createTraceId } from '../lib/auditLog';
import { validateSkillDraft } from '../lib/skillValidator';

interface RepoImporterModalProps {
    onClose: () => void;
}

interface RepoInfo {
    owner: string;
    repo: string;
}

interface GitTreeNode {
    type: string;
    path: string;
}

const IMPORT_CONCURRENCY = 5;
const MAX_FETCH_RETRIES = 3;
const BASE_BACKOFF_MS = 300;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) return error.message;
    return 'Failed during repository import.';
}

function createAbortError(): Error {
    const error = new Error('Request was aborted.');
    error.name = 'AbortError';
    return error;
}

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

function parseRetryAfterMs(headerValue: string | null): number | null {
    if (!headerValue) return null;

    const asSeconds = Number(headerValue);
    if (Number.isFinite(asSeconds) && asSeconds >= 0) {
        return Math.round(asSeconds * 1000);
    }

    const asDateMs = Date.parse(headerValue);
    if (Number.isFinite(asDateMs)) {
        const delta = asDateMs - Date.now();
        return delta > 0 ? delta : 0;
    }

    return null;
}

function getRetryDelayMs(response: Response | null, attempt: number): number {
    const jitter = Math.floor(Math.random() * 250);
    const exponential = BASE_BACKOFF_MS * (2 ** attempt);
    const retryAfterMs = response ? parseRetryAfterMs(response.headers.get('retry-after')) : null;
    if (retryAfterMs !== null) return Math.max(retryAfterMs, BASE_BACKOFF_MS) + jitter;
    return exponential + jitter;
}

function waitWithAbort(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            if (signal) signal.removeEventListener('abort', onAbort);
            resolve();
        }, ms);

        const onAbort = () => {
            window.clearTimeout(timeoutId);
            if (signal) signal.removeEventListener('abort', onAbort);
            reject(createAbortError());
        };

        if (signal) {
            if (signal.aborted) {
                onAbort();
                return;
            }
            signal.addEventListener('abort', onAbort, { once: true });
        }
    });
}

async function fetchWithRetry(url: string, signal?: AbortSignal): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_FETCH_RETRIES; attempt++) {
        if (signal?.aborted) throw createAbortError();

        try {
            const response = await fetch(url, { signal });
            if (response.ok) return response;

            const shouldRetry = RETRYABLE_STATUS_CODES.has(response.status) && attempt < MAX_FETCH_RETRIES;
            if (!shouldRetry) return response;

            await waitWithAbort(getRetryDelayMs(response, attempt), signal);
        } catch (error: unknown) {
            if (isAbortError(error)) throw error;
            if (attempt >= MAX_FETCH_RETRIES) throw error;

            await waitWithAbort(getRetryDelayMs(null, attempt), signal);
        }
    }

    throw new Error(`Failed to fetch ${url}`);
}

function extractFirstParagraph(text: string): string {
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const paragraph = lines.find((line) => !line.startsWith('#') && !line.startsWith('-') && line.length > 20);
    if (!paragraph) return 'Imported from GitHub repository.';
    return paragraph.length > 130 ? `${paragraph.slice(0, 127)}...` : paragraph;
}

function normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

function parseGitHubInput(rawInput: string): RepoInfo | null {
    const commandMatch =
        rawInput.match(/(?:npx\s+)?skild\s+install\s+([^\s]+)/i) ||
        rawInput.match(/(?:npx\s+)?skills\s+add\s+([^\s]+)/i);

    const token = (commandMatch?.[1] || rawInput).trim().replace(/^@/, '');
    if (!token) return null;

    const urlMatch = token.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
    if (urlMatch) {
        const owner = urlMatch[1];
        const repo = urlMatch[2].replace(/\.git$/i, '');
        return { owner, repo };
    }

    const shortMatch = token.match(/^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)$/);
    if (shortMatch) {
        return {
            owner: shortMatch[1],
            repo: shortMatch[2].replace(/\.git$/i, '')
        };
    }

    return null;
}

function pickCandidateFiles(treeNodes: GitTreeNode[]): GitTreeNode[] {
    const markdownFiles = treeNodes.filter(
        (item) => item.type === 'blob' && typeof item.path === 'string' && item.path.toLowerCase().endsWith('.md')
    );

    const strictSkillMd = markdownFiles.filter((item) => /(^|\/)SKILL\.md$/i.test(item.path));
    if (strictSkillMd.length > 0) return strictSkillMd;

    const skillDirFiles = markdownFiles.filter((item) => /(^|\/)skills?\//i.test(item.path));
    if (skillDirFiles.length > 0) {
        return skillDirFiles
            .filter((item) => !/(README|CHANGELOG|CONTRIBUTING|LICENSE)\.md$/i.test(item.path))
            .slice(0, 120);
    }

    return markdownFiles
        .filter((item) => /skill/i.test(item.path))
        .filter((item) => !/(README|CHANGELOG|CONTRIBUTING|LICENSE)\.md$/i.test(item.path))
        .slice(0, 80);
}

function toOptionalNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function buildRepoSourceMetadata(repoData: {
    stargazers_count?: unknown;
    forks_count?: unknown;
    watchers_count?: unknown;
    open_issues_count?: unknown;
    archived?: unknown;
    updated_at?: unknown;
    pushed_at?: unknown;
    license?: { spdx_id?: unknown; name?: unknown } | null;
    default_branch?: unknown;
}): SkillSourceMetadata {
    const spdx = typeof repoData.license?.spdx_id === 'string' ? repoData.license.spdx_id : '';
    const licenseName = typeof repoData.license?.name === 'string' ? repoData.license.name : '';

    return {
        stargazersCount: toOptionalNumber(repoData.stargazers_count),
        forksCount: toOptionalNumber(repoData.forks_count),
        watchersCount: toOptionalNumber(repoData.watchers_count),
        openIssuesCount: toOptionalNumber(repoData.open_issues_count),
        archived: typeof repoData.archived === 'boolean' ? repoData.archived : false,
        updatedAt: typeof repoData.updated_at === 'string' ? repoData.updated_at : undefined,
        pushedAt: typeof repoData.pushed_at === 'string' ? repoData.pushed_at : undefined,
        license: spdx || licenseName || undefined,
        defaultBranch: typeof repoData.default_branch === 'string' ? repoData.default_branch : undefined
    };
}

export const RepoImporterModal: React.FC<RepoImporterModalProps> = ({ onClose }) => {
    const { addCustomDiscoverSkills, addToast, addAuditEvent, setValidationSummary } = useSkillStore();
    const [repoInput, setRepoInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'fetching' | 'analyzing' | 'done'>('idle');
    const [progress, setProgress] = useState({ text: '', percentage: 0 });
    const abortControllerRef = useRef<AbortController | null>(null);
    const closeTimerRef = useRef<number | null>(null);
    const importRunIdRef = useRef(0);
    const importTraceIdRef = useRef<string | null>(null);
    const dialogTitleId = useId();
    const repoInputId = useId();

    const parsedRepo = useMemo(() => parseGitHubInput(repoInput), [repoInput]);

    const clearCloseTimer = useCallback(() => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    const abortActiveImport = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        clearCloseTimer();
    }, [clearCloseTimer]);

    const handleModalClose = useCallback(() => {
        importRunIdRef.current += 1;
        abortActiveImport();
        onClose();
    }, [abortActiveImport, onClose]);

    const handleCancelImport = () => {
        if (status === 'idle' || status === 'done') return;
        importRunIdRef.current += 1;
        abortActiveImport();
        const traceId = importTraceIdRef.current || createTraceId();
        setStatus('idle');
        setProgress({ text: 'Import cancelled by user.', percentage: 0 });
        addToast('Import cancelled.', 'info');
        addAuditEvent({
            traceId,
            eventType: 'import-repo',
            status: 'cancelled',
            target: parsedRepo ? `${parsedRepo.owner}/${parsedRepo.repo}` : 'repo-import',
            message: 'Repository import cancelled by user.'
        });
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleModalClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            importRunIdRef.current += 1;
            document.removeEventListener('keydown', handleKeyDown);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        };
    }, [handleModalClose]);

    const handleImport = async () => {
        if (!parsedRepo) {
            addToast('Please enter a valid GitHub repository.', 'error');
            return;
        }
        const traceId = createTraceId();
        importTraceIdRef.current = traceId;
        addAuditEvent({
            traceId,
            eventType: 'import-repo',
            status: 'started',
            target: `${parsedRepo.owner}/${parsedRepo.repo}`,
            message: 'Started repository import.'
        });

        importRunIdRef.current += 1;
        const runId = importRunIdRef.current;
        const isCurrentRun = () => importRunIdRef.current === runId;

        abortActiveImport();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;
        const signal = abortController.signal;

        setStatus('fetching');
        setProgress({
            text: `Reading repository metadata for ${parsedRepo.owner}/${parsedRepo.repo}...`,
            percentage: 10
        });

        try {
            const repoResponse = await fetchWithRetry(
                `https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}`,
                signal
            );
            if (!repoResponse.ok) {
                throw new Error(`Repository not found or API rate limited (HTTP ${repoResponse.status}).`);
            }
            const repoData = await repoResponse.json() as {
                default_branch?: string;
                stargazers_count?: number;
                forks_count?: number;
                watchers_count?: number;
                open_issues_count?: number;
                archived?: boolean;
                updated_at?: string;
                pushed_at?: string;
                license?: { spdx_id?: string; name?: string } | null;
            };
            const defaultBranch = repoData.default_branch || 'main';
            const sourceMetadata = buildRepoSourceMetadata(repoData);

            const treeResponse = await fetchWithRetry(
                `https://api.github.com/repos/${parsedRepo.owner}/${parsedRepo.repo}/git/trees/${defaultBranch}?recursive=1`,
                signal
            );
            if (!treeResponse.ok) {
                throw new Error(`Failed to fetch repository tree (HTTP ${treeResponse.status}).`);
            }
            const treeData = await treeResponse.json() as { tree?: unknown };
            const treeNodes = Array.isArray(treeData.tree) ? (treeData.tree as GitTreeNode[]) : [];
            const candidates = pickCandidateFiles(treeNodes);

            if (!isCurrentRun()) return;

            if (candidates.length === 0) {
                addToast('No candidate skill markdown files found in this repository.', 'error');
                setStatus('idle');
                addAuditEvent({
                    traceId,
                    eventType: 'import-repo',
                    status: 'failed',
                    target: `${parsedRepo.owner}/${parsedRepo.repo}`,
                    reasonCode: 'NO_CANDIDATES',
                    message: 'No candidate markdown files were found for import.'
                });
                return;
            }

            setStatus('analyzing');
            const candidateResults: Array<{
                filePath: string;
                rawUrl: string;
                content: string;
                fallbackName: string;
                parsed: Skill | null;
            } | null> = new Array(candidates.length).fill(null);

            let nextIndex = 0;
            let processedCount = 0;
            const workerCount = Math.min(IMPORT_CONCURRENCY, candidates.length);

            const worker = async () => {
                while (true) {
                    if (signal.aborted) throw createAbortError();

                    const index = nextIndex;
                    nextIndex += 1;
                    if (index >= candidates.length) return;

                    const candidate = candidates[index];
                    const filePath = candidate.path;
                    const rawUrl =
                        `https://raw.githubusercontent.com/${parsedRepo.owner}/${parsedRepo.repo}/${defaultBranch}/${filePath}`;

                    try {
                        const rawResponse = await fetchWithRetry(rawUrl, signal);
                        if (rawResponse.ok) {
                            const content = await rawResponse.text();
                            const fallbackName =
                                filePath.split('/').at(-2) ||
                                filePath.split('/').at(-1)?.replace(/\.md$/i, '') ||
                                'skill';
                            const parsed = parseSkillContent(fallbackName, content);
                            candidateResults[index] = { filePath, rawUrl, content, fallbackName, parsed };
                        }
                    } catch (error: unknown) {
                        if (isAbortError(error)) throw error;
                        console.warn(`Failed to import candidate ${filePath}:`, error);
                    } finally {
                        processedCount += 1;
                        if (isCurrentRun() && !signal.aborted) {
                            setProgress({
                                text: `Analyzed ${processedCount}/${candidates.length}: ${filePath}`,
                                percentage: 25 + Math.round((processedCount / Math.max(1, candidates.length)) * 70)
                            });
                        }
                    }
                }
            };

            await Promise.all(Array.from({ length: workerCount }, () => worker()));
            if (!isCurrentRun()) return;

            const parsedSkills: Skill[] = [];
            const seenNames = new Set<string>();
            let invalidCount = 0;
            let blockedCount = 0;
            let warningCount = 0;

            for (let index = 0; index < candidateResults.length; index++) {
                const result = candidateResults[index];
                if (!result) continue;

                const finalName = result.parsed?.name || result.fallbackName;
                const dedupeKey = normalizeName(finalName);
                if (seenNames.has(dedupeKey)) continue;
                seenNames.add(dedupeKey);

                const candidateSkill: Skill = {
                    id: `custom-${parsedRepo.owner}-${parsedRepo.repo}-${index}`,
                    name: finalName,
                    description:
                        result.parsed?.description || extractFirstParagraph(result.parsed?.instructions || result.content),
                    author: result.parsed?.author || parsedRepo.owner,
                    tags: result.parsed?.tags?.length ? result.parsed.tags : ['github', 'imported'],
                    disableModelInvocation: result.parsed?.disableModelInvocation || false,
                    userInvocable: result.parsed?.userInvocable ?? true,
                    allowedTools: result.parsed?.allowedTools || [],
                    context: result.parsed?.context || 'none',
                    agent: result.parsed?.agent || '',
                    instructions: result.parsed?.instructions || result.content.trim(),
                    attachments: undefined,
                    source: {
                        kind: 'repo',
                        repo: `${parsedRepo.owner}/${parsedRepo.repo}`,
                        path: result.filePath,
                        url: result.rawUrl,
                        metadata: sourceMetadata
                    },
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                const validation = validateSkillDraft(candidateSkill);
                if (!validation.isValid) {
                    invalidCount += 1;
                    continue;
                }
                if (validation.warnings.length > 0) {
                    warningCount += validation.warnings.length;
                }

                const compliance = evaluateSkillCompliance({
                    skill: candidateSkill,
                    action: 'import'
                });
                if (compliance.decision === 'deny') {
                    blockedCount += 1;
                    continue;
                }

                parsedSkills.push(candidateSkill);
            }

            setValidationSummary({
                checkedAt: Date.now(),
                validCount: parsedSkills.length,
                invalidCount,
                warningCount
            });

            if (parsedSkills.length === 0) {
                addToast('No valid skills parsed from this repository.', 'error');
                setStatus('idle');
                addAuditEvent({
                    traceId,
                    eventType: 'import-repo',
                    status: 'failed',
                    target: `${parsedRepo.owner}/${parsedRepo.repo}`,
                    reasonCode: 'NO_VALID_SKILLS',
                    message: 'No skills passed validation/compliance checks.',
                    metadata: { invalidCount, blockedCount, warningCount }
                });
                return;
            }

            addCustomDiscoverSkills(parsedSkills);
            setStatus('done');
            setProgress({
                text: `Imported ${parsedSkills.length} skill(s) from ${parsedRepo.owner}/${parsedRepo.repo}.`,
                percentage: 100
            });
            addToast(`Imported ${parsedSkills.length} skill(s) successfully.`, 'success');
            if (invalidCount > 0 || blockedCount > 0) {
                addToast(`Skipped ${invalidCount} invalid and ${blockedCount} blocked skill(s).`, 'info');
            }
            addAuditEvent({
                traceId,
                eventType: 'import-repo',
                status: 'success',
                target: `${parsedRepo.owner}/${parsedRepo.repo}`,
                message: `Imported ${parsedSkills.length} skill(s).`,
                metadata: {
                    imported: parsedSkills.length,
                    invalidCount,
                    blockedCount,
                    warningCount
                }
            });

            clearCloseTimer();
            closeTimerRef.current = window.setTimeout(() => {
                if (!isCurrentRun()) return;
                handleModalClose();
            }, 1600);
        } catch (error: unknown) {
            if (!isCurrentRun()) return;
            if (isAbortError(error)) return;
            console.error(error);
            addToast(getErrorMessage(error), 'error');
            setStatus('idle');
            addAuditEvent({
                traceId,
                eventType: 'import-repo',
                status: 'failed',
                target: `${parsedRepo.owner}/${parsedRepo.repo}`,
                reasonCode: 'IMPORT_EXCEPTION',
                message: getErrorMessage(error)
            });
        } finally {
            if (abortControllerRef.current === abortController) {
                abortControllerRef.current = null;
            }
            if (importTraceIdRef.current === traceId) {
                importTraceIdRef.current = null;
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <button
                type="button"
                aria-label="Close import modal"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleModalClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={dialogTitleId}
                className="themed-panel w-full max-w-xl relative z-10 animate-in zoom-in-95 duration-300 p-8 pt-10 overflow-hidden"
            >
                <button
                    onClick={handleModalClose}
                    aria-label="Close import modal"
                    className="absolute top-4 right-4 ui-icon-btn text-text-muted hover:text-text-main hover:bg-white/5"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-brand/10 text-brand rounded-2xl border border-brand/20">
                        <Github className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 id={dialogTitleId} className="text-2xl font-black text-text-main">Import from GitHub</h2>
                        <p className="text-sm text-text-muted mt-1">
                            Supports full URL, <code>owner/repo</code>, and <code>skild install owner/repo</code>.
                        </p>
                    </div>
                </div>

                <div className="mt-8 space-y-4">
                    <div className="space-y-2">
                        <label htmlFor={repoInputId} className="ui-kicker">
                            Repository input
                        </label>
                        <div className="relative">
                            <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                id={repoInputId}
                                type="text"
                                value={repoInput}
                                onChange={(event) => setRepoInput(event.target.value)}
                                placeholder="owner/repo or https://github.com/owner/repo"
                                disabled={status !== 'idle'}
                                className="w-full ui-input pl-12 pr-4 py-4"
                                autoFocus
                            />
                        </div>
                        {parsedRepo && (
                            <p className="ui-caption">
                                Resolved to: <span className="font-mono">{parsedRepo.owner}/{parsedRepo.repo}</span>
                            </p>
                        )}
                    </div>

                    {status === 'idle' ? (
                        <button
                            onClick={handleImport}
                            disabled={!parsedRepo}
                            className="ui-btn-primary w-full mt-4 py-4"
                        >
                            <Download className="w-5 h-5" />
                            Fetch and parse skills
                        </button>
                    ) : (
                        <div
                            role="status"
                            aria-live="polite"
                            className="mt-4 p-4 bg-bg-action rounded-[var(--radius-base)] border border-border-main space-y-4 relative overflow-hidden"
                        >
                            <div
                                className="absolute inset-0 bg-brand/10 transition-all duration-300 ease-out z-0"
                                style={{ width: `${progress.percentage}%` }}
                            />

                            <div className="relative z-10 flex items-center justify-between">
                                <span
                                    className={cn(
                                        'flex items-center gap-2 font-bold text-sm',
                                        status === 'done' ? 'text-green-400' : 'text-brand'
                                    )}
                                >
                                    {status === 'done' ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    )}
                                    {status === 'fetching'
                                        ? 'Connecting to GitHub API...'
                                        : status === 'analyzing'
                                            ? 'Analyzing markdown files...'
                                            : 'Import completed'}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-text-muted">{Math.round(progress.percentage)}%</span>
                                    {status !== 'done' && (
                                        <button
                                            onClick={handleCancelImport}
                                            className="ui-btn-secondary px-3 py-1.5 text-xs"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-text-muted relative z-10 font-mono">&gt; {progress.text}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
