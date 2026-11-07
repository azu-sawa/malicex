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
        name: 'FOREST GREEN', ramp: null,
        vars: { '--bg-color': '#0a1510', '--bg2': '#050b08', '--surface': '#112219', '--surface2': '#19301f', '--line': '#2c5a41', '--term-green': '#d6eadf', '--muted': '#7f9d8c', '--accent': '#4ade80', '--accent2': '#22d3ee', '--warn': '#fbbf24', '--danger': '#f87171', '--ok': '#86efac', '--text-glow': '0 0 4px rgba(74,222,128,.28)', '--glow-soft': '0 0 6px rgba(74,222,128,.22)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
    },
    blood: {
        name: 'BLOOD AMBER', ramp: null,
        vars: { '--bg-color': '#160909', '--bg2': '#080303', '--surface': '#231010', '--surface2': '#301616', '--line': '#5e2323', '--term-green': '#f2d9d4', '--muted': '#a8827c', '--accent': '#f87171', '--accent2': '#fb923c', '--warn': '#fbbf24', '--danger': '#ef4444', '--ok': '#a3e635', '--text-glow': '0 0 4px rgba(248,113,113,.28)', '--glow-soft': '0 0 6px rgba(248,113,113,.22)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
    },
    void: {
        name: 'VOID VIOLET', ramp: null,
        vars: { '--bg-color': '#110a22', '--bg2': '#06030f', '--surface': '#1a1036', '--surface2': '#25164a', '--line': '#473080', '--term-green': '#e4dcf7', '--muted': '#9a8bc2', '--accent': '#a78bfa', '--accent2': '#f472b6', '--warn': '#fcd34d', '--danger': '#fb7185', '--ok': '#5eead4', '--text-glow': '0 0 4px rgba(167,139,250,.28)', '--glow-soft': '0 0 6px rgba(167,139,250,.22)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
    },
    dust: {
        name: 'DUST SEPIA', ramp: null,
        vars: { '--bg-color': '#1c1710', '--bg2': '#0c0905', '--surface': '#2a2217', '--surface2': '#362b1c', '--line': '#66502f', '--term-green': '#eadfc8', '--muted': '#a8977a', '--accent': '#e0b45c', '--accent2': '#d08a52', '--warn': '#f0c75e', '--danger': '#e0644b', '--ok': '#a3c26a', '--text-glow': '0 0 4px rgba(224,180,92,.28)', '--glow-soft': '0 0 6px rgba(224,180,92,.22)', '--scanline-opacity': '1', '--theme-tint': 'transparent' }
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
