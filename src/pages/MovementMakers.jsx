/**
 * MovementMakers.jsx — /movement-makers
 * Landing page for Movement Makers cohort product.
 * "Get Paid To Have Fun."
 *
 * Embeds ExperienceCreatorFlow inline as the first interactive step.
 * Public route (no auth required).
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import './MovementMakers.css'

// Fonts loaded via CSS import in MovementMakers.css

const ExperienceCreatorFlow = lazy(() => import('../flows/ExperienceCreatorFlow'))

const FAQS = [
  { q: "What if I'm just starting out?", a: "Movement Makers is for facilitators who already run experiences. If you're still figuring out what you want to create, start with the free Vibe Rise app. It'll help you discover your play-skills and build courage. When you're ready to build a business from them, Movement Makers is here." },
  { q: "How is this different from a course?", a: "Courses dump information. Movement Makers gives you a system and a group that holds you accountable to USE it. The app tracks your checklists, your challenges, your 3% improvements. The weekly check-ins make sure you actually do the work. You're not learning. You're building." },
  { q: "What happens on the check-ins?", a: "Weekly: accountability check (the app shows green/red on your commitments), debrief from anyone who ran an experience, and intention setting for the next week. No fluff." },
  { q: "Can I cancel anytime?", a: "Yes. Monthly. No lock-in. First month is fully refundable if it's not for you." },
  { q: "What's the time commitment?", a: "One weekly check-in. The rest is working your checklist and running your experiences, which you're already doing. The app removes time from your workflow, it doesn't add to it." },
  { q: "What kind of experiences qualify?", a: "Workshops, breathwork, dance, retreats, circles, coaching cohorts, performances, online sessions. If you create an experience where people show up and something shifts, you're a Movement Maker." },
]

export default function MovementMakers() {
  const navigate = useNavigate()
  const [headerSolid, setHeaderSolid] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [joinSubmitted, setJoinSubmitted] = useState(false)
  const matchingRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToMatching = () => {
    matchingRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToPricing = () => {
    document.getElementById('mm-pricing')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleJoinCohort = () => {
    setJoinSubmitted(true)
  }

  return (
    <div className="mm">

      {/* NAV */}
      <header className={`mm-nav${headerSolid ? ' mm-nav--solid' : ''}`}>
        <div className="mm-container mm-nav-inner">
          <div className="mm-logo">
            <span className="mm-logo-dot" />
            Movement Makers
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
            A monthly cohort of experience creators building businesses from the work that lights them up.
          </p>
          <div className="mm-hero-badges">
            <span className="mm-badge">10 Per Cohort</span>
            <span className="mm-badge">Weekly Check-ins</span>
            <span className="mm-badge">Full Creator Portal</span>
          </div>
        </div>
      </section>

      {/* MATCHING FLOW EMBED */}
      <section className="mm-matching-section" ref={matchingRef}>
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">STEP 1</p>
          <h2 className="mm-h2">Who's your north star?</h2>
          <p className="mm-sub">Browse 59 experience creators. Pick who resonates. See your product suite in 3 minutes.</p>
          <div className="mm-matching-embed">
            <Suspense fallback={<div className="mm-matching-loading"><div className="mm-spinner" /></div>}>
              <ExperienceCreatorFlow embedded onComplete={scrollToPricing} />
            </Suspense>
          </div>
          <p className="mm-matching-note">Free. No account needed. Takes 3 minutes.</p>
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
              <div className="mm-transform-text">
                Running experiences from intuition.<br />
                Filling rooms through hustle.<br />
                Each event starts from scratch.<br />
                No system. No data. No compound.
              </div>
            </div>
            <div className="mm-transform-arrow">&rarr;</div>
            <div className="mm-transform-card mm-transform-to">
              <div className="mm-transform-label">WHERE YOU'RE GOING</div>
              <div className="mm-transform-text">
                A system behind every experience.<br />
                Rooms that fill because of the last one.<br />
                Data that proves you're growing.<br />
                A business that feels like play.
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
              After 200+ experiences I figured out the system. Now my events do 100+ people and over $2K profit each. Movement Makers is everything I learned, built into an app so you don't have to learn it the hard way."
            </p>
            <div className="mm-story-author">
              <div className="mm-story-avatar">
                <img src="/images/huzz-profile.jpg" alt="Huzz" />
              </div>
              <div>
                <div className="mm-story-name">Huzz</div>
                <div className="mm-story-role">Founder, Healing But Fun</div>
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
              <div className="mm-proof-label">Experiences delivered</div>
              <div className="mm-proof-detail">Healing Compass, Shaking Breathwork, Vibe Rise, Retreats</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED (4 phases) */}
      <section className="mm-section mm-section--warm">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">WHAT'S INCLUDED</p>
          <h2 className="mm-h2">$1,276 of value. $100/month.</h2>
          <p className="mm-sub">The system handles every phase of running an experience. You just show up and create.</p>

          <div className="mm-phase-grid">
            {/* Setup */}
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">🧭</span>
                <span className="mm-phase-name">Setup</span>
              </div>
              <div className="mm-phase-desc">Map your business before you plan a single event.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>The Business Model Finder</strong><span>See exactly what to build based on creators like you</span></div>
                <div className="mm-phase-feature"><strong>The Journey Compass</strong><span>Know exactly where you are and what to focus on next</span></div>
                <div className="mm-phase-feature"><strong>How To Scale Your Income</strong><span>Find the gaps in how you attract, sell, scale, and retain</span></div>
                <div className="mm-phase-feature"><strong>Your Play Profile</strong><span>Create your system for success</span></div>
              </div>
              <div className="mm-phase-screenshot">[Screenshot: My Business tab]</div>
            </div>

            {/* Pre-Event */}
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">⚡</span>
                <span className="mm-phase-name">Pre-Event</span>
              </div>
              <div className="mm-phase-desc">Fill the room. The parts you resist, handled.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>The Room-Filling System</strong><span>Every marketing task laid out with nothing forgotten</span></div>
                <div className="mm-phase-feature"><strong>The Execution Engine</strong><span>Tasks become challenges with deadlines your group sees</span></div>
                <div className="mm-phase-feature"><strong>The Price-It-Right Calculator</strong><span>Know exactly what to charge based on your value stack</span></div>
              </div>
              <div className="mm-phase-screenshot">[Screenshot: Checklist with lightning bolts]</div>
            </div>

            {/* Deliver */}
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">🎪</span>
                <span className="mm-phase-name">Deliver</span>
              </div>
              <div className="mm-phase-desc">Walk in ready. Focus on the magic.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>Run-sheet ready</strong><span>Your minute-by-minute agenda, built from the checklist</span></div>
                <div className="mm-phase-feature"><strong>Energy arc planned</strong><span>Peaks, rests, and transitions mapped before you arrive</span></div>
                <div className="mm-phase-feature"><strong>Materials prepped</strong><span>Nothing forgotten, everything ticked off</span></div>
                <div className="mm-phase-feature"><strong>You just facilitate</strong><span>The business is handled. You do what you do best.</span></div>
              </div>
            </div>

            {/* Post-Event */}
            <div className="mm-phase-card">
              <div className="mm-phase-header">
                <span className="mm-phase-icon">🔄</span>
                <span className="mm-phase-name">Post-Event</span>
              </div>
              <div className="mm-phase-desc">Close the loop. Compound forward.</div>
              <div className="mm-phase-features">
                <div className="mm-phase-feature"><strong>The Customer Bible</strong><span>Take a photo of your sign-up sheet, AI does the rest</span></div>
                <div className="mm-phase-feature"><strong>The Compound Tracker</strong><span>See your repeat attendees, growth, and momentum over time</span></div>
                <div className="mm-phase-feature"><strong>The Success System</strong><span>One small improvement per event that compounds into mastery</span></div>
                <div className="mm-phase-feature"><strong>The Profit Calculator</strong><span>Know exactly what you made after every experience</span></div>
              </div>
              <div className="mm-phase-screenshot">[Screenshot: Post-event tab]</div>
            </div>
          </div>

          <div className="mm-group-bar">
            <div className="mm-group-bar-icon">👥</div>
            <div>
              <div className="mm-group-bar-title">Plus: Weekly check-ins with your cohort</div>
              <div className="mm-group-bar-desc">Accountability, intention setting, debrief. The group makes sure you actually do the work.</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="mm-section" id="mm-pricing">
        <div className="mm-container" style={{ textAlign: 'center' }}>
          <p className="mm-label">PRICING</p>
          <h2 className="mm-h2">Simple. One price. Everything included.</h2>
          <div className="mm-price-card">
            <div className="mm-price-eyebrow">FOUNDING MEMBERSHIP</div>
            <div className="mm-price-name">Movement Makers</div>
            <div className="mm-price-tagline">10 experience creators per monthly cohort</div>
            <div className="mm-price-amount">$100<span>/month</span></div>
            <div className="mm-price-was">Total value: <s>$1,276/month</s></div>
            <div className="mm-price-roi">Fill 3 extra seats at your next experience and it's paid for itself.</div>
            {joinSubmitted ? (
              <div className="mm-price-submitted">You're on the list. We'll be in touch.</div>
            ) : (
              <button className="mm-price-cta" onClick={handleJoinCohort}>
                Join The Next Cohort →
              </button>
            )}
            <div className="mm-price-spots"><strong>10 spots</strong> per cohort. Founding membership pricing.</div>
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
              <div className="mm-guarantee-text">Try the first month. If it's not for you, full refund. No questions asked.</div>
            </div>
            <div className="mm-guarantee-card mm-guarantee-conditional">
              <div className="mm-guarantee-type">THE COMMITMENT</div>
              <div className="mm-guarantee-text">Complete 3 checklists, run 1 experience through the system. If your attendance doesn't grow, next month is free.</div>
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
            10 spots. Monthly cohort. Full system. Triple guarantee.
          </p>
          <button className="mm-cta" onClick={scrollToPricing}>
            Join Movement Makers &rarr;
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mm-footer">
        <div className="mm-container">
          <div className="mm-logo" style={{ justifyContent: 'center', marginBottom: '0.5rem' }}>
            <span className="mm-logo-dot" /> Movement Makers
          </div>
          <p style={{ fontSize: '0.78rem', color: '#999' }}>by Healing But Fun. Built in Bali.</p>
        </div>
      </footer>
    </div>
  )
}
