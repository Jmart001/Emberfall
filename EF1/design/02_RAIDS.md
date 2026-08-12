# Emberfall — Raids

*One raid per region: eleven total. The Ashen Barrow already exists in-game and is canonised here as Raid #7 with its current mechanics intact.*

**Design rule:** no two raids share a core mechanic. If a raid's central idea could be swapped into another raid without changing it, one of them is wrong.

---

## Raid Roster

| # | Raid | Region | Level | Party | Core mechanic — *one line* |
|---|---|---|---|---|---|
| 1 | **The Sunken Grainhall** | Greenrest Vale | 10+ | 1–2 | **Rising water** — the floor floods; height is safety |
| 2 | **The Hollow Pines** | Pineholt | 18+ | 1–3 | **Hidden occupancy** — any tree may hold an enemy; scouting *is* the raid |
| 3 | **The Verse Bell** | Thornwood | 26+ | 2–4 | **Sound zones** — safe tiles are defined by music, not geometry |
| 4 | **The Wayfire Vault** | Frostmere | 30+ | 2–4 | **Light economy** — a finite pool of flame spent on sight, heat, or damage |
| 5 | **The Deep Bellows** | Cinderforge | 36+ | 3–5 | **Heat pressure** — a shared gauge that both empowers and kills you |
| 6 | **The Drowned Court** | Sablemarsh | 32+ | 2–4 | **Procedure** — combat is forbidden until you're granted standing |
| 7 | **The Ashen Barrow** *(exists)* | Ashfall Wastes | 30+ | 1–3 | **Random chamber unlock** — nine rooms, fresh order every run |
| 8 | **The Fallen Star** | Emberreach | 44+ | 3–5 | **Gravity wells** — the arena pulls; positioning is a physics problem |
| 9 | **The Cinder Galleon** | Ash Sea | 48+ | 3–5 | **Ship boarding** — a moving arena you must keep afloat |
| 10 | **The Second Hearth** | Ninefold Deep | 54+ | 4–6 | **Sleep meter** — waking the boss is the failure state |
| 11 | **The Hollow Throne** | Ashvale Keep | 60+ | 1 *(solo)* | **Mirror combat** — the boss is your own build |

---

# 1. The Sunken Grainhall
**Greenrest Vale · Level 10+ · 1–2 players · ~12 min**

The oldest grain silo at Millrow Farms has a flooded cellar. It is not a cellar. It is the roof of a Warden storehouse that the Vale was built on top of, and it has been slowly filling for four hundred years.

### Layout
A five-level vertical shaft. You start at the **bottom** and climb. Water rises from below on a fixed timer.

| Level | Contents |
|---|---|
| 5 (bottom) | Grain floor — starting chamber, 4 **drowned farmhands** |
| 4 | Sluice room — the **first valve puzzle** |
| 3 | Storage — 6 **rot-rats**, 2 supply crates |
| 2 | The Warden cache — lore tablet, second valve |
| 1 (top) | **Boss: the Millwright** |

### Core mechanic — Rising Water
The water rises one tile of height every 45 seconds and never recedes. Standing in water: attack speed −1 tick, and **drowning damage** (2/sec) once it's over your head. There is no way to stop the rise — only to **outpace it**.

Two **sluice valves** (levels 4 and 2) each buy 90 seconds by diverting flow. They must be turned by two people simultaneously *or* by one player who has found the **iron crank** (a hidden item on level 3). This is the raid's soft solo-vs-duo gate.

### Boss — The Millwright *(level 16, 120 HP)*
A waterlogged Warden quartermaster still turning the mill that ground the storehouse's grain. Not malicious; will not stop working.

**Phases**
1. **Grinding** — swings a millstone chain in a 3-tile arc. Telegraphed by the chain lifting. Move perpendicular.
2. **The Wheel** *(below 60%)* — starts the mill wheel; the arena gains a rotating current that shoves you one tile per second toward the shaft. Fight while being pushed.
3. **The Flood** *(below 25%)* — he opens every sluice at once. Water rises 4× faster. Pure DPS race; if the water reaches the ceiling, wipe.

**Mechanic to teach:** vertical positioning and hard timers — the foundation for every later raid's arena awareness.

### Loot
| Item | Rate |
|---|---|
| Coins (600–1,400) | Always |
| **Millwright's chain** (weapon, atk 8, speed 5, spec: *Sweep* — hits all adjacent) | 1/12 |
| **Grainhall keel** (shield, def 6, no water speed penalty) | 1/15 |
| **Warden storehouse tablet** (lore) | First clear |
| Iron/steel bars, cabbages *(absurd quantity)* | Common |

---

# 2. The Hollow Pines
**Pineholt · Level 18+ · 1–3 players · ~18 min**

A grove of forty pines. The trees are hollow. Most are empty.

### Layout
An open 24×24 outdoor grove — **no corridors, no doors.** Forty tree markers scattered across it. The raid is a search, not a crawl.

### Core mechanic — Hidden Occupancy
Each of the 40 trees is one of:
- **Empty** (24 trees) — nothing
- **Occupied** (12 trees) — a **pine-lurker** bursts out and attacks
- **Cached** (3 trees) — supplies or a lore tablet
- **The Queen's tree** (1) — the boss

You cannot tell which is which by looking. You can tell by **listening**: standing adjacent to a tree for 3 seconds gives a chat cue —
> *"You hear nothing but wind."* → empty
> *"Something inside shifts its weight."* → occupied
> *"You hear a dry rattle, like seeds in a gourd."* → cached
> *"The tree is breathing."* → the Queen

Listening is safe but slow. **Chopping without listening** is fast but wakes whatever's inside *plus the two nearest occupied trees.* The raid is a risk/patience economy, and it plays completely differently solo (careful, slow) versus in a trio (split up, brute-force, accept chaos).

**Escalation:** every 2 minutes, all occupied trees *relocate* — lurkers move to new hosts. Information decays. A map you made three minutes ago is a lie.

### Boss — The Pine Queen *(level 26, 200 HP)*
A lurker matriarch fused to the heartwood of her tree. She never leaves it.

**Phases**
1. **Rooted** — attacks with lashing roots at range 4. Her tree is invulnerable; you must fight the roots (3 root-arms, 40 HP each) to expose her.
2. **Seeding** *(below 50%)* — she flings seeds into 6 empty trees, creating fresh lurkers on a 20-second timer. Ignore them and you're overrun; over-commit and she heals 5 HP/sec.
3. **Uprooting** *(below 20%)* — she tears free and *walks*, and now the whole grove is her arena. Fast, erratic, and she can re-enter any occupied tree to heal.

**Counter:** clear occupied trees *before* the fight so she has nowhere to hide in phase 3. The raid rewards preparation over reaction.

### Loot
| Item | Rate |
|---|---|
| Coins (900–2,000) | Always |
| **Heartwood bow** (ranged 12, spec: *Splinter* — 3 hits, ignores 50% defence) | 1/14 |
| **Lurker hide** (body, def 8, +2 stealth in Hollow Pines) | 1/16 |
| **Pine Queen's seed** (plantable — grows a permanent home-teleport tree) | 1/40 |
| Logs, pine tar, hides | Common |

---

# 3. The Verse Bell
**Thornwood · Level 26+ · 2–4 players · ~22 min**

The Singing Grove, during a full Choir performance. The Bell must be rung true — while the Ember's heat tries to crack it.

### Layout
A circular grove, the Bell at its centre, five **Choir platforms** around the rim. One continuous arena; no rooms.

### Core mechanic — Sound Zones
The Choir sings continuously. At any moment the grove is divided into **harmonic** and **dissonant** tiles, and the pattern *moves with the music* — visualised as coloured bands sweeping outward from the Bell in time with an audible beat.

- **Harmonic tiles** (in tune): safe. Damage dealt +25%.
- **Dissonant tiles**: 4 damage/sec, and your attacks miss 40% more.
- The pattern changes every **4 beats** — roughly 6 seconds — and the beat is audible, so a player who *listens* can move a beat early instead of reacting late.

This is the only raid where audio is a real mechanic. It should still be fully playable muted (the bands are visible), but muted play is meaningfully harder — a deliberate accessibility trade-off, and there's a **Bellringer's metronome** item that adds a visual pulse for players who want it.

### Second layer — The Choir
Five singers stand on the rim platforms. Each **holds one voice** of the harmony. If a singer dies:
- That voice drops out
- The safe-tile pattern loses a band — the arena gets *more dangerous*, not less
- The final Bell recasting is permanently weakened

Enemies (**discord-shades**) spawn at the rim and beeline for singers, ignoring players. The raid is a **defence problem wearing a boss fight's clothes.**

### Boss — Discord *(level 36, 300 HP)*
Not a body. A wrong note given weight. Rendered as a distortion in the air.

**Phases**
1. **Flat** — sings a note a semitone low. One band of the arena is permanently dissonant and drifts.
2. **Sharp** *(below 66%)* — adds a second, opposing drift. The two bands cross; the intersections are instant death and must be read a beat ahead.
3. **Atonal** *(below 33%)* — the beat becomes irregular (5/4, then 7/8). Safe tiles still exist but the rhythm no longer helps. Pure visual reading.
4. **Silence** *(below 10%)* — all audio and all bands cut out for 8 seconds. The arena is uniformly safe, Discord is helpless, and the Choir sings the true Oath. Free damage window — but if the Choir has fewer than 3 singers left, Silence never comes and the raid becomes unwinnable. **The failure is decided ten minutes before you feel it.**

### Loot
| Item | Rate |
|---|---|
| Coins (1,600–3,200) | Always |
| **Verse Bell fragment** (crafting — 3 make the Bellringer's mantle) | 1/8 |
| **Chorister's blade** (atk 13, speed 3, spec: *Harmony* — next 3 hits guaranteed) | 1/18 |
| **Bellringer's metronome** (visual beat indicator, QoL) | 1/10 |
| **Silent step** (boots, def 6, discord-shades ignore you 4s after a kill) | 1/22 |

---

# 4. The Wayfire Vault
**Frostmere · Level 30+ · 2–4 players · ~25 min**

Under the glacier: 108 lantern wicks, most drowned. Total darkness, killing cold, and one resource that solves all three problems.

### Layout
A branching under-ice complex — 7 chambers, 3 of them optional. Dark by default; you see 2 tiles without light.

### Core mechanic — Light Economy
The party shares a single pool: **Flame** (starts at 100, does not regenerate except from wick caches). Every second, Flame drains by 1 for each of these you have active:

| Spend Flame on | Effect |
|---|---|
| **Sight** | Vision radius 2 → 7 tiles |
| **Warmth** | Suppresses cold damage (3/sec without it) |
| **Heat** | Your attacks deal +40% and count as fire damage |

You can run one, two, or all three — at 1, 2, or 3 Flame/sec. **Wick caches** scattered through the vault restore 25 Flame each, and there are exactly enough to finish *if* you are disciplined.

The raid becomes a constant negotiation: fight in the dark to save Flame, or burn it to see and risk running out at the boss. Running out entirely = blind, freezing, and doing 40% less damage. It is survivable. It is not fun, which is the point.

**Optional chambers** hold big wick caches but cost time and Flame to reach — a real risk/reward branch, and the main reason to bring 4 players (split the party, halve the traverse cost, double the danger).

### Boss — The Rime Custodian *(level 40, 420 HP)*
A Warden who wrapped himself in the vault's ice to stop himself burning. Still lucid. Still sorry.

**Phases**
1. **Vigil** — melee, slow, heavy. Standard. He *extinguishes* one wick cache in the room every 30 seconds — a soft enrage on your Flame budget.
2. **Frostbind** *(below 60%)* — freezes one player solid (5 seconds). Allies free them by attacking the ice — **or** by spending 15 Flame. Solo-adjacent parties must pay Flame; full parties can save it. Party size changes the resource maths, not the damage numbers.
3. **The Long Dark** *(below 30%)* — he snuffs *all* light. Flame spending is disabled for 20 seconds. The arena is pitch black except for his eyes and his attack telegraphs, which glow. You fight by reading two points of light.
4. **Thaw** *(below 10%)* — he stops fighting and asks you to finish it. If you attack, normal kill. If you **wait 15 seconds without attacking**, he unwinds his own ice and dies free — granting a bonus drop (**Custodian's gratitude**) and a Journal entry. *Most parties will never discover this because nobody waits.*

### Loot
| Item | Rate |
|---|---|
| Coins (2,000–4,000) | Always |
| **Everflame lantern** (light source, no Flame cost) | 1/12 |
| **Rime plate** (body, def 13, immune to cold damage) | 1/16 |
| **Custodian's gratitude** (amulet, +10% Flame efficiency) | Wait-for-Thaw only |
| Mithril bars, coldwicks | Common |

---

# 5. The Deep Bellows
**Cinderforge · Level 36+ · 3–5 players · ~30 min**

The volcano's throat. The Emberwrights' forge-halls. Everything here is trying to be hotter.

### Layout
Three descending forge-halls connected by the Great Bellows shaft. Linear, but each hall has a **pressure valve** that must be managed while fighting.

### Core mechanic — Heat Pressure
A shared party gauge, 0–100, displayed as a rising bar.

| Heat | Effect |
|---|---|
| 0–24 | **Cold** — your attacks deal −30%; Emberwright machinery won't operate |
| 25–74 | **Working** — normal |
| 75–94 | **Forging** — attacks +50%, and *enemy* attacks +50% |
| 95–100 | **Overpressure** — 8 damage/sec to everyone; at 100 for 10s, the hall vents and wipes the party |

Heat **rises** when you deal fire damage, use specials, or stand near forges. It **falls** when you use water quenches (limited charges), stand on cold plates (safe but you can't attack from them), or when a party member is downed.

The raid is a **shared throttle**: everyone wants to sit at 90 for the damage bonus, and everyone dies at 100. It is the only raid where your teammates' damage output can kill you, and it is deliberately a communication test.

**Solo/small-party note:** with 3 players, heat rises slower — the fight is safer but the DPS check on the boss is tighter. There's no party size that trivialises it.

### Boss — Slagborn *(level 42, 650 HP)*
The thing the Deep Bellows made: a suit of armour with a heartbeat and nothing inside.

**Phases**
1. **Tempering** — melee. **Adapts:** deal it the same damage type (melee/ranged/magic) three times in a row and it becomes *permanently immune to that type for the rest of the fight*. Parties must rotate deliberately. This is why 3–5 players: you need at least two damage types covered.
2. **The Quench** *(below 65%)* — dives into the slag pool, dropping party Heat to 0 (Cold penalty) and emerging armoured. You must rebuild Heat while fighting at −30%.
3. **Bellows Roar** *(below 35%)* — pumps the Great Bellows: Heat rises 5/sec automatically regardless of your actions. Now you're fighting the gauge *and* the boss, and the quench charges you didn't waste in phase 1 are the difference between a clear and a vent.
4. **Hollow** *(below 10%)* — the armour splits open. It is empty, and it keeps fighting, and the heartbeat gets louder. No new mechanic — just the sound, and a chat line: *"It has no lungs. It is still breathing."*

### Loot
| Item | Rate |
|---|---|
| Coins (3,000–6,000) | Always |
| **Emberforged ingot** (2–5) | Always |
| **Slagborn core** (amulet, immunity to Overpressure damage) | 1/14 |
| **Hollow plate** (body, def 15, +10% damage at Heat 75+) | 1/18 |
| **Bellows hammer** (atk 17, speed 6, spec: *Overpressure* — dumps all Heat into one hit) | 1/25 |

---

# 6. The Drowned Court
**Sablemarsh · Level 32+ · 2–4 players · ~28 min**

The sunken palace of the Quiet Court. They are dead, polite, and will not tolerate an unscheduled visit.

### Layout
A formal palace: antechamber, three petition halls, the records vault, the audience chamber. Low water only — a **20-minute window** before the tide returns and floods the raid (soft timer).

### Core mechanic — Procedure
**You cannot attack anything in this raid until you have Standing.** Weapons are sheathed on entry; attempting to draw gets you removed from the palace (soft wipe — ejected to the marsh, must re-enter and restart the tide timer).

Standing is earned by satisfying the Court's process, in order:

1. **Announcement** — ring the visitor's bell the correct number of times (the count is your party size, which the game never tells you)
2. **Credentials** — present a seal of introduction to the Usher
3. **Dress** — all party members must wear Court mourning silks; *one improperly dressed member fails the whole party*
4. **Filing** — locate your own petition in the records vault, which is organised by a system explained only in a four-hundred-year-old memo you must find first
5. **Precedence** — you are 1,431st in the queue. Getting seen sooner requires either bribery (coins), a favour called in (from Questline V), or **arguing precedent** (a dialogue puzzle where you cite prior rulings found on tablets around the palace)

Only after all five does the Chamberlain grant Standing — and **only then do your weapons unsheathe**, which is also the moment the Court's guards become attackable and the raid turns into a fight.

The first two-thirds of this raid have **no combat at all**, and that's the point: it's the only raid you can fail purely by being rude.

### Boss — Lord Chamberlain Vess *(level 44, 500 HP)*
He does not want to fight you. He is *obligated* to, because you filed a challenge, and the challenge was in order.

**Phases**
1. **Formal Objection** — fights by the rules of ceremonial duel: only melee, only from the front, and he **stops when you stop.** Disengaging pauses the fight entirely. Free resets — but the tide is still coming.
2. **Point of Order** *(below 70%)* — summons **two clerks** who *document* the fight. Any attack you repeat more than twice in a row gets "entered into the record" and does 75% less damage forever after. Vary or be nullified.
3. **Contempt** *(below 40%)* — you have been ruled in contempt. All rules drop; he fights dirty, fast, and from any angle. The politeness was the safety rail and you just lost it.
4. **Adjournment** *(below 15%)* — he calls for adjournment. **Accept** and the raid ends peacefully: reduced loot, but the Court is dissolved and its members finally die (permanent world-state change, unlocks Questline V-4). **Refuse** and fight to the death for full loot and a Court that stays trapped forever. *The greedy option is the cruel one.*

### Loot
| Item | Rate |
|---|---|
| Coins (2,400–5,000) | Always |
| **Court seal** (accessory, 15% shop discount everywhere) | 1/10 |
| **Chamberlain's rapier** (atk 14, speed 2, spec: *Objection* — interrupts any boss cast) | 1/20 |
| **Drowned finery** (body, def 12, poison immunity) | 1/16 |
| **Writ of Adjournment** (lore + Questline V-4 gate) | Adjournment ending only |

---

# 7. The Ashen Barrow *(EXISTS IN GAME)*
**Ashfall Wastes · Level 30+ · 1–3 players**

*Canonised as-is. Current mechanics — nine chambers in a 3×3 grid, randomised unlock order, reward potential accumulating to ~70%, the Ashen Warden's burning sigils and half-health enrage — remain the reference implementation.*

### Recommended additions *(optional, non-breaking)*
- **Tenth chamber** unlocked only during Quest I-8, holding the conversation with the Ember.
- **Cass dialogue:** once the player carries the Ashvale signet, the Warden speaks instead of attacking on the first encounter of each run.
- **Lore tablets 4–6** added to the existing three, covering the Cinders Wardens by name.

---

# 8. The Fallen Star
**Emberreach · Level 44+ · 3–5 players · ~32 min**

The shell the Ember arrived in, still warm, still humming, still receiving.

### Layout
The crater interior — a hollow metal sphere 40 tiles across, with **no floor**. You move along curved inner surfaces.

### Core mechanic — Gravity Wells
The shell contains **five gravity nodes**. Each pulls everything within 8 tiles toward it at 1 tile/sec — including you, enemies, projectiles, and dropped items.

- Nodes **cycle on and off** every 15 seconds in a visible pattern
- Overlapping active nodes create **null points** (no pull) and **crush points** (double pull, 6 damage/sec)
- Ranged attacks and spells **curve** through wells — you must lead your shots around them
- Being pulled into a node's centre while it's active = 20 damage and a 3-second stun

Movement stops being a matter of pressing where you want to go. You **plan routes** using the pull, riding wells to cross the arena fast — or fighting them the whole way and arriving exhausted. Experienced parties look like they're skating.

### Boss — The Herald *(level 50, 800 HP)*
Not the Ember. The thing that *threw* it — or rather, the messenger left behind to confirm the sentence was carried out. It has been transmitting "SENTENCE UPHELD" for four hundred years to an audience that stopped listening.

**Phases**
1. **Transmission** — floats at the sphere's centre, immune, while four **relay pylons** anchor it. Destroy all four; each destroyed pylon *inverts* one gravity node (pull becomes push).
2. **Descent** *(after pylons)* — drops to the surface and fights directly. Creates new temporary wells at the point of each of its own attacks, so the arena reshapes around wherever it's been.
3. **Recall** *(below 40%)* — attempts to re-transmit. A **90-second timer** appears. If it completes, the party is expelled from the raid (no wipe, no loot — a *dismissal*, which is worse). Interrupt by breaking its focus: 3 players must stand simultaneously in 3 separate null points, which requires reading the node cycle and coordinating without being able to path directly.
4. **Sentence** *(below 15%)* — all five nodes activate at maximum. The arena is a blender. Pure survival DPS with no safe standing anywhere; the only tactic is constant motion.

### Loot
| Item | Rate |
|---|---|
| Coins (4,000–8,000) | Always |
| **Starshell plate** (body, def 18, immune to gravity pull) | 1/16 |
| **Herald's relay** (magic weapon 20, spec: *Transmit* — damage arcs to all enemies in the raid) | 1/25 |
| **Null anchor** (accessory, create a personal null point every 60s) | 1/18 |
| **The Sentence** (lore tablet — reveals what the Ember was punished for) | First clear |

---

# 9. The Cinder Galleon
**Ash Sea · Level 48+ · 3–5 players · ~35 min**

A merchant flagship trapped in the ash crust for four centuries, crewed by what its sailors became.

### Layout
A working ship: main deck, three below-decks levels, the hold, the captain's cabin. **The arena moves** — the galleon is under way, grinding through the crust.

### Core mechanic — Keep It Afloat
The ship has a **Hull integrity** meter (100). It falls continuously from ash grinding the keel (−1/8sec) and drops sharply from boss attacks and from breaches.

The party must **crew the ship while fighting**:

| Station | Requires | Effect |
|---|---|---|
| **Pumps** (hold) | 1 player, 10s | +15 Hull |
| **Patch** (any breach) | 1 player, 6s + tar | Stops a −3/sec leak |
| **Helm** (main deck) | 1 player, continuous | Steers around ash reefs; unmanned = a breach every 40s |
| **Sails** (rigging) | 1 player, 8s | +25% party movement speed for 60s |

At Hull 0 the galleon sinks into the crust — full wipe. **Somebody always has to leave the fight**, which means the raid's real difficulty is that you are never fighting at full strength. Party composition matters more here than anywhere: someone has to be the sailor, and the sailor gets no glory and less loot from the damage tables.

### Boss — Captain Ordry Vane *(level 54, 900 HP)*
Still commanding. Still has the manifest. Still intends to make port, and will not be told that the port burned down four hundred years ago.

**Phases**
1. **Quarterdeck** — fights at the helm. **Cannot be moved.** While he holds the helm he steers *into* reefs deliberately: Hull damage doubles. You must break his grip (200 damage) rather than kill him.
2. **All Hands** *(below 70%)* — calls the crew. 8 **ash-sailors** board from the crust and go for the *stations*, not the players. Undefended stations stop working.
3. **Broadside** *(below 45%)* — mans a cannon and fires along a full deck lane every 12 seconds. The lane is telegraphed by the deck planks lifting. Full deck length, instant kill at level, and it also **breaches the hull it passes through** — his own attack damages his own ship, and he does not care.
4. **Make Port** *(below 15%)* — he abandons combat entirely and sails at full speed toward the horizon. Hull damage triples. Pure race: kill him before the ship comes apart. If Hull hits 0 first, everyone drowns in ash *and he makes port*, which the game notes with a single grey line: *"The Peregrine reaches harbour. There is no harbour."*

### Loot
| Item | Rate |
|---|---|
| Coins (5,000–10,000) | Always |
| **Vane's manifest** (accessory, +20% coin drops) | 1/12 |
| **Galleon-oak shield** (def 20, immune to knockback) | 1/18 |
| **Ashwake cutlass** (atk 19, speed 3, spec: *Broadside* — line attack) | 1/24 |
| **Captain's hat** (helm, def 9 — cosmetically absurd, universally desired) | 1/50 |

---

# 10. The Second Hearth
**Ninefold Deep · Level 54+ · 4–6 players · ~40 min**

The second sleeping hearth-fire. The cult is trying to wake it. You are trying to make sure it stays asleep, and it is a *very* light sleeper.

### Layout
A vast cavern around a sleeping fire the size of a town. The cult's scaffolding and ritual sites ring it. Everything is warm, dim, and quiet.

### Core mechanic — The Sleep Meter
A party-wide **Wakefulness** gauge, 0–100, starting at 0. **You lose the raid if it reaches 100** — not by wiping, but by succeeding at exactly what the cult wanted.

Wakefulness rises from **noise**:

| Action | Wakefulness |
|---|---|
| Melee attack | +0.3 |
| Special attack | +3 |
| Spell cast | +2 |
| Death of a party member | +8 |
| Cult ritual completing | +15 |
| Running (vs walking) | +0.2/sec |

It falls only by **quieting**: standing still and silent (−1/sec, but only if the whole party is still), and by dousing ritual sites.

The raid inverts every instinct the previous nine raids trained. Your damage is your enemy. The optimal play is the *minimum* violence necessary — and the cult knows it, so they force noise by threatening to complete rituals you have to stop loudly.

**Party size dynamic:** more players = more noise, but rituals spawn faster than a small group can douse. Six players must be *disciplined*; four must be *fast*. There's no comfortable size, deliberately.

### Boss — Ninefold Hierophant Callas *(level 60, 1,100 HP)*
She isn't guarding the hearth. She's **conducting** it — an orchestra of noise designed to wake it, and every hit you land is a note she wanted.

**Phases**
1. **Crescendo** — she and 6 cultists perform. Killing cultists is loud (+2 each); letting them finish is louder (+15). The correct answer is to *interrupt without killing* — snares, freezes, knockbacks. Parties without control abilities suffer badly here, which is deliberate build pressure.
2. **Antiphon** *(below 65%)* — she mirrors the party's noise back as damage. Whatever your loudest action was in the last 10 seconds, she uses it against you at double value.
3. **The Waking** *(below 30%)* — she force-raises Wakefulness by 4/sec regardless of your behaviour. The gauge becomes a hard timer, and the raid finally *permits* you to go loud. After 30 minutes of restraint, the release of being allowed to use every special at once is the whole emotional payoff of the design.
4. **Lullaby** *(below 5%)* — she stops. If Wakefulness is under 60, she surrenders and the hearth stays asleep (full loot, good ending). If Wakefulness is 60+, the second hearth **opens one eye** — the party is not attacked, but the world permanently gains a new hostile tier, and the raid can never be run "clean" again on that save.

### Loot
| Item | Rate |
|---|---|
| Coins (6,000–12,000) | Always |
| **Hearthwarden's mantle** (body, def 22) | 1/15 |
| **Silent hand** (gloves, all your actions generate 50% less noise) | 1/20 |
| **Conductor's baton** (magic 24, spec: *Rest* — silences all enemies 6s) | 1/28 |
| **Nine-dot sigil** (lore — names the other eight hearths) | Clean clear only |

---

# 11. The Hollow Throne
**Ashvale Keep · Level 60+ · SOLO ONLY · ~25 min**

Your family seat. Your throne. Your own four hundred years of memory, and the parts of you the Ember rebuilt wrong.

### Layout
Four rooms of the Keep, each a memory: the Gallery, the Archive, the Crypt, the Throne Room. Linear and inevitable.

### Core mechanic — Mirror Combat
Each of the four encounters fights you **using your own build**, read from your actual save at the moment you enter:

- Your equipped weapon, armour, and their real stats
- Your combat levels
- Your unlocked specials, spells, and prayers
- Your most-used attack pattern from the last 60 seconds of play

The raid is therefore **different for every player and impossible to guide-out**. A tank build faces an unkillable wall. A glass-cannon faces something that deletes it in four seconds. The strategy is always the same and always specific: *find the weakness in your own build*, because nobody knows it better than you and nobody has ever had to.

**No party allowed.** This is thematically load-bearing — nobody can help you with this — and mechanically necessary, since mirroring six builds at once would be incoherent.

**The gear twist:** in the final room, **your equipment is taken.** You fight with nothing. Everything you've accumulated across sixty levels is removed, and what remains is your levels, your prayers, your food, and whether you actually learned to play or just learned to out-gear.

### Boss — The Unfinished *(level 64, HP scales to 12× your max hit)*
The parts of you the Ember got wrong. It has your face, roughly. The proportions are close.

**Phases**
1. **Copy** — a perfect mirror. Exact stats, exact gear, exact specials. Fights you to a standstill by definition; you win only by doing something you don't normally do.
2. **Correction** *(below 70%)* — it starts *improving*. Each 10% of health lost, it fixes one of its flaws: it stops missing, then stops hesitating, then stops taking damage from your favourite attack. It gets better at being you than you are.
3. **The Stripping** *(below 40%)* — your gear vanishes. Both of you are bare. Levels and skill only.
4. **Completion** *(below 10%)* — it stops fighting and asks the only question the raid is really about: **"Which of us is the copy?"** Answer either way. Both are accepted. The answer is recorded in your Journal and referenced in Quest I-8's ending text — the game never tells you if you were right, because it doesn't know either.

### Loot
| Item | Rate |
|---|---|
| Coins (8,000–15,000) | Always |
| **Ashvale plate** (body, def 25 — best-in-slot) | Always, first clear |
| **The Unfinished's face** (helm, def 14, cosmetic: shows your own character's face) | 1/10 |
| **Cinders fragment** (Questline VI-4 / TEND ending gate) | Always, first clear |
| **Memory of Cass** (lore — the eighth Warden's death, from the inside) | First clear |

---

# Cross-Raid Systems

## Reward Potential *(extend the Barrow's existing system to all raids)*
Every raid accumulates a **reward potential %** from optional objectives — lore tablets found, optional chambers cleared, mechanics executed cleanly (no singer lost, hull above 70, Wakefulness under 40). Potential gates unique drop rates, so mastery pays without inflating loot for repetition alone.

## Raid Tokens
Each raid drops **region tokens** on every clear. Ten tokens buy a guaranteed unique from that raid's table — a bad-luck bin that respects long grinds without undercutting drop excitement.

## Escalation Modifiers *(post-completion replayability)*
Once a raid is cleared, players may enable modifiers for higher potential:
- **Sealed** — no food
- **Silent** — no specials or spells
- **Timed** — 60% of normal time limit
- **Ember-touched** — all enemies gain the burning sigil mechanic from the Ashen Warden

## Difficulty Curve Summary

| Raid | Level | Mechanic burden | Party pressure |
|---|---|---|---|
| Sunken Grainhall | 10 | 1 mechanic | Low |
| Hollow Pines | 18 | 1 + relocation | Low |
| Verse Bell | 26 | 2 layered | Medium — needs a defender |
| Wayfire Vault | 30 | 1 resource + darkness | Medium |
| Ashen Barrow | 30 | 1 + randomisation | Low |
| Drowned Court | 32 | Procedure + combat shift | Medium |
| Deep Bellows | 36 | Shared gauge + type rotation | **High — needs 2 damage types** |
| Fallen Star | 44 | Physics + coordination | **High — needs 3 coordinated** |
| Cinder Galleon | 48 | Station management | **High — someone must sacrifice DPS** |
| Second Hearth | 54 | Inverted incentives + control | **Highest — needs control abilities** |
| Hollow Throne | 60 | Self-knowledge | **Solo only** |
