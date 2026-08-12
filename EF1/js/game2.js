function activateTarget(t, x = hover.x, y = hover.y) {
  closeContext();
  if (!t) return setPath(x, y);
  if (t.ore) return moveAdjacent(t, () => startMining(t));
  if (TREES.includes(t)) return moveAdjacent(t, () => startChop(t));
  if (HUNT_SPOTS.includes(t)) return moveAdjacent(t, () => startHunt(t));
  if (FISH_SPOTS.includes(t)) return moveAdjacent(t, () => fish(t));
  if (SIGNPOSTS.includes(t)) return moveAdjacent(t, () => readSign(t));
  if (BARROW_TABLETS.includes(t)) return moveAdjacent(t, () => readBarrowTablet(t));
  if (FARM_PATCHES.includes(t)) return moveAdjacent(t, () => interactPatch(t));
  if (t.kind === 'grave') return moveAdjacent(t, recoverGrave);
  if (t.kind === 'craftbench') return moveAdjacent(t, openCrafting);
  if (t.kind === 'cauldron') return moveAdjacent(t, openHerblore);
  if (t.kind === 'forge') return moveAdjacent(t, openAnvil);
  if (t.kind === 'furnace') return moveAdjacent(t, openFurnace);
  if (t.kind === 'altar') return moveAdjacent(t, prayAtAltar);
  if (t.kind === 'chest') return moveAdjacent(t, openDungeonChest);
  if (t.type) return engageMonster(t);
  if (t.role) return moveAdjacent(t, () => talk(t));
  if (t.item) return moveAdjacent(t, () => loot(t));
  if (t.toX !== undefined) return moveAdjacent(t, () => usePortal(t));
  if (t.kind === 'fire') return moveAdjacent(t, () => cook(t));
}
function targetTitle(t) {
  if (!t) return 'Ground';
  if (t.ore) return t.name;
  if (t.type) return t.type.name;
  if (HUNT_SPOTS.includes(t)) return t.name;
  if (FISH_SPOTS.includes(t)) return t.name;
  if (t.item) return ITEMS[t.item].name;
  if (t.label) return t.label;
  if (SIGNPOSTS.includes(t)) return t.name;
  if (FARM_PATCHES.includes(t)) return t.name;
  if (t.kind === 'grave') return 'Your gravestone';
  if (t.kind === 'craftbench') return WORKBENCH.name;
  if (t.kind === 'cauldron') return CAULDRON.name;
  if (t.kind === 'forge') return FORGE.name;
  if (t.kind === 'furnace') return FURNACE.name;
  if (t.kind === 'altar') return ALTAR.name;
  if (t.kind === 'fire') return 'Cooking fire';
  return t.name || 'Object';
}
function primaryLabel(t) {
  if (!t) return 'Walk here';
  if (t.ore) return 'Mine';
  if (TREES.includes(t)) return 'Chop';
  if (HUNT_SPOTS.includes(t)) return 'Lay-trap';
  if (FISH_SPOTS.includes(t)) return 'Fish';
  if (SIGNPOSTS.includes(t) || BARROW_TABLETS.includes(t)) return 'Read';
  if (FARM_PATCHES.includes(t)) return patchAction(t);
  if (t.kind === 'grave') return 'Recover';
  if (t.kind === 'craftbench') return 'Craft-at';
  if (t.kind === 'cauldron') return 'Brew-at';
  if (t.kind === 'chest') return 'Open';
  if (t.type) return 'Attack';
  if (t.item) return 'Take';
  if (t.role) return 'Talk-to';
  if (t.toX !== undefined) return t.label;
  if (t.kind === 'forge') return 'Use';
  if (t.kind === 'furnace') return 'Use';
  if (t.kind === 'altar') return 'Pray-at';
  if (t.kind === 'fire') return 'Cook';
  return 'Use';
}
function examineTarget(t) {
  let text;
  if (!t) text = 'A walkable tile in the world of Emberfall.';
  else if (t.ore) text = `A ${t.name.toLowerCase()}. It requires Mining level ${t.level}.`;
  else if (HUNT_SPOTS.includes(t))
    text = 'A rabbit burrow. Lay a wooden snare nearby to train Hunter.';
  else if (FISH_SPOTS.includes(t))
    text = `${t.catchName[0].toUpperCase() + t.catchName.slice(1)} ripple beneath the surface. Requires Fishing level ${t.level}.`;
  else if (SIGNPOSTS.includes(t) || BARROW_TABLETS.includes(t)) text = t.text;
  else if (FARM_PATCHES.includes(t)) {
    const state = player.farm[t.id];
    text = !state
      ? 'An empty patch ready for cabbage seed.'
      : Date.now() >= state.readyAt
        ? 'Healthy cabbages are ready to harvest.'
        : `Cabbages are growing. About ${Math.ceil((state.readyAt - Date.now()) / 1000)} seconds remain.`;
  } else if (TREES.includes(t))
    text = `A healthy ${t.name.toLowerCase()}. It requires Woodcutting level ${t.level}.`;
  else if (t.type)
    text = `${t.type.name}: ${t.maxHp} hitpoints and a maximum hit of ${t.type.maxHit}.`;
  else if (t.item) text = `${ITEMS[t.item].name}, quantity ${t.q}.`;
  else if (t.role)
    text = `${t.name}, ${t.role}.${t.pickpocket ? ' They look distracted enough to pickpocket.' : ''}`;
  else if (t.toX !== undefined) text = t.label + '.';
  else if (t.kind === 'craftbench')
    text = 'A sturdy bench with needles, awls, and a small weaving frame.';
  else if (t.kind === 'cauldron')
    text = 'A bubbling cauldron used to brew herbs into useful potions.';
  else if (t.kind === 'grave')
    text = `Your gravestone holds ${Object.values(t.items).reduce((a, b) => a + b, 0)} item${Object.values(t.items).reduce((a, b) => a + b, 0) === 1 ? '' : 's'} and ${t.gold || 0} coins.`;
  else if (t.kind === 'forge') text = 'Torren uses this anvil to hammer bars into useful equipment.';
  else if (t.kind === 'furnace')
    text = 'A roaring furnace where ore is smelted into bars, ready for the anvil.';
  else if (t.kind === 'altar') text = 'A peaceful altar where Prayer points can be restored.';
  else if (t.kind === 'chest')
    text = barrowChestReady()
      ? 'The Warden chest glows with newly awakened treasure.'
      : `A dormant reward chest. Completed Barrow runs: ${player.barrowRuns}.`;
  else if (t.kind === 'fire') text = 'A hot fire suitable for cooking.';
  else text = 'You see nothing unusual.';
  message(text, 'game');
  closeContext();
}
function closeContext() {
  document.getElementById('contextMenu').classList.add('hidden');
}
function openContext(e, t, x, y) {
  e.preventDefault();
  closeItemMenu();
  advanceTutorial(1);
  const menu = document.getElementById('contextMenu'),
    r = canvas.getBoundingClientRect(),
    pile = t && t.item ? drops.filter((d) => d.x === x && d.y === y) : [],
    hasExtra = pile.length > 1 || (t && t.pickpocket),
    px = Math.min(e.clientX - r.left, canvas.clientWidth - 210),
    py = Math.min(e.clientY - r.top, canvas.clientHeight - (hasExtra ? 215 : 175)),
    primary = primaryLabel(t),
    title = targetTitle(t),
    takeAll =
      pile.length > 1 ? `<button data-a="all">Take all (${pile.length} stacks)</button>` : '',
    pick = t && t.pickpocket ? `<button data-a="pick">Pickpocket ${title}</button>` : '';
  menu.style.left = Math.max(4, px) + 'px';
  menu.style.top = Math.max(4, py) + 'px';
  menu.innerHTML = `<div class="menuTitle">Choose option: ${title}</div><button data-a="primary" class="${t && t.type ? 'danger' : ''}">${primary} ${title}</button>${pick}${takeAll}<button data-a="walk">Walk here</button><button data-a="examine">Examine ${title}</button><button data-a="cancel" class="cancel">Cancel</button>`;
  menu.classList.remove('hidden');
  menu.querySelector('[data-a="primary"]').onclick = (ev) => {
    ev.stopPropagation();
    activateTarget(t, x, y);
  };
  const pickButton = menu.querySelector('[data-a="pick"]');
  if (pickButton)
    pickButton.onclick = (ev) => {
      ev.stopPropagation();
      closeContext();
      moveAdjacent(t, () => startPickpocket(t));
    };
  const all = menu.querySelector('[data-a="all"]');
  if (all)
    all.onclick = (ev) => {
      ev.stopPropagation();
      closeContext();
      moveAdjacent({ x, y }, () => lootPile(x, y));
    };
  menu.querySelector('[data-a="walk"]').onclick = (ev) => {
    ev.stopPropagation();
    closeContext();
    setPath(x, y);
  };
  menu.querySelector('[data-a="examine"]').onclick = (ev) => {
    ev.stopPropagation();
    examineTarget(t);
  };
  menu.querySelector('[data-a="cancel"]').onclick = (ev) => {
    ev.stopPropagation();
    closeContext();
  };
}
canvas.addEventListener('click', (e) => {
  closeItemMenu();
  const r = canvas.getBoundingClientRect(),
    x = e.clientX - r.left,
    y = e.clientY - r.top;
  if (isMinimapPoint(x, y)) return minimapTravel(x, y);
  activateTarget(targetAt(hover.x, hover.y), hover.x, hover.y);
});
canvas.addEventListener('contextmenu', (e) => {
  const r = canvas.getBoundingClientRect(),
    mx = e.clientX - r.left,
    my = e.clientY - r.top;
  if (isMinimapPoint(mx, my)) {
    e.preventDefault();
    return;
  }
  const p = toWorld(mx, my),
    x = Math.max(0, Math.min(MAP_W - 1, Math.floor(p.x))),
    y = Math.max(0, Math.min(MAP_H - 1, Math.floor(p.y)));
  openContext(e, targetAt(x, y), x, y);
});
document.addEventListener('click', (e) => {
  const m = document.getElementById('itemMenu');
  if (!m.classList.contains('hidden') && !m.contains(e.target)) closeItemMenu();
});
function cancelCurrentAction() {
  const map = document.getElementById('worldMap'),
    modal = document.getElementById('modal'),
    context = document.getElementById('contextMenu'),
    items = document.getElementById('itemMenu');
  if (!map.classList.contains('hidden')) {
    closeWorldMap();
    return;
  }
  if (!modal.classList.contains('hidden')) {
    closeModal();
    return;
  }
  if (!context.classList.contains('hidden')) {
    closeContext();
    return;
  }
  if (!items.classList.contains('hidden')) {
    closeItemMenu();
    return;
  }
  if (path.length || moveSegment || pending || combat || skilling || destination) {
    path = [];
    pending = null;
    combat = null;
    skilling = null;
    destination = null;
    message('Action cancelled.', 'game');
  }
}
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    save();
    message('Game saved.', 'good');
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelCurrentAction();
  } else if (e.key.toLowerCase() === 'r' && !e.repeat) toggleRun();
  else if (e.key.toLowerCase() === 'h' && !e.repeat) homeTeleport();
  else if (e.key.toLowerCase() === 'k' && !e.repeat) {
    const m = window.SFX ? SFX.toggle() : false;
    message(m ? 'Sound muted.' : 'Sound on.', 'game');
  }
  else if (e.key.toLowerCase() === 'm' && !e.repeat) {
    const map = document.getElementById('worldMap');
    map.classList.contains('hidden') ? openWorldMap() : closeWorldMap();
  } else if (e.key.toLowerCase() === 'g' && !e.repeat) openWiki();
});
addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') save();
});
function loot(d) {
  if (d.item === 'coins') player.gold += d.q;
  else if (!add(d.item, d.q)) return message('Your backpack is full.', 'bad');
  drops = drops.filter((x) => x !== d);
  message(`You take ${d.q} ${ITEMS[d.item].name}.`, 'good');
  if (player.story.q === 1 && player.story.step === 1 && invCount('hide') >= 3) {
    player.story.step = 2;
    questUpdate();
  }
  renderPanel();
}
function lootPile(x, y) {
  const pile = drops.filter((d) => d.x === x && d.y === y);
  if (!pile.length) return;
  let taken = 0;
  for (const d of pile) {
    if (d.item === 'coins') {
      player.gold += d.q;
      drops = drops.filter((v) => v !== d);
      taken++;
    } else if (canAdd(d.item)) {
      add(d.item, d.q);
      drops = drops.filter((v) => v !== d);
      taken++;
    }
  }
  if (taken) message(`You take ${taken} stack${taken === 1 ? '' : 's'} from the ground.`, 'good');
  if (drops.some((d) => d.x === x && d.y === y))
    message('Some items remain because your backpack is full.', 'bad');
  if (player.story.q === 1 && player.story.step === 1 && invCount('hide') >= 3) {
    player.story.step = 2;
    questUpdate();
  }
  renderPanel();
  updateUI();
}
function talk(n) {
  if (n.id === 'elowen') {
    advanceTutorial(2);
    return guide();
  }
  if (n.id === 'rowan') return rowan();
  if (n.id === 'mira') return mira();
  if (n.id === 'kessa') return kessa();
  if (n.id === 'pell') return pell();
  if (n.id === 'king') return king();
  if (n.id === 'yara') return yara();
  if (n.id === 'bren') return slayerContract();
  if (n.id === 'tamsin') return oakridgeInn();
  if (n.id === 'willow') return willowElder();
  if (n.id === 'orin') return shop("Orin's Hunting Supplies", 'hunter');
  if (n.id === 'vale') return scoutVale();
  if (n.id === 'mara') return maraQuest();
  if (n.id === 'edric') return embercrossRest();
  if (n.id === 'sable') return sableQuest();
  if (n.id === 'fenwick') return shop('Fenwick - Sablemarsh Supplies', 'mirehaven');
  if (n.id === 'torren') return torren();
  if (n.id === 'corvin') return shop("Corvin's Arcane Wares", 'magic');
  if (n.id === 'alaric') return alaric();
  if (n.id === 'harker') return harker();
  if (n.id === 'murphy') return shop("Murphy's Fishing Supplies", 'fishing');
  if (n.id === 'banker') return bank();
  return showModal(n.name, n.dialogue || 'Good day, traveller.', [['Continue', closeModal]]);
}
function sableQuest() {
  const q = player.sideQuests.cureMirehaven,
    ready = invCount('bogMoss') >= 4;
  if (player.story.q < 1)
    return showModal(
      'Healer Sable',
      'Sablemarsh needs proven hands. Help Greenrest Vale first, then return to our marsh.',
      [['Continue', closeModal]],
    );
  if (q.step === 0)
    return showModal(
      'Healer Sable',
      "Marsh fever has reached every home, and it is not a fever I recognize — it runs hot, then cold as ash, same as the old stories tell of Ember-sickness. A traveler passed through last season asking after bog moss for her own studies; called herself an Ashwright. I sent her away with nothing. I need what moss we have for the living. Boglings carry moss that resists the sickness — bring me four clumps and I can prepare a cure.",
      [
        [
          'Begin A Cure for Sablemarsh',
          () => {
            q.step = 1;
            message('Side quest started: A Cure for Sablemarsh.', 'game');
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
        ['Not now', closeModal],
      ],
    );
  if (q.step === 1 && !ready)
    return showModal(
      'Healer Sable',
      `You have ${invCount('bogMoss')} of 4 Bog moss. Boglings gather beyond Sablemarsh's fence.`,
      [['Continue', closeModal]],
    );
  if (q.step === 1)
    return showModal(
      'Healer Sable',
      'This moss is strong enough. Tonight the fever will finally break — though I fear it will return each season the Barrow seals weaken further. A cure is not the same as an answer.',
      [
        [
          'Complete quest',
          () => {
            add('bogMoss', -4);
            add('mireCharm', 1, true);
            add('antidote', 2, true);
            player.gold += 160;
            player.xp.Herblore += 90;
            player.xp.Defence += 50;
            q.step = 2;
            message(
              'Side quest complete: A Cure for Sablemarsh! +160 coins, Sablemarsh charm, 2 antidotes, Herblore and Defence XP.',
              'good',
            );
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
        ['Not yet', closeModal],
      ],
    );
  showModal(
    'Healer Sable',
    'The fever has passed. Sablemarsh remembers the traveller who carried hope through the bog.',
    [['Continue', closeModal]],
  );
}
function maraQuest() {
  const q = player.sideQuests.brokenRoad,
    shopOption = ['Browse provisions', () => shop('Mara - Frostmere Provisions', 'embercross')];
  if (player.story.q < 1)
    return showModal(
      'Mara',
      'Frostmere serves travellers heading east. Prove yourself in Greenrest Vale, then I may have work for you.',
      [shopOption, ['Leave', closeModal]],
    );
  if (q.step === 0)
    return showModal(
      'Mara',
      'Road bandits are stealing our food shipments before they reach Frostmere. Defeat four of them and I will give you a buckler from the old road watch.',
      [
        [
          'Begin The Broken Road',
          () => {
            q.step = 1;
            q.kills = 0;
            message('Side quest started: The Broken Road.', 'game');
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
        shopOption,
        ['Not now', closeModal],
      ],
    );
  if (q.step === 1 && q.kills >= 4)
    return showModal(
      'Mara',
      "The supply carts arrived safely — and their leader is cornered on the old road, alive. Look at him closely and he is no road-watch deserter. Ash in his boots, Ashfall scars on his hands. Half of what you have been fighting is refugees with nothing left to lose, not raiders. What do you do with him?",
      [
        ['Let him go', () => resolveBrokenRoad('mercy')],
        ['Turn him over to the watch', () => resolveBrokenRoad('harsh')],
        shopOption,
      ],
    );
  if (q.step === 1)
    return showModal(
      'Mara',
      'You have defeated ' +
        q.kills +
        ' of 4 road bandits. They stalk the roads east and south of Frostmere.',
      [shopOption, ['Continue', closeModal]],
    );
  showModal(
    'Mara',
    q.mercy
      ? 'The road watch buckler suits you. I still do not know if letting him walk was wisdom or softness — but our supply carts have not been touched since.'
      : 'The road watch buckler suits you. Our supply carts still remember your name.',
    [shopOption, ['Continue', closeModal]],
  );
}
function resolveBrokenRoad(mode) {
  const q = player.sideQuests.brokenRoad;
  q.mercy = mode === 'mercy';
  q.step = 2;
  player.gold += 160;
  player.xp.Defence += 80;
  player.xp.Slayer += 60;
  add('roadBuckler', 1, true);
  const text =
    mode === 'mercy'
      ? 'You cut him loose and point him toward the wastes he came from. He does not thank you — he just runs. "Foolish," Mara says quietly, watching him go, "but I will not pretend I am sorry." She presses the road watch buckler into your hands anyway.'
      : 'You hand him over. The watch will decide his fate, not you. Mara nods, satisfied. "The road stays safe either way," she says, and gives you the buckler with her thanks — though something in her voice does not quite match her face.';
  showModal('Mara', text, [['Continue', closeModal]]);
  message(
    'Side quest complete: The Broken Road! +160 coins, +80 Defence XP, +60 Slayer XP.',
    'good',
  );
  renderPanel();
  updateUI();
  save();
}
function embercrossRest() {
  const wait = Math.max(0, 300000 - (Date.now() - player.roadsideBlessAt));
  if (wait)
    return showModal(
      'Brother Edric',
      'The wayfire blessing needs time to settle. Return in ' +
        Math.ceil(wait / 60000) +
        ' minute' +
        (wait > 60000 ? 's' : '') +
        '.',
      [['Continue', closeModal]],
    );
  showModal(
    'Brother Edric',
    'Rest beside the Frostmere wayfire. Its blessing will restore your Hitpoints, Prayer, and run energy. There is no charge for travellers.',
    [
      [
        'Rest by the wayfire',
        () => {
          closeModal();
          combat = null;
          path = [];
          moveSegment = null;
          pending = null;
          skilling = { type: 'roadsideBless', next: tickCount + 4 };
          lastActionAt = performance.now();
          actionDuration = TICK_MS * 4;
          message('You kneel beside the Frostmere wayfire.', 'game');
        },
      ],
      ['Leave', closeModal],
    ],
  );
}
function oakridgeInn() {
  const q = player.sideQuests.hearthAndHome,
    questOption =
      player.story.q >= 1
        ? [
            q.step === 0
              ? 'Ask if Tamsin needs help'
              : q.step === 1
                ? 'Discuss Hearth and Home'
                : 'Remember the village feast',
            tamsinQuest,
          ]
        : [
            'Ask about work',
            () =>
              showModal(
                'Tamsin',
                'Help Captain Rowan first. Pineholt must be secure before we can think about a proper village feast.',
                [['Back', oakridgeInn]],
              ),
          ];
  showModal(
    'Tamsin - The Resting Stag',
    'A warm hearth, a hearty stew, and a safe bed await. Resting costs 5 coins and restores Hitpoints, Prayer, and run energy.',
    [
      questOption,
      ['Rest for 5 coins', restAtInn],
      ['Buy Pineholt stew - 8 coins', () => buyInnStew()],
      [
        'Ask about Pineholt',
        () =>
          showModal(
            'Tamsin',
            'The goblins came first. Then the old Barrow began glowing. Captain Rowan keeps watch, but even captains need travellers brave enough to leave the walls.',
            [['Back', oakridgeInn]],
          ),
      ],
      ['Leave', closeModal],
    ],
  );
}
function tamsinQuest() {
  const q = player.sideQuests.hearthAndHome,
    ready = invCount('rawMeat') >= 1 && invCount('cabbage') >= 1 && invCount('herb') >= 1;
  if (q.step === 0)
    return showModal(
      'Tamsin',
      'Pineholt has survived, but surviving is not the same as living. Bring me raw boar meat, a cabbage, and a wild herb. I will cook a feast worthy of our village hearth.',
      [
        [
          'Begin Hearth and Home',
          () => {
            q.step = 1;
            message('Side quest started: Hearth and Home.', 'game');
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
        ['Not now', oakridgeInn],
      ],
    );
  if (q.step === 1 && !ready)
    return showModal(
      'Tamsin',
      `For the feast I still need:${invCount('rawMeat') ? '' : ' raw boar meat'}${invCount('cabbage') ? '' : ' a cabbage'}${invCount('herb') ? '' : ' a wild herb'}.`,
      [['Back', oakridgeInn]],
    );
  if (q.step === 1)
    return showModal(
      'Tamsin',
      'Everything is here. The Resting Stag will be full tonight, and Pineholt will remember who made the feast possible. Even Pell keeps asking if you will be there — I think that runner has decided you are the most interesting thing to happen to this village in years.',
      [
        [
          'Complete Hearth and Home',
          () => {
            add('rawMeat', -1);
            add('cabbage', -1);
            add('herb', -1);
            add('stew', 3, true);
            player.gold += 120;
            player.xp.Cooking += 80;
            player.xp.Farming += 40;
            q.step = 2;
            message(
              'Side quest complete: Hearth and Home! +120 coins, 3 Pineholt stews, Cooking and Farming XP.',
              'good',
            );
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
        ['Back', oakridgeInn],
      ],
    );
  showModal(
    'Tamsin',
    'The feast gave Pineholt something it had nearly forgotten: a reason to celebrate.',
    [['Back', oakridgeInn]],
  );
}
function buyInnStew() {
  if (player.gold < 8) return message('You do not have enough coins.', 'bad');
  if (!canAdd('stew')) return message('Your backpack is full.', 'bad');
  player.gold -= 8;
  add('stew');
  message('Tamsin serves you a bowl of Pineholt stew.', 'good');
  renderPanel();
  updateUI();
  oakridgeInn();
}
function restAtInn() {
  if (player.gold < 5) return message('You need 5 coins for a room.', 'bad');
  closeModal();
  combat = null;
  path = [];
  moveSegment = null;
  pending = null;
  skilling = { type: 'innRest', next: tickCount + 5 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 5;
  message('You settle into a warm bed at the Resting Stag.', 'game');
}
function willowElder() {
  const q = player.sideQuests.boarHunt;
  if (q.step === 0)
    return showModal(
      'Elder Willow',
      "Wild boars are tearing through our winter stores — and that is not like them. Boars do not leave good foraging to pick fights with a village. Something out east is pushing them here. Drive back three of them, and see if you can tell me what they are running from.",
      [
        [
          'Begin The Boar Hunt',
          () => {
            q.step = 1;
            q.kills = 0;
            message('Side quest started: The Boar Hunt.', 'game');
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
        ['Woodland blessing - 10 coins', willowBlessing],
        ['Not now', closeModal],
      ],
    );
  if (q.step === 1 && q.kills >= 3)
    return showModal(
      'Elder Willow',
      "The eastern hedge is quiet again — but you were right to look closer. Their hides are streaked with ash that has not blown this far in living memory. Whatever stirs in the Barrow, it is reaching further than Scholar Mira thinks. Take this mantle, woven in Thornwood, with our thanks — and mind that hedge.",
      [
        [
          'Complete quest',
          () => {
            q.step = 2;
            player.gold += 150;
            player.xp.Slayer += 80;
            player.xp.Cooking += 50;
            add('willowMantle', 1, true);
            message(
              'Side quest complete: The Boar Hunt! +150 coins, +80 Slayer XP, +50 Cooking XP.',
              'good',
            );
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
      ],
    );
  if (q.step === 1)
    return showModal(
      'Elder Willow',
      `You have driven back ${q.kills} of 3 wild boars. They roam beyond the eastern hedge.`,
      [
        ['Woodland blessing - 10 coins', willowBlessing],
        ['Continue', closeModal],
      ],
    );
  showModal('Elder Willow', 'Thornwood remembers its friends. The mantle suits you.', [
    ['Woodland blessing - 10 coins', willowBlessing],
    ['Continue', closeModal],
  ]);
}
function scoutVale() {
  const q = player.sideQuests.silkAndCinders;
  if (player.story.q < 2)
    return showModal(
      'Scout Vale',
      'The eastern road is dangerous. Captain Rowan should know when you are ready for frontier work.',
      [['Continue', closeModal]],
    );
  if (q.step === 0)
    return showModal(
      'Scout Vale',
      "Cave spiders have always nested in the Barrow's final vault, past the guarded chambers — but lately they are boiling up angrier than I have ever seen them, like something deeper woke them first. Bring down four of them so I can map a safe route for Mira. Keep the silk; Torren knows a weaver.",
      [
        [
          'Begin Silk and Cinders',
          () => {
            q.step = 1;
            q.kills = 0;
            message('Side quest started: Silk and Cinders.', 'game');
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
        ['Not now', closeModal],
      ],
    );
  if (q.step === 1 && q.kills >= 4)
    return showModal(
      'Scout Vale',
      'The tunnels are quieter, and your silk proves the route. Take this cave-silk robe and these runes for the darkness ahead.',
      [
        [
          'Complete quest',
          () => {
            q.step = 2;
            player.gold += 180;
            player.xp.Magic += 100;
            player.xp.Slayer += 70;
            add('silkRobe', 1, true);
            add('emberRune', 20, true);
            message(
              'Side quest complete: Silk and Cinders! +180 coins, +100 Magic XP, +70 Slayer XP.',
              'good',
            );
            closeModal();
            renderPanel();
            updateUI();
            save();
          },
        ],
      ],
    );
  if (q.step === 1)
    return showModal(
      'Scout Vale',
      'You have defeated ' +
        q.kills +
        ' of 4 cave spiders. You will need to clear the guarded chambers to reach their nest in the final vault.',
      [['Continue', closeModal]],
    );
  showModal(
    'Scout Vale',
    'Your work made the Barrow road safer. Mira still studies the cinders you recovered — though she has said nothing about what woke the spiders in the first place, and I have stopped asking.',
    [['Continue', closeModal]],
  );
}
function willowBlessing() {
  if (player.gold < 10) return message('You need 10 coins for an offering.', 'bad');
  closeModal();
  combat = null;
  skilling = { type: 'willowBlessing', next: tickCount + 4 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 4;
  message('Elder Willow begins the woodland blessing.', 'game');
}
function slayerContract() {
  const c = player.contract;
  if (c && c.remaining === 0) {
    const coins = 40 + c.total * 15,
      xp = c.total * 18;
    player.gold += coins;
    player.xp.Slayer += xp;
    player.contract = null;
    showModal(
      'Contract complete!',
      `Guard Bren pays you ${coins} coins and awards ${xp} Slayer XP.`,
      [['Continue', closeModal]],
    );
    message(`Monster contract complete: +${coins} coins, +${xp} Slayer XP.`, 'good');
    renderPanel();
    updateUI();
    return;
  }
  if (c)
    return showModal(
      'Guard Bren',
      `Your contract is to defeat ${c.total} ${c.name}s. You have ${c.remaining} remaining.`,
      [['Continue', closeModal]],
    );
  const q = player.story.q,
    pool =
      q >= 2
        ? [
            ['goblin', 'Goblin raider'],
            ['wolf', 'Grey wolf'],
            ['bandit', 'Road bandit'],
            ['skeleton', 'Barrow skeleton'],
            ['bat', 'Ash bat'],
            ['spider', 'Cave spider'],
          ]
        : q >= 1
          ? [
              ['goblin', 'Goblin raider'],
              ['wolf', 'Grey wolf'],
              ['boar', 'Wild boar'],
            ]
          : [
              ['rat', 'Giant rat'],
              ['goblin', 'Goblin raider'],
            ],
    pick = pool[Math.floor(Math.random() * pool.length)],
    total = q >= 2 ? 6 : q >= 1 ? 5 : 4;
  showModal(
    'Guard Bren',
    `I have a standing contract for ${total} ${pick[1]}s. It pays coins and Slayer experience.`,
    [
      [
        'Accept contract',
        () => {
          player.contract = { kind: pick[0], name: pick[1], total, remaining: total };
          message(`New contract: defeat ${total} ${pick[1]}s.`, 'game');
          closeModal();
          renderPanel();
          updateUI();
        },
      ],
      ['Not now', closeModal],
    ],
  );
}
function guide() {
  const s = player.story;
  if (s.q === 0 && s.step === 0) {
    s.step = 1;
    showModal(
      'Guide Elowen',
      'Easy, now — you took a hard fall. We found you at the edge of the Vale with no name and no memory, and that same night the old Barrow tablets glowed for the first time in a hundred years. That is not chance, Wanderer. But first things first: you must eat, and learn to defend yourself. Fisher Murphy waits at the western docks — buy a rod and three bait, and I will teach you the rest.',
      [
        [
          'Begin quest',
          () => {
            message('Quest started: A Wanderer in Greenrest.', 'game');
            closeModal();
          },
        ],
      ],
    );
  } else if (s.q === 0 && s.step === 5) {
    s.q = 1;
    s.step = 0;
    player.gold += 100;
    player.xp.Attack += 500;
    player.xp.Fishing += 500;
    player.xp.Cooking += 500;
    showModal(
      'Quest complete!',
      'You learn faster than you should, for someone with no memory. Greenrest Vale welcomes you. Word came down the north road — Captain Rowan of Pineholt has sent for capable hands. Go to him. And Wanderer: whatever you are, I think the land has been waiting for you.',
      [['Continue', closeModal]],
    );
    message('Quest complete: A Wanderer in Greenrest!', 'good');
  } else
    showModal(
      'Guide Elowen',
      s.q === 0 ? QUESTS[0].steps[s.step] : 'Captain Rowan waits in Pineholt, to the north.',
      [['Continue', closeModal]],
    );
}
function rowan() {
  const s = player.story;
  if (s.q < 1)
    return showModal('Captain Rowan', 'Prove yourself to Guide Elowen first.', [
      ['Continue', closeModal],
    ]);
  if (s.q === 1 && s.step === 0) {
    s.step = 1;
    showModal(
      'Captain Rowan',
      'You have the look of someone the Vale sent north — good, I need capable hands. Raiders spill out of the Ashfall Wastes thicker every week. The seals below are weakening, and the wastes bleed their creatures over my walls. My line has kept this watch since the Binding, and I will not be the Rowan who lets it fail. Cull three goblin raiders and bring me their hides, so I know you can hold a blade.',
      [
        [
          'Accept quest',
          () => {
            message('Quest started: Shadows Over Pineholt.', 'game');
            closeModal();
          },
        ],
      ],
    );
  } else if (s.q === 1 && s.step === 2) {
    add('hide', -3);
    s.step = 3;
    showModal(
      'Captain Rowan',
      'These markings... I have only ever seen them in the old Warden records. They are the Ember\'s own brand, seared into whatever crawls too near the buried fire. It is worse than I feared. Take my blade — you have earned it — and ride west to Cinderforge. Find Scholar Mira; she is the last who still reads the Warden lore. If anyone can make sense of you, and of what stirs below, it is her.',
      [
        [
          'Take the blade',
          () => {
            add('steelSword', 1, true);
            player.gold += 120;
            questUpdate();
            closeModal();
          },
        ],
      ],
    );
  } else if (s.q === 3 && s.step === 1 && !player.gambitRumors.includes('rowan')) {
    player.gambitRumors.push('rowan');
    checkGambitRumors();
    showModal(
      'Captain Rowan',
      "My patrols have noticed it too — ash-camp fires out past the old boundary stones, further north than anyone has any business camping. I have not had the hands to spare to go looking. If the King has you on it now, good. Somebody should.",
      [['Continue', closeModal]],
    );
  } else
    showModal(
      'Captain Rowan',
      s.q === 1 ? QUESTS[1].steps[s.step] : 'Pineholt stands because of you, Wanderer.',
      [['Continue', closeModal]],
    );
}
function mira() {
  const s = player.story;
  if (s.q >= 4) return ashenExchange();
  if (s.q === 1 && s.step === 3) {
    s.q = 2;
    s.step = 0;
    showModal(
      'Scholar Mira',
      "So. Rowan sent you. These hides carry the seal-brand of the Bound Ember — I have not seen it fresh in my whole life. Not since Kessa used to chart these marks, before she and I stopped speaking. She always believed the old bargain was a mistake — that the Ember could be drawn out and mastered instead of endlessly held. I hope she has not done something reckless to prove it. And you... the Barrow tablets had not glowed in a hundred years, and they woke the night you arrived at the Vale. The Ember stirs when you are near, Wanderer. I do not think you know what you are — but I am beginning to. Help me below the ruins, and I will tell you everything.",
      [['Continue', closeModal]],
    );
  } else if (s.q === 2 && s.step === 0) {
    s.step = 1;
    showModal(
      'Scholar Mira',
      'Then listen, ember-touched. An age ago a living fire fell from the sky — the Emberfall, the night that named this land. It could not be killed, so the Wardens of Ash bound it beneath the Barrow behind three seals, and the greatest of them gave up death itself to become the Warden at the door. Those seals are failing now. Only a hand of the old blood — your blood — can reach the relic and set them right. But the door is guarded. A Barrow guardian walks the surface ruins, and it carries the seal-key. Defeat it, and take the key.',
      [
        [
          'Accept quest',
          () => {
            message('Quest started: Beneath the Ashen Barrow.', 'game');
            closeModal();
          },
        ],
      ],
    );
  } else if (s.q === 2 && s.step === 4 && invCount('relic')) {
    add('relic', -1);
    s.q = 3;
    s.step = 0;
    player.gold += 300;
    player.xp.Attack += 200;
    showModal(
      'Chapter complete!',
      'You held the relic and the fire did not take you. Do you understand what that means? The Warden knelt — in a thousand years it has knelt to no one. The seals are steadied, for now. But the Ember is patient, and you are only beginning to remember what you are. Rest, Warden. The rest of this will find you soon enough. Take these coins, and my thanks. (+300 coins, +200 Attack XP)',
      [['Continue', closeModal]],
    );
    message('Quest complete: Beneath the Ashen Barrow!', 'good');
  } else
    showModal(
      'Scholar Mira',
      s.q === 2 ? QUESTS[2].steps[s.step] : 'The frontier is quiet - for now.',
      [['Continue', closeModal]],
    );
}
const GAMBIT_ITEM_POOL = ['rawFish', 'copperOre', 'logs', 'cabbage', 'herb', 'hide'];
function checkGambitRumors() {
  const s = player.story;
  if (s.q === 3 && s.step === 1 && player.gambitRumors.length >= 3) {
    s.step = 2;
    questUpdate();
  }
}
function torren() {
  const s = player.story;
  if (s.q === 3 && s.step === 1 && !player.gambitRumors.includes('torren')) {
    player.gambitRumors.push('torren');
    checkGambitRumors();
    return showModal(
      'Torren',
      "Now that you mention it — my ember-rune orders have dried up these past weeks. Not late, gone. Whatever's happening out past Cinderforge, it is choking the whole supply line, not just picking off wagons at random.",
      [['Continue', closeModal]],
    );
  }
  return shop("Torren's Mining Tools", 'smith');
}
function alaric() {
  const s = player.story;
  if (s.q === 3 && s.step === 1 && !player.gambitRumors.includes('alaric')) {
    player.gambitRumors.push('alaric');
    checkGambitRumors();
    return showModal(
      'Alaric',
      "Three caravans behind schedule this month, and not one of the drivers came back to explain why. I have stopped asking the guild about it — they do not know either, and it scares them more than they will say.",
      [['Continue', closeModal]],
    );
  }
  return shop("Alaric's General Store", 'general');
}
function gambitRumorTarget() {
  const remaining = ['torren', 'alaric', 'rowan'].filter((id) => !player.gambitRumors.includes(id));
  return questNpc(remaining[0] || 'yara');
}
function harker() {
  const s = player.story;
  if (s.q === 3 && s.step === 3) {
    if (!player.gambitFetch) {
      const pool = [...GAMBIT_ITEM_POOL],
        picks = [];
      for (let i = 0; i < 3; i++) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
      player.gambitFetch = picks;
    }
    s.step = 4;
    questUpdate();
    const names = player.gambitFetch.map((id) => ITEMS[id].name).join(', ');
    return showModal(
      'Harker',
      `Keep your voice down. You are not one of hers, are you — no, you would not be asking. You want to know what is really going on here? Bring me ${names}. Kessa's people jumped my last supply run and I am not walking back into that wind empty-handed. Do that, and I will tell you everything I have seen.`,
      [['Continue', closeModal]],
    );
  }
  if (s.q === 3 && s.step === 4) {
    const have = player.gambitFetch.every((id) => invCount(id) >= 1);
    if (!have) {
      const names = player.gambitFetch.map((id) => ITEMS[id].name).join(', ');
      return showModal(
        'Harker',
        `Still need all of it: ${names}. I am not moving from this fire until I have it.`,
        [['Continue', closeModal]],
      );
    }
    player.gambitFetch.forEach((id) => add(id, -1));
    s.step = 5;
    questUpdate();
    return showModal(
      'Harker',
      "That's... that's enough. Alright. Kessa keeps to the old surveyor's tent at the heart of camp, past the fire line — but she has Renn walking the perimeter, and Renn does not ask twice before swinging. Go around the north side if you can. Whatever she is pulling out of that ground, it is not finished coming out yet. Watch yourself, Wanderer.",
      [['Continue', closeModal]],
    );
  }
  if (s.q === 3 && s.step > 4)
    return showModal(
      'Harker',
      'I already told you what I know. I am getting out of here the first chance I get — you should think about doing the same.',
      [['Continue', closeModal]],
    );
  return showModal('Harker', NPCS.find((n) => n.id === 'harker').dialogue, [['Continue', closeModal]]);
}
function king() {
  const s = player.story;
  if (s.q < 3)
    return showModal(
      'King Aldric',
      NPCS.find((n) => n.id === 'king').dialogue,
      [['Continue', closeModal]],
    );
  if (s.q === 3 && s.step === 0) {
    s.step = 1;
    showModal(
      'King Aldric',
      "Wanderer. Good — you're the one they say the Warden knelt to. I need eyes I trust. Caravans out of Cinderforge keep vanishing along the northern ash road — not raided, not looted, just gone, wagons and all. My steward Yara has been tracking it longer than I have patience for reports. Find her, then find out what is taking my ore.",
      [
        [
          'Accept quest',
          () => {
            message("Quest started: The Ashwright's Gambit.", 'game');
            closeModal();
          },
        ],
      ],
    );
  } else if (s.q === 3 && s.step === 8) {
    s.q = 4;
    s.step = 0;
    player.gold += 400;
    player.xp.Attack += 250;
    repositionNpc('kessa', KESSA_HOME.x, KESSA_HOME.y);
    showModal(
      'King Aldric',
      'So it was her after all. I am sorry it came to a fight — Kessa was never a fool, whatever else she is. Ash melting into something with a will of its own... that should frighten all of us more than it seems to. You have my thanks, Wanderer, and the realm\'s, though the realm will never know to give it. (+400 coins, +250 Attack XP)',
      [['Continue', closeModal]],
    );
    message("Quest complete: The Ashwright's Gambit!", 'good');
  } else if (s.q === 3) {
    showModal('King Aldric', QUESTS[3].steps[s.step], [['Continue', closeModal]]);
  } else {
    showModal(
      'King Aldric',
      'The realm is quiet, for now. Rest, Wanderer — you have earned it.',
      [['Continue', closeModal]],
    );
  }
}
function yara() {
  const s = player.story;
  if (s.q === 3 && s.step === 2) {
    s.step = 3;
    repositionNpc('kessa', KESSA_CAMP.x, KESSA_CAMP.y);
    showModal(
      'Steward Yara',
      'Every wagon we lost was hauling ember-rune or raw ore, nothing else. The tracks all bend the same direction before they vanish — northwest, deep into the wastes past where anyone patrols. Someone has built a camp out there and I do not think they are hiding from bandits. Watch yourself.',
      [['Continue', closeModal]],
    );
  } else if (s.q === 3 && s.step > 2) {
    showModal(
      'Steward Yara',
      QUESTS[3].steps[s.step],
      [['Continue', closeModal]],
    );
  } else {
    showModal('Steward Yara', NPCS.find((n) => n.id === 'yara').dialogue, [
      ['Continue', closeModal],
    ]);
  }
}
function ashenExchange() {
  const shards = invCount('ashenShard');
  showModal(
    'Scholar Mira - Ashen Studies',
    `The Warden reforms, but each defeat leaves unstable Ashen shards. I can safely exchange them for supplies. You carry ${shards}.`,
    [
      ['3 shards - 25 Ember runes', () => tradeShards(3, 'emberRune', 25)],
      ['5 shards - 3 healing potions', () => tradeShards(5, 'healingPotion', 3)],
      ['8 shards - 250 coins', () => tradeShards(8, null, 250)],
      ['Leave', closeModal],
    ],
  );
}
function tradeShards(cost, item, qty) {
  if (invCount('ashenShard') < cost) return message(`You need ${cost} Ashen shards.`, 'bad');
  if (item && !canAdd(item) && invCount('ashenShard') > cost)
    return message('Your backpack is full.', 'bad');
  add('ashenShard', -cost);
  if (item) add(item, qty);
  else player.gold += qty;
  message(
    `Mira exchanges ${cost} Ashen shards for ${item ? qty + ' ' + ITEMS[item].name : qty + ' coins'}.`,
    'good',
  );
  renderPanel();
  updateUI();
  save();
  ashenExchange();
}
const KESSA_HOME = { x: 117, y: 67 },
  KESSA_CAMP = { x: 18, y: 10 };
function repositionNpc(id, x, y) {
  const n = NPCS.find((v) => v.id === id);
  if (!n) return;
  n.x = n.homeX = n.drawX = n.fromX = x;
  n.y = n.homeY = n.drawY = n.fromY = y;
}
function kessa() {
  const s = player.story;
  // Chapter Two: the camp confrontation takes priority once the quest reaches that step.
  // Both response options are flavor-only — they converge on the exact same next step
  // (the Unbound Construct fight), never a different outcome.
  if (s.q === 3 && s.step === 6) {
    return showModal(
      'Kessa the Ashwright',
      "So the King sent you after all. I am close, Wanderer — closer than I have ever been. The Ember bends if you ask it right instead of just burying it. I did not expect an audience, but I will not stop for one either.",
      [
        ['"This ends here."', () => kessaCampResolve('defiant')],
        ['"Let me see it work."', () => kessaCampResolve('curious')],
      ],
    );
  }
  if (s.q === 3 && s.step > 6) {
    return showModal(
      'Kessa the Ashwright',
      'It is done, Wanderer. Whatever happens next is not in my hands anymore.',
      [['Leave', closeModal]],
    );
  }
  if (player.story.q < 3)
    return showModal(
      'Kessa',
      "I have no patience for wanderers today. Come back when you have actually done something.",
      [['Leave', closeModal]],
    );
  if (!player.kessaConfronted)
    return showModal(
      'Kessa the Ashwright',
      "So the old fool sent a wanderer to do a Warden's work. I watched you carry that relic out of the ground, ember-touched — and I watched the Warden kneel to you. Do you understand what you are holding? Not a key. A leash. Mira will have you carry it straight back into its socket and call that victory — three more lives spent keeping a fire nobody has the courage to actually put out. I have spent nine years learning to draw the Ember's heat out safely, piece by piece. Give it to me, and no one else has to become what that thing in the Barrow became.",
      [
        ['"This is not your call to make."', () => kessaResolve('defiant')],
        ['"Convince me."', () => kessaResolve('heard')],
      ],
    );
  showModal(
    'Kessa',
    'Watch yourself down there, Wanderer. The ground remembers who it swallowed.',
    [['Leave', closeModal]],
  );
}
function kessaResolve(mode) {
  player.kessaConfronted = true;
  const text =
    mode === 'defiant'
      ? 'Kessa\'s jaw tightens. "Predictable." She reaches for the relic anyway — and it sears her palm the instant her fingers close, exactly as the old tablets warned. She recoils, furious more at herself than at you. "Of course. Warden blood only. Fine — keep your leash, Wanderer. This is not finished."'
      : 'She listens. For a moment you almost believe her — and then she reaches for the relic anyway, certain it will simply answer to conviction instead of blood. It burns her the instant she touches it. She snatches her hand back, shaking. "...I see. Blood, then. Not resolve." She studies you a moment longer, unreadable. "This is not finished, Wanderer. Not by half."';
  showModal('Kessa the Ashwright', text, [['Continue', closeModal]]);
  message('Kessa vows this is not over.', 'bad');
  renderPanel();
  save();
}
function kessaCampResolve(mode) {
  player.story.step = 7;
  const text =
    mode === 'defiant'
      ? 'Kessa\'s expression hardens. "Then we are done talking." She turns back to the ritual circle anyway, hands already moving through the working — and the ground between you begins to glow, then crack, then rise.'
      : 'She almost smiles. "Then watch." She turns back to the ritual circle, certain, unhurried — and the ground between you begins to glow, then crack, then rise.';
  showModal('Kessa the Ashwright', text, [['Continue', closeModal]]);
  message('The extraction tears loose — something is waking up.', 'bad');
  questUpdate();
}
function pell() {
  const lines = [
    "Are you really the one they found at the edge of the Vale? With no memory and everything? That is... that is like the old stories.",
    'Captain Rowan sent for you by name — I heard the runners talking. Nobody sends for a nobody.',
    'You went into the Barrow. You actually went in. I do not think anyone in Pineholt has slept right since they heard.',
    'They are saying the Warden knelt to you. I do not — I do not really know what to say to that. Just... be careful, Wanderer. Whatever is coming next, I hope it is not alone.',
    'A construct made of ash and old fire, and you walked out the other side of it. Kessa is still out there somewhere, is not she. I do not think this is finished either — but I know who I am rooting for.',
  ];
  showModal('Pell', lines[Math.min(player.story.q, lines.length - 1)], [['Continue', closeModal]]);
}
function questUpdate() {
  message('Quest updated: ' + currentObjective(), 'game');
  renderPanel();
}
// ---- Starter training quests: teach each skill group, reward coins + skill XP ----
const STARTER_QUESTS = [
  {
    id: 'lineHearth',
    name: 'Line & Hearth',
    group: 'Fishing · Cooking',
    blurb:
      'Fish the ripples off the Greenrest docks (rod + bait), then cook your catch on a fire or range.',
    objectives: [
      { key: 'fish', label: 'Catch fish at the docks', goal: 5 },
      { key: 'cook', label: 'Cook raw fish or meat', goal: 5 },
    ],
    reward: { gold: 60, xp: { Fishing: 200, Cooking: 200 } },
  },
  {
    id: 'timberFlame',
    name: 'Timber & Flame',
    group: 'Woodcutting · Firemaking',
    blurb: 'Chop logs from the trees around Greenrest Vale, then light them with a tinderbox.',
    objectives: [
      { key: 'chop', label: 'Chop logs from trees', goal: 5 },
      { key: 'fire', label: 'Light fires with a tinderbox', goal: 3 },
    ],
    reward: { gold: 60, xp: { Woodcutting: 200, Firemaking: 160 } },
  },
  {
    id: 'stoneSteel',
    name: 'Stone & Steel',
    group: 'Mining · Smithing',
    blurb: 'Mine copper and iron from the rocks, then smith them into bars and gear at the forge.',
    objectives: [
      { key: 'mine', label: 'Mine ore from rocks', goal: 5 },
      { key: 'smith', label: 'Smith bars or gear at the forge', goal: 3 },
    ],
    reward: { gold: 70, xp: { Mining: 200, Smithing: 200 } },
  },
  {
    id: 'bladeBulwark',
    name: 'Blade & Bulwark',
    group: 'Attack · Strength · Defence',
    blurb:
      'Draw a weapon and defeat foes near Greenrest Vale. Swap combat styles in the Gear tab to train each melee skill.',
    objectives: [{ key: 'kill', label: 'Defeat enemies in combat', goal: 6 }],
    reward: { gold: 70, xp: { Attack: 150, Strength: 150, Defence: 150, Hitpoints: 80 } },
  },
  {
    id: 'sparkSpirit',
    name: 'Spark & Spirit',
    group: 'Magic · Prayer',
    blurb: 'Equip an ember staff and cast spells in battle, then bury the bones your foes drop.',
    objectives: [
      { key: 'cast', label: 'Cast combat spells', goal: 5 },
      { key: 'bury', label: 'Bury bones', goal: 3 },
    ],
    reward: { gold: 70, xp: { Magic: 200, Prayer: 150 } },
  },
  {
    id: 'rootRemedy',
    name: 'Root & Remedy',
    group: 'Farming · Herblore',
    blurb: 'Plant and harvest crops at the Greenrest farm patch, then brew them into potions.',
    objectives: [
      { key: 'farm', label: 'Harvest crops from patches', goal: 3 },
      { key: 'pot', label: 'Brew potions', goal: 2 },
    ],
    reward: { gold: 70, xp: { Farming: 150, Herblore: 200 } },
  },
];
function starterProgress(o) {
  return Math.min(o.goal, player.tally[o.key] || 0);
}
function starterDone(q) {
  return q.objectives.every((o) => starterProgress(o) >= o.goal);
}
function tally(type, n = 1) {
  player.tally[type] = (player.tally[type] || 0) + n;
  // Never let a training-quest hiccup interrupt the core skill action that called us.
  try {
    checkStarterQuests();
  } catch (e) {
    console.warn('starter quest check failed', e);
  }
}
function checkStarterQuests() {
  for (const q of STARTER_QUESTS) {
    if (player.starterClaimed[q.id] || !starterDone(q)) continue;
    player.starterClaimed[q.id] = true;
    player.gold += q.reward.gold;
    const parts = [];
    for (const [sk, amt] of Object.entries(q.reward.xp)) {
      player.xp[sk] += amt;
      parts.push(`${amt} ${sk}`);
    }
    if (window.SFX) SFX.play('level');
    message(
      `Training quest complete: ${q.name}! +${q.reward.gold} coins and ${parts.join(', ')} XP.`,
      'good',
    );
    renderPanel();
    updateUI();
    save();
  }
}
function questNpc(id) {
  const n = NPCS.find((v) => v.id === id);
  return n ? { x: n.drawX, y: n.drawY, label: n.name, layer: 'surface' } : null;
}
function questEnemy(kind, label, surfaceOnly) {
  const pool = monsters
      .filter((m) => m.kind === kind && (!surfaceOnly || !inDungeon(m.x, m.y)))
      .sort((a, b) => tileDistance(player, a) - tileDistance(player, b)),
    m = pool.find((m) => m.alive) || pool[0];
  return m
    ? { x: m.drawX, y: m.drawY, label, layer: inDungeon(m.x, m.y) ? 'dungeon' : 'surface' }
    : null;
}
const SIDE_QUEST_KEYS = ['boarHunt', 'silkAndCinders', 'brokenRoad', 'hearthAndHome', 'cureMirehaven'];
const SIDE_QUEST_NAMES = {
  boarHunt: 'The Boar Hunt',
  silkAndCinders: 'Silk and Cinders',
  brokenRoad: 'The Broken Road',
  hearthAndHome: 'Hearth and Home',
  cureMirehaven: 'A Cure for Sablemarsh',
};
// Single source of truth for "objective met, go turn it in" — shared by the compass
// priority check and by sideQuestTarget's own step-1 branch below.
function sideQuestReady(key) {
  const q = player.sideQuests[key];
  if (!q || q.step !== 1) return false;
  if (key === 'boarHunt') return q.kills >= 3;
  if (key === 'silkAndCinders') return q.kills >= 4;
  if (key === 'brokenRoad') return q.kills >= 4;
  if (key === 'hearthAndHome') return !!(invCount('rawMeat') && invCount('cabbage') && invCount('herb'));
  if (key === 'cureMirehaven') return invCount('bogMoss') >= 4;
  return false;
}
// Resolves the compass target for one specific side quest at whatever state it's in
// (not yet started, mid-objective, or ready to turn in). Returns null if the quest is
// locked (prerequisite unmet) or already complete — nothing sensible to point at.
function sideQuestTarget(key) {
  const q = player.sideQuests[key];
  if (!q) return null;
  const ready = sideQuestReady(key);
  if (key === 'boarHunt') {
    if (q.step === 0) return questNpc('willow');
    if (q.step === 1) return ready ? questNpc('willow') : questEnemy('boar', 'Wild boar');
  } else if (key === 'silkAndCinders') {
    if (player.story.q < 2) return null;
    if (q.step === 0) return questNpc('vale');
    if (q.step === 1)
      return ready
        ? questNpc('vale')
        : inDungeon(player.x, player.y)
          ? questEnemy('spider', 'Cave spider')
          : { x: 9, y: 64, label: 'Ashen Barrow entrance', layer: 'surface' };
  } else if (key === 'brokenRoad') {
    if (player.story.q < 1) return null;
    if (q.step === 0) return questNpc('mara');
    if (q.step === 1) return ready ? questNpc('mara') : questEnemy('bandit', 'Road bandit');
  } else if (key === 'hearthAndHome') {
    if (player.story.q < 1) return null;
    if (q.step === 0) return questNpc('tamsin');
    if (q.step === 1) {
      if (ready) return questNpc('tamsin');
      if (!invCount('rawMeat')) return questEnemy('boar', 'Wild boar');
      if (!invCount('cabbage'))
        return invCount('cabbageSeed')
          ? { x: 92, y: 140, label: 'Greenrest farm patch', layer: 'surface' }
          : questNpc('alaric');
      return questEnemy('goblin', 'Goblin raider');
    }
  } else if (key === 'cureMirehaven') {
    if (player.story.q < 1) return null;
    if (q.step === 0) return questNpc('sable');
    if (q.step === 1) return ready ? questNpc('sable') : questEnemy('bogling', 'Bogling');
  }
  return null;
}
function activeQuestTarget() {
  const s = player.story,
    pin = player.activeQuestKey;
  // A quest pinned from the Journal always wins — lets the player choose what the
  // compass follows instead of the automatic priority below.
  if (pin && SIDE_QUEST_KEYS.includes(pin)) {
    const t = sideQuestTarget(pin);
    if (t) return t;
    // Pinned quest just finished (or its prerequisite regressed) — fall through below.
  } else if (!pin) {
    for (const key of SIDE_QUEST_KEYS) if (sideQuestReady(key)) return sideQuestTarget(key);
  }
  // pin === 'main', or nothing pinned/ready above: show the current main-story step.
  if (s.q === 0)
    return (
      [
        questNpc('elowen'),
        questNpc('murphy'),
        { x: 147, y: 87, label: 'Fishing spot', layer: 'surface' },
        { x: 161, y: 35, label: 'Cooking range', layer: 'surface' },
        questEnemy('goblin', 'Goblin raider'),
        questNpc('elowen'),
      ][s.step] || null
    );
  if (s.q === 1)
    return (
      [questNpc('rowan'), questEnemy('goblin', 'Goblin raider'), questNpc('rowan'), questNpc('mira')][
        s.step
      ] || null
    );
  if (s.q === 2)
    return (
      [
        questNpc('mira'),
        questEnemy('guardian', 'Barrow guardian', true),
        { x: 9, y: 64, label: 'Ashen Barrow entrance', layer: 'surface' },
        inDungeon(player.x, player.y)
          ? questEnemy('warden', 'Ashen Warden')
          : { x: 9, y: 64, label: 'Ashen Barrow entrance', layer: 'surface' },
        questNpc('mira'),
      ][s.step] || null
    );
  if (s.q === 3)
    return (
      [
        questNpc('king'),
        gambitRumorTarget(),
        questNpc('yara'),
        questNpc('harker'),
        questNpc('harker'),
        questEnemy('ashwrightRenn', 'Ashwright Renn'),
        questNpc('kessa'),
        questEnemy('unboundConstruct', 'Unbound Construct'),
        questNpc('king'),
      ][s.step] || null
    );
  // Fallback: still-hunting guidance for an active side quest, once the main story is
  // fully done and nothing above has a target.
  for (const key of SIDE_QUEST_KEYS) {
    const t = sideQuestTarget(key);
    if (t) return t;
  }
  const id = questNpcId();
  return id ? questNpc(id) : null;
}
function setActiveQuest(key) {
  player.activeQuestKey = player.activeQuestKey === key ? null : key;
  message(
    player.activeQuestKey
      ? `Active quest set: ${key === 'main' ? currentObjective() : SIDE_QUEST_NAMES[key]}.`
      : 'Active quest cleared — following the default priority.',
    'game',
  );
  renderPanel();
  save();
}
function currentObjective() {
  const s = player.story;
  return s.q >= QUESTS.length ? 'Chapter One complete' : QUESTS[s.q].steps[s.step];
}
function usePortal(p) {
  const s = player.story;
  const isEntrance = p.label === 'Enter Ashen Barrow';
  const isExit = p.label === 'Climb to surface';
  if (isEntrance && (s.q < 2 || (s.q === 2 && s.step < 2)))
    return message('The barrow door is sealed. Scholar Mira knows more.', 'bad');
  if (isEntrance && s.q === 2 && s.step === 2) {
    add('key', -1);
    s.step = 3;
    questUpdate();
  }
  if (isEntrance) {
    const warden = monsters.find((m) => m.kind === 'warden');
    if (warden?.alive && !barrowChestReady() && !player.barrowRunStartedAt) {
      player.barrowRunStartedAt = Date.now();
      player.barrowPotential = 0;
      resetBarrowRun();
      message('Ashen Barrow run started.', 'game');
    }
  } else if (isExit && player.barrowRunStartedAt) {
    player.barrowRunStartedAt = 0;
    player.barrowPotential = 0;
    resetBarrowRun();
    message('Ashen Barrow run abandoned.', 'bad');
  }
  player.x = p.toX;
  player.y = p.toY;
  player.drawX = p.toX;
  player.drawY = p.toY;
  path = [];
  moveSegment = null;
  destination = null;
  message(p.label + '.', 'game');
  checkRegion();
  save();
}
function barrowChestReady() {
  return (player.killLog.warden || 0) > player.wardenKillsClaimed;
}
function openDungeonChest() {
  const warden = monsters.find((m) => m.kind === 'warden');
  if (warden && warden.alive)
    return message('A dark force seals the chest. Defeat the Ashen Warden.', 'bad');
  if (!barrowChestReady())
    return message('The Warden chest is dormant. Defeat the Ashen Warden to awaken it.', 'game');
  player.wardenKillsClaimed = player.killLog.warden || 0;
  player.barrowRuns++;
  const potential = player.barrowPotential || 0;
  player.barrowBestPotential = Math.max(player.barrowBestPotential || 0, potential);
  if (player.barrowRunStartedAt) {
    player.barrowLastMs = Date.now() - player.barrowRunStartedAt;
    if (!player.barrowBestMs || player.barrowLastMs < player.barrowBestMs) {
      player.barrowBestMs = player.barrowLastMs;
      message(`New Barrow personal best: ${formatRunTime(player.barrowBestMs)}!`, 'good');
    } else message(`Barrow clear time: ${formatRunTime(player.barrowLastMs)}.`, 'game');
    player.barrowRunStartedAt = 0;
  }
  if (!player.chestLooted) {
    player.chestLooted = true;
    player.gold += 100;
    add('spiderSilk', 3, true);
    add('wardenCloak', 1, true);
    player.collection.barrow.cloak = true;
    message('First Barrow clear! You find 100 coins, 3 cave silk, and the Warden cloak.', 'good');
  } else {
    const coins = 45 + Math.floor(Math.random() * 56) + Math.floor(potential * 0.8),
      runes = 4 + Math.floor(Math.random() * 9) + Math.floor(potential / 20),
      silk = 1 + Math.floor(Math.random() * 3) + Math.floor(potential / 35),
      shards = Math.random() < Math.min(0.85, 0.2 + potential / 150) ? 1 : 0;
    player.gold += coins;
    add('emberRune', runes, true);
    add('spiderSilk', silk, true);
    if (shards) add('ashenShard', shards, true);
    const uniqueRoll = Math.random(),
      guardChance = 0.02 + potential * 0.0008,
      lanternChance = 0.04 + potential * 0.001;
    let unique = '';
    if (uniqueRoll < guardChance) {
      add('ashenGuard', 1, true);
      player.collection.barrow.guard = true;
      unique = ' You also discover the rare Ashen guard!';
    } else if (uniqueRoll < guardChance + lanternChance) {
      add('barrowLantern', 1, true);
      player.collection.barrow.lantern = true;
      unique = ' You also discover a Barrow lantern!';
    }
    message(
      `Barrow run ${player.barrowRuns} complete! ${coins} coins, ${runes} Ember runes, ${silk} cave silk${shards ? ' and an Ashen shard' : ''} at ${potential}% potential.${unique}`,
      'good',
    );
  }
  player.barrowPotential = 0;
  resetBarrowRun();
  const surfacePortal = PORTALS.find((p) => p.label === 'Enter Ashen Barrow');
  if (surfacePortal) {
    player.x = surfacePortal.x;
    player.y = surfacePortal.y;
    player.drawX = surfacePortal.x;
    player.drawY = surfacePortal.y;
    path = [];
    moveSegment = null;
    destination = null;
    camera.ready = false;
    message('The chest\'s light carries you back to the surface.', 'game');
    checkRegion();
  }
  renderPanel();
  updateUI();
  save();
}
let shopAmount = 1,
  currentShop = null;
function shop(title, id) {
  currentShop = { title, id };
  const stock = SHOPS[id],
    saleable = Object.entries(player.inv).filter(([item, q]) => q > 0 && (ITEMS[item].value || 0) > 0),
    qbar = [
      [1, '1'],
      [5, '5'],
      [10, '10'],
      ['x', 'X'],
    ]
      .map(
        ([v, label]) =>
          `<button class="qbtn ${shopAmount === v ? 'on' : ''}" data-sq="${v}">${label}</button>`,
      )
      .join(''),
    buyGrid = stock
      .map(
        ([item, price]) =>
          `<div class="slot bankslot" data-buy="${item}" title="${ITEMS[item].name} — ${price} coins each"><img class="ic" src="assets/items/${item}.png" alt="" draggable="false"><span class="shopPrice">${price}gp</span></div>`,
      )
      .join(''),
    sellGrid = saleable.length
      ? saleable
          .map(([item, q]) => {
            const unit = Math.max(1, Math.floor(ITEMS[item].value * 0.6));
            return `<div class="slot bankslot" data-sell="${item}" title="${ITEMS[item].name} x${q} — ${unit} coins each"><img class="ic" src="assets/items/${item}.png" alt="" draggable="false"><span class="shopPrice">${unit}gp</span></div>`;
          })
          .join('')
      : '<p class="hint" style="grid-column:1/-1;margin:6px 2px">Nothing worth selling.</p>';
  modalBody.innerHTML =
    `<h2>${title}</h2>` +
    `<div class="bankBar"><span class="hint">Quantity</span>${qbar}<span class="hint bankMeta">You have ${player.gold} coins</span></div>` +
    `<div class="bankSection">For sale — click to buy</div><div class="bankGrid">${buyGrid}</div>` +
    `<div class="bankSection">Your backpack — click to sell</div><div class="bankGrid">${sellGrid}</div>` +
    `<div class="bankActions"><button class="choice" data-act="close">Close</button></div>`;
  modal.classList.remove('hidden');
  modalBody
    .querySelectorAll('[data-sq]')
    .forEach((b) => (b.onclick = () => setShopAmount(b.dataset.sq === 'x' ? 'x' : +b.dataset.sq)));
  modalBody.querySelectorAll('[data-buy]').forEach((s) => {
    const price = stock.find(([it]) => it === s.dataset.buy)[1];
    s.onclick = () => buyQty(s.dataset.buy, price);
  });
  modalBody
    .querySelectorAll('[data-sell]')
    .forEach(
      (s) =>
        (s.onclick = () => sellItem(s.dataset.sell, Math.min(shopAmount, invCount(s.dataset.sell)), title, id)),
    );
  modalBody.querySelector('[data-act="close"]').onclick = closeModal;
}
function setShopAmount(amount) {
  if (amount === 'x') {
    const n = parseInt(prompt('Enter amount:', '10'), 10);
    if (!n || n < 1) return;
    shopAmount = n;
  } else shopAmount = amount;
  if (currentShop) shop(currentShop.title, currentShop.id);
}
function buyOne(id, price) {
  if (player.gold < price || !canAdd(id)) return false;
  player.gold -= price;
  add(id);
  if (player.story.q === 0 && player.story.step === 1 && invCount('rod') && invCount('bait') >= 3) {
    player.story.step = 2;
    questUpdate();
  }
  return true;
}
function buy(id, price) {
  if (!buyOne(id, price))
    return message(
      player.gold < price ? 'You do not have enough coins.' : 'Your backpack is full.',
      'bad',
    );
  message(`You buy ${ITEMS[id].name}.`, 'good');
  renderPanel();
}
function buyQty(id, price) {
  let n = 0;
  while (n < shopAmount && buyOne(id, price)) n++;
  if (n) {
    message(`You buy ${n} ${ITEMS[id].name}${n > 1 ? 's' : ''}.`, 'good');
    renderPanel();
  } else
    message(player.gold < price ? 'You do not have enough coins.' : 'Your backpack is full.', 'bad');
  if (currentShop) shop(currentShop.title, currentShop.id);
}
function sellItem(id, q, title, shopId) {
  const price = Math.max(1, Math.floor(ITEMS[id].value * 0.6)) * q;
  add(id, -q);
  player.gold += price;
  if (window.SFX) SFX.play('coins');
  message(`You sell ${q} ${ITEMS[id].name} for ${price} coins.`, 'good');
  renderPanel();
  shop(title, shopId);
}
function bankQty(available) {
  return bankAmount === 'all' ? available : Math.min(bankAmount, available);
}
function setBankAmount(amount) {
  if (amount === 'x') {
    const n = parseInt(prompt('Enter amount to transfer:', '100'), 10);
    if (!n || n < 1) return;
    bankAmount = n;
  } else bankAmount = amount;
  bank();
}
function bankSlot(id, q, kind) {
  return `<div class="slot bankslot" data-${kind}="${id}" title="${ITEMS[id].name} x${q}"><img class="ic" src="assets/items/${id}.png" alt="" draggable="false"><span>${q}</span></div>`;
}
function bank() {
  const invEntries = Object.entries(player.inv),
    bankEntries = Object.entries(player.bank)
      .filter(([, q]) => q > 0)
      .sort((a, b) => (ITEMS[a[0]].name < ITEMS[b[0]].name ? -1 : 1));
  const amounts = [
    [1, '1'],
    [5, '5'],
    [10, '10'],
    ['all', 'All'],
    ['x', 'X'],
  ];
  const qbar = amounts
    .map(
      ([v, label]) => `<button class="qbtn ${bankAmount === v ? 'on' : ''}" data-q="${v}">${label}</button>`,
    )
    .join('');
  const bankGrid = bankEntries.length
    ? bankEntries.map(([id, q]) => bankSlot(id, q, 'w')).join('')
    : '<p class="hint" style="grid-column:1/-1;margin:6px 2px">Your bank is empty.</p>';
  const invGrid = invEntries.length
    ? invEntries.map(([id, q]) => bankSlot(id, q, 'd')).join('')
    : '<p class="hint" style="grid-column:1/-1;margin:6px 2px">Your backpack is empty.</p>';
  modalBody.innerHTML =
    `<h2>Bank of Emberfall</h2>` +
    `<div class="bankBar"><span class="hint">Quantity</span>${qbar}<span class="hint bankMeta">Bank ${bankEntries.length} · Pack ${invEntries.length}/${INVENTORY_SLOTS}</span></div>` +
    `<div class="bankSection">Bank — click an item to withdraw</div><div class="bankGrid">${bankGrid}</div>` +
    `<div class="bankSection">Backpack — click an item to deposit</div><div class="bankGrid">${invGrid}</div>` +
    `<div class="bankActions"><button class="choice" data-act="depositAll">Deposit backpack</button><button class="choice" data-act="close">Close</button></div>`;
  modal.classList.remove('hidden');
  modalBody
    .querySelectorAll('[data-q]')
    .forEach(
      (b) =>
        (b.onclick = () =>
          setBankAmount(b.dataset.q === 'all' || b.dataset.q === 'x' ? b.dataset.q : +b.dataset.q)),
    );
  modalBody
    .querySelectorAll('[data-w]')
    .forEach((s) => (s.onclick = () => withdraw(s.dataset.w, bankQty(player.bank[s.dataset.w] || 0))));
  modalBody
    .querySelectorAll('[data-d]')
    .forEach((s) => (s.onclick = () => deposit(s.dataset.d, bankQty(invCount(s.dataset.d)))));
  modalBody.querySelector('[data-act="depositAll"]').onclick = depositAll;
  modalBody.querySelector('[data-act="close"]').onclick = closeModal;
}
function deposit(id, q) {
  q = Math.min(q, invCount(id));
  if (!q) return bank();
  add(id, -q);
  player.bank[id] = (player.bank[id] || 0) + q;
  message(`You deposit ${q} ${ITEMS[id].name}.`);
  renderPanel();
  bank();
}
function withdraw(id, q) {
  q = Math.min(q, player.bank[id] || 0);
  if (!q) return bank();
  if (!canAdd(id)) return message('Your backpack is full.', 'bad');
  player.bank[id] -= q;
  if (player.bank[id] <= 0) delete player.bank[id];
  add(id, q);
  message(`You withdraw ${q} ${ITEMS[id].name}.`);
  renderPanel();
  bank();
}
function depositAll() {
  for (const [id, q] of Object.entries(player.inv)) {
    player.bank[id] = (player.bank[id] || 0) + q;
  }
  player.inv = {};
  message('You deposit your carried items.');
  renderPanel();
  bank();
}
function relocateFishSpot(spot) {
  // EF1: move the ripple to a nearby water tile that still borders a walkable dock/shore
  const cands = [];
  for (let dy = -3; dy <= 3; dy++)
    for (let dx = -3; dx <= 3; dx++) {
      const x = spot.x + dx,
        y = spot.y + dy;
      if ((x === spot.x && y === spot.y) || (tiles[y] && tiles[y][x]) !== 2) continue;
      const reachable = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([ax, ay]) => walkable(x + ax, y + ay));
      if (reachable) cands.push({ x, y });
    }
  if (cands.length) {
    const p = cands[Math.floor(Math.random() * cands.length)];
    spot.x = p.x;
    spot.y = p.y;
  }
  spot.movesAt = tickCount + 100;
}
function fish(spot = FISH_SPOTS[0]) {
  if (skilling && skilling.type === 'fish' && skilling.spot === spot) return; // EF1: already fishing here; ignore re-clicks
  if (level('Fishing') < spot.level)
    return message(`You need Fishing level ${spot.level} to catch ${spot.catchName}.`, 'bad');
  if (!invCount('rod') || !invCount('bait'))
    return message('You need a rod and bait. Murphy sells them.', 'bad');
  if (!canAdd(spot.item)) return message('Your backpack is full.', 'bad');
  combat = null;
  skilling = { type: 'fish', spot, next: tickCount + 3 };
  if (!spot.movesAt) spot.movesAt = tickCount + 100; // EF1: spot relocates after ~1 min of fishing
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 3;
  message(`You cast your line for ${spot.catchName}.`, 'game');
}
function rawFoodId() {
  return invCount('rawEel')
    ? 'rawEel'
    : invCount('rawFish')
      ? 'rawFish'
      : invCount('rawMeat')
        ? 'rawMeat'
        : invCount('rabbitMeat')
          ? 'rabbitMeat'
          : null;
}
function cook(spot) {
  if (skilling && skilling.type === 'cook') return; // EF1: already cooking; ignore re-clicks
  if (!rawFoodId()) return message('You have nothing suitable to cook.', 'bad');
  combat = null;
  skilling = { type: 'cook', spot: spot && spot.x !== undefined ? spot : null, next: tickCount + 2 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 2;
  message('You start cooking by the fire.', 'game');
}
function hasPickaxe() {
  return invCount('ironPickaxe') || invCount('pickaxe');
}
function startHunt(spot) {
  if (!invCount('snare')) return message('You need a wooden snare. Hunter Orin sells them.', 'bad');
  if (level('Hunter') < spot.level) return message(`You need Hunter level ${spot.level}.`, 'bad');
  const needed = ['rabbitMeat', 'rabbitFur'].filter((id) => !invCount(id)).length;
  if (Object.keys(player.inv).length + needed > INVENTORY_SLOTS)
    return message('You need two free backpack slots for a catch.', 'bad');
  combat = null;
  skilling = { type: 'hunt', spot, next: tickCount + 4 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 4;
  message('You set the snare and wait by the burrow...', 'game');
}
function startPickpocket(n) {
  if (!n.pickpocket) return message('They are watching you too closely.', 'bad');
  if (tickCount < n.pickpocketUntil)
    return message(`${n.name} is still alert after the last attempt.`, 'bad');
  combat = null;
  skilling = { type: 'pickpocket', npc: n, next: tickCount + 3 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 3;
  message(`You attempt to pick ${n.name}'s pocket...`, 'game');
}
function startMining(rock) {
  if (skilling && skilling.type === 'mine' && skilling.rock === rock) return; // EF1: no spam-clicking
  if (rock.depletedUntil) return message('The rock is depleted. Give it a moment.', 'game');
  if (!hasPickaxe())
    return message('You need a pickaxe. Torren sells them at Cinderforge.', 'bad');
  if (level('Mining') < rock.level)
    return message(`You need Mining level ${rock.level} for this rock.`, 'bad');
  combat = null;
  skilling = { type: 'mine', rock, next: tickCount + 1 };
  message(`You swing your pickaxe at the ${rock.name.toLowerCase()}.`, 'game');
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 3;
}
function startChop(tree) {
  if (skilling && skilling.type === 'chop' && skilling.tree === tree) return; // EF1: no spam-clicking
  if (!invCount('hatchet')) return message('You need a hatchet. Alaric sells them.', 'bad');
  if (level('Woodcutting') < tree.level)
    return message(`You need Woodcutting level ${tree.level}.`, 'bad');
  combat = null;
  skilling = { type: 'chop', tree, next: tickCount + 1 };
  message(`You swing your hatchet at the ${tree.name.toLowerCase()}.`, 'game');
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 4;
}
function lightFire() {
  if (!invCount('tinderbox')) return message('You need a tinderbox. Alaric sells them.', 'bad');
  if (!invCount('logs')) return message('You have no logs to burn.', 'bad');
  const spot = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]
    .map(([dx, dy]) => ({ x: player.x + dx, y: player.y + dy }))
    .find(
      (p) =>
        walkable(p.x, p.y) &&
        !fires.some((f) => f.x === p.x && f.y === p.y) &&
        !NPCS.some((n) => n.x === p.x && n.y === p.y),
    );
  if (!spot) return message('There is no room to light a fire here.', 'bad');
  combat = null;
  skilling = { type: 'fire', spot, next: tickCount + 2 };
  lastActionAt = performance.now();
  actionDuration = TICK_MS * 2;
  message('You begin arranging the logs.', 'game');
}
function resourceTick() {
  if (player.grave && Date.now() >= player.grave.expiresAt) bankGrave();
  fires = fires.filter((f) => f.expires > tickCount);
  drops = drops.filter((d) => !d.despawn || d.despawn > tickCount);
  for (const t of TREES)
    if (t.depletedUntil && tickCount >= t.depletedUntil) {
      if (player.x === t.x && player.y === t.y) {
        t.depletedUntil++;
        continue;
      }
      t.depletedUntil = 0;
      t.chops = 0;
      tiles[t.y][t.x] = 3;
    }
  for (const r of ROCKS)
    if (r.depletedUntil && tickCount >= r.depletedUntil) {
      r.depletedUntil = 0;
      r.mined = 0;
    }
}
