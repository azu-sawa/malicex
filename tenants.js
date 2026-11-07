"use strict";

// =====================================================================
// THE TENANTS (Md7)
//   - a real-time day / night cycle that changes the House and every run
//   - beaten dealers move into the House as tenants: a favour each day,
//     a grudge if you ignore them for three days
//   - the House leaks into runs: intrusions, whispers, false counts
// Everything here is Math.random + local time; seeded runs stay identical
// because nothing here touches the shell / deck RNG.
// =====================================================================

// ---------- day / night ----------
const PHASES = {
    DAY:   { name: 'DAY',   sub: '+5 Sanity at the start of a run',          san: 5,  pay: 1.0  },
    DUSK:  { name: 'DUSK',  sub: 'the tenants are stirring',                 san: 0,  pay: 1.0  },
    NIGHT: { name: 'NIGHT', sub: '+25% pay, but -8 Sanity at the start',     san: -8, pay: 1.25 },
    DAWN:  { name: 'DAWN',  sub: '+3 Sanity at the start of a run',          san: 3,  pay: 1.0  }
};
let PHASE_FORCE = '';          // tests / debug
function dayPhase() {
    if (PHASE_FORCE) return PHASE_FORCE;
    const h = new Date().getHours();
    if (h >= 7 && h < 18) return 'DAY';
    if (h >= 18 && h < 22) return 'DUSK';
    if (h >= 22 || h < 5) return 'NIGHT';
    return 'DAWN';
}
function isNight() { return dayPhase() === 'NIGHT'; }

// ---------- tenants ----------
const TENANT_PERKS = {
    SADISTIC:      { perk: 'BLOOD MONEY',   text: 'next run pays 10% more',            fx: { reward: 1.10 }, line: '"You forgot me. I do not forget."' },
    CALCULATING:   { perk: 'A SMALL STAKE', text: '+$100 at the start of your next run', fx: { cash: 100 },   line: '"There is an error in the books. It is you."' },
    UNPREDICTABLE: { perk: 'LOADED DICE',   text: 'a random boost for your next run',  fx: null,             line: '"Hee. Hee. Where were you? Hee."' },
    ANCIENT:       { perk: 'OLD PRAYER',    text: '+10 Sanity at the start of your next run', fx: { sanity: 10 }, line: '"Even the dead keep appointments."' },
    MIMIC:         { perk: 'AN ECHO',       text: '+6 Sanity and +$50 next run',        fx: { sanity: 6, cash: 50 }, line: '"I practised being you. I got worse at it, alone."' },
    WARDEN:        { perk: 'THE KEYS',      text: '+$60 and +6 Sanity next run',        fx: { cash: 60, sanity: 6 }, line: '"Rules are a kindness. You ignored a kindness."' },
    FIRST:         { perk: 'THE FIRST HAND', text: 'next run pays 12% more',            fx: { reward: 1.12 }, line: '"I dealt one hand. I am still waiting for you to finish it."' },
    COLLECTOR:     { perk: 'A TOKEN',       text: '+1 Mark now',                        marks: 1,            line: '"You are an unclaimed item."' },
    CONFESSOR:     { perk: 'ABSOLUTION',    text: '+12 Sanity at the start of your next run', fx: { sanity: 12 }, line: '"You have not confessed. It has been a while."' },
    CLOCKWORK:     { perk: 'A WOUND SPRING', text: 'next run pays 10% more',            fx: { reward: 1.10 }, line: '"Tick. Tick. You are late. Tick."' },
    HOST:          { perk: 'A DINNER',      text: '+$200 at the start of your next run', fx: { cash: 200 },   line: '"I kept the table set. Nobody sat."' }
};
const TENANT_KEYS = Object.keys(TENANT_PERKS);
const TENANT_DAYS = 3;                       // ignored this long and they turn
const TENANT_CAPS = { sanity: 20, cash: 400, reward: 1.35 };

function tenantList() { return TENANT_KEYS.filter(k => typeof hsBeaten === 'function' && hsBeaten(k)); }
function tenantRec(k) {
    const d = hsData(); d.tenants = d.tenants || {};
    if (!d.tenants[k]) d.tenants[k] = { last: Date.now(), fav: '' };
    return d.tenants[k];
}
function tenantState(k) {
    const r = tenantRec(k);
    if (Date.now() - r.last > TENANT_DAYS * 864e5) return 'RESTLESS';
    return r.fav === hsDay() ? 'CONTENT' : 'READY';
}
function restlessTenants() { return tenantList().filter(k => tenantState(k) === 'RESTLESS'); }

// add to the "next run" bundle, with caps so a house full of tenants cannot break the economy
function tenantAddFx(fx) {
    const f = hsData().fx;
    if (fx.sanity) f.sanity = Math.max(-30, Math.min(TENANT_CAPS.sanity, (f.sanity || 0) + fx.sanity));
    if (fx.cash) f.cash = Math.min(TENANT_CAPS.cash, (f.cash || 0) + fx.cash);
    if (fx.reward) f.reward = Math.min(TENANT_CAPS.reward, (f.reward || 1) * fx.reward);
}
function tenantFavour(k) {
    const p = TENANT_PERKS[k], r = tenantRec(k);
    let fx = p.fx, txt = p.text;
    if (k === 'UNPREDICTABLE') {
        const o = [{ sanity: 8 }, { cash: 120 }, { reward: 1.1 }][Math.floor(Math.random() * 3)];
        fx = o; txt = o.sanity ? '+8 Sanity next run' : o.cash ? '+$120 next run' : 'next run pays 10% more';
    }
    if (fx) tenantAddFx(fx);
    if (p.marks) addMarks(p.marks);
    r.fav = hsDay(); r.last = Date.now();
    saveGame();
    return { name: p.perk, text: txt };
}
// the cost of being ignored: pay rent, or let them have you
function tenantAppease(k) { const r = tenantRec(k); r.last = Date.now(); r.fav = ''; saveGame(); }
function tenantCurse(k) {
    const r = tenantRec(k); r.last = Date.now(); r.fav = hsDay();
    tenantAddFx({ sanity: -8, reward: 1.15 });
    saveGame();
}

// ---------- the next run ----------
function nextRunSummary() {
    const f = hsData().fx, a = [];
    if (f.sanity) a.push((f.sanity > 0 ? '+' : '') + f.sanity + ' Sanity');
    if (f.cash) a.push('+$' + f.cash);
    if (f.reward) a.push('x' + f.reward.toFixed(2) + ' pay');
    return a;
}
let runStartPhase = '';
const _tnStartGame = startGame;
startGame = function() {
    runStartPhase = dayPhase();
    _tnStartGame();
    const P = PHASES[runStartPhase];
    if (P.san) { setSanityDirect(Math.max(5, Math.min(100, sanity + P.san))); }
    hsData().fx.livePhase = P.pay;
    try { runIntrusions = 0; } catch (e) {}
};
const _tnMult = rewardMult;
rewardMult = function() { return _tnMult() * (hsData().fx.livePhase || 1); };
const _tnAfter = afterResultHooks;
afterResultHooks = function(won) {
    if (won && runStartPhase === 'NIGHT') { try { unlockAchievement('NIGHT_OWL'); } catch (e) {} }
    const r = _tnAfter(won); hsData().fx.livePhase = 0; runStartPhase = ''; return r;
};

// ---------- the house leaks into runs ----------
let runIntrusions = 0;
function intrusionChance() {
    let c = 0.10;
    if (isNight()) c += 0.12;
    if (typeof sanity === 'number' && sanity <= 50) c += 0.12;
    if (typeof sanity === 'number' && sanity <= 25) c += 0.1;
    c += Math.min(3, restlessTenants().length) * 0.07;
    return Math.min(0.5, c);
}
function dreadWord() {
    const n = playerName().toUpperCase(), a = ['HE KNOWS', 'LOOK BEHIND YOU', n, 'STILL HERE', 'NOT ALONE', 'COUNT THEM', 'SOMEONE SAT DOWN', 'YOU FORGOT'];
    return a[Math.floor(Math.random() * a.length)];
}
function dreadPick() {
    const r = restlessTenants();
    const pool = ['word', 'whisper', 'count', 'black', 'whisper', 'word', 'door'];
    if (r.length) pool.push('tenant', 'tenant', 'tenant');
    if (isNight()) pool.push('count', 'black');
    return pool[Math.floor(Math.random() * pool.length)];
}
function dreadIntrude(kind) {
    if (typeof activeGame === 'undefined' || activeGame !== 'MAIN') return;
    const name = playerName();
    if (kind === 'word') { showDisturbingOverlay(dreadWord()); }
    else if (kind === 'whisper') {
        const L = ['Something behind you breathes in, and waits.', 'A chair creaks. You are standing.', name + '. It was said kindly.', 'The air in the room is warm where someone just was.', 'A coin rolls across the floor of another room.'];
        log(L[Math.floor(Math.random() * L.length)], 'text-gray-400 italic'); try { SFX.whisper(); } catch (e) {}
    } else if (kind === 'count') {
        const a = document.getElementById('live-txt'), b = document.getElementById('blank-txt');
        if (a && b) { const A = a.textContent, B = b.textContent; a.textContent = String((parseInt(B) || 0) + 1) + ' LIVE'; b.textContent = String(Math.max(0, (parseInt(A) || 1) - 1)) + ' BLANK'; try { SFX.glitch(); } catch (e) {} setTimeout(() => { a.textContent = A; b.textContent = B; }, 1100); }
    } else if (kind === 'black') {
        let o = document.getElementById('dread-black');
        if (!o) { o = document.createElement('div'); o.id = 'dread-black'; document.body.appendChild(o); }
        o.classList.add('on'); try { SFX.glitch(); } catch (e) {}
        setTimeout(() => o.classList.remove('on'), 700 + Math.random() * 500);
    } else if (kind === 'door') {
        log('Somewhere in the House a door closes. Softly. As if to be polite.', 'text-gray-500 italic'); try { SFX.thump(); } catch (e) {}
    } else if (kind === 'tenant') {
        const r = restlessTenants(); if (!r.length) return;
        const k = r[Math.floor(Math.random() * r.length)], p = TENANT_PERKS[k];
        log((typeof HOUSE_FOLK !== 'undefined' && HOUSE_FOLK[k] ? HOUSE_FOLK[k].name : k) + ' (from the House): ' + p.line, 'text-red-400 italic');
        if (typeof updateSanity === 'function') updateSanity(-2); else setSanityDirect(Math.max(0, sanity - 2));
        try { SFX.whisper(); } catch (e) {}
    }
}
const _tnStartRound = startRound;
startRound = function() {
    _tnStartRound();
    try {
        if (settings.lowfx) return;
        if (runIntrusions < 3 && Math.random() < intrusionChance()) { runIntrusions++; const k = dreadPick(); setTimeout(() => dreadIntrude(k), 700 + Math.random() * 1500); }
    } catch (e) {}
};

// ---------- the lobby: what the house is doing to your next run ----------
function phaseLabelText() {
    const P = PHASES[dayPhase()], a = nextRunSummary(), r = restlessTenants();
    return { head: P.name + '  ·  ' + P.sub, next: a.length ? 'WAITING FOR YOU: ' + a.join(', ') : '', warn: r.length ? (r.length === 1 ? 'A TENANT IS RESTLESS' : r.length + ' TENANTS ARE RESTLESS') : '' };
}
function updatePhaseLabel() {
    const el = document.getElementById('phase-label'); if (!el) return;
    const t = phaseLabelText();
    el.innerHTML = '';
    const mk = (cls, txt) => { if (!txt) return; const d = document.createElement('div'); d.className = cls; d.textContent = txt; el.appendChild(d); };
    mk('pl-head pl-' + dayPhase().toLowerCase(), t.head); mk('pl-next', t.next); mk('pl-warn', t.warn);
}
setInterval(() => { try { if (activeGame === 'MENU') updatePhaseLabel(); } catch (e) {} }, 20000);

// a few random lobby disturbances at night or when you are not well
const LOBBY_NOTES = ['SOMEONE IS IN THE HOUSE', 'THE WINDOW IS OPEN', 'YOU ARE BEING WATCHED', 'DO NOT LOOK AT THE COMPUTER', 'THE CAT IS STARING AT THE CORNER'];
function lobbyDread() {
    try {
        if (activeGame !== 'MENU' || settings.lowfx) return;
        const low = typeof sanity === 'number' && sanity <= 50;
        if (!(isNight() || low)) return;
        if (Math.random() > 0.35) return;
        let n = document.getElementById('dread-note');
        if (!n) { n = document.createElement('div'); n.id = 'dread-note'; document.body.appendChild(n); }
        n.textContent = Math.random() < 0.4 ? playerName().toUpperCase() : LOBBY_NOTES[Math.floor(Math.random() * LOBBY_NOTES.length)];
        n.classList.add('on'); try { SFX.whisper(); } catch (e) {}
        setTimeout(() => n.classList.remove('on'), 1800);
    } catch (e) {}
}
setInterval(lobbyDread, 45000);

// the lobby label follows the clock
const _tnShowMenu = showMenu;
showMenu = function() { _tnShowMenu.apply(this, arguments); try { updatePhaseLabel(); } catch (e) {} };
