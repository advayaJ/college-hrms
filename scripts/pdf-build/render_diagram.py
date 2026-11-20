#!/usr/bin/env python3
"""Render diagram.html -> diagram.png at 2x device scale (print quality)."""
from playwright.sync_api import sync_playwright
import pathlib

BASE = pathlib.Path('/home/z/my-project/scripts/pdf-build')

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={'width': 960, 'height': 1200}, device_scale_factor=2)
    page.goto(f'file://{BASE / "diagram.html"}')
    page.wait_for_timeout(400)
    el = page.locator('.canvas')
    el.screenshot(path=str(BASE / 'diagram.png'))
    browser.close()

from PIL import Image
im = Image.open(BASE / 'diagram.png')
print('diagram.png', im.size, '| aspect', round(im.size[0] / im.size[1], 3))
