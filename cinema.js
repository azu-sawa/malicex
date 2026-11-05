"use strict";

// =====================================================================
// CINEMA (Mu-delta): pixel cutscenes, memory flashes, fight cards,
// the CRT power-off death sequence and screen wipes.
// Art is drawn live on a 128x72 canvas and scaled up, so it costs no
// image files and stays sharp on any screen.
// =====================================================================
const CP = { bg: '#05070b', navy: '#0b1220', navy2: '#142038', cyan: '#38bdf8', amber: '#fbbf24', red: '#ef4444',
             bone: '#e2e8f0', gray: '#475569', dgray: '#1e293b', brown: '#3a2a1c', gold: '#d9a441' };

function cr(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function cc(g, cx, cy, r, c) {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}
function flick(t, s) { return 0.65 + 0.35 * Math.sin(t * (s || 9)) * Math.sin(t * 3.7 + 1); }

// head with a mask and two eyes. big=1 for close-ups.
function maskedFace(g, x, y, s, t, eye) {
    cr(g, x, y, 14 * s, 18 * s, CP.bone);
    cr(g, x + 2 * s, y + 18 * s, 10 * s, 2 * s, CP.bone);
    const blink = (Math.floor(t * 2.3) % 9 === 0);
    cr(g, x + 2 * s, y + 6 * s, 3 * s, blink ? 1 : 3 * s, eye || CP.red);
    cr(g, x + 9 * s, y + 6 * s, 3 * s, blink ? 1 : 3 * s, eye || CP.red);
    cr(g, x + 5 * s, y + 13 * s, 4 * s, 1 * s, CP.dgray);
}
function bust(g, x, y, s, c) {   // dark torso + head silhouette
    cr(g, x, y + 20 * s, 30 * s, 16 * s, c || CP.dgray);
    cr(g, x + 8 * s, y + 4 * s, 14 * s, 18 * s, c || CP.dgray);
}

const ART = {
    black(g, t) { cr(g, 0, 0, 128, 72, '#000'); const o = (Math.floor(t * 1.7) % 5) ? 1 : 0; if (o) { cr(g, 60, 34, 8, 3, CP.bone); cr(g, 63, 34, 2, 3, CP.red); } },
    moon(g, t) {
        cr(g, 0, 0, 128, 72, CP.navy); cc(g, 98, 17, 9, CP.bone); cc(g, 102, 15, 8, CP.navy);
        for (let i = 0; i < 40; i++) { const x = (i * 37 + Math.floor(t * 40)) % 128, y = (i * 53 + Math.floor(t * 70)) % 72; cr(g, x, y, 1, 3, '#27406a'); }
        cr(g, 0, 50, 128, 22, CP.bg);
        [[6, 34, 18], [28, 24, 16], [50, 40, 14], [72, 30, 20], [100, 38, 22]].forEach(([x, y, w], i) => {
            cr(g, x, y, w, 72 - y, CP.dgray);
            if (i % 2 === 0) cr(g, x + 4, y + 6, 3, 3, (Math.sin(t * 2 + i) > -0.6) ? CP.amber : CP.dgray);
        });
        cr(g, 0, 62, 128, 10, '#070a10');
    },
    door(g, t) {
        cr(g, 0, 0, 128, 72, CP.navy); cr(g, 0, 58, 128, 14, CP.bg);
        cr(g, 44, 10, 40, 50, CP.brown); cr(g, 48, 14, 32, 46, '#2a1d12');
        const f = flick(t, 6);
        cr(g, 63, 14, 2, 46, 'rgba(251,191,36,' + (0.35 + 0.5 * f) + ')');
        cr(g, 56, 36, 3, 3, CP.gold);
        cr(g, 20, 58, 88, 1, '#1b2740');
        const a = 0.06 + 0.1 * f; g.fillStyle = 'rgba(251,191,36,' + a + ')'; g.beginPath(); g.moveTo(63, 60); g.lineTo(30, 72); g.lineTo(98, 72); g.closePath(); g.fill();
    },
    table(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg);
        const f = flick(t, 11);
        g.fillStyle = 'rgba(251,191,36,' + (0.05 + 0.07 * f) + ')'; g.beginPath(); g.arc(30, 38, 34, 0, 6.3); g.fill();
        cr(g, 0, 50, 128, 22, CP.brown); cr(g, 0, 50, 128, 2, '#4d3824');
        cr(g, 29, 34, 3, 14, CP.bone); cr(g, 29 + 1, 30 - (f > 0.8 ? 1 : 0), 1, 4, CP.amber); cr(g, 30, 32, 1, 2, CP.red);
        cr(g, 62, 44, 10, 14, CP.bone); cr(g, 76, 46, 10, 14, CP.bone); cr(g, 64, 47, 3, 3, CP.red); cr(g, 78, 49, 3, 3, CP.dgray);
        cr(g, 94, 52, 28, 2, CP.gray); cr(g, 118, 50, 6, 5, CP.brown);
        bust(g, 82, 4, 1.4, CP.dgray); maskedFace(g, 92, 10, 1, t);
    },
    dealer(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg);
        g.fillStyle = 'rgba(239,68,68,' + (0.04 + 0.04 * flick(t, 5)) + ')'; g.beginPath(); g.arc(64, 30, 40, 0, 6.3); g.fill();
        cr(g, 20, 44, 88, 28, CP.dgray); cr(g, 36, 22, 56, 26, CP.dgray);
        maskedFace(g, 54, 14, 1.6, t);
    },
    pocket(g, t) {
        cr(g, 0, 0, 128, 72, CP.navy); cr(g, 14, 20, 100, 52, CP.dgray); cr(g, 40, 8, 48, 18, CP.bg); cr(g, 44, 12, 40, 14, '#05070b');
        const hx = 64, hy = 42 - Math.round(Math.sin(t * 1.5) * 1.5);
        cc(g, hx, hy, 15, CP.gold); cc(g, hx, hy, 12, CP.bone);
        const a = t * 2.4; cr(g, hx + Math.cos(a) * 8, hy + Math.sin(a) * 8, 2, 2, CP.dgray); cr(g, hx, hy - 6, 2, 6, CP.dgray);
        cr(g, hx - 1, hy - 18, 3, 4, CP.gold);
        cr(g, 6, 46, 18, 3, CP.gray); cc(g, 104, 58, 4, CP.amber);
    },
    portrait(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 24, 6, 80, 60, CP.gold); cr(g, 27, 9, 74, 54, '#241a10');
        [[34, 'a'], [58, 'b'], [82, 'c']].forEach(([x, k], i) => {
            const h = k === 'c' ? 20 : 26;
            cr(g, x, 63 - h - 16, 12, 12, '#8a7455'); cr(g, x - 4, 63 - h - 4, 20, h + 4, '#3b3f4d');
        });
        const s = Math.floor(t * 3) % 4;
        for (let i = 0; i < 8; i++) { cr(g, 58 + i, 28 + i, 1, 1, CP.red); cr(g, 69 - i, 28 + i, 1, 1, CP.red); }
        if (s === 0) cr(g, 50, 30, 28, 1, 'rgba(239,68,68,.5)');
    },
    gun(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 52, 128, 20, CP.brown);
        for (let i = 0; i < 4; i++) { cr(g, 14 + i * 24, 40 - i * 4, 40, 3, CP.gray); cr(g, 14 + i * 24, 43 - i * 4, 40, 2, '#2b3446'); }
        cr(g, 8, 46, 30, 8, CP.brown); cr(g, 104, 36, 10, 14, '#2b3446');
        [[24, CP.red], [32, CP.cyan], [40, CP.red]].forEach(([x, c], i) => { cr(g, 20 + i * 12, 58, 6, 10, c); cr(g, 20 + i * 12, 58, 6, 2, CP.gold); });
        const f = flick(t, 7); g.fillStyle = 'rgba(56,189,248,' + (0.03 + 0.04 * f) + ')'; g.fillRect(0, 0, 128, 72);
    },
    cards(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg);
        for (let i = 0; i < 5; i++) {
            const x = 28 + i * 14 + Math.round(Math.sin(t + i) * 1), y = 24 - Math.abs(2 - i) * 3;
            cr(g, x, y, 22, 32, CP.bone); cr(g, x + 3, y + 3, 5, 5, i % 2 ? CP.red : CP.dgray); cr(g, x + 14, y + 24, 5, 5, i % 2 ? CP.red : CP.dgray);
        }
    },
    stairs(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg);
        for (let i = 0; i < 12; i++) {
            const w = 100 - i * 7, x = 64 - w / 2, y = 6 + i * 5;
            cr(g, x, y, w, 4, i % 2 ? '#1a2540' : '#101a30'); cr(g, x, y + 4, w, 1, '#2b3a5c');
        }
        const f = flick(t, 4); cr(g, 58, 60, 12, 8, 'rgba(239,68,68,' + (0.2 + 0.5 * f) + ')');
    },
    clock(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cc(g, 64, 36, 30, CP.gray); cc(g, 64, 36, 27, CP.bone);
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; cr(g, 64 + Math.cos(a) * 23, 36 + Math.sin(a) * 23, 2, 2, CP.dgray); }
        const a1 = t * 0.6 - 1.57, a2 = t * 7.2 - 1.57;
        for (let k = 0; k < 20; k++) cr(g, 64 + Math.cos(a1) * k, 36 + Math.sin(a1) * k, 2, 2, CP.dgray);
        for (let k = 0; k < 24; k++) cr(g, 64 + Math.cos(a2) * k, 36 + Math.sin(a2) * k, 1, 1, CP.red);
    },
    sunrise(g, t) {
        const bands = ['#0b1220', '#13203a', '#2a2f4e', '#5a3b52', '#a8553f', '#e08a3d', '#fbbf24'];
        bands.forEach((c, i) => cr(g, 0, i * 7, 128, 8, c));
        const rise = Math.min(1, t / 8); cc(g, 64, 56 - rise * 14, 12, '#fde68a');
        cr(g, 0, 50, 128, 22, CP.bg); cr(g, 0, 50, 128, 1, '#2a2f4e');
        const x = 20 + ((t * 4) % 90); cr(g, x, 36, 4, 6, CP.bg); cr(g, x + 1, 32, 3, 4, CP.bg); cr(g, x, 42, 1, 8, CP.bg); cr(g, x + 3, 42, 1, 8, CP.bg);
    },
    mirror(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 34, 4, 60, 64, CP.gold); cr(g, 38, 8, 52, 56, '#0a1424');
        bust(g, 44, 12, 1, '#1a2742'); const d = Math.round(Math.sin(t * 0.8) * 2);
        cr(g, 56 + d, 18, 14, 18, '#8aa0c4'); cr(g, 58 + d, 24, 3, 3, CP.red); cr(g, 65 + d, 24, 3, 3, CP.red);
        if (Math.floor(t * 0.5) % 4 === 3) cr(g, 40, 10, 48, 2, 'rgba(226,232,240,.35)');
    },
    chair(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 56, 128, 16, CP.brown);
        g.fillStyle = 'rgba(251,191,36,' + (0.05 + 0.05 * flick(t, 3)) + ')'; g.beginPath(); g.arc(64, 32, 36, 0, 6.3); g.fill();
        cr(g, 48, 14, 32, 6, CP.dgray); cr(g, 50, 14, 4, 42, CP.dgray); cr(g, 74, 14, 4, 42, CP.dgray); cr(g, 46, 38, 36, 6, '#2b3446');
        cr(g, 50, 44, 3, 14, CP.dgray); cr(g, 75, 44, 3, 14, CP.dgray);
        cr(g, 57, 20, 14, 16, CP.bone); cr(g, 59, 25, 3, 3, CP.dgray); cr(g, 66, 25, 3, 3, CP.dgray);
    },
    hands(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 44, 128, 28, CP.brown);
        const b = Math.round(Math.sin(t * 2) * 1);
        cr(g, 26, 34 + b, 28, 12, '#c8a98c'); cr(g, 74, 34 - b, 28, 12, '#c8a98c');
        for (let i = 0; i < 4; i++) { cr(g, 28 + i * 6, 28 + b, 4, 8, '#c8a98c'); cr(g, 76 + i * 6, 28 - b, 4, 8, '#c8a98c'); }
        cr(g, 54, 40, 20, 2, CP.dgray);
    }
};

// ---------- scripts ----------
const CINE_LIST = [
    ['intro_thief', 'THE OPEN DOOR', 'Thief intro'], ['intro_parricide', 'THE SCRATCHED PHOTO', 'Parricide intro'],
    ['first_win', 'THE SAME ROOM', 'Your first win'], ['first_death', 'THE FORM', 'Your first death'],
    ['boss_devil', 'HE LETS YOU', 'The Devil'], ['boss_ancient', 'BEFORE THE HOUSE', 'The Ancient'], ['boss_first', 'THE WARM CHAIR', 'The last table'],
    ['end_mercy', 'THE QUIET EXIT', 'Ending'], ['end_madness', "THE DEALER'S CHAIR", 'Ending'], ['end_clean', 'CLEAN HANDS', 'Ending'], ['end_daybreak', 'DAYBREAK', 'Ending'],
    ['end_heist', 'THE HEIST', 'Thief secret ending'], ['end_inherit', 'THE INHERITANCE', 'Parricide secret ending'],
    ['underside_in', 'THE STAIR', 'The Underside'], ['underside_out', 'THE FLOOR BELOW', 'The Underside']
];
const CINE_SCRIPTS = {
    intro_thief: { shots: [
        { art: 'moon', text: ['The rent was three months late.', 'Your landlord had stopped knocking. That was worse.'] },
        { art: 'door', text: ['The door at the end of Calder Street was unlocked.', 'Nobody leaves a door unlocked in this city.'] },
        { art: 'table', text: ['Inside: one table, one candle, a shotgun, and a pile of cash nobody was guarding.'] },
        { art: 'dealer', text: ['"Sit," said someone who was already sitting.', '"Take what you like, {name}. Everyone does. Then we play."'] },
        { art: 'black', text: ['You had not told him your name.', 'You decided that was not the problem.'] }] },
    intro_parricide: { shots: [
        { art: 'portrait', text: ['The photo was still in your coat. Three faces.', 'One of them was scratched out with a key.'] },
        { art: 'moon', text: ['Eleven nights you followed him.', 'Always the same street. Always the same door.'] },
        { art: 'door', text: ['He never came out before sunrise.', 'Tonight you did not wait for him to come out.'] },
        { art: 'table', text: ['A card room. A candle. A man at the far end, in the dealer\'s chair.'] },
        { art: 'dealer', text: ['He wore a mask. You knew how he held the cards anyway.', '"You came a long way to ask me something," he said. It was not his voice. It was exactly his voice.'] }] },
    first_win: { shots: [
        { art: 'door', text: ['You won. The door opens.', 'It opens onto the same room.'] },
        { art: 'black', text: ['"Did you think winning was leaving?" says the house.', '"Winning is how you get invited back."'] }] },
    first_death: { shots: [
        { art: 'black', text: ['Dying here is not an ending.', 'It is a form you fill in.'] },
        { art: 'mirror', text: ['{name}. {time}.', 'Again?'] }] },
    boss_devil: { shots: [
        { art: 'cards', text: ['The Devil never cheats.', 'He lets you think you can.'] },
        { art: 'dealer', text: ['"Ten seconds a turn," he says. "I have waited ten thousand years. I can wait ten seconds."'] }] },
    boss_ancient: { shots: [
        { art: 'stairs', text: ['Before the house there was a table.', 'Before the table there was someone who wanted to be asked to sit.'] },
        { art: 'clock', text: ['"You count the shells," says the Ancient. "I counted the people."'] }] },
    boss_first: { shots: [
        { art: 'chair', text: ['The last table is the first table.', 'The chair is already warm.'] },
        { art: 'mirror', text: ['Someone is sitting in it.', 'He has your hands.'] }] },
    end_mercy: { shots: [
        { art: 'dealer', text: ['You never aimed.', 'He lowered the mask first.'] },
        { art: 'door', text: ['The door opened without a sound.', 'Behind you, the chair stayed empty. For now.'] }] },
    end_madness: { shots: [
        { art: 'mirror', text: ['The mask fits.', 'You only meant to hold it.'] },
        { art: 'chair', text: ['The next player sits down.', 'Your hands already know how to deal.'] }] },
    end_clean: { shots: [
        { art: 'hands', text: ['Not one shell touched you.', 'You check your hands for blood and find none.'] },
        { art: 'black', text: ['That is the part that stays with you.'] }] },
    end_daybreak: { shots: [
        { art: 'door', text: ['You walk out bleeding.'] },
        { art: 'sunrise', text: ['The sun feels like it belongs to someone else.', 'You keep walking anyway.'] }] },
    end_heist: { shots: [
        { art: 'pocket', text: ['You count it on the walk home.', 'Five things, from five different hands.'] },
        { art: 'table', text: ['He watched you take every one.', 'He pushed your chair in after you, politely.'] },
        { art: 'door', text: ['The door opened before you reached it.'] },
        { art: 'pocket', text: ['On the street there is a sixth thing in your pocket.', 'You did not take it. It is a card.', 'It says: SAME TIME TOMORROW.'] },
        { art: 'black', text: ['You are going back. You know you are.', 'A thief always returns to the only place that let him in.'] }] },
    end_inherit: { shots: [
        { art: 'dealer', text: ['The last shell. The mask comes off the way a plate comes off a table.'] },
        { art: 'portrait', text: ['The face is the one you scratched out of the photograph.', 'He is older than the photograph. He smiles at exactly the right moment.'] },
        { art: 'mirror', text: ['"Good," he says. "I wanted you to be able to."', 'In the mirror behind his chair you are already wearing his coat.'] },
        { art: 'chair', text: ['The next person to walk in will find you dealing.', 'They will think you were always here.', 'That was the inheritance.'] }] },
    underside_in: { shots: [
        { art: 'chair', text: ['There is a stair under the last table.', 'It was always there. You just never needed to look down.'] },
        { art: 'stairs', text: ['The ones who built the house keep their guests below.', 'The house was only the lobby.'] }] },
    underside_out: { shots: [
        { art: 'clock', text: ['The Host takes off nothing. There is nothing to take off.', '"You came all this way," he says, "to find out the house has a basement."'] },
        { art: 'sunrise', text: ['You climb out into a morning that looks the same as the others.', 'You will not trust a morning again.'] }] }
};

// ---------- engine ----------
// cutscenes that belong to the other sin can never be seen on this save
function cineList() {
    const other = storyMode === 'THIEF' ? ['intro_parricide', 'end_inherit'] : ['intro_thief', 'end_heist'];
    return CINE_LIST.filter(c => !other.includes(c[0]));
}

const CINE = { on: false, raf: 0, g: null, art: 'black', t0: 0, shot: 0, line: 0, typing: null, script: null, done: null, opts: null, last: 0 };

function cineEl(id) { return document.getElementById(id); }

function cinePlay(id, done, opts) {
    const sc = CINE_SCRIPTS[id];
    const scr = cineEl('cine-screen');
    if (!sc || !scr || CINE.on) { if (done) done(); return; }
    meta.cineSeen = meta.cineSeen || {};
    const first = !meta.cineSeen[id];
    meta.cineSeen[id] = 1;
    if (cineList().every(c => meta.cineSeen[c[0]])) unlockAchievement('CINEMA_ALL');
    CINE.on = true; CINE.script = sc; CINE.done = done; CINE.opts = opts || {}; CINE.shot = -1; CINE.id = id;
    const cv = cineEl('cine-canvas'); CINE.g = cv.getContext('2d'); CINE.g.imageSmoothingEnabled = false;
    scr.classList.remove('hidden');
    cineEl('cine-skip').classList.toggle('hidden', first && !CINE.opts.replay && false);
    Music.setScene('cine');
    CINE.t0 = performance.now();
    cineNextShot();
    CINE.last = 0;
    cancelAnimationFrame(CINE.raf);
    const loop = ts => {
        if (!CINE.on) return;
        if (ts - CINE.last > 66) { CINE.last = ts; const t = (performance.now() - CINE.t0) / 1000; try { ART[CINE.art](CINE.g, t); } catch (e) {} }
        CINE.raf = requestAnimationFrame(loop);
    };
    CINE.raf = requestAnimationFrame(loop);
    saveGame();
}

function cineNextShot() {
    const sc = CINE.script;
    CINE.shot++;
    if (CINE.shot >= sc.shots.length) return cineEnd();
    const sh = sc.shots[CINE.shot];
    const stage = cineEl('cine-stage');
    stage.classList.add('cut');
    setTimeout(() => stage.classList.remove('cut'), 240);
    CINE.art = sh.art; CINE.t0 = performance.now();
    CINE.line = -1;
    cineEl('cine-text').innerHTML = '';
    cineEl('cine-count').textContent = (CINE.shot + 1) + ' / ' + sc.shots.length;
    setTimeout(cineNextLine, 260);
}

function cineNextLine() {
    if (!CINE.on) return;
    const sh = CINE.script.shots[CINE.shot];
    CINE.line++;
    if (CINE.line >= sh.text.length) return cineNextShot();
    const full = psychFillCine(sh.text[CINE.line]);
    const box = cineEl('cine-text');
    const p = document.createElement('p');
    p.className = 'cine-line';
    box.appendChild(p);
    let i = 0;
    clearInterval(CINE.typing);
    CINE.full = full; CINE.p = p;
    CINE.typing = setInterval(() => {
        i++;
        p.textContent = full.slice(0, i);
        if (i % 3 === 0 && settings.haptics !== false) { try { tone(900 + (i % 5) * 60, 'triangle', 0.012, 0.025); } catch (e) {} }
        if (i >= full.length) { clearInterval(CINE.typing); CINE.typing = null; }
    }, 26);
}

function psychFillCine(t) { return (typeof psychFill === 'function') ? psychFill(t) : t; }

function cineAdvance() {
    if (!CINE.on) return;
    if (CINE.typing) { clearInterval(CINE.typing); CINE.typing = null; CINE.p.textContent = CINE.full; return; }
    cineNextLine();
}

function cineEnd() {
    clearInterval(CINE.typing); CINE.typing = null;
    cancelAnimationFrame(CINE.raf);
    CINE.on = false;
    cineEl('cine-screen').classList.add('hidden');
    saveGame();
    if (CINE.opts && CINE.opts.restore) Music.setScene(CINE.opts.restore);
    const d = CINE.done; CINE.done = null;
    if (d) d();
}

function cineSkip() { if (CINE.on) cineEnd(); }

document.addEventListener('keydown', e => {
    if (!CINE.on) return;
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); e.stopImmediatePropagation(); cineAdvance(); }
    else if (e.key === 'Escape') cineSkip();
}, true);

// first time only
function cineOnce(id, done, opts) {
    if ((meta.cineSeen || {})[id]) { if (done) done(); return; }
    cinePlay(id, done, opts);
}

// ---------- intro replaces the old text crawl ----------
playCutscene = function() {
    activeGame = 'CUTSCENE';
    document.getElementById('main-menu').classList.add('hidden');
    cinePlay(storyMode === 'THIEF' ? 'intro_thief' : 'intro_parricide', () => endIntro());
};

// ---------- boss intros ----------
const _cineBeginRun = beginRun;
beginRun = function() {
    const id = { BOSS: 'boss_devil', ANCIENT: 'boss_ancient', FINALE: 'boss_first' }[currentDifficulty];
    const go = () => screenWipe(() => _cineBeginRun());
    if (id) cineOnce(id, go); else go();
};

// ---------- fight cards (shown on the first round of each fight) ----------
const _cineStartRound = startRound;
startRound = function() {
    const key = currentDealerPersonality + ':' + (state.gauntlet ? state.gauntlet.stage : 0);
    if (state.round === 1 && state.cardKey !== key && activeGame === 'MAIN' && !(state.playerHp <= 0 || state.dealerHp <= 0)) {
        state.cardKey = key;
        const d = DEALER_PERSONALITIES[currentDealerPersonality];
        const n = state.gauntlet ? 'STAGE ' + (state.gauntlet.stage + 1) + ' / ' + state.gauntlet.total : modeLabel(currentDifficulty);
        cineCard(n, d.name.toUpperCase(), 1100);
    }
    _cineStartRound();
};

function cineCard(title, sub, ms) {
    const c = cineEl('fight-card');
    if (!c || settings.lowfx) return;
    cineEl('fc-title').textContent = title;
    cineEl('fc-sub').textContent = sub;
    c.classList.remove('hidden', 'out'); void c.offsetWidth;
    c.classList.add('in');
    setTimeout(() => { c.classList.add('out'); setTimeout(() => { c.classList.add('hidden'); c.classList.remove('in', 'out'); }, 300); }, ms || 1000);
}

// ---------- memory flash (a few lines on black, mid-run) ----------
function cineFlash(lines, done) {
    const f = cineEl('flash-screen');
    if (!f || CINE.on) { if (done) done(); return; }
    const box = cineEl('flash-text');
    box.innerHTML = '';
    f.classList.remove('hidden');
    SFX.thump();
    let i = 0, ended = false;
    const finish = () => { if (ended) return; ended = true; f.classList.add('hidden'); f.onclick = null; if (done) done(); };
    const next = () => {
        if (ended) return;
        if (i >= lines.length) return setTimeout(finish, 900);
        const p = document.createElement('p'); p.textContent = psychFillCine(lines[i++]); box.appendChild(p);
        setTimeout(next, 1700);
    };
    f.onclick = finish;
    next();
}

// ---------- screen wipe ----------
function screenWipe(cb, ms) {
    const w = cineEl('wipe');
    if (!w || settings.lowfx) { cb(); return; }
    ms = ms || 320;
    w.classList.remove('hidden'); w.style.transition = 'none'; w.style.opacity = 0; void w.offsetWidth;
    w.style.transition = 'opacity ' + ms + 'ms linear'; w.style.opacity = 1;
    setTimeout(() => {
        cb();
        setTimeout(() => { w.style.opacity = 0; setTimeout(() => w.classList.add('hidden'), ms); }, 60);
    }, ms);
}

const _cineReturn = returnToMenu;
returnToMenu = function() { screenWipe(() => _cineReturn()); };

// ---------- CRT power-off death ----------
function deathSequence(done) {
    const d = cineEl('crt-off');
    if (!d) { done(); return; }
    const quick = settings.lowfx;
    const lines = ['{name}.', 'It is {time}.', 'The house is still open.'];
    const txt = cineEl('crt-off-text');
    txt.textContent = '';
    d.classList.remove('hidden', 'run');
    void d.offsetWidth;
    if (!quick) d.classList.add('run');
    try { tone(1000, 'sine', 1.6, 0.05); } catch (e) {}
    let over = false;
    const fin = () => { if (over) return; over = true; d.classList.add('hidden'); d.classList.remove('run'); d.onclick = null; done(); };
    d.onclick = fin;
    setTimeout(() => { if (over) return; txt.textContent = psychFillCine(lines[Math.floor(Math.random() * lines.length)]); }, quick ? 100 : 1400);
    setTimeout(fin, quick ? 900 : 3400);
}

// ---------- gallery ----------
function renderCinemaBox() {
    const box = cineEl('cinema-box');
    if (!box) return;
    const seen = meta.cineSeen || {};
    const L = cineList(), n = L.filter(c => seen[c[0]]).length;
    box.innerHTML = `<div class="contracts-title">CINEMA ${n}/${L.length}</div>` +
        `<div class="cine-grid">` + L.map(c => seen[c[0]]
            ? `<button class="cine-item" onclick="replayCine('${c[0]}')"><b>${c[1]}</b><span>${c[2]}</span></button>`
            : `<div class="cine-item locked"><b>? ? ?</b><span>Not seen yet</span></div>`).join('') + `</div>`;
}

function replayCine(id) {
    document.getElementById('main-menu').classList.add('hidden');
    cinePlay(id, () => { showMenu(); }, { replay: true });
}

// which cutscene follows a win (null = none)
function winCineId() {
    if (state.sinEnding) return state.sinEnding === 'HEIST' ? 'end_heist' : 'end_inherit';
    if (state.underside) return 'underside_out';
    if (state.endingId && ['MERCY', 'MADNESS', 'CLEAN', 'DAYBREAK'].includes(state.endingId)) return 'end_' + state.endingId.toLowerCase();
    if (state.underside) return 'underside_out';
    return 'first_win';
}
