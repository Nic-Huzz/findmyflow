/**
 * ExperienceMarketingCampaign — 4 yes/no questions → 10 campaign items → toggle → seeds checklist
 *
 * Accessed from Growth Line Attract node.
 * Saves selected campaign items as marketing checklist items for the experience.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ExperienceMarketingCampaign.css'

const CAMPAIGN_ITEMS = [
  // Giveaway sequence (Q1)
  {
    id: 'giveaway_post',
    name: 'Giveaway Post',
    desc: '"Win 2 free tickets, tag a friend to enter"',
    icon: '🎁',
    gate: 'giveaway',
    checklistItems: ['Create giveaway post (win tickets, tag to enter)', 'Post giveaway on social'],
  },
  {
    id: 'giveaway_stories',
    name: 'Stories (3-5 over 48h)',
    desc: 'Behind-the-scenes + reminders to enter the giveaway',
    icon: '📱',
    gate: 'giveaway',
    checklistItems: ['Post 3-5 stories over 48h promoting the giveaway'],
  },
  {
    id: 'winner_announcement',
    name: 'Winner Announcement',
    desc: 'Announce the winner — creates buzz and social proof',
    icon: '🏆',
    gate: 'giveaway',
    checklistItems: ['Announce giveaway winner on social'],
  },
  // Promo code (Q2)
  {
    id: 'dm_promo_code',
    name: 'DM Past Attendees with Promo Code',
    desc: 'Personal message to everyone who came before + a discount code',
    icon: '💬',
    gate: 'promo_codes',
    checklistItems: ['Create promo code for past attendees', 'DM past attendees with personal invite + promo code'],
  },
  // Carousel (Q3)
  {
    id: 'feature_carousel',
    name: 'Feature Carousel',
    desc: 'Instagram carousel showing all the features of the event',
    icon: '🎠',
    gate: 'photos',
    gateLabel: 'with your photos',
    noGateLabel: 'design-based (no photos yet)',
    alwaysAvailable: true, // available even without photos, just different style
    checklistItems: ['Create feature carousel for the event', 'Post carousel on Instagram'],
  },
  // Videos (Q4)
  {
    id: 'emotional_promo',
    name: 'Emotional Promo Video',
    desc: 'Highlights reel showing the emotional experience of being there',
    icon: '🎬',
    gate: 'videos',
    checklistItems: ['Create emotional promo video (highlights, feelings, energy)', 'Post promo video on social'],
  },
  {
    id: 'essence_promo',
    name: 'Essence Promo Video',
    desc: 'Words + music — the deeper meaning and essence of the event',
    icon: '✨',
    gate: 'videos',
    checklistItems: ['Create essence promo video (words + music, deeper meaning)', 'Post essence video on social'],
  },
  // Always available
  {
    id: 'group_chats',
    name: 'Share in Group Chats',
    desc: 'Post in WhatsApp, Telegram, Facebook groups with relevant people',
    icon: '💬',
    gate: null,
    checklistItems: ['Share event in 3+ relevant group chats'],
  },
  {
    id: 'business_cards',
    name: 'Business Cards with QR Code',
    desc: 'Hand out as you live your life — QR links to the event page',
    icon: '🪪',
    gate: null,
    checklistItems: ['Print business cards with QR code to event page', 'Carry cards and hand out to people you meet'],
  },
  {
    id: 'poster_venue',
    name: 'Poster at Venue',
    desc: 'Print a poster and stick it up where the event happens',
    icon: '📌',
    gate: null,
    checklistItems: ['Design event poster', 'Print and put up poster at venue'],
  },
]

const QUESTIONS = [
  {
    id: 'giveaway',
    question: 'Are you running a giveaway?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'promo_codes',
    question: 'Do you have past participants you\'re happy to give a promo code to?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'photos',
    question: 'Do you have photos from past events?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
  {
    id: 'videos',
    question: 'Do you have videos from past events?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
  },
]

export default function ExperienceMarketingCampaign() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const experienceId = searchParams.get('experienceId')
  const { user } = useAuth()

  const [step, setStep] = useState('questions')
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [experience, setExperience] = useState(null)
  const [selected, setSelected] = useState({})
  const [saved, setSaved] = useState(false)

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

  // Determine which items are available based on answers
  const getAvailability = (item) => {
    if (item.gate === null) return 'available' // always available
    if (item.alwaysAvailable) return 'available' // carousel always available
    return answers[item.gate] === 'yes' ? 'available' : 'hidden'
  }

  const availableItems = CAMPAIGN_ITEMS.filter(i => getAvailability(i) === 'available')
  const hiddenItems = CAMPAIGN_ITEMS.filter(i => getAvailability(i) === 'hidden')

  const toggleItem = (id) => {
    hapticLight()
    setSelected(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSave = async () => {
    if (!experienceId || !user) return
    setStep('saving')

    const items = []
    CAMPAIGN_ITEMS.forEach(ci => {
      if (selected[ci.id]) {
        ci.checklistItems.forEach(label => {
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

    setTimeout(() => {
      navigate('/create')
    }, 1500)
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="emc-container">
      <button className="emc-back" onClick={() => navigate(-1)}>← Back</button>

      {step === 'questions' && currentQuestion && (
        <div className="emc-question-screen">
          <div className="emc-step-indicator">{questionIndex + 1} of {QUESTIONS.length}</div>
          <h2 className="emc-question">{currentQuestion.question}</h2>
          <div className="emc-options">
            {currentQuestion.options.map(opt => (
              <button
                key={opt.value}
                className="emc-option"
                onClick={() => handleAnswer(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'results' && (
        <div className="emc-results">
          <h2 className="emc-results-title">
            Your Marketing Campaign{experience ? ` for ${experience.name}` : ''}
          </h2>
          <p className="emc-results-sub">Toggle on the campaigns you want to run. They'll be added to your marketing checklist.</p>

          {availableItems.length > 0 && (
            <>
              <div className="emc-section-label">Based on your answers</div>
              {availableItems.map(item => (
                <div
                  key={item.id}
                  className={`emc-item${selected[item.id] ? ' active' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  <div className={`emc-toggle${selected[item.id] ? ' on' : ''}`}>
                    {selected[item.id] ? '✓' : ''}
                  </div>
                  <div className="emc-item-icon">{item.icon}</div>
                  <div className="emc-item-info">
                    <div className="emc-item-name">{item.name}</div>
                    <div className="emc-item-desc">
                      {item.desc}
                      {item.alwaysAvailable && answers[item.gate] === 'yes' && item.gateLabel && (
                        <span className="emc-item-note"> — {item.gateLabel}</span>
                      )}
                      {item.alwaysAvailable && answers[item.gate] !== 'yes' && item.noGateLabel && (
                        <span className="emc-item-note"> — {item.noGateLabel}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {hiddenItems.length > 0 && (
            <>
              <div className="emc-section-label" style={{ marginTop: 20 }}>Unlock for next time</div>
              <div className="emc-unlock-hint">
                {answers.giveaway !== 'yes' && 'Run a giveaway next time. '}
                {answers.videos !== 'yes' && 'Film this event for promo videos. '}
                {answers.promo_codes !== 'yes' && 'After this event you\'ll have attendees to give promo codes to. '}
              </div>
            </>
          )}

          <button
            className="emc-save"
            onClick={handleSave}
            disabled={selectedCount === 0}
          >
            {saved ? '✓ Saved!' : `Save ${selectedCount} ${selectedCount === 1 ? 'Campaign' : 'Campaigns'} to Checklist`}
          </button>
        </div>
      )}

      {step === 'saving' && (
        <div className="emc-saving">
          <div className="emc-saving-text">{saved ? '✓ Added to your marketing checklist!' : 'Saving...'}</div>
        </div>
      )}
    </div>
  )
}
