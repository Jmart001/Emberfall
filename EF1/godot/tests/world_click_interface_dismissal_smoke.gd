extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	root.get_node("GameState").new_game()
	var world := (
		load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	).instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	var ui = world.get_node("UI")
	var move_target: Vector3 = world.player.global_position

	ui.open_shop("fishing")
	world.request_move_to_world(move_target)
	if ui.modal.visible:
		return _fail("A world movement click did not close the shop.")

	ui.open_bank()
	world.request_move_to_world(move_target)
	if ui.modal.visible:
		return _fail("A world movement click did not close the bank.")

	var banker: Node3D = world._find_npc("banker")
	world._show_npc_dialogue(banker)
	world.request_move_to_world(move_target)
	if world.dialogue_panel.visible:
		return _fail("A world movement click did not close NPC dialogue.")

	ui.open_wiki()
	world.request_move_to_world(move_target)
	if ui.modal.visible:
		return _fail("A world movement click did not close the interface.")

	ui.open_world_map()
	world.request_move_to_world(move_target)
	if not ui.modal.visible or ui.current_modal_kind != "map":
		return _fail("A world movement click incorrectly closed the map.")

	print("WORLD CLICK INTERFACE DISMISSAL SMOKE PASSED")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
