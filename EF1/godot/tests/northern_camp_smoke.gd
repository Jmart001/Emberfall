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

	var failed := false
	var camp := world.get_node_or_null("NorthernCamp")
	if camp == null:
		push_error("Northern camp was not created.")
		failed = true
	else:
		for node_name in [
			"NorthernTentWest",
			"NorthernTentEast",
			"NorthernTentSouth",
		]:
			var tent := camp.get_node_or_null(node_name)
			if tent == null or not _has_mesh(tent):
				push_error("%s is missing its imported mesh." % node_name)
				failed = true
		var fire := camp.get_node_or_null("NorthernCampfire")
		if fire == null or fire.find_child("CampfireVisual", true, false) == null:
			push_error("Northern campfire visual was not created.")
			failed = true
		elif fire.action_label != "Cook-at":
			push_error("Northern campfire is not usable for cooking.")
			failed = true

	for tile in [
		Vector2i(16, 8),
		Vector2i(25, 9),
		Vector2i(17, 15),
		Vector2i(21, 13),
	]:
		if not world.logical_grid.is_blocked(tile):
			push_error("Camp fixture tile %s is not blocked." % tile)
			failed = true

	print("NORTHERN_CAMP_TEST tents=3 campfire=true collision=true")
	quit(1 if failed else 0)


func _has_mesh(node: Node) -> bool:
	if node is MeshInstance3D and node.mesh != null:
		return true
	for child in node.get_children():
		if _has_mesh(child):
			return true
	return false
