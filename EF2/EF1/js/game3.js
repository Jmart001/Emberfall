function skillTick() {
  if (tickCount < skilling.next) return;
  if (skilling.type === 'fish') {
    const spot = skilling.spot;
    if (!adjacent(player, spot)) {
      skilling = null;
      return message('You move away from the fishing spot.', 'bad');
    }
    if (!invCount('rod') || !invCount('bait')) {
      skilling = null;
      return message('You need a rod and bait to continue fishing.', 'bad');
    }
    if (!canAdd(spot.item)) {
      skilling = null;
      return message('Your backpack is full.', 'bad');
    }
    // EF1: catch rate scales with Fishing level (many misses early), bait used only on a catch
    const catchChance = Math.min(0.9, 0.52 + (level('Fishing') - spot.level) * 0.025);
    if (Math.random() < catchChance) {
      add('bait', -1);
      add(spot.item);
      // Advance the intro quest first, so nothing downstream can leave it stuck.
      if (spot.item === 'rawFish' && player.story.q === 0 && player.story.step === 2) {
        player.story.step = 3;
        questUpdate();
      }
      player.xp.Fishing += spot.xp;
      tally('fish');
      effects.push({
        x: spot.x,
        y: spot.y,
        value: 'CAUGHT',
        color: '#72b7cb',
        at: performance.now(),
        xp: spot.xp,
      });
      message(`You catch a ${spot.catchName}.`, 'good');
      if (window.SFX) SFX.play('fish');
    } else message('Something tugs the line, then slips away.');
    if (tickCount >= spot.movesAt) {
      relocateFishSpot(spot);
      skilling = null;
      renderPanel();
      save();
      return message('The fish move to a fresh spot nearby.', 'game');
    }
    if (invCount('bait') && canAdd(spot.item)) {
      skilling.next = tickCount + 3;
      lastActionAt = performance.now();
      actionDuration = TICK_MS * 3;
    } else skilling = null;
    renderPanel();
    save();
  } else if (skilling.type === 'fletch') {
    const recipe = skilling.recipe;
    skilling = null;
    if (!invCount('knife')) return message('You no longer have a carving knife.', 'bad');
    for (const [id, q] of Object.entries(recipe.needs))
      if (invCount(id) < q) return message('You no longer have the required logs.', 'bad');
    for (const [id, q] of Object.entries(recipe.needs)) add(id, -q);
    add(recipe.makes, recipe.qty);
    player.xp.Fletching += recipe.xp;
    effects.push({
      x: player.x,
      y: player.y,
      value: 'FLETCHED',
      color: '#d2b06d',
      at: performance.now(),
      xp: recipe.xp,
    });
    message(
      `You create ${recipe.qty > 1 ? recipe.qty + ' ' : ''}${ITEMS[recipe.makes].name}${recipe.qty > 1 ? 's' : ''}.`,
      'good',
    );
    renderPanel();
    save();
  } else if (skilling.type === 'hunt') {
    const spot = skilling.spot;
    skilling = null;
    if (!adjacent(player, spot) || !invCount('snare'))
      return message('You abandon the snare.', 'bad');
    if (Math.random() < 0.75) {
      add('rabbitMeat');
      add('rabbitFur');
      player.xp.Hunter += spot.xp;
      effects.push({
        x: spot.x,
        y: spot.y,
        value: 'CAUGHT',
        color: '#cfb889',
        at: performance.now(),
        xp: spot.xp,
      });
      message('The snare catches a rabbit. You gather its meat and fur.', 'good');
    } else {
      player.xp.Hunter += 5;
      effects.push({
        x: spot.x,
        y: spot.y,
        value: 'MISSED',
        color: '#9b8f74',
        at: performance.now(),
        xp: 5,
      });
      message('The rabbit slips past your snare.', 'bad');
    }
    renderPanel();
    save();
  } else if (skilling.type === 'willowBlessing') {
    skilling = null;
    if (player.gold < 10)
      return message('You no longer have enough coins for the offering.', 'bad');
    player.gold -= 10;
    player.hp = player.maxHp;
    player.prayerPoints = maxPrayer();
    effects.push({
      x: player.x,
      y: player.y,
      value: 'BLESSED',
      color: '#9aca72',
      at: performance.now(),
      xp: 0,
    });
    message('The woodland blessing restores your Hitpoints and Prayer.', 'good');
    renderPanel();
    updateUI();
    save();
  } else if (skilling.type === 'roadsideBless') {
    skilling = null;
    player.hp = player.maxHp;
    player.prayerPoints = maxPrayer();
    player.runEnergy = 100;
    player.activePrayer = null;
    player.roadsideBlessAt = Date.now();
    effects.push({
      x: player.x,
      y: player.y,
      value: 'RESTORED',
      color: '#d7b06b',
      at: performance.now(),
      xp: 0,
    });
    message('The Frostmere hearth restores your strength.', 'good');
    renderPanel();
    updateUI();
    save();
  } else if (skilling.type === 'barrowLever') {
    skilling = null;
    player.barrowGateOpen = true;
    tiles[DUNGEON_GATE.y][DUNGEON_GATE.x] = 5;
    effects.push({
      x: DUNGEON_GATE.x,
      y: DUNGEON_GATE.y,
      value: 'OPEN',
      color: '#d5b56a',
      at: performance.now(),
      xp: 0,
    });
    message('Chains grind in the walls. The eastern portcullis rises.', 'good');
    save();
  } else if (skilling.type === 'innRest') {
    skilling = null;
    if (player.gold < 5) return message('You no longer have enough coins for the room.', 'bad');
    player.gold -= 5;
    player.hp = player.maxHp;
    player.prayerPoints = maxPrayer();
    player.runEnergy = 100;
    player.activePrayer = null;
    effects.push({
      x: player.x,
      y: player.y,
      value: 'RESTED',
      color: '#a58bd5',
      at: performance.now(),
      xp: 0,
    });
    message('You wake fully rested. Hitpoints, Prayer, and run energy restored.', 'good');
    renderPanel();
    updateUI();
    save();
  } else if (skilling.type === 'homeTeleport') {
    skilling = null;
    if (player.barrowRunStartedAt) {
      player.barrowRunStartedAt = 0;
      message('Ashen Barrow run abandoned.', 'bad');
    }
    player.x = 96;
    player.y = 128;
    player.drawX = 96;
    player.drawY = 128;
    camera.x = Math.max(0, 96 * TILE - canvas.clientWidth / 2);
    camera.y = Math.max(0, 128 * TILE - canvas.clientHeight / 2);
    player.homeTeleportAt = Date.now();
    effects.push({ x: 96, y: 128, value: 'HOME', color: '#8bcdf0', at: performance.now(), xp: 0 });
    message('You arrive at the Greenrest Vale plaza.', 'good');
    checkRegion();
    save();
  } else if (skilling.type === 'farmPlant') {
    const p = skilling.patch;
    skilling = null;
    if (!adjacent(player, p) || !invCount('cabbageSeed') || player.farm[p.id])
      return message('You stop planting.', 'bad');
    add('cabbageSeed', -1);
    player.farm[p.id] = { crop: 'cabbage', plantedAt: Date.now(), readyAt: Date.now() + 60000 };
    player.xp.Farming += 8;
    effects.push({ x: p.x, y: p.y, value: 'OK', color: '#8bc45a', at: performance.now(), xp: 8 });
    message('You plant a cabbage seed. It will grow even while you are away.', 'good');
    renderPanel();
    save();
  } else if (skilling.type === 'farmHarvest') {
    const p = skilling.patch;
    skilling = null;
    if (!adjacent(player, p) || !player.farm[p.id] || Date.now() < player.farm[p.id].readyAt)
      return message('The crop is not ready.', 'bad');
    if (!canAdd('cabbage')) return message('Your backpack is full.', 'bad');
    add('cabbage', 3);
    delete player.farm[p.id];
    player.xp.Farming += 24;
    tally('farm');
    effects.push({ x: p.x, y: p.y, value: 'OK', color: '#9ed561', at: performance.now(), xp: 24 });
    message('You harvest 3 cabbages.', 'good');
    renderPanel();
    save();
  } else if (skilling.type === 'pickpocket') {
    const n = skilling.npc;
    skilling = null;
    if (!adjacent(player, n)) return message('Your target moved out of reach.', 'bad');
    n.pickpocketUntil = tickCount + 6;
    const chance = Math.min(0.92, 0.58 + level('Thieving') * 0.035);
    if (Math.random() < chance) {
      const coins = 4 + Math.floor(Math.random() * 9);
      player.gold += coins;
      player.xp.Thieving += 18;
      effects.push({
        x: n.x,
        y: n.y,
        value: 'OK',
        color: '#d8c55e',
        at: performance.now(),
        xp: 18,
      });
      message(`You steal ${coins} coins from ${n.name}.`, 'good');
    } else {
      const damage = 1;
      if (!admin) player.hp = Math.max(0, player.hp - damage);
      effects.push({
        x: player.x,
        y: player.y,
        value: damage,
        color: '#ef5049',
        at: performance.now(),
      });
      message(` catches you and shoves you away!`, 'bad');
      if (player.hp <= 0) death();
    }
    renderPanel();
    updateUI();
  } else if (skilling.type === 'mine') {
    const r = skilling.rock;
    if (!adjacent(player, r)) {
      skilling = null;
      return;
    }
    if (!canAdd(r.ore)) {
      skilling = null;
      return message('Your backpack is full.', 'bad');
    }
    skilling.next = tickCount + 3;
    lastActionAt = performance.now();
    actionDuration = TICK_MS * 3;
    const bonus = invCount('ironPickaxe') ? 0.15 : 0;
    if (Math.random() < 0.68 + bonus) {
      add(r.ore);
      player.xp.Mining += r.xp;
      tally('mine');
      effects.push({
        x: r.x,
        y: r.y,
        value: 'OK',
        color: '#d5b56a',
        at: performance.now(),
        xp: r.xp,
      });
      message(`You mine some ${ITEMS[r.ore].name.toLowerCase()}.`, 'good');
      if (window.SFX) SFX.play('mine');
      r.mined = (r.mined || 0) + 1;
      if (r.mined >= 3 || Math.random() < 0.2) {
        r.depletedUntil = tickCount + 15; // EF1: rock depletes then regenerates
        skilling = null;
        message('The rock is depleted.');
      }
      renderPanel();
    } else message('You chip away at the rock.');
  } else if (skilling.type === 'chop') {
    const t = skilling.tree;
    if (t.depletedUntil || !adjacent(player, t)) {
      skilling = null;
      return;
    }
    if (!canAdd('logs')) {
      skilling = null;
      return message('Your backpack is full.', 'bad');
    }
    skilling.next = tickCount + 4;
    lastActionAt = performance.now();
    actionDuration = TICK_MS * 4;
    if (Math.random() < 0.76) {
      add('logs');
      if (window.SFX) SFX.play('chop');
      player.xp.Woodcutting += t.xp;
      tally('chop');
      t.chops++;
      effects.push({
        x: t.x,
        y: t.y,
        value: 'OK',
        color: '#78b85a',
        at: performance.now(),
        xp: t.xp,
      });
      message('You get some logs.', 'good');
      if (t.chops >= 3 || Math.random() < 0.22) {
        t.depletedUntil = tickCount + 15;
        tiles[t.y][t.x] = 0;
        skilling = null;
        message('The tree has been cut down.');
      }
      renderPanel();
    } else message('You swing but fail to get a log.');
  } else if (skilling.type === 'fire') {
    const spot = skilling.spot;
    skilling = null;
    if (!invCount('logs')) return message('You no longer have any logs.', 'bad');
    add('logs', -1);
    fires.push({
      x: spot.x,
      y: spot.y,
      kind: 'fire',
      name: 'Player-made fire',
      expires: tickCount + 80,
    });
    player.xp.Firemaking += 25;
    tally('fire');
    effects.push({
      x: spot.x,
      y: spot.y,
      value: 'OK',
      color: '#f19a43',
      at: performance.now(),
      xp: 25,
    });
    message('The logs catch fire.', 'good');
    renderPanel();
  } else if (skilling.type === 'herblore') {
    const recipe = skilling.recipe;
    skilling = null;
    for (const [id, q] of Object.entries(recipe.needs)) add(id, -q);
    add(recipe.makes, recipe.qty);
    player.xp.Herblore += recipe.xp;
    tally('pot');
    effects.push({
      x: CAULDRON.x,
      y: CAULDRON.y,
      value: 'OK',
      color: '#75c986',
      at: performance.now(),
      xp: recipe.xp,
    });
    message(`You create ${ITEMS[recipe.makes].name}.`, 'good');
    renderPanel();
  } else if (skilling.type === 'craft') {
    const recipe = skilling.recipe;
    skilling = null;
    for (const [id, q] of Object.entries(recipe.needs)) add(id, -q);
    add(recipe.makes, recipe.qty);
    player.xp.Crafting += recipe.xp;
    effects.push({
      x: WORKBENCH.x,
      y: WORKBENCH.y,
      value: 'OK',
      color: '#c89ab5',
      at: performance.now(),
      xp: recipe.xp,
    });
    message(`You create ${ITEMS[recipe.makes].name}.`, 'good');
    renderPanel();
  } else if (skilling.type === 'smith') {
    const recipe = skilling.recipe;
    skilling = null;
    for (const [id, q] of Object.entries(recipe.needs)) add(id, -q);
    add(recipe.makes, recipe.qty);
    player.xp.Smithing += recipe.xp;
    tally('smith');
    effects.push({
      x: FORGE.x,
      y: FORGE.y,
      value: 'OK',
      color: '#e29a55',
      at: performance.now(),
      xp: recipe.xp,
    });
    message(`You create ${ITEMS[recipe.makes].name}.`, 'good');
    renderPanel();
  } else if (skilling.type === 'cook') {
    const spot = skilling.spot;
    if (spot && !adjacent(player, spot)) {
      skilling = null;
      return message('You move away from the fire.', 'bad');
    }
    const raw = rawFoodId();
    if (!raw) {
      skilling = null;
      return message('You finish cooking.', 'good');
    }
    const eel = raw === 'rawEel',
      rabbit = raw === 'rabbitMeat',
      meat = raw === 'rawMeat',
      result = eel ? 'marshEel' : rabbit ? 'roastRabbit' : meat ? 'cookedMeat' : 'fish',
      name = eel ? 'marsh eel' : rabbit ? 'rabbit' : meat ? 'boar meat' : 'riverfish',
      xp = eel ? 28 : rabbit ? 20 : meat ? 18 : 14;
    add(raw, -1);
    if (Math.random() < Math.max(0.03, 0.3 - level('Cooking') * 0.011))
      message('You accidentally burn the ' + name + '.', 'bad');
    else {
      add(result);
      player.xp.Cooking += xp;
      tally('cook');
      if (window.SFX) SFX.play('eat');
      message('You cook the ' + name + '.', 'good');
      if (!eel && !rabbit && !meat && player.story.q === 0 && player.story.step === 3) {
        player.story.step = 4;
        questUpdate();
      }
    }
    if (rawFoodId()) {
      skilling.next = tickCount + 2;
      lastActionAt = performance.now();
      actionDuration = TICK_MS * 2;
    } else skilling = null;
    renderPanel();
    save();
  }
}
function readBarrowTablet(t) {
  const first = !player.barrowLore[t.id];
  if (first) {
    player.barrowLore[t.id] = true;
    const found = Object.keys(player.barrowLore).filter((id) =>
      BARROW_TABLETS.some((t) => t.id === id),
    ).length;
    message('Barrow lore discovered: ' + found + '/' + BARROW_TABLETS.length + '.', 'game');
    if (found === BARROW_TABLETS.length) {
      player.xp.Prayer += 60;
      add('ashenShard', 1, true);
      message('Barrow lore complete! +60 Prayer XP and an Ashen shard.', 'good');
    }
    renderPanel();
    updateUI();
    save();
  }
  showModal(
    t.name,
    t.text,
    first ? [['Record discovery', closeModal]] : [['Read again', closeModal]],
  );
}
function readSign(s) {
  showModal(s.name, s.text, [['Continue', closeModal]]);
}
function homeTeleport() {
  const remaining = Math.ceil((player.homeTeleportAt + 30000 - Date.now()) / 1000);
  if (remaining > 0) return message(`Home teleport recharges in ${remaining} seconds.`, 'bad');
  if (combat) return message('You cannot teleport during combat.', 'bad');
  closeWorldMap();
  closeModal();
  path = [];
  moveSegment = null;
  pending = null;
  skilling = { type: 'homeTeleport', next: tickCount + 5 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 5;
  message('You begin drawing a home teleport circle.', 'game');
}
function patchAction(p) {
  const state = player.farm[p.id];
  return !state ? 'Plant' : Date.now() >= state.readyAt ? 'Harvest' : 'Inspect';
}
function interactPatch(p) {
  const state = player.farm[p.id];
  if (!state) {
    if (!invCount('cabbageSeed'))
      return message('You need a cabbage seed. Alaric sells them.', 'bad');
    combat = null;
    skilling = { type: 'farmPlant', patch: p, next: tickCount + 3 };
    lastActionAt = performance.now();
    actionDuration = TICK_MS * 3;
    return message('You begin planting a cabbage seed.', 'game');
  }
  if (Date.now() < state.readyAt)
    return message(
      `The cabbages need about ${Math.ceil((state.readyAt - Date.now()) / 1000)} more seconds.`,
      'game',
    );
  if (!canAdd('cabbage')) return message('Your backpack is full.', 'bad');
  combat = null;
  skilling = { type: 'farmHarvest', patch: p, next: tickCount + 3 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 3;
  message('You begin harvesting the cabbages.', 'game');
}
function openFletching() {
  if (!invCount('knife')) return message('You need a carving knife.', 'bad');
  const rows = FLETCH_RECIPES.map((r) => [`${r.name} - level ${r.level}`, () => startFletching(r)]);
  rows.push(['Close', closeModal]);
  showModal('Fletching', 'Use your carving knife to turn logs into useful ranged equipment.', rows);
}
function startFletching(recipe) {
  if (level('Fletching') < recipe.level)
    return message(`You need Fletching level ${recipe.level}.`, 'bad');
  for (const [id, q] of Object.entries(recipe.needs))
    if (invCount(id) < q) return message(`You need ${q} ${ITEMS[id].name.toLowerCase()}.`, 'bad');
  if (!canAdd(recipe.makes)) return message('Your backpack is full.', 'bad');
  closeModal();
  combat = null;
  skilling = { type: 'fletch', recipe, next: tickCount + 4 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 4;
  message(`You begin to ${recipe.name.toLowerCase()}.`, 'game');
}
function openForge() {
  const rows = RECIPES.map((r) => [`${r.name}  -  level ${r.level}`, () => startSmith(r)]);
  rows.push(['Close', closeModal]);
  showModal('Cinderforge Forge', 'Smelting and forging both happen here for this early build.', rows);
}
function startSmith(recipe) {
  if (level('Smithing') < recipe.level)
    return message(`You need Smithing level ${recipe.level}.`, 'bad');
  for (const [id, q] of Object.entries(recipe.needs))
    if (invCount(id) < q) return message(`You need ${q} ${ITEMS[id].name}.`, 'bad');
  closeModal();
  combat = null;
  skilling = { type: 'smith', recipe, next: tickCount + 4 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 4;
  message(`You begin to ${recipe.name.toLowerCase()}.`, 'game');
}
function openCrafting() {
  const rows = CRAFT_RECIPES.map((r) => [`${r.name} - level ${r.level}`, () => startCraft(r)]);
  rows.push(['Close', closeModal]);
  showModal('Greenrest Crafting Bench', 'Turn hides and cave silk into wearable armour.', rows);
}
function startCraft(recipe) {
  if (level('Crafting') < recipe.level)
    return message(`You need Crafting level ${recipe.level}.`, 'bad');
  for (const [id, q] of Object.entries(recipe.needs))
    if (invCount(id) < q) return message(`You need ${q} ${ITEMS[id].name}.`, 'bad');
  if (!canAdd(recipe.makes)) return message('Your backpack is full.', 'bad');
  closeModal();
  combat = null;
  skilling = { type: 'craft', recipe, next: tickCount + 4 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 4;
  message(`You begin to ${recipe.name.toLowerCase()}.`, 'game');
}
function openHerblore() {
  const rows = HERB_RECIPES.map((r) => [`${r.name} - level ${r.level}`, () => startHerblore(r)]);
  rows.push(['Close', closeModal]);
  showModal(
    'Sablemarsh Brewing Cauldron',
    'Combine wild herbs with empty vials to brew potions.',
    rows,
  );
}
function startHerblore(recipe) {
  if (level('Herblore') < recipe.level)
    return message(`You need Herblore level ${recipe.level}.`, 'bad');
  for (const [id, q] of Object.entries(recipe.needs))
    if (invCount(id) < q) return message(`You need ${q} ${ITEMS[id].name}.`, 'bad');
  if (!canAdd(recipe.makes)) return message('Your backpack is full.', 'bad');
  closeModal();
  combat = null;
  skilling = { type: 'herblore', recipe, next: tickCount + 3 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 3;
  message(`You begin to ${recipe.name.toLowerCase()}.`, 'game');
}
function eat(id) {
  if (!ITEMS[id].heal || !invCount(id)) return;
  add(id, -1);
  player.hp = Math.min(player.maxHp, player.hp + ITEMS[id].heal);
  if (window.SFX) SFX.play('eat');
  if (ITEMS[id].cure && player.poison) {
    const cured = Math.min(player.poison, ITEMS[id].cure);
    player.poison -= cured;
    if (!player.poison) player.poisonNext = 0;
    message(
      `The ${ITEMS[id].name} relieves ${cured} poison dose${cured === 1 ? '' : 's'}.`,
      'good',
    );
  }
  message(`You ${id.includes('Potion') ? 'drink' : 'eat'} the ${ITEMS[id].name}.`, 'good');
  renderPanel();
  updateUI();
}
function drinkEnergy(id) {
  if (!invCount(id)) return;
  add(id, -1);
  player.runEnergy = Math.min(100, player.runEnergy + ITEMS[id].energy);
  message(`You drink the ${ITEMS[id].name}. Run energy restored.`, 'good');
  renderPanel();
  updateUI();
}
function useItem(id) {
  const item = ITEMS[id];
  if (item.energy) return drinkEnergy(id);
  if (item.heal) return eat(id);
  if (id === 'knife') return openFletching();
  if (id === 'logs') return lightFire();
  if (id === 'bones') return buryBones();
  if (id === 'antidote') return drinkAntidote();
  if (id === 'barrowLantern')
    return message('The Barrow lantern brightens the darkness while you carry it.', 'game');
  const slot =
    item.slot ||
    (item.attack !== undefined || item.ranged !== undefined || item.magic !== undefined
      ? 'weapon'
      : item.defence !== undefined
        ? 'armor'
        : null);
  if (slot && invCount(id)) {
    if (item.req && level(item.reqSkill || 'Attack') < item.req)
      return message(
        `You need ${item.reqSkill || 'Attack'} level ${item.req} to use the ${item.name}.`,
        'bad',
      );
    const old = player.equipment[slot];
    add(id, -1);
    player.equipment[slot] = id;
    if (old) add(old);
    message(`You equip the ${item.name}.`, 'good');
    renderPanel();
  }
}
function closeItemMenu() {
  document.getElementById('itemMenu').classList.add('hidden');
}
function itemPrimary(id) {
  const item = ITEMS[id];
  if (item.energy || id.includes('Potion')) return 'Drink';
  if (item.heal) return 'Eat';
  if (id === 'knife') return 'Fletch';
  if (id === 'logs') return 'Light';
  if (id === 'bones') return 'Bury';
  if (id === 'antidote') return 'Drink';
  if (id === 'barrowLantern') return 'Inspect';
  if (item.slot === 'armor') return 'Wear';
  if (item.slot === 'shield') return 'Wield';
  if (item.attack !== undefined || item.ranged !== undefined || item.magic !== undefined)
    return 'Wield';
  return 'Use';
}
function dropItem(id, q) {
  if (['key', 'relic'].includes(id))
    return message('You should not drop an important quest item.', 'bad');
  q = Math.min(q, invCount(id));
  if (!q) return;
  add(id, -q);
  spawnDrop(player.x, player.y, id, q);
  message(`You drop ${q} ${ITEMS[id].name}.`, 'game');
  closeItemMenu();
  renderPanel();
}
function examineItem(id) {
  const item = ITEMS[id],
    parts = [item.name];
  if (item.heal) parts.push(`heals ${item.heal} Hitpoints`);
  if (item.attack !== undefined) parts.push(`+${item.attack} Attack`);
  if (item.ranged !== undefined) parts.push(`+${item.ranged} Ranged`);
  if (item.magic !== undefined) parts.push(`+${item.magic} Magic`);
  if (item.defence !== undefined) parts.push(`+${item.defence} Defence`);
  if (item.value) parts.push(`base value ${item.value} coins`);
  message(parts.join(' - ') + '.', 'game');
  closeItemMenu();
}
function openItemMenu(e, id) {
  e.preventDefault();
  e.stopPropagation();
  closeContext();
  const menu = document.getElementById('itemMenu'),
    item = ITEMS[id],
    q = invCount(id),
    primary = itemPrimary(id),
    droppable = !['key', 'relic'].includes(id),
    canAlch =
      droppable && (ITEMS[player.equipment.weapon] || {}).magic && level('Magic') >= 25;
  menu.style.left = Math.min(e.clientX, window.innerWidth - 220) + 'px';
  menu.style.top = Math.min(e.clientY, window.innerHeight - (droppable ? 265 : 165)) + 'px';
  menu.innerHTML = `<div class="menuTitle">${item.name} ${q > 1 ? 'x' + q : ''}</div><button data-a="primary">${primary} ${item.name}</button>${canAlch ? `<button data-a="alch">High Alchemy</button>` : ''}${droppable ? `<button data-a="drop1" class="danger">Drop one</button>${q > 1 ? '<button data-a="dropall" class="danger">Drop all</button>' : ''}` : ''}<button data-a="examine">Examine ${item.name}</button><button data-a="cancel" class="cancel">Cancel</button>`;
  menu.classList.remove('hidden');
  menu.querySelector('[data-a="primary"]').onclick = () => {
    closeItemMenu();
    useItem(id);
  };
  const alchBtn = menu.querySelector('[data-a="alch"]');
  if (alchBtn) alchBtn.onclick = () => highAlchemy(id);
  const one = menu.querySelector('[data-a="drop1"]');
  if (one) one.onclick = () => dropItem(id, 1);
  const all = menu.querySelector('[data-a="dropall"]');
  if (all) all.onclick = () => dropItem(id, q);
  menu.querySelector('[data-a="examine"]').onclick = () => examineItem(id);
  menu.querySelector('[data-a="cancel"]').onclick = closeItemMenu;
}
function unequip(slot) {
  const id = player.equipment[slot];
  if (!id) return;
  if (!canAdd(id)) return message('Your backpack is full.', 'bad');
  add(id);
  player.equipment[slot] = null;
  message(`You remove the ${ITEMS[id].name}.`);
  renderPanel();
}
function setCombatStyle(style) {
  player.combatStyle = style;
  message(`Combat style: ${style}.`, 'game');
  renderPanel();
}
function selectSpell(id) {
  const sp = SPELLS[id];
  if (!sp) return;
  if (level('Magic') < sp.level) return message(`You need Magic level ${sp.level}.`, 'bad');
  player.selectedSpell = id;
  message(`Spell selected: ${sp.name}.`, 'game');
  renderPanel();
}
function highAlchemy(id) {
  if (!(ITEMS[player.equipment.weapon] || {}).magic)
    return message('You must wield a magic staff to alchemise.', 'bad');
  if (level('Magic') < 25) return message('You need Magic level 25 for High Alchemy.', 'bad');
  if (invCount('emberRune') < 3) return message('High Alchemy needs 3 Ember runes.', 'bad');
  if (!invCount(id)) return;
  if (['key', 'relic'].includes(id)) return message('You cannot alchemise a quest item.', 'bad');
  add('emberRune', -3);
  add(id, -1);
  const coins = Math.max(1, Math.round((ITEMS[id].value || 1) * 1.3));
  player.gold += coins;
  player.xp.Magic += 40;
  if (window.SFX) SFX.play('coins');
  message(`High Alchemy: ${ITEMS[id].name} → ${coins} coins.`, 'good');
  renderPanel();
  updateUI();
  closeItemMenu();
}
function regionName() {
  return regionNameFor(player.x, player.y);
}
function checkRegion() {
  const name = regionName();
  if (name === lastRegion) return;
  lastRegion = name;
  const banner = document.getElementById('regionBanner'),
    isNew = DISCOVERY_REGIONS.includes(name) && !player.discoveredRegions[name];
  if (isNew) {
    player.discoveredRegions[name] = true;
    banner.textContent = `NEW AREA · ${name.toUpperCase()}`;
    message(`New area discovered: ${name}!`, 'good');
    const found = DISCOVERY_REGIONS.filter((r) => player.discoveredRegions[r]).length;
    if (found === DISCOVERY_REGIONS.length && !player.explorerRewarded) {
      player.explorerRewarded = true;
      player.gold += 250;
      add('explorerCape', 1, true);
      message('World explored! You receive 250 coins and the Emberfall explorer cape.', 'good');
    }
    save();
    renderPanel();
    updateUI();
  } else {
    banner.textContent = name.toUpperCase();
    message(`You enter ${name}.`, 'game');
  }
  banner.classList.add('show');
  setTimeout(() => banner.classList.remove('show'), 1800);
}
// ---- OSRS-style skill guide: level unlocks per skill ----
const SKILL_GUIDE = {
  Attack: {
    about:
      'Improves melee accuracy and unlocks stronger blades. Train it using the Accurate combat style.',
    tiers: [
      [1, 'Wield the bronze sword'],
      [1, 'Earn the Pineholt blade from "A Wanderer in Greenrest"'],
      [8, 'Forge and wield the iron longsword (via Smithing)'],
    ],
  },
  Strength: {
    about: 'Increases melee damage. Train it using the Aggressive combat style.',
    tiers: [
      [1, 'Higher levels hit harder with any melee weapon'],
      [1, 'Burst of Strength prayer adds even more damage'],
    ],
  },
  Defence: {
    about: 'Reduces incoming damage and unlocks armour. Train it using the Defensive combat style.',
    tiers: [
      [1, 'Bronze shield and leather body'],
      [3, 'Rabbit-fur gloves and Frostmere buckler'],
      [4, 'Iron platebody and Thornwood mantle'],
      [6, 'Warden cloak from the Ashen Barrow'],
    ],
  },
  Hitpoints: {
    about: 'Your health pool. It rises automatically as you deal damage in combat.',
    tiers: [
      [1, 'Begin with 10 hitpoints'],
      [1, 'Every point of damage you deal trains Hitpoints'],
    ],
  },
  Ranged: {
    about: 'Accuracy and damage with bows. Train it with a shortbow and bronze arrows.',
    tiers: [[1, 'Wield the shortbow with bronze arrows']],
  },
  Magic: {
    about: 'Cast combat spells with a staff and runes. Train it by casting spells in battle.',
    tiers: [
      [1, 'Ember staff + Ember runes cast Ember Strike'],
      [1, 'Keep Ember runes stocked to keep casting'],
    ],
  },
  Prayer: {
    about:
      'Bury bones for XP, then spend prayer points on combat boosts. Recharge at the Frostmere altar.',
    tiers: [
      [1, 'Burst of Strength — more melee damage'],
      [3, 'Thick Skin — better melee defence'],
    ],
  },
  Fishing: {
    about:
      'Fish the ripples off the docks. You need a fishing rod and bait — buy both from Fisher Murphy.',
    tiers: [
      [1, 'Catch riverfish at the Greenrest docks'],
      [3, 'Catch marsh eel in the marshes'],
    ],
  },
  Cooking: {
    about: 'Cook raw food on a fire or range. Higher levels burn food far less often.',
    tiers: [
      [1, 'Cook riverfish, boar meat and rabbit'],
      [1, 'Cook marsh eel to cure poison'],
    ],
  },
  Woodcutting: {
    about: 'Chop trees for logs with a hatchet (buy from Alaric). Trees deplete, then regrow.',
    tiers: [[1, 'Chop Greenrest Vale trees for logs']],
  },
  Firemaking: {
    about: 'Light logs with a tinderbox to make a fire you can cook on.',
    tiers: [[1, 'Light logs anywhere for a cooking fire']],
  },
  Mining: {
    about:
      'Mine rocks for ore with a pickaxe (buy from Torren). Rocks deplete and regenerate; an iron pickaxe is faster.',
    tiers: [
      [1, 'Mine copper ore'],
      [5, 'Mine iron ore'],
    ],
  },
  Smithing: {
    about: 'Smelt ore into bars and forge gear at the forge.',
    tiers: [
      [1, 'Smelt bronze bars (2 copper)'],
      [5, 'Smelt iron bars (2 iron)'],
      [8, 'Forge the iron longsword (3 iron bars)'],
      [12, 'Forge the iron platebody (5 iron bars)'],
    ],
  },
  Farming: {
    about: 'Plant seeds at the Greenrest farm patch, then return to harvest the crop.',
    tiers: [[1, 'Plant cabbage seeds and harvest cabbages']],
  },
  Herblore: {
    about: 'Brew potions from herbs, moss and empty vials.',
    tiers: [
      [1, 'Minor healing potion (herb + vial)'],
      [2, 'Marsh antidote (2 bog moss + vial)'],
      [3, 'Run energy potion (2 herb + vial)'],
    ],
  },
  Crafting: {
    about: 'Turn hides, fur and silk into wearable armour.',
    tiers: [
      [1, 'Leather body (3 goblin hide)'],
      [3, 'Rabbit-fur gloves (3 fur)'],
      [5, 'Cave-silk robe (3 spider silk)'],
    ],
  },
  Fletching: {
    about: 'Carve logs into bows and arrow shafts with a carving knife.',
    tiers: [
      [1, 'Basic fletching from logs'],
      [4, 'Advanced fletching recipes'],
    ],
  },
  Slayer: {
    about: 'Earned by taking monster contracts from Guard Bren and slaying the assigned foes.',
    tiers: [[1, 'Accept monster contracts for Slayer XP and rewards']],
  },
  Hunter: {
    about: 'Trap small game such as rabbits using wooden snares.',
    tiers: [[1, 'Set snares at the rabbit burrows']],
  },
  Thieving: {
    about: 'A roguish skill trained around Emberfall settlements as you explore.',
    tiers: [[1, 'Opportunities appear as the world opens up']],
  },
};
function showSkillGuide(skill) {
  const g = SKILL_GUIDE[skill],
    lv = level(skill),
    tiers = g
      ? g.tiers
          .map(
            ([req, text]) =>
              `<div class="guideRow ${lv >= req ? 'unlocked' : 'locked'}"><span class="guideLv">Lv ${req}</span><span>${text}</span></div>`,
          )
          .join('')
      : '<p class="hint">Keep training to discover what this skill unlocks.</p>';
  modalBody.innerHTML =
    `<h2>${skill} Guide</h2><p class="hint">Level ${lv} · ${player.xp[skill]} XP</p>` +
    (g ? `<p class="guideAbout">${g.about}</p>` : '') +
    tiers +
    `<div class="bankActions"><button class="choice" data-act="close">Close</button></div>`;
  modal.classList.remove('hidden');
  modalBody.querySelector('[data-act="close"]').onclick = closeModal;
}
// ---------------- Admin / god mode ----------------
function setAdmin(on) {
  admin = on;
  try {
    localStorage.setItem('emberfall-ef1-admin', on ? '1' : '0');
  } catch (e) {}
  if (on) {
    player.runEnabled = true;
    player.runEnergy = 100;
    player.hp = player.maxHp;
    player.poison = 0;
  }
  message(
    on
      ? 'ADMIN MODE ON — invincible, always running, item spawner unlocked.'
      : 'Admin mode off — standard play resumed.',
    on ? 'good' : 'game',
  );
  const b = document.getElementById('adminBtn');
  if (b) b.classList.toggle('on', on);
  updateUI();
  renderPanel();
}
function loginAdmin() {
  const code = prompt('Enter admin passcode:');
  if (code === null) return;
  if (code !== ADMIN_CODE) return message('Incorrect admin passcode.', 'bad');
  setAdmin(true);
  adminMenu();
}
function adminMenu() {
  showModal('Admin Panel', 'God mode active: invincible, always running.', [
    ['Spawn items', adminSpawnMenu],
    [
      'Add 1000 coins',
      () => {
        player.gold += 1000;
        updateUI();
        message('Spawned 1000 coins.', 'good');
        save();
      },
    ],
    [
      'Heal to full',
      () => {
        player.hp = player.maxHp;
        player.poison = 0;
        updateUI();
        message('Fully healed.', 'good');
      },
    ],
    [
      'Set all skills to level 99',
      () => {
        for (const k in player.xp) player.xp[k] = xpForLevel(99);
        player.maxHp = 99;
        player.hp = 99;
        renderPanel();
        updateUI();
        save();
        message('All skills set to level 99.', 'good');
      },
    ],
    ['Disable admin mode', () => setAdmin(false)],
    ['Close', closeModal],
  ]);
}
function adminSpawnMenu() {
  const ids = Object.keys(ITEMS).filter((id) => id !== 'coins');
  modalBody.innerHTML =
    `<h2>Spawn Items</h2><p class="hint">Click an item to add it. Stackables add 100, gear adds 1.</p>` +
    `<div class="bankGrid">` +
    ids
      .map(
        (id) =>
          `<div class="slot bankslot" data-spawn="${id}" title="${ITEMS[id].name}"><img class="ic" src="assets/items/${id}.png" alt="" draggable="false"></div>`,
      )
      .join('') +
    `</div><div class="bankActions"><button class="choice" data-act="back">Back</button><button class="choice" data-act="close">Close</button></div>`;
  modal.classList.remove('hidden');
  modalBody.querySelectorAll('[data-spawn]').forEach(
    (s) =>
      (s.onclick = () => {
        const id = s.dataset.spawn,
          qty = ITEMS[id].stack ? 100 : 1;
        add(id, qty, true);
        message(`Spawned ${qty}× ${ITEMS[id].name}.`, 'good');
        renderPanel();
      }),
  );
  modalBody.querySelector('[data-act="back"]').onclick = adminMenu;
  modalBody.querySelector('[data-act="close"]').onclick = closeModal;
}
function showModal(title, text, choices) {
  modalBody.innerHTML =
    `<h2>${title}</h2><p>${text}</p>` +
    choices
      .map((c, i) => `<button class="choice ${c[2] || ''}" data-i="${i}">${c[0]}</button>`)
      .join('');
  modal.classList.remove('hidden');
  modalBody.querySelectorAll('button').forEach((b) => (b.onclick = choices[+b.dataset.i][1]));
}
function closeModal() {
  modal.classList.add('hidden');
}
function renderPanel() {
  const p = document.getElementById('panel');
  if (activeTab === 'inventory') {
    let slots = Object.entries(player.inv)
      .map(
        ([id, q]) =>
          `<div class="slot" data-item="${id}" title="${ITEMS[id].name} | value ${ITEMS[id].value || 0} coins"><img class="ic" src="assets/items/${id}.png" alt="" draggable="false"><span>${q}</span></div>`,
      )
      .join('');
    p.innerHTML = `<div class="title">BACKPACK ${Object.keys(player.inv).length}/${INVENTORY_SLOTS}</div><div class="grid">${slots}${'<div class="slot"></div>'.repeat(Math.max(0, INVENTORY_SLOTS - Object.keys(player.inv).length))}</div><p class="hint">Click to use/equip. <b>Shift-click to drop one.</b> Right-click for more options (drop, examine).</p>`;
    p.querySelectorAll('[data-item]').forEach((s) => {
      s.onclick = (e) => {
        closeItemMenu();
        if (e.shiftKey) dropItem(s.dataset.item, 1);
        else useItem(s.dataset.item);
      };
      s.oncontextmenu = (e) => openItemMenu(e, s.dataset.item);
    });
  } else if (activeTab === 'skills') {
    p.innerHTML =
      '<div class="title">SKILLS</div><p class="hint">Click any skill to open its guide.</p>' +
      Object.keys(player.xp)
        .map((k) => {
          const lv = level(k),
            floor = xpForLevel(lv),
            ceil = xpForLevel(lv + 1),
            pct =
              lv >= 99
                ? 100
                : Math.max(0, Math.min(100, ((player.xp[k] - floor) / (ceil - floor)) * 100));
          return `<div class="skillRow" data-skill="${k}" title="Open the ${k} guide"><div><span>${k}</span><b>Level ${lv}</b></div><div class="xpTrack"><i style="width:${pct}%"></i></div><small>${player.xp[k]} XP</small></div>`;
        })
        .join('');
    p.querySelectorAll('[data-skill]').forEach(
      (r) => (r.onclick = () => showSkillGuide(r.dataset.skill)),
    );
  } else if (activeTab === 'gear') {
    const w = player.equipment.weapon,
      a = player.equipment.armor,
      sh = player.equipment.shield,
      g = player.equipment.gloves,
      weapon = w ? ITEMS[w] : {},
      isRanged = !!weapon.ranged,
      isMagic = !!weapon.magic,
      str = isMagic
        ? level('Magic')
        : isRanged
          ? level('Ranged')
          : level('Strength') +
            (player.combatStyle === 'aggressive' ? 3 : 0) +
            (player.activePrayer === 'strength' ? 2 : player.activePrayer === 'might' ? 5 : 0),
      max =
        (isMagic ? 2 : 1) +
        Math.floor(str / 3) +
        (isMagic ? weapon.magic || 0 : isRanged ? weapon.ranged || 0 : weapon.attack || 0);
    p.innerHTML = `<div class="title">EQUIPMENT</div><div class="grid"><div class="slot" data-equip="weapon" title="Remove weapon">${w ? '<img class="ic" src="assets/items/' + w + '.png" alt="">' : '-'}</div><div class="slot" data-equip="armor" title="Remove armour">${a ? '<img class="ic" src="assets/items/' + a + '.png" alt="">' : '-'}</div><div class="slot" data-equip="shield" title="Remove shield">${sh ? '<img class="ic" src="assets/items/' + sh + '.png" alt="">' : '-'}</div><div class="slot" data-equip="gloves" title="Remove gloves">${g ? '<img class="ic" src="assets/items/' + g + '.png" alt="">' : '-'}</div></div><div class="row"><span>Weapon</span><b>${w ? ITEMS[w].name : 'Unarmed'}</b></div><div class="row"><span>Armour</span><b>${a ? ITEMS[a].name : 'None'}</b></div><div class="row"><span>Shield</span><b>${sh ? ITEMS[sh].name : 'None'}</b></div><div class="row"><span>Gloves</span><b>${g ? ITEMS[g].name : 'None'}</b></div><div class="row"><span>${isMagic ? 'Magic' : isRanged ? 'Ranged' : 'Attack'} bonus</span><b>+${isMagic ? weapon.magic || 0 : isRanged ? weapon.ranged || 0 : weapon.attack || 0}</b></div><div class="row"><span>Defence bonus</span><b>+${(a ? ITEMS[a].defence || 0 : 0) + (sh ? ITEMS[sh].defence || 0 : 0) + (g ? ITEMS[g].defence || 0 : 0)}</b></div><div class="row"><span>Max hit</span><b>${max}</b></div><div class="row"><span>Attack speed</span><b>${weapon.speed || 4} ticks</b></div>${weapon.spec ? `<div class="row"><span>Special</span><b>${weapon.spec === 'power' ? 'Crushing blow (+60% dmg, 50%)' : 'Flurry — double hit (50%)'}</b></div>` : ''}${isMagic ? `<div class="title combatTitle">SPELLBOOK</div>${Object.entries(SPELLS).map(([id, sp]) => `<button class="choice ${player.selectedSpell === id ? 'selected' : ''}" data-spell="${id}" ${level('Magic') < sp.level ? 'disabled' : ''}><b>${sp.name}</b> - Magic ${sp.level}, ${sp.runes} rune${sp.runes === 1 ? '' : 's'}${sp.bind ? ', binds target' : sp.dmgBonus ? ', +' + sp.dmgBonus + ' max hit' : ''}</button>`).join('')}<div class="row"><span>Runes</span><b>${invCount('emberRune')} Ember</b></div><p class="hint">Attacks from up to ${weapon.range} tiles away.</p>` : isRanged ? `<div class="row"><span>Ammunition</span><b>${invCount('arrows')} arrows</b></div><p class="hint">The bow attacks from up to ${weapon.range} tiles away.</p>` : `<div class="title combatTitle">COMBAT STYLE</div>${['accurate', 'aggressive', 'defensive'].map((s) => `<button class="choice ${player.combatStyle === s ? 'selected' : ''}" data-style="${s}">${s[0].toUpperCase() + s.slice(1)} - train ${s === 'accurate' ? 'Attack' : s === 'aggressive' ? 'Strength' : 'Defence'}</button>`).join('')}`}`;
    p.querySelectorAll('[data-equip]').forEach((e) => (e.onclick = () => unequip(e.dataset.equip)));
    p.querySelectorAll('[data-style]').forEach(
      (b) => (b.onclick = () => setCombatStyle(b.dataset.style)),
    );
    p.querySelectorAll('[data-spell]').forEach(
      (b) => (b.onclick = () => selectSpell(b.dataset.spell)),
    );
  } else if (activeTab === 'prayer') {
    p.innerHTML =
      `<div class="title">PRAYER ${player.prayerPoints}/${maxPrayer()}</div><p class="hint">Only one prayer is active at a time. Bury bones to train Prayer; recharge at the Frostmere altar.</p>` +
      Object.entries(PRAYERS)
        .map(
          ([id, pr]) =>
            `<button class="choice ${player.activePrayer === id ? 'selected' : ''}" data-prayer="${id}" ${level('Prayer') < pr.level ? 'disabled' : ''}><b>${pr.name}</b> - level ${pr.level}<br><small>${pr.desc}</small></button>`,
        )
        .join('');
    p.querySelectorAll('[data-prayer]').forEach(
      (b) => (b.onclick = () => togglePrayer(b.dataset.prayer)),
    );
  } else {
    p.innerHTML = journalHTML();
    p.querySelectorAll('[data-jtab]').forEach(
      (b) =>
        (b.onclick = () => {
          journalTab = b.dataset.jtab;
          renderPanel();
        }),
    );
  }
}
// Convert bracketed status tokens into coloured badges.
function badgeify(html) {
  return html.replace(
    /\[(ACTIVE|DONE|AVAILABLE|LOCKED|COMPLETE|READY)\]/g,
    (m, s) => `<span class="qbadge ${s.toLowerCase()}">${s}</span>`,
  );
}
function journalHTML() {
  const tabs = [
    ['quests', 'Quests'],
    ['bestiary', 'Bestiary'],
    ['collection', 'Collection'],
    ['discovery', 'Discovery'],
  ];
  const pills = `<div class="jtabs">${tabs
    .map(
      ([id, label]) =>
        `<button class="jtab ${journalTab === id ? 'on' : ''}" data-jtab="${id}">${label}</button>`,
    )
    .join('')}</div>`;
  let body;
  if (journalTab === 'bestiary') body = bestiaryHTML();
  else if (journalTab === 'collection') body = barrowLoreHTML();
  else if (journalTab === 'discovery') body = discoveryHTML();
  else body = questsTabHTML();
  return pills + `<div class="jbody">${body}</div>`;
}
function questsTabHTML() {
  const s = player.story;
  const story = QUESTS.map((q, qi) => {
    const st = qi < s.q ? 'DONE' : qi === s.q ? 'ACTIVE' : 'LOCKED';
    return `<div class="qcard ${st.toLowerCase()}"><div class="qhead"><b>${q.name}</b><span class="qbadge ${st.toLowerCase()}">${st}</span></div>${q.steps
      .map(
        (step, i) =>
          `<div class="questStep ${qi < s.q || (qi === s.q && i < s.step) ? 'done' : qi === s.q && i === s.step ? 'current' : ''}">${i + 1}. ${step}</div>`,
      )
      .join('')}<p class="reward"><b>Reward:</b> ${q.reward}</p></div>`;
  }).join('');
  const contract = player.contract
    ? `<div class="qcard ${player.contract.remaining === 0 ? 'ready' : 'active'}"><div class="qhead"><b>Monster Contract</b><span class="qbadge ${player.contract.remaining === 0 ? 'ready' : 'active'}">${player.contract.remaining === 0 ? 'READY' : 'ACTIVE'}</span></div><div class="questStep current">${player.contract.remaining === 0 ? 'Return to Guard Bren.' : `${player.contract.remaining} of ${player.contract.total} ${player.contract.name}s remaining.`}</div></div>`
    : '';
  const side = [
    sideQuestHTML(),
    silkQuestHTML(),
    brokenRoadHTML(),
    hearthQuestHTML(),
    mireQuestHTML(),
  ]
    .map((h) => `<div class="qcard">${badgeify(h)}</div>`)
    .join('');
  return (
    `<div class="jsection">Story</div>${story}${contract}` +
    `<div class="jsection">Side quests</div>${side}` +
    `<div class="jsection">Training</div>${badgeify(starterQuestHTML())}`
  );
}
function starterQuestHTML() {
  const done = STARTER_QUESTS.filter((q) => player.starterClaimed[q.id]).length;
  return (
    `<div class="title">TRAINING QUESTS ${done}/${STARTER_QUESTS.length}</div>` +
    `<p class="hint">Short quests that teach each skill group. Rewards are paid the moment you finish the objectives.</p>` +
    STARTER_QUESTS.map((q) => {
      const complete = player.starterClaimed[q.id],
        status = complete ? '[DONE]' : starterDone(q) ? '[COMPLETE]' : '[ACTIVE]',
        rewardXp = Object.entries(q.reward.xp)
          .map(([sk, amt]) => `${amt} ${sk}`)
          .join(', ');
      return (
        `<div class="starterQuest ${complete ? 'done' : ''}"><div class="title">${status} ${q.name}</div>` +
        `<div class="qGroup">${q.group}</div><p class="hint">${q.blurb}</p>` +
        q.objectives
          .map((o) => {
            const prog = starterProgress(o);
            return `<div class="questStep ${prog >= o.goal ? 'done' : 'current'}">${o.label}: ${prog}/${o.goal}</div>`;
          })
          .join('') +
        `<p class="reward"><b>Reward:</b> ${q.reward.gold} coins, ${rewardXp} XP</p></div>`
      );
    }).join('')
  );
}
function sideQuestHTML() {
  const q = player.sideQuests.boarHunt,
    status = q.step === 0 ? '[AVAILABLE]' : q.step === 1 ? '[ACTIVE]' : '[DONE]';
  return `<div class="title">${status} The Boar Hunt</div><div class="questStep ${q.step === 2 ? 'done' : q.step === 1 ? 'current' : ''}">${q.step === 0 ? 'Speak with Elder Willow in Thornwood — beasts flee the wastes into her woods.' : q.step === 1 ? `Defeat wild boars: ${q.kills}/3` : 'The Thornwood hedges are safe once more.'}</div><p><b>Reward:</b> Thornwood mantle, 150 coins, Slayer and Cooking XP</p>`;
}
function silkQuestHTML() {
  const q = player.sideQuests.silkAndCinders,
    available = player.story.q >= 2,
    status =
      q.step === 0
        ? available
          ? '[AVAILABLE]'
          : '[LOCKED]'
        : q.step === 1
          ? '[ACTIVE]'
          : '[DONE]';
  return `<div class="title">${status} Silk and Cinders</div><div class="questStep ${q.step === 2 ? 'done' : q.step === 1 ? 'current' : ''}">${q.step === 0 ? (available ? 'Speak with Scout Vale at the Ashfall Wastes — spiders breed in the lower Barrow.' : 'Progress the story to reach the Ashfall Wastes.') : q.step === 1 ? `Defeat cave spiders: ${q.kills}/4` : 'The lower Barrow route is secure.'}</div><p><b>Reward:</b> Cave-silk robe, 180 coins, 20 Ember runes, Magic and Slayer XP</p>`;
}
function brokenRoadHTML() {
  const q = player.sideQuests.brokenRoad,
    available = player.story.q >= 1,
    status =
      q.step === 0
        ? available
          ? '[AVAILABLE]'
          : '[LOCKED]'
        : q.step === 1
          ? '[ACTIVE]'
          : '[DONE]';
  return `<div class="title">${status} The Broken Road</div><div class="questStep ${q.step === 2 ? 'done' : q.step === 1 ? 'current' : ''}">${q.step === 0 ? (available ? 'Speak with Mara in Frostmere — the northern supply roads are failing.' : 'Complete the Greenrest guide quest first.') : q.step === 1 ? `Defeat road bandits: ${q.kills}/4` : 'The northern supply carts travel safely again.'}</div><p><b>Reward:</b> Frostmere buckler, 160 coins, Defence and Slayer XP</p>`;
}
function hearthQuestHTML() {
  const q = player.sideQuests.hearthAndHome,
    available = player.story.q >= 1,
    status =
      q.step === 0
        ? available
          ? '[AVAILABLE]'
          : '[LOCKED]'
        : q.step === 1
          ? '[ACTIVE]'
          : '[DONE]',
    have = invCount('rawMeat') && invCount('cabbage') && invCount('herb');
  return `<div class="title">${status} Hearth and Home</div><div class="questStep ${q.step === 2 ? 'done' : q.step === 1 ? 'current' : ''}">${q.step === 0 ? (available ? 'Speak with Tamsin at the Resting Stag in Pineholt.' : 'Help Captain Rowan secure Pineholt first.') : q.step === 1 ? `Gather feast ingredients: boar meat ${Math.min(1, invCount('rawMeat'))}/1, cabbage ${Math.min(1, invCount('cabbage'))}/1, wild herb ${Math.min(1, invCount('herb'))}/1${have ? ' — return to Tamsin.' : ''}` : 'Pineholt celebrated beneath a warm and crowded roof.'}</div><p><b>Reward:</b> 120 coins, 3 Pineholt stews, Cooking and Farming XP</p>`;
}
function mireQuestHTML() {
  const q = player.sideQuests.cureMirehaven,
    available = player.story.q >= 1,
    status =
      q.step === 0
        ? available
          ? '[AVAILABLE]'
          : '[LOCKED]'
        : q.step === 1
          ? '[ACTIVE]'
          : '[DONE]';
  return `<div class="title">${status} A Cure for Sablemarsh</div><div class="questStep ${q.step === 2 ? 'done' : q.step === 1 ? 'current' : ''}">${q.step === 0 ? (available ? 'Speak with Healer Sable in Sablemarsh — the marsh-fever is the Ember seeping up from below.' : 'Help Greenrest before travelling southwest.') : q.step === 1 ? `Gather Bog moss from Boglings: ${Math.min(4, invCount('bogMoss'))}/4${invCount('bogMoss') >= 4 ? ' — return to Sable.' : ''}` : 'Sablemarsh is free of the marsh-fever.'}</div><p><b>Reward:</b> Sablemarsh charm, 2 antidotes, 160 coins, Herblore and Defence XP</p>`;
}
function discoveryHTML() {
  const found = DISCOVERY_REGIONS.filter((r) => player.discoveredRegions[r]).length;
  return `<div class="title">WORLD DISCOVERY ${found}/${DISCOVERY_REGIONS.length}</div><div class="discoveryList">${DISCOVERY_REGIONS.map((r) => `<div class="${player.discoveredRegions[r] ? 'found' : ''}"><span>${player.discoveredRegions[r] ? '◆' : '◇'}</span>${player.discoveredRegions[r] ? r : 'Undiscovered region'}</div>`).join('')}</div><p class="hint">${player.explorerRewarded ? 'All major regions explored. The explorer cape is yours.' : 'Discover all major regions to earn 250 coins and the Emberfall explorer cape.'}</p>`;
}
function barrowLoreHTML() {
  const found = BARROW_TABLETS.filter((t) => player.barrowLore[t.id]).length;
  return (
    `<div class="title">ASHEN BARROW</div><div class="bestiaryRow known"><div><b>Dungeon clears</b><span>${player.barrowRuns} reward chest${player.barrowRuns === 1 ? '' : 's'} claimed</span></div><small>${barrowChestReady() ? 'Chest ready to claim' : 'Defeat the Warden to unlock the chest'}</small></div><div class="row"><span>Personal best</span><b>${player.barrowBestMs ? formatRunTime(player.barrowBestMs) : 'Not set'}</b></div><div class="row"><span>Last clear</span><b>${player.barrowLastMs ? formatRunTime(player.barrowLastMs) : 'Not set'}</b></div><div class="row"><span>Best reward potential</span><b>${player.barrowBestPotential || 0}%</b></div><p class="hint">Skeletons add 15%, cave spiders 12%, and ash bats 10% reward potential per run.</p><div class="title">BARROW COLLECTION ${Object.values(player.collection.barrow).filter(Boolean).length}/3</div><div class="grid collectionGrid">${[
      ['cloak', 'wardenCloak'],
      ['guard', 'ashenGuard'],
      ['lantern', 'barrowLantern'],
    ]
      .map(
        ([key, id]) =>
          `<div class="slot ${player.collection.barrow[key] ? 'found' : 'locked'}" title="${player.collection.barrow[key] ? ITEMS[id].name : 'Undiscovered Barrow unique'}">${player.collection.barrow[key] ? '<img class="ic" src="assets/items/' + id + '.png" alt="">' : '?'}</div>`,
      )
      .join(
        '',
      )}</div><p class="hint">The Barrow lantern brightens the dungeon while carried. Higher reward potential improves unique chances.</p><div class="title">BARROW LORE ${found}/${BARROW_TABLETS.length}</div><p class="hint">${found === BARROW_TABLETS.length ? 'All three Ashen Barrow inscriptions have been recorded.' : 'Search the dungeon chambers for ancient stone tablets.'}</p>` +
    BARROW_TABLETS.map((t) =>
      player.barrowLore[t.id]
        ? `<div class="qcard done"><div class="qhead"><b>${t.name}</b><span class="qbadge done">READ</span></div><p style="font-style:italic;color:#c3b78f;line-height:1.5">${t.text}</p></div>`
        : `<div class="questStep">Undiscovered inscription — search the Barrow chambers</div>`,
    ).join('')
  );
}
function bestiaryHTML() {
  const order = [
    'rat',
    'goblin',
    'wolf',
    'boar',
    'bandit',
    'bogling',
    'direWolf',
    'frostTroll',
    'cinderFiend',
    'goblinWarlord',
    'guardian',
    'skeleton',
    'bat',
    'spider',
    'warden',
    'cinderColossus',
  ];
  return (
    `<div class="title bestiaryTitle">BESTIARY</div><p class="hint">Your recorded monster defeats and known spoils.</p>` +
    order
      .map((id) => {
        const m = MONSTER_TYPES[id],
          kills = player.killLog[id] || 0,
          drops =
            [...new Set(m.drops.map((d) => ITEMS[d[0]].name))].join(', ') +
            (id === 'warden' ? ', Warden cloak, Ashen guard, Barrow lantern (chest)' : '');
        return `<div class="bestiaryRow ${kills ? 'known' : ''}"><div><b>${m.name}</b><span>${kills} defeated</span></div><small>${kills ? drops : 'Undiscovered'}</small></div>`;
      })
      .join('')
  );
}
function updateUI() {
  renderTutorial();
  const poisonStatus = document.getElementById('statusEffect');
  if (poisonStatus) {
    poisonStatus.textContent = player.poison
      ? `☠ POISONED · ${player.poison} dose${player.poison === 1 ? '' : 's'} remaining`
      : '';
    poisonStatus.classList.toggle('hidden', !player.poison);
  }
  document.getElementById('status').innerHTML =
    `<div class="orb hp">&#9829; ${player.hp}/${player.maxHp}</div><div class="orb gp">&#9679; ${player.gold}</div><div class="orb prayer">&#10022; ${player.prayerPoints}/${maxPrayer()}</div><button class="orb run ${player.runEnabled ? 'active' : ''}" onclick="toggleRun()" title="Toggle run (R)">&#10148; ${Math.floor(player.runEnergy)}%</button><button class="orb spec ${player.specArmed ? 'armed' : ''}" onclick="toggleSpec()" title="Special attack — arm/disarm (costs 50%)">&#9889; ${Math.floor(player.specEnergy)}%</button>`;
  document.querySelector('#sidebar header small').textContent =
    `CHAPTER 1  CMB ${combatLevel()}` + (admin ? '  ·  ⚙ ADMIN' : '');
  const s = player.story;
  questTracker.innerHTML =
    s.q >= QUESTS.length
      ? '<b>CHAPTER ONE</b>All three quests complete.'
      : `<b>${QUESTS[s.q].name}</b>${QUESTS[s.q].steps[s.step]}`;
  if (player.contract)
    questTracker.innerHTML += `<div class="miniContract"><b>CONTRACT</b>${player.contract.remaining === 0 ? 'Return to Guard Bren' : player.contract.remaining + ' ' + player.contract.name + (player.contract.remaining === 1 ? '' : 's') + ' remaining'}</div>`;
  const bq = player.sideQuests.boarHunt,
    sq = player.sideQuests.silkAndCinders,
    rq = player.sideQuests.brokenRoad,
    hq = player.sideQuests.hearthAndHome,
    mq = player.sideQuests.cureMirehaven;
  if (mq.step === 1)
    questTracker.innerHTML += `<div class="miniContract"><b>A CURE FOR MIREHAVEN</b>${Math.min(4, invCount('bogMoss'))}/4 Bog moss gathered</div>`;
  if (hq.step === 1)
    questTracker.innerHTML += `<div class="miniContract"><b>HEARTH AND HOME</b>Meat ${Math.min(1, invCount('rawMeat'))}/1 · Cabbage ${Math.min(1, invCount('cabbage'))}/1 · Herb ${Math.min(1, invCount('herb'))}/1</div>`;
  if (rq.step === 1)
    questTracker.innerHTML += `<div class="miniContract"><b>THE BROKEN ROAD</b>${rq.kills}/4 road bandits defeated</div>`;
  if (sq.step === 1)
    questTracker.innerHTML += `<div class="miniContract"><b>SILK AND CINDERS</b>${sq.kills}/4 cave spiders defeated</div>`;
  if (bq.step === 1)
    questTracker.innerHTML += `<div class="miniContract"><b>THE BOAR HUNT</b>${bq.kills}/3 wild boars defeated</div>`;
  if (player.grave)
    questTracker.innerHTML += `<div class="miniGrave"><b>GRAVESTONE</b>${Math.max(1, Math.ceil((player.grave.expiresAt - Date.now()) / 60000))} min - ${regionNameFor(player.grave.x, player.grave.y)}</div>`;
}
document.getElementById('closeMap').onclick = closeWorldMap;
document.getElementById('homeTeleport').onclick = homeTeleport;
document.getElementById('worldMapCanvas').onclick = mapDestination;
document.getElementById('worldMapCanvas').onmousemove = mapHover;
document.getElementById('worldMapCanvas').onmouseleave = () =>
  document.getElementById('mapTooltip').classList.add('hidden');
document.querySelectorAll('nav button').forEach(
  (b) =>
    (b.onclick = () => {
      activeTab = b.dataset.tab;
      if (activeTab === 'quest') advanceTutorial(5);
      document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('active', x === b));
      renderPanel();
    }),
);
reset.onclick = () => {
  if (confirm('Erase your character and restart?')) {
    localStorage.removeItem('emberfall-ef1');
    location.reload();
  }
};
const adminBtn = document.getElementById('adminBtn');
adminBtn.onclick = () => (admin ? adminMenu() : loginAdmin());
adminBtn.classList.toggle('on', admin);
function openWiki() {
  window.open('wiki.html', '_blank');
}
document.getElementById('wikiBtn').onclick = openWiki;
if (admin) {
  player.runEnabled = true;
  player.runEnergy = 100;
}
message(
  'Welcome to Greenrest Vale. Open the Journal tab to find Training Quests that teach each skill and pay coins and XP. Walking and running are immediate; combat and skills use a 0.6 second action rhythm. Press R to toggle run.',
  'game',
);
checkRegion();
syncLevels(true);
updateUI();
renderPanel();
requestAnimationFrame(render);
