"""Metamonsters — screenshot run. Usage: python3 tools/shots.py
Takes 6 screenshots (title, starter choice, Haven overworld, wild battle,
Rok City, Coral Reef) into ~/workspace/your_files/metamonsters-shots/.
Run from ~/workspace/metamonsters-game with the noble-spark venv python.
URL points at the snapshot copy in ~/.mm-shots (frozen build, not the live
folder pass 3 is editing)."""
import asyncio, importlib.util, json, os, sys
from playwright.async_api import async_playwright
_TOOLS = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location("smoke_pass2", os.path.join(_TOOLS, "smoke-pass2.py"))
_smoke = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_smoke)
Game, new_game, pick_starter = _smoke.Game, _smoke.new_game, _smoke.pick_starter

URL = 'file:///home/hatch/workspace/.mm-shots/metamonsters-game/index.html'
OUT = '/home/hatch/workspace/your_files/metamonsters-shots'
errors = []

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await b.new_page(viewport={'width': 960, 'height': 640})
        page.on('console', lambda m: errors.append(f'{m.type}: {m.text}') if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(f'PAGEERROR: {e}'))
        page.on('requestfailed', lambda r: errors.append(f'REQFAIL: {r.url}'))
        await page.goto(URL)
        await page.wait_for_timeout(2000)
        await page.screenshot(path=f'{OUT}/01-title.png')
        print('01 title shot', flush=True)
        g = Game(page)
        await new_game(g)
        await page.wait_for_timeout(500)
        await page.screenshot(path=f'{OUT}/02-haven.png')
        print('02 haven shot', flush=True)
        # starter choice panel
        await g.talk_to(11, 8)
        await page.wait_for_timeout(300)
        await g.press_enter(2, 300)
        await page.wait_for_timeout(500)
        await page.screenshot(path=f'{OUT}/03-starter-choice.png')
        print('03 starter choice shot', flush=True)
        ok = await g.click_panel_button('\U0001f43a Wolf Cub')
        print('picked wolf:', ok, flush=True)
        await page.wait_for_timeout(400)
        await g.press_enter(1, 400)
        await page.wait_for_timeout(500)
        print('party:', await g.ev('G.party.map(c=>c.name).join(",")'), flush=True)
        # wild battle in the meadow
        await g.start_battle('meadow')
        await g.wait_battle_menu()
        await page.wait_for_timeout(800)
        await page.screenshot(path=f'{OUT}/04-battle.png')
        print('04 battle shot, state:', await g.state(), flush=True)
        await g.flee_battle()
        # Rok City
        if await g.teleport('rokCity', 14, 9):
            await page.wait_for_timeout(600)
            await page.screenshot(path=f'{OUT}/05-rokcity.png')
            print('05 rok city shot', flush=True)
        else:
            print('05 rok city teleport FAILED', flush=True)
        # Coral Reef
        if await g.teleport('reef', 13, 9):
            await page.wait_for_timeout(600)
            await page.screenshot(path=f'{OUT}/06-reef.png')
            print('06 reef shot', flush=True)
        else:
            print('06 reef teleport FAILED', flush=True)
        print('ERRORS:', json.dumps(errors) if errors else 'none', flush=True)
        await b.close()

asyncio.run(main())
