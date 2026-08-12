extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var scene := load("res://scenes/world/test_resource.tscn") as PackedScene
	var failures: Array[String] = []
	var definitions := [
		["rock", {"name": "Copper rock"}, "MiningRockVisual"],
		["range", {"name": "Cooking range"}, "CookingStoveVisual"],
		["range", {"name": "Test fire"}, "CampfireVisual"],
		["fish", {"name": "Fishing spot"}, "FishingRipples"],
		["farm", {"name": "Farm patch"}, "FarmPatchVisual"],
		["hunt", {"name": "Snare spot"}, "SnareSpotVisual"],
		["workbench", {"name": "Workbench"}, "WorkbenchVisual"],
		["furnace", {"name": "Furnace"}, "FurnaceVisual"],
		["anvil", {"name": "Anvil"}, "AnvilVisual"],
		["altar", {"name": "Altar"}, "AltarVisual"],
		["cauldron", {"name": "Cauldron"}, "CauldronVisual"],
	]
	for entry in definitions:
		var resource = scene.instantiate()
		resource.configure_skill(str(entry[0]), entry[1])
		root.add_child(resource)
		await process_frame
		if resource.get_node_or_null(str(entry[2])) == null:
			failures.append("%s visual was not created." % entry[2])
		if resource.get_node("Body").visible:
			failures.append("%s still shows the placeholder box." % entry[2])
		var shape = resource.get_node("CollisionShape3D").shape
		if shape == null or shape.size.x < 1.0:
			failures.append("%s is still too small." % entry[2])
		resource.queue_free()
	if failures.is_empty():
		print(
			"RESOURCE_VISUAL_TEST resources=11 placeholders=false "
			+ "yard_matches_world=true scaled=true"
		)
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
