extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var game_state = root.get_node("GameState")
	game_state.new_game()
	var resource_scene := load("res://scenes/world/test_resource.tscn") as PackedScene
	var drop = resource_scene.instantiate()
	drop.configure({
		"name": "Goblin hide",
		"action": "Take",
		"reward": "Goblin hide",
		"quantity": 3,
		"consume": true,
	})
	root.add_child(drop)
	await process_frame
	var failures: Array[String] = []
	if drop.get_node_or_null("ItemIcon") == null or drop.get_node("Body").visible:
		failures.append("Ground item did not use its 2D icon.")
	if drop.stack_label.text != "x3":
		failures.append("Ground stack count was not shown.")
	var before: int = game_state.item_count("Goblin hide")
	drop.perform_action()
	if game_state.item_count("Goblin hide") != before + 3 or drop.reward_quantity != 0:
		failures.append("Stackable ground pile was not taken together.")

	var weapon_drop = resource_scene.instantiate()
	weapon_drop.configure({
		"name": "Bronze sword",
		"action": "Take",
		"reward": "Bronze sword",
		"quantity": 3,
		"consume": true,
	})
	root.add_child(weapon_drop)
	await process_frame
	var swords_before: int = game_state.item_count("Bronze sword")
	weapon_drop.perform_action()
	if (
		game_state.item_count("Bronze sword") != swords_before + 1
		or weapon_drop.reward_quantity != 2
	):
		failures.append("Non-stackable ground pile did not reveal one item at a time.")
	if weapon_drop.stack_label.text != "x2":
		failures.append("Non-stackable ground pile did not reveal the next item.")

	var world_scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world = world_scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	for npc_id in world.SHOP_NPCS:
		var npc = world._find_npc(npc_id)
		if npc == null:
			failures.append("Missing shopkeeper: %s" % npc_id)
			continue
		world._show_npc_dialogue(npc)
		while world.dialogue_page_index < world.dialogue_pages.size() - 1:
			world._next_dialogue_page()
		var found_shop := false
		for button in world.dialogue_actions.get_children():
			if button.text in ["Browse wares", "Browse provisions"]:
				found_shop = true
		if not found_shop:
			failures.append("Shop missing from dialogue: %s" % npc_id)
		if (
			world.dialogue_text.text
			== "%s. The roads have been restless lately." % npc.role
		):
			failures.append("Shopkeeper still has placeholder chat: %s" % npc_id)
		world._close_dialogue()
	var ui = world.get_node("UI")
	ui.open_shop("fishing")
	await process_frame
	var buy_grid = ui.modal.find_child("ShopBuyGrid", true, false)
	var sell_grid = ui.modal.find_child("ShopSellGrid", true, false)
	var quantity_bar = ui.modal.find_child("QuantityBar", true, false)
	if buy_grid == null or buy_grid.columns != 8 or buy_grid.get_child_count() == 0:
		failures.append("Shop buy grid does not match the 2D eight-column layout.")
	if sell_grid == null or sell_grid.columns != 8:
		failures.append("Shop sell grid does not match the 2D eight-column layout.")
	if quantity_bar == null or quantity_bar.get_child_count() != 5:
		failures.append("Shop quantity bar is missing 1, 5, 10, or X.")
	elif quantity_bar.get_child(4).text != "X":
		failures.append("Shop custom quantity button does not match the 2D shop.")
	if ui.modal_content.get_child(0).text != "Murphy's Fishing Supplies":
		failures.append("Shop title does not match the 2D game.")
	if failures.is_empty():
		print("ITEM_SHOP_TEST icons=81 stacked_pickup=true single_pickup=true shop_dialogues=7 shop_grid=8 all_working=true")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
