class_name BossRoom
extends RefCounted

# Water-boss arena helper for the authored arena (x109-123, y113-154).
# The arena geometry (floors at 0/+0.25/+0.5/+0.75, the -0.5 end cutouts, the
# central +0.25 dock and the cover walls) is authored in the map editor. This
# helper only renders/animates the flood water + its telegraph, and provides the
# arena data (boss positions, water thresholds, wave shelter) the world
# controller's phase state machine uses.

# ---- Arena data (tile coordinates) ----
const ARENA_MIN := Vector2i(108, 113)
const ARENA_MAX := Vector2i(124, 154)
const POS_A := Vector2i(116, 116)      # boss at End A (top cutout front)
const POS_MID := Vector2i(116, 133)    # boss on the middle dock
const POS_B := Vector2i(116, 151)      # boss at End B (bottom cutout front)
const BOSS_FOOTPRINT := [Vector2i(-1, 0), Vector2i(0, 0), Vector2i(1, 0)]
const ENTER_DEST_TILE := Vector2i(112, 140)   # walkable +0.5 platform to arrive on
const EXIT_PORTAL_TILE := Vector2i(114, 140)

# Water surface heights (world Y). Tiles whose surface sits below the line flood.
const WATER_DRY := -0.6                 # below the -0.5 cutouts: only cutouts hold water
const WATER_LOW := 0.13                 # floods the base-0 floor, +0.25 and up stay dry
const WATER_HIGH := 0.38                # floods 0 and +0.25, +0.5 and up stay dry

var grid: LogicalGrid
var root: Node3D
var water_mesh: MeshInstance3D
var telegraph_root: Node3D
var water_y := WATER_DRY


func build(parent: Node3D, logical_grid) -> void:
	grid = logical_grid
	root = Node3D.new()
	root.name = "WaterBossArena"
	parent.add_child(root)
	_build_water()
	_build_telegraph()


func _build_water() -> void:
	water_mesh = MeshInstance3D.new()
	water_mesh.name = "ArenaFloodwater"
	var plane := BoxMesh.new()
	var width := float(ARENA_MAX.x - ARENA_MIN.x + 1) * 1.5
	var depth := float(ARENA_MAX.y - ARENA_MIN.y + 1) * 1.5
	plane.size = Vector3(width, 0.5, depth)
	water_mesh.mesh = plane
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(0.16, 0.42, 0.55, 0.6)
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.roughness = 0.2
	material.metallic = 0.3
	water_mesh.material_override = material
	var center_tile := Vector2i(
		(ARENA_MIN.x + ARENA_MAX.x) / 2,
		(ARENA_MIN.y + ARENA_MAX.y) / 2
	)
	var center: Vector3 = grid.tile_to_world(center_tile, 0.0)
	water_mesh.position = Vector3(center.x, water_y - 0.25, center.z)
	root.add_child(water_mesh)


func _build_telegraph() -> void:
	telegraph_root = Node3D.new()
	telegraph_root.name = "WaterSpots"
	telegraph_root.visible = false
	root.add_child(telegraph_root)
	var spot_material := StandardMaterial3D.new()
	spot_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	spot_material.albedo_color = Color(0.25, 0.55, 0.7, 0.5)
	spot_material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	# One flat spot on every base-0 interior tile (the first floor to flood).
	for y in range(ARENA_MIN.y, ARENA_MAX.y + 1):
		for x in range(ARENA_MIN.x, ARENA_MAX.x + 1):
			var tile := Vector2i(x, y)
			if grid.is_blocked(tile) or _tile_elev(tile) != 0:
				continue
			var mark := MeshInstance3D.new()
			var mesh := CylinderMesh.new()
			mesh.top_radius = 0.4
			mesh.bottom_radius = 0.4
			mesh.height = 0.03
			mark.mesh = mesh
			mark.material_override = spot_material
			mark.position = grid.tile_to_world(tile, 0.05)
			telegraph_root.add_child(mark)


func _tile_elev(tile: Vector2i) -> int:
	if not grid.contains(tile):
		return 0
	return grid.elevation_steps[tile.y * grid.dimensions.x + tile.x]


func set_water_target_and_animate(target_y: float, delta: float, rate := 0.5) -> void:
	water_y = move_toward(water_y, target_y, rate * delta)
	if water_mesh != null:
		water_mesh.position.y = water_y - 0.25


func snap_water(target_y: float) -> void:
	water_y = target_y
	if water_mesh != null:
		water_mesh.position.y = water_y - 0.25


func set_telegraph(on: bool) -> void:
	if telegraph_root != null:
		telegraph_root.visible = on


func tile_flooded(tile: Vector2i) -> bool:
	if not _in_arena(tile):
		return false
	return grid.surface_height(tile) < water_y - 0.03


func _in_arena(tile: Vector2i) -> bool:
	return (
		tile.x >= ARENA_MIN.x and tile.x <= ARENA_MAX.x
		and tile.y >= ARENA_MIN.y and tile.y <= ARENA_MAX.y
	)


# The player is sheltered from a wave sweeping from the boss's end if an authored
# cover wall (a blocked N-S edge) stands between them and the boss in their column.
func sheltered_from(player_tile: Vector2i, boss_tile: Vector2i) -> bool:
	if not _in_arena(player_tile):
		return true
	var step := 1 if boss_tile.y < player_tile.y else -1
	var y := player_tile.y
	while y != boss_tile.y:
		var next_y := y + step
		if grid.is_edge_blocked(Vector2i(player_tile.x, y), Vector2i(player_tile.x, next_y)):
			return true
		y = next_y
	return false
