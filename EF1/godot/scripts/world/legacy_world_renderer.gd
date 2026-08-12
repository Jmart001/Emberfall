@tool
class_name LegacyWorldRenderer
extends Node3D

const DATA_PATH := "res://data/legacy_world.json"
const STRUCTURES_PATH := "res://data/world_structures.json"
const TILE_SIZE := 1.5
const ELEVATION_STEP := 0.25
const WATER_SURFACE_OFFSET := -0.08
const DOCK_SURFACE_OFFSET := 0.08
const MAP_SIZE := Vector2i(192, 160)
const WORLD_ORIGIN := Vector3(-144.0, 0.0, -120.0)
const INTERIOR_TILES := [5, 6, 8]
const LANDMARK_TREE_TILE := Vector2i(96, 150)
const KENNEY_NATURE_ROOT := "res://assets/third_party/kenney_nature/Models/DAE format/"

const TILE_COLORS := {
	0: Color("527b45"),
	1: Color("91816a"),
	2: Color("287ba0"),
	3: Color("244f31"),
	4: Color("777a78"),
	5: Color("b6a98b"),
	6: Color("67452c"),
	7: Color("8a6941"),
	8: Color("e98c35"),
	9: Color("684e85"),
	10: Color("526348"),
	11: Color("946b3f"),
	12: Color("dce8e5"),
	13: Color("625b56"),
	14: Color("d34c27"),
}

var terrain := ""
var world_data: Dictionary = {}
var structure_data: Dictionary = {}
var elevation: Array = []
var stone_brick_material: StandardMaterial3D


func _ready() -> void:
	rebuild()


func rebuild() -> void:
	for child in get_children():
		child.queue_free()
	world_data = load_world_data()
	structure_data = load_structure_data()
	terrain = str(world_data.get("terrain", ""))
	elevation = world_data.get("elevation", [])
	if terrain.length() != MAP_SIZE.x * MAP_SIZE.y:
		push_error("Legacy terrain data has the wrong tile count")
		return
	for tile_type in range(15):
		if tile_type in [3, 4, 7]:
			continue
		_create_tile_batch(tile_type)
	_create_structure_ground_batches()
	_create_elevation_sides()
	_create_wall_edges()
	_create_semantic_structure_edges()
	_create_tree_details()
	_create_environment_scatter()
	_create_landmark_tree()


func load_world_data() -> Dictionary:
	var file := FileAccess.open(DATA_PATH, FileAccess.READ)
	if file == null:
		push_error("Cannot open %s" % DATA_PATH)
		return {}
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	return parsed if parsed is Dictionary else {}


func load_structure_data() -> Dictionary:
	var file := FileAccess.open(STRUCTURES_PATH, FileAccess.READ)
	if file == null:
		return {"edges": []}
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	return parsed if parsed is Dictionary else {"edges": []}


func tile_value(tile: Vector2i) -> int:
	if tile.x < 0 or tile.y < 0 or tile.x >= MAP_SIZE.x or tile.y >= MAP_SIZE.y:
		return -1
	return "0123456789abcde".find(terrain[tile.y * MAP_SIZE.x + tile.x])


func tile_to_world(tile: Vector2i, height := 0.05) -> Vector3:
	return WORLD_ORIGIN + Vector3(
		(tile.x + 0.5) * TILE_SIZE,
		surface_height(tile) + height,
		(tile.y + 0.5) * TILE_SIZE
	)


func elevation_step(tile: Vector2i) -> int:
	if (
		tile.x < 0 or tile.y < 0 or tile.x >= MAP_SIZE.x or tile.y >= MAP_SIZE.y
		or elevation.size() != MAP_SIZE.y
	):
		return 0
	var row: Array = elevation[tile.y]
	return int(row[tile.x]) if row.size() == MAP_SIZE.x else 0


func surface_height(tile: Vector2i) -> float:
	var height := elevation_step(tile) * ELEVATION_STEP
	match tile_value(tile):
		2, 14:
			height += WATER_SURFACE_OFFSET
		11:
			height += DOCK_SURFACE_OFFSET
	return height


func raycast_terrain(origin: Vector3, direction: Vector3, maximum_distance := 300.0) -> Variant:
	var distance := 0.0
	while distance <= maximum_distance:
		var point := origin + direction * distance
		var tile := Vector2i(
			floori((point.x - WORLD_ORIGIN.x) / TILE_SIZE),
			floori((point.z - WORLD_ORIGIN.z) / TILE_SIZE)
		)
		if tile.x >= 0 and tile.y >= 0 and tile.x < MAP_SIZE.x and tile.y < MAP_SIZE.y:
			var height := surface_height(tile)
			if point.y <= height + 0.08:
				return Vector3(point.x, height, point.z)
		distance += 0.1
	return null


func _create_tile_batch(tile_type: int) -> void:
	var transforms: Array[Transform3D] = []
	for y in range(MAP_SIZE.y):
		for x in range(MAP_SIZE.x):
			if tile_value(Vector2i(x, y)) == tile_type:
				transforms.append(_tile_transform(Vector2i(x, y), tile_type))
	if transforms.is_empty():
		return

	var mesh := BoxMesh.new()
	var height := _tile_height(tile_type)
	mesh.size = Vector3(TILE_SIZE, height, TILE_SIZE)
	var material := StandardMaterial3D.new()
	material.albedo_color = TILE_COLORS[tile_type]
	material.roughness = 0.92
	material.albedo_texture = _ground_detail_texture(tile_type)
	if tile_type == 2:
		material.metallic = 0.08
		material.roughness = 0.24
	mesh.material = material

	var multimesh := MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.mesh = mesh
	multimesh.instance_count = transforms.size()
	for index in range(transforms.size()):
		multimesh.set_instance_transform(index, transforms[index])

	var instance := MultiMeshInstance3D.new()
	instance.name = "Terrain_%02d" % tile_type
	instance.multimesh = multimesh
	add_child(instance)


func _create_structure_ground_batches() -> void:
	var tiles_by_ground: Dictionary = {}
	for y in range(MAP_SIZE.y):
		for x in range(MAP_SIZE.x):
			var tile := Vector2i(x, y)
			if tile_value(tile) not in [3, 4, 7]:
				continue
			var ground_type := _inferred_structure_ground(tile)
			if not tiles_by_ground.has(ground_type):
				tiles_by_ground[ground_type] = []
			tiles_by_ground[ground_type].append(tile)
	for ground_type in tiles_by_ground:
		var transforms: Array[Transform3D] = []
		for tile in tiles_by_ground[ground_type]:
			transforms.append(_tile_transform(tile, int(ground_type)))
		var mesh := BoxMesh.new()
		mesh.size = Vector3(TILE_SIZE, _tile_height(int(ground_type)), TILE_SIZE)
		var material := StandardMaterial3D.new()
		material.albedo_color = TILE_COLORS[int(ground_type)]
		material.roughness = 0.92
		material.albedo_texture = _ground_detail_texture(int(ground_type))
		mesh.material = material
		_create_transform_batch(
			"StructureGround_%02d" % int(ground_type),
			mesh,
			transforms
		)


func _inferred_structure_ground(tile: Vector2i) -> int:
	var candidates := [0, 1, 5, 10, 11, 12, 13]
	var counts: Dictionary = {}
	for radius in range(1, 5):
		for y in range(tile.y - radius, tile.y + radius + 1):
			for x in range(tile.x - radius, tile.x + radius + 1):
				if (
					absi(x - tile.x) != radius
					and absi(y - tile.y) != radius
				):
					continue
				var value := tile_value(Vector2i(x, y))
				if value in candidates:
					counts[value] = int(counts.get(value, 0)) + (5 - radius)
		if not counts.is_empty() and radius >= 2:
			break
	var best_type := 0
	var best_count := -1
	for value in counts:
		if int(counts[value]) > best_count:
			best_count = int(counts[value])
			best_type = int(value)
	return best_type


func has_tree_at(tile: Vector2i) -> bool:
	if tile_value(tile) != 3:
		return false
	return absi(tile.x * 92821 ^ tile.y * 68917) % 4 != 0


func _tile_transform(tile: Vector2i, tile_type: int) -> Transform3D:
	var height := _tile_height(tile_type)
	var position := tile_to_world(tile, height * 0.5 - 0.08)
	return Transform3D(Basis.IDENTITY, position)


func _tile_height(tile_type: int) -> float:
	match tile_type:
		3:
			return 0.38
		6:
			return 1.2
		7:
			return 0.9
		8:
			return 0.28
		_:
			return 0.16


func _ground_detail_texture(tile_type: int) -> NoiseTexture2D:
	var noise := FastNoiseLite.new()
	noise.seed = 4109 + tile_type * 97
	noise.frequency = 0.08 if tile_type in [0, 3, 10] else 0.13
	noise.fractal_octaves = 3
	var texture := NoiseTexture2D.new()
	texture.width = 128
	texture.height = 128
	texture.seamless = true
	texture.noise = noise
	var ramp := Gradient.new()
	ramp.colors = PackedColorArray([Color("a7a7a7"), Color.WHITE])
	ramp.offsets = PackedFloat32Array([0.0, 1.0])
	texture.color_ramp = ramp
	return texture


func _create_elevation_sides() -> void:
	var batches: Dictionary = {}
	for y in range(MAP_SIZE.y):
		for x in range(MAP_SIZE.x):
			var tile := Vector2i(x, y)
			for direction in [Vector2i.RIGHT, Vector2i.DOWN]:
				var neighbor: Vector2i = tile + direction
				if neighbor.x >= MAP_SIZE.x or neighbor.y >= MAP_SIZE.y:
					continue
				var first_height := surface_height(tile)
				var second_height := surface_height(neighbor)
				var difference := absf(first_height - second_height)
				if difference < 0.01:
					continue
				var orientation := "vertical" if direction.x != 0 else "horizontal"
				var key := "%s:%d" % [orientation, roundi(difference / ELEVATION_STEP)]
				if not batches.has(key):
					batches[key] = {
						"orientation": orientation,
						"height": difference,
						"transforms": [],
					}
				var first_center := tile_to_world(tile, 0.0)
				var center := first_center + Vector3(direction.x, 0.0, direction.y) * TILE_SIZE * 0.5
				center.y = minf(first_height, second_height) + difference * 0.5
				var transforms: Array = batches[key]["transforms"]
				transforms.append(Transform3D(Basis.IDENTITY, center))
	var side_material := StandardMaterial3D.new()
	side_material.albedo_color = Color("665540")
	side_material.roughness = 1.0
	for key in batches:
		var batch: Dictionary = batches[key]
		var mesh := BoxMesh.new()
		mesh.size = (
			Vector3(0.06, float(batch.height), TILE_SIZE)
			if batch.orientation == "vertical"
			else Vector3(TILE_SIZE, float(batch.height), 0.06)
		)
		mesh.material = side_material
		_create_transform_batch("ElevationSide_%s" % key, mesh, batch.transforms)


func wall_edges() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	for entry in structure_data.get("edges", []):
		if str(entry.get("type", "")) == "door":
			continue
		var first := Vector2i(int(entry.x1), int(entry.y1))
		var second := Vector2i(int(entry.x2), int(entry.y2))
		result.append({
			"wall_tile": first,
			"interior_tile": second,
			"direction": second - first,
			"semantic": true,
			"type": str(entry.get("type", "wall")),
		})
	if not structure_data.get("edges", []).is_empty():
		return result

	# Older maps without authored structures still need their terrain-derived walls.
	for y in range(MAP_SIZE.y):
		for x in range(MAP_SIZE.x):
			var wall_tile := Vector2i(x, y)
			if tile_value(wall_tile) != 4:
				continue
			for direction in [Vector2i.LEFT, Vector2i.RIGHT, Vector2i.UP, Vector2i.DOWN]:
				var neighbor: Vector2i = wall_tile + direction
				if tile_value(neighbor) in INTERIOR_TILES:
					result.append({
						"wall_tile": wall_tile,
						"interior_tile": neighbor,
						"direction": direction,
						"semantic": false,
						"type": "wall",
					})
	return result


func _structure_edge_key(first: Vector2i, second: Vector2i) -> String:
	var first_id := first.y * MAP_SIZE.x + first.x
	var second_id := second.y * MAP_SIZE.x + second.x
	return "%d:%d" % [mini(first_id, second_id), maxi(first_id, second_id)]


func _create_wall_edges() -> void:
	var edges: Array[Dictionary] = []
	for edge in wall_edges():
		if not bool(edge.get("semantic", false)):
			edges.append(edge)
	if edges.is_empty():
		return
	var horizontal_mesh := BoxMesh.new()
	horizontal_mesh.size = Vector3(TILE_SIZE, 2.25, 0.14)
	var vertical_mesh := BoxMesh.new()
	vertical_mesh.size = Vector3(0.14, 2.25, TILE_SIZE)
	var material := _stone_brick_material()
	horizontal_mesh.material = material
	vertical_mesh.material = material
	_create_wall_edge_batch(edges, horizontal_mesh, true)
	_create_wall_edge_batch(edges, vertical_mesh, false)


func _create_semantic_structure_edges() -> void:
	var walls: Array[Dictionary] = []
	var fences: Array[Dictionary] = []
	var doors: Array[Dictionary] = []
	for entry in structure_data.get("edges", []):
		match str(entry.get("type", "wall")):
			"fence":
				fences.append(entry)
			"door":
				doors.append(entry)
			_:
				walls.append(entry)
	_create_semantic_edge_batch(
		walls,
		"SemanticWalls",
		2.25,
		0.14,
		Color("777a78"),
		false,
		true
	)
	_create_semantic_edge_batch(fences, "SemanticFences", 0.9, 0.09, Color("765737"))
	# Door edges are rendered and animated by InteractiveDoor.


func _create_semantic_edge_batch(
	edges: Array[Dictionary],
	batch_name: String,
	height: float,
	thickness: float,
	color: Color,
	door_posts := false,
	stone_bricks := false
) -> void:
	if edges.is_empty():
		return
	var horizontal_mesh := BoxMesh.new()
	var vertical_mesh := BoxMesh.new()
	var segment_length := TILE_SIZE
	if door_posts:
		segment_length = 0.22
	horizontal_mesh.size = Vector3(segment_length, height, thickness)
	vertical_mesh.size = Vector3(thickness, height, segment_length)
	var material := _stone_brick_material() if stone_bricks else StandardMaterial3D.new()
	if not stone_bricks:
		material.albedo_color = color
		material.roughness = 0.9
	horizontal_mesh.material = material
	vertical_mesh.material = material
	var horizontal: Array[Transform3D] = []
	var vertical: Array[Transform3D] = []
	for entry in edges:
		var first := Vector2i(int(entry.x1), int(entry.y1))
		var second := Vector2i(int(entry.x2), int(entry.y2))
		var direction := second - first
		var center := tile_to_world(first, height * 0.5)
		center += Vector3(direction.x, 0.0, direction.y) * TILE_SIZE * 0.5
		var target := horizontal if direction.y != 0 else vertical
		if door_posts:
			var along := Vector3.RIGHT if direction.y != 0 else Vector3.FORWARD
			target.append(Transform3D(Basis.IDENTITY, center - along * 0.55))
			target.append(Transform3D(Basis.IDENTITY, center + along * 0.55))
		else:
			target.append(Transform3D(Basis.IDENTITY, center))
	_create_transform_batch(batch_name + "Horizontal", horizontal_mesh, horizontal)
	_create_transform_batch(batch_name + "Vertical", vertical_mesh, vertical)


func _stone_brick_material() -> StandardMaterial3D:
	if stone_brick_material != null:
		return stone_brick_material
	var image := Image.create(128, 128, false, Image.FORMAT_RGBA8)
	var mortar := Color("4a4d49")
	var stone_colors := [
		Color("777b76"),
		Color("858983"),
		Color("696e69"),
		Color("90928b"),
	]
	for y in range(128):
		var row := y / 16
		var row_y := y % 16
		var offset := 16 if row % 2 == 1 else 0
		for x in range(128):
			var shifted_x := (x + offset) % 32
			if row_y < 2 or shifted_x < 2:
				image.set_pixel(x, y, mortar)
				continue
			var brick := ((x + offset) / 32 + row * 4) % stone_colors.size()
			var variation := float((x * 13 + y * 7) % 9) / 255.0
			var color: Color = stone_colors[brick]
			image.set_pixel(
				x,
				y,
				Color(
					color.r + variation,
					color.g + variation,
					color.b + variation,
					1.0
				)
			)
	var texture := ImageTexture.create_from_image(image)
	stone_brick_material = StandardMaterial3D.new()
	stone_brick_material.albedo_texture = texture
	stone_brick_material.texture_filter = BaseMaterial3D.TEXTURE_FILTER_NEAREST
	stone_brick_material.roughness = 0.96
	# World-space triplanar so brick scale and orientation are identical on every
	# wall direction (BoxMesh per-face UVs otherwise rotate/rescale the pattern,
	# making horizontal-running and vertical-running walls look like two styles).
	stone_brick_material.uv1_triplanar = true
	stone_brick_material.uv1_world_triplanar = true
	stone_brick_material.uv1_scale = Vector3(0.6, 0.6, 0.6)
	return stone_brick_material


func _create_transform_batch(
	batch_name: String,
	mesh: Mesh,
	transforms: Array
) -> void:
	if transforms.is_empty():
		return
	var multimesh := MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.mesh = mesh
	multimesh.instance_count = transforms.size()
	for index in range(transforms.size()):
		multimesh.set_instance_transform(index, transforms[index])
	var instance := MultiMeshInstance3D.new()
	instance.name = batch_name
	instance.multimesh = multimesh
	add_child(instance)


func _create_wall_edge_batch(
	edges: Array[Dictionary],
	mesh: BoxMesh,
	horizontal: bool
) -> void:
	var transforms: Array[Transform3D] = []
	for edge in edges:
		var direction: Vector2i = edge.direction
		if horizontal != (direction.y != 0):
			continue
		var wall_tile: Vector2i = edge.wall_tile
		var center: Vector3 = tile_to_world(wall_tile, 1.125)
		center += Vector3(direction.x, 0.0, direction.y) * TILE_SIZE * 0.5
		transforms.append(Transform3D(Basis.IDENTITY, center))
	if transforms.is_empty():
		return
	var multimesh := MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.mesh = mesh
	multimesh.instance_count = transforms.size()
	for index in range(transforms.size()):
		multimesh.set_instance_transform(index, transforms[index])
	var instance := MultiMeshInstance3D.new()
	instance.name = "WallEdgesHorizontal" if horizontal else "WallEdgesVertical"
	instance.multimesh = multimesh
	add_child(instance)


func _create_tree_details() -> void:
	var tree_tiles: Array[Vector2i] = []
	for y in range(MAP_SIZE.y):
		for x in range(MAP_SIZE.x):
			var tile := Vector2i(x, y)
			if has_tree_at(tile):
				tree_tiles.append(tile)
	if tree_tiles.is_empty():
		return
	_create_tree_batch(tree_tiles, true)
	_create_tree_crown_batch(tree_tiles, Vector3(0.0, 2.05, 0.0), Vector3(0.92, 0.84, 0.92), Color("2f693d"))
	_create_tree_crown_batch(tree_tiles, Vector3(-0.42, 1.92, 0.1), Vector3(0.64, 0.7, 0.64), Color("3d7845"))
	_create_tree_crown_batch(tree_tiles, Vector3(0.4, 1.96, 0.14), Vector3(0.67, 0.73, 0.67), Color("356f3f"))
	_create_tree_crown_batch(tree_tiles, Vector3(0.05, 2.48, -0.1), Vector3(0.62, 0.66, 0.62), Color("477f49"))


func _create_tree_batch(tree_tiles: Array[Vector2i], trunks: bool) -> void:
	var mesh: PrimitiveMesh
	var vertical_offset: float
	if trunks:
		var cylinder := CylinderMesh.new()
		cylinder.top_radius = 0.17
		cylinder.bottom_radius = 0.27
		cylinder.height = 1.85
		mesh = cylinder
		vertical_offset = 0.92
	else:
		var crown := SphereMesh.new()
		crown.radius = 0.62
		crown.height = 1.25
		mesh = crown
		vertical_offset = 1.68
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("5a3925") if trunks else Color("2f693d")
	material.roughness = 1.0
	mesh.material = material
	var multimesh := MultiMesh.new()
	multimesh.transform_format = MultiMesh.TRANSFORM_3D
	multimesh.mesh = mesh
	multimesh.instance_count = tree_tiles.size()
	for index in range(tree_tiles.size()):
		var tile := tree_tiles[index]
		var offset := Vector3(
			(((tile.x * 17 + tile.y * 7) % 7) - 3) * 0.07,
			vertical_offset,
			(((tile.x * 5 + tile.y * 13) % 7) - 3) * 0.07
		)
		multimesh.set_instance_transform(
			index,
			Transform3D(Basis.IDENTITY, tile_to_world(tile, 0.0) + offset)
		)
	var instance := MultiMeshInstance3D.new()
	instance.name = "TreeTrunks" if trunks else "TreeCrowns"
	instance.multimesh = multimesh
	add_child(instance)


func _create_tree_crown_batch(
	tree_tiles: Array[Vector2i],
	offset: Vector3,
	crown_scale: Vector3,
	color: Color
) -> void:
	var crown := SphereMesh.new()
	crown.radius = 0.72
	crown.height = 1.44
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 1.0
	crown.material = material
	var transforms: Array[Transform3D] = []
	for tile in tree_tiles:
		var variation := 0.88 + float((tile.x * 11 + tile.y * 17) % 9) * 0.025
		var basis := Basis.IDENTITY.scaled(crown_scale * variation)
		transforms.append(Transform3D(basis, tile_to_world(tile, 0.0) + offset))
	_create_transform_batch("TreeCrown", crown, transforms)


func _create_environment_scatter() -> void:
	var definitions := [
		{"asset": "grass.dae", "tiles": [0, 10], "modulo": 113, "scale": 0.42},
		{"asset": "flower_yellowA.dae", "tiles": [0], "modulo": 367, "scale": 0.38},
		{"asset": "mushroom_tanGroup.dae", "tiles": [3, 10], "modulo": 293, "scale": 0.42},
		{"asset": "plant_bushSmall.dae", "tiles": [0, 3, 10], "modulo": 419, "scale": 0.48},
		{"asset": "rock_smallFlatA.dae", "tiles": [0, 10, 12, 13], "modulo": 337, "scale": 0.4},
	]
	var scatter_root := Node3D.new()
	scatter_root.name = "EnvironmentScatter"
	add_child(scatter_root)
	for definition in definitions:
		var packed := load(KENNEY_NATURE_ROOT + str(definition.asset)) as PackedScene
		if packed == null:
			continue
		var modulo: int = definition.modulo
		for y in range(MAP_SIZE.y):
			for x in range(MAP_SIZE.x):
				var tile := Vector2i(x, y)
				if tile_value(tile) not in definition.tiles:
					continue
				var hash_value := absi(x * 73856093 ^ y * 19349663 ^ modulo * 83492791)
				if hash_value % modulo != 0:
					continue
				var prop := packed.instantiate() as Node3D
				var offset := Vector3(
					(float((hash_value / 7) % 9) - 4.0) * 0.09,
					0.0,
					(float((hash_value / 17) % 9) - 4.0) * 0.09
				)
				prop.position = tile_to_world(tile, 0.0) + offset
				prop.rotation.y = float(hash_value % 628) * 0.01
				var variation := 0.82 + float(hash_value % 31) * 0.01
				prop.scale = Vector3.ONE * float(definition.scale) * variation
				scatter_root.add_child(prop)


func _create_landmark_tree() -> void:
	var tree := StaticBody3D.new()
	tree.name = "GreatTree"
	tree.position = tile_to_world(LANDMARK_TREE_TILE, 0.0)
	add_child(tree)

	var bark := _landmark_material(Color("5a3a25"))
	var bark_light := _landmark_material(Color("765038"))
	var dark_bark := _landmark_material(Color("35251b"))
	var leaf_materials := [
		_landmark_material(Color("234f31")),
		_landmark_material(Color("30643a")),
		_landmark_material(Color("417944")),
		_landmark_material(Color("527f45")),
	]

	var trunk_points := [
		Vector3(0.0, 0.0, 0.0),
		Vector3(0.1, 2.15, -0.08),
		Vector3(-0.16, 4.25, 0.12),
		Vector3(0.22, 6.15, 0.0),
		Vector3(0.02, 7.65, -0.12),
	]
	var trunk_radii := [1.28, 1.07, 0.84, 0.58, 0.28]
	for index in range(trunk_points.size() - 1):
		_add_tree_limb(
			tree,
			trunk_points[index],
			trunk_points[index + 1],
			trunk_radii[index],
			trunk_radii[index + 1],
			bark if index % 2 == 0 else bark_light
		)

	var collision := CollisionShape3D.new()
	var trunk_shape := CylinderShape3D.new()
	trunk_shape.radius = 1.18
	trunk_shape.height = 6.4
	collision.shape = trunk_shape
	collision.position.y = 3.2
	tree.add_child(collision)

	for index in range(11):
		var angle := TAU * index / 11.0 + sin(index * 2.7) * 0.12
		var distance := 2.2 + float(index % 3) * 0.34
		_add_tree_limb(
			tree,
			Vector3(sin(angle) * 0.55, 0.3, cos(angle) * 0.55),
			Vector3(sin(angle) * distance, 0.03, cos(angle) * distance),
			0.34,
			0.08,
			dark_bark
		)

	var primary_branches := [
		[Vector3(-0.08, 4.35, 0.08), Vector3(-3.7, 6.25, 0.55)],
		[Vector3(0.12, 4.85, -0.05), Vector3(3.55, 6.7, -0.65)],
		[Vector3(-0.02, 5.25, 0.08), Vector3(-0.65, 6.85, 3.35)],
		[Vector3(0.14, 5.65, -0.08), Vector3(0.85, 7.15, -3.25)],
		[Vector3(0.12, 6.25, 0.0), Vector3(-2.35, 8.25, -2.2)],
		[Vector3(0.05, 6.55, 0.02), Vector3(2.5, 8.45, 2.15)],
	]
	for index in range(primary_branches.size()):
		var start: Vector3 = primary_branches[index][0]
		var end: Vector3 = primary_branches[index][1]
		var bend := start.lerp(end, 0.52)
		bend.y += 0.55
		bend.z += sin(index * 1.9) * 0.38
		_add_tree_limb(tree, start, bend, 0.48, 0.28, bark)
		_add_tree_limb(tree, bend, end, 0.3, 0.11, bark_light)
		var direction := (end - bend).normalized()
		var side := direction.cross(Vector3.UP).normalized()
		_add_tree_limb(
			tree, bend.lerp(end, 0.62),
			end + side * 1.25 + Vector3.UP * 0.35,
			0.18, 0.045, bark
		)
		_add_tree_limb(
			tree, bend.lerp(end, 0.72),
			end - side * 1.05 + Vector3.UP * 0.62,
			0.16, 0.04, bark
		)

	for index in range(7):
		var knot_angle := index * 2.31
		_add_tree_foliage(
			tree,
			Vector3(sin(knot_angle) * 0.78, 1.1 + index * 0.72, cos(knot_angle) * 0.78),
			Vector3(0.18, 0.13, 0.12),
			dark_bark
		)

	for ring in range(4):
		var count := 12 - ring
		var ring_radius := 3.75 - ring * 0.62
		var height := 6.65 + ring * 0.92
		for index in range(count):
			var angle := TAU * index / float(count) + ring * 0.63
			var wobble := sin(index * 3.17 + ring * 1.4)
			var position := Vector3(
				sin(angle) * (ring_radius + wobble * 0.32),
				height + cos(index * 2.13 + ring) * 0.38,
				cos(angle) * (ring_radius - wobble * 0.25)
			)
			var size := Vector3(
				1.35 + float((index + ring) % 3) * 0.18,
				0.82 + float(index % 2) * 0.14,
				1.1 + float((index * 2 + ring) % 3) * 0.17
			)
			_add_tree_foliage(
				tree, position, size,
				leaf_materials[(index + ring * 2) % leaf_materials.size()]
			)
	_add_tree_foliage(
		tree, Vector3(0.0, 10.05, 0.0), Vector3(1.9, 1.25, 1.7),
		leaf_materials[2]
	)


func _add_tree_limb(
	parent: Node3D,
	start: Vector3,
	end: Vector3,
	bottom_radius: float,
	top_radius: float,
	material: StandardMaterial3D
) -> void:
	var direction := end - start
	if direction.length_squared() < 0.001:
		return
	var limb := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.bottom_radius = bottom_radius
	mesh.top_radius = top_radius
	mesh.height = direction.length()
	mesh.radial_segments = 10
	limb.mesh = mesh
	limb.position = start.lerp(end, 0.5)
	limb.quaternion = Quaternion(Vector3.UP, direction.normalized())
	limb.material_override = material
	parent.add_child(limb)


func _add_tree_foliage(
	parent: Node3D,
	position: Vector3,
	scale_value: Vector3,
	material: StandardMaterial3D
) -> void:
	var cluster := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = 1.0
	mesh.height = 2.0
	mesh.radial_segments = 10
	mesh.rings = 6
	cluster.mesh = mesh
	cluster.position = position
	cluster.scale = scale_value
	cluster.rotation = Vector3(
		sin(position.z * 1.7) * 0.18,
		sin(position.x * 2.1) * 0.45,
		cos(position.x + position.z) * 0.16
	)
	cluster.material_override = material
	parent.add_child(cluster)


func _landmark_material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 1.0
	return material
