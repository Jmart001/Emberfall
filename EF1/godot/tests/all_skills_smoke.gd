extends SceneTree


var game_state: Node
var skilling_system: Node
var item_catalog: Node


func _initialize() -> void:
	game_state = root.get_node("GameState")
	skilling_system = root.get_node("SkillingSystem")
	item_catalog = root.get_node("ItemCatalog")
	_run.call_deferred()


func _run() -> void:
	game_state.new_game()
	for skill_name in game_state.SKILL_NAMES:
		game_state.data.skills[skill_name] = 50
		game_state.data.skill_xp[skill_name] = game_state.xp_for_level(50)
	if game_state.SKILL_NAMES.size() != 20:
		return _fail("Expected all 20 2D skills.")

	var expected_recipes := {
		"fletching": 2,
		"cauldron": 3,
		"workbench": 3,
		"furnace": 4,
		"anvil": 22,
	}
	for station in expected_recipes:
		var recipes: Array = skilling_system.recipes_for(station)
		if recipes.size() != expected_recipes[station]:
			return _fail("Recipe count mismatch for %s." % station)
		var recipe: Dictionary = recipes[0]
		for item_id in recipe.needs:
			game_state.add_item(
				item_catalog.display_name(str(item_id)),
				int(recipe.needs[item_id]),
				false
			)
		var made: String = skilling_system.make_recipe(
			recipe,
			skilling_system.skill_for_station(station)
		)
		if not made.begins_with("You create"):
			return _fail("Could not make a %s recipe: %s" % [station, made])

	game_state.add_item("Fishing rod", 1, false)
	game_state.add_item("Fishing bait", 50, false)
	var fish_definition: Dictionary = skilling_system.skill_data.fish_spots[0]
	game_state.data.quests[game_state.INTRO_QUEST].state = "active"
	game_state.data.quests[game_state.INTRO_QUEST].stage = "fish"
	if not _repeat_until_success(
		func(): return skilling_system.fish(fish_definition),
		"You catch",
		50
	):
		return _fail("Fishing never produced a catch.")
	if game_state.quest_stage(game_state.INTRO_QUEST) != "cook":
		return _fail("A normal dock catch did not advance the intro quest.")
	game_state.add_item("Fishing bait", 500, false)
	var preserved_catches := 0
	var consumed_catches := 0
	for attempt in range(250):
		var bait_before: int = game_state.item_count("Fishing bait")
		var result: String = skilling_system.fish(fish_definition)
		if not result.begins_with("You catch"):
			continue
		if game_state.item_count("Fishing bait") == bait_before:
			preserved_catches += 1
		else:
			consumed_catches += 1
	if preserved_catches == 0 or consumed_catches == 0:
		return _fail("Fishing bait preservation did not produce both outcomes.")
	var expected_preservation: float = skilling_system.bait_preservation_chance(50, 1)
	if not is_equal_approx(expected_preservation, 0.495):
		return _fail("Fishing bait preservation chance is incorrect.")

	var rock_definition: Dictionary = skilling_system.skill_data.rocks[0]
	game_state.add_item("Bronze pickaxe", 1, false)
	if not _repeat_dictionary_until_success(
		func(): return skilling_system.mine(rock_definition),
		50
	):
		return _fail("Mining never produced ore.")

	var tree_definition: Dictionary = skilling_system.skill_data.trees[0]
	game_state.add_item("Bronze hatchet", 1, false)
	if not _repeat_dictionary_until_success(
		func(): return skilling_system.chop(tree_definition),
		50
	):
		return _fail("Woodcutting never produced logs.")

	game_state.add_item("Wooden snare", 1, false)
	var hunted := false
	for attempt in range(50):
		if skilling_system.hunt(skilling_system.skill_data.hunt_spots[0]).begins_with(
			"The snare catches"
		):
			hunted = true
			break
	if not hunted:
		return _fail("Hunter never produced a catch.")

	game_state.add_item("Cabbage seed", 1, false)
	var patch: Dictionary = skilling_system.skill_data.farm_patches[0]
	if not skilling_system.farm(patch).begins_with("You plant"):
		return _fail("Farming could not plant.")
	game_state.data.farm[str(patch.id)].ready_at = 0.0
	if not skilling_system.farm(patch).begins_with("You harvest"):
		return _fail("Farming could not harvest.")

	for other_raw_food in ["Raw marsh eel", "Rabbit meat", "Raw boar meat"]:
		var quantity: int = game_state.item_count(other_raw_food)
		if quantity > 0:
			game_state.remove_item(other_raw_food, quantity, false)
	game_state.add_item("Raw riverfish", 40, false)
	var cooked := false
	for attempt in range(40):
		if skilling_system.cook_one().begins_with("You cook"):
			cooked = true
			break
	if not cooked:
		return _fail("Cooking never produced cooked food.")
	if game_state.quest_stage(game_state.INTRO_QUEST) != "goblin":
		return _fail("Cooking a normal riverfish did not advance the intro quest.")

	game_state.add_item("Logs", 1, false)
	if not skilling_system.light_fire().begins_with("The logs catch"):
		return _fail("Firemaking failed.")
	game_state.add_item("Bones", 1, false)
	if not skilling_system.bury_bones().begins_with("You bury"):
		return _fail("Prayer bone burial failed.")

	var stole := false
	for attempt in range(50):
		if skilling_system.pickpocket().begins_with("You steal"):
			stole = true
			break
	if not stole:
		return _fail("Thieving never succeeded.")

	game_state.data.slayer_contract = {
		"kind": "rat", "name": "Giant rat", "total": 4, "remaining": 1,
	}
	if not game_state.record_slayer_kill("rat"):
		return _fail("Slayer kill did not count.")
	if not game_state.slayer_contract_interaction().begins_with("Contract complete"):
		return _fail("Slayer contract could not be claimed.")

	var packed := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world := packed.instantiate()
	root.add_child(world)
	await physics_frame
	await physics_frame
	if world.get_tree().get_nodes_in_group("skill_resources").size() != 44:
		return _fail("Not all authored gathering resources spawned.")
	if world.get_tree().get_nodes_in_group("skill_stations").size() != 5:
		return _fail("Not all authored skilling stations spawned.")
	var harvestable_trees := 0
	for resource in world.get_tree().get_nodes_in_group("skill_resources"):
		if resource.skill_kind != "tree":
			continue
		harvestable_trees += 1
		if (
			resource.get_node_or_null("HarvestableTreeVisual") == null
			or resource.get_node("Body").visible
		):
			return _fail("A harvestable tree still uses the white box visual.")
	if harvestable_trees != 18:
		return _fail("Expected all 18 harvestable trees.")

	print(
		"SKILLS_TEST skills=20 recipes=34 resources=44 stations=5 trees=18 "
		+ "gathering=true production=true utility=true combat=true"
	)
	quit(0)


func _repeat_until_success(action: Callable, prefix: String, attempts: int) -> bool:
	for attempt in range(attempts):
		if str(action.call()).begins_with(prefix):
			return true
	return false


func _repeat_dictionary_until_success(action: Callable, attempts: int) -> bool:
	for attempt in range(attempts):
		if bool(action.call().get("success", false)):
			return true
	return false


func _fail(message: String) -> void:
	push_error(message)
	quit(1)

