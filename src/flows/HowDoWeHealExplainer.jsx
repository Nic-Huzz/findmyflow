/**
 * HowDoWeHealExplainer.jsx
 *
 * Healing explainer: How Do We Heal?
 * Introduces the Four R's framework and maps healing modalities to each.
 *
 * Created: Feb 2026
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { syncHealingExplainerWithChallenge } from '../lib/questCompletionHelpers'
import '../styles/flow-base.css'
import './HealingExplainer.css'

export default function HowDoWeHealExplainer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)

  const slides = [
    {
      title: "The Four R's",
      content: (
        <>
          <p><strong>I believe healing follows the path of the Four R's:</strong></p>
          <div className="step-list">
            <div className="step-item">
              <div className="item-icon">1</div>
              <div><h4>Recognise</h4></div>
            </div>
            <div className="step-item">
              <div className="item-icon">2</div>
              <div><h4>Release</h4></div>
            </div>
            <div className="step-item">
              <div className="item-icon">3</div>
              <div><h4>Rewire</h4></div>
            </div>
            <div className="step-item">
              <div className="item-icon">4</div>
              <div><h4>Reconnect</h4></div>
            </div>
          </div>
        </>
      )
    },
    {
      title: "1. Recognise",
      content: (
        <>
          <div className="emphasis-lg">
            <strong>Recognise</strong> – your emotional splinters and your protective patterns
          </div>
          <p>For me this meant recognising I was becoming the Performer and my beer logo shirts were an armour protecting my insecurities.</p>
        </>
      )
    },
    {
      title: "2. Release",
      content: (
        <>
          <div className="emphasis-lg">
            <strong>Release</strong> – the emotional splinters (the micro-trauma's)
          </div>
          <p>For me this was expressing the emotions I didn't back then, the tears, the anger, the shame I felt when teased about the rainbow clothes.</p>
        </>
      )
    },
    {
      title: "3. Rewire",
      content: (
        <>
          <div className="emphasis-lg">
            <strong>Rewire</strong> – the beliefs your emotional splinters created
          </div>
          <p>For 12 years I'd chosen to dress one way, I now needed to rewire my behaviour and habits to show-up as this rainbow once again.</p>
        </>
      )
    },
    {
      title: "4. Reconnect",
      content: (
        <>
          <div className="emphasis-lg">
            <strong>Reconnect</strong> – to the loving, playful, care-free version of you.
          </div>
          <p>For me this was creating spaces for things that I loved to do like dancing.</p>
        </>
      )
    },
    {
      title: "Every Modality Maps to the Four R's",
      content: (
        <>
          <p><strong>I believe every healing modality can be mapped to these four R's:</strong></p>
          <div className="four-rs-grid">
            <div className="r-column">
              <h4>Recognise</h4>
              <ul>
                <li>Meditation</li>
                <li>Talk Therapy</li>
                <li>Muscle-Testing</li>
                <li>Inner Child Work</li>
                <li>Journaling</li>
              </ul>
            </div>
            <div className="r-column">
              <h4>Release</h4>
              <ul>
                <li>Breathwork</li>
                <li>Plant Medicine</li>
                <li>EFT Tapping</li>
                <li>Acupuncture</li>
                <li>Somatic Therapies</li>
              </ul>
            </div>
            <div className="r-column">
              <h4>Rewire</h4>
              <ul>
                <li>NLP</li>
                <li>CBT</li>
                <li>Affirmations</li>
                <li>Hypnotherapy</li>
                <li>IFS</li>
                <li>Psychedelic-Assisted Therapy</li>
              </ul>
            </div>
            <div className="r-column">
              <h4>Revitalise</h4>
              <ul>
                <li>Dance</li>
                <li>Reiki</li>
                <li>Sound Healing</li>
                <li>Yoga</li>
                <li>Community</li>
              </ul>
            </div>
          </div>
        </>
      )
    },
    {
      title: "Your Healing Journey",
      content: (
        <>
          <p><strong>The daily and weekly quests in this challenge are designed around these four R's.</strong></p>
          <p>Each one is a small step on the path — recognising your patterns, releasing what's stuck, rewiring old stories, and reconnecting with who you really are.</p>
          <div className="emphasis">
            <strong>You don't have to do it all at once. Just one R at a time.</strong>
          </div>
        </>
      )
    }
  ]

  useEffect(() => {
    if (searchParams.get('results') === 'true') {
      setViewingResults(true)
      setCurrentSlide(slides.length - 1)
    }
  }, [searchParams])

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      await syncHealingExplainerWithChallenge(user.id, 'how_do_we_heal_explainer')

      await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'how_do_we_heal_explainer',
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      navigate('/7-day-challenge')
    } catch (err) {
      console.error('Error completing explainer:', err)
      navigate('/7-day-challenge')
    }
  }

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    } else {
      navigate('/7-day-challenge')
    }
  }

  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="healing-explainer flow-base">
      <div className="slide-dots">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`slide-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      <div className="welcome-container" key={currentSlide}>
        <div className="welcome-message animated-text">
          {slides[currentSlide].content}
        </div>

        {isLastSlide && viewingResults ? (
          <>
            <button className="primary-button" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button
              className="go-back-link"
              onClick={() => {
                setViewingResults(false)
                setCurrentSlide(0)
                navigate('/how-do-we-heal-explainer', { replace: true })
              }}
            >
              Review Again
            </button>
          </>
        ) : isLastSlide ? (
          <>
            <button
              className="primary-button"
              onClick={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? 'Completing...' : "Let's Heal →"}
            </button>
            <button className="go-back-link" onClick={handlePrev}>
              ← Back
            </button>
          </>
        ) : (
          <>
            <button className="primary-button" onClick={handleNext}>
              Next →
            </button>
            <button className="go-back-link" onClick={handlePrev}>
              ← Back
            </button>
          </>
        )}
      </div>
    </div>
  )
}
