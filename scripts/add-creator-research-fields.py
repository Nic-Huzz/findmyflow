#!/usr/bin/env python3
"""
Add vehicle_type, identity_score, and access_score fields to experienceCreatorGrowthStrategies.json
for all 33 experience creators in the Vibe Rise app.

Fields:
- vehicle_type: "results" | "new_medium" | "new_action"
- vehicle_evidence: one-line explanation
- identity_score: 1-5 (can someone else embody their method?)
- identity_evidence: one-line explanation
- access_score: 1-5 (how easy for a stranger to try for the first time?)
- access_evidence: one-line explanation
"""

import json
import os

# Research data for all 33 creators
RESEARCH_DATA = {
    "Brené Brown": {
        "vehicle_type": "results",
        "vehicle_evidence": "Her TEDx talk went viral because the research spoke for itself; 60M views from authentic vulnerability, not a new platform",
        "identity_score": 4,
        "identity_evidence": "300+ Dare to Lead certified facilitators deliver her methodology in organisations worldwide",
        "access_score": 5,
        "access_evidence": "Free TED talks, Netflix special, bestselling books, free podcast; zero friction to encounter her work"
    },
    "Esther Perel": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "First therapist to record real couples therapy sessions as a podcast, creating a new format nobody in therapy was using",
        "identity_score": 3,
        "identity_evidence": "Sessions platform trains therapists in her approach but she remains the primary draw; no formal certification",
        "access_score": 4,
        "access_evidence": "Free podcast (Where Should We Begin), TED talks, bestselling books; paid retreats and Sessions events are premium tier"
    },
    "Gabby Bernstein": {
        "vehicle_type": "results",
        "vehicle_evidence": "Oprah discovered her through consistent teaching and book quality; the work attracted the bridge person",
        "identity_score": 4,
        "identity_evidence": "Spirit Junkie Masterclass certifies coaches at multiple levels who deliver her framework independently",
        "access_score": 4,
        "access_evidence": "Bestselling books widely available, free YouTube content, card decks; online courses at moderate price points"
    },
    "Gabor Mate": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "The documentary Wisdom of Trauma (2M views in 6 days) carried his message to a new audience via film, not traditional medical publishing",
        "identity_score": 2,
        "identity_evidence": "His authority comes from 12 years of frontline clinical work; others teach trauma-informed care but his personal story is the draw",
        "access_score": 4,
        "access_evidence": "Free documentary, bestselling books, YouTube talks, online courses; retreats are premium but entry points are abundant"
    },
    "Jay Shetty": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "Used Facebook video before other wisdom teachers; a single video (Before You Feel Pressure) hit 300M views on a platform monks weren't using",
        "identity_score": 4,
        "identity_evidence": "Jay Shetty Certification School trains coaches in his ABC Framework with AC accreditation; 6-month program produces independent coaches",
        "access_score": 5,
        "access_evidence": "Free podcast (On Purpose), massive free social media content, free YouTube videos; effortless to encounter"
    },
    "Phil Jackson": {
        "vehicle_type": "results",
        "vehicle_evidence": "11 NBA championships proved the method; the results themselves were the marketing, no content strategy needed",
        "identity_score": 2,
        "identity_evidence": "His approach was deeply personal, combining Zen, Lakota spirituality, and the triangle offense; no certification or training program exists",
        "access_score": 3,
        "access_evidence": "Books available (Sacred Hoops, Eleven Rings) but no courses, app, or direct teaching; you can read about it but not experience it"
    },
    "Priya Parker": {
        "vehicle_type": "results",
        "vehicle_evidence": "The Art of Gathering book codified years of high-stakes facilitation work; the quality of her practice attracted a publisher",
        "identity_score": 3,
        "identity_evidence": "Online course ($397) teaches her framework and thousands have taken it, but no formal facilitator certification exists",
        "access_score": 4,
        "access_evidence": "Bestselling book, free podcast (Together Apart), online course with pay-what-you-can option; accessible entry points"
    },
    "Tenzin Palmo": {
        "vehicle_type": "results",
        "vehicle_evidence": "Her 12 years in a cave and the biography Cave in the Snow told the story; the extreme practice itself was the proof",
        "identity_score": 2,
        "identity_evidence": "Founded a nunnery with 120 nuns but her personal story and presence is irreplaceable; she retired from public teaching in 2022",
        "access_score": 2,
        "access_evidence": "Retired from teaching since 2022; nunnery in rural India requires travel; books and archived talks are the main access points"
    },
    "Tony Robbins": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "Used late-night infomercials in the 1980s to reach millions; nobody in personal development was using TV direct response at that scale",
        "identity_score": 3,
        "identity_evidence": "Has coaching certifications but the arena events are deeply tied to his personal energy and performance; others teach but lack his presence",
        "access_score": 3,
        "access_evidence": "Books and free YouTube content available, but the core product (multi-day events) costs thousands; no free app or low-cost entry"
    },
    "Wim Hof": {
        "vehicle_type": "results",
        "vehicle_evidence": "The 2014 PNAS scientific study proved his method worked; Guinness World Records demonstrated results that attracted researchers",
        "identity_score": 4,
        "identity_evidence": "1,200+ certified Wim Hof Method instructors deliver the protocol worldwide through structured certification",
        "access_score": 5,
        "access_evidence": "Free app with guided breathing, free YouTube tutorials, low-cost online courses; anyone can start cold showers today"
    },
    "Eckhart Tolle": {
        "vehicle_type": "results",
        "vehicle_evidence": "The Power of Now spread by word of mouth for 3 years before Oprah discovered it; the book's quality attracted the bridge person",
        "identity_score": 2,
        "identity_evidence": "No certification program; his teaching is inseparable from his presence and embodied stillness; others discuss his work but can't replicate him",
        "access_score": 4,
        "access_evidence": "Free YouTube talks, free podcast episodes, bestselling books at bookstores; Eckhart Tolle TV subscription is affordable"
    },
    "Deepak Chopra": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "The 21-Day Meditation Experience with Oprah used a digital format nobody in Ayurveda was using, proving spiritual content works at media-company scale",
        "identity_score": 4,
        "identity_evidence": "Chopra Global was sold to The Healing Company; corporate wellness programs and certified instructors deliver content without him",
        "access_score": 5,
        "access_evidence": "Free 21-Day Meditations with Oprah, free YouTube channel, 90+ books, licensed content on Audible/Spotify; extremely low friction"
    },
    "Jack Kornfield": {
        "vehicle_type": "results",
        "vehicle_evidence": "Co-founding IMS and Spirit Rock let the institutions demonstrate the value; the meditation centres attracted seekers through practice quality",
        "identity_score": 4,
        "identity_evidence": "Systematic teacher training programs at Spirit Rock and with Tara Brach have certified a generation of Western meditation teachers",
        "access_score": 4,
        "access_evidence": "Free online meditations, free Mindfulness Daily course with Tara Brach, free YouTube dharma talks, books widely available"
    },
    "Sam Harris": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "Built Waking Up as a subscription app when no prominent atheist-intellectual was using the app format for meditation",
        "identity_score": 3,
        "identity_evidence": "Waking Up app curates other teachers but Sam's intellectual framing and daily lessons are the core draw; the app extends but depends on him",
        "access_score": 5,
        "access_evidence": "Free Waking Up app trial, free scholarship for anyone who cannot afford it (no questions asked), free podcast, free YouTube"
    },
    "Thich Nhat Hanh": {
        "vehicle_type": "results",
        "vehicle_evidence": "MLK nominated him for the Nobel Prize after witnessing his peace activism; the depth of his practice attracted the most powerful bridge person",
        "identity_score": 5,
        "identity_evidence": "700+ monastics and hundreds of lay Dharma Teachers worldwide; 11 monasteries and local sanghas continue thriving after his 2022 passing",
        "access_score": 5,
        "access_evidence": "Free Plum Village app, free YouTube dharma talks, free local sangha gatherings worldwide, 100+ affordable books"
    },
    "Seane Corn": {
        "vehicle_type": "results",
        "vehicle_evidence": "Built reputation through emotionally raw classes in LA studios and serving exploited youth; the quality of her teaching attracted opportunities",
        "identity_score": 3,
        "identity_evidence": "Off the Mat Into the World trains yoga activists but Seane's personal story and emotional presence are central to the brand",
        "access_score": 4,
        "access_evidence": "Free yoga videos on YouTube and Gaia, book available, social justice talks online; workshops and retreats require travel and payment"
    },
    "Joe Dispenza": {
        "vehicle_type": "results",
        "vehicle_evidence": "His personal spine healing story and peer-reviewed research on retreat participants proved the method; results attracted followers",
        "identity_score": 3,
        "identity_evidence": "NeuroChangeSolutions certifies corporate trainers but his retreats are deeply tied to his personal presence and guided meditations",
        "access_score": 4,
        "access_evidence": "Free YouTube meditations, Gaia streaming content, bestselling books; online courses at moderate cost; retreats are expensive but not required"
    },
    "Aubrey Marcus": {
        "vehicle_type": "new_action",
        "vehicle_evidence": "Sold Onnit to Unilever then made his next venture donation-based; the bold move of going from $100M exit to donation model was the story",
        "identity_score": 2,
        "identity_evidence": "Fit For Service is deeply tied to Aubrey's personal journey, vulnerability, and facilitation; instructors exist but he is the draw",
        "access_score": 4,
        "access_evidence": "Free podcast, free YouTube content, book available; Fit For Service is donation-based (though historically $20K-30K suggested)"
    },
    "Ram Dass": {
        "vehicle_type": "results",
        "vehicle_evidence": "Be Here Now spread purely by word of mouth because the writing was so transformative; he gave away all profits, letting the work speak",
        "identity_score": 3,
        "identity_evidence": "Love Serve Remember Foundation continues his legacy with podcast and digital content; he funded other teachers' careers who carry the lineage",
        "access_score": 5,
        "access_evidence": "Be Here Now is a cheap paperback, free talks and satsangs online, free posthumous podcast; he donated all book profits"
    },
    "Sadhguru": {
        "vehicle_type": "results",
        "vehicle_evidence": "Inner Engineering proved itself through volunteer word of mouth across 100+ countries with no marketing budget; results drove organic spread",
        "identity_score": 5,
        "identity_evidence": "Thousands of volunteer instructors deliver standardised Inner Engineering programs worldwide without Sadhguru present",
        "access_score": 5,
        "access_evidence": "Free Isha Kriya meditation, free YouTube (12M+ subscribers), free introductory sessions; Inner Engineering online is affordable"
    },
    "Marianne Williamson": {
        "vehicle_type": "results",
        "vehicle_evidence": "Years of free weekly ACIM lectures in LA built a loyal following that Oprah discovered; the teaching quality attracted the bridge",
        "identity_score": 2,
        "identity_evidence": "Her work translating A Course in Miracles is deeply personal; no certification program, books carry the message but not the presence",
        "access_score": 4,
        "access_evidence": "Bestselling books in 30+ languages, free lecture clips, podcast interviews; digital courses available at moderate cost"
    },
    "Mooji": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "Full-length unedited satsangs on YouTube with zero production value created a new distribution model for Advaita teaching",
        "identity_score": 1,
        "identity_evidence": "His teaching is entirely dependent on his personal presence; sitting in a chair asking one question cannot be systematised or delegated",
        "access_score": 4,
        "access_evidence": "Free full-length YouTube satsangs (870K+ subscribers), free online broadcasts; retreats require application and 6-month Sahaja Express membership"
    },
    "Yung Pueblo": {
        "vehicle_type": "new_medium",
        "vehicle_evidence": "Used Instagram for plain-text poetry when the platform was all about visuals; the anti-design format on a visual platform was the innovation",
        "identity_score": 1,
        "identity_evidence": "His work is entirely his personal inner experience distilled into words; there is no method, framework, or certification to transfer",
        "access_score": 5,
        "access_evidence": "Free Instagram poetry (4M+ followers), free Substack newsletter, affordable paperback books; zero friction"
    },
    "Sahara Rose": {
        "vehicle_type": "results",
        "vehicle_evidence": "Cold-emailing Deepak Chopra and getting his foreword was the result of her healing story and book quality; the work attracted the endorsement",
        "identity_score": 4,
        "identity_evidence": "Dharma Coaching Institute has certified 2,000+ coaches over 5 years; graduates operate independently using her framework",
        "access_score": 5,
        "access_evidence": "Free podcast (60M+ downloads), free dosha quiz, free Instagram content, affordable books; very easy first encounter"
    },
    "Sri Sri Ravi Shankar": {
        "vehicle_type": "results",
        "vehicle_evidence": "Art of Living grew to 180 countries purely through word of mouth with no advertising; the breathing technique's results drove volunteer spread",
        "identity_score": 5,
        "identity_evidence": "Thousands of volunteer instructors deliver the standardised Happiness Program worldwide; the method works completely without the founder",
        "access_score": 4,
        "access_evidence": "Free introductory sessions, free YouTube content, free books; Happiness Program courses have a fee but are available in 180 countries"
    },
    "Vishen Lakhiani": {
        "vehicle_type": "results",
        "vehicle_evidence": "Bootstrapped for 14 years selling others' courses, proving the platform model before writing his own book; the track record attracted attention",
        "identity_score": 4,
        "identity_evidence": "Mindvalley platform features 100+ teachers delivering Quests independently; coaching certifications produce certified practitioners",
        "access_score": 4,
        "access_evidence": "Free masterclasses, free YouTube content, bestselling books; membership subscription is the core product at moderate cost"
    },
    "Michael Singer": {
        "vehicle_type": "results",
        "vehicle_evidence": "The Untethered Soul spread by pure word of mouth for 5 years before Oprah's Super Soul Sunday; the book's depth attracted the bridge",
        "identity_score": 2,
        "identity_evidence": "Temple of the Universe is a free meditation centre but his teaching is deeply personal; no certification, no trained teachers",
        "access_score": 4,
        "access_evidence": "Free podcast, free Temple of the Universe talks, bestselling books at bookstores; online courses available"
    },
    "Michael Beckwith": {
        "vehicle_type": "results",
        "vehicle_evidence": "Featured in The Secret (2006) because 20 years of consistent Sunday services built a 9,000-person community; the results attracted the documentary",
        "identity_score": 4,
        "identity_evidence": "365 trained practitioners extend his healing work; Life Visioning courses on Mindvalley and Shift Network are delivered by certified facilitators",
        "access_score": 4,
        "access_evidence": "Free weekly livestreams, bestselling books, Life Visioning on Mindvalley (with free masterclass); Agape services are open to all"
    },
    "Radha Agrawal": {
        "vehicle_type": "new_action",
        "vehicle_evidence": "Threw a sober dance party at 6am in a warehouse; the bold act itself in an existing nightlife scene was what created the movement",
        "identity_score": 4,
        "identity_evidence": "Daybreaker is licensed to local hosts in 30+ cities across multiple continents; the format runs without Radha present",
        "access_score": 4,
        "access_evidence": "Free community party nights, affordable event tickets, events in 30+ cities worldwide; book available"
    },
    "Meghan Pappenheim": {
        "vehicle_type": "new_action",
        "vehicle_evidence": "Built a community directory and opened a yoga studio in Ubud before anyone else; the bold act of planting roots at 20 in Bali created the ecosystem",
        "identity_score": 3,
        "identity_evidence": "Yoga Barn runs 25+ daily classes with many teachers; BaliSpirit Festival has its own team, but Meghan's vision still guides the ecosystem",
        "access_score": 3,
        "access_evidence": "BaliSpirit Festival has free community days and affordable tickets, but requires travel to Bali; Yoga Barn has drop-in classes"
    },
    "Jeff Krasno": {
        "vehicle_type": "new_action",
        "vehicle_evidence": "Combined music festival production with yoga to create an entirely new event category; the bold act of merging two worlds on an existing stage",
        "identity_score": 3,
        "identity_evidence": "Wanderlust ran in 20 countries with local teams; Commune platform features other teachers, but Jeff's curation and essays are central",
        "access_score": 4,
        "access_evidence": "Free weekly newsletter (1M+ subscribers), free podcast, Commune online courses at moderate subscription; Topanga retreat is premium"
    },
    "Gabrielle Roth": {
        "vehicle_type": "results",
        "vehicle_evidence": "A decade of dancing and teaching at Esalen proved the method before formalising; the movement practice's visible healing results attracted followers",
        "identity_score": 5,
        "identity_evidence": "400+ certified teachers in 50+ countries carry 5Rhythms worldwide; method continues thriving 14 years after her death under her son's direction",
        "access_score": 3,
        "access_evidence": "5Rhythms classes available in 50+ countries at studio drop-in prices; music catalogue on streaming; but requires finding a local class"
    },
    "Larry Harvey": {
        "vehicle_type": "new_action",
        "vehicle_evidence": "Burned an 8-foot wooden man on a beach with 20 friends; the bold act itself in an existing social context was the founding moment",
        "identity_score": 5,
        "identity_evidence": "10 Principles guide 235+ regional contacts worldwide; 80,000-person event runs as a nonprofit with the founder having passed in 2018",
        "access_score": 2,
        "access_evidence": "Main event requires expensive tickets ($575+), travel to remote Nevada desert, and radical self-reliance; regional burns are more accessible"
    }
}


def main():
    # Load the existing growth strategies file
    filepath = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "public", "data", "experienceCreatorGrowthStrategies.json"
    )

    with open(filepath, "r") as f:
        data = json.load(f)

    # Verify all 33 creators are covered
    existing_creators = set(data["creators"].keys())
    research_creators = set(RESEARCH_DATA.keys())

    missing_in_research = existing_creators - research_creators
    extra_in_research = research_creators - existing_creators

    if missing_in_research:
        print(f"WARNING: Missing research for: {missing_in_research}")
    if extra_in_research:
        print(f"WARNING: Extra research for: {extra_in_research}")

    # Add fields to each creator
    for name, creator_data in data["creators"].items():
        if name in RESEARCH_DATA:
            research = RESEARCH_DATA[name]
            creator_data["vehicle_type"] = research["vehicle_type"]
            creator_data["vehicle_evidence"] = research["vehicle_evidence"]
            creator_data["identity_score"] = research["identity_score"]
            creator_data["identity_evidence"] = research["identity_evidence"]
            creator_data["access_score"] = research["access_score"]
            creator_data["access_evidence"] = research["access_evidence"]

    # Update meta
    data["meta"]["research_fields_added"] = "2026-06-17"
    data["meta"]["research_fields"] = {
        "vehicle_type": "How their story spread: results | new_medium | new_action",
        "identity_score": "Can someone else embody their method? 1 (founder-dependent) to 5 (fully systematised)",
        "access_score": "How easy for a stranger to try? 1 (very hard) to 5 (effortless)"
    }

    # Save updated file
    with open(filepath, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\nUpdated {filepath}")
    print(f"Added research fields to {len(RESEARCH_DATA)} creators\n")

    # Print summary table
    print(f"{'Creator':<25} {'Vehicle':<12} {'Identity':<10} {'Access':<8}")
    print("-" * 55)

    # Sort by name for readability
    vehicle_counts = {"results": 0, "new_medium": 0, "new_action": 0}
    identity_scores = []
    access_scores = []

    for name in sorted(RESEARCH_DATA.keys()):
        r = RESEARCH_DATA[name]
        print(f"{name:<25} {r['vehicle_type']:<12} {r['identity_score']:<10} {r['access_score']:<8}")
        vehicle_counts[r["vehicle_type"]] += 1
        identity_scores.append(r["identity_score"])
        access_scores.append(r["access_score"])

    print("-" * 55)
    print(f"\nVehicle Type Distribution:")
    for vtype, count in vehicle_counts.items():
        print(f"  {vtype}: {count} ({count/33*100:.0f}%)")

    print(f"\nIdentity Score: avg {sum(identity_scores)/len(identity_scores):.1f}, "
          f"median {sorted(identity_scores)[len(identity_scores)//2]}, "
          f"range {min(identity_scores)}-{max(identity_scores)}")

    print(f"Access Score:   avg {sum(access_scores)/len(access_scores):.1f}, "
          f"median {sorted(access_scores)[len(access_scores)//2]}, "
          f"range {min(access_scores)}-{max(access_scores)}")

    # Print detailed evidence
    print(f"\n{'='*80}")
    print("DETAILED EVIDENCE")
    print(f"{'='*80}\n")

    for name in sorted(RESEARCH_DATA.keys()):
        r = RESEARCH_DATA[name]
        print(f"--- {name} ---")
        print(f"  Vehicle ({r['vehicle_type']}): {r['vehicle_evidence']}")
        print(f"  Identity ({r['identity_score']}/5): {r['identity_evidence']}")
        print(f"  Access ({r['access_score']}/5): {r['access_evidence']}")
        print()


if __name__ == "__main__":
    main()
