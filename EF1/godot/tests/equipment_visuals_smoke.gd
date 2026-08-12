extends SceneTree


var game_state: Node


func _initialize() -> void:
	game_state = root.get_node("GameState")
	_run.call_deferred()


func _run() -> void:
	game_state.new_game()
	var player_scene := load("res://scenes/player/player.tscn") as PackedScene
	var player := player_scene.instantiate()
	root.add_child(player)
	await process_frame

	game_state.add_item("Leather body", 1, false)
	if not game_state.equip_item("Leather body"):
		return _fail("Could not equip Leather body.")
	await process_frame

	var equipment_root := player.get_node("Visual/EquipmentVisuals")
	var weapon := player.get_node("Visual").find_child(
		"EquippedWeapon", true, false
	) as Node3D
	if weapon == null:
		return _fail("The equipped Bronze sword is not visible.")
	if weapon.get_parent().name != "arm-right":
		return _fail("The sword is not attached to the animated hand.")
	if not is_equal_approx(weapon.rotation_degrees.x, 90.0):
		return _fail("The sword is not horizontal and pointing away from the face.")
	if not is_equal_approx(weapon.position.y, -0.78):
		return _fail("The sword grip is not positioned at the end of the arm.")
	if not is_equal_approx(weapon.position.x, -0.1):
		return _fail("The sword grip is not positioned away from the body.")
	var resting_transform := weapon.global_transform
	player.play_attack_animation("melee")
	await create_timer(0.16).timeout
	if weapon.global_transform.is_equal_approx(resting_transform):
		return _fail("The sword did not follow the hand during the melee swing.")
	var armor := player.get_node("Visual").find_child(
		"EquippedArmor", true, false
	) as Node3D
	if armor == null:
		return _fail("The equipped Leather body is not visible.")
	if armor.get_parent().name != "torso":
		return _fail("Body armour is not attached to the animated torso.")

	if not game_state.unequip_slot("weapon"):
		return _fail("Could not unequip weapon.")
	if not game_state.unequip_slot("armor"):
		return _fail("Could not unequip armor.")
	await process_frame
	if player.get_node("Visual").find_child("EquippedWeapon", true, false) != null:
		return _fail("Weapon visual remained after unequipping.")
	if player.get_node("Visual").find_child("EquippedArmor", true, false) != null:
		return _fail("Armor visual remained after unequipping.")

	print("EQUIPMENT VISUALS SMOKE PASSED")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
