// Emberfall EF1 — world map (192 x 160). Rebuilt as one connected landmass of 7 themed regions.
// Tile legend: 0 grass 1 path 2 water 3 tree 4 wall 5 floor 6 counter 7 fence 8 fire 9 bank booth
//              10 marsh 11 dock 12 snow 13 ash 14 lava
const tiles = Array.from({ length: MAP_H }, () => Array(MAP_W).fill(0));
function rect(x, y, w, h, t) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) if (tiles[yy]?.[xx] !== undefined) tiles[yy][xx] = t;
}
function line(x1, y1, x2, y2, t, w = 1) {
  if (x1 === x2) rect(x1 - Math.floor(w / 2), Math.min(y1, y2), w, Math.abs(y2 - y1) + 1, t);
  else rect(Math.min(x1, x2), y1 - Math.floor(w / 2), Math.abs(x2 - x1) + 1, w, t);
}
function blob(cx, cy, r, t) {
  for (let yy = cy - r; yy <= cy + r; yy++)
    for (let xx = cx - r; xx <= cx + r; xx++) {
      const d = Math.hypot(xx - cx, (yy - cy) * 1.15);
      if (d <= r + (((xx * 7 + yy * 13) % 5) - 2) * 0.35) if (tiles[yy]?.[xx] !== undefined) tiles[yy][xx] = t;
    }
}

// ---- 1. Region biome ground -------------------------------------------------
// Regions: Ashfall Wastes (x<64,y<100), Sablemarsh (x<64,y>=100), Frostmere (x>=64,y<40),
//          Pineholt (64..127,40..99), Greenrest Vale (64..127,y>=100),
//          Thornwood (x>=128,40..105), Cinderforge (x>=128,y>=106).
rect(0, 0, MAP_W, MAP_H, 0); // grass base
rect(0, 0, 64, 100, 13); // Ashfall Wastes — ashen ground
rect(0, 100, 64, 60, 10); // Sablemarsh — marsh
rect(64, 0, 128, 40, 12); // Frostmere — snow
rect(128, 0, 64, 40, 12); // Frostmere extends across the north
// Pineholt (64..127,40..99), Greenrest (64..127,100..159), Thornwood (128..191,40..105) stay grass.
rect(128, 106, 64, 54, 13); // Cinderforge — scorched ash

// ---- 2. Border forest + regional tree cover --------------------------------
rect(0, 0, MAP_W, 2, 3);
rect(0, MAP_H - 2, MAP_W, 2, 3);
rect(0, 0, 2, MAP_H, 3);
rect(MAP_W - 2, 0, 2, MAP_H, 3);
// Decorative forest clusters (kept clear of town centers & future roads).
[
  [20, 20, 4], [50, 14, 3], [16, 40, 3], [54, 90, 3], // Ashfall sparse dead stands
  [76, 48, 4], [118, 50, 4], [72, 92, 4], [120, 90, 4], [70, 60, 3], [122, 66, 3], // Pineholt pines
  [138, 48, 4], [180, 52, 4], [140, 96, 4], [182, 92, 4], [172, 60, 3], [136, 78, 3], // Thornwood woods
  [70, 150, 3], [122, 150, 3], [112, 112, 3], // Greenrest copses
  [96, 8, 3], [150, 10, 3], [180, 24, 3], // Frostmere pines
].forEach(([x, y, r]) => blob(x, y, r, 3));

// ---- 3. Water features ------------------------------------------------------
blob(72, 124, 6, 2); // Greenrest pond (fishing)
rect(79, 122, 2, 6, 11); // Greenrest dock planks (meets the pond edge)
blob(24, 136, 6, 2); // Sablemarsh eel pool
blob(40, 118, 4, 2); // Sablemarsh channel
blob(80, 28, 4, 2); // Frostmere frozen pond
blob(150, 88, 4, 2); // Thornwood woodland pond

// ---- 4. Roads (drawn over terrain; buildings placed afterwards) -------------
line(96, 14, 96, 152, 1, 3); // central spine: Frostmere <-> Pineholt <-> Greenrest
line(40, 130, 96, 130, 1, 3); // Greenrest <-> Sablemarsh
line(44, 50, 44, 130, 1, 3); // west arterial: Ashfall <-> Sablemarsh
line(44, 64, 96, 64, 1, 3); // Ashfall <-> spine
line(96, 70, 156, 70, 1, 3); // Pineholt <-> Thornwood
line(156, 70, 156, 134, 1, 3); // Thornwood <-> Cinderforge
line(96, 132, 156, 132, 1, 3); // Greenrest <-> Cinderforge
line(96, 20, 106, 20, 1, 2); // Frostmere town spur
line(148, 70, 148, 74, 1, 2); // Thornwood town spur
line(150, 128, 150, 132, 1, 2); // Cinderforge town spur

// ---- 5. Cinderforge lava hazards (blocked) ---------------------------------
blob(136, 148, 3, 14);
blob(184, 112, 2, 14);
blob(174, 150, 2, 14);

// ---- 6. Buildings -----------------------------------------------------------
const wallEdges = [],
  wallEdgeSet = new Set(),
  buildings = [];
function edgeKey(x1, y1, x2, y2) {
  return x1 < x2 || (x1 === x2 && y1 < y2) ? `${x1},${y1}|${x2},${y2}` : `${x2},${y2}|${x1},${y1}`;
}
function addWallEdge(x1, y1, x2, y2) {
  const key = edgeKey(x1, y1, x2, y2);
  if (wallEdgeSet.has(key)) return;
  wallEdgeSet.add(key);
  wallEdges.push({ x1, y1, x2, y2 });
}
function buildingStyle(x, y) {
  if (x < 64) return y < 100 ? 'castle' : 'mire'; // Ashfall / Sablemarsh
  if (y < 40) return 'castle'; // Frostmere
  if (x < 128) return y < 100 ? 'oakridge' : 'heartwood'; // Pineholt / Greenrest
  return y < 106 ? 'willow' : 'frontier'; // Thornwood / Cinderforge
}
function building(x, y, w, h, doorX) {
  rect(x, y, w, h, 5);
  buildings.push({ x, y, w, h, doorX, style: buildingStyle(x, y) });
  for (let xx = x; xx < x + w; xx++) {
    addWallEdge(xx, y, xx, y - 1);
    if (xx !== doorX) addWallEdge(xx, y + h - 1, xx, y + h);
  }
  for (let yy = y; yy < y + h; yy++) {
    addWallEdge(x, yy, x - 1, yy);
    addWallEdge(x + w - 1, yy, x + w, yy);
  }
}

// Greenrest Vale (starter town) — grass, plaza around (96,128).
building(83, 118, 8, 7, 87); // Bank hall
tiles[120][85] = 9; // bank booth
building(100, 120, 8, 6, 103); // General store
building(104, 132, 7, 6, 107); // Crafting hall
tiles[126][100] = 8; // town cooking range (fire)
rect(88, 138, 10, 5, 7); // farm fence perimeter
rect(89, 139, 8, 3, 0); // farm interior (open)
tiles[142][93] = 1; // farm gate onto plaza

// Pineholt (northern pine town) — grass, center (96,70).
building(84, 58, 8, 7, 87); // Watch house
building(100, 58, 9, 7, 104); // Resting Stag inn
tiles[62][105] = 6; // inn counter

// Frostmere Hold (snow waystation) — center (96,20).
building(85, 12, 8, 7, 88); // Waystation hall
building(101, 12, 7, 7, 104); // Chapel (altar inside)
tiles[14][104] = 5;

// Thornwood (woodland village) — center (152,72).
building(144, 62, 8, 7, 147); // Elder lodge
building(159, 62, 7, 7, 162); // Hunter cabin

// Cinderforge (volcanic forge town) — center (154,130).
building(146, 122, 8, 7, 149); // Smithy
building(161, 122, 7, 7, 164); // Scholar tent

// Sablemarsh (swamp village) — center (36,130).
building(28, 122, 8, 5, 31); // Healer hut
building(40, 122, 7, 5, 43); // Trader stilthouse

// ---- 7. Ashfall Wastes ruins + Ashen Barrow dungeon ------------------------
rect(30, 44, 10, 6, 4); // ruined surface walls near the barrow mouth
rect(33, 46, 4, 3, 13);
tiles[52][40] = 13; // clear approach tile to the portal
// Sealed dungeon vault (reached only by portal): walls border a floor chamber.
rect(8, 74, 26, 24, 4);
rect(10, 76, 22, 20, 5);
line(11, 86, 31, 86, 5, 1);
rect(16, 80, 1, 12, 4); // interior pillar wall
rect(26, 82, 1, 10, 4);
tiles[86][16] = 5;
tiles[86][26] = 5;

// ---- 8. Resource tiles ------------------------------------------------------
TREES.forEach((t) => (tiles[t.y][t.x] = 3));

// ---- 9. Pathing -------------------------------------------------------------
const WALKABLE = new Set([0, 1, 5, 8, 10, 11, 12, 13]);
function walkable(x, y) {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H && WALKABLE.has(tiles[y][x]);
}
function canStep(x1, y1, x2, y2) {
  return walkable(x2, y2) && !wallEdgeSet.has(edgeKey(x1, y1, x2, y2));
}
function nearestWalkable(x, y) {
  if (walkable(x, y)) return { x, y };
  for (let r = 1; r < 12; r++)
    for (let yy = y - r; yy <= y + r; yy++)
      for (let xx = x - r; xx <= x + r; xx++) if (walkable(xx, yy)) return { x: xx, y: yy };
  return null;
}
function findPath(sx, sy, gx, gy) {
  const goal = nearestWalkable(gx, gy);
  if (!goal) return [];
  gx = goal.x;
  gy = goal.y;
  const key = (x, y) => x + ',' + y,
    open = [{ x: sx, y: sy, g: 0, f: 0 }],
    came = new Map(),
    cost = new Map([[key(sx, sy), 0]]),
    dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
  while (open.length) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.x === gx && cur.y === gy) {
      const path = [];
      let k = key(gx, gy),
        p = { x: gx, y: gy };
      while (k !== key(sx, sy)) {
        path.unshift(p);
        p = came.get(k);
        k = key(p.x, p.y);
      }
      return path;
    }
    for (const [dX, dY] of dirs) {
      const x = cur.x + dX,
        y = cur.y + dY;
      if (!canStep(cur.x, cur.y, x, y)) continue;
      const ng = cur.g + 1,
        k = key(x, y);
      if (ng < (cost.get(k) ?? Infinity)) {
        cost.set(k, ng);
        came.set(k, { x: cur.x, y: cur.y });
        open.push({ x, y, g: ng, f: ng + Math.abs(x - gx) + Math.abs(y - gy) });
      }
    }
  }
  return [];
}
