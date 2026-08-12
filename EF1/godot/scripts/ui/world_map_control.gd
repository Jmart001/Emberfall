extends Control

signal cursor_changed(text: String)

const MAP_SIZE := Vector2i(192, 160)
const COLORS := [
	Color("789451"), Color("9b8b68"), Color("507344"), Color("385f37"),
	Color("746b5b"), Color("a59773"), Color("69645c"), Color("745c3c"),
	Color("506f83"), Color("90826d"), Color("8a6b4e"), Color("75604e"),
	Color("577c56"), Color("6d7653"),
]
const LANDMARKS := [
	[Vector2(174, 44), "Greenrest"],
	[Vector2(98, 72), "Pineholt"],
	[Vector2(151, 78), "Thornwood"],
	[Vector2(150, 132), "Cinderforge"],
	[Vector2(38, 125), "Sablemarsh"],
	[Vector2(95, 18), "Frostmere"],
	[Vector2(30, 50), "Ashfall Wastes"],
	[Vector2(16, 79), "Ashen Barrow"],
]

var terrain := ""
var map_texture: ImageTexture
var player_tile := Vector2.ZERO
var quest_tiles: Array[Vector2] = []
var objective_tile := Vector2(-1.0, -1.0)
var zoom := 3.0
var pan := Vector2.ZERO
var dragging := false
var last_mouse := Vector2.ZERO


func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_STOP
	clip_contents = true
	_load_terrain()
	_center_after_layout()


func set_player_tile(tile: Vector2i) -> void:
	player_tile = Vector2(tile)
	queue_redraw()


func set_quest_tiles(tiles: Array[Vector2]) -> void:
	quest_tiles = tiles
	queue_redraw()


func set_objective_tile(tile: Vector2i) -> void:
	objective_tile = Vector2(tile)
	queue_redraw()


func recenter() -> void:
	pan = size * 0.5 - player_tile * zoom
	_clamp_pan_to_map()
	queue_redraw()


func _process(_delta: float) -> void:
	if objective_tile.x >= 0.0:
		queue_redraw()


func _center_after_layout() -> void:
	await get_tree().process_frame
	await get_tree().process_frame
	recenter()


func zoom_by(factor: float, focus := Vector2(-1, -1)) -> void:
	var cursor: Vector2 = focus if focus.x >= 0.0 else size * 0.5
	var before := (cursor - pan) / zoom
	zoom = clampf(zoom * factor, 2.0, 8.0)
	pan = cursor - before * zoom
	_clamp_pan_to_map()
	queue_redraw()


func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
			zoom_by(1.25, event.position)
			accept_event()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			zoom_by(0.8, event.position)
			accept_event()
		elif event.button_index == MOUSE_BUTTON_LEFT:
			dragging = event.pressed
			last_mouse = event.position
			accept_event()
	elif event is InputEventMouseMotion:
		if dragging:
			pan += event.position - last_mouse
			_clamp_pan_to_map()
			last_mouse = event.position
			queue_redraw()
		var tile := Vector2i((event.position - pan) / zoom)
		if tile.x >= 0 and tile.y >= 0 and tile.x < MAP_SIZE.x and tile.y < MAP_SIZE.y:
			cursor_changed.emit("Tile %d, %d" % [tile.x, tile.y])
		else:
			cursor_changed.emit("")


func _clamp_pan_to_map() -> void:
	var rendered_size := Vector2(MAP_SIZE) * zoom
	if rendered_size.x <= size.x:
		pan.x = (size.x - rendered_size.x) * 0.5
	else:
		pan.x = clampf(pan.x, size.x - rendered_size.x, 0.0)
	if rendered_size.y <= size.y:
		pan.y = (size.y - rendered_size.y) * 0.5
	else:
		pan.y = clampf(pan.y, size.y - rendered_size.y, 0.0)


func _draw() -> void:
	draw_rect(Rect2(Vector2.ZERO, size), Color("151711"))
	if terrain.is_empty():
		return
	if map_texture != null:
		draw_texture_rect(
			map_texture,
			Rect2(pan, Vector2(MAP_SIZE) * zoom),
			false
		)
	for landmark in LANDMARKS:
		var map_position: Vector2 = pan + landmark[0] * zoom
		if Rect2(Vector2.ZERO, size).has_point(map_position):
			draw_circle(map_position, maxf(2.0, zoom * 0.65), Color("d8bc6b"))
			if zoom >= 3.0:
				draw_string(
					ThemeDB.fallback_font,
					map_position + Vector2(5, -5),
					str(landmark[1]),
					HORIZONTAL_ALIGNMENT_LEFT,
					-1,
					12,
					Color("f1e4bd")
				)
	for tile in quest_tiles:
		var quest_position := pan + tile * zoom
		draw_circle(quest_position, maxf(3.0, zoom), Color("f1d64f"))
		draw_string(
			ThemeDB.fallback_font,
			quest_position + Vector2(-3, 4),
			"!",
			HORIZONTAL_ALIGNMENT_LEFT,
			-1,
			13,
			Color("251c08")
		)
	if objective_tile.x >= 0.0:
		var objective_position := pan + objective_tile * zoom
		if Rect2(Vector2.ZERO, size).has_point(objective_position):
			var pulse := (sin(Time.get_ticks_msec() / 180.0) + 1.0) * 0.5
			draw_circle(
				objective_position,
				maxf(8.0, zoom * 1.8) + pulse * 7.0,
				Color(0.95, 0.44, 0.18, 0.22),
				false,
				2.0
			)
			draw_circle(
				objective_position,
				maxf(5.0, zoom * 1.15),
				Color("f06b32"),
				false,
				3.0
			)
			draw_circle(objective_position, maxf(2.5, zoom * 0.55), Color("fff0a8"))
	var marker := pan + player_tile * zoom
	draw_circle(marker, maxf(6.0, zoom * 1.5), Color("111111aa"))
	draw_circle(marker, maxf(4.0, zoom), Color("f4f4ef"))
	draw_circle(marker, maxf(2.0, zoom * 0.48), Color("d94238"))


func _load_terrain() -> void:
	var file := FileAccess.open("res://data/legacy_world.json", FileAccess.READ)
	if file == null:
		return
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if parsed is Dictionary:
		terrain = str(parsed.get("terrain", ""))
	if terrain.length() != MAP_SIZE.x * MAP_SIZE.y:
		return
	var image := Image.create(MAP_SIZE.x, MAP_SIZE.y, false, Image.FORMAT_RGBA8)
	for y in range(MAP_SIZE.y):
		for x in range(MAP_SIZE.x):
			var value := "0123456789abcde".find(terrain[y * MAP_SIZE.x + x])
			image.set_pixel(
				x,
				y,
				COLORS[value] if value >= 0 and value < COLORS.size() else Color("605b50")
			)
	map_texture = ImageTexture.create_from_image(image)
