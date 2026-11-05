"use strict";

// =====================================================================
// HALLUCINATIONS (Sanity <= 25). Restored fully when Sanity > 25.
//   1. item text turns to Zalgo, cards jitter +-2px and tilt
//   2. phantom items: each turn 15% per empty slot shows a fake item;
//      clicking one is a hollow click and costs 2 Sanity for a while
//   3. false action: 5% of dealer turns open with a flicker of
//      "Opponent aims at YOU..." before the real action
// Uses Math.random only, so seeded runs stay identical.
// =====================================================================
const HALLU_AT = 25, PHANTOM_CHANCE = 0.15, FALSE_AIM_CHANCE = 0.05;
const PHANTOM_POOL = ['CIGARETTES', 'GLASS', 'BEER', 'SEDATIVE'];
let halluOn = false;

function halluActive() {
    return typeof sanity === 'number' && sanity <= HALLU_AT && activeGame === 'MAIN';
}
function hRand(a, b) { return a + Math.random() * (b - a); }

// combining marks U+0300..U+036F stacked on each letter
function zalgo(text, level) {
    level = level == null ? 2 : level;
    return Array.from(String(text)).map(ch => {
        if (/\s/.test(ch)) return ch;
        let o = ch;
        for (let i = Math.floor(Math.random() * (level + 1)); i > 0; i--) o += String.fromCharCode(0x300 + Math.floor(Math.random() * 112));
        return o;
    }).join('');
}
function scrambleEl(el) {
    if (!el) return;
    if (el.dataset.o == null) el.dataset.o = el.textContent;
    el.classList.add('hallu-txt');
    el.textContent = zalgo(el.dataset.o, 2);
}
function unscrambleAll() {
    document.querySelectorAll('.hallu-txt').forEach(el => {
        if (el.dataset.o != null) el.textContent = el.dataset.o;
        delete el.dataset.o; el.classList.remove('hallu-txt');
    });
}
function scrambleInfo() {
    const el = document.getElementById('item-info');
    if (!el) return;
    el.querySelectorAll('b, .ii-desc').forEach(scrambleEl);
}

// ---- jitter + text re-scramble on one persistent ticker (no per-card timers)
function halluTick() {
    if (!halluActive()) { if (halluOn) halluEnd(); return; }
    if (!halluOn) { halluOn = true; document.body.classList.add('hallu-on'); }
    document.querySelectorAll('.hallu-txt').forEach(el => { if (el.dataset.o != null) el.textContent = zalgo(el.dataset.o, 2); });
    const calm = settings.lowfx || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (calm) return;
    document.querySelectorAll('#game-ui .card').forEach(c => {
        c.style.translate = hRand(-2, 2).toFixed(1) + 'px ' + hRand(-2, 2).toFixed(1) + 'px';
        c.style.rotate = hRand(-1.6, 1.6).toFixed(2) + 'deg';
    });
}
function halluEnd() {
    halluOn = false;
    document.body.classList.remove('hallu-on');
    document.querySelectorAll('[style*="translate"], [style*="rotate"]').forEach(c => { c.style.removeProperty('translate'); c.style.removeProperty('rotate'); });
    unscrambleAll();
    if (typeof state !== 'undefined' && state) state.phantoms = {};
    if (activeGame === 'MAIN' && state) { renderUI(); }
}
setInterval(halluTick, 420);      // created at load: never cleared, never duplicated

const _halOnSan = onSanityChanged;
onSanityChanged = function(o, n) { _halOnSan(o, n); halluTick(); };

// ---- text scrambling hooks
const _halShowInfo = showItemInfo;
showItemInfo = function(k, s) { _halShowInfo(k, s); if (halluActive()) scrambleInfo(); };

// ---- phantom items
if (typeof SFX !== 'undefined') SFX.hollow = () => { tone(150, 'sine', 0.14, 0.3, { slideTo: 60 }); noiseBurst(0.05, { vol: 0.2, type: 'bandpass', freq: 500 }); };

function halluRollPhantoms() {
    state.phantoms = {};
    if (!halluActive()) return;
    const cap = typeof invCap === 'function' ? invCap() : 5;
    for (let i = state.playerItems.length; i < cap; i++) {
        if (Math.random() < PHANTOM_CHANCE) state.phantoms[i] = PHANTOM_POOL[Math.floor(Math.random() * PHANTOM_POOL.length)];
    }
    renderUI();
}
const _halTurn = onPlayerTurnHooks;
onPlayerTurnHooks = function() { _halTurn(); halluRollPhantoms(); };

function phantomClick(i, key) {
    if (state.turn !== 'player' || state.isProcessing) return;
    delete state.phantoms[i];
    SFX.hollow(); buzz(25);
    log(`PHANTOM ${ITEMS[key].en.n.toUpperCase()}: your hand closes on nothing. -2 SANITY`, 'text-purple-400');
    updateSanity(-2);
    setTimeout(() => { if (activeGame === 'MAIN') updateSanity(2); }, 20000);   // the penalty fades
    renderUI();
}

const _halRenderUI = renderUI;
renderUI = function() {
    _halRenderUI();
    if (!halluActive() || activeGame !== 'MAIN') return;
    const row = document.getElementById('player-items-row');
    if (!row) return;
    row.querySelectorAll('.item-name').forEach(scrambleEl);
    const ph = state.phantoms || {};
    Object.keys(ph).forEach(k => {
        const i = Number(k), slot = row.children[i];
        if (i < state.playerItems.length) { delete ph[k]; return; }
        if (!slot || !slot.classList.contains('item-empty')) return;
        const d = ITEMS[ph[k]];
        const b = document.createElement('button');
        b.className = `item-btn phantom-fake relative border ${d.border} ${d.color} px-3 py-2 text-lg flex items-center gap-2`;
        b.innerHTML = `<span class="key-hint border-gray-600 text-gray-400">${['Q', 'W', 'E', 'R', 'T'][i] || ''}</span> ${d.icon} <span class="item-name">${d.en.n}</span>`;
        b.onclick = () => phantomClick(i, ph[k]);
        row.replaceChild(b, slot);
        scrambleEl(b.querySelector('.item-name'));
    });
};

// ---- false action illusion
function halluMaybeFalseAim(go) {
    if (!halluActive() || Math.random() >= FALSE_AIM_CHANCE) { go(); return; }
    let n = 0;
    const iv = setInterval(() => {
        n++;
        log(n % 2 ? 'Opponent aims at YOU...' : 'Opponent aims at <b>YOU</b>... ', n % 2 ? 'text-red-500' : 'text-red-300');
        if (n % 3 === 0) SFX.glitch();
        if (n >= 9) { clearInterval(iv); go(); }
    }, 70);
}
const _halAi = aiTurn;
aiTurn = function() {
    if (state.chamber.length === 0 || state.turn !== 'dealer' || state.isProcessing || state.playerHp <= 0 || state.dealerHp <= 0) return _halAi();
    return halluMaybeFalseAim(() => _halAi());
};
