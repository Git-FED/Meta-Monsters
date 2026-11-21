"""Metamonsters Revision Pass 1 — headless playthrough.
Usage: python3 tools/smoke-pass1.py [wolf|bear|shark]   (default: wolf)
  wolf  = full run: starter choice -> wood -> catch -> base -> wolf path -> Rookie Cup
          -> all 8 Phase-2 missions -> Forest Clash -> Reef Rumble -> coldNorth -> coast
          -> bicycle + garage -> TM teach.
  bear  = short run: bear starter -> Learn to Hunt (track in Grizzly Den + hunt catch).
  shark = short run: shark starter -> Cross the Water (pond + far bank).
Collects console errors / pageerrors / failed requests; prints PASS/FAIL per step.
Test assists (not gameplay cheats — the exercised code paths run for real):
  - gainXp() to level the party before cups (simulates a trained party);
  - foe HP set to 1 before a catch attempt (the shake/finishCatch/mission path runs for real);
  - healParty() before battles (simulates a healed party).
Run from ~/workspace/metamonsters-game with the noble-spark venv python.
"""
import asyncio, json, sys
from playwright.async_api import async_playwright

URL = 'file:///home/hatch/workspace/metamonsters-game/index.html'
PATH = sys.argv[1] if len(sys.argv) > 1 else 'wolf'
errors = []
results = []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (f' — {detail}' if detail else ''), flush=True)

DIRKEY = {'up': 'ArrowUp', 'down': 'ArrowDown', 'left': 'ArrowLeft', 'right': 'ArrowRight'}
DIRDELTA = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}

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
        """Click the first button in scope whose text starts with prefix. Returns bool."""
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
        """Flee the current wild battle via the RUN button. Returns True when back in overworld."""
        for _ in range(6):
            if await self.state() != 'battle':
                return True
            if not await self.wait_battle_menu():
                return False
            await self.click_battle_button('RUN')
            await self.p.wait_for_timeout(1500)
            if await self.state() == 'overworld':
                return True
            # flee failed: foe attacks, menu returns — retry
        return await self.state() == 'overworld'
    async def drain_dialogs(self, max_presses=15):
        """Press Enter while a dialog is open until it closes. Level-up dialogs
        open the next dialog in their onDone, so keep pressing until overworld."""
        for _ in range(max_presses):
            if await self.state() != 'dialog':
                return True
            await self.press_enter(1)
            await self.p.wait_for_timeout(600)
        return await self.state() != 'dialog'

    async def fight_battle(self):
        """Fight the current battle to its end with FIGHT + first move. Handles switches."""
        for _ in range(150):  # ~5 min cap
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
            # move menu: first button is the first move (or BACK is last)
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
                if (ex && !(nx === tx && ny === ty)) continue; // don't cross exits mid-walk
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
        """Walk one tile to (tx,ty). Returns True on arrival.
        One combined evaluate per poll (not three) — under load the CDP
        round-trips stretch the poll interval past the 194ms/tile walk time
        and the player overshoots the target between polls."""
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
            # The tile coords update when a step STARTS, but onStepTile (exits,
            # pond-cross objectives, encounters) fires when the step COMPLETES
            # (~194ms later). Wait for the step to land before returning, or
            # the caller's objective check reads stale state — this is what
            # failed the shark pond run (cross/swim read before landing).
            # The key MUST be released first: a key still held when the step
            # lands starts another step in the same direction and the player
            # overshoots the target by a tile (that broke do_base's talk_to).
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
        """BFS walk to (tx,ty) on the current map; flees wild battles on the way.
        A failed step (overshoot under load) re-paths from wherever the player
        ended up instead of giving up — the re-path is usually one tile back."""
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
                    if await self.state() == 'battle':
                        done = False
                        break
                    done = False  # overshoot or stall — re-path from here
                    break
                if await self.state() == 'battle':
                    done = False
                    break
            if done:
                return True
        return (await self.ev('G.player.x')) == tx and (await self.ev('G.player.y')) == ty
    async def goto_map(self, tx, ty):
        """Walk onto an exit tile (map change happens on arrival)."""
        ok = await self.walk_to(tx, ty)
        await self.p.wait_for_timeout(300)
        return ok
    async def face(self, d):
        await self.p.keyboard.press(DIRKEY[d])
        await self.p.wait_for_timeout(120)
    async def interact(self):
        await self.press_enter(1, 400)
    async def talk_to(self, nx, ny):
        """Stand adjacent to the NPC/object at (nx,ny), face it, press Enter."""
        px, py = await self.ev('G.player.x'), await self.ev('G.player.y')
        # pick the adjacent tile that is walkable and closest
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
    async def start_battle(self, area):
        await self.ev(f"startWildBattle('{area}')")
        await self.p.wait_for_timeout(1400)
    async def catch_current_foe(self):
        """Catch the current wild foe (test assist: foe HP set to 1 first; retries
        if it breaks free — the shake/finishCatch/mission path runs for real)."""
        for _ in range(5):
            if await self.state() != 'battle':
                return True
            await self.ev('foeMon().hp = 1')
            if not await self.wait_battle_menu():
                return await self.state() != 'battle'
            await self.click_battle_button('CATCH')
            await self.p.wait_for_timeout(400)
            await self.p.evaluate("document.querySelector('#battle-actions button').click()")  # first trap
            for _ in range(12):
                await self.p.wait_for_timeout(800)
                if await self.state() != 'battle':
                    return True
                log = await self.ev("document.getElementById('battle-log').textContent")
                if 'broke free' in log:
                    break
            await self.p.wait_for_timeout(1500)  # foe's free attack, menu returns, retry
        return await self.state() != 'battle'

async def new_game(g):
    await g.p.click('#btn-new')
    await g.p.wait_for_timeout(400)
    await g.press_enter(4, 250)
    check('intro done, overworld', await g.state() == 'overworld', await g.state())
    check('mission lastStarter', await g.mission() == 'lastStarter', await g.mission())

async def pick_starter(g, fam):
    """Talk to Marcus, pick the starter. fam = 'bear' | 'wolf' | 'shark'."""
    await g.talk_to(11, 8)  # Marcus
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 300)  # Marcus's 2 lines -> choice panel
    await g.p.wait_for_timeout(400)
    label = {'bear': '🐻 Bear Cub', 'wolf': '🐺 Wolf Cub', 'shark': '🦈 Baby Shark'}[fam]
    ok = await g.click_panel_button(label)
    check(f'choice panel: picked {fam}', ok)
    await g.p.wait_for_timeout(400)
    await g.press_enter(1, 400)  # confirm dialog
    party = await g.ev('G.party.map(c=>c.name).join(",")')
    check('starter in party', fam.capitalize() in party or ('Wolf' in party if fam == 'wolf' else 'Bear' in party if fam == 'bear' else 'Shark' in party), party)
    check('starter flags set', await g.ev("G.flags.starter === '" + fam + "'"), await g.ev('JSON.stringify({s:G.flags.starter,m:G.flags.marcusStarter,f:G.flags.sofiaStarter})'))
    check('mission firstWood', await g.mission() == 'firstWood', await g.mission())

async def do_wood_and_catch(g):
    # chop 1 real tree (west border), then set wood to 10 and chop a 2nd to complete.
    # Pass-3 fix: the (0,9) tree is gone — pass 2 made (0,9) the Rok City exit,
    # so facing left from (1,9) steps onto the exit and leaves Haven. Chop the
    # (0,8) and (0,7) border trees instead (both still standing).
    await g.walk_to(1, 8)
    await g.face('left')
    await g.interact()
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 300)
    check('wood +1 after chop', (await g.ev('G.bag.wood || 0')) >= 1, str(await g.ev('G.bag.wood || 0')))
    await g.ev('G.bag.wood = 10')
    await g.walk_to(1, 7)
    await g.face('left')
    await g.interact()
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 300)
    check('mission firstCatch', await g.mission() == 'firstCatch', await g.mission())
    # wild battle + catch on the meadow
    await g.goto_map(23, 9)  # haven east exit -> meadow
    await g.ev('healParty()')
    await g.start_battle('meadow')
    check('wild battle started', await g.state() == 'battle')
    caught = await g.catch_current_foe()
    check('catch completed', caught)
    await g.p.wait_for_timeout(500)
    check('mission firstBase', await g.mission() == 'firstBase', await g.mission())
    check('party grew', (await g.ev('G.party.length')) >= 2, str(await g.ev('G.party.length')))

async def do_base(g):
    await g.goto_map(0, 9)  # meadow west exit -> haven
    await g.talk_to(18, 6)  # home plot -> base menu
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('🏕️ Build Base')
    check('base menu: Build Base clicked', ok)
    await g.p.wait_for_timeout(400)
    check('base built', await g.ev('G.flags.baseLevel === 1'))
    check('mission starterPath', await g.mission() == 'starterPath', await g.mission())
    await g.click_panel_button('← Back')
    await g.p.wait_for_timeout(300)

async def talk_marcus_path(g):
    await g.talk_to(11, 8)  # Marcus
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 300)  # path dialog (2 lines) -> completes 'path'
    return await g.mission()

async def win_cup(g, arena_map, door, cup_name, level_xp):
    """Enter the arena at (door) on arena_map's overworld, talk to the Arena Master,
    win 3 rounds. level_xp = XP to give the party first (simulated training).
    Flow: Arena Master dialog (2 lines) -> Round 1 dialog (1 line) -> battle ->
    afterWin dialog (1 line, or 3 lines for the champion) -> next battle..."""
    # test assist: level the party AND evolve it (gainXp only reports the
    # evolution — real gameplay applies it in awardXp after a battle, but the
    # cup starts immediately, so apply it here or a stage-1 cub faces L18 foes)
    await g.ev(f'''G.party.forEach(c => {{
      let r = gainXp(c, {level_xp});
      while (r.evolved) {{ evolveCreature(c, r.evolved); const d = DEX[c.dex]; r = {{ evolved: (d.evo && d.evo.level && c.level >= d.evo.level) ? d.evo.into : null }}; }}
    }})''')
    await g.ev('healParty()')
    await g.talk_to(*door)  # arena door -> interior
    await g.p.wait_for_timeout(400)
    check(f'{cup_name}: in arena', await g.ev('G.player.map') == arena_map, await g.ev('G.player.map'))
    await g.talk_to(8, 5)  # Arena Master
    await g.p.wait_for_timeout(300)
    await g.press_enter(2, 300)  # Arena Master dialog (2 lines) -> Round 1 dialog
    for rnd in range(3):
        # the round dialog (1 line) is open — press through it until the battle starts
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
        # post-battle: awardXp runs in the battle log (state 'overworld'), then
        # afterWin opens the next-round dialog (1 line) or the champion dialog
        # (3 lines) — wait for it, then press through it.
        await g.wait_dialog(12000)
        await g.drain_dialogs()
    return True

async def run_wolf(g):
    await new_game(g)
    await pick_starter(g, 'wolf')
    await do_wood_and_catch(g)
    await do_base(g)
    m = await talk_marcus_path(g)
    check('mission starterPathWolf', m == 'starterPathWolf', m)
    # woods: scent objective completes on entry; lost pup completes 'find'
    await g.goto_map(23, 9)  # haven east exit -> meadow
    await g.goto_map(15, 0)  # meadow north exit -> woods
    check('in woods', (await g.pos())[2] == 'woods')
    check('scent objective done', await g.ev("objectiveDone('starterPathWolf','scent')"))
    await g.talk_to(18, 6)  # Lost Pup
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission firstTournament', await g.mission() == 'firstTournament', await g.mission())
    # Rookie Cup: woods -> meadow -> oasis -> arena
    await g.goto_map(13, 17)  # woods south exit -> meadow
    await g.goto_map(29, 9)  # meadow east exit -> oasis
    await win_cup(g, 'arena', (19, 6), 'Rookie Cup', 1500)
    check('Rookie Cup champion', await g.ev('G.flags.champion === true'))
    check('HM SLICE unlocked', await g.ev('G.flags.unlock_HM_SLICE === true'))
    check('mission foreclosure', await g.mission() == 'foreclosure', await g.mission())
    # Phase 2: foreclosure (shop owner + elder, both in haven)
    await g.goto_map(8, 10)  # arena exit -> oasis
    await g.goto_map(0, 9)  # oasis west exit -> meadow
    await g.goto_map(0, 9)  # meadow west exit -> haven
    await g.talk_to(7, 6)  # Shop Owner
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('foreclosure talk done', await g.ev("objectiveDone('foreclosure','talk')"))
    await g.talk_to(5, 12)  # Elder Mara
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission lawsuitTV', await g.mission() == 'lawsuitTV', await g.mission())
    # lawsuitTV: Care Hub TV
    await g.talk_to(11, 6)  # hub door (exit tile in front of the hub)
    await g.p.wait_for_timeout(400)
    check('in hub', (await g.pos())[2] == 'hub')
    await g.talk_to(6, 1)  # TV
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission peopleTalking', await g.mission() == 'peopleTalking', await g.mission())
    # peopleTalking: Rin (hub shopkeeper) -> Elder + Caleb (haven) -> Ranger (woods) -> Finn (oasis)
    await g.talk_to(9, 1)  # Shopkeeper Rin (opens shop after the rumor line)
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)  # rumor dialog -> shop opens
    await g.p.wait_for_timeout(400)
    check('peopleTalking rin done', await g.ev("objectiveDone('peopleTalking','rin')"))
    await g.click_panel_button('Leave Shop')
    await g.p.wait_for_timeout(300)
    await g.goto_map(7, 8)  # hub exit -> haven
    await g.talk_to(5, 12)  # Elder Mara
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('peopleTalking elder done', await g.ev("objectiveDone('peopleTalking','elder')"))
    await g.talk_to(18, 12)  # Caleb
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('peopleTalking caleb done', await g.ev("objectiveDone('peopleTalking','caleb')"))
    await g.goto_map(23, 9)  # haven east -> meadow
    await g.goto_map(15, 0)  # meadow north -> woods
    await g.talk_to(13, 9)  # Ranger Dee
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('peopleTalking ranger done', await g.ev("objectiveDone('peopleTalking','ranger')"))
    await g.goto_map(13, 17)  # woods south -> meadow
    await g.goto_map(29, 9)  # meadow east -> oasis
    await g.talk_to(9, 9)  # Old Finn
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission smallShops', await g.mission() == 'smallShops', await g.mission())
    # smallShops: Pippa in haven (buy from her stall, then help her open)
    await g.goto_map(0, 9)  # oasis west -> meadow
    await g.goto_map(0, 9)  # meadow west -> haven
    await g.talk_to(12, 10)  # Pippa
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)  # her pitch -> stall opens
    await g.p.wait_for_timeout(400)
    check('smallShops buy done', await g.ev("objectiveDone('smallShops','buy')"))
    ok = await g.click_panel_button('Buy')  # buy the first item (a net)
    check('bought from Pippa', ok)
    await g.p.wait_for_timeout(300)
    await g.click_panel_button('Leave Shop')
    await g.p.wait_for_timeout(300)
    await g.talk_to(12, 10)  # Pippa again
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission sickAnimals', await g.mission() == 'sickAnimals', await g.mission())
    # sickAnimals: the sick frog on the meadow's east edge
    await g.goto_map(23, 9)  # haven east -> meadow
    await g.talk_to(27, 8)  # sick animal
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('sickAnimals find done', await g.ev("objectiveDone('sickAnimals','find')"))
    await g.talk_to(27, 8)  # heal it (bandage in bag)
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission quietFriendLeaves', await g.mission() == 'quietFriendLeaves', await g.mission())
    # quietFriendLeaves: Caleb in haven
    await g.goto_map(0, 9)  # meadow west -> haven
    await g.talk_to(18, 12)  # Caleb
    await g.p.wait_for_timeout(300)
    await g.press_enter(3, 300)  # goodbye dialog (3 lines)
    check('mission secondTournament', await g.mission() == 'secondTournament', await g.mission())
    # Forest Clash: haven -> meadow -> woods -> forestArena
    await g.goto_map(23, 9)
    await g.goto_map(15, 0)
    await win_cup(g, 'forestArena', (21, 6), 'Forest Clash', 20000)
    check('Forest Clash champion', await g.ev('G.flags.forestClashChampion === true'))
    check('TM Bite in bag', (await g.ev('G.bag.tmBite || 0')) >= 1, str(await g.ev('G.bag.tmBite || 0')))
    check('mission thirdTournament', await g.mission() == 'thirdTournament', await g.mission())
    # Reef Rumble: forestArena -> woods -> meadow -> oasis -> reef -> reefArena
    await g.goto_map(8, 10)  # forestArena exit -> woods
    await g.goto_map(13, 17)  # woods south -> meadow
    await g.goto_map(29, 9)  # meadow east -> oasis
    await g.goto_map(13, 17)  # oasis south -> reef
    check('in reef', (await g.pos())[2] == 'reef')
    await win_cup(g, 'reefArena', (5, 6), 'Reef Rumble', 120000)
    check('Reef Rumble champion', await g.ev('G.flags.reefRumbleChampion === true'))
    check('TM Water Jet in bag', (await g.ev('G.bag.tmWaterJet || 0')) >= 1, str(await g.ev('G.bag.tmWaterJet || 0')))
    check('HM SWIM unlocked', await g.ev('G.flags.unlock_HM_SWIM === true'))
    check('mission labLog', await g.mission() == 'labLog', await g.mission())
    # labLog: reef -> oasis -> ember (lab log object)
    await g.goto_map(8, 10)  # reefArena exit -> reef
    await g.goto_map(13, 0)  # reef north -> oasis
    await g.goto_map(25, 9)  # oasis east -> ember
    check('labLog search done', await g.ev("objectiveDone('labLog','search')"))
    await g.talk_to(13, 4)  # lab log
    await g.p.wait_for_timeout(300)
    await g.press_enter(1, 400)
    check('mission coldNorth', await g.mission() == 'coldNorth', await g.mission())
    # coldNorth: ember -> oasis -> meadow -> woods -> howling -> grizzly -> frozen
    await g.goto_map(0, 9)  # ember west -> oasis
    await g.goto_map(0, 9)  # oasis west -> meadow
    await g.goto_map(15, 0)  # meadow north -> woods
    await g.goto_map(13, 0)  # woods north -> howling
    check('coldNorth peaks done', await g.ev("objectiveDone('coldNorth','peaks')"))
    await g.goto_map(25, 9)  # howling east -> grizzly
    check('coldNorth den done', await g.ev("objectiveDone('coldNorth','den')"))
    await g.goto_map(25, 9)  # grizzly east -> frozen
    check('mission coast', await g.mission() == 'coast', await g.mission())
    # coast: frozen -> iceLake -> coldSpring -> woods -> meadow -> mangrove -> reef -> tidepools -> butterfly
    await g.goto_map(13, 17)  # frozen south -> iceLake
    await g.goto_map(0, 9)  # iceLake west -> coldSpring
    await g.goto_map(13, 17)  # coldSpring south -> woods
    await g.goto_map(13, 17)  # woods south -> meadow
    await g.goto_map(15, 19)  # meadow south -> mangrove
    await g.goto_map(25, 9)  # mangrove east -> reef
    check('coast reef done', await g.ev("objectiveDone('coast','reef')"))
    await g.goto_map(25, 9)  # reef east -> tidepools
    check('coast tide done', await g.ev("objectiveDone('coast','tide')"))
    await g.goto_map(25, 9)  # tidepools east -> butterfly
    # Pass-3 fix: the pass-2 chain extends past coast — coast.next is rokCity,
    # so an active mission remains (the old "no active mission" expectation is
    # from pass 1, before the chain was extended). The HUD shows that mission.
    check('coast done, mission rokCity', await g.mission() == 'rokCity', str(await g.mission()))
    check('HUD shows active mission', 'Rok City' in (await g.ev("document.getElementById('hud-mission').textContent")))
    # bicycle + garage: back to haven home plot
    await g.goto_map(0, 9)  # butterfly west -> tidepools
    await g.goto_map(0, 9)  # tidepools west -> reef
    await g.goto_map(13, 0)  # reef north -> oasis
    await g.goto_map(0, 9)  # oasis west -> meadow
    await g.goto_map(0, 9)  # meadow west -> haven
    await g.talk_to(18, 6)  # home plot -> base menu
    await g.p.wait_for_timeout(400)
    ok = await g.click_panel_button('🚲 Buy Bicycle')
    check('bicycle bought', ok and await g.ev('G.flags.hasBicycle === true'))
    await g.p.wait_for_timeout(300)
    ok = await g.click_panel_button('🚲 Ride the bicycle')
    check('riding bike', ok and await g.ev('G.flags.ridingBike === true'))
    await g.p.wait_for_timeout(300)
    await g.click_panel_button('← Back')
    await g.p.wait_for_timeout(300)
    # bike speed check: one tile step should be ~2x faster than walking (just verify it moves)
    before = await g.pos()
    await g.walk_to(before[0] + 1, before[1])
    check('bike moves', (await g.pos())[0] == before[0] + 1)
    await g.ev('G.flags.ridingBike = false')
    # TM teach: use TM Bite from the bag on a party member that does NOT already
    # know Bite — the wolf learns Bite naturally at Lv 5, so teaching it to the
    # wolf is correctly refused and the TM is (correctly) not consumed.
    await g.p.keyboard.press('m')
    await g.p.wait_for_timeout(400)
    await g.click_panel_button('🎒 Bag')
    await g.p.wait_for_timeout(400)
    # click the Use button on the TM01 Bite row
    used = await g.p.evaluate("""() => {
      const rows = [...document.querySelectorAll('#menu .panel .row')];
      const row = rows.find(r => r.textContent.includes('TM01 Bite'));
      if (!row) return false;
      row.querySelector('button').click(); return true;
    }""")
    check('TM Bite Use clicked', used)
    await g.p.wait_for_timeout(400)
    # party picker: click the first creature that doesn't know Bite yet
    target = await g.ev("G.party.findIndex(c => !c.moves.includes('bite'))")
    picked = await g.p.evaluate(f"""() => {{
      const b = document.querySelectorAll('#menu .panel button')[{target}];
      if (b) {{ b.click(); return true; }} return false;
    }}""")
    check('TM teach: creature picked', picked)
    await g.p.wait_for_timeout(400)
    # forget panel (if 4 moves) — click the first forgettable move, else the learn dialog
    state = await g.state()
    if state == 'menu':
        await g.p.evaluate("() => { const b = document.querySelector('#menu .panel button'); if (b) b.click(); }")
        await g.p.wait_for_timeout(400)
    await g.press_enter(1, 400)
    check('creature knows Bite', await g.ev(f"G.party[{target}].moves.includes('bite')"))
    check('TM Bite consumed', (await g.ev('G.bag.tmBite || 0')) == 0, str(await g.ev('G.bag.tmBite || 0')))

async def run_bear(g):
    await new_game(g)
    await pick_starter(g, 'bear')
    await do_wood_and_catch(g)
    await do_base(g)
    m = await talk_marcus_path(g)
    check('mission starterPathBear', m == 'starterPathBear', m)
    # Grizzly Den: meadow -> woods -> howling -> grizzly (track completes on entry)
    await g.goto_map(23, 9)  # haven east exit -> meadow
    await g.goto_map(15, 0)  # meadow north exit -> woods
    await g.goto_map(13, 0)
    await g.goto_map(25, 9)
    check('in grizzly den', (await g.pos())[2] == 'grizzly')
    check('bear track done', await g.ev("objectiveDone('starterPathBear','track')"))
    # hunt: catch one creature in the den
    await g.ev('healParty()')
    await g.start_battle('grizzly')
    check('grizzly wild battle started', await g.state() == 'battle')
    caught = await g.catch_current_foe()
    check('bear hunt catch completed', caught)
    check('mission firstTournament', await g.mission() == 'firstTournament', await g.mission())

async def run_shark(g):
    await new_game(g)
    await pick_starter(g, 'shark')
    await do_wood_and_catch(g)
    await do_base(g)
    m = await talk_marcus_path(g)
    check('mission starterPathShark', m == 'starterPathShark', m)
    # Cross the Water: meadow pond (20-23, 12-14) then the far bank (x>=24, y 12-14)
    await g.goto_map(23, 9)  # haven east -> meadow
    await g.walk_to(19, 12)
    ok = await g.walk_to(20, 12)  # step onto the pond with a Fish starter
    check('shark crosses pond', ok)
    check('shark cross done', await g.ev("objectiveDone('starterPathShark','cross')"))
    ok = await g.walk_to(24, 12)  # far bank
    check('shark reaches far bank', ok)
    check('shark swim done', await g.ev("objectiveDone('starterPathShark','swim')"))
    check('mission firstTournament', await g.mission() == 'firstTournament', await g.mission())

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
        g = Game(page)
        if PATH == 'bear':
            await run_bear(g)
        elif PATH == 'shark':
            await run_shark(g)
        else:
            await run_wolf(g)
        print('ERRORS:', json.dumps(errors) if errors else 'none', flush=True)
        failed = [r for r in results if not r[1]]
        print(f'STEPS: {len(results) - len(failed)}/{len(results)} passed; ERRORS: {len(errors)}', flush=True)
        await b.close()
        if failed or errors:
            sys.exit(1)

if __name__ == '__main__':
    asyncio.run(main())
