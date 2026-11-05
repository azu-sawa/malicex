"use strict";

// =====================================================================
// RUN TIMERS: while a run (or duel) is active, every setTimeout /
// setInterval is remembered so fullCleanup() can cancel what is left
// when the player leaves, restarts or dies. Timers created outside a
// run (lobby whispers, HUD, heartbeat) are never touched.
// =====================================================================
const RunTimers = (() => {
    const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
    const ct = window.clearTimeout.bind(window), ci = window.clearInterval.bind(window);
    const timeouts = new Set(), intervals = new Set();
    let scope = false;
    window.setTimeout = function (fn, ms, ...a) {
        if (!scope || typeof fn !== 'function') return st(fn, ms, ...a);
        let id;
        id = st(function () { timeouts.delete(id); return fn.apply(this, a); }, ms);
        timeouts.add(id);
        return id;
    };
    window.setInterval = function (fn, ms, ...a) {
        const id = si(fn, ms, ...a);
        if (scope && typeof fn === 'function') intervals.add(id);
        return id;
    };
    window.clearTimeout = function (id) { timeouts.delete(id); return ct(id); };
    window.clearInterval = function (id) { intervals.delete(id); return ci(id); };
    return {
        begin() { scope = true; },
        end() { scope = false; },
        active() { return scope; },
        size() { return timeouts.size + intervals.size; },
        clearAll() {
            timeouts.forEach(id => ct(id)); intervals.forEach(id => ci(id));
            timeouts.clear(); intervals.clear();
        }
    };
})();
