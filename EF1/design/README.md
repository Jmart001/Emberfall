# Emberfall — Design Documents

## Current Direction

**[REVISED_FUTURE_STATE.md](REVISED_FUTURE_STATE.md) is the authoritative
future-state plan.**

It defines the current target:

- A single-player-first 3D browser RPG
- Seven primary regions
- Sixteen main quests
- Four raids
- One canonical outcome for every quest
- One ending: **TEND**
- A Greenrest vertical slice as the next development milestone

The original documents below are retained as a concept archive. Their lore,
encounters, NPCs, items, and mechanics may be reused where they support the
revised plan, but their original quantities, branches, multiplayer
requirements, and build order are no longer commitments.

## Concept Archive

World expansion built on the existing wiki lore (The Bound Ember). Nothing here contradicts current canon; everything deepens it.

| Doc | Contents |
|---|---|
| **[00_WORLD_BIBLE.md](00_WORLD_BIBLE.md)** | Cosmology, the truth about the Ember, the three seals, timeline (Year 0 → 447), five factions, all 11 regions with sub-zones, the three endings, writing style guide |
| **[01_QUESTLINES.md](01_QUESTLINES.md)** | 34 quests across 6 questlines with OSRS-style dialogue, puzzles, bosses, and rewards |
| **[02_RAIDS.md](02_RAIDS.md)** | 11 raids — one per region — each with a unique core mechanic, full boss phases, and loot tables |
| **[03_NPCS_AND_ITEMS.md](03_NPCS_AND_ITEMS.md)** | 38 new NPCs with dialogue, 68 new items, expanded roles for the 27 existing NPCs, implementation notes |

## The short version

**The twist:** the Ember isn't a monster. It's a hearth-fire — one of nine set beneath the world to warm it from below. The ninth woke up, reached for someone to tend it, and burned everything it touched because that's what fire does to what it loves. Every atrocity in Emberfall's history is a lonely thing trying to make friends.

**The Wanderer's secret:** you aren't a descendant of the Warden bloodline. You are the **eighth Cinders Warden** — you died making the seal four hundred years ago, and the Ember has been slowly putting you back together ever since, because it wanted its tender returned. Your amnesia isn't damage. It's incompleteness.

**The choice:** re-seal the Ember (condemn it to eternal solitary confinement), release it (it will burn the world, but won't be alone), or **tend** it — take the Cinders seal onto yourself and become the next Ashen Warden. The true ending costs the player character everything.

## Scope added

- **4 new regions** (Emberreach, Ash Sea, Ninefold Deep, Ashvale Keep) + sub-zones for all 7 existing
- **6 questlines**, 34 quests, tiered ★ to ★★★★★
- **11 raids**, no two sharing a core mechanic
- **38 NPCs**, **68 items**, 3 endings
- **New antagonist:** Warden-Commander Alder Ashvale — Mira's teacher, thirty years listening to the Ember, and right about the facts

## Build order

Two systems unlock nine of the eleven raids:

1. **`RaidGauge`** — one shared numeric gauge with thresholds. Powers Flame (Wayfire Vault), Heat (Deep Bellows), Hull (Cinder Galleon), Wakefulness (Second Hearth).
2. **`TileEffectField`** — per-tile effect overlays. Powers sound zones (Verse Bell), gravity wells (Fallen Star), and the Ashen Barrow's existing burning sigils.

Then: Raid 1 (simplest, validates the framework) → Questline I quests 1–3 (no new regions needed) → Raids 2–3 (existing regions) → regional questlines → new regions → Questline VI and the endings.

## Consistency check

Verified against `EF1/js/data.js` and `EF1/wiki.html`:

- No new NPC name collides with the 27 existing NPCs
- All 11 raids named in the world bible have full detail sections
- All quest reward items exist in the item roster
- Existing quests, the Ashen Barrow raid, and all current lore are preserved intact
