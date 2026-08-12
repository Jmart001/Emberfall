extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var scene := load("res://scenes/world/test_resource.tscn") as PackedScene
	var copper := scene.instantiate()
	root.add_child(copper)
	copper.configure_skill("rock", {
		"name": "Copper rock",
		"ore": "copperOre",
		"color": "#b87343",
	})
	await process_frame
	if not _visual_has_color(copper.mining_rock_visual, Color("b87343")):
		return _fail("Copper rock did not use its copper color.")

	copper.successful_actions = 2
	copper._record_depletion()
	if not _visual_has_color(copper.mining_rock_visual, Color("b87343")):
		return _fail("Copper rock depleted before the final mining tick ended.")
	copper.depletion_pending_until = 1
	copper._process(0.0)
	if not copper.visible:
		return _fail("A depleted mining rock was hidden.")
	if not _visual_has_color(copper.mining_rock_visual, Color("777b7d")):
		return _fail("A depleted mining rock did not turn grey.")

	copper.depleted_until = 1
	copper._process(0.0)
	if not _visual_has_color(copper.mining_rock_visual, Color("b87343")):
		return _fail("Copper color was not restored after respawning.")

	var coal := scene.instantiate()
	root.add_child(coal)
	coal.configure_skill("rock", {
		"name": "Coal rock",
		"ore": "coal",
	})
	await process_frame
	if not _visual_has_color(coal.mining_rock_visual, Color("292b2d")):
		return _fail("Coal rock did not use its coal color.")

	print("MINING ROCK VISUALS SMOKE PASSED")
	quit(0)


func _visual_has_color(node: Node, expected: Color) -> bool:
	if node is MeshInstance3D:
		var material := (node as MeshInstance3D).material_override as StandardMaterial3D
		if material != null and material.albedo_color.is_equal_approx(expected):
			return true
	for child in node.get_children():
		if _visual_has_color(child, expected):
			return true
	return false


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
