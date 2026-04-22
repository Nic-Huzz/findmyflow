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
import offerMapData from '../../public/data/experienceCreatorOfferMap.json'

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
  const [screen, setScreen] = useState('browse') // 'browse' | 'result'
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)

  const allCreators = useMemo(() => buildCreatorData(), [])

  // Group creators by category
  const grouped = useMemo(() => {
    const groups = {}
    for (const cat of CATEGORIES) {
      groups[cat.id] = allCreators.filter(c => c.categoryId === cat.id)
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
    hapticSuccess()
    setScreen('result')
    window.scrollTo(0, 0)
  }

  // Back to browse
  const showBrowse = () => {
    setScreen('browse')
    window.scrollTo(0, 0)
  }

  // Save to Supabase
  const saveModel = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await supabase.from('experience_creator_selections').insert({
        user_id: user.id,
        selected_creators: [...selected],
        dominant_archetype: dominantArchetype,
      })
      hapticSuccess()
      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error saving:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── BROWSE SCREEN ──
  if (screen === 'browse') {
    return (
      <div className="ecf">
        {/* Hero */}
        <div className="ecf-hero">
          <div className="ecf-hero-badge">Experience Creator Matching</div>
          <h1>Who would you love<br />to <span className="ecf-hero-gold">build like?</span></h1>
          <p>Scroll through real people who built careers from experiences. Tap anyone who inspires you.</p>
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
                        onError={(e) => { e.target.style.background = 'linear-gradient(135deg, #5e17eb, #7c3aed)' }}
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
  const archetype = ARCHETYPE_INFO[dominantArchetype] || ARCHETYPE_INFO.workshop
  const firstStep = FIRST_STEPS[dominantArchetype] || FIRST_STEPS.workshop

  return (
    <div className="ecf">
      <div className="ecf-container">
        <div className="ecf-result">
          <button className="ecf-back-link" onClick={showBrowse}>
            ← Back to browsing
          </button>

          <div className="ecf-result-header">
            <div className="ecf-result-badge">Your Model</div>
            <h1>{archetype.name}</h1>
            <p>{archetype.desc}</p>
          </div>

          <div className="ecf-selected-chips">
            {selectedCreators.map(c => (
              <div key={c.name} className="ecf-chip">
                <img src={c.image} alt={c.name} />
                {c.name}
              </div>
            ))}
          </div>

          {/* Offer layers — Phase 2 will populate from data */}
          <div className="ecf-offer-card">
            <div className="ecf-offer-top">
              <div className="ecf-offer-dot attraction" />
              <div>
                <div className="ecf-offer-label">Attraction</div>
                <div className="ecf-offer-name">How people discover you</div>
              </div>
            </div>
            <div className="ecf-offer-desc">Free content that lets people experience your approach before paying.</div>
            <div className="ecf-offer-actions">
              <button className="ecf-offer-btn yes">Coming in Phase 2</button>
            </div>
          </div>

          <div className="ecf-offer-card">
            <div className="ecf-offer-top">
              <div className="ecf-offer-dot core" />
              <div>
                <div className="ecf-offer-label">Core Offer</div>
                <div className="ecf-offer-name">Your main paid experience</div>
              </div>
            </div>
            <div className="ecf-offer-desc">The structured transformation you deliver. Your bread and butter.</div>
            <div className="ecf-offer-actions">
              <button className="ecf-offer-btn yes">Coming in Phase 2</button>
            </div>
          </div>

          <div className="ecf-offer-card">
            <div className="ecf-offer-top">
              <div className="ecf-offer-dot continuity" />
              <div>
                <div className="ecf-offer-label">Continuity</div>
                <div className="ecf-offer-name">Recurring revenue</div>
              </div>
            </div>
            <div className="ecf-offer-desc">Revenue that flows while you sleep. Books, memberships, products.</div>
            <div className="ecf-offer-actions">
              <button className="ecf-offer-btn yes">Coming in Phase 2</button>
            </div>
          </div>

          {/* First Step */}
          <div className="ecf-first-step">
            <h3>Your First Step</h3>
            <p>{firstStep}</p>
            <button className="ecf-save-btn" onClick={saveModel} disabled={loading}>
              {loading ? 'Saving...' : 'Save My Model'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
