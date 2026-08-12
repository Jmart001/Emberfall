extends StaticBody3D

@export var npc_id := ""
@export var display_name := "Guide Elowen"
@export var role := ""
@export_multiline var dialogue_text := (
	"You are awake. That is already better than when we found you."
)
@export var interaction_range := 1
@export var wander_radius_tiles := 5
@export var wander_speed := 3.0
var clothing_color := Color("405f3c")
var wander_home := Vector3.ZERO
var wander_wait := 0.0
var wander_paused := false
var wander_grid
var wander_home_tile := Vector2i.ZERO
var wander_path := PackedVector3Array()
var wander_path_index := 0
var character_animator: AnimationPlayer

const OPEN_CHARACTER_ROOT := (
	"res://assets/third_party/kenney_characters/"
	+ "Models/GLB format/character-"
)
const CHARACTER_MODEL_SCALE := 0.5

func _ready() -> void:
	wander_home = global_position
	wander_wait = randf_range(1.0, 4.0)
	_build_humanoid_details()


func _physics_process(delta: float) -> void:
	if wander_paused:
		_play_character_animation("idle")
		return
	if wander_path_index < wander_path.size():
		var target := wander_path[wander_path_index]
		if not _tile_is_within_wander_radius(
			wander_grid.world_to_tile(target)
		):
			wander_path.clear()
			wander_path_index = 0
			wander_wait = 0.0
			_play_character_animation("idle")
			return
		var direction := global_position.direction_to(target)
		global_position = global_position.move_toward(
			target,
			wander_speed * delta
		)
		if direction.length_squared() > 0.001:
			face_toward(global_position + direction)
		_play_character_animation("walk")
		if global_position.distance_to(target) <= 0.05:
			global_position = target
			wander_path_index += 1
			if wander_path_index >= wander_path.size():
				wander_wait = randf_range(2.0, 5.0)
		return
	_play_character_animation("idle")
	wander_wait -= delta
	if wander_wait > 0.0:
		return
	_choose_wander_path()


func configure(data: Dictionary) -> void:
	npc_id = str(data.get("id", ""))
	display_name = str(data.get("name", "Villager"))
	role = str(data.get("role", "Emberfall resident"))
	dialogue_text = str(data.get(
		"dialogue",
		"%s. The roads have been restless lately." % role
	))
	var color := Color(str(data.get("color", "#6f7f78")))
	clothing_color = color
	if has_node("Body"):
		var material := StandardMaterial3D.new()
		material.albedo_color = color
		material.roughness = 0.9
		$Body.material_override = material
	if has_node("Name"):
		$Name.text = display_name


func _build_humanoid_details() -> void:
	if _build_open_asset_visual():
		return
	$Body.scale = Vector3(0.82, 0.92, 0.62)
	var cloth := _material(clothing_color)
	var skin := _material(Color("d2a47d"))
	var hair := _material(Color("493426"))
	for side in [-1.0, 1.0]:
		_add_capsule(
			"Arm",
			Vector3(side * 0.52, 1.05, 0.0),
			Vector3(0.14, 0.52, 0.14),
			cloth
		)
		_add_capsule(
			"Hand",
			Vector3(side * 0.52, 0.68, 0.0),
			Vector3(0.13, 0.18, 0.13),
			skin
		)
		_add_capsule(
			"Leg",
			Vector3(side * 0.2, 0.35, 0.0),
			Vector3(0.16, 0.56, 0.16),
			_material(clothing_color.darkened(0.28))
		)
	var hair_mesh := SphereMesh.new()
	hair_mesh.radius = 0.31
	hair_mesh.height = 0.3
	var hair_node := MeshInstance3D.new()
	hair_node.name = "Hair"
	hair_node.mesh = hair_mesh
	hair_node.position = Vector3(0.0, 2.04, -0.03)
	hair_node.material_override = hair
	add_child(hair_node)
	for side in [-1.0, 1.0]:
		var eye := MeshInstance3D.new()
		var eye_mesh := SphereMesh.new()
		eye_mesh.radius = 0.035
		eye_mesh.height = 0.07
		eye.mesh = eye_mesh
		eye.position = Vector3(side * 0.1, 1.9, -0.285)
		eye.material_override = _material(Color("22211f"))
		add_child(eye)


func _build_open_asset_visual() -> bool:
	var variants := ["b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m"]
	var variant: String = variants[absi(hash(npc_id)) % variants.size()]
	var packed := load(OPEN_CHARACTER_ROOT + variant + ".glb") as PackedScene
	if packed == null:
		return false
	var model := packed.instantiate()
	model.name = "KenneyCharacter"
	model.scale = Vector3.ONE * CHARACTER_MODEL_SCALE
	add_child(model)
	var animator := model.find_child("AnimationPlayer", true, false) as AnimationPlayer
	if animator != null:
		character_animator = animator
		for animation_name in ["idle", "walk"]:
			if animator.has_animation(animation_name):
				animator.get_animation(animation_name).loop_mode = Animation.LOOP_LINEAR
		animator.play("idle")
	$Body.visible = false
	return true


func configure_wander(grid, home_tile: Vector2i) -> void:
	wander_grid = grid
	wander_home_tile = home_tile
	wander_home = grid.tile_to_world(home_tile)
	wander_path.clear()
	wander_path_index = 0


func set_wander_home(value: Vector3) -> void:
	wander_home = value
	if wander_grid != null:
		wander_home_tile = wander_grid.world_to_tile(value)
	wander_path.clear()
	wander_path_index = 0


func set_wander_paused(value: bool) -> void:
	wander_paused = value
	if value:
		wander_path.clear()
		wander_path_index = 0


func _choose_wander_path() -> void:
	if wander_grid == null:
		wander_wait = 2.0
		return
	for attempt in range(16):
		var offset := Vector2i(
			randi_range(-wander_radius_tiles, wander_radius_tiles),
			randi_range(-wander_radius_tiles, wander_radius_tiles)
		)
		var tile_distance := maxi(absi(offset.x), absi(offset.y))
		if tile_distance < 3 or tile_distance > wander_radius_tiles:
			continue
		var destination: Vector2i = wander_home_tile + offset
		if (
			not wander_grid.contains(destination)
			or wander_grid.is_blocked(destination)
		):
			continue
		var candidate_path: PackedVector3Array = wander_grid.path_world(
			global_position,
			destination
		)
		if candidate_path.is_empty():
			continue
		if not _path_stays_within_wander_radius(candidate_path):
			continue
		wander_path = candidate_path
		wander_path_index = 0
		return
	wander_wait = randf_range(1.0, 2.0)


func _path_stays_within_wander_radius(path: PackedVector3Array) -> bool:
	for point in path:
		if not _tile_is_within_wander_radius(
			wander_grid.world_to_tile(point)
		):
			return false
	return true


func _tile_is_within_wander_radius(tile: Vector2i) -> bool:
	var offset := tile - wander_home_tile
	return maxi(absi(offset.x), absi(offset.y)) <= wander_radius_tiles


func _play_character_animation(animation_name: String) -> void:
	if (
		character_animator == null
		or not character_animator.has_animation(animation_name)
	):
		return
	character_animator.speed_scale = (
		wander_speed / 4.5 if animation_name == "walk" else 1.0
	)
	if character_animator.current_animation == animation_name:
		return
	character_animator.play(animation_name, 0.16)


func face_toward(target_position: Vector3) -> void:
	var flat_target := Vector3(
		target_position.x,
		global_position.y,
		target_position.z
	)
	if global_position.distance_squared_to(flat_target) > 0.0001:
		look_at(flat_target, Vector3.UP)


func _add_capsule(
	node_name: String,
	position: Vector3,
	scale_value: Vector3,
	material: StandardMaterial3D
) -> void:
	var node := MeshInstance3D.new()
	var mesh := CapsuleMesh.new()
	mesh.radius = 0.5
	mesh.height = 1.0
	node.name = node_name
	node.mesh = mesh
	node.position = position
	node.scale = scale_value
	node.material_override = material
	add_child(node)


func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	return material


func is_interactable() -> bool:
	return true


func get_interaction_range() -> int:
	return interaction_range
