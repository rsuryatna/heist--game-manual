# VELVET VAULT — a stealth heist

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/rsuryatna/heist--game-manual/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/rsuryatna/heist--game-manual/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down stealth heist game for the [make.fun "Make the best heist game" bounty](https://make.fun/bounty/best-heist-game-20261122-0559). The Marlowe Gallery, after dark: sneak past the guards and their vision cones, dodge the sweeping cameras, steal the Crimson Star, and slip out the exit — before the alarm hits lockdown.

## Play

Open `game/index.html` in desktop Chrome (no build step, no network — every file is local). Or serve it: `node serve.ts`, then open http://localhost:8080.

- **WASD / arrows** — move. **Shift** — sneak (slower, harder to spot).
- **E (hold)** — grab loot, pick the vault lock.
- **1 or click** — throw a coin: the nearest guard walks over to investigate.
- **2** — drop a smoke bomb: blocks vision cones for a few seconds.
- **3** — loop the cameras: every camera goes blind for 8 seconds.
- **P / Esc** — pause. **R** — restart.

Three ways into the vault room: the main doors (watched), the vent (left, narrow, unwatched) and the garden arch (right, watched by a camera only). Grab the Star, then reach the green EXIT. Score is loot plus a bonus for a low alarm and a fast escape.

## Files

- `game/index.html` — the page and canvas.
- `game/src/config.js` — every tuning number and colour.
- `game/src/levels.js` — the gallery: rooms, walls, patrols, cameras, loot.
- `game/src/world.js` — the simulation: movement, cones, suspicion, alarm, tools, win/lose.
- `game/src/render.js` — the canvas renderer: raycast vision cones, HUD, screens.
- `game/src/input.js` — keyboard and mouse.
- `game/src/shots.js` — the four staged screenshot scenes.
- `game/src/main.js` — boot and the fixed-step loop.
- `game/src/random.js` — a seeded RNG (deterministic for a given seed).
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`.
- `screenshots/` — 1-cover, 2-stealth, 3-vault, 4-getaway (1280×720, real gameplay frames).

## License

MIT — see [LICENSE](LICENSE).
