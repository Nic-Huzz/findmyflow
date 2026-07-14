/**
 * MovementMakers.jsx — /movement-makers
 * Landing page for Scale ($499 setup + $99/month creator portal).
 * "Get Paid To Have Fun."
 *
 * Embeds ExperienceCreatorFlow inline as the first interactive step.
 * Public route (no auth required).
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './MovementMakers.css'

// Fonts loaded via CSS import in MovementMakers.css

const ExperienceCreatorFlow = lazy(() => import('../flows/ExperienceCreatorFlow'))

const FAQS = [
  { q: "What if I'm just starting out?", a: "Scale is for facilitators who already run experiences. If you're still figuring out what you want to create, start with the free Vibe Rise app. It'll help you discover your play-skills and build courage. When you're ready to build a business from them, Scale is here." },
  { q: "What do I get in the $499 setup?", a: "The identity work that everything else builds on. We find your rule break (the thing you do differently that makes word spread), map your business model based on creators like you, and turn it all into a clear positioning statement. You do it once and it's yours forever." },
  { q: "How is this different from a course?", a: "Courses dump information. Scale gives you a system you actually use. The app tracks your checklists, your challenges, your 3% improvements. You're not learning. You're building." },
  { q: "Can I cancel anytime?", a: "Yes. The $99 subscription is monthly with no lock-in, and your first month is fully refundable if it's not for you. The $499 setup is not refundable, because it gives you full access to the identity content straight away." },
  { q: "What's the time commitment?", a: "The system works around events you're already running. You work your checklist, run your experience, log what happened. The app removes time from your workflow, it doesn't add to it." },
  { q: "What kind of experiences qualify?", a: "Workshops, breathwork, dance, retreats, circles, coaching cohorts, performances, online sessions. If you create an experience where people show up and something shifts, you're a Movement Maker." },
]

export default function MovementMakers() {
  const navigate = useNavigate()
  const [headerSolid, setHeaderSolid] = useState(false)
  const [showSticky, setShowSticky] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [joinEmail, setJoinEmail] = useState('')
  const [joinState, setJoinState] = useState('idle') // idle | saving | done
  const [joinError, setJoinError] = useState('')
  const matchingRef = useRef(null)

  useEffect(() => {
    document.title = 'Scale | Grow Your Income + Impact as an Experience Creator'
    const onScroll = () => {
      setHeaderSolid(window.scrollY > 80)
      // Only show the sticky CTA once the matching quiz has scrolled out of view,
      // so it never covers the embed's own buttons mid-quiz
      const rect = matchingRef.current?.getBoundingClientRect()
      setShowSticky(rect ? rect.bottom < 0 : false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToMatching = () => {
    matchingRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToPricing = () => {
    document.getElementById('mm-pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleJoinSubmit = async () => {
    const email = joinEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      setJoinError('Please enter a valid email address.')
      return
    }
    setJoinState('saving')
    setJoinError('')
    try {
      await supabase.from('lead_captures').insert({ email, source: 'movement-makers' })
    } catch (err) {
      console.warn('Lead capture error:', err.message)
    }
    // Enroll in the creator nurture sequence (same funnel as the matching embed)
    supabase.functions.invoke('enroll-email-sequence', {
      body: {
        email,
        sequence_type: 'creator_nurture',
        personalization_tokens: { name: email.split('@')[0] },
      },
    }).catch(() => {})
    // Ping Huzz: pricing-card leads are high intent
    supabase.functions.invoke('notify-app-build-interest', {
      body: { userEmail: email, userName: null, userId: null, source: 'movement-makers-pricing' },
    }).catch(() => {})
    setJoinState('done')
  }

  return (
    <div className="mm">

      {/* NAV */}
      <header className={`mm-nav${headerSolid ? ' mm-nav--solid' : ''}`}>
        <div className="mm-container mm-nav-inner">
          <div className="mm-logo">
            <span className="mm-logo-dot" />
            Scale
          </div>
          <button className="mm-nav-btn" onClick={() => navigate('/log-in')}>Log in</button>
        </div>
      </header>

      {/* HERO */}
      <section className="mm-hero">
        <div className="mm-hero-glow" />
        <div className="mm-container mm-hero-inner">
          <p className="mm-eyebrow">FOR EXPERIENCE CREATORS WHO ARE READY TO BUILD</p>
          <h1 className="mm-h1">
            Get Paid To<br />
            <span className="mm-h1-accent">Have Fun.</span>
          </h1>
          <p className="mm-hero-sub">
            Scale your income and impact as an experience creator.
          </p>
          <div className="mm-hero-badges">
            <span className="mm-badge">Full Creator Portal</span>
            <span className="mm-badge">Built From 200+ Events</span>
            <span className="mm-badge">Cancel Anytime</span>
          </div>
          <div className="mm-hero-screenshot mm-hero-screenshot--filled">
            <img src="/images/landing/portal-dashboard.png" alt="Scale Creator Portal dashboard" />
          </div>
        </div>
      </section>

      {/* MATCHING FLOW EMBED */}
      <section className="mm-matching-section" ref={matchingRef}>
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">STEP 1</p>
          <h2 className="mm-h2">Who's your north star?</h2>
          <p className="mm-sub">Browse 33 experience creators. Pick who resonates. See your product suite in 3 minutes.</p>
          <div className="mm-matching-embed">
            <Suspense fallback={<div className="mm-matching-loading"><div className="mm-spinner" /></div>}>
              <ExperienceCreatorFlow embedded onComplete={scrollToPricing} />
            </Suspense>
          </div>
          <p className="mm-matching-note">Free. No account needed. Takes 3 minutes.</p>
        </div>
      </section>

      {/* IS THIS YOU */}
      <section className="mm-section mm-section--purple">
        <div className="mm-container mm-isyou-inner">
          <p className="mm-label" style={{ textAlign: 'left' }}>IS THIS YOU</p>
          <p className="mm-isyou-line">You run workshops, breathwork, retreats, or coaching groups.</p>
          <p className="mm-isyou-line">You're confident in the room. People leave saying "that was incredible."</p>
          <p className="mm-isyou-line mm-isyou-bold">But the business side? Different story.</p>
          <p className="mm-isyou-line mm-isyou-muted">"I'm great at facilitation. I'm terrible at filling the room."</p>
          <div className="mm-isyou-checks">
            {[
              'You start from scratch every time. No system. No compound.',
              'You undercharge because you\'re not sure what your experience is "worth."',
              'You resist the marketing, the pricing, the sales. It feels gross.',
              "You know your work changes lives. You just can't figure out how to make a living from it.",
            ].map((line) => (
              <div key={line} className="mm-isyou-check">
                <span className="mm-isyou-check-icon">&#10003;</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
          <p className="mm-isyou-line mm-isyou-bold" style={{ marginTop: '1.5rem' }}>Not more information. Not another course. A system that handles the parts you resist.</p>
        </div>
      </section>

      {/* TRANSFORMATION */}
      <section className="mm-section">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">THE TRANSFORMATION</p>
          <h2 className="mm-h2">You just saw your model.<br />Now let's build it.</h2>
          <div className="mm-transform-grid">
            <div className="mm-transform-card mm-transform-from">
              <div className="mm-transform-label">WHERE YOU ARE</div>
              <div className="mm-transform-list">
                {[
                  'Running experiences from intuition',
                  'Filling rooms through hustle',
                  'Each event starts from scratch',
                  'No system, no data, no compound',
                ].map((line) => (
                  <div key={line} className="mm-transform-row">
                    <span className="mm-transform-mark">✕</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mm-transform-arrow">&rarr;</div>
            <div className="mm-transform-card mm-transform-to">
              <div className="mm-transform-label">WHERE YOU'RE GOING</div>
              <div className="mm-transform-list">
                {[
                  'A system behind every experience',
                  'Rooms that fill because of the last one',
                  "Data that proves you're growing",
                  'A business that feels like play',
                ].map((line) => (
                  <div key={line} className="mm-transform-row">
                    <span className="mm-transform-mark">✓</span>
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STORY */}
      <section className="mm-section mm-section--warm">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">THE STORY</p>
          <h2 className="mm-h2">I quit my job and went<br />all in on experiences.</h2>
          <div className="mm-story-card">
            <p className="mm-story-quote">
              "Running events for $30 tickets is brutal. You need 30 people just to make $1,000. I learned every lesson the hard way: empty rooms, undercharging, no follow-up, starting from scratch every single time.
              <br /><br />
              After 200+ experiences I figured out the system. Now my events do 100+ people. Scale is everything I learned, built into an app so you don't have to learn it the hard way."
            </p>
            <div className="mm-story-author">
              <div className="mm-story-avatar">
                <img src="/images/huzz-profile.jpg" alt="Huzz" />
              </div>
              <div>
                <div className="mm-story-name">Huzz</div>
                <div className="mm-story-role">Founder, Vibe Rise</div>
                <div className="mm-story-role">200+ experiences facilitated in Bali</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="mm-section mm-section--dark">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">THE PROOF</p>
          <h2 className="mm-h2" style={{ color: 'white' }}>Built from real experience, not theory.</h2>
          <p className="mm-sub">Every tool in the portal was built from running experiences weekly for 3+ years.</p>
          <div className="mm-proof-grid">
            <div>
              <div className="mm-proof-stat">200+</div>
              <div className="mm-proof-label">Experiences facilitated</div>
              <div className="mm-proof-detail">Every week, rain or shine</div>
            </div>
            <div>
              <div className="mm-proof-stat">3+</div>
              <div className="mm-proof-label">Years across Bali</div>
              <div className="mm-proof-detail">Istana, Space, Mantra, B-Work, Alchemy</div>
            </div>
            <div>
              <div className="mm-proof-stat">100+</div>
              <div className="mm-proof-label">Person festivals hosted</div>
              <div className="mm-proof-detail">Healing But Fun at The Istana</div>
            </div>
            <div>
              <div className="mm-proof-stat">4</div>
              <div className="mm-proof-label">Signature formats</div>
              <div className="mm-proof-detail">Healing Compass, Shaking Breathwork, Vibe Rise, Retreats</div>
            </div>
          </div>
        </div>
      </section>

      {/* THE 3 SECRETS */}
      <section className="mm-section">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">WHAT WE LEARNED</p>
          <h2 className="mm-h2">The 3 questions every experience creator needs answered.</h2>
          <p className="mm-sub">We studied 100 creators who built movements from nothing. Here's what separated the ones who made it.</p>

          <div className="mm-secrets-grid">
            {/* Secret 1: Pay Rent */}
            <div className="mm-secret-card">
              <div className="mm-secret-num">01</div>
              <h3 className="mm-secret-title">How did they pay rent?</h3>
              <p className="mm-secret-subtitle">Most creators solve this wrong.</p>
              <p className="mm-secret-body">The creators who made it to full time didn't wait for their dream model to work. They found bridge income that matched who they are: rentals, freelance facilitation, corporate workshops, retreats alongside a day job. The ones who failed waited for permission.</p>
              <div className="mm-secret-insight">
                <span className="mm-secret-insight-label">Inside the setup:</span>
                See exactly how creators like you funded the gap between "first workshop" and "this is my career."
              </div>
            </div>

            {/* Secret 2: Blow Up */}
            <div className="mm-secret-card">
              <div className="mm-secret-num">02</div>
              <h3 className="mm-secret-title">What made them blow up?</h3>
              <p className="mm-secret-subtitle">The recipe has 5 ingredients.</p>
              <p className="mm-secret-body">Every creator who blew up triggered at least one of these 5 remarkability triggers. The most remarkable triggered 2 or more. None of them went viral by accident.</p>
              <div className="mm-secret-tags">
                <span className="mm-secret-tag">Rule Broken</span>
                <span className="mm-secret-tag">Unexpected Combination</span>
                <span className="mm-secret-tag">Extreme Action</span>
                <span className="mm-secret-tag">Stupid Simplicity</span>
                <span className="mm-secret-tag">Impossible Result</span>
              </div>
              <div className="mm-secret-insight">
                <span className="mm-secret-insight-label">Inside the setup:</span>
                The Blow Up Brand Pipeline finds your rule break and scores your recipe against creators who match your DNA.
              </div>
            </div>

            {/* Secret 3: Business Models */}
            <div className="mm-secret-card">
              <div className="mm-secret-num">03</div>
              <h3 className="mm-secret-title">Which business models actually work?</h3>
              <p className="mm-secret-subtitle">3 layers. In the right order.</p>
              <p className="mm-secret-body">The most successful creators don't sell one thing. They stack 3 layers: an attraction offer that gets people in the door, a core offer where the real change happens, and a continuity offer people keep paying for month after month. Most creators skip the attraction layer and wonder why nobody shows up.</p>
              <div className="mm-secret-layers">
                <div className="mm-secret-layer">
                  <span className="mm-secret-layer-name">Attraction</span>
                  <span className="mm-secret-layer-desc">Get them in the door</span>
                </div>
                <div className="mm-secret-layer-arrow">&darr;</div>
                <div className="mm-secret-layer">
                  <span className="mm-secret-layer-name">Core</span>
                  <span className="mm-secret-layer-desc">The real change</span>
                </div>
                <div className="mm-secret-layer-arrow">&darr;</div>
                <div className="mm-secret-layer">
                  <span className="mm-secret-layer-name">Continuity</span>
                  <span className="mm-secret-layer-desc">Money that repeats</span>
                </div>
              </div>
              <div className="mm-secret-insight">
                <span className="mm-secret-insight-label">Inside the setup:</span>
                The Business Model Finder designs your 3-layer stack based on what's working for creators like you.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED (Setup + Portal) */}
      <section className="mm-section mm-section--warm">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">WHAT'S INCLUDED</p>
          <h2 className="mm-h2">The biggest creators took 12 years to figure this out.</h2>
          <p className="mm-sub">We studied how the biggest experience creators blew up. On average it took 12 years. Most quit long before that. This gives you what they figured out the slow way.</p>

          {/* Block A: The Setup ($499) */}
          <div className="mm-block-label">
            <span className="mm-block-name">THE SETUP</span>
            <span className="mm-block-price">$499 one time</span>
          </div>
          <p className="mm-block-sub">The identity work everything else builds on. Done once, yours forever.</p>
          <div className="mm-phase-grid mm-phase-grid--single">
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">💎</span>
                <span className="mm-phase-name">Position</span>
              </div>
              <div className="mm-phase-desc">We studied 100 creators who blew up, including Brené Brown, Wim Hof and Tony Robbins. How they paid rent, the rule they broke, how their story spread. The setup runs the same analysis on you.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>The Business Model Finder</strong><span>Pick the creators who built the life you want. See the model behind them, then how to stack it: a cheap way in, a core offer, and a way people keep paying you. That stack is how one event becomes income all year.</span></div>
                <div className="mm-phase-feature"><strong>The Blow Up Brand Pipeline</strong><span>Find your rule break, how your story spreads, and what's blocking people from saying yes</span></div>
                <div className="mm-phase-feature"><strong>Your Scale Score</strong><span>A report card showing how ready your experience is to blow up, and exactly what to fix</span></div>
              </div>
              <div className="mm-phase-screenshot mm-phase-screenshot--filled"><img src="/images/landing/playbook-stepper.png" alt="Blow Up Brand playbook stepper" /></div>
            </div>
          </div>

          {/* Block B: The Portal ($99/month) */}
          <div className="mm-block-label">
            <span className="mm-block-name">THE PORTAL</span>
            <span className="mm-block-price">$99/month</span>
          </div>
          <p className="mm-block-sub">The engine you run every event through.</p>
          <div className="mm-phase-grid">
            {/* Fill */}
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">⚡</span>
                <span className="mm-phase-name">Fill</span>
              </div>
              <div className="mm-phase-desc">Fill the room. The parts you resist, handled.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>The Experience Pipeline</strong><span>Attract, capture, convert, deliver, grow. Every event, same system.</span></div>
                <div className="mm-phase-feature"><strong>The Execution Engine</strong><span>Tasks become challenges with deadlines</span></div>
                <div className="mm-phase-feature"><strong>Fill Checklists</strong><span>Every marketing task laid out with nothing forgotten</span></div>
                <div className="mm-phase-feature"><strong>The Price-It-Right Calculator</strong><span>Know exactly what to charge based on your value stack</span></div>
              </div>
              <div className="mm-phase-screenshot mm-phase-screenshot--filled">
                <img src="/images/landing/experience-pipeline.png" alt="Experience pipeline" />
              </div>
            </div>

            {/* Run */}
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">🎪</span>
                <span className="mm-phase-name">Run</span>
              </div>
              <div className="mm-phase-desc">Walk in ready. Focus on the magic.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>Run Sheets</strong><span>Your minute-by-minute agenda, built from the checklist</span></div>
                <div className="mm-phase-feature"><strong>Reusable Templates</strong><span>Save what works, use it every time</span></div>
                <div className="mm-phase-feature"><strong>Run It Again</strong><span>One tap turns a past event into the next one</span></div>
              </div>
            </div>

            {/* Grow */}
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">🔄</span>
                <span className="mm-phase-name">Grow</span>
              </div>
              <div className="mm-phase-desc">Close the loop. Compound forward.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>Repeat-Attendee Tracking</strong><span>See who keeps coming back, and who to invite next</span></div>
                <div className="mm-phase-feature"><strong>Profit Per Event</strong><span>Know exactly what you made after every experience</span></div>
                <div className="mm-phase-feature"><strong>The 3% Note</strong><span>One small improvement per event that compounds into mastery</span></div>
                <div className="mm-phase-feature"><strong>A Contact List That Builds Itself</strong><span>Every attendee saved without spreadsheets</span></div>
              </div>
              <div className="mm-phase-screenshot mm-phase-screenshot--filled">
                <img src="/images/landing/grow-metrics.png" alt="Growth metrics dashboard" />
                <img src="/images/landing/grow-pulse.png" alt="Brand Pulse score" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mm-section" id="mm-pricing">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">PRICING</p>
          <h2 className="mm-h2">One setup. One subscription. Everything included.</h2>
          <div className="mm-price-card">
            <div className="mm-price-eyebrow">FOUNDING PRICE</div>
            <div className="mm-price-name">Scale</div>
            <div className="mm-price-tagline">The setup builds your positioning. The portal fills your events.</div>
            <div className="mm-price-amount">$499<span> setup</span></div>
            <div className="mm-price-then">then $99<span>/month</span></div>
            <div className="mm-price-roi">Pays for itself with one event.</div>
            {joinState === 'done' ? (
              <div className="mm-price-submitted">You're in. We'll be in touch to book your setup.</div>
            ) : (
              <div className="mm-price-join">
                <input
                  type="email"
                  className="mm-price-email"
                  placeholder="you@email.com"
                  value={joinEmail}
                  onChange={(e) => setJoinEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinSubmit()}
                />
                <button className="mm-price-cta" onClick={handleJoinSubmit} disabled={joinState === 'saving'}>
                  {joinState === 'saving' ? 'Saving...' : 'Get Started →'}
                </button>
                {joinError && <div className="mm-price-error">{joinError}</div>}
              </div>
            )}
            <div className="mm-price-spots"><strong>8 spots left</strong> at founding price.</div>
          </div>

          {/* Coming Soon: Business Accelerator */}
          <div className="mm-price-card mm-price-card--soon">
            <div className="mm-soon-badge">Coming Soon</div>
            <div className="mm-price-name">Business Accelerator</div>
            <div className="mm-price-tagline">7 guided stages from idea to launch. AI-powered business building for experience creators who want step-by-step.</div>
            <div className="mm-price-amount">$197<span> one time</span></div>
            <div className="mm-soon-features">
              <span>Validation</span>
              <span>Offer Design</span>
              <span>Audience</span>
              <span>Pricing</span>
              <span>Funnels</span>
              <span>Launch</span>
              <span>Tracking</span>
            </div>
            <div className="mm-soon-note">Join Scale now and get early access when it launches.</div>
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section className="mm-section mm-section--warm">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">GUARANTEES</p>
          <h2 className="mm-h2">Three layers of confidence.</h2>
          <div className="mm-guarantee-stack">
            <div className="mm-guarantee-card mm-guarantee-anti">
              <div className="mm-guarantee-type">THE FILTER</div>
              <div className="mm-guarantee-text">This is for facilitators who are ready to build. If you're still figuring out whether you want to run experiences, start with the free app.</div>
            </div>
            <div className="mm-guarantee-card mm-guarantee-unconditional">
              <div className="mm-guarantee-type">THE SAFETY NET</div>
              <div className="mm-guarantee-text">Try the portal for a month. If it's not for you, your first $99 comes back. No questions asked.</div>
            </div>
            <div className="mm-guarantee-card mm-guarantee-conditional">
              <div className="mm-guarantee-type">THE COMMITMENT</div>
              <div className="mm-guarantee-text">Complete 3 checklists, run 1 experience through the pipeline. If your attendance doesn't grow, next month is free.</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="mm-section">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">WHO THIS IS FOR</p>
          <h2 className="mm-h2">Movement Makers are experience creators who...</h2>
          <div className="mm-who-list">
            {[
              'Already run workshops, breathwork, retreats, circles, or dance events',
              'Are confident in facilitation but resist the business side',
              'Want each experience to build on the last, not start from scratch',
              'Are ready to build a real thing, not consume another course',
              "Know they're born to create positive impact",
            ].map((item, i) => (
              <div key={i} className="mm-who-item">
                <span className="mm-who-check">&#10003;</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mm-section mm-section--warm">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">QUESTIONS</p>
          <h2 className="mm-h2">Frequently asked.</h2>
          <div className="mm-faq-list">
            {FAQS.map((faq, i) => (
              <div key={i} className={`mm-faq-item ${expandedFaq === i ? 'open' : ''}`} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                <div className="mm-faq-q">{faq.q} <span>+</span></div>
                <div className="mm-faq-a">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mm-final-cta">
        <div className="mm-container">
          <h2 className="mm-h2">Ready to get paid<br />to have fun?</h2>
          <p style={{ color: '#6b6b6b', fontSize: '1.05rem', maxWidth: '500px', margin: '1rem auto 2rem' }}>
            Full system. Setup included. Cancel anytime.
          </p>
          <button className="mm-cta" onClick={scrollToPricing}>
            Get Started &rarr;
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mm-footer">
        <div className="mm-container">
          <div className="mm-logo" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span className="mm-logo-dot" /> Scale
          </div>
          <p style={{ fontSize: '0.78rem', color: '#999' }}>by Vibe Rise. Built in Bali.</p>
        </div>
      </footer>

      {/* STICKY MOBILE CTA */}
      {showSticky && (
        <div className="mm-sticky">
          <button className="mm-cta" onClick={scrollToPricing}>Get Started &rarr;</button>
        </div>
      )}
    </div>
  )
}
