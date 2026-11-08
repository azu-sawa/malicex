"use strict";

// =====================================================================
// SAVE v2 (Md8 overhaul)
//
//  * a versioned envelope {fmt, rev, t, ver, sum, data} with a checksum
//  * the old key stays (malicex_save_v1) so nothing is lost on update
//  * two rotating backups, and a damaged save is KEPT (never deleted)
//  * every load is sanitised and run through numbered migrations
//  * a second tab, an iOS tab-kill or a full quota cannot silently eat progress
//  * export as a short code (deflate) or a .json file, import either,
//    side settings (theme, keys, radio, volume...) travel with it
// =====================================================================
const SAVE = {
    SCHEMA: 3, FMT: 2, VER: 'Md8.1',
    KEY: VERSION, BAK: [VERSION + '_bak1', VERSION + '_bak2'], BAD: VERSION + '_bad',
    rev: 0, lastSum: '', lastWrite: 0, lastBak: 0, source: 'new',
    failed: false, behind: false, frozen: false, persisted: null,
    onLoad: [], notes: [], BAK_EVERY: 5 * 60 * 1000, REMIND: 14 * 86400000
};
SAVE.sideKeys = () => [SETTINGS_KEY, AUDIO_PREF_KEY, 'malicex_theme', 'malicex_bgm', 'malicex_keys', 'malicex_fold', 'malicex_architect', 'malicex_vol', 'malicex_radio', 'malicex_hpad'];
SAVE.allKeys = () => [SAVE.KEY, SAVE.BAD, PREV_VERSION, LEGACY_VERSION].concat(SAVE.BAK, SAVE.sideKeys());

// ---------- small tools ----------
SAVE.sum = function(str) {            // cyrb53, 53 bits, base 36
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
};
SAVE.num = (v, d, lo, hi) => { const n = typeof v === 'number' ? v : (typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN); return Number.isFinite(n) ? Math.min(hi === undefined ? Infinity : hi, Math.max(lo === undefined ? -Infinity : lo, n)) : d; };
SAVE.obj = (v, d) => (v && typeof v === 'object' && !Array.isArray(v)) ? v : d;
SAVE.arr = v => Array.isArray(v) ? v : [];
SAVE.clock = t => { if (!t) return '--:--'; const d = new Date(t), p = n => ('0' + n).slice(-2), today = new Date().toDateString() === d.toDateString(); return (today ? '' : (d.getMonth() + 1) + '/' + d.getDate() + ' ') + p(d.getHours()) + ':' + p(d.getMinutes()); };
SAVE.b64 = function(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); };
SAVE.unb64 = function(str) { const s = atob(str.replace(/\s+/g, '')), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return b; };

// ---------- what a save is ----------
SAVE.collect = () => ({
    schema: SAVE.SCHEMA, money: globalMoney, upgrades, introSeen: true, storyMode, lastLogin, nextRunItems,
    achievements: unlockedAchievements, deathCount, endlessHighScore, totalStats, unlockedLore, sanity, meta
});
SAVE.envelope = function(data, rev) {
    const ds = JSON.stringify(data);
    return { raw: '{"fmt":' + SAVE.FMT + ',"rev":' + rev + ',"t":' + Date.now() + ',"ver":"' + SAVE.VER + '","sum":"' + SAVE.sum(ds) + '","data":' + ds + '}', sum: SAVE.sum(ds) };
};
SAVE.revOf = raw => { const m = raw && /"rev":(\d+)/.exec(raw.slice(0, 80)); return m ? +m[1] : 0; };

// every old save shape in the wild: raw object (v1), envelope (v2). returns {ok, data, rev, t, why}
SAVE.parse = function(raw) {
    if (!raw || typeof raw !== 'string') return { ok: false, why: 'empty' };
    let o; try { o = JSON.parse(raw); } catch (e) { return { ok: false, why: 'unreadable' }; }
    if (!o || typeof o !== 'object') return { ok: false, why: 'shape' };
    let data, rev = 0, t = 0, legacy = false;
    if (o.fmt && o.data && typeof o.data === 'object') {
        if (o.sum && SAVE.sum(JSON.stringify(o.data)) !== o.sum) return { ok: false, why: 'checksum' };
        data = o.data; rev = SAVE.num(o.rev, 0, 0); t = SAVE.num(o.t, 0, 0);
    } else { data = o; legacy = true; }
    if (!Number.isFinite(data.money) && !(typeof data.money === 'string' && data.money.trim() !== '' && Number.isFinite(Number(data.money)))) return { ok: false, why: 'no money' };
    return { ok: true, data, rev, t, legacy };
};

// ---------- sanitise + migrate ----------
SAVE.MIGRATE = [
    // 0 -> 1: the old skill shop was refunded and the 1v1 era items cleaned up
    d => {
        const REFUND = { unlockCardPalm: 1500, unlockShellGame: 2400, extraTime: 2000, luckyFoot: 4500 };
        d.upgrades = SAVE.obj(d.upgrades, {}); let hadOld = false;
        Object.keys(REFUND).forEach(k => { if (d.upgrades[k]) { d.money += REFUND[k]; if (k === 'unlockCardPalm' || k === 'unlockShellGame') hadOld = true; } delete d.upgrades[k]; });
        if (hadOld) d.upgrades.unlockColdRead = true;
        d.nextRunItems = SAVE.arr(d.nextRunItems).filter(k => ITEMS[k] && k !== 'PHANTOM');
    },
    // 1 -> 2: the envelope. meta gets its Md8 branches, a play-since stamp and a reminder base
    d => { d.meta = SAVE.obj(d.meta, {}); if (!d.meta.since) d.meta.since = Date.now(); },
    // 2 -> 3: THE WARD and the weekly seed were cut. Their leftovers go; the nurse's key is refunded
    d => {
        d.meta = SAVE.obj(d.meta, {});
        if (d.meta.nurseKey) d.meta.marks = SAVE.num(d.meta.marks, 0, 0) + 8;
        ['ward', 'nurseKey', 'weeklyBest', 'weeklyPaid'].forEach(k => delete d.meta[k]);
        const gone = ['WEEKLY_DONE', 'WARD_CLEAR', 'GOOD_PATIENT', 'NO_PILLS'];
        d.achievements = SAVE.arr(d.achievements).filter(k => gone.indexOf(k) < 0);
        d.unlockedLore = SAVE.arr(d.unlockedLore).filter(n => n !== 64 && n !== 65);
    }
];
SAVE.sanitise = function(d) {
    const c = {};
    c.schema = SAVE.num(d.schema, 0, 0);
    c.money = SAVE.num(d.money, 200, -1e12, 1e12);
    c.upgrades = { ...SAVE.obj(d.upgrades, {}) };
    c.introSeen = !!d.introSeen;
    c.storyMode = typeof d.storyMode === 'string' ? d.storyMode : 'THIEF';
    c.lastLogin = SAVE.num(d.lastLogin, 0, 0);
    c.nextRunItems = SAVE.arr(d.nextRunItems).filter(k => typeof k === 'string');
    c.achievements = SAVE.arr(d.achievements).filter((k, i, a) => typeof k === 'string' && a.indexOf(k) === i);
    c.deathCount = SAVE.num(d.deathCount, 0, 0);
    c.endlessHighScore = SAVE.num(d.endlessHighScore, 0, 0);
    const ts = SAVE.obj(d.totalStats, {});
    c.totalStats = { kills: 0, moneyEarned: 0, itemsUsed: 0, minigamesPlayed: 0, sanityLoss: 0, sanityGain: 0, ...ts };
    Object.keys(c.totalStats).forEach(k => { c.totalStats[k] = SAVE.num(c.totalStats[k], 0); });
    c.unlockedLore = SAVE.arr(d.unlockedLore).filter((k, i, a) => Number.isFinite(k) && a.indexOf(k) === i);
    c.sanity = SAVE.num(d.sanity, 100, 0, 100);
    c.meta = { ...SAVE.obj(d.meta, {}) };
    return c;
};
SAVE.migrate = function(d) {
    let from = SAVE.num(d.schema, 0, 0), moved = false;
    if (from > SAVE.SCHEMA) return false;                  // a newer build wrote this: keep it as it is
    for (let v = from; v < SAVE.SCHEMA; v++) { try { SAVE.MIGRATE[v](d); } catch (e) { console.error('migration ' + v, e); } moved = true; }
    d.schema = SAVE.SCHEMA;
    return moved;
};

// ---------- applying a save to the running game ----------
SAVE.apply = function(raw) {
    const d = SAVE.sanitise(raw);
    const moved = SAVE.migrate(d);
    globalMoney = d.money;
    upgrades = { ...upgrades, ...d.upgrades };
    introSeen = d.introSeen; storyMode = d.storyMode; lastLogin = d.lastLogin;
    nextRunItems = d.nextRunItems.filter(k => ITEMS[k] && k !== 'PHANTOM');
    unlockedAchievements = d.achievements; deathCount = d.deathCount; endlessHighScore = d.endlessHighScore;
    totalStats = d.totalStats; unlockedLore = d.unlockedLore; sanity = d.sanity;
    meta = { ...meta, ...d.meta };
    return moved;
};

// ---------- LOAD ----------
function loadGame() {
    SAVE.notes = [];
    const tries = [[SAVE.KEY, 'MAIN'], [SAVE.BAK[0], 'BACKUP 1'], [SAVE.BAK[1], 'BACKUP 2'], [PREV_VERSION, 'OLD SAVE'], [LEGACY_VERSION, 'OLD SAVE']];
    let hit = null, damaged = false;
    for (const [k, label] of tries) {
        const raw = Store.get(k); if (!raw) continue;
        const r = SAVE.parse(raw);
        if (r.ok) { hit = { k, label, r }; break; }
        if (k === SAVE.KEY) { damaged = true; Store.set(SAVE.BAD, raw); }          // keep the damaged one, never delete it
    }
    if (!hit) {
        if (damaged) SAVE.notes.push('YOUR SAVE COULD NOT BE READ AND NO BACKUP WORKED. A COPY WAS KEPT: SYSTEM > SAVE DATA.');
        SAVE.source = 'new'; SAVE.hooks(); return;
    }
    let moved = false;
    try { moved = SAVE.apply(hit.r.data); }
    catch (e) { console.error('Save apply failed', e); Store.set(SAVE.BAD, Store.get(hit.k) || ''); SAVE.notes.push('A SAVE FAILED TO LOAD. A COPY WAS KEPT.'); SAVE.hooks(); return; }
    SAVE.rev = hit.r.rev; SAVE.source = hit.label; SAVE.lastSum = hit.k === SAVE.KEY && !hit.r.legacy && !moved ? SAVE.sum(JSON.stringify(SAVE.collect())) : '';
    if (damaged && hit.k !== SAVE.KEY) SAVE.notes.push('YOUR SAVE WAS DAMAGED. RESTORED FROM ' + hit.label + ' (' + SAVE.clock(hit.r.t) + ').');
    SAVE.hooks();
    if (hit.k !== SAVE.KEY || hit.r.legacy || moved || SAVE.notes.length) SAVE.write('load', true);
}
SAVE.hooks = function() {
    // a run that was cut off hands back its starting gear
    try {
        if (meta.inRun && Array.isArray(meta.runGear) && meta.runGear.length) {
            nextRunItems = meta.runGear.filter(k => ITEMS[k]).concat(nextRunItems); SAVE.notes.push('A RUN WAS CUT OFF. ITS STARTING GEAR WAS RETURNED TO YOU.');
        }
        delete meta.runGear;
    } catch (e) {}
    SAVE.onLoad.forEach(f => { try { f(); } catch (e) { console.error('onLoad', e); } });
};

// ---------- WRITE ----------
function saveGame() { SAVE.write('game'); }
SAVE.write = function(why, force) {
    if (SAVE.frozen) return false;
    if (SAVE.behind && !force) return false;
    if (!meta.inRun && meta.runGear) delete meta.runGear;
    let ds, sum;
    try { ds = JSON.stringify(SAVE.collect()); sum = SAVE.sum(ds); } catch (e) { console.error('Save collect failed', e); return false; }
    const cur = Store.get(SAVE.KEY), curRev = SAVE.revOf(cur);
    if (curRev > SAVE.rev && !force) { SAVE.setBehind(); return false; }       // another tab saved after us
    if (sum === SAVE.lastSum && !force && !SAVE.failed) return true;           // nothing changed
    try { flashSaveIndicator(); } catch (e) {}
    const now = Date.now();
    // rotate a backup of the last good main save every few minutes
    if (cur && now - SAVE.lastBak > SAVE.BAK_EVERY) SAVE.snap(cur);
    const env = SAVE.envelope(SAVE.collect(), Math.max(SAVE.rev, curRev) + 1);
    let ok = Store.set(SAVE.KEY, env.raw);
    if (!ok && Store.persistent) {                                                // quota: let go of backups, then the damaged copy
        Store.remove(SAVE.BAK[1]); ok = Store.set(SAVE.KEY, env.raw);
        if (!ok) { Store.remove(SAVE.BAD); ok = Store.set(SAVE.KEY, env.raw); }
        if (!ok) { Store.remove(SAVE.BAK[0]); ok = Store.set(SAVE.KEY, env.raw); }
    }
    if (ok && Store.persistent && Store.get(SAVE.KEY) !== env.raw) ok = false;      // read it back
    SAVE.lastWrite = now;
    if (ok) { SAVE.rev = Math.max(SAVE.rev, curRev) + 1; SAVE.lastSum = env.sum; if (SAVE.failed) { SAVE.failed = false; SAVE.paint(); } }
    else if (!SAVE.failed) { SAVE.failed = true; SAVE.paint(); if (Store.persistent) SAVE.say('COULD NOT SAVE: STORAGE IS FULL. EXPORT A CODE FROM SYSTEM > SAVE DATA.', { sticky: true }); }
    return ok;
};
SAVE.snap = function(rawNow) {          // push the current main save into the backup ring
    const cur = rawNow || Store.get(SAVE.KEY);
    if (!cur || !SAVE.parse(cur).ok) return false;
    const b1 = Store.get(SAVE.BAK[0]);
    if (b1 && SAVE.sumOfRaw(b1) === SAVE.sumOfRaw(cur)) { SAVE.lastBak = Date.now(); return false; }
    if (b1) Store.set(SAVE.BAK[1], b1);
    Store.set(SAVE.BAK[0], cur); SAVE.lastBak = Date.now(); return true;
};
SAVE.sumOfRaw = raw => { const m = /"sum":"([a-z0-9]+)"/.exec((raw || '').slice(0, 160)); return m ? m[1] : SAVE.sum(raw || ''); };

// ---------- another tab / lost tab ----------
SAVE.setBehind = function() {
    if (SAVE.behind) return; SAVE.behind = true; SAVE.paint();
    SAVE.say('YOUR SAVE CHANGED IN ANOTHER TAB. THIS TAB WILL NOT SAVE.', { sticky: true, actions: [['RELOAD', () => { SAVE.frozen = true; location.reload(); }], ['KEEP THIS TAB', () => { SAVE.behind = false; SAVE.write('keep', true); SAVE.say('THIS TAB NOW OWNS THE SAVE.'); SAVE.paint(); }]] });
};
SAVE.checkBehind = function() { const cur = Store.get(SAVE.KEY); if (SAVE.revOf(cur) > SAVE.rev) SAVE.setBehind(); };

// ---------- messages on screen ----------
SAVE.say = function(text, o) {
    o = o || {}; let b = document.getElementById('save-banner');
    if (!b) { b = document.createElement('div'); b.id = 'save-banner'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
    clearTimeout(SAVE.bt); b.innerHTML = '';
    const s = document.createElement('span'); s.textContent = text; b.appendChild(s);
    (o.actions || []).forEach(([l, fn]) => { const x = document.createElement('button'); x.textContent = l; x.onclick = () => { b.classList.add('hidden'); fn(); }; b.appendChild(x); });
    if (!(o.actions || []).length) { const x = document.createElement('button'); x.textContent = 'OK'; x.onclick = () => b.classList.add('hidden'); b.appendChild(x); }
    b.classList.remove('hidden');
    if (!o.sticky) SAVE.bt = setTimeout(() => b.classList.add('hidden'), o.ms || 7000);
};
SAVE.paint = function() {
    const el = document.getElementById('save-indicator'); if (el) { el.classList.toggle('bad', SAVE.failed || SAVE.behind); const s = el.querySelector('span'); if (s) s.textContent = (SAVE.failed || SAVE.behind) ? 'NOT SAVED' : 'SAVED'; if (SAVE.failed || SAVE.behind) el.classList.add('on'); }
    SAVE.panel();
};

// ---------- the SYSTEM panel ----------
SAVE.slots = function() {
    return [[SAVE.KEY, 'CURRENT'], [SAVE.BAK[0], 'BACKUP 1'], [SAVE.BAK[1], 'BACKUP 2'], [SAVE.BAD, 'DAMAGED COPY']].map(([k, label]) => {
        const raw = Store.get(k); if (!raw) return { k, label, empty: true };
        const r = SAVE.parse(raw); if (!r.ok) return { k, label, bad: true, why: r.why };
        const d = r.data; return { k, label, t: r.t, money: SAVE.num(d.money, 0), trophies: SAVE.arr(d.achievements).length, lore: SAVE.arr(d.unlockedLore).length, runs: SAVE.num((d.meta || {}).runs, 0), rev: r.rev };
    });
};
SAVE.panel = function() {
    const box = document.getElementById('save-panel'); if (!box) return;
    const slots = SAVE.slots(), st = Store.persistent ? (SAVE.persisted ? 'PROTECTED' : 'NORMAL') : 'BLOCKED';
    let h = '<div class="sv-stat ' + (SAVE.failed || SAVE.behind ? 'bad' : '') + '">' + (SAVE.failed ? 'NOT SAVING: STORAGE FULL OR BLOCKED' : SAVE.behind ? 'NOT SAVING: ANOTHER TAB OWNS THE SAVE' : 'LAST SAVE ' + SAVE.clock(SAVE.lastWrite || (slots[0] && slots[0].t)) + ' &middot; STORAGE ' + st) + '</div>';
    h += '<div class="sv-slots">';
    slots.forEach((s, i) => {
        if (s.empty && i > 0) { h += '<div class="sv-slot dim"><b>' + s.label + '</b><span>empty</span></div>'; return; }
        if (s.empty) { h += '<div class="sv-slot dim"><b>' + s.label + '</b><span>nothing saved yet</span></div>'; return; }
        if (s.bad) { h += '<div class="sv-slot bad"><b>' + s.label + '</b><span>unreadable (' + s.why + ')</span></div>'; return; }
        h += '<div class="sv-slot"><b>' + s.label + '</b><span>' + SAVE.clock(s.t) + ' &middot; $' + s.money + ' &middot; ' + s.trophies + ' trophies &middot; ' + s.lore + ' pages</span>' + (i === 0 ? '' : '<button class="sv-b" onclick="restoreBackup(' + i + ')">RESTORE</button>') + '</div>';
    });
    box.innerHTML = h + '</div>';
};

// ---------- export ----------
SAVE.bundle = function() {
    SAVE.write('export', true);
    const raw = Store.get(SAVE.KEY); if (!raw) return null;
    const side = {}; SAVE.sideKeys().forEach(k => { const v = Store.get(k); if (v) side[k] = v; });
    return { app: 'malicex', fmt: 2, exported: Date.now(), env: JSON.parse(raw), side };
};
SAVE.pack = async function(text) {
    if (typeof CompressionStream !== 'undefined') {
        try { const buf = new Uint8Array(await new Response(new Blob([text]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); return 'MLZ2:' + SAVE.b64(buf); } catch (e) {}
    }
    return 'MLX2:' + SAVE.b64(new TextEncoder().encode(text));
};
SAVE.unpack = async function(code) {
    const t = code.trim();
    if (t.startsWith('MLZ2:')) { const b = SAVE.unb64(t.slice(5)); return await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate'))).text(); }
    if (t.startsWith('MLX2:')) return new TextDecoder().decode(SAVE.unb64(t.slice(5)));
    if (t.startsWith('MLX1:')) return decodeURIComponent(escape(atob(t.slice(5))));            // the old code
    if (t.startsWith('{')) return t;                                                          // a .json file
    throw new Error('prefix');
};
async function exportSave() {
    const b = SAVE.bundle(), box = document.getElementById('save-io');
    if (!b || !box) { setSysMsg('Nothing to export yet.'); return; }
    meta.lastExport = Date.now(); SAVE.write('export-stamp', true);
    box.value = await SAVE.pack(JSON.stringify(b)); box.focus(); box.select();
    setSysMsg(Store.persistent ? 'Save code ready (' + box.value.length + ' characters). Copy it somewhere safe.' : 'Browser storage is blocked. Copy this code or progress is lost on close.');
}
function exportFile() {
    const b = SAVE.bundle(); if (!b) { setSysMsg('Nothing to export yet.'); return; }
    meta.lastExport = Date.now(); SAVE.write('export-stamp', true);
    const d = new Date(), p = n => ('0' + n).slice(-2), name = 'malicex-save-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
    try {
        const url = URL.createObjectURL(new Blob([JSON.stringify(b)], { type: 'application/json' })), a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
        setSysMsg('Saved as ' + name + '.');
    } catch (e) { setSysMsg('This browser would not download. Use EXPORT CODE instead.'); }
}

// ---------- import ----------
SAVE.read = async function(text) {      // text or code -> {ok, env, side, why}
    let json;
    try { json = await SAVE.unpack(text); } catch (e) { return { ok: false, why: 'That is not a Malicex save.' }; }
    let o; try { o = JSON.parse(json); } catch (e) { return { ok: false, why: 'The save is damaged.' }; }
    let env, side = {};
    if (o && o.app === 'malicex' && o.env) { env = o.env; side = SAVE.obj(o.side, {}); }
    else if (o && o.fmt && o.data) env = o;
    else if (o && typeof o === 'object' && o.money !== undefined) env = o;                       // an old raw save
    else return { ok: false, why: 'That is not a Malicex save.' };
    const r = SAVE.parse(JSON.stringify(env));
    if (!r.ok) return { ok: false, why: r.why === 'checksum' ? 'The save failed its integrity check. It was changed or cut short.' : 'The save is damaged.' };
    return { ok: true, data: r.data, t: r.t, side };
};
SAVE.install = function(r) {            // replace the current save with a read one. a backup of the old one is kept
    SAVE.snap(Store.get(SAVE.KEY)); SAVE.lastBak = 0;
    const d = SAVE.sanitise(r.data); SAVE.migrate(d);
    const env = SAVE.envelope(d, Math.max(SAVE.rev, SAVE.revOf(Store.get(SAVE.KEY))) + 1);
    SAVE.frozen = true;
    if (!Store.set(SAVE.KEY, env.raw)) { SAVE.frozen = false; return false; }
    Object.keys(r.side || {}).forEach(k => { if (SAVE.sideKeys().includes(k) && typeof r.side[k] === 'string') Store.set(k, r.side[k]); });
    return true;
};
async function importSave() {
    const box = document.getElementById('save-io'), txt = (box && box.value || '').trim();
    if (!txt) { setSysMsg('Paste a save code first, or use IMPORT FILE.'); SFX.empty(); return; }
    return SAVE.importText(txt);
}
SAVE.importText = async function(txt) {
    const r = await SAVE.read(txt);
    if (!r.ok) { setSysMsg(r.why); SFX.empty(); return false; }
    const d = r.data, mine = SAVE.collect();
    const fmt = x => '$' + SAVE.num(x.money, 0) + ', ' + SAVE.arr(x.achievements).length + ' trophies, ' + SAVE.arr(x.unlockedLore).length + ' pages, ' + SAVE.num((x.meta || {}).runs, 0) + ' runs';
    if (!confirm('Replace this save?\n\nTHIS DEVICE: ' + fmt(mine) + '\nIMPORTED' + (r.t ? ' (' + SAVE.clock(r.t) + ')' : '') + ': ' + fmt(d) + '\n\nYour current save is kept as BACKUP 1.')) { setSysMsg('Import cancelled.'); return false; }
    if (!SAVE.install(r)) { setSysMsg('Could not write the save: storage is full or blocked.'); SFX.empty(); return false; }
    setSysMsg('Save restored. Reloading...'); setTimeout(() => location.reload(), 600); return true;
};
function importFile(input) {
    const f = input && input.files && input.files[0]; if (!f) return;
    if (f.size > 4e6) { setSysMsg('That file is too large to be a save.'); input.value = ''; return; }
    const rd = new FileReader();
    rd.onload = () => { SAVE.importText(String(rd.result || '')); input.value = ''; };
    rd.onerror = () => setSysMsg('Could not read that file.');
    rd.readAsText(f);
}
function restoreBackup(i) {
    const s = SAVE.slots()[i]; if (!s || s.empty || s.bad) return;
    if (!confirm('Restore ' + s.label + ' (' + SAVE.clock(s.t) + ', $' + s.money + ', ' + s.trophies + ' trophies)? The current save is kept as a backup.')) return;
    const r = SAVE.parse(Store.get(s.k)); if (!r.ok) return;
    SAVE.write('pre-restore', true);
    const cur = Store.get(SAVE.KEY);
    if (!SAVE.install({ data: r.data, side: {} })) { setSysMsg('Could not write the save.'); return; }
    if (cur && s.k !== SAVE.BAD) Store.set(s.k, cur);                         // swap, nothing is lost
    setSysMsg('Restored. Reloading...'); setTimeout(() => location.reload(), 600);
}
function setSysMsg(t) { const m = document.getElementById('sys-msg'); if (m) m.textContent = t; }

// ---------- erase ----------
function resetSave() {
    if (!confirm('Erase all progress, settings and trophies on this device? This cannot be undone.')) return;
    if (!confirm('Last chance. Backups are erased too. Export first if there is any doubt.')) return;
    SAVE.frozen = true;
    SAVE.allKeys().forEach(k => Store.remove(k));
    location.reload();
}

// ---------- keeping it alive ----------
SAVE.init = function() {
    const _svTab = showLobbyTab;
    showLobbyTab = function(id, fromUser) { _svTab(id, fromUser); if (id === 'system') SAVE.panel(); };
    window.addEventListener('storage', e => { if (e.key === SAVE.KEY && e.newValue && SAVE.revOf(e.newValue) > SAVE.rev) SAVE.setBehind(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) SAVE.write('hide'); else SAVE.checkBehind(); });
    window.addEventListener('pagehide', () => SAVE.write('pagehide'));
    setInterval(() => SAVE.write('tick'), 20000);
    try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(p => { SAVE.persisted = p; }); } catch (e) {}
    document.addEventListener('pointerdown', () => {      // ask once: protects the save from being evicted when the device is short of space
        try { if (SAVE.persisted === false && navigator.storage && navigator.storage.persist) navigator.storage.persist().then(p => { SAVE.persisted = p; }); } catch (e) {}
    }, { once: true });
    if (!Store.persistent) SAVE.notes.push('THIS BROWSER BLOCKS STORAGE. PROGRESS IS LOST WHEN YOU CLOSE IT. EXPORT A CODE.');
    const since = meta.lastExport || meta.since || Date.now();
    if (!SAVE.persisted && Store.persistent && (meta.runs || 0) >= 3 && Date.now() - since > SAVE.REMIND) SAVE.notes.push('NO BACKUP CODE IN TWO WEEKS. SYSTEM > SAVE DATA > EXPORT.');
    if (SAVE.notes.length) setTimeout(() => SAVE.say(SAVE.notes.join('  '), { ms: 11000 }), 1200);
    SAVE.paint();
};
