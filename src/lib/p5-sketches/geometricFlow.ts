import p5 from 'p5';
import type { SketchController } from './sketch-defs';

interface FlowParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    hue: number;
    maxLife: number;
    life: number;
}

export const geometricSilence = (p: p5): SketchController => {
    let particles: FlowParticle[] = [];
    let isDestroyed = false;

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 1);
        particles = [];
    };

    p.draw = () => {
        if (isDestroyed) return;
        p.clear();

        // Simple grid
        p.stroke(0, 0, 100, 0.05);
        p.strokeWeight(1);
        for (let x = 0; x < p.width; x += 100) {
            p.line(x, 0, x, p.height);
        }
        for (let y = 0; y < p.height; y += 100) {
            p.line(0, y, p.width, y);
        }

        // Draw and update particles
        p.noStroke();
        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life -= 1;

            if (pt.x < 0) pt.x = p.width;
            if (pt.x > p.width) pt.x = 0;
            if (pt.y < 0) pt.y = p.height;
            if (pt.y > p.height) pt.y = 0;

            const alpha = p.map(pt.life, 0, pt.maxLife, 0, 0.4);
            p.fill(pt.hue, 50, 100, alpha);
            p.rect(pt.x, pt.y, pt.size, pt.size);

            if (pt.life <= 0) {
                particles.splice(i, 1);
            }
        }

        if (particles.length < 50 && !isDestroyed) {
            particles.push({
                x: p.random(p.width),
                y: p.random(p.height),
                vx: p.random(-0.5, 0.5),
                vy: p.random(-0.5, 0.5),
                size: p.random(2, 4),
                hue: p.random(190, 220),
                maxLife: p.random(200, 400),
                life: p.random(200, 400)
            });
        }
    };

    p.windowResized = () => {
        if (!isDestroyed) p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    return {
        onTrigger: () => {
            if (isDestroyed) return;
            // Pulse logic
            for (let i = 0; i < 20; i++) {
                particles.push({
                    x: p.mouseX > 0 ? p.mouseX : p.width / 2,
                    y: p.mouseY > 0 ? p.mouseY : p.height / 2,
                    vx: p.random(-3, 3),
                    vy: p.random(-3, 3),
                    size: p.random(4, 8),
                    hue: 200,
                    maxLife: 100,
                    life: 100
                });
            }
        },
        onDestroy: () => {
            isDestroyed = true;
            particles = [];
        }
    };
};
