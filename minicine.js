"use strict";

// =====================================================================
// MINIGAME CUTSCENES: a short pixel scene the first time you sit at each
// side table, plus two that only fire when something big happens at one
// (a jackpot, or going broke). Re-watchable from the CINEMA box.
// Uses the cinema engine in cinema.js (ART functions + CINE_SCRIPTS).
// =====================================================================
function mcCard(g, x, y, w, h, face, c) {
    cr(g, x, y, w, h, CP.bone); cr(g, x, y, w, 1, '#94a3b8'); cr(g, x, y + h - 1, w, 1, '#94a3b8');
    if (face) { cr(g, x + 2, y + 2, 3, 3, c || CP.dgray); cr(g, x + w - 5, y + h - 5, 3, 3, c || CP.dgray); cr(g, x + w / 2 - 2, y + h / 2 - 2, 4, 4, c || CP.dgray); }
    else { cr(g, x + 2, y + 2, w - 4, h - 4, CP.navy2); cr(g, x + 4, y + 4, w - 8, h - 8, CP.cyan); }
}

Object.assign(ART, {
    felt(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 36, 128, 36, '#0d3b2e'); cr(g, 0, 36, 128, 1, '#145a45');
        cc(g, 64, 8, 5, CP.dgray); cr(g, 52, 12, 24, 22, CP.dgray); cr(g, 58, 18, 3, 3, CP.red); cr(g, 67, 18, 3, 3, CP.red);   // dealer, only eyes
        const s = Math.min(1, t / 1.2);
        mcCard(g, 40, 44, 14, 20, true, CP.dgray); mcCard(g, 58, 44 - Math.sin(t * 2) * 1, 14, 20, true, CP.red);
        mcCard(g, 82, 8, 12, 17, false); mcCard(g, 96, 8, 12, 17, true, CP.dgray);
        for (let i = 0; i < 5; i++) cr(g, 8, 62 - i * 3, 14, 3, i % 2 ? CP.gold : CP.red);
        cr(g, 100, 54, 10, 12, CP.brown); cr(g, 101, 50, 8, 3, CP.amber);
        cr(g, 0, 0, 128, Math.round(8 * (1 - s)), '#000');
    },
    reels(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 30, 8, 68, 58, CP.red); cr(g, 32, 10, 64, 54, '#7f1d1d'); cr(g, 36, 18, 56, 26, CP.bone);
        const sym = [CP.red, CP.amber, CP.cyan, CP.dgray, CP.gold];
        for (let r = 0; r < 3; r++) {
            const off = Math.floor(t * (14 + r * 6)) % 5;
            for (let k = 0; k < 2; k++) {
                const c = sym[(off + k + r) % 5];
                cc(g, 46 + r * 18, 25 + k * 11, 4, c);
            }
            cr(g, 54 + r * 18 - 1, 18, 1, 26, '#94a3b8');
        }
        cr(g, 40, 50, 48, 8, CP.dgray);
        for (let i = 0; i < 6; i++) cr(g, 42 + i * 8, 52, 4, 4, Math.floor(t * 6) % 6 === i ? CP.amber : CP.brown);
        cr(g, 104, 24, 3, 22, CP.gray); const p = Math.floor((Math.sin(t * 2) + 1) * 6); cc(g, 105, 22 + p, 5, CP.red);
    },
    cups(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 48, 128, 24, CP.brown); cr(g, 0, 48, 128, 1, '#7c5a3a');
        const sw = Math.sin(t * 3);
        const xs = [28 + sw * 24, 56, 84 - sw * 24];
        xs.forEach((x, i) => { const y = 24 + Math.abs(Math.sin(t * 6 + i)) * 2; cr(g, x - 9, y, 18, 24, CP.bone); cr(g, x - 7, y + 3, 14, 3, CP.gray); cr(g, x - 11, y + 22, 22, 4, CP.gray); });
        cc(g, 56, 56, 3, CP.red);
        cr(g, 108 + Math.sin(t * 3) * 3, 28, 6, 14, '#c8a98c');
    },
    hilo(g, t) {
        cr(g, 0, 0, 128, 72, CP.bg); cr(g, 0, 56, 128, 16, '#0d3b2e');
        mcCard(g, 26, 14, 28, 40, true, CP.dgray); mcCard(g, 74, 14, 28, 40, false);
        const a = Math.floor(t * 3) % 2;
        for (let i = 0; i < 5; i++) { cr(g, 62 - i, (a ? 24 : 40) + (a ? i : -i), 1 + i * 2, 1, CP.amber); }
        cr(g, 62, 26, 4, 20, CP.dgray);
    },
    jackpot(g, t) {
        cr(g, 0, 0, 128, 72, CP.navy);
        for (let i = 0; i < 46; i++) { const x = (i * 29) % 128, y = ((i * 17 + t * 60 + (i % 3) * 20) % 80) - 6; cr(g, x, y, 4, 3, i % 2 ? CP.gold : CP.amber); cr(g, x + 1, y, 2, 1, CP.bone); }
        cr(g, 40, 30, 48, 20, CP.red); [0, 1, 2].forEach(k => cr(g, 44 + k * 14, 34, 10, 12, CP.bone));
        cr(g, 52, 36, 2, 8, CP.red); cr(g, 66, 36, 2, 8, CP.red); cr(g, 80, 36, 2, 8, CP.red);
    },
    ruin(g, t) {
        cr(g, 0, 0, 128, 72, '#07090d');
        cr(g, 30, 30, 68, 36, CP.brown); cr(g, 30, 30, 68, 3, '#7c5a3a'); cr(g, 36, 36, 56, 24, '#000');   // empty wallet, open
        const o = Math.floor(t * 1.5) % 6 ? 1 : 0; cc(g, 64, 48, 3, o ? CP.gold : '#000');
        cr(g, 52, 4, 24, 20, CP.dgray); cr(g, 57, 11, 4, 3, CP.red); cr(g, 67, 11, 4, 3, CP.red);
    }
});

CINE_SCRIPTS.mini_bj = { shots: [
    { art: 'felt', text: ['Twenty-one. The oldest rule in the building.', 'The dealer does not blink. He does not need to.'] },
    { art: 'cards', text: ['"Get close," says the house. "Closer. I like when you almost have it."'] }] };
CINE_SCRIPTS.mini_slots = { shots: [
    { art: 'reels', text: ['The machine was here before the table.', 'Nobody remembers who plugged it in.'] },
    { art: 'black', text: ['Every pull costs a little more than money.', 'The reels never lie. They just do not tell you what they cost.'] }] };
CINE_SCRIPTS.mini_cups = { shots: [
    { art: 'cups', text: ['Three cups. One small red bead.', '"Follow it," says a hand that is not attached to anything you can see.'] },
    { art: 'hands', text: ['You are not watching the cups.', 'You are watching the fingers. That is where the trick is.'] }] };
CINE_SCRIPTS.mini_hilo = { shots: [
    { art: 'hilo', text: ['Higher. Lower. A question you have been answering all your life.', 'The card is already turned. You are only guessing at what is already true.'] }] };
CINE_SCRIPTS.mini_jackpot = { shots: [
    { art: 'jackpot', text: ['Three of a kind, and the whole machine screams.', 'Somewhere below, a ledger adds a line next to your name.'] },
    { art: 'black', text: ['"Lucky," says the house.', 'It says it the way you say it about a stray dog that follows you home.'] }] };
CINE_SCRIPTS.mini_ruin = { shots: [
    { art: 'ruin', text: ['You turn out your pockets. There is a button, and lint, and a coin you thought was gone.', 'The dealer looks at your hands the way a tailor looks at a customer.'] },
    { art: 'black', text: ['"Do not worry," he says. "There is always the other game."', 'The big one. The one with the shotgun.'] }] };
CINE_LIST.push(['mini_bj', 'TWENTY-ONE', 'Blackjack table'], ['mini_slots', 'THE MACHINE', 'Slots'], ['mini_cups', 'THE FINGERS', 'Cups'],
               ['mini_hilo', 'HIGHER OR LOWER', 'Hi-Lo'], ['mini_jackpot', 'THE LEDGER', 'Jackpot'], ['mini_ruin', 'LINT', 'Going broke']);

// ---- first sit-down at each table
function wrapOpen(fnName, id) {
    const orig = window[fnName];
    window[fnName] = function() { const a = arguments; cineOnce(id, () => orig.apply(null, a)); };
}
['openBlackjack:mini_bj', 'openSlots:mini_slots', 'openCups:mini_cups', 'openHiLo:mini_hilo'].forEach(x => { const [f, id] = x.split(':'); wrapOpen(f, id); });

// ---- jackpot (slots, 25x or better) + ruin (cash hits 0 at a side table)
const _mcCalcSlot = calcSlotWin;
calcSlotWin = function(r) {
    const before = globalMoney;
    const out = _mcCalcSlot(r);
    if (globalMoney - before >= slotState.bet * 25) setTimeout(() => { if (activeGame === 'SLOTS') cineOnce('mini_jackpot'); }, 1400);
    return out;
};
let mcLast = null;
setInterval(() => {
    const side = ['SLOTS', 'HILO', 'BLACKJACK', 'CUPS'].includes(activeGame);
    if (side && mcLast > 0 && globalMoney <= 0 && !CINE.on) cineOnce('mini_ruin');
    mcLast = globalMoney;
}, 900);
