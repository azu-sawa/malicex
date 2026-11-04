"use strict";

function ascLevel() { return isDaily ? 2 : (meta.ascSel || 0); }

function hasRelic(id) { return !!(state.gauntlet && state.gauntlet.relics.includes(id)); }

function rewardMult() { return (1 + 0.2 * ascLevel()) * (state.pact === 'THIN_ICE' ? 1.5 : 1); }

// ==================== END v8.0 ====================
// ---------- UTILITIES ----------
function log(msg, className) {
    const el = document.getElementById('log-area');
    if (!el) return;
    el.innerHTML = `<span class="${className}">${msg}</span>`;
    // floating toast: restart the 2.5s fade every time a new line arrives
    el.classList.remove('log-toast');
    void el.offsetWidth;
    el.classList.add('log-toast');
}

function shakeElement(e) { if (!e) return;
    e.classList.add('shake');
    setTimeout(() => e.classList.remove('shake'), 500); }

function flashScreen(color) {
    if (color === 'blue') {
        document.body.style.filter = 'brightness(1.4) hue-rotate(180deg)';
        setTimeout(() => document.body.style.filter = '', 180);
        return;
    }
    document.body.classList.add(color === 'red' ? 'flash-red' : 'flash-green');
    setTimeout(() => document.body.classList.remove('flash-red', 'flash-green'), 300);
}

// shorter pauses when FAST HANDS is on
function dly(ms) { return (typeof settings !== 'undefined' && settings.fast) ? Math.round(ms * 0.55) : ms; }
