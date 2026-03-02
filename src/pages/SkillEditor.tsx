import React, { useEffect, useState } from 'react';
import { useSkillStore, type Skill } from '../store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, FolderPlus, FilePlus } from 'lucide-react';
import {
    readSkillTree,
    readFileContent,
    writeFileContent,
    writeSkillToDisk,
    getSafeSkillDirName,
    prepareSkillDirectoryRename,
    finalizeSkillDirectoryRename,
    createNewFileOrDirectory,
    type FileNode
} from '../lib/fsCore';

import { FileExplorer } from '../components/ide/FileExplorer';
import { WorkspaceParams } from '../components/ide/WorkspaceParams';
import { CodeEditorPane } from '../components/ide/CodeEditorPane';
import { evaluateSkillCompliance } from '../lib/compliancePolicy';
import { createTraceId } from '../lib/auditLog';
import { summarizeValidation, validateSkillDraft } from '../lib/skillValidator';

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

const DEFAULT_INSTRUCTIONS = '# New skill\n\nDefine the behavior and operating constraints of this skill.';

export const SkillEditor: React.FC = () => {
    const {
        skills,
        addSkill,
        updateSkill,
        dirHandle,
        syncFromLocal,
        addToast,
        addAuditEvent,
        setValidationSummary
    } = useSkillStore();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');

    // IDE state
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [activeFilePath, setActiveFilePath] = useState<string | null>('SKILL.md');
    const [activeFileHandle, setActiveFileHandle] = useState<FileSystemFileHandle | null>(null);
    const [subFileContent, setSubFileContent] = useState('');
    const [skillDirHandle, setSkillDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

    // SKILL.md state
    const [activeTab, setActiveTab] = useState<'meta' | 'instructions' | 'preview'>('meta');
    const [formData, setFormData] = useState<Partial<Skill>>({
        name: '',
        description: '',
        author: 'Agent Skill Forge',
        tags: [],
        disableModelInvocation: false,
        userInvocable: true,
        allowedTools: [],
        context: 'none',
        agent: '',
        instructions: DEFAULT_INSTRUCTIONS
    });
    const [createEntryType, setCreateEntryType] = useState<'file' | 'folder' | null>(null);
    const [newEntryName, setNewEntryName] = useState('');

    useEffect(() => {
        const init = async () => {
            if (editId) {
                const existing = skills.find((skill) => skill.id === editId);
                if (!existing) return;

                setFormData(existing);

                if (!dirHandle) return;

                try {
                    const skillDir = await dirHandle.getDirectoryHandle(getSafeSkillDirName(existing.name));
                    setSkillDirHandle(skillDir);
                    const tree = await readSkillTree(skillDir);
                    setFileTree(tree);

                    const skillMdNode = tree.find((node) => node.name === 'SKILL.md' && !node.isDir);
                    if (skillMdNode?.handle && skillMdNode.handle.kind === 'file') {
                        setActiveFileHandle(skillMdNode.handle);
                    }
                } catch (error) {
                    console.warn('Skill directory is not available on disk.', error);
                }
                return;
            }

            if (dirHandle) {
                // Virtual root file before the first save creates a physical directory.
                setFileTree([{ name: 'SKILL.md', isDir: false, handle: null, path: 'SKILL.md' }]);
            }
        };

        void init();
    }, [dirHandle, editId, skills]);

    const handleFileSelect = async (node: FileNode) => {
        if (node.isDir || !node.handle || node.handle.kind !== 'file') return;

        setActiveFilePath(node.path);
        setActiveFileHandle(node.handle);

        if (node.name === 'SKILL.md') return;

        try {
            const content = await readFileContent(node.handle);
            setSubFileContent(content);
        } catch (error) {
            console.error('Failed to read file:', error);
            setSubFileContent('/* Failed to read file */');
        }
    };

    const handleSaveSkillMd = async () => {
        const traceId = createTraceId();
        addAuditEvent({
            traceId,
            eventType: 'save-skill',
            status: 'started',
            target: formData.name?.trim() || 'untitled',
            message: 'Started skill save.'
        });

        const cleanName = formData.name?.trim();
        if (!cleanName) {
            addToast('Skill name cannot be empty.', 'error');
            addAuditEvent({
                traceId,
                eventType: 'save-skill',
                status: 'failed',
                target: 'untitled',
                reasonCode: 'SKILL_NAME_REQUIRED',
                message: 'Skill save failed because name is empty.'
            });
            return;
        }

        const skillPayload: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'> = {
            name: cleanName,
            description: formData.description || '',
            author: formData.author || '',
            tags: formData.tags || [],
            disableModelInvocation: formData.disableModelInvocation || false,
            userInvocable: formData.userInvocable ?? true,
            allowedTools: formData.allowedTools || [],
            context: formData.context || 'none',
            agent: formData.agent || '',
            instructions: formData.instructions || '',
            attachments: formData.attachments,
            source: formData.source,
            security: formData.security
        };

        const validation = validateSkillDraft(skillPayload);
        setValidationSummary(summarizeValidation(validation));
        if (!validation.isValid) {
            const firstError = validation.errors[0];
            addToast(firstError?.message || 'Skill validation failed.', 'error');
            addAuditEvent({
                traceId,
                eventType: 'save-skill',
                status: 'failed',
                target: cleanName,
                reasonCode: firstError?.code || 'VALIDATION_FAILED',
                message: 'Skill save blocked by validation failure.',
                metadata: {
                    errors: validation.errors.map((issue) => issue.code),
                    warnings: validation.warnings.map((issue) => issue.code)
                }
            });
            return;
        }
        if (validation.warnings.length > 0) {
            addToast(`Validation warning: ${validation.warnings[0].message}`, 'info');
        }

        const compliance = evaluateSkillCompliance({
            skill: skillPayload,
            action: 'save'
        });
        if (compliance.decision === 'deny') {
            addToast(compliance.message, 'error');
            addAuditEvent({
                traceId,
                eventType: 'save-skill',
                status: 'blocked',
                target: cleanName,
                reasonCode: compliance.reasonCode,
                message: compliance.message
            });
            return;
        }
        if (compliance.decision === 'warn') {
            addToast(compliance.message, 'info');
        }

        if (dirHandle) {
            try {
                const existingSkill = editId ? skills.find((skill) => skill.id === editId) : undefined;
                const existingCreatedAt = existingSkill?.createdAt || Date.now();

                const fullSkill: Skill = {
                    ...skillPayload,
                    id: editId || `temp-${Date.now()}`,
                    createdAt: existingCreatedAt,
                    updatedAt: Date.now()
                };

                const renamePlan = existingSkill
                    ? await prepareSkillDirectoryRename(dirHandle, existingSkill.name, fullSkill.name)
                    : null;

                await writeSkillToDisk(dirHandle, fullSkill);

                if (renamePlan?.renamed) {
                    try {
                        await finalizeSkillDirectoryRename(dirHandle, renamePlan);
                    } catch (cleanupError) {
                        console.warn('Skill saved, but failed to clean old skill directory.', cleanupError);
                        addToast(`Saved "${fullSkill.name}", but failed to remove old folder.`, 'error');
                    }
                }

                const newSkillDir = await dirHandle.getDirectoryHandle(getSafeSkillDirName(fullSkill.name));
                setSkillDirHandle(newSkillDir);
                const tree = await readSkillTree(newSkillDir);
                setFileTree(tree);
                setActiveFilePath('SKILL.md');
                setSubFileContent('');

                const skillMdNode = tree.find((node) => node.name === 'SKILL.md' && !node.isDir);
                if (skillMdNode?.handle && skillMdNode.handle.kind === 'file') {
                    setActiveFileHandle(skillMdNode.handle);
                } else {
                    setActiveFileHandle(null);
                }

                await syncFromLocal();

                addToast(`Saved "${fullSkill.name}" to local workspace.`, 'success');
                addAuditEvent({
                    traceId,
                    eventType: 'save-skill',
                    status: 'success',
                    target: fullSkill.name,
                    message: 'Skill saved to local workspace.',
                    metadata: { mode: 'filesystem' }
                });
                navigate(`/?id=${fullSkill.id}`, { replace: true });
            } catch (error) {
                addToast(`Failed to write skill to local disk: ${getErrorMessage(error)}`, 'error');
                addAuditEvent({
                    traceId,
                    eventType: 'save-skill',
                    status: 'failed',
                    target: cleanName,
                    reasonCode: 'FILESYSTEM_WRITE_FAILED',
                    message: `Failed writing skill to disk: ${String(error)}`
                });
            }
            return;
        }

        if (editId) {
            updateSkill(editId, skillPayload);
        } else {
            addSkill(skillPayload);
        }
        addAuditEvent({
            traceId,
            eventType: 'save-skill',
            status: 'success',
            target: cleanName,
            message: 'Skill saved in local browser storage.',
            metadata: { mode: 'browser-storage' }
        });
        navigate('/');
    };

    const handleSaveSubFile = async (rawContent: string) => {
        if (!activeFileHandle) return;

        try {
            await writeFileContent(activeFileHandle, rawContent);
        } catch (error) {
            addToast(`Failed to save file: ${getErrorMessage(error)}`, 'error');
        }
    };

    const closeCreateDialog = () => {
        setCreateEntryType(null);
        setNewEntryName('');
    };

    const openCreateDialog = (isDir: boolean) => {
        if (!skillDirHandle) {
            addToast('Save the skill first to create additional files and folders.', 'info');
            return;
        }
        setCreateEntryType(isDir ? 'folder' : 'file');
        setNewEntryName('');
    };

    const handleCreateNew = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!skillDirHandle || !createEntryType) return;

        const typeName = createEntryType;
        const name = newEntryName.trim();
        if (!name) {
            addToast(`${typeName[0].toUpperCase()}${typeName.slice(1)} name cannot be empty.`, 'error');
            return;
        }

        try {
            await createNewFileOrDirectory(skillDirHandle, name, typeName === 'folder');
            const tree = await readSkillTree(skillDirHandle);
            setFileTree(tree);
            addToast(`Created ${typeName}: ${name}`, 'success');
            closeCreateDialog();

            if (typeName === 'file') {
                const newNode = tree.find((node) => node.name === name && !node.isDir);
                if (newNode) {
                    await handleFileSelect(newNode);
                }
            }
        } catch (error) {
            addToast(`Failed to create ${typeName}: ${getErrorMessage(error)}`, 'error');
        }
    };

    const isV4ModeActive = Boolean(dirHandle && (skillDirHandle || !editId));
    const isEditingSkillMd = activeFilePath === 'SKILL.md' || activeFilePath?.endsWith('/SKILL.md');

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-64px)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 themed-action rounded-[var(--radius-button)] text-text-muted hover:text-text-main"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-bold text-text-main tracking-tight">
                                {formData.name || (editId ? 'Edit Skill' : 'Create Skill')}
                            </h2>
                            {isV4ModeActive && (
                                <span className="text-xs bg-brand/20 text-brand px-2 py-1 rounded-[var(--radius-button)] font-bold uppercase tracking-widest border border-brand/20">
                                    IDE Enabled
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-text-muted">
                            Edit frontmatter, instructions, and optional sidecar files.
                        </p>
                    </div>
                </div>

                {(!isV4ModeActive || isEditingSkillMd) && (
                    <button
                        onClick={handleSaveSkillMd}
                        className="ui-btn-primary px-6"
                    >
                        <Save className="w-5 h-5" />
                        Save skill
                    </button>
                )}
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                {isV4ModeActive && (
                    <div className="w-64 themed-panel flex flex-col overflow-hidden shrink-0">
                        <div className="p-4 border-b border-border-main flex justify-between items-center bg-bg-base/50">
                            <span className="ui-kicker">Files</span>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openCreateDialog(false)}
                                    className="p-1 hover:bg-bg-action rounded-[var(--radius-button)] text-text-muted hover:text-text-main transition-colors"
                                    title="New file"
                                >
                                    <FilePlus className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => openCreateDialog(true)}
                                    className="p-1 hover:bg-bg-action rounded-[var(--radius-button)] text-text-muted hover:text-text-main transition-colors"
                                    title="New folder"
                                >
                                    <FolderPlus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            <FileExplorer nodes={fileTree} activePath={activeFilePath} onSelect={handleFileSelect} />
                        </div>
                    </div>
                )}

                <div className="flex-1 themed-panel overflow-hidden relative flex flex-col min-w-0">
                    {!dirHandle && (
                        <div className="absolute top-4 right-4 z-50 pointer-events-none opacity-60">
                            <span className="text-xs bg-amber-500/20 text-amber-500 px-2 py-1 rounded font-bold uppercase tracking-widest border border-amber-500/20">
                                Classic mode. Link a folder to enable multi-file IDE.
                            </span>
                        </div>
                    )}

                    {isEditingSkillMd ? (
                        <WorkspaceParams
                            formData={formData}
                            setFormData={setFormData}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    ) : (
                        <CodeEditorPane
                            filename={activeFilePath || 'Unknown file'}
                            initialContent={subFileContent}
                            onSave={handleSaveSubFile}
                        />
                    )}
                </div>
            </div>

            {createEntryType && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={closeCreateDialog}
                        aria-label="Close create dialog"
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-entry-title"
                        className="relative z-10 w-full max-w-md themed-panel p-6"
                    >
                        <h3 id="create-entry-title" className="text-lg font-bold text-text-main mb-2">
                            New {createEntryType}
                        </h3>
                        <p className="text-sm text-text-muted mb-4">
                            Enter a {createEntryType} name to create it inside the current skill workspace.
                        </p>

                        <form onSubmit={handleCreateNew} className="space-y-4">
                            <input
                                autoFocus
                                type="text"
                                value={newEntryName}
                                onChange={(event) => setNewEntryName(event.target.value)}
                                placeholder={`e.g. ${createEntryType === 'file' ? 'notes.md' : 'prompts'}`}
                                className="w-full themed-input px-4 py-3"
                            />

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeCreateDialog}
                                    className="ui-btn-secondary px-4 py-2"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="ui-btn-primary px-4 py-2"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

