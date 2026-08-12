"use strict";
// ============================================================
// game.js — state, tile pathfinding, combat, skills, UI, loop
// ============================================================

// ---------- STATE ----------
const SPAWN_PT = { x: 545, y: 660 };
const XP0 = { atk: 0, def: 0, str: 0, hp: HP_START_XP, fish: 0, cook: 0, mine: 0, smith: 0 };
const EQUIP0 = { weapon: null, body: null, helm: null, shield: null, legs: null };
let player = {
  x: SPAWN_PT.x, y: SPAWN_PT.y,
  path: [],                       // tile-centre waypoints to walk through
  hp: 10, xp: Object.assign({}, XP0),
  inv: { coins: 0 },
  equip: Object.assign({}, EQUIP0),
  boosts: {},                     // { skill: { amt, until } } from potions
  nextAtk: 0, lastCombat: 0, lastSwing: 0, nextRepath: 0,
  face: 1, moving: false,
};
let muted = false;
let bank = {};
let cam = { x: 0, y: 0 };
let mobs = [], loots = [], splats = [], respawns = [];
let target = null;
let lootTarget = null;
let interact = null;
let action = null;
let openVendor = null;
let clickMark = null;
let destTile = null;
let hoverTile = null;
let activeTab = 'inv';
let mobSeq = 0;
let tutStep = 0;

// base (unboosted) levels
const baseLvl = skill => skill === 'hp' ? Math.max(10, lvlOf(player.xp.hp)) : lvlOf(player.xp[skill]);
// active potion boost for a skill (0 if none / expired)
const boostOf = skill => {
  const b = player.boosts[skill];
  return (b && performance.now() < b.until) ? b.amt : 0;
};
// effective (boosted) level used in combat rolls
const effLvl  = skill => baseLvl(skill) + boostOf(skill);
const atkLvl  = () => baseLvl('atk');
const defLvl  = () => baseLvl('def');
const strLvl  = () => baseLvl('str');
const hpLvl   = () => Math.max(10, lvlOf(player.xp.hp));
const fishLvl = () => lvlOf(player.xp.fish);
const cookLvl = () => lvlOf(player.xp.cook);
const mineLvl = () => lvlOf(player.xp.mine);
const smithLvl= () => lvlOf(player.xp.smith);
const maxHp  = () => hpLvl();
const wpnPow = () => player.equip.weapon ? (ITEMS[player.equip.weapon].atk || 0) : 0;
// total defence bonus summed across all worn armour slots
const armPow = () => ['body','helm','shield','legs'].reduce((s, slot) =>
  s + (player.equip[slot] ? (ITEMS[player.equip[slot]].def || 0) : 0), 0);
// max hit scales with Strength + weapon power
const maxHit = () => 1 + Math.floor(effLvl('str') / 8) + wpnPow();

// ---------- TILE GRID & PATHFINDING ----------
let walkGrid = null;
function buildWalkGrid() {
  walkGrid = new Uint8Array(GW * GH);
  const inset = 5; // tile passes if its inner square avoids all obstacles
  for (let ty = 0; ty < GH; ty++) {
    for (let tx = 0; tx < GW; tx++) {
      const rx = tx * TILE + inset, ry = ty * TILE + inset, rs = TILE - inset * 2;
      const hit = OBSTACLES.some(o =>
        rx < o.x + o.w && rx + rs > o.x && ry < o.y + o.h && ry + rs > o.y);
      const edge = tx === 0 || ty === 0 || tx === GW - 1 || ty === GH - 1;
      walkGrid[ty * GW + tx] = (hit || edge) ? 0 : 1;
    }
  }
}
function tileWalkable(tx, ty) {
  if (tx < 0 || ty < 0 || tx >= GW || ty >= GH) return false;
  return walkGrid[ty * GW + tx] === 1;
}
function nearestWalkable(tx, ty) {
  if (tileWalkable(tx, ty)) return [tx, ty];
  for (let r = 1; r <= 8; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (tileWalkable(tx + dx, ty + dy)) return [tx + dx, ty + dy];
      }
  return null;
}
// A* over the tile grid (8 directions, no corner cutting)
function findPath(sx, sy, tx, ty) {
  if (sx === tx && sy === ty) return [];
  const key = (x, y) => y * GW + x;
  const open = [{ x: sx, y: sy, f: 0 }];
  const came = new Map(), gs = new Map();
  gs.set(key(sx, sy), 0);
  const h = (x, y) => Math.max(Math.abs(x - tx), Math.abs(y - ty));
  const DIRS = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.45],[1,-1,1.45],[-1,1,1.45],[-1,-1,1.45]];
  let found = false, guard = 0;
  while (open.length && guard++ < 8000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    const cur = open.splice(bi, 1)[0];
    if (cur.x === tx && cur.y === ty) { found = true; break; }
    const cg = gs.get(key(cur.x, cur.y));
    for (const [dx, dy, cost] of DIRS) {
      const nx = cur.x + dx, ny = cur.y + dy;
      if (!tileWalkable(nx, ny)) continue;
      if (dx && dy && (!tileWalkable(cur.x + dx, cur.y) || !tileWalkable(cur.x, cur.y + dy))) continue;
      const ng = cg + cost, k = key(nx, ny);
      if (gs.has(k) && gs.get(k) <= ng) continue;
      gs.set(k, ng);
      came.set(k, key(cur.x, cur.y));
      open.push({ x: nx, y: ny, f: ng + h(nx, ny) });
    }
  }
  if (!found) return null;
  const pts = [];
  let k = key(tx, ty);
  const sk = key(sx, sy);
  while (k !== sk) {
    pts.push({ x: centerOf(k % GW), y: centerOf(Math.floor(k / GW)) });
    k = came.get(k);
  }
  return pts.reverse();
}
// route the player toward a world point; returns true if a path was found
function walkTo(px, py, mark) {
  const t = nearestWalkable(tileOf(clamp(px, 0, WW - 1)), tileOf(clamp(py, 0, WH - 1)));
  if (!t) return false;
  const sT = nearestWalkable(tileOf(player.x), tileOf(player.y));
  if (!sT) return false;
  const p = findPath(sT[0], sT[1], t[0], t[1]);
  if (p === null) { msg("You can't reach that from here."); return false; }
  player.path = p;
  if (mark) destTile = { tx: t[0], ty: t[1], t: performance.now() };
  return true;
}

// ---------- CHAT ----------
const chatEl = document.getElementById('chat');
function msg(text, color) {
  const d = document.createElement('div');
  d.textContent = text;
  if (color) d.style.color = color;
  chatEl.appendChild(d);
  while (chatEl.children.length > 60) chatEl.removeChild(chatEl.firstChild);
  chatEl.scrollTop = chatEl.scrollHeight;
}

// ---------- INVENTORY ----------
function addItem(id, qty) {
  player.inv[id] = (player.inv[id] || 0) + qty;
  renderPanel(); renderStats();
}
function removeItem(id, qty) {
  if ((player.inv[id] || 0) < qty) return false;
  player.inv[id] -= qty;
  if (player.inv[id] <= 0) delete player.inv[id];
  renderPanel(); renderStats();
  return true;
}

// ---------- SPAWNING ----------
function spawnMob(type, region) {
  const r = REGIONS[region];
  const x = r.x + 30 + rnd(r.w - 60), y = r.y + 30 + rnd(r.h - 60);
  mobs.push({
    uid: ++mobSeq, type, region, hp: MOBS[type].hp, x, y, hx: x, hy: y,
    dx: x, dy: y, nextAtk: 0, nextWander: performance.now() + rnd(4000),
    engaged: false, lastSwing: 0, face: 1, moving: false,
  });
}

// ---------- COMBAT ----------
const SKILL_NAMES = { atk:'Attack', str:'Strength', def:'Defence', hp:'Hitpoints',
  fish:'Fishing', cook:'Cooking', mine:'Mining', smith:'Smithing' };
function grantXp(skill, amt) {
  const before = baseLvl(skill);
  player.xp[skill] += amt;
  const after = baseLvl(skill);
  if (after > before) {
    msg('🎉 Congratulations! Your ' + SKILL_NAMES[skill] + ' level is now ' + after + '!', '#ffd23f');
    sfx('level');
    if (skill === 'hp') player.hp = Math.min(maxHp(), player.hp + (after - before));
  }
  renderStats();
}
function playerAttack(mob, now) {
  const m = MOBS[mob.type];
  // accuracy: Attack level + weapon vs the mob's defence
  const attRoll = effLvl('atk') + wpnPow() * 2;
  const chance = clamp(0.4 + (attRoll - m.def * 1.6) * 0.014, 0.15, 0.95);
  let dmg = 0;
  if (Math.random() < chance) dmg = 1 + rnd(maxHit());   // damage: Strength + weapon
  dmg = Math.min(dmg, mob.hp);
  splats.push({ x: mob.x, y: mob.y - 8, val: dmg, t: now, blue: dmg === 0 });
  sfx(dmg > 0 ? 'hit' : 'miss');
  if (dmg > 0) {
    mob.hp -= dmg;
    grantXp('atk', dmg * 2);
    grantXp('str', dmg * 2);
    grantXp('hp', Math.ceil(dmg * 1.33));
  }
  mob.engaged = true;
  player.lastSwing = now;
  if (mob.hp <= 0) killMob(mob, now);
}
function mobAttack(mob, now) {
  const m = MOBS[mob.type];
  const defRoll = effLvl('def') + armPow() * 2;
  const chance = clamp(0.45 + (m.atk - defRoll * 1.4) * 0.012, 0.05, 0.9);
  let dmg = 0;
  if (Math.random() < chance) dmg = 1 + rnd(m.max);
  else grantXp('def', Math.ceil(m.lvl * 0.9));   // reward for blocking a hit
  dmg = Math.min(dmg, player.hp);
  mob.lastSwing = now;
  splats.push({ x: player.x, y: player.y - 8, val: dmg, t: now, blue: dmg === 0 });
  player.hp -= dmg;
  player.lastCombat = now;
  renderStats();
  if (player.hp <= 0) playerDie();
}
function killMob(mob, now) {
  const m = MOBS[mob.type];
  msg('You have defeated the ' + m.name + '.', '#8fff8f');
  tutAdvance(1);
  grantXp('def', m.lvl * 2);
  const items = {};
  m.drops.forEach(d => {
    if (Math.random() < d.ch) {
      const q = d.min ? d.min + rnd(d.max - d.min + 1) : 1;
      items[d.id] = (items[d.id] || 0) + q;
    }
  });
  loots.push({ x: mob.x, y: mob.y, items, t: now });
  mobs = mobs.filter(x => x !== mob);
  if (target === mob) target = null;
  respawns.push({ type: mob.type, region: mob.region, t: now + 6000 });
}
function playerDie() {
  sfx('die');
  msg('Oh dear, you are dead!', '#ff6060');
  // death penalty: drop everything except coins as a gravestone pile where you fell.
  // equipped gear stays on you; coins are kept.
  const dropped = {};
  for (const id in player.inv) {
    if (id === 'coins') continue;
    if (player.inv[id] > 0) dropped[id] = player.inv[id];
  }
  const keys = Object.keys(dropped);
  if (keys.length) {
    loots.push({ x: player.x, y: player.y, items: dropped, t: performance.now(), grave: true });
    keys.forEach(id => delete player.inv[id]);
    msg('Your unprotected items scatter where you fell — hurry back for them!', '#ff9f60');
  }
  player.boosts = {};
  player.hp = maxHp();
  player.x = SPAWN_PT.x; player.y = SPAWN_PT.y;
  player.path = [];
  target = null; lootTarget = null; interact = null; action = null; destTile = null;
  mobs.forEach(m => m.engaged = false);
  renderPanel(); renderStats();
  msg('You wake up back in Lumshire, shaken but alive.', '#b8a888');
}

// ---------- SKILLING ----------
function startFishing(spot) {
  if (!player.inv.fishing_rod) {
    msg('You need a fishing rod to fish here. Murphy at the pond sells them.', '#ff9f60');
    return;
  }
  action = { kind: 'fish', pt: spot, next: 0 };
  msg('You cast your line...', '#8fd0ff');
}
function doFish(now) {
  if (!player.inv.bait) { msg('You have run out of bait.', '#ff9f60'); action = null; return; }
  if (Math.random() < 0.55 + fishLvl() * 0.004) {
    removeItem('bait', 1);
    const lvl = fishLvl(), roll = Math.random();
    let id = 'raw_shrimp', xp = 15;
    if (lvl >= 30 && roll < 0.3) { id = 'raw_shark'; xp = 110; }
    else if (lvl >= 10 && roll < 0.6) { id = 'raw_trout'; xp = 45; }
    addItem(id, 1);
    grantXp('fish', xp);
    msg('You catch a ' + ITEMS[id].name.toLowerCase().replace('raw ', '') + '!', '#8fd0ff');
    tutAdvance(7);
  } else {
    msg('You feel a nibble... but it gets away.');
  }
}
function startCooking() {
  action = { kind: 'cook', pt: RANGE_PT, next: 0 };
  msg('You warm your hands by the fire...', '#ff9f60');
}
function doCook(now) {
  const order = [ ['raw_shrimp','shrimp',20,0], ['raw_trout','trout',55,0.05], ['raw_shark','shark',130,0.15] ];
  const job = order.find(o => (player.inv[o[0]] || 0) > 0);
  if (!job) { msg('You have nothing raw left to cook.', '#b8a888'); action = null; return; }
  removeItem(job[0], 1);
  const burnChance = clamp(0.45 - cookLvl() * 0.012 + job[3], 0.03, 0.9);
  if (Math.random() < burnChance) {
    addItem('burnt_fish', 1);
    msg('You accidentally burn the fish.', '#ff6060');
  } else {
    addItem(job[1], 1);
    grantXp('cook', job[2]);
    msg('You cook a delicious ' + ITEMS[job[1]].name.toLowerCase() + '.', '#8fff8f');
    tutAdvance(8);
  }
}

// ---------- MINING & SMELTING ----------
const ORE_XP = { bronze:18, iron:35, steel:60, mithril:90, rune:140, dragon:220 };
const SMELT_XP = { bronze:12, iron:22, steel:40, mithril:65, rune:100, dragon:160 };
function startMining(rock) {
  if (!player.inv.pickaxe) {
    msg('You need a pickaxe to mine. Alaric sells them at the General Store.', '#ff9f60');
    return;
  }
  if (mineLvl() < rock.req) {
    msg('You need Mining level ' + rock.req + ' to mine this rock.', '#ff9f60');
    return;
  }
  action = { kind: 'mine', pt: rock, rock, next: 0 };
  msg('You swing your pickaxe at the rock...', '#c8a878');
}
function doMine(now) {
  const rock = action.rock;
  const chance = clamp(0.4 + (mineLvl() - rock.req) * 0.02, 0.25, 0.9);
  if (Math.random() < chance) {
    const ore = rock.tier + '_ore';
    addItem(ore, 1);
    grantXp('mine', ORE_XP[rock.tier]);
    sfx('mine');
    msg('You mine some ' + ITEMS[ore].name.toLowerCase() + '.', '#c8a878');
  } else {
    msg('You swing, but the rock holds firm...');
  }
}
function startSmelting() {
  action = { kind: 'smelt', pt: FURNACE_PT, next: 0 };
  msg('The furnace glows white-hot...', '#ff9f60');
}
function doSmelt(now) {
  // smelt the highest-tier ore you carry into its bar
  const tier = [...TIERS].reverse().find(t => (player.inv[t.id + '_ore'] || 0) > 0);
  if (!tier) { msg('You have no ore left to smelt.', '#b8a888'); action = null; return; }
  removeItem(tier.id + '_ore', 1);
  addItem(tier.id + '_bar', 1);
  grantXp('smith', SMELT_XP[tier.id]);
  sfx('mine');
  msg('You smelt a ' + tier.name + ' bar.', '#ffb060');
}

// ---------- INPUT ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
function screenToWorld(e) {
  const r = canvas.getBoundingClientRect();
  return [
    (e.clientX - r.left) * (W / r.width) + cam.x,
    (e.clientY - r.top) * (H / r.height) + cam.y,
  ];
}
canvas.addEventListener('mousemove', e => {
  const [wx, wy] = screenToWorld(e);
  hoverTile = { tx: tileOf(wx), ty: tileOf(wy) };
});
canvas.addEventListener('mouseleave', () => { hoverTile = null; });
canvas.addEventListener('click', e => {
  const [wx, wy] = screenToWorld(e);
  target = null; lootTarget = null; interact = null; action = null; destTile = null;

  let npc = NPCS.find(n => Math.hypot(n.x - wx, n.y - wy) < 26);
  if (npc) {
    interact = { kind: 'shop', npc, pt: npc, range: npc.id === 'banker' ? 62 : 48 };
    walkTo(npc.x, npc.y, false);
    clickMark = { x: npc.x, y: npc.y, t: performance.now(), c: '#60d0ff' };
    return;
  }
  let spot = FISH_SPOTS.find(s => Math.hypot(s.x - wx, s.y - wy) < 26);
  if (spot) {
    interact = { kind: 'fish', pt: spot, range: 40 };
    walkTo(spot.x, spot.y, false);
    clickMark = { x: spot.x, y: spot.y, t: performance.now(), c: '#60d0ff' };
    return;
  }
  if (Math.hypot(RANGE_PT.x - wx, RANGE_PT.y - wy) < 26) {
    interact = { kind: 'cook', pt: RANGE_PT, range: 40 };
    walkTo(RANGE_PT.x, RANGE_PT.y, false);
    clickMark = { x: RANGE_PT.x, y: RANGE_PT.y, t: performance.now(), c: '#ff9f60' };
    return;
  }
  if (Math.hypot(FURNACE_PT.x - wx, FURNACE_PT.y - wy) < 28) {
    interact = { kind: 'smelt', pt: FURNACE_PT, range: 44 };
    walkTo(FURNACE_PT.x, FURNACE_PT.y, false);
    clickMark = { x: FURNACE_PT.x, y: FURNACE_PT.y, t: performance.now(), c: '#ff9f60' };
    return;
  }
  let rock = ROCKS.find(r => Math.hypot(r.x - wx, r.y - wy) < 24);
  if (rock) {
    interact = { kind: 'mine', pt: rock, rock, range: 40 };
    walkTo(rock.x, rock.y, false);
    clickMark = { x: rock.x, y: rock.y, t: performance.now(), c: '#c8a878' };
    return;
  }
  let best = null, bd = 26;
  loots.forEach(l => { const d = Math.hypot(l.x - wx, l.y - wy); if (d < bd) { bd = d; best = l; } });
  if (best) {
    lootTarget = best;
    walkTo(best.x, best.y, false);
    clickMark = { x: best.x, y: best.y, t: performance.now(), c: '#ffd23f' };
    return;
  }
  best = null; bd = 30;
  mobs.forEach(m => { const d = Math.hypot(m.x - wx, m.y - wy); if (d < bd) { bd = d; best = m; } });
  if (best) {
    target = best;
    player.nextRepath = 0;
    clickMark = { x: best.x, y: best.y, t: performance.now(), c: '#ff6060' };
    msg('You attack the ' + MOBS[best.type].name + '...');
    tutAdvance(0);
    return;
  }
  // plain tile walk
  walkTo(wx, wy, true);
});

// ---------- GAME LOOP ----------
let lastT = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;

  for (let i = respawns.length - 1; i >= 0; i--) {
    if (now >= respawns[i].t) { spawnMob(respawns[i].type, respawns[i].region); respawns.splice(i, 1); }
  }
  loots = loots.filter(l => now - l.t < 90000);
  if (lootTarget && !loots.includes(lootTarget)) lootTarget = null;

  // chase target: re-path periodically while out of attack range
  if (target) {
    if (!mobs.includes(target)) target = null;
    else if (dist(player, target) > 40 && now >= player.nextRepath) {
      walkTo(target.x, target.y, false);
      player.nextRepath = now + 400;
    }
  }

  // follow path tile-by-tile
  player.moving = player.path.length > 0;
  if (player.moving) {
    const wp = player.path[0];
    const pd = Math.hypot(wp.x - player.x, wp.y - player.y);
    const sp = 150 * dt;
    if (pd <= sp) {
      player.x = wp.x; player.y = wp.y;
      player.path.shift();
    } else {
      player.x += (wp.x - player.x) / pd * sp;
      player.y += (wp.y - player.y) / pd * sp;
    }
    if (Math.abs(wp.x - player.x) > 2) player.face = wp.x > player.x ? 1 : -1;
  }
  if (target) player.face = target.x >= player.x ? 1 : -1;

  cam.x = clamp(player.x - W / 2, 0, WW - W);
  cam.y = clamp(player.y - H / 2, 0, WH - H);

  // interactions trigger as soon as we're in range
  if (interact && dist(player, interact.pt) <= interact.range) {
    player.path = [];
    if (interact.kind === 'shop') {
      msg(interact.npc.line, '#60d0ff');
      openShop(interact.npc.shop);
    } else if (interact.kind === 'fish') {
      startFishing(interact.pt);
    } else if (interact.kind === 'cook') {
      startCooking();
    } else if (interact.kind === 'mine') {
      startMining(interact.rock);
    } else if (interact.kind === 'smelt') {
      startSmelting();
    }
    interact = null;
  }

  // skilling ticks
  if (action && dist(player, action.pt) <= 50) {
    if (now >= action.next) {
      const kind = action.kind;
      if (kind === 'fish') doFish(now);
      else if (kind === 'cook') doCook(now);
      else if (kind === 'mine') doMine(now);
      else if (kind === 'smelt') doSmelt(now);
      const delays = { fish: 2400, cook: 2000, mine: 2600, smelt: 1800 };
      if (action) action.next = now + (delays[kind] || 2000);
    }
  } else if (action) action = null;

  // loot pickup
  if (lootTarget && dist(player, lootTarget) <= 22) {
    player.path = [];
    const names = [];
    for (const id in lootTarget.items) {
      addItem(id, lootTarget.items[id]);
      names.push(lootTarget.items[id] + '× ' + ITEMS[id].name);
    }
    msg('You pick up: ' + (names.join(', ') || 'nothing') + '.', '#ffd23f');
    sfx('loot');
    loots = loots.filter(l => l !== lootTarget);
    lootTarget = null;
    tutAdvance(2);
  }

  // player attacks
  if (target && dist(player, target) <= 40) {
    player.path = [];
    if (now >= player.nextAtk) {
      playerAttack(target, now);
      player.nextAtk = now + 1800;
      player.lastCombat = now;
    }
  }

  // mobs
  mobs.forEach(m => {
    const md = MOBS[m.type];
    m.moving = false;
    if (m.engaged) {
      const d = dist(m, player);
      m.face = player.x >= m.x ? 1 : -1;
      if (d > 300) { m.engaged = false; m.dx = m.hx; m.dy = m.hy; }
      else if (d > 36) {
        const sp = Math.min(110 * dt, d);
        const nx = m.x + (player.x - m.x) / d * sp;
        const ny = m.y + (player.y - m.y) / d * sp;
        // "dumb" chase: monsters walk straight at the player with NO pathfinding,
        // but they DO collide with walls — so ducking behind a wall makes them
        // bump into it and get stuck instead of clipping through.
        let moved = false;
        if (tileWalkable(tileOf(nx), tileOf(ny))) { m.x = nx; m.y = ny; moved = true; }
        else {                                   // blocked head-on: try sliding one axis
          if (tileWalkable(tileOf(nx), tileOf(m.y))) { m.x = nx; moved = true; }
          if (tileWalkable(tileOf(m.x), tileOf(ny))) { m.y = ny; moved = true; }
        }
        m.moving = moved;                        // if fully blocked, it just shuffles in place
      } else if (now >= m.nextAtk) {
        mobAttack(m, now);
        m.nextAtk = now + md.aspd;
      }
    } else if (md.aggro && player.hp > 0 && dist(m, player) < md.aggro) {
      // aggressive monster spots the player and gives chase
      m.engaged = true;
      if (!m._roared || now - m._roared > 8000) {
        msg('The ' + md.name + ' turns on you!', '#ff8060');
        m._roared = now;
      }
    } else {
      if (now >= m.nextWander) {
        const r = REGIONS[m.region];
        m.dx = clamp(m.hx + rnd(90) - 45, r.x + 20, r.x + r.w - 20);
        m.dy = clamp(m.hy + rnd(90) - 45, r.y + 20, r.y + r.h - 20);
        m.nextWander = now + 2500 + rnd(4000);
      }
      const d = Math.hypot(m.dx - m.x, m.dy - m.y);
      if (d > 2) {
        const sp = Math.min(40 * dt, d);
        m.x += (m.dx - m.x) / d * sp;
        m.y += (m.dy - m.y) / d * sp;
        m.moving = true;
        if (Math.abs(m.dx - m.x) > 2) m.face = m.dx > m.x ? 1 : -1;
      }
    }
  });

  // hp regen
  if (player.hp < maxHp() && now - player.lastCombat > 6000) {
    player._regen = (player._regen || 0) + dt;
    if (player._regen >= 4) { player._regen = 0; player.hp++; renderStats(); }
  }

  // expire potion boosts
  for (const skill in player.boosts) {
    if (now >= player.boosts[skill].until) {
      delete player.boosts[skill];
      msg('Your ' + SKILL_NAMES[skill] + ' boost wears off.', '#b8a888');
      renderStats();
    }
  }

  splats = splats.filter(s => now - s.t < 900);
  if (clickMark && now - clickMark.t > 500) clickMark = null;

  draw(now);
  requestAnimationFrame(tick);
}

// ---------- UI PANELS ----------
function statCell(icon, label, skill) {
  const base = baseLvl(skill), b = boostOf(skill);
  const val = b ? '<span style="color:#7fff7f">' + (base + b) + '</span>' : base;
  return '<div class="stat"><small>' + icon + ' ' + label + '</small> ' + val + '</div>';
}
function renderStats() {
  const el = document.getElementById('topstats');
  el.innerHTML =
    '<div id="hpbarwrap"><small>Hitpoints</small> <b style="color:#ffd23f">' + player.hp + ' / ' + maxHp() + '</b>' +
    '<div id="hpbar"><div id="hpfill" style="width:' + (100 * player.hp / maxHp()) + '%"></div></div></div>' +
    statCell('⚔️', 'Attack', 'atk') +
    statCell('💪', 'Strength', 'str') +
    statCell('🛡️', 'Defence', 'def') +
    statCell('⛏️', 'Mining', 'mine') +
    statCell('🎣', 'Fishing', 'fish') +
    statCell('🍳', 'Cooking', 'cook') +
    '<div class="stat"><small>🪙 Coins</small> ' + (player.inv.coins || 0).toLocaleString() + '</div>';
}
function openShop(shopId) {
  openVendor = shopId;
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  renderPanel();
}
function renderPanel() {
  const p = document.getElementById('panel');
  if (openVendor === 'bank') { renderBank(p); return; }
  if (openVendor) { renderShop(p); return; }
  if (activeTab === 'inv') {
    const SLOTS = [['helm','Helm'],['weapon','Weapon'],['body','Body'],['shield','Shield'],['legs','Legs']];
    let h = '<div class="eqrow">';
    SLOTS.forEach(([slot, lbl]) => {
      const id = player.equip[slot];
      h += '<div class="eqslot" data-uneq="' + slot + '"><span class="lbl">' + lbl + '</span><br>';
      h += id ? '<span class="ic">' + ITEMS[id].icon + '</span>'
              : '<span style="color:#6e6250">—</span>';
      h += '</div>';
    });
    h += '</div><div id="invgrid">';
    const ids = Object.keys(player.inv).filter(id => player.inv[id] > 0);
    if (!ids.length) h += '<div style="grid-column:span 4;color:#b8a888;padding:12px;text-align:center">Your backpack is empty.<br>Go slay something!</div>';
    ids.forEach(id => {
      const it = ITEMS[id];
      let act = '';
      if (it.heal) act = ' — click to eat (+' + it.heal + ' HP)';
      else if (it.atk || it.def) act = ' — click to equip';
      h += '<div class="islot" data-item="' + id + '" title="' + it.name + act + '">' +
        '<span class="qty">' + player.inv[id] + '</span><span class="ic">' + it.icon + '</span>' +
        '<span class="nm">' + it.name + '</span></div>';
    });
    h += '</div><div class="hint">🍖 Click food to eat it. 🗡️ Click gear to equip it. Sell loot to Alaric, store treasures in the castle bank, and cook raw fish at the campfire.</div>';
    p.innerHTML = h;
    p.querySelectorAll('.islot').forEach(s => s.onclick = () => useItem(s.dataset.item));
    p.querySelectorAll('.eqslot').forEach(s => s.onclick = () => unequip(s.dataset.uneq));
  } else if (activeTab === 'smith') {
    const RECIPES = [['helm',1,'⛑️'],['sword',2,'🗡️'],['shield',3,'🛡️'],['legs',3,'👖'],['armor',4,'🛡️']];
    let h = '<h4>⚒️ Anvil — forge gear from bars <small style="color:#b8a888">(Smithing ' + smithLvl() + ')</small></h4>';
    TIERS.forEach(t => {
      const bar2 = t.id + '_bar', have = player.inv[bar2] || 0;
      RECIPES.forEach(([kind, need, ic]) => {
        const out = t.id + '_' + kind;
        h += '<div class="row"><span>' + ic + '</span><span class="grow">' + ITEMS[out].name +
          ' <small style="color:#b8a888">(' + need + '× ' + t.name + ' bar — have ' + have + ')</small></span>' +
          '<button class="btn" data-smith="' + out + '" data-bar="' + bar2 + '" data-need="' + need + '" data-pow="' + t.pow + '"' +
          (have < need ? ' disabled' : '') + '>Forge</button></div>';
      });
    });
    h += '<div class="hint">Bars come from smelting ore at the furnace, or as monster drops. Forging trains Smithing.</div>';
    p.innerHTML = h;
    p.querySelectorAll('[data-smith]').forEach(b => b.onclick = () => {
      const need = +b.dataset.need;
      if (removeItem(b.dataset.bar, need)) {
        addItem(b.dataset.smith, 1);
        grantXp('smith', Math.round(+b.dataset.pow * need * 3));
        sfx('mine');
        msg('🔨 You hammer the bars into a ' + ITEMS[b.dataset.smith].name + '!', '#8fd0ff');
        tutAdvance(4);
      }
    });
  } else if (activeTab === 'stats') {
    renderSkillsPanel(p);
  } else if (activeTab === 'settings') {
    renderSettingsPanel(p);
  }
}
function renderShop(p) {
  const shop = SHOPS[openVendor];
  let h = '<h4>' + shop.title + '</h4>';
  h += '<h4 style="color:#b8a888;font-weight:normal">Buy:</h4>';
  shop.stock.forEach(s => {
    const it = ITEMS[s.id];
    h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name +
      (it.heal ? ' <small style="color:#b8a888">(heals ' + it.heal + ')</small>' : '') + '</span>' +
      '<span style="color:#ffd23f;font-size:11px">' + s.price + ' gp</span>' +
      '<button class="btn" data-buy="' + s.id + '" data-price="' + s.price + '" data-q="1"' +
      ((player.inv.coins || 0) < s.price ? ' disabled' : '') + '>Buy</button>';
    if (s.bulk) {
      h += '<button class="btn" data-buy="' + s.id + '" data-price="' + (s.price * s.bulk) + '" data-q="' + s.bulk + '"' +
        ((player.inv.coins || 0) < s.price * s.bulk ? ' disabled' : '') + '>×' + s.bulk + '</button>';
    }
    h += '</div>';
  });
  h += '<h4 style="color:#b8a888;font-weight:normal">Sell:</h4>';
  const ids = Object.keys(player.inv).filter(id => id !== 'coins' && player.inv[id] > 0 && ITEMS[id].sell > 0);
  if (!ids.length) h += '<div class="hint">Nothing to sell.</div>';
  ids.forEach(id => {
    const it = ITEMS[id], q = player.inv[id];
    h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name + ' ×' + q +
      ' <small style="color:#ffd23f">(' + it.sell + ' gp ea)</small></span>' +
      '<button class="btn" data-sell="' + id + '" data-q="1">Sell 1</button>' +
      '<button class="btn" data-sell="' + id + '" data-q="' + q + '">All</button></div>';
  });
  h += '<div style="margin-top:8px"><button class="btn" id="shopclose" style="width:100%;padding:6px">Leave shop</button></div>';
  p.innerHTML = h;
  p.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
    const id = b.dataset.sell, q = Math.min(+b.dataset.q, player.inv[id] || 0);
    if (q > 0 && removeItem(id, q)) {
      addItem('coins', ITEMS[id].sell * q);
      msg('You sell ' + q + '× ' + ITEMS[id].name + ' for ' + (ITEMS[id].sell * q) + ' gp.', '#ffd23f');
      tutAdvance(3);
    }
  });
  p.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    if (removeItem('coins', +b.dataset.price)) {
      addItem(b.dataset.buy, +b.dataset.q);
      msg('You buy ' + b.dataset.q + '× ' + ITEMS[b.dataset.buy].name + '.', '#8fd0ff');
      if ((player.inv.fishing_rod || 0) > 0 && (player.inv.bait || 0) > 0) tutAdvance(6);
    }
  });
  document.getElementById('shopclose').onclick = closeShop;
}
function renderBank(p) {
  let h = '<h4>🏦 Bank of Emberfall</h4>';
  h += '<h4 style="color:#b8a888;font-weight:normal">Vault:</h4>';
  const bids = Object.keys(bank).filter(id => bank[id] > 0);
  if (!bids.length) h += '<div class="hint">Your vault is empty.</div>';
  bids.forEach(id => {
    const it = ITEMS[id], q = bank[id];
    h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name + ' ×' + q + '</span>' +
      '<button class="btn" data-wd="' + id + '" data-q="1">Take 1</button>' +
      '<button class="btn" data-wd="' + id + '" data-q="' + q + '">All</button></div>';
  });
  h += '<h4 style="color:#b8a888;font-weight:normal">Backpack:</h4>';
  const iids = Object.keys(player.inv).filter(id => id !== 'coins' && player.inv[id] > 0);
  if (iids.length) h += '<div class="row"><span class="grow" style="color:#b8a888">Store everything</span>' +
    '<button class="btn" id="depall">Deposit all</button></div>';
  if (!iids.length) h += '<div class="hint">Your backpack is empty.</div>';
  iids.forEach(id => {
    const it = ITEMS[id], q = player.inv[id];
    h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name + ' ×' + q + '</span>' +
      '<button class="btn" data-dep="' + id + '" data-q="1">Store 1</button>' +
      '<button class="btn" data-dep="' + id + '" data-q="' + q + '">All</button></div>';
  });
  h += '<div style="margin-top:8px"><button class="btn" id="shopclose" style="width:100%;padding:6px">Leave bank</button></div>';
  p.innerHTML = h;
  p.querySelectorAll('[data-dep]').forEach(b => b.onclick = () => {
    const id = b.dataset.dep, q = Math.min(+b.dataset.q, player.inv[id] || 0);
    if (q > 0 && removeItem(id, q)) {
      bank[id] = (bank[id] || 0) + q;
      msg('You store ' + q + '× ' + ITEMS[id].name + ' in the vault.', '#8fd0ff');
      tutAdvance(9);
      renderPanel();
    }
  });
  const depAll = document.getElementById('depall');
  if (depAll) depAll.onclick = () => {
    let n = 0;
    Object.keys(player.inv).forEach(id => {
      if (id === 'coins') return;
      const q = player.inv[id];
      if (q > 0) { bank[id] = (bank[id] || 0) + q; delete player.inv[id]; n += q; }
    });
    if (n) { msg('You deposit everything into the vault.', '#8fd0ff'); tutAdvance(9); renderPanel(); renderStats(); }
  };
  p.querySelectorAll('[data-wd]').forEach(b => b.onclick = () => {
    const id = b.dataset.wd, q = Math.min(+b.dataset.q, bank[id] || 0);
    if (q > 0) {
      bank[id] -= q;
      if (bank[id] <= 0) delete bank[id];
      addItem(id, q);
      msg('You withdraw ' + q + '× ' + ITEMS[id].name + '.', '#8fd0ff');
      renderPanel();
    }
  });
  document.getElementById('shopclose').onclick = closeShop;
}
function closeShop() {
  openVendor = null;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.tab === activeTab));
  renderPanel();
}
function useItem(id) {
  const it = ITEMS[id];
  if (it.boost) {
    if (removeItem(id, 1)) {
      player.boosts[it.boost.skill] = { amt: it.boost.amt, until: performance.now() + it.boost.dur };
      sfx('level');
      msg('You drink the ' + it.name + '. +' + it.boost.amt + ' ' + SKILL_NAMES[it.boost.skill] + ' for a while.', '#8fff8f');
      renderStats();
    }
  } else if (it.heal) {
    if (player.hp >= maxHp()) { msg('You are already at full health.'); return; }
    if (removeItem(id, 1)) {
      player.hp = Math.min(maxHp(), player.hp + it.heal);
      msg('You eat the ' + it.name + '. It heals ' + it.heal + ' HP.', '#8fff8f');
      renderStats();
    }
  } else if (it.slot) {
    const slot = it.slot;
    if (removeItem(id, 1)) {
      if (player.equip[slot]) addItem(player.equip[slot], 1);
      player.equip[slot] = id;
      msg('You equip the ' + it.name + '.', '#8fd0ff');
      renderPanel(); renderStats();
      if (slot === 'weapon') tutAdvance(5);
    }
  } else if (id.startsWith('raw_')) {
    msg('You should cook that first — use the campfire east of the store.');
  } else if (id.endsWith('_ore')) {
    msg(it.name + ': smelt it into a bar at the furnace by the store.');
  } else {
    msg(it.name + ': sell it, or smith with it at the Anvil.');
  }
}
function unequip(slot) {
  if (!player.equip[slot]) return;
  addItem(player.equip[slot], 1);
  msg('You remove the ' + ITEMS[player.equip[slot]].name + '.');
  player.equip[slot] = null;
  renderPanel(); renderStats();
}

// ---------- SKILLS & SETTINGS PANELS ----------
function renderSkillsPanel(p) {
  const rows = [
    ['⚔️','atk'], ['💪','str'], ['🛡️','def'], ['❤️','hp'],
    ['🎣','fish'], ['🍳','cook'], ['⛏️','mine'], ['🔨','smith'],
  ];
  let total = 0;
  let h = '<h4>📊 Skills</h4>';
  rows.forEach(([ic, sk]) => {
    const lvl = baseLvl(sk); total += lvl;
    const cur = player.xp[sk] | 0;
    const atMax = lvl >= 99;
    const next = atMax ? cur : xpForLevel(lvl + 1);
    const pct = atMax ? 100 : clamp(100 * (cur - xpForLevel(lvl)) / (next - xpForLevel(lvl)), 0, 100);
    h += '<div class="row" style="flex-direction:column;align-items:stretch;gap:2px">' +
      '<div style="display:flex;gap:6px"><span>' + ic + '</span>' +
      '<span class="grow" style="color:#ffd23f">' + SKILL_NAMES[sk] + ' — level ' + lvl + '</span>' +
      '<small style="color:#b8a888">' + cur.toLocaleString() + (atMax ? ' xp (max)' : ' / ' + next.toLocaleString() + ' xp') + '</small></div>' +
      '<div style="height:5px;background:#2a2418;border-radius:2px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:#3fa7a0"></div></div></div>';
  });
  h += '<div class="hint">Total level: <b style="color:#ffd23f">' + total + '</b> / 792. Combat uses Attack (accuracy), Strength (damage) and Defence (blocking).</div>';
  p.innerHTML = h;
}
function renderSettingsPanel(p) {
  let h = '<h4>⚙️ Settings</h4>';
  h += '<div class="row"><span>🔊</span><span class="grow">Sound effects</span>' +
    '<button class="btn" id="mutebtn">' + (muted ? 'Off' : 'On') + '</button></div>';
  h += '<div class="row"><span>💾</span><span class="grow">Save progress now</span>' +
    '<button class="btn" id="savebtn">Save</button></div>';
  h += '<div class="row"><span>⚠️</span><span class="grow" style="color:#ff9f60">Delete save & restart</span>' +
    '<button class="btn" id="resetbtn" style="border-color:#a04030">Reset</button></div>';
  h += '<div class="hint">Progress autosaves every few seconds and when you close the tab.</div>';
  p.innerHTML = h;
  document.getElementById('mutebtn').onclick = () => { muted = !muted; if (!muted) sfx('level'); renderPanel(); save(); };
  document.getElementById('savebtn').onclick = () => { save(); msg('Progress saved.', '#8fff8f'); };
  document.getElementById('resetbtn').onclick = () => {
    if (confirm('Delete your save and start a brand new character? This cannot be undone.')) {
      try { localStorage.removeItem(SAVE_KEY); localStorage.removeItem('emberfall_save_v2'); localStorage.removeItem('emberfall_save_v1'); } catch (e) {}
      location.reload();
    }
  };
}

// ---------- SOUND (tiny Web Audio blips, no assets) ----------
let audioCtx = null;
function sfx(type) {
  if (muted) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const specs = {
      hit:   { f: 220, f2: 90,  d: 0.12, type: 'square',   g: 0.16 },
      miss:  { f: 140, f2: 120, d: 0.08, type: 'triangle', g: 0.08 },
      loot:  { f: 660, f2: 990, d: 0.14, type: 'sine',     g: 0.14 },
      level: { f: 523, f2: 1046,d: 0.30, type: 'sine',     g: 0.16 },
      mine:  { f: 300, f2: 160, d: 0.10, type: 'square',   g: 0.12 },
      die:   { f: 300, f2: 60,  d: 0.5,  type: 'sawtooth', g: 0.18 },
    };
    const s = specs[type] || specs.hit;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.f, now);
    osc.frequency.exponentialRampToValueAtTime(s.f2, now + s.d);
    gain.gain.setValueAtTime(s.g, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + s.d);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(now); osc.stop(now + s.d);
  } catch (e) { /* audio unavailable */ }
}

// ---------- TUTORIAL ----------
const tutEl = document.getElementById('tut');
function renderTut() {
  if (tutStep >= TUT.length) { tutEl.style.display = 'none'; return; }
  tutEl.style.display = 'flex';
  tutEl.innerHTML = '<span class="step">Tutorial ' + (tutStep + 1) + '/' + TUT.length + '</span>' +
    '<span class="grow">' + TUT[tutStep] + '</span><button class="btn" id="tutskip">Skip</button>';
  document.getElementById('tutskip').onclick = () => {
    tutStep = TUT.length; renderTut();
    msg('Tutorial skipped. Good luck, adventurer!', '#b8a888');
  };
}
function tutAdvance(n) {
  if (tutStep !== n) return;
  tutStep++;
  if (tutStep >= TUT.length) msg('🎓 Tutorial complete! Grow stronger, then brave the Old Crypt to the north-east.', '#ffd23f');
  renderTut();
}

// ---------- SAVE / LOAD ----------
const SAVE_KEY = 'emberfall_save_v3';
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      xp: player.xp, inv: player.inv, equip: player.equip, hp: player.hp, tutStep, bank, muted,
      px: Math.round(player.x), py: Math.round(player.y),
    }));
  } catch (e) { /* storage unavailable — session only */ }
}
// old saves used the quadratic curve; convert each skill's old level into new-curve XP so levels are preserved
function migrateXp(oldXp) {
  const oldLvlOf = xp => Math.min(99, Math.floor(Math.sqrt((xp || 0) / 30)) + 1);
  const out = {};
  for (const k in (oldXp || {})) out[k] = xpForLevel(oldLvlOf(oldXp[k]));
  return out;
}
function load() {
  try {
    let s = JSON.parse(localStorage.getItem(SAVE_KEY)), migrate = false;
    if (!s) {
      const old = JSON.parse(localStorage.getItem('emberfall_save_v2')) ||
                  JSON.parse(localStorage.getItem('emberfall_save_v1'));
      if (old) { s = old; migrate = true; }
    }
    if (s) {
      player.xp = Object.assign({}, XP0, migrate ? migrateXp(s.xp) : (s.xp || {}));
      if (player.xp.hp < HP_START_XP) player.xp.hp = HP_START_XP;
      player.inv = s.inv || { coins: 0 };
      // migrate equipment: old {weapon, armor} → new slots; 'armor' is now 'body'
      const eq = Object.assign({}, EQUIP0, s.equip || {});
      if (eq.armor) { eq.body = eq.body || eq.armor; delete eq.armor; }
      // drop any stored id that no longer maps to a real gear slot
      for (const slot in EQUIP0) {
        const id = eq[slot];
        if (id && !(ITEMS[id] && ITEMS[id].slot === slot)) eq[slot] = null;
      }
      player.equip = eq;
      bank = s.bank || {};
      muted = !!s.muted;
      tutStep = s.tutStep === undefined ? 0 : s.tutStep;
      player.hp = Math.min(s.hp || maxHp(), maxHp());
      if (s.px !== undefined) {
        const t = nearestWalkable(tileOf(s.px), tileOf(s.py));
        if (t) { player.x = centerOf(t[0]); player.y = centerOf(t[1]); }
      }
      return true;
    }
  } catch (e) {}
  return false;
}

// ---------- BOOT ----------
document.querySelectorAll('.tab').forEach(t => t.onclick = () => {
  activeTab = t.dataset.tab;
  openVendor = null;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
  renderPanel();
});

buildWalkGrid();
const hadSave = load();
if (!hadSave) {
  const st = nearestWalkable(tileOf(SPAWN_PT.x), tileOf(SPAWN_PT.y));
  if (st) { player.x = centerOf(st[0]); player.y = centerOf(st[1]); }
}
buildWorld();
SPAWNS.forEach(([type, region]) => spawnMob(type, region));
cam.x = clamp(player.x - W / 2, 0, WW - W);
cam.y = clamp(player.y - H / 2, 0, WH - H);
renderStats(); renderPanel(); renderTut();
if (hadSave) msg('Welcome back to Emberfall! Your progress was restored.', '#ffd23f');
else {
  msg('Welcome to Emberfall!', '#ffd23f');
  msg('You stand in Lumshire Village. The castle to the north houses the bank — enter through the south gate.');
  msg('Click any tile to walk there — your character finds the way around walls and water.');
}
setInterval(save, 8000);
window.addEventListener('beforeunload', save);
requestAnimationFrame(tick);
