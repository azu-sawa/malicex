"use strict";

// =====================================================================
// PROGRESS (Mu-delta): run terms, Marks and perks, the collection page,
// the hall of hands, the share card, and new trophies / lore.
// Loaded after sin.js, habit.js and underside.js.
// =====================================================================

// ---------- TERMS: side bets you set before a run ----------
const TERMS = {
    PAPER:  { n: 'PAPER SKIN', d: 'You are capped at 3 HP. The dealer keeps his normal HP.', m: 0.6 },
    EMPTY:  { n: 'EMPTY POCKETS', d: 'Poker wins give no items. Only what you steal or earn elsewhere.', m: 0.4 },
    BLIND:  { n: 'BLIND TRUST', d: 'The LIVE and BLANK counts are hidden. Count the shells.', m: 0.6 },
    CLOCK:  { n: 'SHORT FUSE', d: 'Every one of your turns has an 8 second timer.', m: 0.6 },
    DOUBLE: { n: 'DOUBLE OR NOTHING', d: 'Every live shell deals +1 damage. To both of you.', m: 0.5 },
    SEEN:   { n: 'THE HOUSE PEEKS', d: 'The dealer always knows the next shell.', m: 0.6 }
};
const MAX_TERMS = 2;

function hasTerm(k) { return !!(state && state.terms && state.terms.includes(k)); }
function termMult() { return 1 + (state && state.terms ? state.terms.reduce((a, k) => a + (TERMS[k] ? TERMS[k].m : 0), 0) : 0); }

function toggleTerm(k) {
    const t = settings.terms || (settings.terms = []);
    const i = t.indexOf(k);
    if (i >= 0) t.splice(i, 1);
    else if (t.length < MAX_TERMS) t.push(k);
    else { SFX.empty(); setMenuMsg('Two terms at most.'); return; }
    saveSettings(); SFX.click(); renderTermsBox();
}
function setMenuMsg(t) { const m = document.getElementById('menu-msg'); if (m) m.textContent = t; }

function renderTermsBox() {
    const box = document.getElementById('terms-box');
    if (!box) return;
    const on = settings.terms || [];
    const bonus = on.reduce((a, k) => a + TERMS[k].m, 0);
    box.innerHTML = `<div class="contracts-title">TERMS <span class="terms-bonus">${on.length ? '+' + Math.round(bonus * 100) + '% cash' : 'optional'}</span></div>` +
        `<div class="terms-grid">` + Object.keys(TERMS).map(k => {
            const t = TERMS[k], isOn = on.includes(k);
            return `<button class="term ${isOn ? 'on' : ''}" onclick="toggleTerm('${k}')" aria-pressed="${isOn}"><b>${t.n}</b><span>${t.d}</span><i>+${Math.round(t.m * 100)}%</i></button>`;
        }).join('') + `</div><div class="contracts-note">Up to two. They apply to the next run. Daily ignores them.</div>`;
}

// ---------- state defaults ----------
const _prRunDefaults = runDefaults;
runDefaults = function() {
    return { ..._prRunDefaults(), terms: isDaily ? [] : [...(settings.terms || [])], underside: false,
             termInit: false, perkStart: false, windUsed: false, lastWordUsed: false, cardKey: '' };
};

// ---------- MARKS + PERKS ----------
const PERKS = {
    LUCKY:    { n: 'LUCKY START', d: 'Begin every run with a random item.', c: 3, req: [] },
    QUICK:    { n: 'QUICK DRAW', d: '+4 seconds on every turn timer.', c: 3, req: [] },
    EDGE:     { n: 'HOUSE EDGE', d: '+10% cash on wins.', c: 4, req: [] },
    WIND:     { n: 'SECOND WIND', d: 'Once a run, dropping under 25 Sanity restores 20.', c: 4, req: ['LUCKY'] },
    SCAV:     { n: 'SCAVENGER', d: '20% chance of a bonus item on every poker win.', c: 6, req: ['EDGE'] },
    LASTWORD: { n: 'LAST WORD', d: 'Once a run, a lethal hit leaves you at 1 HP.', c: 10, req: ['WIND', 'SCAV'] }
};
function hasPerk(k) { return !!(meta.perks && meta.perks[k]); }
function addMarks(n) { meta.marks = (meta.marks || 0) + n; meta.marksTotal = (meta.marksTotal || 0) + n; }

function buyPerk(k) {
    const p = PERKS[k];
    if (!p || hasPerk(k)) return;
    if (!p.req.every(hasPerk) || (meta.marks || 0) < p.c) { SFX.empty(); return; }
    meta.marks -= p.c;
    meta.perks = meta.perks || {};
    meta.perks[k] = 1;
    unlockAchievement('MARK_SPENT');
    saveGame(); SFX.buy(); renderMarksBox(); renderLobby();
}

function renderMarksBox() {
    const box = document.getElementById('marks-box');
    if (!box) return;
    box.innerHTML = `<div class="contracts-title">MARKS <span class="terms-bonus">${meta.marks || 0} to spend</span></div>` +
        `<div class="perk-list">` + Object.keys(PERKS).map(k => {
            const p = PERKS[k], own = hasPerk(k), open = p.req.every(hasPerk), can = open && !own && (meta.marks || 0) >= p.c;
            const need = !open ? 'Needs ' + p.req.filter(r => !hasPerk(r)).map(r => PERKS[r].n).join(' + ') : '';
            return `<button class="perk ${own ? 'own' : ''} ${can ? 'can' : ''}" ${own || !can ? '' : ''} onclick="buyPerk('${k}')">` +
                `<b>${own ? '[X] ' : ''}${p.n}</b><span>${p.d}</span><i>${own ? 'OWNED' : (need || p.c + ' marks')}</i></button>`;
        }).join('') + `</div><div class="contracts-note">Earn Marks by winning, finishing contracts and finding trophies.</div>`;
}

function marksForWin() {
    let n = { NORMAL: 1, HARD: 2, MERCENARY: 3, BOSS: 4, ANCIENT: 5, GAUNTLET: 3, FINALE: 5 }[currentDifficulty] || 1;
    if (currentDifficulty === 'ENDLESS') n = Math.floor((state.endlessScore || 0) / 3);
    if (state.underside) n = 5;
    if (isDaily) n += 2;
    n += (state.terms || []).length;
    return n;
}

// perk + term effects ------------------------------------------------
const _prStartRound = startRound;
startRound = function() {
    if (!state.perkStart) {
        state.perkStart = true;
        if (hasPerk('LUCKY')) giveItem('player', randomItemKey());
        if (state.underside) cineOnce('underside_in', () => {});
    }
    _prStartRound();
};

const _prGive = giveItem;
giveItem = function(who, key) {
    if (who === 'player' && state.noPokerItems) return false;
    return _prGive(who, key);
};
const _prPayWin = payPokerWin;
payPokerWin = function(p) {
    state.noPokerItems = hasTerm('EMPTY');
    try { _prPayWin(p); } finally { state.noPokerItems = false; }
    if (hasPerk('SCAV') && rnd() < 0.2) { log('SCAVENGER: you found something in the felt.', 'text-green-400'); giveItem('player', randomItemKey()); }
};

const _prDeal = dealDamage;
dealDamage = function(who, dmg, opts) {
    opts = opts || {};
    if (hasTerm('DOUBLE') && !opts.noBonus) dmg += 1;
    const out = _prDeal(who, dmg, opts);
    if (who === 'player' && state.playerHp <= 0 && hasPerk('LASTWORD') && !state.lastWordUsed) {
        state.lastWordUsed = true; state.playerHp = 1;
        log('LAST WORD: you speak, and the hit does not finish you.', 'text-red-400');
        flashScreen('red'); SFX.heartbeat();
    }
    return out;
};

const _prSanity = updateSanity;
updateSanity = function(d) {
    const was = sanity;
    _prSanity(d);
    if (was >= 25 && sanity < 25 && hasPerk('WIND') && !state.windUsed && activeGame === 'MAIN') {
        state.windUsed = true;
        log('SECOND WIND: you breathe. +20 Sanity.', 'text-cyan-300');
        _prSanity(20);
    }
};

const _prSetup = setupFight;
setupFight = function(p, hp, items) {
    if (hasTerm('PAPER')) {
        if (!state.termInit) { state.termInit = true; state.maxPlayerHp = Math.min(state.maxPlayerHp, 3); state.playerHp = Math.min(state.playerHp, 3); }
    }
    return _prSetup(p, hp, items);
};

const _prReward = rewardMult;
rewardMult = function() { return _prReward() * termMult() * (hasPerk('EDGE') ? 1.1 : 1); };

function perkTimerBonus() { return hasPerk('QUICK') ? 4 : 0; }

const _prFightWon = gauntletFightWon;
gauntletFightWon = function() {
    if (!state.gauntletBusy) noteBeaten(currentDealerPersonality);
    return _prFightWon();
};
const _prAddRelic = addRelic;
addRelic = function(id) {
    if (state.gauntlet && !hasRelic(id)) { meta.relicsSeen = meta.relicsSeen || {}; meta.relicsSeen[id] = 1; }
    return _prAddRelic(id);
};
const _prContracts = checkContracts;
checkContracts = function(ctx) { const r = _prContracts(ctx); if (r && r.length) addMarks(r.length); return r; };

// ---------- collection ----------
function noteBeaten(p) {
    meta.beaten = meta.beaten || {};
    meta.beaten[p] = 1;
    const need = Object.keys(DEALER_PERSONALITIES);
    if (need.every(k => meta.beaten[k])) unlockAchievement('COLLECTOR_ALL');
}

function renderCollectionBox() {
    const box = document.getElementById('collection-box');
    if (!box) return;
    const be = meta.beaten || {}, ds = Object.keys(DEALER_PERSONALITIES);
    const rs = Object.keys(RELICS), rseen = meta.relicsSeen || {};
    const items = Object.keys(ITEMS).filter(k => k !== 'PHANTOM'), codex = meta.codex || {};
    const row = (t, a, b) => `<div class="coll-row"><span>${t}</span><b>${a}/${b}</b></div>`;
    box.innerHTML = `<div class="contracts-title">COLLECTION</div>` +
        row('Dealers beaten', ds.filter(k => be[k]).length, ds.length) +
        `<div class="coll-dealers">${ds.map(k => `<span class="${be[k] ? 'got' : ''}">${be[k] ? DEALER_PERSONALITIES[k].name.replace('The ', '') : '???'}</span>`).join('')}</div>` +
        row('Relics found', rs.filter(k => rseen[k]).length, rs.length) +
        row('Items found', items.filter(k => codex[k]).length, items.length) +
        row('Endings', (meta.endings || []).length + (meta.sinEndings || []).length, 5) +
        row('Lore pages', unlockedLore.length, LORE_ENTRIES.length) +
        row('Cutscenes', cineList().filter(c => (meta.cineSeen || {})[c[0]]).length, cineList().length);
}

// ---------- hall of hands ----------
function recordBoard(r) {
    meta.board = meta.board || [];
    meta.board.push({ score: r.score, grade: r.grade, mode: r.mode, sin: r.sin, date: dailySeed() });
    meta.board.sort((a, b) => b.score - a.score);
    meta.board = meta.board.slice(0, 8);
}
function renderBoardBox() {
    const box = document.getElementById('board-box');
    if (!box) return;
    const b = meta.board || [];
    box.innerHTML = `<div class="contracts-title">HALL OF HANDS</div>` +
        (b.length ? b.map((x, i) => `<div class="coll-row"><span>${i + 1}. ${x.mode} &middot; ${x.sin}</span><b>${x.grade} ${x.score}</b></div>`).join('') : '<div class="contracts-note">No wins recorded yet.</div>');
}

function renderArchiveExtras() {
    renderMarksBox(); renderCollectionBox(); renderHabitBox(); renderBoardBox(); renderCinemaBox();
}

// ---------- after the result screen is up ----------
function afterResultHooks(won) {
    let r;
    try { r = runScore(won); } catch (e) { r = { score: 0, grade: 'D' }; }
    const m = document.getElementById('result-msg');
    habitRunEnd();
    if (won) {
        noteBeaten(currentDealerPersonality);
        const n = marksForWin();
        if (n > 0) { addMarks(n); if (m) m.innerHTML += `<div class="run-line text-amber-400">+${n} MARK${n > 1 ? 'S' : ''}</div>`; }
        if ((state.terms || []).length >= 2) unlockAchievement('TERMS_2');
        if (state.underside) unlockAchievement('UNDERSIDE_CLEAR');
        recordBoard({ score: r.score, grade: r.grade, mode: modeLabel(currentDifficulty), sin: storyMode });
    }
    meta.lastRun = { won, score: r.score, grade: r.grade, mode: modeLabel(isUnderside ? 'UNDERSIDE' : currentDifficulty), sin: storyMode,
                     streak: meta.winStreak || 0, seed: isDaily ? runSeedKey() : '' };
    const sh = document.getElementById('res-btn-share');
    if (sh) sh.classList.remove('hidden');
    saveGame();
}

// ---------- share card ----------
function shareResult() {
    const r = meta.lastRun;
    if (!r) return;
    const W = 720, H = 405, c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#05070b'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) { g.fillStyle = 'rgba(56,189,248,.04)'; g.fillRect(0, y, W, 1); }
    g.strokeStyle = r.won ? '#38bdf8' : '#ef4444'; g.lineWidth = 6; g.strokeRect(14, 14, W - 28, H - 28);
    g.textBaseline = 'top';
    g.fillStyle = '#ef4444'; g.font = '34px "Press Start 2P", monospace'; g.fillText('MALICEX', 44, 44);
    g.fillStyle = '#64748b'; g.font = '16px "Press Start 2P", monospace'; g.fillText('VERSION Μδ', 44, 92);
    g.fillStyle = '#94a3b8'; g.font = '34px VT323, monospace'; g.fillText(r.mode + '  ·  ' + r.sin, 44, 132);
    g.fillStyle = r.won ? '#fbbf24' : '#ef4444'; g.font = '190px "Press Start 2P", monospace'; g.fillText(r.grade, 44, 168);
    g.fillStyle = '#e2e8f0'; g.font = '60px VT323, monospace'; g.fillText('SCORE ' + r.score, 340, 190);
    g.fillStyle = '#94a3b8'; g.font = '34px VT323, monospace';
    g.fillText(r.won ? 'SURVIVED' : 'DID NOT LEAVE', 340, 262);
    if (r.streak > 1) g.fillText('STREAK ' + r.streak, 340, 300);
    if (r.seed) { g.fillStyle = '#38bdf8'; g.fillText('SEED ' + r.seed.replace('daily-', 'D '), 44, 350); }
    const text = `MALICEX Μδ · ${r.mode} · ${r.sin} · grade ${r.grade} · score ${r.score}` + (r.seed ? ` · seed ${r.seed}` : '');
    c.toBlob(b => {
        if (!b) { fallbackShare(text); return; }
        const f = (typeof File === 'function') ? new File([b], 'malicex-result.png', { type: 'image/png' }) : null;
        if (f && navigator.canShare && navigator.canShare({ files: [f] })) {
            navigator.share({ files: [f], title: 'Malicex', text }).catch(() => {});
        } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(b); a.download = 'malicex-result.png';
            document.body.appendChild(a); a.click(); a.remove();
            fallbackShare(text);
        }
    }, 'image/png');
}
function fallbackShare(text) {
    try { navigator.clipboard.writeText(text).catch(() => {}); } catch (e) {}
    const m = document.getElementById('result-msg');
    if (m) m.innerHTML += `<div class="run-line text-cyan-300">Copied: ${text}</div>`;
}

// ---------- trophies ----------
Object.assign(ACHIEVEMENTS, {
    LIGHT_FINGERS: { title: 'LIGHT FINGERS', desc: 'Steal 10 items as the Thief.', reward: 600, hint: 'Take things that are not yours. Ten of them.' },
    HEIST_END: { title: 'THE HEIST', desc: 'Reach the Thief ending.', reward: 3000, hint: 'Five lifts in one run, then walk out.', secret: true },
    INHERIT_END: { title: 'THE INHERITANCE', desc: 'Reach the Parricide ending.', reward: 3000, hint: 'The last blow has to carry your anger.', secret: true },
    WRATH_FIRST: { title: 'RED MIST', desc: 'Land a shot with Wrath.', reward: 400, hint: 'Take two wounds as the Parricide, then shoot back.' },
    BLOOD_BOUND: { title: 'BLOOD BOUND', desc: 'Survive a killing blow as the Parricide.', reward: 800, hint: 'The family does not let go easily.' },
    READ: { title: 'IT KNOWS', desc: 'Get read by the house.', reward: 400, hint: 'Play the same way long enough that it adapts.' },
    TERMS_2: { title: 'DOUBLE DOWN', desc: 'Win a run with two terms active.', reward: 800, hint: 'Pick two terms before the run, and live.' },
    COLLECTOR_ALL: { title: 'COMPLETIONIST', desc: 'Beat every dealer at least once.', reward: 2000, hint: 'Every dealer has a face. See all of them.' },
    CINEMA_ALL: { title: 'FILM BUFF', desc: 'See every cutscene.', reward: 1500, hint: 'Some scenes only play on special endings.' },
    UNDERSIDE_CLEAR: { title: 'THE FLOOR BELOW', desc: 'Clear the Underside.', reward: 6000, hint: 'After the last table, there is a stair.', secret: true },
    MARK_SPENT: { title: 'FIRST PERK', desc: 'Spend your Marks on a perk.', reward: 200, hint: 'Check the Archive tab.' }
});
Object.assign(LORE_BY_ACH, { LIGHT_FINGERS: 33, HEIST_END: 34, WRATH_FIRST: 35, INHERIT_END: 36, BLOOD_BOUND: 37, READ: 38, UNDERSIDE_CLEAR: 39, COLLECTOR_ALL: 40 });
LORE_ENTRIES.push(
    { id: 33, text: '"Every thief has one rule: take only what will not be missed. The house misses nothing."' },
    { id: 34, text: '"The watch ticked in my pocket. It was not mine. It was set to the minute I first sat down."' },
    { id: 35, text: '"I hit him harder than I meant to. I meant exactly as hard as I hit him."' },
    { id: 36, text: '"We had the same hands. I kept looking at them while he told me what to do with mine."' },
    { id: 37, text: '"The doctor says it should have killed me. The doctor has never met my family."' },
    { id: 38, text: '"The house never gets better at cards. It gets better at you."' },
    { id: 39, text: '"Under the table there is a stair, and at the bottom of the stair there is a smaller table."' },
    { id: 40, text: '"I collected all of them. They were all the same man in different coats."' }
);
