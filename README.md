# Malicex

A browser horror card game: poker decides who holds the advantage, a shotgun decides who lives.
Plain HTML/CSS/JS, no build step, no audio files (all sound and music are generated with the Web Audio API).

## Play
- **GitHub Pages:** push this folder to a repo, then Settings > Pages > deploy from `main` / root.
- **Locally:** open `index.html` (works from `file://`).
- Tailwind and the two Google fonts load from CDNs, so you need to be online the first time.

## Project layout
```
index.html          markup only
css/style.css       all styles
js/                 classic scripts sharing one global scope, loaded in this order:
  rng.js            seeded RNG (rnd / seedRng / shuffle / dailySeed)
  state.js          global state, save keys, runtime variables
  audio.js          SFX + adaptive procedural BGM (Music.setScene / setPhase / setSanity / setVitals)
  sanity.js         the sanity system: tiers, effect helpers, UI, whispers, hallucinations
  util.js           ascLevel, hasRelic, rewardMult, small helpers
  data.js           items, shop catalogue, tarot, achievements, lore, cheat skills, UI text
  dialogue.js       dealer / player dialogue and horror word lists
  dealers.js        dealer personalities (incl. Mimic and Warden)
  combat.js         damage, round modifiers, shell types, main round loop, tension timer
  poker.js          staged poker, raise, redraw, fold, rewards
  items.js          item use + result screen
  ai.js             dealer turn logic
  render.js         HUD / card / ammo rendering
  effects.js        glitches, memory flashes, blood
  run.js            run summary + run start
  gauntlet.js       relics, events, pacts, gauntlet, ascension
  endings.js        four endings + lore tied to trophies
  save.js           localStorage save/load (+ migration from the old Dead Man's Hand key)
  shop.js           shop, money, daily login
  minigames.js      blackjack, slots, cups, hi-lo
  ui.js             menus, story, grimoire, achievements screen
  debug.js          self tests + window.dmhDebug
  main.js           keyboard, boot, window exports
```

## Sanity (0-100)
Single source of truth: `js/sanity.js`. Never compare `sanity` to a raw number elsewhere; use the helpers.

| Tier | Range | Effects |
|---|---|---|
| LUCID | 85-100 | The first shell of every load is revealed |
| STEADY | 51-84 | None |
| UNEASY | 26-50 | Whispers, hallucinations, the dealer's poker tell lies 40% of the time |
| FRACTURED | 11-25 | Phantom items, the Glass lies 35%, a Voice gives an unreliable hint (30%/turn) |
| BROKEN | 0-10 | Voice 60% and a coin flip, Raise/Redraw locked, MADNESS ending + INSANE trophy on a win |

Voluntary sanity spending (Raise -10, Redraw -8) can never push you into BROKEN (`canSpendSanity`).

## Audio
`Music.setScene('menu' | 'fight' | 'boss' | 'win' | 'death' | 'off')`. The mix reacts to HP (heartbeat), the poker/shoot phase (ticking clock),
the Gauntlet stage (key change) and sanity (ear whine, dissonance, noise swell). Controls: AUDIO, MUSIC, volume slider, and the speaker button bottom-left.
Preferences persist under `malicex_audio`.

## Testing
- `index.html?test` runs the self tests (hand evaluation, seeded RNG, sanity tier boundaries) and logs to the console; `dmhTest()` re-runs them.
- `index.html?seed=anything` makes a run reproducible.
- `window.dmhDebug` exposes state helpers (setSanity, endFight, useItem, ...).
