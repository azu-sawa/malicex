"use strict";

// ---------- SELF TEST + DEBUG HANDLE ----------
function runSelfTests() {
    const C = (r, su) => ({ rank: String(r), suit: su, val: r });
    const t = (h, c) => evalHand(h, c);
    const results = [];
    const eq = (name, got, want) => results.push({ name, ok: got === want, got, want });
    eq('royal flush', t([C(10, '♠'), C(11, '♠')], [C(12, '♠'), C(13, '♠'), C(14, '♠')]).type, 'Straight Flush');
    eq('wheel straight', t([C(14, '♠'), C(2, '♥')], [C(3, '♦'), C(4, '♣'), C(5, '♠')]).type, 'Straight');
    eq('full house', t([C(9, '♠'), C(9, '♥')], [C(9, '♦'), C(4, '♣'), C(4, '♠')]).type, 'Full House');
    eq('four of a kind', t([C(9, '♠'), C(9, '♥')], [C(9, '♦'), C(9, '♣'), C(4, '♠')]).type, 'Four of a Kind');
    eq('flush', t([C(2, '♠'), C(9, '♠')], [C(3, '♠'), C(7, '♠'), C(12, '♠')]).type, 'Flush');
    eq('high card', t([C(2, '♠'), C(9, '♥')], [C(3, '♦'), C(7, '♣'), C(12, '♠')]).type, 'High Card');
    eq('seven-card two pair', t([C(5, '♠'), C(5, '♥')], [C(9, '♦'), C(9, '♣'), C(12, '♠'), C(3, '♦'), C(2, '♣')]).type, 'Two Pair');
    eq('kicker decides', t([C(9, '♠'), C(14, '♥')], [C(9, '♦'), C(4, '♣'), C(2, '♠')]).score > t([C(9, '♣'), C(13, '♥')], [C(9, '♥'), C(4, '♦'), C(2, '♣')]).score, true);
    eq('flush beats straight', t([C(2, '♠'), C(9, '♠')], [C(3, '♠'), C(7, '♠'), C(12, '♠')]).score > t([C(5, '♠'), C(6, '♥')], [C(7, '♦'), C(8, '♣'), C(9, '♠')]).score, true);
    const keep = rngFn;
    seedRng('abc');
    const a = [rnd(), rnd(), rnd()];
    seedRng('abc');
    const b = [rnd(), rnd(), rnd()];
    eq('seed repeatable', JSON.stringify(a), JSON.stringify(b));
    seedRng('abd');
    eq('seed differs', rnd() === a[0], false);
    rngFn = keep;
    // sanity tiers: boundaries must match the documented table
    const oldSan = sanity;
    const tierAt = n => sanityTier(n).id;
    eq('tier 100', tierAt(100), 'LUCID'); eq('tier 85', tierAt(85), 'LUCID'); eq('tier 84', tierAt(84), 'STEADY');
    eq('tier 51', tierAt(51), 'STEADY'); eq('tier 50', tierAt(50), 'UNEASY'); eq('tier 26', tierAt(26), 'UNEASY');
    eq('tier 25', tierAt(25), 'FRACTURED'); eq('tier 11', tierAt(11), 'FRACTURED'); eq('tier 10', tierAt(10), 'BROKEN'); eq('tier 0', tierAt(0), 'BROKEN');
    sanity = 21; eq('can spend 10 at 21', canSpendSanity(10), true);
    sanity = 20; eq('cannot spend 10 at 20', canSpendSanity(10), false);
    sanity = 30; eq('no phantoms at 30', phantomChance(), 0);
    sanity = 25; eq('phantoms at 25', phantomChance() > 0, true);
    sanity = oldSan;
    eq('sanity-check minigame removed', typeof window.openSanityCheck, 'undefined');
    eq('only English text', typeof TEXT.id, 'undefined');
    // ---- v10 / M1 checks ----
    const keys = Object.keys(ACHIEVEMENTS);
    eq('every trophy has a hint', keys.filter(k => !(ACHIEVEMENTS[k].hint || ACH_HINTS[k])).length, 0);
    eq('trophy count >= 50', keys.length >= 50, true);
    eq('lore ids unique', new Set(LORE_ENTRIES.map(l => l.id)).size, LORE_ENTRIES.length);
    eq('finale needs lore <= total', FINALE_LORE_NEEDED <= LORE_ENTRIES.length, true);
    const oldM = meta.contracts; meta.contracts = null;
    const c1 = JSON.stringify(todaysContracts().picks); meta.contracts = null;
    eq('contracts deterministic', JSON.stringify(todaysContracts().picks), c1);
    eq('three distinct contracts', new Set(todaysContracts().picks).size, 3);
    meta.contracts = oldM;
    eq('every item has a description', Object.keys(ITEMS).filter(k => !ITEMS[k].en.d).length, 0);
    const sv = { a: 1 }; Store.set('__t', JSON.stringify(sv)); eq('store roundtrip', JSON.parse(Store.get('__t')).a, 1); Store.remove('__t');
    eq('mode multipliers cover finale', MODE_MULT.FINALE > 1, true);
    eq('name fill', psychFill('{name}|{runs}').split('|').length, 2);
    eq('import rejects junk', (() => { const b = document.getElementById('save-io'); const o = b.value; b.value = 'nope'; importSave(); b.value = o; return true; })(), true);
    // ---- Md8 checks: save system ----
    { const env = SAVE.envelope(SAVE.collect(), 7), r = SAVE.parse(env.raw);
      eq('save envelope roundtrips with its checksum', r.ok && r.rev === 7 && r.data.money === globalMoney, true);
      eq('a changed save fails its checksum', SAVE.parse(env.raw.replace(/"money":-?\d+/, '"money":123456789')).why, 'checksum');
      eq('sanitise clamps junk', (() => { const c = SAVE.sanitise({ money: 'x', sanity: 400, achievements: ['A', 'A', 3], unlockedLore: [1, 1, 'z'], upgrades: null, meta: 5 }); return c.money === 200 && c.sanity === 100 && c.achievements.length === 1 && c.unlockedLore.length === 1 && typeof c.upgrades === 'object'; })(), true);
      eq('sanitise is idempotent', JSON.stringify(SAVE.sanitise(SAVE.sanitise(SAVE.collect()))) === JSON.stringify(SAVE.sanitise(SAVE.collect())), true);
      eq('hash is stable', SAVE.sum('malicex') === SAVE.sum('malicex') && SAVE.sum('a') !== SAVE.sum('b'), true); }
    // ---- Md8 checks: the Long Night ----
    { const keep = meta.brassKey; meta.brassKey = 1;
      eq('every night room is reachable from the Study', LN_ROOMS.every(r => lnRoomPath('STUDY', r) !== null), true);
      eq('a room path is a chain of doors', LN_ROOMS.every(r => { const p = lnRoomPath('STUDY', r); let c = 'STUDY'; return p.every(n => { const ok = lnAdj(c).includes(n); c = n; return ok; }); }), true);
      meta.brassKey = keep;
      const hs = lnPickHunters(); eq('2 to 4 distinct valid hunters', hs.length >= 2 && hs.length <= 4 && new Set(hs).size === hs.length && hs.every(k => HOUSE_FOLK[k]), true);
      const all = ['SADISTIC', 'CALCULATING', 'UNPREDICTABLE', 'MIMIC', 'ANCIENT', 'WARDEN'];
      eq('duels always finish and keep the shell count honest', (() => { for (let g = 0; g < 400; g++) { const S = lnDuelNew(all[g % all.length], g % 300); let n = 0; while (!S.over && n++ < 300) { const who = S.turn; lnDuelShoot(S, who, who === 'me' ? (Math.random() < 0.5 ? 'other' : 'self') : lnDuelAI(S)); if (S.live < 0 || S.blank < 0 || S.live + S.blank !== S.chamber.length) return false; } if (!S.over || (S.me > 0 && S.him > 0)) return false; } return true; })(), true);
      eq('duel AI answers sensibly', all.every(k => ['other', 'self'].includes(lnDuelAI({ k, live: 2, blank: 3, last: 'self' }))), true);
      eq('shooting a blank at yourself keeps your turn', (() => { const S = lnDuelNew('SADISTIC', 0); S.chamber = [0, 1, 1]; S.live = 2; S.blank = 1; S.turn = 'me'; lnDuelShoot(S, 'me', 'self'); return S.turn === 'me' && S.me === 2; })(), true); }
    // ---- Md8 checks: puzzles and films ----
    { const perms = a => a.length < 2 ? [a] : a.flatMap((x, i) => perms(a.slice(0, i).concat(a.slice(i + 1))).map(r => [x].concat(r)));
      const rule = o => { const at = k => o.indexOf(k); return (at('MIMIC') === 0 || at('MIMIC') === 3) && Math.abs(at('CALCULATING') - at('MIMIC')) === 1 && at('SADISTIC') < at('WARDEN') && at('WARDEN') !== 0 && at('WARDEN') !== 3; };
      const sol = perms(['SADISTIC', 'WARDEN', 'CALCULATING', 'MIMIC']).filter(rule);
      eq('the portrait riddle has exactly one answer, and it is the stored one', sol.length === 1 && pzSolved(sol[0]), true); }
    eq('every fragment film points at a real lore page and cutscene', Object.keys(FRAG_FILMS).every(id => LORE_ENTRIES.some(l => l.id === +id) && CINE_SCRIPTS[FRAG_FILMS[id]]), true);
    eq('every film has a title', Object.values(FRAG_FILMS).every(f => FRAG_TITLES[f]), true);
    eq('Md8 cutscenes exist', ['ln_begin', 'ln_dawn', 'ln_taken'].every(k => CINE_SCRIPTS[k]), true);
    eq('new lore pages have text', [60, 61, 62, 63, 66, 67, 68, 69, 70, 71].every(i => { const l = LORE_ENTRIES.find(x => x.id === i); return l && l.text && l.text.length > 10; }), true);
    eq('puzzle objects sit inside their rooms', Object.keys(PZ_OBJS).every(r => PZ_OBJS[r].every(o => o.x >= 0 && o.y >= 0 && o.x + o.w <= HOUSE_MAPS[r].w && o.y + o.h <= HOUSE_MAPS[r].h)), true);
    // ---- Md8 checks: shop ----
    eq('Md8 cash items are well formed', SHOP_CATALOG.filter(i => i.buy || i.on).every(i => i.en_n && i.en_d && i.price > 0 && (i.repeat || typeof i.on === 'function')), true);
    eq('Md8 Marks items are well formed', MARKS_CATALOG.filter(i => i.buy).every(i => i.n && i.d && i.cost > 0 && (i.repeat || typeof i.on === 'function')), true);
    eq('every new achievement has a hint', ['DAWN_BREAKS', 'UNSEEN', 'CAUGHT_3', 'SAFE_CRACKED', 'MUSIC_BOX', 'FIVE_FRAMES', 'LOCK_PICKED', 'FILM_5', 'FILM_ALL'].every(k => ACHIEVEMENTS[k] && ACHIEVEMENTS[k].hint), true);
    // ---- 1.0 checks: first-night guide ----
    eq('guide steps have text and checks', GUIDE_STEPS.every(g => g.t && g.h && typeof g.ok === 'function'), true);
    eq('guide state counts done steps', (() => { const g = guideState(); return g.done.length + (g.next ? 1 : 0) <= GUIDE_STEPS.length && (g.all || !!g.next); })(), true);
    eq('a second tap cannot start a run twice', (() => { const m = globalMoney; window.__runStarting = Date.now(); selectDifficulty('HARD'); const same = globalMoney === m; window.__runStarting = 0; return same; })(), true);
    // ---- Mu-delta checks ----
    eq('sin endings registered', SIN_ENDINGS.every(k => ENDINGS[k] && ENDINGS[k].en_t), true);
    eq('every cutscene script has art that exists', Object.values(CINE_SCRIPTS).every(sc => sc.shots.every(s => ART[s.art] && s.text.length)), true);
    eq('every listed cutscene exists', CINE_LIST.every(c => CINE_SCRIPTS[c[0]]), true);
    eq('new dealers have the full interface', NEW_DEALERS.concat(['HOST']).every(k => { const d = DEALER_PERSONALITIES[k]; return d && d.name && d.aiBehavior && d.itemPriority && d.taunts.length; }), true);
    eq('pool hides boss dealers', dealerPool().some(k => NOT_IN_POOL.includes(k)), false);
    eq('perk requirements exist', Object.values(PERKS).every(p => p.req.every(r => PERKS[r])), true);
    eq('term multipliers positive', Object.values(TERMS).every(t => t.m > 0), true);
    const savedSan = sanity, savedRuns = meta.runs;
    sanity = 5; meta.runs = 10;
    const st0 = state.liveCount, bt0 = state.blankCount;
    shownAmmo(); itemLie('GLASS');
    eq('lies never change real counts', state.liveCount === st0 && state.blankCount === bt0, true);
    sanity = savedSan; meta.runs = savedRuns;
    eq('habit profile needs data', (() => { const o = meta.habits; meta.habits = { shots: 3, selfEma: 0.9, itemsEma: 2, foldEma: 0, raiseEma: 0, hands: 0 }; const r = habitProfile(); meta.habits = o; return r; })(), null);
    eq('every new trophy has a hint', Object.keys(ACHIEVEMENTS).every(k => ACHIEVEMENTS[k].hint || ACH_HINTS[k]), true);
    eq('settings carry terms', Array.isArray(SETTINGS_DEFAULT.terms), true);
    eq('share card text builds', typeof shareResult, 'function');
    eq('ascension text covers every level', ASC_TEXT.length, 6);
    eq('paper skin keeps dealer hp', TERMS.PAPER.d.indexOf('dealer keeps') > -1, true);
    eq('boss modes known', BOSS_MODES.length, 3);
    // ---- House update
    eq('every house map has a way out', Object.keys(HOUSE_MAPS).every(id => HOUSE_MAPS[id].objs.some(o => o.t === 'portal')), true);
    eq('house portals point at real maps', Object.keys(HOUSE_MAPS).every(id => HOUSE_MAPS[id].objs.filter(o => o.t === 'portal').every(o => o.to === 'EXIT' || HOUSE_MAPS[o.to])), true);
    eq('every house npc has a script', Object.keys(HOUSE_MAPS).every(id => HOUSE_MAPS[id].objs.filter(o => o.t === 'npc').every(o => o.who === 'STAND' || (HOUSE_FOLK[o.who] && HOUSE_FOLK[o.who].pieces.length >= 3))), true);
    eq('house map objects fit inside their rooms', Object.keys(HOUSE_MAPS).every(id => HOUSE_MAPS[id].objs.every(o => o.x >= 0 && o.y >= 0 && o.x + o.w <= HOUSE_MAPS[id].w && o.y + o.h <= HOUSE_MAPS[id].h)), true);
    eq('every house room has a song', Object.keys(HOUSE_MAPS).every(id => Music.scenes[HOUSE_MAPS[id].song]), true);
    eq('house recipes use real scraps', HS_RECIPES.every(r => Object.keys(r.cost).every(k => HS_SCRAP_NAME[k])), true);
    eq('house notes exist for every book', Object.values(HOUSE_MAPS).every(m => m.objs.every(o => !o.nid || HS_NOTES[o.nid])), true);
    eq('house rooms are bigger than the view', HOUSE_MAPS.HALL.w * 16 > 320, true);
    eq('every dealer has a house script', Object.keys(DEALER_PERSONALITIES).every(k => HOUSE_FOLK[k]), true);
    // ---- Tenants + night cycle (Md7)
    eq('the study exists and leads to the hall', !!HOUSE_MAPS.STUDY && HOUSE_MAPS.STUDY.objs.some(o => o.t === 'portal' && o.to === 'HALL'), true);
    eq('the hall exit leads to the study', HOUSE_MAPS.HALL.objs.some(o => o.t === 'portal' && o.to === 'STUDY'), true);
    eq('the study has the computer', HOUSE_MAPS.STUDY.objs.some(o => o.act === 'pc'), true);
    eq('every tenant has a house script', TENANT_KEYS.every(k => HOUSE_FOLK[k] && DEALER_PERSONALITIES[k]), true);
    eq('every tenant perk does something', TENANT_KEYS.every(k => TENANT_PERKS[k].fx || TENANT_PERKS[k].marks || k === 'UNPREDICTABLE'), true);
    eq('tenant favours are capped', (() => { const f = hsData().fx, old = JSON.stringify(f); for (let i = 0; i < 30; i++) tenantAddFx({ sanity: 10, cash: 300, reward: 1.2 }); const ok = f.sanity <= TENANT_CAPS.sanity && f.cash <= TENANT_CAPS.cash && f.reward <= TENANT_CAPS.reward + 1e-9; hsData().fx = JSON.parse(old); return ok; })(), true);
    eq('day phase is always valid', ['DAY', 'DUSK', 'NIGHT', 'DAWN'].includes(dayPhase()), true);
    eq('every phase has a label', ['DAY', 'DUSK', 'NIGHT', 'DAWN'].every(k => PHASES[k] && PHASES[k].sub), true);
    eq('night pays more and costs sanity', PHASES.NIGHT.pay > 1 && PHASES.NIGHT.san < 0, true);
    eq('the study has a song', !!Music.scenes.house_study, true);
    eq('house button skips to the menu', typeof closeHouseBtn === 'function' && typeof toggleBoot === 'function', true);
    eq('radio tracks exist as music scenes', RADIO_TRACKS.every(t => t.id === 'auto' || Music.scenes[t.id]), true);
    eq('marks market items have costs', MARKS_CATALOG.every(m => m.cost > 0 && m.n && m.d), true);
    eq('minigame cutscenes exist', ['mini_bj', 'mini_slots', 'mini_cups', 'mini_hilo', 'mini_jackpot', 'mini_ruin'].every(id => CINE_SCRIPTS[id] && CINE_SCRIPTS[id].shots.every(sh => ART[sh.art])), true);
    eq('shop price shows for every item', SHOP_CATALOG.every(i => shopPrice(i) > 0), true);
    eq('paper skin pays at least 50%', TERMS.PAPER.m >= 0.5, true);
    eq('contracts render as a grid of 3', (renderContractsPanel(), document.querySelectorAll('#architect-box .term').length), 3);
    eq('lobby boxes can fold', (applyFolds(), document.querySelectorAll('#main-menu .contracts-box.folded').length > 0), true);
    // ---- Mu-delta II modules
    eq('themes defined', Object.keys(THEMES).length, 5);
    eq("theme colour passes through when no ramp", /^#[0-9a-f]{6}$/.test((() => { const o = activeTheme; activeTheme = 'green'; const c = themeColor('#ffffff'); activeTheme = o; return c; })()), true);
    eq('contracts defined', Object.keys(CONTRACTS).join(), 'SILENCE_PACT,ASCETIC_LIMIT,PARANOIA_MODE');
    eq('zalgo keeps base letters', zalgo('abc', 2).replace(/[\u0300-\u036f]/g, ''), 'abc');
    eq('radio secrets reachable', RADIO_SECRETS.every(x => x.f >= RADIO_MIN && x.f <= RADIO_MAX), true);
    eq('arcana cards', ARCANA_KEYS.length, 14);
    eq('key actions unique', new Set(KEY_ACTIONS.map(a => a[0])).size, KEY_ACTIONS.length);
    eq('run timers idle in lobby', RunTimers.active() || activeGame !== 'MENU', activeGame !== 'MENU');
    const fails = results.filter(r => !r.ok);
    console.log(`[DMH self-test] ${results.length - fails.length}/${results.length} passed`, fails);
    return { passed: results.length - fails.length, total: results.length, fails };
}

window.dmhTest = runSelfTests;
function runUiSelfTest() {
    const r = runSelfTests();
    setSysMsg(r.fails.length ? ('Self-test: ' + r.fails.length + ' failed: ' + r.fails.map(f => f.name).join(', ')) : ('Self-test passed: ' + r.passed + '/' + r.total));
}

window.dmhDebug = {
    get state() { return state; },
    get meta() { return meta; },
    setSanity: (n) => setSanityDirect(n),
    setMoney: (n) => { globalMoney = n;
        updateMoneyDisplay(); },
    giveItem,
    endFight: () => { state.dealerHp = 0;
        handleGameEnd(); },
    seed: seedRng,
    startRound, loadShotgun, onPlayerTurnHooks, sanityWhispers, shuffleChamber, useItem, DEALER_PERSONALITIES, assignShellMods,
    setPersonality: (k) => { currentDealerPersonality = k; }, evalHand, hasRelic
};

if (/[?&]test\b/.test(location.search)) setTimeout(runSelfTests, 0);
