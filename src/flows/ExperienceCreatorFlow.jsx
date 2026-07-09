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
import { onCreatorMatchingComplete } from '../lib/brain/autoPopulate'
import { useSubscription } from '../hooks/useSubscription'
import './ExperienceCreatorFlow.css'

// ── Data imports ──
import dnaData from '../../public/data/experienceCreatorDNA.json'
import careerModelsData from '../../public/data/careerModels.json'
import growthData from '../../public/data/experienceCreatorGrowthStrategies.json'
import remarkableData from '../../public/data/experienceCreatorRemarkableAnalysis.json'
import offerMapData from '../../public/data/experienceCreatorOfferMap.json'
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
      displayName: cm.displayName || dna.name,
      slug,
      oneLiner: cm.oneLiner || '',
      experienceType: dna.experienceType,
      categoryId: category?.id || 'workshop',
      image: `/images/creators/${slug}.png`,
      modelTag: cm.careerModel?.type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || dna.experienceType,
    }
  })
}

export default function ExperienceCreatorFlow({ embedded = false, onComplete }) {
  const { user } = useAuth()
  const { hasSubscription } = useSubscription()
  const navigate = useNavigate()
  const isTryRoute = embedded || window.location.pathname.startsWith('/try/')
  const showAnswers = !isTryRoute && user && hasSubscription
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
    if (!embedded) window.scrollTo(0, 0)
  }

  // Back to browse
  const showBrowse = () => {
    setScreen('browse')
    if (!embedded) window.scrollTo(0, 0)
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
      onComplete?.()
    } catch (err) {
      console.error('Error saving lead:', err)
    }
    setTrySaving(false)
  }

  // Save to Supabase and navigate
  const saveModel = async () => {
    if (!user?.id) {
      navigate('/create')
      return
    }
    setLoading(true)
    try {
      const archId = chosenArchetype || dominantArchetype || 'workshop'
      const baseOffers = ARCHETYPE_OFFERS[archId] || ARCHETYPE_OFFERS.workshop
      const suite = {
        attraction: baseOffers.attraction?.name,
        core: baseOffers.core?.name,
        continuity: baseOffers.continuity?.name,
      }
      const { error } = await supabase.from('experience_creator_selections').insert({
        user_id: user.id,
        selected_creators: [...selected],
        dominant_archetype: archId,
        product_suite: suite,
      })
      if (error) throw error
      // Auto-populate brain
      onCreatorMatchingComplete(user.id, {
        dominantArchetype: archId,
        selectedCreators: [...selected],
        productSuite: suite,
      })
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
                        <div className="ecf-person-card-name">{creator.displayName}</div>
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
                  <img key={c.name} src={c.image} alt={c.name} onError={(e) => { e.target.style.display = 'none' }} />
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
  const remarkableCreators = remarkableData?.creators || {}
  const offerCreators = offerMapData?.creators || {}
  const growthCreators = growthData?.creators || {}

  // Helper for blurred text
  const BlurredText = ({ width = 120 }) => (
    <span className="ecf-blurred" style={{ width }}>
      <span className="ecf-blurred-inner">Hidden answer revealed on signup</span>
    </span>
  )

  return (
    <div className="ecf">
      <div className="ecf-container">
        <div className="ecf-result">
          <button className="ecf-back-link" onClick={showBrowse}>
            ← Back to browsing
          </button>

          <div className="ecf-result-header">
            <h1>Your <span className="ecf-hero-gold">Picks</span></h1>
            <p className="ecf-result-sub">{showAnswers ? 'Here\'s the full breakdown of how your picks built their careers.' : 'Here\'s what we know about the creators you chose. Sign up to unlock the full breakdown.'}</p>
          </div>

          {/* ═══ SECTION 1: How Did They Pay Rent? ═══ */}
          <div className="ecf-teaser-section">
            <div className="ecf-teaser-header">
              <span className="ecf-teaser-num">01</span>
              <h2 className="ecf-teaser-title">How Did They Pay Rent?</h2>
            </div>
            <p className="ecf-teaser-sub">Before they blew up, they had to survive. Here's how.</p>
            {selectedCreators.map(c => {
              const g = growthCreators[c.name]
              return (
                <div key={c.name} className="ecf-creator-row">
                  <img className="ecf-creator-avatar" src={c.image} alt={c.name} onError={e => { e.target.style.display = 'none' }} />
                  <div className="ecf-creator-info">
                    <div className="ecf-creator-name">{c.name}</div>
                    {showAnswers && g?.first_step ? (
                      <div className="ecf-answer-text">{g.first_step}</div>
                    ) : (
                      <BlurredText width={160} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ═══ SECTION 2: How Did They Blow Up Their Brand? ═══ */}
          <div className="ecf-teaser-section">
            <div className="ecf-teaser-header">
              <span className="ecf-teaser-num">02</span>
              <h2 className="ecf-teaser-title">How Did They Blow Up Their Brand?</h2>
            </div>
            <p className="ecf-teaser-sub">The triggers that made the world pay attention.</p>
            {selectedCreators.map(c => {
              const r = remarkableCreators[c.name]
              return (
                <div key={c.name} className="ecf-creator-row">
                  <img className="ecf-creator-avatar" src={c.image} alt={c.name} onError={e => { e.target.style.display = 'none' }} />
                  <div className="ecf-creator-info">
                    <div className="ecf-creator-name">{c.name}</div>
                    <div className="ecf-trigger-tags">
                      {r?.rule_broken?.present === 'yes' && <span className="ecf-trigger-tag">Rule Break {showAnswers ? <span className="ecf-answer-inline">{r.rule_broken.evidence}</span> : <BlurredText width={70} />}</span>}
                      {r?.unexpected_combination?.present === 'yes' && <span className="ecf-trigger-tag">Unexpected Combo {showAnswers ? <span className="ecf-answer-inline">{r.unexpected_combination.evidence}</span> : <BlurredText width={70} />}</span>}
                      {r && r.extreme_action?.present !== 'no' && <span className="ecf-trigger-tag">Extreme Action {showAnswers ? <span className="ecf-answer-inline">{r.extreme_action?.evidence}</span> : <BlurredText width={70} />}</span>}
                      {r?.stupid_simplicity?.present === 'yes' && <span className="ecf-trigger-tag">Extreme Simplicity {showAnswers ? <span className="ecf-answer-inline">{r.stupid_simplicity.evidence}</span> : <BlurredText width={70} />}</span>}
                      {!r && (
                        <>
                          <span className="ecf-trigger-tag">Rule Break <BlurredText width={70} /></span>
                          <span className="ecf-trigger-tag">Unexpected Combo <BlurredText width={70} /></span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ═══ SECTION 3: How Did They Scale Their Income? ═══ */}
          <div className="ecf-teaser-section">
            <div className="ecf-teaser-header">
              <span className="ecf-teaser-num">03</span>
              <h2 className="ecf-teaser-title">How Did They Scale Their Income?</h2>
            </div>
            <p className="ecf-teaser-sub">The three layers every experience creator needs.</p>
            {selectedCreators.map(c => {
              const o = offerCreators[c.name]
              return (
                <div key={c.name} className="ecf-creator-row">
                  <img className="ecf-creator-avatar" src={c.image} alt={c.name} onError={e => { e.target.style.display = 'none' }} />
                  <div className="ecf-creator-info">
                    <div className="ecf-creator-name">{c.name}</div>
                    <div className="ecf-trigger-tags">
                      <span className="ecf-trigger-tag">Attraction {showAnswers && o?.attraction?.length ? <span className="ecf-answer-inline">{o.attraction.join(', ')}</span> : <BlurredText width={80} />}</span>
                      <span className="ecf-trigger-tag">Core {showAnswers && o?.core?.length ? <span className="ecf-answer-inline">{o.core.join(', ')}</span> : <BlurredText width={80} />}</span>
                      <span className="ecf-trigger-tag">Continuity {showAnswers && o?.continuity?.length ? <span className="ecf-answer-inline">{o.continuity.join(', ')}</span> : <BlurredText width={80} />}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ═══ CTA ═══ */}
          <div className="ecf-gate-cta">
            {isTryRoute ? (
              trySaved ? (
                <div className="ecf-try-saved">
                  <p className="ecf-try-saved-text">You're on the list! We'll send you access soon.</p>
                  <button className="ecf-save-btn" onClick={() => navigate('/create')}>
                    Go to Creator Portal →
                  </button>
                </div>
              ) : (
                <>
                  <p className="ecf-gate-text">Sign up to see exactly how your picks paid rent, blew up their brands, and scaled their income.</p>
                  <input
                    type="email"
                    value={tryEmail}
                    onChange={(e) => setTryEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="ecf-try-email"
                    onKeyDown={(e) => e.key === 'Enter' && saveTryEmail()}
                  />
                  <button className="ecf-save-btn" onClick={saveTryEmail} disabled={trySaving || !tryEmail.trim()}>
                    {trySaving ? 'Sending...' : 'Sign Up to Unlock'}
                  </button>
                </>
              )
            ) : (
              <>
                <p className="ecf-gate-text">Go to the Creator Portal to unlock the full breakdown of how your picks built their careers.</p>
                <button className="ecf-save-btn" onClick={() => navigate('/create')}>
                  Go to Creator Portal →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
