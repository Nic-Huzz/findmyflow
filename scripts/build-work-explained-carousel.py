"""
Carousel: My Work Explained
Personal story — kid → emotional splinter → healing = removing fear.
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = ROOT / "public" / "images" / "carousel" / "images"
OUTPUT = ROOT / "public" / "images" / "carousel" / "work-explained-draft.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
TOTAL_SLIDES = 6

PURPLE_BG = "background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);"


def img_uri(filename):
    path = IMAGES_DIR / filename
    if not path.exists():
        print(f"  WARNING: {path}")
        return ""
    mime = "image/jpeg" if path.suffix in (".jpg", ".jpeg") else "image/png"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"


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
    img = img_uri("work-explained-hero.jpg")
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;
    background-image:url('{img}');background-size:cover;background-position:center 30%;overflow:hidden;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.2) 40%,rgba(0,0,0,0.6) 70%,rgba(0,0,0,0.85) 100%);"></div>
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 60px;color:#fff;">
    <h1 class="serif" style="font-size:32px;font-weight:600;line-height:1.1;letter-spacing:-0.6px;margin:0;">
      My work <span style="color:{GOLD};">explained.</span>
    </h1>
  </div>
  {swipe_arrow()}
  {progress_bar(0)}
</div>
"""


def slide_2_kid():
    img = img_uri("work-explained-kid.jpg")
    overlay = (
        "background:linear-gradient(180deg,"
        "rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.15) 35%,"
        "rgba(0,0,0,0.55) 65%,rgba(0,0,0,0.85) 100%);"
    )
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;
    background-image:url('{img}');background-size:cover;background-position:center;background-color:#5e17eb;overflow:hidden;">
  <div style="position:absolute;inset:0;{overlay}"></div>
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 36px 60px;color:#fff;">
    <p class="sans" style="font-size:14px;line-height:1.6;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Take a moment to think about you as a kid. How playful you were. How full of love. How care-free.<br/><br/>
      <span style="color:{GOLD};font-weight:600;">Remember that?</span><br/><br/>
      I'm a big believer we're still those small people in grown-up bodies.<br/><br/>
      <span style="color:#fff;font-weight:600;">So where did they go?</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(1)}
</div>
"""


def slide_3_believe():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <p class="sans" style="font-size:13px;color:rgba(255,255,255,0.5);margin:0 0 12px;">I believe...</p>
    <p class="sans" style="font-size:14px;line-height:1.6;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Somewhere along the way, we had experiences that made being ourselves feel <span style="color:{GOLD};font-weight:600;">unsafe.</span><br/><br/>
      We live in a society riddled by fear of judgement, fear of failure and fear of not being good enough. As if it's normal to have these fears.<br/><br/>
      But I'm here to say that's bullsh*t.<br/><br/>
      I'm here to say that's what happens when we normalise trauma.<br/><br/>
      <span style="color:#fff;font-weight:600;">And I know this because I did it to myself for 12 years without realising.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(2)}
</div>
"""


def slide_4_rainbow():
    img = img_uri("work-explained-rainbow.jpg")
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;
    background-image:url('{img}');background-size:cover;background-position:center 20%;overflow:hidden;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.05) 0%,rgba(0,0,0,0.15) 30%,rgba(0,0,0,0.6) 60%,rgba(0,0,0,0.9) 100%);"></div>
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding:0 30px 60px;color:#fff;">
    <p class="sans" style="font-size:13px;line-height:1.6;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      At 14 I was a walking rainbow. Fluro pinks, blues, oranges, purples. You name it, I wore it.<br/><br/>
      But other teenage boys saw this and started teasing me. Calling me weird.<br/><br/>
      I just felt like I was expressing myself authentically so when they did this it hurt. But to cry would only lead to more teasing.<br/><br/>
      So I bottled it up, acted like I didn't care.<br/><br/>
      But I did. And it left me too scared to wear rainbow clothes again for the next <span style="color:{GOLD};font-weight:600;">TWELVE YEARS.</span><br/><br/>
      <span style="color:#fff;font-weight:600;">That's what I call an emotional splinter.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(3)}
</div>
"""


def slide_5_heartbreak():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <p class="sans" style="font-size:14px;line-height:1.6;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      It doesn't matter what these moments are. What matters is we HATE how we felt. The shame. The embarrassment. The fear. We never want to feel that way again.<br/><br/>
      For me, by my early 20s, this meant no more rainbow clothes. No more playfulness. No more dancing.<br/><br/>
      Basically all the things that anyone who knows me today knows are the things that <span style="color:{GOLD};font-weight:600;">light me up and make me, me.</span><br/><br/>
      This is what breaks my heart most about emotional splinters.<br/><br/>
      <span style="color:#fff;font-weight:600;">They leave us too scared to be ourselves.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(4)}
</div>
"""


def slide_6_healing():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 18px;">
      What is <span style="color:{GOLD};">healing?</span>
    </h2>
    <p class="sans" style="font-size:16px;line-height:1.6;margin:0;color:#fff;font-weight:600;max-width:340px;">
      Removing fear.
    </p>
    <p class="sans" style="font-size:14px;line-height:1.6;margin:16px 0 0;color:rgba(255,255,255,0.85);max-width:340px;">
      So you can show up in the world without any fear of judgement, failure or not being good enough.<br/><br/>
      <span style="color:{GOLD};font-weight:600;">Free to be that loving, playful, carefree version of you once again.</span>
    </p>
  </div>
  {progress_bar(5)}
</div>
"""


def main():
    slides = [
        slide_1_hook(),
        slide_2_kid(),
        slide_3_believe(),
        slide_4_rainbow(),
        slide_5_heartbreak(),
        slide_6_healing(),
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
<title>My Work Explained — Draft</title>
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
