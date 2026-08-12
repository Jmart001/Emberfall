extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	root.get_node("GameState").new_game()
	var world := (
		load("res://scenes/greenrest/greenrest.tscn") as PackedScene
	).instantiate()
	root.add_child(world)
	await process_frame
	await process_frame

	var rock: Node3D
	var tree: Node3D
	for resource in world.get_tree().get_nodes_in_group("skill_resources"):
		if resource.skill_kind == "rock" and rock == null:
			rock = resource
		elif resource.skill_kind == "tree" and tree == null:
			tree = resource
	if rock == null or tree == null:
		return _fail("World is missing mineable rocks or cuttable trees.")

	var rock_tile: Vector2i = world.logical_grid.world_to_tile(rock.global_position)
	var tree_tile: Vector2i = world.logical_grid.world_to_tile(tree.global_position)
	if not world.logical_grid.is_blocked(rock_tile):
		return _fail("The ore tile is walkable.")
	if not world.logical_grid.is_blocked(tree_tile):
		return _fail("The tree tile is walkable.")
	if not rock.requires_cardinal_interaction() or not tree.requires_cardinal_interaction():
		return _fail("Gathering resources allow diagonal interaction.")
	if not rock.mining_rock_visual.scale.is_equal_approx(Vector3.ONE * 0.95):
		return _fail("Mineable rock does not fit its 1.5m tile.")

	var diagonal := tree_tile + Vector2i(1, 1)
	if world.logical_grid.is_blocked(diagonal):
		diagonal = tree_tile + Vector2i(-1, -1)
	var destination: Vector2i = world.logical_grid.find_reachable_tile_in_range(
		world.logical_grid.tile_to_world(diagonal),
		tree_tile,
		1,
		true
	)
	if destination == diagonal:
		return _fail("A diagonal tile was accepted for woodcutting.")

	tree.successful_actions = 2
	tree._record_depletion()
	if not tree.harvestable_tree_visual.visible or tree.tree_stump_visual.visible:
		return _fail("The tree changed before the final woodcutting tick ended.")
	tree.depletion_pending_until = 1
	tree._process(0.0)
	if not tree.visible:
		return _fail("A depleted tree disappeared instead of leaving a stump.")
	if tree.harvestable_tree_visual.visible or not tree.tree_stump_visual.visible:
		return _fail("A depleted tree did not switch to its stump.")
	if not world.logical_grid.is_blocked(tree_tile):
		return _fail("The stump tile became walkable.")
	tree.depleted_until = 1
	tree._process(0.0)
	if not tree.harvestable_tree_visual.visible or tree.tree_stump_visual.visible:
		return _fail("The tree did not regrow from its stump.")

	print("GATHERING GRID RULES SMOKE PASSED")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
