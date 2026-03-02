import { type Skill } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { getInstallDotDirs, type SkillInstallTarget } from './skillTargets';

export interface FileNode {
    name: string;
    isDir: boolean;
    handle: FileSystemFileHandle | FileSystemDirectoryHandle | null;
    children?: FileNode[];
    path: string; // Relative path for unique identification
}

type ParsedFrontmatterValue = string | string[];
type PermissionMode = 'read' | 'readwrite';
type PermissionState = 'granted' | 'denied' | 'prompt';
type FileSystemEntry = [string, FileSystemFileHandle | FileSystemDirectoryHandle];

interface DirectoryHandleWithExtras extends FileSystemDirectoryHandle {
    queryPermission: (options: { mode: PermissionMode }) => Promise<PermissionState>;
    requestPermission: (options: { mode: PermissionMode }) => Promise<PermissionState>;
    entries: () => AsyncIterableIterator<FileSystemEntry>;
}

interface DirectoryHandleWithMutation extends DirectoryHandleWithExtras {
    removeEntry: (name: string, options?: { recursive?: boolean }) => Promise<void>;
}

function withDirectoryExtras(handle: FileSystemDirectoryHandle): DirectoryHandleWithExtras {
    return handle as unknown as DirectoryHandleWithExtras;
}

function withDirectoryMutation(handle: FileSystemDirectoryHandle): DirectoryHandleWithMutation {
    return handle as unknown as DirectoryHandleWithMutation;
}

function iterateDirectoryEntries(handle: FileSystemDirectoryHandle): AsyncIterableIterator<FileSystemEntry> {
    return withDirectoryExtras(handle).entries();
}

function normalizeLineEndings(content: string): string {
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function stripQuotes(value: string): string {
    const trimmed = value.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === 'string') return parsed.trim();
        } catch {
            // Fall through to manual unwrapping for malformed quoted values.
        }
        return trimmed.slice(1, -1).trim();
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        return trimmed.slice(1, -1).trim();
    }
    return trimmed;
}

function parseInlineList(raw: string): string[] {
    return raw
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .split(',')
        .map((part) => stripQuotes(part))
        .filter(Boolean);
}

function parseFrontmatter(frontmatterRaw: string): Record<string, ParsedFrontmatterValue> {
    const parsed: Record<string, ParsedFrontmatterValue> = {};
    let activeListKey: string | null = null;

    for (const rawLine of normalizeLineEndings(frontmatterRaw).split('\n')) {
        const line = rawLine.trimEnd();
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) continue;

        const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (keyValueMatch) {
            const key = keyValueMatch[1];
            const rawValue = keyValueMatch[2].trim();

            if (!rawValue) {
                parsed[key] = [];
                activeListKey = key;
                continue;
            }

            if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
                parsed[key] = parseInlineList(rawValue);
            } else {
                parsed[key] = stripQuotes(rawValue);
            }

            activeListKey = null;
            continue;
        }

        const listItemMatch = line.match(/^\s*-\s+(.+)$/);
        if (listItemMatch && activeListKey) {
            const current = parsed[activeListKey];
            const listValue = stripQuotes(listItemMatch[1]);
            if (Array.isArray(current)) {
                current.push(listValue);
            } else {
                parsed[activeListKey] = [listValue];
            }
            continue;
        }
    }

    return parsed;
}

function readStringField(
    fields: Record<string, ParsedFrontmatterValue>,
    key: string,
    fallback = ''
): string {
    const value = fields[key];
    if (Array.isArray(value)) {
        return value.join(', ').trim() || fallback;
    }
    if (typeof value === 'string') return value.trim() || fallback;
    return fallback;
}

function readBooleanField(
    fields: Record<string, ParsedFrontmatterValue>,
    key: string,
    fallback: boolean
): boolean {
    const value = fields[key];
    if (Array.isArray(value)) return fallback;
    const normalized = (value || '').toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return fallback;
}

function readListField(fields: Record<string, ParsedFrontmatterValue>, key: string): string[] {
    const value = fields[key];
    if (Array.isArray(value)) {
        return value.map((entry) => entry.trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((entry) => entry.trim())
            .filter(Boolean);
    }
    return [];
}

const WINDOWS_RESERVED_NAMES = new Set([
    'con',
    'prn',
    'aux',
    'nul',
    'com1',
    'com2',
    'com3',
    'com4',
    'com5',
    'com6',
    'com7',
    'com8',
    'com9',
    'lpt1',
    'lpt2',
    'lpt3',
    'lpt4',
    'lpt5',
    'lpt6',
    'lpt7',
    'lpt8',
    'lpt9'
]);

function sanitizePathSegment(name: string, fallback: string): string {
    const withoutControlChars = Array.from(name)
        .filter((char) => {
            const code = char.charCodeAt(0);
            return code >= 32 && code !== 127;
        })
        .join('');

    const sanitized = withoutControlChars
        .replace(/[\\/:*?"<>|]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/g, '');

    const candidate = sanitized || fallback;
    const baseName = candidate.split('.')[0].toLowerCase();
    if (WINDOWS_RESERVED_NAMES.has(baseName)) {
        return `${candidate}-file`;
    }
    return candidate;
}

function toYamlQuotedString(value: string): string {
    return JSON.stringify(normalizeLineEndings(value));
}

export function getSafeSkillDirName(name: string): string {
    return sanitizePathSegment(name, `skill-${uuidv4().slice(0, 8)}`);
}

async function directoryExists(parentHandle: FileSystemDirectoryHandle, directoryName: string): Promise<boolean> {
    try {
        await parentHandle.getDirectoryHandle(directoryName);
        return true;
    } catch {
        return false;
    }
}

async function directoryHasEntries(handle: FileSystemDirectoryHandle): Promise<boolean> {
    for await (const _entry of iterateDirectoryEntries(handle)) {
        return true;
    }
    return false;
}

async function copyDirectoryRecursive(
    sourceHandle: FileSystemDirectoryHandle,
    targetHandle: FileSystemDirectoryHandle
): Promise<void> {
    for await (const [entryName, entryHandle] of iterateDirectoryEntries(sourceHandle)) {
        if (entryHandle.kind === 'directory') {
            const nextTargetDir = await targetHandle.getDirectoryHandle(entryName, { create: true });
            await copyDirectoryRecursive(entryHandle, nextTargetDir);
            continue;
        }

        const sourceFile = await entryHandle.getFile();
        const sourceBytes = await sourceFile.arrayBuffer();
        const targetFileHandle = await targetHandle.getFileHandle(entryName, { create: true });
        const writable = await targetFileHandle.createWritable();
        await writable.write(sourceBytes);
        await writable.close();
    }
}

export interface SkillDirectoryRenamePlan {
    renamed: boolean;
    sourceDirName: string;
    targetDirName: string;
}

export async function prepareSkillDirectoryRename(
    parentHandle: FileSystemDirectoryHandle,
    sourceSkillName: string,
    targetSkillName: string
): Promise<SkillDirectoryRenamePlan> {
    const sourceDirName = getSafeSkillDirName(sourceSkillName);
    const targetDirName = getSafeSkillDirName(targetSkillName);

    if (sourceDirName === targetDirName) {
        return { renamed: false, sourceDirName, targetDirName };
    }

    const sourceExists = await directoryExists(parentHandle, sourceDirName);
    if (!sourceExists) {
        return { renamed: false, sourceDirName, targetDirName };
    }

    if (await directoryExists(parentHandle, targetDirName)) {
        const targetHandle = await parentHandle.getDirectoryHandle(targetDirName);
        if (await directoryHasEntries(targetHandle)) {
            throw new Error(`Target directory "${targetDirName}" already exists.`);
        }
    }

    const sourceHandle = await parentHandle.getDirectoryHandle(sourceDirName);
    const targetHandle = await parentHandle.getDirectoryHandle(targetDirName, { create: true });
    await copyDirectoryRecursive(sourceHandle, targetHandle);

    return { renamed: true, sourceDirName, targetDirName };
}

export async function finalizeSkillDirectoryRename(
    parentHandle: FileSystemDirectoryHandle,
    plan: SkillDirectoryRenamePlan
): Promise<void> {
    if (!plan.renamed || plan.sourceDirName === plan.targetDirName) return;

    try {
        await withDirectoryMutation(parentHandle).removeEntry(plan.sourceDirName, { recursive: true });
    } catch (error) {
        throw new Error(`Failed to remove old directory "${plan.sourceDirName}": ${String(error)}`);
    }
}

export async function verifyPermission(fileHandle: FileSystemDirectoryHandle, readWrite = true): Promise<boolean> {
    const options: { mode: PermissionMode } = {
        mode: readWrite ? 'readwrite' : 'read'
    };
    const permissionHandle = withDirectoryExtras(fileHandle);

    // Check if we already have permission, if so, return true.
    if ((await permissionHandle.queryPermission(options)) === 'granted') {
        return true;
    }

    // Request permission to the file, if the user grants permission, return true.
    if ((await permissionHandle.requestPermission(options)) === 'granted') {
        return true;
    }

    return false;
}

export async function readSkillDir(dirHandle: FileSystemDirectoryHandle): Promise<Skill[]> {
    const skills: Skill[] = [];

    try {
        // Iterate over subdirectories
        for await (const [name, handle] of iterateDirectoryEntries(dirHandle)) {
            if (handle.kind === 'directory') {
                try {
                    const skillFileHandle = await handle.getFileHandle('SKILL.md');
                    const file = await skillFileHandle.getFile();
                    const content = await file.text();

                    const skill = parseSkillContent(name, content);
                    if (skill) {
                        try {
                            const attachments: { name: string; content: string }[] = [];
                            for await (const [childName, childHandle] of iterateDirectoryEntries(handle)) {
                                if (childHandle.kind === 'file' && childName !== 'SKILL.md') {
                                    const childFile = await childHandle.getFile();
                                    if (childFile.size <= 1024 * 512) { // Only read files up to 500KB
                                        const childContent = await childFile.text();
                                        attachments.push({ name: childName, content: childContent });
                                    }
                                }
                            }
                            if (attachments.length > 0) {
                                skill.attachments = attachments;
                            }
                        } catch (e) {
                            console.error('Failed to read attachments in dir:', name, e);
                        }
                        skills.push(skill);
                    }
                } catch {
                    // Skip if SKILL.md doesn't exist or other error
                    continue;
                }
            }
        }
    } catch (error) {
        console.error('Error reading skill directory:', error);
    }

    return skills;
}

export async function findAndImportSkills(dirHandle: FileSystemDirectoryHandle, currentDepth = 0, maxDepth = 4): Promise<Skill[]> {
    const skills: Skill[] = [];
    if (currentDepth > maxDepth) return skills;

    try {
        // First check if this directory itself contains SKILL.md
        try {
            const skillFileHandle = await dirHandle.getFileHandle('SKILL.md');
            const file = await skillFileHandle.getFile();
            const content = await file.text();
            const skill = parseSkillContent(dirHandle.name, content);
            if (skill) {
                try {
                    const attachments: { name: string; content: string }[] = [];
                    for await (const [childName, childHandle] of iterateDirectoryEntries(dirHandle)) {
                        if (childHandle.kind === 'file' && childName !== 'SKILL.md') {
                            const childFile = await childHandle.getFile();
                            if (childFile.size <= 1024 * 512) { // Only read files up to 500KB
                                const childContent = await childFile.text();
                                attachments.push({ name: childName, content: childContent });
                            }
                        }
                    }
                    if (attachments.length > 0) {
                        skill.attachments = attachments;
                    }
                } catch (e) {
                    console.error('Failed to read attachments during import:', dirHandle.name, e);
                }

                skills.push(skill);
                return skills; // Stop recursing deeper if we found a skill root
            }
        } catch {
            // Not a skill directory itself, continue
        }

        // Iterate over subdirectories
        for await (const [name, handle] of iterateDirectoryEntries(dirHandle)) {
            // Skip large common dev folders
            if (name === 'node_modules' || name === '.git' || name === 'target' || name === 'dist') continue;

            if (handle.kind === 'directory') {
                const subSkills = await findAndImportSkills(handle, currentDepth + 1, maxDepth);
                skills.push(...subSkills);
            }
        }
    } catch (error) {
        console.error('Error finding skills:', error);
    }

    return skills;
}

export async function installSkillToProject(
    projectDirHandle: FileSystemDirectoryHandle,
    skill: Skill,
    ideTarget: SkillInstallTarget = 'generic'
): Promise<void> {
    try {
        // Verify we have permissions
        await verifyPermission(projectDirHandle, true);

        const uniqueDirs = Array.from(new Set(getInstallDotDirs(ideTarget)));
        for (const dotDirName of uniqueDirs) {
            const dotDirHandle = await projectDirHandle.getDirectoryHandle(dotDirName, { create: true });
            const skillsHandle = await dotDirHandle.getDirectoryHandle('skills', { create: true });
            await writeSkillToDisk(skillsHandle, skill);
        }
    } catch (error) {
        console.error('Failed to install skill to project:', error);
        throw error;
    }
}

export function parseSkillContent(dirName: string, content: string): Skill | null {
    const normalized = normalizeLineEndings(content);
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;
    const match = normalized.match(frontmatterRegex);

    let fields: Record<string, ParsedFrontmatterValue> = {};
    let instructionsPart = normalized.trim();

    if (match) {
        fields = parseFrontmatter(match[1]);
        instructionsPart = match[2].trim();
    }

    const name = readStringField(fields, 'name', dirName);
    if (!name) return null;

    const contextRaw = readStringField(fields, 'context', 'none').toLowerCase();
    const context: 'fork' | 'none' = contextRaw === 'fork' ? 'fork' : 'none';

    return {
        id: 'local-' + uuidv4(),
        name,
        description: readStringField(fields, 'description', ''),
        author: readStringField(fields, 'author', 'Local User'),
        tags: readListField(fields, 'tags'),
        disableModelInvocation: readBooleanField(fields, 'disable-model-invocation', false),
        userInvocable: readBooleanField(fields, 'user-invocable', true),
        allowedTools: readListField(fields, 'allowed-tools'),
        context,
        agent: readStringField(fields, 'agent', ''),
        instructions: instructionsPart,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
}

export async function writeSkillToDisk(dirHandle: FileSystemDirectoryHandle, skill: Skill): Promise<void> {
    try {
        // Create or get the subdirectory named after the skill
        const safeSkillDirName = getSafeSkillDirName(skill.name);
        const skillDirHandle = await dirHandle.getDirectoryHandle(safeSkillDirName, { create: true });

        // Create or get SKILL.md
        const fileHandle = await skillDirHandle.getFileHandle('SKILL.md', { create: true });

        // Prepare standard Claude content
        let frontmatter = `---\n`;
        frontmatter += `name: ${toYamlQuotedString(skill.name)}\n`;
        if (skill.description) frontmatter += `description: ${toYamlQuotedString(skill.description)}\n`;
        if (skill.author) frontmatter += `author: ${toYamlQuotedString(skill.author)}\n`;
        if (skill.disableModelInvocation) frontmatter += `disable-model-invocation: true\n`;
        if (skill.userInvocable === false) frontmatter += `user-invocable: false\n`;
        if (skill.allowedTools && skill.allowedTools.length > 0) {
            frontmatter += `allowed-tools:\n`;
            for (const tool of skill.allowedTools) {
                frontmatter += `  - ${toYamlQuotedString(tool)}\n`;
            }
        }
        if (skill.tags && skill.tags.length > 0) {
            frontmatter += `tags:\n`;
            for (const tag of skill.tags) {
                frontmatter += `  - ${toYamlQuotedString(tag)}\n`;
            }
        }
        if (skill.context && skill.context !== 'none') frontmatter += `context: ${skill.context}\n`;
        if (skill.agent) frontmatter += `agent: ${toYamlQuotedString(skill.agent)}\n`;
        frontmatter += `---\n\n`;

        const fullContent = frontmatter + skill.instructions;

        const writable = await fileHandle.createWritable();
        await writable.write(fullContent);
        await writable.close();

        // Write attachments if available
        if (skill.attachments && skill.attachments.length > 0) {
            for (const attachment of skill.attachments) {
                try {
                    const safeAttachmentName = sanitizePathSegment(attachment.name, `attachment-${uuidv4().slice(0, 8)}.txt`);
                    if (safeAttachmentName === 'SKILL.md') continue;

                    const attachHandle = await skillDirHandle.getFileHandle(safeAttachmentName, { create: true });
                    const attachWritable = await attachHandle.createWritable();
                    await attachWritable.write(attachment.content);
                    await attachWritable.close();
                } catch (e) {
                    console.error(`Failed to write attachment ${attachment.name}:`, e);
                }
            }
        }
    } catch (error) {
        console.error('Failed to write SKILL.md to disk:', error);
        throw error;
    }
}

// ---- V4 Multi-File API Extensions ----

export async function readSkillTree(skillDirHandle: FileSystemDirectoryHandle, currentPath = ''): Promise<FileNode[]> {
    const nodes: FileNode[] = [];

    for await (const [name, handle] of iterateDirectoryEntries(skillDirHandle)) {
        // Skip hidden files/directories like .git or OS specific ones
        if (name.startsWith('.') && name !== '.claude') continue;

        const nodePath = currentPath ? `${currentPath}/${name}` : name;

        if (handle.kind === 'directory') {
            const children = await readSkillTree(handle, nodePath);
            nodes.push({
                name,
                isDir: true,
                handle,
                path: nodePath,
                children: children.sort((a, b) => (b.isDir === a.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1))
            });
        } else {
            nodes.push({
                name,
                isDir: false,
                handle,
                path: nodePath
            });
        }
    }

    // Sort at current level too: Directories first
    return nodes.sort((a, b) => (b.isDir === a.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
}

export async function readFileContent(fileHandle: FileSystemFileHandle): Promise<string> {
    try {
        const file = await fileHandle.getFile();
        return await file.text();
    } catch (error) {
        console.error('Failed to read file content:', error);
        throw error;
    }
}

export async function writeFileContent(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    try {
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
    } catch (error) {
        console.error(`Failed to write file ${fileHandle.name}:`, error);
        throw error;
    }
}

export async function createNewFileOrDirectory(
    parentHandle: FileSystemDirectoryHandle,
    name: string,
    isDir: boolean
): Promise<FileSystemDirectoryHandle | FileSystemFileHandle> {
    try {
        if (isDir) {
            return await parentHandle.getDirectoryHandle(name, { create: true });
        } else {
            return await parentHandle.getFileHandle(name, { create: true });
        }
    } catch (error) {
        console.error(`Failed to create ${isDir ? 'directory' : 'file'} ${name}:`, error);
        throw error;
    }
}
