"use strict";

// =====================================================================
// HOUSE PUZZLES (Md8): a safe with a combination you have to find, a
// music box, a lock to pick, and a wall of portraits to put in order.
// Each pays Marks and a lore fragment (which plays its film).
// =====================================================================
function pzData() {
    const d = hsData(); d.puz = d.puz || {};
    const p = d.puz; p.clue = p.clue || {}; p.done = p.done || {};
    if (!p.code) p.code = [1 + Math.floor(Math.random() * 9), Math.floor(Math.random() * 10), 1 + Math.floor(Math.random() * 9)];
    return p;
}
function pzNode(html) { const n = document.createElement('div'); n.className = 'pz'; if (html) n.innerHTML = html; return n; }
function pzBtn(label, fn, cls) { const b = document.createElement('button'); b.className = 'pz-b ' + (cls || ''); b.textContent = label; b.onclick = fn; return b; }
function pzWin(id, o) {
    const p = pzData(); p.done[id] = 1;
    if (o.marks) addMarks(o.marks);
    if (o.cash) { globalMoney += o.cash; totalStats.moneyEarned += o.cash; try { hsCash(); updateMoneyDisplay(true); } catch (e) {} }
    if (o.ach) { try { unlockAchievement(o.ach); } catch (e) {} }
    if (o.lore) fragGive(o.lore);
    saveGame(); SFX.win(); HS.flash = 0.5;
}

// ---------- where they live ----------
const PZ_OBJS = {
    STUDY: [{ t: 'mbox', x: 13, y: 4, w: 1, h: 1, solid: 1, act: 'mbox', label: 'A MUSIC BOX' }],
    LIBRARY: [{ t: 'safe', x: 16, y: 9, w: 1, h: 1, solid: 1, act: 'safe', label: 'A SAFE' }],
    CORRIDOR: [{ t: 'clue', x: 2, y: 8, w: 1, h: 1, act: 'clue', ci: 0, label: 'SCRATCHES' }, { t: 'frames', x: 23, y: 0, w: 4, h: 2, solid: 1, act: 'frames', label: 'THE PORTRAITS' }],
    ARCADE: [{ t: 'clue', x: 13, y: 9, w: 1, h: 1, act: 'clue', ci: 1, label: 'MARKER' }],
    CELLAR: [{ t: 'clue', x: 9, y: 8, w: 1, h: 1, act: 'clue', ci: 2, label: 'A CUT' }]
};
Object.keys(PZ_OBJS).forEach(k => PZ_OBJS[k].forEach(o => HOUSE_MAPS[k].objs.push(o)));

// ---------- drawing ----------
const _pzDraw = hsDrawObj;
hsDrawObj = function(g, o, t) {
    const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = o.h * TILE, p = pzData();
    switch (o.t) {
        case 'mbox': hsRect(g, x + 2, y + 8, 12, 7, '#7c5a3a'); hsRect(g, x + 2, y + 6, 12, 3, '#a16207'); hsRect(g, x + 7, y + 4, 2, 3, '#fbbf24');
            hsRect(g, x + 14, y + 9 + Math.floor(Math.sin(t * 6) * 1.5), 2, 2, '#fbbf24'); if (p.done.box) hsRect(g, x + 4, y + 10, 8, 1, '#fde68a'); return;
        case 'safe': hsRect(g, x + 1, y + 1, 14, 14, '#374151'); hsRect(g, x + 3, y + 3, 10, 10, '#1f2937'); hsRect(g, x + 6, y + 6, 4, 4, '#9ca3af'); hsRect(g, x + 7, y + 7, 2, 2, '#111827');
            hsRect(g, x + 11, y + 7, 1, 3, '#fbbf24'); if (p.done.safe) hsRect(g, x + 1, y + 1, 4, 14, '#0b0f14'); return;
        case 'clue': { const f = p.clue['c' + o.ci];
            hsRect(g, x + 4, y + 8, 1, 4, f ? '#4ade80' : 'rgba(226,232,240,.4)'); hsRect(g, x + 7, y + 7, 1, 5, f ? '#4ade80' : 'rgba(226,232,240,.4)'); hsRect(g, x + 10, y + 8, 1, 4, f ? '#4ade80' : 'rgba(226,232,240,.4)');
            if (!f && Math.sin(t * 3 + o.x) > 0.7) hsRect(g, x + 7, y + 4, 2, 2, '#ffffff'); return; }
        case 'frames': { hsRect(g, x, y + 2, w, h - 4, '#2b1d12');
            for (let i = 0; i < 5; i++) { const fx = x + 2 + i * 12; hsRect(g, fx, y + 4, 10, 18, '#a16207'); hsRect(g, fx + 1, y + 5, 8, 16, i === 4 ? '#9ca3af' : '#0b0f14'); if (i < 4) { hsRect(g, fx + 3, y + 8, 4, 4, '#475569'); hsRect(g, fx + 2, y + 13, 6, 6, '#475569'); } else hsRect(g, fx + 1, y + 5, 8, 4, '#cbd5e1'); }
            return; }
    }
    return _pzDraw(g, o, t);
};

// ---------- the acts ----------
const _pzAct = hsAct;
hsAct = function(o) {
    const d = hsData(), p = pzData();
    if (o.act === 'chest' && !d.seen.chest) { SFX.click(); return pzLock(); }
    if (o.act === 'mbox') { SFX.click(); return pzBox(); }
    if (o.act === 'safe') { SFX.click(); return pzSafe(); }
    if (o.act === 'frames') { SFX.click(); return pzFrames(); }
    if (o.act === 'clue') {
        SFX.click(); const i = o.ci, id = 'c' + i;
        const T = ['Something is scratched into the skirting, low down, where a child would reach. A number: ', 'Written on the back of a cabinet in marker, underlined twice: ', 'Cut into the leg of the desk with something small and patient: '];
        if (!p.clue[id]) { p.clue[id] = 1; saveGame(); SFX.bell(); }
        hsSay('A NUMBER', [T[i] + p.code[i] + '.', Object.keys(p.clue).length >= 3 ? 'Three numbers. There is a safe somewhere in this house that has been waiting for them.' : 'You write it on your palm. The ink does not smudge.'], '#94a3b8');
        return;
    }
    return _pzAct(o);
};

// ---------- the safe ----------
function pzSafe() {
    const p = pzData(), found = [0, 1, 2].filter(i => p.clue['c' + i]).length;
    if (p.done.safe) { hsSay('THE SAFE', ['Open. Empty. The card inside has not moved:', '"Well done. Now put it back."'], '#94a3b8'); return; }
    const dial = [0, 0, 0];
    const node = pzNode(), row = document.createElement('div'); row.className = 'pz-row'; node.appendChild(row);
    const cells = dial.map((v, i) => {
        const c = document.createElement('div'); c.className = 'pz-dial';
        const up = pzBtn('▲', () => { dial[i] = (dial[i] + 1) % 10; paint(); }), dn = pzBtn('▼', () => { dial[i] = (dial[i] + 9) % 10; paint(); });
        const n = document.createElement('div'); n.className = 'pz-num'; c.appendChild(up); c.appendChild(n); c.appendChild(dn); row.appendChild(c); return n;
    });
    const msg = document.createElement('div'); msg.className = 'pz-msg'; node.appendChild(msg);
    function paint() { cells.forEach((n, i) => n.textContent = dial[i]); }
    paint();
    const open = pzBtn('TURN THE HANDLE', () => {
        if (dial.every((v, i) => v === p.code[i])) {
            pzWin('safe', { marks: 2, cash: 250, lore: 68, ach: 'SAFE_CRACKED' }); hsMenuClose();
            hsSay('THE SAFE', ['It opens without a sound. It was never locked, only shy.', 'Inside: $250 and a card. "Well done. Now put it back."', '+2 MARKS'], '#fbbf24');
        } else { SFX.empty(); hsSan(-1); msg.textContent = upgrades.stethoscope ? 'Click. The stethoscope says: ' + dial.map((v, i) => v === p.code[i] ? 'RIGHT' : 'wrong').join(' / ') + '.' : 'Click. Click. The handle does not move.'; }
    }, 'go');
    node.appendChild(open);
    hsMenu('THE SAFE', () => ({ intro: found < 3 ? 'Three dials. You have found ' + found + ' of 3 numbers. They are written somewhere in this house, low down, where nobody looks.' : 'You have all three numbers. Order matters: Dealers\' Row, then the Arcade, then below.', node,
        foot: found ? 'Found: ' + [0, 1, 2].map(i => p.clue['c' + i] ? p.code[i] : '?').join(' ') : '' }));
}

// ---------- the music box ----------
function pzBox() {
    const p = pzData(), F = [262, 330, 392, 523], C = ['#ef4444', '#fbbf24', '#4ade80', '#38bdf8'];
    const S = { seq: [], pos: 0, busy: false, round: 0 }, GOAL = 6;
    const node = pzNode(), msg = document.createElement('div'); msg.className = 'pz-msg'; node.appendChild(msg);
    const pads = document.createElement('div'); pads.className = 'pz-pads'; node.appendChild(pads);
    const el = F.map((f, i) => { const b = document.createElement('button'); b.className = 'pz-pad'; b.style.background = C[i]; b.setAttribute('aria-label', 'Note ' + (i + 1)); b.onclick = () => press(i); pads.appendChild(b); return b; });
    const alive = () => HS.menu && HS.menu.title === 'THE MUSIC BOX';
    function flash(i, ms) { el[i].classList.add('on'); try { tone(F[i], 'triangle', ms / 1000, 0.12); } catch (e) {} setTimeout(() => el[i].classList.remove('on'), ms - 40); }
    function play() {
        S.busy = true; S.pos = 0; msg.textContent = 'LISTEN...';
        S.seq.forEach((n, k) => setTimeout(() => { if (alive()) flash(n, 380); if (k === S.seq.length - 1) setTimeout(() => { S.busy = false; if (alive()) msg.textContent = 'NOW YOU.'; }, 420); }, 500 + k * 560));
    }
    function next() { S.seq.push(Math.floor(Math.random() * 4)); S.round = S.seq.length; play(); }
    function press(i) {
        if (S.busy || !S.seq.length) return; flash(i, 220);
        if (i !== S.seq[S.pos]) { SFX.empty(); hsSan(-1); msg.textContent = ['The tune slips.', 'Wrong. The box keeps playing, a little slower.', 'It was not that one. You are certain it was not that one.'][Math.floor(Math.random() * 3)]; S.seq = []; S.busy = false; return; }
        S.pos++;
        if (S.pos >= S.seq.length) {
            if (S.seq.length >= GOAL) { win(); return; }
            S.busy = true; msg.textContent = 'YES.'; setTimeout(() => { if (alive()) next(); }, 700);
        }
    }
    function win() {
        const first = !p.done.box;
        if (first) { pzWin('box', { marks: 1, lore: 69, ach: 'MUSIC_BOX' }); hsMenuClose(); hsSay('THE MUSIC BOX', ['The tune finishes on a note that was not in the sequence.', 'It sounds like a door, closing softly, behind you.', '+1 MARK'], '#fbbf24'); }
        else if (p.boxDay !== hsDay()) { p.boxDay = hsDay(); pzWin('box', { cash: 60 }); hsMenuClose(); hsSay('THE MUSIC BOX', ['It plays you out. Something small rolls from the mechanism.', '+$60'], '#fbbf24'); }
        else { hsMenuClose(); hsSay('THE MUSIC BOX', ['The tune is the same as always. Slower, maybe.'], '#94a3b8'); }
    }
    const go = pzBtn('LISTEN', () => { if (S.busy) return; if (!S.seq.length) next(); else play(); }, 'go'); node.appendChild(go);
    msg.textContent = p.done.box ? 'It remembers you. Play it again for loose change.' : 'Repeat the tune. Six notes. It plays slower each time you lose it.';
    hsMenu('THE MUSIC BOX', () => ({ intro: 'Watch the pads light. Press them in the same order.', node }));
}

// ---------- the lock ----------
function pzLock() {
    const S = { pins: 0, x: 0, dir: 1, speed: 1.6 }, ZONE = 20 + (upgrades.steadyHands ? 6 : 0) + (upgrades.lockpicks ? 8 : 0);
    const node = pzNode(), msg = document.createElement('div'); msg.className = 'pz-msg'; node.appendChild(msg);
    const bar = document.createElement('div'); bar.className = 'pz-bar'; const zone = document.createElement('div'); zone.className = 'pz-zone'; const mk = document.createElement('div'); mk.className = 'pz-mark'; bar.appendChild(zone); bar.appendChild(mk); node.appendChild(bar);
    const pins = document.createElement('div'); pins.className = 'pz-pins'; node.appendChild(pins);
    let zx = 40, timer = 0;
    function newZone() { zx = 12 + Math.floor(Math.random() * (88 - ZONE)); zone.style.left = zx + '%'; zone.style.width = ZONE + '%'; }
    function paint() { pins.textContent = '●'.repeat(S.pins) + '○'.repeat(3 - S.pins); mk.style.left = S.x + '%'; }
    function alive() { return HS.menu && HS.menu.title === 'THE LOCK'; }
    timer = setInterval(() => { if (!alive()) { clearInterval(timer); return; } S.x += S.dir * S.speed; if (S.x >= 98) { S.x = 98; S.dir = -1; } if (S.x <= 0) { S.x = 0; S.dir = 1; } mk.style.left = S.x + '%'; }, 30);
    const stop = pzBtn('SET THE PIN', () => {
        if (S.x >= zx && S.x <= zx + ZONE) {
            S.pins++; S.speed += 0.7; try { tone(500 + S.pins * 160, 'square', 0.08, 0.12); } catch (e) {}
            if (S.pins >= 3) { clearInterval(timer); const d = hsData(); d.seen.chest = 1; pzWin('pick', { marks: 3, lore: 71, ach: 'LOCK_PICKED' }); hsMenuClose();
                hsSay('OLD CHEST', ['The last pin sets. The lid lifts on its own weight.', 'Under a rotten sleeve, three small tokens. They are warm.', '+3 MARKS'], '#fbbf24'); return; }
            msg.textContent = 'One more. It is listening.'; newZone();
        } else { SFX.empty(); S.pins = 0; S.speed = 1.6; hsSan(-1); msg.textContent = 'The tumblers fall. Something on the other side of the lid shifts to listen better.'; newZone(); }
        paint();
    }, 'go');
    node.appendChild(stop); newZone(); paint();
    hsMenu('THE LOCK', () => ({ intro: 'Three pins. Tap SET THE PIN when the marker is inside the pale zone. A miss resets them.', node }));
}

// ---------- the portraits ----------
const PZ_FOLK = ['SADISTIC', 'WARDEN', 'CALCULATING', 'MIMIC'];     // the answer, left to right
function pzSolved(order) { return order.every((k, i) => k === PZ_FOLK[i]); }
function pzFrames() {
    const p = pzData();
    if (p.done.frames) { hsSay('THE PORTRAITS', ['Four faces in order. The fifth frame is under its sheet.', 'It has not moved. You are fairly sure it has not.'], '#94a3b8'); return; }
    let order = ['MIMIC', 'SADISTIC', 'CALCULATING', 'WARDEN'], sel = -1;
    const node = pzNode(), msg = document.createElement('div'); msg.className = 'pz-msg'; const row = document.createElement('div'); row.className = 'pz-frames'; node.appendChild(row); node.appendChild(msg);
    function paint() {
        row.innerHTML = '';
        order.forEach((k, i) => { const f = HOUSE_FOLK[k], b = document.createElement('button'); b.className = 'pz-frame' + (sel === i ? ' sel' : ''); b.innerHTML = '<i style="background:' + f.coat + ';border-color:' + f.trim + '"></i><small>' + f.name.replace('THE ', '') + '</small>';
            b.onclick = () => { SFX.click(); if (sel < 0) sel = i; else { const t = order[sel]; order[sel] = order[i]; order[i] = t; sel = -1; } paint(); }; row.appendChild(b); });
    }
    paint();
    const chk = pzBtn('HANG THEM', () => {
        if (pzSolved(order)) { pzWin('frames', { marks: 3, lore: 70, ach: 'FIVE_FRAMES' }); hsMenuClose(); hsSay('THE PORTRAITS', ['The frames settle with a sound like held breath.', 'Behind the fifth, under the sheet, something moves into place.', '+3 MARKS'], '#fbbf24'); }
        else { SFX.empty(); hsSan(-2); msg.textContent = 'The frames hum. One of them has moved on its own.'; }
    }, 'go');
    node.appendChild(chk);
    hsMenu('THE PORTRAITS', () => ({ intro: 'Tap one portrait, then another, to swap them. Left to right:\n• The one who copies hangs at an end, where you look last.\n• The one who counts hangs right beside the one who copies.\n• The one who smiles hangs somewhere left of the one who locks.\n• The one who locks does not hang at either end.', node }));
}
