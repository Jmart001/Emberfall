extends SceneTree


const LogicalGridClass := preload("res://scripts/world/logical_grid.gd")
const RendererClass := preload("res://scripts/world/legacy_world_renderer.gd")


func _initialize() -> void:
	var terrain := "02be"
	var elevation := [[0, 0, 0, 0]]
	var grid = LogicalGridClass.new(Vector2i(4, 1), Vector3.ZERO)
	grid.set_elevation_data(elevation)
	grid.set_terrain_data(terrain)

	var renderer = RendererClass.new()
	renderer.terrain = terrain
	renderer.elevation = elevation

	for source in [grid, renderer]:
		var ground_height: float = source.surface_height(Vector2i(0, 0))
		var water_height: float = source.surface_height(Vector2i(1, 0))
		var dock_height: float = source.surface_height(Vector2i(2, 0))
		var lava_height: float = source.surface_height(Vector2i(3, 0))
		if not is_equal_approx(water_height, ground_height - 0.08):
			return _fail("Water is not 0.08m below ground.")
		if not is_equal_approx(lava_height, water_height):
			return _fail("Lava does not match the water surface height.")
		if not is_equal_approx(dock_height, ground_height + 0.08):
			return _fail("Docks are not 0.08m above ground.")

	renderer.free()
	print("TERRAIN SURFACE HEIGHTS water=true lava=true dock=true")
	quit(0)


func _fail(message: String) -> void:
	push_error(message)
	quit(1)
