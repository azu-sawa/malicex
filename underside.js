"use strict";

// =====================================================================
// UNDERSIDE (Mu-delta): three new dealers with their own rules, the
// Act II run (THE UNDERSIDE, opens after the true ending) and the
// weekly seed.
// =====================================================================
const NEW_DEALERS = ['COLLECTOR', 'CONFESSOR', 'CLOCKWORK'];
const NOT_IN_POOL = ['ANCIENT', 'FIRST', 'HOST'];

DEALER_PERSONALITIES.COLLECTOR = {
    name: 'The Collector',
    taunts: ['Mine now.', 'You will not miss it.', 'Everything ends up in a drawer.', 'Count your pockets.'],
    onPlayerHit: () => { updateSanity(-4); log('COLLECTOR: "Something of yours is in my coat."', 'text-amber-400'); },
    onDealerTurn: function() {
        if (!state.playerItems.length || state.dealerItems.length >= 6 || rnd() > 0.35) return;
        if (state.sin === 'THIEF' && rnd() < 0.5) { log('You feel a hand in your pocket and catch it. Thieves know thieves.', 'text-cyan-300'); return; }
        const i = Math.floor(rnd() * state.playerItems.length);
        const key = state.playerItems.splice(i, 1)[0];
        state.dealerItems.push(key);
        log(`THE COLLECTOR TOOK YOUR ${ITEMS[key === 'PHANTOM' ? 'GLASS' : key].en.n.toUpperCase()}!`, 'text-amber-400');
        SFX.glitch(); renderUI();
    },
    aiBehavior: function(knows) {
        if (knows) return state.chamber[0] ? 'player' : 'self';
        const p = state.liveCount / Math.max(1, state.liveCount + state.blankCount);
        return rnd() < (0.3 + p * 0.55) ? 'player' : 'self';
    },
    itemPriority: function(items, st) {
        if (items.includes('GLASS') && !st.shellRevealed) return 'GLASS';
        if (items.includes('KNIFE') && st.damageMultiplier === 1) return 'KNIFE';
        if (items.includes('CIGARETTES') && st.dealerHp < st.maxDealerHp) return 'CIGARETTES';
        if (items.includes('HANDCUFFS') && !st.handcuffed) return 'HANDCUFFS';
        return null;
    }
};

DEALER_PERSONALITIES.CONFESSOR = {
    name: 'The Confessor',
    taunts: ['Tell me what you did.', 'Say it out loud.', 'I forgive you. I always do.', 'Everyone confesses eventually.'],
    onPlayerHit: () => { updateSanity(-6); },
    onPlayerSelfSafe: function() {
        state.forgiven = state.forgiven || 0;
        if (state.forgiven >= 2 || state.dealerHp >= state.maxDealerHp) return;
        state.forgiven++;
        state.dealerHp++;
        log('CONFESSOR: "Your blank was a confession. I feel lighter." He heals 1.', 'text-purple-300');
        renderHP(); SFX.heal();
    },
    aiBehavior: function(knows) {
        if (knows) return state.chamber[0] ? 'player' : 'self';
        return rnd() < 0.62 ? 'player' : 'self';
    },
    itemPriority: function(items, st) {
        if (items.includes('CIGARETTES') && st.dealerHp < st.maxDealerHp) return 'CIGARETTES';
        if (items.includes('SHIELD') && !st.shieldDealer) return 'SHIELD';
        if (items.includes('KNIFE') && st.damageMultiplier === 1) return 'KNIFE';
        return null;
    }
};

DEALER_PERSONALITIES.CLOCKWORK = {
    name: 'The Clockwork',
    taunts: ['Tick.', 'Tock.', 'On time. Always on time.', 'You are running late.'],
    onPlayerHit: () => { updateSanity(-3); },
    onDealerTurn: function() {
        state.clock = (state.clock || 0) + 1;
        const n = state.clock % 3;
        if (n === 2) log('TICK... the next turn is a strike.', 'text-amber-400');
        if (n === 0) { state.damageMultiplier = Math.max(2, state.damageMultiplier); log('THE CLOCK STRIKES. His shot deals 2x.', 'text-red-500'); SFX.bell(); renderAmmo(); }
    },
    aiBehavior: function(knows) {
        if (knows) return state.chamber[0] ? 'player' : 'self';
        const p = state.liveCount / Math.max(1, state.liveCount + state.blankCount);
        return p > 0.5 ? 'player' : 'self';
    },
    itemPriority: function(items, st) {
        if (items.includes('GLASS') && !st.shellRevealed) return 'GLASS';
        if (items.includes('HANDCUFFS') && !st.handcuffed && st.turn === 'player') return 'HANDCUFFS';
        if (items.includes('CIGARETTES') && st.dealerHp < st.maxDealerHp) return 'CIGARETTES';
        return null;
    }
};

// THE HOST: the Underside boss. Borrows a different rule every round.
DEALER_PERSONALITIES.HOST = {
    name: 'The Host',
    taunts: ['Welcome to the part we do not show.', 'Make yourself uncomfortable.', 'The house has a basement. I live in it.', 'You paid to come down here.'],
    onPlayerHit: () => { updateSanity(-8); showDisturbingOverlay('THE HOST SMILES'); },
    rule: function() { return [DEALER_PERSONALITIES.COLLECTOR, DEALER_PERSONALITIES.CONFESSOR, DEALER_PERSONALITIES.CLOCKWORK][state.round % 3]; },
    onDealerTurn: function() { const r = this.rule(); if (r.onDealerTurn) r.onDealerTurn(); },
    onPlayerSelfSafe: function() { const r = this.rule(); if (r.onPlayerSelfSafe) r.onPlayerSelfSafe(); },
    aiBehavior: DEALER_PERSONALITIES.ANCIENT.aiBehavior,
    itemPriority: DEALER_PERSONALITIES.ANCIENT.itemPriority
};

// dealers that may appear in normal pools (new ones wait until you have won once)
function dealerPool() {
    return Object.keys(DEALER_PERSONALITIES).filter(p => !NOT_IN_POOL.includes(p) && (meta.wins >= 1 || !NEW_DEALERS.includes(p)));
}

// ---------- hooks for the confessor's forgiveness ----------
// (ai.js calls dp.onPlayerSelfSafe() after a safe self-shot)

// ---------- THE UNDERSIDE ----------
let isUnderside = false, isWeekly = false;
const UNDERSIDE_COST = 2000;

function undersideOpen() { return !!meta.trueEnd; }

const _undSelect = selectDifficulty;
selectDifficulty = function(diff) {
    isUnderside = false; isWeekly = false;
    if (diff === 'UNDERSIDE') {
        if (!undersideOpen() || globalMoney < UNDERSIDE_COST + 500) { SFX.empty(); shakeElement(document.getElementById('money-display')); return; }
        globalMoney -= UNDERSIDE_COST;
        isUnderside = true;
        _undSelect('GAUNTLET');
        settings.lastMode = 'UNDERSIDE'; saveSettings();
        return;
    }
    if (diff === 'WEEKLY') {
        isWeekly = true;
        _undSelect('DAILY');
        settings.lastMode = 'WEEKLY'; saveSettings();
        return;
    }
    _undSelect(diff);
};

const _undBuild = buildGauntlet;
buildGauntlet = function() {
    _undBuild();
    state.underside = isUnderside;
    if (isUnderside) {
        const g = state.gauntlet;
        g.lineup = shuffle(NEW_DEALERS.slice()).concat(['HOST']);
        g.total = g.lineup.length;
        const r = pickRelics(1, NORMAL_RELICS);          // the stair gives you a gift
        if (r.length) addRelic(r[0]);
    }
};
const _undSetup = setupFight;
setupFight = function(p, hp, items) { return _undSetup(p, hp, items); };

const _undReward = rewardMult;
rewardMult = function() { return _undReward() * ((state && state.underside) ? 1.5 : 1) * (isWeekly && isDaily ? 1.25 : 1); };

// ---------- WEEKLY ----------
function weeklySeed() {
    const d = new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const y0 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const wk = Math.ceil((((d - y0) / 86400000) + 1) / 7);
    return d.getUTCFullYear() + '-W' + String(wk).padStart(2, '0');
}

function runSeedKey() { return isWeekly ? 'weekly-' + weeklySeed() : 'daily-' + dailySeed(); }
