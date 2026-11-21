// Metamonsters — ENCOUNTERS (pass 3). 40 areas: 15 pass-1 areas + 8 pass-2 areas
// (rokCity, bazaar, university, rustFields, ashenFlats, wreckyard, hollow, echoCaves)
// + 17 pass-3 areas (caveMouth, caveDeep, caveGate + 14 ancient places).
// (howling, grizzly, frozen, coldSpring, iceLake, ember, antColony, reef, tidepools,
// butterfly, deepTrench, mangrove).
// Sources: DATA-SCHEMA.md (area definitions, level ranges, families per area),
// METAMONSTERS-STARS.md (only 1-2 star species may appear wild),
// METAMONSTERS-INSTINCT-VERSIONS.md (instinct rate 1 in 400 in normal areas),
// METAMONSTERS-MAP-AND-TOWNS.md (each place is the home of a typing — the species
// tables below are the home typing's families: Howling Peaks Mammal + Smell, Grizzly Den
// Mammal + Hearing, Frozen Roost Bird + Sight, Cold Spring Amphibian + Touch, Ice Lake
// Fish + Smell, Ember Dunes Reptile + Heat, Ant Colony Insect + Smell, Coral Reef Fish +
// Electroreception, Tide Pools Crustacean + Smell, Butterfly Island Insect + Sight,
// Deep Trench Mollusk + Touch, Mangrove Reptile + Touch).
// Meadow: Ant/Bee/Butterfly/Shrimp/Frog families + rare Bear/Wolf cubs (weight 5 each).
// Woods: Owl, Butterfly, Spider, Caterpillar, Eaglet. Oasis: Frog, Toad, Tadpole,
// Crocodile hatchling. No shark anywhere (water only — shark starter only).
// All tables sum to weight 100. Instinct rate is 1/400 in every area.
// Pass 2 (2026-11-20) adds rokCity, bazaar, university (city areas, 1-2 star species only)
// and the endgame east areas rustFields, ashenFlats, wreckyard, hollow (ALL entries
// mutant:true) plus echoCaves (mixed normal + mutant bat entries). New per-entry field:
// "mutant": true — the engine spawns the mutant form only when the entry has it AND
// mutants are unlocked; otherwise the normal form of the same dex spawns. Endgame
// exception to the 1-2 star wild rule: mutant tables may use any stage (the east is
// level 40-70 content), with stage-3 mutants kept at low weight. echoCaves instinctRate
// is 0.01 (1 in 100, a dangerous place) per METAMONSTERS-INSTINCT-VERSIONS.md; all other
// pass-2 areas are 0.0025 (1 in 400).

const ENCOUNTERS = {
  "meadow": {
    "name": "Meadow Route",
    "levels": [
      2,
      5
    ],
    "table": [
      {
        "dex": "055",
        "weight": 25
      },
      {
        "dex": "061",
        "weight": 20
      },
      {
        "dex": "058",
        "weight": 20
      },
      {
        "dex": "034",
        "weight": 15
      },
      {
        "dex": "079",
        "weight": 10
      },
      {
        "dex": "001",
        "weight": 5
      },
      {
        "dex": "004",
        "weight": 5
      }
    ],
    "instinctRate": 0.0025
  },
  "woods": {
    "name": "Whispering Woods",
    "levels": [
      3,
      6
    ],
    "table": [
      {
        "dex": "016",
        "weight": 20
      },
      {
        "dex": "070",
        "weight": 20
      },
      {
        "dex": "061",
        "weight": 15
      },
      {
        "dex": "013",
        "weight": 15
      },
      {
        "dex": "062",
        "weight": 15
      },
      {
        "dex": "017",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "oasis": {
    "name": "Mirage Oasis",
    "levels": [
      4,
      6
    ],
    "table": [
      {
        "dex": "034",
        "weight": 20
      },
      {
        "dex": "040",
        "weight": 20
      },
      {
        "dex": "035",
        "weight": 15
      },
      {
        "dex": "041",
        "weight": 15
      },
      {
        "dex": "022",
        "weight": 15
      },
      {
        "dex": "036",
        "weight": 10
      },
      {
        "dex": "042",
        "weight": 5
      }
    ],
    "instinctRate": 0.0025
  },
  "howling": {
    "name": "Howling Peaks",
    "levels": [
      5,
      8
    ],
    "table": [
      {
        "dex": "004",
        "weight": 30
      },
      {
        "dex": "005",
        "weight": 15
      },
      {
        "dex": "016",
        "weight": 20
      },
      {
        "dex": "106",
        "weight": 20
      },
      {
        "dex": "017",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "grizzly": {
    "name": "Grizzly Den",
    "levels": [
      5,
      9
    ],
    "table": [
      {
        "dex": "001",
        "weight": 30
      },
      {
        "dex": "002",
        "weight": 15
      },
      {
        "dex": "007",
        "weight": 20
      },
      {
        "dex": "013",
        "weight": 20
      },
      {
        "dex": "014",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "frozen": {
    "name": "Frozen Roost",
    "levels": [
      8,
      12
    ],
    "table": [
      {
        "dex": "013",
        "weight": 25
      },
      {
        "dex": "014",
        "weight": 20
      },
      {
        "dex": "016",
        "weight": 20
      },
      {
        "dex": "019",
        "weight": 20
      },
      {
        "dex": "017",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "coldSpring": {
    "name": "Cold Spring",
    "levels": [
      6,
      10
    ],
    "table": [
      {
        "dex": "037",
        "weight": 30
      },
      {
        "dex": "038",
        "weight": 15
      },
      {
        "dex": "034",
        "weight": 20
      },
      {
        "dex": "040",
        "weight": 20
      },
      {
        "dex": "035",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "iceLake": {
    "name": "Ice Lake",
    "levels": [
      7,
      11
    ],
    "table": [
      {
        "dex": "046",
        "weight": 30
      },
      {
        "dex": "047",
        "weight": 15
      },
      {
        "dex": "019",
        "weight": 20
      },
      {
        "dex": "020",
        "weight": 15
      },
      {
        "dex": "016",
        "weight": 20
      }
    ],
    "instinctRate": 0.0025
  },
  "ember": {
    "name": "Ember Dunes",
    "levels": [
      10,
      15
    ],
    "table": [
      {
        "dex": "025",
        "weight": 25
      },
      {
        "dex": "026",
        "weight": 20
      },
      {
        "dex": "028",
        "weight": 20
      },
      {
        "dex": "031",
        "weight": 20
      },
      {
        "dex": "029",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "antColony": {
    "name": "Ant Colony",
    "levels": [
      5,
      9
    ],
    "table": [
      {
        "dex": "055",
        "weight": 30
      },
      {
        "dex": "056",
        "weight": 20
      },
      {
        "dex": "058",
        "weight": 20
      },
      {
        "dex": "061",
        "weight": 15
      },
      {
        "dex": "059",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "reef": {
    "name": "Coral Reef",
    "levels": [
      10,
      16
    ],
    "table": [
      {
        "dex": "043",
        "weight": 25
      },
      {
        "dex": "044",
        "weight": 15
      },
      {
        "dex": "052",
        "weight": 20
      },
      {
        "dex": "049",
        "weight": 20
      },
      {
        "dex": "053",
        "weight": 20
      }
    ],
    "instinctRate": 0.0025
  },
  "tidepools": {
    "name": "Tide Pools",
    "levels": [
      8,
      13
    ],
    "table": [
      {
        "dex": "073",
        "weight": 30
      },
      {
        "dex": "074",
        "weight": 15
      },
      {
        "dex": "076",
        "weight": 20
      },
      {
        "dex": "079",
        "weight": 20
      },
      {
        "dex": "077",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "butterfly": {
    "name": "Butterfly Island",
    "levels": [
      6,
      10
    ],
    "table": [
      {
        "dex": "061",
        "weight": 30
      },
      {
        "dex": "062",
        "weight": 20
      },
      {
        "dex": "058",
        "weight": 20
      },
      {
        "dex": "059",
        "weight": 15
      },
      {
        "dex": "055",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "deepTrench": {
    "name": "Deep Trench",
    "levels": [
      12,
      18
    ],
    "table": [
      {
        "dex": "082",
        "weight": 25
      },
      {
        "dex": "083",
        "weight": 15
      },
      {
        "dex": "085",
        "weight": 20
      },
      {
        "dex": "088",
        "weight": 20
      },
      {
        "dex": "086",
        "weight": 20
      }
    ],
    "instinctRate": 0.0025
  },
  "mangrove": {
    "name": "Mangrove",
    "levels": [
      9,
      14
    ],
    "table": [
      {
        "dex": "022",
        "weight": 25
      },
      {
        "dex": "023",
        "weight": 15
      },
      {
        "dex": "025",
        "weight": 20
      },
      {
        "dex": "034",
        "weight": 20
      },
      {
        "dex": "035",
        "weight": 20
      }
    ],
    "instinctRate": 0.0025
  },
  "rokCity": {
    "name": "Rok City",
    "levels": [
      20,
      30
    ],
    "table": [
      {
        "dex": "004",
        "weight": 35
      },
      {
        "dex": "005",
        "weight": 25
      },
      {
        "dex": "106",
        "weight": 25
      },
      {
        "dex": "107",
        "weight": 15
      }
    ],
    "instinctRate": 0.0025
  },
  "bazaar": {
    "name": "Grand Bazaar",
    "levels": [
      22,
      32
    ],
    "table": [
      {
        "dex": "013",
        "weight": 30
      },
      {
        "dex": "014",
        "weight": 20
      },
      {
        "dex": "016",
        "weight": 25
      },
      {
        "dex": "017",
        "weight": 25
      }
    ],
    "instinctRate": 0.0025
  },
  "university": {
    "name": "Ivory Tower",
    "levels": [
      25,
      35
    ],
    "table": [
      {
        "dex": "001",
        "weight": 30
      },
      {
        "dex": "002",
        "weight": 20
      },
      {
        "dex": "007",
        "weight": 25
      },
      {
        "dex": "008",
        "weight": 15
      },
      {
        "dex": "014",
        "weight": 10
      }
    ],
    "instinctRate": 0.0025
  },
  "rustFields": {
    "name": "Rust Fields",
    "levels": [
      40,
      55
    ],
    "table": [
      {
        "dex": "004",
        "weight": 40,
        "mutant": true
      },
      {
        "dex": "005",
        "weight": 35,
        "mutant": true
      },
      {
        "dex": "006",
        "weight": 25,
        "mutant": true
      }
    ],
    "instinctRate": 0.0025
  },
  "ashenFlats": {
    "name": "Ashen Flats",
    "levels": [
      45,
      60
    ],
    "table": [
      {
        "dex": "025",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "027",
        "weight": 20,
        "mutant": true
      },
      {
        "dex": "028",
        "weight": 20,
        "mutant": true
      },
      {
        "dex": "030",
        "weight": 15,
        "mutant": true
      },
      {
        "dex": "033",
        "weight": 20,
        "mutant": true
      }
    ],
    "instinctRate": 0.0025
  },
  "wreckyard": {
    "name": "Wreckyard",
    "levels": [
      50,
      65
    ],
    "table": [
      {
        "dex": "052",
        "weight": 40,
        "mutant": true
      },
      {
        "dex": "053",
        "weight": 35,
        "mutant": true
      },
      {
        "dex": "054",
        "weight": 25,
        "mutant": true
      }
    ],
    "instinctRate": 0.0025
  },
  "hollow": {
    "name": "The Hollow",
    "levels": [
      50,
      65
    ],
    "table": [
      {
        "dex": "064",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "065",
        "weight": 20,
        "mutant": true
      },
      {
        "dex": "070",
        "weight": 20,
        "mutant": true
      },
      {
        "dex": "071",
        "weight": 15,
        "mutant": true
      },
      {
        "dex": "072",
        "weight": 20,
        "mutant": true
      }
    ],
    "instinctRate": 0.0025
  },
  "echoCaves": {
    "name": "Echo Caves",
    "levels": [
      55,
      70
    ],
    "table": [
      {
        "dex": "106",
        "weight": 30
      },
      {
        "dex": "107",
        "weight": 25
      },
      {
        "dex": "108",
        "weight": 15
      },
      {
        "dex": "106",
        "weight": 15,
        "mutant": true
      },
      {
        "dex": "107",
        "weight": 10,
        "mutant": true
      },
      {
        "dex": "108",
        "weight": 5,
        "mutant": true
      }
    ],
    "instinctRate": 0.01
  },
  // Pass 3 (2026-11-20) — the Long Dark cave zones + the 75+ world ancient places.
  // Sources: METAMONSTERS-75-WORLD.md (cave zones Lv 60-70 / 70-80 / 75-85, mutant
  // tables; every ancient place is the home of one ancient typing).
  // Ancients have NO mutant forms (75-WORLD.md) and the engine guards instinct to
  // main-world dex only, so instinctRate here is inert for ancient tables — set to
  // 0.0025 (1 in 400) for consistency with the other areas.
  // No encounter areas for the 5 mystery hideouts (deepRiver, highPeaks, burningMarsh,
  // deepForest, darkCaves) or the Sanctuary — mystery battles are triggered by sign
  // objects, not random encounters.
  "caveMouth": {
    "name": "The Mouth",
    "levels": [
      60,
      70
    ],
    "table": [
      {
        "dex": "004",
        "weight": 30,
        "mutant": true
      },
      {
        "dex": "006",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "013",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "010",
        "weight": 20,
        "mutant": true
      }
    ],
    "instinctRate": 0.0025
  },
  "caveDeep": {
    "name": "The Deep",
    "levels": [
      70,
      80
    ],
    "table": [
      {
        "dex": "006",
        "weight": 30,
        "mutant": true
      },
      {
        "dex": "009",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "012",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "024",
        "weight": 20,
        "mutant": true
      }
    ],
    "instinctRate": 0.0025
  },
  "caveGate": {
    "name": "The Gate",
    "levels": [
      75,
      85
    ],
    "table": [
      {
        "dex": "009",
        "weight": 30,
        "mutant": true
      },
      {
        "dex": "012",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "045",
        "weight": 25,
        "mutant": true
      },
      {
        "dex": "036",
        "weight": 20,
        "mutant": true
      }
    ],
    "instinctRate": 0.0025
  },
  "mammothSteppe": {
    "name": "The Mammoth Steppe",
    "levels": [
      75,
      85
    ],
    "table": [
      {
        "dex": "A01",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "direDen": {
    "name": "The Dire Den",
    "levels": [
      75,
      85
    ],
    "table": [
      {
        "dex": "A02",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "rexBadlands": {
    "name": "The Rex Badlands",
    "levels": [
      80,
      90
    ],
    "table": [
      {
        "dex": "A06",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "hornedPlains": {
    "name": "The Horned Plains",
    "levels": [
      80,
      88
    ],
    "table": [
      {
        "dex": "A07",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "raptorGrass": {
    "name": "The Raptor Grasslands",
    "levels": [
      78,
      88
    ],
    "table": [
      {
        "dex": "A08",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "saberFields": {
    "name": "The Saber Fields",
    "levels": [
      80,
      90
    ],
    "table": [
      {
        "dex": "A03",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "megalodonDeep": {
    "name": "The Megalodon Deep",
    "levels": [
      85,
      95
    ],
    "table": [
      {
        "dex": "A10",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "armoredReef": {
    "name": "The Armored Reef",
    "levels": [
      82,
      92
    ],
    "table": [
      {
        "dex": "A11",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "seaScorpion": {
    "name": "The Sea Scorpion Shallows",
    "levels": [
      80,
      90
    ],
    "table": [
      {
        "dex": "A14",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "spiralShoals": {
    "name": "The Spiral Shoals",
    "levels": [
      78,
      88
    ],
    "table": [
      {
        "dex": "A15",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "pteroCliffs": {
    "name": "The Pterodactyl Cliffs",
    "levels": [
      80,
      90
    ],
    "table": [
      {
        "dex": "A04",
        "weight": 70
      },
      {
        "dex": "A05",
        "weight": 30
      }
    ],
    "instinctRate": 0.0025
  },
  "giantsCanopy": {
    "name": "The Giant's Canopy",
    "levels": [
      78,
      88
    ],
    "table": [
      {
        "dex": "A12",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "spidersHollow": {
    "name": "The Spider's Hollow",
    "levels": [
      80,
      90
    ],
    "table": [
      {
        "dex": "A13",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  },
  "devilsPond": {
    "name": "The Devil's Pond",
    "levels": [
      82,
      92
    ],
    "table": [
      {
        "dex": "A09",
        "weight": 100
      }
    ],
    "instinctRate": 0.0025
  }
};
