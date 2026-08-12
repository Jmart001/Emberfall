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

	var npcs := get_nodes_in_group("npcs")
	var failed := npcs.is_empty()
	for npc in npcs:
		if not npc.has_method("set_wander_paused"):
			push_error("%s has no wander behavior." % npc.name)
			failed = true
			continue
		if npc.wander_radius_tiles < 4:
			push_error("%s has no wander radius." % npc.name)
			failed = true
			continue
		var home: Vector3 = npc.wander_home
		for attempt in range(24):
			npc.wander_path.clear()
			npc.wander_path_index = 0
			npc._choose_wander_path()
			for point in npc.wander_path:
				var point_tile: Vector2i = npc.wander_grid.world_to_tile(point)
				var offset: Vector2i = point_tile - npc.wander_home_tile
				if (
					maxi(absi(offset.x), absi(offset.y))
					> npc.wander_radius_tiles
				):
					push_error(
						"%s received a path outside its home radius."
						% npc.name
					)
					failed = true
		var maximum_distance: float = (
			npc.wander_radius_tiles * LogicalGrid.TILE_SIZE * sqrt(2.0)
		)
		if npc.global_position.distance_to(home) > maximum_distance + 0.01:
			push_error("%s wandered beyond its home radius." % npc.name)
			failed = true

	var rowan = world.get_node("NPCs/Rowan")
	world._show_npc_dialogue(rowan)
	var paused_position: Vector3 = rowan.position
	rowan._physics_process(1.0)
	if not rowan.wander_paused or rowan.position != paused_position:
		push_error("Captain Rowan wandered during dialogue.")
		failed = true
	world._close_dialogue()
	if rowan.wander_paused:
		push_error("Captain Rowan did not resume wandering after dialogue.")
		failed = true

	print(
		"NPC_WANDER_TEST npcs=%d radius=true dialogue_pause=true"
		% npcs.size()
	)
	quit(1 if failed else 0)
