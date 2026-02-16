import { useState, useRef, useEffect } from 'react'
import { useRevealAll } from '../hooks/useReveal'
import { essenceProfiles } from '../data/essenceProfiles'
import { supabase } from '../lib/supabaseClient'
import {
  EMOTIONAL_NEEDS,
  PROTECTIVE_PATTERNS,
  FOUR_RS,
  WORKSHOP_ARCHETYPE_NAMES
} from '../data/workshopContent'

const workshopArchetypes = essenceProfiles.essence_archetypes.filter(a =>
  WORKSHOP_ARCHETYPE_NAMES.includes(a.name)
)

export default function HealingCompassLanding() {
  const revealRef = useRevealAll()
  const heroRef = useRef(null)
  const footerRef = useRef(null)
  const needsRef = useRef(null)
  const patternsRef = useRef(null)
  const archetypesRef = useRef(null)
  const emailRef = useRef(null)

  const [answers, setAnswers] = useState({
    emotionalNeed: null,
    action: '',
    protectivePattern: null,
    essenceArchetype: null,
    newBelief: ''
  })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [stickyVisible, setStickyVisible] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [letterPhoto, setLetterPhoto] = useState(null)
  const [letterPhotoPreview, setLetterPhotoPreview] = useState(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [letterPhotoUrl, setLetterPhotoUrl] = useState(null)
  const [inputFocused, setInputFocused] = useState(false)
  const photoInputRef = useRef(null)

  useEffect(() => { document.title = 'Your Healing Compass — Workshop Results' }, [])

  // Sticky CTA: show after hero, hide when footer visible
  useEffect(() => {
    const heroEl = heroRef.current
    const footerEl = footerRef.current
    if (!heroEl) return

    let heroOut = false
    let footerIn = false
    const update = () => setStickyVisible(heroOut && !footerIn)

    const heroObs = new IntersectionObserver(
      ([e]) => { heroOut = !e.isIntersecting; update() },
      { threshold: 0 }
    )
    heroObs.observe(heroEl)

    let footerObs
    if (footerEl) {
      footerObs = new IntersectionObserver(
        ([e]) => { footerIn = e.isIntersecting; update() },
        { threshold: 0 }
      )
      footerObs.observe(footerEl)
    }

    return () => { heroObs.disconnect(); footerObs?.disconnect() }
  }, [])

  const set = (key, val) => {
    setAnswers(prev => ({ ...prev, [key]: val }))
    setValidationErrors(prev => prev.filter(e => e !== key))
  }

  const selectedNeed = EMOTIONAL_NEEDS.find(n => n.key === answers.emotionalNeed)
  const selectedPattern = PROTECTIVE_PATTERNS.find(p => p.key === answers.protectivePattern)
  const selectedArchetype = workshopArchetypes.find(a => a.name === answers.essenceArchetype)

  const allSelectionsComplete = answers.emotionalNeed && answers.protectivePattern && answers.essenceArchetype?.trim() && name.trim()

  const scrollToMissing = () => {
    const missing = []
    if (!answers.emotionalNeed) missing.push({ key: 'emotionalNeed', ref: needsRef, label: 'emotional need' })
    if (!answers.protectivePattern) missing.push({ key: 'protectivePattern', ref: patternsRef, label: 'protective pattern' })
    if (!answers.essenceArchetype?.trim()) missing.push({ key: 'essenceArchetype', ref: archetypesRef, label: 'essence archetype' })

    if (missing.length > 0) {
      setValidationErrors(missing.map(m => m.key))
      const first = missing[0]
      first.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Pulse animation
      first.ref.current?.classList.add('hcl-pulse')
      setTimeout(() => first.ref.current?.classList.remove('hcl-pulse'), 2000)
      return missing.map(m => m.label)
    }
    return null
  }

  const handlePhotoSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview immediately
    setLetterPhoto(file)
    setLetterPhotoPreview(URL.createObjectURL(file))

    // Upload to Supabase Storage
    setPhotoUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { data, error: uploadError } = await supabase.storage
        .from('workshop-photos')
        .upload(fileName, file, { contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('workshop-photos')
        .getPublicUrl(data.path)

      setLetterPhotoUrl(urlData.publicUrl)
    } catch (err) {
      console.error('Photo upload error:', err)
      // Don't block the form — photo is optional
    } finally {
      setPhotoUploading(false)
    }
  }

  const removePhoto = () => {
    setLetterPhoto(null)
    setLetterPhotoPreview(null)
    setLetterPhotoUrl(null)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    setError('')
    setValidationErrors([])

    if (photoUploading) {
      setError('Please wait for your photo to finish uploading.')
      return
    }
    if (!name.trim()) {
      setError('Enter your name in the letter above.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }

    const missing = scrollToMissing()
    if (missing) {
      setError(`Choose your ${missing.join(', ')} above.`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-workshop-profile`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            emotionalNeed: answers.emotionalNeed,
            action: answers.action.trim(),
            protectivePattern: answers.protectivePattern,
            essenceArchetype: answers.essenceArchetype,
            newBelief: answers.newBelief.trim(),
            letterPhotoUrl: letterPhotoUrl || null
          })
        }
      )
      if (!res.ok) throw new Error('Failed to send')
      setSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="hcl" ref={revealRef}>

      {/* ===== SECTION 1: HERO ===== */}
      <section className="hcl-hero" ref={heroRef}>
        <div className="hcl-hero-glow" aria-hidden="true" />
        <div className="hcl-container hcl-hero-content">
          <p className="hcl-hero-label">Healing Compass Workshop</p>
          <h1 className="hcl-hero-headline">Your Healing Compass</h1>
          <p className="hcl-hero-sub">
            Everything from today's workshop — your answers, the frameworks, and your next steps.
          </p>
          <div className="hcl-scroll-hint" aria-hidden="true">
            <span className="hcl-scroll-arrow" />
          </div>
        </div>
      </section>

      {/* ===== SECTION 2: EMOTIONAL SPLINTERS ===== */}
      <section className="hcl-section-light">
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">The Starting Point</p>
          <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
            Emotional Splinters
          </h2>
          <div className="hcl-splinter-text reveal-fade-up">
            <p>
              As children, we all experience moments where our emotional needs aren't met.
              These <em>"emotional splinters"</em> don't disappear — they create protective patterns
              that follow us into adulthood.
            </p>
            <p>
              Today we'll identify yours: the need that drives you, the pattern that protects you,
              and the essence that's waiting underneath.
            </p>
          </div>
          <div className="hcl-splinter-chain reveal-scale">
            <div className="hcl-chain-step">
              <span className="hcl-chain-icon">💔</span>
              <span className="hcl-chain-label">Unmet Need</span>
            </div>
            <span className="hcl-chain-arrow">→</span>
            <div className="hcl-chain-step">
              <span className="hcl-chain-icon">📖</span>
              <span className="hcl-chain-label">Limiting Belief Story</span>
            </div>
            <span className="hcl-chain-arrow">→</span>
            <div className="hcl-chain-step">
              <span className="hcl-chain-icon">🛡️</span>
              <span className="hcl-chain-label">Protective Pattern</span>
            </div>
            <span className="hcl-chain-arrow">→</span>
            <div className="hcl-chain-step">
              <span className="hcl-chain-icon">😔</span>
              <span className="hcl-chain-label">Feeling Stuck</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SECTION 3: EMOTIONAL NEEDS ===== */}
      <section className="hcl-section-dark" ref={needsRef}>
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">Your Core Need</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            4 Emotional Needs
          </h2>
          <p className="hcl-section-desc reveal-fade-up">
            Which of these feels most like the need you struggle to meet?
            <span className="hcl-tap-hint">Tap to select yours</span>
          </p>

          <div className="hcl-needs-groups">
            {['Survive', 'Thrive'].map(group => (
              <div key={group} className="hcl-needs-group reveal-fade-up">
                <p className="hcl-needs-group-label">{group}</p>
                <div className="hcl-needs-pair">
                  {EMOTIONAL_NEEDS.filter(n => n.group === group).map(need => (
                    <button
                      key={need.key}
                      className={`hcl-card hcl-need-card${answers.emotionalNeed === need.key ? ' hcl-card--selected' : ''}`}
                      onClick={() => set('emotionalNeed', need.key)}
                    >
                      {answers.emotionalNeed === need.key && <span className="hcl-card-check">✓</span>}
                      <span className="hcl-need-name">{need.name}</span>
                      <span className="hcl-need-subtitle">{need.subtitle}</span>
                      <p className="hcl-need-desc">{need.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 4: ACTION COMMITMENT ===== */}
      <section className="hcl-section-light">
        <div className="hcl-container">
          <p className="hcl-section-label hcl-section-label--dark reveal-fade-up">Your Commitment</p>
          <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
            What Will You Do Differently?
          </h2>
          <p className="hcl-section-desc hcl-section-desc--dark reveal-fade-up">
            When {selectedNeed ? `your need for ${selectedNeed.name.toLowerCase()}` : 'this need'} isn't
            being met, what's one action you'll take instead of falling into your old pattern?
          </p>
          <div className="hcl-action-input-wrap reveal-fade-up">
            <textarea
              className="hcl-action-input"
              placeholder="e.g. I'll pause and ask myself what I actually need right now..."
              value={answers.action}
              onChange={e => set('action', e.target.value)}
              rows={3}
              autoCapitalize="sentences"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 5: PROTECTIVE PATTERNS ===== */}
      <section className="hcl-section-dark" ref={patternsRef}>
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">Your Armour</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            5 Protective Patterns
          </h2>
          <p className="hcl-section-desc reveal-fade-up">
            Which pattern do you default to when life gets hard?
            <span className="hcl-tap-hint">Tap to select yours</span>
          </p>

          <div className="hcl-patterns-grid reveal-fade-up">
            {PROTECTIVE_PATTERNS.map(pattern => (
              <button
                key={pattern.key}
                className={`hcl-card hcl-pattern-card${answers.protectivePattern === pattern.key ? ' hcl-card--selected' : ''}`}
                onClick={() => set('protectivePattern', pattern.key)}
              >
                {answers.protectivePattern === pattern.key && <span className="hcl-card-check">✓</span>}
                <span className="hcl-pattern-name">{pattern.name}</span>
                <p className="hcl-pattern-desc">{pattern.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 6: THE 4R's ===== */}
      <section className="hcl-section-light">
        <div className="hcl-container">
          <p className="hcl-section-label hcl-section-label--dark reveal-fade-up">The Framework</p>
          <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
            The 4R's
          </h2>
          <p className="hcl-section-desc hcl-section-desc--dark reveal-fade-up">
            Four steps to transform a protective pattern back into your true essence.
          </p>

          <div className="hcl-4r-grid">
            {FOUR_RS.map((r, i) => (
              <div key={r.key} className="hcl-4r-card reveal-fade-up">
                <span className="hcl-4r-num">{i + 1}</span>
                <span className="hcl-4r-name">{r.name}</span>
                <p className="hcl-4r-desc">{r.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== SECTION 7: ESSENCE ARCHETYPES ===== */}
      <section className="hcl-section-dark" ref={archetypesRef}>
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">Your True Self</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            8 Essence Archetypes
          </h2>
          <p className="hcl-section-desc reveal-fade-up">
            Underneath every protective pattern is an essence — who you really are when the armour comes off.
            Use these as inspiration, or name your own.
          </p>

          <div className="hcl-archetypes-grid">
            {workshopArchetypes.map(arch => (
              <div
                key={arch.name}
                className="hcl-archetype-card hcl-archetype-card--inspiration reveal-fade-up"
              >
                <span className="hcl-arch-group">{arch.group}</span>
                <span className="hcl-arch-name">{arch.name}</span>
                <p className="hcl-arch-essence">{arch.essence}</p>
              </div>
            ))}
          </div>

          <div className="hcl-archetype-input-wrap reveal-fade-up">
            <label className="hcl-archetype-input-label" htmlFor="archetype-input">
              What's your essence archetype?
            </label>
            <input
              id="archetype-input"
              type="text"
              className="hcl-archetype-input"
              placeholder="e.g. Radiant Rebel, Wild Alchemist, or your own..."
              value={answers.essenceArchetype || ''}
              onChange={e => set('essenceArchetype', e.target.value)}
              autoCapitalize="words"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 8: FUTURE SELF LETTER ===== */}
      <section className="hcl-letter-section">
        <div className="hcl-container">
          <p className="hcl-section-label reveal-fade-up">Your Letter</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            A Letter to Your Future Self
          </h2>

          <div className="hcl-letter reveal-scale">
            <p className="hcl-letter-line">
              Dear{' '}
              <input
                type="text"
                className="hcl-letter-name-input"
                placeholder="your name"
                autoCapitalize="words"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
              ,
            </p>

            <p className="hcl-letter-line">
              Today I discovered that my core emotional need is{' '}
              <span className={`hcl-letter-fill${selectedNeed ? ' hcl-letter-fill--active' : ''}`}>
                {selectedNeed ? selectedNeed.name : '[emotional need]'}
              </span>
              {' '}— and that when it's not met, I've been using{' '}
              <span className={`hcl-letter-fill${selectedPattern ? ' hcl-letter-fill--active' : ''}`}>
                {selectedPattern ? selectedPattern.name : '[protective pattern]'}
              </span>
              {' '}to protect myself.
            </p>

            <p className="hcl-letter-line">
              The truth is,{' '}
              <span className={`hcl-letter-fill${selectedPattern ? ' hcl-letter-fill--active' : ''}`}>
                {selectedPattern ? selectedPattern.name : '[pattern]'}
              </span>
              {' '}kept me safe when I was younger.
              But I don't need that armour anymore.
            </p>

            <p className="hcl-letter-line">
              When the{' '}
              <span className={`hcl-letter-fill${selectedPattern ? ' hcl-letter-fill--active' : ''}`}>
                {selectedPattern ? selectedPattern.name : '[pattern]'}
              </span>
              {' '}shows up, I will remember to{' '}
              <span className={`hcl-letter-fill${answers.action.trim() ? ' hcl-letter-fill--active' : ''}`}>
                {answers.action.trim() || '[your action]'}
              </span>
              .
            </p>

            <p className="hcl-letter-line">
              You are a{' '}
              <span className={`hcl-letter-fill${answers.essenceArchetype?.trim() ? ' hcl-letter-fill--active' : ''}`}>
                {answers.essenceArchetype?.trim() || '[essence archetype]'}
              </span>
              {selectedArchetype && (
                <> — <em>{selectedArchetype.poetic_line}</em></>
              )}
            </p>

            <p className="hcl-letter-sign">
              With love,<br />
              <span className="hcl-letter-sign-name">
                {name.trim() || '___'}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ===== SECTION 8b: LETTER PHOTO UPLOAD ===== */}
      <section className="hcl-section-dark">
        <div className="hcl-container" style={{ textAlign: 'center' }}>
          <p className="hcl-section-label reveal-fade-up">Your Handwritten Letter</p>
          <h2 className="hcl-section-heading reveal-fade-up">
            Upload Your Letter
          </h2>
          <p className="hcl-section-desc reveal-fade-up" style={{ margin: '0 auto 2rem' }}>
            Take a photo of the letter you wrote to yourself during the workshop.
            We'll include it in your email so you never lose it.
          </p>

          <div className="hcl-photo-upload reveal-scale">
            {!letterPhotoPreview ? (
              <label className="hcl-photo-dropzone" htmlFor="letter-photo-input">
                <span className="hcl-photo-icon">📸</span>
                <span className="hcl-photo-cta">Tap to upload your letter photo</span>
                <span className="hcl-photo-hint">JPG, PNG, or HEIC</span>
                <input
                  ref={photoInputRef}
                  id="letter-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="hcl-photo-input-hidden"
                />
              </label>
            ) : (
              <div className="hcl-photo-preview-wrap">
                <img
                  src={letterPhotoPreview}
                  alt="Your letter"
                  className="hcl-photo-preview"
                />
                {photoUploading && (
                  <div className="hcl-photo-uploading">Uploading...</div>
                )}
                <button className="hcl-photo-remove" onClick={removePhoto}>
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== SECTION 8c: NEW BELIEF ===== */}
      <section className="hcl-section-light">
        <div className="hcl-container">
          <p className="hcl-section-label hcl-section-label--dark reveal-fade-up">Your New Truth</p>
          <h2 className="hcl-section-heading hcl-section-heading--dark reveal-fade-up">
            The Message to Your Younger Self
          </h2>
          <p className="hcl-section-desc hcl-section-desc--dark reveal-fade-up">
            During the workshop, you spoke to your younger self and gave them a new truth —
            a belief to replace the old one.
          </p>
          <div className="hcl-action-input-wrap reveal-fade-up">
            <textarea
              className="hcl-action-input"
              placeholder="e.g. You are safe to be seen. Your sensitivity is your superpower, not your weakness..."
              value={answers.newBelief}
              onChange={e => set('newBelief', e.target.value)}
              rows={3}
              autoCapitalize="sentences"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </div>
        </div>
      </section>

      {/* ===== SECTION 9: EMAIL DELIVERY ===== */}
      <section className="hcl-section-dark hcl-email-section" ref={emailRef}>
        <div className="hcl-container" style={{ textAlign: 'center' }}>
          {!submitted ? (
            <>
              <p className="hcl-section-label reveal-fade-up">Take It With You</p>
              <h2 className="hcl-section-heading reveal-fade-up">
                Get Your Results
              </h2>
              <p className="hcl-section-desc reveal-fade-up">
                We'll email you your answers, the full framework, and your Future Self Letter.
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
                <button
                  className="hcl-cta-gold"
                  onClick={handleSubmit}
                  disabled={submitting || photoUploading}
                >
                  {submitting ? 'Sending...' : photoUploading ? 'Uploading photo...' : 'Send My Results'}
                </button>
              </div>

              {error && (
                <p className="hcl-error">{error}</p>
              )}

              {validationErrors.length > 0 && (
                <p className="hcl-validation-hint">
                  Scroll up to complete your selections.
                </p>
              )}
            </>
          ) : (
            <div className="hcl-success reveal-scale">
              <div className="hcl-success-check">✓</div>
              <h2 className="hcl-section-heading">Check Your Inbox</h2>
              <p className="hcl-section-desc">
                Your Healing Compass results are on their way to <strong>{email}</strong>
              </p>
              <a href="https://findmyflow.nichuzz.com" className="hcl-cta-gold" style={{ marginTop: '2rem' }}>
                Explore FindMyFlow →
              </a>
            </div>
          )}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="hcl-footer" ref={footerRef}>
        <div className="hcl-container">
          <p className="hcl-footer-brand">FindMyFlow · Built by Huzz</p>
          <p className="hcl-footer-tagline">
            "The missing layer between knowing what to do and being able to do it."
          </p>
        </div>
      </footer>

      {/* ===== STICKY MOBILE CTA ===== */}
      {allSelectionsComplete && !submitted && !inputFocused && (
        <div className={`hcl-sticky-cta${stickyVisible ? ' hcl-sticky-cta--visible' : ''}`}>
          <button
            className="hcl-cta-gold hcl-sticky-btn"
            onClick={() => emailRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            Send My Results ↑
          </button>
        </div>
      )}
    </div>
  )
}
