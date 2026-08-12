extends Node

const MAIN := [
	"a_wanderer_in_greenrest",
	"shadows_over_pineholt",
	"beneath_the_ashen_barrow",
	"the_ashwrights_gambit",
]

const DEFAULT_QUESTS := {
	"shadows_over_pineholt": {
		"state": "locked", "stage": "locked", "kills": 0,
		"objective": "Complete A Wanderer in Greenrest.",
	},
	"beneath_the_ashen_barrow": {
		"state": "locked", "stage": "locked",
		"objective": "Complete Shadows Over Pineholt.",
	},
	"the_ashwrights_gambit": {
		"state": "locked", "stage": "locked", "rumors": [],
		"fetch": ["Raw riverfish", "Copper ore", "Logs"],
		"objective": "Complete Beneath the Ashen Barrow.",
	},
	"the_boar_hunt": {"state": "available", "stage": "available", "kills": 0},
	"silk_and_cinders": {"state": "locked", "stage": "locked", "kills": 0},
	"the_broken_road": {"state": "locked", "stage": "locked", "kills": 0},
	"hearth_and_home": {"state": "locked", "stage": "locked"},
	"a_cure_for_sablemarsh": {"state": "locked", "stage": "locked"},
}


func ensure_quests() -> void:
	if not GameState.data.has("quests"):
		GameState.data.quests = {}
	for quest_id in DEFAULT_QUESTS:
		if not GameState.data.quests.has(quest_id):
			GameState.data.quests[quest_id] = DEFAULT_QUESTS[quest_id].duplicate(true)
	_unlock_available_quests()


func _unlock_available_quests() -> void:
	var intro_done := GameState.quest_state(MAIN[0]) == "complete"
	var shadows_done := GameState.quest_state(MAIN[1]) == "complete"
	var barrow_done := GameState.quest_state(MAIN[2]) == "complete"
	if intro_done:
		_unlock("shadows_over_pineholt", "Speak with Captain Rowan.")
		_unlock("the_broken_road", "Speak with Mara.")
		_unlock("hearth_and_home", "Speak with Tamsin.")
		_unlock("a_cure_for_sablemarsh", "Speak with Healer Sable.")
	if shadows_done:
		_unlock("beneath_the_ashen_barrow", "Speak with Scholar Mira.")
	if GameState.quest_state("beneath_the_ashen_barrow") != "locked":
		_unlock("silk_and_cinders", "Speak with Scout Vale.")
	if barrow_done:
		_unlock("the_ashwrights_gambit", "Speak with King Aldric.")


func _unlock(quest_id: String, objective: String) -> void:
	var quest: Dictionary = GameState.data.quests[quest_id]
	if str(quest.get("state", "locked")) != "locked":
		return
	quest.state = "available"
	quest.stage = "available"
	quest.objective = objective


func has_interaction(npc_id: String) -> bool:
	ensure_quests()
	return npc_id in [
		"rowan", "mira", "king", "yara", "torren", "alaric", "harker", "kessa",
		"willow", "vale", "mara", "tamsin", "sable",
	]


func dialogue_for(npc_id: String) -> String:
	ensure_quests()
	var gambit: Dictionary = GameState.data.quests.the_ashwrights_gambit
	if (
		gambit.state == "active"
		and gambit.stage == "rumors"
		and npc_id in ["torren", "alaric", "rowan"]
		and npc_id not in gambit.get("rumors", [])
	):
		var rumors := {
			"torren": "My ember-rune orders have dried up these past weeks. Not late - gone. Whatever is happening beyond Cinderforge is choking the whole supply line.",
			"alaric": "Three caravans are missing, and not one driver came back. The guild knows nothing, and that frightens them more than they will admit.",
			"rowan": "My patrols saw ash-camp fires beyond the old boundary stones. I had no hands to spare. If the King has you investigating, follow them northwest.",
		}
		return rumors[npc_id]
	match npc_id:
		"rowan":
			return _rowan_dialogue()
		"mira":
			return _mira_dialogue()
		"king":
			return _king_dialogue()
		"yara":
			if gambit.state == "active" and gambit.stage == "yara":
				return "Every lost wagon hauled ember-rune or raw ore. Their tracks bend northwest, deep into the wastes. Someone built a hidden camp beyond our patrols."
		"harker":
			if gambit.state == "active" and gambit.stage == "harker":
				return "Keep your voice down. Bring me a Raw riverfish, Copper ore, and Logs. Kessa's people took my supplies, and I will not cross that wind empty-handed."
			if gambit.state == "active" and gambit.stage == "supplies":
				return "I still need all of it: a Raw riverfish, Copper ore, and Logs. I am not leaving this fire without them."
			if gambit.state == "active" and gambit.stage in ["renn", "kessa", "construct", "return"]:
				return "Kessa keeps to the old surveyor's camp, but Renn walks the perimeter. Go around the north side, and watch whatever she is pulling from the ground."
		"kessa":
			if gambit.state == "active" and gambit.stage == "kessa":
				return "So the King sent you. I am close, Wanderer. The Ember bends if you ask it instead of burying it. I will not stop now, with or without an audience."
			if gambit.state == "active" and gambit.stage in ["construct", "return"]:
				return "The extraction is done. Whatever happens next is no longer in my hands."
		"willow":
			return _hunt_dialogue(
				"the_boar_hunt",
				"Wild boars are tearing through our winter stores. Something east is driving them here. Drive back three and learn what they are fleeing.",
				"wild boars",
				3,
				"The eastern hedge is quiet, but their hides carry ash that has never blown this far. Take this Thornwood mantle with our thanks.",
				"Thornwood remembers its friends. The mantle suits you."
			)
		"vale":
			return _hunt_dialogue(
				"silk_and_cinders",
				"Cave spiders are boiling out of the Barrow angrier than ever. Bring down four so I can map a safe route for Mira.",
				"cave spiders",
				4,
				"The tunnels are quieter, and your work proves the route. Take this cave-silk robe and these runes for the darkness ahead.",
				"Your work made the Barrow road safer. Mira still studies what woke the spiders."
			)
		"mara":
			return _hunt_dialogue(
				"the_broken_road",
				"Road bandits are stealing Frostmere's food shipments. Defeat four of them and I will give you a buckler from the old road watch.",
				"road bandits",
				4,
				"The supply carts arrived safely. Some raiders were refugees from the ash, but the road is secure. Take the watch buckler with my thanks.",
				"Our supply carts still remember your name. The road watch buckler suits you."
			)
		"tamsin":
			return _fetch_dialogue(
				"hearth_and_home",
				"Pineholt has survived, but surviving is not living. Bring me raw boar meat, a cabbage, and a wild herb for a village feast.",
				"raw boar meat, a cabbage, and a wild herb",
				"Everything is here. The Resting Stag will be full tonight, and Pineholt will remember who made the feast possible.",
				"The feast gave Pineholt something it had nearly forgotten: a reason to celebrate."
			)
		"sable":
			return _fetch_dialogue(
				"a_cure_for_sablemarsh",
				"Marsh fever runs hot, then cold as ash. Boglings carry moss that resists it. Bring me four clumps so I can prepare a cure.",
				"four clumps of Bog moss",
				"This moss is strong enough. Tonight the fever will break, though a cure is not the same as an answer.",
				"The fever has passed. Sablemarsh remembers who carried hope through the bog."
			)
	return ""


func _rowan_dialogue() -> String:
	var q: Dictionary = GameState.data.quests.shadows_over_pineholt
	if q.state == "locked":
		return "Prove yourself to Guide Elowen first."
	if q.state == "available":
		return "Raiders spill from the Ashfall Wastes thicker every week. Cull three goblin raiders and bring me their hides, so I know you can hold a blade."
	if q.state == "active" and q.stage == "hunt":
		return "Hold the north road. Defeat three goblin raiders and recover their hides."
	if q.state == "active" and q.stage == "return":
		return "Bring me the three hides. Their markings may tell us what is driving the raiders from the wastes."
	return "Pineholt stands because of you, Wanderer."


func _mira_dialogue() -> String:
	var q: Dictionary = GameState.data.quests.beneath_the_ashen_barrow
	if q.state == "locked":
		return "Captain Rowan must secure Pineholt before we disturb the Barrow seals."
	if q.state == "available":
		return "The Ember stirs when you are near. A Barrow guardian carries the seal-key. Defeat it, descend into the ruins, and recover the relic."
	if q.state == "active" and q.stage == "guardian":
		return "The surface guardian carries the seal-key. Defeat it before approaching the Barrow door."
	if q.state == "active" and q.stage == "warden":
		return "The key knows your blood. Enter the Ashen Barrow and face the Warden who gave up death to hold its door."
	if q.state == "active" and q.stage == "return":
		return "You carry the Ember relic and the fire did not take you. Let me see it."
	return "The seals are steadied for now, but the Ember is patient."


func _king_dialogue() -> String:
	var q: Dictionary = GameState.data.quests.the_ashwrights_gambit
	if q.state == "locked":
		return "The Wardens gave their names to hold the fire below. Earn their trust before asking what burdens the crown."
	if q.state == "available":
		return "Caravans of ember-rune and ore vanish on the northern ash road without sign of a raid. Question Rowan, Torren, and Alaric, then report to Yara."
	if q.state == "active" and q.stage == "return":
		return "You returned from the hidden camp. Tell me what Kessa drew from the ash."
	if q.state == "complete":
		return "The realm is quiet for now. Rest, Wanderer - you earned it."
	return str(q.get("objective", "Follow the missing caravans into the wastes."))


func _hunt_dialogue(
	quest_id: String,
	offer: String,
	target_name: String,
	goal: int,
	ready: String,
	complete: String
) -> String:
	var q: Dictionary = GameState.data.quests[quest_id]
	if q.state == "locked":
		return "Help Greenrest Vale first, then return when you are ready for frontier work."
	if q.state == "available":
		return offer
	if q.state == "complete":
		return complete
	var kills := int(q.get("kills", 0))
	if kills >= goal:
		return ready
	return "You have defeated %d of %d %s. Keep searching beyond the settlement." % [kills, goal, target_name]


func _fetch_dialogue(
	quest_id: String,
	offer: String,
	needs: String,
	ready: String,
	complete: String
) -> String:
	var q: Dictionary = GameState.data.quests[quest_id]
	if q.state == "locked":
		return "Help Greenrest Vale first, then return when the roads are safer."
	if q.state == "available":
		return offer
	if q.state == "complete":
		return complete
	var all_ready := true
	if quest_id == "hearth_and_home":
		all_ready = (
			GameState.item_count("Raw boar meat") >= 1
			and GameState.item_count("Cabbage") >= 1
			and GameState.item_count("Wild herb") >= 1
		)
	else:
		all_ready = GameState.item_count("Bog moss") >= 4
	return ready if all_ready else "I still need %s." % needs


func interact(npc_id: String) -> String:
	ensure_quests()
	var text := _main_interaction(npc_id)
	if not text.is_empty():
		GameState.mark_changed()
		return text
	text = _side_interaction(npc_id)
	if not text.is_empty():
		GameState.mark_changed()
	return text


func _main_interaction(npc_id: String) -> String:
	var q: Dictionary
	if npc_id == "rowan":
		q = GameState.data.quests.shadows_over_pineholt
		if q.state == "available":
			_start(q, "hunt", "Defeat 3 goblin raiders and collect their hides.")
			return "Shadows Over Pineholt started. Defeat three goblin raiders."
		if q.state == "active" and q.stage == "return":
			if GameState.item_count("Goblin hide") < 3:
				return "Bring me three goblin hides. You carry %d." % GameState.item_count("Goblin hide")
			GameState.remove_item("Goblin hide", 3, false)
			GameState.add_item("Pineholt blade", 1, false)
			GameState.add_item("Coins", 120, false)
			_complete(q)
			_unlock_available_quests()
			return "Shadows Over Pineholt complete: Steel sword and 120 coins. Scholar Mira waits in Cinderforge."
	if npc_id == "mira":
		q = GameState.data.quests.beneath_the_ashen_barrow
		if q.state == "available":
			_start(q, "guardian", "Defeat the Barrow guardian and recover the seal-key.")
			return "Beneath the Ashen Barrow started. Defeat the surface guardian and recover its seal-key."
		if q.state == "active" and q.stage == "return":
			if GameState.item_count("Ember relic") < 1:
				return "Return with the Ember relic."
			GameState.remove_item("Ember relic", 1, false)
			GameState.add_item("Coins", 300, false)
			GameState.add_skill_xp("Attack", 200, false)
			_complete(q)
			_unlock_available_quests()
			return "Beneath the Ashen Barrow complete: 300 coins and 200 Attack XP."
	if npc_id == "king":
		q = GameState.data.quests.the_ashwrights_gambit
		if q.state == "available":
			_start(q, "rumors", "Ask Torren, Alaric, and Captain Rowan about the missing caravans.")
			return "The Ashwright's Gambit started. Question Torren, Alaric, and Captain Rowan."
		if q.state == "active" and q.stage == "return":
			GameState.add_item("Coins", 400, false)
			GameState.add_skill_xp("Attack", 250, false)
			_complete(q)
			return "The Ashwright's Gambit complete: 400 coins and 250 Attack XP."
	q = GameState.data.quests.the_ashwrights_gambit
	if q.state == "active" and q.stage == "rumors" and npc_id in ["torren", "alaric", "rowan"]:
		var rumors: Array = q.get("rumors", [])
		if npc_id not in rumors:
			rumors.append(npc_id)
			q.rumors = rumors
		if rumors.size() >= 3:
			q.stage = "yara"
			q.objective = "Report your findings to Steward Yara."
		return "You learn another caravan clue. %d of 3 witnesses questioned." % rumors.size()
	if npc_id == "yara" and q.state == "active" and q.stage == "yara":
		q.stage = "harker"
		q.objective = "Find Harker in the northwest Ashfall camp."
		return "The tracks lead northwest into the wastes. Find Harker at the hidden camp."
	if npc_id == "harker" and q.state == "active":
		if q.stage == "harker":
			q.stage = "supplies"
			q.objective = "Bring Harker a Raw riverfish, Copper ore, and Logs."
			return "Harker needs a Raw riverfish, Copper ore, and Logs before he will reveal the camp route."
		if q.stage == "supplies":
			for item_name in q.fetch:
				if GameState.item_count(str(item_name)) < 1:
					return "Harker still needs: %s." % ", ".join(q.fetch)
			for item_name in q.fetch:
				GameState.remove_item(str(item_name), 1, false)
			q.stage = "renn"
			q.objective = "Defeat Ashwright Renn."
			return "Harker reveals the route. Defeat Ashwright Renn on the camp perimeter."
	if npc_id == "kessa" and q.state == "active" and q.stage == "kessa":
		q.stage = "construct"
		q.objective = "Defeat the Unbound Construct."
		return "Both answers lead to the same outcome: Kessa's extraction fails and the Unbound Construct awakens."
	return ""


func _side_interaction(npc_id: String) -> String:
	var mapping := {
		"willow": ["the_boar_hunt", "boar", 3],
		"vale": ["silk_and_cinders", "spider", 4],
		"mara": ["the_broken_road", "bandit", 4],
	}
	if mapping.has(npc_id):
		var spec: Array = mapping[npc_id]
		var q: Dictionary = GameState.data.quests[spec[0]]
		if q.state == "available":
			_start(q, "hunt", "Defeat %d targets." % int(spec[2]))
			q.kills = 0
			return "%s started. Defeat %d targets." % [_display_name(spec[0]), int(spec[2])]
		if q.state == "active" and int(q.get("kills", 0)) >= int(spec[2]):
			_reward_hunt_quest(str(spec[0]), q)
			return "%s complete." % _display_name(spec[0])
		if q.state == "active":
			return "%s: %d of %d defeated." % [_display_name(spec[0]), int(q.kills), int(spec[2])]
	if npc_id == "tamsin":
		return _fetch_quest("hearth_and_home", ["Raw boar meat", "Cabbage", "Wild herb"])
	if npc_id == "sable":
		return _fetch_quest("a_cure_for_sablemarsh", ["Bog moss", "Bog moss", "Bog moss", "Bog moss"])
	return ""


func _fetch_quest(quest_id: String, needs: Array) -> String:
	var q: Dictionary = GameState.data.quests[quest_id]
	if q.state == "available":
		_start(q, "gather", "Gather the requested supplies.")
		return "%s started. Gather %s." % [_display_name(quest_id), ", ".join(needs)]
	if q.state != "active":
		return ""
	var counts := {}
	for item_name in needs:
		counts[item_name] = int(counts.get(item_name, 0)) + 1
	for item_name in counts:
		if GameState.item_count(str(item_name)) < int(counts[item_name]):
			return "You still need the supplies for %s." % _display_name(quest_id)
	for item_name in counts:
		GameState.remove_item(str(item_name), int(counts[item_name]), false)
	if quest_id == "hearth_and_home":
		GameState.add_item("Pineholt stew", 3, false)
		GameState.add_item("Coins", 120, false)
		GameState.add_skill_xp("Cooking", 80, false)
		GameState.add_skill_xp("Farming", 40, false)
	else:
		GameState.add_item("Sablemarsh charm", 1, false)
		GameState.add_item("Antidote", 2, false)
		GameState.add_item("Coins", 160, false)
		GameState.add_skill_xp("Herblore", 90, false)
		GameState.add_skill_xp("Defence", 50, false)
	_complete(q)
	return "%s complete." % _display_name(quest_id)


func record_kill(monster_id: String) -> String:
	ensure_quests()
	if not GameState.data.has("kill_log"):
		GameState.data.kill_log = {}
	GameState.data.kill_log[monster_id] = (
		int(GameState.data.kill_log.get(monster_id, 0)) + 1
	)
	var messages: Array[String] = []
	var shadows: Dictionary = GameState.data.quests.shadows_over_pineholt
	if monster_id == "goblin" and shadows.state == "active" and shadows.stage == "hunt":
		shadows.kills = mini(3, int(shadows.kills) + 1)
		if int(shadows.kills) >= 3:
			shadows.stage = "return"
			shadows.objective = "Bring 3 hides to Captain Rowan."
		messages.append("Return to Captain Rowan with three hides.")
	var barrow: Dictionary = GameState.data.quests.beneath_the_ashen_barrow
	if monster_id == "guardian" and barrow.state == "active" and barrow.stage == "guardian":
		GameState.add_item("Barrow key", 1, false)
		barrow.stage = "warden"
		barrow.objective = "Enter the Ashen Barrow and defeat the Ashen Warden."
		messages.append("You recover the seal-key. Enter the Ashen Barrow.")
	if monster_id == "warden":
		_record_warden_kill(barrow, messages)
	var gambit: Dictionary = GameState.data.quests.the_ashwrights_gambit
	if monster_id == "ashwrightRenn" and gambit.state == "active" and gambit.stage == "renn":
		gambit.stage = "kessa"
		gambit.objective = "Confront Kessa at the heart of the camp."
		messages.append("Ashwright Renn falls. Confront Kessa.")
	if monster_id == "unboundConstruct" and gambit.state == "active" and gambit.stage == "construct":
		gambit.stage = "return"
		gambit.objective = "Return to King Aldric."
		messages.append("The construct collapses. Return to King Aldric.")
	var hunts := {
		"boar": ["the_boar_hunt", 3],
		"spider": ["silk_and_cinders", 4],
		"bandit": ["the_broken_road", 4],
	}
	if hunts.has(monster_id):
		var spec: Array = hunts[monster_id]
		var side: Dictionary = GameState.data.quests[spec[0]]
		if side.state == "active" and side.stage == "hunt":
			side.kills = mini(int(spec[1]), int(side.get("kills", 0)) + 1)
			if int(side.kills) >= int(spec[1]):
				messages.append("%s is ready to turn in." % _display_name(spec[0]))
	GameState.mark_changed()
	return " ".join(messages)


func _record_warden_kill(barrow: Dictionary, messages: Array[String]) -> void:
	GameState.data.barrow_warden_kills = int(GameState.data.get("barrow_warden_kills", 0)) + 1
	GameState.data.barrow_chest_ready = true
	if barrow.state == "active" and barrow.stage == "warden":
		GameState.add_item("Ember relic", 1, false)
		barrow.stage = "return"
		barrow.objective = "Return the Ember relic to Scholar Mira."
		messages.append("The Ashen Warden kneels. Take the Ember relic to Scholar Mira.")
	else:
		messages.append("The Warden falls. Its reward chest awakens.")


func use_barrow_portal(entrance: bool) -> Dictionary:
	ensure_quests()
	var barrow: Dictionary = GameState.data.quests.beneath_the_ashen_barrow
	if entrance:
		if barrow.state == "locked" or barrow.state == "available":
			return {"ok": false, "message": "The Barrow door is sealed. Scholar Mira knows more."}
		if barrow.state == "active" and barrow.stage == "guardian":
			return {"ok": false, "message": "The Barrow door is sealed. Defeat the surface guardian."}
		if barrow.state == "active" and barrow.stage == "warden" and not bool(barrow.get("entered", false)):
			if GameState.item_count("Barrow key") < 1:
				return {"ok": false, "message": "You need the Barrow key."}
			GameState.remove_item("Barrow key", 1, false)
			barrow.entered = true
		GameState.data.barrow_run_active = true
		GameState.mark_changed()
		return {"ok": true, "message": "The seal-key turns. You enter the Ashen Barrow."}
		GameState.data.barrow_run_active = true
		GameState.mark_changed()
		return {"ok": true, "message": "Ashen Barrow run started."}
	GameState.data.barrow_run_active = false
	GameState.mark_changed()
	return {"ok": true, "message": "You climb back to the surface."}


func claim_barrow_chest() -> String:
	if not bool(GameState.data.get("barrow_chest_ready", false)):
		return "The Warden chest is dormant. Defeat the Ashen Warden."
	GameState.data.barrow_chest_ready = false
	var runs := int(GameState.data.get("barrow_runs", 0))
	if runs == 0:
		GameState.add_item("Coins", 100, false)
		GameState.add_item("Cave silk", 3, false)
		GameState.add_item("Warden cloak", 1, false)
		GameState.data.barrow_collection["Warden cloak"] = true
		GameState.data.barrow_runs = 1
		GameState.mark_changed()
		return "First Barrow clear: 100 coins, 3 Cave silk, and the Warden cloak."
	runs += 1
	GameState.data.barrow_runs = runs
	GameState.add_item("Coins", randi_range(45, 100), false)
	GameState.add_item("Ember rune", randi_range(4, 12), false)
	GameState.add_item("Cave silk", randi_range(1, 3), false)
	if randf() < 0.35:
		GameState.add_item("Ashen shard", 1, false)
	GameState.mark_changed()
	return "Barrow run %d reward claimed." % runs


func _reward_hunt_quest(quest_id: String, q: Dictionary) -> void:
	if quest_id == "the_boar_hunt":
		GameState.add_item("Thornwood mantle", 1, false)
		GameState.add_item("Coins", 150, false)
		GameState.add_skill_xp("Slayer", 80, false)
		GameState.add_skill_xp("Cooking", 50, false)
	elif quest_id == "silk_and_cinders":
		GameState.add_item("Cave-silk robe", 1, false)
		GameState.add_item("Ember rune", 20, false)
		GameState.add_item("Coins", 180, false)
		GameState.add_skill_xp("Magic", 100, false)
		GameState.add_skill_xp("Slayer", 70, false)
	else:
		GameState.add_item("Frostmere buckler", 1, false)
		GameState.add_item("Coins", 160, false)
		GameState.add_skill_xp("Defence", 80, false)
		GameState.add_skill_xp("Slayer", 60, false)
	_complete(q)


func _start(q: Dictionary, stage: String, objective: String) -> void:
	q.state = "active"
	q.stage = stage
	q.objective = objective


func _complete(q: Dictionary) -> void:
	q.state = "complete"
	q.stage = "complete"
	q.objective = "Complete"


func _display_name(quest_id: String) -> String:
	return quest_id.replace("_", " ").capitalize()
