"use strict";

// ---------- HI-LO MINIGAME ----------
let hiloState = { bet: 0, streak: 0, card: null, deck: [], active: false };

function hiloMult(streak) { const t = [1, 1.2, 1.6, 2.2, 3, 4]; return streak < t.length ? t[streak] : t[5] * Math.pow(1.35, streak - 5); }

function openHiLo() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hilo-screen').classList.remove('hidden');
    activeGame = 'HILO';
    hiloReset();
}

function closeHiLo() {
    if (hiloState.active) { shakeElement(document.getElementById('hilo-msg'));
        SFX.empty(); return; }
    document.getElementById('hilo-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    activeGame = 'MENU';
}

function hiloReset() {
    hiloState = { bet: 0, streak: 0, card: null, deck: [], active: false };
    document.getElementById('hilo-bet-ui').classList.remove('hidden');
    document.getElementById('hilo-game-ui').classList.add('hidden');
    document.getElementById('hilo-msg').innerText = 'PLACE YOUR BET';
}

function hiloRender() {
    const c = hiloState.card;
    const el = document.getElementById('hilo-card');
    el.innerHTML = `<span>${c.rank}</span><span class="text-3xl">${c.suit}</span>`;
    el.className = `card ${['♥', '♦'].includes(c.suit) ? 'red' : ''}`;
    const next = Math.floor(hiloState.bet * hiloMult(hiloState.streak));
    document.getElementById('hilo-info').innerText =
        `${'BET'} $${hiloState.bet} · ${'STREAK'} ${hiloState.streak} · ${'CASH OUT'} $${next}`;
    document.getElementById('hilo-cash').disabled = hiloState.streak < 1;
}

function hiloStart(b) {
    if (hiloState.active) return;
    if (globalMoney < b) { shakeElement(document.getElementById('money-display'));
        SFX.empty(); return; }
    globalMoney -= b;
    updateMoneyDisplay(true);
    saveGame();
    hiloState = { bet: b, streak: 0, card: null, deck: createDeck(), active: true };
    hiloState.card = hiloState.deck.pop();
    document.getElementById('hilo-bet-ui').classList.add('hidden');
    document.getElementById('hilo-game-ui').classList.remove('hidden');
    document.getElementById('hilo-controls').classList.remove('hidden');
    document.getElementById('hilo-again').classList.add('hidden');
    document.getElementById('hilo-msg').innerText = 'HIGHER OR LOWER?';
    SFX.flip();
    hiloRender();
}

function hiloFinish() {
    hiloState.active = false;
    totalStats.minigamesPlayed++;
    if (totalStats.minigamesPlayed >= 50) unlockAchievement('GAMBLER');
    document.getElementById('hilo-controls').classList.add('hidden');
    document.getElementById('hilo-again').classList.remove('hidden');
    saveGame();
}

function hiloGuess(dir) {
    if (!hiloState.active) return;
    if (hiloState.deck.length < 3) hiloState.deck = createDeck();
    const cur = hiloState.card;
    const next = hiloState.deck.pop();
    hiloState.card = next;
    SFX.flip();
    hiloRender();
    if (next.val === cur.val) {
        document.getElementById('hilo-msg').innerText = 'TIE - SAFE';
        return;
    }
    const ok = dir === 'hi' ? next.val > cur.val : next.val < cur.val;
    if (ok) {
        hiloState.streak++;
        if (hiloState.streak > meta.bestHiLo) meta.bestHiLo = hiloState.streak;
        if (hiloState.streak >= 5) unlockAchievement('HI_LO_5');
        updateSanity(2);
        SFX.win();
        flashScreen('green');
        document.getElementById('hilo-msg').innerText = 'CORRECT! Push on or cash out?';
        hiloRender();
    } else {
        flashScreen('red');
        SFX.lose();
        updateSanity(-7);
        document.getElementById('hilo-msg').innerText = 'WRONG. Bet lost.';
        hiloFinish();
    }
}

function hiloCashOut() {
    if (!hiloState.active || hiloState.streak < 1) return;
    const payout = Math.floor(hiloState.bet * hiloMult(hiloState.streak));
    globalMoney += payout;
    totalStats.moneyEarned += payout;
    updateMoneyDisplay(true);
    flashScreen('green');
    SFX.win();
    document.getElementById('hilo-msg').innerText = `${'CASHED OUT'} +$${payout}`;
    hiloFinish();
}

// ---------- BLACKJACK ----------
function openBlackjack() {
    const mm = document.getElementById('main-menu');
    const bj = document.getElementById('blackjack-screen');
    if (mm && bj) { mm.classList.add('hidden');
        bj.classList.remove('hidden');
        activeGame = 'BLACKJACK';
        resetBlackjackBet(); }
}

function closeBlackjack() {
    const mm = document.getElementById('main-menu');
    const bj = document.getElementById('blackjack-screen');
    if (mm && bj) { bj.classList.add('hidden');
        mm.classList.remove('hidden');
        activeGame = 'MENU'; }
}

function addToBet(amt) {
    if (amt === -999999) bjState.bet = 0;
    else if (globalMoney >= bjState.bet + amt) bjState.bet += amt;
    else { shakeElement(document.getElementById('money-display'));
        SFX.empty(); }
    const bv = document.getElementById('bj-bet-val');
    if (bv) bv.innerText = bjState.bet;
}

function allInBet() { bjState.bet = globalMoney; const bv = document.getElementById('bj-bet-val'); if (bv) bv
        .innerText = bjState.bet; }

function resetBlackjackBet() {
    bjState.bet = 0;
    const lbl = TEXT.en.bj_bet;
    const msgEl = document.getElementById('bj-msg');
    if (msgEl) msgEl.innerHTML = `${lbl} $<span id="bj-bet-val">0</span>`;
    const betUi = document.getElementById('bj-bet-ui');
    if (betUi) betUi.classList.remove('hidden');
    const gameUi = document.getElementById('bj-game-ui');
    if (gameUi) gameUi.classList.add('hidden');
}

function dealBlackjack() {
    if (bjState.bet <= 0) { shakeElement(document.getElementById('bj-msg'));
        SFX.empty(); return; }
    if (globalMoney < bjState.bet) { shakeElement(document.getElementById('money-display'));
        SFX.empty(); return; }
    globalMoney -= bjState.bet;
    updateMoneyDisplay(true);
    saveGame();
    SFX.flip();
    const betUi = document.getElementById('bj-bet-ui');
    const gameUi = document.getElementById('bj-game-ui');
    if (betUi) betUi.classList.add('hidden');
    if (gameUi) { gameUi.classList.remove('hidden');
        gameUi.style.display = 'flex'; }
    const backBtn = document.getElementById('bj-btn-back');
    if (backBtn) backBtn.classList.add('hidden');
    const controls = document.getElementById('bj-controls');
    if (controls) controls.classList.remove('hidden');

    bjState.deck = createDeck();
    bjState.playerHand = [bjState.deck.pop(), bjState.deck.pop()];
    bjState.dealerHand = [bjState.deck.pop(), bjState.deck.pop()];
    renderBjHands(false);

    if (getBjScore(bjState.playerHand) === 21) {
        setTimeout(() => {
            renderBjHands(true);
            if (getBjScore(bjState.dealerHand) === 21) { endBlackjack("PUSH (21 vs 21).", true); } else {
                endBlackjack("BLACKJACK! WIN 3:2!", true); }
        }, 1000);
    }
}

function hitBlackjack() { bjState.playerHand.push(bjState.deck.pop());
    SFX.flip();
    renderBjHands(false); if (getBjScore(bjState.playerHand) > 21) endBlackjack("BUST!", false); }

async function standBlackjack() {
    const controls = document.getElementById('bj-controls');
    if (controls) controls.classList.add('hidden');
    renderBjHands(true);
    let ds = getBjScore(bjState.dealerHand);
    while (ds < 17) { await new Promise(r => setTimeout(r, 800));
        bjState.dealerHand.push(bjState.deck.pop());
        SFX.flip();
        ds = getBjScore(bjState.dealerHand);
        renderBjHands(true); }
    await new Promise(r => setTimeout(r, 500));
    resolveBlackjack(ds);
}

function getBjScore(h) {
    let s = 0,
        a = 0;
    for (let c of h) {
        if (c.rank === 'A') a++;
        else if (['J', 'Q', 'K'].includes(c.rank)) s += 10;
        else s += parseInt(c.rank);
    }
    for (let i = 0; i < a; i++) s += 11;
    while (s > 21 && a > 0) { s -= 10;
        a--; }
    return s;
}

function renderBjHands(rev) {
    const cHtml = (c) =>
        `<div class="card ${c&&['♥','♦'].includes(c.suit)?'red':''}">${c.rank}${c.suit}</div>`;
    const pHandEl = document.getElementById('bj-p-hand');
    const dHandEl = document.getElementById('bj-d-hand');
    if (pHandEl) pHandEl.innerHTML = bjState.playerHand.map(cHtml).join('');
    if (dHandEl) dHandEl.innerHTML = bjState.dealerHand.map((c, i) => !rev && i === 1 ?
        `<div class="card hidden-card">?</div>` : cHtml(c)).join('');
    const pScore = document.getElementById('bj-p-score');
    if (pScore) pScore.innerText = getBjScore(bjState.playerHand);
    const dScore = document.getElementById('bj-d-score');
    if (dScore) dScore.innerText = rev ? getBjScore(bjState.dealerHand) : "?";
}

function resolveBlackjack(ds) {
    const ps = getBjScore(bjState.playerHand);
    if (ds > 21 || ps > ds) { endBlackjack("WIN!", true); } else if (ps === ds) { endBlackjack("PUSH.",
        true); } else endBlackjack("LOSE.", false);
}

function endBlackjack(msg, win) {
    totalStats.minigamesPlayed++;
    if (totalStats.minigamesPlayed >= 50) unlockAchievement('GAMBLER');
    const msgEl = document.getElementById('bj-msg');
    if (msgEl) msgEl.innerText = msg;
    const controls = document.getElementById('bj-controls');
    if (controls) controls.classList.add('hidden');
    const backBtn = document.getElementById('bj-btn-back');
    if (backBtn) backBtn.classList.remove('hidden');
    if (win) {
        let payout = bjState.bet;
        if (msg.includes("BLACKJACK")) payout = bjState.bet * 2.5;
        else if (msg.includes("PUSH")) payout = bjState.bet;
        else payout = bjState.bet * 2;
        globalMoney += payout;
        totalStats.moneyEarned += payout;
        updateMoneyDisplay(true);
        saveGame();
        flashScreen('green');
        SFX.win();
        updateSanity(5);
    } else { flashScreen('red');
        SFX.lose();
        updateSanity(-7); }
}

// ---------- SLOTS ----------
function openSlots() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('slots-screen').classList.remove('hidden');
    activeGame = 'SLOTS';
    slotState.bet = 10;
    updateSlotBtns();
}

function closeSlots() {
    document.getElementById('slots-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    activeGame = 'MENU';
}

function setSlotBet(b) { slotState.bet = b;
    updateSlotBtns(); }

function updateSlotBtns() {
    ['low', 'mid', 'high'].forEach(l => { const el = document.getElementById(`btn-slot-${l}`); if (el) el
            .classList.remove('bg-gray-800'); });
    const active = slotState.bet === 10 ? 'low' : slotState.bet === 50 ? 'mid' : 'high';
    const ael = document.getElementById(`btn-slot-${active}`);
    if (ael) ael.classList.add('bg-gray-800');
    document.getElementById('slot-msg').innerText = `TARUHAN: $${slotState.bet}`;
}

function spinSlots() {
    if (slotState.isSpinning || globalMoney < slotState.bet) {
        if (globalMoney < slotState.bet) { shakeElement(document.getElementById('money-display'));
            SFX.empty(); }
        return;
    }
    globalMoney -= slotState.bet;
    updateMoneyDisplay(true);
    saveGame();
    slotState.isSpinning = true;
    SFX.flip();
    const reels = [1, 2, 3].map(i => document.getElementById(`reel-${i}`));
    reels.forEach(r => { if (r) r.classList.add('reel-spin'); });
    const BASE_SYMBOLS = ['🍒', '🍋', '🔔', '💎', '7️⃣', '💀', '👹'];
    let symbols = [...BASE_SYMBOLS];
    
    const res = [0, 1, 2].map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    setTimeout(() => { if (reels[0]) { reels[0].classList.remove('reel-spin');
            reels[0].innerText = res[0]; } }, 500);
    setTimeout(() => { if (reels[1]) { reels[1].classList.remove('reel-spin');
            reels[1].innerText = res[1]; } }, 1000);
    setTimeout(() => {
        if (reels[2]) { reels[2].classList.remove('reel-spin');
            reels[2].innerText = res[2]; }
        slotState.isSpinning = false;
        calcSlotWin(res);
    }, 1500);
}

function calcSlotWin(r) {
    totalStats.minigamesPlayed++;
    if (totalStats.minigamesPlayed >= 50) unlockAchievement('GAMBLER');
    let mult = 0;
    if (r[0] === r[1] && r[1] === r[2]) {
        if (r[0] === '👹') mult = 100;
        else if (r[0] === '7️⃣') mult = 50;
        else if (r[0] === '💎') mult = 25;
        else if (r[0] === '💀') mult = 0;
        else mult = 5;
    } else if (r[0] === r[1] || r[1] === r[2] || r[0] === r[2]) {
        if (!r.includes('💀')) mult = 1.25;
    }
    const win = Math.floor(slotState.bet * mult);
    if (win > 0) {
        globalMoney += win;
        totalStats.moneyEarned += win;
        updateMoneyDisplay(true);
        saveGame();
        flashScreen('green');
        SFX.win();
        document.getElementById('slot-msg').innerText = `WIN $${win}!`;
        updateSanity(8);
    } else {
        document.getElementById('slot-msg').innerText = "ZONK.";
        SFX.lose();
        updateSanity(-7);
    }
}

// ---------- CUPS ----------
function openCups() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('cups-screen').classList.remove('hidden');
    activeGame = 'CUPS';
    cupState.bet = 0;
    document.getElementById('cup-bet-display').innerText = "0";
    document.getElementById('cup-msg').innerText = TEXT.en.cup_msg;
}

function closeCups() {
    document.getElementById('cups-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    activeGame = 'MENU';
}

function setCupBet(b) {
    if (cupState.isPlaying) return;
    cupState.bet = b;
    document.getElementById('cup-bet-display').innerText = b;
    document.getElementById('cup-msg').innerText = "CLICK A SKULL";
    startCups();
}

function startCups() {
    if (globalMoney < cupState.bet) { shakeElement(document.getElementById('money-display'));
        SFX.empty(); return; }
    if (cupState.isPlaying) return;
    globalMoney -= cupState.bet;
    updateMoneyDisplay(true);
    saveGame();
    cupState.isPlaying = true;
    [0, 1, 2].forEach(i => { const el = document.getElementById(`skull-${i}`); if (el) { el.innerText =
            '💀';
            el.classList.add('skull-shuffle'); } });
    cupState.ballIndex = Math.floor(Math.random() * 3);
    SFX.flip();
    setTimeout(() => {
        [0, 1, 2].forEach(i => { const el = document.getElementById(`skull-${i}`); if (el) el
                .classList.remove('skull-shuffle'); });
    }, 800);
}

function pickCup(idx) {
    if (!cupState.isPlaying) return;
    cupState.isPlaying = false;
    totalStats.minigamesPlayed++;
    if (totalStats.minigamesPlayed >= 50) unlockAchievement('GAMBLER');
    const el = document.getElementById(`skull-${idx}`);
    if (idx === cupState.ballIndex) {
        if (el) el.innerText = '👁️';
        const win = cupState.bet * 2;
        globalMoney += win;
        totalStats.moneyEarned += win;
        updateMoneyDisplay(true);
        saveGame();
        flashScreen('green');
        SFX.win();
        document.getElementById('cup-msg').innerText = `WIN! +$${win}`;
        updateSanity(5);
    } else {
        if (el) el.innerText = '❌';
        const reveal = document.getElementById(`skull-${cupState.ballIndex}`);
        if (reveal) reveal.innerText = '👁️';
        flashScreen('red');
        SFX.lose();
        document.getElementById('cup-msg').innerText = "WRONG.";
        updateSanity(-7);
    }
}
