/* Metamonsters v1 — bootstrap: title screen, intro, main loop. */
'use strict';

/* ---------------- title ---------------- */
function initTitle() {
  G.state = 'title';
  hide($('hud')); hide($('dialog')); hide($('menu')); hide($('battle-ui'));
  show($('title-screen'));
  const cont = $('btn-continue');
  cont.disabled = !hasSave();
  cont.textContent = hasSave() ? 'CONTINUE' : 'CONTINUE (no save)';
  $('btn-new').onclick = () => { SFX.ensure(); SFX.select(); startNewGame(); };
  cont.onclick = () => {
    if (!hasSave()) return;
    SFX.ensure(); SFX.select();
    const d = loadSave();
    if (!d) { toast('Save data is unreadable.'); return; }
    applySave(d);
    enterGame();
  };
  $('btn-mute').onclick = () => { SFX.muted = !SFX.muted; $('btn-mute').textContent = SFX.muted ? '✕' : '♪'; };
  // preload key art in the background
  ['assets/bg/title-city.png', 'assets/bg/title.png', 'assets/bg/battle-meadow.png', 'assets/bg/battle-woods.png', 'assets/bg/battle-oasis.png', 'assets/bg/battle-arena.png',
   'assets/bg/battle-snow.png', 'assets/bg/battle-desert.png', 'assets/bg/battle-reef.png',
   'assets/bg/battle-city.png', 'assets/bg/battle-wasteland.png', 'assets/bg/battle-wreckyard.png', 'assets/bg/battle-hollow.png', 'assets/bg/battle-cave.png',
   'assets/bg/battle-badlands.png', 'assets/bg/battle-ancient-sea.png', 'assets/bg/battle-canopy.png', 'assets/bg/battle-pond.png',
   'assets/chars/kai-down.png', 'assets/chars/kai-up.png', 'assets/chars/kai-left.png', 'assets/chars/kai-right.png',
   'assets/chars/kai-battle-back.png', 'assets/chars/marcus.png', 'assets/chars/sofia.png', 'assets/chars/caleb.png', 'assets/chars/mara.png']
    .forEach(s => loadImg(s).catch(() => {}));
}
function enterGame() {
  hide($('title-screen'));
  show($('hud'));
  G.map = MAPS[G.player.map];
  G.state = 'overworld';
  updateHud();
  saveGame(true);
}
function startNewGame() {
  newGameState();
  hide($('title-screen'));
  show($('hud'));
  G.map = MAPS.haven;
  G.player.x = 12; G.player.y = 10; G.player.px = 12 * TILE; G.player.py = 10 * TILE; G.player.dir = 'up';
  G.state = 'overworld';
  updateHud();
  UI.dialogSeq([
    { name: '', text: 'The world changed the day the animals changed. Nobody saw it coming — not the scientists, not the trainers, not even Rok.' },
    { name: '', text: 'You are Kai, a Meta Trainer from Haven Village. Today your two best friends pick their starters... and you get what is left.' },
    { name: '', text: 'West is civilization — Rok City, the bazaar, Rok University. East is the wasteland, where it all goes bad first.' },
    { name: '', text: 'Your journey starts in the village square. Marcus and Sofia are waiting.' },
  ], () => { toast('Talk to Marcus in the square!'); saveGame(true); });
}

/* ---------------- main loop ---------------- */
let lastT = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;
  if (G.state === 'overworld') {
    G.playtime += dt;
    updateOverworld(dt);
    renderOverworld(now / 1000);
  } else if (G.state === 'dialog') {
    UI.updateDialog();
    if (G.prevState === 'battle') renderBattle(now / 1000);
    else renderOverworld(now / 1000);
  } else if (G.state === 'battle') {
    renderBattle(now / 1000);
  } else if (G.state === 'menu') {
    renderOverworld(now / 1000);
    if (consumePress('menu')) UI.closePanel();
  }
  requestAnimationFrame(loop);
}

/* ---------------- boot ---------------- */
window.addEventListener('load', () => {
  // verify data files loaded
  const missing = [];
  if (typeof DEX === 'undefined') missing.push('dex.js');
  if (typeof MOVES === 'undefined') missing.push('moves.js');
  if (typeof ITEMS === 'undefined') missing.push('items.js');
  if (typeof MISSIONS === 'undefined') missing.push('missions.js');
  if (typeof TOURNAMENTS === 'undefined') missing.push('tournaments.js');
  if (typeof ENCOUNTERS === 'undefined') missing.push('encounters.js');
  if (typeof MUTANT_NAMES === 'undefined' || typeof MEGA_FORMS === 'undefined') missing.push('mutants.js');
  if (typeof ANCIENT_DEX === 'undefined' || typeof MYSTERY_DEX === 'undefined') missing.push('ancients.js');
  if (typeof BACKEND === 'undefined') missing.push('backend.js');
  if (typeof HUB === 'undefined') missing.push('hub.js');
  if (missing.length) {
    document.getElementById('title-tag').textContent = 'ERROR: data files missing: ' + missing.join(', ') + ' — the game cannot start.';
    return;
  }
  initTitle();
  requestAnimationFrame(loop);
});
// dialog click advances too
$('dialog').addEventListener('click', () => { pressed['confirm'] = true; });
