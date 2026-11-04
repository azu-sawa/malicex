"use strict";

// ---------- DEALER PERSONALITIES ----------
const DEALER_PERSONALITIES = {
    SADISTIC: {
        name: "The Sadist",
        taunts: ["Does it hurt?", "I love that sound", "More blood please", "Scream for me"],
        onPlayerHit: () => { updateSanity(-5); if (rnd() < 0.3) showDisturbingOverlay(
                "HURTS DOESN'T IT"); },
        aiBehavior: function(knowsShell) { if (knowsShell && state.chamber[0] === false) return 'self'; return rnd() < 0.7 ? 'player' : 'self'; },
        itemPriority: function(items, state) {
            if (items.includes('KNIFE') && state.damageMultiplier === 1) return 'KNIFE';
            if (items.includes('HANDCUFFS') && !state.handcuffed && state.turn === 'player') return 'HANDCUFFS';
            if (items.includes('BEER') && state.chamber.length > 2) return 'BEER';
            if (items.includes('CIGARETTES') && state.dealerHp < state.maxDealerHp) return 'CIGARETTES';
            if (items.includes('GLASS') && !state.shellRevealed) return 'GLASS';
            if (items.includes('INVERTER') && state.chamber.length > 0 && !state.shellRevealed) return 'INVERTER';
            return null;
        }
    },
    CALCULATING: {
        name: "The Calculator",
        taunts: ["Probability says...", "Expected value favors me", "Your odds are 23%",
            "I've counted the cards"
        ],
        onPlayerHit: () => log("DEALER: According to my calculations...", 'text-blue-500'),
        aiBehavior: function(knowsShell) {
            const liveProb = state.liveCount / (state.liveCount + state.blankCount);
            if (knowsShell) return state.chamber[0] ? 'player' : 'self';
            return liveProb > 0.6 ? 'player' : 'self';
        },
        itemPriority: function(items, state) {
            if (items.includes('GLASS') && !state.shellRevealed) return 'GLASS';
            if (items.includes('INVERTER') && state.chamber[0] === true) return 'INVERTER';
            if (items.includes('KNIFE') && state.damageMultiplier === 1) return 'KNIFE';
            if (items.includes('CIGARETTES') && state.dealerHp < state.maxDealerHp) return 'CIGARETTES';
            if (items.includes('BEER') && state.liveCount > state.blankCount) return 'BEER';
            return null;
        }
    },
    UNPREDICTABLE: {
        name: "The Madman",
        taunts: ["HAHAHAHA!", "WHO KNOWS?!", "RUSSIAN ROULETTE!", "CHAOS!"],
        onPlayerHit: () => { if (rnd() < 0.5) { const r = rnd(); if (r < 0.3) state
                    .damageMultiplier = 2;
                else if (r < 0.6) state.playerHp += 1;
                else state.dealerHp -= 1;
                log("MADNESS!", 'text-pink-500'); } },
        aiBehavior: () => rnd() < 0.5 ? 'self' : 'player',
        itemPriority: function(items, state) {
            const r = rnd();
            if (r < 0.25 && items.includes('BEER')) return 'BEER';
            if (r < 0.5 && items.includes('GLASS')) return 'GLASS';
            if (r < 0.75 && items.includes('KNIFE')) return 'KNIFE';
            if (items.includes('CIGARETTES')) return 'CIGARETTES';
            return null;
        }
    },
    ANCIENT: {
        name: "The Ancient",
        taunts: ["I was here before sin...", "You hold your breath when you lie", "Elder blood runs cold",
            "You cannot kill what never lived"
        ],
        onPlayerHit: () => { updateSanity(-10);
            showDisturbingOverlay("TIME UNRAVELS"); },
        aiBehavior: function(knowsShell) { if (knowsShell) return state.chamber[0] ? 'player' : 'self'; return rnd() < 0.8 ? 'player' : 'self'; },
        itemPriority: function(items, state) {
            if (items.includes('KNIFE')) return 'KNIFE';
            if (items.includes('GLASS')) return 'GLASS';
            if (items.includes('HANDCUFFS')) return 'HANDCUFFS';
            if (items.includes('INVERTER') && state.chamber[0] === true) return 'INVERTER';
            if (items.includes('BEER') && state.chamber.length > 1) return 'BEER';
            if (items.includes('CIGARETTES') && state.dealerHp < state.maxDealerHp) return 'CIGARETTES';
            return null;
        }
    }
};

// ---------- MIMIC DEALER (new personality) ----------
DEALER_PERSONALITIES.MIMIC = {
    name: "The Mimic",
    taunts: ["Monkey see...", "I learn from you", "Your move. My move.", "Is that your face?"],
    onPlayerHit: () => {
        updateSanity(-4);
        if (rnd() < 0.25) showDisturbingOverlay('YOU SEE YOURSELF');
    },
    aiBehavior: function(knowsShell) {
        if (knowsShell) return state.chamber[0] ? 'player' : 'self';
        const p = state.liveCount / Math.max(1, state.liveCount + state.blankCount);
        return rnd() < (0.35 + p * 0.5) ? 'player' : 'self';
    },
    itemPriority: function(items, st) {
        const copy = st.lastPlayerItem;
        const ok = ['KNIFE', 'GLASS', 'CIGARETTES', 'INVERTER', 'BEER', 'SHIELD'];
        if (copy && ok.includes(copy) && items.includes(copy)) {
            const useless = (copy === 'CIGARETTES' && st.dealerHp >= st.maxDealerHp) ||
                (copy === 'KNIFE' && st.damageMultiplier > 1) ||
                (copy === 'SHIELD' && st.shieldDealer);
            if (!useless) return copy;
        }
        if (items.includes('KNIFE') && st.damageMultiplier === 1) return 'KNIFE';
        if (items.includes('GLASS') && !st.shellRevealed) return 'GLASS';
        if (items.includes('CIGARETTES') && st.dealerHp < st.maxDealerHp) return 'CIGARETTES';
        return null;
    }
};

// ---------- DEALER UPGRADES + THE WARDEN ----------
DEALER_PERSONALITIES.CALCULATING.onPlayerTurn = function() {
    const t = state.liveCount + state.blankCount;
    if (!t) return;
    let pct = Math.round(100 * state.liveCount / t);
    if (rnd() < 0.3) pct = Math.max(5, Math.min(95, pct + (rnd() < 0.5 ? -1 : 1) * (15 + Math.floor(rnd() * 20))));
    log(`CALCULATOR: "${pct}% live."`, 'text-blue-400');
};

DEALER_PERSONALITIES.UNPREDICTABLE.onDealerTurn = function() {
    if (state.chamber.length > 1 && rnd() < 0.25) {
        log('THE MADMAN SHAKES THE CHAMBER!', 'text-pink-500');
        shuffleChamber();
        SFX.glitch();
    }
};

DEALER_PERSONALITIES.UNPREDICTABLE.onPlayerHit = function() {
    if (rnd() < 0.5) {
        const r = rnd();
        if (r < 0.3) state.damageMultiplier = 2;
        else if (r < 0.6) state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + 1);
        else dealDamage('dealer', 1, { noBonus: true, pierce: true });
        renderHP();
        log("MADNESS!", 'text-pink-500');
    }
};

DEALER_PERSONALITIES.WARDEN = {
    name: "The Warden",
    taunts: ["No one leaves.", "Count the bars.", "Rules are rules.", "Sit."],
    onPlayerHit: () => { updateSanity(-4);
        log('WARDEN: "The cell door closes..."', 'text-amber-400'); },
    aiBehavior: function(knowsShell) {
        if (knowsShell) return state.chamber[0] ? 'player' : 'self';
        const p = state.liveCount / Math.max(1, state.liveCount + state.blankCount);
        return rnd() < (0.3 + p * 0.6) ? 'player' : 'self';
    },
    itemPriority: function(items, st) {
        if (items.includes('HANDCUFFS') && !st.handcuffed) return 'HANDCUFFS';
        if (items.includes('SHIELD') && !st.shieldDealer) return 'SHIELD';
        if (items.includes('KNIFE') && st.damageMultiplier === 1 && st.handcuffed) return 'KNIFE';
        if (items.includes('CIGARETTES') && st.dealerHp < st.maxDealerHp) return 'CIGARETTES';
        return null;
    }
};

// ---------- THE FIRST PLAYER (true ending boss) ----------
DEALER_PERSONALITIES.FIRST = {
    name: "The First Player",
    taunts: ["You came back.", "I know how this ends.", "You hold the gun like I did.", "Look at me. Look."],
    onPlayerHit: () => { updateSanity(-8); showDisturbingOverlay("LOOK AT ME"); },
    aiBehavior: DEALER_PERSONALITIES.ANCIENT.aiBehavior,
    itemPriority: DEALER_PERSONALITIES.ANCIENT.itemPriority
};
