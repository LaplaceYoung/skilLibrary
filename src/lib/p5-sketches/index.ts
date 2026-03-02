import type { ThemeSketchFactory } from './sketch-defs';
import type { ThemeType } from '../../store';

export type { SketchController, ThemeSketchFactory } from './sketch-defs';

const FALLBACK_THEME: ThemeType = 'geometric';

export const loadSketchForTheme = async (theme: ThemeType): Promise<ThemeSketchFactory> => {
    const safeTheme = theme || FALLBACK_THEME;

    if (safeTheme === 'chromatic') {
        const module = await import('./chromaticHarmonics');
        return module.chromaticHarmonics;
    }

    if (safeTheme === 'organic') {
        const module = await import('./organicRecursive');
        return module.organicRecursive;
    }

    const module = await import('./geometricFlow');
    return module.geometricSilence;
};
