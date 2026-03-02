import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Bot,
    Clock,
    Code2,
    Compass,
    Download,
    Edit,
    FileCode,
    FolderDown,
    FolderSymlink,
    Github,
    HardDrive,
    Hash,
    Plus,
    PlusCircle,
    RefreshCw,
    Search,
    ShieldAlert,
    Terminal,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useSkillStore, type Skill } from '../store';
import { findAndImportSkills, installSkillToProject, writeSkillToDisk } from '../lib/fsCore';
import { evaluateSkillCompliance } from '../lib/compliancePolicy';
import { summarizeValidation, validateSkillDraft } from '../lib/skillValidator';
import { createTraceId } from '../lib/auditLog';
import { buildSkillIndex, filterSkillIndexBySource, searchSkillIndex } from '../lib/skillIndex';
import {
    getInstallDotDirs,
    type SkillInstallTarget,
    SKILL_INSTALL_TARGETS
} from '../lib/skillTargets';
import { RepoImporterModal } from '../components/RepoImporterModal';

function getSecurityBadge(skill: Skill): {
    text: string;
    className: string;
} | null {
    if (!skill.security) return null;

    if (skill.security.hardTriggered) {
        return {
            text: `Blocked (${skill.security.score})`,
            className: 'ui-badge-danger'
        };
    }

    if (skill.security.score < 70) {
        return {
            text: `Warning (${skill.security.score})`,
            className: 'ui-badge-warning'
        };
    }

    if (skill.security.score < 90) {
        return {
            text: `Review (${skill.security.score})`,
            className: 'ui-badge-attention'
        };
    }

    return {
        text: `Safe (${skill.security.score})`,
        className: 'ui-badge-success'
    };
}

function renderTargetIcon(target: SkillInstallTarget) {
    if (target === 'cursor' || target === 'vscode' || target === 'codex') return <Code2 className="w-3.5 h-3.5" />;
    if (target === 'windsurf' || target === 'gemini' || target === 'goose') return <Bot className="w-3.5 h-3.5" />;
    if (target === 'claude' || target === 'generic') return <FileCode className="w-3.5 h-3.5" />;
    if (target === 'sync-major') return <RefreshCw className="w-3.5 h-3.5" />;
    return <Terminal className="w-3.5 h-3.5" />;
}

type PickerWindow = Window &
    typeof globalThis & {
        showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
    };

function isAbortError(error: unknown): boolean {
    return error instanceof DOMException && error.name === 'AbortError';
}

function sanitizeScriptFileName(value: string, fallback = 'skill'): string {
    const withoutControlChars = Array.from(value)
        .filter((char) => {
            const code = char.charCodeAt(0);
            return code >= 32 && code !== 127;
        })
        .join('');

    const sanitized = withoutControlChars
        .trim()
        .replace(/[<>:"/\\|?*]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^\.+|\.+$/g, '')
        .replace(/^-+|-+$/g, '');

    return sanitized || fallback;
}

function createSafeHeredocDelimiter(content: string): string {
    let delimiter = `SKILL_EOF_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    while (content.includes(delimiter)) {
        delimiter = `SKILL_EOF_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    }
    return delimiter;
}

export const Library: React.FC = () => {
    const {
        skills,
        awesomeSkills,
        customDiscoverSkills,
        skillIndexCache,
        isFetchingAwesome,
        fetchAwesomeSkills,
        addSkill,
        deleteSkill,
        dirHandle,
        syncFromLocal,
        isSyncing,
        addToast,
        addAuditEvent,
        setValidationSummary
    } = useSkillStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'local' | 'discover'>('local');
    const [isImporterOpen, setIsImporterOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [currentTime] = useState(() => Date.now());
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (activeTab === 'discover' && awesomeSkills.length === 0) {
            fetchAwesomeSkills();
        }
    }, [activeTab, awesomeSkills.length, fetchAwesomeSkills]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setActiveDropdown(null);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const indexedSkills = useMemo(() => {
        if (skillIndexCache.length > 0) return skillIndexCache;
        return buildSkillIndex({
            localSkills: skills,
            marketSkills: awesomeSkills,
            repoSkills: customDiscoverSkills
        });
    }, [skillIndexCache, skills, awesomeSkills, customDiscoverSkills]);

    const filteredSkills = useMemo(() => {
        const scopedEntries = activeTab === 'local'
            ? filterSkillIndexBySource(indexedSkills, 'local')
            : indexedSkills.filter((entry) => entry.sourceMeta.sourceType !== 'local');
        return searchSkillIndex(scopedEntries, searchTerm).map((entry) => entry.skill);
    }, [indexedSkills, activeTab, searchTerm]);

    const handleImportLocal = async () => {
        const traceId = createTraceId();
        addAuditEvent({
            traceId,
            eventType: 'import-local',
            status: 'started',
            target: 'local-directory',
            message: 'Started local directory import.'
        });
        try {
            const picker = (window as PickerWindow).showDirectoryPicker;
            if (!picker) {
                addToast('Directory picker is not supported in this browser.', 'error');
                addAuditEvent({
                    traceId,
                    eventType: 'import-local',
                    status: 'failed',
                    target: 'local-directory',
                    reasonCode: 'PICKER_UNSUPPORTED',
                    message: 'Directory picker API is not available.'
                });
                return;
            }

            const handle = await picker({ mode: 'read' });
            const importedSkills = await findAndImportSkills(handle);

            if (importedSkills.length === 0) {
                addToast('No SKILL.md files found in that directory.', 'info');
                addAuditEvent({
                    traceId,
                    eventType: 'import-local',
                    status: 'failed',
                    target: handle.name,
                    reasonCode: 'NO_SKILL_FILE',
                    message: 'No importable SKILL.md files found.'
                });
                return;
            }

            let addedCount = 0;
            let blockedCount = 0;
            let invalidCount = 0;
            for (const importedSkill of importedSkills) {
                const validation = validateSkillDraft(importedSkill);
                if (!validation.isValid) {
                    invalidCount += 1;
                    continue;
                }
                const decision = evaluateSkillCompliance({
                    skill: importedSkill,
                    action: 'import'
                });
                if (decision.decision === 'deny') {
                    blockedCount += 1;
                    continue;
                }

                if (!skills.some((skill) => skill.name === importedSkill.name)) {
                    addSkill({
                        name: importedSkill.name,
                        description: importedSkill.description,
                        author: importedSkill.author,
                        tags: importedSkill.tags || [],
                        disableModelInvocation: importedSkill.disableModelInvocation,
                        userInvocable: importedSkill.userInvocable,
                        allowedTools: importedSkill.allowedTools || [],
                        context: importedSkill.context || 'none',
                        agent: importedSkill.agent,
                        instructions: importedSkill.instructions,
                        attachments: importedSkill.attachments,
                        source: {
                            kind: 'local'
                        }
                    });
                    addedCount++;
                }
            }

            setValidationSummary({
                checkedAt: Date.now(),
                validCount: addedCount,
                invalidCount,
                warningCount: 0
            });

            if (addedCount > 0) {
                addToast(`Imported ${addedCount} new skills.`, 'success');
            } else {
                addToast('All detected skills are already in your library.', 'info');
            }

            if (invalidCount > 0 || blockedCount > 0) {
                addToast(`Skipped ${invalidCount} invalid and ${blockedCount} blocked skill(s).`, 'info');
            }

            addAuditEvent({
                traceId,
                eventType: 'import-local',
                status: 'success',
                target: handle.name,
                message: `Local import completed. Added ${addedCount}, invalid ${invalidCount}, blocked ${blockedCount}.`,
                metadata: {
                    addedCount,
                    invalidCount,
                    blockedCount,
                    total: importedSkills.length
                }
            });
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                console.error(error);
                addToast('Failed to import local skills.', 'error');
                addAuditEvent({
                    traceId,
                    eventType: 'import-local',
                    status: 'failed',
                    target: 'local-directory',
                    reasonCode: 'IMPORT_EXCEPTION',
                    message: `Local import failed: ${String(error)}`
                });
            } else {
                addAuditEvent({
                    traceId,
                    eventType: 'import-local',
                    status: 'cancelled',
                    target: 'local-directory',
                    message: 'Local import cancelled by user.'
                });
            }
        }
    };

    const handleExportToProject = async (skill: Skill, ideTarget: SkillInstallTarget) => {
        const traceId = createTraceId();
        addAuditEvent({
            traceId,
            eventType: 'install-project',
            status: 'started',
            target: `${skill.name} -> ${ideTarget}`,
            message: 'Started install to project directory.'
        });

        const validation = validateSkillDraft(skill);
        if (!validation.isValid) {
            setValidationSummary(summarizeValidation(validation));
            addToast(`"${skill.name}" failed validation and cannot be installed.`, 'error');
            addAuditEvent({
                traceId,
                eventType: 'install-project',
                status: 'failed',
                target: `${skill.name} -> ${ideTarget}`,
                reasonCode: validation.errors[0]?.code || 'VALIDATION_FAILED',
                message: 'Install blocked by validation failure.'
            });
            return;
        }

        const compliance = evaluateSkillCompliance({ skill, action: 'install' });
        if (compliance.decision === 'deny') {
            addToast(compliance.message, 'error');
            addAuditEvent({
                traceId,
                eventType: 'install-project',
                status: 'blocked',
                target: `${skill.name} -> ${ideTarget}`,
                reasonCode: compliance.reasonCode,
                message: compliance.message
            });
            return;
        }

        try {
            const picker = (window as PickerWindow).showDirectoryPicker;
            if (!picker) {
                addToast('Directory picker is not supported in this browser.', 'error');
                addAuditEvent({
                    traceId,
                    eventType: 'install-project',
                    status: 'failed',
                    target: `${skill.name} -> ${ideTarget}`,
                    reasonCode: 'PICKER_UNSUPPORTED',
                    message: 'Directory picker API is not available.'
                });
                return;
            }

            const handle = await picker({ mode: 'readwrite' });
            await installSkillToProject(handle, skill, ideTarget);
            const targetDirs = getInstallDotDirs(ideTarget).map((dir) => `${dir}/skills`).join(', ');
            addToast(`Installed "${skill.name}" to ${targetDirs}.`, 'success');
            addAuditEvent({
                traceId,
                eventType: 'install-project',
                status: 'success',
                target: `${skill.name} -> ${ideTarget}`,
                message: `Installed to ${targetDirs}.`,
                metadata: { targetDirs }
            });
            setActiveDropdown(null);
        } catch (error: unknown) {
            if (!isAbortError(error)) {
                console.error(error);
                addToast('Installation failed. Check directory permission and try again.', 'error');
                addAuditEvent({
                    traceId,
                    eventType: 'install-project',
                    status: 'failed',
                    target: `${skill.name} -> ${ideTarget}`,
                    reasonCode: 'INSTALL_EXCEPTION',
                    message: `Install failed: ${String(error)}`
                });
            } else {
                addAuditEvent({
                    traceId,
                    eventType: 'install-project',
                    status: 'cancelled',
                    target: `${skill.name} -> ${ideTarget}`,
                    message: 'Install cancelled by user.'
                });
            }
        }
    };

    const handleExportScript = async (skill: Skill) => {
        const traceId = createTraceId();
        addAuditEvent({
            traceId,
            eventType: 'export-script',
            status: 'started',
            target: skill.name,
            message: 'Started export flow.'
        });

        const validation = validateSkillDraft(skill);
        setValidationSummary(summarizeValidation(validation));
        if (!validation.isValid) {
            addToast(`"${skill.name}" failed validation and cannot be exported.`, 'error');
            addAuditEvent({
                traceId,
                eventType: 'export-script',
                status: 'failed',
                target: skill.name,
                reasonCode: validation.errors[0]?.code || 'VALIDATION_FAILED',
                message: 'Export blocked by validation.'
            });
            return;
        }

        const compliance = evaluateSkillCompliance({ skill, action: 'export' });
        if (compliance.decision === 'deny') {
            addToast(compliance.message, 'error');
            addAuditEvent({
                traceId,
                eventType: 'export-script',
                status: 'blocked',
                target: skill.name,
                reasonCode: compliance.reasonCode,
                message: compliance.message
            });
            return;
        }

        if (dirHandle) {
            try {
                await writeSkillToDisk(dirHandle, skill);
                addToast(`Saved "${skill.name}" to linked local directory.`, 'success');
                addAuditEvent({
                    traceId,
                    eventType: 'export-script',
                    status: 'success',
                    target: skill.name,
                    message: 'Saved skill directly to linked directory.'
                });
                return;
            } catch (error) {
                console.error(error);
                addToast('Direct write failed, fallback script downloaded.', 'error');
                addAuditEvent({
                    traceId,
                    eventType: 'export-script',
                    status: 'failed',
                    target: skill.name,
                    reasonCode: 'DIRECT_WRITE_FAILED',
                    message: `Direct write failed: ${String(error)}`
                });
            }
        }

        const frontmatterLines = [
            '---',
            `name: ${skill.name}`,
            skill.description ? `description: ${skill.description}` : '',
            skill.author ? `author: ${skill.author}` : '',
            skill.disableModelInvocation ? 'disable-model-invocation: true' : '',
            skill.userInvocable === false ? 'user-invocable: false' : '',
            skill.allowedTools.length > 0 ? `allowed-tools: ${skill.allowedTools.join(', ')}` : '',
            skill.tags.length > 0 ? `tags: ${skill.tags.join(', ')}` : '',
            skill.context && skill.context !== 'none' ? `context: ${skill.context}` : '',
            skill.agent ? `agent: ${skill.agent}` : '',
            '---',
            '',
            skill.instructions
        ].filter(Boolean);

        const fullContent = frontmatterLines.join('\n');
        const safeSkillFolder = sanitizeScriptFileName(skill.name);
        const heredocDelimiter = createSafeHeredocDelimiter(fullContent);
        const scriptContent = `#!/usr/bin/env bash
set -euo pipefail
TARGET_DIR="$HOME/.claude/skills/${safeSkillFolder}"
mkdir -p "$TARGET_DIR"
cat << '${heredocDelimiter}' > "$TARGET_DIR/SKILL.md"
${fullContent}
${heredocDelimiter}
echo "Installed ${safeSkillFolder} into $TARGET_DIR"
`;

        const blob = new Blob([scriptContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `install-${safeSkillFolder}.sh`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        addAuditEvent({
            traceId,
            eventType: 'export-script',
            status: 'success',
            target: skill.name,
            message: `Exported fallback script: install-${safeSkillFolder}.sh`
        });
    };

    const handleInstallDiscoverSkill = async (skill: Skill) => {
        const traceId = createTraceId();
        addAuditEvent({
            traceId,
            eventType: 'install-library',
            status: 'started',
            target: skill.name,
            message: 'Started install from discover feed.'
        });

        if (skills.some((existingSkill) => existingSkill.name === skill.name)) {
            addToast(`${skill.name} is already installed.`, 'info');
            addAuditEvent({
                traceId,
                eventType: 'install-library',
                status: 'failed',
                target: skill.name,
                reasonCode: 'ALREADY_INSTALLED',
                message: 'Skipped because skill already exists.'
            });
            return;
        }

        if (skill.security?.hardTriggered) {
            addToast(`"${skill.name}" is blocked by security scan.`, 'error');
            addAuditEvent({
                traceId,
                eventType: 'install-library',
                status: 'blocked',
                target: skill.name,
                reasonCode: 'SKILL_SECURITY_HARD_BLOCK',
                message: 'Blocked by security scan hard trigger.'
            });
            return;
        }

        const validation = validateSkillDraft(skill);
        setValidationSummary(summarizeValidation(validation));
        if (!validation.isValid) {
            addToast(`"${skill.name}" failed validation and cannot be installed.`, 'error');
            addAuditEvent({
                traceId,
                eventType: 'install-library',
                status: 'failed',
                target: skill.name,
                reasonCode: validation.errors[0]?.code || 'VALIDATION_FAILED',
                message: 'Validation failed for discover install.'
            });
            return;
        }

        const compliance = evaluateSkillCompliance({ skill, action: 'install' });
        if (compliance.decision === 'deny') {
            addToast(compliance.message, 'error');
            addAuditEvent({
                traceId,
                eventType: 'install-library',
                status: 'blocked',
                target: skill.name,
                reasonCode: compliance.reasonCode,
                message: compliance.message
            });
            return;
        }

        addSkill({
            name: skill.name,
            description: skill.description,
            author: skill.author,
            tags: skill.tags || [],
            disableModelInvocation: skill.disableModelInvocation,
            userInvocable: skill.userInvocable,
            allowedTools: skill.allowedTools || [],
            context: skill.context || 'none',
            agent: skill.agent,
            instructions: skill.instructions,
            attachments: skill.attachments,
            source: skill.source || { kind: 'market' }
        });

        if (dirHandle) {
            try {
                await writeSkillToDisk(dirHandle, skill);
            } catch (error) {
                // Ignore and keep UX smooth.
                addAuditEvent({
                    traceId,
                    eventType: 'install-library',
                    status: 'failed',
                    target: skill.name,
                    reasonCode: 'WRITE_TO_LINKED_DIR_FAILED',
                    message: `Installed in library but failed linked-disk write: ${String(error)}`
                });
            }
        }

        addToast(`Installed ${skill.name}.`, 'success');
        addAuditEvent({
            traceId,
            eventType: 'install-library',
            status: 'success',
            target: skill.name,
            message: 'Installed skill from discover feed.'
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-text-main mb-2">Skill Library</h2>
                    <p className="text-text-muted">Discover, review, and deploy skills with security visibility.</p>
                </div>
                <div className="flex items-center gap-3">
                    {dirHandle && (
                        <button
                            onClick={syncFromLocal}
                            disabled={isSyncing}
                            className="flex items-center gap-2 bg-black/40 border border-green-500/20 text-green-400 hover:bg-green-500/10 px-4 py-2.5 rounded-[var(--radius-button)] transition-all active:scale-95 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync local
                        </button>
                    )}
                    <button
                        onClick={handleImportLocal}
                        className="hidden md:inline-flex ui-btn-secondary whitespace-nowrap"
                    >
                        <FolderDown className="w-4 h-4" />
                        Import local
                    </button>
                    <button
                        onClick={() => navigate('/editor')}
                        className="ui-btn-primary text-white whitespace-nowrap px-5"
                    >
                        <Plus className="w-5 h-5" />
                        New skill
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b border-border-main pb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)] font-bold transition-all ${
                            activeTab === 'local'
                                ? 'bg-brand/10 text-brand'
                                : 'text-text-muted hover:bg-bg-action hover:text-text-main'
                        }`}
                    >
                        <HardDrive className="w-4 h-4" />
                        Local ({activeTab === 'local' ? filteredSkills.length : skills.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius-button)] font-bold transition-all ${
                            activeTab === 'discover'
                                ? 'bg-brand/10 text-brand'
                                : 'text-text-muted hover:bg-bg-action hover:text-text-main'
                        }`}
                    >
                        <Compass className="w-4 h-4" />
                        Discover ({activeTab === 'discover' ? filteredSkills.length : awesomeSkills.length + customDiscoverSkills.length})
                    </button>
                </div>

                {activeTab === 'discover' && (
                    <button
                        onClick={() => setIsImporterOpen(true)}
                        className="ui-btn-secondary text-sm py-2"
                    >
                        <Github className="w-4 h-4" />
                        Add GitHub repo
                    </button>
                )}
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-slate-500 group-focus-within:text-brand transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name, description, author, or tag..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full themed-input pl-12 pr-4 py-4 focus:ring-4 focus:ring-brand/10 placeholder:text-text-muted"
                />
            </div>

            {activeTab === 'discover' && isFetchingAwesome ? (
                <div className="themed-panel h-64 flex flex-col items-center justify-center border-dashed">
                    <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin mb-4" />
                    <p className="text-text-muted text-lg tracking-widest font-mono">Loading discover feeds...</p>
                </div>
            ) : filteredSkills.length === 0 ? (
                <div className="themed-panel h-64 flex flex-col items-center justify-center border-dashed">
                    <p className="text-text-muted text-lg mb-4">No skills found.</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-brand hover:text-text-main transition-colors underline underline-offset-4"
                    >
                        Clear search
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSkills.map((skill) => {
                        const securityBadge = getSecurityBadge(skill);
                        const isInstalled = skills.some((installedSkill) => installedSkill.name === skill.name);
                        const isBlocked = Boolean(skill.security?.hardTriggered);

                        return (
                            <div
                                key={skill.id}
                                className="themed-panel p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <h3 className="text-xl font-bold text-text-main line-clamp-1 flex-1 pr-2">{skill.name}</h3>
                                    {activeTab === 'local' && currentTime - skill.createdAt < 24 * 60 * 60 * 1000 && (
                                        <span className="bg-brand text-text-main text-xs font-black px-1.5 py-0.5 rounded-full mr-2 animate-pulse uppercase tracking-tighter">
                                            New
                                        </span>
                                    )}

                                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {activeTab === 'local' ? (
                                            <>
                                                <div className="relative">
                                                    <button
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            setActiveDropdown(activeDropdown === skill.id ? null : skill.id);
                                                        }}
                                                        aria-haspopup="menu"
                                                        aria-expanded={activeDropdown === skill.id}
                                                        aria-controls={`install-menu-${skill.id}`}
                                                        title="Install to project"
                                                        className="ui-icon-btn text-text-muted hover:text-blue-400 bg-bg-base hover:bg-blue-400/10"
                                                    >
                                                        <FolderSymlink className="w-4 h-4" />
                                                    </button>
                                                    {activeDropdown === skill.id && (
                                                        <div
                                                            ref={dropdownRef}
                                                            id={`install-menu-${skill.id}`}
                                                            role="menu"
                                                            aria-label={`Install ${skill.name} to target`}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Escape') {
                                                                    event.preventDefault();
                                                                    setActiveDropdown(null);
                                                                }
                                                            }}
                                                            className="absolute right-0 top-full mt-2 w-60 bg-bg-panel border border-border-main rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                                        >
                                                            <div className="px-3 py-2 border-b border-border-main ui-kicker">
                                                                Install target
                                                            </div>
                                                            <div className="py-1 max-h-64 overflow-y-auto custom-scrollbar">
                                                                {SKILL_INSTALL_TARGETS.map((target) => (
                                                                    <button
                                                                        key={target.id}
                                                                        role="menuitem"
                                                                        onClick={() => handleExportToProject(skill, target.id)}
                                                                        className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-brand/10 hover:text-brand flex items-center gap-2 transition-colors"
                                                                    >
                                                                        {renderTargetIcon(target.id)}
                                                                        <span className="line-clamp-1">{target.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleExportScript(skill)}
                                                    title="Export install script"
                                                    className="ui-icon-btn text-text-muted hover:text-green-400 bg-bg-base hover:bg-green-400/10"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/editor?id=${skill.id}`)}
                                                    title="Edit"
                                                    className="ui-icon-btn text-text-muted hover:text-brand bg-bg-base hover:bg-brand/10"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteSkill(skill.id)}
                                                    title="Delete"
                                                    className="ui-icon-btn text-text-muted hover:text-red-400 bg-bg-base hover:bg-red-400/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleInstallDiscoverSkill(skill)}
                                                disabled={isInstalled || isBlocked}
                                                title={isBlocked ? 'Blocked by security policy' : 'Install into local library'}
                                                className="ui-btn-primary text-bg-base px-3 py-1.5 text-xs"
                                            >
                                                {isInstalled ? (
                                                    'Installed'
                                                ) : isBlocked ? (
                                                    'Blocked'
                                                ) : (
                                                    <>
                                                        <PlusCircle className="w-3.5 h-3.5" />
                                                        Install
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="text-text-muted text-sm leading-relaxed mb-6 line-clamp-3 flex-1 relative z-10">
                                    {skill.description || 'No description.'}
                                </p>

                                <div className="mt-auto space-y-3 relative z-10 border-t border-border-main pt-4">
                                    {(securityBadge || skill.allowedTools?.length > 0 || skill.context === 'fork') && (
                                        <div className="flex flex-wrap gap-2">
                                            {securityBadge && (
                                                <span
                                                    className={`ui-badge ${securityBadge.className}`}
                                                >
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {securityBadge.text}
                                                </span>
                                            )}
                                            {skill.context === 'fork' && (
                                                <span className="ui-badge ui-badge-info">
                                                    <Bot className="w-3 h-3" />
                                                    Subagent: {skill.agent || 'Default'}
                                                </span>
                                            )}
                                            {skill.allowedTools?.slice(0, 2).map((tool) => (
                                                <span
                                                    key={tool}
                                                    className="ui-badge ui-badge-warning"
                                                >
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {tool}
                                                </span>
                                            ))}
                                            {(skill.allowedTools?.length || 0) > 2 && (
                                                <span className="ui-badge ui-badge-attention">
                                                    +{(skill.allowedTools?.length || 0) - 2} tools
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {skill.tags && skill.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {skill.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="ui-badge ui-badge-brand uppercase tracking-wider"
                                                >
                                                    <Hash className="w-3 h-3" />
                                                    {tag}
                                                </span>
                                            ))}
                                            {skill.tags.length > 3 && (
                                                <span className="ui-badge text-text-muted bg-bg-action border-border-main">
                                                    +{skill.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-text-muted">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {activeTab === 'local'
                                                ? formatDistanceToNow(skill.createdAt, { addSuffix: true })
                                                : 'Discover feed'}
                                        </span>
                                        <span className="font-medium text-text-muted line-clamp-1 text-right max-w-[50%]">
                                            {skill.author || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {isImporterOpen && <RepoImporterModal onClose={() => setIsImporterOpen(false)} />}
        </div>
    );
};

