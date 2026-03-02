export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

export type SecurityCategory =
    | 'destructive'
    | 'remote-exec'
    | 'cmd-injection'
    | 'network-exfiltration'
    | 'privilege-escalation'
    | 'persistence'
    | 'secret-exposure'
    | 'sensitive-file-access';

export type SecurityConfidence = 'low' | 'medium' | 'high';

export type SecurityRiskLevel = 'safe' | 'review' | 'warning' | 'blocked';

export interface SkillAttachmentText {
    name: string;
    content: string;
}

export interface SkillSecurityIssue {
    ruleId: string;
    title: string;
    severity: SecuritySeverity;
    category: SecurityCategory;
    weight: number;
    hardTrigger: boolean;
    confidence: SecurityConfidence;
    source: string;
    snippet: string;
}

export interface SkillSecurityReport {
    score: number;
    riskLevel: SecurityRiskLevel;
    hardTriggered: boolean;
    issueCount: number;
    scannedSources: number;
    categoryCounts: Partial<Record<SecurityCategory, number>>;
    issues: SkillSecurityIssue[];
}

interface SecurityRule {
    id: string;
    title: string;
    severity: SecuritySeverity;
    category: SecurityCategory;
    weight: number;
    hardTrigger: boolean;
    confidence: SecurityConfidence;
    pattern: RegExp;
}

const SECURITY_RULES: SecurityRule[] = [
    // destructive
    {
        id: 'RM_RF_ROOT',
        title: 'Deletes root path',
        severity: 'critical',
        category: 'destructive',
        weight: 100,
        hardTrigger: true,
        confidence: 'high',
        pattern: /\brm\s+(-[A-Za-z]*\s+)*-[A-Za-z]*[rR][A-Za-z]*\s+\/(\s|$|;|\|)/i
    },
    {
        id: 'DISK_FORMAT',
        title: 'Formats or wipes disk',
        severity: 'critical',
        category: 'destructive',
        weight: 100,
        hardTrigger: true,
        confidence: 'high',
        pattern: /\b(mkfs(\.[a-z0-9]+)?|diskutil\s+erase(Disk|Volume)|dd\s+.*of=\/dev\/)\b/i
    },

    // remote exec
    {
        id: 'CURL_PIPE_SH',
        title: 'Remote script pipe execution',
        severity: 'critical',
        category: 'remote-exec',
        weight: 90,
        hardTrigger: true,
        confidence: 'high',
        pattern: /\b(curl|wget)\b[^|\n]*\|\s*(bash|sh|zsh|pwsh|powershell)\b/i
    },
    {
        id: 'BASE64_EXEC',
        title: 'Base64 decode and execute',
        severity: 'high',
        category: 'remote-exec',
        weight: 80,
        hardTrigger: false,
        confidence: 'high',
        pattern: /\bbase64\b[^|\n]*(--decode|-d)[^|\n]*\|\s*(bash|sh|node|python)\b/i
    },
    {
        id: 'EVAL_EXEC',
        title: 'Dynamic evaluation',
        severity: 'high',
        category: 'remote-exec',
        weight: 40,
        hardTrigger: false,
        confidence: 'medium',
        pattern: /\b(eval\s*\(|new Function\s*\(|exec\s*\(|execSync\s*\(|os\.system\s*\(|subprocess\.(run|Popen)\s*\()/i
    },

    // cmd injection
    {
        id: 'UNSAFE_ARG_INTERP',
        title: 'Untrusted argument interpolation',
        severity: 'high',
        category: 'cmd-injection',
        weight: 35,
        hardTrigger: false,
        confidence: 'medium',
        pattern: /(\$ARGUMENTS|\$\{[^}]*ARG[^}]*\}|\{\{[^}]*input[^}]*\}\}).*(bash|sh|cmd|powershell|node|python)/i
    },

    // network exfiltration
    {
        id: 'OUTBOUND_EXFIL',
        title: 'Unrestricted outbound upload',
        severity: 'high',
        category: 'network-exfiltration',
        weight: 40,
        hardTrigger: false,
        confidence: 'medium',
        pattern: /\b(curl|wget|Invoke-WebRequest|Invoke-RestMethod)\b[^\n]*(--data|--form|-T|upload|Authorization:|Bearer\s+\$?[A-Z_]+)/i
    },

    // privilege escalation
    {
        id: 'PRIV_ESCALATION',
        title: 'Privilege escalation command',
        severity: 'critical',
        category: 'privilege-escalation',
        weight: 90,
        hardTrigger: true,
        confidence: 'high',
        pattern: /\b(sudo\s+su\b|sudo\s+-i\b|chmod\s+777\b|chown\s+root\b|setuid\b)\b/i
    },

    // persistence
    {
        id: 'PERSISTENCE',
        title: 'Persistence via startup hooks',
        severity: 'high',
        category: 'persistence',
        weight: 45,
        hardTrigger: false,
        confidence: 'high',
        pattern: /\b(crontab\b|\/etc\/cron|systemctl\s+enable\b|schtasks\b|LaunchAgents|Startup\\|Run\\)\b/i
    },

    // secret exposure
    {
        id: 'SECRET_TOKEN',
        title: 'Possible hard-coded secret',
        severity: 'high',
        category: 'secret-exposure',
        weight: 60,
        hardTrigger: false,
        confidence: 'medium',
        pattern: /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*['"][A-Za-z0-9_-]{12,}['"]/i
    },

    // sensitive file access
    {
        id: 'SENSITIVE_FILE_READ',
        title: 'Sensitive credential file access',
        severity: 'high',
        category: 'sensitive-file-access',
        weight: 55,
        hardTrigger: false,
        confidence: 'high',
        pattern: /\b(~\/\.ssh\/|~\/\.aws\/credentials|~\/\.env|\/etc\/shadow|\/etc\/passwd|id_rsa|\.npmrc|\.pypirc)\b/i
    }
];

function extractSnippet(content: string, index: number, matchText: string): string {
    const start = Math.max(0, index - 36);
    const end = Math.min(content.length, index + matchText.length + 36);
    return content.slice(start, end).replace(/\s+/g, ' ').trim();
}

function getRiskLevel(score: number, hardTriggered: boolean): SecurityRiskLevel {
    if (hardTriggered || score < 40) return 'blocked';
    if (score < 70) return 'warning';
    if (score < 90) return 'review';
    return 'safe';
}

export function analyzeSkillSecurity(input: {
    instructions: string;
    attachments?: SkillAttachmentText[];
}): SkillSecurityReport {
    const sources: { name: string; content: string }[] = [
        { name: 'SKILL.md#instructions', content: input.instructions || '' }
    ];

    for (const attachment of input.attachments || []) {
        sources.push({
            name: `attachment:${attachment.name}`,
            content: attachment.content || ''
        });
    }

    const issues: SkillSecurityIssue[] = [];
    const uniquePenalties = new Set<string>();

    for (const source of sources) {
        if (!source.content.trim()) continue;

        for (const rule of SECURITY_RULES) {
            const match = source.content.match(rule.pattern);
            if (!match || match.index === undefined) continue;

            issues.push({
                ruleId: rule.id,
                title: rule.title,
                severity: rule.severity,
                category: rule.category,
                weight: rule.weight,
                hardTrigger: rule.hardTrigger,
                confidence: rule.confidence,
                source: source.name,
                snippet: extractSnippet(source.content, match.index, match[0])
            });

            uniquePenalties.add(rule.id);
        }
    }

    let penalty = 0;
    for (const ruleId of uniquePenalties) {
        const rule = SECURITY_RULES.find((item) => item.id === ruleId);
        if (rule) penalty += rule.weight;
    }

    const hardTriggered = issues.some((issue) => issue.hardTrigger);
    let score = Math.max(0, 100 - penalty);
    if (hardTriggered) {
        score = Math.min(score, 25);
    }

    const categoryCounts: Partial<Record<SecurityCategory, number>> = {};
    for (const issue of issues) {
        categoryCounts[issue.category] = (categoryCounts[issue.category] || 0) + 1;
    }

    return {
        score,
        riskLevel: getRiskLevel(score, hardTriggered),
        hardTriggered,
        issueCount: issues.length,
        scannedSources: sources.length,
        categoryCounts,
        issues
    };
}
