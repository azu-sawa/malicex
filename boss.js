"use strict";

// =====================================================================
// BOSS + STAKES (Mu-delta): bosses fight in phases, every fight leaves
// something behind, the house adapts if you stall, and Ascension bites.
// Loaded after progress.js; wraps existing functions.
// =====================================================================
const BOSS_MODES = ['BOSS', 'ANCIENT', 'FINALE'];
const ASC_TEXT = [
    'No changes.',
    'Dealers have +1 HP and start with a spare item.',
    'Dealers open every fight behind a Shield.',
    'Sanity starts 15 lower and drains 25% faster.',
    'One more live shell in every load. Dealers have 1 more HP and read the next shell 1 time in 4.',
    'You have 1 less max HP and regain half as much Sanity. Dealers start with Handcuffs and take a free item every round. No healing between fights.'
];

function isBossFight() {
    if (BOSS_MODES.includes(currentDifficulty)) return true;
    if (['HOST', 'WARDEN'].includes(currentDealerPersonality)) return true;
    return !!(state.gauntlet && state.gauntlet.stage >= state.gauntlet.total - 1);
}

// what the last fight taught the house: your favourite item gets a counter
const ITEM_COUNTER = { KNIFE: 'SHIELD', GLASS: 'INVERTER', CIGARETTES: 'KNIFE', INVERTER: 'GLASS', HANDCUFFS: 'SHIELD', SHIELD: 'KNIFE', BEER: 'HANDCUFFS' };
function favouriteItemThisFight() {
    const base = state.fightUseBase || {}, use = state.itemUse || {};
    let best = null, n = 0;
    Object.keys(use).forEach(k => { const d = (use[k] || 0) - (base[k] || 0); if (d > n) { n = d; best = k; } });
    return n >= 2 ? best : null;
}

const _bsSetup = setupFight;
setupFight = function(p, hp, items) {
    const fav = (state.fightUseBase && state.round >= 1 && state.gauntlet && state.gauntlet.stage > 0) ? favouriteItemThisFight() : null;
    const asc = ascLevel();
    if (asc >= 4) hp += 1;
    _bsSetup(p, hp, items);
    state.fightDmg = 0;
    state.fightUseBase = { ...(state.itemUse || {}) };
    state.bossPhase = 1;
    state.houseAdapted = 0;
    if (asc >= 1 && currentDifficulty !== 'ENDLESS') giveItem('dealer', randomItemKey());
    if (asc >= 2) state.shieldDealer = true;
    if (asc >= 5) giveItem('dealer', 'HANDCUFFS');
    if (isBossFight()) {
        state.shieldDealer = true;
        giveItem('dealer', currentDifficulty === 'ANCIENT' || currentDifficulty === 'FINALE' ? 'BEER' : 'HANDCUFFS');
        setTimeout(() => { if (activeGame === 'MAIN') log('A BOSS. It starts the fight behind a Shield.', 'text-red-400'); }, 1200);
    }
    if (fav && ITEM_COUNTER[fav]) {
        giveItem('dealer', ITEM_COUNTER[fav]);
        setTimeout(() => { if (activeGame === 'MAIN') log(`THE DEALERS TALK: he heard you lean on the ${ITEMS[fav].en.n}.`, 'text-amber-400'); }, 1800);
    }
    renderAmmo();
};

// ---------- boss phases ----------
const _bsEnrage = checkEnrage;
checkEnrage = function() {
    _bsEnrage();
    if (!isBossFight() || state.dealerHp <= 0) return;
    const frac = state.dealerHp / state.maxDealerHp;
    if (state.bossPhase < 2 && frac <= 0.5) {
        state.bossPhase = 2;
        const heal = Math.max(1, Math.round(state.maxDealerHp * 0.2));
        state.dealerHp = Math.min(state.maxDealerHp, state.dealerHp + heal);
        giveItem('dealer', 'KNIFE'); giveItem('dealer', 'CIGARETTES'); giveItem('dealer', 'HANDCUFFS');
        state.shieldDealer = true;
        state.bossRage = true;
        log(`PHASE 2. He recovers ${heal}, raises a Shield and rearms. Every load now carries one more live shell.`, 'text-red-500');
        showDisturbingOverlay('IT IS NOT OVER');
        flashScreen('red'); SFX.heartbeat(); renderHP(); renderAmmo();
    } else if (state.bossPhase < 3 && frac <= 0.25 && BOSS_MODES.concat(['HOST']).includes(currentDifficulty === 'GAUNTLET' ? currentDealerPersonality : currentDifficulty)) {
        state.bossPhase = 3;
        state.shieldDealer = true;
        state.damageMultiplier = Math.max(state.damageMultiplier, 2);
        log('PHASE 3. His next shot deals double and a Shield is up again.', 'text-red-500');
        flashScreen('red'); SFX.thump(); renderAmmo();
    }
};

// ---------- the house adapts if you stall; fights track damage ----------
const _bsStartRound = startRound;
startRound = function() {
    _bsStartRound();
    if (currentDifficulty === 'ENDLESS' || state.playerHp <= 0 || state.dealerHp <= 0) return;
    if (ascLevel() >= 5 && state.round >= 2) giveItem('dealer', randomItemKey());
    if (state.bossRage) state.heavyLoad = true;
    const from = (currentDifficulty === 'NORMAL' && (meta.runs || 0) < 6) ? 99 : (currentDifficulty === 'NORMAL' ? 4 : 3);
    if (state.round >= from && state.round % 2 === 1 && (state.houseAdapted || 0) < state.round) {
        state.houseAdapted = state.round;
        if (giveItem('dealer', randomItemKey())) setTimeout(() => { if (activeGame === 'MAIN') log('THE HOUSE ADAPTS: the longer you stall, the more he carries.', 'text-amber-400'); }, 1600);
        if (state.round >= from + 2) state.heavyLoad = true;
    }
};

const _bsDeal = dealDamage;
dealDamage = function(who, dmg, opts) {
    const out = _bsDeal(who, dmg, opts);
    if (who === 'player' && out > 0) state.fightDmg = (state.fightDmg || 0) + out;
    return out;
};

// ---------- ascension ----------
const _bsSanity = updateSanity;
updateSanity = function(d) {
    const a = (typeof ascLevel === 'function') ? ascLevel() : 0;
    if (a >= 3 && d < 0 && activeGame === 'MAIN') d = Math.floor(d * 1.25);
    if (a >= 5 && d > 0 && activeGame === 'MAIN') d = Math.ceil(d / 2);
    return _bsSanity(d);
};

const _bsCycle = cycleAscension;
cycleAscension = function() {
    _bsCycle();
    const n = meta.ascSel || 0;
    const m = document.getElementById('menu-msg');
    if (m) m.textContent = n ? `ASCENSION ${n}: ` + ASC_TEXT.slice(1, n + 1).join(' ') : ASC_TEXT[0];
};
