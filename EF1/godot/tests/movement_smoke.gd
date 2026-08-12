extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var packed: PackedScene = load("res://scenes/greenrest/greenrest.tscn")
	var world: Node3D = packed.instantiate()
	root.add_child(world)
	await physics_frame
	await physics_frame
	await physics_frame

	var player: CharacterBody3D = world.player
	var start := player.global_position
	# This destination is directly across HouseSouth from the spawn tile. A
	# straight-line mover would enter the house; A* must route around it.
	var target := Vector3(14.0, 0.05, 6.0)
	print("MOVEMENT_TEST target=", target)
	var accepted: bool = world.request_move_to_world(target)
	var destination_tile: Vector2i = world.logical_grid.world_to_tile(target)
	var direct_tile_distance: int = absi(
		destination_tile.x - world.logical_grid.world_to_tile(start).x
	)
	var path_is_clear := true
	for waypoint in player.movement_path:
		var waypoint_tile: Vector2i = world.logical_grid.world_to_tile(waypoint)
		if world.logical_grid.is_blocked(waypoint_tile):
			path_is_clear = false
			push_error("Path entered blocked tile %s." % waypoint_tile)
	var route_detours: bool = player.movement_path.size() > direct_tile_distance
	print(
		"MOVEMENT_TEST waypoints=",
		player.movement_path.size(),
		" direct_tiles=",
		direct_tile_distance,
		" clear=",
		path_is_clear,
		" detours=",
		route_detours
	)

	await create_timer(5.0).timeout
	var distance := start.distance_to(player.global_position)
	var final_tile: Vector2i = world.logical_grid.world_to_tile(player.global_position)
	print("MOVEMENT_TEST moved=", distance, " start=", start, " end=", player.global_position)
	print("MOVEMENT_TEST final_tile=", final_tile, " expected=", destination_tile)
	if (
		not accepted
		or not path_is_clear
		or not route_detours
		or final_tile != destination_tile
	):
		push_error("Movement smoke test failed.")
		quit(1)
		return
	quit(0)
