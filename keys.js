"use strict";

// =====================================================================
// KEYBINDS: every fight key can be rebound (SYSTEM tab > CONTROLS).
// Stored in localStorage as malicex_keys. One handler, in the capture phase,
// replaces the old hard-coded key checks for the fight screen.
// Two actions may share a key only if they never apply at the same time
// (e.g. DEAL and SHOOT OPPONENT both default to SPACE).
// =====================================================================
const KEYS_KEY = 'malicex_keys';
const KEY_ACTIONS = [
    // id, label, group, default
    ['item1', 'ITEM 1', 'gun', '1'], ['item2', 'ITEM 2', 'gun', '2'], ['item3', 'ITEM 3', 'gun', '3'],
    ['item4', 'ITEM 4', 'gun', '4'], ['item5', 'ITEM 5', 'gun', '5'], ['item6', 'ITEM 6', 'gun', '6'],
    ['shootOpp', 'SHOOT DEALER', 'gun', ' '], ['shootSelf', 'SHOOT SELF', 'gun', 's'],
    ['arcana', 'ARCANA (BOSS)', 'gun', 't'], ['lift', 'LIFT (THIEF)', 'gun', 'l'],
    ['coldRead', 'COLD READ', 'gun', 'v'], ['psychOut', 'PSYCH OUT', 'gun', 'o'],
    ['deal', 'NEXT / REVEAL', 'poker', ' '], ['cheat', 'CHEAT', 'poker', 'c'],
    ['raise', 'RAISE', 'poker', 'b'], ['fold', 'FOLD', 'poker', 'f'], ['redraw', 'REDRAW', 'poker', 'd'],
    ['pause', 'PAUSE', 'global', 'Escape']
];
const KEY_DEFAULTS = {}; KEY_ACTIONS.forEach(a => { KEY_DEFAULTS[a[0]] = a[3]; });
let KEYMAP = { ...KEY_DEFAULTS };
let keyListening = null;
try { const d = JSON.parse(Store.get(KEYS_KEY) || '{}'); Object.keys(d).forEach(k => { if (k in KEY_DEFAULTS && typeof d[k] === 'string') KEYMAP[k] = d[k]; }); } catch (e) {}

function normKey(k) { return k && k.length === 1 ? k.toLowerCase() : k; }
function keyLabel(action) {
    const k = KEYMAP[action];
    return k === ' ' ? 'SPACE' : k === 'Escape' ? 'ESC' : k.length === 1 ? k.toUpperCase() : k.replace('Arrow', '').toUpperCase();
}
function keyGroup(action) { return (KEY_ACTIONS.find(a => a[0] === action) || [])[2]; }
function keysClash(a, b) {
    const ga = keyGroup(a), gb = keyGroup(b);
    return ga === gb || ga === 'global' || gb === 'global';
}
function keysSave() { Store.set(KEYS_KEY, JSON.stringify(KEYMAP)); }

function startRebind(action) {
    keyListening = action;
    SFX.click();
    renderKeysBox();
}
function resetKeys() { KEYMAP = { ...KEY_DEFAULTS }; keysSave(); keyListening = null; SFX.click(); renderKeysBox(); syncKeyHints(); }

function assignKey(action, key) {
    const old = KEYMAP[action];
    KEY_ACTIONS.forEach(a => {                      // a clash swaps keys, so nothing ends up unbound
        if (a[0] !== action && KEYMAP[a[0]] === key && keysClash(action, a[0])) KEYMAP[a[0]] = old;
    });
    KEYMAP[action] = key;
    keysSave();
}

function renderKeysBox() {
    const box = document.getElementById('keys-box');
    if (!box) return;
    box.innerHTML = `<div class="contracts-title">CONTROLS <span class="terms-bonus">${keyListening ? 'PRESS A KEY' : 'tap to rebind'}</span></div>` +
        `<div class="keys-grid">` + KEY_ACTIONS.map(a => {
            const on = keyListening === a[0];
            return `<button class="key-row ${on ? 'listening' : ''}" onclick="startRebind('${a[0]}')"><span>${a[1]}</span><b>${on ? '...' : keyLabel(a[0])}</b></button>`;
        }).join('') + `</div><button class="mode-card mode-slim" onclick="resetKeys()">RESET KEYS</button>`;
}

// put the real key names on every button that shows one
function syncKeyHints() {
    const map = { 'btn-start': 'deal', 'btn-reveal': 'deal', 'btn-cheat': 'cheat', 'btn-raise': 'raise', 'btn-fold': 'fold',
                  'btn-redraw': 'redraw', 'btn-shoot-dealer': 'shootOpp', 'btn-shoot-self': 'shootSelf', 'btn-lift': 'lift',
                  'cheat-read': 'coldRead', 'cheat-psych': 'psychOut', 'btn-arcana': 'arcana' };
    Object.keys(map).forEach(id => {
        const b = document.getElementById(id);
        if (!b) return;
        b.querySelectorAll('.khint, .key-hint').forEach(h => { h.textContent = h.classList.contains('khint') ? `[${keyLabel(map[id])}]` : keyLabel(map[id]); });
    });
    document.querySelectorAll('#player-items-row .key-hint').forEach((h, i) => { h.textContent = keyLabel('item' + (i + 1)); });
}

function visible(id) { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); }

// ---- one handler for the fight screen
document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const typing = t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    if (keyListening) {                              // rebinding takes the next key
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.key === 'Escape' && keyListening !== 'pause') { keyListening = null; renderKeysBox(); return; }
        if (['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(e.key)) return;
        assignKey(keyListening, normKey(e.key)); keyListening = null;
        renderKeysBox(); syncKeyHints(); SFX.click();
        return;
    }
    if (typing && e.key !== 'Escape') return;
    const cine = document.getElementById('cine-screen');
    if (cine && !cine.classList.contains('hidden')) return;
    const key = normKey(e.key);
    const eat = () => { e.preventDefault(); e.stopImmediatePropagation(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); };
    if (key === KEYMAP.pause && (activeGame === 'MAIN')) { eat(); setPaused(!QOL.paused); return; }
    if (QOL.paused) { e.stopImmediatePropagation(); return; }
    if (activeGame !== 'MAIN') return;
    const acts = KEY_ACTIONS.map(a => a[0]).filter(a => KEYMAP[a] === key);
    const LEGACY = ['b', 'f', 'd', 'c', 'q', 'w', 'e', 'r', 't', 'v', 'o', 'l', '1', '2', ' '];
    if (!acts.length) { if (LEGACY.includes(key)) e.stopImmediatePropagation(); return; }   // an unbound old key does nothing
    eat();
    const myTurn = state.turn === 'player' && !state.isProcessing;
    for (const a of acts) {
        if (a === 'deal') { if (visible('btn-start')) { startPhase(); return; } if (visible('btn-reveal')) { resolvePokerPhase(); return; } }
        else if (a === 'cheat') { if (visible('btn-cheat')) { cheatPoker(); return; } }
        else if (a === 'raise') { if (visible('btn-raise')) { raisePoker(); return; } }
        else if (a === 'fold') { if (visible('btn-fold')) { foldPoker(); return; } }
        else if (a === 'redraw') { if (visible('btn-redraw')) { redrawPoker(); return; } }
        else if (a === 'shootOpp') { if (gunReady()) { playerShoot('dealer'); return; } }
        else if (a === 'shootSelf') { if (gunReady()) { playerShoot('self'); return; } }
        else if (a === 'lift') { liftAction(); return; }
        else if (a === 'arcana') { if (typeof openArcana === 'function') openArcana(); return; }
        else if (a === 'coldRead') { if (myTurn && upgrades.unlockColdRead) useCheatSkill('COLD_READ'); return; }
        else if (a === 'psychOut') { if (myTurn && upgrades.unlockPsychOut) useCheatSkill('PSYCH_OUT'); return; }
        else if (/^item\d$/.test(a)) { useSlot(Number(a[4]) - 1); return; }
    }
}, true);

const _keysRenderUI = renderUI;
renderUI = function() { _keysRenderUI(); syncKeyHints(); };
const _keysLobby = renderLobby;
renderLobby = function() { _keysLobby(); renderKeysBox(); syncKeyHints(); };
const _keysToggleGun = toggleGunControls;
toggleGunControls = function(e) { _keysToggleGun(e); syncKeyHints(); };
