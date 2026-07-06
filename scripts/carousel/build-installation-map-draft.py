"""
Draft all slides for the Installation Map carousel.
Slide 1: Hook
Slides 2-5: Wound stages (Option B — vertical stacked cards)
Slide 6: Nervous system diagram
Slide 7: TBD (protective voices)
"""
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CAROUSEL_IMAGES = ROOT / "public" / "images" / "carousel" / "images"
ONBOARDING_IMAGES = ROOT / "public" / "images" / "onboarding"
OUTPUT = ROOT / "public" / "images" / "carousel" / "installation-map-draft.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
TOTAL_SLIDES = 8  # hook + 4 wound stages + intro + voices + CTA


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


def slide_1_hook():
    """Text over Pixar image. Placeholder dark bg until image is generated."""
    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);
    overflow:hidden;
">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:16px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">The Installation Map</span>
    </div>
    <h1 class="serif" style="font-size:30px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 16px;max-width:350px;">
      You didn't wake up today and decide to have
      <span style="color:{GOLD};">limiting beliefs.</span>
    </h1>
    <p class="sans" style="font-size:15px;line-height:1.5;margin:0;color:rgba(255,255,255,0.88);max-width:340px;">
      Something in the past created them <span style="color:{GOLD};">\u2192</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(0)}
</div>
"""


def slide_triptych(idx, tag, headline, scenes, subtitle=None):
    """Option B: vertical stacked cards — image left, text right. Brand purple bg."""
    cards = []
    for scene in scenes:
        img = img_uri(ONBOARDING_IMAGES / scene["image"])
        cards.append(f'''
        <div style="flex:1;display:flex;gap:10px;align-items:center;border-radius:10px;overflow:hidden;background:rgba(255,255,255,0.06);min-height:0;">
          <div style="width:110px;height:100%;flex-shrink:0;overflow:hidden;">
            <img src="{img}" style="width:100%;height:100%;object-fit:cover;object-position:{scene.get("focal", "50% 35%")};">
          </div>
          <div style="padding:6px 10px 6px 0;flex:1;min-width:0;">
            <span style="font-size:11px;font-weight:700;color:{scene["color"]};">{scene["icon"]} {scene["name"]}</span>
            <p style="font-size:10px;color:rgba(255,255,255,0.6);margin:3px 0 0;line-height:1.3;">{scene["desc"]}</p>
          </div>
        </div>
        ''')

    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);
    overflow:hidden;
">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 24px 52px;">
    <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;margin-bottom:10px;">{tag}</span>
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.1;margin:0 0 {'6px' if subtitle else '14px'};letter-spacing:-0.4px;color:#fff;">
      {headline}
    </h2>
    {"" if not subtitle else f'<p class="sans" style="font-size:11px;color:rgba(255,255,255,0.5);margin:0 0 12px;line-height:1.3;">{subtitle}</p>'}
    <div style="display:flex;flex-direction:column;gap:8px;flex:1;min-height:0;">
      {"".join(cards)}
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(idx)}
</div>
"""


def slide_2_arrive():
    return slide_triptych(1,
        "When you were a kid...",
        f'You needed two things:<br/>to be <span style="color:{GOLD};">seen</span> and to be <span style="color:{GOLD};">safe.</span>',
        [
            {"image": "stage1-overwhelmed.png", "focal": "50% 35%", "icon": "\U0001f30a", "name": "The Overwhelmed Child",
             "desc": "Seen but never settled. Chaotic but present caregiver.", "color": "#E9A23B"},
            {"image": "stage1-secure.png", "focal": "55% 30%", "icon": "\U0001f3e0", "name": "Secure Base",
             "desc": "Attuned and safe. Could explore and be met.", "color": "#2ecc71"},
            {"image": "stage1-invisible.png", "focal": "50% 35%", "icon": "\U0001f47b", "name": "The Invisible Child",
             "desc": "Physically safe but unseen. Needs met, self not witnessed.", "color": "#3498db"},
        ],
        subtitle="Which experience did you have?"
    )


def slide_3_expression():
    return slide_triptych(2,
        "As you got older...",
        f'You expressed yourself. The world <span style="color:{GOLD};">responded.</span>',
        [
            {"image": "stage2-rejected.png", "focal": "60% 25%", "icon": "\U0001f494", "name": "The Rejected Self",
             "desc": "Full expression, love withdrawn. Being yourself costs connection.", "color": "#E9A23B"},
            {"image": "stage2-belonging.png", "focal": "40% 25%", "icon": "\U0001f49b", "name": "Unconditional Belonging",
             "desc": "Authentic expression met with love. No editing required.", "color": "#2ecc71"},
            {"image": "stage2-adapted.png", "focal": "55% 25%", "icon": "\U0001f3ad", "name": "The Adapted Self",
             "desc": "Love present but only for the edited version.", "color": "#3498db"},
        ],
        subtitle="Which experience did you have?"
    )


def slide_4_school():
    return slide_triptych(3,
        "At School...",
        f'The system rewarded compliance. Your <span style="color:{GOLD};">essence</span> paid the price.',
        [
            {"image": "stage3-rebel.png", "focal": "75% 25%", "icon": "\U0001f525", "name": "The Rebel",
             "desc": "Fights back. Authentic self survives at social cost.", "color": "#E9A23B"},
            {"image": "stage3-grounded.png", "focal": "45% 25%", "icon": "\U0001f33f", "name": "The Grounded Student",
             "desc": "Navigates without disappearing. Rare.", "color": "#2ecc71"},
            {"image": "stage3-good-student.png", "focal": "40% 35%", "icon": "\U0001f4da", "name": "The Good Student",
             "desc": "Conforms completely, gets praised, loses themselves gradually.", "color": "#3498db"},
        ],
        subtitle="Which experience did you have?"
    )


def slide_5_friends():
    return slide_triptych(4,
        "With Friends...",
        f'You learned which version of you was <span style="color:{GOLD};">welcome.</span>',
        [
            {"image": "stage3_5-chameleon.png", "focal": "50% 30%", "icon": "\U0001f98e", "name": "The Chameleon",
             "desc": "High belonging, low authentic self. Popular but lost.", "color": "#E9A23B"},
            {"image": "stage3_5-tribe.png", "focal": "50% 30%", "icon": "\U0001f91d", "name": "Found Their Tribe",
             "desc": "Belonging and authentic self move together.", "color": "#2ecc71"},
            {"image": "stage3_5-withdrawn.png", "focal": "40% 30%", "icon": "\U0001f3d4\ufe0f", "name": "The Withdrawn",
             "desc": "Authentic but isolated. Retreated entirely.", "color": "#3498db"},
        ],
        subtitle="Which experience did you have?"
    )


def slide_6_intro():
    """Transition slide: headline + subtitle introducing the four voices."""
    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);
    overflow:hidden;
">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <h2 class="serif" style="font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 16px;max-width:350px;">
      How you were treated then taught you how to <span style="color:{GOLD};">protect yourself</span> now.
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.5;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      There are four protective voices that create our limiting beliefs:
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(5)}
</div>
"""


def slide_7_voices():
    """Four protective voice cards grouped by nervous system zone."""
    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);
    overflow:hidden;
">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 24px 52px;">
    <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;margin-bottom:16px;">Protective Voices</span>

    <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:8px;">Seen but not safe</span>
    <div style="display:flex;gap:10px;flex:1;min-height:0;margin-bottom:14px;">
      {_voice_card(chr(0x1f9f1), "Controller", "Leaving it to chance isn't an option.", "#E9A23B", "rgba(233,162,59,0.08)")}
      {_voice_card(chr(0x1f47b), "Ghost", "I don't feel comfortable sharing.", "#E9A23B", "rgba(233,162,59,0.08)")}
    </div>

    <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:8px;">"Safe" but not seen</span>
    <div style="display:flex;gap:10px;flex:1;min-height:0;margin-bottom:14px;">
      {_voice_card(chr(0x1f3af), "Perfectionist", "I'm not ready yet.", "#3498db", "rgba(52,152,219,0.08)")}
      {_voice_card(chr(0x1f6cc), "Auto-Pilot", "I'm fine, just tired.", "#3498db", "rgba(52,152,219,0.08)")}
    </div>

    <h2 class="serif" style="font-size:18px;font-weight:600;line-height:1.2;letter-spacing:-0.3px;margin:0;color:#fff;">
      These voices were designed to keep you safe but have kept you <span style="color:{GOLD};">stuck.</span>
    </h2>
  </div>
  {swipe_arrow()}
  {progress_bar(6)}
</div>
"""


def _voice_card(icon, name, quote, color, bg):
    return f'''<div style="flex:1;display:flex;gap:10px;align-items:center;border-radius:10px;background:{bg};border:1px solid rgba(255,255,255,0.08);padding:10px 12px;min-height:0;">
      <span style="font-size:24px;flex-shrink:0;">{icon}</span>
      <div style="flex:1;min-width:0;">
        <span style="font-size:12px;font-weight:700;color:{color};display:block;margin-bottom:1px;">The {name}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.65);font-style:italic;line-height:1.3;">"{quote}"</span>
      </div>
    </div>'''


def slide_7_voices():
    """Four protective voices grouped into two horizontal pairs by nervous system zone."""
    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);
    overflow:hidden;
">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 24px 52px;">
    <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;margin-bottom:10px;">The Protective Voices</span>
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.15;margin:0 0 6px;letter-spacing:-0.4px;color:#fff;">
      These voices were designed to keep you safe but have kept you <span style="color:{GOLD};">stuck.</span>
    </h2>
    <span class="sans" style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:10px;">Seen but not safe</span>
    <div style="display:flex;gap:10px;flex:1;min-height:0;">
      {_voice_card(chr(0x1f9f1), "Controller", "Leaving it to chance isn't an option.", "#E9A23B", "rgba(233,162,59,0.08)")}
      {_voice_card(chr(0x1f47b), "Ghost", "I don't feel comfortable sharing.", "#E9A23B", "rgba(233,162,59,0.08)")}
    </div>

    <div style="height:14px;"></div>

    <span class="sans" style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:10px;">"Safe" but not seen</span>
    <div style="display:flex;gap:10px;flex:1;min-height:0;">
      {_voice_card(chr(0x1f3af), "Perfectionist", "I'm not ready yet.", "#3498db", "rgba(52,152,219,0.08)")}
      {_voice_card(chr(0x1f6cc), "Auto-Pilot", "I'm fine, just tired.", "#3498db", "rgba(52,152,219,0.08)")}
    </div>

  </div>
  {swipe_arrow()}
  {progress_bar(6)}
</div>
"""


def slide_8_cta():
    """CTA slide — reframe + call to action."""
    return f"""
<div class="slide" style="
    position:relative;width:420px;height:525px;flex-shrink:0;
    background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);
    overflow:hidden;
">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:16px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Find My Flow</span>
    </div>
    <h2 class="serif" style="font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 14px;max-width:350px;">
      Ready to quieten your <span style="color:{GOLD};">protective voice?</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0 0 8px;color:rgba(255,255,255,0.85);max-width:340px;">
      Your protective voice isn't who you are. It's a bodyguard that doesn't know the war is over.
    </p>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0 0 22px;color:#fff;font-weight:600;max-width:340px;">
      The essence is still underneath. Buried, not broken.
    </p>
    <div style="display:inline-flex;align-items:center;gap:8px;padding:11px 22px;background:{GOLD};color:#1A0033;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;border-radius:28px;align-self:flex-start;letter-spacing:0.3px;">
      Learn how in the Find My Flow Game \u2022 link in bio
    </div>
  </div>
  {progress_bar(7)}
</div>
"""


def main():
    slides = [
        slide_1_hook(),
        slide_2_arrive(),
        slide_3_expression(),
        slide_4_school(),
        slide_5_friends(),
        slide_6_intro(),
        slide_7_voices(),
        slide_8_cta(),
    ]
    num_slides = len(slides)
    track = "\n".join(slides)

    dots = "".join(
        f'<span style="width:6px;height:6px;border-radius:50%;background:{"#5e17eb" if i==0 else "rgba(0,0,0,0.18)"};"></span>'
        for i in range(num_slides)
    )

    html = f"""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Installation Map — Draft (6 slides)</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
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
