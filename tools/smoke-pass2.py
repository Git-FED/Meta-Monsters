"""Metamonsters Revision Pass 2 — headless playthrough.
Usage: python3 tools/smoke-pass2.py [fight|join]   (default: fight)
  fight = full run: new game -> wolf starter -> setup assist -> Rok City Phase 3
          -> tournaments 4-7 (Desert Heat, Bazaar Brawl, Frost Crown, University
          Games) -> MEGA evolution -> The Choice (FIGHT) -> fight path (leak,
          indieAlliance, securityTeam, facility, exposure) -> dumpSite -> east
          -> mutants (3 catches) -> theWreckyard -> theCave (Lv80 mutant alpha
          gate battle + sealed-gate dialog) -> finalBattle (Rok's Champion)
          -> car buy/refuel/upgrade + drive -> fly with HM SOAR.
  join  = branch run: new game -> wolf starter -> setup assist -> theChoice
          (JOIN) -> east-lock check -> interview -> ladder -> quietFriendsPath
          -> dirtyWork starts -> switchPath back to FIGHT (one-time) ->
          abandoned mission + hostile_join + plaza refusal.
Collects console errors / pageerrors / failed requests; prints PASS/FAIL per step.
Test assists (not gameplay cheats — the exercised code paths run for real):
  - gainXp() to level the party (simulates a trained party);
  - foe HP set to 1 before a catch attempt (the shake/finishCatch/mission path runs for real);
  - healParty() before battles (simulates a healed party);
  - changeMap() teleports between distant maps (the map-change, reach-objective,
    lock and render code runs for real — the walks themselves are pass-1 covered);
  - setMission('rokCity'|'theChoice') to start at the pass-2 layer (pass-1 chain
    is covered by smoke-pass1.py).
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
        """Fight the current battle to its end with FIGHT + first move. Handles switches."""
        for _ in range(150):
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
            if not await self.click_battle_button('FIGHT'):
                await self.p.wait_for_timeout(500)
                continue
            await self.p.wait_for_timeout(400)
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
        flags.visited, reach objectives, Caleb move, bike dismount)."""
        await self.ev(f"changeMap('{map_id}', {x}, {y})")
        await self.p.wait_for_timeout(600)
        return (await self.pos())[2] == map_id
    # safe teleport landing tiles per map (on open ground, not on an exit/object).
    # Bazaar: row 11 is a cliff wall and (8,10) is the rokCity exit, so land west
    # at (4,9) — the arena door (7,10) is then approached from (6,10).
    SPAWN = {'haven': (11, 7), 'rokCity': (14, 9), 'bazaar': (4, 9), 'university': (12, 10),
             'rustFields': (13, 9), 'ashenFlats': (13, 9), 'wreckyard': (13, 9),
             'hollow': (13, 9), 'echoCaves': (13, 9), 'ember': (13, 9), 'frozen': (13, 9),
             'meadow': (15, 9), 'woods': (13, 9), 'oasis': (13, 9), 'reef': (13, 9)}
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
        Picks a trap that can hold the foe's stage (real doCatch path)."""
        for _ in range(8):
            if await self.state() != 'battle':
                return True
            await self.ev('foeMon().hp = 1')
            if not await self.wait_battle_menu():
                return await self.state() != 'battle'
            await self.click_battle_button('CATCH')
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

async def setup_assist(g, start_mission):
    """Level the party, stock the bag, set pass-1 unlocks, jump to a pass-2 mission.
    Every mission before the start mission is marked done (status only, no rewards),
    so activeMission() returns the start mission — in real play only one mission is
    ever active at a time, and setMission alone does not deactivate earlier ones."""
    await g.ev(f'''G.cash = 200000;
      Object.assign(G.bag, {{ chemicalX: 5, carBattery: 2, gasoline: 5, oil: 2, scrapMetal: 20, engineParts: 2, tire: 4, wood: 20, bandage: 5, net: 20, trap: 20, cage: 20, snare: 20, lasso: 20, firstAidKit: 5, coldPack: 5 }});
      G.flags.unlock_HM_SLICE = true; G.flags.unlock_HM_SWIM = true;
      G.flags.visited = Object.assign(G.flags.visited || {{}}, {{ haven: true, meadow: true, woods: true, oasis: true, ember: true, frozen: true, reef: true }});
      G.party.push(makeCreature('013', 30));
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
        if (!_fromStart.has(m.id)) {{
          if (!G.missions[m.id]) G.missions[m.id] = {{ status: 'done', objectives: {{}} }};
          else G.missions[m.id].status = 'done';
        }}
      }});''')
    lv = await g.level_party(8000000)
    check('setup: party leveled', 'Lv' in lv, lv)
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
        await g.ev('healParty()')  # test assist: a healed party per round (simulates healing between rounds)
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

async def run_fight(g):
    await new_game(g)
    await pick_starter(g, 'wolf')
    await setup_assist(g, 'rokCity')
    # --- Phase 3: walk into Rok City for real (haven west exit) ---
    await g.goto_map(0, 9)
    check('in Rok City', (await g.pos())[2] == 'rokCity', str(await g.pos()))
    check('mission universityKids', await g.mission() == 'universityKids', await g.mission())
    check('Caleb moved to university', await g.ev('G.flags.calebMoved === true'))
    # universityKids: talk to the student, beat the drunk students
    ok = await g.talk_for_battle('university', 'universityStudent')
    check('drunkStudents battle started', ok)
    st = await g.fight_battle()
    check('drunkStudents beaten', st != 'battle', st)
    await g.drain_dialogs()
    check('mission corruption', await g.mission() == 'corruption', await g.mission())
    # corruption: talk to the street dealer, then reach the bazaar
    await g.talk_npc('rokCity', 'streetDealer')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('corruption talk done', await g.ev("objectiveDone('corruption','talk')"))
    await g.goto_map(5, 6)  # bazaar door
    check('in bazaar', (await g.pos())[2] == 'bazaar', str(await g.pos()))
    check('mission flock', await g.mission() == 'flock', await g.mission())
    # flock: talk to the officer, then reach the university
    await g.talk_npc('rokCity', 'flockOfficer')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('flock talk done', await g.ev("objectiveDone('flock','talk')"))
    await g.goto_map(21, 6)  # university door
    check('in university', (await g.pos())[2] == 'university', str(await g.pos()))
    check('mission fourthTournament', await g.mission() == 'fourthTournament', await g.mission())
    # --- Tournaments 4-7 ---
    await g.teleport('ember', 19, 7)
    await win_cup(g, 'emberArena', (19, 6), 'Desert Heat', 3)
    check('Desert Heat champion', await g.ev('G.flags.desertHeatChampion === true'))
    check('TM Fire Breath in bag', (await g.ev('G.bag.tmFireBreath || 0')) >= 1, str(await g.ev('G.bag.tmFireBreath || 0')))
    check('mission fifthTournament', await g.mission() == 'fifthTournament', await g.mission())
    await g.teleport('bazaar', 4, 9)
    await win_cup(g, 'bazaarArena', (7, 10), 'Bazaar Brawl', 4)
    check('Bazaar Brawl champion', await g.ev('G.flags.bazaarBrawlChampion === true'))
    check('TM Electric Shock in bag', (await g.ev('G.bag.tmElectricShock || 0')) >= 1, str(await g.ev('G.bag.tmElectricShock || 0')))
    check('3-star gift (Reticulated Python 030) received', await g.ev("G.party.concat(G.storage).some(c => c.dex === '030')"), await g.ev('G.party.concat(G.storage).map(c=>c.dex).join(",")'))
    check('HM SOAR unlocked', await g.ev('G.flags.unlock_hmSOAR === true || G.flags.unlock_HM_SOAR === true'))
    check('mission sixthTournament', await g.mission() == 'sixthTournament', await g.mission())
    await g.teleport('frozen', 19, 7)
    await win_cup(g, 'frostArena', (19, 6), 'Frost Crown', 4)
    check('Frost Crown champion', await g.ev('G.flags.frostCrownChampion === true'))
    check('TM Flash in bag', (await g.ev('G.bag.tmFlash || 0')) >= 1, str(await g.ev('G.bag.tmFlash || 0')))
    check('mission seventhTournament', await g.mission() == 'seventhTournament', await g.mission())
    # University Games final is Caleb (Lv58-60): level the party past him first
    lv = await g.level_party(12000000)
    check('party leveled for Caleb', 'Lv' in lv, lv)
    await g.teleport('university', 19, 7)
    await win_cup(g, 'universityArena', (19, 6), 'University Games', 4)
    check('University Games champion', await g.ev('G.flags.universityGamesChampion === true'))
    check('TM Sonic Scream in bag', (await g.ev('G.bag.tmSonicScream || 0')) >= 1, str(await g.ev('G.bag.tmSonicScream || 0')))
    check('mission theChoice', await g.mission() == 'theChoice', await g.mission())
    # --- MEGA evolution (party leader is Alpha Wolf 006, mega-eligible) ---
    await g.ev('healParty()')
    await g.start_battle('rokCity')
    check('mega test: wild battle started', await g.state() == 'battle')
    await g.wait_battle_menu()
    has_mega = await g.ev("[...document.querySelectorAll('#battle-actions button')].some(b => b.textContent.includes('MEGA'))")
    check('MEGA button offered', has_mega)
    if has_mega:
        clicked = await g.p.evaluate("""() => {
          const b = [...document.querySelectorAll('#battle-actions button')].find(x => x.textContent.includes('MEGA'));
          if (b) { b.click(); return true; } return false;
        }""")
        check('MEGA button clicked', clicked)
        await g.p.wait_for_timeout(800)
        check('mega applied to leader', await g.ev("G.party[0].mega === true"), await g.ev('G.party[0].name'))
        check('mega name shows', 'Mega' in (await g.ev('G.party[0].name')), await g.ev('G.party[0].name'))
    st = await g.fight_battle()
    check('mega battle ended', st != 'battle', st)
    check('mega cleared after battle', await g.ev('G.party.every(c => !c.mega)'))
    # --- The Choice: FIGHT ---
    await g.talk_npc('bazaar', 'mara')
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('⚔️ FIGHT')
    check('choice panel: FIGHT picked', ok)
    await g.p.wait_for_timeout(400)
    await g.press_enter(1, 400)
    check('path = fight', await g.ev("G.flags.path === 'fight'"))
    check('mission leak', await g.mission() == 'leak', await g.mission())
    # plaza refuses the resistance (fight path)
    await g.teleport('rokCity', 12, 11)
    await g.talk_to(12, 10)  # plaza stall
    await g.p.wait_for_timeout(400)
    txt = await g.dialog_text()
    check('plaza refuses fight path', 'resistance' in txt.lower() or 'traitor' in txt.lower(), txt[:120])
    await g.drain_dialogs()
    # leak: talk to Mara, bazaar reach auto-completes (visited)
    await g.talk_npc('bazaar', 'mara')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission indieAlliance', await g.mission() == 'indieAlliance', await g.mission())
    # indieAlliance: Pippa in haven, then the bazaar merchant
    await g.talk_npc('haven', 'pippa')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('indieAlliance pippa done', await g.ev("objectiveDone('indieAlliance','pippa')"))
    await g.talk_npc('bazaar', 'bazaarMerchant')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission securityTeam', await g.mission() == 'securityTeam', await g.mission())
    # securityTeam: two trainer battles via Mara
    ok = await g.talk_for_battle('bazaar', 'mara')
    check('secTrainer1 battle started', ok)
    st = await g.fight_battle()
    check('secTrainer1 beaten', st != 'battle', st)
    await g.drain_dialogs()
    ok = await g.talk_for_battle('bazaar', 'mara')
    check('secTrainer2 battle started', ok)
    st = await g.fight_battle()
    check('secTrainer2 beaten', st != 'battle', st)
    await g.drain_dialogs()
    check('mission facility', await g.mission() == 'facility', await g.mission())
    # facility: talk to Mara, then the guard battle
    await g.talk_npc('bazaar', 'mara')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('facility talk done', await g.ev("objectiveDone('facility','talk')"))
    ok = await g.talk_for_battle('bazaar', 'mara')
    check('facilityGuard battle started', ok)
    st = await g.fight_battle()
    check('facilityGuard beaten', st != 'battle', st)
    await g.drain_dialogs()
    check('mission exposure', await g.mission() == 'exposure', await g.mission())
    # exposure: Mara, then the bazaar merchant
    await g.talk_npc('bazaar', 'mara')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('exposure talk done', await g.ev("objectiveDone('exposure','talk')"))
    await g.talk_npc('bazaar', 'bazaarMerchant')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission dumpSite', await g.mission() == 'dumpSite', await g.mission())
    check('east unlocked', await g.ev('G.flags.unlock_east === true'))
    check('mutants NOT yet unlocked', await g.ev('!G.flags.unlock_mutants'))
    # mutants locked until dumpSite completes: a wild east foe is still normal
    await g.teleport('rustFields', 13, 9)
    await g.start_battle('rustFields')
    check('pre-dumpSite east foe is normal', await g.ev('foeMon().mutant !== true'), await g.ev('foeMon().name'))
    await g.flee_battle()
    # dumpSite: reach wreckyard + talk to the warden
    await g.teleport('wreckyard', 10, 9)
    check('dumpSite reach done', await g.ev("objectiveDone('dumpSite','wreckyard')"))
    await g.talk_to(10, 8)  # Dump Warden
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission theEast (or already theMutants — reach auto-completes for visited maps)', await g.mission() in ('theEast', 'theMutants'), await g.mission())
    check('mutants unlocked by dumpSite', await g.ev('G.flags.unlock_mutants === true'))
    check('Chemical X x2 from dumpSite', (await g.ev('G.bag.chemicalX || 0')) >= 2, str(await g.ev('G.bag.chemicalX || 0')))
    # theEast: reach the Rust Fields (auto-completes if already visited on the way east)
    await g.teleport('rustFields', 13, 9)
    check('mission theMutants', await g.mission() == 'theMutants', await g.mission())
    # theMutants: 3 mutant catches (foe must be mutant + mutant sprite path).
    # Mutant catch rate is 0.6x, so each required catch gets up to 3 fresh battles.
    for i in range(3):
        caught = False
        for attempt in range(3):
            await g.start_battle('rustFields')
            check(f'mutant catch {i + 1}: foe is mutant', await g.ev('foeMon().mutant === true'), await g.ev('foeMon().name'))
            check(f'mutant catch {i + 1}: mutant sprite path', 'mutant' in (await g.ev('creatureSprite(foeMon(), true)')), await g.ev('creatureSprite(foeMon(), true)'))
            caught = await g.catch_with_trap()
            if caught:
                break
            if await g.state() == 'battle':
                await g.flee_battle()
            await g.p.wait_for_timeout(500)
        check(f'mutant catch {i + 1}: caught', caught)
        await g.p.wait_for_timeout(500)
    check('mission theWreckyard', await g.mission() == 'theWreckyard', await g.mission())
    # theWreckyard: talk to the scavenger (reach auto-completes)
    await g.talk_npc('wreckyard', 'wreckyardScavenger')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission theCave', await g.mission() == 'theCave', await g.mission())
    # theCave: level up, then the gate battle (Lv80 mutant alpha)
    lv = await g.level_party(50000000)
    check('party leveled for the gate', 'Lv' in lv, lv)
    await g.teleport('echoCaves', 12, 4)
    await g.walk_to(12, 3)  # stand directly in front of the gate (12,2)
    await g.face('up')
    await g.interact()
    await g.p.wait_for_timeout(400)
    await g.press_enter(2, 400)  # gate dialog (2 lines) -> battle
    ok = await g.wait_state('battle', 10000)
    check('mutantAlpha gate battle started', ok)
    check('gate foe is Lv80 mutant', await g.ev('foeMon().level === 80 && foeMon().mutant === true'), await g.ev('foeMon().name + " Lv" + foeMon().level'))
    st = await g.fight_battle()
    check('mutantAlpha beaten', st != 'battle', st)
    await g.drain_dialogs()
    check('mission finalBattle', await g.mission() == 'finalBattle', await g.mission())
    # gate is open in pass 3: the party is Lv80+, so the gate leads to the Mouth
    await g.face('up')
    await g.interact()
    await g.p.wait_for_timeout(400)
    txt = await g.dialog_text()
    check('gate opens for a Lv60+ team', 'open' in txt.lower() and 'long dark' in txt.lower(), txt[:120])
    await g.drain_dialogs()
    check('through the gate: caveMouth', (await g.pos())[2] == 'caveMouth', str(await g.pos()))
    await g.teleport('echoCaves', 13, 9)
    # finalBattle: Mara sends Kai against Rok's Champion
    ok = await g.talk_for_battle('bazaar', 'mara')
    check('finalBoss battle started', ok)
    st = await g.fight_battle()
    check('finalBoss beaten', st != 'battle', st)
    await g.drain_dialogs()
    # Pass-3 fix: the chain no longer ends at finalBattle — finalBattle.next is
    # eighthTournament (tournaments 8-10, the Long Dark, the 75+ world). The old
    # "no active mission" expectation is from pass 2, when the chain ended here.
    check('chain continues: mission eighthTournament', await g.mission() == 'eighthTournament', str(await g.mission()))
    # --- Transport: car + fly ---
    await g.teleport('haven', 18, 7)
    await g.talk_to(18, 6)  # home plot -> base menu
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('🚗 Buy Car')
    check('car bought', ok and await g.ev('G.flags.hasCar === true'))
    await g.p.wait_for_timeout(300)
    ok = await g.click_panel_button('⛽ Refuel')
    check('car refueled', ok and (await g.ev('G.flags.carFuel || 0')) >= 1, str(await g.ev('G.flags.carFuel || 0')))
    await g.p.wait_for_timeout(300)
    ok = await g.click_panel_button('🔧 Better Engine')
    check('Better Engine installed', ok and await g.ev('(G.flags.carUpgrades || {}).engine === true'))
    await g.p.wait_for_timeout(300)
    await g.click_panel_button('← Back')
    await g.p.wait_for_timeout(300)
    # drive to Rok City
    fuel_before = await g.ev('G.flags.carFuel || 0')
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(400)
    await g.click_panel_button('🚗 Travel (Car / Fly)')
    await g.p.wait_for_timeout(400)
    drove = await g.p.evaluate("""() => {
      const rows = [...document.querySelectorAll('#menu .panel .row')];
      const row = rows.find(r => r.textContent.includes('Rok City'));
      if (!row) return false;
      const b = [...row.querySelectorAll('button')].find(x => x.textContent.startsWith('🚗 Drive'));
      if (!b || b.disabled) return false;
      b.click(); return true;
    }""")
    check('drove to Rok City', drove)
    await g.p.wait_for_timeout(600)
    check('in Rok City after drive', (await g.pos())[2] == 'rokCity', str(await g.pos()))
    check('fuel spent', (await g.ev('G.flags.carFuel || 0')) == fuel_before - 1, f'{fuel_before} -> {await g.ev("G.flags.carFuel || 0")}')
    # fly back to Haven Village on the Eaglet (partyBird needs a HEALTHY bird —
    # the finalBoss battle may have fainted the eagle, so heal first)
    await g.ev('healParty()')
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(400)
    await g.click_panel_button('🚗 Travel (Car / Fly)')
    await g.p.wait_for_timeout(400)
    flew = await g.p.evaluate("""() => {
      const rows = [...document.querySelectorAll('#menu .panel .row')];
      const row = rows.find(r => r.textContent.includes('Haven Village'));
      if (!row) return false;
      const b = [...row.querySelectorAll('button')].find(x => x.textContent.startsWith('🦅 Fly'));
      if (!b || b.disabled) return false;
      b.click(); return true;
    }""")
    check('flew to Haven Village', flew)
    await g.p.wait_for_timeout(600)
    check('in Haven after fly', (await g.pos())[2] == 'haven', str(await g.pos()))

async def run_join(g):
    await new_game(g)
    await pick_starter(g, 'wolf')
    await setup_assist(g, 'theChoice')
    # east is locked before the dump site story
    await g.ev("changeMap('rustFields', 1, 9)")
    await g.p.wait_for_timeout(500)
    check('east locked before dumpSite', (await g.pos())[2] != 'rustFields' and await g.state() == 'dialog', str(await g.pos()))
    await g.drain_dialogs()
    # theChoice: JOIN via Caleb in haven
    await g.talk_npc('haven', 'caleb')
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('🏢 JOIN')
    check('choice panel: JOIN picked', ok)
    await g.p.wait_for_timeout(400)
    await g.press_enter(1, 400)
    check('path = join', await g.ev("G.flags.path === 'join'"))
    check('mission interview', await g.mission() == 'interview', await g.mission())
    # interview: Caleb at the university, then reach the tower
    await g.talk_npc('university', 'caleb')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('interview talk done', await g.ev("objectiveDone('interview','talk')"))
    check('mission ladder', await g.mission() == 'ladder', await g.mission())
    check('corp rank Intern (1)', await g.ev('G.flags.corpRank === 1'), str(await g.ev('G.flags.corpRank')))
    # ladder: Caleb, then the plaza clerk
    await g.talk_npc('university', 'caleb')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('ladder talk done', await g.ev("objectiveDone('ladder','talk')"))
    await g.talk_npc('rokCity', 'plazaClerk')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission quietFriendsPath', await g.mission() == 'quietFriendsPath', await g.mission())
    # quietFriendsPath: Caleb, then Marcus
    await g.talk_npc('university', 'caleb')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('quietFriendsPath talk done', await g.ev("objectiveDone('quietFriendsPath','talk')"))
    await g.talk_npc('haven', 'marcus')
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission dirtyWork', await g.mission() == 'dirtyWork', await g.mission())
    # switchPath: one-time reconsider back to FIGHT
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('🔄 Reconsider your side')
    check('switch sides button offered', ok)
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('Switch to the resistance')
    check('switch to resistance picked', ok)
    await g.p.wait_for_timeout(400)
    check('path = fight after switch', await g.ev("G.flags.path === 'fight'"))
    check('hostile_join set', await g.ev('G.flags.hostile_join === true'))
    check('switched flag set', await g.ev('G.flags.switched === true'))
    check('dirtyWork abandoned', await g.ev('G.missions.dirtyWork.abandoned === true'))
    check('mission leak after switch', await g.mission() == 'leak', await g.mission())
    # switch button is gone now (one-time)
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(400)
    gone = await g.p.evaluate("""() => ![...document.querySelectorAll('#menu button')].some(b => b.textContent.includes('Reconsider your side'))""")
    check('switch button gone (one-time)', gone)
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(300)
    # Mara refuses... no — Mara welcomes the switched Kai; the PLAZA refuses (hostile_join? no — plaza refuses fight path)
    await g.teleport('rokCity', 12, 11)
    await g.talk_to(12, 10)  # plaza stall
    await g.p.wait_for_timeout(400)
    txt = await g.dialog_text()
    check('plaza refuses after switch to fight', 'resistance' in txt.lower() or 'traitor' in txt.lower(), txt[:120])
    await g.drain_dialogs()

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
        print('title bg:', await page.evaluate("document.getElementById('title-bg').getAttribute('src')"), flush=True)
        g = Game(page)
        if MODE == 'join':
            await run_join(g)
        else:
            await run_fight(g)
        print('ERRORS:', json.dumps(errors) if errors else 'none', flush=True)
        failed = [r for r in results if not r[1]]
        print(f'STEPS: {len(results) - len(failed)}/{len(results)} passed; ERRORS: {len(errors)}', flush=True)
        await b.close()
        if failed or errors:
            sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
