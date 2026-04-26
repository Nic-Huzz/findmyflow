/**
 * ExperienceCreatorFlow.jsx — /experience-creators
 * Browse experience creators by business model archetype,
 * select who resonates, get a product suite recommendation.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ExperienceCreatorFlow.css'

// ── Data imports ──
import dnaData from '../../public/data/experienceCreatorDNA.json'
import careerModelsData from '../../public/data/careerModels.json'
import growthData from '../../public/data/experienceCreatorGrowthStrategies.json'
import playSkillData from '../../public/data/nonFounderPlaySkills.json'

// ── Category definitions ──
const CATEGORIES = [
  { id: 'workshop', label: 'Workshops & Training', emoji: '🎓', subtitle: 'Build expertise, teach it live, certify others', types: ['workshop', 'certification'] },
  { id: 'performance', label: 'Live Events & Performance', emoji: '🎭', subtitle: 'Fill rooms with transformation, art, or catharsis', types: ['performance', 'live_events', 'live_tour'] },
  { id: 'cohort', label: 'Cohorts & Courses', emoji: '👥', subtitle: 'Structured group programmes with start and end dates', types: ['cohort'] },
  { id: 'books_media', label: 'Books, Content & Media', emoji: '📚', subtitle: 'Build audience through content, monetize through authority', types: ['book_newsletter', 'media_training', 'author_mentor', 'consultancy'] },
  { id: 'facilitation', label: 'Facilitation & Community', emoji: '🤝', subtitle: 'Gather people and hold space for what needs to happen', types: ['facilitation'] },
  { id: 'retreats', label: 'Retreats & Immersive', emoji: '🏔️', subtitle: 'Design deep, contained experiences that transform', types: ['retreat', 'immersive', 'membership', 'education', 'food'] },
]

// ── Archetype descriptions ──
const ARCHETYPE_INFO = {
  workshop: { name: 'Workshops & Training', desc: 'You build deep expertise, codify it into a method, then teach it live.' },
  performance: { name: 'Live Events & Performance', desc: 'You fill rooms with energy, transformation, or art. The live experience IS the product.' },
  cohort: { name: 'Cohorts & Courses', desc: 'You design structured group programmes that take people from A to B together.' },
  books_media: { name: 'Books, Content & Media', desc: 'You build authority through content, then monetize through speaking, consulting, or products.' },
  facilitation: { name: 'Facilitation & Community', desc: 'You gather people and create the conditions for transformation to happen between them.' },
  retreats: { name: 'Retreats & Immersive', desc: 'You design deep, contained experiences that people enter one way and leave another.' },
}

// ── Per-archetype offer layer templates ──
const ARCHETYPE_OFFERS = {
  workshop: {
    attraction: { name: 'Free content that demonstrates your method', desc: 'Books, podcast, talks, or free workshops that let people experience your approach before they pay.' },
    core: { name: 'Live workshop or training ($500-$5K)', desc: 'A structured transformation you deliver live. This is what people come to you for.' },
    continuity: { name: 'Online courses + digital products', desc: 'Recorded versions, workbooks, or membership content that earns while you teach.' },
  },
  performance: {
    attraction: { name: 'Free performances or content', desc: 'Social media clips, free shows, or viral moments that build your audience.' },
    core: { name: 'Live performance or event ($50-$5K)', desc: 'The live experience you deliver. Concerts, shows, speaking, or immersive events.' },
    continuity: { name: 'Recordings, merch, or licensing', desc: 'Albums, video content, merchandise, or licensing deals that earn between shows.' },
  },
  cohort: {
    attraction: { name: 'Free content that builds trust weekly', desc: 'YouTube, podcast, newsletter, or social content that gives value 50 weeks a year.' },
    core: { name: 'Cohort-based programme ($1K-$5K)', desc: 'A structured group programme with a start date, end date, and community.' },
    continuity: { name: 'Digital products + brand partnerships', desc: 'Templates, tools, sponsorships, or alumni community that generates recurring revenue.' },
  },
  books_media: {
    attraction: { name: 'Newsletter or podcast (free, consistent)', desc: 'Weekly content that builds a direct relationship with your audience over years.' },
    core: { name: 'Book, keynote, or consulting', desc: 'Your main authority product. Could be a book that sells itself, or high-fee speaking and consulting.' },
    continuity: { name: 'Royalties, products, or online classes', desc: 'Book royalties, workbooks, card games, or online courses that earn passively.' },
  },
  facilitation: {
    attraction: { name: 'Published framework or free gatherings', desc: 'A book, article, or free event that shows how you think about bringing people together.' },
    core: { name: 'Facilitated experience ($500-$10K)', desc: 'Premium facilitation for organisations, private groups, or communities. You design the room.' },
    continuity: { name: 'Retainer clients or ongoing community', desc: 'Recurring facilitation relationships, community membership, or programme licensing.' },
  },
  retreats: {
    attraction: { name: 'Free talks, app, or content', desc: 'Meditation recordings, YouTube, podcasts, or free workshops that let people taste the experience.' },
    core: { name: 'Retreat or immersive experience ($500-$5K)', desc: 'A contained, multi-day experience that people enter one way and leave another.' },
    continuity: { name: 'Online courses, app, or membership', desc: 'Digital practice tools, subscription content, or ongoing community that sustains between retreats.' },
  },
}

// ── Play-skill matching ──
// Build a map of creator name → dominantCategories (play-skills)
const CREATOR_SKILLS = {}
playSkillData.profiles.forEach(p => {
  if (p.dominantCategories?.length) CREATOR_SKILLS[p.name] = p.dominantCategories
})

// Growth category → pattern statement templates
const PATTERN_STATEMENTS = {
  free_content: "started by creating content nobody asked for. Blogs, videos, newsletters. Not because it paid. Because they had something to say.",
  free_events: "started by gathering people in rooms. Free workshops, community events, open classes. Not because it was a business. Because they couldn't stop bringing people together.",
  academic: "started by going deep. Research, clinical work, years of study. Not because the market rewarded it. Because understanding the thing mattered more than selling it.",
  grassroots: "started by organising. Local communities, activism, word of mouth. Not because it scaled. Because the cause was louder than the career plan.",
  one_project: "started with one project that broke through. One book, one talk, one piece of work that couldn't be ignored.",
  apprenticeship: "started by learning under someone else. Institutions, mentors, long apprenticeships. Not because it was fast. Because mastery required it.",
  clinical: "started with one person at a time. Clients, patients, 1:1 work. Not because it scaled. Because the transformation happened in the room.",
}

// Play-skill display names
const SKILL_DISPLAY = {
  storytelling: 'storytelling', teaching: 'teaching', coaching: 'coaching',
  performing: 'performing', creating: 'creating', building: 'building',
  designing: 'designing', leading: 'leading', connecting: 'connecting',
  speaking_up: 'speaking up',
}


// Find the shared play-skill between user's skills and selected creators
function findPlaySkillMatch(userSkills, selectedNames) {
  if (!userSkills?.length) return null

  // Count how many selected creators share each of the user's skills
  const skillOverlap = {}
  for (const skill of userSkills) {
    skillOverlap[skill] = 0
    for (const name of selectedNames) {
      const creatorSkills = CREATOR_SKILLS[name] || []
      if (creatorSkills.includes(skill)) skillOverlap[skill]++
    }
  }

  // Find the skill with the most overlap
  const best = Object.entries(skillOverlap).sort((a, b) => b[1] - a[1])[0]
  if (!best || best[1] === 0) return null
  return { skill: best[0], matchCount: best[1] }
}

// Build cross-creator pattern from growth strategies
function buildPattern(creatorNames) {
  const categoryCounts = {}
  for (const name of creatorNames) {
    const gs = growthData.creators?.[name]
    if (!gs?.growth_category) continue
    categoryCounts[gs.growth_category] = (categoryCounts[gs.growth_category] || 0) + 1
  }
  if (Object.keys(categoryCounts).length === 0) return null
  const [topCategory, topCount] = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
  return {
    category: topCategory,
    count: topCount,
    total: creatorNames.length,
    statement: PATTERN_STATEMENTS[topCategory] || PATTERN_STATEMENTS.free_events,
  }
}

// Find all creators in corpus who share a play-skill
function findCreatorsWithSkill(skill, excludeNames = []) {
  const excludeSet = new Set(excludeNames)
  const matches = []
  for (const [name, skills] of Object.entries(CREATOR_SKILLS)) {
    if (skills.includes(skill) && !excludeSet.has(name)) {
      const gs = growthData.creators?.[name]
      if (gs) matches.push({ name, ...gs })
    }
  }
  return matches.slice(0, 5)
}

// ── First steps per archetype ──
const FIRST_STEPS = {
  workshop: 'Run one free workshop on your topic this month. Every person you selected started the same way: teaching for free in the smallest room available.',
  performance: 'Book one small venue and sell 20 tickets to a 2-hour experience. Start with the room, not the arena.',
  cohort: 'Write 10 free posts on your topic, then invite 10 people to a paid pilot. The first cohort is always small.',
  books_media: 'Publish weekly for 3 months before building any paid product. Build the audience first, the product second.',
  facilitation: 'Gather 8 people in a room and facilitate one conversation. The room is the product.',
  retreats: 'Design a 1-day experience and run it for 6 people. Depth before scale.',
}

// ── Build creator data ──
function buildCreatorData() {
  const creators = dnaData.profiles.filter(p => p.experienceType)
  const cmMap = {}
  careerModelsData.profiles.forEach(p => { cmMap[p.name] = p })

  return creators.map(dna => {
    const cm = cmMap[dna.name] || {}
    const slug = dna.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
    const category = CATEGORIES.find(c => c.types.includes(dna.experienceType))

    return {
      name: dna.name,
      slug,
      oneLiner: cm.oneLiner || '',
      experienceType: dna.experienceType,
      categoryId: category?.id || 'workshop',
      image: `/images/creators/${slug}.png`,
      modelTag: cm.careerModel?.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || dna.experienceType,
    }
  })
}

export default function ExperienceCreatorFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isTryRoute = window.location.pathname.startsWith('/try/')
  const [screen, setScreen] = useState('browse') // 'browse' | 'result'
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [tryEmail, setTryEmail] = useState('')
  const [trySaving, setTrySaving] = useState(false)
  const [trySaved, setTrySaved] = useState(false)
  const [userSkills, setUserSkills] = useState([])
  const [chosenArchetype, setChosenArchetype] = useState(null)

  // Fetch user's play-skill categories from onboarding (stored in nikigai_clusters.items[].category)
  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase
        .from('nikigai_clusters')
        .select('items')
        .eq('user_id', user.id)
        .eq('cluster_type', 'skills')
      if (!data?.length) return
      // Extract unique category IDs from items arrays
      const categories = new Set()
      for (const row of data) {
        const items = row.items || []
        for (const item of items) {
          if (item.category) categories.add(item.category)
        }
      }
      if (categories.size > 0) setUserSkills([...categories])
    })()
  }, [user])


  const allCreators = useMemo(() => buildCreatorData(), [])

  // Group creators by category, famous names first
  const grouped = useMemo(() => {
    const FEATURED = new Set([
      'Brené Brown', 'Wim Hof', 'Tony Robbins', 'Glennon Doyle',
      'Marie Forleo', 'Ali Abdaal', 'James Clear', 'Simon Sinek',
      'Esther Perel', 'Elizabeth Gilbert', 'Priya Parker', 'Gloria Steinem',
      'Gabor Mate', 'Adriene Mishler', 'Walt Disney', 'Jay Shetty',
      'Lin-Manuel Miranda', 'Nina Simone', 'Dave Ramsey', 'Tara Brach',
      'Joseph Campbell', 'Gabby Bernstein',
    ])
    const groups = {}
    for (const cat of CATEGORIES) {
      const catCreators = allCreators.filter(c => c.categoryId === cat.id)
      catCreators.sort((a, b) => {
        const aFeat = FEATURED.has(a.name) ? 0 : 1
        const bFeat = FEATURED.has(b.name) ? 0 : 1
        return aFeat - bFeat
      })
      groups[cat.id] = catCreators
    }
    return groups
  }, [allCreators])

  // Toggle selection
  const toggleSelect = useCallback((name) => {
    hapticLight()
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }, [])

  // Determine dominant archetype from selections
  const dominantArchetype = useMemo(() => {
    if (selected.size === 0) return null
    const counts = {}
    for (const name of selected) {
      const creator = allCreators.find(c => c.name === name)
      if (creator) {
        counts[creator.categoryId] = (counts[creator.categoryId] || 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'workshop'
  }, [selected, allCreators])

  // Get selected creator objects
  const selectedCreators = useMemo(() => {
    return allCreators.filter(c => selected.has(c.name))
  }, [selected, allCreators])

  // Show result
  const showResult = () => {
    if (selected.size === 0) return
    hapticSuccess()
    setScreen('result')
    window.scrollTo(0, 0)
  }

  // Back to browse
  const showBrowse = () => {
    setScreen('browse')
    window.scrollTo(0, 0)
  }

  // Save email + model for try route (anonymous users)
  const saveTryEmail = async () => {
    if (!tryEmail.trim() || trySaving) return
    setTrySaving(true)
    try {
      const archId = chosenArchetype || dominantArchetype || 'workshop'
      const baseOffers = ARCHETYPE_OFFERS[archId] || ARCHETYPE_OFFERS.workshop
      await supabase.from('experience_creator_leads').insert({
        email: tryEmail.trim().toLowerCase(),
        selected_creators: [...selected],
        dominant_archetype: archId,
        product_suite: {
          attraction: baseOffers.attraction?.name,
          core: baseOffers.core?.name,
          continuity: baseOffers.continuity?.name,
        },
      })
      setTrySaved(true)
      hapticSuccess()
    } catch (err) {
      console.error('Error saving lead:', err)
    }
    setTrySaving(false)
  }

  // Save to Supabase and navigate
  const saveModel = async () => {
    if (!user?.id) {
      navigate('/get-started')
      return
    }
    setLoading(true)
    try {
      const archId = chosenArchetype || dominantArchetype || 'workshop'
      const baseOffers = ARCHETYPE_OFFERS[archId] || ARCHETYPE_OFFERS.workshop
      const { error } = await supabase.from('experience_creator_selections').insert({
        user_id: user.id,
        selected_creators: [...selected],
        dominant_archetype: archId,
        product_suite: {
          attraction: baseOffers.attraction?.name,
          core: baseOffers.core?.name,
          continuity: baseOffers.continuity?.name,
        },
      })
      if (error) throw error
      hapticSuccess()
      navigate('/create')
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setLoading(false)
    }
  }

  // Pre-compute result screen data (must be before early returns to satisfy hooks rules)
  const archetype = ARCHETYPE_INFO[dominantArchetype] || ARCHETYPE_INFO.workshop
  const firstStep = FIRST_STEPS[dominantArchetype] || FIRST_STEPS.workshop
  const selectedNames = [...selected]


  // ── Play-List reveal data ──
  const playListReveal = useMemo(() => {
    if (selected.size === 0) return null
    const names = [...selected]

    // Find ALL overlapping skills (not just the top one)
    const allOverlaps = []
    if (userSkills.length > 0) {
      for (const skill of userSkills) {
        let count = 0
        for (const name of names) {
          const creatorSkills = CREATOR_SKILLS[name] || []
          if (creatorSkills.includes(skill)) count++
        }
        if (count > 0) allOverlaps.push({ skill, display: SKILL_DISPLAY[skill] || skill, count })
      }
      allOverlaps.sort((a, b) => b.count - a.count)
    }

    // Get first step from growth data
    const firstStepFromData = names.map(name => growthData.creators?.[name]?.first_step).find(Boolean)

    // Determine which archetype categories the selections span
    const archetypeCounts = {}
    for (const name of names) {
      const creator = allCreators.find(c => c.name === name)
      if (creator) archetypeCounts[creator.categoryId] = (archetypeCounts[creator.categoryId] || 0) + 1
    }
    const archetypesPresent = Object.entries(archetypeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => ({ id, ...ARCHETYPE_INFO[id], emoji: CATEGORIES.find(c => c.id === id)?.emoji || '✨' }))

    return {
      hasOverlap: allOverlaps.length > 0,
      sharedSkills: allOverlaps.slice(0, 4),
      archetypesPresent,
      firstStep: firstStepFromData || FIRST_STEPS[dominantArchetype],
    }
  }, [selected, userSkills, dominantArchetype, allCreators])

  // ── BROWSE SCREEN ──
  if (screen === 'browse') {
    return (
      <div className="ecf">
        {/* Hero */}
        <div className="ecf-hero">
          <div className="ecf-hero-badge">Experience Creator Matching</div>
          <h1>Who <span className="ecf-hero-gold">inspires</span> you?</h1>
          <p>Scroll through real people who built careers from experiences. Pick 3-5 who inspire you.</p>
        </div>

        <div className="ecf-container">
          {CATEGORIES.map((cat, catIdx) => (
            <div key={cat.id}>
              {catIdx > 0 && <div className="ecf-divider" />}
              <div className="ecf-category">
                <div className="ecf-category-header">
                  <span className="ecf-category-emoji">{cat.emoji}</span>
                  <span className="ecf-category-title">{cat.label}</span>
                </div>
                <p className="ecf-category-subtitle">{cat.subtitle}</p>
                <div className="ecf-people-row">
                  {(grouped[cat.id] || []).map(creator => (
                    <div
                      key={creator.name}
                      className={`ecf-person-card ${selected.has(creator.name) ? 'selected' : ''}`}
                      onClick={() => toggleSelect(creator.name)}
                    >
                      <img
                        src={creator.image}
                        alt={creator.name}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                      <div className="ecf-person-card-body">
                        <div className="ecf-person-card-name">{creator.name}</div>
                        <div className="ecf-person-card-oneliner">{creator.oneLiner}</div>
                        <div className="ecf-person-card-model">{creator.modelTag}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selection Bar */}
        <div className={`ecf-selection-bar ${selected.size > 0 ? 'visible' : ''}`}>
          <div className="ecf-selection-bar-inner">
            <div className="ecf-selection-bar-left">
              <div className="ecf-selected-avatars">
                {selectedCreators.slice(0, 5).map(c => (
                  <img key={c.name} src={c.image} alt={c.name} />
                ))}
              </div>
              <div className="ecf-selection-count">
                <strong>{selected.size}</strong> selected
              </div>
            </div>
            <button className="ecf-results-btn" onClick={showResult}>
              See My Model →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── RESULT SCREEN ──
  const reveal = playListReveal
  return (
    <div className="ecf">
      <div className="ecf-container">
        <div className="ecf-result">
          <button className="ecf-back-link" onClick={showBrowse}>
            ← Back to browsing
          </button>

          {/* ═══ SECTION 1: Bridge + Play-skill tags ═══ */}
          <div className="ecf-result-header">
            <div className="ecf-result-badge">Their Play-List</div>
            <h1>What They Couldn't <span className="ecf-hero-gold">Stop</span></h1>
          </div>

          <div className="ecf-reveal-card">
            {reveal?.hasOverlap ? (
              <>
                <p className="ecf-reveal-bridge">
                  You didn't pick these people randomly. You share similar play-lists.
                </p>
                <div className="ecf-skill-tags">
                  {reveal.sharedSkills.map(s => (
                    <span key={s.skill} className="ecf-skill-tag">
                      {s.display}
                      <span className="ecf-skill-tag-count">{s.count} picks</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="ecf-reveal-bridge">
                Here's what your picks all did before anyone noticed.
              </p>
            )}
          </div>


          {/* ═══ SECTION 3: Which business model sounds most exciting? ═══ */}
          {reveal?.archetypesPresent?.length > 0 && (
            <div className="ecf-model-pick">
              <div className="ecf-model-pick-title">Which of these sounds most exciting to you?</div>
              <div className="ecf-model-options">
                {reveal.archetypesPresent.map(arch => (
                  <button
                    key={arch.id}
                    className={`ecf-model-option ${chosenArchetype === arch.id ? 'ecf-model-chosen' : ''}`}
                    onClick={() => { hapticLight(); setChosenArchetype(arch.id) }}
                  >
                    <span className="ecf-model-emoji">{arch.emoji}</span>
                    <div>
                      <div className="ecf-model-name">{arch.name}</div>
                      <div className="ecf-model-desc">{arch.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ═══ SECTION 4: First Step + Save ═══ */}
          <div className="ecf-first-step">
            <h3>Your First Step</h3>
            <p>{chosenArchetype ? (FIRST_STEPS[chosenArchetype] || firstStep) : (reveal?.firstStep || firstStep)}</p>

            {isTryRoute ? (
              trySaved ? (
                <div className="ecf-try-saved">
                  <p className="ecf-try-saved-text">Your model has been sent to <strong>{tryEmail}</strong></p>
                  <button className="ecf-save-btn" onClick={() => navigate('/get-started')}>
                    Click Here For Support Bringing It To Life
                  </button>
                </div>
              ) : (
                <div className="ecf-try-capture">
                  <input
                    type="email"
                    value={tryEmail}
                    onChange={(e) => setTryEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="ecf-try-email"
                    onKeyDown={(e) => e.key === 'Enter' && saveTryEmail()}
                  />
                  <button className="ecf-save-btn" onClick={saveTryEmail} disabled={trySaving || !tryEmail.trim()}>
                    {trySaving ? 'Sending...' : 'Send Me My Model'}
                  </button>
                </div>
              )
            ) : (
              <button className="ecf-save-btn" onClick={saveModel} disabled={loading || !chosenArchetype}>
                {loading ? 'Saving...' : 'Save My Model'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
