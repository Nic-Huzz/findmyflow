/**
 * ExperienceAttractionStack — 3 questions → 8 attraction strategies → toggle → seeds checklist
 *
 * Accessed from Experience Pipeline Attract node.
 * Questions: capacity, price (saves to experiences.ticket_price), community leaders.
 * Saves selected strategies as marketing checklist items for the experience.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ExperienceAttractionStack.css'

const STRATEGIES = [
  {
    id: 'early_bird',
    name: 'Early Bird Pricing',
    desc: 'Time-limited discount — creates urgency to book now',
    icon: '🐦',
    checklistItems: [
      'Set up early bird pricing (e.g. 20% off)',
      'Post early bird announcement on social',
      'Set early bird deadline date',
    ],
    condition: (answers, exp) => {
      const price = parseFloat(exp?.ticket_price) || 0
      const daysOut = exp?.experience_date ? Math.ceil((new Date(exp.experience_date) - new Date()) / 86400000) : 0
      return price > 0 && daysOut >= 10
    },
  },
  {
    id: 'bring_friend',
    name: 'Bring a Friend',
    desc: 'Both get a discount — doubles your reach through personal invites',
    icon: '👯',
    checklistItems: [
      'Set up bring-a-friend discount (e.g. both get 10% off)',
      'Post "bring a friend" offer on social',
      'Add bring-a-friend info to booking page',
    ],
    condition: () => true, // always viable
  },
  {
    id: 'free_event',
    name: 'Free Event',
    desc: 'Run a free taster event that promotes the paid one',
    icon: '🎪',
    checklistItems: [
      'Plan free taster event (date, format, duration)',
      'Create booking page for free event',
      'Announce free event on social + email',
      'At free event: pitch the paid experience',
    ],
    condition: (answers, exp) => {
      const daysOut = exp?.experience_date ? Math.ceil((new Date(exp.experience_date) - new Date()) / 86400000) : 0
      return daysOut >= 14
    },
  },
  {
    id: 'vip_addon',
    name: 'VIP Add-on',
    desc: '"First 5 get a 1:1 session after" — premium upsell',
    icon: '👑',
    checklistItems: [
      'Define VIP add-on (1:1 session, front row, private group, etc.)',
      'Set VIP pricing and cap',
      'Add VIP option to booking page',
      'Post about VIP availability',
    ],
    condition: (answers, exp) => {
      // viable if they have an easy upsell — check products or just always show
      return true
    },
  },
  {
    id: 'group_booking',
    name: 'Group Booking',
    desc: '"Book 3 seats, get 4th free" — great for friend groups',
    icon: '👥',
    checklistItems: [
      'Set up group booking deal',
      'Add group pricing to booking page',
      'Post group booking offer',
    ],
    condition: (answers, exp) => {
      const price = parseFloat(exp?.ticket_price) || 0
      return price > 0
    },
  },
  {
    id: 'scarcity_cap',
    name: 'Scarcity Cap',
    desc: '"Only X spots" — forces a decision from people sitting on the fence',
    icon: '🔥',
    checklistItems: [
      'Add "Only X spots" to booking page',
      'Post scarcity update when 50% full',
      'Post "almost sold out" when 80% full',
    ],
    condition: (answers) => {
      return answers.capacity && ['under_10', '10_20'].includes(answers.capacity)
    },
  },
  {
    id: 'community_leader',
    name: 'Community Leader Invite',
    desc: 'Free ticket + affiliate link — they share with their audience, earn % per sale',
    icon: '🤝',
    checklistItems: [
      'Identify 3 community leaders with relevant audiences',
      'Create affiliate links / promo codes for each',
      'Send free ticket + affiliate link to each leader',
      'Follow up after they share — thank + check conversions',
    ],
    condition: (answers) => {
      return answers.community_leaders === 'yes'
    },
  },
  {
    id: 'giveaway',
    name: 'Giveaway',
    desc: 'Win free tickets — drives engagement, captures leads, expands reach',
    icon: '🎁',
    checklistItems: [
      'Create giveaway post (win tickets, tag to enter)',
      'Run giveaway for 48-72h',
      'Announce winner publicly',
    ],
    condition: (answers, exp) => {
      const price = parseFloat(exp?.ticket_price) || 0
      return price > 0
    },
  },
]

const QUESTIONS = [
  {
    id: 'capacity',
    question: 'How many people can this event hold?',
    options: [
      { label: 'Under 10', value: 'under_10', desc: 'Intimate' },
      { label: '10-20', value: '10_20', desc: 'Small group' },
      { label: '20-50', value: '20_50', desc: 'Medium' },
      { label: '50+', value: '50_plus', desc: 'Large' },
    ],
  },
  {
    id: 'pricing',
    question: 'What are you charging?',
    type: 'price_input',
  },
  {
    id: 'community_leaders',
    question: 'Do you know anyone with an existing audience in your space?',
    options: [
      { label: 'Yes', value: 'yes', desc: 'I know creators or community leaders who could share this' },
      { label: 'Maybe', value: 'maybe', desc: "I'd need to find them" },
      { label: 'No', value: 'no', desc: "I'm starting from scratch" },
    ],
  },
]

export default function ExperienceAttractionStack() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const experienceId = searchParams.get('experienceId')
  const { user } = useAuth()

  // Redirect if no experienceId
  useEffect(() => {
    if (!experienceId) navigate('/create', { replace: true })
  }, [experienceId, navigate])

  // Hide bottom toolbar on mount, restore on unmount
  useEffect(() => {
    document.body.setAttribute('data-hide-toolbar', 'true')
    return () => document.body.removeAttribute('data-hide-toolbar')
  }, [])

  const [step, setStep] = useState('intro') // intro | questions | results | saving
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [experience, setExperience] = useState(null)
  const [selected, setSelected] = useState({})
  const [saved, setSaved] = useState(false)
  const [priceInput, setPriceInput] = useState('')

  // Load experience
  useEffect(() => {
    if (!experienceId) return
    supabase.from('experiences').select('*').eq('id', experienceId).single()
      .then(({ data }) => {
        if (data) {
          setExperience(data)
          if (data.ticket_price != null) setPriceInput(String(data.ticket_price))
        }
      })
  }, [experienceId])

  const currentQuestion = QUESTIONS[questionIndex]

  const handleAnswer = (value) => {
    hapticLight()
    const newAnswers = { ...answers, [currentQuestion.id]: value }
    setAnswers(newAnswers)

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1)
    } else {
      setStep('results')
    }
  }

  const handlePriceSubmit = async () => {
    hapticLight()
    const price = Math.max(0, parseFloat(priceInput) || 0)
    const newAnswers = { ...answers, pricing: price === 0 ? 'free' : 'paid' }
    setAnswers(newAnswers)

    // Save price to experience so it's the single source of truth
    if (experienceId) {
      await supabase.from('experiences')
        .update({ ticket_price: price > 0 ? price : null })
        .eq('id', experienceId)
      setExperience(prev => prev ? { ...prev, ticket_price: price > 0 ? price : null } : prev)
    }

    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1)
    } else {
      setStep('results')
    }
  }

  const availableStrategies = STRATEGIES.filter(s => s.condition(answers, experience))
  const unavailableStrategies = STRATEGIES.filter(s => !s.condition(answers, experience))

  const toggleStrategy = (id) => {
    hapticLight()
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    if (!experienceId || !user) return
    setStep('saving')

    // Get existing custom marketing items to avoid duplicates
    const { data: existing } = await supabase.from('experience_checklist_items')
      .select('label')
      .eq('experience_id', experienceId)
      .eq('user_id', user.id)
      .eq('section', 'marketing')
      .eq('is_custom', true)

    const existingLabels = new Set((existing || []).map(e => e.label))

    // Collect new checklist items, skip duplicates
    const items = []
    STRATEGIES.forEach(s => {
      if (selected[s.id]) {
        s.checklistItems.forEach(label => {
          if (!existingLabels.has(label)) {
            items.push({
              experience_id: experienceId,
              user_id: user.id,
              phase: 'pre',
              section: 'marketing',
              label,
              sort_order: items.length,
              is_custom: true,
              completed: false,
            })
          }
        })
      }
    })

    if (items.length > 0) {
      const { error } = await supabase.from('experience_checklist_items').insert(items)
      if (error) console.warn('Failed to save checklist items:', error.message)
    }

    hapticSuccess()
    setSaved(true)

    // Navigate back after short delay
    setTimeout(() => {
      navigate(`/create`)
    }, 1500)
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="eas-container">

      {/* ── INTRO SCREEN ── */}
      {step === 'intro' && (
        <div className="eas-intro">
          <div className="eas-intro-top">
            <div className="eas-intro-icon">🎯</div>
            <h1 className="eas-intro-title">Attraction Stack</h1>
            <p className="eas-intro-sub">
              Pick the strategies that will fill the room for{experience ? ` ${experience.name}` : ' your event'}. We'll recommend what fits based on your event size and network.
            </p>
            <div className="eas-intro-steps">
              <div className="eas-intro-step">
                <span className="eas-intro-step-num">1</span>
                <span>Answer 3 quick questions about your event</span>
              </div>
              <div className="eas-intro-step">
                <span className="eas-intro-step-num">2</span>
                <span>See strategies ranked for your situation</span>
              </div>
              <div className="eas-intro-step">
                <span className="eas-intro-step-num">3</span>
                <span>Toggle on what you want. They become checklist items.</span>
              </div>
            </div>
          </div>
          <div className="eas-intro-bottom">
            <button className="eas-save" onClick={() => { hapticLight(); setStep('questions') }}>
              Let's go
            </button>
            <button className="eas-bottom-back" onClick={() => navigate(-1)}>← Back</button>
          </div>
        </div>
      )}

      {/* ── QUESTIONS ── */}
      {step === 'questions' && currentQuestion && (
        <div className="eas-question-screen">
          <div className="eas-step-indicator">{questionIndex + 1} of {QUESTIONS.length}</div>
          <h2 className="eas-question">{currentQuestion.question}</h2>

          {currentQuestion.type === 'price_input' ? (
            <div className="eas-price-input-wrap">
              <div className="eas-price-field">
                <span className="eas-price-currency">$</span>
                <input
                  type="number"
                  className="eas-price-input"
                  placeholder="0"
                  value={priceInput}
                  onChange={e => setPriceInput(e.target.value)}
                  inputMode="decimal"
                  autoFocus
                />
              </div>
              <p className="eas-price-hint">Enter 0 or leave blank for a free event</p>
              <button className="eas-save" onClick={handlePriceSubmit} style={{ marginTop: 20 }}>
                {parseFloat(priceInput) > 0 ? `Continue with $${parseFloat(priceInput)}` : 'Continue as free event'}
              </button>
            </div>
          ) : (
            <div className="eas-options">
              {currentQuestion.options.map(opt => (
                <button
                  key={opt.value}
                  className="eas-option"
                  onClick={() => handleAnswer(opt.value)}
                >
                  <div className="eas-option-label">{opt.label}</div>
                  <div className="eas-option-desc">{opt.desc}</div>
                </button>
              ))}
            </div>
          )}

          <button className="eas-bottom-back" onClick={() => {
            if (questionIndex > 0) { setQuestionIndex(questionIndex - 1) }
            else { setStep('intro') }
          }}>← Back</button>
        </div>
      )}

      {/* ── RESULTS ── */}
      {step === 'results' && (
        <div className="eas-results">
          <h2 className="eas-results-title">
            Your Attraction Stack{experience ? ` for ${experience.name}` : ''}
          </h2>
          <p className="eas-results-sub">Toggle on the strategies you want to use. They'll be added to your marketing checklist.</p>

          {availableStrategies.length > 0 && (
            <>
              <div className="eas-section-label">Recommended for you</div>
              {availableStrategies.map(s => (
                <div
                  key={s.id}
                  className={`eas-strategy${selected[s.id] ? ' active' : ''}`}
                  onClick={() => toggleStrategy(s.id)}
                >
                  <div className={`eas-toggle${selected[s.id] ? ' on' : ''}`}>
                    {selected[s.id] ? '✓' : ''}
                  </div>
                  <div className="eas-strategy-icon">{s.icon}</div>
                  <div className="eas-strategy-info">
                    <div className="eas-strategy-name">{s.name}</div>
                    <div className="eas-strategy-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          {unavailableStrategies.length > 0 && (
            <>
              <div className="eas-section-label" style={{ marginTop: 20 }}>Also available</div>
              {unavailableStrategies.map(s => (
                <div
                  key={s.id}
                  className={`eas-strategy dimmed${selected[s.id] ? ' active' : ''}`}
                  onClick={() => toggleStrategy(s.id)}
                >
                  <div className={`eas-toggle${selected[s.id] ? ' on' : ''}`}>
                    {selected[s.id] ? '✓' : ''}
                  </div>
                  <div className="eas-strategy-icon">{s.icon}</div>
                  <div className="eas-strategy-info">
                    <div className="eas-strategy-name">{s.name}</div>
                    <div className="eas-strategy-desc">{s.desc}</div>
                  </div>
                </div>
              ))}
            </>
          )}

          <button
            className="eas-save"
            onClick={handleSave}
            disabled={selectedCount === 0}
          >
            {saved ? '✓ Saved!' : `Save ${selectedCount} ${selectedCount === 1 ? 'Strategy' : 'Strategies'} to Checklist`}
          </button>
          <button className="eas-bottom-back" onClick={() => { setStep('questions'); setQuestionIndex(0) }}>← Back</button>
        </div>
      )}

      {/* ── SAVING ── */}
      {step === 'saving' && (
        <div className="eas-saving">
          <div className="eas-saving-text">{saved ? '✓ Added to your marketing checklist!' : 'Saving...'}</div>
        </div>
      )}
    </div>
  )
}
