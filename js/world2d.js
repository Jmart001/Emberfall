"use strict";
// ============================================================
// world2d.js — 2D tile map engine for Emberfall.
// Renders a map-art image as the world background, walks the player
// on a tile walkability grid authored to match the art, with A*
// click-to-move, a follow camera, enterable buildings, and hooks
// into the shared economy (game3d.js `Game`). Map art loads fine
// from file:// (it's an <img>, not a fetch).
// ============================================================
(function () {
  // ---------- map definitions ----------
  // Buildings: {x,y,w,h} in tiles (wall ring blocks, interior + door walk).
  // door: side 'N'|'S'|'E'|'W'. kind drives the interaction (via Game).
  const MAPS = {
    town: {
      img: 'assets_town.png', cols: 32, rows: 26,
      spawn: { tx: 13, ty: 16 },
      buildings: [
        { id: 'store',  name: 'General Store',   x: 3,  y: 2,  w: 6, h: 6, door: 'S', kind: 'shop', shop: 'general', greet: 'Alaric: welcome — I buy anything!' },
        { id: 'smith',  name: 'Blacksmith',      x: 13, y: 2,  w: 6, h: 6, door: 'S', kind: 'smith', greet: 'Brenna: mind the sparks.' },
        { id: 'bank',   name: 'Bank',            x: 22, y: 2,  w: 6, h: 6, door: 'S', kind: 'bank' },
        { id: 'inn',    name: 'Inn',             x: 2,  y: 9,  w: 6, h: 6, door: 'S', kind: 'inn', greet: 'Rowan: rest easy, traveller.' },
        { id: 'wander', name: "Wanderer's Shop", x: 24, y: 9,  w: 6, h: 6, door: 'S', kind: 'shop', shop: 'armoury', greet: 'Sable: rare wares, fair prices.' },
        { id: 'guide',  name: 'Guide',           x: 11, y: 17, w: 5, h: 6, door: 'S', kind: 'guide', greet: 'Elder Fen: the plains lie south. Be careful.' },
      ],
      fences: [
        { x: 2,  y: 17, w: 7, h: 7, gate: 'N' },   // farm
        { x: 22, y: 16, w: 8, h: 8, gate: 'N' },   // animal pen
      ],
      blocks: [ [14, 11, 4, 3] ],                  // fountain
      bridges: [], poi: [], pxw: 1243, water: false,
      exits:  [ { x: 0, y: 24, w: 3, h: 2, to: 'plains', spawn: { tx: 18, ty: 42 } } ],
      openBorder: [ [0, 24, 3, 2] ],               // south road gap in the tree border
    },
    plains: {
      img: 'assets_plains.png', cols: 64, rows: 51, pxw: 1290, water: true,
      spawn: { tx: 18, ty: 42 },
      buildings: [
        { id: 'store',  name: 'General Store',   x: 20, y: 14, w: 7, h: 6, door: 'S', kind: 'shop', shop: 'general', greet: 'Alaric: welcome!' },
        { id: 'smith',  name: 'Blacksmith',      x: 28, y: 14, w: 7, h: 6, door: 'S', kind: 'smith', greet: 'Brenna: mind the sparks.' },
        { id: 'bank',   name: 'Bank',            x: 36, y: 14, w: 7, h: 6, door: 'S', kind: 'bank' },
        { id: 'inn',    name: 'Inn',             x: 20, y: 22, w: 7, h: 6, door: 'S', kind: 'inn', greet: 'Rowan: rest easy.' },
        { id: 'wander', name: "Wanderer's Shop", x: 36, y: 22, w: 7, h: 6, door: 'S', kind: 'shop', shop: 'armoury', greet: 'Sable: rare wares.' },
        { id: 'guide',  name: 'Guide',           x: 28, y: 27, w: 7, h: 6, door: 'S', kind: 'guide', greet: 'Elder Fen: mind the bandits north.' },
      ],
      fences: [
        { x: 44, y: 15, w: 9, h: 7, gate: 'W' },   // Miller's farm
        { x: 36, y: 28, w: 8, h: 6, gate: 'N' },   // grazing pen
        { x: 20, y: 36, w: 8, h: 7, gate: 'N' },   // wheat field
      ],
      blocks: [ [29,22,3,3], [7,8,3,3], [56,3,4,4], [7,29,2,3], [29,43,3,2], [49,16,3,4], [16,0,26,3] ],
      bridges: [ [21,6,3,2], [39,10,3,2] ],
      poi: [
        { kind: 'fish', name: '🐟 Fishing Pond',      x: 41, y: 29 },
        { kind: 'fish', name: "🐟 Fisherman's Dock",  x: 13, y: 41 },
        { kind: 'cook', name: '🍳 Campfire',          x: 39, y: 6 },
        { kind: 'mine', name: '⛏️ Copper Rocks',      x: 45, y: 26, tier: 'bronze' },
        { kind: 'mine', name: '⛏️ Iron Rocks',        x: 52, y: 40, tier: 'iron' },
      ],
      exits:  [ { x: 0, y: 45, w: 4, h: 3, to: 'town', spawn: { tx: 13, ty: 22 } } ],
      openBorder: [ [0, 45, 4, 4] ],
    },
    // ---- the single seamless open world (default) ----
    world: {
      img: 'assets_world.png', cols: 80, rows: 60, pxw: 1448, water: true, border: 3,
      spawn: { tx: 37, ty: 42 },
      buildings: [
        { id: 'store',  name: 'General Store',   x: 26, y: 20, w: 8, h: 7, door: 'S', kind: 'shop', shop: 'general', greet: 'Alaric: welcome!' },
        { id: 'smith',  name: 'Blacksmith',      x: 34, y: 20, w: 7, h: 7, door: 'S', kind: 'smith', greet: 'Brenna: mind the sparks.' },
        { id: 'bank',   name: 'Bank',            x: 42, y: 20, w: 7, h: 7, door: 'S', kind: 'bank' },
        { id: 'inn',    name: 'Inn',             x: 26, y: 29, w: 8, h: 8, door: 'S', kind: 'inn', greet: 'Rowan: rest easy.' },
        { id: 'wander', name: "Wanderer's Shop", x: 42, y: 29, w: 8, h: 8, door: 'S', kind: 'shop', shop: 'armoury', greet: 'Sable: rare wares.' },
        { id: 'guide',  name: 'Guide',           x: 34, y: 34, w: 7, h: 6, door: 'S', kind: 'guide', greet: 'Elder Fen: monsters roam the meadow east.' },
      ],
      fences: [
        { x: 6,  y: 20, w: 15, h: 8,  gate: 'E' },   // farm
        { x: 6,  y: 30, w: 15, h: 9,  gate: 'E' },   // wheat field
        { x: 52, y: 0,  w: 27, h: 14, gate: 'S' },   // crypt enclosure wall
      ],
      blocks: [ [36, 30, 3, 3], [24, 5, 7, 6] ],     // fountain, miller windmill
      bridges: [ [23, 15, 3, 2] ],                   // river bridge
      poi: [
        { kind: 'fish', name: '🐟 Fishing Dock', x: 16, y: 46 },
        { kind: 'fish', name: '🐟 Meadow Pond',  x: 60, y: 23 },
        { kind: 'mine', name: '⛏️ Rocks',        x: 56, y: 26, tier: 'bronze' },
        { kind: 'cook', name: '🍳 Campfire',     x: 40, y: 42 },
      ],
      // monster spawn zones (used once combat is wired in)
      spawns: [
        { type: 'rat',      zone: [50, 16, 28, 22], n: 5 },
        { type: 'goblin',   zone: [50, 16, 28, 22], n: 4 },
        { type: 'skeleton', zone: [53, 2, 24, 11],  n: 3 },
        { type: 'wizard',   zone: [53, 2, 24, 11],  n: 2 },
        { type: 'demon',    zone: [53, 42, 25, 15], n: 2 },
        { type: 'dragon',   zone: [53, 42, 25, 15], n: 1 },
      ],
      exits: [], openBorder: [],
    },
  };

  // ---------- state ----------
  let map = null, mapName = null;
  const mapImg = new Image();
  let TILE = 32, COLS = 32, ROWS = 26, MAPW = 1024, MAPH = 1024;
  let walk = null;               // Uint8 walkability
  const stations = [];           // interaction points {kind, name, x,z(world px), tile, ...}
  const player = { x: 0, y: 0, path: [], face: 1, moving: false };
  let pending = null;

  const canvas = document.getElementById('game2d');
  const ctx = canvas.getContext('2d');
  const VW = () => canvas.width, VH = () => canvas.height;
  const cam = { x: 0, y: 0 };

  const idx = (tx, ty) => ty * COLS + tx;
  const tileWalk = (tx, ty) => tx >= 0 && ty >= 0 && tx < COLS && ty < ROWS && walk[idx(tx, ty)] === 1;
  const wcx = tx => (tx + 0.5) * TILE, wcy = ty => (ty + 0.5) * TILE;
  const tx = x => Math.floor(x / TILE), ty = y => Math.floor(y / TILE);

  // ---------- build a map ----------
  function ring(x, y, w, h, val, gateSide) {
    for (let iy = y; iy < y + h; iy++) for (let ix = x; ix < x + w; ix++) {
      const edge = ix === x || iy === y || ix === x + w - 1 || iy === y + h - 1;
      if (edge && ix >= 0 && iy >= 0 && ix < COLS && iy < ROWS) walk[idx(ix, iy)] = val;
    }
    if (gateSide) {                                   // open a 1-tile gate
      let gx, gy;
      if (gateSide === 'N') { gx = x + (w >> 1); gy = y; }
      else if (gateSide === 'S') { gx = x + (w >> 1); gy = y + h - 1; }
      else if (gateSide === 'E') { gx = x + w - 1; gy = y + (h >> 1); }
      else { gx = x; gy = y + (h >> 1); }
      if (gx >= 0 && gy >= 0 && gx < COLS && gy < ROWS) walk[idx(gx, gy)] = 1;
      return { x: gx, y: gy };
    }
  }
  const fillRect = (x, y, w, h, v) => { for (let iy = y; iy < y + h; iy++) for (let ix = x; ix < x + w; ix++) if (ix >= 0 && iy >= 0 && ix < COLS && iy < ROWS) walk[idx(ix, iy)] = v; };
  // block blue (water) tiles by sampling the map art at each tile centre
  function detectWater() {
    const off = document.createElement('canvas'); off.width = MAPW; off.height = MAPH;
    const o = off.getContext('2d'); o.drawImage(mapImg, 0, 0);
    const d = o.getImageData(0, 0, MAPW, MAPH).data;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const px = Math.floor((x + 0.5) * TILE), py = Math.floor((y + 0.5) * TILE), i = (py * MAPW + px) * 4;
      const r = d[i], gr = d[i + 1], b = d[i + 2];
      if ((b > r + 12 && b > gr + 2 && b > 80) || (r > 120 && r > gr + 45 && r > b + 55)) walk[idx(x, y)] = 0; // water or lava
    }
  }
  function buildRects() {
    const bw = map.border || 1;
    for (let k = 0; k < bw; k++) {
      for (let i = 0; i < COLS; i++) { walk[idx(i, k)] = 0; walk[idx(i, ROWS - 1 - k)] = 0; }
      for (let j = 0; j < ROWS; j++) { walk[idx(k, j)] = 0; walk[idx(COLS - 1 - k, j)] = 0; }
    }
    (map.openBorder || []).forEach(([x, y, w, h]) => fillRect(x, y, w, h, 1));
    (map.buildings || []).forEach(b => {
      ring(b.x, b.y, b.w, b.h, 0);
      const door = ring(b.x, b.y, b.w, b.h, 0, b.door);
      walk[idx(door.x, door.y)] = 1; b.doorTile = door;
      stations.push({ kind: b.kind, name: b.name, shop: b.shop, greet: b.greet, x: wcx(door.x), y: wcy(door.y) + TILE * 0.4, range: TILE * 1.3, tile: door });
    });
    (map.fences || []).forEach(f => ring(f.x, f.y, f.w, f.h, 0, f.gate));
    (map.blocks || []).forEach(([x, y, w, h]) => fillRect(x, y, w, h, 0));
    (map.poi || []).forEach(p => stations.push({ kind: p.kind, name: p.name, tier: p.tier, x: wcx(p.x), y: wcy(p.y), range: TILE * 1.6 }));
  }
  function loadMap(name, spawnOverride) {
    map = MAPS[name]; mapName = name; COLS = map.cols; ROWS = map.rows;
    MAPW = map.pxw; MAPH = 1024; TILE = MAPW / COLS;
    walk = new Uint8Array(COLS * ROWS).fill(1); stations.length = 0; pending = null;
    buildRects();
    const sp = spawnOverride || map.spawn;
    const s = nearestTile(sp.tx, sp.ty) || [sp.tx, sp.ty];
    player.x = wcx(s[0]); player.y = wcy(s[1]); player.path = [];
    mapImg.onload = () => {
      MAPW = mapImg.width; MAPH = mapImg.height; TILE = MAPW / COLS;
      if (map.water) { detectWater(); (map.bridges || []).forEach(([x, y, w, h]) => fillRect(x, y, w, h, 1)); }
      recentre();
    };
    mapImg.src = map.img + '?v=' + Date.now();
    recentre();
  }
  function recentre() { cam.x = clamp(player.x - VW() / 2, 0, Math.max(0, MAPW - VW())); cam.y = clamp(player.y - VH() / 2, 0, Math.max(0, MAPH - VH())); }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // ---------- pathfinding ----------
  function nearestTile(x, y) {
    if (tileWalk(x, y)) return [x, y];
    for (let r = 1; r <= 20; r++) for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (tileWalk(x + dx, y + dy)) return [x + dx, y + dy];
    }
    return null;
  }
  function findPath(sx, sy, gx, gy) {
    if (sx === gx && sy === gy) return [];
    const key = (x, y) => y * COLS + x;
    const open = [{ x: sx, y: sy, f: 0 }], came = new Map(), gs = new Map(); gs.set(key(sx, sy), 0);
    const h = (x, y) => Math.max(Math.abs(x - gx), Math.abs(y - gy));
    const DIR = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]];
    let found = false, guard = 0;
    while (open.length && guard++ < 9000) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.x === gx && cur.y === gy) { found = true; break; }
      const cg = gs.get(key(cur.x, cur.y));
      for (const [dx, dy, cost] of DIR) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (!tileWalk(nx, ny)) continue;
        if (dx && dy && (!tileWalk(cur.x + dx, cur.y) || !tileWalk(cur.x, cur.y + dy))) continue;
        const ng = cg + cost, k = key(nx, ny);
        if (gs.has(k) && gs.get(k) <= ng) continue;
        gs.set(k, ng); came.set(k, key(cur.x, cur.y));
        open.push({ x: nx, y: ny, f: ng + h(nx, ny) });
      }
    }
    if (!found) return null;
    const pts = []; let k = key(gx, gy); const sk = key(sx, sy);
    while (k !== sk) { pts.push({ x: wcx(k % COLS), y: wcy(Math.floor(k / COLS)) }); k = came.get(k); }
    return pts.reverse();
  }
  function walkToWorld(wx, wy) {
    const s = nearestTile(tx(player.x), ty(player.y)), t = nearestTile(tx(wx), ty(wy));
    if (s && t) { const p = findPath(s[0], s[1], t[0], t[1]); if (p) player.path = p; }
  }

  // ---------- interactions ----------
  function doInteract(st) {
    if (window.Game && ['shop', 'bank', 'smith', 'smelt', 'fish', 'cook', 'mine'].includes(st.kind)) Game.interact(st);
    else if (window.Game && Game.say) Game.say((st.greet || st.name) + (st.kind === 'inn' ? ' (resting restores you — coming soon).' : ''));
  }

  // ---------- input ----------
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect();
    const wx = (e.clientX - r.left) * (canvas.width / r.width) + cam.x;
    const wy = (e.clientY - r.top) * (canvas.height / r.height) + cam.y;
    // clicked a station?
    let best = null, bd = TILE * 1.4;
    stations.forEach(s => { const d = Math.hypot(s.x - wx, s.y - wy); if (d < bd) { bd = d; best = s; } });
    if (window.Game) Game.stopAction();
    if (best) { pending = best; walkToWorld(best.x, best.y); }
    else { pending = null; walkToWorld(wx, wy); }
  });

  // ---------- loop ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    // move along path
    if (player.path.length) {
      const wp = player.path[0], dx = wp.x - player.x, dy = wp.y - player.y, d = Math.hypot(dx, dy), step = TILE * 4.2 * dt;
      if (d <= step) { player.x = wp.x; player.y = wp.y; player.path.shift(); }
      else { player.x += dx / d * step; player.y += dy / d * step; }
      if (Math.abs(dx) > 1) player.face = dx > 0 ? 1 : -1;
      player.moving = true;
    } else player.moving = false;
    // arrival → interact or exit
    if (pending && player.path.length === 0 && Math.hypot(pending.x - player.x, pending.y - player.y) <= (pending.range || TILE)) { doInteract(pending); pending = null; }
    const ex = (map.exits || []).find(e => { const t = { x: tx(player.x), y: ty(player.y) }; return t.x >= e.x && t.x < e.x + e.w && t.y >= e.y && t.y < e.y + e.h; });
    if (ex) { loadMap(ex.to, ex.spawn); }
    if (window.Game) Game.tick(now);
    recentre();
    draw(now);
    requestAnimationFrame(frame);
  }
  function draw(now) {
    ctx.clearRect(0, 0, VW(), VH());
    if (mapImg.complete && mapImg.naturalWidth) ctx.drawImage(mapImg, cam.x, cam.y, VW(), VH(), 0, 0, VW(), VH());
    else { ctx.fillStyle = '#2e4a24'; ctx.fillRect(0, 0, VW(), VH()); }
    // player
    const px = player.x - cam.x, py = player.y - cam.y;
    ctx.save(); ctx.translate(px, py);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 13, 11, 4, 0, 0, 7); ctx.fill();
    if (typeof PAINTERS !== 'undefined' && PAINTERS.player) {
      ctx.save(); ctx.translate(0, 13); if (player.face < 0) ctx.scale(-1, 1);
      PAINTERS.player(ctx, now, { walk: player.moving, seed: 0 }); ctx.restore();
    } else { ctx.fillStyle = '#3fa7ff'; ctx.fillRect(-6, -18, 12, 26); }
    ctx.restore();
  }

  // ---------- boot ----------
  function fit() { canvas.width = Math.min(980, window.innerWidth - 280); canvas.height = window.innerHeight - 20; }
  window.addEventListener('resize', () => { fit(); recentre(); });
  fit();
  loadMap('world');                 // single seamless open world
  requestAnimationFrame(frame);
  window.World2D = { loadMap };
})();
