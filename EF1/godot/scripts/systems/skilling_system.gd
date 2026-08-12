extends Node

var skill_data: Dictionary = {}


func _ready() -> void:
	var file := FileAccess.open("res://data/legacy_world.json", FileAccess.READ)
	var parsed: Dictionary = JSON.parse_string(file.get_as_text())
	skill_data = parsed.get("skill_data", {})


func recipes_for(station: String) -> Array:
	match station:
		"furnace", "anvil":
			return skill_data.get("smithing", []).filter(
				func(recipe): return str(recipe.get("station", "")) == station
			)
		"workbench":
			return skill_data.get("crafting", [])
		"cauldron":
			return skill_data.get("herblore", [])
		"fletching":
			return skill_data.get("fletching", [])
	return []


func skill_for_station(station: String) -> String:
	match station:
		"furnace", "anvil":
			return "Smithing"
		"workbench":
			return "Crafting"
		"cauldron":
			return "Herblore"
		"fletching":
			return "Fletching"
	return ""


func make_recipe(recipe: Dictionary, skill_name: String) -> String:
	var required_level := int(recipe.get("level", 1))
	if int(GameState.data.skills.get(skill_name, 1)) < required_level:
		return "You need %s level %d." % [skill_name, required_level]
	var needs: Dictionary = recipe.get("needs", {})
	for item_id in needs:
		var item_name := ItemCatalog.display_name(str(item_id))
		var quantity := int(needs[item_id])
		if GameState.item_count(item_name) < quantity:
			return "You need %d %s." % [quantity, item_name.to_lower()]
	var result_name := ItemCatalog.display_name(str(recipe.get("makes", "")))
	if not GameState.can_add(result_name):
		return "Your backpack is full."
	for item_id in needs:
		GameState.remove_item(
			ItemCatalog.display_name(str(item_id)),
			int(needs[item_id]),
			false
		)
	GameState.add_item(result_name, int(recipe.get("qty", 1)), false)
	GameState.add_skill_xp(skill_name, int(recipe.get("xp", 0)), false)
	GameState.mark_changed()
	return "You create %s." % result_name


func fish(definition: Dictionary) -> String:
	var level := int(definition.get("level", 1))
	var fishing_level := int(GameState.data.skills.get("Fishing", 1))
	if fishing_level < level:
		return "You need Fishing level %d." % level
	if GameState.item_count("Fishing rod") < 1 or GameState.item_count("Fishing bait") < 1:
		return "You need a Fishing rod and Fishing bait."
	var item_name := ItemCatalog.display_name(str(definition.get("item", "rawFish")))
	if not GameState.can_add(item_name):
		return "Your backpack is full."
	var chance := minf(
		0.9,
		0.52 + (
			int(GameState.data.skills.get("Fishing", 1)) - level
		) * 0.025
	)
	if randf() >= chance:
		return "Something tugs the line, then slips away."
	var kept_bait := _keeps_fishing_bait(fishing_level, level)
	if not kept_bait:
		GameState.remove_item("Fishing bait", 1, false)
	GameState.add_item(item_name, 1, false)
	GameState.add_skill_xp("Fishing", int(definition.get("xp", 12)), false)
	if (
		str(definition.get("item", "rawFish")) == "rawFish"
		and GameState.quest_stage(GameState.INTRO_QUEST) == "fish"
	):
		GameState.advance_quest(
			GameState.INTRO_QUEST,
			"cook",
			"Cook the riverfish at the town range."
		)
	GameState.mark_changed()
	return "You catch a %s.%s" % [
		str(definition.get("catchName", "fish")),
		" You manage to keep your bait." if kept_bait else "",
	]


func bait_preservation_chance(fishing_level: int, spot_level: int) -> float:
	return minf(0.5, 0.25 + maxi(0, fishing_level - spot_level) * 0.005)


func _keeps_fishing_bait(fishing_level: int, spot_level: int) -> bool:
	return randf() < bait_preservation_chance(fishing_level, spot_level)


func mine(definition: Dictionary) -> Dictionary:
	var level := int(definition.get("level", 1))
	if (
		GameState.item_count("Bronze pickaxe") < 1
		and GameState.item_count("Iron pickaxe") < 1
	):
		return {"message": "You need a pickaxe. Torren sells them at Cinderforge."}
	if int(GameState.data.skills.get("Mining", 1)) < level:
		return {"message": "You need Mining level %d." % level}
	var ore_name := ItemCatalog.display_name(str(definition.get("ore", "copperOre")))
	if not GameState.can_add(ore_name):
		return {"message": "Your backpack is full."}
	var bonus := 0.15 if GameState.item_count("Iron pickaxe") > 0 else 0.0
	if randf() >= 0.68 + bonus:
		return {"message": "You chip away at the rock."}
	GameState.add_item(ore_name, 1, false)
	GameState.add_skill_xp("Mining", int(definition.get("xp", 12)), false)
	GameState.mark_changed()
	return {"message": "You mine some %s." % ore_name.to_lower(), "success": true}


func chop(definition: Dictionary) -> Dictionary:
	var level := int(definition.get("level", 1))
	if GameState.item_count("Bronze hatchet") < 1:
		return {"message": "You need a hatchet. Alaric sells them."}
	if int(GameState.data.skills.get("Woodcutting", 1)) < level:
		return {"message": "You need Woodcutting level %d." % level}
	if not GameState.can_add("Logs"):
		return {"message": "Your backpack is full."}
	if randf() >= 0.76:
		return {"message": "You swing but fail to get a log."}
	GameState.add_item("Logs", 1, false)
	GameState.add_skill_xp("Woodcutting", int(definition.get("xp", 14)), false)
	GameState.mark_changed()
	return {"message": "You get some logs.", "success": true}


func hunt(definition: Dictionary) -> String:
	if int(GameState.data.skills.get("Hunter", 1)) < int(definition.get("level", 1)):
		return "Your Hunter level is too low."
	if GameState.item_count("Wooden snare") < 1:
		return "You need a Wooden snare."
	if randf() < 0.75:
		if not GameState.can_add("Rabbit meat") or not GameState.can_add("Rabbit fur"):
			return "Your backpack is full."
		GameState.add_item("Rabbit meat", 1, false)
		GameState.add_item("Rabbit fur", 1, false)
		GameState.add_skill_xp("Hunter", int(definition.get("xp", 20)), false)
		GameState.mark_changed()
		return "The snare catches a rabbit. You gather its meat and fur."
	GameState.add_skill_xp("Hunter", 5)
	return "The rabbit slips past your snare."


func farm(definition: Dictionary) -> String:
	if not GameState.data.has("farm"):
		GameState.data.farm = {}
	var patch_id := str(definition.get("id", "farm"))
	var state: Dictionary = GameState.data.farm.get(patch_id, {})
	if state.is_empty():
		if GameState.item_count("Cabbage seed") < 1:
			return "You need a Cabbage seed."
		GameState.remove_item("Cabbage seed", 1, false)
		GameState.data.farm[patch_id] = {
			"ready_at": Time.get_unix_time_from_system() + 60.0,
		}
		GameState.add_skill_xp("Farming", 8, false)
		GameState.mark_changed()
		return "You plant a cabbage seed."
	var seconds_left := float(state.get("ready_at", 0.0)) - Time.get_unix_time_from_system()
	if seconds_left > 0.0:
		return "The cabbages need about %d more seconds." % ceili(seconds_left)
	if not GameState.can_add("Cabbage"):
		return "Your backpack is full."
	GameState.add_item("Cabbage", 3, false)
	GameState.data.farm.erase(patch_id)
	GameState.add_skill_xp("Farming", 24, false)
	GameState.mark_changed()
	return "You harvest 3 cabbages."


func cook_one() -> String:
	var foods := [
		["Raw marsh eel", "Cooked marsh eel", "marsh eel", 28],
		["Rabbit meat", "Roast rabbit", "rabbit", 20],
		["Raw boar meat", "Cooked boar meat", "boar meat", 18],
		["Raw riverfish", "Cooked riverfish", "riverfish", 14],
	]
	var selected: Array = []
	for food in foods:
		if GameState.item_count(str(food[0])) > 0:
			selected = food
			break
	if selected.is_empty():
		return "You have no raw food to cook."
	GameState.remove_item(str(selected[0]), 1, false)
	var burn_chance := maxf(
		0.03,
		0.3 - int(GameState.data.skills.get("Cooking", 1)) * 0.011
	)
	if randf() < burn_chance:
		GameState.mark_changed()
		return "You accidentally burn the %s." % selected[2]
	GameState.add_item(str(selected[1]), 1, false)
	GameState.add_skill_xp("Cooking", int(selected[3]), false)
	if (
		str(selected[0]) == "Raw riverfish"
		and GameState.quest_stage(GameState.INTRO_QUEST) == "cook"
	):
		GameState.advance_quest(
			GameState.INTRO_QUEST,
			"goblin",
			"Defeat a goblin raider driven down from the wastes."
		)
	GameState.mark_changed()
	return "You cook the %s." % selected[2]


func light_fire() -> String:
	if GameState.item_count("Logs") < 1:
		return "You need some Logs."
	GameState.remove_item("Logs", 1, false)
	GameState.add_skill_xp("Firemaking", 25, false)
	GameState.mark_changed()
	return "The logs catch fire."


func bury_bones() -> String:
	if GameState.item_count("Bones") < 1:
		return "You need some Bones."
	GameState.remove_item("Bones", 1, false)
	GameState.add_skill_xp("Prayer", 15, false)
	GameState.mark_changed()
	return "You bury the bones."


func pickpocket() -> String:
	var chance := minf(
		0.92,
		0.58 + int(GameState.data.skills.get("Thieving", 1)) * 0.035
	)
	if randf() < chance:
		var coins := randi_range(4, 12)
		GameState.add_item("Coins", coins, false)
		GameState.add_skill_xp("Thieving", 18, false)
		GameState.mark_changed()
		return "You steal %d coins." % coins
	GameState.data.health = maxi(0, int(GameState.data.health) - 1)
	GameState.mark_changed()
	return "You are caught and shoved away."
