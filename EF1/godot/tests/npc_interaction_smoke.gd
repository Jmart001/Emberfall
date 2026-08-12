extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var packed: PackedScene = load("res://scenes/greenrest/greenrest.tscn")
	var world: Node3D = packed.instantiate()
	root.add_child(world)
	await physics_frame
	await physics_frame

	var elowen: Node3D = world.get_node("Elowen")
	world._begin_interaction(elowen)
	await create_timer(2.0).timeout

	var player_tile: Vector2i = world.logical_grid.world_to_tile(world.player.global_position)
	var target_tile: Vector2i = world.logical_grid.world_to_tile(elowen.global_position)
	var distance: int = maxi(
		absi(target_tile.x - player_tile.x),
		absi(target_tile.y - player_tile.y)
	)
	print(
		"NPC_TEST player_tile=",
		player_tile,
		" target_tile=",
		target_tile,
		" distance=",
		distance,
		" dialogue=",
		world.dialogue_panel.visible
	)
	if distance != 1 or not world.dialogue_panel.visible:
		push_error("NPC interaction smoke test failed.")
		quit(1)
		return

	var moved_after_dialogue: bool = world.request_move_to_world(Vector3(8.0, 0.05, 2.0))
	await physics_frame
	print(
		"NPC_TEST move_accepted=",
		moved_after_dialogue,
		" dialogue_after_move=",
		world.dialogue_panel.visible
	)
	if not moved_after_dialogue or world.dialogue_panel.visible:
		push_error("Dialogue did not close when movement began.")
		quit(1)
		return
	quit(0)
