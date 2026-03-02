import p5 from 'p5';
import type { SketchController } from './sketch-defs';

export const organicRecursive = (p: p5): SketchController => {
    let t = 0;
    let branchIntensity = Math.PI / 4;
    let targetBranchIntensity = Math.PI / 4;

    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        t = 0;
        branchIntensity = Math.PI / 4;
        targetBranchIntensity = Math.PI / 4;
    };

    const drawBranch = (len: number, level: number) => {
        if (level === 0) return;

        p.stroke(150, 200, 100, 50 + level * 20); // Organic greens
        p.strokeWeight(level * 0.5);
        p.line(0, 0, 0, -len);

        p.translate(0, -len);

        // Dynamic angle
        p.push();
        p.rotate(branchIntensity + p.sin(t + level) * 0.1);
        drawBranch(len * 0.7, level - 1);
        p.pop();

        p.push();
        p.rotate(-branchIntensity + p.cos(t + level) * 0.1);
        drawBranch(len * 0.7, level - 1);
        p.pop();
    };

    p.draw = () => {
        p.clear();

        p.push();
        p.translate(p.width / 2, p.height);

        // Base trunk length depends on screen size
        const baseLen = p.min(p.width, p.height) * 0.25;
        drawBranch(baseLen, 8); // 8 levels deep
        p.pop();

        // Slowly animate t
        t += 0.02;

        // Lerp towards target intensity (decay back to normal after event)
        branchIntensity += (targetBranchIntensity - branchIntensity) * 0.05;
        targetBranchIntensity += (Math.PI / 4 - targetBranchIntensity) * 0.01;
    };

    p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    return {
        onTrigger: () => {
            // Unfurl rapidly
            targetBranchIntensity = Math.PI / 2 + p.random(-0.5, 0.5);
        },
        onDestroy: () => {
            t = 0;
        }
    };
};
