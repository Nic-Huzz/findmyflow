/**
 * ExperienceAttractionStack — 2 questions → 8 attraction strategies → toggle → seeds checklist
 *
 * Accessed from Growth Line Attract node.
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

  const [step, setStep] = useState('questions') // questions | results | saving
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [experience, setExperience] = useState(null)
  const [selected, setSelected] = useState({})
  const [saved, setSaved] = useState(false)

  // Load experience
  useEffect(() => {
    if (!experienceId) return
    supabase.from('experiences').select('*').eq('id', experienceId).single()
      .then(({ data }) => { if (data) setExperience(data) })
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

  const availableStrategies = STRATEGIES.filter(s => s.condition(answers, experience))
  const unavailableStrategies = STRATEGIES.filter(s => !s.condition(answers, experience))

  const toggleStrategy = (id) => {
    hapticLight()
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    if (!experienceId || !user) return
    setStep('saving')

    // Collect all checklist items from selected strategies
    const items = []
    STRATEGIES.forEach(s => {
      if (selected[s.id]) {
        s.checklistItems.forEach((label, i) => {
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
      <button className="eas-back" onClick={() => navigate(-1)}>← Back</button>

      {step === 'questions' && currentQuestion && (
        <div className="eas-question-screen">
          <div className="eas-step-indicator">{questionIndex + 1} of {QUESTIONS.length}</div>
          <h2 className="eas-question">{currentQuestion.question}</h2>
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
        </div>
      )}

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
        </div>
      )}

      {step === 'saving' && (
        <div className="eas-saving">
          <div className="eas-saving-text">{saved ? '✓ Added to your marketing checklist!' : 'Saving...'}</div>
        </div>
      )}
    </div>
  )
}
