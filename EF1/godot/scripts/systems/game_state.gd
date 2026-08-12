extends Node

signal changed
signal xp_gained(skill_name: String, amount: int, old_level: int, new_level: int)
signal save_status(message: String)

const SAVE_PATH := "user://emberfall_save.json"
const CHARACTER_INDEX_PATH := "user://emberfall_characters.json"
const INTRO_QUEST := "a_wanderer_in_greenrest"
const INVENTORY_SLOTS := 30
const SKILL_NAMES := [
	"Attack", "Strength", "Defence", "Ranged", "Magic", "Prayer",
	"Slayer", "Crafting", "Thieving", "Herblore", "Farming", "Hunter",
	"Fletching", "Hitpoints", "Fishing", "Cooking", "Mining", "Smithing",
	"Woodcutting", "Firemaking",
]

var data: Dictionary = {}
var save_dirty := false
var autosave_elapsed := 0.0


func _ready() -> void:
	if not load_game():
		new_game()
	_ensure_character_roster()


func _process(delta: float) -> void:
	if not data.is_empty() and float(data.get("special_energy", 100.0)) < 100.0:
		data.special_energy = minf(100.0, float(data.special_energy) + delta * 2.78)
		save_dirty = true
	if not save_dirty:
		return
	autosave_elapsed += delta
	if autosave_elapsed >= 2.0:
		save_game()


func new_game() -> void:
	data = _fresh_character_data("Wanderer")
	changed.emit()


func _fresh_character_data(character_name: String) -> Dictionary:
	return {
		"name": character_name,
		"health": 10,
		"max_health": 10,
		"prayer": 1,
		"max_prayer": 1,
		"run_energy": 100.0,
		"run_enabled": false,
		"active_prayer": "",
		"special_energy": 100.0,
		"special_armed": false,
		"poison": 0,
		"inventory": {"Coins": 30, "Bread": 2},
		"bank": {},
		"equipment": {
			"weapon": "Bronze sword", "helmet": "", "armor": "",
			"legs": "", "shield": "", "gloves": "", "charm": "",
		},
		"skills": {
			"Attack": 1, "Strength": 1, "Defence": 1, "Hitpoints": 10,
			"Ranged": 1, "Magic": 1, "Prayer": 1, "Mining": 1,
			"Smithing": 1, "Fishing": 1, "Cooking": 1, "Woodcutting": 1,
			"Slayer": 1, "Crafting": 1, "Thieving": 1, "Herblore": 1,
			"Farming": 1, "Hunter": 1, "Fletching": 1, "Firemaking": 1,
		},
		"skill_xp": {},
		"combat_style": "accurate",
		"kill_log": {},
		"discovered_regions": {},
		"barrow_runs": 0,
		"barrow_collection": {},
		"quests": {
			"a_wanderer_in_greenrest": {
				"state": "available",
				"stage": "available",
				"objective": "Speak with Guide Elowen.",
			},
		},
		"player_tile": {"x": 174, "y": 44},
	}


func quest_state(quest_id: String) -> String:
	return str(data.quests.get(quest_id, {}).get("state", "locked"))


func quest_stage(quest_id: String) -> String:
	return str(data.quests.get(quest_id, {}).get("stage", quest_state(quest_id)))


func accept_quest(quest_id: String) -> void:
	if quest_state(quest_id) != "available":
		return
	data.quests[quest_id].state = "active"
	data.quests[quest_id].stage = "buy_supplies"
	data.quests[quest_id].objective = (
		"Buy a Fishing rod and 3 Fishing bait from Fisher Murphy."
	)
	_save_and_emit()


func advance_quest(quest_id: String, stage: String, objective: String) -> void:
	if quest_state(quest_id) != "active":
		return
	data.quests[quest_id].stage = stage
	data.quests[quest_id].objective = objective
	_save_and_emit()


func complete_quest(quest_id: String) -> void:
	if (
		quest_id != INTRO_QUEST
		or
		quest_state(quest_id) != "active"
		or quest_stage(quest_id) != "return"
	):
		return
	data.quests[quest_id].state = "complete"
	data.quests[quest_id].stage = "complete"
	data.quests[quest_id].objective = "Complete"
	add_item("Coins", 100, false)
	if not data.has("skill_xp"):
		data.skill_xp = {}
	for skill_name in ["Attack", "Fishing", "Cooking"]:
		data.skill_xp[skill_name] = int(
			data.skill_xp.get(skill_name, 0)
		) + 500
	_save_and_emit()
	if Engine.has_singleton("QuestSystem") or get_node_or_null("/root/QuestSystem") != null:
		get_node("/root/QuestSystem").ensure_quests()


func slayer_contract_interaction() -> String:
	var contract: Dictionary = data.get("slayer_contract", {})
	if not contract.is_empty() and int(contract.get("remaining", 0)) <= 0:
		var total := int(contract.get("total", 4))
		var coins := 40 + total * 15
		var xp := total * 18
		add_item("Coins", coins, false)
		add_skill_xp("Slayer", xp, false)
		data.slayer_contract = {}
		_save_and_emit()
		return "Contract complete: %d coins and %d Slayer XP." % [coins, xp]
	if not contract.is_empty():
		return "Defeat %d more %ss for your Slayer contract." % [
			int(contract.get("remaining", 0)),
			str(contract.get("name", "monster")),
		]
	var choices := [
		{"kind": "rat", "name": "Giant rat"},
		{"kind": "goblin", "name": "Goblin raider"},
	]
	if quest_state(INTRO_QUEST) == "complete":
		choices.append_array([
			{"kind": "wolf", "name": "Grey wolf"},
			{"kind": "boar", "name": "Wild boar"},
			{"kind": "bandit", "name": "Road bandit"},
		])
	var selected: Dictionary = choices.pick_random()
	data.slayer_contract = {
		"kind": selected.kind,
		"name": selected.name,
		"total": 4,
		"remaining": 4,
	}
	_save_and_emit()
	return "New contract: defeat 4 %ss." % selected.name


func record_slayer_kill(monster_id: String) -> bool:
	var contract: Dictionary = data.get("slayer_contract", {})
	if contract.is_empty() or str(contract.get("kind", "")) != monster_id:
		return false
	if int(contract.get("remaining", 0)) <= 0:
		return false
	contract.remaining = int(contract.remaining) - 1
	data.slayer_contract = contract
	_save_and_emit()
	return true


func item_count(item_name: String) -> int:
	return int(data.inventory.get(item_name, 0))


func can_add(item_name: String) -> bool:
	return item_count(item_name) > 0 or data.inventory.size() < INVENTORY_SLOTS


func used_inventory_slots() -> int:
	return data.inventory.size()


func xp_for_level(level: int) -> int:
	if level <= 1:
		return 0
	var accumulated := 0
	for current_level in range(1, mini(level, 99)):
		accumulated += floori(
			current_level + 300.0 * pow(2.0, current_level / 7.0)
		)
	return floori(accumulated / 4.0)


func level_for_xp(xp: int) -> int:
	for level in range(99, 1, -1):
		if xp >= xp_for_level(level):
			return level
	return 1


func add_skill_xp(skill_name: String, amount: int, save := true) -> int:
	if amount <= 0 or skill_name not in SKILL_NAMES:
		return int(data.skills.get(skill_name, 1))
	if not data.has("skill_xp"):
		data.skill_xp = {}
	data.skill_xp[skill_name] = int(data.skill_xp.get(skill_name, 0)) + amount
	var old_level := int(data.skills.get(skill_name, 1))
	var new_level := level_for_xp(int(data.skill_xp[skill_name]))
	if skill_name == "Hitpoints":
		new_level = maxi(10, new_level)
	data.skills[skill_name] = new_level
	if skill_name == "Hitpoints" and new_level > old_level:
		var increase := new_level - old_level
		data.max_health = 9 + new_level
		data.health = mini(int(data.max_health), int(data.health) + increase)
	if skill_name == "Prayer":
		data.max_prayer = new_level
		data.prayer = mini(int(data.prayer), new_level)
	if save:
		_save_and_emit()
	xp_gained.emit(skill_name, amount, old_level, new_level)
	return new_level


func add_item(item_name: String, quantity := 1, save := true) -> bool:
	if quantity > 0 and not can_add(item_name):
		return false
	data.inventory[item_name] = item_count(item_name) + quantity
	if save:
		_save_and_emit()
	return true


func remove_item(item_name: String, quantity := 1, save := true) -> bool:
	if item_count(item_name) < quantity:
		return false
	var remaining := item_count(item_name) - quantity
	if remaining <= 0:
		data.inventory.erase(item_name)
	else:
		data.inventory[item_name] = remaining
	if save:
		_save_and_emit()
	return true


func buy_item(item_name: String, price: int) -> bool:
	if item_count("Coins") < price or not can_add(item_name):
		return false
	data.inventory["Coins"] = item_count("Coins") - price
	add_item(item_name, 1, false)
	_update_intro_supply_step()
	_save_and_emit()
	return true


func _update_intro_supply_step() -> void:
	if (
		quest_stage(INTRO_QUEST) == "buy_supplies"
		and item_count("Fishing rod") >= 1
		and item_count("Fishing bait") >= 3
	):
		data.quests[INTRO_QUEST].stage = "fish"
		data.quests[INTRO_QUEST].objective = (
			"Catch a riverfish at the western docks."
		)


func sell_item(item_name: String, price: int) -> bool:
	if item_name == "Coins" or not remove_item(item_name, 1, false):
		return false
	add_item("Coins", price, false)
	_save_and_emit()
	return true


func deposit_item(item_name: String) -> bool:
	return deposit_quantity(item_name, 1) > 0


func deposit_quantity(item_name: String, requested: int) -> int:
	var quantity := mini(item_count(item_name), requested)
	if quantity <= 0 or not remove_item(item_name, quantity, false):
		return 0
	data.bank[item_name] = int(data.bank.get(item_name, 0)) + quantity
	_save_and_emit()
	return quantity


func withdraw_quantity(item_name: String, requested: int) -> int:
	var available := int(data.bank.get(item_name, 0))
	var quantity := mini(available, requested)
	if quantity <= 0 or not can_add(item_name):
		return 0
	var remaining := available - quantity
	if remaining <= 0:
		data.bank.erase(item_name)
	else:
		data.bank[item_name] = remaining
	add_item(item_name, quantity, false)
	_save_and_emit()
	return quantity


func deposit_all_inventory() -> int:
	var deposited := 0
	for item_name in data.inventory.keys():
		var quantity := int(data.inventory.get(item_name, 0))
		if quantity <= 0:
			continue
		data.bank[item_name] = int(data.bank.get(item_name, 0)) + quantity
		deposited += quantity
	data.inventory.clear()
	if deposited > 0:
		_save_and_emit()
	return deposited


func deposit_all_equipment() -> int:
	var deposited := 0
	for slot in data.equipment:
		var item_name := str(data.equipment[slot])
		if item_name.is_empty():
			continue
		data.bank[item_name] = int(data.bank.get(item_name, 0)) + 1
		data.equipment[slot] = ""
		deposited += 1
	if deposited > 0:
		_save_and_emit()
	return deposited


func equip_item(item_name: String) -> bool:
	var slot := ItemCatalog.equipment_slot(item_name)
	if slot.is_empty() or item_count(item_name) <= 0:
		return false
	var definition := ItemCatalog.item(item_name)
	var requirement := int(definition.get("req", 0))
	var skill_name := str(definition.get("reqSkill", "Attack"))
	if int(data.skills.get(skill_name, 1)) < requirement:
		return false
	var old_item := str(data.equipment.get(slot, ""))
	remove_item(item_name, 1, false)
	data.equipment[slot] = item_name
	if not old_item.is_empty():
		add_item(old_item, 1, false)
	_save_and_emit()
	return true


func unequip_slot(slot: String) -> bool:
	var item_name := str(data.equipment.get(slot, ""))
	if item_name.is_empty() or not can_add(item_name):
		return false
	data.equipment[slot] = ""
	add_item(item_name, 1, false)
	_save_and_emit()
	return true


func equipment_bonuses() -> Dictionary:
	var result := {"attack": 0, "ranged": 0, "magic": 0, "defence": 0}
	for slot in data.equipment:
		var item_name := str(data.equipment[slot])
		if item_name.is_empty():
			continue
		var definition := ItemCatalog.item(item_name)
		for bonus in result:
			result[bonus] += int(definition.get(bonus, 0))
	return result


func use_consumable(item_name: String) -> String:
	var definition := ItemCatalog.item(item_name)
	if item_count(item_name) <= 0:
		return ""
	if definition.has("heal"):
		if (
			int(data.health) >= int(data.max_health)
			and not definition.has("cure")
		):
			return "You are already at full health."
		remove_item(item_name, 1, false)
		data.health = mini(int(data.max_health), int(data.health) + int(definition.heal))
	elif definition.has("energy"):
		remove_item(item_name, 1, false)
		data.run_energy = minf(100.0, float(data.run_energy) + float(definition.energy))
	else:
		return ""
	if definition.has("cure"):
		data.poison = maxi(0, int(data.get("poison", 0)) - int(definition.cure))
	_save_and_emit()
	return "You use the %s." % item_name


func drop_item(item_name: String, quantity: int) -> bool:
	if ItemCatalog.id_for_name(item_name) in ["key", "relic"]:
		return false
	return remove_item(item_name, quantity)


func migrate_save() -> void:
	for old_name in ["Hatchet", "Pickaxe", "Hide", "Seal-key", "Steel sword"]:
		var replacements := {
			"Hatchet": "Bronze hatchet",
			"Pickaxe": "Bronze pickaxe",
			"Hide": "Goblin hide",
			"Seal-key": "Barrow key",
			"Steel sword": "Pineholt blade",
		}
		if int(data.get("inventory", {}).get(old_name, 0)) > 0:
			var quantity := int(data.inventory[old_name])
			data.inventory.erase(old_name)
			data.inventory[replacements[old_name]] = (
				int(data.inventory.get(replacements[old_name], 0)) + quantity
			)
	if not data.has("equipment"):
		data.equipment = {}
	var old_equipment: Dictionary = data.equipment
	var migrated := {
		"weapon": str(old_equipment.get("weapon", old_equipment.get("Weapon", ""))),
		"helmet": str(old_equipment.get("helmet", "")),
		"armor": str(old_equipment.get("armor", old_equipment.get("Armor", ""))),
		"legs": str(old_equipment.get("legs", "")),
		"shield": str(old_equipment.get("shield", old_equipment.get("Shield", ""))),
		"gloves": str(old_equipment.get("gloves", "")),
		"charm": str(old_equipment.get("charm", "")),
	}
	data.equipment = migrated
	if not data.has("bank"):
		data.bank = {}
	if not data.has("skill_xp"):
		data.skill_xp = {}
	if not data.has("skills"):
		data.skills = {}
	for skill_name in SKILL_NAMES:
		var minimum_level := 10 if skill_name == "Hitpoints" else 1
		if not data.skills.has(skill_name):
			data.skills[skill_name] = minimum_level
		if not data.skill_xp.has(skill_name):
			data.skill_xp[skill_name] = xp_for_level(
				int(data.skills.get(skill_name, minimum_level))
			)
	if not data.has("combat_style"):
		data.combat_style = "accurate"
	if not data.has("kill_log"):
		data.kill_log = {}
	if not data.has("discovered_regions"):
		data.discovered_regions = {}
	if not data.has("barrow_runs"):
		data.barrow_runs = 0
	if not data.has("barrow_collection"):
		data.barrow_collection = {}
	if not data.has("run_enabled"):
		data.run_enabled = false
	if not data.has("active_prayer"):
		data.active_prayer = ""
	if not data.has("special_energy"):
		data.special_energy = 100.0
	if not data.has("special_armed"):
		data.special_armed = false
	if not data.has("poison"):
		data.poison = 0
	if not data.has("slayer_contract"):
		data.slayer_contract = {}
	data.max_health = 9 + int(data.skills.get("Hitpoints", 10))
	data.max_prayer = int(data.skills.get("Prayer", 1))
	data.health = mini(int(data.health), int(data.max_health))
	data.prayer = mini(int(data.prayer), int(data.max_prayer))
	if not data.has("quests"):
		data.quests = {}
	if not data.quests.has(INTRO_QUEST):
		data.quests[INTRO_QUEST] = {
			"state": "available",
			"stage": "available",
			"objective": "Speak with Guide Elowen.",
		}
	var intro_quest: Dictionary = data.quests[INTRO_QUEST]
	if not intro_quest.has("stage"):
		var old_state := str(intro_quest.get("state", "available"))
		intro_quest.stage = (
			"complete" if old_state == "complete" else (
				"buy_supplies" if old_state == "active" else "available"
			)
		)
		if old_state == "active":
			intro_quest.objective = (
				"Buy a Fishing rod and 3 Fishing bait from Fisher Murphy."
			)
	data.quests[INTRO_QUEST] = intro_quest
	if get_node_or_null("/root/QuestSystem") != null:
		get_node("/root/QuestSystem").ensure_quests()
	_save_and_emit()


func withdraw_item(item_name: String) -> bool:
	return withdraw_quantity(item_name, 1) > 0


func character_slots() -> Array:
	var index := _load_character_index()
	return index.get("slots", [])


func active_character_id() -> String:
	return str(_load_character_index().get("active", ""))


func create_character(character_name: String) -> String:
	var clean_name := character_name.strip_edges()
	if clean_name.is_empty():
		return ""
	save_game()
	var index := _load_character_index()
	var id := "slot_%d" % Time.get_ticks_usec()
	var now := int(Time.get_unix_time_from_system())
	var fresh := _fresh_character_data(clean_name)
	var slots: Array = index.get("slots", [])
	slots.append({
		"id": id,
		"name": clean_name,
		"created_at": now,
		"last_played_at": now,
	})
	index.slots = slots
	index.active = id
	_write_json(_character_path(id), fresh)
	_write_character_index(index)
	data = fresh
	_write_json(SAVE_PATH, data)
	migrate_save()
	changed.emit()
	return id


func switch_character(id: String) -> bool:
	if id.is_empty() or id == active_character_id():
		return false
	save_game()
	var target: Variant = _read_json(_character_path(id))
	if not target is Dictionary:
		return false
	var index := _load_character_index()
	var found := false
	var slots: Array = index.get("slots", [])
	for slot in slots:
		if str(slot.get("id", "")) == id:
			slot.last_played_at = int(Time.get_unix_time_from_system())
			found = true
	if not found:
		return false
	index.active = id
	index.slots = slots
	_write_character_index(index)
	data = target
	_write_json(SAVE_PATH, data)
	migrate_save()
	changed.emit()
	return true


func delete_character(id: String) -> bool:
	var index := _load_character_index()
	if id.is_empty() or id == str(index.get("active", "")):
		return false
	var slots: Array = index.get("slots", [])
	var filtered: Array = []
	var found := false
	for slot in slots:
		if str(slot.get("id", "")) == id:
			found = true
		else:
			filtered.append(slot)
	if not found:
		return false
	index.slots = filtered
	_write_character_index(index)
	DirAccess.remove_absolute(ProjectSettings.globalize_path(_character_path(id)))
	return true


func apply_death(grave_tile: Vector2i, in_barrow: bool) -> Dictionary:
	if data.has("grave") and not data.grave.is_empty():
		bank_grave(false)
	var inventory: Dictionary = data.inventory
	var ranked: Array[String] = []
	for item_name in inventory:
		if item_name not in ["Coins", "Barrow key", "Ember relic"]:
			ranked.append(str(item_name))
	ranked.sort_custom(
		func(a: String, b: String) -> bool:
			var a_value := int(ItemCatalog.item(a).get("value", 0))
			var b_value := int(ItemCatalog.item(b).get("value", 0))
			return (
				b_value * int(inventory.get(b, 1))
				< a_value * int(inventory.get(a, 1))
			)
	)
	var kept := {
		"Barrow key": true,
		"Ember relic": true,
	}
	for item_name in ranked.slice(0, mini(3, ranked.size())):
		kept[item_name] = true
	var lost := {}
	for item_name in inventory.keys():
		if item_name == "Coins" or kept.has(item_name):
			continue
		lost[item_name] = int(inventory[item_name])
		inventory.erase(item_name)
	var coins := int(inventory.get("Coins", 0))
	var lost_coins := floori(float(coins) * 0.1)
	if lost_coins > 0:
		inventory["Coins"] = coins - lost_coins
	var now := int(Time.get_unix_time_from_system())
	if not lost.is_empty() or lost_coins > 0:
		data.grave = {
			"x": grave_tile.x,
			"y": grave_tile.y,
			"items": lost,
			"gold": lost_coins,
			"in_barrow": in_barrow,
			"expires_at": now + 600,
		}
	else:
		data.erase("grave")
	data.health = data.max_health
	data.prayer = 0
	data.active_prayer = ""
	data.poison = 0
	data.player_tile = {"x": 174, "y": 44}
	if bool(data.get("barrow_run_active", false)):
		data.barrow_run_active = false
		data.barrow_potential = 0
		data.erase("barrow_order")
		data.erase("barrow_via")
		data.erase("barrow_room")
	_save_and_emit()
	return {
		"lost": lost,
		"gold": lost_coins,
		"in_barrow": in_barrow,
		"has_grave": data.has("grave"),
	}


func recover_grave() -> Dictionary:
	expire_grave_if_needed()
	var grave: Dictionary = data.get("grave", {})
	if grave.is_empty():
		return {"recovered": 0, "complete": true}
	var recovered := 0
	var items: Dictionary = grave.get("items", {})
	for item_name in items.keys():
		if can_add(str(item_name)):
			add_item(str(item_name), int(items[item_name]), false)
			items.erase(item_name)
			recovered += 1
	var gold := int(grave.get("gold", 0))
	if gold > 0:
		add_item("Coins", gold, false)
		grave.gold = 0
		recovered += 1
	grave.items = items
	var complete := items.is_empty() and int(grave.get("gold", 0)) <= 0
	if complete:
		data.erase("grave")
	else:
		data.grave = grave
	_save_and_emit()
	return {"recovered": recovered, "complete": complete}


func expire_grave_if_needed() -> bool:
	var grave: Dictionary = data.get("grave", {})
	if grave.is_empty():
		return false
	if int(Time.get_unix_time_from_system()) < int(grave.get("expires_at", 0)):
		return false
	bank_grave(true)
	return true


func bank_grave(notify := true) -> void:
	var grave: Dictionary = data.get("grave", {})
	if grave.is_empty():
		return
	if not data.has("bank"):
		data.bank = {}
	for item_name in grave.get("items", {}):
		data.bank[item_name] = (
			int(data.bank.get(item_name, 0))
			+ int(grave.items[item_name])
		)
	var gold := int(grave.get("gold", 0))
	if gold > 0:
		data.inventory["Coins"] = int(data.inventory.get("Coins", 0)) + gold
	data.erase("grave")
	_save_and_emit()
	if notify:
		save_status.emit("The Castle Bank recovered your gravestone.")


func _ensure_character_roster() -> void:
	var index := _load_character_index()
	var slots: Array = index.get("slots", [])
	if not slots.is_empty() and not str(index.get("active", "")).is_empty():
		return
	var id := "slot_%d" % Time.get_ticks_usec()
	var now := int(Time.get_unix_time_from_system())
	if not data.has("name"):
		data.name = "Wanderer"
	index = {
		"active": id,
		"slots": [{
			"id": id,
			"name": str(data.name),
			"created_at": now,
			"last_played_at": now,
		}],
	}
	_write_character_index(index)
	_write_json(_character_path(id), data)


func _snapshot_active_character(update_time := true) -> void:
	var index := _load_character_index()
	var id := str(index.get("active", ""))
	if id.is_empty():
		return
	_write_json(_character_path(id), data)
	if update_time:
		var slots: Array = index.get("slots", [])
		for slot in slots:
			if str(slot.get("id", "")) == id:
				slot.name = str(data.get("name", "Wanderer"))
				slot.last_played_at = int(Time.get_unix_time_from_system())
		index.slots = slots
		_write_character_index(index)


func _character_path(id: String) -> String:
	return "user://emberfall_character_%s.json" % id


func _load_character_index() -> Dictionary:
	var parsed: Variant = _read_json(CHARACTER_INDEX_PATH)
	return parsed if parsed is Dictionary else {"active": "", "slots": []}


func _write_character_index(index: Dictionary) -> void:
	_write_json(CHARACTER_INDEX_PATH, index)


func _read_json(path: String) -> Variant:
	if not FileAccess.file_exists(path):
		return null
	var file := FileAccess.open(path, FileAccess.READ)
	if file == null:
		return null
	return JSON.parse_string(file.get_as_text())


func _write_json(path: String, value: Variant) -> bool:
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return false
	file.store_string(JSON.stringify(value, "\t"))
	return true


func save_game() -> bool:
	if not _write_json(SAVE_PATH, data):
		return false
	_snapshot_active_character()
	save_dirty = false
	autosave_elapsed = 0.0
	save_status.emit("Game saved")
	return true


func load_game() -> bool:
	if not FileAccess.file_exists(SAVE_PATH):
		return false
	var file := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if file == null:
		return false
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	if not parsed is Dictionary:
		return false
	data = parsed
	migrate_save()
	changed.emit()
	return true


func _save_and_emit() -> void:
	save_dirty = true
	changed.emit()


func mark_changed() -> void:
	_save_and_emit()


func mark_dirty() -> void:
	save_dirty = true
