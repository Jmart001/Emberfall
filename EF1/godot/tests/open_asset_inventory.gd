extends SceneTree


func _init() -> void:
	var path := (
		"res://assets/third_party/kenney_characters/"
		+ "Models/GLB format/character-a.glb"
	)
	var packed := load(path) as PackedScene
	if packed == null:
		push_error("Could not load Kenney character scene")
		quit(1)
		return
	var instance := packed.instantiate()
	root.add_child(instance)
	print("ROOT:", instance.name, " SCALE:", instance.scale)
	_print_tree(instance, "")
	quit()


func _print_tree(node: Node, indent: String) -> void:
	var detail := ""
	if node is AnimationPlayer:
		detail = " animations=" + str(node.get_animation_list())
	print(indent, node.name, " [", node.get_class(), "]", detail)
	for child in node.get_children():
		_print_tree(child, indent + "  ")
