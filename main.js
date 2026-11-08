"use strict";

// ---------- EXTRA INPUT + ATMOSPHERE ----------
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) return;
    const k = (e.key || '').toUpperCase();
    if (activeGame === 'MAIN') { if (k === 'B') raisePoker(); else if (k === 'F') foldPoker(); else if (k === 'D') redrawPoker(); }
    else if (activeGame === 'HILO') {
        if (k === 'ESCAPE') closeHiLo();
        else if (k === 'ARROWUP' || k === 'U') hiloGuess('hi');
        else if (k === 'ARROWDOWN' || k === 'D') hiloGuess('lo');
        else if (k === 'ENTER') hiloCashOut();
    }
});

// Heartbeat when the player is one hit from death
setInterval(() => {
    const hb = document.getElementById('heartbeat-overlay');
    const danger = activeGame === 'MAIN' && state.playerHp === 1;
    if (hb) hb.classList.toggle('heartbeat-active', danger);
    if (danger && !isMuted && audioCtx) {
        playTone(55, 'sine', 0.18, 0.18);
        setTimeout(() => playTone(48, 'sine', 0.14, 0.14), 180);
    }
}, 1000);

// ---------- KEYBOARD ----------
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) return;
    const k = (e.key || '').toUpperCase();
    if (activeGame === 'MAIN') {
        if (k === ' ' && !document.getElementById('btn-start').classList.contains('hidden')) startPhase();
        else if (k === ' ' && !document.getElementById('btn-reveal').classList.contains('hidden'))
            resolvePokerPhase();
        else if (k === 'C' && !document.getElementById('btn-cheat').classList.contains('hidden'))
            cheatPoker();
        if (state.turn === 'player') {
            if (k === '1') playerShoot('dealer');
            if (k === '2') playerShoot('self');
            const i = ['Q', 'W', 'E', 'R', 'T'];
            let x = i.indexOf(k);
            if (x > -1 && state.playerItems[x]) useItem('player', state.playerItems[x], x);
            if (k === 'V' && upgrades.unlockColdRead) useCheatSkill('COLD_READ');
            if (k === 'O' && upgrades.unlockPsychOut) useCheatSkill('PSYCH_OUT');
        }
    } else if ((activeGame === 'CUTSCENE' || activeGame === 'INTRO') && k === ' ') endIntro();
    else if (activeGame === 'BLACKJACK' && k === 'ESCAPE') closeBlackjack();
    else if (activeGame === 'SLOTS' && k === 'ESCAPE') closeSlots();
    else if (activeGame === 'CUPS' && k === 'ESCAPE') closeCups();
    else if (activeGame === 'MENU' && k === 'ESCAPE') toggleShop(false);
    else if (activeGame === 'ACHIEVEMENTS' && k === 'ESCAPE') closeAchievements();
    else if (activeGame === 'LEDGER' && k === 'ESCAPE') closeLedger();
});

// ---------- INIT ----------
window.onload = function() {
    loadSettings();
    loadAudioPrefs();
    loadGame();
    psycheInit();
    SAVE.init();
    if (settings.name) DISTURBING_WORDS.push(settings.name.toUpperCase());
    updateSanityUI();
    updateMoneyDisplay();
    updateTexts();
    refreshAudioButtons();
    document.getElementById('startup-screen').classList.remove('hidden');

    document.body.addEventListener('click', () => {
        initAudio();
    }, { once: true });

    setInterval(randomHorrorEvent, 4000);
    setInterval(randomMenuGlitch, 1500);
    setInterval(randomScreenGlitch, 10000);
    setInterval(triggerHallucination, 5000);
    setInterval(checkSanityEffects, 2000);
    setInterval(spawnWhisper, 3000);
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !/[?&]test\b/.test(location.search)) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
};

// Expose
window.enterGame = enterGame;

window.toggleMusic = toggleMusic;

window.setMusicVolume = setMusicVolume;

window.chooseStory = chooseStory;

window.endIntro = endIntro;

window.selectDifficulty = selectDifficulty;

window.toggleShop = toggleShop;




window.claimDailyReward = claimDailyReward;

window.openBlackjack = openBlackjack;

window.closeBlackjack = closeBlackjack;

window.addToBet = addToBet;

window.allInBet = allInBet;

window.dealBlackjack = dealBlackjack;

window.hitBlackjack = hitBlackjack;

window.standBlackjack = standBlackjack;

window.resetBlackjackBet = resetBlackjackBet;

window.openSlots = openSlots;

window.closeSlots = closeSlots;

window.setSlotBet = setSlotBet;

window.spinSlots = spinSlots;

window.openCups = openCups;

window.closeCups = closeCups;

window.setCupBet = setCupBet;

window.pickCup = pickCup;

window.openAchievements = openAchievements;

window.closeAchievements = closeAchievements;

window.openLedger = openLedger;

window.closeLedger = closeLedger;

window.resetSave = resetSave;

window.returnToMenu = returnToMenu;

window.playerShoot = playerShoot;

window.resolvePokerPhase = resolvePokerPhase;

window.startPhase = startPhase;

window.cheatPoker = cheatPoker;

window.useCheatSkill = useCheatSkill;

window.toggleAudio = toggleAudio;

window.raisePoker = raisePoker;

window.openHiLo = openHiLo;

window.closeHiLo = closeHiLo;

window.hiloStart = hiloStart;

window.hiloGuess = hiloGuess;

window.hiloCashOut = hiloCashOut;

window.hiloReset = hiloReset;

window.cycleAscension = cycleAscension;

window.redrawPoker = redrawPoker;

window.foldPoker = foldPoker;

hudInit();
console.log("Malicex \u039c\u03b4 loaded.");
