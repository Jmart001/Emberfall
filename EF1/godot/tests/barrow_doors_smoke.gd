extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var game_state = root.get_node("GameState")
	var original: Dictionary = game_state.data.duplicate(true)
	game_state.data.barrow_run_active = true
	game_state.data.erase("barrow_order")
	game_state.data.erase("barrow_via")
	game_state.data.erase("barrow_room")

	var scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world = scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	await process_frame
	world._ensure_barrow_run()

	var failed := false
	var order: Array = game_state.data.get("barrow_order", [])
	if (
		world.barrow_doors.size() != 10
		or order.size() != 9
		or int(order[0]) != 0
		or int(order[8]) != 8
	):
		push_error(
			"Barrow initialization mismatch: doors=%d keys=%s order=%s."
			% [
				world.barrow_doors.size(),
				str(world.barrow_doors.keys()),
				str(order),
			]
		)
		failed = true
	for entry in world.barrow_doors.values():
		if not entry.barrier.visible or bool(entry.revealed):
			push_error("A Barrow door was visible before its room was cleared.")
			failed = true

	var wrong_enemy = world.get_node("Enemies/Guardian_15_73")
	world._advance_barrow_room(wrong_enemy)
	if int(game_state.data.get("barrow_room", -1)) != 0:
		push_error("A monster outside the active room unlocked a door.")
		failed = true

	var first_enemy = world.get_node("Enemies/Guardian_9_74")
	world._advance_barrow_room(first_enemy)
	await create_timer(0.5).timeout
	var revealed := 0
	for entry in world.barrow_doors.values():
		if bool(entry.revealed):
			revealed += 1
			if entry.barrier.visible:
				push_error("The revealed passage still has its stone wall.")
				failed = true
			for leaf in entry.leaves:
				if not leaf.visible or not leaf.is_open:
					push_error("The unlocked chamber door is not visible and open.")
					failed = true
	if int(game_state.data.get("barrow_room", 0)) != 1 or revealed != 1:
		push_error("The first chamber kill did not reveal exactly one door.")
		failed = true

	for room_index in range(1, 8):
		var cell := int(order[room_index])
		var room_definition: Dictionary = {}
		for definition in world.BARROW_ROOM_DEFS:
			if int(definition.cell) == cell:
				room_definition = definition
				break
		var room_enemy = null
		for enemy in world.get_node("Enemies").get_children():
			if (
				enemy.home_tile == room_definition.tile
				and enemy.monster_id == str(room_definition.kind)
			):
				room_enemy = enemy
				break
		if room_enemy == null:
			push_error("The route selected a chamber without its required monster.")
			failed = true
			break
		world._advance_barrow_room(room_enemy)
	revealed = 0
	for entry in world.barrow_doors.values():
		if bool(entry.revealed):
			revealed += 1
	if int(game_state.data.get("barrow_room", 0)) != 8 or revealed != 8:
		push_error("The randomized chamber route did not reach the Warden door.")
		failed = true

	game_state.data = original
	game_state.save_game()
	print("BARROW_DOORS_TEST sealed=10 wrong_kill=false first_unlock=1 route=8")
	quit(1 if failed else 0)
