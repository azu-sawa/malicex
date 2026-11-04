"use strict";

// =====================================================================
// SIN (Mu-delta): the crime you came in with changes how you play.
//   THIEF      light fingers: lift items from the dealer. 5 lifts in a run
//              and a win unlocks the ending THE HEIST.
//   PARRICIDE  blood debt: pain builds WRATH, wrath makes the next shot
//              at the dealer hit harder. Land the killing blow with wrath
//              and the ending THE INHERITANCE opens.
// Loaded after endings.js / content.js / gauntlet.js. Everything here
// wraps existing functions, so nothing else needs to know it exists.
// =====================================================================
const SIN_INFO = {
    THIEF: {
        name: 'THIEF', tag: 'Rent is due. The door was unlocked.',
        buffs: [
            'Start every run with a lifted item.',
            'LIFT button: once a round, steal an item from the dealer (55% to land, a miss costs 4 Sanity).',
            'Winning a poker hand sometimes lets you pocket one more of his items.',
            '+10% cash on wins.'],
        goal: 'Steal 5 items in one run and win: THE HEIST.'
    },
    PARRICIDE: {
        name: 'PARRICIDE', tag: 'He had it coming. Probably.',
        buffs: [
            'Start every run with a Saw.',
            'WRATH: every wound you take builds Wrath (max 3). At 2 Wrath your next live shot at the dealer deals +1 damage.',
            'BLOOD BOUND: once a run, a killing blow leaves you at 1 HP with full Wrath instead.',
            'Cost: a live hit on the dealer costs 5 extra Sanity. You remember his face.'],
        goal: 'Land the killing blow with Wrath and win: THE INHERITANCE.'
    }
};
const HEIST_NEED = 5;

function sinKey() { return (state && state.sin) || storyMode; }
function isThief() { return sinKey() === 'THIEF'; }
function isParricide() { return sinKey() === 'PARRICIDE'; }

// ---------- per-run state ----------
function sinDefaults() {
    return { sin: storyMode, stolen: 0, lifts: 1, wrath: 0, wrathHits: 0, wrathKill: false, bloodUsed: false,
             sinStart: false, sinCues: [], sinEnding: null, shooter: null, wrathShot: false };
}
const _sinRunDefaults = runDefaults;
runDefaults = function() { return { ..._sinRunDefaults(), ...sinDefaults() }; };

// ---------- start of run / start of round ----------
const _sinStartRound = startRound;
startRound = function() {
    if (!state.sinStart) {
        state.sinStart = true;
        state.sin = storyMode;
        if (isThief()) { giveItem('player', randomItemKey()); log('LIGHT FINGERS: you walked in with something that was not yours.', 'text-cyan-300'); }
        if (isParricide()) { giveItem('player', 'KNIFE'); log('FAMILY KNIFE: it was in your coat. You do not remember packing it.', 'text-red-400'); }
    }
    state.lifts = 1;
    _sinStartRound();
    sinSyncButton(false);
};

// ---------- THIEF ----------
function stealFromDealer(free) {
    if (!state.dealerItems.length) return false;
    if (state.playerItems.length >= 5) { log('SLOTS FULL. Your pockets cannot hold more.', 'text-gray-500'); return false; }
    const i = Math.floor(rnd() * state.dealerItems.length);
    const key = state.dealerItems.splice(i, 1)[0];
    giveItem('player', key);
    state.stolen = (state.stolen || 0) + 1;
    meta.stolenTotal = (meta.stolenTotal || 0) + 1;
    log(`${free ? 'PICKPOCKET' : 'LIFTED'}: ${ITEMS[key].en.n}. (${state.stolen} this run)`, 'text-cyan-300');
    SFX.chip();
    buzz(20);
    if (meta.stolenTotal >= 10) unlockAchievement('LIGHT_FINGERS');
    if (state.stolen === HEIST_NEED) sinCue('THIEF', ['Five things that were not yours.', 'The dealer has not noticed. Or he lets you think so.']);
    renderUI();
    return true;
}

function liftAction() {
    if (!isThief() || state.turn !== 'player' || state.isProcessing || state.lifts < 1) return;
    if (!state.dealerItems.length) { log('He has nothing left to take.', 'text-gray-500'); SFX.empty(); return; }
    state.lifts--;
    let p = 0.55;
    if (currentDealerPersonality === 'COLLECTOR') p += 0.25;       // it never watches its own pockets
    if (rnd() < p) stealFromDealer(false);
    else { log('CAUGHT. "Hands on the table."', 'text-red-400'); updateSanity(-4); SFX.empty(); buzz([40, 30, 40]); shakeElement(document.getElementById('dealer-items')); }
    sinSyncButton(true);
}

const _sinPayWin = payPokerWin;
payPokerWin = function(p) {
    _sinPayWin(p);
    if (isThief() && state.dealerItems.length && rnd() < 0.4) stealFromDealer(true);
};

function sinSyncButton(e) {
    const b = document.getElementById('btn-lift');
    if (!b) return;
    const show = isThief() && !!e && state.turn === 'player' && !state.isProcessing && state.lifts > 0 && state.dealerItems.length > 0;
    b.classList.toggle('hidden', !show);
    if (show) b.innerHTML = `LIFT <span class="khint">[L]</span>`;
}
const _sinToggleGun = toggleGunControls;
toggleGunControls = function(e) { _sinToggleGun(e); sinSyncButton(e); };

document.addEventListener('keydown', e => {
    if (activeGame === 'MAIN' && (e.key === 'l' || e.key === 'L')) liftAction();
});

// ---------- PARRICIDE ----------
const _sinProcessShot = processShot;
processShot = function(shooter, target) {
    state.shooter = shooter;
    setTimeout(() => { state.shooter = null; }, 1000);
    return _sinProcessShot(shooter, target);
};

const _sinSetupFight = setupFight;
setupFight = function(p, hp, items) { state.wrathKill = false; return _sinSetupFight(p, hp, items); };

const _sinDealDamage = dealDamage;
dealDamage = function(who, dmg, opts) {
    opts = opts || {};
    let usedWrath = false;
    if (who === 'dealer' && isParricide() && state.shooter === 'player' && state.wrath >= 2 && !opts.noBonus) {
        dmg += 1; state.wrath -= 2; state.wrathHits++; usedWrath = true;
        log('WRATH! The shot lands harder.', 'text-red-500');
        flashScreen('red'); SFX.thump(); buzz([30, 30, 80]);
        unlockAchievement('WRATH_FIRST');
        updateSanity(-1);
    }
    if (who === 'dealer' && isParricide() && state.shooter === 'player') updateSanity(-5);
    const was = state.playerHp;
    const out = _sinDealDamage(who, dmg, opts);
    if (who === 'dealer' && usedWrath && state.dealerHp <= 0) state.wrathKill = true;
    if (who === 'player' && isParricide() && out > 0) {
        state.wrath = Math.min(3, state.wrath + 1);
        if (state.playerHp <= 0 && !state.bloodUsed) {
            state.bloodUsed = true; state.playerHp = 1; state.wrath = 3;
            log('BLOOD BOUND. Something older than you refuses to let go.', 'text-red-500');
            flashScreen('red'); SFX.heartbeat(); buzz([80, 40, 80, 40, 120]);
            unlockAchievement('BLOOD_BOUND');
            sinCue('PARRICIDE', ['You should be dead.', 'He used to say that the family never lets go.']);
        }
    }
    return out;
};

// wrath badge on the player's avatar
const _sinBadges = hudSyncBadges;
hudSyncBadges = function() {
    _sinBadges();
    const p = document.getElementById('player-badges');
    if (!p || !state) return;
    let extra = '';
    if (isParricide() && state.wrath > 0) extra += badgeHtml('b-red', 'WRATH ' + state.wrath + (state.wrath >= 2 ? ' READY' : ''), 'bolt');
    if (isThief() && state.stolen > 0) extra += badgeHtml('b-cyan', 'LIFTED ' + state.stolen + '/' + HEIST_NEED, 'coin');
    if (extra) { p.innerHTML += extra; p.dataset.h = p.innerHTML; }
};

// ---------- payout ----------
const _sinRewardMult = rewardMult;
rewardMult = function() { return _sinRewardMult() * ((state && state.sin === 'THIEF') ? 1.1 : 1); };

// ---------- special endings ----------
ENDINGS.HEIST = { en_t: 'THE HEIST',
    en_d: 'You walk out with the cards, the shells, the chair, and a coin that was never yours. Nobody stops you. That is the worst part: the house wanted you to take it.' };
ENDINGS.INHERITANCE = { en_t: 'THE INHERITANCE',
    en_d: 'The mask slides off with the last shell. You knew the face. You had always known the face. Now the seat is warm, and it is yours.' };
const SIN_ENDINGS = ['HEIST', 'INHERITANCE'];

function sinEnding() {
    if (['ENDLESS', 'FINALE'].includes(currentDifficulty) || state.playerHp <= 0) return null;
    if (isThief() && state.stolen >= HEIST_NEED) return 'HEIST';
    if (isParricide() && state.wrathKill) return 'INHERITANCE';
    return null;
}
const _sinPickEnding = pickEnding;
pickEnding = function() { const s = sinEnding(); state.sinEnding = s; return s || _sinPickEnding(); };

// ---------- mid-run cues (memory flashes at the start of your turn) ----------
function sinCue(sin, lines) {
    if (state.sin !== sin) return;
    meta.cues = meta.cues || {};
    const k = sin + lines[0];
    if (meta.cues[k] && meta.cues[k] > 2) return;     // stop repeating after a few times
    meta.cues[k] = (meta.cues[k] || 0) + 1;
    state.sinCues.push(lines);
}
const _sinTurnHooks = onPlayerTurnHooks;
onPlayerTurnHooks = function() {
    _sinTurnHooks();
    sinSyncButton(true);
    if (state.sinCues && state.sinCues.length && typeof cineFlash === 'function') {
        const lines = state.sinCues.shift();
        stopTurnTimer();
        cineFlash(lines, () => startTurnTimer());
    }
};

// ---------- switching sin ----------
function setSin(k) {
    if (!SIN_INFO[k] || activeGame === 'MAIN') return;
    storyMode = k;
    meta.sinsPlayed = meta.sinsPlayed || {};
    saveGame();
    SFX.click();
    const ind = document.getElementById('story-mode-indicator');
    if (ind) ind.innerText = `SUBJECT: ${storyMode}`;
    renderSinCard();
    const id = k === 'THIEF' ? 'intro_thief' : 'intro_parricide';
    if (typeof cinePlay === 'function' && !(meta.cineSeen || {})[id]) cinePlay(id, () => { showMenu(); });
}

function renderSinCard() {
    const box = document.getElementById('sin-card');
    if (!box) return;
    const i = SIN_INFO[storyMode] || SIN_INFO.THIEF;
    const other = storyMode === 'THIEF' ? 'PARRICIDE' : 'THIEF';
    const got = (meta.sinEndings || []).includes(storyMode === 'THIEF' ? 'HEIST' : 'INHERITANCE');
    box.innerHTML =
        `<div class="sin-head"><span class="sin-label">YOUR SIN</span>` +
        `<div class="sin-toggle" role="group" aria-label="Choose your sin">` +
        ['THIEF', 'PARRICIDE'].map(k => `<button class="sin-btn ${k === storyMode ? 'on' : ''}" onclick="setSin('${k}')" aria-pressed="${k === storyMode}">${k}</button>`).join('') +
        `</div></div>` +
        `<ul class="sin-buffs">${i.buffs.map(b => `<li>${b}</li>`).join('')}</ul>` +
        `<div class="sin-goal ${got ? 'done' : ''}">${got ? '[X] ' : '[ ] '}${i.goal}</div>`;
}
