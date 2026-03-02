import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Library, PenTool, PlayCircle, Settings, Unlink } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../lib/utils';
import { useSkillStore } from '../store';

const navItems = [
    { icon: Library, label: 'Skill Library', path: '/' },
    { icon: PenTool, label: 'Forge Editor', path: '/editor' },
    { icon: PlayCircle, label: 'Simulator', path: '/simulator' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

export const Sidebar: React.FC = () => {
    const { dirHandle, initLocalConnection } = useSkillStore();
    const navigate = useNavigate();

    useEffect(() => {
        initLocalConnection();
    }, [initLocalConnection]);

    return (
        <aside className="w-64 h-screen bg-bg-panel border-r border-border-main flex flex-col z-10 sticky top-0 shrink-0 transition-colors duration-700">
            <div className="p-6 flex items-center gap-3">
                <div className="p-2 bg-brand/20 rounded-xl">
                    <Logo className="w-6 h-6 text-brand" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-text-main leading-none">
                        Skill Forge
                    </h1>
                    <p className="ui-kicker font-mono mt-1">AI Agent Tools</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => cn(
                            "flex items-center gap-3 px-4 py-3 rounded-[var(--radius-button)] transition-all duration-300 group relative overflow-hidden",
                            isActive
                                ? "bg-brand/10 text-brand font-bold shadow-inner"
                                : "text-text-muted hover:text-text-main hover:bg-bg-action font-medium hover:pl-5"
                        )}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className={cn(
                                    "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                                    isActive ? 'text-brand' : 'group-hover:text-text-main'
                                )} />
                                <span>{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-border-main">
                {dirHandle ? (
                    <div className="themed-panel p-4 border-green-500/20 bg-green-500/5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <p className="text-xs text-green-400 font-bold uppercase tracking-wider">System Linked</p>
                        </div>
                        <p className="text-xs text-text-muted font-mono truncate px-2">{dirHandle.name}</p>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => navigate('/settings')}
                        className="themed-panel p-4 border-brand/20 bg-brand/5 text-center group cursor-pointer hover:bg-brand/10 transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel"
                    >
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Unlink className="w-3 h-3 text-brand" />
                            <p className="text-xs text-brand font-bold uppercase tracking-wider">Local Only</p>
                        </div>
                        <p className="text-xs text-text-muted group-hover:text-brand transition-colors">Click to link system dir</p>
                    </button>
                )}
            </div>
        </aside>
    );
};

