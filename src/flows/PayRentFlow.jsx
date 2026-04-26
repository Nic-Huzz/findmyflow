/**
 * PayRentFlow.jsx — /create/pay-rent
 * "How They Paid Rent" — shows users how their selected creators
 * actually earned money early on, grouped by revenue model.
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import revenueData from '../../public/data/creatorEarlyRevenueModels.json'
import './PayRentFlow.css'

// ── Revenue model definitions ──
const REVENUE_MODELS = {
  day_job_side_project: { label: 'Day Job + Side Project', emoji: '💼' },
  one_on_one_service: { label: '1:1 Service', emoji: '🤝' },
  free_events_paid_elsewhere: { label: 'Free Events, Paid Elsewhere', emoji: '🎁' },
  small_group_paid: { label: 'Small Group Paid Events', emoji: '🎪' },
  institutional_salary: { label: 'Institutional Salary', emoji: '🏛️' },
}

// ── Model-specific first action advice ──
const FIRST_ACTIONS = {
  day_job_side_project: "Keep your current income. Build your experience on evenings and weekends. Every creator above started the same way.",
  one_on_one_service: "Start with one client this week. Charge what feels right. Use the sessions to learn what works.",
  free_events_paid_elsewhere: "Run your first event for free. Build the audience. Monetize through a different channel later.",
  small_group_paid: "Book a room. Set a date. Charge a modest fee. Repeat every week.",
  institutional_salary: "Find an institution that will pay you to do the work. University, company, nonprofit.",
}

// ── Model descriptions for confirmation screen ──
const MODEL_DESCRIPTIONS = {
  day_job_side_project: "You keep your day job to cover the bills while building your real work on the side. This is how most creators start. It's not a compromise. It's a strategy.",
  one_on_one_service: "You work with one person at a time. Charge for your expertise, learn what works, and let the proof build itself.",
  free_events_paid_elsewhere: "You give the experience away for free and fund it through a different channel. Grants, sponsors, a partner's income, or your own savings. The audience comes first.",
  small_group_paid: "You fill a small room, charge a fair price, and do the work live. Repeat until it grows.",
  institutional_salary: "You find an organisation that will pay you a salary to do work you believe in. The institution funds the mission.",
}

function creatorSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')
}

export default function PayRentFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [screen, setScreen] = useState('intro') // 'intro' | 'models' | 'confirm'
  const [selectedCreators, setSelectedCreators] = useState(null) // array of names
  const [chosenModel, setChosenModel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Fetch user's selected creators
  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('experience_creator_selections')
          .select('selected_creators')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (error) throw error
        if (data?.length && data[0].selected_creators?.length) {
          setSelectedCreators(data[0].selected_creators)
        } else {
          setSelectedCreators([])
        }
      } catch (err) {
        console.error('Error fetching creator selections:', err)
        setSelectedCreators([])
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Group selected creators by revenue model
  const groupedByModel = useMemo(() => {
    if (!selectedCreators?.length) return {}

    const groups = {}
    for (const name of selectedCreators) {
      const creator = revenueData.creators[name]
      if (!creator) continue
      const model = creator.early_revenue_model
      if (!groups[model]) groups[model] = []
      groups[model].push({
        name,
        slug: creatorSlug(name),
        description: creator.early_revenue_description,
      })
    }
    return groups
  }, [selectedCreators])

  // Get the model keys that have creators (preserve display order)
  const activeModels = useMemo(() => {
    const order = ['day_job_side_project', 'one_on_one_service', 'free_events_paid_elsewhere', 'small_group_paid', 'institutional_salary']
    return order.filter(m => groupedByModel[m]?.length > 0)
  }, [groupedByModel])

  // Save chosen model
  const handleSave = async () => {
    if (!user?.id || !chosenModel || saving) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_stage_progress')
        .upsert({
          user_id: user.id,
          pay_rent_model: chosenModel,
          pay_rent_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (error) throw error
      hapticSuccess()
      navigate('/create')
    } catch (err) {
      console.error('Error saving pay rent model:', err)
    } finally {
      setSaving(false)
    }
  }

  // ── LOADING STATE ──
  if (loading) {
    return (
      <div className="prf">
        <div className="prf-loading">
          <div className="prf-spinner" />
          <span>Loading your creators...</span>
        </div>
      </div>
    )
  }

  // ── EMPTY STATE (no creator selections) ──
  if (!selectedCreators?.length) {
    return (
      <div className="prf">
        <div className="prf-container">
          <div className="prf-empty">
            <div className="prf-empty-icon">🧭</div>
            <p>Complete Experience Creator Matching first</p>
            <Link to="/experience-creators" className="prf-empty-link">
              Find Your Creators
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 1: INTRO ──
  if (screen === 'intro') {
    return (
      <div className="prf">
        <div className="prf-container">
          <div className="prf-screen prf-intro">
            <div className="prf-intro-badge">Revenue Reality</div>
            <h1>How They <span className="prf-gold">Paid Rent</span></h1>
            <p>The people you picked didn't start with a business model. They started with a way to pay rent.</p>
            <button
              className="prf-cta-btn"
              onClick={() => { hapticLight(); setScreen('models') }}
            >
              Show me
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SCREEN 2: REVENUE MODELS ──
  if (screen === 'models') {
    return (
      <div className="prf">
        <div className="prf-hero">
          <div className="prf-hero-badge">Your Picks</div>
          <h1>How They <span className="prf-gold">Paid Rent</span></h1>
          <p>Here's how your selected creators actually earned money early on.</p>
        </div>

        <div className="prf-container prf-screen">
          {activeModels.map((modelKey, idx) => {
            const model = REVENUE_MODELS[modelKey]
            const creators = groupedByModel[modelKey]
            return (
              <div key={modelKey}>
                {idx > 0 && <div className="prf-divider" />}
                <div className="prf-group">
                  <div className="prf-group-header">
                    <span className="prf-group-emoji">{model.emoji}</span>
                    <span className="prf-group-label">{model.label}</span>
                  </div>
                  {creators.map(creator => (
                    <div key={creator.name} className="prf-creator-card">
                      <div className="prf-creator-top">
                        <img
                          src={`/images/creators/${creator.slug}.png`}
                          alt={creator.name}
                          className="prf-creator-avatar"
                          onError={(e) => { e.target.style.display = 'none' }}
                        />
                        <span className="prf-creator-name">{creator.name}</span>
                      </div>
                      <div className="prf-creator-desc">{creator.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Model selection */}
          <div className="prf-model-question">
            Which of these fits where you are right now?
          </div>
          <div className="prf-model-options">
            {activeModels.map(modelKey => {
              const model = REVENUE_MODELS[modelKey]
              return (
                <button
                  key={modelKey}
                  className={`prf-model-btn ${chosenModel === modelKey ? 'selected' : ''}`}
                  onClick={() => {
                    hapticLight()
                    setChosenModel(modelKey)
                  }}
                >
                  <span className="prf-model-btn-emoji">{model.emoji}</span>
                  {model.label}
                </button>
              )
            })}
          </div>

          {chosenModel && (
            <button
              className="prf-cta-btn"
              style={{ width: '100%', marginBottom: '2rem' }}
              onClick={() => { hapticLight(); setScreen('confirm'); window.scrollTo(0, 0) }}
            >
              That's me
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── SCREEN 3: CONFIRMATION ──
  if (screen === 'confirm' && chosenModel) {
    const model = REVENUE_MODELS[chosenModel]
    return (
      <div className="prf">
        <div className="prf-container">
          <div className="prf-screen prf-confirm">
            <button className="prf-confirm-back" onClick={() => setScreen('models')}>
              ← Back
            </button>

            <div className="prf-confirm-card">
              <div className="prf-confirm-badge">{model.emoji} Your Model</div>
              <h2 className="prf-confirm-model-name">{model.label}</h2>
              <p className="prf-confirm-model-desc">{MODEL_DESCRIPTIONS[chosenModel]}</p>
            </div>

            <div className="prf-action-card">
              <div className="prf-action-label">Your first action</div>
              <p className="prf-action-text">{FIRST_ACTIONS[chosenModel]}</p>
              <button
                className="prf-save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
