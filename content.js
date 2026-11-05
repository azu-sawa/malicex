"use strict";

// =====================================================================
// CONTENT (v10): trophy hints, extra trophies, lore, daily contracts,
// the true ending, score + grade. Loaded after endings.js.
// =====================================================================

// ---------- hints for the original trophies ----------
const ACH_HINTS = {
    FIRST_BLOOD: 'Beat any dealer once.',
    PACIFIST: 'Win without ever pulling the trigger on him. Beer, cuffs and patience.',
    PSYCHOPATH: 'Turn the barrel inward. Only inward. Three times, at least.',
    RICH_KID: 'Save up. The shop can wait.',
    SURVIVOR: 'Endless Nightmare: clear five rounds in one go.',
    VETERAN: 'Endless Nightmare: ten rounds.',
    CHEATER: 'The Ace Sleeve is sold in the Black Market.',
    DEAD_MAN: 'You will get there on your own.',
    FLAWLESS: 'Take no damage. Shields and Cigarettes do not count as damage taken.',
    GAMBLER: 'The Underground has four games. Play them a lot.',
    INSANE: 'Win while your mind is in pieces. Sanity 10 or lower.',
    SANITY_KEEPER: 'Win without losing a single point of Sanity. Sedatives help.',
    CHEAT_MASTER: 'Buy both skills, then use them in the same hand.',
    TAROT_INITIATE: 'Play an Arcana card in a boss fight.',
    FIRST_WIN: 'Finish a whole match as the survivor.',
    COMEBACK: 'End the fight on the edge of the grave: 1 HP.',
    UNTOUCHABLE: 'Hardcore or harder, and nothing touches you.',
    DEVIL_SLAYER: 'The Devil waits in Advanced Modes. Bring $5,000.',
    ANCIENT_SLAIN: 'Older than the Devil. Bring $8,000 and a plan.',
    MIMIC_SLAYER: 'It copies what you do. Surprise it.',
    HIGH_HAND: 'Flush, full house, anything better.',
    RAISE_WIN: 'Raise the pot, then take it.',
    SHIELD_WALL: 'Let a Shield eat a live round.',
    HI_LO_5: 'Hi-Lo, five correct guesses in a row.',
    GAUNTLET_CLEAR: 'Four tables in a row. Relics help.',
    DAILY_DONE: 'Everyone gets the same table today. Finish it.',
    ASCENDED: 'Raise Ascension to 3 and win a final run.',
    ENDING_ALL: 'Four different ways out. Find them all.'
};

// ---------- new trophies ----------
Object.assign(ACHIEVEMENTS, {
    ORIENTATION: { title: 'ORIENTATION', desc: 'Finish the guided first hand.', reward: 150, hint: 'Play your first Normal run and read what the house tells you.' },
    NAMED: { title: 'IT KNOWS YOUR NAME', desc: 'Give the house a name to call you.', reward: 100, hint: 'The first time you sit down, it asks.', secret: true },
    ROULETTE: { title: 'RUSSIAN ROULETTE', desc: 'Shoot yourself with three blanks in a row in one fight.', reward: 450, hint: 'Know the count. Trust the count. Pull anyway.' },
    HOARDER: { title: 'FULL POCKETS', desc: 'Hold five items at the same time.', reward: 200, hint: 'Win hands, save everything, spend nothing.' },
    STREAK_3: { title: 'HOT TABLE', desc: 'Win three runs in a row.', reward: 600, hint: 'Do not die. Three times.' },
    STREAK_7: { title: 'THE HOUSE TAKES NOTICE', desc: 'Win seven runs in a row.', reward: 2500, hint: 'It starts paying attention at seven.', secret: true },
    TYCOON: { title: 'TYCOON', desc: 'Hold $25,000 at once.', reward: 1500, hint: 'Bosses pay well. Keep the cash in your pocket.' },
    TAROT_5: { title: 'FORTUNE TELLER', desc: 'Play five Arcana cards.', reward: 400, hint: 'The cards are cursed. Draw anyway.' },
    ROYAL: { title: 'ROYAL FLUSH OF FATE', desc: 'Win poker with a straight flush or better.', reward: 1200, hint: 'Very rare. Lucky Charms do not count.' },
    COWARD: { title: 'WISE COWARD', desc: 'Fold five times in total.', reward: 250, hint: 'A bad hand is a good reason to leave the table.' },
    WITCHING: { title: 'THE WITCHING HOUR', desc: 'Start a run between midnight and 5 AM.', reward: 666, hint: 'Play when the world is asleep.', secret: true },
    PHANTOM_USE: { title: 'NEVER THERE', desc: 'Use an item that was never real.', reward: 300, hint: 'Low Sanity. Look at your pockets twice.' },
    BARE_HANDS: { title: 'BARE HANDS', desc: 'Win a run without using a single item.', reward: 700, hint: 'Poker, nerve and a shotgun. Nothing else.' },
    LORE_10: { title: 'READER', desc: 'Recover 10 lore fragments.', reward: 300, hint: 'Pages drop after wins. Trophies unlock some too.' },
    LORE_ALL: { title: 'EVERY PAGE', desc: 'Recover every lore fragment.', reward: 3000, hint: 'The Grimoire shows what is still missing.' },
    CODEX_FULL: { title: 'COMPLETE INVENTORY', desc: 'Discover every item in the Codex.', reward: 900, hint: 'Use each item once. The Codex tracks it.' },
    CONTRACTS_10: { title: 'PROFESSIONAL', desc: 'Finish 10 daily contracts.', reward: 800, hint: 'Three new contracts every day, in the Archive tab.' },
    SCORE_S: { title: 'S RANK', desc: 'Earn an S grade on a run.', reward: 1000, hint: 'Win fast, clean, and with a steady mind.' },
    MARATHON: { title: 'ONE MORE HAND', desc: 'Start 25 runs.', reward: 500, hint: 'You already know.' },
    ASC_5: { title: 'ASCENSION V', desc: 'Unlock the highest Ascension.', reward: 2000, hint: 'Win a final run at your highest Ascension, five times over.' },
    ABANDONED: { title: 'YOU LEFT', desc: 'Close the game in the middle of a run, then come back.', reward: 300, hint: 'It waits for you. It remembers when you leave.', secret: true },
    TRUE_END: { title: 'THE LAST TABLE', desc: 'Reach the true ending.', reward: 10000, hint: 'Four endings. Most of the pages. A table that only opens for those who know.', secret: true }
});

// ---------- new lore ----------
LORE_ENTRIES.push(
    { id: 17, text: '"The cards remember who dealt them. Mine remember my hands before I had them."' },
    { id: 18, text: '"Each dealer is a room I stopped going into."' },
    { id: 19, text: '"The Calculator counts everything except what it costs."' },
    { id: 20, text: '"The Sadist smiles because someone once smiled at me like that."' },
    { id: 21, text: '"The Madman is only honest. He says out loud what the others hide."' },
    { id: 22, text: '"The Warden locks the door from the inside. I have the key. I keep forgetting."' },
    { id: 23, text: '"The Mimic does not copy my face. It copies the way I look away."' },
    { id: 24, text: '"There is a clock in every room here. None agree. All are right."' },
    { id: 25, text: '"I tried leaving mid-hand. The chair was still warm when I came back."' },
    { id: 26, text: '"Sanity is not a number. It is how long you can hold someone\'s gaze, including your own."' },
    { id: 27, text: '"The shells are never the point. The point is the second before."' },
    { id: 28, text: '"Win enough times and the table starts to look like a mirror."' },
    { id: 29, text: '"I counted the dealers. There are more of them than there are of me. Then I counted again."' },
    { id: 30, text: '"The house never lies. It only waits for you to ask the right question."' },
    { id: 31, text: '"There is a last table. It is not behind a door. It is behind the version of you that stopped checking."' },
    { id: 32, text: '"You can leave whenever you like. That was always the horror."' }
);
Object.assign(LORE_BY_ACH, { ORIENTATION: 17, BARE_HANDS: 18, STREAK_3: 24, WITCHING: 25, ABANDONED: 25, ROULETTE: 27, STREAK_7: 28, CODEX_FULL: 29, NAMED: 30, LORE_10: 26 });
const FINALE_LORE_NEEDED = 22;   // fragments needed (with all four endings) to open the last table

// ---------- DAILY CONTRACTS ----------
// ctx = { won, hp, maxHp, sanity, round, mode, shotsAtDealer, selfShots, runItems, damageTaken, items, raise, uses }
const CONTRACT_POOL = [
    { id: 'NO_ITEMS', t: 'Win without using any items', pay: 400, ok: c => c.won && c.runItems === 0 },
    { id: 'PACIFIST', t: 'Win without shooting the dealer', pay: 500, ok: c => c.won && c.shotsAtDealer === 0 },
    { id: 'CLEAN', t: 'Win without taking damage', pay: 450, ok: c => c.won && c.damageTaken === 0 },
    { id: 'LOW_MIND', t: 'Win with Sanity at 50 or less', pay: 350, ok: c => c.won && c.sanity <= 50 },
    { id: 'HIGH_MIND', t: 'Win with Sanity at 80 or more', pay: 300, ok: c => c.won && c.sanity >= 80 },
    { id: 'QUICK', t: 'Win in 3 rounds or fewer', pay: 450, ok: c => c.won && c.round <= 3 },
    { id: 'SELF_FIRE', t: 'Shoot yourself 3 times and still win', pay: 500, ok: c => c.won && c.selfShots >= 3 },
    { id: 'STOCKED', t: 'Win with 4 or more items unused', pay: 350, ok: c => c.won && c.items >= 4 },
    { id: 'SAW_TWICE', t: 'Use the Saw twice in one run', pay: 300, ok: c => (c.uses.KNIFE || 0) >= 2 },
    { id: 'GLASS_THREE', t: 'Use the Glass three times in one run', pay: 300, ok: c => (c.uses.GLASS || 0) >= 3 },
    { id: 'ONE_HP', t: 'Win with exactly 1 HP', pay: 600, ok: c => c.won && c.hp === 1 },
    { id: 'BIG_POT', t: 'Raise the poker pot twice, then win', pay: 400, ok: c => c.won && c.raise >= 2 }
];

function todaysContracts() {
    const day = dailySeed();
    if (!meta.contracts || meta.contracts.date !== day) {
        // deterministic pick from the date string
        let h = 2166136261;
        for (let i = 0; i < day.length; i++) { h ^= day.charCodeAt(i); h = Math.imul(h, 16777619); }
        const pool = CONTRACT_POOL.map(c => c.id);
        const picks = [];
        while (picks.length < 3) {
            h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
            const id = pool[h % pool.length];
            if (!picks.includes(id)) picks.push(id);
        }
        meta.contracts = { date: day, picks, done: [] };
    }
    return meta.contracts;
}

function checkContracts(ctx) {
    const c = todaysContracts();
    const gained = [];
    c.picks.forEach(id => {
        if (c.done.includes(id)) return;
        const def = CONTRACT_POOL.find(x => x.id === id);
        if (def && def.ok(ctx)) {
            c.done.push(id);
            meta.contractsDone = (meta.contractsDone || 0) + 1;
            globalMoney += def.pay;
            totalStats.moneyEarned += def.pay;
            gained.push(def);
        }
    });
    if ((meta.contractsDone || 0) >= 10) unlockAchievement('CONTRACTS_10');
    return gained;
}

// ---------- SCORE + GRADE ----------
const MODE_MULT = { NORMAL: 1, HARD: 1.2, MERCENARY: 1.5, BOSS: 1.8, ANCIENT: 2.2, GAUNTLET: 2, ENDLESS: 1, FINALE: 3 };

function runScore(won) {
    let s = won ? 1500 : 300;
    s += Math.max(0, state.playerHp) * 250;
    s += Math.floor(Math.max(0, sanity) * 6);
    s += Math.max(0, 5 - state.round) * 200;
    if (state.damageTaken === 0) s += 500;
    if ((state.runItems || 0) === 0) s += 300;
    if (currentDifficulty === 'ENDLESS') s += state.endlessScore * 350;
    s = Math.round(s * (MODE_MULT[currentDifficulty] || 1));
    const grade = s >= 3600 ? 'S' : s >= 2800 ? 'A' : s >= 2100 ? 'B' : s >= 1500 ? 'C' : 'D';
    return { score: s, grade };
}

// ---------- THE TRUE ENDING ----------
function finaleUnlocked() {
    return (meta.endings || []).length >= 4 && unlockedLore.length >= FINALE_LORE_NEEDED;
}

function finaleSteps() {
    const n = (settings.name || 'you').toUpperCase();
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0'), mm = String(now.getMinutes()).padStart(2, '0');
    return [
        'The First Player lowers the mask.',
        'There is a face under it. It is yours.',
        'You remember now. The table was never in a house. It was the room where you stopped answering.',
        'The Calculator was everything you counted. The Sadist, everything you enjoyed. The Madman, everything you blamed on luck.',
        'The Warden was the reason you stayed. The Mimic was who you pretended to be.',
        'You did not win by killing them. You won because you sat across from yourself and did not look away.',
        'The door was never painted on. It was waiting for you to stop checking.',
        `Go on, ${n}. It is ${hh}:${mm} where you are.`,
        'Somebody is probably worried about you.',
        'THE TABLE IS EMPTY. YOU MAY LEAVE.'
    ];
}

function playTrueEnding(done) {
    const scr = document.getElementById('finale-screen');
    const txt = document.getElementById('finale-text');
    if (!scr || !txt) { done(); return; }
    const steps = finaleSteps();
    let i = 0;
    scr.classList.remove('hidden');
    Music.setScene('win');
    const next = () => {
        if (i >= steps.length) { scr.classList.add('hidden'); done(); return; }
        const line = steps[i++];
        txt.style.opacity = 0;
        setTimeout(() => {
            txt.textContent = line;
            txt.className = 'finale-line' + (i === steps.length ? ' finale-last' : '');
            txt.style.opacity = 1;
        }, 400);
        buzz(18);
        scr._t = setTimeout(next, 2400 + line.length * 38);
    };
    scr.onclick = () => { clearTimeout(scr._t); next(); };
    next();
}

// ---------- item codex + lore trophies ----------
function noteCodex(key) {
    if (!ITEMS[key] || key === 'PHANTOM') return;
    if (!meta.codex) meta.codex = {};
    if (meta.codex[key]) return;
    meta.codex[key] = 1;
    const all = Object.keys(ITEMS).filter(k => k !== 'PHANTOM');
    if (all.every(k => meta.codex[k])) unlockAchievement('CODEX_FULL');
}

function checkLoreTrophies() {
    if (unlockedLore.length >= 10) unlockAchievement('LORE_10');
    if (unlockedLore.length >= LORE_ENTRIES.length) unlockAchievement('LORE_ALL');
}

// ---------- run-end summary: score, grade, streak, contracts, again ----------
function runEndV10(m, won) {
    if (!m) return;
    const r = runScore(won);
    const prevBest = meta.bestScore || 0;
    const isBest = r.score > prevBest;
    if (isBest) meta.bestScore = r.score;
    if (r.grade === 'S' && won) unlockAchievement('SCORE_S');
    const col = { S: '#f59e0b', A: '#38bdf8', B: '#7dd3fc', C: '#94a3b8', D: '#64748b' }[r.grade];
    let h = `<div class="run-grade"><span class="grade-letter" style="color:${col}">${r.grade}</span>` +
        `<span class="grade-score">SCORE ${r.score}${isBest ? ' &middot; NEW BEST' : ''}</span></div>`;
    if (won) {
        const st = meta.winStreak || 0;
        if (st >= 2) h += `<div class="run-line text-amber-400">WIN STREAK ${st} &middot; +${Math.min(5, st - 1) * 10}% cash on the next win</div>`;
    } else if ((meta.lostStreak || 0) >= 2) {
        h += `<div class="run-line text-red-400">STREAK OF ${meta.lostStreak} BROKEN</div>`;
    }
    const gained = checkContracts({
        won, hp: state.playerHp, maxHp: state.maxPlayerHp, sanity, round: state.round, mode: currentDifficulty,
        shotsAtDealer: state.shotsAtDealer || 0, selfShots: state.selfShots || 0, runItems: state.runItems || 0,
        damageTaken: state.damageTaken || 0, items: (state.playerItems || []).length,
        raise: state.raiseMax || 0, uses: state.itemUse || {}
    });
    gained.forEach(c => { h += `<div class="run-line text-cyan-300">CONTRACT DONE: ${c.t} &middot; +$${c.pay}</div>`; });
    m.innerHTML += h;
    const again = document.getElementById('res-btn-again');
    if (again) { again.classList.toggle('hidden', !settings.lastMode); again.textContent = 'ONE MORE HAND'; }
}

function replayLast() {
    if (!settings.lastMode) return;
    document.getElementById('result-screen').classList.add('hidden');
    document.getElementById('game-ui').classList.add('hidden');
    showMenu();
    selectDifficulty(settings.lastMode);
}
