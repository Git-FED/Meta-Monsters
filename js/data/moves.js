// Metamonsters v1 — MOVES. 95 moves total: 36 category + 28 sense + 8 HM + 14 SM + 6 X + 3 starter-rare.
// Sources: METAMONSTERS-MOVES.md (all moves, powers, effects, TM01-TM20), METAMONSTERS-BATTLE-SYSTEM.md
// (CAT_CHART and SENSE_CHART, exactly as written), DATA-SCHEMA.md (learnset RULES, signature resolution).
// LEARNSETS: every creature gets sig (Lv 1) + own-category damaging move (Lv 5) + own-sense
// damaging move (Lv 10) + second own-category damaging move (Lv 15). Starters add their rare
// move as a 5th entry at final-evolution level (Lv 36 Grizzly/Alpha Wolf, Lv 38 Great White Shark).
// SIG_MOVES resolves EVERY signature in the dex per the schema rule: attack-implying signatures
// are power 65, kind "category", type = the creature's own category; utility signatures are
// power null with the resolved effect (def/spd/eva +1, alwaysHit, heal25, or a foe debuff).
// Doc contradictions resolved:
//  - CAT_CHART: the battle-system table lists Fish strong vs Crustacean AND weak vs Crustacean,
//    Crustacean strong vs Fish AND weak vs Fish, and Mollusk strong vs Crustacean AND weak vs
//    Crustacean. A nested map cannot hold both values for one key, so the 2x (strong) entries
//    win here and the weak-side entries are recorded in the comment above CAT_CHART.
//  - SM moves take the type of the creature using them (doc rule), so they are stored with
//    type "Mutation" and the engine substitutes the user's type at runtime. X moves are stored
//    with type "Chemical X" per the doc.
//  - "May poison"/"May paralyze"/"May burn" effects use chance 0.3 (schema example);
//    effects the doc states without a chance ("Burns the foe", "Paralyzes the foe",
//    "Floods the field with venom, poisons", "Spills waste, poisons") use chance 1.

const MOVES = {
  "bite": {
    "id": "bite",
    "name": "Bite",
    "type": "Mammal",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "A sharp bite.",
    "tm": "TM01"
  },
  "clawSlash": {
    "id": "clawSlash",
    "name": "Claw Slash",
    "type": "Mammal",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "Rakes the foe with claws.",
    "tm": "TM02"
  },
  "tackle": {
    "id": "tackle",
    "name": "Tackle",
    "type": "Mammal",
    "kind": "category",
    "power": 50,
    "effect": null,
    "desc": "A basic body slam."
  },
  "roar": {
    "id": "roar",
    "name": "Roar",
    "type": "Mammal",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "atk",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A mighty roar that lowers the foe's Attack."
  },
  "peck": {
    "id": "peck",
    "name": "Peck",
    "type": "Bird",
    "kind": "category",
    "power": 50,
    "effect": null,
    "desc": "A sharp peck."
  },
  "wingAttack": {
    "id": "wingAttack",
    "name": "Wing Attack",
    "type": "Bird",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "Strikes with stiff wings.",
    "tm": "TM03"
  },
  "diveBomb": {
    "id": "diveBomb",
    "name": "Dive Bomb",
    "type": "Bird",
    "kind": "category",
    "power": 80,
    "effect": null,
    "desc": "Dives from the sky onto the foe.",
    "tm": "TM04"
  },
  "screech": {
    "id": "screech",
    "name": "Screech",
    "type": "Bird",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "def",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A piercing screech that lowers the foe's Defense."
  },
  "constrict": {
    "id": "constrict",
    "name": "Constrict",
    "type": "Reptile",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "Squeezes the foe tight."
  },
  "venomBite": {
    "id": "venomBite",
    "name": "Venom Bite",
    "type": "Reptile",
    "kind": "category",
    "power": 70,
    "effect": {
      "status": "poison",
      "chance": 0.3
    },
    "desc": "A venomous bite. May poison.",
    "tm": "TM05"
  },
  "tailWhip": {
    "id": "tailWhip",
    "name": "Tail Whip",
    "type": "Reptile",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "def",
      "stages": -1,
      "target": "foe"
    },
    "desc": "Wags the tail, lowering the foe's Defense."
  },
  "scaleArmor": {
    "id": "scaleArmor",
    "name": "Scale Armor",
    "type": "Reptile",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Hardens its scales, raising your Defense."
  },
  "tongueLash": {
    "id": "tongueLash",
    "name": "Tongue Lash",
    "type": "Amphibian",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "Whips the foe with a long tongue."
  },
  "poisonSkin": {
    "id": "poisonSkin",
    "name": "Poison Skin",
    "type": "Amphibian",
    "kind": "category",
    "power": 70,
    "effect": {
      "status": "poison",
      "chance": 0.3
    },
    "desc": "Oozes poison onto the foe. May poison."
  },
  "croak": {
    "id": "croak",
    "name": "Croak",
    "type": "Amphibian",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "atk",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A deep croak that lowers the foe's Attack."
  },
  "leapAttack": {
    "id": "leapAttack",
    "name": "Leap Attack",
    "type": "Amphibian",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "Leaps high and crashes down on the foe."
  },
  "waterJet": {
    "id": "waterJet",
    "name": "Water Jet",
    "type": "Fish",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "Blasts the foe with a jet of water.",
    "tm": "TM06"
  },
  "finSlash": {
    "id": "finSlash",
    "name": "Fin Slash",
    "type": "Fish",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "Slashes with a sharp fin.",
    "tm": "TM07"
  },
  "bubbleBlast": {
    "id": "bubbleBlast",
    "name": "Bubble Blast",
    "type": "Fish",
    "kind": "category",
    "power": 50,
    "effect": null,
    "desc": "Bursts bubbles at the foe."
  },
  "tailSlam": {
    "id": "tailSlam",
    "name": "Tail Slam",
    "type": "Fish",
    "kind": "category",
    "power": 80,
    "effect": null,
    "desc": "Slams the foe with a powerful tail."
  },
  "sting": {
    "id": "sting",
    "name": "Sting",
    "type": "Insect",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "Stings the foe.",
    "tm": "TM08"
  },
  "swarmAttack": {
    "id": "swarmAttack",
    "name": "Swarm Attack",
    "type": "Insect",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "The swarm descends on the foe.",
    "tm": "TM09"
  },
  "webTrap": {
    "id": "webTrap",
    "name": "Web Trap",
    "type": "Insect",
    "kind": "category",
    "power": null,
    "effect": {
      "special": "trap"
    },
    "desc": "Sticky webbing traps the foe."
  },
  "buzz": {
    "id": "buzz",
    "name": "Buzz",
    "type": "Insect",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "acc",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A maddening buzz that lowers the foe's accuracy."
  },
  "poisonFang": {
    "id": "poisonFang",
    "name": "Poison Fang",
    "type": "Arachnid",
    "kind": "category",
    "power": 70,
    "effect": {
      "status": "poison",
      "chance": 0.3
    },
    "desc": "A fang strike. May poison.",
    "tm": "TM10"
  },
  "webShot": {
    "id": "webShot",
    "name": "Web Shot",
    "type": "Arachnid",
    "kind": "category",
    "power": 50,
    "effect": {
      "stat": "spd",
      "stages": -1,
      "target": "foe"
    },
    "desc": "Sticky webbing slows the foe.",
    "tm": "TM11"
  },
  "pincerGrip": {
    "id": "pincerGrip",
    "name": "Pincer Grip",
    "type": "Arachnid",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "Clamps down with pincers."
  },
  "burrow": {
    "id": "burrow",
    "name": "Burrow",
    "type": "Arachnid",
    "kind": "category",
    "power": null,
    "effect": {
      "special": "dig"
    },
    "desc": "Digs underground, dodges, then strikes."
  },
  "clawCrush": {
    "id": "clawCrush",
    "name": "Claw Crush",
    "type": "Crustacean",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "Crushes the foe in a mighty claw.",
    "tm": "TM12"
  },
  "shellShield": {
    "id": "shellShield",
    "name": "Shell Shield",
    "type": "Crustacean",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Tucks into its shell, raising your Defense."
  },
  "bubbleBeam": {
    "id": "bubbleBeam",
    "name": "Bubble Beam",
    "type": "Crustacean",
    "kind": "category",
    "power": 60,
    "effect": null,
    "desc": "A beam of bubbles strikes the foe."
  },
  "snapClaw": {
    "id": "snapClaw",
    "name": "Snap Claw",
    "type": "Crustacean",
    "kind": "category",
    "power": 80,
    "effect": null,
    "desc": "A snapping claw strike."
  },
  "inkBlast": {
    "id": "inkBlast",
    "name": "Ink Blast",
    "type": "Mollusk",
    "kind": "category",
    "power": 60,
    "effect": {
      "stat": "acc",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A blast of ink that lowers the foe's accuracy.",
    "tm": "TM13"
  },
  "tentacleWhip": {
    "id": "tentacleWhip",
    "name": "Tentacle Whip",
    "type": "Mollusk",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "Whips the foe with a tentacle."
  },
  "suctionGrip": {
    "id": "suctionGrip",
    "name": "Suction Grip",
    "type": "Mollusk",
    "kind": "category",
    "power": 50,
    "effect": null,
    "desc": "Grabs the foe with suction cups."
  },
  "camouflage": {
    "id": "camouflage",
    "name": "Camouflage",
    "type": "Mollusk",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Blends into the surroundings, raising your evasion."
  },
  "flash": {
    "id": "flash",
    "name": "Flash",
    "type": "Sight",
    "kind": "sense",
    "power": null,
    "effect": {
      "stat": "acc",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A blinding flash that lowers the foe's accuracy.",
    "tm": "TM14"
  },
  "glare": {
    "id": "glare",
    "name": "Glare",
    "type": "Sight",
    "kind": "sense",
    "power": null,
    "effect": {
      "status": "paralysis",
      "chance": 0.3
    },
    "desc": "A cold stare. May paralyze."
  },
  "focusBeam": {
    "id": "focusBeam",
    "name": "Focus Beam",
    "type": "Sight",
    "kind": "sense",
    "power": 80,
    "effect": null,
    "desc": "A beam of focused light."
  },
  "laserEyes": {
    "id": "laserEyes",
    "name": "Laser Eyes",
    "type": "Sight",
    "kind": "sense",
    "power": 90,
    "effect": null,
    "desc": "Burning beams from the eyes."
  },
  "sonicScream": {
    "id": "sonicScream",
    "name": "Sonic Scream",
    "type": "Hearing",
    "kind": "sense",
    "power": 70,
    "effect": null,
    "desc": "A scream that shakes the air.",
    "tm": "TM15"
  },
  "echoBlast": {
    "id": "echoBlast",
    "name": "Echo Blast",
    "type": "Hearing",
    "kind": "sense",
    "power": 60,
    "effect": null,
    "desc": "A blast of echoing sound."
  },
  "deafeningRoar": {
    "id": "deafeningRoar",
    "name": "Deafening Roar",
    "type": "Hearing",
    "kind": "sense",
    "power": 80,
    "effect": {
      "stat": "atk",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A roar so loud it lowers the foe's Attack."
  },
  "silence": {
    "id": "silence",
    "name": "Silence",
    "type": "Hearing",
    "kind": "sense",
    "power": null,
    "effect": {
      "special": "soundblock"
    },
    "desc": "Silences the area, blocking sound moves."
  },
  "poisonGas": {
    "id": "poisonGas",
    "name": "Poison Gas",
    "type": "Smell",
    "kind": "sense",
    "power": 60,
    "effect": {
      "status": "poison",
      "chance": 0.3
    },
    "desc": "A cloud of poison gas. May poison.",
    "tm": "TM16"
  },
  "sweetScent": {
    "id": "sweetScent",
    "name": "Sweet Scent",
    "type": "Smell",
    "kind": "sense",
    "power": null,
    "effect": {
      "stat": "eva",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A sweet scent that lowers the foe's evasion."
  },
  "stinkBomb": {
    "id": "stinkBomb",
    "name": "Stink Bomb",
    "type": "Smell",
    "kind": "sense",
    "power": 70,
    "effect": {
      "stat": "acc",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A foul stench that lowers the foe's accuracy."
  },
  "trackingScent": {
    "id": "trackingScent",
    "name": "Tracking Scent",
    "type": "Smell",
    "kind": "sense",
    "power": null,
    "effect": {
      "special": "sureHitNext"
    },
    "desc": "Locks onto the foe's scent — your next attack never misses."
  },
  "sonarPulse": {
    "id": "sonarPulse",
    "name": "Sonar Pulse",
    "type": "Echolocation",
    "kind": "sense",
    "power": 60,
    "effect": null,
    "desc": "A pulse of sound that maps the foe.",
    "tm": "TM17"
  },
  "echoWave": {
    "id": "echoWave",
    "name": "Echo Wave",
    "type": "Echolocation",
    "kind": "sense",
    "power": 70,
    "effect": null,
    "desc": "A rolling wave of echoes."
  },
  "soundBurst": {
    "id": "soundBurst",
    "name": "Sound Burst",
    "type": "Echolocation",
    "kind": "sense",
    "power": 80,
    "effect": null,
    "desc": "A burst of focused sound."
  },
  "blindSpot": {
    "id": "blindSpot",
    "name": "Blind Spot",
    "type": "Echolocation",
    "kind": "sense",
    "power": null,
    "effect": {
      "special": "pierce"
    },
    "desc": "Strikes from the foe's blind spot, hitting through evasion."
  },
  "electricShock": {
    "id": "electricShock",
    "name": "Electric Shock",
    "type": "Electroreception",
    "kind": "sense",
    "power": 70,
    "effect": {
      "status": "paralysis",
      "chance": 0.3
    },
    "desc": "A jolt of electricity. May paralyze.",
    "tm": "TM18"
  },
  "staticField": {
    "id": "staticField",
    "name": "Static Field",
    "type": "Electroreception",
    "kind": "sense",
    "power": null,
    "effect": {
      "status": "paralysis",
      "chance": 1
    },
    "desc": "A crackling field that paralyzes the foe."
  },
  "lightningStrike": {
    "id": "lightningStrike",
    "name": "Lightning Strike",
    "type": "Electroreception",
    "kind": "sense",
    "power": 90,
    "effect": null,
    "desc": "A bolt of lightning from above."
  },
  "surge": {
    "id": "surge",
    "name": "Surge",
    "type": "Electroreception",
    "kind": "sense",
    "power": 60,
    "effect": null,
    "desc": "A surge of electric current."
  },
  "fireBreath": {
    "id": "fireBreath",
    "name": "Fire Breath",
    "type": "Heat",
    "kind": "sense",
    "power": 80,
    "effect": {
      "status": "burn",
      "chance": 0.3
    },
    "desc": "Breathes fire. May burn.",
    "tm": "TM19"
  },
  "heatWave": {
    "id": "heatWave",
    "name": "Heat Wave",
    "type": "Heat",
    "kind": "sense",
    "power": 70,
    "effect": {
      "status": "burn",
      "chance": 0.3
    },
    "desc": "A wave of searing heat. May burn."
  },
  "burn": {
    "id": "burn",
    "name": "Burn",
    "type": "Heat",
    "kind": "sense",
    "power": 60,
    "effect": {
      "status": "burn",
      "chance": 1
    },
    "desc": "Sets the foe alight — burns the foe."
  },
  "moltenStrike": {
    "id": "moltenStrike",
    "name": "Molten Strike",
    "type": "Heat",
    "kind": "sense",
    "power": 90,
    "effect": null,
    "desc": "A strike of molten heat."
  },
  "vibration": {
    "id": "vibration",
    "name": "Vibration",
    "type": "Touch",
    "kind": "sense",
    "power": 60,
    "effect": null,
    "desc": "A shaking vibration through the ground."
  },
  "tremor": {
    "id": "tremor",
    "name": "Tremor",
    "type": "Touch",
    "kind": "sense",
    "power": 70,
    "effect": null,
    "desc": "A tremor that shakes the foe.",
    "tm": "TM20"
  },
  "pressurePoint": {
    "id": "pressurePoint",
    "name": "Pressure Point",
    "type": "Touch",
    "kind": "sense",
    "power": 80,
    "effect": {
      "special": "highCrit"
    },
    "desc": "Strikes a pressure point. High crit chance."
  },
  "sensitiveStrike": {
    "id": "sensitiveStrike",
    "name": "Sensitive Strike",
    "type": "Touch",
    "kind": "sense",
    "power": 50,
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "A precise strike that never misses."
  },
  "hmSlice": {
    "id": "hmSlice",
    "name": "HM SLICE",
    "type": "Reptile",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "Cuts blocking vines and brush.",
    "field": "Cuts blocking vines and brush, opens paths"
  },
  "hmSoar": {
    "id": "hmSoar",
    "name": "HM SOAR",
    "type": "Bird",
    "kind": "category",
    "power": null,
    "effect": null,
    "desc": "Fly to towns you have already visited.",
    "field": "Fly to visited towns"
  },
  "hmSwim": {
    "id": "hmSwim",
    "name": "HM SWIM",
    "type": "Fish",
    "kind": "category",
    "power": null,
    "effect": null,
    "desc": "Cross large bodies of water.",
    "field": "Cross large bodies of water"
  },
  "hmLift": {
    "id": "hmLift",
    "name": "HM LIFT",
    "type": "Mammal",
    "kind": "category",
    "power": 80,
    "effect": null,
    "desc": "Move heavy objects blocking the way.",
    "field": "Move heavy objects"
  },
  "hmLight": {
    "id": "hmLight",
    "name": "HM LIGHT",
    "type": "Sight",
    "kind": "sense",
    "power": null,
    "effect": null,
    "desc": "Lights dark caves.",
    "field": "Lights dark caves"
  },
  "hmSmash": {
    "id": "hmSmash",
    "name": "HM SMASH",
    "type": "Mammal",
    "kind": "category",
    "power": 70,
    "effect": null,
    "desc": "Break cracked rocks.",
    "field": "Break cracked rocks"
  },
  "hmDive": {
    "id": "hmDive",
    "name": "HM DIVE",
    "type": "Fish",
    "kind": "category",
    "power": 80,
    "effect": null,
    "desc": "Dive underwater.",
    "field": "Dive underwater"
  },
  "hmClimb": {
    "id": "hmClimb",
    "name": "HM CLIMB",
    "type": "Mammal",
    "kind": "category",
    "power": null,
    "effect": null,
    "desc": "Climb waterfalls and cliffs.",
    "field": "Climb waterfalls and cliffs"
  },
  "mutantRage": {
    "id": "mutantRage",
    "name": "Mutant Rage",
    "type": "Mutation",
    "kind": "category",
    "power": 100,
    "effect": {
      "special": "hitTwice"
    },
    "desc": "A wild flurry, hits twice.",
    "sm": "SM01"
  },
  "doubleStrike": {
    "id": "doubleStrike",
    "name": "Double Strike",
    "type": "Mutation",
    "kind": "category",
    "power": 90,
    "effect": {
      "special": "hitTwice"
    },
    "desc": "Both heads attack.",
    "sm": "SM02"
  },
  "humanoidMind": {
    "id": "humanoidMind",
    "name": "Humanoid Mind",
    "type": "Mutation",
    "kind": "category",
    "power": null,
    "effect": {
      "stat": "atk",
      "stages": -1,
      "target": "foe"
    },
    "desc": "Outsmarts the foe, lowering its Attack and Defense.",
    "sm": "SM03"
  },
  "thirdEye": {
    "id": "thirdEye",
    "name": "Third Eye",
    "type": "Mutation",
    "kind": "category",
    "power": 80,
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "The third eye sees all. Never misses.",
    "sm": "SM04"
  },
  "extraLimbStrike": {
    "id": "extraLimbStrike",
    "name": "Extra Limb Strike",
    "type": "Mutation",
    "kind": "category",
    "power": 90,
    "effect": {
      "special": "multiHit"
    },
    "desc": "Extra limbs strike, hits 2-3 times.",
    "sm": "SM05"
  },
  "giantSlam": {
    "id": "giantSlam",
    "name": "Giant Slam",
    "type": "Mutation",
    "kind": "category",
    "power": 110,
    "effect": null,
    "desc": "A huge body slam.",
    "sm": "SM06"
  },
  "spikeStorm": {
    "id": "spikeStorm",
    "name": "Spike Storm",
    "type": "Mutation",
    "kind": "category",
    "power": 90,
    "effect": {
      "special": "hitAll"
    },
    "desc": "Spikes fly, hits all foes.",
    "sm": "SM07"
  },
  "venomFlood": {
    "id": "venomFlood",
    "name": "Venom Flood",
    "type": "Mutation",
    "kind": "category",
    "power": 90,
    "effect": {
      "status": "poison",
      "chance": 1
    },
    "desc": "Floods the field with venom, poisons.",
    "sm": "SM08"
  },
  "armorBreak": {
    "id": "armorBreak",
    "name": "Armor Break",
    "type": "Mutation",
    "kind": "category",
    "power": 80,
    "effect": {
      "stat": "def",
      "stages": -2,
      "target": "foe"
    },
    "desc": "Shatters the foe's Defense.",
    "sm": "SM09"
  },
  "wingStorm": {
    "id": "wingStorm",
    "name": "Wing Storm",
    "type": "Mutation",
    "kind": "category",
    "power": 90,
    "effect": null,
    "desc": "Wings whip up a storm.",
    "sm": "SM10"
  },
  "fusionBlast": {
    "id": "fusionBlast",
    "name": "Fusion Blast",
    "type": "Mutation",
    "kind": "category",
    "power": 100,
    "effect": null,
    "desc": "A fused power blast.",
    "sm": "SM11"
  },
  "zombieBite": {
    "id": "zombieBite",
    "name": "Zombie Bite",
    "type": "Mutation",
    "kind": "category",
    "power": 80,
    "effect": {
      "status": "infection",
      "chance": 1
    },
    "desc": "A bite that infects (inflicts infection).",
    "sm": "SM12"
  },
  "ancientRoar": {
    "id": "ancientRoar",
    "name": "Ancient Roar",
    "type": "Mutation",
    "kind": "category",
    "power": 100,
    "effect": null,
    "desc": "The roar of the ancient world.",
    "sm": "SM13"
  },
  "primalPower": {
    "id": "primalPower",
    "name": "Primal Power",
    "type": "Mutation",
    "kind": "category",
    "power": 120,
    "effect": null,
    "desc": "Raw primal force.",
    "sm": "SM14"
  },
  "chemicalBurst": {
    "id": "chemicalBurst",
    "name": "Chemical Burst",
    "type": "Chemical X",
    "kind": "category",
    "power": 80,
    "effect": {
      "status": "poison",
      "chance": 0.3
    },
    "desc": "A burst of Chemical X. May poison.",
    "x": "X1"
  },
  "toxicWave": {
    "id": "toxicWave",
    "name": "Toxic Wave",
    "type": "Chemical X",
    "kind": "category",
    "power": 90,
    "effect": null,
    "desc": "A wave of toxic waste.",
    "x": "X2"
  },
  "nuclearFallout": {
    "id": "nuclearFallout",
    "name": "Nuclear Fallout",
    "type": "Chemical X",
    "kind": "category",
    "power": 120,
    "effect": {
      "special": "recoil"
    },
    "desc": "Massive damage, hurts the user too.",
    "x": "X3"
  },
  "wasteSpill": {
    "id": "wasteSpill",
    "name": "Waste Spill",
    "type": "Chemical X",
    "kind": "category",
    "power": 70,
    "effect": {
      "status": "poison",
      "chance": 1
    },
    "desc": "Spills waste, poisons and lowers Defense.",
    "x": "X4"
  },
  "mutantSurge": {
    "id": "mutantSurge",
    "name": "Mutant Surge",
    "type": "Chemical X",
    "kind": "category",
    "power": 100,
    "effect": {
      "stat": "atk",
      "stages": 1,
      "target": "self"
    },
    "desc": "A surge of mutation energy, raises your Attack.",
    "x": "X5"
  },
  "chemicalStorm": {
    "id": "chemicalStorm",
    "name": "Chemical Storm",
    "type": "Chemical X",
    "kind": "category",
    "power": 110,
    "effect": null,
    "desc": "A storm of Chemical X.",
    "x": "X6"
  },
  "grizzlysRage": {
    "id": "grizzlysRage",
    "name": "Grizzly's Rage",
    "type": "Mammal",
    "kind": "category",
    "power": 120,
    "effect": {
      "stat": "def",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A roar so loud it shakes the ground, lowers the foe's Defense."
  },
  "alphasCommand": {
    "id": "alphasCommand",
    "name": "Alpha's Command",
    "type": "Mammal",
    "kind": "category",
    "power": 120,
    "effect": {
      "stat": "atk",
      "stages": 1,
      "target": "self"
    },
    "desc": "The alpha commands the pack, raises your whole team's Attack."
  },
  "greatWhiteTerror": {
    "id": "greatWhiteTerror",
    "name": "Great White Terror",
    "type": "Fish",
    "kind": "category",
    "power": 120,
    "effect": {
      "special": "highCrit"
    },
    "desc": "A terror strike from the deep, high crit chance."
  }
};

const CAT_CHART = {
  "Mammal": {
    "Bird": 2,
    "Fish": 2,
    "Reptile": 0.5,
    "Arachnid": 0.5
  },
  "Bird": {
    "Insect": 2,
    "Reptile": 2,
    "Mammal": 0.5,
    "Arachnid": 0.5
  },
  "Reptile": {
    "Mammal": 2,
    "Arachnid": 2,
    "Bird": 0.5
  },
  "Amphibian": {
    "Insect": 2,
    "Mollusk": 2,
    "Fish": 0.5
  },
  "Fish": {
    "Crustacean": 2,
    "Amphibian": 2,
    "Mammal": 0.5,
    "Mollusk": 0.5
  },
  "Insect": {
    "Mollusk": 2,
    "Crustacean": 2,
    "Bird": 0.5,
    "Amphibian": 0.5,
    "Arachnid": 0.5
  },
  "Arachnid": {
    "Insect": 2,
    "Bird": 2,
    "Reptile": 0.5
  },
  "Crustacean": {
    "Mollusk": 2,
    "Fish": 2,
    "Insect": 0.5
  },
  "Mollusk": {
    "Fish": 2,
    "Crustacean": 2,
    "Amphibian": 0.5,
    "Insect": 0.5
  }
};

const SENSE_CHART = {
  "Sight": {
    "Hearing": 2,
    "Echolocation": 2,
    "Electroreception": 0.5,
    "Touch": 0.5
  },
  "Hearing": {
    "Smell": 2,
    "Electroreception": 2,
    "Sight": 0.5,
    "Heat": 0.5
  },
  "Smell": {
    "Echolocation": 2,
    "Heat": 2,
    "Hearing": 0.5,
    "Touch": 0.5
  },
  "Echolocation": {
    "Electroreception": 2,
    "Touch": 2,
    "Sight": 0.5,
    "Smell": 0.5
  },
  "Electroreception": {
    "Heat": 2,
    "Sight": 2,
    "Hearing": 0.5,
    "Echolocation": 0.5
  },
  "Heat": {
    "Touch": 2,
    "Hearing": 2,
    "Smell": 0.5,
    "Electroreception": 0.5
  },
  "Touch": {
    "Sight": 2,
    "Smell": 2,
    "Echolocation": 0.5,
    "Heat": 0.5
  }
};

const SIG_MOVES = {
  "Bite force": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Pouncing": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Roar": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Ambush": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Talon grip": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Venom": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Venomous bite": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Constriction": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Tongue strike": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Poison skin": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Electric shock": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Sting": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Claw crush": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Punch strike": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Venom bite": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Blood drain": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Pack hunting (howl)": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Thick hide": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Huddling (warmth)": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Cold resistance": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Gill breathing": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Schooling": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Endurance": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Hive warmth": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Armor shell": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Shell retreat": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Endurance running": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Diving speed": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Swimming speed": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Swimming": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Jumping": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Upstream leap": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Endurance swimming": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Sprint speed": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Migration": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Jet propulsion": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature speed — raises your Speed."
  },
  "Camouflage": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Camouflage (stripes)": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Climbing": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Silent flight": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Flight": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Slippery escape": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Ink escape": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Scent tracking": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Echo navigation": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Keen eyesight": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Night vision": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Hearing (mouse under snow)": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Blood smell": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Electroreception": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Pheromone trail": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Web sensing": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Problem solving": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "alwaysHit"
    },
    "desc": "Signature tracking — never misses."
  },
  "Squeak": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "acc",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A distracting squeak — lowers the foe's accuracy."
  },
  "Hood display": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "atk",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A threatening hood display — lowers the foe's Attack."
  },
  "Croaking call": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "atk",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A deep croaking call — lowers the foe's Attack."
  },
  "Regeneration": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "heal25"
    },
    "desc": "Regenerates — restores 25% of max HP."
  },
  "Limb regrowth": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "heal25"
    },
    "desc": "Regrows a limb — restores 25% of max HP."
  },
  "Claw regrowth": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "heal25"
    },
    "desc": "Regrows a claw — restores 25% of max HP."
  },
  "Carry strength (50x body weight)": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "atk",
      "stages": 1,
      "target": "self"
    },
    "desc": "Carries 50x its body weight — raises your Attack."
  },
  "Pheromone command": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "atk",
      "stages": 1,
      "target": "self"
    },
    "desc": "Commands with pheromones — raises your Attack."
  },
  "Size and strength": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "atk",
      "stages": 1,
      "target": "self"
    },
    "desc": "Sheer size and strength — raises your Attack."
  },
  "Web building": {
    "power": null,
    "kind": "category",
    "effect": {
      "special": "trap"
    },
    "desc": "Builds a web that traps the foe."
  },
  "Slime trail": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "spd",
      "stages": -1,
      "target": "foe"
    },
    "desc": "A slime trail that slows the foe."
  }
};

const LEARNSETS = {
  "001": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "002": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "003": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    },
    {
      "move": "grizzlysRage",
      "level": 36
    }
  ],
  "004": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "005": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "006": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    },
    {
      "move": "alphasCommand",
      "level": 36
    }
  ],
  "007": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "008": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "009": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "010": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "011": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "012": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "013": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "014": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "015": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "016": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "017": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "018": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "019": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "020": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "021": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "peck",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "wingAttack",
      "level": 15
    }
  ],
  "022": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "023": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "024": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "025": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "026": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "027": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "028": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "fireBreath",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "029": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "fireBreath",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "030": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "fireBreath",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "031": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "032": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "033": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "constrict",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "venomBite",
      "level": 15
    }
  ],
  "034": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "035": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "036": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "037": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "038": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "039": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "040": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "041": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "042": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "tongueLash",
      "level": 5
    },
    {
      "move": "sonicScream",
      "level": 10
    },
    {
      "move": "poisonSkin",
      "level": 15
    }
  ],
  "043": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "electricShock",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "044": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "electricShock",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "045": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "electricShock",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    },
    {
      "move": "greatWhiteTerror",
      "level": 38
    }
  ],
  "046": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "047": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "048": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "049": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "050": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "051": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "052": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "electricShock",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "053": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "electricShock",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "054": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "waterJet",
      "level": 5
    },
    {
      "move": "electricShock",
      "level": 10
    },
    {
      "move": "finSlash",
      "level": 15
    }
  ],
  "055": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "056": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "057": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "058": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "059": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "060": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "061": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "062": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "063": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "sting",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "swarmAttack",
      "level": 15
    }
  ],
  "064": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "065": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "066": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "067": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "068": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "069": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "070": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "071": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "072": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "poisonFang",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "webShot",
      "level": 15
    }
  ],
  "073": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "074": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "075": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "076": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "077": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "078": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "079": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "080": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "081": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "clawCrush",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "bubbleBeam",
      "level": 15
    }
  ],
  "082": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "083": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "084": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "vibration",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "085": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "086": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "087": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "focusBeam",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "088": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "089": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "090": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "inkBlast",
      "level": 5
    },
    {
      "move": "poisonGas",
      "level": 10
    },
    {
      "move": "tentacleWhip",
      "level": 15
    }
  ],
  "106": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "sonarPulse",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "107": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "sonarPulse",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ],
  "108": [
    {
      "move": "sig",
      "level": 1
    },
    {
      "move": "bite",
      "level": 5
    },
    {
      "move": "sonarPulse",
      "level": 10
    },
    {
      "move": "clawSlash",
      "level": 15
    }
  ]
};

const STARTER_RARE = {
  "003": "grizzlysRage",
  "006": "alphasCommand",
  "045": "greatWhiteTerror"
};
