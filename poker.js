"use strict";

// ---------- POKER: STAGES, RAISE, REDRAW, FOLD ----------
function stageLabel() {
    return ['DEAL TURN', 'DEAL RIVER', 'SHOWDOWN'][Math.min(2, state.pokerStage)];
}

function pokerPhaseOpen() {
    const rv = document.getElementById('btn-reveal');
    return !!rv && !rv.classList.contains('hidden');
}

function updatePokerButtons() {
    const rv = document.getElementById('btn-reveal');
    if (rv) rv.innerHTML = `${stageLabel()} <span class="khint">[SPACE]</span>`;
    const rb = document.getElementById('btn-raise');
    if (rb) {
        rb.classList.toggle('hidden', state.pokerRaise >= 2 || state.isProcessing);
        rb.disabled = !canSpendSanity(10);
        rb.innerHTML = `RAISE ${state.pokerRaise}/2 <span class="btn-cost">-10 SAN</span> <span class="khint">[B]</span>`;
    }
    const rd = document.getElementById('btn-redraw');
    if (rd) {
        rd.classList.toggle('hidden', state.redrawn || state.pokerStage > 1 || state.isProcessing);
        rd.disabled = !canSpendSanity(8);
        rd.innerHTML = `REDRAW <span class="btn-cost">-8 SAN</span> <span class="khint">[D]</span>`;
    }
    const fd = document.getElementById('btn-fold');
    if (fd) {
        fd.classList.toggle('hidden', state.pokerStage < 1 || state.isProcessing);
        fd.innerHTML = `FOLD <span class="khint">[F]</span>`;
    }
}

function showRaiseButton() { updatePokerButtons(); }

function hideRaise() {
    ['btn-raise', 'btn-redraw', 'btn-fold'].forEach(id => {
        const b = document.getElementById(id);
        if (b) b.classList.add('hidden');
    });
}

function raisePoker() {
    if (state.isProcessing || activeGame !== 'MAIN' || !pokerPhaseOpen()) return;
    if (state.pokerRaise >= 2) return;
    if (!canSpendSanity(10)) { SFX.empty(); return; }
    state.pokerRaise++;
    state.raiseMax = Math.max(state.raiseMax || 0, state.pokerRaise);
    state.raised = true;
    updateSanity(-10);
    SFX.glitch();
    log(`RAISED (${state.pokerRaise}/2)! Win = extra rewards. Lose = the dealer profits too.`, 'text-yellow-400');
    updatePokerButtons();
}

function redrawPoker() {
    if (state.redrawn || state.isProcessing || state.pokerStage > 1 || !pokerPhaseOpen() || !canSpendSanity(8)) return;
    state.redrawn = true;
    updateSanity(-8);
    const idx = state.playerHand[0].val <= state.playerHand[1].val ? 0 : 1;
    state.playerHand[idx] = state.deck.pop();
    renderCards(false);
    SFX.flip();
    log('You swap out your weaker card.', 'text-blue-400');
    updatePokerButtons();
}

function foldPoker() {
    if (state.isProcessing || state.pokerStage < 1 || !pokerPhaseOpen()) return;
    meta.folds = (meta.folds || 0) + 1;
    if (meta.folds >= 5) unlockAchievement('COWARD');
    showdown(true);
}

function dealerBetting() {
    const d = evalHand(state.dealerHand, state.communityCards);
    const high = Math.max(...state.dealerHand.map(c => c.val));
    const strong = d.cat >= 1 || high >= 13;
    if (!state.dealerRaise && rnd() < (strong ? 0.55 : 0.18)) {
        state.dealerRaise = 1;
        log('THE DEALER RAISES!', 'text-red-400');
        dealerSpeak('taunt');
        SFX.glitch();
    } else {
        let confident = d.cat >= 1;
        if (tellsUnreliable() && rnd() < 0.4) confident = !confident;
        log(confident ? 'The dealer looks confident.' :
            'The dealer fidgets...', confident ? 'text-red-300' : 'text-blue-300');
    }
}

function resolvePokerPhase() {
    if (state.isProcessing) return;
    if (state.pokerStage < 2) {
        state.pokerStage++;
        const want = 3 + state.pokerStage;
        while (state.communityCards.length < want) state.communityCards.push(state.communityAll[state.communityCards.length]);
        renderCards(false);
        SFX.flip();
        log(state.pokerStage === 1 ? 'TURN dealt.' : 'RIVER dealt.', 'text-blue-400');
        dealerBetting();
        updatePokerButtons();
        return;
    }
    showdown(false);
}

function showdown(fold) {
    if (state.isProcessing) return;
    while (state.communityCards.length < 5) state.communityCards.push(state.communityAll[state.communityCards.length]);
    let charm = false;
    if (state.cheatNextPoker && !fold) {
        state.playerHand[0] = { suit: '♠', rank: 'A', val: 14 };
        state.playerHand[1] = { suit: '♠', rank: 'K', val: 13 };
        log("LUCKY CHARM: The hand is yours!", 'text-yellow-500');
        state.cheatNextPoker = false;
        charm = true;
    }
    renderCards(true);
    SFX.flip();
    document.getElementById('btn-reveal').classList.add('hidden');
    document.getElementById('btn-cheat').classList.add('hidden');
    hideRaise();
    const p = evalHand(state.playerHand, state.communityCards);
    const d = evalHand(state.dealerHand, state.communityCards);
    const playerWins = !fold && (charm || (hasRelic('GREED') ? p.score > d.score : p.score >= d.score));
    if (fold) {
        log('YOU FOLD.', 'text-gray-400');
        updateSanity(-5);
    }
    if (playerWins) {
        state.turn = 'player';
        payPokerWin(p);
        log(`WIN: ${p.type}`, 'text-green-500');
        playerSpeak('winHand');
        updateSanity(5);
    } else {
        state.turn = 'dealer';
        payPokerLoss(d, fold);
        if (!fold) {
            log(`LOSE: ${d.type}`, 'text-red-500');
            dealerSpeak('taunt');
            playerSpeak('loseHand');
            updateSanity(-10);
        }
    }
    renderUI();
    state.isProcessing = true;
    setTimeout(() => {
        state.isProcessing = false;
        loadShotgun();
    }, dly(2000));
}

function payPokerWin(p) {
    const copies = hasRelic('GREED') ? 2 : 1;
    for (let i = 0; i < copies; i++) giveItem('player', p.rew);
    if (p.cat >= 8 && !state.cheatCharmWin) unlockAchievement('ROYAL');
    if (p.cat >= 5) { giveItem('player', randomItemKey());
        unlockAchievement('HIGH_HAND'); }
    for (let i = 0; i < state.pokerRaise; i++) {
        giveItem('player', p.rew);
        globalMoney += 100;
        totalStats.moneyEarned += 100;
    }
    if (state.pokerRaise > 0) { updateMoneyDisplay(true);
        unlockAchievement('RAISE_WIN'); }
    if (state.dealerRaise) {
        giveItem('player', randomItemKey());
        log("You called the dealer's raise: bonus item!", 'text-green-400');
    }
    if (state.pokerBonus) giveItem('player', randomItemKey());
    if (hasRelic('POKER_HEART') && state.playerHp < state.maxPlayerHp) {
        state.playerHp++;
        renderHP();
        log('Poker Heart heals 1 HP.', 'text-red-300');
    }
}

function payPokerLoss(d, fold) {
    giveItem('dealer', d.rew);
    if (fold) return;
    for (let i = 0; i < state.pokerRaise; i++) {
        giveItem('dealer', d.rew);
        updateSanity(-10);
    }
    if (state.dealerRaise) giveItem('dealer', randomItemKey());
}
