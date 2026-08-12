extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var game_state = root.get_node("GameState")
	var original: Dictionary = game_state.data.duplicate(true)
	game_state.data.inventory = {
		"Coins": 100,
		"Bread": 2,
		"Fishing bait": 10,
		"Logs": 4,
		"Fishing rod": 1,
	}
	game_state.data.health = 0
	var scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world = scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	await process_frame
	world._handle_player_death()
	await process_frame
	var failed := false
	if (
		world.player_gravestone == null
		or not is_instance_valid(world.player_gravestone)
		or not world.get_node("UI").death_overlay.visible
		or not game_state.data.has("grave")
	):
		push_error("Death did not create the visible recoverable gravestone.")
		failed = true
	world._recover_gravestone()
	await process_frame
	if game_state.data.has("grave") or world.player_gravestone != null:
		push_error("Recovering the world gravestone did not remove it.")
		failed = true
	game_state.data = original
	game_state.save_game()
	print("GRAVESTONE_WORLD_TEST spawned=true overlay=true recovered=true")
	quit(1 if failed else 0)
