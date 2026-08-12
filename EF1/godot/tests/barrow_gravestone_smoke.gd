extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var game_state = root.get_node("GameState")
	var original: Dictionary = game_state.data.duplicate(true)
	game_state.data.inventory = {
		"Coins": 200,
		"Bread": 2,
		"Fishing bait": 10,
		"Logs": 4,
		"Fishing rod": 1,
		"Copper ore": 3,
	}
	game_state.data.health = 0

	var scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world = scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	await process_frame
	world.player.global_position = world.logical_grid.tile_to_world(Vector2i(6, 75))
	world._handle_player_death()
	await process_frame

	var failed := false
	var grave: Dictionary = game_state.data.get("grave", {})
	var grave_tile := Vector2i(
		int(grave.get("x", -1)),
		int(grave.get("y", -1))
	)
	if (
		grave.is_empty()
		or not bool(grave.get("in_barrow", false))
		or grave_tile != world.BARROW_GRAVE_TILE
		or grave_tile == world.BARROW_ENTRANCE_TILE
		or world.player_gravestone == null
		or not is_instance_valid(world.player_gravestone)
	):
		push_error("Barrow death did not create a visible entrance-side grave.")
		failed = true
	else:
		var adjacent: Vector2i = world.logical_grid.nearest_walkable(
			world.BARROW_GRAVE_TILE + Vector2i.RIGHT,
			4
		)
		world.teleport_to_tile(adjacent)
		await process_frame
		await physics_frame
		var screen_point: Vector2 = world.camera.unproject_position(
			world.player_gravestone.global_position + Vector3(0.0, 1.0, 0.0)
		)
		var picked = world._raycast_interactable(screen_point)
		if picked != world.player_gravestone:
			push_error(
				"The visible gravestone mouse ray selected %s."
				% ("nothing" if picked == null else picked.name)
			)
			failed = true
		world._begin_interaction(world.player_gravestone, "resource")
		await process_frame
		await process_frame
		if game_state.data.has("grave") or world.player_gravestone != null:
			push_error("Click interaction did not recover the Barrow gravestone.")
			failed = true

	game_state.data = original
	game_state.save_game()
	print("BARROW_GRAVE_TEST entrance_clear=true spawned=true clicked=true recovered=true")
	quit(1 if failed else 0)
