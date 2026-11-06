"use strict";

// =====================================================================
// 1V1 VERSUS: two people, one device (pass and play), or you against a bot.
// Shotgun rules, short matches:
//   * a shuffled shotgun, Live / Blank counts shown at the start of every round
//   * SHOOT SELF: blank = you shoot again. live = you take the hit.
//   * SHOOT OPPONENT: live = they take the hit. Either way the turn ends.
//   * 4 item slots, 7 items (SHELL_ITEMS). Items are public, a peek is private:
//     every turn change shows a PASS THE DEVICE cover so nobody sees it.
// Nothing here touches the story save except a win counter.
// Own state (VS), own timers (RunTimers), no shared globals with the fight.
// =====================================================================
const VS_HP = 4, VS_SLOTS = 4;
const VS_ITEMS = {
    GLASS: { n: 'Magnifying Glass', d: 'Peek at the next shell. Only you see it.', ico: 'magnifier', c: 'text-blue-400' },
    KNIFE: { n: 'Hand Saw', d: 'Your next hit deals double damage.', ico: 'knife', c: 'text-red-400' },
    BEER: { n: 'Beer', d: 'Eject the next shell and see what it was.', ico: 'beer', c: 'text-amber-400' },
    CIGS: { n: 'Cigarettes', d: 'Heal 1 HP.', ico: 'cigarette', c: 'text-green-400' },
    CUFFS: { n: 'Handcuffs', d: 'The other player skips their next turn.', ico: 'chain', c: 'text-orange-400' },
    INVERTER: { n: 'Inverter', d: 'Flip the next shell: live becomes blank and back.', ico: 'bolt', c: 'text-purple-400' },
    SHIELD: { n: 'Shield', d: 'Block the next hit you take.', ico: 'shield', c: 'text-cyan-300' }
};
let VS = null;

function vsRand(n) { return Math.floor(Math.random() * n); }
function vsOther(s) { return s === 'a' ? 'b' : 'a'; }
function vsName(s) { return VS.names[s]; }
function vsLeft() {
    const live = VS.chamber.filter(Boolean).length;
    return { live, blank: VS.chamber.length - live, total: VS.chamber.length };
}

// ---------------- open / close ----------------
function openVersus(mode) {
    if (activeGame !== 'MENU') return;
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('versus-screen').classList.remove('hidden');
    activeGame = 'VERSUS';
    document.body.classList.add('vs-on');
    RunTimers.clearAll(); RunTimers.begin();
    initAudio(); Music.setScene('fight');
    vsNew(mode || 'friend');
}
function vsNew(mode) {
    RunTimers.clearAll();
    mode = mode || (VS && VS.mode) || 'friend';
    VS = { mode, names: { a: settings.name || 'PLAYER 1', b: mode === 'cpu' ? 'THE HOUSE' : 'PLAYER 2' },
           hp: { a: VS_HP, b: VS_HP }, items: { a: [], b: [] }, chamber: [], turn: Math.random() < 0.5 ? 'a' : 'b',
           knife: { a: false, b: false }, cuffed: { a: false, b: false }, shield: { a: false, b: false },
           peek: null, busy: true, over: false, round: 0, msg: '', cover: false };
    document.getElementById('versus-end').classList.add('hidden');
    document.getElementById('versus-cover').classList.add('hidden');
    vsRound(true);
}
function closeVersus() {
    if (activeGame !== 'VERSUS') return;
    RunTimers.clearAll(); RunTimers.end();
    VS = null;
    document.getElementById('versus-screen').classList.add('hidden');
    document.getElementById('versus-cover').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    activeGame = 'MENU';
    document.body.classList.remove('vs-on');
    Music.setScene('menu');
    renderLobby();
}

// ---------------- rounds ----------------
function vsRound(first) {
    VS.round++;
    const total = 2 + vsRand(7), live = Math.max(1, Math.min(total - 1, 1 + vsRand(Math.ceil(total / 2))));
    VS.chamber = shuffle(Array(total).fill(false).map((_, i) => i < live));
    VS.peek = null;
    const give = 2;
    ['a', 'b'].forEach(s => {
        for (let i = 0; i < give && VS.items[s].length < VS_SLOTS; i++) {
            const k = Object.keys(VS_ITEMS); VS.items[s].push(k[vsRand(k.length)]);
        }
    });
    VS.msg = `ROUND ${VS.round}: ${live} LIVE, ${total - live} BLANK`;
    SFX.load && SFX.load();
    VS.busy = false;
    vsRender();
    vsBeginTurn(first);
}
// hand the device over (friend mode) or wake the bot
function vsBeginTurn(announce) {
    VS.peek = null;
    if (VS.mode === 'friend' && announce !== 'same') {
        VS.cover = true; VS.busy = true;
        const c = document.getElementById('versus-cover');
        c.innerHTML = `<div class="versus-pass">PASS THE DEVICE</div><div class="versus-pass-name">${vsName(VS.turn)}</div>` +
            `<button class="btn-retro w-64" onclick="vsReady()">TAP WHEN READY</button>`;
        c.classList.remove('hidden');
        return;
    }
    if (VS.mode === 'cpu' && VS.turn === 'b') { VS.busy = true; setTimeout(vsAi, dly(1100)); }
    vsRender();
}
function vsReady() {
    if (!VS || !VS.cover) return;
    VS.cover = false; VS.busy = false;
    document.getElementById('versus-cover').classList.add('hidden');
    SFX.click();
    vsRender();
}

// ---------------- shooting ----------------
function vsFire(shooter, target) {
    if (!VS || VS.over || VS.busy) return;
    VS.busy = true;
    const live = VS.chamber.shift(), self = target === 'self', victim = self ? shooter : vsOther(shooter);
    VS.peek = null;
    let next, msg;
    if (live) {
        const dmg = VS.knife[shooter] ? 2 : 1;
        VS.knife[shooter] = false;
        if (VS.shield[victim]) { VS.shield[victim] = false; msg = `BANG. ${vsName(victim)}'s SHIELD SHATTERS.`; SFX.shieldBreak(); }
        else { VS.hp[victim] = Math.max(0, VS.hp[victim] - dmg); msg = `BANG. ${vsName(victim)} TAKES ${dmg}.`; SFX.shot(); flashScreen('red'); buzz([50, 40, 70]); }
        next = vsOther(shooter);
    } else {
        VS.knife[shooter] = VS.knife[shooter];            // a blank keeps the saw loaded
        SFX.empty();
        if (self) { msg = `CLICK. BLANK. ${vsName(shooter)} SHOOTS AGAIN.`; next = shooter; }
        else { msg = 'CLICK. BLANK.'; next = vsOther(shooter); }
    }
    let skipped = false;
    if (next !== shooter && VS.cuffed[next]) { VS.cuffed[next] = false; next = shooter; skipped = true; msg += ` ${vsName(vsOther(shooter))} IS CUFFED AND LOSES THE TURN.`; }
    VS.msg = msg;
    vsRender();
    setTimeout(() => {
        if (!VS) return;
        if (VS.hp.a <= 0 || VS.hp.b <= 0) { vsEnd(VS.hp.a <= 0 ? 'b' : 'a'); return; }
        const changed = next !== VS.turn || false;
        VS.turn = next;
        if (VS.chamber.length === 0) { vsRound(); return; }
        VS.busy = false;
        vsBeginTurn(changed && !skipped ? true : 'same');
    }, dly(950));
}
function vsShoot(target) {
    if (!VS || VS.busy || VS.cover || VS.over) return;
    if (VS.mode === 'cpu' && VS.turn === 'b') return;
    vsFire(VS.turn, target);
}

// ---------------- items ----------------
function vsUse(side, slot) {
    if (!VS || VS.over) return;
    const key = VS.items[side][slot];
    if (!key) return;
    if (side === VS.turn && VS.busy && !(VS.mode === 'cpu' && side === 'b')) return;
    if (side !== VS.turn) return;
    if (VS.mode === 'cpu' && side === 'a' && VS.turn !== 'a') return;
    const other = vsOther(side);
    if (key === 'CUFFS' && VS.cuffed[other]) { SFX.empty(); VS.msg = 'THEY ARE ALREADY CUFFED.'; vsRender(); return; }
    if (key === 'CIGS' && VS.hp[side] >= VS_HP) { SFX.empty(); VS.msg = 'ALREADY AT FULL HEALTH.'; vsRender(); return; }
    if (key === 'SHIELD' && VS.shield[side]) { SFX.empty(); VS.msg = 'YOU ALREADY HAVE A SHIELD.'; vsRender(); return; }
    if (key === 'KNIFE' && VS.knife[side]) { SFX.empty(); VS.msg = 'THE SAW IS ALREADY READY.'; vsRender(); return; }
    if (!VS.chamber.length && ['GLASS', 'BEER', 'INVERTER'].includes(key)) return;
    VS.items[side].splice(slot, 1);
    SFX.hover();
    const nm = vsName(side);
    if (key === 'GLASS') { VS.peek = VS.chamber[0] ? 'live' : 'blank'; VS.peekFor = side; VS.msg = `${nm} PEEKS AT THE NEXT SHELL.`; }
    else if (key === 'KNIFE') { VS.knife[side] = true; VS.msg = `${nm} SAWS THE BARREL. NEXT HIT x2.`; }
    else if (key === 'BEER') { const s = VS.chamber.shift(); VS.peek = null; VS.msg = `${nm} EJECTS A ${s ? 'LIVE' : 'BLANK'} SHELL.`; if (!VS.chamber.length) { vsRender(); setTimeout(() => { if (VS) vsRound(); }, dly(900)); return; } }
    else if (key === 'CIGS') { VS.hp[side]++; VS.msg = `${nm} HEALS 1.`; SFX.heal(); }
    else if (key === 'CUFFS') { VS.cuffed[other] = true; VS.msg = `${nm} CUFFS ${vsName(other)}.`; }
    else if (key === 'INVERTER') { VS.chamber[0] = !VS.chamber[0]; if (VS.peek) VS.peek = VS.chamber[0] ? 'live' : 'blank'; VS.msg = `${nm} FLIPS THE NEXT SHELL.`; }
    else if (key === 'SHIELD') { VS.shield[side] = true; VS.msg = `${nm} RAISES A SHIELD.`; SFX.shield && SFX.shield(); }
    vsRender();
}

// ---------------- bot ----------------
function vsAi() {
    if (!VS || VS.over || VS.turn !== 'b' || VS.mode !== 'cpu') return;
    if (typeof QOL !== 'undefined' && QOL.paused) { setTimeout(vsAi, 300); return; }
    const it = VS.items.b, has = k => it.indexOf(k), r = vsLeft();
    const known = VS.peek && VS.peekFor === 'b' ? VS.peek : null;
    const use = k => { VS.busy = false; vsUse('b', has(k)); VS.busy = true; setTimeout(vsAi, dly(900)); };
    if (!known && has('GLASS') > -1 && r.live && r.blank) return use('GLASS');
    if (has('CIGS') > -1 && VS.hp.b < VS_HP) return use('CIGS');
    if (has('SHIELD') > -1 && !VS.shield.b) return use('SHIELD');
    if (has('CUFFS') > -1 && !VS.cuffed.a) return use('CUFFS');
    if (known === 'blank' && has('INVERTER') > -1 && r.total > 1) return use('INVERTER');
    if ((known === 'live' || (!known && r.live / r.total > 0.6)) && has('KNIFE') > -1 && !VS.knife.b) return use('KNIFE');
    if (!known && has('BEER') > -1 && r.total > 2 && Math.random() < 0.5) return use('BEER');
    let target;
    if (known) target = known === 'live' ? 'opp' : 'self';
    else if (r.live === 0) target = 'self';
    else if (r.blank === 0) target = 'opp';
    else target = (r.live / r.total < 0.4 && VS.hp.b > 1) ? 'self' : 'opp';
    VS.busy = false;
    vsFire('b', target);
}

// ---------------- end ----------------
function vsEnd(win) {
    VS.over = true; VS.busy = true;
    meta.versus = meta.versus || { games: 0, a: 0, b: 0, cpuWins: 0, cpuLosses: 0 };
    meta.versus.games++;
    if (VS.mode === 'friend') meta.versus[win]++;
    else if (win === 'a') meta.versus.cpuWins++; else meta.versus.cpuLosses++;
    saveGame();
    SFX.win();
    const v = meta.versus;
    const tally = VS.mode === 'friend' ? `${VS.names.a} ${v.a} &ndash; ${v.b} ${VS.names.b}` : `Against the house: ${v.cpuWins} won, ${v.cpuLosses} lost`;
    const box = document.getElementById('versus-end');
    box.innerHTML = `<div class="versus-big">${vsName(win)} WINS</div><div class="versus-sub">${tally}</div>` +
        `<div class="versus-btns"><button class="btn-retro" onclick="vsNew()">REMATCH</button><button class="btn-retro border-gray-600 text-gray-400" onclick="closeVersus()">LEAVE</button></div>`;
    box.classList.remove('hidden');
}

// ---------------- drawing ----------------
function vsSlots(side, live) {
    let h = '';
    for (let i = 0; i < VS_SLOTS; i++) {
        const k = VS.items[side][i];
        if (!k) { h += '<div class="item-empty"></div>'; continue; }
        const d = VS_ITEMS[k];
        h += `<button class="item-btn border border-gray-700 ${d.c}" ${live ? '' : 'disabled'} onclick="vsUse('${side}',${i})" aria-label="${d.n}. ${d.d}" data-tip="${d.n}: ${d.d}">` +
             `${live ? `<span class="key-hint border-gray-600 text-gray-400">${keyLabel('item' + (i + 1))}</span>` : ''} ${px(d.ico)} <span class="item-name">${d.n}</span></button>`;
    }
    return h;
}
function vsMini(side) { return VS.items[side].map(k => `<span class="vs-mini-ic ${VS_ITEMS[k].c}" title="${VS_ITEMS[k].n}">${px(VS_ITEMS[k].ico)}</span>`).join(''); }
function vsHpBlocks(n) { let s = ''; for (let i = 0; i < VS_HP; i++) s += `<div class="hp-segment ${i < n ? 'filled' : 'lost'}"></div>`; return s; }
function vsTags(s) { return (VS.shield[s] ? '<span class="versus-tag">SHIELD</span>' : '') + (VS.knife[s] ? '<span class="versus-tag">SAW</span>' : '') + (VS.cuffed[s] ? '<span class="versus-tag">CUFFED</span>' : ''); }
// the player whose turn it is always sits at the bottom, exactly like the main game
function vsRender() {
    if (!VS) return;
    const r = vsLeft(), set = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
    const bot = VS.mode === 'cpu' ? 'a' : VS.turn, top = vsOther(bot);
    const myTurn = VS.turn === bot && !VS.over && !VS.cover && !(VS.mode === 'cpu' && bot === 'b');
    const nm = (id, s) => { const e = document.getElementById(id); if (e) e.textContent = vsName(s); };
    nm('vs-top-name', top); nm('vs-bot-name', bot);
    set('vs-top-hp', vsHpBlocks(VS.hp[top])); set('vs-bot-hp', vsHpBlocks(VS.hp[bot]));
    set('vs-top-tags', vsTags(top)); set('vs-bot-tags', vsTags(bot));
    set('vs-top-items', vsMini(top));
    set('vs-bot-items', vsSlots(bot, myTurn));
    const peek = VS.peek && VS.peekFor === VS.turn && !VS.cover ? VS.peek : null;
    set('versus-count', peek ? `NEXT SHELL: <b class="${peek === 'live' ? 'text-red-500' : 'text-cyan-300'}">${peek.toUpperCase()}</b>` : '');
    const lv = document.getElementById('vs-live'), bl = document.getElementById('vs-blank');
    if (lv) lv.textContent = r.live; if (bl) bl.textContent = r.blank;
    let shells = '';
    for (let i = 0; i < r.total; i++) shells += `<div class="shell ${i === 0 && peek ? peek : 'unknown'}"></div>`;
    set('versus-shells', shells);
    set('versus-msg', VS.cover ? '' : VS.msg);
    set('versus-turn', VS.over ? '' : `${vsName(VS.turn)}'S TURN`);
    const can = !VS.busy && !VS.over && !VS.cover && !(VS.mode === 'cpu' && VS.turn === 'b');
    const so = document.getElementById('versus-shoot'), ss = document.getElementById('versus-self');
    if (so) { so.disabled = !can; so.querySelector('.vs-lbl').textContent = 'SHOOT ' + vsName(top); }
    if (ss) ss.disabled = !can;
}

document.addEventListener('keydown', e => {
    if (activeGame !== 'VERSUS' || !VS || e.ctrlKey || keyListening) return;
    if (typeof QOL !== 'undefined' && QOL.paused) return;
    const k = normKey(e.key);
    if (k === KEYMAP.shootSelf) { e.preventDefault(); vsShoot('self'); }
    else if (k === KEYMAP.shootOpp) { e.preventDefault(); if (VS.cover) vsReady(); else vsShoot('opp'); }
    else for (let i = 1; i <= VS_SLOTS; i++) if (k === KEYMAP['item' + i]) vsUse(VS.turn, i - 1);
});
