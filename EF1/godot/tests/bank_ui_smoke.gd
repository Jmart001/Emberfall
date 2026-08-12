extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var game_state = root.get_node("GameState")
	game_state.new_game()
	game_state.add_item("Bread", 4, false)
	game_state.add_item("Fishing bait", 12, false)
	game_state.deposit_quantity("Bread", 2)

	var world := (
		load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	).instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	var ui = world.get_node("UI")
	ui.open_bank()
	await process_frame

	var stored_grid: GridContainer = ui.modal.find_child("BankStoredGrid", true, false)
	var pack_grid: GridContainer = ui.modal.find_child("BankPackGrid", true, false)
	var quantity_bar: HBoxContainer = ui.modal.find_child("QuantityBar", true, false)
	var search: LineEdit = ui.modal.find_child("BankSearch", true, false)
	var actions: HBoxContainer = ui.modal.find_child("BankActions", true, false)
	if stored_grid == null or stored_grid.columns != 8:
		return _fail("Bank does not have an eight-column stored-item grid.")
	if stored_grid.get_child_count() < 48:
		return _fail("Bank does not preserve its OSRS-style slot grid.")
	if pack_grid == null or pack_grid.columns != 4 or pack_grid.get_child_count() != 30:
		return _fail("Bank backpack does not show all 30 slots.")
	if quantity_bar == null or quantity_bar.get_child_count() != 6:
		return _fail("Bank quantity modes are incomplete.")
	if quantity_bar.get_child(4).text != "X" or quantity_bar.get_child(5).text != "All":
		return _fail("Bank is missing X or All quantity modes.")
	if search == null or actions == null or actions.get_child_count() != 2:
		return _fail("Bank search or deposit-all controls are missing.")

	var bait_before: int = game_state.item_count("Fishing bait")
	ui.bank_amount = 5
	ui._bank_action("Fishing bait", true)
	if game_state.item_count("Fishing bait") != bait_before - 5:
		return _fail("Bank quantity deposit did not work.")
	ui._bank_action("Fishing bait", false)
	if game_state.item_count("Fishing bait") != bait_before:
		return _fail("Bank quantity withdrawal did not work.")

	var equipped_weapon := str(game_state.data.equipment.weapon)
	if game_state.deposit_all_equipment() <= 0:
		return _fail("Deposit equipment did not move equipped gear.")
	if not str(game_state.data.equipment.weapon).is_empty():
		return _fail("Deposit equipment left the weapon equipped.")
	if int(game_state.data.bank.get(equipped_weapon, 0)) <= 0:
		return _fail("Deposit equipment did not store the weapon.")

	if game_state.INVENTORY_SLOTS != 30:
		return _fail("Inventory capacity does not match the 2D game.")
	print("BANK UI SMOKE PASSED")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
