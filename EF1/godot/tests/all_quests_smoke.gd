extends SceneTree

var failures: Array[String] = []
var game_state: Node
var quest_system: Node


func _initialize() -> void:
	game_state = root.get_node("GameState")
	quest_system = root.get_node("QuestSystem")
	_run.call_deferred()


func _run() -> void:
	game_state.new_game()
	game_state.data.quests[game_state.INTRO_QUEST].state = "complete"
	game_state.data.quests[game_state.INTRO_QUEST].stage = "complete"
	quest_system.ensure_quests()

	# Main quest 2.
	_expect(quest_system.interact("rowan").contains("started"), "start Shadows")
	for index in 3:
		game_state.add_item("Goblin hide", 1, false)
		quest_system.record_kill("goblin")
	_expect(game_state.quest_stage("shadows_over_pineholt") == "return", "Shadows kill gate")
	quest_system.interact("rowan")
	_expect(game_state.quest_state("shadows_over_pineholt") == "complete", "complete Shadows")

	# Main quest 3 and the first/repeat Warden split.
	quest_system.interact("mira")
	quest_system.record_kill("guardian")
	_expect(game_state.item_count("Barrow key") == 1, "guardian seal-key")
	quest_system.record_kill("warden")
	_expect(game_state.item_count("Ember relic") == 1, "first Warden relic")
	_expect(bool(game_state.data.get("barrow_chest_ready", false)), "first Warden chest")
	quest_system.claim_barrow_chest()
	quest_system.interact("mira")
	_expect(game_state.quest_state("beneath_the_ashen_barrow") == "complete", "complete Barrow")
	var runs_before := int(game_state.data.get("barrow_runs", 0))
	quest_system.record_kill("warden")
	_expect(bool(game_state.data.get("barrow_chest_ready", false)), "repeat Warden chest")
	quest_system.claim_barrow_chest()
	_expect(int(game_state.data.get("barrow_runs", 0)) == runs_before + 1, "repeat Warden run")

	# Main quest 4.
	quest_system.interact("king")
	for npc_id in ["torren", "alaric", "rowan"]:
		quest_system.interact(npc_id)
	quest_system.interact("yara")
	quest_system.interact("harker")
	for item_name in ["Raw riverfish", "Copper ore", "Logs"]:
		game_state.add_item(item_name, 1, false)
	quest_system.interact("harker")
	quest_system.record_kill("ashwrightRenn")
	quest_system.interact("kessa")
	quest_system.record_kill("unboundConstruct")
	quest_system.interact("king")
	_expect(game_state.quest_state("the_ashwrights_gambit") == "complete", "complete Gambit")

	# Kill side quests.
	for spec in [
		["willow", "boar", 3, "the_boar_hunt"],
		["vale", "spider", 4, "silk_and_cinders"],
		["mara", "bandit", 4, "the_broken_road"],
	]:
		quest_system.interact(spec[0])
		for index in int(spec[2]):
			quest_system.record_kill(spec[1])
		quest_system.interact(spec[0])
		_expect(game_state.quest_state(spec[3]) == "complete", "complete %s" % spec[3])

	# Fetch side quests.
	quest_system.interact("tamsin")
	for item_name in ["Raw boar meat", "Cabbage", "Wild herb"]:
		game_state.add_item(item_name, 1, false)
	quest_system.interact("tamsin")
	_expect(game_state.quest_state("hearth_and_home") == "complete", "complete Hearth")
	quest_system.interact("sable")
	game_state.add_item("Bog moss", 4, false)
	quest_system.interact("sable")
	_expect(game_state.quest_state("a_cure_for_sablemarsh") == "complete", "complete Cure")

	if failures.is_empty():
		print("QUESTS_TEST main=4 side=5 warden_first=true warden_repeat=true all_complete=true")
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)


func _expect(condition: bool, label: String) -> void:
	if not condition:
		failures.append(label)
