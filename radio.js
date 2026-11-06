"use strict";

// =====================================================================
// RADIO: a procedural tuner on the SYSTEM tab. Dial 64.0 - 108.0 MHz.
// (The brief asked for 88-108 but also for 66.6, so the dial reaches down.)
//   static     pink + white noise through a bandpass that follows the dial
//   66.6 MHz   synthesised Morse code
//   94.4 MHz   low drone pad
//   103.6 MHz  distorted beeps
// Each secret crossfades in as you approach it. Hold the tuning for 2 s the
// first time and it pays out: a lore page plus a small status effect.
// Class Radio owns every node and timer; stop() disconnects all of them.
// =====================================================================
const RADIO_KEY = 'malicex_radio';
const RADIO_MIN = 64, RADIO_MAX = 108, RADIO_WINDOW = 0.45;
const RADIO_SECRETS = [
    { f: 66.6, id: 'morse', name: 'A VOICE IN CODE', lore: 41,
      text: '"Between the stations a hand taps out the same three words. BEHIND YOU. It is not warning me. It is telling me where it is standing."',
      fx: 'Calm hands. +5 Sanity. The next run starts you at -1 HP.' },
    { f: 94.4, id: 'drone', name: 'THE LOW HUM', lore: 42,
      text: '"The hum under the radio is the same note the dealer hums when he thinks nobody is listening. It is almost a lullaby."',
      fx: 'The hum settles you. +5 Sanity.' },
    { f: 103.6, id: 'beeps', name: 'BROKEN SIGNAL', lore: 43,
      text: '"The beeps are not random. Somebody is counting the shells, and the count is always one short."',
      fx: 'You are paid in a strange coin. -5 Sanity. The next run starts with one extra item.' }
];
const MORSE = { A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..' };
const RADIO_MSG = 'BEHIND YOU';

// ---------- tracks: each track is a station on the dial ----------
const RADIO_TRACKS = [
    { id: 'auto', name: 'THE HOUSE', f: 90.0, d: 'The game picks.' },
    { id: 'tape', name: 'TAPE FM', f: 88.1, d: 'Warm, worn cassette.' },
    { id: 'musicbox', name: 'MUSIC BOX', f: 91.7, d: 'A small bright lullaby.' },
    { id: 'deadair', name: 'DEAD AIR', f: 70.0, d: 'Almost nothing. A hum.' },
    { id: 'pulse', name: 'PULSE', f: 99.5, d: 'Driving.', locked: true },
    { id: 'hymn', name: 'HYMN', f: 105.3, d: 'Slow choir pads.', locked: true },
    { id: 'carnival', name: 'CARNIVAL', f: 76.8, d: 'A waltz, slightly wrong.', locked: true }
];
function trackOpen(t) { return !t.locked || !!meta.nightTuner; }
function bgmPick(id, fromDial) {
    const t = RADIO_TRACKS.find(x => x.id === id);
    if (!t) return;
    if (!trackOpen(t)) { SFX.empty(); radioSay(t.name + ' is jammed. A Night Tuner would clear it (Market, Marks).'); return; }
    Music.setTrack(id);
    if (!fromDial) { radio.freq = t.f; if (radio.on) radio.setFreq(t.f); }
    radioSay('TRACK: ' + t.name + '. ' + t.d);
    radioUpdateUI(); SFX.click();
}
function radioTrackBtns() {
    const cur = Music.getTrack();
    return RADIO_TRACKS.map(t => `<button class="trk ${cur === t.id ? 'on' : ''} ${trackOpen(t) ? '' : 'lock'}" onclick="bgmPick('${t.id}')"><b>${t.name}</b><i>${t.f.toFixed(1)}</i></button>`).join('');
}

let radioSave = { found: {}, hpMod: 0 };
try { const d = JSON.parse(Store.get(RADIO_KEY) || '{}'); radioSave = { found: d.found || {}, hpMod: d.hpMod || 0 }; } catch (e) {}
function radioPersist() { Store.set(RADIO_KEY, JSON.stringify(radioSave)); }

class Radio {
    constructor() { this.on = false; this.freq = 90.0; this.nodes = []; this.timers = []; this.mix = { morse: 0, drone: 0, beeps: 0 }; this.lock = 0; this.mNext = 0; this.bNext = 0; }
    // keep a handle on every node so stop() can disconnect them all
    _n(node) { this.nodes.push(node); return node; }
    _pink(ac) {
        const n = Math.floor(ac.sampleRate * 3), buf = ac.createBuffer(1, n, ac.sampleRate), d = buf.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < n; i++) {
            const w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
            b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
        }
        return buf;
    }
    start() {
        if (this.on) return;
        initAudio();
        if (!audioCtx || !AudioBus.master) return;
        const ac = audioCtx, N = n => this._n(n);
        this.out = N(ac.createGain()); this.out.gain.value = 0; this.out.connect(AudioBus.master);
        // static: pink + white -> bandpass -> gain
        this.bp = N(ac.createBiquadFilter()); this.bp.type = 'bandpass'; this.bp.Q.value = 0.9;
        this.gStatic = N(ac.createGain()); this.gStatic.gain.value = 0.4;
        this.bp.connect(this.gStatic); this.gStatic.connect(this.out);
        [[this._pink(ac), 1.0], [AudioBus.noise, 0.35]].forEach(([buf, g]) => {
            const s = N(ac.createBufferSource()); s.buffer = buf; s.loop = true;
            const gg = N(ac.createGain()); gg.gain.value = g;
            s.connect(gg); gg.connect(this.bp); s.start(0, Math.random());
            this.nodes.push({ stop: () => { try { s.stop(); } catch (e) {} }, disconnect() {} });
        });
        // morse: sine through a keyer
        this.gMorse = N(ac.createGain()); this.gMorse.gain.value = 0; this.gMorse.connect(this.out);
        this.keyM = N(ac.createGain()); this.keyM.gain.value = 0; this.keyM.connect(this.gMorse);
        this.oscM = N(ac.createOscillator()); this.oscM.type = 'sine'; this.oscM.frequency.value = 640; this.oscM.connect(this.keyM); this.oscM.start();
        // drone pad: three low oscillators, slow filter wobble
        this.gDrone = N(ac.createGain()); this.gDrone.gain.value = 0; this.gDrone.connect(this.out);
        const lp = N(ac.createBiquadFilter()); lp.type = 'lowpass'; lp.frequency.value = 260; lp.Q.value = 2; lp.connect(this.gDrone);
        [[55, 'sawtooth'], [55.7, 'sawtooth'], [82.4, 'sine']].forEach(([f, t]) => {
            const o = N(ac.createOscillator()); o.type = t; o.frequency.value = f; o.connect(lp); o.start();
        });
        const lfo = N(ac.createOscillator()); lfo.frequency.value = 0.13;
        const lfoG = N(ac.createGain()); lfoG.gain.value = 90; lfo.connect(lfoG); lfoG.connect(lp.frequency); lfo.start();
        // distorted beeps
        this.gBeep = N(ac.createGain()); this.gBeep.gain.value = 0; this.gBeep.connect(this.out);
        const ws = N(ac.createWaveShaper()), curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) { const x = i / 128 - 1; curve[i] = Math.tanh(x * 14); }
        ws.curve = curve; ws.connect(this.gBeep);
        this.keyB = N(ac.createGain()); this.keyB.gain.value = 0; this.keyB.connect(ws);
        this.oscB = N(ac.createOscillator()); this.oscB.type = 'square'; this.oscB.frequency.value = 1200; this.oscB.connect(this.keyB); this.oscB.start();
        this.on = true;
        this.out.gain.setTargetAtTime(0.7, ac.currentTime, 0.2);
        AudioBus.music.gain.setTargetAtTime(0.03, ac.currentTime, 0.3);     // duck the music
        this.mNext = this.bNext = ac.currentTime + 0.1;
        this.timers.push(setInterval(() => this.tick(), 200));
        this.setFreq(this.freq);
    }
    stop() {
        if (!this.on) return;
        this.on = false;
        this.timers.forEach(t => clearInterval(t)); this.timers = [];
        this.nodes.forEach(n => {
            try { if (n.stop) n.stop(); } catch (e) {}
            try { n.disconnect(); } catch (e) {}
        });
        this.nodes = [];
        applyAudioLevels();                                                 // bring the music back
    }
    setFreq(f) {
        this.freq = Math.round(Math.max(RADIO_MIN, Math.min(RADIO_MAX, f)) * 10) / 10;
        if (!this.on) return;
        const t = audioCtx.currentTime, x = (this.freq - RADIO_MIN) / (RADIO_MAX - RADIO_MIN);
        let best = 0;
        RADIO_SECRETS.forEach(s => {
            const m = Math.max(0, 1 - Math.abs(this.freq - s.f) / RADIO_WINDOW);
            this.mix[s.id] = m; best = Math.max(best, m);
        });
        this.bp.frequency.setTargetAtTime(350 + x * 3400, t, 0.05);         // the dial sweeps the static
        this.bp.Q.setTargetAtTime(0.7 + best * 0.5, t, 0.05);
        this.gStatic.gain.setTargetAtTime(0.42 * (1 - 0.88 * best), t, 0.08); // crossfade out
        this.gMorse.gain.setTargetAtTime(this.mix.morse * 0.45, t, 0.08);
        this.gDrone.gain.setTargetAtTime(this.mix.drone * 0.9, t, 0.12);
        this.gBeep.gain.setTargetAtTime(this.mix.beeps * 0.22, t, 0.08);
        if (best < 0.8) this.lock = 0;
    }
    // 200ms: schedule Morse / beeps a little ahead, flutter the static, count lock time
    tick() {
        if (!this.on) return;
        const ac = audioCtx, now = ac.currentTime;
        this.gStatic.gain.setTargetAtTime(this.gStatic.gain.value * (0.85 + Math.random() * 0.3), now, 0.03);
        if (this.mix.morse > 0.02) {
            if (this.mNext < now) this.mNext = now + 0.05;
            while (this.mNext < now + 1.2) this._morse();
        } else this.mNext = now + 0.05;
        if (this.mix.beeps > 0.02) {
            if (this.bNext < now) this.bNext = now + 0.05;
            while (this.bNext < now + 1.2) {
                const dur = 0.04 + Math.random() * 0.09, f = [440, 880, 1320, 1760, 2200][Math.floor(Math.random() * 5)];
                this.oscB.frequency.setValueAtTime(f, this.bNext);
                this.keyB.gain.setValueAtTime(1, this.bNext); this.keyB.gain.setValueAtTime(0, this.bNext + dur);
                this.bNext += dur + 0.08 + Math.random() * 0.45;
            }
        } else this.bNext = now + 0.05;
        const hit = RADIO_SECRETS.find(s => this.mix[s.id] >= 0.8);
        if (hit) { this.lock += 200; if (this.lock >= 2000 && !radioSave.found[hit.f]) radioReward(hit); }
        radioUpdateUI();
    }
    _morse() {
        const u = 0.09, g = this.keyM.gain;
        let t = this.mNext;
        for (const ch of RADIO_MSG) {
            if (ch === ' ') { t += u * 4; continue; }
            for (const sym of MORSE[ch]) {
                const d = sym === '.' ? u : u * 3;
                g.setValueAtTime(1, t); g.setValueAtTime(0, t + d);
                t += d + u;
            }
            t += u * 2;
        }
        this.mNext = t + u * 14;
    }
}
const radio = new Radio();

function radioReward(s) {
    radioSave.found[s.f] = true;
    if (!LORE_ENTRIES.some(l => l.id === s.lore)) LORE_ENTRIES.push({ id: s.lore, text: s.text });
    if (!unlockedLore.includes(s.lore)) unlockedLore.push(s.lore);
    if (s.id === 'morse') { updateSanity(5); radioSave.hpMod = -1; }
    else if (s.id === 'drone') updateSanity(5);
    else { updateSanity(-5); nextRunItems.push(randomItemKey()); }
    radioPersist(); saveGame();
    SFX.relief && SFX.relief();
    buzz([30, 40, 60]);
    radioSay(`SIGNAL FOUND: ${s.name}. ${s.fx} A lore page was added to the Grimoire.`);
}
// the first round of the next run: apply a stored HP change
const _radioStartRound = startRound;
startRound = function() {
    if (radioSave.hpMod && !state.radioApplied) {
        state.radioApplied = true;
        state.playerHp = Math.max(1, state.playerHp + radioSave.hpMod);
        radioSave.hpMod = 0; radioPersist();
        log('THE RADIO FOLLOWED YOU. -1 HP.', 'text-purple-400');
        renderHP();
    }
    return _radioStartRound();
};

// ---------- UI ----------
function radioSay(t) { const e = document.getElementById('radio-status'); if (e) e.textContent = t; }
function radioUpdateUI() {
    const tr = document.getElementById('radio-tracks'); if (tr) tr.innerHTML = radioTrackBtns();
    const f = document.getElementById('radio-freq'), s = document.getElementById('radio-status');
    if (f) f.textContent = radio.freq.toFixed(1) + ' MHz';
    const sl = document.getElementById('radio-dial');
    if (sl && Number(sl.value) !== radio.freq) sl.value = radio.freq;
    const found = Object.keys(radioSave.found).length;
    const c = document.getElementById('radio-found'); if (c) c.textContent = `SIGNALS ${found}/${RADIO_SECRETS.length}`;
    if (!s || !radio.on) return;
    const near = RADIO_SECRETS.find(x => radio.mix[x.id] > 0.3);
    if (near && radio.mix[near.id] >= 0.8) s.textContent = radioSave.found[near.f] ? `LOCKED: ${near.name}` : `LOCKED... hold steady (${Math.min(100, Math.round(radio.lock / 20))}%)`;
    else if (near) s.textContent = 'Something under the static...';
    else if (!/^SIGNAL FOUND/.test(s.textContent)) s.textContent = 'Static.';
}
function radioToggle() {
    if (radio.on) radio.stop(); else radio.start();
    const b = document.getElementById('radio-power');
    if (b) b.textContent = radio.on ? 'POWER: ON' : 'POWER: OFF';
    radioSay(radio.on ? 'Static.' : 'Off.');
    SFX.click();
}
function radioDialTrack() {
    const t = RADIO_TRACKS.find(x => Math.abs(x.f - radio.freq) < 0.25);
    if (t && Music.getTrack() !== t.id && trackOpen(t)) bgmPick(t.id, true);
}
function radioTune(v) { radio.freq = Math.round(Number(v) * 10) / 10; radio.setFreq(radio.freq); radioDialTrack(); radioUpdateUI(); }
function radioNudge(d) { radio.setFreq(radio.freq + d); radioDialTrack(); radioUpdateUI(); SFX.hover(); }
function radioBuild() {
    const box = document.getElementById('radio-box');
    if (!box || box.dataset.built) return;
    box.dataset.built = '1';
    box.innerHTML = `<div class="contracts-title">RADIO <span id="radio-found" class="terms-bonus"></span></div>` +
        `<div class="radio-face"><div id="radio-freq" class="radio-freq">90.0 MHz</div>` +
        `<input id="radio-dial" type="range" min="${RADIO_MIN}" max="${RADIO_MAX}" step="0.1" value="90" aria-label="Frequency" oninput="radioTune(this.value)">` +
        `<div class="radio-scale"><span>${RADIO_MIN}</span><span>76</span><span>88</span><span>98</span><span>${RADIO_MAX}</span></div></div>` +
        `<div class="lobby-grid"><button class="mode-card mode-slim" onclick="radioNudge(-0.1)">&lt; 0.1</button><button class="mode-card mode-slim" onclick="radioNudge(0.1)">0.1 &gt;</button></div>` +
        `<button id="radio-power" class="mode-card mode-slim" onclick="radioToggle()">POWER: OFF</button>` +
        `<div class="trk-title">BACKGROUND MUSIC</div><div id="radio-tracks" class="trk-grid"></div>` +
        `<div id="radio-status" class="contracts-note">Off. Some stations are not on the dial.</div>`;
    radioUpdateUI();
}
// the radio only plays in the lobby: anything else shuts it off
setInterval(() => { if (radio.on && activeGame !== 'MENU') { radio.stop(); const b = document.getElementById('radio-power'); if (b) b.textContent = 'POWER: OFF'; } }, 1000);
const _radioApply = applyAudioLevels;
applyAudioLevels = function() {
    _radioApply();
    if (radio.on && audioCtx && AudioBus.music) AudioBus.music.gain.setTargetAtTime(0.03, audioCtx.currentTime, 0.1);
};
const _radioLobby = renderLobby;
renderLobby = function() { _radioLobby(); radioBuild(); radioUpdateUI(); syncThemeButtons(); };
