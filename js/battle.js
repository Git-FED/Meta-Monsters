/* Metamonsters v1 — turn-based battle engine.
   Real type charts (CAT_CHART, SENSE_CHART from js/data/moves.js),
   STAB 1.5x, statuses, catching with nets/traps, XP + evolution hooks. */
'use strict';

/* ---------------- sprite art (keyed to transparent at build time) ---------------- */
/* All creature/item/tool/character PNGs ship with transparent backgrounds
   (white keyed out by tools/key_sprites.py), so they draw straight onto any
   background. keyed() ensures the image is loading and returns it once ready. */
function keyed(src) {
  const el = imgEl(src); // creates + caches the Image on first call
  return (el.complete && el.naturalWidth > 0) ? el : null;
}

/* ---------------- battle state ---------------- */
const BT = {
  active: false, type: 'wild', bg: 'battle-meadow.png',
  foeName: '', foeTeam: [], foeActive: 0,
  playerIdx: 0, phase: 'intro', onEnd: null, roundInfo: null,
  logQueue: [], anim: null, dmgPopup: null, shake: 0,
  playerAction: null, enemyAction: null, turn: 0, caught: null,
  weather: null, megaUsed: false, battleTag: null,
};
function playerMon() { return G.party[BT.playerIdx]; }
function foeMon() { return BT.foeTeam[BT.foeActive]; }

function startWildBattle(area, override) {
  let dex, level, pick = null;
  if (override) { dex = override.dex; level = override.level; }
  else {
    const enc = ENCOUNTERS[area] || ENCOUNTERS.meadow;
    pick = pickWeighted(enc.table);
    dex = pick.dex; level = rand(enc.levels[0], enc.levels[1]);
  }
  const encRate = (ENCOUNTERS[area] && ENCOUNTERS[area].instinctRate) || 0.0025;
  // Mutant encounters (pass 2): an entry flagged mutant spawns the mutant form only
  // once mutants are unlocked (The Dump Site mission); before that the same animal
  // appears in its normal form — the east looks wrong only after the scandal breaks.
  const mutant = !!pick && !!pick.mutant && !!G.flags.unlock_mutants;
  // Pass 3 — Instinct versions exist only in the main world (93 creatures). Ancients
  // and mystery creatures have no instinct art, so they never roll instinct.
  const isMainWorld = /^\d{3}$/.test(dex);
  const instinct = isMainWorld && !mutant && chance(encRate);
  const foe = makeCreature(dex, level, { instinct, mutant });
  // pass 1: every area gets its own battle background + weather (new snow/desert/reef art)
  const ab = AREA_BATTLE[area] || AREA_BATTLE.meadow;
  startBattle({
    type: 'wild', bg: ab.bg, weather: ab.weather,
    foeName: 'Wild ' + foe.name + (mutant ? ' (Mutant)' : instinct ? ' (Instinct)' : ''),
    foeTeam: [foe],
    intro: `A wild ${foe.name}${mutant ? ' — a MUTANT, twisted by Chemical X!' : instinct ? ' — an INSTINCT version!' : ''} appeared!`,
  });
}
// battle background + weather per encounter area (maps to the new art in assets/bg/)
const AREA_BATTLE = {
  meadow: { bg: 'battle-meadow.png', weather: 'petals' },
  woods: { bg: 'battle-woods.png', weather: 'petals' },
  oasis: { bg: 'battle-oasis.png', weather: 'sand' },
  howling: { bg: 'battle-snow.png', weather: 'snow' },
  grizzly: { bg: 'battle-snow.png', weather: 'snow' },
  frozen: { bg: 'battle-snow.png', weather: 'snow' },
  coldSpring: { bg: 'battle-snow.png', weather: 'snow' },
  iceLake: { bg: 'battle-snow.png', weather: 'snow' },
  ember: { bg: 'battle-desert.png', weather: 'sand' },
  antColony: { bg: 'battle-desert.png', weather: 'sand' },
  reef: { bg: 'battle-reef.png', weather: 'spray' },
  tidepools: { bg: 'battle-reef.png', weather: 'spray' },
  butterfly: { bg: 'battle-reef.png', weather: 'petals' },
  deepTrench: { bg: 'battle-reef.png', weather: 'bubbles' },
  mangrove: { bg: 'battle-woods.png', weather: 'rain' },
  // pass 2: Rok City + the east wasteland (new art in assets/bg/)
  rokCity: { bg: 'battle-city.png', weather: 'neon' },
  bazaar: { bg: 'battle-city.png', weather: 'petals' },
  university: { bg: 'battle-city.png', weather: 'petals' },
  rustFields: { bg: 'battle-wasteland.png', weather: 'ash' },
  ashenFlats: { bg: 'battle-wasteland.png', weather: 'ash' },
  wreckyard: { bg: 'battle-wreckyard.png', weather: 'rain' },
  hollow: { bg: 'battle-hollow.png', weather: 'spores' },
  echoCaves: { bg: 'battle-cave.png', weather: 'spores' },
  // pass 3: The Long Dark (3 zones) + the 75+ ancient world (new art in assets/bg/)
  caveMouth: { bg: 'battle-cave.png', weather: 'spores' },
  caveDeep: { bg: 'battle-cave.png', weather: 'spores' },
  caveGate: { bg: 'battle-cave.png', weather: 'spores' },
  mammothSteppe: { bg: 'battle-snow.png', weather: 'snow' },
  direDen: { bg: 'battle-snow.png', weather: 'snow' },
  rexBadlands: { bg: 'battle-badlands.png', weather: 'sand' },
  hornedPlains: { bg: 'battle-badlands.png', weather: 'sand' },
  raptorGrass: { bg: 'battle-badlands.png', weather: 'sand' },
  saberFields: { bg: 'battle-badlands.png', weather: 'sand' },
  megalodonDeep: { bg: 'battle-ancient-sea.png', weather: 'spray' },
  armoredReef: { bg: 'battle-ancient-sea.png', weather: 'bubbles' },
  seaScorpion: { bg: 'battle-ancient-sea.png', weather: 'spray' },
  spiralShoals: { bg: 'battle-ancient-sea.png', weather: 'bubbles' },
  pteroCliffs: { bg: 'battle-canopy.png', weather: 'petals' },
  giantsCanopy: { bg: 'battle-canopy.png', weather: 'petals' },
  spidersHollow: { bg: 'battle-canopy.png', weather: 'spores' },
  devilsPond: { bg: 'battle-pond.png', weather: 'rain' },
};
/* ---------------- mystery hunts (pass 3) ---------------- */
// The 5 mystery creatures are NOT random encounters — each hides in its own place
// and is found by reading the signs there at the right time. A mystery creature is
// a once-in-a-game catch: it fights the trap, it runs, and it hits back.
const MYSTERY_HUNTS = {
  M1: { name: 'Spinosaurus', level: 80, bg: 'battle-ancient-sea.png', weather: 'spray', hint: 'dusk (17:00-20:00)' },
  M2: { name: 'Quetzalcoatlus', level: 82, bg: 'battle-canopy.png', weather: 'petals', hint: 'dawn (05:00-08:00)' },
  M3: { name: 'Titanoboa', level: 88, bg: 'battle-pond.png', weather: 'rain', hint: 'level 85+ team and a Heat-sense creature' },
  M4: { name: 'Megatherium', level: 84, bg: 'battle-canopy.png', weather: 'petals', hint: 'follow the fruit trail' },
  M5: { name: 'Giant Vampire Bat', level: 86, bg: 'battle-cave.png', weather: 'spores', hint: 'listen in the dark — HM LIGHT does not help' },
};
function startMysteryBattle(mysteryId) {
  const hunt = MYSTERY_HUNTS[mysteryId];
  if (!hunt) return;
  const foe = makeCreature(mysteryId, hunt.level);
  startBattle({
    type: 'wild', bg: hunt.bg, weather: hunt.weather,
    foeName: '??? ' + foe.name,
    foeTeam: [foe],
    intro: `Something enormous stirs... a ${foe.name} — one of the five mystery creatures nobody has ever seen! It fights the trap, it runs, and it hits back!`,
  });
  BT.mystery = mysteryId;
}
function startTrainerBattle(def, onEnd) {
  const team = def.team.map(t => makeCreature(t.dex, t.level, { instinct: !!t.instinct, mutant: !!t.mutant }));
  startBattle({
    type: def.tournament ? 'tournament' : 'trainer',
    bg: def.bg || 'battle-arena.png', foeName: def.name, foeTeam: team,
    intro: `${def.name} wants to battle!`, onEnd, roundInfo: def.roundInfo || null,
    introLine: def.intro || null, battleTag: def.battleTag || null,
  });
}
function startBattle(opts) {
  clearPresses(); // stale keys from the previous screen must not leak into the battle
  if (G.party.length === 0 || !G.party.some(c => c.hp > 0)) { UI.dialog('Kai', 'No healthy creatures in the party! Heal up first.'); return; }
  BT.active = true; BT.type = opts.type; BT.bg = opts.bg;
  BT.foeName = opts.foeName; BT.foeTeam = opts.foeTeam; BT.foeActive = 0;
  BT.playerIdx = G.party.findIndex(c => c.hp > 0);
  BT.phase = 'intro'; BT.onEnd = opts.onEnd || null; BT.roundInfo = opts.roundInfo || null;
  BT.anim = null; BT.dmgPopup = null; BT.shake = 0; BT.turn = 0; BT.caught = null;
  BT.weather = opts.weather || null; BT.megaUsed = false; BT.battleTag = opts.battleTag || null;
  BT.mystery = null; // pass 3 — set by startMysteryBattle only
  G.state = 'battle';
  hide($('hud')); show($('battle-ui'));
  $('battle-actions').innerHTML = '';
  setBattleLog(opts.intro || '');
  if (opts.introLine) setTimeout(() => pushBattleLog(opts.introLine), 600);
  SFX.tone(392, 0.15); setTimeout(() => SFX.tone(523, 0.15), 150);
  setTimeout(() => { if (BT.active) showBattleMenu(); }, 1100);
}
function setBattleLog(t) { $('battle-log').textContent = t; }
function pushBattleLog(t) { $('battle-log').textContent = t; }
function battleButtons(html) { $('battle-actions').innerHTML = html; }
function battleBtn(label, fn, cls, disabled) {
  const b = document.createElement('button');
  b.textContent = label; b.onclick = () => { SFX.select(); fn(); };
  if (cls) b.className = cls;
  if (disabled) b.disabled = true;
  $('battle-actions').appendChild(b);
}

/* ---------------- menus ---------------- */
function showBattleMenu() {
  if (!BT.active) return;
  BT.phase = 'menu';
  const m = playerMon();
  setBattleLog(`What will ${m.name} do?`);
  battleButtons('');
  battleBtn('FIGHT', () => showMoveMenu(), '');
  battleBtn('CATCH', () => showCatchMenu(), '', BT.type !== 'wild');
  battleBtn('BAG', () => showBagMenu(), '');
  // MEGA EVOLVE (pass 2): one per battle, costs one Chemical X, only for the 12
  // mega-eligible creatures. The button only appears when it can actually be used.
  if (!BT.megaUsed && MEGA_FORMS[m.dex] && hasItem('chemicalX')) {
    battleBtn(`💥 MEGA — ${MEGA_FORMS[m.dex]} (Chemical X ×1)`, () => doMegaEvolve(), 'mega-btn');
  }
  battleBtn('RUN', () => tryFlee(), '', BT.type !== 'wild');
}
/* ---------------- mega evolution ---------------- */
// Chemical X triggers Mega Evolution for one battle only: big stat boost, typing
// stays the same, the dose is spent, and there is a small berserk risk — the
// creature attacks at random and cannot be controlled (METAMONSTERS-MEGA-CHEMICAL-X.md).
function doMegaEvolve() {
  const m = playerMon();
  if (BT.megaUsed || !MEGA_FORMS[m.dex] || !hasItem('chemicalX')) return;
  removeItem('chemicalX', 1);
  BT.megaUsed = true;
  G.flags.usedMega = true; // pass 3 — the backend's First Mega achievement reads this
  m.megaPrev = { name: m.name, stats: { ...m.stats }, maxHp: m.maxHp };
  m.mega = true;
  m.name = MEGA_FORMS[m.dex];
  const oldHp = m.maxHp;
  m.stats = {
    hp: Math.round(m.stats.hp * 1.2),
    atk: Math.round(m.stats.atk * 1.3),
    def: Math.round(m.stats.def * 1.3),
    spd: Math.round(m.stats.spd * 1.3),
  };
  m.maxHp = m.stats.hp;
  m.hp = Math.min(m.maxHp, m.hp + (m.maxHp - oldHp));
  BT.shake = 1;
  SFX.evo();
  const berserk = chance(0.1);
  if (berserk) {
    m.berserk = true;
    setBattleLog(`${m.name} MEGA EVOLVED — but the Chemical X is unstable! It went BERSERK and attacks at random!`);
  } else {
    setBattleLog(`${m.name} MEGA EVOLVED! Chemical X courses through it — its power surges for this battle!`);
  }
  setTimeout(() => { if (BT.active) showBattleMenu(); }, 1600);
}
function unmegaParty() {
  // Mega lasts one battle only — restore every party creature to its normal form.
  for (const c of G.party) {
    if (!c.mega || !c.megaPrev) continue;
    c.name = c.megaPrev.name;
    c.stats = c.megaPrev.stats;
    c.maxHp = c.megaPrev.maxHp;
    c.hp = Math.min(c.maxHp, c.hp);
    c.mega = false; c.berserk = false; delete c.megaPrev;
  }
}
function showMoveMenu() {
  BT.phase = 'moveSelect';
  const m = playerMon();
  setBattleLog('Choose a move.');
  battleButtons('');
  for (const mid of m.moves) {
    const def = moveDef(mid, m.dex);
    battleBtn(`${def.name}  ·  ${def.type}  ·  ${def.power || '—'}`, () => doPlayerMove(mid), 'move-btn');
  }
  battleBtn('← BACK', () => showBattleMenu(), 'back-btn');
}
function showCatchMenu() {
  BT.phase = 'catchSelect';
  const traps = TRAPS.filter(t => hasItem(t.id));
  setBattleLog('Choose a catching tool. (No Poke Balls here — nets and traps only.)');
  battleButtons('');
  if (!traps.length) { battleBtn('No traps in bag!', () => showBattleMenu(), 'back-btn'); return; }
  for (const t of traps) battleBtn(`${t.name} ×${G.bag[t.id]}`, () => doCatch(t), 'move-btn');
  battleBtn('← BACK', () => showBattleMenu(), 'back-btn');
}
function showBagMenu() {
  BT.phase = 'bagSelect';
  const usable = Object.keys(G.bag).filter(id => ITEMS[id] && (ITEMS[id].use === 'heal' || ITEMS[id].use === 'cure') && G.bag[id] > 0);
  setBattleLog('Use an item.');
  battleButtons('');
  if (!usable.length) { battleBtn('Nothing usable in battle', () => showBattleMenu(), 'back-btn'); return; }
  for (const id of usable.slice(0, 7)) {
    battleBtn(`${ITEMS[id].name} ×${G.bag[id]}`, () => doUseBattleItem(id), 'move-btn');
  }
  battleBtn('← BACK', () => showBattleMenu(), 'back-btn');
}

/* ---------------- damage & charts ---------------- */
function baseType(t) { return String(t || '').replace(/^Ancient /, ''); } // pass 3 — ancients fight on their base category's chart
function effMult(move, atkC, defC) {
  const def = DEX[defC.dex];
  if (move.kind === 'category') return (CAT_CHART[baseType(move.type)] && CAT_CHART[baseType(move.type)][baseType(def.category)]) || 1;
  return (SENSE_CHART[move.type] && SENSE_CHART[move.type][def.sense]) || 1;
}
function effText(m) { return m === 0 ? 'It has no effect...' : m >= 2 ? "It's super effective!" : m <= 0.5 ? "It's not very effective..." : ''; }
function calcDamage(atkC, defC, move) {
  const atkStat = atkC.stats.atk * Math.pow(1.5, atkC.stages.atk) * (atkC.status === 'burn' ? 0.5 : 1);
  const defStat = defC.stats.def * Math.pow(1.5, defC.stages.def);
  const base = Math.floor((((2 * atkC.level / 5 + 2) * move.power * atkStat / Math.max(1, defStat)) / 50) + 2);
  let mult = 1;
  const ad = DEX[atkC.dex];
  // STAB: an ancient's base-category moves count (Mammal moves on an Ancient Mammal)
  if (baseType(move.type) === baseType(ad.category) || move.type === ad.sense) mult *= 1.5; // STAB
  const eff = effMult(move, atkC, defC);
  mult *= eff;
  const crit = chance(move.highCrit ? 0.25 : 0.0625);
  if (crit) mult *= 1.5;
  mult *= 0.85 + Math.random() * 0.15;
  return { dmg: Math.max(1, Math.floor(base * mult)), eff, crit };
}
function applyMoveEffect(user, target, move, eff) {
  const fx = move.effect;
  if (!fx) return null;
  const msgs = {
    poison: () => { if (!target.status) { target.status = 'poison'; return `${target.name} was poisoned!`; } return null; },
    burn: () => { if (!target.status) { target.status = 'burn'; return `${target.name} was burned!`; } return null; },
    sleep: () => { if (!target.status) { target.status = 'sleep'; target.statusTurns = rand(1, 3); return `${target.name} fell asleep!`; } return null; },
    paralysis: () => { if (!target.status) { target.status = 'paralysis'; return `${target.name} is paralyzed!`; } return null; },
    fear: () => { if (target.instinct) return `${target.name} is immune to fear — Instinct never flinches!`; if (!target.status) { target.status = 'fear'; target.stages.atk = Math.max(-3, target.stages.atk - 1); return `${target.name} is afraid! Its Attack fell!`; } return null; },
    bleed: () => { if (!target.status) { target.status = 'bleed'; return `${target.name} is bleeding!`; } return null; },
    cripple: () => { if (!target.status) { target.status = 'cripple'; target.stages.spd = Math.max(-3, target.stages.spd - 1); return `${target.name} is crippled! Its Speed fell!`; } return null; },
    bruise: () => { target.stages.def = Math.max(-3, target.stages.def - 1); return `${target.name} is bruised! Its Defense fell!`; },
    infect: () => { if (!target.status) { target.status = 'infect'; target.statusTurns = 0; return `${target.name} is infected!`; } return null; },
    atkUp: () => { user.stages.atk = Math.min(3, user.stages.atk + 1); return `${user.name}'s Attack rose!`; },
    atkDown: () => { target.stages.atk = Math.max(-3, target.stages.atk - 1); return `${target.name}'s Attack fell!`; },
    defUp: () => { user.stages.def = Math.min(3, user.stages.def + 1); return `${user.name}'s Defense rose!`; },
    defDown: () => { target.stages.def = Math.max(-3, target.stages.def - 1); return `${target.name}'s Defense fell!`; },
    spdUp: () => { user.stages.spd = Math.min(3, user.stages.spd + 1); return `${user.name}'s Speed rose!`; },
    spdDown: () => { target.stages.spd = Math.max(-3, target.stages.spd - 1); return `${target.name}'s Speed fell!`; },
    heal25: () => { const h = Math.floor(user.maxHp * 0.25); user.hp = Math.min(user.maxHp, user.hp + h); return `${user.name} recovered ${h} HP!`; },
  };
  return (msgs[fx] || (() => null))();
}
function canAct(c) {
  if (c.status === 'sleep') {
    if (c.statusTurns > 0) { c.statusTurns--; return { ok: false, msg: `${c.name} is fast asleep!` }; }
    c.status = null; return { ok: true, msg: `${c.name} woke up!` };
  }
  if (c.status === 'paralysis' && chance(0.25)) return { ok: false, msg: `${c.name} is paralyzed! It can't move!` };
  if (c.status === 'fear' && chance(0.2)) return { ok: false, msg: `${c.name} is too afraid to move!` };
  return { ok: true };
}
function statusTick(c) {
  if (!c.status) return null;
  const dmg = (frac) => Math.max(1, Math.floor(c.maxHp * frac));
  switch (c.status) {
    case 'poison': c.hp = Math.max(0, c.hp - dmg(1 / 8)); return `${c.name} is hurt by poison!`;
    case 'burn': c.hp = Math.max(0, c.hp - dmg(1 / 16)); return `${c.name} is hurt by its burn!`;
    case 'bleed': c.hp = Math.max(0, c.hp - dmg(1 / 16)); return `${c.name} is bleeding!`;
    case 'infect': c.statusTurns++; c.hp = Math.max(0, c.hp - dmg((1 / 16) * Math.min(4, c.statusTurns))); return `${c.name} is hurt by the infection!`;
    default: return null;
  }
}

/* ---------------- turn execution ---------------- */
function doPlayerMove(moveId) {
  const m = playerMon();
  // Berserk Mega: the player does not choose — the creature attacks at random,
  // and one time in four it lashes out at itself instead.
  let selfHit = false;
  if (m.berserk) {
    moveId = m.moves[rand(0, m.moves.length - 1)];
    selfHit = chance(0.25);
    setBattleLog(`${m.name} is berserk — it attacks at random!`);
  }
  const def = moveDef(moveId, m.dex);
  BT.phase = 'anim';
  battleButtons('');
  const foe = foeMon();
  const enemyMove = pickEnemyMove(foe, m);
  const pSpd = m.stats.spd * Math.pow(1.5, m.stages.spd) * (m.status === 'paralysis' ? 0.5 : 1);
  const fSpd = foe.stats.spd * Math.pow(1.5, foe.stages.spd) * (foe.status === 'paralysis' ? 0.5 : 1);
  const order = pSpd >= fSpd
    ? [{ who: 'player', move: def, selfHit }, { who: 'foe', move: enemyMove }]
    : [{ who: 'foe', move: enemyMove }, { who: 'player', move: def, selfHit }];
  runTurnSteps(order, 0);
}
function pickEnemyMove(foe, target) {
  const options = foe.moves.map(mid => moveDef(mid, foe.dex)).filter(d => d.power);
  if (!options.length) return moveDef(foe.moves[0], foe.dex);
  if (chance(0.5)) {
    // pick the most effective available move half the time
    let best = options[0], bestEff = 0;
    for (const o of options) { const e = effMult(o, foe, target); if (e > bestEff) { bestEff = e; best = o; } }
    return best;
  }
  return options[rand(0, options.length - 1)];
}
function runTurnSteps(order, i) {
  if (!BT.active) return;
  if (i >= order.length) { endTurnTicks(); return; }
  const step = order[i];
  const attacker = step.who === 'player' ? playerMon() : foeMon();
  const defender = step.selfHit ? attacker : (step.who === 'player' ? foeMon() : playerMon());
  if (!attacker || attacker.hp <= 0) { runTurnSteps(order, i + 1); return; }
  const act = canAct(attacker);
  if (!act.ok) {
    setBattleLog(act.msg);
    setTimeout(() => runTurnSteps(order, i + 1), 900);
    return;
  }
  if (act.msg) setBattleLog(act.msg);
  executeAttack(attacker, defender, step.move, step.who === 'player', () => {
    // the fainted side is decided by WHO fainted, not by who attacked — a berserk
    // creature can knock itself out, and that is the player's creature fainting.
    if (defender.hp <= 0) { handleFaint(defender, defender === playerMon() ? 'player' : 'foe'); return; }
    setTimeout(() => runTurnSteps(order, i + 1), 700);
  });
}
function executeAttack(attacker, defender, move, isPlayer, done) {
  if (!move.power) {
    setBattleLog(`${attacker.name} used ${move.name}!`);
    const fx = applyMoveEffect(attacker, defender, move, 1);
    setTimeout(() => { if (fx) setBattleLog(fx); setTimeout(done, 700); }, 700);
    return;
  }
  BT.anim = { kind: 'lunge', who: isPlayer ? 'player' : 'foe', t0: performance.now() };
  SFX.hit();
  const { dmg, eff, crit } = calcDamage(attacker, defender, move);
  // pass 3 — big hits shake the screen: crits and super-effective hits land hard
  if (crit || eff >= 2) BT.hitShake = { who: isPlayer ? 'foe' : 'player', t0: performance.now(), big: crit };
  setTimeout(() => {
    defender.hp = Math.max(0, defender.hp - dmg);
    BT.anim = { kind: 'hit', who: isPlayer ? 'foe' : 'player', t0: performance.now() };
    BT.dmgPopup = { text: '-' + dmg, who: isPlayer ? 'foe' : 'player', t0: performance.now(), crit, eff };
    let msg = `${attacker.name} used ${move.name}! ${crit ? 'A critical hit! ' : ''}${effText(eff)}`;
    setBattleLog(msg);
    const fx = applyMoveEffect(attacker, defender, move, eff);
    setTimeout(() => { if (fx) setBattleLog(fx); setTimeout(done, 500); }, 800);
  }, 350);
}
function endTurnTicks() {
  if (!BT.active) return;
  const p = playerMon(), f = foeMon();
  const msgs = [];
  const m1 = statusTick(p); if (m1) msgs.push(m1);
  const m2 = f ? statusTick(f) : null; if (m2) msgs.push(m2);
  if (msgs.length) setBattleLog(msgs.join(' '));
  setTimeout(() => {
    if (p.hp <= 0) { handleFaint(p, 'player'); return; }
    if (f && f.hp <= 0) { handleFaint(f, 'foe'); return; }
    // pass 3 — mystery creatures run: 8% per turn they slip away into the dark.
    // A fled mystery can be hunted again — but only from the next day. A
    // SLEEPING mystery can't slip away (the tranquilizer darts hold it).
    if (BT.mystery && BT.active && f && f.status !== 'sleep' && chance(0.08)) {
      const hunt = MYSTERY_HUNTS[BT.mystery];
      setBattleLog(`The ${hunt.name} slipped away into the dark... It will be back tomorrow.`);
      setTimeout(() => endBattle('fled'), 1100);
      return;
    }
    BT.turn++;
    if (BT.active) showBattleMenu();
  }, msgs.length ? 900 : 200);
}
function handleFaint(fainted, side) {
  if (!BT.active) return;
  if (side === 'foe') {
    const foe = foeMon();
    setBattleLog(`${foe.name} fainted!`);
    SFX.tone(220, 0.3, 'sawtooth', 0.08);
    setTimeout(() => {
      // trainer: send next
      if (BT.foeActive + 1 < BT.foeTeam.length) {
        BT.foeActive++;
        setBattleLog(`${BT.foeName} sent out ${foeMon().name}!`);
        setTimeout(() => { if (BT.active) showBattleMenu(); }, 1000);
        return;
      }
      endBattle('win');
    }, 1000);
  } else {
    const m = playerMon();
    setBattleLog(`${m.name} fainted!`);
    setTimeout(() => {
      const next = G.party.findIndex(c => c.hp > 0);
      if (next === -1) { endBattle('lose'); return; }
      showSwitchMenu(true);
    }, 1000);
  }
}
function showSwitchMenu(forced) {
  BT.phase = 'switch';
  setBattleLog(forced ? 'Choose your next creature!' : 'Switch creature?');
  battleButtons('');
  G.party.forEach((c, i) => {
    if (c.hp <= 0 || i === BT.playerIdx) return;
    battleBtn(`${c.name} Lv${c.level}  HP ${c.hp}/${c.maxHp}`, () => {
      BT.playerIdx = i;
      setBattleLog(`Go, ${c.name}!`);
      SFX.heal();
      setTimeout(() => { if (BT.active) showBattleMenu(); }, 800);
    });
  });
  if (!forced) battleBtn('← BACK', () => showBattleMenu(), 'back-btn');
}

/* ---------------- catching ---------------- */
function doCatch(trap) {
  const foe = foeMon();
  const stage = DEX[foe.dex].stage;
  if (trap.maxStage && stage > trap.maxStage) {
    setBattleLog(`${trap.name} can't hold a stage ${stage} creature!`);
    setTimeout(showBattleMenu, 1200);
    return;
  }
  removeItem(trap.id, 1);
  skillGain('Catching', 1);
  BT.phase = 'anim';
  battleButtons('');
  setBattleLog(`Kai threw a ${trap.name}!`);
  BT.anim = { kind: 'throw', who: 'player', t0: performance.now() };
  // Pass 3 balance fix — 5-star base was 0.1, which cubed over 3 shakes is a
  // 0.1% catch rate at HP 1 with the best trap: the 5-star ancients and the 5
  // mysteries (the whole endgame) were effectively uncatchable, so the game
  // could not be completed. 0.22 keeps 5-star the hardest wild catch (below
  // the 3-star cage rate) while making it catchable with the right tool.
  // (4-star is gift-only per the rarity doc, so it is never wild-caught.)
  const starBase = { 1: 0.9, 2: 0.65, 3: 0.4, 4: 0.22, 5: 0.22 }[DEX[foe.dex].stars] || 0.65;
  // Tranquilizer darts put the creature to sleep first — their desc promises it
  // ("puts a creature to sleep so it is easier to catch"). A sleeping creature
  // catches at 1.5x (below), can't fight back, and can't slip away (endTurnTicks).
  if (trap.id === 'tranquilizerDarts') { foe.status = 'sleep'; foe.statusTurns = 3; }
  const hpFrac = foe.hp / foe.maxHp;
  // Weakened creatures catch far more easily; sleep/paralysis help too.
  // Mutants are harder to catch (0.6x) — but on the Fight path they bond easier (1.3x).
  let rate = (1 - hpFrac * 0.8) * starBase * trap.mod * (foe.instinct ? 0.6 : 1) * (foe.mutant ? 0.6 : 1) * (foe.mutant && G.flags.path === 'fight' ? 1.3 : 1) * (1 + 0.02 * (G.skills.Catching?.level || 1));
  if (foe.status === 'sleep' || foe.status === 'paralysis') rate *= 1.5;
  rate = Math.min(0.95, rate);
  let shakes = 0;
  const shakeStep = () => {
    if (!BT.active) return;
    if (chance(rate)) {
      shakes++;
      BT.shake = shakes;
      SFX.catch1();
      setBattleLog(`Shake... ${shakes}/3`);
      if (shakes >= 3) {
        SFX.catchWin();
        BT.caught = foe;
        setBattleLog(`Gotcha! ${foe.name} was caught!`);
        setTimeout(() => finishCatch(foe), 1200);
        return;
      }
      setTimeout(shakeStep, 700);
    } else {
      BT.shake = 0;
      setBattleLog(`${foe.name} broke free!`);
      setTimeout(() => {
        if (!BT.active) return;
        // foe gets a free move
        const foeMove = pickEnemyMove(foe, playerMon());
        executeAttack(foe, playerMon(), foeMove, false, () => {
          if (playerMon().hp <= 0) handleFaint(playerMon(), 'player');
          else setTimeout(() => { if (BT.active) showBattleMenu(); }, 600);
        });
      }, 900);
    }
  };
  setTimeout(shakeStep, 800);
}
function finishCatch(foe) {
  G.flags.caughtCount = (G.flags.caughtCount || 0) + 1;
  // Pass 3 — catching a mystery creature marks its hunt done forever, and
  // catching an ancient or a mystery (or any Fish) counts toward the live events.
  if (BT.mystery) G.flags['caught_' + BT.mystery] = true;
  const dexEntry = DEX[foe.dex];
  if (dexEntry && (foe.dex.startsWith('A') || foe.dex.startsWith('M'))) {
    G.flags.event_ancient = true;
    G.flags.caughtAncient = true; // backend: First Ancient achievement
    if (BT.mystery) G.flags.mysteriesFound = ['M1', 'M2', 'M3', 'M4', 'M5'].filter(id => G.flags['caught_' + id]).length; // backend: Mystery Hunter achievement
  }
  if (dexEntry && dexEntry.category === 'Fish') G.flags.event_megalodon = true;
  completeCatchObjectives(foe); // any active mission's catch objectives (firstCatch, bear hunt, the Mutants)
  if (G.party.length < 6) { G.party.push(foe); toast(`${foe.name} joined the party!`); }
  else { G.storage.push(foe); toast(`${foe.name} was sent to storage at home.`); }
  const xp = xpTableFor(bandOf(foe.level)).catch;
  awardXp(xp, true, () => endBattle('caught'));
}
function tryFlee() {
  const p = playerMon(), f = foeMon();
  const odds = Math.max(0.1, Math.min(0.9, 0.5 + (p.stats.spd - f.stats.spd) / 50));
  if (chance(odds)) { setBattleLog('Got away safely!'); setTimeout(() => endBattle('flee'), 700); }
  else {
    setBattleLog("Couldn't escape!");
    const foeMove = pickEnemyMove(f, p);
    setTimeout(() => executeAttack(f, p, foeMove, false, () => {
      if (p.hp <= 0) handleFaint(p, 'player');
      else setTimeout(() => { if (BT.active) showBattleMenu(); }, 600);
    }), 700);
  }
}
function doUseBattleItem(id) {
  const item = ITEMS[id];
  const m = playerMon();
  if (item.use === 'cure' && m.status) {
    removeItem(id, 1);
    m.status = null;
    setBattleLog(`Used ${item.name}. ${m.name} is cured!`);
    setTimeout(() => { if (BT.active) showBattleMenu(); }, 800);
    return;
  }
  if (item.heal) {
    removeItem(id, 1);
    const healed = Math.min(item.heal, m.maxHp - m.hp);
    m.hp += healed;
    SFX.heal();
    setBattleLog(`Used ${item.name}. ${m.name} recovered ${healed} HP!`);
    skillGain('Healing', 1);
    setTimeout(() => {
      const foe = foeMon();
      if (foe.hp <= 0) return;
      const foeMove = pickEnemyMove(foe, m);
      executeAttack(foe, m, foeMove, false, () => {
        if (m.hp <= 0) handleFaint(m, 'player');
        else setTimeout(() => { if (BT.active) showBattleMenu(); }, 600);
      });
    }, 900);
  } else {
    setBattleLog(`${item.name} can't be used in battle.`);
    setTimeout(showBattleMenu, 900);
  }
}

/* ---------------- XP / end of battle ---------------- */
function awardXp(baseAmount, isCatch, done) {
  const fighter = playerMon();
  const results = [];
  for (const c of G.party) {
    if (c.hp <= 0 && c !== fighter) continue;
    const mult = Math.max(0.5, Math.min(2, (foeMon().level / c.level)));
    const amt = Math.round(baseAmount * mult * (c === fighter ? 1 : 0.5));
    const r = gainXp(c, amt);
    if (r.leveled > 0) results.push({ c, leveled: r.leveled, learned: r.learned, evolved: r.evolved });
  }
  if (!results.length) { done(); return; }
  let i = 0;
  const step = () => {
    if (i >= results.length) { done(); return; }
    const r = results[i++];
    let msg = `${r.c.name} grew to level ${r.c.level}!`;
    if (r.evolved) {
      const oldName = evolveCreature(r.c, r.evolved);
      SFX.evo();
      msg = `${oldName} evolved into ${r.c.name}!`;
    }
    setBattleLog(msg);
    SFX.fanfare();
    setTimeout(step, 1400);
  };
  step();
}
function endBattle(result) {
  if (!BT.active) return;
  BT.active = false;
  const wasTrainer = BT.type !== 'wild';
  const onEnd = BT.onEnd;
  const battleTag = BT.battleTag;
  unmegaParty(); // Mega lasts one battle only
  hide($('battle-ui')); show($('hud'));
  G.state = 'overworld';
  OW.encounterCooldown = 2;
  if (result === 'win') {
    // a won trainer battle completes matching mission battle objectives (pass 2)
    completeBattleObjectives(battleTag);
    const foeLv = BT.foeTeam.reduce((s, c) => s + c.level, 0) / BT.foeTeam.length;
    const table = xpTableFor(bandOf(Math.round(foeLv)));
    const xp = wasTrainer ? table.trainer : table.wild;
    const cashWon = wasTrainer ? 100 + Math.round(foeLv) * 10 : 0;
    if (cashWon) { G.cash += cashWon; toast(`Won ${cashWon} cash!`); }
    awardXp(xp, false, () => {
      saveGame(true);
      if (onEnd) onEnd('win');
      if (BT.roundInfo) TournamentFlow.afterWin(BT.roundInfo);
    });
  } else if (result === 'caught') {
    saveGame(true);
    if (onEnd) onEnd('caught');
  } else if (result === 'fled') {
    // pass 3 — a mystery creature fled: it can be hunted again, but not today.
    if (BT.mystery) G.flags['mystery_' + BT.mystery + '_day'] = G.day;
    BT.mystery = null;
    saveGame(true);
    UI.dialog('Kai', 'Gone. The signs will be fresh again tomorrow — come back at the right hour and try again.');
    if (onEnd) onEnd('fled');
  } else if (result === 'lose') {
    const lost = Math.min(G.cash, 50);
    G.cash -= lost;
    healParty();
    G.player.map = 'haven'; G.player.x = 11; G.player.y = 7;
    G.player.px = 11 * TILE; G.player.py = 7 * TILE;
    G.map = MAPS.haven;
    setBattleLog('');
    UI.dialog('Care Machine', `You blacked out... The Care Hub machine healed your team. You lost ${lost} cash.`, () => { saveGame(true); if (onEnd) onEnd('lose'); });
  } else { // flee
    if (onEnd) onEnd('flee');
  }
}

/* ---------------- battle rendering ---------------- */
function renderBattle(t) {
  ctx.fillStyle = '#0a0e1a';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const bg = imgEl(`assets/bg/${BT.bg}`);
  if (imgReady(`assets/bg/${BT.bg}`)) ctx.drawImage(bg, 0, 0, VIEW_W, VIEW_H);
  else { ctx.fillStyle = '#3a7d2c'; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  const foe = foeMon(), p = playerMon();
  const now = performance.now();
  // foe sprite (right)
  if (foe) {
    const src = creatureSprite(foe, true);
    let ox = 0, oy = 0;
    if (BT.anim && BT.anim.kind === 'hit' && BT.anim.who === 'foe') {
      const el = (now - BT.anim.t0) / 200;
      if (el < 1) ox = Math.sin(el * 30) * 6 * (1 - el);
    }
    if (BT.shake > 0) ox = Math.sin(now / 60) * 3;
    // pass 3 — big hits shake the screen (crit / super-effective), then settle
    if (BT.hitShake && BT.hitShake.who === 'foe') {
      const el = (now - BT.hitShake.t0) / 250;
      if (el < 1) ox += Math.sin(el * 24) * (BT.hitShake.big ? 7 : 4) * (1 - el);
      else BT.hitShake = null;
    }
    const kc = keyed(src);
    const kx = 600 + ox, ky = 70 + oy;
    if (kc) ctx.drawImage(kc, kx, ky, 300, 300);
    else { ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(kx, ky, 300, 300); }
    drawHpBar(foe, 40, 40, 320, true);
  }
  // player back sprite (left)
  if (p) {
    const src = creatureSprite(p, false);
    let ox = 0;
    if (BT.anim && BT.anim.kind === 'lunge' && BT.anim.who === 'player') {
      const el = (now - BT.anim.t0) / 300;
      if (el < 1) ox = Math.sin(el * Math.PI) * 60;
    }
    if (BT.anim && BT.anim.kind === 'hit' && BT.anim.who === 'player') {
      const el = (now - BT.anim.t0) / 200;
      if (el < 1) ox = Math.sin(el * 30) * 6 * (1 - el);
    }
    // pass 3 — big hits shake the player's side too
    if (BT.hitShake && BT.hitShake.who === 'player') {
      const el = (now - BT.hitShake.t0) / 250;
      if (el < 1) ox += Math.sin(el * 24) * (BT.hitShake.big ? 7 : 4) * (1 - el);
      else BT.hitShake = null;
    }
    const kc = keyed(src);
    const kx = 110 + ox, ky = 280;
    if (kc) ctx.drawImage(kc, kx, ky, 260, 260);
    // Kai trainer back sprite
    const kai = keyed('assets/chars/kai-battle-back.png');
    if (kai) ctx.drawImage(kai, 30, 380, 130, 130);
    drawHpBar(p, 600, 460, 320, false);
  }
  // damage popup — crits are gold and bigger, super-effective green, resisted pink
  if (BT.dmgPopup) {
    const el = (now - BT.dmgPopup.t0) / 900;
    if (el >= 1) BT.dmgPopup = null;
    else {
      const pop = BT.dmgPopup;
      ctx.font = `bold ${pop.crit ? 40 : 34}px Trebuchet MS`;
      ctx.fillStyle = pop.crit ? '#ffd94d' : pop.eff >= 2 ? '#37c978' : pop.eff <= 0.5 ? '#ff8fa3' : '#fff';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
      const px2 = pop.who === 'foe' ? 700 : 250;
      const py2 = (pop.who === 'foe' ? 120 : 330) - el * 44;
      const label = (pop.crit ? 'CRIT ' : '') + pop.text;
      ctx.strokeText(label, px2, py2);
      ctx.fillText(label, px2, py2);
    }
  }
  // battle weather, matching the area (snow / sand / spray / bubbles / rain / petals)
  if (BT.weather) {
    const t = now / 1000;
    const n = BT.weather === 'rain' ? 50 : 28;
    const W = VIEW_W + 40, H = VIEW_H + 40;
    for (let i = 0; i < n; i++) {
      const r1 = hash2(i, 501), r2 = hash2(i, 502), r3 = hash2(i, 503);
      if (BT.weather === 'snow') {
        const x = ((r1 * W + t * 14 * (0.5 + r3)) % W) - 20;
        const y = ((r2 * H + t * 30 * (0.5 + r3)) % H) - 20;
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(x, y, 3, 3);
      } else if (BT.weather === 'sand') {
        const x = ((r1 * W + t * 46 * (0.5 + r3)) % W) - 20;
        const y = (((r2 * H + Math.sin(t + i) * 6) % H) + H) % H - 20;
        ctx.fillStyle = 'rgba(240,205,133,0.7)'; ctx.fillRect(x, y, 5, 2);
      } else if (BT.weather === 'petals') {
        const x = ((r1 * W + t * 10 * (0.5 + r3)) % W) - 20;
        const y = ((r2 * H + t * 16 * (0.5 + r3)) % H) - 20;
        ctx.fillStyle = i % 2 ? 'rgba(255,143,163,0.8)' : 'rgba(255,255,255,0.8)'; ctx.fillRect(x, y, 3, 3);
      } else if (BT.weather === 'bubbles') {
        const x = (((r1 * W + Math.sin(t * 0.7 + i) * 8) % W) + W) % W - 20;
        const y = H - 20 - ((r2 * H + t * 22 * (0.5 + r3)) % H);
        ctx.fillStyle = 'rgba(190,230,255,0.75)'; ctx.beginPath(); ctx.arc(x, y, 2 + r3 * 2, 0, 7); ctx.fill();
      } else if (BT.weather === 'rain') {
        const x = ((r1 * W + t * 30) % W) - 20;
        const y = ((r2 * H + t * 260 * (0.5 + r3)) % H) - 20;
        ctx.fillStyle = 'rgba(150,190,255,0.55)'; ctx.fillRect(x, y, 1, 10);
      } else if (BT.weather === 'spray') {
        const x = (((r1 * W + Math.sin(t + i * 2) * 10) % W) + W) % W - 20;
        const y = ((r2 * H + t * 12 * (0.5 + r3)) % H) - 20;
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x, y, 2, 2);
      } else if (BT.weather === 'neon') {
        // Rok City: drifting neon sparks in pink, cyan and gold
        const x = ((r1 * W + t * 8 * (0.5 + r3)) % W) - 20;
        const y = H - 20 - ((r2 * H + t * 10 * (0.5 + r3)) % H);
        ctx.fillStyle = ['rgba(255,95,126,0.8)', 'rgba(124,196,255,0.8)', 'rgba(255,217,77,0.8)'][i % 3];
        ctx.fillRect(x, y, 3, 3);
      } else if (BT.weather === 'ash') {
        // the east wasteland: grey ash falling slowly, drifting sideways
        const x = ((r1 * W + t * 12 * (0.5 + r3)) % W) - 20;
        const y = ((r2 * H + t * 18 * (0.5 + r3)) % H) - 20;
        ctx.fillStyle = 'rgba(180,180,180,0.65)'; ctx.fillRect(x, y, 3, 2);
      } else if (BT.weather === 'spores') {
        // the Hollow and the Echo Caves: glowing spores floating up
        const x = (((r1 * W + Math.sin(t * 0.6 + i) * 10) % W) + W) % W - 20;
        const y = H - 20 - ((r2 * H + t * 14 * (0.5 + r3)) % H);
        ctx.fillStyle = i % 2 ? 'rgba(124,255,178,0.8)' : 'rgba(190,230,255,0.7)';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill();
      }
    }
  }
  // throw animation: a net arc
  if (BT.anim && BT.anim.kind === 'throw') {
    const el = (now - BT.anim.t0) / 600;
    if (el < 1) {
      const x = 200 + el * 450, y = 420 - Math.sin(el * Math.PI) * 220;
      ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.fill();
      ctx.strokeStyle = '#d9c184'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.stroke();
    }
  }
}
function drawHpBar(c, x, y, w, isFoe) {
  const frac = Math.max(0, c.hp / c.maxHp);
  ctx.fillStyle = 'rgba(10,16,40,0.88)';
  ctx.fillRect(x, y, w, 72);
  ctx.fillStyle = '#ffd94d'; ctx.fillRect(x, y, w, 4);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 71);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Trebuchet MS';
  ctx.fillText(`${c.name}${c.mutant ? ' ★M' : c.instinct ? ' ★I' : c.mega ? ' ★MEGA' : ''}`, x + 10, y + 22);
  ctx.fillText(`Lv ${c.level}`, x + w - 70, y + 22);
  ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x + 10, y + 30, w - 20, 12);
  const col = frac > 0.5 ? '#37c978' : frac > 0.2 ? '#ffcf4d' : '#ff5f5f';
  ctx.fillStyle = col; ctx.fillRect(x + 10, y + 30, (w - 20) * frac, 12);
  // pass 3 — low HP pulses red so a creature about to faint is obvious
  if (frac <= 0.2 && frac > 0) {
    ctx.strokeStyle = `rgba(255,95,95,${0.4 + 0.6 * Math.abs(Math.sin(performance.now() / 220))})`;
    ctx.lineWidth = 2; ctx.strokeRect(x + 9, y + 29, w - 18, 14);
  }
  // XP bar (player side only) — the grind you can see
  if (!isFoe) {
    const xpFrac = Math.min(1, c.xp / xpToNext(c.level));
    ctx.fillStyle = '#22304f'; ctx.fillRect(x + 10, y + 46, w - 20, 5);
    ctx.fillStyle = '#7cc4ff'; ctx.fillRect(x + 10, y + 46, (w - 20) * xpFrac, 5);
  }
  ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Trebuchet MS';
  ctx.fillText(`${c.hp} / ${c.maxHp}`, x + 10, y + 66);
  if (c.status) {
    // status chip: colored pill behind the label
    const label = c.status.toUpperCase();
    const wdt = ctx.measureText(label).width + 12;
    ctx.fillStyle = '#ff5f7e'; ctx.fillRect(x + w - wdt - 8, y + 55, wdt, 16);
    ctx.fillStyle = '#fff'; ctx.fillText(label, x + w - wdt - 2, y + 67);
  }
}
