/* Metamonsters — backend.js (pass 3).
   LOCAL-FIRST backend: one global `BACKEND`, all 17 tables from
   METAMONSTERS-BACKEND.md held in a single JSON document in localStorage
   ('metamonsters_backend_v1'). No server, no live world: every method is one
   ask and one answer, synchronous, returning {ok, ...} or {ok:false, error}.
   Leaderboards and battle history are COMPUTED, never stored.
   Passwords are stored SCRAMBLED (a simple non-reversible hash) — this is a
   local-only stand-in, not real security; never store a plain password.
   The bot world (12 bot players) makes every feature usable offline.
   Plain JS, no modules, no imports. May read/write the live game state G
   (party/storage/bag/cash/flags) and the engine globals (makeCreature,
   addItem/removeItem, DEX, MOVES, moveDef, calcDamage, pickEnemyMove) when
   they exist; every such use is guarded so the file also loads standalone. */
'use strict';

const BACKEND = (function () {
  const KEY = 'metamonsters_backend_v1';
  const PLAYER_CAP = 1000;
  const MAX_TRADE = 1000000;

  /* ---------- small utilities ---------- */
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function nowISO() { return new Date().toISOString(); }
  function todayStr(d) { const t = d || new Date(); return t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0'); }
  function yesterdayStr() { const t = new Date(); t.setDate(t.getDate() - 1); return todayStr(t); }
  function dayOfYear() { const t = new Date(); return Math.floor((t - new Date(t.getFullYear(), 0, 0)) / 86400000); }
  // Simple non-reversible scramble (djb2, salted, 3 rounds). Local-only.
  function scramble(pw) {
    let h1 = 5381, h2 = 0x9e3779b9;
    const s = 'metamonsters-salt::' + String(pw);
    for (let r = 0; r < 3; r++) {
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i) + r;
        h1 = ((h1 << 5) + h1 + c) >>> 0;
        h2 = ((h2 << 5) - h2 + c * 31) >>> 0;
      }
    }
    return 's1:' + h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  }
  function esc(s) { return String(s == null ? '' : s); }

  /* ---------- stars / price floors (METAMONSTERS-RARITY.md) ----------
     Stars come from DEX[dex].stars as-is (per-stage in the current dex).
     Floors: 1★ 1–5, 2★ 5–100, 3★ 100–10,000, 4★ gift-only NEVER listed,
     5★ 100,000–1,000,000. Max trade overall: 1,000,000. */
  function starsOf(dex) {
    try { if (typeof DEX !== 'undefined' && DEX[dex]) return DEX[dex].stars || 1; } catch (e) {}
    return 1;
  }
  function priceFloorForStars(stars) {
    if (stars <= 1) return { min: 1, max: 5 };
    if (stars === 2) return { min: 5, max: 100 };
    if (stars === 3) return { min: 100, max: 10000 };
    if (stars === 4) return { min: null, max: null }; // gift-only: never listed
    return { min: 100000, max: 1000000 };
  }
  function checkCreaturePrice(dex, price) {
    const stars = starsOf(dex);
    const f = priceFloorForStars(stars);
    if (f.min == null) return { ok: false, error: 'a ' + stars + '-star creature is gift-only and can never be listed' };
    if (!Number.isFinite(price) || price < f.min || price > f.max) {
      return { ok: false, error: 'price ' + price + ' is outside the ' + stars + '-star floor (' + f.min + '–' + f.max + ' cash)' };
    }
    return { ok: true, stars: stars };
  }
  // Trade value used for bot decisions: stars first, then level.
  function creatureValue(c) { return starsOf(c.dex) * 10000 + (c.level || 1) * 100 + (c.mutant ? 5000 : 0) + (c.instinct ? 2000 : 0); }
  function offerValue(offer) {
    let v = 0;
    for (const cid of (offer.creatures || [])) { const c = db.creatures.find(x => x.id === cid); if (c) v += creatureValue(c); }
    for (const it of (offer.items || [])) { let p = 10; try { if (typeof ITEMS !== 'undefined' && ITEMS[it.id]) p = ITEMS[it.id].price || 10; } catch (e) {} v += p * (it.qty || 1); }
    return v;
  }

  /* ---------- store ---------- */
  let db = null;
  let inited = false;
  function emptyDb() {
    return {
      accounts: [], profiles: [], creatures: [], items: [], bases: [], skills: [],
      trades: [], battles: [], messages: [], mailbox: [], friends: [], guilds: [],
      marketplace: [], dailyRewards: [], achievements: [], liveEvents: [],
      saves: [], eventClaims: [], seq: 1,
    };
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
  }
  function nextId(prefix) { return prefix + '-' + (db.seq++) + '-' + Math.random().toString(36).slice(2, 7); }

  /* ---------- live-game helpers (guarded) ---------- */
  function live() { try { return (typeof G !== 'undefined') ? G : null; } catch (e) { return null; } }
  function liveCreatureByUid(uid) {
    const g = live(); if (!g) return null;
    return (g.party || []).concat(g.storage || []).find(c => c.uid === uid) || null;
  }
  function removeLiveCreature(uid) {
    const g = live(); if (!g) return null;
    let i = (g.party || []).findIndex(c => c.uid === uid);
    if (i >= 0) return g.party.splice(i, 1)[0];
    i = (g.storage || []).findIndex(c => c.uid === uid);
    if (i >= 0) return g.storage.splice(i, 1)[0];
    return null;
  }
  function addLiveCreature(c) {
    const g = live(); if (!g) return false;
    if ((g.party || []).length < 6) g.party.push(c); else g.storage.push(c);
    return true;
  }
  function makeLiveCreature(dex, level, opts) {
    try {
      if (typeof makeCreature === 'function') return makeCreature(dex, level, opts || {});
    } catch (e) {}
    let name = dex; try { if (typeof DEX !== 'undefined' && DEX[dex]) name = DEX[dex].name; } catch (e) {}
    return { uid: 'c' + Math.random().toString(36).slice(2, 9), dex: dex, name: name, level: level, xp: 0, hp: 50, maxHp: 50, moves: ['sig'], instinct: !!(opts && opts.instinct), mutant: !!(opts && opts.mutant), status: null };
  }
  function liveAddItem(id, n) { try { if (typeof addItem === 'function') addItem(id, n); else { const g = live(); if (g) { g.bag[id] = (g.bag[id] || 0) + n; if (g.bag[id] <= 0) delete g.bag[id]; } } } catch (e) {} }
  function liveHasItem(id, n) { try { if (typeof hasItem === 'function') return hasItem(id, n); } catch (e) {} const g = live(); return g && (g.bag[id] || 0) >= (n || 1); }
  function liveRemoveItem(id, n) { try { if (typeof removeItem === 'function') removeItem(id, n); else liveAddItem(id, -(n || 1)); } catch (e) {} }

  /* ---------- lookups ---------- */
  function findAccount(id) { return db.accounts.find(a => a.id === id) || null; }
  function findAccountByName(name) { return db.accounts.find(a => a.username.toLowerCase() === String(name).toLowerCase()) || null; }
  function isBot(id) { return typeof id === 'string' && /^bot-\d+$/.test(id); }
  function botIndex(id) { return isBot(id) ? parseInt(id.slice(4), 10) : 0; }
  function needPlayer(playerId) {
    if (!playerId) return { ok: false, error: 'no account' };
    const a = findAccount(playerId);
    if (!a) return { ok: false, error: 'no account' };
    return { ok: true, account: a };
  }
  // Backend creature rows mirror live creatures by uid (= creatureId).
  function ensureCreatureRow(liveC, ownerId, where) {
    let row = db.creatures.find(c => c.id === liveC.uid);
    if (!row) {
      row = {
        id: liveC.uid, ownerId: ownerId, dex: liveC.dex, nickname: '',
        level: liveC.level, xp: liveC.xp || 0, moves: (liveC.moves || []).slice(),
        variant: liveC.mutant ? 'Mutant' : liveC.instinct ? 'Instinct' : 'Normal',
        megaForm: '', heldItem: '', where: where || 'party', caughtDate: nowISO(),
      };
      db.creatures.push(row);
    } else {
      row.ownerId = ownerId; row.dex = liveC.dex; row.level = liveC.level; row.xp = liveC.xp || 0;
      row.moves = (liveC.moves || []).slice();
      row.variant = liveC.mutant ? 'Mutant' : liveC.instinct ? 'Instinct' : 'Normal';
      if (where) row.where = where;
    }
    return row;
  }
  function syncLivePartyToRows(playerId) {
    const g = live(); if (!g) return;
    for (const c of (g.party || [])) ensureCreatureRow(c, playerId, 'party');
    for (const c of (g.storage || [])) ensureCreatureRow(c, playerId, 'storage');
  }
  function syncAccountStats(playerId) {
    const a = findAccount(playerId); if (!a) return;
    const g = live(); if (!g) return;
    a.cash = g.cash;
    a.creaturesCaught = g.flags.caughtCount || a.creaturesCaught || 0;
    const lv = Math.max(1, ...((g.party || []).concat(g.storage || []).map(c => c.level || 1)));
    a.playerLevel = lv;
    a.tournamentWins = ['champion', 'forestClashChampion', 'reefRumbleChampion', 'desertHeatChampion', 'bazaarBrawlChampion', 'frostCrownChampion', 'universityGamesChampion'].filter(f => g.flags[f]).length;
    a.lastActive = nowISO();
  }

  /* ---------- bot world seeding ---------- */
  const BOT_NAMES = ['Rin', 'Boz', 'Suki', 'Ash', 'Wren', 'Kit', 'Lila', 'Moss', 'Tala', 'Nils', 'Ila', 'Dee'];
  const BOT_LEVELS = [12, 18, 25, 31, 38, 44, 52, 60, 68, 75, 84, 95];
  const BOT_PARTY_DEX = ['001', '004', '043', '013', '020', '030', '040', '050', '060', '070', '080', '090', '106', '107', '002', '005', '044', '014'];
  const BOT_CHAT = [
    'Anyone else grinding the meadow today? The nets keep breaking on me.',
    'Just caught my first Instinct! Glowing eyes and everything.',
    'Rok Plaza prices are a joke. Bazaar forever.',
    'Who wants to trade? I have a spare Wolf Cub, level 20.',
    'The Forest Clash final is no joke. Sofia does NOT mess around.',
    'Heard a rumor the dump site out east is where the mutants come from.',
    'My bear just hit level 30. Thick hide is carrying my whole team.',
    'Selling 5 bandages, cheap. Meet me at the Care Hub.',
    'Has anyone seen a Pterodactyl? Asking for a friend. A very old friend.',
    'Double XP Weekend and I am NOT sleeping. See you on the leaderboard.',
    'Mara was right about the company. I saw the foreclosure notices myself.',
    'New guild recruiting! Indie Trainers, no suits allowed.',
    'My shark crossed the pond without HM SWIM. Best starter, fight me.',
    'Chemical X is scary stuff. One Mega per battle and my hands still shake.',
    'CaughtCount check: who has 50 yet? I am stuck at 41.',
    'The bazaar merchant gave me 20% off just for being on the Fight path.',
    'Rok Phone died mid-trade. Never trusting the cloud again.',
    'Tournament tip: bring a Bird for the Reef Rumble. Trust me.',
    'Anyone selling a Car Battery? My eel is ready to evolve.',
    'The Hollow at night is beautiful and terrifying in equal measure.',
    'Guild board is up! Post your wins, no spoilers for the final battle.',
    'Just lost 50 cash to a wild mutant. Worth it. Almost.',
    'Fishing at the Tide Pools is peaceful. The creatures disagree.',
    'My guild leader says we raid the Wreckyard on Saturday. Bring traps.',
    'Level 100 feels impossible until it suddenly does not.',
    'Traded a 2-star for a 3-star today. The floors keep it fair.',
    'If you see Caleb, tell him the university kids miss him. Or do not.',
    'Megalodon Week! Every Fish creature I catch is one step closer.',
    'Ancient Hunt starts soon. 3,000 cash if you bag an ancient.',
    'First Mega today. My grizzly looked incredible for exactly one battle.',
  ];
  function seedBots() {
    for (let i = 0; i < 12; i++) {
      const id = 'bot-' + String(i + 1).padStart(2, '0');
      const level = BOT_LEVELS[i];
      const acc = {
        id: id, username: BOT_NAMES[i], password: scramble('bot-' + id), email: BOT_NAMES[i].toLowerCase() + '@bot.local',
        createdDate: nowISO(), lastActive: nowISO(), playerLevel: level, cash: 500 + level * 120,
        choicePath: i % 2 ? 'fight' : 'join', rokPrime: false, homeBase: '',
        creaturesCaught: 5 + level, tournamentWins: Math.min(7, Math.floor(level / 14)), wins: 0, isBot: true,
      };
      db.accounts.push(acc);
      db.profiles.push({ playerId: id, displayName: BOT_NAMES[i], title: level >= 60 ? 'Veteran Trainer' : 'Trainer', badges: level >= 60 ? ['Veteran'] : [], guild: '', friendsCount: 0, publicStats: { wins: 0, tournamentsWon: acc.tournamentWins, creaturesCaught: acc.creaturesCaught } });
      db.dailyRewards.push({ playerId: id, lastClaimDate: todayStr(), streak: 1 + (i % 5) });
      // Party of 2-4 real creatures, levels near the bot's level.
      const n = 2 + (i % 3);
      for (let j = 0; j < n; j++) {
        const dex = BOT_PARTY_DEX[(i * 3 + j * 5) % BOT_PARTY_DEX.length];
        const cl = Math.max(1, Math.min(100, level - 4 + j * 3));
        const c = makeLiveCreature(dex, cl, {});
        db.creatures.push({
          id: c.uid, ownerId: id, dex: dex, nickname: '', level: cl, xp: 0,
          moves: (c.moves || []).slice(), variant: 'Normal', megaForm: '', heldItem: '',
          where: 'party', caughtDate: nowISO(),
        });
      }
      // One spare creature per bot, listed on the marketplace at a legal price.
      const spareDex = BOT_PARTY_DEX[(i * 7 + 2) % BOT_PARTY_DEX.length];
      const spare = makeLiveCreature(spareDex, Math.max(1, level - 8), {});
      const spareRow = {
        id: spare.uid, ownerId: id, dex: spareDex, nickname: '', level: spare.level, xp: 0,
        moves: (spare.moves || []).slice(), variant: 'Normal', megaForm: '', heldItem: '',
        where: 'marketplace', caughtDate: nowISO(),
      };
      db.creatures.push(spareRow);
      const floor = priceFloorForStars(starsOf(spareDex));
      db.marketplace.push({
        id: nextId('listing'), sellerId: id, what: { kind: 'creature', creatureId: spare.uid },
        price: floor.min, status: 'for sale', listedDate: nowISO(), buyerId: null,
      });
      // One item listing per bot.
      const itemIds = ['net', 'bandage', 'bread', 'trap', 'berries'];
      const itemId = itemIds[i % itemIds.length];
      db.marketplace.push({
        id: nextId('listing'), sellerId: id, what: { kind: 'item', itemId: itemId, qty: 2 },
        price: 15 + i * 3, status: 'for sale', listedDate: nowISO(), buyerId: null,
      });
      db.items.push({ ownerId: id, itemId: itemId, qty: 5, category: 'Catching' });
    }
    // 3 guilds, led by bot-01/02/03, bots split across them.
    const guildDefs = [
      { id: 'guild-rok-elite', name: 'Rok City Elite', leaderId: 'bot-01' },
      { id: 'guild-indie', name: 'Indie Trainers', leaderId: 'bot-02' },
      { id: 'guild-east', name: 'East Survivors', leaderId: 'bot-03' },
    ];
    guildDefs.forEach((gd, gi) => {
      const members = [];
      for (let i = 0; i < 12; i++) if (i % 3 === gi) members.push('bot-' + String(i + 1).padStart(2, '0'));
      db.guilds.push({ id: gd.id, name: gd.name, leaderId: gd.leaderId, members: members, createdDate: nowISO(), board: [{ senderId: gd.leaderId, text: 'Welcome to ' + gd.name + '! Post your wins and trade offers here.', sentDate: nowISO() }] });
      for (const m of members) { const p = db.profiles.find(x => x.playerId === m); if (p) p.guild = gd.id; }
    });
    // Seeded global chat.
    const seedLines = [0, 3, 7, 11, 15, 22];
    seedLines.forEach((ci, k) => {
      db.messages.push({ id: nextId('msg'), senderId: 'bot-' + String((k * 2 % 12) + 1).padStart(2, '0'), text: BOT_CHAT[ci], sentDate: nowISO() });
    });
    // Two open bot trade offers (player2 null = open to anyone).
    const bot1Offer = db.creatures.find(c => c.ownerId === 'bot-02' && c.where === 'party');
    const bot2Offer = db.creatures.find(c => c.ownerId === 'bot-05' && c.where === 'party');
    if (bot1Offer) db.trades.push({ id: nextId('trade'), player1: 'bot-02', player2: null, offer1: { creatures: [bot1Offer.id], items: [] }, offer2: null, wants: { creatures: [], items: [] }, status: 'proposed', createdDate: nowISO(), finishedDate: '' });
    if (bot2Offer) db.trades.push({ id: nextId('trade'), player1: 'bot-05', player2: null, offer1: { creatures: [bot2Offer.id], items: [] }, offer2: null, wants: { creatures: [], items: [] }, status: 'proposed', createdDate: nowISO(), finishedDate: '' });
    seedEvents();
  }
  function seedEvents() {
    const t = Date.now();
    const day = 86400000;
    // Megalodon Week always covers "now" so one event is always running.
    db.liveEvents = [
      { id: 'event-megalodon', name: 'Megalodon Week', description: 'Catch a Fish creature during the event.', starts: new Date(t - 2 * day).toISOString(), ends: new Date(t + 5 * day).toISOString(), reward: '1,000 cash + 2 nets', flag: 'event_megalodon', rewardCash: 1000, rewardItems: { net: 2 } },
      { id: 'event-doublexp', name: 'Double XP Weekend', description: 'Saturday–Sunday bonus weekend. Take part and claim the reward.', starts: nextSaturday(t).toISOString(), ends: new Date(nextSaturday(t).getTime() + 2 * day - 1000).toISOString(), reward: '2,000 cash', flag: 'event_doublexp', rewardCash: 2000, rewardItems: {} },
      { id: 'event-ancient', name: 'Ancient Hunt', description: 'Catch any ancient creature during the event.', starts: new Date(t + 1 * day).toISOString(), ends: new Date(t + 8 * day).toISOString(), reward: '3,000 cash + 1 Chemical X', flag: 'event_ancient', rewardCash: 3000, rewardItems: { chemicalX: 1 } },
    ];
  }
  function nextSaturday(t) {
    const d = new Date(t); d.setHours(0, 0, 0, 0);
    let add = (6 - d.getDay() + 7) % 7;
    if (add === 0 && d.getTime() < t) add = 7;
    d.setDate(d.getDate() + add);
    return d;
  }

  /* ---------- init / reset ---------- */
  function ensureInit() {
    if (inited) return;
    inited = true;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { db = JSON.parse(raw); if (!db || !Array.isArray(db.accounts)) throw new Error('bad db'); }
    } catch (e) { db = null; }
    if (!db) { db = emptyDb(); seedBots(); persist(); }
    if (!db.liveEvents || !db.liveEvents.length) { seedEvents(); persist(); }
    if (!db.eventClaims) db.eventClaims = [];
    if (!db.saves) db.saves = [];
  }

  /* ---------- achievements ---------- */
  const ACHIEVEMENTS = ['First Catch', 'First Tournament', 'Rookie Champion', 'Forest Champion', 'Reef Champion', 'Ancient Champion', 'First Mutant', 'First Mega', 'First Ancient', 'Mystery Hunter', '10 Catches', '50 Catches', 'Level 50', 'Level 100', 'Rich', 'Guild Founder', 'First Trade', 'First PvP Win'];
  function hasAchievement(playerId, name) { return db.achievements.some(a => a.playerId === playerId && a.achievement === name); }
  function earnInternal(playerId, name) {
    if (hasAchievement(playerId, name)) return null;
    const row = { playerId: playerId, achievement: name, earnedDate: nowISO() };
    db.achievements.push(row);
    return row;
  }

  /* ---------- PvP helpers ---------- */
  function battleCreatureSnapshot(ownerId) {
    // Live player: lead healthy party creature. Bot: first stored party creature.
    if (live() && ownerId === api.currentPlayerId) {
      const g = live();
      const lead = (g.party || []).find(c => c.hp > 0) || (g.party || [])[0];
      if (!lead) return null;
      return clone(lead);
    }
    const row = db.creatures.find(c => c.ownerId === ownerId && c.where === 'party');
    if (!row) return null;
    return makeLiveCreature(row.dex, row.level, { instinct: row.variant === 'Instinct', mutant: row.variant === 'Mutant' });
  }
  function moveDefFor(moveId, dex) {
    try { if (typeof moveDef === 'function') return moveDef(moveId, dex); } catch (e) {}
    try { if (typeof MOVES !== 'undefined' && MOVES[moveId]) return MOVES[moveId]; } catch (e) {}
    return { id: moveId, name: moveId, type: 'Mammal', kind: 'category', power: 40 };
  }
  function damageFor(atkC, defC, move) {
    try {
      if (typeof calcDamage === 'function') return calcDamage(atkC, defC, move);
    } catch (e) {}
    const power = move.power || 40;
    const dmg = Math.max(1, Math.floor(power * (atkC.stats ? atkC.stats.atk : 40) / Math.max(1, defC.stats ? defC.stats.def : 40) / 2));
    return { dmg: dmg, eff: 1, crit: false };
  }
  function botPickMove(botC, playerC) {
    try { if (typeof pickEnemyMove === 'function') return pickEnemyMove(botC, playerC); } catch (e) {}
    const opts = (botC.moves || []).map(m => moveDefFor(m, botC.dex)).filter(m => m.power);
    return opts[0] || moveDefFor((botC.moves || [])[0] || 'sig', botC.dex);
  }
  function resolveRound(battle, playerMoveId) {
    // One full round: player move + bot/opponent response, speed order.
    const p = battle.p1Creature, o = battle.p2Creature;
    const pMove = moveDefFor(playerMoveId, p.dex);
    const oMove = botPickMove(o, p);
    const pSpd = (p.stats ? p.stats.spd : 30), oSpd = (o.stats ? o.stats.spd : 30);
    const order = pSpd >= oSpd ? [{ c: p, foe: o, move: pMove, who: 'p1' }, { c: o, foe: p, move: oMove, who: 'p2' }] : [{ c: o, foe: p, move: oMove, who: 'p2' }, { c: p, foe: o, move: pMove, who: 'p1' }];
    const lines = [];
    for (const step of order) {
      if (step.foe.hp <= 0 || step.c.hp <= 0) continue;
      if (!step.move.power) { lines.push(step.c.name + ' used ' + step.move.name + '.'); continue; }
      const r = damageFor(step.c, step.foe, step.move);
      step.foe.hp = Math.max(0, step.foe.hp - r.dmg);
      lines.push(step.c.name + ' used ' + step.move.name + ' — ' + r.dmg + ' damage!' + (r.crit ? ' Critical!' : '') + (r.eff >= 2 ? " It's super effective!" : r.eff <= 0.5 ? " It's not very effective..." : ''));
    }
    battle.turns.push({ playerId: battle.player1, moveId: playerMoveId, text: lines.join(' '), p1Hp: p.hp, p2Hp: o.hp });
    battle.whoseTurn = battle.player1;
    if (p.hp <= 0 || o.hp <= 0) finishBattleInternal(battle);
    persist();
    return { ok: true, battle: publicBattle(battle), lines: lines };
  }
  function finishBattleInternal(battle) {
    if (battle.status === 'finished') return battle;
    const winner = battle.p1Creature.hp <= 0 ? battle.player2 : battle.p2Creature.hp <= 0 ? battle.player1 : (battle.p1Creature.hp >= battle.p2Creature.hp ? battle.player1 : battle.player2);
    battle.winner = winner; battle.status = 'finished'; battle.finishedDate = nowISO();
    const wAcc = findAccount(winner);
    if (wAcc) { wAcc.wins = (wAcc.wins || 0) + 1; wAcc.cash = (wAcc.cash || 0) + 500; }
    // Winner gets 500 cash; if the winner is the live player, pay the live game.
    if (winner === api.currentPlayerId && live()) live().cash += 500;
    // Sync the live lead creature's HP to the battle result.
    if (live() && (battle.player1 === api.currentPlayerId || battle.player2 === api.currentPlayerId)) {
      const g = live();
      const lead = (g.party || [])[0];
      if (lead) {
        const hp = battle.player1 === api.currentPlayerId ? battle.p1Creature.hp : battle.p2Creature.hp;
        lead.hp = Math.max(0, Math.min(lead.maxHp, hp));
      }
    }
    const prof = db.profiles.find(p => p.playerId === winner);
    if (prof) prof.publicStats.wins = (prof.publicStats.wins || 0) + 1;
    persist();
    return battle;
  }
  function publicBattle(b) {
    return { id: b.id, player1: b.player1, player2: b.player2, type: b.type, turns: clone(b.turns), whoseTurn: b.whoseTurn, winner: b.winner, status: b.status, startedDate: b.startedDate, finishedDate: b.finishedDate || '', p1Hp: b.p1Creature ? b.p1Creature.hp : 0, p2Hp: b.p2Creature ? b.p2Creature.hp : 0, p1Name: b.p1Creature ? b.p1Creature.name : '', p2Name: b.p2Creature ? b.p2Creature.name : '', p1Dex: b.p1Creature ? b.p1Creature.dex : '', p2Dex: b.p2Creature ? b.p2Creature.dex : '' };
  }
  function publicTrade(t) {
    return { id: t.id, player1: t.player1, player2: t.player2, offer1: clone(t.offer1 || { creatures: [], items: [] }), offer2: clone(t.offer2 || null), status: t.status, createdDate: t.createdDate, finishedDate: t.finishedDate || '', declineReason: t.declineReason || '' };
  }

  /* ---------- trade execution ---------- */
  function moveCreatureBetween(fromId, toId, creatureId, toWhere) {
    const row = db.creatures.find(c => c.id === creatureId);
    if (!row) return false;
    // Live side: if the creature is in the live game, move the live object too.
    if (fromId === api.currentPlayerId) {
      const liveC = removeLiveCreature(creatureId);
      if (liveC) {
        if (toId === api.currentPlayerId) { addLiveCreature(liveC); }
        // else it leaves the live game entirely (to a bot / another player)
      }
    }
    if (toId === api.currentPlayerId) {
      const liveC = liveCreatureByUid(creatureId);
      if (!liveC) {
        // Rebuild a live creature from the row and put it in party/storage.
        const c = makeLiveCreature(row.dex, row.level, { instinct: row.variant === 'Instinct', mutant: row.variant === 'Mutant' });
        c.uid = row.id; c.moves = (row.moves || []).slice(); c.xp = row.xp || 0;
        addLiveCreature(c);
      }
    }
    row.ownerId = toId; row.where = toWhere || 'party';
    return true;
  }
  function moveItemsBetween(fromId, toId, items) {
    for (const it of (items || [])) {
      const qty = it.qty || 1;
      if (fromId === api.currentPlayerId) liveRemoveItem(it.id, qty);
      else { const r = db.items.find(x => x.ownerId === fromId && x.itemId === it.id); if (r) { r.qty -= qty; if (r.qty <= 0) db.items.splice(db.items.indexOf(r), 1); } }
      if (toId === api.currentPlayerId) liveAddItem(it.id, qty);
      else { const r = db.items.find(x => x.ownerId === toId && x.itemId === it.id); if (r) r.qty += qty; else db.items.push({ ownerId: toId, itemId: it.id, qty: qty, category: 'Misc' }); }
    }
  }

  /* ---------- the public API ---------- */
  const api = {
    currentPlayerId: null,
    ACHIEVEMENTS: ACHIEVEMENTS,
    BOT_NAMES: BOT_NAMES,

    init: function () { ensureInit(); return { ok: true, accounts: db.accounts.length }; },
    reset: function () {
      db = emptyDb(); seedBots(); api.currentPlayerId = null; inited = true; persist();
      return { ok: true, accounts: db.accounts.length };
    },
    _db: function () { ensureInit(); return db; },

    /* ----- accounts ----- */
    createAccount: function (username, password, email) {
      ensureInit();
      username = esc(username).trim(); email = esc(email).trim();
      if (!username) return { ok: false, error: 'username is required' };
      if (!password || String(password).length < 3) return { ok: false, error: 'password needs at least 3 characters' };
      if (!email || email.indexOf('@') < 0) return { ok: false, error: 'a valid email is required' };
      if (findAccountByName(username)) return { ok: false, error: 'that username is taken' };
      if (db.accounts.length + 0 >= PLAYER_CAP) return { ok: false, error: 'player cap reached (1,000 active players)' };
      const id = nextId('player');
      db.accounts.push({ id: id, username: username, password: scramble(password), email: email, createdDate: nowISO(), lastActive: nowISO(), playerLevel: 1, cash: 100, choicePath: '', rokPrime: false, homeBase: '', creaturesCaught: 0, tournamentWins: 0, wins: 0, isBot: false });
      db.profiles.push({ playerId: id, displayName: username, title: 'Rookie', badges: [], guild: '', friendsCount: 0, publicStats: { wins: 0, tournamentsWon: 0, creaturesCaught: 0 } });
      db.dailyRewards.push({ playerId: id, lastClaimDate: '', streak: 0 });
      persist();
      return { ok: true, playerId: id };
    },
    signIn: function (username, password) {
      ensureInit();
      const a = findAccountByName(username);
      if (!a) return { ok: false, error: 'no account with that username' };
      if (a.password !== scramble(password)) return { ok: false, error: 'wrong password' };
      api.currentPlayerId = a.id;
      syncAccountStats(a.id);
      syncLivePartyToRows(a.id);
      persist();
      return { ok: true, playerId: a.id, profile: clone(db.profiles.find(p => p.playerId === a.id) || null) };
    },
    signOut: function () { api.currentPlayerId = null; return { ok: true }; },
    getProfile: function (playerId) {
      ensureInit();
      const p = db.profiles.find(x => x.playerId === playerId);
      if (!p) return { ok: false, error: 'no account' };
      const a = findAccount(playerId);
      const out = clone(p);
      out.username = a ? a.username : '';
      out.playerLevel = a ? a.playerLevel : 1;
      out.cash = a ? a.cash : 0;
      if (a) out.publicStats = { wins: a.wins || 0, tournamentsWon: a.tournamentWins || 0, creaturesCaught: a.creaturesCaught || 0 };
      return { ok: true, profile: out };
    },
    updateProfile: function (playerId, patch) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const p = db.profiles.find(x => x.playerId === playerId);
      if (!p) return { ok: false, error: 'no account' };
      if (patch.displayName != null) p.displayName = esc(patch.displayName).slice(0, 24) || p.displayName;
      if (patch.title != null) p.title = esc(patch.title).slice(0, 40);
      if (Array.isArray(patch.badges)) p.badges = patch.badges.map(esc).slice(0, 6);
      persist();
      return { ok: true, profile: clone(p) };
    },

    /* ----- cloud saves ----- */
    saveGame: function (playerId, gameData) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      if (!gameData || typeof gameData !== 'object') return { ok: false, error: 'nothing to save' };
      const row = db.saves.find(s => s.playerId === playerId);
      if (row) { row.data = clone(gameData); row.updated = nowISO(); }
      else db.saves.push({ playerId: playerId, data: clone(gameData), updated: nowISO() });
      const a = findAccount(playerId); if (a) a.lastActive = nowISO();
      persist();
      return { ok: true, saved: true };
    },
    loadGame: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const row = db.saves.find(s => s.playerId === playerId);
      if (!row) return { ok: false, error: 'no cloud save yet' };
      return { ok: true, data: clone(row.data) };
    },

    /* ----- creatures ----- */
    saveCreature: function (playerId, creature) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      if (!creature || !creature.dex) return { ok: false, error: 'no creature given' };
      const liveC = creature.uid ? liveCreatureByUid(creature.uid) : null;
      const row = ensureCreatureRow(liveC || creature, playerId, creature.where || 'party');
      if (creature.uid && !liveC) row.id = creature.uid;
      persist();
      return { ok: true, creatureId: row.id };
    },
    updateCreature: function (creatureId, fields) {
      ensureInit();
      const row = db.creatures.find(c => c.id === creatureId);
      if (!row) return { ok: false, error: 'no such creature' };
      if (fields.level != null) row.level = fields.level;
      if (fields.xp != null) row.xp = fields.xp;
      if (fields.moves) row.moves = fields.moves.slice();
      if (fields.heldItem != null) row.heldItem = fields.heldItem;
      if (fields.where) row.where = fields.where;
      const liveC = liveCreatureByUid(creatureId);
      if (liveC) {
        if (fields.level != null) liveC.level = fields.level;
        if (fields.moves) liveC.moves = fields.moves.slice();
      }
      persist();
      return { ok: true, saved: true };
    },
    moveCreature: function (creatureId, where) {
      ensureInit();
      const row = db.creatures.find(c => c.id === creatureId);
      if (!row) return { ok: false, error: 'no such creature' };
      if (['party', 'storage', 'task', 'trade', 'marketplace'].indexOf(where) < 0) return { ok: false, error: 'unknown place: ' + where };
      const g = live();
      if (g && row.ownerId === api.currentPlayerId) {
        if (where === 'party') {
          if (g.party.length >= 6 && !g.party.some(c => c.uid === creatureId)) return { ok: false, error: 'party is full' };
          const c = removeLiveCreature(creatureId); if (c) g.party.push(c);
        } else if (where === 'storage') {
          const c = removeLiveCreature(creatureId); if (c) g.storage.push(c);
        } else {
          // task / trade / marketplace: out of party and storage, held by the backend row
          removeLiveCreature(creatureId);
        }
      }
      row.where = where;
      persist();
      return { ok: true, saved: true };
    },
    evolveCreature: function (creatureId, newDex) {
      ensureInit();
      const row = db.creatures.find(c => c.id === creatureId);
      if (!row) return { ok: false, error: 'no such creature' };
      if (typeof DEX !== 'undefined' && !DEX[newDex]) return { ok: false, error: 'no such creature form: ' + newDex };
      row.dex = newDex;
      const liveC = liveCreatureByUid(creatureId);
      if (liveC) {
        try { if (typeof evolveCreature === 'function' && liveC.dex !== newDex) { /* engine evolveCreature(c, intoDex) */ evolveCreature(liveC, newDex); } else { liveC.dex = newDex; } } catch (e) { liveC.dex = newDex; }
        // keep the backend row in step with the live creature
        row.level = liveC.level; row.moves = (liveC.moves || []).slice();
      }
      persist();
      return { ok: true, newDex: newDex };
    },

    /* ----- chat & mailbox ----- */
    sendChat: function (playerId, text) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      text = esc(text).trim().slice(0, 280);
      if (!text) return { ok: false, error: 'empty message' };
      const m = { id: nextId('msg'), senderId: playerId, text: text, sentDate: nowISO() };
      db.messages.push(m);
      if (db.messages.length > 500) db.messages.splice(0, db.messages.length - 500);
      persist();
      return { ok: true, message: clone(m) };
    },
    readChat: function (n) {
      ensureInit();
      const count = Math.max(1, Math.min(100, n || 30));
      return { ok: true, messages: clone(db.messages.slice(-count)) };
    },
    botChatter: function () {
      ensureInit();
      if (Math.random() >= 0.5) return { ok: true, posted: false };
      const bot = 'bot-' + String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
      const line = BOT_CHAT[Math.floor(Math.random() * BOT_CHAT.length)];
      const m = { id: nextId('msg'), senderId: bot, text: line, sentDate: nowISO() };
      db.messages.push(m);
      if (db.messages.length > 500) db.messages.splice(0, db.messages.length - 500);
      persist();
      return { ok: true, posted: true, message: clone(m) };
    },
    sendMail: function (senderId, receiverId, text, gift) {
      ensureInit();
      const chk = needPlayer(senderId); if (!chk.ok) return chk;
      if (!findAccount(receiverId)) return { ok: false, error: 'no such receiver' };
      // A gift leaves the sender now (it is held by the mailbox until claimed).
      if (gift) {
        if (gift.kind === 'creature') {
          const row = db.creatures.find(c => c.id === gift.creatureId && c.ownerId === senderId);
          if (!row) return { ok: false, error: 'you do not own that creature' };
          if (senderId === api.currentPlayerId) removeLiveCreature(gift.creatureId);
          row.where = 'mailbox';
        } else if (gift.kind === 'item') {
          if (senderId === api.currentPlayerId) {
            if (!liveHasItem(gift.itemId, gift.qty || 1)) return { ok: false, error: 'you do not have that item' };
            liveRemoveItem(gift.itemId, gift.qty || 1);
          }
        }
      }
      const m = { id: nextId('mail'), senderId: senderId, receiverId: receiverId, text: esc(text).slice(0, 500), gift: gift ? clone(gift) : null, read: false, claimed: false, sentDate: nowISO() };
      db.mailbox.push(m);
      persist();
      return { ok: true, message: clone(m) };
    },
    readMailbox: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const rows = db.mailbox.filter(m => m.receiverId === playerId).slice().sort((a, b) => (a.read === b.read ? (b.sentDate < a.sentDate ? -1 : 1) : (a.read ? 1 : -1)));
      return { ok: true, messages: clone(rows) };
    },
    _markRead: function (messageId) {
      ensureInit();
      const m = db.mailbox.find(x => x.id === messageId);
      if (m) { m.read = true; persist(); }
      return { ok: !!m };
    },

    /* ----- PvP ----- */
    challengePlayer: function (challengerId, opponentId) {
      ensureInit();
      const chk = needPlayer(challengerId); if (!chk.ok) return chk;
      if (!findAccount(opponentId)) return { ok: false, error: 'no such opponent' };
      if (challengerId === opponentId) return { ok: false, error: 'you cannot challenge yourself' };
      const p1 = battleCreatureSnapshot(challengerId);
      const p2 = battleCreatureSnapshot(opponentId);
      if (!p1) return { ok: false, error: 'you have no healthy creature to fight with' };
      if (!p2) return { ok: false, error: 'opponent has no creature to fight with' };
      const b = { id: nextId('battle'), player1: challengerId, player2: opponentId, type: 'pvp', turns: [], whoseTurn: challengerId, winner: null, status: 'waiting', startedDate: nowISO(), finishedDate: '', p1Creature: p1, p2Creature: p2 };
      db.battles.push(b);
      persist();
      return { ok: true, battleId: b.id, battle: publicBattle(b) };
    },
    acceptChallenge: function (battleId) {
      ensureInit();
      const b = db.battles.find(x => x.id === battleId);
      if (!b) return { ok: false, error: 'no such battle' };
      if (b.status !== 'waiting') return { ok: false, error: 'battle is already ' + b.status };
      // Bots auto-accept: a bot challenge starts at once.
      b.status = 'in progress'; b.whoseTurn = b.player1;
      persist();
      return { ok: true, battle: publicBattle(b) };
    },
    declineChallenge: function (battleId) {
      ensureInit();
      const b = db.battles.find(x => x.id === battleId);
      if (!b) return { ok: false, error: 'no such battle' };
      if (b.status === 'finished') return { ok: false, error: 'battle is already finished' };
      b.status = 'finished'; b.winner = null; b.finishedDate = nowISO(); b.declined = true;
      persist();
      return { ok: true, battle: publicBattle(b) };
    },
    submitTurn: function (battleId, playerId, moveId) {
      ensureInit();
      const b = db.battles.find(x => x.id === battleId);
      if (!b) return { ok: false, error: 'no such battle' };
      if (b.status !== 'in progress') return { ok: false, error: 'battle is ' + b.status };
      if (b.whoseTurn !== playerId) return { ok: false, error: 'it is not your turn' };
      const me = playerId === b.player1 ? b.p1Creature : b.p2Creature;
      if (!me || !me.moves || me.moves.indexOf(moveId) < 0) return { ok: false, error: 'your creature does not know that move' };
      // Resolve a full round: the submitter moves, the opponent answers.
      if (playerId === b.player1) return resolveRound(b, moveId);
      // Opponent submitted (only bots submit as player2 in practice): mirror the round.
      const save = b.p1Creature; b.p1Creature = b.p2Creature; b.p2Creature = save;
      const r = resolveRound(b, moveId);
      const s2 = b.p1Creature; b.p1Creature = b.p2Creature; b.p2Creature = s2;
      return r;
    },
    getBattleState: function (battleId) {
      ensureInit();
      const b = db.battles.find(x => x.id === battleId);
      if (!b) return { ok: false, error: 'no such battle' };
      return { ok: true, battle: publicBattle(b) };
    },
    finishBattle: function (battleId) {
      ensureInit();
      const b = db.battles.find(x => x.id === battleId);
      if (!b) return { ok: false, error: 'no such battle' };
      if (b.status === 'finished') return { ok: true, battle: publicBattle(b) };
      finishBattleInternal(b);
      return { ok: true, battle: publicBattle(b) };
    },

    /* ----- trading ----- */
    proposeTrade: function (p1, p2, offer1) {
      ensureInit();
      const chk = needPlayer(p1); if (!chk.ok) return chk;
      if (p2 && !findAccount(p2)) return { ok: false, error: 'no such player' };
      offer1 = offer1 || { creatures: [], items: [] };
      // Proposing moves nothing — validate ownership only.
      for (const cid of (offer1.creatures || [])) {
        const row = db.creatures.find(c => c.id === cid);
        if (!row || row.ownerId !== p1) return { ok: false, error: 'you do not own that creature' };
        if (row.where === 'marketplace' || row.where === 'trade') return { ok: false, error: 'that creature is already listed or in a trade' };
      }
      for (const it of (offer1.items || [])) {
        if (p1 === api.currentPlayerId && !liveHasItem(it.id, it.qty || 1)) return { ok: false, error: 'you do not have that item' };
      }
      const t = { id: nextId('trade'), player1: p1, player2: p2 || null, offer1: clone(offer1), offer2: null, wants: clone(offer1.wants || { creatures: [], items: [] }), status: 'proposed', createdDate: nowISO(), finishedDate: '' };
      db.trades.push(t);
      persist();
      return { ok: true, tradeId: t.id, trade: publicTrade(t) };
    },
    acceptTrade: function (tradeId, p2, offer2) {
      ensureInit();
      const t = db.trades.find(x => x.id === tradeId);
      if (!t) return { ok: false, error: 'no such trade' };
      if (t.status !== 'proposed') return { ok: false, error: 'trade is already ' + t.status };
      const other = t.player1;
      const accepter = p2;
      if (t.player2 && t.player2 !== accepter) return { ok: false, error: 'this trade was proposed to someone else' };
      offer2 = offer2 || { creatures: [], items: [] };
      // Bot auto-response: the bot accepts only if what it is offered is worth
      // at least what it is asked to give (stars first, then levels).
      if (isBot(other) && accepter === api.currentPlayerId) {
        // The player is accepting a bot's open offer; offer2 is what the player gives.
        const wantValue = offerValue(t.offer1);
        const giveValue = offerValue(offer2);
        if (giveValue < wantValue) {
          t.status = 'declined'; t.finishedDate = nowISO(); t.declineReason = 'the bot wants something of equal value — your offer is worth less than theirs';
          persist();
          return { ok: false, error: t.declineReason };
        }
      }
      if (isBot(accepter)) {
        // The player proposed to a bot; the bot answers now.
        const want = t.wants || { creatures: [], items: [] };
        const wantValue = offerValue({ creatures: want.creatures || [], items: want.items || [] });
        const giveValue = offerValue(t.offer1);
        if (giveValue < wantValue) {
          t.status = 'declined'; t.finishedDate = nowISO(); t.declineReason = 'the bot declined — your offer is worth less than what you asked for';
          persist();
          return { ok: false, error: t.declineReason };
        }
        // Bot's side of the deal is what the player asked for.
        offer2 = { creatures: (want.creatures || []).slice(), items: (want.items || []).slice() };
      }
      // Validate the accepter actually owns what they offer.
      for (const cid of (offer2.creatures || [])) {
        const row = db.creatures.find(c => c.id === cid);
        if (!row || row.ownerId !== accepter) return { ok: false, error: 'the other side does not own that creature' };
        if (row.where === 'marketplace' || row.where === 'trade') return { ok: false, error: 'that creature is already listed or in a trade' };
      }
      // Both sides accepted: move everything now.
      t.offer2 = clone(offer2); t.player2 = accepter;
      for (const cid of (t.offer1.creatures || [])) moveCreatureBetween(other, accepter, cid, 'party');
      for (const cid of (offer2.creatures || [])) moveCreatureBetween(accepter, other, cid, 'party');
      moveItemsBetween(other, accepter, t.offer1.items || []);
      moveItemsBetween(accepter, other, offer2.items || []);
      t.status = 'accepted'; t.finishedDate = nowISO();
      syncAccountStats(api.currentPlayerId);
      persist();
      return { ok: true, trade: publicTrade(t) };
    },
    declineTrade: function (tradeId) {
      ensureInit();
      const t = db.trades.find(x => x.id === tradeId);
      if (!t) return { ok: false, error: 'no such trade' };
      if (t.status !== 'proposed') return { ok: false, error: 'trade is already ' + t.status };
      t.status = 'declined'; t.finishedDate = nowISO(); // nothing moves
      persist();
      return { ok: true, trade: publicTrade(t) };
    },
    cancelTrade: function (tradeId) {
      ensureInit();
      const t = db.trades.find(x => x.id === tradeId);
      if (!t) return { ok: false, error: 'no such trade' };
      if (t.status !== 'proposed') return { ok: false, error: 'trade is already ' + t.status };
      t.status = 'cancelled'; t.finishedDate = nowISO(); // nothing moves
      persist();
      return { ok: true, trade: publicTrade(t) };
    },

    /* ----- marketplace ----- */
    listItem: function (sellerId, what, price) {
      ensureInit();
      const chk = needPlayer(sellerId); if (!chk.ok) return chk;
      if (!what || !what.kind) return { ok: false, error: 'say what you are listing' };
      if (!Number.isFinite(price) || price < 1 || price > MAX_TRADE) return { ok: false, error: 'price must be 1–1,000,000 cash' };
      if (what.kind === 'creature') {
        const row = db.creatures.find(c => c.id === what.creatureId);
        if (!row || row.ownerId !== sellerId) return { ok: false, error: 'you do not own that creature' };
        if (row.where === 'marketplace' || row.where === 'trade') return { ok: false, error: 'that creature is already listed or in a trade' };
        const pc = checkCreaturePrice(row.dex, price);
        if (!pc.ok) return pc;
        // The creature leaves the live game while listed (one place at a time).
        if (sellerId === api.currentPlayerId) removeLiveCreature(what.creatureId);
        row.where = 'marketplace';
        const l = { id: nextId('listing'), sellerId: sellerId, what: { kind: 'creature', creatureId: what.creatureId }, price: price, status: 'for sale', listedDate: nowISO(), buyerId: null };
        db.marketplace.push(l);
        persist();
        return { ok: true, listingId: l.id, listing: clone(l) };
      }
      if (what.kind === 'item') {
        const qty = what.qty || 1;
        if (sellerId === api.currentPlayerId) {
          if (!liveHasItem(what.itemId, qty)) return { ok: false, error: 'you do not have that item' };
          liveRemoveItem(what.itemId, qty);
        }
        const l = { id: nextId('listing'), sellerId: sellerId, what: { kind: 'item', itemId: what.itemId, qty: qty }, price: price, status: 'for sale', listedDate: nowISO(), buyerId: null };
        db.marketplace.push(l);
        persist();
        return { ok: true, listingId: l.id, listing: clone(l) };
      }
      return { ok: false, error: 'unknown listing kind' };
    },
    browseListings: function (filter) {
      ensureInit();
      filter = filter || {};
      let rows = db.marketplace.filter(l => l.status === 'for sale');
      if (filter.kind) rows = rows.filter(l => l.what.kind === filter.kind);
      if (filter.maxPrice != null) rows = rows.filter(l => l.price <= filter.maxPrice);
      if (filter.minPrice != null) rows = rows.filter(l => l.price >= filter.minPrice);
      if (filter.search) {
        const s = String(filter.search).toLowerCase();
        rows = rows.filter(l => {
          if (l.what.kind === 'creature') { const c = db.creatures.find(x => x.id === l.what.creatureId); return c && (c.dex.indexOf(s) >= 0 || (typeof DEX !== 'undefined' && DEX[c.dex] && DEX[c.dex].name.toLowerCase().indexOf(s) >= 0)); }
          return l.what.itemId.toLowerCase().indexOf(s) >= 0;
        });
      }
      return { ok: true, listings: clone(rows) };
    },
    buyListing: function (buyerId, listingId) {
      ensureInit();
      const chk = needPlayer(buyerId); if (!chk.ok) return chk;
      const l = db.marketplace.find(x => x.id === listingId);
      if (!l) return { ok: false, error: 'no such listing' };
      if (l.status !== 'for sale') return { ok: false, error: 'listing is ' + l.status };
      if (l.sellerId === buyerId) return { ok: false, error: 'you cannot buy your own listing' };
      const g = live();
      if (buyerId === api.currentPlayerId) {
        if (!g || g.cash < l.price) return { ok: false, error: 'not enough cash' };
        g.cash -= l.price;
      } else {
        const ba = findAccount(buyerId);
        if (!ba || (ba.cash || 0) < l.price) return { ok: false, error: 'not enough cash' };
        ba.cash -= l.price;
      }
      const seller = findAccount(l.sellerId);
      if (seller) seller.cash = (seller.cash || 0) + l.price;
      if (l.sellerId === api.currentPlayerId && g) g.cash += l.price;
      if (l.what.kind === 'creature') {
        const row = db.creatures.find(c => c.id === l.what.creatureId);
        if (!row) return { ok: false, error: 'listed creature is gone' };
        if (buyerId === api.currentPlayerId) {
          const c = makeLiveCreature(row.dex, row.level, { instinct: row.variant === 'Instinct', mutant: row.variant === 'Mutant' });
          c.uid = row.id; c.moves = (row.moves || []).slice(); c.xp = row.xp || 0;
          addLiveCreature(c);
          row.where = 'party';
        }
        row.ownerId = buyerId;
      } else {
        if (buyerId === api.currentPlayerId) liveAddItem(l.what.itemId, l.what.qty || 1);
        else { const r = db.items.find(x => x.ownerId === buyerId && x.itemId === l.what.itemId); if (r) r.qty += (l.what.qty || 1); else db.items.push({ ownerId: buyerId, itemId: l.what.itemId, qty: l.what.qty || 1, category: 'Misc' }); }
      }
      l.status = 'sold'; l.buyerId = buyerId;
      syncAccountStats(buyerId);
      persist();
      return { ok: true, listing: clone(l) };
    },
    cancelListing: function (sellerId, listingId) {
      ensureInit();
      const l = db.marketplace.find(x => x.id === listingId);
      if (!l) return { ok: false, error: 'no such listing' };
      if (l.sellerId !== sellerId) return { ok: false, error: 'only the seller can cancel' };
      if (l.status !== 'for sale') return { ok: false, error: 'listing is ' + l.status };
      l.status = 'cancelled';
      if (l.what.kind === 'creature') {
        const row = db.creatures.find(c => c.id === l.what.creatureId);
        if (row) {
          row.where = 'storage';
          if (sellerId === api.currentPlayerId) {
            const c = makeLiveCreature(row.dex, row.level, { instinct: row.variant === 'Instinct', mutant: row.variant === 'Mutant' });
            c.uid = row.id; c.moves = (row.moves || []).slice(); c.xp = row.xp || 0;
            const g = live(); if (g) g.storage.push(c);
          }
        }
      } else if (sellerId === api.currentPlayerId) {
        liveAddItem(l.what.itemId, l.what.qty || 1);
      }
      persist();
      return { ok: true, listing: clone(l) };
    },

    /* ----- friends ----- */
    addFriend: function (playerId, username) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const other = findAccountByName(username);
      if (!other) return { ok: false, error: 'no player named ' + username };
      if (other.id === playerId) return { ok: false, error: 'you cannot friend yourself' };
      const ex = db.friends.find(f => (f.player1 === playerId && f.player2 === other.id) || (f.player1 === other.id && f.player2 === playerId));
      if (ex) return { ok: false, error: ex.status === 'accepted' ? 'already friends' : 'request already pending' };
      db.friends.push({ player1: playerId, player2: other.id, status: 'requested', since: nowISO() });
      persist();
      return { ok: true, friendId: other.id };
    },
    acceptFriend: function (playerId, requesterId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const f = db.friends.find(x => x.player1 === requesterId && x.player2 === playerId && x.status === 'requested');
      if (!f) return { ok: false, error: 'no pending request from that player' };
      f.status = 'accepted'; f.since = nowISO();
      persist();
      return { ok: true };
    },
    removeFriend: function (playerId, friendId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const i = db.friends.findIndex(f => (f.player1 === playerId && f.player2 === friendId) || (f.player1 === friendId && f.player2 === playerId));
      if (i < 0) return { ok: false, error: 'not friends' };
      db.friends.splice(i, 1);
      persist();
      return { ok: true };
    },
    listFriends: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const rows = db.friends.filter(f => f.player1 === playerId || f.player2 === playerId);
      const out = rows.map(f => {
        const otherId = f.player1 === playerId ? f.player2 : f.player1;
        const a = findAccount(otherId);
        const online = isBot(otherId) ? ((dayOfYear() + botIndex(otherId)) % 3 !== 2) : false;
        return { playerId: otherId, username: a ? a.username : '?', status: f.status, direction: f.player1 === playerId ? 'outgoing' : 'incoming', since: f.since, online: online };
      });
      return { ok: true, friends: out };
    },

    /* ----- gifting ----- */
    sendGift: function (senderId, receiverId, gift) {
      ensureInit();
      return api.sendMail(senderId, receiverId, 'A gift for you!', gift);
    },
    claimGift: function (playerId, messageId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const m = db.mailbox.find(x => x.id === messageId && x.receiverId === playerId);
      if (!m) return { ok: false, error: 'no such message' };
      if (!m.gift) return { ok: false, error: 'no gift attached' };
      if (m.claimed) return { ok: false, error: 'gift already claimed' };
      const gift = m.gift;
      if (gift.kind === 'creature') {
        const row = db.creatures.find(c => c.id === gift.creatureId);
        if (!row) return { ok: false, error: 'gift creature is gone' };
        if (playerId === api.currentPlayerId) {
          const c = makeLiveCreature(row.dex, row.level, { instinct: row.variant === 'Instinct', mutant: row.variant === 'Mutant' });
          c.uid = row.id; c.moves = (row.moves || []).slice(); c.xp = row.xp || 0;
          addLiveCreature(c);
          row.where = 'party';
        }
        row.ownerId = playerId;
      } else {
        if (playerId === api.currentPlayerId) liveAddItem(gift.itemId, gift.qty || 1);
      }
      m.claimed = true; m.read = true;
      persist();
      return { ok: true, gift: clone(gift) };
    },

    /* ----- guilds ----- */
    createGuild: function (playerId, name) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      name = esc(name).trim().slice(0, 32);
      if (!name) return { ok: false, error: 'guild name is required' };
      if (db.guilds.some(g => g.name.toLowerCase() === name.toLowerCase())) return { ok: false, error: 'a guild with that name already exists' };
      const p = db.profiles.find(x => x.playerId === playerId);
      if (p && p.guild) return { ok: false, error: 'leave your current guild first' };
      const g = { id: nextId('guild'), name: name, leaderId: playerId, members: [playerId], createdDate: nowISO(), board: [{ senderId: playerId, text: name + ' was founded!', sentDate: nowISO() }] };
      db.guilds.push(g);
      if (p) p.guild = g.id;
      persist();
      return { ok: true, guildId: g.id, guild: clone(g) };
    },
    joinGuild: function (playerId, guildId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const g = db.guilds.find(x => x.id === guildId);
      if (!g) return { ok: false, error: 'no such guild' };
      if (g.members.indexOf(playerId) >= 0) return { ok: false, error: 'already a member' };
      const p = db.profiles.find(x => x.playerId === playerId);
      if (p && p.guild && p.guild !== guildId) return { ok: false, error: 'leave your current guild first' };
      g.members.push(playerId);
      if (p) p.guild = guildId;
      persist();
      return { ok: true };
    },
    leaveGuild: function (playerId, guildId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const g = db.guilds.find(x => x.id === guildId);
      if (!g) return { ok: false, error: 'no such guild' };
      const i = g.members.indexOf(playerId);
      if (i < 0) return { ok: false, error: 'not a member' };
      g.members.splice(i, 1);
      const p = db.profiles.find(x => x.playerId === playerId);
      if (p && p.guild === guildId) p.guild = '';
      if (g.leaderId === playerId) {
        if (g.members.length) g.leaderId = g.members[0];
        else { db.guilds.splice(db.guilds.indexOf(g), 1); persist(); return { ok: true, disbanded: true }; }
      }
      persist();
      return { ok: true };
    },
    guildMessages: function (guildId) {
      ensureInit();
      const g = db.guilds.find(x => x.id === guildId);
      if (!g) return { ok: false, error: 'no such guild' };
      return { ok: true, messages: clone(g.board) };
    },
    postGuildMessage: function (playerId, guildId, text) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const g = db.guilds.find(x => x.id === guildId);
      if (!g) return { ok: false, error: 'no such guild' };
      if (g.members.indexOf(playerId) < 0) return { ok: false, error: 'only members can post' };
      text = esc(text).trim().slice(0, 280);
      if (!text) return { ok: false, error: 'empty message' };
      g.board.push({ senderId: playerId, text: text, sentDate: nowISO() });
      persist();
      return { ok: true };
    },

    /* ----- daily rewards ----- */
    claimDailyReward: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      let row = db.dailyRewards.find(x => x.playerId === playerId);
      if (!row) { row = { playerId: playerId, lastClaimDate: '', streak: 0 }; db.dailyRewards.push(row); }
      const today = todayStr();
      if (row.lastClaimDate === today) return { ok: false, error: 'already claimed today' };
      row.streak = row.lastClaimDate === yesterdayStr() ? row.streak + 1 : 1;
      row.lastClaimDate = today;
      const cash = Math.min(1000, 100 * row.streak);
      const items = { bandage: 1 };
      if (row.streak >= 3) items.trap = 1;
      if (row.streak >= 7) items.chemicalX = 1;
      // Paid into the LIVE game state.
      if (playerId === api.currentPlayerId && live()) {
        live().cash += cash;
        for (const k of Object.keys(items)) liveAddItem(k, items[k]);
      } else {
        const a = findAccount(playerId); if (a) a.cash = (a.cash || 0) + cash;
      }
      persist();
      return { ok: true, cash: cash, items: items, streak: row.streak };
    },
    checkStreak: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const row = db.dailyRewards.find(x => x.playerId === playerId);
      if (!row) return { ok: true, streak: 0, lastClaimDate: '' };
      return { ok: true, streak: row.streak, lastClaimDate: row.lastClaimDate };
    },

    /* ----- live events ----- */
    listLiveEvents: function () {
      ensureInit();
      const t = Date.now();
      let running = db.liveEvents.filter(e => new Date(e.starts).getTime() <= t && t <= new Date(e.ends).getTime());
      if (!running.length) { seedEvents(); persist(); running = db.liveEvents.filter(e => new Date(e.starts).getTime() <= t && t <= new Date(e.ends).getTime()); }
      return { ok: true, events: clone(db.liveEvents), running: clone(running) };
    },
    claimEventReward: function (playerId, eventId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const ev = db.liveEvents.find(e => e.id === eventId);
      if (!ev) return { ok: false, error: 'no such event' };
      const t = Date.now();
      if (!(new Date(ev.starts).getTime() <= t && t <= new Date(ev.ends).getTime())) return { ok: false, error: 'that event is not running' };
      if (db.eventClaims.some(c => c.playerId === playerId && c.eventId === eventId)) return { ok: false, error: 'reward already claimed' };
      const g = live();
      if (!g || !g.flags[ev.flag]) return { ok: false, error: 'you have not taken part in this event yet' };
      db.eventClaims.push({ playerId: playerId, eventId: eventId, claimedDate: nowISO() });
      if (playerId === api.currentPlayerId && g) {
        g.cash += ev.rewardCash;
        for (const k of Object.keys(ev.rewardItems || {})) liveAddItem(k, ev.rewardItems[k]);
      }
      persist();
      return { ok: true, cash: ev.rewardCash, items: clone(ev.rewardItems || {}) };
    },

    /* ----- achievements ----- */
    listAchievements: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const earned = {};
      for (const a of db.achievements.filter(x => x.playerId === playerId)) earned[a.achievement] = a.earnedDate;
      return { ok: true, achievements: ACHIEVEMENTS.map(n => ({ name: n, earned: !!earned[n], earnedDate: earned[n] || '' })) };
    },
    earnAchievement: function (playerId, achievement) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      if (ACHIEVEMENTS.indexOf(achievement) < 0) return { ok: false, error: 'no such achievement: ' + achievement };
      if (hasAchievement(playerId, achievement)) return { ok: false, error: 'already earned' };
      const row = earnInternal(playerId, achievement);
      persist();
      return { ok: true, achievement: row };
    },
    checkAchievements: function () {
      ensureInit();
      const playerId = api.currentPlayerId;
      if (!playerId) return { ok: false, error: 'no account' };
      const g = live();
      if (!g) return { ok: false, error: 'no game state' };
      const all = (g.party || []).concat(g.storage || []);
      const caught = g.flags.caughtCount || 0;
      const tourFlags = ['champion', 'forestClashChampion', 'reefRumbleChampion', 'desertHeatChampion', 'bazaarBrawlChampion', 'frostCrownChampion', 'universityGamesChampion', 'wastelandWarChampion', 'rokCityChampionshipChampion', 'ancientCrownChampion'];
      const tourWins = tourFlags.filter(f => g.flags[f]).length;
      const tests = [
        ['First Catch', caught >= 1 || all.length >= 1],
        ['First Tournament', tourWins >= 1],
        ['Rookie Champion', !!g.flags.champion],
        ['Forest Champion', !!g.flags.forestClashChampion],
        ['Reef Champion', !!g.flags.reefRumbleChampion],
        ['Ancient Champion', !!g.flags.ancientCrownChampion],
        ['First Mutant', all.some(c => c.mutant)],
        ['First Mega', all.some(c => c.mega) || !!g.flags.usedMega],
        ['First Ancient', !!g.flags.caughtAncient || all.some(c => typeof DEX !== 'undefined' && !DEX[c.dex])],
        ['Mystery Hunter', (g.flags.mysteriesFound || 0) >= 5],
        ['10 Catches', caught >= 10],
        ['50 Catches', caught >= 50],
        ['Level 50', all.some(c => (c.level || 0) >= 50)],
        ['Level 100', all.some(c => (c.level || 0) >= 100)],
        ['Rich', (g.cash || 0) >= 100000],
        ['Guild Founder', db.guilds.some(x => x.leaderId === playerId)],
        ['First Trade', db.trades.some(t => (t.player1 === playerId || t.player2 === playerId) && t.status === 'accepted')],
        ['First PvP Win', db.battles.some(b => b.winner === playerId)],
      ];
      const newly = [];
      for (const [name, cond] of tests) if (cond) { const r = earnInternal(playerId, name); if (r) newly.push(name); }
      if (newly.length) persist();
      syncAccountStats(playerId);
      persist();
      return { ok: true, newly: newly };
    },

    /* ----- leaderboards & history (computed) ----- */
    getLeaderboard: function (board) {
      ensureInit();
      const rows = db.accounts.map(a => {
        let value = 0;
        if (board === 'wins') value = a.wins || 0;
        else if (board === 'level') value = a.playerLevel || 1;
        else if (board === 'creatures') value = a.creaturesCaught || 0;
        else if (board === 'tournaments') value = a.tournamentWins || 0;
        else return null;
        return { playerId: a.id, username: a.username, value: value, isBot: !!a.isBot };
      }).filter(Boolean);
      // The live player is included once signed in (their account row).
      rows.sort((x, y) => y.value - x.value || x.username.localeCompare(y.username));
      return { ok: true, board: board, entries: rows.slice(0, 10) };
    },
    getBattleHistory: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const rows = db.battles.filter(b => b.player1 === playerId || b.player2 === playerId)
        .slice().sort((a, b) => (b.startedDate < a.startedDate ? -1 : 1));
      return { ok: true, battles: rows.map(publicBattle) };
    },

    /* ----- misc helpers the hub uses ----- */
    listBots: function () {
      ensureInit();
      return { ok: true, bots: clone(db.accounts.filter(a => a.isBot).map(a => ({ id: a.id, username: a.username, playerLevel: a.playerLevel, cash: a.cash, tournamentWins: a.tournamentWins || 0, wins: a.wins || 0, creaturesCaught: a.creaturesCaught || 0 }))) };
    },
    botParty: function (botId) {
      ensureInit();
      const rows = db.creatures.filter(c => c.ownerId === botId && c.where === 'party');
      return { ok: true, creatures: clone(rows) };
    },
    listTrades: function (playerId) {
      ensureInit();
      const chk = needPlayer(playerId); if (!chk.ok) return chk;
      const rows = db.trades.filter(t => t.player1 === playerId || t.player2 === playerId || t.player2 === null);
      return { ok: true, trades: rows.map(publicTrade) };
    },
    listGuilds: function () {
      ensureInit();
      return { ok: true, guilds: clone(db.guilds) };
    },
    usernameOf: function (id) {
      ensureInit();
      if (id === api.currentPlayerId) { const a = findAccount(id); return a ? a.username : 'You'; }
      const a = findAccount(id);
      return a ? a.username : id;
    },
    displayNameOf: function (id) {
      ensureInit();
      const p = db.profiles.find(x => x.playerId === id);
      return p ? p.displayName : api.usernameOf(id);
    },
  };

  return api;
})();
