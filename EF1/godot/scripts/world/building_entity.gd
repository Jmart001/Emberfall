class_name BuildingEntity
extends Node3D

@export var entity_id: StringName = &"building"
@export var display_name := "Building"
@export var footprint_tiles := Vector2i(7, 5)
@export_enum("North", "East", "South", "West") var doorway_side := "South"


func _ready() -> void:
	add_to_group("buildings")
	var label := get_node_or_null("BuildingName") as Label3D
	if label != null:
		label.text = display_name


func get_center_tile(grid) -> Vector2i:
	return grid.world_to_tile(global_position)


func get_doorway_tile(grid) -> Vector2i:
	var center := get_center_tile(grid)
	var half_width := footprint_tiles.x / 2
	var half_height := footprint_tiles.y / 2
	match doorway_side:
		"North":
			return center + Vector2i(0, -half_height)
		"East":
			return center + Vector2i(half_width, 0)
		"West":
			return center + Vector2i(-half_width, 0)
		_:
			return center + Vector2i(0, half_height)


func get_doorway_outside_tile(grid) -> Vector2i:
	var doorway := get_doorway_tile(grid)
	match doorway_side:
		"North":
			return doorway + Vector2i.UP
		"East":
			return doorway + Vector2i.RIGHT
		"West":
			return doorway + Vector2i.LEFT
		_:
			return doorway + Vector2i.DOWN
