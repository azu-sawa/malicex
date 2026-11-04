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
    return {
        persistent: ok,
        get(k) { if (ok) { try { return localStorage.getItem(k); } catch (e) { ok = false; } } return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
        set(k, v) { mem[k] = String(v); if (ok) { try { localStorage.setItem(k, v); return true; } catch (e) { ok = false; } } return false; },
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
    seenHints: {}
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
    if (q('set-lowfx')) q('set-lowfx').textContent = 'LOW EFFECTS: ' + (settings.lowfx ? 'ON' : 'OFF');
}

function toggleSetting(key) { settings[key] = !settings[key]; saveSettings(); applySettings(); SFX.click(); if (key === 'haptics') buzz(30); }

// vibration (silently ignored where unsupported)
function buzz(ms) {
    if (!settings.haptics || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch (e) {}
}

// ---------- export / import ----------
function exportSave() {
    saveGame();
    const raw = Store.get(VERSION);
    const box = document.getElementById('save-io');
    if (!raw || !box) return;
    box.value = 'MLX1:' + btoa(unescape(encodeURIComponent(raw)));
    box.focus(); box.select();
    setSysMsg(Store.persistent ? 'Save code ready. Copy it somewhere safe.' : 'Browser storage is blocked. Copy this code or progress is lost on close.');
}

function importSave() {
    const box = document.getElementById('save-io');
    const txt = (box && box.value || '').trim();
    if (!txt.startsWith('MLX1:')) { setSysMsg('That is not a Malicex save code.'); SFX.empty(); return; }
    try {
        const raw = decodeURIComponent(escape(atob(txt.slice(5))));
        const d = JSON.parse(raw);
        if (typeof d !== 'object' || d === null || d.money === undefined) throw new Error('shape');
        Store.set(VERSION, raw);
        setSysMsg('Save restored. Reloading...');
        setTimeout(() => location.reload(), 600);
    } catch (e) { setSysMsg('Save code is damaged.'); SFX.empty(); }
}

function setSysMsg(t) { const m = document.getElementById('sys-msg'); if (m) m.textContent = t; }
