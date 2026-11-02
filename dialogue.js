"use strict";

// ---------- DIALOGUE ----------
const DIALOGUE = {
    en: {
        dealer: {
            normal: ["Life is cheap here.", "Good luck, lost soul.", "Cards determine your fate.",
                "Only takes one bullet to fall."
            ],
            hard: ["I won't play nice.", "You'll fall forever.", "Your blood smells of sin.", "Futile."],
            mercenary: ["Target confirmed.", "Just afterlife business.", "These rounds are real.",
                "No witnesses in limbo."
            ],
            boss: ["YOUR SOUL IS MINE!", "NO ESCAPE.", "I AM DEATH.", "HELL AWAITS."],
            endless: ["YOU WANT TO STAY FOREVER?", "NO ESCAPE FROM THE NIGHTMARE.", "AGAIN? FINE.",
                "I NEVER TIRE."
            ],
            win: ["Impossible...", "This isn't over.", "Take your coin.", "I'll see you in hell."],
            lose: ["As predicted.", "Your soul is mine.", "Pathetic.", "Sleep well."],
            hit: ["Argh!", "You'll pay for that!", "Blood...", "Just a scratch.", "Pain!"],
            taunt: ["Hahaha.", "Hands shaking?", "Click or Bang?", "Scared to fall?"],
            heal: ["Better.", "Not time to break yet.", "Smoke heals."],
            caught: ["I SAW THAT!", "DON'T TRY TO CHEAT!", "DIRTY HANDS!", "THINK I'M BLIND?"]
        },
        THIEF: {
            start: ["Stuck in this void...", "Is this final judgment?", "I need a second chance."],
            winHand: ["Hope remains.", "Not falling yet.", "Sinner's luck."],
            loseHand: ["No... don't drag me down.", "It's so dark...", "Damn it!"],
            shootHit: ["Take that!", "Stay back!", "I won't go quietly!"],
            shootSelfHit: ["Argh! Idiot!", "Pain feels real here...", "Blood in this place?"],
            shootSelfSafe: ["Hah... still breathing.", "Is God watching?", "Another chance."],
            getHit: ["It hurts...", "Blood... again...", "So cold..."],
            useItem: ["I need this.", "A little trick.", "Forgive me."]
        },
        PARRICIDE: {
            start: ["This place... empty like my heart.", "They are waiting down there.",
                "Let's play, Demon."
            ],
            winHand: ["I rule here.", "Death is my friend.", "Hahaha!"],
            loseHand: ["You cheater!", "The fire... I feel it.", "Don't look at me!"],
            shootHit: ["Die again!", "Your screams are music.", "Blood for the Devil!"],
            shootSelfHit: ["Hahaha! Fitting punishment!", "More! Hurt me!", "It burns!"],
            shootSelfSafe: ["Not time to burn yet.", "Click. Boring.", "Hell must wait."],
            getHit: ["This is nothing!", "I'm already dead inside!", "Hit harder!"],
            useItem: ["New torture tool.", "Cheating is fun.", "My new toy."]
        }
    }
};

// ---------- HORROR ----------
const HORROR_WORDS = ["DIE", "RUN", "HE SEES YOU", "DON'T", "BLOOD", "SIN", "HELL", "WAKE UP", "DEBT",
    "EMPTY", "HE IS COMING", "LOOK BEHIND YOU"
];

const DISTURBING_WORDS = ["YOU WERE NEVER BORN", "THEY TOOK YOUR NAME", "SMILE FOR HIM",
    "YOUR MIRROR IS EMPTY", "COUNT YOUR HEARTBEATS", "SHE LIVES IN YOUR RIBS"
];

            // ==================================================================
// ========== v7.0 CORE ADDITIONS (THE LAST TABLE) ==================
// ==================================================================
let meta = { wins: 0, bestHiLo: 0, runs: 0, ascension: 0, ascSel: 0, gauntletWins: 0, gauntletBest: 0, endings: [], dailyBest: { date: '', score: 0 }, dailyPaid: '' };

function runDefaults() {
    return {
        shieldPlayer: false,
        shieldDealer: false,
        shellLie: false,
        phoneMark: null,
        modifier: null,
        roundDmgBonus: 0,
        fog: false,
        heavyLoad: false,
        mercy: false,
        pokerBonus: false,
        lastPlayerItem: null,
        shotsAtDealer: 0,
        selfShots: 0,
        damageTaken: 0,
        runItems: 0,
        raised: false,
        enraged: false,
        lastBreathUsed: false,
        eyeNext: false,
        shellMods: [],
        pokerStage: 0,
        communityAll: [],
        pokerRaise: 0,
        dealerRaise: 0,
        redrawn: false,
        folded: false,
        gauntlet: null,
        pact: null,
        phantomDisguise: null,
        gauntletBusy: false,
        ended: false,
        cheatNextPoker: false,
        coldRead: false
    };
}

function randomItemKey() {
    const keys = Object.keys(ITEMS).filter(k => k !== 'TAROT' && k !== 'PHANTOM');
    return keys[Math.floor(rnd() * keys.length)];
}

// Player holds 5 items max, dealer 6. Anything beyond is lost (and says so).
function giveItem(who, key) {
    const list = who === 'player' ? state.playerItems : state.dealerItems;
    const cap = who === 'player' ? 5 : 6;
    if (list.length >= cap) {
        if (who === 'player') log('SLOTS FULL - item lost', 'text-gray-500');
        return false;
    }
    list.push(key);
    return true;
}

// ---------- DIALOGUE ----------
let dealerTyperState = { timer: null };

let playerTyperState = { timer: null };

function safeTypeWriter(element, text, speed, stateObj, fadeOut = false) {
    if (!element) return;
    if (stateObj.timer) clearTimeout(stateObj.timer);
    element.innerText = "";
    element.style.opacity = 1;
    let i = 0;

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            stateObj.timer = setTimeout(type, speed);
        } else if (fadeOut) {
            stateObj.timer = setTimeout(() => { element.style.opacity = 0; }, 4000);
        }
    }
    type();
}

function dealerSpeak(k) {
    let a = (DIALOGUE.en && DIALOGUE.en.dealer && DIALOGUE.en.dealer[k]) ?
        DIALOGUE.en.dealer[k] : null;
    if (!a || a.length === 0) a = (DIALOGUE['en'] && DIALOGUE['en'].dealer && DIALOGUE['en'].dealer[k]) ?
        DIALOGUE['en'].dealer[k] : ["..."];
    let t = a[Math.floor(Math.random() * a.length)];
    safeTypeWriter(document.getElementById('dealer-dialogue'), `"${t}"`, 30, dealerTyperState, false);
}

function playerSpeak(k) {
    const role = storyMode;
    let a = (DIALOGUE.en && DIALOGUE.en[role]) ? DIALOGUE.en[role][k] :
    null;
    if (!a || a.length === 0) a = (DIALOGUE['en'] && DIALOGUE['en'][role]) ? DIALOGUE['en'][role][k] :
    null;
    if (!a || a.length === 0) a = ["..."];
    let t = a[Math.floor(Math.random() * a.length)];
    safeTypeWriter(document.getElementById('player-dialogue'), t, 30, playerTyperState, true);
}
