/**
 * A small requestAnimationFrame engine for the transforms BrowserWindow uses.
 *
 * The engine deliberately owns only `transform` (translate + scale) and
 * `opacity`. Keeping that boundary explicit makes it safe to use in any UI
 * component that has the same rendering contract.
 */

const DEFAULT_STATE = Object.freeze({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1
});

const easings = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => 1 - (1 - t) * (1 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,

    easeInCubic: t => t * t * t,
    easeOutCubic: t => 1 - Math.pow(1 - t, 3),
    easeInOutCubic: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,

    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => 1 - Math.pow(1 - t, 4),
    easeInOutQuart: t => t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,

    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => 1 - Math.pow(1 - t, 5),
    easeInOutQuint: t => t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,

    easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
    easeOutSine: t => Math.sin(t * Math.PI / 2),
    easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,

    easeInExpo: t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    easeOutExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    easeInOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2
};

function cubicBezier(p1x, p1y, p2x, p2y) {
    const cx = 3 * p1x;
    const bx = 3 * (p2x - p1x) - cx;
    const ax = 1 - cx - bx;

    const cy = 3 * p1y;
    const by = 3 * (p2y - p1y) - cy;
    const ay = 1 - cy - by;

    const sampleCurveX = (t) => ((ax * t + bx) * t + cx) * t;
    const sampleCurveY = (t) => ((ay * t + by) * t + cy) * t;
    const sampleCurveDerivativeX = (t) => (3 * ax * t + 2 * bx) * t + cx;

    const solveCurveX = (x, epsilon = 1e-6) => {
        let t = x;

        // Newton-Raphson converges quickly for the usual CSS timing curves.
        for (let i = 0; i < 8; i++) {
            const delta = sampleCurveX(t) - x;
            if (Math.abs(delta) < epsilon) return t;

            const slope = sampleCurveDerivativeX(t);
            if (Math.abs(slope) < 1e-6) break;
            t -= delta / slope;
        }

        // A monotonic CSS bezier has x control points in [0, 1], so bisection
        // is a safe, deterministic fallback when Newton-Raphson does not converge.
        let low = 0;
        let high = 1;
        t = x;
        for (let i = 0; i < 30; i++) {
            const delta = sampleCurveX(t) - x;
            if (Math.abs(delta) < epsilon) return t;
            if (delta < 0) low = t;
            else high = t;
            t = (low + high) / 2;
        }
        return t;
    };

    return (t) => {
        if (t <= 0 || t >= 1) return t;
        return sampleCurveY(solveCurveX(t));
    };
}

export const animationProfiles = Object.freeze({
    'window-show': Object.freeze({
        easing: cubicBezier(.04, .73, .16, 1),
        duration: 150
    }),
    'window-hide': Object.freeze({
        easing: cubicBezier(.77, -0.02, .98, .59),
        duration: 150
    }),
    'window-open': Object.freeze({
        easing: cubicBezier(.42, 0, .58, 1),
        duration: 100
    }),
    'window-close': Object.freeze({
        easing: cubicBezier(.42, 0, .58, 1),
        duration: 100
    }),
    'taskview-in': Object.freeze({
        easing: cubicBezier(0, .87, .21, 1),
        duration: 200
    }),
    'taskview-out': Object.freeze({
        easing: cubicBezier(.37, 1.03, 1, 1),
        duration: 150
    }),
    'taskbar-icon-enter': Object.freeze({
        easing: cubicBezier(.22, .89, .34, 1.18),
        duration: 300
    }),
    'taskbar-icon-exit': Object.freeze({
        easing: cubicBezier(.77, -0.02, .98, .59),
        duration: 200
    }),
    'taskbar-icon-reorder': Object.freeze({
        easing: cubicBezier(.22, .89, .34, 1),
        duration: 160
    }),
    'taskbar-icon-bounce-out': Object.freeze({
        easing: cubicBezier(.22, .89, .34, 1),
        duration: 160
    }),
    'taskbar-icon-bounce-in': Object.freeze({
        easing: cubicBezier(.42, 0, .58, 1),
        duration: 120
    }),
    'window-maximize': Object.freeze({
        easing: cubicBezier(.8, .01, .28, .99),
        duration: 200
    }),
    'window-unmaximize': Object.freeze({
        easing: cubicBezier(.8, .01, .28, .99),
        duration: 200
    }),
    'no-animation': Object.freeze({
        easing: () => 1,
        duration: 0
    }),
    'taskbar-icon-generic': Object.freeze({
        easing: easings.easeInOut,
        duration: 100
    }),
});

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function interpolate(from, to, progress) {
    const state = {};
    for (const key of Object.keys(DEFAULT_STATE)) {
        state[key] = from[key] + (to[key] - from[key]) * progress;
    }
    return state;
}

function readTransform(element) {
    const style = getComputedStyle(element);
    const opacity = Number.parseFloat(style.opacity);
    const state = { ...DEFAULT_STATE, opacity: Number.isFinite(opacity) ? opacity : DEFAULT_STATE.opacity };
    const matrix = style.transform.match(/^matrix\(([^)]+)\)$/);

    if (!matrix) return state;

    const [a, b, c, d, x, y] = matrix[1].split(',').map(Number);
    state.x = x;
    state.y = y;
    state.scaleX = Math.hypot(a, b);
    state.scaleY = Math.hypot(c, d);
    return state;
}

/**
 * Animates one element's translation, scale, and opacity.
 *
 * Calling animate while an animation is running starts from the frame that is
 * currently displayed, so window operations can be interrupted without a jump.
 */
export class AnimationEngine {
    constructor(element, { profile = 'window-open' } = {}) {
        if (!(element instanceof Element)) {
            throw new TypeError('AnimationEngine expects a DOM element.');
        }

        this.element = element;
        this.profile = this.resolveProfile(profile);
        this.current = readTransform(element);
        this.from = { ...this.current };
        this.to = { ...this.current };
        this.startedAt = 0;
        this.frame = null;
        this.running = false;
    }

    resolveProfile(profile) {
        if (typeof profile === 'string') {
            const resolved = animationProfiles[profile];
            if (!resolved) throw new Error(`Unknown animation profile: ${profile}`);
            return resolved;
        }
        if (!profile || typeof profile.easing !== 'function' || !Number.isFinite(profile.duration)) {
            throw new TypeError('Animation profile requires an easing function and numeric duration.');
        }
        return profile;
    }

    animate({ from, to = {}, profile } = {}) {
        const nextProfile = profile ? this.resolveProfile(profile) : this.profile;

        const now = performance.now();
        const current = this.running ? this.getStateAt(now) : readTransform(this.element);
        if (this.frame !== null) cancelAnimationFrame(this.frame);
        if (this.running) this.resolve?.(current);

        this.profile = nextProfile;
        this.from = { ...current, ...from };
        this.to = { ...current, ...to };
        this.current = { ...this.from };
        this.startedAt = now;
        this.frame = null;
        this.resolve = null;
        if (this.profile.duration <= 0) {
            this.running = false;
            this.apply(this.to);
            return Promise.resolve(this.to);
        }

        this.running = true;
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.frame = requestAnimationFrame(this.run);
        });
    }

    getStateAt(now) {
        const elapsed = now - this.startedAt;
        const t = clamp(elapsed / this.profile.duration, 0, 1);
        return interpolate(this.from, this.to, this.profile.easing(t));
    }

    run = (now) => {
        this.current = this.getStateAt(now);
        this.apply(this.current);

        if (now - this.startedAt < this.profile.duration) {
            this.frame = requestAnimationFrame(this.run);
            return;
        }

        this.running = false;
        this.frame = null;
        this.apply(this.to);
        this.resolve?.(this.to);
        this.resolve = null;
    };

    apply(state) {
        this.current = { ...state };
        this.element.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scaleX}, ${state.scaleY})`;
        this.element.style.opacity = String(state.opacity);
    }

    cancel({ commitCurrent = true } = {}) {
        if (!this.running) return;
        const current = this.getStateAt(performance.now());
        cancelAnimationFrame(this.frame);
        this.frame = null;
        this.running = false;
        this.resolve?.(current);
        this.resolve = null;
        if (commitCurrent) this.apply(current);
    }
}

export { cubicBezier };
