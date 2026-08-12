# Emberfall — Seamless World Map Brief

Generate **one single top-down map image** matching `world_blueprint.png`. This becomes the whole playable world — no separate town/plains, no transitions. I'll drop it into the game, derive the tile grid from it, auto-detect water, and author collision + monster spawns + interactions on top.

## Technical requirements (so it works as a game map)

- **One PNG, top-down orthographic** — camera looking straight down (no perspective/tilt), same as the Heartwood Town / Plains mockups.
- **Pixel-art RPG style**, matching the Heartwood mockups exactly (same tileset feel, lighting, saturation).
- **Grid: 80 × 60 tiles**, so aspect ratio **4:3**. Generate at the **largest resolution your tool allows** at 4:3 (e.g., 2560×1920). Keep tiles a consistent size across the whole map.
- **No text, labels, legend, compass, or minimap** drawn on the playable area — the blueprint's labels/lines are just guides, not art. A clean map only.
- **Strong contrast between walkable and blocked** so collision reads cleanly:
  - *Walkable:* grass, dirt roads/paths, building floors, sand, bridges.
  - *Blocked:* water, dense tree clusters, rock/cliffs, walls, lava.
- **Buildings drawn open-topped with visible interiors and a clear door** (exactly like the mockups — you see the shop counters/furniture inside and walk in through the door).
- **Seamless framing** — forest/rock border around the edges so the world feels enclosed.

## Layout (match the blueprint grid; coordinates are tiles, 0–80 across, 0–60 down)

**Heartwood Town — center hub (cols 30–46, rows 24–38). Safe.**
The six buildings from your Town mockup: General Store, Blacksmith (with forge), Bank, Inn, Wanderer's Shop, Guide — arranged around a central **fountain plaza** with cobblestone paths, lamp posts, benches.

**Wildmeadow — east, LARGE & OPEN (cols 47–74, rows 16–46). Rats & goblins.**
Wide rolling grassland — this is the main early combat/leveling zone, so keep it **mostly open, walkable space** with only *sparse* scattered trees, rocks, flowers, a stump or broken cart here and there, and one **small pond** (~col 58, row 26). Lots of room for monsters to roam. Do **not** fill it with dense forest.

**Old Crypt — northeast (cols 58–76, rows 4–16). Skeletons & dark wizards.**
Darker, desaturated ground; scattered **gravestones**, dead/bare trees, a stone **tomb/crypt entrance**, low fog. Open enough to fight in.

**Dragon's Lair — southeast (cols 56–76, rows 47–57). Demons & a green dragon.**
Scorched/volcanic terrain — cracked earth with **lava seams**, jagged black rocks, a **cave mouth**. Menacing but with open ground to move.

**Plains / skilling belt — west & south:**
- **Farm** (cols 14–24, rows 30–39): fenced crop rows, a scarecrow.
- **Wheat Field** (cols 22–31, rows 42–50): tall golden wheat, fenced.
- **Miller** (cols 24–32, rows 12–19): a **windmill** and grain sacks.
- **Fishing Lake** (SW, centered ~col 14, row 49): a large lake with a **wooden fishing dock**.

**Water:** a **river** winding from the northwest (~col 20, row 4) diagonally to the southeast, ending in a small **waterfall/pool** near the lair. Add **1–2 wooden bridges** where roads cross it so the map stays traversable. Water is impassable except bridges.

**Roads:** dirt paths connecting the town to every region (town↔meadow east, town↔farm/plains west, meadow↔crypt northeast, meadow↔lair southeast, town↔miller north, farm↔lake southwest), as drawn on the blueprint.

## Suggested prompt seed

> Top-down orthographic 2D pixel-art RPG world map, single seamless image, 4:3. Central medieval town with fountain plaza and open-topped buildings (shops, bank, blacksmith, inn), surrounded by a large open grassy meadow to the east, a dark graveyard/crypt in the northeast, a volcanic lava lair in the southeast, farms/wheat fields/a windmill and a fishing lake with a dock to the west, a winding river with wooden bridges, dirt roads connecting everything, dense forest framing the edges. Stardew/RuneScape tileset feel, vibrant, clean, no text or labels.

## What happens next

Drop the finished image in this folder (e.g. `assets_world.png`) and I'll: derive the 80×60 grid, auto-detect the water, author building/wall/obstacle collision, place the tile A* pathfinding, spawn **rats & goblins in the Wildmeadow** (skeletons/wizards in the crypt, demons/dragon in the lair), and wire the shops, bank, and gathering — one seamless world, verified with render overlays like we did for the town.
