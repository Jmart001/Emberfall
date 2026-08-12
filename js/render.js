"use strict";
// ============================================================
// render.js — per-frame drawing: world, actors, HUD, minimap
// ============================================================

function bar(x, y, f) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(x - 17, y - 1, 34, 6);
  ctx.fillStyle = '#b01818'; ctx.fillRect(x - 16, y, 32, 4);
  ctx.fillStyle = '#26c826'; ctx.fillRect(x - 16, y, 32 * clamp(f, 0, 1), 4);
}
function drawSplat(s, now) {
  const age = (now - s.t) / 900;
  ctx.globalAlpha = 1 - age * age;
  const yy = s.y - age * 16;
  ctx.fillStyle = s.blue ? '#3050c8' : '#c22020';
  ctx.beginPath();
  const R = 11, r = 7;
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4 - Math.PI / 2, rad = i % 2 ? r : R;
    ctx[i ? 'lineTo' : 'moveTo'](s.x + Math.cos(a) * rad, yy + Math.sin(a) * rad);
  }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Verdana';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(s.val, s.x, yy + 0.5);
  ctx.globalAlpha = 1;
}
function swingOf(lastSwing, now) {
  if (!lastSwing) return 0;
  return clamp(1 - (now - lastSwing) / 240, 0, 1);
}
function label(text, x, y, color) {
  ctx.font = 'bold 10px Verdana';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color; ctx.fillText(text, x, y);
}
function drawActor(x, y, face, painterKey, now, st) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y + 13, 10, 3.5, 0, 0, 7); ctx.fill();
  ctx.save();
  ctx.translate(x, y + 13);
  if (face < 0) ctx.scale(-1, 1);
  PAINTERS[painterKey](ctx, now, st);
  ctx.restore();
}
function regionName() {
  if (inRect(player.x, player.y, CASTLE)) return 'Lumshire Castle';
  if (inRect(player.x, player.y, REGIONS.crypt)) return 'The Old Crypt';
  if (inRect(player.x, player.y, REGIONS.lair)) return "Dragon's Lair";
  if (player.x < 720 && player.y < 1050) return 'Lumshire Village';
  return 'The Wildmeadow';
}
function tutPoint() {
  if (tutStep === 0 || tutStep === 1) {
    let best = null, bd = 1e9;
    mobs.forEach(m => { const d = dist(player, m); if (d < bd) { bd = d; best = m; } });
    return best;
  }
  if (tutStep === 2) {
    let best = null, bd = 1e9;
    loots.forEach(l => { const d = dist(player, l); if (d < bd) { bd = d; best = l; } });
    return best;
  }
  if (tutStep === 3) return NPCS[0];
  if (tutStep === 6) return NPCS[1];
  if (tutStep === 7) return FISH_SPOTS[0];
  if (tutStep === 8) return RANGE_PT;
  if (tutStep === 9) return NPCS[2];
  return null;
}
function drawGuide(now) {
  const pt = tutPoint();
  if (!pt) return;
  const sx = pt.x - cam.x, sy = pt.y - cam.y;
  if (sx > 20 && sx < W - 20 && sy > 50 && sy < H - 20) {
    const b = Math.sin(now / 180) * 4;
    ctx.font = '16px Verdana'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText('▼', sx + 1, sy - 43 + b);
    ctx.fillStyle = '#ffd23f'; ctx.fillText('▼', sx, sy - 44 + b);
  } else {
    const cx = W / 2, cy = H / 2, a = Math.atan2(sy - cy, sx - cx);
    const ex = clamp(cx + Math.cos(a) * 1000, 26, W - 26);
    const ey = clamp(cy + Math.sin(a) * 1000, 26, H - 26);
    ctx.save(); ctx.translate(ex, ey); ctx.rotate(a);
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(-9, -9); ctx.lineTo(-9, 9); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
}
function drawMinimap() {
  const mw = 150, mh = Math.round(mw * WH / WW), mx = W - mw - 10, my = 10;
  const sc = mw / WW;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = '#2e4a24'; ctx.fillRect(mx, my, mw, mh);
  const cr = REGIONS.crypt, lr = REGIONS.lair;
  ctx.fillStyle = '#55556a'; ctx.fillRect(mx + cr.x * sc, my + cr.y * sc, cr.w * sc, cr.h * sc);
  ctx.fillStyle = '#5c2a24'; ctx.fillRect(mx + lr.x * sc, my + lr.y * sc, lr.w * sc, lr.h * sc);
  ctx.fillStyle = '#4d89aa';
  ctx.beginPath(); ctx.ellipse(mx + 315 * sc, my + 815 * sc, 130 * sc, 92 * sc, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#9a9aa8'; ctx.fillRect(mx + CASTLE.x * sc, my + CASTLE.y * sc, CASTLE.w * sc, CASTLE.h * sc);
  ctx.fillStyle = '#8a6a3d'; ctx.fillRect(mx + 470 * sc, my + 470 * sc, 130 * sc, 100 * sc);
  ctx.fillStyle = '#ff6060';
  mobs.forEach(m => ctx.fillRect(mx + m.x * sc - 1, my + m.y * sc - 1, 2, 2));
  ctx.fillStyle = '#ffe060';
  NPCS.forEach(n => ctx.fillRect(mx + n.x * sc - 1.5, my + n.y * sc - 1.5, 3, 3));
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mx + player.x * sc - 2, my + player.y * sc - 2, 4, 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1;
  ctx.strokeRect(mx + cam.x * sc, my + cam.y * sc, W * sc, H * sc);
  ctx.strokeStyle = '#8a7a5c'; ctx.lineWidth = 2;
  ctx.strokeRect(mx, my, mw, mh);
  ctx.globalAlpha = 1;
}
let vigCache = null;
function vignette() {
  if (!vigCache) {
    vigCache = ctx.createRadialGradient(W / 2, H / 2, H / 2.3, W / 2, H / 2, H * 0.95);
    vigCache.addColorStop(0, 'rgba(0,0,0,0)');
    vigCache.addColorStop(1, 'rgba(0,0,0,0.28)');
  }
  ctx.fillStyle = vigCache;
  ctx.fillRect(0, 0, W, H);
}
// faint tile grid over the viewport
function drawGrid() {
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1;
  const ox = -(cam.x % TILE), oy = -(cam.y % TILE);
  for (let x = ox; x <= W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = oy; y <= H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}
function tileOutline(tx, ty, color, alpha, lw) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color; ctx.lineWidth = lw || 2;
  ctx.strokeRect(tx * TILE + 1.5, ty * TILE + 1.5, TILE - 3, TILE - 3);
  ctx.globalAlpha = 1;
}

function draw(now) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  ctx.drawImage(bgCanvas, 0, 0);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // hover tile highlight
  if (hoverTile && tileWalkable(hoverTile.tx, hoverTile.ty)) {
    tileOutline(hoverTile.tx, hoverTile.ty, 'rgba(255,255,255,0.9)', 0.25, 1.5);
  }
  // destination tile marker (OSRS-style)
  if (destTile) {
    const age = (now - destTile.t) / 800;
    if (player.path.length > 0 || age < 1) {
      const pulse = 0.5 + 0.3 * Math.sin(now / 150);
      tileOutline(destTile.tx, destTile.ty, '#ffd23f', player.path.length ? pulse : Math.max(0, 1 - age), 2);
    } else destTile = null;
  }

  // animated water shimmer
  for (let k = 0; k < 6; k++) {
    const wx = POND.x + Math.sin(now / 800 + k * 1.9) * (POND.rx - 40);
    const wy = POND.y + Math.cos(now / 950 + k * 2.3) * (POND.ry - 30);
    ctx.strokeStyle = 'rgba(220,240,255,' + (0.12 + 0.1 * Math.sin(now / 300 + k)) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(wx, wy, 10, 3, 0, 0, Math.PI); ctx.stroke();
  }

  // fishing spots
  FISH_SPOTS.forEach((s, i) => {
    for (let k = 0; k < 2; k++) {
      const ph = ((now / 1400 + k * 0.5 + i * 0.3) % 1);
      ctx.globalAlpha = (1 - ph) * 0.7;
      ctx.strokeStyle = '#d8f0ff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, 4 + ph * 14, 2 + ph * 7, 0, 0, 7); ctx.stroke();
    }
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#1a3a50';
    ctx.beginPath();
    ctx.ellipse(s.x + Math.sin(now / 500 + i * 2) * 4, s.y + 2, 6, 2.5, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
  });

  // campfire flame
  (function flame() {
    const f = RANGE_PT;
    const fl = Math.sin(now / 90) * 2 + Math.sin(now / 37) * 1.2;
    const rg = ctx.createRadialGradient(f.x, f.y - 2, 3, f.x, f.y - 2, 34);
    rg.addColorStop(0, 'rgba(255,150,50,0.35)'); rg.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = rg; ctx.fillRect(f.x - 34, f.y - 36, 68, 68);
    ctx.fillStyle = '#ff8a20';
    ctx.beginPath();
    ctx.moveTo(f.x - 7, f.y + 4);
    ctx.quadraticCurveTo(f.x - 8, f.y - 6, f.x + fl * 0.5, f.y - 14 - fl);
    ctx.quadraticCurveTo(f.x + 8, f.y - 6, f.x + 7, f.y + 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(f.x - 4, f.y + 4);
    ctx.quadraticCurveTo(f.x - 4, f.y - 2, f.x + fl * 0.3, f.y - 7 - fl * 0.6);
    ctx.quadraticCurveTo(f.x + 4, f.y - 2, f.x + 4, f.y + 4);
    ctx.closePath(); ctx.fill();
    for (let k = 0; k < 3; k++) {
      const ph = ((now / 1100 + k * 0.37) % 1);
      ctx.globalAlpha = 1 - ph;
      ctx.fillStyle = '#ffb050';
      ctx.fillRect(f.x + Math.sin(now / 200 + k * 3) * 6 - 1, f.y - 8 - ph * 26, 2, 2);
      ctx.globalAlpha = 1;
    }
  })();

  // ore rocks
  ROCKS.forEach(r => {
    const col = TIERCOL[r.tier];
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(r.x, r.y + 8, 13, 4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b6660';
    ctx.beginPath();
    ctx.moveTo(r.x - 13, r.y + 7); ctx.lineTo(r.x - 9, r.y - 9); ctx.lineTo(r.x + 3, r.y - 11);
    ctx.lineTo(r.x + 13, r.y + 2); ctx.lineTo(r.x + 8, r.y + 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#555049';
    ctx.beginPath(); ctx.moveTo(r.x - 13, r.y + 7); ctx.lineTo(r.x - 9, r.y - 9); ctx.lineTo(r.x - 2, r.y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col;
    [[-4,-3],[3,-5],[5,1],[-2,3]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(r.x + dx, r.y + dy, 2, 0, 7); ctx.fill(); });
  });

  // furnace
  (function furnace() {
    const f = FURNACE_PT;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 13, 20, 5, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a4038'; ctx.fillRect(f.x - 16, f.y - 16, 32, 28);
    ctx.fillStyle = '#3a332b'; ctx.fillRect(f.x - 16, f.y - 20, 10, 6);
    ctx.strokeStyle = '#2a241c'; ctx.lineWidth = 1; ctx.strokeRect(f.x - 16, f.y - 16, 32, 28);
    const g = 0.45 + 0.3 * Math.sin(now / 200);
    const rg = ctx.createRadialGradient(f.x, f.y + 2, 1, f.x, f.y + 2, 13);
    rg.addColorStop(0, 'rgba(255,180,60,' + g + ')'); rg.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(f.x, f.y + 2, 13, 0, 7); ctx.fill();
    ctx.fillStyle = '#1a1410'; ctx.beginPath(); ctx.arc(f.x, f.y + 4, 6, Math.PI, 0, true); ctx.fill();
  })();

  if (clickMark) {
    ctx.strokeStyle = clickMark.c; ctx.lineWidth = 2;
    const s = 6;
    ctx.beginPath();
    ctx.moveTo(clickMark.x - s, clickMark.y - s); ctx.lineTo(clickMark.x + s, clickMark.y + s);
    ctx.moveTo(clickMark.x + s, clickMark.y - s); ctx.lineTo(clickMark.x - s, clickMark.y + s);
    ctx.stroke();
  }

  // loot piles
  loots.forEach(l => {
    const pulse = 1 + Math.sin(now / 240 + l.x) * 0.12;
    const rg = ctx.createRadialGradient(l.x, l.y, 2, l.x, l.y, 16 * pulse);
    rg.addColorStop(0, 'rgba(255,210,63,0.45)'); rg.addColorStop(1, 'rgba(255,210,63,0)');
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(l.x, l.y, 16 * pulse, 0, 7); ctx.fill();
    setOutline(ctx);
    ell(ctx, l.x - 4, l.y + 3, 4, 2.5, '#d8b830');
    ell(ctx, l.x + 4, l.y + 3, 4, 2.5, '#e8c840');
    ell(ctx, l.x, l.y - 1, 4, 2.5, '#f0d050');
  });

  // NPCs
  NPCS.forEach(n => {
    drawActor(n.x, n.y, n.id === 'banker' ? -1 : 1, n.paint, now, { walk: false, seed: n.x });
    label(n.name, n.x, n.y - 30, '#60e8ff');
  });

  // mobs
  mobs.forEach(m => {
    const md = MOBS[m.type];
    if (m === target) {
      ctx.strokeStyle = 'rgba(255,80,80,0.9)'; ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]); ctx.lineDashOffset = -now / 40;
      ctx.beginPath(); ctx.arc(m.x, m.y, 22, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
    }
    drawActor(m.x, m.y, m.face, m.type, now, {
      walk: m.moving, swing: swingOf(m.lastSwing, now), seed: m.uid });
    label(md.name + ' (lvl ' + md.lvl + ')', m.x, m.y - 32, '#ffff40');
    if (m.hp < md.hp) bar(m.x, m.y - 24, m.hp / md.hp);
  });

  // player
  const armorTier = player.equip.body ? ITEMS[player.equip.body].tier : null;
  const weaponTier = player.equip.weapon ? ITEMS[player.equip.weapon].tier : null;
  drawActor(player.x, player.y, player.face, 'player', now, {
    walk: player.moving,
    swing: swingOf(player.lastSwing, now),
    armor: armorTier ? TIERCOL[armorTier] : null,
    weapon: (action && action.kind === 'fish') ? null : (weaponTier ? TIERCOL[weaponTier] : null),
    rod: action && action.kind === 'fish',
  });
  bar(player.x, player.y - 24, player.hp / maxHp());

  // fishing line
  if (action && action.kind === 'fish') {
    const hx = player.x + player.face * 13, hy = player.y - 16;
    const bob = Math.sin(now / 350) * 2;
    ctx.strokeStyle = 'rgba(240,240,240,0.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hx, hy);
    ctx.quadraticCurveTo((hx + action.pt.x) / 2, (hy + action.pt.y) / 2 + 14, action.pt.x, action.pt.y + bob);
    ctx.stroke();
    ctx.fillStyle = '#d83028';
    ctx.beginPath(); ctx.arc(action.pt.x, action.pt.y + bob, 2.5, 0, 7); ctx.fill();
  }

  splats.forEach(s => drawSplat(s, now));
  ctx.restore();

  drawGrid();

  // HUD
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = 'bold 14px Trebuchet MS';
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText(regionName(), 13, 21);
  ctx.fillStyle = '#ffd23f'; ctx.fillText(regionName(), 12, 20);
  ctx.textAlign = 'center';

  vignette();
  drawMinimap();
  drawGuide(now);
}
