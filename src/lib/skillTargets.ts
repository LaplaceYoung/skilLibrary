export type SkillInstallTarget =
    | 'generic'
    | 'sync-major'
    | 'claude'
    | 'codex'
    | 'cursor'
    | 'windsurf'
    | 'vscode'
    | 'trae'
    | 'gemini'
    | 'opencode'
    | 'qwen'
    | 'roo'
    | 'kiro'
    | 'amp'
    | 'antigravity'
    | 'goose'
    | 'kimi'
    | 'factory'
    | 'codebuddy'
    | 'kilocode';

export interface SkillInstallTargetDefinition {
    id: SkillInstallTarget;
    label: string;
    description: string;
    dotDir: string;
}

// Referenced from public ecosystem mappings (skild + awesome-agent-skills).
export const SKILL_INSTALL_TARGETS: SkillInstallTargetDefinition[] = [
    {
        id: 'sync-major',
        label: 'Sync major tools',
        description: 'Write to the most common project-local skill folders',
        dotDir: '.agent'
    },
    {
        id: 'generic',
        label: 'Generic agent',
        description: 'Use .agent/skills',
        dotDir: '.agent'
    },
    {
        id: 'claude',
        label: 'Claude Code',
        description: 'Use .claude/skills',
        dotDir: '.claude'
    },
    {
        id: 'codex',
        label: 'OpenAI Codex',
        description: 'Use .codex/skills',
        dotDir: '.codex'
    },
    {
        id: 'cursor',
        label: 'Cursor',
        description: 'Use .cursor/skills',
        dotDir: '.cursor'
    },
    {
        id: 'windsurf',
        label: 'Windsurf',
        description: 'Use .windsurf/skills',
        dotDir: '.windsurf'
    },
    {
        id: 'vscode',
        label: 'VS Code / Copilot',
        description: 'Use .github/skills',
        dotDir: '.github'
    },
    {
        id: 'trae',
        label: 'Trae',
        description: 'Use .trae/skills',
        dotDir: '.trae'
    },
    {
        id: 'gemini',
        label: 'Gemini CLI',
        description: 'Use .gemini/skills',
        dotDir: '.gemini'
    },
    {
        id: 'opencode',
        label: 'OpenCode',
        description: 'Use .opencode/skills',
        dotDir: '.opencode'
    },
    {
        id: 'qwen',
        label: 'Qwen Code',
        description: 'Use .qwen/skills',
        dotDir: '.qwen'
    },
    {
        id: 'roo',
        label: 'Roo Code',
        description: 'Use .roo/skills',
        dotDir: '.roo'
    },
    {
        id: 'kiro',
        label: 'Kiro',
        description: 'Use .kiro/skills',
        dotDir: '.kiro'
    },
    {
        id: 'amp',
        label: 'Amp',
        description: 'Use .agents/skills',
        dotDir: '.agents'
    },
    {
        id: 'antigravity',
        label: 'Antigravity',
        description: 'Use .agent/skills',
        dotDir: '.agent'
    },
    {
        id: 'goose',
        label: 'Goose',
        description: 'Use .goose/skills',
        dotDir: '.goose'
    },
    {
        id: 'kimi',
        label: 'Kimi CLI',
        description: 'Use .kimi/skills',
        dotDir: '.kimi'
    },
    {
        id: 'factory',
        label: 'Factory Droid',
        description: 'Use .factory/skills',
        dotDir: '.factory'
    },
    {
        id: 'codebuddy',
        label: 'CodeBuddy',
        description: 'Use .codebuddy/skills',
        dotDir: '.codebuddy'
    },
    {
        id: 'kilocode',
        label: 'Kilo Code',
        description: 'Use .kilocode/skills',
        dotDir: '.kilocode'
    }
];

const TARGETS_BY_ID = new Map(
    SKILL_INSTALL_TARGETS.map((target) => [target.id, target] as const)
);

const SYNC_MAJOR_DOT_DIRS = [
    '.agent',
    '.claude',
    '.codex',
    '.cursor',
    '.windsurf',
    '.github'
];

export function getInstallDotDirs(target: SkillInstallTarget): string[] {
    if (target === 'sync-major') {
        return [...SYNC_MAJOR_DOT_DIRS];
    }

    const found = TARGETS_BY_ID.get(target);
    return found ? [found.dotDir] : ['.agent'];
}

export function getInstallTargetLabel(target: SkillInstallTarget): string {
    return TARGETS_BY_ID.get(target)?.label || target;
}
