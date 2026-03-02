import React, { useState } from 'react';
import { useSkillStore } from '../store';
import { Play, Terminal, Bot, User, ChevronDown, ChevronUp, Hammer, Cpu } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Select } from '../components/Select';
import { useI18n } from '../i18n';

interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export const Simulator: React.FC = () => {
    const { skills, triggerP5Event } = useSkillStore();
    const { t } = useI18n();
    const [selectedSkillId, setSelectedSkillId] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [showSystem, setShowSystem] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const systemPreviewId = React.useId();

    const activeSkill = skills.find((skill) => skill.id === selectedSkillId);

    const handleStartSimulation = () => {
        const skill = skills.find((item) => item.id === selectedSkillId);
        if (!skill) return;

        setMessages([
            { role: 'system', content: `${t('simulator.systemPromptPrefix')}\n\n${skill.instructions}` },
            { role: 'assistant', content: t('simulator.greeting', { skillName: skill.name }) }
        ]);
        setShowSystem(false);
    };

    const handleSend = (event: React.FormEvent) => {
        event.preventDefault();
        if (!input.trim() || isThinking) return;

        const userInput = input.trim();
        const currentSkill = activeSkill;

        setMessages((prev) => [...prev, { role: 'user', content: userInput }]);
        setInput('');
        triggerP5Event();

        setIsThinking(true);
        window.setTimeout(() => {
            const assistantMessage: Message = {
                role: 'assistant',
                content: t('simulator.mockReply', {
                    skillName: currentSkill?.name || 'skill',
                    input: userInput,
                    agent: currentSkill?.agent || t('simulator.mainModel'),
                    tools: currentSkill?.allowedTools?.join(', ') || t('simulator.defaultTools')
                })
            };

            setMessages((prev) => [...prev, assistantMessage]);
            setIsThinking(false);
        }, 800);
    };

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col ui-page-enter gap-6">
            <div className="space-y-1">
                <h2 className="ui-page-title">{t('simulator.title')}</h2>
                <p className="ui-page-subtitle">{t('simulator.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="themed-panel p-6 flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="ui-kicker">
                            {t('simulator.selectSkillLabel')}
                        </label>
                        <Select
                            value={selectedSkillId}
                            onChange={setSelectedSkillId}
                            options={skills.map((skill) => ({ label: skill.name, value: skill.id }))}
                            placeholder={t('simulator.selectSkillPlaceholder')}
                        />
                    </div>

                    <button
                        onClick={handleStartSimulation}
                        disabled={!selectedSkillId}
                        className="ui-btn-primary w-full py-3"
                    >
                        <Play className="w-5 h-5" />
                        {t('simulator.startButton')}
                    </button>

                    {activeSkill && (
                        <div className="space-y-4 pt-4 border-t border-border-main mt-4">
                            <div className="space-y-2">
                                <label className="ui-kicker">
                                    {t('simulator.sandboxLabel')}
                                </label>
                                <div className="flex flex-wrap gap-2 text-xs font-mono">
                                    {activeSkill.allowedTools?.length ? (
                                        activeSkill.allowedTools.map((tool) => (
                                            <span
                                                key={tool}
                                                className="ui-badge ui-badge-warning"
                                            >
                                                <Hammer className="w-3 h-3" /> {tool}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="ui-caption italic opacity-70">{t('simulator.fullAccessMode')}</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="ui-kicker">
                                    {t('simulator.executionModeLabel')}
                                </label>
                                <div className="ui-badge ui-badge-info w-fit">
                                    <Cpu className="w-3 h-3" />
                                    {activeSkill.context === 'fork'
                                        ? t('simulator.subagentMode', { agent: activeSkill.agent || 'Explore' })
                                        : t('simulator.inlineMode')}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-auto p-4 bg-bg-action rounded-[var(--radius-base)] border border-border-main group hover:border-brand/30 transition-colors">
                        <div className="flex items-center gap-2 text-brand mb-2">
                            <Terminal className="w-4 h-4" />
                            <span className="ui-kicker text-brand">{t('simulator.statusLabel')}</span>
                        </div>
                        <p className="ui-caption">
                            {messages.length > 0 ? t('simulator.statusActive') : t('simulator.statusWaiting')}
                        </p>
                    </div>
                </div>

                <div className="lg:col-span-3 themed-panel flex flex-col overflow-hidden relative">
                    {messages.length > 0 && (
                        <div className="absolute top-0 inset-x-0 z-20">
                            <div
                                className={`bg-bg-action/95 backdrop-blur-md border-b border-border-main transition-all duration-300 overflow-hidden ${
                                    showSystem ? 'max-h-[300px]' : 'max-h-[48px]'
                                }`}
                            >
                                <button
                                    type="button"
                                    aria-expanded={showSystem}
                                    aria-controls={systemPreviewId}
                                    className="w-full p-3 px-6 flex items-center justify-between cursor-pointer hover:bg-white/5 text-left"
                                    onClick={() => setShowSystem(!showSystem)}
                                >
                                    <div className="ui-kicker flex items-center gap-2">
                                        <Terminal className="w-4 h-4 text-brand" />
                                        {t('simulator.systemPreview')}
                                    </div>
                                    {showSystem ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                                <div id={systemPreviewId} className="p-6 pt-0 overflow-y-auto max-h-[250px] custom-scrollbar">
                                    <div className="prose prose-invert prose-brand max-w-none text-xs opacity-70">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {activeSkill?.instructions || ''}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                            <div className="relative mb-4">
                                <Bot className="w-16 h-16 opacity-20" />
                                <div className="absolute inset-0 bg-brand/10 blur-[30px] rounded-full animate-pulse" />
                            </div>
                            <p className="font-medium">{t('simulator.emptyHint')}</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-6 pt-16 space-y-6 custom-scrollbar scroll-smooth">
                                {messages
                                    .filter((message) => message.role !== 'system')
                                    .map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex gap-4 ${
                                                message.role === 'user'
                                                    ? 'flex-row-reverse animate-in slide-in-from-right-4'
                                                    : 'animate-in slide-in-from-left-4'
                                            }`}
                                        >
                                            <div
                                                className={`p-3 rounded-2xl flex-shrink-0 w-11 h-11 flex items-center justify-center ${
                                                    message.role === 'user'
                                                        ? 'bg-brand/20 text-brand'
                                                        : 'bg-bg-action text-text-main border border-border-main shadow-lg'
                                                }`}
                                            >
                                                {message.role === 'user' ? (
                                                    <User className="w-5 h-5" />
                                                ) : (
                                                    <Bot className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div
                                                className={`max-w-[80%] p-4 rounded-2xl relative shadow-xl transition-all hover:scale-[1.01] ${
                                                    message.role === 'user'
                                                        ? 'bg-brand text-text-main rounded-tr-none'
                                                        : 'bg-bg-base border border-border-main rounded-tl-none text-text-main'
                                                }`}
                                            >
                                                {message.role === 'assistant' ? (
                                                    <div className="prose prose-invert prose-brand max-w-none text-sm leading-relaxed">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {message.content}
                                                        </ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-medium leading-6">{message.content}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                {isThinking && (
                                    <div className="flex gap-4 animate-in fade-in">
                                        <div className="p-3 rounded-2xl bg-bg-action border border-border-main w-11 h-11 flex items-center justify-center">
                                            <Bot className="w-5 h-5 animate-pulse text-brand" />
                                        </div>
                                        <div className="p-4 rounded-2xl bg-bg-base border border-border-main rounded-tl-none flex gap-1 items-center">
                                            <div className="w-1.5 h-1.5 bg-brand/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                            <div className="w-1.5 h-1.5 bg-brand/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                            <div className="w-1.5 h-1.5 bg-brand/50 rounded-full animate-bounce" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSend} className="p-4 border-t border-border-main bg-bg-action flex gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    placeholder={t('simulator.inputPlaceholder')}
                                    className="flex-1 bg-transparent border-none focus:outline-none text-text-main text-sm leading-6 px-4 placeholder:text-text-muted"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim()}
                                    className="ui-btn-primary px-6"
                                >
                                    {t('simulator.sendButton')}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

