"use strict";

// =====================================================================
// PSYCHE (v10): the house pays attention to you.
// Name, clock, history and low sanity shape what it says and shows.
// All of it is cosmetic: nothing here changes odds or damages saves.
// =====================================================================
const PSY = { ghost: null, gx: 0, gy: 0, mx: 0, my: 0, abandoned: false, eyes: null };

function playerName() { return (settings.name || '').trim() || 'stranger'; }
function clockText() {
    const d = new Date();
    let h = d.getHours();
    const ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return h + ':' + String(d.getMinutes()).padStart(2, '0') + ' ' + ap;
}
function lateNight() { const h = new Date().getHours(); return h < 5; }

// ---------- 1. personal dealer lines ----------
function psychFill(t) {
    return t.replace(/\{name\}/g, playerName()).replace(/\{time\}/g, clockText())
        .replace(/\{runs\}/g, meta.runs || 0).replace(/\{deaths\}/g, deathCount || 0)
        .replace(/\{round\}/g, (meta.lastDeath && meta.lastDeath.round) || 1);
}

const PSY_LINES = {
    taunt: [
        '{name}.', 'You have sat here {runs} times, {name}.', 'It is {time}. You should be asleep.',
        'You blinked.', 'I like how you hold it.', 'Do you hear that? No. Of course not.',
        'Last time you went down in round {round}.', 'Count the shells again, {name}.'
    ],
    hit: ['That one was yours, {name}.', 'You flinched. Good.', 'Pain is just attention.'],
    win: ['Stay, {name}.', 'That was death number {deaths}.', 'Again?'],
    lose: ['You are better than last time, {name}.', 'I will remember that.', 'Nobody wins. Some people just leave.'],
    normal: ['Welcome back, {name}.', 'Sit.', 'It is {time}.']
};
const PSY_LINES_NIGHT = ['It is {time}, {name}. Why are you awake?', 'The rest of the world is asleep. Only we are here.'];
const PSY_LINES_LOW = ['Which one of us is {name}?', 'I am only the part of you that counts.', 'Look at me. No. Look.'];

// returns a line or null (null = use the normal dialogue)
function psychLine(kind) {
    const pool = PSY_LINES[kind];
    if (!pool) return null;
    const tier = typeof sanityTier === 'function' ? sanityTier() : { id: 'STEADY' };
    const low = ['FRACTURED', 'BROKEN'].includes(tier.id);
    const chance = low ? 0.45 : 0.14;
    if (Math.random() > chance) return null;
    let all = pool;
    if (lateNight() && kind === 'taunt') all = all.concat(PSY_LINES_NIGHT);
    if (low && kind === 'taunt') all = all.concat(PSY_LINES_LOW);
    return '"' + psychFill(all[Math.floor(Math.random() * all.length)]) + '"';
}

// ---------- 2. lobby whispers ----------
function whisperPool() {
    const w = [];
    const tier = typeof sanityTier === 'function' ? sanityTier().id : 'STEADY';
    if (PSY.abandoned) w.push('You left in the middle of a hand. I kept your seat warm.');
    if (meta.lastDeath) w.push('Last time you fell in round ' + meta.lastDeath.round + '. I remember.');
    if ((meta.winStreak || 0) >= 3) w.push('Three wins. Four. I am starting to pay attention.');
    if (lateNight()) w.push('It is ' + clockText() + '. The house prefers you at this hour.');
    if (settings.name) w.push('Welcome back, ' + settings.name + '.');
    if ((meta.runs || 0) > 0) w.push('Hand number ' + ((meta.runs || 0) + 1) + '. You keep counting. So do I.');
    if (tier === 'FRACTURED' || tier === 'BROKEN') {
        w.push('You are not alone in the lobby.', 'Who is standing behind you?', 'The menu looks the same. Does it?');
    } else if (tier === 'UNEASY') {
        w.push('Something is different. You cannot say what.');
    } else {
        w.push('Take your time. The table is not going anywhere.', 'Nothing here is real. You can still lose everything.');
    }
    return w;
}

let _whisperI = -1;
function rotateWhisper() {
    const el = document.getElementById('news-ticker');
    if (!el || activeGame !== 'MENU') return;
    const p = whisperPool();
    let i;
    do { i = Math.floor(Math.random() * p.length); } while (i === _whisperI && p.length > 1);
    _whisperI = i;
    el.style.opacity = 0;
    setTimeout(() => { el.textContent = p[i]; el.style.opacity = 1; }, 450);
}

// ---------- 3. lobby corruption at low sanity ----------
function lobbyCorrupt() {
    if (activeGame !== 'MENU' || settings.lowfx) return;
    const tier = typeof sanityTier === 'function' ? sanityTier().id : 'STEADY';
    const odds = { UNEASY: 0.12, FRACTURED: 0.35, BROKEN: 0.6 }[tier];
    if (!odds || Math.random() > odds) return;
    const t = document.getElementById('lobby-title');
    if (t) {
        const old = t.textContent, alt = ['REMEMBER', playerName().toUpperCase(), 'LISTEN', 'STAY'][Math.floor(Math.random() * 4)];
        t.textContent = alt; t.dataset.text = alt;
        setTimeout(() => { t.textContent = 'MALICEX'; t.dataset.text = 'MALICEX'; }, 520);
    }
    const tab = document.querySelector('#tabbtn-play span');
    if (tab && tier !== 'UNEASY') { tab.textContent = 'STAY'; setTimeout(() => tab.textContent = 'PLAY', 700); }
}

// ---------- 4. the name ----------
function askName() {
    if (settings.name || settings.nameAsked) return false;
    const scr = document.getElementById('name-screen');
    if (!scr) return false;
    scr.classList.remove('hidden');
    setTimeout(() => { const i = document.getElementById('name-input'); if (i) i.focus(); }, 300);
    return true;
}

function submitName(skip) {
    const i = document.getElementById('name-input');
    let n = skip ? '' : ((i && i.value) || '').replace(/[^\w \-\.]/g, '').trim().slice(0, 12);
    settings.nameAsked = true;
    if (n) { settings.name = n; unlockAchievement('NAMED'); DISTURBING_WORDS.push(n); }
    saveSettings();
    document.getElementById('name-screen').classList.add('hidden');
    SFX.click();
    rotateWhisper();
}

// ---------- 5. the eyes ----------
// A small face in the dealer corner. The eyes follow your pointer or finger.
function buildEyes() {
    const f = document.getElementById('dealer-face');
    if (!f || f.dataset.built) return;
    f.dataset.built = '1';
    f.innerHTML = '<div class="eye"><div class="pupil"></div></div><div class="eye"><div class="pupil"></div></div>';
    PSY.eyes = [...f.querySelectorAll('.pupil')];
}

function lookAt(x, y) {
    PSY.mx = x; PSY.my = y;
    PSY.eyes && PSY.eyes.forEach(p => {
        const r = p.parentElement.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
        const k = Math.min(1, d / 160) * 3;
        p.style.transform = `translate(${(dx / d * k).toFixed(1)}px, ${(dy / d * k).toFixed(1)}px)`;
    });
}

function blinkEyes() {
    const f = document.getElementById('dealer-face');
    if (!f) return;
    f.classList.add('blink');
    setTimeout(() => f.classList.remove('blink'), 140);
}

// ---------- 6. the ghost pointer ----------
// At low sanity a dim second pointer trails yours, a beat behind.
function ghostTick() {
    const g = PSY.ghost;
    if (!g) return;
    const tier = typeof sanityTier === 'function' ? sanityTier().id : 'STEADY';
    const on = settings.cursor && !settings.lowfx && ['FRACTURED', 'BROKEN'].includes(tier) && activeGame !== 'STARTUP';
    g.style.opacity = on ? (tier === 'BROKEN' ? 0.55 : 0.32) : 0;
    if (!on) return;
    PSY.gx += (PSY.mx - 70 - PSY.gx) * 0.06;
    PSY.gy += (PSY.my + 26 - PSY.gy) * 0.06;
    g.style.transform = `translate(${PSY.gx}px, ${PSY.gy}px)`;
}

// ---------- 7. CRT pointer ----------
function installCursor() {
    const a = pxRasterize(PX_SPRITES.cur_arrow, 3), h = pxRasterize(PX_SPRITES.cur_hand, 3);
    const st = document.createElement('style');
    st.id = 'crt-cursor';
    st.textContent =
        `html:not(.no-crt-cursor), html:not(.no-crt-cursor) body { cursor: url(${a}) 0 0, default; }\n` +
        `html:not(.no-crt-cursor) button, html:not(.no-crt-cursor) [onclick], html:not(.no-crt-cursor) a, ` +
        `html:not(.no-crt-cursor) input[type=range], html:not(.no-crt-cursor) label, html:not(.no-crt-cursor) .cursor-hand { cursor: url(${h}) 0 0, pointer; }\n` +
        `html:not(.no-crt-cursor) textarea, html:not(.no-crt-cursor) input[type=text] { cursor: text; }\n` +
        `.ghost-cursor { background-image: url(${a}); }`;
    document.head.appendChild(st);
    const g = document.createElement('div');
    g.className = 'ghost-cursor';
    g.setAttribute('aria-hidden', 'true');
    document.body.appendChild(g);
    PSY.ghost = g;
}

// ---------- boot ----------
function psycheInit() {
    installCursor();
    buildEyes();
    document.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') lookAt(e.clientX, e.clientY); }, { passive: true });
    document.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) lookAt(t.clientX, t.clientY); }, { passive: true });
    if (meta.inRun) {          // the tab was closed mid-run
        PSY.abandoned = true;
        meta.inRun = false;
        saveGame();
    }
    setInterval(rotateWhisper, 9000);
    setInterval(lobbyCorrupt, 5000);
    setInterval(() => { if (Math.random() < 0.5) blinkEyes(); }, 3200);
    setInterval(ghostTick, 33);
}
