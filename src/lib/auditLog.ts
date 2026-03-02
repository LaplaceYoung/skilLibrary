import { v4 as uuidv4 } from 'uuid';

export type AuditEventType =
    | 'import-local'
    | 'import-repo'
    | 'install-project'
    | 'install-library'
    | 'export-script'
    | 'save-skill'
    | 'sync-local'
    | 'mcp-connect'
    | 'mcp-disconnect'
    | 'mcp-error';

export type AuditEventStatus = 'started' | 'success' | 'failed' | 'blocked' | 'cancelled';
export type AuditActor = 'user' | 'system';

export interface AuditEvent {
    id: string;
    traceId: string;
    eventType: AuditEventType;
    status: AuditEventStatus;
    actor: AuditActor;
    target: string;
    message: string;
    reasonCode?: string;
    metadata?: Record<string, unknown>;
    timestamp: number;
}

export interface AuditEventInput {
    traceId?: string;
    eventType: AuditEventType;
    status: AuditEventStatus;
    actor?: AuditActor;
    target: string;
    message: string;
    reasonCode?: string;
    metadata?: Record<string, unknown>;
    timestamp?: number;
}

export function createTraceId(): string {
    return `${Date.now().toString(36)}-${uuidv4().slice(0, 8)}`;
}

export function createAuditEvent(input: AuditEventInput): AuditEvent {
    return {
        id: uuidv4(),
        traceId: input.traceId || createTraceId(),
        eventType: input.eventType,
        status: input.status,
        actor: input.actor || 'user',
        target: input.target,
        message: input.message,
        reasonCode: input.reasonCode,
        metadata: input.metadata,
        timestamp: input.timestamp || Date.now()
    };
}
