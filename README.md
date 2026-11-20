# gta6-cover-art

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/lively-raven-87/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/lively-raven-87/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Lab** — a web app that turns your own photos and a caption into a GTA-style multi-panel poster. It runs entirely offline in a desktop browser: no account, no upload, your photos never leave your machine.

## What it makes

- **Multi-panel posters** — 2 photos in a diagonal split, 3 with a hero panel beside a stacked pair, or 4 in a grid. Every panel takes its own photo, and each one can be cropped with zoom and pan.
- **Bold caption lettering** — a slanted, outlined title with a sunset gradient and a neon shadow, plus a subtitle pill, in the genre's poster style.
- **Vice City colour grades** — Sunset (orange to magenta), Neon (cyan to magenta) or Noir, with a sun glow and a darkened foot so the lettering always reads.
- **One-click export** — all four common post sizes at once: 1080×1080, 1080×1350, 1080×1920 and 1920×1080, as PNG files.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Pick a photo per panel (or try the two built-in samples), type your caption, choose a grade and a size, and hit **Export all 4 sizes**. The preview on the right is exactly what the PNG gets.

## Screenshots

Four screenshots live in `screenshots/`: the square cover first, then the editor with photos loaded, the story-size cover, and the wide cover — each taken from the app itself with `?shot=` scenes (see `shots.json`).

## How it is built

Plain static files under `app/` — `index.html`, `style.css` and three plain scripts (`src/poster.js` paints the poster, `src/main.js` wires the editor, `src/shots.js` sets up the fixed screenshot scenes). No library, no build step, no network request, and no server needed: `index.html` opens straight from its files as well as from `node serve.ts`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=200tdmdd&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>
