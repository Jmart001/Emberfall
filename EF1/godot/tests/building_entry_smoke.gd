extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var packed: PackedScene = load("res://scenes/greenrest/greenrest.tscn")
	var world: Node3D = packed.instantiate()
	root.add_child(world)
	await physics_frame
	await physics_frame

	var building: Node3D = world.get_node("ElowensHouse")
	var interior_tile: Vector2i = building.get_center_tile(world.logical_grid)
	var doorway_tile: Vector2i = building.get_doorway_tile(world.logical_grid)
	var doorway_outside_tile: Vector2i = building.get_doorway_outside_tile(world.logical_grid)
	var wall_inside_tile := doorway_tile + Vector2i.LEFT
	var wall_outside_tile := doorway_outside_tile + Vector2i.LEFT
	var accepted: bool = world.request_move_to_world(
		world.logical_grid.tile_to_world(interior_tile)
	)
	var path_uses_door := false
	var path_is_clear := true
	for waypoint in world.player.movement_path:
		var tile: Vector2i = world.logical_grid.world_to_tile(waypoint)
		if tile == doorway_tile:
			path_uses_door = true
		if world.logical_grid.is_blocked(tile):
			path_is_clear = false

	await create_timer(5.0).timeout
	var final_tile: Vector2i = world.logical_grid.world_to_tile(
		world.player.global_position
	)
	print(
		"BUILDING_TEST accepted=",
		accepted,
		" door=",
		path_uses_door,
		" clear=",
		path_is_clear,
		" wall_tiles_walkable=",
		not world.logical_grid.is_blocked(wall_inside_tile)
			and not world.logical_grid.is_blocked(wall_outside_tile),
		" wall_edge_blocked=",
		world.logical_grid.is_edge_blocked(wall_inside_tile, wall_outside_tile),
		" final=",
		final_tile
	)
	if (
		not accepted
		or not path_uses_door
		or not path_is_clear
		or world.logical_grid.is_blocked(wall_inside_tile)
		or world.logical_grid.is_blocked(wall_outside_tile)
		or not world.logical_grid.is_edge_blocked(wall_inside_tile, wall_outside_tile)
		or final_tile != interior_tile
	):
		push_error("Building entry smoke test failed.")
		quit(1)
		return
	quit(0)
