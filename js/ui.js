/* Metamonsters v1 — DOM UI: dialogs, menus, shop, crafting, base, badge, NPCs, tournament flow. */
'use strict';

const UI = {
  dialogQueue: [], dialogDone: null, menuStack: [],

  /* ---------------- dialog ---------------- */
  dialog(name, text, onDone) { this.dialogSeq([{ name, text }], onDone); },
  dialogSeq(lines, onDone) {
    clearPresses(); // a stale Enter/Space from the previous screen must not auto-advance this dialog
    this.dialogQueue = lines.slice();
    this.dialogDone = onDone || null;
    if (G.state !== 'dialog') { G.prevState = G.state; G.state = 'dialog'; }
    this.showDialogLine();
  },
  showDialogLine() {
    const line = this.dialogQueue.shift();
    if (!line) {
      hide($('dialog'));
      const done = this.dialogDone; this.dialogDone = null;
      G.state = G.prevState === 'dialog' ? 'overworld' : (G.prevState || 'overworld');
      clearPresses();
      if (done) done();
      return;
    }
    $('dialog-name').textContent = line.name || '';
    $('dialog-text').textContent = line.text;
    show($('dialog'));
  },
  updateDialog() {
    if (G.state !== 'dialog') return;
    if (consumePress('confirm')) { SFX.select(); this.showDialogLine(); }
  },
  setMissionHint(t) { toast(t); },
  // a choice panel: title + options, each with a label and an onPick callback.
  // Used for the starter pick (which starter is left for Kai) and similar forks.
  choice(title, sub, options) {
    const p = this.openPanel(`<h2>${title}</h2><div class="sub">${sub}</div>`);
    for (const o of options) {
      this.panelButton(p, o.label, () => { this.closePanel(); o.onPick(); });
    }
    return p;
  },

  /* ---------------- menu shell ---------------- */
  openPanel(html) {
    clearPresses();
    const m = $('menu');
    m.innerHTML = '';
    const p = document.createElement('div');
    p.className = 'panel';
    p.innerHTML = html;
    m.appendChild(p);
    show(m);
    if (G.state !== 'menu') { G.prevState = G.state; G.state = 'menu'; }
    return p;
  },
  closePanel() {
    hide($('menu'));
    G.state = G.prevState === 'menu' ? 'overworld' : (G.prevState || 'overworld');
    clearPresses();
  },
  panelButton(panel, label, fn, disabled) {
    const b = document.createElement('button');
    b.textContent = label; b.disabled = !!disabled;
    b.onclick = () => { SFX.select(); fn(); };
    panel.appendChild(b);
    return b;
  },
  closeButton(panel, label) {
    this.panelButton(panel, label || '← Back', () => this.closePanel());
  },

  /* ---------------- main menu ---------------- */
  openMenu() {
    if (G.state !== 'overworld') return;
    SFX.select();
    const p = this.openPanel(`<h2>MENU</h2><div class="sub">Kai · ${fmtTime()} · ${G.cash} cash</div>`);
    this.panelButton(p, '🦈 Party', () => this.openParty());
    this.panelButton(p, '🎒 Bag', () => this.openBag());
    this.panelButton(p, '📋 Skills & ID Badge', () => this.openBadge());
    this.panelButton(p, '⭐ Missions', () => this.openMissions());
    this.panelButton(p, '🗺️ World Map', () => this.openWorldMap());
    this.panelButton(p, '🚗 Travel (Car / Fly)', () => this.openTravelMenu());
    this.panelButton(p, '🌐 Online Hub (Upper Deck)', () => { if (typeof HUB !== 'undefined') HUB.openHub(); });
    // The Choice can be switched ONCE — the old side goes permanently hostile.
    if (G.flags.path && !G.flags.switched && (missionStatus('leak') === 'active' || missionStatus('interview') === 'active' || missionStatus('indieAlliance') === 'active' || missionStatus('ladder') === 'active' || missionStatus('securityTeam') === 'active' || missionStatus('quietFriendsPath') === 'active' || missionStatus('facility') === 'active' || missionStatus('dirtyWork') === 'active' || missionStatus('exposure') === 'active' || missionStatus('executive') === 'active')) {
      this.panelButton(p, `🔄 Reconsider your side (one-time — the ${G.flags.path === 'fight' ? 'resistance' : 'company'} will turn hostile)`, () => this.switchPath());
    }
    this.panelButton(p, '💾 Save Game', () => { saveGame(); });
    this.panelButton(p, '🏠 Quit to Title', () => { saveGame(true); location.reload(); });
    this.closeButton(p, 'Close (Esc)');
  },

  /* ---------------- party ---------------- */
  openParty() {
    const p = this.openPanel(`<h2>PARTY</h2><div class="sub">Up to 6 creatures travel with you. Extras go to storage at home.</div>`);
    if (!G.party.length) { p.insertAdjacentHTML('beforeend', '<p>No creatures yet — pick your starter in Haven Village!</p>'); }
    G.party.forEach((c, i) => {
      const d = DEX[c.dex];
      const row = document.createElement('div');
      row.className = 'row';
      const hpFrac = c.hp / c.maxHp;
      const hpCls = hpFrac > 0.5 ? 'high' : hpFrac > 0.2 ? 'mid' : '';
      const stars = '★'.repeat(d.stars || 1);
      const xpFrac = Math.min(1, c.xp / xpToNext(c.level));
      row.innerHTML = `<img class="sprite-thumb" src="${creatureSprite(c, true)}">
        <div style="flex:1"><b>${c.name}${c.instinct ? ' (Instinct)' : c.mutant ? ' (Mutant)' : c.mega ? ' (Mega)' : ''}</b> <span class="stars">${stars}</span><br>
        <span style="color:#5a6a9e">Lv ${c.level} · ${d.category} + ${d.sense} · ${c.hp}/${c.maxHp} HP${c.status ? ' · ' + c.status.toUpperCase() : ''}</span>
        <div class="hpbar"><div class="${hpCls}" style="width:${hpFrac * 100}%"></div></div>
        <div class="hpbar" style="height:4px;margin-top:2px"><div style="width:${xpFrac * 100}%;background:#7cc4ff"></div></div>
        <span style="font-size:12px;color:#5a6a9e">Moves: ${c.moves.map(mid => moveDef(mid, c.dex).name).join(' · ')}</span></div>`;
      row.style.cursor = 'pointer';
      row.onclick = () => { SFX.select(); this.openCreature(c, i); };
      p.appendChild(row);
    });
    if (G.storage.length) {
      p.insertAdjacentHTML('beforeend', `<h3>Storage (at home computer) — ${G.storage.length}</h3>`);
      G.storage.forEach((c, i) => {
        const row = document.createElement('div');
        row.className = 'row';
        row.innerHTML = `<img class="sprite-thumb" src="${creatureSprite(c, true)}"><div style="flex:1"><b>${c.name}</b><br><span style="color:#5a6a9e">Lv ${c.level} · ${c.hp}/${c.maxHp} HP</span></div>`;
        row.onclick = () => {
          if (G.party.length >= 6) { toast('Party is full!'); return; }
          G.storage.splice(i, 1); G.party.push(c); toast(`${c.name} joined the party!`); this.openParty();
        };
        p.appendChild(row);
      });
    }
    this.closeButton(p);
  },
  openCreature(c, idx) {
    const d = DEX[c.dex];
    const p = this.openPanel(`<h2>${c.name}${c.instinct ? ' — INSTINCT' : c.mutant ? ' — MUTANT' : c.mega ? ' — MEGA' : ''}</h2>
      <div class="sub">${d.category} + ${d.sense} · ${'★'.repeat(d.stars || 1)} · Dex #${c.dex} · Stage ${d.stage}</div>
      <div style="display:flex;gap:16px"><img src="${creatureSprite(c, true)}" style="width:160px;height:160px;image-rendering:pixelated">
      <div><div class="row"><b>Level</b> ${c.level} (XP ${c.xp}/${xpToNext(c.level)})</div>
      <div class="row"><b>HP</b> ${c.hp}/${c.maxHp}</div>
      <div class="row"><b>Attack</b> ${c.stats.atk}</div>
      <div class="row"><b>Defense</b> ${c.stats.def}</div>
      <div class="row"><b>Speed</b> ${c.stats.spd}</div>
      <div class="row"><b>Status</b> ${c.status || 'healthy'}</div></div></div>
      <h3>Moves</h3><div class="moves-grid">${c.moves.map(mid => { const md = moveDef(mid, c.dex); return `<div class="row"><b>${md.name}</b><span>${md.type} · ${md.power || '—'} · ${md.desc || ''}</span></div>`; }).join('')}</div>
      ${d.evo && d.evo.item ? `<h3>Item Evolution</h3><p>Evolves with <b>${d.evo.item}</b> — use it from the Bag.</p>` : ''}
      ${d.evo && d.evo.level ? `<p style="color:#5a6a9e">Evolves at level ${d.evo.level} into ${DEX[d.evo.into].name}.</p>` : ''}`);
    this.panelButton(p, '← Back to Party', () => this.openParty());
    this.closeButton(p, 'Close');
  },

  /* ---------------- bag ---------------- */
  openBag() {
    const p = this.openPanel(`<h2>BAG</h2><div class="sub">${G.cash} cash · Use healing items, evolve with items, or sell at the shop.</div>`);
    const ids = Object.keys(G.bag).sort();
    if (!ids.length) p.insertAdjacentHTML('beforeend', '<p>Your bag is empty.</p>');
    for (const id of ids) {
      const it = itemDef(id); if (!it) continue;
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<img class="item-thumb" src="${itemSprite(id)}" onerror="this.style.display='none'">
        <div style="flex:1"><b>${it.name}</b> ×${G.bag[id]}<br><span style="color:#5a6a9e;font-size:13px">${it.desc || ''}</span></div>`;
      const useBtn = document.createElement('button');
      useBtn.style.width = 'auto'; useBtn.textContent = 'Use';
      useBtn.onclick = () => { SFX.select(); this.useBagItem(id); };
      row.appendChild(useBtn);
      p.appendChild(row);
    }
    this.closeButton(p);
  },
  useBagItem(id) {
    const it = itemDef(id);
    // TM: teach the move to one creature (single use). Pick the creature, then
    // the move to forget if it already knows 4 (the signature move can't be forgotten).
    if (it.use === 'tm') {
      const p = this.openPanel(`<h2>TEACH ${it.name}</h2><div class="sub">Teaches ${MOVES[it.move].name} (${MOVES[it.move].type} · ${MOVES[it.move].power || '—'}). Choose a creature. The TM is used up.</div>`);
      G.party.forEach((c) => {
        this.panelButton(p, `${c.name} Lv${c.level} — ${c.moves.map(mid => moveDef(mid, c.dex).name).join(', ')}`, () => this.teachMove(c, it));
      });
      this.closeButton(p);
      return;
    }
    // item evolution (dex stores the item's display name, e.g. "Car battery")
    const evoTarget = G.party.find(c => DEX[c.dex].evo && DEX[c.dex].evo.item && itemIdByName(DEX[c.dex].evo.item) === id);
    if (evoTarget) {
      removeItem(id, 1);
      const oldName = evolveCreature(evoTarget, DEX[evoTarget.dex].evo.into);
      SFX.evo();
      this.dialog('Kai', `${oldName} is evolving... into ${evoTarget.name}!`, () => this.openBag());
      return;
    }
    if (it.heal) {
      const hurt = G.party.find(c => c.hp > 0 && c.hp < c.maxHp);
      if (!hurt) { toast('Nobody needs healing right now.'); return; }
      removeItem(id, 1);
      const healed = Math.min(it.heal, hurt.maxHp - hurt.hp);
      hurt.hp += healed;
      skillGain('Healing', 1);
      SFX.heal();
      toast(`${hurt.name} recovered ${healed} HP!`);
      this.openBag();
      return;
    }
    if (it.use === 'cure') {
      const sick = G.party.find(c => c.status);
      if (!sick) { toast('Nobody has a status to cure.'); return; }
      removeItem(id, 1);
      sick.status = null;
      toast(`${sick.name} is cured!`);
      this.openBag();
      return;
    }
    toast(`${it.name} can't be used that way.`);
  },
  teachMove(c, tmItem) {
    const moveId = tmItem.move;
    const moveName = MOVES[moveId].name;
    if (c.moves.includes(moveId)) { toast(`${c.name} already knows ${moveName}.`); this.openBag(); return; }
    if (c.moves.length < 4) {
      c.moves.push(moveId);
      removeItem(tmItem.id, 1);
      SFX.fanfare();
      this.dialog('Kai', `${c.name} learned ${moveName}!`, () => this.openBag());
      return;
    }
    const p = this.openPanel(`<h2>${c.name} — FORGET A MOVE</h2><div class="sub">${c.name} already knows 4 moves. Choose one to forget for ${moveName}. (The signature move can't be forgotten.)</div>`);
    c.moves.forEach((mid, i) => {
      if (i === 0) return; // signature slot is protected
      const md = moveDef(mid, c.dex);
      this.panelButton(p, `${md.name} (${md.type} · ${md.power || '—'})`, () => {
        const forgotten = md.name;
        c.moves[i] = moveId;
        removeItem(tmItem.id, 1);
        SFX.fanfare();
        this.dialog('Kai', `${c.name} forgot ${forgotten} and learned ${moveName}!`, () => this.openBag());
      });
    });
    this.closeButton(p, 'Cancel');
  },

  /* ---------------- shop ---------------- */
  // seller: 'hub' (Rin's Care Hub shop, full stock), 'pippa' (indie stall, small stock),
  // 'plaza' (Rok Plaza, full stock — refuses resistance fighters), 'bazaar' (bazaar stalls,
  // indie stock — friendlier prices on the Fight path, worse on the Join path).
  openShop(seller) {
    const isPippa = seller === 'pippa';
    const isBazaar = seller === 'bazaar';
    const isPlaza = seller === 'plaza';
    const isSanctuary = seller === 'sanctuary'; // Pass 3 — exile trader, small stock, 2x prices (no supply line out here)
    if (isPlaza && G.flags.path === 'fight') {
      UI.dialog('Plaza Clerk', 'Rok Plaza doesn\'t serve resistance traitors. Mara\'s people can shop in the bazaar — or starve. Now get out of my store.');
      return;
    }
    if (isBazaar && G.flags.hostile_fight) {
      UI.dialog('Bazaar Merchant', 'You sold us out to Cyber Tech, Kai. The bazaar is closed to you. Get out.');
      return;
    }
    const priceMult = isSanctuary ? 2 : isBazaar ? (G.flags.path === 'fight' ? 0.8 : G.flags.path === 'join' ? 1.5 : 1) : 1;
    const p = this.openPanel(isPippa
      ? `<h2>PIPPA'S STALL — Indie Seller</h2><div class="sub">A small stall in Haven Village. No chain prices, no Rok logo — just what she found and made. ${G.cash} cash.</div>`
      : isBazaar
        ? `<h2>GRAND BAZAAR — Indie Stalls</h2><div class="sub">Stall sellers, haggling, unique finds. ${G.flags.path === 'fight' ? 'The resistance shops here — 20% off for fighters.' : G.flags.path === 'join' ? 'The company\'s people pay a premium here — prices are 50% higher.' : ''} ${G.cash} cash.</div>`
        : isPlaza
          ? `<h2>ROK PLAZA — Corporate Store</h2><div class="sub">Chain prices, fixed, Rok logo on everything. ${G.cash} cash.</div>`
          : isSanctuary
            ? `<h2>EXILE TRADER — Sanctuary</h2><div class="sub">Salvaged stock from the ancient world. No supply line out here — everything costs double. ${G.cash} cash.</div>`
            : `<h2>SHOP — Care Hub</h2><div class="sub">Run by Rin. Buy what you need, sell what you don't. ${G.cash} cash.</div>`);
    const stock = (isPippa
      ? ['net', 'trap', 'bandage', 'bread', 'berries', 'waterBottle', 'bait', 'string']
      : isBazaar
        ? ['net', 'trap', 'cage', 'snare', 'bandage', 'herbalSalve', 'bread', 'berries', 'waterBottle', 'bait', 'string', 'rope']
        : isSanctuary
          ? ['net', 'trap', 'bandage', 'herbalSalve', 'berries', 'bread', 'waterBottle', 'bait']
          : SHOP_STOCK).filter(id => itemDef(id));
    for (const id of stock) {
      const it = itemDef(id);
      const price = Math.max(1, Math.round(it.price * priceMult));
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<img class="item-thumb" src="${itemSprite(id)}" onerror="this.style.display='none'">
        <div style="flex:1"><b>${it.name}</b><br><span style="color:#5a6a9e;font-size:13px">${it.desc || ''}</span></div>
        <span style="font-weight:800;color:#1b3a9e">${price} cash</span>`;
      const buy = document.createElement('button');
      buy.style.width = 'auto'; buy.textContent = 'Buy';
      buy.disabled = G.cash < price;
      buy.onclick = () => {
        if (G.cash < price) return;
        G.cash -= price; addItem(id, 1); skillGain('Trading', 1); SFX.select();
        toast(`Bought ${it.name}!`);
        this.openShop(seller);
      };
      row.appendChild(buy);
      p.appendChild(row);
    }
    p.insertAdjacentHTML('beforeend', '<h3>Sell</h3>');
    const sellIds = Object.keys(G.bag).filter(id => itemDef(id) && itemDef(id).price > 0);
    if (!sellIds.length) p.insertAdjacentHTML('beforeend', '<p>Nothing to sell.</p>');
    for (const id of sellIds) {
      const it = itemDef(id);
      const sellPrice = Math.max(1, Math.floor(it.price / 2));
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div style="flex:1"><b>${it.name}</b> ×${G.bag[id]}</div><span style="font-weight:800;color:#1d9e56">${sellPrice} cash</span>`;
      const sell = document.createElement('button');
      sell.style.width = 'auto'; sell.textContent = 'Sell 1';
      sell.onclick = () => { removeItem(id, 1); G.cash += sellPrice; skillGain('Trading', 1); toast(`Sold ${it.name} for ${sellPrice} cash.`); this.openShop(seller); };
      row.appendChild(sell);
      p.appendChild(row);
    }
    this.closeButton(p, 'Leave Shop');
  },

  /* ---------------- crafting ---------------- */
  openCraft() {
    if (!G.flags.workbench) { toast('You need a workbench first — build one at your home plot.'); return; }
    const p = this.openPanel(`<h2>WORKBENCH</h2><div class="sub">Crafting skill: ${G.skills.Crafting.level} · Higher skill = faster, better quality.</div>`);
    for (const r of RECIPES) {
      const locked = r.level > G.skills.Crafting.level;
      const can = !locked && Object.entries(r.needs).every(([id, n]) => hasItem(id, n));
      const resDef = itemDef(r.result);
      const needs = Object.entries(r.needs).map(([id, n]) => `${(itemDef(id) || {}).name || id} ${n} (have ${G.bag[id] || 0})`).join(' + ');
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div style="flex:1"><b>${r.name}</b> → ${(resDef || {}).name || r.result} ×${r.qty || 1}${locked ? ` <span style="color:#c81e1e">(needs Crafting Lv ${r.level})</span>` : ''}<br><span style="color:#5a6a9e;font-size:13px">${needs}</span></div>`;
      const btn = document.createElement('button');
      btn.style.width = 'auto'; btn.textContent = 'Craft';
      btn.disabled = !can;
      btn.onclick = () => {
        for (const [id, n] of Object.entries(r.needs)) removeItem(id, n);
        addItem(r.result, r.qty || 1);
        skillGain('Crafting', 1);
        SFX.heal();
        toast(`Crafted ${(resDef || {}).name || r.result}!`);
        this.openCraft();
      };
      row.appendChild(btn);
      p.appendChild(row);
    }
    this.closeButton(p);
  },

  /* ---------------- base ---------------- */
  openBaseMenu() {
    const p = this.openPanel(`<h2>HOME PLOT</h2><div class="sub">Your base in Haven Village. Bigger base = more reputation in the area.</div>`);
    if (!G.flags.workbench) {
      const can = hasItem('wood', 4) && hasItem('stone', 2) && hasItem('nails', 1);
      this.panelButton(p, `🔨 Build Workbench — wood 4, stone 2, nails 1 (have ${G.bag.wood || 0}/${G.bag.stone || 0}/${G.bag.nails || 0})`, () => {
        if (!can) { toast('Not enough materials! Chop trees, break rocks, buy nails at the shop.'); return; }
        removeItem('wood', 4); removeItem('stone', 2); removeItem('nails', 1);
        G.flags.workbench = true; skillGain('Building', 2);
        toast('Workbench built! Crafting unlocked.');
        this.openBaseMenu();
      }, !can);
    } else {
      this.panelButton(p, '🔨 Use Workbench (Craft)', () => this.openCraft());
    }
    if (!G.flags.baseLevel) {
      const can = hasItem('wood', 10);
      this.panelButton(p, `🏕️ Build Base — wood 10 (have ${G.bag.wood || 0})`, () => {
        if (!can) { toast('Need 10 wood! Chop trees around the village.'); return; }
        removeItem('wood', 10);
        G.flags.baseLevel = 1; skillGain('Building', 3);
        toast('Your base is built! Reputation in Haven Village +1.');
        completeObjective('firstBase', 'build');
        completeObjective('firstBase', 'place');
        this.openBaseMenu();
      }, !can);
    } else {
      p.insertAdjacentHTML('beforeend', `<p>🏕️ <b>Base Level ${G.flags.baseLevel}</b> — reputation in Haven Village: ${G.flags.baseLevel}. (Bigger bases and upgrades come in the next pass.)</p>`);
    }
    // ---- Garage (TRANSPORT.md): bicycle + its 4 upgrades ----
    p.insertAdjacentHTML('beforeend', '<h3>🚲 Garage</h3>');
    if (!G.flags.hasBicycle) {
      this.panelButton(p, `🚲 Buy Bicycle — 50 cash (have ${G.cash}) · 2x walking speed`, () => {
        if (G.cash < 50) { toast('Not enough cash! A bicycle costs 50.'); return; }
        G.cash -= 50; G.flags.hasBicycle = true; G.flags.bikeUpgrades = {};
        SFX.fanfare();
        toast('You bought a bicycle! Ride it from the garage — twice as fast as walking.');
        this.openBaseMenu();
      }, G.cash < 50);
    } else {
      const up = G.flags.bikeUpgrades || {};
      this.panelButton(p, G.flags.ridingBike ? '🚲 Get off the bicycle' : '🚲 Ride the bicycle', () => {
        G.flags.ridingBike = !G.flags.ridingBike;
        toast(G.flags.ridingBike ? 'You hop on the bicycle. Twice as fast!' : 'You hop off the bicycle.');
        this.openBaseMenu();
      });
      const upgrades = [
        { id: 'tires', name: 'Off-road Tires', cost: '1 tire + 20 cash', need: () => hasItem('tire'), pay: () => { removeItem('tire', 1); G.cash -= 20; }, desc: 'Full speed on sand, dunes, snow and ice.' },
        { id: 'frame', name: 'Light Frame', cost: '2 scrap metal + 30 cash', need: () => hasItem('scrapMetal', 2), pay: () => { removeItem('scrapMetal', 2); G.cash -= 30; }, desc: 'Top speed up — the bike flies.' },
        { id: 'basket', name: 'Basket', cost: '2 wood + 1 string + 10 cash', need: () => hasItem('wood', 2) && hasItem('string'), pay: () => { removeItem('wood', 2); removeItem('string', 1); G.cash -= 10; }, desc: 'Gathering on the bike brings home +1 extra.' },
        { id: 'headlight', name: 'Headlight', cost: '1 scrap metal + 20 cash', need: () => hasItem('scrapMetal'), pay: () => { removeItem('scrapMetal', 1); G.cash -= 20; }, desc: 'Full speed at night — no more crawling in the dark.' },
      ];
      for (const u of upgrades) {
        if (up[u.id]) { p.insertAdjacentHTML('beforeend', `<p>✓ <b>${u.name}</b> — installed. ${u.desc}</p>`); continue; }
        const can = u.need() && G.cash >= parseInt(u.cost.match(/(\d+) cash/)[1]);
        this.panelButton(p, `🔧 ${u.name} — ${u.cost} · ${u.desc}`, () => {
          if (!u.need()) { toast('Missing the parts!'); return; }
          if (G.cash < parseInt(u.cost.match(/(\d+) cash/)[1])) { toast('Not enough cash!'); return; }
          u.pay(); up[u.id] = true; G.flags.bikeUpgrades = up;
          toast(`${u.name} installed!`);
          this.openBaseMenu();
        }, !can);
      }
    }
    // ---- Car (TRANSPORT.md): 5,000 cash, fast travel to visited towns, gasoline ----
    p.insertAdjacentHTML('beforeend', '<h3>🚗 Garage — Car</h3>');
    if (!G.flags.hasCar) {
      this.panelButton(p, `🚗 Buy Car — 5,000 cash (have ${G.cash}) · fast travel to visited towns · needs a car battery to start, gasoline per trip`, () => {
        if (G.cash < 5000) { toast('Not enough cash! A car costs 5,000.'); return; }
        G.cash -= 5000; G.flags.hasCar = true; G.flags.carUpgrades = {}; G.flags.carFuel = 0; G.flags.carTrips = 0;
        SFX.fanfare();
        toast('You bought a car! Buy gasoline and a car battery at the shop, then travel from the menu.');
        this.openBaseMenu();
      }, G.cash < 5000);
    } else {
      const cup = G.flags.carUpgrades || {};
      p.insertAdjacentHTML('beforeend', `<p>🚗 <b>Your car</b> — fuel ${G.flags.carFuel || 0}/${carFuelMax()} units · trips taken ${G.flags.carTrips || 0} · ${hasItem('carBattery') ? 'battery installed' : 'NO CAR BATTERY — buy one at the shop to drive'}. Each trip burns 1 fuel unit; buy gasoline at the shop to refuel.</p>`);
      this.panelButton(p, `⛽ Refuel — 1 gasoline → ${cup.engine ? 2 : 1} fuel unit${cup.engine ? 's (better engine)' : ''} (have ${G.bag.gasoline || 0})`, () => {
        if (!hasItem('gasoline')) { toast('No gasoline in the bag! Buy it at the shop.'); return; }
        if ((G.flags.carFuel || 0) >= carFuelMax()) { toast('The tank is full!'); return; }
        removeItem('gasoline', 1);
        G.flags.carFuel = Math.min(carFuelMax(), (G.flags.carFuel || 0) + (cup.engine ? 2 : 1));
        toast(`Refueled! Fuel is now ${G.flags.carFuel}/${carFuelMax()}.`);
        this.openBaseMenu();
      }, !hasItem('gasoline') || (G.flags.carFuel || 0) >= carFuelMax());
      const carUpgrades = [
        { id: 'engine', name: 'Better Engine', cost: '1 engine parts + 500 cash', need: () => hasItem('engineParts'), pay: () => { removeItem('engineParts', 1); G.cash -= 500; }, desc: 'Each gasoline refuels 2 fuel units instead of 1.' },
        { id: 'tank', name: 'Bigger Fuel Tank', cost: '2 scrap metal + 300 cash', need: () => hasItem('scrapMetal', 2), pay: () => { removeItem('scrapMetal', 2); G.cash -= 300; }, desc: 'Fuel capacity 5 → 10 units.' },
        { id: 'offroad', name: 'Off-road Tires', cost: '2 tires + 400 cash', need: () => hasItem('tire', 2), pay: () => { removeItem('tire', 2); G.cash -= 400; }, desc: 'The car can drive into the east wasteland (Rust Fields and beyond).' },
        { id: 'trunk', name: 'Bigger Trunk', cost: '3 wood + 2 scrap metal + 200 cash', need: () => hasItem('wood', 3) && hasItem('scrapMetal', 2), pay: () => { removeItem('wood', 3); removeItem('scrapMetal', 2); G.cash -= 200; }, desc: 'Room for a spare fuel can — refueling tops the tank up to full.' },
        { id: 'armor', name: 'Armor Plating', cost: '5 scrap metal + 800 cash', need: () => hasItem('scrapMetal', 5), pay: () => { removeItem('scrapMetal', 5); G.cash -= 800; }, desc: 'No more mutant ambushes on east road trips.' },
        { id: 'paint', name: 'Paint Job', cost: '2 scrap metal + 150 cash', need: () => hasItem('scrapMetal', 2), pay: () => { removeItem('scrapMetal', 2); G.cash -= 150; }, desc: 'Your car, your color. Pure style.' },
      ];
      for (const u of carUpgrades) {
        if (cup[u.id]) { p.insertAdjacentHTML('beforeend', `<p>✓ <b>${u.name}</b> — installed. ${u.desc}</p>`); continue; }
        const cashCost = parseInt(u.cost.match(/(\d+) cash/)[1]);
        const can = u.need() && G.cash >= cashCost;
        this.panelButton(p, `🔧 ${u.name} — ${u.cost} · ${u.desc}`, () => {
          if (!u.need()) { toast('Missing the parts!'); return; }
          if (G.cash < cashCost) { toast('Not enough cash!'); return; }
          u.pay(); cup[u.id] = true; G.flags.carUpgrades = cup;
          toast(`${u.name} installed!`);
          this.openBaseMenu();
        }, !can);
      }
    }
    this.panelButton(p, '😴 Rest until morning (heals party, regrows trees)', () => {
      healParty();
      G.day++; G.timeMin = 8 * 60;
      for (const m of Object.values(MAPS)) for (const o of m.objects) o.depleted = false;
      SFX.heal();
      toast('A new day dawns. Your party is healed and the trees have regrown.');
      this.closePanel();
    });
    this.closeButton(p);
  },

  // ---- Sanctuary base (pass 3) ----
  // The Sanctuary is a safe place, not a town — its "base" is a small camp you
  // build on the marked plot. It heals you, it marks the ancient world as home.
  openSanctuaryBase() {
    const p = this.openPanel(`<h2>SANCTUARY CAMP</h2><div class="sub">A cleared plot of ancient ground in the Sanctuary. The exiles' fire never goes out, and nothing hunts you here.</div>`);
    if (!G.flags.sanctuaryBase) {
      const can = hasItem('wood', 10);
      this.panelButton(p, `🏕️ Build a Sanctuary Camp — wood 10 (have ${G.bag.wood || 0})`, () => {
        if (!can) { toast('Need 10 wood! The giants\' canopy has plenty — chop a tree.'); return; }
        removeItem('wood', 10);
        G.flags.sanctuaryBase = true; skillGain('Building', 3);
        toast('Your Sanctuary camp is built. The exiles nod — you belong here now.');
        this.openSanctuaryBase();
      }, !can);
    } else {
      p.insertAdjacentHTML('beforeend', `<p>🏕️ <b>Your Sanctuary camp</b> — a tent, a fire, a fence of triceratops horns. The exiles trade with you now, and the camp counts as home in the ancient world.</p>`);
      this.panelButton(p, '😴 Rest by the fire (heals party, new day)', () => {
        healParty();
        G.day++; G.timeMin = 8 * 60;
        for (const m of Object.values(MAPS)) for (const o of m.objects) o.depleted = false;
        SFX.heal();
        toast('A new day dawns over the ancient world. Your party is healed.');
        this.closePanel();
      });
    }
    this.closeButton(p);
  },

  /* ---------------- travel (car + flying, pass 2) ---------------- */
  // Fast travel to visited outdoor places. Car: needs a car battery, burns 1 fuel
  // per trip, needs oil every 5th trip, needs off-road tires for the east. Flying:
  // needs HM SOAR (Bazaar Brawl) + a Bird creature in the party. Free and instant.
  openTravelMenu() {
    const p = this.openPanel(`<h2>TRAVEL</h2><div class="sub">Fast travel to places you have already visited. 🚗 Car: ${G.flags.hasCar ? `fuel ${G.flags.carFuel || 0}/${carFuelMax()}${hasItem('carBattery') ? '' : ' · NO CAR BATTERY'}` : 'no car yet — buy one at the garage (5,000 cash)'}. 🦅 Fly: ${canFly() ? (partyBird() ? `on your ${partyBird().name}` : 'needs a Bird creature in the party') : 'needs HM SOAR — win the Bazaar Brawl'}.</div>`);
    const INTERIORS = ['hub', 'arena', 'forestArena', 'reefArena', 'emberArena', 'bazaarArena', 'frostArena', 'universityArena', 'bazaar'];
    // Pass 3 — the cave and the ancient world are never travel destinations:
    // the car can't drive into the Long Dark, and you can't fly there either.
    // The cave is the only way in, and the same trip back is the only way out.
    const ANCIENT_WORLD = ['caveMouth', 'caveDeep', 'caveGate', 'rexBadlands', 'hornedPlains', 'mammothSteppe', 'direDen', 'raptorGrass', 'saberFields', 'sanctuary', 'deepRiver', 'megalodonDeep', 'armoredReef', 'seaScorpion', 'spiralShoals', 'pteroCliffs', 'highPeaks', 'giantsCanopy', 'spidersHollow', 'deepForest', 'burningMarsh', 'devilsPond', 'darkCaves'];
    const SPAWN = { haven: [11, 7], meadow: [15, 9], woods: [13, 9], oasis: [13, 9], howling: [13, 9], grizzly: [13, 9], frozen: [13, 9], iceLake: [13, 9], coldSpring: [13, 9], ember: [13, 9], antColony: [13, 9], reef: [13, 9], tidepools: [13, 9], butterfly: [13, 9], deepTrench: [13, 9], mangrove: [13, 9], rokCity: [14, 9], university: [12, 10], rustFields: [13, 9], ashenFlats: [13, 9], wreckyard: [13, 9], hollow: [13, 9], echoCaves: [13, 9], rexBadlands: [13, 9], hornedPlains: [13, 9], mammothSteppe: [13, 9], direDen: [13, 9], raptorGrass: [13, 9], saberFields: [13, 9], sanctuary: [13, 9], deepRiver: [13, 9], megalodonDeep: [13, 9], armoredReef: [13, 9], seaScorpion: [13, 9], spiralShoals: [13, 9], pteroCliffs: [13, 9], highPeaks: [13, 9], giantsCanopy: [13, 9], spidersHollow: [13, 9], deepForest: [13, 9], burningMarsh: [13, 9], devilsPond: [13, 9], darkCaves: [13, 9] };
    const dests = Object.keys(G.flags.visited || {}).filter(id => MAPS[id] && !INTERIORS.includes(id) && !ANCIENT_WORLD.includes(id) && id !== G.player.map);
    if (!dests.length) { p.insertAdjacentHTML('beforeend', '<p>No other places visited yet — explore first!</p>'); }
    // Pass 3 — the ancient world never shows up here, so say so once.
    if ((G.flags.visited || {}).sanctuary || (G.flags.visited || {}).rexBadlands) {
      p.insertAdjacentHTML('beforeend', '<p style="color:#5a6a9e;font-size:13px">The Long Dark and the ancient world are not on this list — no car or flyer gets in. The cave in the Echo Caves is the only way in, and the same trip back is the only way out.</p>');
    }
    for (const id of dests) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<div style="flex:1"><b>${MAPS[id].label}</b></div>`;
      const east = ['rustFields', 'ashenFlats', 'wreckyard', 'hollow', 'echoCaves'].includes(id);
      const drive = document.createElement('button');
      drive.style.width = 'auto'; drive.textContent = '🚗 Drive (1 fuel)';
      drive.disabled = !G.flags.hasCar || !hasItem('carBattery') || (G.flags.carFuel || 0) < 1 || (east && !(G.flags.carUpgrades || {}).offroad);
      drive.onclick = () => { SFX.select(); this.travelTo(id, 'car'); };
      const fly = document.createElement('button');
      fly.style.width = 'auto'; fly.textContent = '🦅 Fly (free)';
      fly.disabled = !canFly() || !partyBird();
      fly.onclick = () => { SFX.select(); this.travelTo(id, 'fly'); };
      row.appendChild(drive); row.appendChild(fly);
      p.appendChild(row);
    }
    this.closeButton(p);
  },
  travelTo(mapId, mode) {
    const east = ['rustFields', 'ashenFlats', 'wreckyard', 'hollow', 'echoCaves'].includes(mapId);
    if (mode === 'car') {
      if (!carReady()) { toast('The car needs a car battery in your bag to start!'); return; }
      if ((G.flags.carFuel || 0) < 1) { toast('No fuel! Buy gasoline at the shop and refuel at the garage.'); return; }
      if (east && !(G.flags.carUpgrades || {}).offroad) { toast('The east wasteland needs off-road tires — install them at the garage.'); return; }
      if (((G.flags.carTrips || 0) + 1) % 5 === 0 && !hasItem('oil')) { toast('The engine needs oil for this trip! Buy oil at the shop.'); return; }
      if (((G.flags.carTrips || 0) + 1) % 5 === 0) { removeItem('oil', 1); toast('Oil change done — the engine purrs.'); }
      G.flags.carFuel--; G.flags.carTrips = (G.flags.carTrips || 0) + 1;
      G.flags.ridingBike = false;
    } else {
      if (!canFly() || !partyBird()) { toast('You need HM SOAR and a Bird creature in the party to fly.'); return; }
    }
    const SPAWN = { haven: [11, 7], meadow: [15, 9], woods: [13, 9], oasis: [13, 9], howling: [13, 9], grizzly: [13, 9], frozen: [13, 9], iceLake: [13, 9], coldSpring: [13, 9], ember: [13, 9], antColony: [13, 9], reef: [13, 9], tidepools: [13, 9], butterfly: [13, 9], deepTrench: [13, 9], mangrove: [13, 9], rokCity: [14, 9], university: [12, 10], rustFields: [13, 9], ashenFlats: [13, 9], wreckyard: [13, 9], hollow: [13, 9], echoCaves: [13, 9] };
    const [sx, sy] = SPAWN[mapId] || [13, 9];
    this.closePanel();
    if (mode === 'car') toast(`Driving to ${MAPS[mapId].label}...`);
    else toast(`${partyBird().name} carries you to ${MAPS[mapId].label}!`);
    changeMap(mapId, sx, sy);
    // east road trips without armor plating risk a mutant ambush (25%)
    if (mode === 'car' && east && !(G.flags.carUpgrades || {}).armor && chance(0.25)) {
      setTimeout(() => {
        if (G.state === 'overworld') {
          UI.dialog('Kai', 'A mutant bursts out of the scrap and blocks the road!', () => startWildBattle(MAPS[mapId].area));
        }
      }, 900);
    }
  },
  // The Choice can be switched ONCE — the old side goes permanently hostile and the
  // current path mission is abandoned (shown as ABANDONED in the missions panel).
  switchPath() {
    const oldPath = G.flags.path;
    const newPath = oldPath === 'fight' ? 'join' : 'fight';
    const oldName = oldPath === 'fight' ? 'the resistance' : 'Cyber Tech';
    const newName = newPath === 'fight' ? 'the resistance' : 'Cyber Tech';
    UI.choice('Switch Sides?', `You are on the ${oldPath === 'fight' ? 'FIGHT' : 'JOIN'} path. Switching to ${newName} is a ONE-TIME choice — ${oldName} will turn permanently hostile, and your current path mission will be abandoned.`, [
      {
        label: `Switch to ${newName}`, onPick: () => {
          const am = activeMission();
          if (am) { G.missions[am.id].status = 'done'; G.missions[am.id].abandoned = true; }
          G.flags.path = newPath; G.flags.switched = true;
          G.flags['hostile_' + oldPath] = true;
          setMission(newPath === 'fight' ? 'leak' : 'interview', 'active');
          toast(`You switched sides. ${oldName === 'the resistance' ? 'Mara' : 'Caleb'} will never trust you again.`);
          saveGame(true);
        },
      },
      { label: 'Stay on my current side', onPick: () => {} },
    ]);
  },

  /* ---------------- badge / skills ---------------- */
  openBadge() {
    const titles = [];
    if (G.flags.champion) titles.push('Rookie Cup Champion');
    if (G.flags.forestClashChampion) titles.push('Forest Clash Champion');
    if (G.flags.reefRumbleChampion) titles.push('Reef Rumble Champion');
    if (G.flags.desertHeatChampion) titles.push('Desert Heat Champion');
    if (G.flags.bazaarBrawlChampion) titles.push('Bazaar Brawl Champion');
    if (G.flags.frostCrownChampion) titles.push('Frost Crown Champion');
    if (G.flags.universityGamesChampion) titles.push('University Games Champion');
    if (G.flags.wastelandWarChampion) titles.push('Wasteland War Champion');
    if (G.flags.rokCityChampionshipChampion) titles.push('Rok City Champion');
    if (G.flags.ancientCrownChampion) titles.push('Ancient Champion');
    const titleLine = titles.length ? '🏆 ' + titles[titles.length - 1] : 'Rookie';
    const p = this.openPanel(`<h2>ID BADGE — KAI</h2><div class="sub">Meta Trainer · Haven Village · ${titleLine}</div>`);
    p.insertAdjacentHTML('beforeend', `<div class="row"><b>Cash</b> ${G.cash}</div><div class="row"><b>Play time</b> ${Math.floor(G.playtime / 60)} min · Day ${G.day}</div><div class="row"><b>Creatures caught</b> ${G.flags.caughtCount || 0}</div>`);
    // Pass 3 — the Ancient Crown is the last tournament; the mystery hunts are the last catches.
    if (G.flags.ancientCrownChampion) p.insertAdjacentHTML('beforeend', '<div class="row">🏆 <b>Ancient Champion</b> — won the Ancient Crown in the Echo Caves. The Long Dark is open.</div>');
    const mysteryCount = ['M1', 'M2', 'M3', 'M4', 'M5'].filter(id => G.flags['caught_' + id]).length;
    if (mysteryCount) p.insertAdjacentHTML('beforeend', `<div class="row">🔍 <b>Mystery creatures</b> ${mysteryCount}/5 caught — Spinosaurus, Quetzalcoatlus, Titanoboa, Megatherium, Giant Vampire Bat.</div>`);
    if (G.flags.path) {
      const rankNames = ['', 'Intern', 'Associate', 'Manager', 'Director', 'Executive'];
      const pathLine = G.flags.path === 'fight'
        ? '⚔️ <b>Path:</b> Fight the system — Mara\'s resistance' + (G.flags.switched ? ' (switched sides once — the company is hostile)' : '')
        : '🏢 <b>Path:</b> Join Cyber Tech — rank ' + rankNames[G.flags.corpRank || 1] + (G.flags.switched ? ' (switched sides once — the resistance is hostile)' : '');
      p.insertAdjacentHTML('beforeend', `<div class="row">${pathLine}</div>`);
    }
    if (G.flags.hasCar) p.insertAdjacentHTML('beforeend', `<div class="row">🚗 <b>Car:</b> fuel ${G.flags.carFuel || 0}/${carFuelMax()} · trips ${G.flags.carTrips || 0}${(G.flags.carUpgrades && Object.keys(G.flags.carUpgrades).length) ? ' · upgrades: ' + Object.keys(G.flags.carUpgrades).join(', ') : ''}</div>`);
    if (G.flags.hasBicycle) p.insertAdjacentHTML('beforeend', `<div class="row">🚲 <b>Bicycle:</b> ${(G.flags.bikeUpgrades && Object.keys(G.flags.bikeUpgrades).length) ? Object.keys(G.flags.bikeUpgrades).join(', ') : 'no upgrades yet'}</div>`);
    p.insertAdjacentHTML('beforeend', '<h3>Skills — level up by doing</h3>');
    for (const s of SKILL_LIST) {
      const sk = G.skills[s];
      const badge = sk.level >= 10 ? '🏅 Mastery' : sk.level >= 5 ? '📜 Certified' : '';
      const pct = Math.min(100, Math.round((sk.xp / (SKILL_XP_PER_LEVEL[sk.level] || 275)) * 100));
      p.insertAdjacentHTML('beforeend', `<div class="row"><b>${s}</b><span>Lv ${sk.level}</span><div class="bar"><div style="width:${pct}%"></div></div><span>${badge}</span></div>`);
    }
    p.insertAdjacentHTML('beforeend', '<h3>Tournament Titles</h3>');
    if (!titles.length) p.insertAdjacentHTML('beforeend', '<p>No titles yet. Win the Rookie Cup at the Mirage Oasis!</p>');
    else for (const t of titles) p.insertAdjacentHTML('beforeend', `<p>🏆 <b>${t}</b></p>`);
    p.insertAdjacentHTML('beforeend', `<p style="color:#5a6a9e">Creatures caught: ${G.flags.caughtCount || 0} · Maps visited: ${Object.keys(G.flags.visited || {}).length}</p>`);
    this.closeButton(p);
  },
  openMissions() {
    const p = this.openPanel('<h2>MISSIONS</h2><div class="sub">Main story missions, in order. Side quests too.</div>');
    if (G.flags.path) {
      const rankNames = ['', 'Intern', 'Associate', 'Manager', 'Director', 'Executive'];
      p.insertAdjacentHTML('beforeend', `<p style="color:#1b3a9e;font-weight:700">${G.flags.path === 'fight' ? '⚔️ You fight the system with Mara\'s resistance.' : '🏢 You joined Cyber Tech — rank ' + rankNames[G.flags.corpRank || 1] + '.'}${G.flags.switched ? ' (You switched sides once — the old side is hostile.)' : ''}</p>`);
    }
    for (const m of MISSIONS) {
      const st = missionStatus(m.id);
      const abandoned = G.missions[m.id] && G.missions[m.id].abandoned;
      const cls = abandoned ? 'mission-locked' : st === 'done' ? 'mission-done' : st === 'active' ? 'mission-active' : 'mission-locked';
      const label = abandoned ? 'ABANDONED' : st === 'done' ? '✓ DONE' : st === 'active' ? '★ ACTIVE' : 'LOCKED';
      const objLines = (st === 'active' || st === 'done')
        ? m.objectives.map(o => {
          const done = st === 'done' || objectiveDone(m.id, o.id);
          return `<div style="font-size:13px;color:${done ? '#1d9e56' : '#5a6a9e'}">${done ? '✓' : '○'} ${o.text}</div>`;
        }).join('')
        : '';
      p.insertAdjacentHTML('beforeend', `<div class="row"><b>${m.name}</b><span class="${cls}">${label}</span></div><p style="color:#5a6a9e;font-size:13px;margin:-2px 0 8px">${m.desc}</p>${objLines}`);
    }
    this.closeButton(p);
  },
  openWorldMap() {
    const p = this.openPanel('<h2>WORLD MAP</h2><div class="sub">The world of Metamonsters — west is civilization (Rok City, the Grand Bazaar, Rok University), east is the wasteland (Rust Fields, Ashen Flats, Wreckyard, the Hollow, the Echo Caves). The Echo Caves lead through the Long Dark to the 75+ world — the ancient world, open to the Ancient Champion.</div>');
    p.insertAdjacentHTML('beforeend', '<img src="assets/map/world-map.png" style="width:100%;border:2px solid #1b2a52;border-radius:8px">');
    this.closeButton(p);
  },
};

/* The Choice (pass 2): Mara offers the resistance, Caleb offers the Cyber Tech job.
   Both NPCs can present it; the choice panel sets G.flags.path BEFORE completing
   the objective, so completeMission('theChoice') forks to the right path. */
function offerChoice() {
  UI.choice('The Choice', 'The scandal is out. Mara offers you the resistance — fight the system from the bazaar. Caleb offers you a Cyber Tech job — join the corruption and climb the ladder. Choose a side. (You can switch once later, at a cost.)', [
    {
      label: '⚔️ FIGHT — join Mara\'s resistance', onPick: () => {
        G.flags.path = 'fight';
        completeObjective('theChoice', 'choice');
        UI.dialog('Mara', 'Good. The bazaar is with you, Kai. The company owns the towers — but we own the streets. First: leak what we know. Come see me when you\'re ready.');
      },
    },
    {
      label: '🏢 JOIN — take Caleb\'s Cyber Tech job', onPick: () => {
        G.flags.path = 'join';
        completeObjective('theChoice', 'choice');
        UI.dialog('Caleb', 'Smart. Report to the Ivory Tower — interview first, then the ladder. Intern to Executive, Kai. The company takes care of its own.');
      },
    },
  ]);
}

/* ---------------- NPC dialog ---------------- */
const NPC_DIALOG = {
  marcus(npc) {
    if (missionStatus('lastStarter') === 'active') {
      completeObjective('lastStarter', 'meet');
      UI.dialogSeq([
        { name: 'Marcus', text: 'Kai! You made it. Sofia and I already picked our starters — first come, first served. That leaves ONE for you.' },
        { name: 'Marcus', text: 'Bear Cub, Wolf Cub, Baby Shark — which one is left for you? Pick, and I\'ll tell you who took what.' },
      ], () => {
        if (G.party.length) return;
        const giveStarter = (fam) => {
          assignStarters(fam);
          const dex = starterFamilyDex(fam);
          const s = makeCreature(dex, 5); G.party.push(s);
          G.flags.hasAxe = true; addItem('axe', 1);
          completeObjective('lastStarter', 'watch');
          completeObjective('lastStarter', 'pick');
          UI.dialog('Kai', `${DEX[dex].name} joined the party! Marcus also handed you an axe. (Axe added to your bag.) Marcus took the ${starterDisplayName(G.flags.marcusStarter)}, Sofia took the ${starterDisplayName(G.flags.sofiaStarter)}.`);
        };
        UI.choice('The Last Starter', 'Marcus and Sofia picked first. Which starter is left for Kai?', [
          { label: '🐻 Bear Cub — Mammal + Hearing · hunts, great defense', onPick: () => giveStarter('bear') },
          { label: '🐺 Wolf Cub — Mammal + Smell · tracks scents', onPick: () => giveStarter('wolf') },
          { label: '🦈 Baby Shark — Fish + Electroreception · crosses small water', onPick: () => giveStarter('shark') },
        ]);
      });
      return;
    }
    if (missionStatus('firstWood') === 'active') {
      UI.dialog('Marcus', `Chop 10 wood from the trees around the village — you've got ${G.bag.wood || 0}/10. The axe is in your bag. Then we'll build your base.`);
      return;
    }
    if (missionStatus('firstCatch') === 'active') {
      UI.dialog('Marcus', 'Tall grass is where the wild ones hide. Weaken them first, then throw a net or a trap. Nets are best on small ones — stage 1.');
      return;
    }
    if (missionStatus('firstBase') === 'active') {
      UI.dialog('Marcus', 'Build at your home plot — the dirt patch by your house. Workbench first, then the base itself. Wood, stone, nails.');
      return;
    }
    if (missionStatus('starterPath') === 'active') {
      const fam = starterFamily();
      const lines = {
        bear: [
          'Your base is up. Now your starter\'s path. Your bear cub can HUNT — track your first animal in the Grizzly Den, north through the woods and past the Howling Peaks. Take it down.',
          'That\'s the bear\'s gift. Great defense, great resilience — and nobody robs a bear trainer. Go prove it.',
        ],
        wolf: [
          'Your base is up. Now your starter\'s path. Your wolf cub can TRACK SCENTS — follow the scent trail through the Whispering Woods. Three scents, then a lost pup at the end of the trail.',
          'That\'s the wolf\'s gift. The hunters are out there too, so keep your cub close. Go prove it.',
        ],
        shark: [
          'Your base is up. Now your starter\'s path. Your shark can cross the small pond on the Meadow Route — no HM SWIM needed. Cross it and reach the far bank.',
          'That\'s the shark\'s gift. Bear cubs hunt, wolf cubs track scents — your shark swims. Go prove it.',
        ],
      };
      UI.dialogSeq(lines[fam].map(t => ({ name: 'Marcus', text: t })), () => completeObjective('starterPath', 'path'));
      return;
    }
    if (missionStatus('starterPathBear') === 'active') {
      UI.dialog('Marcus', 'Track your first animal in the Grizzly Den hunting ground — north through the woods, past the Howling Peaks. Then take it down.');
      return;
    }
    if (missionStatus('starterPathWolf') === 'active') {
      UI.dialog('Marcus', 'Follow the scent trail in the Whispering Woods — three scents, then the lost pup. Your wolf cub will lead the way.');
      return;
    }
    if (missionStatus('starterPathShark') === 'active') {
      UI.dialog('Marcus', 'Cross the small pond on the Meadow Route with your shark — no HM SWIM needed. Reach the far bank on the east side.');
      return;
    }
    if (missionStatus('firstTournament') === 'active') {
      UI.dialog('Marcus', 'The Rookie Cup is at the Mirage Oasis — east through the meadow. I\'m in the final. Beat me if you can, Kai.');
      return;
    }
    if (missionStatus('quietFriendsPath') === 'active') {
      completeObjective('quietFriendsPath', 'marcus');
      UI.dialog('Marcus', 'Caleb? He\'s been weird since he got to the university — secretive, all company this and company that. He\'s my best friend, Kai, but... just watch him. Something\'s off.');
      return;
    }
    // Phase 2 + later missions: a hint for whatever is active
    const hints = {
      foreclosure: 'Did you hear? A shop in the village is closing down. Talk to the owner — something\'s off about it.',
      lawsuitTV: 'A lawsuit on Rok Tube, about Cyber Tech. Watch the TV in the Care Hub — that\'s where the news plays.',
      peopleTalking: 'Everyone\'s talking about the company. Talk to five people — Elder Mara, Ranger Dee, Old Finn, Rin, even Caleb. Hear what they\'re saying.',
      smallShops: 'Pippa\'s trying to open a little stall where the shop closed. Buy something from her — help her get started.',
      sickAnimals: 'Sick animals on the east edge of the meadow. Find the poor thing and heal it — bring medicine.',
      quietFriendLeaves: 'Caleb\'s leaving for Rok University. Go say goodbye — he\'s got things to say, if you listen.',
      secondTournament: 'The Forest Clash is in the Whispering Woods — and Sofia\'s waiting in the final. She wants her revenge.',
      thirdTournament: 'The Reef Rumble is at the Coral Reef. The Champion there has never lost in the reef. Beat him and you\'ll earn HM SWIM.',
      labLog: 'An abandoned building in the Ember Dunes — east, past the oasis. Search it. If there\'s a lab log, read it.',
      coldNorth: 'The cold north is waiting — the Howling Peaks, the Grizzly Den, the Frozen Roost. Go see them all.',
      coast: 'The coast is waiting — the Coral Reef, the Tide Pools, Butterfly Island. Go see them all.',
      rokCity: 'Rok City — the big city, west through Haven Village. Towers, the bazaar, the university. That\'s where the story goes next, Kai.',
      universityKids: 'The university kids are brawling in the quad at Rok University. Go sort them out — someone\'s going to get hurt.',
      corruption: 'A drug deal in the city, Kai. The bazaar. Someone\'s selling more than snacks down there — go see it with your own eyes.',
      flock: 'The police flock — Rok\'s drones, all over the city. They flagged me once for standing still too long. Talk to the officer by the plaza.',
      fourthTournament: 'The Desert Heat is in the Ember Dunes — the arena\'s right there in the sand. Levels 20 to 30. The Sand King is waiting.',
      fifthTournament: 'The City Tournament — the Bazaar Brawl, in the Grand Bazaar. Sixteen trainers, levels 30 to 40. Win it and you earn HM SOAR.',
      sixthTournament: 'The Frost Crown is at the Frozen Roost — sixteen trainers, levels 40 to 50. The Frost Queen does not lose. Usually.',
      seventhTournament: 'The University Games — at the Ivory Tower, against Caleb himself. Sixteen trainers, levels 50 to 60. Beat him, Kai.',
      theChoice: 'The Choice, Kai. Mara in the bazaar, or Caleb and the company. Whatever you pick — I\'m with you. Sofia follows me. That\'s how it is.',
      dumpSite: 'The dump site is in the Wreckyard, east past the Rust Fields. That\'s where the barrels went. Bring back proof.',
      theEast: 'The east is open now — Rust Fields, Ashen Flats, the Wreckyard. Mutants, Kai. Real ones. Be careful.',
      theMutants: 'Catch three mutants out east. They\'re stronger, harder to trap — and the Fight path makes them bond easier. Or so Mara says.',
      theWreckyard: 'The Wreckyard — talk to the scavenger there. He knows where the dump site really is.',
      theCave: 'The Echo Caves, past the Hollow. A level-80 mutant alpha guards the gate to the Long Dark. You\'ll need everything you\'ve got.',
      finalBattle: 'The final battle, Kai. Whoever you fight — the champion or the resistance leader — the whole city is watching. Make it count.',
    };
    const am = activeMission();
    if (am && hints[am.id]) { UI.dialog('Marcus', hints[am.id]); return; }
    if (G.flags.champion) {
      UI.dialog('Marcus', 'You beat me in the final. Fair and square. The Rookie Cup is yours, Kai — but this is just the start.');
      return;
    }
    UI.dialog('Marcus', 'The meadow is full of wild creatures. Keep training — the tournaments only get harder from here.');
  },
  sofia(npc) {
    if (missionStatus('lastStarter') === 'active') {
      if (!G.flags.starter) {
        UI.dialog('Sofia', 'Marcus picked first and I picked second — the last starter is yours, Kai. Talk to Marcus, he\'s the one with the choice.');
        return;
      }
      UI.dialog('Sofia', `Marcus took the ${starterDisplayName(G.flags.marcusStarter)}, I took the ${starterDisplayName(G.flags.sofiaStarter)} — so the ${starterDisplayName(G.flags.starter)} is yours, Kai. Try not to get bitten. Talk to Marcus when you're ready.`);
      return;
    }
    if (missionStatus('secondTournament') === 'active') {
      UI.dialog('Sofia', 'The Forest Clash final is me, Kai. My bear and my eagle are waiting in the Whispering Woods. This time, I win.');
      return;
    }
    UI.dialog('Sofia', 'My bear cub is already stronger than your starter. Prove me wrong at the Rookie Cup, Kai. The arena is at the Mirage Oasis.');
  },
  caleb(npc) {
    if (missionStatus('theChoice') === 'active') { offerChoice(); return; }
    if (missionStatus('interview') === 'active') {
      if (!objectiveDone('interview', 'talk')) {
        completeObjective('interview', 'talk');
        UI.dialog('Caleb', 'The interview is at the Ivory Tower — just be yourself, Kai. Well, be the version of yourself that wants a Cyber Tech salary. Go to the tower and get hired.');
        return;
      }
      UI.dialog('Caleb', 'The interview is at the Ivory Tower. Go get the job — then we climb the ladder together.');
      return;
    }
    if (missionStatus('ladder') === 'active') {
      if (!objectiveDone('ladder', 'talk')) {
        completeObjective('ladder', 'talk');
        UI.dialog('Caleb', 'The ladder: do the jobs, get promoted. Intern, Associate, Manager, Director, Executive. First job — deliver the paperwork to the Plaza Clerk. The company runs on paper, Kai.');
        return;
      }
      UI.dialog('Caleb', 'Deliver the paperwork to the Plaza Clerk. Then the promotions start coming.');
      return;
    }
    if (missionStatus('quietFriendsPath') === 'active') {
      if (!objectiveDone('quietFriendsPath', 'talk')) {
        completeObjective('quietFriendsPath', 'talk');
        UI.dialog('Caleb', 'Listen. Marcus and Sofia — they can\'t know what we\'re doing. Not yet. Keep it quiet, Kai. The company rewards discretion. Go talk to Marcus like nothing happened.');
        return;
      }
      UI.dialog('Caleb', 'Quiet, Kai. The friends can\'t know. Not yet.');
      return;
    }
    if (missionStatus('dirtyWork') === 'active') {
      if (!objectiveDone('dirtyWork', 'resistanceFighter')) {
        UI.dialog('Caleb', 'The dirty work: a resistance fighter is causing trouble for the company. Handle it. This is what the salary is for.', () => startTrainerBattle({
          name: 'Resistance Fighter', team: [{ dex: '002', level: 50 }, { dex: '014', level: 49 }],
          bg: 'battle-city.png', intro: 'Company dog! The resistance doesn\'t bow to Elsa Rok!',
          battleTag: 'resistanceFighter',
        }));
        return;
      }
      if (!objectiveDone('dirtyWork', 'talk')) {
        completeObjective('dirtyWork', 'talk');
        UI.dialog('Caleb', 'Done. The company noticed — Director is next. Keep climbing, Kai.');
        return;
      }
      UI.dialog('Caleb', 'The dirty work is done. The ladder is waiting.');
      return;
    }
    if (missionStatus('executive') === 'active') {
      if (!objectiveDone('executive', 'talk')) {
        completeObjective('executive', 'talk');
        UI.dialog('Caleb', 'Executive. The top of the ladder, Kai — 200,000 a week, free Rok Prime, and the company\'s prize lab subject. Go to the Ivory Tower and take your seat.');
        return;
      }
      UI.dialog('Caleb', 'The executive office is in the Ivory Tower. Go take your seat, Kai.');
      return;
    }
    if (missionStatus('finalBattle') === 'active' && G.flags.path === 'join') {
      UI.dialog('Caleb', 'The final battle, Kai. The resistance leader fights for Mara in the city arena — beat her, and the company owns the city. No mercy.', () => startTrainerBattle({
        name: 'Resistance Leader', team: [{ dex: '006', level: 72 }, { dex: '024', level: 71 }, { dex: '036', level: 74 }],
        bg: 'battle-city.png', intro: 'So the company sent its new executive to kill me. Come on, then — the bazaar is watching.',
        battleTag: 'finalBoss',
      }));
      return;
    }
    if (missionStatus('peopleTalking') === 'active') {
      completeObjective('peopleTalking', 'caleb');
      UI.dialog('Caleb', 'Cyber Tech buying shops? Of course they are. They own everything already — the phones, the Tube, the games. Elsa Rok is a genius. You\'ll see when I\'m an executive.');
      return;
    }
    if (missionStatus('quietFriendLeaves') === 'active') {
      UI.dialogSeq([
        { name: 'Caleb', text: 'So. Rok University. I got in — full ride, basically. I\'m going to be an executive at Cyber Tech.' },
        { name: 'Caleb', text: 'Meta uses people like us to catch monsters and sell the resources. Uck Berg is evil, Kai — everyone knows it. But Elsa Rok? She\'s a genius. Rok AI runs the world, and I\'m going to run it with her.' },
        { name: 'Caleb', text: 'Don\'t look at me like that. Go catch your monsters. I\'ll be the one signing the checks.' },
      ], () => completeObjective('quietFriendLeaves', 'goodbye'));
      return;
    }
    UI.dialog('Caleb', 'Monster catching? Meta uses people like us to catch and train monsters, then sells the resources. I\'m going to Rok University instead — Elsa Rok and Rok AI are genius. You\'ll see.');
  },
  elder(npc) {
    if (missionStatus('foreclosure') === 'active') {
      completeObjective('foreclosure', 'why');
      UI.dialog('Elder Mara', 'The shops are closing because Cyber Tech is buying the whole street, one storefront at a time. They offer cash, the owners can\'t refuse — and then the shop is gone. This village is next if nobody notices.');
      return;
    }
    if (missionStatus('peopleTalking') === 'active') {
      completeObjective('peopleTalking', 'elder');
      UI.dialog('Elder Mara', 'People are talking, and they\'re right to. The company smiles and buys, and the little shops die. Even the animals east of here are getting sick — have you seen them?');
      return;
    }
    UI.dialog('Elder Mara', 'Welcome to Haven Village, child. West is civilization — Rok City, the bazaar, the university. East... east is the wasteland. It gets bad first over there. Not every town out there loves travelers like the stories say. Some will chase you right out.');
  },
  shopkeeper(npc) {
    if (missionStatus('peopleTalking') === 'active') {
      completeObjective('peopleTalking', 'rin');
      UI.dialog('Shopkeeper Rin', 'The company offered to buy my shop too. I said no — for now. They\'ll be back with a bigger number. Everyone has a number, Kai. Even me, maybe.', () => UI.openShop());
      return;
    }
    UI.openShop();
  },
  ranger(npc) {
    if (missionStatus('peopleTalking') === 'active') {
      completeObjective('peopleTalking', 'ranger');
      UI.dialog('Ranger Dee', 'Bashing the company? Everyone is. Cyber Tech\'s been buying land east of the woods — and the animals out there are getting sick. I found a frog with patchy skin last week. Something\'s in the water.');
      return;
    }
    if (!G.flags.rangerGift) {
      G.flags.rangerGift = true; addItem('trap', 1);
      UI.dialog('Ranger Dee', 'The woods are thick with wild creatures — good hunting ground. Here, take a trap. And if you ever catch a scent trail... follow it. That\'s how the wolves find what\'s lost.');
      return;
    }
    UI.dialog('Ranger Dee', 'The Whispering Woods are the home of Bird + Smell creatures. Listen — you can hear the forest birds before you see them.');
  },
  fisherman(npc) {
    if (missionStatus('peopleTalking') === 'active') {
      completeObjective('peopleTalking', 'finn');
      UI.dialog('Old Finn', 'The company? They\'re buying the whole coast, boy. And the fish are acting strange — the eels near the reef haven\'t been right since the barrels showed up east. Barrels, Kai. In the water.');
      return;
    }
    if (!G.flags.finnGift) {
      G.flags.finnGift = true; addItem('bait', 3);
      UI.dialog('Old Finn', 'The pond on the meadow and the pool at the oasis are full of fish creatures. Take some bait — you\'ll need a fishing rod from the shop to use it.');
      return;
    }
    UI.dialog('Old Finn', 'Fish creatures love the deep water. A shark starter can swim small water early — that\'s a gift, Kai. Don\'t waste it.');
  },
  arenamaster(npc) {
    const cupMap = { arena: 'rookieCup', forestArena: 'forestClash', reefArena: 'reefRumble', emberArena: 'desertHeat', bazaarArena: 'bazaarBrawl', frostArena: 'frostCrown', universityArena: 'universityGames', rustArena: 'wastelandWar', cityArena: 'rokCityChampionship', caveArena: 'ancientCrown' };
    const cupId = cupMap[G.player.map] || 'rookieCup';
    const cup = TOURNAMENTS.find(t => t.id === cupId);
    const missionMap = { rookieCup: 'firstTournament', forestClash: 'secondTournament', reefRumble: 'thirdTournament', desertHeat: 'fourthTournament', bazaarBrawl: 'fifthTournament', frostCrown: 'sixthTournament', universityGames: 'seventhTournament', wastelandWar: 'eighthTournament', rokCityChampionship: 'ninthTournament', ancientCrown: 'tenthTournament' };
    const missionId = missionMap[cupId];
    const unlockName = { 'HM SLICE': 'HM SLICE', antColony: 'the Ant Colony', 'HM SWIM': 'HM SWIM', scorpionsNest: "the Scorpion's Nest", hmSOAR: 'HM SOAR', iceLake: 'Ice Lake', rokCity: 'Rok City', 'HM LIGHT': 'HM LIGHT', 'HM DIVE': 'HM DIVE', longDarkExit: 'the Long Dark exit gate' }[cup.reward.unlock] || cup.reward.unlock;
    if (missionStatus(missionId) === 'active') {
      // Pass 3 — cups 8-10 also gift creatures (the Crown gifts TWO, one of them
      // the 4-star Dire Wolf from the Ancient Keeper); say so before the fight.
      const giftLine = cup.reward.creature
        ? ` A ${DEX[cup.reward.creature.dex] ? DEX[cup.reward.creature.dex].name : 'creature'} (Lv ${cup.reward.creature.level || 5}) joins you if you win${cup.reward.creature2 ? `, and the ${cup.id === 'ancientCrown' ? 'Ancient Keeper' : 'Champion'} gifts you a second creature — a ${DEX[cup.reward.creature2.dex] ? DEX[cup.reward.creature2.dex].name : 'creature'} (Lv ${cup.reward.creature2.level || 5})` : ''}.`
        : '';
      UI.dialogSeq([
        { name: 'Arena Master', text: `${cup.name}! ${cup.size} trainers, single elimination, levels ${cup.levels[0]} to ${cup.levels[1]}. ${cup.theme}. The final is against ${cup.trainers.find(t => t.id === cup.finalId).name} — and the crowd loves a rivalry.` },
        { name: 'Arena Master', text: `Win it and you take home ${cup.reward.cash} cash, ${Object.entries(cup.reward.items).map(([id, n]) => `${n}× ${itemDef(id).name}`).join(', ')}, and the ${unlockName} unlock.${giftLine} Ready?` },
      ], () => TournamentFlow.start(cupId));
      return;
    }
    if (G.flags[cupId + 'Champion']) {
      const nextHints = {
        rookieCup: 'The next cup — the Forest Clash in the Whispering Woods — is waiting when you are.',
        forestClash: 'The next cup — the Reef Rumble at the Coral Reef — is waiting when you are.',
        reefRumble: 'The next cup — the Desert Heat in the Ember Dunes — is waiting when you are.',
        desertHeat: 'The next cup — the Bazaar Brawl in the Grand Bazaar — is waiting when you are.',
        bazaarBrawl: 'The next cup — the Frost Crown at the Frozen Roost — is waiting when you are.',
        frostCrown: 'The next cup — the University Games at the Ivory Tower — is waiting when you are.',
        universityGames: 'The next cup — the Wasteland War in the Rust Fields — is waiting when you are. Mutants only, level 60 to 75.',
        wastelandWar: 'The next cup — the Rok City Championship in Rok City — is waiting when you are. Level 75 to 90, and the company will be watching.',
        rokCityChampionship: 'The last cup — the Ancient Crown in the Echo Caves — is waiting when you are. Level 90 to 100, 32 trainers, and the Ancient Keeper at the end. Win it and the Long Dark opens.',
        ancientCrown: 'You beat the Ancient Keeper. You are the Ancient Champion — the Long Dark exit gate is open, and the whole ancient world is yours. There is no next cup. There is only the story, all of it, finished.',
      };
      UI.dialog('Arena Master', `Champion! The ${cup.name} is yours. ${nextHints[cupId]}`);
      return;
    }
    UI.dialog('Arena Master', `${cup.name} is for trainers at levels ${cup.levels[0]} to ${cup.levels[1]}. Finish your training missions first, then come see me.`);
  },
  shopOwner(npc) {
    if (missionStatus('foreclosure') === 'active') {
      completeObjective('foreclosure', 'talk');
      UI.dialog('Shop Owner', 'Closing down, yes. Thirty years I ran this shop — and Cyber Tech offered me cash I couldn\'t refuse. They\'re buying the whole street. Ask Elder Mara, she\'s been watching it happen.');
      return;
    }
    UI.dialog('Shop Owner', 'My shop\'s still standing — for now. If the company comes back with a bigger number... I don\'t know, Kai. I just don\'t know.');
  },
  pippa(npc) {
    if (missionStatus('indieAlliance') === 'active' && !objectiveDone('indieAlliance', 'pippa')) {
      completeObjective('indieAlliance', 'pippa');
      UI.dialog('Pippa', 'The indie alliance? Yes! The little shops standing together — Haven, the bazaar, all of us. Mara\'s right: if we stand together, the company can\'t buy us one by one. Count me in!');
      return;
    }
    if (missionStatus('smallShops') === 'active' && !objectiveDone('smallShops', 'buy')) {
      completeObjective('smallShops', 'buy');
      UI.dialog('Pippa', 'Hi! I\'m Pippa — indie seller, no chain, no Rok logo. Everything here is found or made by hand. Buy something and you\'re supporting the little shops, not the company.', () => UI.openShop('pippa'));
      return;
    }
    if (missionStatus('smallShops') === 'active' && !objectiveDone('smallShops', 'open')) {
      completeObjective('smallShops', 'open');
      UI.dialog('Pippa', 'You bought from me — that helps more than you know. With a little more, I can open in the closed storefront. The little shops take over, one stall at a time!');
      return;
    }
    UI.dialog('Pippa', 'Indie seller, at your service! No chain prices here — just what I found and made. The closed storefront down the street is going to be my shop one day.');
  },
  lostCreature(npc) {
    if (missionStatus('starterPathWolf') === 'active') {
      completeObjective('starterPathWolf', 'find');
      UI.dialog('Lost Pup', 'A little pup, lost in the woods — it was following a scent and wandered too far. Your Wolf Cub nudges it gently, and it trots after you, home at last. The trail is complete.');
      return;
    }
    UI.dialog('Lost Pup', 'The little pup whimpers softly, then curls up beside your Wolf Cub. It knows the way home now.');
  },
  hunter(npc) {
    if (!G.flags.hunterGift) {
      G.flags.hunterGift = true; addItem('bait', 2);
      UI.dialog('Hunter Bram', 'The Howling Peaks — home of Mammal + Smell. The wolves here track anything. The hunters come through looking for wolf cubs, so keep yours close. Take some bait — the wild ones here are hungry.');
      return;
    }
    UI.dialog('Hunter Bram', 'The hunters are out there, Kai. A wolf cub is worth more than gold to them. Keep yours close, and keep it strong.');
  },
  trapper(npc) {
    if (!G.flags.trapperGift) {
      G.flags.trapperGift = true; addItem('snare', 1);
      UI.dialog('Trapper Wren', 'The Grizzly Den — home of Mammal + Hearing. Bear cubs hunt best up here, and your bear\'s defense will carry you through anything. Take a snare — a hunter\'s tool, and you\'re a hunter now.');
      return;
    }
    UI.dialog('Trapper Wren', 'Hunt your first animal here, and the Den will respect you. Bear trainers are never robbed — nobody dares.');
  },
  climber(npc) {
    if (!G.flags.climberGift) {
      G.flags.climberGift = true; addItem('bandage', 2);
      UI.dialog('Climber Ash', 'The Frozen Roost — home of Bird + Sight. Eagles and owls nest on the highest peaks. The air up here is thin and the wind bites. Take some bandages — you\'ll need them.');
      return;
    }
    UI.dialog('Climber Ash', 'The eagles up here see everything. If you want to catch one, you\'ll have to be faster than their eyes.');
  },
  springKeeper(npc) {
    if (!G.flags.springKeeperGift) {
      G.flags.springKeeperGift = true; addItem('herbs', 2);
      UI.dialog('Spring Keeper Ila', 'The Cold Spring — home of Amphibian + Touch. The axolotls here feel the water with their skin, and the water is so cold it hurts. Take some herbs — the spring keeps them fresh.');
      return;
    }
    UI.dialog('Spring Keeper Ila', 'The axolotls are gentle. They don\'t fight — they feel. Touch is their whole world.');
  },
  iceFisher(npc) {
    if (!G.flags.iceFisherGift) {
      G.flags.iceFisherGift = true; addItem('bait', 2);
      UI.dialog('Ice Fisher Nils', 'Ice Lake — home of Fish + Smell. The salmon here smell their way home through the ice. I fish through the holes — take some bait, the fish are biting.');
      return;
    }
    UI.dialog('Ice Fisher Nils', 'The salmon know the way home by smell alone. That\'s a gift, Kai — smell is the oldest sense there is.');
  },
  nomad(npc) {
    if (!G.flags.nomadGift) {
      G.flags.nomadGift = true; addItem('waterBottle', 2);
      UI.dialog('Desert Nomad', 'The Ember Dunes — home of Reptile + Heat. Cobras, pythons, komodos — the heat is their world. There\'s a ruined building back there... company, I think. Take some water — you\'ll need it out here.');
      return;
    }
    UI.dialog('Desert Nomad', 'The dunes hide things. Old buildings, old logs. If you find a company log out here, read it — and then tell someone.');
  },
  antKeeper(npc) {
    if (!G.flags.antKeeperGift) {
      G.flags.antKeeperGift = true; addItem('trap', 1);
      UI.dialog('Ant Keeper Boz', 'The Ant Colony — home of Insect + Smell. The ants here smell everything — every crumb, every trail. Take a trap — the colony respects a good catch.');
      return;
    }
    UI.dialog('Ant Keeper Boz', 'The ants never stop. Smell is their map, and the colony is their city. You could learn a lot from them.');
  },
  diver(npc) {
    if (!G.flags.diverGift) {
      G.flags.diverGift = true; addItem('net', 1);
      UI.dialog('Diver Suki', 'The Coral Reef — home of Fish + Electroreception. Sharks and eels feel the water with electric senses — they know you\'re here before you do. Take a net — the reef rewards a quick hand.');
      return;
    }
    UI.dialog('Diver Suki', 'The Reef Champion has never lost in this reef. Twenty years. If you beat him, the whole reef will know your name.');
  },
  tidepooler(npc) {
    if (!G.flags.tidepoolerGift) {
      G.flags.tidepoolerGift = true; addItem('berries', 2);
      UI.dialog('Tidepooler Kit', 'The Tide Pools — home of Crustacean + Smell. Crabs, lobsters, shrimp — they smell the tide coming before it arrives. Take some berries — the pools are full of surprises.');
      return;
    }
    UI.dialog('Tidepooler Kit', 'The crabs here are smarter than they look. Smell is their superpower — they find food I can\'t even see.');
  },
  butterflyWatcher(npc) {
    if (!G.flags.butterflyWatcherGift) {
      G.flags.butterflyWatcherGift = true; addItem('plantFiber', 2);
      UI.dialog('Watcher Lila', 'Butterfly Island — home of Insect + Sight. The butterflies here see colors we can\'t even name. Take some plant fiber — the island grows it everywhere.');
      return;
    }
    UI.dialog('Watcher Lila', 'The butterflies migrate here every year. Sight is their gift — they see the whole island from above.');
  },
  trenchDiver(npc) {
    if (!G.flags.trenchDiverGift) {
      G.flags.trenchDiverGift = true; addItem('cage', 1);
      UI.dialog('Trench Diver Moss', 'The Deep Trench — home of Mollusk + Touch. Octopus, squid, snail — they feel the deep with their skin. It\'s dark down there, and the big ones are patient. Take a cage — you\'ll need it for what lives below.');
      return;
    }
    UI.dialog('Trench Diver Moss', 'The trench goes deeper than anyone\'s mapped. The mollusks down there touch the dark and know it by heart.');
  },
  mangroveGuide(npc) {
    if (!G.flags.mangroveGuideGift) {
      G.flags.mangroveGuideGift = true; addItem('wood', 2);
      UI.dialog('Guide Tala', 'The Mangrove — home of Reptile + Touch. Crocodiles rest in the roots, feeling the water move. Take some wood — the mangrove drops it everywhere.');
      return;
    }
    UI.dialog('Guide Tala', 'The mangrove is a nursery — everything here starts small and grows up strong. Touch is how the crocodiles hunt in the dark water.');
  },
  // ---- pass 2: Rok City ----
  cityGuide(npc) {
    if (missionStatus('rokCity') === 'active') {
      UI.dialog('City Guide', 'Welcome to Rok City! The Grand Bazaar is just west — stalls, haggling, the real city. The Ivory Tower is east — Rok University, where the towers touch the sky. And the plaza in the middle sells everything the company wants you to buy.');
      return;
    }
    if (missionStatus('corruption') === 'active') {
      UI.dialog('City Guide', 'The corruption? Look in the bazaar — someone\'s dealing more than snacks down there. And the flock watches everything. The city sees, Kai. The question is whether it cares.');
      return;
    }
    UI.dialog('City Guide', 'Rok City — the biggest city in the world, and it all belongs to Cyber Tech. The bazaar is the one place that still feels human. Start there.');
  },
  plazaClerk(npc) {
    if (G.flags.path === 'fight') {
      UI.dialog('Plaza Clerk', 'Rok Plaza doesn\'t serve resistance traitors. Mara\'s people can shop in the bazaar — or starve. Now get out of my store.');
      return;
    }
    if (missionStatus('ladder') === 'active' && !objectiveDone('ladder', 'clerk')) {
      completeObjective('ladder', 'clerk');
      UI.dialog('Plaza Clerk', 'Paperwork, delivered. Stamped, filed, and forgotten — that\'s how the company works, kid. Tell Caleb the plaza says hello. And if you need anything, Rok Plaza has everything. For a price.');
      return;
    }
    UI.openShop('plaza');
  },
  flockOfficer(npc) {
    if (missionStatus('flock') === 'active' && !objectiveDone('flock', 'talk')) {
      completeObjective('flock', 'talk');
      UI.dialog('Flock Officer', 'Citizen. The flock has flagged you — loitering near the university, associating with known agitators. Rok AI sees everything, Kai. The cameras, the drones, the flock. Behave, and the flock leaves you alone. Mostly.');
      return;
    }
    UI.dialog('Flock Officer', 'The flock keeps the peace, citizen. Rok AI sees everything. Move along.');
  },
  streetDealer(npc) {
    if (missionStatus('corruption') === 'active' && !objectiveDone('corruption', 'talk')) {
      completeObjective('corruption', 'talk');
      UI.dialog('Street Dealer', 'Hey, hey — you didn\'t see anything, right? The company looks the other way for a price, and the price is always paid. Drugs, money, cover-ups — Rok City runs on all three. Now walk away, kid. And go see the bazaar — that\'s where the real deals happen.');
      return;
    }
    UI.dialog('Street Dealer', 'You looking to buy? No? Then keep walking, kid. The company doesn\'t like witnesses.');
  },
  universityStudent(npc) {
    if (missionStatus('universityKids') === 'active') {
      if (!objectiveDone('universityKids', 'talk')) {
        completeObjective('universityKids', 'talk');
        UI.dialogSeq([
          { name: 'University Student', text: 'Ugh, what? Oh — you\'re not one of us. Look, the guys got drunk after the game and they\'re picking fights with everyone in the quad.' },
          { name: 'University Student', text: 'They won\'t listen to words. You\'ll have to beat them — both of them — before they hurt somebody.' },
        ], () => startTrainerBattle({
          name: 'Drunk Students', team: [{ dex: '007', level: 24 }, { dex: '013', level: 23 }],
          bg: 'battle-city.png', intro: 'Hey! Who\'s the kid? You wanna fight us? Let\'s GO!',
          battleTag: 'drunkStudents',
        }));
        return;
      }
      UI.dialog('University Student', 'You beat them? Thank Rok. They\'re sleeping it off now. The university is... not what the brochures say, huh?');
      return;
    }
    UI.dialog('University Student', 'Rok University — elite, expensive, and the towers go straight into the sky. Half the students here are drunk, the other half are already working for Cyber Tech.');
  },
  mara(npc) {
    // the resistance is hostile if Kai betrayed it
    if (G.flags.hostile_fight) {
      UI.dialog('Mara', 'You sold us out to Cyber Tech, Kai. The bazaar is closed to you. Get out of my sight.');
      return;
    }
    if (missionStatus('theChoice') === 'active') { offerChoice(); return; }
    if (missionStatus('leak') === 'active') {
      if (!objectiveDone('leak', 'talk')) {
        completeObjective('leak', 'talk');
        UI.dialog('Mara', 'The leak: Cyber Tech dumped Chemical X waste in the east, and the animals are mutating. Take the proof to the bazaar — the indie shops need to hear it from one of their own.');
        return;
      }
      UI.dialog('Mara', 'Take the leak to the bazaar — the merchants need to hear it. Then come back to me.');
      return;
    }
    if (missionStatus('securityTeam') === 'active') {
      if (!objectiveDone('securityTeam', 'secTrainer1')) {
        UI.dialog('Mara', 'Cyber Tech sent a security team to shut us down. Two of them. Beat the first one — I\'ll be right behind you.', () => startTrainerBattle({
          name: 'Security Trainer', team: [{ dex: '004', level: 42 }, { dex: '025', level: 41 }],
          bg: 'battle-city.png', intro: 'Resistance? In MY city? Let\'s see how tough you really are.',
          battleTag: 'secTrainer1',
        }));
        return;
      }
      if (!objectiveDone('securityTeam', 'secTrainer2')) {
        UI.dialog('Mara', 'One down, one to go. The second security trainer is waiting — finish this.', () => startTrainerBattle({
          name: 'Security Trainer', team: [{ dex: '005', level: 43 }, { dex: '028', level: 42 }],
          bg: 'battle-city.png', intro: 'You beat my partner? Fine. I\'m twice the trainer he is.',
          battleTag: 'secTrainer2',
        }));
        return;
      }
      UI.dialog('Mara', 'The security team is down. The resistance holds the bazaar — because of you.');
      return;
    }
    if (missionStatus('facility') === 'active') {
      if (!objectiveDone('facility', 'talk')) {
        completeObjective('facility', 'talk');
        UI.dialog('Mara', 'The facility on the edge of the Wreckyard — that\'s where they keep the Chemical X. A guard watches the door. Get past him and bring me what you find.');
        return;
      }
      if (!objectiveDone('facility', 'facilityGuard')) {
        UI.dialog('Mara', 'The facility guard is still standing between you and the Chemical X. Beat him.', () => startTrainerBattle({
          name: 'Facility Guard', team: [{ dex: '006', level: 48 }, { dex: '031', level: 47 }],
          bg: 'battle-wreckyard.png', intro: 'Cyber Tech property! You\'re not getting past me, kid.',
          battleTag: 'facilityGuard',
        }));
        return;
      }
      UI.dialog('Mara', 'You got the Chemical X. That\'s the proof — and the power. Now let\'s expose them.');
      return;
    }
    if (missionStatus('exposure') === 'active') {
      if (!objectiveDone('exposure', 'talk')) {
        completeObjective('exposure', 'talk');
        UI.dialog('Mara', 'Time to expose it all. Spread the word through the bazaar — the merchants, the stalls, everyone. When the city knows, the company can\'t hide.');
        return;
      }
      UI.dialog('Mara', 'Spread the word — talk to the bazaar merchant. The city needs to hear it from the stalls, not just from me.');
      return;
    }
    if (missionStatus('finalBattle') === 'active' && G.flags.path === 'fight') {
      UI.dialog('Mara', 'This is it, Kai. Rok\'s champion fights for the company in the city arena — beat him, and the trial begins. The whole city will be watching.', () => startTrainerBattle({
        name: 'Rok\'s Champion', team: [{ dex: '003', level: 72 }, { dex: '015', level: 71 }, { dex: '045', level: 74 }],
        bg: 'battle-city.png', intro: 'The resistance sends a child to fight me? Elsa Rok herself is watching. Let\'s end this.',
        battleTag: 'finalBoss',
      }));
      return;
    }
    if (missionStatus('dumpSite') === 'active') {
      UI.dialog('Mara', 'The dump site is in the Wreckyard, east past the Rust Fields. The Warden watches the gate — tell him I sent you. Bring back proof of what they buried there.');
      return;
    }
    UI.dialog('Mara', 'The bazaar is the heart of the resistance, Kai. The company owns the towers — but the stalls, the haggling, the people? Those are ours.');
  },
  bazaarMerchant(npc) {
    if (missionStatus('indieAlliance') === 'active' && !objectiveDone('indieAlliance', 'merchant')) {
      completeObjective('indieAlliance', 'merchant');
      UI.dialog('Bazaar Merchant', 'The indie alliance? The little shops, standing together? Yes — I\'m in. The company buys us one by one if we stand alone. Together, we\'re the bazaar. And the bazaar doesn\'t sell out.');
      return;
    }
    if (missionStatus('exposure') === 'active' && !objectiveDone('exposure', 'merchant')) {
      completeObjective('exposure', 'merchant');
      UI.dialog('Bazaar Merchant', 'The proof? The dump site, the waste, the mutants — all of it? Then it\'s over for them. I\'ll spread the word through every stall in the bazaar. By tomorrow, the whole city will know.');
      return;
    }
    UI.dialog('Bazaar Merchant', 'Fresh goods, fair prices, no Rok logo. The bazaar is the last honest place in this city, Kai. Haggle with me — I like a customer with spine.');
  },
  // ---- pass 2: the east wasteland ----
  dumpWarden(npc) {
    if (missionStatus('dumpSite') === 'active' && !objectiveDone('dumpSite', 'talk')) {
      completeObjective('dumpSite', 'talk');
      UI.dialog('Dump Warden', 'The dump site? You\'re standing in it, kid. Barrels of Chemical X waste, buried under the wreckage — and the animals that drink the runoff come out... wrong. Mutants. Mara sent you? Then take the proof and go. I didn\'t see you. I never see anything.');
      return;
    }
    UI.dialog('Dump Warden', 'I watch the gate. Barrels go in, nothing comes out — except the mutants. You want proof? It\'s all around you, kid.');
  },
  wreckyardScavenger(npc) {
    if (missionStatus('theWreckyard') === 'active' && !objectiveDone('theWreckyard', 'talk')) {
      completeObjective('theWreckyard', 'talk');
      UI.dialog('Wreckyard Scavenger', 'The Wreckyard, kid — everything the company throws away ends up here. Phones, barrels, secrets. The dump site is the heart of it, and the mutants are its blood. You\'re looking for the cave? Past the Hollow, east. The bats will show you the way.');
      return;
    }
    UI.dialog('Wreckyard Scavenger', 'Scrap is money out here, kid. The company throws away gold and calls it trash. You want the cave? Past the Hollow — the Echo Caves, east.');
  },
  exileScout(npc) {
    if (missionStatus('theCave') === 'active') {
      UI.dialog('Exile Scout', 'The gate to the Long Dark. A level-80 mutant alpha guards it — the strongest mutant in the east. Beat it, and the cave opens. What\'s past it... the sanctuary. The 75+ world. The truth about Chemical X.');
      return;
    }
    if (missionStatus('the75World') === 'active' || missionStatus('sanctuary') === 'active') {
      UI.dialog('Exile Scout', 'The 75+ world is past the gate, Kai — the Long Dark, three zones, then the ancient world. The exiles crossed it once, and they\'ll tell you everything. The Sanctuary is the only safe place out there. Go.');
      return;
    }
    UI.dialog('Exile Scout', 'I fled Cyber Tech years ago. The exiles live past the cave, in the sanctuary — the only safe place in the 75+ world. The gate is sealed, and the alpha guards it. You\'re not ready yet, Kai. But you will be.');
  },
  caveGuide(npc) {
    // Pass 3 — the climb lesson: HM CLIMB. The Cave Guide teaches it once the
    // Long Dark is open (theCave done). The lesson mission completes on the talk,
    // whatever its objective ids are — the flag is the part that matters.
    if (missionStatus('theCave') === 'done' && missionStatus('climbLesson') !== 'done') {
      const def = MISSIONS.find(x => x.id === 'climbLesson');
      if (missionStatus('climbLesson') === 'locked') setMission('climbLesson', 'active');
      UI.dialogSeq([
        { name: 'Cave Guide', text: 'You beat the alpha. Good — the Long Dark is open, but the Gate zone is a climb. Handholds in the dark, rope, and a steady head. I\'ll teach you: HM CLIMB. Climb like the bats do — by feel, not by sight.' },
        { name: 'Cave Guide', text: 'There. You\'ve got it — HM CLIMB. The Gate zone is yours now, and the exit gate after it. The ancient world is waiting, Kai.' },
      ], () => {
        if (def) for (const o of def.objectives) completeObjective('climbLesson', o.id);
        else { G.flags.unlock_HM_CLIMB = true; toast('HM CLIMB learned!'); }
      });
      return;
    }
    UI.dialog('Cave Guide', 'The Echo Caves — home of Mammal + Echolocation. The bats here navigate by sound, and they hear you long before you see them. The gate at the back leads to the Long Dark. A mutant alpha guards it. Bring a level-70 team, or don\'t bother.');
  },
  hollowKeeper(npc) {
    // Pass 3 — the smash lesson: HM SMASH. The Hollow Keeper teaches it once
    // the east is fully open (theEast done). Same pattern as the climb lesson.
    if (missionStatus('theEast') === 'done' && missionStatus('smashLesson') !== 'done') {
      const def = MISSIONS.find(x => x.id === 'smashLesson');
      if (missionStatus('smashLesson') === 'locked') setMission('smashLesson', 'active');
      UI.dialogSeq([
        { name: 'Hollow Keeper', text: 'The east is open to you, Kai — and the Gate zone of the Long Dark is blocked by boulders no creature can push. I\'ll teach you: HM SMASH. Hit like the spiders do — once, in exactly the right spot, and the whole web comes down.' },
        { name: 'Hollow Keeper', text: 'There. You\'ve got it — HM SMASH. The boulders in the Gate zone will break for you now. The exit gate is past them.' },
      ], () => {
        if (def) for (const o of def.objectives) completeObjective('smashLesson', o.id);
        else { G.flags.unlock_HM_SMASH = true; toast('HM SMASH learned!'); }
      });
      return;
    }
    UI.dialog('Hollow Keeper', 'The Hollow — home of Arachnid + Touch. The spiders here feel the vibrations of everything that walks. The webs are big enough to catch a person, Kai. Watch your step — and don\'t touch the silk.');
  },
  // ---- pass 3: the 75+ world ----
  exileLeader(npc) {
    // The Sanctuary's leader. Talking to her completes the sanctuary mission's
    // talk step (whatever its objective id is) and starts the mystery hunts.
    // She also closes the game: wholeStory's only objective is this same talk.
    let did = false;
    for (const mid of ['sanctuary', 'the75World', 'wholeStory']) {
      const def = MISSIONS.find(x => x.id === mid);
      if (!def || missionStatus(mid) !== 'active') continue;
      for (const o of def.objectives) {
        if (o.type !== 'reach' && !objectiveDone(mid, o.id)) { completeObjective(mid, o.id); did = true; }
      }
    }
    if (did) {
      // The final mission closes the game — its dialog is the whole truth.
      if (missionStatus('wholeStory') === 'done') {
        UI.dialogSeq([
          { name: 'Exile Leader', text: 'You caught all five. The Spinosaurus, the Quetzalcoatlus, the Titanoboa, the Megatherium, the Giant Vampire Bat — nobody has ever caught all five. Now I owe you the whole truth.' },
          { name: 'Exile Leader', text: 'Chemical X was never a medicine, Kai. It was an attempt to bring the ancients back from fossil DNA — and when the animals came back wrong, the company buried the waste in the east and called it done. The mutants are the failed ancients. The ancients are the world before the company. And you — you are the trainer who proved it all. The whole story, Kai. From the first starter to the Ancient Crown. It is yours now.' },
        ]);
        return;
      }
      UI.dialogSeq([
        { name: 'Exile Leader', text: 'You made it through the Long Dark. I\'m the leader of the exiles — we fled Cyber Tech when we learned what Chemical X really was. The ancients are not monsters, Kai. They are the world before the company.' },
        { name: 'Exile Leader', text: 'Five mystery creatures hide out here — the biggest of the ancients, the ones even we have never caught. Spinosaurus, Quetzalcoatlus, Titanoboa, Megatherium, and the Giant Vampire Bat. The signs are in their places. Hunt them, Kai — and then tell the world what you found.' },
      ]);
      return;
    }
    UI.dialog('Exile Leader', 'The Sanctuary is neutral ground, Kai — exiles, traders, and anyone the company threw away. The campfire never goes out, and nothing hunts you here. The five mystery creatures are out there, in the places the signs mark.');
  },
  exileTrader(npc) {
    UI.dialog('Exile Trader', 'Salvaged stock from the ancient world — nets, traps, bandages, food. No supply line out here, so everything costs double. But out here, double is still cheap.', () => UI.openShop('sanctuary'));
  },
  hubGuide(npc) {
    UI.dialog('Hub Guide', 'Welcome to the upper deck, Kai — the online side of the Care Hub. Chat with trainers everywhere, trade, battle, join a guild, check the leaderboards. Your account lives here, not on any company server.', () => { if (typeof HUB !== 'undefined') HUB.openHub(); });
  },
  ancientLocal(npc) {
    // One handler for all 21 ancient-world locals — each place has its own line.
    const LINES = {
      steppeHerder: 'The Mammoth Steppe — home of Ancient Mammal + Smell. The mammoths are the biggest animals in the world, Kai. They remember the world before the company — and they do not forget.',
      direKeeper: 'The Dire Den — home of Ancient Mammal + Smell. The dire wolves hunt in packs, and the pack is everything. They smell you coming from a mile away.',
      hornedHerder: 'The Horned Plains — home of Ancient Reptile + Sight. The triceratops charge at anything that moves. Their horns are older than the main world.',
      raptorScout: 'The Raptor Grass — home of Ancient Reptile + Sight. The velociraptors hunt in packs and they are FAST. Do not let them circle you.',
      saberStalker: 'The Saber Fields — home of Ancient Mammal + Sight. The saber-toothed tigers are the best hunters in the ancient world. Their fangs are longer than your arm.',
      riverGuide: 'The Deep River — the Spinosaurus hunts here at dusk. When the fish vanish from the river, it is near. Read the signs, and come back at 17:00 — not before.',
      deepDiver: 'The Megalodon Deep — home of Ancient Fish + Electroreception. The megalodon is the biggest shark that ever lived. It feels your heartbeat through the water.',
      reefKeeper: 'The Armored Reef — home of Ancient Fish + Touch. The dunkleosteus wears armor for skin. Its jaws can crush a car.',
      scorpionWarden: 'The Sea Scorpion Flats — home of Ancient Crustacean + Touch. The jaekelopterus is a sea scorpion the size of a car. Its claws can cut steel.',
      shoalKeeper: 'The Spiral Shoals — home of Ancient Mollusk + Smell. The ammonites smell the tide coming. Their shells are older than the main world.',
      cliffWatcher: 'The Ptero Cliffs — home of Ancient Bird + Sight. The pterodactyls soar on the wind, and the archaeopteryx glides between the cliffs. Watch the sky.',
      peakWatcher: 'The High Peaks — the Quetzalcoatlus flies here at dawn, and its shadow covers the whole peak. Read the signs, and watch the sky at first light.',
      canopyKeeper: 'The Giants\' Canopy — home of Ancient Insect + Sight. The dragonflies here are the size of eagles. The trees are the size of houses. Everything here is bigger.',
      hollowSpider: 'The Spiders\' Hollow — home of Ancient Arachnid + Touch. The megarachne feels every vibration in its web. The webs are big enough to catch a person.',
      pondWatcher: 'The Devils\' Pond — home of Ancient Amphibian + Sight. The beelzebufo is a frog the size of a dog, and its bite can crush bone. Do not fall in.',
      marshGuide: 'The Burning Marsh — the Titanoboa lives in the hottest water. It is the biggest snake that ever lived, and it only comes out when the water boils. Bring a level 85+ team, and a creature with Heat sense.',
      forestKeeper: 'The Deep Forest — the Megatherium is a ground sloth the size of a truck. Follow the fruit trail — the exiles leave fruit out for it. Bring 3 berries.',
      darkListener: 'The Dark Caves — the Giant Vampire Bat hunts by sound in the dark. Your light will not help you here — listen. Read the signs, and do not make a sound.',
      ancientGuide: 'The Rex Badlands — home of Ancient Reptile + Smell. The T. rex is the king of the ancient world. Its bite can crush bone, and it smells you from a mile away.',
      caveDelver: 'The Mouth — the first zone of the Long Dark. Level 60 to 70 mutants, collapsing tunnels, and worse. The Deep is next, then the Gate. Keep moving.',
      exileGuard: 'The Sanctuary is neutral, Kai. Exiles, traders, anyone the company threw away. The campfire never goes out, and nothing hunts you here.',
    };
    UI.dialog(npc.name || 'Ancient Local', LINES[npc.id] || 'The ancient world is older than the main world, Kai. Everything here is bigger, older, and hungrier.');
  },
};

/* ---------------- tournament flow ---------------- */
const TournamentFlow = {
  cup: null, path: [], round: 0,
  start(cupId) {
    const cup = TOURNAMENTS.find(t => t.id === (cupId || 'rookieCup'));
    this.cup = cup; this.round = 0;
    // One battle per round. 16-trainer cups: round of 16, quarterfinal, semifinal,
    // final. 32-trainer cups (the Ancient Crown): round of 32 first, then the same
    // four. byRound returns undefined for rounds the cup doesn't have.
    const byRound = (r) => cup.trainers.find(t => t.round === r);
    const fin = cup.trainers.find(t => t.id === cup.finalId);
    this.path = [byRound('round32'), byRound('round16'), byRound('quarterfinal'), byRound('semifinal'), fin].filter(Boolean);
    const r0 = this.path[0];
    UI.dialog('Arena Master', `${this.roundLabel(0)}: ${r0.name} — ${r0.intro}`, () => this.battleRound());
  },
  roundLabel(i) {
    const labels = this.path.length === 5 ? ['Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Final'] : this.path.length === 4 ? ['Round of 16', 'Quarterfinal', 'Semifinal', 'Final'] : ['Quarterfinal', 'Semifinal', 'Final'];
    return labels[i] || 'Final';
  },
  battleRound() {
    const r = this.path[this.round];
    // Marcus and Sofia fight with the starter they actually picked (starter logic)
    let team = r.team;
    if (r.id === 'marcus' || r.id === 'sofia') {
      team = r.team.map((t, i) => i === 0 ? { ...t, dex: friendStarterDex(r.id) } : t);
    }
    const bg = { rookieCup: 'battle-arena.png', forestClash: 'battle-woods.png', reefRumble: 'battle-reef.png', desertHeat: 'battle-desert.png', bazaarBrawl: 'battle-city.png', frostCrown: 'battle-snow.png', universityGames: 'battle-city.png', wastelandWar: 'battle-wasteland.png', rokCityChampionship: 'battle-city.png', ancientCrown: 'battle-cave.png' }[this.cup.id] || 'battle-arena.png';
    startTrainerBattle({
      name: r.name, team, bg,
      intro: r.intro, tournament: true,
      roundInfo: { cup: this.cup.id, round: this.round },
    });
  },
  afterWin(info) {
    this.round = info.round + 1;
    if (this.round >= this.path.length) {
      // champion! Rewards come from the mission itself (completeMission below).
      const cup = this.cup;
      const missionMap = { rookieCup: 'firstTournament', forestClash: 'secondTournament', reefRumble: 'thirdTournament', desertHeat: 'fourthTournament', bazaarBrawl: 'fifthTournament', frostCrown: 'sixthTournament', universityGames: 'seventhTournament', wastelandWar: 'eighthTournament', rokCityChampionship: 'ninthTournament', ancientCrown: 'tenthTournament' };
      const missionId = missionMap[cup.id];
      const mdef = MISSIONS.find(m => m.id === missionId);
      G.flags[cup.id + 'Champion'] = true;
      if (cup.id === 'rookieCup') G.flags.champion = true;
      G.flags['unlock_' + cup.reward.unlock.replace(/[^A-Za-z0-9]+/g, '_')] = true;
      SFX.fanfare();
      const itemNames = Object.entries(mdef.reward.items || {}).map(([id, n]) => `${n}× ${itemDef(id).name}`).join(', ');
      const unlockName = { 'HM SLICE': 'HM SLICE', antColony: 'the Ant Colony', 'HM SWIM': 'HM SWIM', scorpionsNest: "the Scorpion's Nest", hmSOAR: 'HM SOAR', iceLake: 'Ice Lake', rokCity: 'Rok City', 'HM LIGHT': 'HM LIGHT', 'HM DIVE': 'HM DIVE', longDarkExit: 'the Long Dark exit gate' }[mdef.reward.unlock] || mdef.reward.unlock;
      const lines = [
        { name: 'Arena Master', text: `CHAMPION! Kai wins the ${cup.name}! The crowd is on its feet!` },
        { name: 'Arena Master', text: `You take home ${mdef.reward.cash} cash${itemNames ? ', ' + itemNames : ''} — and the ${unlockName} unlock!` },
      ];
      // Pass 3 — cups 8-10 gift creatures (the Crown gifts two); say so here,
      // before completeMission pays them out.
      if (mdef.reward.creature) lines.push({ name: 'Arena Master', text: `And a ${DEX[mdef.reward.creature.dex].name} (Lv ${mdef.reward.creature.level || 5}) joins you!` });
      if (cup.id === 'rookieCup') lines.push({ name: 'Marcus', text: 'You beat me... fair and square. The Rookie Cup is yours, Kai. But this is just the start — Phase 2 is coming.' });
      if (cup.id === 'forestClash') lines.push({ name: 'Sofia', text: 'Ugh — fine. You and that leftover starter are the real deal. Take the cup, Kai. The reef is next — and the Champion there has never lost.' });
      if (cup.id === 'reefRumble') lines.push({ name: 'The Reef Champion', text: 'Twenty years... and a kid with a leftover starter takes my reef. The Reef Rumble is yours, Kai — and HM SWIM with it. Go see what\'s past the deep water.' });
      if (cup.id === 'desertHeat') lines.push({ name: 'The Sand King', text: 'The desert yields to you, Kai. Take the Fire Breath TM and the cash — and the Scorpion\'s Nest is open to you now. The City Tournament is next.' });
      if (cup.id === 'bazaarBrawl') lines.push({ name: 'The Bazaar Boss', text: 'Ha! The bazaar has a new boss — you. Take the Electric Shock TM... and this: a Bird creature can carry you anywhere now. HM SOAR is yours.' });
      if (cup.id === 'frostCrown') lines.push({ name: 'The Frost Queen', text: 'The cold bows to you, Kai. The Frost Crown is yours — and Ice Lake opens its frozen doors. The university is next.' });
      if (cup.id === 'universityGames') lines.push({ name: 'Caleb', text: 'You beat me. In front of the whole university. Fine — take the cup, Kai. And take the city. The Choice is waiting for you in the bazaar.' });
      if (cup.id === 'wastelandWar') lines.push({ name: 'The Wasteland King', text: 'The wasteland bows to you, Kai. Take the cash, the Chemical X, the TM — and this: HM LIGHT. The dark places of the Long Dark are yours now.' });
      if (cup.id === 'rokCityChampionship') lines.push({ name: 'The Corporate Champion', text: 'Elsa Rok herself is watching, Kai — and you just beat her champion in her own city. Take the cash, the Chemical X, the TM — and HM DIVE. The deep places are yours.' });
      if (cup.id === 'ancientCrown') {
        lines.push({ name: 'The Ancient Keeper', text: 'Ten cups. Ten champions. You are the Ancient Champion, Kai — the first trainer in a hundred years to beat me. The Long Dark exit gate is open. The ancient world is yours.' });
        if (mdef.reward.creature2) lines.push({ name: 'The Ancient Keeper', text: `And take this too — a ${DEX[mdef.reward.creature2.dex].name} (Lv ${mdef.reward.creature2.level || 5}), the tournament prize. The 4-star Dire Wolf is my gift — the only way anyone gets a 4-star creature. Use them well, Ancient Champion.` });
      }
      UI.dialogSeq(lines, () => { completeMission(missionId); saveGame(true); });
      return;
    }
    const r = this.path[this.round];
    UI.dialog('Arena Master', `${this.roundLabel(this.round)}: ${r.name}! ${r.intro}`, () => this.battleRound());
  },
};
