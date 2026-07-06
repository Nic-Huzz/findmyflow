"""
Carousel: Scaling Your Experience Business Like The Best
Story-driven: 3 creators × 3 layers proving the same model.
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CREATORS_DIR = ROOT / "public" / "images" / "creators"
OUTPUT = ROOT / "public" / "images" / "carousel" / "experience-creator-draft.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
TOTAL_SLIDES = 7

PURPLE_BG = "background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);"


def img_uri(filepath):
    if not filepath.exists():
        print(f"  WARNING: {filepath}")
        return ""
    mime = "image/jpeg" if filepath.suffix in (".jpg", ".jpeg") else "image/png"
    return f"data:{mime};base64,{base64.b64encode(filepath.read_bytes()).decode('ascii')}"


def progress_bar(idx):
    pct = ((idx + 1) / TOTAL_SLIDES) * 100
    return (
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:16px 28px 20px;'
        'z-index:10;display:flex;align-items:center;gap:10px;">'
        '<div style="flex:1;height:3px;background:rgba(255,255,255,0.18);border-radius:2px;overflow:hidden;">'
        f'<div style="height:100%;width:{pct:.1f}%;background:#fff;border-radius:2px;"></div>'
        '</div>'
        f'<span style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:500;">{idx+1}/{TOTAL_SLIDES}</span>'
        '</div>'
    )


def swipe_arrow():
    return (
        '<div style="position:absolute;right:0;top:0;bottom:0;width:48px;z-index:9;'
        'display:flex;align-items:center;justify-content:center;'
        'background:linear-gradient(to right,transparent,rgba(255,255,255,0.10));">'
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">'
        '<path d="M9 6l6 6-6 6" stroke="rgba(255,255,255,0.55)" '
        'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
        '</svg></div>'
    )


def face_bubble(filename, size=56):
    img = img_uri(CREATORS_DIR / filename)
    if not img:
        return f'<div style="width:{size}px;height:{size}px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;"></div>'
    return f'<img src="{img}" style="width:{size}px;height:{size}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(255,255,255,0.2);">'


def layer_row(label, desc, color):
    return f'''
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.06);border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
      <div style="width:8px;height:8px;border-radius:50%;background:{color};flex-shrink:0;"></div>
      <div>
        <span class="sans" style="font-size:12px;font-weight:700;color:{color};">{label}</span>
        <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.6);margin-left:6px;">{desc}</span>
      </div>
    </div>
    '''


# ── Slides ── #

def slide_1_hook():
    faces = [
        ("wim-hof.png", "Wim Hof"),
        ("tony-robbins.png", "Tony Robbins"),
        ("bren-brown.png", "Brené Brown"),
        ("esther-perel.png", "Esther Perel"),
        ("gabor-mate.png", "Gabor Maté"),
    ]
    bubbles = ""
    for f, name in faces:
        bubbles += f'''
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
          {face_bubble(f, 60)}
          <span class="sans" style="font-size:8px;color:rgba(255,255,255,0.5);text-align:center;">{name}</span>
        </div>
        '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 36px;color:#fff;text-align:center;">
    <div style="margin-bottom:20px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Experience Creators</span>
    </div>
    <h1 class="serif" style="font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 28px;max-width:360px;">
      Scaling your experience business like the <span style="color:{GOLD};">best.</span>
    </h1>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
      {bubbles}
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(0)}
</div>
"""


def slide_2_pattern():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 20px;max-width:350px;">
      They all follow the same <span style="color:{GOLD};">3-layer model.</span>
    </h2>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px;">
      {layer_row("Attraction", "How people find you", GOLD)}
      {layer_row("Core Offer", "How you make money", "#fff")}
      {layer_row("Continuity", "How it compounds", "rgba(255,255,255,0.5)")}
    </div>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0;color:#fff;font-weight:600;">
      Here's how 3 different creators built theirs.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(1)}
</div>
"""


def creator_story(idx, filename, name, subtitle, attraction, core, continuity):
    face = face_bubble(filename, 72)
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 30px 52px;color:#fff;">
    <!-- Creator header -->
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">
      {face}
      <div>
        <span class="serif" style="font-size:22px;font-weight:600;color:#fff;display:block;">{name}</span>
        <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.5);">{subtitle}</span>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;gap:10px;flex:1;justify-content:center;">
      <!-- Attraction -->
      <div style="padding:14px 16px;background:rgba(233,162,59,0.08);border-radius:12px;border:1px solid rgba(233,162,59,0.2);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:8px;height:8px;border-radius:50%;background:{GOLD};flex-shrink:0;"></div>
          <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:{GOLD};text-transform:uppercase;">Attraction</span>
        </div>
        <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.85);margin:0;line-height:1.4;">{attraction}</p>
      </div>

      <!-- Core -->
      <div style="padding:14px 16px;background:rgba(255,255,255,0.06);border-radius:12px;border:1px solid rgba(255,255,255,0.12);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:8px;height:8px;border-radius:50%;background:#fff;flex-shrink:0;"></div>
          <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#fff;text-transform:uppercase;">Core Offer</span>
        </div>
        <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.85);margin:0;line-height:1.4;">{core}</p>
      </div>

      <!-- Continuity -->
      <div style="padding:14px 16px;background:rgba(255,255,255,0.03);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,0.5);flex-shrink:0;"></div>
          <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.5);text-transform:uppercase;">Continuity</span>
        </div>
        <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.85);margin:0;line-height:1.4;">{continuity}</p>
      </div>
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(idx)}
</div>
"""


def slide_3_brene():
    return creator_story(
        2,
        "bren-brown.png",
        "Brené Brown",
        "Research-first. Deep expertise attracted the audience.",
        "Years of deep research on vulnerability and shame. Published findings that resonated with millions.",
        "Daring Greatly workshops + corporate training. Companies pay $50K+ per session.",
        "Dare to Lead facilitator certification. 1000+ certified practitioners teach her method worldwide.",
    )


def slide_4_tony():
    return creator_story(
        3,
        "tony-robbins.png",
        "Tony Robbins",
        "Performance-first. Filled rooms, then built systems.",
        "Free seminars + infomercials in the 80s. Gave away the experience to build the audience.",
        "Unleash the Power Within. 10K+ people, $5K/ticket. The live event IS the business.",
        "Coaching programmes, apps, books, Robbins Research International. The empire runs without him in the room.",
    )


def slide_5_wim():
    return creator_story(
        4,
        "wim-hof.png",
        "Wim Hof",
        "Method-first. Proved it on himself, then taught others.",
        "World records + viral videos. Climbed Everest in shorts. The proof was the marketing.",
        "Wim Hof Method workshops + retreats. Live cold exposure training with certified instructors.",
        "Instructor certification programme. 1500+ certified instructors teaching his method in 50+ countries.",
    )


def slide_6_pattern():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 30px;color:#fff;">
    <h2 class="serif" style="font-size:24px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 20px;">
      3 different paths.<br/>Same <span style="color:{GOLD};">model.</span>
    </h2>

    <!-- Mini comparison -->
    <div style="display:flex;gap:8px;margin-bottom:10px;">
      <div style="flex:1;text-align:center;">
        {face_bubble("bren-brown.png", 40)}
        <span class="sans" style="font-size:8px;color:rgba(255,255,255,0.45);display:block;margin-top:4px;">Brené</span>
      </div>
      <div style="flex:1;text-align:center;">
        {face_bubble("tony-robbins.png", 40)}
        <span class="sans" style="font-size:8px;color:rgba(255,255,255,0.45);display:block;margin-top:4px;">Tony</span>
      </div>
      <div style="flex:1;text-align:center;">
        {face_bubble("wim-hof.png", 40)}
        <span class="sans" style="font-size:8px;color:rgba(255,255,255,0.45);display:block;margin-top:4px;">Wim</span>
      </div>
    </div>

    <!-- Layer comparison table -->
    <div style="display:flex;flex-direction:column;gap:6px;">
      <!-- Attraction row -->
      <div style="display:flex;gap:6px;align-items:stretch;">
        <div style="width:70px;display:flex;align-items:center;"><span class="sans" style="font-size:9px;font-weight:700;color:{GOLD};">ATTRACTION</span></div>
        <div style="flex:1;padding:8px;background:rgba(233,162,59,0.06);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">Deep research</span></div>
        <div style="flex:1;padding:8px;background:rgba(233,162,59,0.06);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">Free seminars</span></div>
        <div style="flex:1;padding:8px;background:rgba(233,162,59,0.06);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">World records</span></div>
      </div>
      <!-- Core row -->
      <div style="display:flex;gap:6px;align-items:stretch;">
        <div style="width:70px;display:flex;align-items:center;"><span class="sans" style="font-size:9px;font-weight:700;color:#fff;">CORE</span></div>
        <div style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">Workshops</span></div>
        <div style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">Live events</span></div>
        <div style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">Method training</span></div>
      </div>
      <!-- Continuity row -->
      <div style="display:flex;gap:6px;align-items:stretch;">
        <div style="width:70px;display:flex;align-items:center;"><span class="sans" style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.5);">CONTINUITY</span></div>
        <div style="flex:1;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">Certification</span></div>
        <div style="flex:1;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">Coaching empire</span></div>
        <div style="flex:1;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;"><span class="sans" style="font-size:9px;color:rgba(255,255,255,0.6);">1500+ instructors</span></div>
      </div>
    </div>

    <p class="sans" style="font-size:13px;line-height:1.5;margin:18px 0 0;color:#fff;font-weight:600;">
      Different entry points. Same destination.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(5)}
</div>
"""


def slide_7_cta():
    faces = ["bren-brown.png", "tony-robbins.png", "wim-hof.png", "esther-perel.png",
             "gabor-mate.png", "priya-parker.png", "marie-forleo.png", "ali-abdaal.png"]
    face_row = "".join(
        f'<div style="margin-left:{"-8px" if i > 0 else "0"};">{face_bubble(f, 36)}</div>'
        for i, f in enumerate(faces)
    )

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:16px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Find My Flow</span>
    </div>
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 14px;max-width:350px;">
      Which experience creator are <span style="color:{GOLD};">you?</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0 0 16px;color:rgba(255,255,255,0.85);max-width:340px;">
      Browse 59 creators across 6 archetypes. Pick who resonates. Get your personalised 3-layer model in 5 minutes.
    </p>
    <div style="display:flex;align-items:center;margin-bottom:20px;">
      {face_row}
      <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.4);margin-left:8px;">+51 more</span>
    </div>
    <div style="display:inline-flex;align-items:center;gap:8px;padding:11px 22px;background:{GOLD};color:#1A0033;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;border-radius:28px;align-self:flex-start;letter-spacing:0.3px;">
      Try it free \u2022 link in bio
    </div>
  </div>
  {progress_bar(6)}
</div>
"""


def main():
    slides = [
        slide_1_hook(),
        slide_2_pattern(),
        slide_3_brene(),
        slide_4_tony(),
        slide_5_wim(),
        slide_6_pattern(),
        slide_7_cta(),
    ]
    num_slides = len(slides)
    track = "\n".join(slides)

    dots = "".join(
        f'<span style="width:6px;height:6px;border-radius:50%;background:{PRIMARY if i==0 else "rgba(0,0,0,0.18)"};"></span>'
        for i in range(num_slides)
    )

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Experience Creator Matching — Draft v2</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{{box-sizing:border-box}}
  body{{margin:0;padding:48px 16px;background:#f3f0ec;font-family:'Outfit',sans-serif;display:flex;flex-direction:column;align-items:center;min-height:100vh;}}
  .serif{{font-family:'Fraunces','Georgia',serif;}}
  .sans{{font-family:'Outfit','Inter',sans-serif;}}
  .ig-frame{{width:420px;background:#fff;border-radius:12px;box-shadow:0 12px 60px -12px rgba(0,0,0,0.18);overflow:hidden;border:1px solid #e9e6e1;}}
  .ig-header{{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #f1efeb;}}
  .ig-avatar{{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,{PRIMARY},{GOLD});display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;}}
  .ig-handle{{font-size:13px;font-weight:600;color:#262626;}}
  .ig-sub{{font-size:11px;color:#8a8580;}}
  .carousel-viewport{{width:420px;height:525px;overflow:hidden;cursor:grab;position:relative;}}
  .carousel-track{{display:flex;height:100%;transition:transform 320ms cubic-bezier(0.22,0.61,0.36,1);will-change:transform;}}
  .ig-dots{{display:flex;justify-content:center;gap:5px;padding:6px 0;}}
  .ig-actions{{display:flex;align-items:center;gap:14px;padding:10px 14px 4px;}}
  .ig-actions svg{{width:22px;height:22px;stroke:#262626;fill:none;stroke-width:1.8;}}
  .hint{{margin-top:18px;font-size:12px;color:#8a8580;text-align:center;}}
</style>
</head><body>

<div class="ig-frame">
  <div class="ig-header">
    <div class="ig-avatar">F</div>
    <div><div class="ig-handle">_huzz</div><div class="ig-sub">Get Paid To Have Fun</div></div>
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
function go(i){{idx=Math.max(0,Math.min(total-1,i));track.style.transform=`translateX(${{-idx*420}}px)`;Array.from(dots).forEach((d,k)=>d.style.background=k===idx?'{PRIMARY}':'rgba(0,0,0,0.18)')}}
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
