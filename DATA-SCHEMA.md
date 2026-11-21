# Metamonsters v1 — Data Schema Spec

Build the game data files in `~/workspace/metamonsters-game/js/data/` from the design docs in
`~/workspace/pokemon-game-research/METAMONSTERS-*.md`. Read the docs yourself; this file defines the
EXACT file names, global names, and record shapes. Do not invent new shapes. Every value must come
from a doc, or from a rule written here (rules are marked RULE). No placeholders, no TODOs.

## Files to write (all plain JS, one global const each, no modules, no imports)

- `dex.js` → `const DEX`
- `moves.js` → `const MOVES, const CAT_CHART, const SENSE_CHART, const LEARNSETS, const STARTER_RARE`
- `items.js` → `const ITEMS`
- `missions.js` → `const MISSIONS`
- `tournaments.js` → `const TOURNAMENTS`
- `encounters.js` → `const ENCOUNTERS`

## dex.js — `const DEX`

Keyed by 3-digit dex string ("001".."090", "106".."108"). 93 main-world entries ONLY (no ancients,
no mystery — those are later passes). Every entry:

```js
"001": {
  dex: "001", id: 1, name: "Bear Cub", family: "Bear", stage: 1,
  category: "Mammal", sense: "Hearing",
  sig: "Thick hide",               // signature skill name, verbatim from dex doc
  evo: { level: 16, into: "002" }, // or { item: "Car Battery", into: "054" } for the 5 item evos
                                    // or null for final stage
  stars: 1,                        // per-stage stars from METAMONSTERS-STARS.md
  stats: { hp: 45, atk: 40, def: 55, spd: 30 },  // RULE: base stats (see below)
  sprite: "001",                   // matches assets/sprites/creatures/001-front.png
  desc: "one-line flavor from the dex doc (storyline hook / signature note)"
}
```

RULE — base stats (the dex doc gives NO stat numbers; derive them deterministically):
- Stage totals: stage 1 = 210, stage 2 = 320, stage 3 = 450. Ancient/mystery excluded.
- Archetype by family (assign every family one): tank, attacker, fast, balanced.
  tank: Bear, Crocodile, Snail, Crab, Axolotl, Toad. attacker: Lion, Tiger, Cobra, Komodo,
  Scorpion, Octopus, Tuna. fast: Wolf, Shark, Eagle, Owl, Bee, Butterfly, Spider, Shrimp, Squid.
  balanced: Penguin, Frog, Salmon, Eel, Ant, Tarantula, Lobster.
- Distribution (fractions of total): tank hp .32 atk .22 def .30 spd .16; attacker hp .24 atk .32
  def .20 spd .24; fast hp .22 atk .26 def .18 spd .34; balanced hp .26 atk .25 def .25 spd .24.
  Round to integers. HP is the base HP stat (not total HP — the engine computes max HP from it).
- Stars add +0 (1★), +5 (2★), +12 (3★) to EACH stat. (3★ are earned/stronger.)
- Instinct variants: same base stats, engine applies +15% atk/spd, -15% def at runtime. Do NOT
  bake instinct stats into dex.js.

Evolution: from METAMONSTERS-DEX.md exactly (level gates; 5 item evolutions: Eel→Electric Eel
Car Battery, Snail→Armored Snail Iron Ore, Crab→Steel Crab Scrap Metal, Frog→Poison Dart Frog
Herbs, Penguin→Emperor Penguin Cold Pack).

## moves.js

### `const MOVES` — keyed by id, every move from METAMONSTERS-MOVES.md

```js
"tackle": { id:"tackle", name:"Tackle", type:"Mammal", kind:"category", power:50,
            effect:null, desc:"A basic body slam." }
```

- kind: "category" | "sense". type: the category or sense name.
- power: number, or null for status moves.
- effect: one of null | {stat:"atk"|"def"|"spd"|"acc"|"eva", stages:-1|1, target:"foe"|"self"}
  | {status:"poison"|"burn"|"sleep"|"paralysis", chance:0.3} | {heal:...} — keep ONLY effects the
  doc actually states (e.g. Roar → {stat:"atk", stages:-1, target:"foe"}; Venom Bite →
  {status:"poison", chance:0.3}; Camouflage → {stat:"eva", stages:1, target:"self"}).
  Moves whose doc effect is vague ("Traps the foe", "Digs underground, dodges, then strikes",
  "Blocks sound moves", "Hits through evasion", "Never misses", "High crit chance",
  "Your next attack never misses") → use effect: {special:"trap"} / {special:"dig"} /
  {special:"soundblock"} / {special:"pierce"} / {special:"alwaysHit"} / {special:"highCrit"} /
  {special:"sureHitNext"} respectively. The engine implements those special tags.
- Include ALL: 36 category moves + 28 sense moves + 8 HMs + 14 SMs + 6 X moves + 3 starter
  rare moves. TM numbers: keep the doc's TM01–TM20 labels in a `tm` field where the doc gives
  one (e.g. Bite tm:"TM01").
- Signature skills are NOT in MOVES — they become moves via LEARNSETS (below).

### `const CAT_CHART` and `const SENSE_CHART`

Nested maps from METAMONSTERS-BATTLE-SYSTEM.md, exactly as written. Default 1.
```js
const CAT_CHART = { "Mammal": { "Bird": 2, "Fish": 2, "Reptile": 0.5, "Arachnid": 0.5 }, ... };
const SENSE_CHART = { "Sight": { "Hearing": 2, "Echolocation": 2, "Electroreception": 0.5, "Touch": 0.5 }, ... };
```
Include all 9 categories and all 7 senses, with every strong/weak entry from the doc.

### `const LEARNSETS` — keyed by dex string

Every creature's 4 moves: signature + 3 learned. Shape:
```js
"001": [
  { move:"sig", level:1 },                          // signature skill as move 1
  { move:"tackle", level:5 },
  { move:"echoBlast", level:10 },                   // sense move of its own sense
  { move:"clawSlash", level:15 }
]
```
RULES:
- Slot 1 is ALWAYS {move:"sig", level:1}. The engine builds the signature move from the dex
  entry's `sig` name using this rule: if the signature name implies an attack (contains Bite,
  Venom, Sting, Strike, Charge, Slam, Fang, Claw, Punch, Shock, Blast, Breath, Roar-as-attack…)
  → power 65, kind "category", type = creature's category, effect null; if it implies defense
  or utility (Hide, Camouflage, Climbing, Swimming, Scent tracking, Regeneration, Huddling,
  Pheromone…) → power null, effect {stat:"def", stages:1, target:"self"} for defensive ones,
  {special:"alwaysHit"} for tracking ones, {special:"heal25"} for regeneration ones. Keep a
  per-signature override table in the file (`SIG_MOVES`) with the resolved move for EVERY
  signature in the dex — no signature left unresolved.
- Slot 2: a damaging category move of the creature's own category (from the 4 in its category
  pool), level 5. Slot 3: a damaging sense move of the creature's own sense (from its sense
  pool), level 10. Slot 4: a second damaging category move of its own category, level 15.
- Use the doc's real move names/ids. If a category pool has no damaging move left, fall back
  to the other damaging move in that pool (re-use is fine, levels differ).
- Starter rare moves (Grizzly's Rage, Alpha's Command, Great White Terror): add as a 5th
  learnset entry at level 36/38 (the final-evolution level) for #003, #006, #045 only, and
  record them in `const STARTER_RARE = {"003":"grizzlysRage","006":"alphasCommand","045":"greatWhiteTerror"}`.

## items.js — `const ITEMS`

All 83 items from METAMONSTERS-ITEMS.md, keyed by slug id. Shape:
```js
"net": { id:"net", name:"Net", cat:"Catching", price:100, desc:"Basic catching tool, used on small creatures.",
         use:"catch", catchMod:1.0 }
```
- cat: the doc's category (Healing & Medicine / Food & Drink / Catching / Materials /
  Gear & Clothing / Transport & Upgrades / Battle & Performance / Key Items / Money).
- price: RULE — the doc gives NO prices (except bicycle 50 / car 5000, which are transport,
  not items). Use: healing small 50, healing large 150, food 10–60 by size, catching
  net 100 / trap 150 / cage 300 / snare 80 / lasso 120 / tranquilizer darts 200 / bait 20 /
  whistle 60, materials 5–80 by rarity (wood 5, stone 5, iron ore 40, copper ore 30,
  plant fiber 5, leather 60, hide 30, herbs 15, clay 10, scrap metal 25, nails 10,
  string 5, feathers 15, bones 20), gear 100–400, transport parts 50–500
  (gasoline 40, car battery 500, engine parts 300, oil 60, tire 120, spare parts 80,
  fuel can 100, bicycle parts 150), battle items 80–200 (adrenaline shot 150, flare 80,
  smoke bomb 120, pepper spray 100, energy drink 60, protein bar 40, air horn 90,
  bear spray 130, Chemical X 5000 — rare, not stocked in normal shops), key items
  price 0 (not sold), cash/coins price 0.
- use: "heal" (with heal: 20|50|full-status etc.), "catch" (catchMod), "cure" (cures:"poison"|
  "burn"|"sleep"|"paralysis"|"infection"|"bleeding"|"crippled"|"bruised"|"fainted"),
  "battle" (battle effect), "evo" (for Car Battery / Iron Ore / Scrap Metal / Herbs / Cold Pack —
  mark use:"evo" and evoFor:"054" etc.), "material" (crafting only, use:null), "key" (use:null),
  "food" (heal small out of battle). Map each item to the doc's stated game use; healing
  amounts RULE: Bandage 20, First aid kit 80, Gauze 15 + cure bleeding, Tweezers cure poison,
  Antiseptic cure infection, Antibiotics cure infection, Splint cure crippled, Cold pack cure
  bruised, Smelling salts cure fainted, Painkillers 10 + cure pain (treat as cure burn? no —
  Painkillers: heal 10, no status), Herbal salve heal 30 over time (treat as heal 30),
  Saline solution heal 10, food heals 5–30 by item.
- Cash is currency, not an inventory item: do NOT include "cash"/"coins" as usable items;
  include them with use:null and price:0 for completeness.

## missions.js — `const MISSIONS`

Phase 1 main story missions from METAMONSTERS-STORY-MISSIONS.md, in order, plus the three
starter missions. Shape:
```js
{ id:"lastStarter", phase:1, name:"The Last Starter",
  desc:"Meet Marcus and Sofia, watch them pick first, take the remaining starter.",
  objectives:[ {id:"meet", text:"Meet Marcus and Sofia at the village square", type:"talk", npc:"marcus"},
               {id:"pick", text:"Take the remaining starter", type:"starter"} ],
  reward:{ cash:0, items:{}, xp:250, unlock:"catching" },
  next:"firstWood" }
```
- Missions: lastStarter, firstWood (collect 10 wood), firstCatch (catch 1 wild creature),
  firstBase (build a base — needs 10 wood, at home plot), starterPath (per-starter variant:
  bear "Learn to Hunt", wolf "Follow the Scent", shark "Cross the Water" — three entries
  with starter:"bear"|"wolf"|"shark"), firstTournament (win the Rookie Cup).
- Objective types: "talk" (npc id), "starter", "gather" (item, count), "catch" (count),
  "build" (what), "battle" (trainer id), "tournament" (id), "reach" (map id).
- Rewards: use the doc's XP table (main mission = 250 XP at band 1–5, applied to each party
  creature — engine handles it). firstTournament reward: 500 cash, 3 nets, 1 trap, unlock HM SLICE.

## tournaments.js — `const TOURNAMENTS`

The Rookie Cup ONLY (tournament 1 — v1 capstone). Shape:
```js
{ id:"rookieCup", name:"The Rookie Cup", levels:[1,5], location:"The Mirage Oasis", theme:"Beginners",
  rounds:3, size:8,
  trainers:[
    { id:"qf1", name:"Pip", round:"quarterfinal", team:[{dex:"055", level:3},{dex:"061", level:3}],
      intro:"...", lose:"..." },
    ... 7 trainers: qf1..qf4 (levels 2–3), sf1, sf2 (levels 3–4), final Marcus (levels 4–5)
  ],
  finalId:"marcus",
  reward:{ cash:500, items:{ net:3, trap:1 }, unlock:"HM SLICE" },
  crowd:["The crowd roars!", "A big cheer goes up!", "Gasps from the stands!", ...] }
```
- Trainer teams use REAL dex entries with levels in range. Marcus's team: his starter (the one
  he picked — engine picks it from the starter logic) at level 5 + one wild creature level 4.
- Write real intro/lose dialogue for all 8 trainers (short, in-world, no filler).
- Crowd lines: at least 8 distinct reactions.

## encounters.js — `const ENCOUNTERS`

Wild encounter tables for the v1 maps. Shape:
```js
{ "meadow": { name:"Meadow Route", levels:[2,5],
    table:[ {dex:"055", weight:20}, {dex:"061", weight:20}, {dex:"058", weight:15},
            {dex:"079", weight:10}, {dex:"034", weight:15}, {dex:"001", weight:5} ],
    instinctRate: 1/400 },
  "woods": {...}, "oasis": {...} }
```
- Areas: "meadow" (Meadow Route — Ant/Bee/Butterfly/Shrimp/Frog families + rare Bear/Wolf cubs),
  "woods" (Whispering Woods edge — Owl, Butterfly, Spider, Caterpillar, Eaglet; levels 3–6),
  "oasis" (Mirage Oasis outskirts — Frog, Toad, Tadpole, Crocodile hatchling; levels 4–6).
- Only 1–2 star species (per METAMONSTERS-STARS.md) may appear wild. No starters except the
  rare cub entries in meadow (weight 5 each, bear cub + wolf cub). No shark (water only —
  shark starter only).
- instincts: instinctRate 1/400 normal. The engine handles the roll.

## Rules for all files

- Plain JS, `const` declarations, no modules, no imports, no external URLs.
- Names, typings, evolutions, moves, items, prices (per the RULES above), missions, and
  tournament data must match the docs. If a doc contradicts itself, follow the LATER-dated
  decision and note it in a comment at the top of the file.
- Verify at the end: count check (93 dex, 36+28+8+14+6+3 moves, 83 items, 6 Phase-1 missions
  + 3 starter missions, 8 Rookie Cup trainers, 3 encounter areas) and write the counts as a
  comment at the top of each file. If any count is off, fix it — do not ship a short file.

## Revision Pass 1 (2026-11-20) — what changed, and the new shapes

Pass 1 upgrades v1 in place. New counts: 20 missions, 3 tournaments (24 trainers),
15 encounter areas, 20 maps, 2 TM items (separate from the 83), 8 battle backgrounds.

- **Save v2**: `SAVE_KEY = 'metamonsters_save_v2'`, `SAVE_VERSION = 2`. Old v1 saves are
  ignored (fresh start). `G.flags.visited` (map id -> true) is new and is saved.
- **Starter choice**: the player picks which starter is left for Kai (UI.choice in ui.js).
  `assignStarters(kaiFam)` (engine.js) sets `G.flags.starter / marcusStarter / sofiaStarter`
  (rotation bear -> wolf -> shark; Marcus takes the next, Sofia the last).
  `friendStarterDex('marcus'|'sofia')` gives the dex id; TournamentFlow replaces the final
  trainer's first team slot with it. `starterDisplayName(fam)` for dialog.
- **Missions**: chain now runs lastStarter -> firstWood -> firstCatch -> firstBase ->
  starterPath -> (starterPathBear|Wolf|Shark) -> firstTournament -> foreclosure -> lawsuitTV
  -> peopleTalking -> smallShops -> sickAnimals -> quietFriendLeaves -> secondTournament ->
  thirdTournament -> labLog -> coldNorth -> coast. `completeMission('starterPath')` hands off
  to the variant matching Kai's starter (engine.js, not hardcoded shark).
  `setMission` auto-completes reach objectives for maps already in `G.flags.visited`.
  `changeMap` completes reach objectives on entry (generalized from the old oasis-only line).
  `completeCatchObjectives()` (engine.js) completes the active mission's catch objectives on
  any catch (finishCatch calls it).
- **Tournaments**: forestClash (levels 5-10, Whispering Woods, final Sofia, reward 1500 cash /
  5 traps / TM Bite, unlock antColony) and reefRumble (levels 10-20, Coral Reef, final The
  Reef Champion, reward 5000 cash / 1 cage / TM Water Jet, unlock HM SWIM). Same record shape
  as rookieCup. `TournamentFlow.start(cupId)` / `battleRound()` / `afterWin()` are cup-generic;
  champion flags are `G.flags[cup.id + 'Champion']` (rookieCup also sets legacy `champion`).
  Arena bg per cup: rookieCup battle-arena, forestClash battle-woods, reefRumble battle-reef.
- **TM_ITEMS** (items.js, NOT part of the 83): `{ tmBite: {use:'tm', move:'bite'}, tmWaterJet:
  {use:'tm', move:'waterJet'} }`. `itemDef` and `itemSprite` resolve them (tm-disc.png).
  Tournament rewards only — never in SHOP_STOCK. `UI.useBagItem` (use 'tm') opens the party
  picker, `UI.teachMove` teaches (signature slot protected) and consumes the TM.
- **Encounters**: 12 new areas, same shape, tables sum to weight 100, stage 1-2 species only.
  `AREA_BATTLE` (battle.js) maps every encounter area to a bg + weather:
  snow areas battle-snow/snow, desert battle-desert/sand, reef/tidepools battle-reef/spray,
  butterfly battle-reef/petals, deepTrench battle-reef/bubbles, mangrove battle-woods/rain,
  meadow/woods battle-meadow|woods/petals, oasis battle-oasis/sand.
- **Maps** (tiles.js): 12 new outdoor maps + forestArena + reefArena interiors. New tile
  types snow/ice/dune (walkable). New object types snowtree/cactus/coral/snowrock/sandstone/
  tv/lablog/sick. `map.atmosphere` (snow|sand|petals|spray|bubbles|rain) drives particles in
  renderOverworld; day/night tint from `G.timeMin`; map-change fade via `OW.fadeUntil`.
  `walkable`: deep water needs `canCrossWater()` (HM SWIM or shark starter); pond needs any
  Fish creature. Bicycle: `G.flags.hasBicycle / ridingBike / bikeUpgrades {tires, frame,
  basket, headlight}`; speed 330 (380 with frame), 165 on sand/snow/ice without tires,
  165 at night without headlight; basket +1 on tree/berry gathers; interiors dismount.
- **Battle presentation** (battle.js): `BT.weather` particles; damage popups colored by
  crit (gold, bigger) / super-effective (green) / resisted (pink); HP bars gained an XP bar
  (player side) and a status chip.
- **UI** (ui.js): `UI.choice`; missions panel lists objectives with ✓/○; badge shows all
  three champion titles + maps visited; party rows show an XP bar; base menu has the Garage
  (buy bicycle 50 cash, ride toggle, 4 upgrades); shop takes a seller ('hub' | 'pippa').
- **CSS/HTML**: title logo float + bg slow zoom, panel/dialog entrance animations,
  title foot "Revision Pass 1". main.js preloads the 3 new battle bgs.

## Revision Pass 2 (2026-11-20) — what changed, and the new shapes

Pass 2 upgrades pass 1 in place. New counts: 47 missions, 7 tournaments (80 trainers),
23 encounter areas, 32 maps, 6 TM items, 12 battle backgrounds, 9 char sprites.
Save format stays v2 (compatible — new flags default false/empty on old saves).

- **Mutants** (`js/data/mutants.js`, new file): `MUTANT_NAMES` (93 dex -> mutant name,
  e.g. 004 -> '2H Wolf Cub') + `MEGA_FORMS` (12 dex -> mega name). Loaded after
  encounters.js, before engine.js; boot-checked in main.js. `makeCreature(dex, lvl,
  { mutant: true })` sets `form: 'mutant'`, `mutant: true`, name from MUTANT_NAMES.
  `creatureStats` mutant param: +20% atk, +15% hp. `creatureSprite` checks mega ->
  mutant -> instinct -> normal; mutant art lives in `assets/sprites/mutant/<dex>-mutant-front|back.png`
  (186 files), mega art in `assets/sprites/mega/<dex>-mega-front|back.png` (24 files).
  Mutants are wild ONLY in the east (rustFields, ashenFlats, wreckyard, hollow all-mutant;
  echoCaves mixed) and ONLY after `G.flags.unlock_mutants` (set when The Dump Site
  activates); before the unlock the same animal appears normal. Catch rate x0.6 for
  mutants, x1.3 for mutants on the Fight path. A creature is normal, Instinct, OR
  Mutant — never stacked. Serialize/deserialize carry `mutant`.
- **Mega Evolution** (battle.js): `BT.megaUsed` per battle; the battle menu shows a MEGA
  button only when the active creature is one of the 12 MEGA_FORMS, Chemical X is in the
  bag, and no Mega has been used yet this battle. `doMegaEvolve()` consumes 1 Chemical X,
  sets `c.mega = true`, +30% atk/def/spd, +20% hp for the battle; 10% berserk chance —
  a berserk creature picks a random move and has a 25% self-hit. `unmegaParty()` at battle
  end restores the party (Mega lasts one battle only). HP bar shows ★MEGA / ★M / ★I.
- **Missions**: chain now runs ... -> coast -> rokCity -> universityKids -> corruption ->
  flock -> fourthTournament -> fifthTournament -> sixthTournament -> seventhTournament ->
  theChoice -> (fight: leak -> indieAlliance -> securityTeam -> facility -> exposure) OR
  (join: interview -> ladder -> quietFriendsPath -> dirtyWork -> executive) -> dumpSite ->
  theEast -> theMutants -> theWreckyard -> theCave -> finalBattle (end). the75World +
  sanctuary are phase-4 entries (reach map 'longDark', which does not exist until pass 3)
  and are NOT in the chain. New mission fields: `reward.creature { dex, level, mutant? }`
  (gift to party or storage), `reward.rank` (corp rank 1-5, Join path). `reward.unlock`
  may be a string OR an array (completeMission handles both). New objective types:
  `choice` (theChoice — offerChoice() presents Mara vs Caleb), `battle` (trainer id in
  `o.trainer`: drunkStudents, secTrainer1, secTrainer2, facilityGuard, resistanceFighter,
  mutantAlpha, finalBoss — all wired in ui.js/tiles.js with `battleTag`), `catch` with
  `count` + `mutant: true` (theMutants: catch 3 mutants; progress counted in
  `G.missions[id].progress`, persisted via save). `setMission` sets `unlock_east` when
  dumpSite activates; `completeMission` forks theChoice by `G.flags.path` (leak or
  interview). Mission `phase` 3 = Rok City, 4 = locked pass-3 entries.
- **The Choice** (ui.js): `offerChoice()` — Mara (fight) vs Caleb (join); sets
  `G.flags.path` before completing the 'choice' objective. `switchPath()` — one-time
  reconsider from the menu while a path mission is active: abandons the active path
  mission (`abandoned: true`, shown ABANDONED in the missions panel), sets
  `hostile_<oldPath>`, activates leak or interview. Old side permanently hostile:
  Mara refuses to talk when `hostile_fight`; Rok Plaza refuses service on the Fight
  path; bazaar stalls refuse when `hostile_fight` and charge 1.5x on the Join path
  (0.8x on the Fight path). Marcus stays loyal either way; Sofia follows Marcus;
  Caleb is the fork. Path-exclusive gifts: 2H Alpha Wolf (Fight, exposure reward),
  M. Alpha Lion (Join, executive reward).
- **Tournaments 4-7** (tournaments.js): desertHeat (Lv 20-30, Ember Dunes, 3 rounds,
  8 trainers, final The Sand King, 15000 cash / 1 first aid kit / TM Fire Breath, unlock
  scorpionsNest), bazaarBrawl (Lv 30-40, Grand Bazaar, 4 rounds, 16 trainers, final The
  Bazaar Boss, 30000 / 1 snare / TM Electric Shock / 3-star Reticulated Python Lv35,
  unlock HM SOAR), frostCrown (Lv 40-50, Frozen Roost, 4 rounds, 16 trainers, final The
  Frost Queen, 60000 / 2 cold packs / TM Flash, unlock iceLake), universityGames (Lv 50-60,
  Ivory Tower, 4 rounds, 16 trainers, final Caleb, 100000 / TM Sonic Scream / 3-star
  Alpha Lion Lv55, unlock rokCity). Trainer record gains a `round` field
  ('round16' | 'quarterfinal' | 'semifinal' | 'final'). `TournamentFlow` now builds its
  path by round field (4 battles for 4-round cups, 3 for 3-round); `roundLabel()` names
  rounds; `afterWin()` maps all 7 cups to their missions and champion lines. Cup rewards
  live in BOTH the cup and its mission (cup for the arenamaster pitch + unlock flag;
  mission for the payout); creature gifts ONLY in missions. Arena bg per cup:
  desertHeat battle-desert, bazaarBrawl battle-city, frostCrown battle-snow,
  universityGames battle-city. TM substitutes (doc moves that do not exist): Frost Crown
  TM Focus Beam -> TM Flash (TM14); University Games TM Lightning Strike -> TM Sonic
  Scream (TM15). TM_ITEMS now 6 entries (tmBite, tmWaterJet, tmFireBreath TM19,
  tmElectricShock TM18, tmFlash TM14, tmSonicScream TM15).
- **Maps** (tiles.js): 12 new maps — rokCity (30x20, citypave, towers, plaza, bazaar +
  university doors, streetlights, neon atmosphere), bazaar (16x12, stalls), university
  (24x18, Ivory Tower), rustFields / ashenFlats / wreckyard / hollow / echoCaves (26x18
  each, `locked: 'unlock_east'` — changeMap blocks entry with a dialog until the east
  unlocks), plus 4 arenas via `arenaMap()` (emberArena, bazaarArena, frostArena,
  universityArena). New tile types citypave/rust/ash/wreck/cavefloor (walkable). New
  object types tower/barrel/gate/stall/web/crystal/scrap/streetlight/dumpster. Haven gains
  a west exit (0,9) -> rokCity; antColony gains an east exit (25,9) -> rustFields (gated);
  ember + frozen gain arena buildings with door exits. The Long Dark gate object sits at
  echoCaves (12,2): with theCave active it starts the Lv80 mutant alpha battle
  (`battleTag: 'mutantAlpha'`); after theCave is done it says sealed until pass 3.
  `changeMap` moves Caleb out of haven when Kai first reaches Rok City (`calebMoved`).
- **Encounters**: 8 new areas (rokCity Lv 20-30, bazaar Lv 22-32, university Lv 25-35,
  rustFields Lv 40-55, ashenFlats Lv 45-60, wreckyard Lv 50-65, hollow Lv 50-65,
  echoCaves Lv 55-70). East mutant tables are the endgame exception to the 1-2 star
  wild rule (any stage, stage-3 at low weight). `AREA_BATTLE` gains rokCity/bazaar/
  university (battle-city, neon/petals), rustFields/ashenFlats (battle-wasteland, ash),
  wreckyard (battle-wreckyard, rain), hollow (battle-hollow, spores), echoCaves
  (battle-cave, spores). New weather renderers: neon (pink/cyan/gold sparks), ash
  (grey flakes), spores (glowing dots rising).
- **Transport** (ui.js + engine.js): car — buy 5000 cash at the garage; `G.flags.hasCar /
  carFuel / carTrips / carUpgrades {engine, tank, offroad, trunk, armor, paint}`;
  refuel 1 gasoline -> 1 fuel unit (2 with better engine); `carFuelMax()` 5 (10 with
  bigger tank); `carReady()` needs hasCar + carBattery in bag; oil consumed every 5th
  trip. 6 upgrades: Better Engine (1 engineParts + 500), Bigger Fuel Tank (2 scrapMetal
  + 300), Off-road Tires (2 tires + 400), Bigger Trunk (3 wood + 2 scrapMetal + 200),
  Armor Plating (5 scrapMetal + 800), Paint Job (2 scrapMetal + 150 — no paint item in
  the 83). Flying: `canFly()` needs `unlock_hmSOAR` (or unlock_HM_SOAR) + a Bird creature
  in the party (`partyBird()`); instant travel to visited towns, free. `openTravelMenu()`
  + `travelTo(mapId, mode)`; destinations = visited outdoor maps. Car trips to the east
  without armor have a 25% mutant ambush. Uber/Waymo are NOT in pass 2.
- **NPCs** (ui.js): new handlers cityGuide, plazaClerk, flockOfficer, streetDealer,
  universityStudent (starts drunkStudents battle), mara (theChoice, leak, securityTeam
  x2 battles, facility + guard battle, exposure, finalBattle fight boss, dumpSite hint;
  refuses when hostile_fight), bazaarMerchant, dumpWarden, wreckyardScavenger,
  exileScout, caveGuide, rustFarmer, ashNomad, hollowKeeper. `caleb` extended: theChoice
  offer, interview/ladder/quietFriendsPath/dirtyWork/executive talk objectives,
  finalBattle join boss (Resistance Leader). `marcus` extended: quietFriendsPath
  objective + phase-3/endgame hints for every pass-2 mission. `pippa` extended:
  indieAlliance objective. `arenamaster` rewritten: cup map for all 7 arenas, mission
  map for all 7 tournament missions, trainer-count text from `cup.size`, champion
  next-cup hints, unlock display names. NOTE: two different people named Mara — Elder
  Mara (Haven elder, NPC `elder`) and Mara (Rok City bazaar shop owner, resistance
  leader, NPC `mara`, sprite `assets/chars/mara.png`); the docs never say they are the
  same person.
- **Shops** (ui.js): `openShop` gains sellers 'plaza' (Rok Plaza, full stock; refuses
  when path is fight) and 'bazaar' (indie stock; 0.8x prices on fight path, 1.5x on join
  path; refuses when hostile_fight). Sell handler now reopens the same seller (was
  reopening hub). Chemical X is buyable in shops (price 5000) despite its desc saying
  "not stocked in normal shops" — preserved pass-1 behavior.
- **UI** (ui.js): menu gains "Travel (Car / Fly)" and a one-time "Reconsider your side"
  button (visible only while a path mission is active and not yet switched). Missions
  panel gains a path banner + ABANDONED label. Badge gains cup 4-7 titles, corp-rank
  line, car/bicycle lines. Party rows + creature panel show (Mutant) / (Mega) tags.
  World map text updated for Rok City + east.
- **CSS/HTML**: title bg is now `assets/bg/title-city.png` (Rok City skyline); title
  foot "Revision Pass 2". main.js preloads the 5 new battle bgs + mara.png + title-city.
- **Spec tensions resolved in pass 2** (flagged in the receipt): (a) the story doc's
  "The City Tournament" IS the Bazaar Brawl (mission fifthTournament, titled so);
  (b) Rok City is walkable from Haven from the start — the University Games "unlocks
  Rok City" is a ceremonial flag only; (c) two Maras, kept separate; (d) HM LIGHT /
  DIVE / CLIMB / SMASH have no assigned unlocks in any doc — left for pass 3 (only the
  cave gate is reachable); (e) TM Focus Beam / TM Lightning Strike do not exist as
  moves — substituted TM Flash / TM Sonic Scream; (f) Chemical X in shops preserved.

## Revision Pass 3 (2026-11-20/21) — FINAL. What changed, and the new shapes

Pass 3 finishes the game. New counts: 59 maps, 10 tournaments (112 trainers),
40 encounter areas, 15 ancient creatures + 5 mystery creatures (DEX = 113),
9 TM items, 16 battle backgrounds, 17 backend tables, 13 hub tabs.
Save format stays v2 (compatible — new flags default false/empty on old saves).

- **Ancients** (`js/data/ancients.js`, new file): `ANCIENT_DEX` (A01-A15, all stage 3,
  no evolutions; 5-star A01/A03/A04/A06/A10, 4-star the other ten; stat totals 520
  for 4-star, 580 for 5-star) + `MYSTERY_DEX` (M1-M5, all 5-star, stat total 600) +
  `ANCIENT_LEARNSETS` (20 entries: A01-A15 + M1-M5) + `ANCIENT_SIG_MOVES` (keyed by
  signature name, same shape as SIG_MOVES). Loaded after mutants.js, before engine.js;
  boot-checked in main.js. At load it merges into `DEX` / `LEARNSETS` / `SIG_MOVES`
  (DEX = 93 main + 15 ancient + 5 mystery = 113). Ancient archetype stats: tank /
  attacker / fast per creature (Mammoth tank, Dire Wolf fast, Saber-Toothed Tiger
  attacker, Pterodactyl fast, Archaeopteryx fast, T. Rex attacker, Triceratops tank,
  Velociraptor fast, Beelzebufo tank, Megalodon attacker, Dunkleosteus tank, Meganeura
  fast, Megarachne attacker, Jaekelopterus tank, Ammonite tank; mystery: Spinosaurus
  attacker, Quetzalcoatlus fast, Titanoboa attacker, Megatherium tank, Giant Vampire
  Bat fast). `creatureSprite` checks mega -> mutant -> ancient (`assets/sprites/
  ancients/<sprite>-front|back.png`, sprite field e.g. "a01") -> mystery
  (`assets/sprites/mystery/<sprite>-front|back.png`, e.g. "spinosaurus") -> instinct
  -> normal. Ancients have NO mutant forms and NO instinct art: `startWildBattle`
  only rolls instinct for main-world dex (`/^\d{3}$/`). Ancient catch rule: ancients
  are stage 3, so net (maxStage 1), cage (2) and lasso (2) cannot hold them — only
  trap / snare / tranquilizer (no maxStage) can. Ancient type-chart rule: `baseType()`
  in battle.js strips the "Ancient " prefix for chart lookups (ancients fight on their
  base category's chart); ancient moves are typed with the ancient category name so
  STAB matches; base-category moves get STAB via the same normalization.
- **HM assignments** (no doc assigns them — assigned here, sensibly): HM LIGHT =
  Wasteland War (tournament 8) reward; HM DIVE = Rok City Championship (tournament 9)
  reward; HM CLIMB = climbLesson (side mission: talk to the Cave Guide once theCave
  is done); HM SMASH = smashLesson (side mission: talk to the Hollow Keeper once
  theEast is done). Reward unlocks set `G.flags.unlock_HM_LIGHT` etc. via the normal
  `reward.unlock` path (`completeMission` slugifies the unlock name).
- **The Long Dark / 75+ world** (tiles.js): the Echo Caves gate object (`longDarkGate`)
  now opens: with theCave active it still starts the Lv80 mutant alpha battle; with
  theCave done it checks `partyMaxLevel() >= 60` (the Mouth eats teams under 60) and
  enters caveMouth (13,16). Cave zones: caveMouth (Lv 60-70 mutants, no HM gate),
  caveDeep (`requires: ['unlock_HM_LIGHT', 'unlock_HM_DIVE']`), caveGate (`requires:
  ['unlock_HM_CLIMB', 'unlock_HM_SMASH']`). `changeMap` enforces `dest.requires`
  (array of flag names; blocked crossing names what's missing and where it comes from).
  The exit gate at the end of caveGate is an exit tile with `requires:
  'unlock_longDarkExit'`; `onStepTile` enforces exit.requires the same way. The
  exit-gate object (`exitGate`, type 'gate') explains the seal when locked. Cave exit
  leads to rexBadlands (center badlands). 14 ancient places + Sanctuary + 3 cave zones
  + 3 arenas + hubUpper = 27 new maps (59 total). The 75+ world graph: caveMouth ->
  caveDeep -> caveGate -> rexBadlands; rexBadlands connects N hornedPlains, S
  saberFields, E raptorGrass, W caveGate, W-edge (0,4) pteroCliffs, caveMouth object
  (20,4) -> darkCaves; hornedPlains N mammothSteppe, E direDen; mammothSteppe E
  direDen, S hornedPlains; direDen W mammothSteppe, S hornedPlains; raptorGrass E
  burningMarsh, S saberFields; saberFields S deepRiver, W sanctuary; sanctuary N
  rexBadlands, E saberFields; deepRiver E megalodonDeep; megalodonDeep E armoredReef;
  armoredReef E seaScorpion; seaScorpion E spiralShoals; pteroCliffs N highPeaks, S
  giantsCanopy, E rexBadlands; highPeaks S pteroCliffs; giantsCanopy S spidersHollow,
  W deepForest; spidersHollow S saberFields; deepForest E giantsCanopy; burningMarsh
  E devilsPond; devilsPond W burningMarsh; darkCaves N exit back to rexBadlands (20,5).
  New tiles: ancientGrass, badlands, fossil, canopyFloor, darkfloor, tar (all walkable).
  New object types: bone, fossil, giantTree, tarPit, tent, campfire, stairs, terminal,
  mysterySign, caveMouth, sanctuaryPlot. New atmosphere kinds: embers (Burning Marsh),
  fireflies (canopy / deep forest). The Sanctuary is neutral ground: tents, campfire
  (rest = heal + new day, like the base rest), healing machine, exileTrader (sanctuary
  shop, 2x prices), sanctuaryPlot (Sanctuary camp base: build with wood 10, rest there).
- **Mystery hunts** (battle.js + tiles.js): `MYSTERY_HUNTS` (M1 Lv80, M2 Lv82, M3 Lv88,
  M4 Lv84, M5 Lv86). Each hideout has a `mysterySign` object; reading it checks:
  already caught (`G.flags['caught_' + id]`) -> done dialog; fled today
  (`G.flags['mystery_' + id + '_day'] === G.day`) -> come back tomorrow; M1 dusk only
  (17:00-20:00 via `hourOfDay()`); M2 dawn only (05:00-08:00); M3 needs a Lv85+ team
  (`partyMaxLevel()`) AND a Heat-sense creature in party (`hasSense('Heat')`); M4
  needs 3 berries in the bag (consumed — the fruit trail); M5 no condition (listen in
  the dark; HM LIGHT does not help). `startMysteryBattle(id)` builds the foe from
  MYSTERY_DEX, sets `BT.mystery`. Mystery flee: 8% per turn in `endTurnTicks` (after
  faint checks); `endBattle('fled')` sets the fled-day flag. `finishCatch` sets the
  caught flag, `event_ancient`, `caughtAncient`, and `mysteriesFound` (count of
  caught_M1..M5); catching any Fish sets `event_megalodon`. Mystery creatures are
  NOT random encounters (no encounter areas for the 5 hideouts or the Sanctuary).
- **Tournaments 8-10** (tournaments.js): wastelandWar (Lv 60-75, Rust Fields, 16
  trainers, mutants only, final Wasteland King, 200000 cash / 1 Chemical X / TM
  Tremor TM20 / 3-star M. Grizzly Lv70, unlock HM LIGHT), rokCityChampionship (Lv
  75-90, Rok City, 16 trainers, final Corporate Champion, 400000 / 2 Chemical X / TM
  Molten Strike / 3-star Great White Shark Lv85, unlock HM DIVE), ancientCrown (Lv
  90-100, Echo Caves, 32 trainers, final Ancient Keeper with all-ancient team,
  500000 / 3 Chemical X / TM Pressure Point / 4-star A02 Dire Wolf Lv90 + 3-star
  003 Grizzly Lv92, unlock longDarkExit). `TournamentFlow` now builds its path by
  round field with 'round32' first (5 battles for 32-trainer cups, 4 for 16-trainer);
  `roundLabel()` names all 5 rounds. New `reward.creature2` field on missions —
  `completeMission` pays it with the same party/storage rule as `creature`. Cup
  rewards live in BOTH the cup and its mission (self-check enforces cash + items +
  unlock match). Arena bgs: wastelandWar battle-wasteland, rokCityChampionship
  battle-city, ancientCrown battle-cave. Arena buildings + door exits added to the
  existing maps: rustFields (17,13) -> rustArena, rokCity (24,5) -> cityArena,
  echoCaves (4,12) -> caveArena. `arenamaster` cupMap/missionMap/unlockName/nextHints
  cover all 10 cups; the pitch mentions creature gifts when present.
- **Missions**: chain now runs ... -> finalBattle -> eighthTournament ->
  ninthTournament -> tenthTournament -> the75World -> sanctuary -> mysterySpino ->
  mysteryQuetz -> mysteryTitan -> mysteryMega -> mysteryBat -> wholeStory (end,
  `next: null`). the75World: reach rexBadlands. sanctuary: reach Sanctuary + talk
  exileLeader. Mystery missions: reach the hideout + catch the creature. wholeStory:
  talk exileLeader (the whole truth about Chemical X). climbLesson + smashLesson are
  side missions (single 'talk' objective each; the NPC handler completes all of the
  mission's objectives on the lesson talk, with a direct flag fallback if the mission
  def is missing). Mission count is now 38 in the objective-ID map (the self-check
  enforces every objective id).
- **Backend / online features, LOCAL-FIRST** (`js/backend.js` + `js/hub.js`, new files):
  the database lives in localStorage (`metamonsters_backend_v1`), all 17 tables from
  METAMONSTERS-BACKEND.md (accounts, profiles, creatures, items, bases, skills,
  trades, battles, messages, mailbox, friends, guilds, marketplace, dailyRewards,
  achievements, liveEvents, saves; leaderboards + battle history computed, not stored),
  all methods return `{ok, ...}`, passwords scrambled via a simple hash (never plain;
  local-only). Structured so a real server can replace the store later without
  rewriting the game code: every game-side state move goes through a BACKEND method
  that updates both live G state and the backend rows in the same call. Trade moves
  things only on both-side accept; one-place-per-creature rule; trade floors enforced
  (1-star 1-5, 2-star 5-100, 3-star 100-10k, 4-star gift-only NEVER listed, 5-star
  100k-1M, max 1 million); player cap 1,000. Bot world: 12 seeded bots (bot-01..bot-12:
  Rin, Boz, Suki, Ash, Wren, Kit, Lila, Moss, Tala, Nils, Ila, Dee; levels 10-95, real
  creature parties), 3 guilds (Rok City Elite / Indie Trainers / East Survivors, led by
  bot-01/02/03), marketplace listings, seeded chat, open trade offers. `BACKEND.
  botChatter()` (50% chance, ~30-line pool), bot PvP (auto-accept, full-round
  resolution via the real `calcDamage` / `pickEnemyMove`, winner +500 cash), bot trade
  auto-response (accept if offered star value >= asked value, else decline with
  reason). Achievements (18, exact list in the file): First Catch, First Tournament,
  Rookie/Forest/Reef/Ancient Champion, First Mutant, First Mega, First Ancient,
  Mystery Hunter, 10/50 Catches, Level 50/100, Rich, Guild Founder, First Trade,
  First PvP Win; `BACKEND.checkAchievements()` scans live G state. Live events (3,
  date windows computed from `Date.now()` so one always runs): Megalodon Week, Double
  XP Weekend, Ancient Hunt; claims read `G.flags.event_megalodon` /
  `event_doublexp` / `event_ancient`. Daily rewards: once per calendar day, streak,
  100 cash x streak (cap 1,000) + 1 bandage (streak >=3: +1 trap; >=7: +1 Chemical X),
  paid into live G state. Cloud saves: saveGame/loadGame JSON round-trip. Game-side
  wiring: `finishCatch` sets `event_megalodon` (any Fish), `event_ancient` +
  `caughtAncient` (any ancient/mystery), `mysteriesFound` (mystery count);
  `doMegaEvolve` sets `usedMega`; `gainXp` sets `event_doublexp` on Saturday/Sunday;
  `saveGame` calls `checkAchievements()` (guarded: no-op when BACKEND is absent or no
  account is signed in; newly earned achievements toast). NOTE: the backend's
  'Ancient Champion' test reads `g.flags.ancientCrownChampion` (the real flag, not
  'ancientChampion').
- **Hub / upper deck** (`js/hub.js`): one global `const HUB`, `HUB.openHub()` panel
  (ui.js panel/dialog idioms), 13 tabs (Account, Chat, PvP, Trade, Market, Friends,
  Mail, Guilds, Daily, Events, Achievements, Leaders, History), every tab functional
  against BACKEND methods, no dead buttons, guards for no-account. Entry points: the
  menu's "Online Hub (Upper Deck)" button, the hub's stairs (hub <-> hubUpper),
  terminal objects on the upper deck, the leaderboard board, and the Hub Guide NPC.
  hubUpper is a 14x8 interior map (3 terminals, board, stairs down, Hub Guide NPC).
  The Pokemon Center upper deck is the hub for all online features, per
  METAMONSTERS-HUB-AND-STORES.md.
- **Bazaar door fix** (pass-2 wart): the rokCity exit in the bazaar map moved from
  (8,10) to (13,10); the Bazaar Brawl arena door stays at (7,10), approached cleanly
  from the west (6,10). No more stepping onto the city exit while aiming for the door.
- **UI** (ui.js): menu gains "Online Hub (Upper Deck)". `openShop` gains seller
  'sanctuary' (small stock, 2x prices). New `openSanctuaryBase()` (build camp with
  wood 10, rest by the fire). `openTravelMenu`: the cave and all 75+ maps are never
  destinations (ANCIENT_WORLD list; car/fly cannot reach them — the cave is the only
  way in, and the same trip back is the only way out; a note says so once the ancient
  world is visited). Badge gains wastelandWar / rokCityChampionship / ancientCrown
  titles + an Ancient Champion line + a mystery count (x/5). World map sub-text updated
  (the 75+ world is open). HUD champion line covers all 10 cups. NPC_DIALOG: new
  handlers exileLeader (completes sanctuary / the75World / wholeStory talk steps;
  wholeStory gets its own closing dialog), exileTrader (opens the sanctuary shop),
  hubGuide (opens the hub), ancientLocal (one handler, per-NPC LINES map for all 21
  ancient-world locals); caveGuide extended (climbLesson), hollowKeeper extended
  (smashLesson), exileScout updated (no "next pass" lines — the 75+ world is open).
  Battle presentation: hit shake on crit / super-effective (decaying offset on both
  sprites), pulsing red HP-bar border at HP <= 20%.
- **Engine helpers** (engine.js): `hourOfDay()` (in-game hour, 0-23), `hasSense(sense)`
  (a living party creature with that dominant sense), `partyMaxLevel()` (highest
  party level, 0 if empty). `completeMission` already supported `reward.creature2`
  (added pre-compaction); verified, not re-added.
- **Spec tensions resolved in pass 3** (flagged here, not silently): (a) tournament 8's
  doc unlock (Wreckyard and Hollow) and tournament 9's doc unlock (Echo Caves) are
  already open from pass 2's east unlock — their unlocks become the HMs instead;
  (b) the Ancient Crown unlocks the cave exit (`unlock_longDarkExit`), per the
  tournaments doc; (c) Ancient Crown arithmetic: 16/8/4/2/1 sums to 31, not 32 — a
  9th round16 trainer (Relic) was added following the pass-2 first-round convention,
  so the cup is 16/9/4/2/1 = 32 and matches size 32; (d) ninthTournament gift is
  045 Great White Shark Lv85, NOT 075 Steel Crab — the brief's pick is 2-star per
  METAMONSTERS-STARS.md ("Zoea *, Crab *, Steel Crab **"), so it could not be the
  3-star gift; 045 is the substitute; (e) "Venom" signature: SIG_MOVES is keyed by
  name and shared, so giving Megarachne's Venom a may-poison effect also gives it to
  the 4 main-world Venom users (025 Hatchling, 027 King Cobra, 065 Tarantula, 067
  Scorpling) — thematically right (venom poisons), kept as-is, flagged here; (f)
  engine sig coercion: `sigMoveFor` does `power ?? 65`, so null-power defensive /
  evasive sigs report power 65 at runtime — identical to existing evasive/defensive
  sigs (e.g. Camouflage), not a pass-3 bug. The two open calls (stars per species vs
  per stage; Chemical X self-mutation) were NOT decided.
- **Catch balance fix (battle.js, pass 3 — the endgame was uncatchable)**: the
  pass-1 catch formula rolls 3 independent shakes at `rate`, and 5-star base was
  0.1 — so a 5-star at HP 1 with the best stage-3 trap caught at ~0.17% per
  throw. The 5-star ancients and the 5 mysteries (the whole endgame) were
  effectively uncatchable and the game could not be completed. Fixed two ways:
  (a) 5-star base 0.1 -> 0.22 (still the hardest wild catch — below the 3-star
  cage rate; 4-star is gift-only per the rarity doc, so it is never wild-caught);
  (b) tranquilizer darts now actually put the foe to sleep (their desc promises
  it), which gives the 1.5x sleep bonus in the rate, stops the foe fighting back,
  and stops a mystery slipping away (the 8%/turn flee skips a sleeping foe).
  With darts + sleep + Catching Lv10, a 5-star at HP 1 catches at ~13.6% per
  throw (avg ~7 throws); with a plain trap and no sleep it is ~1.9% (avg ~52).
  The test stocks the correct id (`tranquilizerDarts`, not `tranquilizer`) and
  trains Catching to 10, as a real endgame catcher would have.
- **Self-check** (tools/self-check.js): now 101 checks, ALL CHECKS PASSED. New coverage:
  ANCIENT_DEX = 15, MYSTERY_DEX = 5, DEX = 113, ANCIENT_LEARNSETS = 20, ancient stat
  totals, ancient/mystery sig resolution, MAPS = 59, ENCOUNTERS = 40, TOURNAMENTS =
  10, ancientCrown 16/9/4/2/1, cup-reward match for all 10 cups, the full pass-3
  mission chain, the 38-entry objective-ID map, TM_ITEMS = 9, creature2 gifts resolve
  and are 3-star (with the A02 4-star exception), talk objectives name real NPC_DIALOG
  handlers, and the sprite check resolves ancient/mystery paths through
  `creatureSprite()` (ancients/ + mystery/ folders, not creatures/).
