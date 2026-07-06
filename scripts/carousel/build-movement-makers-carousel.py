"""
Carousel: Movement Makers landing page
Product/sales carousel for the cohort offering.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "images" / "carousel" / "movement-makers-draft.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
TOTAL_SLIDES = 7

PURPLE_BG = "background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);"


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


def slide_1_hook():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 36px;color:#fff;text-align:center;">
    <h1 class="serif" style="font-size:38px;font-weight:600;line-height:1.1;letter-spacing:-0.8px;margin:0 0 20px;">
      Get Paid To<br/><span style="color:{GOLD};">Have Fun.</span>
    </h1>
    <p class="sans" style="font-size:14px;color:rgba(255,255,255,0.7);margin:0 0 20px;max-width:320px;">
      For experience creators keen to fund their life from work that lights them up.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(0)}
</div>
"""


def face_bubble(filename, size=56):
    import base64
    CREATORS_DIR = ROOT / "public" / "images" / "creators"
    path = CREATORS_DIR / filename
    if not path.exists():
        return f'<div style="width:{size}px;height:{size}px;border-radius:50%;background:rgba(255,255,255,0.1);flex-shrink:0;"></div>'
    img = f"data:image/png;base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"
    return f'<img src="{img}" style="width:{size}px;height:{size}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid rgba(255,255,255,0.2);">'


def slide_2_inspires():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <h2 class="serif" style="font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 12px;">
      Who <span style="color:{GOLD};">inspires</span> you?
    </h2>
    <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.6);margin:0 0 22px;max-width:320px;">
      Scroll through real people who built careers from experiences. Pick 3-5 who inspire you.
    </p>
    <div style="display:flex;gap:16px;justify-content:center;">
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        {face_bubble("bren-brown.png", 64)}
        <span class="sans" style="font-size:9px;color:rgba(255,255,255,0.5);">Brené Brown</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        {face_bubble("wim-hof.png", 64)}
        <span class="sans" style="font-size:9px;color:rgba(255,255,255,0.5);">Wim Hof</span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
        {face_bubble("tony-robbins.png", 64)}
        <span class="sans" style="font-size:9px;color:rgba(255,255,255,0.5);">Tony Robbins</span>
      </div>
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(1)}
</div>
"""


def slide_3_transformation():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 24px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">The Transformation</span>
    </div>

    <div style="padding:14px 16px;background:rgba(255,255,255,0.04);border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;">
      <span class="sans" style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);display:block;margin-bottom:8px;">WHERE YOU ARE</span>
      <p class="sans" style="font-size:12px;line-height:1.5;margin:0;color:rgba(255,255,255,0.6);">
        Running experiences from intuition.<br/>
        Filling rooms through hustle.<br/>
        Each event starts from scratch.<br/>
        No system. No data. No compound.
      </p>
    </div>

    <div style="text-align:center;font-size:18px;color:rgba(255,255,255,0.3);margin:4px 0;">\u2193</div>

    <div style="padding:14px 16px;background:rgba(233,162,59,0.08);border-radius:12px;border:1px solid rgba(233,162,59,0.2);">
      <span class="sans" style="font-size:10px;font-weight:700;color:{GOLD};display:block;margin-bottom:8px;">WHERE YOU'RE GOING</span>
      <p class="sans" style="font-size:12px;line-height:1.5;margin:0;color:rgba(255,255,255,0.85);">
        A system behind every experience.<br/>
        Rooms that fill because of the last one.<br/>
        Data that proves you're growing.<br/>
        <span style="color:#fff;font-weight:600;">A business that feels like play.</span>
      </p>
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(2)}
</div>
"""


def slide_4_system():
    phases = [
        ("\U0001f9ed", "Your Play Profile", "Create your system for success"),
        ("\u26a1", "The Room-Filling System", "Fill the room. The parts you resist, handled"),
        ("\U0001f3aa", "Deliver", "Walk in ready. Focus on the magic"),
        ("\U0001f504", "Post-Event", "Close the loop. Compound forward"),
    ]
    cards = ""
    for icon, name, desc in phases:
        cards += f'''
        <div style="display:flex;gap:12px;align-items:center;padding:12px;background:rgba(255,255,255,0.06);border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:22px;flex-shrink:0;">{icon}</span>
          <div>
            <span class="sans" style="font-size:13px;font-weight:700;color:{GOLD};">{name}</span>
            <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.55);display:block;margin-top:2px;">{desc}</span>
          </div>
        </div>
        '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 24px;color:#fff;">
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;">
      Every phase of running an experience, <span style="color:{GOLD};">handled.</span>
    </h2>
    <div style="display:flex;flex-direction:column;gap:8px;">
      {cards}
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(3)}
</div>
"""


def slide_5_story():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 30px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">The Story</span>
    </div>
    <div style="padding:18px;background:rgba(255,255,255,0.06);border-radius:14px;border:1px solid rgba(255,255,255,0.1);">
      <p class="serif" style="font-size:14px;line-height:1.5;margin:0;color:rgba(255,255,255,0.85);font-style:italic;">
        "Running events for $30 tickets is brutal. With 30 sales you don't even make $1,000.<br/><br/>
        After 200+ experiences I figured out the system. Now my events do 100+ people and can fund life.<br/><br/>
        Movement Makers is everything I learned, built into an app so you don't have to learn it the hard way."
      </p>
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(4)}
</div>
"""


def slide_6_proof():
    stats = [
        ("200+", "Experiences", "Every week, rain or shine"),
        ("3+", "Years in Bali", "5 venues across the island"),
        ("100+", "Person festivals", "Healing But Fun at Istana"),
        ("4", "Experience types", "Breathwork, dance, workshops, retreats"),
    ]
    cards = ""
    for num, label, detail in stats:
        cards += f'''
        <div style="flex:1;text-align:center;padding:12px 8px;background:rgba(255,255,255,0.04);border-radius:10px;">
          <div class="serif" style="font-size:24px;font-weight:600;color:{GOLD};">{num}</div>
          <div class="sans" style="font-size:10px;font-weight:700;color:#fff;margin:4px 0 2px;">{label}</div>
          <div class="sans" style="font-size:8px;color:rgba(255,255,255,0.4);">{detail}</div>
        </div>
        '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 24px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">The Proof</span>
    </div>
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 18px;">
      Built from real experience, not <span style="color:{GOLD};">theory.</span>
    </h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      {cards}
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(5)}
</div>
"""


def slide_7_pricing():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 30px;color:#fff;text-align:center;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Founding Membership</span>
    </div>
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.15;margin:0 0 6px;">
      Movement Makers
    </h2>
    <p class="sans" style="font-size:12px;color:rgba(255,255,255,0.5);margin:0 0 18px;">10 experience creators per monthly cohort</p>
    <div class="serif" style="font-size:48px;font-weight:600;color:{GOLD};margin:0 0 6px;">
      $100<span style="font-size:18px;color:rgba(233,162,59,0.6);">/month</span>
    </div>
    <p class="sans" style="font-size:12px;color:rgba(255,255,255,0.4);margin:0 0 20px;">Total value: <s>$1,276/month</s></p>
    <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.7);margin:0 0 16px;max-width:300px;">
      Fill 3 extra seats at your next experience and it's paid for itself.
    </p>
    <div style="display:flex;flex-direction:column;gap:6px;width:100%;max-width:300px;">
      <div style="display:flex;gap:8px;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);">
        <span style="color:#2ecc71;">&#10003;</span> First month fully refundable
      </div>
      <div style="display:flex;gap:8px;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);">
        <span style="color:#2ecc71;">&#10003;</span> Cancel anytime. No lock-in.
      </div>
      <div style="display:flex;gap:8px;align-items:center;font-size:11px;color:rgba(255,255,255,0.6);">
        <span style="color:#2ecc71;">&#10003;</span> If attendance doesn't grow, next month free
      </div>
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(6)}
</div>
"""


def slide_8_cta():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:0 36px;color:#fff;text-align:center;">
    <h2 class="serif" style="font-size:30px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 14px;">
      Ready to get paid to<br/><span style="color:{GOLD};">have fun?</span>
    </h2>
    <div style="display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:{GOLD};color:#1A0033;font-family:'Outfit',sans-serif;font-weight:700;font-size:14px;border-radius:28px;letter-spacing:0.3px;">
      Keen to learn more about Movement&nbsp;Makers?
    </div>
    <p class="sans" style="font-size:11px;color:rgba(255,255,255,0.4);margin:14px 0 0;">
      DM me or link in bio
    </p>
  </div>
  {progress_bar(6)}
</div>
"""


def main():
    slides = [
        slide_1_hook(),
        slide_2_inspires(),
        slide_3_transformation(),
        slide_4_system(),
        slide_5_story(),
        slide_6_proof(),
        slide_8_cta(),
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
<title>Movement Makers — Draft</title>
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
