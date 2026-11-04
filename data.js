"use strict";

// ---------- LANGUAGE & TEXT ----------
const TEXT = {
    en: {
        hud_cash: "YOUR CASH",
        sel_title: "CHOOSE YOUR SIN",
        sel_thief_t: "THIEF",
        sel_thief_d: "Rent is due. The door was unlocked.",
        sel_kill_t: "KILLER",
        sel_kill_d: "He had it coming. Probably.",
        menu_norm: "NORMAL",
        menu_hard: "HARDCORE",
        menu_merc: "THE MERCENARY",
        menu_boss: "THE DEVIL",
        menu_endless: "ENDLESS NIGHTMARE",
        menu_shop: "SHOP",
        menu_ach: "TROPHIES",
        menu_wipe: "WIPE",
        shop_sub: "\"Everything here has a price. Not all of it is money.\"",
        shop_bal: "BALANCE:",
        shop_back: "BACK",
        shop_buy: "BUY",
        ticker: "NEWS: NEW SOUL ARRIVED AT THE BORDER... ++ HEAVEN REJECTS, HELL AWAITS... ++ ONE LAST BET FOR REDEMPTION... ++ DON'T LOOK DOWN... ++",
        bj_bet: "BET:",
        bj_deal: "DEAL",
        bj_back: "BACK",
        bj_you: "YOU",
        cup_title: "SKULL GUESS",
        cup_sub: "FIND THE EYE (" + px('eye') + ")",
        cup_msg: "PLACE BET TO START",
        hp_you: "YOUR LIFE",
        lbl_shoot_d: "SHOOT ENEMY",
        lbl_shoot_s: "SHOOT SELF",
        msg_ready: "PREPARE YOURSELF...",
        msg_load: "LOADING SHELLS...",
        msg_empty: "CLICK... EMPTY",
        msg_your_turn: "YOUR TURN",
        msg_enemy_turn: "ENEMY TURN",
        res_back: "LEAVE THE TABLE",
        res_win: "SURVIVED",
        res_die: "DIED",
        res_win_msg: "The dealer is down. Reward: $",
        res_die_msg: "Darkness consumes you...",
        btn_deal_reset: "RESET",
        btn_start: "NEXT",
        btn_reveal: "REVEAL",
        ach_title: "HALL OF FAME",
        ach_sub: ""
    }
};

const STORY_LINES = {
    en: {
        THIEF: ["I didn't mean to kill him...", "It was just a loaf of bread... for God's sake...",
            "He screamed. I panicked. The knife...", "Now I am here. Waiting for my turn.",
            "Just one more game for freedom..."
        ],
        PARRICIDE: ["He deserved it.", "Blood is thicker than water, they say.",
            "But his blood spilled so easily.", "No regrets. No mercy.",
            "Even the Devil cannot punish me worse than this."
        ]
    }
};

const SUITS = ['♠', '♥', '♦', '♣'];

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

const VALUES = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12,
    'K': 13, 'A': 14 };

// ---------- ITEMS (with BLUFF from v6.0) ----------
const ITEMS = {
    GLASS: { en: { n: "Glass", d: "Peek shell in chamber." },
        color: "text-blue-400", border: "border-blue-900", icon: px('eye'), sanityCost: 0, sanityGain: 0 },
    KNIFE: { en: { n: "Saw",
            d: "Next shot deals 2x Damage." }, color: "text-red-500", border: "border-red-900",
        icon: px('knife'), sanityCost: 0, sanityGain: 0 },
    BEER: { en: { n: "Beer",
            d: "Eject the next shell and see what it was." }, color: "text-yellow-600", border: "border-yellow-900",
        icon: px('beer'), sanityCost: 0, sanityGain: 2 },
    CIGARETTES: { en: { n: "Cigarettes", d: "+1 HP. Relax." },
        color: "text-teal-400", border: "border-teal-900", icon: px('cigarette'), sanityCost: 0, sanityGain: 5 },
    HANDCUFFS: { en: { n: "Handcuffs",
            d: "Dealer skips 1 turn." }, color: "text-orange-500", border: "border-orange-900",
        icon: px('chain'), sanityCost: 0, sanityGain: 0 },
    INVERTER: { en: { n: "Inverter",
            d: "Flip Live/Blank status." }, color: "text-purple-500", border: "border-purple-900",
        icon: px('bolt'), sanityCost: 0, sanityGain: 0 },
    SEDATIVE: { en: { n: "Sedative",
            d: "+25 Sanity. Calm mind." }, color: "text-blue-300", border: "border-blue-700",
        icon: px('pill'), sanityCost: 0, sanityGain: 25 },
    LUCKY_CHARM: { en: { n: "Lucky Charm",
            d: "Auto-win next poker (1 use)" }, color: "text-yellow-300", border: "border-yellow-600",
        icon: px('clover'), sanityCost: 0, sanityGain: 0 },
    TAROT: { en: { n: "Tarot Deck",
            d: "Draw a random card with mystical effects." }, color: "text-purple-400",
        border: "border-purple-800", icon: px('card'), sanityCost: 20, sanityGain: 0 },
    BLUFF: { en: { n: "Bluff",
            d: "Confuse dealer AI for 2 turns. (-10 Sanity)" }, color: "text-pink-400",
        border: "border-pink-900", icon: px('mask'), sanityCost: 10, sanityGain: 0 },
    SHIELD: { en: { n: "Shield",
            d: "Block the next live hit." }, color: "text-cyan-400", border: "border-cyan-900",
        icon: px('shield'), sanityCost: 0, sanityGain: 0 },
    PHONE: { en: {
            n: "Dead Phone", d: "A voice whispers one random shell. (-5 Sanity)" },
        color: "text-lime-400", border: "border-lime-900", icon: px('phone'), sanityCost: 5, sanityGain: 0 },
    VOODOO: { en: {
            n: "Voodoo Doll", d: "Dealer -1 HP, pierces shields. (-10 Sanity)" },
        color: "text-fuchsia-400", border: "border-fuchsia-900", icon: px('voodoo'), sanityCost: 10, sanityGain: 0 },
    PHANTOM: { en: { n: "Phantom", d: "Something that was never there." },
        color: "text-gray-400", border: "border-gray-700", icon: px('ghost'), sanityCost: 0, sanityGain: 0 }
};

// ---------- SHOP CATALOG ----------
const SHOP_CATALOG = [
    { id: 'crate', price: 100, isCrate: true, color: 'text-green-500', icon: px('crate'), en_n: "MYSTERY CRATE", en_d: "1 Random Item" },
    { id: 'aceSleeve', price: 1000, color: 'text-purple-400', icon: px('card'), en_n: "ACE SLEEVE", en_d: "Swap in an Ace (20% caught: -1 HP)" },
    { id: 'extraHp', price: 3500, color: 'text-green-400', icon: px('bone'), en_n: "TITANIUM RIBS", en_d: "+1 MAX HP (Permanent)" },
    { id: 'startCigs', price: 2000, color: 'text-teal-400', icon: px('cigarette'), en_n: "LUNGS IMPLANT", en_d: "Start with CIGS" },
    { id: 'startKnife', price: 3000, color: 'text-red-500', icon: px('knife'), en_n: "ARM BLADE", en_d: "Start with KNIFE" },
    { id: 'autoGlass', price: 7000, color: 'text-blue-500', icon: px('eye'), en_n: "CYBER EYE", en_d: "Auto GLASS per round" },
    { id: 'startInverter', price: 2500, color: 'text-purple-500', icon: px('bolt'), en_n: "VOLTAGE MOD", en_d: "Start with INVERTER" },
    { id: 'weakDealer', price: 8000, color: 'text-purple-600', icon: px('skull'), en_n: "NEUROTOXIN", en_d: "-1 MAX HP Dealer" },
    { id: 'sedativePack', price: 300, color: 'text-blue-300', icon: px('pill'), en_n: "SEDATIVE PACK", en_d: "3x Sedative" },
    { id: 'unlockColdRead', price: 2000, color: 'text-cyan-400', icon: px('magnifier'), en_n: "COLD READ", en_d: "Skill: see the dealer's hole cards (-20 Sanity)" },
    { id: 'unlockPsychOut', price: 2500, color: 'text-pink-400', icon: px('eye'), en_n: "PSYCH OUT", en_d: "Unlock Psych Out" },
    { id: 'tarotDeck', price: 500, color: 'text-purple-400', icon: px('card'), en_n: "TAROT DECK",
        en_d: "Cursed tarot cards. Use at your own risk." },
    { id: 'shieldPack', price: 500, grant: ['SHIELD', 'SHIELD'], color: 'text-cyan-400', icon: px('shield'),
        en_n: "SHIELD PACK",
        en_d: "2x Shield for next run" },
    { id: 'voodooDoll', price: 700, grant: ['VOODOO'], color: 'text-fuchsia-400', icon: px('voodoo'),
        en_n: "VOODOO DOLL",
        en_d: "1x Voodoo Doll for next run" },
    { id: 'ironMind', price: 3000, color: 'text-blue-300', icon: px('brain'), en_n: "IRON MIND", en_d: "Sanity losses reduced by 25%" },
    { id: 'startShield', price: 3000, color: 'text-cyan-400', icon: px('shield'), en_n: "KEVLAR SKIN", en_d: "Start with a SHIELD" },
];

// ---------- EXPANDED TAROT EFFECTS (v6.0 + v5.4 merged) ----------
const TAROT_EFFECTS = [
    { name: "THE FOOL", desc: "Innocence. Sanity restored.", effect: () => { updateSanity(15); } },
    { name: "THE MAGICIAN", desc: "Manifestation. Next poker hand is a win.", effect: () => { state
            .cheatNextPoker = true; } },
    { name: "THE HIGH PRIESTESS", desc: "Secrets. Reveal next shell.", effect: () => { state.shellRevealed =
            true;
        renderAmmo(); } },
    { name: "THE EMPRESS", desc: "Abundance. Gain $250.", effect: () => { globalMoney += 250;
            totalStats.moneyEarned += 250;
            updateMoneyDisplay(true); } },
    { name: "THE EMPEROR", desc: "Authority. Next shot deals triple damage.", effect: () => { state
            .damageMultiplier = 3;
            document.getElementById('dmg-indicator')?.classList.remove('hidden'); } },
    { name: "THE HIEROPHANT", desc: "Tradition. Gain a random item.", effect: () => { const items = Object
            .keys(ITEMS).filter(k => k !== 'TAROT'); const randomItem = items[Math.floor(rnd() *
                items.length)];
            state.playerItems.push(randomItem);
            log(`Received: ${ITEMS[randomItem].icon} ${(ITEMS[randomItem].en.n)}`,
                'text-green-500'); } },
    { name: "THE TOWER", desc: "Destruction. Lose 1 HP and 20 sanity.", effect: () => { state.playerHp =
            Math.max(0, state.playerHp - 1);
            renderHP();
            updateSanity(-20);
            triggerBlood(); } },
    { name: "DEATH", desc: "Endings. Dealer loses 2 HP.", effect: () => { state.dealerHp = Math.max(0, state
                .dealerHp - 2);
            renderHP();
            totalStats.kills++; } },
    { name: "THE SUN", desc: "Vitality. Heal 2 HP and gain 15 sanity.", effect: () => { state.playerHp =
            Math.min(state.maxPlayerHp, state.playerHp + 2);
            updateSanity(15);
            renderHP();
            flashScreen('green'); } },
    // v6.0 EXPANSIONS
    { name: "THE DEVIL", desc: "Temptation. Gain 2 live shells to the chamber, lose 15 sanity.",
    effect: () => { state.liveCount += 2;
        state.chamber.push(true, true);
        state.chamber = state.chamber.sort(() => rnd() - 0.5);
        renderAmmo();
        updateSanity(-15); } },
    { name: "JUDGEMENT", desc: "Absolution. Balances the scales of health.", effect: () => { const mid =
            Math.ceil((state.playerHp + state.dealerHp) / 2);
        state.playerHp = mid;
        state.dealerHp = mid;
        renderHP();
        log("Scales balanced!", "text-yellow-500"); } },
    { name: "THE STAR", desc: "Hope. Rejuvenate fully in health and mind.", effect: () => { state.playerHp =
            state.maxPlayerHp;
            updateSanity(50);
            renderHP(); } }
];

// ---------- ACHIEVEMENTS ----------
const ACHIEVEMENTS = {
    'FIRST_BLOOD': { title: 'FIRST BLOOD', desc: 'Win your first round.', reward: 100 },
    'PACIFIST': { title: 'PACIFIST', desc: 'Win without shooting the Dealer.', reward: 500 },
    'PSYCHOPATH': { title: 'PSYCHOPATH', desc: 'Win by shooting only yourself.', reward: 666 },
    'RICH_KID': { title: 'RICH KID', desc: 'Hold more than $5000.', reward: 1000 },
    'SURVIVOR': { title: 'SURVIVOR', desc: 'Survive 5 rounds in Endless Mode.', reward: 500 },
    'VETERAN': { title: 'VETERAN', desc: 'Reach round 10 in Endless.', reward: 1000 },
    'CHEATER': { title: 'DIRTY HANDS', desc: 'Successfully cheat at Poker.', reward: 200 },
    'DEAD_MAN': { title: 'DEAD MAN', desc: 'Die 10 times.', reward: 666 },
    'FLAWLESS': { title: 'FLAWLESS', desc: 'Win without taking damage.', reward: 800 },
    'GAMBLER': { title: 'HIGH ROLLER', desc: 'Play 50 minigames.', reward: 400 },
    'INSANE': { title: 'INSANE', desc: 'Win a match with Sanity at 10 or below.', reward: 777 },
    'SANITY_KEEPER': { title: 'SANITY KEEPER', desc: 'Win a match at full Sanity (100).', reward: 300 },
    'CHEAT_MASTER': { title: 'CHEAT MASTER', desc: 'Use both cheat skills in the same round.', reward: 500 },
    'TAROT_INITIATE': { title: 'TAROT INITIATE', desc: 'Use the Tarot Deck for the first time.',
    reward: 200 },
    'FIRST_WIN': { title: 'FIRST WIN', desc: 'Win a full match.', reward: 250 },
    'COMEBACK': { title: 'COMEBACK', desc: 'Win with exactly 1 HP left.', reward: 600 },
    'UNTOUCHABLE': { title: 'UNTOUCHABLE', desc: 'Win on Hardcore or higher without taking damage.', reward: 1200 },
    'DEVIL_SLAYER': { title: 'DEVIL SLAYER', desc: 'Defeat THE DEVIL.', reward: 2000 },
    'ANCIENT_SLAIN': { title: 'ELDER SLAIN', desc: 'Defeat THE ANCIENT.', reward: 3000 },
    'MIMIC_SLAYER': { title: 'NO REFLECTION', desc: 'Defeat The Mimic.', reward: 400 },
    'HIGH_HAND': { title: 'HIGH HAND', desc: 'Win poker with a Flush or better.', reward: 400 },
    'RAISE_WIN': { title: 'ALL OR NOTHING', desc: 'Win a raised poker hand.', reward: 300 },
    'SHIELD_WALL': { title: 'SHIELD WALL', desc: 'Absorb a shot with a Shield.', reward: 200 },
    'HI_LO_5': { title: 'COLD STREAK', desc: 'Reach a 5-streak in Hi-Lo.', reward: 500 },
    'GAUNTLET_CLEAR': { title: 'FOUR TABLES', desc: 'Clear the Gauntlet.', reward: 1500 },
    'DAILY_DONE': { title: 'SAME TABLE, SAME GHOSTS', desc: 'Clear a Daily Seed run.', reward: 400 },
    'ASCENDED': { title: 'ASCENDED', desc: 'Win a final run at Ascension 3 or higher.', reward: 1000 },
    'ENDING_ALL': { title: 'EVERY CHAIR', desc: 'Discover all four endings.', reward: 2500 }
};

// ---------- LORE ----------
const LORE_ENTRIES = [
    { id: 1, text: "\"I found a name carved under this table. My own. Dated 1987.\"" },
    { id: 2, text: "\"The dealer... he does not breathe. But I can hear a heartbeat inside the walls.\"" },
    { id: 3, text: "\"This place is not hell. It is a waiting room. And we are all late.\"" },
    { id: 4, text: "\"The gold is cold, like a dead man's eyes. They say it is the only way out.\"" },
    { id: 5, text: "\"The Dealer was a player once, like me. He won. The prize was the mask.\"" },
    { id: 6, text: "\"Do not drink the beer. It tastes like cremation ash.\"" },
    { id: 7, text: "\"The whispers are real. They tell me to look behind.\"" },
    { id: 8, text: "\"My reflection sometimes moves on its own. I stopped looking.\"" },
    { id: 9, text: "\"The cards bleed when no one is watching.\"" },
    { id: 10, text: "\"I drew The Tower. Now I understand why they call it the cursed deck.\"" }
];

// ---------- CHEAT SKILLS ----------
const CHEAT_SKILLS = {
    COLD_READ: {
        name: "Cold Read",
        cost: 20,
        effect: "See the dealer's hole cards until showdown",
        icon: px('magnifier'),
        execute: () => {
            state.coldRead = true;
            renderCards(false);
            log("COLD READ: you see the dealer's hole cards.", 'text-cyan-400');
            SFX.flip();
        }
    },
    PSYCH_OUT: {
        name: "Psych Out",
        cost: 20,
        effect: "Dealer hesitates on his next turn",
        icon: px('eye'),
        execute: () => {
            state.bluffTurns = Math.max(state.bluffTurns || 0, 1);
            const bi = document.getElementById('bluff-indicator');
            if (bi) bi.style.display = 'block';
            log("PSYCH: Dealer will hesitate on his next turn!", 'text-green-500');
            dealerSpeak('taunt');
        }
    }
};

// ---------- ACHIEVEMENTS ----------
function unlockAchievement(id) {
    if (unlockedAchievements.includes(id)) return;
    const ach = ACHIEVEMENTS[id];
    if (!ach) return;
    unlockedAchievements.push(id);
    unlockLoreFor(id);
    globalMoney += ach.reward;
    totalStats.moneyEarned += ach.reward;
    saveGame();
    const popup = document.getElementById('achievement-popup');
    const title = document.getElementById('ach-title');
    const desc = document.getElementById('ach-desc');
    if (popup && title && desc) {
        title.innerText = ach.title;
        desc.innerHTML = `${ach.desc}<div class="ach-reward">REWARD: $${ach.reward}</div>`;
        popup.classList.add('show');
        SFX.win();
        setTimeout(() => popup.classList.remove('show'), 4000);
    }
    updateMoneyDisplay(true);
}

function openAchievements() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('achievements-screen').classList.remove('hidden');
    activeGame = 'ACHIEVEMENTS';
    renderAchievements();
}

function closeAchievements() {
    document.getElementById('achievements-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    activeGame = 'MENU';
}

function renderAchievements() {
    const list = document.getElementById('ach-list-container');
    if (!list) return;
    const keys = Object.keys(ACHIEVEMENTS);
    const got = keys.filter(k => unlockedAchievements.includes(k)).length;
    const sub = document.getElementById('ach-subtitle');
    if (sub) sub.textContent = got + ' of ' + keys.length + ' found. Locked trophies show a hint.';
    list.innerHTML = '';
    // unlocked first, then locked
    keys.sort((a, b) => (unlockedAchievements.includes(b) ? 1 : 0) - (unlockedAchievements.includes(a) ? 1 : 0));
    keys.forEach(key => {
        const ach = ACHIEVEMENTS[key];
        const isUnlocked = unlockedAchievements.includes(key);
        const hint = ach.hint || (typeof ACH_HINTS !== 'undefined' && ACH_HINTS[key]) || '';
        const div = document.createElement('div');
        div.className = `ach-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        const title = isUnlocked ? ach.title : (ach.secret ? '? ? ?' : ach.title);
        const body = isUnlocked ? ach.desc : (ach.secret ? 'Secret trophy.' : ach.desc);
        div.innerHTML = `
                <div class="ach-item-icon">${isUnlocked ? px('trophy') : px('lock')}</div>
                <div class="ach-text">
                    <h4>${title}</h4>
                    <p>${body}</p>
                    ${isUnlocked ? `<div class="ach-claimed">CLAIMED +$${ach.reward}</div>` : `<div class="ach-hint">HINT: ${hint}</div>`}
                </div>
            `;
        list.appendChild(div);
    });
}
