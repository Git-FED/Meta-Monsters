import asyncio, json
from playwright.async_api import async_playwright
async def main():
    errors = []
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True, args=['--no-sandbox'])
        page = await b.new_page(viewport={'width': 960, 'height': 640})
        page.on('console', lambda m: errors.append(f'{m.type}: {m.text}') if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(f'PAGEERROR: {e}'))
        page.on('requestfailed', lambda r: errors.append(f'REQFAIL: {r.url}'))
        await page.goto('file:///home/hatch/workspace/metamonsters-game/index.html')
        await page.wait_for_timeout(2000)
        print('title visible:', await page.evaluate("!document.getElementById('title-screen').classList.contains('hidden')"))
        print('continue disabled:', await page.evaluate("document.getElementById('btn-continue').disabled"))
        await page.click('#btn-new'); await page.wait_for_timeout(400)
        for i in range(4):
            await page.keyboard.press('Enter'); await page.wait_for_timeout(250)
        print('state:', await page.evaluate('G.state'), '| mission:', await page.evaluate('activeMission().id'), '| map:', await page.evaluate('G.player.map'), '| pos:', await page.evaluate('G.player.x + "," + G.player.y'))
        print('party:', await page.evaluate('G.party.map(c=>c.name+" L"+c.level).join(", ")'))
        print('hasAxe:', await page.evaluate('G.hasAxe'), '| bag axe:', await page.evaluate('G.bag.axe || 0'))
        # walk a tile with a real held key
        await page.keyboard.down('ArrowRight'); await page.wait_for_timeout(450); await page.keyboard.up('ArrowRight')
        await page.wait_for_timeout(300)
        print('after walk pos:', await page.evaluate('G.player.x + "," + G.player.y'))
        print('ERRORS:', json.dumps(errors) if errors else 'none')
        await b.close()
asyncio.run(main())
