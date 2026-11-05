"use strict";

// =====================================================================
// REWARDS FOR RISK: the harder the table, the better the payout.
//   cash   multiplied by DIFF_PAY (on top of Ascension and pacts)
//   marks  a win on a hard table pays Marks (the permanent perk currency)
//   cards  hard tables are the main source of the strongest Arcana
// =====================================================================
const DIFF_PAY = { NORMAL: 1, DAILY: 1.1, HARD: 1.4, MERCENARY: 1.6, GAUNTLET: 1.4, BOSS: 2.0, ANCIENT: 3.0, FINALE: 3.5, ENDLESS: 1 };
const DIFF_MARKS = { HARD: 1, MERCENARY: 2, GAUNTLET: 2, BOSS: 3, ANCIENT: 6, FINALE: 8 };

const _rwMult = rewardMult;
rewardMult = function() {
    const base = _rwMult();
    const asc = ascLevel();
    // Ascension pays a little more per level on top of the base 30%
    return base * (DIFF_PAY[currentDifficulty] || 1) * (1 + 0.1 * asc);
};

const _rwAfter = afterResultHooks;
afterResultHooks = function(won) {
    if (won) {
        const asc = ascLevel();
        const n = (DIFF_MARKS[currentDifficulty] || 0) + (asc ? asc * 2 : 0) + (state.underside ? 3 : 0);
        if (n > 0) {
            addMarks(n);
            state.marksGained = n;
            if (typeof log === 'function') log(`HARD TABLE BONUS: +${n} MARKS.`, 'text-amber-300');
            const m = document.getElementById('result-msg');
            if (m) m.innerHTML += `<div class="mt-2 text-amber-300">+${n} MARKS for a hard table.</div>`;
        }
    }
    return _rwAfter(won);
};
