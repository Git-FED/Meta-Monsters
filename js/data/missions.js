// Metamonsters — MISSIONS (pass 3). 58 entries: 20 pass-1 missions (6 Phase-1: lastStarter,
// firstWood, firstCatch, firstBase, starterPath, firstTournament) + 3 starter-path variants
// (starterPathBear / starterPathWolf / starterPathShark) + 9 Phase-2/bridge missions
// (foreclosure, lawsuitTV, peopleTalking, smallShops, sickAnimals, quietFriendLeaves,
// secondTournament, thirdTournament, labLog) + 2 region-visit missions (coldNorth, coast).
// Sources: METAMONSTERS-STORY-MISSIONS.md (Phase 1 + Phase 2 tables, starter missions table),
// METAMONSTERS-LEVELING.md (XP table: main mission 250 XP at band 1-5, 600 XP at band 5-10,
// 1500 XP at band 10-20; tournament win 50x wild win),
// METAMONSTERS-TOURNAMENTS.md (Rookie Cup reward: 500 cash, 3 nets, 1 trap, unlocks HM SLICE;
// Forest Clash: 1500 cash, 5 traps, TM Bite, unlocks Ant Colony; Reef Rumble: 5000 cash,
// 1 cage, TM Water Jet, unlocks HM SWIM),
// DATA-SCHEMA.md (mission shape, objective types, rewards).
// Doc contradictions resolved:
//  - The story doc lists the Catching skill unlock on BOTH The Last Starter and First Catch.
//    Per DATA-SCHEMA.md's worked example, lastStarter carries unlock "catching"; First Catch
//    instead grants traps (2 traps, 2 nets) and unlock "traps".
//  - First Wood's doc unlock is "Gathering skill, axe" — the axe is a world-building tool, not
//    an item, so the reward is unlock "gathering" only.
//  - firstTournament XP is 1250 (tournament win, LEVELING.md) rather than the 250 main-mission
//    rate, since the mission IS winning a tournament bracket.
//  - starterPathBear's "track" objective in the schema names a battle against a "wildBoar"
//    trainer, but there is no boar creature in the dex. Pass 1 implements it as reaching the
//    hunting ground in the Grizzly Den (reach) and then taking the hunt down (catch) — the
//    story doc's goal is "hunt your first animal, learn to track and take it down".
//  - The Lab Log's abandoned building is not placed by the story doc. Pass 1 places it as a
//    ruined Cyber Tech outpost in the Ember Dunes (the desert center), the closest ruin to
//    the scandal's east — the Old Lab itself is an east-wasteland hidden place (later pass).
// Pass 3 (2026-11-20) adds 11 missions: Phase-4 tournaments (eighthTournament,
// ninthTournament, tenthTournament), 2 side missions (climbLesson, smashLesson — NOT
// in the chain; the coordinator's NPC handlers activate them via setMission), the
// 75+ world chain (the75World, sanctuary, mysterySpino, mysteryQuetz, mysteryTitan,
// mysteryMega, mysteryBat, wholeStory). Chain: coast -> rokCity -> ... -> theChoice,
// then leak or interview; exposure and executive both rejoin at dumpSite; finalBattle
// -> eighthTournament -> ninthTournament -> tenthTournament -> the75World -> sanctuary
// -> mysterySpino -> mysteryQuetz -> mysteryTitan -> mysteryMega -> mysteryBat ->
// wholeStory (the final mission of the game). climbLesson + smashLesson are side
// missions, not in the chain. Tournament-mission rewards mirror their cup rewards
// (cash/items/unlock) per the pass-1 pattern — TournamentFlow.afterWin reads the
// mission reward for payout; creature gifts live ONLY in the mission rewards. Dex 009
// (Alpha Lion) is stars:2, not 3, so the seventhTournament gift uses 012 Alpha Tiger
// (stage 3, stars 3) and the executive gift uses 027 King Cobra (stage 3, stars 3,
// mutant). Dex 075 (Steel Crab) is stars:2, not 3, so the ninthTournament gift uses
// 045 Great White Shark (stage 3, stars 3). The tenthTournament gift is A02 Dire Wolf
// (stars:4 — the Ancient Keeper's gift, the only way to get a 4-star) plus creature2
// 003 Grizzly (stars:3, the tournament prize); creature2 is a NEW pass-3 reward field
// the coordinator's engine supports (engine.afterWin pays creature AND creature2).
// New objective types: "choice" (theChoice only) and mutant catch (theMutants: count 3,
// mutant true). The "giver" field names the NPC that hands the mission out.

const MISSIONS = [
  {
    "id": "lastStarter",
    "phase": 1,
    "name": "The Last Starter",
    "desc": "Meet Marcus and Sofia at the village square, watch them pick their starters first, and take the remaining starter.",
    "objectives": [
      {
        "id": "meet",
        "text": "Meet Marcus and Sofia at the village square",
        "type": "talk",
        "npc": "marcus"
      },
      {
        "id": "watch",
        "text": "Watch Marcus and Sofia pick their starters",
        "type": "talk",
        "npc": "sofia"
      },
      {
        "id": "pick",
        "text": "Take the remaining starter",
        "type": "starter"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 250,
      "unlock": "catching"
    },
    "next": "firstWood"
  },
  {
    "id": "firstWood",
    "phase": 1,
    "name": "First Wood",
    "desc": "Collect 10 wood from trees around the village and learn to gather.",
    "objectives": [
      {
        "id": "gather",
        "text": "Collect 10 wood from trees",
        "type": "gather",
        "item": "wood",
        "count": 10
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 250,
      "unlock": "gathering"
    },
    "next": "firstCatch"
  },
  {
    "id": "firstCatch",
    "phase": 1,
    "name": "First Catch",
    "desc": "Catch 1 wild creature with a trap on the Meadow Route.",
    "objectives": [
      {
        "id": "catch",
        "text": "Catch 1 wild creature with a trap",
        "type": "catch",
        "count": 1
      }
    ],
    "reward": {
      "cash": 0,
      "items": {
        "trap": 2,
        "net": 2
      },
      "xp": 250,
      "unlock": "traps"
    },
    "next": "firstBase"
  },
  {
    "id": "firstBase",
    "phase": 1,
    "name": "First Base",
    "desc": "Build a base from wood at your home plot. Bigger base, more reputation in the area.",
    "objectives": [
      {
        "id": "build",
        "text": "Build a base at the home plot (needs 10 wood)",
        "type": "build",
        "what": "base"
      },
      {
        "id": "place",
        "text": "Place your base on the home plot",
        "type": "reach",
        "map": "homePlot"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 250,
      "unlock": "baseBuilding"
    },
    "next": "starterPath"
  },
  {
    "id": "starterPath",
    "phase": 1,
    "name": "The Starter's Path",
    "desc": "Your starter's first mission — the path depends on which starter you took. Bear: learn to hunt. Wolf: follow the scent. Shark: cross the water.",
    "objectives": [
      {
        "id": "path",
        "text": "Begin your starter's path mission",
        "type": "talk",
        "npc": "marcus"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 250,
      "unlock": "starterSkill"
    },
    "next": "firstTournament"
  },
  {
    "id": "starterPathBear",
    "phase": 1,
    "name": "Learn to Hunt",
    "starter": "bear",
    "desc": "Hunt your first animal with your Bear Cub — learn to track it and take it down.",
    "objectives": [
      {
        "id": "track",
        "text": "Track your first animal in the Grizzly Den hunting ground",
        "type": "reach",
        "map": "grizzly"
      },
      {
        "id": "hunt",
        "text": "Take down your first hunt",
        "type": "catch",
        "count": 1
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 250,
      "unlock": "hunting"
    },
    "next": "firstTournament"
  },
  {
    "id": "starterPathWolf",
    "phase": 1,
    "name": "Follow the Scent",
    "starter": "wolf",
    "desc": "Track a scent trail through the woods with your Wolf Cub to find a lost creature.",
    "objectives": [
      {
        "id": "scent",
        "text": "Follow the scent trail through the woods",
        "type": "reach",
        "map": "woods"
      },
      {
        "id": "find",
        "text": "Find the lost creature at the end of the trail",
        "type": "talk",
        "npc": "lostCreature"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 250,
      "unlock": "tracking"
    },
    "next": "firstTournament"
  },
  {
    "id": "starterPathShark",
    "phase": 1,
    "name": "Cross the Water",
    "starter": "shark",
    "desc": "Travel a small body of water with your Baby Shark — no HM SWIM needed.",
    "objectives": [
      {
        "id": "cross",
        "text": "Cross the small body of water",
        "type": "reach",
        "map": "meadowPond"
      },
      {
        "id": "swim",
        "text": "Reach the far bank",
        "type": "reach",
        "map": "farBank"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 250,
      "unlock": "swimming"
    },
    "next": "firstTournament"
  },
  {
    "id": "firstTournament",
    "phase": 1,
    "name": "The First Tournament",
    "desc": "Win the meadow tournament bracket — the Rookie Cup at the Mirage Oasis (quarterfinal, semifinal, final).",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Rookie Cup at the Mirage Oasis",
        "type": "reach",
        "map": "oasis"
      },
      {
        "id": "rookieCup",
        "text": "Win the Rookie Cup bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 500,
      "items": {
        "net": 3,
        "trap": 1
      },
      "xp": 1250,
      "unlock": "HM SLICE"
    },
    "next": "foreclosure"
  },
  {
    "id": "foreclosure",
    "phase": 2,
    "name": "The Foreclosure",
    "desc": "A shop in Haven Village is closing down — talk to the owner, find out why.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to the shop owner whose store is closing",
        "type": "talk",
        "npc": "shopOwner"
      },
      {
        "id": "why",
        "text": "Ask Elder Mara why the shops are closing",
        "type": "talk",
        "npc": "elder"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "firstCrack"
    },
    "next": "lawsuitTV"
  },
  {
    "id": "lawsuitTV",
    "phase": 2,
    "name": "The Lawsuit on TV",
    "desc": "A lawsuit plays on Rok Tube — watch the news and hear the company's name.",
    "objectives": [
      {
        "id": "watch",
        "text": "Watch the lawsuit on the TV in the Care Hub",
        "type": "talk",
        "npc": "tv"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "cyberTechNamed"
    },
    "next": "peopleTalking"
  },
  {
    "id": "peopleTalking",
    "phase": 2,
    "name": "People Are Talking",
    "desc": "Talk to 5 people who are bashing the company — and hear the rumors about sick animals.",
    "objectives": [
      {
        "id": "elder",
        "text": "Talk to Elder Mara",
        "type": "talk",
        "npc": "elder"
      },
      {
        "id": "ranger",
        "text": "Talk to Ranger Dee",
        "type": "talk",
        "npc": "ranger"
      },
      {
        "id": "finn",
        "text": "Talk to Old Finn",
        "type": "talk",
        "npc": "fisherman"
      },
      {
        "id": "rin",
        "text": "Talk to Shopkeeper Rin",
        "type": "talk",
        "npc": "shopkeeper"
      },
      {
        "id": "caleb",
        "text": "Talk to Caleb",
        "type": "talk",
        "npc": "caleb"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "rumors"
    },
    "next": "smallShops"
  },
  {
    "id": "smallShops",
    "phase": 2,
    "name": "The Small Shops",
    "desc": "Buy from an indie seller, and help a small shop take over a closed storefront.",
    "objectives": [
      {
        "id": "buy",
        "text": "Buy something from indie seller Pippa",
        "type": "talk",
        "npc": "pippa"
      },
      {
        "id": "open",
        "text": "Help Pippa open her shop in the closed storefront",
        "type": "talk",
        "npc": "pippa"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "bazaar"
    },
    "next": "sickAnimals"
  },
  {
    "id": "sickAnimals",
    "phase": 2,
    "name": "The Sick Animals",
    "desc": "Find and heal a sick animal near the east — something strange is in the water.",
    "objectives": [
      {
        "id": "find",
        "text": "Find the sick animal on the east edge of the Meadow Route",
        "type": "talk",
        "npc": "sickAnimal"
      },
      {
        "id": "heal",
        "text": "Heal the sick animal with medicine",
        "type": "talk",
        "npc": "sickAnimal"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "wasteHint"
    },
    "next": "quietFriendLeaves"
  },
  {
    "id": "quietFriendLeaves",
    "phase": 2,
    "name": "The Quiet Friend Leaves",
    "desc": "Say goodbye as Caleb leaves for Rok University — and hear what he believes.",
    "objectives": [
      {
        "id": "goodbye",
        "text": "Say goodbye to Caleb",
        "type": "talk",
        "npc": "caleb"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "university"
    },
    "next": "secondTournament"
  },
  {
    "id": "secondTournament",
    "phase": 1,
    "name": "The Second Tournament",
    "desc": "Win the Forest Clash bracket in the Whispering Woods — quarterfinal, semifinal, final against Sofia.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Forest Clash in the Whispering Woods",
        "type": "reach",
        "map": "forestArena"
      },
      {
        "id": "forestClash",
        "text": "Win the Forest Clash bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 1500,
      "items": {
        "trap": 5,
        "tmBite": 1
      },
      "xp": 3000,
      "unlock": "antColony"
    },
    "next": "thirdTournament"
  },
  {
    "id": "thirdTournament",
    "phase": 2,
    "name": "The Third Tournament",
    "desc": "Win the Reef Rumble bracket at the Coral Reef — the coastal tournament.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Reef Rumble at the Coral Reef",
        "type": "reach",
        "map": "reefArena"
      },
      {
        "id": "reefRumble",
        "text": "Win the Reef Rumble bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 5000,
      "items": {
        "cage": 1,
        "tmWaterJet": 1
      },
      "xp": 7500,
      "unlock": "HM SWIM"
    },
    "next": "labLog"
  },
  {
    "id": "labLog",
    "phase": 2,
    "name": "The Lab Log",
    "desc": "Search an abandoned building in the Ember Dunes and find a company lab log.",
    "objectives": [
      {
        "id": "search",
        "text": "Search the abandoned outpost in the Ember Dunes",
        "type": "reach",
        "map": "ember"
      },
      {
        "id": "read",
        "text": "Read the lab log — Chemical X is named",
        "type": "talk",
        "npc": "labLog"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 1500,
      "unlock": "chemicalX"
    },
    "next": "coldNorth"
  },
  {
    "id": "coldNorth",
    "phase": 1,
    "name": "The Cold North",
    "desc": "Visit the cold places in the north — the Howling Peaks, the Grizzly Den, the Frozen Roost.",
    "objectives": [
      {
        "id": "peaks",
        "text": "Reach the Howling Peaks",
        "type": "reach",
        "map": "howling"
      },
      {
        "id": "den",
        "text": "Reach the Grizzly Den",
        "type": "reach",
        "map": "grizzly"
      },
      {
        "id": "roost",
        "text": "Reach the Frozen Roost",
        "type": "reach",
        "map": "frozen"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "north"
    },
    "next": "coast"
  },
  {
    "id": "coast",
    "phase": 1,
    "name": "The Coast",
    "desc": "Visit the coast and the islands in the south — the Coral Reef, the Tide Pools, Butterfly Island.",
    "objectives": [
      {
        "id": "reef",
        "text": "Reach the Coral Reef",
        "type": "reach",
        "map": "reef"
      },
      {
        "id": "tide",
        "text": "Reach the Tide Pools",
        "type": "reach",
        "map": "tidepools"
      },
      {
        "id": "island",
        "text": "Reach Butterfly Island",
        "type": "reach",
        "map": "butterfly"
      }
    ],
    "reward": {
      "cash": 0,
      "items": {},
      "xp": 600,
      "unlock": "coast"
    },
    "next": "rokCity"
  },
  {
    "id": "rokCity",
    "phase": 3,
    "giver": "elder",
    "name": "Rok City",
    "desc": "Elder Mara sends you to Rok City at last — the towers, the plaza, the university, all of it owned by one company. Walk in with your eyes open: everything here runs on Rok, and Rok is watching.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach Rok City",
        "type": "reach",
        "map": "rokCity"
      }
    ],
    "reward": {
      "cash": 500,
      "xp": 2000
    },
    "next": "universityKids"
  },
  {
    "id": "universityKids",
    "phase": 3,
    "giver": "caleb",
    "name": "The University Kids",
    "desc": "A brawl of drunk Rok University students is spilling out of a campus bar, and the campus guards are looking the other way. Caleb says someone has to step in before somebody's creature gets hurt — and that someone is you.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to a Rok University student about the brawl",
        "type": "talk",
        "npc": "universityStudent"
      },
      {
        "id": "drunkStudents",
        "text": "Break up the brawl — battle the drunk students",
        "type": "battle",
        "trainer": "drunkStudents"
      }
    ],
    "reward": {
      "cash": 1000,
      "xp": 3000
    },
    "next": "corruption"
  },
  {
    "id": "corruption",
    "phase": 3,
    "giver": "cityGuide",
    "name": "The Corruption",
    "desc": "A street dealer in the plaza offers you things no shop will sell, and a city guide pulls you aside to show you how deep it goes — drugs, payoffs, and a company that owns the people meant to stop it. This is the city behind the towers.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to the street dealer in the plaza",
        "type": "talk",
        "npc": "streetDealer"
      },
      {
        "id": "bazaar",
        "text": "Reach the Grand Bazaar",
        "type": "reach",
        "map": "bazaar"
      }
    ],
    "reward": {
      "cash": 1000,
      "xp": 3000
    },
    "next": "flock"
  },
  {
    "id": "flock",
    "phase": 3,
    "giver": "flockOfficer",
    "name": "The Flock",
    "desc": "The police flock drones have been following you since the plaza, and now a flock officer flags you down under the cameras. Rok sees everything in this city — and it has decided you are worth watching.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to the flock officer who flagged you",
        "type": "talk",
        "npc": "flockOfficer"
      },
      {
        "id": "university",
        "text": "Reach the Ivory Tower",
        "type": "reach",
        "map": "university"
      }
    ],
    "reward": {
      "cash": 1500,
      "xp": 4000
    },
    "next": "fourthTournament"
  },
  {
    "id": "fourthTournament",
    "phase": 3,
    "giver": "arenamaster",
    "name": "Desert Heat",
    "desc": "The Arena Master calls you back to the Ember Dunes for the Desert Heat — eight trainers, sand in the air, and reptiles that love the heat. Win it and the Scorpion's Nest opens to you.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Desert Heat at the Ember Dunes arena",
        "type": "reach",
        "map": "emberArena"
      },
      {
        "id": "desertHeat",
        "text": "Win the Desert Heat bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 15000,
      "items": {
        "firstAidKit": 1,
        "tmFireBreath": 1
      },
      "xp": 6000,
      "unlock": "scorpionsNest"
    },
    "next": "fifthTournament"
  },
  {
    "id": "fifthTournament",
    "phase": 3,
    "giver": "arenamaster",
    "name": "The City Tournament",
    // Story doc's "The City Tournament" = the Bazaar Brawl cup.
    "desc": "The Grand Bazaar hosts the city's own bracket — quick hands, city birds, and traders who bet on every round. Win the Bazaar Brawl and the crowd gifts you a Reticulated Python, plus the secret of HM SOAR.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Bazaar Brawl at the Grand Bazaar arena",
        "type": "reach",
        "map": "bazaarArena"
      },
      {
        "id": "bazaarBrawl",
        "text": "Win the Bazaar Brawl bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 30000,
      "items": {
        "snare": 1,
        "tmElectricShock": 1
      },
      "xp": 8000,
      "unlock": "hmSOAR",
      "creature": {
        "dex": "030",
        "level": 35
      }
    },
    "next": "sixthTournament"
  },
  {
    "id": "sixthTournament",
    "phase": 3,
    "giver": "arenamaster",
    "name": "Frost Crown",
    "desc": "At the Frozen Roost, the Frost Crown waits — ice, winter birds, and trainers who have never felt warm. Win it and an Alpha Komodo joins your party, and the Ice Lake opens.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Frost Crown at the Frozen Roost arena",
        "type": "reach",
        "map": "frostArena"
      },
      {
        "id": "frostCrown",
        "text": "Win the Frost Crown bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 60000,
      "items": {
        "coldPack": 2,
        "tmFlash": 1
      },
      "xp": 10000,
      "unlock": "iceLake",
      "creature": {
        "dex": "033",
        "level": 45
      }
    },
    "next": "seventhTournament"
  },
  {
    "id": "seventhTournament",
    "phase": 3,
    "giver": "arenamaster",
    "name": "University Games",
    "desc": "Rok University's best trainers gather for the University Games, and Caleb himself waits at the end of the bracket. Beat the university's champion and an Alpha Tiger joins you — then Mara's offer and Caleb's offer both land on the table.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the University Games at the Ivory Tower arena",
        "type": "reach",
        "map": "universityArena"
      },
      {
        "id": "universityGames",
        "text": "Win the University Games bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 100000,
      "items": {
        "tmSonicScream": 1
      },
      "xp": 12000,
      "unlock": "rokCity",
      "creature": {
        "dex": "012",
        "level": 55
      }
      // Dex 009 (Alpha Lion) is stars:2, not 3 — gift is 012 Alpha Tiger (stage 3, stars:3).
    },
    "next": "theChoice"
  },
  {
    "id": "theChoice",
    "phase": 3,
    "giver": "mara",
    "name": "The Choice",
    // The engine branches to leak (fight) or interview (join) when this completes.
    "desc": "Mara lays it out in the bazaar: fight the system with the resistance, or take Caleb's job at Cyber Tech and climb inside the corruption. Both doors are open. Only one can be walked through — and the story waits until you choose.",
    "objectives": [
      {
        "id": "choice",
        "text": "Choose a side: fight the system, or join the corruption",
        "type": "choice"
      }
    ],
    "reward": {},
    "next": null
  },
  {
    "id": "leak",
    "phase": 3,
    "giver": "mara",
    "name": "The Leak",
    "desc": "Mara hands you the stolen company documents — lab logs, waste manifests, the whole scandal on paper. Get them to the bazaar's news contact before Cyber Tech's flock finds you carrying them.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to Mara about the leak",
        "type": "talk",
        "npc": "mara"
      },
      {
        "id": "bazaar",
        "text": "Reach the Grand Bazaar with the documents",
        "type": "reach",
        "map": "bazaar"
      }
    ],
    "reward": {
      "cash": 2000,
      "xp": 5000
    },
    "next": "indieAlliance"
  },
  {
    "id": "indieAlliance",
    "phase": 3,
    "giver": "mara",
    "name": "The Indie Alliance",
    "desc": "The leak is out, and the little shops are standing together for the first time. Pippa and the bazaar merchants are building an alliance of indie sellers — and they need a trainer the company can't scare.",
    "objectives": [
      {
        "id": "pippa",
        "text": "Talk to Pippa about the indie alliance",
        "type": "talk",
        "npc": "pippa"
      },
      {
        "id": "merchant",
        "text": "Talk to a bazaar merchant about joining the alliance",
        "type": "talk",
        "npc": "bazaarMerchant"
      }
    ],
    "reward": {
      "cash": 3000,
      "xp": 6000
    },
    "next": "securityTeam"
  },
  {
    "id": "securityTeam",
    "phase": 3,
    "giver": "mara",
    "name": "The Security Team",
    "desc": "Cyber Tech sends its security trainers to shut the bazaar down, and Mara points you at them. Beat both teams in the open, in front of the crowd, and the company learns the resistance fights back.",
    "objectives": [
      {
        "id": "secTrainer1",
        "text": "Battle the first Cyber Tech security trainer",
        "type": "battle",
        "trainer": "secTrainer1"
      },
      {
        "id": "secTrainer2",
        "text": "Battle the second Cyber Tech security trainer",
        "type": "battle",
        "trainer": "secTrainer2"
      }
    ],
    "reward": {
      "cash": 5000,
      "xp": 8000
    },
    "next": "facility"
  },
  {
    "id": "facility",
    "phase": 3,
    "giver": "mara",
    "name": "The Facility",
    "desc": "Mara's plan needs Chemical X, and the only supply is inside a Cyber Tech facility. Slip in, get past the guard, and walk out with three doses of the substance that makes Mega Evolution possible.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to Mara about the facility plan",
        "type": "talk",
        "npc": "mara"
      },
      {
        "id": "facilityGuard",
        "text": "Battle the facility guard",
        "type": "battle",
        "trainer": "facilityGuard"
      }
    ],
    "reward": {
      "cash": 5000,
      "items": {
        "chemicalX": 3
      },
      "xp": 10000
    },
    "next": "exposure"
  },
  {
    "id": "exposure",
    "phase": 3,
    "giver": "mara",
    "name": "The Exposure",
    "desc": "The evidence is ready and the whole city is watching Rok Tube. Stand with Mara and the bazaar merchants as the scandal breaks — and the mutant Alpha Wolf of the east, the pack leader, decides it trusts you.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to Mara before the broadcast",
        "type": "talk",
        "npc": "mara"
      },
      {
        "id": "merchant",
        "text": "Talk to a bazaar merchant about the exposure",
        "type": "talk",
        "npc": "bazaarMerchant"
      }
    ],
    "reward": {
      "cash": 10000,
      "xp": 15000,
      "creature": {
        "dex": "006",
        "level": 45,
        "mutant": true
      }
    },
    "next": "dumpSite"
  },
  {
    "id": "interview",
    "phase": 3,
    "giver": "caleb",
    "name": "The Interview",
    "desc": "Caleb vouches for you with Rok, and Cyber Tech offers you a job — bottom rung, real pay, a badge with your name on it. Show up at the university offices and say yes to the company.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to Caleb about the job",
        "type": "talk",
        "npc": "caleb"
      },
      {
        "id": "university",
        "text": "Reach the Ivory Tower offices",
        "type": "reach",
        "map": "university"
      }
    ],
    "reward": {
      "cash": 500,
      "xp": 5000,
      "rank": 1
    },
    "next": "ladder"
  },
  {
    "id": "ladder",
    "phase": 3,
    "giver": "caleb",
    "name": "The Ladder",
    "desc": "The first jobs are small — deliveries, paperwork, smiling at the plaza desk — but every one of them moves you up. Do the company's work well and the promotions come fast.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to Caleb about your next job",
        "type": "talk",
        "npc": "caleb"
      },
      {
        "id": "clerk",
        "text": "Talk to the plaza clerk about company work",
        "type": "talk",
        "npc": "plazaClerk"
      }
    ],
    "reward": {
      "cash": 2000,
      "xp": 6000,
      "rank": 2
    },
    "next": "quietFriendsPath"
  },
  {
    "id": "quietFriendsPath",
    "phase": 3,
    "giver": "caleb",
    "name": "The Quiet Friend's Path",
    "desc": "Caleb walks you through the university's executive track — the quiet friend's own path, the one that leads to the top floor. Even Marcus is watching now, wondering which side you're really on.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to Caleb about the executive track",
        "type": "talk",
        "npc": "caleb"
      },
      {
        "id": "marcus",
        "text": "Talk to Marcus about the path you're on",
        "type": "talk",
        "npc": "marcus"
      }
    ],
    "reward": {
      "cash": 10000,
      "xp": 8000,
      "rank": 3
    },
    "next": "dirtyWork"
  },
  {
    "id": "dirtyWork",
    "phase": 3,
    "giver": "caleb",
    "name": "The Dirty Work",
    "desc": "The company has a leak to silence and a shop to shut down, and the job lands on your desk. Beat the resistance fighter who stands in your way, then report back to Caleb — the money is very good, and the cost is yours to carry.",
    "objectives": [
      {
        "id": "resistanceFighter",
        "text": "Battle the resistance fighter",
        "type": "battle",
        "trainer": "resistanceFighter"
      },
      {
        "id": "talk",
        "text": "Talk to Caleb after the job",
        "type": "talk",
        "npc": "caleb"
      }
    ],
    "reward": {
      "cash": 50000,
      "xp": 10000,
      "rank": 4
    },
    "next": "executive"
  },
  {
    "id": "executive",
    "phase": 3,
    "giver": "caleb",
    "name": "The Executive",
    "desc": "The top floor is yours — a Rok executive, with a mutant King Cobra at your side and five doses of Chemical X in your pocket. Caleb shakes your hand like an equal. The east is waiting, and the company wants it handled.",
    "objectives": [
      {
        "id": "talk",
        "text": "Talk to Caleb about your new office",
        "type": "talk",
        "npc": "caleb"
      },
      {
        "id": "university",
        "text": "Reach the Ivory Tower executive floor",
        "type": "reach",
        "map": "university"
      }
    ],
    "reward": {
      "cash": 200000,
      "xp": 15000,
      "rank": 5,
      "creature": {
        "dex": "027",
        "level": 55,
        "mutant": true
      },
      // Dex 009 (Alpha Lion) is stars:2, not 3 — gift is 027 King Cobra (stage 3, stars:3, mutant).
      "items": {
        "chemicalX": 5
      }
    },
    "next": "dumpSite"
  },
  {
    "id": "dumpSite",
    "phase": 4,
    "giver": "mara",
    "name": "The Dump Site",
    "desc": "Both paths lead here: the guarded dump site in the east, where Cyber Tech buried its waste and its secrets. The warden knows what's in the ground — and what the waste did to the animals that drank from it.",
    "objectives": [
      {
        "id": "wreckyard",
        "text": "Reach the Wreckyard",
        "type": "reach",
        "map": "wreckyard"
      },
      {
        "id": "talk",
        "text": "Talk to the dump warden",
        "type": "talk",
        "npc": "dumpWarden"
      }
    ],
    "reward": {
      "cash": 5000,
      "items": {
        "chemicalX": 2
      },
      "xp": 20000,
      "unlock": [
        "east",
        "mutants"
      ]
    },
    "next": "theEast"
  },
  {
    "id": "theEast",
    "phase": 4,
    "giver": "mara",
    "name": "The East",
    "desc": "Past the dump site, the wasteland opens up — rusted fields, ash flats, and creatures that aren't quite what they were. The east is a whole new game on the other side of the scandal.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the Rust Fields",
        "type": "reach",
        "map": "rustFields"
      }
    ],
    "reward": {
      "cash": 2000,
      "xp": 8000
    },
    "next": "theMutants"
  },
  {
    "id": "theMutants",
    "phase": 4,
    "giver": "mara",
    "name": "The Mutants",
    "desc": "The mutants are victims, not enemies — animals the waste changed, living wild in the east. Catch three of them and learn what the company really made.",
    "objectives": [
      {
        "id": "catch",
        "text": "Catch 3 mutant creatures in the east",
        "type": "catch",
        "count": 3,
        "mutant": true
      }
    ],
    "reward": {
      "cash": 5000,
      "xp": 12000
    },
    "next": "theWreckyard"
  },
  {
    "id": "theWreckyard",
    "phase": 4,
    "giver": "dumpWarden",
    "name": "The Wreckyard",
    "desc": "The Wreckyard is the heart of the scandal — a mountain of the company's rusted machines, picked over by scavengers who know every corner of it. Find the scavenger who knows the way to the cave.",
    "objectives": [
      {
        "id": "wreckyard",
        "text": "Reach the Wreckyard",
        "type": "reach",
        "map": "wreckyard"
      },
      {
        "id": "talk",
        "text": "Talk to the wreckyard scavenger",
        "type": "talk",
        "npc": "wreckyardScavenger"
      }
    ],
    "reward": {
      "cash": 5000,
      "xp": 15000
    },
    "next": "theCave"
  },
  {
    "id": "theCave",
    "phase": 4,
    "giver": "exileScout",
    "name": "The Cave",
    "desc": "The Echo Caves are the gate to the 75+ world — dark, high-level, and guarded by a mutant alpha that answers to no one. Cross the cave and the final confrontation is all that's left.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the Echo Caves",
        "type": "reach",
        "map": "echoCaves"
      },
      {
        "id": "mutantAlpha",
        "text": "Battle the mutant alpha",
        "type": "battle",
        "trainer": "mutantAlpha"
      }
    ],
    "reward": {
      "cash": 10000,
      "xp": 30000
    },
    "next": "finalBattle"
  },
  {
    "id": "finalBattle",
    "phase": 4,
    "giver": "mara",
    "name": "The Final Battle",
    // The coordinator maps finalBoss to rokChampion (fight path) or resistanceLeader (join path).
    "desc": "Everything comes down to this — the scandal, the choice, the east, all of it. One battle decides how the story ends, and who Rok City belongs to when it's over.",
    "objectives": [
      {
        "id": "finalBoss",
        "text": "Battle the final boss",
        "type": "battle",
        "trainer": "finalBoss"
      }
    ],
    "reward": {
      "cash": 50000,
      "xp": 50000
    },
    "next": "eighthTournament"
  },
  {
    "id": "eighthTournament",
    "phase": 4,
    "giver": "arenamaster",
    "name": "Wasteland War",
    "desc": "The Arena Master calls you east to the Rust Fields for the Wasteland War — sixteen trainers, and every one of them fights with mutants. Win it and a mutant Grizzly joins your party, and the way into the Long Dark opens.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Wasteland War at the Rust Fields arena",
        "type": "reach",
        "map": "rustArena"
      },
      {
        "id": "wastelandWar",
        "text": "Win the Wasteland War bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 200000,
      "items": {
        "chemicalX": 1,
        "tmTremor": 1
      },
      "xp": 15000,
      "unlock": "HM LIGHT",
      "creature": {
        "dex": "003",
        "level": 70,
        "mutant": true
      }
      // Dex 003 (Grizzly) is stars:3 — the 3-star mutant creature from the tournaments doc.
    },
    "next": "ninthTournament"
  },
  {
    "id": "ninthTournament",
    "phase": 4,
    "giver": "arenamaster",
    "name": "Rok City Championship",
    "desc": "The whole city watches the Rok City Championship — corporate's biggest bracket, sixteen trainers fighting with the best creatures money can buy. Win it and a Great White Shark joins you, and the Echo Caves open.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Rok City Championship at the Rok City arena",
        "type": "reach",
        "map": "cityArena"
      },
      {
        "id": "rokCityChampionship",
        "text": "Win the Rok City Championship bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 400000,
      "items": {
        "chemicalX": 2,
        "tmMoltenStrike": 1
      },
      "xp": 20000,
      "unlock": "HM DIVE",
      "creature": {
        "dex": "045",
        "level": 85
      }
      // Dex 075 (Steel Crab) is stars:2, not 3 — gift is 045 Great White Shark (stage 3, stars:3, starter final).
    },
    "next": "tenthTournament"
  },
  {
    "id": "tenthTournament",
    "phase": 4,
    "giver": "arenamaster",
    "name": "The Ancient Crown",
    "desc": "The Ancient Crown — thirty-two trainers, the hardest bracket in the game, and the Ancient Keeper waiting at the end with creatures older than the city itself. Win it and the Keeper gifts you a Dire Wolf, and a Grizzly joins as the tournament prize.",
    "objectives": [
      {
        "id": "enter",
        "text": "Enter the Ancient Crown at the Echo Caves arena",
        "type": "reach",
        "map": "caveArena"
      },
      {
        "id": "ancientCrown",
        "text": "Win the Ancient Crown bracket",
        "type": "tournament"
      }
    ],
    "reward": {
      "cash": 500000,
      "items": {
        "chemicalX": 3,
        "tmPressurePoint": 1
      },
      "xp": 30000,
      "unlock": "longDarkExit",
      "creature": {
        "dex": "A02",
        "level": 90
      },
      "creature2": {
        "dex": "003",
        "level": 92
      }
      // Dex A02 (Dire Wolf) is stars:4 — the Ancient Keeper's gift, the only way to get
      // a 4-star (tournaments doc). Dex 003 (Grizzly) is stars:3 — the tournament prize.
      // creature2 is a pass-3 reward field: engine.afterWin pays creature AND creature2.
    },
    "next": "the75World"
  },
  {
    "id": "climbLesson",
    "phase": 3,
    "giver": "caveGuide",
    "name": "The Climb",
    // SIDE mission — not in the main chain. ACTIVATION CONTRACT: the coordinator's NPC
    // handler calls setMission('climbLesson','active') when Kai talks to the Cave Guide
    // with mission theCave done.
    "desc": "The Cave Guide knows the Long Dark's bridge approach — and the climb it takes to reach it. Ask him how to get up there.",
    "objectives": [
      {
        "id": "talk",
        "text": "Ask the Cave Guide about the climb",
        "type": "talk",
        "npc": "caveGuide"
      }
    ],
    "reward": {
      "unlock": "HM CLIMB",
      "xp": 500
    },
    "next": null
  },
  {
    "id": "smashLesson",
    "phase": 3,
    "giver": "hollowKeeper",
    "name": "The Blocked Passages",
    // SIDE mission — not in the main chain. ACTIVATION CONTRACT: the coordinator's NPC
    // handler calls setMission('smashLesson','active') when Kai talks to the Hollow
    // Keeper with mission theEast done.
    "desc": "The Hollow Keeper knows which passages in the east are blocked — and how to clear them. Ask him about the blocked passages.",
    "objectives": [
      {
        "id": "talk",
        "text": "Ask the Hollow Keeper about the blocked passages",
        "type": "talk",
        "npc": "hollowKeeper"
      }
    ],
    "reward": {
      "unlock": "HM SMASH",
      "xp": 500
    },
    "next": null
  },
  {
    "id": "the75World",
    "phase": 4,
    "giver": "exileScout",
    "name": "The 75+ World",
    "desc": "Beyond the cave lies the world built for 75+ players — ancient creatures, mystery creatures, and places no map has ever shown. Cross the Long Dark and step into it.",
    "objectives": [
      {
        "id": "reach",
        "text": "Cross the Long Dark and step into the ancient world",
        "type": "reach",
        "map": "rexBadlands"
      }
    ],
    "reward": {},
    "next": "sanctuary"
  },
  {
    "id": "sanctuary",
    "phase": 4,
    "giver": "exileScout",
    "name": "The Sanctuary",
    "desc": "Somewhere in the 75+ world, the exiles say, there is a sanctuary — a safe place at the end of the wasteland. Reach it, in the heart of the badlands, and meet the exile leader.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the Sanctuary in the heart of the badlands",
        "type": "reach",
        "map": "sanctuary"
      },
      {
        "id": "talk",
        "text": "Meet the exile leader",
        "type": "talk",
        "npc": "exileLeader"
      }
    ],
    "reward": {},
    "next": "mysterySpino"
  },
  {
    "id": "mysterySpino",
    "phase": 4,
    "giver": "exileLeader",
    "name": "The Deep River",
    "desc": "The exiles say a Spinosaurus hunts the Deep River, south of the badlands — follow the fish, and when the river goes quiet, it is near. It only comes out at dusk.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the Deep River",
        "type": "reach",
        "map": "deepRiver"
      },
      {
        "id": "catch",
        "text": "Catch the Spinosaurus",
        "type": "catch",
        "dex": "M1",
        "count": 1
      }
    ],
    "reward": {
      "xp": 5000
    },
    "next": "mysteryQuetz"
  },
  {
    "id": "mysteryQuetz",
    "phase": 4,
    "giver": "exileLeader",
    "name": "The High Peaks",
    "desc": "A Quetzalcoatlus flies the High Peaks above the Pterodactyl Cliffs — the biggest flying animal in the game. It only flies at dawn, and its shadow is how you know it is above you.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the High Peaks",
        "type": "reach",
        "map": "highPeaks"
      },
      {
        "id": "catch",
        "text": "Catch the Quetzalcoatlus",
        "type": "catch",
        "dex": "M2",
        "count": 1
      }
    ],
    "reward": {
      "xp": 5000
    },
    "next": "mysteryTitan"
  },
  {
    "id": "mysteryTitan",
    "phase": 4,
    "giver": "exileLeader",
    "name": "The Burning Marsh",
    "desc": "A Titanoboa coils in the hottest part of the Burning Marsh, east of the badlands — steam rises off the water where it waits. You need Heat sense to track it, and level 85 or higher to survive the fight.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the Burning Marsh",
        "type": "reach",
        "map": "burningMarsh"
      },
      {
        "id": "catch",
        "text": "Catch the Titanoboa",
        "type": "catch",
        "dex": "M3",
        "count": 1
      }
    ],
    "reward": {
      "xp": 5000
    },
    "next": "mysteryMega"
  },
  {
    "id": "mysteryMega",
    "phase": 4,
    "giver": "exileLeader",
    "name": "The Deep Forest",
    "desc": "A Megatherium — a giant sloth the size of a house — lives in the Deep Forest west of the cliffs. It is slow, but it can knock down trees. Follow the fruit trail the exiles leave out for it.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the Deep Forest",
        "type": "reach",
        "map": "deepForest"
      },
      {
        "id": "catch",
        "text": "Catch the Megatherium",
        "type": "catch",
        "dex": "M4",
        "count": 1
      }
    ],
    "reward": {
      "xp": 5000
    },
    "next": "mysteryBat"
  },
  {
    "id": "mysteryBat",
    "phase": 4,
    "giver": "exileLeader",
    "name": "The Dark Caves",
    "desc": "A Giant Vampire Bat hunts the Dark Caves under the badlands in total darkness — the ancestor of the main world's Vampire Bat. You cannot see it. You have to listen for it.",
    "objectives": [
      {
        "id": "reach",
        "text": "Reach the Dark Caves",
        "type": "reach",
        "map": "darkCaves"
      },
      {
        "id": "catch",
        "text": "Catch the Giant Vampire Bat",
        "type": "catch",
        "dex": "M5",
        "count": 1
      }
    ],
    "reward": {
      "xp": 5000
    },
    "next": "wholeStory"
  },
  {
    "id": "wholeStory",
    "phase": 4,
    "giver": "exileLeader",
    "name": "The Whole Truth",
    "desc": "Five mystery creatures caught, and the exiles' leader is ready to tell it all — the whole truth about Chemical X, the company, and what really happened out here.",
    "objectives": [
      {
        "id": "talk",
        "text": "Hear the whole truth about Chemical X from the exile leader",
        "type": "talk",
        "npc": "exileLeader"
      }
    ],
    "reward": {
      "xp": 10000,
      "cash": 50000
    },
    "next": null
  }
];
