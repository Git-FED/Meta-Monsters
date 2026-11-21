// Metamonsters v1 — ITEMS. 83 items: 12 Healing & Medicine, 12 Food & Drink, 8 Catching,
// 14 Materials, 10 Gear & Clothing, 8 Transport & Upgrades, 9 Battle & Performance,
// 8 Key Items, 2 Money.
// Sources: METAMONSTERS-ITEMS.md (all 83 items, categories, game uses), DATA-SCHEMA.md
// (price RULES — the doc gives no prices; healing amounts RULE).
// Evolution items (use "evo"): Car Battery -> Electric Eel #054, Iron Ore -> Armored Snail #090,
// Scrap Metal -> Steel Crab #075, Herbs -> Poison Dart Frog #036, Cold Pack -> Emperor Penguin #021.
// Cash and coins are currency, not usable inventory items (use null, price 0).
// Note: Cold Pack and Herbs also have their doc healing/crafting uses; those are kept in
// desc (and Cold Pack keeps cures "bruised") while use is "evo" per the schema.

const ITEMS = {
  "bandage": {
    "id": "bandage",
    "name": "Bandage",
    "cat": "Healing & Medicine",
    "price": 50,
    "desc": "Restores a small amount of HP to one creature or the player.",
    "use": "heal",
    "heal": 20
  },
  "firstAidKit": {
    "id": "firstAidKit",
    "name": "First aid kit",
    "cat": "Healing & Medicine",
    "price": 150,
    "desc": "Restores a large amount of HP to one creature or the player.",
    "use": "heal",
    "heal": 80
  },
  "antiseptic": {
    "id": "antiseptic",
    "name": "Antiseptic",
    "cat": "Healing & Medicine",
    "price": 60,
    "desc": "Cleans a wound, stops infection from getting worse.",
    "use": "cure",
    "cures": "infection"
  },
  "painkillers": {
    "id": "painkillers",
    "name": "Painkillers",
    "cat": "Healing & Medicine",
    "price": 50,
    "desc": "Removes the pain debuff, restores a little HP.",
    "use": "heal",
    "heal": 10
  },
  "splint": {
    "id": "splint",
    "name": "Splint",
    "cat": "Healing & Medicine",
    "price": 100,
    "desc": "Fixes a broken limb, removes the crippled debuff.",
    "use": "cure",
    "cures": "crippled"
  },
  "antibiotics": {
    "id": "antibiotics",
    "name": "Antibiotics",
    "cat": "Healing & Medicine",
    "price": 120,
    "desc": "Cures infection and disease over time.",
    "use": "cure",
    "cures": "infection"
  },
  "gauze": {
    "id": "gauze",
    "name": "Gauze",
    "cat": "Healing & Medicine",
    "price": 50,
    "desc": "Stops bleeding, restores a small amount of HP.",
    "use": "cure",
    "cures": "bleeding",
    "heal": 15
  },
  "tweezers": {
    "id": "tweezers",
    "name": "Tweezers",
    "cat": "Healing & Medicine",
    "price": 40,
    "desc": "Removes thorns, stingers, and splinters (removes poison).",
    "use": "cure",
    "cures": "poison"
  },
  "coldPack": {
    "id": "coldPack",
    "name": "Cold pack",
    "cat": "Healing & Medicine",
    "price": 60,
    "desc": "Reduces swelling, removes the bruised debuff. Also the evolution item for Penguin -> Emperor Penguin.",
    "use": "evo",
    "evoFor": "021",
    "cures": "bruised"
  },
  "smellingSalts": {
    "id": "smellingSalts",
    "name": "Smelling salts",
    "cat": "Healing & Medicine",
    "price": 100,
    "desc": "Wakes up a fainted creature or player.",
    "use": "cure",
    "cures": "fainted"
  },
  "herbalSalve": {
    "id": "herbalSalve",
    "name": "Herbal salve",
    "cat": "Healing & Medicine",
    "price": 80,
    "desc": "Slow HP recovery over time, made from gathered herbs.",
    "use": "heal",
    "heal": 30
  },
  "salineSolution": {
    "id": "salineSolution",
    "name": "Saline solution",
    "cat": "Healing & Medicine",
    "price": 40,
    "desc": "Cleans wounds, small HP restore, pairs with gauze.",
    "use": "heal",
    "heal": 10
  },
  "cannedFood": {
    "id": "cannedFood",
    "name": "Canned food",
    "cat": "Food & Drink",
    "price": 20,
    "desc": "Restores hunger, small HP restore.",
    "use": "food",
    "heal": 10
  },
  "driedMeat": {
    "id": "driedMeat",
    "name": "Dried meat",
    "cat": "Food & Drink",
    "price": 25,
    "desc": "Restores hunger, lightweight, never spoils.",
    "use": "food",
    "heal": 10
  },
  "berries": {
    "id": "berries",
    "name": "Berries",
    "cat": "Food & Drink",
    "price": 10,
    "desc": "Restores a little hunger, some types cure status effects.",
    "use": "food",
    "heal": 5
  },
  "cookedMeal": {
    "id": "cookedMeal",
    "name": "Cooked meal",
    "cat": "Food & Drink",
    "price": 60,
    "desc": "Restores a lot of hunger and HP, grants a short buff.",
    "use": "food",
    "heal": 30
  },
  "waterBottle": {
    "id": "waterBottle",
    "name": "Water bottle",
    "cat": "Food & Drink",
    "price": 10,
    "desc": "Restores hydration, small HP restore.",
    "use": "food",
    "heal": 5
  },
  "trailMix": {
    "id": "trailMix",
    "name": "Trail mix",
    "cat": "Food & Drink",
    "price": 20,
    "desc": "Restores hunger and stamina, eaten on the move.",
    "use": "food",
    "heal": 10
  },
  "cannedBeans": {
    "id": "cannedBeans",
    "name": "Canned beans",
    "cat": "Food & Drink",
    "price": 15,
    "desc": "Restores hunger, a little HP.",
    "use": "food",
    "heal": 10
  },
  "bread": {
    "id": "bread",
    "name": "Bread",
    "cat": "Food & Drink",
    "price": 10,
    "desc": "Restores hunger, cheap and common.",
    "use": "food",
    "heal": 5
  },
  "fruit": {
    "id": "fruit",
    "name": "Fruit",
    "cat": "Food & Drink",
    "price": 15,
    "desc": "Restores a little hunger and hydration.",
    "use": "food",
    "heal": 10
  },
  "coffee": {
    "id": "coffee",
    "name": "Coffee",
    "cat": "Food & Drink",
    "price": 20,
    "desc": "Restores stamina, keeps the player alert at night.",
    "use": "food",
    "heal": 5
  },
  "cannedSoup": {
    "id": "cannedSoup",
    "name": "Canned soup",
    "cat": "Food & Drink",
    "price": 30,
    "desc": "Restores hunger and HP, warms the player in cold weather.",
    "use": "food",
    "heal": 20
  },
  "driedFruit": {
    "id": "driedFruit",
    "name": "Dried fruit",
    "cat": "Food & Drink",
    "price": 15,
    "desc": "Restores a little hunger, lightweight.",
    "use": "food",
    "heal": 5
  },
  "net": {
    "id": "net",
    "name": "Net",
    "cat": "Catching",
    "price": 100,
    "desc": "Basic catching tool, used on small creatures.",
    "use": "catch",
    "catchMod": 1.0
  },
  "trap": {
    "id": "trap",
    "name": "Trap",
    "cat": "Catching",
    "price": 150,
    "desc": "Set on the ground, catches a creature that walks into it.",
    "use": "catch",
    "catchMod": 1.2
  },
  "cage": {
    "id": "cage",
    "name": "Cage",
    "cat": "Catching",
    "price": 300,
    "desc": "Holds a caught creature, used on medium creatures.",
    "use": "catch",
    "catchMod": 1.5
  },
  "snare": {
    "id": "snare",
    "name": "Snare",
    "cat": "Catching",
    "price": 80,
    "desc": "Trip-line trap, catches a creature by the leg.",
    "use": "catch",
    "catchMod": 0.9
  },
  "lasso": {
    "id": "lasso",
    "name": "Lasso",
    "cat": "Catching",
    "price": 120,
    "desc": "Thrown to catch a creature from a distance.",
    "use": "catch",
    "catchMod": 1.1
  },
  "tranquilizerDarts": {
    "id": "tranquilizerDarts",
    "name": "Tranquilizer darts",
    "cat": "Catching",
    "price": 200,
    "desc": "Puts a creature to sleep so it is easier to catch.",
    "use": "catch",
    "catchMod": 1.3
  },
  "bait": {
    "id": "bait",
    "name": "Bait",
    "cat": "Catching",
    "price": 20,
    "desc": "Lures a creature into a trap or into range.",
    "use": "catch",
    "catchMod": 1.0
  },
  "whistle": {
    "id": "whistle",
    "name": "Whistle",
    "cat": "Catching",
    "price": 60,
    "desc": "Lures a creature toward you with sound.",
    "use": "catch",
    "catchMod": 1.0
  },
  "wood": {
    "id": "wood",
    "name": "Wood",
    "cat": "Materials",
    "price": 5,
    "desc": "Crafting and building material, gathered from trees.",
    "use": null
  },
  "stone": {
    "id": "stone",
    "name": "Stone",
    "cat": "Materials",
    "price": 5,
    "desc": "Crafting and building material, gathered from rocks.",
    "use": null
  },
  "ironOre": {
    "id": "ironOre",
    "name": "Iron ore",
    "cat": "Materials",
    "price": 40,
    "desc": "Refined into iron for tools and upgrades. Also the evolution item for Snail -> Armored Snail.",
    "use": "evo",
    "evoFor": "090"
  },
  "copperOre": {
    "id": "copperOre",
    "name": "Copper ore",
    "cat": "Materials",
    "price": 30,
    "desc": "Refined into copper for wiring and parts.",
    "use": null
  },
  "plantFiber": {
    "id": "plantFiber",
    "name": "Plant fiber",
    "cat": "Materials",
    "price": 5,
    "desc": "Crafted into rope, bandages, and cloth.",
    "use": null
  },
  "leather": {
    "id": "leather",
    "name": "Leather",
    "cat": "Materials",
    "price": 60,
    "desc": "Crafted into clothing, bags, and armor.",
    "use": null
  },
  "hide": {
    "id": "hide",
    "name": "Hide",
    "cat": "Materials",
    "price": 30,
    "desc": "Raw animal skin, tanned into leather.",
    "use": null
  },
  "herbs": {
    "id": "herbs",
    "name": "Herbs",
    "cat": "Materials",
    "price": 15,
    "desc": "Brewed into salves and medicine. Also the evolution item for Frog -> Poison Dart Frog.",
    "use": "evo",
    "evoFor": "036"
  },
  "clay": {
    "id": "clay",
    "name": "Clay",
    "cat": "Materials",
    "price": 10,
    "desc": "Crafted into pots and building blocks.",
    "use": null
  },
  "scrapMetal": {
    "id": "scrapMetal",
    "name": "Scrap metal",
    "cat": "Materials",
    "price": 25,
    "desc": "Salvaged metal, crafted into parts and tools. Also the evolution item for Crab -> Steel Crab.",
    "use": "evo",
    "evoFor": "075"
  },
  "nails": {
    "id": "nails",
    "name": "Nails",
    "cat": "Materials",
    "price": 10,
    "desc": "Building material, holds structures together.",
    "use": null
  },
  "string": {
    "id": "string",
    "name": "String",
    "cat": "Materials",
    "price": 5,
    "desc": "Crafting material, ties and binds.",
    "use": null
  },
  "feathers": {
    "id": "feathers",
    "name": "Feathers",
    "cat": "Materials",
    "price": 15,
    "desc": "Crafting material, arrows and decoration.",
    "use": null
  },
  "bones": {
    "id": "bones",
    "name": "Bones",
    "cat": "Materials",
    "price": 20,
    "desc": "Crafting material, tools and decoration.",
    "use": null
  },
  "backpack": {
    "id": "backpack",
    "name": "Backpack",
    "cat": "Gear & Clothing",
    "price": 200,
    "desc": "Carries more items, bigger inventory.",
    "use": null
  },
  "boots": {
    "id": "boots",
    "name": "Boots",
    "cat": "Gear & Clothing",
    "price": 150,
    "desc": "Walk faster, protection from rough ground.",
    "use": null
  },
  "jacket": {
    "id": "jacket",
    "name": "Jacket",
    "cat": "Gear & Clothing",
    "price": 200,
    "desc": "Protection from cold and rain.",
    "use": null
  },
  "gloves": {
    "id": "gloves",
    "name": "Gloves",
    "cat": "Gear & Clothing",
    "price": 100,
    "desc": "Protection when climbing and handling rough materials.",
    "use": null
  },
  "hat": {
    "id": "hat",
    "name": "Hat",
    "cat": "Gear & Clothing",
    "price": 100,
    "desc": "Protection from sun and rain.",
    "use": null
  },
  "sleepingBag": {
    "id": "sleepingBag",
    "name": "Sleeping bag",
    "cat": "Gear & Clothing",
    "price": 250,
    "desc": "Sleep anywhere, restores HP and stamina.",
    "use": null
  },
  "belt": {
    "id": "belt",
    "name": "Belt",
    "cat": "Gear & Clothing",
    "price": 120,
    "desc": "Carries extra tools, small inventory boost.",
    "use": null
  },
  "canteen": {
    "id": "canteen",
    "name": "Canteen",
    "cat": "Gear & Clothing",
    "price": 100,
    "desc": "Carries extra water, refills at water sources.",
    "use": null
  },
  "rainPoncho": {
    "id": "rainPoncho",
    "name": "Rain poncho",
    "cat": "Gear & Clothing",
    "price": 150,
    "desc": "Keeps the player dry in rain and storms.",
    "use": null
  },
  "sunglasses": {
    "id": "sunglasses",
    "name": "Sunglasses",
    "cat": "Gear & Clothing",
    "price": 120,
    "desc": "Cuts glare, helps spot creatures in bright light.",
    "use": null
  },
  "bicycleParts": {
    "id": "bicycleParts",
    "name": "Bicycle parts",
    "cat": "Transport & Upgrades",
    "price": 150,
    "desc": "Repairs and upgrades the bicycle.",
    "use": null
  },
  "tire": {
    "id": "tire",
    "name": "Tire",
    "cat": "Transport & Upgrades",
    "price": 120,
    "desc": "Replaces a flat tire on the bicycle or car.",
    "use": null
  },
  "gasoline": {
    "id": "gasoline",
    "name": "Gasoline",
    "cat": "Transport & Upgrades",
    "price": 40,
    "desc": "Fuel for the car.",
    "use": null
  },
  "carBattery": {
    "id": "carBattery",
    "name": "Car battery",
    "cat": "Transport & Upgrades",
    "price": 500,
    "desc": "Powers the car, needed to start it. Also the evolution item for Eel -> Electric Eel.",
    "use": "evo",
    "evoFor": "054"
  },
  "engineParts": {
    "id": "engineParts",
    "name": "Engine parts",
    "cat": "Transport & Upgrades",
    "price": 300,
    "desc": "Repairs and upgrades the car engine.",
    "use": null
  },
  "oil": {
    "id": "oil",
    "name": "Oil",
    "cat": "Transport & Upgrades",
    "price": 60,
    "desc": "Keeps the car engine running, needed for maintenance.",
    "use": null
  },
  "spareParts": {
    "id": "spareParts",
    "name": "Spare parts",
    "cat": "Transport & Upgrades",
    "price": 80,
    "desc": "General repair material for bicycle, car, and flying gear.",
    "use": null
  },
  "fuelCan": {
    "id": "fuelCan",
    "name": "Fuel can",
    "cat": "Transport & Upgrades",
    "price": 100,
    "desc": "Carries extra gasoline for long trips.",
    "use": null
  },
  "adrenalineShot": {
    "id": "adrenalineShot",
    "name": "Adrenaline shot",
    "cat": "Battle & Performance",
    "price": 150,
    "desc": "Short attack and speed boost in battle.",
    "use": "battle",
    "battle": "atkSpdBoost"
  },
  "flare": {
    "id": "flare",
    "name": "Flare",
    "cat": "Battle & Performance",
    "price": 80,
    "desc": "Lights a wide area, scares off creatures at night.",
    "use": "battle",
    "battle": "scareOff"
  },
  "smokeBomb": {
    "id": "smokeBomb",
    "name": "Smoke bomb",
    "cat": "Battle & Performance",
    "price": 120,
    "desc": "Blocks a creature's sight, lets you escape a battle.",
    "use": "battle",
    "battle": "escape"
  },
  "pepperSpray": {
    "id": "pepperSpray",
    "name": "Pepper spray",
    "cat": "Battle & Performance",
    "price": 100,
    "desc": "Blinds an attacking creature, lets you escape.",
    "use": "battle",
    "battle": "escape"
  },
  "energyDrink": {
    "id": "energyDrink",
    "name": "Energy drink",
    "cat": "Battle & Performance",
    "price": 60,
    "desc": "Restores stamina fast, short speed boost.",
    "use": "battle",
    "battle": "spdBoost"
  },
  "proteinBar": {
    "id": "proteinBar",
    "name": "Protein bar",
    "cat": "Battle & Performance",
    "price": 40,
    "desc": "Restores stamina and a little HP in battle.",
    "use": "battle",
    "battle": "staminaHeal"
  },
  "airHorn": {
    "id": "airHorn",
    "name": "Air horn",
    "cat": "Battle & Performance",
    "price": 90,
    "desc": "Loud blast, startles creatures, signals allies.",
    "use": "battle",
    "battle": "startle"
  },
  "bearSpray": {
    "id": "bearSpray",
    "name": "Bear spray",
    "cat": "Battle & Performance",
    "price": 130,
    "desc": "Strong deterrent, drives off aggressive creatures.",
    "use": "battle",
    "battle": "scareOff"
  },
  "chemicalX": {
    "id": "chemicalX",
    "name": "Chemical X",
    "cat": "Battle & Performance",
    "price": 5000,
    "desc": "Experimental substance, triggers Mega Evolution in battle (one dose per use). Rare, not stocked in normal shops.",
    "use": "battle",
    "battle": "megaEvolve"
  },
  "map": {
    "id": "map",
    "name": "Map",
    "cat": "Key Items",
    "price": 0,
    "desc": "Shows the region, marks towns and routes.",
    "use": null
  },
  "radio": {
    "id": "radio",
    "name": "Radio",
    "cat": "Key Items",
    "price": 0,
    "desc": "Hears news, weather warnings, and story broadcasts.",
    "use": null
  },
  "walkieTalkie": {
    "id": "walkieTalkie",
    "name": "Walkie-talkie",
    "cat": "Key Items",
    "price": 0,
    "desc": "Talks to allies and quest contacts at a distance.",
    "use": null
  },
  "camera": {
    "id": "camera",
    "name": "Camera",
    "cat": "Key Items",
    "price": 0,
    "desc": "Takes photos, records creatures for the dex.",
    "use": null
  },
  "journal": {
    "id": "journal",
    "name": "Journal",
    "cat": "Key Items",
    "price": 0,
    "desc": "Tracks quests, notes, and discovered locations.",
    "use": null
  },
  "idBadge": {
    "id": "idBadge",
    "name": "ID badge",
    "cat": "Key Items",
    "price": 0,
    "desc": "Proves your certifications, opens gym doors.",
    "use": null
  },
  "key": {
    "id": "key",
    "name": "Key",
    "cat": "Key Items",
    "price": 0,
    "desc": "Opens locked doors, gates, and chests.",
    "use": null
  },
  "lantern": {
    "id": "lantern",
    "name": "Lantern",
    "cat": "Key Items",
    "price": 0,
    "desc": "Lights dark places, hands-free light source.",
    "use": null
  },
  "cash": {
    "id": "cash",
    "name": "Cash",
    "cat": "Money",
    "price": 0,
    "desc": "In-game currency, used to buy items and services.",
    "use": null
  },
  "coins": {
    "id": "coins",
    "name": "Coins",
    "cat": "Money",
    "price": 0,
    "desc": "In-game currency, small change, used in shops and vending.",
    "use": null
  }
};

// Metamonsters v1 — TOOLS (the 14 world-building tools) + RECIPES (workbench crafting).
// Sources: METAMONSTERS-WORLD-BUILDING-TOOLS.md (14 tools), METAMONSTERS-CRAFTING.md
// (28 recipes). The 4 base-part recipes (wood wall, storage crate, campfire, workbench)
// are build actions at the home plot, not bag items, so they live in the base menu;
// the other 24 recipes are here. Rope is a tool, crafted like anything else.
const TOOLS = {
  "axe": { "id": "axe", "name": "Axe", "price": 0, "desc": "Chop wood from trees.", "use": "tool" },
  "pickaxe": { "id": "pickaxe", "name": "Pickaxe", "price": 200, "desc": "Break rocks for stone and ore.", "use": "tool" },
  "shovel": { "id": "shovel", "name": "Shovel", "price": 100, "desc": "Dig in soft ground.", "use": "tool" },
  "fishing-rod": { "id": "fishing-rod", "name": "Fishing rod", "price": 150, "desc": "Fish at ponds and pools.", "use": "tool" },
  "hammer": { "id": "hammer", "name": "Hammer", "price": 120, "desc": "Build and repair at the workbench.", "use": "tool" },
  "crowbar": { "id": "crowbar", "name": "Crowbar", "price": 150, "desc": "Pry open stuck things.", "use": "tool" },
  "rope": { "id": "rope", "name": "Rope", "price": 40, "desc": "Tie, climb, and haul.", "use": "tool" },
  "flashlight": { "id": "flashlight", "name": "Flashlight", "price": 80, "desc": "Light dark places.", "use": "tool" },
  "compass": { "id": "compass", "name": "Compass", "price": 60, "desc": "Never get lost.", "use": "tool" },
  "pocket-knife": { "id": "pocket-knife", "name": "Pocket knife", "price": 50, "desc": "Field crafting and small cuts.", "use": "tool" },
  "matches": { "id": "matches", "name": "Matches", "price": 10, "desc": "Start a fire.", "use": "tool" },
  "lighter": { "id": "lighter", "name": "Lighter", "price": 25, "desc": "A reliable flame.", "use": "tool" },
  "tent": { "id": "tent", "name": "Tent", "price": 300, "desc": "Sleep anywhere.", "use": "tool" },
  "binoculars": { "id": "binoculars", "name": "Binoculars", "price": 120, "desc": "Spot creatures from far away.", "use": "tool" }
};

const RECIPES = [
  { "id": "craft-net", "name": "Net", "needs": { "plantFiber": 2, "string": 1 }, "result": "net", "qty": 1, "level": 1 },
  { "id": "craft-snare", "name": "Snare", "needs": { "string": 2, "wood": 1 }, "result": "snare", "qty": 1, "level": 1 },
  { "id": "craft-trap", "name": "Trap", "needs": { "wood": 2, "scrapMetal": 1, "string": 1 }, "result": "trap", "qty": 1, "level": 2 },
  { "id": "craft-bait", "name": "Bait", "needs": { "berries": 2, "driedMeat": 1 }, "result": "bait", "qty": 2, "level": 2 },
  { "id": "craft-cage", "name": "Cage", "needs": { "scrapMetal": 3, "nails": 1 }, "result": "cage", "qty": 1, "level": 3 },
  { "id": "craft-darts", "name": "Tranquilizer darts", "needs": { "herbs": 1, "feathers": 1, "wood": 1 }, "result": "tranquilizerDarts", "qty": 3, "level": 7 },
  { "id": "craft-bandage", "name": "Bandage", "needs": { "plantFiber": 2 }, "result": "bandage", "qty": 2, "level": 1 },
  { "id": "craft-gauze", "name": "Gauze", "needs": { "plantFiber": 2 }, "result": "gauze", "qty": 2, "level": 1 },
  { "id": "craft-splint", "name": "Splint", "needs": { "wood": 1, "string": 1 }, "result": "splint", "qty": 1, "level": 2 },
  { "id": "craft-salve", "name": "Herbal salve", "needs": { "herbs": 2, "waterBottle": 1 }, "result": "herbalSalve", "qty": 1, "level": 3 },
  { "id": "craft-firstaid", "name": "First aid kit", "needs": { "bandage": 2, "gauze": 2, "string": 1 }, "result": "firstAidKit", "qty": 1, "level": 4 },
  { "id": "craft-belt", "name": "Belt", "needs": { "leather": 1, "string": 1 }, "result": "belt", "qty": 1, "level": 4 },
  { "id": "craft-sleepingbag", "name": "Sleeping bag", "needs": { "leather": 1, "plantFiber": 2 }, "result": "sleepingBag", "qty": 1, "level": 3 },
  { "id": "craft-backpack", "name": "Backpack", "needs": { "leather": 2, "string": 2 }, "result": "backpack", "qty": 1, "level": 4 },
  { "id": "craft-canteen", "name": "Canteen", "needs": { "clay": 1, "scrapMetal": 1 }, "result": "canteen", "qty": 1, "level": 5 },
  { "id": "craft-trailmix", "name": "Trail mix", "needs": { "driedFruit": 1, "berries": 1 }, "result": "trailMix", "qty": 2, "level": 1 },
  { "id": "craft-cookedmeal", "name": "Cooked meal", "needs": { "driedMeat": 1, "cannedBeans": 1 }, "result": "cookedMeal", "qty": 1, "level": 4 },
  { "id": "craft-smokebomb", "name": "Smoke bomb", "needs": { "clay": 1, "herbs": 1 }, "result": "smokeBomb", "qty": 1, "level": 4 },
  { "id": "craft-pepperspray", "name": "Pepper spray", "needs": { "herbs": 2, "waterBottle": 1 }, "result": "pepperSpray", "qty": 1, "level": 5 },
  { "id": "craft-bicycleparts", "name": "Bicycle parts", "needs": { "scrapMetal": 2, "ironOre": 1 }, "result": "bicycleParts", "qty": 1, "level": 6 },
  { "id": "craft-tire", "name": "Tire", "needs": { "leather": 1, "scrapMetal": 1 }, "result": "tire", "qty": 1, "level": 6 },
  { "id": "craft-spareparts", "name": "Spare parts", "needs": { "scrapMetal": 2, "ironOre": 1 }, "result": "spareParts", "qty": 1, "level": 7 },
  { "id": "craft-rope", "name": "Rope", "needs": { "plantFiber": 3 }, "result": "rope", "qty": 1, "level": 1 },
  { "id": "craft-leather", "name": "Leather", "needs": { "hide": 1 }, "result": "leather", "qty": 1, "level": 2 }
];

// Metamonsters pass 3 — TM_ITEMS (tournament-reward TMs; NOT part of the 83 game items,
// NOT sold in shops — they are earned from tournaments only). 9 entries: TM01 Bite,
// TM06 Water Jet (pass 1) + TM19 Fire Breath, TM18 Electric Shock, TM14 Flash,
// TM15 Sonic Scream (pass 2, TM numbers from METAMONSTERS-MOVES.md) + TM20 Tremor,
// TM Molten Strike, TM Pressure Point (pass 3; Molten Strike and Pressure Point carry
// no TM number in METAMONSTERS-MOVES.md, so they are named without one).
// Sources: METAMONSTERS-MOVES.md (TM01 Bite, TM06 Water Jet), METAMONSTERS-TOURNAMENTS.md
// (Forest Clash rewards TM Bite; Reef Rumble rewards TM Water Jet).
// A TM is single-use: using one from the bag opens the party picker, teaches the move
// (replacing a move of the player's choice), and is consumed. move is the id in MOVES.
const TM_ITEMS = {
  "tmBite": { "id": "tmBite", "name": "TM01 Bite", "price": 0, "desc": "Teaches Bite to one creature. Single use.", "use": "tm", "move": "bite" },
  "tmWaterJet": { "id": "tmWaterJet", "name": "TM06 Water Jet", "price": 0, "desc": "Teaches Water Jet to one creature. Single use.", "use": "tm", "move": "waterJet" },
  "tmFireBreath": { "id": "tmFireBreath", "name": "TM19 Fire Breath", "price": 0, "desc": "Teaches Fire Breath to one creature. Single use.", "use": "tm", "move": "fireBreath" },
  "tmElectricShock": { "id": "tmElectricShock", "name": "TM18 Electric Shock", "price": 0, "desc": "Teaches Electric Shock to one creature. Single use.", "use": "tm", "move": "electricShock" },
  "tmFlash": { "id": "tmFlash", "name": "TM14 Flash", "price": 0, "desc": "Teaches Flash to one creature. Single use.", "use": "tm", "move": "flash" },
  "tmSonicScream": { "id": "tmSonicScream", "name": "TM15 Sonic Scream", "price": 0, "desc": "Teaches Sonic Scream to one creature. Single use.", "use": "tm", "move": "sonicScream" },
  "tmTremor": { "id": "tmTremor", "name": "TM20 Tremor", "price": 0, "desc": "Teaches Tremor to one creature. Single use.", "use": "tm", "move": "tremor" },
  "tmMoltenStrike": { "id": "tmMoltenStrike", "name": "TM Molten Strike", "price": 0, "desc": "Teaches Molten Strike to one creature. Single use.", "use": "tm", "move": "moltenStrike" },
  "tmPressurePoint": { "id": "tmPressurePoint", "name": "TM Pressure Point", "price": 0, "desc": "Teaches Pressure Point to one creature. Single use.", "use": "tm", "move": "pressurePoint" }
};
