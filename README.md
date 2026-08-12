# Emberfall

An Old School RuneScape–inspired fantasy RPG. What began as a plain-HTML browser
prototype has grown into three connected layers: a **playable 2D web game**, a
**3D successor built in Godot**, and a **design corpus** that defines where the
project is headed.

> **The Bound Ember.** A living fire — the Emberfall — sleeps beneath the Ashen
> Barrow, bound by the Wardens of Ash behind three failing seals. You are the
> Wanderer: an ember-touched amnesiac who is not merely of the Warden bloodline,
> but the eighth Cinders Warden, slowly rebuilt by the lonely hearth-spirit that
> wants its tender returned. The campaign leads to one ending — **TEND**.

## ▶ Play

[![Play 3D in browser](https://img.shields.io/badge/Play%203D-in%20browser-e1b557?style=for-the-badge)](https://jmart001.github.io/Emberfall/)
[![Deploy status](https://github.com/Jmart001/Emberfall/actions/workflows/deploy-web.yml/badge.svg)](https://github.com/Jmart001/Emberfall/actions/workflows/deploy-web.yml)

- **3D game — in your browser (no install):** **[jmart001.github.io/Emberfall](https://jmart001.github.io/Emberfall/)** — the Greenrest 3D slice. _Goes live after the first GitHub Pages deploy succeeds._
- **2D game — no install:** clone or download the repo and open **`EF1/index.html`** in any browser.

---

## The three layers

### 1. `EF1/` — the 2D web prototype (playable now)

Vanilla HTML/CSS/JS, no framework and no build step. Open `EF1/index.html` in a
browser and play. This layer is the **content source of truth** for balance,
lore, and gameplay behavior.

- 20 trainable skills (combat, gathering, artisan) on the real OSRS XP curve
- Tile movement with A\* pathfinding; click to walk, click to interact
- Combat with weapon speeds, special attacks, prayers, and spells
- Smithing and monster drops feeding tiered gear, a mini-boss with a drop table
- Fast travel, a settings menu, item dropping, autosave
- Controls: **M** map · **G** wiki · **R** run · **H** home teleport · **K** sound · **Ctrl+S** save

Companion tools in the same folder:

- `EF1/wiki.html` — standalone game wiki (items, skills, monsters, and a Lore tab)
- `EF1/mapeditor.html` — visual map editor: paint terrain, drop prefab buildings
  (houses, a castle, a fountain), draw connected diagonal paths, and
  select / move / rotate regions **with their entities**. Exports a drop-in
  `world.js` plus entity data.

### 2. `EF1/godot/` — the 3D successor (in progress)

A Godot 4.7.1 (GDScript) project that renders the exact `192 × 160` terrain from
`EF1/js/world.js`, one logical tile per `1.5 m`. A **Greenrest vertical slice**
is working: elevated camera, click-to-move over a logical grid with A\*
pathfinding, buildings as placed entities with doorways, NPCs, enemies,
gathering, banking, and quests — backed by ~50 GDScript smoke tests.

```
# open the project
Godot_v4.7.1-stable_win64_console.exe --path EF1/godot --editor
# after changing the 2D map, regenerate the Godot terrain data
node EF1/tools/generate_world_structures.js
```

### 3. `EF1/design/` — the design corpus

`EF1/design/REVISED_FUTURE_STATE.md` is the authoritative plan: a single-player
3D RPG with seven handcrafted regions, sixteen main quests, four raids, and one
canonical ending. Alongside it, a concept archive holds the full world bible,
questlines, raid designs, and NPC/item catalogs.

---

## How the layers connect

```
map editor  ─►  EF1/js/world.js  ─►  generate_world_structures.js  ─►  world_structures.js + 3dMap/  ─►  Godot 3D build
 (author)         (2D game map)          (export pipeline)               (bridge data)                    (3D render)
```

Edit the world in the 2D map editor; the same terrain drives both the browser
game and the Godot scene.

## Repository layout

| Path | What it is |
|---|---|
| `EF1/` | **Current project** — the 2D web game, tools, Godot build, and design docs |
| `EF1/index.html`, `EF1/js/`, `EF1/css/` | The playable 2D game |
| `EF1/mapeditor.html`, `EF1/wiki.html` | Map editor and game wiki |
| `EF1/godot/` | The Godot 4.7.1 3D project (source in `scenes/`, `scripts/`, `tests/`) |
| `EF1/design/` | World bible, questlines, raids, and the revised future-state plan |
| `EF1/3dMap/`, `EF1/js/world_structures.js` | Exported bridge data for the 3D build |
| root-level (`heartwood*.html`, `EF2/`, `World_7-19/`, `*.png`, `*.glb`, …) | Earlier experiments and reference art, kept for history |

> Regenerable Godot import caches (`.godot/`), local editor profiles, and the
> `EF1_BACKUP-7-26/` duplicate are intentionally excluded via `.gitignore`.

## Tech

- **2D game:** HTML5 Canvas, plain JavaScript (classic scripts sharing globals), no build step
- **3D game:** Godot 4.7.1, GDScript, compatibility renderer (Windows + Web targets)
- **Tooling:** Node.js scripts for world export/validation
