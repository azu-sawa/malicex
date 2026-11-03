"use strict";

// ---------- DAMAGE (shields + enrage live here) ----------
function dealDamage(who, dmg, opts) {
    opts = opts || {};
    if (!opts.noBonus) { dmg += (state.roundDmgBonus || 0); if (hasRelic('GLASS_CANNON')) dmg += 1; }
    const key = who === 'player' ? 'shieldPlayer' : 'shieldDealer';
    if (!opts.pierce && state[key]) {
        state[key] = false;
        log('SHIELD ABSORBED THE SHOT!', 'text-cyan-400');
        flashScreen('blue');
        SFX.shieldBreak();
        if (who === 'player') unlockAchievement('SHIELD_WALL');
        renderAmmo();
        return 0;
    }
    if (who === 'player') {
        state.playerHp -= dmg;
        state.damageTaken++;
        if (state.playerHp <= 0 && hasRelic('LAST_BREATH') && !state.lastBreathUsed) {
            state.lastBreathUsed = true;
            state.playerHp = 1;
            log('LAST BREATH! You cling to 1 HP.', 'text-red-400');
            flashScreen('red');
        }
    } else {
        state.dealerHp -= dmg;
        checkEnrage();
    }
    return dmg;
}

function checkEnrage() {
    if (state.enraged || state.dealerHp <= 0 || state.maxDealerHp < 4) return;
    if (state.dealerHp > Math.floor(state.maxDealerHp / 2)) return;
    state.enraged = true;
    giveItem('dealer', 'KNIFE');
    giveItem('dealer', 'CIGARETTES');
    showDisturbingOverlay('HE AWAKENS');
    log('DEALER ENRAGED! He draws fresh tools...',
        'text-red-500');
    SFX.glitch();
    triggerBlood();
}

// ---------- ROUND MODIFIERS ----------
const ROUND_MODIFIERS = [{
        id: 'BLOOD_MOON', icon: px('moon'), color: '#ff3333',
        en_n: 'BLOOD MOON',
        en_d: 'All live shots deal +1 damage.',
        apply: () => { state.roundDmgBonus = 1; }
    },
    {
        id: 'FOG', icon: px('fog'), color: '#9ca3af',
        en_n: 'FOG',
        en_d: 'Live/blank counts are hidden.',
        apply: () => { state.fog = true; }
    },
    {
        id: 'BLESSING', icon: px('sparkle'), color: '#facc15',
        en_n: 'BLESSING',
        en_d: 'You receive 1 free random item.',
        apply: () => { giveItem('player', randomItemKey()); }
    },
    {
        id: 'HEAVY', icon: px('chain'), color: '#fb923c',
        en_n: 'HEAVY LOAD',
        en_d: 'More live shells in the chamber.',
        apply: () => { state.heavyLoad = true; }
    },
    {
        id: 'MERCY', icon: px('dove'), color: '#67e8f9',
        en_n: 'MERCY',
        en_d: 'The first shell is guaranteed BLANK.',
        apply: () => { state.mercy = true; }
    },
    {
        id: 'WHISPERS', icon: px('ear'), color: '#c084fc',
        en_n: 'WHISPERS',
        en_d: 'Sanity -10, but winning poker grants +1 item.',
        apply: () => { updateSanity(-10);
            state.pokerBonus = true; }
    }
];

function showBanner(inner) {
    const el = document.getElementById('round-announcement');
    if (!el) return;
    el.innerHTML = inner;
    el.style.opacity = '1';
    clearTimeout(showBanner._t);
    showBanner._t = setTimeout(() => { el.style.opacity = '0'; }, 1700);
}

function updateModChip(mod) {
    let chip = document.getElementById('mod-chip');
    if (!chip) {
        chip = document.createElement('div');
        chip.id = 'mod-chip';
        chip.className = 'mod-chip';
        document.body.appendChild(chip);
    }
    if (!mod) { chip.style.display = 'none'; return; }
    chip.style.display = 'block';
    chip.style.borderColor = mod.color;
    chip.style.color = mod.color;
    chip.innerHTML = `${mod.icon} ${mod.en_n}`;
}

function hideModChip() {
    const rb = document.getElementById('relic-bar'); if (rb) rb.style.display = 'none';
    const c = document.getElementById('mod-chip');
    if (c) c.style.display = 'none';
}

function rollRoundModifier() {
    state.roundDmgBonus = 0;
    state.fog = false;
    state.heavyLoad = false;
    state.mercy = false;
    state.pokerBonus = false;
    state.modifier = null;
    state.phoneMark = null;
    state.shellLie = false;
    if (state.dealerHp >= state.maxDealerHp) state.enraged = false;
    let mod = null;
    if (state.round >= 2 && rnd() < 0.4) {
        mod = ROUND_MODIFIERS[Math.floor(rnd() * ROUND_MODIFIERS.length)];
        state.modifier = mod.id;
        mod.apply();
    }
    let html = `<div class="round-text text-4xl text-gray-200">${'ROUND'} ${state.round}`;
    if (mod) {
        html += `<div class="text-2xl mt-4" style="color:${mod.color}">${mod.icon} ${mod.en_n}</div>` +
            `<div class="text-base mt-2 text-gray-400" style="font-family:'VT323',monospace;letter-spacing:1px">${mod.en_d}</div>`;
    }
    html += `</div>`;
    showBanner(html);
    updateModChip(mod);
}

function applyLoadModifiers() {
    if (state.mercy || hasRelic('RUSTY')) {
        const i = state.chamber.indexOf(false);
        if (i > 0) {
            const t = state.chamber[0];
            state.chamber[0] = state.chamber[i];
            state.chamber[i] = t;
        }
    }
}

// ---------- SHELL TYPES ----------
function popShell() {
    const live = state.chamber.shift();
    const mod = (state.shellMods && state.shellMods.length) ? state.shellMods.shift() : null;
    return { live, mod: live ? (mod || null) : null };
}

function shellModTag() {
    const m = state.shellMods && state.shellMods[0];
    return (state.chamber[0] && (m === 'HOLLOW' || m === 'GHOST')) ? ` (${m})` : '';
}

function assignShellMods() {
    const mods = state.chamber.map(() => null);
    state.shellMods = mods;
    const tier = state.round + (state.gauntlet ? state.gauntlet.stage : 0) + ascLevel();
    if (tier < 3) return;
    const liveIdx = [];
    state.chamber.forEach((l, i) => {
        if (!l) return;
        liveIdx.push(i);
        const r = rnd();
        if (r < 0.18) mods[i] = 'HOLLOW';
        else if (r < 0.28) mods[i] = 'GHOST';
        else if (r < 0.38) mods[i] = 'DUD';
    });
    if (liveIdx.length && liveIdx.every(i => mods[i] === 'DUD')) mods[liveIdx[0]] = null;
    if (mods.some(Boolean)) setTimeout(() => log('Strange shells are loaded in the chamber...', 'text-orange-400'), 700);
}

function shuffleChamber() {
    const pairs = state.chamber.map((l, i) => ({ l, m: (state.shellMods || [])[i] || null }));
    shuffle(pairs);
    state.chamber = pairs.map(p => p.l);
    state.shellMods = pairs.map(p => p.m);
    state.shellRevealed = false;
    state.shellLie = false;
    state.phoneMark = null;
    renderAmmo();
}

function onPlayerTurnHooks() {
    const p = DEALER_PERSONALITIES[currentDealerPersonality];
    if (p && p.onPlayerTurn) p.onPlayerTurn();
    sanityWhispers();
}

// ---------- TENSION TIMER (v6.0) ----------
function startTurnTimer() {
    if (activeGame !== 'MAIN' || state.turn !== 'player' || state.isProcessing) return;
    clearInterval(turnTimer);

    const urgentModes = ['HARD', 'MERCENARY', 'BOSS', 'ANCIENT', 'ENDLESS'];
    if (!urgentModes.includes(currentDifficulty)) {
        document.getElementById('tension-wrap').classList.add('hidden');
        return;
    }

    timeLeft = (currentDifficulty === 'BOSS' || currentDifficulty === 'ANCIENT') ? 10 : 15;
    
    const wrap = document.getElementById('tension-wrap');
    const display = document.getElementById('tension-timer');
    wrap.classList.remove('hidden');
    wrap.classList.remove('urgent');
    display.innerText = timeLeft;

    turnTimer = setInterval(() => {
        timeLeft--;
        display.innerText = timeLeft;
        if (timeLeft <= 5) {
            wrap.classList.add('urgent');
            SFX.tick();
        }
        if (timeLeft <= 0) {
            clearInterval(turnTimer);
            wrap.classList.add('hidden');
            log("TIME'S UP! Despair sets in...", "text-red-500");
            updateSanity(-20);
            triggerBlood();
            playerShoot('self');
        }
    }, 1000);
}

function stopTurnTimer() {
    clearInterval(turnTimer);
    const el = document.getElementById('tension-wrap');
    if (el) el.classList.add('hidden');
}

// ---------- DEALER TELLS (v6.0) ----------
function spawnDealerTell() {
    if (activeGame !== 'MAIN' || state.turn !== 'dealer' || state.chamber.length === 0) return;
    const isNextLive = state.chamber[0];
    const tellsLive = (["[ DEALER'S HAND TREMBLES ]", "[ HIS EYES WIDEN ]", "[ HE GRINS WIDELY ]"]);
    const tellsBlank = (["[ DEALER LOOKS RELAXED ]", "[ HE SIGHS CALMLY ]", "[ HE TAPS THE TABLE ]"]);
    const list = isNextLive ? tellsLive : tellsBlank;
    const text = list[Math.floor(Math.random() * list.length)];
    const tellEl = document.createElement('div');
    tellEl.className = 'dealer-tell';
    tellEl.innerText = text;
    const dBox = document.getElementById('dealer-dialogue');
    if (dBox) {
        dBox.appendChild(tellEl);
        setTimeout(() => tellEl.remove(), 3000);
    }
}

// ---------- MAIN GAME ----------
function startRound() {
    Music.setPhase('poker');
    if (state.playerHp <= 0 || state.dealerHp <= 0) return handleGameEnd();
    unlockAchievement('FIRST_BLOOD');
    if (currentDifficulty === 'ENDLESS') {
        const scale = Math.floor((state.round - 1) / 2);
        const newMax = Math.min(8, 4 + scale);
        state.maxDealerHp = Math.max(state.maxDealerHp, newMax);
        if (state.round > 2) state.dealerItems.push('CIGARETTES');
        if (state.round > 4) state.dealerItems.push('BEER');
        if (state.round > 6) state.dealerItems.push('KNIFE');
        document.getElementById('endless-round').innerText = state.round;
    }
    state.deck = createDeck();
    state.playerHand = [state.deck.pop(), state.deck.pop()];
    state.dealerHand = [state.deck.pop(), state.deck.pop()];
    state.communityAll = [state.deck.pop(), state.deck.pop(), state.deck.pop(), state.deck.pop(), state.deck.pop()];
    state.communityCards = state.communityAll.slice(0, 3);
    state.pokerStage = 0;
    state.pokerRaise = 0;
    state.dealerRaise = 0;
    state.redrawn = false;
    state.folded = false;
    state.raised = false;
    state.damageMultiplier = 1;
    state.handcuffed = false;
    state.isProcessing = false;
    if (upgrades.autoGlass && !state.playerItems.includes('GLASS')) state.playerItems.push('GLASS');
    if (hasRelic('SCAVENGER')) giveItem('player', randomItemKey());
    if (rnd() < phantomChance() && !state.playerItems.includes('PHANTOM') && state.playerItems.length < 5) {
        state.phantomDisguise = randomItemKey();
        state.playerItems.push('PHANTOM');
    }
    rollRoundModifier();
    renderUI();
    renderCards(false);
    showRaiseButton();
    log(TEXT.en.msg_ready, 'text-blue-500');
    SFX.flip();
    document.getElementById('btn-start').classList.add('hidden');
    document.getElementById('btn-reveal').classList.remove('hidden');
    const btnCheat = document.getElementById('btn-cheat');
    if (upgrades.aceSleeve) btnCheat.classList.remove('hidden');
    else btnCheat.classList.add('hidden');
    const cheatSkills = document.getElementById('cheat-skills');
    cheatSkills.classList.add('hidden');
    state.usedCheatSkills = [];
    state.coldRead = false;
    if (upgrades.unlockColdRead || upgrades.unlockPsychOut) {
        cheatSkills.classList.remove('hidden');
        refreshCheatButtons();
    }
    toggleGunControls(false);
}

function createDeck() {
    const d = [];
    for (let su of SUITS)
        for (let r of RANKS) d.push({ suit: su, rank: r, val: VALUES[r] });
    return shuffle(d);
}

function evalHand(h, c) {
    const all = [...h, ...c];
    const vals = all.map(x => x.val).sort((a, b) => b - a);
    const counts = {};
    vals.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const groups = Object.entries(counts).map(([v, n]) => ({ v: +v, n }))
        .sort((a, b) => b.n - a.n || b.v - a.v);
    const suits = {};
    all.forEach(x => (suits[x.suit] = suits[x.suit] || []).push(x.val));
    let flushVals = null;
    for (const k in suits) if (suits[k].length >= 5) flushVals = suits[k].sort((a, b) => b - a);
    const straightHigh = (arr) => {
        const u = [...new Set(arr)].sort((a, b) => b - a);
        if (u.includes(14)) u.push(1);
        let run = 1;
        for (let i = 1; i < u.length; i++) {
            if (u[i] === u[i - 1] - 1) { run++; if (run >= 5) return u[i] + 4; } else run = 1;
        }
        return 0;
    };
    const sfHigh = flushVals ? straightHigh(flushVals) : 0;
    const stHigh = straightHigh(vals);
    const kick = groups.slice(0, 5).reduce((a, g) => a * 15 + g.v, 0);
    let cat, type, rew, tb = kick;
    if (sfHigh) { cat = 8; type = "Straight Flush"; rew = "TAROT"; tb = sfHigh; }
    else if (groups[0].n === 4) { cat = 7; type = "Four of a Kind"; rew = "VOODOO"; }
    else if (groups[0].n === 3 && groups[1] && groups[1].n >= 2) { cat = 6; type = "Full House"; rew = "KNIFE"; }
    else if (flushVals) { cat = 5; type = "Flush"; rew = "SHIELD"; tb = flushVals.slice(0, 5).reduce((a, v) => a * 15 + v, 0); }
    else if (stHigh) { cat = 4; type = "Straight"; rew = "INVERTER"; tb = stHigh; }
    else if (groups[0].n === 3) { cat = 3; type = "Three of a Kind"; rew = "HANDCUFFS"; }
    else if (groups[0].n === 2 && groups[1] && groups[1].n === 2) { cat = 2; type = "Two Pair"; rew = "CIGARETTES"; }
    else if (groups[0].n === 2) { cat = 1; type = "Pair"; rew = "BEER"; }
    else { cat = 0; type = "High Card"; rew = "GLASS"; }
    return { score: cat * 10000000 + tb, type, rew, cat };
}

function cheatPoker() {
    if (rnd() < 0.2) {
        dealerSpeak('caught');
        log('CAUGHT! -1 HP, -15 Sanity.', 'text-red-600');
        dealDamage('player', 1, { noBonus: true, pierce: true });
        renderHP();
        triggerBlood();
        SFX.glitch();
        updateSanity(-15);
        document.getElementById('btn-cheat').classList.add('hidden');
        if (state.playerHp <= 0) setTimeout(handleGameEnd, 800);
    } else {
        unlockAchievement('CHEATER');
        state.playerHand[0] = { suit: '♠', rank: 'A', val: 14 };
        renderCards(false);
        log("CHEATED: ACE SWAPPED", 'text-purple-500');
        flashScreen('green');
        SFX.hover();
        document.getElementById('btn-cheat').classList.add('hidden');
        updateSanity(-10);
    }
}

function refreshCheatButtons() {
    const readBtn = document.getElementById('cheat-read');
    const psychBtn = document.getElementById('cheat-psych');
    if (readBtn) readBtn.disabled = !upgrades.unlockColdRead || sanity < CHEAT_SKILLS.COLD_READ.cost ||
        state.usedCheatSkills.includes('COLD_READ') || !pokerPhaseOpen();
    if (psychBtn) psychBtn.disabled = !upgrades.unlockPsychOut || sanity < CHEAT_SKILLS.PSYCH_OUT.cost ||
        state.usedCheatSkills.includes('PSYCH_OUT');
}

function useCheatSkill(skillId) {
    const sk = CHEAT_SKILLS[skillId];
    if (!sk || state.isProcessing || sanity < sk.cost) return;
    if (skillId === 'COLD_READ' && !pokerPhaseOpen()) return;
    if (state.usedCheatSkills.includes(skillId)) {
        log("Skill already used this round!", 'text-red-500');
        return;
    }
    updateSanity(-sk.cost);
    sk.execute();
    state.usedCheatSkills.push(skillId);
    refreshCheatButtons();
    if (state.usedCheatSkills.length >= 2) unlockAchievement('CHEAT_MASTER');
}

function loadShotgun() {
    let max = 8;
    let tot = Math.min(max, 2 + state.round);
    let live = Math.max(1, Math.floor(tot / 2));
    if (rnd() > 0.5) live++;
    if (state.heavyLoad) live++;
    if (ascLevel() >= 4) live++;
    if (live >= tot) live = tot - 1;
    let blank = tot - live;
    state.liveCount = live;
    state.blankCount = blank;
    state.chamber = shuffle(Array(live).fill(true).concat(Array(blank).fill(false)));
    applyLoadModifiers();
    assignShellMods();
    state.shellRevealed = false; state.shellLie = false;
    if (hasClarity()) {
        state.shellRevealed = true;
        setTimeout(() => log('CLARITY: the first shell reveals itself.', 'text-cyan-300'), 900);
    }
    if (state.phoneMark) { state.phoneMark.i--; if (state.phoneMark.i < 0) state.phoneMark = null; }
    log(TEXT.en.msg_load, 'text-yellow-600');
    state.isProcessing = true;
    const loadMs = hudPlayShellLoad();   // shells drop in one by one (hud.js)
    setTimeout(() => {
        state.isProcessing = false;
        startTurn();
    }, loadMs);
}

function startPhase() {
    if (state.chamber.length === 0 && state.round > 0 && !state.isProcessing) startRound();
}

function startTurn() {
    Music.setPhase('shoot');
    if (state.playerHp <= 0) { handleGameEnd(); return; }
    if (currentDifficulty !== 'ENDLESS' && state.dealerHp <= 0) { handleGameEnd(); return; }
    if (state.eyeNext && state.chamber.length > 0) {
        state.eyeNext = false;
        state.shellRevealed = true;
        state.shellLie = false;
        renderAmmo();
    }
    if (currentDifficulty === 'ENDLESS' && state.dealerHp <= 0) {
        log("DEALER DEFEATED! NEXT ROUND...", 'text-purple-500');
        state.dealerHp = state.maxDealerHp;
        state.round++;
        state.endlessScore++;
        if (state.endlessScore > endlessHighScore) endlessHighScore = state.endlessScore;
        if (state.endlessScore >= 5) unlockAchievement('SURVIVOR');
        if (state.endlessScore >= 10) unlockAchievement('VETERAN');
        saveGame();
        updateSanity(10);
        setTimeout(startRound, 2000);
        return;
    }
    if (state.chamber.length === 0) {
        let bonus = 50;
        if (currentDifficulty === 'HARD') bonus = 100;
        if (currentDifficulty === 'MERCENARY') bonus = 300;
        if (currentDifficulty === 'BOSS') bonus = 500;
        if (currentDifficulty === 'ANCIENT') bonus = 750;
        if (currentDifficulty === 'ENDLESS') {
            state.round++;
            state.endlessScore++;
            if (state.endlessScore > endlessHighScore) endlessHighScore = state.endlessScore;
            if (state.endlessScore >= 5) unlockAchievement('SURVIVOR');
            if (state.endlessScore >= 10) unlockAchievement('VETERAN');
            saveGame();
            log("ROUND SURVIVED", "text-blue-500");
            updateSanity(5);
            setTimeout(startRound, 2000);
        } else {
            bonus = Math.floor(bonus * rewardMult()) + (hasRelic('MIDAS') ? 75 : 0);
            globalMoney += bonus;
            totalStats.moneyEarned += bonus;
            saveGame();
            updateMoneyDisplay(true);
            state.round++;
            updateSanity(5);
            setTimeout(startRound, 2000);
        }
        if (rnd() < 0.15 && unlockedLore.length < LORE_ENTRIES.length) {
            const available = LORE_ENTRIES.filter(l => !unlockedLore.includes(l.id));
            if (available.length > 0) {
                const newLore = available[Math.floor(rnd() * available.length)];
                unlockedLore.push(newLore.id);
                saveGame();
                log("LORE FRAGMENT FOUND", "text-purple-400");
            }
        }
        return;
    }
    if (state.playerHp <= 0 || state.dealerHp <= 0) { handleGameEnd(); return; }
    renderUI();
    if (state.turn === 'player') {
        log(TEXT.en.msg_your_turn, 'text-green-500');
        onPlayerTurnHooks();
        toggleGunControls(true);
        startTurnTimer();
    } else {
        stopTurnTimer();
        spawnDealerTell();
        log(TEXT.en.msg_enemy_turn, 'text-red-600');
        toggleGunControls(false);
        setTimeout(aiTurn, 1500);
    }
}
