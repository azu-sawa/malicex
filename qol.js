"use strict";

// =====================================================================
// QUALITY OF LIFE (no new mechanics)
//   1. fullCleanup(): timers, audio tails, overlays, modifiers back to baseline
//   2. action lock: one click = one action (no double fire)
//   3. keyboard: 1-6 items, SPACE shoot opponent, S shoot self, ESC pause
//   4. item tooltips: hover or long-press
//   5. master / SFX volume, stored in localStorage
//   6. pinch-zoom / text selection locks for touch screens
// Loaded last so its wrappers are the outermost layer.
// =====================================================================
const QOL = { paused: false, timerWasOn: false, savedTime: 0, locks: {}, tipTimer: 0, suppressClick: 0 };

// ---------------------------------------------------------------- 1. cleanup
// A fresh buss for sound effects: whatever was still ringing is faded out and
// its node disconnected, so nothing from the last run leaks into the next.
function flushSfxBus() {
    if (!audioCtx || !AudioBus.master || !AudioBus.sfx) return;
    const old = AudioBus.sfx, ng = audioCtx.createGain();
    ng.connect(AudioBus.master);
    AudioBus.sfx = ng;
    applyAudioLevels();
    old.gain.setTargetAtTime(0, audioCtx.currentTime, 0.02);
    setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 400);
}

function fullCleanup() {
    RunTimers.clearAll();
    try { stopTurnTimer(); } catch (e) {}
    clearInterval(turnTimer); turnTimer = null;
    if (typeof radio !== 'undefined') radio.stop();
    if (typeof halluEnd === 'function') halluEnd();
    document.body.classList.remove('flash-red', 'flash-green', 'flash-white', 'hallu-on');
    document.body.style.filter = '';
    const gp = document.getElementById('gun-ui-panel'); if (gp) gp.classList.remove('shake-hard');
    if (typeof isInsane !== 'undefined' && isInsane && sanity > SANITY.FRACTURED) recoverSanity();
    const hb = document.getElementById('heartbeat-overlay'); if (hb) hb.classList.remove('heartbeat-active');
    itemSel = { i: -1, key: '' };
    hideItemTip();
    pendingPact = null;
    if (typeof state !== 'undefined' && state) { state.blockGain = null; state.phantoms = {}; state.isProcessing = false; }
    QOL.locks = {};
    flushSfxBus();
    if (QOL.paused) setPaused(false, true);
}

const _qolReturn = returnToMenu;
returnToMenu = function() { fullCleanup(); RunTimers.end(); return _qolReturn(); };
const _qolShowMenu = showMenu;
showMenu = function() { if (activeGame !== 'MENU') { fullCleanup(); RunTimers.end(); } return _qolShowMenu(); };
const _qolBegin = beginRun;
beginRun = function() { fullCleanup(); RunTimers.begin(); return _qolBegin(); };

// ---------------------------------------------------------------- 2. action lock
function qolLocked(name, ms) {
    const now = Date.now();
    if (QOL.paused) return true;
    if (QOL.locks[name] && now < QOL.locks[name]) return true;
    QOL.locks[name] = now + ms;
    return false;
}
['playerShoot:350', 'startPhase:450', 'raisePoker:450', 'foldPoker:450', 'redrawPoker:450', 'resolvePokerPhase:450',
 'cheatPoker:450', 'liftAction:350', 'selectDifficulty:700', 'startTurn:0'].forEach(spec => {
    const [name, ms] = spec.split(':'), orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function() {
        if (name === 'startTurn') { if (QOL.paused) { setTimeout(startTurn, 300); return; } return orig.apply(this, arguments); }
        if (qolLocked(name, Number(ms))) return;
        return orig.apply(this, arguments);
    };
});
const _qolUse = useItem;
useItem = function(who, key, idx) {
    if (who === 'player' && qolLocked('useItem', 300)) return;
    return _qolUse(who, key, idx);
};
const _qolAi = aiTurn;
aiTurn = function() { if (QOL.paused) { setTimeout(aiTurn, 300); return; } return _qolAi(); };

// ---------------------------------------------------------------- 3. keyboard + pause
function gunReady() {
    const b = document.getElementById('btn-shoot-dealer');
    return activeGame === 'MAIN' && state.turn === 'player' && !state.isProcessing && b && !b.classList.contains('hidden');
}
function useSlot(i) {
    if (state.turn !== 'player' || state.isProcessing) return;
    const k = state.playerItems[i];
    if (k) useItem('player', k, i);
    else if (state.phantoms && state.phantoms[i]) phantomClick(i, state.phantoms[i]);
}
// (keyboard handling lives in keys.js so every key can be rebound)

function setPaused(on, silent) {
    const ov = document.getElementById('pause-overlay');
    if (on === QOL.paused) return;
    QOL.paused = on;
    if (ov) ov.classList.toggle('hidden', !on);
    if (on) {
        const w = document.getElementById('tension-wrap');
        QOL.timerWasOn = !!(w && !w.classList.contains('hidden'));
        QOL.savedTime = timeLeft;
        stopTurnTimer();
        document.getElementById('pause-quit').textContent = 'QUIT TO MENU';
        QOL.quitArmed = false;
        if (!silent) SFX.click();
    } else if (!silent) {
        if (QOL.timerWasOn && activeGame === 'MAIN' && state.turn === 'player' && !state.isProcessing) { startTurnTimer(); timeLeft = QOL.savedTime || timeLeft; }
        SFX.click();
    }
}
function pauseQuit() {
    const b = document.getElementById('pause-quit');
    if (!QOL.quitArmed) { QOL.quitArmed = true; b.textContent = 'SURE? THIS COUNTS AS A LOSS'; return; }
    setPaused(false, true);
    meta.winStreak = 0; meta.inRun = false; saveGame();
    returnToMenu();
}

// ---------------------------------------------------------------- 4. tooltips
let tipEl = null;
function hideItemTip() { clearTimeout(QOL.tipTimer); if (tipEl) tipEl.classList.add('hidden'); }
function tipInfoFor(btn) {
    const row = btn.parentElement;
    if (!row) return null;
    const i = Array.prototype.indexOf.call(row.children, btn);
    if (row.id !== 'player-items-row' || typeof state === 'undefined') return null;
    let key = state.playerItems[i];
    if (!key && state.phantoms) key = state.phantoms[i];
    if (!key) return null;
    const shown = (typeof itemLie === 'function') ? itemLie(key) : key;
    const d = ITEMS[shown === 'PHANTOM' ? (state.phantomDisguise || 'GLASS') : shown];
    if (!d) return null;
    const cost = d.sanityCost ? `-${d.sanityCost} Sanity` : (d.sanityGain ? `+${d.sanityGain} Sanity` : 'No Sanity cost');
    return { name: d.en.n, desc: d.en.d, cost, gain: !d.sanityCost && d.sanityGain };
}
function showItemTip(btn) {
    const info = tipInfoFor(btn);
    if (!info) return;
    if (!tipEl) tipEl = document.getElementById('item-tip');
    if (!tipEl) return;
    tipEl.innerHTML = `<b>${info.name}</b><span>${info.desc}</span>` + (info.cost ? `<em class="${info.gain ? 'gain' : ''}">${info.cost}</em>` : '');
    if (typeof halluActive === 'function' && halluActive()) tipEl.querySelectorAll('b, span').forEach(scrambleEl);
    tipEl.classList.remove('hidden');
    const r = btn.getBoundingClientRect(), w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    tipEl.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    tipEl.style.top = Math.max(8, r.top - h - 8) + 'px';
}
document.addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return;
    const b = e.target.closest && e.target.closest('.item-btn');
    if (b) { clearTimeout(QOL.tipTimer); QOL.tipTimer = setTimeout(() => showItemTip(b), 220); }
});
document.addEventListener('pointerout', e => { if (e.pointerType === 'mouse' && e.target.closest && e.target.closest('.item-btn')) hideItemTip(); });
document.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') { hideItemTip(); return; }
    const b = e.target.closest && e.target.closest('.item-btn');
    clearTimeout(QOL.tipTimer);
    if (!b) { hideItemTip(); return; }
    QOL.tipTimer = setTimeout(() => { showItemTip(b); QOL.suppressClick = Date.now() + 1500; buzz(10); }, 450);
});
['pointerup', 'pointercancel', 'pointermove'].forEach(ev => document.addEventListener(ev, e => {
    if (e.pointerType === 'mouse') return;
    if (ev === 'pointermove' && Math.abs(e.movementX || 0) + Math.abs(e.movementY || 0) < 3) return;
    clearTimeout(QOL.tipTimer);
    if (ev === 'pointerup' && tipEl && !tipEl.classList.contains('hidden')) QOL.tipTimer = setTimeout(hideItemTip, 2600);
}));
// a long press that showed a tip must not also use the item
document.addEventListener('click', e => {
    if (QOL.suppressClick && Date.now() < QOL.suppressClick && e.target.closest && e.target.closest('.item-btn')) {
        e.stopImmediatePropagation(); e.preventDefault(); QOL.suppressClick = 0;
    }
}, true);

// ---------------------------------------------------------------- 5. volume
const VOL_KEY = 'malicex_vol';
const VOL = { master: 1, sfx: 1 };
try { const d = JSON.parse(Store.get(VOL_KEY) || '{}'); ['master', 'sfx'].forEach(k => { if (typeof d[k] === 'number') VOL[k] = Math.min(1, Math.max(0, d[k])); }); } catch (e) {}
const _qolLevels = applyAudioLevels;
applyAudioLevels = function() {
    _qolLevels();
    if (!audioCtx || !AudioBus.master) return;
    const t = audioCtx.currentTime;
    AudioBus.master.gain.cancelScheduledValues(t);
    AudioBus.master.gain.setTargetAtTime(isMuted ? 0 : 0.9 * VOL.master, t, 0.05);
    AudioBus.sfx.gain.cancelScheduledValues(t);
    AudioBus.sfx.gain.setTargetAtTime(0.85 * VOL.sfx, t, 0.05);
};
function setVol(which, v) {
    if (!(which in VOL)) return;
    VOL[which] = Math.min(1, Math.max(0, Number(v) / 100));
    Store.set(VOL_KEY, JSON.stringify(VOL));
    if (audioCtx) applyAudioLevels();
    syncVolUI();
}
function syncVolUI() {
    [['vol-master', 'master'], ['pv-master', 'master'], ['vol-sfx', 'sfx'], ['pv-sfx', 'sfx']].forEach(([id, k]) => {
        const e = document.getElementById(id);
        if (e && Number(e.value) !== Math.round(VOL[k] * 100)) e.value = Math.round(VOL[k] * 100);
    });
}
const _qolRefreshBtns = refreshAudioButtons;
refreshAudioButtons = function() { _qolRefreshBtns(); syncVolUI(); };
const _qolLobby = renderLobby;
renderLobby = function() { _qolLobby(); syncVolUI(); };

// ---------------------------------------------------------------- 6. touch locks
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
syncVolUI();

// =====================================================================
// COMPACT LOBBY: every panel box folds. Fold state is remembered.
// =====================================================================
const FOLD_KEY = 'malicex_fold';
const FOLD_DEFAULT = ['architect-box', 'terms-box', 'arcana-box', 'collection-box', 'habit-box', 'board-box', 'marks-box', 'cinema-box', 'keys-box', 'radio-box', 'jobs-box'];
let foldState = null;
function foldLoad() {
    try { foldState = JSON.parse(Store.get(FOLD_KEY) || 'null'); } catch (e) { foldState = null; }
    if (!foldState || typeof foldState !== 'object') { foldState = {}; FOLD_DEFAULT.forEach(k => { foldState[k] = true; }); }
}
function foldKey(box, i) { return box.id || ('box' + i); }
function applyFolds() {
    if (!foldState) foldLoad();
    document.querySelectorAll('#main-menu .contracts-box').forEach((box, i) => {
        if (!box.id) box.id = 'box' + i;
        const t = box.querySelector('.contracts-title');
        if (t) t.setAttribute('role', 'button');
        box.classList.toggle('folded', !!foldState[foldKey(box, i)]);
    });
}
document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('.contracts-title');
    if (!t) return;
    const box = t.parentElement;
    if (!box || !box.classList.contains('contracts-box')) return;
    const f = !box.classList.contains('folded');
    box.classList.toggle('folded', f);
    foldState[box.id] = f;
    Store.set(FOLD_KEY, JSON.stringify(foldState));
    try { SFX.click(); } catch (_) {}
});
const _foldRenderLobby = renderLobby;
renderLobby = function() { const r = _foldRenderLobby.apply(this, arguments); applyFolds(); return r; };
setTimeout(applyFolds, 0);

// body state for CSS (the floating sound button hides itself in the lobby and the house on small screens)
setInterval(() => { try { document.body.classList.toggle('menu-on', typeof activeGame !== 'undefined' && activeGame === 'MENU'); } catch (e) {} }, 300);
