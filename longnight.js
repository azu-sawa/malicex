"use strict";

// =====================================================================
// THE LONG NIGHT (Md8)
// Ring the bell in the Study. Until dawn (5 minutes) the dealers you beat
// hunt you through the House. Keep moving, keep a candle, find what the
// house left lying around. When one catches you, you play a short shell
// duel for your life. Survive until the light comes in sideways.
// =====================================================================
const LN = { on: false, t: 0, dur: 300, hunters: [], candles: 0, took: 0, lit: 0, caught: 0, repelled: 0, loot: {}, grid: null, evT: 20, drainT: 12, hudT: 0, hb: 0, fake: null, duel: null, prevDay: null, startedDay: null, pathT: 0 };
const LN_ROOMS = ['STUDY', 'HALL', 'ARCADE', 'CORRIDOR', 'LIBRARY', 'CELLAR'];
const LN_FALLBACK = ['SADISTIC', 'MIMIC', 'WARDEN', 'CALCULATING'];
const LN_WHISPERS = ['SOMEONE SAYS YOUR NAME', 'THE FLOOR IS WARM WHERE YOU STOOD', 'YOU COUNTED WRONG. AGAIN', 'A DOOR CLOSES. ONE YOU HAVE NOT OPENED', 'YOUR OWN FOOTSTEPS ARE A BEAT BEHIND YOU', 'SOMETHING EXHALES NEAR YOUR EAR', 'THE CLOCK IN THE HALL SKIPS', 'YOU ARE NOT BEING CHASED. YOU ARE BEING WALKED TOWARD'];

function lnData() {
    const d = hsData(); d.ln = d.ln || {}; const l = d.ln;
    l.up = l.up || {}; l.nights = l.nights || 0; l.best = l.best || 0; l.salt = l.salt || 0; l.rites = l.rites || 0; l.pass = l.pass || 0;
    return l;
}
function lnReady() { const l = lnData(); return l.day !== hsDay() || l.pass > 0; }

// ---------- the house as a graph ----------
function lnAdj(room) {
    const m = HOUSE_MAPS[room]; if (!m) return [];
    return m.objs.filter(o => o.t === 'portal' && o.to !== 'EXIT' && o.to !== 'WRONG' && HOUSE_MAPS[o.to] && (!o.lock || meta[o.lock])).map(o => o.to).filter((v, i, a) => a.indexOf(v) === i);
}
function lnRoomPath(from, to) {      // list of rooms from `from` (excluded) to `to`
    if (from === to) return [];
    const prev = { [from]: null }, q = [from];
    while (q.length) { const c = q.shift(); if (c === to) break; lnAdj(c).forEach(n => { if (!(n in prev)) { prev[n] = c; q.push(n); } }); }
    if (!(to in prev)) return null;
    const out = []; let c = to; while (c !== from) { out.unshift(c); c = prev[c]; } return out;
}
function lnDist(a, b) { const p = lnRoomPath(a, b); return p ? p.length : 9; }

// ---------- who hunts you ----------
function lnPickHunters() {
    const l = lnData(), t = tenantList(), rest = t.filter(k => tenantState(k) === 'RESTLESS');
    let pool = rest.concat(t.filter(k => !rest.includes(k)));
    if (l.up.deed) pool = pool.filter(k => tenantState(k) !== 'CONTENT');
    LN_FALLBACK.forEach(k => { if (!pool.includes(k)) pool.push(k); });
    const n = Math.max(2, Math.min(4, 1 + Math.floor(t.length / 2) + (rest.length ? 1 : 0)));
    return pool.filter(k => HOUSE_FOLK[k]).slice(0, n);
}

// ---------- starting ----------
function lnBegin() {
    const l = lnData(), d = hsData();
    if (!lnReady() || LN.on) return;
    LN.prevDay = l.day; LN.startedWithPass = l.day === hsDay(); if (LN.startedWithPass) l.pass--; l.day = hsDay(); LN.pageRoom = null;
    LN.on = true; LN.t = 0; LN.over = false; LN.caught = 0; LN.repelled = 0; LN.lit = 0; LN.loot = {}; LN.fake = null; LN.duel = null; LN.evT = 18; LN.drainT = 12; LN.hudT = 0; LN.hb = 0; LN.pathT = 0;
    LN.dur = 300; if (l.coffee > 0) { l.coffee--; LN.dur = 270; }
    LN.took = Math.min(3, d.scraps.CANDLE || 0); d.scraps.CANDLE = (d.scraps.CANDLE || 0) - LN.took;
    LN.candles = 3 + LN.took + (l.up.candle2 ? 2 : 0);
    const keys = lnPickHunters();
    LN.hunters = keys.map((k, i) => ({ k, room: i % 2 ? 'ARCADE' : 'CORRIDOR', prev: 'HALL', eta: 24 + i * 9 + Math.random() * 6, stun: 0, seen: 0, x: 0, y: 0, path: null, fleeT: 0, step: 0 }));
    if (meta.brassKey && LN.hunters[2]) LN.hunters[2].room = 'CELLAR';
    l.act = { prevDay: LN.prevDay, pass: LN.startedWithPass ? 1 : 0, took: LN.took };   // so a crash or a closed tab does not eat the night
    saveGame();
    HS.lamp = 0; HS.seal = 0; HS.black = 0; HS.blink = 0; HS.cold = 0; HS.ghost = null; HS.follow = null; HS.ring = false; HS.menu = null; HS.dlg = null;
    hsMenuClose();
    lnHud(true);
    try { Music.setScene('night_hunt'); } catch (e) {}
    const go = () => { hsLoad('STUDY', 7, 5); HS.lastRoom = ''; hsToast('THE LONG NIGHT'); SFX.bell(); };
    if (!(meta.cineSeen || {}).ln_begin) { cinePlay('ln_begin', go, { restore: 'night_hunt' }); } else go();
}
function lnHud(on) {
    let e = document.getElementById('ln-hud');
    if (!on) { if (e) e.classList.add('hidden'); document.body.classList.remove('ln-on'); return; }
    if (!e) { e = document.createElement('div'); e.id = 'ln-hud'; e.className = 'ln-hud'; document.getElementById('house-view').appendChild(e); }
    e.classList.remove('hidden'); document.body.classList.add('ln-on'); lnHudDraw();
}
function lnHudDraw() {
    const e = document.getElementById('ln-hud'); if (!e || !LN.on) return;
    const left = Math.max(0, Math.ceil(LN.dur - LN.t)), mm = Math.floor(left / 60), ss = ('0' + (left % 60)).slice(-2);
    const dd = LN.hunters.length ? Math.min.apply(null, LN.hunters.filter(h => !h.stun).map(h => lnDist(h.room, HS.map)).concat([9])) : 9;
    const bars = dd === 0 ? 4 : dd === 1 ? 3 : dd === 2 ? 2 : 1, up = lnData().up;
    const where = up.map ? ' <b>' + LN.hunters.map(h => (h.stun > 0 ? 'z' : '') + HOUSE_MAPS[h.room].name.replace('THE ', '').slice(0, 4)).join(' ') + '</b>' : '';
    e.innerHTML = '<span>DAWN <b>' + mm + ':' + ss + '</b></span><span>CANDLES <b>' + '●'.repeat(Math.min(9, LN.candles)) + '</b></span><span class="ln-dread d' + bars + '">DREAD ' + '▮'.repeat(bars) + '▯'.repeat(4 - bars) + '</span>' + where;
}

// ---------- rooms ----------
const _lnLoad = hsLoad;
hsLoad = function(id, sx, sy) {
    _lnLoad(id, sx, sy);
    if (LN.on) lnRoomLoaded(id);
};
function lnRoomLoaded(id) {
    // no visitors tonight, the tenants that are not hunting stay in their chairs
    hsObjs = hsObjs.filter(o => !(o.t === 'npc' && (o.visitor || LN.hunters.some(h => h.k === o.who))));
    // loot for this room, made once per night
    if (!LN.loot[id]) {
        const m = HOUSE_MAPS[id], open = [];
        for (let y = 2; y < hsMH - 1; y++) for (let x = 1; x < hsMW - 1; x++) if (hsGrid[y][x] === 0 && !hsObjs.some(o => (o.solid || o.t === 'portal') && x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) && !hsObjs.some(o => (o.t === 'coin' || o.t === 'scrap') && o.x === x && o.y === y)) open.push([x, y]);
        const n = id === 'STUDY' ? 1 : 2 + (Math.random() < 0.5 ? 1 : 0), list = [];
        for (let i = 0; i < n && open.length; i++) {
            const p = open.splice(Math.floor(Math.random() * open.length), 1)[0], r = Math.random();
            list.push({ x: p[0], y: p[1], k: r < 0.5 ? 'candle' : r < 0.78 ? 'tonic' : 'coin', got: 0 });
        }
        LN.loot[id] = list;
        if (!LN.pageRoom) LN.pageRoom = ['ARCADE', 'CORRIDOR', 'LIBRARY'][Math.floor(Math.random() * 3)];
        if (id === LN.pageRoom && open.length && fragMissing().length) { const p = open.splice(Math.floor(Math.random() * open.length), 1)[0]; list.push({ x: p[0], y: p[1], k: 'page', got: 0 }); }
    }
    LN.loot[id].forEach((it, i) => { if (!it.got) hsObjs.push({ t: 'lnloot', x: it.x, y: it.y, w: 1, h: 1, act: 'lnloot', li: i, k: it.k, label: it.k === 'candle' ? 'A CANDLE STUB' : it.k === 'tonic' ? 'A TONIC' : it.k === 'coin' ? 'LOOSE COINS' : 'A LOOSE PAGE', room: id }); });
    // hunters already in this room wait at the far end
    LN.grid = hsGrid.map(r => r.slice());
    hsObjs.forEach(o => { if (o.solid) for (let y = o.y; y < o.y + o.h; y++) for (let x = o.x; x < o.x + o.w; x++) if (LN.grid[y]) LN.grid[y][x] = 1; });
    LN.hunters.forEach(h => { if (h.room === id) lnPlaceFar(h); });
    lnSyncObjs();
    lnHudDraw();
}
function lnPlaceFar(h) {
    const px = HS.x, py = HS.y, tries = [];
    for (let y = 2; y < hsMH - 1; y++) for (let x = 1; x < hsMW - 1; x++) if (LN.grid[y][x] === 0) tries.push([x * TILE + 8, y * TILE + 14]);
    tries.sort((a, b) => Math.hypot(b[0] - px, b[1] - py) - Math.hypot(a[0] - px, a[1] - py));
    const c = tries[Math.floor(Math.random() * Math.min(10, tries.length))] || [px + 80, py];
    h.x = c[0]; h.y = c[1]; h.seen = -1; h.fleeT = 0; h.path = null;
}
function lnSyncObjs() {
    hsObjs = hsObjs.filter(o => o.t !== 'hunter');
    LN.hunters.forEach(h => { if (h.room === HS.map) hsObjs.push({ t: 'hunter', hu: h, x: h.x / TILE, y: h.y / TILE - 1, w: 0, h: 1 }); });
}

// ---------- drawing ----------
const _lnDrawObj = hsDrawObj;
hsDrawObj = function(g, o, t) {
    const x = o.x * TILE, y = o.y * TILE;
    if (o.t === 'hunter') {
        const h = o.hu, f = hsFolkOpts(h.k), dir = Math.abs(HS.x - h.x) > Math.abs(HS.y - h.y) ? (HS.x < h.x ? 'left' : 'right') : (HS.y < h.y ? 'up' : 'down');
        hsRect(g, h.x - 7, h.y - 2, 14, 3, 'rgba(0,0,0,.5)');
        g.globalAlpha = h.stun > 0 ? 0.35 : 0.92; hsPerson(g, h.x - 6, h.y - 15 + Math.floor(Math.sin(HS.t * 6 + h.step) * 0.8), dir, (h.step || 0), f); g.globalAlpha = 1;
        hsRect(g, h.x - 6, h.y - 15, 12, 16, 'rgba(0,0,0,.28)');
        return;
    }
    if (o.t === 'lnloot') {
        const b = Math.sin(HS.t * 3 + o.x) > 0 ? 0 : 1;
        if (o.k === 'candle') { hsRect(g, x + 6, y + 8 + b, 4, 6, '#fde68a'); hsRect(g, x + 7, y + 5 + b, 2, 3, '#fbbf24'); }
        else if (o.k === 'tonic') { hsRect(g, x + 5, y + 7 + b, 6, 7, '#38bdf8'); hsRect(g, x + 6, y + 5 + b, 4, 3, '#e2e8f0'); }
        else if (o.k === 'coin') { hsRect(g, x + 4, y + 8 + b, 8, 6, '#d97706'); hsRect(g, x + 5, y + 7 + b, 6, 5, '#fbbf24'); }
        else { hsRect(g, x + 4, y + 5 + b, 8, 10, '#e2e8f0'); hsRect(g, x + 4, y + 5 + b, 1, 10, '#ef4444'); hsRect(g, x + 6, y + 8 + b, 5, 1, '#64748b'); hsRect(g, x + 6, y + 10 + b, 4, 1, '#64748b'); }
        hsRect(g, x + 7, y + 3 + b, 2, 1, 'rgba(255,255,255,.6)');
        return;
    }
    if (o.t === 'nbell') {
        const ready = lnReady(), glow = ready ? 0.5 + 0.5 * Math.sin(HS.t * 3) : 0;
        hsRect(g, x + 3, y + 12, 10, 3, '#57534e'); hsRect(g, x + 7, y + 8, 2, 5, '#78716c');
        hsRect(g, x + 4, y + 3, 8, 6, ready ? '#fbbf24' : '#a16207'); hsRect(g, x + 3, y + 8, 10, 2, ready ? '#f59e0b' : '#78350f'); hsRect(g, x + 7, y + 10, 2, 2, '#292524');
        if (ready) { g.fillStyle = 'rgba(251,191,36,' + (0.08 + 0.06 * glow) + ')'; g.beginPath(); g.arc(x + 8, y + 6, 14, 0, 6.3); g.fill(); }
        return;
    }
    return _lnDrawObj(g, o, t);
};
const _lnDraw = hsDraw;
hsDraw = function() {
    _lnDraw();
    if (!LN.on || HS.black > 0) return;
    const cv = document.getElementById('house-canvas'); if (!cv) return;
    const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0);
    const dawn = Math.max(0, (LN.t - (LN.dur - 40)) / 40);
    const px = HS.x - HS.cam.x, py = HS.y - HS.cam.y - 8, rad = (LN.lit > 0 ? 130 : 56) + dawn * 150 + (LN.lit > 0 && LN.lit < 3 ? -LN.lit * 0 : 0);
    const gr = g.createRadialGradient(px, py, rad * 0.22, px, py, rad);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,' + (0.86 - dawn * 0.5) + ')');
    g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    if (LN.lit > 0) { const gl = g.createRadialGradient(px, py, 3, px, py, 90); gl.addColorStop(0, 'rgba(253,186,60,.22)'); gl.addColorStop(1, 'rgba(253,186,60,0)'); g.fillStyle = gl; g.fillRect(0, 0, VW, VH); }
    // eyes in the dark
    LN.hunters.forEach(h => {
        if (h.room !== HS.map || h.stun > 0) return;
        const ex = Math.round(h.x - HS.cam.x), ey = Math.round(h.y - HS.cam.y - 10), f = HOUSE_FOLK[h.k].trim, a = 0.65 + 0.3 * Math.sin(HS.t * 9 + h.step);
        g.globalAlpha = a; g.fillStyle = f; g.fillRect(ex - 3, ey, 2, 2); g.fillRect(ex + 1, ey, 2, 2); g.globalAlpha = 1;
    });
    if (LN.fake) { const ex = Math.round(LN.fake.x - HS.cam.x), ey = Math.round(LN.fake.y - HS.cam.y); g.globalAlpha = Math.min(1, LN.fake.t * 2); g.fillStyle = '#ef4444'; g.fillRect(ex - 3, ey, 2, 2); g.fillRect(ex + 1, ey, 2, 2); g.globalAlpha = 1; }
    if (LN.t < 3) { g.fillStyle = 'rgba(0,0,0,' + (1 - LN.t / 3) + ')'; g.fillRect(0, 0, VW, VH); }
};

// ---------- the night itself ----------
const _lnHorror = hsHorror;
hsHorror = function(dt) { if (LN.on) return lnTick(dt); return _lnHorror(dt); };

function lnEta() { const l = lnData(); return Math.max(4, 11 - (LN.t / LN.dur) * 5 + Math.random() * 5) * (l.up.soles ? 1.3 : 1); }
function lnHop(h) {
    const adj = lnAdj(h.room); if (!adj.length) return;
    let next;
    const toward = lnRoomPath(h.room, HS.map);
    if (toward && toward.length && Math.random() < 0.72) next = toward[0]; else next = adj[Math.floor(Math.random() * adj.length)];
    h.prev = h.room; h.room = next; h.eta = lnEta();
    if (next === HS.map) {
        const m = HOUSE_MAPS[next], p = m.objs.find(o => o.t === 'portal' && o.to === h.prev);
        if (p) { h.x = p.x * TILE + p.w * TILE / 2; h.y = p.y * TILE + 14; if (p.y >= m.h - 2) h.y = (p.y - 0) * TILE + 6; if (p.x >= m.w - 1) h.x = p.x * TILE - 6; if (p.x === 0) h.x = 10; }
        if (Math.hypot(h.x - HS.x, h.y - HS.y) < 50) lnPlaceFar(h);
        h.seen = 0; h.path = null; SFX.thump(); hsToast('SOMETHING ENTERS');
        lnSyncObjs();
    } else if (lnDist(next, HS.map) === 1) { SFX.thump(); hsToast('STEPS. NEXT DOOR.'); }
}
function lnPathStep(h) {   // next tile centre toward the player, or null
    const g = LN.grid; if (!g) return null;
    const sx = Math.max(0, Math.min(hsMW - 1, Math.floor(h.x / TILE))), sy = Math.max(0, Math.min(hsMH - 1, Math.floor((h.y - 4) / TILE)));
    const tx = Math.floor(HS.x / TILE), ty = Math.floor((HS.y - 4) / TILE);
    if (sx === tx && sy === ty) return null;
    const key = (x, y) => y * 64 + x, prev = {}; prev[key(sx, sy)] = -1;
    const q = [[sx, sy]]; let hit = null;
    while (q.length) {
        const [cx, cy] = q.shift();
        if (Math.abs(cx - tx) + Math.abs(cy - ty) <= 1 && !(cx === sx && cy === sy) || (cx === tx && cy === ty)) { hit = [cx, cy]; break; }
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const nx = cx + dx, ny = cy + dy; if (ny < 0 || nx < 0 || ny >= hsMH || nx >= hsMW || g[ny][nx] !== 0 || key(nx, ny) in prev) return; prev[key(nx, ny)] = key(cx, cy); q.push([nx, ny]); });
    }
    if (!hit) return null;
    let k = key(hit[0], hit[1]), last = k; while (prev[k] !== -1 && prev[k] !== undefined) { last = k; k = prev[k]; }
    if (k === key(hit[0], hit[1])) return null;
    return [(last % 64) * TILE + 8, Math.floor(last / 64) * TILE + 14];
}
function lnChase(h, dt) {
    const dist = Math.hypot(HS.x - h.x, HS.y - h.y);
    if (LN.lit > 0 && dist < 62) {
        h.fleeT += dt;
        const dx = (h.x - HS.x) / (dist || 1), dy = (h.y - HS.y) / (dist || 1), sp = 38 * dt;
        const nx = h.x + dx * sp, ny = h.y + dy * sp, gx = Math.floor(nx / TILE), gy = Math.floor((ny - 4) / TILE);
        if (LN.grid[gy] && LN.grid[gy][gx] === 0) { h.x = nx; h.y = ny; }
        if (h.fleeT > 1.3) lnRepel(h, 12);
        return;
    }
    h.fleeT = Math.max(0, h.fleeT - dt);
    h.pathT = (h.pathT || 0) - dt; h.step += dt;
    if (h.pathT <= 0 || !h.path) { h.pathT = 0.3; h.path = lnPathStep(h) || [HS.x, HS.y]; }
    const sp = (30 + (LN.t > 150 ? 5 : 0) + (sanity <= 30 ? 4 : 0)) * dt, tx = h.path[0], ty = h.path[1], d = Math.hypot(tx - h.x, ty - h.y);
    if (d > 1) { h.x += (tx - h.x) / d * Math.min(sp, d); h.y += (ty - h.y) / d * Math.min(sp, d); }
    if (dist < 11 && !LN.duel) lnCatch(h);
}
function lnRepel(h, stun) {
    h.stun = stun || 10; h.fleeT = 0; h.path = null; LN.repelled++;
    const far = LN_ROOMS.filter(r => r !== HS.map && lnAdj(r).length).sort((a, b) => lnDist(b, HS.map) - lnDist(a, HS.map))[0] || 'ARCADE';
    h.prev = h.room; h.room = far; h.eta = (stun || 10) + 6 + Math.random() * 4;
    hsToast('IT RETREATS'); SFX.bell(); lnSyncObjs();
}
function lnLight() {
    if (!HS.on || HS.menu || HS.dlg) return;
    if (LN.lit > 0) { hsToast('THE LAMP IS ALREADY LIT'); return; }
    if (LN.candles < 1) { SFX.empty(); hsToast('NO CANDLES LEFT'); return; }
    LN.candles--; LN.lit = 18 + (lnData().up.lantern ? 8 : 0); SFX.bell(); hsToast('LIT: HOLD YOUR GROUND');
    LN.hunters.forEach(h => { h.eta += 3; });
    try { unlockAchievement('FIRST_LIGHT'); } catch (e) {}
    lnHudDraw();
}
const _lnLight = hsLight;
hsLight = function() { if (LN.on) return lnLight(); return _lnLight(); };

function lnTick(dt) {
    if (LN.over || HS.menu || HS.dlg || (typeof CINE !== 'undefined' && CINE.on)) return;
    LN.t += dt; if (LN.lit > 0) LN.lit = Math.max(0, LN.lit - dt);
    HS.seal = 0; if (HS.black > 0) HS.black = Math.max(0, HS.black - dt); if (HS.blink > 0) HS.blink = Math.max(0, HS.blink - dt);
    let nearest = 99;
    LN.hunters.forEach(h => {
        if (h.stun > 0) { h.stun -= dt; if (h.stun <= 0) { h.eta = Math.min(h.eta, 5 + Math.random() * 4); } return; }
        if (h.room !== HS.map) { h.eta -= dt; if (h.eta <= 0) lnHop(h); return; }
        h.seen += dt; nearest = Math.min(nearest, Math.hypot(HS.x - h.x, HS.y - h.y));
        if (h.seen < 1.4) return;
        lnChase(h, dt);
    });
    // heartbeat gets faster as something closes in
    if (nearest < 120) { LN.hb -= dt; if (LN.hb <= 0) { LN.hb = Math.max(0.45, nearest / 120 * 1.3); SFX.heartbeat(); } }
    lnSyncObjs();
    // the dark wears on you
    LN.drainT -= dt; if (LN.drainT <= 0) { LN.drainT = lnData().up.plugs ? 24 : 12; if (!(LN.lit > 0)) hsSan(-1); if (sanity <= 3) { lnTaken('mind'); return; } }
    // small wrongnesses
    LN.evT -= dt; if (LN.evT <= 0) {
        LN.evT = 14 + Math.random() * 18; const r = Math.random();
        if (r < 0.4) { hsToast(LN_WHISPERS[Math.floor(Math.random() * LN_WHISPERS.length)]); SFX.whisper(); }
        else if (r < 0.65) { HS.black = 0.3; SFX.glitch(); }
        else if (r < 0.85 && HS.map !== 'STUDY') { LN.fake = { x: HS.x + (Math.random() < 0.5 ? -1 : 1) * (60 + Math.random() * 40), y: HS.y - 6 + Math.random() * 20, t: 1.2 }; SFX.thump(); }
        else { [0, 260, 520].forEach(ms => setTimeout(() => { try { tone(70, 'sine', 0.14, 0.55, { slideTo: 50 }); } catch (e) {} }, ms)); hsToast('KNOCK. KNOCK. KNOCK.'); }
    }
    if (LN.fake) { LN.fake.t -= dt; if (LN.fake.t <= 0) LN.fake = null; }
    LN.hudT -= dt; if (LN.hudT <= 0) { LN.hudT = 0.25; lnHudDraw(); }
    if (LN.t >= LN.dur) lnDawn();
}

// ---------- loot and the bell ----------
const _lnAct = hsAct;
hsAct = function(o) {
    if (o.act === 'ln') { SFX.click(); return lnMenu(); }
    if (LN.on) {
        if (o.t === 'npc') { hsToast('THEY DO NOT LOOK UP.'); SFX.empty(); return; }
        if (o.act === 'lnloot') {
            const it = LN.loot[o.room] && LN.loot[o.room][o.li]; if (!it || it.got) return; it.got = 1; hsObjs = hsObjs.filter(x => x !== o); SFX.chip();
            if (it.k === 'candle') { LN.candles++; hsToast('+1 CANDLE'); }
            else if (it.k === 'tonic') { hsSan(8); hsToast('+8 SANITY'); }
            else if (it.k === 'coin') { const n = 40 + Math.floor(Math.random() * 50); globalMoney += n; totalStats.moneyEarned += n; hsToast('+$' + n); }
            else { const m = fragMissing(); if (m.length) { fragGive(m[Math.floor(Math.random() * m.length)]); hsToast('A LORE PAGE. IT CAN WAIT FOR DAWN.'); SFX.win(); } }
            lnHudDraw(); return;
        }
        if (['pc', 'table', 'market', 'archive', 'radio', 'bj', 'slots', 'cups', 'hilo', 'bench', 'board', 'vend', 'chest', 'mbox', 'safe', 'frames', 'ledger', 'fortune', 'piano', 'phone', 'mirror', 'clock', 'juke', 'claw', 'photo'].includes(o.act)) {
            hsToast(o.act === 'pc' ? 'THE SCREEN IS BLACK. IT SHOWS YOUR FACE, AND ONE BEHIND IT.' : 'NOT TONIGHT. KEEP MOVING.'); SFX.empty(); return;
        }
    }
    return _lnAct(o);
};
const _lnLeave = hsLeaveTo, _lnTab = hsMenuTab;
hsLeaveTo = function(fn) { if (LN.on) { hsToast('NOT TONIGHT'); return; } return _lnLeave(fn); };
hsMenuTab = function(t) { if (LN.on) { hsToast('NOT TONIGHT'); return; } return _lnTab(t); };
const _lnCloseBtn = closeHouseBtn;
closeHouseBtn = function() { if (LN.on) { lnGiveUpMenu(); return; } return _lnCloseBtn(); };
// the bell goes in the Study
HOUSE_MAPS.STUDY.objs.push({ t: 'nbell', x: 1, y: 4, w: 1, h: 1, solid: 1, act: 'ln', label: 'THE BELL' });

function lnMenu() {
    const l = lnData(), up = l.up, names = lnPickHunters().map(k => HOUSE_FOLK[k].name.replace('THE ', ''));
    const scr = hsData().scraps.CANDLE || 0;
    hsMenu('THE BELL', () => ({
        intro: 'Ring it and the House hunts you until dawn (5 minutes). Your beaten dealers walk the rooms. Light a candle to push them back. Find candles, tonics and pages in the dark. If one catches you, it is a short shell duel. Survive until dawn.',
        rows: [
            { text: 'TONIGHT', sub: lnReady() ? 'The bell is ready.' + (l.pass ? ' Extra nights: ' + l.pass : '') : 'You have already had your night. Come back tomorrow, or buy a SECOND NIGHT.' },
            { text: 'WHO WILL COME', sub: up.map ? names.join(', ') : names.length + ' of them. You will hear which.' },
            { text: 'YOUR CANDLES', sub: (3 + Math.min(3, scr) + (up.candle2 ? 2 : 0)) + ' to start (3 given, up to 3 stubs from your pockets' + (up.candle2 ? ', +2 LAST CANDLE' : '') + ')' },
            { text: 'NIGHT GEAR', sub: [up.lantern && 'LANTERN', up.soles && 'FELT SOLES', up.map && 'HUNTER\'S MAP', up.deed && 'TENANT\'S DEED', l.salt && ('SALT x' + l.salt), l.rites && ('LAST RITES x' + l.rites)].filter(Boolean).join(', ') || 'none. The shop sells some.' },
            { text: 'BEST NIGHT', sub: l.nights ? l.nights + ' survived' : 'none yet', btn: 'RING THE BELL', off: !lnReady(), fn: () => { hsMenuClose(); lnBegin(); } }]
    }));
}
function lnGiveUpMenu() {
    hsMenu('GIVE UP THE NIGHT?', () => ({ intro: 'Leaving ends the night with nothing. You can try again today.',
        rows: [{ text: 'KEEP GOING', btn: 'STAY', fn: () => hsMenuClose() }, { text: 'WAKE UP', sub: 'No penalty, no reward.', btn: 'LEAVE', fn: () => { hsMenuClose(); lnEnd(); lnData().day = LN.prevDay; if (LN.startedWithPass) lnData().pass++; hsLoad('STUDY', 7, 5); hsToast('YOU WAKE IN THE STUDY'); } }] }));
}
function lnEnd() {
    LN.on = false; LN.over = true; LN.duel = null; lnHud(false); hsObjs = hsObjs.filter(o => o.t !== 'hunter' && o.t !== 'lnloot');
    const d = hsData(); d.scraps.CANDLE = (d.scraps.CANDLE || 0) + Math.min(LN.took, LN.candles); delete lnData().act; saveGame();
    const mn = document.getElementById('house-menu'); if (mn) mn.classList.remove('noclose');
}

// ---------- dawn and the dark ----------
function lnDawn() {
    if (LN.over) return;
    const l = lnData(), clean = LN.caught === 0, n = LN.hunters.length, left = LN.candles;
    const cash = 400 + 120 * LN.repelled + 25 * left + (clean ? 150 : 0), marks = 1 + (clean ? 1 : 0) + (n >= 3 ? 1 : 0);
    lnEnd(); l.nights++; l.day = hsDay();
    globalMoney += cash; totalStats.moneyEarned += cash; addMarks(marks);
    hsAddFx({ sanity: 10, reward: 1.1 });
    try { unlockAchievement('DAWN_BREAKS'); if (clean) unlockAchievement('UNSEEN'); if (LN.caught >= 3) unlockAchievement('CAUGHT_3'); } catch (e) {}
    saveGame(); hsCash();
    const go = () => {
        hsLoad('STUDY', 7, 5); HS.flash = 1; SFX.win();
        try { Music.setScene('house_study'); } catch (e) {}
        hsSay('DAWN', ['The light comes in sideways. They are all back in their chairs, perfectly still, pretending.', '+$' + cash + ', +' + marks + ' MARK' + (marks > 1 ? 'S' : '') + (clean ? '. Not once caught.' : '. Caught ' + LN.caught + 'x, repelled ' + LN.repelled + 'x.'), 'The house will owe you one for a while. (+10 Sanity and +10% pay on your next run.)'], '#fbbf24', () => { fragGive(67); });
    };
    cinePlay('ln_dawn', go, { restore: 'house_study' });
}
function lnTaken(why) {
    if (LN.over) return;
    const loss = Math.min(400, Math.floor(globalMoney * 0.15)), l = lnData();
    lnEnd(); l.day = hsDay(); globalMoney -= loss; hsSan(-8); fragGive(61); saveGame(); hsCash();
    hsMenuClose();
    const go = () => {
        hsLoad('STUDY', 7, 5); HS.black = 0.6;
        try { Music.setScene('house_study'); } catch (e) {}
        hsSay('THE NIGHT TAKES YOU', [why === 'mind' ? 'You stop knowing which of the footsteps are yours.' : 'It does not hurt. It is only a lot of someone else.', 'You wake in the Study. It is still dark. ' + (loss ? 'Your pockets are $' + loss + ' lighter.' : '') + ' Sanity -8.', 'There is a dent in the chair beside you. It is warm.'], '#ef4444');
    };
    cinePlay('ln_taken', go, { restore: 'house_study' });
}

// ---------- the catch: a short shell duel ----------
function lnDuelNew(k, t) {
    const bias = { SADISTIC: 1, ANCIENT: 1, FIRST: 1 }[k] || 0;
    const S = { k, me: 2, him: 2, chamber: [], live: 0, blank: 0, turn: 'me', last: null, cuffed: false, wardenDone: false, msg: '', over: null };
    lnDuelLoad(S, bias + (t > 200 ? 1 : 0));
    return S;
}
function lnDuelLoad(S, extra) {
    const live = Math.max(2, Math.min(4, 2 + (extra || 0))), n = 6, a = [];
    for (let i = 0; i < n; i++) a.push(i < live ? 1 : 0);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    S.chamber = a; S.live = live; S.blank = n - live; S.bias = extra || 0;
}
function lnDuelShoot(S, who, target) {     // who: 'me'|'him'. target: 'other'|'self'. returns a text
    if (!S.chamber.length) lnDuelLoad(S, S.bias);
    const shell = S.chamber.shift(); if (shell) S.live--; else S.blank--;
    const foe = who === 'me' ? 'him' : 'me', victim = target === 'self' ? who : foe;
    let txt = (who === 'me' ? 'YOU' : 'IT') + ' ' + (target === 'self' ? 'FIRE AT ' + (who === 'me' ? 'YOURSELF' : 'ITSELF') : 'FIRE AT ' + (who === 'me' ? 'IT' : 'YOU')) + ': ';
    if (shell) { S[victim]--; txt += 'LIVE.'; S.turn = foe; } else { txt += 'BLANK.'; S.turn = (target === 'self') ? who : foe; }
    if (who === 'me') S.last = target;
    if (S.me <= 0) S.over = 'lost'; else if (S.him <= 0) S.over = 'won';
    else if (S.chamber.length === 0) { lnDuelLoad(S, S.bias); txt += ' RELOAD: ' + S.live + ' live, ' + S.blank + ' blank.'; }
    return txt;
}
function lnDuelAI(S) {      // what the hunter does: 'other' (shoot you) or 'self'
    const L = S.live, T = S.live + S.blank, r = T ? L / T : 0;
    switch (S.k) {
        case 'SADISTIC': return 'other';
        case 'CALCULATING': return L === 0 ? 'self' : (r >= 0.34 ? 'other' : 'self');
        case 'UNPREDICTABLE': return Math.random() < 0.5 ? 'other' : 'self';
        case 'MIMIC': return S.last === 'self' ? 'self' : 'other';
        case 'ANCIENT': return r > 0.4 ? 'other' : 'self';
        default: return L === 0 ? 'self' : (r >= 0.5 ? 'other' : 'self');
    }
}
function lnCatch(h) {
    LN.caught++; HS.flash = 0.9; SFX.thump(); h.step = 0;
    const l = lnData();
    if (l.salt > 0) { l.salt--; saveGame(); lnRepel(h, 14); hsToast('THE SALT HOLDS. IT SLIPS BACK.'); return; }
    lnDuel(h);
}
function lnDuel(h) {
    LN.duel = h; const S = lnDuelNew(h.k, LN.t), f = HOUSE_FOLK[h.k];
    const node = pzNode(), hp = document.createElement('div'), msg = document.createElement('div'), ch = document.createElement('div'), btns = document.createElement('div');
    hp.className = 'ln-hp'; msg.className = 'pz-msg'; ch.className = 'pz-msg'; btns.className = 'ln-btns';
    node.appendChild(hp); node.appendChild(ch); node.appendChild(msg); node.appendChild(btns);
    S.msg = f.name + ' is on you. ' + (h.k === 'WARDEN' ? 'It reaches for the cuffs.' : 'It does not speak.');
    let busy = false, looked = null;
    const paint = () => {
        hp.innerHTML = 'YOU <b>' + '♥'.repeat(Math.max(0, S.me)) + '♡'.repeat(Math.max(0, 2 - S.me)) + '</b> &nbsp; vs &nbsp; ' + f.name.replace('THE ', '') + ' <b class="foe">' + '♥'.repeat(Math.max(0, S.him)) + '♡'.repeat(Math.max(0, 2 - S.him)) + '</b>';
        ch.textContent = 'CHAMBER: ' + S.live + ' LIVE, ' + S.blank + ' BLANK' + (looked !== null ? '. NEXT: ' + (looked ? 'LIVE' : 'BLANK') : '');
        msg.textContent = S.msg;
        btns.innerHTML = '';
        if (S.over) {
            btns.appendChild(pzBtn('CONTINUE', finish, 'go')); return;
        }
        const on = S.turn === 'me' && !busy;
        [['SHOOT IT', () => act('other')], ['SHOOT YOURSELF', () => act('self')], ['LOOK (candle)', look]].forEach(([t, fn], i) => { const b = pzBtn(t, fn); b.disabled = !on || (i === 2 && (LN.candles < 1 || looked !== null)); btns.appendChild(b); });
    };
    const look = () => { if (LN.candles < 1 || looked !== null) return; LN.candles--; looked = S.chamber[0] ? 1 : 0; S.msg = 'The candle shows you the next shell.'; SFX.bell(); paint(); };
    const act = target => {
        if (S.turn !== 'me' || S.over || busy) return;
        const wasSelfBlank = target === 'self'; looked = null;
        S.msg = lnDuelShoot(S, 'me', target); SFX[S.msg.indexOf('LIVE') > -1 ? 'thump' : 'empty'](); paint();
        if (!S.over && S.turn === 'him') hunterTurn();
        else if (!S.over && wasSelfBlank) { S.msg += ' AGAIN.'; paint(); }
    };
    const hunterTurn = () => {
        busy = true; paint();
        setTimeout(() => {
            if (!HS.menu || HS.menu.title !== 'THE CATCH' || S.over) return;
            if (S.k === 'WARDEN' && !S.wardenDone) { S.wardenDone = true; S.msg = 'CUFFED. IT TAKES ANOTHER TURN.'; S.turn = 'him'; paint(); return setTimeout(hunterTurn, 900); }
            const t = lnDuelAI(S); S.msg = lnDuelShoot(S, 'him', t); SFX[S.msg.indexOf('LIVE') > -1 ? 'thump' : 'empty']();
            if (!S.over && S.turn === 'him') { paint(); return setTimeout(hunterTurn, 900); }
            busy = false; looked = null; paint();
        }, 800);
    };
    const finish = () => {
        const el = document.getElementById('house-menu'); if (el) el.classList.remove('noclose');
        LN.duel = null; hsMenuClose();
        if (S.over === 'won') { lnRepel(h, 40); if (Math.random() < 0.5) { LN.candles++; hsToast('IT DROPPED A CANDLE STUB'); } hsSan(2); }
        else {
            const l = lnData();
            if (l.rites > 0) { l.rites--; saveGame(); lnRepel(h, 14); hsToast('THE LAST RITES HOLD. YOU RISE.'); SFX.heal && SFX.heal(); }
            else lnTaken('duel');
        }
    };
    hsMenu('THE CATCH', () => ({ intro: 'It found you. Six shells. First to lose both hearts loses. Shooting yourself with a blank gives you another turn.', node }));
    const el = document.getElementById('house-menu'); if (el) el.classList.add('noclose');
    paint();
}
const _lnMenuClose = hsMenuClose;
hsMenuClose = function() { if (LN.duel && HS.menu && HS.menu.title === 'THE CATCH') return; return _lnMenuClose(); };

// a night that was cut off (tab killed, phone locked, power) is handed back, not eaten
function lnRecover() {
    const l = lnData(); if (!l.act) return false;
    const a = l.act; delete l.act;
    l.day = a.prevDay || 0; l.pass += a.pass || 0; hsData().scraps.CANDLE = (hsData().scraps.CANDLE || 0) + (a.took || 0);
    l.cut = (l.cut || 0) + 1;
    return true;
}
if (typeof SAVE !== 'undefined') SAVE.onLoad.push(() => { if (lnRecover()) SAVE.notes.push('THE NIGHT WAS CUT SHORT. YOUR NIGHT WAS HANDED BACK.'); });
