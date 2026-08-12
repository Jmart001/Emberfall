"use strict";
// ============================================================
// town.js — a procedural, game-designed town for Emberfall.
// Everything derives from ONE tile map, so geometry, collision and
// pathfinding can never disagree: buildings have street-facing doors,
// walls block, doors are open, roofs hide when you step inside.
// ============================================================

// ---------- tile map ----------
const TILE = 2.4;                     // world units per tile (roomy interiors + doors)
const GN = 40;                        // town is GN x GN tiles
const HALF = GN / 2;
const wX = tx => (tx - HALF + 0.5) * TILE;   // tile → world centre
const wZ = tz => (tz - HALF + 0.5) * TILE;
const tX = x => Math.floor(x / TILE + HALF); // world → tile
const tZ = z => Math.floor(z / TILE + HALF);

const G = { grass: 0, road: 1, plaza: 2, floor: 3, wall: 4, door: 5, water: 6, fountain: 7, tree: 8 };
const grid = new Uint8Array(GN * GN).fill(G.grass);
const at = (tx, tz) => (tx < 0 || tz < 0 || tx >= GN || tz >= GN) ? G.wall : grid[tz * GN + tx];
const set = (tx, tz, v) => { if (tx >= 0 && tz >= 0 && tx < GN && tz < GN) grid[tz * GN + tx] = v; };
const WALKCODES = new Set([G.grass, G.road, G.plaza, G.floor, G.door]);
const walkableTile = (tx, tz) => WALKCODES.has(at(tx, tz));

// perimeter wall
for (let i = 0; i < GN; i++) { set(i, 0, G.wall); set(i, GN - 1, G.wall); set(0, i, G.wall); set(GN - 1, i, G.wall); }
// cross roads (2 tiles wide) between opposite gates
const M = HALF;
for (let i = 1; i < GN - 1; i++) { set(M - 1, i, G.road); set(M, i, G.road); set(i, M - 1, G.road); set(i, M, G.road); }
// gates: open the wall where the roads meet the border
[[M - 1, 0], [M, 0], [M - 1, GN - 1], [M, GN - 1], [0, M - 1], [0, M], [GN - 1, M - 1], [GN - 1, M]].forEach(([x, z]) => set(x, z, G.road));
// central plaza + fountain
for (let z = M - 3; z < M + 3; z++) for (let x = M - 3; x < M + 3; x++) set(x, z, G.plaza);
for (let z = M - 1; z < M + 1; z++) for (let x = M - 1; x < M + 1; x++) set(x, z, G.fountain);

// ---------- buildings ----------
function building(s) {
  for (let iz = s.z; iz < s.z + s.h; iz++) for (let ix = s.x; ix < s.x + s.w; ix++) {
    const edge = ix === s.x || iz === s.z || ix === s.x + s.w - 1 || iz === s.z + s.h - 1;
    set(ix, iz, edge ? G.wall : G.floor);
  }
  let dx, dz;
  if (s.door === 'S') { dx = s.x + (s.w >> 1); dz = s.z + s.h - 1; }
  else if (s.door === 'N') { dx = s.x + (s.w >> 1); dz = s.z; }
  else if (s.door === 'E') { dx = s.x + s.w - 1; dz = s.z + (s.h >> 1); }
  else { dx = s.x; dz = s.z + (s.h >> 1); }
  set(dx, dz, G.door);
  s.doorTile = { x: dx, z: dz };
  s.npcTile = { x: s.x + (s.w >> 1), z: s.z + (s.h >> 1) };
  return s;
}
const BUILDINGS = [
  building({ id: 'store',  name: 'General Store',   x: 4,  z: 4,  w: 8, h: 6, door: 'S', wall: 0xcaa87a, roof: 0x8a4b2a, npc: 'Alaric',     npcCol: 0xc8863a }),
  building({ id: 'wander', name: "Wanderer's Shop", x: 4,  z: 12, w: 6, h: 5, door: 'S', wall: 0x9ab0c8, roof: 0x3f5578, npc: 'Sable',      npcCol: 0x6a80c8 }),
  building({ id: 'smith',  name: 'Blacksmith',      x: 28, z: 4,  w: 8, h: 6, door: 'S', wall: 0x9aa0a4, roof: 0x50555a, npc: 'Brenna',     npcCol: 0x8a8a92 }),
  building({ id: 'guide',  name: 'Guide',           x: 30, z: 12, w: 6, h: 5, door: 'S', wall: 0xa8c88a, roof: 0x3a6a3a, npc: 'Elder Fen',  npcCol: 0x6aa06a }),
  building({ id: 'bank',   name: 'Bank',            x: 4,  z: 30, w: 8, h: 6, door: 'N', wall: 0xd8c48a, roof: 0x9a7b2a, npc: 'Wilhelmina', npcCol: 0xf0e0a0 }),
  building({ id: 'inn',    name: 'Inn',             x: 28, z: 30, w: 8, h: 6, door: 'N', wall: 0xc8a878, roof: 0x7a3b2a, npc: 'Rowan',      npcCol: 0xb06a3a }),
];
// pond (blocked water) tucked in an open corner, clear of roads/doors
for (let z = 24; z < 28; z++) for (let x = 13; x < 17; x++) set(x, z, G.water);
// scattered trees on empty grass (skip anything near roads/buildings)
(function scatterTrees() {
  let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let n = 0; n < 60; n++) {
    const tx = 2 + Math.floor(rnd() * (GN - 4)), tz = 2 + Math.floor(rnd() * (GN - 4));
    if (at(tx, tz) !== G.grass) continue;
    let nearRoad = false;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (at(tx + dx, tz + dz) === G.road || at(tx + dx, tz + dz) === G.door) nearRoad = true;
    if (!nearRoad) set(tx, tz, G.tree);
  }
})();

// ============================================================
// scene
// ============================================================
const canvas3d = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd0e8);
scene.fog = new THREE.Fog(0x9fd0e8, GN * TILE * 0.7, GN * TILE * 1.4);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);
scene.add(new THREE.HemisphereLight(0xdfefff, 0x4a5a3a, 0.95));
const sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(40, 90, 30); scene.add(sun);

const U = THREE.BufferGeometryUtils;
function quad(cx, cz, y) { const g = new THREE.PlaneGeometry(TILE, TILE); g.rotateX(-Math.PI / 2); g.translate(cx, y, cz); return g; }
function boxGeo(cx, cz, y, w, h, d) { const g = new THREE.BoxGeometry(w, h, d); g.translate(cx, y, cz); return g; }
function mergeMesh(geoms, mat) { if (!geoms.length) return null; const g = U ? U.mergeBufferGeometries(geoms, false) : geoms[0]; const m = new THREE.Mesh(g, mat); scene.add(m); return m; }

// ground
const ground = new THREE.Mesh(new THREE.PlaneGeometry(GN * TILE + 40, GN * TILE + 40),
  new THREE.MeshStandardMaterial({ color: 0x4f8f3f, roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);

// ---------- build geometry from the tile map ----------
const roadG = [], plazaG = [], floorG = [], waterG = [], wallG = [], trunkG = [], leafG = [];
const WALL_H = 3.0;
const roofsById = {};
for (let tz = 0; tz < GN; tz++) for (let tx = 0; tx < GN; tx++) {
  const c = grid[tz * GN + tx], cx = wX(tx), cz = wZ(tz);
  if (c === G.road) roadG.push(quad(cx, cz, 0.02));
  else if (c === G.plaza) plazaG.push(quad(cx, cz, 0.03));
  else if (c === G.floor || c === G.door) floorG.push(quad(cx, cz, 0.05));
  else if (c === G.water) waterG.push(quad(cx, cz, 0.06));
  else if (c === G.wall) wallG.push(boxGeo(cx, cz, WALL_H / 2, TILE, WALL_H, TILE));
  else if (c === G.tree) { trunkG.push(boxGeo(cx, cz, 0.8, 0.5, 1.6, 0.5)); leafG.push(boxGeo(cx, cz, 2.4, 2.4, 2.4, 2.4)); }
}
mergeMesh(roadG, new THREE.MeshStandardMaterial({ color: 0xb9a76a, roughness: 1 }));
mergeMesh(plazaG, new THREE.MeshStandardMaterial({ color: 0xbfc2c8, roughness: 1 }));
mergeMesh(floorG, new THREE.MeshStandardMaterial({ color: 0x7a5a38, roughness: 1 }));
mergeMesh(waterG, new THREE.MeshStandardMaterial({ color: 0x3f7fbf, transparent: true, opacity: 0.75, roughness: 0.3 }));
mergeMesh(wallG, new THREE.MeshStandardMaterial({ color: 0xbdbdb2, roughness: 1 }));
mergeMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 1 }));
mergeMesh(leafG, new THREE.MeshStandardMaterial({ color: 0x357a35, roughness: 1 }));

// per-building coloured walls + a roof that hides when you're inside
function textSprite(text, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(20,16,10,0.82)'; x.fillRect(0, 0, 256, 64);
  x.strokeStyle = '#' + new THREE.Color(color).getHexString(); x.lineWidth = 4; x.strokeRect(2, 2, 252, 60);
  x.fillStyle = '#fff'; x.font = 'bold 30px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 128, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  s.scale.set(7, 1.75, 1); return s;
}
BUILDINGS.forEach(b => {
  // recolour this building's wall tiles by overlaying thin coloured caps
  const cxc = wX(b.x + b.w / 2 - 0.5), czc = wZ(b.z + b.h / 2 - 0.5);
  // roof slab (hidden when player is inside footprint)
  const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w * TILE + 0.4, 0.6, b.h * TILE + 0.4),
    new THREE.MeshStandardMaterial({ color: b.roof, roughness: 1 }));
  roof.position.set(cxc, WALL_H + 0.35, czc); scene.add(roof); roofsById[b.id] = roof;
  // coloured wall accent (a ring just inside the grey wall)
  const accent = new THREE.Mesh(new THREE.BoxGeometry(b.w * TILE - 0.2, WALL_H * 0.55, b.h * TILE - 0.2),
    new THREE.MeshStandardMaterial({ color: b.wall, roughness: 1 }));
  accent.position.set(cxc, WALL_H * 0.55 / 2, czc); accent.userData.buildingAccent = true; scene.add(accent);
  // name sign above the door
  const sign = textSprite(b.name, b.roof);
  sign.position.set(wX(b.doorTile.x), WALL_H + 1.6, wZ(b.doorTile.z)); scene.add(sign);
  // NPC inside
  const npc = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.7, 10), new THREE.MeshStandardMaterial({ color: b.npcCol, roughness: 0.8 }));
  body.position.y = 0.85;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 10), new THREE.MeshStandardMaterial({ color: 0xf0c090 }));
  head.position.y = 2.0;
  npc.add(body); npc.add(head);
  npc.position.set(wX(b.npcTile.x), 0.1, wZ(b.npcTile.z));
  scene.add(npc);
  b.npcObj = npc;
});

// accent boxes shouldn't poke through the door — carve handled implicitly by grey wall gap at door tile

// fountain
(function fountain() {
  const cx = wX(M) - TILE / 2, cz = wZ(M) - TILE / 2;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(TILE * 0.95, TILE * 1.05, 0.6, 20), new THREE.MeshStandardMaterial({ color: 0xb9b9c2, roughness: 1 }));
  base.position.set(cx, 0.3, cz); scene.add(base);
  const water = new THREE.Mesh(new THREE.CylinderGeometry(TILE * 0.75, TILE * 0.75, 0.2, 20), new THREE.MeshStandardMaterial({ color: 0x4f9fdf, transparent: true, opacity: 0.85 }));
  water.position.set(cx, 0.65, cz); scene.add(water);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.4, 10), new THREE.MeshStandardMaterial({ color: 0xa9a9b2 }));
  spout.position.set(cx, 1.1, cz); scene.add(spout);
})();

// ============================================================
// pathfinding (tile A*, one tile per step)
// ============================================================
function nearestTile(tx, tz) {
  if (walkableTile(tx, tz)) return [tx, tz];
  for (let r = 1; r <= 25; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    if (walkableTile(tx + dx, tz + dz)) return [tx + dx, tz + dz];
  }
  return null;
}
function findPath(sx, sz, tx, tz) {
  if (sx === tx && sz === tz) return [];
  const key = (x, z) => z * GN + x;
  const open = [{ x: sx, z: sz, f: 0 }], came = new Map(), gs = new Map(); gs.set(key(sx, sz), 0);
  const h = (x, z) => Math.max(Math.abs(x - tx), Math.abs(z - tz));
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]];
  let found = false, guard = 0;
  while (open.length && guard++ < 12000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.x === tx && cur.z === tz) { found = true; break; }
    const cg = gs.get(key(cur.x, cur.z));
    for (const [dx, dz, cost] of DIRS) {
      const nx = cur.x + dx, nz = cur.z + dz;
      if (!walkableTile(nx, nz)) continue;
      if (dx && dz && (!walkableTile(cur.x + dx, cur.z) || !walkableTile(cur.x, cur.z + dz))) continue;
      const ng = cg + cost, k = key(nx, nz);
      if (gs.has(k) && gs.get(k) <= ng) continue;
      gs.set(k, ng); came.set(k, key(cur.x, cur.z));
      open.push({ x: nx, z: nz, f: ng + h(nx, nz) });
    }
  }
  if (!found) return null;
  const pts = []; let k = key(tx, tz); const sk = key(sx, sz);
  while (k !== sk) { pts.push({ x: wX(k % GN), z: wZ(Math.floor(k / GN)) }); k = came.get(k); }
  return pts.reverse();
}

// ============================================================
// player
// ============================================================
const STAND_Y = 0.1, SPEED = 6.0, HEADING_OFFSET = 0;
const player = { x: 0, z: 0, path: [], heading: 0 };
(function spawn() { const s = nearestTile(M, M + 5) || [M, M + 5]; player.x = wX(s[0]); player.z = wZ(s[1]); })();
let playerRig = null;
const capsule = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x3fa7ff }));
const capHead = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf0c090 }));
scene.add(capsule); scene.add(capHead);
function syncPlayer() {
  if (playerRig) { playerRig.position.set(player.x, STAND_Y, player.z); playerRig.rotation.y = player.heading + HEADING_OFFSET; }
  else { capsule.position.set(player.x, STAND_Y + 0.9, player.z); capHead.position.set(player.x, STAND_Y + 2.1, player.z); }
}
function buildRig(gltf) {
  const model = gltf.scene;
  const b0 = new THREE.Box3().setFromObject(model), s0 = new THREE.Vector3(); b0.getSize(s0);
  model.scale.setScalar((TILE * 0.8) / Math.max(s0.x, s0.z, 0.001));
  const b = new THREE.Box3().setFromObject(model), c = new THREE.Vector3(); b.getCenter(c);
  model.position.x -= c.x; model.position.z -= c.z; model.position.y -= b.min.y;
  const rig = new THREE.Group(); rig.add(model); scene.add(rig);
  playerRig = rig; capsule.visible = false; capHead.visible = false; syncPlayer();
}
(function loadChar() {
  if (typeof THREE.GLTFLoader !== 'function') return;
  const L = new THREE.GLTFLoader();
  if (window.PLAYER_GLB_B64) {
    try { const bin = atob(window.PLAYER_GLB_B64), n = bin.length, a = new Uint8Array(n); for (let i = 0; i < n; i++) a[i] = bin.charCodeAt(i); L.parse(a.buffer, '', buildRig, () => L.load('player-character.glb', buildRig, undefined, () => {})); }
    catch (e) { L.load('player-character.glb', buildRig, undefined, () => {}); }
  } else L.load('player-character.glb', buildRig, undefined, () => {});
})();
syncPlayer();

// ============================================================
// camera (OSRS angled follow) + input
// ============================================================
const cam = { yaw: Math.PI, pitch: 0.86, dist: 40 };
function updateCamera() {
  const cx = player.x, cy = STAND_Y, cz = player.z;
  camera.position.set(cx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist, cy + Math.sin(cam.pitch) * cam.dist, cz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist);
  camera.lookAt(cx, cy + 2, cz);
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null, dragged = false;
canvas3d.addEventListener('mousedown', e => { down = { x: e.clientX, y: e.clientY, b: e.button }; dragged = false; });
window.addEventListener('mousemove', e => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
  if (down.b === 2 || down.b === 1) { cam.yaw -= dx * 0.005; cam.pitch = Math.max(0.35, Math.min(1.35, cam.pitch + dy * 0.004)); down.x = e.clientX; down.y = e.clientY; }
});
window.addEventListener('mouseup', e => {
  if (down && down.b === 0 && !dragged) {
    const r = canvas3d.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1; ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(ground)[0];
    if (hit) {
      const s = nearestTile(tX(player.x), tZ(player.z)), t = nearestTile(tX(hit.point.x), tZ(hit.point.z));
      if (s && t) { const p = findPath(s[0], s[1], t[0], t[1]); if (p) player.path = p; }
    }
  }
  down = null;
});
canvas3d.addEventListener('contextmenu', e => e.preventDefault());
canvas3d.addEventListener('wheel', e => { cam.dist = Math.max(10, Math.min(120, cam.dist * (1 + e.deltaY * 0.0012))); e.preventDefault(); }, { passive: false });
function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ============================================================
// loop
// ============================================================
function setHud(t) { const el = document.getElementById('hudmsg'); if (el) el.textContent = t; }
const clock = new THREE.Clock();
let insideId = null;
function updateRoofsAndPrompt() {
  const px = tX(player.x), pz = tZ(player.z);
  let inside = null, near = null;
  BUILDINGS.forEach(b => {
    const in_ = px >= b.x && px < b.x + b.w && pz >= b.z && pz < b.z + b.h;
    b.npcObj.rotation.y += 0.02;                       // idle spin so NPCs feel alive
    roofsById[b.id].visible = !in_;                    // hide roof when you're inside
    if (in_) inside = b;
    const dd = Math.abs(px - b.npcTile.x) + Math.abs(pz - b.npcTile.z);
    if (dd <= 2 && (!near || dd < near.d)) near = { b, d: dd };
  });
  if (near) setHud('You are with ' + near.b.npc + ' — ' + near.b.name + ' (interactions coming soon)');
  else if (inside) setHud('Inside the ' + inside.name);
  else setHud('Click to walk · scroll zoom · right-drag rotate');
}
function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  if (player.path.length) {
    const wp = player.path[0], dx = wp.x - player.x, dz = wp.z - player.z, d = Math.hypot(dx, dz), step = SPEED * dt;
    if (d <= step) { player.x = wp.x; player.z = wp.z; player.path.shift(); }
    else { player.x += dx / d * step; player.z += dz / d * step; }
    if (d > 0.0001) player.heading = Math.atan2(dx, dz);
  }
  syncPlayer(); updateRoofsAndPrompt(); updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
setHud('Town ready — click to walk.');
requestAnimationFrame(tick);
