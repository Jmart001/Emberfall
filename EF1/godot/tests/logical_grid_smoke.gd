extends SceneTree

const LogicalGridClass := preload("res://scripts/world/logical_grid.gd")


func _initialize() -> void:
	var grid = LogicalGridClass.new(Vector2i(8, 8), Vector3.ZERO)
	grid.set_blocked(Vector2i(3, 2))
	grid.set_blocked(Vector2i(3, 3))
	grid.set_blocked(Vector2i(3, 4))

	var start := grid.tile_to_world(Vector2i(1, 3))
	var path: PackedVector3Array = grid.path_world(start, Vector2i(5, 3))
	var clear := not path.is_empty()
	var previous := Vector2i(1, 3)
	for waypoint in path:
		var tile: Vector2i = grid.world_to_tile(waypoint)
		if grid.is_blocked(tile):
			clear = false
		if tile.x != previous.x and tile.y != previous.y:
			var horizontal := Vector2i(tile.x, previous.y)
			var vertical := Vector2i(previous.x, tile.y)
			if grid.is_blocked(horizontal) or grid.is_blocked(vertical):
				clear = false
				push_error("Path cut a blocked corner.")
		previous = tile

	print("GRID_TEST waypoints=", path.size(), " clear=", clear, " end=", previous)
	if not clear or previous != Vector2i(5, 3) or path.size() <= 4:
		push_error("Logical grid smoke test failed.")
		quit(1)
		return
	quit(0)

