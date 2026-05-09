# Creator Data Reference (for research agents)

This file contains calibration examples and vocabulary for adding new creators to the FindMyFlow data files.

## Calibration Examples

### careerModels.json entries

```json
{
  "name": "Wim Hof",
  "source": "non-founder",
  "domain": "breathwork / cold exposure / human performance",
  "oneLiner": "Proved that a freezing river can teach you more about yourself than ten years of therapy.",
  "primaryProblem": "pain_not_believed",
  "primarySkills": ["coaching", "performing", "speaking_up"],
  "careerModel": {
    "type": "method_certification_empire",
    "primaryRevenue": "Instructor certification and branded retreats",
    "revenueStreams": ["instructor certification", "mobile app subscriptions", "branded retreats", "corporate workshops", "online courses", "book royalties"],
    "trajectory": "Grieving father using cold as medicine at 36, broke first world record at 40, academic validation at 55, 1500+ certified instructors by 64.",
    "keyDecision": "Submitted himself to rigorous scientific testing, trading spectacle credibility for peer-reviewed credibility.",
    "scaleModel": "Personal world records built fame, science built trust, then certified instructors delivered worldwide without him present.",
    "lessonsForUser": "If your method works on your body first: get scientific validation, then certify others to teach it. The science turns personal practice into scalable business."
  },
  "confidence": "high"
}

{
  "name": "Gabby Bernstein",
  "source": "non-founder",
  "domain": "spiritual development / manifestation / sobriety",
  "oneLiner": "Made spirituality accessible to the woman who still drinks oat milk lattes and checks her phone.",
  "primaryProblem": "forgot_what_for",
  "primarySkills": ["coaching", "teaching", "performing"],
  "careerModel": {
    "type": "spiritual_teacher_certification_empire",
    "primaryRevenue": "Spirit Junkie Masterclass and live workshops/retreats",
    "revenueStreams": ["coaching certification (Spirit Junkie Masterclass)", "book royalties", "live events and retreats", "online courses", "keynote speaking", "card decks"],
    "trajectory": "Got sober at 25, living room lectures at 29, first book at 32, Oprah endorsement at 35, 10 NYT bestsellers and 5000+ certified coaches by 44.",
    "keyDecision": "Started teaching in her living room before having any credentials, trusting that personal transformation was qualification enough.",
    "scaleModel": "Books build mainstream credibility, live events create peak experiences, masterclass certification creates a lineage of teachers.",
    "lessonsForUser": "Start teaching in the smallest room available, let your transformation be the curriculum, then certify others to carry it."
  },
  "confidence": "high"
}

{
  "name": "Tara Brach",
  "source": "non-founder",
  "domain": "meditation / Buddhist psychology / mindfulness",
  "oneLiner": "Made sitting still with your own pain feel like the bravest thing you could do.",
  "primaryProblem": "pain_not_believed",
  "primarySkills": ["coaching", "teaching", "connecting"],
  "careerModel": {
    "type": "teacher_certification_and_community",
    "primaryRevenue": "Teacher certification programme and retreats",
    "revenueStreams": ["meditation teacher certification", "retreats", "book royalties", "online courses", "community donations"],
    "trajectory": "Clinical psychologist, founded meditation community at 45, first book at 50, free podcast to 200M downloads by 70, certification training thousands of teachers.",
    "keyDecision": "Kept the weekly teachings permanently free, trusting that generosity would build a community large enough to sustain paid offerings.",
    "scaleModel": "Free weekly content builds global community, retreats deepen practice, 2-year teacher certification creates a lineage of practitioners.",
    "lessonsForUser": "Give freely and consistently for decades, train teachers to carry the method, and trust that depth builds the audience."
  },
  "confidence": "high"
}
```

### experienceCreatorDNA.json entries

Slider anchors:
- workRhythm: 1=Marathon (Tara Brach, steady decades), 5=Sprinter (burst events)
- fuelType: 1=Clean/sustainable (meditation teachers), 5=Dirty/intense (Tony Robbins-style high energy)
- knowledgeStyle: 1=Analytical (John Gottman, research-based), 5=Intuitive (Wim Hof, body-based)
- impactStyle: 1=Direct (1:1 therapists), 3=Mixed, 5=Systemic (policy/institutional)
- growthMode: 1=Deep expertise (one method forever), 5=Broad leadership (empire builder)

```json
{"name": "Wim Hof", "experienceType": "certification", "workRhythm": 2, "fuelType": 1, "knowledgeStyle": 5, "impactStyle": 3, "growthMode": 2, "confidence": 90}
{"name": "Gabby Bernstein", "experienceType": "certification", "workRhythm": 4, "fuelType": 1, "knowledgeStyle": 5, "impactStyle": 2, "growthMode": 3, "confidence": 85}
{"name": "Tara Brach", "experienceType": "certification", "workRhythm": 1, "fuelType": 1, "knowledgeStyle": 4, "impactStyle": 3, "growthMode": 1, "confidence": 92}
{"name": "Adriene Mishler", "experienceType": "membership", "workRhythm": 2, "fuelType": 1, "knowledgeStyle": 5, "impactStyle": 1, "growthMode": 1, "confidence": 90}
```

Valid experienceType values: workshop, retreat, performance, live_events, cohort, facilitation, book_newsletter, certification, media_training, immersive, membership

### experienceCreatorOfferMap.json entries

```json
"Wim Hof": {
  "attraction": ["book royalties"],
  "core": ["branded retreats", "corporate workshops"],
  "scale": ["instructor certification"],
  "continuity": ["mobile app subscriptions", "online courses"]
}
"Gabby Bernstein": {
  "attraction": ["book royalties"],
  "core": ["live events and retreats"],
  "scale": ["coaching certification (Spirit Junkie Masterclass)", "keynote speaking"],
  "continuity": ["online courses", "card decks"]
}
"Tara Brach": {
  "attraction": ["book royalties"],
  "core": ["retreats", "community donations"],
  "scale": ["meditation teacher certification"],
  "continuity": ["online courses"]
}
```

### experienceCreatorGrowthStrategies.json entries

```json
{
  "name": "Wim Hof",
  "early_growth": "Started swimming in freezing water to cope with his wife's death, practicing alone for years. Set personal records in cold exposure, attracting local media attention.",
  "scaling_move": "Submitted to scientific studies at Radboud University, legitimizing his method through research.",
  "current_model": "Certifies instructors worldwide while running retreats and selling apps and courses.",
  "growth_category": "one_project",
  "first_step": "Practice cold showers daily for 30 days and document how you feel.",
  "remarkable_thing": "A grieving father who taught scientists that breathing could control the immune system.",
  "trust_behavior": "Swam in freezing water alone for years before setting any records.",
  "remarkable_category": "impossible_proof",
  "remarkable_type": "grief discovery",
  "remarkable_trigger": "extreme_degree",
  "remarkable_behavior": "A grieving father who sat in freezing water every day until his immune system changed."
}
{
  "name": "Gabby Bernstein",
  "early_growth": "Started teaching about sobriety and spirituality in her New York apartment living room to small groups. Created her own PR company to support her speaking career.",
  "scaling_move": "Published her first book and received Oprah's endorsement, reaching a mainstream audience.",
  "current_model": "Books drive awareness, live events create experiences, Spirit Junkie Masterclass certifies coaches.",
  "growth_category": "free_events",
  "first_step": "Host a free spiritual discussion group in your living room for 8-10 people.",
  "remarkable_thing": "A party girl who taught spirituality from her apartment before having any credentials.",
  "trust_behavior": "Taught small groups in her living room consistently before writing books.",
  "remarkable_category": "authority_paradox",
  "remarkable_type": "unqualified expert",
  "remarkable_trigger": "extreme_degree",
  "remarkable_behavior": "A 25-year-old who started teaching spirituality from her apartment with zero credentials."
}
```

Valid growth_category: free_content, free_events, academic, grassroots, one_project, apprenticeship, clinical
Valid remarkable_category: authority_paradox, origin_story, method_innovation, audience_relationship, counter_positioning, impossible_proof, opposite_method
Valid remarkable_trigger: rule_broken, unexpected_origin, radical_consistency, vulnerability_as_strength, simplicity, extreme_degree, stupid_simplicity

### nonFounderPlaySkills.json entries

```json
{
  "name": "Wim Hof",
  "dominantCategories": ["performing", "teaching"],
  "playSkills": [
    {"category": "coaching", "skill": "Teach through the body, not the mind", "confidence": "high", "evidence": "Wim Hof Method certified by 1,500+ instructors in 45 countries"},
    {"category": "performing", "skill": "Use your own body as proof", "confidence": "high", "evidence": "21 Guinness World Records including 1hr 52min ice bath"},
    {"category": "speaking_up", "skill": "Challenge scientific orthodoxy from lived experience", "confidence": "high", "evidence": "PNAS-published study proved voluntary influence over autonomic nervous system"}
  ]
}
{
  "name": "Gabby Bernstein",
  "dominantCategories": ["coaching", "teaching", "performing"],
  "playSkills": [
    {"category": "coaching", "skill": "Start a lineage from a living room", "confidence": "high", "evidence": "Free Monday night lectures in her apartment grew into 5,000+ Spirit Junkie Masterclass graduates"},
    {"category": "teaching", "skill": "Make ancient texts feel modern", "confidence": "high", "evidence": "Translated A Course in Miracles into accessible modern language for a millennial audience"},
    {"category": "performing", "skill": "Channel spiritual energy on stage", "confidence": "high", "evidence": "10 NYT bestsellers and sold-out live events and retreats worldwide"}
  ]
}
{
  "name": "Tara Brach",
  "dominantCategories": ["coaching", "teaching", "connecting"],
  "playSkills": [
    {"category": "coaching", "skill": "Hold space for decades without burning out", "confidence": "high", "evidence": "Weekly free dharma talks since 2002, 200M podcast downloads, never gated content"},
    {"category": "teaching", "skill": "Codify a practice into a teachable method", "confidence": "high", "evidence": "RAIN method adopted by thousands of therapists and school counsellors worldwide"},
    {"category": "connecting", "skill": "Build community through consistency", "confidence": "high", "evidence": "Founded Insight Meditation Community of Washington D.C. in 1998, still teaching there"}
  ]
}
```

## Valid primaryProblem values
kids_deserved_better, voice_taken, pain_not_believed, world_losing, life_not_yours, feeling_stupid, locked_out, work_treated_nothing, left_behind, forgot_what_for, stopped_wondering, work_hollows

## Valid primarySkills values
storytelling, teaching, coaching, performing, creating, building, designing, leading, connecting, speaking_up

## Existing playSkill vocabulary (REUSE where applicable)
- Be warm and real on screen every day
- Break down a hard idea so anyone gets it
- Build community through consistency
- Certify others to carry your method
- Challenge scientific orthodoxy from lived experience
- Channel spiritual energy on stage
- Coach someone through a block
- Codify a practice into a teachable method
- Command a room of 10,000
- Connect dots across two worlds
- Create community from a camera
- Facilitate a hard conversation
- Give patient, useful feedback
- Hold space for a hard moment
- Hold space for decades without burning out
- Hold space for the unspeakable
- Make a confusing thing feel obvious
- Make ancient texts feel modern
- Make beginners feel safe
- Make complex psychology simple
- Make meaning out of a mess
- Mentor someone earlier on the path
- Move someone from stuck to action
- Name what everyone is feeling but won't say
- Rally a group behind an idea
- Reduce complex theory to one question
- Say the thing people are thinking but will not
- Start a lineage from a living room
- Teach by showing your own journey
- Teach someone something they are stuck on
- Teach through the body, not the mind
- Tell a story that lands
- Translate ancient wisdom for modern ears
- Turn curiosity into consistent content
- Turn personal crisis into collective awakening
- Turn private pain into public healing
- Turn research into transformation
- Turn your mess into a movement
- Use personal trauma as origin story
- Use your own body as proof
- Use your own breakdown as the teaching

## Style notes
- oneLiner should be punchy, specific, and ideally not a direct quote but a characterisation. No em dashes.
- trajectory should include specific ages/years where possible
- lessonsForUser should follow pattern: "If you [skill] and care about [domain]: [specific actionable lesson]"
- playSkill "skill" field should be a short imperative phrase (5-10 words), felt and action-oriented
- playSkill "evidence" should cite specific facts (numbers, dates, named works)
- antiTags explain what the person explicitly does NOT do
- Each person needs 4-6 playSkills and 1-2 antiTags
