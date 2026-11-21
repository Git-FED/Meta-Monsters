/* Metamonsters — hub.js (pass 3).
   Upper Deck — Online Hub. One global `const HUB`.
   Every tab is functional against BACKEND; no dead buttons, no "coming soon".
   UI idioms copied from js/ui.js: UI.openPanel for the shell, panel-style
   buttons, UI.dialog for messages, toast() for confirmations.
   Live game state and backend state are moved TOGETHER: every action that
   moves cash, creatures or items goes through the BACKEND method (which
   updates G.party / G.storage / G.bag / G.cash) — the hub never edits one
   side without the other. Works from the title screen onward: no story
   progress is assumed. Plain JS, no modules, no imports, no external URLs. */
'use strict';

const HUB = (function () {
  const TABS = ['Account', 'Chat', 'PvP', 'Trade', 'Market', 'Friends', 'Mail', 'Guilds', 'Daily', 'Events', 'Achievements', 'Leaders', 'History'];
  let tab = 'Account';
  let contentEl = null;
  let chatTimer = null;
  let botFriendSent = false;
  // per-tab picks, kept while the hub is open
  const sel = {
    tradeParty: null, tradeItems: {}, tradeBot: null, tradeWant: null,
    marketListCreature: null, marketListItem: null, marketListQty: 1,
    mailTo: null, mailGift: null, acceptOffer: null, acceptOfferCreature: null,
    guildBoard: null,
  };

  /* ---------- DOM helpers (ui.js idioms) ---------- */
  function el(tag, html) {
    const d = document.createElement(tag || 'div');
    if (html != null) d.innerHTML = html;
    return d;
  }
  function h(parent, html) { parent.insertAdjacentHTML('beforeend', html); }
  function btn(parent, label, fn, disabled) {
    const b = document.createElement('button');
    b.textContent = label; b.disabled = !!disabled;
    b.onclick = function () { try { if (typeof SFX !== 'undefined' && SFX.select) SFX.select(); } catch (e) {} fn(); };
    parent.appendChild(b);
    return b;
  }
  function input(parent, placeholder, type, value) {
    const i = document.createElement('input');
    i.type = type || 'text'; i.placeholder = placeholder || ''; i.value = value || '';
    i.style.cssText = 'display:block;width:100%;margin:4px 0;padding:8px;font-size:15px';
    parent.appendChild(i);
    return i;
  }
  function say(msg) { try { toast(msg); } catch (e) {} }
  function dexName(dex) {
    try { if (typeof DEX !== 'undefined' && DEX[dex]) return DEX[dex].name; } catch (e) {}
    return 'Dex #' + dex;
  }
  function itemName(id) {
    try { if (typeof itemDef === 'function' && itemDef(id)) return itemDef(id).name; } catch (e) {}
    return id;
  }
  function creatureLabel(c) {
    return (c.name || dexName(c.dex)) + ' Lv' + (c.level || 1) + (c.mutant ? ' (Mutant)' : c.instinct ? ' (Instinct)' : '');
  }
  function rowLabel(c) { // backend creature row
    return dexName(c.dex) + ' Lv' + (c.level || 1) + (c.variant && c.variant !== 'Normal' ? ' (' + c.variant + ')' : '');
  }
  function starsOf(dex) {
    try { if (typeof DEX !== 'undefined' && DEX[dex]) return '★'.repeat(DEX[dex].stars || 1); } catch (e) {}
    return '★';
  }
  function signedIn() { return !!(typeof BACKEND !== 'undefined' && BACKEND.currentPlayerId); }
  function me() { return BACKEND.currentPlayerId; }
  function needAccount() {
    if (signedIn()) return true;
    h(contentEl, '<p>Create an account first — the upper deck is for registered trainers.</p>');
    btn(contentEl, '→ Go to Account', function () { renderTab('Account'); });
    return false;
  }
  function stopChatTimer() { if (chatTimer) { clearInterval(chatTimer); chatTimer = null; } }

  /* ---------- shell ---------- */
  function openHub() {
    stopChatTimer();
    tab = 'Account';
    const p = UI.openPanel('<h2>Upper Deck — Online Hub</h2><div class="sub">Accounts, chat, PvP, trade, market, friends, mail, guilds, daily rewards, events, achievements, leaderboards, history — all in one place.</div>');
    const bar = el('div');
    bar.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:8px 0';
    p.appendChild(bar);
    for (const t of TABS) {
      const b = document.createElement('button');
      b.textContent = t; b.style.cssText = 'width:auto;padding:6px 10px;font-size:14px';
      b.onclick = function () { try { if (typeof SFX !== 'undefined' && SFX.select) SFX.select(); } catch (e) {} renderTab(t); };
      bar.appendChild(b);
    }
    contentEl = el('div');
    p.appendChild(contentEl);
    UI.panelButton(p, '← Close Hub', function () { stopChatTimer(); UI.closePanel(); });
    renderTab(tab);
    return p;
  }
  function renderTab(name) {
    stopChatTimer();
    tab = name;
    if (!contentEl) return;
    contentEl.innerHTML = '';
    try {
      ({ Account: tabAccount, Chat: tabChat, PvP: tabPvP, Trade: tabTrade, Market: tabMarket, Friends: tabFriends, Mail: tabMail, Guilds: tabGuilds, Daily: tabDaily, Events: tabEvents, Achievements: tabAchievements, Leaders: tabLeaders, History: tabHistory })[name]();
    } catch (e) {
      h(contentEl, '<p>Something went wrong opening this tab: ' + String(e && e.message || e) + '</p>');
    }
  }

  /* ---------- Account ---------- */
  function tabAccount() {
    h(contentEl, '<h3>Account</h3>');
    if (!signedIn()) {
      h(contentEl, '<p>No account signed in. Create one — it lives on this device (local-first backend).</p>');
      const u = input(contentEl, 'Username');
      const pw = input(contentEl, 'Password', 'password');
      const em = input(contentEl, 'Email');
      btn(contentEl, 'Create Account', function () {
        const r = BACKEND.createAccount(u.value, pw.value, em.value);
        if (!r.ok) { say(r.error); return; }
        const s = BACKEND.signIn(u.value, pw.value);
        say(s.ok ? 'Account created — welcome, ' + u.value + '!' : 'Created, but sign-in failed: ' + s.error);
        renderTab('Account');
      });
      h(contentEl, '<h3>Sign In</h3>');
      const u2 = input(contentEl, 'Username');
      const pw2 = input(contentEl, 'Password', 'password');
      btn(contentEl, 'Sign In', function () {
        const s = BACKEND.signIn(u2.value, pw2.value);
        say(s.ok ? 'Signed in as ' + u2.value + '.' : 'Sign-in failed: ' + s.error);
        renderTab('Account');
      });
      return;
    }
    const prof = BACKEND.getProfile(me());
    const g = (typeof G !== 'undefined') ? G : { cash: 0 };
    if (prof.ok) {
      h(contentEl, '<p><b>' + prof.profile.displayName + '</b> (' + prof.profile.username + ')<br>Account: ' + me() + '<br>Cash: ' + g.cash + ' · Level: ' + prof.profile.playerLevel + ' · Title: ' + (prof.profile.title || 'Rookie') + '<br>Badges: ' + ((prof.profile.badges || []).join(', ') || 'none') + '<br>Guild: ' + (prof.profile.guild || 'none') + '</p>');
    } else {
      h(contentEl, '<p>Account: ' + me() + ' · Cash: ' + g.cash + '</p>');
    }
    h(contentEl, '<h3>Edit Profile</h3>');
    const dn = input(contentEl, 'Display name', 'text', prof.ok ? prof.profile.displayName : '');
    const badges = input(contentEl, 'Badges shown (comma separated)', 'text', prof.ok ? (prof.profile.badges || []).join(', ') : '');
    h(contentEl, '<p>Title — pick one you have earned:</p>');
    const ach = BACKEND.listAchievements(me());
    const earned = ach.ok ? ach.achievements.filter(a => a.earned).map(a => a.name) : [];
    const titles = ['Rookie'].concat(earned);
    let pickedTitle = prof.ok ? prof.profile.title : 'Rookie';
    for (const t of titles) {
      btn(contentEl, (t === pickedTitle ? '✓ ' : '') + t, function () { pickedTitle = t; renderTab('Account'); });
    }
    btn(contentEl, 'Save Profile', function () {
      const r = BACKEND.updateProfile(me(), { displayName: dn.value, title: pickedTitle, badges: badges.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) });
      say(r.ok ? 'Profile saved.' : 'Save failed: ' + r.error);
      renderTab('Account');
    });
    h(contentEl, '<h3>Cloud Save</h3><p>Saves your whole game (party, bag, cash, skills, missions, story) to your account on this device, so you can load it back later.</p>');
    btn(contentEl, '💾 Cloud Save Now', function () {
      let data = null;
      try { if (typeof saveGame === 'function') { saveGame(true); } } catch (e) {}
      try { const raw = localStorage.getItem((typeof SAVE_KEY !== 'undefined') ? SAVE_KEY : 'metamonsters_save_v2'); data = raw ? JSON.parse(raw) : null; } catch (e) {}
      if (!data) { say('No local save to upload yet — play a little first.'); return; }
      const r = BACKEND.saveGame(me(), data);
      say(r.ok ? 'Cloud save stored.' : 'Cloud save failed: ' + r.error);
    });
    btn(contentEl, '📥 Load Cloud Save', function () {
      const r = BACKEND.loadGame(me());
      if (!r.ok) { say(r.error); return; }
      try {
        if (typeof applySave === 'function') { applySave(r.data); say('Cloud save loaded — welcome back!'); }
        else say('Cloud save found, but this build cannot apply it.');
      } catch (e) { say('Load failed: ' + e.message); }
      renderTab('Account');
    });
    btn(contentEl, 'Sign Out', function () { BACKEND.signOut(); say('Signed out.'); renderTab('Account'); });
  }

  /* ---------- Chat ---------- */
  function tabChat() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Global Chat</h3><p>Stored messages — bots chime in while you are here.</p>');
    const list = el('div');
    contentEl.appendChild(list);
    const refresh = function () {
      const r = BACKEND.readChat(30);
      list.innerHTML = '';
      if (!r.ok || !r.messages.length) { h(list, '<p>No messages yet. Say hello!</p>'); return; }
      for (const m of r.messages) {
        h(list, '<div class="row"><b>' + BACKEND.displayNameOf(m.senderId) + '</b><span>' + m.text.replace(/</g, '&lt;') + '</span></div>');
      }
    };
    refresh();
    const box = input(contentEl, 'Say something to the global chat… (max 280 chars)');
    btn(contentEl, 'Send', function () {
      if (!box.value.trim()) return;
      const r = BACKEND.sendChat(me(), box.value);
      if (!r.ok) { say(r.error); return; }
      box.value = '';
      refresh();
    });
    chatTimer = setInterval(function () {
      try { BACKEND.botChatter(); refresh(); } catch (e) {}
    }, 4000);
  }

  /* ---------- PvP ---------- */
  function tabPvP() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Turn-Based PvP</h3><p>Challenge a bot trainer — 1v1, your lead creature vs theirs. Winner gets 500 cash.</p>');
    const g = (typeof G !== 'undefined') ? G : { party: [] };
    if (!g.party || !g.party.length) { h(contentEl, '<p>You need a creature in your party to battle. Catch one first!</p>'); return; }
    const lead = g.party.find(function (c) { return c.hp > 0; }) || g.party[0];
    h(contentEl, '<p>Your lead: <b>' + creatureLabel(lead) + '</b> — ' + lead.hp + '/' + lead.maxHp + ' HP</p>');
    // Active battles first.
    const hist = BACKEND.getBattleHistory(me());
    const active = hist.ok ? hist.battles.filter(function (b) { return b.status === 'in progress' || b.status === 'waiting'; }) : [];
    for (const b of active) {
      const opp = BACKEND.usernameOf(b.player1 === me() ? b.player2 : b.player1);
      h(contentEl, '<div class="row"><b>vs ' + opp + '</b><span>' + b.status + ' · ' + b.p1Name + ' (' + b.p1Hp + ' HP) vs ' + b.p2Name + ' (' + b.p2Hp + ' HP)</span></div>');
      if (b.status === 'waiting') {
        btn(contentEl, 'Accept & Start', function () { const r = BACKEND.acceptChallenge(b.id); say(r.ok ? 'Battle started — your turn!' : r.error); renderTab('PvP'); });
        btn(contentEl, 'Decline', function () { BACKEND.declineChallenge(b.id); renderTab('PvP'); });
      } else if (b.whoseTurn === me()) {
        h(contentEl, '<p>Your turn — pick a move:</p>');
        for (const mid of (lead.moves || [])) {
          let md = null;
          try { md = moveDef(mid, lead.dex); } catch (e) {}
          btn(contentEl, (md ? md.name : mid) + (md && md.power ? ' · ' + md.power : ''), function () {
            const r = BACKEND.submitTurn(b.id, me(), mid);
            if (!r.ok) { say(r.error); return; }
            say(r.lines ? r.lines.join(' ') : 'Round done.');
            renderTab('PvP');
          });
        }
      } else {
        h(contentEl, '<p>Waiting on ' + opp + '… (bots answer when you submit your next turn)</p>');
      }
      if (b.turns && b.turns.length) {
        const last = b.turns[b.turns.length - 1];
        h(contentEl, '<p style="color:#5a6a9e">' + last.text + '</p>');
      }
    }
    h(contentEl, '<h3>Challenge a Trainer</h3>');
    const bots = BACKEND.listBots();
    for (const bot of (bots.ok ? bots.bots : [])) {
      const row = el('div'); row.className = 'row';
      row.innerHTML = '<div style="flex:1"><b>' + bot.username + '</b><br><span style="color:#5a6a9e">Lv ' + bot.playerLevel + ' · ' + bot.wins + ' PvP wins · ' + bot.tournamentWins + ' tournament wins</span></div>';
      contentEl.appendChild(row);
      btn(row, '⚔️ Challenge', function () {
        const c = BACKEND.challengePlayer(me(), bot.id);
        if (!c.ok) { say(c.error); return; }
        const a = BACKEND.acceptChallenge(c.battleId); // bots auto-accept
        say(a.ok ? 'Challenge accepted! Your turn — pick a move.' : 'Challenge sent: ' + a.error);
        renderTab('PvP');
      });
    }
  }

  /* ---------- Trade ---------- */
  function tabTrade() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Trading</h3><p>A trade moves creatures and items ONLY when both sides accept. Prices follow the star floors (1★ 1–5, 2★ 5–100, 3★ 100–10,000, 4★ gift-only, 5★ 100,000–1,000,000).</p>');
    const g = (typeof G !== 'undefined') ? G : { party: [], storage: [], bag: {} };
    // Incoming / open bot offers.
    const trades = BACKEND.listTrades(me());
    const open = trades.ok ? trades.trades.filter(function (t) { return t.status === 'proposed' && t.player1 !== me(); }) : [];
    if (open.length) {
      h(contentEl, '<h3>Open Offers From Bots</h3>');
      for (const t of open) {
        const who = BACKEND.usernameOf(t.player1);
        const offered = (t.offer1.creatures || []).map(function (cid) {
          const rows = BACKEND._db().creatures;
          const row = rows.find(function (x) { return x.id === cid; });
          return row ? rowLabel(row) : cid;
        }).join(', ') || 'nothing';
        h(contentEl, '<div class="row"><b>' + who + ' offers</b><span>' + offered + '</span></div>');
        btn(contentEl, 'Accept — pick what you give', function () {
          sel.acceptOffer = t.id; sel.acceptOfferCreature = null;
          renderTab('Trade');
        });
        btn(contentEl, 'Decline', function () { BACKEND.declineTrade(t.id); say('Offer declined — nothing moved.'); renderTab('Trade'); });
      }
      if (sel.acceptOffer) {
        h(contentEl, '<p>Pick one of your party creatures to give in return (the bot accepts only if it is worth at least what they offer):</p>');
        for (const c of (g.party || [])) {
          btn(contentEl, (sel.acceptOfferCreature === c.uid ? '✓ ' : '') + creatureLabel(c) + ' ' + starsOf(c.dex), function () { sel.acceptOfferCreature = c.uid; renderTab('Trade'); });
        }
        btn(contentEl, 'Confirm Trade', function () {
          if (!sel.acceptOfferCreature) { say('Pick a creature to give first.'); return; }
          const r = BACKEND.acceptTrade(sel.acceptOffer, me(), { creatures: [sel.acceptOfferCreature], items: [] });
          say(r.ok ? 'Trade complete!' : 'Trade failed: ' + r.error);
          sel.acceptOffer = null; sel.acceptOfferCreature = null;
          renderTab('Trade');
        }, !sel.acceptOfferCreature);
      }
    }
    // Propose a trade to a bot.
    h(contentEl, '<h3>Propose a Trade</h3><p>1) Pick a bot. 2) Pick what you want from their party. 3) Pick what you offer. 4) Send — the bot answers at once.</p>');
    const bots = BACKEND.listBots();
    for (const bot of (bots.ok ? bots.bots : [])) {
      btn(contentEl, (sel.tradeBot === bot.id ? '✓ ' : '') + bot.username + ' (Lv ' + bot.playerLevel + ')', function () { sel.tradeBot = bot.id; sel.tradeWant = null; renderTab('Trade'); });
    }
    if (sel.tradeBot) {
      const bp = BACKEND.botParty(sel.tradeBot);
      h(contentEl, '<p><b>' + BACKEND.usernameOf(sel.tradeBot) + '\'s party</b> — pick what you want:</p>');
      for (const row of (bp.ok ? bp.creatures : [])) {
        btn(contentEl, (sel.tradeWant === row.id ? '✓ ' : '') + rowLabel(row) + ' ' + starsOf(row.dex), function () { sel.tradeWant = row.id; renderTab('Trade'); });
      }
      h(contentEl, '<p><b>Your party</b> — pick what you offer:</p>');
      for (const c of (g.party || [])) {
        btn(contentEl, (sel.tradeParty === c.uid ? '✓ ' : '') + creatureLabel(c) + ' ' + starsOf(c.dex), function () { sel.tradeParty = c.uid; renderTab('Trade'); });
      }
      h(contentEl, '<p><b>Your bag</b> — tap an item to add 1 to the offer:</p>');
      for (const id of Object.keys(g.bag || {})) {
        if (!g.bag[id]) continue;
        btn(contentEl, itemName(id) + ' ×' + g.bag[id] + (sel.tradeItems[id] ? ' (offer ' + sel.tradeItems[id] + ')' : ''), function () {
          sel.tradeItems[id] = Math.min(g.bag[id], (sel.tradeItems[id] || 0) + 1);
          renderTab('Trade');
        });
      }
      btn(contentEl, 'Send Trade to ' + BACKEND.usernameOf(sel.tradeBot), function () {
        if (!sel.tradeParty && !Object.keys(sel.tradeItems).length) { say('Offer at least one creature or item.'); return; }
        if (!sel.tradeWant) { say('Pick what you want from their party first.'); return; }
        const offer1 = { creatures: sel.tradeParty ? [sel.tradeParty] : [], items: Object.keys(sel.tradeItems).map(function (id) { return { id: id, qty: sel.tradeItems[id] }; }), wants: { creatures: [sel.tradeWant], items: [] } };
        const p = BACKEND.proposeTrade(me(), sel.tradeBot, offer1);
        if (!p.ok) { say(p.error); return; }
        // The bot answers now, on acceptTrade.
        const a = BACKEND.acceptTrade(p.tradeId, sel.tradeBot, null);
        say(a.ok ? 'Trade complete! The bot accepted.' : 'The bot declined: ' + a.error);
        sel.tradeParty = null; sel.tradeItems = {}; sel.tradeWant = null;
        renderTab('Trade');
      });
    }
    // Completed trades.
    const done = trades.ok ? trades.trades.filter(function (t) { return t.status === 'accepted' || t.status === 'declined' || t.status === 'cancelled'; }).slice(-5) : [];
    if (done.length) {
      h(contentEl, '<h3>Recent Trades</h3>');
      for (const t of done) h(contentEl, '<p>' + BACKEND.usernameOf(t.player1) + ' ↔ ' + BACKEND.usernameOf(t.player2 || t.player1) + ' — ' + t.status + (t.declineReason ? ' (' + t.declineReason + ')' : '') + '</p>');
    }
  }

  /* ---------- Market ---------- */
  function tabMarket() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Marketplace</h3><p>Buy and sell for in-game cash. Creature prices must stay inside their star floor — 4★ creatures can never be listed.</p>');
    const g = (typeof G !== 'undefined') ? G : { party: [], storage: [], bag: {}, cash: 0 };
    const search = input(contentEl, 'Search listings (name or dex)…');
    btn(contentEl, 'Search', function () { renderMarketList(search.value); });
    const list = el('div');
    contentEl.appendChild(list);
    const renderMarketList = function (q) {
      list.innerHTML = '';
      const r = BACKEND.browseListings(q ? { search: q } : {});
      if (!r.ok || !r.listings.length) { h(list, '<p>No listings right now.</p>'); return; }
      for (const l of r.listings) {
        let what = '';
        if (l.what.kind === 'creature') {
          const row = BACKEND._db().creatures.find(function (x) { return x.id === l.what.creatureId; });
          what = row ? rowLabel(row) + ' ' + starsOf(row.dex) : 'Creature';
        } else what = itemName(l.what.itemId) + ' ×' + (l.what.qty || 1);
        const row = el('div'); row.className = 'row';
        row.innerHTML = '<div style="flex:1"><b>' + what + '</b><br><span style="color:#5a6a9e">' + l.price + ' cash · sold by ' + BACKEND.usernameOf(l.sellerId) + '</span></div>';
        list.appendChild(row);
        if (l.sellerId === me()) {
          btn(row, 'Cancel Listing', function () { const rr = BACKEND.cancelListing(me(), l.id); say(rr.ok ? 'Listing cancelled — it is back in your storage/bag.' : rr.error); renderTab('Market'); });
        } else {
          btn(row, 'Buy — ' + l.price + ' cash', function () {
            const rr = BACKEND.buyListing(me(), l.id);
            say(rr.ok ? 'Bought! It is in your party/storage or bag.' : 'Could not buy: ' + rr.error);
            renderTab('Market');
          }, g.cash < l.price);
        }
      }
    };
    renderMarketList('');
    // List something of your own.
    h(contentEl, '<h3>List Something For Sale</h3>');
    h(contentEl, '<p>Pick a creature from your party/storage:</p>');
    const all = (g.party || []).concat(g.storage || []);
    for (const c of all) {
      btn(contentEl, (sel.marketListCreature === c.uid ? '✓ ' : '') + creatureLabel(c) + ' ' + starsOf(c.dex), function () { sel.marketListCreature = c.uid; sel.marketListItem = null; renderTab('Market'); });
    }
    h(contentEl, '<p>Or pick an item from your bag:</p>');
    for (const id of Object.keys(g.bag || {})) {
      if (!g.bag[id]) continue;
      btn(contentEl, (sel.marketListItem === id ? '✓ ' : '') + itemName(id) + ' ×' + g.bag[id], function () { sel.marketListItem = id; sel.marketListCreature = null; renderTab('Market'); });
    }
    const price = input(contentEl, 'Price in cash (star floors apply to creatures)', 'number');
    btn(contentEl, 'List It', function () {
      const p = parseInt(price.value, 10);
      if (!p || p < 1) { say('Enter a price first.'); return; }
      let r;
      if (sel.marketListCreature) r = BACKEND.listItem(me(), { kind: 'creature', creatureId: sel.marketListCreature }, p);
      else if (sel.marketListItem) r = BACKEND.listItem(me(), { kind: 'item', itemId: sel.marketListItem, qty: 1 }, p);
      else { say('Pick a creature or an item to list first.'); return; }
      say(r.ok ? 'Listed for ' + p + ' cash.' : 'Could not list: ' + r.error);
      sel.marketListCreature = null; sel.marketListItem = null;
      renderTab('Market');
    });
  }

  /* ---------- Friends ---------- */
  function tabFriends() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Friends</h3>');
    // Bots send a friend request the first time this tab is opened.
    if (!botFriendSent) {
      botFriendSent = true;
      try {
        const mine = BACKEND.listFriends(me());
        if (mine.ok && !mine.friends.length) {
          BACKEND.addFriend('bot-02', BACKEND.usernameOf(me()));
          BACKEND.addFriend('bot-04', BACKEND.usernameOf(me()));
        }
      } catch (e) {}
    }
    const name = input(contentEl, 'Add a friend by username (try Rin, Boz, Suki…)');
    btn(contentEl, 'Send Friend Request', function () {
      if (!name.value.trim()) return;
      const r = BACKEND.addFriend(me(), name.value.trim());
      say(r.ok ? 'Friend request sent to ' + name.value.trim() + '.' : r.error);
      renderTab('Friends');
    });
    const r = BACKEND.listFriends(me());
    if (!r.ok || !r.friends.length) { h(contentEl, '<p>No friends yet.</p>'); return; }
    for (const f of r.friends) {
      const row = el('div'); row.className = 'row';
      row.innerHTML = '<div style="flex:1"><b>' + f.username + '</b><br><span style="color:#5a6a9e">' + f.status + ' · ' + (f.online ? '🟢 online' : '⚫ offline') + '</span></div>';
      contentEl.appendChild(row);
      if (f.status === 'requested' && f.direction === 'incoming') {
        btn(row, 'Accept', function () { const rr = BACKEND.acceptFriend(me(), f.playerId); say(rr.ok ? 'You are friends with ' + f.username + '!' : rr.error); renderTab('Friends'); });
      }
      if (f.status === 'accepted') {
        btn(row, 'Remove', function () { BACKEND.removeFriend(me(), f.playerId); say('Removed ' + f.username + '.'); renderTab('Friends'); });
      }
    }
  }

  /* ---------- Mail ---------- */
  function tabMail() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Mailbox</h3><p>Private messages and gifts. Unread first.</p>');
    const r = BACKEND.readMailbox(me());
    if (!r.ok || !r.messages.length) h(contentEl, '<p>Your mailbox is empty.</p>');
    for (const m of (r.ok ? r.messages : [])) {
      const row = el('div'); row.className = 'row';
      const giftTxt = m.gift ? ' 🎁 Gift: ' + (m.gift.kind === 'creature' ? rowLabel(BACKEND._db().creatures.find(function (x) { return x.id === m.gift.creatureId; }) || { dex: '?', level: 1 }) : itemName(m.gift.itemId) + ' ×' + (m.gift.qty || 1)) : '';
      row.innerHTML = '<div style="flex:1"><b>' + (m.read ? '' : '● ') + BACKEND.usernameOf(m.senderId) + '</b><br><span>' + m.text.replace(/</g, '&lt;') + giftTxt + '</span></div>';
      contentEl.appendChild(row);
      btn(row, m.read ? 'Read' : 'Mark Read', function () { BACKEND._markRead(m.id); renderTab('Mail'); });
      if (m.gift && !m.claimed) {
        btn(row, 'Claim Gift', function () {
          const rr = BACKEND.claimGift(me(), m.id);
          say(rr.ok ? 'Gift claimed — it is in your party/storage or bag!' : 'Could not claim: ' + rr.error);
          renderTab('Mail');
        });
      } else if (m.gift) h(row, '<span>✓ claimed</span>');
    }
    h(contentEl, '<h3>Send Mail</h3>');
    const bots = BACKEND.listBots();
    for (const bot of (bots.ok ? bots.bots : [])) {
      btn(contentEl, (sel.mailTo === bot.id ? '✓ ' : '') + bot.username, function () { sel.mailTo = bot.id; renderTab('Mail'); });
    }
    if (sel.mailTo) {
      const text = input(contentEl, 'Write to ' + BACKEND.usernameOf(sel.mailTo) + '…');
      const g = (typeof G !== 'undefined') ? G : { bag: {} };
      h(contentEl, '<p>Attach a gift (optional) — tap an item:</p>');
      for (const id of Object.keys(g.bag || {})) {
        if (!g.bag[id]) continue;
        btn(contentEl, (sel.mailGift === id ? '✓ ' : '') + itemName(id) + ' ×' + g.bag[id], function () { sel.mailGift = sel.mailGift === id ? null : id; renderTab('Mail'); });
      }
      btn(contentEl, 'Send Mail', function () {
        if (!text.value.trim()) { say('Write something first.'); return; }
        const gift = sel.mailGift ? { kind: 'item', itemId: sel.mailGift, qty: 1 } : null;
        const rr = BACKEND.sendMail(me(), sel.mailTo, text.value, gift);
        say(rr.ok ? 'Mail sent!' : 'Could not send: ' + rr.error);
        sel.mailGift = null;
        renderTab('Mail');
      });
    }
  }

  /* ---------- Guilds ---------- */
  function tabGuilds() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Guilds</h3>');
    const prof = BACKEND.getProfile(me());
    const myGuild = prof.ok ? prof.profile.guild : '';
    const gs = BACKEND.listGuilds();
    for (const gd of (gs.ok ? gs.guilds : [])) {
      const leader = BACKEND.usernameOf(gd.leaderId);
      h(contentEl, '<div class="row"><b>' + gd.name + '</b><span>Leader: ' + leader + ' · ' + gd.members.length + ' members' + (gd.id === myGuild ? ' · ★ YOUR GUILD' : '') + '</span></div>');
      if (gd.id === myGuild) {
        btn(contentEl, 'Leave ' + gd.name, function () { const rr = BACKEND.leaveGuild(me(), gd.id); say(rr.ok ? 'You left the guild.' : rr.error); renderTab('Guilds'); });
      } else if (!myGuild) {
        btn(contentEl, 'Join ' + gd.name, function () { const rr = BACKEND.joinGuild(me(), gd.id); say(rr.ok ? 'Welcome to ' + gd.name + '!' : rr.error); renderTab('Guilds'); });
      }
      if (gd.id === myGuild) {
        const msgs = BACKEND.guildMessages(gd.id);
        h(contentEl, '<h3>' + gd.name + ' — Message Board</h3>');
        for (const m of (msgs.ok ? msgs.messages : [])) h(contentEl, '<p><b>' + BACKEND.displayNameOf(m.senderId) + ':</b> ' + m.text.replace(/</g, '&lt;') + '</p>');
        const box = input(contentEl, 'Post to the guild board…');
        btn(contentEl, 'Post', function () {
          if (!box.value.trim()) return;
          const rr = BACKEND.postGuildMessage(me(), gd.id, box.value);
          say(rr.ok ? 'Posted!' : rr.error);
          renderTab('Guilds');
        });
      }
    }
    if (!myGuild) {
      h(contentEl, '<h3>Create Your Own Guild</h3>');
      const nm = input(contentEl, 'Guild name');
      btn(contentEl, 'Create Guild', function () {
        if (!nm.value.trim()) return;
        const rr = BACKEND.createGuild(me(), nm.value.trim());
        say(rr.ok ? 'Guild founded — you are the leader!' : rr.error);
        if (rr.ok) BACKEND.checkAchievements();
        renderTab('Guilds');
      });
    }
  }

  /* ---------- Daily ---------- */
  function tabDaily() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Daily Rewards</h3><p>Claim once per calendar day. Reward: 100 cash × streak (cap 1,000) + 1 bandage. Streak 3+: +1 trap. Streak 7+: +1 Chemical X.</p>');
    const s = BACKEND.checkStreak(me());
    if (s.ok) h(contentEl, '<p>Current streak: <b>' + s.streak + ' day' + (s.streak === 1 ? '' : 's') + '</b><br>Last claim: ' + (s.lastClaimDate || 'never') + '</p>');
    btn(contentEl, '🎁 Claim Daily Reward', function () {
      const r = BACKEND.claimDailyReward(me());
      say(r.ok ? 'Claimed! +' + r.cash + ' cash, streak ' + r.streak + '.' : r.error);
      renderTab('Daily');
    });
  }

  /* ---------- Events ---------- */
  function tabEvents() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Live Events</h3>');
    const g = (typeof G !== 'undefined') ? G : { flags: {} };
    const r = BACKEND.listLiveEvents();
    for (const ev of (r.ok ? r.events : [])) {
      const running = r.running.some(function (x) { return x.id === ev.id; });
      const done = g.flags[ev.flag];
      h(contentEl, '<div class="row"><b>' + ev.name + (running ? ' ● LIVE' : ' (not running)') + '</b><span>' + ev.description + '<br>Reward: ' + ev.reward + '<br>' + ev.starts.slice(0, 10) + ' → ' + ev.ends.slice(0, 10) + '</span></div>');
      btn(contentEl, 'Claim Reward', function () {
        const rr = BACKEND.claimEventReward(me(), ev.id);
        say(rr.ok ? 'Event reward claimed! +' + rr.cash + ' cash.' : rr.error);
        renderTab('Events');
      }, !running || !done);
      if (running && !done) h(contentEl, '<p style="color:#5a6a9e">Take part first (the game sets the flag when you do), then claim.</p>');
    }
  }

  /* ---------- Achievements ---------- */
  function tabAchievements() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Achievements</h3>');
    BACKEND.checkAchievements();
    const r = BACKEND.listAchievements(me());
    if (!r.ok) { h(contentEl, '<p>' + r.error + '</p>'); return; }
    const earned = r.achievements.filter(function (a) { return a.earned; }).length;
    h(contentEl, '<p>' + earned + ' / ' + r.achievements.length + ' earned.</p>');
    for (const a of r.achievements) {
      h(contentEl, '<div class="row"><b>' + (a.earned ? '🏆 ' : '○ ') + a.name + '</b><span>' + (a.earned ? 'earned ' + a.earnedDate.slice(0, 10) : 'not yet earned') + '</span></div>');
    }
  }

  /* ---------- Leaders ---------- */
  function tabLeaders() {
    h(contentEl, '<h3>Leaderboards</h3><p>Computed fresh from accounts and battles — nothing stored twice.</p>');
    const boards = [['wins', 'Most PvP Wins'], ['level', 'Highest Level'], ['creatures', 'Most Creatures Caught'], ['tournaments', 'Most Tournament Wins']];
    for (const [id, label] of boards) {
      h(contentEl, '<h3>' + label + '</h3>');
      const r = BACKEND.getLeaderboard(id);
      if (!r.ok || !r.entries.length) { h(contentEl, '<p>No entries yet.</p>'); continue; }
      r.entries.forEach(function (e, i) {
        h(contentEl, '<p>' + (i + 1) + '. <b>' + e.username + '</b>' + (e.playerId === me() ? ' (you)' : '') + ' — ' + e.value + '</p>');
      });
    }
  }

  /* ---------- History ---------- */
  function tabHistory() {
    if (!needAccount()) return;
    h(contentEl, '<h3>Battle History</h3><p>Newest first.</p>');
    const r = BACKEND.getBattleHistory(me());
    if (!r.ok || !r.battles.length) { h(contentEl, '<p>No battles yet — challenge someone in the PvP tab!</p>'); return; }
    for (const b of r.battles) {
      const opp = BACKEND.usernameOf(b.player1 === me() ? b.player2 : b.player1);
      const won = b.winner === me();
      h(contentEl, '<div class="row"><b>vs ' + opp + '</b><span>' + b.status + ' · ' + (b.winner ? (won ? '🏆 YOU WON' : 'lost to ' + BACKEND.usernameOf(b.winner)) : 'no winner') + ' · ' + (b.startedDate || '').slice(0, 10) + '</span></div>');
      if (b.turns && b.turns.length) h(contentEl, '<p style="color:#5a6a9e">' + b.turns[b.turns.length - 1].text + '</p>');
    }
  }

  return { openHub: openHub, renderTab: renderTab, TABS: TABS };
})();
