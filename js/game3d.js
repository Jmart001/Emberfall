"use strict";
// ============================================================
// game3d.js — Emberfall economy + skilling for the 3D town.
// Reuses ITEMS / TIERS / SHOPS / lvlOf / xpForLevel / clamp / rnd
// from data.js. Pure state + HTML UI + interaction handlers that the
// 3D world (location3d.js) calls. No canvas / no combat.
// ============================================================

const Game = (function () {
  const SAVE = 'emberfall3d_save_v1';
  const state = {
    inv: { coins: 50 },
    xp: { fish: 0, cook: 0, mine: 0, smith: 0, hp: 0 },
    bank: {},
  };
  let action = null;     // ongoing gather: { kind, tier?, next }
  let vendor = null;     // open shop id, 'bank', or null
  let tab = 'inv';

  // ---------- helpers ----------
  const lvl = sk => (typeof lvlOf === 'function' ? lvlOf(state.xp[sk] || 0) : 1);
  const el = id => document.getElementById(id);
  function msg(t, c) {
    const box = el('chat'); if (!box) return;
    const d = document.createElement('div'); d.textContent = t; if (c) d.style.color = c;
    box.appendChild(d); while (box.children.length > 40) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
  }
  function addItem(id, q) { state.inv[id] = (state.inv[id] || 0) + q; render(); }
  function removeItem(id, q) { if ((state.inv[id] || 0) < q) return false; state.inv[id] -= q; if (state.inv[id] <= 0) delete state.inv[id]; render(); return true; }
  function grantXp(sk, amt) {
    const before = lvl(sk); state.xp[sk] = (state.xp[sk] || 0) + amt; const after = lvl(sk);
    if (after > before) msg('🎉 Your ' + NAME[sk] + ' level is now ' + after + '!', '#ffd23f');
    renderStats();
  }
  const NAME = { fish: 'Fishing', cook: 'Cooking', mine: 'Mining', smith: 'Smithing', hp: 'Hitpoints' };

  // ---------- persistence ----------
  function save() { try { localStorage.setItem(SAVE, JSON.stringify(state)); } catch (e) {} }
  function load() { try { const s = JSON.parse(localStorage.getItem(SAVE)); if (s) { Object.assign(state.inv, {}, s.inv || { coins: 50 }); state.inv = s.inv || { coins: 50 }; state.xp = Object.assign(state.xp, s.xp); state.bank = s.bank || {}; } } catch (e) {} }

  // ============================================================
  // UI
  // ============================================================
  function render() { renderStats(); renderPanel(); save(); }
  function renderStats() {
    const s = el('stats'); if (!s) return;
    s.innerHTML =
      cell('🎣 Fishing', lvl('fish')) + cell('🍳 Cooking', lvl('cook')) +
      cell('⛏️ Mining', lvl('mine')) + cell('🔨 Smithing', lvl('smith')) +
      '<div class="stat"><small>🪙 Coins</small> ' + (state.inv.coins || 0).toLocaleString() + '</div>';
  }
  const cell = (label, v) => '<div class="stat"><small>' + label + '</small> ' + v + '</div>';

  function setTab(t) { tab = t; vendor = null; document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === t)); renderPanel(); }

  function renderPanel() {
    const p = el('panel'); if (!p) return;
    if (vendor === 'bank') return renderBank(p);
    if (vendor) return renderShop(p);
    if (tab === 'inv') return renderInv(p);
    if (tab === 'skills') return renderSkills(p);
    if (tab === 'smith') return renderSmith(p);
  }

  function renderInv(p) {
    const ids = Object.keys(state.inv).filter(id => state.inv[id] > 0);
    let h = '<h4>🎒 Backpack</h4><div class="grid">';
    if (!ids.length) h += '<div class="empty">Empty. Go fish, mine, or shop!</div>';
    ids.forEach(id => {
      const it = ITEMS[id]; if (!it) return;
      h += '<div class="islot" data-use="' + id + '" title="' + it.name + '"><span class="q">' + state.inv[id] + '</span>' +
        '<span class="ic">' + it.icon + '</span><span class="nm">' + it.name + '</span></div>';
    });
    h += '</div><div class="hint">Click food to eat. Sell loot at a shop, store it at the bank.</div>';
    p.innerHTML = h;
    p.querySelectorAll('[data-use]').forEach(b => b.onclick = () => useItem(b.dataset.use));
  }
  function renderSkills(p) {
    let h = '<h4>📊 Skills</h4>';
    ['fish', 'cook', 'mine', 'smith'].forEach(sk => {
      const L = lvl(sk), cur = state.xp[sk] | 0;
      const next = L >= 99 ? cur : (typeof xpForLevel === 'function' ? xpForLevel(L + 1) : cur + 100);
      const base = L >= 99 ? cur : (typeof xpForLevel === 'function' ? xpForLevel(L) : 0);
      const pct = L >= 99 ? 100 : Math.max(0, Math.min(100, 100 * (cur - base) / (next - base)));
      h += '<div class="srow"><b>' + NAME[sk] + '</b> — level ' + L +
        '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
        '<small>' + cur.toLocaleString() + (L >= 99 ? ' xp (max)' : ' / ' + next.toLocaleString() + ' xp') + '</small></div>';
    });
    p.innerHTML = h;
  }
  function renderSmith(p) {
    const RECIPES = [['helm', 1, '⛑️'], ['sword', 2, '🗡️'], ['shield', 3, '🛡️'], ['legs', 3, '👖'], ['armor', 4, '🛡️']];
    let h = '<h4>⚒️ Anvil — forge from bars <small>(Smithing ' + lvl('smith') + ')</small></h4>';
    TIERS.forEach(t => {
      const bar = t.id + '_bar', have = state.inv[bar] || 0;
      RECIPES.forEach(([kind, need, ic]) => {
        const out = t.id + '_' + kind; if (!ITEMS[out]) return;
        h += '<div class="row"><span>' + ic + '</span><span class="grow">' + ITEMS[out].name +
          ' <small>(' + need + '× ' + t.name + ' bar — have ' + have + ')</small></span>' +
          '<button data-forge="' + out + '" data-bar="' + bar + '" data-need="' + need + '" data-pow="' + t.pow + '"' +
          (have < need ? ' disabled' : '') + '>Forge</button></div>';
      });
    });
    h += '<div class="hint">Bars come from smelting ore at the furnace, or buy/sell gear at a shop.</div>';
    p.innerHTML = h;
    p.querySelectorAll('[data-forge]').forEach(b => b.onclick = () => {
      const need = +b.dataset.need;
      if (removeItem(b.dataset.bar, need)) { addItem(b.dataset.forge, 1); grantXp('smith', Math.round(+b.dataset.pow * need * 3)); msg('🔨 You forge a ' + ITEMS[b.dataset.forge].name + '!', '#8fd0ff'); }
    });
  }
  function renderShop(p) {
    const shop = SHOPS[vendor]; if (!shop) { vendor = null; return renderPanel(); }
    let h = '<h4>' + shop.title + '</h4><h5>Buy</h5>';
    shop.stock.forEach(s => {
      const it = ITEMS[s.id]; if (!it) return;
      h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name + '</span>' +
        '<small>' + s.price + ' gp</small><button data-buy="' + s.id + '" data-price="' + s.price + '" data-q="1"' +
        ((state.inv.coins || 0) < s.price ? ' disabled' : '') + '>Buy</button>';
      if (s.bulk) h += '<button data-buy="' + s.id + '" data-price="' + (s.price * s.bulk) + '" data-q="' + s.bulk + '"' + ((state.inv.coins || 0) < s.price * s.bulk ? ' disabled' : '') + '>×' + s.bulk + '</button>';
      h += '</div>';
    });
    h += '<h5>Sell</h5>';
    const ids = Object.keys(state.inv).filter(id => id !== 'coins' && state.inv[id] > 0 && ITEMS[id] && ITEMS[id].sell > 0);
    if (!ids.length) h += '<div class="hint">Nothing to sell.</div>';
    ids.forEach(id => { const it = ITEMS[id], q = state.inv[id];
      h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name + ' ×' + q + ' <small>(' + it.sell + ' ea)</small></span>' +
        '<button data-sell="' + id + '" data-q="1">Sell 1</button><button data-sell="' + id + '" data-q="' + q + '">All</button></div>';
    });
    h += '<button class="wide" id="close">Leave</button>';
    p.innerHTML = h;
    p.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { if (removeItem('coins', +b.dataset.price)) { addItem(b.dataset.buy, +b.dataset.q); msg('You buy ' + b.dataset.q + '× ' + ITEMS[b.dataset.buy].name + '.', '#8fd0ff'); } });
    p.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => { const id = b.dataset.sell, q = Math.min(+b.dataset.q, state.inv[id] || 0); if (q > 0 && removeItem(id, q)) { addItem('coins', ITEMS[id].sell * q); msg('You sell ' + q + '× ' + ITEMS[id].name + ' for ' + (ITEMS[id].sell * q) + ' gp.', '#ffd23f'); } });
    el('close').onclick = () => { vendor = null; setTab('inv'); };
  }
  function renderBank(p) {
    let h = '<h4>🏦 Bank of Emberfall</h4><h5>Vault</h5>';
    const bids = Object.keys(state.bank).filter(id => state.bank[id] > 0);
    if (!bids.length) h += '<div class="hint">Empty.</div>';
    bids.forEach(id => { const it = ITEMS[id]; if (!it) return;
      h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name + ' ×' + state.bank[id] + '</span>' +
        '<button data-wd="' + id + '" data-q="1">Take 1</button><button data-wd="' + id + '" data-q="' + state.bank[id] + '">All</button></div>'; });
    h += '<h5>Backpack</h5>';
    const iids = Object.keys(state.inv).filter(id => id !== 'coins' && state.inv[id] > 0);
    if (iids.length) h += '<div class="row"><span class="grow"><small>Store everything</small></span><button id="depall">Deposit all</button></div>';
    if (!iids.length) h += '<div class="hint">Empty.</div>';
    iids.forEach(id => { const it = ITEMS[id]; if (!it) return;
      h += '<div class="row"><span>' + it.icon + '</span><span class="grow">' + it.name + ' ×' + state.inv[id] + '</span>' +
        '<button data-dep="' + id + '" data-q="1">Store 1</button><button data-dep="' + id + '" data-q="' + state.inv[id] + '">All</button></div>'; });
    h += '<button class="wide" id="close">Leave</button>';
    p.innerHTML = h;
    p.querySelectorAll('[data-dep]').forEach(b => b.onclick = () => { const id = b.dataset.dep, q = Math.min(+b.dataset.q, state.inv[id] || 0); if (q > 0 && removeItem(id, q)) { state.bank[id] = (state.bank[id] || 0) + q; render(); } });
    p.querySelectorAll('[data-wd]').forEach(b => b.onclick = () => { const id = b.dataset.wd, q = Math.min(+b.dataset.q, state.bank[id] || 0); if (q > 0) { state.bank[id] -= q; if (state.bank[id] <= 0) delete state.bank[id]; addItem(id, q); } });
    const da = el('depall'); if (da) da.onclick = () => { Object.keys(state.inv).forEach(id => { if (id === 'coins') return; const q = state.inv[id]; if (q > 0) { state.bank[id] = (state.bank[id] || 0) + q; delete state.inv[id]; } }); render(); };
    el('close').onclick = () => { vendor = null; setTab('inv'); };
  }
  function useItem(id) {
    const it = ITEMS[id]; if (!it) return;
    if (id.startsWith('raw_')) return msg('Cook that at a campfire first.');
    if (id.endsWith('_ore')) return msg('Smelt that into a bar at the furnace.');
    if (it.heal) { msg('You eat the ' + it.name + '.', '#8fff8f'); removeItem(id, 1); return; }
    msg(it.name + ': sell it, bank it, or smith with it.');
  }

  // ============================================================
  // interactions (called by the 3D world)
  // ============================================================
  function interact(st) {
    action = null;
    if (st.kind === 'shop') { vendor = st.shop; msg(st.greet || 'Welcome!', '#60d0ff'); renderPanel(); }
    else if (st.kind === 'bank') { vendor = 'bank'; msg('Wilhelmina: your valuables are safe with us.', '#60d0ff'); renderPanel(); }
    else if (st.kind === 'fish') { if (!haveTool('fishing_rod')) return msg('You need a fishing rod (buy one at the shop).', '#ff9f60'); action = { kind: 'fish', next: 0 }; msg('You cast your line...', '#8fd0ff'); }
    else if (st.kind === 'cook') { action = { kind: 'cook', next: 0 }; msg('You crouch by the fire...', '#ff9f60'); }
    else if (st.kind === 'mine') { if (!haveTool('pickaxe')) return msg('You need a pickaxe (buy one at the shop).', '#ff9f60'); action = { kind: 'mine', tier: st.tier || 'bronze', next: 0 }; msg('You swing your pickaxe...', '#c8a878'); }
    else if (st.kind === 'smelt') { action = { kind: 'smelt', next: 0 }; msg('The furnace glows...', '#ff9f60'); }
    else if (st.kind === 'smith') { setTab('smith'); msg('You step up to the anvil.', '#8fd0ff'); }
  }
  const haveTool = id => (state.inv[id] || 0) > 0;
  function stopAction() { action = null; }

  // gather tick — called each frame with a timestamp
  function tick(now) {
    if (!action) return;
    if (now < action.next) return;
    action.next = now + (action.kind === 'fish' ? 2400 : action.kind === 'mine' ? 2600 : action.kind === 'smelt' ? 1600 : 2000);
    if (action.kind === 'fish') doFish();
    else if (action.kind === 'cook') doCook();
    else if (action.kind === 'mine') doMine(action.tier);
    else if (action.kind === 'smelt') doSmelt();
  }
  function doFish() {
    if (!haveTool('bait')) { msg('Out of bait (buy more at the shop).', '#ff9f60'); action = null; return; }
    if (Math.random() < 0.55 + lvl('fish') * 0.004) {
      removeItem('bait', 1);
      const L = lvl('fish'), r = Math.random(); let id = 'raw_shrimp', xp = 15;
      if (L >= 30 && r < 0.3) { id = 'raw_shark'; xp = 110; } else if (L >= 10 && r < 0.6) { id = 'raw_trout'; xp = 45; }
      addItem(id, 1); grantXp('fish', xp); msg('You catch a ' + ITEMS[id].name.toLowerCase().replace('raw ', '') + '!', '#8fd0ff');
    } else msg('You feel a nibble... but it escapes.');
  }
  function doCook() {
    const order = [['raw_shrimp', 'shrimp', 20, 0], ['raw_trout', 'trout', 55, 0.05], ['raw_shark', 'shark', 130, 0.15]];
    const job = order.find(o => (state.inv[o[0]] || 0) > 0);
    if (!job) { msg('Nothing raw left to cook.', '#b8a888'); action = null; return; }
    removeItem(job[0], 1);
    if (Math.random() < clamp(0.45 - lvl('cook') * 0.012 + job[3], 0.03, 0.9)) { addItem('burnt_fish', 1); msg('You burn the fish.', '#ff6060'); }
    else { addItem(job[1], 1); grantXp('cook', job[2]); msg('You cook a ' + ITEMS[job[1]].name.toLowerCase() + '.', '#8fff8f'); }
  }
  const ORE_XP = { bronze: 18, iron: 35, steel: 60, mithril: 90, rune: 140, dragon: 220 };
  const ROCK_REQ = { bronze: 1, iron: 10, steel: 25, mithril: 40, rune: 55, dragon: 75 };
  function doMine(tier) {
    if (lvl('mine') < (ROCK_REQ[tier] || 1)) { msg('You need Mining ' + ROCK_REQ[tier] + ' for this rock.', '#ff9f60'); action = null; return; }
    if (Math.random() < clamp(0.4 + (lvl('mine') - ROCK_REQ[tier]) * 0.02, 0.25, 0.9)) { addItem(tier + '_ore', 1); grantXp('mine', ORE_XP[tier]); msg('You mine some ' + ITEMS[tier + '_ore'].name.toLowerCase() + '.', '#c8a878'); }
    else msg('The rock holds firm...');
  }
  const SMELT_XP = { bronze: 12, iron: 22, steel: 40, mithril: 65, rune: 100, dragon: 160 };
  function doSmelt() {
    const t = [...TIERS].reverse().find(t => (state.inv[t.id + '_ore'] || 0) > 0);
    if (!t) { msg('No ore left to smelt.', '#b8a888'); action = null; return; }
    removeItem(t.id + '_ore', 1); addItem(t.id + '_bar', 1); grantXp('smith', SMELT_XP[t.id]); msg('You smelt a ' + t.name + ' bar.', '#ffb060');
  }

  // ---------- boot ----------
  function init() {
    load();
    document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
    render();
    msg('Welcome to Heartwood. Explore the town, fish, mine, and trade.', '#ffd23f');
  }

  function say(t) { msg(t, '#60d0ff'); }
  return { init, interact, tick, stopAction, state, say };
})();
