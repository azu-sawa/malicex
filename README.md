# MALICEX - VERSION Μδ (Mu-delta)

A CRT psychological-horror card game: poker decides who holds the advantage, a shotgun decides who lives.
Plain HTML/CSS/JS, no build step, no external requests (fonts, art and sound are all bundled or generated).

## Play
- **Single file:** open `malicex-Mu-delta.html` anywhere (works from `file://`, phones and iPad included).
- **GitHub Pages:** upload the flat build (everything in the repo root, `index.html` included), then Settings > Pages > `main` / root.
- **Locally:** open `index.html`.

## What is new in Mu-delta
- **Sins that matter:** the Thief lifts items off the dealer (LIFT button, pickpocket on poker wins). The Parricide builds Wrath from wounds and has Blood Bound. Each has a secret ending (THE HEIST, THE INHERITANCE) with its own cutscene. Switch sin in the lobby.
- **15 pixel cutscenes** (replayable in Archive > Cinema), memory flashes mid-run, fight cards, a CRT power-off death.
- **The house learns you:** it reads your habits and arms the dealer against them. At low Sanity item text and shell numbers can lie (the shell icons never do).
- **New dealers:** The Collector, The Confessor, The Clockwork. **Act II: THE UNDERSIDE** (after the true ending), with The Host. **Weekly seed.**
- **Terms** (side bets), **Marks and perks**, collection page, hall of hands, share card.
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
