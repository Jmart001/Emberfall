# Emberfall — Improvement Design Doc

A prioritized spec for deepening Emberfall, grounded in the current codebase (`data.js`, `game.js`, `render.js`, `world.js`, `sprites.js`). Each item lists the problem, the fix, the files to touch, and rough effort. Work top-down: the combat + XP items are the foundation everything else balances against.

---

## Priority 1 — Combat depth (Strength + gear slots)

**Problem.** Combat has only Attack and Defence. Damage is `1 + rnd(2 + atkLvl/4 + wpnPow)` in `playerAttack`, and there's one weapon + one armour slot (`player.equip = { weapon, armor }`). Every fight plays identically; there are no build decisions.

**Fix.**

1. **Add a Strength skill** that drives *max hit*, separate from Attack which drives *accuracy*.
   - Add `str: 0` to `player.xp` (and the `load()` defaults + `grantXp` name map).
   - Split the formula: accuracy stays a function of `atkLvl + wpnPow`; max hit becomes a function of `strLvl + wpnPow` (e.g. `maxHit = 1 + floor(strLvl/8) + wpnPow`), then roll `1 + rnd(maxHit)`.
   - Grant Strength XP on damage dealt (currently all combat XP goes to `atk`/`hp`).
   - Add Strength to the stats readout in `renderStats()`.

2. **Add gear slots.** Extend `equip` to `{ weapon, shield, helm, body, legs }`. Give each tier a `helm`/`shield`/`legs` item in the `TIERS.forEach` block of `data.js`, with `def` values scaled off `pow`. Sum defence across all armour slots in `armPow()`.

**Files.** `data.js` (items, tiers), `game.js` (`playerAttack`, `grantXp`, `armPow`, `useItem`/`unequip`, `renderStats`, `renderPanel` equip grid), `sprites.js` (optional: render helm/shield tints).

**Effort.** Medium. Strength alone is the 80/20 — do it first, add slots after.

---

## Priority 2 — Fix the XP / level curve

**Problem.** `lvlOf = min(99, floor(sqrt(xp/30)) + 1)` is quadratic, so it's *inverted*: early levels crawl, high levels fly by. Level 99 is only ~288,120 XP. A Green Dragon grants ~620 Attack XP, so 98→99 is roughly ten dragons — endgame progression evaporates exactly when it should feel earned.

**Fix.** Replace `lvlOf` with an exponential curve where each level costs ~10% more than the last (OSRS-style). Precompute a cumulative XP table at load:

```js
const XP_TABLE = (() => {
  const t = [0]; let xp = 0;
  for (let lvl = 1; lvl < 99; lvl++) {
    xp += Math.floor(lvl + 300 * Math.pow(2, lvl / 7)) / 4;
    t.push(Math.floor(xp));
  }
  return t; // t[n] = total XP to reach level n+1
})();
const lvlOf = xp => {
  for (let l = 98; l >= 1; l--) if (xp >= XP_TABLE[l]) return l + 1;
  return 1;
};
```

Because the old save stored raw XP under the old curve, either (a) bump the save key to `emberfall_save_v3` and let existing players keep progress at their new (lower) computed level, or (b) migrate by converting old level → new-curve XP on load. Option (a) is simpler and acceptable for a hobby game.

**Files.** `data.js` (`lvlOf`, and `hp` starting XP — 2500 no longer maps to level 10, so recompute the HP start value or special-case HP level to `max(10, ...)` as it already does).

**Effort.** Small, but retune drop/XP rates afterward so the grind feels right.

---

## Priority 3 — Add risk (death penalty + aggressive monsters)

**Problem.** `playerDie()` fully heals, keeps all loot, and teleports to spawn — zero cost. Combined with cheap food and passive regen, nothing on the map is dangerous. Monsters are also fully passive (they only fight once clicked; `engaged` starts false), so you can walk the whole map untouched.

**Fix.**

1. **Death penalty.** On death, drop unprotected inventory items as a loot pile at the death spot (keep equipped gear + coins, or keep the 3 most valuable items — your call). This is the single change that makes the Dragon's Lair matter.
2. **Aggressive monsters.** Add an `aggro` radius to dangerous `MOBS` entries. In the mobs loop in `tick()`, if a non-engaged aggressive mob is within its aggro range of the player, set `engaged = true`. Gate it so low-level players aren't ganked in the meadow — only crypt/lair mobs are aggressive.

**Files.** `game.js` (`playerDie`, mobs loop in `tick`), `data.js` (`aggro` field on MOBS).

**Effort.** Small–medium.

---

## Priority 4 — Give the economy a sink

**Problem.** Coins come from drops and selling, but once you own a rod, bait, and food there's nothing to buy. Gold is meaningless within an hour.

**Fix.** Any one of: an armour/weapon shop that sells mid-tier gear for large sums; gear repair costs after death; purchasable bank-space or a second bank tab; consumables like potions (a temporary combat boost stat). Even one real sink changes how players value drops.

**Files.** `data.js` (`SHOPS`, new items), `game.js` (`renderShop`, buy handler).

**Effort.** Small per sink.

---

## Priority 5 — Progression skill: mining + smelting

**Problem.** Bars only drop from monsters, so smithing depth is really just "kill a bigger thing." Upgrades are pure RNG with no way to target them.

**Fix.** Add ore rocks (world objects, like fish spots) and a furnace. Mining yields ore → smelt at furnace → bars → existing anvil. This gives a parallel gathering loop and lets players *grind toward* a specific upgrade instead of praying to the drop table. Mirrors the existing fish → cook → eat pipeline, so most of the pattern already exists in `startFishing`/`doFish`/`doCook`.

**Files.** `data.js` (ores, rocks, furnace point, `MINE_SPOTS`), `game.js` (mining action, click handling), `world.js`/`render.js` (draw rocks + furnace), `sprites.js` (optional art).

**Effort.** Medium — but it's a copy of the fishing/cooking systems you already have.

---

## Priority 6 — UX & quality-of-life

Smaller items, high player-visible value:

- **Skills/stats tab** showing actual XP and XP-to-next-level, not just the level number in the sidebar.
- **Settings / reset save.** There's currently no way to delete a save from the UI — add a third tab or a small gear menu with "Reset progress" (clears `localStorage[SAVE_KEY]`) and a mute toggle.
- **Bank "Deposit all" button** and item search once inventories grow.
- **Sound.** No audio at all — even a few Web Audio blips for hits, level-ups, and loot would lift game feel enormously for near-zero asset cost.
- **Mobile scaling.** The `<canvas width=640 height=480>` is fixed; the viewport tag is set but the canvas doesn't scale to small screens. Make it responsive with CSS `max-width:100%` and keep the internal resolution.

**Files.** `index.html` (tab), `game.js` (`renderPanel`, save/reset), `css/style.css` (responsive canvas), a small new audio helper.

**Effort.** Small each.

---

## Code notes (polish, not bugs)

None of these break play — the code is clean and readable — but for future-proofing:

- **A\* open list** in `findPath` uses a linear min-scan (`for … if (open[i].f < open[bi].f)`). Fine at 80×60 tiles; swap to a binary heap only if the map grows large.
- **Defence XP** trains only when a mob *misses* you (the `else` branch in `mobAttack`), which is a slightly odd incentive — consider granting a little Defence XP on blocked/reduced hits too.
- **Facing** is recomputed from the target every frame (`player.face = target.x >= player.x ? 1 : -1`), overriding movement direction while a target is set. Cosmetic.

---

## Suggested build order

1. Strength stat + max hit (P1) → **exponential XP curve (P2)** → retune rates. *This is the foundation; do it as one pass.*
2. Death penalty + aggressive crypt/lair mobs (P3).
3. One economy sink (P4).
4. Extra gear slots (rest of P1).
5. Mining + smelting (P5).
6. UX pass — stats tab, reset save, sound, mobile (P6).

Ship and playtest after each step; every item above changes balance, so tune drop chances and XP rates between passes rather than all at the end.
