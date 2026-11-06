"use strict";

"use strict";

const VERSION = 'malicex_save_v1';
const PREV_VERSION = 'dmh_save_v7.0_last_table';   // pre-rename save key, read once and migrated

const LEGACY_VERSION = 'dmh_save_v6.5_ultimate_fusion';

let globalMoney = 200;

let upgrades = {
    extraHp: false,
    autoGlass: false,
    startCigs: false,
    startKnife: false,
    weakDealer: false,
    startInverter: false,
    aceSleeve: false,
    unlockColdRead: false,
    unlockPsychOut: false,
    ironMind: false,
    goldTooth: false,
    steadyHands: false,
    startShield: false
};

let nextRunItems = [];

let activeGame = 'STARTUP';

let introSeen = false;

let storyMode = 'THIEF';

let lastLogin = 0;

let unlockedAchievements = [];

let deathCount = 0;

let endlessHighScore = 0;

let totalStats = { kills: 0, moneyEarned: 0, itemsUsed: 0, minigamesPlayed: 0, sanityLoss: 0, sanityGain: 0 };

let unlockedLore = [];

let sanity = 100;

let isInsane = false;

let currentDealerPersonality = 'SADISTIC';

let mirrorTimeout = null;

let turnTimer = null;

let timeLeft = 15;

let state = {
    round: 1,
    maxPlayerHp: 4,
    maxDealerHp: 4,
    playerHp: 4,
    dealerHp: 4,
    deck: [],
    playerHand: [],
    dealerHand: [],
    communityCards: [],
    chamber: [],
    liveCount: 0,
    blankCount: 0,
    turn: null,
    damageMultiplier: 1,
    handcuffed: false,
    playerItems: [],
    dealerItems: [],
    shellRevealed: false,
    isProcessing: false,
    endlessScore: 0,
    cheatNextPoker: false,
    usedCheatSkills: [],
    bluffTurns: 0
};

let bjState = { deck: [], playerHand: [], dealerHand: [], bet: 0, turn: 'player' };

let slotState = { bet: 10, isSpinning: false };

let cupState = { bet: 0, isPlaying: false, ballIndex: 0 };

let currentDifficulty = 'NORMAL';

// ==================== END v7.0 CORE ====================
// ==================================================================
// ========== v8.0 ADDITIONS (THE GAUNTLET UPDATE) ==================
// ==================================================================
let isDaily = false;

let pendingPact = null;
