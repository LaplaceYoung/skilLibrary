import React, { useCallback, useEffect, useState } from 'react';
import { Save } from 'lucide-react';

interface CodeEditorPaneProps {
    filename: string;
    initialContent: string;
    onSave: (content: string) => Promise<void>;
}

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({ filename, initialContent, onSave }) => {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const isModified = content !== initialContent;

    // Reset when file changes
    useEffect(() => {
        setContent(initialContent);
    }, [initialContent, filename]);

    const handleSave = useCallback(async () => {
        if (!isModified || isSaving) return;
        setIsSaving(true);
        try {
            await onSave(content);
        } finally {
            setIsSaving(false);
        }
    }, [content, isModified, isSaving, onSave]);

    // Auto save hotkey
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    return (
        <div className="h-full flex flex-col pt-4">
            <div className="flex items-center justify-between mb-4 px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold font-mono tracking-tight text-text-main">{filename}</h2>
                    {isModified && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                </div>

                <button
                    onClick={handleSave}
                    disabled={!isModified || isSaving}
                    className="ui-btn-primary px-4 py-2"
                >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving...' : 'Save File'}
                </button>
            </div>

            <div className="flex-1 relative mx-6 mb-6 bg-bg-action rounded-[var(--radius-base)] overflow-hidden border border-border-main">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="absolute inset-0 w-full h-full bg-transparent text-text-main p-6 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand/30 z-10 custom-scrollbar"
                    placeholder="Type raw code or markdown here..."
                    spellCheck={false}
                />
            </div>
        </div>
    );
};
