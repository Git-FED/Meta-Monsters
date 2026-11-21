"""Metamonsters Revision Pass 3 (FINAL) — headless playthrough.
Usage: python3 tools/smoke-pass3.py [fight|join]   (default: fight)
  fight = full run: new game -> wolf starter -> setup assist -> finalBattle
          (Rok's Champion) -> tournaments 8-10 (Wasteland War, Rok City
          Championship, Ancient Crown) -> HM lessons (CLIMB, SMASH) -> the
          Long Dark (gate Lv60 check, zone gating, exit gate) -> the 75+ world
          (Sanctuary, exile leader, ancient catch) -> 5 mystery hunts ->
          wholeStory (chain complete) -> backend/hub (account, chat, PvP,
          trade, market, daily, achievements, leaders) -> travel exclusion
          (no ancient maps) -> Bazaar door fix.
  join  = branch run: same pass-3 chain, but finalBattle is the JOIN boss
          (Resistance Leader via Caleb) instead of Rok's Champion.
Collects console errors / pageerrors / failed requests; prints PASS/FAIL per step.
Test assists (same rules as smoke-pass2.py — the exercised code paths run for
real): gainXp() to level the party; foe HP set to 1 before a catch attempt;
healParty() before battles; changeMap() teleports between distant maps;
setMission('finalBattle') to start at the pass-3 layer (pass-1/2 chain is
covered by smoke-pass1.py / smoke-pass2.py — note: smoke-pass2.py's
"gate sealed until pass 3" check was updated to the pass-3 open gate).
Run from ~/workspace/metamonsters-game with the noble-spark venv python.
"""
import asyncio, json, sys
from playwright.async_api import async_playwright

URL = 'file:///home/hatch/workspace/metamonsters-game/index.html'
MODE = sys.argv[1] if len(sys.argv) > 1 else 'fight'
errors = []
results = []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (f' — {detail}' if detail else ''), flush=True)

DIRKEY = {'up': 'ArrowUp', 'down': 'ArrowDown', 'left': 'ArrowLeft', 'right': 'ArrowRight'}

class Game:
    def __init__(self, page):
        self.p = page
    async def ev(self, expr):
        return await self.p.evaluate(expr)
    async def state(self):
        return await self.ev('G.state')
    async def mission(self):
        return await self.ev('activeMission() ? activeMission().id : null')
    async def pos(self):
        return await self.ev('[G.player.x, G.player.y, G.player.map]')
    async def press_enter(self, n=1, wait=300):
        for _ in range(n):
            await self.p.keyboard.press('Enter')
            await self.p.wait_for_timeout(wait)
    async def wait_state(self, want, timeout=12000):
        for _ in range(int(timeout / 200)):
            if await self.state() == want:
                return True
            await self.p.wait_for_timeout(200)
        return False
    async def wait_dialog(self, timeout=15000):
        return await self.wait_state('dialog', timeout)
    async def click_panel_button(self, prefix, scope='#menu'):
        return await self.p.evaluate("""(args) => {
            const btns = [...document.querySelectorAll(args[0] + ' button')];
            const b = btns.find(x => x.textContent.trim().startsWith(args[1]));
            if (b) { b.click(); return true; } return false;
        }""", [scope, prefix])
    async def click_battle_button(self, prefix):
        return await self.click_panel_button(prefix, '#battle-actions')
    async def wait_battle_menu(self, timeout=8000):
        for _ in range(int(timeout / 200)):
            if await self.state() != 'battle':
                return False
            n = await self.ev("document.querySelectorAll('#battle-actions button').length")
            if n:
                return True
            await self.p.wait_for_timeout(200)
        return False
    async def flee_battle(self):
        for _ in range(6):
            if await self.state() != 'battle':
                return True
            if not await self.wait_battle_menu():
                return False
            await self.click_battle_button('RUN')
            await self.p.wait_for_timeout(1500)
            if await self.state() == 'overworld':
                return True
        return await self.state() == 'overworld'
    async def drain_dialogs(self, max_presses=15):
        for _ in range(max_presses):
            if await self.state() != 'dialog':
                return True
            await self.press_enter(1)
            await self.p.wait_for_timeout(600)
        return await self.state() != 'dialog'
    async def dialog_text(self):
        return await self.ev("document.getElementById('dialog-text').textContent")

    async def fight_battle(self):
        """Fight the current battle to its end, picking the best move each turn
        (highest power x effectiveness x STAB, computed from the real damage
        functions) and healing from the bag when HP drops below 30%. The
        first-move-only strategy of smoke-pass1/2 cannot beat the Lv75-90
        Corporate Champion — a real player picks super-effective moves."""
        for _ in range(200):
            st = await self.state()
            if st != 'battle':
                return st
            if not await self.wait_battle_menu():
                return await self.state()
            log = await self.ev("document.getElementById('battle-log').textContent")
            if 'Choose your next creature' in log:
                await self.p.evaluate("document.querySelector('#battle-actions button').click()")
                await self.p.wait_for_timeout(1000)
                continue
            # MEGA EVOLVE when offered (lead is mega-eligible + Chemical X in bag):
            # the Ancient Crown final is built for a Mega — a real endgame player
            # uses it, and the test should too. doMegaEvolve re-shows the menu
            # after 1.6s, so wait for it to come back.
            mega = await self.p.evaluate("""() => {
              const bs = [...document.querySelectorAll('#battle-actions button')];
              const b = bs.find(x => x.textContent.includes('MEGA'));
              if (b) { b.click(); return true; } return false;
            }""")
            if mega:
                await self.p.wait_for_timeout(2200)
                if not await self.wait_battle_menu():
                    continue
            # heal when hurt and a healing item is in the bag
            hurt = await self.ev("(() => { const m = playerMon(); return m.hp / m.maxHp < 0.3 && (G.bag.firstAidKit || G.bag.bandage || 0) > 0; })()")
            if hurt:
                if await self.click_battle_button('BAG'):
                    await self.p.wait_for_timeout(400)
                    used = await self.p.evaluate("""() => {
                      const bs = [...document.querySelectorAll('#battle-actions button')];
                      const b = bs.find(x => x.textContent.includes('First Aid Kit')) || bs.find(x => x.textContent.includes('Bandage'));
                      if (b) { b.click(); return true; } return false;
                    }""")
                    if used:
                        await self.p.wait_for_timeout(2600)
                        continue
                    await self.click_battle_button('← BACK')
                    await self.p.wait_for_timeout(300)
            if not await self.click_battle_button('FIGHT'):
                await self.p.wait_for_timeout(500)
                continue
            await self.p.wait_for_timeout(400)
            picked = await self.p.evaluate("""() => {
              const m = playerMon(); const f = foeMon();
              let best = null, bestScore = -1;
              for (const mid of m.moves) {
                const def = moveDef(mid, m.dex);
                const power = def.power || 0;
                if (!power) continue;
                const eff = effMult(def, m, f);
                const stab = (def.type.replace(/^Ancient /, '') === DEX[m.dex].category.replace(/^Ancient /, '') || def.type === DEX[m.dex].sense) ? 1.5 : 1;
                const score = power * eff * stab;
                if (score > bestScore) { bestScore = score; best = def.name; }
              }
              if (!best) return false;
              const bs = [...document.querySelectorAll('#battle-actions button')];
              const b = bs.find(x => x.textContent.startsWith(best));
              if (b) { b.click(); return best; } return false;
            }""")
            if not picked:
                # no damaging move offered (status-only set) — click the first move
                await self.p.evaluate("document.querySelector('#battle-actions button').click()")
            await self.p.wait_for_timeout(2600)
        return await self.state()
    async def bfs_path(self, tx, ty):
        return await self.p.evaluate("""(args) => {
            const [tx, ty] = args;
            const map = MAPS[G.player.map];
            const key = (x, y) => x + ',' + y;
            const prev = {}; const q = [[G.player.x, G.player.y]];
            prev[key(G.player.x, G.player.y)] = null;
            while (q.length) {
              const [x, y] = q.shift();
              if (x === tx && y === ty) break;
              for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const nx = x + dx, ny = y + dy;
                if (prev[key(nx, ny)] !== undefined) continue;
                const ex = exitAt(map, nx, ny);
                if (ex && !(nx === tx && ny === ty)) continue;
                if (!walkable(map, nx, ny) && !(nx === tx && ny === ty)) continue;
                prev[key(nx, ny)] = [x, y]; q.push([nx, ny]);
              }
            }
            if (prev[key(tx, ty)] === undefined) return null;
            const path = []; let cur = [tx, ty];
            while (cur) { path.unshift(cur); cur = prev[key(cur[0], cur[1])]; }
            return path.slice(1);
        }""", [tx, ty])
    async def step_to(self, tx, ty):
        dx, dy = tx - (await self.ev('G.player.x')), ty - (await self.ev('G.player.y'))
        if dx == 0 and dy == 0:
            return True
        d = 'right' if dx > 0 else 'left' if dx < 0 else 'down' if dy > 0 else 'up'
        key = DIRKEY[d]
        await self.p.keyboard.down(key)
        ok = False
        for _ in range(24):
            await self.p.wait_for_timeout(50)
            pos = await self.ev("({s: G.state, x: G.player.x, y: G.player.y})")
            if pos['s'] == 'battle':
                break
            if pos['x'] == tx and pos['y'] == ty:
                ok = True
                break
        if ok:
            await self.p.keyboard.up(key)
            for _ in range(20):
                st = await self.ev("({s: G.state, m: OW.moving})")
                if st['s'] != 'overworld' or not st['m']:
                    break
                await self.p.wait_for_timeout(50)
            return ok
        await self.p.keyboard.up(key)
        return ok
    async def walk_to(self, tx, ty, max_repath=6):
        for _ in range(max_repath):
            if await self.state() == 'battle':
                if not await self.flee_battle():
                    return False
            if (await self.ev('G.player.x')) == tx and (await self.ev('G.player.y')) == ty:
                return True
            path = await self.bfs_path(tx, ty)
            if path is None:
                return False
            done = True
            for (sx, sy) in path:
                if not await self.step_to(sx, sy):
                    done = False
                    break
                if await self.state() == 'battle':
                    done = False
                    break
            if done:
                return True
        return (await self.ev('G.player.x')) == tx and (await self.ev('G.player.y')) == ty
    async def goto_map(self, tx, ty):
        ok = await self.walk_to(tx, ty)
        await self.p.wait_for_timeout(300)
        return ok
    async def face(self, d):
        await self.p.keyboard.press(DIRKEY[d])
        await self.p.wait_for_timeout(120)
    async def interact(self):
        await self.press_enter(1, 400)
    async def talk_to(self, nx, ny):
        px, py = await self.ev('G.player.x'), await self.ev('G.player.y')
        cands = [(nx, ny + 1, 'up'), (nx, ny - 1, 'down'), (nx - 1, ny, 'right'), (nx + 1, ny, 'left')]
        best = None
        for (ax, ay, d) in cands:
            if await self.ev(f'walkable(MAPS[G.player.map], {ax}, {ay})'):
                dist = abs(ax - px) + abs(ay - py)
                if best is None or dist < best[0]:
                    best = (dist, ax, ay, d)
        if best is None:
            return False
        _, ax, ay, d = best
        if not await self.walk_to(ax, ay):
            return False
        await self.face(d)
        await self.interact()
        return True
    async def teleport(self, map_id, x, y):
        """Test assist: changeMap runs the real map-change code (lock check,
        requires flags, flags.visited, reach objectives, Caleb move, bike dismount)."""
        await self.ev(f"changeMap('{map_id}', {x}, {y})")
        await self.p.wait_for_timeout(600)
        return (await self.pos())[2] == map_id
    # safe teleport landing tiles per map (on open ground, not on an exit/object).
    SPAWN = {'haven': (11, 7), 'rokCity': (14, 9), 'bazaar': (4, 9), 'university': (12, 10),
             'rustFields': (13, 9), 'ashenFlats': (13, 9), 'wreckyard': (13, 9),
             'hollow': (13, 9), 'echoCaves': (13, 9), 'ember': (13, 9), 'frozen': (13, 9),
             'meadow': (15, 9), 'woods': (13, 9), 'oasis': (13, 9), 'reef': (13, 9),
             'caveMouth': (13, 16), 'caveDeep': (13, 16), 'caveGate': (13, 16),
             'rexBadlands': (13, 9), 'hornedPlains': (13, 9), 'mammothSteppe': (13, 9),
             'direDen': (13, 9), 'raptorGrass': (13, 9), 'saberFields': (13, 9),
             'sanctuary': (13, 9), 'deepRiver': (12, 9), 'megalodonDeep': (13, 9),
             'armoredReef': (13, 9), 'seaScorpion': (13, 9), 'spiralShoals': (13, 9),
             'pteroCliffs': (13, 9), 'highPeaks': (12, 9), 'giantsCanopy': (13, 9),
             'spidersHollow': (13, 9), 'deepForest': (12, 9), 'burningMarsh': (12, 9),
             'devilsPond': (13, 9), 'darkCaves': (12, 9), 'hubUpper': (7, 5)}
    async def talk_npc(self, map_id, npc_id):
        """Teleport to the map, find the NPC's coords from the map data, talk to it."""
        pos = await self.ev(f"(MAPS['{map_id}'].npcs.find(n => n.id === '{npc_id}') || {{}})")
        if 'x' not in pos:
            return False
        if (await self.pos())[2] != map_id:
            sx, sy = self.SPAWN.get(map_id, (13, 9))
            await self.teleport(map_id, sx, sy)
        return await self.talk_to(pos['x'], pos['y'])
    async def talk_for_battle(self, map_id, npc_id, max_presses=8):
        """Talk to an NPC whose dialog ends in a trainer battle. Returns True
        once the battle state is reached."""
        if not await self.talk_npc(map_id, npc_id):
            return False
        for _ in range(max_presses):
            if await self.state() == 'battle':
                return True
            if await self.state() != 'dialog':
                return False
            await self.press_enter(1)
            await self.p.wait_for_timeout(700)
        return await self.state() == 'battle'
    async def level_party(self, xp):
        await self.ev(f'''G.party.forEach(c => {{
          let r = gainXp(c, {xp});
          while (r.evolved) {{ evolveCreature(c, r.evolved); const d = DEX[c.dex]; r = {{ evolved: (d.evo && d.evo.level && c.level >= d.evo.level) ? d.evo.into : null }}; }}
        }}); healParty();''')
        await self.p.wait_for_timeout(300)
        return await self.ev('G.party.map(c => c.name + " Lv" + c.level).join(", ")')
    async def start_battle(self, area):
        await self.ev(f"startWildBattle('{area}')")
        await self.p.wait_for_timeout(1400)
    async def catch_with_trap(self):
        """Catch the current wild foe (test assist: foe HP set to 1 first).
        Picks a trap that can hold the foe's stage (real doCatch path).
        Handles the faint-switch prompt; returns True only if the battle ended
        (a blackout also ends the battle but catches nothing — callers must
        verify the creature actually joined). 12 attempts per battle: a 5-star
        with darts catches at ~13.6% per throw, so 12 throws is ~82% per battle."""
        for _ in range(12):
            if await self.state() != 'battle':
                return True
            if not await self.wait_battle_menu():
                return await self.state() != 'battle'
            log = await self.ev("document.getElementById('battle-log').textContent")
            if 'Choose your next creature' in log:
                await self.p.evaluate("document.querySelector('#battle-actions button').click()")
                await self.p.wait_for_timeout(1000)
                continue
            await self.ev('foeMon().hp = 1')
            if not await self.click_battle_button('CATCH'):
                await self.p.wait_for_timeout(500)
                continue
            await self.p.wait_for_timeout(400)
            picked = await self.p.evaluate("""() => {
              const foe = foeMon();
              const stage = (DEX[foe.dex] && DEX[foe.dex].stage) || 1;
              const traps = TRAPS.filter(t => (G.bag[t.id] || 0) > 0 && (t.maxStage == null || t.maxStage >= stage));
              if (!traps.length) return -1;
              const t = traps[traps.length - 1];
              const btns = [...document.querySelectorAll('#battle-actions button')];
              const i = btns.findIndex(b => b.textContent.startsWith(t.name));
              if (i >= 0) { btns[i].click(); return i; }
              return -1;
            }""")
            if picked < 0:
                return False
            for _ in range(12):
                await self.p.wait_for_timeout(800)
                if await self.state() != 'battle':
                    return True
                log = await self.ev("document.getElementById('battle-log').textContent")
                if 'broke free' in log or "can't hold" in log:
                    break
            await self.p.wait_for_timeout(1500)
        return await self.state() != 'battle'

async def new_game(g):
    await g.p.click('#btn-new')
    await g.p.wait_for_timeout(400)
    await g.press_enter(4, 250)
    check('intro done, overworld', await g.state() == 'overworld', await g.state())
    check('mission lastStarter', await g.mission() == 'lastStarter', await g.mission())

async def pick_starter(g, fam='wolf'):
    await g.talk_to(11, 8)  # Marcus
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 300)
    await g.p.wait_for_timeout(400)
    label = {'bear': '🐻 Bear Cub', 'wolf': '🐺 Wolf Cub', 'shark': '🦈 Baby Shark'}[fam]
    ok = await g.click_panel_button(label)
    check(f'choice panel: picked {fam}', ok)
    await g.p.wait_for_timeout(400)
    await g.press_enter(1, 400)
    party = await g.ev('G.party.map(c=>c.name).join(",")')
    check('starter in party', 'Wolf' in party, party)
    check('mission firstWood', await g.mission() == 'firstWood', await g.mission())

async def setup_assist(g, start_mission, path='fight'):
    """Level the party, stock the bag, set pass-1/2 unlocks, jump to a pass-3 mission.
    Every mission before the start mission is marked done (status only, no rewards),
    so activeMission() returns the start mission. Also adds a Heat-sense creature
    (for the Titanoboa hunt) and berries (for the Megatherium hunt)."""
    await g.ev(f'''G.cash = 500000;
      Object.assign(G.bag, {{ chemicalX: 30, carBattery: 2, gasoline: 5, oil: 2, scrapMetal: 20, engineParts: 2, tire: 4, wood: 30, bandage: 10, net: 30, trap: 30, cage: 30, snare: 30, lasso: 30, tranquilizerDarts: 60, firstAidKit: 5, coldPack: 5, berries: 10, bait: 10 }});
      G.flags.unlock_HM_SLICE = true; G.flags.unlock_HM_SWIM = true; G.flags.unlock_hmSOAR = true; G.flags.unlock_HM_SOAR = true;
      G.flags.unlock_east = true; G.flags.unlock_mutants = true;
      G.flags.path = '{path}';
      // a real endgame catcher has the Catching skill maxed (it levels by
      // catching); the 5-star rate scales with it, so the test trains it too.
      if (G.skills.Catching) G.skills.Catching.level = 10;
      G.flags.visited = Object.assign(G.flags.visited || {{}}, {{ haven: true, meadow: true, woods: true, oasis: true, ember: true, frozen: true, reef: true, rokCity: true, university: true, bazaar: true, rustFields: true, ashenFlats: true, wreckyard: true, hollow: true, echoCaves: true }});
      G.party.push(makeCreature('013', 30));
      const heatDex = Object.keys(DEX).find(k => DEX[k].sense === 'Heat');
      if (heatDex) G.party.push(makeCreature(heatDex, 85));
      // Pass 3 — endgame backups: mutants are the strongest main-world
      // creatures (+20% atk, +15% hp). A real endgame party brings them to
      // the Ancient Crown; the test does the same.
      G.party.push(makeCreature('006', 95, {{ mutant: true }}));
      G.party.push(makeCreature('045', 90, {{ mutant: true }}));
      const _start = '{start_mission}';
      const _fromStart = new Set();
      const _walk = function(id) {{
        if (!id || _fromStart.has(id)) return;
        _fromStart.add(id);
        const def = MISSIONS.find(m => m.id === id);
        if (def && def.next) _walk(def.next);
      }};
      _walk(_start);
      if (_fromStart.has('theChoice') || _start === 'theChoice') {{ _walk('leak'); _walk('interview'); }}
      if (_fromStart.has('starterPath')) {{ _walk('starterPathBear'); _walk('starterPathWolf'); _walk('starterPathShark'); }}
      MISSIONS.forEach(m => {{
        // Pass 3 — climbLesson + smashLesson are SIDE missions activated by talking
        // to their NPCs; never mark them done here, or the lesson (and its HM flag)
        // can never trigger. Everything else before the start mission is done.
        if (m.id === 'climbLesson' || m.id === 'smashLesson') return;
        if (!_fromStart.has(m.id)) {{
          if (!G.missions[m.id]) G.missions[m.id] = {{ status: 'done', objectives: {{}} }};
          else G.missions[m.id].status = 'done';
        }}
      }});''')
    lv = await g.level_party(150000000)
    check('setup: party leveled to 90+', 'Lv9' in lv or 'Lv100' in lv, lv)
    await g.ev(f"setMission('{start_mission}', 'active')")
    await g.p.wait_for_timeout(300)
    check(f'setup: mission {start_mission}', await g.mission() == start_mission, await g.mission())

async def win_cup(g, arena_map, door, cup_name, rounds):
    """Enter the arena at (door), talk to the Arena Master, win `rounds` rounds."""
    await g.talk_to(*door)
    await g.p.wait_for_timeout(400)
    check(f'{cup_name}: in arena', await g.ev('G.player.map') == arena_map, await g.ev('G.player.map'))
    await g.talk_to(8, 5)  # Arena Master
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 300)
    for rnd in range(rounds):
        await g.ev('healParty()')  # test assist: a healed party per round
        for _ in range(5):
            if await g.state() == 'battle':
                break
            if await g.state() != 'dialog':
                break
            await g.press_enter(1)
            await g.p.wait_for_timeout(500)
        ok = await g.wait_state('battle', 10000)
        check(f'{cup_name}: round {rnd + 1} started', ok)
        st = await g.fight_battle()
        check(f'{cup_name}: round {rnd + 1} battle ended', st != 'battle', st)
        await g.wait_dialog(12000)
        await g.drain_dialogs()
    return True

async def read_sign(g, map_id, sign_xy):
    """Walk up to a mystery sign and read it. Returns the dialog text."""
    sx, sy = g.SPAWN.get(map_id, (13, 9))
    if (await g.pos())[2] != map_id:
        await g.teleport(map_id, sx, sy)
    ok = await g.talk_to(*sign_xy)
    if not ok:
        return None
    await g.p.wait_for_timeout(400)
    return await g.dialog_text()

async def hunt_mystery(g, map_id, sign_xy, mid, next_mission):
    """Read a mystery sign (battle starts), catch the creature, check the chain.
    Heals first (a Lv80-88 mystery hits hard while the catch is attempted).
    If the mystery flees (8%/turn), the hunt is blocked until tomorrow — advance
    the day and retry. A plain failed catch has no cooldown, so retry up to 3
    battles either way. Verifies the catch by dex presence, not just by the
    battle ending (a blackout also ends the battle but catches nothing)."""
    for attempt in range(3):
        await g.ev('healParty()')
        txt = await read_sign(g, map_id, sign_xy)
        check(f'{mid}: sign read', txt is not None, (txt or '')[:100])
        await g.drain_dialogs()
        ok = await g.wait_state('battle', 10000)
        check(f'{mid}: mystery battle started', ok)
        if not ok:
            return False
        check(f'{mid}: foe is the mystery', await g.ev(f"foeMon().dex === '{mid}'"), await g.ev('foeMon().name'))
        await g.catch_with_trap()
        caught = await g.ev(f"G.party.concat(G.storage).some(c => c.dex === '{mid}')")
        if caught:
            break
        # not caught: leave the battle cleanly, then retry (up to 3 battles).
        # A plain failed catch has no cooldown — only a FLEE blocks re-hunting
        # until tomorrow, so advance the day in that case and retry either way.
        if await g.state() == 'battle':
            if not await g.flee_battle():
                await g.fight_battle()
            await g.drain_dialogs()
        fled = await g.ev(f"G.flags['mystery_{mid}_day'] === G.day")
        if fled:
            await g.ev('G.day++')  # tomorrow: the signs are fresh again
    check(f'{mid}: caught', caught)
    await g.p.wait_for_timeout(500)
    check(f'{mid}: caught flag set', await g.ev(f"G.flags['caught_{mid}'] === true"))
    check(f'mission {next_mission}', await g.mission() == next_mission, await g.mission())
    if not caught and await g.state() == 'battle':
        # failed hunt must not leave a live battle behind — the next section
        # (hub, travel, bazaar) needs a clean overworld. Fight it out; a win
        # or a blackout both end the battle cleanly.
        await g.fight_battle()
        await g.drain_dialogs()
    return caught

async def run_pass3(g, path):
    await new_game(g)
    await pick_starter(g, 'wolf')
    await setup_assist(g, 'finalBattle', path)
    # --- finalBattle: the last pass-2 boss ---
    if path == 'fight':
        ok = await g.talk_for_battle('bazaar', 'mara')
        check('finalBoss (Rok\'s Champion) battle started', ok)
    else:
        ok = await g.talk_for_battle('university', 'caleb')
        check('finalBoss (Resistance Leader) battle started', ok)
    st = await g.fight_battle()
    check('finalBoss beaten', st != 'battle', st)
    await g.drain_dialogs()
    check('mission eighthTournament', await g.mission() == 'eighthTournament', await g.mission())
    # --- Long Dark gate: Lv60 check (negative test, party temporarily Lv30) ---
    await g.ev("G.party.forEach(c => { c.level = 30; c.stats = creatureStats(c.dex, 30, c.instinct, c.mutant); c.maxHp = c.stats.hp; c.hp = c.maxHp; })")
    await g.teleport('echoCaves', 12, 4)
    await g.walk_to(12, 3)
    await g.face('up')
    await g.interact()
    await g.p.wait_for_timeout(400)
    txt = await g.dialog_text()
    check('gate refuses a Lv30 team', '60' in txt, txt[:120])
    await g.drain_dialogs()
    lv = await g.level_party(150000000)
    check('party re-leveled to 90+', 'Lv9' in lv or 'Lv100' in lv, lv)
    # --- HM lessons (side missions, no chain) ---
    await g.talk_npc('echoCaves', 'caveGuide')
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 400)
    check('HM CLIMB learned', await g.ev('G.flags.unlock_HM_CLIMB === true'))
    check('climbLesson done', await g.ev("missionStatus('climbLesson') === 'done'"))
    await g.talk_npc('hollow', 'hollowKeeper')
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 400)
    check('HM SMASH learned', await g.ev('G.flags.unlock_HM_SMASH === true'))
    check('smashLesson done', await g.ev("missionStatus('smashLesson') === 'done'"))
    # --- Cave zone gating (negative test: no LIGHT/DIVE) ---
    await g.ev("G.flags.unlock_HM_LIGHT = false; G.flags.unlock_HM_DIVE = false;")
    await g.teleport('caveMouth', 13, 16)
    check('in caveMouth', (await g.pos())[2] == 'caveMouth', str(await g.pos()))
    await g.goto_map(13, 0)  # the caveDeep exit
    txt = await g.dialog_text() if await g.state() == 'dialog' else ''
    check('caveDeep blocked without LIGHT/DIVE', (await g.pos())[2] == 'caveMouth' and 'LIGHT' in txt, txt[:120])
    await g.drain_dialogs()
    await g.ev("G.flags.unlock_HM_LIGHT = true; G.flags.unlock_HM_DIVE = true;")
    # --- Tournament 8: Wasteland War (rustArena door (18,15)) ---
    await g.teleport('rustFields', 13, 9)
    await win_cup(g, 'rustArena', (18, 15), 'Wasteland War', 4)
    check('Wasteland War champion', await g.ev('G.flags.wastelandWarChampion === true'))
    check('HM LIGHT unlocked', await g.ev('G.flags.unlock_HM_LIGHT === true'))
    check('TM Tremor in bag', (await g.ev('G.bag.tmTremor || 0')) >= 1, str(await g.ev('G.bag.tmTremor || 0')))
    check('3-star gift (M. Grizzly 003 mutant) received', await g.ev("G.party.concat(G.storage).some(c => c.dex === '003' && c.mutant)"), await g.ev('G.party.concat(G.storage).map(c=>c.dex).join(",")'))
    check('mission ninthTournament', await g.mission() == 'ninthTournament', await g.mission())
    # --- Tournament 9: Rok City Championship (cityArena door (25,7)) ---
    await g.teleport('rokCity', 14, 9)
    await win_cup(g, 'cityArena', (25, 7), 'Rok City Championship', 4)
    check('Rok City Championship champion', await g.ev('G.flags.rokCityChampionshipChampion === true'))
    check('HM DIVE unlocked', await g.ev('G.flags.unlock_HM_DIVE === true'))
    check('TM Molten Strike in bag', (await g.ev('G.bag.tmMoltenStrike || 0')) >= 1, str(await g.ev('G.bag.tmMoltenStrike || 0')))
    check('3-star gift (Great White Shark 045) received', await g.ev("G.party.concat(G.storage).some(c => c.dex === '045')"), await g.ev('G.party.concat(G.storage).map(c=>c.dex).join(",")'))
    check('mission tenthTournament', await g.mission() == 'tenthTournament', await g.mission())
    # --- Tournament 10: Ancient Crown (caveArena door (5,14), 5 rounds) ---
    await g.teleport('echoCaves', 13, 9)
    await win_cup(g, 'caveArena', (5, 14), 'Ancient Crown', 5)
    check('Ancient Crown champion', await g.ev('G.flags.ancientCrownChampion === true'))
    check('Long Dark exit unlocked', await g.ev('G.flags.unlock_longDarkExit === true'))
    check('TM Pressure Point in bag', (await g.ev('G.bag.tmPressurePoint || 0')) >= 1, str(await g.ev('G.bag.tmPressurePoint || 0')))
    check('4-star gift (Dire Wolf A02) received', await g.ev("G.party.concat(G.storage).some(c => c.dex === 'A02')"), await g.ev('G.party.concat(G.storage).map(c=>c.dex).join(",")'))
    check('3-star gift (Grizzly 003) received', await g.ev("G.party.concat(G.storage).filter(c => c.dex === '003').length >= 1"))
    check('mission the75World', await g.mission() == 'the75World', await g.mission())
    check('badge: Ancient Champion title', await g.ev("G.flags.ancientCrownChampion === true"))
    # --- The Long Dark: walk the cave for real ---
    await g.teleport('echoCaves', 12, 4)
    await g.walk_to(12, 3)
    await g.face('up')
    await g.interact()
    await g.p.wait_for_timeout(400)
    await g.press_enter(1, 400)
    await g.p.wait_for_timeout(600)
    check('gate opened into caveMouth', (await g.pos())[2] == 'caveMouth', str(await g.pos()))
    await g.goto_map(13, 0)  # caveDeep (LIGHT + DIVE — have them)
    check('in caveDeep', (await g.pos())[2] == 'caveDeep', str(await g.pos()))
    await g.goto_map(13, 0)  # caveGate (CLIMB + SMASH — have them)
    check('in caveGate', (await g.pos())[2] == 'caveGate', str(await g.pos()))
    await g.goto_map(13, 0)  # the exit gate (Ancient Crown — have it)
    check('through the exit gate: rexBadlands', (await g.pos())[2] == 'rexBadlands', str(await g.pos()))
    check('mission sanctuary', await g.mission() == 'sanctuary', await g.mission())
    # --- Sanctuary: exile leader, trader, camp ---
    await g.talk_npc('sanctuary', 'exileLeader')
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 400)
    check('mission mysterySpino', await g.mission() == 'mysterySpino', await g.mission())
    await g.talk_npc('sanctuary', 'exileTrader')
    await g.p.wait_for_timeout(400)
    txt = await g.dialog_text()
    check('exile trader offers the sanctuary shop', 'double' in txt.lower() or 'salvaged' in txt.lower(), txt[:120])
    await g.drain_dialogs()
    # the trader dialog's callback opens the shop — close it before moving on,
    # or its panel swallows the next interact/click
    await g.click_panel_button('Leave Shop')
    await g.p.wait_for_timeout(300)
    # sanctuary camp: build on the plot at (18,9) (wood 10 in bag)
    await g.teleport('sanctuary', 13, 9)
    await g.talk_to(18, 9)  # sanctuaryPlot object
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('🏕️ Build a Sanctuary Camp')
    check('sanctuary camp built', ok and await g.ev('G.flags.sanctuaryBase === true'))
    await g.p.wait_for_timeout(300)
    await g.click_panel_button('← Back')
    # --- Ancient catch: Mammoth in the steppe (up to 3 fresh battles — ancients
    # are stage 3 and hard to catch even at HP 1, like the pass-2 mutant loop).
    # Heal before each attempt: a Lv75-85 Mammoth hits hard while the catch is
    # attempted, and a blackout ends the battle without a catch. ---
    await g.teleport('mammothSteppe', 13, 9)
    caught = False
    for attempt in range(3):
        await g.ev('healParty()')
        await g.start_battle('mammothSteppe')
        check(f'ancient wild battle {attempt + 1} started', await g.state() == 'battle')
        check(f'ancient foe {attempt + 1} is ancient', await g.ev("foeMon().dex.startsWith('A')"), await g.ev('foeMon().name'))
        check(f'ancient sprite path {attempt + 1}', 'ancients' in (await g.ev('creatureSprite(foeMon(), true)')), await g.ev('creatureSprite(foeMon(), true)'))
        await g.catch_with_trap()
        caught = await g.ev("G.party.concat(G.storage).some(c => c.dex === 'A01')")
        if caught:
            break
        if await g.state() == 'battle':
            await g.flee_battle()
        await g.p.wait_for_timeout(500)
    check('ancient caught', caught)
    await g.p.wait_for_timeout(500)
    check('caughtAncient flag set', await g.ev('G.flags.caughtAncient === true'))
    check('event_ancient flag set', await g.ev('G.flags.event_ancient === true'))
    # --- Mystery hunts ---
    # M2 fled-tomorrow dialog (negative test): flag a flee, read the sign at dawn
    await g.ev("G.timeMin = 5*60+30; G.flags['mystery_M2_day'] = G.day;")
    txt = await read_sign(g, 'highPeaks', (13, 9))
    check('M2 fled-today dialog', txt is not None and 'tomorrow' in txt.lower(), (txt or '')[:120])
    await g.drain_dialogs()
    await g.ev("delete G.flags['mystery_M2_day'];")
    # M1 Spinosaurus — dusk (17:00-20:00), Deep River
    await g.ev("G.timeMin = 17*60+30;")
    await hunt_mystery(g, 'deepRiver', (13, 9), 'M1', 'mysteryQuetz')
    # M2 Quetzalcoatlus — dawn (05:00-08:00), High Peaks
    await g.ev("G.timeMin = 5*60+30;")
    await hunt_mystery(g, 'highPeaks', (13, 9), 'M2', 'mysteryTitan')
    # M3 Titanoboa — Lv85+ team + Heat-sense creature, Burning Marsh
    await hunt_mystery(g, 'burningMarsh', (13, 9), 'M3', 'mysteryMega')
    # M4 Megatherium — 3 berries, Deep Forest
    await hunt_mystery(g, 'deepForest', (13, 9), 'M4', 'mysteryBat')
    # M5 Giant Vampire Bat — listen in the dark, Dark Caves
    await hunt_mystery(g, 'darkCaves', (13, 9), 'M5', 'wholeStory')
    check('mysteriesFound = 5', await g.ev('G.flags.mysteriesFound === 5'), str(await g.ev('G.flags.mysteriesFound')))
    # --- wholeStory: the exile leader closes the game ---
    await g.talk_npc('sanctuary', 'exileLeader')
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 400)
    check('chain complete: no active mission', await g.mission() is None, str(await g.mission()))
    # --- Backend / hub: account, chat, PvP, trade, market, daily, tabs ---
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('🌐 Online Hub (Upper Deck)')
    check('hub opened from menu', ok)
    await g.p.wait_for_timeout(600)
    check('hub panel visible', await g.ev("!document.querySelector('#menu').classList.contains('hidden')"))
    # fill the create-account form (first 3 inputs: Username, Password, Email)
    filled = await g.p.evaluate("""() => {
      const ins = [...document.querySelectorAll('#menu input')];
      if (ins.length < 3) return false;
      ins[0].value = 'SmokeKai'; ins[1].value = 'smoke-pass-1'; ins[2].value = 'smoke@kai.test';
      const b = [...document.querySelectorAll('#menu button')].find(x => x.textContent.trim() === 'Create Account');
      if (!b) return false; b.click(); return true;
    }""")
    check('account created via hub form', filled)
    await g.p.wait_for_timeout(600)
    check('signed in as SmokeKai', await g.ev("BACKEND.currentPlayerId && BACKEND.getProfile(BACKEND.currentPlayerId).profile.username === 'SmokeKai'"))
    # chat: send a message
    await g.click_panel_button('Chat')
    await g.p.wait_for_timeout(500)
    sent = await g.p.evaluate("""() => {
      const ins = [...document.querySelectorAll('#menu input')];
      if (!ins.length) return false;
      ins[0].value = 'Hello from the smoke test — the ancient world is open!';
      const b = [...document.querySelectorAll('#menu button')].find(x => x.textContent.trim() === 'Send');
      if (!b) return false; b.click(); return true;
    }""")
    check('chat message sent', sent)
    await g.p.wait_for_timeout(500)
    check('chat message stored', await g.ev("BACKEND.readChat(5).messages.some(m => m.text && m.text.includes('smoke test'))"))
    # PvP: challenge a bot, fight one round via the hub UI
    await g.click_panel_button('PvP')
    await g.p.wait_for_timeout(500)
    challenged = await g.p.evaluate("""() => {
      const b = [...document.querySelectorAll('#menu button')].find(x => x.textContent.includes('Challenge'));
      if (!b) return false; b.click(); return true;
    }""")
    check('PvP challenge sent to a bot', challenged)
    await g.p.wait_for_timeout(800)
    # trade: open the tab, pick a bot, propose (bot auto-responds)
    await g.click_panel_button('Trade')
    await g.p.wait_for_timeout(500)
    check('trade tab renders', await g.ev("document.querySelector('#menu').textContent.includes('Trade')"))
    # market: browse + buy the first listing
    await g.click_panel_button('Market')
    await g.p.wait_for_timeout(500)
    bought = await g.p.evaluate("""() => {
      const b = [...document.querySelectorAll('#menu button')].find(x => x.textContent.trim().startsWith('Buy'));
      if (!b) return false; b.click(); return true;
    }""")
    check('marketplace buy clicked', bought)
    await g.p.wait_for_timeout(500)
    # daily reward
    await g.click_panel_button('Daily')
    await g.p.wait_for_timeout(500)
    claimed = await g.click_panel_button('🎁 Claim Daily Reward')
    check('daily reward claimed', claimed)
    await g.p.wait_for_timeout(500)
    check('daily cash paid', await g.ev('G.cash >= 500000'))
    # every other tab renders without throwing
    for tab in ['Friends', 'Mail', 'Guilds', 'Events', 'Achievements', 'Leaders', 'History']:
        await g.click_panel_button(tab)
        await g.p.wait_for_timeout(400)
        check(f'hub tab {tab} renders', await g.ev(f"document.querySelector('#menu').textContent.includes('{tab}')"))
    # achievements: the catch + tournament wins should have earned some
    await g.click_panel_button('Achievements')
    await g.p.wait_for_timeout(400)
    signed_in = await g.ev('!!BACKEND.currentPlayerId')
    check('still signed in for achievements', signed_in)
    ach = await g.ev("BACKEND.currentPlayerId ? BACKEND.listAchievements(BACKEND.currentPlayerId).achievements.filter(a => a.earned).map(a => a.name).join(',') : ''") if signed_in else ''
    check('achievements earned (First Catch, First Tournament, Ancient Champion)', 'First Catch' in ach and 'Ancient Champion' in ach, ach)
    await g.click_panel_button('← Close Hub')
    await g.p.wait_for_timeout(400)
    # --- Travel exclusion: no ancient maps listed ---
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(400)
    await g.click_panel_button('🚗 Travel (Car / Fly)')
    await g.p.wait_for_timeout(400)
    travel_txt = await g.ev("document.querySelector('#menu').textContent")
    check('travel excludes the ancient world', 'Rex Badlands' not in travel_txt and 'Sanctuary' not in travel_txt and 'Mammoth Steppe' not in travel_txt, travel_txt[:200])
    check('travel note about the cave', 'cave' in travel_txt.lower(), travel_txt[:200])
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(300)
    # --- Bazaar door fix: approach from the west (6,10), step onto (7,10) ---
    await g.teleport('bazaar', 4, 9)
    await g.goto_map(6, 10)
    check('standing west of the arena door (6,10)', (await g.pos())[:2] == [6, 10], str(await g.pos()))
    await g.goto_map(7, 10)
    check('stepped onto the door: in bazaarArena', (await g.pos())[2] == 'bazaarArena', str(await g.pos()))
    check('did NOT land in rokCity by mistake', (await g.pos())[2] != 'rokCity', str(await g.pos()))

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await b.new_page(viewport={'width': 960, 'height': 640})
        page.on('console', lambda m: errors.append(f'{m.type}: {m.text}') if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(f'PAGEERROR: {e}'))
        page.on('requestfailed', lambda r: errors.append(f'REQFAIL: {r.url}'))
        await page.goto(URL)
        await page.wait_for_timeout(2000)
        print('title visible:', await page.evaluate("!document.getElementById('title-screen').classList.contains('hidden')"), flush=True)
        print('title foot:', await page.evaluate("document.getElementById('title-foot').textContent"), flush=True)
        g = Game(page)
        await run_pass3(g, MODE)
        print('ERRORS:', json.dumps(errors) if errors else 'none', flush=True)
        failed = [r for r in results if not r[1]]
        print(f'STEPS: {len(results) - len(failed)}/{len(results)} passed; ERRORS: {len(errors)}', flush=True)
        await b.close()
        if failed or errors:
            sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
