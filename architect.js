"use strict";

// =====================================================================
// THE ARCHITECT'S CONTRACTS: optional pre-run constraints.
//   SILENCE_PACT   Glass and Dead Phone are sealed. The dealer gets none.
//   ASCETIC_LIMIT  you can carry two items. No more.
//   PARANOIA_MODE  start at 30 Sanity, Sanity losses x1.5, no Sanity from items.
// Every contract that is switched on adds +25% to the final run score.
// State lives in localStorage under malicex_architect:
//   { active: {ID: true}, done: {ID: wins}, tried: {ID: runs} }
// Everything here wraps existing functions; nothing else needs to know.
// =====================================================================
const ARCH_KEY = 'malicex_architect';
const ARCH_BONUS = 0.25;
const CONTRACTS = {
    SILENCE_PACT: { name: 'SILENCE PACT', d: 'Glass and Dead Phone are SEALED. The dealer carries none either.', sealed: ['GLASS', 'PHONE'] },
    ASCETIC_LIMIT: { name: 'ASCETIC LIMIT', d: 'You may carry only 2 items. Extra finds are lost.' },
    PARANOIA_MODE: { name: 'PARANOIA MODE', d: 'Start at 30 Sanity. Losses x1.5. Items cannot restore Sanity.' }
};
const ASCETIC_CAP = 2;
let archState = { active: {}, done: {}, tried: {} };

function archLoad() {
    try {
        const d = JSON.parse(Store.get(ARCH_KEY) || '{}');
        ['active', 'done', 'tried'].forEach(k => { archState[k] = (d && typeof d[k] === 'object' && d[k]) || {}; });
    } catch (e) { archState = { active: {}, done: {}, tried: {} }; }
    Object.keys(archState.active).forEach(k => { if (!CONTRACTS[k]) delete archState.active[k]; });
}
function archSave() { Store.set(ARCH_KEY, JSON.stringify(archState)); }
archLoad();

function activeContracts() { return Object.keys(CONTRACTS).filter(k => archState.active[k]); }
function contractOn(id) { return !!archState.active[id] && activeGame === 'MAIN'; }
function isSealed(key) { return contractOn('SILENCE_PACT') && CONTRACTS.SILENCE_PACT.sealed.includes(key); }
function invCap() { return contractOn('ASCETIC_LIMIT') ? ASCETIC_CAP : 5; }

function toggleContract(id) {
    if (!CONTRACTS[id] || activeGame === 'MAIN') return;
    archState.active[id] = !archState.active[id];
    archSave();
    SFX.click();
    renderContractsPanel();
}

function renderContractsPanel() {
    const box = document.getElementById('architect-box');
    if (!box) return;
    const n = activeContracts().length;
    const locked = activeGame === 'MAIN';
    box.innerHTML = `<div class="contracts-title">THE ARCHITECT'S CONTRACTS <span class="terms-bonus">${n ? '+' + Math.round(n * ARCH_BONUS * 100) + '% score' : 'optional'}</span></div>` +
        `<div class="terms-grid arch-grid">` + Object.keys(CONTRACTS).map(id => {
            const c = CONTRACTS[id], on = !!archState.active[id], w = archState.done[id] || 0;
            return `<button class="term ${on ? 'on' : ''}" onclick="toggleContract('${id}')" aria-pressed="${on}"${locked ? ' disabled' : ''}>` +
                `<b>${on ? '&#9632; ' : '&#9633; '}${c.name}</b><span>${c.d}</span><i>+25% score${w ? ' &middot; cleared ' + w + 'x' : ''}</i></button>`;
        }).join('') + `</div><div class="contracts-note">Chosen before a run. Each one adds +25% to the final score.</div>`;
}
const _archRenderLobby = renderLobby;
renderLobby = function() { _archRenderLobby(); renderContractsPanel(); };

// ---- SILENCE PACT
const _archUseItem = useItem;
useItem = function(who, key, idx) {
    if (who === 'player' && isSealed(key)) {
        log('SEALED. The Silence Pact forbids it.', 'text-gray-500');
        SFX.empty(); buzz(20);
        return;
    }
    // remember the Sanity this item is about to give, so updateSanity can refuse that one call
    if (who === 'player' && contractOn('PARANOIA_MODE') && ITEMS[key] && ITEMS[key].sanityGain) {
        state.blockGain = { amt: ITEMS[key].sanityGain, until: Date.now() + 3000 };
        log('PARANOIA: nothing helps. Not even this.', 'text-purple-400');
    }
    return _archUseItem(who, key, idx);
};
const _archGive = giveItem;
giveItem = function(who, key) {
    if (who === 'dealer' && isSealed(key)) return false;
    if (who === 'player' && state.playerItems.length >= invCap()) {
        if (invCap() < 5) log('ASCETIC LIMIT: your hands are full. Item lost.', 'text-gray-500');
        else return _archGive(who, key);
        return false;
    }
    return _archGive(who, key);
};
const _archStartTurn = startTurn;
startTurn = function() { if (contractOn('SILENCE_PACT')) state.eyeNext = false; return _archStartTurn(); };

// ---- inventory visuals: sealed buttons + locked slots
const _archRenderUI = renderUI;
renderUI = function() {
    _archRenderUI();
    const row = document.getElementById('player-items-row');
    if (!row || activeGame !== 'MAIN') return;
    const cap = invCap();
    for (let i = 0; i < row.children.length; i++) {
        const el = row.children[i], key = state.playerItems[i];
        if (i >= cap && el.classList.contains('item-empty')) el.classList.add('item-locked');
        if (key && isSealed(key) && el.classList.contains('item-btn')) {
            el.classList.add('sealed');
            const nm = el.querySelector('.item-name');
            if (nm) nm.textContent = 'SEALED';
            el.setAttribute('aria-disabled', 'true');
        }
    }
};

// ---- ASCETIC: trim anything carried in from the shop
const _archStartRound = startRound;
startRound = function() {
    if (contractOn('ASCETIC_LIMIT') && state.playerItems.length > ASCETIC_CAP) {
        state.playerItems.length = ASCETIC_CAP;
        log('ASCETIC LIMIT: you can only keep two.', 'text-gray-500');
    }
    return _archStartRound();
};

// ---- PARANOIA
const _archStartGame = startGame;
startGame = function() {
    _archStartGame();
    if (archState.active.PARANOIA_MODE) setSanityDirect(30);
    Object.keys(archState.active).forEach(k => { if (archState.active[k]) archState.tried[k] = (archState.tried[k] || 0) + 1; });
    archSave();
};
const _archUpdateSanity = updateSanity;
updateSanity = function(delta) {
    if (contractOn('PARANOIA_MODE')) {
        if (delta > 0 && state.blockGain && Date.now() < state.blockGain.until && delta === state.blockGain.amt) {
            state.blockGain = null;
            return;
        }
        if (delta < 0) delta = -Math.ceil(Math.abs(delta) * 1.5);
    }
    return _archUpdateSanity(delta);
};

// ---- score bonus + completion
const _archRunScore = runScore;
runScore = function(won) {
    const r = _archRunScore(won), n = activeContracts().length;
    if (!n) return r;
    const s = Math.round(r.score * (1 + ARCH_BONUS * n));
    return { score: s, grade: s >= 3600 ? 'S' : s >= 2800 ? 'A' : s >= 2100 ? 'B' : s >= 1500 ? 'C' : 'D', contracts: n };
};
const _archAfter = afterResultHooks;
afterResultHooks = function(won) {
    if (won) {
        activeContracts().forEach(k => { archState.done[k] = (archState.done[k] || 0) + 1; });
        archSave();
    }
    return _archAfter(won);
};
