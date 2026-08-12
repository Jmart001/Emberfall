class_name InteractionRange
extends RefCounted

const TALK := 1
const GATHER := 1
const MELEE := 1
const RANGED := 5
const MAGIC := 6


static func tile_distance(from_tile: Vector2i, to_tile: Vector2i) -> int:
	return maxi(
		absi(to_tile.x - from_tile.x),
		absi(to_tile.y - from_tile.y)
	)


static func cardinal_tile_distance(from_tile: Vector2i, to_tile: Vector2i) -> int:
	return (
		absi(to_tile.x - from_tile.x)
		+ absi(to_tile.y - from_tile.y)
	)


static func is_in_range(from_tile: Vector2i, to_tile: Vector2i, maximum_range: int) -> bool:
	var distance := tile_distance(from_tile, to_tile)
	return distance >= 1 and distance <= maximum_range


static func is_cardinal_in_range(
	from_tile: Vector2i,
	to_tile: Vector2i,
	maximum_range: int
) -> bool:
	var distance := cardinal_tile_distance(from_tile, to_tile)
	return distance >= 1 and distance <= maximum_range


static func range_for(action: StringName) -> int:
	match action:
		&"talk":
			return TALK
		&"gather":
			return GATHER
		&"melee":
			return MELEE
		&"ranged":
			return RANGED
		&"magic":
			return MAGIC
		_:
			push_warning("Unknown interaction action: %s" % action)
			return TALK
