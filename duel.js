"use strict";

// =====================================================================
// RUSSIAN ROULETTE DUEL: a short 1v1 from the lobby.
//   One six-chamber cylinder per round. Live / Blank counts are shown
//   when the round starts. Chambers are fired in order.
//   SHOOT SELF      blank: +1 extra turn, +10 Sanity. live: 3 damage.
//   SHOOT OPPONENT  live: 2 damage. Either way the turn ends.
//   Three item slots, three duel items (see DUEL_ITEMS).
//   First to 0 HP loses. Wins are logged to the Hall of Hands.
// Own state object, own timers (RunTimers), nothing shared with MAIN.
// =====================================================================
const DUEL_HP = 4, DUEL_SLOTS = 3, DUEL_SELF_DMG = 3, DUEL_SHOT_DMG = 2;
const DUEL_ITEMS = {
    SPINNER: { n: 'Cylinder Spinner', d: 'Re-roll which chamber is active.', ico: 'bolt', c: 'text-purple-400' },
    GLASS: { n: 'Magnifying Glass', d: 'Peek the active chamber.', ico: 'magnifier', c: 'text-blue-400' },
    CUFFS: { n: 'Handcuffs', d: 'Opponent skips their next turn.', ico: 'chain', c: 'text-orange-400' }
};
const DUEL_NAMES = ['THE GAMBLER', 'THE WIDOWER', 'THE LAST CLIENT', 'THE ALTAR BOY'];
let DUEL = null;

function duelOther(w) { return w === 'p' ? 'o' : 'p'; }
function duelRemaining() {
    let live = 0, blank = 0;
    DUEL.cyl.forEach((l, i) => { if (!DUEL.fired[i]) { if (l) live++; else blank++; } });
    return { live, blank, total: live + blank };
}
function duelRand(n) { return Math.floor(Math.random() * n); }
function duelNextUnfired(from) {
    for (let k = 1; k <= 6; k++) { const j = (from + k) % 6; if (!DUEL.fired[j]) return j; }
    return from;
}

function openDuel() {
    if (activeGame !== 'MENU') return;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('duel-screen').classList.remove('hidden');
    activeGame = 'DUEL';
    RunTimers.clearAll(); RunTimers.begin();
    initAudio();
    Music.setScene('fight');
    duelNew();
}

function duelNew() {
    RunTimers.clearAll();
    DUEL = { hp: { p: DUEL_HP, o: DUEL_HP }, items: { p: [], o: [] }, cuffed: { p: false, o: false },
             cyl: [], fired: [], idx: 0, round: 0, turn: 'p', busy: true, over: false, peek: { p: false, o: false },
             opp: DUEL_NAMES[duelRand(DUEL_NAMES.length)], msg: '', shots: 0 };
    document.getElementById('duel-end').classList.add('hidden');
    duelDeal(); duelRound();
}

function duelDeal() {
    ['p', 'o'].forEach(w => {
        if (DUEL.items[w].length < DUEL_SLOTS) {
            const keys = Object.keys(DUEL_ITEMS);
            DUEL.items[w].push(keys[duelRand(keys.length)]);
        }
    });
}

function duelRound() {
    DUEL.round++;
    const live = 1 + duelRand(3);                       // 1..3 live of 6
    DUEL.cyl = Array(6).fill(false);
    for (let n = 0; n < live;) { const i = duelRand(6); if (!DUEL.cyl[i]) { DUEL.cyl[i] = true; n++; } }
    DUEL.fired = Array(6).fill(false);
    DUEL.idx = duelRand(6);
    DUEL.peek = { p: false, o: false };
    if (DUEL.round > 1) duelDeal();
    DUEL.msg = `ROUND ${DUEL.round}: ${live} LIVE, ${6 - live} BLANK`;
    SFX.load && SFX.load();
    DUEL.busy = false;
    duelRender();
    if (DUEL.turn === 'o') duelAiSoon();
}

// ---------------- shooting ----------------
function duelFire(shooter, target) {
    if (!DUEL || DUEL.over || DUEL.busy) return;
    DUEL.busy = true;
    const live = DUEL.cyl[DUEL.idx];
    DUEL.fired[DUEL.idx] = true;
    DUEL.idx = duelNextUnfired(DUEL.idx);
    DUEL.peek = { p: false, o: false };
    DUEL.shots++;
    const self = target === 'self', victim = self ? shooter : duelOther(shooter);
    let next, extra = '';
    if (live) {
        const dmg = self ? DUEL_SELF_DMG : DUEL_SHOT_DMG;
        DUEL.hp[victim] = Math.max(0, DUEL.hp[victim] - dmg);
        SFX.shot(); flashScreen('red'); buzz([60, 40, 90]);
        if (victim === 'p') updateSanity(-8);
        DUEL.msg = `BANG. ${victim === 'p' ? 'YOU TAKE' : 'THE OPPONENT TAKES'} ${dmg}.`;
        next = duelOther(shooter);
    } else {
        SFX.empty();
        if (self) {
            DUEL.msg = shooter === 'p' ? 'CLICK. BLANK. EXTRA TURN. +10 SANITY' : 'CLICK. THE OPPONENT LIVES. EXTRA TURN.';
            if (shooter === 'p') updateSanity(10);
            next = shooter;
        } else { DUEL.msg = 'CLICK. BLANK.'; next = duelOther(shooter); }
    }
    if (next !== shooter && DUEL.cuffed[next]) {           // handcuffs: the cuffed side loses its turn
        DUEL.cuffed[next] = false; next = shooter; extra = ' CUFFED: TURN SKIPPED.';
    }
    DUEL.msg += extra;
    duelRender();
    setTimeout(() => {
        if (!DUEL) return;
        if (DUEL.hp.p <= 0 || DUEL.hp.o <= 0) { duelEnd(DUEL.hp.o <= 0 ? 'p' : 'o'); return; }
        DUEL.turn = next;
        if (duelRemaining().total === 0) { duelRound(); return; }
        DUEL.busy = false;
        duelRender();
        if (DUEL.turn === 'o') duelAiSoon();
    }, dly(900));
}

function duelShootSelf() { if (DUEL && DUEL.turn === 'p' && !DUEL.busy) duelFire('p', 'self'); }
function duelShootOpp() { if (DUEL && DUEL.turn === 'p' && !DUEL.busy) duelFire('p', 'opp'); }

// ---------------- items ----------------
function duelUse(who, slot) {
    if (!DUEL || DUEL.over) return;
    const key = DUEL.items[who][slot];
    if (!key) return;
    if (who === 'p' && (DUEL.turn !== 'p' || DUEL.busy)) return;
    DUEL.items[who].splice(slot, 1);
    SFX.hover();
    if (key === 'GLASS') {
        DUEL.peek[who] = true;
        DUEL.msg = who === 'p' ? `MAGNIFIER: THE ACTIVE CHAMBER IS ${DUEL.cyl[DUEL.idx] ? 'LIVE' : 'BLANK'}.` : 'THE OPPONENT SQUINTS AT THE CYLINDER.';
    } else if (key === 'SPINNER') {
        const open = [0, 1, 2, 3, 4, 5].filter(i => !DUEL.fired[i]);
        DUEL.idx = open[duelRand(open.length)];
        DUEL.peek = { p: false, o: false };
        DUEL.msg = (who === 'p' ? 'YOU SPIN' : 'THE OPPONENT SPINS') + ' THE CYLINDER.';
        noiseBurst(0.3, { vol: 0.3, type: 'bandpass', freq: 1800, slideTo: 400 });
    } else if (key === 'CUFFS') {
        DUEL.cuffed[duelOther(who)] = true;
        DUEL.msg = (who === 'p' ? 'YOU CUFF THE OPPONENT' : 'THE OPPONENT CUFFS YOU') + '. NEXT TURN SKIPPED.';
        SFX.chip && SFX.chip();
    }
    duelRender();
}

// ---------------- opponent ----------------
function duelAiSoon() {
    DUEL.busy = true;
    setTimeout(duelAi, dly(1100));
}
function duelAi() {
    if (!DUEL || DUEL.over || DUEL.turn !== 'o') return;
    if (typeof QOL !== 'undefined' && QOL.paused) { setTimeout(duelAi, 300); return; }
    halluMaybeFalseAim(duelAiAct);
}
function duelAiAct() {
    if (!DUEL || DUEL.over || DUEL.turn !== 'o') return;
    const it = DUEL.items.o, r = duelRemaining();
    const slot = k => it.indexOf(k);
    // use at most one item per think, then come back
    if (!DUEL.peek.o && slot('GLASS') > -1 && r.live > 0 && r.blank > 0) { duelUse('o', slot('GLASS')); setTimeout(duelAiAct, dly(900)); return; }
    const known = DUEL.peek.o ? (DUEL.cyl[DUEL.idx] ? 'live' : 'blank') : null;
    if (known === 'live' && slot('SPINNER') > -1 && r.blank > 0 && Math.random() < 0.3) { duelUse('o', slot('SPINNER')); setTimeout(duelAiAct, dly(900)); return; }
    if (slot('CUFFS') > -1 && !DUEL.cuffed.p && (known === 'live' || Math.random() < 0.4)) { duelUse('o', slot('CUFFS')); setTimeout(duelAiAct, dly(900)); return; }
    let target;
    if (known) target = known === 'live' ? 'opp' : 'self';
    else if (r.live === 0) target = 'self';
    else if (r.blank === 0) target = 'opp';
    else {
        const p = r.live / r.total;
        target = (p < 0.34 && DUEL.hp.o > DUEL_SELF_DMG) ? 'self' : 'opp';
    }
    DUEL.busy = false;
    duelFire('o', target);
}

// ---------------- end ----------------
function duelEnd(winner) {
    DUEL.over = true; DUEL.busy = true;
    meta.duel = meta.duel || { wins: 0, losses: 0, best: 0 };
    const box = document.getElementById('duel-end');
    let body;
    if (winner === 'p') {
        const score = Math.round(1000 + DUEL.hp.p * 300 + Math.max(0, sanity) * 5 + Math.max(0, 6 - DUEL.round) * 150);
        const grade = score >= 2400 ? 'S' : score >= 1900 ? 'A' : score >= 1500 ? 'B' : 'C';
        meta.duel.wins++; meta.duel.best = Math.max(meta.duel.best, score);
        globalMoney += 100; totalStats.moneyEarned += 100;
        if (typeof recordBoard === 'function') recordBoard({ score, grade, mode: 'DUEL', sin: storyMode });
        saveGame();
        SFX.win();
        body = `<div class="duel-big win">YOU WALK AWAY</div><div>SCORE ${score} &middot; GRADE ${grade} &middot; +$100</div><div class="duel-sub">Logged in the Hall of Hands.</div>`;
    } else {
        meta.duel.losses++;
        updateSanity(-5); saveGame();
        SFX.lose();
        body = `<div class="duel-big lose">THE CHAIR IS EMPTY</div><div class="duel-sub">${DUEL.opp} keeps your seat.</div>`;
    }
    box.innerHTML = body + `<div class="duel-btns"><button class="btn-retro" onclick="duelNew()">AGAIN</button><button class="btn-retro border-gray-600 text-gray-400" onclick="closeDuel()">LEAVE</button></div>`;
    box.classList.remove('hidden');
}

function closeDuel() {
    if (activeGame !== 'DUEL') return;
    RunTimers.clearAll(); RunTimers.end();
    DUEL = null;
    document.getElementById('duel-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    document.querySelectorAll('[style*="translate"], [style*="rotate"]').forEach(c => { c.style.removeProperty('translate'); c.style.removeProperty('rotate'); });
    activeGame = 'MENU';
    Music.setScene('menu');
    renderLobby();
}

// ---------------- drawing ----------------
function duelPips(n) { let s = ''; for (let i = 0; i < DUEL_HP; i++) s += `<span class="duel-pip ${i < n ? 'on' : ''}"></span>`; return s; }
function duelRender() {
    if (!DUEL) return;
    const r = duelRemaining();
    const set = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
    set('duel-opp-hp', `<span class="duel-who">${DUEL.opp}</span>${duelPips(DUEL.hp.o)}`);
    set('duel-you-hp', `<span class="duel-who">YOU</span>${duelPips(DUEL.hp.p)}`);
    const peek = DUEL.peek.p ? (DUEL.cyl[DUEL.idx] ? 'live' : 'blank') : null;
    let cy = '';
    for (let i = 0; i < 6; i++) {
        const cls = ['cy-ch', DUEL.fired[i] ? 'fired' : '', i === DUEL.idx && !DUEL.fired[i] ? 'cur' : '', i === DUEL.idx && peek ? 'is-' + peek : ''].join(' ');
        cy += `<span class="${cls}" style="transform:rotate(${i * 60}deg) translateY(-42px)"></span>`;
    }
    set('duel-cyl', cy);
    set('duel-count', `LIVE <b class="text-red-500">${r.live}</b> &middot; BLANK <b class="text-cyan-300">${r.blank}</b> &middot; LEFT ${r.total}` +
        (peek ? ` &middot; ACTIVE: <b class="${peek === 'live' ? 'text-red-500' : 'text-cyan-300'}">${peek.toUpperCase()}</b>` : ''));
    set('duel-msg', DUEL.msg);
    set('duel-turn', DUEL.over ? '' : (DUEL.turn === 'p' ? 'YOUR TURN' : 'OPPONENT'));
    const slots = [];
    for (let i = 0; i < DUEL_SLOTS; i++) {
        const k = DUEL.items.p[i];
        if (!k) { slots.push('<div class="item-empty"></div>'); continue; }
        const d = DUEL_ITEMS[k];
        slots.push(`<button class="item-btn border border-gray-700 ${d.c}" onclick="duelUse('p',${i})" title="${d.d}" aria-label="${d.n}. ${d.d}">` +
            `<span class="key-hint border-gray-600 text-gray-400">${i + 1}</span> ${px(d.ico)} <span class="item-name hallu-cand">${d.n}</span></button>`);
    }
    set('duel-items', slots.join(''));
    set('duel-opp-items', `OPPONENT ITEMS: ${DUEL.items.o.length}/${DUEL_SLOTS}${DUEL.cuffed.o ? ' &middot; CUFFED' : ''}`);
    const can = DUEL.turn === 'p' && !DUEL.busy && !DUEL.over;
    ['duel-self', 'duel-shoot'].forEach(id => { const b = document.getElementById(id); if (b) b.disabled = !can; });
    if (typeof halluActive === 'function' && halluActive()) document.querySelectorAll('#duel-items .item-name').forEach(scrambleEl);
}

document.addEventListener('keydown', e => {
    if (activeGame !== 'DUEL' || !DUEL || e.ctrlKey) return;
    if (typeof QOL !== 'undefined' && QOL.paused) return;
    const k = (e.key || '').toUpperCase();
    if (k === 'S') duelShootSelf();
    else if (k === ' ' || k === 'O') { e.preventDefault(); duelShootOpp(); }
    else if (k >= '1' && k <= '3') duelUse('p', Number(k) - 1);
});
