class_name InteractiveDoor
extends StaticBody3D

signal state_changed(first_tile: Vector2i, second_tile: Vector2i, is_open: bool)

const TILE_SIZE := 1.5
const DOOR_WIDTH := TILE_SIZE
const DOOR_HEIGHT := 2.08
const OPEN_ANGLE := PI * 0.5

var display_name := "Door"
var action_label := "Open"
var first_tile := Vector2i.ZERO
var second_tile := Vector2i.ZERO
var partner: InteractiveDoor
var is_open := false
var hinge_side := -1
var closed_rotation := 0.0
var moving := false


func configure(
	edge: Dictionary,
	center: Vector3,
	paired_hinge_side := -1
) -> void:
	collision_layer = 2
	collision_mask = 0
	first_tile = Vector2i(int(edge.x1), int(edge.y1))
	second_tile = Vector2i(int(edge.x2), int(edge.y2))
	hinge_side = paired_hinge_side
	display_name = "Double door" if paired_hinge_side != 0 else "Door"
	name = "Door_%d_%d_%d_%d" % [
		first_tile.x, first_tile.y, second_tile.x, second_tile.y
	]
	var direction := second_tile - first_tile
	var along := Vector3.BACK if direction.x != 0 else Vector3.RIGHT
	var leaf_direction: Vector3 = -along * float(hinge_side if hinge_side != 0 else -1)
	global_position = (
		center
		+
		along
		* float(hinge_side if hinge_side != 0 else -1)
		* TILE_SIZE
		* 0.5
	)
	closed_rotation = atan2(leaf_direction.x, leaf_direction.z)
	rotation.y = closed_rotation
	_build_model()
	_build_collision()


func set_partner(other: InteractiveDoor) -> void:
	partner = other
	display_name = "Double door"


func _build_model() -> void:
	var door := Node3D.new()
	door.name = "BlockDoorVisual"
	add_child(door)
	var wood := _material(Color("81532f"))
	var dark_wood := _material(Color("52351f"))
	var window := _material(Color(0.45, 0.72, 0.76, 0.72))
	window.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	var metal := _material(Color("d1b56f"))
	_add_box(
		door,
		Vector3(0.0, DOOR_HEIGHT * 0.5, DOOR_WIDTH * 0.5),
		Vector3(0.13, DOOR_HEIGHT, DOOR_WIDTH),
		wood
	)
	for face_sign in [-1.0, 1.0]:
		for z in [0.25, 0.75, 1.25]:
			_add_box(
				door,
				Vector3(face_sign * 0.072, 0.62, z),
				Vector3(0.025, 0.08, 0.38),
				dark_wood
			)
		for z in [0.38, 1.12]:
			_add_box(
				door,
				Vector3(face_sign * 0.073, 1.55, z),
				Vector3(0.027, 0.36, 0.46),
				window
			)
		_add_box(
			door,
			Vector3(face_sign * 0.078, 1.25, DOOR_WIDTH * 0.5),
			Vector3(0.035, 0.1, DOOR_WIDTH),
			dark_wood
		)
		var knob := MeshInstance3D.new()
		knob.name = "HandleFront" if face_sign < 0.0 else "HandleBack"
		var knob_mesh := SphereMesh.new()
		knob_mesh.radius = 0.07
		knob_mesh.height = 0.14
		knob.mesh = knob_mesh
		knob.position = Vector3(
			face_sign * 0.13,
			0.98,
			DOOR_WIDTH - 0.19
		)
		knob.material_override = metal
		door.add_child(knob)
	var hinge_index := 0
	for hinge_y in [0.36, 1.04, 1.72]:
		var hinge := MeshInstance3D.new()
		hinge.name = "WallHinge%d" % hinge_index
		var hinge_mesh := CylinderMesh.new()
		hinge_mesh.top_radius = 0.055
		hinge_mesh.bottom_radius = 0.055
		hinge_mesh.height = 0.24
		hinge.mesh = hinge_mesh
		hinge.position = Vector3(0.0, hinge_y, 0.035)
		hinge.material_override = metal
		door.add_child(hinge)
		hinge_index += 1


func _add_box(
	parent: Node3D,
	position_value: Vector3,
	size: Vector3,
	material: Material
) -> void:
	var part := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	part.mesh = mesh
	part.position = position_value
	part.material_override = material
	parent.add_child(part)


func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	return material


func _build_collision() -> void:
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(0.14, DOOR_HEIGHT, DOOR_WIDTH)
	collision.shape = shape
	collision.position = Vector3(0.0, DOOR_HEIGHT * 0.5, DOOR_WIDTH * 0.5)
	add_child(collision)


func is_interactable() -> bool:
	return not moving


func is_resource_object() -> bool:
	return true


func get_interaction_range() -> int:
	return 1


func perform_action() -> String:
	if bool(get_meta("barrow_unlocked", false)):
		return "The chamber door is fixed open."
	if moving:
		return "The door is already moving."
	var next_state := not is_open
	_set_open_internal(next_state)
	if partner != null and is_instance_valid(partner):
		partner._set_open_internal(next_state)
	return "You %s the %s." % [
		"open" if next_state else "close",
		display_name.to_lower(),
	]


func set_revealed(revealed: bool) -> void:
	visible = revealed
	collision_layer = 2 if revealed else 0


func set_open_immediate(open: bool) -> void:
	is_open = open
	moving = false
	action_label = "Close" if open else "Open"
	var swing_sign := float(hinge_side if hinge_side != 0 else -1)
	rotation.y = closed_rotation + (OPEN_ANGLE * swing_sign if open else 0.0)
	state_changed.emit(first_tile, second_tile, open)


func _set_open_internal(open: bool) -> void:
	if is_open == open or moving:
		return
	is_open = open
	moving = true
	action_label = "Close" if open else "Open"
	if open:
		state_changed.emit(first_tile, second_tile, true)
	var swing_sign := float(hinge_side if hinge_side != 0 else -1)
	var target_rotation := closed_rotation + (OPEN_ANGLE * swing_sign if open else 0.0)
	var tween := create_tween()
	tween.set_trans(Tween.TRANS_SINE)
	tween.set_ease(Tween.EASE_IN_OUT)
	tween.tween_property(self, "rotation:y", target_rotation, 0.38)
	tween.tween_callback(_finish_motion.bind(open))


func _finish_motion(open: bool) -> void:
	moving = false
	if not open:
		state_changed.emit(first_tile, second_tile, false)
