// Metamonsters pass 3 — ANCIENTS + MYSTERY creatures (the 75+ world).
// 15 ancients (A01-A15) + 5 mystery creatures (M1-M5), single-stage, no evolutions.
// Sources: METAMONSTERS-DEX.md (75+ world table: names, ancient typings, senses,
// signatures), METAMONSTERS-STARS.md (5-star: A01/A03/A04/A06/A10; the other ten
// ancients 4-star; mystery creatures are the 5 rarest — stars 5 per the task spec),
// METAMONSTERS-75-WORLD.md (mystery typings, senses, signatures, hideouts),
// DATA-SCHEMA.md (base-stat RULE: archetype fractions, rounded; tank hp .32 atk .22
// def .30 spd .16; attacker hp .24 atk .32 def .20 spd .24; fast hp .22 atk .26 def .18
// spd .34; where rounding leaves a 1-point gap it goes to hp).
// Stats totals: 4-star ancients 520, 5-star ancients 580, mystery 600. The stars
// bonus (+5/+12 per stat) is NOT added — these totals already include rarity.
// Learnsets follow the moves.js rule (sig Lv 1 + base-category damaging move Lv 5 +
// own-sense damaging move Lv 10 + second base-category damaging move Lv 15); the
// "Ancient " prefix is stripped to get the base category for move picks.
// SIG_MOVES entries follow the moves.js rule: attack-implying signatures are power 65,
// kind "category"; flight signatures copy the evasive shape from "Camouflage"/"Flight"
// (power null, eva +1 self); "Shell armor" copies the def-up shape from "Thick hide".
// NOTE on "Venom": no SIG_MOVES entry in moves.js carries a poison effect, so the
// poison shape is copied from MOVES ("poisonFang"/"poisonGas": {status, chance 0.3}).
// SIG_MOVES is keyed by signature NAME and shared with the main world — this entry
// also covers main-world "Venom" users (025, 027, 065, 067), whose signature gains
// the may-poison effect. That is the task spec's call, flagged here, not a silent edit.
// id values 201-215 (ancients) and 301-305 (mystery) continue past the main dex
// (1-90, 106-108); the engine looks creatures up by dex key, not id.
// Ancients have NO mutant forms (75-WORLD.md) — no mutant sprites, no MUTANT_NAMES.
// Loaded after moves.js, before engine.js; the merge at the bottom puts these into
// the live DEX / LEARNSETS / SIG_MOVES tables so the engine needs no changes.

const ANCIENT_DEX = {
  "A01": {
    "dex": "A01",
    "id": 201,
    "name": "Mammoth",
    "family": "Mammoth",
    "stage": 3,
    "category": "Ancient Mammal",
    "sense": "Smell",
    "sig": "Tusk charge",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 185,
      "atk": 128,
      "def": 174,
      "spd": 93
    },
    "sprite": "a01",
    "desc": "The largest land animal of the old world. Its tusks can level trees, and its herds cross the frozen steppe like moving hills."
  },
  "A02": {
    "dex": "A02",
    "id": 202,
    "name": "Dire Wolf",
    "family": "Dire Wolf",
    "stage": 3,
    "category": "Ancient Mammal",
    "sense": "Smell",
    "sig": "Pack hunting",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 114,
      "atk": 135,
      "def": 94,
      "spd": 177
    },
    "sprite": "a02",
    "desc": "Bigger and older than any wolf in the main world. Dire wolf packs hunt the frozen caves of the Dire Den as one animal."
  },
  "A03": {
    "dex": "A03",
    "id": 203,
    "name": "Saber-Toothed Tiger",
    "family": "Saber-Toothed Tiger",
    "stage": 3,
    "category": "Ancient Mammal",
    "sense": "Sight",
    "sig": "Saber fangs (bite force)",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 139,
      "atk": 186,
      "def": 116,
      "spd": 139
    },
    "sprite": "a03",
    "desc": "A tiger with fangs like knives. It stalks the dry grass of the Saber Fields, and nothing it picks as prey has ever gotten away."
  },
  "A04": {
    "dex": "A04",
    "id": 204,
    "name": "Pterodactyl",
    "family": "Pterodactyl",
    "stage": 3,
    "category": "Ancient Bird",
    "sense": "Sight",
    "sig": "Soaring flight",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 128,
      "atk": 151,
      "def": 104,
      "spd": 197
    },
    "sprite": "a04",
    "desc": "A flying reptile that rules the cliffs. Its shadow crossing the ground is the last warning anything below ever gets."
  },
  "A05": {
    "dex": "A05",
    "id": 205,
    "name": "Archaeopteryx",
    "family": "Archaeopteryx",
    "stage": 3,
    "category": "Ancient Bird",
    "sense": "Sight",
    "sig": "First flight (gliding)",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 114,
      "atk": 135,
      "def": 94,
      "spd": 177
    },
    "sprite": "a05",
    "desc": "The first bird — half reptile, half feather. It glides between the cliff nests of the old world, older than every bird that came after."
  },
  "A06": {
    "dex": "A06",
    "id": 206,
    "name": "T. Rex",
    "family": "T. Rex",
    "stage": 3,
    "category": "Ancient Reptile",
    "sense": "Smell",
    "sig": "Bone-crushing bite",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 139,
      "atk": 186,
      "def": 116,
      "spd": 139
    },
    "sprite": "a06",
    "desc": "The king of the badlands. Its bite crushes bone, and its roar rolls across the cracked red rock for miles."
  },
  "A07": {
    "dex": "A07",
    "id": 207,
    "name": "Triceratops",
    "family": "Triceratops",
    "stage": 3,
    "category": "Ancient Reptile",
    "sense": "Sight",
    "sig": "Horn charge",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 167,
      "atk": 114,
      "def": 156,
      "spd": 83
    },
    "sprite": "a07",
    "desc": "A walking wall with three horns. Triceratops herds cross the open plains, and even the rex thinks twice before charging one."
  },
  "A08": {
    "dex": "A08",
    "id": 208,
    "name": "Velociraptor",
    "family": "Velociraptor",
    "stage": 3,
    "category": "Ancient Reptile",
    "sense": "Sight",
    "sig": "Pack hunting (speed)",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 114,
      "atk": 135,
      "def": 94,
      "spd": 177
    },
    "sprite": "a08",
    "desc": "Small, fast, and never alone. Raptor packs hunt the tall grass in perfect step, and the grass itself seems to run."
  },
  "A09": {
    "dex": "A09",
    "id": 209,
    "name": "Beelzebufo",
    "family": "Beelzebufo",
    "stage": 3,
    "category": "Ancient Amphibian",
    "sense": "Sight",
    "sig": "Crushing bite",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 167,
      "atk": 114,
      "def": 156,
      "spd": 83
    },
    "sprite": "a09",
    "desc": "The devil frog. It waits under the black water of the Devil's Pond, and its jaws can crush anything that comes to drink."
  },
  "A10": {
    "dex": "A10",
    "id": 210,
    "name": "Megalodon",
    "family": "Megalodon",
    "stage": 3,
    "category": "Ancient Fish",
    "sense": "Electroreception",
    "sig": "Strongest bite",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 139,
      "atk": 186,
      "def": 116,
      "spd": 139
    },
    "sprite": "a10",
    "desc": "The biggest shark that ever lived. Its bite is the strongest in the game, and the deep water belongs to it alone."
  },
  "A11": {
    "dex": "A11",
    "id": 211,
    "name": "Dunkleosteus",
    "family": "Dunkleosteus",
    "stage": 3,
    "category": "Ancient Fish",
    "sense": "Touch",
    "sig": "Armored jaws",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 167,
      "atk": 114,
      "def": 156,
      "spd": 83
    },
    "sprite": "a11",
    "desc": "An armored fish from before sharks. Its jaws are plates of bone, and the reef of bone and stone is its home."
  },
  "A12": {
    "dex": "A12",
    "id": 212,
    "name": "Meganeura",
    "family": "Meganeura",
    "stage": 3,
    "category": "Ancient Insect",
    "sense": "Sight",
    "sig": "Giant wingspan flight",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 114,
      "atk": 135,
      "def": 94,
      "spd": 177
    },
    "sprite": "a12",
    "desc": "A dragonfly the size of an eagle. It hunts between the giant trees of the canopy, wings loud enough to hear coming."
  },
  "A13": {
    "dex": "A13",
    "id": 213,
    "name": "Megarachne",
    "family": "Megarachne",
    "stage": 3,
    "category": "Ancient Arachnid",
    "sense": "Touch",
    "sig": "Venom",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 125,
      "atk": 166,
      "def": 104,
      "spd": 125
    },
    "sprite": "a13",
    "desc": "A giant spider that owns the dark of the Spider's Hollow. One bite is enough — the venom does the rest."
  },
  "A14": {
    "dex": "A14",
    "id": 214,
    "name": "Jaekelopterus",
    "family": "Jaekelopterus",
    "stage": 3,
    "category": "Ancient Crustacean",
    "sense": "Touch",
    "sig": "Giant claws",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 167,
      "atk": 114,
      "def": 156,
      "spd": 83
    },
    "sprite": "a14",
    "desc": "A sea scorpion the size of a person. Its claws snap shut in the shallows, and nothing armored survives them."
  },
  "A15": {
    "dex": "A15",
    "id": 215,
    "name": "Ammonite",
    "family": "Ammonite",
    "stage": 3,
    "category": "Ancient Mollusk",
    "sense": "Smell",
    "sig": "Shell armor",
    "evo": null,
    "stars": 4,
    "stats": {
      "hp": 167,
      "atk": 114,
      "def": 156,
      "spd": 83
    },
    "sprite": "a15",
    "desc": "A spiral-shelled swimmer from the oldest seas. Its shell turns away bites that would break anything else."
  }
};

const MYSTERY_DEX = {
  "M1": {
    "dex": "M1",
    "id": 301,
    "name": "Spinosaurus",
    "family": "Spinosaurus",
    "stage": 3,
    "category": "Ancient Reptile",
    "sense": "Smell",
    "sig": "Spine sail slam",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 144,
      "atk": 192,
      "def": 120,
      "spd": 144
    },
    "sprite": "spinosaurus",
    "desc": "A sail-backed hunter of the Deep River. When the river goes quiet and the fish vanish, it is near — and it only comes out at dusk."
  },
  "M2": {
    "dex": "M2",
    "id": 302,
    "name": "Quetzalcoatlus",
    "family": "Quetzalcoatlus",
    "stage": 3,
    "category": "Ancient Bird",
    "sense": "Sight",
    "sig": "Sky shadow dive",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 132,
      "atk": 156,
      "def": 108,
      "spd": 204
    },
    "sprite": "quetzalcoatlus",
    "desc": "The biggest flying animal in the game. It only flies at dawn, and its shadow on the ground is how you know it is above you."
  },
  "M3": {
    "dex": "M3",
    "id": 303,
    "name": "Titanoboa",
    "family": "Titanoboa",
    "stage": 3,
    "category": "Ancient Reptile",
    "sense": "Heat",
    "sig": "Constricting crush",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 144,
      "atk": 192,
      "def": 120,
      "spd": 144
    },
    "sprite": "titanoboa",
    "desc": "A snake longer than a house, coiled in the hottest part of the Burning Marsh. Steam rises off the water where it waits."
  },
  "M4": {
    "dex": "M4",
    "id": 304,
    "name": "Megatherium",
    "family": "Megatherium",
    "stage": 3,
    "category": "Ancient Mammal",
    "sense": "Smell",
    "sig": "Tree-toppling slam",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 192,
      "atk": 132,
      "def": 180,
      "spd": 96
    },
    "sprite": "megatherium",
    "desc": "A giant sloth the size of a house. Slow, but strong enough to knock down trees — follow the fruit trail the exiles leave out for it."
  },
  "M5": {
    "dex": "M5",
    "id": 305,
    "name": "Giant Vampire Bat",
    "family": "Giant Vampire Bat",
    "stage": 3,
    "category": "Ancient Mammal",
    "sense": "Echolocation",
    "sig": "Silent hunt",
    "evo": null,
    "stars": 5,
    "stats": {
      "hp": 132,
      "atk": 156,
      "def": 108,
      "spd": 204
    },
    "sprite": "giant-vampire-bat",
    "desc": "The ancestor of the main world's Vampire Bat, hunting the Dark Caves in total darkness. You cannot see it — you have to listen for it."
  }
};

const ANCIENT_LEARNSETS = {
  "A01": [
    { "move": "sig", "level": 1 },
    { "move": "bite", "level": 5 },
    { "move": "poisonGas", "level": 10 },
    { "move": "clawSlash", "level": 15 }
  ],
  "A02": [
    { "move": "sig", "level": 1 },
    { "move": "bite", "level": 5 },
    { "move": "poisonGas", "level": 10 },
    { "move": "clawSlash", "level": 15 }
  ],
  "A03": [
    { "move": "sig", "level": 1 },
    { "move": "bite", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "clawSlash", "level": 15 }
  ],
  "A04": [
    { "move": "sig", "level": 1 },
    { "move": "peck", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "wingAttack", "level": 15 }
  ],
  "A05": [
    { "move": "sig", "level": 1 },
    { "move": "peck", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "wingAttack", "level": 15 }
  ],
  "A06": [
    { "move": "sig", "level": 1 },
    { "move": "constrict", "level": 5 },
    { "move": "poisonGas", "level": 10 },
    { "move": "venomBite", "level": 15 }
  ],
  "A07": [
    { "move": "sig", "level": 1 },
    { "move": "constrict", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "venomBite", "level": 15 }
  ],
  "A08": [
    { "move": "sig", "level": 1 },
    { "move": "constrict", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "venomBite", "level": 15 }
  ],
  "A09": [
    { "move": "sig", "level": 1 },
    { "move": "tongueLash", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "poisonSkin", "level": 15 }
  ],
  "A10": [
    { "move": "sig", "level": 1 },
    { "move": "waterJet", "level": 5 },
    { "move": "electricShock", "level": 10 },
    { "move": "finSlash", "level": 15 }
  ],
  "A11": [
    { "move": "sig", "level": 1 },
    { "move": "waterJet", "level": 5 },
    { "move": "tremor", "level": 10 },
    { "move": "finSlash", "level": 15 }
  ],
  "A12": [
    { "move": "sig", "level": 1 },
    { "move": "sting", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "swarmAttack", "level": 15 }
  ],
  "A13": [
    { "move": "sig", "level": 1 },
    { "move": "webShot", "level": 5 },
    { "move": "tremor", "level": 10 },
    { "move": "poisonFang", "level": 15 }
  ],
  "A14": [
    { "move": "sig", "level": 1 },
    { "move": "bubbleBeam", "level": 5 },
    { "move": "tremor", "level": 10 },
    { "move": "clawCrush", "level": 15 }
  ],
  "A15": [
    { "move": "sig", "level": 1 },
    { "move": "inkBlast", "level": 5 },
    { "move": "poisonGas", "level": 10 },
    { "move": "tentacleWhip", "level": 15 }
  ],
  "M1": [
    { "move": "sig", "level": 1 },
    { "move": "constrict", "level": 5 },
    { "move": "poisonGas", "level": 10 },
    { "move": "venomBite", "level": 15 }
  ],
  "M2": [
    { "move": "sig", "level": 1 },
    { "move": "peck", "level": 5 },
    { "move": "focusBeam", "level": 10 },
    { "move": "wingAttack", "level": 15 }
  ],
  "M3": [
    { "move": "sig", "level": 1 },
    { "move": "constrict", "level": 5 },
    { "move": "heatWave", "level": 10 },
    { "move": "venomBite", "level": 15 }
  ],
  "M4": [
    { "move": "sig", "level": 1 },
    { "move": "bite", "level": 5 },
    { "move": "poisonGas", "level": 10 },
    { "move": "clawSlash", "level": 15 }
  ],
  "M5": [
    { "move": "sig", "level": 1 },
    { "move": "bite", "level": 5 },
    { "move": "sonarPulse", "level": 10 },
    { "move": "clawSlash", "level": 15 }
  ]
};

const ANCIENT_SIG_MOVES = {
  "Tusk charge": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Pack hunting": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Saber fangs (bite force)": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Soaring flight": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "First flight (gliding)": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Bone-crushing bite": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Horn charge": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Pack hunting (speed)": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Crushing bite": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Strongest bite": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Armored jaws": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Giant wingspan flight": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "eva",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature evasion — raises your evasion."
  },
  "Venom": {
    "power": 65,
    "kind": "category",
    "effect": {
      "status": "poison",
      "chance": 0.3
    },
    "desc": "Signature attack. May poison."
  },
  "Giant claws": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Shell armor": {
    "power": null,
    "kind": "category",
    "effect": {
      "stat": "def",
      "stages": 1,
      "target": "self"
    },
    "desc": "Signature defense — raises your Defense."
  },
  "Spine sail slam": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Sky shadow dive": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Constricting crush": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Tree-toppling slam": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  },
  "Silent hunt": {
    "power": 65,
    "kind": "category",
    "effect": null,
    "desc": "Signature attack."
  }
};

// Merge into the live tables so the engine needs no changes to look creatures up.
Object.assign(DEX, ANCIENT_DEX, MYSTERY_DEX);
Object.assign(LEARNSETS, ANCIENT_LEARNSETS);
Object.assign(SIG_MOVES, ANCIENT_SIG_MOVES);
