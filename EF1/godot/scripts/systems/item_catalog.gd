extends Node

var items: Dictionary = {}
var shops: Dictionary = {}
var names_to_ids: Dictionary = {}


func _ready() -> void:
	var file := FileAccess.open("res://data/legacy_world.json", FileAccess.READ)
	var parsed: Dictionary = JSON.parse_string(file.get_as_text())
	items = parsed.get("items", {})
	shops = parsed.get("shops", {})
	for item_id in items:
		names_to_ids[str(items[item_id].get("name", item_id))] = item_id


func id_for_name(item_name: String) -> String:
	return str(names_to_ids.get(item_name, item_name))


func item(item_name: String) -> Dictionary:
	return items.get(id_for_name(item_name), {})


func display_name(item_id: String) -> String:
	return str(items.get(item_id, {}).get("name", item_id))


func icon_path(item_name: String) -> String:
	return "res://assets/items/%s.png" % id_for_name(item_name)


func is_stackable(item_name: String) -> bool:
	return bool(item(item_name).get("stack", false))


func equipment_slot(item_name: String) -> String:
	var definition := item(item_name)
	var slot := str(definition.get("slot", ""))
	if not slot.is_empty():
		return slot
	if (
		definition.has("attack")
		or definition.has("ranged")
		or definition.has("magic")
	):
		return "weapon"
	if definition.has("defence"):
		return "armor"
	return ""
