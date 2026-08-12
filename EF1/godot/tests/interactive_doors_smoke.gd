extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var packed := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world := packed.instantiate()
	root.add_child(world)
	await physics_frame
	await physics_frame

	var doors := world.get_node("InteractiveDoors").get_children()
	var paired_links := 0
	var test_door: Node3D
	for door in doors:
		if door.get("partner") != null:
			paired_links += 1
			if test_door == null:
				test_door = door
	if doors.size() != 52 or paired_links / 2 != 20 or test_door == null:
		push_error("Expected 52 doors with 20 synchronized pairs.")
		quit(1)
		return
	if test_door.get_node_or_null("BlockDoorVisual") == null:
		push_error("Door does not use the block-built wooden visual.")
		quit(1)
		return

	var partner: Node3D = test_door.get("partner")
	var door_visual := test_door.get_node("BlockDoorVisual")
	if (
		door_visual.get_node_or_null("HandleFront") == null
		or door_visual.get_node_or_null("HandleBack") == null
		or door_visual.get_node_or_null("WallHinge0") == null
		or door_visual.get_node_or_null("WallHinge1") == null
		or door_visual.get_node_or_null("WallHinge2") == null
	):
		push_error("Door details are not visible on both sides.")
		quit(1)
		return
	var first_seam: Vector3 = test_door.to_global(Vector3(0.0, 0.0, 1.5))
	var second_seam: Vector3 = partner.to_global(Vector3(0.0, 0.0, 1.5))
	if first_seam.distance_to(second_seam) > 0.02:
		push_error(
			"Closed double-door leaves do not meet: %s / %s, hinges %s / %s."
			% [
				first_seam,
				second_seam,
				test_door.global_position,
				partner.global_position,
			]
		)
		quit(1)
		return
	if test_door.global_position.distance_to(partner.global_position) < 2.9:
		push_error("Double-door hinges are not attached to the outer wall jambs.")
		quit(1)
		return
	var first: Vector2i = test_door.get("first_tile")
	var second: Vector2i = test_door.get("second_tile")
	var partner_first: Vector2i = partner.get("first_tile")
	var partner_second: Vector2i = partner.get("second_tile")
	if (
		not world.logical_grid.is_edge_blocked(first, second)
		or not world.logical_grid.is_edge_blocked(partner_first, partner_second)
	):
		push_error("Closed double door did not block both edges.")
		quit(1)
		return

	test_door.perform_action()
	await create_timer(0.5).timeout
	if (
		not bool(test_door.get("is_open"))
		or not bool(partner.get("is_open"))
		or world.logical_grid.is_edge_blocked(first, second)
		or world.logical_grid.is_edge_blocked(partner_first, partner_second)
	):
		push_error("Opening one double-door leaf did not open both edges.")
		quit(1)
		return

	partner.perform_action()
	await create_timer(0.5).timeout
	if (
		bool(test_door.get("is_open"))
		or bool(partner.get("is_open"))
		or not world.logical_grid.is_edge_blocked(first, second)
		or not world.logical_grid.is_edge_blocked(partner_first, partner_second)
	):
		push_error("Closing one double-door leaf did not close both edges.")
		quit(1)
		return

	print(
		"DOOR_TEST doors=52 pairs=20 synchronized=true collision=true "
		+ "outer_hinges=true two_sided=true closed_seam=true"
	)
	quit(0)
