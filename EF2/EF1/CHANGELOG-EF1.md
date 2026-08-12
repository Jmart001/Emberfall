# Emberfall — EF1 version

This is an improved copy of the game (originally under `game-development/outputs/emberfall`). The original is left untouched for versioning; all changes here live in `EF1/`. Open `index.html` to play.

## What changed in EF1

**1. De-minified, readable source (behavior-preserving).**
The original code was minified onto a handful of enormous lines (`game.js` was one 14,500-character line). Every file was reformatted with Prettier — no logic changed, but the code is now readable and editable:

| File | Before | After |
|---|---|---|
| `js/game.js` | 99 lines | ~3,690 lines |
| `js/render.js` | 60 lines | ~1,880 lines |
| `js/data.js` | 63 lines | ~758 lines |
| `js/world.js` | 40 lines | ~223 lines |

This is the foundation that makes every other change (and all future work) actually maintainable.

**2. OSRS-style exponential XP curve.**
The old curve was flat (`level = 1 + floor(sqrt(xp/50))`), so early levels flew by and there was no endgame headroom across 20 skills. Replaced with the real Old School RuneScape curve (level 2 = 83 XP, level 10 = 1,154, level 50 = 101,333, level 99 = 13,034,431). Both the `level()` function and the skills-panel progress bars were updated consistently.

**3. Sound effects (new `js/sfx.js`).**
The game previously had no audio. Added a tiny, asset-free Web Audio module with blips for: level-up, combat hit/miss, mining, woodcutting, fishing, eating, and death. Press **K** to mute/unmute (persists across sessions). Sound is on by default.

**4. Isolated save slot.**
EF1 saves under its own `localStorage` key (`emberfall-ef1`) so this version doesn't collide with the original's save and the new XP curve applies to a fresh character.

**5. Trimmed assets.**
Only the assets the game actually loads were copied (`assets/maps/emberfall-playable-world.png` and `assets/textures/*-noise.png`). The ~40 MB `Design elements` reference-art folder and the ~9,000-file throwaway browser test profile were left out.

## Verified
- All JS passes `node --check` after formatting and edits.
- The XP table was validated against OSRS reference values and confirmed monotonic.
- (Not browser-tested here — no browser in the build environment. If anything errors on load, the console will point to it.)

## Suggested next steps (from the review, not yet done)
- Split `game.js` into ES modules (`state`, `world`, `combat`, `skills`, `ui`).
- Replace the ~40 hand-written save-migration lines with a defaults deep-merge.
- Autotiling tileset renderer + lighting for a visual upgrade.
- Touch/mobile support and colorblind-safe markers.
- A few headless unit tests for the pure math (now possible with readable code).
