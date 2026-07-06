"""
Carousel 3: Flow Finder (Career Clarity Framework)
Brand purple bg, text-heavy slides, same style as Installation Map.
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "images" / "carousel" / "flow-finder-draft.html"

PRIMARY = "#5e17eb"
GOLD = "#E9A23B"
TOTAL_SLIDES = 8


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


PURPLE_BG = "background:radial-gradient(ellipse at 40% 30%, #7b3ff2 0%, #5e17eb 40%, #3a0d99 100%);"


def slide_1_hook():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:16px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Best Career Clarity Framework</span>
    </div>
    <h1 class="serif" style="font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 16px;max-width:360px;">
      You've been collecting dots your whole life.<br/><br/>Nobody taught you how to <span style="color:{GOLD};">connect them.</span>
    </h1>
  </div>
  {swipe_arrow()}
  {progress_bar(0)}
</div>
"""


def slide_2_quote():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="padding:20px;background:rgba(255,255,255,0.06);border-radius:14px;border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;">
      <p class="serif" style="font-size:16px;line-height:1.45;margin:0 0 12px;color:rgba(255,255,255,0.88);font-style:italic;">
        "You can't connect the dots looking forward; you can only connect them looking backwards.<br/><br/>So you have to trust that the dots will somehow connect in your future."
      </p>
      <span class="sans" style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.5);">Steve Jobs, Stanford Commencement 2005</span>
    </div>
    <p class="sans" style="font-size:15px;line-height:1.5;margin:0;color:#fff;font-weight:600;max-width:340px;">
      Here's how to connect them for <span style="color:{GOLD};">career clarity.</span>
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(1)}
</div>
"""


def slide_3_collect():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Step 1: Collect</span>
    </div>
    <h2 class="serif" style="font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 16px;max-width:350px;">
      Every experience in your life is a <span style="color:{GOLD};">dot.</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0;color:rgba(255,255,255,0.85);max-width:340px;">
      Every job. Every hobby. Every conversation that lit you up. Every problem that kept you awake. Every person you wanted to help.
    </p>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:14px 0 0;color:#fff;font-weight:600;max-width:340px;">
      You already have hundreds of dots. But we're never taught how to organise them.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(2)}
</div>
"""


def slide_4_insight():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">The Insight</span>
    </div>
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 16px;max-width:350px;">
      What does a fulfilling career actually <span style="color:{GOLD};">look like?</span>
    </h2>
    <div style="padding:20px;background:rgba(255,255,255,0.06);border-radius:14px;border:1px solid rgba(255,255,255,0.1);margin-bottom:16px;">
      <p class="sans" style="font-size:15px;line-height:1.5;margin:0;color:#fff;font-weight:600;">
        Solving a <span style="color:{GOLD};">problem</span> you care about,<br/>
        for <span style="color:{GOLD};">people</span> you want to help,<br/>
        using <span style="color:{GOLD};">skills</span> you love.
      </p>
    </div>
    <p class="sans" style="font-size:13px;line-height:1.5;margin:0;color:rgba(255,255,255,0.6);max-width:340px;">
      This is also how a business is structured.<br/><br/>Businesses are paid to:<br/>\u2022 Solve a problem<br/>\u2022 For a person<br/>\u2022 Using a set of skills
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(3)}
</div>
"""


def slide_5_connect():
    dots = [
        {"icon": "\U0001f3af", "label": "Skills", "desc": "what you love to do"},
        {"icon": "\u2764\ufe0f", "label": "Problems", "desc": "experiences you don't want others to have"},
        {"icon": "\U0001f465", "label": "People", "desc": "who you want to help"},
    ]
    cards = ""
    for d in dots:
        cards += f'''
        <div style="display:flex;gap:14px;align-items:center;padding:16px;background:rgba(255,255,255,0.06);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:26px;flex-shrink:0;">{d["icon"]}</span>
          <div>
            <span class="sans" style="font-size:14px;font-weight:700;color:{GOLD};display:block;margin-bottom:2px;">{d["label"]}</span>
            <span class="sans" style="font-size:12px;color:rgba(255,255,255,0.6);">{d["desc"]}</span>
          </div>
        </div>
        '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Step 2: Connect</span>
    </div>
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 20px;max-width:350px;">
      Organise your dots into three <span style="color:{GOLD};">categories.</span>
    </h2>
    <div style="display:flex;flex-direction:column;gap:10px;">
      {cards}
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(4)}
</div>
"""


def slide_6_diagram():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Step 2: Connect</span>
    </div>
    <h2 class="serif" style="font-size:26px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 18px;max-width:350px;">
      Then, connect them.
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0 0 20px;color:rgba(255,255,255,0.8);max-width:340px;">
      What does a fulfilling career look like?
    </p>
    <div style="padding:20px;background:rgba(255,255,255,0.06);border-radius:14px;border:1px solid rgba(255,255,255,0.1);">
      <p class="sans" style="font-size:15px;line-height:1.5;margin:0;color:#fff;font-weight:600;">
        Solving a <span style="color:{GOLD};">problem</span> you care about,
        for <span style="color:{GOLD};">people</span> you want to help,
        using <span style="color:{GOLD};">skills</span> you love.
      </p>
    </div>
    <p class="sans" style="font-size:13px;line-height:1.5;margin:16px 0 0;color:rgba(255,255,255,0.5);max-width:340px;">
      That's the Flow Finder framework.
    </p>
  </div>
  {swipe_arrow()}
  {progress_bar(3)}
</div>
"""


def slide_6_diagram():
    """Diverge → Converge → Emerge diagram in brand style SVG."""
    diagram = f'''
    <svg viewBox="0 0 1080 1080" preserveAspectRatio="xMidYMid meet"
         style="position:absolute;inset:0;width:100%;height:100%;">

      <!-- Title -->
      <text x="540" y="120" text-anchor="middle" fill="white"
            font-family="Fraunces,Georgia,serif" font-size="46" font-weight="600">The <tspan fill="{GOLD}">Flow Finder</tspan> process</text>

      <!-- Diverge funnel (left) - dots scattering -->
      <!-- Left wide opening -->
      <path d="M 120,340 L 120,740 L 380,600 L 380,480 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>

      <!-- Scattered dots in diverge section -->
      <circle cx="160" cy="420" r="6" fill="{GOLD}" opacity="0.7"/>
      <circle cx="200" cy="500" r="6" fill="#3498db" opacity="0.7"/>
      <circle cx="170" cy="580" r="6" fill="{GOLD}" opacity="0.7"/>
      <circle cx="220" cy="450" r="6" fill="#2ecc71" opacity="0.7"/>
      <circle cx="250" cy="550" r="6" fill="#3498db" opacity="0.7"/>
      <circle cx="190" cy="650" r="6" fill="#2ecc71" opacity="0.7"/>
      <circle cx="240" cy="620" r="6" fill="{GOLD}" opacity="0.7"/>
      <circle cx="280" cy="480" r="6" fill="#3498db" opacity="0.7"/>
      <circle cx="300" cy="560" r="6" fill="#2ecc71" opacity="0.7"/>
      <circle cx="260" cy="400" r="6" fill="{GOLD}" opacity="0.7"/>
      <circle cx="310" cy="520" r="6" fill="#3498db" opacity="0.7"/>
      <circle cx="220" cy="700" r="6" fill="#2ecc71" opacity="0.7"/>
      <circle cx="340" cy="510" r="6" fill="{GOLD}" opacity="0.5"/>
      <circle cx="350" cy="540" r="6" fill="#3498db" opacity="0.5"/>
      <circle cx="150" cy="500" r="5" fill="#2ecc71" opacity="0.5"/>
      <circle cx="280" cy="680" r="5" fill="{GOLD}" opacity="0.5"/>

      <!-- Narrow passage (converge) -->
      <rect x="380" y="500" width="10" height="80" rx="5" fill="rgba(255,255,255,0.2)"/>

      <!-- Converge funnel (right) - dots merging -->
      <path d="M 390,480 L 390,600 L 650,600 L 650,480 Z" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>

      <!-- Clustered dots in converge section -->
      <circle cx="440" cy="520" r="7" fill="{GOLD}" opacity="0.8"/>
      <circle cx="460" cy="545" r="7" fill="#3498db" opacity="0.8"/>
      <circle cx="450" cy="570" r="7" fill="#2ecc71" opacity="0.8"/>
      <circle cx="500" cy="530" r="8" fill="{GOLD}" opacity="0.8"/>
      <circle cx="520" cy="555" r="8" fill="#3498db" opacity="0.8"/>
      <circle cx="510" cy="520" r="7" fill="#2ecc71" opacity="0.8"/>
      <circle cx="560" cy="540" r="9" fill="{GOLD}" opacity="0.9"/>
      <circle cx="580" cy="530" r="8" fill="#3498db" opacity="0.9"/>
      <circle cx="600" cy="545" r="9" fill="#2ecc71" opacity="0.9"/>
      <circle cx="630" cy="540" r="10" fill="{GOLD}"/>

      <!-- Emerge arrow -->
      <path d="M 660,540 Q 780,540 850,400" stroke="{GOLD}" stroke-width="4" fill="none"/>
      <path d="M 660,540 Q 780,540 850,680" stroke="{GOLD}" stroke-width="4" fill="none" opacity="0.3"/>
      <polygon points="845,395 855,405 840,410" fill="{GOLD}"/>

      <!-- Emerge glow -->
      <circle cx="870" cy="380" r="30" fill="{GOLD}" opacity="0.08"/>
      <circle cx="870" cy="380" r="15" fill="{GOLD}" opacity="0.15"/>
      <text x="880" y="385" fill="{GOLD}" font-family="Outfit,sans-serif" font-size="22" font-weight="700">Your Flow</text>

      <!-- Labels -->
      <text x="200" y="800" text-anchor="middle" fill="rgba(255,255,255,0.5)"
            font-family="Outfit,sans-serif" font-size="26" font-weight="600">Diverge</text>
      <text x="200" y="838" text-anchor="middle" fill="rgba(255,255,255,0.35)"
            font-family="Outfit,sans-serif" font-size="20" font-weight="400">"Collect dots"</text>

      <text x="520" y="800" text-anchor="middle" fill="rgba(255,255,255,0.5)"
            font-family="Outfit,sans-serif" font-size="26" font-weight="600">Converge</text>
      <text x="520" y="838" text-anchor="middle" fill="rgba(255,255,255,0.35)"
            font-family="Outfit,sans-serif" font-size="20" font-weight="400">"Connect dots"</text>

      <text x="850" y="800" text-anchor="middle" fill="{GOLD}"
            font-family="Outfit,sans-serif" font-size="26" font-weight="600">Emerge</text>
      <text x="850" y="838" text-anchor="middle" fill="rgba(233,162,59,0.6)"
            font-family="Outfit,sans-serif" font-size="20" font-weight="400">"Find your flow"</text>

      <!-- Dot legend -->
      <circle cx="300" cy="940" r="8" fill="{GOLD}"/>
      <text x="320" y="946" fill="rgba(255,255,255,0.5)" font-family="Outfit,sans-serif" font-size="20">Skills</text>
      <circle cx="440" cy="940" r="8" fill="#3498db"/>
      <text x="460" y="946" fill="rgba(255,255,255,0.5)" font-family="Outfit,sans-serif" font-size="20">Problems</text>
      <circle cx="620" cy="940" r="8" fill="#2ecc71"/>
      <text x="640" y="946" fill="rgba(255,255,255,0.5)" font-family="Outfit,sans-serif" font-size="20">People</text>

    </svg>
    '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:absolute;inset:0;z-index:2;">{diagram}</div>
  {swipe_arrow()}
  {progress_bar(5)}
</div>
"""


def slide_6_application():
    venn = f'''
    <svg viewBox="0 0 420 420" style="width:100%;max-width:360px;margin:0 auto;">
      <!-- Three overlapping circles -->
      <circle cx="155" cy="150" r="115" fill="rgba(233,162,59,0.10)" stroke="{GOLD}" stroke-width="2" stroke-opacity="0.4"/>
      <circle cx="265" cy="150" r="115" fill="rgba(52,152,219,0.10)" stroke="#3498db" stroke-width="2" stroke-opacity="0.4"/>
      <circle cx="210" cy="255" r="115" fill="rgba(46,204,113,0.10)" stroke="#2ecc71" stroke-width="2" stroke-opacity="0.4"/>

      <!-- Circle labels -->
      <text x="115" y="105" text-anchor="middle" fill="{GOLD}" font-family="Outfit,sans-serif" font-size="14" font-weight="700">Skills</text>
      <text x="115" y="123" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Outfit,sans-serif" font-size="10">What you love</text>
      <text x="115" y="135" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Outfit,sans-serif" font-size="10">to do</text>

      <text x="305" y="105" text-anchor="middle" fill="#3498db" font-family="Outfit,sans-serif" font-size="14" font-weight="700">Problems</text>
      <text x="305" y="123" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Outfit,sans-serif" font-size="10">You're passionate</text>
      <text x="305" y="135" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Outfit,sans-serif" font-size="10">about solving</text>

      <text x="210" y="310" text-anchor="middle" fill="#2ecc71" font-family="Outfit,sans-serif" font-size="14" font-weight="700">People</text>
      <text x="210" y="328" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Outfit,sans-serif" font-size="10">Who you want</text>
      <text x="210" y="340" text-anchor="middle" fill="rgba(255,255,255,0.45)" font-family="Outfit,sans-serif" font-size="10">to help</text>

      <!-- Center intersection -->
      <text x="210" y="195" text-anchor="middle" fill="{GOLD}" font-family="Fraunces,Georgia,serif" font-size="18" font-weight="600">Your</text>
      <text x="210" y="218" text-anchor="middle" fill="{GOLD}" font-family="Fraunces,Georgia,serif" font-size="18" font-weight="600">Flow</text>
    </svg>
    '''

    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 24px;color:#fff;">
    <div style="margin-bottom:10px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Step 3: Emerge</span>
    </div>
    <h2 class="serif" style="font-size:24px;font-weight:600;line-height:1.15;letter-spacing:-0.4px;margin:0 0 14px;">
      Where they overlap is your <span style="color:{GOLD};">flow.</span>
    </h2>
    {venn}
  </div>
  {swipe_arrow()}
  {progress_bar(5)}
</div>
"""


def slide_7_application():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 30px;color:#fff;">
    <div style="margin-bottom:14px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">How it maps</span>
    </div>

    <div style="padding:14px 16px;background:rgba(255,255,255,0.06);border-radius:12px;border:1px solid rgba(255,255,255,0.08);margin-bottom:10px;">
      <span class="sans" style="font-size:11px;font-weight:700;color:{GOLD};display:block;margin-bottom:8px;">Looking for a job?</span>
      <p class="sans" style="font-size:12px;line-height:1.5;margin:0;color:rgba(255,255,255,0.7);">
        Your skills \u2192 job titles you'd love<br/>
        Your problems \u2192 industries that excite you<br/>
        Your people \u2192 sectors that matter to you<br/>
        <span style="color:#fff;font-weight:600;">Your combination \u2192 companies you'd thrive at</span>
      </p>
    </div>

    <div style="padding:14px 16px;background:rgba(255,255,255,0.06);border-radius:12px;border:1px solid rgba(255,255,255,0.08);">
      <span class="sans" style="font-size:11px;font-weight:700;color:{GOLD};display:block;margin-bottom:8px;">Starting your own thing?</span>
      <p class="sans" style="font-size:12px;line-height:1.5;margin:0;color:rgba(255,255,255,0.7);">
        Your skills \u2192 what you offer<br/>
        Your problems \u2192 why it matters<br/>
        Your people \u2192 who you serve<br/>
        <span style="color:#fff;font-weight:600;">Your combination \u2192 a business that's unique to you</span>
      </p>
    </div>
  </div>
  {swipe_arrow()}
  {progress_bar(6)}
</div>
"""


def slide_8_cta():
    return f"""
<div class="slide" style="position:relative;width:420px;height:525px;flex-shrink:0;{PURPLE_BG}overflow:hidden;">
  <div style="position:relative;z-index:2;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;padding:0 36px;color:#fff;">
    <div style="margin-bottom:16px;">
      <span class="sans" style="font-size:10px;font-weight:700;letter-spacing:2.5px;color:{GOLD};text-transform:uppercase;">Find My Flow</span>
    </div>
    <h2 class="serif" style="font-size:28px;font-weight:600;line-height:1.15;letter-spacing:-0.5px;margin:0 0 14px;max-width:350px;">
      Ready to connect your <span style="color:{GOLD};">dots?</span>
    </h2>
    <p class="sans" style="font-size:14px;line-height:1.55;margin:0 0 22px;color:rgba(255,255,255,0.85);max-width:340px;">
      The Flow Finder maps your skills, problems, and people into a career path that is uniquely yours.
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
        slide_2_quote(),
        slide_3_collect(),
        slide_4_insight(),
        slide_5_connect(),
        slide_6_application(),
        slide_7_application(),
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
<title>Flow Finder — Draft</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
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
