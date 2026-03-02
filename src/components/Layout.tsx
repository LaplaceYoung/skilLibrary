import React from 'react';
import { Sidebar } from './Sidebar';
import { LiveBackground } from './LiveBackground';
import { useSkillStore } from '../store';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { activeTheme } = useSkillStore();
    return (
        <div className="flex w-full min-h-screen bg-bg-base text-text-main">
            {/* Dynamic Background */}
            <LiveBackground key={activeTheme || 'default'} />

            <Sidebar />
            <main className="flex-1 h-screen overflow-y-auto scroll-smooth relative z-10 custom-scrollbar mix-blend-normal">
                <div className="p-8 max-w-7xl mx-auto min-h-full">
                    {children}
                </div>
            </main>
        </div>
    );
};
