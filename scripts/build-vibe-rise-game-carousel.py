"""
Carousel: Vibe Rise — The Game
Distilled from vibe-rise-story-v2.html into 9 IG slides.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "images" / "carousel" / "vibe-rise-game-draft.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
TOTAL_SLIDES = 9

DARK_BG = "background:radial-gradient(ellipse at 50% 60%, #0e0520 0%, #04010a 70%);"
PURPLE_BG = "background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);"
WARM_BG = "background:radial-gradient(circle at 30% 20%, rgba(94,23,235,.14), transparent 45%),radial-gradient(circle at 80% 90%, rgba(233,162,59,.10), transparent 50%),#06030f;"
GOLD_BG = "background:radial-gradient(circle at 50% 40%, rgba(233,162,59,.16), transparent 55%),radial-gradient(circle at 30% 80%, rgba(94,23,235,.08), transparent 45%),#06030f;"


def progress_bar(idx):
    pct = ((idx + 1) / TOTAL_SLIDES) * 100
    return (
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;'
        'z-index:10;display:flex;align-items:center;gap:10px;">'
        '<div style="flex:1;height:3px;background:rgba(255,255,255,0.18);border-radius:2px;overflow:hidden;">'
        f'<div style="height:100%;width:{pct:.1f}%;background:linear-gradient(90deg,{PRIMARY},{GOLD});border-radius:2px;"></div>'
        '</div>'
        f'<span style="font-size:11px;color:rgba(255,255,255,0.5);font-weight:500;">{idx+1}/{TOTAL_SLIDES}</span>'
        '</div>'
    )


def swipe_arrow():
    return (
        '<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;'
        'display:flex;align-items:center;justify-content:center;'
        'background:linear-gradient(to right,transparent,rgba(255,255,255,0.06));">'
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">'
        '<path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.4)" '
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
        '</svg></div>'
    )


def slide_1_hook():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{DARK_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#efe6d4;">
    <p class="flavour" style="font-size:16px;line-height:1.4;margin:0 0 20px;color:rgba(239,230,212,0.7);">
      You've read the self-help books.<br/>Downloaded the meditation apps.
    </p>
    <h2 class="display" style="font-size:42px;line-height:.94;letter-spacing:.015em;margin:0;color:#fff;">
      BUT YOU STILL<br/>FEEL <span style="color:#8b5cf6;">STUCK.</span>
    </h2>
  </div>
  {swipe_arrow()}
  {progress_bar(0)}
</div>
"""


def slide_2_viberise():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 50% 70%, rgba(94,23,235,.28), transparent 55%),radial-gradient(circle at 50% 10%, rgba(20,8,30,.6), transparent 40%),#08031a;overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 36px;color:#fff;text-align:center;">
    <h1 style="font-family:'Outfit',sans-serif;font-size:72px;font-weight:800;line-height:.86;letter-spacing:.02em;margin:0 0 20px;text-shadow:0 0 60px rgba(94,23,235,.25);">
      VIBE<br/>RISE
    </h1>
    <p class="flavour" style="font-size:16px;line-height:1.35;color:rgba(239,230,212,0.8);margin:0;">
      This isn't therapy. This is a game.<br/>And you're about to play it.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(1)}
</div>
"""


def slide_3_enemy():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 50% 50%, rgba(94,23,235,.18), transparent 60%),linear-gradient(180deg, #08031a 0%, #0a0510 100%);overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 24px;color:#fff;text-align:center;">
    <p class="sans" style="font-size:10px;font-weight:600;letter-spacing:.4em;text-transform:uppercase;color:#8b5cf6;margin:0 0 14px;">The Enemy</p>
    <h2 class="display" style="font-size:36px;line-height:.94;letter-spacing:.015em;margin:0 0 20px;">
      THE MATRIX INSTALLED<br/>FIVE <span style="color:{GOLD};">DEFENCE PATTERNS.</span>
    </h2>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:18px;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="width:52px;height:52px;border-radius:50%;border:1.5px solid #3b0f94;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#140d1e,#080412);font-size:22px;">🧱</div>
        <span class="sans" style="font-size:9px;color:rgba(239,230,212,0.7);">Controller</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="width:52px;height:52px;border-radius:50%;border:1.5px solid #3b0f94;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#140d1e,#080412);font-size:22px;">🤝</div>
        <span class="sans" style="font-size:9px;color:rgba(239,230,212,0.7);">People Pleaser</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="width:52px;height:52px;border-radius:50%;border:1.5px solid #3b0f94;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#140d1e,#080412);font-size:22px;">🤖</div>
        <span class="sans" style="font-size:9px;color:rgba(239,230,212,0.7);">Auto-Pilot</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="width:52px;height:52px;border-radius:50%;border:1.5px solid #3b0f94;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#140d1e,#080412);font-size:22px;">🎯</div>
        <span class="sans" style="font-size:9px;color:rgba(239,230,212,0.7);">Perfectionist</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
        <div style="width:52px;height:52px;border-radius:50%;border:1.5px solid #3b0f94;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#140d1e,#080412);font-size:22px;">👻</div>
        <span class="sans" style="font-size:9px;color:rgba(239,230,212,0.7);">Ghost</span>
      </div>
    </div>
    <p class="sans" style="font-size:13px;color:rgba(239,230,212,0.6);margin:0;">They kept you safe once. <span style="color:#efe6d4;font-weight:600;">Now they keep you stuck.</span></p>
  </div>
  {swipe_arrow()}
  {progress_bar(2)}
</div>
"""


def slide_4_essence():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{DARK_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#efe6d4;">
    <p class="sans" style="font-size:10px;font-weight:600;letter-spacing:.4em;text-transform:uppercase;color:{GOLD};margin:0 0 14px;">Before The Matrix shaped you</p>
    <h2 class="display" style="font-size:38px;line-height:.94;letter-spacing:.015em;margin:0 0 18px;color:#fff;">
      YOU HAD A <span style="color:{GOLD};">VOICE.</span>
    </h2>
    <p class="flavour" style="font-size:16px;line-height:1.35;color:rgba(239,230,212,0.8);margin:0;">
      Your Essence Voice.<br/>The person you were before the world told you who to be.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(3)}
</div>
"""


def slide_5_weapons():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{WARM_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 24px;color:#fff;">
    <h2 class="display" style="font-size:36px;line-height:.94;letter-spacing:.015em;margin:0 0 20px;text-align:center;">
      YOUR THREE<br/><span style="color:{GOLD};">WEAPONS.</span>
    </h2>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <div style="border:1px solid rgba(94,23,235,.28);border-radius:4px;background:linear-gradient(160deg, rgba(94,23,235,.06), transparent);padding:14px 16px;">
        <h4 style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:{GOLD};margin:0 0 6px;">\u2600\ufe0f Tune</h4>
        <p class="sans" style="font-size:11px;line-height:1.5;color:rgba(239,230,212,0.6);margin:0;">Daily practices that regulate your nervous system and keep the defence patterns quiet.</p>
      </div>
      <div style="border:1px solid rgba(94,23,235,.28);border-radius:4px;background:linear-gradient(160deg, rgba(94,23,235,.06), transparent);padding:14px 16px;">
        <h4 style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:{GOLD};margin:0 0 6px;">\U0001f525 Wahoo</h4>
        <p class="sans" style="font-size:11px;line-height:1.5;color:rgba(239,230,212,0.6);margin:0;">Courage challenges. The things that scare you. Each one expands your capacity.</p>
      </div>
      <div style="border:1px solid rgba(94,23,235,.28);border-radius:4px;background:linear-gradient(160deg, rgba(94,23,235,.06), transparent);padding:14px 16px;">
        <h4 style="font-family:'Outfit',sans-serif;font-size:15px;font-weight:700;color:{GOLD};margin:0 0 6px;">\U0001f49c Healing</h4>
        <p class="sans" style="font-size:11px;line-height:1.5;color:rgba(239,230,212,0.6);margin:0;">Recognise, Release, Rewire. Clear the blockages the defence patterns left behind.</p>
      </div>
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(4)}
</div>
"""


def slide_6_equation():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{WARM_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 30px;color:#fff;text-align:center;">
    <h2 class="display" style="font-size:36px;line-height:.94;letter-spacing:.015em;margin:0 0 24px;">
      THE <span style="color:{GOLD};">EQUATION.</span>
    </h2>
    <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:700;color:{GOLD};letter-spacing:.04em;padding:18px 24px;border:1px solid rgba(233,162,59,.3);border-radius:4px;background:linear-gradient(160deg, rgba(233,162,59,.06), transparent);">
      VIBE RISE <span style="color:rgba(239,230,212,0.5);font-weight:400;font-size:.7em;">=</span><br/>
      (Tune <span style="color:rgba(239,230,212,0.5);font-weight:400;font-size:.7em;">+</span> Wahoo <span style="color:rgba(239,230,212,0.5);font-weight:400;font-size:.7em;">+</span> Healing)<br/>
      <span style="color:rgba(239,230,212,0.5);font-weight:400;font-size:.7em;">\u00f7</span> Drains
    </div>
    <p class="flavour" style="font-size:15px;color:rgba(239,230,212,0.7);margin:18px 0 0;">Raise the top. Shrink the bottom.</p>
  </div>
  {swipe_arrow()}
  {progress_bar(5)}
</div>
"""


def slide_7_league():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 50% 70%, rgba(94,23,235,.28), transparent 55%),radial-gradient(circle at 50% 10%, rgba(20,8,30,.6), transparent 40%),#08031a;overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 24px;color:#fff;text-align:center;">
    <p class="sans" style="font-size:10px;font-weight:600;letter-spacing:.4em;text-transform:uppercase;color:{GOLD};margin:0 0 14px;">The Game</p>
    <h2 class="display" style="font-size:36px;line-height:.94;letter-spacing:.015em;margin:0 0 18px;">
      FANTASY <span style="color:{GOLD};">LEAGUE.</span>
    </h2>
    <p class="sans" style="font-size:14px;color:rgba(239,230,212,0.7);margin:0 0 18px;">Weekly matchups. Three categories. One winner.</p>
    <div style="display:flex;gap:8px;justify-content:center;width:100%;">
      <div style="flex:1;border:1px solid rgba(94,23,235,.25);border-radius:6px;padding:12px 8px;text-align:center;background:linear-gradient(160deg, rgba(94,23,235,.05), transparent);">
        <div style="font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#8b5cf6;margin-bottom:4px;">\u2600\ufe0f Tune</div>
        <p class="sans" style="font-size:9px;color:rgba(239,230,212,0.5);margin:0;">Consistency wins</p>
      </div>
      <div style="flex:1;border:1px solid rgba(94,23,235,.25);border-radius:6px;padding:12px 8px;text-align:center;background:linear-gradient(160deg, rgba(94,23,235,.05), transparent);">
        <div style="font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:{GOLD};margin-bottom:4px;">\U0001f525 Wahoo</div>
        <p class="sans" style="font-size:9px;color:rgba(239,230,212,0.5);margin:0;">Bravery wins</p>
      </div>
      <div style="flex:1;border:1px solid rgba(94,23,235,.25);border-radius:6px;padding:12px 8px;text-align:center;background:linear-gradient(160deg, rgba(94,23,235,.05), transparent);">
        <div style="font-family:'Outfit',sans-serif;font-size:14px;font-weight:700;color:#c4b5fd;margin-bottom:4px;">\U0001f49c Healing</div>
        <p class="sans" style="font-size:9px;color:rgba(239,230,212,0.5);margin:0;">Depth wins</p>
      </div>
    </div>
    <p class="flavour" style="font-size:14px;color:rgba(239,230,212,0.6);margin:16px 0 0;">Your healing becomes a sport.</p>
  </div>
  {swipe_arrow()}
  {progress_bar(6)}
</div>
"""


def slide_8_stakes():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{GOLD_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#efe6d4;">
    <h2 class="display" style="font-size:32px;line-height:.96;letter-spacing:.015em;margin:0 0 18px;color:#fff;">
      DID YOU COME INTO<br/>THIS LIFE TO BE<br/>A <span style="color:#8b5cf6;">ZOMBIE?</span>
    </h2>
    <p class="flavour" style="font-size:16px;line-height:1.35;color:rgba(239,230,212,0.8);margin:0;">
      Or to feel alive, express your essence,<br/>and make an impact?
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(7)}
</div>
"""


def slide_9_cta():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 50% 70%, rgba(94,23,235,.28), transparent 55%),radial-gradient(circle at 50% 10%, rgba(20,8,30,.6), transparent 40%),#08031a;overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 36px;color:#fff;text-align:center;">
    <h2 class="display" style="font-size:36px;line-height:.94;letter-spacing:.015em;margin:0 0 16px;">
      FIND YOUR<br/><span style="color:{GOLD};">ESSENCE VOICE.</span>
    </h2>
    <p class="sans" style="font-size:14px;color:rgba(239,230,212,0.7);margin:0 0 22px;">Download the app. Take the Essence Mirror. Start the practice.</p>
    <div style="display:inline-flex;align-items:center;gap:.8em;font-family:'Outfit',sans-serif;font-size:16px;font-weight:700;letter-spacing:.06em;color:#06030f;background:linear-gradient(135deg, {GOLD}, #f5c45a);padding:12px 28px;border-radius:4px;box-shadow:0 0 30px rgba(233,162,59,.3);">
      DOWNLOAD VIBE RISE
    </div>
    <p class="flavour" style="font-size:12px;color:rgba(239,230,212,0.4);margin:14px 0 0;">The game starts when you do.</p>
  </div>
  {progress_bar(8)}
</div>
"""


def main():
    slides = [
        slide_1_hook(),
        slide_2_viberise(),
        slide_3_enemy(),
        slide_4_essence(),
        slide_5_weapons(),
        slide_6_equation(),
        slide_7_league(),
        slide_8_stakes(),
        slide_9_cta(),
    ]
    num_slides = len(slides)
    track = "\n".join(slides)

    dots = "".join(
        f'<span style="width:6px;height:6px;border-radius:50%;background:{PRIMARY if i==0 else "rgba(183,173,153,0.3)"};"></span>'
        for i in range(num_slides)
    )

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vibe Rise — The Game (Carousel)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{margin:0;padding:48px 16px;background:#0a0614;font-family:'Outfit',sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh;}}
  .display{{font-family:'Outfit',sans-serif;font-weight:800;}}
  .sans{{font-family:'Outfit',sans-serif;}}
  .flavour{{font-family:'Outfit',sans-serif;font-weight:400;}}
  .ig-frame{{width:420px;background:#0a0614;border-radius:12px;box-shadow:0 12px 60px -12px rgba(0,0,0,0.5);overflow:hidden;border:1px solid rgba(94,23,235,0.15);}}
  .ig-header{{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(94,23,235,0.1);}}
  .ig-avatar{{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,{PRIMARY},{GOLD});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;}}
  .ig-handle{{font-size:13px;font-weight:600;color:#efe6d4;}}
  .ig-sub{{font-size:11px;color:rgba(239,230,212,0.4);}}
  .carousel-viewport{{width:420px;height:525px;overflow:hidden;cursor:grab;position:relative;}}
  .carousel-track{{display:flex;height:100%;transition:transform 320ms cubic-bezier(0.22,0.61,0.36,1);will-change:transform;}}
  .ig-dots{{display:flex;justify-content:center;gap:5px;padding:6px 0;}}
  .ig-actions{{display:flex;align-items:center;gap:14px;padding:10px 14px 4px;}}
  .ig-actions svg{{width:22px;height:22px;stroke:#efe6d4;fill:none;stroke-width:1.8;}}
  .hint{{margin-top:18px;font-size:12px;color:rgba(239,230,212,0.3);text-align:center;}}
</style>
</head><body>

<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar">V</div>
    <div><div class="ig-handle">_huzz</div><div class="ig-sub">Vibe Rise</div></div>
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
</div>

<p class="hint">Arrow keys or drag to swipe. {num_slides} slides.</p>

<script>
const track=document.getElementById('track'),dots=document.getElementById('dots').children,total={num_slides};
let idx=0,startX=0,dx=0,d=false;
function go(i){{idx=Math.max(0,Math.min(total-1,i));track.style.transform=`translateX(${{-idx*420}}px)`;Array.from(dots).forEach((d,k)=>d.style.background=k===idx?'{PRIMARY}':'rgba(183,173,153,0.3)')}}
const vp=track.parentElement;
vp.addEventListener('pointerdown',e=>{{d=true;startX=e.clientX;dx=0;vp.setPointerCapture(e.pointerId);track.style.transition='none'}});
vp.addEventListener('pointermove',e=>{{if(!d)return;dx=e.clientX-startX;track.style.transform=`translateX(${{-idx*420+dx}}px)`}});
function end(){{if(!d)return;d=false;track.style.transition='';if(dx<-50&&idx<total-1)idx++;else if(dx>50&&idx>0)idx--;go(idx)}}
vp.addEventListener('pointerup',end);vp.addEventListener('pointercancel',end);
document.addEventListener('keydown',e=>{{if(e.key==='ArrowRight')go(idx+1);if(e.key==='ArrowLeft')go(idx-1)}});
</script>
</body></html>"""

    OUTPUT.write_text(html, encoding="utf-8")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
