import React, { useEffect, useRef } from 'react';
import { useSkillStore } from '../store';
import { loadSketchForTheme, type SketchController } from '../lib/p5-sketches';
import type p5 from 'p5';

type IdleCallbackHandle = number;

type IdleWindow = Window &
    typeof globalThis & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => IdleCallbackHandle;
        cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
    };

function scheduleIdleLoad(callback: () => void): IdleCallbackHandle {
    const idleWindow = window as IdleWindow;
    if (idleWindow.requestIdleCallback) {
        return idleWindow.requestIdleCallback(callback, { timeout: 1200 });
    }
    return window.setTimeout(callback, 150);
}

function cancelIdleLoad(handle: IdleCallbackHandle): void {
    const idleWindow = window as IdleWindow;
    if (idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(handle);
        return;
    }
    window.clearTimeout(handle);
}

export const LiveBackground: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { activeTheme, p5EventTrigger } = useSkillStore();

    // Maintain a reference to the active sketch controller, to send events
    const sketchControllerRef = useRef<SketchController | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        let isCancelled = false;
        let instance: p5 | null = null;
        let idleHandle: IdleCallbackHandle | null = null;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) {
            return;
        }

        const initBackground = async () => {
            try {
                const [{ default: P5 }, sketchFactory] = await Promise.all([
                    import('p5'),
                    loadSketchForTheme(activeTheme)
                ]);

                if (isCancelled || !containerRef.current) return;

                const sketchWrapper = (p: p5) => {
                    sketchControllerRef.current = sketchFactory(p);
                };

                instance = new P5(sketchWrapper, containerRef.current);
            } catch (error) {
                console.error('Failed to initialize live background', error);
            }
        };

        idleHandle = scheduleIdleLoad(() => {
            void initBackground();
        });

        return () => {
            isCancelled = true;
            if (idleHandle !== null) {
                cancelIdleLoad(idleHandle);
            }
            if (instance) {
                instance.remove();
            }
            sketchControllerRef.current?.onDestroy?.();
            sketchControllerRef.current = null;
        };
    }, [activeTheme]);

    // Forward events to the active sketch
    useEffect(() => {
        if (p5EventTrigger > 0) {
            sketchControllerRef.current?.onTrigger?.(p5EventTrigger);
        }
    }, [p5EventTrigger]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
            style={{ mixBlendMode: 'screen', opacity: 0.6 }}
        />
    );
};
