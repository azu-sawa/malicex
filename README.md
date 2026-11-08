# MALICEX - VERSION Μδ (Mu-delta)

A CRT psychological-horror card game: poker decides who holds the advantage, a shotgun decides who lives.
Plain HTML/CSS/JS, no build step, no external requests (fonts, art and sound are all bundled or generated).

## Play
- **Single file:** open `malicex-Mu-delta.html` anywhere (works from `file://`, phones and iPad included).
- **GitHub Pages:** upload the flat build (everything in the repo root, `index.html` included), then Settings > Pages > `main` / root.
- **Locally:** open `index.html`.

## Mu-delta II (modules)
- **Hallucinations** (Sanity 25 or lower): Zalgo item text, +-2px card jitter, phantom items in empty slots (15% per turn; click = hollow sound, -2 Sanity for 20 s), 5% false "Opponent aims at YOU..." flicker. All of it clears above 25.
- **The Architect's Contracts** (PLAY tab): SILENCE PACT, ASCETIC LIMIT, PARANOIA MODE. +25% score each. Stored in localStorage (`malicex_architect`).
- **Radio** (SYSTEM tab): procedural static and a 64-108 MHz dial. Secret signals at 66.6, 94.4 and 103.6 MHz. Hold a lock for 2 s: lore page plus a small effect.
- **Screen colours** (SYSTEM tab): Cyan/Amber, Green Mono, Blood Amber. Remembered, applied before first paint.
- **QoL**: keys 1-6 items, SPACE shoot opponent, S shoot self, ESC pause. Item tooltips on hover or long-press. Master and effects volume. Double-tap guard, full cleanup of timers and audio when a run ends, 44px touch targets, pinch-zoom locked.

## Tarot Rework
- The random Tarot Deck is gone. 14 Major Arcana cards are **earned** by winning fights in certain ways (see ARCHIVE > The Arcana for each condition) and **played only in boss fights**, once per fight. A played card is spent.
- Cards change the fight: heal to full, swap HP, cut the dealer's HP in half, freeze the dealer for a round, turn live shells blank, and more. The strongest come from hard tables.
- Hard tables now pay more: cash multipliers per mode, Marks on every hard win.
- **Controls** (SYSTEM tab): every fight key can be rebound. Defaults: 1-6 items, SPACE shoot dealer / next, S shoot self, T arcana, L lift, B raise, F fold, D redraw, C cheat, ESC pause.

## What is new in Mu-delta
- **Sins that matter:** the Thief lifts items off the dealer (LIFT button, pickpocket on poker wins). The Parricide builds Wrath from wounds and has Blood Bound. Each has a secret ending (THE HEIST, THE INHERITANCE) with its own cutscene. Switch sin in the lobby.
- **15 pixel cutscenes** (replayable in Archive > Cinema), memory flashes mid-run, fight cards, a CRT power-off death.
- **The house learns you:** it reads your habits and arms the dealer against them. At low Sanity item text and shell numbers can lie (the shell icons never do).
- **New dealers:** The Collector, The Confessor, The Clockwork. **Act II: THE UNDERSIDE** (after the true ending), with The Host. **Weekly seed.**
- **Terms** (side bets), **Marks and perks**, collection page, hall of hands, share card.
- **Difficulty pass:** bosses fight in phases (Shield at the start, heal and rearm at half HP, doubled shot at a quarter). The house adapts if you stall. Gauntlet wounds carry over unless you were careful. Dealers counter the item you leaned on. Ascension 1-5 is much harder. Paper Skin now caps you at 3 HP and leaves the dealer his normal HP.
- **Permanent sin and CRT screen:** you choose your sin once and it stays until you erase your save. The whole game now has curved glass, scanlines, a phosphor mask and a rolling bar (toggle in SYSTEM).
- **Quality of life:** FAST HANDS, LARGE TEXT, SHELL LETTERS, in-game self-test, installable offline app (https only).

## What was in M1
- 6-page tutorial plus coach marks on your first hand
- Item info strip: tap an item to read it, tap again to use it
- CRT pixel pointer (toggle in SYSTEM), touch-first controls, haptics, Low Effects mode
- Lobby with four tabs: PLAY / ARCHIVE / UNDER / SYSTEM, and a one-tap ONE MORE HAND
- Daily contracts, win streak bonus, run score and grade, item codex
- 40+ trophies with hints, 32 lore pages, and a true ending (THE LAST TABLE)
- Psychological layer: the house learns your name, the clock and your history; low Sanity corrupts the lobby and trails a ghost pointer
- Saves to localStorage with a memory fallback; export / import save codes in SYSTEM

## Layout (split build)
`index.html`, `css/` (style.css, tailwind.css prebuilt), `fonts/`, `js/*.js` (classic scripts, load order set in index.html).
If you edit classes in the HTML or JS, rebuild Tailwind: `npx tailwindcss -c tailwind.config.js -i src/tailwind.css -o css/tailwind.css --minify`.

Self-test: open `index.html?test` and check the console (38 checks).


## Md4 (touch + compact lobby)
- 1v1 now uses the same layout as the main fight (HP blocks, shell chamber, item row, big buttons). The player whose turn it is always sits at the bottom; the pass-the-device cover is unchanged.
- Architect's Contracts panel rebuilt (it rendered as run-together text); buttons lock during a run.
- Lobby boxes fold (tap a title). Fold state is remembered; most start folded.
- PAPER SKIN now pays +60% cash.
- Theme changes cross-fade instead of snapping; bezel, vignette and borders follow the theme.
- Hints rewritten to be subtler but more useful.
- Touch scrolling: lobby, fight screen (when the screen is short) and 1v1 all scroll by finger on iPad and phones.


## Md5 - THE HOUSE
- **The House**: a walkable pixel-art house (PLAY tab). Hall, Arcade, Dealers' Row, and a Cellar (needs the Brass Key). Arrows/WASD + E/Space, or D-pad + A on touch, or tap the floor to walk. Talk to every dealer: more of what they know unlocks after you beat them, and some lines are real tips. The room darkens as Sanity falls, and at 25 or less something stands in the hall.
- **Radio changes the BGM**: seven stations on the dial (Tape FM, Music Box, Dead Air, plus Pulse, Hymn, Carnival with the Night Tuner). The Arcade jukebox cycles them too.
- **Black Market**: price/button clipping bug fixed. New CASH tab items (Cuff Pack, Saw Pack, Lucky Pair, Bluff Kit, Gold Tooth, Steady Hands) and a new MARKS tab (Care Package, Dead Drop, Sealed Card, Night Tuner, Brass Key, Black Card).
- **Minigame cutscenes**: first sit-down at Blackjack, Slots, Cups and Hi-Lo, plus a jackpot scene and a "going broke" scene. All replayable from CINEMA.

## Md6 - THE HOUSE II
- The house is now five-plus rooms that scroll: Hall, Arcade, Dealers' Row, Library, Cellar (Brass Key), and a Wrong Room that only exists when your Sanity is low (or after the piano's wrong tune).
- Touch: drag anywhere on the room to walk (floating stick), tap a thing to use it, tap the floor to walk there. The D-pad is optional (PAD toggle); only a faint A button floats over the view. The view grows taller on phones.
- Things to do: Workbench (craft from scraps you find: Sanity Lamp, Copper Charm, Starter Kit, Black Candle, all feed the NEXT run), Oracle (daily fortune), Chore Board (4 daily chores, paid), vending machine, claw machine, piano (lullaby heals), fireplace, six lore notes, a cat, daily coins and scraps.
- Horror: faces in the windows, a figure that follows you at low Sanity, blackouts, corrupted dialogue, a different 3 AM house, a hall that loops, the other mirror.
- Music per room, and casino music for the side games. Themes now change the real background. Shop descriptions are larger.
- Device pass: checked 12 screen sizes (320x568 up to 1920x1080, portrait and landscape phones, iPad both ways). No horizontal overflow on the lobby, market, side games, 1v1, house, fight or pause. Narrow screens get compact header, sticky tabs, wrapped game buttons, and a pop-up that fits.
- Themes rebuilt: no more single-colour wash. Each theme (Forest, Blood, Void, Dust) keeps full-colour sprites and neutral readable text; only background, surfaces and accents change, like the cyan default. Theme choice applies before first paint for all four.
- House rooms compacted (about 18-28 tiles wide), closer view on phones. New House horror: a telephone that rings at low Sanity (answering costs Sanity, pays a film reel), a doll that creeps closer every time you re-enter the Hall, your name scrawled on the cellar wall, whispers and a heartbeat that is not yours.
- Interface: readable text on bright buttons in every theme, one-line version label, the floating sound button hides in the lobby and house on small screens.

## Md7 - THE TENANTS
- **The House is home.** The game opens in THE STUDY. The computer on the desk is the old CRT menu: press it to sit down at the table. SKIP (top left of the House) goes straight to the menu. SYSTEM has a START IN: THE HOUSE / THE MENU switch.
- **Tenants.** Every dealer you beat moves in (an armchair and a prop in their room, a marker above their head). Talk to one once a day for a favour that feeds your next run (Sanity, cash, a pay boost; capped). Ignore one for 3 days and they turn restless: pay $80 rent, or FACE them (-8 Sanity, +15% pay). Restless tenants walk the Hall at night and leak into your runs. The photo in the Study is the LODGERS list.
- **Day / night.** Real local time: DAY +5 Sanity, DUSK, NIGHT +25% pay but -8 Sanity, DAWN +3 Sanity at the start of a run. The House changes with it (window sky, tint, visitors, which events can happen). Win a run you started at night for NIGHT OWL. The lobby shows the phase and what is waiting for your next run.
- **More horror.** Random House events (flicker, knocking, doors that lock, the radio changing station, footsteps, your name, cold), a lamp that holds the House back for 90 seconds (burns a candle stub; L key or LAMP button), run intrusions (a word, a whisper, the shell count lying for a second, a blackout, a tenant speaking), and small lobby disturbances at night or low Sanity. Everything switches off with LOW EFFECTS.
- **Polish.** Dialogue sits above the on-screen buttons, narrow phones no longer clip the A button, interaction prompts name the thing you are about to use, four new trophies (LANDLORD, NIGHT OWL, ANSWERED, FIRST LIGHT) with hints.
- Self-test: 90 checks (`index.html?test`).

## Md8 - THE LONG NIGHT
- **The Long Night** (ring the bell in the Study, once a day): five minutes in the dark House. Tenants you beat hunt you room to room. Candles, salt and doors keep you alive, a caught player plays a short shell duel (THE CATCH) in the menu. Dawn pays cash, marks and sometimes a lore page. A night cut off by a closed tab is handed back.
- **THE WARD** (lobby): a psychological-horror mode with no shells. Six days in a bright ward. You see things by day, the nurse reads you the chart, and from day three the chart lies. GRIP is shown, TRUST and TRUTH are hidden. Four endings (door, discharged, broken), pills blur what you will have to remember.
- **House puzzles**: a safe, a music box, a four-portrait riddle, a three-pin lock.
- **Lore films**: every lore fragment now has a short cutscene, replayable from the Grimoire.
- **Shop + Marks shop**: candle box, lantern, felt soles, salt, earplugs, coffee, fragment finder, lockpicks, stethoscope; second night, hunter's map, last candle, tenant's deed, last rites, lost page, nurse's key.
- **Save system v2**: checksummed envelope, schema migrations, two rotating backups plus a backup at every run start, a damaged save is kept (never deleted) and the game falls back to a backup, other-tab guard, flush on tab hide, quota handling, gear returned after a cut-off run, export as short compressed code or .json file with settings included, backup list with restore, import preview.
- 1v1 mode removed. Object names in the House are real text now, not scaled canvas pixels.

