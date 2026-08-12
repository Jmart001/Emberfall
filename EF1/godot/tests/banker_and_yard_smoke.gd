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

	var yard_banker := world.get_node_or_null("TestYard/YardBanker")
	if yard_banker == null:
		return _fail("The yard banker is missing.")
	if "bank" not in str(yard_banker.role).to_lower():
		return _fail("The yard banker does not have bank access.")
	if "Bank of Emberfall" not in world._dialogue_for_target(yard_banker):
		return _fail("The yard banker is missing production dialogue.")

	world._show_npc_dialogue(yard_banker)
	while world.dialogue_page_index < world.dialogue_pages.size() - 1:
		world._next_dialogue_page()
	var bank_button: Button
	for child in world.dialogue_actions.get_children():
		if child is Button and child.text == "Open bank":
			bank_button = child
			break
	if bank_button == null:
		return _fail("Banker dialogue does not offer bank access.")
	bank_button.pressed.emit()
	await process_frame
	if not world.get_node("UI").modal.visible:
		return _fail("Banker dialogue did not open the bank.")

	var production_names := [
		"Rabbit burrow", "Tree", "Copper rock", "Riverfish spot",
		"Farm patch", "Cooking fire", "Greenrest crafting bench",
		"Cinderforge furnace", "Cinderforge anvil", "Frostmere altar",
		"Sablemarsh brewing cauldron",
	]
	for expected_name in production_names:
		var found := false
		for child in world.get_node("TestYard").get_children():
			if str(child.get("display_name")) == expected_name:
				found = true
				break
		if not found:
			return _fail("Yard is missing real object: %s." % expected_name)
	for label in world.get_node("TestYard").find_children("*", "Label3D", true, false):
		if "TEST" in str(label.text).to_upper():
			return _fail("A visible test label remains in the yard.")

	print("BANKER AND YARD SMOKE PASSED")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
