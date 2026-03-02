import React, { useEffect, useState } from 'react';
import { Brush, HardDrive, Zap, FolderSync, Unlink, AlertTriangle, Languages } from 'lucide-react';
import { del } from 'idb-keyval';
import { useSkillStore, type LocaleType } from '../store';
import { useMcpStore } from '../store/mcpStore';
import { Select } from '../components/Select';
import { useI18n } from '../i18n';

type PickerWindow = Window &
    typeof globalThis & {
        showDirectoryPicker?: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
    };

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return String(error);
}

const APP_LOCAL_STORAGE_KEYS = ['agent-skill-forge-storage-v5', 'mcp-storage'];

export const Settings: React.FC = () => {
    const {
        dirHandle,
        setDirHandle,
        isSyncing,
        syncFromLocal,
        initLocalConnection,
        activeTheme,
        activeLocale,
        setTheme,
        setLocale,
        addToast
    } = useSkillStore();

    const {
        isConnected,
        isConnecting,
        proxyUrl,
        authToken,
        command,
        args,
        tools,
        setProxyUrl,
        setAuthToken,
        setCommand,
        setArgs,
        connect,
        disconnect
    } = useMcpStore();

    const { t } = useI18n();
    const [isConnectingDir, setIsConnectingDir] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        void initLocalConnection();
    }, [initLocalConnection]);

    const handleConnect = async () => {
        try {
            setIsConnectingDir(true);
            const picker = (window as PickerWindow).showDirectoryPicker;
            if (!picker) {
                addToast('Current browser does not support directory picker.', 'error');
                return;
            }
            const handle = await picker({ mode: 'readwrite' });
            await setDirHandle(handle);
            await syncFromLocal();
            addToast(`Connected directory: ${handle.name}`, 'success');
        } catch (error: unknown) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
                addToast(`Failed to connect local directory: ${getErrorMessage(error)}`, 'error');
            }
        } finally {
            setIsConnectingDir(false);
        }
    };

    const handleDisconnect = async () => {
        await setDirHandle(null);
        addToast('Disconnected local directory.', 'info');
    };

    const handleClearData = async () => {
        if (!confirmClear) {
            setConfirmClear(true);
            setTimeout(() => setConfirmClear(false), 3000);
            addToast('Click again within 3 seconds to confirm clear.', 'info');
            return;
        }

        try {
            for (const key of APP_LOCAL_STORAGE_KEYS) {
                localStorage.removeItem(key);
            }
            await del('agent-forge-dir-handle');
            window.location.href = '/';
        } catch (error) {
            console.error(error);
            addToast('Failed to clear local data.', 'error');
        }
    };

    return (
        <div className="space-y-6 ui-page-enter max-w-2xl">
            <div className="space-y-1">
                <h2 className="text-3xl font-bold tracking-tight text-text-main">System Settings</h2>
                <p className="text-text-muted text-sm">Manage local sync, appearance, and MCP integration.</p>
            </div>

            <div className="space-y-4">
                <div className="themed-panel p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[80px] rounded-full pointer-events-none" />
                    <div className="flex items-start gap-4 relative z-10">
                        <div className="p-3 bg-brand/20 text-brand rounded-2xl">
                            <FolderSync className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-text-main mb-1">Local File System</h3>
                            <p className="text-sm text-text-muted mb-4 leading-relaxed">
                                Grant read/write permission to your local skills directory for direct synchronization.
                            </p>

                            {dirHandle ? (
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 bg-black/40 border border-green-500/20 rounded-xl p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-sm font-mono text-green-400">{dirHandle.name} linked</span>
                                        </div>
                                        <button
                                            onClick={() => void syncFromLocal()}
                                            disabled={isSyncing}
                                            className="ui-btn-secondary px-3 py-1.5 text-sm"
                                        >
                                            {isSyncing ? 'Syncing...' : 'Resync'}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => void handleDisconnect()}
                                        className="ui-btn-danger px-3 py-3"
                                        title="Disconnect"
                                    >
                                        <Unlink className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => void handleConnect()}
                                    disabled={isConnectingDir}
                                    className="ui-btn-primary px-6"
                                >
                                    {isConnectingDir ? 'Authorizing...' : 'Connect Directory'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="themed-panel p-6 flex items-start gap-4">
                    <div className="p-3 bg-brand/10 text-brand rounded-2xl">
                        <HardDrive className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-text-main mb-1">Local Storage</h3>
                        <p className="text-sm text-text-muted mb-4 leading-relaxed">
                            All skill metadata and UI settings are stored locally in your browser.
                        </p>
                        <button
                            onClick={() => void handleClearData()}
                            className={`ui-btn-danger text-sm ${
                                confirmClear
                                    ? 'bg-red-500 text-white border-red-500 animate-pulse'
                                    : ''
                            }`}
                        >
                            <AlertTriangle className="w-4 h-4" />
                            {confirmClear ? 'Click again to confirm clear' : 'Clear all local data'}
                        </button>
                    </div>
                </div>

                <div className="themed-panel p-6 flex flex-col items-start gap-4">
                    <div className="flex items-start gap-4 w-full">
                        <div className="p-3 bg-brand/10 text-brand rounded-[var(--radius-button)]">
                            <Brush className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-text-main mb-1">Appearance Theme</h3>
                            <p className="text-sm text-text-muted mb-4 leading-relaxed">
                                Switch theme tokens and the generated p5 background behavior.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button
                                    onClick={() => setTheme('geometric')}
                                    className={`text-left p-4 rounded-[var(--radius-base)] border transition-all ${
                                        activeTheme === 'geometric'
                                            ? 'border-brand bg-brand/5'
                                            : 'border-border-main hover:border-text-muted bg-bg-base/50'
                                    }`}
                                >
                                    <div className="font-mono text-sm font-bold text-text-main mb-2">Geometric Silence</div>
                                    <div className="ui-caption leading-tight">Minimal grid and restrained motion.</div>
                                </button>

                                <button
                                    onClick={() => setTheme('chromatic')}
                                    className={`text-left p-4 rounded-[var(--radius-base)] border transition-all ${
                                        activeTheme === 'chromatic'
                                            ? 'border-brand bg-brand/5'
                                            : 'border-border-main hover:border-text-muted bg-bg-base/50'
                                    }`}
                                >
                                    <div className="font-sans text-sm font-bold text-text-main mb-2">Chromatic Language</div>
                                    <div className="ui-caption leading-tight">Color interaction and harmonic waves.</div>
                                </button>

                                <button
                                    onClick={() => setTheme('organic')}
                                    className={`text-left p-4 rounded-[var(--radius-base)] border transition-all ${
                                        activeTheme === 'organic'
                                            ? 'border-brand bg-brand/5'
                                            : 'border-border-main hover:border-text-muted bg-bg-base/50'
                                    }`}
                                >
                                    <div className="font-sans text-sm font-bold text-text-main mb-2">Organic Systems</div>
                                    <div className="ui-caption leading-tight">Branch-like growth and softer rhythm.</div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="themed-panel p-6 flex items-start gap-4">
                    <div className="p-3 bg-brand/10 text-brand rounded-2xl">
                        <Languages className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-text-main mb-1">{t('settings.language.title')}</h3>
                        <p className="text-sm text-text-muted mb-4 leading-relaxed">{t('settings.language.description')}</p>
                        <div className="max-w-xs">
                            <label className="ui-field-label">{t('settings.language.label')}</label>
                            <div className="mt-2">
                                <Select
                                    value={activeLocale}
                                    onChange={(value) => setLocale(value as LocaleType)}
                                    options={[
                                        { value: 'zh-CN', label: t('settings.language.zh') },
                                        { value: 'en-US', label: t('settings.language.en') }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="themed-panel p-6 flex flex-col gap-4">
                    <div className="flex items-start gap-4 w-full">
                        <div className="p-3 bg-brand/10 text-brand rounded-[var(--radius-button)]">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-text-main mb-1">MCP Integration</h3>
                            <p className="text-sm text-text-muted mb-4 leading-relaxed">
                                Connect to a local MCP proxy endpoint. Run the proxy with <code>npm run mcp</code>.
                            </p>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="ui-field-label">Proxy SSE URL</label>
                                        <input
                                            type="text"
                                            value={proxyUrl}
                                            onChange={(event) => setProxyUrl(event.target.value)}
                                            disabled={isConnected || isConnecting}
                                            className="w-full ui-input"
                                            placeholder="http://localhost:3001/sse"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="ui-field-label">Auth token (optional)</label>
                                        <input
                                            type="password"
                                            value={authToken}
                                            onChange={(event) => setAuthToken(event.target.value)}
                                            disabled={isConnected || isConnecting}
                                            className="w-full ui-input font-mono"
                                            placeholder="MCP_PROXY_TOKEN"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="ui-field-label">Command</label>
                                        <input
                                            type="text"
                                            value={command}
                                            onChange={(event) => setCommand(event.target.value)}
                                            disabled={isConnected || isConnecting}
                                            className="w-full ui-input font-mono"
                                            placeholder="npx"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="ui-field-label">Arguments (comma-separated)</label>
                                    <input
                                        type="text"
                                        value={args}
                                        onChange={(event) => setArgs(event.target.value)}
                                        disabled={isConnected || isConnecting}
                                        className="w-full ui-input font-mono"
                                        placeholder="-y,@smithery/cli,run,@smithery/mcp-server-sqlite"
                                    />
                                </div>

                                {isConnected ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 bg-black/40 border border-green-500/20 rounded-xl p-3 flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-sm font-bold text-green-400">MCP proxy connected</span>
                                                <span className="ui-caption font-mono text-green-500/80 ml-auto">
                                                    {tools.length} tools loaded
                                                </span>
                                            </div>
                                            <button
                                                onClick={disconnect}
                                                className="ui-btn-danger px-4 py-3"
                                            >
                                                Disconnect
                                            </button>
                                        </div>

                                        {tools.length > 0 && (
                                            <div className="bg-bg-action/50 p-4 rounded-xl border border-border-main space-y-2">
                                                <h4 className="ui-kicker mb-3">Available tools</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                                                    {tools.map((tool) => (
                                                        <div key={tool.name} className="bg-white/5 p-2 rounded-lg border border-white/5">
                                                            <p className="font-mono text-xs text-brand font-bold">{tool.name}</p>
                                                            <p className="ui-caption line-clamp-1 mt-1">
                                                                {tool.description || 'No description'}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        onClick={connect}
                                        disabled={isConnecting}
                                        className="ui-btn-primary w-full py-3"
                                    >
                                        {isConnecting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-text-main/20 border-t-text-main rounded-full animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            'Connect proxy and load tools'
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

