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
                className="flex-1 w-full ui-input p-6 font-mono text-sm resize-none custom-scrollbar leading-relaxed"
                placeholder={t('workspace.instructions.placeholder')}
                id="instructions-textarea"
            />
        </div>
    );
};
