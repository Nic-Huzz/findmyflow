"""
Single-slide carousel: The Fun Graph
Joy × Presence. Three zones. One signal.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "images" / "carousel" / "fun-graph-single.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"

PURPLE_BG = "background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);"


def main():
    diagram = f'''
    <svg viewBox="0 0 1080 1350" preserveAspectRatio="xMidYMid meet"
         style="position:absolute;inset:0;width:100%;height:100%;">

      <!-- Title -->
      <text x="540" y="100" text-anchor="middle" fill="white"
            font-family="Fraunces,Georgia,serif" font-size="54" font-weight="600">The <tspan fill="{GOLD}">Fun</tspan> Graph</text>
      <text x="540" y="155" text-anchor="middle" fill="rgba(255,255,255,0.5)"
            font-family="Outfit,sans-serif" font-size="26" font-weight="500">The most honest signal in the entire framework.</text>

      <!-- Axes -->
      <line x1="180" y1="1100" x2="180" y2="300" stroke="rgba(255,255,255,0.55)" stroke-width="4"/>
      <line x1="180" y1="1100" x2="940" y2="1100" stroke="rgba(255,255,255,0.55)" stroke-width="4"/>
      <polygon points="180,300 172,320 188,320" fill="rgba(255,255,255,0.55)"/>
      <polygon points="940,1100 920,1092 920,1108" fill="rgba(255,255,255,0.55)"/>

      <!-- Axis labels -->
      <text x="90" y="700" text-anchor="middle" fill="rgba(255,255,255,0.45)"
            font-family="Outfit,sans-serif" font-size="26" font-weight="600"
            letter-spacing="2" transform="rotate(-90,90,700)">JOY</text>
      <text x="560" y="1170" text-anchor="middle" fill="rgba(255,255,255,0.45)"
            font-family="Outfit,sans-serif" font-size="26" font-weight="600"
            letter-spacing="2">PRESENCE</text>

      <!-- Gold diagonal -->
      <line x1="230" y1="1050" x2="890" y2="350" stroke="{GOLD}" stroke-width="4" opacity="0.22"/>

      <!-- Top-left: Performing Zone -->
      <text x="340" y="420" fill="white"
            font-family="Outfit,sans-serif" font-size="34" font-weight="800">PERFORMING</text>
      <text x="340" y="460" fill="rgba(255,255,255,0.5)"
            font-family="Outfit,sans-serif" font-size="22" font-weight="500">High joy expression.</text>
      <text x="340" y="488" fill="rgba(255,255,255,0.5)"
            font-family="Outfit,sans-serif" font-size="22" font-weight="500">Low actual presence.</text>
      <text x="340" y="530" fill="rgba(255,255,255,0.38)"
            font-family="Outfit,sans-serif" font-size="20" font-style="italic">Life of the party who</text>
      <text x="340" y="556" fill="rgba(255,255,255,0.38)"
            font-family="Outfit,sans-serif" font-size="20" font-style="italic">goes home feeling empty.</text>

      <!-- Diagonal: Fun Sweet Spot -->
      <text x="560" y="680" text-anchor="middle" fill="{GOLD}"
            font-family="Outfit,sans-serif" font-size="34" font-weight="800">FUN SWEET SPOT</text>
      <text x="560" y="720" text-anchor="middle" fill="rgba(233,162,59,0.6)"
            font-family="Outfit,sans-serif" font-size="22" font-weight="500">Genuine joy from genuine presence.</text>
      <text x="560" y="752" text-anchor="middle" fill="rgba(233,162,59,0.45)"
            font-family="Outfit,sans-serif" font-size="20" font-style="italic">Unselfconscious aliveness.</text>

      <!-- Bottom-right: Numb Zone -->
      <text x="620" y="880" fill="white"
            font-family="Outfit,sans-serif" font-size="34" font-weight="800">NUMB</text>
      <text x="620" y="920" fill="rgba(255,255,255,0.5)"
            font-family="Outfit,sans-serif" font-size="22" font-weight="500">Present but joy suppressed.</text>
      <text x="620" y="955" fill="rgba(255,255,255,0.38)"
            font-family="Outfit,sans-serif" font-size="20" font-style="italic">You arrived. But you</text>
      <text x="620" y="981" fill="rgba(255,255,255,0.38)"
            font-family="Outfit,sans-serif" font-size="20" font-style="italic">can't feel it.</text>

      <!-- Bottom insight -->
      <text x="540" y="1240" text-anchor="middle" fill="rgba(255,255,255,0.4)"
            font-family="Outfit,sans-serif" font-size="22" font-weight="500">You cannot fake genuine fun.</text>
      <text x="540" y="1272" text-anchor="middle" fill="rgba(255,255,255,0.4)"
            font-family="Outfit,sans-serif" font-size="22" font-weight="500">That's what makes it the most honest signal.</text>

    </svg>
    '''

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>The Fun Graph</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{margin:0;padding:48px 16px;background:#f3f0ec;font-family:'Outfit',sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh;}}
  .ig-frame{{width:420px;background:#fff;border-radius:12px;box-shadow:0 12px 60px -12px rgba(0,0,0,0.18);overflow:hidden;border:1px solid #e9e6e1;}}
  .ig-header{{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #f1efeb;}}
  .ig-avatar{{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,{PRIMARY},{GOLD});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;}}
  .ig-handle{{font-size:13px;font-weight:600;color:#262626;}}
  .ig-sub{{font-size:11px;color:#8a8580;}}
  .ig-actions{{display:flex;align-items:center;gap:14px;padding:10px 14px 4px;}}
  .ig-actions svg{{width:22px;height:22px;stroke:#262626;fill:none;stroke-width:1.8;}}
</style>
</head><body>

<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar">F</div>
    <div><div class="ig-handle" style="font-family:'Outfit',sans-serif;">_huzz</div><div class="ig-sub" style="font-family:'Outfit',sans-serif;">Get Paid To Have Fun</div></div>
  </div>
  <div style="width:420px;height:525px;position:relative;{PURPLE_BG}overflow:hidden;">
    {diagram}
  </div>
  <div class="ig-actions">
    <svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>
    <svg viewBox="0 0 24 24"><path d="M21 12a8.5 8.5 0 1 1-3.2-6.6L21 4l-1 4.5"/></svg>
    <svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
    <span style="flex:1"></span>
    <svg viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
  </div>
</div>

</body></html>"""

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
