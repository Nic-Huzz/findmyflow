"""
Carousel: Zone Calibration (v2 — corridor metaphor)
Copy from drafts/carousel-zone-calibration.md
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "images" / "carousel" / "zone-calibration-draft.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
TOTAL_SLIDES = 10

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
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <h1 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 18px;max-width:360px;">
      Your nervous system has decided how far you're allowed to go in every area of your <span style="color:{GOLD};">life.</span>
    </h1>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0;color:#fff;font-weight:600;">
      And you don't even know it's happening.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(0)}
</div>
"""


def slide_2_setup():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Here's what I mean</span>
    </div>
    <p class="sans" style="font-size:14px;line-height:1.6;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Think about your career. Your relationships. Your creativity. Your confidence.<br/><br/>
      In each one, there's a range you operate in. A ceiling you don't go above. A floor you don't drop below.<br/><br/>
      You probably call it <span style="color:{GOLD};font-weight:600;">"just who I am."</span><br/><br/>
      <span style="color:#fff;font-weight:600;">It's not who you are. It's where your nervous system feels safe.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(1)}
</div>
"""


def slide_3_thesis():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;max-width:350px;">
      Your nervous system is a <span style="color:{GOLD};">safety system.</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.6;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Its job is to keep you alive. Not to keep you fulfilled.<br/><br/>
      So when you were young and something hurt, your body learned a rule:<br/><br/>
      <span style="color:{GOLD};font-weight:600;">"Don't go there again."</span><br/><br/>
      That rule became a corridor. Two walls. A narrow strip of behaviour your nervous system lets you operate in.<br/><br/>
      <span style="color:#fff;font-weight:600;">And it runs that corridor for DECADES without you questioning it.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(2)}
</div>
"""


def slide_4_corridor():
    """Visual: corridor with two walls and sweet spot."""
    corridor = f'''
    <svg viewBox="0 0 420 300" style="width:100%;margin:0 auto;">
      <!-- Left wall -->
      <rect x="30" y="20" width="110" height="260" rx="8" fill="rgba(231,76,60,0.1)" stroke="rgba(231,76,60,0.3)" stroke-width="1.5"/>
      <text x="85" y="130" text-anchor="middle" fill="rgba(231,76,60,0.7)" font-family="Outfit,sans-serif" font-size="11" font-weight="700">TOO MUCH</text>
      <text x="85" y="150" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-family="Outfit,sans-serif" font-size="9">One failure</text>
      <text x="85" y="162" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-family="Outfit,sans-serif" font-size="9">mode</text>

      <!-- Sweet spot (center) -->
      <rect x="155" y="20" width="110" height="260" rx="8" fill="rgba(233,162,59,0.1)" stroke="{GOLD}" stroke-width="1.5" stroke-opacity="0.4"/>
      <text x="210" y="125" text-anchor="middle" fill="{GOLD}" font-family="Fraunces,Georgia,serif" font-size="14" font-weight="600">Sweet</text>
      <text x="210" y="145" text-anchor="middle" fill="{GOLD}" font-family="Fraunces,Georgia,serif" font-size="14" font-weight="600">Spot</text>
      <text x="210" y="168" text-anchor="middle" fill="rgba(233,162,59,0.5)" font-family="Outfit,sans-serif" font-size="9">Where growth</text>
      <text x="210" y="180" text-anchor="middle" fill="rgba(233,162,59,0.5)" font-family="Outfit,sans-serif" font-size="9">happens</text>

      <!-- Right wall -->
      <rect x="280" y="20" width="110" height="260" rx="8" fill="rgba(52,152,219,0.1)" stroke="rgba(52,152,219,0.3)" stroke-width="1.5"/>
      <text x="335" y="130" text-anchor="middle" fill="rgba(52,152,219,0.7)" font-family="Outfit,sans-serif" font-size="11" font-weight="700">TOO LITTLE</text>
      <text x="335" y="150" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-family="Outfit,sans-serif" font-size="9">Opposite failure</text>
      <text x="335" y="162" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-family="Outfit,sans-serif" font-size="9">mode</text>

      <!-- "You are here" pin on the left wall -->
      <circle cx="95" cy="210" r="8" fill="rgba(255,255,255,0.15)" stroke="#fff" stroke-width="1.5"/>
      <circle cx="95" cy="210" r="3" fill="#fff"/>
      <text x="95" y="240" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="Outfit,sans-serif" font-size="8" font-weight="600">YOU ARE HERE</text>

      <!-- Arrow from pin toward sweet spot -->
      <line x1="110" y1="210" x2="148" y2="210" stroke="rgba(255,255,255,0.2)" stroke-width="1" stroke-dasharray="3,3"/>
    </svg>
    '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 24px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">The Corridor</span>
    </div>
    <h2 class="serif" style="font-size:24px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;">
      Every domain of your life has <span style="color:{GOLD};">one.</span>
    </h2>
    {corridor}
    <p class="sans" style="font-size:12px;line-height:1.5;margin:12px 0 0;color:rgba(255,255,255,0.7);text-align:center;">
      Your nervous system picks a spot and holds you there.<br/>
      <span style="color:#fff;font-weight:600;">Not in the sweet spot. In the SAFE spot.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(3)}
</div>
"""


def example_slide(idx, tag, domain, left_name, left_desc, right_name, right_desc, sweet_desc):
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 24px 52px;color:#fff;">
    <div style="margin-bottom:10px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">{tag}</span>
    </div>
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;">
      Example: <span style="color:{GOLD};">{domain}</span>
    </h2>

    <!-- Left wall -->
    <div style="padding:12px 14px;background:rgba(231,76,60,0.08);border-radius:10px;border:1px solid rgba(231,76,60,0.2);margin-bottom:8px;">
      <span class="sans" style="font-size:11px;font-weight:700;color:rgba(231,76,60,0.8);display:block;margin-bottom:4px;">Left wall: {left_name}</span>
      <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;">{left_desc}</span>
    </div>

    <!-- Right wall -->
    <div style="padding:12px 14px;background:rgba(52,152,219,0.08);border-radius:10px;border:1px solid rgba(52,152,219,0.2);margin-bottom:8px;">
      <span class="sans" style="font-size:11px;font-weight:700;color:rgba(52,152,219,0.8);display:block;margin-bottom:4px;">Right wall: {right_name}</span>
      <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;">{right_desc}</span>
    </div>

    <!-- Sweet spot -->
    <div style="padding:12px 14px;background:rgba(233,162,59,0.08);border-radius:10px;border:1px solid rgba(233,162,59,0.25);">
      <span class="sans" style="font-size:11px;font-weight:700;color:{GOLD};display:block;margin-bottom:4px;">Sweet spot</span>
      <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.4;">{sweet_desc}</span>
    </div>

    <p class="sans" style="font-size:12px;line-height:1.4;margin:auto 0 0;color:#fff;font-weight:600;">
      Most people are pinned to one wall. Their nervous system won't let them near the other.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(idx)}
</div>
"""


def slide_5_identity():
    return example_slide(
        4, "Corridor 1", "Identity",
        "The Chameleon",
        "You become whoever the room needs. You shape-shift to belong. You've been doing it so long you don't know who you actually are.",
        "The Outcast",
        "You reject belonging entirely. You isolate. You tell yourself you don't need anyone.",
        "Authenticity AND belonging. Being yourself AND being welcomed for it.",
    )


def slide_6_vulnerability():
    return example_slide(
        5, "Corridor 2", "Vulnerability",
        "Over-sharing",
        "You bleed on people who didn't ask. You confuse intensity with intimacy. Every interaction is a therapy session.",
        "The Fortress",
        "Nothing gets in. Nobody sees the real you. You call it \"being private.\" Your nervous system calls it \"being safe.\"",
        "Sharing at the right depth, with the right people, at the right time.",
    )


def slide_7_protectors():
    protectors = [
        {"icon": "\U0001f47b", "name": "The Ghost", "desc": "hides to avoid being seen"},
        {"icon": "\U0001f9f1", "name": "The Controller", "desc": "grips to avoid losing control"},
        {"icon": "\U0001f3ad", "name": "The Performer", "desc": "achieves to avoid being worthless"},
        {"icon": "\U0001f3af", "name": "The Perfectionist", "desc": "prepares to avoid making mistakes"},
        {"icon": "\U0001f91d", "name": "The People Pleaser", "desc": "abandons self to avoid being abandoned"},
    ]
    cards = ""
    for p in protectors:
        cards += f'''
        <div style="display:flex;gap:10px;align-items:center;padding:10px 12px;background:rgba(255,255,255,0.06);border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:20px;flex-shrink:0;">{p["icon"]}</span>
          <div>
            <span class="sans" style="font-size:12px;font-weight:700;color:{GOLD};">{p["name"]}</span>
            <span class="sans" style="font-size:10px;color:rgba(255,255,255,0.55);margin-left:4px;">{p["desc"]}</span>
          </div>
        </div>
        '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 24px 52px;color:#fff;">
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 6px;">
      So what's keeping you pinned to the <span style="color:{GOLD};">wall?</span>
    </h2>
    <p class="sans" style="font-size:12px;color:rgba(255,255,255,0.6);margin:0 0 14px;line-height:1.4;">
      A protector. A pattern your nervous system built from an old experience.
    </p>
    <div style="display:flex;flex-direction:column;gap:7px;margin-bottom:14px;">
      {cards}
    </div>
    <p class="sans" style="font-size:12px;color:#fff;font-weight:600;margin:0;line-height:1.4;">
      These aren't flaws. They were brilliant survival strategies. But they've been running the show ever since.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(6)}
</div>
"""


def slide_8_domains():
    domains = [
        ("1", "Identity", "Who am I really?"),
        ("2", "Vulnerability", "Can I be honest about what I need?"),
        ("3", "Direction", "What do I build and who do I build it for?"),
        ("4", "Enough", "Do I have permission to move?"),
        ("5", "Growth", "What is my real edge?"),
        ("6", "Execution", "Can I sustain movement?"),
        ("7", "Passion", "What do I care about enough to risk?"),
        ("8", "Play", "Can I experience genuine play?"),
    ]
    rows = ""
    for num, name, question in domains:
        rows += f'''
        <div style="display:flex;gap:10px;align-items:baseline;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span class="serif" style="font-size:16px;font-weight:300;color:{GOLD};min-width:20px;">{num}</span>
          <span class="sans" style="font-size:12px;font-weight:700;color:#fff;min-width:80px;">{name}</span>
          <span class="sans" style="font-size:11px;color:rgba(255,255,255,0.5);flex:1;">{question}</span>
        </div>
        '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;padding:28px 24px 52px;color:#fff;">
    <h2 class="serif" style="font-size:22px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;">
      This plays out across <span style="color:{GOLD};">8 areas</span> of your life.
    </h2>
    <div style="display:flex;flex-direction:column;gap:2px;margin-bottom:14px;">
      {rows}
    </div>
    <p class="sans" style="font-size:11px;color:rgba(255,255,255,0.6);margin:0;line-height:1.5;">
      You might be in the sweet spot for Direction but pinned to the wall for Vulnerability.<br/><br/>
      <span style="color:#fff;font-weight:600;">That's normal. The work is one corridor at a time.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(7)}
</div>
"""


def slide_9_shift():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;max-width:350px;">
      The goal isn't to destroy the <span style="color:{GOLD};">protector.</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.6;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      It kept you safe when you needed it.<br/><br/>
      The goal is to update it. To show your nervous system that the danger it's protecting you from doesn't exist anymore.<br/><br/>
      That's not a thinking exercise. It's a body exercise.<br/><br/>
      <span style="color:#fff;font-weight:600;">Because the safety zone was installed in your body. Not your mind.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(8)}
</div>
"""


def slide_10_cta():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:16px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Find My Flow</span>
    </div>
    <h2 class="serif" style="font-size:24px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 14px;max-width:350px;">
      Want to find out which corridors your nervous system has you <span style="color:{GOLD};">pinned in?</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0 0 22px;color:rgba(255,255,255,0.85);max-width:340px;">
      Find My Flow maps your zones across all 8 domains and shows you exactly which protector is running the show.
    </p>
    <div style="display:inline-flex;align-items:center;gap:8px;padding:11px 22px;background:{GOLD};color:#1A0033;font-family:'Outfit',sans-serif;font-weight:700;font-size:13px;border-radius:28px;align-self:flex-start;letter-spacing:0.3px;">
      Try it free \u2022 link in bio
    </div>
  </div>
  {progress_bar(9)}
</div>
"""


def main():
    slides = [
        slide_1_hook(),
        slide_2_setup(),
        slide_3_thesis(),
        slide_4_corridor(),
        slide_5_identity(),
        slide_6_vulnerability(),
        slide_7_protectors(),
        slide_8_domains(),
        slide_9_shift(),
        slide_10_cta(),
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
<title>Zone Calibration — Draft v2</title>
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
