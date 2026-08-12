const fresh = {
  name: 'Wanderer',
  x: 174,
  y: 44,
  hp: 10,
  maxHp: 10,
  gold: 30,
  xp: {
    Attack: 0,
    Strength: 0,
    Defence: 0,
    Ranged: 0,
    Magic: 0,
    Prayer: 0,
    Slayer: 0,
    Crafting: 0,
    Thieving: 0,
    Herblore: 0,
    Farming: 0,
    Hunter: 0,
    Fletching: 0,
    Hitpoints: 0,
    Fishing: 0,
    Cooking: 0,
    Mining: 0,
    Smithing: 0,
    Woodcutting: 0,
    Firemaking: 0,
  },
  inv: { bread: 2 },
  equipment: { weapon: 'sword', armor: null, shield: null, gloves: null },
  combatStyle: 'accurate',
  selectedSpell: 'emberStrike',
  activePrayer: null,
  prayerPoints: 1,
  runEnergy: 100,
  runEnabled: false,
  specEnergy: 100,
  specArmed: false,
  nextAttackTick: 0,
  bank: {},
  story: { q: 0, step: 0 },
  tutorialStage: 0,
  contract: null,
  grave: null,
  farm: {},
  homeTeleportAt: 0,
  roadsideBlessAt: 0,
  poison: 0,
  poisonNext: 0,
  discoveredRegions: { Heartwood: true },
  explorerRewarded: false,
  barrowRoom: 0,
  barrowOrder: null,
  barrowVia: null,
  kessaConfronted: false,
  chestLooted: false,
  gambitRumors: [],
  gambitFetch: null,
  barrowRuns: 0,
  wardenKillsClaimed: 0,
  barrowRunStartedAt: 0,
  barrowBestMs: 0,
  barrowLastMs: 0,
  barrowPotential: 0,
  barrowBestPotential: 0,
  collection: { barrow: { cloak: false, guard: false, lantern: false } },
  barrowLore: {},
  kills: 0,
  killLog: {},
  sideQuests: {
    boarHunt: { step: 0, kills: 0 },
    silkAndCinders: { step: 0, kills: 0 },
    brokenRoad: { step: 0, kills: 0 },
    hearthAndHome: { step: 0 },
    cureMirehaven: { step: 0 },
  },
  tally: {},
  starterClaimed: {},
};
let player = Object.assign(
    structuredClone(fresh),
    JSON.parse(localStorage.getItem('emberfall-ef1') || 'null') || {},
  ),
  path = [],
  destination = null,
  pending = null,
  tickCount = 0,
  combat = null,
  drops = [],
  activeTab = 'inventory',
  bankAmount = 'all';
const ADMIN_CODE = '1234'; // passcode to enter admin mode
let journalTab = 'quests';
let admin = false;
try {
  admin = localStorage.getItem('emberfall-ef1-admin') === '1';
} catch (e) {}
if (player.visualGroundVersion !== 3) {
  // World rebuilt (5x, new regions) — move any existing save to the new Greenrest spawn.
  player.x = fresh.x;
  player.y = fresh.y;
  player.visualGroundVersion = 3;
  localStorage.setItem('emberfall-ef1', JSON.stringify(player));
}
player.drawX = player.x;
player.drawY = player.y;
player.facing = 'south';
let moveSegment = null,
  lastMoveFrame = performance.now(),
  energyCarry = 0;
const WALK_TILE_MS = 185,
  RUN_TILE_MS = 105;
if (!player.story) player.story = { q: 0, step: 0 };
if (player.tutorialStage === undefined)
  player.tutorialStage = player.story.q > 0 || player.story.step > 0 ? 3 : 0;
if (player.contract === undefined) player.contract = null;
if (player.grave === undefined) player.grave = null;
if (player.activeQuestKey === undefined) player.activeQuestKey = null;
if (!player.farm) player.farm = {};
if (!player.homeTeleportAt) player.homeTeleportAt = 0;
if (!player.roadsideBlessAt) player.roadsideBlessAt = 0;
if (!player.poison) player.poison = 0;
if (!player.poisonNext) player.poisonNext = 0;
if (!player.discoveredRegions) player.discoveredRegions = { Heartwood: true };
if (player.explorerRewarded === undefined) player.explorerRewarded = false;
if (!player.barrowRoom) player.barrowRoom = 0;
if (!player.barrowOrder || !player.barrowVia) {
  const gen = generateBarrowOrder();
  player.barrowOrder = gen.order;
  player.barrowVia = gen.via;
}
if (player.kessaConfronted === undefined) player.kessaConfronted = false;
syncBarrowDoors();
if (!player.equipment) player.equipment = { weapon: null, armor: null };
if (player.equipment.armor === undefined) player.equipment.armor = null;
if (player.equipment.shield === undefined) player.equipment.shield = null;
if (player.equipment.gloves === undefined) player.equipment.gloves = null;
if (player.equipment.helmet === undefined) player.equipment.helmet = null;
if (player.equipment.legs === undefined) player.equipment.legs = null;
if (player.equipment.charm === undefined) player.equipment.charm = null;
if (player.equipment.armor === 'shield' && !player.equipment.shield) {
  player.equipment.shield = 'shield';
  player.equipment.armor = null;
}
if (!player.combatStyle) player.combatStyle = 'accurate';
if (!player.selectedSpell) player.selectedSpell = 'emberStrike';
if (player.activePrayer === undefined) player.activePrayer = null;
if (player.prayerPoints === undefined) player.prayerPoints = 1;
if (player.runEnergy === undefined) player.runEnergy = 100;
if (player.runEnabled === undefined) player.runEnabled = false;
if (player.chestLooted === undefined) player.chestLooted = false;
if (player.barrowRuns === undefined) player.barrowRuns = player.chestLooted ? 1 : 0;
if (player.wardenKillsClaimed === undefined)
  player.wardenKillsClaimed = player.chestLooted ? player.killLog?.warden || 1 : 0;
if (!player.barrowRunStartedAt) player.barrowRunStartedAt = 0;
if (!player.barrowBestMs) player.barrowBestMs = 0;
if (!player.barrowLastMs) player.barrowLastMs = 0;
if (!player.barrowPotential) player.barrowPotential = 0;
if (!player.barrowBestPotential) player.barrowBestPotential = 0;
if (!player.collection)
  player.collection = { barrow: { cloak: !!player.chestLooted, guard: false, lantern: false } };
if (!player.collection.barrow)
  player.collection.barrow = { cloak: !!player.chestLooted, guard: false, lantern: false };
if (player.chestLooted) player.collection.barrow.cloak = true;
if (!player.barrowLore) player.barrowLore = {};
if (!player.killLog) player.killLog = {};
if (!player.sideQuests) player.sideQuests = {};
if (!player.sideQuests.boarHunt) player.sideQuests.boarHunt = { step: 0, kills: 0 };
if (!player.sideQuests.silkAndCinders) player.sideQuests.silkAndCinders = { step: 0, kills: 0 };
if (!player.sideQuests.brokenRoad) player.sideQuests.brokenRoad = { step: 0, kills: 0 };
if (!player.sideQuests.hearthAndHome) player.sideQuests.hearthAndHome = { step: 0 };
if (!player.sideQuests.cureMirehaven) player.sideQuests.cureMirehaven = { step: 0 };
if (!player.tally) player.tally = {};
if (!player.starterClaimed) player.starterClaimed = {};
if (player.specEnergy === undefined) player.specEnergy = 100;
if (player.specArmed === undefined) player.specArmed = false;
if (player.nextAttackTick === undefined) player.nextAttackTick = 0;
// Self-heal a save wedged on the intro fishing/cooking steps.
if (player.story.q === 0 && player.story.step === 2 && invCount('rawFish')) player.story.step = 3;
if (player.story.q === 0 && player.story.step === 3 && invCount('fish')) player.story.step = 4;
for (const k of [
  'Strength',
  'Defence',
  'Ranged',
  'Magic',
  'Prayer',
  'Slayer',
  'Crafting',
  'Thieving',
  'Herblore',
  'Farming',
  'Hunter',
  'Fletching',
  'Mining',
  'Smithing',
  'Woodcutting',
  'Firemaking',
])
  if (player.xp[k] === undefined) player.xp[k] = 0;
// ---- Multi-character save slots ----
// `emberfall-ef1` always holds the CURRENTLY ACTIVE character's live save (unchanged from
// before this existed). Slots are a separate index of characters; switching snapshots the
// active save into its slot, then copies the target slot's save into `emberfall-ef1` and
// reloads, so all the normal load/migration code above runs fresh for the new character.
function loadCharSlots() {
  try {
    return JSON.parse(localStorage.getItem('emberfall-ef1-slots') || '[]');
  } catch (e) {
    return [];
  }
}
function saveCharSlots(list) {
  try {
    localStorage.setItem('emberfall-ef1-slots', JSON.stringify(list));
  } catch (e) {}
}
function activeSlotId() {
  return localStorage.getItem('emberfall-ef1-active');
}
let charSlots = loadCharSlots();
if (!charSlots.length) {
  // First run of the slot system: wrap whatever save (or fresh character) is already active as Slot 1.
  const id = 'slot_' + Date.now();
  charSlots = [{ id, name: player.name || 'Wanderer', createdAt: Date.now(), lastPlayedAt: Date.now() }];
  saveCharSlots(charSlots);
  localStorage.setItem('emberfall-ef1-active', id);
  localStorage.setItem('emberfall-ef1-slot-' + id, JSON.stringify(player));
}
function persistActiveSlot() {
  save();
  const id = activeSlotId();
  if (!id) return;
  localStorage.setItem('emberfall-ef1-slot-' + id, localStorage.getItem('emberfall-ef1') || 'null');
  const slot = charSlots.find((s) => s.id === id);
  if (slot) {
    slot.lastPlayedAt = Date.now();
    saveCharSlots(charSlots);
  }
}
function switchToSlot(id) {
  if (id === activeSlotId()) return;
  persistActiveSlot();
  const data = localStorage.getItem('emberfall-ef1-slot-' + id);
  if (!data) return message('That character could not be found.', 'bad');
  localStorage.setItem('emberfall-ef1', data);
  localStorage.setItem('emberfall-ef1-active', id);
  const slot = charSlots.find((s) => s.id === id);
  if (slot) {
    slot.lastPlayedAt = Date.now();
    saveCharSlots(charSlots);
  }
  // Reassign the live player object too, not just localStorage: the `beforeunload` handler
  // calls save() during reload, and save() serializes whatever `player` currently points to.
  // Without this, that late save() would overwrite the slot data we just wrote with the old character.
  player = JSON.parse(data);
  location.reload();
}
function createNewCharacter() {
  const name = (prompt('Name your new character:', 'Wanderer') || '').trim();
  if (!name) return;
  persistActiveSlot();
  const id = 'slot_' + Date.now();
  const freshChar = structuredClone(fresh);
  freshChar.name = name;
  charSlots.push({ id, name, createdAt: Date.now(), lastPlayedAt: Date.now() });
  saveCharSlots(charSlots);
  localStorage.setItem('emberfall-ef1-slot-' + id, JSON.stringify(freshChar));
  localStorage.setItem('emberfall-ef1-active', id);
  localStorage.setItem('emberfall-ef1', JSON.stringify(freshChar));
  // See switchToSlot: reassign the live player object so a beforeunload save() during
  // reload can't clobber the fresh character's data with the old one still in memory.
  player = freshChar;
  location.reload();
}
function deleteCharSlot(id) {
  if (id === activeSlotId())
    return message('Switch to another character before deleting this one.', 'bad');
  const slot = charSlots.find((s) => s.id === id);
  if (!slot) return;
  if (!confirm(`Permanently delete "${slot.name}"? This cannot be undone.`)) return;
  localStorage.removeItem('emberfall-ef1-slot-' + id);
  charSlots = charSlots.filter((s) => s.id !== id);
  saveCharSlots(charSlots);
  openCharacterManager();
}
TREES.forEach((t) => {
  t.depletedUntil = 0;
  t.chops = 0;
});
let effects = [],
  projectiles = [],
  hazards = [],
  fires = [],
  lastActionAt = 0,
  actionDuration = 2400,
  lastRegion = '',
  skilling = null;
NPCS.forEach((n) => {
  n.homeX = n.x;
  n.homeY = n.y;
  n.drawX = n.x;
  n.drawY = n.y;
  n.fromX = n.x;
  n.fromY = n.y;
  n.moveAt = 0;
  n.pickpocketUntil = 0;
  n.speech = null;
  n.speechUntil = 0;
  if (n.wander === undefined) n.wander = 2; // EF1: every NPC gets a small roam radius
});
const monsters = MONSTER_SPAWNS.map(([kind, x, y], id) => ({
  id,
  kind,
  x,
  y,
  drawX: x,
  drawY: y,
  fromX: x,
  fromY: y,
  moveAt: 0,
  spawnX: x,
  spawnY: y,
  type: MONSTER_TYPES[kind],
  hp: MONSTER_TYPES[kind].hp,
  maxHp: MONSTER_TYPES[kind].hp,
  alive: true,
  respawn: 0,
  lastAttack: 0,
  attackAt: 0,
  enraged: false,
}));
const INVENTORY_SLOTS = 30;
let knownLevels = {},
  lastXp = {},
  saveStatusTimer = null;
// EF1: OSRS-style exponential XP curve (was a flat 1+sqrt(xp/50)).
// XP_TABLE[n] = total XP required to reach level n+1. Level 99 ~= 13,034,431 XP.
const XP_TABLE = (() => {
  const t = [0];
  let acc = 0;
  for (let lv = 1; lv < 99; lv++) {
    acc += Math.floor(lv + 300 * Math.pow(2, lv / 7));
    t.push(Math.floor(acc / 4));
  }
  return t;
})();
function xpForLevel(lv) {
  return XP_TABLE[Math.max(0, Math.min(98, lv - 1))];
}
function level(skill) {
  const xp = player.xp[skill] || 0;
  for (let lv = 98; lv >= 1; lv--) if (xp >= XP_TABLE[lv]) return lv + 1;
  return 1;
}
function equipmentDefence() {
  return Object.values(player.equipment).reduce(
    (sum, id) => sum + (id && ITEMS[id] ? ITEMS[id].defence || 0 : 0),
    0,
  );
}
function formatRunTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000)),
    m = Math.floor(total / 60),
    sec = total % 60,
    tenths = Math.floor((Math.max(0, ms) % 1000) / 100);
  return `${m}:${String(sec).padStart(2, '0')}.${tenths}`;
}
function combatLevel() {
  const base = (level('Defence') + level('Hitpoints') + Math.floor(level('Prayer') / 2)) / 4,
    melee = (level('Attack') + level('Strength')) * 0.325,
    ranged = level('Ranged') * 0.4875,
    magic = level('Magic') * 0.4875;
  return Math.max(3, Math.floor(base + Math.max(melee, ranged, magic)));
}
function syncLevels(silent = false) {
  for (const skill of Object.keys(player.xp)) {
    const current = level(skill),
      previous = knownLevels[skill] || current,
      xpNow = player.xp[skill] || 0,
      xpBefore = lastXp[skill] ?? xpNow;
    if (xpNow > xpBefore && !silent) showXpDrop(skill, xpNow - xpBefore);
    lastXp[skill] = xpNow;
    if (current > previous && !silent) {
      const banner = document.getElementById('levelBanner');
      banner.innerHTML = `<b>Level up!</b>${skill} is now level ${current}`;
      banner.classList.remove('show');
      void banner.offsetWidth;
      banner.classList.add('show');
      setTimeout(() => banner.classList.remove('show'), 2600);
      message(`Congratulations, your ${skill} level is now ${current}!`, 'good');
      if (window.SFX) SFX.play('level');
    }
    knownLevels[skill] = current;
  }
  const newMax = 9 + level('Hitpoints');
  if (newMax > player.maxHp) {
    player.hp = Math.min(newMax, player.hp + (newMax - player.maxHp));
    player.maxHp = newMax;
  } else player.maxHp = newMax;
}
function invCount(id) {
  return player.inv[id] || 0;
}
function canAdd(id) {
  return invCount(id) > 0 || Object.keys(player.inv).length < INVENTORY_SLOTS;
}
function add(id, n = 1, force = false) {
  if (n > 0 && !force && !canAdd(id)) return false;
  player.inv[id] = (player.inv[id] || 0) + n;
  if (player.inv[id] <= 0) delete player.inv[id];
  return true;
}
function save() {
  const clean = { ...player };
  delete clean.drawX;
  delete clean.drawY;
  localStorage.setItem('emberfall-ef1', JSON.stringify(clean));
  const status = document.getElementById('saveStatus');
  if (status) {
    status.textContent = 'Saved just now';
    status.classList.add('show');
    clearTimeout(saveStatusTimer);
    saveStatusTimer = setTimeout(() => status.classList.remove('show'), 1400);
  }
}
function message(text, kind = '') {
  const c = document.getElementById('chat'),
    time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  c.insertAdjacentHTML(
    'beforeend',
    `<div><span class="time">[${time}]</span> <span class="${kind}">${text}</span></div>`,
  );
  while (c.children.length > 120) c.firstElementChild.remove();
  c.scrollTop = c.scrollHeight;
}
// Tutorial overlay removed — starter quests now teach the skills. Kept as no-ops so
// existing call sites stay harmless.
function renderTutorial() {}
function advanceTutorial(stage) {}
function setPath(x, y, action = null) {
  const p = findPath(player.x, player.y, x, y);
  if (!p.length && !(player.x === x && player.y === y)) {
    message('I cannot reach that.', 'bad');
    return;
  }
  path = p;
  moveSegment = null;
  destination = p[p.length - 1] || { x, y };
  pending = action;
  combat = null;
  skilling = null;
  closeModal();
  if (p.length) advanceTutorial(0);
}
function tileDistance(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
function adjacent(a, b) {
  return tileDistance(a, b) <= 1;
}
function combatRange() {
  const w = ITEMS[player.equipment.weapon] || {};
  return w.range || 1;
}
function engageMonster(m) {
  skilling = null;
  combat = m;
  const range = combatRange(),
    dist = tileDistance(player, m);
  // dist >= 1: standing on the same tile as the target isn't a valid attack position.
  if (dist >= 1 && dist <= range) {
    path = [];
    moveSegment = null;
    pending = null;
    destination = null;
    message(`You attack the ${m.type.name}.`);
    return;
  }
  moveWithinRange(m, range, () => {
    combat = m;
    message(`You attack the ${m.type.name}.`);
  });
}
function moveWithinRange(target, range, action) {
  let best = null;
  for (let y = Math.max(0, target.y - range); y <= Math.min(MAP_H - 1, target.y + range); y++)
    for (let x = Math.max(0, target.x - range); x <= Math.min(MAP_W - 1, target.x + range); x++) {
      // Never path onto the target's own tile — standing on it isn't a valid attack position.
      if (x === target.x && y === target.y) continue;
      if (tileDistance({ x, y }, target) > range || !walkable(x, y)) continue;
      const p = findPath(player.x, player.y, x, y);
      if ((p.length || (player.x === x && player.y === y)) && (!best || p.length < best.length))
        best = p;
    }
  if (!best) return message('I cannot get into attack range.', 'bad');
  path = best;
  moveSegment = null;
  destination = best[best.length - 1] || { x: player.x, y: player.y };
  pending = action;
}
function moveAdjacent(target, action) {
  combat = null;
  // Don't wipe an in-progress skilling loop just because the player re-clicked the same
  // spot they're already working — the action's own guard (e.g. fish()/startMining()) decides
  // whether that's a no-op continuation or a genuinely new target. Only clear it when we
  // actually need to walk somewhere, which is a real change of activity.
  if (adjacent(player, target)) return action();
  skilling = null;
  let best = null;
  for (const [dX, dY] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    const x = target.x + dX,
      y = target.y + dY;
    if (!walkable(x, y)) continue;
    const p = findPath(player.x, player.y, x, y);
    if (p.length && (!best || p.length < best.length)) best = p;
  }
  if (!best) return message('I cannot get close enough.', 'bad');
  path = best;
  moveSegment = null;
  destination = best[best.length - 1];
  pending = action;
}
function movementFrame(now) {
  if (admin) {
    // Admin mode: always running, energy never drains.
    player.runEnabled = true;
    player.runEnergy = 100;
  }
  const dt = Math.min(100, now - lastMoveFrame),
    runningNow = !!moveSegment && moveSegment.running;
  if (!runningNow && player.runEnergy < 100) {
    energyCarry += dt / 1200;
    if (energyCarry >= 1) {
      const gain = Math.floor(energyCarry);
      player.runEnergy = Math.min(100, player.runEnergy + gain);
      energyCarry -= gain;
    }
  }
  if (!moveSegment && path.length) {
    const n = path.shift(),
      running = player.runEnabled && player.runEnergy >= 1;
    moveSegment = {
      sx: player.drawX,
      sy: player.drawY,
      tx: n.x,
      ty: n.y,
      start: now,
      duration: running ? RUN_TILE_MS : WALK_TILE_MS,
      running,
    };
    if (running && !admin) {
      player.runEnergy = Math.max(0, player.runEnergy - 1);
      if (player.runEnergy === 0) {
        player.runEnabled = false;
        message('You are out of run energy.', 'bad');
      }
    }
    const dx = n.x - player.x,
      dy = n.y - player.y;
    player.facing =
      Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'east' : 'west') : dy > 0 ? 'south' : 'north';
    player.x = n.x;
    player.y = n.y;
  }
  if (moveSegment) {
    const p = Math.min(1, (now - moveSegment.start) / moveSegment.duration),
      ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    player.drawX = moveSegment.sx + (moveSegment.tx - moveSegment.sx) * ease;
    player.drawY = moveSegment.sy + (moveSegment.ty - moveSegment.sy) * ease;
    if (p >= 1) {
      player.drawX = moveSegment.tx;
      player.drawY = moveSegment.ty;
      moveSegment = null;
      checkRegion();
      if (!path.length) {
        destination = null;
        const fn = pending;
        pending = null;
        if (fn) fn();
      }
    }
  }
  lastMoveFrame = now;
  requestAnimationFrame(movementFrame);
}
requestAnimationFrame(movementFrame);
function gameTick() {
  tickCount++;
  syncLevels();
  if (combat) combatTick();
  if (skilling) skillTick();
  prayerTick();
  poisonTick();
  hpRegenTick();
  specTick();
  hazardTick();
  resourceTick();
  npcTick();
  monsterTick();
  respawnTick();
  updateUI();
  if (tickCount % 10 === 0) save();
}
function maxPrayer() {
  return level('Prayer');
}
function specTick() {
  // Special-attack energy regenerates ~10% every 3 ticks (full in ~18s).
  if (player.specEnergy < 100 && tickCount % 3 === 0) {
    player.specEnergy = Math.min(100, player.specEnergy + 5);
  }
}
function toggleSpec() {
  const weapon = ITEMS[player.equipment.weapon] || {};
  if (!weapon.spec) return message('Your weapon has no special attack.', 'bad');
  if (player.specEnergy < 50)
    return message('Not enough special-attack energy (need 50%).', 'bad');
  player.specArmed = !player.specArmed;
  message(
    player.specArmed
      ? 'Special attack armed — your next hit unleashes it.'
      : 'Special attack disarmed.',
    'game',
  );
  updateUI();
}
function prayerTick() {
  if (!player.activePrayer) return;
  if (player.prayerPoints <= 0) {
    player.activePrayer = null;
    message('You have run out of Prayer points.', 'bad');
    renderPanel();
    return;
  }
  if (tickCount % 5 === 0) {
    player.prayerPoints--;
    if (player.prayerPoints <= 0) {
      player.activePrayer = null;
      message('Your prayer fades.', 'bad');
    }
    renderPanel();
  }
}
function hpRegenTick() {
  // 1 Hitpoint every 100 ticks (100 * 600ms = 60s), same pace regardless of combat state.
  if (player.hp <= 0 || player.hp >= player.maxHp) return;
  if (tickCount < (player.hpRegenNext || 0)) return;
  player.hpRegenNext = tickCount + 100;
  player.hp = Math.min(player.maxHp, player.hp + 1);
  updateUI();
}
function poisonTick() {
  if (!player.poison) return;
  if (admin) return (player.poison = 0);
  if (tickCount < player.poisonNext) return;
  player.poisonNext = tickCount + 10;
  player.poison--;
  player.hp = Math.max(0, player.hp - 1);
  effects.push({
    x: player.drawX,
    y: player.drawY,
    value: 1,
    color: '#72b94f',
    at: performance.now(),
  });
  message(
    `Poison damages you. ${player.poison ? player.poison + ' dose' + (player.poison === 1 ? '' : 's') + ' remain.' : 'The poison has worn off.'}`,
    player.poison ? 'bad' : 'good',
  );
  updateUI();
  if (player.hp <= 0) death();
}
function drinkAntidote() {
  if (!invCount('antidote')) return;
  add('antidote', -1);
  const was = player.poison;
  player.poison = 0;
  player.poisonNext = 0;
  message(
    was
      ? 'You drink the marsh antidote and cure the poison.'
      : 'You drink the antidote, but you were not poisoned.',
    was ? 'good' : 'game',
  );
  renderPanel();
  updateUI();
  save();
}
const PRAYERS = {
  strength: { name: 'Burst of Strength', level: 1, desc: '+2 melee damage.' },
  sharp: { name: 'Sharp Eye', level: 2, desc: '+2 melee accuracy.' },
  skin: { name: 'Thick Skin', level: 3, desc: '+2 melee defence.' },
  clarity: { name: 'Clarity of Thought', level: 7, desc: '+4 melee accuracy.' },
  steel: { name: 'Steel Skin', level: 10, desc: '+5 melee defence.' },
  might: { name: 'Ultimate Strength', level: 12, desc: '+5 melee damage.' },
  protect: { name: 'Protect from Melee', level: 15, desc: 'Halves incoming melee damage.' },
};
function togglePrayer(id) {
  const prayers = PRAYERS;
  const prayer = prayers[id];
  if (level('Prayer') < prayer.level)
    return message(`You need Prayer level ${prayer.level}.`, 'bad');
  if (player.activePrayer === id) {
    player.activePrayer = null;
    message(`${prayer.name} deactivated.`);
    renderPanel();
    return;
  }
  if (player.prayerPoints <= 0)
    return message('Recharge your Prayer points at the Frostmere altar.', 'bad');
  player.activePrayer = id;
  if (window.SFX) SFX.play('prayer');
  message(`${prayer.name} activated.`, 'good');
  renderPanel();
}
function buryBones() {
  if (!invCount('bones')) return;
  add('bones', -1);
  player.xp.Prayer += 15;
  tally('bury');
  effects.push({
    x: player.x,
    y: player.y,
    value: 'XP',
    color: '#d9dfef',
    at: performance.now(),
    xp: 15,
  });
  message('You bury the bones and offer a quiet prayer.', 'good');
  renderPanel();
}
function prayAtAltar() {
  player.prayerPoints = maxPrayer();
  message(`You recharge your Prayer points to ${player.prayerPoints}.`, 'good');
  renderPanel();
  updateUI();
}
function toggleRun() {
  advanceTutorial(4);
  if (player.runEnergy < 1 && !player.runEnabled)
    return message('You need more run energy.', 'bad');
  player.runEnabled = !player.runEnabled;
  message(`Run mode ${player.runEnabled ? 'enabled' : 'disabled'}.`, 'game');
  updateUI();
}
const MAP_TILE_COL = {
  0: '#4f7c37',
  1: '#a98c5c',
  2: '#367d9e',
  3: '#214a28',
  4: '#65645d',
  5: '#857158',
  6: '#654426',
  7: '#5f4a2c',
  8: '#d55d25',
  9: '#6f5f45',
  10: '#496a46',
  11: '#725238',
  12: '#d7e2ee',
  13: '#3a342e',
  14: '#d5622a',
};
function drawWorldMap() {
  const map = document.getElementById('worldMapCanvas'),
    c = map.getContext('2d'),
    sx = map.width / MAP_W,
    sy = map.height / MAP_H,
    icons = [],
    dot = (x, y, color, r = 3.2, ring) => {
      c.fillStyle = color;
      c.beginPath();
      c.arc(x * sx, y * sy, r, 0, 7);
      c.fill();
      if (ring) {
        c.strokeStyle = ring;
        c.lineWidth = 1.2;
        c.stroke();
      }
    },
    push = (x, y, label, wiki) => icons.push({ mx: x * sx, my: y * sy, label, wiki });
  c.clearRect(0, 0, map.width, map.height);
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++) {
      c.fillStyle = MAP_TILE_COL[tiles[y][x]] || '#4f7c37';
      c.fillRect(x * sx, y * sy, Math.ceil(sx), Math.ceil(sy));
    }
  // sealed dungeon vault tint
  c.fillStyle = '#0b0a1266';
  c.fillRect(8 * sx, 74 * sy, 26 * sx, 24 * sy);
  // resources
  for (const p of FISH_SPOTS) {
    dot(p.x, p.y, '#57c6df', 2.7);
    push(p.x, p.y, p.name, null);
  }
  for (const r of ROCKS) {
    dot(r.x, r.y, '#c8a06a', 2.7);
    push(r.x, r.y, r.name, null);
  }
  for (const hnt of HUNT_SPOTS) {
    dot(hnt.x, hnt.y, '#b58b57', 2.7);
    push(hnt.x, hnt.y, 'Rabbit burrow', null);
  }
  for (const t of TREES) {
    dot(t.x, t.y, '#4f9d3f', 2.5);
    push(t.x, t.y, t.name, null);
  }
  for (const p of FARM_PATCHES) dot(p.x, p.y, '#8fbd4d', 2.4);
  push(FARM_PATCHES[0].x, FARM_PATCHES[0].y, 'Greenrest farm', null);
  for (const [o, label] of [
    [FORGE, FORGE.name],
    [FURNACE, FURNACE.name],
    [ALTAR, ALTAR.name],
    [WORKBENCH, WORKBENCH.name],
    [CAULDRON, CAULDRON.name],
  ]) {
    dot(o.x, o.y, '#e0a24a', 3);
    push(o.x, o.y, label, null);
  }
  // barrow portals
  for (const p of PORTALS) {
    dot(p.x, p.y, '#b56cff', 3.4, '#eadcff');
    push(p.x, p.y, p.label, null);
  }
  // NPCs — clickable to the wiki
  for (const n of NPCS) {
    dot(n.x, n.y, '#67b9e8', 3.4, '#12324a');
    push(n.x, n.y, `${n.name} — ${n.role}`, 'npc-' + n.id);
  }
  // monsters — clickable to the wiki
  for (const m of monsters)
    if (m.alive) {
      dot(m.x, m.y, '#d95c52', 2.7);
      push(m.x, m.y, m.type.name, 'monster-' + m.kind);
    }
  for (const marker of questMarkers()) {
    const qn = NPCS.find((n) => n.id === marker.id);
    if (qn) {
      c.strokeStyle = marker.color;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(qn.x * sx, qn.y * sy, 7, 0, 7);
      c.stroke();
    }
  }
  const objective = activeQuestTarget();
  if (objective) {
    const ox = objective.x * sx,
      oy = objective.y * sy;
    c.strokeStyle = '#ffe268';
    c.fillStyle = '#ffe268';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(ox, oy, 9, 0, 7);
    c.stroke();
    c.beginPath();
    c.moveTo(ox, oy - 6);
    c.lineTo(ox + 6, oy);
    c.lineTo(ox, oy + 6);
    c.lineTo(ox - 6, oy);
    c.closePath();
    c.fill();
  }
  c.font = 'bold 13px Georgia';
  c.textAlign = 'center';
  c.lineWidth = 3;
  for (const [name, x, y] of [
    ['GREENREST VALE', 96, 112],
    ['PINEHOLT', 96, 54],
    ['FROSTMERE', 128, 18],
    ['THORNWOOD', 160, 58],
    ['CINDERFORGE', 160, 134],
    ['SABLEMARSH', 32, 116],
    ['ASHFALL WASTES', 30, 40],
    ['Ashen Barrow', 21, 72],
  ]) {
    c.strokeStyle = '#111';
    c.strokeText(name, x * sx, y * sy);
    c.fillStyle = name === 'Ashen Barrow' ? '#c9b7ef' : '#f1d795';
    c.fillText(name, x * sx, y * sy);
  }
  if (player.grave) {
    c.strokeStyle = '#eef4f1';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(player.grave.x * sx - 4, player.grave.y * sy - 4);
    c.lineTo(player.grave.x * sx + 4, player.grave.y * sy + 4);
    c.moveTo(player.grave.x * sx + 4, player.grave.y * sy - 4);
    c.lineTo(player.grave.x * sx - 4, player.grave.y * sy + 4);
    c.stroke();
  }
  c.fillStyle = '#ffe168';
  c.beginPath();
  c.arc(player.x * sx, player.y * sy, 5, 0, 7);
  c.fill();
  c.strokeStyle = '#3b2a0d';
  c.lineWidth = 2;
  c.stroke();
  window.mapIcons = icons;
}
function mapIconAt(e) {
  const map = document.getElementById('worldMapCanvas'),
    r = map.getBoundingClientRect(),
    cx = ((e.clientX - r.left) / r.width) * map.width,
    cy = ((e.clientY - r.top) / r.height) * map.height;
  let best = null,
    bd = 81; // within ~9px
  for (const ic of window.mapIcons || []) {
    const d = (ic.mx - cx) ** 2 + (ic.my - cy) ** 2;
    if (d < bd) {
      bd = d;
      best = ic;
    }
  }
  return best;
}
function mapHover(e) {
  const map = document.getElementById('worldMapCanvas'),
    tip = document.getElementById('mapTooltip'),
    ic = mapIconAt(e);
  if (ic) {
    tip.textContent = ic.label + (ic.wiki ? '  ·  click for wiki' : '');
    tip.classList.remove('hidden');
    const wrap = map.parentElement.getBoundingClientRect();
    tip.style.left = e.clientX - wrap.left + 14 + 'px';
    tip.style.top = e.clientY - wrap.top + 14 + 'px';
    map.style.cursor = ic.wiki ? 'pointer' : 'crosshair';
  } else {
    tip.classList.add('hidden');
    map.style.cursor = 'crosshair';
  }
}
function openWorldMap() {
  advanceTutorial(3);
  closeContext();
  closeModal();
  drawWorldMap();
  document.getElementById('worldMap').classList.remove('hidden');
}
function closeWorldMap() {
  document.getElementById('worldMap').classList.add('hidden');
}
function mapDestination(e) {
  const clicked = mapIconAt(e);
  if (clicked && clicked.wiki) {
    window.open('wiki.html#' + clicked.wiki, '_blank');
    return;
  }
  const map = document.getElementById('worldMapCanvas'),
    r = map.getBoundingClientRect(),
    x = Math.max(0, Math.min(MAP_W - 1, Math.floor(((e.clientX - r.left) / r.width) * MAP_W))),
    y = Math.max(0, Math.min(MAP_H - 1, Math.floor(((e.clientY - r.top) / r.height) * MAP_H))),
    playerDungeon = inDungeon(player.x, player.y),
    targetDungeon = inDungeon(x, y);
  if (playerDungeon !== targetDungeon) {
    message('Use the Ashen Barrow entrance to travel between the surface and dungeon.', 'bad');
    closeWorldMap();
    return;
  }
  let target = walkable(x, y) ? { x, y } : null;
  for (let radius = 1; !target && radius <= 3; radius++)
    for (let dy = -radius; dy <= radius && !target; dy++)
      for (let dx = -radius; dx <= radius && !target; dx++)
        if (Math.abs(dx) + Math.abs(dy) <= radius && walkable(x + dx, y + dy))
          target = { x: x + dx, y: y + dy };
  closeWorldMap();
  if (!target) return message('There is no reachable tile near that location.', 'bad');
  setPath(target.x, target.y);
  message(`Travelling toward ${regionNameFor(target.x, target.y)}.`, 'game');
}
function inDungeon(x, y) {
  return x >= 4 && x <= 27 && y >= 69 && y <= 92;
}
// Region boundaries were rebuilt around each town's NPCs after the 2026-07-19 world redesign
// (nearest-landmark lookup instead of fixed quadrants, since the new layout isn't a simple grid).
const REGION_LANDMARKS = [
  [171, 40, 'Greenrest Vale'],
  [174, 57, 'Greenrest Vale'],
  [147, 83, 'Greenrest Vale'],
  [119, 11, 'Greenrest Vale'],
  [136, 37, 'Greenrest Vale'],
  [45, 52, 'Greenrest Vale'],
  [87, 67, 'Pineholt'],
  [104, 67, 'Pineholt'],
  [99, 74, 'Pineholt'],
  [94, 73, 'Pineholt'],
  [111, 64, 'Thornwood'],
  [164, 65, 'Thornwood'],
  [153, 74, 'Thornwood'],
  [88, 18, 'Frostmere'],
  [159, 85, 'Frostmere'],
  [50, 68, 'Cinderforge'],
  [119, 67, 'Cinderforge'],
  [10, 122, 'Sablemarsh'],
  [22, 114, 'Sablemarsh'],
  [12, 36, 'Ashfall Wastes'],
];
function regionNameFor(x, y) {
  if (inDungeon(x, y)) return 'Ashen Barrow';
  let best = REGION_LANDMARKS[0],
    bestD = Infinity;
  for (const l of REGION_LANDMARKS) {
    const d = (x - l[0]) ** 2 + (y - l[1]) ** 2;
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best[2];
}
setInterval(gameTick, TICK_MS);
function npcTick() {
  if (tickCount % 12 === 0) {
    const speakers = NPCS.filter((n) => NPC_AMBIENT[n.id]);
    if (speakers.length) {
      const n = speakers[Math.floor(Math.random() * speakers.length)],
        lines = NPC_AMBIENT[n.id];
      n.speech = lines[Math.floor(Math.random() * lines.length)];
      n.speechUntil = tickCount + 6;
    }
  }
  if (tickCount % 3 !== 0) return;
  for (const n of NPCS) {
    if (
      !n.wander ||
      (skilling && skilling.type === 'pickpocket' && skilling.npc === n) ||
      Math.random() > 0.58
    )
      continue;
    const options = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
      .map(([dx, dy]) => ({ x: n.x + dx, y: n.y + dy }))
      .filter(
        (p) =>
          canStep(n.x, n.y, p.x, p.y) &&
          Math.abs(p.x - n.homeX) + Math.abs(p.y - n.homeY) <= n.wander &&
          !NPCS.some((o) => o !== n && o.x === p.x && o.y === p.y) &&
          !monsters.some((m) => m.alive && m.x === p.x && m.y === p.y) &&
          !(player.x === p.x && player.y === p.y),
      );
    if (!options.length) continue;
    options.sort(
      (a, b) =>
        Math.abs(a.x - n.homeX) +
        Math.abs(a.y - n.homeY) -
        (Math.abs(b.x - n.homeX) + Math.abs(b.y - n.homeY)),
    );
    const p =
      Math.random() < 0.35 ? options[0] : options[Math.floor(Math.random() * options.length)];
    n.fromX = n.drawX;
    n.fromY = n.drawY;
    n.x = p.x;
    n.y = p.y;
    n.moveAt = performance.now();
  }
}
function moveMonster(m, pos) {
  m.fromX = m.drawX;
  m.fromY = m.drawY;
  m.x = pos.x;
  m.y = pos.y;
  m.moveAt = performance.now();
}
function monsterChaseStep(m, target) {
  const p = findPath(m.x, m.y, target.x, target.y);
  let next = p[0];
  if (next && next.x === target.x && next.y === target.y) {
    // The path's final step would land the monster on the target's own tile, which is
    // never valid — when the monster is purely diagonal from the target that's the only
    // step findPath offers, so without this it gets stuck one tile short forever. Hop to
    // a cardinal tile beside the target instead.
    next = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]
      .map(([dX, dY]) => ({ x: target.x + dX, y: target.y + dY }))
      .find((t) => walkable(t.x, t.y) && tileDistance(m, t) <= 1);
  }
  return next;
}
function monsterStepClear(m, p) {
  return (
    p &&
    (p.x !== player.x || p.y !== player.y) &&
    !NPCS.some((n) => n.x === p.x && n.y === p.y) &&
    !monsters.some((o) => o !== m && o.alive && o.x === p.x && o.y === p.y)
  );
}
function spawnDrop(x, y, item, q) {
  const existing = drops.find((d) => d.x === x && d.y === y && d.item === item);
  if (existing) {
    existing.q += q;
    existing.despawn = tickCount + 100;
  } else drops.push({ x, y, item, q, despawn: tickCount + 100 });
}
function monsterTick() {
  for (const m of monsters) {
    if (!m.alive || m === combat) continue;
    const aggressive = [
        'goblin',
        'bogling',
        'wolf',
        'boar',
        'bandit',
        'guardian',
        'skeleton',
        'bat',
        'spider',
        'warden',
        'direWolf',
        'goblinWarlord',
        'cinderFiend',
        'frostTroll',
        'cinderColossus',
      ].includes(m.kind),
      range = m.kind === 'warden' || m.type.boss ? 6 : 4,
      dist = tileDistance(m, player);
    if (!aggressive || dist > range) {
      if ((m.x !== m.spawnX || m.y !== m.spawnY) && tickCount % 4 === 0) {
        const home = findPath(m.x, m.y, m.spawnX, m.spawnY),
          next = home[0];
        if (monsterStepClear(m, next)) moveMonster(m, next);
      }
      continue;
    }
    if (dist <= 1) {
      if (!combat) {
        combat = m;
        pending = null;
        skilling = null;
        m.lastAttack = Math.min(m.lastAttack, tickCount - 3);
        message('The ' + m.type.name + ' attacks you!', 'bad');
      }
      continue;
    }
    if (tickCount % 2 === 0) {
      const next = monsterChaseStep(m, player);
      if (monsterStepClear(m, next)) moveMonster(m, next);
    }
  }
}
const SPELLS = {
  emberStrike: { name: 'Ember Strike', level: 1, runes: 1, dmgBonus: 0, acc: 0 },
  emberBlast: { name: 'Ember Blast', level: 15, runes: 3, dmgBonus: 4, acc: 0.05 },
  frostBind: { name: 'Frostbind', level: 20, runes: 4, dmgBonus: 2, acc: 0.05, bind: 3 },
};
let lastCombatTarget = null;
function combatTick() {
  const m = combat;
  if (!m.alive) {
    combat = null;
    return;
  }
  if (m !== lastCombatTarget) {
    lastCombatTarget = m;
    player.nextAttackTick = tickCount; // attack immediately when engaging a new target
  }
  const weapon = ITEMS[player.equipment.weapon] || { attack: 0 },
    isRanged = !!weapon.ranged,
    isMagic = !!weapon.magic,
    range = weapon.range || 1,
    dist = tileDistance(player, m);
  // dist === 0 means the monster is standing on the player's own tile — not a valid spot
  // to fight from, so reposition just like being out of range.
  if (dist > range || dist === 0) {
    moveWithinRange(m, range, () => {
      combat = m;
    });
    return;
  }
  const speed = weapon.speed || 4;
  if (tickCount >= (player.nextAttackTick || 0)) {
    if (isRanged && !invCount('arrows')) {
      message('You have run out of arrows.', 'bad');
      combat = null;
      return;
    }
    if (isMagic) {
      const need = (SPELLS[player.selectedSpell] || SPELLS.emberStrike).runes || 1;
      if (invCount('emberRune') < need) {
        message(`You need ${need} Ember rune${need === 1 ? '' : 's'} to cast this spell.`, 'bad');
        combat = null;
        return;
      }
    }
    let hit, xpSkill, maxHit, projectileKind, usingSpec = false;
    if (isMagic) {
      const spell = SPELLS[player.selectedSpell] || SPELLS.emberStrike;
      add('emberRune', -(spell.runes || 1));
      const skill = level('Magic'),
        accurate =
          Math.random() <
          Math.min(0.96, 0.51 + skill * 0.04 + (weapon.magic || 0) * 0.04 + (spell.acc || 0));
      maxHit = 2 + Math.floor(skill / 3) + (weapon.magic || 0) + (spell.dmgBonus || 0);
      hit = accurate ? Math.floor(Math.random() * (maxHit + 1)) : 0;
      if (spell.bind) {
        m.bindUntil = tickCount + spell.bind;
        message(`${m.type.name} is bound in place!`, 'good');
      }
      xpSkill = 'Magic';
      projectileKind = 'magic';
    } else if (isRanged) {
      add('arrows', -1);
      const skill = level('Ranged'),
        accurate = Math.random() < Math.min(0.94, 0.5 + skill * 0.04 + (weapon.ranged || 0) * 0.04);
      maxHit = 1 + Math.floor(skill / 3) + (weapon.ranged || 0);
      hit = accurate ? Math.floor(Math.random() * (maxHit + 1)) : 0;
      xpSkill = 'Ranged';
      projectileKind = 'arrow';
    } else {
      const style = player.combatStyle,
        pray = player.activePrayer,
        att =
          level('Attack') +
          (style === 'accurate' ? 3 : 0) +
          (pray === 'clarity' ? 4 : pray === 'sharp' ? 2 : 0),
        str =
          level('Strength') +
          (style === 'aggressive' ? 3 : 0) +
          (pray === 'strength' ? 2 : pray === 'might' ? 5 : 0);
      let accChance = Math.min(0.95, 0.54 + att * 0.035 + (weapon.attack || 0) * 0.035);
      maxHit = 1 + Math.floor(str / 3) + (weapon.attack || 0);
      // Special attack
      if (player.specArmed && weapon.spec && player.specEnergy >= 50) {
        usingSpec = true;
        player.specArmed = false;
        player.specEnergy -= 50;
        if (window.SFX) SFX.play('cast');
        message(
          weapon.spec === 'power' ? 'Special attack — crushing blow!' : 'Special attack — flurry!',
          'good',
        );
        if (weapon.spec === 'power') {
          accChance = 1;
          maxHit = Math.ceil(maxHit * 1.6);
        }
      }
      const accurate = Math.random() < accChance;
      hit = accurate ? Math.floor(Math.random() * (maxHit + 1)) : 0;
      if (usingSpec && weapon.spec === 'double')
        hit += Math.random() < accChance ? Math.floor(Math.random() * (maxHit + 1)) : 0;
      xpSkill = style === 'aggressive' ? 'Strength' : style === 'defensive' ? 'Defence' : 'Attack';
    }
    if (projectileKind)
      projectiles.push({
        sx: player.drawX,
        sy: player.drawY,
        tx: m.drawX,
        ty: m.drawY,
        at: performance.now(),
        duration: isMagic ? 430 : 320,
        kind: projectileKind,
      });
    if (window.SFX && isMagic) SFX.play('cast');
    if (isMagic) tally('cast');
    if (window.SFX) SFX.play(hit > 0 ? 'hit' : 'miss');
    m.hp -= hit;
    if (m.type.hasSigils && m.hp > 0 && m.hp <= m.maxHp / 2 && !m.enraged) {
      m.enraged = true;
      message(`The ${m.type.name} tears open its ember seal and becomes enraged!`, 'bad');
      effects.push({
        x: m.x,
        y: m.y,
        value: 'ENRAGED',
        color: '#ff8a35',
        at: performance.now(),
        xp: 0,
      });
    }
    effects.push({
      x: m.x,
      y: m.y,
      value: hit,
      color: hit ? (isMagic ? '#b96cff' : '#ef5049') : '#65a9d9',
      at: performance.now(),
      xp: 4 + hit * 4,
    });
    message(
      hit ? `You hit the ${m.type.name} for ${hit}.` : `You miss the ${m.type.name}.`,
      hit ? 'good' : '',
    );
    player.xp[xpSkill] += 4 + hit * 4;
    player.xp.Hitpoints += hit;
    player.nextAttackTick = tickCount + speed;
    lastActionAt = performance.now();
    actionDuration = TICK_MS * speed;
    if (m.hp <= 0) {
      killMonster(m);
      renderPanel();
      return;
    }
    renderPanel();
  }
  if (!adjacent(player, m)) {
    if (tickCount % 2 === 0) {
      const next = monsterChaseStep(m, player);
      if (monsterStepClear(m, next)) moveMonster(m, next);
    }
    return;
  }
  if (tickCount >= (m.bindUntil || 0) && tickCount - m.lastAttack >= (m.type.attackSpeed || 4)) {
    m.lastAttack = tickCount;
    m.attackAt = performance.now();
    const pray = player.activePrayer,
      def =
        level('Defence') +
        (player.combatStyle === 'defensive' ? 3 : 0) +
        (pray === 'skin' ? 2 : pray === 'steel' ? 5 : 0) +
        equipmentDefence();
    let hit =
      Math.random() < Math.max(0.18, 0.68 - def * 0.025)
        ? Math.floor(Math.random() * (m.type.maxHit + 1))
        : 0;
    if (pray === 'protect') hit = Math.floor(hit / 2);
    if (!admin) player.hp = Math.max(0, player.hp - hit);
    if (hit > 0) {
      if (window.SFX) SFX.play('hurt');
      window.hurtFlash = performance.now(); // EF1: red screen flash for combat feel
    }
    effects.push({
      x: player.drawX,
      y: player.drawY,
      value: hit,
      color: hit ? '#ef5049' : '#65a9d9',
      at: performance.now(),
    });
    if (hit) message(`The ${m.type.name} hits you for ${hit}.`, 'bad');
    if (m.kind === 'bogling' && hit && Math.random() < 0.32) {
      player.poison = Math.max(player.poison, 5);
      player.poisonNext = tickCount + 6;
      message('Bogling venom poisons you!', 'bad');
      updateUI();
    }
    if (player.hp <= 0) death();
  }
}
function wardenMechanicTick() {
  // Any monster flagged hasSigils gets this ground-hazard mechanic, not just the Warden —
  // reused as-is for the Unbound Construct boss.
  if (!combat || !combat.alive || !combat.type.hasSigils) return;
  if (combat.enraged ? tickCount % 4 !== 0 : tickCount % 8 !== 4) return;
  const tileset = [
    [player.x, player.y],
    [player.x + 1, player.y],
    [player.x - 1, player.y],
    [player.x, player.y + 1],
    [player.x, player.y - 1],
  ].filter(([x, y]) => walkable(x, y));
  hazards.push({
    tiles: tileset,
    resolve: tickCount + (combat.enraged ? 1 : 2),
    enraged: combat.enraged,
  });
  message(
    combat.enraged
      ? `The enraged ${combat.type.name} floods the floor with cinders! Move now!`
      : `The ${combat.type.name} marks the ground beneath you! Move!`,
    'bad',
  );
}
function hazardTick() {
  wardenMechanicTick();
  const remaining = [];
  for (const h of hazards) {
    if (tickCount < h.resolve) {
      remaining.push(h);
      continue;
    }
    if (h.tiles.some(([x, y]) => x === player.x && y === player.y)) {
      const damage = h.enraged ? 4 : 3;
      if (!admin) player.hp = Math.max(0, player.hp - damage);
      effects.push({
        x: player.drawX,
        y: player.drawY,
        value: damage,
        color: '#ff7a35',
        at: performance.now(),
      });
      message(`The burning sigil hits you for ${damage}.`, 'bad');
      if (player.hp <= 0) death();
    } else message('You evade the burning sigil.', 'good');
  }
  hazards = remaining;
}
function killMonster(m) {
  m.alive = false;
  m.respawn = tickCount + (m.kind === 'warden' || m.type.boss ? 50 : 20);
  combat = null;
  player.xp[
    (ITEMS[player.equipment.weapon] || {}).magic
      ? 'Magic'
      : (ITEMS[player.equipment.weapon] || {}).ranged
        ? 'Ranged'
        : player.combatStyle === 'aggressive'
          ? 'Strength'
          : player.combatStyle === 'defensive'
            ? 'Defence'
            : 'Attack'
  ] += m.type.xp;
  player.kills++;
  tally('kill');
  player.killLog[m.kind] = (player.killLog[m.kind] || 0) + 1;
  if (player.barrowRunStartedAt && inDungeon(player.x, player.y)) {
    // Gain scales with each monster's combat XP (its built-in difficulty rating), sized so
    // clearing all 8 mandatory chamber monsters once totals ~70% potential by the Warden's door.
    const gain = { guardian: 10, skeleton: 8, spider: 7, bat: 5 }[m.kind] || 0;
    if (gain) {
      player.barrowPotential = Math.min(100, player.barrowPotential + gain);
      message(`Barrow reward potential: ${player.barrowPotential}%.`, 'game');
    }
  }
  const bq = player.sideQuests.boarHunt,
    sq = player.sideQuests.silkAndCinders,
    rq = player.sideQuests.brokenRoad,
    hq = player.sideQuests.hearthAndHome,
    mq = player.sideQuests.cureMirehaven;
  if (m.kind === 'bandit' && rq.step === 1 && rq.kills < 4) {
    rq.kills++;
    message('The Broken Road: ' + rq.kills + '/4 road bandits defeated.', 'game');
    if (rq.kills === 4) message('Return to Mara in Frostmere for your reward.', 'good');
  }
  if (m.kind === 'spider' && sq.step === 1 && sq.kills < 4) {
    sq.kills++;
    message('Silk and Cinders: ' + sq.kills + '/4 cave spiders defeated.', 'game');
    if (sq.kills === 4) message('Return to Scout Vale for your reward.', 'good');
  }
  if (m.kind === 'boar' && bq.step === 1 && bq.kills < 3) {
    bq.kills++;
    message('The Boar Hunt: ' + bq.kills + '/3 wild boars defeated.', 'game');
    if (bq.kills === 3) message('Return to Elder Willow for your reward.', 'good');
  }
  if (player.contract && player.contract.kind === m.kind && player.contract.remaining > 0) {
    player.contract.remaining--;
    message(
      `Contract: ${player.contract.remaining} ${player.contract.name}${player.contract.remaining === 1 ? '' : 's'} remaining.`,
      'game',
    );
    if (player.contract.remaining === 0)
      message('Contract complete! Return to Guard Bren.', 'good');
  }
  for (const [id, min, max, chance = 1] of m.type.drops) {
    if (Math.random() > chance) continue;
    const q = min + Math.floor(Math.random() * (max - min + 1));
    spawnDrop(m.x, m.y, id, q);
  }
  message(`You defeat the ${m.type.name}. Loot appears on the ground.`, 'good');
  const s = player.story;
  if (s.q === 0 && s.step === 4 && m.kind === 'goblin') {
    s.step = 5;
    questUpdate();
  }
  if (s.q === 2 && s.step === 1 && m.kind === 'guardian') {
    add('key', 1, true);
    s.step = 2;
    message('The guardian carried the Barrow key.', 'good');
    questUpdate();
  }
  if (s.q === 3 && s.step === 5 && m.kind === 'ashwrightRenn') {
    s.step = 6;
    questUpdate();
  }
  if (s.q === 3 && s.step === 7 && m.kind === 'unboundConstruct') {
    s.step = 8;
    questUpdate();
  }
  const clearedCell = BARROW_ROOMS.find(
    (r) => r.kind === m.kind && r.x === m.spawnX && r.y === m.spawnY,
  );
  if (clearedCell && player.barrowOrder[player.barrowRoom] === clearedCell.cell) {
    player.barrowRoom++;
    syncBarrowDoors();
    const nextCell = player.barrowOrder[player.barrowRoom];
    const door = barrowFindDoor(player.barrowVia[player.barrowRoom - 1], nextCell);
    if (door) effects.push({ x: door.x, y: door.y, value: 'OPEN', color: '#d5b56a', at: performance.now(), xp: 0 });
    message(
      nextCell === 8
        ? 'The chamber falls silent. Somewhere ahead, a heavier door grinds open — the Warden waits.'
        : 'The chamber falls silent. A random door elsewhere in the Barrow grinds open.',
      'good',
    );
  }
  if (m.kind === 'warden') {
    if (s.q === 2 && s.step === 3) {
      add('relic', 1, true);
      s.step = 4;
      questUpdate();
    }
    message('The Warden chest has been unsealed.', 'good');
  }
}
// ---- Ashen Barrow: 3x3 chamber grid, randomized per run ----
function barrowAdjCells(i) {
  const r = Math.floor(i / 3),
    c = i % 3,
    out = [];
  if (r > 0) out.push(i - 3);
  if (r < 2) out.push(i + 3);
  if (c > 0) out.push(i - 1);
  if (c < 2) out.push(i + 1);
  return out;
}
function barrowFindDoor(a, b) {
  return BARROW_DOORS.find((d) => (d.a === a && d.b === b) || (d.b === a && d.a === b));
}
// Randomized frontier expansion: each newly-picked cell must be grid-adjacent to some
// already-unlocked cell, but NOT necessarily the previous cell in the reveal order — so we
// track exactly which earlier cell ("via") each new room connects through, not just the order.
function generateBarrowOrder() {
  const unlocked = new Set([0]),
    order = [0],
    via = [];
  let locked = new Set([1, 2, 3, 4, 5, 6, 7]);
  while (locked.size) {
    const candidates = [];
    for (const cell of locked)
      for (const n of barrowAdjCells(cell)) if (unlocked.has(n)) candidates.push({ cell, from: n });
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    unlocked.add(pick.cell);
    locked.delete(pick.cell);
    order.push(pick.cell);
    via.push(pick.from);
  }
  via.push(barrowAdjCells(8).find((n) => unlocked.has(n)));
  order.push(8);
  return { order, via };
}
function syncBarrowDoors() {
  for (const d of BARROW_DOORS) tiles[d.y][d.x] = 4;
  for (let k = 0; k < player.barrowRoom && k < 8; k++) {
    const d = barrowFindDoor(player.barrowVia[k], player.barrowOrder[k + 1]);
    if (d) tiles[d.y][d.x] = 5;
  }
}
function resetBarrowRun() {
  player.barrowRoom = 0;
  const gen = generateBarrowOrder();
  player.barrowOrder = gen.order;
  player.barrowVia = gen.via;
  syncBarrowDoors();
}
function respawnTick() {
  for (const m of monsters)
    if (!m.alive && tickCount >= m.respawn) {
      m.alive = true;
      m.hp = m.maxHp;
      m.x = m.spawnX;
      m.y = m.spawnY;
      m.drawX = m.spawnX;
      m.drawY = m.spawnY;
      m.fromX = m.spawnX;
      m.fromY = m.spawnY;
      m.enraged = false;
      if (m.kind === 'warden' && inDungeon(player.x, player.y) && !barrowChestReady()) {
        player.barrowRunStartedAt = Date.now();
        player.barrowPotential = 0;
        resetBarrowRun();
        message('The Ashen Warden reforms. The chamber guardians rise once more.', 'game');
      }
    }
}
function death() {
  if (admin) {
    // Admin mode: cannot die.
    player.hp = player.maxHp;
    player.poison = 0;
    return;
  }
  if (window.SFX) SFX.play('die');
  const inBarrow = inDungeon(player.x, player.y),
    barrowEntrance = PORTALS.find((p) => p.label === 'Enter Ashen Barrow'),
    gx = inBarrow ? barrowEntrance.toX : player.x,
    gy = inBarrow ? barrowEntrance.toY : player.y;
  if (player.grave) bankGrave(false);
  const ranked = Object.keys(player.inv)
      .filter((id) => !['key', 'relic'].includes(id))
      .sort(
        (a, b) =>
          (ITEMS[b].value || 0) * (player.inv[b] || 1) -
          (ITEMS[a].value || 0) * (player.inv[a] || 1),
      ),
    kept = new Set([...ranked.slice(0, 3), 'key', 'relic']),
    lost = {};
  for (const [id, q] of Object.entries(player.inv))
    if (!kept.has(id)) {
      lost[id] = q;
      delete player.inv[id];
    }
  const gold = Math.floor(player.gold * 0.1);
  player.gold -= gold;
  if (Object.keys(lost).length || gold)
    player.grave = { x: gx, y: gy, items: lost, gold, expiresAt: Date.now() + 600000 };
  player.hp = player.maxHp;
  player.prayerPoints = 0;
  player.activePrayer = null;
  player.poison = 0;
  player.poisonNext = 0;
  player.x = 174;
  player.y = 44;
  player.drawX = 174;
  player.drawY = 44;
  path = [];
  moveSegment = null;
  combat = null;
  skilling = null;
  if (player.barrowRunStartedAt) {
    player.barrowRunStartedAt = 0;
    player.barrowPotential = 0;
    message('Ashen Barrow run ended on death.', 'bad');
  }
  message(
    player.grave
      ? inBarrow
        ? 'You wake at the Greenrest Vale plaza. The Barrow spat your gravestone out at its entrance, safe from the vault below, for 10 minutes.'
        : 'You wake at the Greenrest Vale plaza. A gravestone holds your lost items for 10 minutes.'
      : 'You collapse and wake at the Greenrest Vale plaza.',
    'bad',
  );
  showDeathScreen(inBarrow, lost, gold);
  renderPanel();
  updateUI();
}
function showDeathScreen(inBarrow, lost, goldLost) {
  const itemList = Object.entries(lost)
      .map(([id, q]) => `${ITEMS[id].name}${q > 1 ? ' x' + q : ''}`)
      .join(', '),
    lostBits = [goldLost ? `<b>${goldLost} gold</b>` : '', itemList].filter(Boolean).join(' and '),
    text = lostBits
      ? `You lost ${lostBits}. ${inBarrow ? 'Your gravestone waits at the Barrow entrance' : 'A gravestone holds it'} for 10 minutes.`
      : 'You had nothing worth losing. Small mercies.';
  document.getElementById('deathText').innerHTML = text;
  document.getElementById('deathScreen').classList.remove('hidden');
}
function closeDeathScreen() {
  document.getElementById('deathScreen').classList.add('hidden');
}
function recoverGrave() {
  const g = player.grave;
  if (!g) return;
  let recovered = 0;
  for (const [id, q] of Object.entries(g.items)) {
    if (!canAdd(id)) continue;
    add(id, q);
    delete g.items[id];
    recovered++;
  }
  if (g.gold) {
    player.gold += g.gold;
    g.gold = 0;
    recovered++;
  }
  if (!Object.keys(g.items).length && !g.gold) {
    player.grave = null;
    message('You recover everything from your gravestone.', 'good');
  } else message('Your backpack is too full to recover everything.', 'bad');
  if (recovered) {
    renderPanel();
    updateUI();
  }
}
function bankGrave(notify = true) {
  const g = player.grave;
  if (!g) return;
  for (const [id, q] of Object.entries(g.items)) player.bank[id] = (player.bank[id] || 0) + q;
  player.gold += g.gold || 0;
  player.grave = null;
  if (notify) message('The Castle Bank recovered your expired gravestone items.', 'game');
  renderPanel();
  updateUI();
}
function minimapBounds() {
  const size = 126;
  return { x: canvas.clientWidth - size - 14, y: 14, size };
}
function isMinimapPoint(x, y) {
  const b = minimapBounds();
  return x >= b.x - 4 && x <= b.x + b.size + 4 && y >= b.y - 4 && y <= b.y + b.size + 4;
}
function minimapTravel(sx, sy) {
  closeContext();
  closeItemMenu();
  const b = minimapBounds(),
    x = Math.max(0, Math.min(MAP_W - 1, Math.floor(((sx - b.x) / b.size) * MAP_W))),
    y = Math.max(0, Math.min(MAP_H - 1, Math.floor(((sy - b.y) / b.size) * MAP_H))),
    playerDungeon = inDungeon(player.x, player.y),
    targetDungeon = inDungeon(x, y);
  if (playerDungeon !== targetDungeon)
    return message('Use the Ashen Barrow entrance to cross between surface and dungeon.', 'bad');
  let target = walkable(x, y) ? { x, y } : null;
  for (let radius = 1; !target && radius <= 4; radius++)
    for (let dy = -radius; dy <= radius && !target; dy++)
      for (let dx = -radius; dx <= radius && !target; dx++)
        if (Math.abs(dx) + Math.abs(dy) <= radius && walkable(x + dx, y + dy))
          target = { x: x + dx, y: y + dy };
  if (!target) return message('There is no reachable tile near that minimap location.', 'bad');
  setPath(target.x, target.y);
  message(`Minimap travel: ${regionNameFor(target.x, target.y)}.`, 'game');
}
function targetAt(x, y) {
  return (
    (player.grave && player.grave.x === x && player.grave.y === y
      ? { ...player.grave, kind: 'grave' }
      : null) ||
    NPCS.find((n) => n.x === x && n.y === y) ||
    monsters.find((m) => m.alive && m.x === x && m.y === y) ||
    drops.find((d) => d.x === x && d.y === y) ||
    ROCKS.find((r) => r.x === x && r.y === y && !r.depletedUntil) ||
    TREES.find((t) => t.x === x && t.y === y && !t.depletedUntil) ||
    fires.find((f) => f.x === x && f.y === y) ||
    FARM_PATCHES.find((p) => p.x === x && p.y === y) ||
    HUNT_SPOTS.find((p) => p.x === x && p.y === y) ||
    SIGNPOSTS.find((p) => p.x === x && p.y === y) ||
    (x === FORGE.x && y === FORGE.y ? { ...FORGE, kind: 'forge' } : null) ||
    (x === FURNACE.x && y === FURNACE.y ? { ...FURNACE, kind: 'furnace' } : null) ||
    (x === ALTAR.x && y === ALTAR.y ? { ...ALTAR, kind: 'altar' } : null) ||
    (x === WORKBENCH.x && y === WORKBENCH.y ? { ...WORKBENCH, kind: 'craftbench' } : null) ||
    (x === CAULDRON.x && y === CAULDRON.y ? { ...CAULDRON, kind: 'cauldron' } : null) ||
    (x === DUNGEON_CHEST.x && y === DUNGEON_CHEST.y ? { ...DUNGEON_CHEST, kind: 'chest' } : null) ||
    BARROW_TABLETS.find((t) => t.x === x && t.y === y) ||
    PORTALS.find((p) => p.x === x && p.y === y) ||
    FISH_SPOTS.find((p) => p.x === x && p.y === y) ||
    (tiles[y]?.[x] === 8 ? { kind: 'fire', x, y } : null)
  );
}
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect(),
    mx = e.clientX - r.left,
    my = e.clientY - r.top,
    tip = document.getElementById('tooltip');
  if (isMinimapPoint(mx, my)) {
    tip.style.display = 'block';
    tip.style.left = mx - 115 + 'px';
    tip.style.top = my + 12 + 'px';
    tip.textContent = 'Click minimap to travel';
    return;
  }
  const p = toWorld(mx, my);
  hover = {
    x: Math.max(0, Math.min(MAP_W - 1, Math.floor(p.x))),
    y: Math.max(0, Math.min(MAP_H - 1, Math.floor(p.y))),
  };
  const t = targetAt(hover.x, hover.y);
  if (t) {
    tip.style.display = 'block';
    tip.style.left = e.clientX - r.left + 12 + 'px';
    tip.style.top = e.clientY - r.top + 12 + 'px';
    tip.textContent = t.ore
      ? `Mine ${t.name}`
      : HUNT_SPOTS.includes(t)
        ? `Lay trap at ${t.name}`
        : SIGNPOSTS.includes(t)
          ? `Read ${t.name}`
          : FARM_PATCHES.includes(t)
            ? `${patchAction(t)} ${t.name}`
            : TREES.includes(t)
              ? `Chop ${t.name}`
              : t.kind === 'forge'
                ? 'Use Cinderforge anvil'
                : t.kind === 'furnace'
                  ? 'Use Cinderforge furnace'
                  : t.kind === 'altar'
                  ? 'Pray at Frostmere altar'
                  : t.kind === 'grave'
                    ? 'Recover gravestone'
                    : t.kind === 'craftbench'
                      ? 'Craft at workbench'
                          : t.kind === 'cauldron'
                            ? 'Brew at cauldron'
                            : t.kind === 'fire'
                              ? 'Cook'
                              : t.name
                                ? `Talk-to ${t.name}`
                                : t.type
                                  ? `Attack ${t.type.name}`
                                  : t.item
                                    ? `Take ${ITEMS[t.item].name}`
                                    : t.label
                                      ? t.label
                                      : t.kind === 'fish'
                                        ? 'Fish'
                                        : '';
  } else tip.style.display = 'none';
});
