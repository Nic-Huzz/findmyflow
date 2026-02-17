/**
 * WhatIsHealingExplainer.jsx
 *
 * Healing explainer: What is Healing?
 * Walks users through the concept of emotional splinters and
 * defines healing as removing fear to reconnect with your authentic self.
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

export default function WhatIsHealingExplainer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)

  const slides = [
    {
      title: "Think About You as a Kid...",
      content: (
        <>
          <p><strong>Take a moment to think about you as a kid.</strong></p>
          <p>Visualise those chubby cheeks, goofy smile, the life behind your eyes.</p>
          <p>Remember...</p>
          <div className="emphasis">
            How <strong>playful</strong> you were. How <strong>full of love</strong>. How <strong>care-free</strong>.
          </div>
          <p>Remember that?</p>
        </>
      )
    },
    {
      title: "So Where Did They Go?",
      content: (
        <>
          <div className="emphasis">
            I'm a big believer we're still those small people in grown-up bodies.
          </div>
          <p><strong>So where did they go?</strong></p>
        </>
      )
    },
    {
      title: "Here's What I Believe...",
      content: (
        <>
          <p><strong>Somewhere along the way, we had experiences that made being ourselves feel UNSAFE.</strong></p>
          <p>We live in a society that is riddled by fear of judgement, fear of failure and fear of not being good enough. As if its normal to have these fears.</p>
          <p>But I'm here to say that's bullsh*t.</p>
          <p>I'm here to say thats what happens when we normalise trauma.</p>
          <div className="emphasis">
            And I know this because I did it to myself for 14 years without realizing.
          </div>
        </>
      )
    },
    {
      title: "An Emotional Splinter",
      content: (
        <>
          <p><strong>At 14 I was a walking rainbow, fluro pinks, blues, oranges, purples. You name it, I wore it.</strong></p>
          <p>But other teenage boys being teenage boys, saw this and started teasing me. Calling me weird. Outcasting me.</p>
          <p>I just felt like I was expressing myself authentically so when they did this it hurt. But to cry and be upset would only lead to more teasing, bantering, joking.</p>
          <p>So I bottled it up, acted like I didnt care.</p>
          <div className="emphasis">
            But I did and it left me too scared to wear rainbow clothes again for the next <strong>TWELVE YEARS</strong>.
          </div>
          <p>That's what I call an <strong>emotional splinter</strong>.</p>
        </>
      )
    },
    {
      title: "They Leave Us Too Scared to Be Ourselves",
      content: (
        <>
          <p><strong>And here's the thing...</strong></p>
          <p>It doesn't matter what these moments are. What matters is we HATE how we felt. The shame. The embarrassment. The fear. We never want to feel that way again.</p>
          <p>For me, by my early 20s, this meant no more rainbow clothes. No more playfulness. No more dancing.</p>
          <p>Basically all the things that anyone who knows me today... all the things that light me up and make me, me.</p>
          <div className="emphasis">
            This is what breaks my heart most about emotional splinters...<br /><br />
            <strong>They leave us too scared to be ourselves.</strong>
          </div>
        </>
      )
    },
    {
      title: "Let's Find Yours",
      content: (
        <>
          <div className="emphasis">
            <strong>I believe every single person has them.</strong>
          </div>
          <p>So let's find yours.</p>
        </>
      )
    },
    {
      title: "What is Healing?",
      content: (
        <>
          <p><strong>In summary: what is healing?</strong></p>
          <div className="emphasis-lg">
            <strong>Removing fear.</strong>
          </div>
          <p>So you can show-up in the world without any fear of judgement, failure or not being good enough.</p>
          <div className="emphasis">
            Free to be that <strong>loving, playful, carefree</strong> version of you once again.
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
      await syncHealingExplainerWithChallenge(user.id, 'what_is_healing_explainer')

      await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'what_is_healing_explainer',
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
                navigate('/what-is-healing-explainer', { replace: true })
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
              {isCompleting ? 'Completing...' : "I'm Ready ✨"}
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
