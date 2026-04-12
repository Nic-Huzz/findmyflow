"""
Export carousel slides as individual 1080x1350 PNGs for Instagram upload.

Uses Playwright to render each slide from the HTML preview at 420x525 viewport
and scale up via device_scale_factor (1080/420 = 2.571x).

Run from project root:
    python3 scripts/export-carousel-pngs.py

Output: public/images/carousel/export/slide_1.png through slide_7.png
"""
import asyncio
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INPUT_HTML = ROOT / "public" / "images" / "carousel" / "carousel-v2.html"
OUTPUT_DIR = ROOT / "public" / "images" / "carousel" / "export"

TOTAL_SLIDES = 7

VIEW_W = 420
VIEW_H = 525
SCALE = 1080 / 420


async def export_slides():
    from playwright.async_api import async_playwright

    OUTPUT_DIR.mkdir(exist_ok=True)

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={"width": VIEW_W, "height": VIEW_H},
            device_scale_factor=SCALE,
        )

        html_content = INPUT_HTML.read_text(encoding="utf-8")
        await page.set_content(html_content, wait_until="networkidle")
        await page.wait_for_timeout(3000)  # wait for Google Fonts

        # Hide IG chrome, lock viewport
        await page.evaluate("""() => {
            document.querySelectorAll('.ig-header,.ig-dots,.ig-actions,.ig-caption')
                .forEach(el => el.style.display='none');
            const frame = document.querySelector('.ig-frame');
            frame.style.cssText = 'width:420px;height:525px;max-width:none;border-radius:0;box-shadow:none;overflow:hidden;margin:0;border:none;';
            const viewport = document.querySelector('.carousel-viewport');
            viewport.style.cssText = 'width:420px;height:525px;aspect-ratio:unset;overflow:hidden;cursor:default;';
            document.body.style.cssText = 'padding:0;margin:0;display:block;overflow:hidden;';
        }""")
        await page.wait_for_timeout(500)

        for i in range(TOTAL_SLIDES):
            await page.evaluate("""(idx) => {
                const track = document.querySelector('.carousel-track');
                track.style.transition = 'none';
                track.style.transform = 'translateX(' + (-idx * 420) + 'px)';
            }""", i)
            await page.wait_for_timeout(400)

            out_path = OUTPUT_DIR / f"slide_{i + 1}.png"
            await page.screenshot(
                path=str(out_path),
                clip={"x": 0, "y": 0, "width": VIEW_W, "height": VIEW_H},
            )
            size = out_path.stat().st_size
            print(f"  slide_{i + 1}.png  ({size:,} bytes)")

        await browser.close()
        print(f"\nDone. {TOTAL_SLIDES} slides exported to {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(export_slides())
