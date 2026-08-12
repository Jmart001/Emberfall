extends StaticBody3D

const OPEN_CHARACTER_ROOT := (
	"res://assets/third_party/kenney_characters/"
	+ "Models/GLB format/character-"
)
const OPEN_CHARACTER_SCALE := 0.5
const MONSTER_ASSET_ROOT := "res://assets/third_party/emberfall_monsters/"
const MONSTER_ASSETS := {
	"rat": {
		"path": MONSTER_ASSET_ROOT + "rat.dae",
		"scale": 0.65,
	},
	"goblin": {
		"path": MONSTER_ASSET_ROOT + "goblin.glb",
		"scale": 0.5,
	},
	"wolf": {
		"path": MONSTER_ASSET_ROOT + "wolf.glb",
		"scale": 0.55,
	},
	"direWolf": {
		"path": MONSTER_ASSET_ROOT + "wolf.glb",
		"scale": 0.68,
	},
	"boar": {
		"path": MONSTER_ASSET_ROOT + "boar.glb",
		"scale": 0.62,
	},
}

signal defeated(enemy)

var monster_id := ""
var display_name := "Enemy"
var max_health := 10
var health := 10
var max_hit := 1
var combat_level := 1
var attack_speed := 4
var combat_xp := 0
var drops: Array = []
var alive := true
var respawn_seconds := 12.0
var respawn_remaining := 0.0
var monster_visual: Node3D
var monster_animator: AnimationPlayer
var visual_base_scale := Vector3.ONE
var target_ring: MeshInstance3D
var home_tile := Vector2i.ZERO
var current_tile := Vector2i.ZERO
var stationary := false
var ai_moving := false
var movement_tween: Tween
var detection_range := 5
var leash_range := 8
var home_position := Vector3.ZERO
var has_sigils := false


func configure(id: String, definition: Dictionary) -> void:
	monster_id = id
	display_name = str(definition.get("name", id))
	max_health = int(definition.get("hp", 10))
	health = max_health
	max_hit = int(definition.get("maxHit", 1))
	combat_level = int(definition.get(
		"combatLevel",
		maxi(1, roundi(float(max_health + max_hit * 2) / 3.0))
	))
	attack_speed = int(definition.get("attackSpeed", 4))
	combat_xp = int(definition.get("xp", 0))
	drops = definition.get("drops", [])
	has_sigils = bool(definition.get("hasSigils", false))
	respawn_seconds = 30.0 if bool(definition.get("boss", false)) else 12.0
	$Name.text = display_name
	var material := StandardMaterial3D.new()
	material.albedo_color = Color(str(definition.get("color", "#8a4f45")))
	material.roughness = 0.9
	$Body.material_override = material
	_build_monster_shape(
		material.albedo_color,
		bool(definition.get("boss", false))
	)
	_configure_collision_footprint()
	_build_target_ring()
	_refresh_health()


func _process(delta: float) -> void:
	if alive:
		return
	respawn_remaining -= delta
	if respawn_remaining <= 0.0:
		alive = true
		health = max_health
		current_tile = home_tile
		global_position = home_position
		visible = true
		collision_layer = 2
		monster_visual.scale = visual_base_scale
		_refresh_health()


func reset_full() -> void:
	alive = true
	health = max_health
	current_tile = home_tile
	global_position = home_position
	visible = true
	collision_layer = 2
	if monster_visual != null:
		monster_visual.scale = visual_base_scale
	_refresh_health()


func is_interactable() -> bool:
	return alive


func is_enemy() -> bool:
	return true


func configure_ai(
	spawn_tile: Vector2i,
	spawn_position: Vector3,
	stays_put: bool
) -> void:
	home_tile = spawn_tile
	current_tile = spawn_tile
	home_position = spawn_position
	stationary = stays_put


func move_to_tile(tile: Vector2i, world_position: Vector3) -> void:
	if stationary or ai_moving or not alive:
		return
	current_tile = tile
	face_toward(world_position)
	ai_moving = true
	_play_monster_animation(["Walk", "walk", "Walking"])
	movement_tween = create_tween()
	movement_tween.tween_property(self, "global_position", world_position, 0.32)
	movement_tween.tween_callback(func():
		ai_moving = false
		_play_monster_animation(["Idle", "idle"])
	)


func snap_to_tile(tile: Vector2i, world_position: Vector3) -> void:
	if movement_tween != null and movement_tween.is_valid():
		movement_tween.kill()
	current_tile = tile
	global_position = world_position
	ai_moving = false
	_play_monster_animation(["Idle", "idle"])


func get_interaction_range() -> int:
	return 1


var footprint_offsets: Array = []


func set_footprint(offsets: Array) -> void:
	footprint_offsets = offsets


func occupies_multiple_tiles() -> bool:
	return not footprint_offsets.is_empty() or monster_id in ["wolf", "direWolf"]


func occupied_tiles() -> Array[Vector2i]:
	return occupied_tiles_at(current_tile)


func occupied_tiles_at(anchor_tile: Vector2i) -> Array[Vector2i]:
	if not footprint_offsets.is_empty():
		var footprint: Array[Vector2i] = []
		for offset in footprint_offsets:
			footprint.append(anchor_tile + offset)
		return footprint
	var tiles: Array[Vector2i] = [anchor_tile]
	if occupies_multiple_tiles():
		tiles.append(anchor_tile + Vector2i.DOWN)
	return tiles


func _configure_collision_footprint() -> void:
	if not occupies_multiple_tiles():
		return
	var collision := $CollisionShape3D as CollisionShape3D
	var shape := BoxShape3D.new()
	shape.size = Vector3(1.05, 1.25, 2.75)
	collision.shape = shape
	collision.position = Vector3(0.0, 0.62, 0.0)


func take_damage(amount: int) -> void:
	if not alive:
		return
	health = maxi(0, health - amount)
	_show_damage(amount)
	_refresh_health()
	if health <= 0:
		alive = false
		collision_layer = 0
		respawn_remaining = respawn_seconds
		set_targeted(false)
		var tween := create_tween()
		tween.tween_property(
			monster_visual,
			"scale",
			Vector3(visual_base_scale.x, 0.08, visual_base_scale.z),
			0.24
		)
		tween.tween_callback(func(): visible = false)
		defeated.emit(self)


func _refresh_health() -> void:
	$Health.text = "%d / %d" % [health, max_health]
	$Health.visible = health < max_health and alive


func _show_damage(amount: int) -> void:
	var label := Label3D.new()
	label.text = str(amount)
	label.position = Vector3(0.0, 2.65, 0.0)
	label.modulate = Color("ff5a4f") if amount > 0 else Color("d5d0bd")
	label.outline_size = 7
	label.font_size = 30
	label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	add_child(label)
	var tween := create_tween()
	tween.tween_property(label, "position:y", 3.35, 0.55)
	tween.parallel().tween_property(label, "modulate:a", 0.0, 0.55)
	tween.tween_callback(label.queue_free)


func _build_monster_shape(color: Color, boss: bool) -> void:
	$Body.visible = false
	var visual := Node3D.new()
	visual.name = "MonsterVisual"
	visual.scale = Vector3.ONE * (1.35 if boss else 1.0)
	visual_base_scale = visual.scale
	add_child(visual)
	monster_visual = visual
	if _build_imported_monster(visual):
		return
	if monster_id in ["bandit", "ashwrightRenn"]:
		_build_open_asset_enemy(visual, color)
	elif monster_id in ["rat", "wolf", "boar", "direWolf"]:
		_build_quadruped(visual, color)
	elif monster_id == "spider":
		_build_spider(visual, color)
	elif monster_id == "bat":
		_build_bat(visual, color)
	elif monster_id == "skeleton":
		_build_skeleton(visual)
	else:
		_build_enemy_humanoid(visual, color)


func _build_imported_monster(parent: Node3D) -> bool:
	if not MONSTER_ASSETS.has(monster_id):
		return false
	var settings: Dictionary = MONSTER_ASSETS[monster_id]
	var packed := load(str(settings.path)) as PackedScene
	if packed == null:
		return false
	var model := packed.instantiate() as Node3D
	if model == null:
		return false
	model.name = "ImportedMonsterModel"
	model.scale = Vector3.ONE * float(settings.scale)
	parent.add_child(model)
	monster_animator = model.find_child(
		"AnimationPlayer",
		true,
		false
	) as AnimationPlayer
	_play_monster_animation(["Idle", "idle"])
	return true


func _play_monster_animation(candidates: Array) -> bool:
	if monster_animator == null:
		return false
	var available := monster_animator.get_animation_list()
	for candidate in candidates:
		var wanted := str(candidate).to_lower()
		for available_name in available:
			var animation_name := str(available_name)
			if not animation_name.to_lower().contains(wanted):
				continue
			var animation := monster_animator.get_animation(animation_name)
			if (
				wanted.contains("idle")
				or wanted.contains("walk")
			):
				animation.loop_mode = Animation.LOOP_LINEAR
			monster_animator.play(animation_name, 0.12)
			return true
	return false


func _build_open_asset_enemy(parent: Node3D, color: Color) -> void:
	var variant := "q" if monster_id == "bandit" else "r"
	var packed := load(OPEN_CHARACTER_ROOT + variant + ".glb") as PackedScene
	if packed == null:
		_build_enemy_humanoid(parent, color)
		return
	var model := packed.instantiate()
	model.name = "OpenSourceEnemyModel"
	model.scale = Vector3.ONE * OPEN_CHARACTER_SCALE
	parent.add_child(model)
	var animator := model.find_child(
		"AnimationPlayer",
		true,
		false
	) as AnimationPlayer
	if animator != null and animator.has_animation("idle"):
		animator.get_animation("idle").loop_mode = Animation.LOOP_LINEAR
		animator.play("idle")
	var weapon_color := (
		Color("9b5bba")
		if monster_id == "ashwrightRenn"
		else Color("9b9d96")
	)
	var weapon := _add_box(
		parent,
		Vector3(0.48, 0.92, -0.12),
		Vector3(0.09, 0.72, 0.09),
		weapon_color
	)
	weapon.name = "EnemyWeapon"
	weapon.rotation.z = -0.38
	var grip := _add_box(
		parent,
		Vector3(0.35, 0.65, -0.08),
		Vector3(0.1, 0.3, 0.1),
		Color("5c3b25")
	)
	grip.rotation.z = -0.38
	if monster_id == "ashwrightRenn":
		var ember := _add_sphere(
			parent,
			Vector3(0.61, 1.25, -0.16),
			Vector3(0.16, 0.16, 0.16),
			Color("e56432")
		)
		ember.name = "EmberFocus"


func _build_target_ring() -> void:
	target_ring = MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = 0.72
	mesh.bottom_radius = 0.72
	mesh.height = 0.025
	target_ring.mesh = mesh
	target_ring.position.y = 0.035
	if occupies_multiple_tiles():
		target_ring.scale.z = 2.0
	var material := StandardMaterial3D.new()
	material.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	material.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	material.albedo_color = Color("d94238aa")
	target_ring.material_override = material
	target_ring.visible = false
	add_child(target_ring)


func set_targeted(targeted: bool) -> void:
	if target_ring != null:
		target_ring.visible = targeted and alive


func face_toward(world_target: Vector3) -> void:
	var direction := world_target - global_position
	direction.y = 0.0
	if direction.length_squared() > 0.001:
		if occupies_multiple_tiles():
			monster_visual.rotation.y = 0.0 if direction.z >= 0.0 else PI
		else:
			monster_visual.rotation.y = atan2(direction.x, direction.z)


func play_attack_animation() -> void:
	if monster_visual == null:
		return
	if _play_monster_animation(["Attack", "attack", "Attack1"]):
		return
	var tween := create_tween()
	tween.tween_property(monster_visual, "position:z", -0.22, 0.09)
	tween.tween_property(monster_visual, "position:z", 0.0, 0.14)


func _build_quadruped(parent: Node3D, color: Color) -> void:
	var body_scale := Vector3(0.75, 0.42, 1.0)
	if monster_id == "rat":
		body_scale = Vector3(0.42, 0.25, 0.68)
	_add_sphere(parent, Vector3(0, 0.72, 0.08), body_scale, color)
	_add_sphere(
		parent,
		Vector3(0, 0.78, -0.72),
		Vector3(0.48, 0.4, 0.48),
		color.lightened(0.06)
	)
	for x in [-0.42, 0.42]:
		for z in [-0.5, 0.45]:
			_add_box(
				parent,
				Vector3(x, 0.3, z),
				Vector3(0.16, 0.58, 0.16),
				color.darkened(0.15)
			)
	for x in [-0.18, 0.18]:
		_add_sphere(
			parent,
			Vector3(x, 0.88, -1.08),
			Vector3(0.045, 0.045, 0.045),
			Color("f1c85d")
		)


func _build_enemy_humanoid(parent: Node3D, color: Color) -> void:
	_add_box(parent, Vector3(0, 1.1, 0), Vector3(0.8, 1.05, 0.48), color)
	_add_sphere(
		parent,
		Vector3(0, 1.92, 0),
		Vector3(0.34, 0.36, 0.34),
		color.lightened(0.15)
	)
	for side in [-1.0, 1.0]:
		_add_box(
			parent,
			Vector3(side * 0.53, 1.05, 0),
			Vector3(0.17, 0.9, 0.17),
			color.darkened(0.08)
		)
		_add_box(
			parent,
			Vector3(side * 0.22, 0.35, 0),
			Vector3(0.2, 0.7, 0.22),
			color.darkened(0.25)
		)
		_add_sphere(
			parent,
			Vector3(side * 0.11, 1.98, -0.3),
			Vector3(0.04, 0.04, 0.04),
			Color("ffb53d")
		)


func _build_skeleton(parent: Node3D) -> void:
	var bone := Color("d8d2b6")
	_add_sphere(parent, Vector3(0, 1.92, 0), Vector3(0.32, 0.34, 0.3), bone)
	_add_box(parent, Vector3(0, 1.15, 0), Vector3(0.18, 0.95, 0.16), bone)
	for side in [-1.0, 1.0]:
		_add_box(parent, Vector3(side * 0.4, 1.15, 0), Vector3(0.1, 0.9, 0.1), bone)
		_add_box(parent, Vector3(side * 0.18, 0.38, 0), Vector3(0.11, 0.75, 0.11), bone)
	for y in [0.95, 1.17, 1.39]:
		_add_box(parent, Vector3(0, y, 0), Vector3(0.72, 0.07, 0.12), bone)


func _build_spider(parent: Node3D, color: Color) -> void:
	_add_sphere(parent, Vector3(0, 0.62, 0.25), Vector3(0.65, 0.42, 0.72), color)
	_add_sphere(parent, Vector3(0, 0.58, -0.48), Vector3(0.43, 0.34, 0.43), color.lightened(0.08))
	for side in [-1.0, 1.0]:
		for index in range(4):
			var leg := _add_box(
				parent,
				Vector3(side * (0.72 + index * 0.08), 0.48, -0.35 + index * 0.23),
				Vector3(0.75, 0.08, 0.08),
				color.darkened(0.2)
			)
			leg.rotation.z = side * (0.28 + index * 0.08)


func _build_bat(parent: Node3D, color: Color) -> void:
	_add_sphere(parent, Vector3(0, 1.15, 0), Vector3(0.3, 0.52, 0.28), color)
	for side in [-1.0, 1.0]:
		var wing := _add_box(
			parent,
			Vector3(side * 0.65, 1.28, 0),
			Vector3(1.05, 0.06, 0.52),
			color.darkened(0.08)
		)
		wing.rotation.z = side * 0.28


func _add_box(
	parent: Node3D,
	position: Vector3,
	size: Vector3,
	color: Color
) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	node.mesh = mesh
	node.position = position
	node.material_override = _material(color)
	parent.add_child(node)
	return node


func _add_sphere(
	parent: Node3D,
	position: Vector3,
	scale_value: Vector3,
	color: Color
) -> MeshInstance3D:
	var node := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = 0.5
	mesh.height = 1.0
	node.mesh = mesh
	node.position = position
	node.scale = scale_value
	node.material_override = _material(color)
	parent.add_child(node)
	return node


func _material(color: Color) -> StandardMaterial3D:
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.9
	return material
