# MALICEX - VERSION M1

A CRT psychological-horror card game: poker decides who holds the advantage, a shotgun decides who lives.
Plain HTML/CSS/JS, no build step, no external requests (fonts, art and sound are all bundled or generated).

## Play
- **Single file:** open `malicex-M1.html` anywhere (works from `file://`, phones and iPad included).
- **GitHub Pages:** upload the flat build (everything in the repo root, `index.html` included), then Settings > Pages > `main` / root.
- **Locally:** open `index.html`.

## What is in M1
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
Enjoy your play!
