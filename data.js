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
    { id: 'cuffPack', price: 450, grant: ['HANDCUFFS', 'HANDCUFFS'], color: 'text-amber-400', icon: px('chain'), en_n: "CUFF PACK", en_d: "2x Handcuffs for next run" },
    { id: 'sawPack', price: 550, grant: ['KNIFE', 'KNIFE'], color: 'text-red-400', icon: px('knife'), en_n: "SAW PACK", en_d: "2x Saw for next run" },
    { id: 'charmPack', price: 800, grant: ['LUCKY_CHARM', 'LUCKY_CHARM'], color: 'text-yellow-400', icon: px('clover'), en_n: "LUCKY PAIR", en_d: "2x Lucky Charm for next run" },
    { id: 'bluffPack', price: 650, grant: ['BLUFF', 'BLUFF'], color: 'text-pink-400', icon: px('mask'), en_n: "BLUFF KIT", en_d: "2x Bluff for next run" },
    { id: 'goldTooth', price: 4000, color: 'text-yellow-400', icon: px('skull'), en_n: "GOLD TOOTH", en_d: "+10% cash on every win (Permanent)" },
    { id: 'steadyHands', price: 5000, color: 'text-blue-300', icon: px('brain'), en_n: "STEADY HANDS", en_d: "Every run starts with at least 70 Sanity" },,
    // ---- Md8: THE LONG NIGHT, THE WARD, the House puzzles
    { id: 'candleBox', price: 300, repeat: true, color: 'text-amber-300', icon: px('candle'), en_n: "CANDLE BOX", en_d: "3 candle stubs. The Long Night takes up to 3 into the dark with you",
        buy: () => { const d = hsData(); d.scraps.CANDLE = (d.scraps.CANDLE || 0) + 3; return 'Three candle stubs go into your pocket.'; } },
    { id: 'nightLantern', price: 1800, color: 'text-yellow-300', icon: px('candle'), en_n: "NIGHT LANTERN", en_d: "Long Night: a lit candle burns 8 seconds longer",
        on: () => lnData().up.lantern, buy: () => { lnData().up.lantern = 1; return 'The lantern is heavier than it looks. It is warm.'; } },
    { id: 'feltSoles', price: 1500, color: 'text-stone-300', icon: px('ear'), en_n: "FELT SOLES", en_d: "Long Night: hunters take 30% longer to find the next room",
        on: () => lnData().up.soles, buy: () => { lnData().up.soles = 1; return 'You cannot hear your own steps. That is the point.'; } },
    { id: 'saltPack', price: 700, repeat: true, color: 'text-slate-200', icon: px('drop'), en_n: "SALT PACK", en_d: "Long Night: one catch is waved off. Stacks",
        buy: () => { lnData().salt++; return 'A line of salt in your coat hem. ' + lnData().salt + ' ready.'; } },
    { id: 'earplugs', price: 900, color: 'text-sky-300', icon: px('ear'), en_n: "EARPLUGS", en_d: "Long Night: the dark wears on you half as fast. The Ward: the vent, the phone and the visitors cost 1 less GRIP",
        on: () => lnData().up.plugs, buy: () => { lnData().up.plugs = 1; return 'Wax. The house goes quiet. That does not mean it stops.'; } },
    { id: 'blackCoffee', price: 250, repeat: true, color: 'text-orange-400', icon: px('beer'), en_n: "BLACK COFFEE", en_d: "Next Long Night is 30s shorter, or the next Ward starts with +1 GRIP",
        buy: () => { lnData().coffee = (lnData().coffee || 0) + 1; return 'It is very black. It is still warm, which it should not be.'; } },
    { id: 'fragFinder', price: 2500, color: 'text-violet-400', icon: px('magnifier'), en_n: "FRAGMENT FINDER", en_d: "+10% chance of a lore page after each won round (Permanent)" },
    { id: 'lockpicks', price: 1200, color: 'text-amber-400', icon: px('key'), en_n: "LOCKPICK SET", en_d: "House: the chest lock's pale zone is wider (Permanent)" },
    { id: 'stethoscope', price: 1400, color: 'text-cyan-300', icon: px('lungs'), en_n: "STETHOSCOPE", en_d: "House: the safe tells you which dials are right (Permanent)" }
];

// ---------- MARKS MARKET (bought with Marks, not cash) ----------
const MARKS_CATALOG = [
    { id: 'carePkg', cost: 2, repeat: true, color: 'text-green-400', icon: px('crate'), n: "CARE PACKAGE", d: "2 random items for your next run" },
    { id: 'deadDrop', cost: 3, repeat: true, color: 'text-yellow-400', icon: px('clover'), n: "DEAD DROP", d: "Trade Marks for $1,000 cash" },
    { id: 'sealedCard', cost: 6, repeat: true, color: 'text-fuchsia-400', icon: px('card'), n: "SEALED CARD", d: "A random Arcana you do not own yet" },
    { id: 'nightTuner', cost: 4, color: 'text-cyan-400', icon: px('speaker'), n: "NIGHT TUNER", d: "Radio: unlocks 3 more background tracks" },
    { id: 'brassKey', cost: 6, color: 'text-amber-400', icon: px('key'), n: "BRASS KEY", d: "Opens the cellar door in THE HOUSE" },
    { id: 'blackCard', cost: 9, color: 'text-pink-400', icon: px('skull'), n: "BLACK CARD", d: "The market restocks: cash prices drop 15% (Permanent)" },
    // ---- Md8
    { id: 'secondNight', cost: 3, repeat: true, color: 'text-indigo-300', icon: px('moon'), n: "SECOND NIGHT", d: "One more Long Night today. Ring the bell again",
        buy: () => { lnData().pass++; return 'The bell is warm again. It will take another night.'; } },
    { id: 'hunterMap', cost: 5, color: 'text-red-300', icon: px('eye'), n: "HUNTER'S MAP", d: "Long Night: the HUD shows which room each hunter is in (Permanent)",
        on: () => lnData().up.map, buy: () => { lnData().up.map = 1; return 'A floor plan with four small marks that move.'; } },
    { id: 'lastCandle', cost: 4, color: 'text-amber-300', icon: px('candle'), n: "LAST CANDLE", d: "Long Night: start with 2 extra candles (Permanent)",
        on: () => lnData().up.candle2, buy: () => { lnData().up.candle2 = 1; return 'Two more. They will not be the last. They will feel like it.'; } },
    { id: 'tenantDeed', cost: 7, color: 'text-emerald-300', icon: px('door'), n: "TENANT'S DEED", d: "Long Night: tenants who are CONTENT do not hunt you (Permanent)",
        on: () => lnData().up.deed, buy: () => { lnData().up.deed = 1; return 'It is signed. They are all very polite about it.'; } },
    { id: 'lastRites', cost: 6, repeat: true, color: 'text-rose-300', icon: px('cross'), n: "LAST RITES", d: "Long Night: one lost duel is forgiven. Stacks",
        buy: () => { lnData().rites++; return 'You will rise once. Only once.'; } },
    { id: 'lostPage', cost: 4, repeat: true, color: 'text-violet-300', icon: px('card'), n: "LOST PAGE", d: "A lore page you have not found, and its film",
        buy: () => { const m = fragMissing(); if (!m.length) return false; const id = m[Math.floor(Math.random() * m.length)]; fragGive(id); return 'A loose page. It was in your pocket already.'; } },
    { id: 'nurseKey', cost: 8, color: 'text-pink-300', icon: px('key'), n: "NURSE'S KEY", d: "The Ward: the chart tells the truth one day longer (Permanent)",
        on: () => meta.nurseKey, buy: () => { meta.nurseKey = 1; return 'It is on a lanyard. It fits one lock in the whole ward.'; } }
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
    'LANDLORD': { title: 'LANDLORD', desc: 'Collect favours from four different tenants.', reward: 400, hint: 'Beat dealers, let them move in, then listen to what each one asks for.' },
    'NIGHT_OWL': { title: 'NIGHT OWL', desc: 'Win a run you started at night.', reward: 700, hint: 'The House is not the only thing that keeps time. Start a run after dark and survive it.' },
    'ANSWERED': { title: 'ANSWERED', desc: 'Pick up the telephone in the Hall.', reward: 250, hint: 'It rings when your mind is thin enough. Be in the Hall.' },
    'FIRST_LIGHT': { title: 'FIRST LIGHT', desc: 'Light the lamp in the House.', reward: 150, hint: 'Something in the Study burns when you ask it to. Candle stubs hide in the rooms.' },
    'DAWN_BREAKS': { title: 'DAWN BREAKS', desc: 'Survive the Long Night.', reward: 600, hint: 'Ring the bell in the Study. Keep moving, keep a candle, keep your head.' },
    'UNSEEN': { title: 'UNSEEN', desc: 'Survive the Long Night without being caught once.', reward: 1000, hint: 'Doors are cheaper than duels. Listen for the steps next door.' },
    'CAUGHT_3': { title: 'THREE TIMES', desc: 'Be caught three times in one Long Night and still see dawn.', reward: 500, hint: 'Salt, last rites and good luck. Or just stubbornness.' },
    'SAFE_CRACKED': { title: 'COMBINATION', desc: 'Open the safe in the House.', reward: 300, hint: 'Someone wrote the numbers down. In a room full of paper.' },
    'MUSIC_BOX': { title: 'WIND IT UP', desc: 'Open the music box.', reward: 300, hint: 'It plays the same tune every time. Repeat it back.' },
    'FIVE_FRAMES': { title: 'WHO SITS WHERE', desc: 'Hang the four portraits in the right order.', reward: 300, hint: 'Four dealers, four frames, and a note that contradicts itself unless you read it carefully.' },
    'LOCK_PICKED': { title: 'THREE PINS', desc: 'Pick the lock on the old chest.', reward: 400, hint: 'Something in the House is locked and does not want to be. Timing, not strength.' },
    'FILM_5': { title: 'PROJECTIONIST', desc: 'Watch five fragment films.', reward: 300, hint: 'Lore fragments have films. Replay them in the Grimoire.' },
    'FILM_ALL': { title: 'THE WHOLE REEL', desc: 'Watch every fragment film.', reward: 1500, hint: 'Every fragment, every film. Some of them are hard to find.', secret: true },
    'WARD_CLEAR': { title: 'DISCHARGE AGAINST ADVICE', desc: 'Walk out of the Ward by trusting what you saw.', reward: 1200, hint: 'The chart lies later in the week. Your memory does not.' },
    'GOOD_PATIENT': { title: 'GOOD PATIENT', desc: 'Be discharged from the Ward by agreeing with the chart.', reward: 700, hint: 'Agree with everything. Take everything. Sign.', secret: true },
    'NO_PILLS': { title: 'CLEAR HEAD', desc: 'Leave the Ward through the door without swallowing a single pill.', reward: 1500, hint: 'Cheek them or refuse them. Seven nights. Keep your head.' },
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
    'TAROT_INITIATE': { title: 'TAROT INITIATE', desc: 'Play an Arcana card in a boss fight.',
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
    if (typeof addMarks === 'function') addMarks(1);
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
