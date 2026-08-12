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
	var enemies := world.get_node("Enemies").get_children()
	for monster_id in ["rat", "goblin", "wolf", "boar"]:
		var found := false
		for enemy in enemies:
			if enemy.monster_id != monster_id:
				continue
			found = true
			var model = enemy.find_child("ImportedMonsterModel", true, false)
			if model == null:
				push_error("%s did not load its imported model." % monster_id)
				failed = true
			elif not _has_visible_mesh(model):
				push_error("%s imported without a visible mesh." % monster_id)
				failed = true
			elif enemy.monster_animator == null:
				push_error("%s imported without animations." % monster_id)
				failed = true
			break
		if not found:
			push_error("No %s spawn was available for visual testing." % monster_id)
			failed = true

	print("IMPORTED_MONSTERS_TEST rat=true goblin=true wolf=true boar=true")
	quit(1 if failed else 0)


func _has_visible_mesh(node: Node) -> bool:
	if node is MeshInstance3D and node.visible and node.mesh != null:
		return true
	for child in node.get_children():
		if _has_visible_mesh(child):
			return true
	return false
