import React from 'react';
import { type Skill } from '../../store';
import { useI18n } from '../../i18n';

interface WorkspaceInstructionsProps {
    formData: Partial<Skill>;
    setFormData: React.Dispatch<React.SetStateAction<Partial<Skill>>>;
}

export const WorkspaceInstructions: React.FC<WorkspaceInstructionsProps> = ({ formData, setFormData }) => {
    const { t } = useI18n();

    return (
        <div className="h-full flex flex-col space-y-2">
            <textarea
                value={formData.instructions || ''}
                onChange={(event) => setFormData((prev) => ({ ...prev, instructions: event.target.value }))}
                className="flex-1 w-full bg-bg-base border border-border-main rounded-[var(--radius-base)] p-6 font-mono text-sm text-text-main focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/50 transition-all resize-none custom-scrollbar leading-relaxed"
                placeholder={t('workspace.instructions.placeholder')}
                id="instructions-textarea"
            />
        </div>
    );
};
