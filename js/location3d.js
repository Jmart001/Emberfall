"use strict";
// ============================================================
// location3d.js — generic Three.js viewer for a single glb "location".
// Built for heartwood-plains1.glb but driven by the LOCATION config
// below, so other town/area models drop in the same way.
//
// The model is a flat top-down tile: ~700x700 units, Y-up, centred
// on the origin. It ships as 9,618 separate meshes (only ~146 colours),
// so on load we MERGE geometry by colour -> ~146 draw calls = smooth.
// ============================================================

const LOCATION = {
  name: 'Heartwood Plains',
  model: 'heartwood-plains1.glb',
  size: 700,            // world spans -350..+350 on X and Z (from GLB bounds)
  tiles: 64,            // 64 x 64 tile design
  townSize: 81.4,       // measured extent of the actual town detail (→ tile ≈ 1.27 units)
  groundY: 4,           // approx terrain top (bounds Y max ~4)
  // POIs from the reference art, as fractions of the map (x=left→right,
  // y=top→bottom). APPROXIMATE — nudge in-browser once you see alignment.
  // If the whole set looks rotated/mirrored vs the art, flip the axes in
  // poiToWorld() below (one-line change), rather than editing every entry.
  pois: [
    { n: 1,  t: 'General Store',   x: 0.29, y: 0.30, c: 0xffd23f },
    { n: 2,  t: 'Blacksmith',      x: 0.39, y: 0.30, c: 0xffd23f },
    { n: 3,  t: 'Bank',            x: 0.49, y: 0.30, c: 0xffd23f },
    { n: 4,  t: 'Inn',             x: 0.29, y: 0.47, c: 0xffd23f },
    { n: 5,  t: "Wanderer's Shop", x: 0.49, y: 0.47, c: 0xffd23f },
    { n: 6,  t: 'Guide',           x: 0.39, y: 0.56, c: 0xffd23f },
    { n: 7,  t: "Miller's Farm",   x: 0.61, y: 0.33, c: 0x9fe07f },
    { n: 8,  t: 'Fishing Pond',    x: 0.60, y: 0.53, c: 0x60d0ff },
    { n: 9,  t: 'Grazing Field',   x: 0.49, y: 0.60, c: 0x9fe07f },
    { n: 10, t: "Fisherman's Dock",x: 0.09, y: 0.80, c: 0x60d0ff },
    { n: 11, t: 'Wheat Field',     x: 0.27, y: 0.74, c: 0x9fe07f },
    { n: 12, t: 'Old Oak',         x: 0.08, y: 0.19, c: 0x8fbf6f },
    { n: 13, t: 'Herb Grove',      x: 0.90, y: 0.36, c: 0x9fe07f },
    { n: 14, t: 'Standing Stones', x: 0.42, y: 0.87, c: 0xc0c0d0 },
    { n: 15, t: 'Bandit Cave',     x: 0.30, y: 0.09, c: 0xff8060 },
    { n: 16, t: 'Ancient Ruins',   x: 0.72, y: 0.12, c: 0xc0c0d0 },
    { n: 17, t: 'Guard Tower',     x: 0.07, y: 0.47, c: 0xffd23f },
    { n: 18, t: 'Deep Forest',     x: 0.72, y: 0.80, c: 0x4f8f4f },
  ],
  spawn: { x: 0.42, y: 0.50 },   // fractional spawn (near the fountain)
};

// fractional map coord (0..1, top-left origin) -> world (x, z).
// >>> If markers look rotated/mirrored vs your art, change ONLY this fn.
function poiToWorld(fx, fy) {
  const half = LOCATION.size / 2;
  return { x: (fx - 0.5) * LOCATION.size, z: (fy - 0.5) * LOCATION.size };
}

// ---------- three.js scene ----------
const canvas3d = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;   // richer, filmic colour response
renderer.toneMappingExposure = 1.08;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fc7e8);
scene.fog = new THREE.Fog(0x8fc7e8, LOCATION.size * 0.9, LOCATION.size * 1.9);

const camera = new THREE.PerspectiveCamera(50, 1, 0.5, 4000);
// warm key sun + cool sky fill + soft back light = more depth on the flat-shaded art
const sun = new THREE.DirectionalLight(0xffe9c4, 1.5);
sun.position.set(160, 420, 220); scene.add(sun);
const back = new THREE.DirectionalLight(0xbfd8ff, 0.5);
back.position.set(-180, 220, -160); scene.add(back);
scene.add(new THREE.HemisphereLight(0xdcefff, 0x556644, 0.75));

const pickables = [];   // meshes the click-raycaster tests against

// ---------- load + merge the model ----------
function setHud(t) { const el = document.getElementById('hudmsg'); if (el) el.textContent = t; }

function mergeByColour(root) {
  root.updateMatrixWorld(true);
  const groups = {};
  root.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    const m = mats[0] || {};
    const col = m.color ? m.color.getHexString() : 'ffffff';
    const transparent = !!m.transparent && (m.opacity !== undefined && m.opacity < 1);
    const key = col + '|' + (transparent ? m.opacity.toFixed(2) : '1');
    let geo = o.geometry;
    try { geo = geo.index ? geo.toNonIndexed() : geo.clone(); } catch (e) { geo = geo.clone(); }
    // keep only position + normal so all geometries merge cleanly
    const keep = ['position', 'normal'];
    Object.keys(geo.attributes).forEach(a => { if (!keep.includes(a)) geo.deleteAttribute(a); });
    if (!geo.attributes.normal) geo.computeVertexNormals();
    geo.applyMatrix4(o.matrixWorld);
    (groups[key] = groups[key] || { geoms: [], color: m.color ? m.color.clone() : new THREE.Color(0xffffff), opacity: transparent ? m.opacity : 1 }).geoms.push(geo);
  });

  const out = new THREE.Group();
  let draws = 0;
  const U = THREE.BufferGeometryUtils;
  for (const key in groups) {
    const g = groups[key];
    let merged = null;
    try { merged = U ? U.mergeBufferGeometries(g.geoms, false) : null; } catch (e) { merged = null; }
    const mat = new THREE.MeshStandardMaterial({
      color: g.color, roughness: 1, metalness: 0, side: THREE.DoubleSide,
      transparent: g.opacity < 1, opacity: g.opacity,
    });
    const tag = mesh => { mesh.userData.water = g.opacity < 1; mesh.userData.color = g.color; };
    if (merged) { const mm = new THREE.Mesh(merged, mat); tag(mm); out.add(mm); draws++; }
    else g.geoms.forEach(geo => { const mm = new THREE.Mesh(geo, mat); tag(mm); out.add(mm); draws++; });
  }
  return { group: out, draws };
}

// ---------- collision grid (walls + water block movement) ----------
// Built by rasterising the town geometry from above: WATER meshes and any
// raised SOLID (non-foliage) triangle stamp their footprint as blocked.
// Foliage (green) and flat ground/paths stay walkable.
const COL = { min: -70, cell: 0.8, n: Math.ceil(140 / 0.8), blocked: null };
function colIdx(x, z) {
  const gx = Math.floor((x - COL.min) / COL.cell), gz = Math.floor((z - COL.min) / COL.cell);
  if (gx < 0 || gz < 0 || gx >= COL.n || gz >= COL.n) return -1;
  return gz * COL.n + gx;
}
function walkableAt(x, z) { if (!COL.blocked) return true; const i = colIdx(x, z); return i < 0 ? true : COL.blocked[i] === 0; }
function stamp(x0, x1, z0, z1) {
  for (let x = x0; x <= x1; x += COL.cell) for (let z = z0; z <= z1; z += COL.cell) {
    const i = colIdx(x, z); if (i >= 0) COL.blocked[i] = 1;
  }
}
function buildCollision(meshes) {
  COL.blocked = new Uint8Array(COL.n * COL.n);
  const RAISED = 1.9;          // only genuinely tall walls block — furniture/counters/floors stay walkable so you can enter buildings
  let blockedCells = 0;
  meshes.forEach(m => {
    const water = !!m.userData.water;
    const c = m.userData.color;
    const foliage = c && c.g > c.r * 1.08 && c.g > c.b * 1.08;   // green = trees/grass
    if (foliage && !water) return;                               // walkable decoration
    const pos = m.geometry && m.geometry.attributes.position;
    if (!pos) return;
    for (let i = 0; i + 2 < pos.count; i += 3) {
      const ay = pos.getY(i), by = pos.getY(i + 1), cy = pos.getY(i + 2);
      if (!water && Math.max(ay, by, cy) <= RAISED) continue;    // flat ground / path
      const ax = pos.getX(i), bx = pos.getX(i + 1), cx = pos.getX(i + 2);
      const az = pos.getZ(i), bz = pos.getZ(i + 1), cz = pos.getZ(i + 2);
      stamp(Math.min(ax, bx, cx), Math.max(ax, bx, cx), Math.min(az, bz, cz), Math.max(az, bz, cz));
    }
  });
  for (let i = 0; i < COL.blocked.length; i++) blockedCells += COL.blocked[i];
  return blockedCells;
}
// ---------- TILE grid + A* pathfinding (one tile per step) ----------
// The world is a grid of ~1.27-unit tiles (townSize / 64). A tile is walkable
// only if its centre + inset footprint clear the fine collision grid, so tiles
// that clip a wall are blocked. Click-to-move runs A* and the character follows
// the tile-centre waypoints one tile at a time, routing around obstacles.
const TSIZE = LOCATION.townSize / LOCATION.tiles / 1.6;   // ≈ 0.8 units — fine enough for 1-tile doorways
const TG = { size: TSIZE, min: -60, n: Math.ceil(120 / TSIZE), walk: null };
const txOf = x => Math.floor((x - TG.min) / TG.size);
const tzOf = z => Math.floor((z - TG.min) / TG.size);
const tcx = tx => TG.min + (tx + 0.5) * TG.size;    // tile centre → world x
const tcz = tz => TG.min + (tz + 0.5) * TG.size;    // tile centre → world z
function buildTileGrid() {
  TG.walk = new Uint8Array(TG.n * TG.n);
  // centre-sample only, so a 1-tile doorway between walls stays walkable
  for (let tz = 0; tz < TG.n; tz++) for (let tx = 0; tx < TG.n; tx++) {
    TG.walk[tz * TG.n + tx] = walkableAt(tcx(tx), tcz(tz)) ? 1 : 0;
  }
}
const tileWalkable = (tx, tz) => tx >= 0 && tz >= 0 && tx < TG.n && tz < TG.n && TG.walk && TG.walk[tz * TG.n + tx] === 1;
function nearestTile(tx, tz) {
  if (tileWalkable(tx, tz)) return [tx, tz];
  for (let r = 1; r <= 30; r++) for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
    if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
    if (tileWalkable(tx + dx, tz + dz)) return [tx + dx, tz + dz];
  }
  return null;
}
// A* over the tile grid — 8 directions, no cutting through wall corners
function findPath(sx, sz, tx, tz) {
  if (sx === tx && sz === tz) return [];
  const key = (x, z) => z * TG.n + x;
  const open = [{ x: sx, z: sz, f: 0 }], came = new Map(), gs = new Map();
  gs.set(key(sx, sz), 0);
  const h = (x, z) => Math.max(Math.abs(x - tx), Math.abs(z - tz));
  const DIRS = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]];
  let found = false, guard = 0;
  while (open.length && guard++ < 30000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.x === tx && cur.z === tz) { found = true; break; }
    const cg = gs.get(key(cur.x, cur.z));
    for (const [dx, dz, cost] of DIRS) {
      const nx = cur.x + dx, nz = cur.z + dz;
      if (!tileWalkable(nx, nz)) continue;
      if (dx && dz && (!tileWalkable(cur.x + dx, cur.z) || !tileWalkable(cur.x, cur.z + dz))) continue;
      const ng = cg + cost, k = key(nx, nz);
      if (gs.has(k) && gs.get(k) <= ng) continue;
      gs.set(k, ng); came.set(k, key(cur.x, cur.z));
      open.push({ x: nx, z: nz, f: ng + h(nx, nz) });
    }
  }
  if (!found) return null;
  const pts = []; let k = key(tx, tz); const sk = key(sx, sz);
  while (k !== sk) { pts.push({ x: tcx(k % TG.n), z: tcz(Math.floor(k / TG.n)) }); k = came.get(k); }
  return pts.reverse();
}
// route the player toward a clicked world point (nearest reachable tile)
function moveToWorld(wx, wz) {
  if (!TG.walk) { player.path = [{ x: wx, z: wz }]; return; }   // grid not ready → walk direct
  const s = nearestTile(txOf(player.x), tzOf(player.z));
  const t = nearestTile(txOf(wx), tzOf(wz));
  if (!s || !t) return;
  const p = findPath(s[0], s[1], t[0], t[1]);
  if (p) player.path = p;
}

// ---------- collision debug overlay (press G) ----------
let debugMesh = null;
function buildDebugOverlay() {
  if (debugMesh) { scene.remove(debugMesh); debugMesh = null; }
  if (!TG.walk) return;
  const geoms = [];
  for (let tz = 0; tz < TG.n; tz++) for (let tx = 0; tx < TG.n; tx++) {
    if (TG.walk[tz * TG.n + tx]) continue;                 // only draw BLOCKED tiles
    const g = new THREE.PlaneGeometry(TG.size * 0.92, TG.size * 0.92);
    g.rotateX(-Math.PI / 2); g.translate(tcx(tx), 0.4, tcz(tz));
    geoms.push(g);
  }
  if (!geoms.length) return;
  const merged = THREE.BufferGeometryUtils ? THREE.BufferGeometryUtils.mergeBufferGeometries(geoms, false) : geoms[0];
  debugMesh = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ color: 0xff3040, transparent: true, opacity: 0.4, depthWrite: false }));
  debugMesh.visible = false;
  scene.add(debugMesh);
}
window.addEventListener('keydown', e => {
  if (e.key === 'g' || e.key === 'G') {
    if (debugMesh) { debugMesh.visible = !debugMesh.visible; setHud(debugMesh.visible ? 'Collision overlay ON (red = blocked). Press G to hide.' : 'Collision overlay off.'); }
  }
});

let modelLoaded = false;
function showPicker(show) { const el = document.getElementById('picker'); if (el) el.style.display = show ? 'flex' : 'none'; }

// hand a parsed gltf to the scene (shared by fetch + file-pick paths)
function useGltf(gltf) {
  if (modelLoaded) return;
  modelLoaded = true;
  let node = gltf.scene;
  try {
    const { group, draws } = mergeByColour(gltf.scene);
    node = group;
    setHud(LOCATION.name + ' loaded — ' + draws + ' draw calls (merged from 9,618 meshes)');
  } catch (e) {
    setHud(LOCATION.name + ' loaded (unmerged — ' + e.message + ')');
  }
  scene.add(node);
  node.traverse(o => { if (o.isMesh) pickables.push(o); });
  showPicker(false);
  // build collision + tile grid, then spawn on the nearest walkable tile centre
  try {
    buildCollision(pickables);
    buildTileGrid();
    buildDebugOverlay();
    const st = nearestTile(txOf(player.x), tzOf(player.z));
    if (st) { player.x = tcx(st[0]); player.z = tcz(st[1]); }
    player.path = [];
    setHud(LOCATION.name + ' ready — click to walk. Press G to see the collision grid.');
  } catch (e) { setHud('Loaded (pathfinding skipped: ' + e.message + ')'); }
}

// read a user-picked / dropped .glb (works from file:// — no fetch needed)
function readGlbFile(file) {
  setHud('Reading ' + file.name + ' …');
  const r = new FileReader();
  r.onload = () => {
    try { new THREE.GLTFLoader().parse(r.result, '', useGltf, err => setHud('Parse failed: ' + (err && err.message || err))); }
    catch (e) { setHud('Parse failed: ' + e.message); }
  };
  r.onerror = () => setHud('Could not read the file.');
  r.readAsArrayBuffer(file);
}

if (typeof THREE.GLTFLoader === 'function') {
  if (window.HEARTWOOD_GLB_B64) {                 // preferred: embedded model → auto-loads from file://
    setHud('Loading embedded model …');
    try {
      const bin = atob(window.HEARTWOOD_GLB_B64), n = bin.length, bytes = new Uint8Array(n);
      for (let i = 0; i < n; i++) bytes[i] = bin.charCodeAt(i);
      new THREE.GLTFLoader().parse(bytes.buffer, '', useGltf,
        err => { setHud('Embedded parse failed: ' + (err && err.message || err)); tryFetchThenPicker(); });
    } catch (e) { setHud('Embed decode failed: ' + e.message); tryFetchThenPicker(); }
  } else {
    tryFetchThenPicker();
  }
  wirePicker();
} else {
  setHud('GLTFLoader missing — check the <script> include.');
}
function tryFetchThenPicker() {                    // fallback: fetch (served) → else prompt to pick
  new THREE.GLTFLoader().load(LOCATION.model, useGltf,
    xhr => { if (xhr.total) setHud('Loading … ' + Math.round(100 * xhr.loaded / xhr.total) + '%'); },
    () => { if (!modelLoaded) { setHud('Pick the .glb to load it.'); showPicker(true); } });
}
function wirePicker() {
  const input = document.getElementById('glbfile');
  if (input) input.addEventListener('change', e => { if (e.target.files[0]) readGlbFile(e.target.files[0]); });
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', e => {
    e.preventDefault();
    const f = [...(e.dataTransfer.files || [])].find(f => /\.(glb|gltf)$/i.test(f.name));
    if (f) readGlbFile(f);
  });
}

// ---------- player ----------
const STAND_Y = 0.2;                    // ground level of the town plane
const CHAR_FOOTPRINT = 1.15;            // scale the character so it fills ~1 tile
const HEADING_OFFSET = 0;               // add Math.PI here if the model faces backwards
const player = { x: 0, z: 0, path: [], heading: 0, moving: false };  // spawn town centre
let playerRig = null;

// placeholder capsule, shown until the character model loads (or if it fails)
const pmat = new THREE.MeshStandardMaterial({ color: 0x3fa7ff, roughness: 0.7 });
const playerMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.8, 12), pmat);
const playerHead = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 12), new THREE.MeshStandardMaterial({ color: 0xf0c090 }));
scene.add(playerMesh); scene.add(playerHead);
function syncPlayer() {
  if (playerRig) {
    playerRig.position.set(player.x, STAND_Y, player.z);
    playerRig.rotation.y = player.heading + HEADING_OFFSET;
  } else {
    playerMesh.position.set(player.x, STAND_Y + 0.9, player.z);
    playerHead.position.set(player.x, STAND_Y + 2.1, player.z);
  }
}

// build the character rig: scale to ~1 tile, centre it, stand it on the ground
function buildPlayerRig(gltf) {
  const model = gltf.scene;
  const box0 = new THREE.Box3().setFromObject(model), size0 = new THREE.Vector3();
  box0.getSize(size0);
  const s = CHAR_FOOTPRINT / Math.max(size0.x, size0.z, 0.001);
  model.scale.setScalar(s);
  const box = new THREE.Box3().setFromObject(model), c = new THREE.Vector3();
  box.getCenter(c);
  model.position.x -= c.x; model.position.z -= c.z; model.position.y -= box.min.y;  // centre + feet at 0
  const rig = new THREE.Group(); rig.add(model);
  scene.add(rig);
  playerRig = rig;
  playerMesh.visible = false; playerHead.visible = false;
  syncPlayer();
}
function loadCharacter() {
  if (typeof THREE.GLTFLoader !== 'function') return;
  const L = new THREE.GLTFLoader();
  if (window.PLAYER_GLB_B64) {
    try {
      const bin = atob(window.PLAYER_GLB_B64), n = bin.length, b = new Uint8Array(n);
      for (let i = 0; i < n; i++) b[i] = bin.charCodeAt(i);
      L.parse(b.buffer, '', buildPlayerRig, () => L.load('player-character.glb', buildPlayerRig, undefined, () => {}));
    } catch (e) { L.load('player-character.glb', buildPlayerRig, undefined, () => {}); }
  } else {
    L.load('player-character.glb', buildPlayerRig, undefined, () => {});
  }
}
loadCharacter();
syncPlayer();

// ---------- interaction stations ----------
// Positions in world units (town centre = 0,0). GUESSED from the art — nudge
// x/z here (or move a station onto a building) once you see where things sit.
const STATIONS = [
  { kind: 'bank',  name: '🏦 Bank',             x: -2,  z: -9,  range: 3.5, col: 0xffe060 },
  { kind: 'shop',  name: '🏪 General Store',    x: -11, z: -3,  range: 3.5, shop: 'general', col: 0xffd23f, greet: 'Alaric: I buy anything!' },
  { kind: 'shop',  name: '🎣 Fishing Supplies', x: -15, z: 9,   range: 3.5, shop: 'fishing', col: 0x60d0ff, greet: "Murphy: fresh bait an' rods!" },
  { kind: 'shop',  name: '⚔️ Armoury',          x: 12,  z: -4,  range: 3.5, shop: 'armoury', col: 0xc0c0c8, greet: 'Gaveth: finest steel around.' },
  { kind: 'smith', name: '⚒️ Anvil',            x: 12,  z: 1,   range: 3.0, col: 0x9aa0a4 },
  { kind: 'smelt', name: '🔥 Furnace',          x: 15,  z: -1,  range: 3.5, col: 0xff8a30 },
  { kind: 'cook',  name: '🍳 Campfire',         x: 4,   z: 8,   range: 3.0, col: 0xff9f40 },
  { kind: 'fish',  name: '🐟 Fishing Spot',     x: -16, z: 13,  range: 4.5, col: 0x60a0d0 },
  { kind: 'mine',  name: '⛏️ Copper Rocks',     x: 17,  z: 8,   range: 3.0, tier: 'bronze', col: 0xa86a32 },
  { kind: 'mine',  name: '⛏️ Iron Rocks',       x: 19,  z: 11,  range: 3.0, tier: 'iron',   col: 0x8f8f8f },
];
let pendingStation = null;
const stationMeshes = [];
function stationSprite(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(20,16,10,0.85)'; g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#ffd23f'; g.font = 'bold 26px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 34);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthTest: false }));
  s.scale.set(8, 2, 1); return s;
}
STATIONS.forEach(st => {
  const mk = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.3, 2.4, 10), new THREE.MeshStandardMaterial({ color: st.col, roughness: 0.65 }));
  mk.position.set(st.x, 1.2, st.z); mk.userData.station = st; scene.add(mk); stationMeshes.push(mk);
  const spr = stationSprite(st.name); spr.position.set(st.x, 3.6, st.z); scene.add(spr);
});
function pathTo(wx, wz) {
  const s = nearestTile(txOf(player.x), tzOf(player.z)), t = nearestTile(txOf(wx), tzOf(wz));
  if (s && t) { const p = findPath(s[0], s[1], t[0], t[1]); if (p) player.path = p; }
}

// ---------- camera (OSRS-style angled follow, framed on the town) ----------
const cam = { yaw: Math.PI, pitch: 0.82, dist: 34 };
function updateCamera() {
  const cx = player.x, cy = STAND_Y, cz = player.z;
  camera.position.set(
    cx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist,
    cy + Math.sin(cam.pitch) * cam.dist,
    cz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist
  );
  camera.lookAt(cx, cy + 2, cz);
}

// ---------- input ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let down = null, dragged = false;
canvas3d.addEventListener('mousedown', e => { down = { x: e.clientX, y: e.clientY, b: e.button }; dragged = false; });
window.addEventListener('mousemove', e => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
  if (down.b === 2 || down.b === 1) {
    cam.yaw -= dx * 0.005;
    cam.pitch = Math.max(0.35, Math.min(1.35, cam.pitch + dy * 0.004));
    down.x = e.clientX; down.y = e.clientY;
  }
});
window.addEventListener('mouseup', e => {
  if (down && down.b === 0 && !dragged && pickables.length) {
    const r = canvas3d.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const sHit = ray.intersectObjects(stationMeshes, false)[0];
    if (sHit) {                                         // clicked a station → walk to it, then interact
      pendingStation = sHit.object.userData.station;
      if (window.Game) Game.stopAction();
      pathTo(pendingStation.x, pendingStation.z);
    } else {                                            // clicked ground → walk there
      const hit = ray.intersectObjects(pickables, false)[0];
      if (hit) { pendingStation = null; if (window.Game) Game.stopAction(); moveToWorld(hit.point.x, hit.point.z); }
    }
  }
  down = null;
});
canvas3d.addEventListener('contextmenu', e => e.preventDefault());
canvas3d.addEventListener('wheel', e => { cam.dist = Math.max(8, Math.min(160, cam.dist * (1 + e.deltaY * 0.0012))); e.preventDefault(); }, { passive: false });

function resize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ---------- loop ----------
const clock = new THREE.Clock();
const SPEED = 6;    // units / second (~4.7 tiles/s) — tune to taste
function tick() {
  const dt = Math.min(0.05, clock.getDelta());
  // follow the A* path one tile-centre waypoint at a time
  if (player.path.length) {
    const wp = player.path[0];
    const dx = wp.x - player.x, dz = wp.z - player.z, d = Math.hypot(dx, dz);
    const step = SPEED * dt;
    if (d <= step) { player.x = wp.x; player.z = wp.z; player.path.shift(); }
    else { player.x += dx / d * step; player.z += dz / d * step; }
    if (d > 0.0001) player.heading = Math.atan2(dx, dz);   // face the next tile
    player.moving = true;
  } else { player.moving = false; }
  // arrived at a station? trigger its interaction once
  if (pendingStation && player.path.length === 0) {
    const d = Math.hypot(pendingStation.x - player.x, pendingStation.z - player.z);
    if (d <= (pendingStation.range || 3)) { if (window.Game) Game.interact(pendingStation); pendingStation = null; }
  }
  if (window.Game) Game.tick(performance.now());
  syncPlayer();
  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
