import type { Skill, SkillSourceMetadata } from '../store';

export type SkillSourceTrustLevel = 'high' | 'medium' | 'low';

export interface SkillSourceTrustFlags {
    archived: boolean;
    missingLicense: boolean;
    stale: boolean;
    lowPopularity: boolean;
}

export interface SkillSourceTrustReport {
    score: number;
    level: SkillSourceTrustLevel;
    reasons: string[];
    flags: SkillSourceTrustFlags;
}

const STALE_DAYS_THRESHOLD = 540;

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function toNumber(input: unknown): number | undefined {
    return typeof input === 'number' && Number.isFinite(input) ? input : undefined;
}

function normalizeLicense(value: string | undefined): string {
    return (value || '').trim().toUpperCase();
}

export function isLicenseMissing(license: string | undefined): boolean {
    const normalized = normalizeLicense(license);
    return !normalized || normalized === 'NOASSERTION' || normalized === 'UNLICENSED';
}

export function getSourceLastUpdatedDays(metadata: SkillSourceMetadata | undefined): number | null {
    if (!metadata) return null;
    const iso = metadata.updatedAt || metadata.pushedAt;
    if (!iso) return null;
    const parsed = Date.parse(iso);
    if (!Number.isFinite(parsed)) return null;

    const deltaMs = Date.now() - parsed;
    if (deltaMs < 0) return 0;
    return Math.floor(deltaMs / (24 * 60 * 60 * 1000));
}

export function getSkillSourceMetadata(skill: Partial<Skill>): SkillSourceMetadata | undefined {
    return skill.source?.metadata;
}

function inferLevel(score: number): SkillSourceTrustLevel {
    if (score >= 85) return 'high';
    if (score >= 65) return 'medium';
    return 'low';
}

function computeRepoScore(metadata: SkillSourceMetadata | undefined): {
    score: number;
    flags: SkillSourceTrustFlags;
    reasons: string[];
} {
    const stars = toNumber(metadata?.stargazersCount) ?? 0;
    const forks = toNumber(metadata?.forksCount) ?? 0;
    const archived = Boolean(metadata?.archived);
    const missingLicense = isLicenseMissing(metadata?.license);
    const staleDays = getSourceLastUpdatedDays(metadata);
    const stale = staleDays !== null && staleDays > STALE_DAYS_THRESHOLD;
    const lowPopularity = stars < 5;

    let score = 55;
    const reasons: string[] = [];

    if (archived) {
        score -= 40;
        reasons.push('Repository is archived.');
    }

    if (missingLicense) {
        score -= 12;
        reasons.push('License is missing or non-standard.');
    } else {
        score += 12;
    }

    if (stars >= 5000) score += 20;
    else if (stars >= 1000) score += 17;
    else if (stars >= 200) score += 14;
    else if (stars >= 50) score += 10;
    else if (stars >= 10) score += 6;
    else if (stars >= 1) score += 2;
    else score -= 6;

    if (forks >= 500) score += 8;
    else if (forks >= 100) score += 6;
    else if (forks >= 20) score += 4;
    else if (forks >= 5) score += 2;

    if (staleDays === null) {
        score -= 5;
    } else if (staleDays <= 30) {
        score += 14;
    } else if (staleDays <= 180) {
        score += 9;
    } else if (staleDays <= 365) {
        score += 4;
    } else if (staleDays <= 730) {
        score -= 8;
        reasons.push('Repository has not been updated for over one year.');
    } else {
        score -= 14;
        reasons.push('Repository appears inactive for a long period.');
    }

    if (lowPopularity) {
        reasons.push('Repository has very low adoption signals.');
    }

    return {
        score: clamp(Math.round(score), 0, 100),
        reasons,
        flags: {
            archived,
            missingLicense,
            stale,
            lowPopularity
        }
    };
}

export function evaluateSkillSourceTrust(skill: Partial<Skill>): SkillSourceTrustReport {
    const securityScore = clamp(skill.security?.score ?? 100, 0, 100);
    const metadata = getSkillSourceMetadata(skill);
    const hasExternalSource = skill.source?.kind === 'repo' || skill.source?.kind === 'market';

    if (!hasExternalSource) {
        const score = securityScore;
        return {
            score,
            level: inferLevel(score),
            reasons: [],
            flags: {
                archived: false,
                missingLicense: false,
                stale: false,
                lowPopularity: false
            }
        };
    }

    const repoSignals = computeRepoScore(metadata);
    const score = Math.round(securityScore * 0.6 + repoSignals.score * 0.4);
    const reasons = [...repoSignals.reasons];

    if (securityScore < 70) {
        reasons.push(`Skill security score is low (${securityScore}).`);
    }

    return {
        score,
        level: inferLevel(score),
        reasons,
        flags: repoSignals.flags
    };
}
