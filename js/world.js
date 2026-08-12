"use strict";
// ============================================================
// world.js — bakes the 2000×1500 world onto an offscreen canvas
// ============================================================

let bgCanvas = null;

function buildWorld() {
  bgCanvas = document.createElement('canvas');
  bgCanvas.width = WW; bgCanvas.height = WH;
  const g = bgCanvas.getContext('2d');

  // --- base grass with tonal variation ---
  g.fillStyle = '#417032';
  g.fillRect(0, 0, WW, WH);
  for (let i = 0; i < 120; i++) {
    g.fillStyle = Math.random() < .5 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    g.beginPath(); g.arc(rnd(WW), rnd(WH), 50 + rnd(130), 0, 7); g.fill();
  }
  const tones = ['#4a7d3a', '#38632c', '#568a44'];
  for (let i = 0; i < 4500; i++) {
    g.fillStyle = tones[rnd(3)];
    g.fillRect(rnd(WW), rnd(WH), 2, 2);
  }

  // --- crypt region ---
  const cr = REGIONS.crypt;
  for (let i = 0; i < 60; i++) {
    g.fillStyle = 'rgba(72,72,88,' + (0.5 + Math.random() * 0.5) + ')';
    g.beginPath(); g.arc(cr.x + rnd(cr.w), cr.y + rnd(cr.h), 40 + rnd(70), 0, 7); g.fill();
  }
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    let x = cr.x + rnd(cr.w), y = cr.y + rnd(cr.h);
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 4; s++) { x += rnd(24) - 12; y += rnd(18) - 6; g.lineTo(x, y); }
    g.stroke();
  }
  g.fillStyle = 'rgba(220,220,210,0.5)';
  for (let i = 0; i < 50; i++) g.fillRect(cr.x + rnd(cr.w), cr.y + rnd(cr.h), 3, 1.6);

  // --- lair region ---
  const lr = REGIONS.lair;
  for (let i = 0; i < 60; i++) {
    g.fillStyle = 'rgba(70,32,28,' + (0.5 + Math.random() * 0.5) + ')';
    g.beginPath(); g.arc(lr.x + rnd(lr.w), lr.y + rnd(lr.h), 40 + rnd(70), 0, 7); g.fill();
  }
  for (let i = 0; i < 14; i++) {
    let x = lr.x + 40 + rnd(lr.w - 80), y = lr.y + 40 + rnd(lr.h - 80);
    g.strokeStyle = 'rgba(255,120,30,0.85)'; g.lineWidth = 2;
    g.shadowColor = '#ff6a00'; g.shadowBlur = 9;
    g.beginPath(); g.moveTo(x, y);
    for (let s = 0; s < 5; s++) { x += rnd(40) - 20; y += rnd(30) - 15; g.lineTo(x, y); }
    g.stroke();
  }
  g.shadowBlur = 0;

  // --- paths ---
  function path(pts, w1, c1, w2, c2) {
    g.lineCap = 'round'; g.lineJoin = 'round';
    [[w1, c1], [w2, c2]].forEach(([lw, c]) => {
      g.strokeStyle = c; g.lineWidth = lw;
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    });
  }
  path([[315, 355], [420, 500], [545, 620]], 40, '#6e5230', 28, '#8a6a3d');
  path([[545, 620], [900, 700], [1250, 480], [1550, 330]], 40, '#6e5230', 28, '#8a6a3d');
  path([[900, 700], [1200, 1000], [1550, 1150]], 40, '#6e5230', 28, '#8a6a3d');
  path([[545, 620], [500, 840]], 34, '#6e5230', 24, '#8a6a3d');
  g.fillStyle = 'rgba(0,0,0,0.12)';
  [[420, 500], [700, 660], [1000, 620], [1250, 480], [1100, 900], [520, 750]].forEach(([x, y]) => {
    for (let i = 0; i < 10; i++) g.fillRect(x + rnd(60) - 30, y + rnd(30) - 15, 2.5, 2);
  });

  // --- town plaza ---
  g.fillStyle = '#8a6a3d';
  g.beginPath(); g.ellipse(560, 630, 78, 52, 0, 0, 7); g.fill();
  g.fillStyle = 'rgba(0,0,0,0.08)';
  g.beginPath(); g.ellipse(560, 630, 60, 38, 0, 0, 7); g.fill();

  // grass blades
  for (let i = 0; i < 2200; i++) {
    const x = rnd(WW), y = rnd(WH);
    if (inRect(x, y, cr) || inRect(x, y, lr) || inRect(x, y, CASTLE)) continue;
    g.strokeStyle = Math.random() < .5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rnd(5) - 2, y - 3 - rnd(4)); g.stroke();
  }
  // flowers
  for (let i = 0; i < 110; i++) {
    const x = rnd(WW), y = rnd(WH);
    if (inRect(x, y, cr) || inRect(x, y, lr) || inRect(x, y, CASTLE)) continue;
    g.fillStyle = ['#ffd23f', '#ff8fb0', '#ffffff'][rnd(3)];
    g.beginPath(); g.arc(x, y, 1.7, 0, 7); g.fill();
  }

  // --- pond ---
  function fillEll(x, y, rx, ry, col) {
    g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill();
  }
  fillEll(315, 815, 140, 100, '#c2b280');
  fillEll(315, 815, 128, 88, '#2e5a7a');
  fillEll(315, 815, 120, 80, '#36688a');
  fillEll(308, 808, 96, 60, '#4d89aa');
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.beginPath(); g.ellipse(280, 780, 26, 10, -0.4, 0, 7); g.fill();
  paintLily(g, 350, 850); paintLily(g, 250, 790); paintLily(g, 370, 780);
  g.strokeStyle = '#2e5c26'; g.lineWidth = 2;
  [[195, 760], [200, 870], [430, 745], [415, 880]].forEach(([x, y]) => {
    for (let k = 0; k < 4; k++) {
      g.beginPath(); g.moveTo(x + k * 4, y); g.lineTo(x + k * 4 + rnd(4) - 2, y - 12 - rnd(8)); g.stroke();
    }
  });
  g.fillStyle = '#7a5a38'; g.fillRect(400, 790, 52, 18);
  g.strokeStyle = 'rgba(0,0,0,0.3)'; g.lineWidth = 1;
  for (let x = 404; x < 452; x += 8) { g.beginPath(); g.moveTo(x, 790); g.lineTo(x, 808); g.stroke(); }

  // ===== CASTLE (enterable floorplan) =====
  (function castle() {
    const cx = CASTLE.x, cy = CASTLE.y, cw = CASTLE.w, ch = CASTLE.h;
    g.fillStyle = '#9a9aa6'; g.fillRect(cx, cy, cw, ch);
    g.strokeStyle = 'rgba(0,0,0,0.15)'; g.lineWidth = 1;
    for (let x = cx + 24; x < cx + cw; x += 24) { g.beginPath(); g.moveTo(x, cy); g.lineTo(x, cy + ch); g.stroke(); }
    for (let y = cy + 24; y < cy + ch; y += 24) { g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + cw, y); g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 40; i++) g.fillRect(cx + rnd(cw), cy + rnd(ch), 10, 10);
    // red carpet
    g.fillStyle = '#7a1e1e'; g.fillRect(299, 212, 32, 128);
    g.fillStyle = '#9a2a2a'; g.fillRect(303, 212, 24, 128);
    g.strokeStyle = '#c8a838'; g.lineWidth = 1.5;
    g.strokeRect(301, 212, 28, 128);
    // walls
    OBSTACLES.slice(0, 5).forEach(o => {
      g.fillStyle = '#6e6e7c'; g.fillRect(o.x, o.y, o.w, o.h);
      g.fillStyle = '#8a8a98'; g.fillRect(o.x, o.y, o.w, 3);
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1;
      if (o.w > o.h) { for (let x = o.x + 16; x < o.x + o.w; x += 16) { g.beginPath(); g.moveTo(x, o.y); g.lineTo(x, o.y + o.h); g.stroke(); } }
      else { for (let y = o.y + 16; y < o.y + o.h; y += 16) { g.beginPath(); g.moveTo(o.x, y); g.lineTo(o.x + o.w, y); g.stroke(); } }
    });
    // corner towers
    setOutline(g);
    [[cx + 7, cy + 7], [cx + cw - 7, cy + 7], [cx + 7, cy + ch - 7], [cx + cw - 7, cy + ch - 7]].forEach(([tx, ty]) => {
      ball(g, tx, ty, 17, '#7a7a88');
      ball(g, tx, ty, 11, '#84848f');
      g.fillStyle = '#5c5c68';
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2;
        g.fillRect(tx + Math.cos(a) * 14 - 2, ty + Math.sin(a) * 14 - 2, 4, 4);
      }
    });
    // drawbridge
    g.fillStyle = '#7a5a38'; g.fillRect(GATE.x1, cy + ch, GATE.x2 - GATE.x1, 22);
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    for (let x = GATE.x1 + 6; x < GATE.x2; x += 8) { g.beginPath(); g.moveTo(x, cy + ch); g.lineTo(x, cy + ch + 22); g.stroke(); }
    g.fillStyle = '#5c5c68';
    g.fillRect(GATE.x1 - 6, cy + ch - 18, 8, 22); g.fillRect(GATE.x2 - 2, cy + ch - 18, 8, 22);
    // banners
    [[240, cy + 14], [390, cy + 14]].forEach(([bx, by]) => {
      g.fillStyle = '#8a1e1e'; g.fillRect(bx, by, 14, 26);
      tri(g, bx, by + 26, bx + 14, by + 26, bx + 7, by + 34, '#8a1e1e');
      g.fillStyle = '#ffd23f'; g.fillRect(bx + 5, by + 8, 4, 4);
    });
    // bank counter
    const bc = OBSTACLES[5];
    g.fillStyle = '#5c4326'; g.fillRect(bc.x, bc.y, bc.w, bc.h);
    g.fillStyle = '#7a5a38'; g.fillRect(bc.x, bc.y, bc.w, 4);
    g.strokeStyle = 'rgba(0,0,0,0.3)';
    for (let x = bc.x + 12; x < bc.x + bc.w; x += 12) { g.beginPath(); g.moveTo(x, bc.y + 4); g.lineTo(x, bc.y + bc.h); g.stroke(); }
    // vault decor
    setOutline(g);
    [[255, 178], [370, 178]].forEach(([chx, chy]) => {
      box(g, chx - 9, chy - 10, 18, 12, '#6a4a26', 2);
      box(g, chx - 9, chy - 13, 18, 5, '#7a5a30', 2);
      g.fillStyle = '#ffd23f'; g.fillRect(chx - 1.5, chy - 9, 3, 4);
    });
    ball(g, 300, 180, 4, '#e8c840'); ball(g, 307, 182, 4, '#d8b830'); ball(g, 296, 183, 3.5, '#f0d050');
    // torch glow
    [[cx + 30, cy + 40], [cx + cw - 30, cy + 40], [cx + 30, cy + ch - 40], [cx + cw - 30, cy + ch - 40]].forEach(([tx, ty]) => {
      const rg = g.createRadialGradient(tx, ty, 3, tx, ty, 55);
      rg.addColorStop(0, 'rgba(255,160,60,0.3)'); rg.addColorStop(1, 'rgba(255,160,60,0)');
      g.fillStyle = rg; g.fillRect(tx - 55, ty - 55, 110, 110);
    });
    // sign
    g.fillStyle = '#3a2a18'; g.fillRect(281, cy + ch + 24, 68, 14);
    g.fillStyle = '#ffd23f'; g.font = 'bold 8px Verdana'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('LUMSHIRE CASTLE', 315, cy + ch + 31);
  })();

  // ===== general store =====
  (function store() {
    const sx = 470, sy = 470;
    setOutline(g);
    g.fillStyle = '#7a5a38'; g.fillRect(sx, sy + 30, 130, 72);
    g.strokeStyle = 'rgba(0,0,0,0.2)'; g.lineWidth = 1;
    for (let y = sy + 44; y < sy + 102; y += 12) { g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + 130, y); g.stroke(); }
    g.fillStyle = '#5c3d24';
    g.beginPath(); g.moveTo(sx - 10, sy + 30); g.lineTo(sx + 65, sy - 8); g.lineTo(sx + 140, sy + 30); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.2)';
    for (let ry = 0; ry < 3; ry++) {
      g.beginPath();
      g.moveTo(sx - 10 + (ry + 1) * 12, sy + 30 - ry * 10);
      g.lineTo(sx + 140 - (ry + 1) * 12, sy + 30 - ry * 10);
      g.stroke();
    }
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(sx - 10, sy + 30); g.lineTo(sx + 140, sy + 30); g.stroke();
    g.fillStyle = '#8a8a96'; g.fillRect(sx + 100, sy - 2, 12, 20);
    g.fillStyle = '#4a3520'; g.fillRect(sx + 52, sy + 62, 26, 40);
    g.fillStyle = '#c8a838'; g.beginPath(); g.arc(sx + 72, sy + 84, 1.8, 0, 7); g.fill();
    g.fillStyle = '#ffd97a'; g.fillRect(sx + 14, sy + 52, 18, 16);
    g.fillRect(sx + 98, sy + 52, 18, 16);
    g.strokeStyle = '#3a2a18'; g.lineWidth = 2;
    g.strokeRect(sx + 14, sy + 52, 18, 16); g.strokeRect(sx + 98, sy + 52, 18, 16);
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(sx + 23, sy + 52); g.lineTo(sx + 23, sy + 68); g.stroke();
    g.beginPath(); g.moveTo(sx + 107, sy + 52); g.lineTo(sx + 107, sy + 68); g.stroke();
    g.fillStyle = '#3a2a18'; g.fillRect(sx + 33, sy + 34, 64, 15);
    g.fillStyle = '#ffd23f'; g.font = 'bold 9px Verdana'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('GENERAL STORE', sx + 65, sy + 42);
  })();

  // cooking fire base
  (function fire() {
    const f = RANGE_PT;
    g.fillStyle = 'rgba(0,0,0,0.25)';
    g.beginPath(); g.ellipse(f.x, f.y + 8, 22, 9, 0, 0, 7); g.fill();
    setOutline(g);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      ball(g, f.x + Math.cos(a) * 18, f.y + 6 + Math.sin(a) * 8, 4, '#8a8a96');
    }
    g.strokeStyle = '#5c3d24'; g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(f.x - 10, f.y + 9); g.lineTo(f.x + 10, f.y + 3); g.stroke();
    g.beginPath(); g.moveTo(f.x - 8, f.y + 3); g.lineTo(f.x + 9, f.y + 9); g.stroke();
  })();

  // --- scenery ---
  for (let i = 0; i < 44; i++) {
    const x = 40 + rnd(WW - 80), y = 50 + rnd(WH - 90);
    if (inRect(x, y, cr) || inRect(x, y, lr)) continue;
    if (OBSTACLES.some(o => x > o.x - 35 && x < o.x + o.w + 35 && y > o.y - 45 && y < o.y + o.h + 35)) continue;
    if (inRect(x, y, { x: CASTLE.x - 30, y: CASTLE.y - 30, w: CASTLE.w + 60, h: CASTLE.h + 60 })) continue;
    if (x < 700 && y < 1000 && Math.random() < 0.5) continue;
    if (x > 1150 && Math.random() < 0.5) paintPine(g, x, y);
    else paintTree(g, x, y);
  }
  for (let i = 0; i < 8; i++) paintPine(g, 1280 + rnd(120), 200 + rnd(900));
  for (let i = 0; i < 12; i++) {
    const x = rnd(WW), y = rnd(WH);
    if (inRect(x, y, cr) || inRect(x, y, lr) || inRect(x, y, CASTLE)) continue;
    paintMushroom(g, x, y);
  }
  for (let i = 0; i < 10; i++) paintGrave(g, cr.x + 30 + rnd(cr.w - 60), cr.y + 30 + rnd(cr.h - 60));
  for (let i = 0; i < 14; i++) paintRock(g, lr.x + 20 + rnd(lr.w - 40), lr.y + 20 + rnd(lr.h - 40), '#5c3230');
  for (let i = 0; i < 8; i++) paintRock(g, cr.x + 20 + rnd(cr.w - 40), cr.y + 20 + rnd(cr.h - 40), '#62626e');
  for (let i = 0; i < 44; i++) {
    g.fillStyle = 'rgba(255,170,70,0.55)';
    g.beginPath(); g.arc(lr.x + rnd(lr.w), lr.y + rnd(lr.h), 1.3, 0, 7); g.fill();
  }
}
