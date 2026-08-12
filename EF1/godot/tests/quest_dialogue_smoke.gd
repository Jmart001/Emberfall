extends SceneTree

var quest_system
var game_state


func _initialize() -> void:
	_run.call_deferred()


func _expect_dialogue(npc_id: String, label: String) -> bool:
	var text: String = quest_system.dialogue_for(npc_id)
	if text.length() >= 24:
		return true
	push_error("%s quest dialogue is missing for %s." % [npc_id, label])
	return false


func _run() -> void:
	quest_system = root.get_node("QuestSystem")
	game_state = root.get_node("GameState")
	quest_system.ensure_quests()
	var failed := false
	var quests: Dictionary = game_state.data.quests

	quests.shadows_over_pineholt.state = "available"
	quests.shadows_over_pineholt.stage = "available"
	failed = not _expect_dialogue("rowan", "quest offer") or failed
	quests.beneath_the_ashen_barrow.state = "available"
	quests.beneath_the_ashen_barrow.stage = "available"
	failed = not _expect_dialogue("mira", "quest offer") or failed
	quests.the_ashwrights_gambit.state = "available"
	quests.the_ashwrights_gambit.stage = "available"
	failed = not _expect_dialogue("king", "quest offer") or failed

	quests.the_ashwrights_gambit.state = "active"
	quests.the_ashwrights_gambit.stage = "rumors"
	quests.the_ashwrights_gambit.rumors = []
	for npc_id in ["rowan", "torren", "alaric"]:
		failed = not _expect_dialogue(npc_id, "rumor stage") or failed
	quests.the_ashwrights_gambit.stage = "yara"
	failed = not _expect_dialogue("yara", "report stage") or failed
	quests.the_ashwrights_gambit.stage = "harker"
	failed = not _expect_dialogue("harker", "camp stage") or failed
	quests.the_ashwrights_gambit.stage = "kessa"
	failed = not _expect_dialogue("kessa", "confrontation stage") or failed

	for spec in [
		["the_boar_hunt", "willow"],
		["silk_and_cinders", "vale"],
		["the_broken_road", "mara"],
		["hearth_and_home", "tamsin"],
		["a_cure_for_sablemarsh", "sable"],
	]:
		quests[spec[0]].state = "available"
		quests[spec[0]].stage = "available"
		failed = not _expect_dialogue(spec[1], "side quest offer") or failed

	var scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world = scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	await process_frame
	var rowan = world.get_node("NPCs/Rowan")
	quests.shadows_over_pineholt.state = "available"
	quests.shadows_over_pineholt.stage = "available"
	world._show_npc_dialogue(rowan)
	world._interact_current_quest()
	if (
		not world.dialogue_panel.visible
		or not world.dialogue_result_only
		or world.dialogue_text.text.is_empty()
	):
		push_error("Quest result did not remain in the chat dialogue panel.")
		failed = true

	print("QUEST_DIALOGUE_TEST story=true side=true results_in_chat=true")
	quit(1 if failed else 0)
