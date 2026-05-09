#!/usr/bin/env node
/**
 * Insert 15 new spiritual/conscious leaders into all 5 data JSON files.
 * Run: node scripts/insert-new-creators.js
 */

const fs = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'public', 'data')

// Load clean data
const cleanData = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'docs', 'new-creators-clean.json'), 'utf8'))

// ─── PlaySkills (compiled from research agents) ───────────────────────────
const playSkills = [
  {
    name: "Eckhart Tolle",
    dominantCategories: ["teaching", "coaching"],
    playSkills: [
      { category: "teaching", skill: "Reduce complex theory to one question", confidence: "high", evidence: "Distilled all spiritual teaching into one question, 'Are you present?', reaching 50M+ book sales in 50+ languages" },
      { category: "coaching", skill: "Hold space for decades without burning out", confidence: "high", evidence: "Has taught the same core message since 1997 without diluting it, now 78 and still leading retreats" },
      { category: "speaking_up", skill: "Name what everyone is feeling but won't say", confidence: "high", evidence: "The Power of Now articulated the universal experience of mental suffering in language that resonated across cultures and religions" },
      { category: "teaching", skill: "Make silence feel like the answer", confidence: "high", evidence: "Famous for long pauses in talks and retreats, making stillness itself the teaching rather than words about stillness" }
    ],
    antiTags: [
      { category: "performing", skill: "Command attention through energy and charisma", evidence: "Deliberately avoids performance energy. The quieter he gets, the more powerful the room becomes." },
      { category: "building", skill: "Build operational systems and organizations", evidence: "Never built a certification empire or scaled through instructors. His presence is the product, not a method others deliver." }
    ]
  },
  {
    name: "Deepak Chopra",
    dominantCategories: ["teaching", "leading"],
    playSkills: [
      { category: "teaching", skill: "Translate ancient wisdom for modern ears", confidence: "high", evidence: "Repackaged 5,000 years of Ayurveda into 90+ books translated into 43 languages" },
      { category: "leading", skill: "Certify others to carry your method", confidence: "high", evidence: "Built Chopra Global certification spanning coaching, health, meditation, and yoga, creating thousands of branded practitioners" },
      { category: "coaching", skill: "Connect dots across two worlds", confidence: "high", evidence: "Combined endocrinology credentials with Maharishi's TM teachings, bridging Western medicine and Eastern wisdom" },
      { category: "speaking_up", skill: "Challenge scientific orthodoxy from lived experience", confidence: "high", evidence: "Left chief of staff role to publicly advocate that consciousness shapes biology" },
      { category: "performing", skill: "Command a room of 10,000", confidence: "high", evidence: "Keynotes at global conferences, Oprah appearances, and sold-out events for 30+ years" }
    ],
    antiTags: [
      { category: "creating", skill: "Make something that did not exist yesterday", evidence: "His power is volume and consistency, not one defining creative masterpiece." }
    ]
  },
  {
    name: "Jack Kornfield",
    dominantCategories: ["teaching", "connecting"],
    playSkills: [
      { category: "teaching", skill: "Make ancient texts feel modern", confidence: "high", evidence: "A Path with Heart and The Wise Heart translated 2,500 years of Buddhist psychology into practical guides for Western seekers" },
      { category: "connecting", skill: "Build community through consistency", confidence: "high", evidence: "Co-founded IMS (1975) and Spirit Rock (1987), two institutions anchoring American Buddhism for 50 years" },
      { category: "coaching", skill: "Hold space for decades without burning out", confidence: "high", evidence: "Has taught meditation continuously since 1974, over 50 years, while raising a family and earning a PhD" },
      { category: "teaching", skill: "Codify a practice into a teachable method", confidence: "high", evidence: "2-year Mindfulness Meditation Teacher Certification (with Tara Brach) has trained thousands of certified teachers" },
      { category: "coaching", skill: "Make beginners feel safe", confidence: "high", evidence: "Known for warmth and humour that makes meditation feel accessible. Spirit Rock deliberately designed to welcome newcomers." }
    ],
    antiTags: [
      { category: "performing", skill: "Command attention through energy and charisma", evidence: "Never uses spectacle or showmanship. His teaching power comes from gentleness, not intensity." }
    ]
  },
  {
    name: "Sam Harris",
    dominantCategories: ["teaching", "speaking_up"],
    playSkills: [
      { category: "speaking_up", skill: "Say the thing people are thinking but will not", confidence: "high", evidence: "The End of Faith directly challenged religious faith post-9/11, spending 33 weeks on the NYT bestseller list" },
      { category: "teaching", skill: "Make complex psychology simple", confidence: "high", evidence: "Waking Up app distils 30+ years of contemplative practice and a neuroscience PhD into 10-minute daily guided meditations" },
      { category: "teaching", skill: "Reduce complex theory to one question", confidence: "high", evidence: "Centres his entire meditation teaching around one question: 'Can you find the one who is looking?'" },
      { category: "speaking_up", skill: "Challenge scientific orthodoxy from lived experience", confidence: "high", evidence: "As a neuroscientist, publicly argued that consciousness is the hard problem science can't solve, based on contemplative experience" }
    ],
    antiTags: [
      { category: "performing", skill: "Channel spiritual energy on stage", evidence: "Never uses charisma or emotional performance. His power is in the argument, not the delivery." },
      { category: "connecting", skill: "Build community through consistency", evidence: "Deliberately avoids community-building or sangha. The app is individual practice, not group belonging." }
    ]
  },
  {
    name: "Thich Nhat Hanh",
    dominantCategories: ["teaching", "connecting"],
    playSkills: [
      { category: "teaching", skill: "Make a confusing thing feel obvious", confidence: "high", evidence: "Turned Buddhist philosophy into instructions anyone can follow: 'Wash the dishes to wash the dishes.' 100+ books in language a child could understand." },
      { category: "connecting", skill: "Build community through consistency", confidence: "high", evidence: "Founded 11 monasteries, 1,000+ local sanghas across 40 countries, and the Order of Interbeing" },
      { category: "coaching", skill: "Hold space for the unspeakable", confidence: "high", evidence: "Guided veterans, refugees, and trauma survivors through mindfulness retreats for decades" },
      { category: "speaking_up", skill: "Turn personal crisis into collective awakening", confidence: "high", evidence: "Transformed exile from Vietnam into a global peace movement. MLK nominated him for the Nobel Peace Prize." },
      { category: "teaching", skill: "Make beginners feel safe", confidence: "high", evidence: "The Miracle of Mindfulness was written as a manual for burned-out social workers, designed to be practised by anyone under any conditions" }
    ],
    antiTags: [
      { category: "performing", skill: "Command attention through energy and charisma", evidence: "Never performed or entertained. His public presence was indistinguishable from his private practice." },
      { category: "building", skill: "Build operational systems and organizations", evidence: "Everything runs on dana (generosity) and monastic labour, not commercial systems." }
    ]
  },
  {
    name: "Seane Corn",
    dominantCategories: ["coaching", "speaking_up"],
    playSkills: [
      { category: "coaching", skill: "Hold space for the unspeakable", confidence: "high", evidence: "Created yoga programs at Children of the Night shelter for adolescent sex workers, taught in brothels across India, Cambodia, and Africa" },
      { category: "speaking_up", skill: "Turn private pain into public healing", confidence: "high", evidence: "Built Off the Mat, Into the World from personal trauma work, training 1000+ activist leaders and raising $3.5M" },
      { category: "teaching", skill: "Teach through the body, not the mind", confidence: "high", evidence: "30+ years of vinyasa teaching integrating trauma awareness, emotional processing, and somatic release" },
      { category: "leading", skill: "Rally a group behind an idea", confidence: "high", evidence: "Global Seva Challenge mobilized thousands of yoga practitioners into fundraising campaigns across multiple countries" }
    ],
    antiTags: [
      { category: "building", skill: "Build a system from scratch", evidence: "Her work is relational and embodied, not systems-oriented. She builds movements through personal connection." }
    ]
  },
  {
    name: "Joe Dispenza",
    dominantCategories: ["teaching", "coaching"],
    playSkills: [
      { category: "teaching", skill: "Turn research into transformation", confidence: "high", evidence: "Partnered with UCSD, Harvard, and Stanford to research meditation effects, translating findings into practical retreat protocols" },
      { category: "coaching", skill: "Codify a practice into a teachable method", confidence: "high", evidence: "Built a tiered system (progressive to advanced retreats) with 200+ certified NeuroChangeSolutions consultants" },
      { category: "speaking_up", skill: "Use your own body as proof", confidence: "high", evidence: "Healed 6 crushed vertebrae without surgery at age 24, uses this story as the foundation of all his teaching" },
      { category: "teaching", skill: "Make complex psychology simple", confidence: "high", evidence: "3 NYT bestsellers translating neuroscience into accessible daily meditation practices" }
    ],
    antiTags: [
      { category: "performing", skill: "Channel spiritual energy on stage", evidence: "His style is methodical and structured, not improvisational. Retreats follow precise protocols rather than spontaneous energy." }
    ]
  },
  {
    name: "Aubrey Marcus",
    dominantCategories: ["storytelling", "connecting"],
    playSkills: [
      { category: "storytelling", skill: "Use your own breakdown as the teaching", confidence: "high", evidence: "Publicly shared relationship breakdowns, psychedelic experiences, and personal struggles across 500+ podcast episodes" },
      { category: "connecting", skill: "Facilitate a hard conversation", confidence: "high", evidence: "Fit for Service fellowship integrates plant medicine ceremony with group coaching, creating deep vulnerability among participants" },
      { category: "coaching", skill: "Move someone from stuck to action", confidence: "high", evidence: "Own the Day, Own Your Life became a NYT bestseller by turning daily optimisation into actionable protocols" },
      { category: "speaking_up", skill: "Say the thing people are thinking but will not", confidence: "high", evidence: "First mainstream voice for psychedelic medicine in 2011, years before the psychedelic renaissance became culturally acceptable" }
    ],
    antiTags: [
      { category: "building", skill: "Build a system from scratch", evidence: "Post-Onnit, his work is relational and experiential rather than product-based. He intentionally moved toward holding space." }
    ]
  },
  {
    name: "Ram Dass",
    dominantCategories: ["teaching", "storytelling"],
    playSkills: [
      { category: "teaching", skill: "Translate ancient wisdom for modern ears", confidence: "high", evidence: "Be Here Now sold 2M+ copies translating Hindu devotional practice into language American counterculture could absorb" },
      { category: "storytelling", skill: "Turn personal crisis into collective awakening", confidence: "high", evidence: "Transformed his 1997 stroke into the teaching Still Here, reframing disability as spiritual practice for millions" },
      { category: "connecting", skill: "Build community through consistency", confidence: "high", evidence: "Gave lectures and retreats continuously from 1968 to 2019, over 50 years, even after stroke left him in a wheelchair" },
      { category: "coaching", skill: "Hold space for decades without burning out", confidence: "high", evidence: "Co-founded Seva Foundation (restored sight to millions) and Hanuman Foundation, sustaining service across five decades" }
    ],
    antiTags: [
      { category: "building", skill: "Build a system from scratch", evidence: "Deliberately avoided building systems around himself. Founded organisations then handed them to others." },
      { category: "leading", skill: "Pick what matters and cut the rest", evidence: "His leadership model was anti-hierarchical by design. He preferred to fund and empower others rather than direct." }
    ]
  },
  {
    name: "Sadhguru",
    dominantCategories: ["teaching", "leading"],
    playSkills: [
      { category: "teaching", skill: "Reduce complex theory to one question", confidence: "high", evidence: "Inner Engineering distils yoga science into a single 21-minute kriya practice that millions perform daily" },
      { category: "leading", skill: "Rally a group behind an idea", confidence: "high", evidence: "Rally for Rivers campaign drove a 30-day, 9,300km solo motorcycle journey across India, reaching 162M people" },
      { category: "speaking_up", skill: "Challenge scientific orthodoxy from lived experience", confidence: "high", evidence: "Consecrated Dhyanalinga through a 3-year energy process that has no scientific framework, yet draws millions of visitors" },
      { category: "performing", skill: "Command a room of 10,000", confidence: "high", evidence: "Fills stadiums worldwide, addressed UN General Assembly, World Economic Forum, received India's Padma Vibhushan" }
    ],
    antiTags: [
      { category: "creating", skill: "Make something that did not exist yesterday", evidence: "Transmits ancient yogic traditions rather than creating new art. His innovation is in delivery and scale, not originating new practices." }
    ]
  },
  {
    name: "Marianne Williamson",
    dominantCategories: ["teaching", "speaking_up", "coaching"],
    playSkills: [
      { category: "teaching", skill: "Make ancient texts feel modern", confidence: "high", evidence: "Translated A Course in Miracles into accessible language, selling 3M+ books across 17 titles with 4 reaching #1 NYT" },
      { category: "speaking_up", skill: "Say the thing people are thinking but will not", confidence: "high", evidence: "Ran for president twice on a platform of love and reparations, bringing spiritual language into prime-time political debate" },
      { category: "coaching", skill: "Hold space for the unspeakable", confidence: "high", evidence: "Founded Project Angel Food in 1989, delivering 400 meals daily to homebound AIDS patients when most organisations refused" },
      { category: "performing", skill: "Channel spiritual energy on stage", confidence: "high", evidence: "Packed weekly lectures in LA churches for decades with a voluntary donation model" }
    ],
    antiTags: [
      { category: "building", skill: "Build a system from scratch", evidence: "Chose the lecture circuit and writing life over building an organisation. Presidential campaigns notable for lack of traditional infrastructure." }
    ]
  },
  {
    name: "Mooji",
    dominantCategories: ["coaching", "teaching"],
    playSkills: [
      { category: "coaching", skill: "Hold space for decades without burning out", confidence: "high", evidence: "Has given satsang continuously since 1999, regularly drawing 1000+ people from 50+ nationalities" },
      { category: "teaching", skill: "Reduce complex theory to one question", confidence: "high", evidence: "Distilled Advaita Vedanta into a single repeated inquiry, 'Who am I?', accessible to complete beginners" },
      { category: "connecting", skill: "Build community through consistency", confidence: "high", evidence: "Built Monte Sahaja ashram in Portugal with 40-60 full-time residents and a global network of sangha groups" },
      { category: "performing", skill: "Be warm and real on screen every day", confidence: "high", evidence: "828K YouTube subscribers with satsang videos regularly reaching hundreds of thousands of views" }
    ],
    antiTags: [
      { category: "building", skill: "Build a system from scratch", evidence: "Monte Sahaja runs on volunteer labour and donations. Mooji rejects corporate structure and has no marketing team." },
      { category: "creating", skill: "Make something that did not exist yesterday", evidence: "His teaching is the absence of adding. He points to what already exists rather than building new frameworks." }
    ]
  },
  {
    name: "Yung Pueblo",
    dominantCategories: ["storytelling", "creating"],
    playSkills: [
      { category: "storytelling", skill: "Turn private pain into public healing", confidence: "high", evidence: "5 books selling nearly 2M copies worldwide, all drawn directly from his own healing journey through Vipassana meditation" },
      { category: "creating", skill: "Turn curiosity into consistent content", confidence: "high", evidence: "Built 4.5M social following and a Substack by writing daily about what he was learning in real time" },
      { category: "connecting", skill: "Build community through consistency", confidence: "high", evidence: "Named TIME100 Creator in 2025, cofounded Wisdom Ventures and built Ready relationship app from his audience" },
      { category: "teaching", skill: "Make complex psychology simple", confidence: "high", evidence: "Translated Vipassana concepts like impermanence, equanimity, and emotional maturity into plain-language poetry in 25+ languages" }
    ],
    antiTags: [
      { category: "performing", skill: "Rally a group behind an idea", evidence: "Despite activism background, explicitly moved toward inward focus. His message is that outer change follows inner healing." }
    ]
  },
  {
    name: "Sahara Rose",
    dominantCategories: ["teaching", "coaching", "connecting"],
    playSkills: [
      { category: "teaching", skill: "Translate ancient wisdom for modern ears", confidence: "high", evidence: "Turned Ayurveda and Vedic philosophy into bestselling books with Deepak Chopra forewords, reaching a millennial audience" },
      { category: "coaching", skill: "Certify others to carry your method", confidence: "high", evidence: "Founded Highest Self Institute (formerly Dharma Coaching Institute), training 2000+ certified dharma and spiritual life coaches" },
      { category: "connecting", skill: "Create community from a camera", confidence: "high", evidence: "Built Rose Gold Goddesses to 2000+ members and Highest Self Podcast to 25M+ downloads through consistent solo episodes" },
      { category: "performing", skill: "Channel spiritual energy on stage", confidence: "high", evidence: "Hosts channelled solocasts, sacred feminine workshops, and embodiment events blending spirituality with movement" }
    ],
    antiTags: [
      { category: "building", skill: "Build a system from scratch", evidence: "Has cycled through multiple business models rather than systematizing one. Her energy is creative expansion, not operational efficiency." }
    ]
  },
  {
    name: "Sri Sri Ravi Shankar",
    dominantCategories: ["leading", "teaching", "connecting"],
    playSkills: [
      { category: "leading", skill: "Rally a group behind an idea", confidence: "high", evidence: "Built Art of Living into a volunteer-run movement across 180 countries with 11,000+ certified teachers" },
      { category: "teaching", skill: "Teach through the body, not the mind", confidence: "high", evidence: "Sudarshan Kriya breathing technique is the core of all courses, taught physically before any philosophy" },
      { category: "connecting", skill: "Build community through consistency", confidence: "high", evidence: "Art of Living has maintained continuous operations since 1981, 45 years of unbroken teaching" },
      { category: "speaking_up", skill: "Facilitate a hard conversation", confidence: "high", evidence: "Mediated conflict in Colombia, Iraq, and Sri Lanka, and runs prison rehabilitation programmes in dozens of countries" }
    ],
    antiTags: [
      { category: "creating", skill: "Make something that did not exist yesterday", evidence: "Positions himself as a channel for ancient Vedic wisdom, not an original creator. Authority comes from transmission, not innovation." }
    ]
  }
]

// ─── Insert into careerModels.json ─────────────────────────────────────────
console.log('Inserting into careerModels.json...')
const cmPath = path.join(DATA_DIR, 'careerModels.json')
const cm = JSON.parse(fs.readFileSync(cmPath, 'utf8'))
for (const entry of cleanData.careerModels) {
  // Check not already present
  if (!cm.profiles.find(p => p.name === entry.name)) {
    cm.profiles.push(entry)
  }
}
cm.meta.totalProfiles = cm.profiles.filter(p => p.careerModel).length
cm.meta.totalPeople = cm.profiles.length
// Recount confidence
let high = 0, medium = 0, low = 0
cm.profiles.forEach(p => {
  const c = p.confidence
  if (c === 'high' || c >= 80) high++
  else if (c === 'medium' || (c >= 50 && c < 80)) medium++
  else low++
})
cm.meta.confidenceDistribution = { high, medium, low }
// Recount source
let founder = 0, nonfounder = 0
cm.profiles.forEach(p => {
  if (p.source === 'founder') founder++
  else nonfounder++
})
cm.meta.sourceDistribution = { founder, nonfounder }
fs.writeFileSync(cmPath, JSON.stringify(cm, null, 2))
console.log(`  careerModels: ${cm.profiles.length} profiles`)

// ─── Insert into experienceCreatorDNA.json ─────────────────────────────────
console.log('Inserting into experienceCreatorDNA.json...')
const dnaPath = path.join(DATA_DIR, 'experienceCreatorDNA.json')
const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf8'))
for (const entry of cleanData.experienceCreatorDNA) {
  if (!dna.profiles.find(p => p.name === entry.name)) {
    dna.profiles.push(entry)
  }
}
dna.meta.totalProfiles = dna.profiles.length
fs.writeFileSync(dnaPath, JSON.stringify(dna, null, 2))
console.log(`  DNA: ${dna.profiles.length} profiles`)

// ─── Insert into experienceCreatorOfferMap.json ────────────────────────────
console.log('Inserting into experienceCreatorOfferMap.json...')
const omPath = path.join(DATA_DIR, 'experienceCreatorOfferMap.json')
const om = JSON.parse(fs.readFileSync(omPath, 'utf8'))
for (const [name, entry] of Object.entries(cleanData.experienceCreatorOfferMap)) {
  if (!om.creators[name]) {
    om.creators[name] = entry
  }
}
om.meta.totalCreators = Object.keys(om.creators).length
fs.writeFileSync(omPath, JSON.stringify(om, null, 2))
console.log(`  OfferMap: ${om.meta.totalCreators} creators`)

// ─── Insert into experienceCreatorGrowthStrategies.json ────────────────────
console.log('Inserting into experienceCreatorGrowthStrategies.json...')
const gsPath = path.join(DATA_DIR, 'experienceCreatorGrowthStrategies.json')
const gs = JSON.parse(fs.readFileSync(gsPath, 'utf8'))
for (const [name, entry] of Object.entries(cleanData.experienceCreatorGrowthStrategies)) {
  if (!gs.creators[name]) {
    gs.creators[name] = entry
  }
}
if (gs.meta) gs.meta.count = Object.keys(gs.creators).length
fs.writeFileSync(gsPath, JSON.stringify(gs, null, 2))
console.log(`  GrowthStrategies: ${Object.keys(gs.creators).length} creators`)

// ─── Insert into nonFounderPlaySkills.json ─────────────────────────────────
console.log('Inserting into nonFounderPlaySkills.json...')
const psPath = path.join(DATA_DIR, 'nonFounderPlaySkills.json')
const ps = JSON.parse(fs.readFileSync(psPath, 'utf8'))
for (const entry of playSkills) {
  if (!ps.profiles.find(p => p.name === entry.name)) {
    ps.profiles.push(entry)
  }
}
ps.meta.totalProfiles = ps.profiles.length
fs.writeFileSync(psPath, JSON.stringify(ps, null, 2))
console.log(`  PlaySkills: ${ps.profiles.length} profiles`)

console.log('\nDone! All 15 creators inserted.')
