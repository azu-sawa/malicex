"use strict";

// ---------- SAVE / LOAD ----------
function saveGame() {
    try { flashSaveIndicator(); } catch (e) {}
    Store.set(VERSION, JSON.stringify({
        money: globalMoney,
        upgrades,
        introSeen: true,
        storyMode,
        lastLogin,
        nextRunItems,
        achievements: unlockedAchievements,
        deathCount,
        endlessHighScore,
        totalStats,
        unlockedLore,
        sanity,
        meta
    }));
}

function loadGame() {
    const saved = Store.get(VERSION) || Store.get(PREV_VERSION) || Store.get(LEGACY_VERSION);
    if (!saved) return;
    try {
        const d = JSON.parse(saved);
        globalMoney = d.money ?? 200;
        upgrades = { ...upgrades, ...d.upgrades };
        introSeen = d.introSeen || false;
        storyMode = d.storyMode || 'THIEF';
        lastLogin = d.lastLogin || 0;
        nextRunItems = d.nextRunItems || [];
        unlockedAchievements = d.achievements || [];
        deathCount = d.deathCount || 0;
        endlessHighScore = d.endlessHighScore || 0;
        totalStats = d.totalStats || { kills: 0, moneyEarned: 0, itemsUsed: 0, minigamesPlayed: 0,
            sanityLoss: 0, sanityGain: 0 };
        unlockedLore = d.unlockedLore || [];
        sanity = d.sanity ?? 100;
        meta = { ...meta, ...(d.meta || {}) };
        const REFUND = { unlockCardPalm: 1500, unlockShellGame: 2400, extraTime: 2000, luckyFoot: 4500 };
        let hadOldSkill = false;
        Object.keys(REFUND).forEach(k => {
            if (upgrades[k]) {
                globalMoney += REFUND[k];
                if (k === 'unlockCardPalm' || k === 'unlockShellGame') hadOldSkill = true;
            }
            delete upgrades[k];
        });
        if (hadOldSkill) upgrades.unlockColdRead = true;
        nextRunItems = nextRunItems.filter(k => ITEMS[k] && k !== 'PHANTOM');
        if (!Store.get(VERSION)) saveGame();   // one-time migration to the Malicex key
    } catch (e) {
        console.error("Save corrupted");
        Store.remove(VERSION);
    }
}
