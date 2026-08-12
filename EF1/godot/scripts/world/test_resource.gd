extends StaticBody3D

@export var display_name := "Resource"
@export var action_label := "Use"
@export var reward_item := ""
@export var reward_quantity := 1
@export var skill_name := ""
@export var body_color := Color("6f7f78")
@export var interaction_range := 1
@export var consume_on_use := false
var skill_kind := ""
var skill_definition: Dictionary = {}
var station_type := ""
var successful_actions := 0
var depleted_until := 0
var depletion_pending_until := 0
var ground_item_stack := false
var stack_label: Label3D
var mining_rock_visual: Node3D
var mining_rock_color := Color("b87343")
var harvestable_tree_visual: Node3D
var tree_stump_visual: Node3D

const KENNEY_MODELS := "res://assets/third_party/kenney_nature/Models/DAE format/"
const TOWN_MODELS := (
	"res://assets/third_party/kenney_fantasy_town/Models/GLB format/"
)


func configure(data: Dictionary) -> void:
	display_name = str(data.get("name", display_name))
	action_label = str(data.get("action", action_label))
	reward_item = str(data.get("reward", ""))
	reward_quantity = int(data.get("quantity", 1))
	skill_name = str(data.get("skill", ""))
	body_color = Color(str(data.get("color", "#6f7f78")))
	consume_on_use = bool(data.get("consume", false))
	ground_item_stack = consume_on_use and not reward_item.is_empty()
	$Name.text = display_name
	var material := StandardMaterial3D.new()
	material.albedo_color = body_color
	material.roughness = 0.9
	$Body.material_override = material
	if ground_item_stack:
		_attach_ground_item_sprite()
	else:
		_attach_open_asset_visual()


func configure_skill(kind: String, definition: Dictionary) -> void:
	skill_kind = kind
	skill_definition = definition.duplicate(true)
	display_name = str(definition.get("name", kind.capitalize()))
	$Name.text = display_name
	match kind:
		"fish":
			action_label = "Fish"
		"rock":
			action_label = "Mine"
		"tree":
			action_label = "Chop"
		"hunt":
			action_label = "Set-snare-at"
		"farm":
			action_label = "Tend"
		"altar":
			action_label = "Pray-at"
		"range":
			action_label = "Cook-at"
		_:
			station_type = kind
			action_label = "Use"
	_attach_open_asset_visual()


func _process(_delta: float) -> void:
	if (
		depletion_pending_until > 0
		and Time.get_ticks_msec() >= depletion_pending_until
	):
		_apply_depletion()
	if depleted_until <= 0 or Time.get_ticks_msec() < depleted_until:
		return
	depleted_until = 0
	successful_actions = 0
	visible = true
	collision_layer = 2
	if skill_kind == "rock":
		_set_mining_rock_depleted(false)
	elif skill_kind == "tree":
		_set_tree_depleted(false)


func _attach_open_asset_visual() -> void:
	if skill_kind == "tree":
		_build_harvestable_tree()
		return
	if skill_kind == "fish":
		_build_fishing_ripples()
		return
	if skill_kind == "rock":
		_build_mining_rock()
		return
	if skill_kind == "range":
		if "fire" in display_name.to_lower():
			_build_campfire()
		else:
			_build_cooking_stove()
		return
	match skill_kind:
		"farm":
			_build_farm_patch()
			return
		"hunt":
			_build_snare_spot()
			return
		"workbench":
			_build_workbench()
			return
		"furnace":
			_build_furnace()
			return
		"anvil":
			_build_anvil()
			return
		"altar":
			_build_altar()
			return
		"cauldron":
			_build_cauldron()
			return
	var asset_name := ""
	var visual_scale := Vector3.ONE
	var visual_offset := Vector3.ZERO
	var lower_name := display_name.to_lower()
	if "log" in lower_name:
		asset_name = "log_large.dae"
		visual_scale = Vector3.ONE * 0.8
	elif "bush" in lower_name or "herb" in lower_name:
		asset_name = "plant_bushDetailed.dae"
		visual_scale = Vector3.ONE * 0.85
	elif "pot" in lower_name or "cauldron" in lower_name:
		asset_name = "pot_large.dae"
		visual_scale = Vector3.ONE * 0.75
	if asset_name.is_empty():
		return
	var packed := load(KENNEY_MODELS + asset_name) as PackedScene
	if packed == null:
		return
	var imported := packed.instantiate()
	imported.name = "OpenAssetVisual"
	imported.scale = visual_scale
	imported.position = visual_offset
	add_child(imported)
	$Body.visible = false


func _build_mining_rock() -> void:
	$Body.visible = false
	mining_rock_color = _ore_color()
	var packed := load(TOWN_MODELS + "rock-large.glb") as PackedScene
	if packed != null:
		var rock := packed.instantiate()
		rock.name = "MiningRockVisual"
		rock.scale = Vector3.ONE * 0.95
		add_child(rock)
		mining_rock_visual = rock
		_tint_visual(rock, mining_rock_color)
	_set_collision(Vector3(1.05, 0.82, 1.05), Vector3(0.0, 0.41, 0.0))
	$Name.position.y = 1.28


func _ore_color() -> Color:
	if skill_definition.has("color"):
		return Color(str(skill_definition.color))
	var ore_id := str(skill_definition.get("ore", "")).to_lower()
	if "copper" in ore_id:
		return Color("b87343")
	if "tin" in ore_id:
		return Color("c4c8ca")
	if "iron" in ore_id:
		return Color("8d8174")
	if "coal" in ore_id:
		return Color("292b2d")
	if "mithril" in ore_id:
		return Color("4a78a0")
	if "adamant" in ore_id:
		return Color("3f7650")
	if "runite" in ore_id or "rune" in ore_id:
		return Color("56a6a0")
	if "ember" in ore_id:
		return Color("cf5937")
	return Color("8a8178")


func _set_mining_rock_depleted(depleted: bool) -> void:
	if mining_rock_visual == null:
		return
	_tint_visual(
		mining_rock_visual,
		Color("777b7d") if depleted else mining_rock_color
	)


func _tint_visual(node: Node, color: Color) -> void:
	if node is MeshInstance3D:
		var material := StandardMaterial3D.new()
		material.albedo_color = color
		material.roughness = 0.92
		(node as MeshInstance3D).material_override = material
	for child in node.get_children():
		_tint_visual(child, color)


func _build_campfire() -> void:
	$Body.visible = false
	var packed := load(KENNEY_MODELS + "campfire_stones.dae") as PackedScene
	if packed != null:
		var stones := packed.instantiate()
		stones.name = "CampfireVisual"
		stones.scale = Vector3.ONE * 1.35
		add_child(stones)
	var flame_root := Node3D.new()
	flame_root.name = "FireFlames"
	add_child(flame_root)
	_add_cone_mesh(
		flame_root,
		Vector3(0.0, 0.46, 0.0),
		0.34,
		0.72,
		_visual_material(Color("f28b32"), true)
	)
	_add_cone_mesh(
		flame_root,
		Vector3(0.0, 0.43, -0.02),
		0.19,
		0.48,
		_visual_material(Color("ffd05a"), true)
	)
	_set_collision(Vector3(1.05, 0.65, 1.05), Vector3(0.0, 0.32, 0.0))
	$Name.position.y = 1.25


func _build_cooking_stove() -> void:
	$Body.visible = false
	var stove := Node3D.new()
	stove.name = "CookingStoveVisual"
	add_child(stove)
	var iron := _visual_material(Color("3b4140"))
	var trim := _visual_material(Color("171a1a"))
	var glow := _visual_material(Color("c7592f"), true)
	_add_box_mesh(stove, Vector3(0.0, 0.55, 0.0), Vector3(1.05, 1.1, 0.88), iron)
	_add_box_mesh(stove, Vector3(0.0, 1.12, 0.0), Vector3(1.15, 0.12, 0.98), trim)
	_add_box_mesh(stove, Vector3(0.0, 0.53, -0.455), Vector3(0.7, 0.52, 0.05), trim)
	_add_box_mesh(stove, Vector3(0.0, 0.53, -0.49), Vector3(0.48, 0.31, 0.025), glow)
	for x in [-0.28, 0.28]:
		var plate := MeshInstance3D.new()
		var plate_mesh := CylinderMesh.new()
		plate_mesh.top_radius = 0.19
		plate_mesh.bottom_radius = 0.19
		plate_mesh.height = 0.035
		plate.mesh = plate_mesh
		plate.position = Vector3(x, 1.2, 0.0)
		plate.material_override = trim
		stove.add_child(plate)
	_set_collision(Vector3(1.15, 1.2, 0.98), Vector3(0.0, 0.6, 0.0))
	$Name.position.y = 1.72


func _build_fishing_ripples() -> void:
	$Body.visible = false
	var ripples := Node3D.new()
	ripples.name = "FishingRipples"
	add_child(ripples)
	var water_material := _visual_material(Color(0.35, 0.84, 1.0, 0.8), true)
	for radius in [0.22, 0.42, 0.62]:
		var ring := MeshInstance3D.new()
		var torus := TorusMesh.new()
		torus.inner_radius = radius - 0.025
		torus.outer_radius = radius + 0.025
		torus.rings = 24
		torus.ring_segments = 8
		ring.mesh = torus
		ring.position.y = 0.06 + radius * 0.025
		ring.material_override = water_material
		ripples.add_child(ring)
	_set_collision(Vector3(1.35, 0.18, 1.35), Vector3(0.0, 0.09, 0.0))
	$Name.position.y = 0.72


func _build_farm_patch() -> void:
	$Body.visible = false
	var root := Node3D.new()
	root.name = "FarmPatchVisual"
	add_child(root)
	var soil := _visual_material(Color("65452f"))
	var earth := _visual_material(Color("3f2d22"))
	var leaf := _visual_material(Color("4e9a50"))
	_add_box_mesh(root, Vector3(0, 0.08, 0), Vector3(1.35, 0.16, 1.35), soil)
	for x in [-0.42, 0.0, 0.42]:
		_add_box_mesh(root, Vector3(x, 0.19, 0), Vector3(0.2, 0.14, 1.18), earth)
		for z in [-0.38, 0.0, 0.38]:
			_add_cone_mesh(root, Vector3(x, 0.38, z), 0.13, 0.34, leaf)
	_set_collision(Vector3(1.35, 0.28, 1.35), Vector3(0, 0.14, 0))
	$Name.position.y = 0.9


func _build_snare_spot() -> void:
	$Body.visible = false
	var root := Node3D.new()
	root.name = "SnareSpotVisual"
	add_child(root)
	var rope := _visual_material(Color("b79a67"))
	var stake := _visual_material(Color("6f4829"))
	var loop := MeshInstance3D.new()
	var torus := TorusMesh.new()
	torus.inner_radius = 0.34
	torus.outer_radius = 0.385
	loop.mesh = torus
	loop.rotation.x = PI * 0.5
	loop.position = Vector3(0, 0.42, 0)
	loop.material_override = rope
	root.add_child(loop)
	_add_box_mesh(root, Vector3(-0.42, 0.38, 0), Vector3(0.09, 0.76, 0.09), stake)
	_add_box_mesh(root, Vector3(0.0, 0.12, 0.0), Vector3(0.8, 0.07, 0.07), rope)
	_set_collision(Vector3(1.0, 0.75, 0.8), Vector3(0, 0.37, 0))
	$Name.position.y = 1.15


func _build_workbench() -> void:
	$Body.visible = false
	var root := Node3D.new()
	root.name = "WorkbenchVisual"
	add_child(root)
	var wood := _visual_material(Color("81552f"))
	var dark := _visual_material(Color("51351f"))
	_add_box_mesh(root, Vector3(0, 0.82, 0), Vector3(1.35, 0.18, 0.72), wood)
	for x in [-0.52, 0.52]:
		for z in [-0.24, 0.24]:
			_add_box_mesh(root, Vector3(x, 0.4, z), Vector3(0.14, 0.8, 0.14), dark)
	_add_box_mesh(root, Vector3(0.18, 0.98, 0), Vector3(0.62, 0.05, 0.08), dark)
	_set_collision(Vector3(1.35, 0.95, 0.75), Vector3(0, 0.48, 0))
	$Name.position.y = 1.35


func _build_furnace() -> void:
	$Body.visible = false
	var root := Node3D.new()
	root.name = "FurnaceVisual"
	add_child(root)
	var stone := _visual_material(Color("666b68"))
	var dark := _visual_material(Color("262827"))
	var fire := _visual_material(Color("ed7132"), true)
	_add_box_mesh(root, Vector3(0, 0.7, 0), Vector3(1.2, 1.4, 1.05), stone)
	_add_box_mesh(root, Vector3(0, 0.55, -0.55), Vector3(0.62, 0.58, 0.08), dark)
	_add_box_mesh(root, Vector3(0, 0.55, -0.6), Vector3(0.4, 0.35, 0.04), fire)
	_add_box_mesh(root, Vector3(0, 1.47, 0.18), Vector3(0.55, 0.42, 0.55), dark)
	_set_collision(Vector3(1.2, 1.7, 1.08), Vector3(0, 0.85, 0))
	$Name.position.y = 2.05


func _build_anvil() -> void:
	$Body.visible = false
	var root := Node3D.new()
	root.name = "AnvilVisual"
	add_child(root)
	var iron := _visual_material(Color("464d50"))
	_add_box_mesh(root, Vector3(0, 0.25, 0), Vector3(0.48, 0.5, 0.48), iron)
	_add_box_mesh(root, Vector3(0, 0.58, 0), Vector3(0.72, 0.22, 0.55), iron)
	_add_cone_mesh(root, Vector3(0.56, 0.64, 0), 0.28, 0.7, iron)
	root.get_child(root.get_child_count() - 1).rotation.z = -PI * 0.5
	_set_collision(Vector3(1.2, 0.82, 0.72), Vector3(0.2, 0.41, 0))
	$Name.position.y = 1.2


func _build_altar() -> void:
	$Body.visible = false
	var root := Node3D.new()
	root.name = "AltarVisual"
	add_child(root)
	var stone := _visual_material(Color("d1d0c5"))
	var gold := _visual_material(Color("d6ad4f"), true)
	_add_box_mesh(root, Vector3(0, 0.25, 0), Vector3(1.15, 0.5, 0.9), stone)
	_add_box_mesh(root, Vector3(0, 0.61, 0), Vector3(0.92, 0.22, 0.72), stone)
	_add_box_mesh(root, Vector3(0, 0.88, 0.2), Vector3(0.18, 0.5, 0.18), gold)
	_add_box_mesh(root, Vector3(0, 1.05, 0.2), Vector3(0.48, 0.16, 0.16), gold)
	_set_collision(Vector3(1.15, 0.85, 0.9), Vector3(0, 0.42, 0))
	$Name.position.y = 1.45


func _build_cauldron() -> void:
	$Body.visible = false
	var root := Node3D.new()
	root.name = "CauldronVisual"
	add_child(root)
	var packed := load(KENNEY_MODELS + "pot_large.dae") as PackedScene
	if packed != null:
		var pot := packed.instantiate()
		pot.scale = Vector3.ONE * 1.25
		root.add_child(pot)
	var liquid := MeshInstance3D.new()
	var liquid_mesh := CylinderMesh.new()
	liquid_mesh.top_radius = 0.36
	liquid_mesh.bottom_radius = 0.36
	liquid_mesh.height = 0.04
	liquid.mesh = liquid_mesh
	liquid.position.y = 0.74
	liquid.material_override = _visual_material(Color("5cba75"), true)
	root.add_child(liquid)
	_set_collision(Vector3(1.0, 0.9, 1.0), Vector3(0, 0.45, 0))
	$Name.position.y = 1.35


func _set_collision(size: Vector3, position_value: Vector3) -> void:
	var collision := $CollisionShape3D as CollisionShape3D
	var shape := BoxShape3D.new()
	shape.size = size
	collision.shape = shape
	collision.position = position_value


func _visual_material(color: Color, emission := false) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.82
	if emission:
		material.emission_enabled = true
		material.emission = Color(color.r, color.g, color.b)
		material.emission_energy_multiplier = 1.25
		if color.a < 1.0:
			material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	return material


func _add_box_mesh(
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


func _add_cone_mesh(
	parent: Node3D,
	position_value: Vector3,
	radius: float,
	height: float,
	material: Material
) -> void:
	var part := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.03
	mesh.bottom_radius = radius
	mesh.height = height
	part.mesh = mesh
	part.position = position_value
	part.material_override = material
	parent.add_child(part)


func _build_harvestable_tree() -> void:
	$Body.visible = false
	var collision := $CollisionShape3D as CollisionShape3D
	var shape := CapsuleShape3D.new()
	shape.radius = 0.32
	shape.height = 2.8
	collision.shape = shape
	collision.position.y = 1.4
	$Name.position.y = 4.15

	var tree := Node3D.new()
	tree.name = "HarvestableTreeVisual"
	add_child(tree)
	harvestable_tree_visual = tree
	var bark := StandardMaterial3D.new()
	bark.albedo_color = Color("765035")
	bark.roughness = 0.96
	var dark_bark := StandardMaterial3D.new()
	dark_bark.albedo_color = Color("4c3426")
	dark_bark.roughness = 1.0
	var foliage := StandardMaterial3D.new()
	foliage.albedo_color = Color("3f8772")
	foliage.roughness = 0.9
	var foliage_light := StandardMaterial3D.new()
	foliage_light.albedo_color = Color("62a47a")
	foliage_light.roughness = 0.88

	_add_tree_cylinder(
		tree, Vector3(0, 1.35, 0), 0.29, 0.4, 2.7, bark
	)
	for y in [0.65, 1.2, 1.75]:
		_add_tree_cylinder(
			tree, Vector3(0, y, 0), 0.315, 0.315, 0.09, dark_bark
		)
	_add_tree_cone(
		tree, Vector3(0, 2.45, 0), 1.18, 1.6, foliage
	)
	_add_tree_cone(
		tree, Vector3(0, 3.15, 0), 0.92, 1.45, foliage_light
	)
	_add_tree_cone(
		tree, Vector3(0, 3.72, 0), 0.6, 1.15, foliage
	)

	var notch := MeshInstance3D.new()
	var notch_mesh := BoxMesh.new()
	notch_mesh.size = Vector3(0.3, 0.3, 0.08)
	notch.mesh = notch_mesh
	notch.position = Vector3(0, 0.78, -0.31)
	notch.rotation.z = deg_to_rad(45.0)
	var notch_material := StandardMaterial3D.new()
	notch_material.albedo_color = Color("d4aa70")
	notch.material_override = notch_material
	tree.add_child(notch)

	var stump := Node3D.new()
	stump.name = "TreeStumpVisual"
	stump.visible = false
	add_child(stump)
	tree_stump_visual = stump
	_add_tree_cylinder(
		stump, Vector3(0.0, 0.2, 0.0), 0.27, 0.34, 0.4, bark
	)
	var stump_top := StandardMaterial3D.new()
	stump_top.albedo_color = Color("c59a62")
	stump_top.roughness = 0.95
	_add_tree_cylinder(
		stump, Vector3(0.0, 0.405, 0.0), 0.265, 0.265, 0.025, stump_top
	)


func _set_tree_depleted(depleted: bool) -> void:
	if harvestable_tree_visual != null:
		harvestable_tree_visual.visible = not depleted
	if tree_stump_visual != null:
		tree_stump_visual.visible = depleted
	$Name.position.y = 0.9 if depleted else 4.15


func _add_tree_cylinder(
	parent: Node3D,
	position_value: Vector3,
	top_radius: float,
	bottom_radius: float,
	height: float,
	material: Material
) -> void:
	var part := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = top_radius
	mesh.bottom_radius = bottom_radius
	mesh.height = height
	part.mesh = mesh
	part.position = position_value
	part.material_override = material
	parent.add_child(part)


func _add_tree_cone(
	parent: Node3D,
	position_value: Vector3,
	radius: float,
	height: float,
	material: Material
) -> void:
	var part := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.08
	mesh.bottom_radius = radius
	mesh.height = height
	part.mesh = mesh
	part.position = position_value
	part.material_override = material
	parent.add_child(part)


func is_interactable() -> bool:
	return true


func is_resource_object() -> bool:
	return true


func is_skill_station() -> bool:
	return not station_type.is_empty()


func is_continuous_skill_action() -> bool:
	return skill_kind in ["fish", "rock", "tree", "range"]


func action_duration() -> float:
	match skill_kind:
		"fish":
			return 1.8
		"rock", "tree":
			return 1.5
		"range":
			return 1.2
	return 1.2


func get_interaction_range() -> int:
	return interaction_range


func requires_cardinal_interaction() -> bool:
	return skill_kind in ["rock", "tree"]


func perform_action() -> String:
	if depletion_pending_until > 0:
		if Time.get_ticks_msec() >= depletion_pending_until:
			_apply_depletion()
		return "This resource is depleted."
	if depleted_until > Time.get_ticks_msec():
		return "This resource is depleted."
	match skill_kind:
		"fish":
			return SkillingSystem.fish(skill_definition)
		"rock":
			var mine_result: Dictionary = SkillingSystem.mine(skill_definition)
			if bool(mine_result.get("success", false)):
				_record_depletion()
			return str(mine_result.get("message", "You mine the rock."))
		"tree":
			var chop_result: Dictionary = SkillingSystem.chop(skill_definition)
			if bool(chop_result.get("success", false)):
				_record_depletion()
			return str(chop_result.get("message", "You chop the tree."))
		"hunt":
			return SkillingSystem.hunt(skill_definition)
		"farm":
			return SkillingSystem.farm(skill_definition)
		"altar":
			GameState.data.prayer = GameState.data.max_prayer
			GameState.mark_changed()
			return "You recharge your Prayer points."
		"range":
			return SkillingSystem.cook_one()
	if reward_item.is_empty():
		if action_label == "Pray-at":
			GameState.data.prayer = GameState.data.max_prayer
			GameState.save_game()
			GameState.changed.emit()
			return "Your Prayer points are restored."
		return "You use the %s." % display_name
	var pickup_quantity := reward_quantity
	if ground_item_stack and not ItemCatalog.is_stackable(reward_item):
		pickup_quantity = 1
	if not GameState.add_item(reward_item, pickup_quantity):
		return "Your backpack is full."
	if not skill_name.is_empty():
		if not GameState.data.has("skill_xp"):
			GameState.data.skill_xp = {}
		GameState.data.skill_xp[skill_name] = int(
			GameState.data.skill_xp.get(skill_name, 0)
		) + 10
		GameState.save_game()
	var message := "You receive %d %s." % [pickup_quantity, reward_item]
	if ground_item_stack:
		reward_quantity -= pickup_quantity
		_refresh_ground_stack()
		message = (
			"You take %d %s." % [pickup_quantity, reward_item]
			if pickup_quantity > 1
			else "You take the %s." % reward_item
		)
	elif consume_on_use:
		queue_free()
	return message


func _attach_ground_item_sprite() -> void:
	$Body.visible = false
	var sprite := Sprite3D.new()
	sprite.name = "ItemIcon"
	sprite.texture = load(ItemCatalog.icon_path(reward_item))
	sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	sprite.pixel_size = 0.012
	sprite.position.y = 0.58
	add_child(sprite)
	stack_label = Label3D.new()
	stack_label.position = Vector3(0.42, 0.92, 0.0)
	stack_label.font_size = 26
	stack_label.outline_size = 7
	stack_label.modulate = Color("f2d46e")
	stack_label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(stack_label)
	_refresh_ground_stack()


func _refresh_ground_stack() -> void:
	if stack_label != null:
		stack_label.text = "x%d" % reward_quantity if reward_quantity > 1 else ""
	$Name.text = (
		"%s (%d)" % [display_name, reward_quantity]
		if reward_quantity > 1 else display_name
	)
	if reward_quantity <= 0:
		queue_free()


func _record_depletion() -> void:
	successful_actions += 1
	if successful_actions < 3 and randf() >= 0.2:
		return
	depletion_pending_until = (
		Time.get_ticks_msec() + roundi(action_duration() * 1000.0)
	)


func _apply_depletion() -> void:
	if depletion_pending_until <= 0:
		return
	depletion_pending_until = 0
	depleted_until = Time.get_ticks_msec() + 15000
	collision_layer = 0
	if skill_kind == "rock":
		_set_mining_rock_depleted(true)
	elif skill_kind == "tree":
		_set_tree_depleted(true)
	else:
		visible = false
