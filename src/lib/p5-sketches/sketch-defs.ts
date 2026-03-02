import p5 from 'p5';

export interface SketchController {
    onTrigger?: (eventId: number) => void;
    onDestroy?: () => void;
}

export type ThemeSketchFactory = (p: p5) => SketchController;
