import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Bot,
    Clock,
    Code2,
    Compass,
    Download,
    Edit,
    FileCode,
    GitFork,
    FolderDown,
    FolderSymlink,
    Github,
    HardDrive,
    Hash,
    Pin,
    PinOff,
    Plus,
    PlusCircle,
    RefreshCw,
    Scale,
    Search,
    ShieldAlert,
    Star,
    Terminal,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useSkillStore, type Skill } from '../store';
import { findAndImportSkills, installSkillToProject, writeSkillToDisk } from '../lib/fsCore';
import { evaluateSkillCompliance } from '../lib/compliancePolicy';
import { summarizeValidation, validateSkillDraft } from '../lib/skillValidator';
import { createTraceId } from '../lib/auditLog';
import { buildSkillIndex, filterSkillIndexBySource, searchSkillIndex } from '../lib/skillIndex';
import { evaluateSkillSourceTrust, getSkillSourceMetadata, getSourceLastUpdatedDays } from '../lib/sourceTrust';
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
            text: `已拦截 (${skill.security.score})`,
            className: 'ui-badge-danger'
        };
    }

    if (skill.security.score < 70) {
        return {
            text: `警告 (${skill.security.score})`,
            className: 'ui-badge-warning'
        };
    }

    if (skill.security.score < 90) {
        return {
            text: `复核 (${skill.security.score})`,
            className: 'ui-badge-attention'
        };
    }

    return {
        text: `安全 (${skill.security.score})`,
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

type DiscoverSortKey = 'relevance' | 'trust' | 'popular' | 'recent';

const TOOL_LABELS: Record<string, string> = {
    Bash: '命令行',
    Read: '读取',
    Grep: '检索',
    Glob: '全局匹配',
    Edit: '编辑',
    Write: '写入'
};

const DISCOVER_SORT_LABELS: Record<DiscoverSortKey, string> = {
    trust: '信任分数',
    popular: '最多星标',
    recent: '最近更新',
    relevance: '相关性'
};

const COMPACT_ZH_NUMBER_FORMATTER = new Intl.NumberFormat('zh-CN', {
    notation: 'compact',
    maximumFractionDigits: 1
});

function formatCompactCount(value: number | undefined): string {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '0';
    return COMPACT_ZH_NUMBER_FORMATTER.format(value);
}

function formatRelativeTime(date: Date | number | string): string {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

function getToolDisplayLabel(tool: string): string {
    return TOOL_LABELS[tool] || tool;
}

function getTimestamp(): number {
    return Date.now();
}

function getTrustBadgeClass(trust: ReturnType<typeof evaluateSkillSourceTrust>): string {
    if (trust.flags.archived) return 'ui-badge-danger';
    if (trust.level === 'high') return 'ui-badge-success';
    if (trust.level === 'medium') return 'ui-badge-attention';
    return 'ui-badge-warning';
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
        updateSkill,
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
    const [discoverSort, setDiscoverSort] = useState<DiscoverSortKey>('trust');
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

    const filteredEntries = useMemo(() => {
        const scopedEntries = activeTab === 'local'
            ? filterSkillIndexBySource(indexedSkills, 'local')
            : indexedSkills.filter((entry) => entry.sourceMeta.sourceType !== 'local');
        const searched = searchSkillIndex(scopedEntries, searchTerm);

        if (activeTab === 'local') {
            return [...searched].sort((left, right) => {
                const leftPinned = left.skill.pinnedAt ? 1 : 0;
                const rightPinned = right.skill.pinnedAt ? 1 : 0;
                if (leftPinned !== rightPinned) return rightPinned - leftPinned;
                return right.skill.updatedAt - left.skill.updatedAt;
            });
        }

        if (discoverSort === 'relevance') return searched;

        return [...searched].sort((left, right) => {
            if (discoverSort === 'popular') {
                const leftStars = getSkillSourceMetadata(left.skill)?.stargazersCount || 0;
                const rightStars = getSkillSourceMetadata(right.skill)?.stargazersCount || 0;
                return rightStars - leftStars;
            }

            if (discoverSort === 'recent') {
                const leftDays = getSourceLastUpdatedDays(getSkillSourceMetadata(left.skill));
                const rightDays = getSourceLastUpdatedDays(getSkillSourceMetadata(right.skill));
                const leftScore = leftDays === null ? Number.POSITIVE_INFINITY : leftDays;
                const rightScore = rightDays === null ? Number.POSITIVE_INFINITY : rightDays;
                return leftScore - rightScore;
            }

            const leftTrust = evaluateSkillSourceTrust(left.skill).score;
            const rightTrust = evaluateSkillSourceTrust(right.skill).score;
            return rightTrust - leftTrust;
        });
    }, [indexedSkills, activeTab, searchTerm, discoverSort]);

    const filteredSkills = useMemo(() => filteredEntries.map((entry) => entry.skill), [filteredEntries]);

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
                addToast('当前浏览器不支持目录选择器。', 'error');
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
                addToast('该目录中未发现 SKILL.md 文件。', 'info');
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
                addToast(`已导入 ${addedCount} 个新技能。`, 'success');
            } else {
                addToast('检测到的技能已全部存在于技能库中。', 'info');
            }

            if (invalidCount > 0 || blockedCount > 0) {
                addToast(`已跳过 ${invalidCount} 个无效技能和 ${blockedCount} 个被拦截技能。`, 'info');
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
                addToast('本地技能导入失败。', 'error');
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
            addToast(`"${skill.name}" 校验未通过，无法安装。`, 'error');
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
        if (compliance.decision === 'warn') {
            addToast(compliance.message, 'info');
        }

        try {
            const picker = (window as PickerWindow).showDirectoryPicker;
            if (!picker) {
                addToast('当前浏览器不支持目录选择器。', 'error');
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
            addToast(`已将 "${skill.name}" 安装到 ${targetDirs}。`, 'success');
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
                addToast('安装失败，请检查目录权限后重试。', 'error');
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
            addToast(`"${skill.name}" 校验未通过，无法导出。`, 'error');
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
        if (compliance.decision === 'warn') {
            addToast(compliance.message, 'info');
        }

        if (dirHandle) {
            try {
                await writeSkillToDisk(dirHandle, skill);
                addToast(`已将 "${skill.name}" 保存到已连接目录。`, 'success');
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
                addToast('直写失败，已下载回退安装脚本。', 'error');
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
            addToast(`${skill.name} 已安装。`, 'info');
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
            addToast(`"${skill.name}" 被安全扫描拦截。`, 'error');
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
            addToast(`"${skill.name}" 校验未通过，无法安装。`, 'error');
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
        if (compliance.decision === 'warn') {
            addToast(compliance.message, 'info');
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

        addToast(`已安装 ${skill.name}。`, 'success');
        addAuditEvent({
            traceId,
            eventType: 'install-library',
            status: 'success',
            target: skill.name,
            message: 'Installed skill from discover feed.'
        });
    };

    const handleTogglePin = (skill: Skill) => {
        const willPin = !skill.pinnedAt;
        updateSkill(skill.id, {
            pinnedAt: willPin ? getTimestamp() : null
        });
        addToast(willPin ? `已置顶 "${skill.name}"。` : `已取消置顶 "${skill.name}"。`, 'info');
    };

    return (
        <div className="space-y-8 ui-page-enter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="ui-page-title mb-2">技能库</h2>
                    <p className="ui-page-subtitle">在统一工作区中发现、评审并部署技能资产。</p>
                </div>
                <div className="flex items-center gap-3">
                    {dirHandle && (
                        <button
                            onClick={syncFromLocal}
                            disabled={isSyncing}
                            className="ui-btn-secondary text-green-400 border-green-500/20 hover:bg-green-500/10"
                        >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            同步本地
                        </button>
                    )}
                    <button
                        onClick={handleImportLocal}
                        className="hidden md:inline-flex ui-btn-secondary whitespace-nowrap"
                    >
                        <FolderDown className="w-4 h-4" />
                        导入本地
                    </button>
                    <button
                        onClick={() => navigate('/editor')}
                        className="ui-btn-primary whitespace-nowrap px-5"
                    >
                        <Plus className="w-5 h-5" />
                        新建技能
                    </button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between border-b border-border-main pb-4">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`ui-tab ${
                            activeTab === 'local'
                                ? 'ui-tab-active'
                                : 'ui-tab-idle'
                        }`}
                    >
                        <HardDrive className="w-4 h-4" />
                        本地 ({activeTab === 'local' ? filteredSkills.length : skills.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`ui-tab ${
                            activeTab === 'discover'
                                ? 'ui-tab-active'
                                : 'ui-tab-idle'
                        }`}
                    >
                        <Compass className="w-4 h-4" />
                        发现 ({activeTab === 'discover' ? filteredSkills.length : awesomeSkills.length + customDiscoverSkills.length})
                    </button>
                </div>

                {activeTab === 'discover' && (
                    <div className="flex flex-wrap items-center gap-2">
                        <label htmlFor="discover-sort-select" className="text-xs uppercase tracking-wide text-text-muted font-mono">排序</label>
                        <select
                            id="discover-sort-select"
                            value={discoverSort}
                            onChange={(event) => setDiscoverSort(event.target.value as DiscoverSortKey)}
                            className="ui-input py-2 px-3 text-sm min-w-40"
                        >
                            <option value="trust">{DISCOVER_SORT_LABELS.trust}</option>
                            <option value="popular">{DISCOVER_SORT_LABELS.popular}</option>
                            <option value="recent">{DISCOVER_SORT_LABELS.recent}</option>
                            <option value="relevance">{DISCOVER_SORT_LABELS.relevance}</option>
                        </select>

                        <button
                            onClick={() => setIsImporterOpen(true)}
                            className="ui-btn-secondary text-sm py-2"
                        >
                            <Github className="w-4 h-4" />
                            添加 GitHub 仓库
                        </button>
                    </div>
                )}
            </div>

            <div className="relative">
                <label htmlFor="skill-search-input" className="sr-only">搜索技能</label>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 transition-colors" />
                <input
                    id="skill-search-input"
                    type="text"
                    placeholder="按名称、描述、作者或标签搜索..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="w-full bg-bg-base border border-border-main rounded-[calc(var(--radius-base))] pl-14 pr-4 py-4 text-sm leading-6 text-text-main placeholder:text-text-muted focus:border-brand/50 focus:ring-4 focus:ring-brand/10 transition-all"
                />
            </div>

            {activeTab === 'discover' && isFetchingAwesome ? (
                <div className="themed-panel h-64 flex flex-col items-center justify-center border-dashed">
                    <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin mb-4" />
                    <p className="ui-kicker font-mono">正在加载发现列表...</p>
                </div>
            ) : filteredSkills.length === 0 ? (
                <div className="themed-panel h-64 flex flex-col items-center justify-center border-dashed">
                    <p className="text-text-muted text-lg leading-7 mb-4">未找到匹配技能。</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-brand hover:text-text-main transition-colors underline underline-offset-4"
                    >
                        清空搜索
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSkills.map((skill) => {
                        const securityBadge = getSecurityBadge(skill);
                        const isInstalled = skills.some((installedSkill) => installedSkill.name === skill.name);
                        const sourceMetadata = getSkillSourceMetadata(skill);
                        const sourceTrust = evaluateSkillSourceTrust(skill);
                        const installCompliance = activeTab === 'discover'
                            ? evaluateSkillCompliance({ skill, action: 'install' })
                            : null;
                        const sourceUpdatedAt = sourceMetadata?.updatedAt || sourceMetadata?.pushedAt;
                        const hasSourceUpdatedAt = Boolean(sourceUpdatedAt) && Number.isFinite(Date.parse(sourceUpdatedAt || ''));
                        const isComplianceBlocked = installCompliance?.decision === 'deny';
                        const isBlocked = Boolean(skill.security?.hardTriggered || isComplianceBlocked);

                        return (
                            <div
                                key={skill.id}
                                className="themed-panel ui-card-lift p-6 hover:shadow-2xl hover:shadow-brand/10 transition-all duration-300 group flex flex-col h-full relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/10 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <h3 className="text-xl font-bold text-text-main line-clamp-1 flex-1 pr-2">{skill.name}</h3>
                                    {activeTab === 'local' && skill.pinnedAt && (
                                        <span className="ui-pill ui-pill-warning mr-2">
                                            已置顶
                                        </span>
                                    )}
                                    {activeTab === 'local' && currentTime - skill.createdAt < 24 * 60 * 60 * 1000 && (
                                        <span className="ui-pill ui-pill-brand mr-2 animate-pulse">
                                            新
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
                                                            aria-label={`安装 ${skill.name} 到项目目录`}
                                                            title="安装到项目目录"
                                                            className="ui-icon-btn text-text-muted hover:text-blue-400 bg-bg-base hover:bg-blue-400/10"
                                                        >
                                                        <FolderSymlink className="w-4 h-4" />
                                                    </button>
                                                    {activeDropdown === skill.id && (
                                                        <div
                                                            ref={dropdownRef}
                                                            id={`install-menu-${skill.id}`}
                                                            role="menu"
                                                            tabIndex={-1}
                                                            aria-label={`为 ${skill.name} 选择安装目标`}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Escape') {
                                                                    event.preventDefault();
                                                                    setActiveDropdown(null);
                                                                }
                                                            }}
                                                            className="absolute right-0 top-full mt-2 w-60 bg-bg-panel border border-border-main rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
                                                        >
                                                            <div className="px-3 py-2 border-b border-border-main ui-kicker">
                                                                安装目标
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
                                                    onClick={() => handleTogglePin(skill)}
                                                    aria-label={skill.pinnedAt ? `取消置顶 ${skill.name}` : `置顶 ${skill.name}`}
                                                    title={skill.pinnedAt ? '取消置顶' : '置顶'}
                                                    className="ui-icon-btn text-text-muted hover:text-amber-400 bg-bg-base hover:bg-amber-400/10"
                                                >
                                                    {skill.pinnedAt ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleExportScript(skill)}
                                                    aria-label={`导出 ${skill.name} 的安装脚本`}
                                                    title="导出安装脚本"
                                                    className="ui-icon-btn text-text-muted hover:text-green-400 bg-bg-base hover:bg-green-400/10"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/editor?id=${skill.id}`)}
                                                    aria-label={`编辑 ${skill.name}`}
                                                    title="编辑"
                                                    className="ui-icon-btn text-text-muted hover:text-brand bg-bg-base hover:bg-brand/10"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteSkill(skill.id)}
                                                    aria-label={`删除 ${skill.name}`}
                                                    title="删除"
                                                    className="ui-icon-btn text-text-muted hover:text-red-400 bg-bg-base hover:bg-red-400/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleInstallDiscoverSkill(skill)}
                                                disabled={isInstalled || isBlocked}
                                                title={
                                                    isInstalled
                                                        ? '已安装到本地技能库'
                                                        : isComplianceBlocked
                                                            ? installCompliance?.message || '已被合规策略拦截'
                                                            : skill.security?.hardTriggered
                                                                ? '已被安全策略拦截'
                                                                : installCompliance?.decision === 'warn'
                                                                    ? `${installCompliance.message}（建议人工复核）`
                                                                    : '安装到本地技能库'
                                                }
                                                className="ui-btn-primary px-3 py-1.5 text-xs"
                                            >
                                                {isInstalled ? (
                                                    '已安装'
                                                ) : isBlocked ? (
                                                    '已拦截'
                                                ) : (
                                                    <>
                                                        <PlusCircle className="w-3.5 h-3.5" />
                                                        安装
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <p className="ui-body-sm mb-6 line-clamp-3 flex-1 relative z-10">
                                    {skill.description || '暂无描述。'}
                                </p>

                                <div className="mt-auto space-y-3 relative z-10 border-t border-border-main pt-4">
                                    {(securityBadge || skill.allowedTools?.length > 0 || skill.context === 'fork' || activeTab === 'discover') && (
                                        <div className="flex flex-wrap gap-2">
                                            {activeTab === 'discover' && (
                                                <span className={`ui-badge ${getTrustBadgeClass(sourceTrust)}`}>
                                                    <ShieldAlert className="w-3 h-3" />
                                                    信任 {sourceTrust.score}
                                                </span>
                                            )}
                                            {activeTab === 'discover' && installCompliance?.decision === 'warn' && (
                                                <span className="ui-badge ui-badge-attention">
                                                    复核来源
                                                </span>
                                            )}
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
                                                    子代理：{skill.agent || '默认'}
                                                </span>
                                            )}
                                            {skill.allowedTools?.slice(0, 2).map((tool) => (
                                                <span
                                                    key={tool}
                                                    className="ui-badge ui-badge-warning"
                                                >
                                                    <ShieldAlert className="w-3 h-3" />
                                                    {getToolDisplayLabel(tool)}
                                                </span>
                                            ))}
                                            {(skill.allowedTools?.length || 0) > 2 && (
                                                <span className="ui-badge ui-badge-attention">
                                                    +{(skill.allowedTools?.length || 0) - 2} 个工具
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {skill.tags && skill.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {skill.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="ui-badge ui-badge-brand uppercase"
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

                                    {activeTab === 'discover' && sourceMetadata && (
                                        <div className="flex flex-wrap gap-2">
                                            {typeof sourceMetadata.stargazersCount === 'number' && (
                                                <span className="ui-badge ui-badge-info">
                                                    <Star className="w-3 h-3" />
                                                    {formatCompactCount(sourceMetadata.stargazersCount)} 星标
                                                </span>
                                            )}
                                            {typeof sourceMetadata.forksCount === 'number' && (
                                                <span className="ui-badge ui-badge-info">
                                                    <GitFork className="w-3 h-3" />
                                                    {formatCompactCount(sourceMetadata.forksCount)} 分叉
                                                </span>
                                            )}
                                            {sourceMetadata.license && (
                                                <span className="ui-badge ui-badge-info">
                                                    <Scale className="w-3 h-3" />
                                                    {sourceMetadata.license}
                                                </span>
                                            )}
                                            {hasSourceUpdatedAt && (
                                                <span className="ui-badge ui-badge-info">
                                                    <Clock className="w-3 h-3" />
                                                    更新于 {formatRelativeTime(sourceUpdatedAt || '')}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between ui-caption">
                                        <span className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {activeTab === 'local'
                                                ? formatRelativeTime(skill.createdAt)
                                                : '发现流'}
                                        </span>
                                        <span className="font-medium text-text-muted line-clamp-1 text-right max-w-[50%]">
                                            {skill.author || '未知作者'}
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

