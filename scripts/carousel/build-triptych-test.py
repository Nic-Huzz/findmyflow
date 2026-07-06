"""
Quick test: triptych slide layout with 3 wound stage images.
Generates a single-slide HTML to test whether horizontal or vertical works better.
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "public" / "images" / "onboarding"
OUTPUT = ROOT / "public" / "images" / "carousel" / "triptych-test.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"


def img_uri(filename):
    path = IMAGES_DIR / filename
    if not path.exists():
        return ""
    return f"data:image/png;base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


def main():
    img1 = img_uri("stage1-overwhelmed.png")
    img2 = img_uri("stage1-secure.png")
    img3 = img_uri("stage1-invisible.png")

    html = f"""<!doctype html>
<html><head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * {{ box-sizing: border-box; }}
  body {{ margin:0; padding:40px; background:#f3f0ec; display:flex; gap:40px; flex-wrap:wrap; justify-content:center; font-family:'Outfit',sans-serif; }}
  .label {{ text-align:center; font-size:13px; color:#888; margin-bottom:12px; font-weight:600; letter-spacing:1px; }}
  .slide {{
    width:420px; height:525px; flex-shrink:0; overflow:hidden; position:relative;
    background: radial-gradient(ellipse at 30% 20%, #1a0b2e 0%, #0a0512 55%, #05030a 100%);
    border-radius:12px; color:#fff;
  }}
</style>
</head>
<body>

<!-- VERSION A: Horizontal (3 across) -->
<div>
<div class="label">A: HORIZONTAL</div>
<div class="slide" style="display:flex;flex-direction:column;justify-content:flex-start;padding:28px 24px 52px;">
  <!-- Tag -->
  <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;margin-bottom:10px;">Stage 1: You Arrive</span>
  <!-- Headline -->
  <h2 style="font-family:'Fraunces',serif;font-size:24px;font-weight:600;line-height:1.1;margin:0 0 6px;letter-spacing:-0.4px;">
    You needed two things: to be <span style="color:{GOLD};">seen</span> and to be <span style="color:{GOLD};">safe.</span>
  </h2>
  <p style="font-size:12px;line-height:1.45;color:rgba(255,255,255,0.7);margin:0 0 16px;max-width:380px;">
    If you got both, you could explore. If not, your nervous system learned a pattern.
  </p>
  <!-- Three images horizontal -->
  <div style="display:flex;gap:8px;flex:1;min-height:0;">
    <div style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
      <div style="flex:1;border-radius:10px;overflow:hidden;background:#1a1a2e;">
        <img src="{img1}" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%;">
      </div>
      <span style="font-size:9px;font-weight:600;color:#e74c3c;text-align:center;letter-spacing:0.5px;">🔥 OVERWHELMED</span>
      <span style="font-size:8px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.2;">Seen but never settled</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
      <div style="flex:1;border-radius:10px;overflow:hidden;background:#1a2e1a;">
        <img src="{img2}" style="width:100%;height:100%;object-fit:cover;object-position:55% 30%;">
      </div>
      <span style="font-size:9px;font-weight:600;color:#2ecc71;text-align:center;letter-spacing:0.5px;">🌿 SECURE</span>
      <span style="font-size:8px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.2;">Attuned and safe</span>
    </div>
    <div style="flex:1;display:flex;flex-direction:column;gap:6px;min-width:0;">
      <div style="flex:1;border-radius:10px;overflow:hidden;background:#1a1a2e;">
        <img src="{img3}" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%;">
      </div>
      <span style="font-size:9px;font-weight:600;color:#3498db;text-align:center;letter-spacing:0.5px;">🧊 INVISIBLE</span>
      <span style="font-size:8px;color:rgba(255,255,255,0.5);text-align:center;line-height:1.2;">Safe but unseen</span>
    </div>
  </div>
  <!-- Progress bar -->
  <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:rgba(255,255,255,0.18);border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:28.57%;background:#fff;border-radius:2px;"></div>
    </div>
    <span style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:500;">2/7</span>
  </div>
</div>
</div>

<!-- VERSION B: Vertical (stacked) -->
<div>
<div class="label">B: VERTICAL</div>
<div class="slide" style="display:flex;flex-direction:column;justify-content:flex-start;padding:28px 24px 52px;">
  <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;margin-bottom:10px;">Stage 1: You Arrive</span>
  <h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:600;line-height:1.1;margin:0 0 12px;letter-spacing:-0.4px;">
    You needed two things: to be <span style="color:{GOLD};">seen</span> and to be <span style="color:{GOLD};">safe.</span>
  </h2>
  <!-- Three images vertical -->
  <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;">
    <div style="flex:1;display:flex;gap:10px;align-items:center;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.04);padding:0;">
      <div style="width:110px;height:100%;flex-shrink:0;overflow:hidden;">
        <img src="{img1}" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%;">
      </div>
      <div style="padding:8px 10px 8px 0;">
        <span style="font-size:11px;font-weight:700;color:#e74c3c;">🔥 The Overwhelmed Child</span>
        <p style="font-size:10px;color:rgba(255,255,255,0.6);margin:4px 0 0;line-height:1.3;">Seen but never settled. Chaotic but present caregiver.</p>
      </div>
    </div>
    <div style="flex:1;display:flex;gap:10px;align-items:center;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.04);padding:0;">
      <div style="width:110px;height:100%;flex-shrink:0;overflow:hidden;">
        <img src="{img2}" style="width:100%;height:100%;object-fit:cover;object-position:55% 30%;">
      </div>
      <div style="padding:8px 10px 8px 0;">
        <span style="font-size:11px;font-weight:700;color:#2ecc71;">🌿 Secure Base</span>
        <p style="font-size:10px;color:rgba(255,255,255,0.6);margin:4px 0 0;line-height:1.3;">Attuned and safe. Could explore and be met.</p>
      </div>
    </div>
    <div style="flex:1;display:flex;gap:10px;align-items:center;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.04);padding:0;">
      <div style="width:110px;height:100%;flex-shrink:0;overflow:hidden;">
        <img src="{img3}" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%;">
      </div>
      <div style="padding:8px 10px 8px 0;">
        <span style="font-size:11px;font-weight:700;color:#3498db;">🧊 The Invisible Child</span>
        <p style="font-size:10px;color:rgba(255,255,255,0.6);margin:4px 0 0;line-height:1.3;">Physically safe but unseen. Needs met, self not witnessed.</p>
      </div>
    </div>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:rgba(255,255,255,0.18);border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:28.57%;background:#fff;border-radius:2px;"></div>
    </div>
    <span style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:500;">2/7</span>
  </div>
</div>
</div>

<!-- VERSION C: Horizontal, bigger images, minimal text -->
<div>
<div class="label">C: HORIZONTAL LARGE</div>
<div class="slide" style="display:flex;flex-direction:column;justify-content:flex-end;padding:0 0 52px;">
  <!-- Images take top 60% -->
  <div style="display:flex;gap:4px;padding:0 4px;height:280px;margin-top:28px;">
    <div style="flex:1;border-radius:8px;overflow:hidden;">
      <img src="{img1}" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%;">
    </div>
    <div style="flex:1;border-radius:8px;overflow:hidden;">
      <img src="{img2}" style="width:100%;height:100%;object-fit:cover;object-position:55% 30%;">
    </div>
    <div style="flex:1;border-radius:8px;overflow:hidden;">
      <img src="{img3}" style="width:100%;height:100%;object-fit:cover;object-position:50% 35%;">
    </div>
  </div>
  <!-- Labels row -->
  <div style="display:flex;gap:4px;padding:6px 4px 0;">
    <span style="flex:1;font-size:8px;font-weight:600;color:#e74c3c;text-align:center;">🔥 Overwhelmed</span>
    <span style="flex:1;font-size:8px;font-weight:600;color:#2ecc71;text-align:center;">🌿 Secure</span>
    <span style="flex:1;font-size:8px;font-weight:600;color:#3498db;text-align:center;">🧊 Invisible</span>
  </div>
  <!-- Text at bottom -->
  <div style="padding:12px 24px 0;">
    <span style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Stage 1: You Arrive</span>
    <h2 style="font-family:'Fraunces',serif;font-size:22px;font-weight:600;line-height:1.1;margin:8px 0 0;letter-spacing:-0.4px;">
      You needed two things: to be <span style="color:{GOLD};">seen</span> and to be <span style="color:{GOLD};">safe.</span>
    </h2>
  </div>
  <div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;height:3px;background:rgba(255,255,255,0.18);border-radius:2px;overflow:hidden;">
      <div style="height:100%;width:28.57%;background:#fff;border-radius:2px;"></div>
    </div>
    <span style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:500;">2/7</span>
  </div>
</div>
</div>

</body></html>"""

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
