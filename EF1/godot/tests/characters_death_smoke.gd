extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var failures: Array[String] = []
	var game_state = root.get_node("GameState")
	var original_id: String = game_state.active_character_id()
	var original_data: Dictionary = game_state.data.duplicate(true)
	var original_coins := int(original_data.inventory.get("Coins", 0))

	var second_id: String = game_state.create_character("Second Hero")
	if (
		second_id.is_empty()
		or game_state.active_character_id() != second_id
		or str(game_state.data.get("name", "")) != "Second Hero"
		or int(game_state.data.inventory.get("Coins", 0)) != 30
	):
		failures.append("Creating a fresh independent character failed.")
	game_state.data.inventory["Coins"] = 77
	game_state.save_game()
	if not game_state.switch_character(original_id):
		failures.append("Switching back to the original character failed.")
	elif int(game_state.data.inventory.get("Coins", 0)) != original_coins:
		failures.append("Character inventories are not independent.")
	if not game_state.switch_character(second_id):
		failures.append("Switching to the second character failed.")
	elif int(game_state.data.inventory.get("Coins", 0)) != 77:
		failures.append("The second character did not retain its progress.")
	game_state.switch_character(original_id)
	if not game_state.delete_character(second_id):
		failures.append("Deleting an inactive character failed.")
	if game_state.delete_character(original_id):
		failures.append("The active character was allowed to delete itself.")

	game_state.data.inventory = {
		"Coins": 100,
		"Barrow key": 1,
		"Ember relic": 1,
		"Bronze sword": 1,
		"Bread": 2,
		"Fishing rod": 1,
		"Fishing bait": 20,
		"Logs": 4,
	}
	game_state.data.health = 0
	game_state.data.prayer = 8
	game_state.data.poison = 3
	var death: Dictionary = game_state.apply_death(Vector2i(40, 40), false)
	if (
		int(game_state.data.inventory.get("Coins", 0)) != 90
		or not game_state.data.inventory.has("Barrow key")
		or not game_state.data.inventory.has("Ember relic")
		or int(game_state.data.prayer) != 0
		or int(game_state.data.poison) != 0
		or int(game_state.data.health) != int(game_state.data.max_health)
		or not bool(death.has_grave)
	):
		failures.append("The 2D death penalties were not applied correctly.")
	var grave: Dictionary = game_state.data.get("grave", {})
	if (
		int(grave.get("gold", 0)) != 10
		or int(grave.get("expires_at", 0))
			- int(Time.get_unix_time_from_system()) < 590
	):
		failures.append("The ten-minute gravestone was not created correctly.")
	var recovered: Dictionary = game_state.recover_grave()
	if (
		not bool(recovered.complete)
		or game_state.data.has("grave")
		or int(game_state.data.inventory.get("Coins", 0)) != 100
	):
		failures.append("Gravestone recovery failed.")

	game_state.data.inventory["Coins"] = 100
	game_state.data.inventory["Logs"] = 4
	game_state.data.bank = {}
	game_state.apply_death(Vector2i(41, 41), false)
	game_state.data.grave.expires_at = 0
	if not game_state.expire_grave_if_needed() or game_state.data.has("grave"):
		failures.append("Expired gravestone was not recovered by the bank.")

	game_state.data = original_data
	game_state.save_game()
	if failures.is_empty():
		print(
			"CHARACTER_DEATH_TEST slots=true switching=true independent=true "
			+ "delete=true keep3=true coins=true grave=true recovery=true expiry=true"
		)
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
