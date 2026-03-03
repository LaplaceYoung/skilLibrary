import type { Skill } from '../store';
import {
    evaluateSkillSourceTrust,
    getSkillSourceMetadata,
    getSourceLastUpdatedDays,
    isLicenseMissing
} from './sourceTrust';

export type ComplianceDecisionType = 'allow' | 'warn' | 'deny';

export type ComplianceReasonCode =
    | 'COMPLIANT'
    | 'SKILL_NAME_REQUIRED'
    | 'SKILL_INSTRUCTIONS_REQUIRED'
    | 'SKILL_SECURITY_HARD_BLOCK'
    | 'SKILL_TOOL_SCOPE_BROAD'
    | 'SKILL_SOURCE_UNTRUSTED'
    | 'SKILL_SOURCE_ARCHIVED'
    | 'SKILL_SOURCE_LICENSE_MISSING'
    | 'SKILL_SOURCE_STALE'
    | 'SKILL_SOURCE_LOW_TRUST'
    | 'MCP_COMMAND_NOT_ALLOWED'
    | 'MCP_ARGS_INVALID'
    | 'MCP_ARGS_TOO_MANY'
    | 'MCP_ARGS_TOO_LONG'
    | 'MARKET_URL_INVALID'
    | 'MARKET_HOST_NOT_ALLOWED';

export interface ComplianceDecision {
    decision: ComplianceDecisionType;
    reasonCode: ComplianceReasonCode;
    message: string;
    details?: Record<string, unknown>;
}

export type SkillComplianceAction = 'save' | 'import' | 'install' | 'export';

export interface SkillComplianceInput {
    skill: Partial<Skill>;
    action: SkillComplianceAction;
}

const DEFAULT_ALLOWED_MCP_COMMANDS = new Set(['npx', 'node']);
const DEFAULT_ALLOWED_MARKET_HOSTS = ['claude-plugins.dev', 'skillsllm.com'];
const MAX_ALLOWED_TOOLS = 20;
const MAX_MCP_ARGS = 32;
const MAX_MCP_ARG_LENGTH = 256;
const SOURCE_STALE_DAYS_THRESHOLD = 540;
const LOW_TRUST_SCORE_THRESHOLD = 60;

function allow(message = 'Compliant'): ComplianceDecision {
    return { decision: 'allow', reasonCode: 'COMPLIANT', message };
}

function warn(reasonCode: ComplianceReasonCode, message: string, details?: Record<string, unknown>): ComplianceDecision {
    return { decision: 'warn', reasonCode, message, details };
}

function deny(reasonCode: ComplianceReasonCode, message: string, details?: Record<string, unknown>): ComplianceDecision {
    return { decision: 'deny', reasonCode, message, details };
}

export function evaluateSkillCompliance(input: SkillComplianceInput): ComplianceDecision {
    const name = input.skill.name?.trim() || '';
    const instructions = input.skill.instructions?.trim() || '';

    if (!name) {
        return deny('SKILL_NAME_REQUIRED', 'Skill name is required.');
    }
    if (!instructions) {
        return deny('SKILL_INSTRUCTIONS_REQUIRED', 'Skill instructions cannot be empty.');
    }

    if (input.action !== 'save' && input.skill.security?.hardTriggered) {
        return deny('SKILL_SECURITY_HARD_BLOCK', 'Skill is blocked by security policy.', {
            riskLevel: input.skill.security.riskLevel,
            score: input.skill.security.score
        });
    }

    const allowedToolsCount = input.skill.allowedTools?.length || 0;
    if (allowedToolsCount > MAX_ALLOWED_TOOLS) {
        return warn(
            'SKILL_TOOL_SCOPE_BROAD',
            `Skill allows too many tools (${allowedToolsCount}). Consider narrowing scope.`,
            { allowedToolsCount, maxAllowedTools: MAX_ALLOWED_TOOLS }
        );
    }

    if (input.action !== 'save' && input.skill.source?.kind === 'repo' && !input.skill.source.repo) {
        return warn('SKILL_SOURCE_UNTRUSTED', 'Imported skill source metadata is incomplete.');
    }

    const sourceMetadata = getSkillSourceMetadata(input.skill);
    if (input.action !== 'save' && sourceMetadata?.archived) {
        return deny('SKILL_SOURCE_ARCHIVED', 'Source repository is archived. Installation/import is blocked.', {
            source: input.skill.source?.repo || input.skill.source?.url
        });
    }

    if (input.action !== 'save' && sourceMetadata && isLicenseMissing(sourceMetadata.license)) {
        return warn(
            'SKILL_SOURCE_LICENSE_MISSING',
            'Source repository has missing or unclear license metadata. Review usage rights before installing.',
            { license: sourceMetadata.license || 'unknown' }
        );
    }

    const staleDays = getSourceLastUpdatedDays(sourceMetadata);
    if (input.action !== 'save' && staleDays !== null && staleDays > SOURCE_STALE_DAYS_THRESHOLD) {
        return warn(
            'SKILL_SOURCE_STALE',
            `Source repository appears stale (${staleDays} days since last update).`,
            { staleDays, threshold: SOURCE_STALE_DAYS_THRESHOLD }
        );
    }

    if (input.action !== 'save' && sourceMetadata) {
        const sourceTrust = evaluateSkillSourceTrust(input.skill);
        if (sourceTrust.score < LOW_TRUST_SCORE_THRESHOLD) {
            return warn(
                'SKILL_SOURCE_LOW_TRUST',
                `Source trust score is low (${sourceTrust.score}). Manual review is recommended before install/import.`,
                {
                    trustScore: sourceTrust.score,
                    reasons: sourceTrust.reasons.slice(0, 3)
                }
            );
        }
    }

    return allow();
}

export interface McpCommandComplianceInput {
    command: string;
    args: string;
    allowedCommands?: Set<string>;
    maxArgs?: number;
    maxArgLength?: number;
}

export function evaluateMcpCommandCompliance(input: McpCommandComplianceInput): ComplianceDecision {
    const allowedCommands = input.allowedCommands || DEFAULT_ALLOWED_MCP_COMMANDS;
    const maxArgs = input.maxArgs || MAX_MCP_ARGS;
    const maxArgLength = input.maxArgLength || MAX_MCP_ARG_LENGTH;

    const command = input.command.trim();
    if (!allowedCommands.has(command)) {
        return deny('MCP_COMMAND_NOT_ALLOWED', `Command "${command}" is not in allowlist.`, {
            allowed: Array.from(allowedCommands)
        });
    }

    const parsedArgs = input.args
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

    if (parsedArgs.length > maxArgs) {
        return deny('MCP_ARGS_TOO_MANY', `Too many args (${parsedArgs.length}).`, { maxArgs });
    }

    for (const arg of parsedArgs) {
        if (arg.length > maxArgLength) {
            return deny('MCP_ARGS_TOO_LONG', `Arg too long: "${arg.slice(0, 32)}..."`, { maxArgLength });
        }
        if (/[\r\n\0]/.test(arg) || !/^[A-Za-z0-9@%_./:=,+-]+$/.test(arg)) {
            return deny('MCP_ARGS_INVALID', `Unsupported arg token "${arg}".`);
        }
    }

    return allow();
}

export interface MarketUrlComplianceInput {
    url: string;
    allowedHosts?: string[];
}

export function evaluateMarketUrlCompliance(input: MarketUrlComplianceInput): ComplianceDecision {
    let parsed: URL;
    try {
        parsed = new URL(input.url);
    } catch {
        return deny('MARKET_URL_INVALID', 'Market URL is invalid.');
    }

    if (parsed.protocol !== 'https:') {
        return deny('MARKET_URL_INVALID', 'Only HTTPS market URLs are allowed.');
    }

    const allowedHosts = (input.allowedHosts || DEFAULT_ALLOWED_MARKET_HOSTS).map((host) => host.toLowerCase());
    const host = parsed.hostname.toLowerCase();
    const allowed = allowedHosts.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
    if (!allowed) {
        return deny('MARKET_HOST_NOT_ALLOWED', `Host "${host}" is not allowlisted.`, { allowedHosts });
    }

    return allow();
}
