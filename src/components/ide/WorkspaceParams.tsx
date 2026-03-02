import React from 'react';
import { Terminal, FileCode2, Eye, type LucideIcon } from 'lucide-react';
import { type Skill } from '../../store';
import { useI18n } from '../../i18n';
import { WorkspaceMeta } from './WorkspaceMeta';
import { WorkspaceInstructions } from './WorkspaceInstructions';
import { WorkspacePreview } from './WorkspacePreview';

interface WorkspaceParamsProps {
    formData: Partial<Skill>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Skill>>>;
    activeTab: 'meta' | 'instructions' | 'preview';
    setActiveTab: (tab: 'meta' | 'instructions' | 'preview') => void;
}

type WorkspaceTabId = WorkspaceParamsProps['activeTab'];

interface WorkspaceTab {
    id: WorkspaceTabId;
    label: string;
    icon: LucideIcon;
}

export const WorkspaceParams: React.FC<WorkspaceParamsProps> = ({ formData, setFormData, activeTab, setActiveTab }) => {
    const { t } = useI18n();

    const tabs: WorkspaceTab[] = [
        { id: 'meta', label: t('workspace.tab.meta'), icon: FileCode2 },
        { id: 'instructions', label: t('workspace.tab.instructions'), icon: Terminal },
        { id: 'preview', label: t('workspace.tab.preview'), icon: Eye }
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-bg-base overflow-hidden">
            <div className="flex gap-2 border-b border-border-main pb-2 px-6 pt-4 shrink-0">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        id={`tab-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius-button)] font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-brand/10 text-brand border border-brand/20 font-bold'
                                : 'text-text-muted hover:text-text-main hover:bg-bg-action border border-transparent'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {activeTab === 'meta' && <WorkspaceMeta formData={formData} setFormData={setFormData} />}
                {activeTab === 'instructions' && (
                    <WorkspaceInstructions formData={formData} setFormData={setFormData} />
                )}
                {activeTab === 'preview' && <WorkspacePreview formData={formData} />}
            </div>
        </div>
    );
};
