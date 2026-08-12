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

	var enemy = world.get_node("Enemies/Goblin_90_53")
	var shared_tile: Vector2i = enemy.current_tile
	world.player.global_position = world.logical_grid.tile_to_world(shared_tile)
	enemy.snap_to_tile(shared_tile, world.logical_grid.tile_to_world(shared_tile))
	world._start_combat(enemy, false)
	world._process_combat(0.1)

	var failed := false
	var player_tile: Vector2i = world.logical_grid.world_to_tile(
		world.player.global_position
	)
	if enemy.current_tile == player_tile:
		push_error("Combatants remained on the same tile.")
		failed = true
	var delta: Vector2i = enemy.current_tile - player_tile
	if absi(delta.x) + absi(delta.y) != 1:
		push_error("Separated melee combatants are not cardinally adjacent.")
		failed = true

	world.request_move_to_world(
		world.logical_grid.tile_to_world(enemy.current_tile)
	)
	var destination: Vector2i = enemy.current_tile
	if not world.player.movement_path.is_empty():
		destination = world.logical_grid.world_to_tile(
			world.player.movement_path[world.player.movement_path.size() - 1]
		)
	if destination == enemy.current_tile:
		push_error("World movement still targets a monster-occupied tile.")
		failed = true
	print("COMBAT_OCCUPANCY_TEST overlap=false cardinal=true reserved=true")
	quit(1 if failed else 0)
