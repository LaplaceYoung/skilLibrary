import { type LocaleType } from '../store';

export const MESSAGES = {
    'zh-CN': {
        'select.placeholder': '请选择...',
        'select.noOptions': '没有选项',

        'workspace.tab.meta': '核心配置 (Frontmatter)',
        'workspace.tab.instructions': '角色设定 (Instructions)',
        'workspace.tab.preview': '实时预览',
        'workspace.instructions.placeholder': '在这里编写详细的系统提示词...',

        'simulator.title': '沙盘模拟器',
        'simulator.subtitle': '在模拟对话环境中测试你的系统提示词。',
        'simulator.selectSkillLabel': '选择要载入的技能',
        'simulator.selectSkillPlaceholder': '-- 请选择一项技能 --',
        'simulator.startButton': '初始化模拟器',
        'simulator.sandboxLabel': '沙盒权限',
        'simulator.fullAccessMode': '全权限模式',
        'simulator.executionModeLabel': '执行模式',
        'simulator.subagentMode': '子代理: {{agent}}',
        'simulator.inlineMode': '内联进程',
        'simulator.statusLabel': '状态',
        'simulator.statusActive': '会话已激活，上下文已加载。',
        'simulator.statusWaiting': '等待初始化...',
        'simulator.systemPreview': '系统指令预览',
        'simulator.emptyHint': '选择一项技能并初始化后开始模拟对话。',
        'simulator.inputPlaceholder': '发送消息给智能体...',
        'simulator.sendButton': '发送',
        'simulator.systemPromptPrefix': '[SYSTEM] 动态注入参数: $ARGUMENTS = <待测参数>',
        'simulator.greeting':
            '你好，我已载入 "{{skillName}}" 技能模块。如果该技能包含动态参数（如 $ARGUMENTS），请直接输入以模拟传参效果。',
        'simulator.mockReply':
            '(这是一个基于 {{skillName}} 的前端模拟回复)\n\n我收到了参数：**{{input}}**。在真实 Claude Code 环境中，这部分指令将交由 {{agent}} 执行，并使用 {{tools}} 工具域。',
        'simulator.mainModel': '主模型',
        'simulator.defaultTools': '默认',

        'settings.language.title': '界面语言',
        'settings.language.description': '切换应用界面显示语言（基础 i18n）。',
        'settings.language.label': '语言',
        'settings.language.zh': '简体中文',
        'settings.language.en': 'English'
    },
    'en-US': {
        'select.placeholder': 'Select...',
        'select.noOptions': 'No options',

        'workspace.tab.meta': 'Core Config (Frontmatter)',
        'workspace.tab.instructions': 'Instructions',
        'workspace.tab.preview': 'Live Preview',
        'workspace.instructions.placeholder': 'Write detailed system instructions here...',

        'simulator.title': 'Sandbox Simulator',
        'simulator.subtitle': 'Test your system prompt in a simulated conversation workspace.',
        'simulator.selectSkillLabel': 'Select skill to load',
        'simulator.selectSkillPlaceholder': '-- Select a skill --',
        'simulator.startButton': 'Initialize simulator',
        'simulator.sandboxLabel': 'Sandbox permissions',
        'simulator.fullAccessMode': 'Full-access mode',
        'simulator.executionModeLabel': 'Execution mode',
        'simulator.subagentMode': 'Subagent: {{agent}}',
        'simulator.inlineMode': 'Inline process',
        'simulator.statusLabel': 'Status',
        'simulator.statusActive': 'Session active. Context loaded.',
        'simulator.statusWaiting': 'Waiting for initialization...',
        'simulator.systemPreview': 'System instruction preview',
        'simulator.emptyHint': 'Select a skill and initialize to start simulation.',
        'simulator.inputPlaceholder': 'Send a message to the agent...',
        'simulator.sendButton': 'Send',
        'simulator.systemPromptPrefix': '[SYSTEM] Dynamic injected param: $ARGUMENTS = <test-argument>',
        'simulator.greeting':
            'Hi! I loaded the "{{skillName}}" skill module. If this skill includes dynamic params (for example $ARGUMENTS), enter one below to simulate invocation.',
        'simulator.mockReply':
            '(This is a frontend mock reply based on {{skillName}}.)\n\nI received: **{{input}}**. In a real Claude Code environment, this instruction path would run on {{agent}} with the {{tools}} tool domain.',
        'simulator.mainModel': 'main model',
        'simulator.defaultTools': 'default',

        'settings.language.title': 'Interface Language',
        'settings.language.description': 'Switch the UI display language (baseline i18n).',
        'settings.language.label': 'Language',
        'settings.language.zh': 'Simplified Chinese',
        'settings.language.en': 'English'
    }
} as const;

export type MessageKey = keyof typeof MESSAGES['zh-CN'];

export const SUPPORTED_LOCALES: LocaleType[] = ['zh-CN', 'en-US'];
