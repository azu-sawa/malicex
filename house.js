"use strict";

// =====================================================================
// THE HOUSE: a walkable top-down pixel house. The view is 320x208 (20x13
// tiles of 16px); rooms are bigger than the view and the camera follows you.
// Everything is drawn live with fillRect, no image files.
//   HALL      the hub: table, market, archive, radio, clock, piano, workbench,
//             vending machine, windows. A cat lives here.
//   ARCADE    the four side-table machines, a claw machine, a jukebox
//   CORRIDOR  the dealers (and the Oracle). They remember you.
//   LIBRARY   lore notes, a fireplace to rest at
//   CELLAR    needs the Brass Key. The Architect, and the four from the Underside
//   WRONG ROOM  not on any map. The door only exists when your Sanity is low.
// Controls: arrows / WASD, E / Space / Enter = interact, Esc = leave.
// Touch: drag anywhere on the room to walk (floating stick), tap a thing to use
// it, or use the D-pad and A. At low Sanity the house stops being friendly.
// =====================================================================
const HS = { on: false, raf: 0, last: 0, map: 'HALL', x: 0, y: 0, dir: 'down', walk: 0, keys: {}, pad: {}, near: null, dlg: null,
             cool: 0, flash: 0, ghost: null, ghostT: 6, step: 0, t: 0, msg: '', msgT: 0, cam: { x: 0, y: 0 }, trail: [], trailT: 0,
             follow: null, dark: 0, darkT: 40, stick: null, cat: null, win: [0, 0, 0, 0], menu: null, roomT: 0, lastRoom: '' };
let houseReturn = false;
const TILE = 16, VW = 320; let VH = 208;

function hsData() { meta.house = meta.house || { talk: {}, pick: {}, seen: {} }; const d = meta.house; d.scraps = d.scraps || {}; d.notes = d.notes || {}; d.chore = d.chore || { day: '', done: {} }; d.fx = d.fx || {}; return d; }
function hsDay() { return new Date().toDateString(); }
function hsChore(id) { const c = hsData().chore; if (c.day !== hsDay()) { c.day = hsDay(); c.done = {}; c.claimed = 0; } if (!c.done[id]) { c.done[id] = 1; saveGame(); } }
function hsLate() { const h = new Date().getHours(); return h === 3; }   // 03:00 to 03:59 local time: the house is awake too

// ---------- maps ----------
// every map: w,h in tiles. rows 0-1 and the bottom row are wall, as are the side columns.
const HOUSE_MAPS = {
    HALL: { name: 'THE HALL', w: 32, h: 16, floor: ['#241a14', '#2a1f18'], wall: '#14110f', trim: '#7c5a3a', song: 'house_hall',
        objs: [
            { t: 'portal', x: 0, y: 7, w: 1, h: 2, to: 'ARCADE', sx: 28, sy: 8 },
            { t: 'portal', x: 31, y: 7, w: 1, h: 2, to: 'CORRIDOR', sx: 2, sy: 7 },
            { t: 'portal', x: 31, y: 11, w: 1, h: 2, to: 'LIBRARY', sx: 2, sy: 9 },
            { t: 'portal', x: 15, y: 15, w: 2, h: 1, to: 'CELLAR', sx: 12, sy: 3, lock: 'brassKey' },
            { t: 'portal', x: 6, y: 15, w: 2, h: 1, to: 'EXIT' },
            { t: 'portal', x: 0, y: 11, w: 1, h: 2, to: 'WRONG', sx: 17, sy: 7, cond: 'wrong' },
            { t: 'shelf', x: 3, y: 0, w: 2, h: 2, solid: 1, act: 'archive', label: 'THE ARCHIVE' },
            { t: 'window', x: 6, y: 0, w: 2, h: 2, wi: 0 },
            { t: 'stall', x: 9, y: 0, w: 3, h: 2, solid: 1, act: 'market', label: 'BLACK MARKET' },
            { t: 'window', x: 13, y: 0, w: 2, h: 2, wi: 1 },
            { t: 'board', x: 16, y: 0, w: 2, h: 2, solid: 1, act: 'board', label: 'CHORE BOARD' },
            { t: 'clock', x: 19, y: 0, w: 1, h: 2, solid: 1, act: 'clock', label: 'THE CLOCK' },
            { t: 'radio', x: 21, y: 0, w: 2, h: 2, solid: 1, act: 'radio', label: 'THE RADIO' },
            { t: 'window', x: 24, y: 0, w: 2, h: 2, wi: 2 },
            { t: 'mirror', x: 27, y: 0, w: 2, h: 2, solid: 1, act: 'mirror', label: 'MIRROR' },
            { t: 'table', x: 14, y: 7, w: 4, h: 3, solid: 1, act: 'table', label: 'SIT DOWN' },
            { t: 'vend', x: 2, y: 4, w: 2, h: 2, solid: 1, act: 'vend', label: 'VENDING MACHINE' },
            { t: 'bench', x: 27, y: 4, w: 3, h: 2, solid: 1, act: 'bench', label: 'WORKBENCH' },
            { t: 'piano', x: 3, y: 9, w: 3, h: 2, solid: 1, act: 'piano', label: 'THE PIANO' },
            { t: 'rug', x: 10, y: 5, w: 12, h: 8 },
            { t: 'coin', x: 4, y: 13, w: 1, h: 1, id: 'hall1', amt: 60, label: 'COIN' },
            { t: 'coin', x: 27, y: 13, w: 1, h: 1, id: 'hall2', amt: 90, label: 'COIN' },
            { t: 'scrap', x: 10, y: 13, w: 1, h: 1, id: 'hs1', k: 'CANDLE', label: 'CANDLE STUB' },
            { t: 'scrap', x: 22, y: 3, w: 1, h: 1, id: 'hs2', k: 'WIRE', label: 'COPPER WIRE' }] },
    ARCADE: { name: 'THE ARCADE', w: 30, h: 14, floor: ['#14122a', '#1a1738'], wall: '#0a0918', trim: '#38bdf8', song: 'house_arcade',
        objs: [
            { t: 'portal', x: 29, y: 7, w: 1, h: 2, to: 'HALL', sx: 1, sy: 8 },
            { t: 'cab', x: 3, y: 0, w: 2, h: 2, solid: 1, act: 'bj', label: 'BLACKJACK', c: '#22c55e' },
            { t: 'cab', x: 6, y: 0, w: 2, h: 2, solid: 1, act: 'slots', label: 'SLOTS', c: '#ef4444' },
            { t: 'cab', x: 9, y: 0, w: 2, h: 2, solid: 1, act: 'cups', label: 'CUPS', c: '#fbbf24' },
            { t: 'cab', x: 12, y: 0, w: 2, h: 2, solid: 1, act: 'hilo', label: 'HI-LO', c: '#38bdf8' },
            { t: 'claw', x: 16, y: 0, w: 3, h: 2, solid: 1, act: 'claw', label: 'CLAW MACHINE' },
            { t: 'jukebox', x: 21, y: 0, w: 2, h: 2, solid: 1, act: 'juke', label: 'JUKEBOX' },
            { t: 'npc', who: 'CUSTODIAN', x: 22, y: 8, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'coin', x: 4, y: 10, w: 1, h: 1, id: 'arc1', amt: 70, label: 'COIN' },
            { t: 'scrap', x: 26, y: 11, w: 1, h: 1, id: 'as1', k: 'FILM', label: 'FILM REEL' },
            { t: 'scrap', x: 12, y: 11, w: 1, h: 1, id: 'as2', k: 'TOOTH', label: 'LOOSE TOOTH' }] },
    CORRIDOR: { name: "DEALERS' ROW", w: 40, h: 13, floor: ['#2a0f14', '#32141a'], wall: '#12080a', trim: '#b45309', song: 'house_corridor',
        objs: [
            { t: 'portal', x: 0, y: 6, w: 1, h: 2, to: 'HALL', sx: 30, sy: 8 },
            { t: 'window', x: 8, y: 0, w: 2, h: 2, wi: 3 }, { t: 'window', x: 20, y: 0, w: 2, h: 2, wi: 4 }, { t: 'window', x: 32, y: 0, w: 2, h: 2, wi: 5 },
            { t: 'npc', who: 'SADISTIC', x: 5, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'CALCULATING', x: 12, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'UNPREDICTABLE', x: 17, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'ANCIENT', x: 25, y: 3, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'ORACLE', x: 31, y: 3, w: 1, h: 1, solid: 1, act: 'fortune' },
            { t: 'npc', who: 'MIMIC', x: 7, y: 9, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'WARDEN', x: 15, y: 9, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'FIRST', x: 28, y: 9, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'coin', x: 37, y: 6, w: 1, h: 1, id: 'cor1', amt: 80, label: 'COIN' },
            { t: 'scrap', x: 20, y: 11, w: 1, h: 1, id: 'cs1', k: 'TOOTH', label: 'LOOSE TOOTH' },
            { t: 'scrap', x: 36, y: 10, w: 1, h: 1, id: 'cs2', k: 'FILM', label: 'FILM REEL' }] },
    LIBRARY: { name: 'THE LIBRARY', w: 24, h: 14, floor: ['#1a1410', '#21190f'], wall: '#0e0a07', trim: '#a16207', song: 'house_library',
        objs: [
            { t: 'portal', x: 0, y: 9, w: 1, h: 2, to: 'HALL', sx: 30, sy: 12 },
            { t: 'books', x: 3, y: 0, w: 2, h: 2, solid: 1, act: 'note', nid: 'n1', label: 'A BOOK' },
            { t: 'books', x: 6, y: 0, w: 2, h: 2, solid: 1, act: 'note', nid: 'n2', label: 'A BOOK' },
            { t: 'books', x: 9, y: 0, w: 2, h: 2, solid: 1, act: 'note', nid: 'n3', label: 'A BOOK' },
            { t: 'fire', x: 12, y: 0, w: 3, h: 2, solid: 1, act: 'rest', label: 'THE FIRE' },
            { t: 'books', x: 16, y: 0, w: 2, h: 2, solid: 1, act: 'note', nid: 'n4', label: 'A BOOK' },
            { t: 'books', x: 19, y: 0, w: 2, h: 2, solid: 1, act: 'note', nid: 'n5', label: 'A BOOK' },
            { t: 'desk', x: 17, y: 9, w: 3, h: 1, solid: 1, act: 'note', nid: 'n6', label: 'A LOOSE PAGE' },
            { t: 'chair', x: 12, y: 5, w: 2, h: 2, solid: 1, act: 'sit', label: 'THE ARMCHAIR' },
            { t: 'coin', x: 4, y: 11, w: 1, h: 1, id: 'lib1', amt: 75, label: 'COIN' },
            { t: 'scrap', x: 21, y: 6, w: 1, h: 1, id: 'ls1', k: 'CANDLE', label: 'CANDLE STUB' }] },
    CELLAR: { name: 'THE CELLAR', w: 26, h: 16, floor: ['#10151c', '#141b24'], wall: '#080a0e', trim: '#475569', dark: 1, song: 'house_cellar',
        objs: [
            { t: 'portal', x: 12, y: 1, w: 2, h: 1, to: 'HALL', sx: 15, sy: 13 },
            { t: 'npc', who: 'ARCHITECT', x: 12, y: 7, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'chest', x: 4, y: 10, w: 2, h: 1, solid: 1, act: 'chest', label: 'OLD CHEST' },
            { t: 'desk', x: 19, y: 10, w: 3, h: 1, solid: 1, act: 'ledger', label: 'THE LEDGER' },
            { t: 'npc', who: 'COLLECTOR', x: 3, y: 13, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'CONFESSOR', x: 9, y: 13, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'CLOCKWORK', x: 15, y: 13, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'HOST', x: 21, y: 13, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'torch', x: 5, y: 2, w: 1, h: 1, solid: 1 }, { t: 'torch', x: 20, y: 2, w: 1, h: 1, solid: 1 },
            { t: 'scrap', x: 23, y: 5, w: 1, h: 1, id: 'cl1', k: 'WIRE', label: 'COPPER WIRE' }] },
    WRONG: { name: 'THE HALL', w: 20, h: 13, floor: ['#1a1a1a', '#202020'], wall: '#0a0a0a', trim: '#e2e8f0', dark: 1, wrong: 1, song: 'house_wrong',
        objs: [
            { t: 'portal', x: 9, y: 12, w: 2, h: 1, to: 'HALL', sx: 1, sy: 12 },
            { t: 'npc', who: 'ECHO', x: 9, y: 5, w: 1, h: 1, solid: 1, act: 'talk' },
            { t: 'npc', who: 'STAND', x: 3, y: 4, w: 1, h: 1, solid: 1 }, { t: 'npc', who: 'STAND', x: 6, y: 8, w: 1, h: 1, solid: 1 },
            { t: 'npc', who: 'STAND', x: 13, y: 8, w: 1, h: 1, solid: 1 }, { t: 'npc', who: 'STAND', x: 16, y: 4, w: 1, h: 1, solid: 1 },
            { t: 'mirror', x: 8, y: 0, w: 4, h: 2, solid: 1, act: 'wmirror', label: 'THE OTHER MIRROR' }] }
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
    ORACLE: { name: 'THE ORACLE', coat: '#4a044e', trim: '#f0abfc', look: 'hood',
        pieces: [
            { need: 0, t: ['"Sit. No, not there. That chair is for the one behind you."', '"I do not predict. I only say what the cards already agreed on."'] },
            { need: 0, t: ['"Everyone asks what is coming. Nobody asks what is already here."', '"Come back each day. The cards change their minds. I do not."'] },
            { need: 'beat', t: ['"You have beaten some of them. It shows in your shadow. It has gotten longer."'] }] },
    ECHO: { name: 'YOU', coat: '#0e7490', trim: '#38bdf8', look: 'blank', pieces: [
            { need: 0, t: ['"Do not turn around."', '"I have been here the whole time. I was only waiting for you to be quiet enough to hear me breathe."'] },
            { need: 0, t: ['"The ones in the Row are not real. I am not real. The only real thing in the house is the part of you that wants to stay."'] },
            { need: 0, t: ['"Go back. Go back before the door remembers it was a wall."'] }] },
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
let hsGrid = null, hsObjs = [], hsMW = 20, hsMH = 13;
function hsPortalOpen(o) { if (o.cond === 'wrong') return sanity <= 40 || (HS.map === 'WRONG'); return true; }
function hsLoad(id, sx, sy) {
    const m = HOUSE_MAPS[id]; HS.map = id; hsMW = m.w; hsMH = m.h;
    hsObjs = m.objs.filter(o => o.cond !== 'wrong' || sanity <= 40 || hsData().fx.wrong === hsDay());
    hsGrid = [];
    for (let y = 0; y < hsMH; y++) { hsGrid[y] = []; for (let x = 0; x < hsMW; x++) hsGrid[y][x] = (y < 2 || y >= hsMH - 1 || x === 0 || x === hsMW - 1) ? 1 : 0; }
    hsObjs.filter(o => o.t === 'portal').forEach(o => { for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (hsGrid[y]) hsGrid[y][x] = 0; });
    if (sx !== undefined) { HS.x = sx * TILE + 8; HS.y = sy * TILE + 14; }
    HS.cool = 0.5; HS.near = null; HS.trail = []; HS.follow = null; HS.roomT = 0;
    HS.cat = (id === 'HALL' || id === 'LIBRARY') ? { x: (id === 'HALL' ? 9 : 14) * TILE, y: (id === 'HALL' ? 11 : 8) * TILE + 12, tx: 0, ty: 0, wait: 1, dir: 1, sit: 0 } : null;
    hsCam(true);
    const hc = document.getElementById('house-cash'); if (hc) hc.textContent = globalMoney;
    hsData().seen[id] = 1;
    try { Music.setScene(m.song || 'menu'); } catch (e) {}
}
function hsCam(snap) {
    const W = hsMW * TILE, H = hsMH * TILE;
    const tx = W <= VW ? -(VW - W) / 2 : Math.max(0, Math.min(W - VW, HS.x - VW / 2)), ty = H <= VH ? -(VH - H) / 2 : Math.max(0, Math.min(H - VH, HS.y - VH / 2 - 10));
    if (snap) { HS.cam.x = tx; HS.cam.y = ty; } else { HS.cam.x += (tx - HS.cam.x) * 0.2; HS.cam.y += (ty - HS.cam.y) * 0.2; }
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
function hsRect(g, x, y, w, h, c) { g.fillStyle = (typeof c === 'string' && c[0] === '#') ? themeColor(c) : c; g.fillRect(Math.round(x), Math.round(y), w, h); }
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



const HS_SCRAP = { TOOTH: '#f1f5f9', WIRE: '#d97706', CANDLE: '#fde68a', FILM: '#64748b' };
function hsDrawObj(g, o, t) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = o.h * TILE;
    switch (o.t) {
        case 'rug': hsRect(g, x, y, w, h, 'rgba(120,20,30,.22)'); hsRect(g, x + 4, y + 4, w - 8, 1, 'rgba(251,191,36,.18)'); hsRect(g, x + 4, y + h - 5, w - 8, 1, 'rgba(251,191,36,.18)'); break;
        case 'shelf': hsRect(g, x, y, w, h, '#3a2a1c'); for (let i = 0; i < 3; i++) { hsRect(g, x + 2, y + 4 + i * 9, w - 4, 2, '#7c5a3a'); for (let k = 0; k < 6; k++) hsRect(g, x + 3 + k * 4, y + 6 + i * 9 - 6, 3, 6, ['#9f1239', '#1e3a8a', '#14532d', '#a16207'][(k + i) % 4]); } break;
        case 'books': { hsRect(g, x, y, w, h, '#2b1d12'); for (let i = 0; i < 3; i++) { hsRect(g, x + 2, y + 4 + i * 9, w - 4, 2, '#6b4a2a'); for (let k = 0; k < 6; k++) hsRect(g, x + 3 + k * 4, y + 6 + i * 9 - 6 + (k % 3 === 0 ? 1 : 0), 3, 6, ['#7f1d1d', '#1e3a5f', '#365314', '#78350f', '#4c1d95'][(k + i + o.x) % 5]); }
            if (o.nid && hsData().notes[o.nid]) hsRect(g, x + w - 5, y + 3, 3, 3, '#4ade80'); else if (o.nid) hsRect(g, x + w - 5, y + 3 + (Math.sin(t * 4 + o.x) > 0 ? 0 : 1), 3, 3, '#fde68a'); break; }
        case 'stall': hsRect(g, x, y, w, h, '#451a03'); hsRect(g, x, y + 2, w, 6, '#b45309'); for (let i = 0; i < w; i += 6) hsRect(g, x + i, y + 2, 3, 6, '#fbbf24'); hsRect(g, x + 4, y + 16, w - 8, 3, '#78350f'); hsRect(g, x + w / 2 - 6, y + 11, 12, 4, '#fde68a'); break;
        case 'board': hsRect(g, x, y + 3, w, h - 6, '#78350f'); hsRect(g, x + 2, y + 5, w - 4, h - 10, '#a16207'); hsRect(g, x + 5, y + 8, 7, 9, '#e2e8f0'); hsRect(g, x + 15, y + 9, 8, 7, '#fecaca'); hsRect(g, x + 7, y + 8, 3, 1, '#ef4444'); break;
        case 'radio': hsRect(g, x + 2, y + 6, w - 4, h - 8, '#1e293b'); hsRect(g, x + 4, y + 9, 12, 8, '#0f172a'); hsRect(g, x + 5, y + 12, 6 + (Math.sin(t * 3) + 1) * 2, 1, '#38bdf8'); hsRect(g, x + 20, y + 9, 5, 5, '#475569'); hsRect(g, x + 22, y + 2, 1, 6, '#94a3b8'); break;
        case 'mirror': hsRect(g, x + 2, y + 1, w - 4, h - 2, '#92400e'); hsRect(g, x + 4, y + 3, w - 8, h - 6, o.act === 'wmirror' ? '#0b0b0b' : '#334155'); hsRect(g, x + 6, y + 5, 3, h - 12, '#64748b'); if (o.act === 'wmirror') { hsRect(g, x + w / 2 - 4, y + 9, 2, 2, '#ef4444'); hsRect(g, x + w / 2 + 2, y + 9, 2, 2, '#ef4444'); } break;
        case 'table': hsRect(g, x, y + 4, w, h - 6, '#3f1d0e'); hsRect(g, x + 2, y + 6, w - 4, h - 12, '#14532d'); hsRect(g, x + w / 2 - 1, y + 10, 2, 5, '#fef3c7'); hsRect(g, x + w / 2 - 1, y + 8 + (Math.sin(t * 9) > 0 ? 0 : 1), 2, 2, '#fb923c');
            hsRect(g, x + 8, y + 22, 10, 6, '#e2e8f0'); hsRect(g, x + 40, y + 20, 10, 6, '#e2e8f0'); break;
        case 'cab': { hsRect(g, x + 1, y, w - 2, h, '#111827'); hsRect(g, x + 4, y + 3, w - 8, 12, '#020617'); const on = (Math.floor(t * 4 + o.x) % 3);
            hsRect(g, x + 6, y + 5, 4, 8, o.c); hsRect(g, x + 14 + on, y + 5, 6, 3, '#e2e8f0'); hsRect(g, x + 4, y + 18, w - 8, 3, '#1e293b'); hsRect(g, x + 8, y + 19, 3, 2, '#ef4444'); hsRect(g, x + 15, y + 19, 3, 2, '#fbbf24'); hsRect(g, x + 1, y, w - 2, 1, o.c); break; }
        case 'claw': { hsRect(g, x + 1, y, w - 2, h, '#0f172a'); hsRect(g, x + 3, y + 2, w - 6, 20, '#0b3b4a'); const cx = x + 8 + (Math.sin(t * 1.4) + 1) * ((w - 22) / 2); hsRect(g, cx + 4, y + 2, 1, 7, '#94a3b8'); hsRect(g, cx, y + 9, 9, 2, '#fbbf24'); hsRect(g, cx, y + 11, 2, 3, '#fbbf24'); hsRect(g, cx + 7, y + 11, 2, 3, '#fbbf24');
            for (let k = 0; k < 5; k++) hsRect(g, x + 6 + k * 8, y + 17, 5, 5, ['#f43f5e', '#38bdf8', '#a3e635', '#fb923c', '#c084fc'][k]); hsRect(g, x + 3, y + 24, w - 6, 6, '#1e293b'); hsRect(g, x + w / 2 - 4, y + 26, 8, 2, '#ef4444'); break; }
        case 'jukebox': hsRect(g, x + 2, y, w - 4, h, '#7f1d1d'); hsRect(g, x + 5, y + 3, w - 10, 12, '#fbbf24'); hsRect(g, x + 7, y + 5, w - 14, 8, '#0f172a'); hsRect(g, x + 9, y + 7 + Math.floor(Math.sin(t * 4) + 1), 8, 2, '#38bdf8'); hsRect(g, x + 8, y + 20, w - 16, 4, '#1e293b'); break;
        case 'chest': hsRect(g, x, y + 3, w, 11, '#78350f'); hsRect(g, x, y + 3, w, 3, '#a16207'); hsRect(g, x + w / 2 - 2, y + 7, 4, 4, '#fbbf24'); break;
        case 'desk': hsRect(g, x, y + 2, w, 12, '#1e293b'); hsRect(g, x + 4, y, 12, 4, '#e2e8f0'); hsRect(g, x + 22, y + 3, 14, 3, '#475569'); hsRect(g, x + 36, y - 1, 3, 6, '#ef4444'); break;
        case 'torch': { hsRect(g, x + 6, y + 4, 4, 9, '#57534e'); const f = 3 + Math.floor((Math.sin(t * 14 + o.x) + 1) * 1.5); hsRect(g, x + 5, y + 4 - f, 6, f + 1, '#f97316'); hsRect(g, x + 7, y + 3 - f, 2, f, '#fde047'); break; }
        case 'fire': { hsRect(g, x, y, w, h, '#292524'); hsRect(g, x + 4, y + 8, w - 8, h - 8, '#0c0a09'); const f = 3 + Math.floor((Math.sin(t * 11) + 1) * 3); hsRect(g, x + 10, y + 26 - f, w - 20, f + 3, '#ea580c'); hsRect(g, x + 15, y + 26 - f + 2, w - 30, f, '#fde047'); hsRect(g, x - 1, y, w + 2, 3, '#57534e'); break; }
        case 'chair': hsRect(g, x + 2, y + 4, w - 4, h - 4, '#7f1d1d'); hsRect(g, x, y + 8, 4, h - 8, '#991b1b'); hsRect(g, x + w - 4, y + 8, 4, h - 8, '#991b1b'); hsRect(g, x + 4, y, w - 8, 8, '#991b1b'); break;
        case 'vend': hsRect(g, x + 1, y, w - 2, h, '#1d4ed8'); hsRect(g, x + 4, y + 3, w - 8, 15, '#020617'); for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) hsRect(g, x + 6 + k * 7, y + 5 + r * 5, 4, 3, ['#ef4444', '#fbbf24', '#22c55e', '#38bdf8'][(r + k) % 4]); hsRect(g, x + 6, y + 24, w - 12, 5, '#0f172a'); hsRect(g, x + w - 7, y + 21, 3, 2, '#4ade80'); break;
        case 'bench': hsRect(g, x, y + 6, w, h - 8, '#44403c'); hsRect(g, x, y + 6, w, 3, '#78716c'); hsRect(g, x + 4, y + 2, 4, 6, '#94a3b8'); hsRect(g, x + 14, y + 3, 10, 3, '#a8a29e'); hsRect(g, x + 30, y + 1, 6, 7, '#fde68a'); hsRect(g, x + 2, y + h - 3, 3, 3, '#292524'); hsRect(g, x + w - 5, y + h - 3, 3, 3, '#292524'); break;
        case 'piano': hsRect(g, x, y + 2, w, h - 2, '#0b0b10'); hsRect(g, x + 2, y + 14, w - 4, 8, '#e2e8f0'); for (let k = 0; k < 9; k++) hsRect(g, x + 4 + k * 5, y + 14, 1, 8, '#475569'); for (let k = 0; k < 6; k++) hsRect(g, x + 7 + k * 6, y + 14, 3, 5, '#0b0b10'); hsRect(g, x + 4, y + 6, w - 8, 6, '#1e1b2e'); break;
        case 'window': {
            const vis = HS.win[o.wi] || 0;
            hsRect(g, x + 1, y + 1, w - 2, h - 2, '#3f2d1e'); hsRect(g, x + 4, y + 4, w - 8, h - 8, HOUSE_MAPS[HS.map].wrong ? '#000000' : '#0b1224');
            hsRect(g, x + 8, y + 7, 3, 3, '#e2e8f0'); hsRect(g, x + 7, y + 8, 5, 1, '#e2e8f0');
            for (let k = 0; k < 4; k++) hsRect(g, x + 14 + k * 3, y + 6 + ((k * 7) % 11), 1, 1, '#94a3b8');
            hsRect(g, x + w / 2 - 1, y + 4, 2, h - 8, '#3f2d1e'); hsRect(g, x + 4, y + h / 2 - 1, w - 8, 2, '#3f2d1e');
            if (vis > 0) { const fx = x + 6 + Math.round(Math.max(-1, Math.min(1, (HS.x - (x + 16)) / 90)) * 2) + (o.wi % 2) * 8; hsRect(g, fx, y + 7, 7, 10, '#030712'); hsRect(g, fx + 1, y + 10, 2, 2, '#ef4444'); hsRect(g, fx + 4, y + 10, 2, 2, '#ef4444'); }
            break; }
        case 'clock': { hsRect(g, x + 3, y + 1, 10, h - 2, '#3f1d0e'); hsRect(g, x + 5, y + 4, 6, 6, '#e2e8f0'); const d = new Date(), a = ((d.getMinutes() / 60) * Math.PI * 2), hr = (((d.getHours() % 12) + d.getMinutes() / 60) / 12) * Math.PI * 2; const wrong = sanity <= 30 && Math.sin(t * 9) > 0.8;
            hsRect(g, x + 8 + Math.round(Math.sin(a + (wrong ? 1.4 : 0)) * 2), y + 7 - Math.round(Math.cos(a) * 2), 1, 1, '#000000'); hsRect(g, x + 8 + Math.round(Math.sin(hr)), y + 7 - Math.round(Math.cos(hr)), 1, 1, '#7f1d1d');
            hsRect(g, x + 7, y + 16 + Math.floor(Math.sin(t * 3) * 1.5), 2, 6, '#fbbf24'); break; }
        case 'scrap': if (!hsPickDone(o)) { const b = Math.sin(t * 3 + o.x) > 0 ? 0 : 1; hsRect(g, x + 5, y + 7 + b, 6, 5, HS_SCRAP[o.k]); hsRect(g, x + 6, y + 6 + b, 4, 1, '#ffffff'); hsRect(g, x + 4, y + 13, 8, 1, 'rgba(0,0,0,.4)'); } break;
        case 'coin': if (!hsPickDone(o)) { const b = Math.floor(Math.sin(t * 5 + o.x) * 1.5); hsRect(g, x + 4, y + 6 + b, 8, 8, '#d97706'); hsRect(g, x + 5, y + 7 + b, 6, 6, '#fbbf24'); hsRect(g, x + 7, y + 8 + b, 2, 4, '#fde68a'); hsRect(g, x + 4, y + 14, 8, 1, 'rgba(0,0,0,.4)'); } break;
        case 'portal': break;
    }
}
function hsDrawPortals(g, m) {
    hsObjs.filter(o => o.t === 'portal').forEach(o => {
        const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = o.h * TILE, locked = o.lock && !meta[o.lock];
        hsRect(g, x, y, w, h, locked ? '#1c1917' : '#000000');
        hsRect(g, x, y, w, 1, m.trim); hsRect(g, x, y + h - 1, w, 1, m.trim);
        if (o.to === 'EXIT') { hsRect(g, x + 4, y + 3, w - 8, h - 5, '#fef3c7'); hsRect(g, x + w / 2 - 1, y + 5, 2, 3, '#7c2d12'); }
        if (o.cond === 'wrong') { hsRect(g, x, y, w, h, '#050505'); if (Math.sin(HS.t * 20) > 0.3) hsRect(g, x + 2, y + 6, 2, 2, '#ef4444'); }
        if (locked) hsRect(g, x + w / 2 - 2, y + h / 2 - 2, 4, 5, '#fbbf24');
    });
}
function hsDrawMap(g, t) {
    const m = HOUSE_MAPS[HS.map];
    const x0 = Math.max(0, Math.floor(HS.cam.x / TILE)), x1 = Math.min(hsMW - 1, Math.ceil((HS.cam.x + VW) / TILE));
    const y0 = Math.max(0, Math.floor(HS.cam.y / TILE)), y1 = Math.min(hsMH - 1, Math.ceil((HS.cam.y + VH) / TILE));
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (hsGrid[ty][tx] === 1) {
            hsRect(g, tx * TILE, ty * TILE, TILE, TILE, m.wall);
            if (ty < 2) { hsRect(g, tx * TILE, ty * TILE + 15, TILE, 1, m.trim); if ((tx + ty) % 2) hsRect(g, tx * TILE + 2, ty * TILE + 4, 5, 3, 'rgba(255,255,255,.05)'); }
        } else hsRect(g, tx * TILE, ty * TILE, TILE, TILE, m.floor[(tx + ty) % 2]);
    }
    if (HS.map === 'CORRIDOR') hsRect(g, 2 * TILE, 6 * TILE, 36 * TILE, 2 * TILE, 'rgba(180,40,50,.25)');
    if (HS.map === 'ARCADE') for (let i = 0; i < hsMW; i++) hsRect(g, i * TILE + 6, 2 * TILE + 2, 4, 1, 'rgba(56,189,248,.25)');
    if (HS.map === 'LIBRARY') hsRect(g, 8 * TILE, 4 * TILE, 8 * TILE, 6 * TILE, 'rgba(160,98,7,.14)');
    hsDrawPortals(g, m);
}

function hsFolkOpts(k) {
    if (k === 'ECHO') return { ...HS_ME, mask: 0, eye: '#ef4444', coat: '#0b1220', trim: '#334155' };
    if (k === 'STAND') return { coat: '#1e1e1e', trim: '#333333', mask: 1, eye: '#000000', hair: '#000000' };
    const f = HOUSE_FOLK[k]; return { coat: f.coat, trim: f.trim, look: f.look, mask: k !== 'ARCHITECT' && k !== 'CUSTODIAN', eye: '#ef4444', hair: k === 'ANCIENT' ? '#57534e' : '#1f2937' };
}
function hsCatDraw(g, c, t) {
    const x = Math.round(c.x), y = Math.round(c.y), f = c.dir, ey = sanity <= 25 ? '#ef4444' : '#22c55e';
    hsRect(g, x - 5, y - 1, 11, 2, 'rgba(0,0,0,.35)');
    if (c.sit) {
        const hx = x - 5 + (f > 0 ? 6 : 0);
        hsRect(g, x - 4, y - 7, 8, 7, '#a8a29e'); hsRect(g, hx, y - 10, 5, 5, '#a8a29e'); hsRect(g, hx, y - 12, 1, 2, '#a8a29e'); hsRect(g, hx + 4, y - 12, 1, 2, '#a8a29e');
        hsRect(g, hx + (f > 0 ? 3 : 1), y - 8, 1, 1, ey); hsRect(g, x - 5 + (f > 0 ? -2 : 8), y - 3 + (Math.sin(t * 3) > 0 ? 0 : 1), 3, 1, '#a8a29e');
    } else {
        hsRect(g, x - 6, y - 5, 12, 4, '#a8a29e'); hsRect(g, x + (f > 0 ? 5 : -8), y - 8, 4, 4, '#a8a29e');
        hsRect(g, x - 5, y - 1, 2, 1 + (Math.floor(t * 8) % 2), '#78716c'); hsRect(g, x + 3, y - 1, 2, 1 + ((Math.floor(t * 8) + 1) % 2), '#78716c'); hsRect(g, x + (f > 0 ? -9 : 6), y - 7, 3, 1, '#a8a29e');
    }
}


// ---------- drawing the whole room ----------
function hsDraw() {
    const cv = document.getElementById('house-canvas'); if (!cv) return;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const t = HS.t, m = HOUSE_MAPS[HS.map];
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#000'; g.fillRect(0, 0, VW, VH);
    if (HS.black > 0) { return; }
    g.setTransform(1, 0, 0, 1, -Math.round(HS.cam.x), -Math.round(HS.cam.y));
    hsDrawMap(g, t);
    const list = [];
    hsObjs.forEach(o => { if (o.t !== 'portal' && o.t !== 'npc') list.push({ y: (o.y + o.h) * TILE - (o.t === 'rug' ? 999 : 0), f: () => hsDrawObj(g, o, t) }); });
    hsObjs.filter(o => o.t === 'npc').forEach(o => {
        const k = o.who, x = o.x * TILE + 2, y = o.y * TILE - 2;
        if (k !== 'STAND' && k !== 'ECHO' && !hsVisible(k)) { list.push({ y: (o.y + 1) * TILE, f: () => { hsRect(g, x, y + 7, 12, 8, '#292524'); hsRect(g, x + 1, y + 3, 10, 5, '#44403c'); } }); return; }
        const bob = Math.floor(Math.sin(t * 2 + o.x) * 0.9);
        let face = (HS.x < o.x * TILE + 8) ? 'right' : 'left';
        if (k === 'STAND') face = 'down';
        const away = k === 'ARCHITECT' || (k === 'STAND' && Math.hypot(HS.x - o.x * TILE, HS.y - o.y * TILE) < 70);
        list.push({ y: (o.y + 1) * TILE, f: () => {
            hsRect(g, x - 1, y + 15, 14, 2, 'rgba(0,0,0,.35)');
            hsPerson(g, x, y + bob, away ? 'up' : (HS.y > o.y * TILE + 14 ? 'down' : face), 0, hsFolkOpts(k));
            if (k !== 'STAND' && k !== 'ECHO' && hsBeaten(k) && k !== 'ARCHITECT' && k !== 'CUSTODIAN' && k !== 'ORACLE') hsRect(g, x + 4, y - 5 + bob, 4, 2, '#4ade80');
        } });
    });
    if (HS.cat) list.push({ y: HS.cat.y, f: () => hsCatDraw(g, HS.cat, t) });
    if (HS.ghost) list.push({ y: HS.ghost.y + 1, f: () => { g.globalAlpha = 0.45 + 0.3 * Math.sin(t * 7); hsPerson(g, HS.ghost.x - 6, HS.ghost.y - 15, 'down', 0, hsFolkOpts('ECHO')); g.globalAlpha = 1; } });
    if (HS.follow && HS.trail.length > 10) { const p = HS.trail[0]; list.push({ y: p.y, f: () => { g.globalAlpha = 0.5; hsPerson(g, p.x - 6, p.y - 15, 'down', 0, hsFolkOpts('ECHO')); g.globalAlpha = 1; } }); }
    list.push({ y: HS.y, f: () => {
        hsRect(g, HS.x - 6, HS.y - 2, 12, 3, 'rgba(0,0,0,.4)');
        const bob = HS.walk ? Math.abs(Math.sin(HS.walk * 10)) * -1 : 0;
        hsPerson(g, HS.x - 6, HS.y - 15 + bob, HS.dir, HS.walk, HS_ME);
    } });
    list.sort((a, b) => a.y - b.y).forEach(i => i.f());
    // the thing you can use
    if (HS.near && !HS.dlg && !HS.menu) {
        const o = HS.near, cx = o.t === 'cat' ? o.x : (o.x + o.w / 2) * TILE, cy = (o.t === 'cat' ? o.y - 18 : o.y * TILE - 6);
        const bounce = Math.floor(Math.sin(t * 6) * 1.5);
        hsRect(g, cx - 5, cy - 8 + bounce, 10, 9, '#fde68a'); hsRect(g, cx - 4, cy - 7 + bounce, 8, 7, '#0f172a');
        hsRect(g, cx - 1, cy - 6 + bounce, 2, 3, '#fde68a'); hsRect(g, cx - 1, cy - 2 + bounce, 2, 1, '#fde68a');
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    // darkness: grows as Sanity falls; some rooms are dark to begin with; the clock at 3 is darker still
    const dark = Math.min(0.68, (100 - sanity) / 160 + (m.dark ? 0.25 : 0) + (hsLate() ? 0.12 : 0));
    if (dark > 0.02) {
        const px = HS.x - HS.cam.x, py = HS.y - HS.cam.y - 8, rad = Math.max(80, 150 - sanity * 0.5 - (hsLate() ? 25 : 0));
        const gr = g.createRadialGradient(px, py, 18, px, py, rad);
        gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${dark + 0.2})`);
        g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
        if (sanity <= 40 && Math.sin(t * 17) > 0.96) { g.fillStyle = 'rgba(180,0,0,.08)'; g.fillRect(0, 0, VW, VH); }
    }
    if (HS.blink > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, HS.blink * 2)})`; g.fillRect(0, 0, VW, VH); }
    if (HS.flash > 0) { g.fillStyle = `rgba(255,255,255,${HS.flash})`; g.fillRect(0, 0, VW, VH); }
}

// ---------- the house is watching ----------
function hsHorror(dt) {
    const low = sanity <= 50, late = hsLate();
    // windows: faces appear when you are not well, or it is three in the morning
    HS.winT -= dt;
    if (HS.winT <= 0) {
        HS.winT = low || late ? 2 + Math.random() * 4 : 12 + Math.random() * 20;
        const chance = late ? 0.9 : sanity <= 25 ? 0.7 : low ? 0.4 : 0.06;
        for (let i = 0; i < 6; i++) HS.win[i] = (Math.random() < chance) ? 3 + Math.random() * 4 : HS.win[i];
    }
    for (let i = 0; i < 6; i++) if (HS.win[i] > 0) HS.win[i] = Math.max(0, HS.win[i] - dt);
    // the ghost in the hall and the stranger who walks behind you
    if (HS.map === 'HALL' && sanity <= 25) {
        HS.ghostT -= dt;
        if (HS.ghostT <= 0) {
            if (HS.ghost) { HS.ghost = null; HS.ghostT = 7 + Math.random() * 6; }
            else { HS.ghost = { x: Math.max(40, Math.min(hsMW * TILE - 40, HS.x + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 60))), y: (8 + Math.floor(Math.random() * 3)) * TILE + 14 }; HS.ghostT = 5; }
        }
    } else if (HS.map !== 'HALL') HS.ghost = null;
    HS.roomT += dt;
    HS.follow = sanity <= 35 && HS.roomT > 14 && HS.map !== 'WRONG';
    // lights go out
    if (HS.blink > 0) HS.blink -= dt;
    if (HS.black > 0) { HS.black -= dt; if (HS.black <= 0) { HS.blink = 0.5; if (sanity <= 30 && HOUSE_MAPS[HS.map] && !HOUSE_MAPS[HS.map].wrong) { HS.ghost = { x: HS.x + (Math.random() < 0.5 ? -26 : 26), y: HS.y }; HS.ghostT = 3; } } }
    else if (sanity <= 45 || late) {
        HS.darkT -= dt;
        if (HS.darkT <= 0) { HS.darkT = (late ? 20 : 30) + Math.random() * 40; HS.black = 0.7 + Math.random() * 0.8; SFX.glitch(); }
    }
    // the cat
    const c = HS.cat;
    if (c) {
        c.wait -= dt;
        if (c.wait <= 0) {
            if (c.sit) { c.sit = 0; c.wait = 0.2; }
            else if (Math.random() < 0.4) { c.sit = 1; c.wait = 3 + Math.random() * 6; }
            else { c.tx = Math.max(2 * TILE, Math.min((hsMW - 2) * TILE, c.x + (Math.random() - 0.5) * 120)); c.ty = Math.max(3 * TILE, Math.min((hsMH - 2) * TILE, c.y + (Math.random() - 0.5) * 60)); c.wait = 2 + Math.random() * 3; c.go = 1; }
        }
        if (c.go && !c.sit) {
            const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
            if (d < 2) c.go = 0; else { c.x += dx / d * 22 * dt; c.y += dy / d * 22 * dt; c.dir = dx < 0 ? -1 : 1; }
        }
        // at low Sanity it will not stop staring at one corner
        if (sanity <= 25) { c.sit = 1; c.dir = (hsMW * TILE / 2 > c.x) ? -1 : 1; }
    }
}
// text gets worse when you do
function hsBad(line) { try { if (sanity <= 20) return zalgo(line, 1); if (sanity <= 35 && Math.random() < 0.25) return zalgo(line, 0.5); } catch (e) {} return line; }


// ---------- what you can reach ----------
function hsCash() { const hc = document.getElementById('house-cash'); if (hc) hc.textContent = globalMoney; }
function hsSan(n) { setSanityDirect(Math.max(0, Math.min(100, sanity + n))); saveGame(); }
function hsGain(k, n) { const d = hsData(); d.scraps[k] = (d.scraps[k] || 0) + (n || 1); saveGame(); }
function hsFocus() {
    const r = { x: HS.x - 4 - 5, y: HS.y - 5 - 5, w: 18, h: 15 };
    let best = null, bd = 1e9;
    hsObjs.forEach(o => {
        if (o.t === 'portal' || o.t === 'torch' || !(o.act || o.t === 'coin' || o.t === 'scrap')) return;
        if ((o.t === 'coin' || o.t === 'scrap') && hsPickDone(o)) return;
        if (!hsRectHit(r, o)) return;
        const d = Math.hypot((o.x + o.w / 2) * TILE - HS.x, (o.y + o.h / 2) * TILE - HS.y);
        if (d < bd) { bd = d; best = o; }
    });
    const c = HS.cat;
    if (c && Math.hypot(c.x - HS.x, c.y - HS.y) < 22 && (!best || bd > 14)) best = { t: 'cat', act: 'cat', x: c.x, y: c.y, w: 1, h: 1 };
    HS.near = best;
}
function hsToast(t) { HS.msg = t; HS.msgT = 2.4; const e = document.getElementById('house-toast'); if (e) { e.textContent = t; e.classList.add('show'); } }
function hsSay(name, lines, color, done) {
    lines = lines.map(hsBad);
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

// ---------- menus (workbench, board, piano ...) ----------
function hsMenu(title, build) {
    const view = document.getElementById('house-view'); let el = document.getElementById('house-menu');
    if (!el) { el = document.createElement('div'); el.id = 'house-menu'; el.className = 'house-menu'; view.appendChild(el); }
    HS.menu = { title, build };
    const draw = () => {
        const b = build(), c = el; c.innerHTML = '';
        const h = document.createElement('div'); h.className = 'hm-title'; h.textContent = title; c.appendChild(h);
        if (b.intro) { const p = document.createElement('div'); p.className = 'hm-intro'; p.textContent = b.intro; c.appendChild(p); }
        if (b.keys) { const k = document.createElement('div'); k.className = 'hm-keys'; b.keys.forEach(x => { const bt = document.createElement('button'); bt.className = 'hm-key'; bt.textContent = x.label; bt.onclick = () => { x.fn(); draw(); }; k.appendChild(bt); }); c.appendChild(k); }
        (b.rows || []).forEach(r => {
            const row = document.createElement('div'); row.className = 'hm-row' + (r.off ? ' off' : '');
            const tx = document.createElement('div'); tx.className = 'hm-t'; tx.textContent = r.text;
            if (r.sub) { const s = document.createElement('small'); s.textContent = r.sub; tx.appendChild(s); }
            row.appendChild(tx);
            if (r.btn) { const bt = document.createElement('button'); bt.className = 'hm-b'; bt.textContent = r.btn; bt.disabled = !!r.off; bt.onclick = () => { if (r.fn) r.fn(); draw(); }; row.appendChild(bt); }
            c.appendChild(row);
        });
        if (b.foot) { const f = document.createElement('div'); f.className = 'hm-foot'; f.textContent = b.foot; c.appendChild(f); }
        const x = document.createElement('button'); x.className = 'hm-close'; x.textContent = 'CLOSE'; x.onclick = hsMenuClose; c.appendChild(x);
        hsCash();
    };
    el.classList.remove('hidden'); draw();
}
function hsMenuClose() { HS.menu = null; const el = document.getElementById('house-menu'); if (el) el.classList.add('hidden'); }

// ---------- things to do ----------
const HS_NOTES = {
    n1: ['A BOOK: "A GUEST\'S MANUAL"', 'Rule one: the house is bigger at night. Rule two: do not count the windows. Rule three is a smudge.'],
    n2: ['A BOOK: "THE FIRST HAND"', 'He dealt one hand and called it the whole of his life. Later he learned that was true.'],
    n3: ['A BOOK: "SMALL MUSIC"', 'A lullaby: low, middle, high, middle. It is played for someone who has stopped listening.'],
    n4: ['A BOOK: "THE OTHER ROOM"', 'Sometimes the hall has a second door. It is not hidden. You only see it when you stop being afraid of what is behind it.', 'Or when the piano plays the wrong tune: the highest key, the lowest key, and again.'],
    n5: ['A BOOK: "ON SCRAPS"', 'What you cannot use, keep. Tooth, wire, candle, film. A workbench in the hall turns scraps into small kindnesses for the next night.'],
    n6: ['A LOOSE PAGE', 'In pencil: "If you can hear the radio and you did not turn it on, do not turn around. Count to ten. It will be gone. It always is."']
};
const HS_FORTUNES = [
    { id: 'LUCK', text: 'LUCK: your next run pays 20% more.', fx: { reward: 1.2 } },
    { id: 'WARD', text: 'WARD: your next run starts with +12 Sanity.', fx: { sanity: 12 } },
    { id: 'COIN', text: 'COIN: you will start your next run with $150 more.', fx: { cash: 150 } },
    { id: 'DREAD', text: 'DREAD: your next run starts with -10 Sanity, and pays 30% more.', fx: { sanity: -10, reward: 1.3 } }
];
const HS_RECIPES = [
    { id: 'lamp', name: 'SANITY LAMP', cost: { CANDLE: 2 }, text: 'Next run starts with +15 Sanity.', fx: { sanity: 15 } },
    { id: 'charm', name: 'COPPER CHARM', cost: { WIRE: 2, TOOTH: 1 }, text: 'Next run pays 15% more.', fx: { reward: 1.15 } },
    { id: 'kit', name: 'STARTER KIT', cost: { FILM: 1, WIRE: 1 }, text: 'Next run starts with +$200.', fx: { cash: 200 } },
    { id: 'mark', name: 'BLACK CANDLE', cost: { CANDLE: 3, FILM: 1 }, text: 'Burn it: +1 Mark right now.', now: () => { addMarks(1); } }
];
const HS_SCRAP_NAME = { TOOTH: 'LOOSE TOOTH', WIRE: 'COPPER WIRE', CANDLE: 'CANDLE STUB', FILM: 'FILM REEL' };
const HS_PIANO = [262, 294, 330, 349, 392, 440, 494];
function hsFxText() {
    const f = hsData().fx, a = [];
    if (f.sanity) a.push((f.sanity > 0 ? '+' : '') + f.sanity + ' Sanity'); if (f.cash) a.push('+$' + f.cash); if (f.reward) a.push('x' + f.reward.toFixed(2) + ' pay');
    return a.length ? 'NEXT RUN: ' + a.join(', ') : 'Nothing is waiting for your next run.';
}
function hsAddFx(fx) {
    const f = hsData().fx;
    if (fx.sanity) f.sanity = (f.sanity || 0) + fx.sanity;
    if (fx.cash) f.cash = (f.cash || 0) + fx.cash;
    if (fx.reward) f.reward = Math.min(1.6, (f.reward || 1) * fx.reward);
    saveGame();
}
function hsBench() {
    hsMenu('WORKBENCH', () => {
        const d = hsData(), has = (c) => Object.keys(c).every(k => (d.scraps[k] || 0) >= c[k]);
        return { intro: 'Scraps from around the house: ' + (Object.keys(HS_SCRAP_NAME).map(k => HS_SCRAP_NAME[k] + ' x' + (d.scraps[k] || 0)).join(', ')) + '.',
            rows: HS_RECIPES.map(r => ({ text: r.name + '  (' + Object.keys(r.cost).map(k => r.cost[k] + ' ' + HS_SCRAP_NAME[k]).join(' + ') + ')', sub: r.text, btn: 'MAKE', off: !has(r.cost),
                fn: () => { Object.keys(r.cost).forEach(k => d.scraps[k] -= r.cost[k]); if (r.fx) hsAddFx(r.fx); if (r.now) r.now(); saveGame(); SFX.win(); hsToast(r.name + ' MADE'); hsChore('bench'); } })),
            foot: hsFxText() };
    });
}
function hsBoard() {
    hsMenu('CHORE BOARD', () => {
        const c = hsData().chore; if (c.day !== hsDay()) { c.day = hsDay(); c.done = {}; c.claimed = 0; }
        const L = [['cat', 'PET THE CAT'], ['scrap', 'FIND A SCRAP'], ['fire', 'REST AT THE FIRE'], ['fortune', 'ASK THE ORACLE']];
        const all = L.every(x => c.done[x[0]]);
        const rows = L.map(x => ({ text: (c.done[x[0]] ? '[x] ' : '[ ] ') + x[1] }));
        rows.push({ text: all ? (c.claimed ? 'Claimed today.' : 'All done. Take your pay: $120 and 1 Mark.') : 'Finish all four to be paid. They reset at midnight.', btn: c.claimed ? '' : 'CLAIM', off: !all,
            fn: () => { c.claimed = 1; globalMoney += 120; addMarks(1); totalStats.moneyEarned += 120; updateMoneyDisplay(true); saveGame(); SFX.win(); } });
        return { rows, foot: 'Pinned under it, in pencil: "Talk to them after you beat them. They say different things."' };
    });
}
function hsPianoMenu() {
    hsMenu('THE PIANO', () => {
        const names = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        return { intro: 'Seven keys. Something is still listening.', foot: 'Played: ' + (HS.melody.map(i => names[i]).join(' ') || '-'),
            keys: names.map((n, i) => ({ label: n, fn: () => hsPlay(i) })) };
    });
}
function hsPlay(i) {
    try { initAudio(); tone(HS_PIANO[i], 'triangle', 0.9, 0.18); tone(HS_PIANO[i] * 2, 'sine', 0.5, 0.05); } catch (e) {}
    HS.melody.push(i); if (HS.melody.length > 4) HS.melody.shift();
    const m = HS.melody.join(',');
    const d = hsData();
    if (m === '0,2,4,2' && d.fx.lull !== hsDay()) { d.fx.lull = hsDay(); hsSan(8); hsToast('THE LULLABY: +8 SANITY'); SFX.heal(); }
    if (m === '6,0,6,0' && sanity > 40 && d.fx.wrong !== hsDay()) { d.fx.wrong = hsDay(); HS.melody = []; saveGame(); SFX.glitch(); hsMenuClose(); HS.black = 1.2; hsToast('SOMETHING IN THE HALL HAS MOVED'); hsLoad('HALL'); }
}
function hsAct(o) {
    SFX.click();
    const d = hsData();
    switch (o.act) {
        case 'talk': {
            const k = o.who;
            if (!hsVisible(k)) { hsSay('???', ['The chair is empty. The cushion is still dented, the way a cushion is after someone has gone.', 'Perhaps they are not ready to be spoken to. Or you are not.'], '#94a3b8'); return; }
            const r = hsTalkLines(k), f = HOUSE_FOLK[k];
            hsSay(f.name, r.lines, f.trim, () => {
                if (r.fresh && k === 'ARCHITECT' && !d.seen.archMark) { d.seen.archMark = 1; addMarks(2); saveGame(); hsToast('+2 MARKS'); SFX.win(); }
                if (r.fresh && f.pieces.every((p, i) => (d.talk[k] || 0) > i) && !d.seen['all_' + k]) { d.seen['all_' + k] = 1; addMarks(1); saveGame(); hsToast('+1 MARK: ' + f.name + ' told you everything'); SFX.win(); }
            });
            return; }
        case 'fortune': {
            const r = hsTalkLines('ORACLE'), f = HOUSE_FOLK.ORACLE;
            if (d.fx.fortuneDay === hsDay()) { hsSay(f.name, ['"The cards have not changed their minds."', '"Come back tomorrow."'], f.trim); return; }
            const pick = HS_FORTUNES[Math.floor(Math.random() * HS_FORTUNES.length)];
            d.fx.fortuneDay = hsDay(); hsAddFx(pick.fx); hsChore('fortune');
            hsSay(f.name, r.lines.concat(['She turns one card. It is warm.', pick.text]), f.trim, () => { SFX.bell(); hsToast(pick.id); });
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
        case 'bench': return hsBench();
        case 'board': return hsBoard();
        case 'piano': HS.melody = []; return hsPianoMenu();
        case 'vend': {
            if (globalMoney < 40) { SFX.empty(); hsToast('NEEDS $40'); return; }
            globalMoney -= 40; updateMoneyDisplay(true); hsCash(); SFX.chip();
            const r = Math.random();
            if (r < 0.12) { hsSay('VENDING MACHINE', ['The machine hums. The coin comes back out. Wet.'], '#94a3b8'); globalMoney += 40; hsCash(); }
            else if (r < 0.2) { hsGain('TOOTH'); hsSay('VENDING MACHINE', ['Something drops. It is not a snack. It is a tooth, and it is clean.', '+1 LOOSE TOOTH'], '#f1f5f9'); }
            else { const n = 4 + Math.floor(Math.random() * 4); hsSan(n); hsSay('VENDING MACHINE', [sanity <= 25 ? 'The can is warm. It has your name on it, written the way you write it.' : 'A cold can, a little too sweet. It helps.', '+' + n + ' SANITY'], '#38bdf8'); }
            saveGame(); return; }
        case 'claw': {
            if (globalMoney < 50) { SFX.empty(); hsToast('NEEDS $50'); return; }
            globalMoney -= 50; updateMoneyDisplay(true); hsCash(); SFX.chip();
            const r = Math.random();
            if (r < 0.4) hsSay('CLAW MACHINE', ['It drops. It closes on nothing. It rises with a small, sad whine.'], '#fbbf24');
            else if (r < 0.7) { const k = Object.keys(HS_SCRAP_NAME)[Math.floor(Math.random() * 4)]; hsGain(k); hsSay('CLAW MACHINE', ['Inside the plush: ' + HS_SCRAP_NAME[k].toLowerCase() + '.', '+1 ' + HS_SCRAP_NAME[k]], '#fbbf24'); }
            else if (r < 0.92) { globalMoney += 90; hsCash(); hsSay('CLAW MACHINE', ['A bear with a pocket. In the pocket, coins.', '+$90'], '#fbbf24'); }
            else { addMarks(1); SFX.win(); hsSay('CLAW MACHINE', ['The claw holds. It holds all the way to the chute.', 'A token, warm. +1 MARK'], '#fbbf24'); }
            updateMoneyDisplay(true); saveGame(); return; }
        case 'rest': {
            if (d.fx.rest === hsDay()) { hsSay('THE FIRE', ['You are warm enough. Warmer than that, and you would stay.'], '#fb923c'); return; }
            d.fx.rest = hsDay(); hsSan(10); hsChore('fire'); SFX.heal();
            hsSay('THE FIRE', ['You sit until the fire forgets you are there.', '+10 SANITY'], '#fb923c'); return; }
        case 'sit': hsSay('THE ARMCHAIR', sanity <= 30 ? ['It is warm. Someone has just stood up.', 'Across the room the other armchair is turned toward you. It was not before.'] : ['It remembers the shape of whoever sat here last. You fit it anyway.'], '#a16207'); return;
        case 'note': {
            if (!d.notes[o.nid]) { d.notes[o.nid] = 1; saveGame(); }
            const all = Object.keys(HS_NOTES).every(k => d.notes[k]);
            hsSay(HS_NOTES[o.nid][0], HS_NOTES[o.nid].slice(1), '#fde68a', () => { if (all && !d.seen.allNotes) { d.seen.allNotes = 1; addMarks(2); saveGame(); SFX.win(); hsToast('ALL SIX READ: +2 MARKS'); } });
            return; }
        case 'cat': {
            const day = hsDay(); if (d.fx.petDay !== day) { d.fx.petDay = day; d.fx.pets = 0; }
            hsChore('cat');
            if (sanity <= 25) { hsSay('THE CAT', ['It does not purr. It is looking at something just behind your shoulder.', 'You do not turn around. Neither does it.'], '#a8a29e'); return; }
            if ((d.fx.pets || 0) < 3) { d.fx.pets++; hsSan(3); SFX.heal(); hsToast('+3 SANITY'); hsSay('THE CAT', ['It leans into your hand as if you were a wall it trusted.'], '#a8a29e'); }
            else hsSay('THE CAT', ['It has had enough of you for today. It is polite about it.'], '#a8a29e');
            return; }
        case 'clock': {
            const now = new Date(), hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
            const l = ['It says ' + hh + ':' + mm + '. It has said that for a while.'];
            if (hsLate()) l.push('Three in the morning. In here, the house is awake too. Every window is looking.');
            else if (sanity <= 30) l.push('The second hand moves backward for a moment, then apologizes.');
            hsSay('THE CLOCK', l, '#fbbf24'); return; }
        case 'mirror': {
            const lines = storyMode === 'THIEF' ? ['A thief looks back. He has your hands and somebody else\'s patience.', 'Everything you took is still in your pockets. It is just no longer yours.']
                                               : ['The man in the mirror holds a photograph. One face scratched out.', 'He stands the way you stand. He stands the way he stood.'];
            if (sanity <= 40) lines.push('For one second the reflection is a half beat late.');
            if (sanity <= 25) lines.push('It smiles first.');
            hsSay('THE MIRROR', lines, '#94a3b8'); return; }
        case 'wmirror': {
            const l = ['There is no reflection. Only the room, one second ago.', 'You put your hand on the glass. Someone puts a hand on yours, from the inside.'];
            if (!d.seen.wmirror) { d.seen.wmirror = 1; hsSan(-6); addMarks(2); saveGame(); l.push('-6 SANITY.  +2 MARKS. It took something and left something.'); SFX.whisper(); }
            hsSay('THE OTHER MIRROR', l, '#e2e8f0'); return; }
        case 'chest': {
            if (d.seen.chest) { hsSay('OLD CHEST', ['Empty. The lining smells like someone else\'s coat.'], '#a16207'); return; }
            d.seen.chest = 1; addMarks(3); saveGame(); SFX.win(); HS.flash = 0.5;
            hsSay('OLD CHEST', ['Under a rotten sleeve, three small tokens. They are warm.', '+3 MARKS'], '#fbbf24'); return; }
        case 'ledger': {
            const be = meta.beaten || {}, n = Object.keys(DEALER_PERSONALITIES).filter(k => be[k]).length;
            hsSay('THE LEDGER', ['Column one: names. Column two: how many hands each of them dealt.', 'Your name is at the bottom. It was already there. The ink is still wet.',
                `Wins entered: ${meta.wins || 0}. Dealers crossed out: ${n}. Room left on the page: plenty.`], '#38bdf8'); return; }
    }
    if (o.t === 'coin') {
        d.pick[o.id] = hsDay(); globalMoney += o.amt; totalStats.moneyEarned += o.amt;
        updateMoneyDisplay(true); saveGame(); SFX.chip(); hsToast('+$' + o.amt); hsCash();
    } else if (o.t === 'scrap') {
        d.pick[o.id] = hsDay(); hsGain(o.k); hsChore('scrap'); SFX.chip(); hsToast('+1 ' + HS_SCRAP_NAME[o.k]);
    }
}
function hsA() { if (HS.menu) return; if (HS.dlg) { hsAdvance(); return; } if (HS.near) { hsAct(HS.near.act || HS.near.t === 'coin' || HS.near.t === 'scrap' ? HS.near : HS.near); } }

function hsLeaveTo(fn) { closeHouse(); houseReturn = true; try { Music.setScene('casino'); } catch (e) {} fn(); }
function hsMenuTab(tab) { closeHouse(); houseReturn = false; showMenu(); settings.lobbyTab = tab; showLobbyTab(tab); }

// ---------- loop ----------
function hsInputDir() {
    const k = HS.keys, p = HS.pad;
    let dx = 0, dy = 0, mag = 1;
    if (k.ArrowLeft || k.a || k.A || p.left) dx -= 1;
    if (k.ArrowRight || k.d || k.D || p.right) dx += 1;
    if (k.ArrowUp || k.w || k.W || p.up) dy -= 1;
    if (k.ArrowDown || k.s || k.S || p.down) dy += 1;
    if (!dx && !dy && HS.stick) { dx = HS.stick.x; dy = HS.stick.y; mag = HS.stick.m; }
    const t = HS.tap;
    if (!dx && !dy && t) {
        const tx = t.x - HS.x, ty = t.y - HS.y;
        if (HS.near && t.obj && HS.near === t.obj) { HS.tap = null; hsA(); return [0, 0, 1]; }
        if (Math.hypot(tx, ty) < 4 || (t.t -= 0.016) <= 0) HS.tap = null;
        else { const l = Math.hypot(tx, ty); dx = tx / l; dy = ty / l; }
    }
    return [dx, dy, mag];
}
function hsTick(ts) {
    if (!HS.on) return;
    const dt = Math.min(0.05, (ts - HS.last) / 1000 || 0.016); HS.last = ts; HS.t += dt;
    if (HS.cool > 0) HS.cool -= dt;
    if (HS.msgT > 0) { HS.msgT -= dt; if (HS.msgT <= 0) { const e = document.getElementById('house-toast'); if (e) e.classList.remove('show'); } }
    if (HS.flash > 0) HS.flash = Math.max(0, HS.flash - dt * 1.5);
    if (HS.dlg) { const D = HS.dlg, line = D.lines[D.i] || ''; if (D.pos < line.length) { D.pos = Math.min(line.length, D.pos + dt * 42); hsRenderDlg(); } }
    else if (!HS.menu) {
        const [dx, dy, mag] = hsInputDir();
        if (dx || dy) {
            const len = Math.hypot(dx, dy) || 1, sp = 58 * dt * (mag || 1);
            const mx = dx / len * sp, my = dy / len * sp;
            if (!hsBlocked(HS.x + mx, HS.y)) HS.x += mx;
            if (!hsBlocked(HS.x, HS.y + my)) HS.y += my;
            HS.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
            HS.walk += dt; HS.step += dt;
            if (HS.step > 0.3) { HS.step = 0; SFX.hover(); }
            HS.trailT -= dt; if (HS.trailT <= 0) { HS.trailT = 0.06; HS.trail.push({ x: HS.x, y: HS.y }); if (HS.trail.length > 22) HS.trail.shift(); }
        } else HS.walk = 0;
        hsFocus();
        if (HS.cool <= 0) {
            const r = { x: HS.x - 4, y: HS.y - 5, w: 8, h: 5 };
            const p = hsObjs.find(o => o.t === 'portal' && hsRectHit(r, o));
            if (p) hsEnter(p);
        }
    }
    hsHorror(dt);
    hsCam();
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
    let to = p.to, sx = p.sx, sy = p.sy;
    if (HS.map === 'WRONG' && to === 'HALL' && sanity <= 20 && Math.random() < 0.45) { to = 'WRONG'; sx = 9; sy = 11; setTimeout(() => hsSay('THE DOOR', ['It was a wall. Then it was a door again.', 'You are fairly sure this is the same room.'], '#e2e8f0'), 200); }
    hsLoad(to, sx, sy);
    const e = document.getElementById('house-room'); if (e) e.textContent = HOUSE_MAPS[to].name;
    const d = hsData();
    if (to === 'CELLAR' && !d.seen.cellarIn) { d.seen.cellarIn = 1; hsSay('THE CELLAR', ['The stair is longer than the house is tall.', 'Down here the air has a taste, like a coin held in the mouth.'], '#94a3b8'); }
    else if (to === 'WRONG' && !d.seen.wrongIn) { d.seen.wrongIn = 1; hsSay('THE HALL', ['It is the hall. It is exactly the hall.', 'Except that everyone here is facing you, and none of them has moved.'], '#e2e8f0'); }
    else if (to === 'HALL' && hsLate() && d.fx.lateDay !== hsDay()) { d.fx.lateDay = hsDay(); hsSay('3:00 AM', ['The windows are all looking in.', 'The radio is on. You did not turn it on.'], '#ef4444'); }
}

// ---------- input ----------
function hsKeyDown(e) {
    if (!HS.on) return;
    const k = e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'Escape', 'e', 'E', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(k)) { if (HS.menu && (k === 'Escape')) { e.preventDefault(); e.stopImmediatePropagation(); hsMenuClose(); return; } if (HS.menu) return; e.preventDefault(); e.stopImmediatePropagation(); }
    if (HS.menu) return;
    if (k === 'Escape') { if (HS.dlg) { HS.dlg.lines = ['']; HS.dlg.i = 0; HS.dlg.pos = 0; hsAdvance(); } else closeHouseBtn(); return; }
    if (k === ' ' || k === 'Enter' || k === 'e' || k === 'E') { if (e.repeat) return; hsA(); return; }
    HS.keys[k] = true;
}
function hsKeyUp(e) { if (HS.on) delete HS.keys[e.key]; }
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
    document.getElementById('house-a').addEventListener('pointerdown', ev => { ev.preventDefault(); hsA(); });
    document.getElementById('house-dlg').addEventListener('pointerdown', ev => { ev.preventDefault(); hsAdvance(); });
    const tg = document.getElementById('house-padtoggle');
    const setPad = on => { pad.classList.toggle('show-dpad', on); try { localStorage.setItem('malicex_hpad', on ? '1' : '0'); } catch (e) {} if (tg) tg.textContent = on ? 'PAD: ON' : 'PAD: OFF'; };
    let on = false; try { on = localStorage.getItem('malicex_hpad') === '1'; } catch (e) {}
    setPad(on); if (tg) tg.onclick = () => setPad(!pad.classList.contains('show-dpad'));
    // the room itself is the controller: drag anywhere to walk (a floating stick), tap a thing to use it, tap the floor to walk there
    const cv = document.getElementById('house-canvas'), ring = document.getElementById('house-stick');
    let s = null;
    const world = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) / r.width * VW + HS.cam.x, y: (ev.clientY - r.top) / r.height * VH + HS.cam.y }; };
    const showRing = (x, y, dx, dy) => { if (!ring) return; const r = cv.getBoundingClientRect(), v = document.getElementById('house-view').getBoundingClientRect(); ring.style.display = 'block'; ring.style.left = (x - v.left) + 'px'; ring.style.top = (y - v.top) + 'px'; const k = ring.firstElementChild; if (k) k.style.transform = `translate(${dx}px,${dy}px)`; };
    cv.addEventListener('pointerdown', ev => {
        if (HS.menu) return;
        if (HS.dlg) { hsAdvance(); return; }
        try { cv.setPointerCapture(ev.pointerId); } catch (e) {}
        s = { id: ev.pointerId, sx: ev.clientX, sy: ev.clientY, t0: performance.now(), drag: false };
    });
    cv.addEventListener('pointermove', ev => {
        if (!s || ev.pointerId !== s.id) return;
        const dx = ev.clientX - s.sx, dy = ev.clientY - s.sy, l = Math.hypot(dx, dy);
        if (!s.drag && l > 12) { s.drag = true; HS.tap = null; }
        if (s.drag) { const m = Math.min(1, l / 46); HS.stick = { x: dx / (l || 1), y: dy / (l || 1), m: Math.max(0.35, m) }; showRing(s.sx, s.sy, dx / (l || 1) * Math.min(l, 34), dy / (l || 1) * Math.min(l, 34)); }
    });
    const end = ev => {
        if (!s || (ev.pointerId !== undefined && ev.pointerId !== s.id)) return;
        HS.stick = null; if (ring) ring.style.display = 'none';
        if (!s.drag && performance.now() - s.t0 < 450 && ev.type === 'pointerup') {
            const w = world(ev);
            const hit = hsObjs.find(o => (o.act || ((o.t === 'coin' || o.t === 'scrap') && !hsPickDone(o))) && w.x >= o.x * TILE - 4 && w.x < (o.x + o.w) * TILE + 4 && w.y >= (o.y - 0.3) * TILE && w.y < (o.y + o.h) * TILE + 4);
            const catHit = HS.cat && Math.hypot(HS.cat.x - w.x, HS.cat.y - 6 - w.y) < 14;
            if (hit && HS.near === hit) hsA();
            else if (catHit && HS.near && HS.near.t === 'cat') hsA();
            else if (hit) HS.tap = { x: (hit.x + hit.w / 2) * TILE, y: (hit.y + hit.h) * TILE + 8, t: 3, obj: hit };
            else HS.tap = { x: w.x, y: w.y + 6, t: 3 };
        }
        s = null;
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    cv.addEventListener('contextmenu', ev => ev.preventDefault());
}

function hsFit() {
    const cv = document.getElementById('house-canvas'), wrap = document.getElementById('house-stage'); if (!cv || !wrap) return;
    const aw = wrap.clientWidth, ah = wrap.clientHeight; if (!aw || !ah) return;
    let s = aw / VW, vh = Math.floor(ah / s);
    if (vh < 208) { s = ah / 208; vh = 208; }
    vh = Math.min(vh, 416);
    VH = vh; cv.width = VW; cv.height = VH;
    cv.style.width = Math.floor(VW * s) + 'px'; cv.style.height = Math.floor(VH * s) + 'px';
    const vw = document.getElementById('house-view'); vw.style.width = cv.style.width; vw.style.height = cv.style.height;
    vw.style.setProperty('--hs', Math.max(0.6, Math.min(1.4, s / 2.2)));
    if (hsGrid) hsCam(true);
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
    document.body.classList.add('house-on'); activeGame = 'HOUSE'; HS.on = true; HS.keys = {}; HS.pad = {}; HS.dlg = null; HS.tap = null; HS.stick = null; HS.ghost = null; HS.t = 0; HS.menu = null; HS.black = 0; HS.blink = 0; HS.winT = 3; HS.melody = [];
    const mn = document.getElementById('house-menu'); if (mn) mn.classList.add('hidden');
    document.getElementById('house-dlg').classList.add('hidden');
    const d = hsData(), first = !d.seen.HALL;
    HS.dir = 'down';
    const keep = HS.x && HOUSE_MAPS[HS.map] && !(HS.map === 'CELLAR' && !meta.brassKey) && HS.map !== 'WRONG';
    hsBindPad(); hsFit();
    if (keep) { const x = HS.x, y = HS.y; hsLoad(HS.map); HS.x = x; HS.y = y; hsCam(true); } else hsLoad('HALL', 14, 11);
    document.getElementById('house-room').textContent = HOUSE_MAPS[HS.map].name;
    setTimeout(hsFit, 60);
    cancelAnimationFrame(HS.raf); HS.last = performance.now(); HS.raf = requestAnimationFrame(hsTick);
    if (first) hsSay('THE HOUSE', ['You thought it was one room.', 'It never was. Walk. Look. Talk to the ones who sit in the Row. They say more once you have beaten them.', 'Drag on the screen to walk, tap a thing to use it, or press A. There is a lot to do here. Not all of it is kind.'], '#38bdf8');
    else if (hsLate()) hsSay('3:00 AM', ['The house is awake too.'], '#ef4444');
}
function closeHouse() {
    HS.on = false; cancelAnimationFrame(HS.raf); HS.keys = {}; HS.pad = {}; HS.dlg = null; HS.menu = null; HS.stick = null;
    const mn = document.getElementById('house-menu'); if (mn) mn.classList.add('hidden');
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
// the side games have their own music, wherever you opened them from
['openBlackjack', 'openSlots', 'openCups', 'openHiLo'].forEach(n => {
    const orig = window[n]; if (typeof orig !== 'function') return;
    window[n] = function() { const r = orig.apply(this, arguments); try { Music.setScene('casino'); } catch (e) {} return r; };
});
['closeHiLo', 'closeBlackjack', 'closeSlots', 'closeCups'].forEach(n => {
    const orig = window[n];
    window[n] = function() { const was = houseReturn, r = orig.apply(this, arguments); try { if (!was) Music.setScene('menu'); } catch (e) {} return r; };
});
const _hsToggleShop = toggleShop;
toggleShop = function(show) {
    _hsToggleShop(show);
    if (!show && houseReturn) { houseReturn = false; openHouse(); }
};

// ---------- the house feeds the next run ----------
const _hsStartGame = startGame;
startGame = function() {
    _hsStartGame();
    const f = hsData().fx; let used = false;
    if (f.sanity) { setSanityDirect(Math.max(5, Math.min(100, sanity + f.sanity))); f.sanity = 0; used = true; }
    if (f.cash) { globalMoney += f.cash; if (typeof updateMoneyDisplay === 'function') updateMoneyDisplay(true); f.cash = 0; used = true; }
    if (f.reward) { f.live = f.reward; f.reward = 0; used = true; }
    if (used) { try { saveGame(); } catch (e) {} }
};
const _hsMult = rewardMult;
rewardMult = function() { const f = hsData().fx; return _hsMult() * (f.live || 1); };
const _hsAfter = afterResultHooks;
afterResultHooks = function(won) { const r = _hsAfter(won); hsData().fx.live = 0; return r; };

