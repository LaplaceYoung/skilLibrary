import fs from 'node:fs';
import path from 'node:path';

const workspaceRoot = process.cwd();
const skillsDir = path.join(workspaceRoot, 'temp_skills');
const outputFilePath = path.join(workspaceRoot, 'public', 'awesome-skills.json');
const excludedBasenames = new Set(['README.md', 'CONTRIBUTING.md', 'LICENSE.md', 'CHANGELOG.md']);

function walkFiles(dir, result = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const absPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walkFiles(absPath, result);
            continue;
        }
        result.push(absPath);
    }
    return result;
}

function parseFrontmatter(text) {
    const normalized = text.replace(/\r\n/g, '\n');
    const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!match) {
        return { meta: {}, instructions: text.trim() };
    }

    const meta = {};
    for (const line of match[1].split('\n')) {
        const separator = line.indexOf(':');
        if (separator < 0) continue;

        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();
        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }
        if (key) {
            meta[key] = value;
        }
    }

    return {
        meta,
        instructions: match[2].trim()
    };
}

function isCandidateMarkdown(filePath) {
    if (path.extname(filePath).toLowerCase() !== '.md') return false;

    const basename = path.basename(filePath);
    if (excludedBasenames.has(basename)) return false;

    return basename === 'SKILL.md' || basename.endsWith('.md');
}

function inferSkillName(filePath) {
    const basename = path.basename(filePath);
    if (basename === 'SKILL.md') {
        return path.basename(path.dirname(filePath));
    }
    return path.basename(filePath, '.md');
}

function buildSkillRecord(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const { meta, instructions } = parseFrontmatter(content);

    const skillName = meta.name?.trim() || inferSkillName(filePath);
    if (!skillName) {
        return null;
    }

    const tags = [];
    if (meta.category) tags.push(meta.category);
    if (tags.length === 0) tags.push('third-party');

    return {
        name: skillName,
        description: meta.description || '',
        author: meta.author || 'ComposioHQ (Awesome Claude Skills)',
        tags,
        instructions
    };
}

function main() {
    if (!fs.existsSync(skillsDir)) {
        console.error('temp_skills directory not found. Nothing to sync.');
        process.exitCode = 1;
        return;
    }

    const markdownFiles = walkFiles(skillsDir)
        .filter(isCandidateMarkdown)
        .sort((a, b) => a.localeCompare(b));

    const skills = [];
    for (const filePath of markdownFiles) {
        try {
            const parsed = buildSkillRecord(filePath);
            if (parsed) skills.push(parsed);
        } catch (error) {
            console.error(`Failed to parse ${filePath}:`, error);
        }
    }

    const outputDir = path.dirname(outputFilePath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputFilePath, `${JSON.stringify(skills, null, 2)}\n`, 'utf8');

    console.log(`Synced ${skills.length} skills to ${outputFilePath}`);
}

main();
