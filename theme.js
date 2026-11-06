"use strict";

// =====================================================================
// THEMES: CRT colour profiles.
//   default  cyan / amber phosphor (original)
//   green    1980s terminal monochrome
//   blood    dark horror red
// A theme does three things:
//   1. sets CSS custom properties (--bg-color, --text-glow, --scanline-opacity, ...)
//   2. remaps the 8x8 sprite rasteriser (themeColor) so every pixel icon is
//      drawn with the active ramp
//   3. shows a blend-mode tint layer so Tailwind-coloured text follows the
//      same hue
// The choice is stored in localStorage and an inline <head> script applies the
// attribute before first paint, so there is no flash of the wrong colours.
// =====================================================================
const THEME_KEY = 'malicex_theme';
const THEMES = {
    default: { name: 'CYAN / AMBER', ramp: null },
    green: {
        name: 'GREEN MONO', ramp: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
        vars: { '--bg-color': '#0f380f', '--text-glow': '0 0 5px rgba(155,188,15,.5)', '--scanline-opacity': '0.95',
                '--term-green': '#9bbc0f', '--glow-soft': '0 0 6px rgba(155,188,15,.35)', '--theme-tint': '#8bac0f' }
    },
    blood: {
        name: 'BLOOD AMBER', ramp: ['#1a0000', '#4d0000', '#800000', '#ff3333'],
        vars: { '--bg-color': '#1a0000', '--text-glow': '0 0 5px rgba(255,51,51,.5)', '--scanline-opacity': '1',
                '--term-green': '#ff3333', '--glow-soft': '0 0 6px rgba(255,51,51,.35)', '--theme-tint': '#ff3333' }
    }
};
const THEME_VAR_KEYS = ['--bg-color', '--text-glow', '--scanline-opacity', '--term-green', '--glow-soft', '--theme-tint'];
let activeTheme = 'default';

function hexToRgb(h) {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const _rampCache = {};

// Maps any sprite colour onto the active theme ramp by luminance.
function themeColor(hex) {
    const t = THEMES[activeTheme];
    if (!t || !t.ramp || typeof hex !== 'string' || hex[0] !== '#') return hex;
    const key = activeTheme + hex;
    if (_rampCache[key]) return _rampCache[key];
    const [r, g, b] = hexToRgb(hex);
    const lum = Math.pow((0.299 * r + 0.587 * g + 0.114 * b) / 255, 0.8);
    const pos = Math.min(0.999, lum) * (t.ramp.length - 1);
    const i = Math.floor(pos), f = pos - i;
    const a = hexToRgb(t.ramp[i]), c = hexToRgb(t.ramp[i + 1]);
    const out = '#' + a.map((v, k) => Math.round(v + (c[k] - v) * f).toString(16).padStart(2, '0')).join('');
    return (_rampCache[key] = out);
}

let themeFadeTimer = 0;
function applyTheme(id, persist, instant) {
    if (!THEMES[id]) id = 'default';
    const root = document.documentElement, t = THEMES[id];
    const changed = activeTheme !== id;
    activeTheme = id;
    const swap = () => {
        if (id === 'default') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', id);
        THEME_VAR_KEYS.forEach(k => root.style.removeProperty(k));
        if (t.vars) Object.keys(t.vars).forEach(k => root.style.setProperty(k, t.vars[k]));
        if (typeof installPixelStyles === 'function') installPixelStyles();   // redraw every sprite
    };
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', (t.vars && t.vars['--bg-color']) || '#090a0f');
    if (persist) Store.set(THEME_KEY, id);
    if (instant || !changed || !document.body) { swap(); }
    else {
        // cross-fade: every colour eases over 0.7s, and sprites are re-cut while the screen is dipped
        root.classList.add('theme-fading');
        document.body.style.opacity = '.55';
        clearTimeout(themeFadeTimer);
        setTimeout(() => { swap(); document.body.style.opacity = ''; }, 220);
        themeFadeTimer = setTimeout(() => root.classList.remove('theme-fading'), 1000);
    }
    syncThemeButtons();
}

function setTheme(id) {
    applyTheme(id, true);
    if (typeof SFX !== 'undefined') SFX.click();
    if (typeof renderUI === 'function' && typeof state !== 'undefined' && state && activeGame === 'MAIN') renderUI();
}

function syncThemeButtons() {
    Object.keys(THEMES).forEach(k => {
        const b = document.getElementById('theme-' + k);
        if (!b) return;
        b.classList.toggle('on', k === activeTheme);
        b.setAttribute('aria-pressed', String(k === activeTheme));
    });
}

// initial load: runs before pixel.js so the first rasterisation already uses the ramp
(function initTheme() {
    let saved = 'default';
    try { saved = Store.get(THEME_KEY) || 'default'; } catch (e) {}
    if (!THEMES[saved]) saved = 'default';
    activeTheme = saved;
    const root = document.documentElement, t = THEMES[saved];
    if (saved !== 'default') root.setAttribute('data-theme', saved);
    if (t.vars) Object.keys(t.vars).forEach(k => root.style.setProperty(k, t.vars[k]));
})();
