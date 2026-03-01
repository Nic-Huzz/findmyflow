import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRevealAll } from '../hooks/useReveal'
import WaitlistModal from '../components/WaitlistModal'
import './LandingPage.css'

const CULTURES = [
  { term: 'Svadharma', tradition: 'Sanskrit', translation: '"One\'s own duty"', desc: 'Better to imperfectly follow your own path than to perfectly follow someone else\'s.' },
  { term: 'Te', tradition: 'Taoist', translation: '"Inherent power"', desc: 'Your individual expression of the Tao. You don\'t create it through effort — you uncover it by removing obstructions.' },
  { term: 'Ikigai', tradition: 'Japanese', translation: '"Reason for being"', desc: 'Emerges at the intersection of what you love and what others need.' },
]

const STEPS = [
  { title: 'Create your Essence Profile', desc: 'Discover your unique character — your skills, the problems you solve, and who you\'re meant to serve.' },
  { title: 'Take the Stage Finder', desc: 'Answer a few questions about where you are on your journey. Get placed at the right level.' },
  { title: 'Unlock your quests', desc: 'Get stage-specific quests that give you clarity on action and accountability to take it.' },
]

const CATEGORIES = [
  { emoji: '\u{1F3AE}', name: 'Play-List', desc: 'Do things you love.', color: '#E9A23B' },
  { emoji: '\u{1F9D8}', name: 'Healing', desc: 'Recognise. Release. Rewire.', color: '#10b981' },
  { emoji: '\u{1F381}', name: 'Bonus', desc: 'Surprises along the way.', color: '#3B82F6' },
]

const FRAMEWORK_QS = [
  { icon: '\u{1F527}', label: 'Skills', q: 'What skills are you passionate about using?' },
  { icon: '\u{1F525}', label: 'Problems', q: 'What problems are you passionate about solving?' },
  { icon: '\u{1F465}', label: 'People', q: 'What people are you passionate about serving?' },
  { icon: '\u{1F3AF}', label: 'Mission', q: 'What mission are you passionate about standing for?' },
]

const FAQS = [
  {
    q: "What if I don't know what I want to build?",
    a: "That's exactly what we help with. The Flow Finder guides you through discovering your unique skills, the problems you naturally solve, and the people you're meant to serve."
  },
  {
    q: "How is this different from courses or coaching?",
    a: "Courses dump information and hope you figure it out. Coaches tell you what to do. We guide you through discovering your own answers — because you're the expert on you."
  },
  {
    q: "How long does it take?",
    a: "The Earthquake Quiz takes 3 minutes. The full Flow Finder journey can be done in a few focused sessions. But this isn't about speed — it's about getting clear."
  },
  {
    q: "Is this just for people who want to start a business?",
    a: "No. Some people discover they need to build their own thing. Others realise they need a different job. The Earthquake Quiz helps you discover what's actually blocking you."
  },
  {
    q: "What if I've tried other programs and they didn't work?",
    a: "Most programs focus on what action to take, without addressing what's stopping you from taking action. We combine business strategy with healing work — so you actually do the things you know you should do."
  },
  {
    q: "What's included in the free version?",
    a: "The Earthquake Quiz is completely free. You'll discover your loudest Protective Voice, your awakening stage, and your primary block — with a personalised report. No credit card required."
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const revealRef = useRevealAll()
  const heroRef = useRef(null)
  const [headerSolid, setHeaderSolid] = useState(false)
  const [stickyVisible, setStickyVisible] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [showWaitlist, setShowWaitlist] = useState(false)

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => setStickyVisible(!e.isIntersecting),
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const scrollToSignup = () => {
    document.getElementById('fmf-paths')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="fmf" ref={revealRef}>

      {/* NAV */}
      <header className={`fmf-nav${headerSolid ? ' fmf-nav--solid' : ''}`}>
        <div className="fmf-container fmf-nav-inner">
          <div className="fmf-logo" onClick={() => navigate('/')}>
            <span className="fmf-logo-dot" aria-hidden="true" />
            FindMyFlow
          </div>
          <button className="fmf-nav-btn" onClick={() => navigate('/log-in')}>Log in</button>
        </div>
      </header>

      {/* HERO */}
      <section className="fmf-hero" ref={heroRef}>
        <div className="fmf-hero-glow" aria-hidden="true" />
        <div className="fmf-container fmf-hero-inner">
          <p className="fmf-eyebrow">DISCOVER YOUR PATH &middot; MONETISE YOUR MISSION</p>
          <h1 className="fmf-h1">
            Find Your<br />
            <span className="fmf-h1-accent">Flow.</span>
          </h1>
          <p className="fmf-hero-sub">
            A unique path only you can walk.<br />
            Ancient wisdom knew this. Modern systems forgot it.<br />
            We help you rediscover yours.
          </p>
          <div className="fmf-hero-badges">
            <span className="fmf-badge">AI-Guided Discovery</span>
            <span className="fmf-badge">Gamified Progress</span>
            <span className="fmf-badge">Free to Start</span>
          </div>
          <button className="fmf-cta" onClick={() => navigate('/try/earthquake')}>
            Discover What's Blocking You &rarr;
          </button>

        </div>
      </section>

      {/* ANCIENT WISDOM — 3-col content grid */}
      <section className="fmf-section fmf-section--warm">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">ANCIENT WISDOM</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Different cultures. Same discovery.</h2>
          <p className="fmf-sub reveal-blur-up" style={{ transitionDelay: '150ms' }}>
            Across millennia, wisdom traditions converged on a single insight.
          </p>
          <div className="fmf-cultures-grid">
            {CULTURES.map((c, i) => (
              <div key={c.term} className="fmf-culture reveal-fade-up" style={{ transitionDelay: `${i * 100}ms` }}>
                <span className="fmf-culture-tradition">{c.tradition}</span>
                <h3 className="fmf-culture-term">{c.term}</h3>
                <p className="fmf-culture-translation">{c.translation}</p>
                <p className="fmf-culture-desc">{c.desc}</p>
              </div>
            ))}
          </div>
          <p className="fmf-cultures-question reveal-blur-up">So how do you find yours?</p>
        </div>
      </section>

      {/* FLOW FINDER FRAMEWORK */}
      <section className="fmf-section">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">THE FRAMEWORK</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Four questions. One unique path.</h2>
          <div className="fmf-framework-insight reveal-scale" style={{ transitionDelay: '150ms' }}>
            <p className="fmf-framework-insight-text">
              A business is simply:<br />
              solving a <strong>problem</strong>, for a <strong>person</strong>, using a set of <strong>skills</strong>.
            </p>
          </div>
          <div className="fmf-framework-grid">
            {FRAMEWORK_QS.map((item, i) => (
              <div
                key={item.label}
                className={`fmf-framework-card ${i % 2 === 0 ? 'reveal-slide-left' : 'reveal-slide-right'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="fmf-framework-icon">{item.icon}</span>
                <span className="fmf-framework-label">{item.label}</span>
                <p className="fmf-framework-q">{item.q}</p>
              </div>
            ))}
          </div>
          <div className="fmf-framework-formula reveal-blur-up">
            <span className="fmf-formula-term">Skills</span>
            <span className="fmf-formula-op">&times;</span>
            <span className="fmf-formula-term">Problems</span>
            <span className="fmf-formula-op">&times;</span>
            <span className="fmf-formula-term">People</span>
            <span className="fmf-formula-op">&times;</span>
            <span className="fmf-formula-term">Mission</span>
            <span className="fmf-formula-eq">=</span>
            <span className="fmf-formula-result">Your Svadharma &middot; Your Te &middot; Your Ikigai</span>
          </div>
        </div>
      </section>

      {/* FLOW EQUATION — visual diagram */}
      <section className="fmf-section fmf-section--warm">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">THE FLOW</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Where your gifts meet the world's needs.</h2>
          <div className="fmf-flow-diagram reveal-scale" style={{ transitionDelay: '200ms' }}>
            <div className="fmf-flow-inputs">
              <div className="fmf-flow-node fmf-flow-node--input">
                <span className="fmf-flow-node-icon">{'\u{1F527}'}</span>
                <span className="fmf-flow-node-label">Your Skills</span>
              </div>
              <div className="fmf-flow-node fmf-flow-node--input">
                <span className="fmf-flow-node-icon">{'\u{1F525}'}</span>
                <span className="fmf-flow-node-label">Their Problems</span>
              </div>
              <div className="fmf-flow-node fmf-flow-node--input">
                <span className="fmf-flow-node-icon">{'\u{1F465}'}</span>
                <span className="fmf-flow-node-label">Your People</span>
              </div>
            </div>
            <div className="fmf-flow-arrow" aria-hidden="true">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                <path d="M0 12h32m0 0l-8-8m8 8l-8 8" stroke="url(#fmf-arrow-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="fmf-arrow-grad" x1="0" y1="12" x2="32" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5e17eb" />
                    <stop offset="1" stopColor="#E9A23B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="fmf-flow-node fmf-flow-node--gift">
              <span className="fmf-flow-node-icon">{'\u{2728}'}</span>
              <span className="fmf-flow-node-label">Your Unique Gift</span>
            </div>
            <div className="fmf-flow-arrow" aria-hidden="true">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                <path d="M0 12h32m0 0l-8-8m8 8l-8 8" stroke="url(#fmf-arrow-grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="fmf-arrow-grad2" x1="0" y1="12" x2="32" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#5e17eb" />
                    <stop offset="1" stopColor="#E9A23B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="fmf-flow-node fmf-flow-node--service">
              <span className="fmf-flow-node-icon">{'\u{1F680}'}</span>
              <span className="fmf-flow-node-label">Your Unique Business aka Your Flow</span>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHETYPES DUO */}
      <section className="fmf-section">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">DISCOVER YOUR VOICES</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Two forces shape everything you do.</h2>
          <p className="fmf-sub reveal-blur-up" style={{ transitionDelay: '150ms' }}>
            Understanding them is the key to getting unstuck.
          </p>
          <div className="fmf-arche-grid">
            <div className="fmf-arche fmf-arche--essence reveal-slide-left">
              <div className="fmf-arche-badge fmf-arche-badge--essence">ESSENCE VOICE</div>
              <h3 className="fmf-arche-title">The original song you were born to share.</h3>
              <p className="fmf-arche-desc">
                Your essence voice is your authentic creative expression — the unique combination of skills, passions, and perspectives that only you bring. When you follow it, work feels like play.
              </p>
            </div>
            <div className="fmf-arche fmf-arche--protective reveal-slide-right" style={{ transitionDelay: '120ms' }}>
              <div className="fmf-arche-badge fmf-arche-badge--protective">PROTECTIVE PATTERN</div>
              <h3 className="fmf-arche-title">The armor that's now blocking your gifts.</h3>
              <p className="fmf-arche-desc">
                Your protective pattern kept you safe growing up — but now it's the voice that says "don't put yourself out there." It's the gap between who you are and what you show the world.
              </p>
            </div>
          </div>
          <div className="fmf-arche-cta reveal-blur-up">
            <button className="fmf-cta" onClick={() => navigate('/try/earthquake')}>
              Discover Your Voices &rarr;
            </button>
            <p className="fmf-arche-cta-note">Free 3-minute Earthquake Quiz</p>
          </div>
        </div>
      </section>

      {/* IS THIS YOU — narrative section */}
      <section className="fmf-origin">
        <div className="fmf-container fmf-origin-inner">
          <div className="fmf-origin-text">
            <p className="fmf-label fmf-label--left reveal-slide-left">IS THIS YOU</p>
            <p className="fmf-origin-line reveal-slide-left" style={{ transitionDelay: '60ms' }}>You followed the traditional path. School, university, the job.</p>
            <p className="fmf-origin-line reveal-slide-left" style={{ transitionDelay: '120ms' }}>You did everything "right".</p>
            <p className="fmf-origin-line fmf-origin-bold reveal-slide-left" style={{ transitionDelay: '180ms' }}>But you didn't find happiness, joy, or fulfilment like you thought you would.</p>
            <p className="fmf-origin-line fmf-origin-muted reveal-slide-left" style={{ transitionDelay: '240ms' }}>"Am I crazy to think there's more to life than this?"</p>
          </div>
          <div className="fmf-origin-turn">
            <p className="fmf-origin-line reveal-slide-right" style={{ transitionDelay: '0ms' }}>You sense life is supposed to be an adventure, not a ladder. About creating impact, not living for the weekend.</p>
            <p className="fmf-origin-line reveal-slide-right" style={{ transitionDelay: '60ms' }}><strong>Does this sound like you?</strong></p>
            <div className="fmf-origin-results reveal-blur-up" style={{ transitionDelay: '120ms' }}>
              <p><strong>Head full of ambitions</strong> — but no clear path.</p>
              <p><strong>Talents going to waste</strong> — best gifts gathering dust.</p>
              <p><strong>Can't monetise gifts</strong> — no clear path from talent to income.</p>
            </div>
          </div>
          <blockquote className="fmf-origin-quote reveal-slide-right">
            <div className="fmf-quote-mark" aria-hidden="true">&ldquo;</div>
            <p>You're not broken. You're not lazy. You're just caught between the fear of uncertainty and the exhaustion of not making progress.</p>
          </blockquote>
          <p className="fmf-origin-close reveal-blur-up">
            What if we could make pursuing these ambitions <strong>fun</strong>?
          </p>
        </div>
      </section>

      {/* WHY YOU FEEL THIS WAY — 3-col horizontal */}
      <section className="fmf-section fmf-section--warm">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">WHY YOU FEEL THIS WAY</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>It's not you. It's the system.</h2>

          <div className="fmf-why-grid">
            <div className="fmf-why-card reveal-blur-up" style={{ transitionDelay: '150ms' }}>
              <span className="fmf-why-num">1</span>
              <h3 className="fmf-why-title">Our Curiosities Are Our Compass</h3>
              <p className="fmf-why-subtitle">School failed to nurture them.</p>
              <p className="fmf-why-body">Instead of following what lights us up, we were given a standardised curriculum. Sit down. Shut up. Memorise this. They trained the curiosity out of us.</p>
            </div>

            <div className="fmf-why-card reveal-blur-up" style={{ transitionDelay: '250ms' }}>
              <span className="fmf-why-num">2</span>
              <h3 className="fmf-why-title">Then We Entered The Matrix</h3>
              <p className="fmf-why-subtitle">A system optimised for safety, not fulfillment.</p>
              <p className="fmf-why-body">Trade your time, energy, and most productive hours for security. It's not a conspiracy — it's just an optimisation that forgot about you.</p>
            </div>

            <div className="fmf-why-card reveal-blur-up" style={{ transitionDelay: '350ms' }}>
              <span className="fmf-why-num">3</span>
              <h3 className="fmf-why-title">Achievement vs Fulfillment</h3>
              <p className="fmf-why-subtitle">We were taught it's one or the other.</p>
              <p className="fmf-why-body"><strong>Western trap:</strong> Climb the ladder, feel empty at the top.</p>
              <p className="fmf-why-body"><strong>Eastern trap:</strong> Find inner peace, struggle to pay rent.</p>
              <p className="fmf-why-body fmf-why-highlight">Your flow gives you both.</p>
            </div>
          </div>
        </div>
      </section>

      {/* THE SHIFT — 3-col sells */}
      <section className="fmf-section">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">THE SHIFT</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>The world changed. The rules are different.</h2>
          <p className="fmf-sub reveal-blur-up" style={{ transitionDelay: '150ms' }}>
            AI collapsed the barrier. The new economy rewards people who deeply understand specific problems.
          </p>
          <div className="fmf-sells-grid">
            <div className="fmf-sell reveal-slide-left" style={{ transitionDelay: '0ms' }}>
              <div className="fmf-sell-icon">{'\u{1F680}'}</div>
              <h3 className="fmf-sell-title">Build cost collapsed</h3>
              <p className="fmf-sell-desc">What took teams of ten now takes a laptop and a vision.</p>
            </div>
            <div className="fmf-sell reveal-fade-up" style={{ transitionDelay: '120ms' }}>
              <div className="fmf-sell-icon">{'\u{1F310}'}</div>
              <h3 className="fmf-sell-title">Distribution is free</h3>
              <p className="fmf-sell-desc">Reach your people without capital, credentials, or years of grinding.</p>
            </div>
            <div className="fmf-sell reveal-slide-right" style={{ transitionDelay: '240ms' }}>
              <div className="fmf-sell-icon">{'\u{1F3AF}'}</div>
              <h3 className="fmf-sell-title">Specificity wins</h3>
              <p className="fmf-sell-desc">The future rewards people who deeply understand specific problems — not generalists.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 3-col steps */}
      <section className="fmf-section fmf-section--warm">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">HOW IT WORKS</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Discover. Play. Grow.</h2>
          <p className="fmf-sub reveal-blur-up" style={{ transitionDelay: '150ms' }}>
            A real life game to live your ambitions faster.
          </p>
          <div className="fmf-steps-grid">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`fmf-step ${i % 2 === 0 ? 'reveal-slide-left' : 'reveal-slide-right'}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <span className="fmf-step-num">{i + 1}</span>
                <h3 className="fmf-step-title">{step.title}</h3>
                <p className="fmf-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES — 3-col with accent bars */}
      <section className="fmf-section">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">3 CATEGORIES</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Designed to scale your impact and income.</h2>
          <div className="fmf-sub-spacer" />
          <div className="fmf-cat-grid">
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.name}
                className="fmf-cat reveal-fade-up"
                style={{ transitionDelay: `${i * 70}ms`, '--cat-accent': cat.color }}
              >
                <div className="fmf-cat-emoji">{cat.emoji}</div>
                <div className="fmf-cat-text">
                  <h3 className="fmf-cat-name">{cat.name}</h3>
                  <p className="fmf-cat-desc">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT'S INCLUDED — detail stats */}
      <section className="fmf-section fmf-section--warm">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">EVERYTHING INCLUDED</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>One platform. Every tool you need.</h2>
          <p className="fmf-sub reveal-blur-up" style={{ transitionDelay: '150ms' }}>
            From stuck to monetising your mission.
          </p>
          <div className="fmf-includes-grid">
            {[
              { emoji: '\u{1F50D}', label: 'Discovery', value: 'Flow Finder, Archetypes, Earthquake Quiz' },
              { emoji: '\u{1F3D7}\uFE0F', label: 'Building', value: '$100M Offer Builder, Funnel Calculator' },
              { emoji: '\u{1F49C}', label: 'Healing', value: 'Groan Matrix, Healing Compass, Nervous System' },
              { emoji: '\u{1F3AE}', label: 'Gamified', value: '7-Day Challenges, Points, Leaderboard' },
              { emoji: '\u{1F4BC}', label: 'CRM', value: 'Content Generator, Contacts, Email Sequences' },
              { emoji: '\u{1F916}', label: 'AI Co-Founder', value: 'Zarlo — context-aware AI on every page' },
            ].map((item, i) => (
              <div key={item.label} className="fmf-include reveal-fade-up" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="fmf-include-emoji">{item.emoji}</div>
                <span className="fmf-include-label">{item.label}</span>
                <span className="fmf-include-value">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER STORY — narrative section */}
      <section className="fmf-origin">
        <div className="fmf-container fmf-origin-inner">
          <div className="fmf-origin-text">
            <p className="fmf-label fmf-label--left reveal-slide-left">THE STORY BEHIND THIS</p>
            <p className="fmf-origin-line reveal-slide-left" style={{ transitionDelay: '60ms' }}>Hey, I'm Huzz.</p>
            <p className="fmf-origin-line reveal-slide-left" style={{ transitionDelay: '120ms' }}>In 2020, I realised a corporate job wasn't for me.</p>
            <p className="fmf-origin-line fmf-origin-bold reveal-slide-left" style={{ transitionDelay: '180ms' }}>Three years later? I was still in the same job.</p>
            <p className="fmf-origin-line reveal-slide-left" style={{ transitionDelay: '240ms' }}>It wasn't from a lack of clarity. It wasn't from a lack of education — I'd spent $30,000 on 52 courses.</p>
            <p className="fmf-origin-line fmf-origin-bold reveal-slide-left" style={{ transitionDelay: '300ms' }}>It was because I didn't feel safe.</p>
            <p className="fmf-origin-line fmf-origin-muted reveal-slide-left" style={{ transitionDelay: '360ms' }}>Scared of judgement. Scared of failing. Scared I wasn't good enough.</p>
          </div>
          <div className="fmf-origin-turn">
            <p className="fmf-origin-line reveal-slide-right">In 2023, fed up, I challenged myself to do one thing a week that terrified me.</p>
            <div className="fmf-origin-results reveal-blur-up" style={{ transitionDelay: '120ms' }}>
              <p><strong>Within 5 weeks:</strong> living in Bali.</p>
              <p><strong>Within 3 months:</strong> quit my job.</p>
              <p><strong>Within 5 months:</strong> funding my life through hosting silent discos on beaches across South-East Asia.</p>
            </div>
          </div>
          <blockquote className="fmf-origin-quote reveal-slide-right">
            <div className="fmf-quote-mark" aria-hidden="true">&ldquo;</div>
            <p>We don't rise to the level of our ambitions — we fall to the level of what feels safe.</p>
          </blockquote>
          <p className="fmf-origin-close reveal-blur-up">
            <strong>Find My Flow</strong> is the only platform that merges business teaching with healing — so you actually do the things you know you should do.
          </p>
        </div>
      </section>

      {/* BRONNIE WARE — blockquote + CTA */}
      <section className="fmf-section">
        <div className="fmf-container">
          <div className="fmf-regret-block reveal-scale">
            <p className="fmf-regret-context">
              Bronnie Ware spent years as a palliative care nurse. She asked patients about their regrets. The answer was so consistent, she wrote a book about it.
            </p>
            <blockquote className="fmf-regret-quote">
              <div className="fmf-quote-mark" aria-hidden="true">&ldquo;</div>
              <p>I wish I'd had the courage to live a life true to myself, not the life others expected of me.</p>
            </blockquote>
            <p className="fmf-regret-answer">
              Finding your flow is the answer to not having this regret.
            </p>
          </div>
        </div>
      </section>

      {/* TWO PATHS — the ask */}
      <section className="fmf-section fmf-section--warm" id="fmf-paths">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">YOUR NEXT STEP</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Where are you on your journey?</h2>
          <div className="fmf-paths-grid">
            <div className="fmf-path reveal-slide-left">
              <div className="fmf-path-icon">{'\u{1F680}'}</div>
              <h3 className="fmf-path-title">I want to work for myself</h3>
              <p className="fmf-path-desc">Discover what to build, who to serve, and how to make it real.</p>
              <ul className="fmf-path-list">
                <li>Uncover your unique genius</li>
                <li>Find problems you love solving</li>
                <li>Create your first offer</li>
                <li>Launch with a guided system</li>
              </ul>
              <button className="fmf-cta fmf-cta--form" onClick={() => navigate('/try/earthquake')}>
                Discover What's Blocking You &rarr;
              </button>
            </div>
            <div className="fmf-path reveal-slide-right" style={{ transitionDelay: '120ms' }}>
              <div className="fmf-path-icon">{'\u{1F9ED}'}</div>
              <h3 className="fmf-path-title">I'm not sure what I want</h3>
              <p className="fmf-path-desc">Take 3 minutes to discover the Protective Voice keeping you stuck.</p>
              <ul className="fmf-path-list">
                <li>Discover your loudest Protective Voice</li>
                <li>Find your awakening stage</li>
                <li>Identify your primary block</li>
                <li>Clarity in 3 minutes flat</li>
              </ul>
              <button className="fmf-cta-secondary" onClick={() => navigate('/try/earthquake')}>
                Take the Free Quiz &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="fmf-section">
        <div className="fmf-container">
          <p className="fmf-label reveal-blur-up">FAQ</p>
          <h2 className="fmf-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Common questions.</h2>
          <div className="fmf-faq-list reveal-blur-up" style={{ transitionDelay: '150ms' }}>
            {FAQS.map((faq, i) => (
              <div key={i} className={`fmf-faq${expandedFaq === i ? ' fmf-faq--open' : ''}`}>
                <button className="fmf-faq-q" onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                  <span>{faq.q}</span>
                  <span className="fmf-faq-toggle">{expandedFaq === i ? '\u2212' : '+'}</span>
                </button>
                {expandedFaq === i && (
                  <div className="fmf-faq-a">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="fmf-footer">
        <div className="fmf-container">
          <p className="fmf-footer-text">FindMyFlow &middot; Built by Huzz &middot; &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* STICKY MOBILE CTA */}
      <div className={`fmf-sticky${stickyVisible ? ' fmf-sticky--show' : ''}`}>
        <button className="fmf-cta fmf-sticky-btn" onClick={() => navigate('/try/earthquake')}>
          Discover What's Blocking You &rarr;
        </button>
      </div>

      {/* WAITLIST MODAL */}
      <WaitlistModal
        isOpen={showWaitlist}
        onClose={() => setShowWaitlist(false)}
      />
    </div>
  )
}
