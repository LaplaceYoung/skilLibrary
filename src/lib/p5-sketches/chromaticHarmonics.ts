import p5 from 'p5';
import type { SketchController } from './sketch-defs';

export const chromaticHarmonics = (p: p5): SketchController => {
    let t = 0;
    let eventIntensity = 0;

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 1);
        p.noStroke();
        t = 0;
        eventIntensity = 0;
    };

    p.draw = () => {
        p.clear();

        const cx = p.width / 2;
        const cy = p.height / 2;

        // Dynamic base hue based on time and events
        const baseHue = (p.frameCount * 0.1 + eventIntensity * 50) % 360;

        // Draw overlapping, additive color blobs
        p.blendMode(p.SCREEN);

        for (let i = 0; i < 5; i++) {
            const offset = p.TWO_PI / 5 * i;
            const radius = p.min(p.width, p.height) * 0.3 + p.sin(t + offset) * 100 + (eventIntensity * 200);

            const x = cx + p.cos(t * 0.5 + offset) * (p.width * 0.2);
            const y = cy + p.sin(t * 0.7 + offset) * (p.height * 0.2);

            const hue = (baseHue + i * 30) % 360;

            p.fill(hue, 80, 50, 0.4);
            p.ellipse(x, y, radius * 2, radius * 2);
        }

        p.blendMode(p.BLEND);

        t += 0.01 + (eventIntensity * 0.005);
        if (eventIntensity > 0) {
            eventIntensity *= 0.95; // Decay
            if (eventIntensity < 0.01) eventIntensity = 0;
        }
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    return {
        onTrigger: () => {
            eventIntensity = 1.0;
        },
        onDestroy: () => {
            t = 0;
        }
    };
};
