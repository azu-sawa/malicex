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
        vars: { '--bg-color': '#0b2a0b', '--bg2': '#051405', '--surface': '#0f380f', '--surface2': '#143f14', '--line': '#306230', '--term-green': '#9bbc0f', '--muted': '#6b8a1a',
                '--accent': '#9bbc0f', '--accent2': '#8bac0f', '--warn': '#b7d13a', '--danger': '#d4ef5a', '--ok': '#8bac0f', '--text-glow': '0 0 5px rgba(155,188,15,.5)',
                '--glow-soft': '0 0 6px rgba(155,188,15,.35)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
    },
    blood: {
        name: 'BLOOD AMBER', ramp: ['#1a0000', '#4d0000', '#800000', '#ff3333'],
        vars: { '--bg-color': '#1a0000', '--bg2': '#090000', '--surface': '#260606', '--surface2': '#330a0a', '--line': '#6b1212', '--term-green': '#ff5a4a', '--muted': '#a33a34',
                '--accent': '#ff5a4a', '--accent2': '#ff8a70', '--warn': '#ffb347', '--danger': '#ff2a2a', '--ok': '#e8836b', '--text-glow': '0 0 5px rgba(255,51,51,.5)',
                '--glow-soft': '0 0 6px rgba(255,51,51,.35)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
    },
    void: {
        name: 'VOID VIOLET', ramp: ['#0b0620', '#2a1660', '#7a4be0', '#e3d4ff'],
        vars: { '--bg-color': '#120a24', '--bg2': '#06030f', '--surface': '#1b1038', '--surface2': '#251650', '--line': '#4c2f8a', '--term-green': '#c4a6ff', '--muted': '#8a6fc4',
                '--accent': '#b794ff', '--accent2': '#ff7ad9', '--warn': '#ffd36b', '--danger': '#ff4d8d', '--ok': '#7ee7c4', '--text-glow': '0 0 5px rgba(183,148,255,.5)',
                '--glow-soft': '0 0 6px rgba(183,148,255,.35)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
    },
    dust: {
        name: 'DUST SEPIA', ramp: ['#120d07', '#3a2a16', '#9a7a45', '#f2e3bd'],
        vars: { '--bg-color': '#1f1810', '--bg2': '#0e0a06', '--surface': '#2b2115', '--surface2': '#372a1a', '--line': '#6b5232', '--term-green': '#e8d4a8', '--muted': '#a08a62',
                '--accent': '#e0b45c', '--accent2': '#c98a4b', '--warn': '#f0c75e', '--danger': '#d9573f', '--ok': '#9fb865', '--text-glow': '0 0 5px rgba(224,180,92,.5)',
                '--glow-soft': '0 0 6px rgba(224,180,92,.35)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
    }
};
const THEME_VAR_KEYS = ['--bg-color', '--bg2', '--surface', '--surface2', '--line', '--term-green', '--muted', '--accent', '--accent2', '--warn', '--danger', '--ok', '--text-glow', '--glow-soft', '--scanline-opacity', '--theme-tint'];
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
        // seamless: every colour eases over 0.7s, with no dip through black
        root.classList.add('theme-fading');
        swap();
        clearTimeout(themeFadeTimer);
        themeFadeTimer = setTimeout(() => root.classList.remove('theme-fading'), 900);
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
