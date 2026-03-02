import React from 'react';
import { type Skill } from '../../store';
import { Select } from '../Select';

interface WorkspaceMetaProps {
    formData: Partial<Skill>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Skill>>>;
}

export const WorkspaceMeta: React.FC<WorkspaceMetaProps> = ({ formData, setFormData }) => {
    const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
        setFormData(prev => ({ ...prev, tags }));
    };

    const handleToolsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const allowedTools = e.target.value.split(',').map(t => t.trim()).filter(t => t);
        setFormData(prev => ({ ...prev, allowedTools }));
    };

    return (
        <div className="max-w-3xl space-y-6">
            <div className="space-y-2">
                <label className="ui-field-label">技能名称 (唯一标识)</label>
                <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="例如：前端架构专家"
                    className="w-full ui-input px-4 py-3 font-mono"
                    id="skill-name-input"
                />
            </div>

            <div className="space-y-2">
                <label className="ui-field-label">简要描述</label>
                <textarea
                    value={formData.description || ''}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="在这里简要描述这项技能的作用..."
                    className="w-full ui-input px-4 py-3 h-24 resize-none"
                    id="skill-desc-input"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="ui-field-label">作者</label>
                    <input
                        type="text"
                        value={formData.author || ''}
                        onChange={e => setFormData(prev => ({ ...prev, author: e.target.value }))}
                        className="w-full ui-input px-4 py-3"
                        id="skill-author-input"
                    />
                </div>
                <div className="space-y-2">
                    <label className="ui-field-label">标签 (使用逗号分隔)</label>
                    <input
                        type="text"
                        value={formData.tags?.join(', ') || ''}
                        onChange={handleTagsChange}
                        placeholder="react, tailwind, 设计"
                        className="w-full ui-input px-4 py-3"
                        id="skill-tags-input"
                    />
                </div>
            </div>

            <div className="h-px bg-border-main my-6"></div>
            <h3 className="text-lg font-bold text-text-main mb-4">Claude 执行沙箱环境配置</h3>

            <div className="grid grid-cols-2 gap-6">
                <div className="p-4 bg-bg-action rounded-[calc(var(--radius-base))] border border-border-main space-y-1 hover:border-brand/30 transition-colors">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-text-main">禁用模型自动调用</label>
                        <input
                            type="checkbox"
                            checked={formData.disableModelInvocation || false}
                            onChange={e => setFormData(prev => ({ ...prev, disableModelInvocation: e.target.checked }))}
                            className="w-4 h-4 rounded-[var(--radius-button)] appearance-none border border-border-main checked:bg-brand checked:border-brand transition-colors cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:font-bold checked:after:left-[2px] checked:after:top-[0px]"
                            id="disable-invocation-checkbox"
                        />
                    </div>
                    <p className="ui-caption">disable-model-invocation: true。防止 Claude 在未授权时由于意图识别而自动触发此命令。</p>
                </div>

                <div className="p-4 bg-bg-action rounded-[var(--radius-base)] border border-border-main space-y-1 hover:border-brand/30 transition-colors">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-text-main">允许用户主动调用</label>
                        <input
                            type="checkbox"
                            checked={formData.userInvocable !== false}
                            onChange={e => setFormData(prev => ({ ...prev, userInvocable: e.target.checked }))}
                            className="w-4 h-4 rounded-[var(--radius-button)] appearance-none border border-border-main checked:bg-brand checked:border-brand transition-colors cursor-pointer relative checked:after:content-['✓'] checked:after:absolute checked:after:text-white checked:after:text-xs checked:after:font-bold checked:after:left-[2px] checked:after:top-[0px]"
                            id="user-invocable-checkbox"
                        />
                    </div>
                    <p className="ui-caption">user-invocable: false。关闭后技能将作为纯后台知识，用户无法在终端通过 /斜杠命令 主动调用。</p>
                </div>
            </div>

            <div className="space-y-2">
                <label className="ui-field-label">限制工具访问权限 (Allowed Tools)</label>
                <input
                    type="text"
                    value={formData.allowedTools?.join(', ') || ''}
                    onChange={handleToolsChange}
                    placeholder="例如: Read, Grep, Bash, Glob (留空则允许全部)"
                    className="w-full ui-input px-4 py-3 font-mono text-sm"
                    id="allowed-tools-input"
                />
                <p className="ui-caption">使用逗号分隔指定 Claude 运行此技能时可以使用的沙箱工具。</p>
            </div>

            <div className="grid grid-cols-2 gap-6 pb-8">
                <div className="space-y-2">
                    <label className="ui-field-label">执行上下文 (Context)</label>
                    <Select
                        value={formData.context || 'none'}
                        onChange={value => setFormData(prev => ({ ...prev, context: value as 'fork' | 'none' }))}
                        options={[
                            { label: '默认 (内联执行)', value: 'none' },
                            { label: 'Fork (派生隔离进程执行)', value: 'fork' }
                        ]}
                    />
                </div>

                <div className="space-y-2">
                    <label className="ui-field-label">代理执行器 (Agent)</label>
                    <input
                        type="text"
                        value={formData.agent || ''}
                        onChange={e => setFormData(prev => ({ ...prev, agent: e.target.value }))}
                        placeholder="例如: Explore, Plan (选填)"
                        disabled={formData.context !== 'fork'}
                        className="w-full ui-input px-4 py-3 disabled:opacity-30 font-mono text-sm"
                        id="agent-input"
                    />
                    <p className="ui-caption">当跨进程隔离执行时，指定由哪个系统代理接管任务。</p>
                </div>
            </div>
        </div>
    );
};


