"use strict";

// =====================================================================
// AUDIO ENGINE - procedural SFX + adaptive BGM. No audio files needed.
// Public API used by the rest of the game:
//   SFX.<name>()                  one-shot effects
//   Music.setScene(name, opts)    'menu' | 'fight' | 'boss' | 'win' | 'death' | 'off'
//   Music.setPhase('poker'|'shoot'), Music.setSanity(n), Music.setVitals(hp, maxHp, dHp, maxDHp)
//   toggleAudio() / toggleMusic() / setMusicVolume(v)
// Gameplay randomness never touches this file (own LCG), so seeds stay deterministic.
// =====================================================================
const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
const AUDIO_PREF_KEY = 'malicex_audio';
let audioCtx = null;
let isMuted = false;     // master mute (SFX + music)
let musicOn = true;      // music layer only
let musicVol = 0.6;      // 0..1
const AudioBus = { master: null, music: null, sfx: null, fx: null, noise: null };

function loadAudioPrefs() {
    try {
        const p = JSON.parse(Store.get(AUDIO_PREF_KEY) || '{}');
        if (typeof p.muted === 'boolean') isMuted = p.muted;
        if (typeof p.music === 'boolean') musicOn = p.music;
        if (typeof p.vol === 'number') musicVol = Math.min(1, Math.max(0, p.vol));
    } catch (e) { /* storage unavailable: defaults */ }
}
function saveAudioPrefs() {
    try { Store.set(AUDIO_PREF_KEY, JSON.stringify({ muted: isMuted, music: musicOn, vol: musicVol })); } catch (e) { /* ignore */ }
}

// Builds the mixer on any context (live or offline, so it can be unit-tested).
function buildAudioGraph(ac) {
    const bus = {};
    bus.master = ac.createGain();
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 18; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    bus.master.connect(comp); comp.connect(ac.destination);
    bus.music = ac.createGain();
    bus.sfx = ac.createGain();
    bus.music.connect(bus.master);
    bus.sfx.connect(bus.master);
    // cheap reverb: feedback delay with a dark filter. Music "send" goes in bus.fx
    bus.fx = ac.createGain();
    const dl = ac.createDelay(1.0); dl.delayTime.value = 0.34;
    const fb = ac.createGain(); fb.gain.value = 0.42;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
    const wet = ac.createGain(); wet.gain.value = 0.5;
    bus.fx.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(bus.music);
    // shared white-noise buffer (2s)
    const nb = ac.createBuffer(1, Math.floor(ac.sampleRate * 2), ac.sampleRate);
    const d = nb.getChannelData(0);
    let s = 22222;
    for (let i = 0; i < d.length; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 2147483648) - 1; }
    bus.noise = nb;
    return bus;
}

function applyAudioLevels() {
    if (!audioCtx || !AudioBus.master) return;
    const t = audioCtx.currentTime;
    AudioBus.master.gain.setTargetAtTime(isMuted ? 0 : 0.9, t, 0.05);
    AudioBus.music.gain.setTargetAtTime(musicOn ? 0.55 * musicVol : 0, t, 0.15);
    AudioBus.sfx.gain.setTargetAtTime(0.85, t, 0.05);
}

function initAudio() {
    if (!AudioCtxClass) return;
    if (!audioCtx) {
        audioCtx = new AudioCtxClass();
        const g = buildAudioGraph(audioCtx);
        Object.assign(AudioBus, g);
        applyAudioLevels();
        Music.onContextReady();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function refreshAudioButtons() {
    const a = document.getElementById('btn-audio');
    if (a) a.innerText = isMuted ? 'AUDIO: OFF' : 'AUDIO: ON';
    const m = document.getElementById('btn-music');
    if (m) m.innerText = musicOn ? 'MUSIC: ON' : 'MUSIC: OFF';
    const f = document.getElementById('audio-fab');
    if (f) f.innerHTML = isMuted ? px('speakerOff') : (musicOn ? px('speaker') : px('speakerLow'));
    const v = document.getElementById('music-vol');
    if (v && Number(v.value) !== Math.round(musicVol * 100)) v.value = Math.round(musicVol * 100);
}

function toggleAudio() {
    isMuted = !isMuted;
    initAudio();
    applyAudioLevels();
    saveAudioPrefs();
    refreshAudioButtons();
}
function toggleMusic() {
    musicOn = !musicOn;
    initAudio();
    applyAudioLevels();
    saveAudioPrefs();
    refreshAudioButtons();
}
function setMusicVolume(v) {
    musicVol = Math.min(1, Math.max(0, Number(v) / 100));
    applyAudioLevels();
    saveAudioPrefs();
    refreshAudioButtons();
}

// ---------------------------------------------------------------------
// primitives
// ---------------------------------------------------------------------
function tone(freq, type, dur, vol, o) {
    if (isMuted || !audioCtx) return;
    o = o || {};
    const ac = audioCtx, t0 = ac.currentTime + (o.when || 0);
    const osc = ac.createOscillator(), g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.slideTo), t0 + dur);
    if (o.detune) osc.detune.value = o.detune;
    const a = o.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(o.bus || AudioBus.sfx);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (e) {} };
}

function noiseBurst(dur, o) {
    if (isMuted || !audioCtx) return;
    o = o || {};
    const ac = audioCtx, t0 = ac.currentTime + (o.when || 0);
    const src = ac.createBufferSource(); src.buffer = AudioBus.noise; src.loop = true;
    const g = ac.createGain();
    const vol = o.vol == null ? 0.5 : o.vol;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + (o.attack || 0.003));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = src;
    if (o.type) {
        const f = ac.createBiquadFilter(); f.type = o.type; f.Q.value = o.q || 0.8;
        f.frequency.setValueAtTime(o.freq || 1000, t0);
        if (o.slideTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), t0 + dur);
        src.connect(f); node = f;
    }
    node.connect(g); g.connect(o.bus || AudioBus.sfx);
    src.start(t0, Math.random() * 1.5); src.stop(t0 + dur + 0.05);
    src.onended = () => { try { src.disconnect(); g.disconnect(); if (node !== src) node.disconnect(); } catch (e) {} };
}

// legacy helpers (older code still calls these)
function playTone(f, t, d, v) { tone(f, t, d, v); }
function playNoise(d, f) { noiseBurst(d, { vol: 0.5, type: f || null, freq: 1000 }); }

// ---------------------------------------------------------------------
// SFX
// ---------------------------------------------------------------------
const SFX = {
    click: () => tone(800, 'square', 0.05, 0.1),
    hover: () => tone(200, 'sine', 0.05, 0.05),
    shot: () => {
        noiseBurst(0.5, { vol: 0.9, type: 'lowpass', freq: 5000, slideTo: 180 });
        tone(110, 'sine', 0.35, 0.8, { slideTo: 38 });
        noiseBurst(0.9, { vol: 0.12, type: 'lowpass', freq: 600, slideTo: 120, when: 0.08 });
    },
    empty: () => { tone(2000, 'triangle', 0.05, 0.1); tone(900, 'square', 0.03, 0.05, { when: 0.02 }); },
    win: () => { tone(400, 'square', 0.1, 0.2); tone(600, 'square', 0.1, 0.2, { when: 0.15 }); tone(800, 'square', 0.2, 0.2, { when: 0.3 }); },
    lose: () => { tone(300, 'sawtooth', 0.3, 0.2); tone(100, 'sawtooth', 0.5, 0.2, { when: 0.25 }); },
    flip: () => noiseBurst(0.06, { vol: 0.35, type: 'lowpass', freq: 1500 }),
    glitch: () => { tone(200 + Math.random() * 800, 'sawtooth', 0.1, 0.1); noiseBurst(0.1, { vol: 0.35 }); },
    // --- added in v9 ---
    load: () => {      // racking the shells
        noiseBurst(0.04, { vol: 0.5, type: 'highpass', freq: 3000 });
        tone(180, 'square', 0.06, 0.25, { slideTo: 90 });
        noiseBurst(0.05, { vol: 0.5, type: 'highpass', freq: 3000, when: 0.11 });
        tone(140, 'square', 0.08, 0.25, { when: 0.11, slideTo: 70 });
    },
    chip: () => { tone(1800, 'triangle', 0.06, 0.12); tone(2400, 'triangle', 0.08, 0.1, { when: 0.05 }); },
    buy: () => { tone(1200, 'sine', 0.1, 0.18); tone(1600, 'sine', 0.2, 0.18, { when: 0.08 }); },
    heal: () => { [440, 554, 659, 880].forEach((f, i) => tone(f, 'sine', 0.3, 0.14, { when: i * 0.07, attack: 0.02 })); },
    shield: () => { tone(260, 'sawtooth', 0.35, 0.12, { slideTo: 900 }); tone(520, 'sine', 0.4, 0.15, { slideTo: 1300, when: 0.05 }); },
    shieldBreak: () => { noiseBurst(0.25, { vol: 0.6, type: 'highpass', freq: 2500 }); tone(900, 'square', 0.25, 0.2, { slideTo: 120 }); },
    bell: () => { [1, 2.76, 5.4].forEach((r, i) => tone(330 * r, 'sine', 2.2 / (i + 1), 0.16 / (i + 1), { attack: 0.01 })); },
    thump: () => tone(60, 'sine', 0.18, 0.7, { slideTo: 36 }),
    heartbeat: () => { SFX.thump(); setTimeout(() => tone(52, 'sine', 0.16, 0.5, { slideTo: 34 }), 170); },
    whisper: () => {
        noiseBurst(1.0, { vol: 0.16, type: 'bandpass', freq: 1800, q: 4, slideTo: 3200, attack: 0.25 });
        noiseBurst(0.9, { vol: 0.1, type: 'bandpass', freq: 2600, q: 6, slideTo: 1400, attack: 0.3, when: 0.2 });
    },
    stinger: () => {   // sanity tier drops
        [220, 233, 349, 370].forEach(f => tone(f, 'sawtooth', 1.3, 0.07, { attack: 0.03 }));
        noiseBurst(1.1, { vol: 0.2, type: 'lowpass', freq: 1400, slideTo: 200, attack: 0.05 });
    },
    relief: () => { [392, 494, 587].forEach((f, i) => tone(f, 'sine', 0.8, 0.12, { when: i * 0.12, attack: 0.05 })); },
    tick: () => tone(1500, 'sine', 0.03, 0.12),
    reveal: () => noiseBurst(0.35, { vol: 0.3, type: 'bandpass', freq: 400, q: 2, slideTo: 3500, attack: 0.05 }),
    raise: () => { tone(110, 'sawtooth', 0.5, 0.18, { slideTo: 260 }); noiseBurst(0.3, { vol: 0.2, type: 'lowpass', freq: 800 }); },
    eject: () => { noiseBurst(0.12, { vol: 0.5, type: 'highpass', freq: 1800 }); tone(1400, 'triangle', 0.1, 0.12, { slideTo: 500 }); },
    jackpot: () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 'square', 0.18, 0.14, { when: i * 0.08 })); },
    knife: () => { noiseBurst(0.18, { vol: 0.5, type: 'highpass', freq: 4000, slideTo: 1200 }); tone(2200, 'sawtooth', 0.12, 0.1, { slideTo: 600 }); },
    cuff: () => { tone(1500, 'square', 0.04, 0.2); tone(1200, 'square', 0.05, 0.2, { when: 0.07 }); },
    ascend: () => { [196, 247, 294, 392].forEach(f => tone(f, 'triangle', 2.0, 0.09, { attack: 0.5 })); }
};

// ---------------------------------------------------------------------
// MUSIC - scheduler schedules whole bars ahead of time on the audio clock.
// ---------------------------------------------------------------------
const Music = (() => {
    const midi = m => 440 * Math.pow(2, (m - 69) / 12);
    // chord shapes are semitone offsets above each bar's root offset
    const SCENES = {
        menu:  { bpm: 48, beats: 4, root: 45, prog: [[0, [0, 3, 7]], [-4, [0, 4, 7]], [-7, [0, 3, 7]], [-5, [0, 4, 7]]],
                 pad: 1, drone: 1, kick: null, hat: 0, bell: 0.7, arp: 0, scale: [0, 3, 5, 7, 10] },
        fight: { bpm: 74, beats: 4, root: 38, prog: [[0, [0, 3, 7]], [-4, [0, 4, 7]], [5, [0, 3, 7]], [7, [0, 4, 7]]],
                 pad: 0.8, drone: 1, kick: [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0], hat: 0.8, bell: 0.2, arp: 1, scale: [0, 1, 3, 5, 7, 8, 10] },
        boss:  { bpm: 88, beats: 4, root: 36, prog: [[0, [0, 3, 7]], [-4, [0, 4, 7]], [5, [0, 3, 7]], [6, [0, 3, 6]]],
                 pad: 1, drone: 1.3, kick: [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0], hat: 1, bell: 0.15, arp: 1, scale: [0, 1, 3, 6, 7, 8, 10], bass8: true },
        win:   { bpm: 56, beats: 4, root: 48, prog: [[0, [0, 4, 7]], [7, [0, 4, 7]], [9, [0, 3, 7]], [5, [0, 4, 7]]],
                 pad: 1, drone: 0.4, kick: null, hat: 0, bell: 0.9, arp: 0, scale: [0, 2, 4, 7, 9] },
        cine:  { bpm: 42, beats: 4, root: 40, prog: [[0, [0, 3, 7]], [-2, [0, 3, 7]], [-5, [0, 3, 6]], [-7, [0, 3, 7]]],
                 pad: 1, drone: 1.2, kick: null, hat: 0, bell: 0.35, arp: 0, scale: [0, 3, 5, 7, 10] },
        // ---- radio tracks (picked on the lobby radio, replace menu + fight music)
        tape:     { bpm: 62, beats: 4, root: 43, prog: [[0, [0, 4, 7]], [5, [0, 4, 7]], [-3, [0, 3, 7]], [-5, [0, 4, 7]]],
                    pad: 1.1, drone: 0.6, kick: null, hat: 0, bell: 0.55, arp: 0, scale: [0, 2, 4, 7, 9] },
        musicbox: { bpm: 54, beats: 4, root: 52, prog: [[0, [0, 4, 7]], [7, [0, 4, 7]], [9, [0, 3, 7]], [5, [0, 4, 7]]],
                    pad: 0.35, drone: 0.2, kick: null, hat: 0, bell: 1, arp: 0, scale: [0, 2, 4, 7, 9, 12] },
        deadair:  { bpm: 36, beats: 4, root: 31, prog: [[0, [0, 7]], [0, [0, 7]], [-2, [0, 7]], [0, [0, 7]]],
                    pad: 0.3, drone: 1.5, kick: null, hat: 0, bell: 0, arp: 0, scale: [0] },
        pulse:    { bpm: 100, beats: 4, root: 40, prog: [[0, [0, 3, 7]], [0, [0, 3, 7]], [-4, [0, 4, 7]], [-2, [0, 3, 7]]],
                    pad: 0.7, drone: 1, kick: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0], hat: 0.9, bell: 0.2, arp: 1, scale: [0, 3, 5, 7, 10] },
        hymn:     { bpm: 44, beats: 4, root: 46, prog: [[0, [0, 4, 7]], [5, [0, 4, 7]], [7, [0, 4, 7]], [0, [0, 4, 7]]],
                    pad: 1.7, drone: 0.5, kick: null, hat: 0, bell: 0.3, arp: 0, scale: [0, 2, 4, 7, 9] },
        carnival: { bpm: 112, beats: 3, root: 47, prog: [[0, [0, 4, 7]], [5, [0, 4, 7]], [7, [0, 4, 7]], [0, [0, 3, 7]]],
                    pad: 0.5, drone: 0.7, kick: [1,0,0,0, 0,0,0,0, 0,0,0,0], hat: 0.6, bell: 1, arp: 1, scale: [0, 2, 4, 7, 9, 12] },
        death: { bpm: 40, beats: 4, root: 33, prog: [[0, [0, 3, 7]], [0, [0, 3, 6]], [-1, [0, 3, 7]], [0, [0, 3, 7]]],
                 pad: 0.6, drone: 1.2, kick: null, hat: 0, bell: 0.5, arp: 0, scale: [0, 3, 6, 7, 10] }
    };
    // the radio can replace the two "ambient" scenes with a chosen track
    const BGM_KEY = 'malicex_bgm';
    let track = 'auto';
    try { track = (typeof Store !== 'undefined' && Store.get(BGM_KEY)) || 'auto'; } catch (e) {}
    const resolve = name => (track !== 'auto' && SCENES[track] && (name === 'menu' || name === 'fight')) ? track : name;
    const S = { logical: 'off', scene: 'off', phase: 'shoot', stage: 0, sanity: 100, hpFrac: 1, dFrac: 1, lowHp: false, bar: 0, timer: null,
                next: 0, sceneGain: null, seed: 9091 };
    const rand = () => { S.seed = (S.seed * 1664525 + 1013904223) >>> 0; return S.seed / 4294967296; };
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
    const intensity = () => clamp(0.25 + 0.5 * (1 - S.hpFrac) + 0.25 * (1 - S.dFrac) + S.stage * 0.06, 0, 1);

    function osc(ac, out, type, f, t0, dur, vol, attack, detune, lpf) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = type; o.frequency.value = f; if (detune) o.detune.value = detune;
        const a = Math.min(attack, dur * 0.5);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + a);
        g.gain.setValueAtTime(vol, t0 + Math.max(a, dur - 0.35));
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        let n = o;
        if (lpf) { const f2 = ac.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lpf; o.connect(f2); n = f2; }
        n.connect(g); g.connect(out);
        o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function ping(ac, out, send, f, t0, dur, vol) {
        [[1, 1], [2.76, 0.45], [5.4, 0.2]].forEach(([r, a]) => {
            const o = ac.createOscillator(), g = ac.createGain();
            o.type = 'sine'; o.frequency.value = f * r;
            g.gain.setValueAtTime(0.0001, t0);
            g.gain.linearRampToValueAtTime(vol * a, t0 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
            o.connect(g); g.connect(out); if (send) g.connect(send);
            o.start(t0); o.stop(t0 + dur + 0.05);
        });
    }
    function kick(ac, out, t0, vol) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.2);
        g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
        o.connect(g); g.connect(out); o.start(t0); o.stop(t0 + 0.32);
    }
    function hat(ac, out, noise, t0, vol) {
        const s = ac.createBufferSource(); s.buffer = noise;
        const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
        const g = ac.createGain();
        g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05);
        s.connect(f); f.connect(g); g.connect(out); s.start(t0, rand() * 1.5); s.stop(t0 + 0.07);
    }
    function swell(ac, out, noise, t0, dur, vol) {
        const s = ac.createBufferSource(); s.buffer = noise; s.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 5;
        f.frequency.setValueAtTime(400, t0); f.frequency.exponentialRampToValueAtTime(3000, t0 + dur);
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + dur * 0.9); g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
        s.connect(f); f.connect(g); g.connect(out); s.start(t0, rand()); s.stop(t0 + dur + 0.05);
    }

    // Schedules ONE bar at absolute time t0. Pure w.r.t. (ac, bus, params), so it can run offline.
    function scheduleBar(ac, bus, out, name, bar, P) {
        const sc = SCENES[name]; if (!sc) return 0;
        const beat = 60 / sc.bpm, barDur = beat * sc.beats, t0 = P.t0;
        const step = sc.prog[bar % sc.prog.length];
        const rootM = sc.root + step[0] + (name === 'fight' || name === 'boss' ? P.stage * 2 : 0) + (name === 'fight' || name === 'boss' ? 0 : 0);
        const chord = step[1];
        const inten = P.intensity, poker = P.phase === 'poker';
        const send = bus.fx;
        // pad
        chord.forEach((off, i) => {
            const f = midi(rootM + 12 + off);
            osc(ac, out, 'triangle', f, t0, barDur + 0.5, 0.045 * sc.pad, barDur * 0.4, i * 3 - 3, 900 + inten * 900);
            osc(ac, out, 'sine', f * 0.5, t0, barDur + 0.5, 0.05 * sc.pad, barDur * 0.5, 0);
            if (send && i === 0) osc(ac, send, 'sine', f * 2, t0, barDur, 0.015 * sc.pad, 0.3, 0);
        });
        // drone / bass
        osc(ac, out, 'sawtooth', midi(rootM - 12), t0, barDur + 0.3, 0.07 * sc.drone, 0.5, -4, 180 + inten * 160);
        osc(ac, out, 'sine', midi(rootM - 24), t0, barDur + 0.3, 0.12 * sc.drone, 0.3, 0);
        // eighth-note bass in boss fights during the shooting phase
        if (sc.bass8 && !poker) for (let i = 0; i < sc.beats * 2; i++) {
            if (i % 4 === 3 && (bar % 4) === 3) osc(ac, out, 'sawtooth', midi(rootM - 6), t0 + i * beat / 2, beat / 2, 0.06, 0.01, 0, 260);
            else osc(ac, out, 'sawtooth', midi(rootM - 12), t0 + i * beat / 2, beat / 2 * 0.9, 0.06, 0.01, 0, 220 + inten * 200);
        }
        // percussion
        if (sc.kick && !poker) {
            const sixteenth = beat / 4;
            sc.kick.forEach((k, i) => { if (k) kick(ac, out, t0 + i * sixteenth, 0.35 + inten * 0.3); });
            if (sc.hat) for (let i = 0; i < sc.beats * 2; i++) if (rand() < 0.55 + inten * 0.4) hat(ac, out, bus.noise, t0 + i * beat / 2 + beat / 4, 0.03 * sc.hat * (0.5 + inten));
        }
        if (poker && (name === 'fight' || name === 'boss')) {      // ticking clock while betting
            for (let i = 0; i < sc.beats; i++) {
                osc(ac, out, 'sine', 1400, t0 + i * beat, 0.04, 0.035, 0.002, 0);
                if (i % 2 === 0) osc(ac, out, 'sine', 700, t0 + i * beat + beat / 2, 0.05, 0.02, 0.002, 0);
            }
        }
        // arpeggio when things heat up
        if (sc.arp && inten > 0.5 && !poker) {
            const notes = chord.concat([chord[0] + 12]);
            for (let i = 0; i < sc.beats * 4; i++) {
                if (i % 2 && rand() < 0.35) continue;
                osc(ac, out, 'triangle', midi(rootM + 24 + notes[i % notes.length]), t0 + i * beat / 4, beat / 4, 0.022 * (inten - 0.3), 0.005, 0);
            }
        }
        // sparse bells
        if (rand() < sc.bell) {
            const n = sc.scale[Math.floor(rand() * sc.scale.length)] + 24 + (rand() < 0.3 ? 12 : 0);
            ping(ac, out, send, midi(sc.root + n), t0 + beat * Math.floor(rand() * sc.beats), 2.4, 0.05);
        }
        // sanity layer
        const sn = P.sanity;
        if (sn <= SANITY.UNEASY) {
            const lvl = sn <= SANITY.BROKEN ? 1 : (sn <= SANITY.FRACTURED ? 0.6 : 0.25);
            osc(ac, out, 'sine', 1900, t0, barDur, 0.012 * lvl * 2, 1.0, 0);
            osc(ac, out, 'sine', 1921, t0, barDur, 0.012 * lvl * 2, 1.0, 0);            // beating pair = ear whine
            if (sn <= SANITY.FRACTURED) osc(ac, out, 'sawtooth', midi(rootM + 13), t0, barDur, 0.03 * lvl, 0.6, 7, 500);  // minor-2nd smear
            if (sn <= SANITY.BROKEN) swell(ac, out, bus.noise, t0, barDur, 0.08);
        }
        // heartbeat at low HP
        if (P.lowHp) for (let i = 0; i < sc.beats; i++) {
            const tb = t0 + i * beat; kick(ac, out, tb, 0.5); kick(ac, out, tb + beat * 0.22, 0.32);
        }
        return barDur;
    }

    function ensureScene() {
        if (!audioCtx || !AudioBus.music) return;
        const ac = audioCtx;
        if (S.sceneGain) { const old = S.sceneGain; old.gain.cancelScheduledValues(ac.currentTime); old.gain.setTargetAtTime(0, ac.currentTime, 0.35); setTimeout(() => { try { old.disconnect(); } catch (e) {} }, 2500); }
        if (S.scene === 'off') { S.sceneGain = null; return; }
        S.sceneGain = ac.createGain(); S.sceneGain.gain.value = 0;
        S.sceneGain.gain.setTargetAtTime(1, ac.currentTime, 0.4);
        S.sceneGain.connect(AudioBus.music);
        S.next = ac.currentTime + 0.08; S.bar = 0;
    }
    function pump() {
        if (!audioCtx || S.scene === 'off' || !S.sceneGain) return;
        if (audioCtx.state !== 'running') return;
        const now = audioCtx.currentTime;
        if (S.next < now) S.next = now + 0.05;
        let guard = 0;
        while (S.next < now + 0.6 && guard++ < 4) {
            const d = scheduleBar(audioCtx, AudioBus, S.sceneGain, S.scene, S.bar, {
                t0: S.next, stage: S.stage, intensity: intensity(), phase: S.phase, sanity: S.sanity, lowHp: S.lowHp });
            S.next += d; S.bar++;
        }
    }
    function startTimer() { if (!S.timer) S.timer = setInterval(pump, 120); }

    return {
        scenes: SCENES, state: S,
        onContextReady() { ensureScene(); startTimer(); },
        setScene(name, opts) {
            opts = opts || {};
            const stage = opts.stage || 0;
            S.logical = name; name = resolve(name);
            if (name === S.scene && stage === S.stage && !opts.force) return;
            S.scene = SCENES[name] ? name : 'off'; S.stage = stage; S.phase = opts.phase || 'shoot';
            ensureScene(); startTimer(); pump();
        },
        setPhase(p) { S.phase = p; },
        getTrack() { return track; },
        setTrack(id) {
            track = (id === 'auto' || SCENES[id]) ? id : 'auto';
            try { Store.set(BGM_KEY, track); } catch (e) {}
            if (S.logical !== 'off') this.setScene(S.logical, { stage: S.stage, phase: S.phase, force: true });
        },
        setSanity(n) { S.sanity = n; },
        setVitals(hp, maxHp, dHp, maxDHp) {
            S.hpFrac = clamp(hp / Math.max(1, maxHp), 0, 1);
            S.dFrac = clamp(dHp / Math.max(1, maxDHp), 0, 1);
            S.lowHp = hp > 0 && (hp <= 1 || S.hpFrac <= 0.34);
        },
        stop() { S.scene = 'off'; ensureScene(); },
        // test hook: render N bars of a scene to an offline buffer and report loudness
        async renderTest(name, bars, params) {
            const sr = 22050, sc = SCENES[name], bd = 60 / sc.bpm * sc.beats;
            const ac = new OfflineAudioContext(1, Math.ceil(sr * (bd * bars + 1)), sr);
            const bus = buildAudioGraph(ac);
            bus.master.gain.value = 0.9; bus.music.gain.value = 0.55; bus.sfx.gain.value = 0.85;
            const out = ac.createGain(); out.connect(bus.music);
            for (let b = 0; b < bars; b++) scheduleBar(ac, bus, out, name, b, Object.assign({ t0: b * bd, stage: 0, intensity: 0.8, phase: 'shoot', sanity: 100, lowHp: false }, params || {}));
            const buf = await ac.startRendering();
            const d = buf.getChannelData(0); let sum = 0, peak = 0, nan = 0;
            for (let i = 0; i < d.length; i++) { const v = d[i]; if (v !== v) nan++; sum += v * v; if (Math.abs(v) > peak) peak = Math.abs(v); }
            return { rms: Math.sqrt(sum / d.length), peak, nan, seconds: d.length / sr };
        }
    };
})();

// per-item sound, played from useItem()
const ITEM_SFX = {
    GLASS: () => SFX.reveal(), KNIFE: () => SFX.knife(), BEER: () => SFX.eject(), CIGARETTES: () => SFX.heal(),
    HANDCUFFS: () => SFX.cuff(), INVERTER: () => SFX.glitch(), SEDATIVE: () => SFX.relief(), LUCKY_CHARM: () => SFX.chip(),
    TAROT: () => SFX.bell(), SHIELD: () => SFX.shield(), PHONE: () => SFX.click(), VOODOO: () => SFX.whisper(),
    BLUFF: () => SFX.raise(), PHANTOM: () => SFX.whisper()
};
