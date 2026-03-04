import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';
import { LiveBackground } from './LiveBackground';
import { useSkillStore } from '../store';

const GO_SHORTCUT_TIMEOUT_MS = 1500;

function isEditableTarget(target: EventTarget | null): boolean {
    return target instanceof HTMLElement &&
        (target.isContentEditable ||
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.getAttribute('role') === 'textbox');
}

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeTheme } = useSkillStore();
    const navigate = useNavigate();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isGoShortcutArmed, setIsGoShortcutArmed] = useState(false);
    const goShortcutTimerRef = useRef<number | null>(null);

    const clearGoShortcut = useCallback(() => {
        if (goShortcutTimerRef.current) {
            window.clearTimeout(goShortcutTimerRef.current);
            goShortcutTimerRef.current = null;
        }
        setIsGoShortcutArmed(false);
    }, []);

    const armGoShortcut = useCallback(() => {
        if (goShortcutTimerRef.current) {
            window.clearTimeout(goShortcutTimerRef.current);
        }
        setIsGoShortcutArmed(true);
        goShortcutTimerRef.current = window.setTimeout(() => {
            setIsGoShortcutArmed(false);
            goShortcutTimerRef.current = null;
        }, GO_SHORTCUT_TIMEOUT_MS);
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const key = event.key.toLowerCase();
            const editableTarget = isEditableTarget(event.target);

            if ((event.ctrlKey || event.metaKey) && key === 'k') {
                if (editableTarget) return;

                event.preventDefault();
                setIsMobileNavOpen(false);
                clearGoShortcut();
                setIsCommandPaletteOpen((prev) => !prev);
                return;
            }

            if (event.key === 'Escape') {
                clearGoShortcut();
                if (isCommandPaletteOpen) {
                    setIsCommandPaletteOpen(false);
                    return;
                }

                if (isMobileNavOpen) {
                    setIsMobileNavOpen(false);
                }
                return;
            }

            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (editableTarget) return;
            if (isCommandPaletteOpen) return;

            if (key === 'g') {
                event.preventDefault();
                armGoShortcut();
                return;
            }

            if (!isGoShortcutArmed) return;

            const goShortcutRoute: Record<string, string> = {
                h: '/',
                e: '/editor',
                s: '/simulator',
                ',': '/settings'
            };

            const nextPath = goShortcutRoute[key];
            if (!nextPath) {
                clearGoShortcut();
                return;
            }

            event.preventDefault();
            setIsMobileNavOpen(false);
            setIsCommandPaletteOpen(false);
            clearGoShortcut();
            navigate(nextPath);
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [armGoShortcut, clearGoShortcut, isCommandPaletteOpen, isGoShortcutArmed, isMobileNavOpen, navigate]);

    useEffect(() => {
        return () => {
            if (goShortcutTimerRef.current) {
                window.clearTimeout(goShortcutTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isMobileNavOpen && !isCommandPaletteOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isCommandPaletteOpen, isMobileNavOpen]);

    const closeMobileNav = () => {
        clearGoShortcut();
        setIsMobileNavOpen(false);
    };
    const openCommandPalette = () => {
        clearGoShortcut();
        setIsMobileNavOpen(false);
        setIsCommandPaletteOpen(true);
    };

    return (
        <div className="flex w-full min-h-screen bg-bg-base text-text-main">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-[120] ui-btn-secondary"
            >
                跳转到主内容
            </a>

            <LiveBackground key={activeTheme || 'default'} />

            <Sidebar className="hidden lg:flex h-screen sticky top-0 shrink-0 z-20" />

            <button
                type="button"
                onClick={openCommandPalette}
                aria-label="打开命令面板"
                className="hidden lg:inline-flex fixed top-4 right-4 z-30 ui-btn-secondary px-3 py-2 text-sm"
            >
                <Search className="w-4 h-4" />
                命令
                <kbd className="px-2 py-0.5 rounded-md border border-border-main bg-bg-action text-[11px] font-mono text-text-muted">
                    Ctrl K
                </kbd>
                <kbd
                    className={`px-2 py-0.5 rounded-md border text-[11px] font-mono ${
                        isGoShortcutArmed
                            ? 'border-brand/60 bg-brand/20 text-brand'
                            : 'border-border-main bg-bg-action text-text-muted'
                    }`}
                >
                    G
                </kbd>
            </button>

            <header className="lg:hidden fixed top-0 inset-x-0 z-30 border-b border-border-main bg-bg-panel/95 backdrop-blur-md">
                <div className="h-16 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setIsMobileNavOpen((prev) => !prev)}
                            aria-label={isMobileNavOpen ? '关闭导航菜单' : '打开导航菜单'}
                            aria-expanded={isMobileNavOpen}
                            className="ui-icon-btn bg-bg-action text-text-main border border-border-main"
                        >
                            {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>

                        <button
                            type="button"
                            onClick={openCommandPalette}
                            aria-label="打开命令面板"
                            className="ui-icon-btn bg-bg-action text-text-main border border-border-main"
                        >
                            <Search className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="text-right">
                        <p className="ui-kicker">技能工坊</p>
                        <p className="ui-caption">工作区</p>
                    </div>
                </div>
            </header>

            {isMobileNavOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <button
                        type="button"
                        onClick={closeMobileNav}
                        aria-label="关闭导航遮罩"
                        className="absolute inset-0 bg-black/50"
                    />
                    <div role="dialog" aria-modal="true" aria-label="导航菜单" className="relative h-full w-72 max-w-[88vw]">
                        <Sidebar className="w-full h-full shadow-2xl" onNavigate={closeMobileNav} />
                    </div>
                </div>
            )}

            <main
                id="main-content"
                className="flex-1 min-w-0 h-screen overflow-y-auto scroll-smooth relative z-10 custom-scrollbar mix-blend-normal"
            >
                <div className="lg:hidden h-16" aria-hidden="true" />
                <div className="p-4 sm:p-6 lg:px-8 lg:pb-8 lg:pt-16 max-w-7xl mx-auto min-h-full">{children}</div>
            </main>

            <CommandPalette open={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
        </div>
    );
};
