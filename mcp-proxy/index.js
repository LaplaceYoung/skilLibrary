import express from 'express';
import cors from 'cors';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
const AUTH_TOKEN = (process.env.MCP_PROXY_TOKEN || '').trim();
const ALLOWED_COMMANDS = new Set(
    (process.env.MCP_ALLOWED_COMMANDS || 'npx,node')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
);
const ALLOWED_MARKET_HOSTS = (process.env.MCP_ALLOWED_MARKET_HOSTS || 'claude-plugins.dev,skillsllm.com')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
const MAX_ARG_COUNT = 32;
const MAX_ARG_LENGTH = 256;

app.use(
    cors({
        origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
        methods: ['GET', 'POST', 'OPTIONS'],
        credentials: true
    })
);

app.use(express.json());

const transports = new Map();

function createTraceId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

app.use((req, res, next) => {
    const traceId = createTraceId();
    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);
    next();
});

function sendPolicyError(res, status, message, reasonCode, traceId) {
    res.status(status);
    res.setHeader('x-policy-decision', 'deny');
    res.json({
        error: message,
        reasonCode,
        traceId,
        policyDecision: 'deny'
    });
}

function makePolicyError(status, message, reasonCode) {
    const error = new Error(message);
    error.status = status;
    error.reasonCode = reasonCode;
    error.policyDecision = 'deny';
    return error;
}

function getRequestToken(req) {
    const headerToken = typeof req.headers['x-mcp-token'] === 'string' ? req.headers['x-mcp-token'] : '';
    const queryToken = typeof req.query.token === 'string' ? req.query.token : '';
    return (headerToken || queryToken || '').trim();
}

function requireAuth(req, res) {
    if (!AUTH_TOKEN) return true;

    if (getRequestToken(req) !== AUTH_TOKEN) {
        sendPolicyError(res, 401, 'Unauthorized', 'AUTH_TOKEN_REQUIRED', req.traceId);
        return false;
    }

    return true;
}

function parseCommand(value) {
    const command = (typeof value === 'string' ? value : '').trim() || 'npx';
    if (!ALLOWED_COMMANDS.has(command)) {
        throw makePolicyError(403, `Command "${command}" is not allowed`, 'MCP_COMMAND_NOT_ALLOWED');
    }
    return command;
}

function parseArgs(value) {
    const raw = (typeof value === 'string' ? value : '').trim();
    if (!raw) return [];

    const args = raw
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    if (args.length > MAX_ARG_COUNT) {
        throw makePolicyError(400, `Too many args (max ${MAX_ARG_COUNT})`, 'MCP_ARGS_TOO_MANY');
    }

    for (const arg of args) {
        if (arg.length > MAX_ARG_LENGTH) {
            throw makePolicyError(400, `Arg too long (max ${MAX_ARG_LENGTH} chars)`, 'MCP_ARGS_TOO_LONG');
        }
        if (/[\r\n\0]/.test(arg) || !/^[A-Za-z0-9@%_./:=,+-]+$/.test(arg)) {
            throw makePolicyError(400, `Unsupported arg token: ${arg}`, 'MCP_ARGS_INVALID');
        }
    }

    return args;
}

function isAllowedMarketHost(hostname) {
    const target = hostname.toLowerCase();
    return ALLOWED_MARKET_HOSTS.some((allowedHost) => target === allowedHost || target.endsWith(`.${allowedHost}`));
}

function handleRouteError(req, res, error) {
    if (error && typeof error === 'object' && 'status' in error) {
        return sendPolicyError(
            res,
            Number(error.status) || 500,
            error.message || 'Policy denied request',
            error.reasonCode || 'POLICY_DENIED',
            req.traceId
        );
    }

    console.error(`[${req.traceId}] Route error:`, error);
    res.status(500).json({
        error: error?.message || 'Internal Server Error',
        traceId: req.traceId,
        policyDecision: 'deny'
    });
}

app.get('/sse', async (req, res) => {
    console.log(`[${req.traceId}] New SSE connection requested`);

    if (!requireAuth(req, res)) return;

    try {
        const cmd = parseCommand(req.query.cmd);
        const args = parseArgs(
            typeof req.query.args === 'string' ? req.query.args : '-y,@smithery/cli,run,@smithery/mcp-server-sqlite'
        );

        res.setHeader('x-policy-decision', 'allow');

        const transport = new SSEServerTransport('/message', res);
        await transport.start();

        const sessionId = transport.sessionId;
        transports.set(sessionId, transport);
        console.log(`[${req.traceId}] SSE established. Session: ${sessionId}`);
        console.log(`[${req.traceId}] [Session ${sessionId}] Spawning MCP: ${cmd} ${args.join(' ')}`);

        const stdioTransport = new StdioClientTransport({
            command: cmd,
            args,
            env: process.env
        });

        await stdioTransport.start();

        transport.onmessage = (message) => {
            stdioTransport.send(message).catch((err) => {
                console.error(`[${req.traceId}] [Session ${sessionId}] Failed to send to stdio:`, err);
            });
        };

        stdioTransport.onmessage = (message) => {
            transport.send(message).catch((err) => {
                console.error(`[${req.traceId}] [Session ${sessionId}] Failed to send to SSE:`, err);
            });
        };

        transport.onclose = () => {
            console.log(`[${req.traceId}] [Session ${sessionId}] SSE closed.`);
            transports.delete(sessionId);
            stdioTransport.close();
        };

        stdioTransport.onclose = () => {
            console.log(`[${req.traceId}] [Session ${sessionId}] Stdio closed.`);
            transport.close();
        };

        stdioTransport.onerror = (err) => {
            console.error(`[${req.traceId}] [Session ${sessionId}] Stdio error:`, err);
        };

        transport.onerror = (err) => {
            console.error(`[${req.traceId}] [Session ${sessionId}] SSE error:`, err);
        };
    } catch (error) {
        handleRouteError(req, res, error);
    }
});

app.post('/message', async (req, res) => {
    if (!requireAuth(req, res)) return;

    const sessionId = req.query.sessionId;
    if (!sessionId) {
        return sendPolicyError(res, 400, 'sessionId is required', 'SESSION_ID_REQUIRED', req.traceId);
    }

    const transport = transports.get(sessionId);
    if (!transport) {
        return sendPolicyError(res, 404, 'Session not found', 'SESSION_NOT_FOUND', req.traceId);
    }

    try {
        res.setHeader('x-policy-decision', 'allow');
        await transport.handlePostMessage(req, res);
    } catch (error) {
        handleRouteError(req, res, error);
    }
});

app.get('/api/proxy-market', async (req, res) => {
    if (!requireAuth(req, res)) return;

    const targetUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!targetUrl) {
        return sendPolicyError(res, 400, 'URL parameter is required', 'MARKET_URL_REQUIRED', req.traceId);
    }

    try {
        const parsedTargetUrl = new URL(targetUrl);
        if (parsedTargetUrl.protocol !== 'https:') {
            return sendPolicyError(res, 400, 'Only HTTPS URLs are allowed', 'MARKET_URL_PROTOCOL_BLOCKED', req.traceId);
        }
        if (!isAllowedMarketHost(parsedTargetUrl.hostname)) {
            return sendPolicyError(res, 403, 'Domain is not allowed', 'MARKET_HOST_NOT_ALLOWED', req.traceId);
        }

        console.log(`[${req.traceId}] Proxying market request to: ${targetUrl}`);
        const response = await fetch(parsedTargetUrl.toString());
        if (!response.ok) {
            throw makePolicyError(
                502,
                `Upstream returned ${response.status} ${response.statusText}`,
                'MARKET_UPSTREAM_FAILURE'
            );
        }

        const data = await response.json();
        res.setHeader('x-policy-decision', 'allow');

        if (Array.isArray(data)) {
            res.json(data);
            return;
        }

        if (data && typeof data === 'object') {
            res.json({
                ...data,
                _meta: {
                    traceId: req.traceId,
                    policyDecision: 'allow'
                }
            });
            return;
        }

        res.json({
            data,
            _meta: {
                traceId: req.traceId,
                policyDecision: 'allow'
            }
        });
    } catch (error) {
        handleRouteError(req, res, error);
    }
});

app.listen(PORT, HOST, () => {
    console.log(`MCP Proxy Server running on http://${HOST}:${PORT}`);
    console.log(`SSE Subscriptions available at http://${HOST}:${PORT}/sse`);
    console.log(`Allowed MCP commands: ${Array.from(ALLOWED_COMMANDS).join(', ')}`);
    console.log(`Allowed market hosts: ${ALLOWED_MARKET_HOSTS.join(', ') || '(none)'}`);
    if (AUTH_TOKEN) {
        console.log('MCP proxy auth token is enabled');
    } else {
        console.log('MCP proxy auth token is disabled (set MCP_PROXY_TOKEN to enable)');
    }
});
