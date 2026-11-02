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
    const fails = results.filter(r => !r.ok);
    console.log(`[DMH self-test] ${results.length - fails.length}/${results.length} passed`, fails);
    return { passed: results.length - fails.length, total: results.length, fails };
}

window.dmhTest = runSelfTests;

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
