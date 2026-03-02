import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { useSkillStore } from './index';
import { evaluateMcpCommandCompliance } from '../lib/compliancePolicy';
import { createTraceId } from '../lib/auditLog';

export interface McpTool {
    name: string;
    description?: string;
    inputSchema?: Record<string, unknown>;
}

interface McpConnectionDiagnostics {
    lastConnectedAt: number | null;
    lastError: string | null;
    lastTraceId: string | null;
}

interface McpPolicyViolation {
    at: number;
    traceId: string;
    reason: string;
    reasonCode: string;
}

interface McpState {
    isConnected: boolean;
    isConnecting: boolean;
    proxyUrl: string; // Default: http://localhost:3001/sse
    authToken: string; // Optional proxy auth token
    command: string; // Default: npx
    args: string; // Default: -y,@smithery/cli,run,@smithery/mcp-server-sqlite
    tools: McpTool[];
    client: Client | null;
    transport: SSEClientTransport | null;
    connectionDiagnostics: McpConnectionDiagnostics;
    policyViolations: McpPolicyViolation[];

    setProxyUrl: (url: string) => void;
    setAuthToken: (token: string) => void;
    setCommand: (cmd: string) => void;
    setArgs: (args: string) => void;
    connect: () => Promise<void>;
    disconnect: () => void;
    fetchTools: () => Promise<void>;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

export const useMcpStore = create<McpState>()(
    persist(
        (set, get) => ({
            isConnected: false,
            isConnecting: false,
            proxyUrl: 'http://localhost:3001/sse',
            authToken: '',
            command: 'npx',
            args: '-y,@smithery/cli,run,@smithery/mcp-server-sqlite',
            tools: [],
            client: null,
            transport: null,
            connectionDiagnostics: {
                lastConnectedAt: null,
                lastError: null,
                lastTraceId: null
            },
            policyViolations: [],

            setProxyUrl: (url) => set({ proxyUrl: url }),
            setAuthToken: (token) => set({ authToken: token }),
            setCommand: (cmd) => set({ command: cmd }),
            setArgs: (args) => set({ args }),

            connect: async () => {
                const { proxyUrl, authToken, command, args, disconnect } = get();
                const traceId = createTraceId();

                useSkillStore.getState().addAuditEvent({
                    traceId,
                    eventType: 'mcp-connect',
                    status: 'started',
                    target: proxyUrl,
                    message: `Starting MCP connect with command "${command}".`
                });

                if (get().isConnected) {
                    disconnect();
                }

                set({ isConnecting: true });

                const compliance = evaluateMcpCommandCompliance({ command, args });
                if (compliance.decision === 'deny') {
                    const violation: McpPolicyViolation = {
                        at: Date.now(),
                        traceId,
                        reason: compliance.message,
                        reasonCode: compliance.reasonCode
                    };

                    set((state) => ({
                        isConnecting: false,
                        connectionDiagnostics: {
                            lastConnectedAt: state.connectionDiagnostics.lastConnectedAt,
                            lastError: compliance.message,
                            lastTraceId: traceId
                        },
                        policyViolations: [violation, ...state.policyViolations].slice(0, 200)
                    }));

                    useSkillStore.getState().addToast(compliance.message, 'error');
                    useSkillStore.getState().addAuditEvent({
                        traceId,
                        eventType: 'mcp-connect',
                        status: 'blocked',
                        target: proxyUrl,
                        reasonCode: compliance.reasonCode,
                        message: compliance.message
                    });
                    return;
                }

                try {
                    const url = new URL(proxyUrl);
                    if (command) url.searchParams.set('cmd', command);
                    if (args) url.searchParams.set('args', args);
                    if (authToken.trim()) url.searchParams.set('token', authToken.trim());

                    console.log('Connecting to MCP Proxy:', url.toString());

                    const transport = new SSEClientTransport(new URL(url.toString()));
                    transport.onclose = () => {
                        console.log('MCP SSE Transport closed');
                        set({ isConnected: false, tools: [], client: null, transport: null });
                    };
                    transport.onerror = (err) => {
                        console.error('MCP SSE Transport error:', err);
                        useSkillStore.getState().addToast('MCP 连接发生错误', 'error');
                        set((state) => ({
                            isConnected: false,
                            tools: [],
                            client: null,
                            transport: null,
                            connectionDiagnostics: {
                                lastConnectedAt: state.connectionDiagnostics.lastConnectedAt,
                                lastError: 'MCP transport error',
                                lastTraceId: traceId
                            }
                        }));
                    };

                    const client = new Client(
                        {
                            name: 'agent-skill-forge-ide',
                            version: '1.0.0'
                        },
                        {
                            capabilities: {}
                        }
                    );

                    await client.connect(transport);
                    console.log('MCP Client Connected Successfully!');

                    set({
                        isConnected: true,
                        isConnecting: false,
                        client,
                        transport,
                        connectionDiagnostics: {
                            lastConnectedAt: Date.now(),
                            lastError: null,
                            lastTraceId: traceId
                        }
                    });

                    await get().fetchTools();
                    useSkillStore.getState().addToast('已成功连接 MCP 服务端工具！', 'success');
                    useSkillStore.getState().addAuditEvent({
                        traceId,
                        eventType: 'mcp-connect',
                        status: 'success',
                        target: proxyUrl,
                        message: 'MCP connection established and tools fetched.'
                    });
                } catch (error: unknown) {
                    console.error('Failed to connect MCP:', error);
                    const message = getErrorMessage(error);
                    useSkillStore.getState().addToast(`MCP 连接失败: ${message}`, 'error');
                    set((state) => ({
                        isConnecting: false,
                        isConnected: false,
                        client: null,
                        transport: null,
                        connectionDiagnostics: {
                            lastConnectedAt: state.connectionDiagnostics.lastConnectedAt,
                            lastError: message,
                            lastTraceId: traceId
                        }
                    }));
                    useSkillStore.getState().addAuditEvent({
                        traceId,
                        eventType: 'mcp-error',
                        status: 'failed',
                        target: proxyUrl,
                        reasonCode: 'MCP_CONNECT_FAILED',
                        message
                    });
                }
            },

            disconnect: async () => {
                const traceId = createTraceId();
                const { client, transport } = get();
                if (client) {
                    try {
                        await client.close();
                    } catch (error) {
                        console.warn('Failed to close MCP client cleanly', error);
                    }
                }
                if (transport) {
                    try {
                        await transport.close();
                    } catch (error) {
                        console.warn('Failed to close MCP transport cleanly', error);
                    }
                }
                set({ isConnected: false, isConnecting: false, tools: [], client: null, transport: null });
                useSkillStore.getState().addAuditEvent({
                    traceId,
                    eventType: 'mcp-disconnect',
                    status: 'success',
                    target: get().proxyUrl,
                    message: 'MCP disconnected.'
                });
            },

            fetchTools: async () => {
                const { client, isConnected } = get();
                if (!isConnected || !client) return;

                try {
                    const response = await client.listTools();
                    set({ tools: response.tools as McpTool[] });
                } catch (error) {
                    console.error('Failed to fetch MCP tools:', error);
                    useSkillStore.getState().addToast('获取工具列表失败', 'error');
                    useSkillStore.getState().addAuditEvent({
                        traceId: createTraceId(),
                        eventType: 'mcp-error',
                        status: 'failed',
                        target: get().proxyUrl,
                        reasonCode: 'MCP_FETCH_TOOLS_FAILED',
                        message: getErrorMessage(error)
                    });
                }
            }
        }),
        {
            name: 'mcp-storage',
            partialize: (state) => ({
                proxyUrl: state.proxyUrl,
                authToken: state.authToken,
                command: state.command,
                args: state.args
            })
        }
    )
);
