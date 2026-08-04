import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRevealAll } from '../hooks/useReveal'
import { supabase } from '../lib/supabaseClient'
import './FantasyLeagueLanding.css'

const CATEGORIES = [
  { emoji: '\u{1F3AE}', name: 'Play-List', desc: 'Do things you love but feel scary.', color: '#E9A23B' },
  { emoji: '\u{1F9D8}', name: 'Healing', desc: 'Recognise. Release. Rewire.', color: '#10b981' },
  { emoji: '\u{1F381}', name: 'Bonus', desc: 'Surprises to support the journey.', color: '#3B82F6' },
]

const STEPS = [
  { title: 'Join the league', desc: 'Play solo or team up with friends. Your call.' },
  { title: 'Sign up', desc: '2 minutes. Name, email, and a promise to show up.' },
  { title: 'Gamify your ambitions for 4 weeks', desc: 'Round robin weeks 1\u20133. Finals week 4. Win 2 of 3 categories to take the week.' },
]

export default function FantasyLeagueLanding() {
  const navigate = useNavigate()
  const revealRef = useRevealAll()
  const [headerSolid, setHeaderSolid] = useState(false)
  const [formData, setFormData] = useState({ name: '', whatsapp: '', team_readiness: '', team_name: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onScroll = () => setHeaderSolid(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])


  const scrollToSignup = () => {
    document.getElementById('signup')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const { error } = await supabase.from('league_signups').insert({
        name: formData.name,
        whatsapp: formData.whatsapp || null,
        team_readiness: formData.team_readiness,
        team_name: formData.team_name || null,
      })
      if (error) {
        console.warn('Signup save failed:', error)
        alert('Something went wrong — please try again.')
        setSubmitting(false)
        return
      }
    } catch (err) {
      console.warn('Signup error:', err)
      alert('Something went wrong — please try again.')
      setSubmitting(false)
      return
    }
    setSubmitted(true)
    setSubmitting(false)
  }

  return (
    <div className="flp" ref={revealRef}>

      {/* NAV */}
      <header className={`flp-nav${headerSolid ? ' flp-nav--solid' : ''}`}>
        <div className="flp-container flp-nav-inner">
          <div className="flp-logo" onClick={() => navigate('/')}>
            <span className="flp-logo-dot" />
            Find My Flow
          </div>
          <button className="flp-nav-btn" onClick={() => navigate('/log-in')}>Log in</button>
        </div>
      </header>

      {/* HERO */}
      <section className="flp-hero">
        <div className="flp-hero-glow" aria-hidden="true" />
        <div className="flp-container flp-hero-inner">
          <p className="flp-eyebrow">SEASON 1 &middot; FREE TRIAL</p>
          <h1 className="flp-h1">
            Gamify Your<br />
            <span className="flp-h1-accent">Ambitions.</span>
          </h1>
          <p className="flp-hero-sub">
            Think Fantasy Football but for your business.
          </p>
          <div className="flp-hero-badges">
            <span className="flp-badge">Starts Monday</span>
          </div>
          <button className="flp-cta" onClick={scrollToSignup}>
            Join Season 1 &rarr;
          </button>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section className="flp-section">
        <div className="flp-container">
          <p className="flp-label reveal-blur-up">WHY IT WORKS</p>
          <h2 className="flp-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Making accountability fun.</h2>
          <p className="flp-sub reveal-blur-up" style={{ transitionDelay: '150ms' }}>
            You want to do these things anyway. This just makes it more fun.
          </p>
          <div className="flp-sells-grid">
            <div className="flp-sell reveal-slide-left" style={{ transitionDelay: '0ms' }}>
              <div className="flp-sell-icon">{'\u{1F3AF}'}</div>
              <h3 className="flp-sell-title">Score points for what you're already doing</h3>
              <p className="flp-sell-desc">Now every action earns points for your team.</p>
            </div>
            <div className="flp-sell reveal-fade-up" style={{ transitionDelay: '120ms' }}>
              <div className="flp-sell-icon">{'\u{1F91D}'}</div>
              <h3 className="flp-sell-title">Be on a team with friends</h3>
              <p className="flp-sell-desc">When they're counting on you, procrastinating stops working.</p>
            </div>
            <div className="flp-sell reveal-slide-right" style={{ transitionDelay: '240ms' }}>
              <div className="flp-sell-icon">{'\u{1F525}'}</div>
              <h3 className="flp-sell-title">Compete head-to-head each week</h3>
              <p className="flp-sell-desc">Your team vs another. Who doesn't love to win?</p>
            </div>
          </div>
        </div>
      </section>

      {/* ORIGIN STORY */}
      <section className="flp-origin">
        <div className="flp-container flp-origin-inner">
          <div className="flp-origin-text">
            <p className="flp-label flp-label--left reveal-slide-left">WHAT MAKES THIS DIFFERENT</p>
            <p className="flp-origin-line reveal-slide-left" style={{ transitionDelay: '60ms' }}>In 2020, I realised a corporate job wasn't for me.</p>
            <p className="flp-origin-line flp-origin-bold reveal-slide-left" style={{ transitionDelay: '120ms' }}>Three years later? I was still in the same job.</p>
            <p className="flp-origin-line reveal-slide-left" style={{ transitionDelay: '180ms' }}>It wasn't from a lack of clarity.</p>
            <p className="flp-origin-line reveal-slide-left" style={{ transitionDelay: '240ms' }}>It wasn't from a lack of education &mdash; I'd spent $30,000 on 52 courses.</p>
            <p className="flp-origin-line reveal-slide-left" style={{ transitionDelay: '300ms' }}>It wasn't from a lack of will.</p>
            <p className="flp-origin-line flp-origin-bold reveal-slide-left" style={{ transitionDelay: '360ms' }}>It was because I didn't feel safe.</p>
            <p className="flp-origin-line flp-origin-muted reveal-slide-left" style={{ transitionDelay: '420ms' }}>Scared of judgement. Scared of failing. Scared I wasn't good enough.</p>
          </div>
          <div className="flp-origin-turn">
            <p className="flp-origin-line reveal-slide-right" style={{ transitionDelay: '0ms' }}>In 2023, fed up, I challenged myself to do one thing a week that terrified me.</p>
            <div className="flp-origin-results reveal-blur-up" style={{ transitionDelay: '120ms' }}>
              <p><strong>Within 5 weeks:</strong> living in Bali.</p>
              <p><strong>Within 3 months:</strong> quit my job.</p>
              <p><strong>Within 5 months:</strong> funding my life through hosting silent discos.</p>
            </div>
          </div>
          <blockquote className="flp-origin-quote reveal-slide-right" style={{ transitionDelay: '0ms' }}>
            <div className="flp-quote-mark" aria-hidden="true">&ldquo;</div>
            <p>We don't rise to the level of our ambitions &mdash; we fall to the level of what feels safe.</p>
          </blockquote>
          <p className="flp-origin-close reveal-blur-up">
            This game merges business actions with accountability to do things outside your comfort zone &mdash; and the healing work to remove the fear at the source.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="flp-section flp-section--warm">
        <div className="flp-container">
          <p className="flp-label reveal-blur-up">CATEGORIES</p>
          <h2 className="flp-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>3 Categories Designed To Scale Your Impact & Income.</h2>
          <div className="flp-sub-spacer" />
          <div className="flp-cat-grid">
            {CATEGORIES.map((cat, i) => (
              <div
                key={cat.name}
                className="flp-cat reveal-fade-up"
                style={{ transitionDelay: `${i * 70}ms`, '--cat-accent': cat.color }}
              >
                <div className="flp-cat-emoji">{cat.emoji}</div>
                <h3 className="flp-cat-name">{cat.name}</h3>
                <p className="flp-cat-desc">{cat.desc}</p>
              </div>
            ))}
          </div>

          {/* SCORECARD */}
          <h3 className="flp-sc-title reveal-blur-up" style={{ transitionDelay: '300ms' }}>Example Scoreboard</h3>
          <p className="flp-sc-subtitle reveal-blur-up" style={{ transitionDelay: '320ms' }}>Score more in 2 of 3 categories to win the week.</p>
          <div className="flp-scorecard reveal-scale" style={{ transitionDelay: '350ms' }}>
            <div className="flp-sc-header">
              <span className="flp-sc-team">Team A: Comfort Crushers</span>
              <span className="flp-sc-vs">VS</span>
              <span className="flp-sc-team">Team B: Flow Finders</span>
            </div>
            {[
              { emoji: '\u{1F3AE}', name: 'Play-List', left: 145, right: 162 },
              { emoji: '\u{1F9D8}', name: 'Healing', left: 89, right: 67 },
              { emoji: '\u{1F381}', name: 'Bonus', left: 85, right: 70 },
            ].map(row => (
              <div key={row.name} className="flp-sc-row">
                <span className={`flp-sc-score${row.left > row.right ? ' flp-sc-score--win' : ''}`}>{row.left}</span>
                <span className="flp-sc-cat">{row.emoji} {row.name}</span>
                <span className={`flp-sc-score${row.right > row.left ? ' flp-sc-score--win' : ''}`}>{row.right}</span>
              </div>
            ))}
            <div className="flp-sc-result">
              Comfort Crushers win 2&ndash;1 {'\u{1F3C6}'}
            </div>
          </div>
        </div>
      </section>

      {/* SEASON DETAILS */}
      <section className="flp-section">
        <div className="flp-container">
          <p className="flp-label reveal-blur-up">SEASON 1</p>
          <h2 className="flp-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Season 1 Details</h2>
          <div className="flp-details-grid">
            {[
              { emoji: '\u{1F4C5}', label: 'Duration', value: '4 weeks' },
              { emoji: '\u{1F465}', label: 'Players', value: '12 (4 teams of 3)' },
              { emoji: '\u{1F4F1}', label: 'Platform', value: 'Find My Flow app' },
              { emoji: '\u{1F3C6}', label: 'Prize', value: 'Bragging rights' },
            ].map((item, i) => (
              <div key={item.label} className="flp-detail reveal-fade-up" style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="flp-detail-emoji">{item.emoji}</div>
                <span className="flp-detail-label">{item.label}</span>
                <span className="flp-detail-value">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flp-timeline reveal-slide-left" style={{ transitionDelay: '100ms' }}>
            {[
              { week: 'Week 1', desc: 'vs Team B' },
              { week: 'Week 2', desc: 'vs Team C' },
              { week: 'Week 3', desc: 'vs Team D' },
              { week: 'Week 4', desc: 'FINALS \u{1F3C6}', isFinal: true },
            ].map((w, i) => (
              <div key={i} className={`flp-timeline-item${w.isFinal ? ' flp-timeline-item--final' : ''}`}>
                <span className="flp-timeline-week">{w.week}</span>
                <span className="flp-timeline-desc">{w.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="flp-section">
        <div className="flp-container">
          <p className="flp-label reveal-blur-up">HOW IT WORKS</p>
          <h2 className="flp-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Recruit. Sign up. Compete.</h2>
          <div className="flp-steps-grid">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className={`flp-step ${i % 2 === 0 ? 'reveal-slide-left' : 'reveal-slide-right'}`}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <span className="flp-step-num">{i + 1}</span>
                <h3 className="flp-step-title">{step.title}</h3>
                <p className="flp-step-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIGN UP */}
      <section className="flp-section flp-section--warm flp-signup-section" id="signup">
        <div className="flp-container">
          <p className="flp-label reveal-blur-up">JOIN SEASON 1</p>
          <h2 className="flp-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Grab your spot.</h2>
          <p className="flp-sub reveal-blur-up" style={{ transitionDelay: '150ms' }}>12 spots. Free. Starts Monday.</p>

          {!submitted ? (
            <form className="flp-signup-form reveal-blur-up" style={{ transitionDelay: '250ms' }} onSubmit={handleSubmit}>
              <input
                className="flp-field"
                type="text"
                placeholder="Your name"
                required
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              />
              <input
                className="flp-field"
                type="tel"
                placeholder="WhatsApp number (optional)"
                value={formData.whatsapp}
                onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
              />
              <fieldset className="flp-readiness">
                <legend className="flp-readiness-legend">Is your team ready?</legend>
                {[
                  { value: 'solo', label: 'Just me currently' },
                  { value: 'friends', label: 'Got a few friends in mind' },
                  { value: 'ready', label: 'Got my three ready to go' },
                ].map(opt => (
                  <label
                    key={opt.value}
                    className={`flp-readiness-opt${formData.team_readiness === opt.value ? ' flp-readiness-opt--active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="team_readiness"
                      value={opt.value}
                      checked={formData.team_readiness === opt.value}
                      onChange={e => setFormData(p => ({ ...p, team_readiness: e.target.value }))}
                      required
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </fieldset>
              {formData.team_readiness === 'ready' && (
                <input
                  className="flp-field"
                  type="text"
                  placeholder="Team name"
                  value={formData.team_name}
                  onChange={e => setFormData(p => ({ ...p, team_name: e.target.value }))}
                />
              )}
              <button type="submit" className="flp-cta flp-cta--form" disabled={submitting}>
                {submitting ? 'Signing up\u2026' : 'Sign Up \u2192'}
              </button>
            </form>
          ) : (
            <div className="flp-success-light reveal-scale">
              <div className="flp-success-emoji">{'\u{1F3C6}'}</div>
              <h3 className="flp-success-light-h3">Registration received.</h3>
              <p className="flp-success-light-p">You'll hear from Nic shortly.</p>
            </div>
          )}
        </div>
      </section>

      {/* SNEAK PEEK */}
      <section className="flp-section">
        <div className="flp-container">
          <p className="flp-label reveal-blur-up">SNEAK PEEK</p>
          <h2 className="flp-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>Inside the app.</h2>
          <div className="flp-preview reveal-blur-up" style={{ transitionDelay: '200ms' }}>
            <img
              src="/images/app-preview.png"
              alt="Find My Flow app showing gamified challenge dashboard with leaderboard, categories, and quest progress"
              className="flp-preview-img"
              loading="lazy"
              width={393}
              height={793}
            />
          </div>
        </div>
      </section>

      {/* THE ASK */}
      <section className="flp-section flp-section--warm">
        <div className="flp-container">
          <p className="flp-label reveal-blur-up">THE ASK</p>
          <h2 className="flp-h2 reveal-blur-up" style={{ transitionDelay: '80ms' }}>In exchange for making this free.</h2>
          <div className="flp-ask-grid">
            <div className="flp-ask reveal-slide-left" style={{ transitionDelay: '0ms' }}>
              <div className="flp-ask-icon">{'\u{1F4AC}'}</div>
              <h3 className="flp-ask-title">Feedback</h3>
              <p className="flp-ask-desc">Tell me what works, what doesn't, and what you wish existed.</p>
            </div>
            <div className="flp-ask reveal-fade-up" style={{ transitionDelay: '120ms' }}>
              <div className="flp-ask-icon">{'\u{2B50}'}</div>
              <h3 className="flp-ask-title">Testimonials</h3>
              <p className="flp-ask-desc">If it changes something for you, let me share your words.</p>
            </div>
            <div className="flp-ask reveal-slide-right" style={{ transitionDelay: '240ms' }}>
              <div className="flp-ask-icon">{'\u{1F4E3}'}</div>
              <h3 className="flp-ask-title">Tell your friends</h3>
              <p className="flp-ask-desc">If you love it, spread the word. That's how this grows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flp-footer">
        <div className="flp-container">
          <p className="flp-footer-text">Find My Flow &middot; Built by Huzz</p>
        </div>
      </footer>

    </div>
  )
}
