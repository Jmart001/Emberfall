extends CharacterBody3D

@export var movement_speed := 4.5

var visual: Node3D
var movement_path := PackedVector3Array()
var path_index := 0
var moving := false
var left_arm: MeshInstance3D
var right_arm: MeshInstance3D
var left_leg: MeshInstance3D
var right_leg: MeshInstance3D
var walk_time := 0.0
var attack_pose_time := 0.0
var open_asset_animator: AnimationPlayer
var open_asset_animation := ""
var equipment_visual_root: Node3D
var weapon_hand: Node3D
var shield_hand: Node3D
var animated_torso: Node3D
var animated_head: Node3D
var animated_left_leg: Node3D
var animated_right_leg: Node3D

const OPEN_CHARACTER := (
	"res://assets/third_party/kenney_characters/"
	+ "Models/GLB format/character-a.glb"
)
const CHARACTER_MODEL_SCALE := 0.5


func _ready() -> void:
	collision_layer = 1
	collision_mask = 1
	_build_visual()
	_build_equipment_visuals()
	if not GameState.changed.is_connected(_refresh_equipment_visuals):
		GameState.changed.connect(_refresh_equipment_visuals)
	_refresh_equipment_visuals()
	var collision := CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.28
	capsule.height = 1.0
	collision.shape = capsule
	collision.position.y = 0.5
	add_child(collision)


func _physics_process(_delta: float) -> void:
	_animate_locomotion(_delta)
	if not moving or path_index >= movement_path.size():
		_stop_moving()
		return

	var target := movement_path[path_index]
	var flat_position := Vector3(global_position.x, target.y, global_position.z)
	if flat_position.distance_to(target) <= 0.12:
		global_position.x = target.x
		global_position.z = target.z
		path_index += 1
		if path_index >= movement_path.size():
			_stop_moving()
			return
		target = movement_path[path_index]

	var direction := global_position.direction_to(target)
	direction.y = 0.0
	if direction.length_squared() < 0.001:
		velocity = Vector3.ZERO
		return
	direction = direction.normalized()
	velocity = direction * movement_speed
	visual.rotation.y = lerp_angle(visual.rotation.y, atan2(direction.x, direction.z), 0.22)
	move_and_slide()


func set_movement_path(new_path: PackedVector3Array) -> void:
	movement_path = new_path
	path_index = 0
	moving = not movement_path.is_empty()


func cancel_movement() -> void:
	movement_path.clear()
	path_index = 0
	_stop_moving()


func has_reached_target() -> bool:
	return not moving


func face_toward(world_target: Vector3) -> void:
	var direction := world_target - global_position
	direction.y = 0.0
	if direction.length_squared() > 0.001:
		visual.rotation.y = atan2(direction.x, direction.z)


func _stop_moving() -> void:
	velocity = Vector3.ZERO
	moving = false


func _build_visual() -> void:
	visual = Node3D.new()
	visual.name = "Visual"
	add_child(visual)
	if _build_open_asset_visual():
		return

	var body := MeshInstance3D.new()
	var body_mesh := CapsuleMesh.new()
	body_mesh.radius = 0.43
	body_mesh.height = 1.5
	body.mesh = body_mesh
	body.position.y = 0.9
	body.material_override = _material(Color("486b86"))
	visual.add_child(body)

	var head := MeshInstance3D.new()
	var head_mesh := SphereMesh.new()
	head_mesh.radius = 0.3
	head_mesh.height = 0.6
	head.mesh = head_mesh
	head.position.y = 1.85
	head.material_override = _material(Color("d8ad83"))
	visual.add_child(head)

	var cape := MeshInstance3D.new()
	var cape_mesh := BoxMesh.new()
	cape_mesh.size = Vector3(0.65, 1.1, 0.08)
	cape.mesh = cape_mesh
	cape.position = Vector3(0.0, 1.05, -0.4)
	cape.material_override = _material(Color("793f35"))
	visual.add_child(cape)

	body.scale = Vector3(0.84, 0.94, 0.64)
	var cloth := _material(Color("486b86"))
	var skin := _material(Color("d8ad83"))
	var trousers := _material(Color("303d47"))
	for side in [-1.0, 1.0]:
		var arm := _add_body_part(
			visual, Vector3(side * 0.52, 1.05, 0.0),
			Vector3(0.14, 0.54, 0.14), cloth
		)
		_add_body_part(
			visual, Vector3(side * 0.52, 0.67, 0.0),
			Vector3(0.13, 0.18, 0.13), skin
		)
		var leg := _add_body_part(
			visual, Vector3(side * 0.2, 0.35, 0.0),
			Vector3(0.16, 0.57, 0.16), trousers
		)
		if side < 0:
			left_arm = arm
			left_leg = leg
		else:
			right_arm = arm
			right_leg = leg
	var hair := MeshInstance3D.new()
	var hair_mesh := SphereMesh.new()
	hair_mesh.radius = 0.31
	hair_mesh.height = 0.3
	hair.mesh = hair_mesh
	hair.position = Vector3(0.0, 2.04, -0.03)
	hair.material_override = _material(Color("382a22"))
	visual.add_child(hair)
	for side in [-1.0, 1.0]:
		var eye := MeshInstance3D.new()
		var eye_mesh := SphereMesh.new()
		eye_mesh.radius = 0.035
		eye_mesh.height = 0.07
		eye.mesh = eye_mesh
		eye.position = Vector3(side * 0.1, 1.9, 0.285)
		eye.material_override = _material(Color("202326"))
		visual.add_child(eye)


func _build_open_asset_visual() -> bool:
	var packed := load(OPEN_CHARACTER) as PackedScene
	if packed == null:
		return false
	var model := packed.instantiate()
	model.name = "KenneyCharacter"
	model.scale = Vector3.ONE * CHARACTER_MODEL_SCALE
	visual.add_child(model)
	weapon_hand = model.find_child("arm-right", true, false) as Node3D
	shield_hand = model.find_child("arm-left", true, false) as Node3D
	animated_torso = model.find_child("torso", true, false) as Node3D
	animated_head = model.find_child("head", true, false) as Node3D
	animated_left_leg = model.find_child("leg-left", true, false) as Node3D
	animated_right_leg = model.find_child("leg-right", true, false) as Node3D
	open_asset_animator = model.find_child("AnimationPlayer", true, false)
	if open_asset_animator != null:
		_set_animation_loop("idle", true)
		_set_animation_loop("walk", true)
		open_asset_animator.play("idle")
		open_asset_animation = "idle"
	return true


func _build_equipment_visuals() -> void:
	equipment_visual_root = Node3D.new()
	equipment_visual_root.name = "EquipmentVisuals"
	visual.add_child(equipment_visual_root)


func _refresh_equipment_visuals() -> void:
	if equipment_visual_root == null:
		return
	for child in equipment_visual_root.get_children():
		equipment_visual_root.remove_child(child)
		child.queue_free()
	for attached_visual in visual.find_children("Equipped*", "", true, false):
		if attached_visual.get_parent() == null:
			continue
		attached_visual.get_parent().remove_child(attached_visual)
		attached_visual.queue_free()
	var equipment: Dictionary = GameState.data.get("equipment", {})
	_add_weapon_visual(str(equipment.get("weapon", "")))
	_add_shield_visual(str(equipment.get("shield", "")))
	_add_armor_visual(str(equipment.get("armor", "")))
	_add_helmet_visual(str(equipment.get("helmet", "")))
	_add_legs_visual(str(equipment.get("legs", "")))
	_add_gloves_visual(str(equipment.get("gloves", "")))
	_add_charm_visual(str(equipment.get("charm", "")))


func _add_weapon_visual(item_name: String) -> void:
	if item_name.is_empty():
		return
	var lower := item_name.to_lower()
	var root := Node3D.new()
	root.name = "EquippedWeapon"
	if weapon_hand != null:
		if "bow" in lower or "staff" in lower:
			root.position = Vector3(-0.12, -0.78, 0.04)
			root.rotation_degrees = Vector3.ZERO
		else:
			root.position = Vector3(-0.1, -0.78, 0.02)
			root.rotation_degrees = Vector3(90.0, 0.0, 0.0)
		root.scale = Vector3.ONE / CHARACTER_MODEL_SCALE
		weapon_hand.add_child(root)
	elif "bow" in lower or "staff" in lower:
		root.position = Vector3(0.38, 0.68, 0.02)
		root.rotation_degrees = Vector3(8.0, 0.0, -12.0)
		equipment_visual_root.add_child(root)
	else:
		root.position = Vector3(-0.4, 0.58, 0.04)
		root.rotation_degrees = Vector3(90.0, 0.0, 0.0)
		equipment_visual_root.add_child(root)
	if "bow" in lower:
		_add_box(root, Vector3(-0.08, 0.18, 0.0), Vector3(0.045, 0.34, 0.045), _material(Color("8a542d")), -18.0)
		_add_box(root, Vector3(0.08, -0.18, 0.0), Vector3(0.045, 0.34, 0.045), _material(Color("8a542d")), -18.0)
		_add_box(root, Vector3(0.0, 0.0, 0.0), Vector3(0.015, 0.72, 0.015), _material(Color("e8dfc8")))
	elif "staff" in lower:
		_add_cylinder(root, Vector3.ZERO, 0.035, 0.78, _material(Color("65401f")))
		var focus_color := Color("ff8b38") if "ember" in lower else Color("84c8ff")
		_add_sphere(root, Vector3(0.0, 0.43, 0.0), 0.11, _emissive_material(focus_color))
	elif "axe" in lower:
		_add_cylinder(root, Vector3.ZERO, 0.032, 0.65, _material(Color("65401f")))
		_add_box(root, Vector3(-0.1, 0.28, 0.0), Vector3(0.25, 0.17, 0.055), _metal_material(item_name))
	else:
		var blade_length := 0.36 if "dagger" in lower else 0.62
		var blade_center := 0.34 if "dagger" in lower else 0.46
		_add_box(
			root, Vector3(0.0, blade_center, 0.0),
			Vector3(0.085, blade_length, 0.04),
			_metal_material(item_name)
		)
		_add_box(
			root, Vector3(0.0, 0.13, 0.0),
			Vector3(0.25, 0.05, 0.065),
			_material(Color("c7a052"))
		)
		_add_cylinder(
			root, Vector3(0.0, -0.01, 0.0),
			0.04, 0.24, _material(Color("493020"))
		)
		_add_sphere(
			root, Vector3(0.0, -0.15, 0.0),
			0.055, _material(Color("c7a052"))
		)


func _add_shield_visual(item_name: String) -> void:
	if item_name.is_empty():
		return
	var root := Node3D.new()
	root.name = "EquippedShield"
	_attach_equipment_root(
		root, shield_hand, Vector3(0.4, 0.69, 0.03),
		Vector3(90.0, 0.0, 0.0)
	)
	var lower := item_name.to_lower()
	var radius := 0.2
	if "tower" in lower:
		radius = 0.28
	elif "buckler" in lower:
		radius = 0.16
	elif "kiteshield" in lower or "guard" in lower:
		radius = 0.23
	_add_cylinder(root, Vector3.ZERO, radius, 0.07, _metal_material(item_name))
	_add_sphere(root, Vector3(0.0, 0.035, 0.0), 0.06, _material(Color("c9a34e")))


func _add_armor_visual(item_name: String) -> void:
	if item_name.is_empty():
		return
	var root := Node3D.new()
	root.name = "EquippedArmor"
	_attach_equipment_root(root, animated_torso, Vector3.ZERO, Vector3.ZERO)
	var material := _equipment_material(item_name)
	var lower := item_name.to_lower()
	var torso_size := Vector3(0.58, 0.5, 0.38)
	var shoulder_size := Vector3(0.16, 0.16, 0.39)
	if "platebody" in lower:
		torso_size = Vector3(0.61, 0.52, 0.41)
		shoulder_size = Vector3(0.18, 0.18, 0.42)
	elif "robe" in lower or "cloak" in lower or "mantle" in lower:
		torso_size = Vector3(0.6, 0.56, 0.36)
	elif "cape" in lower:
		torso_size = Vector3(0.56, 0.48, 0.34)
		_add_box(
			root, Vector3(0.0, 0.65, -0.22),
			Vector3(0.52, 0.72, 0.08), material
		)
	_add_box(root, Vector3(0.0, 0.71, 0.0), torso_size, material)
	_add_box(root, Vector3(-0.34, 0.82, 0.0), shoulder_size, material)
	_add_box(root, Vector3(0.34, 0.82, 0.0), shoulder_size, material)


func _add_helmet_visual(item_name: String) -> void:
	if item_name.is_empty():
		return
	var root := Node3D.new()
	root.name = "EquippedHelmet"
	_attach_equipment_root(root, animated_head, Vector3.ZERO, Vector3.ZERO)
	_add_cylinder(
		root, Vector3(0.0, 1.19, 0.0),
		0.235, 0.24, _equipment_material(item_name)
	)
	_add_box(
		root, Vector3(0.0, 1.08, 0.205),
		Vector3(0.36, 0.075, 0.04), _metal_material(item_name)
	)


func _add_legs_visual(item_name: String) -> void:
	if item_name.is_empty():
		return
	var material := _equipment_material(item_name)
	var left_root := Node3D.new()
	left_root.name = "EquippedLegLeft"
	_attach_equipment_root(left_root, animated_left_leg, Vector3.ZERO, Vector3.ZERO)
	_add_box(left_root, Vector3(-0.13, 0.31, 0.0), Vector3(0.22, 0.46, 0.26), material)
	var right_root := Node3D.new()
	right_root.name = "EquippedLegRight"
	_attach_equipment_root(right_root, animated_right_leg, Vector3.ZERO, Vector3.ZERO)
	_add_box(right_root, Vector3(0.13, 0.31, 0.0), Vector3(0.22, 0.46, 0.26), material)


func _add_gloves_visual(item_name: String) -> void:
	if item_name.is_empty():
		return
	if "charm" in item_name.to_lower():
		_add_charm_visual(item_name)
		return
	var material := _equipment_material(item_name)
	var weapon_glove := Node3D.new()
	weapon_glove.name = "EquippedWeaponGlove"
	_attach_equipment_root(weapon_glove, weapon_hand, Vector3.ZERO, Vector3.ZERO)
	_add_sphere(weapon_glove, Vector3(-0.38, 0.57, 0.0), 0.115, material)
	var shield_glove := Node3D.new()
	shield_glove.name = "EquippedShieldGlove"
	_attach_equipment_root(shield_glove, shield_hand, Vector3.ZERO, Vector3.ZERO)
	_add_sphere(shield_glove, Vector3(0.38, 0.57, 0.0), 0.115, material)


func _add_charm_visual(item_name: String) -> void:
	if item_name.is_empty():
		return
	var root := Node3D.new()
	root.name = "EquippedCharm"
	_attach_equipment_root(root, animated_torso, Vector3.ZERO, Vector3.ZERO)
	_add_cylinder(root, Vector3(0.0, 0.69, 0.16), 0.045, 0.025, _material(Color("e5bf42")))


func _attach_equipment_root(
	root: Node3D,
	animated_parent: Node3D,
	visual_position: Vector3,
	visual_rotation_degrees: Vector3
) -> void:
	if animated_parent == null:
		root.position = visual_position
		root.rotation_degrees = visual_rotation_degrees
		equipment_visual_root.add_child(root)
		return
	var desired_transform := visual.global_transform * Transform3D(
		Basis.from_euler(visual_rotation_degrees * PI / 180.0),
		visual_position
	)
	animated_parent.add_child(root)
	root.global_transform = desired_transform


func _add_box(
	parent: Node3D,
	at: Vector3,
	size: Vector3,
	material: StandardMaterial3D,
	rotation_z := 0.0
) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.position = at
	node.rotation_degrees.z = rotation_z
	node.material_override = material
	parent.add_child(node)
	return node


func _add_cylinder(
	parent: Node3D,
	at: Vector3,
	radius: float,
	height: float,
	material: StandardMaterial3D
) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = radius
	mesh.bottom_radius = radius
	mesh.height = height
	node.mesh = mesh
	node.position = at
	node.material_override = material
	parent.add_child(node)
	return node


func _add_sphere(
	parent: Node3D,
	at: Vector3,
	radius: float,
	material: StandardMaterial3D
) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = radius
	mesh.height = radius * 2.0
	node.mesh = mesh
	node.position = at
	node.material_override = material
	parent.add_child(node)
	return node


func _equipment_material(item_name: String) -> StandardMaterial3D:
	var lower := item_name.to_lower()
	if "leather" in lower:
		return _material(Color("74482d"))
	if "silk" in lower:
		return _material(Color("71548a"))
	if "warden" in lower:
		return _material(Color("263c35"))
	if "thorn" in lower:
		return _material(Color("486b3c"))
	return _metal_material(item_name)


func _metal_material(item_name: String) -> StandardMaterial3D:
	var lower := item_name.to_lower()
	if "bronze" in lower:
		return _material(Color("a9683a"))
	if "steel" in lower:
		return _material(Color("aab4bd"))
	if "mithril" in lower:
		return _material(Color("5c91ba"))
	if "ember" in lower:
		return _emissive_material(Color("dc6738"))
	if "iron" in lower:
		return _material(Color("69747b"))
	return _material(Color("a4a8a9"))


func _emissive_material(color: Color) -> StandardMaterial3D:
	var material := _material(color)
	material.emission_enabled = true
	material.emission = color
	material.emission_energy_multiplier = 0.6
	return material


func _set_animation_loop(animation_name: StringName, enabled: bool) -> void:
	if not open_asset_animator.has_animation(animation_name):
		return
	var animation := open_asset_animator.get_animation(animation_name)
	animation.loop_mode = Animation.LOOP_LINEAR if enabled else Animation.LOOP_NONE


func _add_body_part(
	parent: Node3D,
	position: Vector3,
	scale_value: Vector3,
	material: StandardMaterial3D
) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := CapsuleMesh.new()
	mesh.radius = 0.5
	mesh.height = 1.0
	node.mesh = mesh
	node.position = position
	node.scale = scale_value
	node.material_override = material
	parent.add_child(node)
	return node


func _animate_locomotion(delta: float) -> void:
	if open_asset_animator != null:
		if attack_pose_time > 0.0:
			attack_pose_time -= delta
			return
		var desired := "walk" if moving else "idle"
		if desired != open_asset_animation:
			open_asset_animator.play(desired, 0.16)
			open_asset_animation = desired
		return
	if left_arm == null:
		return
	if attack_pose_time > 0.0:
		attack_pose_time -= delta
		return
	if moving:
		walk_time += delta * 9.0
		var swing := sin(walk_time) * 0.55
		left_arm.rotation.x = swing
		right_arm.rotation.x = -swing
		left_leg.rotation.x = -swing * 0.75
		right_leg.rotation.x = swing * 0.75
		visual.position.y = absf(sin(walk_time * 2.0)) * 0.035
	else:
		left_arm.rotation.x = lerpf(left_arm.rotation.x, 0.0, 0.18)
		right_arm.rotation.x = lerpf(right_arm.rotation.x, 0.0, 0.18)
		left_leg.rotation.x = lerpf(left_leg.rotation.x, 0.0, 0.18)
		right_leg.rotation.x = lerpf(right_leg.rotation.x, 0.0, 0.18)
		visual.position.y = lerpf(visual.position.y, 0.0, 0.18)


func play_attack_animation(style: String) -> void:
	if open_asset_animator != null:
		attack_pose_time = 0.52
		open_asset_animator.play(
			"attack-melee-right" if style == "melee" else "interact-right",
			0.08
		)
		open_asset_animation = (
			"attack-melee-right" if style == "melee" else "interact-right"
		)
		return
	if right_arm == null:
		return
	attack_pose_time = 0.48
	var tween := create_tween()
	if style == "ranged":
		tween.tween_property(left_arm, "rotation:x", -1.15, 0.09)
		tween.parallel().tween_property(right_arm, "rotation:x", -0.75, 0.09)
	elif style == "magic":
		tween.tween_property(right_arm, "rotation:x", -1.45, 0.11)
	else:
		tween.tween_property(right_arm, "rotation:x", -1.75, 0.1)
	tween.tween_property(right_arm, "rotation:x", 0.45, 0.14)
	tween.tween_property(right_arm, "rotation:x", 0.0, 0.12)
	tween.parallel().tween_property(left_arm, "rotation:x", 0.0, 0.12)


func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	return material
