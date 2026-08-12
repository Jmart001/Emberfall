extends StaticBody3D

var display_name := "Your gravestone"
var action_label := "Recover"


func _ready() -> void:
	collision_layer = 2
	collision_mask = 0
	var collision := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(1.15, 1.85, 0.9)
	collision.shape = shape
	collision.position.y = 0.92
	add_child(collision)
	var stone := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = Vector3(0.7, 1.0, 0.28)
	stone.mesh = mesh
	stone.position.y = 0.5
	var material := StandardMaterial3D.new()
	material.albedo_color = Color("77746c")
	material.roughness = 0.92
	stone.material_override = material
	add_child(stone)
	var cap := MeshInstance3D.new()
	var cap_mesh := BoxMesh.new()
	cap_mesh.size = Vector3(0.82, 0.18, 0.36)
	cap.mesh = cap_mesh
	cap.position.y = 1.03
	cap.material_override = material
	add_child(cap)
	var label := Label3D.new()
	label.text = "Your gravestone"
	label.position.y = 1.45
	label.font_size = 18
	label.outline_size = 6
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(label)


func is_gravestone() -> bool:
	return true


func is_interactable() -> bool:
	return true


func is_resource_object() -> bool:
	return true


func requires_cardinal_interaction() -> bool:
	return true


func get_interaction_range() -> int:
	return 1
