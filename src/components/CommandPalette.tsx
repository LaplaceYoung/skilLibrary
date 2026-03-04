import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Command,
    Compass,
    Home,
    PenTool,
    PlayCircle,
    RefreshCw,
    Search,
    Settings,
    Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useSkillStore, type BackgroundMotionMode, type ThemeType } from '../store';

type CommandSection = '导航' | '动作';

type CommandItem = {
    id: string;
    title: string;
    subtitle: string;
    section: CommandSection;
    keywords: string[];
    icon: React.ComponentType<{ className?: string }>;
    run: () => void | Promise<void>;
    shortcut?: string;
};

type CommandPaletteProps = {
    open: boolean;
    onClose: () => void;
};

const THEMES: ThemeType[] = ['geometric', 'chromatic', 'organic'];
const BACKGROUND_MOTION_MODES: BackgroundMotionMode[] = ['auto', 'on', 'off'];
const COMMAND_USAGE_STORAGE_KEY = 'agent-skill-forge-command-usage-v1';
const MAX_RECENT_COMMANDS = 12;

const THEME_LABELS: Record<ThemeType, string> = {
    geometric: '几何流光',
    chromatic: '色谱共振',
    organic: '有机递归'
};

const BACKGROUND_MOTION_MODE_LABELS: Record<BackgroundMotionMode, string> = {
    auto: '自动',
    on: '开启',
    off: '关闭'
};

type CommandUsageState = {
    counts: Record<string, number>;
    recent: string[];
};

const EMPTY_COMMAND_USAGE: CommandUsageState = {
    counts: {},
    recent: []
};

function loadCommandUsage(): CommandUsageState {
    try {
        const raw = localStorage.getItem(COMMAND_USAGE_STORAGE_KEY);
        if (!raw) return EMPTY_COMMAND_USAGE;

        const parsed = JSON.parse(raw) as Partial<CommandUsageState>;
        const counts = parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {};
        const recent = Array.isArray(parsed.recent) ? parsed.recent.filter((entry) => typeof entry === 'string') : [];
        return {
            counts: counts as Record<string, number>,
            recent
        };
    } catch {
        return EMPTY_COMMAND_USAGE;
    }
}

function saveCommandUsage(state: CommandUsageState) {
    try {
        localStorage.setItem(COMMAND_USAGE_STORAGE_KEY, JSON.stringify(state));
    } catch {
        // Ignore quota/storage access failures.
    }
}

function isFiniteRecentRank(value: number): boolean {
    return Number.isFinite(value);
}

function getCommandQueryScore(command: CommandItem, normalizedQuery: string): number {
    if (!normalizedQuery) return 0;

    const title = command.title.toLowerCase();
    const subtitle = command.subtitle.toLowerCase();
    const section = command.section.toLowerCase();

    if (title === normalizedQuery) return 1000;
    if (title.startsWith(normalizedQuery)) return 700;

    let score = 0;
    if (title.includes(normalizedQuery)) score += 420;
    if (subtitle.includes(normalizedQuery)) score += 210;
    if (section.includes(normalizedQuery)) score += 140;

    for (const keyword of command.keywords) {
        const normalizedKeyword = keyword.toLowerCase();
        if (normalizedKeyword === normalizedQuery) {
            score += 360;
            continue;
        }

        if (normalizedKeyword.startsWith(normalizedQuery)) {
            score += 240;
            continue;
        }

        if (normalizedKeyword.includes(normalizedQuery)) {
            score += 140;
        }
    }

    return score;
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
    return typeof value === 'object' && value !== null && typeof (value as Promise<unknown>).then === 'function';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onClose }) => {
    const navigate = useNavigate();
    const {
        dirHandle,
        syncFromLocal,
        addToast,
        setTheme,
        activeTheme,
        backgroundMotionMode,
        setBackgroundMotionMode
    } = useSkillStore();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [usageState, setUsageState] = useState<CommandUsageState>(() => loadCommandUsage());
    const inputRef = useRef<HTMLInputElement | null>(null);

    const commands = useMemo<CommandItem[]>(() => {
        const base: CommandItem[] = [
            {
                id: 'nav-library',
                title: '打开技能库',
                subtitle: '进入本地与发现工作区',
                section: '导航',
                keywords: ['首页', '技能库', '发现'],
                icon: Home,
                run: () => {
                    navigate('/');
                    onClose();
                },
                shortcut: 'G H'
            },
            {
                id: 'nav-editor',
                title: '打开技能编辑',
                subtitle: '创建或编辑技能',
                section: '导航',
                keywords: ['编辑', '创建', '技能'],
                icon: PenTool,
                run: () => {
                    navigate('/editor');
                    onClose();
                },
                shortcut: 'G E'
            },
            {
                id: 'nav-simulator',
                title: '打开模拟器',
                subtitle: '运行沙箱对话模拟',
                section: '导航',
                keywords: ['模拟器', '对话', '沙箱'],
                icon: PlayCircle,
                run: () => {
                    navigate('/simulator');
                    onClose();
                },
                shortcut: 'G S'
            },
            {
                id: 'nav-settings',
                title: '打开设置',
                subtitle: '配置工作区和 MCP 代理',
                section: '导航',
                keywords: ['设置', '配置', '代理'],
                icon: Settings,
                run: () => {
                    navigate('/settings');
                    onClose();
                },
                shortcut: 'G ,'
            },
            {
                id: 'theme-cycle',
                title: '切换主题',
                subtitle: `当前：${THEME_LABELS[activeTheme]}`,
                section: '动作',
                keywords: ['主题', '外观', '背景'],
                icon: Sparkles,
                run: () => {
                    const currentIndex = THEMES.indexOf(activeTheme);
                    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
                    setTheme(nextTheme);
                    addToast(`主题已切换为 ${THEME_LABELS[nextTheme]}。`, 'success');
                    onClose();
                }
            },
            {
                id: 'background-motion-cycle',
                title: '切换背景动态',
                subtitle: `当前：${BACKGROUND_MOTION_MODE_LABELS[backgroundMotionMode]}`,
                section: '动作',
                keywords: ['背景', '动态', '动画', '性能'],
                icon: Sparkles,
                run: () => {
                    const currentIndex = BACKGROUND_MOTION_MODES.indexOf(backgroundMotionMode);
                    const nextMode = BACKGROUND_MOTION_MODES[(currentIndex + 1) % BACKGROUND_MOTION_MODES.length];
                    setBackgroundMotionMode(nextMode);
                    addToast(`背景动态模式已设为 ${BACKGROUND_MOTION_MODE_LABELS[nextMode]}。`, 'success');
                    onClose();
                }
            }
        ];

        if (dirHandle) {
            base.push({
                id: 'sync-local',
                title: '同步本地目录',
                subtitle: `从 ${dirHandle.name} 读取技能`,
                section: '动作',
                keywords: ['同步', '本地', '目录'],
                icon: RefreshCw,
                run: async () => {
                    await syncFromLocal();
                    addToast('本地目录同步完成。', 'success');
                    onClose();
                }
            });
        } else {
            base.push({
                id: 'link-local',
                title: '连接本地目录',
                subtitle: '前往设置连接目录',
                section: '动作',
                keywords: ['连接', '本地', '目录'],
                icon: Compass,
                run: () => {
                    navigate('/settings');
                    onClose();
                }
            });
        }

        return base;
    }, [
        activeTheme,
        addToast,
        backgroundMotionMode,
        dirHandle,
        navigate,
        onClose,
        setBackgroundMotionMode,
        setTheme,
        syncFromLocal
    ]);

    const rankedCommands = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        const ranked = commands
            .map((command, baseIndex) => {
                const usageCount = usageState.counts[command.id] ?? 0;
                const recentRank = usageState.recent.indexOf(command.id);
                const normalizedRecentRank = recentRank === -1 ? Number.POSITIVE_INFINITY : recentRank;
                const queryScore = getCommandQueryScore(command, normalizedQuery);

                return {
                    command,
                    baseIndex,
                    usageCount,
                    recentRank: normalizedRecentRank,
                    queryScore
                };
            })
            .filter((entry) => (normalizedQuery ? entry.queryScore > 0 : true))
            .sort((left, right) => {
                if (normalizedQuery) {
                    if (right.queryScore !== left.queryScore) return right.queryScore - left.queryScore;
                    if (left.usageCount !== right.usageCount) return right.usageCount - left.usageCount;
                    if (left.recentRank !== right.recentRank) return left.recentRank - right.recentRank;
                    return left.baseIndex - right.baseIndex;
                }

                const leftIsRecent = isFiniteRecentRank(left.recentRank);
                const rightIsRecent = isFiniteRecentRank(right.recentRank);

                if (leftIsRecent && rightIsRecent && left.recentRank !== right.recentRank) {
                    return left.recentRank - right.recentRank;
                }

                if (leftIsRecent !== rightIsRecent) {
                    return leftIsRecent ? -1 : 1;
                }

                if (left.usageCount !== right.usageCount) {
                    return right.usageCount - left.usageCount;
                }

                return left.baseIndex - right.baseIndex;
            });

        return ranked.map((entry) => entry.command);
    }, [commands, query, usageState.counts, usageState.recent]);

    useEffect(() => {
        if (!open) return;
        setQuery('');
        setActiveIndex(0);

        const focusTimer = window.setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 0);

        return () => window.clearTimeout(focusTimer);
    }, [open]);

    useEffect(() => {
        if (rankedCommands.length === 0) {
            setActiveIndex(0);
            return;
        }

        if (activeIndex > rankedCommands.length - 1) {
            setActiveIndex(rankedCommands.length - 1);
        }
    }, [activeIndex, rankedCommands.length]);

    const recordCommandUsage = (commandId: string) => {
        setUsageState((prev) => {
            const next: CommandUsageState = {
                counts: {
                    ...prev.counts,
                    [commandId]: (prev.counts[commandId] ?? 0) + 1
                },
                recent: [commandId, ...prev.recent.filter((entry) => entry !== commandId)].slice(0, MAX_RECENT_COMMANDS)
            };
            saveCommandUsage(next);
            return next;
        });
    };

    const executeCommand = async (index: number) => {
        if (isRunning) return;
        const command = rankedCommands[index];
        if (!command) return;

        recordCommandUsage(command.id);

        try {
            const result = command.run();
            if (isPromiseLike(result)) {
                setIsRunning(true);
                await result;
            }
        } catch (error) {
            console.error('命令执行失败:', error);
            addToast('命令执行失败，请查看控制台日志。', 'error');
        } finally {
            setIsRunning(false);
        }
    };

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((prev) => Math.min(prev + 1, Math.max(rankedCommands.length - 1, 0)));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((prev) => Math.max(prev - 1, 0));
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            void executeCommand(activeIndex);
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[130] flex items-start justify-center p-4 sm:p-8">
            <button
                type="button"
                onClick={onClose}
                aria-label="关闭命令面板"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="command-palette-title"
                className="relative z-10 w-full max-w-2xl themed-panel overflow-hidden shadow-2xl"
            >
                <div className="px-4 sm:px-5 py-4 border-b border-border-main bg-bg-base/70">
                    <div className="flex items-center gap-3">
                        <div className="ui-icon-btn bg-brand/20 text-brand">
                            <Command className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p id="command-palette-title" className="ui-kicker text-brand">
                                命令面板
                            </p>
                            <p className="ui-caption">快速导航与执行动作</p>
                        </div>
                        <kbd className="px-2 py-1 rounded-md border border-border-main bg-bg-action text-[11px] font-mono text-text-muted">
                            Esc
                        </kbd>
                    </div>

                    <label htmlFor="command-palette-input" className="sr-only">
                        命令搜索
                    </label>
                    <div className="mt-4 flex items-center gap-2 ui-input px-3 py-2.5 bg-bg-panel">
                        <Search className="w-4 h-4 text-text-muted shrink-0" />
                        <input
                            id="command-palette-input"
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            onKeyDown={handleInputKeyDown}
                            placeholder="输入命令或关键词..."
                            autoComplete="off"
                            className="flex-1 bg-transparent border-none outline-none text-sm leading-6 text-text-main placeholder:text-text-muted"
                        />
                    </div>
                </div>

                <div className="max-h-[56vh] overflow-y-auto custom-scrollbar">
                    {rankedCommands.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className="ui-kicker mb-2">没有匹配命令</p>
                            <p className="ui-caption">请尝试其他关键词</p>
                        </div>
                    ) : (
                        <ul role="listbox" aria-label="命令结果" className="p-2">
                            {rankedCommands.map((command, index) => {
                                const CommandIcon = command.icon;
                                const isActive = index === activeIndex;
                                const usageCount = usageState.counts[command.id] ?? 0;
                                const isRecent = usageState.recent.includes(command.id);

                                return (
                                    <li key={command.id}>
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={isActive}
                                            data-command-item={command.id}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onClick={() => {
                                                void executeCommand(index);
                                            }}
                                            className={cn(
                                                'w-full text-left px-3 sm:px-4 py-3 rounded-[var(--radius-button)] transition-colors flex items-center justify-between gap-4',
                                                isActive
                                                    ? 'bg-brand/10 border border-brand/30'
                                                    : 'border border-transparent hover:bg-bg-action'
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="ui-icon-btn bg-bg-action text-brand border border-border-main">
                                                    <CommandIcon className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-text-main truncate">{command.title}</p>
                                                    <p className="ui-caption truncate">{command.subtitle}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                {isRecent && <span className="ui-badge ui-badge-brand">最近使用</span>}
                                                {usageCount >= 3 && <span className="ui-badge ui-badge-info">已用 {usageCount} 次</span>}
                                                <span className="ui-badge ui-badge-info">{command.section === '导航' ? '导航' : '动作'}</span>
                                                {command.shortcut && (
                                                    <kbd className="px-2 py-1 rounded-md border border-border-main bg-bg-action text-[11px] font-mono text-text-muted">
                                                        {command.shortcut}
                                                    </kbd>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                {isRunning && (
                    <div className="border-t border-border-main px-4 py-2 bg-bg-base/60">
                        <p className="ui-caption">命令执行中...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
