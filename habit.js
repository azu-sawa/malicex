"use strict";

// =====================================================================
// HABIT (Mu-delta): the house learns how you play, and a low mind lies.
//   - The dealer keeps a running read of your habits and answers it with
//     one counter-item per fight (once you have played a few runs).
//   - At low Sanity item descriptions and the shell numbers can lie.
//     The shell ICONS never lie, so counting them is always the fix.
// Nothing here touches the odds of a shell. Only what the dealer holds
// and what the interface tells you.
// =====================================================================
function habits() {
    if (!meta.habits) meta.habits = { shots: 0, selfEma: 0.5, itemsEma: 2, foldEma: 0.05, raiseEma: 0.2, hands: 0 };
    return meta.habits;
}
const ema = (v, x, k) => v * (1 - k) + x * k;

// ---------- tracking ----------
const _habPlayerShoot = playerShoot;
playerShoot = function(t) {
    if (!(state.isProcessing || state.turn !== 'player')) {
        const h = habits();
        h.shots++;
        h.selfEma = ema(h.selfEma, t === 'self' ? 1 : 0, 0.12);
    }
    return _habPlayerShoot(t);
};
const _habFold = foldPoker;
foldPoker = function() { const h = habits(); h.foldEma = ema(h.foldEma, 1, 0.15); return _habFold(); };
const _habShowdown = showdown;
showdown = function(fold) {
    const h = habits(); h.hands++;
    if (!fold) h.foldEma = ema(h.foldEma, 0, 0.08);
    h.raiseEma = ema(h.raiseEma, state.raised ? 1 : 0, 0.1);
    return _habShowdown(fold);
};
function habitRunEnd() {
    const h = habits();
    h.itemsEma = ema(h.itemsEma, state.runItems || 0, 0.2);
}

// ---------- what the house thinks of you ----------
const HABIT_READS = {
    RECKLESS:  { t: 'You shoot yourself first.', counter: 'INVERTER', line: 'You always turn it on yourself. Let me help.' },
    AGGRESSOR: { t: 'You shoot him without thinking.', counter: 'SHIELD', line: 'You never hesitate. So I came prepared.' },
    SAVER:     { t: 'You hoard your items.', counter: 'HANDCUFFS', line: 'You are saving them for something. You will not get the turns.' },
    COWARD:    { t: 'You fold when it gets hard.', counter: 'BEER', line: 'You run. I will make the table longer.' },
    UNREADABLE:{ t: 'It cannot read you yet.', counter: null, line: '' }
};
function habitProfile() {
    const h = habits();
    if (h.shots < 15) return null;
    let id = 'UNREADABLE';
    if (h.selfEma >= 0.55) id = 'RECKLESS';
    else if (h.selfEma <= 0.2) id = 'AGGRESSOR';
    else if (h.foldEma >= 0.25) id = 'COWARD';
    else if (h.itemsEma <= 1.0 && (meta.runs || 0) >= 6) id = 'SAVER';
    return { id, ...HABIT_READS[id] };
}

const _habSetupFight = setupFight;
setupFight = function(p, hp, items) {
    _habSetupFight(p, hp, items);
    const prof = habitProfile();
    state.houseRead = prof ? prof.id : null;
    if (!prof || !prof.counter || (meta.runs || 0) < 5 || currentDifficulty === 'ENDLESS') return;
    if (state.dealerItems.length >= 6) return;
    state.dealerItems.push(prof.counter);
    unlockAchievement('READ');
    setTimeout(() => {
        if (activeGame !== 'MAIN') return;
        log('THE HOUSE READ YOU: ' + prof.t, 'text-amber-400');
        safeTypeWriter(document.getElementById('dealer-dialogue'), '"' + prof.line + '"', 30, dealerTyperState, false);
    }, 900);
    renderUI();
};

// ---------- the lies ----------
function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0);
}
function lieChance() {
    if ((meta.runs || 0) < 3) return 0;
    return { UNEASY: 0.08, FRACTURED: 0.22, BROKEN: 0.4 }[sanityTier().id] || 0;
}
// which item the description shows (stable for a given round + hp so it does not flicker)
function itemLie(key) {
    const c = lieChance();
    if (!c || key === 'PHANTOM' || !state) return key;
    const h = hash(key + '|' + state.round + '|' + state.playerHp + '|' + (state.playerItems || []).length);
    if ((h % 1000) / 1000 >= c) return key;
    const others = Object.keys(ITEMS).filter(k => k !== 'PHANTOM' && k !== 'TAROT' && k !== key);
    return others[h % others.length];
}
function shownAmmo() {
    let l = state.liveCount, b = state.blankCount;
    if (state.fog || (state.terms || []).includes('BLIND')) return { l: '?', b: '?' };
    const c = { FRACTURED: 0.10, BROKEN: 0.30 }[sanityTier().id];
    if (c && (meta.runs || 0) >= 3) {
        const h = hash('a' + state.round + '|' + state.chamber.length + '|' + state.dealerHp);
        if ((h % 1000) / 1000 < c) {
            if (h % 2) l = Math.max(0, l + 1); else b = Math.max(0, b + 1);
            state.ammoLied = true;
        }
    }
    return { l, b };
}

// ---------- dealer face mood ----------
function faceMood(m, ms) {
    const f = document.getElementById('dealer-face');
    if (!f) return;
    f.classList.remove('mood-grin', 'mood-hurt');
    if (m) { f.classList.add('mood-' + m); setTimeout(() => f.classList.remove('mood-' + m), ms || 1600); }
}
const _habDealerSpeak = dealerSpeak;
dealerSpeak = function(k) {
    if (k === 'taunt' || k === 'win') faceMood('grin', 2000);
    else if (k === 'hit' || k === 'lose') faceMood('hurt', 1400);
    return _habDealerSpeak(k);
};

// ---------- the Grimoire panel ----------
function renderHabitBox() {
    const box = document.getElementById('habit-box');
    if (!box) return;
    const h = habits(), p = habitProfile();
    let body;
    if (!p) body = `<div class="contracts-note">It is still watching. ${Math.max(0, 15 - h.shots)} more shots until it has an opinion.</div>`;
    else {
        body = `<div class="habit-read"><b>${p.id}</b> &middot; ${p.t}</div>` +
            (p.counter ? `<div class="contracts-note">Each fight it now starts with a ${ITEMS[p.counter].en.n}. Play differently and the read changes.</div>` : '<div class="contracts-note">Nothing to exploit. Keep it that way.</div>');
    }
    box.innerHTML = `<div class="contracts-title">WHAT THE HOUSE KNOWS</div>${body}` +
        `<div class="habit-bars"><span>Shoots self first</span><i><u style="width:${Math.round(h.selfEma * 100)}%"></u></i></div>`;
}
