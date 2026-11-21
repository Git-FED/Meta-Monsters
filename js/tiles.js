/* Metamonsters v1 — overworld: procedural DS-quality pixel tiles, tile maps,
   player movement, NPCs, interactions, wild encounters. */
'use strict';

/* ---------------- seeded random for stable tile variation ---------------- */
function hash2(x, y) { let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; }
function px(c, x, y, w, h, col) { c.fillStyle = col; c.fillRect(x, y, w, h); }

/* ---------------- tile painting (32x32 offscreen canvases) ---------------- */
const TileArt = {};
function makeTile(name, fn) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  fn(c.getContext('2d')); TileArt[name] = c; return c;
}
function speckles(c, n, cols, seed) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(hash2(seed, i * 7 + 1) * 30), y = Math.floor(hash2(seed * 3, i * 7 + 2) * 30);
    px(c, x, y, 2, 2, cols[Math.floor(hash2(seed, i) * cols.length)]);
  }
}
function grassBase(c, tone) {
  px(c, 0, 0, 32, 32, tone[0]);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(hash2(i, 11) * 32), y = Math.floor(hash2(i, 23) * 32);
    px(c, x, y, 1, 3, tone[1 + (i % 2)]);
  }
}
makeTile('grass', c => { grassBase(c, ['#5da244', '#4c8f38', '#6cb254']); speckles(c, 8, ['#7cc45f', '#3f7d2e'], 5); });
makeTile('grassDry', c => { grassBase(c, ['#8aa84f', '#75953f', '#9cbc5c']); speckles(c, 8, ['#b5cc6d', '#6b8a38'], 9); });
makeTile('tallgrass', c => {
  grassBase(c, ['#5da244', '#4c8f38', '#6cb254']);
  for (let i = 0; i < 9; i++) {
    const x = 2 + (i % 5) * 6, h = 8 + (i % 3) * 3;
    px(c, x, 30 - h, 2, h, i % 2 ? '#3f7d2e' : '#8fd06a');
    px(c, x + 2, 30 - h + 2, 1, h - 2, '#a8e07e');
  }
});
makeTile('flowers', c => {
  grassBase(c, ['#5da244', '#4c8f38', '#6cb254']);
  const cols = ['#ff5f7e', '#ffd94d', '#ffffff', '#c98aff'];
  for (let i = 0; i < 5; i++) {
    const x = 4 + Math.floor(hash2(i, 3) * 24), y = 4 + Math.floor(hash2(i, 8) * 24);
    px(c, x, y, 3, 3, cols[i % 4]); px(c, x + 1, y + 1, 1, 1, '#fff7c0');
  }
});
makeTile('path', c => {
  px(c, 0, 0, 32, 32, '#c9a86a');
  speckles(c, 14, ['#b5965a', '#dcbd85', '#a5854e'], 21);
  px(c, 0, 0, 32, 2, '#b5965a'); px(c, 0, 30, 32, 2, '#b5965a');
});
makeTile('sand', c => { px(c, 0, 0, 32, 32, '#e8d39a'); speckles(c, 12, ['#d9c184', '#f2e2b0', '#cbb273'], 31); });
makeTile('water', c => {
  px(c, 0, 0, 32, 32, '#2f7fd0');
  for (let i = 0; i < 5; i++) { const y = 4 + i * 6; px(c, 3 + (i % 2) * 6, y, 12, 2, '#6db3ef'); px(c, 14 + (i % 2) * 4, y + 3, 10, 1, '#9fd0f5'); }
});
makeTile('waterDeep', c => {
  px(c, 0, 0, 32, 32, '#1d5aa8');
  for (let i = 0; i < 4; i++) { const y = 6 + i * 7; px(c, 5 + (i % 2) * 8, y, 14, 2, '#3f8fd8'); }
});
makeTile('dirt', c => { px(c, 0, 0, 32, 32, '#8a6a45'); speckles(c, 14, ['#77572f', '#a08055', '#6b4e2c'], 41); });
makeTile('rock', c => {
  grassBase(c, ['#5da244', '#4c8f38', '#6cb254']);
  px(c, 6, 12, 20, 14, '#8d8d9a'); px(c, 8, 9, 16, 5, '#a9a9b8'); px(c, 10, 14, 6, 6, '#c9c9d8');
  px(c, 6, 24, 20, 2, '#6a6a78');
});
makeTile('cliff', c => { px(c, 0, 0, 32, 32, '#7a5a3a'); px(c, 0, 0, 32, 8, '#9c7c50'); speckles(c, 10, ['#6b4e2c', '#b08d5a'], 51); });
makeTile('woodfloor', c => {
  px(c, 0, 0, 32, 32, '#b0824f');
  for (let y = 0; y < 32; y += 8) { px(c, 0, y, 32, 1, '#8a6a3a'); }
  px(c, 10, 0, 1, 32, '#8a6a3a'); px(c, 22, 0, 1, 32, '#8a6a3a');
});
makeTile('tilefloor', c => {
  px(c, 0, 0, 32, 32, '#dfe6f2');
  px(c, 0, 0, 32, 1, '#b9c6dd'); px(c, 0, 0, 1, 32, '#b9c6dd');
  px(c, 15, 0, 1, 32, '#b9c6dd'); px(c, 0, 15, 32, 1, '#b9c6dd');
});
makeTile('arenaFloor', c => {
  px(c, 0, 0, 32, 32, '#c9a06a');
  speckles(c, 10, ['#b08d55', '#dcbd85'], 61);
  px(c, 0, 15, 32, 2, '#f2f2f2');
});
makeTile('stands', c => {
  px(c, 0, 0, 32, 32, '#3a4a6e');
  const cols = ['#ffd94d', '#ff5f7e', '#7cc45f', '#ffffff', '#c98aff'];
  for (let i = 0; i < 12; i++) {
    const x = 2 + (i % 6) * 5, y = 3 + Math.floor(i / 6) * 12;
    px(c, x, y, 4, 4, cols[i % 5]); px(c, x + 1, y, 2, 2, '#1b2a52');
  }
  px(c, 0, 26, 32, 6, '#2a3858');
});
makeTile('vines', c => {
  px(c, 0, 0, 32, 32, '#2e6b2a');
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(hash2(i, 71) * 28), y = Math.floor(hash2(i, 72) * 28);
    px(c, x, y, 5, 3, i % 2 ? '#4c9a3f' : '#1f4d1c');
    px(c, x + 2, y + 3, 2, 4, '#3f7d2e');
  }
  px(c, 0, 0, 32, 2, '#7cc45f');
});
makeTile('bush', c => {
  grassBase(c, ['#5da244', '#4c8f38', '#6cb254']);
  px(c, 4, 6, 24, 20, '#3f7d2e'); px(c, 7, 3, 18, 8, '#5da244'); px(c, 9, 9, 4, 4, '#7cc45f'); px(c, 19, 13, 4, 4, '#8fd06a');
});
makeTile('berrybush', c => {
  grassBase(c, ['#5da244', '#4c8f38', '#6cb254']);
  px(c, 4, 6, 24, 20, '#3f7d2e'); px(c, 7, 3, 18, 8, '#5da244');
  const cols = ['#ff3b5c', '#ff3b5c', '#ffd94d'];
  for (let i = 0; i < 6; i++) { const x = 6 + Math.floor(hash2(i, 91) * 20), y = 8 + Math.floor(hash2(i, 92) * 14); px(c, x, y, 3, 3, cols[i % 3]); }
});
makeTile('fence', c => {
  grassBase(c, ['#5da244', '#4c8f38', '#6cb254']);
  px(c, 2, 12, 28, 3, '#8a6a3a'); px(c, 2, 20, 28, 3, '#8a6a3a');
  px(c, 4, 8, 3, 18, '#6b4e2c'); px(c, 25, 8, 3, 18, '#6b4e2c');
});
makeTile('pond', c => {
  px(c, 0, 0, 32, 32, '#2f7fd0');
  px(c, 4, 6, 8, 2, '#6db3ef'); px(c, 18, 12, 10, 2, '#9fd0f5'); px(c, 8, 20, 12, 2, '#6db3ef');
  px(c, 0, 0, 32, 3, '#5da244'); px(c, 0, 29, 32, 3, '#5da244');
});
makeTile('snow', c => {
  px(c, 0, 0, 32, 32, '#e8f0fa');
  speckles(c, 10, ['#ffffff', '#d0dcf0', '#c0d0e8'], 71);
  px(c, 0, 0, 32, 1, '#ffffff');
  px(c, 4, 20, 6, 2, '#d0dcf0'); px(c, 20, 8, 8, 2, '#d0dcf0');
});
makeTile('ice', c => {
  px(c, 0, 0, 32, 32, '#b8d8f0');
  for (let i = 0; i < 4; i++) { const y = 6 + i * 7; px(c, 4 + (i % 2) * 6, y, 14, 2, '#d8ecfa'); px(c, 18 - (i % 2) * 6, y + 3, 8, 1, '#e8f4ff'); }
  speckles(c, 6, ['#e8f4ff'], 73);
});
makeTile('dune', c => {
  px(c, 0, 0, 32, 32, '#e0b96a');
  for (let i = 0; i < 3; i++) { const y = 8 + i * 9; px(c, 2, y, 28, 2, '#c9a355'); px(c, 6 + i * 4, y + 4, 10, 1, '#f0cd85'); }
  speckles(c, 10, ['#f0cd85', '#c9a355'], 75);
});
// pass 2 — Rok City + east wasteland grounds
makeTile('citypave', c => {
  px(c, 0, 0, 32, 32, '#4a4e63');
  speckles(c, 12, ['#3a3e52', '#5d6278', '#6b7089'], 81);
  px(c, 0, 0, 32, 2, '#2f3347'); px(c, 0, 30, 32, 2, '#2f3347');
  px(c, 8, 8, 2, 2, '#ff5f7e'); px(c, 22, 20, 2, 2, '#7cc4ff'); // neon flecks in the pavement
});
makeTile('rust', c => {
  px(c, 0, 0, 32, 32, '#9a5a2e');
  speckles(c, 14, ['#7d4423', '#b06e38', '#6b3a1e', '#c98a4a'], 83);
  px(c, 4, 10, 8, 2, '#5a2f18'); px(c, 18, 22, 10, 2, '#5a2f18');
});
makeTile('ash', c => {
  px(c, 0, 0, 32, 32, '#8d8d94');
  speckles(c, 14, ['#6e6e75', '#a8a8b0', '#5a5a61'], 85);
  px(c, 6, 6, 3, 3, '#4a4a52'); px(c, 20, 18, 4, 3, '#4a4a52');
});
makeTile('wreck', c => {
  px(c, 0, 0, 32, 32, '#5e5a52');
  speckles(c, 14, ['#4a4640', '#767168', '#3e3b36', '#8a8578'], 87);
  px(c, 4, 8, 10, 2, '#37c978'); px(c, 20, 20, 8, 2, '#37c978'); // faint chemical seep
});
makeTile('cavefloor', c => {
  px(c, 0, 0, 32, 32, '#2e2a3a');
  speckles(c, 12, ['#242030', '#3e3850', '#1e1a28'], 89);
  px(c, 8, 12, 3, 3, '#7cc4ff'); px(c, 22, 6, 2, 2, '#7cc4ff'); // glowing crystal flecks
});
// pass 3 — the 75+ ancient world grounds
makeTile('ancientGrass', c => { // old dry grassland, older than the main world
  grassBase(c, ['#7a8a4a', '#66783c', '#8fa055']);
  speckles(c, 10, ['#a8bc6d', '#5a6a33'], 101);
  px(c, 6, 10, 2, 6, '#5a6a33'); px(c, 20, 18, 2, 6, '#5a6a33'); // tough old grass stalks
});
makeTile('badlands', c => { // cracked red rock — the Rex Badlands
  px(c, 0, 0, 32, 32, '#a85a3a');
  speckles(c, 14, ['#8a452c', '#c06e48', '#7d3d24'], 103);
  px(c, 2, 8, 28, 2, '#5a2a18'); px(c, 10, 8, 2, 12, '#5a2a18'); px(c, 4, 22, 20, 2, '#5a2a18'); // cracks
  px(c, 22, 4, 6, 3, '#e08a5a');
});
makeTile('fossil', c => { // bone beds — shell and bone fragments in pale earth
  px(c, 0, 0, 32, 32, '#c9bd9a');
  speckles(c, 12, ['#b5a985', '#ddd2b5', '#a89a75'], 105);
  px(c, 6, 8, 10, 3, '#f2ecd8'); px(c, 18, 18, 12, 3, '#f2ecd8'); px(c, 10, 22, 3, 8, '#f2ecd8');
});
makeTile('canopyFloor', c => { // giant forest floor — dark, mossy, ancient
  px(c, 0, 0, 32, 32, '#2e4a26');
  speckles(c, 14, ['#243a1e', '#3a5c30', '#1e3018'], 107);
  px(c, 8, 8, 4, 4, '#5a8a3a'); px(c, 20, 20, 5, 5, '#5a8a3a'); px(c, 4, 24, 3, 3, '#7cc45f');
});
makeTile('darkfloor', c => { // the Dark Caves — near-black stone, faint glints
  px(c, 0, 0, 32, 32, '#14121e');
  speckles(c, 10, ['#0e0c16', '#1e1a2e', '#262038'], 109);
  px(c, 10, 14, 2, 2, '#8a8a9e'); px(c, 22, 8, 2, 2, '#8a8a9e');
});
makeTile('tar', c => { // tar pit — black, glossy, slow ground
  px(c, 0, 0, 32, 32, '#14100c');
  px(c, 4, 6, 24, 20, '#1e1812');
  px(c, 8, 10, 6, 3, '#3a2f22'); px(c, 18, 16, 8, 3, '#3a2f22');
  px(c, 12, 8, 3, 3, '#ffd94d'); // a bubble of gas catching the light
});

/* ---------------- tall object sprites (drawn in y-order) ---------------- */
function drawTree(c, x, y, big) { // x,y = pixel top-left of the 32x48 sprite
  const w = big ? 40 : 32, h = big ? 56 : 48;
  px(c, x + w / 2 - 3, y + h - 16, 6, 16, '#6b4e2c');
  px(c, x + w / 2 - 5, y + h - 18, 10, 4, '#5a3f24');
  const blobs = [[w / 2 - 12, 4, 16], [w / 2 + 2, 2, 18], [w / 2 - 6, 12, 20], [w / 2 - 14, 14, 12], [w / 2 + 10, 14, 12]];
  for (const [bx, by, s] of blobs) {
    px(c, x + bx, y + by, s, s - 4, '#2f6b2a');
    px(c, x + bx + 2, y + by + 2, s - 4, s - 8, '#4c9a3f');
    px(c, x + bx + 4, y + by + 3, 4, 4, '#7cc45f');
  }
}
function drawPalm(c, x, y) {
  px(c, x + 13, y + 18, 6, 30, '#8a6a3a');
  for (let i = 0; i < 5; i++) {
    const a = -0.4 - i * 0.5;
    const lx = x + 16 + Math.cos(a) * 16, ly = y + 16 + Math.sin(a) * 6;
    px(c, Math.min(x + 16, lx), ly, Math.abs(lx - x - 16) || 4, 4, '#3f9a3f');
  }
  px(c, x + 12, y + 14, 4, 4, '#8a5a2a'); px(c, x + 17, y + 15, 4, 4, '#8a5a2a');
}
function drawHouse(c, x, y, w, h, wall, roof) { // w tiles wide, h tiles tall (top-left pixel)
  const pw = w * TILE, ph = h * TILE;
  px(c, x, y, pw, ph, wall);
  // roof
  px(c, x - 4, y - 6, pw + 8, 14, roof);
  px(c, x - 4, y + 8, pw + 8, 4, '#5a3f24');
  for (let i = 0; i < pw + 8; i += 8) px(c, x - 4 + i, y - 6, 4, 14, i % 16 ? roof : '#00000022');
  // door + windows
  px(c, x + pw / 2 - 7, y + ph - 22, 14, 22, '#5a3f24');
  px(c, x + pw / 2 - 4, y + ph - 18, 8, 14, '#2a1c0e');
  px(c, x + 8, y + 12, 12, 10, '#ffe9a8'); px(c, x + pw - 20, y + 12, 12, 10, '#ffe9a8');
  px(c, x + 8, y + 12, 12, 2, '#5a3f24'); px(c, x + pw - 20, y + 12, 12, 2, '#5a3f24');
}
function drawMachine(c, x, y) { // healing machine 32x48
  px(c, x, y, 32, 48, '#e8f0ff'); px(c, x, y, 32, 4, '#2b4a9e'); px(c, x, y + 44, 32, 4, '#2b4a9e');
  px(c, x + 11, y + 10, 10, 10, '#ff5f7e'); px(c, x + 14, y + 7, 4, 16, '#ff5f7e');
  px(c, x + 6, y + 26, 20, 12, '#1b2a52'); px(c, x + 8, y + 28, 16, 8, '#37c978');
}
function drawSnowTree(c, x, y) { // snow-dusted pine, 32x48
  px(c, x + 13, y + 32, 6, 16, '#5a3f24');
  px(c, x + 6, y + 22, 20, 12, '#1f4d1c'); px(c, x + 9, y + 14, 14, 10, '#2f6b2a'); px(c, x + 12, y + 6, 8, 10, '#2f6b2a');
  px(c, x + 6, y + 22, 20, 3, '#ffffff'); px(c, x + 9, y + 14, 14, 3, '#ffffff'); px(c, x + 12, y + 6, 8, 3, '#ffffff');
  px(c, x + 10, y + 26, 3, 3, '#7cc45f');
}
function drawCactus(c, x, y) { // desert cactus, 32x48
  px(c, x + 13, y + 8, 6, 40, '#3f9a3f'); px(c, x + 13, y + 8, 6, 4, '#7cc45f');
  px(c, x + 4, y + 18, 5, 12, '#3f9a3f'); px(c, x + 4, y + 28, 10, 5, '#3f9a3f');
  px(c, x + 23, y + 14, 5, 12, '#3f9a3f'); px(c, x + 18, y + 24, 10, 5, '#3f9a3f');
  px(c, x + 15, y + 12, 2, 2, '#ffd94d'); px(c, x + 6, y + 20, 2, 2, '#ffd94d');
}
function drawCoral(c, x, y) { // reef coral, 32x32
  px(c, x + 4, y + 20, 6, 12, '#ff5f7e'); px(c, x + 12, y + 14, 6, 18, '#c98aff'); px(c, x + 20, y + 22, 6, 10, '#ff9a3d');
  px(c, x + 4, y + 20, 6, 3, '#ff8fa3'); px(c, x + 12, y + 14, 6, 3, '#d8a8ff'); px(c, x + 20, y + 22, 6, 3, '#ffc27d');
}
function drawStone(c, x, y, base, top) { // snowrock / sandstone boulder, 32x32
  px(c, x + 6, y + 14, 20, 14, base); px(c, x + 8, y + 10, 16, 6, top);
  px(c, x + 10, y + 16, 6, 6, '#ffffff55'); px(c, x + 6, y + 26, 20, 2, '#00000033');
}
function drawCounter(c, x, y, w) {
  px(c, x, y, w, 26, '#8a6a3a'); px(c, x, y, w, 6, '#c9a86a');
  for (let i = 4; i < w; i += 12) px(c, x + i, y + 10, 6, 12, '#6b4e2c');
}
// pass 2 — tall objects for Rok City and the east
function drawTower(c, x, y, w, h, wall) { // corporate tower, w tiles wide, h tiles tall
  const pw = w * TILE, ph = h * TILE;
  px(c, x, y, pw, ph, wall || '#2b3350');
  px(c, x - 3, y - 4, pw + 6, 8, '#1b2138');
  // lit windows — some warm, some cool, a few dark
  for (let wy = y + 8; wy < y + ph - 6; wy += 12) {
    for (let wx = x + 6; wx < x + pw - 8; wx += 12) {
      const on = hash2(wx, wy) > 0.25;
      px(c, wx, wy, 7, 8, on ? (hash2(wx + 1, wy) > 0.5 ? '#ffd94d' : '#7cc4ff') : '#141828');
    }
  }
  // rooftop beacon
  px(c, x + pw / 2 - 2, y - 10, 4, 6, '#ff5f7e');
}
function drawBarrel(c, x, y) { // Chemical X barrel — faint green glow
  px(c, x + 8, y + 8, 16, 22, '#3f7d2e'); px(c, x + 8, y + 12, 16, 3, '#2b5a1e'); px(c, x + 8, y + 24, 16, 3, '#2b5a1e');
  px(c, x + 12, y + 16, 8, 6, '#37c978');
  px(c, x + 10, y + 4, 12, 4, '#7cc45f');
}
function drawGate(c, x, y) { // the sealed gate to the Long Dark — 2 tiles wide
  px(c, x - 2, y - 8, 68, 40, '#3a3348');
  px(c, x - 2, y - 8, 68, 6, '#5a4a7a');
  px(c, x + 6, y + 2, 20, 30, '#1e1a28'); px(c, x + 40, y + 2, 20, 30, '#1e1a28');
  px(c, x + 30, y + 2, 6, 30, '#ffd94d');
  px(c, x + 10, y + 8, 4, 4, '#7cc4ff'); px(c, x + 48, y + 8, 4, 4, '#7cc4ff');
  px(c, x + 14, y + 22, 8, 8, '#ff5f7e');
}
function drawStall(c, x, y) { // bazaar stall with a striped awning
  px(c, x + 2, y + 2, 28, 8, '#c94f7d'); px(c, x + 2, y + 2, 7, 8, '#ffd94d'); px(c, x + 16, y + 2, 7, 8, '#ffd94d');
  px(c, x + 4, y + 10, 24, 16, '#8a6a3a'); px(c, x + 4, y + 10, 24, 4, '#c9a86a');
  px(c, x + 8, y + 16, 5, 5, '#ff5f7e'); px(c, x + 16, y + 16, 5, 5, '#7cc45f'); px(c, x + 24, y + 16, 3, 3, '#ffd94d');
}
function drawWeb(c, x, y) { // giant spider web, 32x32
  c.strokeStyle = 'rgba(230,235,255,0.85)'; c.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.moveTo(16, 16); c.lineTo(16 + Math.cos(i * 1.26) * 15, 16 + Math.sin(i * 1.26) * 15); c.stroke();
  }
  for (const r of [5, 10, 14]) { c.beginPath(); c.arc(16, 16, r, 0, 7); c.stroke(); }
}
function drawCrystal(c, x, y) { // glowing cave crystal
  px(c, x + 12, y + 10, 8, 22, '#7cc4ff'); px(c, x + 14, y + 6, 4, 8, '#b8dcff');
  px(c, x + 4, y + 20, 6, 12, '#5a9ed8'); px(c, x + 22, y + 18, 6, 14, '#5a9ed8');
  px(c, x + 10, y + 28, 12, 4, '#2b4a6b');
}
function drawScrap(c, x, y) { // rusted scrap pile
  px(c, x + 6, y + 16, 20, 14, '#9a5a2e'); px(c, x + 9, y + 10, 14, 8, '#b06e38');
  px(c, x + 8, y + 18, 5, 5, '#5a5a61'); px(c, x + 18, y + 20, 6, 4, '#4a4640');
  px(c, x + 12, y + 12, 4, 4, '#ffd94d');
}
function drawStreetlight(c, x, y) {
  px(c, x + 14, y + 2, 4, 30, '#2b2b3a');
  px(c, x + 10, y, 12, 4, '#ffd94d'); px(c, x + 12, y + 4, 8, 4, '#ffe9a8');
}
// pass 3 — ancient-world objects
function drawBone(c, x, y) { // giant ribcage bones jutting from the ground
  px(c, x + 4, y + 12, 4, 20, '#f2ecd8'); px(c, x + 12, y + 6, 4, 26, '#f2ecd8'); px(c, x + 20, y + 10, 4, 22, '#f2ecd8');
  px(c, x + 2, y + 10, 8, 4, '#e0d5b8'); px(c, x + 10, y + 4, 8, 4, '#e0d5b8'); px(c, x + 18, y + 8, 8, 4, '#e0d5b8');
  px(c, x + 6, y + 28, 20, 4, '#c9bd9a');
}
function drawFossil(c, x, y) { // fossil rock with a visible spiral shell
  px(c, x + 6, y + 12, 20, 16, '#8d8d9a'); px(c, x + 8, y + 8, 16, 6, '#a9a9b8');
  c.strokeStyle = '#f2ecd8'; c.lineWidth = 2;
  c.beginPath(); c.arc(x + 16, y + 20, 6, 0, 7); c.stroke();
  c.beginPath(); c.arc(x + 16, y + 20, 3, 0, 7); c.stroke();
}
function drawGiantTree(c, x, y) { // a tree the size of a house — 32x64
  px(c, x + 12, y + 28, 8, 36, '#4a3018');
  px(c, x + 10, y + 28, 12, 4, '#3a2410');
  const blobs = [[2, 0, 20], [14, -4, 24], [4, 12, 22], [16, 12, 18]];
  for (const [bx, by, s] of blobs) {
    px(c, x + bx, y + by, s, s - 6, '#1e3d1a');
    px(c, x + bx + 2, y + by + 2, s - 4, s - 10, '#2f6b2a');
    px(c, x + bx + 5, y + by + 3, 4, 4, '#7cc45f');
  }
  px(c, x + 8, y + 40, 3, 3, '#ffd94d'); px(c, x + 22, y + 34, 3, 3, '#ff5f7e');
}
function drawTarPit(c, x, y) { // bubbling tar pit, 32x32
  px(c, x + 2, y + 8, 28, 22, '#14100c');
  px(c, x + 6, y + 12, 20, 14, '#1e1812');
  px(c, x + 10, y + 14, 4, 4, '#3a2f22'); px(c, x + 20, y + 20, 5, 4, '#3a2f22');
  px(c, x + 14, y + 10, 3, 3, '#ffd94d');
}
function drawTent(c, x, y) { // exile tent — salvaged canvas, 32x40
  px(c, x + 4, y + 12, 24, 26, '#c9b896');
  px(c, x + 4, y + 12, 24, 5, '#8a7a5a');
  px(c, x + 8, y + 6, 16, 8, '#b5a67e');
  px(c, x + 13, y + 22, 6, 16, '#3a2f1e');
  px(c, x + 6, y + 30, 4, 4, '#ff5f7e'); px(c, x + 22, y + 30, 4, 4, '#7cc4ff');
}
function drawCampfire(c, x, y) { // the fire that never goes out
  px(c, x + 8, y + 20, 16, 8, '#5a5a61'); px(c, x + 10, y + 16, 12, 5, '#8d8d9a');
  px(c, x + 13, y + 8, 6, 10, '#ff9a3d'); px(c, x + 15, y + 4, 3, 8, '#ffd94d');
  px(c, x + 6, y + 24, 20, 3, '#2b2b3a');
}
function drawStairs(c, x, y) { // stairs up to the upper deck
  for (let i = 0; i < 4; i++) px(c, x + 4 + i * 2, y + 24 - i * 6, 24 - i * 4, 5, i % 2 ? '#8a6a3a' : '#c9a86a');
  px(c, x + 4, y + 2, 4, 22, '#6b4e2c');
}
function drawTerminal(c, x, y) { // upper-deck online terminal
  px(c, x + 4, y + 4, 24, 18, '#1b2a52');
  px(c, x + 6, y + 6, 20, 14, '#37c978');
  px(c, x + 8, y + 8, 12, 2, '#0a2a1a'); px(c, x + 8, y + 12, 16, 2, '#0a2a1a'); px(c, x + 8, y + 16, 8, 2, '#0a2a1a');
  px(c, x + 8, y + 24, 16, 8, '#3a3a4a'); px(c, x + 12, y + 22, 8, 3, '#7cc4ff');
}
function drawMysterySign(c, x, y) { // a glowing marker — tracks, a shadow, a sound
  c.fillStyle = 'rgba(255,217,77,0.9)';
  c.beginPath(); c.arc(x + 16, y + 16, 7 + Math.sin(performance.now() / 300) * 2, 0, 7); c.fill();
  c.fillStyle = '#8a6d00'; c.font = 'bold 11px Trebuchet MS'; c.fillText('?', x + 13, y + 20);
  c.fillStyle = '#ffe9a8'; c.font = 'bold 9px Trebuchet MS'; c.fillText('TRACKS', x - 2, y - 4);
}
function drawCaveMouth(c, x, y) { // dark cave entrance in the badlands wall
  px(c, x, y - 4, 32, 36, '#3a3348');
  px(c, x + 6, y + 6, 20, 26, '#0a0812');
  px(c, x + 8, y + 8, 4, 4, '#7cc4ff'); px(c, x + 20, y + 12, 3, 3, '#7cc4ff');
}

/* ================= MAPS ================= */
const TILE_WALK = { grass: true, grassDry: true, tallgrass: true, flowers: true, path: true, sand: true, dirt: true, woodfloor: true, tilefloor: true, arenaFloor: true, snow: true, ice: true, dune: true, pond: false, water: false, waterDeep: false, rock: false, cliff: false, vines: false, bush: false, berrybush: false, fence: false, stands: false, citypave: true, rust: true, ash: true, wreck: true, cavefloor: true, ancientGrass: true, badlands: true, fossil: true, canopyFloor: true, darkfloor: true, tar: true };

function newMap(name, w, h, ground, label) {
  return { name, w, h, label, ground, objects: [], npcs: [], exits: [], area: null, encounters: null };
}
function fillRect(map, x0, y0, w, h, tile) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < map.w && y < map.h) map.ground[y][x] = tile;
}
function borderTrees(map, type) {
  type = type || 'tree';
  for (let x = 0; x < map.w; x++) { map.objects.push({ x, y: 0, type }); map.objects.push({ x, y: map.h - 1, type }); }
  for (let y = 1; y < map.h - 1; y++) { map.objects.push({ x: 0, y, type }); map.objects.push({ x: map.w - 1, y, type }); }
}
function scatter(map, tiles, type, n, avoid) {
  let placed = 0, guard = 0;
  while (placed < n && guard++ < 500) {
    const x = rand(2, map.w - 3), y = rand(2, map.h - 3);
    if (avoid && avoid.some(a => Math.abs(a[0] - x) < 2 && Math.abs(a[1] - y) < 2)) continue;
    if (map.ground[y][x] !== 'grass' && map.ground[y][x] !== 'grassDry') continue;
    if (map.objects.some(o => o.x === x && o.y === y)) continue;
    map.objects.push({ x, y, type, id: type + '_' + x + '_' + y });
    placed++;
  }
}
function objAt(map, x, y) {
  return map.objects.find(o => {
    const w = o.w || 1, h = o.h || 1;
    return x >= o.x && x < o.x + w && y >= o.y && y < o.y + h;
  });
}
function tileAt(map, x, y) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return 'cliff';
  return map.ground[y][x];
}
function walkable(map, x, y) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
  const t = tileAt(map, x, y);
  // small water: any Fish creature in the party lets you wade it (the shark starter's perk)
  if (t === 'pond') {
    const hasFish = G.party.some(c => DEX[c.dex].category === 'Fish');
    if (!hasFish) return false;
  } else if (t === 'water' || t === 'waterDeep') {
    // deep water needs HM SWIM — or the shark starter, who swims small and large water alike
    if (!canCrossWater()) return false;
  } else if (!TILE_WALK[t]) return false;
  if (objAt(map, x, y)) return false;
  if (map.npcs.some(n => n.x === x && n.y === y)) return false;
  return true;
}

const MAPS = {};
(function buildMaps() {
  // ---- HAVEN VILLAGE ----
  let m = newMap('haven', 24, 18, Array.from({ length: 18 }, () => Array(24).fill('grass')), 'Haven Village');
  fillRect(m, 0, 9, 24, 1, 'path');
  fillRect(m, 12, 4, 1, 12, 'path');
  fillRect(m, 10, 8, 5, 3, 'dirt'); // village square
  m.objects.push({ x: 4, y: 3, type: 'house', w: 3, h: 2, wall: '#e8d8b0', roof: '#c94f4f', id: 'house1' });
  m.objects.push({ x: 17, y: 3, type: 'house', w: 3, h: 2, wall: '#e8d8b0', roof: '#4f7dc9', id: 'home' });
  m.objects.push({ x: 9, y: 4, type: 'hub', w: 4, h: 2, wall: '#dfe8ff', roof: '#2b4a9e', id: 'hub' });
  fillRect(m, 17, 6, 3, 2, 'dirt'); // home plot (base site)
  m.objects.push({ x: 18, y: 6, type: 'plot', id: 'homeplot' });
  borderTrees(m);
  // clear the path through the border trees for the east exit (meadow) and the west exit (Rok City)
  m.objects = m.objects.filter(o => !(o.type === 'tree' && o.x === 23 && o.y === 9));
  m.objects = m.objects.filter(o => !(o.type === 'tree' && o.x === 0 && o.y === 9));
  m.exits.push({ x: 23, y: 9, to: 'meadow', tx: 1, ty: 9 });
  m.exits.push({ x: 0, y: 9, to: 'rokCity', tx: 28, ty: 9 }); // west to Rok City
  m.exits.push({ x: 11, y: 6, to: 'hub', tx: 7, ty: 8 }); // Care Hub door
  m.npcs.push({ id: 'marcus', name: 'Marcus', x: 11, y: 8, dir: 'down', sprite: 'marcus', dialog: 'marcus' });
  m.npcs.push({ id: 'sofia', name: 'Sofia', x: 13, y: 8, dir: 'down', sprite: 'sofia', dialog: 'sofia' });
  m.npcs.push({ id: 'caleb', name: 'Caleb', x: 18, y: 12, dir: 'up', sprite: 'caleb', dialog: 'caleb' });
  m.npcs.push({ id: 'elder', name: 'Elder Mara', x: 5, y: 12, dir: 'right', sprite: null, color: '#7a4a9e', dialog: 'elder' });
  m.npcs.push({ id: 'shopOwner', name: 'Shop Owner', x: 7, y: 6, dir: 'down', sprite: null, color: '#8a5a2b', dialog: 'shopOwner' });
  m.npcs.push({ id: 'pippa', name: 'Pippa', x: 12, y: 10, dir: 'up', sprite: null, color: '#c94f7d', dialog: 'pippa' });
  scatter(m, null, 'tree', 6, [[11, 8], [13, 8], [18, 12], [5, 12], [7, 6], [12, 10]]);
  scatter(m, null, 'flowers', 0, null);
  fillRect(m, 3, 14, 4, 2, 'flowers'); fillRect(m, 20, 13, 3, 2, 'flowers');
  MAPS.haven = m;

  // ---- CARE HUB (interior) ----
  m = newMap('hub', 14, 10, Array.from({ length: 10 }, () => Array(14).fill('tilefloor')), 'Care Hub');
  for (let x = 0; x < 14; x++) { m.ground[0][x] = 'cliff'; m.ground[9][x] = 'cliff'; }
  for (let y = 0; y < 10; y++) { m.ground[y][0] = 'cliff'; m.ground[y][13] = 'cliff'; }
  m.objects.push({ x: 2, y: 1, type: 'machine', id: 'machine1' });
  m.objects.push({ x: 4, y: 1, type: 'machine', id: 'machine2' });
  m.objects.push({ x: 6, y: 1, type: 'tv', id: 'tv' });
  m.objects.push({ x: 8, y: 2, type: 'counter', w: 3, id: 'counter' });
  m.objects.push({ x: 12, y: 1, type: 'board', id: 'board' });
  m.objects.push({ x: 12, y: 8, type: 'stairs', id: 'hubStairs' }); // pass 3 — stairs to the upper deck (online hub)
  m.npcs.push({ id: 'shopkeeper', name: 'Shopkeeper Rin', x: 9, y: 1, dir: 'down', sprite: null, color: '#c97a2b', dialog: 'shopkeeper' });
  m.exits.push({ x: 7, y: 8, to: 'haven', tx: 11, ty: 7 });
  MAPS.hub = m;

  // ---- MEADOW ROUTE ----
  m = newMap('meadow', 30, 20, Array.from({ length: 20 }, () => Array(30).fill('grass')), 'Meadow Route');
  m.area = 'meadow';
  m.atmosphere = 'petals';
  fillRect(m, 5, 4, 5, 5, 'tallgrass'); fillRect(m, 14, 10, 6, 5, 'tallgrass');
  fillRect(m, 22, 3, 6, 5, 'tallgrass'); fillRect(m, 10, 15, 4, 4, 'tallgrass');
  fillRect(m, 2, 12, 3, 3, 'flowers'); fillRect(m, 17, 16, 4, 2, 'flowers'); fillRect(m, 25, 12, 3, 2, 'flowers');
  fillRect(m, 20, 12, 4, 3, 'pond'); // small pond
  fillRect(m, 0, 9, 30, 1, 'path');
  fillRect(m, 15, 0, 1, 20, 'path');
  // bonus clearing NE, blocked by vines
  fillRect(m, 26, 0, 4, 4, 'flowers');
  m.objects.push({ x: 25, y: 1, type: 'vines', id: 'vines1' });
  m.objects.push({ x: 25, y: 2, type: 'vines', id: 'vines2' });
  m.objects.push({ x: 25, y: 3, type: 'vines', id: 'vines3' });
  m.objects.push({ x: 27, y: 1, type: 'item', item: 'firstAidKit', id: 'clearing_kit' });
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && ((o.x === 0 && o.y === 9) || (o.x === 29 && o.y === 9) || (o.x === 15 && o.y === 0) || (o.x === 15 && o.y === 19))));
  m.exits.push({ x: 0, y: 9, to: 'haven', tx: 22, ty: 9 });
  m.exits.push({ x: 15, y: 0, to: 'woods', tx: 13, ty: 17 });
  m.exits.push({ x: 29, y: 9, to: 'oasis', tx: 1, ty: 9 });
  m.exits.push({ x: 15, y: 19, to: 'mangrove', tx: 13, ty: 1 });
  m.objects.push({ x: 6, y: 14, type: 'rock', id: 'rock1' }); m.objects.push({ x: 8, y: 16, type: 'rock', id: 'rock2' });
  m.objects.push({ x: 25, y: 10, type: 'rock', id: 'rock3' });
  m.objects.push({ x: 27, y: 8, type: 'sick', id: 'sickAnimal' }); // Phase 2: the sick animal, east edge
  m.objects.push({ x: 4, y: 10, type: 'berry', id: 'berry1' }); m.objects.push({ x: 16, y: 4, type: 'berry', id: 'berry2' });
  m.objects.push({ x: 27, y: 15, type: 'berry', id: 'berry3' });
  scatter(m, null, 'tree', 10, null);
  MAPS.meadow = m;

  // ---- WHISPERING WOODS ----
  m = newMap('woods', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('grass')), 'Whispering Woods');
  m.area = 'woods';
  m.atmosphere = 'petals';
  fillRect(m, 4, 4, 6, 4, 'tallgrass'); fillRect(m, 16, 10, 6, 4, 'tallgrass'); fillRect(m, 8, 12, 4, 3, 'tallgrass');
  fillRect(m, 10, 6, 5, 2, 'flowers');
  fillRect(m, 12, 0, 2, 18, 'path');
  m.objects.push({ x: 5, y: 5, type: 'scent', id: 'scent1' }); m.objects.push({ x: 12, y: 9, type: 'scent', id: 'scent2' }); m.objects.push({ x: 20, y: 6, type: 'scent', id: 'scent3' });
  m.objects.push({ x: 20, y: 4, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#2b6b2b', id: 'forestArenaBldg' });
  m.objects.push({ x: 7, y: 14, type: 'rock', id: 'rock4' }); m.objects.push({ x: 21, y: 12, type: 'rock', id: 'rock5' });
  m.objects.push({ x: 3, y: 9, type: 'berry', id: 'berry4' }); m.objects.push({ x: 22, y: 3, type: 'berry', id: 'berry5' });
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && ((o.x === 13 && o.y === 17) || (o.x === 13 && o.y === 0))));
  m.exits.push({ x: 13, y: 17, to: 'meadow', tx: 15, ty: 1 });
  m.exits.push({ x: 13, y: 0, to: 'howling', tx: 13, ty: 16 });
  m.exits.push({ x: 21, y: 6, to: 'forestArena', tx: 8, ty: 10 }); // Forest Clash arena door
  m.npcs.push({ id: 'ranger', name: 'Ranger Dee', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b6b2b', dialog: 'ranger' });
  m.npcs.push({ id: 'lostCreature', name: 'Lost Pup', x: 18, y: 6, dir: 'down', sprite: null, color: '#8a8a8a', dialog: 'lostCreature' });
  scatter(m, null, 'tree', 14, [[21, 6], [18, 6], [13, 9], [13, 0], [20, 4]]);
  MAPS.woods = m;

  // ---- MIRAGE OASIS ----
  m = newMap('oasis', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('sand')), 'The Mirage Oasis');
  m.area = 'oasis';
  m.atmosphere = 'sand';
  fillRect(m, 8, 4, 10, 6, 'grass');
  fillRect(m, 10, 5, 6, 4, 'water'); fillRect(m, 11, 6, 4, 2, 'waterDeep');
  fillRect(m, 3, 12, 6, 3, 'tallgrass'); fillRect(m, 19, 12, 5, 3, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 18, y: 4, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#c9a13b', id: 'arena' });
  m.objects.push({ x: 9, y: 4, type: 'palm', id: 'palm1' }); m.objects.push({ x: 16, y: 4, type: 'palm', id: 'palm2' });
  m.objects.push({ x: 8, y: 10, type: 'palm', id: 'palm3' }); m.objects.push({ x: 17, y: 10, type: 'palm', id: 'palm4' });
  m.objects.push({ x: 5, y: 14, type: 'rock', id: 'rock6' });
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 0, y: 9, to: 'meadow', tx: 28, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'ember', tx: 1, ty: 9 });
  m.exits.push({ x: 13, y: 17, to: 'reef', tx: 13, ty: 1 });
  m.exits.push({ x: 19, y: 6, to: 'arena', tx: 8, ty: 10 }); // Arena door
  m.npcs.push({ id: 'fisherman', name: 'Old Finn', x: 9, y: 9, dir: 'up', sprite: null, color: '#2b6b8a', dialog: 'fisherman' });
  MAPS.oasis = m;

  // ---- TOURNAMENT ARENA (interior) ----
  m = newMap('arena', 16, 12, Array.from({ length: 12 }, () => Array(16).fill('arenaFloor')), 'Tournament Arena');
  fillRect(m, 0, 0, 16, 3, 'stands');
  for (let x = 0; x < 16; x++) { m.ground[11][x] = 'cliff'; m.ground[3][x] = 'arenaFloor'; }
  for (let y = 0; y < 12; y++) { m.ground[y][0] = 'cliff'; m.ground[y][15] = 'cliff'; }
  m.objects.push({ x: 2, y: 4, type: 'board', id: 'bracket' });
  m.npcs.push({ id: 'arenamaster', name: 'Arena Master', x: 8, y: 5, dir: 'down', sprite: null, color: '#8a2b2b', dialog: 'arenamaster' });
  m.exits.push({ x: 8, y: 10, to: 'oasis', tx: 19, ty: 7 });
  MAPS.arena = m;

  // ---- HOWLING PEAKS (north, Mammal + Smell) ----
  m = newMap('howling', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('snow')), 'The Howling Peaks');
  m.area = 'howling'; m.atmosphere = 'snow';
  fillRect(m, 6, 6, 4, 3, 'ice'); fillRect(m, 18, 12, 4, 3, 'ice');
  fillRect(m, 12, 8, 2, 10, 'path');
  m.objects.push({ x: 5, y: 5, type: 'snowtree', id: 'st1' }); m.objects.push({ x: 20, y: 4, type: 'snowtree', id: 'st2' });
  m.objects.push({ x: 8, y: 13, type: 'snowtree', id: 'st3' }); m.objects.push({ x: 22, y: 14, type: 'snowtree', id: 'st4' });
  m.objects.push({ x: 4, y: 10, type: 'snowtree', id: 'st5' });
  m.objects.push({ x: 7, y: 4, type: 'snowrock', id: 'sr1' }); m.objects.push({ x: 19, y: 13, type: 'snowrock', id: 'sr2' });
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && ((o.x === 13 && o.y === 17) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 13, y: 17, to: 'woods', tx: 13, ty: 1 });
  m.exits.push({ x: 25, y: 9, to: 'grizzly', tx: 1, ty: 9 });
  m.npcs.push({ id: 'hunter', name: 'Hunter Bram', x: 13, y: 9, dir: 'down', sprite: null, color: '#5a3a1a', dialog: 'hunter' });
  MAPS.howling = m;

  // ---- GRIZZLY DEN (north, Mammal + Hearing) ----
  m = newMap('grizzly', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('snow')), 'The Grizzly Den');
  m.area = 'grizzly'; m.atmosphere = 'snow';
  fillRect(m, 6, 4, 5, 4, 'grass'); fillRect(m, 18, 12, 5, 4, 'grass');
  fillRect(m, 12, 4, 2, 12, 'path');
  m.objects.push({ x: 5, y: 12, type: 'snowtree', id: 'st6' }); m.objects.push({ x: 21, y: 5, type: 'snowtree', id: 'st7' });
  m.objects.push({ x: 8, y: 14, type: 'snowrock', id: 'sr3' }); m.objects.push({ x: 17, y: 4, type: 'snowrock', id: 'sr4' });
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'howling', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'frozen', tx: 1, ty: 9 });
  m.npcs.push({ id: 'trapper', name: 'Trapper Wren', x: 13, y: 9, dir: 'down', sprite: null, color: '#6b4a2b', dialog: 'trapper' });
  MAPS.grizzly = m;

  // ---- FROZEN ROOST (north, Bird + Sight) ----
  m = newMap('frozen', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('ice')), 'The Frozen Roost');
  m.area = 'frozen'; m.atmosphere = 'snow';
  fillRect(m, 4, 4, 6, 5, 'snow'); fillRect(m, 16, 10, 6, 4, 'snow');
  fillRect(m, 12, 0, 2, 18, 'path');
  m.objects.push({ x: 5, y: 13, type: 'snowtree', id: 'st8' }); m.objects.push({ x: 22, y: 12, type: 'snowtree', id: 'st9' });
  m.objects.push({ x: 8, y: 4, type: 'snowrock', id: 'sr5' }); m.objects.push({ x: 18, y: 14, type: 'snowrock', id: 'sr6' });
  m.objects.push({ x: 18, y: 4, type: 'arena', w: 4, h: 2, wall: '#e8f0fa', roof: '#7fb8d8', id: 'frostArenaBldg' }); // Frost Crown arena
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && ((o.x === 0 && o.y === 9) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 0, y: 9, to: 'grizzly', tx: 24, ty: 9 });
  m.exits.push({ x: 13, y: 17, to: 'iceLake', tx: 13, ty: 1 });
  m.exits.push({ x: 19, y: 6, to: 'frostArena', tx: 8, ty: 10 }); // Frost Crown arena door
  m.npcs.push({ id: 'climber', name: 'Climber Ash', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b4a6b', dialog: 'climber' });
  MAPS.frozen = m;

  // ---- ICE LAKE (north, Fish + Smell) ----
  m = newMap('iceLake', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('ice')), 'Ice Lake');
  m.area = 'iceLake'; m.atmosphere = 'snow';
  fillRect(m, 4, 4, 5, 4, 'snow'); fillRect(m, 18, 12, 5, 4, 'snow');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 6, y: 13, type: 'snowtree', id: 'st10' }); m.objects.push({ x: 20, y: 4, type: 'snowtree', id: 'st11' });
  m.objects.push({ x: 9, y: 5, type: 'snowrock', id: 'sr7' }); m.objects.push({ x: 17, y: 13, type: 'snowrock', id: 'sr8' });
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && ((o.x === 13 && o.y === 0) || (o.x === 0 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'frozen', tx: 13, ty: 16 });
  m.exits.push({ x: 0, y: 9, to: 'coldSpring', tx: 24, ty: 9 });
  m.npcs.push({ id: 'iceFisher', name: 'Ice Fisher Nils', x: 13, y: 9, dir: 'down', sprite: null, color: '#3a6b8a', dialog: 'iceFisher' });
  MAPS.iceLake = m;

  // ---- COLD SPRING (north, Amphibian + Touch) ----
  m = newMap('coldSpring', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('snow')), 'The Cold Spring');
  m.area = 'coldSpring'; m.atmosphere = 'snow';
  fillRect(m, 10, 8, 6, 4, 'ice'); // the spring itself
  fillRect(m, 3, 3, 4, 3, 'grass');
  fillRect(m, 12, 0, 2, 18, 'path');
  m.objects.push({ x: 5, y: 5, type: 'snowtree', id: 'st12' }); m.objects.push({ x: 21, y: 13, type: 'snowtree', id: 'st13' });
  m.objects.push({ x: 8, y: 14, type: 'snowrock', id: 'sr9' }); m.objects.push({ x: 18, y: 4, type: 'snowrock', id: 'sr10' });
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && ((o.x === 25 && o.y === 9) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 25, y: 9, to: 'iceLake', tx: 1, ty: 9 });
  m.exits.push({ x: 13, y: 17, to: 'woods', tx: 20, ty: 1 });
  m.npcs.push({ id: 'springKeeper', name: 'Spring Keeper Ila', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b6b6b', dialog: 'springKeeper' });
  MAPS.coldSpring = m;

  // ---- EMBER DUNES (desert center, Reptile + Heat) ----
  m = newMap('ember', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('dune')), 'The Ember Dunes');
  m.area = 'ember'; m.atmosphere = 'sand';
  fillRect(m, 8, 5, 4, 3, 'sand'); fillRect(m, 18, 12, 4, 3, 'sand');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 13, y: 4, type: 'lablog', id: 'lablog' }); // Phase 2: the lab log
  m.objects.push({ x: 18, y: 4, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#c96a3b', id: 'emberArenaBldg' }); // Desert Heat arena
  m.objects.push({ x: 5, y: 5, type: 'cactus', id: 'cac1' }); m.objects.push({ x: 20, y: 12, type: 'cactus', id: 'cac2' });
  m.objects.push({ x: 8, y: 14, type: 'cactus', id: 'cac3' });
  m.objects.push({ x: 6, y: 12, type: 'sandstone', id: 'ss1' }); m.objects.push({ x: 23, y: 12, type: 'sandstone', id: 'ss2' });
  borderTrees(m, 'cactus');
  m.objects = m.objects.filter(o => !(o.type === 'cactus' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'oasis', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'antColony', tx: 1, ty: 9 });
  m.exits.push({ x: 19, y: 6, to: 'emberArena', tx: 8, ty: 10 }); // Desert Heat arena door
  m.npcs.push({ id: 'nomad', name: 'Desert Nomad', x: 13, y: 10, dir: 'down', sprite: null, color: '#8a6b2b', dialog: 'nomad' });
  MAPS.ember = m;

  // ---- ANT COLONY (desert center, Insect + Smell) ----
  m = newMap('antColony', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('dune')), 'The Ant Colony');
  m.area = 'antColony'; m.atmosphere = 'sand';
  fillRect(m, 6, 6, 5, 4, 'sand'); fillRect(m, 18, 10, 5, 4, 'sand');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'cactus', id: 'cac4' }); m.objects.push({ x: 21, y: 13, type: 'cactus', id: 'cac5' });
  m.objects.push({ x: 8, y: 13, type: 'sandstone', id: 'ss3' }); m.objects.push({ x: 18, y: 5, type: 'sandstone', id: 'ss4' });
  borderTrees(m, 'cactus');
  m.objects = m.objects.filter(o => !(o.type === 'cactus' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'ember', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'rustFields', tx: 1, ty: 9 }); // east into the wasteland (gated by the Dump Site mission)
  m.npcs.push({ id: 'antKeeper', name: 'Ant Keeper Boz', x: 13, y: 9, dir: 'down', sprite: null, color: '#6b4a2b', dialog: 'antKeeper' });
  MAPS.antColony = m;

  // ---- CORAL REEF (south coast, Fish + Electroreception) ----
  m = newMap('reef', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('sand')), 'The Coral Reef');
  m.area = 'reef'; m.atmosphere = 'spray';
  fillRect(m, 8, 4, 10, 4, 'water'); fillRect(m, 10, 5, 6, 2, 'waterDeep');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 4, y: 4, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#2b6b8a', id: 'reefArenaBldg' });
  m.objects.push({ x: 6, y: 12, type: 'coral', id: 'cor1' }); m.objects.push({ x: 19, y: 5, type: 'coral', id: 'cor2' });
  m.objects.push({ x: 21, y: 13, type: 'coral', id: 'cor3' }); m.objects.push({ x: 10, y: 13, type: 'coral', id: 'cor4' });
  m.objects.push({ x: 22, y: 4, type: 'palm', id: 'palm5' }); m.objects.push({ x: 3, y: 12, type: 'palm', id: 'palm6' });
  borderTrees(m, 'palm');
  m.objects = m.objects.filter(o => !(o.type === 'palm' && ((o.x === 13 && o.y === 0) || (o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 13, y: 0, to: 'oasis', tx: 13, ty: 16 });
  m.exits.push({ x: 0, y: 9, to: 'mangrove', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'tidepools', tx: 1, ty: 9 });
  m.exits.push({ x: 13, y: 17, to: 'deepTrench', tx: 13, ty: 1 });
  m.exits.push({ x: 5, y: 6, to: 'reefArena', tx: 8, ty: 10 }); // Reef Rumble arena door
  m.npcs.push({ id: 'diver', name: 'Diver Suki', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b8a8a', dialog: 'diver' });
  MAPS.reef = m;

  // ---- TIDE POOLS (south coast, Crustacean + Smell) ----
  m = newMap('tidepools', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('sand')), 'The Tide Pools');
  m.area = 'tidepools'; m.atmosphere = 'spray';
  fillRect(m, 5, 5, 4, 3, 'water'); fillRect(m, 18, 12, 4, 3, 'water');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 6, y: 13, type: 'coral', id: 'cor5' }); m.objects.push({ x: 20, y: 5, type: 'coral', id: 'cor6' });
  m.objects.push({ x: 4, y: 4, type: 'palm', id: 'palm7' }); m.objects.push({ x: 22, y: 14, type: 'palm', id: 'palm8' });
  borderTrees(m, 'palm');
  m.objects = m.objects.filter(o => !(o.type === 'palm' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'reef', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'butterfly', tx: 1, ty: 9 });
  m.npcs.push({ id: 'tidepooler', name: 'Tidepooler Kit', x: 13, y: 9, dir: 'down', sprite: null, color: '#8a4a6b', dialog: 'tidepooler' });
  MAPS.tidepools = m;

  // ---- BUTTERFLY ISLAND (south coast, Insect + Sight) ----
  m = newMap('butterfly', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('grass')), 'Butterfly Island');
  m.area = 'butterfly'; m.atmosphere = 'petals';
  fillRect(m, 4, 4, 5, 3, 'flowers'); fillRect(m, 18, 12, 5, 3, 'flowers');
  fillRect(m, 0, 16, 26, 2, 'sand'); // south beach
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 12, type: 'tree', id: 'bt1' }); m.objects.push({ x: 21, y: 5, type: 'tree', id: 'bt2' });
  m.objects.push({ x: 8, y: 5, type: 'berry', id: 'berry6' }); m.objects.push({ x: 19, y: 13, type: 'berry', id: 'berry7' });
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && o.x === 0 && o.y === 9));
  m.exits.push({ x: 0, y: 9, to: 'tidepools', tx: 24, ty: 9 });
  m.npcs.push({ id: 'butterflyWatcher', name: 'Watcher Lila', x: 13, y: 9, dir: 'down', sprite: null, color: '#7a4a9e', dialog: 'butterflyWatcher' });
  MAPS.butterfly = m;

  // ---- DEEP TRENCH (south coast, Mollusk + Touch) ----
  m = newMap('deepTrench', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('sand')), 'Deep Trench');
  m.area = 'deepTrench'; m.atmosphere = 'bubbles';
  fillRect(m, 6, 4, 14, 6, 'water'); fillRect(m, 9, 5, 8, 4, 'waterDeep');
  fillRect(m, 12, 0, 2, 18, 'path');
  m.objects.push({ x: 5, y: 12, type: 'coral', id: 'cor7' }); m.objects.push({ x: 20, y: 12, type: 'coral', id: 'cor8' });
  m.objects.push({ x: 8, y: 13, type: 'coral', id: 'cor9' });
  m.objects.push({ x: 4, y: 4, type: 'palm', id: 'palm9' }); m.objects.push({ x: 22, y: 4, type: 'palm', id: 'palm10' });
  borderTrees(m, 'palm');
  m.objects = m.objects.filter(o => !(o.type === 'palm' && o.x === 13 && o.y === 0));
  m.exits.push({ x: 13, y: 0, to: 'reef', tx: 13, ty: 16 });
  m.npcs.push({ id: 'trenchDiver', name: 'Trench Diver Moss', x: 13, y: 12, dir: 'down', sprite: null, color: '#2b4a8a', dialog: 'trenchDiver' });
  MAPS.deepTrench = m;

  // ---- MANGROVE (south coast, Reptile + Touch) ----
  m = newMap('mangrove', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('grass')), 'The Mangrove');
  m.area = 'mangrove'; m.atmosphere = 'rain';
  fillRect(m, 4, 4, 5, 4, 'water'); fillRect(m, 18, 12, 5, 3, 'water');
  fillRect(m, 12, 0, 2, 18, 'path');
  m.objects.push({ x: 5, y: 12, type: 'tree', id: 'mg1' }); m.objects.push({ x: 21, y: 5, type: 'tree', id: 'mg2' });
  m.objects.push({ x: 8, y: 5, type: 'berry', id: 'berry8' }); m.objects.push({ x: 19, y: 13, type: 'berry', id: 'berry9' });
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && ((o.x === 13 && o.y === 0) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'meadow', tx: 15, ty: 18 });
  m.exits.push({ x: 25, y: 9, to: 'reef', tx: 1, ty: 9 });
  m.npcs.push({ id: 'mangroveGuide', name: 'Guide Tala', x: 13, y: 9, dir: 'down', sprite: null, color: '#4a6b2b', dialog: 'mangroveGuide' });
  MAPS.mangrove = m;

  // ---- FOREST CLASH ARENA (interior, Whispering Woods) ----
  m = newMap('forestArena', 16, 12, Array.from({ length: 12 }, () => Array(16).fill('arenaFloor')), 'Forest Clash Arena');
  fillRect(m, 0, 0, 16, 3, 'stands');
  for (let x = 0; x < 16; x++) { m.ground[11][x] = 'cliff'; m.ground[3][x] = 'arenaFloor'; }
  for (let y = 0; y < 12; y++) { m.ground[y][0] = 'cliff'; m.ground[y][15] = 'cliff'; }
  m.objects.push({ x: 2, y: 4, type: 'board', id: 'bracket2' });
  m.npcs.push({ id: 'arenamaster', name: 'Arena Master', x: 8, y: 5, dir: 'down', sprite: null, color: '#2b6b2b', dialog: 'arenamaster' });
  m.exits.push({ x: 8, y: 10, to: 'woods', tx: 21, ty: 7 });
  MAPS.forestArena = m;

  // ---- REEF RUMBLE ARENA (interior, Coral Reef) ----
  m = newMap('reefArena', 16, 12, Array.from({ length: 12 }, () => Array(16).fill('arenaFloor')), 'Reef Rumble Arena');
  fillRect(m, 0, 0, 16, 3, 'stands');
  for (let x = 0; x < 16; x++) { m.ground[11][x] = 'cliff'; m.ground[3][x] = 'arenaFloor'; }
  for (let y = 0; y < 12; y++) { m.ground[y][0] = 'cliff'; m.ground[y][15] = 'cliff'; }
  m.objects.push({ x: 2, y: 4, type: 'board', id: 'bracket3' });
  m.npcs.push({ id: 'arenamaster', name: 'Arena Master', x: 8, y: 5, dir: 'down', sprite: null, color: '#2b6b8a', dialog: 'arenamaster' });
  m.exits.push({ x: 8, y: 10, to: 'reef', tx: 5, ty: 7 });
  MAPS.reefArena = m;

  // ================= PASS 2 — ROK CITY =================
  // ---- ROK CITY (west, the big city: corporate towers, Rok University campus, the Grand Bazaar) ----
  m = newMap('rokCity', 30, 20, Array.from({ length: 20 }, () => Array(30).fill('citypave')), 'Rok City');
  m.area = 'rokCity'; m.atmosphere = 'neon';
  fillRect(m, 0, 9, 30, 1, 'path'); // the main street, east-west
  fillRect(m, 14, 0, 2, 20, 'path'); // the north-south avenue
  fillRect(m, 10, 10, 6, 4, 'tilefloor'); // the plaza
  fillRect(m, 2, 14, 4, 3, 'tallgrass'); // overgrown alley lot (stray dogs, city bats)
  fillRect(m, 24, 14, 4, 3, 'tallgrass');
  // corporate towers along the north edge
  m.objects.push({ x: 2, y: 1, type: 'tower', w: 3, h: 3, wall: '#2b3350', id: 'tower1' });
  m.objects.push({ x: 7, y: 0, type: 'tower', w: 2, h: 4, wall: '#3a2b50', id: 'tower2' });
  m.objects.push({ x: 18, y: 1, type: 'tower', w: 3, h: 3, wall: '#2b3a50', id: 'tower3' });
  m.objects.push({ x: 24, y: 0, type: 'tower', w: 3, h: 4, wall: '#50332b', id: 'tower4' });
  // the Grand Bazaar entrance + the Ivory Tower (university) entrance
  m.objects.push({ x: 4, y: 4, type: 'house', w: 4, h: 2, wall: '#e8d8b0', roof: '#c94f7d', id: 'bazaarBldg' });
  m.objects.push({ x: 20, y: 4, type: 'house', w: 4, h: 2, wall: '#dfe8ff', roof: '#2b4a9e', id: 'univBldg' });
  m.objects.push({ x: 12, y: 10, type: 'stall', id: 'plazaStall' });
  m.objects.push({ x: 24, y: 5, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#2b4a9e', id: 'cityArenaBldg' }); // Rok City Championship arena
  m.objects.push({ x: 8, y: 9, type: 'streetlight', id: 'lamp1' }); m.objects.push({ x: 20, y: 9, type: 'streetlight', id: 'lamp2' });
  m.objects.push({ x: 14, y: 12, type: 'streetlight', id: 'lamp3' });
  borderTrees(m, 'streetlight');
  m.objects = m.objects.filter(o => !(o.type === 'streetlight' && ((o.x === 0 && o.y === 9) || (o.x === 29 && o.y === 9) || (o.x === 7 && o.y === 0) || (o.x === 8 && o.y === 0) || (o.x === 24 && o.y === 0) || (o.x === 25 && o.y === 0) || (o.x === 26 && o.y === 0))));
  m.exits.push({ x: 29, y: 9, to: 'haven', tx: 1, ty: 9 });
  m.exits.push({ x: 5, y: 6, to: 'bazaar', tx: 8, ty: 10 }); // Grand Bazaar door
  m.exits.push({ x: 21, y: 6, to: 'university', tx: 12, ty: 16 }); // Ivory Tower door
  m.exits.push({ x: 25, y: 7, to: 'cityArena', tx: 8, ty: 10 }); // Rok City Championship arena door
  m.npcs.push({ id: 'cityGuide', name: 'City Guide', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b6b8a', dialog: 'cityGuide' });
  m.npcs.push({ id: 'plazaClerk', name: 'Plaza Clerk', x: 11, y: 11, dir: 'down', sprite: null, color: '#8a2b6b', dialog: 'plazaClerk' });
  m.npcs.push({ id: 'flockOfficer', name: 'Flock Officer', x: 18, y: 9, dir: 'left', sprite: null, color: '#3a3a4a', dialog: 'flockOfficer' });
  m.npcs.push({ id: 'streetDealer', name: 'Street Dealer', x: 22, y: 12, dir: 'up', sprite: null, color: '#5a3a1a', dialog: 'streetDealer' });
  MAPS.rokCity = m;

  // ---- GRAND BAZAAR (indoor market in Rok City) ----
  m = newMap('bazaar', 16, 12, Array.from({ length: 12 }, () => Array(16).fill('tilefloor')), 'The Grand Bazaar');
  m.area = 'bazaar'; m.atmosphere = 'petals';
  for (let x = 0; x < 16; x++) { m.ground[0][x] = 'cliff'; m.ground[11][x] = 'cliff'; }
  for (let y = 0; y < 12; y++) { m.ground[y][0] = 'cliff'; m.ground[y][15] = 'cliff'; }
  m.objects.push({ x: 2, y: 2, type: 'stall', id: 'stall1' });
  m.objects.push({ x: 6, y: 2, type: 'stall', id: 'stall2' });
  m.objects.push({ x: 10, y: 2, type: 'stall', id: 'stall3' });
  m.objects.push({ x: 2, y: 7, type: 'stall', id: 'stall4' });
  m.objects.push({ x: 12, y: 7, type: 'stall', id: 'stall5' });
  m.objects.push({ x: 6, y: 8, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#c94f7d', id: 'bazaarArenaBldg' });
  m.exits.push({ x: 13, y: 10, to: 'rokCity', tx: 5, ty: 7 }); // pass 3 fix — was (8,10), east-adjacent to the arena door, so walking to the door tripped the city exit first
  m.exits.push({ x: 7, y: 10, to: 'bazaarArena', tx: 8, ty: 10 }); // Bazaar Brawl arena door — approach from the west (6,10)
  m.npcs.push({ id: 'mara', name: 'Mara', x: 8, y: 5, dir: 'down', sprite: 'mara', dialog: 'mara' });
  m.npcs.push({ id: 'bazaarMerchant', name: 'Bazaar Merchant', x: 4, y: 5, dir: 'down', sprite: null, color: '#c98a2b', dialog: 'bazaarMerchant' });
  MAPS.bazaar = m;

  // ---- IVORY TOWER / ROK UNIVERSITY (campus in Rok City) ----
  m = newMap('university', 24, 18, Array.from({ length: 18 }, () => Array(24).fill('grass')), 'Rok University');
  m.area = 'university'; m.atmosphere = 'petals';
  fillRect(m, 0, 9, 24, 1, 'path');
  fillRect(m, 11, 0, 2, 18, 'path');
  fillRect(m, 9, 6, 6, 3, 'tilefloor'); // the tower forecourt
  fillRect(m, 4, 12, 5, 3, 'tallgrass'); fillRect(m, 16, 12, 5, 3, 'tallgrass'); // campus lawns
  fillRect(m, 3, 3, 4, 2, 'flowers'); fillRect(m, 18, 3, 4, 2, 'flowers');
  m.objects.push({ x: 10, y: 2, type: 'tower', w: 4, h: 4, wall: '#dfe8ff', id: 'ivoryTower' });
  m.objects.push({ x: 18, y: 4, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#2b4a9e', id: 'univArenaBldg' });
  m.objects.push({ x: 5, y: 5, type: 'tree', id: 'cam1' }); m.objects.push({ x: 19, y: 13, type: 'tree', id: 'cam2' });
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && ((o.x === 12 && o.y === 17) || (o.x === 19 && o.y === 6))));
  m.exits.push({ x: 12, y: 16, to: 'rokCity', tx: 21, ty: 7 });
  m.exits.push({ x: 19, y: 6, to: 'universityArena', tx: 8, ty: 10 }); // University Games arena door
  m.npcs.push({ id: 'caleb', name: 'Caleb', x: 12, y: 8, dir: 'down', sprite: 'caleb', dialog: 'caleb' });
  m.npcs.push({ id: 'universityStudent', name: 'University Student', x: 8, y: 10, dir: 'down', sprite: null, color: '#4a6b2b', dialog: 'universityStudent' });
  MAPS.university = m;

  // ================= PASS 2 — EAST WASTELAND =================
  // ---- RUST FIELDS (east, Mammal + Smell, mutant wolves) ----
  m = newMap('rustFields', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('rust')), 'The Rust Fields');
  m.area = 'rustFields'; m.atmosphere = 'ash'; m.locked = 'unlock_east';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass'); // overgrown rust
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'scrap', id: 'scrap1' }); m.objects.push({ x: 20, y: 12, type: 'scrap', id: 'scrap2' });
  m.objects.push({ x: 8, y: 13, type: 'scrap', id: 'scrap3' }); m.objects.push({ x: 18, y: 4, type: 'barrel', id: 'barrel1' });
  m.objects.push({ x: 10, y: 12, type: 'barrel', id: 'barrel2' });
  m.objects.push({ x: 17, y: 13, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#8a2b2b', id: 'rustArenaBldg' }); // Wasteland War arena
  borderTrees(m, 'scrap');
  m.objects = m.objects.filter(o => !(o.type === 'scrap' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'antColony', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'ashenFlats', tx: 1, ty: 9 });
  m.exits.push({ x: 18, y: 15, to: 'rustArena', tx: 8, ty: 10 }); // Wasteland War arena door
  m.npcs.push({ id: 'rustFarmer', name: 'Rust Farmer', x: 13, y: 9, dir: 'down', sprite: null, color: '#6b4a2b', dialog: 'rustFarmer' });
  MAPS.rustFields = m;

  // ---- ASHEN FLATS (east, Reptile + Heat, mutant snakes/lizards) ----
  m = newMap('ashenFlats', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('ash')), 'The Ashen Flats');
  m.area = 'ashenFlats'; m.atmosphere = 'ash'; m.locked = 'unlock_east';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'scrap', id: 'scrap4' }); m.objects.push({ x: 20, y: 12, type: 'scrap', id: 'scrap5' });
  m.objects.push({ x: 8, y: 13, type: 'sandstone', id: 'ash1' }); m.objects.push({ x: 18, y: 4, type: 'sandstone', id: 'ash2' });
  m.objects.push({ x: 12, y: 4, type: 'barrel', id: 'barrel3' });
  borderTrees(m, 'scrap');
  m.objects = m.objects.filter(o => !(o.type === 'scrap' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'rustFields', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'wreckyard', tx: 1, ty: 9 });
  m.npcs.push({ id: 'ashNomad', name: 'Ash Nomad', x: 13, y: 9, dir: 'down', sprite: null, color: '#8a8a8a', dialog: 'ashNomad' });
  MAPS.ashenFlats = m;

  // ---- WRECKYARD (east, Fish + Electroreception, mutant eels — near the dump site) ----
  m = newMap('wreckyard', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('wreck')), 'The Wreckyard');
  m.area = 'wreckyard'; m.atmosphere = 'rain'; m.locked = 'unlock_east';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 4, y: 4, type: 'dumpster', id: 'dump1' }); m.objects.push({ x: 20, y: 12, type: 'dumpster', id: 'dump2' });
  m.objects.push({ x: 8, y: 13, type: 'barrel', id: 'barrel4' }); m.objects.push({ x: 18, y: 4, type: 'barrel', id: 'barrel5' });
  m.objects.push({ x: 12, y: 13, type: 'scrap', id: 'scrap6' }); m.objects.push({ x: 6, y: 12, type: 'scrap', id: 'scrap7' });
  borderTrees(m, 'scrap');
  m.objects = m.objects.filter(o => !(o.type === 'scrap' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'ashenFlats', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'hollow', tx: 1, ty: 9 });
  m.npcs.push({ id: 'dumpWarden', name: 'Dump Warden', x: 10, y: 8, dir: 'down', sprite: null, color: '#3a5a2b', dialog: 'dumpWarden' });
  m.npcs.push({ id: 'wreckyardScavenger', name: 'Wreckyard Scavenger', x: 16, y: 10, dir: 'down', sprite: null, color: '#6b6b2b', dialog: 'wreckyardScavenger' });
  MAPS.wreckyard = m;

  // ---- THE HOLLOW (east, Arachnid + Touch, mutant spiders) ----
  m = newMap('hollow', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('grassDry')), 'The Hollow');
  m.area = 'hollow'; m.atmosphere = 'spores'; m.locked = 'unlock_east';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'web', id: 'web1' }); m.objects.push({ x: 20, y: 12, type: 'web', id: 'web2' });
  m.objects.push({ x: 8, y: 13, type: 'web', id: 'web3' }); m.objects.push({ x: 17, y: 4, type: 'tree', id: 'hol1' });
  m.objects.push({ x: 10, y: 12, type: 'tree', id: 'hol2' });
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'wreckyard', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'echoCaves', tx: 1, ty: 9 });
  m.npcs.push({ id: 'hollowKeeper', name: 'Hollow Keeper', x: 13, y: 9, dir: 'down', sprite: null, color: '#4a2b6b', dialog: 'hollowKeeper' });
  MAPS.hollow = m;

  // ---- ECHO CAVES (east, Mammal + Echolocation, bats — the gate to the Long Dark) ----
  m = newMap('echoCaves', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('cavefloor')), 'The Echo Caves');
  m.area = 'echoCaves'; m.atmosphere = 'spores'; m.locked = 'unlock_east';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass'); // cave moss
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 12, y: 2, type: 'gate', w: 2, id: 'longDarkGate' }); // the sealed gate
  m.objects.push({ x: 4, y: 12, type: 'arena', w: 4, h: 2, wall: '#e8d8b0', roof: '#5a4a7a', id: 'caveArenaBldg' }); // Ancient Crown arena
  m.objects.push({ x: 5, y: 5, type: 'crystal', id: 'crys1' }); m.objects.push({ x: 20, y: 12, type: 'crystal', id: 'crys2' });
  m.objects.push({ x: 8, y: 13, type: 'crystal', id: 'crys3' }); m.objects.push({ x: 18, y: 4, type: 'crystal', id: 'crys4' });
  borderTrees(m, 'crystal');
  m.objects = m.objects.filter(o => !(o.type === 'crystal' && o.x === 0 && o.y === 9));
  m.exits.push({ x: 0, y: 9, to: 'hollow', tx: 24, ty: 9 });
  m.exits.push({ x: 5, y: 14, to: 'caveArena', tx: 8, ty: 10 }); // Ancient Crown arena door
  m.npcs.push({ id: 'caveGuide', name: 'Cave Guide', x: 8, y: 10, dir: 'down', sprite: null, color: '#2b4a6b', dialog: 'caveGuide' });
  m.npcs.push({ id: 'exileScout', name: 'Exile Scout', x: 16, y: 10, dir: 'down', sprite: null, color: '#6b2b4a', dialog: 'exileScout' });
  MAPS.echoCaves = m;

  // ---- PASS 2 TOURNAMENT ARENAS (copy of the forestArena/reefArena pattern) ----
  function arenaMap(name, label, backMap, backX, backY) {
    const a = newMap(name, 16, 12, Array.from({ length: 12 }, () => Array(16).fill('arenaFloor')), label);
    fillRect(a, 0, 0, 16, 3, 'stands');
    for (let x = 0; x < 16; x++) { a.ground[11][x] = 'cliff'; a.ground[3][x] = 'arenaFloor'; }
    for (let y = 0; y < 12; y++) { a.ground[y][0] = 'cliff'; a.ground[y][15] = 'cliff'; }
    a.objects.push({ x: 2, y: 4, type: 'board', id: name + 'Bracket' });
    a.npcs.push({ id: 'arenamaster', name: 'Arena Master', x: 8, y: 5, dir: 'down', sprite: null, color: '#8a2b2b', dialog: 'arenamaster' });
    a.exits.push({ x: 8, y: 10, to: backMap, tx: backX, ty: backY });
    MAPS[name] = a;
    return a;
  }
  arenaMap('emberArena', 'Desert Heat Arena', 'ember', 19, 7);
  arenaMap('bazaarArena', 'Bazaar Brawl Arena', 'bazaar', 7, 11);
  arenaMap('frostArena', 'Frost Crown Arena', 'frozen', 19, 7);
  arenaMap('universityArena', 'University Games Arena', 'university', 19, 7);

  // ================= PASS 3 — THE LONG DARK =================
  // The cave is the only way into the 75+ world: three zones, each worse than the last.
  // Zone 1 The Mouth (Lv 60-70 mutants), Zone 2 The Deep (HM LIGHT + HM DIVE),
  // Zone 3 The Gate (HM CLIMB + HM SMASH, exit sealed until the Ancient Crown).
  m = newMap('caveMouth', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('cavefloor')), 'The Long Dark — The Mouth');
  m.area = 'caveMouth'; m.atmosphere = 'spores';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass'); // cave moss
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'crystal', id: 'cmc1' }); m.objects.push({ x: 20, y: 12, type: 'crystal', id: 'cmc2' });
  m.objects.push({ x: 8, y: 13, type: 'crystal', id: 'cmc3' }); m.objects.push({ x: 18, y: 4, type: 'crystal', id: 'cmc4' });
  borderTrees(m, 'crystal');
  m.objects = m.objects.filter(o => !(o.type === 'crystal' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 13, y: 17, to: 'echoCaves', tx: 13, ty: 3 });
  m.exits.push({ x: 13, y: 0, to: 'caveDeep', tx: 13, ty: 16 });
  m.npcs.push({ id: 'caveDelver', name: 'Cave Delver', x: 10, y: 9, dir: 'down', sprite: null, color: '#4a2b6b', dialog: 'ancientLocal' });
  MAPS.caveMouth = m;

  m = newMap('caveDeep', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('cavefloor')), 'The Long Dark — The Deep');
  m.area = 'caveDeep'; m.atmosphere = 'spores'; m.requires = ['unlock_HM_LIGHT', 'unlock_HM_DIVE'];
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 8, 4, 10, 4, 'water'); fillRect(m, 10, 5, 6, 2, 'waterDeep'); // flooded passages
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'crystal', id: 'cdc1' }); m.objects.push({ x: 20, y: 12, type: 'crystal', id: 'cdc2' });
  m.objects.push({ x: 8, y: 13, type: 'barrel', id: 'cdc3' }); m.objects.push({ x: 18, y: 4, type: 'barrel', id: 'cdc4' }); // old experiment gear
  borderTrees(m, 'crystal');
  m.objects = m.objects.filter(o => !(o.type === 'crystal' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 13, y: 17, to: 'caveMouth', tx: 13, ty: 1 });
  m.exits.push({ x: 13, y: 0, to: 'caveGate', tx: 13, ty: 16 });
  MAPS.caveDeep = m;

  m = newMap('caveGate', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('cavefloor')), 'The Long Dark — The Gate');
  m.area = 'caveGate'; m.atmosphere = 'spores'; m.requires = ['unlock_HM_CLIMB', 'unlock_HM_SMASH'];
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'crystal', id: 'cgc1' }); m.objects.push({ x: 20, y: 12, type: 'crystal', id: 'cgc2' });
  m.objects.push({ x: 12, y: 2, type: 'gate', w: 2, id: 'exitGate' }); // the exit gate — sealed until the Ancient Crown
  borderTrees(m, 'crystal');
  m.objects = m.objects.filter(o => !(o.type === 'crystal' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 13, y: 17, to: 'caveDeep', tx: 13, ty: 1 });
  m.exits.push({ x: 13, y: 0, to: 'rexBadlands', tx: 13, ty: 16, requires: 'unlock_longDarkExit' }); // the Ancient Crown unseals the exit
  MAPS.caveGate = m;

  // ================= PASS 3 — THE 75+ WORLD =================
  // The world past the cave: older than the main world, no towns, no shops, no Rok —
  // just the sanctuary and the wild. Every place is the home of an ancient typing.
  // ---- THE REX BADLANDS (center, Ancient Reptile + Smell — T. Rex) ----
  m = newMap('rexBadlands', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('badlands')), 'The Rex Badlands');
  m.area = 'rexBadlands'; m.atmosphere = 'sand';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'bone', id: 'rb1' }); m.objects.push({ x: 20, y: 12, type: 'bone', id: 'rb2' });
  m.objects.push({ x: 8, y: 13, type: 'fossil', id: 'rb3' }); m.objects.push({ x: 18, y: 4, type: 'fossil', id: 'rb4' });
  m.objects.push({ x: 20, y: 4, type: 'caveMouth', id: 'darkCavesMouth' }); // the Dark Caves, under the badlands
  borderTrees(m, 'bone');
  m.objects = m.objects.filter(o => !(o.type === 'bone' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9) || (o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17) || (o.x === 0 && o.y === 4))));
  m.exits.push({ x: 0, y: 9, to: 'caveGate', tx: 24, ty: 9 });
  m.exits.push({ x: 13, y: 0, to: 'hornedPlains', tx: 13, ty: 16 });
  m.exits.push({ x: 13, y: 17, to: 'saberFields', tx: 13, ty: 1 });
  m.exits.push({ x: 25, y: 9, to: 'raptorGrass', tx: 1, ty: 9 });
  m.exits.push({ x: 0, y: 4, to: 'pteroCliffs', tx: 24, ty: 9 });
  m.npcs.push({ id: 'ancientGuide', name: 'Ancient Guide', x: 13, y: 9, dir: 'down', sprite: null, color: '#8a5a2b', dialog: 'ancientLocal' });
  MAPS.rexBadlands = m;

  // ---- THE HORNED PLAINS (center, Ancient Reptile + Sight — Triceratops) ----
  m = newMap('hornedPlains', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('badlands')), 'The Horned Plains');
  m.area = 'hornedPlains'; m.atmosphere = 'sand';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'bone', id: 'hp1' }); m.objects.push({ x: 20, y: 12, type: 'bone', id: 'hp2' });
  m.objects.push({ x: 8, y: 13, type: 'fossil', id: 'hp3' }); m.objects.push({ x: 18, y: 4, type: 'fossil', id: 'hp4' });
  borderTrees(m, 'bone');
  m.objects = m.objects.filter(o => !(o.type === 'bone' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'mammothSteppe', tx: 13, ty: 16 });
  m.exits.push({ x: 13, y: 17, to: 'rexBadlands', tx: 13, ty: 1 });
  m.exits.push({ x: 25, y: 9, to: 'direDen', tx: 1, ty: 9 });
  m.npcs.push({ id: 'hornedHerder', name: 'Horned Herder', x: 13, y: 9, dir: 'down', sprite: null, color: '#6b4a2b', dialog: 'ancientLocal' });
  MAPS.hornedPlains = m;

  // ---- THE MAMMOTH STEPPE (north, Ancient Mammal + Smell — Mammoth) ----
  m = newMap('mammothSteppe', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('snow')), 'The Mammoth Steppe');
  m.area = 'mammothSteppe'; m.atmosphere = 'snow';
  fillRect(m, 6, 6, 4, 3, 'ice'); fillRect(m, 18, 12, 4, 3, 'ice');
  fillRect(m, 12, 8, 2, 10, 'path');
  m.objects.push({ x: 5, y: 5, type: 'snowtree', id: 'ms1' }); m.objects.push({ x: 20, y: 4, type: 'snowtree', id: 'ms2' });
  m.objects.push({ x: 8, y: 13, type: 'bone', id: 'ms3' }); m.objects.push({ x: 19, y: 13, type: 'bone', id: 'ms4' });
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && ((o.x === 25 && o.y === 9) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 25, y: 9, to: 'direDen', tx: 1, ty: 9 });
  m.exits.push({ x: 13, y: 17, to: 'hornedPlains', tx: 13, ty: 1 });
  m.npcs.push({ id: 'steppeHerder', name: 'Steppe Herder', x: 13, y: 9, dir: 'down', sprite: null, color: '#5a6b8a', dialog: 'ancientLocal' });
  MAPS.mammothSteppe = m;

  // ---- THE DIRE DEN (north, Ancient Mammal + Smell — Dire Wolf) ----
  m = newMap('direDen', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('snow')), 'The Dire Den');
  m.area = 'direDen'; m.atmosphere = 'snow';
  fillRect(m, 6, 4, 5, 4, 'grass'); fillRect(m, 18, 12, 5, 4, 'grass');
  fillRect(m, 12, 4, 2, 12, 'path');
  m.objects.push({ x: 5, y: 12, type: 'snowtree', id: 'dd1' }); m.objects.push({ x: 21, y: 5, type: 'snowtree', id: 'dd2' });
  m.objects.push({ x: 8, y: 14, type: 'bone', id: 'dd3' }); m.objects.push({ x: 17, y: 4, type: 'bone', id: 'dd4' });
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && ((o.x === 0 && o.y === 9) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 0, y: 9, to: 'mammothSteppe', tx: 24, ty: 9 });
  m.exits.push({ x: 13, y: 17, to: 'hornedPlains', tx: 24, ty: 9 });
  m.npcs.push({ id: 'direKeeper', name: 'Dire Keeper', x: 13, y: 9, dir: 'down', sprite: null, color: '#3a4a6b', dialog: 'ancientLocal' });
  MAPS.direDen = m;

  // ---- THE RAPTOR GRASSLANDS (center, Ancient Reptile + Sight — Velociraptor) ----
  m = newMap('raptorGrass', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('ancientGrass')), 'The Raptor Grasslands');
  m.area = 'raptorGrass'; m.atmosphere = 'sand';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'bone', id: 'rg1' }); m.objects.push({ x: 20, y: 12, type: 'bone', id: 'rg2' });
  m.objects.push({ x: 8, y: 13, type: 'fossil', id: 'rg3' }); m.objects.push({ x: 18, y: 4, type: 'fossil', id: 'rg4' });
  borderTrees(m, 'bone');
  m.objects = m.objects.filter(o => !(o.type === 'bone' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 0, y: 9, to: 'rexBadlands', tx: 24, ty: 9 });
  m.exits.push({ x: 13, y: 17, to: 'saberFields', tx: 13, ty: 1 });
  m.exits.push({ x: 25, y: 9, to: 'burningMarsh', tx: 1, ty: 9 });
  m.npcs.push({ id: 'raptorScout', name: 'Raptor Scout', x: 13, y: 9, dir: 'down', sprite: null, color: '#6b2b2b', dialog: 'ancientLocal' });
  MAPS.raptorGrass = m;

  // ---- THE SABER FIELDS (center, Ancient Mammal + Sight — Saber-Toothed Tiger) ----
  m = newMap('saberFields', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('ancientGrass')), 'The Saber Fields');
  m.area = 'saberFields'; m.atmosphere = 'sand';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'bone', id: 'sf1' }); m.objects.push({ x: 20, y: 12, type: 'bone', id: 'sf2' });
  m.objects.push({ x: 8, y: 13, type: 'fossil', id: 'sf3' }); m.objects.push({ x: 18, y: 4, type: 'fossil', id: 'sf4' });
  borderTrees(m, 'bone');
  m.objects = m.objects.filter(o => !(o.type === 'bone' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17) || (o.x === 0 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'rexBadlands', tx: 13, ty: 16 });
  m.exits.push({ x: 13, y: 17, to: 'deepRiver', tx: 13, ty: 1 });
  m.exits.push({ x: 0, y: 9, to: 'sanctuary', tx: 24, ty: 9 });
  m.npcs.push({ id: 'saberStalker', name: 'Saber Stalker', x: 13, y: 9, dir: 'down', sprite: null, color: '#8a6b2b', dialog: 'ancientLocal' });
  MAPS.saberFields = m;

  // ---- THE SANCTUARY (center — the only safe place in the 75+ world) ----
  m = newMap('sanctuary', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('grass')), 'The Sanctuary');
  m.atmosphere = 'petals'; // no area — nothing hunts you here
  fillRect(m, 10, 8, 6, 4, 'tilefloor'); // the camp square
  fillRect(m, 12, 0, 2, 18, 'path');
  m.objects.push({ x: 4, y: 4, type: 'tent', id: 'tent1' }); m.objects.push({ x: 19, y: 4, type: 'tent', id: 'tent2' });
  m.objects.push({ x: 4, y: 13, type: 'tent', id: 'tent3' }); m.objects.push({ x: 19, y: 13, type: 'tent', id: 'tent4' });
  m.objects.push({ x: 12, y: 9, type: 'campfire', id: 'sanctuaryFire' }); // the fire that never goes out
  m.objects.push({ x: 6, y: 9, type: 'machine', id: 'sanctuaryMachine' }); // self-service healing, same as the hub
  m.objects.push({ x: 18, y: 9, type: 'sanctuaryPlot', id: 'sanctuaryPlot' }); // the only safe base site in the 75+ world
  borderTrees(m);
  m.objects = m.objects.filter(o => !(o.type === 'tree' && ((o.x === 13 && o.y === 0) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'rexBadlands', tx: 13, ty: 16 });
  m.exits.push({ x: 25, y: 9, to: 'saberFields', tx: 1, ty: 9 });
  m.npcs.push({ id: 'exileLeader', name: 'Exile Leader', x: 11, y: 8, dir: 'down', sprite: null, color: '#7a4a9e', dialog: 'exileLeader' });
  m.npcs.push({ id: 'exileTrader', name: 'Exile Trader', x: 15, y: 8, dir: 'down', sprite: null, color: '#c98a2b', dialog: 'exileTrader' });
  m.npcs.push({ id: 'exileGuard', name: 'Exile Guard', x: 13, y: 12, dir: 'up', sprite: null, color: '#4a6b2b', dialog: 'ancientLocal' });
  MAPS.sanctuary = m;

  // ---- THE DEEP RIVER (south, mystery — Spinosaurus hunts here at dusk) ----
  m = newMap('deepRiver', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('sand')), 'The Deep River');
  m.atmosphere = 'spray'; // no area — the mystery is the content, not random encounters
  fillRect(m, 6, 4, 14, 6, 'water'); fillRect(m, 9, 5, 8, 4, 'waterDeep');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 13, y: 9, type: 'mysterySign', mystery: 'M1', id: 'signSpino' });
  m.objects.push({ x: 5, y: 12, type: 'bone', id: 'dr1' }); m.objects.push({ x: 20, y: 12, type: 'bone', id: 'dr2' });
  borderTrees(m, 'palm');
  m.objects = m.objects.filter(o => !(o.type === 'palm' && ((o.x === 13 && o.y === 0) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'saberFields', tx: 13, ty: 16 });
  m.exits.push({ x: 25, y: 9, to: 'megalodonDeep', tx: 1, ty: 9 });
  m.npcs.push({ id: 'riverGuide', name: 'River Guide', x: 10, y: 9, dir: 'down', sprite: null, color: '#2b6b8a', dialog: 'ancientLocal' });
  MAPS.deepRiver = m;

  // ---- THE MEGALODON DEEP (south, Ancient Fish + Electroreception — Megalodon) ----
  m = newMap('megalodonDeep', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('sand')), 'The Megalodon Deep');
  m.area = 'megalodonDeep'; m.atmosphere = 'spray';
  fillRect(m, 6, 4, 14, 6, 'water'); fillRect(m, 9, 5, 8, 4, 'waterDeep');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'bone', id: 'md1' }); m.objects.push({ x: 20, y: 12, type: 'bone', id: 'md2' });
  m.objects.push({ x: 8, y: 13, type: 'fossil', id: 'md3' });
  borderTrees(m, 'bone');
  m.objects = m.objects.filter(o => !(o.type === 'bone' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'deepRiver', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'armoredReef', tx: 1, ty: 9 });
  m.npcs.push({ id: 'deepDiver', name: 'Deep Diver', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b4a8a', dialog: 'ancientLocal' });
  MAPS.megalodonDeep = m;

  // ---- THE ARMORED REEF (south, Ancient Fish + Touch — Dunkleosteus) ----
  m = newMap('armoredReef', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('fossil')), 'The Armored Reef');
  m.area = 'armoredReef'; m.atmosphere = 'bubbles';
  fillRect(m, 8, 4, 10, 4, 'water'); fillRect(m, 10, 5, 6, 2, 'waterDeep');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 6, y: 12, type: 'coral', id: 'ar1' }); m.objects.push({ x: 19, y: 5, type: 'coral', id: 'ar2' });
  m.objects.push({ x: 21, y: 13, type: 'bone', id: 'ar3' }); m.objects.push({ x: 10, y: 13, type: 'fossil', id: 'ar4' });
  borderTrees(m, 'coral');
  m.objects = m.objects.filter(o => !(o.type === 'coral' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'megalodonDeep', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'seaScorpion', tx: 1, ty: 9 });
  m.npcs.push({ id: 'reefKeeper', name: 'Reef Keeper', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b8a8a', dialog: 'ancientLocal' });
  MAPS.armoredReef = m;

  // ---- THE SEA SCORPION SHALLOWS (south, Ancient Crustacean + Touch — Jaekelopterus) ----
  m = newMap('seaScorpion', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('sand')), 'The Sea Scorpion Shallows');
  m.area = 'seaScorpion'; m.atmosphere = 'spray';
  fillRect(m, 5, 5, 4, 3, 'water'); fillRect(m, 18, 12, 4, 3, 'water');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 6, y: 13, type: 'coral', id: 'ssc1' }); m.objects.push({ x: 20, y: 5, type: 'coral', id: 'ssc2' });
  m.objects.push({ x: 4, y: 4, type: 'fossil', id: 'ssc3' }); m.objects.push({ x: 22, y: 14, type: 'fossil', id: 'ssc4' });
  borderTrees(m, 'coral');
  m.objects = m.objects.filter(o => !(o.type === 'coral' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'armoredReef', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'spiralShoals', tx: 1, ty: 9 });
  m.npcs.push({ id: 'scorpionWarden', name: 'Scorpion Warden', x: 13, y: 9, dir: 'down', sprite: null, color: '#8a4a6b', dialog: 'ancientLocal' });
  MAPS.seaScorpion = m;

  // ---- THE SPIRAL SHOALS (south, Ancient Mollusk + Smell — Ammonite) ----
  m = newMap('spiralShoals', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('fossil')), 'The Spiral Shoals');
  m.area = 'spiralShoals'; m.atmosphere = 'bubbles';
  fillRect(m, 5, 5, 4, 3, 'water'); fillRect(m, 18, 12, 4, 3, 'water');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 6, y: 13, type: 'fossil', id: 'sh1' }); m.objects.push({ x: 20, y: 5, type: 'fossil', id: 'sh2' });
  m.objects.push({ x: 4, y: 4, type: 'coral', id: 'sh3' }); m.objects.push({ x: 22, y: 14, type: 'coral', id: 'sh4' });
  borderTrees(m, 'fossil');
  m.objects = m.objects.filter(o => !(o.type === 'fossil' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'seaScorpion', tx: 24, ty: 9 });
  m.npcs.push({ id: 'shoalKeeper', name: 'Shoal Keeper', x: 13, y: 9, dir: 'down', sprite: null, color: '#6b4a8a', dialog: 'ancientLocal' });
  MAPS.spiralShoals = m;

  // ---- THE PTERODACTYL CLIFFS (west, Ancient Bird + Sight — Pterodactyl, Archaeopteryx) ----
  m = newMap('pteroCliffs', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('ancientGrass')), 'The Pterodactyl Cliffs');
  m.area = 'pteroCliffs'; m.atmosphere = 'petals';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'giantTree', id: 'pc1' }); m.objects.push({ x: 20, y: 12, type: 'giantTree', id: 'pc2' });
  m.objects.push({ x: 8, y: 13, type: 'bone', id: 'pc3' }); m.objects.push({ x: 18, y: 4, type: 'fossil', id: 'pc4' });
  borderTrees(m, 'giantTree');
  m.objects = m.objects.filter(o => !(o.type === 'giantTree' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'highPeaks', tx: 13, ty: 16 });
  m.exits.push({ x: 13, y: 17, to: 'giantsCanopy', tx: 13, ty: 1 });
  m.exits.push({ x: 25, y: 9, to: 'rexBadlands', tx: 1, ty: 4 });
  m.npcs.push({ id: 'cliffWatcher', name: 'Cliff Watcher', x: 13, y: 9, dir: 'down', sprite: null, color: '#7a4a9e', dialog: 'ancientLocal' });
  MAPS.pteroCliffs = m;

  // ---- THE HIGH PEAKS (west, mystery — Quetzalcoatlus flies here at dawn) ----
  m = newMap('highPeaks', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('snow')), 'The High Peaks');
  m.atmosphere = 'snow'; // no area — the mystery is the content
  fillRect(m, 6, 6, 4, 3, 'ice'); fillRect(m, 18, 12, 4, 3, 'ice');
  fillRect(m, 12, 8, 2, 10, 'path');
  m.objects.push({ x: 13, y: 9, type: 'mysterySign', mystery: 'M2', id: 'signQuetz' });
  m.objects.push({ x: 5, y: 5, type: 'snowtree', id: 'hpk1' }); m.objects.push({ x: 20, y: 4, type: 'snowtree', id: 'hpk2' });
  m.objects.push({ x: 8, y: 13, type: 'bone', id: 'hpk3' });
  borderTrees(m, 'snowtree');
  m.objects = m.objects.filter(o => !(o.type === 'snowtree' && o.x === 13 && o.y === 17));
  m.exits.push({ x: 13, y: 17, to: 'pteroCliffs', tx: 13, ty: 1 });
  m.npcs.push({ id: 'peakWatcher', name: 'Peak Watcher', x: 10, y: 9, dir: 'down', sprite: null, color: '#5a6b8a', dialog: 'ancientLocal' });
  MAPS.highPeaks = m;

  // ---- THE GIANT'S CANOPY (west, Ancient Insect + Sight — Meganeura) ----
  m = newMap('giantsCanopy', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('canopyFloor')), "The Giant's Canopy");
  m.area = 'giantsCanopy'; m.atmosphere = 'fireflies';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'giantTree', id: 'gc1' }); m.objects.push({ x: 20, y: 12, type: 'giantTree', id: 'gc2' });
  m.objects.push({ x: 8, y: 13, type: 'giantTree', id: 'gc3' }); m.objects.push({ x: 18, y: 4, type: 'giantTree', id: 'gc4' });
  borderTrees(m, 'giantTree');
  m.objects = m.objects.filter(o => !(o.type === 'giantTree' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17) || (o.x === 0 && o.y === 9))));
  m.exits.push({ x: 13, y: 0, to: 'pteroCliffs', tx: 13, ty: 16 });
  m.exits.push({ x: 13, y: 17, to: 'spidersHollow', tx: 13, ty: 1 });
  m.exits.push({ x: 0, y: 9, to: 'deepForest', tx: 24, ty: 9 });
  m.npcs.push({ id: 'canopyKeeper', name: 'Canopy Keeper', x: 13, y: 9, dir: 'down', sprite: null, color: '#2b6b2b', dialog: 'ancientLocal' });
  MAPS.giantsCanopy = m;

  // ---- THE SPIDER'S HOLLOW (west, Ancient Arachnid + Touch — Megarachne) ----
  m = newMap('spidersHollow', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('canopyFloor')), "The Spider's Hollow");
  m.area = 'spidersHollow'; m.atmosphere = 'spores';
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 5, type: 'web', id: 'spw1' }); m.objects.push({ x: 20, y: 12, type: 'web', id: 'spw2' });
  m.objects.push({ x: 8, y: 13, type: 'web', id: 'spw3' }); m.objects.push({ x: 17, y: 4, type: 'giantTree', id: 'spw4' });
  borderTrees(m, 'giantTree');
  m.objects = m.objects.filter(o => !(o.type === 'giantTree' && ((o.x === 13 && o.y === 0) || (o.x === 13 && o.y === 17))));
  m.exits.push({ x: 13, y: 0, to: 'giantsCanopy', tx: 13, ty: 16 });
  m.exits.push({ x: 13, y: 17, to: 'saberFields', tx: 13, ty: 1 });
  m.npcs.push({ id: 'hollowSpider', name: 'Hollow Spider', x: 13, y: 9, dir: 'down', sprite: null, color: '#4a2b6b', dialog: 'ancientLocal' });
  MAPS.spidersHollow = m;

  // ---- THE DEEP FOREST (west, mystery — Megatherium follows the fruit trail) ----
  m = newMap('deepForest', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('canopyFloor')), 'The Deep Forest');
  m.atmosphere = 'fireflies'; // no area — the mystery is the content
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 13, y: 9, type: 'mysterySign', mystery: 'M4', id: 'signMega' });
  m.objects.push({ x: 5, y: 5, type: 'giantTree', id: 'df1' }); m.objects.push({ x: 20, y: 12, type: 'giantTree', id: 'df2' });
  m.objects.push({ x: 8, y: 13, type: 'berry', id: 'dfb1' }); m.objects.push({ x: 18, y: 4, type: 'berry', id: 'dfb2' }); // the fruit trail
  borderTrees(m, 'giantTree');
  m.objects = m.objects.filter(o => !(o.type === 'giantTree' && o.x === 25 && o.y === 9));
  m.exits.push({ x: 25, y: 9, to: 'giantsCanopy', tx: 1, ty: 9 });
  m.npcs.push({ id: 'forestKeeper', name: 'Forest Keeper', x: 10, y: 9, dir: 'down', sprite: null, color: '#2b6b2b', dialog: 'ancientLocal' });
  MAPS.deepForest = m;

  // ---- THE BURNING MARSH (east, mystery — Titanoboa in the hottest water) ----
  m = newMap('burningMarsh', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('ash')), 'The Burning Marsh');
  m.atmosphere = 'embers'; // no area — the mystery is the content
  fillRect(m, 6, 4, 14, 6, 'water'); fillRect(m, 9, 5, 8, 4, 'waterDeep');
  fillRect(m, 4, 12, 5, 3, 'tar'); fillRect(m, 18, 4, 5, 3, 'tar'); // tar pits
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 13, y: 9, type: 'mysterySign', mystery: 'M3', id: 'signTitan' });
  m.objects.push({ x: 5, y: 5, type: 'tarPit', id: 'bm1' }); m.objects.push({ x: 20, y: 12, type: 'tarPit', id: 'bm2' });
  m.objects.push({ x: 8, y: 13, type: 'bone', id: 'bm3' });
  borderTrees(m, 'tarPit');
  m.objects = m.objects.filter(o => !(o.type === 'tarPit' && ((o.x === 0 && o.y === 9) || (o.x === 25 && o.y === 9))));
  m.exits.push({ x: 0, y: 9, to: 'raptorGrass', tx: 24, ty: 9 });
  m.exits.push({ x: 25, y: 9, to: 'devilsPond', tx: 1, ty: 9 });
  m.npcs.push({ id: 'marshGuide', name: 'Marsh Guide', x: 10, y: 9, dir: 'down', sprite: null, color: '#8a4a2b', dialog: 'ancientLocal' });
  MAPS.burningMarsh = m;

  // ---- THE DEVIL'S POND (east, Ancient Amphibian + Sight — Beelzebufo) ----
  m = newMap('devilsPond', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('darkfloor')), "The Devil's Pond");
  m.area = 'devilsPond'; m.atmosphere = 'rain';
  fillRect(m, 6, 4, 14, 6, 'water'); fillRect(m, 9, 5, 8, 4, 'waterDeep');
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 5, y: 12, type: 'bone', id: 'dp1' }); m.objects.push({ x: 20, y: 12, type: 'bone', id: 'dp2' });
  m.objects.push({ x: 8, y: 13, type: 'fossil', id: 'dp3' });
  borderTrees(m, 'bone');
  m.objects = m.objects.filter(o => !(o.type === 'bone' && o.x === 0 && o.y === 9));
  m.exits.push({ x: 0, y: 9, to: 'burningMarsh', tx: 24, ty: 9 });
  m.npcs.push({ id: 'pondWatcher', name: 'Pond Watcher', x: 13, y: 9, dir: 'down', sprite: null, color: '#3a2b4a', dialog: 'ancientLocal' });
  MAPS.devilsPond = m;

  // ---- THE DARK CAVES (under the badlands, mystery — Giant Vampire Bat hunts by sound) ----
  m = newMap('darkCaves', 26, 18, Array.from({ length: 18 }, () => Array(26).fill('darkfloor')), 'The Dark Caves');
  m.atmosphere = 'spores'; // no area — the mystery is the content
  fillRect(m, 6, 5, 5, 4, 'tallgrass'); fillRect(m, 16, 11, 5, 4, 'tallgrass'); // cave moss
  fillRect(m, 0, 9, 26, 1, 'path');
  m.objects.push({ x: 13, y: 9, type: 'mysterySign', mystery: 'M5', id: 'signBat' });
  m.objects.push({ x: 5, y: 5, type: 'crystal', id: 'dc1' }); m.objects.push({ x: 20, y: 12, type: 'crystal', id: 'dc2' });
  m.objects.push({ x: 8, y: 13, type: 'crystal', id: 'dc3' }); m.objects.push({ x: 18, y: 4, type: 'crystal', id: 'dc4' });
  borderTrees(m, 'crystal');
  m.objects = m.objects.filter(o => !(o.type === 'crystal' && o.x === 13 && o.y === 0));
  m.exits.push({ x: 13, y: 0, to: 'rexBadlands', tx: 20, ty: 5 });
  m.npcs.push({ id: 'darkListener', name: 'Dark Listener', x: 10, y: 9, dir: 'down', sprite: null, color: '#2b2b4a', dialog: 'ancientLocal' });
  MAPS.darkCaves = m;

  // ---- CARE HUB UPPER DECK (the online hub — one floor up, same building) ----
  m = newMap('hubUpper', 14, 8, Array.from({ length: 8 }, () => Array(14).fill('tilefloor')), 'Care Hub — Upper Deck');
  for (let x = 0; x < 14; x++) { m.ground[0][x] = 'cliff'; m.ground[7][x] = 'cliff'; }
  for (let y = 0; y < 8; y++) { m.ground[y][0] = 'cliff'; m.ground[y][13] = 'cliff'; }
  m.objects.push({ x: 2, y: 1, type: 'terminal', id: 'term1' });
  m.objects.push({ x: 5, y: 1, type: 'terminal', id: 'term2' });
  m.objects.push({ x: 8, y: 1, type: 'terminal', id: 'term3' });
  m.objects.push({ x: 11, y: 1, type: 'board', id: 'leaderBoard' });
  m.objects.push({ x: 7, y: 6, type: 'stairs', id: 'hubStairsDown' });
  m.npcs.push({ id: 'hubGuide', name: 'Hub Guide', x: 10, y: 3, dir: 'down', sprite: null, color: '#2b6b8a', dialog: 'hubGuide' });
  MAPS.hubUpper = m;

  // ---- PASS 3 TOURNAMENT ARENAS ----
  arenaMap('rustArena', 'Wasteland War Arena', 'rustFields', 18, 16);
  arenaMap('cityArena', 'Rok City Championship Arena', 'rokCity', 25, 8);
  arenaMap('caveArena', 'Ancient Crown Arena', 'echoCaves', 5, 15);
})();

/* ================= OVERWORLD ================= */
const OW = {
  moving: false, targetX: 0, targetY: 0, moveDir: 'down', stepT: 0,
  encounterCooldown: 0, bob: 0,
};
function curMap() { return MAPS[G.player.map]; }
function npcAt(map, x, y) { return map.npcs.find(n => n.x === x && n.y === y); }
function exitAt(map, x, y) { return map.exits.find(e => e.x === x && e.y === y); }

function tryMove(dx, dy) {
  const p = G.player, map = curMap();
  const nx = p.x + dx, ny = p.y + dy;
  const dir = dy < 0 ? 'up' : dy > 0 ? 'down' : dx < 0 ? 'left' : 'right';
  p.dir = dir;
  if (!walkable(map, nx, ny)) return false;
  OW.moving = true; OW.targetX = nx; OW.targetY = ny; OW.moveDir = dir;
  p.x = nx; p.y = ny;
  return true;
}
function updateOverworld(dt) {
  const p = G.player, map = curMap();
  OW.encounterCooldown = Math.max(0, OW.encounterCooldown - dt);
  if (OW.moving) {
    // bicycle: 2x walking speed (TRANSPORT.md); Shift is a sprint on foot only.
    // Garage upgrades: light frame raises top speed; off-road tires keep full speed
    // on sand/snow/ice; the headlight keeps full speed at night.
    let speed = G.flags.ridingBike ? 330 : keyDown('Shift') ? 260 : 165;
    if (G.flags.ridingBike) {
      const up = G.flags.bikeUpgrades || {};
      if (up.frame) speed = 380;
      const t = tileAt(curMap(), G.player.x, G.player.y);
      if ((t === 'sand' || t === 'dune' || t === 'snow' || t === 'ice') && !up.tires) speed = 165;
      const h = Math.floor(G.timeMin / 60) % 24;
      if ((h >= 20 || h < 5) && !up.headlight) speed = Math.min(speed, 165);
    }
    const tx = OW.targetX * TILE, ty = OW.targetY * TILE;
    const dx = tx - p.px, dy = ty - p.py;
    const step = speed * dt;
    if (Math.abs(dx) <= step && Math.abs(dy) <= step) {
      p.px = tx; p.py = ty; OW.moving = false; OW.bob = 0;
      advanceClock(1);
      onStepTile(map);
    } else {
      p.px += Math.sign(dx) * Math.min(step, Math.abs(dx));
      p.py += Math.sign(dy) * Math.min(step, Math.abs(dy));
      OW.bob += dt * 10;
    }
    return;
  }
  let dx = 0, dy = 0;
  // held key OR a quick tap (edge) both start a step; the tap flag is cleared
  // when a step starts so releasing a held key never queues an extra step.
  if (keyDown('ArrowUp', 'w', 'W') || pressed['up']) { dy = -1; pressed['up'] = false; }
  else if (keyDown('ArrowDown', 's', 'S') || pressed['down']) { dy = 1; pressed['down'] = false; }
  else if (keyDown('ArrowLeft', 'a', 'A') || pressed['left']) { dx = -1; pressed['left'] = false; }
  else if (keyDown('ArrowRight', 'd', 'D') || pressed['right']) { dx = 1; pressed['right'] = false; }
  if (dx || dy) { tryMove(dx, dy); return; }
  if (consumePress('confirm')) interact();
  if (consumePress('menu')) UI.openMenu();
}
function onStepTile(map) {
  const p = G.player;
  const ex = exitAt(map, p.x, p.y);
  if (ex) {
    // pass 3 — exits can demand a flag (the Long Dark exit gate needs the Ancient Crown)
    if (ex.requires && !G.flags[ex.requires]) {
      UI.dialog('Kai', 'Sealed. A stone tablet by the gate reads: "Only the Ancient Champion may pass." Win the Ancient Crown in the Echo Caves first.');
      return;
    }
    changeMap(ex.to, ex.tx, ex.ty); return;
  }
  const t = tileAt(map, p.x, p.y);
  if (t === 'pond' || t === 'water') {
    skillGain('Swimming', 1);
    OW.crossedPond = true;
    if (missionStatus('starterPathShark') === 'active') completeObjective('starterPathShark', 'cross');
  } else if (t === 'grass' && OW.crossedPond && map.name === 'meadow' && p.x >= 24 && p.y >= 12 && p.y <= 14) {
    // stepped onto the far bank after crossing the pond
    OW.crossedPond = false;
    if (missionStatus('starterPathShark') === 'active') completeObjective('starterPathShark', 'swim');
  } else if (t !== 'pond' && t !== 'water') {
    OW.crossedPond = false;
  }
  if (t === 'tallgrass' && map.area && OW.encounterCooldown <= 0) {
    if (chance(0.10)) { OW.encounterCooldown = 2; startWildBattle(map.area); }
  }
}
function changeMap(to, tx, ty) {
  // the east wasteland is gated: its maps carry locked:'unlock_east', set when the
  // Dump Site mission starts. A blocked crossing shows a dialog and stays put.
  const dest = MAPS[to];
  if (dest && dest.locked && !G.flags[dest.locked]) {
    UI.dialog('Kai', 'The way east is blocked — rusted barriers and a Cyber Tech checkpoint. The road only opens once the dump site story breaks. (Finish the Rok City story first.)');
    return;
  }
  // pass 3 — the Long Dark zones demand HMs: The Deep needs LIGHT + DIVE,
  // The Gate needs CLIMB + SMASH. A blocked crossing names what is missing.
  if (dest && dest.requires) {
    const missing = dest.requires.filter(r => !G.flags[r]);
    if (missing.length) {
      const names = { unlock_HM_LIGHT: 'HM LIGHT', unlock_HM_DIVE: 'HM DIVE', unlock_HM_CLIMB: 'HM CLIMB', unlock_HM_SMASH: 'HM SMASH' };
      UI.dialog('Kai', `The way is blocked — you need ${missing.map(r => names[r] || r).join(' and ')} to go on. (HM LIGHT comes from the Wasteland War, HM DIVE from the Rok City Championship, HM CLIMB from the Cave Guide, HM SMASH from the Hollow Keeper.)`);
      return;
    }
  }
  G.player.map = to; G.player.x = tx; G.player.y = ty;
  G.player.px = tx * TILE; G.player.py = ty * TILE;
  G.map = MAPS[to];
  if (!G.flags.visited) G.flags.visited = {};
  G.flags.visited[to] = true;
  // Caleb moves out: once Kai reaches Rok City, Caleb is at the university, not back home.
  if (to === 'rokCity' && !G.flags.calebMoved) {
    G.flags.calebMoved = true;
    MAPS.haven.npcs = MAPS.haven.npcs.filter(n => n.id !== 'caleb');
  }
  // the bicycle stays outside — interiors are walked
  if (['hub', 'hubUpper', 'arena', 'forestArena', 'reefArena', 'bazaar', 'emberArena', 'bazaarArena', 'frostArena', 'universityArena', 'rustArena', 'cityArena', 'caveArena'].includes(to)) G.flags.ridingBike = false;
  OW.fadeUntil = performance.now() + 350;
  toast(MAPS[to].label);
  // reach objectives: entering the map completes them (firstTournament 'enter' too)
  const m = activeMission();
  if (m) for (const o of m.objectives) {
    if (o.type === 'reach' && o.map === to) completeObjective(m.id, o.id);
  }
  saveGame(true);
}
function facingTile() {
  const p = G.player;
  const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[p.dir];
  return { x: p.x + d[0], y: p.y + d[1] };
}
function interact() {
  const map = curMap(), f = facingTile();
  const npc = npcAt(map, f.x, f.y);
  if (npc) { NPC_DIALOG[npc.dialog](npc); return; }
  const obj = objAt(map, f.x, f.y);
  if (obj) { interactObject(obj, map); return; }
  // door tiles: hub / arena entrances are exits placed on the door tile in front of the building
  const ex = exitAt(map, f.x, f.y);
  if (ex) { changeMap(ex.to, ex.tx, ex.ty); return; }
  // fishing: facing water with a rod
  const t = tileAt(map, f.x, f.y);
  if ((t === 'water' || t === 'waterDeep' || t === 'pond') && hasItem('fishing-rod')) { tryFish(); return; }
  if (t === 'water' || t === 'waterDeep' || t === 'pond') { UI.dialog('Kai', 'The water looks deep. A fishing rod would help here — and my shark could cross small water like this.'); return; }
}
function interactObject(obj, map) {
  const p = G.player;
  switch (obj.type) {
    case 'tree': {
      if (!G.flags.hasAxe) { UI.dialog('Kai', 'A sturdy tree. I need an axe to chop wood from it.'); return; }
      if (obj.depleted) { UI.dialog('Kai', 'This tree is already picked clean. It will regrow by tomorrow.'); return; }
      obj.depleted = true;
      const bonus = (G.flags.ridingBike && G.flags.bikeUpgrades && G.flags.bikeUpgrades.basket) ? 1 : 0;
      addItem('wood', 1 + bonus); skillGain('Gathering', 1);
      SFX.hit();
      UI.dialog('Kai', `Chopped some wood! (+${1 + bonus} wood, Gathering skill up)`);
      if (missionStatus('firstWood') === 'active') {
        const count = G.bag.wood || 0;
        if (count >= 10) completeObjective('firstWood', 'gather');
        else UI.setMissionHint(`First Wood — wood ${count}/10`);
      }
      break;
    }
    case 'rock': {
      if (obj.depleted) { UI.dialog('Kai', 'This rock is already broken down.'); return; }
      obj.depleted = true;
      addItem('stone', 1); skillGain('Mining', 1);
      UI.dialog('Kai', 'Broke off a chunk of stone! (+1 stone)');
      break;
    }
    case 'berry': {
      if (obj.depleted) { UI.dialog('Kai', 'No more berries on this bush.'); return; }
      obj.depleted = true;
      const bonus = (G.flags.ridingBike && G.flags.bikeUpgrades && G.flags.bikeUpgrades.basket) ? 1 : 0;
      addItem('berries', 2 + bonus); skillGain('Foraging', 1);
      UI.dialog('Kai', `Picked some berries! (+${2 + bonus} berries)`);
      break;
    }
    case 'machine': {
      healParty();
      skillGain('Healing', 1);
      SFX.heal();
      UI.dialog('Care Machine', 'All your creatures are healed to full health. No nurse, no waiting — just walk up and heal.');
      break;
    }
    case 'counter': { UI.openShop(); break; }
    case 'board': {
      // Pass 3 — the leaderboard board on the upper deck opens the Online Hub.
      if (obj.id === 'leaderBoard' && typeof HUB !== 'undefined') { HUB.openHub(); return; }
      UI.openBadge();
      break;
    }
    case 'plot': { UI.openBaseMenu(); break; }
    case 'vines': {
      if (G.flags.unlock_HM_SLICE) {
        // the whole thicket is one barrier — cutting one vine clears the lot
        map.objects = map.objects.filter(o => o.type !== 'vines');
        UI.dialog('Kai', 'SLICE! The vines fall away — the clearing is open!');
      } else {
        UI.dialog('Kai', 'Thick vines block the way. A creature that knows HM SLICE could cut through.');
      }
      break;
    }
    case 'scent': {
      // pass 1 fix: the mission is starterPathWolf and the objective id is 'scent'
      // (v1 called a nonexistent 'starterWolf' mission with 'scent1/2/3', so the wolf
      // path could never complete). The reach objective usually fires on entering
      // the woods; the scent objects are the trail's flavor and a backup.
      if (missionStatus('starterPathWolf') === 'active' && !obj.found) {
        obj.found = true;
        completeObjective('starterPathWolf', 'scent');
        UI.dialog('Kai', 'A fresh scent trail — wolf, and something lost. The trail leads on...');
      } else {
        UI.dialog('Kai', 'A faint scent hangs in the air. Something wild passed through here.');
      }
      break;
    }
    case 'tv': {
      // Care Hub TV — the lawsuit on Rok Tube (Phase 2 mission lawsuitTV)
      if (missionStatus('lawsuitTV') === 'active') {
        completeObjective('lawsuitTV', 'watch');
        UI.dialog('Rok Tube News', '"...and in the latest lawsuit, Cyber Tech INC denies all claims. Residents say the company has been buying up shops across the region. More after the break." So THAT is the name everyone keeps whispering.');
      } else {
        UI.dialog('Rok Tube News', 'A cheerful ad for Rok Phone plays, then a weather report. Nothing about lawsuits today.');
      }
      break;
    }
    case 'lablog': {
      // Ruined Cyber Tech outpost in the Ember Dunes — the lab log naming Chemical X
      if (missionStatus('labLog') === 'active') {
        completeObjective('labLog', 'read');
        UI.dialog('Lab Log', '"Trial 14: Chemical X stabilizes the subjects, but the waste has to go somewhere. Dump site is east of the dunes. Do not let the locals see the barrels." Chemical X. The dump site. It all connects.');
      } else {
        UI.dialog('Lab Log', 'A cracked terminal. Its last entry is a shipment list — barrels, east of the dunes. Nothing more you can read here yet.');
      }
      break;
    }
    case 'sick': {
      // Sick animal on the east edge of the Meadow Route (Phase 2 mission sickAnimals)
      if (missionStatus('sickAnimals') === 'active' && !objectiveDone('sickAnimals', 'find')) {
        completeObjective('sickAnimals', 'find');
        UI.dialog('Kai', 'A little frog, breathing hard, its skin dull and patchy. Something in the water did this. It needs medicine — a bandage, salve, or a first aid kit.');
      } else if (missionStatus('sickAnimals') === 'active') {
        const med = hasItem('bandage') ? 'bandage' : hasItem('herbalSalve') ? 'herbalSalve' : hasItem('firstAidKit') ? 'firstAidKit' : null;
        if (!med) { UI.dialog('Kai', 'The frog needs medicine and I have none on me. A bandage, herbal salve, or first aid kit would do.'); return; }
        removeItem(med, 1);
        skillGain('Healing', 1);
        SFX.heal();
        completeObjective('sickAnimals', 'heal');
        map.objects = map.objects.filter(o => o !== obj);
        UI.dialog('Kai', 'You dress the little frog\'s skin and it hops away, stronger already. Whatever is in the water east of here, it is not natural.');
      } else {
        UI.dialog('Kai', 'A healthy little frog hops past. The meadow feels calmer than it did.');
      }
      break;
    }
    case 'item': {
      if (obj.taken) return;
      obj.taken = true;
      map.objects = map.objects.filter(o => o !== obj);
      addItem(obj.item, 1);
      UI.dialog('Kai', `Found a ${ITEMS[obj.item].name}!`);
      break;
    }
    // ---- pass 2 objects ----
    case 'barrel': {
      UI.dialog('Kai', 'A dented chemical barrel, stenciled CYBER TECH. Something green and wrong glows through a crack. This is where Chemical X came from — and where the waste went.');
      break;
    }
    case 'gate': {
      // Pass 3 — two gates use this type: the Long Dark gate (echoCaves, id longDarkGate)
      // and the exit gate at the end of The Gate zone (caveGate, id exitGate).
      if (obj.id === 'exitGate') {
        if (G.flags.unlock_longDarkExit) {
          UI.dialog('Kai', 'The exit gate stands open — beyond it, the ancient world. The Rex Badlands, the mammoths, the exiles. This is what the whole journey was for.');
        } else {
          UI.dialog('Kai', 'The exit gate is sealed. A stone tablet reads: "Only the Ancient Champion may pass." The Ancient Crown tournament in the Echo Caves decides who opens it.');
        }
        return;
      }
      // The Long Dark gate (pass 2): the level-80 mutant alpha guards it.
      if (missionStatus('theCave') === 'active' && !objectiveDone('theCave', 'mutantAlpha')) {
        UI.dialogSeq([
          { name: 'Kai', text: 'A massive sealed gate — the way into the Long Dark. Something enormous is breathing on the other side.' },
          { name: '???', text: 'A level-80 mutant alpha steps out of the dark. It is the gate\'s guardian, and it will not let you pass.' },
        ], () => startTrainerBattle({
          name: 'Mutant Alpha', team: [{ dex: '006', level: 80, mutant: true }],
          bg: 'battle-cave.png', intro: 'The mutant alpha blocks the gate — the hardest single fight before the 75+ world!',
          battleTag: 'mutantAlpha',
        }));
        return;
      }
      if (missionStatus('theCave') === 'done') {
        // Pass 3 — the gate is open: the Mouth eats teams under level 60.
        if (partyMaxLevel() >= 60) {
          UI.dialog('Kai', 'The gate is open. The Long Dark — three zones, each worse than the last. The Mouth first: level 60-70 mutants, collapsing tunnels. Move fast.', () => changeMap('caveMouth', 13, 16));
        } else {
          UI.dialog('Kai', `The gate is open, but the Mouth eats weak teams — your strongest creature is level ${partyMaxLevel()}. Come back at level 60 or higher.`);
        }
        return;
      }
      UI.dialog('Kai', 'A massive sealed gate, covered in old Cyber Tech warnings. Something enormous guards the other side. The exiles say only a level-70+ team even stands a chance.');
      break;
    }
    // ---- pass 3 objects ----
    case 'stairs': {
      if (map.name === 'hub') { changeMap('hubUpper', 7, 5); return; }
      if (map.name === 'hubUpper') { changeMap('hub', 12, 7); return; }
      break;
    }
    case 'terminal': {
      if (typeof HUB !== 'undefined') HUB.openHub();
      else UI.dialog('Kai', 'An online terminal. (The upper-deck hub is not loaded — this should not happen.)');
      break;
    }
    case 'mysterySign': {
      // The 5 mystery hunts: each sign only answers at the right time, with the
      // right team. A caught mystery never comes back; a fled one returns tomorrow.
      const hunt = MYSTERY_HUNTS[obj.mystery];
      if (!hunt) break;
      if (G.flags['caught_' + obj.mystery]) { UI.dialog('Kai', `The ${hunt.name} is yours now — the signs here are quiet. The hunt is done.`); return; }
      if (G.flags['mystery_' + obj.mystery + '_day'] === G.day) { UI.dialog('Kai', `The ${hunt.name} slipped away today. The signs will be fresh again tomorrow.`); return; }
      const h = hourOfDay();
      if (obj.mystery === 'M1' && !(h >= 17 && h < 20)) { UI.dialog('Kai', 'The river is quiet, but the fish are still here — the Spinosaurus only comes out to hunt at dusk (17:00-20:00). Come back when the river goes quiet.'); return; }
      if (obj.mystery === 'M2' && !(h >= 5 && h < 8)) { UI.dialog('Kai', 'The sky is empty. The Quetzalcoatlus only flies at dawn (05:00-08:00) — watch the sky at first light, and look for its shadow.'); return; }
      if (obj.mystery === 'M3') {
        if (partyMaxLevel() < 85) { UI.dialog('Kai', `The marsh is hot — steam rises off the water. The exiles say you need a level 85+ team to survive the Titanoboa. (Your best is ${partyMaxLevel()}.)`); return; }
        if (!hasSense('Heat')) { UI.dialog('Kai', 'The snake is in the hottest part of the marsh, but I can\'t track it — I need a creature with Heat sense in my party.'); return; }
      }
      if (obj.mystery === 'M4' && !hasItem('berries', 3)) { UI.dialog('Kai', 'The exiles leave fruit out for the Megatherium — follow the fruit trail. I need at least 3 berries to leave out for it.'); return; }
      if (obj.mystery === 'M4') removeItem('berries', 3);
      UI.dialogSeq([
        { name: 'Kai', text: `The signs are fresh — ${obj.mystery === 'M1' ? 'the fish have vanished from the river' : obj.mystery === 'M2' ? 'a shadow crosses the sky at first light' : obj.mystery === 'M3' ? 'the hottest water is boiling' : obj.mystery === 'M4' ? 'the fruit is gone, and the trees are shaking' : 'something is listening in the dark'}. It is near.` },
        { name: 'Kai', text: `There it is — the ${hunt.name}!` },
      ], () => startMysteryBattle(obj.mystery));
      break;
    }
    case 'caveMouth': {
      UI.dialog('Kai', 'A dark cave mouth in the badlands wall — the Dark Caves, under the badlands. Something in there hunts by sound.', () => changeMap('darkCaves', 13, 1));
      break;
    }
    case 'tent': {
      UI.dialog('Kai', 'An exile\'s tent — old stone, salvaged wood, a fence of triceratops horns. The people here fled Cyber Tech and never went back.');
      break;
    }
    case 'campfire': {
      healParty();
      G.day++; G.timeMin = 8 * 60;
      for (const mm of Object.values(MAPS)) for (const o of mm.objects) o.depleted = false;
      SFX.heal();
      UI.dialog('Exile Leader', 'Rest by the fire, Kai. It never goes out — and nothing hunts you here. Your party is healed. A new day dawns over the ancient world.');
      break;
    }
    case 'sanctuaryPlot': { UI.openSanctuaryBase(); break; }
    case 'bone': {
      UI.dialog('Kai', 'Giant bones jut from the ground — a ribcage bigger than a house. The animals here were bigger than anything in the main world. Older, too.');
      break;
    }
    case 'fossil': {
      UI.dialog('Kai', 'A fossil in the rock — a spiral shell, older than the main world. Cyber Tech dug fossils like this up and made Chemical X from them. That\'s where the ancients came from — and where the mutants went wrong.');
      break;
    }
    case 'giantTree': {
      UI.dialog('Kai', 'A tree the size of a house. The dragonflies here are the size of eagles — the exiles say the whole world was bigger, once. Older trees, older animals, older ground.');
      break;
    }
    case 'tarPit': {
      UI.dialog('Kai', 'A bubbling tar pit. Things that fall in here stay in here — and come out as fossils, millions of years later. Watch your step.');
      break;
    }
    case 'dumpster': {
      UI.dialog('Kai', 'A dumpster full of broken Rok Phones and company parts. The Wreckyard is where Cyber Tech throws away what it doesn\'t want anyone to see.');
      break;
    }
    case 'stall': {
      // Rok Plaza stall (city) sells the full Rok stock; bazaar stalls sell indie goods
      UI.openShop(map.name === 'rokCity' ? 'plaza' : 'bazaar');
      break;
    }
    case 'scrap': {
      if (obj.depleted) { UI.dialog('Kai', 'This scrap pile is already picked clean.'); return; }
      obj.depleted = true;
      addItem('scrapMetal', 1); skillGain('Mining', 1);
      UI.dialog('Kai', 'Pulled a useful chunk of scrap metal out of the pile! (+1 scrap metal)');
      break;
    }
    case 'tower': {
      UI.dialog('Kai', 'A Cyber Tech tower — Rok Phone, Rok Tube, Rok Gaming, all of it runs through here. Elsa Rok owns the sky in this city.');
      break;
    }
    case 'crystal': {
      UI.dialog('Kai', 'A glowing crystal hums softly in the dark. The bats in here navigate by sound — you can hear them before you see them.');
      break;
    }
    case 'web': {
      UI.dialog('Kai', 'A web big enough to catch a person. The spiders in the Hollow are not small, and they are not friendly.');
      break;
    }
    default: break;
  }
}
function tryFish() {
  skillGain('Fishing', 1);
  if (chance(0.55)) {
    const dex = pickWeighted([{ dex: '046', weight: 30 }, { dex: '049', weight: 25 }, { dex: '052', weight: 20 }, { dex: '034', weight: 25 }]).dex;
    const lvl = rand(3, 5);
    UI.dialog('Kai', 'Something tugged the line — a wild creature!', () => startWildBattle(null, { dex, level: lvl }));
  } else if (chance(0.5)) {
    addItem('berries', 1);
    UI.dialog('Kai', 'No bite... but I found some berries by the water. (+1 berries)');
  } else {
    UI.dialog('Kai', 'No bite this time. The water stays quiet.');
  }
}

/* ---------------- rendering ---------------- */
function drawTileLayer(c, map, camX, camY, t) {
  const x0 = Math.max(0, Math.floor(camX / TILE)), y0 = Math.max(0, Math.floor(camY / TILE));
  const x1 = Math.min(map.w - 1, Math.ceil((camX + VIEW_W) / TILE)), y1 = Math.min(map.h - 1, Math.ceil((camY + VIEW_H) / TILE));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    let tile = map.ground[y][x];
    if (tile === 'water' || tile === 'pond') {
      // animated water: two frames by time
      const frame = Math.floor(t * 2) % 2;
      c.drawImage(TileArt[tile], x * TILE - camX, y * TILE - camY + (frame ? 1 : 0));
      continue;
    }
    const art = TileArt[tile];
    if (art) c.drawImage(art, x * TILE - camX, y * TILE - camY);
  }
}
function drawObject(c, obj, camX, camY) {
  const x = obj.x * TILE - camX, y = obj.y * TILE - camY;
  switch (obj.type) {
    case 'tree': drawTree(c, x, y - 16, false); break;
    case 'palm': drawPalm(c, x, y - 16); break;
    case 'house': drawHouse(c, x, y, obj.w, obj.h, obj.wall, obj.roof); break;
    case 'hub': drawHouse(c, x, y, obj.w, obj.h, obj.wall, obj.roof);
      c.fillStyle = '#fff'; c.font = 'bold 11px Trebuchet MS'; c.fillText('CARE HUB', x + 14, y + 30); break;
    case 'arena': drawHouse(c, x, y, obj.w, obj.h, obj.wall, obj.roof);
      c.fillStyle = '#fff'; c.font = 'bold 11px Trebuchet MS'; c.fillText('ARENA', x + 26, y + 30); break;
    case 'machine': drawMachine(c, x, y - 16); break;
    case 'counter': drawCounter(c, x, y + 6, (obj.w || 3) * TILE); break;
    case 'board': {
      c.fillStyle = '#8a6a3a'; c.fillRect(x + 4, y + 2, 24, 28);
      c.fillStyle = '#fdfdf4'; c.fillRect(x + 7, y + 5, 18, 22);
      c.fillStyle = '#1b3a9e'; c.fillRect(x + 10, y + 9, 12, 2); c.fillRect(x + 10, y + 14, 12, 2); c.fillRect(x + 10, y + 19, 8, 2);
      break;
    }
    case 'vines': c.drawImage(TileArt.vines, x, y); break;
    case 'rock': c.drawImage(TileArt.rock, x, y); break;
    case 'snowtree': drawSnowTree(c, x, y - 16); break;
    case 'cactus': drawCactus(c, x, y - 16); break;
    case 'coral': drawCoral(c, x, y - 8); break;
    case 'snowrock': drawStone(c, x, y, '#8d8d9a', '#b9b9c8'); break;
    case 'sandstone': drawStone(c, x, y, '#c9a06a', '#e0bd85'); break;
    case 'tv': {
      c.fillStyle = '#1b2a52'; c.fillRect(x + 2, y + 2, 28, 20);
      c.fillStyle = '#7cc4ff'; c.fillRect(x + 4, y + 4, 24, 16);
      c.fillStyle = '#ff5f7e'; c.fillRect(x + 6, y + 7, 10, 3);
      c.fillStyle = '#fff'; c.fillRect(x + 6, y + 12, 16, 2); c.fillRect(x + 6, y + 15, 12, 2);
      break;
    }
    case 'lablog': {
      c.fillStyle = '#3a3a4a'; c.fillRect(x + 4, y + 8, 24, 24);
      c.fillStyle = '#37c978'; c.fillRect(x + 7, y + 11, 18, 12);
      c.fillStyle = '#0a2a1a'; c.fillRect(x + 9, y + 13, 14, 2); c.fillRect(x + 9, y + 17, 10, 2);
      c.fillStyle = '#ffd94d'; c.font = 'bold 9px Trebuchet MS'; c.fillText('LOG', x + 9, y + 6);
      break;
    }
    case 'sick': {
      c.fillStyle = '#9aa58a'; c.beginPath(); c.ellipse(x + 16, y + 22, 12, 8, 0, 0, 7); c.fill();
      c.fillStyle = '#7a8570'; c.beginPath(); c.arc(x + 24, y + 14, 6, 0, 7); c.fill();
      c.fillStyle = '#37c978'; c.font = 'bold 10px Trebuchet MS'; c.fillText('!', x + 14, y + 8);
      break;
    }
    case 'berry': c.drawImage(TileArt.berrybush, x, y); break;
    // pass 2 — Rok City + east objects
    case 'tower': drawTower(c, x, y, obj.w || 3, obj.h || 3, obj.wall); break;
    case 'barrel': drawBarrel(c, x, y); break;
    case 'gate': drawGate(c, x, y); break;
    case 'stall': drawStall(c, x, y); break;
    case 'web': drawWeb(c, x, y); break;
    case 'crystal': drawCrystal(c, x, y); break;
    case 'scrap': drawScrap(c, x, y); break;
    case 'streetlight': drawStreetlight(c, x, y); break;
    case 'dumpster': {
      px(c, x + 2, y + 10, 28, 20, '#3a4a3a'); px(c, x + 2, y + 10, 28, 4, '#4a5a4a');
      px(c, x + 6, y + 16, 6, 6, '#37c978'); px(c, x + 18, y + 18, 5, 5, '#ffd94d');
      break;
    }
    // pass 3 — ancient-world objects
    case 'bone': drawBone(c, x, y - 4); break;
    case 'fossil': drawFossil(c, x, y); break;
    case 'giantTree': drawGiantTree(c, x, y - 32); break;
    case 'tarPit': drawTarPit(c, x, y); break;
    case 'tent': drawTent(c, x, y - 8); break;
    case 'campfire': drawCampfire(c, x, y - 4); break;
    case 'stairs': drawStairs(c, x, y); break;
    case 'terminal': drawTerminal(c, x, y); break;
    case 'mysterySign': drawMysterySign(c, x, y); break;
    case 'caveMouth': drawCaveMouth(c, x, y); break;
    case 'scent': {
      c.fillStyle = 'rgba(255,217,77,0.85)';
      c.beginPath(); c.arc(x + 16, y + 16, 6 + Math.sin(performance.now() / 300) * 2, 0, 7); c.fill();
      c.fillStyle = '#8a6d00'; c.font = 'bold 10px Trebuchet MS'; c.fillText('~ scent ~', x - 2, y - 4);
      break;
    }
    case 'item': {
      c.fillStyle = '#ffd94d'; c.fillRect(x + 10, y + 10, 12, 12);
      c.fillStyle = '#8a6d00'; c.fillRect(x + 13, y + 7, 6, 4);
      break;
    }
    case 'plot': {
      c.strokeStyle = '#ffd94d'; c.lineWidth = 2; c.setLineDash([4, 3]);
      c.strokeRect(x + 2, y + 2, 28, 28); c.setLineDash([]);
      c.fillStyle = '#ffe9a8'; c.font = 'bold 10px Trebuchet MS'; c.fillText('BASE', x + 2, y - 2);
      if (G.flags.baseLevel) { drawHouse(c, x - 16, y - 32, 2, 2, '#d8c090', '#c94f4f'); }
      break;
    }
    default: break;
  }
}
function drawNPCFigure(c, x, y, color, dir) {
  // small procedural person, 20x28
  c.fillStyle = '#1b2a52'; c.fillRect(x - 1, y - 1, 22, 30);
  c.fillStyle = '#f2c9a0'; c.fillRect(x + 5, y + 1, 10, 9); // head
  c.fillStyle = '#2b2b2b'; c.fillRect(x + 5, y, 10, 4); // hair
  c.fillStyle = color; c.fillRect(x + 2, y + 11, 16, 11); // shirt
  c.fillStyle = '#2b3a5e'; c.fillRect(x + 4, y + 22, 5, 6); c.fillRect(x + 11, y + 22, 5, 6); // legs
}
function kaiFrame() {
  const dir = G.player.dir;
  const src = `assets/chars/kai-${dir}.png`;
  if (!imgReady(src)) return null;
  const img = imgEl(src);
  const fw = Math.floor(img.naturalWidth / 3);
  const frame = OW.moving ? (Math.floor(OW.bob) % 3) : 1;
  return { img, sx: frame * fw, sy: 0, sw: fw, sh: img.naturalHeight };
}
function dayNightTint() {
  const h = Math.floor(G.timeMin / 60) % 24;
  if (h >= 20 || h < 5) return 'rgba(8,10,40,0.28)';
  if (h >= 17 && h < 20) return 'rgba(255,140,60,0.10)';
  if (h >= 5 && h < 7) return 'rgba(255,180,120,0.08)';
  return null;
}
function drawAtmosphere(c, map, t) {
  // screen-space weather/ambience particles, one kind per map (map.atmosphere)
  const kind = map.atmosphere; if (!kind) return;
  const n = kind === 'rain' ? 60 : 36;
  const W = VIEW_W + 40, H = VIEW_H + 40;
  for (let i = 0; i < n; i++) {
    const r1 = hash2(i, 101), r2 = hash2(i, 202), r3 = hash2(i, 303);
    if (kind === 'snow') {
      const x = ((r1 * W + t * 14 * (0.5 + r3)) % W) - 20;
      const y = ((r2 * H + t * 30 * (0.5 + r3)) % H) - 20;
      c.fillStyle = 'rgba(255,255,255,0.9)'; c.fillRect(x, y, 3, 3);
    } else if (kind === 'sand') {
      const x = ((r1 * W + t * 46 * (0.5 + r3)) % W) - 20;
      const y = ((r2 * H + Math.sin(t + i) * 6) % H + H) % H - 20;
      c.fillStyle = 'rgba(240,205,133,0.7)'; c.fillRect(x, y, 5, 2);
    } else if (kind === 'petals') {
      const x = ((r1 * W + t * 10 * (0.5 + r3)) % W) - 20;
      const y = ((r2 * H + t * 16 * (0.5 + r3)) % H) - 20;
      c.fillStyle = i % 2 ? 'rgba(255,143,163,0.8)' : 'rgba(255,255,255,0.8)'; c.fillRect(x, y, 3, 3);
    } else if (kind === 'bubbles') {
      const x = ((r1 * W + Math.sin(t * 0.7 + i) * 8) % W + W) % W - 20;
      const y = H - 20 - ((r2 * H + t * 22 * (0.5 + r3)) % H);
      c.fillStyle = 'rgba(190,230,255,0.75)'; c.beginPath(); c.arc(x, y, 2 + r3 * 2, 0, 7); c.fill();
    } else if (kind === 'rain') {
      const x = ((r1 * W + t * 30) % W) - 20;
      const y = ((r2 * H + t * 260 * (0.5 + r3)) % H) - 20;
      c.fillStyle = 'rgba(150,190,255,0.55)'; c.fillRect(x, y, 1, 10);
    } else if (kind === 'spray') {
      const x = ((r1 * W + Math.sin(t + i * 2) * 10) % W + W) % W - 20;
      const y = ((r2 * H + t * 12 * (0.5 + r3)) % H) - 20;
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x, y, 2, 2);
    } else if (kind === 'neon') {
      const x = ((r1 * W + t * 8 * (0.5 + r3)) % W) - 20;
      const y = H - 20 - ((r2 * H + t * 10 * (0.5 + r3)) % H);
      c.fillStyle = ['rgba(255,95,126,0.8)', 'rgba(124,196,255,0.8)', 'rgba(255,217,77,0.8)'][i % 3];
      c.fillRect(x, y, 3, 3);
    } else if (kind === 'ash') {
      const x = ((r1 * W + t * 12 * (0.5 + r3)) % W) - 20;
      const y = ((r2 * H + t * 18 * (0.5 + r3)) % H) - 20;
      c.fillStyle = 'rgba(180,180,180,0.65)'; c.fillRect(x, y, 3, 2);
    } else if (kind === 'spores') {
      const x = (((r1 * W + Math.sin(t * 0.6 + i) * 10) % W) + W) % W - 20;
      const y = H - 20 - ((r2 * H + t * 14 * (0.5 + r3)) % H);
      c.fillStyle = i % 2 ? 'rgba(124,255,178,0.8)' : 'rgba(190,230,255,0.7)';
      c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill();
    } else if (kind === 'embers') {
      // the Burning Marsh: orange embers rising off hot water
      const x = (((r1 * W + Math.sin(t * 0.8 + i) * 8) % W) + W) % W - 20;
      const y = H - 20 - ((r2 * H + t * 26 * (0.5 + r3)) % H);
      c.fillStyle = i % 2 ? 'rgba(255,154,61,0.85)' : 'rgba(255,217,77,0.8)';
      c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill();
    } else if (kind === 'fireflies') {
      // the giant canopy: green fireflies drifting between the trees
      const x = (((r1 * W + Math.sin(t * 0.5 + i) * 14) % W) + W) % W - 20;
      const y = ((r2 * H + Math.sin(t * 0.9 + i * 2) * 8) % H + H) % H - 20;
      c.fillStyle = `rgba(140,255,120,${0.4 + 0.5 * Math.abs(Math.sin(t + i))})`;
      c.beginPath(); c.arc(x, y, 2, 0, 7); c.fill();
    }
  }
}
function renderOverworld(t) {
  const map = curMap();
  const p = G.player;
  // clear the frame first (small maps don't cover the viewport; old battle art must not linger)
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const mapW = map.w * TILE, mapH = map.h * TILE;
  const camX = mapW <= VIEW_W ? (mapW - VIEW_W) / 2 : Math.max(0, Math.min(mapW - VIEW_W, p.px + TILE / 2 - VIEW_W / 2));
  const camY = mapH <= VIEW_H ? (mapH - VIEW_H) / 2 : Math.max(0, Math.min(mapH - VIEW_H, p.py + TILE / 2 - VIEW_H / 2));
  drawTileLayer(ctx, map, camX, camY, t);
  // y-sorted draw list: objects + npcs + player
  const draws = [];
  for (const o of map.objects) draws.push({ y: (o.y + (o.h || 1)) * TILE, fn: () => drawObject(ctx, o, camX, camY) });
  for (const n of map.npcs) draws.push({
    y: (n.y + 1) * TILE,
    fn: () => {
      const x = n.x * TILE - camX, y = n.y * TILE - camY;
      if (n.sprite && imgReady(`assets/chars/${n.sprite}.png`)) {
        const img = imgEl(`assets/chars/${n.sprite}.png`);
        ctx.drawImage(img, x - 8, y - 16, 48, 48);
      } else drawNPCFigure(ctx, x + 6, y + 4, n.color || '#888', n.dir);
    },
  });
  draws.push({
    y: (p.y + 1) * TILE,
    fn: () => {
      const kf = kaiFrame();
      const x = p.px - camX, y = p.py - camY;
      if (G.flags.ridingBike) {
        // simple bicycle under Kai: two wheels + frame
        const bx = x + 2, by = y + 22;
        ctx.fillStyle = '#2b2b2b';
        ctx.beginPath(); ctx.arc(bx + 4, by + 6, 5, 0, 7); ctx.arc(bx + 26, by + 6, 5, 0, 7); ctx.fill();
        ctx.fillStyle = '#c94f4f'; ctx.fillRect(bx + 4, by - 2, 22, 3); ctx.fillRect(bx + 12, by - 8, 3, 8);
        ctx.fillStyle = '#2b2b2b'; ctx.fillRect(bx + 22, by - 10, 6, 3);
      }
      if (kf) ctx.drawImage(kf.img, kf.sx, kf.sy, kf.sw, kf.sh, x - 8, y - 16, 48, 48);
      else { ctx.fillStyle = '#c94f4f'; ctx.fillRect(x + 6, y + 4, 20, 28); }
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + 16, y + 30, 12, 4, 0, 0, 7); ctx.fill();
    },
  });
  draws.sort((a, b) => a.y - b.y);
  for (const d of draws) d.fn();
  // day/night tint, then weather/ambience particles, then the map-change fade
  const tint = dayNightTint();
  if (tint) { ctx.fillStyle = tint; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  drawAtmosphere(ctx, map, t);
  const now = performance.now();
  if (OW.fadeUntil && now < OW.fadeUntil) {
    ctx.fillStyle = `rgba(0,0,0,${((OW.fadeUntil - now) / 350) * 0.7})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  // location banner on map enter
  updateHud();
}
function updateHud() {
  const map = curMap();
  $('hud-location').textContent = map.label;
  const m = activeMission();
  $('hud-mission').textContent = m ? `★ ${m.name}`
    : G.flags.ancientCrownChampion ? '🏆 Ancient Champion'
    : G.flags.rokCityChampionshipChampion ? '🏆 Rok City Champion'
    : G.flags.wastelandWarChampion ? '🏆 Wasteland War Champion'
    : G.flags.universityGamesChampion ? '🏆 University Games Champion'
    : G.flags.frostCrownChampion ? '🏆 Frost Crown Champion'
    : G.flags.bazaarBrawlChampion ? '🏆 Bazaar Brawl Champion'
    : G.flags.desertHeatChampion ? '🏆 Desert Heat Champion'
    : G.flags.reefRumbleChampion ? '🏆 Reef Rumble Champion'
    : G.flags.forestClashChampion ? '🏆 Forest Clash Champion'
    : 'Free play — Rookie Cup Champion';
  $('hud-cash').textContent = `${G.cash} cash`;
  $('hud-time').textContent = fmtTime();
}
