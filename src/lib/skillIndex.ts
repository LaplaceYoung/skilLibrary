import type { Skill } from '../store';

export type SkillIndexSourceType = 'local' | 'market' | 'repo';
export type SkillTrustLevel = 'official' | 'community' | 'local';

export interface SkillSourceMeta {
    sourceType: SkillIndexSourceType;
    trustLevel: SkillTrustLevel;
    upstream?: string;
    fetchedAt: number;
}

export interface IndexedSkillEntry {
    id: string;
    normalizedName: string;
    name: string;
    description: string;
    author: string;
    tags: string[];
    hasInstructions: boolean;
    sourceMeta: SkillSourceMeta;
    skill: Skill;
}

export interface BuildSkillIndexInput {
    localSkills: Skill[];
    marketSkills: Skill[];
    repoSkills: Skill[];
}

function normalizeName(name: string): string {
    return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
}

function inferTrustLevel(skill: Skill): SkillTrustLevel {
    if (skill.source?.kind === 'local') return 'local';
    const sourceRepo = (skill.source?.repo || '').toLowerCase();
    if (sourceRepo.includes('official') || sourceRepo.includes('local-catalog')) return 'official';
    return 'community';
}

function toEntry(skill: Skill): IndexedSkillEntry {
    return {
        id: skill.id,
        normalizedName: normalizeName(skill.name),
        name: skill.name,
        description: skill.description,
        author: skill.author,
        tags: skill.tags || [],
        hasInstructions: Boolean(skill.instructions?.trim()),
        sourceMeta: {
            sourceType: skill.source?.kind || 'local',
            trustLevel: inferTrustLevel(skill),
            upstream: skill.source?.repo || skill.source?.url,
            fetchedAt: Date.now()
        },
        skill
    };
}

export function buildSkillIndex(input: BuildSkillIndexInput): IndexedSkillEntry[] {
    const raw = [...input.localSkills, ...input.marketSkills, ...input.repoSkills].map(toEntry);
    const deduped = new Map<string, IndexedSkillEntry>();

    // prefer local > repo > market when duplicates exist
    const priority = { local: 3, repo: 2, market: 1 };
    for (const entry of raw) {
        const current = deduped.get(entry.normalizedName);
        if (!current) {
            deduped.set(entry.normalizedName, entry);
            continue;
        }
        if (priority[entry.sourceMeta.sourceType] > priority[current.sourceMeta.sourceType]) {
            deduped.set(entry.normalizedName, entry);
        }
    }

    return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function searchSkillIndex(entries: IndexedSkillEntry[], query: string): IndexedSkillEntry[] {
    const term = query.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter((entry) =>
        entry.name.toLowerCase().includes(term) ||
        entry.description.toLowerCase().includes(term) ||
        entry.author.toLowerCase().includes(term) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(term))
    );
}

export function filterSkillIndexBySource(
    entries: IndexedSkillEntry[],
    sourceType: SkillIndexSourceType | 'all'
): IndexedSkillEntry[] {
    if (sourceType === 'all') return entries;
    return entries.filter((entry) => entry.sourceMeta.sourceType === sourceType);
}

