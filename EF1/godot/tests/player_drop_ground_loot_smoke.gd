extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var game_state = root.get_node("GameState")
	game_state.new_game()
	game_state.add_item("Fishing bait", 3)
	var world := (
		load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	).instantiate()
	root.add_child(world)
	await process_frame
	await process_frame

	var ui = world.get_node("UI")
	var player_position: Vector3 = world.player.global_position
	var before: int = game_state.item_count("Fishing bait")
	ui._drop_item("Fishing bait", 3)
	await process_frame
	if game_state.item_count("Fishing bait") != before - 3:
		return _fail("Dropping loot did not remove it from the backpack.")

	var dropped_item: Node3D
	for candidate in world.get_node("GroundItems").get_children():
		if (
			candidate.get("ground_item_stack") == true
			and str(candidate.get("reward_item")) == "Fishing bait"
			and int(candidate.get("reward_quantity")) == 3
		):
			dropped_item = candidate
			break
	if dropped_item == null:
		return _fail("Player drop did not create ground loot.")
	if dropped_item.get_node_or_null("ItemIcon") == null:
		return _fail("Player-dropped loot does not show its item image.")
	if dropped_item.stack_label.text != "x3":
		return _fail("Player-dropped stack does not show its quantity.")
	if dropped_item.global_position.distance_to(player_position) > 0.1:
		return _fail("Player-dropped loot did not appear at the player.")

	dropped_item.perform_action()
	if game_state.item_count("Fishing bait") != before:
		return _fail("Player-dropped loot could not be picked back up.")
	print("PLAYER DROP GROUND LOOT SMOKE PASSED")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
