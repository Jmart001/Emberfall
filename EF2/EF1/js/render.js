const canvas = document.getElementById('game'),
  ctx = canvas.getContext('2d'),
  camera = { x: 0, y: 0, ready: false };
let hover = { x: 0, y: 0 },
  frameTime = 0;
const worldArtwork = new Image();
worldArtwork.src = 'assets/maps/emberfall-playable-world.png?v=ef1a';
const USE_WORLD_ARTWORK = false; // procedural renderer draws the rebuilt tile map directly
const terrainTextures = {};
for (const name of ['grass', 'road', 'water', 'forest', 'stone', 'floor']) {
  const img = new Image();
  img.src = `assets/textures/${name}-noise.png`;
  terrainTextures[name] = img;
}
function resize() {
  const r = canvas.getBoundingClientRect(),
    d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(r.width * d);
  canvas.height = Math.floor(r.height * d);
  ctx.setTransform(d, 0, 0, d, 0, 0);
  ctx.imageSmoothingEnabled = false;
}
addEventListener('resize', resize);
resize();
function onScreen(x, y, pad = 3) {
  const px = x * TILE,
    py = y * TILE;
  return (
    px >= camera.x - pad * TILE &&
    px <= camera.x + canvas.clientWidth + pad * TILE &&
    py >= camera.y - pad * TILE &&
    py <= camera.y + canvas.clientHeight + pad * TILE
  );
}
let minimapCache = null;
function minimapTerrain() {
  if (minimapCache) return minimapCache;
  const size = 126,
    c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const m = c.getContext('2d'),
    sx = size / MAP_W,
    sy = size / MAP_H;
  for (let yy = 0; yy < MAP_H; yy += 2)
    for (let xx = 0; xx < MAP_W; xx += 2) {
      const t = tiles[yy][xx];
      m.fillStyle =
        t === 2
          ? '#367d9e'
          : t === 3
            ? '#214a28'
            : t === 4
              ? '#65645d'
              : t === 5
                ? '#857158'
                : t === 11
                  ? '#725238'
                  : t === 10
                    ? '#496a46'
                    : t === 12
                      ? '#d7e2ee'
                      : t === 13
                        ? '#3a342e'
                        : t === 14
                          ? '#d5622a'
                          : t === 1
                            ? '#a98c5c'
                            : '#4f7c37';
      m.fillRect(xx * sx, yy * sy, Math.ceil(sx * 2), Math.ceil(sy * 2));
    }
  minimapCache = c;
  return c;
}
function toWorld(sx, sy) {
  return { x: (sx + camera.x) / TILE, y: (sy + camera.y) / TILE };
}
function hash(x, y) {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0;
}
function drawTerrainTexture(t, x, y) {
  const names = {
      0: 'grass',
      1: 'road',
      2: 'water',
      3: 'forest',
      4: 'stone',
      5: 'floor',
      10: 'forest',
      11: 'road',
    },
    name = names[t],
    img = terrainTextures[name];
  if (!img?.complete || !img.naturalWidth) return;
  const n = hash(x, y),
    sx = (n % 3) * 32,
    sy = (Math.floor(n / 3) % 3) * 32,
    alpha = t === 3 ? 0.2 : t === 2 ? 0.18 : t === 10 ? 0.14 : 0.24;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, sx, sy, 32, 32, x * TILE, y * TILE, TILE, TILE);
  ctx.restore();
}
function drawTerrainDetails(t, x, y) {
  const X = x * TILE,
    Y = y * TILE,
    n = hash(x, y),
    px = 5 + (n % 22),
    py = 6 + ((n >>> 4) % 20);
  if (t === 0) {
    if (n % 7 === 0) {
      ctx.fillStyle = '#315b2e';
      ctx.fillRect(X + px, Y + py, 2, 6);
      ctx.fillStyle = '#668b42';
      ctx.fillRect(X + px - 2, Y + py + 1, 2, 2);
      ctx.fillRect(X + px + 2, Y + py + 2, 2, 2);
    }
    if (n % 13 === 0) {
      ctx.fillStyle = '#7c7b67';
      ctx.fillRect(X + px - 3, Y + py + 3, 6, 3);
      ctx.fillStyle = '#a3a18a';
      ctx.fillRect(X + px - 2, Y + py + 2, 3, 2);
    }
    if (n % 9 === 0) {
      ctx.fillStyle = n % 2 ? '#e4c74f' : '#d98bad';
      ctx.fillRect(X + px, Y + py, 2, 2);
      ctx.fillStyle = '#e7e0c2';
      ctx.fillRect(X + px + 2, Y + py + 1, 1, 1);
    }
  } else if (t === 1) {
    ctx.fillStyle = '#527536';
    if (tiles[y - 1]?.[x] === 0) {
      ctx.fillRect(X, Y, 32, 2);
      if (n % 2) ctx.fillRect(X + px, Y + 2, 4, 2);
    }
    if (tiles[y + 1]?.[x] === 0) {
      ctx.fillRect(X, Y + 30, 32, 2);
      if (n % 3) ctx.fillRect(X + px, Y + 28, 5, 2);
    }
    if (tiles[y]?.[x - 1] === 0) ctx.fillRect(X, Y, 2, 32);
    if (tiles[y]?.[x + 1] === 0) ctx.fillRect(X + 30, Y, 2, 32);
    if (n % 5 === 0) {
      ctx.fillStyle = '#6f6546';
      ctx.fillRect(X + px, Y + py, 3, 2);
    }
  } else if (t === 2) {
    ctx.strokeStyle = '#9cc7b4';
    ctx.lineWidth = 1;
    if (tiles[y - 1]?.[x] !== 2) {
      ctx.beginPath();
      ctx.moveTo(X, Y + 1);
      ctx.lineTo(X + 32, Y + 1);
      ctx.stroke();
    }
    if (tiles[y + 1]?.[x] !== 2) {
      ctx.beginPath();
      ctx.moveTo(X, Y + 31);
      ctx.lineTo(X + 32, Y + 31);
      ctx.stroke();
    }
    if (tiles[y]?.[x - 1] !== 2) {
      ctx.beginPath();
      ctx.moveTo(X + 1, Y);
      ctx.lineTo(X + 1, Y + 32);
      ctx.stroke();
    }
    if (tiles[y]?.[x + 1] !== 2) {
      ctx.beginPath();
      ctx.moveTo(X + 31, Y);
      ctx.lineTo(X + 31, Y + 32);
      ctx.stroke();
    }
  } else if (t === 3 && n % 5 === 0) {
    ctx.fillStyle = '#d8cf9e';
    ctx.fillRect(X + 4 + (n % 20), Y + 25, 2, 3);
  }
}
function drawTile(t, x, y) {
  const X = x * TILE,
    Y = y * TILE,
    n = hash(x, y);
  if (t === 0) {
    ctx.fillStyle = n % 3 ? '#527f38' : '#4b7633';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#74a451';
    if (n % 5 === 0) {
      ctx.fillRect(X + 8, Y + 9, 2, 5);
      ctx.fillRect(X + 11, Y + 11, 2, 4);
    }
    if (n % 13 === 0) {
      ctx.fillStyle = n % 2 ? '#e7cf70' : '#d78ca4';
      ctx.fillRect(X + 23, Y + 8, 3, 3);
    }
  } else if (t === 1) {
    ctx.fillStyle = n % 2 ? '#a28758' : '#987d52';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#b59a69';
    ctx.fillRect(X, Y, 32, 2);
    ctx.fillStyle = '#79623f';
    if (n % 3 === 0) ctx.fillRect(X + 6, Y + 21, 5, 2);
  } else if (t === 2) {
    ctx.fillStyle = '#2d7096';
    ctx.fillRect(X, Y, 32, 32);
    ctx.strokeStyle = '#63a6bd';
    ctx.lineWidth = 1;
    const wave = (frameTime / 250 + x * 5 + y * 3) % 12;
    ctx.beginPath();
    ctx.moveTo(X + 3, Y + wave);
    ctx.quadraticCurveTo(X + 15, Y + wave - 3, X + 29, Y + wave);
    ctx.stroke();
  } else if (t === 3) {
    ctx.fillStyle = '#315f2d';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#4b321e';
    ctx.fillRect(X + 14, Y + 21, 5, 11);
    ctx.strokeStyle = '#162d1a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#1f4a25';
    ctx.beginPath();
    ctx.moveTo(X + 16, Y + 1);
    ctx.lineTo(X + 3, Y + 18);
    ctx.lineTo(X + 29, Y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2f672c';
    ctx.beginPath();
    ctx.moveTo(X + 16, Y + 5);
    ctx.lineTo(X + 5, Y + 23);
    ctx.lineTo(X + 27, Y + 23);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4f8538';
    ctx.beginPath();
    ctx.moveTo(X + 15, Y + 7);
    ctx.lineTo(X + 9, Y + 16);
    ctx.lineTo(X + 18, Y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#78994a';
    if (n % 4 === 0) {
      ctx.fillRect(X + 8, Y + 18, 2, 2);
      ctx.fillRect(X + 23, Y + 13, 2, 2);
    }
  } else if (t === 4) {
    ctx.fillStyle = '#5a584f';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#77746a';
    ctx.fillRect(X, Y, 32, 4);
    ctx.strokeStyle = '#414039';
    ctx.strokeRect(X + 0.5, Y + 0.5, 31, 31);
    ctx.beginPath();
    ctx.moveTo(X, Y + 17);
    ctx.lineTo(X + 32, Y + 17);
    ctx.stroke();
  } else if (t === 5) {
    ctx.fillStyle = n % 2 ? '#8f7b5c' : '#857255';
    ctx.fillRect(X, Y, 32, 32);
    ctx.strokeStyle = '#675943';
    ctx.strokeRect(X + 0.5, Y + 0.5, 31, 31);
    ctx.fillStyle = '#a18c69';
    ctx.fillRect(X + 2, Y + 2, 12, 2);
  } else if (t === 6) {
    ctx.fillStyle = '#3d2516';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#7a512d';
    ctx.fillRect(X, Y + 3, 32, 9);
    ctx.fillStyle = '#9b6a39';
    ctx.fillRect(X, Y + 3, 32, 2);
  } else if (t === 7) {
    ctx.fillStyle = '#4f7b37';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#5f3d21';
    ctx.fillRect(X + 2, Y + 5, 5, 27);
    ctx.fillRect(X + 25, Y + 5, 5, 27);
    ctx.fillRect(X, Y + 12, 32, 5);
    ctx.fillStyle = '#8a6337';
    ctx.fillRect(X, Y + 12, 32, 2);
  } else if (t === 8) {
    ctx.fillStyle = '#565147';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#2f2c28';
    ctx.beginPath();
    ctx.arc(X + 16, Y + 18, 12, 0, 7);
    ctx.fill();
    const flick = Math.sin(frameTime / 110) * 2;
    ctx.fillStyle = '#c94d20';
    ctx.beginPath();
    ctx.moveTo(X + 16, Y + 4 + flick);
    ctx.lineTo(X + 25, Y + 25);
    ctx.lineTo(X + 7, Y + 25);
    ctx.fill();
    ctx.fillStyle = '#ffd45c';
    ctx.beginPath();
    ctx.moveTo(X + 16, Y + 11 - flick);
    ctx.lineTo(X + 20, Y + 24);
    ctx.lineTo(X + 12, Y + 24);
    ctx.fill();
  } else if (t === 10) {
    ctx.fillStyle = n % 2 ? '#486847' : '#405e40';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#344f3b';
    ctx.beginPath();
    ctx.ellipse(X + 9 + (n % 9), Y + 21, 8, 4, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#6f9270';
    ctx.lineWidth = 1;
    if (n % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(X + 24, Y + 26);
      ctx.lineTo(X + 22, Y + 13);
      ctx.moveTo(X + 25, Y + 25);
      ctx.lineTo(X + 29, Y + 16);
      ctx.stroke();
    }
    if (n % 5 === 0) {
      ctx.strokeStyle = '#75978b';
      ctx.beginPath();
      ctx.arc(X + 12, Y + 19, 4 + ((frameTime / 500) % 3), 0, 7);
      ctx.stroke();
    }
  } else if (t === 11) {
    ctx.fillStyle = '#65462f';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = n % 2 ? '#896442' : '#7b593c';
    for (let yy = 1; yy < 32; yy += 8) ctx.fillRect(X, Y + yy, 32, 6);
    ctx.strokeStyle = '#4b3425';
    ctx.lineWidth = 1;
    for (let yy = 0; yy <= 32; yy += 8) {
      ctx.beginPath();
      ctx.moveTo(X, Y + yy + 0.5);
      ctx.lineTo(X + 32, Y + yy + 0.5);
      ctx.stroke();
    }
    ctx.fillStyle = '#b08a5a';
    ctx.fillRect(X + 5, Y + 4, 2, 2);
    ctx.fillRect(X + 25, Y + 20, 2, 2);
  } else if (t === 12) {
    // snow (Frostmere)
    ctx.fillStyle = n % 3 ? '#e2eaf3' : '#d6e0ec';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#c5d2e1';
    if (n % 4 === 0) ctx.fillRect(X + 7, Y + 18, 5, 3);
    ctx.fillStyle = '#ffffff';
    if (n % 5 === 0) {
      ctx.fillRect(X + 21, Y + 8, 2, 2);
      ctx.fillRect(X + 12, Y + 24, 2, 2);
    }
  } else if (t === 13) {
    // ashen ground (Ashfall / Cinderforge)
    ctx.fillStyle = n % 3 ? '#3b352f' : '#332e28';
    ctx.fillRect(X, Y, 32, 32);
    ctx.fillStyle = '#48413a';
    if (n % 3 === 0) ctx.fillRect(X + 6, Y + 13, 6, 3);
    ctx.fillStyle = '#2b2723';
    if (n % 4 === 0) ctx.fillRect(X + 20, Y + 22, 5, 3);
    if (n % 9 === 0) {
      ctx.fillStyle = '#c05a27';
      ctx.fillRect(X + 15, Y + 16, 2, 2);
    }
  } else if (t === 14) {
    // lava (Cinderforge hazard)
    ctx.fillStyle = '#5c1e10';
    ctx.fillRect(X, Y, 32, 32);
    const glow = 0.5 + 0.5 * Math.sin(frameTime / 300 + x * 2 + y);
    ctx.fillStyle = '#d5541f';
    ctx.fillRect(X + 3, Y + 3, 26, 26);
    ctx.fillStyle = `rgba(255,196,64,${0.45 + glow * 0.4})`;
    ctx.beginPath();
    ctx.arc(X + 16, Y + 16, 7, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#3a140b';
    ctx.lineWidth = 1;
    ctx.strokeRect(X + 0.5, Y + 0.5, 31, 31);
  }
}
function drawBuildingInteriors(now) {
  const palettes = {
    heartwood: ['#887451', '#60472e', '#8e3d35'],
    castle: ['#77766f', '#55544f', '#63417b'],
    oakridge: ['#826d4d', '#593f29', '#7c3d37'],
    willow: ['#78805b', '#4b5638', '#426744'],
    frontier: ['#797269', '#504941', '#7a5437'],
    embercross: ['#826b4c', '#59412d', '#934d35'],
    mire: ['#77684c', '#4b3e2d', '#47674e'],
  };
  for (const b of buildings) {
    if (!onScreen(b.x + b.w / 2, b.y + b.h / 2, Math.max(b.w, b.h))) continue;
    const [X, Y, W, H] = [b.x * TILE, b.y * TILE, b.w * TILE, b.h * TILE],
      pal = palettes[b.style] || palettes.heartwood;
    ctx.fillStyle = pal[0];
    ctx.globalAlpha = 0.34;
    ctx.fillRect(X + 4, Y + 4, W - 8, H - 8);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = pal[1];
    ctx.lineWidth = 1;
    if (['oakridge', 'willow', 'mire', 'embercross'].includes(b.style)) {
      for (let yy = Y + 8; yy < Y + H; yy += 10) {
        ctx.beginPath();
        ctx.moveTo(X + 5, yy + 0.5);
        ctx.lineTo(X + W - 5, yy + 0.5);
        ctx.stroke();
      }
      for (let xx = X + 20; xx < X + W; xx += TILE) {
        ctx.beginPath();
        ctx.moveTo(xx + 0.5, Y + 5);
        ctx.lineTo(xx + 0.5, Y + H - 5);
        ctx.stroke();
      }
    } else {
      for (let yy = Y + TILE; yy < Y + H; yy += TILE) {
        ctx.beginPath();
        ctx.moveTo(X + 4, yy + 0.5);
        ctx.lineTo(X + W - 4, yy + 0.5);
        ctx.stroke();
      }
      for (let xx = X + TILE; xx < X + W; xx += TILE) {
        ctx.beginPath();
        ctx.moveTo(xx + 0.5, Y + 4);
        ctx.lineTo(xx + 0.5, Y + H - 4);
        ctx.stroke();
      }
    }
    const rw = Math.max(34, Math.min(W - 48, 96)),
      rh = Math.max(24, Math.min(H - 58, 48)),
      rx = X + (W - rw) / 2,
      ry = Y + (H - rh) / 2;
    ctx.fillStyle = '#2b2119';
    ctx.fillRect(rx - 3, ry - 3, rw + 6, rh + 6);
    ctx.fillStyle = pal[2];
    ctx.fillRect(rx, ry, rw, rh);
    ctx.strokeStyle = '#c3a45d';
    ctx.strokeRect(rx + 4.5, ry + 4.5, rw - 9, rh - 9);
    const shelfX = X + 10,
      shelfY = Y + TILE;
    ctx.fillStyle = '#3e2a1b';
    ctx.fillRect(shelfX, shelfY, 9, Math.min(62, H - 54));
    ctx.fillStyle = '#9a7445';
    for (let sy = shelfY + 5; sy < shelfY + Math.min(62, H - 54); sy += 14)
      ctx.fillRect(shelfX - 2, sy, 13, 3);
    ctx.fillStyle = '#604328';
    ctx.fillRect(X + W - 25, Y + H - 27, 17, 17);
    ctx.strokeStyle = '#a27c48';
    ctx.strokeRect(X + W - 24.5, Y + H - 26.5, 16, 16);
    ctx.beginPath();
    ctx.moveTo(X + W - 24, Y + H - 26);
    ctx.lineTo(X + W - 8, Y + H - 10);
    ctx.moveTo(X + W - 8, Y + H - 26);
    ctx.lineTo(X + W - 24, Y + H - 10);
    ctx.stroke();
    if (b.style === 'mire' || b.style === 'embercross') {
      const glow = 0.05 + 0.025 * Math.sin(now / 350 + b.x),
        g = ctx.createRadialGradient(X + W / 2, Y + H / 2, 5, X + W / 2, Y + H / 2, 100);
      g.addColorStop(0, `rgba(255,190,90,${glow})`);
      g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = g;
      ctx.fillRect(X, Y, W, H);
    }
  }
}
function drawBuildingWalls(now) {
  ctx.save();
  ctx.lineCap = 'square';
  for (const e of wallEdges) {
    let ax, ay, bx, by;
    if (e.y1 !== e.y2) {
      const y = Math.max(e.y1, e.y2) * TILE,
        x = e.x1 * TILE;
      ax = x;
      ay = y;
      bx = x + TILE;
      by = y;
    } else {
      const x = Math.max(e.x1, e.x2) * TILE,
        y = e.y1 * TILE;
      ax = x;
      ay = y;
      bx = x;
      by = y + TILE;
    }
    ctx.strokeStyle = '#25221e';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(ax, ay + 2);
    ctx.lineTo(bx, by + 2);
    ctx.stroke();
    ctx.strokeStyle = e.y1 !== e.y2 ? '#89857b' : '#706d66';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.strokeStyle = '#b7b0a0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay - 2);
    ctx.lineTo(bx, by - 2);
    ctx.stroke();
  }
  for (const b of buildings) {
    const X = b.x * TILE,
      Y = b.y * TILE,
      W = b.w * TILE,
      H = b.h * TILE,
      D = b.doorX * TILE;
    ctx.fillStyle = '#45433d';
    for (const [cx, cy] of [
      [X, Y],
      [X + W, Y],
      [X, Y + H],
      [X + W, Y + H],
    ])
      ctx.fillRect(cx - 4, cy - 4, 8, 8);
    ctx.fillStyle = '#34271c';
    ctx.fillRect(D + 4, Y + H - 5, 4, 13);
    ctx.fillRect(D + 24, Y + H - 5, 4, 13);
    ctx.fillRect(D + 4, Y + H - 7, 24, 4);
    ctx.fillStyle = '#9b7446';
    ctx.fillRect(D + 8, Y + H - 2, 16, 5);
    ctx.strokeStyle = '#d2b273';
    ctx.lineWidth = 1;
    ctx.strokeRect(D + 8.5, Y + H - 1.5, 15, 4);
    const windowY = Y - 4;
    ctx.fillStyle = '#1d3036';
    ctx.strokeStyle = '#d4bd83';
    for (let xx = X + TILE; xx < X + W - TILE / 2; xx += TILE * 2) {
      ctx.fillRect(xx + 7, windowY - 3, 17, 8);
      ctx.strokeRect(xx + 7.5, windowY - 2.5, 16, 7);
      ctx.beginPath();
      ctx.moveTo(xx + 15.5, windowY - 2);
      ctx.lineTo(xx + 15.5, windowY + 4);
      ctx.stroke();
    }
  }
  ctx.restore();
}
function drawDecor() {
  // fountain and useful landmarks
  const fountain = (x, y) => {
    ctx.fillStyle = '#747770';
    ctx.beginPath();
    ctx.ellipse(x, y + 7, 29, 13, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#4e94b7';
    ctx.beginPath();
    ctx.ellipse(x, y + 5, 22, 8, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#a3a49b';
    ctx.fillRect(x - 4, y - 20, 8, 25);
    ctx.fillStyle = '#78c5df';
    ctx.fillRect(x - 2, y - 27, 4, 24);
  };
  fountain(90 * TILE + 16, 124 * TILE + 16); // Greenrest Vale plaza fountain
  // Town labels above each settlement
  sign(96, 118, 'GREENREST VALE');
  sign(96, 56, 'PINEHOLT');
  sign(96, 10, 'FROSTMERE HOLD');
  sign(153, 60, 'THORNWOOD');
  sign(154, 120, 'CINDERFORGE');
  sign(36, 120, 'SABLEMARSH');
  sign(42, 48, 'ASHFALL WASTES');
}
function sign(x, y, text) {
  const X = x * TILE + 16,
    Y = y * TILE;
  ctx.fillStyle = '#432a18';
  ctx.fillRect(X - 2, Y - 7, 4, 13);
  ctx.fillStyle = '#77502c';
  ctx.fillRect(X - text.length * 3.3, Y - 20, text.length * 6.6, 15);
  ctx.strokeStyle = '#2a1a10';
  ctx.strokeRect(X - text.length * 3.3, Y - 20, text.length * 6.6, 15);
  ctx.font = '8px Georgia';
  ctx.fillStyle = '#f1d990';
  ctx.textAlign = 'center';
  ctx.fillText(text, X, Y - 9);
}
function drawResources() {
  for (const r of ROCKS) {
    const X = r.x * TILE + 16,
      Y = r.y * TILE + 18;
    ctx.fillStyle = '#242823';
    ctx.beginPath();
    ctx.moveTo(X - 13, Y + 9);
    ctx.lineTo(X - 9, Y - 8);
    ctx.lineTo(X + 1, Y - 14);
    ctx.lineTo(X + 13, Y - 5);
    ctx.lineTo(X + 12, Y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(X - 4, Y - 4, 4, 0, 7);
    ctx.arc(X + 6, Y + 1, 3, 0, 7);
    ctx.fill();
  }
  const X = FORGE.x * TILE + 16,
    Y = FORGE.y * TILE + 17;
  ctx.fillStyle = '#343a3b';
  ctx.fillRect(X - 13, Y - 1, 26, 8);
  ctx.fillStyle = '#70787a';
  ctx.fillRect(X - 9, Y - 8, 20, 8);
  ctx.fillStyle = '#222829';
  ctx.fillRect(X - 5, Y + 7, 10, 10);
}
function drawAltar(now) {
  const X = ALTAR.x * TILE + 16,
    Y = ALTAR.y * TILE + 18,
    g = 0.65 + 0.25 * Math.sin(now / 380);
  ctx.fillStyle = '#d8d2be';
  ctx.fillRect(X - 12, Y - 3, 24, 12);
  ctx.fillStyle = '#8e8878';
  ctx.fillRect(X - 9, Y + 9, 18, 5);
  ctx.fillStyle = `rgba(226,220,255,${g})`;
  ctx.beginPath();
  ctx.arc(X, Y - 8, 5, 0, 7);
  ctx.fill();
  ctx.strokeStyle = '#faf4c7';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(X, Y - 8, 9, 0, 7);
  ctx.stroke();
}
function drawWorkbench() {
  const X = WORKBENCH.x * TILE + 16,
    Y = WORKBENCH.y * TILE + 19;
  ctx.fillStyle = '#4b2f1c';
  ctx.fillRect(X - 13, Y - 2, 26, 7);
  ctx.fillRect(X - 10, Y + 5, 4, 10);
  ctx.fillRect(X + 6, Y + 5, 4, 10);
  ctx.fillStyle = '#9b693c';
  ctx.fillRect(X - 13, Y - 5, 26, 5);
  ctx.fillStyle = '#b47d93';
  ctx.fillRect(X - 8, Y - 10, 11, 6);
  ctx.strokeStyle = '#d7c5a8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(X + 6, Y - 9);
  ctx.lineTo(X + 11, Y - 2);
  ctx.stroke();
  ctx.fillStyle = '#e9dfc6';
  ctx.beginPath();
  ctx.arc(X + 6, Y - 9, 2, 0, 7);
  ctx.fill();
}
function drawCauldron(now) {
  const X = CAULDRON.x * TILE + 16,
    Y = CAULDRON.y * TILE + 20,
    bubble = Math.sin(now / 130);
  ctx.fillStyle = '#242a26';
  ctx.beginPath();
  ctx.ellipse(X, Y, 13, 9, 0, 0, 7);
  ctx.fill();
  ctx.fillRect(X - 11, Y - 2, 22, 9);
  ctx.strokeStyle = '#737b70';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(X, Y - 5, 12, Math.PI, 0);
  ctx.stroke();
  ctx.fillStyle = '#55a365';
  ctx.beginPath();
  ctx.ellipse(X, Y - 5, 10, 4, 0, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#a3e084';
  ctx.beginPath();
  ctx.arc(X - 4, Y - 7 - bubble * 2, 2, 0, 7);
  ctx.arc(X + 4, Y - 9 + bubble * 2, 1.5, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#3a2618';
  ctx.fillRect(X - 12, Y + 7, 5, 4);
  ctx.fillRect(X + 7, Y + 7, 5, 4);
}
function drawHuntSpots(now) {
  for (const p of HUNT_SPOTS) {
    const X = p.x * TILE + 16,
      Y = p.y * TILE + 21;
    ctx.fillStyle = '#26311d';
    ctx.beginPath();
    ctx.ellipse(X, Y, 11, 5, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#6a5737';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(X, Y - 2, 12, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#8a7954';
    ctx.fillRect(X - 9, Y - 7, 3, 5);
    ctx.fillRect(X + 6, Y - 7, 3, 5);
    if (skilling && skilling.type === 'hunt' && skilling.spot === p) {
      ctx.strokeStyle = '#d3b976';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X, Y - 5, 8 + Math.sin(now / 130), 0, 7);
      ctx.stroke();
      ctx.fillStyle = '#c8aa68';
      ctx.fillRect(X - 1, Y - 15, 2, 10);
    }
  }
}
function drawInnFurniture(now) {
  for (const [x, y] of [
    [101, 60],
    [101, 62],
  ]) {
    const X = x * TILE + 3,
      Y = y * TILE + 8;
    ctx.fillStyle = '#51331f';
    ctx.fillRect(X, Y, 26, 18);
    ctx.fillStyle = '#d8c6a0';
    ctx.fillRect(X + 3, Y + 2, 8, 14);
    ctx.fillStyle = '#7f3f38';
    ctx.fillRect(X + 11, Y + 2, 13, 14);
    ctx.strokeStyle = '#2d2017';
    ctx.strokeRect(X + 0.5, Y + 0.5, 25, 17);
  }
  const X = 107 * TILE + 16,
    Y = 61 * TILE + 20,
    f = Math.sin(now / 90) * 2;
  ctx.fillStyle = '#4a3425';
  ctx.fillRect(X - 10, Y - 3, 20, 8);
  ctx.fillStyle = '#d65b24';
  ctx.beginPath();
  ctx.moveTo(X, Y - 14 + f);
  ctx.lineTo(X + 7, Y + 3);
  ctx.lineTo(X - 7, Y + 3);
  ctx.fill();
  ctx.fillStyle = '#ffd36a';
  ctx.beginPath();
  ctx.moveTo(X, Y - 8 - f);
  ctx.lineTo(X + 3, Y + 2);
  ctx.lineTo(X - 3, Y + 2);
  ctx.fill();
}
function drawSignposts() {
  for (const s of SIGNPOSTS) {
    const X = s.x * TILE + 16,
      Y = s.y * TILE + 18;
    ctx.fillStyle = '#4a2d18';
    ctx.fillRect(X - 2, Y - 2, 5, 16);
    ctx.fillStyle = '#a1763d';
    ctx.fillRect(X - 12, Y - 10, 24, 10);
    ctx.strokeStyle = '#4a301b';
    ctx.strokeRect(X - 12.5, Y - 10.5, 25, 11);
    ctx.fillStyle = '#dbc06d';
    ctx.beginPath();
    ctx.moveTo(X + 8, Y - 7);
    ctx.lineTo(X + 3, Y - 4);
    ctx.lineTo(X + 8, Y - 1);
    ctx.fill();
  }
}
function drawFishingSpots(now) {
  for (const p of FISH_SPOTS) {
    const X = p.x * TILE + 16,
      Y = p.y * TILE + 16,
      r = 5 + ((now / 350 + p.x) % 5);
    ctx.strokeStyle = p.item === 'rawEel' ? '#8fc7a3' : '#8fd0e2';
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(X, Y, r, r * 0.45, 0, 0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(X, Y, r + 7, (r + 7) * 0.45, 0, 0, 7);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
function drawPortals(now) {
  for (const p of PORTALS) {
    const X = p.x * TILE + 16,
      Y = p.y * TILE + 16,
      glow = 0.4 + 0.28 * Math.sin(now / 320 + p.x);
    // stone pillars framing the doorway
    ctx.fillStyle = '#4a4640';
    ctx.fillRect(X - 15, Y - 14, 5, 28);
    ctx.fillRect(X + 10, Y - 14, 5, 28);
    ctx.fillStyle = '#5c574f';
    ctx.fillRect(X - 16, Y - 16, 32, 5);
    // dark doorway
    ctx.fillStyle = '#0b0810';
    ctx.beginPath();
    ctx.moveTo(X - 10, Y + 12);
    ctx.lineTo(X - 9, Y - 9);
    ctx.quadraticCurveTo(X, Y - 18, X + 9, Y - 9);
    ctx.lineTo(X + 10, Y + 12);
    ctx.closePath();
    ctx.fill();
    // swirling portal glow
    ctx.strokeStyle = `rgba(150,92,222,${glow})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(X, Y - 1, 7, 11, 0, 0, 7);
    ctx.stroke();
    ctx.fillStyle = `rgba(120,70,205,${glow * 0.5})`;
    ctx.beginPath();
    ctx.ellipse(X, Y - 1, 5, 9, 0, 0, 7);
    ctx.fill();
  }
}
function drawMirehavenDecor(now) {
  const posts = [
    [26, 128],
    [46, 128],
    [22, 134],
    [40, 134],
  ];
  for (const [x, y] of posts) {
    const X = x * TILE + 16,
      Y = y * TILE + 18,
      g = 0.22 + 0.12 * Math.sin(now / 260 + x);
    ctx.fillStyle = '#3b2b20';
    ctx.fillRect(X - 2, Y - 15, 4, 27);
    ctx.fillStyle = '#d9a84b';
    ctx.fillRect(X - 5, Y - 17, 10, 9);
    ctx.fillStyle = `rgba(255,198,80,${g})`;
    ctx.beginPath();
    ctx.arc(X, Y - 13, 15, 0, 7);
    ctx.fill();
  }
  for (const [x, y] of [
    [20, 138],
    [30, 138],
    [18, 144],
    [28, 148],
    [22, 150],
  ]) {
    const X = x * TILE + 16,
      Y = y * TILE + 23;
    ctx.strokeStyle = '#79935f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X - 5, Y);
    ctx.lineTo(X - 7, Y - 13);
    ctx.moveTo(X, Y);
    ctx.lineTo(X + 1, Y - 17);
    ctx.moveTo(X + 5, Y);
    ctx.lineTo(X + 8, Y - 12);
    ctx.stroke();
    ctx.fillStyle = '#9b7b4d';
    ctx.fillRect(X, Y - 19, 3, 6);
  }
}
function drawFarmPatches(now) {
  for (const p of FARM_PATCHES) {
    const X = p.x * TILE,
      Y = p.y * TILE,
      state = player.farm[p.id];
    ctx.fillStyle = '#513824';
    ctx.fillRect(X + 2, Y + 4, 28, 24);
    ctx.strokeStyle = '#2e2117';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(X + 5, Y + 9 + i * 7);
      ctx.lineTo(X + 27, Y + 9 + i * 7);
      ctx.stroke();
    }
    if (!state) continue;
    const progress = Math.max(
      0,
      Math.min(1, (Date.now() - state.plantedAt) / (state.readyAt - state.plantedAt)),
    );
    for (let i = 0; i < 3; i++) {
      const cx = X + 8 + i * 8,
        cy = Y + 17;
      ctx.fillStyle = progress >= 1 ? '#6fae42' : '#5b913e';
      ctx.beginPath();
      ctx.ellipse(cx - 2, cy, 3 + progress * 2, 2 + progress * 3, -0.5, 0, 7);
      ctx.ellipse(cx + 2, cy, 3 + progress * 2, 2 + progress * 3, 0.5, 0, 7);
      ctx.fill();
      if (progress >= 1) {
        ctx.fillStyle = '#a4d95d';
        ctx.beginPath();
        ctx.arc(cx, cy, 3, 0, 7);
        ctx.fill();
      }
    }
  }
}
function drawPortableFires(now) {
  for (const f of fires) {
    const X = f.x * TILE + 16,
      Y = f.y * TILE + 22,
      flick = Math.sin(now / 80 + f.x) * 3;
    ctx.strokeStyle = '#51301b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(X - 9, Y + 3);
    ctx.lineTo(X + 9, Y - 3);
    ctx.moveTo(X - 9, Y - 3);
    ctx.lineTo(X + 9, Y + 3);
    ctx.stroke();
    ctx.fillStyle = '#d95020';
    ctx.beginPath();
    ctx.moveTo(X, Y - 17 + flick);
    ctx.lineTo(X + 10, Y + 4);
    ctx.lineTo(X - 10, Y + 4);
    ctx.fill();
    ctx.fillStyle = '#ffd45b';
    ctx.beginPath();
    ctx.moveTo(X, Y - 9 - flick);
    ctx.lineTo(X + 5, Y + 3);
    ctx.lineTo(X - 5, Y + 3);
    ctx.fill();
  }
}
function drawDungeonPuzzle(now) {
  const lx = DUNGEON_LEVER.x * TILE + 16,
    ly = DUNGEON_LEVER.y * TILE + 18;
  ctx.fillStyle = '#30271f';
  ctx.fillRect(lx - 9, ly + 4, 18, 8);
  ctx.strokeStyle = '#a28a62';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(lx, ly + 5);
  ctx.lineTo(lx + (player.barrowGateOpen ? 8 : -7), ly - 11);
  ctx.stroke();
  ctx.fillStyle = '#b34d35';
  ctx.beginPath();
  ctx.arc(lx + (player.barrowGateOpen ? 8 : -7), ly - 11, 4, 0, 7);
  ctx.fill();
  if (!player.barrowGateOpen) {
    const gx = DUNGEON_GATE.x * TILE,
      gy = DUNGEON_GATE.y * TILE;
    ctx.fillStyle = '#1e1c1a';
    ctx.fillRect(gx, gy, 32, 32);
    ctx.strokeStyle = '#77736b';
    ctx.lineWidth = 4;
    for (let x = 5; x < 32; x += 8) {
      ctx.beginPath();
      ctx.moveTo(gx + x, gy - 3);
      ctx.lineTo(gx + x, gy + 35);
      ctx.stroke();
    }
    ctx.strokeStyle = '#4d4944';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gx, gy + 15);
    ctx.lineTo(gx + 32, gy + 15);
    ctx.stroke();
  }
}
function drawBarrowTablets(now) {
  for (const t of BARROW_TABLETS) {
    const X = t.x * TILE + 16,
      Y = t.y * TILE + 17,
      found = !!player.barrowLore[t.id],
      glow = 0.35 + 0.2 * Math.sin(now / 180 + t.x);
    if (found) {
      ctx.fillStyle = `rgba(104,190,225,${glow})`;
      ctx.beginPath();
      ctx.arc(X, Y, 15, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = found ? '#718a8f' : '#68635a';
    ctx.strokeStyle = found ? '#a9e5ef' : '#9b927f';
    ctx.lineWidth = 2;
    ctx.fillRect(X - 10, Y - 14, 20, 25);
    ctx.strokeRect(X - 10.5, Y - 14.5, 21, 26);
    ctx.strokeStyle = found ? '#bff4ff' : '#b4a36f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(X - 5, Y - 8);
    ctx.lineTo(X + 5, Y - 3);
    ctx.lineTo(X - 4, Y + 2);
    ctx.lineTo(X + 5, Y + 7);
    ctx.stroke();
  }
}
function drawDungeonFeatures(now) {
  const X = DUNGEON_CHEST.x * TILE + 16,
    Y = DUNGEON_CHEST.y * TILE + 18;
  const ready = typeof barrowChestReady === 'function' && barrowChestReady();
  ctx.fillStyle = ready ? '#8a5d28' : '#443226';
  ctx.fillRect(X - 13, Y - 10, 26, 20);
  if (ready) {
    const glow = 0.28 + 0.2 * Math.sin(now / 150);
    ctx.fillStyle = `rgba(255,208,83,${glow})`;
    ctx.beginPath();
    ctx.arc(X, Y, 19, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#a7793c';
  ctx.fillRect(X - 13, Y - 10, 26, 5);
  ctx.fillStyle = '#d2af58';
  ctx.fillRect(X - 3, Y - 2, 6, 7);
  for (const h of hazards) {
    const alpha = 0.25 + 0.3 * Math.abs(Math.sin(now / 100));
    ctx.fillStyle = `rgba(255,74,28,${alpha})`;
    ctx.strokeStyle = '#ffb34b';
    ctx.lineWidth = 2;
    for (const [x, y] of h.tiles) {
      ctx.fillRect(x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4);
      ctx.strokeRect(x * TILE + 3, y * TILE + 3, TILE - 6, TILE - 6);
    }
  }
}
function drawGravestone(now) {
  const g = player.grave;
  if (!g) return;
  const X = g.x * TILE + 16,
    Y = g.y * TILE + 20,
    pulse = 0.35 + 0.25 * Math.sin(now / 250);
  ctx.fillStyle = '#272a28';
  ctx.fillRect(X - 9, Y - 14, 18, 22);
  ctx.beginPath();
  ctx.arc(X, Y - 14, 9, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#74766f';
  ctx.fillRect(X - 6, Y - 8, 12, 2);
  ctx.fillRect(X - 1, Y - 13, 2, 11);
  ctx.fillStyle = `rgba(220,230,226,${pulse})`;
  ctx.beginPath();
  ctx.arc(X, Y - 5, 17, 0, 7);
  ctx.fill();
  ctx.fillStyle = '#d8dfdc';
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText('GRAVE', X, Y - 29);
}
function drawDungeonLighting(w, h) {
  if (!inDungeon(player.x, player.y)) return;
  const px = player.drawX * TILE + 16 - camera.x,
    py = player.drawY * TILE + 16 - camera.y,
    radius = invCount('barrowLantern') ? 365 : 290,
    g = ctx.createRadialGradient(px, py, 55, px, py, radius);
  g.addColorStop(0, 'rgba(5,4,8,0)');
  g.addColorStop(0.52, 'rgba(5,4,8,.16)');
  g.addColorStop(1, 'rgba(5,4,8,.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(20,10,8,.10)';
  ctx.fillRect(0, 0, w, h);
}
function actor(x, y, color, name, kind = 'human', opts = {}) {
  const X = x * TILE + 16,
    Y = y * TILE + 17,
    bob =
      (opts.walking ? Math.sin(frameTime / 65) * 1.5 : 0) +
      (opts.attacking ? Math.sin(frameTime / 32) * 2 : 0);
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = '#0006';
  ctx.beginPath();
  ctx.ellipse(X, Y + 12, 11, 5, 0, 0, 7);
  ctx.fill();
  // EF1: tight dark rim so sprites read cleanly against terrain (reset by ctx.restore below)
  ctx.shadowColor = 'rgba(0,0,0,0.92)';
  ctx.shadowBlur = 2.6;
  if (kind === 'goblin' || kind === 'warden' || kind === 'bogling') {
    ctx.fillStyle = '#3c2a1d';
    ctx.fillRect(X - 8, Y + 4, 6, 11);
    ctx.fillRect(X + 2, Y + 4, 6, 11);
    ctx.fillStyle = color;
    ctx.fillRect(X - 8, Y - 7, 16, 17);
    ctx.beginPath();
    ctx.arc(X, Y - 12, kind === 'warden' ? 11 : 9, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#d9cc6d';
    ctx.fillRect(X - 5, Y - 14, 3, 2);
    ctx.fillRect(X + 3, Y - 14, 3, 2);
    if (kind === 'goblin') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(X - 8, Y - 15);
      ctx.lineTo(X - 16, Y - 19);
      ctx.lineTo(X - 9, Y - 9);
      ctx.moveTo(X + 8, Y - 15);
      ctx.lineTo(X + 16, Y - 19);
      ctx.lineTo(X + 9, Y - 9);
      ctx.fill();
      ctx.fillStyle = '#88a85f';
      ctx.fillRect(X - 2, Y - 11, 5, 4);
      ctx.fillStyle = '#35291e';
      ctx.fillRect(X - 8, Y + 1, 16, 3);
      ctx.fillStyle = '#b65b45';
      ctx.fillRect(X - 4, Y - 7, 8, 2);
    }
    if (kind === 'warden') {
      ctx.fillStyle = '#6a362d';
      ctx.fillRect(X - 13, Y - 6, 6, 9);
      ctx.fillRect(X + 7, Y - 6, 6, 9);
      ctx.fillStyle = '#d19545';
      ctx.fillRect(X - 11, Y - 8, 5, 4);
      ctx.fillRect(X + 6, Y - 8, 5, 4);
    }
    ctx.fillStyle = '#51412a';
    ctx.fillRect(X + 7, Y - 5, 3, 17);
    if (kind === 'bogling') {
      ctx.strokeStyle = '#7ea55c';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(X - 7, Y - 4);
      ctx.lineTo(X - 13, Y - 11);
      ctx.moveTo(X + 5, Y - 7);
      ctx.lineTo(X + 12, Y - 15);
      ctx.moveTo(X, Y - 19);
      ctx.lineTo(X - 3, Y - 26);
      ctx.stroke();
      ctx.fillStyle = '#9acb67';
      ctx.fillRect(X - 14, Y - 13, 4, 4);
      ctx.fillRect(X + 10, Y - 17, 4, 4);
      ctx.fillStyle = '#37533b';
      ctx.fillRect(X - 6, Y + 1, 12, 3);
    }
    if (kind === 'warden') {
      ctx.fillStyle = '#d09648';
      ctx.fillRect(X - 9, Y - 5, 18, 4);
      ctx.fillRect(X - 7, Y + 3, 14, 3);
      ctx.strokeStyle = '#f0b457';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X, Y - 12, 13, Math.PI, 0);
      ctx.stroke();
    }
  } else if (kind === 'wolf') {
    ctx.strokeStyle = '#2c3235';
    ctx.lineWidth = 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(X - 1, Y, 14, 9, -0.08, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(X + 5, Y - 5);
    ctx.lineTo(X + 11, Y - 15);
    ctx.lineTo(X + 17, Y - 8);
    ctx.lineTo(X + 15, Y + 1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#7e8990';
    ctx.beginPath();
    ctx.moveTo(X + 8, Y - 13);
    ctx.lineTo(X + 8, Y - 21);
    ctx.lineTo(X + 13, Y - 15);
    ctx.moveTo(X + 13, Y - 13);
    ctx.lineTo(X + 17, Y - 20);
    ctx.lineTo(X + 18, Y - 11);
    ctx.fill();
    ctx.fillStyle = '#b9b7a8';
    ctx.fillRect(X + 13, Y - 6, 8, 5);
    ctx.fillStyle = '#1b1715';
    ctx.fillRect(X + 19, Y - 5, 3, 3);
    ctx.fillStyle = '#e0b951';
    ctx.fillRect(X + 12, Y - 10, 2, 2);
    ctx.fillStyle = '#333a3c';
    ctx.fillRect(X - 11, Y + 5, 4, 11);
    ctx.fillRect(X + 5, Y + 5, 4, 11);
    ctx.strokeStyle = '#596369';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(X - 13, Y - 2);
    ctx.quadraticCurveTo(X - 23, Y - 10, X - 19, Y - 18);
    ctx.stroke();
    ctx.strokeStyle = '#aeb7b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X - 7, Y - 6);
    ctx.lineTo(X + 5, Y - 8);
    ctx.stroke();
  } else if (kind === 'boar') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(X, Y, 14, 9, 0, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X + 9, Y - 5, 8, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#3b291f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X - 8, Y - 7);
    ctx.lineTo(X - 4, Y - 13);
    ctx.lineTo(X, Y - 8);
    ctx.lineTo(X + 4, Y - 13);
    ctx.lineTo(X + 8, Y - 7);
    ctx.stroke();
    ctx.fillStyle = '#d8b08f';
    ctx.fillRect(X + 14, Y - 4, 5, 3);
    ctx.strokeStyle = '#eee0be';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X + 12, Y);
    ctx.lineTo(X + 16, Y + 4);
    ctx.moveTo(X + 15, Y);
    ctx.lineTo(X + 19, Y + 3);
    ctx.stroke();
    ctx.fillStyle = '#251912';
    ctx.fillRect(X + 11, Y - 8, 2, 2);
    ctx.fillRect(X - 9, Y + 6, 4, 8);
    ctx.fillRect(X + 5, Y + 6, 4, 8);
  } else if (kind === 'rat') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(X, Y, 13, 8, -0.15, 0, 7);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(X - 7, Y - 7, 4, 0, 7);
    ctx.arc(X + 1, Y - 8, 4, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#32251f';
    ctx.fillRect(X - 8, Y + 5, 3, 7);
    ctx.fillRect(X + 4, Y + 5, 3, 7);
    ctx.fillStyle = '#e5a7a2';
    ctx.fillRect(X + 11, Y - 1, 3, 3);
    ctx.fillStyle = '#e8c65d';
    ctx.fillRect(X + 5, Y - 5, 2, 2);
    ctx.strokeStyle = '#c3958a';
    ctx.beginPath();
    ctx.moveTo(X + 11, Y + 1);
    ctx.quadraticCurveTo(X + 22, Y + 5, X + 18, Y + 12);
    ctx.stroke();
  } else if (kind === 'bat') {
    const flap = 5 + Math.sin(frameTime / 70) * 5;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(X, Y);
    ctx.quadraticCurveTo(X - 10, Y - flap, X - 16, Y - 9 - flap);
    ctx.lineTo(X - 13, Y + 5);
    ctx.quadraticCurveTo(X - 7, Y + 1, X, Y + 3);
    ctx.quadraticCurveTo(X + 7, Y + 1, X + 13, Y + 5);
    ctx.lineTo(X + 16, Y - 9 - flap);
    ctx.quadraticCurveTo(X + 10, Y - flap, X, Y);
    ctx.fill();
    ctx.strokeStyle = '#9a7b9c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(X, Y);
    ctx.lineTo(X - 13, Y - 8 - flap);
    ctx.moveTo(X, Y);
    ctx.lineTo(X + 13, Y - 8 - flap);
    ctx.stroke();
    ctx.fillStyle = '#392d3c';
    ctx.beginPath();
    ctx.ellipse(X, Y, 7, 9, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#e46e63';
    ctx.fillRect(X - 4, Y - 3, 2, 2);
    ctx.fillRect(X + 2, Y - 3, 2, 2);
    ctx.fillStyle = '#8c748e';
    ctx.beginPath();
    ctx.moveTo(X - 5, Y - 7);
    ctx.lineTo(X - 8, Y - 14);
    ctx.lineTo(X - 1, Y - 9);
    ctx.moveTo(X + 5, Y - 7);
    ctx.lineTo(X + 8, Y - 14);
    ctx.lineTo(X + 1, Y - 9);
    ctx.fill();
  } else if (kind === 'spider') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 2)
      for (let j = -1; j <= 1; j += 2) {
        ctx.beginPath();
        ctx.moveTo(X + i * 4, Y + j * 2);
        ctx.lineTo(X + i * 13, Y + j * 9);
        ctx.stroke();
      }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(X, Y, 9, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#765075';
    ctx.beginPath();
    ctx.ellipse(X, Y + 8, 7, 9, 0, 0, 7);
    ctx.fill();
    ctx.strokeStyle = '#8c6590';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X - 4, Y);
    ctx.lineTo(X - 15, Y);
    ctx.lineTo(X - 18, Y + 6);
    ctx.moveTo(X + 4, Y);
    ctx.lineTo(X + 15, Y);
    ctx.lineTo(X + 18, Y + 6);
    ctx.stroke();
    ctx.fillStyle = '#dc6f64';
    ctx.fillRect(X - 4, Y - 3, 2, 2);
    ctx.fillRect(X + 3, Y - 3, 2, 2);
  } else if (kind === 'skeleton' || kind === 'guardian') {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(X, Y - 5);
    ctx.lineTo(X, Y + 12);
    ctx.moveTo(X - 8, Y);
    ctx.lineTo(X + 8, Y);
    ctx.moveTo(X, Y + 11);
    ctx.lineTo(X - 7, Y + 18);
    ctx.moveTo(X, Y + 11);
    ctx.lineTo(X + 7, Y + 18);
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (let ry = -2; ry < 7; ry += 4) {
      ctx.beginPath();
      ctx.moveTo(X - 6, Y + ry);
      ctx.lineTo(X + 6, Y + ry);
      ctx.stroke();
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(X, Y - 12, 8, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#25231e';
    ctx.fillRect(X - 4, Y - 14, 2, 3);
    ctx.fillRect(X + 3, Y - 14, 2, 3);
  } else {
    const face = opts.facing || 'south';
    if (opts.player && opts.armor) {
      ctx.fillStyle =
        opts.armor === 'explorerCape'
          ? '#28566d'
          : opts.armor === 'wardenCloak'
            ? '#4c2e43'
            : '#3f4934';
      ctx.beginPath();
      ctx.moveTo(X - 8, Y - 5);
      ctx.lineTo(X - 11, Y + 13);
      ctx.lineTo(X, Y + 18);
      ctx.lineTo(X + 11, Y + 13);
      ctx.lineTo(X + 8, Y - 5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#302116';
    ctx.fillRect(X - 7, Y + 6, 5, 10);
    ctx.fillRect(X + 2, Y + 6, 5, 10);
    ctx.fillStyle =
      opts.armor === 'ironArmor'
        ? '#747c7d'
        : opts.armor === 'leatherBody'
          ? '#8b5a35'
          : opts.armor === 'silkRobe'
            ? '#714f7f'
            : opts.armor === 'wardenCloak'
              ? '#633f4f'
              : opts.armor === 'willowMantle'
                ? '#527348'
                : opts.armor === 'explorerCape'
                  ? '#3d7187'
                  : color;
    ctx.fillRect(X - 8, Y - 6, 16, 17);
    const tunic = ctx.fillStyle;
    ctx.fillStyle = '#0004';
    ctx.fillRect(X + 5, Y - 5, 3, 15);
    ctx.fillStyle = tunic;
    ctx.fillRect(X - 11, Y - 4, 4, 11);
    ctx.fillRect(X + 7, Y - 4, 4, 11);
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(X - 8, Y + 4, 16, 3);
    ctx.fillStyle = '#c5a15d';
    ctx.fillRect(X - 1, Y + 4, 3, 3);
    ctx.fillStyle = '#c99c72';
    ctx.fillRect(X - 11, Y + 5, 4, 4);
    ctx.fillRect(X + 7, Y + 5, 4, 4);
    ctx.fillStyle = '#c99c72';
    ctx.beginPath();
    ctx.arc(X, Y - 13, 7, 0, 7);
    ctx.fill();
    ctx.fillStyle = '#352218';
    ctx.fillRect(X - 7, Y - 20, 14, 5);
    ctx.fillRect(X - 8, Y - 18, 3, 8);
    if (hash(name.length, name.charCodeAt(0)) % 3 === 0) {
      ctx.fillStyle = '#5a3721';
      ctx.fillRect(X - 5, Y - 9, 10, 2);
    }
    if (face !== 'north') {
      ctx.fillStyle = '#20170f';
      ctx.fillRect(X + (face === 'west' ? -4 : face === 'east' ? 3 : -4), Y - 14, 2, 2);
      if (face === 'south') ctx.fillRect(X + 3, Y - 14, 2, 2);
    }
    if (opts.id === 'banker') {
      ctx.fillStyle = '#72548e';
      ctx.fillRect(X - 8, Y - 22, 16, 4);
      ctx.fillStyle = '#d7b65e';
      ctx.fillRect(X - 2, Y - 24, 4, 3);
    } else if (opts.id === 'murphy') {
      ctx.fillStyle = '#89704c';
      ctx.fillRect(X - 10, Y - 21, 20, 3);
      ctx.fillRect(X - 6, Y - 25, 12, 5);
    } else if (opts.id === 'mira') {
      ctx.fillStyle = '#ddd2b2';
      ctx.fillRect(X - 14, Y, 7, 9);
      ctx.strokeStyle = '#6c4f3a';
      ctx.strokeRect(X - 14.5, Y - 0.5, 8, 10);
    } else if (opts.id === 'bren' || opts.id === 'rowan') {
      ctx.fillStyle = '#777f82';
      ctx.fillRect(X - 8, Y - 22, 16, 5);
      ctx.fillRect(X - 6, Y - 25, 12, 4);
    } else if (opts.id === 'sable' || opts.id === 'edric') {
      ctx.strokeStyle = '#d9d3aa';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X, Y - 2, 4, 0, 7);
      ctx.stroke();
    } else if (opts.role && opts.role.includes('trader')) {
      ctx.fillStyle = '#d4c29b';
      ctx.fillRect(X - 6, Y - 2, 12, 13);
      ctx.fillStyle = '#694c32';
      ctx.fillRect(X - 1, Y - 2, 2, 13);
    }
    if (kind === 'bandit') {
      ctx.fillStyle = '#35251c';
      ctx.fillRect(X - 8, Y - 19, 16, 7);
      ctx.fillStyle = '#d8c18d';
      ctx.fillRect(X - 5, Y - 14, 10, 2);
      ctx.strokeStyle = '#9b7749';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(X + 9, Y - 4);
      ctx.lineTo(X + 15, Y + 12);
      ctx.stroke();
    }
    if (opts.player && opts.shield) {
      ctx.fillStyle = '#8f7445';
      ctx.strokeStyle = '#d0b16a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(X - 10, Y + 1, 7, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#c5a15d';
      ctx.fillRect(X - 11, Y - 4, 2, 10);
    }
    if (opts.player && opts.gloves) {
      ctx.fillStyle = opts.gloves === 'furGloves' ? '#d3c2a0' : '#8a7055';
      ctx.fillRect(X - 11, Y + 2, 4, 6);
      ctx.fillRect(X + 7, Y + 2, 4, 6);
    }
    if (opts.player && opts.weapon) {
      const magic = opts.weapon === 'emberStaff';
      ctx.strokeStyle = magic ? '#8e56ba' : opts.weapon === 'steelSword' ? '#e7edf1' : '#c9c2a7';
      ctx.lineWidth = magic ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(X + 9, Y - 5);
      ctx.lineTo(X + 14, Y + 12);
      ctx.stroke();
      ctx.fillStyle = magic ? '#d879ff' : '#8b6335';
      if (magic) {
        ctx.beginPath();
        ctx.arc(X + 8, Y - 7, 3, 0, 7);
        ctx.fill();
      } else ctx.fillRect(X + 8, Y + 5, 8, 2);
    }
  }
  ctx.restore();
  ctx.font = '11px Georgia';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText(name, X, Y - 29 + bob);
  ctx.fillStyle = opts.player ? '#f7dd78' : '#fff';
  ctx.fillText(name, X, Y - 29 + bob);
}
function drawNpcSpeech() {
  for (const n of NPCS) {
    if (!n.speech || tickCount >= n.speechUntil || !onScreen(n.drawX, n.drawY)) continue;
    const X = n.drawX * TILE + 16,
      Y = n.drawY * TILE - 45,
      text = n.speech;
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    const w = Math.min(190, ctx.measureText(text).width + 16);
    ctx.fillStyle = '#11120fea';
    ctx.fillRect(X - w / 2, Y - 15, w, 20);
    ctx.strokeStyle = '#8b7445';
    ctx.strokeRect(X - w / 2 + 0.5, Y - 14.5, w - 1, 19);
    ctx.fillStyle = '#eee2be';
    ctx.fillText(text, X, Y - 2);
    ctx.fillStyle = '#11120fea';
    ctx.beginPath();
    ctx.moveTo(X - 4, Y + 5);
    ctx.lineTo(X, Y + 11);
    ctx.lineTo(X + 4, Y + 5);
    ctx.fill();
  }
}
function healthbar(e) {
  const X = e.x * TILE + 5,
    Y = e.y * TILE - 5;
  ctx.fillStyle = '#541d1b';
  ctx.fillRect(X, Y, 22, 4);
  ctx.fillStyle = '#65a94b';
  ctx.fillRect(X, Y, (22 * e.hp) / e.maxHp, 4);
}
function monsterVisual(m, now) {
  if (!m.moveAt) return { x: m.drawX, y: m.drawY };
  const p = Math.min(1, (now - m.moveAt) / (TICK_MS * 0.72)),
    ease = 1 - Math.pow(1 - p, 3);
  m.drawX = m.fromX + (m.x - m.fromX) * ease;
  m.drawY = m.fromY + (m.y - m.fromY) * ease;
  if (p >= 1) {
    m.drawX = m.x;
    m.drawY = m.y;
  }
  return { x: m.drawX, y: m.drawY };
}
function drawGroundDrop(d, now) {
  const X = d.x * TILE + 16,
    Y = d.y * TILE + 18 + Math.sin(now / 180 + d.x) * 2,
    item = ITEMS[d.item];
  ctx.save();
  ctx.shadowColor = d.item === 'coins' ? '#ffe06a' : '#f3e7bf';
  ctx.shadowBlur = 7;
  ctx.fillStyle = d.item === 'coins' ? '#f2c95c' : '#e4dac0';
  ctx.font = 'bold 13px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(item.icon, X, Y);
  ctx.shadowBlur = 0;
  if (d.q > 1) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 9px Arial';
    ctx.strokeText(String(d.q), X + 8, Y + 7);
    ctx.fillText(String(d.q), X + 8, Y + 7);
  }
  ctx.restore();
}
function drawGroundLabels() {
  const pile = drops.filter((d) => d.x === hover.x && d.y === hover.y);
  if (!pile.length) return;
  ctx.save();
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  const X = hover.x * TILE + 16;
  pile.slice(0, 5).forEach((d, i) => {
    const label = `${ITEMS[d.item].name}${d.q > 1 ? ' x' + d.q : ''}`,
      Y = hover.y * TILE - 8 - i * 17,
      w = ctx.measureText(label).width + 10;
    ctx.fillStyle = '#080907dd';
    ctx.fillRect(X - w / 2, Y - 11, w, 15);
    ctx.strokeStyle = d.item === 'coins' ? '#c9a33f' : '#665b43';
    ctx.strokeRect(X - w / 2 + 0.5, Y - 10.5, w - 1, 14);
    ctx.fillStyle = d.item === 'coins' ? '#f3cf63' : '#eee5cc';
    ctx.fillText(label, X, Y);
  });
  ctx.restore();
}
function drawProjectiles(now) {
  projectiles = projectiles.filter((p) => now - p.at < p.duration);
  for (const p of projectiles) {
    const t = Math.min(1, (now - p.at) / p.duration),
      x = (p.sx + (p.tx - p.sx) * t) * TILE + 16,
      y = (p.sy + (p.ty - p.sy) * t) * TILE + 16,
      a = Math.atan2(p.ty - p.sy, p.tx - p.sx);
    ctx.save();
    ctx.translate(x, y);
    if (p.kind === 'magic') {
      const pulse = 6 + Math.sin(now / 45) * 2,
        g = ctx.createRadialGradient(0, 0, 1, 0, 0, pulse * 2);
      g.addColorStop(0, '#fff4b0');
      g.addColorStop(0.35, '#d871ff');
      g.addColorStop(1, 'rgba(114,38,190,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, pulse * 2, 0, 7);
      ctx.fill();
      ctx.strokeStyle = '#e7a3ff';
      ctx.rotate(now / 140);
      ctx.strokeRect(-pulse, -pulse, pulse * 2, pulse * 2);
    } else {
      ctx.rotate(a);
      ctx.strokeStyle = '#f0d08a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(8, 0);
      ctx.stroke();
      ctx.fillStyle = '#d7d1bd';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(3, -3);
      ctx.lineTo(3, 3);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}
function render(now) {
  frameTime = now;
  const w = canvas.clientWidth,
    h = canvas.clientHeight,
    targetX = Math.max(0, Math.min(MAP_W * TILE - w, player.drawX * TILE + 16 - w / 2)),
    targetY = Math.max(0, Math.min(MAP_H * TILE - h, player.drawY * TILE + 16 - h / 2));
  if (!camera.ready) {
    camera.x = targetX;
    camera.y = targetY;
    camera.ready = true;
  } else {
    camera.x += (targetX - camera.x) * 0.16;
    camera.y += (targetY - camera.y) * 0.16;
  }
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(-Math.floor(camera.x), -Math.floor(camera.y));
  const x0 = Math.floor(camera.x / TILE),
    y0 = Math.floor(camera.y / TILE),
    x1 = Math.min(MAP_W, x0 + Math.ceil(w / TILE) + 2),
    y1 = Math.min(MAP_H, y0 + Math.ceil(h / TILE) + 2);
  if (USE_WORLD_ARTWORK && worldArtwork.complete && worldArtwork.naturalWidth) {
    ctx.drawImage(worldArtwork, 0, 0, MAP_W * TILE, MAP_H * TILE);
  } else {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) drawTile(tiles[y][x], x, y);
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        drawTerrainTexture(tiles[y][x], x, y);
        drawTerrainDetails(tiles[y][x], x, y);
      }
    drawBuildingInteriors(now);
    drawBuildingWalls(now);
    drawDecor();
    drawInnFurniture(now);
  }
  drawHuntSpots(now);
  drawResources();
  drawAltar(now);
  drawWorkbench();
  drawCauldron(now);
  drawFishingSpots(now);
  drawSignposts();
  drawPortals(now);
  drawMirehavenDecor(now);
  drawFarmPatches(now);
  drawPortableFires(now);
  drawDungeonPuzzle(now);
  drawDungeonFeatures(now);
  drawBarrowTablets(now);
  drawGravestone(now);
  ctx.fillStyle = '#ffdf5125';
  ctx.strokeStyle = '#ffe581';
  ctx.lineWidth = 1;
  ctx.fillRect(hover.x * TILE, hover.y * TILE, TILE, TILE);
  ctx.strokeRect(hover.x * TILE + 0.5, hover.y * TILE + 0.5, TILE - 1, TILE - 1);
  if (destination) {
    const pulse = 5 + Math.sin(now / 110) * 2;
    ctx.strokeStyle = '#ffe06b';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      destination.x * TILE + pulse,
      destination.y * TILE + pulse,
      32 - pulse * 2,
      32 - pulse * 2,
    );
  }
  NPCS.forEach((n) => {
    const v = monsterVisual(n, now);
    if (onScreen(v.x, v.y))
      actor(v.x, v.y, n.color, n.name, 'human', {
        walking: now - n.moveAt < TICK_MS * 0.8,
        id: n.id,
        role: n.role,
        facing: n.facing || 'south',
      });
  });
  drawNpcSpeech();
  const qNpc = questNpcId();
  for (const marker of questMarkers()) {
    const n = NPCS.find((v) => v.id === marker.id);
    if (n && onScreen(n.x, n.y)) {
      ctx.font = 'bold 22px Georgia';
      ctx.textAlign = 'center';
      ctx.fillStyle = marker.color;
      ctx.strokeStyle = '#34220e';
      ctx.lineWidth = 4;
      ctx.strokeText(marker.symbol, n.x * TILE + 16, n.y * TILE - 22);
      ctx.fillText(marker.symbol, n.x * TILE + 16, n.y * TILE - 22);
    }
  }
  monsters
    .filter((m) => m.alive)
    .forEach((m) => {
      const v = monsterVisual(m, now);
      if (!onScreen(v.x, v.y)) return;
      if (m === combat) {
        ctx.strokeStyle = '#e9c04f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(v.x * TILE + 16, v.y * TILE + 27, 15, 7, 0, 0, 7);
        ctx.stroke();
      }
      if (m.kind === 'warden' && m.enraged) {
        const pulse = 18 + Math.sin(now / 90) * 3;
        ctx.strokeStyle = '#d95cff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(v.x * TILE + 16, v.y * TILE + 2, pulse, 0, 7);
        ctx.stroke();
        ctx.fillStyle = '#b83cff22';
        ctx.beginPath();
        ctx.arc(v.x * TILE + 16, v.y * TILE + 2, pulse - 2, 0, 7);
        ctx.fill();
      }
      actor(v.x, v.y, m.type.color, m.type.name, m.kind, { attacking: now - m.attackAt < 260 });
      if (m.hp < m.maxHp) healthbar({ ...m, x: v.x, y: v.y });
    });
  drops.filter((d) => onScreen(d.x, d.y)).forEach((d) => drawGroundDrop(d, now));
  drawGroundLabels();
  actor(player.drawX, player.drawY, '#376f8e', player.name, 'human', {
    player: true,
    facing: player.facing,
    walking: !!moveSegment,
    weapon: player.equipment.weapon,
    armor: player.equipment.armor,
    shield: player.equipment.shield,
    gloves: player.equipment.gloves,
  });
  drawProjectiles(now);
  drawEffects(now);
  ctx.restore();
  if (window.hurtFlash) {
    const dt = now - window.hurtFlash;
    if (dt < 320) {
      ctx.fillStyle = `rgba(200,30,30,${0.32 * (1 - dt / 320)})`;
      ctx.fillRect(0, 0, w, h);
    }
  }
  drawDungeonLighting(w, h);
  drawAtmosphere(w, h);
  drawQuestCompass(w, h);
  drawMinimap(w);
  drawCombatHUD(w);
  drawBarrowTimer(w);
  drawActionProgress(now);
  requestAnimationFrame(render);
}
function questMarkers() {
  const out = [],
    s = player.story,
    b = player.sideQuests.boarHunt,
    c = player.sideQuests.silkAndCinders,
    r = player.sideQuests.brokenRoad,
    h = player.sideQuests.hearthAndHome,
    m = player.sideQuests.cureMirehaven;
  if (s.q === 0 && s.step === 0) out.push({ id: 'elowen', symbol: '!', color: '#ffe268' });
  if (s.q === 0 && s.step === 5) out.push({ id: 'elowen', symbol: '?', color: '#79c9ef' });
  if (s.q === 1 && s.step === 0) out.push({ id: 'rowan', symbol: '!', color: '#ffe268' });
  if (s.q === 1 && s.step === 2) out.push({ id: 'rowan', symbol: '?', color: '#79c9ef' });
  if ((s.q === 1 && s.step === 3) || (s.q === 2 && s.step === 0))
    out.push({ id: 'mira', symbol: '!', color: '#ffe268' });
  if (s.q === 2 && s.step === 4) out.push({ id: 'mira', symbol: '?', color: '#79c9ef' });
  if (b.step === 0) out.push({ id: 'willow', symbol: '!', color: '#ffe268' });
  if (b.step === 1 && b.kills >= 3) out.push({ id: 'willow', symbol: '?', color: '#79c9ef' });
  if (s.q >= 2 && c.step === 0) out.push({ id: 'vale', symbol: '!', color: '#ffe268' });
  if (c.step === 1 && c.kills >= 4) out.push({ id: 'vale', symbol: '?', color: '#79c9ef' });
  if (s.q >= 1 && m.step === 0) out.push({ id: 'sable', symbol: '!', color: '#ffe268' });
  if (m.step === 1 && invCount('bogMoss') >= 4)
    out.push({ id: 'sable', symbol: '?', color: '#79c9ef' });
  if (s.q >= 1 && h.step === 0) out.push({ id: 'tamsin', symbol: '!', color: '#ffe268' });
  if (h.step === 1 && invCount('rawMeat') && invCount('cabbage') && invCount('herb'))
    out.push({ id: 'tamsin', symbol: '?', color: '#79c9ef' });
  if (s.q >= 1 && r.step === 0) out.push({ id: 'mara', symbol: '!', color: '#ffe268' });
  if (r.step === 1 && r.kills >= 4) out.push({ id: 'mara', symbol: '?', color: '#79c9ef' });
  return out;
}
function questNpcId() {
  return questMarkers()[0]?.id || null;
}
function drawAtmosphere(w, h) {
  ctx.fillStyle = 'rgba(45,31,12,.055)';
  ctx.fillRect(0, 0, w, h);
  const g = ctx.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.22,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.72,
  );
  g.addColorStop(0, 'rgba(5,12,5,0)');
  g.addColorStop(0.7, 'rgba(8,13,6,.04)');
  g.addColorStop(1, 'rgba(5,8,4,.24)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
function drawQuestCompass(w, h) {
  const target = activeQuestTarget();
  if (!target) return;
  const playerLayer = inDungeon(player.x, player.y) ? 'dungeon' : 'surface';
  if (target.layer !== playerLayer) return;
  const sx = target.x * TILE + 16 - camera.x,
    sy = target.y * TILE + 16 - camera.y;
  if (sx >= 24 && sx <= w - 24 && sy >= 35 && sy <= h - 35) return;
  const cx = w / 2,
    cy = h / 2,
    dx = sx - cx,
    dy = sy - cy,
    roomX = Math.max(55, w / 2 - 175),
    roomY = Math.max(55, h / 2 - 75),
    scale = Math.min(roomX / Math.max(1, Math.abs(dx)), roomY / Math.max(1, Math.abs(dy))),
    x = Math.max(270, Math.min(w - 165, cx + dx * scale)),
    y = Math.max(70, Math.min(h - 48, cy + dy * scale)),
    angle = Math.atan2(dy, dx),
    marker = questMarkers().find((m) => NPCS.find((n) => n.id === m.id)?.name === target.label);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = marker?.color || '#ffe268';
  ctx.strokeStyle = '#251706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(13, 0);
  ctx.lineTo(-8, -8);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 8);
  ctx.closePath();
  ctx.stroke();
  ctx.fill();
  ctx.rotate(-angle);
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#111';
  ctx.lineWidth = 3;
  const label = target.label + ' - ' + tileDistance(player, target) + ' tiles';
  ctx.strokeText(label, 0, 23);
  ctx.fillStyle = '#f1d99a';
  ctx.fillText(label, 0, 23);
  ctx.restore();
}
function drawBarrowTimer(w) {
  if (!player.barrowRunStartedAt) return;
  const elapsed = Date.now() - player.barrowRunStartedAt,
    x = w / 2,
    y = combat && combat.alive ? 106 : 58;
  ctx.fillStyle = '#100e0be8';
  ctx.fillRect(x - 82, y, 164, 44);
  ctx.strokeStyle = '#8b6835';
  ctx.strokeRect(x - 81.5, y + 0.5, 163, 43);
  ctx.font = 'bold 10px Georgia';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#c9ab69';
  ctx.fillText('ASHEN BARROW RUN', x, y + 12);
  ctx.font = 'bold 13px Arial';
  ctx.fillStyle = '#f3de9a';
  ctx.fillText(formatRunTime(elapsed), x, y + 27);
  ctx.font = 'bold 9px Arial';
  ctx.fillStyle = player.barrowPotential >= 75 ? '#8ee879' : '#d2bd82';
  ctx.fillText(`REWARD POTENTIAL ${player.barrowPotential || 0}%`, x, y + 39);
}
function drawCombatHUD(w) {
  if (!combat || !combat.alive) return;
  const width = 250,
    x = (w - width) / 2,
    y = 58,
    pct = Math.max(0, combat.hp / combat.maxHp);
  ctx.fillStyle = '#100e0bdf';
  ctx.fillRect(x, y, width, 42);
  ctx.strokeStyle = '#79623a';
  ctx.strokeRect(x + 0.5, y + 0.5, width - 1, 41);
  ctx.font = 'bold 12px Georgia';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e2c77d';
  ctx.fillText(combat.type.name + (combat.enraged ? ' - ENRAGED' : ''), x + width / 2, y + 15);
  ctx.fillStyle = '#32251e';
  ctx.fillRect(x + 14, y + 23, width - 28, 9);
  ctx.fillStyle = pct > 0.5 ? '#6ca34b' : pct > 0.25 ? '#c2943f' : '#b64b43';
  ctx.fillRect(x + 14, y + 23, (width - 28) * pct, 9);
  ctx.strokeStyle = '#18130e';
  ctx.strokeRect(x + 13.5, y + 22.5, width - 27, 10);
  ctx.font = '10px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(`${Math.max(0, combat.hp)} / ${combat.maxHp}`, x + width / 2, y + 31);
}
function drawMinimap(w) {
  const size = 126,
    x = w - size - 14,
    y = 14,
    sx = size / MAP_W,
    sy = size / MAP_H;
  ctx.fillStyle = '#11160ee8';
  ctx.fillRect(x - 4, y - 4, size + 8, size + 8);
  ctx.strokeStyle = '#8a7040';
  ctx.strokeRect(x - 4.5, y - 4.5, size + 9, size + 9);
  ctx.drawImage(minimapTerrain(), x, y, size, size);
  ctx.fillStyle = '#67b9e8';
  for (const n of NPCS) ctx.fillRect(x + n.drawX * sx - 1, y + n.drawY * sy - 1, 3, 3);
  ctx.fillStyle = '#d95c52';
  for (const m of monsters)
    if (m.alive) ctx.fillRect(x + m.drawX * sx - 1, y + m.drawY * sy - 1, 2, 2);
  ctx.fillStyle = '#8dc56b';
  for (const r of ROCKS) ctx.fillRect(x + r.x * sx - 1, y + r.y * sy - 1, 2, 2);
  const objective = activeQuestTarget(),
    layer = inDungeon(player.x, player.y) ? 'dungeon' : 'surface';
  if (objective && objective.layer === layer) {
    const ox = x + objective.x * sx,
      oy = y + objective.y * sy;
    ctx.strokeStyle = '#ffe268';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox, oy - 5);
    ctx.lineTo(ox + 5, oy);
    ctx.lineTo(ox, oy + 5);
    ctx.lineTo(ox - 5, oy);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#ffe268';
    ctx.fillRect(ox - 1, oy - 1, 3, 3);
  }
  if (destination) {
    ctx.strokeStyle = '#64d4e8';
    ctx.lineWidth = 1.5;
    const dx = x + destination.x * sx,
      dy = y + destination.y * sy;
    ctx.beginPath();
    ctx.arc(dx, dy, 4, 0, 7);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffe168';
  ctx.beginPath();
  ctx.arc(x + player.drawX * sx, y + player.drawY * sy, 3, 0, 7);
  ctx.fill();
}
function drawEffects(now) {
  effects = effects.filter((e) => now - e.at < 1000);
  for (const e of effects) {
    const age = (now - e.at) / 1000,
      X = e.x * TILE + 16,
      Y = e.y * TILE - 8 - age * 28;
    ctx.save();
    ctx.translate(X, Y);
    ctx.fillStyle = e.color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8,
        r = i % 2 ? 10 : 14;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(String(e.value), 0, 4);
    if (e.xp) {
      ctx.fillStyle = '#f3d76c';
      ctx.font = 'bold 11px Arial';
      ctx.fillText('+' + e.xp + ' xp', 28, -10);
    }
    ctx.restore();
  }
}
function drawActionProgress(now) {
  const bar = document.getElementById('actionBar'),
    fill = bar.querySelector('span');
  if ((!combat && !skilling) || !lastActionAt) {
    bar.classList.remove('active');
    return;
  }
  const p = Math.min(1, (now - lastActionAt) / actionDuration);
  bar.classList.add('active');
  fill.style.width = p * 100 + '%';
}
