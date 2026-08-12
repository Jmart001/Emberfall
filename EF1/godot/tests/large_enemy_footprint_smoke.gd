extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world = scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	await process_frame

	var wolf = world.get_node_or_null("Enemies/Wolf_76_35")
	if wolf == null:
		push_error("Expected wolf spawn is missing.")
		quit(1)
		return

	var failed := false
	var home_anchor: Vector2i = wolf.current_tile
	var footprint: Array[Vector2i] = wolf.occupied_tiles()
	if footprint.size() != 2 or footprint[1] != footprint[0] + Vector2i.DOWN:
		push_error("Wolf does not occupy two adjacent tiles.")
		failed = true
	var expected_center := (
		world.logical_grid.tile_to_world(footprint[0])
		+ world.logical_grid.tile_to_world(footprint[1])
	) * 0.5
	if wolf.global_position.distance_to(expected_center) > 0.01:
		push_error("Wolf is not centered between its occupied tiles.")
		failed = true
	for tile in footprint:
		if not world._actor_occupies_tile(tile):
			push_error("Wolf footprint tile %s is not reserved." % tile)
			failed = true

	var original_weapon: String = str(
		GameState.data.equipment.get("weapon", "")
	)
	for weapon_id in ["", "shortbow", "emberStaff"]:
		for occupied_tile in footprint:
			wolf.snap_to_tile(
				home_anchor,
				world._enemy_world_position(wolf, home_anchor)
			)
			world.player.global_position = world.logical_grid.tile_to_world(
				occupied_tile
			)
			GameState.data.equipment.weapon = weapon_id
			var health_before: int = wolf.health
			world._start_combat(wolf, false)
			world._process_combat(0.1)
			if wolf.health != health_before:
				push_error(
					"%s combat hit the wolf from inside tile %s."
					% [weapon_id if not weapon_id.is_empty() else "melee", occupied_tile]
				)
				failed = true
			var player_tile: Vector2i = world.logical_grid.world_to_tile(
				world.player.global_position
			)
			if player_tile in wolf.occupied_tiles():
				push_error("Combatants were not separated from both wolf tiles.")
				failed = true
			world._clear_combat_target()
	GameState.data.equipment.weapon = original_weapon

	wolf.snap_to_tile(
		home_anchor,
		world._enemy_world_position(wolf, home_anchor)
	)
	var second_tile: Vector2i = home_anchor + Vector2i.DOWN
	world.request_move_to_world(world.logical_grid.tile_to_world(second_tile))
	var destination: Vector2i = world.logical_grid.world_to_tile(
		world.player.movement_path[
			world.player.movement_path.size() - 1
		]
	) if not world.player.movement_path.is_empty() else world.logical_grid.world_to_tile(
		world.player.global_position
	)
	if destination in wolf.occupied_tiles():
		push_error("World movement targeted part of the wolf footprint.")
		failed = true

	print(
		"LARGE_ENEMY_FOOTPRINT_TEST tiles=2 centered=true "
		+ "melee=true ranged=true magic=true"
	)
	quit(1 if failed else 0)
