extends SceneTree

const InteractionRangeClass := preload("res://scripts/systems/interaction_range.gd")
const LogicalGridClass := preload("res://scripts/world/logical_grid.gd")


func _initialize() -> void:
	var grid = LogicalGridClass.new(Vector2i(10, 10), Vector3.ZERO)
	var target := Vector2i(6, 5)
	grid.set_blocked(target)
	grid.set_blocked(Vector2i(5, 5))
	var start_world: Vector3 = grid.tile_to_world(Vector2i(2, 5))

	var talk_tile: Vector2i = grid.find_reachable_tile_in_range(
		start_world,
		target,
		InteractionRangeClass.TALK
	)
	var talk_distance: int = InteractionRangeClass.tile_distance(talk_tile, target)
	var talk_valid := (
		talk_tile.x >= 0
		and not grid.is_blocked(talk_tile)
		and talk_distance == InteractionRangeClass.TALK
	)

	var ranged_tile: Vector2i = grid.find_reachable_tile_in_range(
		start_world,
		target,
		InteractionRangeClass.RANGED
	)
	var start_tile: Vector2i = grid.world_to_tile(start_world)
	var ranged_stays_put := ranged_tile == start_tile

	var diagonal_adjacent := InteractionRangeClass.is_cardinal_in_range(
		Vector2i(4, 4),
		Vector2i(5, 5),
		InteractionRangeClass.MELEE
	)
	var same_tile_melee := InteractionRangeClass.is_cardinal_in_range(
		Vector2i(5, 5),
		Vector2i(5, 5),
		InteractionRangeClass.MELEE
	)
	var open_grid = LogicalGridClass.new(Vector2i(7, 7), Vector3.ZERO)
	var mob_tile := Vector2i(3, 3)
	var same_tile_destination: Vector2i = open_grid.find_reachable_tile_in_range(
		open_grid.tile_to_world(mob_tile),
		mob_tile,
		InteractionRangeClass.MELEE,
		true
	)
	var diagonal_tile := Vector2i(2, 2)
	var diagonal_ranged_destination: Vector2i = (
		open_grid.find_reachable_tile_in_range(
			open_grid.tile_to_world(diagonal_tile),
			mob_tile,
			InteractionRangeClass.MELEE,
			false
		)
	)
	var diagonal_destination: Vector2i = open_grid.find_reachable_tile_in_range(
		open_grid.tile_to_world(diagonal_tile),
		mob_tile,
		InteractionRangeClass.MELEE,
		true
	)
	var same_tile_repositions := (
		same_tile_destination != mob_tile
		and InteractionRangeClass.cardinal_tile_distance(
			same_tile_destination, mob_tile
		) == 1
	)
	var diagonal_repositions := (
		diagonal_destination != diagonal_tile
		and InteractionRangeClass.cardinal_tile_distance(
			diagonal_destination, mob_tile
		) == 1
	)
	var diagonal_ranged_stays_put := diagonal_ranged_destination == diagonal_tile

	print(
		"INTERACTION_TEST talk_tile=",
		talk_tile,
		" talk_distance=",
		talk_distance,
		" ranged_tile=",
		ranged_tile,
		" diagonal_melee=",
		diagonal_adjacent,
		" same_tile_melee=",
		same_tile_melee,
		" same_tile_repositions=",
		same_tile_repositions,
		" diagonal_repositions=",
		diagonal_repositions,
		" diagonal_ranged=",
		diagonal_ranged_stays_put
	)
	if (
		not talk_valid
		or not ranged_stays_put
		or diagonal_adjacent
		or same_tile_melee
		or not same_tile_repositions
		or not diagonal_repositions
		or not diagonal_ranged_stays_put
	):
		push_error("Interaction range smoke test failed.")
		quit(1)
		return
	quit(0)
