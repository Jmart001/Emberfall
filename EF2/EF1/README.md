# Emberfall

Emberfall is a tile-based, point-and-click browser RPG inspired by the rhythm and interaction model of classic Old School RuneScape.

## Run the game

Open `index.html` in a modern browser. No installation or build step is required.

## Current playable systems

- 192 x 160 tile world rendered with clean, animated pixel shapes
- A* pathfinding around water, trees, walls, counters, fences, and ruins
- Smooth frame-based walking and camera movement
- A fixed 600 ms action tick for combat, enemy decisions, respawns, and skills
- Click-to-walk and click-to-interact action queues
- Rat and goblin combat with four-tick attack cycles, damage, death, loot, and respawns
- Fishing, cooking, food, XP, and skill levels
- General store and fishing-supply shop
- Enterable northern castle with a working bank
- Three linked quests forming Chapter One
- Greenrest Vale, Pineholt, Thornwood, Frostmere, Sablemarsh, Cinderforge, the Ashfall Wastes, and the Ashen Barrow dungeon
- Rats, goblin raiders, wolves, skeletons, cave spiders, and the Ashen Warden boss
- Quest markers and a live minimap
- Functional weapon equipment with accuracy, attack bonuses, and max-hit calculations
- OSRS-style four-tick combat cycles, hitsplats, XP drops, and action progress feedback
- Region banners for every settlement, the wilds, and Ashen Barrow
- Repeatable three-tick Mining with copper and iron resource rocks
- Repeatable four-tick Woodcutting with tree depletion and respawning
- Hatchets and tinderboxes sold by Alaric
- Two-tick Firemaking with portable fires, expiry, Firemaking XP, and cooking support
- Smithing recipes for bars and an iron longsword at the Cinderforge
- Bronze and iron pickaxes sold by Torren
- A 20-slot backpack with stackable resources and full-pack safeguards
- Item values and selling at every trader
- Per-item deposits and withdrawals at the Castle Bank
- Smooth visual interpolation for monsters while their movement decisions remain tick-based
- Combat target rings, attack motion, animated ground loot, and richer minimap markers
- Separate Attack, Strength, and Defence skills with Accurate, Aggressive, and Defensive combat styles
- Weapon-based max hits, armour-based enemy accuracy, wearable shields and platebodies
- OSRS-style right-click action menus with primary actions, Walk here, Examine, and Cancel
- Examine descriptions for NPCs, enemies, loot, rocks, fishing spots, fires, the forge, and dungeon entrances
- Ashen Barrow darkness and player-centred torch lighting
- Telegraphed Ashen Warden ground attacks that can be dodged between action ticks
- A persistent one-time Warden reward chest after defeating the dungeon boss
- Automatic browser saves and a New Character reset button

## Controls

- Click a ground tile to walk there.
- Click an NPC to path beside them and talk.
- Click a monster to chase and attack it.
- Click ground loot to pick it up.
- Click the western dock to fish and the orange range tile to cook.
- Click food in the backpack to eat it.

## Project files

- `js/data.js` - items, NPCs, monsters, shops, and quest data
- `js/world.js` - tile map, collision rules, and A* pathfinding
- `js/render.js` - clean tile and actor rendering
- `js/sfx.js` - Web Audio sound effects module
- `js/game1.js`, `js/game2.js`, `js/game3.js`, `js/game4.js` - the 600 ms tick loop and gameplay systems, split into four load-ordered files (fast travel and settings live in `game4.js`)
- `css/style.css` - classic fantasy interface
- `wiki.html` - standalone in-game wiki (opened via the 📖 button or G)
- `mapeditor.html` - standalone tile/entity map editor used to build and expand the world; exports a `world.js` replacement plus an entity block to paste into `data.js`

The generated world artwork remains in `assets/Design elements` as visual direction and for later map development, but it is no longer stretched underneath gameplay. This avoids the grainy appearance and keeps collision aligned exactly to the visible tiles.



- Shortbow combat with five-tile attack range and four-tick attacks
- Consumable bronze arrows, Ranged XP, animated projectiles, and enemy pursuit
- Skill progress bars and clearer contextual equipment information

- Prayer skill trained by burying monster bones
- Burst of Strength and Thick Skin prayers with tick-based point drain
- A functional altar inside Heartwood Castle that restores Prayer points

- Magic combat using the Ember staff and consumable Ember runes
- Six-tile Ember Strike casting with four-tick attacks, Magic XP, and animated spell projectiles
- Ember rune drops from goblins and Barrow skeletons

- OSRS-style toggleable running with a clickable status control and R keyboard shortcut
- Frame-based 105 ms running versus 185 ms walking, independent of action ticks
- Run energy drains per travelled tile and regenerates smoothly while not running

- Visible level-up banners and chat notifications for every skill milestone
- Hitpoints levels now increase maximum health and heal the newly gained capacity
- A live OSRS-inspired combat level derived from combat skills

- Ground drops stack by tile and item instead of creating unlimited duplicate objects
- Loot despawns after 100 game ticks to keep long sessions responsive
- Right-click Take-all for multi-item loot piles and hover labels for every stack

- Full interactive world map opened by clicking the minimap or pressing M
- Terrain, town labels, NPCs, monsters, current position, and quest destination markers
- Click-to-travel from the world map with collision-aware routing and dungeon safeguards

- Four new ambient NPCs: Guard Bren, Farmer Jory, Nessa, and Scout Vale
- Town-specific dialogue that adds local warnings and world lore
- Tick-driven NPC wandering with collision avoidance and smooth frame interpolation

- Repeatable monster contracts assigned and rewarded by Guard Bren
- Slayer skill progression with contracts scaling from rats and goblins to dungeon creatures
- Live contract tracking in the quest overlay and Journal with completion turn-ins

- OSRS-inspired death system that protects three valuable inventory stacks and quest items
- Visible ten-minute gravestones with partial recovery, map markers, and tracker guidance
- Expired or replaced gravestones are safely recovered to the Castle Bank instead of being destroyed

- Separate weapon, body armour, and off-hand shield equipment slots
- Combined armour and shield defence in enemy accuracy calculations
- Visible equipped shields on the player and automatic migration of older saves

- Crafting skill with a dedicated workbench inside Alaric's Heartwood shop
- Four-tick leather-body and cave-silk robe recipes using monster materials
- Crafted body armour integrates with equipment, defence, inventory value, and character colours

- Thieving skill with three-tick pickpocket actions on selected ambient NPCs
- Right-click Pickpocket options, coin rewards, XP, failure damage, and alert cooldowns
- Pickpocket targets pause their wandering while an attempt is in progress

- OSRS-style right-click inventory menus with Eat, Equip, Light, Bury, Drop, Examine, and Cancel actions
- Drop-one and Drop-all create normal stacked ground loot that can be recovered
- Quest items cannot be dropped, and item examination shows healing, bonuses, and value

- Persistent three-step interactive tutorial for movement, right-click actions, and starting the first quest
- Tutorial advances from real player actions and automatically disappears after speaking with Elowen
- A clear Skip tutorial control and automatic migration for existing characters

- OSRS-style Castle Bank transfer quantities for 1, 5, or all items
- Selected transfer amount remains active while depositing and withdrawing multiple stacks
- Clear backpack capacity, bank stack count, and per-action quantity labels

- Herblore skill with an animated brewing cauldron inside Oakridge
- Wild herb drops from goblins and wolves, with empty vials sold by Alaric
- Three-tick healing and run-energy potion recipes with contextual Drink actions

- Farming: buy cabbage seeds, plant persistent crop patches at Heartwood Farm, wait for real-time growth, and harvest food for Farming XP.

- Home teleport: press H or use the world-map button to return to Heartwood after a five-tick cast; it has a persistent 30-second cooldown and is interrupted by combat.
- Readable road signs now guide travel between Heartwood, Oakridge, the frontier, fishing pond, and Ashen Barrow.

- Oakridge's Resting Stag inn is now functional: Tamsin sells powerful stew, shares regional lore, and rents a five-tick rest that restores Hitpoints, Prayer, and run energy.
- Bard Fen now performs at the inn, with new beds, hearth details, and tavern dressing to make Oakridge feel inhabited.

- Ashen Barrow now has a persistent lever-and-portcullis puzzle. The Warden chamber is physically blocked from pathfinding until the player completes a three-tick lever action; the unlocked state survives reloads.

- The Journal now includes a persistent bestiary with per-species kill counts and discovered drop tables.
- The Warden chest now awards a unique 6-Defence Warden cloak, and combat displays a centered target health panel for clearer boss fights.

- Willowmere is a new northeast woodland settlement with two buildings, roads, hedges, map labeling, Elder Willow, Hunter Orin, and villager Maeve.
- Wild boars now roam Willowmere's outskirts, drop raw boar meat, count toward the bestiary and Slayer contracts, and use unique creature artwork.
- Raw boar meat can be cooked for 18 Cooking XP into food that heals 7 Hitpoints. Elder Willow offers a four-tick blessing, while Orin sells hunting equipment.

- Willowmere now has a complete side quest, The Boar Hunt: accept it from Elder Willow, defeat three local boars, return for completion dialogue, and receive 150 coins, 80 Slayer XP, 50 Cooking XP, and a unique +4 Defence Willowmere mantle.
- Side-quest progress appears in the live objective tracker and all availability, active, and completed states appear in the Journal. Progress and completion persist in existing saves.

- Hunter is now a trainable skill. Buy a reusable wooden snare from Hunter Orin and click Willowmere rabbit burrows to perform a four-tick trapping action with success and failure outcomes.
- Successful snares grant 20 Hunter XP, raw rabbit, and rabbit fur; misses grant 5 XP. Raw rabbit can be cooked for 20 Cooking XP into food that heals 8 Hitpoints.
- The render loop now starts only after player state initialization, removing a browser timing race that could occasionally leave the world canvas blank.

- Fletching is now a trainable portable production skill. Hunter Orin sells carving knives; click a knife in the backpack to open the recipe interface.
- Four-tick recipes turn 1 log into 15 bronze arrows at level 1 (20 XP), or 2 logs into a shortbow at level 4 (42 XP). Outputs integrate directly with ranged combat and equipment.

- Equipment now includes a fourth gloves slot with full save migration, equip/unequip controls, visible character gloves, and defence included in monster accuracy calculations.
- At Crafting level 3, the Heartwood workbench can sew 3 rabbit furs into Rabbit-fur gloves over four ticks, granting 40 Crafting XP and +2 Defence.

- The onboarding tutorial now has six persisted steps with a visible progress counter: movement, right-click actions, starting the story, world-map travel, running, and the Journal/Bestiary. Each step advances only when the matching real control is used, and skipping still works.

- NPCs now speak short region-appropriate ambient lines in timed overhead bubbles, rotating on a lightweight 12-tick cadence without affecting movement or action timing.
- Quest markers now distinguish gold ! start points from blue ? turn-ins for all three main quests and The Boar Hunt; simultaneous markers render in the world and on the full map.

- Repeat Ashen Warden kills now drop 1-2 stackable Ashen shards instead of duplicating the protected quest relic. The quest kill still grants exactly one Ember relic through story progression.
- After Chapter One, Scholar Mira runs an Ashen shard exchange: 3 for 25 Ember runes, 5 for 3 healing potions, or 8 for 250 coins. Exchanges handle full-inventory edge cases and persist immediately.

- The minimap now behaves like an OSRS minimap: click it to create a long-range A* path on the current world layer. M still opens the full world map.
- Minimap travel snaps blocked clicks to nearby walkable tiles, refuses surface/dungeon boundary skips, shows hover guidance, and draws a cyan destination ring while the world shows the normal destination tile.


## Performance pass
- The static minimap terrain is cached instead of rebuilding more than 1,500 terrain samples every animation frame.
- Off-screen NPCs, monsters, quest markers, speech bubbles, and ground drops are culled while actor interpolation stays current.
- Chat history is capped at the newest 120 messages to prevent long sessions from steadily slowing the interface.
- Walking and running remain frame-driven and seamless; the 0.6-second game tick remains limited to combat, gathering, and other timed actions.

## Silk and Cinders side quest
- Scout Vale on the Eastern Frontier now offers a persistent dungeon-linked side quest once the Oakridge storyline reaches the frontier.
- Defeat four cave spiders in the lower Ashen Barrow, then return to Vale when his blue completion marker appears.
- The quest has full journal and on-screen tracker support, save migration for existing characters, kill progress, dialogue, and a reward of a cave-silk robe, 180 coins, 20 Ember runes, 100 Magic XP, and 70 Slayer XP.

## Embercross waystation
- A new tile-based settlement now sits south-east of Heartwood, with connected roads, two enterable buildings, fences, a hearth, signage, region banner, and world-map label.
- Mara operates an affordably priced road-provisions shop with food, potions, runes, and vials.
- Brother Edric offers a free four-tick wayfire rest that restores Hitpoints, Prayer, and run energy, with a persistent five-minute cooldown.
- Existing characters automatically gain the new cooldown save field without losing progress.

## The Broken Road side quest
- Mara in Embercross now offers a persistent local quest after the Heartwood guide quest.
- Defeat four Road Bandits, follow live tracker and quest-marker updates, then return to Mara to secure the settlement's supply route.
- Rewards include the unique Embercross buckler (+3 shield defence), 160 coins, 80 Defence XP, and 60 Slayer XP.
- Mara's provision shop remains available before, during, and after the quest, and existing saves migrate automatically.

## Ashen Warden enrage phase
- The dungeon boss now enters a clearly announced second phase below half health instead of remaining mechanically flat.
- Enraged hazards appear twice as often, resolve one tick faster, and deal 4 damage instead of 3.
- Purple floor telegraphs, a pulsing Warden aura, an ENRAGED boss-HUD label, and combat messages make the phase readable rather than surprising.
- Enrage state resets correctly whenever the Warden respawns.

## Control and cancellation polish
- A compact on-screen control strip now lists M for map, R for run, H for home teleport, and Escape for cancel.
- Escape follows a predictable hierarchy: close the world map, dialogue, context menu, or item menu first; otherwise cancel travel, combat, pending interactions, or timed skills.
- Cancelling during a tile transition finishes the current smooth step rather than snapping the character between tiles.
- Clicking a new ground destination continues to interrupt combat and skills immediately while walking remains frame-driven and independent of game ticks.

## Aggressive monster engagement
- Aggressive enemies now properly initiate combat when they reach an adjacent tile instead of silently overlapping the player.
- Chase steps stop before entering the player's tile and avoid NPCs and other living monsters.
- The first adjacent attacker becomes the active combat target; nearby enemies no longer repeatedly replace it.
- Enemy aggression interrupts vulnerable timed skills and pending interactions, displays a clear attack message, and begins normal tick-based incoming attacks while movement remains frame-driven for escape attempts.
- Giant rats remain passive starter enemies.

## Monster territory and leashing
- Monsters displaced during a chase now walk back toward their original spawn tile when the player leaves aggro range.
- Return-home movement happens gradually on game ticks, preserving the action rhythm while preventing enemies from permanently drifting into towns and roads.
- Chase, combat pursuit, and leash movement share collision checks that avoid the player tile, NPCs, and other living monsters.
- Re-entering range still triggers normal aggression, and respawns continue to restore the exact home position and boss phase state.

## Ashen Barrow lore collection
- Three readable stone tablets are distributed across separate dungeon chambers, each with original Barrow history.
- Undiscovered tablets use weathered runes; recorded tablets gain a pulsing blue glow for immediate visual recognition.
- Discoveries persist per character and appear as a 0/3 collection in the quest journal without revealing unread tablet names.
- Recording all three awards 60 Prayer XP and one Ashen shard exactly once; rereading remains available without duplicating rewards.

## Off-screen quest compass
- When a quest NPC marker is outside the camera, a gold or blue directional arrow now appears safely inside the viewport edge.
- The compass labels the NPC and current tile distance, prioritizing the same main-quest and side-quest marker order used by the world map.
- It disappears once the NPC is visible and hides while the player is inside Ashen Barrow rather than pointing misleadingly toward another world layer.
- The compass is render-only and does not alter smooth walking, pathfinding, or action ticks.

## Main-quest progression repair
- The third main quest previously asked for a key from a dungeon skeleton while the same key was required to enter the dungeon, creating an impossible progression loop.
- A new Barrow guardian now patrols the reachable surface ruins beside the entrance and carries the quest key.
- The guardian has unique health, XP, loot, aggression, skeleton visuals, spawn leashing, minimap presence, and a bestiary entry.
- Scholar Mira's dialogue and the quest journal now direct the player to the surface guardian before the key-gated dungeon entry.
- The full chain from quest acceptance through guardian, key, portal, Warden, relic return, and chapter completion is verified end to end.

## Ash Bats
- Three Ash Bats now inhabit separate Ashen Barrow chambers, adding a lighter but aggressive enemy between skeleton and spider encounters.
- Bats have unique health, damage, XP, bones, coin, and Ember rune drops, plus bestiary and post-frontier Slayer contract support.
- Their custom graphics include smoothly flapping wings, pointed ears, and glowing eyes while retaining normal target rings, hit splats, health bars, and minimap markers.
- Ash Bats use the same collision-safe aggression, spawn leashing, tick combat, and respawn systems as other monsters.

## Full main-quest objective compass
- The navigation compass now covers every step of all three main quests rather than appearing only for NPC conversations.
- It can point to Guide Elowen, Murphy, the fishing spot, cooking range, nearest living goblin, Captain Rowan, Scholar Mira, the surface Barrow guardian, dungeon entrance, and Ashen Warden.
- Main-story objectives take priority over optional side-quest markers, and monster objectives choose the nearest relevant living spawn.
- The Warden step points to the entrance while on the surface and switches to the boss after entering the dungeon, preserving correct world-layer guidance.

## Objective markers on maps
- The current main-quest or optional objective now appears as a gold diamond on the minimap.
- This is visually separate from the cyan click-to-travel destination ring, and both can display simultaneously.
- Minimap objectives only render on the player's current surface or dungeon layer, preventing misleading cross-layer targets.
- The full world map displays a larger gold ring, diamond, and OBJECTIVE label at the exact target location for NPC, activity, monster, entrance, and boss steps.

## OSRS-style loot probabilities
- Monster drop entries now support independent probabilities instead of always producing every listed item on every kill.
- Guaranteed bones, coins, goblin hides, spider silk, Warden shards, and quest key/relic progression remain dependable.
- Herbs, some Ember runes, bandit food, and boar meat now have balanced chances, reducing inventory clutter and making secondary drops feel rewarding.
- Successful stacks still merge on the ground, the bestiary continues to show possible spoils, and quest-critical goblin hides remain guaranteed.

## Side-quest objective guidance
- After Chapter One, the compass, minimap, and full map now guide active side quests instead of going idle between NPC markers.
- The Broken Road points to the nearest living Road Bandit, The Boar Hunt points to a Wild Boar, and Silk and Cinders points to the Barrow entrance on the surface or a Cave Spider inside.
- Once kill requirements are met, guidance switches immediately to Mara, Elder Willow, or Scout Vale.
- Ready-to-complete quests take priority over unfinished combat objectives, followed by a stable Broken Road, Boar Hunt, then Silk and Cinders order.

- Replayable Ashen Barrow runs: each Warden defeat awakens the reward chest, with a unique first-clear reward, randomized repeat loot, and a persistent clear counter in the Journal.
- Barrow run timer with an in-game stopwatch, last-clear time, persistent personal best, and automatic run start/abandon handling.
- OSRS-style Barrow reward potential: optional skeleton, cave spider, and ash bat kills improve repeat chest rewards up to 100%, with live HUD feedback and a persistent best record.
- Barrow collection log with the first-clear Warden cloak, rare Ashen guard shield, and Barrow lantern; carrying the lantern expands dungeon visibility and reward potential improves unique chances.
- Oakridge side quest “Hearth and Home”: help Tamsin gather boar meat, cabbage, and wild herbs for a village feast, with ingredient-aware guidance and Cooking/Farming rewards.
- Mirehaven settlement southwest of Heartwood, with a connected road, fenced marsh buildings, Healer Sable, trader Fenwick, Bogling monsters, Mirehaven supplies, and the “A Cure for Mirehaven” quest.
- Mirehaven visual pass with dedicated animated marsh terrain, walkable plank boardwalks, reeds, puddle ripples, and warm low-cost settlement lantern effects.
- Tick-based Mirehaven poison: aggressive Boglings can inflict five-dose venom, poison damages only on game ticks, a clear HUD indicator shows remaining doses, and Marsh antidotes can be bought or brewed from Bog moss and vials.
- World Discovery journal tracking Heartwood, Oakridge, Willowmere, Eastern Frontier, Embercross, Mirehaven, and Ashen Barrow, with first-entry banners and a one-time 250-coin Explorer Cape reward.
- Data-driven continuous fishing: Heartwood riverfish and level-3 Mirehaven marsh eels use three-tick repeat actions, visible fishing ripples, bait/inventory checks, Cooking support, and cooked eels relieve two poison doses.
- Housing rebuilt with edge-based building walls: perimeter walls now occupy tile boundaries rather than whole tiles, interiors use every floor tile, doors are true wall gaps, pathfinding respects edge collision, and walls render with shadow, masonry depth, and trim.
- Housing visual detail pass with regional interior materials, timber or stone floor patterns, rugs, windows, shelving, crates, subtle warm lighting, corner masonry posts, framed door gaps, and wooden thresholds.
- Entity polish pass with distinct wolf anatomy, improved goblin ears and faces, Warden armour, Bogling foliage, boar manes, rat paws and noses, bat wing structure, spider abdomens, skeleton ribs, human capes, shaded clothing, belts, limbs, hair, and profession-specific NPC accessories.
- Heartwood Plains reference-style terrain pass using project-local texture derivatives from the supplied artwork, fine-grain palette noise, conifer canopies, organic path edges, shoreline highlights, pebbles, flowers, grass tufts, undergrowth, and a subtle warm vignette.

## Ground visual rebuild
The ground renderer now uses a clean reusable terrain system with coordinated grass, paths, animated water, marsh, stone, wooden floors, subtle deterministic variation, and automatic terrain-edge detailing. This is the first stage of the approved visual rebuild; buildings are next.

## Playable illustrated world
The approved detailed world concept is now rendered as the seamless overworld artwork. The existing invisible tile grid, click-to-walk pathfinding, collision, NPCs, quests, monsters, resources, and interactions remain active above it.

## World rename and Cinderforge expansion
- The map grew to 192x160 tiles and every settlement was renamed: Heartwood -> Greenrest Vale, Oakridge -> Pineholt, Willowmere -> Thornwood, Embercross -> Frostmere, Mirehaven -> Sablemarsh, and the Ashen Barrow's surface ruins -> the Ashfall Wastes. Earlier entries in this log use the old names.
- Cinderforge is a new volcanic settlement housing Torren's smithing and the forge (previously "Frontier Forge").
- Five new monsters — dire wolves, a goblin warlord, cinder fiends, frost trolls, and a cinder colossus — were added around Frostmere and Cinderforge.
- A standalone `mapeditor.html` tool (paint/fill/rect/line tools, prefab structures, entity placement, undo/redo, and a `world.js` + entity data export) was built to construct and expand the world.
- All player-facing item names, quest text, dialogue, and the in-game wiki (`wiki.html`) were updated to match the new town names; internal code identifiers (e.g. `cureMirehaven`, `discoveredRegions.Heartwood`) were left as-is since they aren't player-visible.
