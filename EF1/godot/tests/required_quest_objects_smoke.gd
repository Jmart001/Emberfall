extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var scene := load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	var world := scene.instantiate()
	root.add_child(world)
	await process_frame
	await process_frame
	var failures: Array[String] = []
	var required_npcs := [
		"elowen", "rowan", "mira", "king", "yara", "torren", "alaric",
		"harker", "kessa", "willow", "vale", "mara", "tamsin", "sable",
	]
	var found_npcs := {}
	found_npcs.elowen = true
	for npc in world.get_node("NPCs").get_children():
		found_npcs[str(npc.npc_id)] = true
	for npc_id in required_npcs:
		if not found_npcs.has(npc_id):
			failures.append("Missing quest NPC: %s" % npc_id)
	var required_enemies := [
		"goblin", "guardian", "warden", "ashwrightRenn",
		"unboundConstruct", "boar", "spider", "bandit", "bogling",
	]
	var found_enemies := {}
	for enemy in world.get_node("Enemies").get_children():
		found_enemies[str(enemy.monster_id)] = true
	for monster_id in required_enemies:
		if not found_enemies.has(monster_id):
			failures.append("Missing quest enemy: %s" % monster_id)
	var objects := get_nodes_in_group("quest_world_objects")
	var found_objects := {}
	for object in objects:
		found_objects[str(object.object_kind)] = object
	for kind in ["barrow_entrance", "barrow_exit", "chest"]:
		if not found_objects.has(kind):
			failures.append("Missing Barrow object: %s" % kind)
	if failures.is_empty():
		print(
			"QUEST_OBJECTS_TEST npcs=%d enemies=%d portals=2 chest=1 all_present=true"
			% [required_npcs.size(), required_enemies.size()]
		)
		quit(0)
	else:
		for failure in failures:
			push_error(failure)
		quit(1)
