extends SceneTree


func _initialize() -> void:
	_run.call_deferred()


func _run() -> void:
	var packed: PackedScene = load("res://scenes/greenrest/greenrest.tscn")
	var world: Node3D = packed.instantiate()
	root.add_child(world)
	await physics_frame

	var starting_yaw: float = world.camera_yaw
	var starting_pitch: float = world.camera_pitch
	var starting_distance: float = world.camera_distance

	var middle_down := InputEventMouseButton.new()
	middle_down.button_index = MOUSE_BUTTON_MIDDLE
	middle_down.pressed = true
	world._unhandled_input(middle_down)
	var drag := InputEventMouseMotion.new()
	drag.relative = Vector2(40.0, -20.0)
	world._unhandled_input(drag)
	var middle_up := InputEventMouseButton.new()
	middle_up.button_index = MOUSE_BUTTON_MIDDLE
	middle_up.pressed = false
	world._unhandled_input(middle_up)

	world._zoom_camera(-100.0)
	var minimum_zoom_valid: bool = world.camera_distance == world.CAMERA_MIN_DISTANCE
	world._zoom_camera(100.0)
	var maximum_zoom_valid: bool = world.camera_distance == world.CAMERA_MAX_DISTANCE
	var rotation_changed: bool = (
		world.camera_yaw != starting_yaw and world.camera_pitch != starting_pitch
	)

	print(
		"CAMERA_TEST start_distance=",
		starting_distance,
		" rotation_changed=",
		rotation_changed,
		" min_valid=",
		minimum_zoom_valid,
		" max_valid=",
		maximum_zoom_valid
	)
	if not rotation_changed or not minimum_zoom_valid or not maximum_zoom_valid:
		push_error("Camera control smoke test failed.")
		quit(1)
		return
	quit(0)

