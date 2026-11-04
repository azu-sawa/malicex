"use strict";

// ---------- RELICS ----------
const RELICS = {
    IRON_LUNG: { icon: px('lungs'), en_n: 'Iron Lung',
        en_d: '+1 max HP and heal 1.',
        onPick: () => { state.maxPlayerHp++;
            state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + 1);
            renderHP(); } },
    RUSTY: { icon: px('nut'), en_n: 'Rusty Barrel',
        en_d: 'The first shell each round is always BLANK.' },
    SCAVENGER: { icon: px('backpack'), en_n: 'Scavenger',
        en_d: 'Start every round with a random item.' },
    LAST_BREATH: { icon: px('heart'), en_n: 'Last Breath',
        en_d: 'Once per fight, a lethal hit leaves you at 1 HP.' },
    WIDOW_EYE: { icon: px('eye'), en_n: "Widow's Eye",
        en_d: 'After using Glass, the following shell is revealed too.' },
    POKER_HEART: { icon: '♥️', en_n: 'Poker Heart',
        en_d: 'Winning poker heals 1 HP.' },
    MIDAS: { icon: px('coin'), en_n: 'Midas Touch',
        en_d: 'Every cleared round pays +$75.' },
    BLOOD_PACT: { cursed: true, icon: px('drop'), en_n: 'Blood Pact',
        en_d: 'Knife deals 3x damage, but costs 10 Sanity.' },
    GREED: { cursed: true, icon: px('moneybag'), en_n: 'Greed',
        en_d: 'Poker rewards doubled, but ties go to the dealer.' },
    GLASS_CANNON: { cursed: true, icon: px('burst'), en_n: 'Glass Cannon',
        en_d: 'All damage +1, for you and the dealer.' }
};

const NORMAL_RELICS = Object.keys(RELICS).filter(k => !RELICS[k].cursed);

const CURSED_RELICS = Object.keys(RELICS).filter(k => RELICS[k].cursed);

function relicName(id) { return (RELICS[id].en_n); }

function relicDesc(id) { return (RELICS[id].en_d); }

function pickRelics(n, pool) { return shuffle(pool.filter(id => !hasRelic(id))).slice(0, n); }

function addRelic(id) {
    if (!state.gauntlet || hasRelic(id)) return;
    state.gauntlet.relics.push(id);
    if (RELICS[id].onPick) RELICS[id].onPick();
    log(`${RELICS[id].icon} ${relicName(id)}`, RELICS[id].cursed ? 'text-purple-400' : 'text-yellow-400');
    renderRelicBar();
}

function renderRelicBar() {
    let bar = document.getElementById('relic-bar');
    if (!bar) {
        bar = document.createElement('div');
        bar.id = 'relic-bar';
        bar.className = 'relic-bar';
        document.body.appendChild(bar);
    }
    const g = state.gauntlet;
    if (!g || activeGame !== 'MAIN') { bar.style.display = 'none'; return; }
    bar.style.display = 'flex';
    bar.innerHTML = `<span class="relic-stage">${isDaily ? 'DAILY · ' : ''}${'STAGE'} ${Math.min(g.stage + 1, g.total)}/${g.total}</span>` +
        g.relics.map(id => `<span class="relic ${RELICS[id].cursed ? 'cursed' : ''}" title="${relicName(id)}: ${relicDesc(id)}">${RELICS[id].icon}</span>`).join('');
}

// ---------- EVENT / CHOICE SCREEN ----------
function showEventScreen(title, sub, choices) {
    let el = document.getElementById('event-screen');
    if (!el) {
        el = document.createElement('div');
        el.id = 'event-screen';
        el.className = 'event-screen';
        document.body.appendChild(el);
    }
    el.innerHTML = '';
    const h = document.createElement('div');
    h.className = 'event-title';
    h.textContent = title;
    el.appendChild(h);
    if (sub) {
        const s = document.createElement('div');
        s.className = 'event-sub';
        s.textContent = sub;
        el.appendChild(s);
    }
    const box = document.createElement('div');
    box.className = 'event-choices';
    choices.forEach(c => {
        const b = document.createElement('button');
        b.className = 'btn-retro event-btn ' + (c.cls || '');
        b.disabled = !!c.disabled;
        b.innerHTML = `<div class="text-xl">${c.icon || ''} ${c.label}</div><div class="text-sm text-gray-500 mt-1">${c.desc || ''}</div>`;
        b.onclick = () => { SFX.click();
            c.cb(); };
        box.appendChild(b);
    });
    el.appendChild(box);
    el.style.display = 'flex';
}

function hideEventScreen() {
    const el = document.getElementById('event-screen');
    if (el) el.style.display = 'none';
}

function eventResult(title, text) {
    showEventScreen(title, text, [{ icon: '▶', label: 'CONTINUE', desc: '', cb: beginNextFight }]);
}

// ---------- RUN PACTS (optional curses) ----------
const PACTS = {
    BLOOD_MONEY: { icon: px('drop'), en_n: 'BLOOD MONEY',
        en_d: '-1 max HP. Receive $500 now.' },
    HOLLOW_MIND: { icon: px('hole'), en_n: 'HOLLOW MIND',
        en_d: 'Start at 50 Sanity, but gain a starting bonus (relic / 2 items).' },
    THIN_ICE: { icon: px('ice'), en_n: 'THIN ICE',
        en_d: 'Dealers +1 HP, all money rewards x1.5.' }
};

function openPactScreen(cb) {
    const choices = Object.keys(PACTS).map(k => ({
        icon: PACTS[k].icon, label: (PACTS[k].en_n), desc: (PACTS[k].en_d),
        cls: 'border-red-800 text-red-400',
        cb: () => { pendingPact = k;
            hideEventScreen();
            cb(); }
    }));
    choices.unshift({ icon: px('cross'), label: 'NO PACT', desc: 'Play it straight.',
        cb: () => { pendingPact = null;
            hideEventScreen();
            cb(); } });
    showEventScreen('A PACT?', 'Every gift has a price.', choices);
}

// ---------- GAUNTLET ----------
const GAUNTLET_HP = [2, 4, 5, 6];

const GAUNTLET_ITEMS = [
    [],
    ['CIGARETTES'],
    ['CIGARETTES', 'SHIELD'],
    ['KNIFE', 'CIGARETTES', 'SHIELD']
];

function buildGauntlet() {
    const pool = shuffle(dealerPool());
    const lineup = pool.slice(0, 3).concat(['ANCIENT']);
    state.gauntlet = { stage: 0, total: lineup.length, lineup, relics: [], cleared: 0 };
}

function setupFight(personality, hp, items) {
    const asc = ascLevel();
    if (asc >= 1) hp += 1;
    if (state.pact === 'THIN_ICE') hp += 1;
    currentDealerPersonality = personality;
    Music.setScene((['BOSS', 'ANCIENT', 'FINALE'].includes(currentDifficulty) || personality === 'WARDEN') ? 'boss' : 'fight', { stage: state.gauntlet ? state.gauntlet.stage : 0 });
    state.maxDealerHp = hp;
    state.dealerHp = hp;
    state.dealerItems = [...items];
    if (asc >= 2) state.dealerItems.push('SHIELD');
    if (personality === 'WARDEN') state.dealerItems.push('HANDCUFFS', 'SHIELD');
    state.shieldPlayer = false;
    state.shieldDealer = false;
    state.enraged = false;
    state.lastBreathUsed = false;
    state.eyeNext = false;
    state.round = 1;
    state.bluffTurns = 0;
    state.handcuffed = false;
    state.damageMultiplier = 1;
    state.chamber = [];
    state.shellMods = [];
    state.liveCount = 0;
    state.blankCount = 0;
    state.phoneMark = null;
    state.isProcessing = false;
    state.turn = null;
    const dealer = DEALER_PERSONALITIES[personality];
    const nameEl = document.getElementById('dealer-name-label');
    nameEl.innerText = dealer.name;
    nameEl.setAttribute('data-text', dealer.name);
    const indicator = document.getElementById('personality-indicator');
    indicator.className = `personality-indicator personality-${personality.toLowerCase()}`;
    indicator.innerText = dealer.name.toUpperCase();
    indicator.classList.remove('hidden');
    renderAmmo();
    renderHP();
}

function beginNextFight() {
    hideEventScreen();
    const g = state.gauntlet;
    const s = g.stage;
    state.gauntletBusy = false;
    state.ended = false;
    const idx = Math.min(s, GAUNTLET_HP.length - 1);
    setupFight(g.lineup[s], GAUNTLET_HP[idx], GAUNTLET_ITEMS[idx]);
    log(`${'STAGE'} ${s + 1}: ${DEALER_PERSONALITIES[g.lineup[s]].name}`, 'text-red-400');
    dealerSpeak('normal');
    renderRelicBar();
    startRound();
}

function gauntletFightWon() {
    const g = state.gauntlet;
    if (state.gauntletBusy) return;
    state.gauntletBusy = true;
    state.isProcessing = true;
    stopTurnTimer();
    toggleGunControls(false);
    g.cleared++;
    g.stage++;
    if (g.cleared > (meta.gauntletBest || 0)) meta.gauntletBest = g.cleared;
    const bonus = Math.floor(120 * g.cleared * rewardMult());
    globalMoney += bonus;
    totalStats.moneyEarned += bonus;
    totalStats.kills++;
    updateMoneyDisplay(true);
    updateSanity(10);
    dealerSpeak('lose');
    SFX.win();
    flashScreen('green');
    state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + 1);
    renderHP();
    log(`DEALER DOWN! +$${bonus}`, 'text-green-500');
    saveGame();
    setTimeout(offerRelicChoice, 1600);
}

function offerRelicChoice() {
    const g = state.gauntlet;
    const offers = pickRelics(3, NORMAL_RELICS);
    if (!offers.length) { offerEvent(); return; }
    showEventScreen(`STAGE ${g.cleared} CLEARED`,
        'Choose a relic.',
        offers.map(id => ({ icon: RELICS[id].icon, label: relicName(id), desc: relicDesc(id),
            cb: () => { addRelic(id);
                offerEvent(); } })));
}

function offerEvent() {
    const types = shuffle(['REST', 'SHOP', 'GAMBLE', 'CURSE']).slice(0, 3);
    const defs = {
        REST: { icon: px('bed'), label: 'REST', desc: 'Heal 2 HP, +20 Sanity.',
            cb: () => { state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + 2);
                updateSanity(20);
                renderHP();
                beginNextFight(); } },
        SHOP: { icon: px('candle'), label: 'BLACK MARKET', desc: 'Spend your money.',
            cb: () => openBlackMarket() },
        GAMBLE: { icon: px('dice'), label: 'GAMBLE', desc: '50%: free relic. 50%: -1 HP & -15 Sanity.',
            cb: () => {
                if (rnd() < 0.5) {
                    const r = pickRelics(1, NORMAL_RELICS);
                    if (r.length) {
                        addRelic(r[0]);
                        eventResult('LUCKY', `${RELICS[r[0]].icon} ${relicName(r[0])}`);
                    } else {
                        updateSanity(15);
                        eventResult('LUCKY', '+15 Sanity.');
                    }
                } else {
                    state.playerHp = Math.max(1, state.playerHp - 1);
                    updateSanity(-15);
                    renderHP();
                    flashScreen('red');
                    SFX.lose();
                    eventResult('UNLUCKY', 'You lose 1 HP and 15 Sanity.');
                }
            } },
        CURSE: { icon: px('skull'), label: 'CURSED RELIC', desc: 'Great power, great price. +$300.',
            cb: () => openCurseChoice() }
    };
    showEventScreen('BEFORE THE NEXT TABLE', 'Choose one path.',
        types.map(t => defs[t]));
}

function openCurseChoice() {
    const offers = pickRelics(2, CURSED_RELICS);
    const choices = offers.map(id => ({
        icon: RELICS[id].icon, label: relicName(id), desc: `${relicDesc(id)} (+$300)`, cls: 'border-purple-700 text-purple-300',
        cb: () => { addRelic(id);
            globalMoney += 300;
            totalStats.moneyEarned += 300;
            updateMoneyDisplay(true);
            saveGame();
            beginNextFight(); }
    }));
    choices.push({ icon: px('hand'), label: 'REFUSE', desc: '', cb: beginNextFight });
    showEventScreen('A WHISPER FROM THE DARK',
        offers.length ? 'Take it, or walk away.' : 'Nothing is left to offer.', choices);
}

function openBlackMarket() {
    const offers = [
        { icon: px('gift'), label: 'Random item', price: 60, needsSlot: true, desc: 'Get 1 random item.',
            cb: () => giveItem('player', randomItemKey()) },
        { icon: px('bandage'), label: 'Bandage', price: 100, desc: 'Heal 2 HP.',
            cb: () => { state.playerHp = Math.min(state.maxPlayerHp, state.playerHp + 2);
                renderHP(); } },
        { icon: px('shield'), label: 'Shield', price: 90, needsSlot: true, desc: 'Get 1 Shield.',
            cb: () => giveItem('player', 'SHIELD') }
    ];
    const choices = offers.map(o => ({
        icon: o.icon, label: `${o.label} - $${o.price}`, desc: o.desc,
        disabled: globalMoney < o.price || (o.needsSlot && state.playerItems.length >= 5),
        cb: () => {
            if (globalMoney < o.price) return;
            globalMoney -= o.price;
            updateMoneyDisplay(true);
            saveGame();
            o.cb();
            openBlackMarket();
        }
    }));
    choices.push({ icon: px('door'), label: 'LEAVE', desc: `$${globalMoney}`, cb: beginNextFight });
    showEventScreen('BLACK MARKET', `$${globalMoney}`, choices);
}

// ---------- SEEDED / ASCENSION MENU ----------
function cycleAscension() {
    meta.ascSel = ((meta.ascSel || 0) + 1) % ((meta.ascension || 0) + 1);
    SFX.click();
    saveGame();
    updateV8Menu();
}

function updateV8Menu() {
    const a = document.getElementById('menu-btn-asc');
    if (a) {
        a.innerText = `${'ASCENSION'} ${meta.ascSel || 0} / ${meta.ascension || 0}`;
        a.title = 'Each level: +20% rewards. 1: dealers +1 HP. 2: dealers start with a Shield. 3: Sanity -10. 4: +1 live shell. 5: max HP -1.';
    }
    const g = document.getElementById('gauntlet-sub');
    if (g) g.innerText = `$500 | 4 Dealers · Relics · Best ${meta.gauntletBest || 0}`;
    const d = document.getElementById('daily-sub');
    if (d) {
        const best = (meta.dailyBest && meta.dailyBest.date === dailySeed()) ? meta.dailyBest.score : 0;
        d.innerText = `Free | Same table for everyone · Today's best ${best}`;
    }
}
