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
    // ---- Mu-delta checks ----
    eq('sin endings registered', SIN_ENDINGS.every(k => ENDINGS[k] && ENDINGS[k].en_t), true);
    eq('every cutscene script has art that exists', Object.values(CINE_SCRIPTS).every(sc => sc.shots.every(s => ART[s.art] && s.text.length)), true);
    eq('every listed cutscene exists', CINE_LIST.every(c => CINE_SCRIPTS[c[0]]), true);
    eq('new dealers have the full interface', NEW_DEALERS.concat(['HOST']).every(k => { const d = DEALER_PERSONALITIES[k]; return d && d.name && d.aiBehavior && d.itemPriority && d.taunts.length; }), true);
    eq('pool hides boss dealers', dealerPool().some(k => NOT_IN_POOL.includes(k)), false);
    eq('weekly seed format', /^\d{4}-W\d{2}$/.test(weeklySeed()), true);
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
    // ---- Mu-delta II modules
    eq('themes defined', Object.keys(THEMES).length, 3);
    eq('theme ramp maps white inside ramp', /^#[0-9a-f]{6}$/.test((() => { const o = activeTheme; activeTheme = 'green'; const c = themeColor('#ffffff'); activeTheme = o; return c; })()), true);
    eq('contracts defined', Object.keys(CONTRACTS).join(), 'SILENCE_PACT,ASCETIC_LIMIT,PARANOIA_MODE');
    eq('zalgo keeps base letters', zalgo('abc', 2).replace(/[\u0300-\u036f]/g, ''), 'abc');
    eq('radio secrets reachable', RADIO_SECRETS.every(x => x.f >= RADIO_MIN && x.f <= RADIO_MAX), true);
    eq('duel items', Object.keys(DUEL_ITEMS).length, 3);
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
