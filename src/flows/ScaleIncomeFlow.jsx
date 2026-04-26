/**
 * ScaleIncomeFlow.jsx — /create/scale-income
 * "How to Scale Your Income" — interactive 3-layer business model builder.
 * User confirms or swaps each layer (attraction / core / continuity)
 * for their chosen experience-creator archetype.
 */
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ScaleIncomeFlow.css'

// ── Archetype offer definitions ──
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

const ARCHETYPE_INFO = {
  workshop: { name: 'Workshops & Training', emoji: '🎓' },
  performance: { name: 'Live Events & Performance', emoji: '🎭' },
  cohort: { name: 'Cohorts & Courses', emoji: '👥' },
  books_media: { name: 'Books, Content & Media', emoji: '📚' },
  facilitation: { name: 'Facilitation & Community', emoji: '🤝' },
  retreats: { name: 'Retreats & Immersive', emoji: '🏔️' },
}

const LAYERS = ['attraction', 'core', 'continuity']

const LAYER_META = {
  attraction: { label: 'ATTRACTION', question: 'What do you give away for free?', color: 'attraction' },
  core: { label: 'CORE', question: 'What do people pay you for?', color: 'core' },
  continuity: { label: 'CONTINUITY', question: 'What earns while you sleep?', color: 'continuity' },
}

export default function ScaleIncomeFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [screen, setScreen] = useState('intro') // intro | attraction | core | continuity | summary
  const [archetype, setArchetype] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Confirmed choices per layer: { attraction: { name, desc, sourceArchetype }, ... }
  const [choices, setChoices] = useState({
    attraction: null,
    core: null,
    continuity: null,
  })

  // UI state per layer
  const [showAlternatives, setShowAlternatives] = useState(false)

  // Fetch user's dominant archetype
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('experience_creator_selections')
          .select('dominant_archetype')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error
        if (data?.length && data[0].dominant_archetype) {
          setArchetype(data[0].dominant_archetype)
        }
      } catch (err) {
        console.error('Error fetching archetype:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const confirmChoice = (layer, offerName, offerDesc, sourceArchetype) => {
    hapticLight()
    setChoices(prev => ({
      ...prev,
      [layer]: { name: offerName, desc: offerDesc, sourceArchetype },
    }))
    setShowAlternatives(false)
  }

  const unconfirmChoice = (layer) => {
    hapticLight()
    setChoices(prev => ({ ...prev, [layer]: null }))
  }

  const goToLayer = (layer) => {
    hapticLight()
    setShowAlternatives(false)
    setScreen(layer)
    window.scrollTo(0, 0)
  }

  const handleSave = async () => {
    if (!user?.id || saving) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('creator_assessments')
        .insert({
          user_id: user.id,
          attraction_status: 'have',
          attraction_detail: choices.attraction?.name || '',
          core_status: 'have',
          core_detail: choices.core?.name || '',
          continuity_status: 'have',
          continuity_detail: choices.continuity?.name || '',
        })

      if (error) throw error
      hapticSuccess()
      navigate('/create')
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  // Progress state for dots
  const getProgress = () => {
    const current = LAYERS.indexOf(screen)
    return LAYERS.map((l, i) => {
      if (choices[l]) return 'done'
      if (i === current) return 'active'
      return ''
    })
  }

  // ── LOADING ──
  if (loading) {
    return (
      <div className="sif">
        <div className="sif-loading">
          <div className="sif-spinner" />
          <span>Loading your archetype...</span>
        </div>
      </div>
    )
  }

  // ── NO ARCHETYPE ──
  if (!archetype) {
    return (
      <div className="sif">
        <div className="sif-container">
          <div className="sif-empty">
            <div className="sif-empty-icon">🧭</div>
            <p>Complete Experience Creator Matching first to discover your archetype.</p>
            <Link to="/experience-creators" className="sif-empty-link">
              Find Your Archetype
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const info = ARCHETYPE_INFO[archetype] || { name: archetype, emoji: '✨' }
  const offers = ARCHETYPE_OFFERS[archetype]

  // ── SCREEN 1: INTRO ──
  if (screen === 'intro') {
    return (
      <div className="sif">
        <div className="sif-container">
          <div className="sif-intro sif-screen">
            <div className="sif-badge">Scale Your Income</div>
            <h1>Build your <span className="sif-gold">business model</span></h1>
            <p>Three layers. One stack. A business that works whether you are in the room or not.</p>
            <div className="sif-archetype-tag">
              <span>{info.emoji}</span>
              <span>You chose {info.name}</span>
            </div>
            <button
              className="sif-cta"
              onClick={() => goToLayer('attraction')}
            >
              Let's build it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── LAYER SCREENS (attraction / core / continuity) ──
  if (LAYERS.includes(screen)) {
    const layer = screen
    const meta = LAYER_META[layer]
    const defaultOffer = offers[layer]
    const choice = choices[layer]
    const isConfirmed = !!choice
    const layerIdx = LAYERS.indexOf(layer)

    // Build alternatives from other archetypes
    const alternatives = Object.entries(ARCHETYPE_OFFERS)
      .filter(([key]) => key !== archetype)
      .map(([key, altOffers]) => ({
        archetypeKey: key,
        info: ARCHETYPE_INFO[key],
        offer: altOffers[layer],
      }))

    // Determine what offer is currently displayed
    const displayOffer = choice || { name: defaultOffer.name, desc: defaultOffer.desc, sourceArchetype: archetype }

    const progress = getProgress()

    return (
      <div className="sif">
        <div className="sif-container">
          <div className="sif-layer-screen sif-screen">
            {/* Back button */}
            <button
              className="sif-back-btn"
              onClick={() => {
                if (layerIdx === 0) { setScreen('intro'); window.scrollTo(0, 0) }
                else goToLayer(LAYERS[layerIdx - 1])
              }}
            >
              ← Back
            </button>

            {/* Progress dots */}
            <div className="sif-progress">
              {progress.map((state, i) => (
                <div key={i} className={`sif-progress-dot ${state}`} />
              ))}
            </div>

            {/* Layer label */}
            <div className="sif-layer-label">
              <span className={`sif-layer-dot ${meta.color}`} />
              {meta.label}
            </div>

            <h2 className="sif-heading">{meta.question}</h2>

            {/* Primary offer card */}
            <div className={`sif-offer-card ${isConfirmed ? 'sif-confirmed' : ''}`}>
              <div className="sif-offer-name">{displayOffer.name}</div>
              <p className="sif-offer-desc">{displayOffer.desc}</p>
            </div>

            {/* Action buttons */}
            {!isConfirmed ? (
              <div className="sif-action-row">
                <button
                  className="sif-hell-yes"
                  onClick={() => confirmChoice(layer, defaultOffer.name, defaultOffer.desc, archetype)}
                >
                  Hell Yes
                </button>
                <button
                  className="sif-other-btn"
                  onClick={() => { hapticLight(); setShowAlternatives(!showAlternatives) }}
                >
                  {showAlternatives ? 'Hide options' : 'Other options'}
                </button>
              </div>
            ) : (
              <div className="sif-action-row">
                <button
                  className="sif-confirmed-btn"
                  onClick={() => unconfirmChoice(layer)}
                >
                  ✓ Confirmed
                </button>
              </div>
            )}

            {/* Alternative offers */}
            {showAlternatives && !isConfirmed && (
              <div className="sif-alternatives">
                <div className="sif-alt-heading">From other archetypes</div>
                {alternatives.map(alt => (
                  <div
                    key={alt.archetypeKey}
                    className="sif-alt-card"
                    onClick={() => confirmChoice(layer, alt.offer.name, alt.offer.desc, alt.archetypeKey)}
                  >
                    <div className="sif-alt-top">
                      <div className="sif-alt-name-row">
                        <span className="sif-alt-emoji">{alt.info.emoji}</span>
                        <span className="sif-alt-archetype">{alt.info.name}</span>
                      </div>
                      <span className="sif-alt-pick">Pick this</span>
                    </div>
                    <div className="sif-alt-offer-name">{alt.offer.name}</div>
                    <p className="sif-alt-offer-desc">{alt.offer.desc}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Next button */}
            {isConfirmed && (
              <div className="sif-next-row">
                {layerIdx < LAYERS.length - 1 ? (
                  <button
                    className="sif-next-btn"
                    onClick={() => goToLayer(LAYERS[layerIdx + 1])}
                  >
                    Next
                  </button>
                ) : (
                  <button
                    className="sif-next-btn"
                    onClick={() => { hapticLight(); setScreen('summary'); window.scrollTo(0, 0) }}
                  >
                    See my model
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 5: SUMMARY ──
  if (screen === 'summary') {
    return (
      <div className="sif">
        <div className="sif-container">
          <div className="sif-summary sif-screen">
            <button className="sif-back-btn" onClick={() => goToLayer('continuity')}>
              ← Back
            </button>

            <div className="sif-badge" style={{ display: 'block', textAlign: 'center' }}>Your Business Model</div>
            <h2 className="sif-summary-heading">Your 3-layer stack</h2>

            <div className="sif-stack">
              {LAYERS.map(layer => {
                const choice = choices[layer]
                if (!choice) return null
                const meta = LAYER_META[layer]
                const isSwapped = choice.sourceArchetype !== archetype
                const sourceInfo = ARCHETYPE_INFO[choice.sourceArchetype]
                return (
                  <div key={layer} className={`sif-stack-card ${meta.color}`}>
                    <div className="sif-stack-label">{meta.label}</div>
                    <div className="sif-stack-name">{choice.name}</div>
                    {isSwapped && sourceInfo && (
                      <span className="sif-stack-source">
                        from {sourceInfo.emoji} {sourceInfo.name}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            <button
              className="sif-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save My Model'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
