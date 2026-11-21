<div align="center">

<h1>⚡ METAMONSTERS</h1>

<img width="1283" height="691" alt="Screenshot 2026-11-21 080457" src="https://github.com/user-attachments/assets/848ba30d-df78-4db0-8b2b-78e2ab1f2388" />

<p><em>A browser-based creature-taming RPG where humanity's greatest mistake — Chemical X — has leaked into the wild. Tame it. Train it. Or watch it consume everything.</em></p>

<p><strong>Metamonsters</strong> is a full-stack, single-page creature RPG built entirely in vanilla JavaScript — no frameworks, no modules, no imports, no external dependencies. Every dex entry, every move, every map tile, every NPC, and every line of dialogue lives in plain JS data files loaded via <code>&lt;script&gt;</code> tags. The entire online multiplayer layer runs <strong>local-first</strong> on <code>localStorage</code>, structured so a real server can be dropped in later without rewriting a single game-side call.</p>

<p>This README is the canonical summary of the project — built from the three revision passes that took it from a 93-creature v1 to a <strong>113-creature, 59-map, 10-tournament, 112-trainer</strong> complete game.</p>

<hr>

<h2>📊 The Numbers</h2>

<table align="center" style="text-align:center; border-collapse:collapse;">
<tr><th>Metric</th><th>Count</th></tr>
<tr><td>🐾 Dex entries (main-world)</td><td><strong>93</strong></td></tr>
<tr><td>🦴 Ancient creatures</td><td><strong>15</strong></td></tr>
<tr><td>👁️ Mystery creatures</td><td><strong>5</strong></td></tr>
<tr><td>📖 Total <code>DEX</code></td><td><strong>113</strong></td></tr>
<tr><td>⚔️ Moves (category + sense + HM + SM + X + starter rare)</td><td><strong>95</strong></td></tr>
<tr><td>🎒 Items (standard)</td><td><strong>83</strong></td></tr>
<tr><td>💿 TM items (tournament-only)</td><td><strong>9</strong></td></tr>
<tr><td>🗺️ Maps</td><td><strong>59</strong></td></tr>
<tr><td>🌿 Wild encounter areas</td><td><strong>40</strong></td></tr>
<tr><td>🏆 Tournaments</td><td><strong>10</strong></td></tr>
<tr><td>🥋 Tournament trainers</td><td><strong>112</strong></td></tr>
<tr><td>📜 Missions</td><td><strong>47</strong></td></tr>
<tr><td>🎯 Mission objective IDs</td><td><strong>38</strong></td></tr>
<tr><td>🧬 Mutant forms</td><td><strong>93</strong></td></tr>
<tr><td>💥 Mega forms</td><td><strong>12</strong></td></tr>
<tr><td>🖼️ Battle backgrounds</td><td><strong>16</strong></td></tr>
<tr><td>🗃️ Backend tables</td><td><strong>17</strong></td></tr>
<tr><td>🖥️ Hub tabs</td><td><strong>13</strong></td></tr>
<tr><td>✅ Self-checks passing</td><td><strong>101 / 101</strong></td></tr>
</table>

<hr>

<h2>🌍 The World</h2>

<p>The game spans two eras of history and one long, dark road between them.</p>

<h3>The Main World — 93 creatures, 40+ maps</h3>

<p>Start in <strong>Haven</strong>, a quiet village at the edge of the <strong>Whispering Woods</strong>. Take the last remaining starter — a <strong>Bear Cub</strong>, a <strong>Wolf Cub</strong>, or a <strong>Shark Pup</strong> — and push outward through:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>Meadow Route</strong> → <strong>Whispering Woods</strong> → <strong>The Mirage Oasis</strong></li>
<li><strong>Ember Dunes</strong> → <strong>Grand Bazaar</strong> → <strong>Frozen Roost</strong> → <strong>Ivory Tower</strong></li>
<li><strong>Rok City</strong> (the metropolis) → <strong>Rust Fields</strong> → <strong>Ashen Flats</strong> → <strong>Wreckyard</strong> → <strong>Hollow</strong> → <strong>Echo Caves</strong></li>
<li><strong>8 battle-tuned arenas</strong> plus <strong>The Upper Deck</strong> — a Pokémon-Center-style hub for all online features</li>
</ul>

<p>Encounters are weighted, stage-gated, and atmosphere-driven. Snow falls on the frozen roost, ash drifts through the wasteland, neon sparks rain over Rok City, spores rise in the Hollow. Every area is wired to a battle background + weather pair via <code>AREA_BATTLE</code>.</p>

<h3>The 75+ World — 15 ancients, 5 mysteries, 27 new maps</h3>

<p>Beyond the sealed gate in the Echo Caves lies the world that killed the dinosaurs — and then kept going:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>Rex Badlands</strong> and its radiating biomes: <strong>Horned Plains</strong>, <strong>Saber Fields</strong>, <strong>Raptor Grass</strong>, <strong>Mammoth Steppe</strong>, <strong>Dire Den</strong>, <strong>Burning Marsh</strong>, <strong>Devil's Pond</strong>, <strong>Ptero Cliffs</strong>, <strong>High Peaks</strong>, <strong>Giants' Canopy</strong>, <strong>Spiders' Hollow</strong>, <strong>Deep Forest</strong>, <strong>Deep River</strong>, <strong>Megalodon Deep</strong>, <strong>Armored Reef</strong>, <strong>Sea Scorpion Shallows</strong>, <strong>Spiral Shoals</strong>, <strong>Dark Caves</strong></li>
<li><strong>The Sanctuary</strong> — neutral ground. Tents, a campfire that heals and advances the day, an exile trader (2× prices), and a buildable sanctuary camp.</li>
<li><strong>3 cave zones</strong> — <code>caveMouth</code>, <code>caveDeep</code>, <code>caveGate</code> — each gated by HMs you must earn from tournaments and side missions.</li>
</ul>

<h3>The Five Mystery Hunts</h3>

<p>Legendary creatures do not roam. They hide. Each hideout has a <code>mysterySign</code> that checks the conditions:</p>

<table align="center" style="text-align:center; border-collapse:collapse;">
<tr><th>Mystery</th><th>Level</th><th>Condition</th></tr>
<tr><td>M1 Spinosaurus</td><td>80</td><td><strong>Dusk only</strong> (17:00–20:00)</td></tr>
<tr><td>M2 Quetzalcoatlus</td><td>82</td><td><strong>Dawn only</strong> (05:00–08:00)</td></tr>
<tr><td>M3 Titanoboa</td><td>88</td><td>Lv 85+ team <strong>and</strong> a Heat-sense creature</td></tr>
<tr><td>M4 Megatherium</td><td>84</td><td><strong>3 berries</strong> in the bag (consumed — the fruit trail)</td></tr>
<tr><td>M5 Giant Vampire Bat</td><td>86</td><td>None. Listen in the dark. HM LIGHT does not help.</td></tr>
</table>

<p>Mysteries flee at <strong>8% per turn</strong> unless put to sleep — and tranquilizer darts actually sleep them.</p>

<hr>

<h2>🧬 Creatures</h2>

<h3>The 93 Main-World Dex</h3>

<p>Each entry carries: dex id, name, family, stage, category, dominant sense, signature skill, evolution (level or item), per-stage stars, base stats, sprite path, and a one-line flavor hook.</p>

<p><strong>Archetypes</strong> drive base stats deterministically:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>Tank</strong> — Bear, Crocodile, Snail, Crab, Axolotl, Toad</li>
<li><strong>Attacker</strong> — Lion, Tiger, Cobra, Komodo, Scorpion, Octopus, Tuna</li>
<li><strong>Fast</strong> — Wolf, Shark, Eagle, Owl, Bee, Butterfly, Spider, Shrimp, Squid</li>
<li><strong>Balanced</strong> — Penguin, Frog, Salmon, Eel, Ant, Tarantula, Lobster</li>
</ul>

<p>Stat totals: <strong>210</strong> (stage 1) / <strong>320</strong> (stage 2) / <strong>450</strong> (stage 3), plus <strong>+0 / +5 / +12 per stat</strong> by star rating. Instinct variants get <strong>+15% atk/spd, −15% def</strong> at runtime — never baked into the dex.</p>

<p><strong>Five item evolutions</strong> exist: Eel → Electric Eel (Car Battery), Snail → Armored Snail (Iron Ore), Crab → Steel Crab (Scrap Metal), Frog → Poison Dart Frog (Herbs), Penguin → Emperor Penguin (Cold Pack).</p>

<h3>Mutants (Pass 2)</h3>

<p><strong>93 mutant forms</strong> — wild <strong>only</strong> in the east (<code>rustFields</code>, <code>ashenFlats</code>, <code>wreckyard</code>, <code>hollow</code>, mixed in <code>echoCaves</code>) and <strong>only after</strong> <code>unlock_mutants</code> activates at The Dump Site. Stat profile: <strong>+20% atk, +15% hp</strong>. Catch rate <strong>×0.6</strong> — or <strong>×1.3</strong> on the Fight path. A creature is normal, Instinct, <strong>or</strong> Mutant — never stacked.</p>

<h3>Mega Evolution (Pass 2)</h3>

<p><strong>12 mega forms.</strong> Activate from the battle menu when your active creature is eligible, you hold <strong>Chemical X</strong>, and no Mega has been used this battle. Costs 1 Chemical X. Grants <strong>+30% atk/def/spd, +20% hp</strong> for the battle. <strong>10% berserk chance</strong> — a berserk creature picks a random move and has a 25% self-hit. Megas <strong>unmega at battle end</strong> (one battle only).</p>

<h3>Ancients &amp; Mysteries (Pass 3)</h3>

<p><strong>15 ancients</strong> (A01–A15) — all stage 3, no evolutions, <strong>4-star or 5-star</strong>, stat totals <strong>520 / 580</strong>. <strong>5 mysteries</strong> (M1–M5) — all <strong>5-star</strong>, stat total <strong>600</strong>. Ancients have <strong>no mutant forms and no instinct art</strong>. Ancient type-chart rule: <code>baseType()</code> strips the <code>"Ancient "</code> prefix so ancients fight on their base category's chart, and ancient-typed moves get STAB via the same normalization.</p>

<p><strong>Ancient catch rule:</strong> nets, cages, and lassos <strong>cannot hold them</strong> (stage 3 exceeds their <code>maxStage</code>). Only <strong>traps / snares / tranquilizer darts</strong> work.</p>

<hr>

<h2>⚔️ Battle System</h2>

<h3>Two orthogonal type charts</h3>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong><code>CAT_CHART</code></strong> — 9 categories (Mammal, Bird, Fish, Reptile, Arachnid, Insect, Amphibian, Mollusk, Crustacean), with every strong/weak pairing from the battle doc.</li>
<li><strong><code>SENSE_CHART</code></strong> — 7 senses (Sight, Hearing, Echolocation, Electroreception, Touch, Smell, Heat), same treatment.</li>
</ul>

<p>Default multiplier is <strong>1</strong>. Moves are <code>kind: "category" | "sense"</code> and typed to match.</p>

<h3>Move roster — 95 total</h3>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>36 category moves</strong></li>
<li><strong>28 sense moves</strong></li>
<li><strong>8 HMs</strong></li>
<li><strong>14 SMs</strong></li>
<li><strong>6 X moves</strong></li>
<li><strong>3 starter rare moves</strong> (Grizzly's Rage, Alpha's Command, Great White Terror)</li>
<li>Plus <strong>9 TM items</strong> (<code>tmBite</code>, <code>tmWaterJet</code>, <code>tmFireBreath</code>, <code>tmElectricShock</code>, <code>tmFlash</code>, <code>tmSonicScream</code>, <code>tmTremor</code>, <code>tmMoltenStrike</code>, <code>tmPressurePoint</code>) — tournament-only, never in <code>SHOP_STOCK</code>.</li>
</ul>

<p>Effects are strict: only what the docs state. <code>Roar</code> → <code>{stat:"atk", stages:-1, target:"foe"}</code>. <code>Venom Bite</code> → <code>{status:"poison", chance:0.3}</code>. <code>Camouflage</code> → <code>{stat:"eva", stages:1, target:"self"}</code>. Vague doc effects become <strong>special tags</strong> the engine implements: <code>trap</code>, <code>dig</code>, <code>soundblock</code>, <code>pierce</code>, <code>alwaysHit</code>, <code>highCrit</code>, <code>sureHitNext</code>.</p>

<h3>Signatures</h3>

<p>Every creature has one. <code>SIG_MOVES</code> is a <strong>per-signature-name override table</strong> so no signature is left unresolved. Attack-implying names → <strong>power 65, category-type, no effect</strong>. Defensive/utility names → self-def buffs, <code>alwaysHit</code> for tracking, <code>heal25</code> for regeneration. The ancient file adds its own <code>ANCIENT_SIG_MOVES</code>.</p>

<h3>Catch balance fix (Pass 3)</h3>

<p>The original endgame was statistically uncatchable. Fixed two ways:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li>5-star base rate <strong>0.1 → 0.22</strong></li>
<li>Tranquilizer darts <strong>actually sleep</strong> the target (as their description promises), enabling the <strong>1.5× sleep bonus</strong> and stopping the mystery 8%/turn flee</li>
</ul>

<p>Result: a 5-star at 1 HP with darts + sleep + Catching Lv10 catches at <strong>~13.6% per throw</strong> (avg ~7 throws) instead of <strong>~0.17%</strong>.</p>

<h3>Presentation</h3>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong><code>BT.weather</code></strong> particles</li>
<li>Damage popups colored by crit (gold, bigger) / super-effective (green) / resisted (pink)</li>
<li>Player HP bars carry an <strong>XP bar</strong> and a status chip</li>
<li><strong>Hit shake</strong> on crit / super-effective (decaying sprite offset)</li>
<li><strong>Pulsing red HP-bar border</strong> at HP ≤ 20%</li>
<li><strong>★MEGA / ★M / ★I</strong> tags on the HP bar</li>
</ul>

<hr>

<h2>🎒 Items &amp; Economy</h2>

<p><strong>83 standard items</strong> across 9 categories: Healing &amp; Medicine, Food &amp; Drink, Catching, Materials, Gear &amp; Clothing, Transport &amp; Upgrades, Battle &amp; Performance, Key Items, Money. <strong>Plus 9 TM items</strong> kept separate.</p>

<p>Prices are rule-derived from the docs (which mostly don't list them), with the two transport exceptions preserved (bicycle 50, car 5000). Highlights:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>Catching</strong> — net 100, trap 150, cage 300, snare 80, lasso 120, tranquilizer darts 200, bait 20, whistle 60</li>
<li><strong>Materials</strong> — wood 5, stone 5, iron ore 40, copper ore 30, leather 60, herbs 15, scrap metal 25 …</li>
<li><strong>Transport parts</strong> — gasoline 40, car battery 500, engine parts 300, tire 120, bicycle parts 150 …</li>
<li><strong>Battle</strong> — adrenaline shot 150, flare 80, smoke bomb 120, pepper spray 100, bear spray 130, <strong>Chemical X 5000</strong> (preserved as buyable despite its "not stocked in normal shops" flavor — a Pass-2 decision)</li>
<li><strong>Key items &amp; cash/coins</strong> — price 0, <code>use: null</code></li>
</ul>

<p>Item uses are strict: <code>heal</code> (with amounts), <code>catch</code> (with <code>catchMod</code>), <code>cure</code> (with one of poison/burn/sleep/paralysis/infection/bleeding/crippled/bruised/fainted), <code>battle</code>, <code>evo</code> (with <code>evoFor</code>), <code>material</code>, <code>key</code>, <code>food</code>, <code>tm</code>.</p>

<hr>

<h2>📜 Story &amp; Missions</h2>

<p><strong>47 missions</strong> across <strong>5 phases</strong>, all chained, all self-checked.</p>

<h3>Phase 1 — The Last Starter</h3>

<p><code>lastStarter</code> → <code>firstWood</code> → <code>firstCatch</code> → <code>firstBase</code> → <code>starterPath</code> → <code>(starterPathBear | starterPathWolf | starterPathShark)</code> → <code>firstTournament</code> → <code>foreclosure</code> → <code>lawsuitTV</code> → <code>peopleTalking</code> → <code>smallShops</code> → <code>sickAnimals</code> → <code>quietFriendLeaves</code> → <code>secondTournament</code> → <code>thirdTournament</code> → <code>labLog</code> → <code>coldNorth</code> → <code>coast</code></p>

<h3>Phase 2 — Rok City</h3>

<p><code>rokCity</code> → <code>universityKids</code> → <code>corruption</code> → <code>flock</code> → <code>fourthTournament</code> → <code>fifthTournament</code> → <code>sixthTournament</code> → <code>seventhTournament</code> → <code>theChoice</code></p>

<h3>The Choice — Mara (fight) vs Caleb (join)</h3>

<p><code>theChoice</code> forks permanently:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>Fight path:</strong> <code>leak</code> → <code>indieAlliance</code> → <code>securityTeam</code> → <code>facility</code> → <code>exposure</code></li>
<li><strong>Join path:</strong> <code>interview</code> → <code>ladder</code> → <code>quietFriendsPath</code> → <code>dirtyWork</code> → <code>executive</code></li>
</ul>

<p>A <strong>one-time reconsider</strong> is available from the menu while a path mission is active. Switching abandons the old mission (flagged <code>ABANDONED</code> in the panel), marks the old side permanently hostile, and activates the other path. Exclusives: <strong>2H Alpha Wolf</strong> (Fight), <strong>M. Alpha Lion</strong> (Join).</p>

<h3>Phase 3–4 — The East &amp; The Endgame</h3>

<p><code>dumpSite</code> → <code>theEast</code> → <code>theMutants</code> → <code>theWreckyard</code> → <code>theCave</code> → <code>finalBattle</code> → <code>eighthTournament</code> → <code>ninthTournament</code> → <code>tenthTournament</code> → <code>the75World</code> → <code>sanctuary</code> → <code>mysterySpino</code> → <code>mysteryQuetz</code> → <code>mysteryTitan</code> → <code>mysteryMega</code> → <code>mysteryBat</code> → <code>wholeStory</code> <em>(end, next: null)</em></p>

<p>Plus side missions <code>climbLesson</code> (Cave Guide) and <code>smashLesson</code> (Hollow Keeper).</p>

<p>Mission rewards support <code>cash</code>, <code>items</code>, <code>xp</code>, <code>unlock</code> (string <strong>or</strong> array), <code>rank</code> (corp rank 1–5), and <strong>creature gifts</strong> via <code>reward.creature</code> and <code>reward.creature2</code>. Objective types: <code>talk</code>, <code>starter</code>, <code>gather</code>, <code>catch</code> (with optional <code>mutant: true</code>), <code>build</code>, <code>battle</code>, <code>tournament</code>, <code>reach</code>, <code>choice</code>.</p>

<hr>

<h2>🏆 Tournaments — 10 Cups, 112 Trainers</h2>

<table align="center" style="text-align:center; border-collapse:collapse;">
<tr><th>#</th><th>Cup</th><th>Levels</th><th>Location</th><th>Final</th><th>Unlock</th></tr>
<tr><td>1</td><td><strong>Rookie Cup</strong></td><td>1–5</td><td>Mirage Oasis</td><td>Marcus</td><td>Catching</td></tr>
<tr><td>2</td><td><strong>Forest Clash</strong></td><td>5–10</td><td>Whispering Woods</td><td>Sofia</td><td>Ant Colony</td></tr>
<tr><td>3</td><td><strong>Reef Rumble</strong></td><td>10–20</td><td>Coral Reef</td><td>The Reef Champion</td><td>HM SWIM</td></tr>
<tr><td>4</td><td><strong>Desert Heat</strong></td><td>20–30</td><td>Ember Dunes</td><td>The Sand King</td><td>Scorpions' Nest</td></tr>
<tr><td>5</td><td><strong>Bazaar Brawl</strong></td><td>30–40</td><td>Grand Bazaar</td><td>The Bazaar Boss</td><td>HM SOAR</td></tr>
<tr><td>6</td><td><strong>Frost Crown</strong></td><td>40–50</td><td>Frozen Roost</td><td>The Frost Queen</td><td>Ice Lake</td></tr>
<tr><td>7</td><td><strong>University Games</strong></td><td>50–60</td><td>Ivory Tower</td><td>Caleb</td><td>Rok City (ceremonial)</td></tr>
<tr><td>8</td><td><strong>Wasteland War</strong></td><td>60–75</td><td>Rust Fields</td><td>The Wasteland King</td><td>HM LIGHT</td></tr>
<tr><td>9</td><td><strong>Rok City Championship</strong></td><td>75–90</td><td>Rok City</td><td>Corporate Champion</td><td>HM DIVE</td></tr>
<tr><td>10</td><td><strong>Ancient Crown</strong></td><td>90–100</td><td>Echo Caves</td><td>Ancient Keeper</td><td><code>longDarkExit</code></td></tr>
</table>

<p><strong><code>TournamentFlow</code></strong> is cup-generic: it builds its bracket by each trainer's <code>round</code> field (<code>round32</code> → <code>round16</code> → <code>quarterfinal</code> → <code>semifinal</code> → <code>final</code>), resolves 3/4/5 battles depending on cup size, and maps every win to its mission + champion flag (<code>G.flags[cup.id + 'Champion']</code>).</p>

<p>The <strong>Ancient Crown</strong> is a <strong>32-trainer cup</strong> — 16 / 9 / 4 / 2 / 1 — with a 9th <code>round16</code> trainer (<em>Relic</em>) added to make the arithmetic match <code>size: 32</code>.</p>

<p>Rewards live in <strong>both</strong> the cup and its mission (self-check enforces they match). Creature gifts live <strong>only</strong> in missions. The Ancient Crown's 3-star gifts are <strong>045 Great White Shark Lv85</strong> and <strong>A02 Dire Wolf Lv90 4-star</strong>.</p>

<hr>

<h2>🖥️ Online Hub — Local-First Backend</h2>

<p>Everything online runs against <strong><code>BACKEND</code></strong> in <code>js/backend.js</code>, backed by <code>localStorage['metamonsters_backend_v1']</code>. All <strong>17 tables</strong> from the backend doc are present: accounts, profiles, creatures, items, bases, skills, trades, battles, messages, mailbox, friends, guilds, marketplace, dailyRewards, achievements, liveEvents, saves. Every method returns <code>{ok, ...}</code>. Passwords are hashed (never plain — local-only).</p>

<p><strong>The hub lives on the Upper Deck</strong> — 13 tabs, all functional, no dead buttons:</p>

<p>Account · Chat · PvP · Trade · Market · Friends · Mail · Guilds · Daily · Events · Achievements · Leaders · History</p>

<h3>Trade rules</h3>

<p>One place per creature. Trade floors enforced: 1★ = 1–5 · 2★ = 5–100 · 3★ = 100–10k · <strong>4★ = gift-only, NEVER listed</strong> · 5★ = 100k–1M. Max 1 million. Player cap 1,000.</p>

<h3>The bot world</h3>

<p><strong>12 seeded bots</strong> — Rin, Boz, Suki, Ash, Wren, Kit, Lila, Moss, Tala, Nils, Ila, Dee — levels 10–95, real creature parties. <strong>3 guilds</strong> (Rok City Elite / Indie Trainers / East Survivors, led by bot-01/02/03). Seeded chat, marketplace listings, open trade offers. Bots auto-accept PvP, auto-respond to trades by star-value comparison, and chatter from a ~30-line pool at 50% chance.</p>

<h3>Systems</h3>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>18 achievements</strong> — First Catch, First Tournament, Rookie/Forest/Reef/Ancient Champion, First Mutant, First Mega, First Ancient, Mystery Hunter, 10/50 Catches, Level 50/100, Rich, Guild Founder, First Trade, First PvP Win</li>
<li><strong>3 live events</strong> — Megalodon Week, Double XP Weekend, Ancient Hunt (date windows computed so one always runs)</li>
<li><strong>Daily rewards</strong> — once per calendar day, streak, 100 cash × streak (cap 1,000) + bandage; ≥3 streak adds a trap, ≥7 adds Chemical X</li>
<li><strong>Cloud saves</strong> — JSON round-trip via <code>saveGame</code> / <code>loadGame</code></li>
</ul>

<hr>

<h2>🕰️ The Three Revision Passes</h2>

<p>The game was built in three revision passes, each upgrading in place:</p>

<h3>Pass 1 — <em>The Foundation</em></h3>

<p>93-dex skeleton, 20 missions, 3 tournaments (24 trainers), 15 encounter areas, 20 maps, 2 TM items, 8 battle backgrounds. Starter-choice logic (<code>assignStarters</code>), mission chaining, <code>TournamentFlow</code>, <code>AREA_BATTLE</code> mapping, <code>G.flags.visited</code>, bicycle + garage, shop sellers, animated title screen.</p>

<h3>Pass 2 — <em>The City &amp; The Choice</em></h3>

<p>47 missions, 7 tournaments (80 trainers), 23 encounter areas, 32 maps, 6 TM items, 12 battle backgrounds, 9 character sprites. Added mutants, Mega Evolution, the Mara/Caleb fork, Rok City, the east, the car + flying transport, NPCs, shops, and the path-exclusive gifts.</p>

<h3>Pass 3 — <em>The Ancient World</em></h3>

<p>59 maps, 10 tournaments (112 trainers), 40 encounter areas, <strong>113 total dex</strong>, 9 TM items, 16 battle backgrounds, 17 backend tables, 13 hub tabs. Added ancients, mysteries, the 75+ world, HM assignments (LIGHT/DIVE from tournaments 8/9; CLIMB/SMASH from side missions), the Long Dark gate, the local-first backend, the hub, and the catch balance fix.</p>

<hr>

<h2>🧪 Quality — 101 Self-Checks, All Passing</h2>

<p><code>tools/self-check.js</code> verifies the whole project. Coverage includes:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li>✅ <code>DEX = 113</code>, <code>ANCIENT_DEX = 15</code>, <code>MYSTERY_DEX = 5</code></li>
<li>✅ <code>ANCIENT_LEARNSETS = 20</code>, ancient stat totals (520 / 580 / 600)</li>
<li>✅ <code>MAPS = 59</code>, <code>ENCOUNTERS = 40</code>, <code>TOURNAMENTS = 10</code>, <code>TM_ITEMS = 9</code></li>
<li>✅ Ancient Crown bracket = 16 / 9 / 4 / 2 / 1</li>
<li>✅ Cup-reward match for all 10 cups</li>
<li>✅ Full pass-3 mission chain + the 38-entry objective-ID map</li>
<li>✅ <code>creature2</code> gifts resolve and are 3-star (with the A02 4-star exception)</li>
<li>✅ Talk objectives name real <code>NPC_DIALOG</code> handlers</li>
<li>✅ Sprite check resolves ancient/mystery paths via <code>creatureSprite()</code></li>
</ul>

<hr>

<h2>📝 Spec Tensions — Resolved &amp; Flagged</h2>

<p>A few doc contradictions were resolved in each pass rather than left ambiguous. The headliners:</p>

<ul style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>Two Maras</strong> — Elder Mara (Haven elder) and Mara (Rok City bazaar owner / resistance leader) are <strong>different people</strong>. The docs never say otherwise.</li>
<li><strong>"The City Tournament" = the Bazaar Brawl</strong> — mission <code>fifthTournament</code>, titled accordingly.</li>
<li><strong>Rok City walkable from start</strong> — the University Games' "unlocks Rok City" is a ceremonial flag only.</li>
<li><strong>TM Focus Beam / Lightning Strike don't exist</strong> — substituted <strong>TM Flash (TM14)</strong> and <strong>TM Sonic Scream (TM15)</strong>.</li>
<li><strong>Ancient Crown arithmetic</strong> — 16+8+4+2+1 = 31, not 32. Added a 9th <code>round16</code> trainer (<em>Relic</em>) to match <code>size: 32</code>.</li>
<li><strong>9th tournament gift</strong> — doc said Steel Crab, but that's only 2★. Substituted <strong>045 Great White Shark Lv85</strong> (3★).</li>
<li><strong>HM LIGHT / DIVE / CLIMB / SMASH</strong> — no doc assigned them. Assigned here: LIGHT = Wasteland War, DIVE = Rok City Championship, CLIMB = <code>climbLesson</code>, SMASH = <code>smashLesson</code>.</li>
<li><strong>"Venom" signature</strong> — <code>SIG_MOVES</code> is keyed by name, so Megarachne's poison Venom also poisons the 4 main-world Venom users. Thematically correct, kept as-is.</li>
<li><strong>Chemical X buyable</strong> — preserved Pass-1 behavior despite its "not stocked in normal shops" flavor.</li>
<li><strong>5★ catch rate</strong> — the original 0.1 made the endgame statistically unbeatable. Raised to <strong>0.22</strong>, plus tranquilizer darts now actually sleep. Documented in the balance-fix section.</li>
</ul>

<p>Two open calls were <strong>not</strong> decided and remain flagged: <em>stars per species vs. per stage</em>, and <em>Chemical X self-mutation</em>.</p>

<hr>

<h2>🚀 Quick Start</h2>

<pre style="display:inline-block;text-align:left;"><code># Serve the game directory with any static server
npx serve metamonsters-game

# Run the full self-check suite
node metamonsters-game/tools/self-check.js
# → 101 checks, ALL CHECKS PASSED</code></pre>

<p>Open <code>index.html</code> in your browser. The title screen preloads 16 battle backgrounds, the Rok City skyline, and 9 character sprites. Click <strong>New Game</strong> to begin.</p>

<p><strong>Save key:</strong> <code>metamonsters_save_v2</code> · <strong>Save version:</strong> 2 · <strong>Backend store:</strong> <code>metamonsters_backend_v1</code></p>

<hr>

<h2>🗂️ Project Layout</h2>

<pre style="display:inline-block;text-align:left;"><code>metamonsters-game/
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
    └── self-check.js        → 101 checks</code></pre>

<p><strong>Loading order matters:</strong> <code>dex → moves → items → missions → tournaments → encounters → mutants → ancients → engine</code>. Boot-checks in <code>main.js</code> enforce it.</p>

<hr>

<h2>⚖️ Design Rules (Non-Negotiable)</h2>

<ol style="list-style-position:inside;text-align:center;display:inline-block;">
<li><strong>Plain JS, one global <code>const</code> per file.</strong> No modules. No imports. No external URLs.</li>
<li><strong>Names, typings, evolutions, moves, items, prices, missions, and tournament data come from the docs</strong> — or from the explicit <code>RULE</code> lines in the schema spec.</li>
<li><strong>No placeholders, no TODOs, no short files.</strong> If a count is off, fix it — do not ship.</li>
<li><strong>Instinct stats are runtime-only.</strong> Never baked into <code>dex.js</code>.</li>
<li><strong>Mutants are wild only in the east, only after the unlock, and never stack with Instinct.</strong></li>
<li><strong>Mega lasts one battle.</strong> <code>unmegaParty()</code> runs at battle end.</li>
<li><strong>Ancients have no mutants and no instinct art.</strong></li>
<li><strong>TMs are tournament-only.</strong> Never in <code>SHOP_STOCK</code>.</li>
<li><strong>Backend is local-first.</strong> Every state move goes through a <code>BACKEND</code> method that updates live <code>G</code> and the backend rows in the same call.</li>
<li><strong>When docs contradict, follow the LATER-dated decision and note it in a comment at the top of the file.</strong></li>
</ol>

<hr>

<h2>🏁 Status</h2>

<p><strong>Complete.</strong> Pass 3 shipped. 101/101 self-checks passing. All ten tournaments wired, all 47 missions chained, all 113 creatures resolvable, all 40 encounter areas mapped, all 59 maps walkable, all 9 TMs teachable, all 18 achievements scannable, all 13 hub tabs functional.</p>

<blockquote>
<p><em>"Chemical X was never the problem. We were."</em></p>
<p>— Elder Mara, probably</p>
</blockquote>

<hr>

<p><strong>METAMONSTERS</strong> · Revision Pass 3 · FINAL · 2026-11-21</p>

</div>
