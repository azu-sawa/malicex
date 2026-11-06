"use strict";

// =====================================================================
// THE HOUSE: a walkable top-down pixel room set. 320x208 canvas, 16px tiles,
// everything drawn live with fillRect (no image files).
//   HALL      hub: table, market, archive, radio, mirror, notice board
//   ARCADE    the four side-table machines + a jukebox that changes the BGM
//   CORRIDOR  the dealers. Talk to them. They remember you.
//   CELLAR    needs the Brass Key (Black Market, Marks). The Architect.
// Controls: arrows / WASD, E or Space or Enter = interact, Esc = leave.
// Touch: on-screen D-pad + A. The room darkens as your Sanity falls and at
// 25 or less something stands in the hall that was not there before.
// =====================================================================
const HS = { on: false, raf: 0, last: 0, map: 'HALL', x: 0, y: 0, dir: 'down', walk: 0, keys: {}, pad: {}, near: null, dlg: null,
             cool: 0, flash: 0, ghost: null, ghostT: 6, step: 0, t: 0, msg: '', msgT: 0 };
let houseReturn = false;
const TILE = 16, MW = 20, MH = 13;

function hsData() { meta.house = meta.house || { talk: {}, pick: {}, seen: {} }; return meta.house; }
function hsDay() { return new Date().toDateString(); }

// ---------- maps ----------
const HOUSE_MAPS = {
    HALL: { name: 'THE HALL', floor: ['#241a14', '#2a1f18'], wall: '#14110f', trim: '#7c5a3a',
        objs: [
            { t: 'portal', x: 0, y: 6, w: 1, h: 2, to: 'ARCADE', sx: 17, sy: 7 },
            { t: 'portal', x: 19, y: 6, w: 1, h: 2, to: 'CORRIDOR', sx: 2, sy: 7 },
            { t: 'portal', x: 9, y: 12, w: 2, h: 1, to: 'CELLAR', sx: 9, sy: 3, lock: 'brassKey' },
            { t: 'portal', x: 4, y: 12, w: 2, h: 1, to: 'EXIT' },
            { t: 'shelf', x: 3, y: 0, w: 2, h: 2, solid: 1, act: 'archive', label: 'THE ARCHIVE' },
            { t: 'stall', x: 7, y: 0, w: 3, h: 2, solid: 1, act: 'market', label: 'BLACK MARKET' },
            { t: 'board', x: 11, y: 0, w: 2, h: 2, solid: 1, act: 'board', label: 'NOTICE BOARD' },
            { t: 'radio', x: 14, y: 0, w: 2, h: 2, solid: 1, act: 'radio', label: 'THE RADIO' },
            { t: 'mirror', x: 17, y: 0, w: 2, h: 2, solid: 1, act: 'mirror', label: 'MIRROR' },
            { t: 'table', x: 8, y: 5, w: 4, h: 3, solid: 1, act: 'table', label: 'SIT DOWN' },
            { t: 'coin', x: 3, y: 10, w: 1, h: 1, id: 'hall1', amt: 60, label: 'COIN' },
            { t: 'coin', x: 16, y: 10, w: 1, h: 1, id: 'hall2', amt: 90, label: 'COIN' }] },
    ARCADE: { name: 'THE ARCADE', floor: ['#14122a', '#1a1738'], wall: '#0a0918', trim: '#38bdf8',
        objs: [
            { t: 'portal', x: 19, y: 6, w: 1, h: 2, to: 'HALL', sx: 1, sy: 7 },
            { t: 'cab', x: 2, y: 0, w: 2, h: 2, solid: 1, act: 'bj', label: 'BLACKJACK', c: '#22c55e' },
            { t: 'cab', x: 5, y: 0, w: 2, h: 2, solid: 1, act: 'slots', label: 'SLOTS', c: '#ef4444' },
            { t: 'cab', x: 8, y: 0, w: 2, h: 2, solid: 1, act: 'cups', label: 'CUPS', c: '#fbbf24' },
            { t: 'cab', x: 11, y: 0, w: 2, h: 2, solid: 1, act: 'hilo', label: 'HI-LO', c: '#38bdf8' },
            { t: 'jukebox', x: 15, y: 0, w: 2, h: 2, solid: 1, act: 'juke', label: 'JUKEBOX' },
            { t: 'npc', who: 'CUSTODIAN', x: 12, y: 8, w: 1, h: 1, solid: 1, act: 'talk', label: 'THE CUSTODIAN' },
            { t: 'coin', x: 4, y: 9, w: 1, h: 1, id: 'arc1', amt: 70, label: 'COIN' }] },
    CORRIDOR: { name: "DEALERS' ROW", floor: ['#2a0f14', '#32141a'], wall: '#12080a', trim: '#b45309',
        objs: [
            { t: 'portal', x: 0, y: 6, w: 1, h: 2, to: 'HALL', sx: 18, sy: 7 },
            { t: 'npc', who: 'SADISTIC', x: 3, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'CALCULATING', x: 7, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'UNPREDICTABLE', x: 11, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'ANCIENT', x: 15, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'MIMIC', x: 4, y: 9, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'WARDEN', x: 9, y: 9, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'FIRST', x: 15, y: 9, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'coin', x: 17, y: 6, w: 1, h: 1, id: 'cor1', amt: 80, label: 'COIN' }] },
    CELLAR: { name: 'THE CELLAR', floor: ['#10151c', '#141b24'], wall: '#080a0e', trim: '#475569', dark: 1,
        objs: [
            { t: 'portal', x: 9, y: 1, w: 2, h: 1, to: 'HALL', sx: 9, sy: 10 },
            { t: 'npc', who: 'ARCHITECT', x: 9, y: 6, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'COLLECTOR', x: 2, y: 10, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'CONFESSOR', x: 7, y: 10, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'CLOCKWORK', x: 12, y: 10, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'HOST', x: 17, y: 10, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'chest', x: 3, y: 8, w: 2, h: 1, solid: 1, act: 'chest', label: 'OLD CHEST' },
            { t: 'desk', x: 14, y: 8, w: 3, h: 1, solid: 1, act: 'ledger', label: 'THE LEDGER' },
            { t: 'torch', x: 4, y: 2, w: 1, h: 1, solid: 1 }, { t: 'torch', x: 15, y: 2, w: 1, h: 1, solid: 1 }] }
};

// ---------- the people and what they say ----------
// piece k opens when: need 0 = always, 'beat' = you have beaten them (or won enough runs), 'cellar' = you own the Brass Key
const HOUSE_FOLK = {
    SADISTIC: { name: 'THE SADIST', coat: '#9f1239', trim: '#f43f5e', look: 'grin',
        pieces: [
            { need: 0, t: ['"Sit. Sit. You are shaking already."', '"People think I enjoy the pain. Backwards. I enjoy the moment just before it. The hand, hovering."'] },
            { need: 'beat', t: ['"You beat me. Good. Most people only make me hungrier."', '"A word, since you earned it: when I hold a Saw I am not bluffing. Make me spend it on a blank. Cuff me before I use it twice."'] },
            { need: 'beat', t: ['"I was a nurse once. Or a patient. The house keeps changing which."'] },
            { need: 'cellar', t: ['"Everyone below got one want. Mine was to be noticed."', '"Hurting people was the cheapest way I could afford."'] }] },
    CALCULATING: { name: 'THE CALCULATOR', coat: '#1e3a8a', trim: '#60a5fa', look: 'glass',
        pieces: [
            { need: 0, t: ['"Your odds are forty-one percent. Do not ask which odds."', '"I count every shell you have seen. It is not a hobby. It is a leash."'] },
            { need: 'beat', t: ['"My math only works on shells I can count. An Inverter ruins it. Use it when I am sure."', '"And if I am ahead, cuff me. A man who cannot act cannot calculate."'] },
            { need: 'beat', t: ['"I audited this house once. The books were perfect. They offered me a seat instead of a letter."'] },
            { need: 'cellar', t: ['"There is a number the Architect never shows you. How many guests ever left."', '"I know it. It is small enough to say with one hand."'] }] },
    UNPREDICTABLE: { name: 'THE MADMAN', coat: '#581c87', trim: '#c084fc', look: 'wild',
        pieces: [
            { need: 0, t: ['"Hee! Heads, tails, or the other one?"', '"Do not read me. I do not read me."'] },
            { need: 'beat', t: ['"Honest tip, because you made me laugh: I flip a coin every turn, but when the live shells run low even I get careful."', '"Count the chamber, not my face."'] },
            { need: 'beat', t: ['"I was not mad before. I was the only one counting backwards."'] },
            { need: 'cellar', t: ['"The Architect laughs at my jokes."', '"That is how I know he is real. Nobody else does."'] }] },
    ANCIENT: { name: 'THE ANCIENT', coat: '#44403c', trim: '#a8a29e', look: 'hood',
        pieces: [
            { need: 0, t: ['"You walk like someone expecting the floor to hold."', '"It does. That is the cruel part."'] },
            { need: 'beat', t: ['"I hit hardest early and I have a great deal of life. Bring Shields and Cigarettes."', '"Patience beats me. Speed never has."'] },
            { need: 'beat', t: ['"I counted the people. I stopped at one hundred and twelve."', '"Not because it was enough. Because I wanted to stop counting."'] },
            { need: 'cellar', t: ['"Before the house there was a table. Before the table, a man who wanted to be asked to sit."', '"He asked the Architect. That was the first mistake. The second was saying yes."'] }] },
    MIMIC: { name: 'THE MIMIC', coat: '#0e7490', trim: '#67e8f9', look: 'blank',
        pieces: [
            { need: 0, t: ['"Hello. Hello."', '(It says it the way you did, just now. Same pause.)'] },
            { need: 'beat', t: ['"I copy the last thing you used. So do not open with your best item."', '"Feed me something cheap first. Then spend what matters."'] },
            { need: 'beat', t: ['"I learned to talk by listening. You say please a lot."'] },
            { need: 'cellar', t: ['"The dealer before me left a mask on the chair."', '"I thought it was a face. It fit anyway."'] }] },
    WARDEN: { name: 'THE WARDEN', coat: '#14532d', trim: '#4ade80', look: 'cap',
        pieces: [
            { need: 0, t: ['"No talking."', '"... Ten seconds a turn. That is not a threat. That is a courtesy."'] },
            { need: 'beat', t: ['"Armor first, rounds later. Handcuffs make me lose a turn. I hate it."', '"So will you, if you forget them."'] },
            { need: 'beat', t: ['"I guard something. I forgot what. The door at the bottom of the hall says CELLAR."'] },
            { need: 'cellar', t: ['"The key is not sold for money. Marks are what the house keeps of you."', '"It is only fair you spend them before it does."'] }] },
    FIRST: { name: 'THE FIRST PLAYER', coat: '#e2e8f0', trim: '#fbbf24', look: 'gold',
        pieces: [
            { need: 0, t: ['"You are late. Not to the game. To this chair."', '"It is warm. Somebody was just here. You know who."'] },
            { need: 'beat', t: ['"You sat where I sat. That does not make you me."', '"It makes you the next place I can sit."'] },
            { need: 'beat', t: ['"I was the first to win. The prize was a longer evening."'] },
            { need: 'cellar', t: ['"He built the table because he was lonely. I was lonely too. I filled it."', '"Be kinder to the next one than we were to each other."'] }] },
    COLLECTOR: { name: 'THE COLLECTOR', coat: '#78350f', trim: '#fbbf24', look: 'cap',
        pieces: [
            { need: 0, t: ['"Mine now. Do not look so hurt. You were not using it."', '"Everything ends up in a drawer. Eventually that includes the drawer."'] },
            { need: 'beat', t: ['"I take what you hold most carelessly. Hold your best item loosely, and I will take that instead of the one you need."'] },
            { need: 'beat', t: ['"My first piece was a button. The rest is just a long way of saying I miss the coat."'] }] },
    CONFESSOR: { name: 'THE CONFESSOR', coat: '#312e81', trim: '#a5b4fc', look: 'hood',
        pieces: [
            { need: 0, t: ['"Tell me what you did. Say it out loud."', '"I forgive you. I always do. That is how I get you to talk."'] },
            { need: 'beat', t: ['"I trade in guilt, and guilt is only sanity in a nicer coat. Keep yours high before you sit with me."'] },
            { need: 'beat', t: ['"I have heard every sin in this building. Yours are the least original. That is why they sting."'] }] },
    CLOCKWORK: { name: 'THE CLOCKWORK', coat: '#374151', trim: '#9ca3af', look: 'glass',
        pieces: [
            { need: 0, t: ['"Tick. Tock. On time. Always on time."', '"You are running late. You have been late since the day you were born."'] },
            { need: 'beat', t: ['"My rhythm is a trap. The same turn order, every cycle. Break it once, with a Cuff, and I spend a full cycle recovering."'] },
            { need: 'beat', t: ['"I was built to keep one appointment. I do not remember with whom."'] }] },
    HOST: { name: 'THE HOST', coat: '#000000', trim: '#e2e8f0', look: 'blank',
        pieces: [
            { need: 0, t: ['"Welcome to the part we do not show."', '"Make yourself uncomfortable. It is the only way to feel at home."'] },
            { need: 'beat', t: ['"The house has a basement. I live in it. You paid to come down here, remember?"'] },
            { need: 'beat', t: ['"There is no third floor. I checked. I checked for a very long time."'] }] },
    ARCHITECT: { name: 'THE ARCHITECT', coat: '#111827', trim: '#38bdf8', look: 'back',
        pieces: [
            { need: 0, t: ['"You found the stair. Most people trip over it and blame the dark."', '"I do not deal. I draft. Every contract you sign is a rule I wanted to see you survive."'] },
            { need: 0, t: ['"Silence, Ascetic, Paranoia. Three small cruelties. Each pays a quarter more."', '"I put the pay in so you would sign. I put the cost in so you would remember."'] },
            { need: 0, t: ['"Three of them asked me to let them leave."', '"I asked them to deal one more hand. They have been dealing ever since."'] }] },
    CUSTODIAN: { name: 'THE CUSTODIAN', coat: '#334155', trim: '#94a3b8', look: 'cap',
        pieces: [
            { need: 0, t: ['"Machines are on the left. Jukebox on the right. Do not feed the machines your last coin."', '"They remember. They always remember."'] },
            { need: 0, t: ['"The Slots like seven. The Cups like patience. The Blackjack table likes it when you stop at seventeen."', '"Hi-Lo likes nobody."'] },
            { need: 0, t: ['"Jukebox has more than it shows. If you ever buy a Night Tuner, check the radio. It has friends."'] }] }
};

function hsBeaten(k) { const be = meta.beaten || {}; return !!(be[k] || (k === 'SADISTIC' && (meta.wins || 0) >= 1) || (k === 'CALCULATING' && (meta.wins || 0) >= 2)); }
function hsVisible(k) {
    const be = meta.beaten || {}, w = meta.wins || 0, cs = meta.cineSeen || {};
    if (['SADISTIC', 'CALCULATING', 'UNPREDICTABLE'].includes(k)) return true;
    if (k === 'MIMIC' || k === 'WARDEN') return w >= 1 || !!be[k];
    if (k === 'ANCIENT') return !!be.ANCIENT || !!cs.boss_ancient;
    if (k === 'FIRST') return !!be.FIRST || !!cs.boss_first;
    if (['COLLECTOR', 'CONFESSOR', 'CLOCKWORK', 'HOST'].includes(k)) return !!be[k] || !!cs.underside_in || !!meta.trueEnd;
    return true;
}
function hsOpen(k, p) { return p.need === 0 || (p.need === 'beat' && hsBeaten(k)) || (p.need === 'cellar' && !!meta.brassKey); }
function hsTalkLines(k) {
    const f = HOUSE_FOLK[k], d = hsData(), n = d.talk[k] || 0;
    const ps = f.pieces;
    // next unread piece that is open; otherwise repeat a seen one
    for (let i = 0; i < ps.length; i++) if (i >= n && hsOpen(k, ps[i])) { d.talk[k] = i + 1; saveGame(); return { lines: ps[i].t, fresh: true }; }
    const locked = ps.find((p, i) => i >= n && !hsOpen(k, p));
    if (locked) {
        const hint = locked.need === 'beat' ? '(He has more to say. He will say it once you have beaten him at his own table.)'
                   : '(He lowers his voice. Something about a door at the bottom of the hall, and a key.)';
        return { lines: [hint], fresh: false };
    }
    const seen = ps.slice(0, Math.max(1, n));
    return { lines: seen[Math.floor(Math.random() * seen.length)].t, fresh: false };
}

// ---------- state / geometry ----------
let hsGrid = null, hsObjs = [];
function hsLoad(id, sx, sy) {
    const m = HOUSE_MAPS[id]; HS.map = id;
    hsObjs = m.objs.slice();
    hsGrid = [];
    for (let y = 0; y < MH; y++) { hsGrid[y] = []; for (let x = 0; x < MW; x++) hsGrid[y][x] = (y < 2 || y >= MH - 1 || x === 0 || x === MW - 1) ? 1 : 0; }
    hsObjs.filter(o => o.t === 'portal').forEach(o => { for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (hsGrid[y]) hsGrid[y][x] = 0; });
    if (sx !== undefined) { HS.x = sx * TILE + 8; HS.y = sy * TILE + 14; }
    HS.cool = 0.5; HS.near = null; const hc = document.getElementById('house-cash'); if (hc) hc.textContent = globalMoney;
    const d = hsData(); d.seen[id] = 1;
}
function hsRectHit(r, o) { return r.x < o.x * TILE + o.w * TILE && r.x + r.w > o.x * TILE && r.y < o.y * TILE + o.h * TILE && r.y + r.h > o.y * TILE; }
function hsBlocked(nx, ny) {
    const r = { x: nx - 4, y: ny - 5, w: 8, h: 5 };
    for (let ty = Math.floor(r.y / TILE); ty <= Math.floor((r.y + r.h - 1) / TILE); ty++)
        for (let tx = Math.floor(r.x / TILE); tx <= Math.floor((r.x + r.w - 1) / TILE); tx++)
            if (!hsGrid[ty] || hsGrid[ty][tx] !== 0) return true;
    return hsObjs.some(o => o.solid && hsRectHit(r, o));
}
function hsPickDone(o) { return hsData().pick[o.id] === hsDay(); }

// ---------- sprites ----------
function hsRect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
function hsPerson(g, x, y, dir, wk, o) {   // x,y = top-left of a 12x16 person
    const c = o.coat, tr = o.trim, step = wk ? (Math.floor(wk * 8) % 2) : 0;
    hsRect(g, x + 3, y + 13 + (step ? 0 : 0), 2, 3 - (step ? 1 : 0), '#0b0b10'); hsRect(g, x + 7, y + 13, 2, 3 - (step ? 0 : 1), '#0b0b10');
    hsRect(g, x + 2, y + 6, 8, 8, c); hsRect(g, x + 2, y + 12, 8, 1, tr);
    hsRect(g, x, y + 7, 2, 5, c); hsRect(g, x + 10, y + 7, 2, 5, c);
    hsRect(g, x + 3, y, 6, 6, o.skin || '#e8d9c0');
    if (dir === 'up') { hsRect(g, x + 3, y, 6, 4, o.hair || '#1f2937'); return; }
    hsRect(g, x + 3, y, 6, 2, o.hair || '#1f2937');
    if (o.mask) { hsRect(g, x + 3, y + 1, 6, 5, '#e2e8f0'); }
    const ey = o.eye || '#ef4444';
    if (dir === 'left') hsRect(g, x + 3, y + 3, 1, 1, ey);
    else if (dir === 'right') hsRect(g, x + 8, y + 3, 1, 1, ey);
    else { hsRect(g, x + 4, y + 3, 1, 1, ey); hsRect(g, x + 7, y + 3, 1, 1, ey); }
    if (o.look === 'glass') { hsRect(g, x + 3, y + 2, 6, 1, '#93c5fd'); }
    if (o.look === 'wild') { hsRect(g, x + 2, y - 2, 1, 3, '#c084fc'); hsRect(g, x + 5, y - 3, 2, 3, '#c084fc'); hsRect(g, x + 9, y - 2, 1, 3, '#c084fc'); }
    if (o.look === 'hood') { hsRect(g, x + 2, y - 1, 8, 3, '#57534e'); hsRect(g, x + 2, y + 2, 1, 4, '#57534e'); hsRect(g, x + 9, y + 2, 1, 4, '#57534e'); }
    if (o.look === 'cap') { hsRect(g, x + 2, y - 1, 8, 2, '#0f172a'); hsRect(g, x + 2, y + 1, 9, 1, '#0f172a'); }
    if (o.look === 'gold') { hsRect(g, x + 3, y - 2, 6, 2, '#fbbf24'); hsRect(g, x + 3, y - 3, 1, 1, '#fbbf24'); hsRect(g, x + 8, y - 3, 1, 1, '#fbbf24'); }
    if (o.look === 'grin') { hsRect(g, x + 4, y + 5, 4, 1, '#7f1d1d'); }
}
const HS_ME = { coat: '#0e7490', trim: '#38bdf8', skin: '#e8c8a4', hair: '#3b2f2f', mask: 0, eye: '#111827' };

function hsDrawObj(g, o, t) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = o.h * TILE;
    switch (o.t) {
        case 'shelf': hsRect(g, x, y, w, h, '#3a2a1c'); for (let i = 0; i < 3; i++) { hsRect(g, x + 2, y + 4 + i * 9, w - 4, 2, '#7c5a3a'); for (let k = 0; k < 6; k++) hsRect(g, x + 3 + k * 4, y + 6 + i * 9 - 6, 3, 6, ['#9f1239', '#1e3a8a', '#14532d', '#a16207'][(k + i) % 4]); } break;
        case 'stall': hsRect(g, x, y, w, h, '#451a03'); hsRect(g, x, y + 2, w, 6, '#b45309'); for (let i = 0; i < w; i += 6) hsRect(g, x + i, y + 2, 3, 6, '#fbbf24'); hsRect(g, x + 4, y + 16, w - 8, 3, '#78350f'); hsRect(g, x + w / 2 - 6, y + 11, 12, 4, '#fde68a'); break;
        case 'board': hsRect(g, x, y + 3, w, h - 6, '#78350f'); hsRect(g, x + 2, y + 5, w - 4, h - 10, '#a16207'); hsRect(g, x + 5, y + 8, 7, 9, '#e2e8f0'); hsRect(g, x + 15, y + 9, 8, 7, '#fecaca'); hsRect(g, x + 7, y + 8, 3, 1, '#ef4444'); break;
        case 'radio': hsRect(g, x + 2, y + 6, w - 4, h - 8, '#1e293b'); hsRect(g, x + 4, y + 9, 12, 8, '#0f172a'); hsRect(g, x + 5, y + 12, 6 + (Math.sin(t * 3) + 1) * 2, 1, '#38bdf8'); hsRect(g, x + 20, y + 9, 5, 5, '#475569'); hsRect(g, x + 22, y + 2, 1, 6, '#94a3b8'); break;
        case 'mirror': hsRect(g, x + 2, y + 1, w - 4, h - 2, '#92400e'); hsRect(g, x + 4, y + 3, w - 8, h - 6, '#334155'); hsRect(g, x + 6, y + 5, 3, h - 12, '#64748b'); break;
        case 'table': hsRect(g, x, y + 4, w, h - 6, '#3f1d0e'); hsRect(g, x + 2, y + 6, w - 4, h - 12, '#14532d'); hsRect(g, x + w / 2 - 1, y + 10, 2, 5, '#fef3c7'); hsRect(g, x + w / 2 - 1, y + 8 + (Math.sin(t * 9) > 0 ? 0 : 1), 2, 2, '#fb923c');
            hsRect(g, x + 8, y + 22, 10, 6, '#e2e8f0'); hsRect(g, x + 40, y + 20, 10, 6, '#e2e8f0'); break;
        case 'cab': { hsRect(g, x + 1, y, w - 2, h, '#111827'); hsRect(g, x + 4, y + 3, w - 8, 12, '#020617'); const on = (Math.floor(t * 4 + o.x) % 3);
            hsRect(g, x + 6, y + 5, 4, 8, o.c); hsRect(g, x + 14 + on, y + 5, 6, 3, '#e2e8f0'); hsRect(g, x + 4, y + 18, w - 8, 3, '#1e293b'); hsRect(g, x + 8, y + 19, 3, 2, '#ef4444'); hsRect(g, x + 15, y + 19, 3, 2, '#fbbf24'); hsRect(g, x + 1, y, w - 2, 1, o.c); break; }
        case 'jukebox': hsRect(g, x + 2, y, w - 4, h, '#7f1d1d'); hsRect(g, x + 5, y + 3, w - 10, 12, '#fbbf24'); hsRect(g, x + 7, y + 5, w - 14, 8, '#0f172a'); hsRect(g, x + 9, y + 7 + Math.floor(Math.sin(t * 4) + 1), 8, 2, '#38bdf8'); hsRect(g, x + 8, y + 20, w - 16, 4, '#1e293b'); break;
        case 'chest': hsRect(g, x, y + 3, w, 11, '#78350f'); hsRect(g, x, y + 3, w, 3, '#a16207'); hsRect(g, x + w / 2 - 2, y + 7, 4, 4, '#fbbf24'); break;
        case 'desk': hsRect(g, x, y + 2, w, 12, '#1e293b'); hsRect(g, x + 4, y, 12, 4, '#e2e8f0'); hsRect(g, x + 22, y + 3, 14, 3, '#475569'); hsRect(g, x + 36, y - 1, 3, 6, '#ef4444'); break;
        case 'torch': hsRect(g, x + 6, y + 4, 4, 9, '#57534e'); { const f = 3 + Math.floor((Math.sin(t * 14 + o.x) + 1) * 1.5); hsRect(g, x + 5, y + 4 - f, 6, f + 1, '#f97316'); hsRect(g, x + 7, y + 3 - f, 2, f, '#fde047'); } break;
        case 'coin': if (!hsPickDone(o)) { const b = Math.floor(Math.sin(t * 5 + o.x) * 1.5); hsRect(g, x + 4, y + 6 + b, 8, 8, '#d97706'); hsRect(g, x + 5, y + 7 + b, 6, 6, '#fbbf24'); hsRect(g, x + 7, y + 8 + b, 2, 4, '#fde68a'); hsRect(g, x + 4, y + 14, 8, 1, 'rgba(0,0,0,.4)'); } break;
        case 'portal': break;
    }
}
function hsDrawPortals(g, m) {
    hsObjs.filter(o => o.t === 'portal').forEach(o => {
        const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = o.h * TILE, locked = o.lock && !meta[o.lock];
        hsRect(g, x, y, w, h, locked ? '#1c1917' : '#000');
        hsRect(g, x, y, w, 1, m.trim); hsRect(g, x, y + h - 1, w, 1, m.trim);
        if (o.to === 'EXIT') { hsRect(g, x + 4, y + 3, w - 8, h - 5, '#fef3c7'); hsRect(g, x + w / 2 - 1, y + 5, 2, 3, '#7c2d12'); }
        if (locked) hsRect(g, x + w / 2 - 2, y + h / 2 - 2, 4, 5, '#fbbf24');
    });
}

function hsDrawMap(g, t) {
    const m = HOUSE_MAPS[HS.map];
    for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++) {
        const wall = hsGrid[ty][tx] === 1;
        if (wall) {
            hsRect(g, tx * TILE, ty * TILE, TILE, TILE, m.wall);
            if (ty < 2) { hsRect(g, tx * TILE, ty * TILE + 15, TILE, 1, m.trim); if ((tx + ty) % 2) hsRect(g, tx * TILE + 2, ty * TILE + 4, 5, 3, 'rgba(255,255,255,.05)'); }
        } else hsRect(g, tx * TILE, ty * TILE, TILE, TILE, m.floor[(tx + ty) % 2]);
    }
    if (HS.map === 'CORRIDOR') hsRect(g, 2 * TILE, 6 * TILE, 16 * TILE, 2 * TILE, 'rgba(180,40,50,.25)');
    if (HS.map === 'ARCADE') for (let i = 0; i < MW; i++) hsRect(g, i * TILE + 6, 2 * TILE + 2, 4, 1, 'rgba(56,189,248,.25)');
    hsDrawPortals(g, m);
}

// ---------- draw ----------
function hsFolkOpts(k) { const f = HOUSE_FOLK[k]; return { coat: f.coat, trim: f.trim, look: f.look, mask: k !== 'ARCHITECT' && k !== 'CUSTODIAN', eye: '#ef4444', hair: k === 'ANCIENT' ? '#57534e' : '#1f2937' }; }
function hsDraw() {
    const cv = document.getElementById('house-canvas'); if (!cv) return;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const t = HS.t;
    hsDrawMap(g, t);
    // sort by y so people walk behind things properly
    const list = [];
    hsObjs.forEach(o => { if (o.t !== 'portal' && o.t !== 'npc') list.push({ y: (o.y + o.h) * TILE, f: () => hsDrawObj(g, o, t) }); });
    hsObjs.filter(o => o.t === 'npc').forEach(o => {
        const k = o.who, x = o.x * TILE + 2, y = o.y * TILE - 2;
        if (!hsVisible(k)) { list.push({ y: (o.y + 1) * TILE, f: () => { hsRect(g, x, y + 7, 12, 8, '#292524'); hsRect(g, x + 1, y + 3, 10, 5, '#44403c'); if ((HS.near || {}) === o) hsRect(g, x + 4, y - 4, 4, 1, '#fff'); } }); return; }
        const bob = Math.floor(Math.sin(t * 2 + o.x) * 0.9);
        const face = (HS.x < o.x * TILE + 8) ? 'right' : 'left';
        list.push({ y: (o.y + 1) * TILE, f: () => {
            hsRect(g, x - 1, y + 15, 14, 2, 'rgba(0,0,0,.35)');
            hsPerson(g, x, y + bob, k === 'ARCHITECT' ? 'up' : (HS.y > o.y * TILE + 14 ? 'down' : face), 0, hsFolkOpts(k));
            if (hsBeaten(k) && k !== 'ARCHITECT' && k !== 'CUSTODIAN') hsRect(g, x + 4, y - 5 + bob, 4, 2, '#4ade80');   // small green tick once beaten
        } });
    });
    if (HS.ghost) list.push({ y: HS.ghost.y + 1, f: () => { g.globalAlpha = 0.45 + 0.3 * Math.sin(t * 7); hsPerson(g, HS.ghost.x - 6, HS.ghost.y - 15, 'down', 0, { ...HS_ME, coat: '#0b1220', trim: '#334155', mask: 1, eye: '#ef4444' }); g.globalAlpha = 1; } });
    list.push({ y: HS.y, f: () => {
        hsRect(g, HS.x - 6, HS.y - 2, 12, 3, 'rgba(0,0,0,.4)');
        const bob = HS.walk ? Math.abs(Math.sin(HS.walk * 10)) * -1 : 0;
        hsPerson(g, HS.x - 6, HS.y - 15 + bob, HS.dir, HS.walk, HS_ME);
    } });
    list.sort((a, b) => a.y - b.y).forEach(i => i.f());
    // prompt over the focused thing
    if (HS.near && !HS.dlg) {
        const o = HS.near, cx = (o.x + o.w / 2) * TILE, cy = o.y * TILE - 6;
        const bounce = Math.floor(Math.sin(t * 6) * 1.5);
        hsRect(g, cx - 5, cy - 8 + bounce, 10, 9, '#fde68a'); hsRect(g, cx - 4, cy - 7 + bounce, 8, 7, '#0f172a');
        hsRect(g, cx - 1, cy - 6 + bounce, 2, 3, '#fde68a'); hsRect(g, cx - 1, cy - 2 + bounce, 2, 1, '#fde68a');
    }
    // darkness grows as Sanity falls; the cellar is dark to begin with
    const dark = Math.min(0.75, (100 - sanity) / 160 + (HOUSE_MAPS[HS.map].dark ? 0.25 : 0));
    if (dark > 0.02) {
        const gr = g.createRadialGradient(HS.x, HS.y - 8, 18, HS.x, HS.y - 8, 150 - sanity * 0.5);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${dark + 0.2})`);
        g.fillStyle = gr; g.fillRect(0, 0, 320, 208);
        if (sanity <= 40 && Math.sin(t * 17) > 0.96) { g.fillStyle = 'rgba(180,0,0,.08)'; g.fillRect(0, 0, 320, 208); }
    }
    if (HS.flash > 0) { g.fillStyle = `rgba(255,255,255,${HS.flash})`; g.fillRect(0, 0, 320, 208); }
}

// ---------- interaction ----------
function hsFocus() {
    const r = { x: HS.x - 4 - 5, y: HS.y - 5 - 5, w: 18, h: 15 };
    let best = null, bd = 1e9;
    hsObjs.forEach(o => {
        if (o.t === 'portal' || o.t === 'torch' || !(o.act || o.t === 'coin')) return;
        if (o.t === 'coin' && hsPickDone(o)) return;
        if (!hsRectHit(r, o)) return;
        const d = Math.hypot((o.x + o.w / 2) * TILE - HS.x, (o.y + o.h / 2) * TILE - HS.y);
        if (d < bd) { bd = d; best = o; }
    });
    HS.near = best;
}
function hsToast(t) { HS.msg = t; HS.msgT = 2.4; const e = document.getElementById('house-toast'); if (e) { e.textContent = t; e.classList.add('show'); } }
function hsSay(name, lines, color, done) {
    HS.dlg = { name, lines: lines.slice(), i: 0, pos: 0, color: color || '#38bdf8', done };
    const d = document.getElementById('house-dlg'); d.classList.remove('hidden');
    document.getElementById('house-dlg-name').textContent = name; document.getElementById('house-dlg-name').style.color = HS.dlg.color;
    hsRenderDlg();
}
function hsRenderDlg() {
    const D = HS.dlg; if (!D) return;
    const line = D.lines[D.i] || '';
    document.getElementById('house-dlg-text').textContent = line.slice(0, Math.floor(D.pos));
    document.getElementById('house-dlg-next').textContent = D.pos >= line.length ? (D.i >= D.lines.length - 1 ? 'OK' : 'NEXT') : '';
}
function hsAdvance() {
    const D = HS.dlg; if (!D) return false;
    const line = D.lines[D.i] || '';
    if (D.pos < line.length) { D.pos = line.length; hsRenderDlg(); return true; }
    if (D.i < D.lines.length - 1) { D.i++; D.pos = 0; SFX.click(); hsRenderDlg(); return true; }
    HS.dlg = null; document.getElementById('house-dlg').classList.add('hidden');
    const cb = D.done; if (cb) cb();
    return true;
}

function hsLeaveTo(fn) { closeHouse(); houseReturn = true; fn(); }
function hsMenuTab(tab) { closeHouse(); houseReturn = false; showMenu(); settings.lobbyTab = tab; showLobbyTab(tab); }
function hsAct(o) {
    SFX.click();
    switch (o.act) {
        case 'talk': {
            const k = o.who;
            if (!hsVisible(k)) { hsSay('???', ['The chair is empty. The cushion is still dented, the way a cushion is after someone has gone.', 'Perhaps they are not ready to be spoken to. Or you are not.'], '#94a3b8'); return; }
            const r = hsTalkLines(k), f = HOUSE_FOLK[k];
            hsSay(f.name, r.lines, f.trim, () => {
                if (r.fresh && k === 'ARCHITECT' && !hsData().seen.archMark) { hsData().seen.archMark = 1; addMarks(2); saveGame(); hsToast('+2 MARKS'); SFX.win(); }
                if (r.fresh && HOUSE_FOLK[k].pieces.every((p, i) => (hsData().talk[k] || 0) > i) && !hsData().seen['all_' + k]) { hsData().seen['all_' + k] = 1; addMarks(1); saveGame(); hsToast('+1 MARK: ' + f.name + ' told you everything'); SFX.win(); }
            });
            return; }
        case 'table': return hsLeaveTo(() => { houseReturn = false; showMenu(); settings.lobbyTab = 'play'; showLobbyTab('play'); });
        case 'market': return hsLeaveTo(() => toggleShop(true));
        case 'archive': return hsMenuTab('archive');
        case 'radio': return hsMenuTab('system');
        case 'bj': return hsLeaveTo(() => openBlackjack());
        case 'slots': return hsLeaveTo(() => openSlots());
        case 'cups': return hsLeaveTo(() => openCups());
        case 'hilo': return hsLeaveTo(() => openHiLo());
        case 'juke': {
            const open = RADIO_TRACKS.filter(trackOpen), cur = open.findIndex(x => x.id === Music.getTrack());
            const nx = open[(cur + 1) % open.length]; Music.setTrack(nx.id);
            hsToast('NOW PLAYING: ' + nx.name); return; }
        case 'mirror': {
            const lines = storyMode === 'THIEF' ? ['A thief looks back. He has your hands and somebody else\'s patience.', 'Everything you took is still in your pockets. It is just no longer yours.']
                                               : ['The man in the mirror holds a photograph. One face scratched out.', 'He stands the way you stand. He stands the way he stood.'];
            if (sanity <= 40) lines.push('For one second the reflection is a half beat late.');
            if (sanity <= 25) lines.push('It smiles first.');
            hsSay('THE MIRROR', lines, '#94a3b8'); return; }
        case 'board': {
            const d = hsData(), n = Object.keys(DEALER_PERSONALITIES).filter(k => (meta.beaten || {})[k]).length;
            hsSay('NOTICE BOARD', ['WINS: ' + (meta.wins || 0) + '    DEALERS BEATEN: ' + n + '/' + Object.keys(DEALER_PERSONALITIES).length,
                'MARKS: ' + (meta.marks || 0) + '    CASH: $' + globalMoney,
                'Pinned under it, in pencil: "Talk to them after you beat them. They say different things."'], '#fbbf24'); return; }
        case 'chest': {
            const d = hsData();
            if (d.seen.chest) { hsSay('OLD CHEST', ['Empty. The lining smells like someone else\'s coat.'], '#a16207'); return; }
            d.seen.chest = 1; addMarks(3); saveGame(); SFX.win(); HS.flash = 0.5;
            hsSay('OLD CHEST', ['Under a rotten sleeve, three small tokens. They are warm.', '+3 MARKS'], '#fbbf24'); return; }
        case 'ledger': {
            const be = meta.beaten || {}, n = Object.keys(DEALER_PERSONALITIES).filter(k => be[k]).length;
            hsSay('THE LEDGER', ['Column one: names. Column two: how many hands each of them dealt.', 'Your name is at the bottom. It was already there. The ink is still wet.',
                `Wins entered: ${meta.wins || 0}. Dealers crossed out: ${n}. Room left on the page: plenty.`], '#38bdf8'); return; }
    }
    if (o.t === 'coin') {
        const d = hsData(); d.pick[o.id] = hsDay(); globalMoney += o.amt; totalStats.moneyEarned += o.amt;
        updateMoneyDisplay(true); saveGame(); SFX.chip(); hsToast('+$' + o.amt); const hc = document.getElementById('house-cash'); if (hc) hc.textContent = globalMoney;
    }
}

// ---------- loop + input ----------
function hsInputDir() {
    const k = HS.keys, p = HS.pad;
    let dx = 0, dy = 0;
    if (k.ArrowLeft || k.a || k.A || p.left) dx -= 1;
    if (k.ArrowRight || k.d || k.D || p.right) dx += 1;
    if (k.ArrowUp || k.w || k.W || p.up) dy -= 1;
    if (k.ArrowDown || k.s || k.S || p.down) dy += 1;
    return [dx, dy];
}
function hsTick(ts) {
    if (!HS.on) return;
    const dt = Math.min(0.05, (ts - HS.last) / 1000 || 0.016); HS.last = ts; HS.t += dt;
    if (HS.cool > 0) HS.cool -= dt;
    if (HS.msgT > 0) { HS.msgT -= dt; if (HS.msgT <= 0) { const e = document.getElementById('house-toast'); if (e) e.classList.remove('show'); } }
    if (HS.flash > 0) HS.flash = Math.max(0, HS.flash - dt * 1.5);
    if (HS.dlg) { const D = HS.dlg, line = D.lines[D.i] || ''; if (D.pos < line.length) { D.pos = Math.min(line.length, D.pos + dt * 42); hsRenderDlg(); } }
    else {
        const [dx, dy] = hsInputDir();
        if (dx || dy) {
            const len = Math.hypot(dx, dy), sp = 58 * dt;
            const mx = dx / len * sp, my = dy / len * sp;
            if (!hsBlocked(HS.x + mx, HS.y)) HS.x += mx;
            if (!hsBlocked(HS.x, HS.y + my)) HS.y += my;
            HS.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
            HS.walk += dt; HS.step += dt;
            if (HS.step > 0.3) { HS.step = 0; SFX.hover(); }
        } else HS.walk = 0;
        hsFocus();
        if (HS.cool <= 0) {
            const r = { x: HS.x - 4, y: HS.y - 5, w: 8, h: 5 };
            const p = hsObjs.find(o => o.t === 'portal' && hsRectHit(r, o));
            if (p) hsEnter(p);
        }
    }
    // the thing in the hall
    if (HS.map === 'HALL' && sanity <= 25) {
        HS.ghostT -= dt;
        if (HS.ghostT <= 0) {
            if (HS.ghost) { HS.ghost = null; HS.ghostT = 7 + Math.random() * 6; }
            else { HS.ghost = { x: (3 + Math.floor(Math.random() * 14)) * TILE + 8, y: (9 + Math.floor(Math.random() * 2)) * TILE + 14 }; HS.ghostT = 5; }
        }
    } else HS.ghost = null;
    hsDraw();
    HS.raf = requestAnimationFrame(hsTick);
}
function hsEnter(p) {
    if (p.to === 'EXIT') { closeHouse(); houseReturn = false; showMenu(); return; }
    if (p.lock && !meta[p.lock]) {
        HS.cool = 1.2;
        HS.y -= 12; hsToast('LOCKED. A brass key opens it.');
        hsSay('THE DOOR', ['Locked. The lock is brass and very old.', 'Somewhere a stall sells keys. Not for cash. The house wants something it can keep.'], '#fbbf24');
        SFX.empty(); return;
    }
    HS.flash = 0.6; SFX.click();
    hsLoad(p.to, p.sx, p.sy);
    const e = document.getElementById('house-room'); if (e) e.textContent = HOUSE_MAPS[p.to].name;
    if (p.to === 'CELLAR' && !hsData().seen.cellarIn) { hsData().seen.cellarIn = 1; hsSay('THE CELLAR', ['The stair is longer than the house is tall.', 'Down here the air has a taste, like a coin held in the mouth.'], '#94a3b8'); }
}

function hsKeyDown(e) {
    if (!HS.on) return;
    const k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape', 'e', 'E', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(k)) { e.preventDefault(); e.stopImmediatePropagation(); }
    if (k === 'Escape') { if (HS.dlg) { HS.dlg.lines = ['']; HS.dlg.i = 0; HS.dlg.pos = 0; hsAdvance(); } else closeHouseBtn(); return; }
    if (k === ' ' || k === 'Enter' || k === 'e' || k === 'E') { if (e.repeat) return; hsA(); return; }
    HS.keys[k] = true;
}
function hsKeyUp(e) { if (HS.on) delete HS.keys[e.key]; }
function hsA() { if (HS.dlg) { hsAdvance(); return; } if (HS.near) hsAct(HS.near); }
document.addEventListener('keydown', hsKeyDown, true);
document.addEventListener('keyup', hsKeyUp, true);

function hsBindPad() {
    const pad = document.getElementById('house-pad'); if (!pad || pad.dataset.bound) return;
    pad.dataset.bound = '1';
    pad.querySelectorAll('[data-dir]').forEach(b => {
        const d = b.dataset.dir;
        const on = ev => { ev.preventDefault(); HS.pad[d] = true; b.classList.add('down'); };
        const off = ev => { ev.preventDefault(); HS.pad[d] = false; b.classList.remove('down'); };
        b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
        b.addEventListener('contextmenu', ev => ev.preventDefault());
    });
    const a = document.getElementById('house-a');
    a.addEventListener('pointerdown', ev => { ev.preventDefault(); hsA(); });
    document.getElementById('house-dlg').addEventListener('pointerdown', ev => { ev.preventDefault(); hsAdvance(); });
    // tap the canvas: walk toward that point, or talk to what you tapped
    const cv = document.getElementById('house-canvas');
    cv.addEventListener('pointerdown', ev => {
        const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 320, y = (ev.clientY - r.top) / r.height * 208;
        if (HS.dlg) { hsAdvance(); return; }
        const hit = hsObjs.find(o => o.act && x >= o.x * TILE && x < (o.x + o.w) * TILE && y >= (o.y - 0.4) * TILE && y < (o.y + o.h) * TILE);
        if (hit && HS.near === hit) { hsAct(hit); return; }
        HS.tap = { x, y, t: 1.2 };
    });
}
// tap-to-walk steering feeds the same pad flags
setInterval(() => {
    if (!HS.on) return;
    const t = HS.tap;
    ['up', 'down', 'left', 'right'].forEach(k => { if (t) HS.pad['_' + k] = false; });
    if (!t) return;
    t.t -= 0.05;
    const dx = t.x - HS.x, dy = t.y - (HS.y - 6);
    if (t.t <= 0 || Math.hypot(dx, dy) < 4) { HS.tap = null; HS.pad.left = HS.pad.right = HS.pad.up = HS.pad.down = false; return; }
    HS.pad.left = dx < -3; HS.pad.right = dx > 3; HS.pad.up = dy < -3; HS.pad.down = dy > 3;
}, 50);

function hsFit() {
    const cv = document.getElementById('house-canvas'), wrap = document.getElementById('house-stage'); if (!cv || !wrap) return;
    const aw = wrap.clientWidth, ah = wrap.clientHeight;
    const s = Math.max(1, Math.min(aw / 320, ah / 208));
    cv.style.width = Math.floor(320 * s) + 'px'; cv.style.height = Math.floor(208 * s) + 'px';
    const vw = document.getElementById('house-view'); vw.style.width = cv.style.width; vw.style.height = cv.style.height;
    vw.style.setProperty('--hs', Math.max(0.6, Math.min(1.4, s / 2.2)));
}
window.addEventListener('resize', () => { if (HS.on) hsFit(); });

// ---------- open / close ----------
function openHouse() {
    if (HS.on) return;
    if (activeGame !== 'MENU') return;
    if (typeof radio !== 'undefined' && radio.on) { radio.stop(); const b = document.getElementById('radio-power'); if (b) b.textContent = 'POWER: OFF'; }
    houseReturn = false;
    document.getElementById('main-menu').classList.add('hidden');
    const sc = document.getElementById('house-screen'); sc.classList.remove('hidden');
    document.body.classList.add('house-on'); activeGame = 'HOUSE'; HS.on = true; HS.keys = {}; HS.pad = {}; HS.dlg = null; HS.tap = null; HS.ghost = null; HS.t = 0;
    document.getElementById('house-dlg').classList.add('hidden');
    const d = hsData(), first = !d.seen.HALL;
    HS.dir = 'down';
    hsLoad(HS.map === 'CELLAR' && !meta.brassKey ? 'HALL' : (HS.map || 'HALL'), HS.x ? undefined : 9, HS.x ? undefined : 10);
    if (!HS.x) { HS.x = 9 * TILE + 8; HS.y = 10 * TILE + 14; }
    document.getElementById('house-room').textContent = HOUSE_MAPS[HS.map].name;
    hsBindPad(); hsFit(); setTimeout(hsFit, 60);
    Music.setScene('menu');
    cancelAnimationFrame(HS.raf); HS.last = performance.now(); HS.raf = requestAnimationFrame(hsTick);
    if (first) hsSay('THE HOUSE', ['You thought it was one room.', 'It never was. Walk. Look. Talk to the ones who sit in the Row; they say more once you have beaten them.', 'Press E, Space or the A button to interact. Esc leaves.'], '#38bdf8');
}
function closeHouse() {
    HS.on = false; cancelAnimationFrame(HS.raf); HS.keys = {}; HS.pad = {}; HS.dlg = null;
    document.getElementById('house-screen').classList.add('hidden');
    document.getElementById('house-dlg').classList.add('hidden');
    document.body.classList.remove('house-on'); activeGame = 'MENU';
}
function closeHouseBtn() { closeHouse(); houseReturn = false; showMenu(); }

// coming back from a machine / the market returns you to the house
['closeHiLo', 'closeBlackjack', 'closeSlots', 'closeCups'].forEach(n => {
    const orig = window[n];
    window[n] = function() { const r = orig.apply(this, arguments); if (houseReturn && activeGame === 'MENU') { houseReturn = false; openHouse(); } return r; };
});
const _hsToggleShop = toggleShop;
toggleShop = function(show) {
    _hsToggleShop(show);
    if (!show && houseReturn) { houseReturn = false; openHouse(); }
};
