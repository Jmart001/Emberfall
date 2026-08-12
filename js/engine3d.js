"use strict";
// ============================================================
// engine3d.js — standalone Three.js renderer for Emberfall.
// Reuses the world data from data.js (WW, WH, TILE, OBSTACLES,
// REGIONS, NPCS, MOBS, SPAWNS, ROCKS, FURNACE_PT, FISH_SPOTS,
// CASTLE, clamp). Gameplay stays on the abstract 2D tile grid;
// this file only handles 3D rendering, camera and click-picking.
//
// >>> To use YOUR world: put the file in this folder and set
//     WORLD_MODEL_URL below (e.g. 'world.glb'). If it can't load,
//     a placeholder ground is drawn so the scene still runs.
// ============================================================

const WORLD_MODEL_URL = 'world.glb';   // <-- your .glb / .gltf here
const S = 0.05;                        // world pixels -> three.js units (2000px -> 100u)
const w2u = px => px * S;              // scalar convert
const PLAYER_SPEED = 150;              // world px / second (matches the 2D game)

// ---------- tile grid + A* (mirrors game.js so pathfinding is identical) ----------
const GRID_W = GW, GRID_H = GH;
let grid = null;
function buildGrid() {
  grid = new Uint8Array(GRID_W * GRID_H);
  const inset = 5;
  for (let ty = 0; ty < GRID_H; ty++) for (let tx = 0; tx < GRID_W; tx++) {
    const rx = tx * TILE + inset, ry = ty * TILE + inset, rs = TILE - inset * 2;
    const hit = OBSTACLES.some(o => rx < o.x + o.w && rx + rs > o.x && ry < o.y + o.h && ry + rs > o.y);
    const edge = tx === 0 || ty === 0 || tx === GRID_W - 1 || ty === GRID_H - 1;
    grid[ty * GRID_W + tx] = (hit || edge) ? 0 : 1;
  }
}
const walkable = (tx, ty) => tx >= 0 && ty >= 0 && tx < GRID_W && ty < GRID_H && grid[ty * GRID_W + tx] === 1;
function nearest(tx, ty) {
  if (walkable(tx, ty)) return [tx, ty];
  for (let r = 1; r <= 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (walkable(tx + dx, ty + dy)) return [tx + dx, ty + dy];
  }
  return null;
}
function aStar(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [];
  const key = (x, y) => y * GRID_W + x;
  const open = [{ x: sx, y: sy, f: 0 }], came = new Map(), gs = new Map();
  gs.set(key(sx, sy), 0);
  const h = (x, y) => Math.max(Math.abs(x - tx), Math.abs(y - ty));
  const DIRS = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.45],[1,-1,1.45],[-1,1,1.45],[-1,-1,1.45]];
  let found = false, guard = 0;
  while (open.length && guard++ < 8000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.x === tx && cur.y === ty) { found = true; break; }
    const cg = gs.get(key(cur.x, cur.y));
    for (const [dx, dy, cost] of DIRS) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!walkable(nx, ny)) continue;
      if (dx && dy && (!walkable(cur.x + dx, cur.y) || !walkable(cur.x, cur.y + dy))) continue;
      const ng = cg + cost, k = key(nx, ny);
      if (gs.has(k) && gs.get(k) <= ng) continue;
      gs.set(k, ng); came.set(k, key(cur.x, cur.y));
      open.push({ x: nx, y: ny, f: ng + h(nx, ny) });
    }
  }
  if (!found) return null;
  const pts = []; let k = key(tx, ty); const sk = key(sx, sy);
  while (k !== sk) { pts.push({ x: (k % GRID_W + 0.5) * TILE, y: (Math.floor(k / GRID_W) + 0.5) * TILE }); k = came.get(k); }
  return pts.reverse();
}

// ---------- scene ----------
const canvas3d = document.getElementById('c3d');
const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141018);
scene.fog = new THREE.Fog(0x141018, w2u(900), w2u(2200));

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1000);
const sun = new THREE.DirectionalLight(0xfff2d8, 1.1);
sun.position.set(w2u(600), w2u(1400), w2u(400));
scene.add(sun);
scene.add(new THREE.AmbientLight(0x8899bb, 0.7));

// invisible pick plane at ground level — raycast target for clicks
const pickPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(w2u(WW) * 3, w2u(WH) * 3),
  new THREE.MeshBasicMaterial({ visible: false })
);
pickPlane.rotation.x = -Math.PI / 2;
pickPlane.position.set(w2u(WW) / 2, 0, w2u(WH) / 2);
scene.add(pickPlane);

// ---------- placeholder world (shown until / unless your .glb loads) ----------
const placeholder = new THREE.Group();
(function buildPlaceholder() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(w2u(WW), w2u(WH)),
    new THREE.MeshStandardMaterial({ color: 0x2e4a24 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(w2u(WW) / 2, -0.01, w2u(WH) / 2);
  placeholder.add(ground);

  const patch = (r, color, y) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w2u(r.w), w2u(r.h)),
      new THREE.MeshStandardMaterial({ color }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(w2u(r.x + r.w / 2), y, w2u(r.y + r.h / 2));
    placeholder.add(m);
  };
  patch(REGIONS.crypt, 0x55556a, 0.02);
  patch(REGIONS.lair,  0x5c2a24, 0.02);
  patch(CASTLE,        0x9a9aa8, 0.03);

  // obstacle walls as low boxes so you can see collisions in 3D
  OBSTACLES.forEach(o => {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w2u(o.w), w2u(60), w2u(o.h)),
      new THREE.MeshStandardMaterial({ color: 0x6a5c40 })
    );
    box.position.set(w2u(o.x + o.w / 2), w2u(30), w2u(o.y + o.h / 2));
    placeholder.add(box);
  });
  scene.add(placeholder);
})();

// try to load the real model; on success, dim the placeholder blocks
if (typeof THREE.GLTFLoader === 'function') {
  new THREE.GLTFLoader().load(
    WORLD_MODEL_URL,
    gltf => {
      const model = gltf.scene;
      // NOTE: adjust these to fit your model to the 2000x1500 world footprint.
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      scene.add(model);
      placeholder.visible = false;   // hide the stand-in world
      setHud('Loaded ' + WORLD_MODEL_URL + ' — align scale/position in engine3d.js');
    },
    undefined,
    () => setHud('No ' + WORLD_MODEL_URL + ' found — showing placeholder world. Drop your .glb in this folder.')
  );
} else {
  setHud('GLTFLoader not loaded — showing placeholder world.');
}

// ---------- actors ----------
function marker(color, geo, h) {
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color }));
  m.position.y = h;
  scene.add(m);
  return m;
}
const playerMesh = marker(0x3fa7ff, new THREE.CylinderGeometry(w2u(9), w2u(9), w2u(34), 12), w2u(17));
const playerHead = marker(0xf0c090, new THREE.SphereGeometry(w2u(8), 12, 12), w2u(40));

const npcMeshes = NPCS.map(n =>
  marker(n.id === 'banker' ? 0xffe060 : 0x60c0ff, new THREE.CylinderGeometry(w2u(9), w2u(9), w2u(32), 10), w2u(16)));

// spawn wandering mobs from the same tables the 2D game uses
let mobs3d = [];
function spawn3d(type, region) {
  const r = REGIONS[region];
  const x = r.x + 30 + Math.random() * (r.w - 60), y = r.y + 30 + Math.random() * (r.h - 60);
  const mesh = marker(0xff5a5a, new THREE.ConeGeometry(w2u(11), w2u(30), 10), w2u(15));
  mobs3d.push({ type, region, x, y, hx: x, hy: y, dx: x, dy: y, next: 0, mesh });
}
SPAWNS.forEach(([t, r]) => spawn3d(t, r));

// ore rocks + furnace as small props (visual parity with the 2D world)
ROCKS.forEach(rk => {
  const m = marker(TIERCOL[rk.tier] ? parseInt(TIERCOL[rk.tier].slice(1), 16) : 0x777777,
    new THREE.DodecahedronGeometry(w2u(12)), w2u(10));
  m.position.set(w2u(rk.x), w2u(10), w2u(rk.y));
});
(function furnaceProp() {
  const m = marker(0x4a4038, new THREE.BoxGeometry(w2u(32), w2u(30), w2u(28)), w2u(15));
  m.position.set(w2u(FURNACE_PT.x), w2u(15), w2u(FURNACE_PT.y));
})();

// ---------- player state (world pixels; mirrors the 2D game) ----------
buildGrid();                            // grid must exist before any pathfinding
const SPAWN_PT = { x: 545, y: 660 };
const player = { x: SPAWN_PT.x, y: SPAWN_PT.y, path: [] };
(function placeStart() { const t = nearest(tileOf(player.x), tileOf(player.y)); if (t) { player.x = (t[0] + 0.5) * TILE; player.y = (t[1] + 0.5) * TILE; } })();

function setActor(mesh, px, py, baseY) { mesh.position.x = w2u(px); mesh.position.z = w2u(py); if (baseY !== undefined) mesh.position.y = baseY; }
function syncPlayer() {
  setActor(playerMesh, player.x, player.y);
  playerHead.position.set(w2u(player.x), w2u(40), w2u(player.y));
}
NPCS.forEach((n, i) => setActor(npcMeshes[i], n.x, n.y));
syncPlayer();

// ---------- camera: OSRS-style angled follow ----------
const cam = { yaw: Math.PI, pitch: 0.85, dist: w2u(520) };  // pitch: 0=horizon, ~1.2=top-down
function updateCamera() {
  const cx = w2u(player.x), cz = w2u(player.y), cy = w2u(20);
  camera.position.set(
    cx + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.dist,
    cy + Math.sin(cam.pitch) * cam.dist,
    cz + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.dist
  );
  camera.lookAt(cx, cy, cz);
}

// ---------- input ----------
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function moveTo(px, py) {
  const t = nearest(tileOf(clamp(px, 0, WW - 1)), tileOf(clamp(py, 0, WH - 1)));
  const s = nearest(tileOf(player.x), tileOf(player.y));
  if (!t || !s) return;
  const p = aStar(s[0], s[1], t[0], t[1]);
  if (p) player.path = p;
}
let down = null, dragged = false;
canvas3d.addEventListener('mousedown', e => { down = { x: e.clientX, y: e.clientY, b: e.button }; dragged = false; });
window.addEventListener('mousemove', e => {
  if (!down) return;
  const dx = e.clientX - down.x, dy = e.clientY - down.y;
  if (Math.abs(dx) + Math.abs(dy) > 4) dragged = true;
  if (down.b === 2 || down.b === 1) {          // right / middle drag = orbit
    cam.yaw -= dx * 0.005;
    cam.pitch = clamp(cam.pitch + dy * 0.004, 0.35, 1.30);
    down.x = e.clientX; down.y = e.clientY;
  }
});
window.addEventListener('mouseup', e => {
  if (down && down.b === 0 && !dragged) {       // left click (no drag) = move
    const r = canvas3d.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(pickPlane)[0];
    if (hit) moveTo(hit.point.x / S, hit.point.z / S);
  }
  down = null;
});
canvas3d.addEventListener('contextmenu', e => e.preventDefault());
canvas3d.addEventListener('wheel', e => { cam.dist = clamp(cam.dist * (1 + e.deltaY * 0.0012), w2u(180), w2u(1200)); e.preventDefault(); }, { passive: false });

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

// ---------- loop ----------
const clock = new THREE.Clock();
function follow(px, py, tx, ty, sp) {   // returns new [x,y] stepping toward (tx,ty)
  const d = Math.hypot(tx - px, ty - py);
  if (d <= sp) return [tx, ty, true];
  return [px + (tx - px) / d * sp, py + (ty - py) / d * sp, false];
}
function tick() {
  const dt = Math.min(0.05, clock.getDelta());

  // player path-follow (same feel as the 2D game)
  if (player.path.length) {
    const wp = player.path[0], sp = PLAYER_SPEED * dt;
    const [nx, ny, reached] = follow(player.x, player.y, wp.x, wp.y, sp);
    player.x = nx; player.y = ny;
    if (reached) player.path.shift();
    syncPlayer();
  }

  // gentle mob wander so the world feels alive (combat wiring is phase 2)
  const now = performance.now();
  mobs3d.forEach(m => {
    if (now >= m.next) {
      const r = REGIONS[m.region];
      m.dx = clamp(m.hx + (Math.random() * 90 - 45), r.x + 20, r.x + r.w - 20);
      m.dy = clamp(m.hy + (Math.random() * 90 - 45), r.y + 20, r.y + r.h - 20);
      m.next = now + 2500 + Math.random() * 4000;
    }
    const [nx, ny] = follow(m.x, m.y, m.dx, m.dy, 40 * dt);
    m.x = nx; m.y = ny;
    setActor(m.mesh, m.x, m.y);
  });

  updateCamera();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

// ---------- HUD helper ----------
function setHud(text) { const el = document.getElementById('hudmsg'); if (el) el.textContent = text; }

requestAnimationFrame(tick);
