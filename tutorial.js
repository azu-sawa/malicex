"use strict";

// =====================================================================
// TUTORIAL (v10): a 6-page guide + coach marks during the first hand,
// plus the item info strip (tap to read, tap again to use).
// =====================================================================
const TUT_PAGES = [
    { i: 'skull', t: 'THE GOAL', b: [
        'Each hand has two parts: a short poker round, then a shotgun duel.',
        'Reduce the dealer\'s HP to zero before yours runs out.',
        'Your HP and the dealer\'s HP are the pips under their names.'] },
    { i: 'card', t: 'PART 1: POKER', b: [
        'You and the dealer each hold 2 cards. Five shared cards appear in the middle.',
        'Press the big button to deal the turn, the river, then the showdown. Best hand wins.',
        'Win: you get a reward item and shoot first. Lose: the dealer profits and shoots first.',
        'RAISE costs 10 Sanity for a bigger payout. REDRAW swaps your cards once. FOLD ends the hand early.'] },
    { i: 'bolt', t: 'PART 2: THE SHOTGUN', b: [
        'The gun is loaded with a hidden mix of LIVE and BLANK shells. The counts are shown. The order is not.',
        'SHOOT ENEMY: a live shell hurts him, a blank passes the turn.',
        'SHOOT SELF: a blank keeps the turn for you. A live shell hurts you.',
        'Count what is left. Every shell fired changes the odds.'] },
    { i: 'eye', t: 'ITEMS', b: [
        'You can carry 5 items. Tap an item to read what it does. Tap it again to use it.',
        'On a keyboard: hover to read, click to use, or press Q W E R T.',
        'Items cost nothing to use unless the text says Sanity. You win items at poker.',
        'The Grimoire in the Archive tab lists every item you have found.'] },
    { i: 'brain', t: 'SANITY', b: [
        'The bar in the corner is your mind. Raising, a few items and live hits cost it.',
        'Low Sanity makes the house lie: wrong tells, items that are not there, voices.',
        'Steady means safe. Sedatives, Cigarettes and safe blanks bring it back.',
        'At zero you are not dead, but you will not trust your own eyes.'] },
    { i: 'trophy', t: 'KEEP PLAYING', b: [
        'Win in a row to build a streak: +10% cash per win, up to +50%.',
        'Three contracts every day pay extra. Trophies have hints even when locked.',
        'The game saves itself. Use SYSTEM > EXPORT CODE if you want a backup.',
        'Something sits at the end of all this. Collect endings and lore pages to find it.'] }
];

let tutIdx = 0;

function openTutorial() {
    tutIdx = 0;
    const s = document.getElementById('tutorial-screen');
    if (!s) return;
    document.getElementById('main-menu').classList.add('hidden');
    s.classList.remove('hidden');
    activeGame = 'TUTORIAL';
    renderTutorial();
}

function closeTutorial() {
    document.getElementById('tutorial-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    activeGame = 'MENU';
}

function tutStep(d) {
    tutIdx = Math.max(0, Math.min(TUT_PAGES.length - 1, tutIdx + d));
    SFX.click();
    renderTutorial();
}

function renderTutorial() {
    const p = TUT_PAGES[tutIdx];
    document.getElementById('tut-icon').innerHTML = px(p.i, 'px-xl');
    document.getElementById('tut-title').textContent = p.t;
    document.getElementById('tut-body').innerHTML = p.b.map(x => `<p>${x}</p>`).join('');
    document.getElementById('tut-count').textContent = (tutIdx + 1) + ' / ' + TUT_PAGES.length;
    document.getElementById('tut-prev').disabled = tutIdx === 0;
    const nx = document.getElementById('tut-next');
    nx.textContent = tutIdx === TUT_PAGES.length - 1 ? 'DONE' : 'NEXT';
    nx.onclick = () => tutIdx === TUT_PAGES.length - 1 ? closeTutorial() : tutStep(1);
}

document.addEventListener('keydown', e => {
    if (activeGame !== 'TUTORIAL') return;
    if (e.key === 'ArrowRight') tutStep(1);
    else if (e.key === 'ArrowLeft') tutStep(-1);
    else if (e.key === 'Escape') closeTutorial();
});

// ---------- coach marks during the first hand ----------
const COACH = {
    poker: { target: '#community-cards', t: 'POKER FIRST',
        b: 'Five shared cards will appear here. Press the button below to deal them. The better hand wins items and shoots first.' },
    controls: { target: '#controls', t: 'YOUR BUTTONS',
        b: 'The button is the only thing you need to start. RAISE costs Sanity for a bigger payout. FOLD ends the hand early.' },
    shoot: { target: '#gun-ui-panel', t: 'THE SHOTGUN',
        b: 'The numbers show how many LIVE and BLANK shells are loaded. You do not know the order. Shoot the dealer to hurt him. Shoot yourself: a blank keeps your turn, a live shell hurts you.' },
    items: { target: '#player-items-row', t: 'ITEMS',
        b: 'Tap an item to read it. Tap again to use it. They are your edge: peek the shell, saw the barrel, cuff the dealer.' },
    sanity: { target: '#sanity-hud', t: 'SANITY',
        b: 'This is your mind. When it drops, the house starts lying to you. Keep it steady.' }
};

let coachOpen = false;
function coach(key, after) {
    if (key === 'items' && !(state.playerItems && state.playerItems.length)) { if (after) after(); return; }
    if (settings.tutorial || coachOpen || !COACH[key] || (settings.seenHints && settings.seenHints[key])) { if (after) after(); return; }
    if (currentDifficulty !== 'NORMAL' && currentDifficulty !== 'DAILY') { if (after) after(); return; }
    const c = COACH[key], box = document.getElementById('coach'), tgt = document.querySelector(c.target);
    if (!box) { if (after) after(); return; }
    coachOpen = true;
    stopTurnTimer();
    document.getElementById('coach-title').textContent = c.t;
    document.getElementById('coach-text').textContent = c.b;
    box.classList.remove('hidden');
    if (tgt) tgt.classList.add('coach-target');
    const place = () => {
        if (!tgt) return;
        const r = tgt.getBoundingClientRect(), h = box.offsetHeight || 150;
        const below = r.bottom + h + 16 < window.innerHeight;
        box.style.top = (below ? r.bottom + 12 : Math.max(8, r.top - h - 12)) + 'px';
    };
    place();
    const close = (skipAll) => {
        box.classList.add('hidden');
        if (tgt) tgt.classList.remove('coach-target');
        coachOpen = false;
        settings.seenHints = settings.seenHints || {};
        settings.seenHints[key] = 1;
        if (skipAll) settings.tutorial = true;
        if (key === 'shoot' || skipAll) { if (!skipAll) unlockAchievement('ORIENTATION'); }
        if (Object.keys(settings.seenHints).length >= 4) settings.tutorial = true;
        saveSettings();
        SFX.click();
        if (after) after();
    };
    document.getElementById('coach-ok').onclick = () => close(false);
    document.getElementById('coach-skip').onclick = () => close(true);
}

// ---------- item info strip ----------
let itemSel = { i: -1, key: '' };

function coarsePointer() { return window.matchMedia && window.matchMedia('(hover: none)').matches; }

function showItemInfo(key, selected) {
    const el = document.getElementById('item-info');
    if (!el) return;
    if (!key) {
        el.className = 'item-info idle';
        el.textContent = (state.playerItems && state.playerItems.length)
            ? (coarsePointer() ? 'Tap an item to read it. Tap again to use it.' : 'Hover an item to read it. Click to use it.')
            : 'No items. Win poker hands to earn some.';
        return;
    }
    const d = ITEMS[key === 'PHANTOM' ? (state.phantomDisguise || 'GLASS') : key];
    const cost = d.sanityCost ? ` <span class="ii-cost">-${d.sanityCost} Sanity</span>` : (d.sanityGain ? ` <span class="ii-gain">+${d.sanityGain} Sanity</span>` : '');
    el.className = 'item-info' + (selected ? ' picked' : '');
    el.innerHTML = `<b class="${d.color}">${d.en.n}</b>${cost}<span class="ii-desc">${d.en.d}</span>` +
        (selected && coarsePointer() ? '<span class="ii-use">Tap again to use</span>' : '');
}

function itemTap(i, key, btn) {
    if (coarsePointer()) {
        if (itemSel.i !== i || itemSel.key !== key) {
            itemSel = { i, key };
            document.querySelectorAll('#player-items-row .item-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            showItemInfo(key, true);
            SFX.hover();
            buzz(12);
            return;
        }
    }
    itemSel = { i: -1, key: '' };
    useItem('player', key, i);
}
