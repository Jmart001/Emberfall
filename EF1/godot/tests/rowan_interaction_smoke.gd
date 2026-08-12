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
	var rowan = world.get_node("NPCs/Rowan")
	var rowan_tile: Vector2i = world.logical_grid.world_to_tile(
		rowan.global_position
	)
	var adjacent: Vector2i = world.logical_grid.nearest_walkable(
		rowan_tile + Vector2i.RIGHT, 4
	)
	world.teleport_to_tile(adjacent)
	await process_frame
	await process_frame
	var screen_point: Vector2 = world.camera.unproject_position(
		rowan.global_position + Vector3(0.0, 0.7, 0.0)
	)
	var picked = world._raycast_interactable(screen_point)
	var failed := false
	if picked != rowan:
		push_error(
			"Captain Rowan screen pick failed: %s."
			% ("nothing" if picked == null else picked.name)
		)
		failed = true
	world._begin_interaction(rowan, "talk")
	await process_frame
	if (
		not world.dialogue_panel.visible
		or world.dialogue_target != rowan
		or world.dialogue_name.text != "Captain Rowan"
	):
		push_error(
			"Captain Rowan talk failed player=%s rowan=%s pending=%s reached=%s."
			% [
				world.logical_grid.world_to_tile(world.player.global_position),
				rowan_tile,
				world.pending_interaction != null,
				world.player.has_reached_target(),
			]
		)
		failed = true
	world._close_dialogue()
	world.get_node("UI").open_npc_context(
		rowan,
		screen_point,
		world._context_interact.bind(rowan, "talk"),
		world._context_interact.bind(rowan, "special"),
		world._context_interact.bind(rowan, "pickpocket"),
		world._context_walk.bind(rowan)
	)
	var talk_button: Button
	for child in world.get_node("UI").context_content.get_children():
		if child is Button and child.text.begins_with("Talk-to"):
			talk_button = child
	if talk_button == null:
		push_error("Captain Rowan right-click menu has no Talk-to action.")
		failed = true
	else:
		talk_button.pressed.emit()
		await process_frame
		if not world.dialogue_panel.visible:
			push_error("Captain Rowan right-click Talk-to action failed.")
			failed = true
	print(
		"ROWAN_INTERACTION_TEST picked=%s left_talk=true right_talk=true"
		% (picked == rowan)
	)
	quit(1 if failed else 0)
