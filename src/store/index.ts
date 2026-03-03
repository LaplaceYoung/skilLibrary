import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { get as getIDB, set as setIDB, del } from 'idb-keyval';
import { readSkillDir, verifyPermission } from '../lib/fsCore';
import { analyzeSkillSecurity, type SkillSecurityReport } from '../lib/securityScan';
import { createAuditEvent, type AuditEvent, type AuditEventInput } from '../lib/auditLog';
import { buildSkillIndex, type IndexedSkillEntry } from '../lib/skillIndex';
import type { ValidationSummary } from '../lib/skillValidator';

export interface SkillSourceMetadata {
    stargazersCount?: number;
    forksCount?: number;
    watchersCount?: number;
    openIssuesCount?: number;
    archived?: boolean;
    updatedAt?: string;
    pushedAt?: string;
    license?: string;
    defaultBranch?: string;
}

export interface Skill {
    id: string;
    // Basic Metadata
    name: string; // Used as the /slash-command
    description: string;
    author: string;
    tags: string[];

    // Claude Skill Frontmatter Properties
    disableModelInvocation: boolean; // disable-model-invocation
    userInvocable: boolean; // user-invocable
    allowedTools: string[]; // allowed-tools
    context?: 'fork' | 'none'; // context
    agent?: string; // agent execution context (e.g. Explore, Plan)

    // Content
    instructions: string;
    attachments?: { name: string; content: string }[];

    // Quality signals
    security?: SkillSecurityReport;
    source?: {
        kind: 'local' | 'market' | 'repo';
        repo?: string;
        path?: string;
        url?: string;
        metadata?: SkillSourceMetadata;
    };

    pinnedAt?: number | null;

    // Internal metadata
    createdAt: number;
    updatedAt: number;
}

export type ThemeType = 'geometric' | 'chromatic' | 'organic';
export type LocaleType = 'zh-CN' | 'en-US';

interface SkillState {
    skills: Skill[];
    addSkill: (skillData: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => void;
    updateSkill: (id: string, updates: Partial<Skill>) => void;
    deleteSkill: (id: string) => void;
    loadInitialSkills: (skills: Skill[]) => void;

    // FileSystem Sync
    dirHandle: FileSystemDirectoryHandle | null;
    isSyncing: boolean;
    setDirHandle: (handle: FileSystemDirectoryHandle | null) => Promise<void>;
    syncFromLocal: () => Promise<void>;
    initLocalConnection: () => Promise<boolean>;

    // V5 Multi-Theme & Generative Engine
    activeTheme: ThemeType;
    activeLocale: LocaleType;
    p5EventTrigger: number;
    setTheme: (theme: ThemeType) => void;
    setLocale: (locale: LocaleType) => void;
    triggerP5Event: () => void;

    // Awesome Skills Hub
    awesomeSkills: Skill[];
    customDiscoverSkills: Skill[]; // Custom repos added by user
    skillIndexCache: IndexedSkillEntry[];
    isFetchingAwesome: boolean;
    fetchAwesomeSkills: () => Promise<void>;
    addCustomDiscoverSkills: (skills: Skill[]) => void;
    refreshSkillIndexCache: () => void;

    // Validation and audit tracking
    lastValidationSummary: ValidationSummary | null;
    setValidationSummary: (summary: ValidationSummary | null) => void;
    auditEvents: AuditEvent[];
    addAuditEvent: (event: AuditEventInput) => void;
    clearAuditEvents: () => void;

    // Toast System
    toasts: { id: string, message: string, type: 'success' | 'error' | 'info' }[];
    addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    removeToast: (id: string) => void;
}

function normalizeSkillName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function withComputedSignals(skill: Skill): Skill {
    return {
        ...skill,
        security: analyzeSkillSecurity({
            instructions: skill.instructions,
            attachments: skill.attachments
        })
    };
}

function dedupeBySkillName(skills: Skill[]): Skill[] {
    const unique = new Map<string, Skill>();
    for (const skill of skills) {
        const key = normalizeSkillName(skill.name);
        if (!unique.has(key)) {
            unique.set(key, skill);
        }
    }
    return Array.from(unique.values());
}

function toStringValue(input: unknown, fallback = ''): string {
    return typeof input === 'string' ? input : fallback;
}

function toStringList(input: unknown): string[] {
    return Array.isArray(input) ? input.filter((entry): entry is string => typeof entry === 'string') : [];
}

function toNumberValue(input: unknown): number | undefined {
    return typeof input === 'number' && Number.isFinite(input) ? input : undefined;
}

function toSourceMetadata(raw: Record<string, unknown>): SkillSourceMetadata | undefined {
    const rawMetadata = (raw.sourceMetadata && typeof raw.sourceMetadata === 'object')
        ? raw.sourceMetadata as Record<string, unknown>
        : raw;

    const metadata: SkillSourceMetadata = {
        stargazersCount: toNumberValue(rawMetadata.stargazersCount ?? rawMetadata.stars),
        forksCount: toNumberValue(rawMetadata.forksCount ?? rawMetadata.forks),
        watchersCount: toNumberValue(rawMetadata.watchersCount ?? rawMetadata.watchers),
        openIssuesCount: toNumberValue(rawMetadata.openIssuesCount ?? rawMetadata.openIssues),
        archived: typeof rawMetadata.archived === 'boolean' ? rawMetadata.archived : undefined,
        updatedAt: toStringValue(rawMetadata.updatedAt, ''),
        pushedAt: toStringValue(rawMetadata.pushedAt, ''),
        license: toStringValue(rawMetadata.license, ''),
        defaultBranch: toStringValue(rawMetadata.defaultBranch, '')
    };

    const hasValue = Object.values(metadata).some((value) => {
        if (typeof value === 'number') return Number.isFinite(value);
        if (typeof value === 'boolean') return true;
        return Boolean(value);
    });

    if (!hasValue) return undefined;

    return {
        ...metadata,
        updatedAt: metadata.updatedAt || undefined,
        pushedAt: metadata.pushedAt || undefined,
        license: metadata.license || undefined,
        defaultBranch: metadata.defaultBranch || undefined
    };
}

function buildIndexFromStateSlice(input: {
    skills: Skill[];
    awesomeSkills: Skill[];
    customDiscoverSkills: Skill[];
}): IndexedSkillEntry[] {
    return buildSkillIndex({
        localSkills: input.skills,
        marketSkills: input.awesomeSkills,
        repoSkills: input.customDiscoverSkills
    });
}

function getPersistedMcpAuthToken(): string {
    try {
        const raw = localStorage.getItem('mcp-storage');
        if (!raw) return '';
        const parsed = JSON.parse(raw) as { state?: { authToken?: unknown } };
        return typeof parsed?.state?.authToken === 'string' ? parsed.state.authToken.trim() : '';
    } catch {
        return '';
    }
}

function toSkill(raw: Record<string, unknown>, source: NonNullable<Skill['source']>): Skill {
    const now = Date.now();
    const sourceMetadata = toSourceMetadata(raw);
    return withComputedSignals({
        id: toStringValue(raw.id, uuidv4()),
        name: toStringValue(raw.name) || toStringValue(raw.title) || `skill-${uuidv4().slice(0, 8)}`,
        description: toStringValue(raw.description),
        author: toStringValue(raw.author, 'Community'),
        tags: toStringList(raw.tags),
        disableModelInvocation: Boolean(raw.disableModelInvocation),
        userInvocable: raw.userInvocable !== false,
        allowedTools: toStringList(raw.allowedTools),
        context: raw.context === 'fork' ? 'fork' : 'none',
        agent: toStringValue(raw.agent),
        instructions: toStringValue(raw.instructions) || toStringValue(raw.content) || toStringValue(raw.instruction),
        attachments: Array.isArray(raw.attachments)
            ? raw.attachments.filter(
                (attachment): attachment is { name: string; content: string } =>
                    typeof attachment === 'object' &&
                    attachment !== null &&
                    typeof (attachment as { name?: unknown }).name === 'string' &&
                    typeof (attachment as { content?: unknown }).content === 'string'
            )
            : undefined,
        source: sourceMetadata
            ? { ...source, metadata: sourceMetadata }
            : source,
        createdAt: now,
        updatedAt: now
    });
}

export const useSkillStore = create<SkillState>()(
    persist(
        (set, get) => ({
            skills: [],
            activeTheme: 'geometric',
            activeLocale: 'zh-CN',
            p5EventTrigger: 0,
            awesomeSkills: [],
            customDiscoverSkills: [],
            skillIndexCache: [],
            isFetchingAwesome: false,
            lastValidationSummary: null,
            auditEvents: [],
            toasts: [],

            addToast: (message, type = 'info') => {
                const id = uuidv4();
                set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
                setTimeout(() => {
                    useSkillStore.getState().removeToast(id);
                }, 3000);
            },

            removeToast: (id) => set((state) => ({
                toasts: state.toasts.filter((toast) => toast.id !== id)
            })),

            setValidationSummary: (summary) => set({ lastValidationSummary: summary }),

            addAuditEvent: (eventInput) => {
                const event = createAuditEvent(eventInput);
                set((state) => ({ auditEvents: [event, ...state.auditEvents].slice(0, 500) }));
            },

            clearAuditEvents: () => set({ auditEvents: [] }),

            addCustomDiscoverSkills: (newSkills) => set((state) => {
                const nextCustomDiscoverSkills = dedupeBySkillName([
                    ...newSkills.map((skill) => withComputedSignals(skill)),
                    ...state.customDiscoverSkills
                ]);

                return {
                    customDiscoverSkills: nextCustomDiscoverSkills,
                    skillIndexCache: buildIndexFromStateSlice({
                        skills: state.skills,
                        awesomeSkills: state.awesomeSkills,
                        customDiscoverSkills: nextCustomDiscoverSkills
                    })
                };
            }),

            refreshSkillIndexCache: () => {
                const state = get();
                set({
                    skillIndexCache: buildIndexFromStateSlice({
                        skills: state.skills,
                        awesomeSkills: state.awesomeSkills,
                        customDiscoverSkills: state.customDiscoverSkills
                    })
                });
            },

            addSkill: (skillData) => set((state) => {
                const nextSkills = [
                    withComputedSignals({
                        ...skillData,
                        id: uuidv4(),
                        createdAt: Date.now(),
                        updatedAt: Date.now()
                    }),
                    ...state.skills
                ];

                return {
                    skills: nextSkills,
                    skillIndexCache: buildIndexFromStateSlice({
                        skills: nextSkills,
                        awesomeSkills: state.awesomeSkills,
                        customDiscoverSkills: state.customDiscoverSkills
                    })
                };
            }),

            updateSkill: (id, updates) => set((state) => {
                const nextSkills = state.skills.map((skill) =>
                    skill.id === id
                        ? withComputedSignals({ ...skill, ...updates, updatedAt: Date.now() })
                        : skill
                );

                return {
                    skills: nextSkills,
                    skillIndexCache: buildIndexFromStateSlice({
                        skills: nextSkills,
                        awesomeSkills: state.awesomeSkills,
                        customDiscoverSkills: state.customDiscoverSkills
                    })
                };
            }),

            deleteSkill: (id) => set((state) => {
                const nextSkills = state.skills.filter((skill) => skill.id !== id);
                return {
                    skills: nextSkills,
                    skillIndexCache: buildIndexFromStateSlice({
                        skills: nextSkills,
                        awesomeSkills: state.awesomeSkills,
                        customDiscoverSkills: state.customDiscoverSkills
                    })
                };
            }),

            loadInitialSkills: (initialSkills) => set((state) => {
                if (state.skills.length > 0) return state;
                const nextSkills = dedupeBySkillName(initialSkills.map((skill) => withComputedSignals(skill)));
                return {
                    skills: nextSkills,
                    skillIndexCache: buildIndexFromStateSlice({
                        skills: nextSkills,
                        awesomeSkills: state.awesomeSkills,
                        customDiscoverSkills: state.customDiscoverSkills
                    })
                };
            }),

            dirHandle: null,
            isSyncing: false,

            setDirHandle: async (handle) => {
                if (handle) {
                    await setIDB('agent-forge-dir-handle', handle);
                    set({ dirHandle: handle });
                } else {
                    await del('agent-forge-dir-handle');
                    set({ dirHandle: null });
                }
            },

            syncFromLocal: async () => {
                const { dirHandle, skills } = useSkillStore.getState();
                if (!dirHandle) return;

                set({ isSyncing: true });
                try {
                    const localSkills = (await readSkillDir(dirHandle)).map((skill) =>
                        withComputedSignals({
                            ...skill,
                            source: {
                                kind: 'local'
                            }
                        })
                    );

                    // Basic merge strategy: keep existing IDs if names match, otherwise add new
                    const mergedSkills = [...skills];
                    for (const localSkill of localSkills) {
                        const existingIndex = mergedSkills.findIndex(
                            (storedSkill) => normalizeSkillName(storedSkill.name) === normalizeSkillName(localSkill.name)
                        );
                        if (existingIndex >= 0) {
                            // Update existing (keep the internal ID to not break routing)
                            mergedSkills[existingIndex] = {
                                ...localSkill,
                                id: mergedSkills[existingIndex].id
                            };
                        } else {
                            // Add new
                            mergedSkills.unshift(localSkill);
                        }
                    }

                    set({
                        skills: dedupeBySkillName(mergedSkills.map((skill) => withComputedSignals(skill))),
                        isSyncing: false
                    });
                    get().refreshSkillIndexCache();
                } catch (error) {
                    console.error('Sync failed', error);
                    set({ isSyncing: false });
                }
            },

            initLocalConnection: async () => {
                try {
                    const handle = await getIDB('agent-forge-dir-handle');
                    if (handle) {
                        // Verify permission silently (read mode to check if we can access)
                        const hasPerm = await verifyPermission(handle as FileSystemDirectoryHandle, false);
                        if (hasPerm) {
                            set({ dirHandle: handle });
                            return true;
                        }
                    }
                } catch (e) {
                    console.error('Failed to init local connection', e);
                }
                return false;
            },

            setTheme: (theme) => set({ activeTheme: theme }),
            setLocale: (locale) => set({ activeLocale: locale }),
            triggerP5Event: () => set((state) => ({ p5EventTrigger: state.p5EventTrigger + 1 })),

            fetchAwesomeSkills: async () => {
                set({ isFetchingAwesome: true });
                try {
                    const proxyBaseUrl = 'http://localhost:3001/api/proxy-market?url=';
                    const proxyToken = getPersistedMcpAuthToken();
                    const proxyTokenSuffix = proxyToken ? `&token=${encodeURIComponent(proxyToken)}` : '';
                    const buildProxyUrl = (targetUrl: string) =>
                        `${proxyBaseUrl}${encodeURIComponent(targetUrl)}${proxyTokenSuffix}`;

                    const [localRes, claudeRes, skillsLlmRes] = await Promise.allSettled([
                        fetch('/awesome-skills.json').then((response) => response.json()),
                        fetch(buildProxyUrl('https://claude-plugins.dev/api/skills')).then((response) => response.json()),
                        fetch(buildProxyUrl('https://skillsllm.com/api/skills')).then((response) => response.json())
                    ]);

                    const aggregatedSkills: Skill[] = [];

                    // 1. Local catalog
                    if (localRes.status === 'fulfilled' && Array.isArray(localRes.value)) {
                        for (const skill of localRes.value) {
                            aggregatedSkills.push(
                                toSkill(skill as Record<string, unknown>, {
                                    kind: 'market',
                                    repo: 'local-catalog',
                                    url: '/awesome-skills.json'
                                })
                            );
                        }
                    }

                    // 2. Claude Plugins Dev
                    if (claudeRes.status === 'fulfilled' && Array.isArray(claudeRes.value)) {
                        for (const skill of claudeRes.value) {
                            aggregatedSkills.push(
                                toSkill(
                                    {
                                        id: `claude-plugin-${skill.id || uuidv4()}`,
                                        name: skill.name,
                                        description: skill.description || '',
                                        author: skill.author || 'Claude Plugins',
                                        tags: ['claude-plugins', ...(skill.tags || [])],
                                        instructions: `# ${skill.name}\n\n${skill.description}\n\n[Repo](${skill.github_url})`
                                    },
                                    {
                                        kind: 'market',
                                        repo: skill.github_url || 'claude-plugins.dev',
                                        url: 'https://claude-plugins.dev/api/skills'
                                    }
                                )
                            );
                        }
                    }

                    // 3. SkillsLLM
                    if (skillsLlmRes.status === 'fulfilled' && Array.isArray(skillsLlmRes.value)) {
                        for (const skill of skillsLlmRes.value) {
                            aggregatedSkills.push(
                                toSkill(
                                    {
                                        id: `skillsllm-${skill.id || uuidv4()}`,
                                        name: skill.title || skill.name,
                                        description: skill.description || '',
                                        author: skill.author || 'SkillsLLM',
                                        tags: ['skillsllm', ...(skill.categories || [])],
                                        instructions: skill.content || skill.instruction || `# ${skill.title}\n\n${skill.description}`
                                    },
                                    {
                                        kind: 'market',
                                        repo: 'skillsllm',
                                        url: 'https://skillsllm.com/api/skills'
                                    }
                                )
                            );
                        }
                    }

                    set({
                        awesomeSkills: dedupeBySkillName(aggregatedSkills),
                        isFetchingAwesome: false
                    });
                    get().refreshSkillIndexCache();
                } catch (e) {
                    console.error('Failed to fetch awesome skills', e);
                    set({ isFetchingAwesome: false });
                }
            }
        }),
        {
            name: 'agent-skill-forge-storage-v5', // Changed key to force load new schema defaults
            partialize: (state) => ({
                skills: state.skills,
                activeTheme: state.activeTheme, // Persist theme choice across reloads!
                activeLocale: state.activeLocale,
                customDiscoverSkills: state.customDiscoverSkills
            })
        }
    )
);
