"""Probe the Caleb talk_to(18,12) failure from the wolf run.
Loads a fresh game, sets peopleTalking active (rin+elder done), teleports the
player to (5,11) in haven (the spot after the elder talk), then runs the exact
talk_to(18,12) from smoke-pass1.py with logging. Runs N times (fresh loads)
because the scattered trees are random per load."""
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
            # set up the peopleTalking stage exactly as the wolf run had it
            await g.ev("setMission('peopleTalking','active')")
            await g.ev("G.missions.peopleTalking.objectives.rin = true")
            await g.ev("G.missions.peopleTalking.objectives.elder = true")
            await g.ev("G.player.map='haven'; G.map=MAPS.haven; G.player.x=5; G.player.y=11; G.player.px=5*TILE; G.player.py=11*TILE; G.player.dir='down'")
            # what is around Caleb?
            info = await g.ev("""JSON.stringify({
                cands: [[18,13],[18,11],[17,12],[19,12]].map(([x,y]) => [x,y,walkable(MAPS.haven,x,y), (MAPS.haven.objects.find(o => o.x===x && o.y===y)||{}).type || null]),
                trees: MAPS.haven.objects.filter(o=>o.type==='tree').map(o=>[o.x,o.y]),
                npcs: MAPS.haven.npcs.map(n=>[n.id,n.x,n.y])
            })""")
            print(f'[run {run_no}] around caleb: {info}', flush=True)
            path = await g.bfs_path(18, 11)
            print(f'[run {run_no}] bfs to (18,11): {path}', flush=True)
            ok = await g.talk_to(18, 12)
            pos = await g.pos()
            st = await g.state()
            obj = await g.ev("objectiveDone('peopleTalking','caleb')")
            print(f'[run {run_no}] talk_to -> {ok}, pos={pos}, state={st}, caleb objective={obj}', flush=True)
            await page.close()
        await browser.close()

asyncio.run(main())
