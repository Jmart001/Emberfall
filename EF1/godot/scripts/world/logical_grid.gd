class_name LogicalGrid
extends RefCounted

const TILE_SIZE := 1.5
const ELEVATION_STEP := 0.25
const WATER_SURFACE_OFFSET := -0.08
const DOCK_SURFACE_OFFSET := 0.08

var dimensions: Vector2i
var world_origin: Vector3
var astar := AStar2D.new()
var blocked_tiles: Dictionary = {}
var blocked_edges: Dictionary = {}
var elevation_steps: PackedInt32Array
var terrain_values := ""


func _init(grid_dimensions: Vector2i, origin: Vector3) -> void:
	dimensions = grid_dimensions
	world_origin = origin
	elevation_steps.resize(dimensions.x * dimensions.y)
	elevation_steps.fill(0)
	_rebuild_graph()


func contains(tile: Vector2i) -> bool:
	return tile.x >= 0 and tile.y >= 0 and tile.x < dimensions.x and tile.y < dimensions.y


func world_to_tile(world_position: Vector3) -> Vector2i:
	var local := world_position - world_origin
	return Vector2i(floori(local.x / TILE_SIZE), floori(local.z / TILE_SIZE))


func tile_to_world(tile: Vector2i, height := 0.05) -> Vector3:
	return Vector3(
		world_origin.x + (tile.x + 0.5) * TILE_SIZE,
		surface_height(tile) + height,
		world_origin.z + (tile.y + 0.5) * TILE_SIZE
	)


func set_tile_elevation(tile: Vector2i, steps: int) -> void:
	if contains(tile):
		elevation_steps[_point_id(tile)] = steps


func set_elevation_data(rows: Array) -> void:
	if rows.size() != dimensions.y:
		return
	for y in range(dimensions.y):
		var row: Array = rows[y]
		if row.size() != dimensions.x:
			return
		for x in range(dimensions.x):
			elevation_steps[y * dimensions.x + x] = int(row[x])


func set_terrain_data(encoded_terrain: String) -> void:
	if encoded_terrain.length() == dimensions.x * dimensions.y:
		terrain_values = encoded_terrain


func surface_height(tile: Vector2i) -> float:
	if not contains(tile):
		return world_origin.y
	var height := world_origin.y + elevation_steps[_point_id(tile)] * ELEVATION_STEP
	if not terrain_values.is_empty():
		var terrain := "0123456789abcde".find(terrain_values[_point_id(tile)])
		if terrain in [2, 14]:
			height += WATER_SURFACE_OFFSET
		elif terrain == 11:
			height += DOCK_SURFACE_OFFSET
	return height


func clamp_tile(tile: Vector2i) -> Vector2i:
	return Vector2i(
		clampi(tile.x, 0, dimensions.x - 1),
		clampi(tile.y, 0, dimensions.y - 1)
	)


func set_blocked(tile: Vector2i, blocked := true, rebuild := true) -> void:
	if not contains(tile):
		return
	if blocked:
		blocked_tiles[tile] = true
	else:
		blocked_tiles.erase(tile)
	if rebuild:
		_rebuild_graph()


func rebuild() -> void:
	_rebuild_graph()


func block_world_bounds(center: Vector3, size: Vector2) -> void:
	var minimum := world_to_tile(center - Vector3(size.x * 0.5, 0.0, size.y * 0.5))
	var maximum := world_to_tile(
		center + Vector3(size.x * 0.5 - 0.001, 0.0, size.y * 0.5 - 0.001)
	)
	for tile_y in range(minimum.y, maximum.y + 1):
		for tile_x in range(minimum.x, maximum.x + 1):
			if contains(Vector2i(tile_x, tile_y)):
				blocked_tiles[Vector2i(tile_x, tile_y)] = true
	_rebuild_graph()


func block_building_edges(
	center: Vector3,
	footprint: Vector2i,
	doorway_tile: Vector2i,
	doorway_outside_tile: Vector2i
) -> void:
	var center_tile := world_to_tile(center)
	var half_width := footprint.x / 2
	var half_height := footprint.y / 2
	var minimum := center_tile - Vector2i(half_width, half_height)
	var maximum := center_tile + Vector2i(half_width, half_height)
	for tile_y in range(minimum.y, maximum.y + 1):
		for tile_x in range(minimum.x, maximum.x + 1):
			var inside := Vector2i(tile_x, tile_y)
			if not contains(inside):
				continue
			for offset in _neighbor_offsets():
				var outside: Vector2i = inside + offset
				if not contains(outside) or _inside_rect(outside, minimum, maximum):
					continue
				if inside == doorway_tile and outside == doorway_outside_tile:
					continue
				_set_edge_blocked_internal(inside, outside, true)
	_rebuild_graph()


func is_blocked(tile: Vector2i) -> bool:
	return not contains(tile) or blocked_tiles.has(tile)


func is_edge_blocked(from_tile: Vector2i, to_tile: Vector2i) -> bool:
	return blocked_edges.has(_edge_key(from_tile, to_tile))


func set_edge_blocked(
	from_tile: Vector2i,
	to_tile: Vector2i,
	blocked := true,
	rebuild := true
) -> void:
	if not contains(from_tile) or not contains(to_tile):
		return
	_set_edge_blocked_internal(from_tile, to_tile, blocked)
	if rebuild:
		_refresh_connections_around_edge(from_tile, to_tile)


func path_world(start_world: Vector3, end_tile: Vector2i) -> PackedVector3Array:
	var start_tile := clamp_tile(world_to_tile(start_world))
	if is_blocked(end_tile):
		return PackedVector3Array()
	return _id_path_to_world(astar.get_id_path(_point_id(start_tile), _point_id(end_tile)))


# Temporarily disable extra tiles (dynamic actors) so astar routes AROUND them
# instead of plotting a path through them. Returns a handle to restore with
# pop_dynamic_blocks(). Tiles that are already blocked are left untouched.
func push_dynamic_blocks(tiles: Array, keep_open: Array = []) -> Array:
	var keep: Dictionary = {}
	for tile in keep_open:
		keep[tile] = true
	var toggled: Array = []
	for tile in tiles:
		if keep.has(tile) or not contains(tile):
			continue
		var point_id := _point_id(tile)
		if not astar.is_point_disabled(point_id):
			astar.set_point_disabled(point_id, true)
			toggled.append(point_id)
	return toggled


func pop_dynamic_blocks(handle: Array) -> void:
	for point_id in handle:
		astar.set_point_disabled(point_id, false)


func find_reachable_tile_in_range(
	start_world: Vector3,
	target_tile: Vector2i,
	maximum_range: int,
	cardinal_only := false
) -> Vector2i:
	var start_tile := clamp_tile(world_to_tile(start_world))
	var best_tile := Vector2i(-1, -1)
	var best_path_size := 2147483647
	for y in range(target_tile.y - maximum_range, target_tile.y + maximum_range + 1):
		for x in range(target_tile.x - maximum_range, target_tile.x + maximum_range + 1):
			var candidate := Vector2i(x, y)
			if not contains(candidate) or is_blocked(candidate):
				continue
			var delta := target_tile - candidate
			var distance := (
				absi(delta.x) + absi(delta.y)
				if cardinal_only
				else maxi(absi(delta.x), absi(delta.y))
			)
			if cardinal_only and distance == 0:
				continue
			if distance > maximum_range:
				continue
			if candidate == start_tile:
				return candidate
			var candidate_path := astar.get_id_path(
				_point_id(start_tile),
				_point_id(candidate)
			)
			if candidate_path.is_empty():
				continue
			if candidate_path.size() < best_path_size:
				best_path_size = candidate_path.size()
				best_tile = candidate
	return best_tile


func path_world_to_range(
	start_world: Vector3,
	target_tile: Vector2i,
	maximum_range: int,
	cardinal_only := false
) -> Dictionary:
	var destination := find_reachable_tile_in_range(
		start_world,
		target_tile,
		maximum_range,
		cardinal_only
	)
	if destination.x < 0:
		return {"destination": destination, "path": PackedVector3Array()}
	var start_tile := clamp_tile(world_to_tile(start_world))
	if destination == start_tile:
		return {"destination": destination, "path": PackedVector3Array()}
	return {
		"destination": destination,
		"path": _id_path_to_world(
			astar.get_id_path(_point_id(start_tile), _point_id(destination))
		),
	}


func nearest_walkable(tile: Vector2i, max_radius := 5) -> Vector2i:
	tile = clamp_tile(tile)
	if not is_blocked(tile):
		return tile
	for radius in range(1, max_radius + 1):
		for y in range(tile.y - radius, tile.y + radius + 1):
			for x in range(tile.x - radius, tile.x + radius + 1):
				var candidate := Vector2i(x, y)
				if contains(candidate) and not is_blocked(candidate):
					return candidate
	return Vector2i(-1, -1)


func _rebuild_graph() -> void:
	astar.clear()
	for y in range(dimensions.y):
		for x in range(dimensions.x):
			var tile := Vector2i(x, y)
			astar.add_point(_point_id(tile), Vector2(x, y))
			astar.set_point_disabled(_point_id(tile), is_blocked(tile))
	for y in range(dimensions.y):
		for x in range(dimensions.x):
			var tile := Vector2i(x, y)
			if is_blocked(tile):
				continue
			for offset in [Vector2i.RIGHT, Vector2i.DOWN, Vector2i(1, 1), Vector2i(-1, 1)]:
				var neighbor: Vector2i = tile + offset
				if not contains(neighbor) or is_blocked(neighbor):
					continue
				if _connection_is_allowed(tile, neighbor):
					astar.connect_points(_point_id(tile), _point_id(neighbor), true)


func _connection_is_allowed(from_tile: Vector2i, to_tile: Vector2i) -> bool:
	if is_edge_blocked(from_tile, to_tile):
		return false
	if absi(elevation_steps[_point_id(from_tile)] - elevation_steps[_point_id(to_tile)]) > 1:
		return false
	var delta := to_tile - from_tile
	if absi(delta.x) == 1 and absi(delta.y) == 1:
		var horizontal := Vector2i(to_tile.x, from_tile.y)
		var vertical := Vector2i(from_tile.x, to_tile.y)
		if is_blocked(horizontal) or is_blocked(vertical):
			return false
		if (
			is_edge_blocked(from_tile, horizontal)
			or is_edge_blocked(horizontal, to_tile)
			or is_edge_blocked(from_tile, vertical)
			or is_edge_blocked(vertical, to_tile)
		):
			return false
	return true


func _point_id(tile: Vector2i) -> int:
	return tile.y * dimensions.x + tile.x


func _id_to_tile(point_id: int) -> Vector2i:
	return Vector2i(point_id % dimensions.x, point_id / dimensions.x)


func _id_path_to_world(id_path: PackedInt64Array) -> PackedVector3Array:
	var result := PackedVector3Array()
	for index in range(1, id_path.size()):
		result.append(tile_to_world(_id_to_tile(id_path[index])))
	return result


func _set_edge_blocked_internal(from_tile: Vector2i, to_tile: Vector2i, blocked: bool) -> void:
	var key := _edge_key(from_tile, to_tile)
	if blocked:
		blocked_edges[key] = true
	else:
		blocked_edges.erase(key)


func _refresh_connections_around_edge(
	from_tile: Vector2i,
	to_tile: Vector2i
) -> void:
	var affected: Dictionary = {}
	for center in [from_tile, to_tile]:
		affected[center] = true
		for offset in _neighbor_offsets():
			var neighbor: Vector2i = center + offset
			if contains(neighbor):
				affected[neighbor] = true
	for tile_variant in affected:
		var tile: Vector2i = tile_variant
		if is_blocked(tile):
			continue
		var tile_id := _point_id(tile)
		for offset in _neighbor_offsets():
			var neighbor := tile + offset
			if not contains(neighbor) or is_blocked(neighbor):
				continue
			var neighbor_id := _point_id(neighbor)
			var allowed := _connection_is_allowed(tile, neighbor)
			var connected := astar.are_points_connected(tile_id, neighbor_id)
			if allowed and not connected:
				astar.connect_points(tile_id, neighbor_id, true)
			elif not allowed and connected:
				astar.disconnect_points(tile_id, neighbor_id, true)


func _edge_key(from_tile: Vector2i, to_tile: Vector2i) -> String:
	var from_id := _point_id(from_tile)
	var to_id := _point_id(to_tile)
	return "%d:%d" % [mini(from_id, to_id), maxi(from_id, to_id)]


func _inside_rect(tile: Vector2i, minimum: Vector2i, maximum: Vector2i) -> bool:
	return (
		tile.x >= minimum.x
		and tile.x <= maximum.x
		and tile.y >= minimum.y
		and tile.y <= maximum.y
	)


func _neighbor_offsets() -> Array[Vector2i]:
	return [
		Vector2i(-1, -1),
		Vector2i(0, -1),
		Vector2i(1, -1),
		Vector2i(-1, 0),
		Vector2i(1, 0),
		Vector2i(-1, 1),
		Vector2i(0, 1),
		Vector2i(1, 1),
	]
