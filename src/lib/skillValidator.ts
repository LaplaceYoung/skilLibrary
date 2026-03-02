import type { Skill } from '../store';
import { analyzeSkillSecurity } from './securityScan';

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
    code: string;
    severity: ValidationSeverity;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
    infos: ValidationIssue[];
}

type PartialSkill = Partial<Skill>;

function makeIssue(
    code: string,
    severity: ValidationSeverity,
    message: string,
    field?: string,
    details?: Record<string, unknown>
): ValidationIssue {
    return { code, severity, message, field, details };
}

function normalizeList(items: string[] | undefined): string[] {
    if (!Array.isArray(items)) return [];
    return items.map((item) => item.trim()).filter(Boolean);
}

function hasDuplicates(items: string[]): boolean {
    return new Set(items.map((item) => item.toLowerCase())).size !== items.length;
}

export function validateSkillDraft(skill: PartialSkill): ValidationResult {
    const issues: ValidationIssue[] = [];

    const name = skill.name?.trim() || '';
    const description = skill.description?.trim() || '';
    const author = skill.author?.trim() || '';
    const instructions = skill.instructions?.trim() || '';
    const tags = normalizeList(skill.tags);
    const tools = normalizeList(skill.allowedTools);

    if (!name) {
        issues.push(makeIssue('SKILL_NAME_REQUIRED', 'error', 'Skill name is required.', 'name'));
    } else {
        if (name.length > 80) {
            issues.push(makeIssue('SKILL_NAME_TOO_LONG', 'error', 'Skill name exceeds 80 characters.', 'name'));
        }
        if (/[\\/:*?"<>|]/.test(name)) {
            issues.push(makeIssue('SKILL_NAME_INVALID_CHAR', 'error', 'Skill name contains invalid path characters.', 'name'));
        }
    }

    if (!instructions) {
        issues.push(makeIssue('SKILL_INSTRUCTIONS_REQUIRED', 'error', 'Skill instructions cannot be empty.', 'instructions'));
    } else if (instructions.length < 16) {
        issues.push(makeIssue('SKILL_INSTRUCTIONS_TOO_SHORT', 'warning', 'Skill instructions are too short for reliable behavior.', 'instructions'));
    }

    if (description.length > 300) {
        issues.push(makeIssue('SKILL_DESCRIPTION_TOO_LONG', 'warning', 'Description exceeds 300 characters.', 'description'));
    }

    if (!author) {
        issues.push(makeIssue('SKILL_AUTHOR_MISSING', 'info', 'Author is empty. Consider adding ownership metadata.', 'author'));
    }

    if (hasDuplicates(tags)) {
        issues.push(makeIssue('SKILL_TAGS_DUPLICATED', 'warning', 'Duplicate tags detected.', 'tags'));
    }

    if (hasDuplicates(tools)) {
        issues.push(makeIssue('SKILL_TOOLS_DUPLICATED', 'warning', 'Duplicate allowed tools detected.', 'allowedTools'));
    }

    for (const tool of tools) {
        if (tool.length > 64) {
            issues.push(makeIssue('SKILL_TOOL_TOKEN_TOO_LONG', 'error', `Allowed tool token too long: ${tool.slice(0, 40)}...`, 'allowedTools'));
            break;
        }
    }

    if (skill.context === 'fork' && !(skill.agent || '').trim()) {
        issues.push(makeIssue('SKILL_AGENT_RECOMMENDED', 'warning', 'Context is "fork" but agent is not specified.', 'agent'));
    }

    const security = analyzeSkillSecurity({
        instructions,
        attachments: skill.attachments
    });
    if (security.hardTriggered) {
        issues.push(
            makeIssue(
                'SKILL_SECURITY_HARD_TRIGGERED',
                'error',
                'Security scanner triggered hard block rules.',
                'instructions',
                { score: security.score, issueCount: security.issueCount }
            )
        );
    } else if (security.score < 70) {
        issues.push(
            makeIssue(
                'SKILL_SECURITY_LOW_SCORE',
                'warning',
                `Security score is low (${security.score}). Review risky instructions.`,
                'instructions',
                { score: security.score, issueCount: security.issueCount }
            )
        );
    }

    const errors = issues.filter((issue) => issue.severity === 'error');
    const warnings = issues.filter((issue) => issue.severity === 'warning');
    const infos = issues.filter((issue) => issue.severity === 'info');

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        infos
    };
}

export interface ValidationSummary {
    checkedAt: number;
    validCount: number;
    invalidCount: number;
    warningCount: number;
}

export function summarizeValidation(result: ValidationResult): ValidationSummary {
    return {
        checkedAt: Date.now(),
        validCount: result.isValid ? 1 : 0,
        invalidCount: result.isValid ? 0 : 1,
        warningCount: result.warnings.length
    };
}

