"use strict";

// =====================================================================
// HUD  (v9.2)  - contextual controls, floating status badges,
// shell-by-shell loading animation, [SAVED] indicator.
// Pure presentation: reads game state, never changes it.
// Loaded after render.js; everything is called lazily so load order of
// later scripts does not matter.
// =====================================================================
const HUD = { loading: false, lastCanAct: null, saveTimer: null, timer: null };

// ---------- 1. contextual controls ----------
// True only when the player is strictly the one who must act right now.
function hudCanAct() {
    if (typeof activeGame === 'undefined' || activeGame !== 'MAIN') return false;
    if (!state || state.isProcessing || HUD.loading) return false;
    if (state.playerHp <= 0 || state.dealerHp <= 0) return false;
    const vis = id => { const e = document.getElementById(id); return !!e && !e.classList.contains('hidden'); };
    if (vis('btn-start') || vis('btn-reveal')) return true;      // round gate / poker phase
    return state.turn === 'player' && state.chamber.length > 0;  // shotgun phase
}

function hudSyncControls() {
    const can = hudCanAct();
    const panel = document.getElementById('controls-panel');
    const cheats = document.getElementById('cheat-skills');
    if (panel) panel.classList.toggle('ctl-off', !can);
    if (cheats) cheats.classList.toggle('ctl-off', !can);
    if (panel) panel.classList.toggle('player-active', can);
    HUD.lastCanAct = can;
    return can;
}

// ---------- 2. floating status badges ----------
function badgeHtml(cls, label, spriteName) {
    return `<span class="status-badge ${cls}">${spriteName ? px(spriteName) : ''}${label}</span>`;
}

function hudSyncBadges() {
    const p = document.getElementById('player-badges');
    const d = document.getElementById('dealer-badges');
    if (!state) return;
    if (p) {
        const a = [];
        if (state.handcuffed) a.push(badgeHtml('b-warn', 'CUFFED', 'chain'));
        if (state.shieldPlayer) a.push(badgeHtml('b-cyan', 'SHIELDED', 'shield'));
        if (state.bluffTurns > 0) a.push(badgeHtml('b-purple', 'BLUFF ON', 'mask'));
        if (state.damageMultiplier > 1) a.push(badgeHtml('b-red', state.damageMultiplier + 'X DMG', 'knife'));
        const h = a.join('');
        if (p.dataset.h !== h) { p.dataset.h = h; p.innerHTML = h; }
    }
    if (d) {
        const a = [];
        if (state.shieldDealer) a.push(badgeHtml('b-cyan', 'SHIELDED', 'shield'));
        const h = a.join('');
        if (d.dataset.h !== h) { d.dataset.h = h; d.innerHTML = h; }
    }
}

// ---------- 3. shotgun loading animation ----------
// Drops the shells into the chamber one by one (live = red, blank = grey),
// then "racks" them hidden. Returns the total duration in ms.
function hudShellLoadDuration(n) { return Math.max(2000, 500 + n * 260 + 600); }

function hudPlayShellLoad() {
    const cd = document.getElementById('chamber-display');
    const live = state.liveCount, blank = state.blankCount, n = live + blank;
    const dur = hudShellLoadDuration(n);
    const lt = document.getElementById('live-txt'), bt = document.getElementById('blank-txt');
    if (!cd) return dur;
    HUD.loading = true;
    hudSyncControls();
    cd.innerHTML = '';
    if (lt) lt.innerText = state.fog ? '?' : '0';
    if (bt) bt.innerText = state.fog ? '?' : '0';
    // display order is sorted on purpose: it must never leak the real order
    const order = Array(live).fill(true).concat(Array(blank).fill(false));
    let li = 0, bi = 0;
    order.forEach((isLive, i) => {
        setTimeout(() => {
            if (!HUD.loading) return;
            const s = document.createElement('div');
            s.className = 'shell shell-in ' + (state.fog ? 'unknown' : (isLive ? 'live' : 'blank'));
            cd.appendChild(s);
            if (!state.fog) {
                if (isLive) { li++; if (lt) lt.innerText = li; } else { bi++; if (bt) bt.innerText = bi; }
            }
            try { SFX.tick(); } catch (e) {}
        }, 350 + i * 260);
    });
    // shuffle: all shells go dark and shake
    setTimeout(() => {
        if (!HUD.loading) return;
        cd.classList.add('chamber-rack');
        cd.querySelectorAll('.shell').forEach(s => { s.classList.remove('live', 'blank'); s.classList.add('unknown'); });
        try { SFX.load(); } catch (e) {}
    }, 350 + n * 260 + 150);
    setTimeout(() => {
        HUD.loading = false;
        cd.classList.remove('chamber-rack');
        renderAmmo();
        hudSyncControls();
    }, dur - 100);
    return dur;
}

// ---------- 4. [SAVED] indicator ----------
function flashSaveIndicator() {
    const el = document.getElementById('save-indicator');
    if (!el) return;
    el.classList.remove('on');
    void el.offsetWidth;                       // restart the blink
    el.classList.add('on');
    clearTimeout(HUD.saveTimer);
    HUD.saveTimer = setTimeout(() => el.classList.remove('on'), 1500);
}

// ---------- 5. glue ----------
function hudTick() {
    hudSyncControls();
    hudSyncBadges();
}

function hudInit() {
    if (HUD.timer) return;
    HUD.timer = setInterval(hudTick, 120);
    hudTick();
}
