/**
 * BreathworkLanding.jsx
 *
 * Post-breathwork session worksheet. Attendees capture their somatic experience.
 * Reuses HealingCompassLanding CSS (hcl-* classes).
 *
 * Sections:
 *   1. Hero
 *   2. Body Map — where in the body did you feel the energy?
 *   3. The Voice — what did the voice say?
 *   4. The Age — how old was the voice?
 *   5. Your Response — what did you say back?
 *   6. The Release — what emotions came up + what did the release feel like?
 *   7. Email delivery + WhatsApp
 *
 * Route: /breathwork
 */

import { useState, useRef, useEffect } from 'react'
import { useRevealAll } from '../hooks/useReveal'
import { supabase } from '../lib/supabaseClient'
import './HealingCompassLanding.css'

const BODY_AREAS = [
  { key: 'head', label: 'Head / Forehead', icon: '🧠' },
  { key: 'throat', label: 'Throat / Jaw', icon: '🗣️' },
  { key: 'chest', label: 'Chest / Heart', icon: '💜' },
  { key: 'solar_plexus', label: 'Solar Plexus / Stomach', icon: '🔥' },
  { key: 'gut', label: 'Gut / Lower Belly', icon: '🌊' },
  { key: 'shoulders', label: 'Shoulders / Upper Back', icon: '💪' },
  { key: 'hands', label: 'Hands / Arms', icon: '🤲' },
  { key: 'legs', label: 'Legs / Feet', icon: '🦶' },
  { key: 'whole_body', label: 'Whole Body', icon: '✨' },
  { key: 'nowhere', label: 'Nowhere specific', icon: '🫧' },
]

const EMOTIONS = [
  { key: 'sadness', label: 'Sadness', icon: '😢' },
  { key: 'anger', label: 'Anger', icon: '😤' },
  { key: 'fear', label: 'Fear', icon: '😨' },
  { key: 'grief', label: 'Grief', icon: '💔' },
  { key: 'relief', label: 'Relief', icon: '😮‍💨' },
  { key: 'joy', label: 'Joy', icon: '😊' },
  { key: 'love', label: 'Love', icon: '❤️' },
  { key: 'shame', label: 'Shame', icon: '😞' },
  { key: 'confusion', label: 'Confusion', icon: '😵‍💫' },
  { key: 'peace', label: 'Peace', icon: '🕊️' },
  { key: 'numbness', label: 'Numbness', icon: '😶' },
  { key: 'other', label: 'Something else', icon: '❓' },
]

export default function BreathworkLanding() {
  const revealRef = useRevealAll()
  const heroRef = useRef(null)
  const emailRef = useRef(null)

  const [bodyAreas, setBodyAreas] = useState([])
  const [bodyDescription, setBodyDescription] = useState('')
  const [voiceSaid, setVoiceSaid] = useState('')
  const [voiceAge, setVoiceAge] = useState('')
  const [yourResponse, setYourResponse] = useState('')
  const [emotions, setEmotions] = useState([])
  const [releaseDescription, setReleaseDescription] = useState('')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [stickyVisible, setStickyVisible] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  useEffect(() => { document.title = 'Breathwork Session — Your Experience' }, [])

  // Sticky CTA
  useEffect(() => {
    const heroEl = heroRef.current
    const emailEl = emailRef.current
    if (!heroEl) return

    let heroOut = false
    let emailIn = false
    const update = () => setStickyVisible(heroOut && !emailIn)

    const heroObs = new IntersectionObserver(
      ([e]) => { heroOut = !e.isIntersecting; update() },
      { threshold: 0 }
    )
    heroObs.observe(heroEl)

    let emailObs
    if (emailEl) {
      emailObs = new IntersectionObserver(
        ([e]) => { emailIn = e.isIntersecting; update() },
        { threshold: 0 }
      )
      emailObs.observe(emailEl)
    }

    return () => { heroObs.disconnect(); emailObs?.disconnect() }
  }, [])

  const toggleBodyArea = (key) => {
    setBodyAreas(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const toggleEmotion = (key) => {
    setEmotions(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const handleSubmit = async () => {
    setError('')

    if (!name.trim()) {
      setError('Enter your name above.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        whatsapp: whatsapp.trim() || null,
        session_type: 'breathwork',
        body_areas: bodyAreas,
        body_description: bodyDescription.trim() || null,
        voice_said: voiceSaid.trim() || null,
        voice_age: voiceAge.trim() || null,
        your_response: yourResponse.trim() || null,
        emotions,
        release_description: releaseDescription.trim() || null,
      }

      // Save to workshop_submissions (reuse same table with session_type)
      const { error: insertError } = await supabase
        .from('workshop_submissions')
        .insert({
          name: payload.name,
          email: payload.email,
          whatsapp: payload.whatsapp,
          emotional_need: payload.session_type,
          protective_pattern: payload.body_areas.join(', '),
          essence_archetype: payload.emotions.join(', '),
          action_commitment: payload.voice_said,
          new_belief: payload.your_response,
          letter_photo_url: JSON.stringify({
            body_description: payload.body_description,
            voice_age: payload.voice_age,
            release_description: payload.release_description,
          }),
        })

      if (insertError) throw insertError

      setSubmitted(true)

      // If authenticated, mark quest complete
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.id) {
          const { data: existing } = await supabase.from('quest_completions')
            .select('id').eq('user_id', user.id).eq('quest_id', 'session_with_huzz').maybeSingle()
          if (!existing) {
            await supabase.from('quest_completions').insert({
              user_id: user.id,
              quest_id: 'session_with_huzz',
              quest_category: 'Healing',
              quest_type: 'Reconnect',
              points_earned: 10,
              challenge_day: 0,
            }).catch(() => {})
            await supabase.rpc('increment_scores', { p_user_id: user.id, p_project_id: null, p_category: 'healing', p_points: 10, p_week_start: new Date().toISOString().slice(0, 10) }).catch(() => {})
          }
          await supabase.from('workshop_submissions')
            .update({ user_id: user.id })
            .ilike('email', email.trim())
            .is('user_id', null)
            .catch(() => {})
        }
      } catch {}
    } catch (err) {
      console.error('Submit error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="hcl" ref={revealRef}>

      {/* ===== HERO ===== */}
      <section className="hcl-hero" ref={heroRef}>
        <div className="hcl-hero-glow" aria-hidden="true" />
        <div className="hcl-container hcl-hero-content">
          <p className="hcl-hero-label">Breathwork Session</p>
          <h1 className="hcl-hero-headline">Your Somatic Experience</h1>
          <p className="hcl-hero-sub">
            Capture what came up during today's session while it's still fresh in your body.
          </p>
          <div className="hcl-scroll-hint" aria-hidden="true">
            <span className="hcl-scroll-arrow" />
          </div>
        </div>
      </section>

      {/* ===== SECTION 1: YOUR NAME ===== */}
      <section className="hcl-section-light">
        <div className="hcl-container">
          <p className="hcl-section-label hcl-section-label--dark reveal-fade-up">First Things First</p>
          <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
            What's your name?
          </h2>
          <div className="hcl-action-input-wrap reveal-fade-up">
            <input
              type="text"
              className="hcl-action-input"
              placeholder="Your first name"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: BODY MAP ===== */}
      <section className="hcl-section-dark">
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">The Body Map</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            Where did you feel the energy?
          </h2>
          <p className="hcl-section-desc reveal-fade-up">
            During the breathwork, where in your body did you notice sensation, tension, or release?
            <span className="hcl-tap-hint">Tap all that apply</span>
          </p>

          <div className="hcl-needs-pair reveal-fade-up">
            {BODY_AREAS.map(area => (
              <button
                key={area.key}
                className={`hcl-card hcl-need-card ${bodyAreas.includes(area.key) ? 'hcl-card--selected' : ''}`}
                onClick={() => toggleBodyArea(area.key)}
              >
                <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'block' }}>{area.icon}</span>
                <span className="hcl-need-name">{area.label}</span>
              </button>
            ))}
          </div>

          <div className="hcl-action-input-wrap reveal-fade-up" style={{ marginTop: '1.5rem' }}>
            <p className="hcl-section-desc" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Describe what you felt (optional)
            </p>
            <textarea
              className="hcl-action-input"
              placeholder="e.g. Tightness in my chest that slowly melted, tingling in my hands..."
              value={bodyDescription}
              onChange={e => setBodyDescription(e.target.value)}
              rows={3}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: THE VOICE ===== */}
      <section className="hcl-section-light">
        <div className="hcl-container">
          <p className="hcl-section-label hcl-section-label--dark reveal-fade-up">The Voice</p>
          <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
            What did the voice say to you?
          </h2>
          <p className="hcl-section-desc hcl-section-desc--dark reveal-fade-up">
            During the session, a voice or thought may have surfaced. What did it say?
          </p>
          <div className="hcl-action-input-wrap reveal-fade-up">
            <textarea
              className="hcl-action-input"
              placeholder={'e.g. "You\'re not good enough" or "Nobody actually cares" or "You have to do it all yourself"'}
              value={voiceSaid}
              onChange={e => setVoiceSaid(e.target.value)}
              rows={3}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: THE AGE ===== */}
      <section className="hcl-section-dark">
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">The Origin</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            How old was the voice?
          </h2>
          <p className="hcl-section-desc reveal-fade-up">
            If the voice had an age, how old did it feel? This is the part of you that first learned this story.
          </p>
          <div className="hcl-action-input-wrap reveal-fade-up">
            <input
              type="text"
              className="hcl-action-input"
              placeholder="e.g. 7 years old, teenager, I'm not sure..."
              value={voiceAge}
              onChange={e => setVoiceAge(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: YOUR RESPONSE ===== */}
      <section className="hcl-section-light">
        <div className="hcl-container">
          <p className="hcl-section-label hcl-section-label--dark reveal-fade-up">Your Response</p>
          <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
            What did you say back?
          </h2>
          <p className="hcl-section-desc hcl-section-desc--dark reveal-fade-up">
            When you met that younger version of yourself, what did you tell them?
          </p>
          <div className="hcl-action-input-wrap reveal-fade-up">
            <textarea
              className="hcl-action-input"
              placeholder={'e.g. "You are safe now. I\'ve got you. You don\'t have to carry this alone anymore."'}
              value={yourResponse}
              onChange={e => setYourResponse(e.target.value)}
              rows={3}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: THE RELEASE ===== */}
      <section className="hcl-section-dark">
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">The Release</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            What emotions came up?
          </h2>
          <p className="hcl-section-desc reveal-fade-up">
            What did you feel during or after the release?
            <span className="hcl-tap-hint">Tap all that apply</span>
          </p>

          <div className="hcl-needs-pair reveal-fade-up">
            {EMOTIONS.map(emotion => (
              <button
                key={emotion.key}
                className={`hcl-card hcl-need-card ${emotions.includes(emotion.key) ? 'hcl-card--selected' : ''}`}
                onClick={() => toggleEmotion(emotion.key)}
              >
                <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem', display: 'block' }}>{emotion.icon}</span>
                <span className="hcl-need-name">{emotion.label}</span>
              </button>
            ))}
          </div>

          <div className="hcl-action-input-wrap reveal-fade-up" style={{ marginTop: '1.5rem' }}>
            <p className="hcl-section-desc" style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              What was the release like?
            </p>
            <textarea
              className="hcl-action-input"
              placeholder="e.g. I cried for the first time in years, I felt my whole body shake, I felt lighter than I have in months..."
              value={releaseDescription}
              onChange={e => setReleaseDescription(e.target.value)}
              rows={3}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: EMAIL DELIVERY ===== */}
      <section className="hcl-section-light hcl-email-section" ref={emailRef}>
        <div className="hcl-container" style={{ textAlign: 'center' }}>
          {!submitted ? (
            <>
              <p className="hcl-section-label hcl-section-label--dark reveal-fade-up">Save Your Experience</p>
              <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
                Keep This With You
              </h2>
              <p className="hcl-section-desc hcl-section-desc--dark reveal-fade-up">
                Your answers will be saved to your profile. This is yours to come back to.
              </p>

              <div className="hcl-email-form reveal-fade-up">
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  className="hcl-email-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
                <input
                  type="tel"
                  className="hcl-email-input"
                  placeholder="WhatsApp number (incl. area code, e.g. +61...)"
                  value={whatsapp}
                  onChange={e => { setWhatsapp(e.target.value); setError('') }}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                />
                <button
                  className="hcl-cta-gold"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save My Experience'}
                </button>
              </div>

              {error && (
                <p className="hcl-error">{error}</p>
              )}
            </>
          ) : (
            <div className="hcl-success reveal-scale">
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '0.5rem' }}>✨</span>
              <h2 className="hcl-section-heading hcl-section-heading--dark">Saved</h2>
              <p className="hcl-section-desc hcl-section-desc--dark">
                Your breathwork experience has been captured. Thank you for showing up today.
              </p>
              <a href="/get-started" className="hcl-cta-gold" style={{ display: 'inline-block', marginTop: '1rem', textDecoration: 'none' }}>
                Continue to Find My Flow →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Sticky CTA */}
      {stickyVisible && !submitted && !inputFocused && (
        <div className="hcl-sticky-cta">
          <button
            className="hcl-cta-gold"
            onClick={() => emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            Save My Experience ↓
          </button>
        </div>
      )}
    </div>
  )
}
