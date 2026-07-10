#!/usr/bin/env python3
"""
Add rule_break_philosophy, rule_break_product, rule_break_marketing
to each of the 33 experience creators in experienceCreatorRemarkableAnalysis.json.

Framework: Rule Break Layers (Philosophy / Product / Marketing)
- Philosophy: The assumption they reject ("Why do you think differently?")
- Product: The experience that embodies the rule break ("What do people actually walk into?")
- Marketing: The bold action that gets attention ("How do people first hear about you?")

Key insight: If the PRODUCT isn't a rule break, no amount of marketing saves it.
"""

import json
import os
import sys
from datetime import date

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
RA_PATH = os.path.join(PROJECT_ROOT, "public", "data", "experienceCreatorRemarkableAnalysis.json")

# The 33 creators from experienceCreatorDNA.json with their 3-layer rule breaks.
# Product layer is intentionally the most concrete and specific.
RULE_BREAK_LAYERS = {
    "Phil Jackson": {
        "rule_break_philosophy": "Winning requires dominance and aggression, not stillness and surrender",
        "rule_break_product": "Pre-game meditation circles and Lakota sage-burning rituals with NBA players in the locker room",
        "rule_break_marketing": "Winning 11 NBA championships while being called 'The Zen Master' by the press"
    },
    "Tenzin Palmo": {
        "rule_break_philosophy": "Women cannot achieve the highest spiritual attainments in Tibetan Buddhism",
        "rule_break_product": "A 12-year solitary cave retreat at 13,000 feet, sleeping upright in a 3-foot wooden box",
        "rule_break_marketing": "Vicki Mackenzie's biography 'Cave in the Snow' told her story to international audiences"
    },
    "Gabor Mate": {
        "rule_break_philosophy": "Addiction is a brain disease to be treated with medication, not a response to childhood pain",
        "rule_break_product": "Medical appointments in Vancouver's Downtown Eastside where he asked addicts 'What happened to you?' instead of prescribing drugs",
        "rule_break_marketing": "The documentary 'Wisdom of Trauma' gaining 2 million views in 6 days"
    },
    "Tony Robbins": {
        "rule_break_philosophy": "Therapeutic change requires years of private one-on-one sessions",
        "rule_break_product": "4-day arena events where 10,000 people walk on fire together as a breakthrough intervention",
        "rule_break_marketing": "Late-night 'Personal Power' infomercials reaching millions of households in the 1990s"
    },
    "Wim Hof": {
        "rule_break_philosophy": "You cannot consciously control your autonomic nervous system or immune response",
        "rule_break_product": "A breathing protocol plus progressive cold exposure training that anyone can learn in a weekend",
        "rule_break_marketing": "Setting Guinness World Records in ice: climbing Everest in shorts, swimming under Arctic ice"
    },
    "Esther Perel": {
        "rule_break_philosophy": "Therapy sessions are confidential and should never be shared publicly",
        "rule_break_product": "A podcast ('Where Should We Begin?') featuring real, unscripted couples therapy sessions with anonymous couples",
        "rule_break_marketing": "Two TED talks on desire and infidelity that reframed taboo relationship topics for millions"
    },
    "Priya Parker": {
        "rule_break_philosophy": "How you gather people is logistics, not leadership",
        "rule_break_product": "High-stakes facilitation sessions applying war-zone conflict resolution techniques to corporate meetings and dinner parties",
        "rule_break_marketing": "'The Art of Gathering' book codifying her methods for anyone hosting any kind of event"
    },
    "Jay Shetty": {
        "rule_break_philosophy": "Ancient wisdom belongs in monasteries and temples, not on social media",
        "rule_break_product": "60-second viral videos translating 3,000-year-old Vedic principles into shareable social media content",
        "rule_break_marketing": "A single Facebook video ('Before You Feel Pressure') reaching 300 million views"
    },
    "Gabby Bernstein": {
        "rule_break_philosophy": "Spiritual teachers need decades of study and pristine credentials to teach",
        "rule_break_product": "Living-room workshops teaching A Course in Miracles to young New Yorkers, led by a 25-year-old former nightclub publicist in recovery",
        "rule_break_marketing": "Oprah naming her 'next-generation thought leader' and open storytelling about her cocaine addiction as her credential"
    },
    "Eckhart Tolle": {
        "rule_break_philosophy": "Spiritual awakening requires years of disciplined practice and study",
        "rule_break_product": "A book ('The Power of Now') written in language so simple a child could understand presence, with no lineage or tradition attached",
        "rule_break_marketing": "Oprah co-hosting a 10-week live online class on 'A New Earth' that drew 35 million viewers"
    },
    "Deepak Chopra": {
        "rule_break_philosophy": "Western medicine and Eastern healing are incompatible systems",
        "rule_break_product": "A 21-day guided meditation program co-created with Oprah, blending Ayurvedic principles with neuroscience",
        "rule_break_marketing": "Leading with his MD credentials to make ancient Ayurvedic practices feel safe and scientific to mainstream Western audiences"
    },
    "Jack Kornfield": {
        "rule_break_philosophy": "Buddhist practice must stay within its Asian cultural container to be authentic",
        "rule_break_product": "Insight Meditation Society and Spirit Rock: Western meditation centres with systematic teacher training programs that democratised Buddhist practice",
        "rule_break_marketing": "Books that combined the authority of a Thai forest monk lineage with vulnerable stories of his own psychological struggles"
    },
    "Sam Harris": {
        "rule_break_philosophy": "Meditation is inherently religious and requires spiritual belief",
        "rule_break_product": "The Waking Up app: daily guided meditation stripped of all religious framing, taught as a rational investigation of consciousness",
        "rule_break_marketing": "Being one of the world's most prominent atheists publicly advocating for meditation as science, not spirituality"
    },
    "Thich Nhat Hanh": {
        "rule_break_philosophy": "Spiritual practice is separate from social and political action",
        "rule_break_product": "Plum Village: a monastery where every activity (eating, walking, washing dishes) is practiced as meditation, open to laypeople for retreats",
        "rule_break_marketing": "MLK nominating him for the Nobel Peace Prize after his anti-war activism during the Vietnam War"
    },
    "Seane Corn": {
        "rule_break_philosophy": "Yoga is personal wellness, not a vehicle for social justice",
        "rule_break_product": "Off the Mat Into the World: a training program that turns yoga teachers into frontline social justice activists, raising over $3.5M",
        "rule_break_marketing": "Teaching yoga to exploited youth at shelters before she had any platform or public profile"
    },
    "Joe Dispenza": {
        "rule_break_philosophy": "The mind cannot physically heal the body without medical intervention",
        "rule_break_product": "Multi-day meditation retreats where thousands of participants attempt to measurably change their brain chemistry and gene expression",
        "rule_break_marketing": "His personal story of healing 6 compressed vertebrae through meditation alone, refusing surgery"
    },
    "Aubrey Marcus": {
        "rule_break_philosophy": "Your most important work should be your most profitable work",
        "rule_break_product": "Fit For Service: a donation-based coaching fellowship combining breathwork, plant medicine integration, and purpose training",
        "rule_break_marketing": "Selling Onnit to Unilever for a reported $100M+ then making his next venture donation-based"
    },
    "Ram Dass": {
        "rule_break_philosophy": "A Harvard professor's credibility comes from the institution, not from inner transformation",
        "rule_break_product": "'Be Here Now': a handwritten, illustrated book that reads like a psychedelic scripture, with all profits donated",
        "rule_break_marketing": "Getting fired from Harvard for taking LSD, going to India, and coming back with a new name and no interest in money"
    },
    "Sadhguru": {
        "rule_break_philosophy": "Yoga requires a guru's constant personal guidance and cannot be standardised",
        "rule_break_product": "Inner Engineering: a standardised 7-session program culminating in Shambhavi Mahamudra Kriya, deliverable by trained volunteers worldwide",
        "rule_break_marketing": "Riding a motorcycle 30,000 km across 26 nations at age 64 for the Save Soil campaign"
    },
    "Marianne Williamson": {
        "rule_break_philosophy": "You need theological credentials to teach spiritual texts to the public",
        "rule_break_product": "Free weekly lectures translating A Course in Miracles into the language of heartbreak and emotional honesty, in LA for years",
        "rule_break_marketing": "Appearing on Oprah after publishing 'A Return to Love', selling over a million copies overnight"
    },
    "Mooji": {
        "rule_break_philosophy": "Spiritual authority requires formal lineage credentials and institutional backing",
        "rule_break_product": "Free, unedited satsangs where a former street artist sits in a chair and asks one question ('Who am I?') until seekers see through their identity",
        "rule_break_marketing": "Full-length satsang videos on YouTube with zero production value that generated millions of views and global retreat demand"
    },
    "Yung Pueblo": {
        "rule_break_philosophy": "Poetry requires literary sophistication, visual design, and cultural gatekeeping",
        "rule_break_product": "Plain black text on white background: daily Instagram posts distilling thousands of hours of Vipassana meditation into 2-3 sentence poems",
        "rule_break_marketing": "The most visually boring content on Instagram going viral because the words were so honest people screenshot them"
    },
    "Sahara Rose": {
        "rule_break_philosophy": "You need decades of lineage study to teach ancient Eastern wisdom",
        "rule_break_product": "Dharma Coaching Institute: a 6-month certification that trains coaches to help clients find their soul's purpose using a modernised framework",
        "rule_break_marketing": "Cold-emailing Deepak Chopra at 21 and getting him to write the foreword to her first book"
    },
    "Sri Sri Ravi Shankar": {
        "rule_break_philosophy": "Scaling a spiritual practice requires paid teachers and marketing budgets",
        "rule_break_product": "The Happiness Program: a standardised breathwork course (Sudarshan Kriya) delivered entirely by volunteer instructors who teach for free",
        "rule_break_marketing": "Building to 180 countries with no advertising budget, purely through word of mouth and volunteer networks"
    },
    "Vishen Lakhiani": {
        "rule_break_philosophy": "Personal growth content must come from your own expertise and lineage",
        "rule_break_product": "Mindvalley: an online university with 100+ 'Quests' curating the world's best teachers onto one membership platform",
        "rule_break_marketing": "Bootstrapping from a Starbucks in New York, selling other people's courses via Google Ads before creating any of his own"
    },
    "Michael Singer": {
        "rule_break_philosophy": "Spiritual teaching is a career you plan, not something that happens by saying yes to life",
        "rule_break_product": "Temple of the Universe: a free weekly meditation centre in the Florida woods, open to anyone, running for 50+ years",
        "rule_break_marketing": "'The Untethered Soul' spreading by pure word of mouth for 5 years before exploding after Oprah's Super Soul Sunday"
    },
    "Michael Beckwith": {
        "rule_break_philosophy": "Building a spiritual community requires institutional infrastructure before you start",
        "rule_break_product": "Agape International Spiritual Center: weekly services blending New Thought, music, and Life Visioning meditation for 9,000 members",
        "rule_break_marketing": "Being featured as a teacher in 'The Secret' (2006), bringing global visibility overnight"
    },
    "Radha Agrawal": {
        "rule_break_philosophy": "Community celebration and nightlife require alcohol and late-night settings",
        "rule_break_product": "Daybreaker: sober morning dance parties starting at 6am with live DJs, yoga, and community in warehouses and rooftops",
        "rule_break_marketing": "Instagram-friendly sunrise events that attendees photograph and share before the workday starts"
    },
    "Meghan Pappenheim": {
        "rule_break_philosophy": "You build the festival first, then hope a community forms around it",
        "rule_break_product": "The Yoga Barn ecosystem: a year-round wellness village (25+ daily classes, restaurants, galleries) that feeds into the annual BaliSpirit Festival",
        "rule_break_marketing": "Being a 20-year-old outsider who built community infrastructure (directory, studio, cafe) in Ubud for years before the festival existed"
    },
    "Jeff Krasno": {
        "rule_break_philosophy": "Wellness and entertainment are separate industries with separate audiences",
        "rule_break_product": "Wanderlust Festival: a multi-day event combining yoga, live music, and outdoor adventure in mountain resort settings",
        "rule_break_marketing": "Applying music festival production skills (from his record label) to yoga, making wellness feel like a concert experience"
    },
    "Gabrielle Roth": {
        "rule_break_philosophy": "Healing requires talking, not moving, and dance is performance, not therapy",
        "rule_break_product": "5Rhythms: a structured freeform movement practice (Flowing, Staccato, Chaos, Lyrical, Stillness) practiced as group meditation on a dance floor",
        "rule_break_marketing": "A dancer told she would never dance again turning her rehabilitation into a certified method taught in 50+ countries"
    },
    "Larry Harvey": {
        "rule_break_philosophy": "Events need organisers, rules, and commercial sponsors to function at scale",
        "rule_break_product": "Burning Man: a temporary city of 80,000 in the Nevada desert with no spectators, no advertising, and 10 guiding principles instead of rules",
        "rule_break_marketing": "Burning an 8-foot wooden man on a beach with 20 friends and showing up every year until 80,000 people did too"
    },
    "Brené Brown": {
        "rule_break_philosophy": "Academic researchers stay behind the data and never show personal weakness on stage",
        "rule_break_product": "A TEDx talk where a shame researcher shared her own breakdown on stage, plus a licensed facilitator training (Dare to Lead) for organisations",
        "rule_break_marketing": "Her 2010 TEDxHouston talk going viral to 60M+ views, proving that vulnerability from a researcher is more compelling than polished expertise"
    }
}


def main():
    # Load the existing file
    with open(RA_PATH, "r") as f:
        data = json.load(f)

    creators = data["creators"]

    # Verify all 33 creators exist in the file
    missing = []
    for name in RULE_BREAK_LAYERS:
        if name not in creators:
            missing.append(name)

    if missing:
        print(f"ERROR: {len(missing)} creators not found in remarkable analysis file:")
        for name in missing:
            print(f"  - {name}")
        sys.exit(1)

    # Add the 3-layer fields to each creator
    updated_count = 0
    for name, layers in RULE_BREAK_LAYERS.items():
        creator = creators[name]
        creator["rule_break_philosophy"] = layers["rule_break_philosophy"]
        creator["rule_break_product"] = layers["rule_break_product"]
        creator["rule_break_marketing"] = layers["rule_break_marketing"]
        updated_count += 1

    # Update meta
    data["meta"]["rule_break_layers_added"] = str(date.today())
    data["meta"]["rule_break_layers_count"] = updated_count
    data["meta"]["rule_break_layers_note"] = (
        "3-layer rule break analysis: philosophy (assumption rejected), "
        "product (tangible experience), marketing (how people first hear). "
        "Product is the most important layer."
    )

    # Save
    with open(RA_PATH, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Successfully added rule break layers to {updated_count} creators in:")
    print(f"  {RA_PATH}")
    print()

    # Print summary table
    print(f"{'Creator':<22} {'Philosophy':<55} {'Product':<65} {'Marketing'}")
    print("-" * 200)
    for name in sorted(RULE_BREAK_LAYERS.keys()):
        layers = RULE_BREAK_LAYERS[name]
        phil = layers["rule_break_philosophy"][:53] + ".." if len(layers["rule_break_philosophy"]) > 55 else layers["rule_break_philosophy"]
        prod = layers["rule_break_product"][:63] + ".." if len(layers["rule_break_product"]) > 65 else layers["rule_break_product"]
        mktg = layers["rule_break_marketing"][:75] + ".." if len(layers["rule_break_marketing"]) > 77 else layers["rule_break_marketing"]
        print(f"{name:<22} {phil:<55} {prod:<65} {mktg}")


if __name__ == "__main__":
    main()
