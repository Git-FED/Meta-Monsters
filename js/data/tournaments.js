// Metamonsters — TOURNAMENTS (pass 3). 10 tournaments (the Rookie Cup, the Forest Clash,
// the Reef Rumble, the Desert Heat, the Bazaar Brawl, the Frost Crown, the University
// Games, the Wasteland War, the Rok City Championship, the Ancient Crown). Pass-1 cups
// have 8 trainers each; pass-2 4-round cups have 16 (9 round16 + 4 quarterfinal +
// 2 semifinal + 1 final), Desert Heat has 8 (5 quarterfinal + 2 semifinal + 1 final).
// The Ancient Crown has 32 (16 round32 + 9 round16 + 4 quarterfinal + 2 semifinal +
// 1 final) — the brief's 16/8/4/2/1 sums to 31, so a 9th round16 trainer follows the
// pass-2 first-round convention to reach size 32.
// Sources: METAMONSTERS-TOURNAMENTS.md (Rookie Cup: levels 1-5, Mirage Oasis, Beginners,
// 3 rounds, 8 trainers, final opponent Marcus, reward 500 cash / 3 nets / 1 trap / HM SLICE;
// Forest Clash: levels 5-10, Whispering Woods, forest birds and mammals, final opponent
// Sofia, reward 1500 cash / 5 traps / TM Bite, unlocks the Ant Colony; Reef Rumble:
// levels 10-20, Coral Reef, Fish and water, final opponent The Reef Champion, reward 5000
// cash / 1 cage / TM Water Jet, unlocks HM SWIM),
// METAMONSTERS-CHARACTERS.md (Marcus is the best friend, picks a starter first),
// DATA-SCHEMA.md (trainer shape, level ranges: QF 2-3, SF 3-4, final 4-5).
// Doc note resolved: the schema text names 7 trainers for an 8-trainer bracket
// (qf1-qf4, sf1, sf2, final Marcus), so an 8th quarterfinalist, Juno, is added to make
// the bracket whole. Marcus's first team slot uses Wolf Cub #004 as a stand-in — the engine
// replaces it with the starter Marcus actually picked (starter logic).
// Trainer dialogue is original in-world writing (the docs name only Marcus as the final).
// Pass 2 notes (2026-11-20):
//  - Frost Crown's TM is Flash (TM14): the tournaments doc says Focus Beam, but Focus Beam
//    is NOT a move in moves.js, so TM Flash is the documented substitute.
//  - University Games' TM is Sonic Scream (TM15): the tournaments doc says Lightning Strike;
//    Lightning Strike exists in moves.js but carries no TM number in METAMONSTERS-MOVES.md,
//    so TM Sonic Scream is the documented substitute.
//  - Cup rewards (cash/items/unlock) are mirrored in the matching tournament missions
//    (fourthTournament etc.) — the arenamaster pitch reads the cup, afterWin pays the mission.
//  - fifthTournament's story-doc name is "The City Tournament" = the Bazaar Brawl cup.
//  - Engine gaps the coordinator must wire: TournamentFlow.start currently only fights qf1 +
//    first semifinal + final (round16 trainers are bracket filler it never faces); afterWin's
//    missionId map and the arenamaster's map->cup map are hardcoded to the 3 pass-1 cups.

const TOURNAMENTS = [
  {
    "id": "rookieCup",
    "name": "The Rookie Cup",
    "levels": [
      1,
      5
    ],
    "location": "The Mirage Oasis",
    "theme": "Beginners",
    "rounds": 3,
    "size": 8,
    "trainers": [
      {
        "id": "qf1",
        "name": "Pip",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "055",
            "level": 3
          },
          {
            "dex": "061",
            "level": 3
          }
        ],
        "intro": "Hi! I'm Pip! My ants are small but they never give up — and neither do I!",
        "lose": "Wow, you're strong! My ants will train harder next time, I promise!"
      },
      {
        "id": "qf2",
        "name": "Tessa",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "061",
            "level": 2
          },
          {
            "dex": "079",
            "level": 3
          }
        ],
        "intro": "I found my caterpillar by the meadow pond. She's going to be a Monarch one day, you'll see.",
        "lose": "She'll be a Monarch one day... just not today, I guess."
      },
      {
        "id": "qf3",
        "name": "Ben",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "034",
            "level": 3
          },
          {
            "dex": "055",
            "level": 2
          }
        ],
        "intro": "My tadpole can jump clean over your head! Let's see what your starter can do.",
        "lose": "Okay, okay, your starter's got hops too. Fair fight."
      },
      {
        "id": "qf4",
        "name": "Mina",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "016",
            "level": 3
          },
          {
            "dex": "061",
            "level": 2
          }
        ],
        "intro": "My owlet only hunts at night, so don't blink — this will be over fast.",
        "lose": "Huh. Maybe daylight battles aren't so bad after all."
      },
      {
        "id": "sf1",
        "name": "Rook",
        "round": "semifinal",
        "team": [
          {
            "dex": "056",
            "level": 3
          },
          {
            "dex": "059",
            "level": 4
          }
        ],
        "intro": "Ants and bees. Small, fast, and everywhere at once. Good luck keeping up.",
        "lose": "The swarm got out-swARMED... I mean, outplayed. Well fought."
      },
      {
        "id": "sf2",
        "name": "Dara",
        "round": "semifinal",
        "team": [
          {
            "dex": "035",
            "level": 4
          },
          {
            "dex": "062",
            "level": 3
          }
        ],
        "intro": "My frog and I trained all spring by the oasis. We don't lose in front of a crowd.",
        "lose": "The crowd loved that finish. I can't even be mad — take the win."
      },
      {
        "id": "marcus",
        "name": "Marcus",
        "round": "final",
        "team": [
          {
            "dex": "004",
            "level": 5
          },
          {
            "dex": "055",
            "level": 4
          }
        ],
        "intro": "Kai! Finally — a real battle against my best friend. I picked my starter first, remember? Let's see if the leftover was the right one.",
        "lose": "Ha! You got me. Same as always — you make the leftover look like the best pick. Go win the whole thing, Kai."
      },
      {
        "id": "qf5",
        "name": "Juno",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "058",
            "level": 2
          },
          {
            "dex": "079",
            "level": 2
          }
        ],
        "intro": "Eighth trainer, last spot in the bracket — and I'm taking it all the way to the final.",
        "lose": "Eighth trainer, first one out. Next cup, I'm coming back for you."
      }
    ],
    "finalId": "marcus",
    "reward": {
      "cash": 500,
      "items": {
        "net": 3,
        "trap": 1
      },
      "unlock": "HM SLICE"
    },
    "crowd": [
      "The crowd roars!",
      "A big cheer goes up!",
      "Gasps from the stands!",
      "The oasis crowd is on its feet!",
      "Oohs and aahs ripple through the arena!",
      "Someone in the back is chanting your name!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Mirage Oasis!",
      "Kids in the front row are jumping up and down!",
      "The whole arena erupts!"
    ]
  },
  {
    "id": "forestClash",
    "name": "The Forest Clash",
    "levels": [
      5,
      10
    ],
    "location": "Whispering Woods",
    "theme": "Forest birds and mammals",
    "rounds": 3,
    "size": 8,
    "trainers": [
      {
        "id": "qf1",
        "name": "Wren",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "013",
            "level": 6
          },
          {
            "dex": "016",
            "level": 5
          }
        ],
        "intro": "My eaglet sees everything from up there. You won't surprise us, not in these woods.",
        "lose": "Sharp eyes... and a sharper team. The woods will remember this one."
      },
      {
        "id": "qf2",
        "name": "Bram",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "001",
            "level": 6
          },
          {
            "dex": "004",
            "level": 5
          }
        ],
        "intro": "Bear cubs and wolf cubs — the forest raised us both. Come on, let's hear it roar.",
        "lose": "The forest went quiet for that one. You earned it."
      },
      {
        "id": "qf3",
        "name": "Lark",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "106",
            "level": 5
          },
          {
            "dex": "016",
            "level": 6
          }
        ],
        "intro": "My pup navigates by sound — you'll never catch her coming, day or night.",
        "lose": "She heard you coming all along... and still lost. Well fought."
      },
      {
        "id": "qf4",
        "name": "Ash",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "007",
            "level": 6
          },
          {
            "dex": "013",
            "level": 5
          }
        ],
        "intro": "A lion cub with an eagle's eye. The forest's next champion is standing right here.",
        "lose": "Not today, then. But the forest keeps score — I'll be back."
      },
      {
        "id": "sf1",
        "name": "Hazel",
        "round": "semifinal",
        "team": [
          {
            "dex": "002",
            "level": 8
          },
          {
            "dex": "014",
            "level": 7
          }
        ],
        "intro": "My bear's already grown — and my eagle's twice as fast. The semifinal is where your run ends.",
        "lose": "A grown bear, outmuscled... I need to rethink my whole training plan."
      },
      {
        "id": "sf2",
        "name": "Orin",
        "round": "semifinal",
        "team": [
          {
            "dex": "005",
            "level": 8
          },
          {
            "dex": "107",
            "level": 7
          }
        ],
        "intro": "Wolf and bat — scent and sound, the two senses that never miss. You'll feel surrounded.",
        "lose": "Surrounded... and outplayed. The woods approve of you, I'll give you that."
      },
      {
        "id": "sofia",
        "name": "Sofia",
        "round": "final",
        "team": [
          {
            "dex": "001",
            "level": 9
          },
          {
            "dex": "013",
            "level": 9
          },
          {
            "dex": "016",
            "level": 8
          }
        ],
        "intro": "Kai! Marcus beat you to the Rookie Cup final — but I'm the one waiting at the end of this one. I picked my starter first, remember? Let's see if the leftover was the right one.",
        "lose": "Ugh — fine. You and that leftover starter are the real deal. Go on, take the cup. I'll get you at the Reef."
      },
      {
        "id": "qf5",
        "name": "Fern",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "016",
            "level": 5
          },
          {
            "dex": "004",
            "level": 6
          }
        ],
        "intro": "Eighth trainer, last spot in the bracket — and I'm taking it all the way to the final.",
        "lose": "Eighth trainer, first one out. Next cup, I'm coming back for you."
      }
    ],
    "finalId": "sofia",
    "reward": {
      "cash": 1500,
      "items": {
        "trap": 5,
        "tmBite": 1
      },
      "unlock": "antColony"
    },
    "crowd": [
      "The forest crowd roars!",
      "Leaves shake loose from the canopy as the crowd cheers!",
      "A big cheer rolls through the trees!",
      "Gasps from the stands!",
      "The woods crowd is on its feet!",
      "Oohs and aahs ripple through the clearing!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Whispering Woods!",
      "Birds scatter from the treetops at the roar!",
      "The whole clearing erupts!"
    ]
  },
  {
    "id": "reefRumble",
    "name": "The Reef Rumble",
    "theme": "Fish and water",
    "levels": [
      10,
      20
    ],
    "location": "Coral Reef",
    "rounds": 3,
    "size": 8,
    "trainers": [
      {
        "id": "qf1",
        "name": "Coral",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "043",
            "level": 12
          },
          {
            "dex": "046",
            "level": 11
          }
        ],
        "intro": "My shark pup was born in these shallows. The reef doesn't forgive slow trainers.",
        "lose": "The reef chose you this time. Train hard — the deep water is coming."
      },
      {
        "id": "qf2",
        "name": "Tide",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "052",
            "level": 12
          },
          {
            "dex": "073",
            "level": 11
          }
        ],
        "intro": "Eels and crabs — the reef's quiet killers. You'll never see the shock coming.",
        "lose": "Shocked... and not the way I planned. Well fought, landlubber."
      },
      {
        "id": "qf3",
        "name": "Marina",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "049",
            "level": 12
          },
          {
            "dex": "082",
            "level": 11
          }
        ],
        "intro": "My tuna crosses the whole reef before breakfast. Speed is everything out here.",
        "lose": "Outswum! I didn't think anything on land could keep up."
      },
      {
        "id": "qf4",
        "name": "Kelvin",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "085",
            "level": 11
          },
          {
            "dex": "088",
            "level": 12
          }
        ],
        "intro": "Squid ink and a snail's shell — you can't hit what you can't see, and you can't crack what won't break.",
        "lose": "The ink cleared and I'd lost anyway. The reef respects you now."
      },
      {
        "id": "sf1",
        "name": "Sable",
        "round": "semifinal",
        "team": [
          {
            "dex": "044",
            "level": 15
          },
          {
            "dex": "053",
            "level": 14
          }
        ],
        "intro": "My shark's grown a stage and my eel crackles with every move. The semifinal is where your run ends.",
        "lose": "A grown shark, outfought... the whole reef saw that. Take the win."
      },
      {
        "id": "sf2",
        "name": "Dune",
        "round": "semifinal",
        "team": [
          {
            "dex": "050",
            "level": 15
          },
          {
            "dex": "083",
            "level": 14
          }
        ],
        "intro": "Tuna and octopus — speed and eight arms of trouble. The final is mine, not yours.",
        "lose": "Eight arms and I still couldn't hold you. The Champion's waiting — go make him sweat."
      },
      {
        "id": "reefChampion",
        "name": "The Reef Champion",
        "round": "final",
        "team": [
          {
            "dex": "043",
            "level": 18
          },
          {
            "dex": "052",
            "level": 18
          },
          {
            "dex": "049",
            "level": 17
          }
        ],
        "intro": "Twenty years I've fished this reef and never lost a tournament in it. You beat the Rookie Cup and the Forest Clash — good. Now the water decides.",
        "lose": "Twenty years... and a kid with a leftover starter takes my reef. Ha! The sea gives, the sea takes. The Reef Rumble is yours, Kai — and HM SWIM with it. Go see what's past the deep water."
      },
      {
        "id": "qf5",
        "name": "Pearl",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "046",
            "level": 11
          },
          {
            "dex": "073",
            "level": 12
          }
        ],
        "intro": "Eighth trainer, last spot in the bracket — and I'm taking it all the way to the final.",
        "lose": "Eighth trainer, first one out. Next cup, I'm coming back for you."
      }
    ],
    "finalId": "reefChampion",
    "reward": {
      "cash": 5000,
      "items": {
        "cage": 1,
        "tmWaterJet": 1
      },
      "unlock": "HM SWIM"
    },
    "crowd": [
      "The reef crowd roars!",
      "Waves crash as the crowd cheers!",
      "A big cheer rolls across the lagoon!",
      "Gasps from the stands!",
      "The beach crowd is on its feet!",
      "Oohs and aahs ripple through the shallows!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Coral Reef!",
      "Gulls scatter at the roar!",
      "The whole shoreline erupts!"
    ]
  },
  {
    "id": "desertHeat",
    "name": "Desert Heat",
    "levels": [
      20,
      30
    ],
    "location": "Ember Dunes",
    "theme": "Desert heat and Reptiles",
    "rounds": 3,
    "size": 8,
    "trainers": [
      {
        "id": "qf1",
        "name": "Sandy",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "025",
            "level": 21
          },
          {
            "dex": "028",
            "level": 20
          }
        ],
        "intro": "The dunes raised my hatchlings — heat is their home, and this arena is my backyard.",
        "lose": "The sand shifts for you today. My hatchlings will grow into it."
      },
      {
        "id": "qf2",
        "name": "Dune",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "031",
            "level": 22
          },
          {
            "dex": "067",
            "level": 21
          }
        ],
        "intro": "Komodo hatchling, baby scorpion — small now, deadly later. Mind where you step.",
        "lose": "Stepped right past us. The dunes will remember your footprints."
      },
      {
        "id": "qf3",
        "name": "Viper",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "026",
            "level": 22
          },
          {
            "dex": "029",
            "level": 21
          }
        ],
        "intro": "One bite from my cobra and the match is over. The desert doesn't do second chances.",
        "lose": "No bite landed... the desert will have to wait for its second chance."
      },
      {
        "id": "qf4",
        "name": "Gila",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "022",
            "level": 20
          },
          {
            "dex": "032",
            "level": 23
          }
        ],
        "intro": "Crocodile hatchling and a grown komodo — the dunes' oldest hunters, side by side.",
        "lose": "The old hunters got out-hunted. Fair fight, stranger."
      },
      {
        "id": "qf5",
        "name": "Sirocco",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "068",
            "level": 22
          },
          {
            "dex": "028",
            "level": 21
          }
        ],
        "intro": "The sirocco wind carries my scorpion's sting straight to you. Feel the heat yet?",
        "lose": "The wind changed direction on me. Take the win — the desert owes you one."
      },
      {
        "id": "sf1",
        "name": "Asp",
        "round": "semifinal",
        "team": [
          {
            "dex": "026",
            "level": 25
          },
          {
            "dex": "032",
            "level": 26
          }
        ],
        "intro": "My cobra's grown and my komodo's twice as mean. The semifinal is where your run dries up.",
        "lose": "Outfought in my own heat... the Sand King will want to hear about you."
      },
      {
        "id": "sf2",
        "name": "Bask",
        "round": "semifinal",
        "team": [
          {
            "dex": "029",
            "level": 26
          },
          {
            "dex": "068",
            "level": 25
          }
        ],
        "intro": "Python and scorpion — we bask in this heat all day. You're the one sweating, not us.",
        "lose": "Basking... and beaten. The final is yours to chase — go on."
      },
      {
        "id": "sandKing",
        "name": "The Sand King",
        "round": "final",
        "team": [
          {
            "dex": "027",
            "level": 29
          },
          {
            "dex": "030",
            "level": 30
          },
          {
            "dex": "033",
            "level": 28
          }
        ],
        "intro": "King Cobra, Reticulated Python, Alpha Komodo — the three rulers of the Ember Dunes, and I am their king. Nobody takes the Desert Heat from the sand.",
        "lose": "The sand... gives way. Thirty years I've ruled these dunes, and a kid with a leftover starter takes my crown. The Desert Heat is yours, Kai — and the Scorpion's Nest with it."
      }
    ],
    "finalId": "sandKing",
    "reward": {
      "cash": 15000,
      "items": {
        "firstAidKit": 1,
        "tmFireBreath": 1
      },
      "unlock": "scorpionsNest"
    },
    "crowd": [
      "The desert crowd roars!",
      "Sand kicks up as the crowd cheers!",
      "A big cheer rolls across the dunes!",
      "Gasps from the stands!",
      "The arena crowd is on its feet!",
      "Oohs and aahs ripple through the heat haze!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Ember Dunes!",
      "The dunes themselves seem to tremble at the roar!",
      "The whole desert erupts!"
    ]
  },
  {
    "id": "bazaarBrawl",
    "name": "Bazaar Brawl",
    "levels": [
      30,
      40
    ],
    "location": "Grand Bazaar",
    "theme": "City birds and quick hands",
    "rounds": 4,
    "size": 16,
    "trainers": [
      {
        "id": "r1",
        "name": "Nia",
        "round": "round16",
        "team": [
          {
            "dex": "013",
            "level": 30
          },
          {
            "dex": "016",
            "level": 31
          }
        ],
        "intro": "Eaglet and owlet — I sell them... no, I train them! Come on, first round's on me.",
        "lose": "Sold out! Next time I charge double for the rematch."
      },
      {
        "id": "r2",
        "name": "Jett",
        "round": "round16",
        "team": [
          {
            "dex": "106",
            "level": 30
          },
          {
            "dex": "058",
            "level": 31
          }
        ],
        "intro": "My bat pup hears your heartbeat before the battle even starts. Quick hands, quick wings.",
        "lose": "Heard you coming and still lost. The bazaar will hear about this one."
      },
      {
        "id": "r3",
        "name": "Kiki",
        "round": "round16",
        "team": [
          {
            "dex": "014",
            "level": 32
          },
          {
            "dex": "059",
            "level": 30
          }
        ],
        "intro": "Eagle and bee — my stall's the fastest in the bazaar, and so are we.",
        "lose": "Faster hands won the day. My stall's still the fastest, though!"
      },
      {
        "id": "r4",
        "name": "Marlowe",
        "round": "round16",
        "team": [
          {
            "dex": "017",
            "level": 31
          },
          {
            "dex": "061",
            "level": 30
          }
        ],
        "intro": "Owl and caterpillar — quiet sellers, loud battlers. The bazaar taught us both.",
        "lose": "Quiet... and outplayed. The bazaar respects a winner, so go on."
      },
      {
        "id": "r5",
        "name": "Vega",
        "round": "round16",
        "team": [
          {
            "dex": "013",
            "level": 31
          },
          {
            "dex": "107",
            "level": 30
          }
        ],
        "intro": "My eaglet sees the whole bazaar from the rooftops. Nothing gets past us — not even you.",
        "lose": "Saw everything except the loss coming. Well fought, stranger."
      },
      {
        "id": "r6",
        "name": "Talon",
        "round": "round16",
        "team": [
          {
            "dex": "014",
            "level": 30
          },
          {
            "dex": "016",
            "level": 32
          }
        ],
        "intro": "Eagle talons, owl eyes — the bazaar's rooftops belong to the birds, and so does this bracket.",
        "lose": "The rooftops are yours today. I'll be watching from them next time."
      },
      {
        "id": "r7",
        "name": "Wick",
        "round": "round16",
        "team": [
          {
            "dex": "059",
            "level": 31
          },
          {
            "dex": "106",
            "level": 31
          }
        ],
        "intro": "Bee and bat — sting and sound, the two things you can't see coming in a crowded market.",
        "lose": "Stung... and silenced. The market moves on, and so do I."
      },
      {
        "id": "r8",
        "name": "Lumen",
        "round": "round16",
        "team": [
          {
            "dex": "017",
            "level": 32
          },
          {
            "dex": "058",
            "level": 30
          }
        ],
        "intro": "My owl sees in the dark corners of the bazaar, and my bee works the bright stalls. Both worlds, one team.",
        "lose": "Both worlds, one loss. The bazaar keeps the lights on for winners — go on."
      },
      {
        "id": "r9",
        "name": "Flick",
        "round": "round16",
        "team": [
          {
            "dex": "062",
            "level": 31
          },
          {
            "dex": "107",
            "level": 31
          }
        ],
        "intro": "Butterfly and bat — pretty wings, sharp ears. Don't let the colors fool you, kid.",
        "lose": "Fool me once... the bazaar loves a comeback story, and mine starts now."
      },
      {
        "id": "qf1",
        "name": "Skye",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "014",
            "level": 34
          },
          {
            "dex": "017",
            "level": 33
          }
        ],
        "intro": "Eagle and owl — the whole sky over the bazaar is mine. Your run ends in the clouds.",
        "lose": "The sky fell on me today. Fly on, champion — the Boss is waiting."
      },
      {
        "id": "qf2",
        "name": "Zephyr",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "107",
            "level": 34
          },
          {
            "dex": "059",
            "level": 33
          }
        ],
        "intro": "Bat and bee — sound and sting, fast as a rumor through the stalls. Catch us if you can.",
        "lose": "Caught us. The rumor mill will say I almost had you — let it."
      },
      {
        "id": "qf3",
        "name": "Hoot",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "018",
            "level": 35
          },
          {
            "dex": "014",
            "level": 33
          }
        ],
        "intro": "Great Horned Owl, grown eagle — the bazaar's night shift and day shift, both on duty.",
        "lose": "Both shifts, one loss. The Boss doesn't like losers — go give him a real fight."
      },
      {
        "id": "qf4",
        "name": "Swift",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "060",
            "level": 34
          },
          {
            "dex": "015",
            "level": 34
          }
        ],
        "intro": "Queen Bee and Golden Eagle — the bazaar's fastest hands and sharpest eyes, in one team.",
        "lose": "Swift... and second. The Boss has been waiting for someone like you."
      },
      {
        "id": "sf1",
        "name": "Aerie",
        "round": "semifinal",
        "team": [
          {
            "dex": "015",
            "level": 37
          },
          {
            "dex": "108",
            "level": 36
          }
        ],
        "intro": "Golden Eagle and Vampire Bat — the bazaar's rooftops and its shadows, both mine. The semifinal is where your run ends.",
        "lose": "Rooftops and shadows, both beaten... the Boss is going to love this story."
      },
      {
        "id": "sf2",
        "name": "Gale",
        "round": "semifinal",
        "team": [
          {
            "dex": "018",
            "level": 37
          },
          {
            "dex": "060",
            "level": 36
          }
        ],
        "intro": "Great Horned Owl and Queen Bee — the whole bazaar hums when we battle. Feel the market shake?",
        "lose": "The market shook... and I fell. Go on — the Boss doesn't wait for anyone."
      },
      {
        "id": "bazaarBoss",
        "name": "The Bazaar Boss",
        "round": "final",
        "team": [
          {
            "dex": "015",
            "level": 40
          },
          {
            "dex": "108",
            "level": 39
          },
          {
            "dex": "060",
            "level": 38
          }
        ],
        "intro": "Every stall in this bazaar pays me rent, kid — and every trainer in this bracket works for me. Golden Eagle, Vampire Bat, Queen Bee: the fastest hands in the city. You want my bazaar? Come and take it.",
        "lose": "Ha! The whole bazaar saw that. Sixteen trainers, and a kid from Haven Village takes my crown... Take the Brawl, Kai — and HM SOAR with it. The sky over my bazaar is yours now."
      }
    ],
    "finalId": "bazaarBoss",
    "reward": {
      "cash": 30000,
      "items": {
        "snare": 1,
        "tmElectricShock": 1
      },
      "unlock": "hmSOAR"
    },
    "crowd": [
      "The bazaar crowd roars!",
      "Coins scatter as the crowd cheers!",
      "A big cheer rolls through the stalls!",
      "Gasps from the shoppers!",
      "The market crowd is on its feet!",
      "Oohs and aahs ripple down the aisles!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Grand Bazaar!",
      "Traders bang their stall counters at the roar!",
      "The whole market erupts!"
    ]
  },
  {
    "id": "frostCrown",
    "name": "Frost Crown",
    "levels": [
      40,
      50
    ],
    "location": "Frozen Roost",
    "theme": "Ice and winter birds",
    "rounds": 4,
    "size": 16,
    "trainers": [
      {
        "id": "r1",
        "name": "Flurry",
        "round": "round16",
        "team": [
          {
            "dex": "019",
            "level": 40
          },
          {
            "dex": "016",
            "level": 41
          }
        ],
        "intro": "Penguin chick and owlet — small, cold, and tougher than the mountain. The frost bites first.",
        "lose": "The frost bit me instead. The mountain keeps score — I'll be back."
      },
      {
        "id": "r2",
        "name": "Glacier",
        "round": "round16",
        "team": [
          {
            "dex": "020",
            "level": 41
          },
          {
            "dex": "013",
            "level": 42
          }
        ],
        "intro": "Penguin and eaglet — ice below, sky above. The Roost doesn't warm up for anyone.",
        "lose": "Cracked like spring ice. The Roost respects a winner, so go on."
      },
      {
        "id": "r3",
        "name": "Frost",
        "round": "round16",
        "team": [
          {
            "dex": "014",
            "level": 41
          },
          {
            "dex": "019",
            "level": 42
          }
        ],
        "intro": "Eagle and penguin chick — my team hunts in a blizzard and calls it a clear day.",
        "lose": "Blizzard... and beaten. The Crown is still up there — go climb for it."
      },
      {
        "id": "r4",
        "name": "Blizzard",
        "round": "round16",
        "team": [
          {
            "dex": "017",
            "level": 42
          },
          {
            "dex": "020",
            "level": 40
          }
        ],
        "intro": "Owl and penguin — we see through the whiteout and we slide through it. Good luck finding us.",
        "lose": "Found us... and finished us. The whiteout hides losers well — I'll use it."
      },
      {
        "id": "r5",
        "name": "Sleet",
        "round": "round16",
        "team": [
          {
            "dex": "013",
            "level": 41
          },
          {
            "dex": "021",
            "level": 42
          }
        ],
        "intro": "Eaglet and Emperor Penguin — the Roost's highest nest and its deepest ice, in one team.",
        "lose": "Highest nest, deepest ice, first loss. The Crown stays cold — go take it."
      },
      {
        "id": "r6",
        "name": "Hail",
        "round": "round16",
        "team": [
          {
            "dex": "016",
            "level": 42
          },
          {
            "dex": "014",
            "level": 40
          }
        ],
        "intro": "Owlet and eagle — hail falls, wings rise. The Frozen Roost doesn't forgive slow trainers.",
        "lose": "Hailed on... and outplayed. The Roost will remember your name, not mine."
      },
      {
        "id": "r7",
        "name": "Rime",
        "round": "round16",
        "team": [
          {
            "dex": "019",
            "level": 42
          },
          {
            "dex": "017",
            "level": 41
          }
        ],
        "intro": "Penguin chick and owl — rime ice on every feather, and every feather ready for a fight.",
        "lose": "The rime melted under your team. The Crown is still frozen — go on."
      },
      {
        "id": "r8",
        "name": "Nieve",
        "round": "round16",
        "team": [
          {
            "dex": "020",
            "level": 42
          },
          {
            "dex": "015",
            "level": 41
          }
        ],
        "intro": "Penguin and Golden Eagle — snow below, gold above. The Roost's winter is our home.",
        "lose": "Snow... and gold... and a loss. The winter keeps the Crown — for now."
      },
      {
        "id": "r9",
        "name": "Polar",
        "round": "round16",
        "team": [
          {
            "dex": "014",
            "level": 42
          },
          {
            "dex": "019",
            "level": 40
          }
        ],
        "intro": "Eagle and penguin chick — polar winds raised us both. The cold is our advantage, kid.",
        "lose": "The cold chose you today. The Frost Queen is waiting — go freeze or be frozen."
      },
      {
        "id": "qf1",
        "name": "Tundra",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "015",
            "level": 44
          },
          {
            "dex": "021",
            "level": 43
          }
        ],
        "intro": "Golden Eagle and Emperor Penguin — the tundra's sky and its ice, both mine. Your run freezes here.",
        "lose": "The tundra thawed for you... the Queen will want to see this team herself."
      },
      {
        "id": "qf2",
        "name": "Avalanche",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "018",
            "level": 44
          },
          {
            "dex": "020",
            "level": 44
          }
        ],
        "intro": "Great Horned Owl and penguin — when we battle, the whole mountain comes down. Stand clear.",
        "lose": "The mountain came down... on me. Go on — the Queen doesn't wait."
      },
      {
        "id": "qf3",
        "name": "Shiver",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "021",
            "level": 45
          },
          {
            "dex": "014",
            "level": 43
          }
        ],
        "intro": "Emperor Penguin and eagle — shiver all you like, kid. The cold is my home, not my enemy.",
        "lose": "Shivering... and beaten. The Crown is cold, and so is the Queen's welcome."
      },
      {
        "id": "qf4",
        "name": "Frostbite",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "015",
            "level": 45
          },
          {
            "dex": "017",
            "level": 44
          }
        ],
        "intro": "Golden Eagle and owl — frostbite takes the slow, and I am not slow. The quarterfinal is mine.",
        "lose": "Frostbitten by my own mountain... the Queen is next, and she bites harder."
      },
      {
        "id": "sf1",
        "name": "Snowfall",
        "round": "semifinal",
        "team": [
          {
            "dex": "015",
            "level": 47
          },
          {
            "dex": "021",
            "level": 46
          }
        ],
        "intro": "Golden Eagle and Emperor Penguin — snowfall hides us, ice carries us. The semifinal is where your run freezes solid.",
        "lose": "Frozen solid... and outplayed anyway. The Queen is waiting — go meet the winter itself."
      },
      {
        "id": "sf2",
        "name": "Whiteout",
        "round": "semifinal",
        "team": [
          {
            "dex": "018",
            "level": 48
          },
          {
            "dex": "021",
            "level": 46
          }
        ],
        "intro": "Great Horned Owl and Emperor Penguin — in a whiteout, only we can see. You can't hit what you can't find.",
        "lose": "Found us... and finished us. The whiteout clears for a winner — go on."
      },
      {
        "id": "frostQueen",
        "name": "The Frost Queen",
        "round": "final",
        "team": [
          {
            "dex": "015",
            "level": 50
          },
          {
            "dex": "021",
            "level": 49
          },
          {
            "dex": "018",
            "level": 48
          }
        ],
        "intro": "Golden Eagle, Emperor Penguin, Great Horned Owl — the winter's three rulers, and I am their queen. Sixteen trainers climbed my mountain, and sixteen froze. You will be seventeen.",
        "lose": "Seventeen... and the mountain thaws. A kid from Haven Village takes my crown... Take the Frost Crown, Kai — and the Ice Lake with it. The winter bows to you."
      }
    ],
    "finalId": "frostQueen",
    // Tournaments doc says TM Focus Beam, but Focus Beam is NOT a move in moves.js —
    // TM Flash is the documented substitute.
    "reward": {
      "cash": 60000,
      "items": {
        "coldPack": 2,
        "tmFlash": 1
      },
      "unlock": "iceLake"
    },
    "crowd": [
      "The frozen crowd roars!",
      "Snow shakes loose as the crowd cheers!",
      "A big cheer rolls across the Roost!",
      "Gasps from the stands!",
      "The mountain crowd is on its feet!",
      "Oohs and aahs ripple through the snowfall!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Frozen Roost!",
      "Icicles tremble at the roar!",
      "The whole mountain erupts!"
    ]
  },
  {
    "id": "universityGames",
    "name": "University Games",
    "levels": [
      50,
      60
    ],
    "location": "Ivory Tower",
    "theme": "Rok University's best",
    "rounds": 4,
    "size": 16,
    "trainers": [
      {
        "id": "r1",
        "name": "Dean",
        "round": "round16",
        "team": [
          {
            "dex": "008",
            "level": 50
          },
          {
            "dex": "011",
            "level": 51
          }
        ],
        "intro": "Lion and Tiger — the university's pride, literally. First lesson: the Ivory Tower doesn't do mercy.",
        "lose": "Lesson learned... by me. The Tower respects a winner — go on up."
      },
      {
        "id": "r2",
        "name": "Provost",
        "round": "round16",
        "team": [
          {
            "dex": "014",
            "level": 51
          },
          {
            "dex": "005",
            "level": 50
          }
        ],
        "intro": "Eagle and Gray Wolf — sharp eyes, sharp teeth, sharper grades. The Tower's standards are high, kid.",
        "lose": "Standards... exceeded. The Tower keeps the bar high — you just cleared it."
      },
      {
        "id": "r3",
        "name": "Scholar",
        "round": "round16",
        "team": [
          {
            "dex": "002",
            "level": 51
          },
          {
            "dex": "032",
            "level": 50
          }
        ],
        "intro": "Black Bear and Komodo Dragon — my thesis was on apex predators, and I brought the evidence.",
        "lose": "The evidence... lost. My thesis needs a rewrite — and you need to keep climbing."
      },
      {
        "id": "r4",
        "name": "Thesis",
        "round": "round16",
        "team": [
          {
            "dex": "044",
            "level": 52
          },
          {
            "dex": "053",
            "level": 50
          }
        ],
        "intro": "Reef Shark and Eel — my thesis swims, and it bites. The Tower's waters are deep, kid.",
        "lose": "Thesis... sunk. The deep water is yours now — keep swimming."
      },
      {
        "id": "r5",
        "name": "Lecture",
        "round": "round16",
        "team": [
          {
            "dex": "011",
            "level": 52
          },
          {
            "dex": "017",
            "level": 51
          }
        ],
        "intro": "Tiger and Owl — I lecture on hunters, and my team is the lecture. Take notes, kid.",
        "lose": "Notes taken... by me. The lecture hall is yours — go on up."
      },
      {
        "id": "r6",
        "name": "Seminar",
        "round": "round16",
        "team": [
          {
            "dex": "008",
            "level": 51
          },
          {
            "dex": "023",
            "level": 52
          }
        ],
        "intro": "Lion and Crocodile — my seminar is on kings of the wild, and both of mine are in session.",
        "lose": "Seminar dismissed... early. The Tower's kings bow to a new one — go on."
      },
      {
        "id": "r7",
        "name": "Honors",
        "round": "round16",
        "team": [
          {
            "dex": "014",
            "level": 52
          },
          {
            "dex": "029",
            "level": 51
          }
        ],
        "intro": "Eagle and Python — honors students, both of us. The Tower only graduates the best, kid.",
        "lose": "Honors... revoked. Graduate anyway — the Tower's top floor is waiting."
      },
      {
        "id": "r8",
        "name": "Valedict",
        "round": "round16",
        "team": [
          {
            "dex": "005",
            "level": 52
          },
          {
            "dex": "050",
            "level": 51
          }
        ],
        "intro": "Gray Wolf and Tuna — I was top of my class, and my team runs like it. The Tower remembers its best.",
        "lose": "Top of the class... second today. The Tower remembers winners — go make it remember you."
      },
      {
        "id": "r9",
        "name": "Regent",
        "round": "round16",
        "team": [
          {
            "dex": "002",
            "level": 52
          },
          {
            "dex": "026",
            "level": 51
          }
        ],
        "intro": "Black Bear and Cobra — the regents fund the best teams in the city, and mine is the best of them.",
        "lose": "Funded... and outspent. The regents back winners — go show them one."
      },
      {
        "id": "qf1",
        "name": "Magna",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "009",
            "level": 54
          },
          {
            "dex": "012",
            "level": 53
          }
        ],
        "intro": "Alpha Lion and Alpha Tiger — magna cum laude, both of them. The Tower's pride doesn't lose in public.",
        "lose": "Magna... and humbled. The Tower's pride is yours to carry now — go on."
      },
      {
        "id": "qf2",
        "name": "Summa",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "015",
            "level": 54
          },
          {
            "dex": "033",
            "level": 53
          }
        ],
        "intro": "Golden Eagle and Alpha Komodo — summa cum laude, top of everything. The Tower's best doesn't share its crown.",
        "lose": "Summa... and second. The crown is still up there — go take it from Caleb himself."
      },
      {
        "id": "qf3",
        "name": "Fellow",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "027",
            "level": 55
          },
          {
            "dex": "008",
            "level": 54
          }
        ],
        "intro": "King Cobra and Lion — I hold a fellowship in venom and power, and my team holds the same.",
        "lose": "Fellowship... revoked. The Tower's venom is yours now — go on."
      },
      {
        "id": "qf4",
        "name": "Doctor",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "054",
            "level": 54
          },
          {
            "dex": "011",
            "level": 54
          }
        ],
        "intro": "Electric Eel and Tiger — a doctorate in shock and awe. The Tower's brightest don't lose, kid.",
        "lose": "Doctorate... in losing, today. The brightest light is yours — go shine it at Caleb."
      },
      {
        "id": "sf1",
        "name": "Chancellor",
        "round": "semifinal",
        "team": [
          {
            "dex": "012",
            "level": 57
          },
          {
            "dex": "009",
            "level": 56
          }
        ],
        "intro": "Alpha Tiger and Alpha Lion — the Chancellor's own team, the two alphas of the Tower. The semifinal is where your run ends, kid.",
        "lose": "The Chancellor's team... beaten. Caleb is the only one left — go make the Tower remember your name."
      },
      {
        "id": "sf2",
        "name": "Emeritus",
        "round": "semifinal",
        "team": [
          {
            "dex": "006",
            "level": 58
          },
          {
            "dex": "015",
            "level": 56
          }
        ],
        "intro": "Alpha Wolf and Golden Eagle — emeritus, retired, undefeated. Thirty years at the Tower, and I've never lost a semifinal.",
        "lose": "Thirty years... and a kid from Haven Village ends it. Caleb is waiting — go finish this."
      },
      {
        "id": "caleb",
        "name": "Caleb",
        "round": "final",
        "team": [
          {
            "dex": "012",
            "level": 60
          },
          {
            "dex": "006",
            "level": 58
          },
          {
            "dex": "045",
            "level": 59
          }
        ],
        "intro": "Kai. You made it to the top of my Tower — Alpha Tiger, Alpha Wolf, Great White Shark, all bought and trained with company money. I left Haven Village to become this. Beat me, and you get to choose what this city becomes. Lose, and you take the job.",
        "lose": "You beat me... with the leftover starter, same as always. The University Games are yours, Kai — and so is the choice. Mara's waiting in the bazaar, and so is my offer. Choose well."
      }
    ],
    "finalId": "caleb",
    // Tournaments doc says TM Lightning Strike, but Lightning Strike carries no TM number
    // in METAMONSTERS-MOVES.md — TM Sonic Scream is the documented substitute.
    "reward": {
      "cash": 100000,
      "items": {
        "tmSonicScream": 1
      },
      "unlock": "rokCity"
    },
    "crowd": [
      "The university crowd roars!",
      "A big cheer rolls through the Ivory Tower!",
      "Gasps from the lecture hall!",
      "The campus crowd is on its feet!",
      "Oohs and aahs ripple through the stands!",
      "Students chant your name from the balconies!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Ivory Tower!",
      "Graduation caps fly at the roar!",
      "The whole university erupts!"
    ]
  },
  {
    "id": "wastelandWar",
    "name": "The Wasteland War",
    "levels": [
      60,
      75
    ],
    "location": "The Rust Fields",
    "theme": "Mutants",
    "rounds": 4,
    "size": 16,
    "trainers": [
      {
        "id": "r1",
        "name": "Rust",
        "round": "round16",
        "team": [
          {
            "dex": "004",
            "level": 60,
            "mutant": true
          },
          {
            "dex": "013",
            "level": 61,
            "mutant": true
          }
        ],
        "intro": "Wolf cub and eaglet, both changed by the waste. The Rust Fields made us — what did the clean world ever make you?",
        "lose": "Rust flakes off and the wind takes it. Go on — the King is waiting, and he does not rust."
      },
      {
        "id": "r2",
        "name": "Scrap",
        "round": "round16",
        "team": [
          {
            "dex": "022",
            "level": 61,
            "mutant": true
          },
          {
            "dex": "025",
            "level": 60,
            "mutant": true
          }
        ],
        "intro": "Crocodile hatchling, cobra hatchling — scrap metal and venom, the only currency out here.",
        "lose": "Scrap's scrap now. The wasteland keeps what it breaks, and it broke me first."
      },
      {
        "id": "r3",
        "name": "Ash",
        "round": "round16",
        "team": [
          {
            "dex": "031",
            "level": 62,
            "mutant": true
          },
          {
            "dex": "067",
            "level": 61,
            "mutant": true
          }
        ],
        "intro": "Komodo hatchling and a baby scorpion, raised in the ash. We do not fight clean — we fight to keep what little we have.",
        "lose": "The ash settles on me this time. Take the win — the fields will give me another team."
      },
      {
        "id": "r4",
        "name": "Cinder",
        "round": "round16",
        "team": [
          {
            "dex": "010",
            "level": 62,
            "mutant": true
          },
          {
            "dex": "034",
            "level": 61,
            "mutant": true
          }
        ],
        "intro": "Tiger cub and tadpole — the waste does not care what you were. It only cares what you become.",
        "lose": "Burned down to cinders. You fight like the waste made you too."
      },
      {
        "id": "r5",
        "name": "Wreck",
        "round": "round16",
        "team": [
          {
            "dex": "043",
            "level": 63,
            "mutant": true
          },
          {
            "dex": "052",
            "level": 62,
            "mutant": true
          }
        ],
        "intro": "Baby shark and elver, pulled from the wreckyard runoff. The water out here bites back — so do we.",
        "lose": "Wrecked, fair and square. The King keeps the strong ones close. You might be one of them."
      },
      {
        "id": "r6",
        "name": "Rattle",
        "round": "round16",
        "team": [
          {
            "dex": "064",
            "level": 63,
            "mutant": true
          },
          {
            "dex": "070",
            "level": 62,
            "mutant": true
          }
        ],
        "intro": "Spiderling and spiderling — the Hollow's children, twice over. We rattle before we bite.",
        "lose": "Rattled and rolled. The Hollow will hear about you before you get there."
      },
      {
        "id": "r7",
        "name": "Slag",
        "round": "round16",
        "team": [
          {
            "dex": "073",
            "level": 62,
            "mutant": true
          },
          {
            "dex": "076",
            "level": 63,
            "mutant": true
          }
        ],
        "intro": "Zoea and lobster larva, boiled in slag water. Soft shells, hard hearts — that is the wasteland way.",
        "lose": "Slag cools and cracks. You are harder than the fields. Noted."
      },
      {
        "id": "r8",
        "name": "Grime",
        "round": "round16",
        "team": [
          {
            "dex": "082",
            "level": 63,
            "mutant": true
          },
          {
            "dex": "088",
            "level": 62,
            "mutant": true
          }
        ],
        "intro": "Octopus hatchling and snail hatchling, slick with grime. The waste coats everything — even winners.",
        "lose": "Grime washes off, but the loss sticks. Go — the King hates waiting."
      },
      {
        "id": "r9",
        "name": "Fuse",
        "round": "round16",
        "team": [
          {
            "dex": "058",
            "level": 64,
            "mutant": true
          },
          {
            "dex": "055",
            "level": 63,
            "mutant": true
          }
        ],
        "intro": "Bee larva and ant larva — the hives out here hum with something the company left behind. We are its fuse.",
        "lose": "Fuse blown. The hive will send someone meaner. It always does."
      },
      {
        "id": "qf1",
        "name": "Marrow",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "005",
            "level": 66,
            "mutant": true
          },
          {
            "dex": "014",
            "level": 67,
            "mutant": true
          }
        ],
        "intro": "Gray Wolf and Eagle, grown on marrow and waste. The quarterfinal is where the fields start keeping score.",
        "lose": "Marrow's dry. You fight like the fields made you — maybe they did."
      },
      {
        "id": "qf2",
        "name": "Flint",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "023",
            "level": 67,
            "mutant": true
          },
          {
            "dex": "026",
            "level": 66,
            "mutant": true
          }
        ],
        "intro": "Crocodile and cobra — flint and spark. One wrong step in the Rust Fields and the whole place goes up.",
        "lose": "No spark left. The fields keep the strong ones — you are stronger than the fields."
      },
      {
        "id": "qf3",
        "name": "Tar",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "032",
            "level": 68,
            "mutant": true
          },
          {
            "dex": "068",
            "level": 67,
            "mutant": true
          }
        ],
        "intro": "Komodo and scorpion, thick as tar and twice as hard to wash off. The quarterfinal sticks to you.",
        "lose": "Stuck... and beaten. The tar lets go of losers slow. Go on."
      },
      {
        "id": "qf4",
        "name": "Bolt",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "044",
            "level": 68,
            "mutant": true
          },
          {
            "dex": "053",
            "level": 67,
            "mutant": true
          }
        ],
        "intro": "Reef Shark and eel — the runoff rivers hum with current. I am the bolt that jumps the gap.",
        "lose": "Bolt's spent. The King will want to see the one who did this to me."
      },
      {
        "id": "sf1",
        "name": "Hex",
        "round": "semifinal",
        "team": [
          {
            "dex": "006",
            "level": 70,
            "mutant": true
          },
          {
            "dex": "012",
            "level": 71,
            "mutant": true
          },
          {
            "dex": "015",
            "level": 69,
            "mutant": true
          }
        ],
        "intro": "Alpha Wolf, Alpha Tiger, Golden Eagle — the waste's own royalty, and I am their hex. The semifinal is where your run ends.",
        "lose": "Hex broken. The King does not lose to outsiders — prove me wrong, and I will be glad I lost."
      },
      {
        "id": "sf2",
        "name": "Shard",
        "round": "semifinal",
        "team": [
          {
            "dex": "024",
            "level": 71,
            "mutant": true
          },
          {
            "dex": "030",
            "level": 70,
            "mutant": true
          },
          {
            "dex": "036",
            "level": 69,
            "mutant": true
          }
        ],
        "intro": "Saltwater Crocodile, Reticulated Python, Poison Dart Frog — every shard of the waste, sharpened. The semifinal cuts deep.",
        "lose": "Shattered. The final is yours to chase — the King is the last shard, and the sharpest."
      },
      {
        "id": "wastelandKing",
        "name": "The Wasteland King",
        "round": "final",
        "team": [
          {
            "dex": "006",
            "level": 73,
            "mutant": true
          },
          {
            "dex": "012",
            "level": 75,
            "mutant": true
          },
          {
            "dex": "045",
            "level": 74,
            "mutant": true
          },
          {
            "dex": "033",
            "level": 72,
            "mutant": true
          }
        ],
        "intro": "Alpha Wolf, Alpha Tiger, Great White Shark, Alpha Komodo — all of them changed by the waste, all of them mine. I am the Wasteland King, and the Rust Fields are my kingdom. The company poisoned this land, Kai — and the land answered. Take the crown if you can.",
        "lose": "The land... gives way. You beat the King of the Rust Fields with your own team — take the crown, Kai, and take the light with it. The Long Dark is yours to cross now."
      }
    ],
    "finalId": "wastelandKing",
    "reward": {
      "cash": 200000,
      "items": {
        "chemicalX": 1,
        "tmTremor": 1
      },
      "unlock": "HM LIGHT"
    },
    "crowd": [
      "The wasteland crowd roars!",
      "A big cheer rolls across the Rust Fields!",
      "Gasps from the scavengers!",
      "The rusted stands shake with cheering!",
      "Oohs and aahs ripple through the smoke!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Rust Fields!",
      "Mutant roars answer the crowd's roar!",
      "Scrap metal clangs as the crowd stamps!",
      "The whole wasteland erupts!"
    ]
  },
  {
    "id": "rokCityChampionship",
    "name": "Rok City Championship",
    "levels": [
      75,
      90
    ],
    "location": "Rok City",
    "theme": "Corporate, the big one",
    "rounds": 4,
    "size": 16,
    "trainers": [
      {
        "id": "r1",
        "name": "Ledger",
        "round": "round16",
        "team": [
          {
            "dex": "002",
            "level": 75
          },
          {
            "dex": "005",
            "level": 76
          }
        ],
        "intro": "Black Bear and Gray Wolf — bought, trained, and expensed. In Rok City, every win is a line item, and I balance my books.",
        "lose": "That loss is going on the books as a write-off. Enjoy it — accounting never forgets, but it forgives once."
      },
      {
        "id": "r2",
        "name": "Vance",
        "round": "round16",
        "team": [
          {
            "dex": "008",
            "level": 76
          },
          {
            "dex": "014",
            "level": 77
          }
        ],
        "intro": "Lion and Eagle — the company crest, walking. I fight for the brand, and the brand always wins.",
        "lose": "The brand... took a hit today. Marketing will spin it. Go on."
      },
      {
        "id": "r3",
        "name": "Sterling",
        "round": "round16",
        "team": [
          {
            "dex": "011",
            "level": 77
          },
          {
            "dex": "020",
            "level": 76
          }
        ],
        "intro": "Tiger and Penguin — sterling silver and cold cash. My team is an investment, and investments pay out.",
        "lose": "Investment... depreciated. You are a market correction I did not see coming."
      },
      {
        "id": "r4",
        "name": "Primm",
        "round": "round16",
        "team": [
          {
            "dex": "023",
            "level": 78
          },
          {
            "dex": "026",
            "level": 77
          }
        ],
        "intro": "Crocodile and cobra — prim, proper, and poisonous. Rok City manners, wasteland teeth.",
        "lose": "Prim and proper... and beaten. The city will hear about this. It hears everything."
      },
      {
        "id": "r5",
        "name": "Gould",
        "round": "round16",
        "team": [
          {
            "dex": "029",
            "level": 78
          },
          {
            "dex": "038",
            "level": 77
          }
        ],
        "intro": "Python and Axolotl — gold-plated and cold-blooded. The executive floor bred them; I just sign the checks.",
        "lose": "The checks bounced. First time in twenty years. You fight like you own the place."
      },
      {
        "id": "r6",
        "name": "Mercer",
        "round": "round16",
        "team": [
          {
            "dex": "044",
            "level": 79
          },
          {
            "dex": "050",
            "level": 78
          }
        ],
        "intro": "Reef Shark and Tuna — the company's own aquarium, weaponized. Every creature here is company property, including the ones that bite.",
        "lose": "Property... damaged. Legal will want a word. So will the Champion."
      },
      {
        "id": "r7",
        "name": "Sloane",
        "round": "round16",
        "team": [
          {
            "dex": "056",
            "level": 79
          },
          {
            "dex": "065",
            "level": 78
          }
        ],
        "intro": "Ant and Tarantula — small, patient, and everywhere. Sloane Industries has a creature in every corner of this city.",
        "lose": "Every corner... except the winner's circle. Take it. It is yours."
      },
      {
        "id": "r8",
        "name": "Crane",
        "round": "round16",
        "team": [
          {
            "dex": "071",
            "level": 80
          },
          {
            "dex": "077",
            "level": 79
          }
        ],
        "intro": "Orb Weaver Spider and Lobster — I built my fortune thread by thread, claw by claw. Try to take it.",
        "lose": "The threads snapped. Crane Holdings has never lost a quarter — until yours."
      },
      {
        "id": "r9",
        "name": "Adler",
        "round": "round16",
        "team": [
          {
            "dex": "083",
            "level": 80
          },
          {
            "dex": "086",
            "level": 79
          }
        ],
        "intro": "Octopus and Squid — eight arms, eight departments, one bottom line. Adler Group does not lose in public.",
        "lose": "Public loss. The board will hear about this before I do. Go — the Champion is waiting."
      },
      {
        "id": "qf1",
        "name": "Bishop",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "003",
            "level": 82
          },
          {
            "dex": "009",
            "level": 81
          }
        ],
        "intro": "Grizzly and Alpha Lion — the bishop moves diagonally, and the board is the whole city. The quarterfinal is a hostile takeover.",
        "lose": "Takeover... failed. You play the long game better than the company does."
      },
      {
        "id": "qf2",
        "name": "Locke",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "012",
            "level": 83
          },
          {
            "dex": "015",
            "level": 82
          }
        ],
        "intro": "Alpha Tiger and Golden Eagle — locked, loaded, and listed on the exchange. My team is blue-chip. Yours is a rumor.",
        "lose": "The rumor just beat the blue chip. The market will love this story."
      },
      {
        "id": "qf3",
        "name": "Pierce",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "027",
            "level": 83
          },
          {
            "dex": "033",
            "level": 82
          }
        ],
        "intro": "King Cobra and Alpha Komodo — Pierce Capital buys the dangerous ones young and sells them old. The quarterfinal is a closing deal.",
        "lose": "Deal... fell through. You negotiate with your fists, and the terms were yours."
      },
      {
        "id": "qf4",
        "name": "Hale",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "045",
            "level": 84
          },
          {
            "dex": "051",
            "level": 83
          }
        ],
        "intro": "Great White Shark and Bluefin Tuna — Hale Marine owns the water, and the water owns the fight. The quarterfinal is deep, Kai.",
        "lose": "Deep water... and I am drowning in it. The semifinal is yours — swim for it."
      },
      {
        "id": "sf1",
        "name": "Voss",
        "round": "semifinal",
        "team": [
          {
            "dex": "006",
            "level": 86
          },
          {
            "dex": "027",
            "level": 85
          },
          {
            "dex": "015",
            "level": 86
          }
        ],
        "intro": "Alpha Wolf, King Cobra, Golden Eagle — Voss Holdings' flagship team, and I am its CEO. The semifinal is a board meeting, and you are not on the agenda.",
        "lose": "The board just voted me out. You fight like a majority shareholder, Kai."
      },
      {
        "id": "sf2",
        "name": "Marlowe",
        "round": "semifinal",
        "team": [
          {
            "dex": "003",
            "level": 86
          },
          {
            "dex": "045",
            "level": 87
          },
          {
            "dex": "033",
            "level": 85
          }
        ],
        "intro": "Grizzly, Great White Shark, Alpha Komodo — Marlowe Group's three best, and the company paid for all of it. The semifinal is where the money talks.",
        "lose": "Money talked... and lost the argument. The final is yours — the Champion does not lose arguments."
      },
      {
        "id": "corporateChampion",
        "name": "The Corporate Champion",
        "round": "final",
        "team": [
          {
            "dex": "003",
            "level": 88
          },
          {
            "dex": "006",
            "level": 89
          },
          {
            "dex": "045",
            "level": 90
          },
          {
            "dex": "012",
            "level": 87
          }
        ],
        "intro": "Grizzly, Alpha Wolf, Great White Shark, Alpha Tiger — the four best creatures money can buy, trained on company time, fed on company budgets. I am the Corporate Champion, hand-picked by the executive floor, and the whole city is watching. Beat me, Kai, and you beat the company itself.",
        "lose": "You beat the company... with a team the company threw away. The Championship is yours, Kai — and so is the Echo Caves. Dive deep, and do not look back."
      }
    ],
    "finalId": "corporateChampion",
    "reward": {
      "cash": 400000,
      "items": {
        "chemicalX": 2,
        "tmMoltenStrike": 1
      },
      "unlock": "HM DIVE"
    },
    "crowd": [
      "The Rok City crowd roars!",
      "A big cheer rolls through the arena!",
      "Gasps from the executive boxes!",
      "The whole city is on its feet!",
      "Oohs and aahs ripple through the stands!",
      "The crowd holds its breath...",
      "A huge cheer shakes Rok City!",
      "Skyscraper lights flash at the roar!",
      "The arena screens flare with your name!",
      "The whole city erupts!"
    ]
  },
  {
    "id": "ancientCrown",
    "name": "The Ancient Crown",
    "levels": [
      90,
      100
    ],
    "location": "The Echo Caves",
    "theme": "Ancients, near-impossible",
    "rounds": 5,
    "size": 32,
    "trainers": [
      {
        "id": "s1",
        "name": "Stone",
        "round": "round32",
        "team": [
          {
            "dex": "003",
            "level": 90
          },
          {
            "dex": "006",
            "level": 91
          }
        ],
        "intro": "Grizzly and Alpha Wolf — stone does not move for anyone. The Crown's first round is a wall, and I am it.",
        "lose": "Stone... cracks. The cave keeps the pieces. Go on."
      },
      {
        "id": "s2",
        "name": "Echo",
        "round": "round32",
        "team": [
          {
            "dex": "045",
            "level": 91
          },
          {
            "dex": "012",
            "level": 90
          }
        ],
        "intro": "Great White Shark and Alpha Tiger — the cave echoes every battle fought here, and I have heard them all. Yours will echo too.",
        "lose": "The echo fades. The cave remembers winners longer than losers."
      },
      {
        "id": "s3",
        "name": "Flint",
        "round": "round32",
        "team": [
          {
            "dex": "027",
            "level": 91
          },
          {
            "dex": "033",
            "level": 90
          }
        ],
        "intro": "King Cobra and Alpha Komodo — flint and fang. One spark in the dark, and the whole cave knows your name.",
        "lose": "No spark left. The dark keeps what it takes — it did not take you."
      },
      {
        "id": "s4",
        "name": "Grotto",
        "round": "round32",
        "team": [
          {
            "dex": "015",
            "level": 90
          },
          {
            "dex": "009",
            "level": 91
          }
        ],
        "intro": "Golden Eagle and Alpha Lion — the grotto's own royalty, carved from the cave itself. The Crown does not open for outsiders.",
        "lose": "Carved... and chipped. The grotto opens for you, stranger. It opens for no one else."
      },
      {
        "id": "s5",
        "name": "Rune",
        "round": "round32",
        "team": [
          {
            "dex": "030",
            "level": 91
          },
          {
            "dex": "054",
            "level": 92
          }
        ],
        "intro": "Reticulated Python and Electric Eel — the runes on the cave wall are older than the city, and they say the Crown is never won. Prove them wrong.",
        "lose": "The runes were wrong. They are wrong about one trainer a century. You are the one."
      },
      {
        "id": "s6",
        "name": "Vale",
        "round": "round32",
        "team": [
          {
            "dex": "066",
            "level": 92
          },
          {
            "dex": "072",
            "level": 91
          }
        ],
        "intro": "Goliath Tarantula and Black Widow — the vale's deepest dark, eight legs at a time. The Crown's first round bites.",
        "lose": "Bitten... and beaten. The vale lets you pass. It never lets anyone pass twice."
      },
      {
        "id": "s7",
        "name": "Hollow",
        "round": "round32",
        "team": [
          {
            "dex": "084",
            "level": 92
          },
          {
            "dex": "087",
            "level": 91
          }
        ],
        "intro": "Giant Pacific Octopus and Giant Squid — the hollow's deep water, cold as the cave floor. The Crown drowns the unready.",
        "lose": "Drowned... and done. You are ready, and the cave knows it."
      },
      {
        "id": "s8",
        "name": "Brine",
        "round": "round32",
        "team": [
          {
            "dex": "108",
            "level": 92
          },
          {
            "dex": "024",
            "level": 91
          }
        ],
        "intro": "Vampire Bat and Saltwater Crocodile — brine and blood, the cave's own recipe. The first round is a taste. The Crown is the meal.",
        "lose": "Bitter taste. The cave's recipe does not suit me today — it suits you."
      },
      {
        "id": "s9",
        "name": "Pebble",
        "round": "round32",
        "team": [
          {
            "dex": "003",
            "level": 92
          },
          {
            "dex": "045",
            "level": 93
          }
        ],
        "intro": "Grizzly and Great White Shark — a pebble is still stone, and stone still breaks bones. The Crown's first round does not care how small you look.",
        "lose": "Pebble... crushed. The cave floor is littered with pebbles like me. Walk over us."
      },
      {
        "id": "s10",
        "name": "Moss",
        "round": "round32",
        "team": [
          {
            "dex": "006",
            "level": 93
          },
          {
            "dex": "012",
            "level": 92
          }
        ],
        "intro": "Alpha Wolf and Alpha Tiger — moss grows on the cave walls where nothing else can live. I grew here too. The Crown is mine to guard.",
        "lose": "Moss peels away. The walls will grow something new. Maybe it will be you."
      },
      {
        "id": "s11",
        "name": "Drip",
        "round": "round32",
        "team": [
          {
            "dex": "027",
            "level": 93
          },
          {
            "dex": "015",
            "level": 92
          }
        ],
        "intro": "King Cobra and Golden Eagle — drip by drip, the cave makes its own stone. I have waited a hundred years for a challenger worth the wait.",
        "lose": "Drip... dried. A hundred years, and you were worth it."
      },
      {
        "id": "s12",
        "name": "Stalactite",
        "round": "round32",
        "team": [
          {
            "dex": "033",
            "level": 93
          },
          {
            "dex": "009",
            "level": 92
          }
        ],
        "intro": "Alpha Komodo and Alpha Lion — I hang above the cave floor and I fall on the unready. The Crown's first round falls hard.",
        "lose": "Fallen... and shattered. The cave floor catches everything, even me."
      },
      {
        "id": "s13",
        "name": "Quartz",
        "round": "round32",
        "team": [
          {
            "dex": "030",
            "level": 92
          },
          {
            "dex": "066",
            "level": 93
          }
        ],
        "intro": "Reticulated Python and Goliath Tarantula — quartz catches the light and throws it back. The Crown's first round blinds the careless.",
        "lose": "Light... gone. The cave is dark again, and you are the only light in it."
      },
      {
        "id": "s14",
        "name": "Basalt",
        "round": "round32",
        "team": [
          {
            "dex": "054",
            "level": 93
          },
          {
            "dex": "084",
            "level": 92
          }
        ],
        "intro": "Electric Eel and Giant Pacific Octopus — basalt is the cave's own bone, black and hard. The Crown's first round does not bend.",
        "lose": "Basalt... broken. The cave's bone is not as hard as your team."
      },
      {
        "id": "s15",
        "name": "Onyx",
        "round": "round32",
        "team": [
          {
            "dex": "072",
            "level": 93
          },
          {
            "dex": "087",
            "level": 92
          }
        ],
        "intro": "Black Widow and Giant Squid — onyx is the dark made solid, and the dark is my home. The Crown's first round is the dark itself.",
        "lose": "The dark... lifts. You carry your own light, stranger. Carry it deeper."
      },
      {
        "id": "s16",
        "name": "Granite",
        "round": "round32",
        "team": [
          {
            "dex": "108",
            "level": 93
          },
          {
            "dex": "024",
            "level": 92
          }
        ],
        "intro": "Vampire Bat and Saltwater Crocodile — granite is the last thing the cave is made of, and the first thing it throws at you. The Crown's first round is the mountain.",
        "lose": "Granite... ground down. The mountain moves for you. It moves for no one else."
      },
      {
        "id": "r1",
        "name": "Cavern",
        "round": "round16",
        "team": [
          {
            "dex": "003",
            "level": 94
          },
          {
            "dex": "006",
            "level": 93
          },
          {
            "dex": "045",
            "level": 94
          }
        ],
        "intro": "Grizzly, Alpha Wolf, Great White Shark — the cavern's three best, and I am its voice. The round of sixteen is where the cave stops pretending.",
        "lose": "The cavern goes quiet. The cave is listening to you now, not me."
      },
      {
        "id": "r2",
        "name": "Abyss",
        "round": "round16",
        "team": [
          {
            "dex": "012",
            "level": 94
          },
          {
            "dex": "027",
            "level": 93
          },
          {
            "dex": "015",
            "level": 94
          }
        ],
        "intro": "Alpha Tiger, King Cobra, Golden Eagle — the abyss does not have a bottom, and neither does my team. The round of sixteen swallows the weak.",
        "lose": "Swallowed... and spat back out. The abyss has never done that before."
      },
      {
        "id": "r3",
        "name": "Tunnel",
        "round": "round16",
        "team": [
          {
            "dex": "033",
            "level": 94
          },
          {
            "dex": "030",
            "level": 93
          },
          {
            "dex": "009",
            "level": 95
          }
        ],
        "intro": "Alpha Komodo, Reticulated Python, Alpha Lion — the tunnel narrows, and so does my patience. The round of sixteen is a dead end for most.",
        "lose": "Dead end... with a door in it. You found the door. Go through."
      },
      {
        "id": "r4",
        "name": "Chamber",
        "round": "round16",
        "team": [
          {
            "dex": "054",
            "level": 94
          },
          {
            "dex": "066",
            "level": 95
          },
          {
            "dex": "084",
            "level": 93
          }
        ],
        "intro": "Electric Eel, Goliath Tarantula, Giant Pacific Octopus — the chamber's three guardians, and I am the fourth. The round of sixteen is a locked room.",
        "lose": "Unlocked. The chamber opens for you — it has never opened for anyone."
      },
      {
        "id": "r5",
        "name": "Passage",
        "round": "round16",
        "team": [
          {
            "dex": "072",
            "level": 95
          },
          {
            "dex": "087",
            "level": 94
          },
          {
            "dex": "108",
            "level": 93
          }
        ],
        "intro": "Black Widow, Giant Squid, Vampire Bat — the passage is narrow, dark, and full of teeth. The round of sixteen is the cave's throat.",
        "lose": "Through the throat... and still breathing. The cave has never let anyone through before."
      },
      {
        "id": "r6",
        "name": "Vault",
        "round": "round16",
        "team": [
          {
            "dex": "003",
            "level": 95
          },
          {
            "dex": "012",
            "level": 94
          },
          {
            "dex": "027",
            "level": 93
          }
        ],
        "intro": "Grizzly, Alpha Tiger, King Cobra — the vault holds the cave's oldest treasures, and I hold the key. The round of sixteen is the lock.",
        "lose": "Lock... picked. The vault is yours to open, stranger. Take what is inside."
      },
      {
        "id": "r7",
        "name": "Crevice",
        "round": "round16",
        "team": [
          {
            "dex": "006",
            "level": 95
          },
          {
            "dex": "045",
            "level": 94
          },
          {
            "dex": "033",
            "level": 93
          }
        ],
        "intro": "Alpha Wolf, Great White Shark, Alpha Komodo — the crevice is the cave's thinnest crack, and the sharpest. The round of sixteen cuts.",
        "lose": "Cut... and still standing. The crevice widens for you. It widens for no one else."
      },
      {
        "id": "r8",
        "name": "Sanctum",
        "round": "round16",
        "team": [
          {
            "dex": "015",
            "level": 95
          },
          {
            "dex": "030",
            "level": 94
          },
          {
            "dex": "054",
            "level": 93
          }
        ],
        "intro": "Golden Eagle, Reticulated Python, Electric Eel — the sanctum is the cave's holy place, and I am its keeper. The round of sixteen is a prayer the cave answers.",
        "lose": "The prayer was answered... for you. The sanctum bows to a new keeper."
      },
      {
        "id": "r9",
        "name": "Relic",
        "round": "round16",
        "team": [
          {
            "dex": "012",
            "level": 95
          },
          {
            "dex": "030",
            "level": 94
          },
          {
            "dex": "066",
            "level": 93
          }
        ],
        "intro": "Alpha Tiger, Reticulated Python, Goliath Tarantula — the relic is the cave's oldest thing, and I am its voice. The round of sixteen is a museum, and you are the exhibit.",
        "lose": "Exhibit... closed. The relic goes back on its shelf, and you go deeper."
      },
      {
        "id": "qf1",
        "name": "Warden",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "003",
            "level": 96
          },
          {
            "dex": "006",
            "level": 95
          },
          {
            "dex": "045",
            "level": 96
          }
        ],
        "intro": "Grizzly, Alpha Wolf, Great White Shark — I am the Warden of the deep cave, and the quarterfinal is my gate. No one has passed it in a hundred years.",
        "lose": "The gate... opens. A hundred years, and you are the first. The Keeper will want to meet you."
      },
      {
        "id": "qf2",
        "name": "Sentinel",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "012",
            "level": 96
          },
          {
            "dex": "027",
            "level": 95
          },
          {
            "dex": "033",
            "level": 96
          }
        ],
        "intro": "Alpha Tiger, King Cobra, Alpha Komodo — I am the Sentinel, and I have stood this post since the cave was young. The quarterfinal is my watch.",
        "lose": "My watch... ends. The cave chose you over me, and the cave is never wrong."
      },
      {
        "id": "qf3",
        "name": "Guardian",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "015",
            "level": 97
          },
          {
            "dex": "054",
            "level": 96
          },
          {
            "dex": "066",
            "level": 95
          }
        ],
        "intro": "Golden Eagle, Electric Eel, Goliath Tarantula — I am the Guardian of the old bones, and the quarterfinal is my ground. The ancients are watching.",
        "lose": "The ancients watched... and they chose you. Take the win. Take it deeper."
      },
      {
        "id": "qf4",
        "name": "Keeper",
        "round": "quarterfinal",
        "team": [
          {
            "dex": "084",
            "level": 97
          },
          {
            "dex": "072",
            "level": 96
          },
          {
            "dex": "108",
            "level": 95
          }
        ],
        "intro": "Giant Pacific Octopus, Black Widow, Vampire Bat — I am the Keeper of the lower dark, and the quarterfinal is my door. The Crown is behind it.",
        "lose": "The door... opens. The lower dark lets you through, and it lets no one through."
      },
      {
        "id": "sf1",
        "name": "The Deep Warden",
        "round": "semifinal",
        "team": [
          {
            "dex": "003",
            "level": 98
          },
          {
            "dex": "006",
            "level": 97
          },
          {
            "dex": "045",
            "level": 98
          },
          {
            "dex": "012",
            "level": 96
          }
        ],
        "intro": "Grizzly, Alpha Wolf, Great White Shark, Alpha Tiger — I am the Deep Warden, the last trainer before the Keeper himself. The semifinal is the cave's final test of the living.",
        "lose": "Test... passed. The living do not usually pass. The Keeper is waiting, Kai — and he has been waiting a very long time."
      },
      {
        "id": "sf2",
        "name": "The Old Sentinel",
        "round": "semifinal",
        "team": [
          {
            "dex": "027",
            "level": 98
          },
          {
            "dex": "033",
            "level": 97
          },
          {
            "dex": "015",
            "level": 98
          },
          {
            "dex": "054",
            "level": 96
          }
        ],
        "intro": "King Cobra, Alpha Komodo, Golden Eagle, Electric Eel — I am the Old Sentinel, older than the cave's maps and twice as stubborn. The semifinal is where legends are weighed.",
        "lose": "Weighed... and found worthy. The Keeper's door is open, Kai. Walk through it like you own it — because after this, you do."
      },
      {
        "id": "ancientKeeper",
        "name": "The Ancient Keeper",
        "round": "final",
        "team": [
          {
            "dex": "A06",
            "level": 98
          },
          {
            "dex": "A10",
            "level": 100
          },
          {
            "dex": "A03",
            "level": 97
          },
          {
            "dex": "A04",
            "level": 95
          }
        ],
        "intro": "T. Rex, Megalodon, Saber-Toothed Tiger, Pterodactyl — the four ancients that guard the cave to the 75+ world, and I am their Keeper. I have waited a hundred years for a trainer worth the Crown. Beat me, Kai, and the whole old world is yours.",
        "lose": "A hundred years... and you are the one. The Ancient Crown is yours, Kai — and with it, a Dire Wolf of my own pack, and the way out of the Long Dark. The 75+ world is waiting. Go."
      }
    ],
    "finalId": "ancientKeeper",
    "reward": {
      "cash": 500000,
      "items": {
        "chemicalX": 3,
        "tmPressurePoint": 1
      },
      "unlock": "longDarkExit"
    },
    "crowd": [
      "The cave crowd roars!",
      "A big cheer rolls through the Echo Caves!",
      "Gasps from the torchlight!",
      "The whole cave is on its feet!",
      "Oohs and aahs ripple through the dark!",
      "The crowd holds its breath...",
      "A huge cheer shakes the Echo Caves!",
      "Ancient roars answer the crowd's roar!",
      "Torches flare as the crowd stamps!",
      "The whole old world erupts!"
    ]
  }
];
