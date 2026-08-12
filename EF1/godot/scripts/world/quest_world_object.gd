extends StaticBody3D

var object_kind := ""
var display_name := ""
var action_label := "Use"
var destination := Vector2i.ZERO


func configure(kind: String, label: String, target := Vector2i.ZERO) -> void:
	object_kind = kind
	display_name = label
	destination = target
	action_label = "Open" if kind == "chest" else label
	collision_layer = 2
	collision_mask = 0
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(1.05, 1.4, 1.05)
	shape.shape = box
	shape.position.y = 0.7
	add_child(shape)
	_build_chest() if kind == "chest" else _build_portal()
	var name_label := Label3D.new()
	name_label.text = display_name
	name_label.position = Vector3(0.0, 2.35, 0.0)
	name_label.font_size = 28
	name_label.outline_size = 7
	name_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(name_label)


func is_interactable() -> bool:
	return true


func is_resource_object() -> bool:
	return true


func is_quest_world_object() -> bool:
	return true


func get_interaction_range() -> int:
	return 1


func _build_portal() -> void:
	var stone := StandardMaterial3D.new()
	stone.albedo_color = Color("4d4b50")
	stone.roughness = 0.92
	for x in [-0.72, 0.72]:
		_add_box(Vector3(x, 1.05, 0), Vector3(0.42, 2.1, 0.48), stone)
	_add_box(Vector3(0, 2.08, 0), Vector3(1.85, 0.42, 0.5), stone)
	var void_mesh := MeshInstance3D.new()
	var plane := QuadMesh.new()
	plane.size = Vector2(1.1, 1.55)
	void_mesh.mesh = plane
	void_mesh.position = Vector3(0, 1.05, 0.26)
	var void_material := StandardMaterial3D.new()
	void_material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	void_material.albedo_color = Color("1a0f24")
	void_material.emission_enabled = true
	void_material.emission = Color("5d264f")
	void_mesh.material_override = void_material
	add_child(void_mesh)


func _build_chest() -> void:
	var wood := StandardMaterial3D.new()
	wood.albedo_color = Color("684126")
	wood.roughness = 0.8
	var metal := StandardMaterial3D.new()
	metal.albedo_color = Color("b08a48")
	metal.metallic = 0.7
	_add_box(Vector3(0, 0.42, 0), Vector3(1.15, 0.65, 0.72), wood)
	_add_box(Vector3(0, 0.83, 0), Vector3(1.15, 0.22, 0.72), wood)
	_add_box(Vector3(0, 0.62, -0.38), Vector3(0.2, 0.42, 0.08), metal)


func _add_box(position_value: Vector3, size: Vector3, material: Material) -> void:
	var mesh_instance := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mesh_instance.mesh = mesh
	mesh_instance.position = position_value
	mesh_instance.material_override = material
	add_child(mesh_instance)
