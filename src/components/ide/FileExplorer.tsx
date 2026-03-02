import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, File, FileCode, FileText } from 'lucide-react';
import { type FileNode } from '../../lib/fsCore';
import { cn } from '../../lib/utils';

interface FileExplorerProps {
    nodes: FileNode[];
    activePath: string | null;
    onSelect: (node: FileNode) => void;
    level?: number;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, activePath, onSelect, level = 0 }) => {
    return (
        <div className="w-full">
            {nodes.map(node => (
                <FileTreeNode
                    key={node.path}
                    node={node}
                    activePath={activePath}
                    onSelect={onSelect}
                    level={level}
                />
            ))}
        </div>
    );
};

const FileTreeNode: React.FC<{
    node: FileNode;
    activePath: string | null;
    onSelect: (node: FileNode) => void;
    level: number;
}> = ({ node, activePath, onSelect, level }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Auto open if active file is inside
    React.useEffect(() => {
        if (node.isDir && activePath?.startsWith(node.path + '/')) {
            setIsOpen(true);
        }
    }, [activePath, node.path, node.isDir]);

    const isSelected = activePath === node.path;

    const handleToggle = () => {
        if (node.isDir) {
            setIsOpen(!isOpen);
        } else {
            onSelect(node);
        }
    };

    const getIcon = () => {
        if (node.isDir) return <Folder className="w-4 h-4 text-brand" />;
        if (node.name === 'SKILL.md') return <FileCode className="w-4 h-4 text-brand" />;
        if (node.name.endsWith('.md')) return <FileText className="w-4 h-4 text-text-muted" />;
        if (node.name.endsWith('.sh') || node.name.endsWith('.py') || node.name.endsWith('.json')) return <FileCode className="w-4 h-4 text-amber-400" />;
        return <File className="w-4 h-4 text-text-muted" />;
    };

    return (
        <div className="w-full">
            <button
                type="button"
                aria-expanded={node.isDir ? isOpen : undefined}
                aria-current={isSelected ? 'true' : undefined}
                className={cn(
                    "flex w-full items-center gap-1.5 py-1.5 px-2 hover:bg-bg-action cursor-pointer rounded-[var(--radius-button)] transition-colors select-none group text-left",
                    isSelected && "bg-brand/20 text-text-main font-bold"
                )}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
                onClick={handleToggle}
            >
                {node.isDir ? (
                    <div className="w-4 h-4 shrink-0 flex items-center justify-center text-text-muted">
                        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </div>
                ) : (
                    <div className="w-4 shrink-0" />
                )}

                {getIcon()}

                <span className={cn(
                    "text-sm truncate",
                    isSelected ? "font-bold text-text-main" : "text-text-muted group-hover:text-text-main"
                )}>
                    {node.name}
                </span>
            </button>

            {node.isDir && isOpen && node.children && (
                <div>
                    <FileExplorer
                        nodes={node.children}
                        activePath={activePath}
                        onSelect={onSelect}
                        level={level + 1}
                    />
                </div>
            )}
        </div>
    );
};
