"use strict";
// ============================================================
// data.js — game data: items, monsters, world layout, helpers
// ============================================================

// viewport & world dimensions
const W = 640, H = 480;
const WW = 2000, WH = 1500;
const TILE = 25;                       // world is a grid of 25px tiles
const GW = WW / TILE, GH = WH / TILE;  // 80 × 60 tiles

// --- metal tiers ---
const TIERS = [
  { id:'bronze',  name:'Bronze',  pow:2,  barSell:8,   icon:'🟤', col:'#a86a32' },
  { id:'iron',    name:'Iron',    pow:4,  barSell:20,  icon:'⚪', col:'#8f8f8f' },
  { id:'steel',   name:'Steel',   pow:7,  barSell:45,  icon:'⬜', col:'#c8c8d4' },
  { id:'mithril', name:'Mithril', pow:11, barSell:110, icon:'🔵', col:'#5560c8' },
  { id:'rune',    name:'Rune',    pow:16, barSell:260, icon:'🟦', col:'#3fa7a0' },
  { id:'dragon',  name:'Dragon',  pow:24, barSell:700, icon:'🔴', col:'#c03028' },
];
const TIERCOL = {};
TIERS.forEach(t => TIERCOL[t.id] = t.col);

// --- items ---
const ITEMS = {
  coins:        { name:'Coins',         icon:'🪙', sell:0 },
  bones:        { name:'Bones',         icon:'🦴', sell:5 },
  big_bones:    { name:'Big bones',     icon:'🦴', sell:25 },
  dragon_bones: { name:'Dragon bones',  icon:'🦴', sell:150 },
  shrimp:       { name:'Shrimp',        icon:'🍤', sell:4,  heal:4 },
  trout:        { name:'Cooked trout',  icon:'🍣', sell:14, heal:8 },
  shark:        { name:'Cooked shark',  icon:'🥩', sell:70, heal:20 },
  raw_shrimp:   { name:'Raw shrimp',    icon:'🦐', sell:2 },
  raw_trout:    { name:'Raw trout',     icon:'🐟', sell:7 },
  raw_shark:    { name:'Raw shark',     icon:'🦈', sell:35 },
  burnt_fish:   { name:'Burnt fish',    icon:'🖤', sell:1 },
  fishing_rod:  { name:'Fishing rod',   icon:'🎣', sell:30 },
  bait:         { name:'Bait',          icon:'🪱', sell:1 },
  pickaxe:      { name:'Pickaxe',       icon:'⛏️', sell:35 },
  // combat potions — temporary skill boosts (a coin sink you spend every trip)
  atk_potion:   { name:'Attack potion',   icon:'🧪', sell:15, boost:{ skill:'atk', amt:3, dur:60000 } },
  str_potion:   { name:'Strength potion', icon:'🧪', sell:15, boost:{ skill:'str', amt:3, dur:60000 } },
  def_potion:   { name:'Defence potion',  icon:'🧪', sell:15, boost:{ skill:'def', amt:3, dur:60000 } },
};
// gear pieces per tier: weapon + four armour slots, plus a bar and an ore to smelt it from
TIERS.forEach(t => {
  ITEMS[t.id + '_ore']   = { name: t.name === 'Bronze' ? 'Copper ore' : t.name + ' ore', icon:'🪨', sell: Math.round(t.barSell * 0.5), oreTier: t.id };
  ITEMS[t.id + '_bar']   = { name: t.name + ' bar',    icon: t.icon, sell: t.barSell };
  ITEMS[t.id + '_sword'] = { name: t.name + ' sword',   icon:'🗡️', sell: t.barSell * 3, atk: t.pow,               tier: t.id, slot:'weapon' };
  ITEMS[t.id + '_armor'] = { name: t.name + ' platebody', icon:'🛡️', sell: t.barSell * 5, def: t.pow,             tier: t.id, slot:'body' };
  ITEMS[t.id + '_helm']  = { name: t.name + ' helmet',   icon:'⛑️', sell: t.barSell * 2, def: Math.ceil(t.pow*0.4), tier: t.id, slot:'helm' };
  ITEMS[t.id + '_shield']= { name: t.name + ' shield',   icon:'🛡️', sell: t.barSell * 3, def: Math.ceil(t.pow*0.6), tier: t.id, slot:'shield' };
  ITEMS[t.id + '_legs']  = { name: t.name + ' platelegs', icon:'👖', sell: t.barSell * 4, def: Math.ceil(t.pow*0.7), tier: t.id, slot:'legs' };
});

// --- world layout ---
const CASTLE = { x: 170, y: 150, w: 290, h: 190 };
const GATE = { x1: 285, x2: 345 };
const OBSTACLES = [
  { x: 170, y: 150, w: 290, h: 14 },   // castle north wall
  { x: 170, y: 150, w: 14,  h: 190 },  // west wall
  { x: 446, y: 150, w: 14,  h: 190 },  // east wall
  { x: 170, y: 326, w: 115, h: 14 },   // south wall left of gate
  { x: 345, y: 326, w: 115, h: 14 },   // south wall right of gate
  { x: 235, y: 196, w: 160, h: 12 },   // bank counter
  { x: 470, y: 500, w: 130, h: 72 },   // general store
  { x: 185, y: 725, w: 260, h: 180 },  // pond (water)
];
const NPCS = [
  { id:'trader', name:'Alaric',     paint:'trader', x: 545, y: 600, shop:'general',
    line:'Alaric: Welcome to the General Store! I buy anything.' },
  { id:'fisher', name:'Murphy',     paint:'fisher', x: 470, y: 880, shop:'fishing',
    line:'Murphy: Fresh bait an\' sturdy rods! The pond\'s teemin\' today.' },
  { id:'banker', name:'Wilhelmina', paint:'banker', x: 315, y: 184, shop:'bank',
    line:'Wilhelmina: Welcome to the Bank of Emberfall. Your valuables are safe with us.' },
  { id:'smith',  name:'Gaveth',     paint:'trader', x: 650, y: 520, shop:'armoury',
    line:'Gaveth: Finest forged steel this side of the meadow. Coin talks.' },
];
const SHOPS = {
  general: { title:"🏪 Alaric's General Store", stock: [
    { id:'shrimp', price:12 }, { id:'trout', price:45 }, { id:'shark', price:210 },
    { id:'pickaxe', price:80 },
    { id:'atk_potion', price:120 }, { id:'str_potion', price:120 }, { id:'def_potion', price:120 } ] },
  fishing: { title:"🎣 Murphy's Fishing Supplies", stock: [
    { id:'fishing_rod', price:60 }, { id:'bait', price:2, bulk:10 } ] },
  armoury: { title:"⚔️ Gaveth's Armoury", stock: [
    { id:'iron_sword', price:400 }, { id:'iron_armor', price:650 }, { id:'iron_helm', price:260 },
    { id:'steel_sword', price:1100 }, { id:'steel_armor', price:1800 }, { id:'steel_shield', price:900 } ] },
};
const RANGE_PT = { x: 655, y: 668 };
const FISH_SPOTS = [ { x: 275, y: 925 }, { x: 465, y: 800 } ];
const POND = { x: 315, y: 815, rx: 128, ry: 88 };
// --- mining ---
const FURNACE_PT = { x: 600, y: 470 };
// ore rocks near town; each needs a minimum Mining level to yield its tier
const ROCKS = [
  { x: 720, y: 470, tier:'bronze',  req:1  },
  { x: 760, y: 500, tier:'bronze',  req:1  },
  { x: 700, y: 520, tier:'iron',    req:10 },
  { x: 750, y: 545, tier:'steel',   req:25 },
  { x: 1500, y: 300, tier:'mithril', req:40 },
  { x: 1560, y: 340, tier:'rune',    req:55 },
  { x: 1560, y: 1100, tier:'dragon', req:75 },
];
const REGIONS = {
  meadow: { x: 750,  y: 200, w: 580, h: 1100 },
  crypt:  { x: 1400, y: 80,  w: 500, h: 560 },
  lair:   { x: 1400, y: 880, w: 500, h: 540 },
};
const SPAWNS = [
  ['rat','meadow'], ['rat','meadow'], ['rat','meadow'], ['rat','meadow'],
  ['goblin','meadow'], ['goblin','meadow'], ['goblin','meadow'],
  ['skeleton','crypt'], ['skeleton','crypt'], ['skeleton','crypt'],
  ['wizard','crypt'], ['wizard','crypt'],
  ['demon','lair'], ['demon','lair'],
  ['dragon','lair'], ['dragon','lair'],
];

// --- monsters ---
const MOBS = {
  rat:      { name:'Giant Rat',    lvl:2,  hp:10,  atk:2,  def:2,  max:1,  aspd:2600, drops:[
              {id:'bones',ch:1}, {id:'coins',ch:1,min:2,max:9}, {id:'raw_shrimp',ch:.4}, {id:'bronze_bar',ch:.35} ] },
  goblin:   { name:'Goblin',       lvl:6,  hp:18,  atk:5,  def:4,  max:2,  aspd:2400, drops:[
              {id:'bones',ch:1}, {id:'coins',ch:1,min:4,max:16}, {id:'shrimp',ch:.35}, {id:'bronze_bar',ch:.35}, {id:'iron_bar',ch:.15} ] },
  skeleton: { name:'Skeleton',     lvl:25, hp:42,  atk:18, def:14, max:5,  aspd:2400, aggro:150, drops:[
              {id:'big_bones',ch:1}, {id:'coins',ch:1,min:15,max:55}, {id:'trout',ch:.4}, {id:'iron_bar',ch:.35}, {id:'steel_bar',ch:.25} ] },
  wizard:   { name:'Dark Wizard',  lvl:38, hp:58,  atk:28, def:18, max:7,  aspd:2200, aggro:170, drops:[
              {id:'bones',ch:1}, {id:'coins',ch:1,min:30,max:95}, {id:'trout',ch:.4}, {id:'steel_bar',ch:.35}, {id:'mithril_bar',ch:.18} ] },
  demon:    { name:'Lesser Demon', lvl:66, hp:98,  atk:46, def:38, max:11, aspd:2400, aggro:200, drops:[
              {id:'big_bones',ch:1}, {id:'coins',ch:1,min:60,max:190}, {id:'shark',ch:.35}, {id:'mithril_bar',ch:.3}, {id:'rune_bar',ch:.15} ] },
  dragon:   { name:'Green Dragon', lvl:92, hp:155, atk:64, def:58, max:16, aspd:2400, aggro:230, drops:[
              {id:'dragon_bones',ch:1}, {id:'coins',ch:1,min:150,max:420}, {id:'shark',ch:.45}, {id:'rune_bar',ch:.3}, {id:'dragon_bar',ch:.12} ] },
};

// --- tutorial steps ---
const TUT = [
  '⚔️ Click a monster to attack it. Follow the golden arrow east to the Wildmeadow.',
  '🗡️ Keep fighting! Defeat the monster.',
  '💰 Click the glowing loot pile it dropped to pick it up.',
  '🏪 Walk back to town and click Alaric outside the General Store, then sell an item.',
  '⚒️ Gather 2 Bronze bars from monsters, then forge a Bronze sword in the Smith tab.',
  '🎒 Click your new sword in the Items tab to wield it.',
  '🎣 Visit Murphy by the pond and buy a fishing rod and some bait.',
  '🐟 Click the rippling water in the pond to catch a fish.',
  '🍳 Click the campfire near the store to cook your catch.',
  '🏦 Enter the castle through the south gate and store an item with Wilhelmina the banker.',
];

// --- pure helpers ---
const rnd = n => Math.floor(Math.random() * n);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const inRect = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
// exponential XP curve (OSRS formula): each level costs ~10% more than the last.
// XP_TABLE[n] = total XP required to reach level n+1.  Level 99 ≈ 13,034,431 XP.
const XP_TABLE = (() => {
  const t = [0]; let acc = 0;
  for (let lvl = 1; lvl < 99; lvl++) {
    acc += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
    t.push(Math.floor(acc / 4));
  }
  return t;
})();
const HP_START_XP = XP_TABLE[9];          // total XP for level 10 (Hitpoints starts here)
const lvlOf = xp => {
  for (let l = 98; l >= 1; l--) if (xp >= XP_TABLE[l]) return l + 1;
  return 1;
};
const xpForLevel = lvl => XP_TABLE[clamp(lvl - 1, 0, 98)];
const tileOf = v => Math.floor(v / TILE);
const centerOf = t => (t + 0.5) * TILE;
