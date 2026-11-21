#!/usr/bin/env node
/* Metamonsters pass 3 self-check — run from ~/workspace/metamonsters-game:
     node tools/self-check.js
   Loads all data + engine files in Node with DOM stubs and verifies the
   integration contract: creature/XP/damage math, mission + tournament
   shapes, recipe/item/shop tables, mutant/mega systems, ancient + mystery
   creatures, and that every referenced sprite exists on disk. Exit 0 = pass.
   EXPECTED FAILURES until the coordinator finishes tiles.js / battle.js /
   ui.js: MAPS = 59, AREA_BATTLE coverage, reach objectives naming the new
   maps, NPC_DIALOG exileLeader, and the 20 new creature sprites. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
process.chdir(ROOT);

// --- minimal DOM stubs (engine/tiles/battle/ui only touch these at load time) ---
function makeCtx() {
  return new Proxy({}, {
    get: (t, k) => {
      if (k === 'measureText') return () => ({ width: 0 });
      if (k === 'getImageData') return () => ({ data: new Uint8ClampedArray(4) });
      return () => {};
    },
    set: () => true,
  });
}
function makeEl() {
  return {
    width: 0, height: 0, style: {}, classList: { add() {}, remove() {} },
    textContent: '', innerHTML: '', getContext: makeCtx, appendChild() {},
    addEventListener() {}, setAttribute() {}, insertAdjacentHTML() {},
    querySelector() { return makeEl(); }, disabled: false, onclick: null,
  };
}
global.document = { getElementById: () => makeEl(), createElement: () => makeEl() };
global.window = { addEventListener() {}, AudioContext: undefined, webkitAudioContext: undefined };
global.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
global.Image = class { constructor() { this.complete = false; this.naturalWidth = 0; } addEventListener() {} };
global.requestAnimationFrame = () => {};

// --- load the game files in page order (vm, one shared context) ---
const vm = require('vm');
const ctx = vm.createContext({
  ...global, console, process, require, module: { exports: {} },
  document: global.document, window: global.window, localStorage: global.localStorage,
  Image: global.Image, requestAnimationFrame: global.requestAnimationFrame,
});
for (const f of [
  'js/data/dex.js', 'js/data/moves.js', 'js/data/ancients.js', 'js/data/items.js', 'js/data/missions.js',
  'js/data/tournaments.js', 'js/data/encounters.js', 'js/data/mutants.js',
  'js/engine.js', 'js/tiles.js', 'js/battle.js', 'js/ui.js',
]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const T = (expr) => vm.runInContext(expr, ctx);

const errs = [];
function check(cond, msg) {
  if (!cond) errs.push(msg);
  else console.log('ok -', msg);
}

// 1. creature creation + learnsets + signatures
check(T(`(function(){ const c = makeCreature('001', 5); return c.name === 'Bear Cub' && c.hp === c.maxHp && c.hp > 0 && c.moves.includes('sig'); })()`), 'makeCreature 001 L5 (Bear Cub, sig move)');
check(T(`makeCreature('003', 36).moves.includes('grizzlysRage')`), "Grizzly L36 knows Grizzly's Rage");
check(T(`sigMoveFor('001').power === 65`), 'sigMoveFor resolves via SIG_MOVES name');
// 2. damage + charts
check(T(`(function(){ const s = makeCreature('043', 5), b = makeCreature('013', 5); return calcDamage(s, b, MOVES['bite']).eff === 2; })()`), 'Mammal move vs Bird = 2x');
check(T(`xpToNext(1) === 20 && xpToNext(5) === 750`), 'xpToNext 1=20, 5=750');
check(T(`(function(){ const c = makeCreature('001', 15); const r = gainXp(c, 20000); return c.level >= 16 && r.evolved === '002'; })()`), 'Bear Cub L15 +20k XP evolves to 002');
// 2b. mutant + mega systems (pass 2)
check(T(`Object.keys(MUTANT_NAMES).length === 93`), 'MUTANT_NAMES = 93');
check(T(`Object.keys(MEGA_FORMS).length === 12`), 'MEGA_FORMS = 12');
check(T(`(function(){ const c = makeCreature('004', 40, { mutant: true }); return c.mutant === true && c.name === MUTANT_NAMES['004'] && c.form === 'mutant'; })()`), 'makeCreature mutant: 2H Wolf Cub, form mutant');
check(T(`(function(){ const n = creatureStats('004', 40, false, false), m = creatureStats('004', 40, false, true); return m.atk > n.atk && m.hp > n.hp; })()`), 'mutant stats stronger than normal (+20% atk, +15% hp)');
check(T(`(function(){ const c = makeCreature('003', 36); return creatureSprite(c, false).includes('creatures/003-back'); })()`), 'normal sprite path: creatures/003-back');
check(T(`(function(){ const c = makeCreature('003', 36, { mutant: true }); return creatureSprite(c, false).includes('mutant/003-mutant-back'); })()`), 'mutant sprite path: mutant/003-mutant-back');
check(T(`(function(){ const c = makeCreature('003', 36); c.mega = true; return creatureSprite(c, false).includes('mega/003-mega-back'); })()`), 'mega sprite path: mega/003-mega-back');
check(T(`(function(){ const c = makeCreature('003', 36, { mutant: true }); const r = gainXp(c, 20000); return c.mutant === true && c.name === MUTANT_NAMES['003']; })()`), 'mutant stays mutant through evolution');
check(T(`(function(){ G.flags.unlock_hmSOAR = true; const b = makeCreature('013', 10); G.party = [b]; return canFly() === true && partyBird() === b; })()`), 'canFly + partyBird with HM SOAR + Bird creature');
check(T(`(function(){ G.flags.hasCar = true; G.bag = { carBattery: 1 }; return carReady() === true && carFuelMax() === 5; })()`), 'carReady with battery; fuel max 5 (10 with tank upgrade)');
check(T(`(function(){ G.flags.hasCar = true; G.bag = { carBattery: 1 }; G.flags.carUpgrades = { tank: true }; return carFuelMax() === 10; })()`), 'car fuel max 10 with bigger tank');
// 2c. ancient + mystery creatures (pass 3)
check(T(`Object.keys(ANCIENT_DEX).length === 15`), 'ANCIENT_DEX = 15');
check(T(`Object.keys(MYSTERY_DEX).length === 5`), 'MYSTERY_DEX = 5');
check(T(`Object.keys(DEX).length === 113`), 'DEX = 113 after merge (93 main + 15 ancient + 5 mystery)');
check(T(`Object.keys(ANCIENT_LEARNSETS).length === 20`), 'ANCIENT_LEARNSETS = 20 (A01-A15 + M1-M5)');
check(T(`Object.values(ANCIENT_DEX).concat(Object.values(MYSTERY_DEX)).every(d => d.stage === 3 && d.evo === null)`), 'all ancients + mystery are stage 3, no evolutions');
check(T(`Object.entries(ANCIENT_DEX).every(([k, d]) => (d.stars === 5) === ['A01','A03','A04','A06','A10'].includes(k))`), 'ancient stars: 5-star A01/A03/A04/A06/A10, 4-star the other ten');
check(T(`Object.values(MYSTERY_DEX).every(d => d.stars === 5)`), 'all mystery creatures are 5-star');
check(T(`(function(){ const t = d => d.stats.hp + d.stats.atk + d.stats.def + d.stats.spd; return Object.values(ANCIENT_DEX).every(d => t(d) === (d.stars === 5 ? 580 : 520)) && Object.values(MYSTERY_DEX).every(d => t(d) === 600); })()`), 'ancient stat totals: 4-star 520, 5-star 580, mystery 600');
check(T(`Object.entries(ANCIENT_LEARNSETS).every(([k, ls]) => ls.every(e => e.move === 'sig' || MOVES[e.move]))`), 'all ancient/mystery learnset moves exist in MOVES');
check(T(`Object.values(ANCIENT_DEX).concat(Object.values(MYSTERY_DEX)).every(d => ANCIENT_SIG_MOVES[d.sig])`), 'every ancient/mystery signature resolves via ANCIENT_SIG_MOVES');
check(T(`(function(){ const a = makeCreature('A06', 90); return a.name === 'T. Rex' && a.moves.includes('sig') && sigMoveFor('A06').power === 65; })()`), 'makeCreature A06 L90 (T. Rex, sig move)');
check(T(`(function(){ const m = makeCreature('M1', 90); return m.name === 'Spinosaurus' && m.moves.includes('sig') && sigMoveFor('M1').power === 65; })()`), 'makeCreature M1 L90 (Spinosaurus, sig move)');
check(T(`(function(){ const a = makeCreature('A04', 90); return sigMoveFor('A04').effect && sigMoveFor('A04').effect.stat === 'eva'; })()`), 'flight signature is evasive (Pterodactyl eva +1; engine coerces its null power to 65, same as existing evasive sigs)');
check(T(`(function(){ return sigMoveFor('A15').effect && sigMoveFor('A15').effect.stat === 'def'; })()`), 'Shell armor is defensive (Ammonite def +1; engine coerces its null power to 65, same as existing defensive sigs)');
// 3. derived tables
check(T(`TRAPS.length === 6`), 'TRAPS = ' + T(`TRAPS.map(t=>t.id).join(',')`));
check(T(`SHOP_STOCK.length > 40`), 'SHOP_STOCK = ' + T(`SHOP_STOCK.length`));
check(T(`RECIPES.length === 24`), 'RECIPES = 24');
check(T(`RECIPES.every(r => itemDef(r.result) && Object.keys(r.needs).every(id => itemDef(id)))`), 'all recipe needs/results resolve');
// 4. encounters + tournaments + missions
check(T(`Object.entries(ENCOUNTERS).every(([a, e]) => e.table.every(t => DEX[t.dex]) && e.levels[0] < e.levels[1])`), 'all encounter dex exist, levels sane');
check(T(`Object.keys(ENCOUNTERS).length === 40`), 'ENCOUNTERS = 40 areas (23 + 17 pass-3)');
check(T(`Object.values(ENCOUNTERS).every(e => e.table.reduce((s, t) => s + t.weight, 0) === 100)`), 'every encounter table sums to weight 100');
check(T(`Object.keys(ENCOUNTERS).every(a => AREA_BATTLE[a])`), 'every encounter area has a battle bg + weather');
check(T(`['rustFields','ashenFlats','wreckyard','hollow'].every(a => ENCOUNTERS[a].table.every(e => e.mutant === true))`), 'east areas are all-mutant');
check(T(`ENCOUNTERS.echoCaves.table.some(e => e.mutant) && ENCOUNTERS.echoCaves.table.some(e => !e.mutant)`), 'echoCaves is mixed normal + mutant');
check(T(`MISSIONS.length === 58`), 'MISSIONS = 58');
check(T(`TOURNAMENTS.length === 10`), 'TOURNAMENTS = 10');
// MAPS = 59 counts maps the coordinator adds in tiles.js (32 existing + 27 new:
// caveMouth, caveDeep, caveGate, 14 ancient places, sanctuary, 5 mystery hideouts,
// 3 arenas rustArena/cityArena/caveArena, hubUpper). If the coordinator's map count
// differs, this check says so — do not fudge the number.
check(T(`Object.keys(MAPS).length === 59`), 'MAPS = 59');
check(T(`(function(){ const cup = TOURNAMENTS.find(t => t.id === 'rookieCup'); const qf = cup.trainers.find(t => t.id === 'qf1'), sf = cup.trainers.find(t => t.round === 'semifinal'), fin = cup.trainers.find(t => t.round === 'final'); return qf && sf && fin && fin.name === 'Marcus' && fin.team[0].dex === '004'; })()`), 'rookieCup path: Pip / Rook / Marcus (Wolf Cub #004)');
check(T(`(function(){ return TOURNAMENTS.every(cup => cup.trainers.find(t => t.round === 'quarterfinal') && cup.trainers.find(t => t.round === 'semifinal') && cup.trainers.find(t => t.id === cup.finalId)); })()`), 'all 10 cups have quarterfinal + semifinal + finalId trainer');
check(T(`(function(){ return TOURNAMENTS.every(cup => cup.trainers.length === cup.size) && TOURNAMENTS.filter(c => c.rounds === 5).every(c => c.trainers.length === 32) && TOURNAMENTS.filter(c => c.rounds === 4).every(c => c.trainers.length === 16) && TOURNAMENTS.filter(c => c.rounds === 3).every(c => c.trainers.length === 8); })()`), 'cup sizes: 5-round 32, 4-round 16, 3-round 8 trainers');
check(T(`(function(){ const c = TOURNAMENTS.find(t => t.id === 'ancientCrown'); const n = r => c.trainers.filter(t => t.round === r).length; return c.trainers.length === 32 && n('round32') === 16 && n('round16') === 9 && n('quarterfinal') === 4 && n('semifinal') === 2 && n('final') === 1; })()`), 'ancientCrown: 32 trainers, rounds 16/9/4/2/1 (round32 present; 9 round16 follows the pass-2 first-round convention)');
check(T(`(function(){ const c = TOURNAMENTS.find(t => t.id === 'wastelandWar'); return c.trainers.every(t => t.team.every(s => s.mutant === true)); })()`), 'wastelandWar: every trainer team is all-mutant');
check(T(`(function(){ const c = TOURNAMENTS.find(t => t.id === 'ancientCrown'); const k = c.trainers.find(t => t.id === c.finalId); return k && k.team.every(s => /^A/.test(s.dex)); })()`), 'ancientCrown final (Ancient Keeper) is all-ancient');
check(T(`(function(){ return TOURNAMENTS.every(cup => cup.trainers.every(t => t.team.every(s => s.level >= cup.levels[0] && s.level <= cup.levels[1]))); })()`), 'all tournament team levels inside cup ranges');
check(T(`(function(){ const m = { rookieCup:'firstTournament', forestClash:'secondTournament', reefRumble:'thirdTournament', desertHeat:'fourthTournament', bazaarBrawl:'fifthTournament', frostCrown:'sixthTournament', universityGames:'seventhTournament', wastelandWar:'eighthTournament', rokCityChampionship:'ninthTournament', ancientCrown:'tenthTournament' }; return TOURNAMENTS.every(cup => { const md = MISSIONS.find(x => x.id === m[cup.id]); return md && md.reward.cash === cup.reward.cash && md.reward.unlock === cup.reward.unlock && JSON.stringify(md.reward.items||{}) === JSON.stringify(cup.reward.items||{}); }); })()`), 'cup rewards match their tournament missions (cash + items + unlock, both places)');
check(T(`MISSIONS.find(m => m.id === 'lastStarter').next === 'firstWood' && MISSIONS.find(m => m.id === 'starterPathShark').next === 'firstTournament'`), 'mission chain lastStarter->firstWood, starterPathShark->firstTournament');
check(T(`MISSIONS.find(m => m.id === 'firstTournament').next === 'foreclosure' && MISSIONS.find(m => m.id === 'thirdTournament').next === 'labLog' && MISSIONS.find(m => m.id === 'coast').next === 'rokCity'`), 'mission chain firstTournament->foreclosure->...->thirdTournament->labLog->coldNorth->coast->rokCity');
check(T(`MISSIONS.find(m => m.id === 'theChoice').next === null && MISSIONS.find(m => m.id === 'exposure').next === 'dumpSite' && MISSIONS.find(m => m.id === 'executive').next === 'dumpSite' && MISSIONS.find(m => m.id === 'finalBattle').next === 'eighthTournament'`), 'theChoice branches (next null, engine forks by flag); exposure + executive -> dumpSite; finalBattle -> eighthTournament');
check(T(`MISSIONS.find(m => m.id === 'finalBattle').next === 'eighthTournament' && MISSIONS.find(m => m.id === 'eighthTournament').next === 'ninthTournament' && MISSIONS.find(m => m.id === 'ninthTournament').next === 'tenthTournament' && MISSIONS.find(m => m.id === 'tenthTournament').next === 'the75World' && MISSIONS.find(m => m.id === 'the75World').next === 'sanctuary' && MISSIONS.find(m => m.id === 'sanctuary').next === 'mysterySpino' && MISSIONS.find(m => m.id === 'mysterySpino').next === 'mysteryQuetz' && MISSIONS.find(m => m.id === 'mysteryQuetz').next === 'mysteryTitan' && MISSIONS.find(m => m.id === 'mysteryTitan').next === 'mysteryMega' && MISSIONS.find(m => m.id === 'mysteryMega').next === 'mysteryBat' && MISSIONS.find(m => m.id === 'mysteryBat').next === 'wholeStory' && MISSIONS.find(m => m.id === 'wholeStory').next === null`), 'pass-3 chain: finalBattle->eighth->ninth->tenth->the75World->sanctuary->mysterySpino->mysteryQuetz->mysteryTitan->mysteryMega->mysteryBat->wholeStory (end)');
check(T(`MISSIONS.find(m => m.id === 'the75World').phase === 4 && MISSIONS.find(m => m.id === 'sanctuary').phase === 4 && MISSIONS.find(m => m.id === 'climbLesson').next === null && MISSIONS.find(m => m.id === 'smashLesson').next === null`), 'the75World + sanctuary are phase-4 chain entries; climbLesson + smashLesson are side missions (next null)');
check(T(`MISSIONS.every(m => !m.next || MISSIONS.some(x => x.id === m.next))`), 'every mission next link resolves');
check(T(`(function(){ assignStarters('bear'); return G.flags.marcusStarter === 'wolf' && G.flags.sofiaStarter === 'shark' && friendStarterDex('marcus') === '004' && friendStarterDex('sofia') === '043'; })()`), "assignStarters(bear): Marcus=wolf #004, Sofia=shark #043");
check(T(`(function(){ assignStarters('wolf'); return G.flags.marcusStarter === 'bear' && G.flags.sofiaStarter === 'shark' && friendStarterDex('marcus') === '001'; })()`), "assignStarters(wolf): Marcus=bear #001, Sofia=shark");
check(T(`MISSIONS.every(m => m.objectives.filter(o => o.type === 'reach').every(o => ['meadowPond','farBank','homePlot'].includes(o.map) || MAPS[o.map]))`), 'every reach objective names a real map (except the 3 special-cased: meadowPond, farBank, homePlot — longDark is gone, the cave maps exist now)');
check(T(`(function(){ const exp = { rokCity:['reach'], universityKids:['talk','drunkStudents'], corruption:['talk','bazaar'], flock:['talk','university'], fourthTournament:['enter','desertHeat'], fifthTournament:['enter','bazaarBrawl'], sixthTournament:['enter','frostCrown'], seventhTournament:['enter','universityGames'], eighthTournament:['enter','wastelandWar'], ninthTournament:['enter','rokCityChampionship'], tenthTournament:['enter','ancientCrown'], climbLesson:['talk'], smashLesson:['talk'], theChoice:['choice'], leak:['talk','bazaar'], indieAlliance:['pippa','merchant'], securityTeam:['secTrainer1','secTrainer2'], facility:['talk','facilityGuard'], exposure:['talk','merchant'], interview:['talk','university'], ladder:['talk','clerk'], quietFriendsPath:['talk','marcus'], dirtyWork:['resistanceFighter','talk'], executive:['talk','university'], dumpSite:['wreckyard','talk'], theEast:['reach'], theMutants:['catch'], theWreckyard:['wreckyard','talk'], theCave:['reach','mutantAlpha'], finalBattle:['finalBoss'], the75World:['reach'], sanctuary:['reach','talk'], mysterySpino:['reach','catch'], mysteryQuetz:['reach','catch'], mysteryTitan:['reach','catch'], mysteryMega:['reach','catch'], mysteryBat:['reach','catch'], wholeStory:['talk'] }; return Object.entries(exp).every(([id, ids]) => { const m = MISSIONS.find(x => x.id === id); return m && JSON.stringify(m.objectives.map(o => o.id)) === JSON.stringify(ids); }); })()`), 'all 38 pass-2 + pass-3 mission objective IDs match the engine/NPC wiring');
check(T(`MISSIONS.every(m => m.objectives.filter(o => o.type === 'talk').every(o => !o.npc || NPC_DIALOG[o.npc] || ['tv','sickAnimal','labLog'].includes(o.npc)))`), 'every talk objective names an NPC_DIALOG handler (or a pass-1 interactable object: tv, sickAnimal, labLog)');
check(T(`MISSIONS.every(m => m.objectives.filter(o => o.type === 'battle').every(o => ['drunkStudents','secTrainer1','secTrainer2','facilityGuard','resistanceFighter','mutantAlpha','finalBoss'].includes(o.trainer)))`), 'every battle objective names a known trainer id');
check(T(`(function(){ const m = MISSIONS.find(x => x.id === 'theMutants'); return m.objectives[0].type === 'catch' && m.objectives[0].count === 3 && m.objectives[0].mutant === true; })()`), 'theMutants = catch 3 mutant creatures');
check(T(`MISSIONS.filter(m => m.reward && m.reward.creature).every(m => DEX[m.reward.creature.dex] && (DEX[m.reward.creature.dex].stars === 3 || (m.id === 'tenthTournament' && m.reward.creature.dex === 'A02' && DEX[m.reward.creature.dex].stars === 4)))`), 'all mission creature gifts exist and are 3-star (except tenthTournament A02 Dire Wolf, 4-star gift-only)');
check(T(`MISSIONS.filter(m => m.reward && m.reward.creature2).every(m => DEX[m.reward.creature2.dex] && DEX[m.reward.creature2.dex].stars === 3)`), 'all mission creature2 gifts exist and are 3-star');
check(T(`(function(){ return MISSIONS.filter(m => m.objectives.some(o => o.type === 'catch' && o.dex)).every(m => m.objectives.filter(o => o.type === 'catch' && o.dex).every(o => DEX[o.dex])); })()`), 'every catch objective names a real dex entry (mystery M1-M5 included)');
check(T(`MISSIONS.every(m => !m.reward || !m.reward.items || Object.keys(m.reward.items).every(id => itemDef(id)))`), 'all mission reward items exist');
check(T(`Object.keys(TM_ITEMS).length === 9 && Object.values(TM_ITEMS).every(t => MOVES[t.move])`), 'TM_ITEMS = 9, every TM move exists in MOVES');
check(T(`Object.keys(ITEMS).length === 83`), 'ITEMS still = 83 (TMs are separate)');
check(T(`Object.entries(DEX).every(([k, d]) => !d.evo || !d.evo.item || itemIdByName(d.evo.item))`), 'all 5 item evolutions resolve to item ids');
check(T(`Object.entries(LEARNSETS).every(([k, ls]) => ls.every(e => e.move === 'sig' || MOVES[e.move]))`), 'all learnset moves exist in MOVES');
// 5. sprites on disk
// Ancients + mystery (A01-A15, M1-M5) need front/back creature sprites only:
// they have NO mutant forms (75-WORLD.md) and instinct is engine-guarded to
// main-world dex, so no instinct/mutant sprites exist for them.
const missing = [];
for (const k of T(`Object.keys(DEX)`)) {
  for (const s of ['front', 'back']) {
    // Pass 3 — resolve the real load path through creatureSprite(): ancients
    // live in assets/sprites/ancients/, mysteries in assets/sprites/mystery/,
    // main-world in assets/sprites/creatures/. Checking the literal
    // creatures/ path for A01/M1 was wrong — those files never live there.
    const p = T(`creatureSprite({dex:'${k}'}, ${s === 'front'})`);
    if (!fs.existsSync(p)) missing.push(k + '-' + s + ' (' + p + ')');
    if (/^[0-9]+$/.test(k)) {
      if (!fs.existsSync(`assets/sprites/instinct/${k}-instinct-${s}.png`)) missing.push(k + '-instinct-' + s);
      if (!fs.existsSync(`assets/sprites/mutant/${k}-mutant-${s}.png`)) missing.push(k + '-mutant-' + s);
    }
  }
}
check(missing.length === 0, 'all 93x2 creature + 93x2 instinct + 93x2 mutant sprites exist, plus 20x2 ancient/mystery creature sprites' + (missing.length ? ' MISSING: ' + missing.slice(0, 5).join(',') : ''));
const missingMega = [];
for (const k of T(`Object.keys(MEGA_FORMS)`)) {
  for (const s of ['front', 'back']) {
    if (!fs.existsSync(`assets/sprites/mega/${k}-mega-${s}.png`)) missingMega.push(k + '-mega-' + s);
  }
}
check(missingMega.length === 0, 'all 12x2 mega sprites exist' + (missingMega.length ? ' MISSING: ' + missingMega.join(',') : ''));
const missingItems = [];
for (const id of T(`Object.keys(ITEMS)`)) if (!fs.existsSync(T(`itemSprite('${id}')`))) missingItems.push(id);
for (const id of T(`Object.keys(TOOLS)`)) if (!fs.existsSync(T(`itemSprite('${id}')`))) missingItems.push('tool:' + id);
check(missingItems.length === 0, 'all item/tool sprites exist' + (missingItems.length ? ' MISSING: ' + missingItems.slice(0, 8).join(',') : ''));
for (const bg of ['title.png', 'title-city.png', 'battle-meadow.png', 'battle-woods.png', 'battle-oasis.png', 'battle-arena.png', 'battle-snow.png', 'battle-desert.png', 'battle-reef.png', 'battle-city.png', 'battle-wasteland.png', 'battle-wreckyard.png', 'battle-hollow.png', 'battle-cave.png']) check(fs.existsSync('assets/bg/' + bg), 'bg ' + bg);
check(fs.existsSync('assets/sprites/items/tm-disc.png'), 'tm-disc sprite');
for (const ch of ['kai-down.png', 'kai-up.png', 'kai-left.png', 'kai-right.png', 'kai-battle-back.png', 'marcus.png', 'sofia.png', 'caleb.png', 'mara.png']) check(fs.existsSync('assets/chars/' + ch), 'char ' + ch);
check(fs.existsSync('assets/map/world-map.png'), 'world map');

console.log('\n' + (errs.length ? 'FAILURES:\n- ' + errs.join('\n- ') : 'ALL CHECKS PASSED'));
process.exit(errs.length ? 1 : 0);
