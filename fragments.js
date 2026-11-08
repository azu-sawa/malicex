"use strict";

// =====================================================================
// FRAGMENT FILMS (Md8): every lore fragment that has a film plays it the
// first time you find it, and can be replayed from the Grimoire.
// New pixel scenes are drawn live on the same 128x72 cinema canvas.
// =====================================================================

// ---------- new scenes ----------
ART.hall = function(g, t) {
    cr(g, 0, 0, 128, 72, '#06080d'); cr(g, 0, 48, 128, 24, '#0e131c'); cr(g, 46, 24, 36, 26, '#090d15');
    g.strokeStyle = '#18202e'; g.lineWidth = 1;
    for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(64, 50); g.lineTo(i * 16, 72); g.stroke(); }
    for (let i = 0; i < 4; i++) {
        const w = 11 - i * 2, top = 14 + i * 4, bot = 60 - i * 3, xl = 3 + i * 10, xr = 125 - i * 10 - w;
        cr(g, xl, top, w, bot - top, CP.brown); cr(g, xr, top, w, bot - top, CP.brown);
        cr(g, xl + w - 3, (top + bot) / 2, 1, 2, CP.gold); cr(g, xr + 2, (top + bot) / 2, 1, 2, CP.gold);
    }
    const f = flick(t, 7);
    cr(g, 58, 28, 12, 22, '#2a1d12'); cr(g, 62, 28, 5, 22, 'rgba(251,191,36,' + (0.4 + 0.4 * f) + ')');
    const k = Math.floor(t / 3) % 5, s = 1 + k * 0.45, cx = 64 + (k % 2 ? 1 : 0);
    cr(g, cx - 1 * s, 50 - 12 * s, 3 * s, 3 * s, '#000'); cr(g, cx - 1.5 * s, 50 - 9 * s, 4 * s, 9 * s, '#000');
};
ART.window = function(g, t) {
    cr(g, 0, 0, 128, 72, '#05070b'); cr(g, 0, 62, 128, 10, '#0a0d14');
    cr(g, 30, 8, 68, 50, '#3a2a1c'); cr(g, 34, 12, 60, 42, '#0b1224');
    cc(g, 84, 22, 5, CP.bone); cc(g, 86, 21, 4, '#0b1224');
    if (Math.sin(t * 0.8) > -0.35) {
        cr(g, 52, 24, 22, 28, '#0c121c'); cr(g, 56, 32, 5, 4, CP.bone); cr(g, 66, 32, 5, 4, CP.bone);
        const px = Math.round(Math.sin(t * 0.7) * 1); cr(g, 58 + px, 33, 2, 2, '#000'); cr(g, 68 + px, 33, 2, 2, '#000'); cr(g, 58, 44, 10, 1, '#000');
    }
    cr(g, 63, 12, 2, 42, '#3a2a1c'); cr(g, 34, 32, 60, 2, '#3a2a1c'); cr(g, 26, 58, 76, 4, '#4d3824');
    const n = Math.floor(t * 1.5) % 24;
    for (let i = 0; i < n; i++) { const grp = Math.floor(i / 5), k = i % 5, x = 38 + (grp % 5) * 11 + (k < 4 ? k * 2 : 0), y = 14 + Math.floor(grp / 5) * 9; if (k < 4) cr(g, x, y, 1, 6, 'rgba(226,232,240,.55)'); else cr(g, x - 7, y + 3, 9, 1, 'rgba(226,232,240,.55)'); }
};
ART.bed = function(g, t) {
    cr(g, 0, 0, 128, 72, '#05070b'); cr(g, 0, 54, 128, 18, '#0a0d14');
    cr(g, 20, 40, 70, 6, '#3a2a1c'); cr(g, 20, 46, 4, 12, '#3a2a1c'); cr(g, 86, 46, 4, 12, '#3a2a1c');
    cr(g, 22, 34, 66, 7, '#8b95a5'); cr(g, 36, 30, 52, 11, '#475569'); cr(g, 24, 31, 12, 6, '#cbd5e1');
    const dy = Math.floor(Math.sin(t * 1.6) + 1.2); cr(g, 46, 27 - dy, 30, 5 + dy, '#3b4658');
    cr(g, 100, 14, 10, 42, '#02030a'); cr(g, 101, 6, 8, 9, '#02030a');
    if (flick(t, 5) > 0.97) { cr(g, 102, 9, 2, 2, CP.bone); cr(g, 106, 9, 2, 2, CP.bone); }
    cr(g, 6, 34, 4, 22, '#57534e'); cr(g, 3, 30, 10, 6, '#fde68a');
    g.fillStyle = 'rgba(253,230,138,' + (0.05 + 0.05 * flick(t, 9)) + ')'; g.beginPath(); g.arc(8, 36, 30, 0, 6.3); g.fill();
};
ART.phone = function(g, t) {
    cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 58, 128, 14, '#0a0d14');
    cr(g, 10, 48, 70, 4, '#4d3824'); cr(g, 14, 52, 3, 8, '#4d3824'); cr(g, 72, 52, 3, 8, '#4d3824');
    cr(g, 26, 38, 24, 10, '#1f2937'); cc(g, 38, 42, 4, '#0f172a'); cc(g, 38, 42, 1, CP.bone);
    cr(g, 20, 34, 34, 4, '#111827'); cr(g, 18, 31, 6, 8, '#111827'); cr(g, 50, 31, 6, 8, '#111827');
    const pull = Math.sin(t * 0.9) > 0.2 ? 3 : 0;
    for (let x = 54; x < 96; x++) { const y = 44 + Math.floor(5 * Math.sin((x - 54) / 42 * Math.PI)) - pull * (x > 80 ? 1 : 0); cr(g, x, y, 1, 1, '#1f2937'); }
    cr(g, 92, 10, 30, 52, CP.brown); cr(g, 96, 12, 2, 48, 'rgba(251,191,36,' + (0.3 + 0.5 * flick(t, 8)) + ')');
    if (pull) { cr(g, 95, 40, 6, 3, CP.bone); cr(g, 100, 39, 2, 5, CP.bone); }
};
ART.static = function(g, t) {
    cr(g, 0, 0, 128, 72, '#0a0f16');
    const s = Math.floor(t * 12);
    for (let i = 0; i < 280; i++) { const x = (i * 37 + s * 53) % 128, y = (i * 91 + s * 29) % 72; cr(g, x, y, 2, 1, (i % 3) ? '#64748b' : '#e2e8f0'); }
    cr(g, 0, (s * 5) % 72, 128, 3, 'rgba(255,255,255,.1)');
    cr(g, 50, 40, 28, 28, '#0b1220'); cr(g, 56, 24, 16, 16, '#e8c8a4'); cr(g, 52, 40, 24, 24, CP.cyan); cr(g, 59, 30, 3, 3, '#111827'); cr(g, 66, 30, 3, 3, '#111827');
    if (Math.floor(t) % 6 > 3) { cr(g, 84, 18, 12, 50, '#000'); cr(g, 86, 26, 3, 2, CP.bone); cr(g, 92, 26, 3, 2, CP.bone); }
};
ART.candles = function(g, t) {
    cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 50, 128, 22, '#0a0d14');
    cr(g, 58, 30, 12, 16, '#7f1d1d'); cr(g, 56, 36, 3, 10, '#991b1b'); cr(g, 69, 36, 3, 10, '#991b1b'); cr(g, 59, 26, 10, 6, '#991b1b');
    const out = Math.floor(t / 2) % 9;
    for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2, x = Math.round(64 + Math.cos(a) * 44), y = Math.round(47 + Math.sin(a) * 15);
        cr(g, x - 1, y, 3, 6, CP.bone);
        if (i !== out || (t % 2) < 1.2) { const f = flick(t + i, 10); cr(g, x, y - 3 - (f > 0.8 ? 1 : 0), 1, 3, CP.amber); cr(g, x, y - 1, 1, 1, CP.red); g.fillStyle = 'rgba(251,191,36,' + (0.04 * f) + ')'; g.beginPath(); g.arc(x, y, 9, 0, 6.3); g.fill(); }
        else cr(g, x, y - 2, 1, 2, '#475569');
    }
};

// ---------- new lore ----------
LORE_ENTRIES.push(
    { id: 60, text: '"The telephone only rings for people who are home."' },
    { id: 61, text: '"My bed is on the wrong side of the room. It has been since I came."' },
    { id: 62, text: '"A candle burns for every tenant. The wick is the person."' },
    { id: 63, text: '"Someone is counting the nights from outside the window."' },
    { id: 64, text: '"The Ward has no doors, only the room you wake in."' },
    { id: 65, text: '"I took the pills. The numbers were true. That was worse."' },
    { id: 66, text: '"Every night there is one more chair."' },
    { id: 67, text: '"Dawn is not the end of the night. It is the house deciding to let you see."' },
    { id: 68, text: '"The safe was never locked. I wanted a reason."' },
    { id: 69, text: '"The music box plays the last thing you heard before you came."' },
    { id: 70, text: '"Four portraits. I counted five frames."' },
    { id: 71, text: '"The chest is empty. That is what you take."' }
);
Object.assign(LORE_BY_ACH, { LANDLORD: 62, FIRST_LIGHT: 63, DAWN_BREAKS: 67, UNSEEN: 66, CAUGHT_3: 61, WARD_CLEAR: 64, NO_PILLS: 65, SAFE_CRACKED: 68, MUSIC_BOX: 69, FIVE_FRAMES: 70, LOCK_PICKED: 71, ANSWERED: 60 });

// ---------- the films ----------
// lore id -> cutscene id
const FRAG_FILMS = { 1: 'f_name', 3: 'f_wait', 5: 'f_prize', 8: 'f_reflect', 9: 'f_cards', 24: 'f_clocks', 25: 'f_left', 26: 'f_gaze', 29: 'f_count', 32: 'f_any',
    60: 'f_phone', 61: 'f_bed', 62: 'f_wicks', 63: 'f_window', 64: 'f_ward', 65: 'f_coat', 66: 'f_chair', 67: 'f_dawn', 68: 'f_safe', 69: 'f_box', 70: 'f_frames', 71: 'f_chest' };
const FRAG_TITLES = { f_name: 'UNDER THE TABLE', f_wait: 'THE WAITING ROOM', f_prize: 'THE PRIZE', f_reflect: 'A HALF-SECOND LATE', f_cards: 'RED SUITS', f_clocks: 'FIVE CLOCKS',
    f_left: 'YOU LEFT', f_gaze: 'HOLD IT', f_count: 'THE COUNT', f_any: 'ANY TIME', f_phone: 'THE RECEIVER', f_bed: 'THE OTHER SIDE OF THE BED', f_wicks: 'WICKS',
    f_window: 'THE WINDOW COUNTS', f_ward: 'THE WARD', f_coat: 'WHITE COAT', f_chair: 'THE EXTRA CHAIR', f_dawn: 'DAWN, LATE', f_safe: 'COMBINATION', f_box: 'THE MUSIC BOX',
    f_frames: 'FIVE FRAMES', f_chest: 'WHAT IS IN THE CHEST' };

Object.assign(CINE_SCRIPTS, {
    f_name: { shots: [
        { art: 'table', text: ['You crawled under the table to pick up a card.', 'The wood down there is soft with names.'] },
        { art: 'hands', text: ['Hundreds. Pen, knife, thumbnail.', 'Some are in handwriting you almost recognise.'] },
        { art: 'black', text: ['Yours is near the edge. {name}. It has a date.', 'The ink is still wet.'] }] },
    f_wait: { shots: [
        { art: 'clock', text: ['Everyone here is waiting for a number to be called.', 'No one has seen the desk.'] },
        { art: 'chair', text: ['You ask the man beside you what he is waiting for.', '"Same as you," he says. "To be late."'] },
        { art: 'door', text: ['His watch says {time}. Yours says {time}.', 'The door says nothing at all.'] }] },
    f_prize: { shots: [
        { art: 'dealer', text: ['He won once. He tells it like a joke.'] },
        { art: 'mirror', text: ['The prize was a mask.', 'It fit before he put it on.'] },
        { art: 'black', text: ['He still has not taken it off.', 'He says that is the prize.'] }] },
    f_reflect: { shots: [
        { art: 'mirror', text: ['Your reflection is a half-second late.', 'You wave. It thinks about it.'] },
        { art: 'mirror', text: ['Tonight it is early.'] },
        { art: 'black', text: ['You stop looking.', 'It does not.'] }] },
    f_cards: { shots: [
        { art: 'cards', text: ['You deal yourself a hand. The hearts are wet.'] },
        { art: 'hands', text: ['You check your palms. Clean.', 'You check again.'] },
        { art: 'table', text: ['Under the candle, a little red pools at the edge of the cloth.', 'It is the only warm thing in the room.'] }] },
    f_clocks: { shots: [
        { art: 'clock', text: ['The kitchen clock says 3:07. The hall clock says 11:40.'] },
        { art: 'clock', text: ['Your wrist says {time}.', 'The radio gives a time that has not happened yet.'] },
        { art: 'black', text: ['You ask the house which one is right.', '"All of them," it says. That is how you know you are inside.'] }] },
    f_left: { shots: [
        { art: 'door', text: ['You left in the middle of a hand. You were so sure.'] },
        { art: 'chair', text: ['When you came back the chair was warm.', 'The cards lay face down, in your order.'] },
        { art: 'dealer', text: ['"You were gone eleven seconds," he says.', 'You counted nine days.'] }] },
    f_gaze: { shots: [
        { art: 'portrait', text: ['Someone told you sanity is how long you can hold a gaze.'] },
        { art: 'mirror', text: ['You hold the dealer\'s. Ten seconds. Twenty.'] },
        { art: 'black', text: ['At forty you realise he is not holding yours.', 'He is holding what is behind it.'] }] },
    f_count: { shots: [
        { art: 'table', text: ['You count the dealers on the way out. Eight.'] },
        { art: 'hall', text: ['You count again from the other end. Nine.'] },
        { art: 'black', text: ['You stop counting.', 'A voice a little behind you says "Ten."', 'It sounds like you.'] }] },
    f_any: { shots: [
        { art: 'door', text: ['The door is not locked. It never was.'] },
        { art: 'hall', text: ['You stand with your hand on the brass for a long time.'] },
        { art: 'chair', text: ['Behind you the chair makes the sound of being sat in.', '"Take your time," says nobody. "I will keep it warm."'] }] },
    f_phone: { shots: [
        { art: 'phone', text: ['The telephone only rings for people who are home.', 'You have never been so sure you are not.'] },
        { art: 'phone', text: ['You pick up. Your own voice, very calm:', '"Do not turn around."'] },
        { art: 'hall', text: ['You do not. You watch the cord.', 'It runs down the hall to a door, and under it, and it is pulled tight.'] }] },
    f_bed: { shots: [
        { art: 'bed', text: ['Your bed is on the wrong side of the room.', 'It has been since you arrived.'] },
        { art: 'bed', text: ['Tonight there is a shape in it.', 'Breathing slowly, the way you breathe when you are pretending.'] },
        { art: 'black', text: ['You stand over it for a long time.', 'You wonder which of you is going to wake up.'] }] },
    f_wicks: { shots: [
        { art: 'candles', text: ['A candle burns for every tenant.', 'The wick is the person.'] },
        { art: 'candles', text: ['One has been burning shorter than the others.', 'You know whose it is. You do not know how.'] },
        { art: 'chair', text: ['You relight it. You tell yourself it is kindness.', 'The flame leans toward you.'] }] },
    f_window: { shots: [
        { art: 'window', text: ['Someone is outside the Study window.', 'Not looking in. Counting.'] },
        { art: 'window', text: ['Tally marks on the glass, in fives.', 'They are on the inside.'] },
        { art: 'black', text: ['It is counting the nights you have been here.', 'It has reached a number you did not know.'] }] },
    f_ward: { shots: [
        { art: 'static', text: ['The ward has no doors. Only the room you wake in.'] },
        { art: 'static', text: ['A woman in white tells you, kindly, that you have been here before.'] },
        { art: 'hands', text: ['She holds out two cups. "Which of us is the patient?"', '"Take your time, {name}."'] }] },
    f_coat: { shots: [
        { art: 'hands', text: ['You took the pills. The numbers on the table were true.'] },
        { art: 'table', text: ['It was worse.', 'You could finally see how few shells were left, and how many were for you.'] },
        { art: 'black', text: ['Clarity is not a kindness.', 'It is just light.'] }] },
    f_chair: { shots: [
        { art: 'chair', text: ['Every night there is one more chair at the table.'] },
        { art: 'chair', text: ['No one moves it. No one admits to counting.'] },
        { art: 'mirror', text: ['Tonight you sit in the new one.', 'It fits. It was always going to fit.'] }] },
    f_dawn: { shots: [
        { art: 'sunrise', text: ['Dawn is not the end of the night.', 'It is the house deciding to let you see.'] },
        { art: 'hall', text: ['In the light the hall is smaller.', 'Everything you ran from is shorter than you thought.'] },
        { art: 'black', text: ['That is the horror of it.', 'Nothing chasing you was ever large.'] }] },
    f_safe: { shots: [
        { art: 'hands', text: ['You turn the dial with a stranger\'s patience.'] },
        { art: 'door', text: ['It opens. It was never locked.', 'You wanted a reason to be inside.'] },
        { art: 'black', text: ['There is nothing in it but a card.', '"Well done. Now put it back."'] }] },
    f_box: { shots: [
        { art: 'table', text: ['The music box plays the last thing you heard before you came.'] },
        { art: 'clock', text: ['You never knew what it was. You know now.', 'It was a door closing, softly, behind you.'] },
        { art: 'black', text: ['The tune starts again. Slower.', 'Like someone learning it.'] }] },
    f_frames: { shots: [
        { art: 'portrait', text: ['Four portraits. You count five frames.'] },
        { art: 'portrait', text: ['The fifth is covered with a sheet.', 'It is the right size for you.'] },
        { art: 'mirror', text: ['You lift the sheet an inch.', 'The glass behind it is a mirror. Of course it is.'] }] },
    f_chest: { shots: [
        { art: 'pocket', text: ['The chest is empty. That is what you take.'] },
        { art: 'hands', text: ['You carry it up the stairs the way you carry something full.'] },
        { art: 'black', text: ['It gets heavier with every step.', 'Someone is putting things into it, one at a time.'] }] },
    // the Long Night and the Ward
    ln_begin: { shots: [
        { art: 'hall', text: ['The bell rings once. The house pulls in its breath.', 'Everyone you beat is awake.'] },
        { art: 'moon', text: ['Until dawn nothing here is a guest.', 'Keep the light. Keep moving. Do not count the footsteps.'] }] },
    ln_dawn: { shots: [
        { art: 'sunrise', text: ['The light comes in sideways.', 'They are all back in their chairs, perfectly still, pretending.'] },
        { art: 'hall', text: ['You are still counting your steps.', 'You will be for a while.'] }] },
    ln_taken: { shots: [
        { art: 'bed', text: ['You wake in the Study. It is not morning.', 'There is a dent in the chair beside you.'] },
        { art: 'black', text: ['It is still warm.'] }] },
    ward_in: { shots: [
        { art: 'static', text: ['The room is white. The door is white.', 'The nurse says your name and you are sure it is yours.'] },
        { art: 'hands', text: ['"Only two rules," she says. "Take what helps. Remember what it cost."'] }] },
    ward_out: { shots: [
        { art: 'hands', text: ['You sign something. You do not read it.', 'The pen is warm.'] },
        { art: 'black', text: ['Outside, the corridor is exactly as you left it.', 'That is the first thing that frightens you.'] }] }
});
[['ln_begin', 'THE BELL', 'The Long Night'], ['ln_dawn', 'LIGHT, SIDEWAYS', 'The Long Night'], ['ln_taken', 'THE WARM DENT', 'The Long Night'],
 ['ward_in', 'THE WHITE ROOM', 'The Ward'], ['ward_out', 'DISCHARGED', 'The Ward']].forEach(c => CINE_LIST.push(c));
Object.keys(FRAG_TITLES).forEach(id => CINE_LIST.push([id, FRAG_TITLES[id], 'Fragment film']));

// ---------- playing them ----------
const FRAG = { cool: 0, timer: 0 };
function fragHasFilm(id) { return !!FRAG_FILMS[id]; }
function fragRestore() { try { return (activeGame === 'HOUSE' && HOUSE_MAPS[HS.map]) ? (HOUSE_MAPS[HS.map].song || 'menu') : 'menu'; } catch (e) { return 'menu'; } }
function playFragFilm(loreId, done) {
    const id = FRAG_FILMS[loreId];
    if (!id || CINE.on) { if (done) done(); return; }
    const inMenu = activeGame === 'MENU', inHouse = activeGame === 'HOUSE' && !HS.menu;
    if (inMenu) document.getElementById('main-menu').classList.add('hidden');
    if (inHouse) HS.menu = { film: 1 };
    cinePlay(id, () => {
        if (inMenu) { document.getElementById('main-menu').classList.remove('hidden'); try { updateTexts(); } catch (e) {} }
        if (inHouse && HS.menu && HS.menu.film) HS.menu = null;
        FRAG.cool = Date.now() + 15000; if (done) done();
    }, { replay: true, restore: fragRestore() });
}
function fragPending() {
    const seen = meta.cineSeen || {};
    return Object.keys(FRAG_FILMS).map(Number).sort((a, b) => a - b).find(l => unlockedLore.includes(l) && !seen[FRAG_FILMS[l]]);
}
// fragments you already had before the films existed are not forced on you; they wait in the Grimoire
function fragBaseline() {
    if (meta.fragBase) return;
    meta.fragBase = 1; meta.cineSeen = meta.cineSeen || {};
    unlockedLore.forEach(l => { if (FRAG_FILMS[l] && !meta.cineSeen[FRAG_FILMS[l]]) (meta.fragWaiting = meta.fragWaiting || {})[FRAG_FILMS[l]] = 1; });
    try { saveGame(); } catch (e) {}
}
function fragWatch() {
    if (CINE.on || Date.now() < FRAG.cool) return;
    if (typeof meta === 'undefined' || !meta) return;
    fragBaseline();
    const seen = meta.cineSeen || {}, wait = meta.fragWaiting || {};
    const l = Object.keys(FRAG_FILMS).map(Number).sort((a, b) => a - b).find(x => unlockedLore.includes(x) && !seen[FRAG_FILMS[x]] && !wait[FRAG_FILMS[x]]);
    if (!l) return;
    const free = (activeGame === 'MENU' && !document.getElementById('main-menu').classList.contains('hidden') && !document.querySelector('#name-screen:not(.hidden)') && !document.querySelector('#shop-menu:not(.hidden)'))
        || (activeGame === 'HOUSE' && !HS.dlg && !HS.menu && !(typeof LN !== 'undefined' && LN.on));
    if (!free) return;
    FRAG.cool = Date.now() + 8000;
    try { SFX.whisper && SFX.whisper(); } catch (e) {}
    playFragFilm(l);
}
setInterval(fragWatch, 2000);
// a puzzle or a night just handed you a fragment: play its film right away
function fragGive(id) {
    if (!unlockedLore.includes(id)) { unlockedLore.push(id); try { checkLoreTrophies(); } catch (e) {} saveGame(); try { log('LORE FRAGMENT FOUND', 'text-purple-400'); } catch (e) {} }
    FRAG.cool = 0;
}
function fragMissing() { return LORE_ENTRIES.map(l => l.id).filter(i => !unlockedLore.includes(i)); }

// trophies for watching
const _fragPlay = cinePlay;
cinePlay = function(id, done, opts) {
    const r = _fragPlay(id, done, opts);
    try {
        const seen = meta.cineSeen || {}, n = Object.keys(FRAG_TITLES).filter(k => seen[k]).length;
        if (n >= 5) unlockAchievement('FILM_5');
        if (n >= Object.keys(FRAG_TITLES).length) unlockAchievement('FILM_ALL');
    } catch (e) {}
    return r;
};
