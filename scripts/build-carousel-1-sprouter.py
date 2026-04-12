"""
Build Carousel 1: Sprouter Sweet Spot.

Generates a self-contained HTML file that:
- Wraps the 6 Pixar background JPGs as base64-embedded slide backgrounds
- Adds dark gradient overlays for text contrast
- Lays out copy from HANDOFF.md using Fraunces (display) + Outfit (body)
- Embeds the SVG diagram inline on slide 2
- Follows the ClawdBot system layout: 420x525 viewport, progress bar + swipe arrow,
  IG frame wrapper for in-browser preview

Run from project root:
    python3 scripts/build-carousel-1-sprouter.py

Output: public/images/carousel/carousel-v2.html
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAROUSEL_DIR = ROOT / "public" / "images" / "carousel"
OUTPUT_HTML = CAROUSEL_DIR / "carousel-v2.html"

# Brand
PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
GOLD_SOFT = "rgba(233,162,59,0.85)"

TOTAL_SLIDES = 7  # Hook, Pattern, Unfulfilment, Crisis, Dreams, Diagonal, CTA


def img_data_uri(filename: str) -> str:
    path = CAROUSEL_DIR / filename
    data = path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return f"data:image/jpeg;base64,{b64}"


def progress_bar(idx: int, total: int) -> str:
    pct = ((idx + 1) / total) * 100
    return (
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;'
        'z-index:10;display:flex;align-items:center;gap:10px;">'
        '<div style="flex:1;height:3px;background:rgba(255,255,255,0.18);border-radius:2px;overflow:hidden;">'
        f'<div style="height:100%;width:{pct:.2f}%;background:#fff;border-radius:2px;"></div>'
        "</div>"
        f'<span style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:500;">{idx + 1}/{total}</span>'
        "</div>"
    )


def swipe_arrow() -> str:
    return (
        '<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;'
        "display:flex;align-items:center;justify-content:center;"
        'background:linear-gradient(to right,transparent,rgba(255,255,255,0.10));">'
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">'
        '<path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.55)" '
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
        "</svg></div>"
    )


def slide_shell(idx: int, image_filename: str, content_html: str,
                bg_position: str = "center", show_arrow: bool = True,
                overlay_strength: str = "default") -> str:
    """Wraps slide content with photo background, dark overlay, progress bar, swipe arrow."""
    img = img_data_uri(image_filename)

    if overlay_strength == "heavy":
        # Slide 2 (diagram) needs full-coverage darkening
        overlay = (
            "background:linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.55) 100%);"
        )
    else:
        # Default: dark gradient anchored at the bottom for text contrast
        overlay = (
            "background:linear-gradient(180deg,"
            "rgba(0,0,0,0.05) 0%,"
            "rgba(0,0,0,0.15) 35%,"
            "rgba(0,0,0,0.55) 65%,"
            "rgba(0,0,0,0.85) 100%);"
        )

    arrow_html = swipe_arrow() if show_arrow else ""

    return f"""
<div class="slide" style="
    position:relative;
    width:420px;height:525px;
    flex-shrink:0;
    background-image:url('{img}');
    background-size:cover;
    background-position:{bg_position};
    overflow:hidden;
">
  <div style="position:absolute;inset:0;{overlay}"></div>
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 60px;color:#fff;">
    {content_html}
  </div>
  {arrow_html}
  {progress_bar(idx, TOTAL_SLIDES)}
</div>
"""


# ---------------- Slide content ---------------- #

def slide_1_hook() -> str:
    content = f"""
    <div style="margin-bottom:14px;">
      <span class="sans" style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Find My Flow</span>
    </div>
    <h1 class="serif" style="font-size:38px;font-weight:600;line-height:1.05;letter-spacing:-0.8px;margin:0 0 6px;">
      Does work feel
      <span style="color:{GOLD};">heavy</span>
      <br/>instead of
      <span style="color:{GOLD};">fun?</span>
    </h1>
    """
    return slide_shell(0, "slide-1-hook.jpg", content, bg_position="center")


def slide_2_pattern() -> str:
    # Diagram is its own SVG laid over the photo, with a heavier dark overlay.
    diagram_svg = f'''
    <svg viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid meet" style="position:absolute;inset:0;width:100%;height:100%;">
      <defs>
        <marker id="arrowW2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="white"/>
        </marker>
        <marker id="arrowG2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="{GOLD}"/>
        </marker>
      </defs>
      <text x="540" y="120" text-anchor="middle" fill="white" font-family="Fraunces,Georgia,serif" font-size="50" font-weight="600">I've observed a pattern on the</text>
      <text x="540" y="180" text-anchor="middle" fill="white" font-family="Fraunces,Georgia,serif" font-size="50" font-weight="600">path to finding fulfilment</text>

      <line x1="140" y1="900" x2="140" y2="240" stroke="rgba(255,255,255,0.55)" stroke-width="4"/>
      <line x1="140" y1="900" x2="960" y2="900" stroke="rgba(255,255,255,0.55)" stroke-width="4"/>
      <polygon points="140,240 132,260 148,260" fill="rgba(255,255,255,0.55)"/>
      <polygon points="960,900 940,892 940,908" fill="rgba(255,255,255,0.55)"/>

      <text x="60" y="570" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Outfit,Inter,sans-serif" font-size="26" font-weight="700" letter-spacing="2" transform="rotate(-90,60,570)">ACTION</text>
      <text x="550" y="980" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="Outfit,Inter,sans-serif" font-size="26" font-weight="700" letter-spacing="2">SELF-KNOWLEDGE</text>

      <line x1="190" y1="850" x2="910" y2="270" stroke="{GOLD}" stroke-width="4" opacity="0.22"/>

      <path d="M 200,830 Q 220,540 330,340" stroke="white" stroke-width="5" fill="none" marker-end="url(#arrowW2)"/>
      <text x="360" y="290" fill="white" font-family="Outfit,Inter,sans-serif" font-size="34" font-weight="800">UNFULFILMENT</text>
      <text x="360" y="325" fill="rgba(255,255,255,0.6)" font-family="Outfit,Inter,sans-serif" font-size="22" font-weight="500">Busy but empty</text>

      <path d="M 420,360 Q 580,540 710,720" stroke="white" stroke-width="5" fill="none" marker-end="url(#arrowW2)"/>
      <text x="620" y="770" fill="white" font-family="Outfit,Inter,sans-serif" font-size="32" font-weight="800">HEAD FULL OF DREAMS</text>
      <text x="620" y="805" fill="rgba(255,255,255,0.6)" font-family="Outfit,Inter,sans-serif" font-size="22" font-weight="500">Aware but stuck</text>

      <line x1="760" y1="730" x2="760" y2="470" stroke="{GOLD}" stroke-width="5" marker-end="url(#arrowG2)"/>
      <text x="620" y="360" fill="{GOLD}" font-family="Outfit,Inter,sans-serif" font-size="34" font-weight="800">SELF-ACTUALISATION</text>
      <text x="620" y="398" fill="rgba(233,162,59,0.7)" font-family="Outfit,Inter,sans-serif" font-size="22" font-weight="500">Action meets self-knowledge</text>
    </svg>
    '''
    img = img_data_uri("slide-2-pattern.jpg")
    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background-image:url('{img}');background-size:cover;background-position:center;overflow:hidden;
">
  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.62);"></div>
  <div style="position:absolute;inset:0;z-index:2;">{diagram_svg}</div>
  {swipe_arrow()}
  {progress_bar(1, TOTAL_SLIDES)}
</div>
"""


def slide_3_unfulfilment() -> str:
    content = f"""
    <div style="margin-bottom:12px;">
      <span class="sans" style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Unfulfilment</span>
    </div>
    <h2 class="serif" style="font-size:32px;font-weight:600;line-height:1.1;letter-spacing:-0.6px;margin:0 0 14px;">
      Busy. Productive.
      <span style="color:{GOLD};">Quietly empty.</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0;color:#fff;font-weight:600;max-width:340px;">
      School teaches us how to work, without every giving us the self-knowledge to decide what that work is.
    </p>
    """
    return slide_shell(2, "slide-2-misguided.jpg", content)


def slide_4_crisis() -> str:
    content = f"""
    <div style="margin-bottom:14px;">
      <span class="sans" style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">The Crisis</span>
    </div>
    <h2 class="serif" style="font-size:34px;font-weight:600;line-height:1.1;letter-spacing:-0.6px;margin:0 0 14px;">
      Then something
      <span style="color:{GOLD};">breaks.</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Burnout. Breakdown. The moment the constructed life stops working.
      <span style="color:#fff;font-weight:600;">Your call to adventure.</span>
    </p>
    """
    return slide_shell(3, "slide-crisis.jpg", content)


def slide_5_dreams() -> str:
    content = f"""
    <div style="margin-bottom:12px;">
      <span class="sans" style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Head Full of Dreams</span>
    </div>
    <h2 class="serif" style="font-size:32px;font-weight:600;line-height:1.1;letter-spacing:-0.6px;margin:0 0 14px;">
      Head full of
      <span style="color:{GOLD};">dreams.</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Your vision lights you up. But taking action feels scary.
      <span style="color:#fff;font-weight:600;">You fear judgement, failure, not being good enough.</span>
    </p>
    """
    return slide_shell(4, "slide-3-paralysis.jpg", content)


def slide_6_diagonal() -> str:
    content = f"""
    <div style="margin-bottom:12px;">
      <span class="sans" style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Finding Flow</span>
    </div>
    <h2 class="serif" style="font-size:34px;font-weight:600;line-height:1.1;letter-spacing:-0.6px;margin:0 0 14px;">
      <span style="color:{GOLD};">Self-Actualisation.</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Your work lights you up. Action comes from excitement, not hustle for a future desire.
      <span style="color:#fff;font-weight:600;">You find yourself in flow.</span>
    </p>
    """
    return slide_shell(5, "slide-finding-flow.jpg", content)


def slide_7_cta() -> str:
    content = f"""
    <div style="margin-bottom:14px;">
      <span class="sans" style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Find My Flow</span>
    </div>
    <h2 class="serif" style="font-size:30px;font-weight:600;line-height:1.1;letter-spacing:-0.5px;margin:0 0 14px;max-width:360px;">
      Keen to find your flow and be
      <span style="color:{GOLD};">paid to have fun?</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0 0 18px;color:#fff;font-weight:600;max-width:340px;">
      For the next 100 days I&rsquo;m sharing how
    </p>
    <div style="display:inline-flex;align-items:center;gap:8px;padding:11px 22px;background:{GOLD};color:#1A0033;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;border-radius:28px;align-self:flex-start;letter-spacing:0.3px;">
      @_huzz &nbsp;→
    </div>
    """
    return slide_shell(6, "slide-4-diagonal.jpg", content, show_arrow=False)


# ---------------- HTML shell ---------------- #

def build_html() -> str:
    slides = [
        slide_1_hook(),
        slide_2_pattern(),
        slide_3_unfulfilment(),
        slide_4_crisis(),
        slide_5_dreams(),
        slide_6_diagonal(),
        slide_7_cta(),
    ]
    track = "\n".join(slides)
    dots = "".join(
        f'<span style="width:6px;height:6px;border-radius:50%;background:{"#5e17eb" if i==0 else "rgba(0,0,0,0.18)"};"></span>'
        for i in range(TOTAL_SLIDES)
    )

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Carousel 1 — Sprouter Sweet Spot</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600;1,9..144,700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{
    margin:0;padding:48px 16px;
    background:#f3f0ec;
    font-family:'Outfit','Inter',system-ui,sans-serif;
    color:#1a1a1a;
    display:flex;flex-direction:column;align-items:center;
    min-height:100vh;
  }}
  .serif{{font-family:'Fraunces','Georgia',serif;}}
  .sans{{font-family:'Outfit','Inter',sans-serif;}}
  .ig-frame{{
    width:420px;
    background:#fff;
    border-radius:12px;
    box-shadow:0 12px 60px -12px rgba(0,0,0,0.18),0 4px 16px -4px rgba(0,0,0,0.06);
    overflow:hidden;
    border:1px solid #e9e6e1;
  }}
  .ig-header{{
    display:flex;align-items:center;gap:10px;padding:12px 14px;
    border-bottom:1px solid #f1efeb;
  }}
  .ig-avatar{{
    width:32px;height:32px;border-radius:50%;
    background:linear-gradient(135deg,{PRIMARY},{GOLD});
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-weight:700;font-size:13px;
  }}
  .ig-handle{{font-size:13px;font-weight:600;color:#262626;}}
  .ig-sub{{font-size:11px;color:#8a8580;}}
  .carousel-viewport{{
    width:420px;height:525px;overflow:hidden;cursor:grab;position:relative;
  }}
  .carousel-track{{
    display:flex;height:100%;
    transition:transform 320ms cubic-bezier(0.22,0.61,0.36,1);
    will-change:transform;
  }}
  .ig-actions{{
    display:flex;align-items:center;gap:14px;padding:10px 14px 4px;
  }}
  .ig-actions svg{{width:22px;height:22px;stroke:#262626;fill:none;stroke-width:1.8;}}
  .ig-dots{{display:flex;justify-content:center;gap:5px;padding:6px 0;}}
  .ig-caption{{
    padding:6px 14px 14px;font-size:12px;color:#262626;line-height:1.4;
  }}
  .ig-caption b{{color:#262626;font-weight:600;}}
  .ig-caption .ts{{display:block;color:#a0a0a0;font-size:10px;margin-top:6px;letter-spacing:0.3px;text-transform:uppercase;}}
  .hint{{
    margin-top:18px;font-size:12px;color:#8a8580;text-align:center;max-width:420px;
  }}
</style>
</head>
<body>

<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar">F</div>
    <div>
      <div class="ig-handle">findmyflow</div>
      <div class="ig-sub">Get Paid To Have Fun</div>
    </div>
  </div>

  <div class="carousel-viewport">
    <div class="carousel-track" id="track">
      {track}
    </div>
  </div>

  <div class="ig-actions">
    <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>
    <svg viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 1 1-3.2-6.6L21 4l-1 4.5"/></svg>
    <svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
    <span style="flex:1"></span>
    <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
  </div>

  <div class="ig-dots" id="dots">{dots}</div>

  <div class="ig-caption">
    <b>findmyflow</b> The pattern I keep seeing on the path to fulfilment. Which zone are you in? &nbsp;#findmyflow #burnout #flowstate
    <span class="ts">2 hours ago</span>
  </div>
</div>

<p class="hint">Drag or use arrow keys to swipe between slides. Press <b>E</b> to toggle export-clean mode.</p>

<script>
  const track = document.getElementById('track');
  const dots = document.getElementById('dots').children;
  const total = {TOTAL_SLIDES};
  let idx = 0;
  let startX = 0, dx = 0, dragging = false;

  function go(i) {{
    idx = Math.max(0, Math.min(total - 1, i));
    track.style.transform = `translateX(${{-idx * 420}}px)`;
    Array.from(dots).forEach((d, k) => {{
      d.style.background = k === idx ? '{PRIMARY}' : 'rgba(0,0,0,0.18)';
    }});
  }}

  const viewport = track.parentElement;
  viewport.addEventListener('pointerdown', e => {{
    dragging = true; startX = e.clientX; dx = 0;
    viewport.setPointerCapture(e.pointerId);
    track.style.transition = 'none';
  }});
  viewport.addEventListener('pointermove', e => {{
    if (!dragging) return;
    dx = e.clientX - startX;
    track.style.transform = `translateX(${{-idx * 420 + dx}}px)`;
  }});
  function endDrag() {{
    if (!dragging) return;
    dragging = false;
    track.style.transition = '';
    if (dx < -50 && idx < total - 1) idx++;
    else if (dx > 50 && idx > 0) idx--;
    go(idx);
  }}
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  document.addEventListener('keydown', e => {{
    if (e.key === 'ArrowRight') go(idx + 1);
    if (e.key === 'ArrowLeft') go(idx - 1);
  }});
</script>
</body>
</html>
"""


def main() -> None:
    html = build_html()
    OUTPUT_HTML.write_text(html, encoding="utf-8")
    print(f"Wrote {OUTPUT_HTML} ({OUTPUT_HTML.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
