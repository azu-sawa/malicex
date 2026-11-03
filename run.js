"use strict";

// ---------- POKER: RAISE + REWARDS ----------
// ---------- RUN SUMMARY + WIN ACHIEVEMENTS ----------
function checkWinAchievements() {
    unlockAchievement('FIRST_WIN');
    if (state.playerHp === 1) unlockAchievement('COMEBACK');
    if (currentDifficulty === 'BOSS') unlockAchievement('DEVIL_SLAYER');
    if (currentDifficulty === 'ANCIENT') unlockAchievement('ANCIENT_SLAIN');
    if (currentDealerPersonality === 'MIMIC') unlockAchievement('MIMIC_SLAYER');
    if (state.damageTaken === 0 && ['HARD', 'MERCENARY', 'BOSS', 'ANCIENT'].includes(currentDifficulty))
        unlockAchievement('UNTOUCHABLE');
}

function addRunSummary(el) {
    if (!el) return;
    const line = `Round ${state.round} · Items used ${state.runItems || 0} · Damage taken ${state.damageTaken || 0} · Shots at dealer ${state.shotsAtDealer || 0} · Sanity ${sanity}`;
    el.innerHTML += `<div class="text-lg mt-6 text-gray-600 tracking-wider">${line}</div>`;
}

// ---------- RUN START ----------
function selectDifficulty(diff) {
    let cost = 0;
    if (diff === 'HARD') cost = 200;
    else if (diff === 'MERCENARY') cost = 2000;
    else if (diff === 'BOSS') cost = 5000;
    else if (diff === 'ANCIENT') cost = 8000;
    else if (diff === 'ENDLESS') cost = 500;
    else if (diff === 'GAUNTLET') cost = 500;
    if (globalMoney < cost) { shakeElement(document.getElementById('money-display'));
        SFX.empty(); return; }
    globalMoney -= cost;
    saveGame();
    updateMoneyDisplay(true);
    isDaily = (diff === 'DAILY');
    currentDifficulty = isDaily ? 'GAUNTLET' : diff;
    SFX.click();
    if (meta.wins >= 1 && !isDaily && currentDifficulty !== 'ENDLESS') openPactScreen(beginRun);
    else { pendingPact = null;
        beginRun(); }
}

function beginRun() {
    hideEventScreen();
    const q = new URLSearchParams(location.search).get('seed');
    if (isDaily) seedRng('daily-' + dailySeed());
    else if (q) seedRng(q);
    else seedRng(null);
    activeGame = 'MAIN';
    SFX.click();
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('game-ui').classList.remove('hidden');
    document.getElementById('sanity-hud').classList.remove('hidden');
    if (currentDifficulty === 'ENDLESS') {
        state.endlessScore = 0;
        document.getElementById('endless-round').innerText = 1;
        document.getElementById('endless-hiscore').innerText = endlessHighScore;
        document.getElementById('endless-hud').classList.remove('hidden');
    } else document.getElementById('endless-hud').classList.add('hidden');
    startGame();
    renderRelicBar();
}

function startGame() {
    const asc = ascLevel();
    setSanityDirect(Math.max(SANITY.RUN_FLOOR, Math.min(100, sanity)));
    if (asc >= 3) setSanityDirect(Math.max(30, sanity - 10));
    stopTurnTimer();
    state = {
        ...state,
        round: 1,
        isProcessing: false,
        playerItems: [...nextRunItems],
        dealerItems: [],
        usedCheatSkills: [],
        bluffTurns: 0
    };
    nextRunItems = [];
    Object.assign(state, runDefaults());
    meta.runs++;
    const bi = document.getElementById('bluff-indicator');
    if (bi) bi.style.display = 'none';

    state.pact = pendingPact;
    pendingPact = null;
    state.maxPlayerHp = (upgrades.extraHp ? 5 : 4) - (asc >= 5 ? 1 : 0);
    if (state.pact === 'BLOOD_MONEY') {
        state.maxPlayerHp = Math.max(1, state.maxPlayerHp - 1);
        globalMoney += 500;
        totalStats.moneyEarned += 500;
        updateMoneyDisplay(true);
    }
    if (state.pact === 'HOLLOW_MIND') setSanityDirect(Math.min(sanity, 50));
    state.playerHp = state.maxPlayerHp;

    if (upgrades.startCigs) state.playerItems.push('CIGARETTES');
    if (upgrades.startKnife) state.playerItems.push('KNIFE');
    if (upgrades.startInverter) state.playerItems.push('INVERTER');
    if (upgrades.startShield) state.playerItems.push('SHIELD');

    let hp = 3, items = [], pers;
    if (currentDifficulty === 'GAUNTLET') {
        buildGauntlet();
        hp = GAUNTLET_HP[0];
        items = GAUNTLET_ITEMS[0];
        pers = state.gauntlet.lineup[0];
        if (state.pact === 'HOLLOW_MIND') {
            const r = pickRelics(1, NORMAL_RELICS);
            if (r.length) addRelic(r[0]);
        }
    } else {
        if (currentDifficulty === 'HARD') { hp = 4;
            items = ['CIGARETTES']; }
        else if (currentDifficulty === 'MERCENARY') { hp = 6;
            items = ['KNIFE', 'CIGARETTES']; }
        else if (currentDifficulty === 'BOSS') { hp = 7;
            items = ['KNIFE', 'HANDCUFFS', 'CIGARETTES', 'SHIELD']; }
        else if (currentDifficulty === 'ANCIENT') { hp = 9;
            items = ['KNIFE', 'GLASS', 'INVERTER', 'CIGARETTES', 'SHIELD']; }
        else if (currentDifficulty === 'ENDLESS') hp = 5;
        if (upgrades.weakDealer && hp >= 4 && !['BOSS', 'ANCIENT', 'ENDLESS'].includes(currentDifficulty)) hp -= 1;
        if (currentDifficulty === 'ANCIENT') pers = 'ANCIENT';
        else {
            const list = Object.keys(DEALER_PERSONALITIES).filter(p => p !== 'ANCIENT');
            pers = list[Math.floor(rnd() * list.length)];
        }
        if (state.pact === 'HOLLOW_MIND') { giveItem('player', randomItemKey());
            giveItem('player', randomItemKey()); }
    }
    setupFight(pers, hp, items);
    log(`DEALER: ${DEALER_PERSONALITIES[pers].name} approaches...`, 'text-red-400');
    dealerSpeak('normal');
    playerSpeak('start');
    startRound();
}
