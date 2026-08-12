extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world := scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	await process_frame
	var ui = world.get_node("UI")
	var failures: Array[String] = []
	for property_name in [
		"sidebar", "quest_tracker", "chat_text", "modal", "context_menu",
		"action_bar", "special_button", "xp_drop_root", "level_banner",
		"region_banner", "status_effect_label", "save_status_label",
		"death_overlay", "chat_panel", "location_label",
	]:
		if ui.get(property_name) == null:
			failures.append("Missing UI element: %s" % property_name)
	var viewport_size := ui.get_viewport().get_visible_rect().size
	var expected_player_center := Vector2(
		(viewport_size.x - ui.sidebar.size.x) * 0.5,
		(viewport_size.y - ui.chat_panel.size.y) * 0.5
	)
	var projected_player_center: Vector2 = world.camera.unproject_position(
		world.player.global_position + Vector3.UP
	)
	if projected_player_center.distance_to(expected_player_center) > 2.0:
		failures.append(
			"Player is centered at %s instead of playable center %s."
			% [projected_player_center, expected_player_center]
		)
	if ui.tab_buttons.size() != 5:
		failures.append("Expected five 2D navigation tabs.")
	if ui.get_node_or_null("WikiButton") == null:
		failures.append("Wiki button is missing.")
	if (
		ui.quest_tracker.mouse_filter != Control.MOUSE_FILTER_IGNORE
		or ui.quest_text.mouse_filter != Control.MOUSE_FILTER_IGNORE
		or world.status_label.mouse_filter != Control.MOUSE_FILTER_IGNORE
	):
		failures.append("On-screen instructions still intercept world clicks.")
	if ui.chat_panel.get_global_rect().end.x > ui.sidebar.get_global_rect().position.x + 0.5:
		failures.append("Bottom HUD extends beneath the sidebar.")
	for bottom_action in [
		"Map", "Wiki", "Run", "Home", "Sound", "Tile reader",
		"Cancel", "Save", "Admin", "Settings",
	]:
		if (
			ui.chat_panel.find_child(
				"Bottom%sButton" % bottom_action, true, false
			)
			== null
		):
			failures.append("Bottom HUD action is missing: %s." % bottom_action)
	if (
		ui.chat_text.get_v_scroll_bar() == null
		or not ui.chat_text.scroll_active
		or ui.location_label.text.is_empty()
	):
		failures.append("Chat scrolling or location information is missing.")
	var chat_console := (
		ui.chat_panel.find_child("ChatConsole", true, false) as Control
	)
	var hotkey_strip := (
		ui.chat_panel.find_child("HotkeyStrip", true, false) as Control
	)
	if (
		chat_console == null
		or hotkey_strip == null
		or hotkey_strip.get_global_rect().end.y
			> chat_console.get_global_rect().position.y + 0.5
	):
		failures.append("The chat console covers the bottom hotkeys.")
	ui._open_character_manager()
	await process_frame
	if (
		not ui.modal.visible
		or ui.current_modal_kind != "characters"
		or ui.modal.find_child("NewCharacterButton", true, false) == null
	):
		failures.append("The Characters button does not open the character roster.")
	ui.modal.visible = false
	var collapsed_chat_top: float = ui.chat_panel.offset_top
	ui._toggle_chat_expanded()
	if (
		not ui.chat_expanded
		or ui.chat_panel.offset_top >= collapsed_chat_top
	):
		failures.append("Chat expand control does not reveal more history.")
	ui._toggle_chat_expanded()
	world.player.global_position = (
		world.elowen.global_position + Vector3(1.5, 0.0, 0.0)
	)
	world._show_npc_dialogue(world.elowen)
	await process_frame
	if (
		world.dialogue_panel.get_parent().name != "ChatConsole"
		or not world.dialogue_panel.visible
		or world.dialogue_name.text != world.elowen.display_name
		or world.dialogue_actions.get_child_count() < 1
		or ui.chat_panel.offset_top > -279.0
	):
		failures.append(
			"NPC dialogue mismatch parent=%s visible=%s speaker=%s actions=%d top=%.1f."
			% [
				world.dialogue_panel.get_parent().name,
				world.dialogue_panel.visible,
				world.dialogue_name.text,
				world.dialogue_actions.get_child_count(),
				ui.chat_panel.offset_top,
			]
		)
	world._close_dialogue()
	if world.dialogue_panel.visible or ui.chat_panel.offset_top != -168.0:
		failures.append("Closing NPC dialogue did not restore the chat box.")
	ui._select_tab("Pack")
	await process_frame
	await process_frame
	var inventory_grid: GridContainer
	for child in ui.content.get_children():
		if child is GridContainer:
			inventory_grid = child
	if (
		ui.sidebar_scroll.vertical_scroll_mode
		!= ScrollContainer.SCROLL_MODE_DISABLED
		or ui.sidebar_scroll.scroll_vertical != 0
	):
		failures.append("Pack tab still scrolls.")
	if (
		inventory_grid == null
		or inventory_grid.columns != 4
		or inventory_grid.get_child_count() != 30
	):
		failures.append(
			"Pack tab grid mismatch: %s slots."
			% (
				"missing"
				if inventory_grid == null
				else str(inventory_grid.get_child_count())
			)
		)
	elif inventory_grid.size.x < 250.0:
		failures.append("Pack grid does not fill the sidebar width.")
	elif not ui.sidebar_scroll.get_global_rect().encloses(
		inventory_grid.get_child(29).get_global_rect()
	):
		failures.append("The final backpack slot is outside the visible Pack tab.")
	var expected_pack_heading := (
		"BACKPACK %d/30" % root.get_node("GameState").used_inventory_slots()
	)
	var heading_found := false
	for child in ui.content.get_children():
		if child is Label and child.text == expected_pack_heading:
			heading_found = true
	if not heading_found:
		failures.append("Pack heading does not show the 30-slot capacity.")
	ui._select_tab("Skills")
	await process_frame
	await process_frame
	var skill_grid := ui.content.get_node_or_null("SkillGrid") as GridContainer
	if (
		ui.sidebar_scroll.vertical_scroll_mode
		!= ScrollContainer.SCROLL_MODE_DISABLED
		or ui.sidebar_scroll.scroll_vertical != 0
	):
		failures.append("Skills tab still scrolls.")
	if (
		skill_grid == null
		or skill_grid.columns != 3
		or skill_grid.get_child_count() != 20
	):
		failures.append("Skills tab does not contain the full three-column grid.")
	elif skill_grid.size.x < 250.0:
		failures.append("Skills grid does not fill the sidebar width.")
	elif not ui.sidebar_scroll.get_global_rect().encloses(
		skill_grid.get_child(19).get_global_rect()
	):
		failures.append("The final skill is outside the visible Skills tab.")
	if skill_grid != null:
		var attack_tile := skill_grid.get_node_or_null("SkillTile_Attack") as Button
		var attack_progress := (
			attack_tile.get_node_or_null("SkillProgress") as ProgressBar
			if attack_tile != null
			else null
		)
		if (
			attack_tile == null
			or attack_progress == null
			or not attack_tile.tooltip_text.contains("XP")
		):
			failures.append("Skill level and XP progression are incomplete.")
	ui._select_tab("Gear")
	await process_frame
	var equipment_grid := ui.content.get_node_or_null("EquipmentGrid") as GridContainer
	if (
		equipment_grid == null
		or equipment_grid.columns != 4
		or equipment_grid.get_child_count() != 7
	):
		failures.append("Gear tab equipment grid does not match the 2D layout.")
	for style_name in ["Accurate", "Aggressive", "Defensive"]:
		if ui.content.get_node_or_null("CombatStyle_%s" % style_name) == null:
			failures.append("Missing combat style control: %s." % style_name)
	ui._set_combat_style("aggressive")
	if str(root.get_node("GameState").data.combat_style) != "aggressive":
		failures.append("Combat style selection is not saved.")
	ui._select_tab("Journal")
	await process_frame
	for journal_tab in ["Quests", "Bestiary", "Collection", "Discovery"]:
		if (
			ui.content.find_child(
				"JournalTab_%s" % journal_tab, true, false
			)
			== null
		):
			failures.append("Journal section is missing: %s." % journal_tab)
	var journal_tabs := (
		ui.content.get_node_or_null("JournalPrimaryTabs") as HBoxContainer
	)
	if journal_tabs == null or journal_tabs.size.x < 235.0:
		failures.append("Journal navigation collapsed instead of filling the sidebar.")
	var quest_entry := (
		ui.content.get_node_or_null("QuestEntry_a_wanderer_in_greenrest")
		as Button
	)
	if quest_entry == null:
		failures.append("Journal quest list is missing the Greenrest quest.")
	else:
		quest_entry.pressed.emit()
		await process_frame
		if (
			not ui.modal.visible
			or ui.current_modal_kind != "quest"
			or ui.modal.find_child("QuestDetailObjective", true, false) == null
			or ui.modal.find_child("QuestDetailReward", true, false) == null
			or ui.modal.find_child("QuestDetailClose", true, false) == null
		):
			failures.append("Quest details do not open in the complete modal view.")
		ui.modal.visible = false
	for section_name in ["quests", "bestiary", "collection", "discovery"]:
		ui._set_journal_section(section_name)
		await process_frame
		if absf(ui.sidebar.size.x - 285.0) > 0.5:
			failures.append(
				"Journal section %s resized the sidebar to %.1f."
				% [section_name, ui.sidebar.size.x]
			)
	for fixed_tab in ["Pack", "Skills", "Gear", "Prayer", "Journal"]:
		ui._select_tab(fixed_tab)
		await process_frame
		if (
			absf(ui.sidebar.size.x - 285.0) > 0.5
			or absf(
				ui.sidebar.get_global_rect().end.x
				- ui.get_viewport().get_visible_rect().end.x
			) > 0.5
		):
			failures.append(
				"Right navigation changed size or position on %s." % fixed_tab
			)
	var sidebar_right: float = ui.sidebar.get_global_rect().end.x
	for tab_name in ui.tab_buttons:
		var tab: Button = ui.tab_buttons[tab_name]
		if tab.get_global_rect().end.x > sidebar_right + 0.5:
			failures.append("Navigation tab is cut off: %s" % tab_name)
	ui.show_region("Greenrest Vale")
	if ui.region_banner.text != "Greenrest Vale":
		failures.append("Region notification failed.")
	ui.set_status_effect("Poisoned")
	if not ui.status_effect_label.visible:
		failures.append("Status effect notification failed.")
	var xp_children: int = ui.xp_drop_root.get_child_count()
	root.get_node("GameState").add_skill_xp("Attack", 25)
	await process_frame
	if ui.xp_drop_root.get_child_count() <= xp_children:
		failures.append("XP drop notification failed.")
	if (
		ui.xp_drop_root.anchor_left != 1.0
		or ui.xp_drop_root.offset_right > -285.0
		or ui.xp_drop_root.mouse_filter != Control.MOUSE_FILTER_IGNORE
	):
		failures.append("XP drops are not positioned at the playable top-right.")
	ui.show_death_screen("Test")
	if not ui.death_overlay.visible:
		failures.append("Death overlay failed.")
	ui.death_overlay.visible = false
	ui.open_world_map()
	await process_frame
	await process_frame
	await process_frame
	var map_control = ui.modal.find_child("WorldMapControl", true, false)
	var map_scroll := ui.modal.get_child(0) as ScrollContainer
	var map_close := ui.modal.find_child("MapCloseButton", true, false) as Button
	if map_control == null or map_control.terrain.length() != 192 * 160:
		failures.append("Interactive world map failed.")
	else:
		if (
			map_scroll.vertical_scroll_mode
			!= ScrollContainer.SCROLL_MODE_DISABLED
			or map_scroll.horizontal_scroll_mode
			!= ScrollContainer.SCROLL_MODE_DISABLED
		):
			failures.append("World map still requires scrolling.")
		if (
			map_close == null
			or not ui.modal.get_global_rect().encloses(map_close.get_global_rect())
		):
			failures.append("World map close button is not always visible.")
		if map_control.objective_tile.x < 0.0:
			failures.append("Current quest objective is not pinged on the map.")
		var rendered_size = Vector2(map_control.MAP_SIZE) * map_control.zoom
		var expected_pan = (map_control.size - rendered_size) * 0.5
		if (
			rendered_size.x <= map_control.size.x
			and absf(map_control.pan.x - expected_pan.x) > 1.0
		):
			failures.append("World map was not horizontally centered.")
		if (
			rendered_size.y <= map_control.size.y
			and absf(map_control.pan.y - expected_pan.y) > 1.0
		):
			failures.append("World map was not vertically centered.")
	ui.open_shop("fishing")
	await process_frame
	var expected_modal_x := (
		ui.get_viewport().get_visible_rect().size.x - 285.0
	) * 0.5
	if absf(ui.modal.get_global_rect().get_center().x - expected_modal_x) > 1.0:
		failures.append(
			"Shop modal center %.1f expected %.1f."
			% [ui.modal.get_global_rect().get_center().x, expected_modal_x]
		)
	ui.open_wiki()
	await process_frame
	var wiki_grid = ui.modal.find_child("WikiItemGrid", true, false)
	if (
		wiki_grid == null
		or wiki_grid.get_child_count() != root.get_node("ItemCatalog").items.size()
	):
		failures.append("Wiki does not contain every catalog item.")
	var game_state = root.get_node("GameState")
	game_state.data.inventory["Cooked marsh eel"] = 1
	game_state.data.health = game_state.data.max_health
	game_state.data.poison = 2
	game_state.use_consumable("Cooked marsh eel")
	if int(game_state.data.poison) != 0:
		failures.append("Cooked marsh eel does not match its poison-cure wiki entry.")
	ui.open_skilling_station("workbench")
	await process_frame
	var recipe_grid = ui.modal.find_child("SkillRecipeGrid", true, false)
	if (
		recipe_grid == null
		or recipe_grid.columns != 4
		or recipe_grid.get_child_count() != 3
	):
		failures.append("Crafting does not use the OSRS-style recipe grid.")
	var named_npcs := 0
	for npc in world.get_node("NPCs").get_children():
		if npc.get_node_or_null("Name") != null:
			named_npcs += 1
	var named_enemies := 0
	for enemy in world.get_node("Enemies").get_children():
		if enemy.get_node_or_null("Name") != null and enemy.get_node_or_null("Health") != null:
			named_enemies += 1
	if named_npcs < 14:
		failures.append("NPC overhead names missing.")
	if named_enemies < 9:
		failures.append("Enemy names/health missing.")
	if failures.is_empty():
		print(
			"UI_TEST tabs=5 vitals=5 xp=true levels=true regions=true "
			+ "status=true death=true save=true map=true wiki=true entities=true"
		)
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
