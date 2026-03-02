import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { type Skill } from '../../store';

interface WorkspacePreviewProps {
    formData: Partial<Skill>;
}

export const WorkspacePreview: React.FC<WorkspacePreviewProps> = ({ formData }) => {
    return (
        <div className="h-full pr-4 overflow-y-auto custom-scrollbar">
            <div className="prose prose-invert prose-brand max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formData.instructions || '*尚未设置指令。*'}
                </ReactMarkdown>
            </div>
        </div>
    );
};
