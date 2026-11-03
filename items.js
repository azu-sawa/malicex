"use strict";

// ---------- USE ITEM ----------
function useItem(who, key, idx) {
    if (who === 'player' && (state.isProcessing || (state.turn !== 'player' && !(['LUCKY_CHARM', 'CIGARETTES', 'SEDATIVE', 'SHIELD'].includes(key) && pokerPhaseOpen())))) return;
    if (who === 'player') {
        stopTurnTimer();
        state.isProcessing = true;
        state.playerItems.splice(idx, 1);
        state.lastPlayerItem = key;
        totalStats.itemsUsed++;
        state.runItems = (state.runItems || 0) + 1;
        playerSpeak('useItem');
    } else {
        const i = state.dealerItems.indexOf(key);
        if (i > -1) state.dealerItems.splice(i, 1);
    }
    renderUI();
    setTimeout(() => {
        SFX.hover();
        const item = ITEMS[key];
        if (ITEM_SFX[key]) ITEM_SFX[key]();
        if (who === 'player' && item.sanityCost) updateSanity(-item.sanityCost);
        if (who === 'player' && item.sanityGain) updateSanity(item.sanityGain);
        if (key === 'GLASS') {
            state.shellRevealed = true;
            state.shellLie = (who === 'player' && rnd() < glassLieChance());
            if (who === 'player' && hasRelic('WIDOW_EYE')) state.eyeNext = true;
            log(who === 'player' ? `PEEK: ${(state.chamber[0] !== state.shellLie)?'LIVE':'BLANK'}${shellModTag()}` : "DEALER PEEK...",
                'text-blue-400');
        } else if (key === 'KNIFE') {
            state.damageMultiplier = (who === 'player' && hasRelic('BLOOD_PACT')) ? 3 : 2;
            if (who === 'player' && hasRelic('BLOOD_PACT')) updateSanity(-10);
            log("SAWED OFF (2X DMG)", 'text-red-500');
        } else if (key === 'BEER') {
            const _b = popShell();
            let s = _b.live;
            if (s) state.liveCount--;
            else state.blankCount--;
            state.shellRevealed = false; state.shellLie = false;
    if (state.phoneMark) { state.phoneMark.i--; if (state.phoneMark.i < 0) state.phoneMark = null; }
            renderAmmo();
            log(`BEER: EJECTED (${s ? 'LIVE' : 'BLANK'})`, 'text-yellow-600');
            if (state.chamber.length === 0) { setTimeout(startTurn, 1000); if (who === 'player') state
                    .isProcessing = false; return; }
        } else if (key === 'CIGARETTES') {
            let max = who === 'player' ? state.maxPlayerHp : state.maxDealerHp;
            if (who === 'player' && state.playerHp < max) { state.playerHp++;
                flashScreen('green'); } else if (who === 'dealer' && state.dealerHp < max) { state
                    .dealerHp++;
                dealerSpeak('heal'); }
            log("SMOKE (+1 HP)", 'text-green-500');
            renderHP();
        } else if (key === 'HANDCUFFS') {
            if (who === 'player' && state.enraged) {
                log('The enraged dealer snaps the cuffs!', 'text-red-500');
            } else {
                state.handcuffed = true;
                log("HANDCUFFED", 'text-orange-500');
            }
        } else if (key === 'INVERTER') {
            let c = state.chamber[0];
            state.chamber[0] = !c;
            if (c) { state.liveCount--;
                state.blankCount++; } else { state.liveCount++;
                state.blankCount--; }
            if (state.phoneMark && state.phoneMark.i === 0) state.phoneMark.live = !state.phoneMark.live;
            log("POLARITY INVERTED", 'text-purple-500');
            renderAmmo();
        } else if (key === 'SEDATIVE') {
            log("SEDATIVE: Mind calmed...", 'text-blue-300');
            flashScreen('blue');
        } else if (key === 'LUCKY_CHARM') {
            state.cheatNextPoker = true;
            log("CHARM: Luck is on your side...", 'text-yellow-500');
        } else if (key === 'TAROT') {
            const card = TAROT_EFFECTS[Math.floor(rnd() * TAROT_EFFECTS.length)];
            log(`TAROT: ${card.name} – ${card.desc}`, 'text-purple-400');
            card.effect();
            unlockAchievement('TAROT_INITIATE');
        } else if (key === 'PHANTOM') {
            log('It was never there...', 'text-purple-400');
            updateSanity(-3);
            flashScreen('red');
        } else if (key === 'SHIELD') {
            if (who === 'player') state.shieldPlayer = true; else state.shieldDealer = true;
            log(who === 'player' ? "SHIELD UP" : "DEALER SHIELDS UP", 'text-cyan-400');
            renderAmmo();
        } else if (key === 'PHONE') {
            if (state.chamber.length > 0) {
                const pi = Math.floor(rnd() * state.chamber.length);
                state.phoneMark = { i: pi, live: state.chamber[pi] };
                log(`PHONE: shell #${pi + 1} is ${state.chamber[pi] ? 'LIVE' : 'BLANK'}`, 'text-lime-400');
                renderAmmo();
            }
        } else if (key === 'VOODOO') {
            log(who === 'player' ? "VOODOO: The dealer screams!" : "VOODOO: You feel a needle...", 'text-fuchsia-400');
            dealDamage(who === 'player' ? 'dealer' : 'player', 1, { noBonus: true, pierce: who === 'player' });
            renderHP();
            triggerBlood();
            SFX.glitch();
        } else if (key === 'BLUFF') {
            state.bluffTurns = 2;
            const bi = document.getElementById('bluff-indicator');
            if (bi) bi.style.display = 'block';
            log("BLUFF: Dealer is confused!",
                'text-pink-400');
        }
        renderUI();
        if (state.playerHp <= 0 || state.dealerHp <= 0) {
            if (who === 'player') state.isProcessing = false;
            setTimeout(startTurn, 500);
            return;
        }
        if (who === 'player') {
            state.isProcessing = false;
            if (state.turn === 'player') {
                startTurnTimer();
            }
        }
    }, 500);
}

function handleGameEnd() {
    if (state.gauntlet && state.playerHp > 0 && state.dealerHp <= 0 && state.gauntlet.stage < state.gauntlet.total - 1) {
        gauntletFightWon();
        return;
    }
    if (state.ended) return;
    state.ended = true;
    const s = document.getElementById('result-screen');
    const t = document.getElementById('result-title');
    const m = document.getElementById('result-msg');
    state.isProcessing = false;
    stopTurnTimer();
    document.getElementById('sanity-hud').classList.add('hidden');
    if (state.playerHp > 0) {
        if (currentDifficulty === 'ENDLESS') {
            t.innerText = "SURVIVED";
            t.className = "text-6xl mb-4 text-green-500 font-bold glitch";
            m.innerHTML = `SURVIVED: ${state.endlessScore} ROUNDS<br>HIGH SCORE: ${endlessHighScore}`;
        } else {
            let p = 500;
            if (currentDifficulty === 'HARD') p = 1000;
            if (currentDifficulty === 'MERCENARY') p = 4000;
            if (currentDifficulty === 'BOSS') p = 10000;
            if (currentDifficulty === 'ANCIENT') p = 18000;
            if (currentDifficulty === 'GAUNTLET') p = 2500 + 300 * (state.gauntlet ? state.gauntlet.relics.length : 0);
            p = Math.floor(p * rewardMult());
            if (isDaily) {
                if (meta.dailyPaid === dailySeed()) p = 0;
                else meta.dailyPaid = dailySeed();
            }
            globalMoney += p;
            totalStats.moneyEarned += p;
            totalStats.kills++;
            meta.wins++;
            checkWinAchievements();
            t.innerText = TEXT.en.res_win;
            t.className = "text-6xl mb-4 text-green-500 font-bold glitch";
            m.innerText = `${TEXT.en.res_win_msg}${p}`;
            dealerSpeak('win');
            finalWinHooks(p);
            if (state.shotsAtDealer === 0) unlockAchievement('PACIFIST');
            if (state.damageTaken === 0) unlockAchievement('FLAWLESS');
            if (state.shotsAtDealer === 0 && state.selfShots >= 3) unlockAchievement('PSYCHOPATH');
            if (sanity === 100) unlockAchievement('SANITY_KEEPER');
            if (isBroken()) unlockAchievement('INSANE');
            Music.setScene('win');
            SFX.win();
        }
    } else {
        deathCount++;
        if (deathCount >= 10) unlockAchievement('DEAD_MAN');
        if (rnd() < 0.20) {
            const pick = DISTURBING_WORDS[Math.floor(rnd() * DISTURBING_WORDS.length)];
            showDisturbingOverlay(pick.toUpperCase());
        }
        Music.setScene('death');
        t.innerText = TEXT.en.res_die;
        t.className = "text-8xl mb-4 text-red-600 font-bold glitch";
        m.innerText = TEXT.en.res_die_msg;
        dealerSpeak('lose');
        SFX.lose();
        if (currentDifficulty === 'ENDLESS') {
            const eb = Math.floor(state.endlessScore * 150 * rewardMult());
            if (eb > 0) {
                globalMoney += eb;
                totalStats.moneyEarned += eb;
                setTimeout(() => {
                    const mm = document.getElementById('result-msg');
                    if (mm) mm.innerHTML += `<div class="text-xl mt-2 text-yellow-400">+$${eb}</div>`;
                }, 0);
            }
            m.innerHTML = `SURVIVED: ${state.endlessScore} ROUNDS<br>HIGH SCORE: ${endlessHighScore}`;
        }
    }
    recordRunEnd(m);
    addRunSummary(m);
    hideModChip();
    s.classList.remove('hidden');
    saveGame();
    updateMoneyDisplay(true);
}

function returnToMenu() {
    seedRng(null);
    hideModChip();
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.add('hidden');
    showMenu();
}
