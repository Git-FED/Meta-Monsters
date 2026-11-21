"""Probe the shark pond-cross failure from the shark run.
Loads a fresh game, picks the shark starter, sets starterPathShark active,
teleports the player to meadow (19,12) (just west of the pond at 20-23, 12-14),
then steps east once with a real keypress and dumps the state after the step
completes. Runs N times (fresh loads) because the scattered trees are random."""
import asyncio, sys, importlib.util
spec = importlib.util.spec_from_file_location('smoke_pass1', 'tools/smoke-pass1.py')
_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(_mod)
Game, URL = _mod.Game, _mod.URL

async def main():
    from playwright.async_api import async_playwright
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for run_no in range(1, n + 1):
            page = await browser.new_page(viewport={'width': 1280, 'height': 800})
            page.on('pageerror', lambda e: print(f'  [run {run_no}] PAGEERROR {e}', flush=True))
            g = Game(page)
            await page.goto(URL)
            await page.wait_for_timeout(1500)
            await page.click('#btn-new')
            await page.wait_for_timeout(400)
            await g.press_enter(4)  # intro
            await page.wait_for_timeout(500)
            await _mod.pick_starter(g, 'shark')
            await page.wait_for_timeout(300)
            # jump straight to the starter-path mission, active
            await g.ev("setMission('starterPath','done')")
            await g.ev("setMission('starterPathShark','active')")
            await g.ev("G.player.map='meadow'; G.map=MAPS.meadow; G.player.x=19; G.player.y=12; G.player.px=19*TILE; G.player.py=12*TILE; G.player.dir='right'")
            info = await g.ev("""JSON.stringify({
                tile2012: tileAt(MAPS.meadow,20,12),
                tile1912: tileAt(MAPS.meadow,19,12),
                tile2412: tileAt(MAPS.meadow,24,12),
                walk2012: walkable(MAPS.meadow,20,12),
                mission: missionStatus('starterPathShark'),
                hasFish: G.party.some(c => DEX[c.dex].category === 'Fish'),
                mapName: MAPS.meadow.name
            })""")
            print(f'[run {run_no}] before: {info}', flush=True)
            # one real step east onto the pond
            await page.keyboard.down('ArrowRight')
            await page.wait_for_timeout(600)
            await page.keyboard.up('ArrowRight')
            await page.wait_for_timeout(600)
            after = await g.ev("""JSON.stringify({
                pos: [G.player.x, G.player.y, G.player.map],
                state: G.state,
                moving: OW.moving,
                crossedPond: OW.crossedPond,
                cross: objectiveDone('starterPathShark','cross'),
                mission: missionStatus('starterPathShark')
            })""")
            print(f'[run {run_no}] after step east: {after}', flush=True)
            # now walk east to the far bank (24,12) via the test walker
            ok = await g.walk_to(24, 12)
            after2 = await g.ev("""JSON.stringify({
                pos: [G.player.x, G.player.y, G.player.map],
                crossedPond: OW.crossedPond,
                cross: objectiveDone('starterPathShark','cross'),
                swim: objectiveDone('starterPathShark','swim'),
                mission: missionStatus('starterPathShark')
            })""")
            print(f'[run {run_no}] walk_to(24,12) -> {ok}: {after2}', flush=True)
            await page.close()
        await browser.close()

asyncio.run(main())
