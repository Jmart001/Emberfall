extends CanvasLayer

const INTRO_QUEST := "a_wanderer_in_greenrest"
const PANEL_COLOR := Color("171b1d")
const PANEL_ALT := Color("22282a")
const BORDER_COLOR := Color("5f5541")
const GOLD := Color("e0b85e")
const TEXT := Color("e9e4d7")
const MUTED := Color("aaa596")
const ITEM_IDS := {
	"Coins": "coins",
	"Bread": "bread",
	"Bronze sword": "sword",
	"Fishing bait": "bait",
	"Fishing rod": "rod",
	"Wooden snare": "snare",
}

var player: CharacterBody3D
var active_tab := "Pack"
var health := 10
var max_health := 10
var prayer := 1
var max_prayer := 1
var run_energy := 100.0
var running := false
var quest_complete := false
var active_prayers := {
	"Burst of Strength": false,
	"Sharp Eye": false,
	"Thick Skin": false,
	"Clarity of Thought": false,
	"Steel Skin": false,
	"Ultimate Strength": false,
	"Protect from Melee": false,
}
var prayer_drain_timer := 0.0
var health_regen_timer := 0.0
var bank_amount := 1
var shop_amount := 1
var skill_make_amount := 1
var current_skill_station := ""
var current_modal_kind := ""
var inventory := {"Coins": 25, "Bread": 3, "Bronze sword": 1}
var skills := {
	"Attack": 1, "Strength": 1, "Defence": 1, "Hitpoints": 10,
	"Ranged": 1, "Magic": 1, "Prayer": 1, "Mining": 1,
	"Smithing": 1, "Fishing": 1, "Cooking": 1, "Woodcutting": 1,
}

var sidebar: PanelContainer
var sidebar_scroll: ScrollContainer
var content: VBoxContainer
var health_bar: Label
var prayer_bar: Label
var energy_bar: Button
var coin_orb: Label
var run_button: Button
var quest_tracker: PanelContainer
var quest_text: Label
var chat_text: RichTextLabel
var chat_panel: Control
var chat_expanded := false
var location_label: Label
var modal: PanelContainer
var modal_content: VBoxContainer
var context_menu: PanelContainer
var context_content: VBoxContainer
var tab_buttons: Dictionary = {}
var inventory_fingerprint := 0
var equipment_fingerprint := 0
var skills_fingerprint := 0
var quest_fingerprint := ""
var action_bar: ProgressBar
var action_elapsed := 0.0
var action_duration := 0.0
var special_button: Button
var xp_drop_root: VBoxContainer
var level_banner: PanelContainer
var level_banner_label: Label
var region_banner: Label
var boss_bar: PanelContainer
var boss_bar_label: Label
var boss_bar_progress: ProgressBar
var status_effect_label: Label
var save_status_label: Label
var death_overlay: ColorRect
var death_text: Label
var level_banner_tween: Tween
var journal_section := "quests"

const QUEST_TITLES := {
	"a_wanderer_in_greenrest": "A Wanderer in Greenrest",
	"shadows_over_pineholt": "Shadows Over Pineholt",
	"beneath_the_ashen_barrow": "Beneath the Ashen Barrow",
	"the_ashwrights_gambit": "The Ashwright's Gambit",
	"the_boar_hunt": "The Boar Hunt",
	"silk_and_cinders": "Silk and Cinders",
	"the_broken_road": "The Broken Road",
	"hearth_and_home": "Hearth and Home",
	"a_cure_for_sablemarsh": "A Cure for Sablemarsh",
}
const QUEST_INFO := {
	"a_wanderer_in_greenrest": {
		"type": "Story", "giver": "Guide Elowen",
		"about": "Learn the roads, shops, gathering, cooking, and combat of Greenrest Vale.",
		"reward": "100 coins; 500 Attack, Fishing, and Cooking XP",
	},
	"shadows_over_pineholt": {
		"type": "Story", "giver": "Captain Rowan",
		"about": "Drive the goblin raiders from Pineholt and recover their hides.",
		"reward": "Pineholt blade and 120 coins",
	},
	"beneath_the_ashen_barrow": {
		"type": "Story", "giver": "Scholar Mira",
		"about": "Open the Ashen Barrow, defeat its Warden, and recover the Ember relic.",
		"reward": "300 coins and 200 Attack XP",
	},
	"the_ashwrights_gambit": {
		"type": "Story", "giver": "King Aldric",
		"about": "Investigate the missing caravans and stop the Ashwright plot.",
		"reward": "400 coins and 250 Attack XP",
	},
	"the_boar_hunt": {
		"type": "Side quest", "giver": "Elder Willow",
		"about": "Cull the wild boars threatening Thornwood.",
		"reward": "Thornwood mantle, 150 coins, Slayer and Cooking XP",
	},
	"silk_and_cinders": {
		"type": "Side quest", "giver": "Scout Vale",
		"about": "Clear the cave spiders nesting along the Barrow route.",
		"reward": "Cave-silk robe, 180 coins, Ember runes, Magic and Slayer XP",
	},
	"the_broken_road": {
		"type": "Side quest", "giver": "Mara",
		"about": "Defeat the bandits cutting off Frostmere's supply road.",
		"reward": "Frostmere buckler, 160 coins, Defence and Slayer XP",
	},
	"hearth_and_home": {
		"type": "Side quest", "giver": "Tamsin",
		"about": "Gather ingredients for Pineholt's celebration feast.",
		"reward": "120 coins, 3 Pineholt stews, Cooking and Farming XP",
	},
	"a_cure_for_sablemarsh": {
		"type": "Side quest", "giver": "Healer Sable",
		"about": "Gather Bog moss to cure the marsh-fever.",
		"reward": "Sablemarsh charm, 2 antidotes, 160 coins, Herblore and Defence XP",
	},
}
const DISCOVERY_REGIONS := [
	"Greenrest Vale", "Pineholt", "Frostmere", "Thornwood",
	"Cinderforge", "Sablemarsh", "Ashfall Wastes",
]
const BESTIARY := {
	"rat": ["Giant rat", "Bones"],
	"goblin": ["Goblin raider", "Bones, Coins, Goblin hide, Wild herb, Ember rune"],
	"wolf": ["Grey wolf", "Bones, Coins, Wild herb"],
	"boar": ["Wild boar", "Bones, Coins, Raw boar meat"],
	"bandit": ["Road bandit", "Coins, Bread, Wild herb"],
	"bogling": ["Bogling", "Bog moss, Coins"],
	"guardian": ["Barrow guardian", "Barrow key, Bones"],
	"skeleton": ["Barrow skeleton", "Bones, Coins"],
	"spider": ["Cave spider", "Cave silk"],
	"warden": ["Ashen Warden", "Ember relic and Barrow chest rewards"],
}
const WorldMapControlClass := preload("res://scripts/ui/world_map_control.gd")
const SHOP_NPC_IDS := ["alaric", "murphy", "corvin", "orin", "torren", "fenwick", "mara"]
const SHOP_TITLES := {
	"general": "Alaric's General Store",
	"fishing": "Murphy's Fishing Supplies",
	"magic": "Corvin's Arcane Wares",
	"hunter": "Orin's Hunting Supplies",
	"smith": "Torren's Mining Tools",
	"mirehaven": "Fenwick - Sablemarsh Supplies",
	"embercross": "Mara - Frostmere Provisions",
}


func _ready() -> void:
	player = get_parent().get_node("Player")
	_sync_from_game_state()
	_capture_state_fingerprints()
	GameState.changed.connect(_on_game_state_changed)
	GameState.xp_gained.connect(_on_xp_gained)
	GameState.save_status.connect(_on_save_status)
	$Title.visible = false
	$Hint.visible = false
	_build_sidebar()
	_build_quest_tracker()
	_build_chat()
	_build_modal()
	_build_context_menu()
	_build_action_bar()
	_build_notifications()
	_refresh_all()
	_log("Welcome to Emberfall.", GOLD)
	_log("You wake on the road outside Greenrest Vale.", TEXT)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_R:
			_toggle_run()
		elif event.keycode == KEY_M:
			open_world_map()
		elif event.keycode == KEY_G:
			open_wiki()
		elif event.keycode == KEY_K:
			_toggle_sound()
		elif event.keycode == KEY_C:
			_read_current_tile()
		elif event.keycode == KEY_ESCAPE:
			_close_active_interface()
		elif event.keycode == KEY_S and event.ctrl_pressed:
			_manual_save()


func _process(delta: float) -> void:
	_update_location_readout()
	if action_duration > 0.0:
		action_elapsed += delta
		action_bar.value = minf(100.0, action_elapsed / action_duration * 100.0)
		if action_elapsed >= action_duration:
			action_duration = 0.0
			action_bar.visible = false
	if player == null:
		return
	if running and not player.has_reached_target():
		run_energy = maxf(0.0, run_energy - delta * 5.0)
		if run_energy <= 0.0:
			running = false
			player.movement_speed = 4.5
			_log("You are out of run energy.", Color("dc806f"))
			_refresh_run()
	elif not running or player.has_reached_target():
		run_energy = minf(100.0, run_energy + delta * 1.4)
	energy_bar.text = "RUN\n%d%%" % floori(run_energy)
	if active_prayers.values().has(true):
		prayer_drain_timer += delta
		if prayer_drain_timer >= 6.0:
			prayer_drain_timer = 0.0
			prayer = maxi(0, prayer - 1)
			GameState.data.prayer = prayer
			GameState.save_game()
			prayer_bar.text = "PRAY\n%d/%d" % [prayer, max_prayer]
			if prayer == 0:
				for prayer_name in active_prayers:
					active_prayers[prayer_name] = false
				GameState.data.active_prayer = ""
				GameState.mark_dirty()
				_log("You have run out of Prayer points.", Color("dc806f"))
				if active_tab == "Prayer":
					_refresh_content()
func complete_intro_quest() -> void:
	if GameState.quest_stage(INTRO_QUEST) != "return":
		return
	GameState.complete_quest(INTRO_QUEST)
	_log("Quest complete: A Wanderer in Greenrest.", GOLD)
	_log(
		"Reward: 100 coins and 500 Attack, Fishing, and Cooking XP.",
		Color("8bcf8b")
	)


func accept_intro_quest() -> void:
	GameState.accept_quest(INTRO_QUEST)
	_log("Quest started: A Wanderer in Greenrest.", GOLD)


func open_shop(shop_role: String) -> void:
	var shop_id := _shop_id_for_role(shop_role)
	_clear_modal(str(SHOP_TITLES.get(shop_id, "Shop")))
	_size_and_center_modal(Vector2(620.0, 600.0))
	_add_quantity_bar(false, shop_role)

	var coin_meta := Label.new()
	coin_meta.name = "ShopCoinBalance"
	coin_meta.text = "You have %d coins" % GameState.item_count("Coins")
	coin_meta.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	coin_meta.add_theme_color_override("font_color", MUTED)
	modal_content.add_child(coin_meta)

	var buy_title := Label.new()
	buy_title.text = "For sale - click to buy"
	buy_title.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(buy_title)
	var buy_grid := GridContainer.new()
	buy_grid.name = "ShopBuyGrid"
	buy_grid.columns = 8
	buy_grid.add_theme_constant_override("h_separation", 5)
	buy_grid.add_theme_constant_override("v_separation", 5)
	modal_content.add_child(buy_grid)
	for entry in ItemCatalog.shops.get(shop_id, []):
		var item_name := ItemCatalog.display_name(str(entry[0]))
		var price := int(entry[1])
		buy_grid.add_child(
			_make_shop_slot(item_name, price, 0, true, shop_role)
		)

	var sell_title := Label.new()
	sell_title.text = "Your backpack - click to sell"
	sell_title.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(sell_title)
	var sell_grid := GridContainer.new()
	sell_grid.name = "ShopSellGrid"
	sell_grid.columns = 8
	sell_grid.add_theme_constant_override("h_separation", 5)
	sell_grid.add_theme_constant_override("v_separation", 5)
	modal_content.add_child(sell_grid)
	var saleable_count := 0
	for item_name in GameState.data.inventory.keys():
		var quantity := GameState.item_count(item_name)
		var base_value := int(ItemCatalog.item(item_name).get("value", 0))
		if quantity <= 0 or base_value <= 0:
			continue
		var sell_price := maxi(1, int(base_value * 0.6))
		sell_grid.add_child(
			_make_shop_slot(
				item_name,
				sell_price,
				quantity,
				false,
				shop_role
			)
		)
		saleable_count += 1
	if saleable_count == 0:
		var empty := Label.new()
		empty.text = "Nothing worth selling."
		empty.add_theme_color_override("font_color", MUTED)
		sell_grid.add_child(empty)
	_add_modal_close()
	modal.visible = true


func _make_shop_slot(
	item_name: String,
	price: int,
	quantity: int,
	buying: bool,
	shop_role: String
) -> Control:
	var slot := Button.new()
	slot.custom_minimum_size = Vector2(64.0, 64.0)
	slot.tooltip_text = (
		"%s - %d coins each" % [item_name, price]
		if buying
		else "%s x%d - %d coins each" % [item_name, quantity, price]
	)
	slot.add_theme_stylebox_override("normal", _panel_style(Color("171610")))
	slot.add_theme_stylebox_override("hover", _panel_style(Color("2d291e")))

	var image := TextureRect.new()
	image.set_anchors_and_offsets_preset(
		Control.PRESET_FULL_RECT,
		Control.PRESET_MODE_MINSIZE,
		8
	)
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	image.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var icon_path := ItemCatalog.icon_path(item_name)
	if ResourceLoader.exists(icon_path):
		image.texture = load(icon_path)
	slot.add_child(image)

	if not buying and quantity > 1:
		var amount := Label.new()
		amount.text = str(quantity)
		amount.position = Vector2(5.0, 2.0)
		amount.add_theme_font_size_override("font_size", 11)
		amount.add_theme_color_override("font_color", TEXT)
		amount.mouse_filter = Control.MOUSE_FILTER_IGNORE
		slot.add_child(amount)

	var price_label := Label.new()
	price_label.text = "%dgp" % price
	price_label.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	price_label.position = Vector2(-43.0, -19.0)
	price_label.size = Vector2(40.0, 17.0)
	price_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	price_label.add_theme_font_size_override("font_size", 10)
	price_label.add_theme_color_override("font_color", GOLD)
	price_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	slot.add_child(price_label)
	if buying:
		slot.pressed.connect(_buy_item.bind(item_name, price, shop_role))
	else:
		slot.pressed.connect(_sell_item.bind(item_name, price, shop_role))
	return slot


func open_bank() -> void:
	_clear_modal("BANK OF EMBERFALL")
	_size_and_center_modal(Vector2(790.0, 650.0))
	_add_quantity_bar(true, "")

	var meta := Label.new()
	meta.text = "Bank %d items  |  Backpack %d/30" % [
		GameState.data.bank.size(),
		GameState.used_inventory_slots(),
	]
	meta.add_theme_color_override("font_color", MUTED)
	modal_content.add_child(meta)

	var search := LineEdit.new()
	search.name = "BankSearch"
	search.placeholder_text = "Search bank"
	search.clear_button_enabled = true
	modal_content.add_child(search)

	var body := HBoxContainer.new()
	body.name = "BankBody"
	body.add_theme_constant_override("separation", 14)
	modal_content.add_child(body)

	var stored_column := VBoxContainer.new()
	stored_column.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	body.add_child(stored_column)
	var bank_title := Label.new()
	bank_title.text = "Stored items - click to withdraw"
	bank_title.add_theme_color_override("font_color", GOLD)
	stored_column.add_child(bank_title)
	var bank_grid := GridContainer.new()
	bank_grid.name = "BankStoredGrid"
	bank_grid.columns = 8
	bank_grid.add_theme_constant_override("h_separation", 4)
	bank_grid.add_theme_constant_override("v_separation", 4)
	stored_column.add_child(bank_grid)
	var bank_items: Array = GameState.data.bank.keys()
	bank_items.sort_custom(func(a, b): return str(a).naturalnocasecmp_to(str(b)) < 0)
	for item_name in bank_items:
		var quantity := int(GameState.data.bank[item_name])
		if quantity > 0:
			bank_grid.add_child(_make_bank_slot(item_name, quantity, false))
	for index in range(maxi(0, 48 - bank_grid.get_child_count())):
		bank_grid.add_child(_make_empty_bank_slot())

	var pack_column := VBoxContainer.new()
	pack_column.custom_minimum_size.x = 224.0
	body.add_child(pack_column)
	var inventory_title := Label.new()
	inventory_title.text = "Backpack - click to deposit"
	inventory_title.add_theme_color_override("font_color", GOLD)
	pack_column.add_child(inventory_title)
	var pack_grid := GridContainer.new()
	pack_grid.name = "BankPackGrid"
	pack_grid.columns = 4
	pack_grid.add_theme_constant_override("h_separation", 4)
	pack_grid.add_theme_constant_override("v_separation", 4)
	pack_column.add_child(pack_grid)
	for item_name in GameState.data.inventory.keys():
		var quantity := int(GameState.data.inventory[item_name])
		if quantity > 0:
			pack_grid.add_child(_make_bank_slot(item_name, quantity, true))
	for index in range(maxi(0, 30 - pack_grid.get_child_count())):
		pack_grid.add_child(_make_empty_bank_slot())

	search.text_changed.connect(
		func(query: String):
			var normalized := query.strip_edges().to_lower()
			for slot in bank_grid.get_children():
				var slot_item := str(slot.get_meta("item_name", ""))
				slot.visible = (
					normalized.is_empty()
					or (not slot_item.is_empty() and normalized in slot_item.to_lower())
				)
	)

	var actions := HBoxContainer.new()
	actions.name = "BankActions"
	var deposit_pack := Button.new()
	deposit_pack.text = "Deposit backpack"
	deposit_pack.tooltip_text = "Deposit every item in your backpack"
	deposit_pack.pressed.connect(_deposit_all_bank_inventory)
	actions.add_child(deposit_pack)
	var deposit_gear := Button.new()
	deposit_gear.text = "Deposit equipment"
	deposit_gear.tooltip_text = "Deposit all worn and held equipment"
	deposit_gear.pressed.connect(_deposit_all_bank_equipment)
	actions.add_child(deposit_gear)
	modal_content.add_child(actions)
	_add_modal_close()
	modal.visible = true


func open_npc_context(
	target: Node3D,
	screen_position: Vector2,
	talk_action: Callable,
	special_action: Callable,
	pickpocket_action: Callable,
	walk_action: Callable
) -> void:
	for child in context_content.get_children():
		child.queue_free()
	var title := Label.new()
	title.text = "Choose option: %s" % target.display_name
	title.add_theme_color_override("font_color", GOLD)
	context_content.add_child(title)
	_add_context_button("Talk-to %s" % target.display_name, talk_action)
	var role := str(target.get("role")).to_lower()
	if str(target.get("npc_id")) in SHOP_NPC_IDS:
		_add_context_button("Trade %s" % target.display_name, special_action)
	elif "bank" in role:
		_add_context_button("Bank %s" % target.display_name, special_action)
	elif "developer" in role:
		_add_context_button("Open test tools", special_action)
	elif str(target.get("npc_id")) == "bren":
		_add_context_button("Slayer contract", special_action)
	if "developer" not in role:
		_add_context_button("Pickpocket %s" % target.display_name, pickpocket_action)
	_add_context_button("Walk here", walk_action)
	_add_context_button(
		"Examine %s" % target.display_name,
		func():
			show_game_message(
				"%s, %s." % [target.display_name, target.get("role")],
				GOLD
			)
	)
	_add_context_button("Cancel", Callable())
	var viewport_size := get_viewport().get_visible_rect().size
	context_menu.position = Vector2(
		clampf(screen_position.x, 4.0, viewport_size.x - 505.0),
		clampf(screen_position.y, 4.0, viewport_size.y - 220.0)
	)
	context_menu.visible = true


func close_context_menu() -> void:
	context_menu.visible = false


func open_object_context(
	target: Node3D,
	screen_position: Vector2,
	action: Callable,
	walk_action: Callable
) -> void:
	for child in context_content.get_children():
		child.queue_free()
	var title := Label.new()
	title.text = "Choose option: %s" % target.display_name
	title.add_theme_color_override("font_color", GOLD)
	context_content.add_child(title)
	_add_context_button(
		"%s %s" % [target.action_label, target.display_name],
		action
	)
	_add_context_button("Walk here", walk_action)
	_add_context_button(
		"Examine %s" % target.display_name,
		func(): show_game_message(
			"A developer resource used to test %s." % target.action_label,
			GOLD
		)
	)
	_add_context_button("Cancel", Callable())
	var viewport_size := get_viewport().get_visible_rect().size
	context_menu.position = Vector2(
		clampf(screen_position.x, 4.0, viewport_size.x - 505.0),
		clampf(screen_position.y, 4.0, viewport_size.y - 220.0)
	)
	context_menu.visible = true


func open_enemy_context(
	target: Node3D,
	screen_position: Vector2,
	attack_action: Callable,
	walk_action: Callable
) -> void:
	for child in context_content.get_children():
		child.queue_free()
	var title := Label.new()
	title.text = "Choose option: %s" % target.display_name
	title.add_theme_color_override("font_color", GOLD)
	context_content.add_child(title)
	_add_context_button(
		"Attack %s" % target.display_name,
		attack_action
	)
	_add_context_button("Walk here", walk_action)
	_add_context_button(
		"Examine %s" % target.display_name,
		func(): show_game_message(
			"%s: %d Hitpoints, maximum hit %d." % [
				target.display_name,
				target.max_health,
				target.max_hit,
			],
			GOLD
		)
	)
	_add_context_button("Cancel", Callable())
	var viewport_size := get_viewport().get_visible_rect().size
	context_menu.position = Vector2(
		clampf(screen_position.x, 4.0, viewport_size.x - 505.0),
		clampf(screen_position.y, 4.0, viewport_size.y - 220.0)
	)
	context_menu.visible = true


func show_game_message(message: String, color := TEXT) -> void:
	_log(message, color)


func show_action_progress(duration: float) -> void:
	action_duration = maxf(0.05, duration)
	action_elapsed = 0.0
	action_bar.value = 0.0
	action_bar.visible = true


func combat_defence_bonus() -> int:
	var defence := int(GameState.equipment_bonuses().defence)
	if active_prayers["Thick Skin"]:
		defence += 2
	elif active_prayers["Steel Skin"]:
		defence += 5
	return defence


func combat_accuracy_bonus() -> int:
	if active_prayers["Clarity of Thought"]:
		return 4
	if active_prayers["Sharp Eye"]:
		return 2
	return 0


func combat_damage_bonus() -> int:
	if active_prayers["Ultimate Strength"]:
		return 5
	if active_prayers["Burst of Strength"]:
		return 2
	return 0


func reduce_melee_damage(amount: int) -> int:
	return ceili(amount / 2.0) if active_prayers["Protect from Melee"] else amount


func show_click(screen_position: Vector2, is_action: bool) -> void:
	var marker := Label.new()
	marker.text = "X"
	marker.mouse_filter = Control.MOUSE_FILTER_IGNORE
	marker.position = screen_position - Vector2(9.0, 15.0)
	marker.size = Vector2(22.0, 30.0)
	marker.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	marker.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	marker.add_theme_font_size_override("font_size", 23)
	marker.add_theme_color_override(
		"font_color",
		Color("dc4138") if is_action else Color("f0d04f")
	)
	marker.add_theme_color_override("font_outline_color", Color("17140f"))
	marker.add_theme_constant_override("outline_size", 3)
	add_child(marker)
	var tween := create_tween()
	tween.tween_interval(0.2)
	tween.tween_property(marker, "modulate:a", 0.0, 0.22)
	tween.tween_callback(marker.queue_free)


func show_damage_number(screen_position: Vector2, amount: int) -> void:
	var label := Label.new()
	label.text = str(amount)
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.position = screen_position - Vector2(24.0, 18.0)
	label.size = Vector2(48.0, 32.0)
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 24)
	label.add_theme_color_override(
		"font_color",
		Color("dc4138") if amount > 0 else Color("d5d0bd")
	)
	label.add_theme_color_override("font_outline_color", Color("17140f"))
	label.add_theme_constant_override("outline_size", 4)
	add_child(label)
	var tween := create_tween()
	tween.tween_property(label, "position:y", label.position.y - 34.0, 0.65)
	tween.parallel().tween_property(label, "modulate:a", 0.0, 0.65)
	tween.tween_callback(label.queue_free)


func _build_sidebar() -> void:
	sidebar = PanelContainer.new()
	sidebar.anchor_left = 1.0
	sidebar.anchor_top = 0.0
	sidebar.anchor_right = 1.0
	sidebar.anchor_bottom = 1.0
	sidebar.offset_left = -285.0
	sidebar.offset_right = 0.0
	sidebar.offset_top = 0.0
	sidebar.offset_bottom = 0.0
	sidebar.custom_minimum_size.x = 285.0
	sidebar.clip_contents = true
	var sidebar_style := StyleBoxFlat.new()
	sidebar_style.bg_color = Color("201c15")
	sidebar_style.border_width_left = 3
	sidebar_style.border_color = Color("8a7040")
	sidebar.add_theme_stylebox_override("panel", sidebar_style)
	add_child(sidebar)
	var shell := VBoxContainer.new()
	shell.add_theme_constant_override("separation", 0)
	sidebar.add_child(shell)

	var brand_panel := PanelContainer.new()
	brand_panel.custom_minimum_size.y = 76.0
	var brand_style := StyleBoxFlat.new()
	brand_style.bg_color = Color("18150f")
	brand_style.border_width_bottom = 2
	brand_style.border_color = Color("735d36")
	brand_panel.add_theme_stylebox_override("panel", brand_style)
	shell.add_child(brand_panel)
	var brand := VBoxContainer.new()
	brand.alignment = BoxContainer.ALIGNMENT_CENTER
	brand_panel.add_child(brand)
	var title := Label.new()
	title.text = "EMBERFALL"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 25)
	title.add_theme_color_override("font_color", GOLD)
	brand.add_child(title)
	var chapter := Label.new()
	chapter.text = "CHAPTER ONE"
	chapter.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	chapter.add_theme_color_override("font_color", MUTED)
	brand.add_child(chapter)

	var vitals := GridContainer.new()
	vitals.columns = 5
	vitals.add_theme_constant_override("h_separation", 5)
	vitals.add_theme_constant_override("v_separation", 5)
	var vitals_panel := PanelContainer.new()
	var vitals_style := StyleBoxFlat.new()
	vitals_style.bg_color = Color("201c15")
	vitals_style.border_width_bottom = 1
	vitals_style.border_color = Color("5e4b2b")
	vitals_style.content_margin_left = 9.0
	vitals_style.content_margin_top = 9.0
	vitals_style.content_margin_right = 9.0
	vitals_style.content_margin_bottom = 9.0
	vitals_panel.add_theme_stylebox_override("panel", vitals_style)
	shell.add_child(vitals_panel)
	vitals_panel.add_child(vitals)
	health_bar = _make_status_label(Color("ef7770"))
	coin_orb = _make_status_label(Color("edc45f"))
	prayer_bar = _make_status_label(Color("d8d4ff"))
	energy_bar = _make_status_button()
	run_button = energy_bar
	energy_bar.pressed.connect(_toggle_run)
	vitals.add_child(health_bar)
	vitals.add_child(coin_orb)
	vitals.add_child(prayer_bar)
	vitals.add_child(energy_bar)
	special_button = _make_status_button()
	special_button.toggle_mode = true
	special_button.tooltip_text = "Arm special attack (costs 50%)"
	special_button.pressed.connect(_toggle_special)
	vitals.add_child(special_button)

	var tabs := HBoxContainer.new()
	tabs.clip_contents = true
	tabs.add_theme_constant_override("separation", 1)
	shell.add_child(tabs)
	var tab_icons := {
		"Pack": "🎒",
		"Skills": "📊",
		"Gear": "⚔",
		"Prayer": "✦",
		"Journal": "📖",
	}
	for tab_name in ["Pack", "Skills", "Gear", "Prayer", "Journal"]:
		var button := Button.new()
		button.text = "%s\n%s" % [tab_icons[tab_name], tab_name]
		button.custom_minimum_size = Vector2(0.0, 52.0)
		button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		button.clip_text = true
		button.add_theme_font_size_override("font_size", 10)
		button.add_theme_color_override("font_color", Color("9d8c63"))
		button.add_theme_color_override("font_pressed_color", Color("f1cc70"))
		button.add_theme_stylebox_override(
			"normal", _nav_style(Color("201c15"), false)
		)
		button.add_theme_stylebox_override(
			"hover", _nav_style(Color("2a2418"), false)
		)
		button.add_theme_stylebox_override(
			"pressed", _nav_style(Color("352e21"), true)
		)
		button.toggle_mode = true
		button.pressed.connect(_select_tab.bind(tab_name))
		tabs.add_child(button)
		tab_buttons[tab_name] = button

	sidebar_scroll = ScrollContainer.new()
	sidebar_scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL
	sidebar_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	shell.add_child(sidebar_scroll)
	var panel_margin := MarginContainer.new()
	panel_margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	panel_margin.add_theme_constant_override("margin_left", 12)
	panel_margin.add_theme_constant_override("margin_top", 12)
	panel_margin.add_theme_constant_override("margin_right", 12)
	panel_margin.add_theme_constant_override("margin_bottom", 12)
	sidebar_scroll.add_child(panel_margin)
	content = VBoxContainer.new()
	content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.clip_contents = true
	content.add_theme_constant_override("separation", 7)
	panel_margin.add_child(content)

	var admin_button := Button.new()
	admin_button.name = "TopAdminButton"
	admin_button.text = "Admin"
	admin_button.anchor_left = 1.0
	admin_button.anchor_right = 1.0
	admin_button.offset_left = -377.0
	admin_button.offset_right = -297.0
	admin_button.offset_top = 12.0
	admin_button.offset_bottom = 44.0
	admin_button.pressed.connect(open_developer_tools)
	add_child(admin_button)
	var map_button := Button.new()
	map_button.name = "TopMapButton"
	map_button.text = "Map"
	map_button.position = Vector2(12.0, 12.0)
	map_button.custom_minimum_size = Vector2(70.0, 32.0)
	map_button.tooltip_text = "Open world map (M)"
	map_button.pressed.connect(open_world_map)
	add_child(map_button)
	var save_button := Button.new()
	save_button.name = "TopSaveButton"
	save_button.text = "Save"
	save_button.position = Vector2(88.0, 12.0)
	save_button.custom_minimum_size = Vector2(70.0, 32.0)
	save_button.pressed.connect(_manual_save)
	add_child(save_button)
	var settings_button := Button.new()
	settings_button.name = "TopSettingsButton"
	settings_button.text = "Settings"
	settings_button.position = Vector2(246.0, 12.0)
	settings_button.custom_minimum_size = Vector2(82.0, 32.0)
	settings_button.pressed.connect(_open_settings)
	add_child(settings_button)
	var wiki_button := Button.new()
	wiki_button.name = "WikiButton"
	wiki_button.text = "Wiki"
	wiki_button.position = Vector2(164.0, 12.0)
	wiki_button.custom_minimum_size = Vector2(76.0, 32.0)
	wiki_button.tooltip_text = "Open the game wiki (G)"
	wiki_button.pressed.connect(open_wiki)
	add_child(wiki_button)
	for top_button in [
		admin_button, map_button, save_button, settings_button, wiki_button,
	]:
		top_button.visible = false


func open_world_map() -> void:
	_clear_modal("MAP OF EMBERFALL")
	current_modal_kind = "map"
	_size_and_center_modal(Vector2(760.0, 650.0))
	var modal_scroll := modal.get_child(0) as ScrollContainer
	modal_scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	modal_scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	var world := get_parent()
	var tile := Vector2i.ZERO
	if world.logical_grid != null:
		tile = world.logical_grid.world_to_tile(world.player.global_position)
	var toolbar := HBoxContainer.new()
	modal_content.add_child(toolbar)
	var location := Label.new()
	location.text = "You: %d, %d" % [tile.x, tile.y]
	location.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	toolbar.add_child(location)
	var map_control = WorldMapControlClass.new()
	map_control.name = "WorldMapControl"
	map_control.custom_minimum_size = Vector2(
		maxf(320.0, modal.size.x - 40.0),
		maxf(260.0, modal.size.y - 165.0)
	)
	map_control.size_flags_vertical = Control.SIZE_EXPAND_FILL
	map_control.set_player_tile(tile)
	var quest_tiles: Array[Vector2] = []
	var selected_quest_id := _selected_quest_id()
	var objective_set := false
	for marker in world.find_children("QuestMarker", "Label3D", true, false):
		var target := marker.get_parent() as Node3D
		if target != null:
			var marker_tile: Vector2i = world.logical_grid.world_to_tile(
				target.global_position
			)
			quest_tiles.append(Vector2(marker_tile))
			if str(marker.get_meta("quest_id", "")) == selected_quest_id:
				map_control.set_objective_tile(marker_tile)
				objective_set = true
	if not objective_set and selected_quest_id == INTRO_QUEST:
		var intro_marker: Node = world.elowen.get_node_or_null("Marker")
		if intro_marker != null and intro_marker.visible:
			map_control.set_objective_tile(world.ELOWEN_TILE)
	map_control.set_quest_tiles(quest_tiles)
	map_control.cursor_changed.connect(func(value: String): location.text = value if not value.is_empty() else "You: %d, %d" % [tile.x, tile.y])
	for label_text in ["-", "+", "Recenter"]:
		var button := Button.new()
		button.text = label_text
		if label_text == "-":
			button.pressed.connect(func(): map_control.zoom_by(0.8))
		elif label_text == "+":
			button.pressed.connect(func(): map_control.zoom_by(1.25))
		else:
			button.pressed.connect(map_control.recenter)
		toolbar.add_child(button)
	var home := Button.new()
	home.name = "MapHomeButton"
	home.text = "Home"
	home.tooltip_text = "Home teleport [H]"
	home.pressed.connect(
		func():
			modal.visible = false
			world._home_teleport()
	)
	toolbar.add_child(home)
	var close := Button.new()
	close.name = "MapCloseButton"
	close.text = "X"
	close.tooltip_text = "Close map"
	close.pressed.connect(func(): modal.visible = false)
	toolbar.add_child(close)
	modal_content.add_child(map_control)
	var hint := Label.new()
	hint.text = (
		"Drag to pan. Mouse wheel: zoom. Red/white: you. "
		+ "Pulsing orange: current objective."
	)
	hint.add_theme_color_override("font_color", MUTED)
	modal_content.add_child(hint)
	modal.visible = true


func open_wiki() -> void:
	_clear_modal("EMBERFALL WIKI")
	_size_and_center_modal(Vector2(760.0, 650.0))
	var search := LineEdit.new()
	search.name = "WikiSearch"
	search.placeholder_text = "Search items..."
	search.clear_button_enabled = true
	modal_content.add_child(search)
	var status := Label.new()
	status.name = "WikiStatus"
	status.add_theme_color_override("font_color", MUTED)
	modal_content.add_child(status)
	var grid := GridContainer.new()
	grid.name = "WikiItemGrid"
	grid.columns = 6
	grid.add_theme_constant_override("h_separation", 6)
	grid.add_theme_constant_override("v_separation", 6)
	modal_content.add_child(grid)
	search.text_changed.connect(_filter_wiki_items.bind(grid, status))
	_filter_wiki_items("", grid, status)
	_add_modal_close()
	modal.visible = true


func _filter_wiki_items(
	query: String,
	grid: GridContainer,
	status: Label
) -> void:
	for child in grid.get_children():
		child.queue_free()
	var names: Array[String] = []
	var lowered := query.strip_edges().to_lower()
	for item_id in ItemCatalog.items:
		var item_name := ItemCatalog.display_name(str(item_id))
		if lowered.is_empty() or lowered in item_name.to_lower():
			names.append(item_name)
	names.sort()
	status.text = "Items (%d of %d)" % [names.size(), ItemCatalog.items.size()]
	for item_name in names:
		var button := Button.new()
		button.custom_minimum_size = Vector2(108.0, 64.0)
		button.text = item_name
		button.tooltip_text = "View %s" % item_name
		button.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
		var icon_path := ItemCatalog.icon_path(item_name)
		if ResourceLoader.exists(icon_path):
			button.icon = load(icon_path)
		button.pressed.connect(_open_wiki_item.bind(item_name))
		grid.add_child(button)


func _open_wiki_item(item_name: String) -> void:
	var definition := ItemCatalog.item(item_name)
	var item_id := ItemCatalog.id_for_name(item_name)
	_clear_modal(item_name.to_upper())
	_size_and_center_modal(Vector2(620.0, 560.0))
	var top := HBoxContainer.new()
	modal_content.add_child(top)
	var icon := TextureRect.new()
	icon.custom_minimum_size = Vector2(72.0, 72.0)
	icon.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	icon.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	var icon_path := ItemCatalog.icon_path(item_name)
	if ResourceLoader.exists(icon_path):
		icon.texture = load(icon_path)
	top.add_child(icon)
	var identity := Label.new()
	identity.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	identity.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	identity.text = "%s\n%s" % [
		_wiki_item_type(definition),
		"Stackable" if ItemCatalog.is_stackable(item_name) else "Not stackable",
	]
	top.add_child(identity)
	var details: Array[String] = []
	for property in ["attack", "ranged", "magic", "defence"]:
		if definition.has(property):
			details.append(
				"%s bonus: +%d" % [
					property.capitalize(),
					int(definition[property]),
				]
			)
	if definition.has("heal"):
		details.append("Heals: %d Hitpoints" % int(definition.heal))
	if definition.has("energy"):
		details.append("Restores: %d%% run energy" % int(definition.energy))
	if definition.has("cure"):
		details.append("Cures poison")
	if definition.has("speed"):
		details.append("Attack speed: %d ticks" % int(definition.speed))
	if definition.has("req"):
		details.append(
			"Requires: level %d %s" % [
				int(definition.req),
				str(definition.get("reqSkill", "Attack")),
			]
		)
	details.append("Value: %d coins" % int(definition.get("value", 0)))
	var stats := Label.new()
	stats.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	stats.text = "\n".join(details)
	modal_content.add_child(stats)
	var source_title := Label.new()
	source_title.text = "OBTAIN"
	source_title.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(source_title)
	var sources := _wiki_item_sources(item_id)
	var source_text := Label.new()
	source_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	source_text.text = (
		"\n".join(sources)
		if not sources.is_empty()
		else "Made through a skill or awarded by a quest."
	)
	modal_content.add_child(source_text)
	var back := Button.new()
	back.text = "Back to items"
	back.pressed.connect(open_wiki)
	modal_content.add_child(back)
	_add_modal_close()
	modal.visible = true


func _wiki_item_type(definition: Dictionary) -> String:
	if definition.has("attack"):
		return "Melee weapon"
	if definition.has("ranged"):
		return "Ranged weapon"
	if definition.has("magic"):
		return "Magic weapon"
	match str(definition.get("slot", "")):
		"armor":
			return "Body armour"
		"shield":
			return "Shield"
		"gloves":
			return "Gloves"
	if definition.has("heal"):
		return "Food"
	if definition.has("energy") or definition.has("cure"):
		return "Potion"
	return "Item"


func _wiki_item_sources(item_id: String) -> Array[String]:
	var sources: Array[String] = []
	for shop_id in ItemCatalog.shops:
		for entry in ItemCatalog.shops[shop_id]:
			if str(entry[0]) == item_id:
				sources.append(
					"Sold by %s for %d coins." % [
						str(SHOP_TITLES.get(shop_id, shop_id)),
						int(entry[1]),
					]
				)
	var world := get_parent()
	if world != null and world.get("renderer") != null:
		var monsters: Dictionary = world.renderer.world_data.get(
			"monster_types",
			{}
		)
		for monster_id in monsters:
			var monster: Dictionary = monsters[monster_id]
			for drop in monster.get("drops", []):
				if str(drop[0]) == item_id:
					sources.append("Dropped by %s." % str(monster.name))
	return sources


func _open_settings() -> void:
	_clear_modal("SETTINGS")
	var controls := Label.new()
	controls.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	controls.text = (
		"Map: M\nRun: R or RUN orb\nHome teleport: H\n"
		+ "Rotate and pitch: Arrow keys\nZoom: Mouse wheel\n"
		+ "Cancel: Escape"
	)
	modal_content.add_child(controls)
	_add_modal_close()
	modal.visible = true


func _build_quest_tracker() -> void:
	quest_tracker = PanelContainer.new()
	quest_tracker.position = Vector2(8.0, 8.0)
	quest_tracker.custom_minimum_size = Vector2(280.0, 74.0)
	quest_tracker.mouse_filter = Control.MOUSE_FILTER_IGNORE
	quest_tracker.add_theme_stylebox_override(
		"panel", _panel_style(Color("171b1db3"))
	)
	add_child(quest_tracker)
	quest_text = Label.new()
	quest_text.mouse_filter = Control.MOUSE_FILTER_IGNORE
	quest_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	quest_text.add_theme_color_override("font_color", TEXT)
	quest_tracker.add_child(quest_text)


func _build_chat() -> void:
	chat_panel = Control.new()
	chat_panel.name = "BottomHUD"
	chat_panel.anchor_top = 1.0
	chat_panel.anchor_right = 1.0
	chat_panel.anchor_bottom = 1.0
	chat_panel.offset_right = -285.0
	chat_panel.offset_top = -168.0
	add_child(chat_panel)

	var utility := Control.new()
	utility.name = "BottomToolbar"
	utility.set_anchors_preset(Control.PRESET_TOP_WIDE)
	utility.offset_bottom = 62.0
	chat_panel.add_child(utility)

	var location_box := PanelContainer.new()
	location_box.position = Vector2(8.0, 3.0)
	location_box.size = Vector2(122.0, 56.0)
	location_box.add_theme_stylebox_override("panel", _hud_box_style(Color("66522d")))
	utility.add_child(location_box)
	location_label = Label.new()
	location_label.name = "LocationReadout"
	location_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	location_label.add_theme_font_size_override("font_size", 12)
	location_label.add_theme_color_override("font_color", Color("e3c776"))
	location_box.add_child(location_label)

	var info_actions := HBoxContainer.new()
	info_actions.position = Vector2(140.0, 28.0)
	info_actions.add_theme_constant_override("separation", 5)
	utility.add_child(info_actions)
	_add_info_action(info_actions, "Characters", _open_characters, "Open character equipment")
	_add_info_action(info_actions, "Admin", open_developer_tools, "Open admin tools")
	_add_info_action(info_actions, "Wiki", open_wiki, "Open the game wiki")
	_add_info_action(info_actions, "Settings", _open_settings, "Open settings")

	var hotkeys := HBoxContainer.new()
	hotkeys.name = "HotkeyStrip"
	hotkeys.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	hotkeys.position = Vector2(-522.0, -34.0)
	hotkeys.size = Vector2(514.0, 29.0)
	hotkeys.add_theme_constant_override("separation", 6)
	utility.add_child(hotkeys)
	_add_hotkey_action(hotkeys, "Map", "M", open_world_map, "Open the world map")
	_add_hotkey_action(hotkeys, "Wiki", "G", open_wiki, "Open the game wiki")
	_add_hotkey_action(hotkeys, "Run", "R", _toggle_run, "Toggle running")
	_add_hotkey_action(hotkeys, "Home", "H", _home_teleport, "Teleport home")
	_add_hotkey_action(hotkeys, "Sound", "K", _toggle_sound, "Toggle sound")
	_add_hotkey_action(hotkeys, "Tile reader", "C", _read_current_tile, "Report the current tile")
	_add_hotkey_action(hotkeys, "Cancel", "Esc", _close_active_interface, "Close the interface")
	_add_hotkey_action(hotkeys, "Save", "Ctrl+S", _manual_save, "Save the game")

	var chat_box := PanelContainer.new()
	chat_box.name = "ChatConsole"
	chat_box.anchor_right = 1.0
	chat_box.anchor_bottom = 1.0
	chat_box.offset_top = 62.0
	chat_box.add_theme_stylebox_override("panel", _chat_console_style())
	chat_panel.add_child(chat_box)
	var expand := Button.new()
	expand.name = "ChatExpandButton"
	expand.text = "^"
	expand.tooltip_text = "Expand chat history"
	expand.anchor_left = 1.0
	expand.anchor_right = 1.0
	expand.position = Vector2(-34.0, 2.0)
	expand.size = Vector2(26.0, 23.0)
	expand.pressed.connect(_toggle_chat_expanded)
	chat_box.add_child(expand)

	chat_text = RichTextLabel.new()
	chat_text.name = "ChatLog"
	chat_text.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	chat_text.offset_left = 17.0
	chat_text.offset_top = 12.0
	chat_text.offset_right = -36.0
	chat_text.offset_bottom = -8.0
	chat_text.bbcode_enabled = true
	chat_text.scroll_following = true
	chat_text.fit_content = false
	chat_text.scroll_active = true
	chat_text.add_theme_font_size_override("normal_font_size", 14)
	chat_box.add_child(chat_text)
	_update_location_readout()


func _add_info_action(
	parent: Container,
	label_text: String,
	action: Callable,
	help_text: String
) -> void:
	var button := Button.new()
	button.name = "Bottom%sButton" % label_text
	button.text = label_text
	button.tooltip_text = help_text
	button.custom_minimum_size.y = 29.0
	button.add_theme_font_size_override("font_size", 13)
	button.add_theme_color_override("font_color", Color("dfc581"))
	button.add_theme_stylebox_override("normal", _hud_box_style(Color("66522d")))
	button.add_theme_stylebox_override("hover", _hud_box_style(Color("b08b40")))
	button.pressed.connect(action)
	parent.add_child(button)


func _add_hotkey_action(
	parent: Container,
	label_text: String,
	hotkey: String,
	action: Callable,
	help_text: String
) -> void:
	var group := HBoxContainer.new()
	group.add_theme_constant_override("separation", 3)
	parent.add_child(group)
	var key := Button.new()
	key.name = "Bottom%sButton" % label_text
	key.text = hotkey
	key.tooltip_text = "%s (%s)" % [help_text, hotkey]
	key.custom_minimum_size = Vector2(
		42.0 if hotkey == "Ctrl+S" else (28.0 if hotkey == "Esc" else 22.0),
		24.0
	)
	key.add_theme_font_size_override("font_size", 11)
	key.add_theme_color_override("font_color", Color("f0cf72"))
	key.add_theme_stylebox_override("normal", _keycap_style())
	key.add_theme_stylebox_override("hover", _hud_box_style(Color("aa8136")))
	key.pressed.connect(action)
	group.add_child(key)
	var label := Label.new()
	label.text = label_text
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", Color("11100d"))
	group.add_child(label)


func _open_characters() -> void:
	_open_character_manager()


func _open_character_manager() -> void:
	_clear_modal("CHARACTERS")
	current_modal_kind = "characters"
	var slots := GameState.character_slots()
	var active_id := GameState.active_character_id()
	var description := Label.new()
	description.text = (
		"You have %d character%s. Switching automatically saves your "
		+ "current progress first."
	) % [slots.size(), "" if slots.size() == 1 else "s"]
	description.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	modal_content.add_child(description)
	slots.sort_custom(
		func(a: Dictionary, b: Dictionary) -> bool:
			return int(a.get("last_played_at", 0)) > int(b.get("last_played_at", 0))
	)
	for slot in slots:
		var id := str(slot.get("id", ""))
		var current := id == active_id
		var button := Button.new()
		button.text = "%s%s%s - %s" % [
			"> " if current else "",
			str(slot.get("name", "Wanderer")),
			" (current)" if current else "",
			_time_ago(int(slot.get("last_played_at", 0))),
		]
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.disabled = current
		if not current:
			button.pressed.connect(_switch_character.bind(id))
		modal_content.add_child(button)
	var create := Button.new()
	create.name = "NewCharacterButton"
	create.text = "+ New character"
	create.pressed.connect(_open_new_character)
	modal_content.add_child(create)
	if slots.size() > 1:
		var delete := Button.new()
		delete.text = "Delete a character..."
		delete.pressed.connect(_open_delete_character)
		modal_content.add_child(delete)
	_add_modal_close()
	modal.visible = true


func _open_new_character() -> void:
	_clear_modal("NEW CHARACTER")
	current_modal_kind = "characters"
	var prompt := Label.new()
	prompt.text = "Name your new character:"
	modal_content.add_child(prompt)
	var name_input := LineEdit.new()
	name_input.name = "CharacterNameInput"
	name_input.placeholder_text = "Wanderer"
	name_input.max_length = 24
	modal_content.add_child(name_input)
	var create := Button.new()
	create.text = "Create character"
	create.pressed.connect(_create_character.bind(name_input))
	modal_content.add_child(create)
	var back := Button.new()
	back.text = "Back"
	back.pressed.connect(_open_character_manager)
	modal_content.add_child(back)
	modal.visible = true
	name_input.grab_focus()


func _create_character(name_input: LineEdit) -> void:
	var id := GameState.create_character(name_input.text)
	if id.is_empty():
		name_input.placeholder_text = "Enter a character name"
		return
	get_tree().reload_current_scene()


func _switch_character(id: String) -> void:
	if GameState.switch_character(id):
		get_tree().reload_current_scene()


func _open_delete_character() -> void:
	_clear_modal("DELETE A CHARACTER")
	current_modal_kind = "characters"
	var warning := Label.new()
	warning.text = "This cannot be undone. Your current character is not shown."
	warning.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	warning.add_theme_color_override("font_color", Color("dc806f"))
	modal_content.add_child(warning)
	var active_id := GameState.active_character_id()
	for slot in GameState.character_slots():
		var id := str(slot.get("id", ""))
		if id == active_id:
			continue
		var button := Button.new()
		button.text = "Delete \"%s\"" % str(slot.get("name", "Wanderer"))
		button.pressed.connect(_confirm_delete_character.bind(id))
		modal_content.add_child(button)
	var back := Button.new()
	back.text = "Back"
	back.pressed.connect(_open_character_manager)
	modal_content.add_child(back)
	modal.visible = true


func _confirm_delete_character(id: String) -> void:
	GameState.delete_character(id)
	_open_character_manager()


func _time_ago(unix_time: int) -> String:
	var elapsed := maxi(
		0,
		int(Time.get_unix_time_from_system()) - unix_time
	)
	if elapsed < 60:
		return "saved just now"
	if elapsed < 3600:
		return "last played %d min ago" % floori(float(elapsed) / 60.0)
	if elapsed < 86400:
		return "last played %d hr ago" % floori(float(elapsed) / 3600.0)
	var days := floori(float(elapsed) / 86400.0)
	return "last played %d day%s ago" % [days, "" if days == 1 else "s"]


func _toggle_chat_expanded() -> void:
	chat_expanded = not chat_expanded
	chat_panel.offset_top = -332.0 if chat_expanded else -168.0
	var button := chat_panel.find_child("ChatExpandButton", true, false) as Button
	button.text = "v" if chat_expanded else "^"
	button.tooltip_text = (
		"Collapse chat history" if chat_expanded else "Expand chat history"
	)


func set_dialogue_chat_active(active: bool) -> void:
	chat_panel.offset_top = (
		-280.0
		if active
		else (-332.0 if chat_expanded else -168.0)
	)


func _close_active_interface() -> void:
	close_context_menu()
	modal.visible = false


func _home_teleport() -> void:
	var world := get_parent()
	if world.has_method("_home_teleport"):
		world._home_teleport()
	elif world.has_method("_teleport_home"):
		world._teleport_home()


func _toggle_sound() -> void:
	var bus := AudioServer.get_bus_index("Master")
	var muted := not AudioServer.is_bus_mute(bus)
	AudioServer.set_bus_mute(bus, muted)
	_log("Sound %s." % ("off" if muted else "on"), MUTED)


func _read_current_tile() -> void:
	_update_location_readout()
	_log(location_label.text.replace("\n", " - "), GOLD)


func _update_location_readout() -> void:
	if location_label == null or player == null:
		return
	var world := get_parent()
	var tile := Vector2i.ZERO
	var hover_tile := Vector2i(-1, -1)
	if world.get("logical_grid") != null:
		tile = world.logical_grid.world_to_tile(player.global_position)
		if world.get("camera") != null:
			var mouse := get_viewport().get_mouse_position()
			var origin: Vector3 = world.camera.project_ray_origin(mouse)
			var direction: Vector3 = world.camera.project_ray_normal(mouse)
			if absf(direction.y) > 0.0001:
				var ray_distance := -origin.y / direction.y
				if ray_distance >= 0.0:
					hover_tile = world.logical_grid.world_to_tile(
						origin + direction * ray_distance
					)
	var region := region_banner.text if region_banner != null else ""
	if region.is_empty():
		region = "Emberfall"
	location_label.text = "Tile  %d, %d\nHover  %s\n%s" % [
		tile.x,
		tile.y,
		("%d, %d" % [hover_tile.x, hover_tile.y]) if hover_tile.x >= 0 else "--, --",
		region,
	]


func _build_modal() -> void:
	modal = PanelContainer.new()
	modal.visible = false
	modal.set_anchors_preset(Control.PRESET_TOP_LEFT)
	_size_and_center_modal(Vector2(460.0, 460.0))
	modal.add_theme_stylebox_override("panel", _panel_style(PANEL_COLOR))
	add_child(modal)
	var scroll := ScrollContainer.new()
	modal.add_child(scroll)
	modal_content = VBoxContainer.new()
	modal_content.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	modal_content.add_theme_constant_override("separation", 8)
	scroll.add_child(modal_content)


func _build_context_menu() -> void:
	context_menu = PanelContainer.new()
	context_menu.visible = false
	context_menu.custom_minimum_size = Vector2(210.0, 0.0)
	context_menu.add_theme_stylebox_override(
		"panel", _panel_style(Color("17140ff2"))
	)
	add_child(context_menu)
	context_content = VBoxContainer.new()
	context_content.add_theme_constant_override("separation", 1)
	context_menu.add_child(context_content)


func _build_action_bar() -> void:
	action_bar = ProgressBar.new()
	action_bar.visible = false
	action_bar.show_percentage = false
	action_bar.anchor_left = 0.5
	action_bar.anchor_top = 1.0
	action_bar.anchor_right = 0.5
	action_bar.anchor_bottom = 1.0
	action_bar.offset_left = -75.0
	action_bar.offset_right = 75.0
	action_bar.offset_top = -181.0
	action_bar.offset_bottom = -173.0
	action_bar.add_theme_stylebox_override(
		"background", _flat_style(Color("15120d"))
	)
	action_bar.add_theme_stylebox_override(
		"fill", _flat_style(Color("d0ad50"))
	)
	add_child(action_bar)


func _build_notifications() -> void:
	xp_drop_root = VBoxContainer.new()
	xp_drop_root.name = "XpDrops"
	xp_drop_root.anchor_left = 1.0
	xp_drop_root.anchor_right = 1.0
	xp_drop_root.offset_left = -505.0
	xp_drop_root.offset_top = 52.0
	xp_drop_root.offset_right = -305.0
	xp_drop_root.offset_bottom = 180.0
	xp_drop_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(xp_drop_root)
	region_banner = Label.new()
	region_banner.set_anchors_preset(Control.PRESET_CENTER_TOP)
	region_banner.position = Vector2(-120.0, 18.0)
	region_banner.custom_minimum_size = Vector2(240.0, 34.0)
	region_banner.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	region_banner.add_theme_font_size_override("font_size", 22)
	region_banner.add_theme_color_override("font_color", GOLD)
	add_child(region_banner)
	status_effect_label = Label.new()
	status_effect_label.visible = false
	status_effect_label.position = Vector2(24.0, 78.0)
	status_effect_label.add_theme_color_override("font_color", Color("dc806f"))
	add_child(status_effect_label)
	save_status_label = Label.new()
	save_status_label.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	save_status_label.position = Vector2(-415.0, -160.0)
	save_status_label.text = "Autosave ready"
	save_status_label.add_theme_color_override("font_color", MUTED)
	add_child(save_status_label)
	level_banner = PanelContainer.new()
	level_banner.visible = false
	level_banner.set_anchors_preset(Control.PRESET_CENTER_TOP)
	level_banner.position = Vector2(-160.0, 64.0)
	level_banner.custom_minimum_size = Vector2(320.0, 68.0)
	level_banner.add_theme_stylebox_override("panel", _panel_style(Color("17140fee")))
	add_child(level_banner)
	level_banner_label = Label.new()
	level_banner_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_banner_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	level_banner_label.add_theme_font_size_override("font_size", 19)
	level_banner_label.add_theme_color_override("font_color", GOLD)
	level_banner.add_child(level_banner_label)
	_build_boss_bar()
	_build_death_overlay()


func _build_boss_bar() -> void:
	boss_bar = PanelContainer.new()
	boss_bar.visible = false
	boss_bar.set_anchors_preset(Control.PRESET_CENTER_TOP)
	boss_bar.position = Vector2(-230.0, 54.0)
	boss_bar.custom_minimum_size = Vector2(460.0, 52.0)
	boss_bar.add_theme_stylebox_override("panel", _panel_style(Color("140f0aee")))
	add_child(boss_bar)
	var column := VBoxContainer.new()
	column.add_theme_constant_override("separation", 3)
	boss_bar.add_child(column)
	boss_bar_label = Label.new()
	boss_bar_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	boss_bar_label.add_theme_font_size_override("font_size", 18)
	boss_bar_label.add_theme_color_override("font_color", GOLD)
	column.add_child(boss_bar_label)
	boss_bar_progress = ProgressBar.new()
	boss_bar_progress.custom_minimum_size = Vector2(440.0, 16.0)
	boss_bar_progress.show_percentage = false
	boss_bar_progress.min_value = 0.0
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color("2a1414")
	bg.set_corner_radius_all(3)
	var fg := StyleBoxFlat.new()
	fg.bg_color = Color("c1443a")
	fg.set_corner_radius_all(3)
	boss_bar_progress.add_theme_stylebox_override("background", bg)
	boss_bar_progress.add_theme_stylebox_override("fill", fg)
	column.add_child(boss_bar_progress)


func show_boss_bar(display_name: String, health: int, max_health: int) -> void:
	if boss_bar == null:
		return
	boss_bar_label.text = display_name
	boss_bar_progress.max_value = maxf(1.0, float(max_health))
	boss_bar_progress.value = clampf(float(health), 0.0, float(max_health))
	boss_bar.visible = true


func update_boss_bar(health: int, max_health: int) -> void:
	if boss_bar == null or not boss_bar.visible:
		return
	boss_bar_progress.max_value = maxf(1.0, float(max_health))
	boss_bar_progress.value = clampf(float(health), 0.0, float(max_health))
	boss_bar_label.text = "%s   %d / %d" % [
		boss_bar_label.text.split("   ")[0], health, max_health
	]


func hide_boss_bar() -> void:
	if boss_bar != null:
		boss_bar.visible = false


func _build_death_overlay() -> void:
	death_overlay = ColorRect.new()
	death_overlay.visible = false
	death_overlay.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	death_overlay.color = Color("100303f2")
	death_overlay.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(death_overlay)
	var death_panel := PanelContainer.new()
	death_panel.set_anchors_preset(Control.PRESET_CENTER)
	death_panel.position = Vector2(-230.0, -105.0)
	death_panel.custom_minimum_size = Vector2(460.0, 210.0)
	var death_style := _panel_style(Color("170908e8"))
	death_style.border_color = Color("6b1e18")
	death_style.border_width_left = 2
	death_style.border_width_top = 2
	death_style.border_width_right = 2
	death_style.border_width_bottom = 2
	death_panel.add_theme_stylebox_override("panel", death_style)
	death_overlay.add_child(death_panel)
	var box := VBoxContainer.new()
	box.alignment = BoxContainer.ALIGNMENT_CENTER
	box.add_theme_constant_override("separation", 14)
	death_panel.add_child(box)
	var title := Label.new()
	title.text = "YOU HAVE FALLEN"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	title.add_theme_color_override("font_color", Color("dc665b"))
	box.add_child(title)
	death_text = Label.new()
	death_text.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	death_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	death_text.add_theme_color_override("font_color", Color("cfa79e"))
	box.add_child(death_text)
	var continue_button := Button.new()
	continue_button.text = "Continue"
	continue_button.pressed.connect(func(): death_overlay.visible = false)
	box.add_child(continue_button)


func show_death_screen(message: String) -> void:
	death_text.text = message
	death_overlay.visible = true


func show_region(region_name: String) -> void:
	if region_name in DISCOVERY_REGIONS:
		if not GameState.data.has("discovered_regions"):
			GameState.data.discovered_regions = {}
		if not bool(GameState.data.discovered_regions.get(region_name, false)):
			GameState.data.discovered_regions[region_name] = true
			GameState.mark_dirty()
	if region_banner.text == region_name:
		return
	region_banner.text = region_name
	_update_location_readout()
	region_banner.modulate.a = 1.0
	var tween := create_tween()
	tween.tween_interval(2.2)
	tween.tween_property(region_banner, "modulate:a", 0.0, 0.7)


func set_status_effect(value: String) -> void:
	status_effect_label.text = value
	status_effect_label.visible = not value.is_empty()


func _select_tab(tab_name: String) -> void:
	active_tab = tab_name
	for name in tab_buttons:
		var button: Button = tab_buttons[name]
		button.button_pressed = name == active_tab
	_refresh_content()


func _toggle_run() -> void:
	if not running and run_energy < 1.0:
		_log("You need more run energy.", Color("dc806f"))
		return
	running = not running
	player.movement_speed = 7.5 if running else 4.5
	GameState.data.run_energy = run_energy
	GameState.save_game()
	_refresh_run()


func _toggle_special() -> void:
	var weapon := ItemCatalog.item(str(GameState.data.equipment.get("weapon", "")))
	if not weapon.has("spec"):
		show_game_message("Your weapon has no special attack.", Color("dc806f"))
		return
	if float(GameState.data.get("special_energy", 100.0)) < 50.0:
		show_game_message("Not enough special-attack energy (need 50%).", Color("dc806f"))
		return
	GameState.data.special_armed = not bool(GameState.data.get("special_armed", false))
	GameState.mark_changed()
	show_game_message(
		"Special attack armed - your next hit unleashes it."
		if GameState.data.special_armed else "Special attack disarmed."
	)


func _refresh_all() -> void:
	_refresh_vitals()
	_refresh_run()
	_refresh_quest()
	for name in tab_buttons:
		var button: Button = tab_buttons[name]
		button.button_pressed = name == active_tab
	_refresh_content()


func _refresh_vitals() -> void:
	health_bar.text = "HP\n%d/%d" % [health, max_health]
	coin_orb.text = "GP\n%d" % GameState.item_count("Coins")
	prayer_bar.text = "PRAY\n%d/%d" % [prayer, max_prayer]
	var special := floori(float(GameState.data.get("special_energy", 100.0)))
	special_button.text = "SPEC\n%d%%" % special
	special_button.button_pressed = bool(GameState.data.get("special_armed", false))
	energy_bar.text = "RUN\n%d%%" % floori(run_energy)


func _refresh_run() -> void:
	energy_bar.text = "RUN\n%d%%" % floori(run_energy)
	energy_bar.add_theme_color_override(
		"font_color",
		Color("ffe171") if running else Color("d6c79a")
	)


func _refresh_quest() -> void:
	QuestSystem.ensure_quests()
	var selected := _selected_quest_id()
	var quest: Dictionary = GameState.data.quests.get(selected, {})
	quest_text.text = "%s\n%s" % [
		str(QUEST_TITLES[selected]).to_upper(),
		"Complete" if quest.get("state") == "complete" else str(quest.get("objective", "Available")),
	]
	var contract: Dictionary = GameState.data.get("slayer_contract", {})
	if not contract.is_empty():
		quest_text.text += "\n\nCONTRACT\n%s" % (
			"Return to Guard Bren"
			if int(contract.get("remaining", 0)) <= 0
			else "%d %ss remaining" % [int(contract.remaining), str(contract.name)]
		)
	var grave: Dictionary = GameState.data.get("grave", {})
	if not grave.is_empty():
		var seconds := maxi(
			1,
			int(grave.get("expires_at", 0))
			- int(Time.get_unix_time_from_system())
		)
		quest_text.text += "\n\nGRAVESTONE\n%d min - recover your items" % (
			ceili(float(seconds) / 60.0)
		)


func _selected_quest_id() -> String:
	var selected := INTRO_QUEST
	for quest_id in QUEST_TITLES:
		if GameState.quest_state(quest_id) == "active":
			return quest_id
	if GameState.quest_state(selected) == "complete":
		for quest_id in QUEST_TITLES:
			if GameState.quest_state(quest_id) == "available":
				return quest_id
	return selected


func _refresh_content() -> void:
	sidebar_scroll.vertical_scroll_mode = (
		ScrollContainer.SCROLL_MODE_DISABLED
		if active_tab in ["Pack", "Skills"]
		else ScrollContainer.SCROLL_MODE_AUTO
	)
	if active_tab in ["Pack", "Skills"]:
		sidebar_scroll.scroll_vertical = 0
	for child in content.get_children():
		content.remove_child(child)
		child.queue_free()
	_add_heading(active_tab.to_upper())
	match active_tab:
		"Pack":
			_show_inventory()
		"Skills":
			_show_skills()
		"Gear":
			_show_gear()
		"Prayer":
			_show_prayer()
		"Journal":
			_show_journal()


func _show_inventory() -> void:
	var count: int = GameState.data.inventory.size()
	content.get_child(0).text = "BACKPACK %d/30" % count
	var grid := GridContainer.new()
	grid.name = "InventoryGrid"
	grid.columns = 4
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 7)
	grid.add_theme_constant_override("v_separation", 7)
	content.add_child(grid)
	for item_name in inventory:
		grid.add_child(_make_item_slot(item_name, int(inventory[item_name]), true))
	for index in range(maxi(0, 30 - count)):
		grid.add_child(_make_item_slot("", 0, false))
	_fit_inventory_slots.call_deferred(grid)


func _fit_inventory_slots(grid: GridContainer) -> void:
	if not is_instance_valid(grid) or active_tab != "Pack":
		return
	var heading_height: float = content.get_child(0).get_combined_minimum_size().y
	var available_height: float = (
		sidebar_scroll.size.y
		- 24.0
		- heading_height
		- content.get_theme_constant("separation")
		- 7.0 * grid.get_theme_constant("v_separation")
	)
	var slot_height: float = clampf(
		floorf(available_height / 8.0), 30.0, 68.0
	)
	for slot in grid.get_children():
		slot.custom_minimum_size = Vector2(54.0, slot_height)
	sidebar_scroll.scroll_vertical = 0


func _show_skills() -> void:
	var skill_icons := {
		"Attack": "⚔️",
		"Strength": "💪",
		"Defence": "🛡️",
		"Ranged": "🎯",
		"Magic": "✨",
		"Prayer": "🙏",
		"Hitpoints": "❤️",
		"Fishing": "🎣",
		"Cooking": "🍳",
		"Woodcutting": "🪓",
		"Firemaking": "🔥",
		"Mining": "⛏️",
		"Smithing": "🔨",
		"Farming": "🌾",
		"Herblore": "🧪",
		"Crafting": "🧵",
		"Fletching": "🏹",
		"Slayer": "💀",
		"Hunter": "🐾",
		"Thieving": "🗝️",
	}
	var grid := GridContainer.new()
	grid.name = "SkillGrid"
	grid.columns = 3
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 4)
	grid.add_theme_constant_override("v_separation", 4)
	content.add_child(grid)
	for skill_name in GameState.SKILL_NAMES:
		var level := int(skills.get(skill_name, 1))
		var current_xp := int(
			GameState.data.skill_xp.get(skill_name, GameState.xp_for_level(level))
		)
		var level_floor := GameState.xp_for_level(level)
		var next_floor := GameState.xp_for_level(mini(99, level + 1))
		var progress := 100.0
		if level < 99 and next_floor > level_floor:
			progress = clampf(
				100.0 * float(current_xp - level_floor)
				/ float(next_floor - level_floor),
				0.0,
				100.0
			)
		var tile := Button.new()
		tile.name = "SkillTile_%s" % skill_name
		tile.text = "%s\n%d" % [skill_icons.get(skill_name, "•"), level]
		tile.tooltip_text = (
			"%s: level %d\n%d XP (maximum level)"
			% [skill_name, level, current_xp]
			if level >= 99
			else "%s: level %d\n%d XP\n%d XP to level %d" % [
				skill_name,
				level,
				current_xp,
				maxi(0, next_floor - current_xp),
				level + 1,
			]
		)
		tile.custom_minimum_size = Vector2(72.0, 48.0)
		tile.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		tile.add_theme_font_size_override("font_size", 13)
		tile.add_theme_color_override("font_color", Color("e7d39d"))
		tile.add_theme_stylebox_override(
			"normal", _panel_style(Color("171610"))
		)
		tile.add_theme_stylebox_override(
			"hover", _panel_style(Color("211d14"))
		)
		tile.set_meta("skill_name", skill_name)
		tile.set_meta("progress_percent", progress)
		grid.add_child(tile)
		var progress_bar := ProgressBar.new()
		progress_bar.name = "SkillProgress"
		progress_bar.set_anchors_preset(Control.PRESET_BOTTOM_WIDE)
		progress_bar.offset_top = -4.0
		progress_bar.offset_bottom = 0.0
		progress_bar.value = progress
		progress_bar.show_percentage = false
		progress_bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
		progress_bar.add_theme_stylebox_override(
			"background", _flat_style(Color("282315"))
		)
		progress_bar.add_theme_stylebox_override(
			"fill", _flat_style(Color("d6b84f"))
		)
		tile.add_child(progress_bar)
	_fit_skill_tiles.call_deferred(grid)


func _fit_skill_tiles(grid: GridContainer) -> void:
	if not is_instance_valid(grid) or active_tab != "Skills":
		return
	var heading_height: float = content.get_child(0).get_combined_minimum_size().y
	var rows := ceili(float(GameState.SKILL_NAMES.size()) / 3.0)
	var available_height: float = (
		sidebar_scroll.size.y
		- 24.0
		- heading_height
		- content.get_theme_constant("separation")
		- float(rows - 1) * grid.get_theme_constant("v_separation")
	)
	var tile_height := clampf(floorf(available_height / rows), 38.0, 58.0)
	for tile in grid.get_children():
		tile.custom_minimum_size = Vector2(72.0, tile_height)
	sidebar_scroll.scroll_vertical = 0


func _show_gear() -> void:
	content.get_child(0).text = "EQUIPMENT"
	var gear_slots := [
		["weapon", "Weapon"],
		["helmet", "Helmet"],
		["armor", "Platebody"],
		["legs", "Platelegs"],
		["shield", "Shield"],
		["gloves", "Gloves"],
		["charm", "Charm"],
	]
	var grid := GridContainer.new()
	grid.name = "EquipmentGrid"
	grid.columns = 4
	grid.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	grid.add_theme_constant_override("h_separation", 7)
	grid.add_theme_constant_override("v_separation", 7)
	content.add_child(grid)
	for slot_data in gear_slots:
		var slot_name: String = slot_data[0]
		var slot_label: String = slot_data[1]
		var item_name := str(GameState.data.equipment.get(slot_name, ""))
		var slot := _make_item_slot(
			item_name,
			1 if not item_name.is_empty() else 0,
			false,
			slot_name
		)
		slot.tooltip_text = (
			"Remove %s" % item_name
			if not item_name.is_empty()
			else "%s - empty" % slot_label
		)
		if item_name.is_empty():
			slot.text = "-"
		grid.add_child(slot)

	var weapon_name := str(GameState.data.equipment.get("weapon", ""))
	var weapon := ItemCatalog.item(weapon_name)
	var is_ranged := int(weapon.get("ranged", 0)) > 0
	var is_magic := int(weapon.get("magic", 0)) > 0
	if not is_ranged and not is_magic:
		_add_heading("COMBAT STYLE")
		var styles := [
			["accurate", "Accurate - train Attack"],
			["aggressive", "Aggressive - train Strength"],
			["defensive", "Defensive - train Defence"],
		]
		var selected_style := str(GameState.data.get("combat_style", "accurate"))
		for style_data in styles:
			var style_id: String = style_data[0]
			var choice := Button.new()
			choice.name = "CombatStyle_%s" % style_id.capitalize()
			choice.text = style_data[1]
			choice.alignment = HORIZONTAL_ALIGNMENT_LEFT
			choice.custom_minimum_size.y = 46.0
			choice.add_theme_font_size_override("font_size", 16)
			choice.add_theme_color_override("font_color", Color("f0d67b"))
			choice.add_theme_stylebox_override(
				"normal",
				_choice_style(style_id == selected_style)
			)
			choice.add_theme_stylebox_override(
				"hover",
				_choice_style(true)
			)
			choice.pressed.connect(_set_combat_style.bind(style_id))
			content.add_child(choice)

	for slot_data in gear_slots:
		var slot_name: String = slot_data[0]
		var item_name := str(GameState.data.equipment.get(slot_name, ""))
		_add_gear_row(
			slot_data[1],
			item_name if not item_name.is_empty() else "None"
		)

	var bonuses := GameState.equipment_bonuses()
	var defence_bonus := int(bonuses.defence)
	if active_prayers["Thick Skin"]:
		defence_bonus += maxi(1, ceili(defence_bonus * 0.05))
	var offensive_skill := (
		"Magic" if is_magic else ("Ranged" if is_ranged else "Strength")
	)
	var offensive_bonus := (
		int(bonuses.magic)
		if is_magic
		else (int(bonuses.ranged) if is_ranged else int(bonuses.attack))
	)
	var effective_level := int(skills.get(offensive_skill, 1))
	if (
		offensive_skill == "Strength"
		and str(GameState.data.get("combat_style", "accurate")) == "aggressive"
	):
		effective_level += 3
	var max_hit := (
		(2 if is_magic else 1)
		+ floori(float(effective_level) / 3.0)
		+ offensive_bonus
	)
	_add_gear_row(
		"Magic bonus" if is_magic else ("Ranged bonus" if is_ranged else "Attack bonus"),
		"+%d" % offensive_bonus
	)
	_add_gear_row("Defence bonus", "+%d" % defence_bonus)
	_add_gear_row("Max hit", str(max_hit))
	_add_gear_row("Attack speed", "%d ticks" % int(weapon.get("speed", 4)))
	if is_ranged:
		_add_gear_row("Ammunition", "%d arrows" % GameState.item_count("Bronze arrows"))
	elif is_magic:
		_add_gear_row("Runes", "%d Ember" % GameState.item_count("Ember rune"))
	if weapon.has("spec"):
		_add_gear_row(
			"Special",
			(
				"Crushing blow (+60% damage, 50%)"
				if str(weapon.spec) == "power"
				else "Flurry - double hit (50%)"
			)
		)


func _add_gear_row(label_text: String, value_text: String) -> void:
	var row := HBoxContainer.new()
	row.clip_contents = true
	row.add_theme_constant_override("separation", 8)
	var label := Label.new()
	label.text = label_text
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.size_flags_stretch_ratio = 0.85
	label.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	label.add_theme_font_size_override("font_size", 16)
	label.add_theme_color_override("font_color", Color("e7d9ae"))
	row.add_child(label)
	var value := Label.new()
	value.text = value_text
	value.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	value.size_flags_stretch_ratio = 1.15
	value.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	value.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	value.add_theme_font_size_override("font_size", 16)
	value.add_theme_color_override("font_color", GOLD)
	row.add_child(value)
	content.add_child(row)


func _choice_style(selected: bool) -> StyleBoxFlat:
	var style := _panel_style(Color("39321d") if selected else Color("171610"))
	style.border_color = Color("e1c662") if selected else Color("665636")
	if selected:
		style.border_width_left = 4
	return style


func _set_combat_style(style_id: String) -> void:
	if style_id not in ["accurate", "aggressive", "defensive"]:
		return
	GameState.data.combat_style = style_id
	GameState.mark_changed()
	_log(
		"Combat style: %s." % style_id.capitalize(),
		GOLD
	)


func _show_prayer() -> void:
	_add_stat_row("Prayer points", "%d / %d" % [prayer, max_prayer])
	_add_prayer_button("Burst of Strength", "+2 melee damage", 1)
	_add_prayer_button("Sharp Eye", "+2 melee accuracy", 2)
	_add_prayer_button("Thick Skin", "+2 melee defence", 3)
	_add_prayer_button("Clarity of Thought", "+4 melee accuracy", 7)
	_add_prayer_button("Steel Skin", "+5 melee defence", 10)
	_add_prayer_button("Ultimate Strength", "+5 melee damage", 12)
	_add_prayer_button("Protect from Melee", "Halves incoming melee damage", 15)


func _show_journal() -> void:
	QuestSystem.ensure_quests()
	var old_heading := content.get_child(0)
	content.remove_child(old_heading)
	old_heading.queue_free()
	var first_row := HBoxContainer.new()
	first_row.name = "JournalPrimaryTabs"
	first_row.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	first_row.add_theme_constant_override("separation", 6)
	content.add_child(first_row)
	for section_data in [
		["quests", "Quests"], ["bestiary", "Bestiary"], ["collection", "Collection"],
	]:
		first_row.add_child(_journal_tab_button(section_data[0], section_data[1]))
	var discovery := _journal_tab_button("discovery", "Discovery")
	discovery.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	content.add_child(discovery)
	match journal_section:
		"bestiary":
			_show_bestiary()
		"collection":
			_show_collection()
		"discovery":
			_show_discovery()
		_:
			_show_quest_list()


func _journal_tab_button(section_id: String, label_text: String) -> Button:
	var button := Button.new()
	button.name = "JournalTab_%s" % section_id.capitalize()
	button.text = label_text
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.custom_minimum_size = Vector2(0.0, 40.0)
	button.clip_text = true
	button.add_theme_font_size_override("font_size", 12)
	button.add_theme_color_override("font_color", Color("e9cf80"))
	var tab_style := _choice_style(journal_section == section_id)
	tab_style.content_margin_left = 5.0
	tab_style.content_margin_right = 5.0
	button.add_theme_stylebox_override("normal", tab_style)
	button.pressed.connect(_set_journal_section.bind(section_id))
	return button


func _set_journal_section(section_id: String) -> void:
	journal_section = section_id
	_refresh_content()


func _show_quest_list() -> void:
	_add_heading("QUESTS")
	for quest_id in QUEST_TITLES:
		var quest: Dictionary = GameState.data.quests.get(quest_id, {})
		var state := str(quest.get("state", "locked"))
		var info: Dictionary = QUEST_INFO.get(quest_id, {})
		var button := Button.new()
		button.name = "QuestEntry_%s" % quest_id
		button.text = "%s\n%s" % [
			QUEST_TITLES[quest_id],
			(
				"Done" if state == "complete"
				else ("In progress" if state == "active" else state.capitalize())
			),
		]
		button.alignment = HORIZONTAL_ALIGNMENT_LEFT
		button.custom_minimum_size.y = 54.0
		button.clip_text = true
		button.tooltip_text = str(info.get("about", "Open quest details."))
		button.pressed.connect(_open_quest_details.bind(quest_id))
		content.add_child(button)


func _open_quest_details(quest_id: String) -> void:
	var quest: Dictionary = GameState.data.quests.get(quest_id, {})
	var info: Dictionary = QUEST_INFO.get(quest_id, {})
	_clear_modal(str(QUEST_TITLES.get(quest_id, "Quest")).to_upper())
	current_modal_kind = "quest"
	var state := str(quest.get("state", "locked"))
	_add_modal_detail("Status", state.capitalize())
	_add_modal_detail("Category", str(info.get("type", "Quest")))
	_add_modal_detail("Quest giver", str(info.get("giver", "Unknown")))
	var about := Label.new()
	about.text = str(info.get("about", ""))
	about.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	about.add_theme_color_override("font_color", TEXT)
	modal_content.add_child(about)
	var objective_heading := Label.new()
	objective_heading.text = "CURRENT OBJECTIVE"
	objective_heading.add_theme_font_size_override("font_size", 17)
	objective_heading.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(objective_heading)
	var objective := Label.new()
	objective.name = "QuestDetailObjective"
	objective.text = (
		"Quest complete."
		if state == "complete"
		else str(quest.get("objective", "This quest is not yet available."))
	)
	objective.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	modal_content.add_child(objective)
	if quest.has("kills"):
		_add_modal_detail("Targets defeated", str(int(quest.kills)))
	if quest.has("rumors"):
		_add_modal_detail("Witnesses questioned", "%d / 3" % quest.rumors.size())
	var reward_heading := Label.new()
	reward_heading.text = "REWARDS"
	reward_heading.add_theme_font_size_override("font_size", 17)
	reward_heading.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(reward_heading)
	var reward := Label.new()
	reward.name = "QuestDetailReward"
	reward.text = str(info.get("reward", "No reward information."))
	reward.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	modal_content.add_child(reward)
	var close := Button.new()
	close.name = "QuestDetailClose"
	close.text = "Close"
	close.pressed.connect(func(): modal.visible = false)
	modal_content.add_child(close)
	modal.visible = true


func _add_modal_detail(label_text: String, value_text: String) -> void:
	var row := HBoxContainer.new()
	var label := Label.new()
	label.text = label_text
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_color_override("font_color", MUTED)
	row.add_child(label)
	var value := Label.new()
	value.text = value_text
	value.add_theme_color_override("font_color", GOLD)
	row.add_child(value)
	modal_content.add_child(row)


func _show_bestiary() -> void:
	_add_heading("BESTIARY")
	var intro := Label.new()
	intro.text = "Your recorded monster defeats and known spoils."
	intro.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	content.add_child(intro)
	var kills: Dictionary = GameState.data.get("kill_log", {})
	for monster_id in BESTIARY:
		var entry: Array = BESTIARY[monster_id]
		var count := int(kills.get(monster_id, 0))
		var row := PanelContainer.new()
		row.custom_minimum_size.y = 58.0
		row.clip_contents = true
		row.add_theme_stylebox_override(
			"panel", _flat_style(Color("191811"))
		)
		var row_content := VBoxContainer.new()
		row_content.add_theme_constant_override("separation", 2)
		row.add_child(row_content)
		var summary := HBoxContainer.new()
		summary.clip_contents = true
		row_content.add_child(summary)
		var monster_name := Label.new()
		monster_name.text = str(entry[0])
		monster_name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		monster_name.clip_text = true
		monster_name.add_theme_color_override(
			"font_color", GOLD if count > 0 else MUTED
		)
		summary.add_child(monster_name)
		var defeated := Label.new()
		defeated.text = "%d defeated" % count
		defeated.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		defeated.add_theme_color_override("font_color", MUTED)
		summary.add_child(defeated)
		var drops := Label.new()
		drops.text = str(entry[1]) if count > 0 else "Undiscovered"
		drops.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		drops.add_theme_color_override("font_color", MUTED)
		row_content.add_child(drops)
		content.add_child(row)


func _show_collection() -> void:
	_add_heading("ASHEN BARROW")
	_add_gear_row("Dungeon clears", str(int(GameState.data.get("barrow_runs", 0))))
	_add_gear_row("Reward chest", "Defeat the Warden to unlock")
	_add_heading("BARROW COLLECTION")
	var collection: Dictionary = GameState.data.get("barrow_collection", {})
	for item_name in ["Warden cloak", "Ashen guard", "Barrow lantern"]:
		_add_gear_row(item_name, "Found" if collection.get(item_name, false) else "Undiscovered")


func _show_discovery() -> void:
	var discovered: Dictionary = GameState.data.get("discovered_regions", {})
	var found := 0
	for region_name in DISCOVERY_REGIONS:
		if bool(discovered.get(region_name, false)):
			found += 1
	_add_heading("WORLD DISCOVERY %d/7" % found)
	for region_name in DISCOVERY_REGIONS:
		var label := Label.new()
		var known := bool(discovered.get(region_name, false))
		label.text = "%s %s" % ["◆" if known else "◇", region_name if known else "Undiscovered region"]
		label.add_theme_color_override("font_color", GOLD if known else MUTED)
		content.add_child(label)


func _eat_bread() -> void:
	_primary_item_action("Bread")


func _add_heading(value: String) -> void:
	var heading := Label.new()
	heading.text = value
	heading.add_theme_font_size_override("font_size", 18)
	heading.add_theme_color_override("font_color", GOLD)
	content.add_child(heading)


func _add_stat_row(label_text: String, value_text: String) -> void:
	var row := HBoxContainer.new()
	var label := Label.new()
	label.text = label_text
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.add_theme_color_override("font_color", MUTED)
	row.add_child(label)
	var value := Label.new()
	value.text = value_text
	value.add_theme_color_override("font_color", TEXT)
	row.add_child(value)
	content.add_child(row)


func _add_prayer_button(
	prayer_name: String,
	description: String,
	required_level: int
) -> void:
	var unlocked: bool = skills["Prayer"] >= required_level
	var button := Button.new()
	button.custom_minimum_size.y = 52.0
	button.disabled = not unlocked
	button.text = (
		("%s: %s\n%s" % [
			prayer_name,
			"ON" if active_prayers[prayer_name] else "OFF",
			description,
		])
		if unlocked
		else "%s\nRequires Prayer %d" % [prayer_name, required_level]
	)

	button.button_pressed = active_prayers[prayer_name]
	button.toggle_mode = true
	button.pressed.connect(_toggle_prayer.bind(prayer_name))
	content.add_child(button)


func _toggle_prayer(prayer_name: String) -> void:
	if prayer <= 0:
		active_prayers[prayer_name] = false
		_log("You need Prayer points.", Color("dc806f"))
	else:
		var activating: bool = not active_prayers[prayer_name]
		for name in active_prayers:
			active_prayers[name] = false
		active_prayers[prayer_name] = activating
		GameState.data.active_prayer = prayer_name if activating else ""
		GameState.mark_changed()
		_log(
			"%s %s." % [
				prayer_name,
				"activated" if active_prayers[prayer_name] else "deactivated",
			],
			Color("88acd0")
		)
	_refresh_content()


func _add_labeled_bar(
	parent: VBoxContainer,
	label_text: String,
	color: Color,
	maximum: float
) -> ProgressBar:
	var row := HBoxContainer.new()
	var label := Label.new()
	label.text = label_text
	label.custom_minimum_size.x = 82.0
	label.add_theme_color_override("font_color", MUTED)
	row.add_child(label)
	var bar := _make_bar(label_text, color, maximum)
	bar.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(bar)
	parent.add_child(row)
	return bar


func _make_bar(label_text: String, color: Color, maximum: float) -> ProgressBar:
	var bar := ProgressBar.new()
	bar.custom_minimum_size = Vector2(0.0, 22.0)
	bar.max_value = maximum
	bar.value = maximum
	bar.show_percentage = true
	bar.tooltip_text = label_text
	bar.add_theme_stylebox_override("background", _flat_style(Color("0c1011")))
	bar.add_theme_stylebox_override("fill", _flat_style(color))
	return bar


func _make_status_label(color: Color) -> Label:
	var label := Label.new()
	label.custom_minimum_size = Vector2(46.0, 36.0)
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	label.add_theme_font_size_override("font_size", 11)
	label.add_theme_color_override("font_color", color)
	label.add_theme_stylebox_override("normal", _orb_style())
	return label


func _make_status_button() -> Button:
	var button := Button.new()
	button.custom_minimum_size = Vector2(46.0, 36.0)
	button.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	button.add_theme_font_size_override("font_size", 11)
	button.add_theme_color_override("font_color", Color("d6c79a"))
	button.add_theme_stylebox_override("normal", _orb_style())
	button.add_theme_stylebox_override("hover", _orb_style(Color("d6b45c")))
	return button


func _orb_style(border := Color("57482c")) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("12110d")
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = border
	style.content_margin_left = 2.0
	style.content_margin_right = 2.0
	return style


func _nav_style(color: Color, active: bool) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.border_width_right = 1
	style.border_color = Color("4b3d24")
	if active:
		style.border_width_bottom = 3
		style.border_color = Color("cf9f43")
	return style


func _panel_style(color: Color) -> StyleBoxFlat:
	var style := _flat_style(color)
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = BORDER_COLOR
	style.content_margin_left = 12.0
	style.content_margin_top = 10.0
	style.content_margin_right = 12.0
	style.content_margin_bottom = 10.0
	return style


func _flat_style(color: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = color
	style.corner_radius_top_left = 3
	style.corner_radius_top_right = 3
	style.corner_radius_bottom_left = 3
	style.corner_radius_bottom_right = 3
	return style


func _hud_box_style(border: Color) -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("17150fee")
	style.border_width_left = 1
	style.border_width_top = 1
	style.border_width_right = 1
	style.border_width_bottom = 1
	style.border_color = border
	style.content_margin_left = 8.0
	style.content_margin_top = 3.0
	style.content_margin_right = 8.0
	style.content_margin_bottom = 3.0
	return style


func _keycap_style() -> StyleBoxFlat:
	var style := _hud_box_style(Color("8d7133"))
	style.bg_color = Color("242016")
	style.content_margin_left = 4.0
	style.content_margin_right = 4.0
	return style


func _chat_console_style() -> StyleBoxFlat:
	var style := StyleBoxFlat.new()
	style.bg_color = Color("15130f")
	style.border_width_top = 2
	style.border_color = Color("6a552e")
	return style


func _log(message: String, color: Color) -> void:
	var now := Time.get_time_dict_from_system()
	var hour := int(now.hour)
	var suffix := "PM" if hour >= 12 else "AM"
	var display_hour := hour % 12
	if display_hour == 0:
		display_hour = 12
	var timestamp := "[%d:%02d %s]" % [
		display_hour, int(now.minute), suffix,
	]
	chat_text.append_text(
		"[color=#777368]%s[/color] [color=#%s]%s[/color]\n"
		% [timestamp, color.to_html(false), message]
	)


func _make_item_slot(
	item_name: String,
	quantity: int,
	usable: bool,
	equipment_slot := ""
) -> Control:
	var slot := Button.new()
	slot.custom_minimum_size = Vector2(54.0, 54.0)
	slot.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slot.tooltip_text = item_name if not item_name.is_empty() else "Empty"
	slot.add_theme_stylebox_override("normal", _panel_style(Color("171610")))
	slot.add_theme_stylebox_override("hover", _panel_style(Color("2d291e")))
	if item_name.is_empty():
		slot.disabled = true
		return slot
	var image := TextureRect.new()
	image.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 8)
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	image.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var path := ItemCatalog.icon_path(item_name)
	if ResourceLoader.exists(path):
		image.texture = load(path)
	slot.add_child(image)
	if quantity > 1:
		var amount := Label.new()
		amount.text = str(quantity)
		amount.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
		amount.position = Vector2(-18.0, -18.0)
		amount.add_theme_font_size_override("font_size", 11)
		amount.mouse_filter = Control.MOUSE_FILTER_IGNORE
		slot.add_child(amount)
	if usable:
		slot.pressed.connect(_primary_item_action.bind(item_name))
	slot.gui_input.connect(
		_item_slot_input.bind(item_name, equipment_slot)
	)
	if not equipment_slot.is_empty():
		slot.pressed.connect(_unequip_item.bind(equipment_slot))
	return slot


func _add_context_button(label: String, action: Callable) -> void:
	var button := Button.new()
	button.text = label
	button.alignment = HORIZONTAL_ALIGNMENT_LEFT
	button.pressed.connect(
		func():
			context_menu.visible = false
			if action.is_valid():
				action.call()
	)
	context_content.add_child(button)


func _sync_from_game_state() -> void:
	health = int(GameState.data.health)
	max_health = int(GameState.data.max_health)
	prayer = int(GameState.data.prayer)
	max_prayer = int(GameState.data.max_prayer)
	run_energy = float(GameState.data.run_energy)
	var saved_prayer := str(GameState.data.get("active_prayer", ""))
	for prayer_name in active_prayers:
		active_prayers[prayer_name] = prayer_name == saved_prayer
	inventory = GameState.data.inventory
	skills = GameState.data.skills
	quest_complete = GameState.quest_state(INTRO_QUEST) == "complete"


func _on_game_state_changed() -> void:
	var old_inventory := inventory_fingerprint
	var old_equipment := equipment_fingerprint
	var old_skills := skills_fingerprint
	var old_quest := quest_fingerprint
	_sync_from_game_state()
	_capture_state_fingerprints()
	if is_node_ready():
		_refresh_vitals()
		if old_quest != quest_fingerprint:
			_refresh_quest()
		if (
			old_inventory != inventory_fingerprint
			or old_equipment != equipment_fingerprint
			or old_skills != skills_fingerprint
			or old_quest != quest_fingerprint
		):
			_refresh_content()


func _on_xp_gained(skill_name: String, amount: int, old_level: int, new_level: int) -> void:
	if not is_node_ready() or amount <= 0:
		return
	var label := Label.new()
	label.text = "+%d %s XP" % [amount, skill_name]
	label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	label.add_theme_color_override("font_color", Color("8bcf8b"))
	xp_drop_root.add_child(label)
	var tween := create_tween()
	tween.tween_interval(1.4)
	tween.tween_property(label, "modulate:a", 0.0, 0.5)
	tween.tween_callback(label.queue_free)
	if new_level > old_level:
		level_banner_label.text = "LEVEL UP!\n%s is now level %d" % [skill_name, new_level]
		level_banner.visible = true
		if level_banner_tween != null:
			level_banner_tween.kill()
		level_banner_tween = create_tween()
		level_banner_tween.tween_interval(3.0)
		level_banner_tween.tween_callback(func(): level_banner.visible = false)
		_log("Congratulations, your %s level is now %d!" % [skill_name, new_level], GOLD)


func _on_save_status(message: String) -> void:
	if save_status_label == null:
		return
	save_status_label.text = message
	var tween := create_tween()
	tween.tween_interval(1.5)
	tween.tween_callback(func(): save_status_label.text = "Autosave ready")


func _capture_state_fingerprints() -> void:
	inventory_fingerprint = hash(GameState.data.inventory)
	equipment_fingerprint = hash(GameState.data.equipment)
	skills_fingerprint = hash(GameState.data.skills)
	quest_fingerprint = str(hash([
		GameState.data.quests,
		GameState.data.get("grave", {}),
	]))


func _clear_modal(title_text: String) -> void:
	_size_and_center_modal(Vector2(460.0, 460.0))
	current_modal_kind = ""
	var scroll := modal.get_child(0) as ScrollContainer
	scroll.vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO
	for child in modal_content.get_children():
		child.queue_free()
	var heading := Label.new()
	heading.text = title_text
	heading.add_theme_font_size_override("font_size", 22)
	heading.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(heading)


func close_interfaces_for_world_movement() -> void:
	close_context_menu()
	if modal.visible and current_modal_kind != "map":
		modal.visible = false


func _size_and_center_modal(requested_size: Vector2) -> void:
	if modal == null:
		return
	var viewport_size := get_viewport().get_visible_rect().size
	var available := Vector2(
		maxf(320.0, viewport_size.x - 285.0),
		viewport_size.y
	)
	var fitted := Vector2(
		minf(requested_size.x, available.x - 24.0),
		minf(requested_size.y, available.y - 24.0)
	)
	modal.custom_minimum_size = fitted
	modal.size = fitted
	modal.position = Vector2(
		maxf(12.0, (available.x - fitted.x) * 0.5),
		maxf(12.0, (available.y - fitted.y) * 0.5)
	)


func _add_modal_close() -> void:
	var close := Button.new()
	close.text = "Close"
	close.pressed.connect(func(): modal.visible = false)
	modal_content.add_child(close)


func _buy_item(item_name: String, price: int, shop_role: String) -> void:
	var bought := 0
	for index in range(shop_amount):
		if not GameState.buy_item(item_name, price):
			break
		bought += 1
	if bought > 0:
		_log("Bought %d %s." % [bought, item_name], Color("8bcf8b"))
	else:
		_log("You do not have enough coins.", Color("dc806f"))
	open_shop(shop_role)


func _sell_item(item_name: String, price: int, shop_role: String) -> void:
	var sold := 0
	for index in range(mini(shop_amount, GameState.item_count(item_name))):
		if GameState.sell_item(item_name, price):
			sold += 1
	if sold:
		_log("Sold %d %s." % [sold, item_name], Color("8bcf8b"))
	open_shop(shop_role)


func _make_bank_slot(item_name: String, quantity: int, depositing: bool) -> Button:
	var slot := Button.new()
	slot.custom_minimum_size = Vector2(52.0, 52.0)
	slot.tooltip_text = "%s x%d - click to %s" % [
		item_name, quantity, "deposit" if depositing else "withdraw",
	]
	slot.set_meta("item_name", item_name)
	slot.add_theme_stylebox_override("normal", _panel_style(Color("171610")))
	slot.add_theme_stylebox_override("hover", _panel_style(Color("30291c")))
	var image := TextureRect.new()
	image.set_anchors_and_offsets_preset(
		Control.PRESET_FULL_RECT, Control.PRESET_MODE_MINSIZE, 7
	)
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	image.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var icon_path := ItemCatalog.icon_path(item_name)
	if ResourceLoader.exists(icon_path):
		image.texture = load(icon_path)
	slot.add_child(image)
	var amount := Label.new()
	amount.text = str(quantity)
	amount.set_anchors_preset(Control.PRESET_BOTTOM_RIGHT)
	amount.position = Vector2(-30.0, -18.0)
	amount.size = Vector2(27.0, 16.0)
	amount.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	amount.add_theme_font_size_override("font_size", 11)
	amount.add_theme_color_override("font_color", GOLD)
	amount.mouse_filter = Control.MOUSE_FILTER_IGNORE
	slot.add_child(amount)
	slot.pressed.connect(_bank_action.bind(item_name, depositing))
	return slot


func _make_empty_bank_slot() -> Button:
	var slot := Button.new()
	slot.custom_minimum_size = Vector2(52.0, 52.0)
	slot.disabled = true
	slot.add_theme_stylebox_override("disabled", _panel_style(Color("11130f")))
	return slot


func _bank_action(item_name: String, depositing: bool) -> void:
	var available := (
		GameState.item_count(item_name)
		if depositing
		else int(GameState.data.bank.get(item_name, 0))
	)
	var quantity := available if bank_amount < 0 else mini(bank_amount, available)
	if depositing:
		GameState.deposit_quantity(item_name, quantity)
	else:
		GameState.withdraw_quantity(item_name, quantity)
	open_bank()


func _deposit_all_bank_inventory() -> void:
	var quantity := GameState.deposit_all_inventory()
	if quantity > 0:
		_log("You deposit your carried items.", TEXT)
	open_bank()


func _deposit_all_bank_equipment() -> void:
	var quantity := GameState.deposit_all_equipment()
	if quantity > 0:
		_log("You deposit your equipped items.", TEXT)
	open_bank()


func _manual_save() -> void:
	GameState.save_game()
	_log("Game saved.", Color("8bcf8b"))


func _manual_load() -> void:
	if GameState.load_game():
		get_parent().restore_player_from_save()
		_log("Game loaded.", Color("8bcf8b"))


func open_developer_tools() -> void:
	_clear_modal("DEVELOPER TEST YARD")
	_add_developer_button("Teleport to test yard", _teleport_to_test_yard)
	_add_developer_button("Grant gathering tools", _grant_gathering_tools)
	_add_developer_button("Grant combat equipment", _grant_combat_equipment)
	_add_developer_button("Set all skills to 50", _set_test_skills)
	_add_developer_button("Restore health and Prayer", _restore_test_stats)
	_add_developer_button("Reset A Wanderer in Greenrest", _reset_intro_quest)
	_add_modal_close()
	modal.visible = true


func _add_developer_button(label: String, callback: Callable) -> void:
	var button := Button.new()
	button.text = label
	button.custom_minimum_size.y = 38.0
	button.pressed.connect(callback)
	modal_content.add_child(button)


func _teleport_to_test_yard() -> void:
	get_parent().teleport_to_tile(Vector2i(184, 158))
	modal.visible = false
	_log("Teleported to the developer test yard.", GOLD)


func _grant_gathering_tools() -> void:
	var grants := {
		"Bronze pickaxe": 1,
		"Bronze hatchet": 1,
		"Fishing rod": 1,
		"Fishing bait": 100,
		"Carving knife": 1,
		"Tinderbox": 1,
		"Wooden snare": 1,
	}
	for item_name in grants:
		GameState.add_item(item_name, int(grants[item_name]), false)
	GameState.save_game()
	GameState.changed.emit()
	_log("Gathering tools added.", Color("8bcf8b"))


func _grant_combat_equipment() -> void:
	for item_name in [
		"Bronze sword", "Bronze shield", "Bronze platebody",
		"Bronze helmet", "Bronze platelegs", "Shortbow",
		"Bronze arrows", "Ember staff", "Ember rune",
	]:
		GameState.add_item(
			item_name,
			100 if item_name in ["Bronze arrows", "Ember rune"] else 1,
			false
		)
	GameState.save_game()
	GameState.changed.emit()
	_log("Combat equipment added.", Color("8bcf8b"))


func _set_test_skills() -> void:
	for skill_name in GameState.data.skills:
		GameState.data.skills[skill_name] = 50
	for skill_name in ["Farming", "Hunter", "Crafting", "Herblore"]:
		GameState.data.skills[skill_name] = 50
	GameState.save_game()
	GameState.changed.emit()
	_log("All skills set to level 50.", Color("8bcf8b"))


func _restore_test_stats() -> void:
	GameState.data.health = GameState.data.max_health
	GameState.data.prayer = GameState.data.max_prayer
	GameState.data.run_energy = 100.0
	GameState.save_game()
	GameState.changed.emit()
	_log("Health, Prayer, and run energy restored.", Color("8bcf8b"))


func _reset_intro_quest() -> void:
	GameState.data.quests[INTRO_QUEST] = {
		"state": "available",
		"stage": "available",
		"objective": "Speak with Guide Elowen.",
	}
	GameState.save_game()
	GameState.changed.emit()
	var world := get_parent()
	if world.has_method("reset_intro_quest_world"):
		world.reset_intro_quest_world()
	_log("A Wanderer in Greenrest reset.", GOLD)


func _item_slot_input(
	event: InputEvent,
	item_name: String,
	equipment_slot: String
) -> void:
	if (
		event is InputEventMouseButton
		and event.button_index == MOUSE_BUTTON_RIGHT
		and event.pressed
	):
		_open_item_context(
			item_name,
			get_viewport().get_mouse_position(),
			equipment_slot
		)
		get_viewport().set_input_as_handled()


func _open_item_context(
	item_name: String,
	screen_position: Vector2,
	equipment_slot := ""
) -> void:
	for child in context_content.get_children():
		child.queue_free()
	var title := Label.new()
	var quantity := (
		1 if not equipment_slot.is_empty() else GameState.item_count(item_name)
	)
	title.text = "%s%s" % [
		item_name,
		" x%d" % quantity if quantity > 1 else "",
	]
	title.add_theme_color_override("font_color", GOLD)
	context_content.add_child(title)
	if not equipment_slot.is_empty():
		_add_context_button(
			"Remove %s" % item_name,
			_unequip_item.bind(equipment_slot)
		)
	else:
		_add_context_button(
			"%s %s" % [_item_primary_label(item_name), item_name],
			_primary_item_action.bind(item_name)
		)
		if ItemCatalog.id_for_name(item_name) not in ["key", "relic"]:
			_add_context_button(
				"Drop one",
				_drop_item.bind(item_name, 1)
			)
			if quantity > 1:
				_add_context_button(
					"Drop all",
					_drop_item.bind(item_name, quantity)
				)
	_add_context_button("Examine %s" % item_name, _examine_item.bind(item_name))
	_add_context_button("Cancel", Callable())
	var viewport_size := get_viewport().get_visible_rect().size
	context_menu.position = Vector2(
		clampf(screen_position.x, 4.0, viewport_size.x - 220.0),
		clampf(screen_position.y, 4.0, viewport_size.y - 245.0)
	)
	context_menu.visible = true


func _item_primary_label(item_name: String) -> String:
	var definition := ItemCatalog.item(item_name)
	if definition.has("energy"):
		return "Drink"
	if definition.has("heal"):
		return "Eat"
	var slot := ItemCatalog.equipment_slot(item_name)
	if slot == "armor":
		return "Wear"
	if not slot.is_empty():
		return "Wield"
	return "Use"


func _primary_item_action(item_name: String) -> void:
	var item_id := ItemCatalog.id_for_name(item_name)
	if item_id == "knife":
		open_skilling_station("fletching")
		return
	if item_id == "logs":
		_log(SkillingSystem.light_fire(), Color("8bcf8b"))
		return
	if item_id == "bones":
		_log(SkillingSystem.bury_bones(), Color("8bcf8b"))
		return
	var slot := ItemCatalog.equipment_slot(item_name)
	if not slot.is_empty():
		if GameState.equip_item(item_name):
			_log("You equip the %s." % item_name, Color("8bcf8b"))
		else:
			_log(
				"You cannot equip that item yet.",
				Color("dc806f")
			)
		return
	var result := GameState.use_consumable(item_name)
	if result.is_empty():
		_log("Nothing interesting happens.", MUTED)
	else:
		_log(result, Color("8bcf8b"))


func _open_skilling_station_grid(station_type: String) -> void:
	current_skill_station = station_type
	var skill_name := SkillingSystem.skill_for_station(station_type)
	var station_title := (
		"Fletching"
		if station_type == "fletching"
		else station_type.capitalize()
	)
	_clear_modal(station_title.to_upper())
	_size_and_center_modal(Vector2(760.0, 640.0))
	var header := HBoxContainer.new()
	modal_content.add_child(header)
	var level := Label.new()
	level.text = "%s level: %d" % [
		skill_name,
		int(GameState.data.skills.get(skill_name, 1)),
	]
	level.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	level.add_theme_color_override("font_color", MUTED)
	header.add_child(level)
	var quantity_label := Label.new()
	quantity_label.text = "Make"
	quantity_label.add_theme_color_override("font_color", MUTED)
	header.add_child(quantity_label)
	for entry in [[1, "1"], [5, "5"], [10, "10"], [-1, "All"]]:
		var quantity_button := Button.new()
		quantity_button.text = str(entry[1])
		quantity_button.toggle_mode = true
		quantity_button.button_pressed = skill_make_amount == int(entry[0])
		quantity_button.pressed.connect(
			_set_skill_make_amount.bind(int(entry[0]), station_type)
		)
		header.add_child(quantity_button)
	modal_content.add_child(HSeparator.new())
	var instruction := Label.new()
	instruction.text = "Choose an item to make"
	instruction.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(instruction)
	var recipe_grid := GridContainer.new()
	recipe_grid.name = "SkillRecipeGrid"
	recipe_grid.columns = 4
	recipe_grid.add_theme_constant_override("h_separation", 7)
	recipe_grid.add_theme_constant_override("v_separation", 7)
	modal_content.add_child(recipe_grid)
	for recipe in SkillingSystem.recipes_for(station_type):
		recipe_grid.add_child(_make_skill_recipe_tile(recipe, skill_name))
	_add_modal_close()
	modal.visible = true


func _make_skill_recipe_tile(recipe: Dictionary, skill_name: String) -> Button:
	var button := Button.new()
	button.custom_minimum_size = Vector2(166.0, 132.0)
	var required_level := int(recipe.get("level", 1))
	var has_level := int(GameState.data.skills.get(skill_name, 1)) >= required_level
	var has_materials := true
	var need_lines: Array[String] = []
	var needs: Dictionary = recipe.get("needs", {})
	for needed_id in needs:
		var item_name := ItemCatalog.display_name(str(needed_id))
		var required := int(needs[needed_id])
		var owned := GameState.item_count(item_name)
		if owned < required:
			has_materials = false
		need_lines.append("%s %d/%d" % [item_name, owned, required])
	button.disabled = not has_level or not has_materials
	button.tooltip_text = "%s\nRequires level %d %s\n%s" % [
		str(recipe.get("name", "Make item")),
		required_level,
		skill_name,
		", ".join(need_lines),
	]
	button.add_theme_stylebox_override("normal", _panel_style(Color("19170f")))
	button.add_theme_stylebox_override("hover", _panel_style(Color("302a1b")))
	var layout := VBoxContainer.new()
	layout.set_anchors_and_offsets_preset(
		Control.PRESET_FULL_RECT,
		Control.PRESET_MODE_MINSIZE,
		7
	)
	layout.mouse_filter = Control.MOUSE_FILTER_IGNORE
	layout.alignment = BoxContainer.ALIGNMENT_CENTER
	button.add_child(layout)
	var image := TextureRect.new()
	image.custom_minimum_size = Vector2(44.0, 44.0)
	image.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	image.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	image.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var result_name := ItemCatalog.display_name(str(recipe.get("makes", "")))
	var icon_path := ItemCatalog.icon_path(result_name)
	if ResourceLoader.exists(icon_path):
		image.texture = load(icon_path)
	layout.add_child(image)
	var name_label := Label.new()
	name_label.text = result_name
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	name_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	name_label.add_theme_color_override(
		"font_color",
		TEXT if has_level else Color("a86455")
	)
	layout.add_child(name_label)
	var level_label := Label.new()
	level_label.text = "Level %d  |  %d XP" % [
		required_level,
		int(recipe.get("xp", 0)),
	]
	level_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	level_label.add_theme_font_size_override("font_size", 11)
	level_label.add_theme_color_override(
		"font_color",
		MUTED if has_level else Color("c06b5d")
	)
	layout.add_child(level_label)
	var needs_label := Label.new()
	needs_label.text = ", ".join(need_lines)
	needs_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	needs_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	needs_label.add_theme_font_size_override("font_size", 10)
	needs_label.add_theme_color_override(
		"font_color",
		Color("8bcf8b") if has_materials else Color("dc806f")
	)
	layout.add_child(needs_label)
	button.pressed.connect(_make_skill_recipe_quantity.bind(recipe, skill_name))
	return button


func _set_skill_make_amount(amount: int, station_type: String) -> void:
	skill_make_amount = amount
	_open_skilling_station_grid(station_type)


func _make_skill_recipe_quantity(recipe: Dictionary, skill_name: String) -> void:
	var requested := (
		_skill_recipe_capacity(recipe)
		if skill_make_amount < 0
		else skill_make_amount
	)
	var made := 0
	var message := ""
	for index in range(requested):
		message = SkillingSystem.make_recipe(recipe, skill_name)
		if not message.begins_with("You create"):
			break
		made += 1
	if made > 1:
		message = "You create %d %s." % [
			made,
			ItemCatalog.display_name(str(recipe.get("makes", ""))),
		]
	if message.is_empty():
		message = "You do not have the required materials."
	_log(
		message,
		Color("8bcf8b") if made > 0 else Color("dc806f")
	)
	_open_skilling_station_grid(current_skill_station)


func _skill_recipe_capacity(recipe: Dictionary) -> int:
	var capacity := 999
	var needs: Dictionary = recipe.get("needs", {})
	for needed_id in needs:
		var item_name := ItemCatalog.display_name(str(needed_id))
		var required := maxi(1, int(needs[needed_id]))
		capacity = mini(capacity, GameState.item_count(item_name) / required)
	return maxi(0, capacity)


func open_skilling_station(station_type: String) -> void:
	_open_skilling_station_grid(station_type)
	return
	for child in modal_content.get_children():
		child.queue_free()
	var skill_name := SkillingSystem.skill_for_station(station_type)
	var title := Label.new()
	title.text = (
		"Fletching"
		if station_type == "fletching"
		else station_type.capitalize()
	)
	title.add_theme_font_size_override("font_size", 22)
	title.add_theme_color_override("font_color", GOLD)
	modal_content.add_child(title)
	for recipe in SkillingSystem.recipes_for(station_type):
		var button := Button.new()
		var needs: Dictionary = recipe.get("needs", {})
		var need_text: Array[String] = []
		for needed_id in needs:
			need_text.append(
				"%d %s" % [
					int(needs[needed_id]),
					ItemCatalog.display_name(str(needed_id)),
				]
			)
		button.text = "%s\nLevel %d · %s" % [
			str(recipe.get("name", "Make item")),
			int(recipe.get("level", 1)),
			", ".join(need_text),
		]
		button.custom_minimum_size.y = 50.0
		button.disabled = (
			int(GameState.data.skills.get(skill_name, 1))
			< int(recipe.get("level", 1))
		)
		button.pressed.connect(_make_skill_recipe.bind(recipe, skill_name))
		modal_content.add_child(button)
	var close := Button.new()
	close.text = "Close"
	close.pressed.connect(func(): modal.visible = false)
	modal_content.add_child(close)
	modal.visible = true


func _make_skill_recipe(recipe: Dictionary, skill_name: String) -> void:
	var message := SkillingSystem.make_recipe(recipe, skill_name)
	_log(
		message,
		Color("8bcf8b") if message.begins_with("You create") else Color("dc806f")
	)


func _unequip_item(slot: String) -> void:
	var item_name := str(GameState.data.equipment.get(slot, ""))
	if GameState.unequip_slot(slot):
		_log("You remove the %s." % item_name, TEXT)
	else:
		_log("Your backpack is full.", Color("dc806f"))


func _drop_item(item_name: String, quantity: int) -> void:
	if GameState.drop_item(item_name, quantity):
		var world := get_parent()
		if world.has_method("_spawn_ground_item"):
			world._spawn_ground_item(
				item_name,
				quantity,
				player.global_position
			)
		_log("You drop %d %s." % [quantity, item_name], TEXT)
	else:
		_log("You should not drop that item.", Color("dc806f"))


func _examine_item(item_name: String) -> void:
	var definition := ItemCatalog.item(item_name)
	var details: Array[String] = [item_name]
	for property in ["heal", "attack", "ranged", "magic", "defence", "value"]:
		if definition.has(property):
			details.append("%s %s" % [property.capitalize(), definition[property]])
	_log(" - ".join(details) + ".", GOLD)


func _add_quantity_bar(bank: bool, shop_role: String) -> void:
	var row := HBoxContainer.new()
	row.name = "QuantityBar"
	var label := Label.new()
	label.text = "Quantity"
	label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(label)
	var entries := (
		[[1, "1"], [5, "5"], [10, "10"], [-2, "X"], [-1, "All"]]
		if bank
		else [[1, "1"], [5, "5"], [10, "10"], [-1, "X"]]
	)
	for entry in entries:
		var button := Button.new()
		button.text = entry[1]
		button.toggle_mode = true
		button.button_pressed = (
			(bank_amount if bank else shop_amount) == int(entry[0])
		)
		if bank and int(entry[0]) == -2:
			button.pressed.connect(_show_bank_quantity_prompt)
		elif not bank and int(entry[0]) < 0:
			button.pressed.connect(_show_shop_quantity_prompt.bind(shop_role))
		else:
			button.pressed.connect(
				_set_transfer_amount.bind(int(entry[0]), bank, shop_role)
			)
		row.add_child(button)
	modal_content.add_child(row)


func _show_bank_quantity_prompt() -> void:
	var prompt := ConfirmationDialog.new()
	prompt.title = "Enter amount"
	prompt.dialog_text = "Set bank transfer quantity"
	var amount := SpinBox.new()
	amount.name = "BankCustomQuantity"
	amount.min_value = 1
	amount.max_value = 999999
	amount.value = maxi(1, bank_amount)
	amount.custom_minimum_size = Vector2(220.0, 40.0)
	prompt.get_vbox().add_child(amount)
	prompt.confirmed.connect(
		func():
			bank_amount = int(amount.value)
			open_bank()
	)
	prompt.canceled.connect(prompt.queue_free)
	prompt.confirmed.connect(prompt.queue_free)
	add_child(prompt)
	prompt.popup_centered(Vector2i(320, 160))


func _show_shop_quantity_prompt(shop_role: String) -> void:
	var prompt := ConfirmationDialog.new()
	prompt.title = "Enter amount"
	prompt.dialog_text = "How many items?"
	var amount := SpinBox.new()
	amount.name = "ShopCustomQuantity"
	amount.min_value = 1
	amount.max_value = 999
	amount.value = maxi(1, shop_amount)
	amount.custom_minimum_size = Vector2(220.0, 40.0)
	prompt.get_vbox().add_child(amount)
	prompt.confirmed.connect(
		func():
			shop_amount = int(amount.value)
			open_shop(shop_role)
	)
	prompt.canceled.connect(prompt.queue_free)
	prompt.confirmed.connect(prompt.queue_free)
	add_child(prompt)
	prompt.popup_centered(Vector2i(300, 150))


func _set_transfer_amount(
	amount: int,
	bank: bool,
	shop_role: String
) -> void:
	if bank:
		bank_amount = amount
		open_bank()
	else:
		shop_amount = 30 if amount < 0 else amount
		open_shop(shop_role)


func _shop_id_for_role(role: String) -> String:
	var lower := role.to_lower()
	if "fishing" in lower:
		return "fishing"
	if "arcane" in lower or "magic" in lower:
		return "magic"
	if "hunter" in lower:
		return "hunter"
	if "smith" in lower:
		return "smith"
	if "mire" in lower or "sable" in lower:
		return "mirehaven"
	if "frostmere" in lower or "provision" in lower or "embercross" in lower:
		return "embercross"
	return "general"
