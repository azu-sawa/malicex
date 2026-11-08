"use strict";

// ---------- ENDINGS ----------
const ENDINGS = {
    MERCY: { en_t: 'THE QUIET EXIT',
        en_d: 'You never aimed. He lowered his mask first, and the door opened without a sound.' },
    MADNESS: { en_t: "THE DEALER'S CHAIR",
        en_d: 'The mask fits. The next player sits down, and your hands already know how to deal.' },
    CLEAN: { en_t: 'CLEAN HANDS',
        en_d: 'Not one shell touched you. Somehow that is the most frightening part.' },
    DAYBREAK: { en_t: 'DAYBREAK',
        en_d: 'You walk out bleeding but alive. The sun feels foreign on your skin.' }
};

const STORY_CLOSERS = {
    THIEF: { en: 'You came here to steal. You leave carrying something heavier than gold.' },
    PARRICIDE: { en: 'You came to answer for blood. The house keeps its secrets, and so do you.' }
};

function pickEnding() {
    if (state.shotsAtDealer === 0) return 'MERCY';
    if (isBroken()) return 'MADNESS';
    if (state.damageTaken === 0) return 'CLEAN';
    return 'DAYBREAK';
}

function finalWinHooks(p) {
    const final = ['BOSS', 'ANCIENT', 'GAUNTLET', 'FINALE'].includes(currentDifficulty);
    const m = document.getElementById('result-msg');
    if (!final || !m) return;
    let extra = '';
    if (currentDifficulty === 'GAUNTLET') {
        meta.gauntletWins = (meta.gauntletWins || 0) + 1;
        if (state.gauntlet) {
            state.gauntlet.cleared = state.gauntlet.total;
            if (state.gauntlet.cleared > (meta.gauntletBest || 0)) meta.gauntletBest = state.gauntlet.cleared;
        }
        unlockAchievement('GAUNTLET_CLEAR');
        if (isDaily) unlockAchievement('DAILY_DONE');
    }
    if (currentDifficulty === 'FINALE') { meta.trueEnd = true; unlockAchievement('TRUE_END'); const rt = document.getElementById('result-title'); if (rt) { rt.innerText = 'FREE'; rt.dataset.text = 'FREE'; } }
    if (ascLevel() >= 3) unlockAchievement('ASCENDED');
    if (!isDaily && ascLevel() === (meta.ascension || 0) && meta.ascension < 5) {
        meta.ascension++;
        extra += `<div class="text-xl mt-4 text-red-400">${'ASCENSION'} ${meta.ascension} ${'UNLOCKED'}</div>`;
    }
    if (currentDifficulty === 'FINALE') { m.innerHTML += `<div class="mt-6 text-2xl text-cyan-300 tracking-widest">THE LAST TABLE IS EMPTY</div>`; return; }
    const id = pickEnding();
    state.endingId = id;
    const e = ENDINGS[id];
    const special = typeof SIN_ENDINGS !== 'undefined' && SIN_ENDINGS.includes(id);
    if (special) {
        meta.sinEndings = meta.sinEndings || [];
        if (!meta.sinEndings.includes(id)) {
            meta.sinEndings.push(id);
            extra += `<div class="text-sm mt-2 text-yellow-400">SECRET ENDING FOUND (${meta.sinEndings.length}/2)</div>`;
        }
        unlockAchievement(id === 'HEIST' ? 'HEIST_END' : 'INHERIT_END');
    } else if (!meta.endings.includes(id)) {
        meta.endings.push(id);
        extra += `<div class="text-sm mt-2 text-yellow-400">${'NEW ENDING FOUND'} (${meta.endings.length}/4)</div>`;
    }
    if (meta.endings.length >= 4) unlockAchievement('ENDING_ALL');
    const closer = STORY_CLOSERS[storyMode] || STORY_CLOSERS.THIEF;
    extra = `<div class="mt-6 text-3xl text-purple-300 tracking-widest">${e.en_t}</div>` +
        `<div class="text-xl mt-2 text-gray-400 max-w-xl mx-auto">${e.en_d}</div>` +
        `<div class="text-lg mt-2 text-gray-600 max-w-xl mx-auto italic">${closer.en}</div>` + extra;
    m.innerHTML += extra;
}

function recordRunEnd(el) {
    if (!el) return;
    if (state.gauntlet) {
        if (state.gauntlet.cleared > (meta.gauntletBest || 0)) meta.gauntletBest = state.gauntlet.cleared;
        if (isDaily) {
            const won = state.playerHp > 0;
            const score = state.gauntlet.cleared * 1000 + (won ? 2000 : 0) + Math.max(0, state.playerHp) * 150 + Math.max(0, sanity) * 5;
            const today = dailySeed();
            if (!meta.dailyBest || meta.dailyBest.date !== today || score > meta.dailyBest.score) meta.dailyBest = { date: today, score };
            el.innerHTML += `<div class="text-xl mt-4 text-cyan-400">DAILY ${today}: ${'SCORE'} ${score} (${'BEST'} ${meta.dailyBest.score})</div>`;
        }
    }
}

// ---------- LORE TIED TO TROPHIES ----------
const LORE_BY_ACH = { PACIFIST: 11, DEVIL_SLAYER: 12, ANCIENT_SLAIN: 13, MIMIC_SLAYER: 14, GAUNTLET_CLEAR: 15, ENDING_ALL: 16 };

LORE_ENTRIES.push(
    { id: 11, text: "\"I never lifted the barrel. He still bled. Mercy is only another way to lose.\"" },
    { id: 12, text: "\"The Devil's chair was warm. Someone had sat there a very long time. Someone who looked like me.\"" },
    { id: 13, text: "\"The Elder was not the last dealer. It was the first player.\"" },
    { id: 14, text: "\"It copied my hands, my breath, my fear. It forgot to copy my doubt.\"" },
    { id: 15, text: "\"Four tables. One door. The door was painted on.\"" },
    { id: 16, text: "\"Every ending is the same room, seen from a different chair.\"" }
);

function unlockLoreFor(achId) {
    const lid = LORE_BY_ACH[achId];
    if (lid && !unlockedLore.includes(lid)) {
        unlockedLore.push(lid);
        checkLoreTrophies();
        log('LORE FRAGMENT FOUND', 'text-purple-400');
    }
}
