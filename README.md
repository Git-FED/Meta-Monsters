⚡ METAMONSTERS
A browser-based creature-taming RPG where humanity's greatest mistake — Chemical X — has leaked into the wild. Tame it. Train it. Or watch it consume everything.

Metamonsters is a full-stack, single-page creature RPG built entirely in vanilla JavaScript — no frameworks, no modules, no imports, no external dependencies. Every dex entry, every move, every map tile, every NPC, and every line of dialogue lives in plain JS data files loaded via <script> tags. The entire online multiplayer layer runs local-first on localStorage, structured so a real server can be dropped in later without rewriting a single game-side call.

This README is the canonical summary of the project — built from the three revision passes that took it from a 93-creature v1 to a 113-creature, 59-map, 10-tournament, 112-trainer complete game.

📊 The Numbers
Metric	Count
🐾 Dex entries (main-world)	93
🦴 Ancient creatures	15
👁️ Mystery creatures	5
📖 Total DEX	113
⚔️ Moves (category + sense + HM + SM + X + starter rare)	95
🎒 Items (standard)	83
💿 TM items (tournament-only)	9
🗺️ Maps	59
🌿 Wild encounter areas	40
🏆 Tournaments	10
🥋 Tournament trainers	112
📜 Missions	47
🎯 Mission objective IDs	38
🧬 Mutant forms	93
💥 Mega forms	12
🖼️ Battle backgrounds	16
🗃️ Backend tables	17
🖥️ Hub tabs	13
✅ Self-checks passing	101 / 101
🌍 The World
The game spans two eras of history and one long, dark road between them.

The Main World — 93 creatures, 40+ maps
Start in Haven, a quiet village at the edge of the Whispering Woods. Take the last remaining starter — a Bear Cub, a Wolf Cub, or a Shark Pup — and push outward through:

Meadow Route → Whispering Woods → The Mirage Oasis

Ember Dunes → Grand Bazaar → Frozen Roost → Ivory Tower

Rok City (the metropolis) → Rust Fields → Ashen Flats → Wreckyard → Hollow → Echo Caves

8 battle-tuned arenas plus The Upper Deck — a Pokémon-Center-style hub for all online features

Encounters are weighted, stage-gated, and atmosphere-driven. Snow falls on the frozen roost, ash drifts through the wasteland, neon sparks rain over Rok City, spores rise in the Hollow. Every area is wired to a battle background + weather pair via AREA_BATTLE.

The 75+ World — 15 ancients, 5 mysteries, 27 new maps
Beyond the sealed gate in the Echo Caves lies the world that killed the dinosaurs — and then kept going:

Rex Badlands and its radiating biomes: Horned Plains, Saber Fields, Raptor Grass, Mammoth Steppe, Dire Den, Burning Marsh, Devil's Pond, Ptero Cliffs, High Peaks, Giants' Canopy, Spiders' Hollow, Deep Forest, Deep River, Megalodon Deep, Armored Reef, Sea Scorpion Shallows, Spiral Shoals, Dark Caves

The Sanctuary — neutral ground. Tents, a campfire that heals and advances the day, an exile trader (2× prices), and a buildable sanctuary camp.

3 cave zones — caveMouth, caveDeep, caveGate — each gated by HMs you must earn from tournaments and side missions.

The Five Mystery Hunts
Legendary creatures do not roam. They hide. Each hideout has a mysterySign that checks the conditions:

Mystery	Level	Condition
M1 Spinosaurus	80	Dusk only (17:00–20:00)
M2 Quetzalcoatlus	82	Dawn only (05:00–08:00)
M3 Titanoboa	88	Lv 85+ team and a Heat-sense creature
M4 Megatherium	84	3 berries in the bag (consumed — the fruit trail)
M5 Giant Vampire Bat	86	None. Listen in the dark. HM LIGHT does not help.
Mysteries flee at 8% per turn unless put to sleep — and tranquilizer darts actually sleep them.

🧬 Creatures
The 93 Main-World Dex
Each entry carries: dex id, name, family, stage, category, dominant sense, signature skill, evolution (level or item), per-stage stars, base stats, sprite path, and a one-line flavor hook.

Archetypes drive base stats deterministically:

Tank — Bear, Crocodile, Snail, Crab, Axolotl, Toad

Attacker — Lion, Tiger, Cobra, Komodo, Scorpion, Octopus, Tuna

Fast — Wolf, Shark, Eagle, Owl, Bee, Butterfly, Spider, Shrimp, Squid

Balanced — Penguin, Frog, Salmon, Eel, Ant, Tarantula, Lobster

Stat totals: 210 (stage 1) / 320 (stage 2) / 450 (stage 3), plus +0 / +5 / +12 per stat by star rating. Instinct variants get +15% atk/spd, −15% def at runtime — never baked into the dex.

Five item evolutions exist: Eel → Electric Eel (Car Battery), Snail → Armored Snail (Iron Ore), Crab → Steel Crab (Scrap Metal), Frog → Poison Dart Frog (Herbs), Penguin → Emperor Penguin (Cold Pack).

Mutants (Pass 2)
93 mutant forms — wild only in the east (rustFields, ashenFlats, wreckyard, hollow, mixed in echoCaves) and only after unlock_mutants activates at The Dump Site. Stat profile: +20% atk, +15% hp. Catch rate ×0.6 — or ×1.3 on the Fight path. A creature is normal, Instinct, or Mutant — never stacked.

Mega Evolution (Pass 2)
12 mega forms. Activate from the battle menu when your active creature is eligible, you hold Chemical X, and no Mega has been used this battle. Costs 1 Chemical X. Grants +30% atk/def/spd, +20% hp for the battle. 10% berserk chance — a berserk creature picks a random move and has a 25% self-hit. Megas unmega at battle end (one battle only).

Ancients & Mysteries (Pass 3)
15 ancients (A01–A15) — all stage 3, no evolutions, 4-star or 5-star, stat totals 520 / 580. 5 mysteries (M1–M5) — all 5-star, stat total 600. Ancients have no mutant forms and no instinct art. Ancient type-chart rule: baseType() strips the "Ancient " prefix so ancients fight on their base category's chart, and ancient-typed moves get STAB via the same normalization.

Ancient catch rule: nets, cages, and lassos cannot hold them (stage 3 exceeds their maxStage). Only traps / snares / tranquilizer darts work.

⚔️ Battle System
Two orthogonal type charts
CAT_CHART — 9 categories (Mammal, Bird, Fish, Reptile, Arachnid, Insect, Amphibian, Mollusk, Crustacean), with every strong/weak pairing from the battle doc.

SENSE_CHART — 7 senses (Sight, Hearing, Echolocation, Electroreception, Touch, Smell, Heat), same treatment.

Default multiplier is 1. Moves are kind: "category" | "sense" and typed to match.

Move roster — 95 total
36 category moves

28 sense moves

8 HMs

14 SMs

6 X moves

3 starter rare moves (Grizzly's Rage, Alpha's Command, Great White Terror)

Plus 9 TM items (tmBite, tmWaterJet, tmFireBreath, tmElectricShock, tmFlash, tmSonicScream, tmTremor, tmMoltenStrike, tmPressurePoint) — tournament-only, never in SHOP_STOCK.

Effects are strict: only what the docs state. Roar → {stat:"atk", stages:-1, target:"foe"}. Venom Bite → {status:"poison", chance:0.3}. Camouflage → {stat:"eva", stages:1, target:"self"}. Vague doc effects become special tags the engine implements: trap, dig, soundblock, pierce, alwaysHit, highCrit, sureHitNext.

Signatures
Every creature has one. SIG_MOVES is a per-signature-name override table so no signature is left unresolved. Attack-implying names → power 65, category-type, no effect. Defensive/utility names → self-def buffs, alwaysHit for tracking, heal25 for regeneration. The ancient file adds its own ANCIENT_SIG_MOVES.

Catch balance fix (Pass 3)
The original endgame was statistically uncatchable. Fixed two ways:

5-star base rate 0.1 → 0.22

Tranquilizer darts actually sleep the target (as their description promises), enabling the 1.5× sleep bonus and stopping the mystery 8%/turn flee

Result: a 5-star at 1 HP with darts + sleep + Catching Lv10 catches at ~13.6% per throw (avg ~7 throws) instead of ~0.17%.

Presentation
BT.weather particles

Damage popups colored by crit (gold, bigger) / super-effective (green) / resisted (pink)

Player HP bars carry an XP bar and a status chip

Hit shake on crit / super-effective (decaying sprite offset)

Pulsing red HP-bar border at HP ≤ 20%

★MEGA / ★M / ★I tags on the HP bar

🎒 Items & Economy
83 standard items across 9 categories: Healing & Medicine, Food & Drink, Catching, Materials, Gear & Clothing, Transport & Upgrades, Battle & Performance, Key Items, Money. Plus 9 TM items kept separate.

Prices are rule-derived from the docs (which mostly don't list them), with the two transport exceptions preserved (bicycle 50, car 5000). Highlights:

Catching — net 100, trap 150, cage 300, snare 80, lasso 120, tranquilizer darts 200, bait 20, whistle 60

Materials — wood 5, stone 5, iron ore 40, copper ore 30, leather 60, herbs 15, scrap metal 25 …

Transport parts — gasoline 40, car battery 500, engine parts 300, tire 120, bicycle parts 150 …

Battle — adrenaline shot 150, flare 80, smoke bomb 120, pepper spray 100, bear spray 130, Chemical X 5000 (preserved as buyable despite its "not stocked in normal shops" flavor — a Pass-2 decision)

Key items & cash/coins — price 0, use: null

Item uses are strict: heal (with amounts), catch (with catchMod), cure (with one of poison/burn/sleep/paralysis/infection/bleeding/crippled/bruised/fainted), battle, evo (with evoFor), material, key, food, tm.

📜 Story & Missions
47 missions across 5 phases, all chained, all self-checked.

Phase 1 — The Last Starter
lastStarter → firstWood → firstCatch → firstBase → starterPath → (starterPathBear | starterPathWolf | starterPathShark) → firstTournament → foreclosure → lawsuitTV → peopleTalking → smallShops → sickAnimals → quietFriendLeaves → secondTournament → thirdTournament → labLog → coldNorth → coast

Phase 2 — Rok City
rokCity → universityKids → corruption → flock → fourthTournament → fifthTournament → sixthTournament → seventhTournament → theChoice

The Choice — Mara (fight) vs Caleb (join)
theChoice forks permanently:

Fight path: leak → indieAlliance → securityTeam → facility → exposure

Join path: interview → ladder → quietFriendsPath → dirtyWork → executive

A one-time reconsider is available from the menu while a path mission is active. Switching abandons the old mission (flagged ABANDONED in the panel), marks the old side permanently hostile, and activates the other path. Exclusives: 2H Alpha Wolf (Fight), M. Alpha Lion (Join).

Phase 3–4 — The East & The Endgame
dumpSite → theEast → theMutants → theWreckyard → theCave → finalBattle → eighthTournament → ninthTournament → tenthTournament → the75World → sanctuary → mysterySpino → mysteryQuetz → mysteryTitan → mysteryMega → mysteryBat → wholeStory (end, next: null)

Plus side missions climbLesson (Cave Guide) and smashLesson (Hollow Keeper).

Mission rewards support cash, items, xp, unlock (string or array), rank (corp rank 1–5), and creature gifts via reward.creature and reward.creature2. Objective types: talk, starter, gather, catch (with optional mutant: true), build, battle, tournament, reach, choice.

🏆 Tournaments — 10 Cups, 112 Trainers
#	Cup	Levels	Location	Final	Unlock
1	Rookie Cup	1–5	Mirage Oasis	Marcus	Catching
2	Forest Clash	5–10	Whispering Woods	Sofia	Ant Colony
3	Reef Rumble	10–20	Coral Reef	The Reef Champion	HM SWIM
4	Desert Heat	20–30	Ember Dunes	The Sand King	Scorpions' Nest
5	Bazaar Brawl	30–40	Grand Bazaar	The Bazaar Boss	HM SOAR
6	Frost Crown	40–50	Frozen Roost	The Frost Queen	Ice Lake
7	University Games	50–60	Ivory Tower	Caleb	Rok City (ceremonial)
8	Wasteland War	60–75	Rust Fields	The Wasteland King	HM LIGHT
9	Rok City Championship	75–90	Rok City	Corporate Champion	HM DIVE
10	Ancient Crown	90–100	Echo Caves	Ancient Keeper	longDarkExit
TournamentFlow is cup-generic: it builds its bracket by each trainer's round field (round32 → round16 → quarterfinal → semifinal → final), resolves 3/4/5 battles depending on cup size, and maps every win to its mission + champion flag (G.flags[cup.id + 'Champion']).

The Ancient Crown is a 32-trainer cup — 16 / 9 / 4 / 2 / 1 — with a 9th round16 trainer (Relic) added to make the arithmetic match size: 32.

Rewards live in both the cup and its mission (self-check enforces they match). Creature gifts live only in missions. The Ancient Crown's 3-star gifts are 045 Great White Shark Lv85 and A02 Dire Wolf Lv90 4-star.

🖥️ Online Hub — Local-First Backend
Everything online runs against BACKEND in js/backend.js, backed by localStorage['metamonsters_backend_v1']. All 17 tables from the backend doc are present: accounts, profiles, creatures, items, bases, skills, trades, battles, messages, mailbox, friends, guilds, marketplace, dailyRewards, achievements, liveEvents, saves. Every method returns {ok, ...}. Passwords are hashed (never plain — local-only).

The hub lives on the Upper Deck — 13 tabs, all functional, no dead buttons:
Account · Chat · PvP · Trade · Market · Friends · Mail · Guilds · Daily · Events · Achievements · Leaders · History

Trade rules
One place per creature. Trade floors enforced: 1★ = 1–5 · 2★ = 5–100 · 3★ = 100–10k · 4★ = gift-only, NEVER listed · 5★ = 100k–1M. Max 1 million. Player cap 1,000.

The bot world
12 seeded bots — Rin, Boz, Suki, Ash, Wren, Kit, Lila, Moss, Tala, Nils, Ila, Dee — levels 10–95, real creature parties. 3 guilds (Rok City Elite / Indie Trainers / East Survivors, led by bot-01/02/03). Seeded chat, marketplace listings, open trade offers. Bots auto-accept PvP, auto-respond to trades by star-value comparison, and chatter from a ~30-line pool at 50% chance.

Systems
18 achievements — First Catch, First Tournament, Rookie/Forest/Reef/Ancient Champion, First Mutant, First Mega, First Ancient, Mystery Hunter, 10/50 Catches, Level 50/100, Rich, Guild Founder, First Trade, First PvP Win

3 live events — Megalodon Week, Double XP Weekend, Ancient Hunt (date windows computed so one always runs)

Daily rewards — once per calendar day, streak, 100 cash × streak (cap 1,000) + bandage; ≥3 streak adds a trap, ≥7 adds Chemical X

Cloud saves — JSON round-trip via saveGame / loadGame

🕰️ The Three Revision Passes
The game was built in three revision passes, each upgrading in place:

Pass 1 — The Foundation
93-dex skeleton, 20 missions, 3 tournaments (24 trainers), 15 encounter areas, 20 maps, 2 TM items, 8 battle backgrounds. Starter-choice logic (assignStarters), mission chaining, TournamentFlow, AREA_BATTLE mapping, G.flags.visited, bicycle + garage, shop sellers, animated title screen.

Pass 2 — The City & The Choice
47 missions, 7 tournaments (80 trainers), 23 encounter areas, 32 maps, 6 TM items, 12 battle backgrounds, 9 character sprites. Added mutants, Mega Evolution, the Mara/Caleb fork, Rok City, the east, the car + flying transport, NPCs, shops, and the path-exclusive gifts.

Pass 3 — The Ancient World
59 maps, 10 tournaments (112 trainers), 40 encounter areas, 113 total dex, 9 TM items, 16 battle backgrounds, 17 backend tables, 13 hub tabs. Added ancients, mysteries, the 75+ world, HM assignments (LIGHT/DIVE from tournaments 8/9; CLIMB/SMASH from side missions), the Long Dark gate, the local-first backend, the hub, and the catch balance fix.

🧪 Quality — 101 Self-Checks, All Passing
tools/self-check.js verifies the whole project. Coverage includes:

✅ DEX = 113, ANCIENT_DEX = 15, MYSTERY_DEX = 5

✅ ANCIENT_LEARNSETS = 20, ancient stat totals (520 / 580 / 600)

✅ MAPS = 59, ENCOUNTERS = 40, TOURNAMENTS = 10, TM_ITEMS = 9

✅ Ancient Crown bracket = 16 / 9 / 4 / 2 / 1

✅ Cup-reward match for all 10 cups

✅ Full pass-3 mission chain + the 38-entry objective-ID map

✅ creature2 gifts resolve and are 3-star (with the A02 4-star exception)

✅ Talk objectives name real NPC_DIALOG handlers

✅ Sprite check resolves ancient/mystery paths via creatureSprite()

📝 Spec Tensions — Resolved & Flagged
A few doc contradictions were resolved in each pass rather than left ambiguous. The headliners:

Two Maras — Elder Mara (Haven elder) and Mara (Rok City bazaar owner / resistance leader) are different people. The docs never say otherwise.

"The City Tournament" = the Bazaar Brawl — mission fifthTournament, titled accordingly.

Rok City walkable from start — the University Games' "unlocks Rok City" is a ceremonial flag only.

TM Focus Beam / Lightning Strike don't exist — substituted TM Flash (TM14) and TM Sonic Scream (TM15).

Ancient Crown arithmetic — 16+8+4+2+1 = 31, not 32. Added a 9th round16 trainer (Relic) to match size: 32.

9th tournament gift — doc said Steel Crab, but that's only 2★. Substituted 045 Great White Shark Lv85 (3★).

HM LIGHT / DIVE / CLIMB / SMASH — no doc assigned them. Assigned here: LIGHT = Wasteland War, DIVE = Rok City Championship, CLIMB = climbLesson, SMASH = smashLesson.

"Venom" signature — SIG_MOVES is keyed by name, so Megarachne's poison Venom also poisons the 4 main-world Venom users. Thematically correct, kept as-is.

Chemical X buyable — preserved Pass-1 behavior despite its "not stocked in normal shops" flavor.

5★ catch rate — the original 0.1 made the endgame statistically unbeatable. Raised to 0.22, plus tranquilizer darts now actually sleep. Documented in the balance-fix section.

Two open calls were not decided and remain flagged: stars per species vs. per stage, and Chemical X self-mutation.

🚀 Quick Start
bash
# Serve the game directory with any static server
npx serve metamonsters-game

# Run the full self-check suite
node metamonsters-game/tools/self-check.js
# → 101 checks, ALL CHECKS PASSED
Open index.html in your browser. The title screen preloads 16 battle backgrounds, the Rok City skyline, and 9 character sprites. Click New Game to begin.

Save key: metamonsters_save_v2 · Save version: 2 · Backend store: metamonsters_backend_v1

🗂️ Project Layout
text
metamonsters-game/
├── index.html
├── css/
├── js/
│   ├── data/
│   │   ├── dex.js           → DEX
│   │   ├── moves.js         → MOVES, CAT_CHART, SENSE_CHART, LEARNSETS, STARTER_RARE
│   │   ├── items.js         → ITEMS, TM_ITEMS
│   │   ├── missions.js      → MISSIONS
│   │   ├── tournaments.js   → TOURNAMENTS
│   │   ├── encounters.js    → ENCOUNTERS
│   │   ├── mutants.js       → MUTANT_NAMES, MEGA_FORMS
│   │   └── ancients.js      → ANCIENT_DEX, MYSTERY_DEX, ANCIENT_LEARNSETS, ANCIENT_SIG_MOVES
│   ├── backend.js           → BACKEND (local-first, 17 tables)
│   ├── hub.js               → HUB (13-tab Upper Deck panel)
│   ├── engine.js            → state, missions, transport, save/load
│   ├── battle.js            → BT, battle loop, Mega, mystery hunts
│   ├── tiles.js             → MAPS (59), tile types, objects, transitions
│   ├── ui.js                → UI, NPC_DIALOG, shops, party, missions panel
│   ├── render.js            → overworld + particles
│   └── main.js              → boot, preload, boot-checks
├── assets/
│   ├── sprites/creatures/   ├── sprites/mutant/    ├── sprites/mega/
│   ├── sprites/ancients/    ├── sprites/mystery/   ├── sprites/chars/
│   └── bg/
└── tools/
    └── self-check.js        → 101 checks
Loading order matters: dex → moves → items → missions → tournaments → encounters → mutants → ancients → engine. Boot-checks in main.js enforce it.
