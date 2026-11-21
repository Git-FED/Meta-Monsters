/* Metamonsters v1 — core engine: state, loop, input, creatures, XP, save/load.
   Plain JS, no modules. Data globals (DEX, MOVES, ITEMS, MISSIONS, TOURNAMENTS,
   ENCOUNTERS) come from js/data/*.js loaded before this file. */
'use strict';

const TILE = 32;
const VIEW_W = 960, VIEW_H = 640;
const SAVE_KEY = 'metamonsters_save_v2';
const SAVE_VERSION = 2;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

/* ---------------- asset loader ---------------- */
const ImgCache = new Map();
function loadImg(src) {
  const cached = ImgCache.get(src);
  if (cached) return cached instanceof Promise ? cached : Promise.resolve(cached);
  const img = new Image();
  img.src = src;
  ImgCache.set(src, img); // cache the IMAGE itself so imgReady/imgEl see it
  return new Promise((res, rej) => { img.onload = () => res(img); img.onerror = () => rej(new Error('img ' + src)); });
}
function imgEl(src) { // synchronous element (may still be loading); use after preload
  let el = ImgCache.get(src);
  if (el instanceof Image) return el;
  const img = new Image(); img.src = src; ImgCache.set(src, img); return img;
}
function imgReady(src) { const e = ImgCache.get(src); return e instanceof Image && e.complete && e.naturalWidth > 0; }

/* ---------------- sound (tiny WebAudio synth) ---------------- */
const SFX = {
  ctx: null, muted: false,
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } },
  tone(freq, dur, type, vol) {
    if (this.muted || !this.ctx) return;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.06, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(); o.stop(this.ctx.currentTime + dur);
  },
  select() { this.ensure(); this.tone(660, 0.07); },
  back() { this.ensure(); this.tone(330, 0.07); },
  hit() { this.ensure(); this.tone(180, 0.12, 'sawtooth', 0.09); },
  heal() { this.ensure(); this.tone(523, 0.1); setTimeout(() => this.tone(784, 0.14), 90); },
  fanfare() { this.ensure(); [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.16), i * 130)); },
  catch1() { this.ensure(); this.tone(440, 0.09); setTimeout(() => this.tone(554, 0.09), 100); },
  catchWin() { this.ensure(); [392, 523, 659, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.12), i * 110)); },
  evo() { this.ensure(); [330, 392, 494, 659, 784, 988].forEach((f, i) => setTimeout(() => this.tone(f, 0.12), i * 100)); },
};

/* ---------------- game state ---------------- */
const G = {
  state: 'title',           // title | overworld | battle | dialog | menu | cutscene
  prevState: 'overworld',
  player: null,             // {map, x, y, dir, moving, px, py, anim}
  party: [],                // creature instances (max 6)
  storage: [],              // caught extras, kept at home computer
  bag: {},                  // itemId -> count
  cash: 100,
  skills: {},               // skillId -> {level, xp}
  missions: {},             // missionId -> {status:'active'|'done', objectives:{objId:true}}
  flags: {},                // story flags
  playtime: 0,              // seconds
  day: 1, timeMin: 8 * 60,  // in-game clock
  map: null,                // current MAPS entry
  npcs: [],                 // npcs on current map
  encounters: 0,
  muted: false,
  titleDone: false,
};

const SKILL_LIST = ['Gathering','Catching','Building','Fishing','Mining','Hunting','Cooking','Crafting','Swimming','Trading','Healing','Foraging'];
const SKILL_XP_PER_LEVEL = [0, 5, 15, 30, 50, 75, 105, 140, 180, 225, 275]; // cumulative uses to reach level n

function newGameState() {
  G.player = { map: 'haven', x: 10, y: 14, dir: 'down', moving: false, px: 10 * TILE, py: 14 * TILE, step: 0, anim: 0 };
  G.party = []; G.storage = [];
  G.bag = { net: 3, trap: 2, bandage: 3, bread: 2, waterBottle: 2 };
  G.cash = 100;
  G.skills = {}; SKILL_LIST.forEach(s => G.skills[s] = { level: 1, xp: 0 });
  G.missions = {}; G.flags = { visited: {} };
  G.playtime = 0; G.day = 1; G.timeMin = 8 * 60;
  G.encounters = 0;
  setMission('lastStarter', 'active');
}

/* ---------------- starter / friends (pass 1) ---------------- */
// Kai's starter is the one left after Marcus and Sofia pick theirs (METAMONSTERS-CHARACTERS.md).
// The player chooses which starter is left for Kai; Marcus takes the next in rotation
// (bear -> wolf -> shark), Sofia takes the last. Flags: starter, marcusStarter, sofiaStarter.
function starterFamily() {
  const s = G.party[0];
  if (!s) return 'shark';
  if (s.dex === '001') return 'bear';
  if (s.dex === '004') return 'wolf';
  return 'shark';
}
function starterFamilyDex(fam) { return fam === 'bear' ? '001' : fam === 'wolf' ? '004' : '043'; }
function friendStarterDex(name) {
  const fam = G.flags[name === 'marcus' ? 'marcusStarter' : 'sofiaStarter'];
  return starterFamilyDex(fam || 'wolf');
}
function assignStarters(kaiFam) {
  // rotation order bear -> wolf -> shark; Marcus takes the next, Sofia the last
  const order = ['bear', 'wolf', 'shark'];
  const rest = order.filter(f => f !== kaiFam);
  G.flags.starter = kaiFam; G.flags.marcusStarter = rest[0]; G.flags.sofiaStarter = rest[1];
}
function starterDisplayName(fam) { return fam === 'bear' ? 'Bear Cub' : fam === 'wolf' ? 'Wolf Cub' : 'Baby Shark'; }
function hasUnlock(name) { return !!G.flags['unlock_' + String(name).replace(/[^A-Za-z0-9]+/g, '_')]; }
function canCrossWater() { return hasUnlock('HM SWIM') || starterFamily() === 'shark'; }
// HM SOAR (Bazaar Brawl reward): a Bird creature in the party lets you fly to visited towns.
function canFly() { return !!G.flags.unlock_hmSOAR || !!G.flags.unlock_HM_SOAR; }
function partyBird() { return G.party.find(c => DEX[c.dex].category === 'Bird' && c.hp > 0); }
// The car (TRANSPORT.md): 5,000 cash, needs a car battery in the bag to start, burns
// 1 fuel unit per trip (a gasoline item adds fuel; the engine upgrade makes each one last longer).
function carReady() { return !!G.flags.hasCar && hasItem('carBattery'); }
function carFuelMax() { const up = G.flags.carUpgrades || {}; return up.tank ? 10 : 5; }
// Catch objectives: pass-1 objectives are count 1 (any catch completes them).
// Pass-2 objectives can require count > 1, a specific dex, or mutant catches only.
function completeCatchObjectives(caught) {
  const m = activeMission(); if (!m) return;
  const prog = (G.missions[m.id].progress = G.missions[m.id].progress || {});
  for (const o of m.objectives) {
    if (o.type !== 'catch') continue;
    if (o.dex && (!caught || caught.dex !== o.dex)) continue;
    if (o.mutant && (!caught || !caught.mutant)) continue;
    prog[o.id] = (prog[o.id] || 0) + 1;
    if (prog[o.id] >= (o.count || 1)) completeObjective(m.id, o.id);
  }
}
// Battle objectives (pass 2): a trainer battle won with the matching battleTag completes them.
function completeBattleObjectives(tag) {
  if (!tag) return;
  const m = activeMission(); if (!m) return;
  for (const o of m.objectives) {
    if (o.type === 'battle' && o.trainer === tag) completeObjective(m.id, o.id);
  }
}

/* ---------------- creatures ---------------- */
function bandMult(level) {
  if (level < 5) return 1; if (level < 10) return 1.5; if (level < 20) return 2.5;
  if (level < 50) return 5; if (level < 75) return 12; return 30;
}
function xpToNext(level) { return Math.round(20 * level * level * bandMult(level)); }
function xpTableFor(band) { // base XP per win vs same-level foe, from METAMONSTERS-LEVELING.md
  if (band <= 5) return { wild: 25, trainer: 50, catch: 25 };
  if (band <= 10) return { wild: 60, trainer: 120, catch: 60 };
  if (band <= 20) return { wild: 150, trainer: 300, catch: 150 };
  if (band <= 50) return { wild: 400, trainer: 800, catch: 400 };
  if (band <= 75) return { wild: 1200, trainer: 2400, catch: 1200 };
  return { wild: 8000, trainer: 16000, catch: 8000 };
}
function bandOf(level) { return level <= 5 ? 5 : level <= 10 ? 10 : level <= 20 ? 20 : level <= 50 ? 50 : level <= 75 ? 75 : 100; }

function statCalc(base, level, isHp) {
  if (isHp) return Math.floor(((2 * base + 10) * level) / 100) + level + 10;
  return Math.floor(((2 * base + 5) * level) / 100) + 5;
}
function creatureStats(dexId, level, instinct, mutant) {
  const d = DEX[dexId];
  const s = {
    hp: statCalc(d.stats.hp, level, true),
    atk: statCalc(d.stats.atk, level, false),
    def: statCalc(d.stats.def, level, false),
    spd: statCalc(d.stats.spd, level, false),
  };
  if (instinct) { s.atk = Math.round(s.atk * 1.15); s.spd = Math.round(s.spd * 1.15); s.def = Math.round(s.def * 0.85); }
  // Mutants are stronger: +20% Attack, +15% HP (METAMONSTERS-MUTANT-FORMS.md).
  if (mutant) { s.atk = Math.round(s.atk * 1.2); s.hp = Math.round(s.hp * 1.15); }
  return s;
}
function learnsetFor(dexId, level) {
  const ls = LEARNSETS[dexId] || [];
  const known = [];
  for (const e of ls) {
    if (e.level > level) break;
    if (e.move === 'sig') { if (!known.some(m => m.id === 'sig')) known.push({ id: 'sig', dex: dexId }); }
    else if (!known.some(m => m.id === e.move)) known.push({ id: e.move });
  }
  // keep signature + 3 most recent learned
  const sig = known.filter(m => m.id === 'sig');
  const rest = known.filter(m => m.id !== 'sig').slice(-3);
  return [...sig, ...rest].slice(0, 4);
}
function sigMoveFor(dexId) {
  const d = DEX[dexId];
  const s = SIG_MOVES[d.sig]; // SIG_MOVES is keyed by signature NAME in the data file
  if (!s) return { id: 'sig', name: d.sig, type: d.category, kind: 'category', power: 65, effect: null, desc: d.sig };
  return { id: 'sig', name: d.sig, type: s.type || d.category, kind: s.kind || 'category', power: s.power ?? 65, effect: s.effect || null, desc: s.desc || d.sig };
}
function moveDef(moveId, dexId) {
  if (moveId === 'sig') return sigMoveFor(dexId);
  return MOVES[moveId];
}
function makeCreature(dexId, level, opts) {
  opts = opts || {};
  const d = DEX[dexId];
  const inst = !!opts.instinct;
  const mut = !!opts.mutant;
  const stats = creatureStats(dexId, level, inst, mut);
  const c = {
    uid: 'c' + Math.random().toString(36).slice(2, 9),
    dex: dexId, name: mut ? (MUTANT_NAMES[dexId] || d.name) : d.name, level, xp: 0, instinct: inst, mutant: mut,
    maxHp: stats.hp, hp: stats.hp, stats,
    moves: learnsetFor(dexId, level).map(m => m.id),
    status: null, statusTurns: 0,
    stages: { atk: 0, def: 0, spd: 0, acc: 0, eva: 0 },
    form: mut ? 'mutant' : inst ? 'instinct' : 'normal',
  };
  return c;
}
function creatureSprite(c, front) {
  // Mega form (one battle only) wins over mutant/instinct; mutants use their own art.
  if (c.mega) return `assets/sprites/mega/${c.dex}-mega-` + (front ? 'front.png' : 'back.png');
  if (c.mutant) return `assets/sprites/mutant/${c.dex}-mutant-` + (front ? 'front.png' : 'back.png');
  // Pass 3 — ancients (A01-A15) and mystery creatures (M1-M5) have their own folders.
  if (typeof ANCIENT_DEX !== 'undefined' && ANCIENT_DEX[c.dex]) {
    const s = ANCIENT_DEX[c.dex].sprite || c.dex.toLowerCase();
    return `assets/sprites/ancients/${s}-` + (front ? 'front.png' : 'back.png');
  }
  if (typeof MYSTERY_DEX !== 'undefined' && MYSTERY_DEX[c.dex]) {
    const s = MYSTERY_DEX[c.dex].sprite || c.dex.toLowerCase();
    return `assets/sprites/mystery/${s}-` + (front ? 'front.png' : 'back.png');
  }
  const base = c.instinct ? `assets/sprites/instinct/${c.dex}-instinct-` : `assets/sprites/creatures/${c.dex}-`;
  return base + (front ? 'front.png' : 'back.png');
}
/* Pass 3 helpers: time of day, party senses, cave readiness. */
function hourOfDay() { return Math.floor(G.timeMin / 60) % 24; }
function hasSense(sense) { return G.party.some(c => DEX[c.dex] && DEX[c.dex].sense === sense && c.hp > 0); }
function partyMaxLevel() { return G.party.reduce((m, c) => Math.max(m, c.level), 0); }
// ---- pass 3 helpers ----
function healParty() {
  for (const c of G.party) { c.hp = c.maxHp; c.status = null; c.statusTurns = 0; c.stages = { atk: 0, def: 0, spd: 0, acc: 0, eva: 0 }; }
}
function gainXp(c, amount) {
  if (c.level >= 100 || amount <= 0) return { leveled: 0, learned: [], evolved: null };
  // Pass 3 — gaining XP on a Saturday or Sunday counts as taking part in the
  // Double XP Weekend live event (the backend's Events tab reads this flag).
  const dow = new Date().getDay();
  if (dow === 0 || dow === 6) G.flags.event_doublexp = true;
  c.xp += amount;
  let leveled = 0; const learned = [];
  while (c.level < 100 && c.xp >= xpToNext(c.level)) {
    c.xp -= xpToNext(c.level);
    c.level++;
    leveled++;
    const oldStats = c.stats;
    c.stats = creatureStats(c.dex, c.level, c.instinct, c.mutant);
    c.maxHp = c.stats.hp;
    c.hp = Math.min(c.maxHp, c.hp + (c.stats.hp - oldStats.hp));
    // new moves
    const ls = LEARNSETS[c.dex] || [];
    for (const e of ls) {
      if (e.level === c.level && e.move !== 'sig' && !c.moves.includes(e.move)) {
        if (c.moves.length >= 4) {
          // replace the oldest non-signature move (signature is always slot 1)
          const forgotten = c.moves[1];
          c.moves.splice(1, 1);
          c.moves.push(e.move);
          learned.push({ newMove: e.move, replace: true, forgotten });
        } else { c.moves.push(e.move); learned.push({ newMove: e.move, replace: false }); }
      }
    }
  }
  let evolved = null;
  const d = DEX[c.dex];
  if (d.evo && d.evo.level && c.level >= d.evo.level) evolved = d.evo.into;
  return { leveled, learned, evolved };
}
function evolveCreature(c, intoDex) {
  const old = c.name;
  c.dex = intoDex; c.name = c.mutant ? (MUTANT_NAMES[intoDex] || DEX[intoDex].name) : DEX[intoDex].name;
  c.stats = creatureStats(intoDex, c.level, c.instinct, c.mutant);
  c.maxHp = c.stats.hp; c.hp = Math.min(c.maxHp, c.hp + 40);
  const ls = learnsetFor(intoDex, c.level).map(m => m.id);
  c.moves = ls;
  return old;
}
function addItem(id, n) { G.bag[id] = (G.bag[id] || 0) + (n || 1); if (G.bag[id] <= 0) delete G.bag[id]; }
function hasItem(id, n) { return (G.bag[id] || 0) >= (n || 1); }
function removeItem(id, n) { addItem(id, -(n || 1)); }

/* ---------------- skills ---------------- */
function skillGain(skill, n) {
  const s = G.skills[skill]; if (!s || s.level >= 10) return false;
  s.xp += (n || 1);
  let up = false;
  while (s.level < 10 && s.xp >= SKILL_XP_PER_LEVEL[s.level]) { s.level++; up = true; }
  if (up) toast(`${skill} reached level ${s.level}!` + (s.level === 5 ? ' Certification earned!' : s.level === 10 ? ' Mastery badge earned!' : ''));
  return up;
}

/* ---------------- missions ---------------- */
function setMission(id, status) {
  if (!G.missions[id]) G.missions[id] = { status, objectives: {} };
  else G.missions[id].status = status;
  if (status === 'active' && id === 'dumpSite') {
    // The Dump Site mission opens the east: the gate to the Rust Fields is walkable
    // from the moment the mission starts (its reward then unlocks mutants on completion).
    G.flags.unlock_east = true;
  }
  if (status === 'active') {
    // Reach objectives for maps the player already visited count at once — the walking
    // was already done, so the mission should not demand a second visit.
    const def = MISSIONS.find(x => x.id === id);
    if (def) {
      for (const o of def.objectives) {
        if (o.type === 'reach' && o.map && G.flags.visited && G.flags.visited[o.map]) {
          G.missions[id].objectives[o.id] = true;
        }
      }
      if (def.objectives.length && def.objectives.every(o => G.missions[id].objectives[o.id])) {
        completeMission(id);
      }
    }
  }
}
function missionStatus(id) { return G.missions[id] ? G.missions[id].status : 'locked'; }
function objectiveDone(missionId, objId) {
  const m = G.missions[missionId]; return !!(m && m.objectives[objId]);
}
function completeObjective(missionId, objId) {
  const m = G.missions[missionId]; if (!m) return;
  m.objectives[objId] = true;
  const def = MISSIONS.find(x => x.id === missionId);
  if (def && def.objectives.every(o => m.objectives[o.id])) completeMission(missionId);
}
function completeMission(id) {
  const def = MISSIONS.find(x => x.id === id);
  if (!def || missionStatus(id) === 'done') return;
  setMission(id, 'done');
  SFX.fanfare();
  if (def.reward) {
    if (def.reward.cash) { G.cash += def.reward.cash; }
    if (def.reward.items) for (const [k, v] of Object.entries(def.reward.items)) addItem(k, v);
    if (def.reward.unlock) {
      // unlock may be a single string or an array (dumpSite unlocks east + mutants)
      const unlocks = Array.isArray(def.reward.unlock) ? def.reward.unlock : [def.reward.unlock];
      for (const u of unlocks) G.flags['unlock_' + String(u).replace(/[^A-Za-z0-9]+/g, '_')] = true;
    }
    if (def.reward.creature) {
      // a gifted creature (tournament prizes, path-exclusive mutants): party or storage
      const gift = makeCreature(def.reward.creature.dex, def.reward.creature.level || 5, { mutant: !!def.reward.creature.mutant });
      if (G.party.length < 6) G.party.push(gift); else G.storage.push(gift);
      toast(`${gift.name} joined ${G.party.includes(gift) ? 'the party' : 'storage at home'}!`);
    }
    if (def.reward.creature2) {
      // Pass 3 — the Ancient Crown pays TWO gifts: the 4-star Dire Wolf from the
      // Ancient Keeper plus the 3-star tournament prize. Same party/storage rule.
      const gift2 = makeCreature(def.reward.creature2.dex, def.reward.creature2.level || 5, { mutant: !!def.reward.creature2.mutant });
      if (G.party.length < 6) G.party.push(gift2); else G.storage.push(gift2);
      toast(`${gift2.name} joined ${G.party.includes(gift2) ? 'the party' : 'storage at home'}!`);
    }
    if (def.reward.rank) {
      // Cyber Tech rank ladder (join path): Intern 1 .. Executive 5
      G.flags.corpRank = Math.max(G.flags.corpRank || 0, def.reward.rank);
      toast(`Cyber Tech rank: ${['', 'Intern', 'Associate', 'Manager', 'Director', 'Executive'][G.flags.corpRank]}!`);
    }
    if (def.reward.xp) for (const c of G.party) gainXp(c, def.reward.xp);
  }
  toast(`Mission complete: ${def.name}!`);
  // The generic starter-path mission hands off to the variant matching Kai's starter
  // (bear / wolf / shark) — pass 1 wires all three, not just the shark.
  if (id === 'starterPath') {
    const fam = starterFamily();
    setMission('starterPath' + fam[0].toUpperCase() + fam.slice(1), 'active');
  }
  else if (id === 'theChoice') {
    // The Choice forks: Mara's resistance (fight) or Caleb's Cyber Tech job (join).
    // G.flags.path is set by the choice panel before this runs.
    setMission(G.flags.path === 'join' ? 'interview' : 'leak', 'active');
  }
  else if (def.next) setMission(def.next, 'active');
  saveGame(true);
}
function activeMission() {
  return MISSIONS.find(m => missionStatus(m.id) === 'active') || null;
}

/* ---------------- save / load ---------------- */
function serializeCreature(c) {
  return { dex: c.dex, level: c.level, xp: c.xp, hp: c.hp, moves: c.moves.slice(), status: c.status, instinct: c.instinct, mutant: c.mutant };
}
function deserializeCreature(s) {
  const c = makeCreature(s.dex, s.level, { instinct: s.instinct, mutant: s.mutant });
  c.xp = s.xp; c.hp = Math.min(s.hp, c.maxHp); c.moves = s.moves.slice(); c.status = s.status;
  return c;
}
function saveGame(silent) {
  try {
    const data = {
      version: SAVE_VERSION, player: { map: G.player.map, x: G.player.x, y: G.player.y, dir: G.player.dir },
      cash: G.cash, party: G.party.map(serializeCreature), storage: G.storage.map(serializeCreature),
      bag: G.bag, skills: G.skills, missions: G.missions, flags: G.flags,
      playtime: G.playtime, day: G.day, timeMin: G.timeMin,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    if (!silent) toast('Game saved.');
    checkAchievements(); // pass 3 — newly earned online achievements pop here
    return true;
  } catch (e) { if (!silent) toast('Save failed: ' + e.message); return false; }
}
// Pass 3 — after any progress worth saving, check for newly earned online
// achievements. Needs a signed-in hub account; no-op otherwise (and never
// allowed to break the game — the backend is local-first, the game is not).
function checkAchievements() {
  if (typeof BACKEND === 'undefined' || !BACKEND.checkAchievements) return;
  try {
    const r = BACKEND.checkAchievements();
    if (r && r.ok && r.newly && r.newly.length) toast(`🏆 Achievement earned: ${r.newly.join(', ')}!`);
  } catch (e) { /* backend must never break the game */ }
}
function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (d.version !== SAVE_VERSION) return null;
    return d;
  } catch (e) { return null; }
}
function applySave(d) {
  newGameState();
  G.player.map = d.player.map; G.player.x = d.player.x; G.player.y = d.player.y; G.player.dir = d.player.dir;
  G.player.px = d.player.x * TILE; G.player.py = d.player.y * TILE;
  G.cash = d.cash; G.party = d.party.map(deserializeCreature); G.storage = d.storage.map(deserializeCreature);
  G.bag = d.bag; G.skills = d.skills; G.missions = d.missions; G.flags = d.flags || {};
  if (!G.flags.visited) G.flags.visited = {};
  G.playtime = d.playtime || 0; G.day = d.day || 1; G.timeMin = d.timeMin || 8 * 60;
}
function hasSave() { return !!loadSave(); }

/* ---------------- input ---------------- */
const keys = {};
const pressed = {}; // edge-triggered, consumed by update
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (!keys[e.key]) pressed[e.key] = true;
  keys[e.key] = true;
  if (e.key === 'Enter' || e.key === ' ') pressed['confirm'] = true;
  if (e.key === 'Escape' || e.key.toLowerCase() === 'm') pressed['menu'] = true;
  // edge-triggered direction steps: a quick tap must still register one tile step
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') pressed['up'] = true;
  if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') pressed['down'] = true;
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') pressed['left'] = true;
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') pressed['right'] = true;
});
window.addEventListener('keyup', (e) => { keys[e.key] = false; });
function keyDown(...names) { return names.some(n => keys[n]); }
function consumePress(name) { if (pressed[name]) { pressed[name] = false; return true; } return false; }
function clearPresses() { for (const k of Object.keys(pressed)) pressed[k] = false; }

/* ---------------- helpers ---------------- */
function $(id) { return document.getElementById(id); }
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
let toastTimer = null;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; show(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => hide(t), 2600);
}
function fmtTime() {
  const h = Math.floor(G.timeMin / 60) % 24, m = G.timeMin % 60;
  return `Day ${G.day} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function advanceClock(min) { G.timeMin += min; if (G.timeMin >= 24 * 60) { G.timeMin -= 24 * 60; G.day++; } }
function setState(s) { G.prevState = G.state === 'dialog' ? G.prevState : G.state; G.state = s; }
function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function chance(p) { return Math.random() < p; }
function pickWeighted(table) {
  let total = 0; for (const t of table) total += t.weight;
  let r = Math.random() * total;
  for (const t of table) { r -= t.weight; if (r <= 0) return t; }
  return table[table.length - 1];
}

/* ---------------- derived item tables (from data shapes) ---------------- */
// Traps: ITEMS with use 'catch', minus lures (bait, whistle). Stage limits per the items doc.
const TRAP_MAX_STAGE = { net: 1, cage: 2, lasso: 2 };
const TRAPS = Object.values(ITEMS).filter(i => i.use === 'catch' && i.id !== 'bait' && i.id !== 'whistle')
  .map(i => ({ id: i.id, name: i.name, mod: i.catchMod || 1, maxStage: TRAP_MAX_STAGE[i.id] || null }));
// Shop: everything priced, except key items and money; plus the sellable tools (axe is given free).
const SHOP_STOCK = [
  ...Object.values(ITEMS).filter(i => i.price > 0 && i.cat !== 'Key Items' && i.cat !== 'Money').map(i => i.id),
  ...Object.values(TOOLS).filter(t => t.price > 0).map(t => t.id),
];
function itemDef(id) { return ITEMS[id] || TOOLS[id] || TM_ITEMS[id]; }
function itemIdByName(name) { // dex evo items are stored as display names ("Car battery")
  const hit = Object.values(ITEMS).find(i => i.name.toLowerCase() === String(name).toLowerCase());
  return hit ? hit.id : null;
}
function itemSprite(id) { // item art files use kebab-case slugs; tools live in their own folder
  if (TOOLS[id]) return `assets/sprites/tools/${id}.png`;
  if (TM_ITEMS[id]) return 'assets/sprites/items/tm-disc.png';
  return `assets/sprites/items/${id.replace(/([A-Z])/g, '-$1').toLowerCase()}.png`;
}
