"use strict";

// =====================================================================
// SANITY SYSTEM - the single source of truth.
//
// Sanity is a 0-100 resource. Hits, pacts and risky actions drain it;
// Sedatives, Cigarettes, kills and clears restore it. Every effect that
// depends on it reads the helpers below. Never compare `sanity` to a
// raw number elsewhere in the code.
//
//   LUCID      85-100  Clarity: the first shell of every load is revealed.
//   STEADY     51-84   Nothing special.
//   UNEASY     26-50   Whispers and hallucinations; the dealer's poker tell lies 40% of the time.
//   FRACTURED  11-25   Phantom items, the Glass lies (35%), a Voice offers an unreliable hint (30%/turn).
//   BROKEN      0-10   The Voice is louder (60%) and a coin flip, Raise and Redraw are locked,
//                      winning here earns the MADNESS ending and the INSANE trophy.
// =====================================================================
const SANITY = { LUCID: 85, UNEASY: 50, FRACTURED: 25, BROKEN: 10, RUN_FLOOR: 60 };

const SANITY_TIERS = [
    { id: 'LUCID',     min: 85, color: '#67e8f9', hint: 'The first shell of each load reveals itself.' },
    { id: 'STEADY',    min: 51, color: '#a78bfa', hint: 'Nothing unusual.' },
    { id: 'UNEASY',    min: 26, color: '#fbbf24', hint: 'Whispers. The dealer\'s tell may lie.' },
    { id: 'FRACTURED', min: 11, color: '#fb923c', hint: 'Phantom items. The Glass may lie. A Voice speaks.' },
    { id: 'BROKEN',    min: 0,  color: '#ef4444', hint: 'The Voice is a coin flip. Raise and Redraw are locked.' }
];

function sanityTier(n) {
    const v = n == null ? sanity : n;
    for (const t of SANITY_TIERS) if (v >= t.min) return t;
    return SANITY_TIERS[SANITY_TIERS.length - 1];
}
// effect helpers: read these instead of raw thresholds
function hasClarity()        { return sanity >= SANITY.LUCID; }
function tellsUnreliable()   { return sanity <= SANITY.UNEASY; }
function isFractured()       { return sanity <= SANITY.FRACTURED; }
function isBroken()          { return sanity <= SANITY.BROKEN; }
function glassLieChance()    { return isFractured() ? 0.35 : 0; }
function phantomChance()     { return isFractured() ? 0.5 : 0; }
function voiceChance()       { return isBroken() ? 0.6 : (isFractured() ? 0.3 : 0); }
function voiceTruthChance()  { return isBroken() ? 0.5 : 0.65; }
// Voluntary spending may never push you into BROKEN
function canSpendSanity(cost) { return sanity - cost > SANITY.BROKEN; }

function setSanityDirect(n) {          // run start, debug: no stats, no save
    const old = sanity;
    sanity = Math.max(0, Math.min(100, n));
    onSanityChanged(old, sanity);
}

function updateSanity(delta) {
    if (delta < 0 && upgrades.ironMind) delta = Math.min(-1, Math.ceil(delta * 0.75));
    const old = sanity;
    sanity = Math.max(0, Math.min(100, sanity + delta));
    if (delta < 0) totalStats.sanityLoss += Math.abs(delta);
    else if (delta > 0) totalStats.sanityGain += delta;
    onSanityChanged(old, sanity);
    saveGame();
}

function onSanityChanged(old, now) {
    updateSanityUI();
    if (typeof Music !== 'undefined') Music.setSanity(now);
    const a = sanityTier(old), b = sanityTier(now);
    if (a.id === b.id) return;
    const worse = SANITY_TIERS.indexOf(b) > SANITY_TIERS.indexOf(a);
    if (activeGame === 'MAIN') {
        log(`MIND: ${b.id}. ${b.hint}`, worse ? 'text-orange-400' : 'text-cyan-300');
        if (worse) SFX.stinger(); else SFX.relief();
    }
    if (now <= SANITY.FRACTURED && !isInsane) triggerInsanity();
    else if (now > SANITY.FRACTURED && isInsane) recoverSanity();
}

function updateSanityUI() {
    const t = sanityTier();
    const set = (id, fn) => { const e = document.getElementById(id); if (e) fn(e); };
    set('sanity-fill', e => { e.style.width = `${sanity}%`; e.style.background = t.color; });
    set('sanity-value', e => { e.innerText = sanity; });
    set('sanity-tier', e => { e.innerText = t.id; e.style.color = t.color; });
    set('lobby-sanity-fill', e => { e.style.width = `${sanity}%`; e.style.background = t.color; });
    set('lobby-sanity-text', e => { e.innerText = sanity; });
    set('lobby-sanity-tier', e => { e.innerText = t.id; e.style.color = t.color; });
}

function triggerInsanity() {
    isInsane = true;
    showDisturbingOverlay("THE WALLS ARE BREATHING");
    document.body.classList.add('sanity-low');
    document.getElementById('insanity-overlay').classList.add('insanity-active');
    document.getElementById('vignette-fx').style.opacity = '0.95';
}

function recoverSanity() {
    isInsane = false;
    document.body.classList.remove('sanity-low');
    document.getElementById('insanity-overlay').classList.remove('insanity-active');
    document.getElementById('vignette-fx').style.opacity = '0.9';
}

// The Voice: an unreliable hint about the next shell
function sanityWhispers() {
    if (state.chamber.length === 0) return;
    if (rnd() >= voiceChance()) return;
    const real = !!state.chamber[0];
    const said = rnd() < voiceTruthChance() ? real : !real;
    log(`A VOICE: "the next one is ${said ? 'LIVE' : 'BLANK'}"`, 'text-purple-400');
    SFX.whisper();
    flashScreen('red');
}

// ---------- WHISPERS (v6.0) ----------
function spawnWhisper() {
    if (activeGame !== 'MAIN' || !tellsUnreliable()) return;
    const container = document.getElementById('game-ui');
    if (!container) return;
    const whisperList = ([
        "he is watching...", "don't shoot yourself...", "it's all a lie...", "surrender...",
        "draw the tarot card...", "count your heartbeats..."
    ]);
    const text = whisperList[Math.floor(Math.random() * whisperList.length)];
    const el = document.createElement('div');
    el.className = 'whisper-float';
    el.innerText = text;
    el.style.left = `${Math.random() * 80 + 10}%`;
    el.style.top = `${Math.random() * 60 + 20}%`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 5000);
}

function triggerHallucination() {
    if (!tellsUnreliable() || activeGame !== 'MAIN') return;
    const hallucinations = [
        () => { for (let i = 0; i < 2; i++) { const p = document.createElement('div');
                p.className = 'card phantom-card';
                p.style.left = `${Math.random()*90}%`;
                p.style.top = `${Math.random()*90}%`;
                p.innerHTML = px('eye');
                document.getElementById('game-ui').appendChild(p);
                setTimeout(() => p.remove(), 4000); } },
        () => { if (!isMuted) { playTone(300 + Math.random() * 200, 'sine', 1, 0.1);
                setTimeout(() => playTone(100 + Math.random() * 100, 'square', 0.5, 0.1), 500); } },
        () => { const messages = ["he's behind you", "the ace is watching", "blood on your hands",
                "they all died here", "the deck is stacked"
            ]; const msg = messages[Math.floor(Math.random() * messages.length)]; const ghostText =
                document.createElement('div');
            ghostText.className = 'absolute text-purple-800 text-xl font-bold z-[149]';
            ghostText.style.left = `${Math.random()*70+15}%`;
            ghostText.style.top = `${Math.random()*70+15}%`;
            ghostText.innerText = msg;
            ghostText.style.textShadow = '0 0 10px purple';
            ghostText.style.opacity = '0.7';
            document.getElementById('game-ui').appendChild(ghostText);
            setTimeout(() => { ghostText.style.opacity = '0';
                setTimeout(() => ghostText.remove(), 1000); }, 2000); },
        () => { const ui = document.getElementById('game-ui');
            ui.style.transform = `rotate(${Math.random()*2-1}deg)`;
            setTimeout(() => ui.style.transform = 'none', 1000); }
    ];
    const chance = (100 - sanity) / 100;
    if (Math.random() < chance * 0.3) hallucinations[Math.floor(Math.random() * hallucinations.length)]();
}

function checkSanityEffects() {
    if (!isInsane || activeGame !== 'MAIN') return;
    if (Math.random() < 0.3) {
        const effects = [
            () => showDisturbingOverlay("WRONG"),
            () => document.body.classList.add('flash-red'),
            () => SFX.glitch(),
            () => { const cards = document.querySelectorAll('.card');
                cards.forEach(c => c.style.transform = `rotate(${Math.random()*10-5}deg)`); },
            () => { for (let i = 0; i < 3; i++) { const p = document.createElement('div');
                    p.className = 'card phantom-card';
                    p.style.left = `${Math.random()*90}%`;
                    p.style.top = `${Math.random()*90}%`;
                    p.innerHTML = px('eye');
                    document.getElementById('game-ui').appendChild(p);
                    setTimeout(() => p.remove(), 4000); } }
        ];
        effects[Math.floor(Math.random() * effects.length)]();
    }
}
