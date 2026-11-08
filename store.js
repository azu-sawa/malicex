"use strict";

// =====================================================================
// STORE: safe localStorage + player settings + save export/import.
// Every read/write is guarded: Safari private mode, blocked storage and a
// full quota must never break the game - it falls back to memory.
// =====================================================================
const Store = (() => {
    const mem = {};
    let ok = true;
    try { const k = '__malicex_probe'; localStorage.setItem(k, '1'); localStorage.removeItem(k); } catch (e) { ok = false; }
    // one failed write (a full quota, say) must not switch storage off for good
    return {
        persistent: ok,
        get(k) { if (ok) { try { const v = localStorage.getItem(k); return v === null && Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : v; } catch (e) { /* fall through to memory */ } } return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        set(k, v) { mem[k] = String(v); if (ok) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } } return false; },
        remove(k) { delete mem[k]; if (ok) { try { localStorage.removeItem(k); } catch (e) {} } }
    };
})();

// ---------- settings ----------
const SETTINGS_KEY = 'malicex_settings';
const SETTINGS_DEFAULT = {
    cursor: true,        // custom CRT pointer
    haptics: true,       // vibration on hits (Android; iOS ignores it)
    lowfx: false,        // fewer overlays/animations (phones, motion sensitivity)
    tutorial: false,     // guided first run finished
    name: '',            // what the house calls you
    lobbyTab: 'play',
    lastMode: '',        // for "one more hand"
    seenHints: {},
    crtfx: true,         // curved glass, scanlines, phosphor mask
    bigtext: false,      // larger interface text
    shellletters: false, // L / B letters on revealed shells (colour-blind friendly)
    fast: false,         // shorter pauses between actions
    houseHome: true,     // the game opens in the House (the lobby is the computer in the Study)
    terms: []            // run terms picked in the lobby
};
let settings = { ...SETTINGS_DEFAULT };

function loadSettings() {
    try { settings = { ...SETTINGS_DEFAULT, ...(JSON.parse(Store.get(SETTINGS_KEY) || '{}')) }; } catch (e) { settings = { ...SETTINGS_DEFAULT }; }
    applySettings();
}

function saveSettings() { Store.set(SETTINGS_KEY, JSON.stringify(settings)); }

function applySettings() {
    document.documentElement.classList.toggle('lowfx', !!settings.lowfx);
    document.documentElement.classList.toggle('no-crt-cursor', !settings.cursor);
    const q = id => document.getElementById(id);
    if (q('set-cursor')) q('set-cursor').textContent = 'CRT POINTER: ' + (settings.cursor ? 'ON' : 'OFF');
    if (q('set-haptics')) q('set-haptics').textContent = 'VIBRATION: ' + (settings.haptics ? 'ON' : 'OFF');
    if (q('set-boot')) q('set-boot').textContent = 'START IN: ' + (settings.houseHome !== false ? 'THE HOUSE' : 'THE MENU');
    if (q('set-lowfx')) q('set-lowfx').textContent = 'LOW EFFECTS: ' + (settings.lowfx ? 'ON' : 'OFF');
    document.documentElement.classList.toggle('no-crtfx', !settings.crtfx);
    if (q('set-crtfx')) q('set-crtfx').textContent = 'CRT SCREEN: ' + (settings.crtfx ? 'ON' : 'OFF');
    document.documentElement.classList.toggle('bigtext', !!settings.bigtext);
    document.documentElement.classList.toggle('shellletters', !!settings.shellletters);
    if (q('set-bigtext')) q('set-bigtext').textContent = 'LARGE TEXT: ' + (settings.bigtext ? 'ON' : 'OFF');
    if (q('set-letters')) q('set-letters').textContent = 'SHELL LETTERS: ' + (settings.shellletters ? 'ON' : 'OFF');
    if (q('set-fast')) q('set-fast').textContent = 'FAST HANDS: ' + (settings.fast ? 'ON' : 'OFF');
}

function toggleBoot() { settings.houseHome = settings.houseHome === false; saveSettings(); applySettings(); SFX.click(); }
function toggleSetting(key) { settings[key] = !settings[key]; saveSettings(); applySettings(); SFX.click(); if (key === 'haptics') buzz(30); }

// vibration (silently ignored where unsupported)
function buzz(ms) {
    if (!settings.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (e) {}
}
