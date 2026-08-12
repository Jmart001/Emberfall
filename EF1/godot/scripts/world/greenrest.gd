extends Node3D

const LogicalGridClass := preload("res://scripts/world/logical_grid.gd")
const NpcScene := preload("res://scenes/npcs/npc.tscn")
const TestResourceScene := preload("res://scenes/world/test_resource.tscn")
const EnemyScene := preload("res://scenes/enemies/enemy.tscn")
const InteractiveDoorClass := preload("res://scripts/world/interactive_door.gd")
const QuestWorldObjectClass := preload("res://scripts/world/quest_world_object.gd")
const GravestoneClass := preload("res://scripts/world/gravestone.gd")
const BossRoomClass := preload("res://scripts/world/boss_room.gd")
const GRID_DIMENSIONS := Vector2i(192, 160)
const GRID_ORIGIN := Vector3(-144.0, 0.0, -120.0)
const WALKABLE := [0, 1, 5, 8, 10, 11, 12, 13]
const WALL_TILE := 4
const FENCE_TILE := 7
const PLAYER_SPAWN := Vector2i(174, 44)
const ELOWEN_TILE := Vector2i(171, 40)
const CAMERA_ROTATE_SPEED := 1.7
const CAMERA_DRAG_SENSITIVITY := 0.008
const CAMERA_ZOOM_STEP := 2.0
const CAMERA_MIN_DISTANCE := 10.0
const CAMERA_MAX_DISTANCE := 34.0
const MOVEMENT_CLICK_COLOR := Color("f0d04f")
const ACTION_CLICK_COLOR := Color("dc4138")
const CLICK_MARKER_MINIMUM_TIME := 0.35
const INTRO_QUEST := "a_wanderer_in_greenrest"
const INTRO_FISH_SPOTS := [
	Vector2i(149, 88),
	Vector2i(152, 88),
	Vector2i(148, 88),
	Vector2i(147, 87),
]
const INTRO_COOKING_RANGE := Vector2i(161, 35)
const LANDMARK_TREE_TILE := Vector2i(96, 150)
const BARROW_ENTRANCE_TILE := Vector2i(9, 64)
const BARROW_GRAVE_TILE := Vector2i(10, 64)
const TIDEWARDEN_ENTRANCE_TILE := Vector2i(172, 47)
const TIDEWARDEN_DEF := {
	"name": "The Tidewarden",
	"hp": 300,
	"maxHit": 9,
	"attackSpeed": 5,
	"combatLevel": 110,
	"xp": 700,
	"boss": true,
	"color": "#2f6d7a",
	"drops": [
		["coins", 220, 400],
		["emberRune", 10, 22],
		["ashenShard", 1, 3, 0.6],
	],
}
# Boss-fight beat cycle: End A -> middle dock -> End B -> middle -> (repeat).
const BOSS_BEATS := ["A", "MID", "B", "MID"]
const KENNEY_CAMP_ROOT := (
	"res://assets/third_party/kenney_nature/Models/GLTF format/"
)
const NORTHERN_CAMP_TENTS := [
	{
		"name": "NorthernTentWest",
		"model": "tent_detailedClosed.glb",
		"tile": Vector2i(16, 8),
		"rotation": 0.35,
		"half_size": Vector2i(1, 1),
	},
	{
		"name": "NorthernTentEast",
		"model": "tent_detailedOpen.glb",
		"tile": Vector2i(25, 9),
		"rotation": -0.55,
		"half_size": Vector2i(1, 1),
	},
	{
		"name": "NorthernTentSouth",
		"model": "tent_smallClosed.glb",
		"tile": Vector2i(17, 15),
		"rotation": 0.2,
		"half_size": Vector2i(1, 1),
	},
]
const NORTHERN_CAMP_FIRE_TILE := Vector2i(21, 13)
const BARROW_DOOR_DEFS := [
	{"tile": Vector2i(12, 73), "a": 0, "b": 1},
	{"tile": Vector2i(19, 73), "a": 1, "b": 2},
	{"tile": Vector2i(12, 80), "a": 3, "b": 4},
	{"tile": Vector2i(19, 80), "a": 4, "b": 5},
	{"tile": Vector2i(12, 88), "a": 6, "b": 7},
	{"tile": Vector2i(19, 88), "a": 7, "b": 8},
	{"tile": Vector2i(8, 77), "a": 0, "b": 3},
	{"tile": Vector2i(8, 84), "a": 3, "b": 6},
	{"tile": Vector2i(15, 77), "a": 1, "b": 4},
	{"tile": Vector2i(15, 84), "a": 4, "b": 7},
	{"tile": Vector2i(23, 77), "a": 2, "b": 5},
	{"tile": Vector2i(23, 84), "a": 5, "b": 8},
]
const BARROW_ROOM_DEFS := [
	{"cell": 0, "kind": "guardian", "tile": Vector2i(9, 74)},
	{"cell": 1, "kind": "guardian", "tile": Vector2i(15, 73)},
	{"cell": 2, "kind": "guardian", "tile": Vector2i(24, 73)},
	{"cell": 3, "kind": "skeleton", "tile": Vector2i(9, 80)},
	{"cell": 4, "kind": "guardian", "tile": Vector2i(15, 80)},
	{"cell": 5, "kind": "bat", "tile": Vector2i(24, 80)},
	{"cell": 6, "kind": "spider", "tile": Vector2i(9, 87)},
	{"cell": 7, "kind": "guardian", "tile": Vector2i(15, 87)},
]
const SHOP_NPCS := {
	"alaric": "general",
	"murphy": "fishing",
	"corvin": "magic",
	"orin": "hunter",
	"torren": "smith",
	"fenwick": "mirehaven",
	"mara": "embercross",
}
const SHOP_DIALOGUE := {
	"alaric": "Supplies for the wastes road, friend - you will need them.",
	"murphy": "The water tastes of ash some mornings now. Never used to. Even the fish feel it stirring, down under the earth.",
	"corvin": "Every rune I sell was ground from stone that remembers the Emberfall. Handle them with respect.",
	"orin": "I track beasts that flee the ash into my woods. Aim true - the prey runs angrier than it once did.",
	"torren": "Ember-heat forges the finest steel - and the mountain gives more each day.",
	"fenwick": "Dry goods in a drowning marsh - and the fever only worsens. Mind the boglings; they crawl up thicker every season.",
	"mara": "Provisions before the snowfields, traveller. Frostmere endures.",
}
const BANKER_DIALOGUE := (
	"Welcome to the Bank of Emberfall. Your belongings are held securely "
	+ "and can be withdrawn from any of our branches. Would you like to "
	+ "access your bank account?"
)

@onready var player: CharacterBody3D = $Player
@onready var elowen: Node3D = $Elowen
@onready var camera: Camera3D = $WorldCamera
@onready var destination_marker: MeshInstance3D = $DestinationMarker
@onready var status_label: Label = $UI/Status
@onready var renderer: LegacyWorldRenderer = $LegacyWorld

var logical_grid
var input_ready := false
var pending_interaction: Node3D
var pending_interaction_action := "talk"
var pending_interaction_range := 1
var pending_interaction_cardinal := false
var combat_enemy: Node3D
var boss_room: BossRoom
var boss_enemy: Node3D
var boss_fight_active := false
var boss_beat_index := 0
var boss_water_target := 0.0
var boss_waves_on := false
var boss_attack_mage := false
var boss_wave_active := false
var boss_wave_cd := 0.0
var boss_wave_front := 0.0
var boss_wave_hit := false
var boss_flood_timer := 0.0
var boss_attack_timer := 0.0
var player_attack_timer := 0.0
var enemy_attack_timer := 0.0
var sigil_cooldown := 4.8
var active_sigil: Node3D
var sigil_tiles: Array[Vector2i] = []
var sigil_resolve_timer := 0.0
var sigil_enraged := false
var region_check_elapsed := 0.0
var current_region := ""
var dialogue_panel: PanelContainer
var dialogue_name: Label
var dialogue_text: Label
var dialogue_speaker := ""
var dialogue_pages: Array[String] = []
var dialogue_page_index := 0
var dialogue_result_only := false
var dialogue_target: Node3D
var dialogue_actions: Container
var entity_hover_label: Label
var camera_yaw := deg_to_rad(36.87)
var camera_pitch := deg_to_rad(35.0)
var camera_distance := 24.0
var camera_dragging := false
var click_marker_time := 0.0
var enemy_ai_elapsed := 0.0
const ENEMY_AI_INTERVAL := 0.25
var intro_fishing_objects: Array[Node3D] = []
var intro_cooking_range: Node3D
var active_skill_target: Node3D
var active_skill_timer := 0.0
var player_gravestone: Node3D
var barrow_doors: Dictionary = {}


func _ready() -> void:
	status_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	status_label.visible = false
	_build_entity_hover_label()
	logical_grid = LogicalGridClass.new(GRID_DIMENSIONS, GRID_ORIGIN)
	logical_grid.set_elevation_data(renderer.world_data.get("elevation", []))
	logical_grid.set_terrain_data(str(renderer.world_data.get("terrain", "")))
	for y in range(GRID_DIMENSIONS.y):
		for x in range(GRID_DIMENSIONS.x):
			var tile := Vector2i(x, y)
			var terrain: int = renderer.tile_value(tile)
			if (
				terrain not in WALKABLE
				and terrain != WALL_TILE
				and terrain != FENCE_TILE
				and not (terrain == 3 and not renderer.has_tree_at(tile))
			):
				logical_grid.set_blocked(Vector2i(x, y), true, false)
	for edge in renderer.wall_edges():
		logical_grid.set_edge_blocked(
			edge.wall_tile,
			edge.interior_tile,
			true,
			false
		)
	_spawn_structure_doors()
	for y in range(LANDMARK_TREE_TILE.y - 1, LANDMARK_TREE_TILE.y + 2):
		for x in range(LANDMARK_TREE_TILE.x - 1, LANDMARK_TREE_TILE.x + 2):
			logical_grid.set_blocked(Vector2i(x, y), true, false)
	_spawn_northern_camp()
	_spawn_legacy_npcs()
	_spawn_skill_world()
	_spawn_quest_world_objects()
	_spawn_test_yard()
	_spawn_enemies()
	_build_tidewarden_room()
	logical_grid.rebuild()
	# Self-heal stale saves: a cleared-room count is only valid during an active run.
	# Without an active run, force room 0 so no chamber doors linger open from an old run.
	if not bool(GameState.data.get("barrow_run_active", false)):
		GameState.data.barrow_room = 0
	_restore_barrow_doors()
	restore_player_from_save()
	elowen.global_position = logical_grid.tile_to_world(ELOWEN_TILE)
	if elowen.has_method("configure_wander"):
		elowen.configure_wander(logical_grid, ELOWEN_TILE)
	_build_dialogue_ui()
	_restore_intro_quest_world()
	_spawn_saved_gravestone()
	GameState.changed.connect(_refresh_intro_quest_markers)
	_enable_input.call_deferred()


func _spawn_northern_camp() -> void:
	var camp := Node3D.new()
	camp.name = "NorthernCamp"
	add_child(camp)
	for definition in NORTHERN_CAMP_TENTS:
		var packed := load(
			KENNEY_CAMP_ROOT + str(definition.model)
		) as PackedScene
		if packed == null:
			push_warning("Could not load northern camp tent: %s" % definition.model)
			continue
		var tent := packed.instantiate() as Node3D
		if tent == null:
			continue
		tent.name = str(definition.name)
		var tile: Vector2i = definition.tile
		tent.position = logical_grid.tile_to_world(tile, 0.0)
		tent.rotation.y = float(definition.rotation)
		camp.add_child(tent)
		_block_camp_footprint(tile, definition.half_size)

	var fire := TestResourceScene.instantiate()
	fire.name = "NorthernCampfire"
	fire.configure_skill("range", {
		"id": "northern_campfire",
		"name": "Northern campfire",
	})
	fire.position = logical_grid.tile_to_world(NORTHERN_CAMP_FIRE_TILE)
	fire.add_to_group("skill_resources")
	camp.add_child(fire)
	logical_grid.set_blocked(NORTHERN_CAMP_FIRE_TILE, true, false)


func _block_camp_footprint(center: Vector2i, half_size: Vector2i) -> void:
	for y in range(center.y - half_size.y, center.y + half_size.y + 1):
		for x in range(center.x - half_size.x, center.x + half_size.x + 1):
			logical_grid.set_blocked(Vector2i(x, y), true, false)


func _spawn_structure_doors() -> void:
	var door_entries: Array = []
	for entry in renderer.structure_data.get("edges", []):
		if str(entry.get("type", "")) == "door":
			door_entries.append(entry)
	var door_root := Node3D.new()
	door_root.name = "InteractiveDoors"
	add_child(door_root)
	var used: Dictionary = {}
	for index in range(door_entries.size()):
		if used.has(index):
			continue
		var pair_index := _find_door_pair(index, door_entries, used)
		var first_hinge := 0
		var second_hinge := 0
		if pair_index >= 0:
			used[pair_index] = true
			var first_center := _door_center(door_entries[index])
			var second_center := _door_center(door_entries[pair_index])
			var direction := Vector2i(
				int(door_entries[index].x2) - int(door_entries[index].x1),
				int(door_entries[index].y2) - int(door_entries[index].y1)
			)
			var first_is_lower := (
				first_center.z < second_center.z
				if direction.x != 0
				else first_center.x < second_center.x
			)
			first_hinge = -1 if first_is_lower else 1
			second_hinge = -first_hinge
		var first_door: Node3D = _create_door(
			door_entries[index],
			first_hinge,
			door_root
		)
		if pair_index >= 0:
			var second_door: Node3D = _create_door(
				door_entries[pair_index],
				second_hinge,
				door_root
			)
			first_door.set_partner(second_door)
			second_door.set_partner(first_door)
			var shared_tile := _shared_door_tile(
				door_entries[index],
				door_entries[pair_index]
			)
			if _is_barrow_door_tile(shared_tile):
				_register_barrow_door(
					shared_tile,
					[first_door, second_door],
					door_entries[index],
					door_root
				)


func _find_door_pair(index: int, entries: Array, used: Dictionary) -> int:
	var first: Dictionary = entries[index]
	var first_direction := Vector2i(
		int(first.x2) - int(first.x1),
		int(first.y2) - int(first.y1)
	)
	var first_center := Vector2(
		(float(first.x1) + float(first.x2)) * 0.5,
		(float(first.y1) + float(first.y2)) * 0.5
	)
	for candidate_index in range(index + 1, entries.size()):
		if used.has(candidate_index):
			continue
		var candidate: Dictionary = entries[candidate_index]
		var candidate_direction := Vector2i(
			int(candidate.x2) - int(candidate.x1),
			int(candidate.y2) - int(candidate.y1)
		)
		if (
			absi(first_direction.x) != absi(candidate_direction.x)
			or absi(first_direction.y) != absi(candidate_direction.y)
		):
			continue
		var candidate_center := Vector2(
			(float(candidate.x1) + float(candidate.x2)) * 0.5,
			(float(candidate.y1) + float(candidate.y2)) * 0.5
		)
		if is_equal_approx(first_center.distance_to(candidate_center), 1.0):
			return candidate_index
	return -1


func _shared_door_tile(first: Dictionary, second: Dictionary) -> Vector2i:
	var first_tiles := [
		Vector2i(int(first.x1), int(first.y1)),
		Vector2i(int(first.x2), int(first.y2)),
	]
	var second_tiles := [
		Vector2i(int(second.x1), int(second.y1)),
		Vector2i(int(second.x2), int(second.y2)),
	]
	for tile in first_tiles:
		if tile in second_tiles:
			return tile
	return Vector2i(-1, -1)


func _is_barrow_door_tile(tile: Vector2i) -> bool:
	for definition in BARROW_DOOR_DEFS:
		if definition.tile == tile:
			return true
	return false


func _register_barrow_door(
	tile: Vector2i,
	leaves: Array,
	edge: Dictionary,
	parent: Node3D
) -> void:
	for leaf in leaves:
		leaf.set_revealed(false)
	var barrier := MeshInstance3D.new()
	barrier.name = "SealedWall_%d_%d" % [tile.x, tile.y]
	var mesh := BoxMesh.new()
	var direction := Vector2i(
		int(edge.x2) - int(edge.x1),
		int(edge.y2) - int(edge.y1)
	)
	mesh.size = (
		Vector3(0.14, 2.25, 3.0)
		if direction.x != 0
		else Vector3(3.0, 2.25, 0.14)
	)
	mesh.material = renderer._stone_brick_material()
	barrier.mesh = mesh
	var first_center: Vector3 = leaves[0].position
	var second_center: Vector3 = leaves[1].position
	barrier.position = first_center.lerp(second_center, 0.5)
	barrier.position.y = (
		maxf(first_center.y, second_center.y) + 1.125
	)
	parent.add_child(barrier)
	barrow_doors[_barrow_tile_key(tile)] = {
		"tile": tile,
		"leaves": leaves,
		"barrier": barrier,
		"revealed": false,
	}


func _barrow_tile_key(tile: Vector2i) -> String:
	return "%d:%d" % [tile.x, tile.y]


func _create_door(entry: Dictionary, hinge_side: int, parent: Node3D) -> Node3D:
	var door: Node3D = InteractiveDoorClass.new()
	parent.add_child(door)
	door.configure(entry, _door_center(entry), hinge_side)
	door.state_changed.connect(_on_door_state_changed)
	var first := Vector2i(int(entry.x1), int(entry.y1))
	var second := Vector2i(int(entry.x2), int(entry.y2))
	logical_grid.set_edge_blocked(first, second, true, false)
	return door


func _door_center(entry: Dictionary) -> Vector3:
	var first := Vector2i(int(entry.x1), int(entry.y1))
	var second := Vector2i(int(entry.x2), int(entry.y2))
	var center: Vector3 = (
		logical_grid.tile_to_world(first, 0.0)
		+ logical_grid.tile_to_world(second, 0.0)
	) * 0.5
	center.y = maxf(logical_grid.surface_height(first), logical_grid.surface_height(second))
	return center


func _on_door_state_changed(
	first_tile: Vector2i,
	second_tile: Vector2i,
	is_open: bool
) -> void:
	logical_grid.set_edge_blocked(first_tile, second_tile, not is_open)


func _barrow_adjacent_cells(cell: int) -> Array[int]:
	var result: Array[int] = []
	for definition in BARROW_DOOR_DEFS:
		if int(definition.a) == cell:
			result.append(int(definition.b))
		elif int(definition.b) == cell:
			result.append(int(definition.a))
	return result


func _generate_barrow_route() -> Dictionary:
	var unlocked := {0: true}
	var order: Array[int] = [0]
	var via: Array[int] = []
	var locked: Array[int] = [1, 2, 3, 4, 5, 6, 7]
	while not locked.is_empty():
		var candidates: Array[Dictionary] = []
		for cell in locked:
			for neighbor in _barrow_adjacent_cells(cell):
				if unlocked.has(neighbor):
					candidates.append({"cell": cell, "from": neighbor})
		var pick: Dictionary = candidates.pick_random()
		var next_cell := int(pick.cell)
		unlocked[next_cell] = true
		locked.erase(next_cell)
		order.append(next_cell)
		via.append(int(pick.from))
	var warden_options: Array[int] = []
	for neighbor in _barrow_adjacent_cells(8):
		if unlocked.has(neighbor):
			warden_options.append(neighbor)
	var warden_from: int = warden_options.pick_random()
	order.append(8)
	via.append(warden_from)
	return {"order": order, "via": via}


func _ensure_barrow_run() -> void:
	if (
		not GameState.data.has("barrow_order")
		or GameState.data.get("barrow_order", []).size() != 9
	):
		var route := _generate_barrow_route()
		GameState.data.barrow_order = route.order
		GameState.data.barrow_via = route.via
		GameState.data.barrow_room = 0
		GameState.data.barrow_potential = 0
		GameState.mark_changed()
	_restore_barrow_doors()


func _restore_barrow_doors() -> void:
	for entry in barrow_doors.values():
		entry.barrier.visible = true
		entry.revealed = false
		for leaf in entry.leaves:
			leaf.set_meta("barrow_unlocked", false)
			leaf.set_revealed(false)
			leaf.set_open_immediate(false)
	var room := int(GameState.data.get("barrow_room", 0))
	var order: Array = GameState.data.get("barrow_order", [])
	var via: Array = GameState.data.get("barrow_via", [])
	for index in range(mini(room, mini(via.size(), order.size() - 1))):
		_reveal_barrow_connection(
			int(via[index]),
			int(order[index + 1]),
			false
		)
	logical_grid.rebuild()


func _reset_barrow_run(active := false) -> void:
	# Fresh run: new random route, room 0, all chamber doors resealed.
	# Mirrors the 2D game's resetBarrowRun() on entry / exit / home teleport / death.
	var route := _generate_barrow_route()
	GameState.data.barrow_order = route.order
	GameState.data.barrow_via = route.via
	GameState.data.barrow_room = 0
	GameState.data.barrow_potential = 0
	GameState.data.barrow_run_active = active
	GameState.mark_changed()
	_restore_barrow_doors()


func _reveal_barrow_connection(
	first_cell: int,
	second_cell: int,
	animate: bool
) -> bool:
	for definition in BARROW_DOOR_DEFS:
		if not (
			(int(definition.a) == first_cell and int(definition.b) == second_cell)
			or (int(definition.a) == second_cell and int(definition.b) == first_cell)
		):
			continue
		var entry: Dictionary = barrow_doors.get(
			_barrow_tile_key(definition.tile),
			{}
		)
		if entry.is_empty():
			return false
		entry.barrier.visible = false
		entry.revealed = true
		for leaf in entry.leaves:
			leaf.set_revealed(true)
		if animate:
			entry.leaves[0].perform_action()
		else:
			for leaf in entry.leaves:
				leaf.set_open_immediate(true)
		for leaf in entry.leaves:
			leaf.set_meta("barrow_unlocked", true)
		return true
	return false


func _advance_barrow_room(enemy: Node3D) -> void:
	if not bool(GameState.data.get("barrow_run_active", false)):
		return
	_ensure_barrow_run()
	var room := int(GameState.data.get("barrow_room", 0))
	var order: Array = GameState.data.get("barrow_order", [])
	var via: Array = GameState.data.get("barrow_via", [])
	if room >= 8 or room >= order.size():
		return
	var expected_cell := int(order[room])
	var defeated_tile: Vector2i = enemy.home_tile
	var matches_room := false
	for definition in BARROW_ROOM_DEFS:
		if (
			int(definition.cell) == expected_cell
			and str(definition.kind) == str(enemy.monster_id)
			and definition.tile == defeated_tile
		):
			matches_room = true
			break
	if not matches_room:
		return
	room += 1
	GameState.data.barrow_room = room
	GameState.data.barrow_potential = mini(
		100,
		int(GameState.data.get("barrow_potential", 0))
		+ int({"guardian": 10, "skeleton": 8, "spider": 7, "bat": 5}.get(
			str(enemy.monster_id),
			0
		))
	)
	GameState.mark_changed()
	if room >= order.size() or room - 1 >= via.size():
		return
	_reveal_barrow_connection(
		int(via[room - 1]),
		int(order[room]),
		true
	)
	$UI.show_game_message(
		(
			"The chamber falls silent. The Warden door grinds open."
			if int(order[room]) == 8
			else "The chamber falls silent. A passage opens to the next room."
		),
		Color("d5b56a")
	)


func _spawn_legacy_npcs() -> void:
	var npc_data: Array = renderer.world_data.get("npcs", [])
	for entry in npc_data:
		if str(entry.get("id", "")) == "elowen":
			continue
		var npc := NpcScene.instantiate()
		npc.name = _safe_node_name(str(entry.get("id", "npc")))
		npc.configure(entry)
		var tile := Vector2i(int(entry.get("x", 0)), int(entry.get("y", 0)))
		npc.position = logical_grid.tile_to_world(tile)
		npc.add_to_group("npcs")
		$NPCs.add_child(npc)
		npc.configure_wander(logical_grid, tile)


func _spawn_skill_world() -> void:
	var data: Dictionary = renderer.world_data.get("skill_data", {})
	var groups := {
		"fish": data.get("fish_spots", []),
		"rock": data.get("rocks", []),
		"tree": data.get("trees", []),
		"hunt": data.get("hunt_spots", []),
		"farm": data.get("farm_patches", []),
	}
	for kind in groups:
		for definition in groups[kind]:
			var resource := TestResourceScene.instantiate()
			resource.configure_skill(str(kind), definition)
			var tile := Vector2i(
				int(definition.get("x", 0)),
				int(definition.get("y", 0))
			)
			resource.position = logical_grid.tile_to_world(tile)
			resource.add_to_group("skill_resources")
			$GroundItems.add_child(resource)
			if kind in ["rock", "tree"]:
				logical_grid.set_blocked(tile, true, false)
			if kind == "fish" and tile in INTRO_FISH_SPOTS:
				intro_fishing_objects.append(resource)
	var stations: Dictionary = data.get("stations", {})
	for station_type in stations:
		var definition: Dictionary = stations[station_type]
		var station := TestResourceScene.instantiate()
		station.configure_skill(str(station_type), definition)
		var station_tile := Vector2i(
			int(definition.get("x", 0)),
			int(definition.get("y", 0))
		)
		station.position = logical_grid.tile_to_world(station_tile)
		station.add_to_group("skill_stations")
		$GroundItems.add_child(station)


func _spawn_quest_world_objects() -> void:
	var root := Node3D.new()
	root.name = "QuestWorldObjects"
	add_child(root)
	for definition in [
		{"kind": "barrow_entrance", "name": "Enter Ashen Barrow", "tile": Vector2i(9, 64), "to": Vector2i(6, 72)},
		{"kind": "barrow_exit", "name": "Climb to surface", "tile": Vector2i(6, 75), "to": Vector2i(9, 64)},
		{"kind": "chest", "name": "Warden chest", "tile": Vector2i(22, 86), "to": Vector2i.ZERO},
		{"kind": "tidewarden_entrance", "name": "Tidewarden's Descent", "tile": TIDEWARDEN_ENTRANCE_TILE, "to": BossRoomClass.ENTER_DEST_TILE},
		{"kind": "tidewarden_exit", "name": "Climb to surface", "tile": BossRoomClass.EXIT_PORTAL_TILE, "to": TIDEWARDEN_ENTRANCE_TILE},
	]:
		var object: Node3D = QuestWorldObjectClass.new()
		object.name = str(definition.kind).to_pascal_case()
		object.configure(str(definition.kind), str(definition.name), definition.to)
		object.position = logical_grid.tile_to_world(definition.tile)
		object.add_to_group("quest_world_objects")
		root.add_child(object)


func _safe_node_name(value: String) -> String:
	var result := value.to_pascal_case()
	return result if not result.is_empty() else "NPC"


func _spawn_test_yard() -> void:
	var banker := NpcScene.instantiate()
	banker.name = "YardBanker"
	banker.configure({
		"id": "yard_banker",
		"name": "Banker Willa",
		"role": "Bank of Emberfall",
		"color": "#795b9b",
		"dialogue": BANKER_DIALOGUE,
	})
	var banker_tile := Vector2i(184, 150)
	banker.position = logical_grid.tile_to_world(banker_tile)
	banker.add_to_group("npcs")
	$TestYard.add_child(banker)
	banker.configure_wander(logical_grid, banker_tile)

	var resources := [
		{"tile": Vector2i(177, 153), "kind": "hunt", "id": "yard_burrow", "name": "Rabbit burrow", "level": 1, "xp": 20},
		{"tile": Vector2i(179, 153), "kind": "tree", "id": "yard_tree", "name": "Tree", "level": 1, "xp": 14},
		{"tile": Vector2i(181, 153), "kind": "rock", "id": "yard_copper", "name": "Copper rock", "ore": "copperOre", "color": "#b87343", "level": 1, "xp": 12},
		{"tile": Vector2i(183, 153), "kind": "fish", "id": "yard_fish", "name": "Riverfish spot", "item": "rawFish", "catchName": "riverfish", "level": 1, "xp": 16, "chance": 0.78},
		{"tile": Vector2i(185, 153), "kind": "farm", "id": "yard_farm", "name": "Farm patch"},
		{"tile": Vector2i(187, 153), "kind": "range", "name": "Cooking fire"},
		{"tile": Vector2i(179, 156), "kind": "workbench", "name": "Greenrest crafting bench"},
		{"tile": Vector2i(181, 156), "kind": "furnace", "name": "Cinderforge furnace"},
		{"tile": Vector2i(183, 156), "kind": "anvil", "name": "Cinderforge anvil"},
		{"tile": Vector2i(185, 156), "kind": "altar", "name": "Frostmere altar"},
		{"tile": Vector2i(187, 156), "kind": "cauldron", "name": "Sablemarsh brewing cauldron"},
	]
	for definition in resources:
		var resource := TestResourceScene.instantiate()
		resource.configure_skill(str(definition.kind), definition)
		var tile: Vector2i = definition.tile
		resource.position = logical_grid.tile_to_world(tile)
		$TestYard.add_child(resource)
		logical_grid.set_blocked(tile, true, false)


func _spawn_enemies() -> void:
	var types: Dictionary = renderer.world_data.get("monster_types", {})
	var spawns: Array = renderer.world_data.get("monster_spawns", [])
	for entry in spawns:
		_spawn_enemy(
			str(entry[0]),
			Vector2i(int(entry[1]), int(entry[2])),
			types,
			false
		)
	for entry in [
		["rat", Vector2i(189, 153)],
		["goblin", Vector2i(189, 155)],
		["direWolf", Vector2i(189, 157)],
	]:
		_spawn_enemy(str(entry[0]), entry[1], types, true)
		_build_test_cage(entry[1], str(entry[0]))


func _build_tidewarden_room() -> void:
	boss_room = BossRoomClass.new()
	boss_room.build(self, logical_grid)
	_spawn_tidewarden_boss()


func _spawn_tidewarden_boss() -> void:
	var boss := EnemyScene.instantiate()
	boss.name = "Tidewarden"
	boss.configure("tidewarden", TIDEWARDEN_DEF)
	boss.set_footprint(BossRoomClass.BOSS_FOOTPRINT)
	boss.detection_range = 60
	boss.leash_range = 60
	boss.stationary = true
	var anchor: Vector2i = BossRoomClass.POS_A
	var spawn_position: Vector3 = _enemy_world_position(boss, anchor)
	boss.configure_ai(anchor, spawn_position, true)
	boss.position = spawn_position
	boss.defeated.connect(_on_enemy_defeated)
	$Enemies.add_child(boss)
	for occupied_tile in boss.occupied_tiles():
		logical_grid.set_blocked(occupied_tile, true, false)
	boss_enemy = boss


func _spawn_enemy(
	monster_id: String,
	tile: Vector2i,
	types: Dictionary,
	stationary := false
) -> void:
	if not types.has(monster_id):
		return
	var enemy := EnemyScene.instantiate()
	enemy.name = "%s_%d_%d" % [monster_id.to_pascal_case(), tile.x, tile.y]
	enemy.configure(monster_id, types[monster_id])
	var spawn_position: Vector3 = _enemy_world_position(enemy, tile)
	enemy.configure_ai(tile, spawn_position, stationary)
	enemy.position = spawn_position
	enemy.defeated.connect(_on_enemy_defeated)
	$Enemies.add_child(enemy)
	if stationary:
		for occupied_tile in enemy.occupied_tiles():
			logical_grid.set_blocked(occupied_tile, true, false)


func _enemy_world_position(enemy: Node3D, anchor_tile: Vector2i) -> Vector3:
	var tiles: Array[Vector2i] = enemy.occupied_tiles_at(anchor_tile)
	var result := Vector3.ZERO
	for tile in tiles:
		result += logical_grid.tile_to_world(tile)
	return result / float(tiles.size())


func _build_test_cage(tile: Vector2i, monster_id: String) -> void:
	var cage := Node3D.new()
	cage.name = "%sCage" % monster_id.to_pascal_case()
	cage.position = logical_grid.tile_to_world(tile, 0.0)
	$TestYard.add_child(cage)

	var material := StandardMaterial3D.new()
	material.albedo_color = Color("4d5356")
	material.metallic = 0.75
	material.roughness = 0.34

	for side in [Vector2i.UP, Vector2i.DOWN, Vector2i.RIGHT]:
		for offset_index in range(-2, 3):
			var offset := offset_index * 0.28
			var bar := MeshInstance3D.new()
			var bar_mesh := BoxMesh.new()
			bar_mesh.size = Vector3(0.07, 2.1, 0.07)
			bar.mesh = bar_mesh
			bar.material_override = material
			bar.position.y = 1.05
			if side.x == 0:
				bar.position.x = offset
				bar.position.z = side.y * 0.68
			else:
				bar.position.x = side.x * 0.68
				bar.position.z = offset
			cage.add_child(bar)

	for side in [Vector2i.UP, Vector2i.DOWN]:
		_add_cage_rail(
			cage,
			Vector3(0.0, 1.95, side.y * 0.68),
			Vector3(1.42, 0.09, 0.09),
			material
		)
	_add_cage_rail(
		cage,
		Vector3(0.68, 1.95, 0.0),
		Vector3(0.09, 0.09, 1.42),
		material
	)
	# Short west-side posts frame an open targeting gate.
	for z_offset in [-0.56, 0.56]:
		_add_cage_rail(
			cage,
			Vector3(-0.68, 1.05, z_offset),
			Vector3(0.07, 2.1, 0.07),
			material
		)

	var label := Label3D.new()
	label.text = "MONSTER CAGE"
	label.position = Vector3(0.0, 2.45, 0.0)
	label.modulate = Color("d7ad55")
	label.outline_size = 6
	label.font_size = 16
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	cage.add_child(label)


func _add_cage_rail(
	parent: Node3D,
	local_position: Vector3,
	size: Vector3,
	material: StandardMaterial3D
) -> void:
	var rail := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	rail.mesh = mesh
	rail.material_override = material
	rail.position = local_position
	parent.add_child(rail)


func restore_player_from_save() -> void:
	var saved: Dictionary = GameState.data.get(
		"player_tile", {"x": PLAYER_SPAWN.x, "y": PLAYER_SPAWN.y}
	)
	var requested := Vector2i(int(saved.get("x", PLAYER_SPAWN.x)), int(saved.get("y", PLAYER_SPAWN.y)))
	var tile: Vector2i = logical_grid.nearest_walkable(requested, 13)
	if tile.x < 0:
		tile = PLAYER_SPAWN
	player.cancel_movement()
	player.global_position = logical_grid.tile_to_world(tile)


func _unhandled_input(event: InputEvent) -> void:
	if (
		event is InputEventKey
		and event.pressed
		and not event.echo
		and event.keycode == KEY_H
	):
		_home_teleport()
		get_viewport().set_input_as_handled()
		return
	if event is InputEventMouseButton:
		var button := event as InputEventMouseButton
		if button.button_index == MOUSE_BUTTON_MIDDLE:
			camera_dragging = button.pressed
			get_viewport().set_input_as_handled()
			return
		if button.pressed and button.button_index == MOUSE_BUTTON_WHEEL_UP:
			camera_distance = maxf(CAMERA_MIN_DISTANCE, camera_distance - CAMERA_ZOOM_STEP)
			return
		if button.pressed and button.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			camera_distance = minf(CAMERA_MAX_DISTANCE, camera_distance + CAMERA_ZOOM_STEP)
			return
		if button.pressed and button.button_index == MOUSE_BUTTON_RIGHT:
			var context_target := _raycast_interactable(button.position)
			if context_target != null:
				$UI.show_click(button.position, true)
				if context_target.has_method("is_enemy"):
					$UI.open_enemy_context(
						context_target,
						button.position,
						_context_interact.bind(context_target, "attack"),
						_context_walk.bind(context_target)
					)
				elif context_target.has_method("is_resource_object"):
					$UI.open_object_context(
						context_target,
						button.position,
						_context_interact.bind(context_target, "resource"),
						_context_walk.bind(context_target)
					)
				else:
					$UI.open_npc_context(
						context_target,
						button.position,
						_context_interact.bind(context_target, "talk"),
						_context_interact.bind(context_target, "special"),
						_context_interact.bind(context_target, "pickpocket"),
						_context_walk.bind(context_target)
					)
				get_viewport().set_input_as_handled()
			return
	if event is InputEventMouseMotion and camera_dragging:
		var motion := event as InputEventMouseMotion
		camera_yaw -= motion.relative.x * CAMERA_DRAG_SENSITIVITY
		camera_pitch = clampf(
			camera_pitch - motion.relative.y * CAMERA_DRAG_SENSITIVITY,
			deg_to_rad(25.0),
			deg_to_rad(65.0)
		)
		return
	if not input_ready or not event is InputEventMouseButton:
		return
	var mouse_event := event as InputEventMouseButton
	if mouse_event.button_index != MOUSE_BUTTON_LEFT or not mouse_event.pressed:
		return
	$UI.close_context_menu()
	var interactable := _raycast_interactable(mouse_event.position)
	if interactable != null:
		$UI.show_click(mouse_event.position, true)
		_begin_interaction(
			interactable,
			"attack" if interactable.has_method("is_enemy") else "talk"
		)
		return
	var target: Variant = _project_mouse_to_ground(mouse_event.position)
	if target != null:
		$UI.show_click(mouse_event.position, false)
		request_move_to_world(target)


func _process(delta: float) -> void:
	_update_entity_hover()
	click_marker_time = maxf(0.0, click_marker_time - delta)
	enemy_ai_elapsed += delta
	region_check_elapsed += delta
	if region_check_elapsed >= 0.4:
		region_check_elapsed = 0.0
		_update_region_notification()
		if GameState.expire_grave_if_needed():
			_spawn_saved_gravestone()
			$UI.show_game_message(
				"The Castle Bank recovered your expired gravestone items.",
				Color("d5d0bd")
			)
	_process_active_skill(delta)
	if Input.is_key_pressed(KEY_LEFT):
		camera_yaw += CAMERA_ROTATE_SPEED * delta
	if Input.is_key_pressed(KEY_RIGHT):
		camera_yaw -= CAMERA_ROTATE_SPEED * delta
	if Input.is_key_pressed(KEY_UP):
		camera_pitch = minf(
			deg_to_rad(65.0),
			camera_pitch + CAMERA_ROTATE_SPEED * 0.65 * delta
		)
	if Input.is_key_pressed(KEY_DOWN):
		camera_pitch = maxf(
			deg_to_rad(25.0),
			camera_pitch - CAMERA_ROTATE_SPEED * 0.65 * delta
		)
	var focus := player.global_position
	var horizontal := cos(camera_pitch) * camera_distance
	var orbit_offset := Vector3(
		sin(camera_yaw) * horizontal,
		sin(camera_pitch) * camera_distance,
		cos(camera_yaw) * horizontal
	)
	var look_target := focus + Vector3.UP
	camera.global_position = focus + orbit_offset
	camera.look_at(look_target)
	var composition_shift := _playable_camera_shift(look_target)
	camera.global_position += composition_shift
	camera.look_at(look_target + composition_shift)
	if pending_interaction != null and player.has_reached_target():
		_complete_pending_interaction()
	if dialogue_panel != null and dialogue_panel.visible:
		if (
			dialogue_target == null
			or not is_instance_valid(dialogue_target)
			or player.global_position.distance_to(
				dialogue_target.global_position
			) > 3.2
		):
			_close_dialogue()
	if (
		destination_marker.visible
		and player.has_reached_target()
		and click_marker_time <= 0.0
	):
		destination_marker.visible = false
		_update_status()
	if enemy_ai_elapsed >= ENEMY_AI_INTERVAL:
		enemy_ai_elapsed = 0.0
		_process_enemy_ai()
	_process_combat(delta)


func _playable_camera_shift(look_target: Vector3) -> Vector3:
	var viewport_size := get_viewport().get_visible_rect().size
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0:
		return Vector3.ZERO
	var ui := $UI
	var right_inset: float = ui.sidebar.size.x if ui.sidebar.visible else 0.0
	var bottom_inset: float = (
		ui.chat_panel.size.y if ui.chat_panel.visible else 0.0
	)
	var playable_center := Vector2(
		(viewport_size.x - right_inset) * 0.5,
		(viewport_size.y - bottom_inset) * 0.5
	)
	var screen_delta := playable_center - viewport_size * 0.5
	var depth := camera.global_position.distance_to(look_target)
	var visible_height := 2.0 * depth * tan(deg_to_rad(camera.fov) * 0.5)
	var visible_width := visible_height * viewport_size.x / viewport_size.y
	var right_shift := -screen_delta.x / viewport_size.x * visible_width
	var up_shift := screen_delta.y / viewport_size.y * visible_height
	return (
		camera.global_basis.x.normalized() * right_shift
		+ camera.global_basis.y.normalized() * up_shift
	)


func request_move_to_world(world_target: Vector3) -> bool:
	_cancel_active_skill()
	$UI.close_interfaces_for_world_movement()
	if dialogue_panel != null and dialogue_panel.visible:
		_close_dialogue()
	pending_interaction = null
	_clear_combat_target()
	var requested: Vector2i = logical_grid.clamp_tile(
		logical_grid.world_to_tile(world_target)
	)
	var destination: Vector2i = logical_grid.nearest_walkable(requested, 13)
	if _actor_occupies_tile(destination):
		destination = _nearest_unoccupied_tile(requested, 13)
	if destination.x < 0:
		status_label.text = "That point cannot be reached"
		return false
	var path: PackedVector3Array = logical_grid.path_world(player.global_position, destination)
	if path.is_empty() and destination != logical_grid.world_to_tile(player.global_position):
		status_label.text = "That tile is blocked or unreachable"
		return false
	if _path_crosses_occupied_actor(path):
		status_label.text = "Another character blocks that route"
		return false
	player.set_movement_path(path)
	destination_marker.visible = false
	status_label.text = "Walking to tile %d, %d" % [destination.x, destination.y]
	return true


func request_move_into_range(
	target_world: Vector3,
	maximum_range: int,
	cardinal_only := false
) -> Dictionary:
	var target_tile: Vector2i = logical_grid.world_to_tile(target_world)
	var result: Dictionary = logical_grid.path_world_to_range(
		player.global_position,
		target_tile,
		maximum_range,
		cardinal_only
	)
	var destination: Vector2i = result.destination
	if destination.x >= 0:
		player.set_movement_path(result.path)
		destination_marker.visible = false
	return result


func _request_move_into_enemy_range(
	enemy: Node3D,
	maximum_range: int,
	cardinal_only: bool
) -> Dictionary:
	var player_tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	var best_destination := Vector2i(-1, -1)
	var best_path := PackedVector3Array()
	var best_steps := 1000000
	var footprint: Array[Vector2i] = enemy.occupied_tiles()
	var minimum := footprint[0]
	var maximum := footprint[0]
	for tile in footprint:
		minimum.x = mini(minimum.x, tile.x)
		minimum.y = mini(minimum.y, tile.y)
		maximum.x = maxi(maximum.x, tile.x)
		maximum.y = maxi(maximum.y, tile.y)
	# Route AROUND all dynamic actors (including the target's own tiles) instead of
	# plotting a path through them and then discarding it, which left the player
	# standing still when a valid approach existed.
	var block_handle: Array = logical_grid.push_dynamic_blocks(
		_dynamic_actor_tiles(),
		[player_tile]
	)
	for y in range(minimum.y - maximum_range, maximum.y + maximum_range + 1):
		for x in range(minimum.x - maximum_range, maximum.x + maximum_range + 1):
			var candidate := Vector2i(x, y)
			if (
				not logical_grid.contains(candidate)
				or logical_grid.is_blocked(candidate)
				or _actor_occupies_tile(candidate, enemy)
			):
				continue
			var distance := _distance_to_enemy_footprint(
				candidate,
				enemy,
				cardinal_only
			)
			if distance < 1 or distance > maximum_range:
				continue
			var path: PackedVector3Array = logical_grid.path_world(
				player.global_position,
				candidate
			)
			if path.is_empty() and candidate != player_tile:
				continue
			if path.size() < best_steps:
				best_steps = path.size()
				best_destination = candidate
				best_path = path
	logical_grid.pop_dynamic_blocks(block_handle)
	return {"destination": best_destination, "path": best_path}


func _dynamic_actor_tiles() -> Array[Vector2i]:
	var tiles: Array[Vector2i] = []
	for enemy in $Enemies.get_children():
		if enemy.alive:
			for tile in enemy.occupied_tiles():
				tiles.append(tile)
	for npc in get_tree().get_nodes_in_group("npcs"):
		tiles.append(logical_grid.world_to_tile(npc.global_position))
	if elowen != null and is_instance_valid(elowen):
		tiles.append(logical_grid.world_to_tile(elowen.global_position))
	return tiles


func _path_crosses_occupied_actor(path: PackedVector3Array) -> bool:
	for point in path:
		if _actor_occupies_tile(logical_grid.world_to_tile(point)):
			return true
	return false


func _begin_interaction(target: Node3D, action := "talk") -> void:
	if action == "talk" and target.has_method("is_resource_object"):
		action = "resource"
	if target == active_skill_target and action == "resource":
		return
	if target != active_skill_target:
		_cancel_active_skill()
	if combat_enemy != null and target != combat_enemy:
		combat_enemy = null
	pending_interaction = target
	pending_interaction_action = action
	pending_interaction_range = (
		_current_weapon_range() if action == "attack" else target.get_interaction_range()
	)
	pending_interaction_cardinal = (
		(action == "attack" and _current_weapon_is_melee())
		or (
			action == "resource"
			and target.has_method("requires_cardinal_interaction")
			and target.requires_cardinal_interaction()
		)
	)
	var result := (
		_request_move_into_enemy_range(
			target,
			pending_interaction_range,
			pending_interaction_cardinal
		)
		if action == "attack" and target.has_method("occupied_tiles")
		else request_move_into_range(
			target.global_position,
			pending_interaction_range,
			pending_interaction_cardinal
		)
	)
	pending_interaction = target
	pending_interaction_action = action
	if result.destination.x < 0:
		pending_interaction = null
	elif player.has_reached_target():
		_complete_pending_interaction()


func _complete_pending_interaction() -> void:
	var target := pending_interaction
	pending_interaction = null
	if target == null or not is_instance_valid(target):
		return
	var player_tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	var distance := (
		_distance_to_enemy_footprint(
			player_tile,
			target,
			pending_interaction_cardinal
		)
		if target.has_method("occupied_tiles")
		else _tile_distance_to_world_target(
			player_tile,
			target.global_position,
			pending_interaction_cardinal
		)
	)
	if (
		distance <= pending_interaction_range
		and (pending_interaction_action != "attack" or distance >= 1)
	):
		_dispatch_interaction(target, pending_interaction_action)


func _tile_distance_to_world_target(
	from_tile: Vector2i,
	target_world: Vector3,
	cardinal_only: bool
) -> int:
	var delta: Vector2i = logical_grid.world_to_tile(target_world) - from_tile
	return (
		absi(delta.x) + absi(delta.y)
		if cardinal_only
		else maxi(absi(delta.x), absi(delta.y))
	)


func _dispatch_interaction(target: Node3D, action: String) -> void:
	if target.has_method("is_gravestone") and target.is_gravestone():
		_recover_gravestone()
		return
	if action == "pickpocket":
		$UI.show_game_message(SkillingSystem.pickpocket())
		return
	if action == "attack" and target.has_method("is_enemy"):
		_cancel_active_skill()
		_start_combat(target, false)
		return
	if action == "resource" or target.has_method("is_resource_object"):
		if target.has_method("is_quest_world_object"):
			_use_quest_world_object(target)
			return
		if (
			target.has_method("is_skill_station")
			and target.is_skill_station()
		):
			$UI.open_skilling_station(str(target.station_type))
			return
		if _handle_intro_quest_object(target):
			return
		_start_skill_action(target)
		return
	if action == "special":
		if str(target.get("npc_id")) == "bren":
			$UI.show_game_message(GameState.slayer_contract_interaction())
			return
		var role := str(target.get("role")).to_lower()
		if (
			"trader" in role
			or "supplier" in role
			or "smith" in role
			or "hunter" in role
		):
			$UI.open_shop(str(target.get("role")))
		elif "bank" in role:
			$UI.open_bank()
		elif "developer" in role:
			$UI.open_developer_tools()
		else:
			_show_npc_dialogue(target)
	else:
		_show_npc_dialogue(target)


func _start_skill_action(target: Node3D) -> void:
	active_skill_target = target
	active_skill_timer = 0.0
	_perform_active_skill_action()


func _process_active_skill(delta: float) -> void:
	if active_skill_target == null:
		return
	if (
		not is_instance_valid(active_skill_target)
		or not active_skill_target.visible
		or not active_skill_target.is_interactable()
	):
		_cancel_active_skill()
		return
	active_skill_timer -= delta
	if active_skill_timer <= 0.0:
		_perform_active_skill_action()


func _perform_active_skill_action() -> void:
	if active_skill_target == null or not is_instance_valid(active_skill_target):
		_cancel_active_skill()
		return
	var target := active_skill_target
	var duration := float(target.action_duration()) if target.has_method("action_duration") else 1.2
	var message := str(target.perform_action())
	$UI.show_game_message(message)
	$UI.show_action_progress(duration)
	var lower := message.to_lower()
	var terminal := (
		"backpack is full" in lower
		or "you need" in lower
		or "depleted" in lower
		or "nothing suitable" in lower
		or "no raw food" in lower
	)
	if (
		terminal
		or not target.has_method("is_continuous_skill_action")
		or not target.is_continuous_skill_action()
	):
		_cancel_active_skill()
		return
	active_skill_timer = duration


func _cancel_active_skill() -> void:
	active_skill_target = null
	active_skill_timer = 0.0


func _use_quest_world_object(target: Node3D) -> void:
	if target.object_kind == "tidewarden_entrance" or target.object_kind == "tidewarden_exit":
		_clear_combat_target()
		if (
			target.object_kind == "tidewarden_entrance"
			and boss_enemy != null
			and is_instance_valid(boss_enemy)
		):
			boss_enemy.reset_full()
		teleport_to_tile(target.destination)
		$UI.show_game_message(
			(
				"You descend into the Tidewarden's flooded hall."
				if target.object_kind == "tidewarden_entrance"
				else "You climb back to the surface."
			),
			Color("8bcf8b")
		)
		return
	if target.object_kind == "chest":
		var chest_was_ready := bool(GameState.data.get("barrow_chest_ready", false))
		$UI.show_game_message(QuestSystem.claim_barrow_chest(), Color("e0b85e"))
		if chest_was_ready:
			# The chest's light carries you back to the surface (matches the 2D game).
			_clear_combat_target()
			_reset_barrow_run()
			teleport_to_tile(BARROW_ENTRANCE_TILE)
			$UI.show_game_message(
				"The chest's light carries you back to the surface.",
				Color("8bcf8b")
			)
		return
	var entrance: bool = target.object_kind == "barrow_entrance"
	var was_run_active := bool(GameState.data.get("barrow_run_active", false))
	var result: Dictionary = QuestSystem.use_barrow_portal(entrance)
	$UI.show_game_message(
		str(result.get("message", "")),
		Color("8bcf8b") if bool(result.get("ok", false)) else Color("dc806f")
	)
	if not bool(result.get("ok", false)):
		return
	if entrance:
		if bool(GameState.data.get("barrow_chest_ready", false)):
			# Chest is unsealed from this run's Warden kill — re-enter to loot, keep state.
			_ensure_barrow_run()
		else:
			# Start a fresh, fully sealed run (also self-heals a stale barrow_room).
			_reset_barrow_run(true)
	elif was_run_active:
		_reset_barrow_run()
	_clear_combat_target()
	teleport_to_tile(target.destination)


func _context_interact(target: Node3D, action: String) -> void:
	_begin_interaction(target, action)


func _context_walk(target: Node3D) -> void:
	request_move_to_world(target.global_position)


func _start_combat(enemy: Node3D, enemy_initiated: bool) -> void:
	_clear_combat_target()
	combat_enemy = enemy
	combat_enemy.set_targeted(true)
	player_attack_timer = 0.0
	enemy_attack_timer = 0.0
	sigil_cooldown = 2.4 if enemy.has_sigils and enemy.health <= enemy.max_health / 2 else 4.8
	var message := (
		"%s attacks you." % enemy.display_name
		if enemy_initiated
		else "You attack the %s." % enemy.display_name
	)
	$UI.show_game_message(message, Color("dc665b") if enemy_initiated else Color("d5d0bd"))


func _process_enemy_ai() -> void:
	var player_tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	var occupied: Dictionary = {}
	for candidate in $Enemies.get_children():
		if candidate.alive:
			for occupied_tile in candidate.occupied_tiles():
				occupied[occupied_tile] = candidate

	for enemy in $Enemies.get_children():
		if enemy.stationary or not enemy.alive or enemy.ai_moving:
			continue
		var player_distance := _distance_to_enemy_footprint(
			player_tile,
			enemy,
			true
		)
		var player_from_home: Vector2i = player_tile - enemy.home_tile
		var home_distance := (
			absi(player_from_home.x) + absi(player_from_home.y)
		)
		var engaged := enemy == combat_enemy

		if engaged and home_distance > enemy.leash_range:
			_clear_combat_target()
			engaged = false

		if (
			(engaged or player_distance <= enemy.detection_range)
			and home_distance <= enemy.leash_range
		):
			if player_distance <= 1:
				enemy.face_toward(player.global_position)
				if combat_enemy == null:
					_start_combat(enemy, true)
			elif combat_enemy == null or engaged:
				_move_enemy_cardinal(enemy, player_tile, occupied)
			continue

		if enemy.current_tile != enemy.home_tile:
			_move_enemy_cardinal(enemy, enemy.home_tile, occupied)


func _move_enemy_cardinal(
	enemy: Node3D,
	target_tile: Vector2i,
	occupied: Dictionary
) -> void:
	var delta: Vector2i = target_tile - enemy.current_tile
	var offsets: Array[Vector2i] = []
	if absi(delta.x) >= absi(delta.y):
		if delta.x != 0:
			offsets.append(Vector2i(signi(delta.x), 0))
		if delta.y != 0:
			offsets.append(Vector2i(0, signi(delta.y)))
	else:
		if delta.y != 0:
			offsets.append(Vector2i(0, signi(delta.y)))
		if delta.x != 0:
			offsets.append(Vector2i(signi(delta.x), 0))
	for fallback in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		if fallback not in offsets:
			offsets.append(fallback)

	for offset in offsets:
		var destination: Vector2i = enemy.current_tile + offset
		var destination_tiles: Array[Vector2i] = enemy.occupied_tiles_at(destination)
		var old_tiles: Array[Vector2i] = enemy.occupied_tiles()
		var player_tile: Vector2i = logical_grid.world_to_tile(
			player.global_position
		)
		if player_tile in destination_tiles:
			continue
		var blocked := false
		for index in range(destination_tiles.size()):
			var destination_tile: Vector2i = destination_tiles[index]
			var old_tile: Vector2i = old_tiles[index]
			if (
				logical_grid.is_blocked(destination_tile)
				or logical_grid.is_edge_blocked(old_tile, destination_tile)
				or (
					occupied.has(destination_tile)
					and occupied[destination_tile] != enemy
				)
			):
				blocked = true
				break
		if blocked:
			continue
		for old_tile in old_tiles:
			occupied.erase(old_tile)
		for destination_tile in destination_tiles:
			occupied[destination_tile] = enemy
		enemy.move_to_tile(
			destination,
			_enemy_world_position(enemy, destination)
		)
		return


func _process_combat(delta: float) -> void:
	if (
		combat_enemy == null
		or not is_instance_valid(combat_enemy)
		or not combat_enemy.alive
	):
		_clear_combat_target()
		return
	var player_tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	var leash_distance := _distance_to_enemy_footprint(
		player_tile,
		combat_enemy,
		true
	)
	var player_distance := (
		leash_distance
		if _current_weapon_is_melee()
		else _distance_to_enemy_footprint(player_tile, combat_enemy, false)
	)
	if leash_distance == 0:
		_separate_combatants(combat_enemy)
		return
	if leash_distance > combat_enemy.leash_range:
		_clear_combat_target()
		return
	player.face_toward(combat_enemy.global_position)
	combat_enemy.face_toward(player.global_position)
	_process_burning_sigils(delta)
	if _process_tidewarden_encounter(delta, player_tile):
		return
	if (
		player_distance >= 1
		and player_distance <= _current_weapon_range()
		and player_attack_timer <= 0.0
	):
		var attacking_boss := combat_enemy == boss_enemy
		if attacking_boss and not _current_weapon_is_melee():
			# The Tidewarden can only be harmed in melee.
			player_attack_timer = 0.6
			$UI.show_game_message(
				"The Tidewarden shrugs off the attack — only melee wounds it.",
				Color("dc806f")
			)
		else:
			if not _player_combat_attack(combat_enemy):
				_clear_combat_target()
				return
			var weapon := ItemCatalog.item(
				str(GameState.data.equipment.get("weapon", ""))
			)
			player_attack_timer = float(weapon.get("speed", 4)) * 0.6
			if attacking_boss and _current_weapon_is_melee() and boss_fight_active:
				if combat_enemy != null and is_instance_valid(combat_enemy) and combat_enemy.alive:
					_advance_boss_beat()
			if (
				combat_enemy == null
				or not is_instance_valid(combat_enemy)
				or not combat_enemy.alive
			):
				return
	else:
		player_attack_timer = maxf(0.0, player_attack_timer - delta)
	if leash_distance == 1 and enemy_attack_timer <= 0.0:
		combat_enemy.play_attack_animation()
		var raw_hit := randi_range(0, combat_enemy.max_hit)
		var hit := maxi(0, raw_hit - int($UI.combat_defence_bonus() / 6.0))
		hit = $UI.reduce_melee_damage(hit)
		GameState.data.health = maxi(0, int(GameState.data.health) - hit)
		GameState.mark_changed()
		$UI.show_damage_number(
			camera.unproject_position(
				player.global_position + Vector3(0.0, 1.8, 0.0)
			),
			hit
		)
		$UI.show_game_message(
			"%s hits you for %d." % [combat_enemy.display_name, hit],
			Color("dc665b")
		)
		enemy_attack_timer = float(combat_enemy.attack_speed) * 0.6
		if int(GameState.data.health) <= 0:
			_handle_player_death()
	else:
		enemy_attack_timer = maxf(0.0, enemy_attack_timer - delta)


const BOSS_FLOOD_CHIP := 8
const BOSS_WAVE_CHIP := 12
const BOSS_ATTACK_CHIP := 6
const BOSS_FLOOD_TICK := 0.7
const BOSS_WAVE_INTERVAL := 4.5
const BOSS_WAVE_STEP := 0.12
const BOSS_ATTACK_INTERVAL := 2.6


func _beat_pos(beat: String) -> Vector2i:
	if beat == "A":
		return BossRoomClass.POS_A
	if beat == "B":
		return BossRoomClass.POS_B
	return BossRoomClass.POS_MID


func _relocate_boss(anchor: Vector2i) -> void:
	if boss_enemy == null or not is_instance_valid(boss_enemy):
		return
	for tile in boss_enemy.occupied_tiles():
		logical_grid.set_blocked(tile, false, false)
	boss_enemy.home_tile = anchor
	boss_enemy.current_tile = anchor
	var pos: Vector3 = _enemy_world_position(boss_enemy, anchor)
	boss_enemy.home_position = pos
	boss_enemy.global_position = pos
	for tile in boss_enemy.occupied_tiles():
		logical_grid.set_blocked(tile, true, false)
	logical_grid.rebuild()


func _enter_boss_beat() -> void:
	var beat := str(BOSS_BEATS[boss_beat_index])
	_relocate_boss(_beat_pos(beat))
	boss_wave_active = false
	boss_wave_cd = BOSS_WAVE_INTERVAL
	boss_wave_hit = false
	if beat == "MID":
		boss_water_target = BossRoomClass.WATER_HIGH
		boss_waves_on = false
		boss_attack_mage = true
		boss_room.set_telegraph(false)
		$UI.show_game_message(
			"The Tidewarden surges onto the dock — only melee will reach it now.",
			Color("7fb0d6")
		)
	else:
		boss_water_target = BossRoomClass.WATER_LOW
		boss_waves_on = true
		boss_attack_mage = false
		boss_room.set_telegraph(false)
		$UI.show_game_message(
			"The Tidewarden retreats to the %s. Waves surge — melee it to break the assault." % (
				"north pool" if beat == "A" else "south pool"
			),
			Color("7fb0d6")
		)


func _start_boss_fight() -> void:
	boss_fight_active = true
	boss_beat_index = 0
	boss_water_target = BossRoomClass.WATER_LOW
	boss_room.snap_water(BossRoomClass.WATER_DRY)
	_enter_boss_beat()
	$UI.show_boss_bar(boss_enemy.display_name, boss_enemy.health, boss_enemy.max_health)


func _deactivate_boss_fight() -> void:
	if not boss_fight_active:
		return
	boss_fight_active = false
	boss_waves_on = false
	boss_wave_active = false
	boss_room.set_telegraph(false)
	boss_room.snap_water(BossRoomClass.WATER_DRY)
	$UI.hide_boss_bar()


func _advance_boss_beat() -> void:
	if not boss_fight_active:
		return
	boss_beat_index = (boss_beat_index + 1) % BOSS_BEATS.size()
	_enter_boss_beat()


func _apply_boss_hazard(damage: int, message: String) -> bool:
	# Returns true if the player died.
	if damage <= 0:
		return false
	GameState.data.health = maxi(0, int(GameState.data.health) - damage)
	GameState.mark_changed()
	$UI.show_damage_number(
		camera.unproject_position(
			player.global_position + Vector3(0.0, 1.8, 0.0)
		),
		damage
	)
	if not message.is_empty():
		$UI.show_game_message(message, Color("4f9fd6"))
	if int(GameState.data.health) <= 0:
		_handle_player_death()
		return true
	return false


func _process_tidewarden_encounter(delta: float, player_tile: Vector2i) -> bool:
	# Returns true if the player died (so _process_combat should stop this frame).
	if boss_room == null or boss_enemy == null or combat_enemy != boss_enemy:
		_deactivate_boss_fight()
		return false
	if not boss_fight_active:
		_start_boss_fight()
	$UI.update_boss_bar(boss_enemy.health, boss_enemy.max_health)

	# Water rises/falls toward the current beat's target; telegraph while rising.
	boss_room.set_water_target_and_animate(boss_water_target, delta)
	boss_room.set_telegraph(boss_room.water_y < boss_water_target - 0.04)

	# Standing in the flood chips health on a throttled tick.
	if boss_room.tile_flooded(player_tile):
		boss_flood_timer -= delta
		if boss_flood_timer <= 0.0:
			boss_flood_timer = BOSS_FLOOD_TICK
			if _apply_boss_hazard(BOSS_FLOOD_CHIP, "The floodwater drags at you for %d." % BOSS_FLOOD_CHIP):
				return true
	else:
		boss_flood_timer = 0.0

	# Wave sweeps during the side (end) beats; pillars/cover walls shelter it.
	if boss_waves_on:
		if _process_boss_wave(delta, player_tile):
			return true

	# The boss's own ranged (ends) / magic (dock) attack on a timer.
	boss_attack_timer -= delta
	if boss_attack_timer <= 0.0:
		boss_attack_timer = BOSS_ATTACK_INTERVAL
		var kind := "arcane surge" if boss_attack_mage else "tidal bolt"
		if _apply_boss_hazard(BOSS_ATTACK_CHIP, "The Tidewarden's %s strikes you for %d." % [kind, BOSS_ATTACK_CHIP]):
			return true
	return false


func _process_boss_wave(delta: float, player_tile: Vector2i) -> bool:
	var boss_tile: Vector2i = boss_enemy.current_tile
	if not boss_wave_active:
		boss_wave_cd -= delta
		if boss_wave_cd <= 0.0:
			boss_wave_active = true
			boss_wave_hit = false
			boss_wave_cd = BOSS_WAVE_INTERVAL
			boss_wave_front = float(boss_tile.y)
			$UI.show_game_message("A wave rolls down the arena — take cover behind a wall!", Color("4f9fd6"))
		return false
	# Sweep the wave front away from the boss end across the arena.
	boss_wave_front += (delta / BOSS_WAVE_STEP) * (1 if boss_tile.y <= BossRoomClass.POS_MID.y else -1)
	var front_row := int(floor(boss_wave_front)) if boss_tile.y <= BossRoomClass.POS_MID.y else int(ceil(boss_wave_front))
	var passed := (
		front_row >= player_tile.y
		if boss_tile.y <= BossRoomClass.POS_MID.y
		else front_row <= player_tile.y
	)
	if not boss_wave_hit and passed:
		boss_wave_hit = true
		if not boss_room.sheltered_from(player_tile, boss_tile):
			if _apply_boss_hazard(BOSS_WAVE_CHIP, "The wave crashes over you for %d." % BOSS_WAVE_CHIP):
				return true
	if front_row < BossRoomClass.ARENA_MIN.y - 1 or front_row > BossRoomClass.ARENA_MAX.y + 1:
		boss_wave_active = false
	return false


func _actor_occupies_tile(tile: Vector2i, ignored: Node3D = null) -> bool:
	for enemy in $Enemies.get_children():
		if (
			enemy != ignored
			and enemy.alive
			and tile in enemy.occupied_tiles()
		):
			return true
	for npc in get_tree().get_nodes_in_group("npcs"):
		if npc != ignored and logical_grid.world_to_tile(npc.global_position) == tile:
			return true
	if elowen != ignored and logical_grid.world_to_tile(elowen.global_position) == tile:
		return true
	return false


func _nearest_unoccupied_tile(tile: Vector2i, maximum_radius: int) -> Vector2i:
	tile = logical_grid.clamp_tile(tile)
	for radius in range(maximum_radius + 1):
		for y in range(tile.y - radius, tile.y + radius + 1):
			for x in range(tile.x - radius, tile.x + radius + 1):
				var candidate := Vector2i(x, y)
				if (
					logical_grid.contains(candidate)
					and not logical_grid.is_blocked(candidate)
					and not _actor_occupies_tile(candidate)
				):
					return candidate
	return Vector2i(-1, -1)


func _separate_combatants(enemy: Node3D) -> void:
	var shared_tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	var occupied: Dictionary = {}
	for candidate in $Enemies.get_children():
		if candidate != enemy and candidate.alive:
			for occupied_tile in candidate.occupied_tiles():
				occupied[occupied_tile] = true
	for offset in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		var destination: Vector2i = enemy.current_tile + offset
		var destination_tiles: Array[Vector2i] = enemy.occupied_tiles_at(destination)
		var old_tiles: Array[Vector2i] = enemy.occupied_tiles()
		var blocked := shared_tile in destination_tiles
		for index in range(destination_tiles.size()):
			if blocked:
				break
			var destination_tile: Vector2i = destination_tiles[index]
			if (
				logical_grid.is_blocked(destination_tile)
				or logical_grid.is_edge_blocked(
					old_tiles[index],
					destination_tile
				)
				or occupied.has(destination_tile)
			):
				blocked = true
		if blocked:
			continue
		enemy.snap_to_tile(
			destination,
			_enemy_world_position(enemy, destination)
		)
		enemy.face_toward(player.global_position)
		return


func _distance_to_enemy_footprint(
	from_tile: Vector2i,
	enemy: Node3D,
	cardinal_only: bool
) -> int:
	var closest := 1000000
	for occupied_tile in enemy.occupied_tiles():
		var delta: Vector2i = occupied_tile - from_tile
		var distance := (
			absi(delta.x) + absi(delta.y)
			if cardinal_only
			else maxi(absi(delta.x), absi(delta.y))
		)
		closest = mini(closest, distance)
	return closest


func _process_burning_sigils(delta: float) -> void:
	if not combat_enemy.has_sigils:
		_clear_burning_sigil()
		return
	if active_sigil != null:
		sigil_resolve_timer -= delta
		if sigil_resolve_timer <= 0.0:
			var player_tile: Vector2i = logical_grid.world_to_tile(player.global_position)
			if player_tile in sigil_tiles:
				var damage := 4 if sigil_enraged else 3
				GameState.data.health = maxi(0, int(GameState.data.health) - damage)
				GameState.mark_changed()
				$UI.show_game_message(
					"The burning sigil hits you for %d." % damage,
					Color("dc665b")
				)
				if int(GameState.data.health) <= 0:
					_handle_player_death()
			else:
				$UI.show_game_message("You evade the burning sigil.", Color("8bcf8b"))
			_clear_burning_sigil()
		return
	sigil_cooldown -= delta
	if sigil_cooldown > 0.0:
		return
	sigil_enraged = combat_enemy.health <= combat_enemy.max_health / 2
	sigil_cooldown = 2.4 if sigil_enraged else 4.8
	sigil_resolve_timer = 0.6 if sigil_enraged else 1.2
	var center: Vector2i = logical_grid.world_to_tile(player.global_position)
	sigil_tiles = [center]
	for offset in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
		var tile: Vector2i = center + offset
		if not logical_grid.is_blocked(tile) and not logical_grid.is_edge_blocked(center, tile):
			sigil_tiles.append(tile)
	active_sigil = Node3D.new()
	active_sigil.name = "BurningSigil"
	for tile in sigil_tiles:
		var mark := MeshInstance3D.new()
		var mesh := CylinderMesh.new()
		mesh.top_radius = 0.62
		mesh.bottom_radius = 0.62
		mesh.height = 0.035
		mark.mesh = mesh
		mark.position = logical_grid.tile_to_world(tile, 0.07)
		var material := StandardMaterial3D.new()
		material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		material.albedo_color = Color("ff4d1f")
		material.emission_enabled = true
		material.emission = Color("ff6a24")
		mark.material_override = material
		active_sigil.add_child(mark)
	add_child(active_sigil)
	$UI.show_game_message(
		"The %s marks the ground. Move!" % combat_enemy.display_name,
		Color("dc665b")
	)


func _clear_burning_sigil() -> void:
	if active_sigil != null and is_instance_valid(active_sigil):
		active_sigil.queue_free()
	active_sigil = null
	sigil_tiles.clear()
	sigil_resolve_timer = 0.0


func _player_combat_attack(enemy: Node3D) -> bool:
	var weapon_name := str(GameState.data.equipment.get("weapon", ""))
	var weapon := ItemCatalog.item(weapon_name)
	if weapon.has("ranged") and not GameState.remove_item("Bronze arrows", 1, false):
		$UI.show_game_message("You are out of arrows.", Color("dc665b"))
		return false
	if weapon.has("magic") and not GameState.remove_item("Ember rune", 1, false):
		$UI.show_game_message("You are out of Ember runes.", Color("dc665b"))
		return false
	if weapon.has("ranged") or weapon.has("magic"):
		GameState.mark_dirty()
	var combat_style := str(GameState.data.get("combat_style", "accurate"))
	var xp_skill := "Magic" if weapon.has("magic") else (
		"Ranged" if weapon.has("ranged") else (
			"Strength" if combat_style == "aggressive" else (
				"Defence" if combat_style == "defensive" else "Attack"
			)
		)
	)
	var skill_level := int(GameState.data.skills.get(xp_skill, 1))
	var weapon_bonus := int(
		weapon.get(
			"magic" if weapon.has("magic") else (
				"ranged" if weapon.has("ranged") else "attack"
			),
			0
		)
	)
	var accuracy_level := skill_level
	if not weapon.has("ranged") and not weapon.has("magic"):
		accuracy_level += $UI.combat_accuracy_bonus()
	var accuracy := minf(0.95, 0.54 + accuracy_level * 0.035 + weapon_bonus * 0.035)
	if weapon.has("ranged"):
		accuracy = minf(0.94, 0.5 + skill_level * 0.04 + weapon_bonus * 0.04)
	elif weapon.has("magic"):
		accuracy = minf(0.96, 0.51 + skill_level * 0.04 + weapon_bonus * 0.04)
	var damage_level := int(GameState.data.skills.get(
		xp_skill if weapon.has("ranged") or weapon.has("magic") else "Strength",
		1
	))
	var maximum := (
		(2 if weapon.has("magic") else 1)
		+ floori(float(damage_level) / 3.0)
		+ weapon_bonus
	)
	if not weapon.has("ranged") and not weapon.has("magic"):
		maximum += $UI.combat_damage_bonus()
	var using_special := (
		bool(GameState.data.get("special_armed", false))
		and weapon.has("spec")
		and float(GameState.data.get("special_energy", 100.0)) >= 50.0
	)
	if using_special:
		GameState.data.special_armed = false
		GameState.data.special_energy = float(GameState.data.special_energy) - 50.0
		if str(weapon.spec) == "power":
			accuracy = 1.0
			maximum = ceili(maximum * 1.6)
		$UI.show_game_message("Special attack!", Color("e0b85e"))
	var hit := randi_range(0, maxi(1, maximum)) if randf() < accuracy else 0
	if using_special and str(weapon.spec) == "double" and randf() < accuracy:
		hit += randi_range(0, maxi(1, maximum))
	var style := (
		"magic" if weapon.has("magic")
		else ("ranged" if weapon.has("ranged") else "melee")
	)
	player.play_attack_animation(style)
	if style != "melee":
		_show_projectile(enemy, style)
	$UI.show_action_progress(float(weapon.get("speed", 4)) * 0.6)
	enemy.take_damage(hit)
	GameState.add_skill_xp(xp_skill, 4 + hit * 4, false)
	GameState.add_skill_xp("Hitpoints", hit, false)
	GameState.mark_changed()
	$UI.show_game_message(
		"You hit %s for %d." % [enemy.display_name, hit],
		Color("8bcf8b")
	)
	return true


func _current_weapon_range() -> int:
	var weapon := ItemCatalog.item(
		str(GameState.data.equipment.get("weapon", ""))
	)
	return int(weapon.get("range", 1))


func _current_weapon_is_melee() -> bool:
	var weapon := ItemCatalog.item(
		str(GameState.data.equipment.get("weapon", ""))
	)
	return not weapon.has("ranged") and not weapon.has("magic")


func _restore_intro_quest_world() -> void:
	_spawn_intro_fishing_spots()
	_spawn_intro_cooking_range()
	_refresh_intro_quest_markers()


func reset_intro_quest_world() -> void:
	_refresh_intro_quest_markers()


func _spawn_intro_fishing_spots() -> void:
	if not intro_fishing_objects.is_empty():
		return
	for index in range(INTRO_FISH_SPOTS.size()):
		var spot := TestResourceScene.instantiate()
		spot.name = "IntroFishingSpot%d" % index
		spot.configure({
			"name": "River fishing spot",
			"action": "Fish",
			"reward": "",
			"color": "#397e9b",
		})
		spot.position = logical_grid.tile_to_world(INTRO_FISH_SPOTS[index], 0.0)
		var body := spot.get_node("Body") as MeshInstance3D
		body.scale = Vector3(0.9, 0.08, 0.9)
		body.position.y = 0.04
		var collision := spot.get_node("CollisionShape3D") as CollisionShape3D
		collision.scale = Vector3(0.9, 0.15, 0.9)
		collision.position.y = 0.1
		$GroundItems.add_child(spot)
		intro_fishing_objects.append(spot)


func _spawn_intro_cooking_range() -> void:
	if intro_cooking_range != null:
		return
	intro_cooking_range = TestResourceScene.instantiate()
	intro_cooking_range.name = "IntroCookingRange"
	intro_cooking_range.configure_skill(
		"range",
		{"name": "Cooking range"}
	)
	intro_cooking_range.position = logical_grid.tile_to_world(
		INTRO_COOKING_RANGE,
		0.0
	)
	$GroundItems.add_child(intro_cooking_range)


func _handle_intro_quest_object(target: Node3D) -> bool:
	if target.name.begins_with("IntroFishingSpot"):
		_fish_riverfish()
		return true
	if (
		target.name == "IntroCookingRange"
		and GameState.quest_stage(INTRO_QUEST) == "cook"
	):
		_cook_riverfish()
		return true
	return false


func _fish_riverfish() -> void:
	$UI.show_action_progress(1.2)
	var message := SkillingSystem.fish({
		"level": 1,
		"item": "rawFish",
		"catchName": "riverfish",
		"xp": 12,
	})
	if (
		message.begins_with("You catch")
		and GameState.quest_stage(INTRO_QUEST) == "fish"
	):
		GameState.advance_quest(
			INTRO_QUEST,
			"cook",
			"Cook the riverfish at the town range."
		)
	$UI.show_game_message(
		message,
		Color("8bcf8b") if message.begins_with("You catch") else Color("d5d0bd")
	)


func _cook_riverfish() -> void:
	if GameState.item_count("Raw riverfish") < 1:
		$UI.show_game_message("You need a Raw riverfish.", Color("dc806f"))
		return
	GameState.remove_item("Raw riverfish", 1, false)
	var cooking_level := int(GameState.data.skills.get("Cooking", 1))
	var burn_chance := maxf(0.03, 0.3 - cooking_level * 0.011)
	$UI.show_action_progress(1.2)
	if randf() < burn_chance:
		GameState.mark_changed()
		$UI.show_game_message(
			"You accidentally burn the riverfish.",
			Color("dc806f")
		)
		return
	GameState.add_item("Cooked riverfish", 1, false)
	_add_skill_xp("Cooking", 14)
	if GameState.quest_stage(INTRO_QUEST) == "cook":
		GameState.advance_quest(
			INTRO_QUEST,
			"goblin",
			"Defeat a goblin raider driven down from the wastes."
		)
	else:
		GameState.mark_changed()
	$UI.show_game_message("You cook the riverfish.", Color("8bcf8b"))


func _add_skill_xp(skill_name: String, amount: int) -> void:
	GameState.add_skill_xp(skill_name, amount, false)


func _find_npc(npc_id: String) -> Node3D:
	for npc in $NPCs.get_children():
		if str(npc.get("npc_id")) == npc_id:
			return npc
	return null


func _nearest_living_goblin() -> Node3D:
	var result: Node3D
	var best_distance: float = INF
	for enemy in $Enemies.get_children():
		if enemy.alive and enemy.monster_id == "goblin":
			var distance := player.global_position.distance_squared_to(
				enemy.global_position
			)
			if distance < best_distance:
				best_distance = distance
				result = enemy
	return result


func _refresh_intro_quest_markers() -> void:
	_clear_quest_marker(elowen)
	var marker := elowen.get_node_or_null("Marker")
	if marker != null:
		marker.visible = false
	var murphy := _find_npc("murphy")
	if murphy != null:
		_clear_quest_marker(murphy)
	for npc in $NPCs.get_children():
		_clear_quest_marker(npc)
	for spot in intro_fishing_objects:
		if is_instance_valid(spot):
			_clear_quest_marker(spot)
	if intro_cooking_range != null:
		_clear_quest_marker(intro_cooking_range)
	for enemy in $Enemies.get_children():
		_clear_quest_marker(enemy)

	var stage := GameState.quest_stage(INTRO_QUEST)
	if stage == "available":
		if marker != null:
			marker.visible = true
			marker.set_meta("quest_id", INTRO_QUEST)
		else:
			_add_quest_marker(elowen, "!", Color("e0b85e"), INTRO_QUEST)
	elif stage == "buy_supplies" and murphy != null:
		_add_quest_marker(murphy, "!", Color("e0b85e"), INTRO_QUEST)
	elif stage == "fish" and not intro_fishing_objects.is_empty():
		_add_quest_marker(
			intro_fishing_objects[0], "!", Color("e0b85e"), INTRO_QUEST
		)
	elif stage == "cook" and intro_cooking_range != null:
		_add_quest_marker(
			intro_cooking_range, "!", Color("e0b85e"), INTRO_QUEST
		)
	elif stage == "goblin":
		var goblin := _nearest_living_goblin()
		if goblin != null:
			_add_quest_marker(goblin, "!", Color("dc665b"), INTRO_QUEST)
	elif stage == "return":
		_add_quest_marker(elowen, "?", Color("72b7cb"), INTRO_QUEST)
	_refresh_extended_quest_markers()


func _refresh_extended_quest_markers() -> void:
	QuestSystem.ensure_quests()
	var npc_targets := {
		"shadows_over_pineholt": {
			"available": "rowan", "return": "rowan",
		},
		"beneath_the_ashen_barrow": {
			"available": "mira", "return": "mira",
		},
		"the_ashwrights_gambit": {
			"available": "king", "yara": "yara", "harker": "harker",
			"supplies": "harker", "kessa": "kessa", "return": "king",
		},
		"the_boar_hunt": {"available": "willow", "hunt": "willow"},
		"silk_and_cinders": {"available": "vale", "hunt": "vale"},
		"the_broken_road": {"available": "mara", "hunt": "mara"},
		"hearth_and_home": {"available": "tamsin", "gather": "tamsin"},
		"a_cure_for_sablemarsh": {"available": "sable", "gather": "sable"},
	}
	for quest_id in npc_targets:
		var quest: Dictionary = GameState.data.quests.get(quest_id, {})
		var stage_name := str(quest.get("stage", ""))
		var state_name := str(quest.get("state", "locked"))
		if not npc_targets[quest_id].has(stage_name):
			continue
		var npc := _find_npc(str(npc_targets[quest_id][stage_name]))
		if npc != null and npc.get_node_or_null("QuestMarker") == null:
			_add_quest_marker(
				npc,
				"!" if state_name == "available" else "?",
				Color("e0b85e") if state_name == "available" else Color("72b7cb"),
				quest_id
			)
	var enemy_targets := {
		"shadows_over_pineholt": {"hunt": "goblin"},
		"beneath_the_ashen_barrow": {"guardian": "guardian", "warden": "warden"},
		"the_ashwrights_gambit": {
			"renn": "ashwrightRenn", "construct": "unboundConstruct",
		},
		"the_boar_hunt": {"hunt": "boar"},
		"silk_and_cinders": {"hunt": "spider"},
		"the_broken_road": {"hunt": "bandit"},
	}
	for quest_id in enemy_targets:
		var quest: Dictionary = GameState.data.quests.get(quest_id, {})
		var stage_name := str(quest.get("stage", ""))
		if not enemy_targets[quest_id].has(stage_name):
			continue
		var monster_id := str(enemy_targets[quest_id][stage_name])
		for enemy in $Enemies.get_children():
			if enemy.alive and enemy.monster_id == monster_id:
				if enemy.get_node_or_null("QuestMarker") == null:
					_add_quest_marker(enemy, "!", Color("dc665b"), quest_id)
				break


func _add_quest_marker(
	target: Node3D,
	text: String,
	color: Color,
	quest_id := ""
) -> void:
	var marker := Label3D.new()
	marker.name = "QuestMarker"
	marker.set_meta("quest_id", quest_id)
	marker.text = text
	marker.position = Vector3(0.0, 2.9, 0.0)
	marker.font_size = 38
	marker.outline_size = 8
	marker.modulate = color
	marker.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	target.add_child(marker)


func _clear_quest_marker(target: Node3D) -> void:
	var marker := target.get_node_or_null("QuestMarker")
	if marker != null:
		target.remove_child(marker)
		marker.queue_free()


func _on_enemy_defeated(enemy: Node3D) -> void:
	$UI.show_game_message(
		"You defeat the %s." % enemy.display_name,
		Color("8bcf8b")
	)
	_clear_combat_target()
	_advance_barrow_room(enemy)
	var weapon := ItemCatalog.item(
		str(GameState.data.equipment.get("weapon", ""))
	)
	var combat_style := str(GameState.data.get("combat_style", "accurate"))
	var xp_skill := "Magic" if weapon.has("magic") else (
		"Ranged" if weapon.has("ranged") else (
			"Strength" if combat_style == "aggressive" else (
				"Defence" if combat_style == "defensive" else "Attack"
			)
		)
	)
	GameState.add_skill_xp(xp_skill, int(enemy.combat_xp), false)
	if GameState.record_slayer_kill(str(enemy.monster_id)):
		var contract: Dictionary = GameState.data.get("slayer_contract", {})
		$UI.show_game_message(
			"Slayer contract: %d remaining." % int(contract.get("remaining", 0)),
			Color("e0b85e")
		)
	var quest_message := QuestSystem.record_kill(str(enemy.monster_id))
	if not quest_message.is_empty():
		$UI.show_game_message(quest_message, Color("e0b85e"))
	GameState.mark_changed()
	if (
		enemy.monster_id == "goblin"
		and GameState.quest_stage(INTRO_QUEST) == "goblin"
	):
		GameState.advance_quest(
			INTRO_QUEST,
			"return",
			"Return to Guide Elowen."
		)
		$UI.show_game_message(
			"Return to Guide Elowen.",
			Color("e0b85e")
		)
	for drop in enemy.drops:
		var chance := float(drop[3]) if drop.size() > 3 else 1.0
		if randf() > chance:
			continue
		_spawn_ground_item(
			ItemCatalog.display_name(str(drop[0])),
			randi_range(int(drop[1]), int(drop[2])),
			enemy.global_position
		)


func _spawn_ground_item(
	item_name: String,
	quantity: int,
	world_position: Vector3
) -> void:
	var item := TestResourceScene.instantiate()
	item.configure({
		"name": item_name,
		"action": "Take",
		"reward": item_name,
		"quantity": quantity,
		"color": "#d7ad55",
		"consume": true,
	})
	item.position = world_position + Vector3(0.0, 0.02, 0.0)
	$GroundItems.add_child(item)


func _handle_player_death() -> void:
	_clear_combat_target()
	_cancel_active_skill()
	var death_tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	var in_barrow: bool = death_tile.x <= 28 and death_tile.y >= 62
	var grave_tile: Vector2i = (
		logical_grid.nearest_walkable(BARROW_GRAVE_TILE, 4)
		if in_barrow
		else death_tile
	)
	var result: Dictionary = GameState.apply_death(grave_tile, in_barrow)
	if bool(GameState.data.get("barrow_run_active", false)):
		_reset_barrow_run()
	teleport_to_tile(PLAYER_SPAWN)
	_spawn_saved_gravestone()
	var lost_parts: Array[String] = []
	if int(result.gold) > 0:
		lost_parts.append("%d coins" % int(result.gold))
	for item_name in result.lost:
		var quantity := int(result.lost[item_name])
		lost_parts.append(
			"%s%s" % [item_name, " x%d" % quantity if quantity > 1 else ""]
		)
	var death_message := (
		"You had nothing worth losing. Small mercies."
		if lost_parts.is_empty()
		else "You lost %s. %s for 10 minutes." % [
			", ".join(lost_parts),
			(
				"Your gravestone waits at the Barrow entrance"
				if in_barrow
				else "A gravestone holds it"
			),
		]
	)
	$UI.show_death_screen(death_message)
	$UI.show_game_message(
		(
			"You wake at Greenrest. The Barrow moved your gravestone to its entrance."
			if in_barrow
			else "You wake at Greenrest. A gravestone holds your lost items for 10 minutes."
		),
		Color("dc665b")
	)


func _spawn_saved_gravestone() -> void:
	if player_gravestone != null and is_instance_valid(player_gravestone):
		var old_tile: Vector2i = logical_grid.world_to_tile(
			player_gravestone.global_position
		)
		logical_grid.set_blocked(old_tile, false, false)
		player_gravestone.queue_free()
	player_gravestone = null
	if GameState.expire_grave_if_needed():
		logical_grid.rebuild()
		$UI.show_game_message(
			"The Castle Bank recovered your expired gravestone items.",
			Color("d5d0bd")
		)
		return
	var grave: Dictionary = GameState.data.get("grave", {})
	if grave.is_empty():
		return
	var tile := Vector2i(int(grave.get("x", 0)), int(grave.get("y", 0)))
	if bool(grave.get("in_barrow", false)) or tile == BARROW_ENTRANCE_TILE:
		tile = logical_grid.nearest_walkable(BARROW_GRAVE_TILE, 4)
		grave.x = tile.x
		grave.y = tile.y
		grave.in_barrow = true
		GameState.data.grave = grave
		GameState.save_game()
	tile = logical_grid.nearest_walkable(tile, 6)
	if tile.x < 0:
		return
	player_gravestone = GravestoneClass.new()
	player_gravestone.name = "PlayerGravestone"
	player_gravestone.position = logical_grid.tile_to_world(tile)
	add_child(player_gravestone)
	logical_grid.set_blocked(tile, true, false)
	logical_grid.rebuild()


func _recover_gravestone() -> void:
	var result := GameState.recover_grave()
	if int(result.recovered) <= 0:
		$UI.show_game_message("Your backpack is too full.", Color("dc665b"))
		return
	if bool(result.complete):
		$UI.show_game_message(
			"You recover everything from your gravestone.",
			Color("8bcf8b")
		)
		_spawn_saved_gravestone()
	else:
		$UI.show_game_message(
			"Your backpack is too full to recover everything.",
			Color("dc665b")
		)


func _update_region_notification() -> void:
	var tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	var region := ""
	if tile.x <= 28 and tile.y >= 62:
		region = "Ashen Barrow"
	elif tile.x < 64:
		region = "Ashfall Wastes" if tile.y < 100 else "Sablemarsh"
	elif tile.y < 40:
		region = "Frostmere"
	elif tile.x < 128:
		region = "Pineholt" if tile.y < 100 else "Greenrest Vale"
	else:
		region = "Thornwood" if tile.y < 106 else "Cinderforge"
	if region != current_region:
		current_region = region
		$UI.show_region(region)


func _clear_combat_target() -> void:
	if combat_enemy != null and is_instance_valid(combat_enemy):
		combat_enemy.set_targeted(false)
	combat_enemy = null
	_clear_burning_sigil()
	_deactivate_boss_fight()


func _show_projectile(enemy: Node3D, style: String) -> void:
	var projectile := MeshInstance3D.new()
	if style == "magic":
		var sphere := SphereMesh.new()
		sphere.radius = 0.12
		sphere.height = 0.24
		projectile.mesh = sphere
	else:
		var arrow := CylinderMesh.new()
		arrow.top_radius = 0.025
		arrow.bottom_radius = 0.025
		arrow.height = 0.65
		projectile.mesh = arrow
		projectile.rotation.x = deg_to_rad(90.0)
	var material := StandardMaterial3D.new()
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("f06b32") if style == "magic" else Color("d8c590")
	projectile.material_override = material
	projectile.global_position = player.global_position + Vector3(0.0, 1.25, 0.0)
	add_child(projectile)
	var destination := enemy.global_position + Vector3(0.0, 1.0, 0.0)
	var tween := create_tween()
	tween.tween_property(projectile, "global_position", destination, 0.22)
	tween.tween_callback(projectile.queue_free)


func teleport_to_tile(tile: Vector2i) -> void:
	var destination: Vector2i = logical_grid.nearest_walkable(tile, 8)
	if destination.x < 0:
		return
	player.cancel_movement()
	player.global_position = logical_grid.tile_to_world(destination)
	_update_status()


func _home_teleport() -> void:
	pending_interaction = null
	_cancel_active_skill()
	player.cancel_movement()
	_clear_combat_target()
	if dialogue_panel != null and dialogue_panel.visible:
		_close_dialogue()
	$UI.close_context_menu()
	destination_marker.visible = false
	if bool(GameState.data.get("barrow_run_active", false)):
		_reset_barrow_run()
	teleport_to_tile(PLAYER_SPAWN)
	$UI.show_game_message(
		"You teleport home to Greenrest.",
		Color("8bcf8b")
	)


func _show_click_marker(world_position: Vector3, is_action: bool) -> void:
	destination_marker.global_position = world_position
	var material := destination_marker.material_override as StandardMaterial3D
	if material == null:
		material = StandardMaterial3D.new()
		material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		destination_marker.material_override = material
	material.albedo_color = (
		ACTION_CLICK_COLOR if is_action else MOVEMENT_CLICK_COLOR
	)
	destination_marker.visible = true
	click_marker_time = CLICK_MARKER_MINIMUM_TIME


func _raycast_interactable(screen_position: Vector2) -> Node3D:
	var origin := camera.project_ray_origin(screen_position)
	var end := origin + camera.project_ray_normal(screen_position) * 300.0
	var hit := get_world_3d().direct_space_state.intersect_ray(
		PhysicsRayQueryParameters3D.create(origin, end, 2)
	)
	if hit.is_empty():
		return null
	var collider: Object = hit.collider
	return collider as Node3D if collider is Node3D and collider.has_method("is_interactable") else null


func _build_entity_hover_label() -> void:
	entity_hover_label = Label.new()
	entity_hover_label.name = "EntityHover"
	entity_hover_label.visible = false
	entity_hover_label.mouse_filter = Control.MOUSE_FILTER_IGNORE
	entity_hover_label.anchor_left = 1.0
	entity_hover_label.anchor_right = 1.0
	entity_hover_label.offset_left = -525.0
	entity_hover_label.offset_top = 12.0
	entity_hover_label.offset_right = -297.0
	entity_hover_label.offset_bottom = 40.0
	entity_hover_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	entity_hover_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	entity_hover_label.text_overrun_behavior = TextServer.OVERRUN_TRIM_ELLIPSIS
	entity_hover_label.add_theme_font_size_override("font_size", 14)
	entity_hover_label.add_theme_color_override("font_color", Color("f3dfaa"))
	entity_hover_label.add_theme_constant_override("outline_size", 4)
	entity_hover_label.add_theme_color_override("font_outline_color", Color("17130dcc"))
	var background := StyleBoxFlat.new()
	background.bg_color = Color("17130db8")
	background.corner_radius_top_left = 3
	background.corner_radius_top_right = 3
	background.corner_radius_bottom_left = 3
	background.corner_radius_bottom_right = 3
	background.content_margin_left = 8.0
	background.content_margin_right = 8.0
	entity_hover_label.add_theme_stylebox_override("normal", background)
	$UI.add_child(entity_hover_label)


func _update_entity_hover() -> void:
	if entity_hover_label == null:
		return
	var mouse_position := get_viewport().get_mouse_position()
	var playable_right := get_viewport().get_visible_rect().size.x - 285.0
	if mouse_position.x < 0.0 or mouse_position.x >= playable_right:
		entity_hover_label.visible = false
		return
	var target := _raycast_interactable(mouse_position)
	if (
		target == null
		or not (
			target.has_method("is_enemy")
			or target.is_in_group("npcs")
			or target == elowen
		)
	):
		entity_hover_label.visible = false
		return
	entity_hover_label.text = _entity_hover_text(target)
	entity_hover_label.visible = true


func _entity_hover_text(target: Node3D) -> String:
	var hover_text := str(target.get("display_name"))
	if target.has_method("is_enemy"):
		hover_text += "  |  Level %d" % int(target.get("combat_level"))
	return hover_text


func _project_mouse_to_ground(screen_position: Vector2) -> Variant:
	return renderer.raycast_terrain(
		camera.project_ray_origin(screen_position),
		camera.project_ray_normal(screen_position)
	)


func _build_dialogue_ui() -> void:
	dialogue_panel = PanelContainer.new()
	dialogue_panel.name = "NpcDialogue"
	dialogue_panel.visible = false
	dialogue_panel.set_anchors_and_offsets_preset(Control.PRESET_FULL_RECT)
	dialogue_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	var dialogue_style := StyleBoxFlat.new()
	dialogue_style.bg_color = Color("15130ff7")
	dialogue_style.border_width_top = 2
	dialogue_style.border_color = Color("8a7040")
	dialogue_panel.add_theme_stylebox_override("panel", dialogue_style)
	var chat_console := $UI.chat_panel.find_child(
		"ChatConsole", true, false
	) as Control
	chat_console.add_child(dialogue_panel)
	var margin := MarginContainer.new()
	margin.add_theme_constant_override("margin_left", 18)
	margin.add_theme_constant_override("margin_top", 12)
	margin.add_theme_constant_override("margin_right", 18)
	margin.add_theme_constant_override("margin_bottom", 10)
	dialogue_panel.add_child(margin)
	var layout := VBoxContainer.new()
	layout.add_theme_constant_override("separation", 6)
	margin.add_child(layout)
	dialogue_name = Label.new()
	dialogue_name.add_theme_font_size_override("font_size", 16)
	dialogue_name.add_theme_color_override("font_color", Color("e0b85e"))
	layout.add_child(dialogue_name)
	dialogue_text = Label.new()
	dialogue_text.size_flags_vertical = Control.SIZE_EXPAND_FILL
	dialogue_text.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	layout.add_child(dialogue_text)
	dialogue_actions = HFlowContainer.new()
	dialogue_actions.add_theme_constant_override("h_separation", 6)
	dialogue_actions.add_theme_constant_override("v_separation", 4)
	layout.add_child(dialogue_actions)


func _show_npc_dialogue(target: Node3D) -> void:
	player.cancel_movement()
	if (
		dialogue_target != null
		and is_instance_valid(dialogue_target)
		and dialogue_target != target
		and dialogue_target.has_method("set_wander_paused")
	):
		dialogue_target.set_wander_paused(false)
	dialogue_target = target
	if dialogue_target.has_method("set_wander_paused"):
		dialogue_target.set_wander_paused(true)
	dialogue_speaker = target.display_name
	dialogue_name.text = target.display_name
	dialogue_pages = _paginate_dialogue(_dialogue_for_target(target))
	dialogue_page_index = 0
	dialogue_result_only = false
	$UI.set_dialogue_chat_active(true)
	dialogue_panel.visible = true
	_show_dialogue_page()


func _show_dialogue_page() -> void:
	dialogue_text.text = dialogue_pages[dialogue_page_index]
	for child in dialogue_actions.get_children():
		child.queue_free()
	if dialogue_page_index < dialogue_pages.size() - 1:
		_add_dialogue_action("Continue", _next_dialogue_page)
	elif dialogue_result_only:
		_add_dialogue_action("Leave", _close_dialogue)
	else:
		_add_context_actions()


func _next_dialogue_page() -> void:
	dialogue_page_index += 1
	_show_dialogue_page()


func _add_context_actions() -> void:
	var npc_id := str(dialogue_target.get("npc_id"))
	var role := str(dialogue_target.get("role"))
	if npc_id == "elowen":
		var stage := GameState.quest_stage(INTRO_QUEST)
		if stage == "available":
			_add_dialogue_action("Accept quest", _accept_elowen_quest)
			_add_dialogue_action("Not yet", _close_dialogue)
		elif stage == "return":
			_add_dialogue_action("Complete quest", _complete_elowen_quest)
	elif QuestSystem.has_interaction(npc_id):
		_add_dialogue_action("Quest", _interact_current_quest)
	if SHOP_NPCS.has(npc_id):
		_add_dialogue_action(
			"Browse provisions" if npc_id == "mara" else "Browse wares",
			_open_current_shop
		)
	if "bank" in role.to_lower():
		_add_dialogue_action("Open bank", _open_bank)
	if "developer" in role.to_lower():
		_add_dialogue_action("Open test tools", _open_developer_tools)
	_add_dialogue_action("Leave", _close_dialogue)


func _interact_current_quest() -> void:
	var npc_id := str(dialogue_target.get("npc_id"))
	var result := QuestSystem.interact(npc_id)
	if result.is_empty():
		result = "There is no quest business here right now."
	$UI.show_game_message(result, Color("e0b85e"))
	dialogue_pages = _paginate_dialogue(result)
	dialogue_page_index = 0
	dialogue_result_only = true
	_show_dialogue_page()


func _add_dialogue_action(label: String, callback: Callable) -> void:
	var button := Button.new()
	button.text = label
	button.pressed.connect(callback)
	dialogue_actions.add_child(button)


func _accept_elowen_quest() -> void:
	$UI.accept_intro_quest()
	_refresh_intro_quest_markers()
	_close_dialogue()


func _complete_elowen_quest() -> void:
	$UI.complete_intro_quest()
	_refresh_intro_quest_markers()
	_close_dialogue()


func _dialogue_for_target(target: Node3D) -> String:
	var npc_id := str(target.get("npc_id"))
	var quest_dialogue := QuestSystem.dialogue_for(npc_id)
	if not quest_dialogue.is_empty():
		return quest_dialogue
	if SHOP_DIALOGUE.has(npc_id):
		return str(SHOP_DIALOGUE[npc_id])
	if "bank" in str(target.get("role")).to_lower():
		return BANKER_DIALOGUE
	if npc_id != "elowen":
		return str(target.dialogue_text)
	match GameState.quest_stage(INTRO_QUEST):
		"available":
			return (
				"Easy, now - you took a hard fall. We found you at the "
				+ "edge of the Vale with no name and no memory, and that "
				+ "same night the old Barrow tablets glowed for the first "
				+ "time in a hundred years. That is not chance, Wanderer. "
				+ "But first things first: you must eat, and learn to "
				+ "defend yourself. Fisher Murphy waits at the western "
				+ "docks - buy a rod and three bait."
			)
		"buy_supplies":
			return "Buy a fishing rod and 3 bait from Fisher Murphy."
		"fish":
			return "Catch a riverfish at the western docks."
		"cook":
			return "Cook the fish at the town range."
		"goblin":
			return "Defeat a goblin raider driven down from the wastes."
		"return":
			return (
				"You learn faster than you should, for someone with no "
				+ "memory. Greenrest Vale welcomes you. Word came down "
				+ "the north road - Captain Rowan of Pineholt has sent "
				+ "for capable hands."
			)
		"complete":
			return (
				"Captain Rowan waits in Pineholt, to the north."
			)
	return str(target.dialogue_text)


func _open_current_shop() -> void:
	var npc_id := str(dialogue_target.get("npc_id"))
	var role := str(SHOP_NPCS.get(npc_id, dialogue_target.get("role")))
	_close_dialogue()
	$UI.open_shop(role)


func _open_bank() -> void:
	_close_dialogue()
	$UI.open_bank()


func _open_developer_tools() -> void:
	_close_dialogue()
	$UI.open_developer_tools()


func _paginate_dialogue(value: String) -> Array[String]:
	var pages: Array[String] = []
	var remaining := value.strip_edges()
	while remaining.length() > 170:
		var split_at := remaining.rfind(". ", 170)
		if split_at < 80:
			split_at = remaining.rfind(" ", 170)
		if split_at < 1:
			split_at = 170
		pages.append(remaining.substr(0, split_at + 1).strip_edges())
		remaining = remaining.substr(split_at + 1).strip_edges()
	if not remaining.is_empty():
		pages.append(remaining)
	if pages.is_empty():
		pages.append("...")
	return pages


func _close_dialogue() -> void:
	dialogue_panel.visible = false
	$UI.set_dialogue_chat_active(false)
	dialogue_speaker = ""
	if (
		dialogue_target != null
		and is_instance_valid(dialogue_target)
		and dialogue_target.has_method("set_wander_paused")
	):
		dialogue_target.set_wander_paused(false)
	dialogue_target = null
	_update_status()


func _update_status() -> void:
	var tile: Vector2i = logical_grid.world_to_tile(player.global_position)
	status_label.text = "Emberfall  |  Tile %d, %d" % [tile.x, tile.y]
	GameState.data.player_tile = {"x": tile.x, "y": tile.y}
	GameState.save_game()


func _enable_input() -> void:
	await get_tree().physics_frame
	input_ready = true
	_update_status()
