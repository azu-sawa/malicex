"use strict";

// =====================================================================
// THE ARCANA (Tarot Rework)
// The old random Tarot Deck is gone. Instead 14 Major Arcana cards are
// EARNED by special conditions (win a fight a certain way) and can only be
// PLAYED IN BOSS FIGHTS, once per fight. Each one changes the fight.
// The card is spent when played; earn it again to use it again.
// Stored in meta.arcana = { owned: {ID:1}, seen: {ID:1}, played: n }
// =====================================================================
const ARCANA = {
    FOOL: { n: 'THE FOOL', rom: '0', cond: 'Win a fight without using a single item.',
        power: 'Heal to full HP and gain 30 Sanity.' },
    MAGICIAN: { n: 'THE MAGICIAN', rom: 'I', cond: 'Win 3 poker hands in one fight.',
        power: 'Your next poker hand wins, and you pull 2 items from your sleeve.' },
    PRIESTESS: { n: 'THE HIGH PRIESTESS', rom: 'II', cond: 'Shoot yourself safely 3 times in a row in one fight.',
        power: 'The whole chamber is shown, and every shell stays revealed this round.' },
    EMPRESS: { n: 'THE EMPRESS', rom: 'III', cond: 'Win a fight without taking damage.',
        power: '+1 max HP, heal 1, and a Shield that stops the next hit.' },
    EMPEROR: { n: 'THE EMPEROR', rom: 'IV', cond: 'Land a killing blow that deals 2 or more damage.',
        power: 'Your next 2 hits on the dealer deal triple damage.' },
    HERMIT: { n: 'THE HERMIT', rom: 'IX', cond: 'Win a fight at exactly 1 HP.',
        power: 'The dealer loses all items and skips their next turn.' },
    WHEEL: { n: 'WHEEL OF FORTUNE', rom: 'X', cond: 'Win a fight in a single round.',
        power: 'Swap your HP with the dealer\'s.' },
    DEVIL: { n: 'THE DEVIL', rom: 'XV', cond: 'Win a fight with Sanity at 25 or less.',
        power: 'Pay 1 HP and 30 Sanity: the dealer takes 3 damage that ignores shields.' },
    TOWER: { n: 'THE TOWER', rom: 'XVI', cond: 'Lose 30 or more Sanity in one fight and still win.',
        power: 'Dealer loses shield, items and 2 HP. You lose 1 HP and 15 Sanity.' },
    SUN: { n: 'THE SUN', rom: 'XIX', cond: 'Win a fight with Sanity at 90 or more.',
        power: 'Heal 3 HP and lift your Sanity to at least 60.' },
    STAR: { n: 'THE STAR', rom: 'XVII', cond: 'Win any Hard, Mercenary or Gauntlet fight.',
        power: 'Up to 3 live shells become blanks.' },
    DEATH: { n: 'DEATH', rom: 'XIII', cond: 'Win 3 runs in a row.',
        power: 'Cut the dealer\'s HP in half. Shields do not help him.' },
    JUDGEMENT: { n: 'JUDGEMENT', rom: 'XX', cond: 'Win a Boss fight.',
        power: 'The dealer\'s HP drops to match yours.' },
    WORLD: { n: 'THE WORLD', rom: 'XXI', cond: 'Win an Ancient or Finale fight, or any fight at Ascension 4+.',
        power: 'Time stops: the dealer cannot act for the rest of the round, and you gain a Shield.' }
};
const ARCANA_KEYS = Object.keys(ARCANA);

function arc() { meta.arcana = meta.arcana || { owned: {}, seen: {}, played: 0 }; return meta.arcana; }
function arcanaOwned() { return ARCANA_KEYS.filter(k => arc().owned[k]); }

// ---- legacy tarot deck: out of the shop, out of the poker reward
(function retireOldDeck() {
    const i = SHOP_CATALOG.findIndex(x => x.id === 'tarotDeck');
    if (i > -1) SHOP_CATALOG.splice(i, 1);
})();
if (Array.isArray(nextRunItems)) {
    const had = nextRunItems.filter(k => k === 'TAROT').length;
    if (had) { for (let i = nextRunItems.length - 1; i >= 0; i--) if (nextRunItems[i] === 'TAROT') nextRunItems.splice(i, 1); setTimeout(() => { arc().owned.FOOL = 1; arc().seen.FOOL = 1; }, 0); }
}

// ---------------- per-fight stats ----------------
function fxNew() { return { items: 0, dmgTaken: 0, pokerWins: 0, sanLoss: 0, selfSafe: 0, bestSelfSafe: 0, bigKill: false, startRound: 0, counted: false }; }
const _arcSetup = setupFight;
setupFight = function(p, hp, items) {
    const r = _arcSetup(p, hp, items);
    state.fx = fxNew();
    state.arcanaUsed = false; state.emperor = 0; state.world = 0; state.priestess = false;
    if (isBossFight() && arcanaOwned().length) log(`THE ARCANA STIRS. ${arcanaOwned().length} card(s) can be played in this fight.`, 'text-purple-300');
    return r;
};
const _arcUse = useItem;
useItem = function(who, key, idx) {
    const n = state.playerItems.length;
    const r = _arcUse(who, key, idx);
    if (who === 'player' && state.fx && state.playerItems.length < n) state.fx.items++;
    return r;
};
const _arcPoker = payPokerWin;
payPokerWin = function(p) { if (state.fx) state.fx.pokerWins++; return _arcPoker(p); };
const _arcSan = updateSanity;
updateSanity = function(d) { if (state.fx && d < 0 && activeGame === 'MAIN') state.fx.sanLoss += -d; return _arcSan(d); };

const _arcDmg = dealDamage;
dealDamage = function(who, dmg, opts) {
    opts = opts || {};
    if (who === 'dealer' && !opts.noBonus && state.emperor > 0 && state.shooter === 'player') {
        state.emperor--; dmg *= 3;
        log('THE EMPEROR: the shot lands three times as hard.', 'text-purple-300');
    }
    const out = _arcDmg(who, dmg, opts);
    if (state.fx) {
        if (who === 'player' && out > 0) state.fx.dmgTaken += out;
        if (who === 'dealer' && state.dealerHp <= 0 && out >= 2) state.fx.bigKill = true;
    }
    return out;
};
// selfSafe streak: a safe self-shot is a blank shot by the player at themself
const _arcShot = processShot;
processShot = function(shooter, target) {
    const live = state.chamber[0];
    const r = _arcShot(shooter, target);
    if (state.fx && shooter === 'player') {
        if (target === 'self' && !live) { state.fx.selfSafe++; state.fx.bestSelfSafe = Math.max(state.fx.bestSelfSafe, state.fx.selfSafe); }
        else state.fx.selfSafe = 0;
    }
    return r;
};

// ---------------- earning ----------------
function arcanaGive(k) {
    if (arc().owned[k]) return false;
    arc().owned[k] = 1; arc().seen[k] = 1;
    saveGame();
    log(`ARCANA EARNED: ${ARCANA[k].n}. Play it in a boss fight.`, 'text-purple-300');
    SFX.bell(); flashScreen('purple' in {} ? 'purple' : 'blue');
    (state.arcanaNew = state.arcanaNew || []).push(k);
    return true;
}
function arcanaOnWin() {
    const fx = state.fx;
    if (!fx || fx.counted) return;
    fx.counted = true;
    const m = currentDifficulty, hp = state.playerHp;
    const hard = ['HARD', 'MERCENARY', 'BOSS', 'ANCIENT', 'FINALE'].includes(m) || !!state.gauntlet;
    if (fx.items === 0) arcanaGive('FOOL');
    if (fx.pokerWins >= 3) arcanaGive('MAGICIAN');
    if (fx.bestSelfSafe >= 3) arcanaGive('PRIESTESS');
    if (fx.dmgTaken === 0) arcanaGive('EMPRESS');
    if (fx.bigKill) arcanaGive('EMPEROR');
    if (hp === 1) arcanaGive('HERMIT');
    if (state.round <= 1) arcanaGive('WHEEL');
    if (sanity <= 25) arcanaGive('DEVIL');
    if (fx.sanLoss >= 30) arcanaGive('TOWER');
    if (sanity >= 90) arcanaGive('SUN');
    if (hard) arcanaGive('STAR');
    if ((meta.winStreak || 0) >= 2 && !state.gauntlet) arcanaGive('DEATH');   // this win makes three
    if (BOSS_MODES.includes(m) || ['HOST', 'WARDEN'].includes(currentDealerPersonality)) arcanaGive('JUDGEMENT');
    if (['ANCIENT', 'FINALE'].includes(m) || ascLevel() >= 4) arcanaGive('WORLD');
}
const _arcEnd = handleGameEnd;
handleGameEnd = function() {
    if (state.playerHp > 0 && state.dealerHp <= 0 && state.fx && !state.fx.counted && currentDifficulty !== 'ENDLESS') arcanaOnWin();
    return _arcEnd();
};

// ---------------- playing ----------------
function arcanaUsable() {
    return activeGame === 'MAIN' && isBossFight() && !state.arcanaUsed && state.turn === 'player' && !state.isProcessing && arcanaOwned().length > 0 && state.chamber.length > 0;
}
function openArcana() {
    if (!arcanaUsable()) {
        if (activeGame === 'MAIN' && !isBossFight()) log('The cards stay silent. Only a boss will answer them.', 'text-gray-500');
        SFX.empty(); return;
    }
    const ov = document.getElementById('arcana-overlay');
    ov.innerHTML = `<div class="arcana-card"><h2>PLAY AN ARCANA</h2><div class="duel-sub">One card per boss fight. It is spent.</div>` +
        arcanaOwned().map(k => `<button class="arcana-pick" onclick="playArcana('${k}')"><b>${ARCANA[k].rom} &middot; ${ARCANA[k].n}</b><span>${ARCANA[k].power}</span></button>`).join('') +
        `<button class="btn-retro border-gray-600 text-gray-400" onclick="closeArcana()">CANCEL</button></div>`;
    ov.classList.remove('hidden');
    SFX.click();
}
function closeArcana() { const ov = document.getElementById('arcana-overlay'); if (ov) ov.classList.add('hidden'); }

function arcanaPower(k) {
    const dmgD = (n) => dealDamage('dealer', n, { pierce: true, noBonus: true });
    const recount = () => { state.liveCount = state.chamber.filter(Boolean).length; state.blankCount = state.chamber.length - state.liveCount; };
    switch (k) {
        case 'FOOL': state.playerHp = state.maxPlayerHp; updateSanity(30); break;
        case 'MAGICIAN': state.cheatNextPoker = true; giveItem('player', randomItemKey()); giveItem('player', randomItemKey()); break;
        case 'PRIESTESS': state.priestess = true; state.shellRevealed = true;
            log('THE CHAMBER: ' + state.chamber.map(l => l ? 'LIVE' : 'BLANK').join(' > '), 'text-purple-300'); break;
        case 'EMPRESS': state.maxPlayerHp++; state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + 1); state.shieldPlayer = true; break;
        case 'EMPEROR': state.emperor = 2; break;
        case 'HERMIT': state.dealerItems = []; state.handcuffed = true; break;
        case 'WHEEL': { const a = state.playerHp, b = state.dealerHp;
            state.playerHp = Math.max(1, Math.min(state.maxPlayerHp, b)); state.dealerHp = Math.max(1, Math.min(state.maxDealerHp, a));
            if (state.dealerHp <= 0) state.dealerHp = 1; break; }
        case 'DEVIL': state.playerHp = Math.max(1, state.playerHp - 1); updateSanity(-30); dmgD(3); break;
        case 'DEATH': dmgD(Math.ceil(state.dealerHp / 2)); break;
        case 'TOWER': state.shieldDealer = false; state.dealerItems = []; dmgD(2);
            dealDamage('player', 1, { pierce: true, noBonus: true }); updateSanity(-15); break;
        case 'SUN': state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + 3); if (sanity < 60) setSanityDirect(60); break;
        case 'STAR': { let n = 0; state.chamber = state.chamber.map((l, i) => { if (l && n < 3) { n++; if (state.shellMods) state.shellMods[i] = null; return false; } return l; }); recount(); break; }
        case 'JUDGEMENT': if (state.dealerHp > state.playerHp) dmgD(state.dealerHp - state.playerHp); break;
        case 'WORLD': state.world = state.chamber.length; state.shieldPlayer = true; break;
    }
}
function playArcana(k) {
    closeArcana();
    if (!arcanaUsable() || !arc().owned[k]) return;
    delete arc().owned[k];
    state.arcanaUsed = true;
    arc().played = (arc().played || 0) + 1;
    unlockAchievement('TAROT_INITIATE');
    if (arc().played >= 5) unlockAchievement('TAROT_5');
    flashScreen('red'); SFX.bell(); buzz([40, 30, 80]);
    log(`${ARCANA[k].n}: ${ARCANA[k].power}`, 'text-purple-300');
    if (typeof showDisturbingOverlay === 'function') showDisturbingOverlay(ARCANA[k].n);
    arcanaPower(k);
    renderUI(); renderHP(); renderAmmo();
    saveGame();
    if (state.dealerHp <= 0 || state.playerHp <= 0) { setTimeout(() => handleGameEnd(), dly(700)); return; }
    arcanaSyncButton(true);
}

// priestess keeps every shell revealed; world freezes the dealer
const _arcStartTurn = startTurn;
startTurn = function() { if (state.priestess && state.chamber.length) state.shellRevealed = true; return _arcStartTurn(); };
const _arcStartRound = startRound;
startRound = function() { state.priestess = false; state.world = 0; return _arcStartRound(); };
const _arcAi = aiTurn;
aiTurn = function() {
    if (state.world > 0 && state.chamber.length > 0 && state.turn === 'dealer' && !state.isProcessing) {
        state.world--;
        log('THE WORLD: time holds. The dealer cannot move.', 'text-purple-300');
        state.turn = 'player';
        setTimeout(startTurn, dly(1200));
        return;
    }
    return _arcAi();
};

// ---------------- button + archive ----------------
function arcanaSyncButton(e) {
    const b = document.getElementById('btn-arcana');
    if (!b) return;
    const show = !!e && activeGame === 'MAIN' && isBossFight() && arcanaUsable();
    b.classList.toggle('hidden', !show);
    if (show) b.innerHTML = `ARCANA (${arcanaOwned().length}) <span class="khint">[${keyLabel('arcana')}]</span>`;
}
const _arcToggle = toggleGunControls;
toggleGunControls = function(e) { _arcToggle(e); arcanaSyncButton(e); };

function renderArcanaBox() {
    const box = document.getElementById('arcana-box');
    if (!box) return;
    const a = arc();
    box.innerHTML = `<div class="contracts-title">THE ARCANA <span class="terms-bonus">${arcanaOwned().length} IN HAND &middot; ${Object.keys(a.seen).length}/${ARCANA_KEYS.length} SEEN</span></div>` +
        `<div class="duel-sub">Earned by winning fights in certain ways. Played only in boss fights, once per fight.</div>` +
        ARCANA_KEYS.map(k => {
            const c = ARCANA[k], own = !!a.owned[k], seen = !!a.seen[k];
            return `<div class="arcana-row ${own ? 'own' : ''}"><b>${c.rom} &middot; ${own || seen ? c.n : '???'}</b>` +
                `<span>${c.cond}</span>${own || seen ? `<em>${c.power}</em>` : ''}</div>`;
        }).join('');
}
const _arcLobby = renderLobby;
renderLobby = function() { _arcLobby(); renderArcanaBox(); };
