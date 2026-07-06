"""
Universal Graph Series carousel builder.

Reads a JSON data file and generates a self-contained HTML preview + IG frame.
All brand, typography, and layout decisions are locked in this template.
Per-carousel content lives entirely in the JSON.

Usage:
    python3 scripts/build-graph-carousel.py data/carousels/01-sprouter.json
    python3 scripts/build-graph-carousel.py data/carousels/02-identity.json

Output: public/images/carousel/{id}/preview.html
"""
import base64
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAROUSEL_ROOT = ROOT / "public" / "images" / "carousel"
IMAGES_DIR = CAROUSEL_ROOT / "images"


# ──────────────────────────── helpers ──────────────────────────── #

def img_data_uri(filename: str) -> str:
    path = IMAGES_DIR / filename
    if not path.exists():
        print(f"  WARNING: image not found: {path}")
        return ""
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


def render_text(raw: str, accent: str) -> str:
    """Convert <accent>word</accent> tokens into gold-colored spans."""
    return raw.replace("<accent>", f'<span style="color:{accent};">').replace("</accent>", "</span>")


# ──────────────────────────── slide renderers ──────────────────────────── #

def slide_photo(idx: int, total: int, slide: dict, brand: dict,
                show_arrow: bool = True, overlay: str = "default") -> str:
    """Standard photo-background slide with text anchored at bottom."""
    accent = brand["accent"]
    img = img_data_uri(slide["image"])

    if overlay == "heavy":
        ov = "background:linear-gradient(180deg,rgba(0,0,0,0.55) 0%,rgba(0,0,0,0.55) 100%);"
    else:
        ov = ("background:linear-gradient(180deg,"
              "rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.15) 35%,"
              "rgba(0,0,0,0.55) 65%,rgba(0,0,0,0.85) 100%);")

    # Build content HTML from slide fields
    parts = []

    # Tag
    tag = slide.get("tag", "")
    if tag:
        parts.append(
            f'<div style="margin-bottom:12px;">'
            f'<span class="sans" style="display:inline-block;font-size:10px;font-weight:700;'
            f'letter-spacing:2.5px;color:{accent};text-transform:uppercase;">{tag}</span></div>'
        )

    # Headline
    hl = slide.get("headline", "")
    if hl:
        size = "38px" if slide["type"] == "hook" else "30px" if slide["type"] == "cta" else "32px"
        parts.append(
            f'<h2 class="serif" style="font-size:{size};font-weight:600;line-height:1.1;'
            f'letter-spacing:-0.6px;margin:0 0 14px;max-width:360px;">'
            f'{render_text(hl, accent)}</h2>'
        )

    # Body
    body = slide.get("body")
    emphasis = slide.get("emphasis")
    if body or emphasis:
        body_style = slide.get("bodyStyle", "normal")
        if body_style == "bold":
            # Entire body is bold white (no emphasis suffix)
            parts.append(
                f'<p class="sans" style="font-size:14px;line-height:1.55;margin:0;'
                f'color:#fff;font-weight:600;max-width:340px;">{body}</p>'
            )
        else:
            inner = body or ""
            if emphasis:
                inner += f' <span style="color:#fff;font-weight:600;">{emphasis}</span>'
            parts.append(
                f'<p class="sans" style="font-size:14px;line-height:1.55;margin:0;'
                f'color:rgba(255,255,255,0.85);max-width:340px;">{inner}</p>'
            )

    # CTA button
    btn = slide.get("button")
    if btn:
        parts.append(
            f'<div style="display:inline-flex;align-items:center;gap:8px;padding:11px 22px;'
            f'background:{accent};color:#1A0033;font-family:\'Outfit\',sans-serif;'
            f'font-weight:700;font-size:13px;border-radius:28px;align-self:flex-start;'
            f'letter-spacing:0.3px;margin-top:4px;">{btn} &nbsp;\u2192</div>'
        )

    content_html = "\n    ".join(parts)
    arrow_html = swipe_arrow() if show_arrow else ""

    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background-image:url('{img}');background-size:cover;background-position:center;overflow:hidden;
">
  <div style="position:absolute;inset:0;{ov}"></div>
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 60px;color:#fff;">
    {content_html}
  </div>
  {arrow_html}
  {progress_bar(idx, total)}
</div>
"""


def slide_diagram(idx: int, total: int, slide: dict, diagram: dict, brand: dict) -> str:
    """Diagram slide: photo background + heavy overlay + inline SVG."""
    accent = brand["accent"]
    img = img_data_uri(slide["image"])

    # Build title lines
    title_lines = diagram.get("title", [""])
    title_svgs = []
    y = 120
    for line in title_lines:
        title_svgs.append(
            f'<text x="540" y="{y}" text-anchor="middle" fill="white" '
            f'font-family="Fraunces,Georgia,serif" font-size="50" font-weight="600">{line}</text>'
        )
        y += 60

    # Axes
    x_label = diagram.get("xAxis", "X")
    y_label = diagram.get("yAxis", "Y")

    # Zone labels and arrows
    zone_svgs = []
    # Standard 3-zone layout positions
    positions = {
        "top-left": {"label_x": 360, "label_y": 290, "sub_y": 325},
        "bottom-right": {"label_x": 620, "label_y": 770, "sub_y": 805},
        "mid-right-high": {"label_x": 620, "label_y": 360, "sub_y": 398},
    }

    for zone in diagram.get("zones", []):
        pos = positions.get(zone.get("position", "top-left"), positions["top-left"])
        color = accent if zone.get("color") == "accent" else "white"
        sub_color = f"rgba(233,162,59,0.7)" if zone.get("color") == "accent" else "rgba(255,255,255,0.6)"
        font_size = "34" if zone.get("position") != "bottom-right" else "32"

        zone_svgs.append(
            f'<text x="{pos["label_x"]}" y="{pos["label_y"]}" fill="{color}" '
            f'font-family="Outfit,Inter,sans-serif" font-size="{font_size}" font-weight="800">{zone["name"]}</text>'
        )
        zone_svgs.append(
            f'<text x="{pos["label_x"]}" y="{pos["sub_y"]}" fill="{sub_color}" '
            f'font-family="Outfit,Inter,sans-serif" font-size="22" font-weight="500">{zone.get("subtitle", "")}</text>'
        )

        # Arrows
        arrow = zone.get("arrow", {})
        arrow_color = accent if arrow.get("color") == "accent" else "white"
        marker_id = f'arrow_{zone["name"].replace(" ", "_")}'
        zone_svgs.append(
            f'<defs><marker id="{marker_id}" viewBox="0 0 10 10" refX="8" refY="5" '
            f'markerWidth="8" markerHeight="8" orient="auto-start-reverse">'
            f'<path d="M 0 0 L 10 5 L 0 10 z" fill="{arrow_color}"/></marker></defs>'
        )
        if arrow.get("type") == "straight":
            zone_svgs.append(
                f'<line x1="{arrow["x"]}" y1="{arrow["y1"]}" x2="{arrow["x"]}" y2="{arrow["y2"]}" '
                f'stroke="{arrow_color}" stroke-width="5" marker-end="url(#{marker_id})"/>'
            )
        elif "path" in arrow:
            zone_svgs.append(
                f'<path d="{arrow["path"]}" stroke="{arrow_color}" stroke-width="5" '
                f'fill="none" marker-end="url(#{marker_id})"/>'
            )

    svg = f'''
    <svg viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid meet"
         style="position:absolute;inset:0;width:100%;height:100%;">
      {"".join(title_svgs)}

      <line x1="140" y1="900" x2="140" y2="240" stroke="rgba(255,255,255,0.55)" stroke-width="4"/>
      <line x1="140" y1="900" x2="960" y2="900" stroke="rgba(255,255,255,0.55)" stroke-width="4"/>
      <polygon points="140,240 132,260 148,260" fill="rgba(255,255,255,0.55)"/>
      <polygon points="960,900 940,892 940,908" fill="rgba(255,255,255,0.55)"/>

      <text x="60" y="570" text-anchor="middle" fill="rgba(255,255,255,0.55)"
            font-family="Outfit,Inter,sans-serif" font-size="26" font-weight="700"
            letter-spacing="2" transform="rotate(-90,60,570)">{y_label}</text>
      <text x="550" y="980" text-anchor="middle" fill="rgba(255,255,255,0.55)"
            font-family="Outfit,Inter,sans-serif" font-size="26" font-weight="700"
            letter-spacing="2">{x_label}</text>

      <line x1="190" y1="850" x2="910" y2="270" stroke="{accent}" stroke-width="4" opacity="0.22"/>

      {"".join(zone_svgs)}
    </svg>
    '''

    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background-image:url('{img}');background-size:cover;background-position:center;overflow:hidden;
">
  <div style="position:absolute;inset:0;background:rgba(0,0,0,0.62);"></div>
  <div style="position:absolute;inset:0;z-index:2;">{svg}</div>
  {swipe_arrow()}
  {progress_bar(idx, total)}
</div>
"""


# ──────────────────────────── HTML shell ──────────────────────────── #

def build_carousel(data: dict) -> str:
    brand = data["brand"]
    slides_data = data["slides"]
    diagram = data.get("diagram", {})
    total = len(slides_data)
    primary = brand["primary"]
    accent = brand["accent"]

    # Render each slide
    slide_htmls = []
    for i, s in enumerate(slides_data):
        is_last = i == total - 1
        if s["type"] == "diagram":
            slide_htmls.append(slide_diagram(i, total, s, diagram, brand))
        else:
            slide_htmls.append(slide_photo(i, total, s, brand,
                                           show_arrow=not is_last))

    track = "\n".join(slide_htmls)
    dots = "".join(
        f'<span style="width:6px;height:6px;border-radius:50%;'
        f'background:{"{}" if i == 0 else "rgba(0,0,0,0.18)"};"></span>'.format(primary)
        for i in range(total)
    )

    handle = brand.get("handle", "@_huzz").lstrip("@")
    caption_preview = data.get("caption", "").split("\n")[0][:120]

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{data["name"]}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500;1,9..144,600;1,9..144,700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{margin:0;padding:48px 16px;background:#f3f0ec;font-family:'Outfit','Inter',system-ui,sans-serif;color:#1a1a1a;display:flex;flex-direction:column;align-items:center;min-height:100vh;}}
  .serif{{font-family:'Fraunces','Georgia',serif;}}
  .sans{{font-family:'Outfit','Inter',sans-serif;}}
  .ig-frame{{width:420px;background:#fff;border-radius:12px;box-shadow:0 12px 60px -12px rgba(0,0,0,0.18),0 4px 16px -4px rgba(0,0,0,0.06);overflow:hidden;border:1px solid #e9e6e1;}}
  .ig-header{{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #f1efeb;}}
  .ig-avatar{{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,{primary},{accent});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;}}
  .ig-handle{{font-size:13px;font-weight:600;color:#262626;}}
  .ig-sub{{font-size:11px;color:#8a8580;}}
  .carousel-viewport{{width:420px;height:525px;overflow:hidden;cursor:grab;position:relative;}}
  .carousel-track{{display:flex;height:100%;transition:transform 320ms cubic-bezier(0.22,0.61,0.36,1);will-change:transform;}}
  .ig-actions{{display:flex;align-items:center;gap:14px;padding:10px 14px 4px;}}
  .ig-actions svg{{width:22px;height:22px;stroke:#262626;fill:none;stroke-width:1.8;}}
  .ig-dots{{display:flex;justify-content:center;gap:5px;padding:6px 0;}}
  .ig-caption{{padding:6px 14px 14px;font-size:12px;color:#262626;line-height:1.4;}}
  .ig-caption b{{color:#262626;font-weight:600;}}
  .ig-caption .ts{{display:block;color:#a0a0a0;font-size:10px;margin-top:6px;letter-spacing:0.3px;text-transform:uppercase;}}
  .hint{{margin-top:18px;font-size:12px;color:#8a8580;text-align:center;max-width:420px;}}
</style>
</head>
<body>
<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar">{brand["brandName"][0]}</div>
    <div>
      <div class="ig-handle">{handle}</div>
      <div class="ig-sub">{brand.get("tagline", "")}</div>
    </div>
  </div>
  <div class="carousel-viewport">
    <div class="carousel-track" id="track">{track}</div>
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
    <b>{handle}</b> {caption_preview}...
    <span class="ts">2 hours ago</span>
  </div>
</div>
<p class="hint">Drag or use arrow keys to swipe. {total} slides.</p>
<script>
  const track=document.getElementById('track'),dots=document.getElementById('dots').children,total={total};
  let idx=0,startX=0,dx=0,dragging=false;
  function go(i){{idx=Math.max(0,Math.min(total-1,i));track.style.transform=`translateX(${{-idx*420}}px)`;Array.from(dots).forEach((d,k)=>{{d.style.background=k===idx?'{primary}':'rgba(0,0,0,0.18)'}})}}
  const vp=track.parentElement;
  vp.addEventListener('pointerdown',e=>{{dragging=true;startX=e.clientX;dx=0;vp.setPointerCapture(e.pointerId);track.style.transition='none'}});
  vp.addEventListener('pointermove',e=>{{if(!dragging)return;dx=e.clientX-startX;track.style.transform=`translateX(${{-idx*420+dx}}px)`}});
  function end(){{if(!dragging)return;dragging=false;track.style.transition='';if(dx<-50&&idx<total-1)idx++;else if(dx>50&&idx>0)idx--;go(idx)}}
  vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);vp.addEventListener('pointerleave',end);
  document.addEventListener('keydown',e=>{{if(e.key==='ArrowRight')go(idx+1);if(e.key==='ArrowLeft')go(idx-1)}});
</script>
</body>
</html>"""


# ──────────────────────────── main ──────────────────────────── #

def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/build-graph-carousel.py data/carousels/01-sprouter.json")
        sys.exit(1)

    json_path = Path(sys.argv[1])
    if not json_path.exists():
        print(f"ERROR: {json_path} not found")
        sys.exit(1)

    data = json.loads(json_path.read_text(encoding="utf-8"))
    carousel_id = data["id"]

    # Output directory per carousel
    out_dir = CAROUSEL_ROOT / carousel_id
    out_dir.mkdir(exist_ok=True)
    out_file = out_dir / "preview.html"

    html = build_carousel(data)
    out_file.write_text(html, encoding="utf-8")
    print(f"Wrote {out_file} ({out_file.stat().st_size:,} bytes)")
    print(f"Open: file://{out_file}")


if __name__ == "__main__":
    main()
