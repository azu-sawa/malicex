"use strict";

// =====================================================================
// THE WARD (Md8): a psychological-horror mode with no shells at all.
// Six days and nights in a bright white ward. By day you SEE things, and
// the nurse reads you your chart. By night something happens, and she
// brings the pills. The chart starts lying on day three. Nothing tells you.
//
// Three hidden numbers decide the ending:
//   GRIP  (shown)   how much of you is left. At zero you break.
//   TRUST (hidden)  how much she likes you. Agree with the chart, take the pills.
//   TRUTH (hidden)  how much you hold on to what you actually saw.
// =====================================================================
const WARD = { on: false, n: 1, grip: 7, trust: 5, truth: 5, pills: 0, cheeked: 0, refused: 0, facts: [], ask: null, blur: false, used: [], phase: '', fails: 0, step: 0, prevScene: 'menu', locked: false };
const WARD_NIGHTS = 6;
const WARD_POP = [5, 5, 4, 3, 2, 0];
const WARD_COLORS = ['RED', 'GREEN', 'YELLOW', 'BLUE', 'WHITE'];

function wardData() { meta.ward = meta.ward || {}; const w = meta.ward; w.day = w.day || ''; w.clears = w.clears || 0; w.door = w.door || 0; w.disch = w.disch || 0; w.broken = w.broken || 0; w.pillFree = w.pillFree || 0; return w; }
const wr = a => a[Math.floor(Math.random() * a.length)];
const wClamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// ---------- what you see by day ----------
function wardFacts(n) {
    const pop = WARD_POP[n - 1], tv = 2 + Math.floor(Math.random() * 8), hh = 1 + Math.floor(Math.random() * 5), mm = wr(['10', '20', '40', '50']), badge = 10 + Math.floor(Math.random() * 80), col = wr(WARD_COLORS);
    const all = [
        { k: 'pop', val: String(pop), text: pop === 0 ? 'The dayroom is empty. Every chair is pulled out, a little.' : 'There ' + (pop === 1 ? 'is 1 patient' : 'are ' + pop + ' patients') + ' in the dayroom.', q: 'How many patients were in the dayroom?', pool: ['0', '1', '2', '3', '4', '5', '6'] },
        { k: 'tv', val: String(tv), text: 'The television is on channel ' + tv + '. It shows a white room.', q: 'What channel was the television on?', pool: ['2', '3', '4', '5', '6', '7', '8', '9'] },
        { k: 'clock', val: hh + ':' + mm, text: 'The wall clock says ' + hh + ':' + mm + '.', q: 'What time did the clock say?', pool: ['1:10', '2:20', '2:40', '3:10', '3:50', '4:20', '4:40', '5:50'] },
        { k: 'badge', val: String(badge), text: 'The nurse\'s badge reads ' + badge + '.', q: 'What number is on my badge?', pool: ['12', '27', '31', '46', '58', '63', '74', '89'] },
        { k: 'col', val: col, text: 'A ' + col.toLowerCase() + ' blanket is folded on the chair.', q: 'What colour was the blanket?', pool: WARD_COLORS.slice() }
    ];
    if (!all[3].pool.includes(String(badge))) all[3].pool.push(String(badge));
    if (!all[2].pool.includes(hh + ':' + mm)) all[2].pool.push(hh + ':' + mm);
    // the population is always shown, it is the one that matters
    const rest = all.slice(1).sort(() => Math.random() - 0.5).slice(0, 2);
    return [all[0]].concat(rest);
}
// the chart: honest for two days, then it stops being
function wardChart(f, n) {
    n = n - (meta.nurseKey ? 1 : 0);
    const lies = n <= 2 ? 0 : n === 3 ? 0.5 : n === 4 ? 0.75 : 1;
    let val = f.val, lied = false;
    if (f.k === 'pop' && n >= 3) { val = '5'; lied = val !== f.val; }                 // the chart never learns that they left
    else if (Math.random() < lies) { const other = f.pool.filter(x => x !== f.val); val = wr(other); lied = true; }
    return { val, lied };
}
function wardOptions(f, chart) {
    const set = [chart.val]; if (!set.includes(f.val)) set.push(f.val);
    const pool = f.pool.filter(x => !set.includes(x)).sort(() => Math.random() - 0.5);
    while (set.length < 3 && pool.length) set.push(pool.pop());
    return set.sort(() => Math.random() - 0.5);
}

// ---------- the screen ----------
function wardEl() {
    let e = document.getElementById('ward-screen');
    if (!e) {
        e = document.createElement('div'); e.id = 'ward-screen'; e.className = 'hidden'; e.setAttribute('role', 'dialog'); e.setAttribute('aria-label', 'The Ward');
        e.innerHTML = '<div class="ward-in"><div class="ward-top"><span id="ward-day"></span><span id="ward-grip" class="ward-grip"></span><button id="ward-leave" class="ward-leave" onclick="wardLeave()">LEAVE</button></div><div id="ward-card" class="ward-card"></div><div id="ward-btns" class="ward-btns"></div></div>';
        document.body.appendChild(e);
    }
    return e;
}
function wardTop() {
    const d = document.getElementById('ward-day'), g = document.getElementById('ward-grip'); if (!d) return;
    d.textContent = WARD.phase === 'night' ? 'NIGHT ' + WARD.n : 'DAY ' + WARD.n;
    const gr = Math.max(0, Math.min(10, WARD.grip)); g.innerHTML = 'GRIP <b>' + '▮'.repeat(gr) + '▯'.repeat(10 - gr) + '</b>';
}
function wardShow(o) {       // {title, paras:[html], chart:html, btns:[{t, sub, fn}], dark}
    const e = wardEl(); e.classList.toggle('dark', !!o.dark); WARD.phase = o.dark ? 'night' : 'day';
    const card = document.getElementById('ward-card'), bt = document.getElementById('ward-btns');
    card.innerHTML = (o.title ? '<h3>' + o.title + '</h3>' : '') + (o.paras || []).map(p => '<p>' + p + '</p>').join('') + (o.chart ? '<div class="chart">' + o.chart + '</div>' : '');
    bt.innerHTML = '';
    (o.btns || []).forEach(b => {
        const x = document.createElement('button'); x.className = 'ward-b'; x.innerHTML = b.t + (b.sub ? '<small>' + b.sub + '</small>' : '');
        x.onclick = () => { if (WARD.locked) return; WARD.locked = true; setTimeout(() => { WARD.locked = false; }, 280); try { SFX.click(); } catch (e) {} b.fn(); };
        bt.appendChild(x);
    });
    wardTop(); card.scrollTop = 0; e.scrollTop = 0;
}
function wardGrip(d) { WARD.grip = wClamp(WARD.grip + d, 0, 10); if (d < 0) { try { SFX.thump(); } catch (e) {} } wardTop(); }
function wardApply(r) {
    if (r.grip) wardGrip(r.grip);
    WARD.trust = wClamp(WARD.trust + (r.trust || 0), 0, 10); WARD.truth = wClamp(WARD.truth + (r.truth || 0), 0, 10);
}

// ---------- open / close ----------
function wardOpen() {
    if (WARD.on || activeGame !== 'MENU' || (typeof CINE !== 'undefined' && CINE.on)) return;
    WARD.on = true; activeGame = 'WARD';
    const ln = (typeof lnData === 'function') ? lnData() : { coffee: 0 }, cof = ln.coffee > 0 ? (ln.coffee--, 1) : 0;
    Object.assign(WARD, { n: 1, grip: 7 + (sanity >= 70 ? 1 : 0) + cof, trust: 5 + (meta.nurseKey ? 1 : 0), truth: 5, pills: 0, cheeked: 0, refused: 0, facts: [], ask: null, blur: false, used: [], fails: 0, step: 0, locked: false });
    document.getElementById('main-menu').classList.add('hidden');
    const go = () => { wardEl().classList.remove('hidden'); try { Music.setScene('ward'); } catch (e) {} wardDay(); };
    cinePlay('ward_in', go, { restore: 'ward' });
}
function wardClose() {
    WARD.on = false; activeGame = 'MENU';
    const e = document.getElementById('ward-screen'); if (e) { e.classList.add('hidden'); e.classList.remove('dark'); }
    document.getElementById('main-menu').classList.remove('hidden');
    try { Music.setScene('menu'); updateMoneyDisplay(); updateSanityUI(); saveGame(); } catch (e) {}
}
function wardLeave() {
    if (!WARD.on) return;
    wardShow({ title: 'LEAVE THE WARD?', paras: ['You can go. Nobody will stop you.', 'Nothing is lost, nothing is gained.'], dark: WARD.phase === 'night', btns: [
        { t: 'STAY', fn: wardResume }, { t: 'LEAVE', fn: wardClose }] });
}
function wardResume() { if (WARD.last) wardShow(WARD.last); }

// ---------- the day ----------
function wardDay() {
    const n = WARD.n;
    WARD.facts = wardFacts(n);
    const lines = WARD.facts.map(f => {
        if (WARD.blur) { return '<span class="blur">' + f.text.replace(/[A-Za-z0-9:]/g, '▒').slice(0, 34) + '</span>'; }
        return f.text;
    });
    const tone = WARD.truth >= 7 ? 'The light is clean.' : WARD.truth >= 4 ? 'The light is the same as yesterday.' : 'The light is very clean. You cannot find where it comes from.';
    const intro = n === 1 ? 'The nurse says it is your first day. She says it kindly, as if it were a long way off.' : ['', '', 'Her hair is pinned the other way today.', 'Someone has repainted the walls. They are the same white.', 'There are fewer sounds. You notice this the way you notice a missing tooth.', 'The ward is very quiet. She has been waiting for you to wake up.'][n - 1];
    const card = { title: 'DAY ' + n + ' OF ' + WARD_NIGHTS, paras: [tone, intro].concat(lines), btns: [{ t: 'CONTINUE', sub: WARD.blur ? 'You cannot make out some of it. The pills do that.' : 'Remember what you saw. She will ask.', fn: wardNight }] };
    WARD.blur = false; WARD.last = card; wardShow(card);
}

// ---------- the night ----------
const WARD_EVENTS = [
    { id: 'vent', title: 'THE VENT', text: ['Something in the vent says your name. It has your mother\'s voice. Then it has yours.'], ch: [
        { t: 'ANSWER IT', r: { grip: -2, truth: 1 }, o: 'It says: "Good. Keep counting."' },
        { t: 'PUT THE PILLOW OVER IT', r: { grip: 1 }, o: 'Muffled, it keeps talking. Politely.' },
        { t: 'TELL THE NURSE', r: { trust: 1, truth: -1 }, o: '"There are no vents in this wing, dear." She writes it down.' }] },
    { id: 'bed4', title: 'BED FOUR', text: ['The patient in bed 4 has not moved all week. Tonight their head is turned toward you.'], ch: [
        { t: 'WHISPER BACK', r: { grip: -1, truth: 1 }, o: 'They say: "Don\'t sign it."' },
        { t: 'LOOK AWAY', r: { grip: 1, truth: -1 }, o: 'You hear the sheets, slowly, as they turn.' },
        { t: 'CALL THE NURSE', r: { trust: 1, grip: -1, truth: -1 }, o: 'She looks straight at the bed. "Bed 4 is empty, dear."' }] },
    { id: 'door', title: 'THE DOOR AT THE END', text: ['The door at the end of the hall is open for the first time. Beyond it is the same hall.'], ch: [
        { t: 'WALK THROUGH', r: { grip: -2, truth: 2 }, o: 'You come out where you went in. Your slippers are on the other feet.' },
        { t: 'COUNT YOUR STEPS', r: { truth: 1 }, o: 'Fourteen. Back again: fourteen. Not the same fourteen.' },
        { t: 'CLOSE IT', r: { trust: 1, truth: -1, grip: 1 }, o: 'It is warm from the other side.' }] },
    { id: 'mirror', title: 'THE MIRROR WALL', text: ['The mirror wall shows the ward. In it, you are the only one sitting up.'], ch: [
        { t: 'WAVE', r: { grip: -1, truth: 1 }, o: 'It waves a half-second late. Then a half-second early.' },
        { t: 'COVER IT', r: { trust: -1, grip: 1 }, o: 'A sheet over glass. Something under it adjusts the sheet.' },
        { t: 'ASK IT', r: { grip: -2, truth: 2 }, o: 'Its mouth moves. Yours does not.' }] },
    { id: 'empty', title: 'THE MADE BED', text: ['A bed is made that was not made at lights out. The name card is gone.'], ch: [
        { t: 'ASK THE NURSE WHO', r: { truth: -1 }, o: '"Nobody, dear. That bed has always been made."' },
        { t: 'CHECK UNDER IT', r: { grip: -1, truth: 1 }, o: 'A pair of slippers. Still warm.' },
        { t: 'SAY NOTHING', r: { trust: 1, grip: -1 }, o: 'You lie very still. So does the bed.' }] },
    { id: 'note', title: 'THE NOTE', text: ['A note under your pillow, in your own handwriting: DON\'T TAKE THEM.'], ch: [
        { t: 'READ IT TWICE', r: { truth: 1, grip: -1 }, o: 'The second time, the handwriting is a little neater. A little older.' },
        { t: 'SHOW THE NURSE', r: { trust: 1, truth: -2 }, o: 'She reads it and smiles. "You\'ve been writing again."' },
        { t: 'EAT IT', r: { trust: -1, truth: 1 }, o: 'It tastes of ink and last night.' }] },
    { id: 'phone', title: 'THE TELEPHONE', text: ['The ward phone rings at 3:00. The nurses\' station is empty. It rings the way a person waits.'], ch: [
        { t: 'ANSWER', r: { grip: -2, truth: 1 }, o: 'Breathing. Then a count: one, two, three. Then your name, backwards.' },
        { t: 'UNPLUG IT', r: { grip: 1 }, o: 'It keeps ringing, a little hurt.' },
        { t: 'LET IT RING', r: { trust: 1, grip: -1 }, o: 'It stops mid-ring, as if someone had picked up.' }] },
    { id: 'visit', title: 'VISITING HOURS', text: ['Visitors come at 3 a.m. They sit by the beds and say nothing. One sits by yours. It looks like you, but older.'], ch: [
        { t: 'TAKE ITS HAND', r: { grip: -2, truth: 2 }, o: 'It is exactly as warm as yours. You cannot say which hand is which.' },
        { t: 'TURN TO THE WALL', r: { grip: 1, truth: -1 }, o: 'You feel it lean in, and then very gently pull the blanket up.' },
        { t: 'SAY YOU ARE NOT READY', r: { truth: 1 }, o: '"No," it says, kindly. "Not yet."' }] }
];
function wardNight() {
    if (WARD.n >= WARD_NIGHTS) return wardFinale();
    const pool = WARD_EVENTS.filter(e => !WARD.used.includes(e.id)), ev = wr(pool.length ? pool : WARD_EVENTS); WARD.used.push(ev.id);
    const card = { title: ev.title, dark: true, paras: ev.text, btns: ev.ch.map(c => ({ t: c.t, fn: () => {
        const r = { ...c.r }; if (['vent', 'phone', 'visit'].includes(ev.id) && r.grip < 0 && typeof lnData === 'function' && lnData().up.plugs) r.grip++;
        wardApply(r);
        if (WARD.grip <= 0) return wardBreak();
        const after = { title: ev.title, dark: true, paras: [c.o], btns: [{ t: 'CONTINUE', fn: wardPills }] }; WARD.last = after; wardShow(after);
    } })) };
    WARD.last = card; wardShow(card);
}
function wardPills() {
    const n = WARD.n, line = ['She brings a paper cup. Two white pills and a blue one.', 'The same cup. One more white pill than yesterday.', 'The cup is warm. She holds it out and waits.', 'She does not say what they are. She has stopped saying.', 'The pills are in a row on her palm. She has counted them for you.'][Math.min(4, n - 1)];
    const card = { title: 'THE PILLS', dark: true, paras: [line, '"Take what helps," she says. "It is only to help."'], btns: [
        { t: 'SWALLOW THEM', sub: 'Steadies you. Dulls what you see tomorrow.', fn: () => { WARD.pills++; WARD.blur = true; wardApply({ grip: 2, trust: 1, truth: -1 }); wardAfterPills('They are bitter for a second. Then the ward is very kind.'); } },
        { t: 'HIDE THEM UNDER YOUR TONGUE', sub: 'Keep your head clear. If she looks, she will know.', fn: () => {
            const caught = Math.random() < 0.22 + (n >= 4 ? 0.18 : 0) - (WARD.trust >= 7 ? 0.1 : 0);
            if (caught) { wardApply({ trust: -2, grip: -1 }); wardAfterPills('She opens your mouth with two fingers. They are very gentle. She says nothing, and writes for a long time.'); }
            else { WARD.cheeked++; wardAfterPills('You hold them under your tongue like coins. She smiles. She goes.'); } } },
        { t: 'REFUSE', sub: 'She will remember. You will not lose your footing.', fn: () => { WARD.refused++; wardApply({ trust: -2, truth: 1 }); wardAfterPills('"Of course," she says. She writes it down.'); } }] };
    WARD.last = card; wardShow(card);
}
function wardAfterPills(text) {
    if (WARD.grip <= 0) return wardBreak();
    wardGrip(0);
    const card = { title: 'LIGHTS OUT', dark: true, paras: [text], btns: [{ t: 'SLEEP', fn: () => { wardGrip(WARD.n >= 4 ? -1 : 0); if (WARD.grip <= 0) return wardBreak(); wardCheckup(); } }] };
    WARD.last = card; wardShow(card);
}

// ---------- the morning: the chart ----------
function wardCheckup() {
    const n = WARD.n, f = WARD.facts[Math.floor(Math.random() * WARD.facts.length)] || WARD.facts[0], ch = wardChart(f, n), opts = wardOptions(f, ch);
    const nurse = WARD.trust >= 6 ? 'She smiles. It reaches her eyes.' : WARD.trust >= 3 ? 'She smiles. It stops at her mouth.' : 'She does not smile. She is holding the chart against her chest.';
    const q = 'DAY ' + (n + 1) + '. ' + nurse;
    const card = { title: 'THE CHART', paras: [q, '"Let\'s go over yesterday," she says. "' + f.q + '"'], chart: 'THE CHART SAYS: <b>' + ch.val + '</b>', btns: opts.map(v => ({ t: v === ch.val ? v + ' <small>as the chart says</small>' : v, fn: () => wardAnswer(v, f, ch) })).concat([{ t: 'I DON\'T REMEMBER', fn: () => wardAnswer(null, f, ch) }]) };
    // a chart that tells the truth is allowed to say so; a lie never admits to being one
    card.btns.forEach(b => { b.t = b.t.replace(' <small>as the chart says</small>', ''); });
    WARD.n = n + 1; WARD.last = card; wardShow(card);
}
function wardAnswer(v, f, ch) {
    let r, text;
    if (v === null) { r = { grip: -1, truth: ch.lied ? -1 : 0 }; text = ch.lied ? '"That\'s all right," she says. "I\'ll remember it for you." She does. It is not what you saw.' : '"That\'s all right. It was ' + ch.val + '." It was.'; }
    else if (v === f.val) {
        if (ch.lied) { r = { truth: 2, trust: -2 }; text = 'Your voice does not shake. She looks at you for a long moment. "Is that so," she says, and writes something down that is much longer than ' + v + '.'; }
        else { r = { trust: 1 }; text = '"Good," she says, and means it.'; }
    } else if (v === ch.val) { r = { trust: 2, truth: -2, grip: -1 }; text = '"Good," she says, warmly. The word is yours now. You are no longer sure it was not always ' + v + '.'; }
    else { r = { grip: -1, truth: -1, trust: -1 }; text = 'She tilts her head. "Not quite." You were right about nothing. The room is very quiet.'; }
    wardApply(r);
    if (WARD.grip <= 0) return wardBreak();
    const card = { title: 'THE CHART', paras: [text], btns: [{ t: 'CONTINUE', fn: wardDay }] }; WARD.last = card; wardShow(card);
}

// ---------- the sixth day ----------
function wardFinale() {
    const name = (settings.name || 'YOU').toUpperCase(), fine = WARD.truth >= 4;
    const card = { title: 'DISCHARGE', paras: ['The dayroom is empty. The chair is warm.', 'The nurse has the papers. "You are well," she says. "You are going home. Sign here."', 'The chart on her arm says there are five patients in the dayroom. She does not look at the dayroom.'],
        btns: [{ t: 'SIGN', sub: 'You are well.', fn: () => wardEnd('sign') },
               { t: 'READ THE NAME FIRST', sub: fine ? '' : 'You do not know if you want to.', fn: () => wardRead(name) },
               { t: 'WALK TOWARD THE DOOR', sub: 'The one at the end of the hall.', fn: () => wardDoor() }] };
    WARD.last = card; wardShow(card);
}
function wardRead(name) {
    const card = { title: 'THE PAPERS', dark: false, paras: ['PATIENT: <b>' + name + '</b>', 'ADMITTED: eleven years ago.', 'REASON FOR ADMISSION: <span class="blur">▒▒▒▒▒▒▒▒▒▒▒▒▒▒</span>', 'NEXT OF KIN: the nurse. It is signed in a hand you know.'], btns: [{ t: 'SIGN ANYWAY', fn: () => wardEnd('sign') }, { t: 'WALK TOWARD THE DOOR', fn: wardDoor }] };
    wardApply({ truth: 1, grip: -1 }); if (WARD.grip <= 0) return wardBreak();
    WARD.last = card; wardShow(card);
}
function wardDoor() {
    if (WARD.truth >= 6) return wardEnd('door');
    WARD.fails++; wardApply({ grip: -3 });
    if (WARD.grip <= 0) return wardBreak();
    const card = { title: 'THE DOOR', paras: ['You walk toward the door. You have been walking for some time.', 'It is a painting of a door. It is a very good painting. The nurse is very patient.', 'You are not sure enough of what you saw.'], btns: [{ t: 'BACK', fn: wardFinale }] };
    WARD.last = card; wardShow(card);
}

// ---------- endings ----------
function wardPay(cash, marks, san) {
    const w = wardData(), first = w.day !== (typeof hsDay === 'function' ? hsDay() : new Date().toDateString());
    if (!first) { cash = Math.floor(cash * 0.2); marks = 0; }
    w.day = typeof hsDay === 'function' ? hsDay() : new Date().toDateString();
    globalMoney += cash; totalStats.moneyEarned += cash; if (marks) addMarks(marks);
    if (san) updateSanity(san);
    return { cash, marks, first };
}
function wardEnd(kind) {
    const w = wardData(), clean = WARD.pills === 0;
    let res, title, paras, film;
    if (kind === 'door') {
        w.clears++; w.door++; if (clean) w.pillFree++;
        res = wardPay(900 + (clean ? 400 : 0), 3 + (clean ? 2 : 0), 12);
        try { unlockAchievement('WARD_CLEAR'); if (clean) unlockAchievement('NO_PILLS'); fragGive(64); } catch (e) {}
        title = 'THE DOOR';
        paras = ['The door is not a painting. It opens onto the Study, at the hour you left it.', 'The nurse is standing at the end of the hall. She does not follow. She lifts one hand, the way you would to someone you are fond of.', 'On the chart in her other arm, there is one line you can read from here: PATIENT RETURNED.'];
    } else if (kind === 'sign') {
        w.clears++; w.disch++;
        res = wardPay(300, 1, -6);
        try { if (WARD.trust >= 7) unlockAchievement('GOOD_PATIENT'); } catch (e) {}
        title = 'DISCHARGED'; film = 'ward_out';
        paras = ['You sign. The pen is warm. "There," she says. "Isn\'t that better?" It is.', 'Outside, the corridor is exactly as you left it. That is the first thing that frightens you.', 'For a while you will not count anything.'];
    }
    const pay = res.first ? '+$' + res.cash + (res.marks ? ', +' + res.marks + ' MARKS' : '') : '+$' + res.cash + ' (you have been here today already)';
    const card = { title, dark: kind === 'door', paras: paras.concat(['<span class="dim">' + pay + '</span>']), btns: [{ t: 'CONTINUE', fn: () => { const done = () => { wardClose(); }; if (kind === 'sign') cinePlay(film, done, { restore: 'menu' }); else done(); } }] };
    saveGame(); wardShow(card);
}
function wardBreak() {
    const w = wardData(); w.broken++; updateSanity(-10); saveGame();
    const card = { title: 'IT ALL ARRIVES AT ONCE', dark: true, paras: ['Every patient, every bed, every number you were told. All of it at once, and all of it true.', 'You wake in the Study. It is still dark. Your hands are steady. That is the worst of it.', '<span class="dim">Sanity -10.</span>'], btns: [{ t: 'WAKE UP', fn: wardClose }] };
    try { SFX.glitch(); } catch (e) {}
    WARD.last = card; wardShow(card);
}

// ---------- the lobby button ----------
(function() {
    const house = document.querySelector('.house-btn'); if (!house || document.getElementById('menu-btn-ward')) return;
    const b = document.createElement('button'); b.id = 'menu-btn-ward'; b.className = 'mode-card mode-slim mode-purple ward-btn';
    b.innerHTML = 'THE WARD <span class="mode-sub">No shells. Six days. Remember what you saw.</span>'; b.onclick = wardOpen;
    house.parentNode.insertBefore(b, house.nextSibling);
})();
document.addEventListener('keydown', e => { if (WARD.on && e.key === 'Escape') { e.preventDefault(); wardLeave(); } });
