/**
 * ScaleIncomeFlow.jsx — /create/scale-income
 * "How to Scale Your Income" — interactive 3-layer business model builder.
 * User confirms or swaps each layer (attraction / core / continuity)
 * for their chosen experience-creator archetype.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import offerMapData from '../../public/data/experienceCreatorOfferMap.json'
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

// Per-layer skill mappings derived from 59 creator corpus analysis
const LAYER_SKILLS = {
  workshop:     { attraction: ['teaching', 'coaching'],     core: ['teaching', 'coaching'],     continuity: ['coaching', 'teaching'] },
  performance:  { attraction: ['storytelling', 'performing'], core: ['performing', 'speaking_up'], continuity: ['performing', 'creating'] },
  cohort:       { attraction: ['teaching', 'performing'],   core: ['teaching', 'leading'],      continuity: ['teaching'] },
  books_media:  { attraction: ['speaking_up', 'storytelling'], core: ['speaking_up', 'storytelling'], continuity: ['speaking_up', 'storytelling'] },
  facilitation: { attraction: ['connecting', 'leading'],    core: ['connecting', 'leading'],    continuity: ['connecting', 'leading'] },
  retreats:     { attraction: ['building', 'storytelling'], core: ['storytelling', 'building'],  continuity: ['storytelling', 'coaching'] },
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

  const [screen, setScreen] = useState('intro') // intro | examples | attraction | core | continuity | summary
  const [archetype, setArchetype] = useState(null)
  const [selectedCreatorNames, setSelectedCreatorNames] = useState([])
  const [userSkills, setUserSkills] = useState([])
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
          .select('dominant_archetype, selected_creators')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error
        if (data?.length) {
          if (data[0].dominant_archetype) setArchetype(data[0].dominant_archetype)
          if (data[0].selected_creators) setSelectedCreatorNames(data[0].selected_creators)
        }

        // Fetch user's play-skill categories
        const { data: skillData } = await supabase
          .from('nikigai_clusters')
          .select('items')
          .eq('user_id', user.id)
          .eq('cluster_type', 'skills')
        if (skillData?.length) {
          const cats = new Set()
          for (const row of skillData) {
            for (const item of (row.items || [])) {
              if (item.category) cats.add(item.category)
            }
          }
          setUserSkills([...cats])
        }
      } catch (err) {
        console.error('Error fetching archetype:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Build creator revenue examples
  const creatorExamples = useMemo(() => {
    return selectedCreatorNames.map(name => {
      const streams = offerMapData.creators?.[name]
      if (!streams) return null
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
      return {
        name,
        slug,
        attraction: (streams.attraction || []).map(s => s.charAt(0).toLowerCase() + s.slice(1)),
        core: (streams.core || []).map(s => s.charAt(0).toLowerCase() + s.slice(1)),
        continuity: (streams.continuity || []).map(s => s.charAt(0).toLowerCase() + s.slice(1)),
      }
    }).filter(Boolean).filter(c => c.attraction.length || c.core.length || c.continuity.length)
  }, [selectedCreatorNames])

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
              onClick={() => { hapticLight(); setScreen('examples'); window.scrollTo(0, 0) }}
            >
              Let's build it
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── EXAMPLES SCREEN ──
  if (screen === 'examples') {
    return (
      <div className="sif">
        <div className="sif-container">
          <div className="sif-screen">
            <button className="sif-back-btn" onClick={() => { setScreen('intro'); window.scrollTo(0, 0) }}>
              ← Back
            </button>

            <div className="sif-badge" style={{ display: 'block', textAlign: 'center' }}>How Your Picks Do It</div>
            <h2 className="sif-heading" style={{ textAlign: 'center' }}>Here's how the people you chose actually make money</h2>

            {creatorExamples.map(creator => (
              <div key={creator.name} className="sif-example-card">
                <div className="sif-example-top">
                  <img className="sif-example-avatar" src={`/images/creators/${creator.slug}.png`} alt={creator.name} onError={e => { e.target.style.display = 'none' }} />
                  <span className="sif-example-name">{creator.name}</span>
                </div>
                {creator.attraction.length > 0 && (
                  <div className="sif-example-layer">
                    <span className="sif-example-dot attraction" />
                    <span className="sif-example-label">Attraction:</span>
                    <span className="sif-example-streams">{creator.attraction.join(', ')}</span>
                  </div>
                )}
                {creator.core.length > 0 && (
                  <div className="sif-example-layer">
                    <span className="sif-example-dot core" />
                    <span className="sif-example-label">Core:</span>
                    <span className="sif-example-streams">{creator.core.join(', ')}</span>
                  </div>
                )}
                {creator.continuity.length > 0 && (
                  <div className="sif-example-layer">
                    <span className="sif-example-dot continuity" />
                    <span className="sif-example-label">Continuity:</span>
                    <span className="sif-example-streams">{creator.continuity.join(', ')}</span>
                  </div>
                )}
              </div>
            ))}

            <p className="sif-transition-text">Now let's build yours.</p>

            <button className="sif-cta" style={{ width: '100%' }} onClick={() => goToLayer('attraction')}>
              Build my model
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
              {LAYER_SKILLS[displayOffer.sourceArchetype]?.[layer] && (
                <div className="sif-skill-tags">
                  {LAYER_SKILLS[displayOffer.sourceArchetype][layer].map(s => (
                    <span key={s} className={`sif-skill-tag ${userSkills.includes(s) ? 'sif-skill-match' : 'sif-skill-dim'}`}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                      {userSkills.includes(s) && ' ✓'}
                    </span>
                  ))}
                </div>
              )}
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
                    {LAYER_SKILLS[alt.archetypeKey]?.[layer] && (
                      <div className="sif-skill-tags">
                        {LAYER_SKILLS[alt.archetypeKey][layer].map(s => (
                          <span key={s} className={`sif-skill-tag ${userSkills.includes(s) ? 'sif-skill-match' : 'sif-skill-dim'}`}>
                            {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                            {userSkills.includes(s) && ' ✓'}
                          </span>
                        ))}
                      </div>
                    )}
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
