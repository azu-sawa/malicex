"use strict";

// =====================================================================
// FIRST NIGHT GUIDE (1.0): a short checklist on the Play tab that walks a
// new player through the whole game, plus progressive reveal of the lobby.
// Steps tick themselves off. Finishing all of them pays once.
// =====================================================================
const GUIDE_REWARD = 1000;
function guideFlags() { meta.guide = meta.guide || {}; return meta.guide; }
function guideMark(k) { const g = guideFlags(); if (g[k]) return; g[k] = 1; try { renderGuide(); } catch (e) {} }

const GUIDE_STEPS = [
    { id: 'sit', t: 'Sit down and play a hand', h: 'Press SIT DOWN. The first hand teaches as it goes.', ok: () => (meta.runs || 0) >= 1 },
    { id: 'win', t: 'Win a hand', h: 'Poker first, then the shotgun. Count the shells.', ok: () => (meta.wins || 0) >= 1 },
    { id: 'house', t: 'Walk the House and talk to someone', h: 'THE HOUSE button. Dealers you beat move in.', ok: () => !!guideFlags().talk },
    { id: 'market', t: 'Open the Black Market', h: 'MARKET tab. Spend your winnings on something that lasts.', ok: () => !!guideFlags().market },
    { id: 'buy', t: 'Buy one upgrade', h: 'Cheap ones are fine. They carry over to every run.', ok: () => Object.keys(upgrades || {}).some(k => upgrades[k]) },
    { id: 'lore', t: 'Read the Grimoire', h: 'ARCHIVE tab. Lore pages and the item codex live here.', ok: () => !!guideFlags().grimoire },
    { id: 'backup', t: 'Make a backup code', h: 'SYSTEM tab, EXPORT CODE. Paste it somewhere safe.', ok: () => !!meta.lastExport }
];

function guideState() {
    const done = GUIDE_STEPS.filter(s => { try { return s.ok(); } catch (e) { return false; } });
    const next = GUIDE_STEPS.find(s => !done.includes(s));
    return { done, next, all: !next };
}

function guideActive() { return !guideFlags().paid && !settings.guideHidden; }

function renderGuide() {
    const box = document.getElementById('guide-card');
    if (!box) return;
    const g = guideState();
    if (g.all && !guideFlags().paid) {
        guideFlags().paid = 1; globalMoney += GUIDE_REWARD; totalStats.moneyEarned += GUIDE_REWARD;
        try { saveGame(); SFX.win(); } catch (e) {}
        const m = document.getElementById('menu-msg'); if (m) m.textContent = 'FIRST NIGHT COMPLETE. +$' + GUIDE_REWARD;
        try { updateMoneyDisplay(true); } catch (e) {}
    }
    if (!guideActive()) { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = `<div class="guide-top"><b>FIRST NIGHT</b><span>${g.done.length}/${GUIDE_STEPS.length} &middot; finish for $${GUIDE_REWARD}</span></div>` +
        `<div class="guide-next">${g.next.t}<small>${g.next.h}</small></div>` +
        `<details class="guide-all"><summary>ALL STEPS</summary>` + GUIDE_STEPS.map(s => `<div class="guide-row ${g.done.includes(s) ? 'on' : ''}">${g.done.includes(s) ? '[X]' : '[ ]'} ${s.t}</div>`).join('') + `</details>` +
        `<button class="guide-hide" onclick="guideHide()">HIDE GUIDE</button>`;
}
function guideHide() { settings.guideHidden = true; saveSettings(); renderGuide(); }
function guideShow() { settings.guideHidden = false; saveSettings(); renderGuide(); }

// hints the House can show when you walk in
function guideNudge() {
    if (!guideActive()) return null;
    const g = guideState();
    return g.next ? 'NEXT: ' + g.next.t : null;
}

// ---------- hooks: tick off steps from what the player does ----------
(function() {
    const wrap = (name, fn) => { const o = window[name]; if (typeof o !== 'function') return; window[name] = function() { const r = o.apply(this, arguments); try { fn.apply(this, arguments); } catch (e) {} return r; }; };
    wrap('toggleShop', show => { if (show) guideMark('market'); });
    wrap('openLedger', () => guideMark('grimoire'));
    wrap('hsTenantVisit', () => guideMark('talk'));
    wrap('openHouse', () => { setTimeout(() => { const n = guideNudge(); if (n && HS.on && typeof hsToast === 'function') hsToast(n); }, 1800); });
    wrap('showMenu', () => { try { renderGuide(); } catch (e) {} });
})();
