/**
 * EmotionalSplinterExplainer.jsx
 *
 * Healing explainer: What is an Emotional Splinter?
 * Deep dive into Big T vs Little T trauma, the brain biology behind
 * emotional splinters, and how protective patterns form.
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

export default function EmotionalSplinterExplainer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)

  const slides = [
    {
      title: "What is an Emotional Splinter?",
      content: (
        <>
          <p><strong>To understand what emotional splinters are...</strong></p>
          <p>We first need to understand what trauma is – it might not be what you think.</p>
        </>
      )
    },
    {
      title: "I Ain't Got No Trauma",
      content: (
        <>
          <p><strong>When I walked into my first breathwork class and the faciliator said we'd be releasing trauma, I thought:</strong></p>
          <div className="emphasis">
            <em>"Trauma?! I ain't got no trauma! I'm a priviledged white boy!"</em>
          </div>
          <p>I hadn't experienced anything 'serious,' so I thought I had no trauma at all.</p>
          <p>Fast forward 20 minutes and I was curled up in a ball crying.</p>
          <p>The problem was <strong>I didn't understand what trauma was</strong>.</p>
        </>
      )
    },
    {
      title: "Emotion = Energy in Motion",
      content: (
        <>
          <p><strong>If 'emotion' is energy-in-motion.</strong></p>
          <div className="emphasis">
            <strong>Trauma is what happens when that energy gets frozen.</strong>
          </div>
          <p>Imagine pressing pause on a song halfway through — the emotion never finishes playing.</p>
          <p>There's two things that cause this:</p>
        </>
      )
    },
    {
      title: "1. Big T Trauma",
      content: (
        <>
          <h2 className="slide-heading">#1 Big T Trauma</h2>
          <p><strong>These are any situations where the experience is so emotionally overwhelming it's more than what our system can handle.</strong></p>
          <p>So rather than process the emotion, our system protects us by going into shock.</p>
          <p>Think the death of a loved one, a serious accident, something sudden and overwhelming.</p>
          <div className="emphasis">
            This is what I thought <strong>all</strong> trauma was.
          </div>
        </>
      )
    },
    {
      title: "2. Little T Trauma",
      content: (
        <>
          <h2 className="slide-heading">#2 Little T Trauma</h2>
          <p><strong>Little did I know that "Little T trauma's" also exist.</strong></p>
          <p>Trauma we often don't know about because they aren't caused by large physical experiences. They are traumas that are far more subtle:</p>
          <div className="emphasis">
            These are moments where we simply <strong>didn't feel safe to process the emotion</strong> in the moment.
          </div>
          <p>These are the trauma's I believe we all experience as we grow-up.</p>
          <p>They are why I found myself curled up in a ball crying:</p>
        </>
      )
    },
    {
      title: "The Rainbow Clothes",
      content: (
        <>
          <p><strong>When I was 13 I loved to wear rainbow colours. It was my way of expressing my natural care-free joy.</strong></p>
          <p>But teenage boys being teenage boys started calling me names, making jokes, laughing at me.</p>
          <p>Their comments hurt, but to cry or be upset would have only led to more teasing, joking or bantering.</p>
          <div className="emphasis">
            So rather than express what I was feeling, I bottled it up and pretended I didn't care. <strong>Smiling on the outside, hurting on the inside.</strong>
          </div>
        </>
      )
    },
    {
      title: "What Happens Next",
      content: (
        <>
          <p>At a <strong>mental level</strong> my mind then formed a story to make sense of the pain.</p>
          <div className="emphasis">
            <em>"Rainbow clothes are lame".</em>
          </div>
          <p>And I don't personally identify as being lame so bye bye rainbow clothes.</p>
          <p>At a <strong>somatic level</strong> (fancy way to say body), by bottling the emotion up, I never allowed it to process.</p>
          <p>The song never finished.</p>
          <p>So my brain puts a big red WARNING sticker on it and creates an <strong>inner alarm</strong>.</p>
          <p>An alarm we feel in the form of hesitation and fear anytime we face a similar situation.</p>
        </>
      )
    },
    {
      title: "The Inner Alarm",
      content: (
        <>
          <div className="emphasis">
            <strong>Ready for a secret about your brain that's wild once you understand it?</strong>
          </div>
        </>
      )
    },
    {
      title: "Your Brain Speaks Two Languages",
      content: (
        <>
          <p><strong>Quick brain biology lesson:</strong></p>
          <div className="step-list">
            <div className="step-item">
              <div className="item-icon">🔴</div>
              <div>
                <h4>Amygdala</h4>
                <p className="item-text">Your emotions are processed by an old part of your brain called the amygdala.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="item-icon">🔵</div>
              <div>
                <h4>Prefrontal Cortex</h4>
                <p className="item-text">Your thoughts are processed by a newer part of your brain: prefrontal cortex.</p>
              </div>
            </div>
          </div>
          <p>The wild fact?</p>
          <div className="emphasis">
            <strong>They don't speak the same language.</strong> It's like one speaks French and the other Chinese.
          </div>
          <p>The amygdala uses feelings, the pre-frontal cortex uses words.</p>
        </>
      )
    },
    {
      title: "Lost in Translation",
      content: (
        <>
          <p><strong>The amygdala, our emotional centre, stores trauma and is the part of the brain that sets off our inner alarm.</strong></p>
          <p>The catch?</p>
          <p>When this alarm goes off, our prefrontal cortex (the thinking part of our brain) notices the alarm but <strong>doesn't understand why the alarm's going off</strong>.</p>
          <p>So it does its best to guess and to protect you.</p>
          <p>For 12 years my inner alarm went off when I considered wearing rainbow clothes.</p>
          <p>In these moments my brain didn't say: <em>"You were laughed at and now you feel unsafe wearing rainbow clothes."</em></p>
          <div className="emphasis">
            It said: <em>"Rainbow clothes are lame I don't like them anymore."</em>
          </div>
          <p>It wasn't lying deliberately. It was doing it's best to translate what I was feeling and to keep me safe.</p>
        </>
      )
    },
    {
      title: "Protective Patterns",
      content: (
        <>
          <p><strong>The heartbreaking thing is now I find myself completely disconnected to my essence and how it wants to express.</strong></p>
          <p>So what did I do?</p>
          <p>For the next 12 years I wore party shirts of different beer brands.</p>
          <p>Why? Because boys love beer and beer brands are cool, so if I wear them then I couldn't be called out and hurt again.</p>
          <p>In other words, to keep us safe instead of being our care-free, loving, playful-self, we end up adopting behaviours like the:</p>
          <div className="step-list">
            <div className="step-item">
              <div className="item-icon">👻</div>
              <div>
                <h4>The Ghost</h4>
                <p className="item-text">— so we don't risk being seen.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="item-icon">🙇</div>
              <div>
                <h4>The People Pleaser</h4>
                <p className="item-text">— so no one gets upset.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="item-icon">🎮</div>
              <div>
                <h4>The Controller</h4>
                <p className="item-text">— so nothing can go wrong.</p>
              </div>
            </div>
            <div className="step-item">
              <div className="item-icon">🎭</div>
              <div>
                <h4>The Performer</h4>
                <p className="item-text">– Being a chameleon to fit in.</p>
              </div>
            </div>
          </div>
          <p>Just to name a few...</p>
        </>
      )
    },
    {
      title: "This is an Emotional Splinter",
      content: (
        <>
          <div className="emphasis-lg">
            <strong>This is what an emotional splinter is.</strong>
          </div>
          <p><strong>The traumas we haven't processed that are now silently shaping our behaviour.</strong></p>
          <p>Making us scared to literally be ourselves.</p>
        </>
      )
    },
    {
      title: "So How Do We Remove Them?",
      content: (
        <>
          <p>Just like a splinter, once it's out, the pain goes away.</p>
          <p>Our inner alarm turns off and fear disappears.</p>
          <div className="emphasis">
            <strong>So how do we remove these emotional splinters?</strong>
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
      await syncHealingExplainerWithChallenge(user.id, 'emotional_splinter_explainer')

      await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'emotional_splinter_explainer',
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      navigate('/how-do-we-heal-explainer')
    } catch (err) {
      console.error('Error completing explainer:', err)
      navigate('/how-do-we-heal-explainer')
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
                navigate('/emotional-splinter-explainer', { replace: true })
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
              {isCompleting ? 'Completing...' : "I'm Keen to Find Out!"}
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
