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

// ── Build proof quotes from selected creators ──
function buildProof(selectedNames, slot) {
  const cmMap = {}
  careerModelsData.profiles.forEach(p => { cmMap[p.name] = p })
  const proofs = []

  for (const name of selectedNames) {
    const cm = cmMap[name]
    if (!cm?.careerModel) continue
    const offers = offerMapData.creators?.[name]
    if (!offers) continue

    const streams = offers[slot] || []
    if (streams.length === 0) continue

    // Pick the most interesting proof from scaleModel, trajectory, or lessonsForUser
    if (slot === 'attraction' && cm.careerModel.trajectory) {
      proofs.push({ name, text: cm.careerModel.trajectory })
    } else if (slot === 'core' && cm.careerModel.scaleModel) {
      proofs.push({ name, text: cm.careerModel.scaleModel })
    } else if (slot === 'continuity' && cm.careerModel.lessonsForUser) {
      proofs.push({ name, text: cm.careerModel.lessonsForUser })
    } else if (cm.careerModel.lessonsForUser) {
      proofs.push({ name, text: cm.careerModel.lessonsForUser })
    }
  }

  // Return top 2 proofs
  return proofs.slice(0, 2)
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
  const [layerStatus, setLayerStatus] = useState({})

  const confirmLayer = (slot) => {
    hapticLight()
    setLayerStatus(prev => ({ ...prev, [slot]: 'confirmed' }))
  }

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
      const offers = ARCHETYPE_OFFERS[dominantArchetype] || ARCHETYPE_OFFERS.workshop
      await supabase.from('experience_creator_selections').insert({
        user_id: user.id,
        selected_creators: [...selected],
        dominant_archetype: dominantArchetype,
        product_suite: {
          attraction: offers.attraction?.name,
          core: offers.core?.name,
          continuity: offers.continuity?.name,
        },
        layer_validations: layerStatus,
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
  const offers = ARCHETYPE_OFFERS[dominantArchetype] || ARCHETYPE_OFFERS.workshop
  const selectedNames = [...selected]

  const LAYERS = [
    { slot: 'attraction', dotClass: 'attraction', label: 'Attraction' },
    { slot: 'core', dotClass: 'core', label: 'Core Offer' },
    { slot: 'continuity', dotClass: 'continuity', label: 'Continuity' },
  ]

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

          {/* Offer layers with real data */}
          {LAYERS.map(({ slot, dotClass, label }) => {
            const offer = offers[slot]
            const proofs = buildProof(selectedNames, slot)
            const status = layerStatus[slot]

            return (
              <div key={slot} className={`ecf-offer-card ${status === 'confirmed' ? 'confirmed' : ''}`}>
                <div className="ecf-offer-top">
                  <div className={`ecf-offer-dot ${dotClass}`} />
                  <div>
                    <div className="ecf-offer-label">{label}</div>
                    <div className="ecf-offer-name">{offer.name}</div>
                  </div>
                </div>
                <div className="ecf-offer-desc">{offer.desc}</div>
                {proofs.length > 0 && (
                  <div className="ecf-offer-proof">
                    {proofs.map((p, i) => (
                      <span key={i}>{i > 0 ? ' ' : ''}{p.name}: "{p.text}"</span>
                    ))}
                  </div>
                )}
                <div className="ecf-offer-actions">
                  {status === 'confirmed' ? (
                    <button className="ecf-offer-btn confirmed" style={{ flex: 1 }}>✓ Confirmed</button>
                  ) : (
                    <button className="ecf-offer-btn yes" onClick={() => confirmLayer(slot)}>
                      Hell Yes
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Scale — optional, shown separately */}
          {(dominantArchetype === 'workshop' || dominantArchetype === 'cohort') && (
            <div className={`ecf-offer-card ${layerStatus.scale === 'confirmed' ? 'confirmed' : ''}`}>
              <div className="ecf-offer-top">
                <div className="ecf-offer-dot" style={{ background: '#E9A23B' }} />
                <div>
                  <div className="ecf-offer-label">Scale (optional)</div>
                  <div className="ecf-offer-name">Certify others to teach your method</div>
                </div>
              </div>
              <div className="ecf-offer-desc">When you're ready to multiply: train practitioners to deliver without you in the room. You own the IP, not the calendar.</div>
              {buildProof(selectedNames, 'scale').length > 0 && (
                <div className="ecf-offer-proof">
                  {buildProof(selectedNames, 'scale').map((p, i) => (
                    <span key={i}>{i > 0 ? ' ' : ''}{p.name}: "{p.text}"</span>
                  ))}
                </div>
              )}
              <div className="ecf-offer-actions">
                {layerStatus.scale === 'confirmed' ? (
                  <button className="ecf-offer-btn confirmed" style={{ flex: 1 }}>✓ Confirmed</button>
                ) : (
                  <>
                    <button className="ecf-offer-btn yes" onClick={() => confirmLayer('scale')}>Hell Yes</button>
                    <button className="ecf-offer-btn no" onClick={() => setLayerStatus(prev => ({ ...prev, scale: 'skipped' }))}>Not yet</button>
                  </>
                )}
              </div>
            </div>
          )}

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
