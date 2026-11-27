# Gobble Dash — The Great Turkey Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/MARUGAMIII/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/MARUGAMIII/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is coming, and so is the farmer. **Gobble Dash** is a side-scrolling turkey escape game: run 1,500 metres from the farmyard, through the cornfield at sunset, and across the farmer's own kitchen — dodging fences, hay bales, ovens and swinging carving knives — while the farmer chases you with a pitchfork. Three hits and you are dinner. Reach the wild woods and you are free.

## How to play

- **Space / ↑ / click** — jump (press again mid-air for a double jump)
- **↓ / S** — slide under low branches and beams
- **P** — pause, **M** — mute, **R** — run again after being caught or escaping
- Grab **corn** (+10), **pumpkin pie** (+50) and **golden feathers** (a shield that blocks one hit). Corn streaks push the farmer back.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network — the game is plain static files under `game/`, and all art and sound are drawn and synthesized in code.

## Screenshots

The four screenshots in `screenshots/` are real renders of the game, staged deterministically with `?shot=farm|kitchen|title|caught&seed=1` (see `shots.json` and `game/src/shots.js`).

---

<sub>Entered on [make.fun](https://make.fun/?ref=damar-anggara&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
