extends SceneTree


var game_state: Node
var item_catalog: Node


func _initialize() -> void:
	game_state = root.get_node("GameState")
	item_catalog = root.get_node("ItemCatalog")
	_run.call_deferred()


func _run() -> void:
	game_state.new_game()
	var player := (
		load("res://scenes/player/player.tscn") as PackedScene
	).instantiate()
	root.add_child(player)
	await process_frame

	var checked := 0
	for item_id in item_catalog.items:
		var definition: Dictionary = item_catalog.items[item_id]
		var item_name := str(definition.get("name", item_id))
		var slot: String = item_catalog.equipment_slot(item_name)
		if slot.is_empty():
			continue
		for equipment_slot in game_state.data.equipment:
			game_state.data.equipment[equipment_slot] = ""
		game_state.data.equipment[slot] = item_name
		player._refresh_equipment_visuals()
		await process_frame
		var expected_visual := _expected_visual_name(slot, item_name)
		var visual := player.get_node("Visual").find_child(
			expected_visual, true, false
		) as Node3D
		if visual == null:
			return _fail("%s has no equipped visual." % item_name)
		if visual.get_child_count() == 0:
			return _fail("%s has an empty equipped visual." % item_name)
		if visual.get_parent().name == "EquipmentVisuals":
			return _fail("%s is not attached to an animated body part." % item_name)
		checked += 1

	if checked != 34:
		return _fail("Expected 34 equipment visuals, checked %d." % checked)
	print("ALL EQUIPMENT VISUALS SMOKE PASSED items=%d" % checked)
	quit(0)


func _expected_visual_name(slot: String, item_name: String) -> String:
	match slot:
		"weapon":
			return "EquippedWeapon"
		"shield":
			return "EquippedShield"
		"armor":
			return "EquippedArmor"
		"helmet":
			return "EquippedHelmet"
		"legs":
			return "EquippedLegLeft"
		"gloves":
			return (
				"EquippedCharm"
				if "charm" in item_name.to_lower()
				else "EquippedWeaponGlove"
			)
	return ""


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
