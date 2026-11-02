"use strict";

// ---------- AI TURN ----------
function aiTurn() {
    if (state.chamber.length === 0 || state.turn !== 'dealer' || state.isProcessing || state.playerHp <= 0 || state.dealerHp <= 0) return;

    if (state.bluffTurns && state.bluffTurns > 0) {
        state.bluffTurns--;
        if (state.bluffTurns === 0) {
            const bi = document.getElementById('bluff-indicator');
            if (bi) bi.style.display = 'none';
        }
        log("DEALER IS CONFUSED BY YOUR BLUFF!", 'text-pink-400');
        state.turn = 'player';
        setTimeout(startTurn, 1500);
        return;
    }

    const dealer = DEALER_PERSONALITIES[currentDealerPersonality];
    if (dealer.onDealerTurn) dealer.onDealerTurn();
    const itemToUse = dealer.itemPriority(state.dealerItems, state) ||
        ((state.dealerItems.includes('SHIELD') && !state.shieldDealer) ? 'SHIELD' : null) ||
        (state.dealerItems.includes('VOODOO') ? 'VOODOO' : null);
    if (itemToUse) {
        const idx = state.dealerItems.indexOf(itemToUse);
        if (idx !== -1) {
            useItem('dealer', itemToUse, idx);
            setTimeout(aiTurn, 1800);
            return;
        }
    }
    let knows = state.shellRevealed || state.dealerItems.includes('GLASS');
    let target = dealer.aiBehavior(knows);
    processShot('dealer', target);
}

function playerShoot(t) {
    if (state.isProcessing || state.turn !== 'player') return;
    stopTurnTimer();
    if (t === 'dealer') state.shotsAtDealer++; else state.selfShots++;
    processShot('player', t);
}

function processShot(shooter, target) {
    state.isProcessing = true;
    toggleGunControls(false);
    const _shell = popShell();
    const isLive = _shell.live;
    const shellMod = _shell.mod;
    if (isLive) state.liveCount--;
    else state.blankCount--;
    state.shellRevealed = false; state.shellLie = false;
    if (state.phoneMark) { state.phoneMark.i--; if (state.phoneMark.i < 0) state.phoneMark = null; }
    renderAmmo();
    setTimeout(() => {
        let next = (shooter === 'player') ? 'dealer' : 'player';
        if (isLive && shellMod !== 'DUD') {
            document.body.classList.add('flash-white');
            document.getElementById('gun-ui-panel').classList.add('shake-hard');
            SFX.shot();
            setTimeout(() => {
                document.body.classList.remove('flash-white');
                document.getElementById('gun-ui-panel').classList.remove('shake-hard');
            }, 200);
            let dmg = 1 * state.damageMultiplier + (shellMod === 'HOLLOW' ? 1 : 0);
            const pierceShot = shellMod === 'GHOST';
            if (target === 'self') {
                log(`BOOM! ${shooter} HIT${shellMod ? ' [' + shellMod + ']' : ''}`, 'text-red-600');
                triggerBlood();
                if (shooter === 'player') {
                    dealDamage('player', dmg, { pierce: pierceShot });
                    playerSpeak('shootSelfHit');
                    triggerMemory();
                    
                    updateSanity(-15);
                } else {
                    dealDamage('dealer', dmg, { pierce: pierceShot });
                    totalStats.kills++;
                    dealerSpeak('hit');
                    const personality = DEALER_PERSONALITIES[currentDealerPersonality];
                    if (personality.onPlayerHit) personality.onPlayerHit();
                }
            } else {
                log(`BOOM! ${target} HIT${shellMod ? ' [' + shellMod + ']' : ''}`, 'text-red-600');
                if (shooter === 'player') {
                    dealDamage('dealer', dmg, { pierce: pierceShot });
                    playerSpeak('shootHit');
                    dealerSpeak('hit');
                    updateSanity(5);
                } else {
                    dealDamage('player', dmg, { pierce: pierceShot });
                    dealerSpeak('taunt');
                    playerSpeak('getHit');
                    triggerMemory();
                    updateSanity(-15);
                    triggerBlood();
                }
            }
            if (state.handcuffed) { log("CUFFS BROKEN", 'text-orange-500');
                next = shooter;
                state.handcuffed = false; }
        } else {
            log(shellMod === 'DUD' ? 'DUD! The shell was defective.' : TEXT.en.msg_empty, 'text-gray-500');
            SFX.empty();
            if (target === 'self') {
                log("SAFE", 'text-blue-400');
                if (shooter === 'player') {
                    playerSpeak('shootSelfSafe');
                    updateSanity(3);
                }
                next = shooter;
            } else {
                if (state.handcuffed) { next = shooter;
                    state.handcuffed = false; } else { dealerSpeak('taunt');
                    updateSanity(-3); }
            }
        }
        state.damageMultiplier = 1;
        renderHP();
        setTimeout(() => {
            state.turn = next;
            state.isProcessing = false;
            startTurn();
        }, 1500);
    }, 400);
}

function triggerBlood() {
    const b = document.getElementById('blood-fx');
    b.classList.add('blood-active');
    setTimeout(() => b.classList.remove('blood-active'), 100);
}
