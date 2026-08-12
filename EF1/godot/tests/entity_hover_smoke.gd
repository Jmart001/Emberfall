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
	var label: Label = world.entity_hover_label
	if label == null or label.mouse_filter != Control.MOUSE_FILTER_IGNORE:
		push_error("Entity hover label is missing or blocks mouse input.")
		failed = true

	var enemies := world.get_node("Enemies").get_children()
	if enemies.is_empty():
		push_error("No monster was available for hover verification.")
		failed = true
	else:
		var enemy = enemies[0]
		if int(enemy.combat_level) < 1:
			push_error("%s has no valid combat level." % enemy.display_name)
			failed = true
		var enemy_hover: String = world._entity_hover_text(enemy)
		if (
			enemy.display_name not in enemy_hover
			or "Level %d" % enemy.combat_level not in enemy_hover
		):
			push_error("Monster hover text omitted its name or combat level.")
			failed = true

	var rowan = world.get_node("NPCs/Rowan")
	if world._entity_hover_text(rowan) != rowan.display_name:
		push_error("NPC hover did not display Captain Rowan's name.")
		failed = true

	print("ENTITY_HOVER_TEST npc_name=true monster_level=true click_through=true")
	quit(1 if failed else 0)
