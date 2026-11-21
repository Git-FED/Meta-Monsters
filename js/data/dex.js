// Metamonsters v1 — DEX. 93 main-world entries ("001".."090", "106".."108").
// Sources: METAMONSTERS-DEX.md (typings, signatures, evolutions), METAMONSTERS-STARS.md
// (per-stage stars: 43x 1-star, 37x 2-star, 13x 3-star), DATA-SCHEMA.md (base-stat RULE).
// Base stats are RULE-derived: stage totals 210/320/450, archetype fractions, rounded,
// then +0/+5/+12 per stat for 1/2/3 stars. Instinct variants are NOT baked in here;
// the engine applies +15% atk/spd, -15% def at runtime.
// Doc contradictions resolved:
//  - DATA-SCHEMA.md's archetype list omits two families. Assigned by role: Bat = fast
//    (flying echolocation hunter), Python = tank (heavy constrictor body).
//  - DATA-SCHEMA.md lists the Komodo archetype as "Komodo"; the dex family name is
//    "Komodo Dragon" — the dex name is used.
//  - METAMONSTERS-DEX.md says stage 1->2 at Lv. 10-20 and 2->3 at Lv. 20-40; every
//    table value used here falls inside those bands.
//  - Evolution item strings match ITEMS names exactly (case-sensitive engine lookup):
//    the dex doc writes "Car Battery" / "Iron Ore" / "Scrap Metal" / "Cold Pack" while
//    METAMONSTERS-ITEMS.md writes "Car battery" / "Iron ore" / "Scrap metal" / "Cold pack".
//    The items-doc casing is used here so evo.item === ITEMS[id].name.
// Ancients (A01-A15) and mystery creatures are NOT in this file (later passes).

const DEX = {
  "001": {
    "dex": "001",
    "id": 1,
    "name": "Bear Cub",
    "family": "Bear",
    "stage": 1,
    "category": "Mammal",
    "sense": "Hearing",
    "sig": "Thick hide",
    "evo": {
      "level": 16,
      "into": "002"
    },
    "stars": 1,
    "stats": {
      "hp": 67,
      "atk": 46,
      "def": 63,
      "spd": 34
    },
    "sprite": "001",
    "desc": "Young stage of the Bear line. Hunting storyline — learn to hunt. Great defense and resilience, attacked and robbed less than other starters."
  },
  "002": {
    "dex": "002",
    "id": 2,
    "name": "Black Bear",
    "family": "Bear",
    "stage": 2,
    "category": "Mammal",
    "sense": "Hearing",
    "sig": "Climbing",
    "evo": {
      "level": 36,
      "into": "003"
    },
    "stars": 2,
    "stats": {
      "hp": 107,
      "atk": 75,
      "def": 101,
      "spd": 56
    },
    "sprite": "002",
    "desc": "Adult stage of the Bear line. Hunting storyline — learn to hunt. Great defense and resilience, attacked and robbed less than other starters."
  },
  "003": {
    "dex": "003",
    "id": 3,
    "name": "Grizzly",
    "family": "Bear",
    "stage": 3,
    "category": "Mammal",
    "sense": "Hearing",
    "sig": "Bite force",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 156,
      "atk": 111,
      "def": 147,
      "spd": 84
    },
    "sprite": "003",
    "desc": "Alpha stage of the Bear line. Hunting storyline — learn to hunt. Great defense and resilience, attacked and robbed less than other starters."
  },
  "004": {
    "dex": "004",
    "id": 4,
    "name": "Wolf Cub",
    "family": "Wolf",
    "stage": 1,
    "category": "Mammal",
    "sense": "Smell",
    "sig": "Scent tracking",
    "evo": {
      "level": 16,
      "into": "005"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "004",
    "desc": "Young stage of the Wolf line. Werewolf storyline — track scents, face the werewolf hunters."
  },
  "005": {
    "dex": "005",
    "id": 5,
    "name": "Gray Wolf",
    "family": "Wolf",
    "stage": 2,
    "category": "Mammal",
    "sense": "Smell",
    "sig": "Endurance running",
    "evo": {
      "level": 36,
      "into": "006"
    },
    "stars": 2,
    "stats": {
      "hp": 75,
      "atk": 88,
      "def": 63,
      "spd": 114
    },
    "sprite": "005",
    "desc": "Adult stage of the Wolf line. Werewolf storyline — track scents, face the werewolf hunters."
  },
  "006": {
    "dex": "006",
    "id": 6,
    "name": "Alpha Wolf",
    "family": "Wolf",
    "stage": 3,
    "category": "Mammal",
    "sense": "Smell",
    "sig": "Pack hunting (howl)",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 111,
      "atk": 129,
      "def": 93,
      "spd": 165
    },
    "sprite": "006",
    "desc": "Alpha stage of the Wolf line. Werewolf storyline — track scents, face the werewolf hunters."
  },
  "007": {
    "dex": "007",
    "id": 7,
    "name": "Lion Cub",
    "family": "Lion",
    "stage": 1,
    "category": "Mammal",
    "sense": "Sight",
    "sig": "Pouncing",
    "evo": {
      "level": 18,
      "into": "008"
    },
    "stars": 1,
    "stats": {
      "hp": 50,
      "atk": 67,
      "def": 42,
      "spd": 50
    },
    "sprite": "007",
    "desc": "Young stage of the Lion line. Big desert predator — hard to find, but a wild catch."
  },
  "008": {
    "dex": "008",
    "id": 8,
    "name": "Lion",
    "family": "Lion",
    "stage": 2,
    "category": "Mammal",
    "sense": "Sight",
    "sig": "Roar",
    "evo": {
      "level": 38,
      "into": "009"
    },
    "stars": 2,
    "stats": {
      "hp": 82,
      "atk": 107,
      "def": 69,
      "spd": 82
    },
    "sprite": "008",
    "desc": "Adult stage of the Lion line. Big desert predator — hard to find, but a wild catch."
  },
  "009": {
    "dex": "009",
    "id": 9,
    "name": "Alpha Lion",
    "family": "Lion",
    "stage": 3,
    "category": "Mammal",
    "sense": "Sight",
    "sig": "Bite force",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 113,
      "atk": 149,
      "def": 95,
      "spd": 113
    },
    "sprite": "009",
    "desc": "Alpha stage of the Lion line. Big desert predator — hard to find, but a wild catch."
  },
  "010": {
    "dex": "010",
    "id": 10,
    "name": "Tiger Cub",
    "family": "Tiger",
    "stage": 1,
    "category": "Mammal",
    "sense": "Sight",
    "sig": "Camouflage (stripes)",
    "evo": {
      "level": 18,
      "into": "011"
    },
    "stars": 1,
    "stats": {
      "hp": 50,
      "atk": 67,
      "def": 42,
      "spd": 50
    },
    "sprite": "010",
    "desc": "Young stage of the Tiger line. Apex predator — the Alpha is a tournament prize."
  },
  "011": {
    "dex": "011",
    "id": 11,
    "name": "Tiger",
    "family": "Tiger",
    "stage": 2,
    "category": "Mammal",
    "sense": "Sight",
    "sig": "Ambush",
    "evo": {
      "level": 38,
      "into": "012"
    },
    "stars": 2,
    "stats": {
      "hp": 82,
      "atk": 107,
      "def": 69,
      "spd": 82
    },
    "sprite": "011",
    "desc": "Adult stage of the Tiger line. Apex predator — the Alpha is a tournament prize."
  },
  "012": {
    "dex": "012",
    "id": 12,
    "name": "Alpha Tiger",
    "family": "Tiger",
    "stage": 3,
    "category": "Mammal",
    "sense": "Sight",
    "sig": "Bite force",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 120,
      "atk": 156,
      "def": 102,
      "spd": 120
    },
    "sprite": "012",
    "desc": "Alpha stage of the Tiger line. Apex predator — the Alpha is a tournament prize."
  },
  "013": {
    "dex": "013",
    "id": 13,
    "name": "Eaglet",
    "family": "Eagle",
    "stage": 1,
    "category": "Bird",
    "sense": "Sight",
    "sig": "Keen eyesight",
    "evo": {
      "level": 16,
      "into": "014"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "013",
    "desc": "Young stage of the Eagle line. Bird of prey — the Golden Eagle is a rare wild catch."
  },
  "014": {
    "dex": "014",
    "id": 14,
    "name": "Eagle",
    "family": "Eagle",
    "stage": 2,
    "category": "Bird",
    "sense": "Sight",
    "sig": "Diving speed",
    "evo": {
      "level": 34,
      "into": "015"
    },
    "stars": 2,
    "stats": {
      "hp": 75,
      "atk": 88,
      "def": 63,
      "spd": 114
    },
    "sprite": "014",
    "desc": "Adult stage of the Eagle line. Bird of prey — the Golden Eagle is a rare wild catch."
  },
  "015": {
    "dex": "015",
    "id": 15,
    "name": "Golden Eagle",
    "family": "Eagle",
    "stage": 3,
    "category": "Bird",
    "sense": "Sight",
    "sig": "Talon grip",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 104,
      "atk": 122,
      "def": 86,
      "spd": 158
    },
    "sprite": "015",
    "desc": "Alpha stage of the Eagle line. Bird of prey — the Golden Eagle is a rare wild catch."
  },
  "016": {
    "dex": "016",
    "id": 16,
    "name": "Owlet",
    "family": "Owl",
    "stage": 1,
    "category": "Bird",
    "sense": "Hearing",
    "sig": "Night vision",
    "evo": {
      "level": 16,
      "into": "017"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "016",
    "desc": "Young stage of the Owl line. Night hunter of the cold north — the Great Horned Owl is rarer."
  },
  "017": {
    "dex": "017",
    "id": 17,
    "name": "Owl",
    "family": "Owl",
    "stage": 2,
    "category": "Bird",
    "sense": "Hearing",
    "sig": "Silent flight",
    "evo": {
      "level": 34,
      "into": "018"
    },
    "stars": 1,
    "stats": {
      "hp": 70,
      "atk": 83,
      "def": 58,
      "spd": 109
    },
    "sprite": "017",
    "desc": "Adult stage of the Owl line. Night hunter of the cold north — the Great Horned Owl is rarer."
  },
  "018": {
    "dex": "018",
    "id": 18,
    "name": "Great Horned Owl",
    "family": "Owl",
    "stage": 3,
    "category": "Bird",
    "sense": "Hearing",
    "sig": "Hearing (mouse under snow)",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 104,
      "atk": 122,
      "def": 86,
      "spd": 158
    },
    "sprite": "018",
    "desc": "Alpha stage of the Owl line. Night hunter of the cold north — the Great Horned Owl is rarer."
  },
  "019": {
    "dex": "019",
    "id": 19,
    "name": "Chick",
    "family": "Penguin",
    "stage": 1,
    "category": "Bird",
    "sense": "Sight",
    "sig": "Huddling (warmth)",
    "evo": {
      "level": 14,
      "into": "020"
    },
    "stars": 1,
    "stats": {
      "hp": 55,
      "atk": 52,
      "def": 52,
      "spd": 50
    },
    "sprite": "019",
    "desc": "Young stage of the Penguin line. The Emperor needs a Cold Pack, so it is earned, not caught."
  },
  "020": {
    "dex": "020",
    "id": 20,
    "name": "Penguin",
    "family": "Penguin",
    "stage": 2,
    "category": "Bird",
    "sense": "Sight",
    "sig": "Swimming speed",
    "evo": {
      "item": "Cold pack",
      "into": "021"
    },
    "stars": 1,
    "stats": {
      "hp": 83,
      "atk": 80,
      "def": 80,
      "spd": 77
    },
    "sprite": "020",
    "desc": "Adult stage of the Penguin line. The Emperor needs a Cold Pack, so it is earned, not caught."
  },
  "021": {
    "dex": "021",
    "id": 21,
    "name": "Emperor Penguin",
    "family": "Penguin",
    "stage": 3,
    "category": "Bird",
    "sense": "Sight",
    "sig": "Cold resistance",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 122,
      "atk": 117,
      "def": 117,
      "spd": 113
    },
    "sprite": "021",
    "desc": "Alpha stage of the Penguin line. The Emperor needs a Cold Pack, so it is earned, not caught."
  },
  "022": {
    "dex": "022",
    "id": 22,
    "name": "Hatchling",
    "family": "Crocodile",
    "stage": 1,
    "category": "Reptile",
    "sense": "Touch",
    "sig": "Camouflage",
    "evo": {
      "level": 20,
      "into": "023"
    },
    "stars": 1,
    "stats": {
      "hp": 67,
      "atk": 46,
      "def": 63,
      "spd": 34
    },
    "sprite": "022",
    "desc": "Young stage of the Crocodile line. Swamp ambush predator — the Saltwater is a rare wild catch."
  },
  "023": {
    "dex": "023",
    "id": 23,
    "name": "Crocodile",
    "family": "Crocodile",
    "stage": 2,
    "category": "Reptile",
    "sense": "Touch",
    "sig": "Ambush",
    "evo": {
      "level": 40,
      "into": "024"
    },
    "stars": 2,
    "stats": {
      "hp": 107,
      "atk": 75,
      "def": 101,
      "spd": 56
    },
    "sprite": "023",
    "desc": "Adult stage of the Crocodile line. Swamp ambush predator — the Saltwater is a rare wild catch."
  },
  "024": {
    "dex": "024",
    "id": 24,
    "name": "Saltwater Crocodile",
    "family": "Crocodile",
    "stage": 3,
    "category": "Reptile",
    "sense": "Touch",
    "sig": "Bite force",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 149,
      "atk": 104,
      "def": 140,
      "spd": 77
    },
    "sprite": "024",
    "desc": "Alpha stage of the Crocodile line. Swamp ambush predator — the Saltwater is a rare wild catch."
  },
  "025": {
    "dex": "025",
    "id": 25,
    "name": "Hatchling",
    "family": "Cobra",
    "stage": 1,
    "category": "Reptile",
    "sense": "Smell",
    "sig": "Venom",
    "evo": {
      "level": 16,
      "into": "026"
    },
    "stars": 1,
    "stats": {
      "hp": 50,
      "atk": 67,
      "def": 42,
      "spd": 50
    },
    "sprite": "025",
    "desc": "Young stage of the Cobra line. Venomous and dangerous — the King Cobra is a mission reward."
  },
  "026": {
    "dex": "026",
    "id": 26,
    "name": "Cobra",
    "family": "Cobra",
    "stage": 2,
    "category": "Reptile",
    "sense": "Smell",
    "sig": "Hood display",
    "evo": {
      "level": 34,
      "into": "027"
    },
    "stars": 2,
    "stats": {
      "hp": 82,
      "atk": 107,
      "def": 69,
      "spd": 82
    },
    "sprite": "026",
    "desc": "Adult stage of the Cobra line. Venomous and dangerous — the King Cobra is a mission reward."
  },
  "027": {
    "dex": "027",
    "id": 27,
    "name": "King Cobra",
    "family": "Cobra",
    "stage": 3,
    "category": "Reptile",
    "sense": "Smell",
    "sig": "Venom",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 120,
      "atk": 156,
      "def": 102,
      "spd": 120
    },
    "sprite": "027",
    "desc": "Alpha stage of the Cobra line. Venomous and dangerous — the King Cobra is a mission reward."
  },
  "028": {
    "dex": "028",
    "id": 28,
    "name": "Hatchling",
    "family": "Python",
    "stage": 1,
    "category": "Reptile",
    "sense": "Heat",
    "sig": "Camouflage",
    "evo": {
      "level": 18,
      "into": "029"
    },
    "stars": 1,
    "stats": {
      "hp": 67,
      "atk": 46,
      "def": 63,
      "spd": 34
    },
    "sprite": "028",
    "desc": "Young stage of the Python line. Huge and hard to find — the Reticulated is a mission reward."
  },
  "029": {
    "dex": "029",
    "id": 29,
    "name": "Python",
    "family": "Python",
    "stage": 2,
    "category": "Reptile",
    "sense": "Heat",
    "sig": "Constriction",
    "evo": {
      "level": 36,
      "into": "030"
    },
    "stars": 2,
    "stats": {
      "hp": 107,
      "atk": 75,
      "def": 101,
      "spd": 56
    },
    "sprite": "029",
    "desc": "Adult stage of the Python line. Huge and hard to find — the Reticulated is a mission reward."
  },
  "030": {
    "dex": "030",
    "id": 30,
    "name": "Reticulated Python",
    "family": "Python",
    "stage": 3,
    "category": "Reptile",
    "sense": "Heat",
    "sig": "Constriction",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 156,
      "atk": 111,
      "def": 147,
      "spd": 84
    },
    "sprite": "030",
    "desc": "Alpha stage of the Python line. Huge and hard to find — the Reticulated is a mission reward."
  },
  "031": {
    "dex": "031",
    "id": 31,
    "name": "Hatchling",
    "family": "Komodo Dragon",
    "stage": 1,
    "category": "Reptile",
    "sense": "Smell",
    "sig": "Climbing",
    "evo": {
      "level": 20,
      "into": "032"
    },
    "stars": 1,
    "stats": {
      "hp": 50,
      "atk": 67,
      "def": 42,
      "spd": 50
    },
    "sprite": "031",
    "desc": "Young stage of the Komodo Dragon line. The Alpha is a dangerous mission reward."
  },
  "032": {
    "dex": "032",
    "id": 32,
    "name": "Komodo Dragon",
    "family": "Komodo Dragon",
    "stage": 2,
    "category": "Reptile",
    "sense": "Smell",
    "sig": "Venomous bite",
    "evo": {
      "level": 40,
      "into": "033"
    },
    "stars": 2,
    "stats": {
      "hp": 82,
      "atk": 107,
      "def": 69,
      "spd": 82
    },
    "sprite": "032",
    "desc": "Adult stage of the Komodo Dragon line. The Alpha is a dangerous mission reward."
  },
  "033": {
    "dex": "033",
    "id": 33,
    "name": "Alpha Komodo",
    "family": "Komodo Dragon",
    "stage": 3,
    "category": "Reptile",
    "sense": "Smell",
    "sig": "Ambush",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 120,
      "atk": 156,
      "def": 102,
      "spd": 120
    },
    "sprite": "033",
    "desc": "Alpha stage of the Komodo Dragon line. The Alpha is a dangerous mission reward."
  },
  "034": {
    "dex": "034",
    "id": 34,
    "name": "Tadpole",
    "family": "Frog",
    "stage": 1,
    "category": "Amphibian",
    "sense": "Sight",
    "sig": "Swimming",
    "evo": {
      "level": 14,
      "into": "035"
    },
    "stars": 1,
    "stats": {
      "hp": 55,
      "atk": 52,
      "def": 52,
      "spd": 50
    },
    "sprite": "034",
    "desc": "Young stage of the Frog line. The Poison Dart Frog needs Herbs — earned, not caught."
  },
  "035": {
    "dex": "035",
    "id": 35,
    "name": "Frog",
    "family": "Frog",
    "stage": 2,
    "category": "Amphibian",
    "sense": "Sight",
    "sig": "Jumping",
    "evo": {
      "item": "Herbs",
      "into": "036"
    },
    "stars": 1,
    "stats": {
      "hp": 83,
      "atk": 80,
      "def": 80,
      "spd": 77
    },
    "sprite": "035",
    "desc": "Adult stage of the Frog line. The Poison Dart Frog needs Herbs — earned, not caught."
  },
  "036": {
    "dex": "036",
    "id": 36,
    "name": "Poison Dart Frog",
    "family": "Frog",
    "stage": 3,
    "category": "Amphibian",
    "sense": "Sight",
    "sig": "Tongue strike",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 122,
      "atk": 117,
      "def": 117,
      "spd": 113
    },
    "sprite": "036",
    "desc": "Alpha stage of the Frog line. The Poison Dart Frog needs Herbs — earned, not caught."
  },
  "037": {
    "dex": "037",
    "id": 37,
    "name": "Larva",
    "family": "Axolotl",
    "stage": 1,
    "category": "Amphibian",
    "sense": "Touch",
    "sig": "Gill breathing",
    "evo": {
      "level": 16,
      "into": "038"
    },
    "stars": 1,
    "stats": {
      "hp": 67,
      "atk": 46,
      "def": 63,
      "spd": 34
    },
    "sprite": "037",
    "desc": "Young stage of the Axolotl line. Rare cold-water creature — the Alpha is a rare wild catch."
  },
  "038": {
    "dex": "038",
    "id": 38,
    "name": "Axolotl",
    "family": "Axolotl",
    "stage": 2,
    "category": "Amphibian",
    "sense": "Touch",
    "sig": "Regeneration",
    "evo": {
      "level": 36,
      "into": "039"
    },
    "stars": 1,
    "stats": {
      "hp": 102,
      "atk": 70,
      "def": 96,
      "spd": 51
    },
    "sprite": "038",
    "desc": "Adult stage of the Axolotl line. Rare cold-water creature — the Alpha is a rare wild catch."
  },
  "039": {
    "dex": "039",
    "id": 39,
    "name": "Alpha Axolotl",
    "family": "Axolotl",
    "stage": 3,
    "category": "Amphibian",
    "sense": "Touch",
    "sig": "Limb regrowth",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 149,
      "atk": 104,
      "def": 140,
      "spd": 77
    },
    "sprite": "039",
    "desc": "Alpha stage of the Axolotl line. Rare cold-water creature — the Alpha is a rare wild catch."
  },
  "040": {
    "dex": "040",
    "id": 40,
    "name": "Tadpole",
    "family": "Toad",
    "stage": 1,
    "category": "Amphibian",
    "sense": "Hearing",
    "sig": "Swimming",
    "evo": {
      "level": 14,
      "into": "041"
    },
    "stars": 1,
    "stats": {
      "hp": 67,
      "atk": 46,
      "def": 63,
      "spd": 34
    },
    "sprite": "040",
    "desc": "Young stage of the Toad line. Common toad — the Cane Toad is poisonous and rarer."
  },
  "041": {
    "dex": "041",
    "id": 41,
    "name": "Toad",
    "family": "Toad",
    "stage": 2,
    "category": "Amphibian",
    "sense": "Hearing",
    "sig": "Croaking call",
    "evo": {
      "level": 28,
      "into": "042"
    },
    "stars": 1,
    "stats": {
      "hp": 102,
      "atk": 70,
      "def": 96,
      "spd": 51
    },
    "sprite": "041",
    "desc": "Adult stage of the Toad line. Common toad — the Cane Toad is poisonous and rarer."
  },
  "042": {
    "dex": "042",
    "id": 42,
    "name": "Cane Toad",
    "family": "Toad",
    "stage": 3,
    "category": "Amphibian",
    "sense": "Hearing",
    "sig": "Poison skin",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 149,
      "atk": 104,
      "def": 140,
      "spd": 77
    },
    "sprite": "042",
    "desc": "Alpha stage of the Toad line. Common toad — the Cane Toad is poisonous and rarer."
  },
  "043": {
    "dex": "043",
    "id": 43,
    "name": "Baby Shark",
    "family": "Shark",
    "stage": 1,
    "category": "Fish",
    "sense": "Electroreception",
    "sig": "Swimming speed",
    "evo": {
      "level": 18,
      "into": "044"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "043",
    "desc": "Young stage of the Shark line. Water travel storyline — travel small bodies of water early without HM SWIM."
  },
  "044": {
    "dex": "044",
    "id": 44,
    "name": "Reef Shark",
    "family": "Shark",
    "stage": 2,
    "category": "Fish",
    "sense": "Electroreception",
    "sig": "Blood smell",
    "evo": {
      "level": 38,
      "into": "045"
    },
    "stars": 2,
    "stats": {
      "hp": 75,
      "atk": 88,
      "def": 63,
      "spd": 114
    },
    "sprite": "044",
    "desc": "Adult stage of the Shark line. Water travel storyline — travel small bodies of water early without HM SWIM."
  },
  "045": {
    "dex": "045",
    "id": 45,
    "name": "Great White Shark",
    "family": "Shark",
    "stage": 3,
    "category": "Fish",
    "sense": "Electroreception",
    "sig": "Electroreception",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 111,
      "atk": 129,
      "def": 93,
      "spd": 165
    },
    "sprite": "045",
    "desc": "Alpha stage of the Shark line. Water travel storyline — travel small bodies of water early without HM SWIM."
  },
  "046": {
    "dex": "046",
    "id": 46,
    "name": "Fry",
    "family": "Salmon",
    "stage": 1,
    "category": "Fish",
    "sense": "Smell",
    "sig": "Swimming",
    "evo": {
      "level": 16,
      "into": "047"
    },
    "stars": 1,
    "stats": {
      "hp": 55,
      "atk": 52,
      "def": 52,
      "spd": 50
    },
    "sprite": "046",
    "desc": "Young stage of the Salmon line. The Chinook is a rare upstream catch."
  },
  "047": {
    "dex": "047",
    "id": 47,
    "name": "Salmon",
    "family": "Salmon",
    "stage": 2,
    "category": "Fish",
    "sense": "Smell",
    "sig": "Upstream leap",
    "evo": {
      "level": 32,
      "into": "048"
    },
    "stars": 1,
    "stats": {
      "hp": 83,
      "atk": 80,
      "def": 80,
      "spd": 77
    },
    "sprite": "047",
    "desc": "Adult stage of the Salmon line. The Chinook is a rare upstream catch."
  },
  "048": {
    "dex": "048",
    "id": 48,
    "name": "Chinook Salmon",
    "family": "Salmon",
    "stage": 3,
    "category": "Fish",
    "sense": "Smell",
    "sig": "Endurance swimming",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 122,
      "atk": 117,
      "def": 117,
      "spd": 113
    },
    "sprite": "048",
    "desc": "Alpha stage of the Salmon line. The Chinook is a rare upstream catch."
  },
  "049": {
    "dex": "049",
    "id": 49,
    "name": "Fry",
    "family": "Tuna",
    "stage": 1,
    "category": "Fish",
    "sense": "Sight",
    "sig": "Schooling",
    "evo": {
      "level": 18,
      "into": "050"
    },
    "stars": 1,
    "stats": {
      "hp": 50,
      "atk": 67,
      "def": 42,
      "spd": 50
    },
    "sprite": "049",
    "desc": "Young stage of the Tuna line. The Bluefin is a rare deep-sea catch."
  },
  "050": {
    "dex": "050",
    "id": 50,
    "name": "Tuna",
    "family": "Tuna",
    "stage": 2,
    "category": "Fish",
    "sense": "Sight",
    "sig": "Sprint speed",
    "evo": {
      "level": 36,
      "into": "051"
    },
    "stars": 2,
    "stats": {
      "hp": 82,
      "atk": 107,
      "def": 69,
      "spd": 82
    },
    "sprite": "050",
    "desc": "Adult stage of the Tuna line. The Bluefin is a rare deep-sea catch."
  },
  "051": {
    "dex": "051",
    "id": 51,
    "name": "Bluefin Tuna",
    "family": "Tuna",
    "stage": 3,
    "category": "Fish",
    "sense": "Sight",
    "sig": "Endurance",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 113,
      "atk": 149,
      "def": 95,
      "spd": 113
    },
    "sprite": "051",
    "desc": "Alpha stage of the Tuna line. The Bluefin is a rare deep-sea catch."
  },
  "052": {
    "dex": "052",
    "id": 52,
    "name": "Elver",
    "family": "Eel",
    "stage": 1,
    "category": "Fish",
    "sense": "Electroreception",
    "sig": "Swimming",
    "evo": {
      "level": 16,
      "into": "053"
    },
    "stars": 1,
    "stats": {
      "hp": 55,
      "atk": 52,
      "def": 52,
      "spd": 50
    },
    "sprite": "052",
    "desc": "Young stage of the Eel line. Needs a Car Battery and is electric and dangerous — earned."
  },
  "053": {
    "dex": "053",
    "id": 53,
    "name": "Eel",
    "family": "Eel",
    "stage": 2,
    "category": "Fish",
    "sense": "Electroreception",
    "sig": "Slippery escape",
    "evo": {
      "item": "Car battery",
      "into": "054"
    },
    "stars": 2,
    "stats": {
      "hp": 88,
      "atk": 85,
      "def": 85,
      "spd": 82
    },
    "sprite": "053",
    "desc": "Adult stage of the Eel line. Needs a Car Battery and is electric and dangerous — earned."
  },
  "054": {
    "dex": "054",
    "id": 54,
    "name": "Electric Eel",
    "family": "Eel",
    "stage": 3,
    "category": "Fish",
    "sense": "Electroreception",
    "sig": "Electric shock",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 129,
      "atk": 124,
      "def": 124,
      "spd": 120
    },
    "sprite": "054",
    "desc": "Alpha stage of the Eel line. Needs a Car Battery and is electric and dangerous — earned."
  },
  "055": {
    "dex": "055",
    "id": 55,
    "name": "Larva",
    "family": "Ant",
    "stage": 1,
    "category": "Insect",
    "sense": "Smell",
    "sig": "Pheromone trail",
    "evo": {
      "level": 12,
      "into": "056"
    },
    "stars": 1,
    "stats": {
      "hp": 55,
      "atk": 52,
      "def": 52,
      "spd": 50
    },
    "sprite": "055",
    "desc": "Young stage of the Ant line. Everywhere — but the Queen only comes from the colony."
  },
  "056": {
    "dex": "056",
    "id": 56,
    "name": "Ant",
    "family": "Ant",
    "stage": 2,
    "category": "Insect",
    "sense": "Smell",
    "sig": "Carry strength (50x body weight)",
    "evo": {
      "level": 24,
      "into": "057"
    },
    "stars": 1,
    "stats": {
      "hp": 83,
      "atk": 80,
      "def": 80,
      "spd": 77
    },
    "sprite": "056",
    "desc": "Adult stage of the Ant line. Everywhere — but the Queen only comes from the colony."
  },
  "057": {
    "dex": "057",
    "id": 57,
    "name": "Queen Ant",
    "family": "Ant",
    "stage": 3,
    "category": "Insect",
    "sense": "Smell",
    "sig": "Pheromone command",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 122,
      "atk": 117,
      "def": 117,
      "spd": 113
    },
    "sprite": "057",
    "desc": "Alpha stage of the Ant line. Everywhere — but the Queen only comes from the colony."
  },
  "058": {
    "dex": "058",
    "id": 58,
    "name": "Larva",
    "family": "Bee",
    "stage": 1,
    "category": "Insect",
    "sense": "Sight",
    "sig": "Hive warmth",
    "evo": {
      "level": 12,
      "into": "059"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "058",
    "desc": "Young stage of the Bee line. Everywhere — but the Queen only comes from the hive."
  },
  "059": {
    "dex": "059",
    "id": 59,
    "name": "Bee",
    "family": "Bee",
    "stage": 2,
    "category": "Insect",
    "sense": "Sight",
    "sig": "Sting",
    "evo": {
      "level": 24,
      "into": "060"
    },
    "stars": 1,
    "stats": {
      "hp": 70,
      "atk": 83,
      "def": 58,
      "spd": 109
    },
    "sprite": "059",
    "desc": "Adult stage of the Bee line. Everywhere — but the Queen only comes from the hive."
  },
  "060": {
    "dex": "060",
    "id": 60,
    "name": "Queen Bee",
    "family": "Bee",
    "stage": 3,
    "category": "Insect",
    "sense": "Sight",
    "sig": "Pheromone command",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 104,
      "atk": 122,
      "def": 86,
      "spd": 158
    },
    "sprite": "060",
    "desc": "Alpha stage of the Bee line. Everywhere — but the Queen only comes from the hive."
  },
  "061": {
    "dex": "061",
    "id": 61,
    "name": "Caterpillar",
    "family": "Butterfly",
    "stage": 1,
    "category": "Insect",
    "sense": "Sight",
    "sig": "Camouflage",
    "evo": {
      "level": 10,
      "into": "062"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "061",
    "desc": "Young stage of the Butterfly line. The Monarch migrates — a rare wild catch."
  },
  "062": {
    "dex": "062",
    "id": 62,
    "name": "Butterfly",
    "family": "Butterfly",
    "stage": 2,
    "category": "Insect",
    "sense": "Sight",
    "sig": "Flight",
    "evo": {
      "level": 20,
      "into": "063"
    },
    "stars": 1,
    "stats": {
      "hp": 70,
      "atk": 83,
      "def": 58,
      "spd": 109
    },
    "sprite": "062",
    "desc": "Adult stage of the Butterfly line. The Monarch migrates — a rare wild catch."
  },
  "063": {
    "dex": "063",
    "id": 63,
    "name": "Monarch Butterfly",
    "family": "Butterfly",
    "stage": 3,
    "category": "Insect",
    "sense": "Sight",
    "sig": "Migration",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 104,
      "atk": 122,
      "def": 86,
      "spd": 158
    },
    "sprite": "063",
    "desc": "Alpha stage of the Butterfly line. The Monarch migrates — a rare wild catch."
  },
  "064": {
    "dex": "064",
    "id": 64,
    "name": "Spiderling",
    "family": "Tarantula",
    "stage": 1,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Camouflage",
    "evo": {
      "level": 16,
      "into": "065"
    },
    "stars": 1,
    "stats": {
      "hp": 55,
      "atk": 52,
      "def": 52,
      "spd": 50
    },
    "sprite": "064",
    "desc": "Young stage of the Tarantula line. The biggest spider — a mission reward."
  },
  "065": {
    "dex": "065",
    "id": 65,
    "name": "Tarantula",
    "family": "Tarantula",
    "stage": 2,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Venom",
    "evo": {
      "level": 32,
      "into": "066"
    },
    "stars": 2,
    "stats": {
      "hp": 88,
      "atk": 85,
      "def": 85,
      "spd": 82
    },
    "sprite": "065",
    "desc": "Adult stage of the Tarantula line. The biggest spider — a mission reward."
  },
  "066": {
    "dex": "066",
    "id": 66,
    "name": "Goliath Tarantula",
    "family": "Tarantula",
    "stage": 3,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Size and strength",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 129,
      "atk": 124,
      "def": 124,
      "spd": 120
    },
    "sprite": "066",
    "desc": "Alpha stage of the Tarantula line. The biggest spider — a mission reward."
  },
  "067": {
    "dex": "067",
    "id": 67,
    "name": "Scorpling",
    "family": "Scorpion",
    "stage": 1,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Venom",
    "evo": {
      "level": 16,
      "into": "068"
    },
    "stars": 1,
    "stats": {
      "hp": 50,
      "atk": 67,
      "def": 42,
      "spd": 50
    },
    "sprite": "067",
    "desc": "Young stage of the Scorpion line. The Emperor is a rare desert catch."
  },
  "068": {
    "dex": "068",
    "id": 68,
    "name": "Scorpion",
    "family": "Scorpion",
    "stage": 2,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Sting",
    "evo": {
      "level": 32,
      "into": "069"
    },
    "stars": 2,
    "stats": {
      "hp": 82,
      "atk": 107,
      "def": 69,
      "spd": 82
    },
    "sprite": "068",
    "desc": "Adult stage of the Scorpion line. The Emperor is a rare desert catch."
  },
  "069": {
    "dex": "069",
    "id": 69,
    "name": "Emperor Scorpion",
    "family": "Scorpion",
    "stage": 3,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Claw crush",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 113,
      "atk": 149,
      "def": 95,
      "spd": 113
    },
    "sprite": "069",
    "desc": "Alpha stage of the Scorpion line. The Emperor is a rare desert catch."
  },
  "070": {
    "dex": "070",
    "id": 70,
    "name": "Spiderling",
    "family": "Spider",
    "stage": 1,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Web sensing",
    "evo": {
      "level": 14,
      "into": "071"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "070",
    "desc": "Young stage of the Spider line. Venomous and dangerous — the Black Widow is a mission reward."
  },
  "071": {
    "dex": "071",
    "id": 71,
    "name": "Orb Weaver Spider",
    "family": "Spider",
    "stage": 2,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Web building",
    "evo": {
      "level": 28,
      "into": "072"
    },
    "stars": 2,
    "stats": {
      "hp": 75,
      "atk": 88,
      "def": 63,
      "spd": 114
    },
    "sprite": "071",
    "desc": "Adult stage of the Spider line. Venomous and dangerous — the Black Widow is a mission reward."
  },
  "072": {
    "dex": "072",
    "id": 72,
    "name": "Black Widow",
    "family": "Spider",
    "stage": 3,
    "category": "Arachnid",
    "sense": "Touch",
    "sig": "Venom bite",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 111,
      "atk": 129,
      "def": 93,
      "spd": 165
    },
    "sprite": "072",
    "desc": "Alpha stage of the Spider line. Venomous and dangerous — the Black Widow is a mission reward."
  },
  "073": {
    "dex": "073",
    "id": 73,
    "name": "Zoea",
    "family": "Crab",
    "stage": 1,
    "category": "Crustacean",
    "sense": "Smell",
    "sig": "Swimming",
    "evo": {
      "level": 14,
      "into": "074"
    },
    "stars": 1,
    "stats": {
      "hp": 67,
      "atk": 46,
      "def": 63,
      "spd": 34
    },
    "sprite": "073",
    "desc": "Young stage of the Crab line. Needs Scrap Metal — the Steel Crab is tougher but still a tide-pool creature."
  },
  "074": {
    "dex": "074",
    "id": 74,
    "name": "Crab",
    "family": "Crab",
    "stage": 2,
    "category": "Crustacean",
    "sense": "Smell",
    "sig": "Claw crush",
    "evo": {
      "item": "Scrap metal",
      "into": "075"
    },
    "stars": 1,
    "stats": {
      "hp": 102,
      "atk": 70,
      "def": 96,
      "spd": 51
    },
    "sprite": "074",
    "desc": "Adult stage of the Crab line. Needs Scrap Metal — the Steel Crab is tougher but still a tide-pool creature."
  },
  "075": {
    "dex": "075",
    "id": 75,
    "name": "Steel Crab",
    "family": "Crab",
    "stage": 3,
    "category": "Crustacean",
    "sense": "Smell",
    "sig": "Armor shell",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 149,
      "atk": 104,
      "def": 140,
      "spd": 77
    },
    "sprite": "075",
    "desc": "Alpha stage of the Crab line. Needs Scrap Metal — the Steel Crab is tougher but still a tide-pool creature."
  },
  "076": {
    "dex": "076",
    "id": 76,
    "name": "Larva",
    "family": "Lobster",
    "stage": 1,
    "category": "Crustacean",
    "sense": "Smell",
    "sig": "Swimming",
    "evo": {
      "level": 16,
      "into": "077"
    },
    "stars": 1,
    "stats": {
      "hp": 55,
      "atk": 52,
      "def": 52,
      "spd": 50
    },
    "sprite": "076",
    "desc": "Young stage of the Lobster line. The American Lobster is a rare deep catch."
  },
  "077": {
    "dex": "077",
    "id": 77,
    "name": "Lobster",
    "family": "Lobster",
    "stage": 2,
    "category": "Crustacean",
    "sense": "Smell",
    "sig": "Claw crush",
    "evo": {
      "level": 34,
      "into": "078"
    },
    "stars": 2,
    "stats": {
      "hp": 88,
      "atk": 85,
      "def": 85,
      "spd": 82
    },
    "sprite": "077",
    "desc": "Adult stage of the Lobster line. The American Lobster is a rare deep catch."
  },
  "078": {
    "dex": "078",
    "id": 78,
    "name": "American Lobster",
    "family": "Lobster",
    "stage": 3,
    "category": "Crustacean",
    "sense": "Smell",
    "sig": "Claw regrowth",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 122,
      "atk": 117,
      "def": 117,
      "spd": 113
    },
    "sprite": "078",
    "desc": "Alpha stage of the Lobster line. The American Lobster is a rare deep catch."
  },
  "079": {
    "dex": "079",
    "id": 79,
    "name": "Larva",
    "family": "Shrimp",
    "stage": 1,
    "category": "Crustacean",
    "sense": "Sight",
    "sig": "Swimming",
    "evo": {
      "level": 12,
      "into": "080"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "079",
    "desc": "Young stage of the Shrimp line. Common — the Mantis Shrimp is a rare, powerful catch."
  },
  "080": {
    "dex": "080",
    "id": 80,
    "name": "Shrimp",
    "family": "Shrimp",
    "stage": 2,
    "category": "Crustacean",
    "sense": "Sight",
    "sig": "Camouflage",
    "evo": {
      "level": 24,
      "into": "081"
    },
    "stars": 1,
    "stats": {
      "hp": 70,
      "atk": 83,
      "def": 58,
      "spd": 109
    },
    "sprite": "080",
    "desc": "Adult stage of the Shrimp line. Common — the Mantis Shrimp is a rare, powerful catch."
  },
  "081": {
    "dex": "081",
    "id": 81,
    "name": "Mantis Shrimp",
    "family": "Shrimp",
    "stage": 3,
    "category": "Crustacean",
    "sense": "Sight",
    "sig": "Punch strike",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 104,
      "atk": 122,
      "def": 86,
      "spd": 158
    },
    "sprite": "081",
    "desc": "Alpha stage of the Shrimp line. Common — the Mantis Shrimp is a rare, powerful catch."
  },
  "082": {
    "dex": "082",
    "id": 82,
    "name": "Hatchling",
    "family": "Octopus",
    "stage": 1,
    "category": "Mollusk",
    "sense": "Touch",
    "sig": "Camouflage",
    "evo": {
      "level": 16,
      "into": "083"
    },
    "stars": 1,
    "stats": {
      "hp": 50,
      "atk": 67,
      "def": 42,
      "spd": 50
    },
    "sprite": "082",
    "desc": "Young stage of the Octopus line. Lives in deep water — a mission reward."
  },
  "083": {
    "dex": "083",
    "id": 83,
    "name": "Octopus",
    "family": "Octopus",
    "stage": 2,
    "category": "Mollusk",
    "sense": "Touch",
    "sig": "Ink escape",
    "evo": {
      "level": 34,
      "into": "084"
    },
    "stars": 2,
    "stats": {
      "hp": 82,
      "atk": 107,
      "def": 69,
      "spd": 82
    },
    "sprite": "083",
    "desc": "Adult stage of the Octopus line. Lives in deep water — a mission reward."
  },
  "084": {
    "dex": "084",
    "id": 84,
    "name": "Giant Pacific Octopus",
    "family": "Octopus",
    "stage": 3,
    "category": "Mollusk",
    "sense": "Touch",
    "sig": "Problem solving",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 120,
      "atk": 156,
      "def": 102,
      "spd": 120
    },
    "sprite": "084",
    "desc": "Alpha stage of the Octopus line. Lives in deep water — a mission reward."
  },
  "085": {
    "dex": "085",
    "id": 85,
    "name": "Hatchling",
    "family": "Squid",
    "stage": 1,
    "category": "Mollusk",
    "sense": "Sight",
    "sig": "Jet propulsion",
    "evo": {
      "level": 16,
      "into": "086"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "085",
    "desc": "Young stage of the Squid line. Lives in the deep trench — a mission reward."
  },
  "086": {
    "dex": "086",
    "id": 86,
    "name": "Squid",
    "family": "Squid",
    "stage": 2,
    "category": "Mollusk",
    "sense": "Sight",
    "sig": "Ink escape",
    "evo": {
      "level": 34,
      "into": "087"
    },
    "stars": 2,
    "stats": {
      "hp": 75,
      "atk": 88,
      "def": 63,
      "spd": 114
    },
    "sprite": "086",
    "desc": "Adult stage of the Squid line. Lives in the deep trench — a mission reward."
  },
  "087": {
    "dex": "087",
    "id": 87,
    "name": "Giant Squid",
    "family": "Squid",
    "stage": 3,
    "category": "Mollusk",
    "sense": "Sight",
    "sig": "Size and strength",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 111,
      "atk": 129,
      "def": 93,
      "spd": 165
    },
    "sprite": "087",
    "desc": "Alpha stage of the Squid line. Lives in the deep trench — a mission reward."
  },
  "088": {
    "dex": "088",
    "id": 88,
    "name": "Hatchling",
    "family": "Snail",
    "stage": 1,
    "category": "Mollusk",
    "sense": "Smell",
    "sig": "Slime trail",
    "evo": {
      "level": 14,
      "into": "089"
    },
    "stars": 1,
    "stats": {
      "hp": 67,
      "atk": 46,
      "def": 63,
      "spd": 34
    },
    "sprite": "088",
    "desc": "Young stage of the Snail line. Needs Iron Ore — the Armored Snail is tougher but still a snail."
  },
  "089": {
    "dex": "089",
    "id": 89,
    "name": "Snail",
    "family": "Snail",
    "stage": 2,
    "category": "Mollusk",
    "sense": "Smell",
    "sig": "Shell retreat",
    "evo": {
      "item": "Iron ore",
      "into": "090"
    },
    "stars": 1,
    "stats": {
      "hp": 102,
      "atk": 70,
      "def": 96,
      "spd": 51
    },
    "sprite": "089",
    "desc": "Adult stage of the Snail line. Needs Iron Ore — the Armored Snail is tougher but still a snail."
  },
  "090": {
    "dex": "090",
    "id": 90,
    "name": "Armored Snail",
    "family": "Snail",
    "stage": 3,
    "category": "Mollusk",
    "sense": "Smell",
    "sig": "Scent tracking",
    "evo": null,
    "stars": 2,
    "stats": {
      "hp": 149,
      "atk": 104,
      "def": 140,
      "spd": 77
    },
    "sprite": "090",
    "desc": "Alpha stage of the Snail line. Needs Iron Ore — the Armored Snail is tougher but still a snail."
  },
  "106": {
    "dex": "106",
    "id": 106,
    "name": "Pup",
    "family": "Bat",
    "stage": 1,
    "category": "Mammal",
    "sense": "Echolocation",
    "sig": "Squeak",
    "evo": {
      "level": 16,
      "into": "107"
    },
    "stars": 1,
    "stats": {
      "hp": 46,
      "atk": 55,
      "def": 38,
      "spd": 71
    },
    "sprite": "106",
    "desc": "Young stage of the Bat line. The only Echolocation carrier in the main world — lives in the Echo Caves in the east."
  },
  "107": {
    "dex": "107",
    "id": 107,
    "name": "Bat",
    "family": "Bat",
    "stage": 2,
    "category": "Mammal",
    "sense": "Echolocation",
    "sig": "Echo navigation",
    "evo": {
      "level": 36,
      "into": "108"
    },
    "stars": 2,
    "stats": {
      "hp": 75,
      "atk": 88,
      "def": 63,
      "spd": 114
    },
    "sprite": "107",
    "desc": "Adult stage of the Bat line. The only Echolocation carrier in the main world — lives in the Echo Caves in the east."
  },
  "108": {
    "dex": "108",
    "id": 108,
    "name": "Vampire Bat",
    "family": "Bat",
    "stage": 3,
    "category": "Mammal",
    "sense": "Echolocation",
    "sig": "Blood drain",
    "evo": null,
    "stars": 3,
    "stats": {
      "hp": 111,
      "atk": 129,
      "def": 93,
      "spd": 165
    },
    "sprite": "108",
    "desc": "Alpha stage of the Bat line. The only Echolocation carrier in the main world — lives in the Echo Caves in the east."
  }
};
