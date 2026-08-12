"use strict";
// ============================================================
// sprites.js — paint helpers, character/monster/scenery art
// ============================================================

function rrPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}
function box(c, x, y, w, h, col, r) {
  c.fillStyle = col; rrPath(c, x, y, w, h, r === undefined ? 1.5 : r);
  c.fill(); c.stroke();
}
function ball(c, x, y, r, col) {
  c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
}
function tri(c, x1, y1, x2, y2, x3, y3, col) {
  c.fillStyle = col; c.beginPath();
  c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3);
  c.closePath(); c.fill(); c.stroke();
}
function ell(c, x, y, rx, ry, col) {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.stroke();
}
function setOutline(c) { c.strokeStyle = 'rgba(20,12,8,0.6)'; c.lineWidth = 1; }

// --- generic humanoid (origin = feet, faces right) ---
function paintHumanoid(c, now, o) {
  setOutline(c);
  const wob = o.walk ? Math.sin(now / 110 + (o.seed || 0)) * 2.5 : 0;
  const sw = o.swing || 0;
  if (o.wings) {
    tri(c, -2, -18, -17, -32 + wob, -6, -9, o.wings);
    tri(c, 1, -18, -12, -34 + wob, -3, -11, o.wings);
  }
  if (o.tail) {
    c.strokeStyle = o.tail; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-5, -6); c.quadraticCurveTo(-14, -4 + wob, -16, -12);
    c.stroke(); setOutline(c);
  }
  c.save(); c.translate(-4, -21); c.rotate(o.walk ? wob * 0.08 : 0.18);
  box(c, -1.5, 0, 3, 9, o.skin, 1.5);
  c.restore();
  box(c, -5.5 + wob, -10, 4, 10, o.pants);
  box(c, 1.5 - wob, -10, 4, 10, o.pants);
  box(c, -5.5 + wob, -3, 4, 3, o.boots || '#3a2a18');
  box(c, 1.5 - wob, -3, 4, 3, o.boots || '#3a2a18');
  if (o.robe) tri(c, -9, -2, 9, -2, 0, -22, o.robe);
  box(c, -7, -23, 14, 14, o.shirt, 3);
  if (o.apron) box(c, -5, -19, 10, 10, o.apron, 2);
  if (o.vest) { box(c, -7, -23, 4, 14, o.vest, 2); box(c, 3, -23, 4, 14, o.vest, 2); }
  if (o.ribs) {
    c.strokeStyle = 'rgba(60,60,60,0.7)';
    for (let i = 0; i < 3; i++) {
      c.beginPath(); c.moveTo(-5, -20 + i * 4); c.lineTo(5, -20 + i * 4); c.stroke();
    }
    setOutline(c);
  }
  ball(c, 0, -29, 5.5, o.skin);
  if (o.hair) {
    c.fillStyle = o.hair; c.beginPath();
    c.arc(0, -30, 5.5, Math.PI * 1.02, Math.PI * 1.98); c.fill();
  }
  c.fillStyle = '#1a1a1a';
  if (o.skull) { c.fillRect(-3, -31, 2.2, 2.6); c.fillRect(1, -31, 2.2, 2.6); }
  else c.fillRect(2, -30.5, 1.6, 2);
  if (o.horns) {
    tri(c, -4, -33, -7, -41, -1, -34, '#e8d8b0');
    tri(c, 4, -33, 7, -41, 1, -34, '#e8d8b0');
  }
  if (o.ears) {
    tri(c, -5, -29, -10, -33, -5, -25, o.skin);
    tri(c, 5, -29, 10, -33, 5, -25, o.skin);
  }
  if (o.hat === 'wizard') {
    box(c, -8, -35, 16, 3, o.hatCol, 1.5);
    tri(c, -6, -35, 6, -35, 1, -48, o.hatCol);
  } else if (o.hat === 'straw') {
    box(c, -9, -34, 18, 2.5, '#c8a84b', 1);
    ball(c, 0, -36, 4.5, '#c8a84b');
  }
  c.save(); c.translate(4, -21);
  c.rotate(-0.18 - 1.6 * sw + (o.walk ? -wob * 0.08 : 0));
  box(c, -1.5, 0, 3, 9, o.skin, 1.5);
  if (o.weapon) {
    box(c, -4, 7.5, 8, 2.5, '#7a5a28', 1);
    box(c, -1.2, 9, 2.4, 12, o.weapon, 1);
    tri(c, -1.2, 21, 1.2, 21, 0, 24.5, o.weapon);
  }
  if (o.club) { box(c, -1.8, 8, 3.6, 9, '#7a5a30', 2); ball(c, 0, 18, 3.5, '#6a4a24'); }
  if (o.staff) { box(c, -1.2, -7, 2.4, 24, '#7a5a30', 1); ball(c, 0, -9, 3, '#b060d8'); }
  if (o.rod) { c.rotate(-0.55); box(c, -0.8, -20, 1.6, 22, '#8a6a3a', 1); }
  c.restore();
}

// --- beasts ---
function paintRat(c, now, st) {
  setOutline(c);
  const w = st.walk ? Math.sin(now / 100 + st.seed) * 1.5 : 0;
  c.strokeStyle = '#c88'; c.lineWidth = 2;
  c.beginPath(); c.moveTo(-10, -4); c.quadraticCurveTo(-16, -9 + w, -21, -3); c.stroke();
  setOutline(c);
  ell(c, -3, -6, 8, 5.5, '#8a7a6a');
  ball(c, 6, -8, 4.5, '#9a8a7a');
  tri(c, 5, -12, 7, -17, 9, -11, '#8a7a6a');
  c.fillStyle = '#1a1a1a'; c.fillRect(7.5, -9.5, 1.6, 1.6);
  c.fillStyle = '#d08a8a'; c.fillRect(10, -7.5, 2, 1.6);
  box(c, -7 + w, -1.5, 3, 2, '#7a6a5a');
  box(c, 1 - w, -1.5, 3, 2, '#7a6a5a');
}
function paintDragon(c, now, st) {
  setOutline(c);
  c.lineWidth = 1.2;
  const w = st.walk ? Math.sin(now / 130 + st.seed) * 2 : 0;
  const flap = Math.sin(now / 240 + st.seed) * 3;
  c.fillStyle = '#2e6b2e'; c.beginPath();
  c.moveTo(-14, -9); c.quadraticCurveTo(-27, -15 + w, -33, -7);
  c.quadraticCurveTo(-26, -9 + w, -14, -4); c.closePath(); c.fill(); c.stroke();
  tri(c, -4, -14, -20, -30 + flap, 5, -16, '#256025');
  box(c, -10 + w, -6, 4, 6, '#2e6b2e');
  box(c, 4 - w, -6, 4, 6, '#2e6b2e');
  ell(c, -2, -12, 14, 8, '#3e8e3e');
  ell(c, -2, -8, 10, 4, '#a8c86a');
  box(c, -8 - w, -5, 4, 6, '#358035');
  box(c, 6 + w, -5, 4, 6, '#358035');
  tri(c, -2, -16, -14, -33 + flap, 9, -18, '#2e7a2e');
  box(c, 8, -25, 6, 13, '#3e8e3e', 3);
  ball(c, 12, -26, 5, '#3e8e3e');
  box(c, 14, -27, 8, 4, '#3e8e3e', 2);
  tri(c, 9, -31, 11, -37, 13, -30, '#e8d8b0');
  c.fillStyle = '#1a1a1a'; c.fillRect(13.5, -28, 1.7, 1.7);
  if ((st.swing || 0) > 0.25) {
    tri(c, 22, -26, 31, -28, 27, -21, '#ff8a20');
    tri(c, 22, -25.5, 27, -26.5, 25, -23, '#ffd23f');
  }
}

// --- painter registry ---
const PAINTERS = {
  rat: paintRat,
  dragon: paintDragon,
  goblin: (c, now, st) => paintHumanoid(c, now, {
    skin:'#5a8a3a', pants:'#6a4a2a', shirt:'#7a5a34', ears:true, club:true,
    walk:st.walk, swing:st.swing, seed:st.seed }),
  skeleton: (c, now, st) => paintHumanoid(c, now, {
    skin:'#e2e2da', pants:'#d8d8d0', shirt:'#e2e2da', ribs:true, skull:true, weapon:'#9a8a7a',
    walk:st.walk, swing:st.swing, seed:st.seed }),
  wizard: (c, now, st) => paintHumanoid(c, now, {
    skin:'#d8b090', pants:'#2c2c44', shirt:'#3a3a5c', robe:'#3a3a5c', hat:'wizard', hatCol:'#33334f', staff:true,
    walk:st.walk, swing:st.swing, seed:st.seed }),
  demon: (c, now, st) => {
    c.save(); c.scale(1.25, 1.25);
    paintHumanoid(c, now, {
      skin:'#b03028', pants:'#7a1a14', shirt:'#b03028', horns:true, wings:'#701812', tail:'#8a2018', club:true,
      walk:st.walk, swing:st.swing, seed:st.seed });
    c.restore();
  },
  trader: (c, now, st) => paintHumanoid(c, now, {
    skin:'#d8a878', hair:'#4a3220', pants:'#5a4632', shirt:'#8a3a2a', apron:'#d8c8a8',
    walk:st.walk, seed:st.seed }),
  fisher: (c, now, st) => paintHumanoid(c, now, {
    skin:'#c89878', pants:'#4a5a6a', shirt:'#5a7a8a', hat:'straw', rod:true,
    walk:st.walk, seed:st.seed }),
  banker: (c, now, st) => paintHumanoid(c, now, {
    skin:'#e0b088', hair:'#2a2a2a', pants:'#2a2a34', shirt:'#f0f0f0', vest:'#3a3a48',
    walk:st.walk, seed:st.seed }),
  player: (c, now, st) => paintHumanoid(c, now, {
    skin:'#e0b088', hair:'#6a4a26', pants:'#5a4632',
    shirt: st.armor || '#4a6ba8', weapon: st.weapon || null, rod: st.rod || false,
    walk:st.walk, swing:st.swing, seed:0 }),
};

// --- scenery painters (used when baking the world background) ---
function paintTree(g, x, y) {
  setOutline(g);
  ell(g, x, y + 2, 12, 4, 'rgba(0,0,0,0.2)');
  box(g, x - 3, y - 13, 6, 14, '#6a4a2a', 2);
  ball(g, x - 8, y - 17, 9, '#2e5c26');
  ball(g, x + 8, y - 17, 9, '#2e5c26');
  ball(g, x, y - 25, 11, '#356a2a');
  g.strokeStyle = 'rgba(0,0,0,0)';
  ball(g, x - 4, y - 26, 5.5, '#3e7a30');
}
function paintPine(g, x, y) {
  setOutline(g);
  ell(g, x, y + 2, 10, 3.5, 'rgba(0,0,0,0.2)');
  box(g, x - 2.5, y - 8, 5, 9, '#5c4326', 1);
  tri(g, x - 11, y - 6, x + 11, y - 6, x, y - 22, '#24512c');
  tri(g, x - 9, y - 15, x + 9, y - 15, x, y - 29, '#2a5c30');
  tri(g, x - 7, y - 24, x + 7, y - 24, x, y - 37, '#316835');
}
function paintMushroom(g, x, y) {
  setOutline(g);
  box(g, x - 1.5, y - 5, 3, 5, '#e8e0d0', 1);
  ell(g, x, y - 6, 5, 3.5, '#c03028');
  g.fillStyle = '#fff';
  g.fillRect(x - 2.5, y - 7.5, 1.5, 1.5); g.fillRect(x + 1, y - 6.5, 1.5, 1.5);
}
function paintRock(g, x, y, col) {
  setOutline(g);
  g.fillStyle = col; g.beginPath();
  g.moveTo(x - 8, y); g.lineTo(x - 5, y - 7); g.lineTo(x + 2, y - 9);
  g.lineTo(x + 8, y - 3); g.lineTo(x + 6, y); g.closePath();
  g.fill(); g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.15)';
  g.beginPath(); g.moveTo(x - 4, y - 6); g.lineTo(x + 1, y - 7); g.stroke();
}
function paintGrave(g, x, y) {
  setOutline(g);
  box(g, x - 7, y - 3, 14, 4, '#7a7a86', 1);
  g.fillStyle = '#8a8a96';
  rrPath(g, x - 5, y - 16, 10, 14, 5); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.4)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(x, y - 13); g.lineTo(x, y - 7); g.stroke();
  g.beginPath(); g.moveTo(x - 2.5, y - 11); g.lineTo(x + 2.5, y - 11); g.stroke();
}
function paintLily(g, x, y) {
  setOutline(g);
  ell(g, x, y, 6, 4, '#3e7a38');
  g.fillStyle = '#36688a';
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + 7, y - 3); g.lineTo(x + 7, y + 2); g.closePath(); g.fill();
}
