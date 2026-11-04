"use strict";

// =====================================================================
// LOBBY (v10): four tabs, a one-tap "sit down", daily contracts.
// =====================================================================
const LOBBY_TABS = ['play', 'archive', 'under', 'system'];

function showLobbyTab(id) {
    if (!LOBBY_TABS.includes(id)) id = 'play';
    LOBBY_TABS.forEach(t => {
        const p = document.getElementById('tab-' + t), b = document.getElementById('tabbtn-' + t);
        if (p) p.classList.toggle('hidden', t !== id);
        if (b) { b.classList.toggle('on', t === id); b.setAttribute('aria-selected', t === id ? 'true' : 'false'); }
    });
    if (settings.lobbyTab !== id) { settings.lobbyTab = id; saveSettings(); }
    if (id === 'archive') renderContracts();
}

const MODE_INFO = {
    NORMAL: { n: 'NORMAL', d: 'One dealer. Learn the table.', c: 'Free' },
    HARD: { n: 'HARDCORE', d: 'A smarter dealer with more HP.', c: '$200' },
    MERCENARY: { n: 'THE MERCENARY', d: 'Elite guard. Starts armed.', c: '$2,000' },
    BOSS: { n: 'THE DEVIL', d: 'Boss fight. 10 second turns.', c: '$5,000' },
    ANCIENT: { n: 'THE ANCIENT', d: 'Older than the house itself.', c: '$8,000' },
    ENDLESS: { n: 'ENDLESS NIGHTMARE', d: 'How many rounds can you stand?', c: '$500' }
};

function modeCardHtml(key) {
    const m = MODE_INFO[key];
    return `<span class="mode-name">${m.n}</span><span class="mode-sub">${m.d}</span><span class="mode-cost">${m.c}</span>`;
}

function modeLabel(m) {
    if (m === 'DAILY') return 'DAILY SEED';
    if (m === 'GAUNTLET') return 'GAUNTLET';
    if (m === 'FINALE') return 'THE LAST TABLE';
    return (MODE_INFO[m] || MODE_INFO.NORMAL).n;
}

function renderLobby() {
    const q = id => document.getElementById(id);
    ['NORMAL', 'HARD', 'MERCENARY', 'BOSS', 'ANCIENT', 'ENDLESS'].forEach(k => {
        const id = { NORMAL: 'normal', HARD: 'hard', MERCENARY: 'merc', BOSS: 'boss', ANCIENT: 'ancient', ENDLESS: 'endless' }[k];
        const e = q('menu-btn-' + id);
        if (e) e.innerHTML = modeCardHtml(k);
    });
    const g = q('menu-btn-gauntlet');
    if (g) g.innerHTML = `<span class="mode-name">GAUNTLET</span><span id="gauntlet-sub" class="mode-sub">4 dealers, relics, one life. Best ${meta.gauntletBest || 0}</span><span class="mode-cost">$500</span>`;
    const d = q('menu-btn-daily');
    if (d) {
        const best = (meta.dailyBest && meta.dailyBest.date === dailySeed()) ? meta.dailyBest.score : 0;
        d.innerHTML = `<span class="mode-name">DAILY SEED</span><span id="daily-sub" class="mode-sub">Same table for everyone today. Best ${best}</span><span class="mode-cost">Free</span>`;
    }
    const f = q('menu-btn-finale');
    if (f) {
        const ok = finaleUnlocked();
        f.classList.toggle('hidden', !(meta.wins >= 1));
        f.disabled = !ok;
        f.innerHTML = ok
            ? `<span class="mode-name">THE LAST TABLE</span><span class="mode-sub">Someone has been waiting for you.</span><span class="mode-cost">Free</span>`
            : `<span class="mode-name">? ? ?</span><span class="mode-sub">Find all 4 endings (${(meta.endings || []).length}/4) and ${FINALE_LORE_NEEDED} lore pages (${unlockedLore.length}/${FINALE_LORE_NEEDED}).</span><span class="mode-cost">Locked</span>`;
    }
    const ach = q('menu-btn-ach');
    if (ach) ach.innerHTML = `<span class="mode-name">TROPHIES</span><span class="mode-sub">${unlockedAchievements.length} of ${Object.keys(ACHIEVEMENTS).length} found. Locked ones show hints.</span>`;
    const led = q('menu-btn-ledger');
    if (led) led.innerHTML = `<span class="mode-name">GRIMOIRE</span><span class="mode-sub">Stats, item codex, sanity guide, ${unlockedLore.length}/${LORE_ENTRIES.length} lore pages.</span>`;
    const shop = q('menu-btn-shop');
    if (shop) shop.innerHTML = `<span class="mode-name">BLACK MARKET</span><span class="mode-sub">Permanent upgrades and starting gear.</span>`;
    // chips
    const st = meta.winStreak || 0;
    if (q('streak-n')) q('streak-n').textContent = st;
    if (q('chip-streak')) q('chip-streak').classList.toggle('hot', st >= 2);
    const c = todaysContracts();
    if (q('contracts-n')) q('contracts-n').textContent = c.done.length + '/' + c.picks.length;
    // primary button
    const last = settings.lastMode;
    const again = q('btn-again');
    if (again) {
        const t = q('again-title'), s = q('again-sub');
        if (last) { t.textContent = 'ONE MORE HAND'; s.textContent = 'Same table again: ' + modeLabel(last); }
        else { t.textContent = 'SIT DOWN'; s.textContent = 'Your first hand. The house will show you how it works.'; }
    }
    const tut = q('menu-btn-wipe');
    renderContracts();
}

function renderContracts() {
    const box = document.getElementById('contracts-list');
    if (!box) return;
    const c = todaysContracts();
    box.innerHTML = c.picks.map(id => {
        const def = CONTRACT_POOL.find(x => x.id === id);
        const done = c.done.includes(id);
        return `<div class="contract ${done ? 'done' : ''}"><span class="contract-mark">${done ? '[X]' : '[ ]'}</span><span class="contract-text">${def.t}</span><span class="contract-pay">+$${def.pay}</span></div>`;
    }).join('') + '<div class="contracts-note">Win a run to complete them. New ones every day.</div>';
}

// "one more hand": first time = start the guided Normal run
function lobbyPrimary() {
    if (!settings.lastMode) selectDifficulty('NORMAL'); else replayLast();
}

function toggleAdvancedModes() {
    const p = document.getElementById('advanced-modes');
    p.classList.toggle('hidden');
    const b = p.previousElementSibling;
    if (b) b.setAttribute('aria-expanded', p.classList.contains('hidden') ? 'false' : 'true');
}
