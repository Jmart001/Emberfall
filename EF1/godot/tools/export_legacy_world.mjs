import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(toolDir, "..", "..");
const worldSource = fs.readFileSync(path.join(projectDir, "js", "world.js"), "utf8");
const dataSource = fs.readFileSync(path.join(projectDir, "js", "data.js"), "utf8");
const mapMatch = worldSource.match(/const _MAP = '([^']+)'/);

if (!mapMatch) {
  throw new Error("Could not find _MAP in js/world.js");
}

const width = 192;
const height = 160;
const encoded = mapMatch[1];
if (encoded.length !== width * height) {
  throw new Error(`Expected ${width * height} tiles, found ${encoded.length}`);
}

const context = {};
vm.createContext(context);
vm.runInContext(
  `${dataSource};
globalThis.__NPCS = NPCS;
globalThis.__ITEMS = ITEMS;
globalThis.__SHOPS = SHOPS;
globalThis.__MONSTER_TYPES = MONSTER_TYPES;
globalThis.__MONSTER_SPAWNS = MONSTER_SPAWNS;
globalThis.__SKILL_DATA = {
  fish_spots: FISH_SPOTS,
  rocks: ROCKS,
  trees: TREES,
  hunt_spots: HUNT_SPOTS,
  farm_patches: FARM_PATCHES,
  fletching: FLETCH_RECIPES,
  herblore: HERB_RECIPES,
  crafting: CRAFT_RECIPES,
  smithing: RECIPES,
  stations: {
    anvil: FORGE,
    furnace: FURNACE,
    altar: ALTAR,
    workbench: WORKBENCH,
    cauldron: CAULDRON
  }
};`,
  context,
);
const npcs = JSON.parse(JSON.stringify(context.__NPCS));
const items = JSON.parse(JSON.stringify(context.__ITEMS));
const shops = JSON.parse(JSON.stringify(context.__SHOPS));
const monsterTypes = JSON.parse(JSON.stringify(context.__MONSTER_TYPES));
const monsterSpawns = JSON.parse(JSON.stringify(context.__MONSTER_SPAWNS));
const skillData = JSON.parse(JSON.stringify(context.__SKILL_DATA));
const editorMapPath = path.join(projectDir, "3dMap", "emberfall_map.json");
let elevation = Array.from({ length: height }, () => Array(width).fill(0));
if (fs.existsSync(editorMapPath)) {
  const editorMap = JSON.parse(fs.readFileSync(editorMapPath, "utf8"));
  if (
    Array.isArray(editorMap.elevation)
    && editorMap.elevation.length === height
    && editorMap.elevation.every((row) => Array.isArray(row) && row.length === width)
  ) {
    elevation = editorMap.elevation.map((row) =>
      row.map((value) => Math.max(-8, Math.min(20, Number.isInteger(value) ? value : 0)))
    );
  }
}

const output = {
  source: "js/world.js",
  width,
  height,
  tile_size_meters: 1.5,
  encoding: "0123456789abcde",
  terrain: encoded,
  elevation,
  elevation_step_meters: 0.25,
  walkable: [0, 1, 5, 8, 10, 11, 12, 13],
  player_spawn: { x: 174, y: 44 },
  initial_npcs: npcs,
  npcs,
  items,
  shops,
  monster_types: monsterTypes,
  monster_spawns: monsterSpawns,
  skill_data: skillData,
};

const outputPath = path.join(toolDir, "..", "data", "legacy_world.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Exported ${width}x${height} legacy world to ${outputPath}`);
