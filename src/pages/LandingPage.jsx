import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      q: "What if I don't know what I want to build?",
      a: "That's exactly what we help with. The Flow Finder guides you through discovering your unique skills, the problems you naturally solve, and the people you're meant to serve. Most people arrive confused and leave with clarity."
    },
    {
      q: "How is this different from courses or coaching?",
      a: "Courses dump information on you and hope you figure it out. Coaches tell you what to do. We guide you through discovering your own answers — because you're the expert on you. It's structured self-discovery, not someone else's blueprint."
    },
    {
      q: "How long does it take?",
      a: "The Career Clarity Quiz takes 4 minutes. The full Flow Finder journey can be done in a few focused sessions. But this isn't about speed — it's about finally getting clear on what you actually want."
    },
    {
      q: "Is this just for people who want to start a business?",
      a: "No. Some people discover they need to build their own thing. Others realise they need a different job that actually meets their needs. The Career Clarity Quiz helps you figure out which path is right for you."
    }
  ];

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-container header-inner">
          <div className="header-logo" onClick={() => navigate('/')}>
            Find My Flow
          </div>
          <button
            className="header-login"
            onClick={() => navigate('/log-in')}
          >
            Log in
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <span className="landing-badge">
            A process to monetise your mission and gain financial + location freedom
          </span>

          <h1 className="landing-headline">
            I believe there's a <span className="gold-text">flow</span> for your life.
          </h1>

          <p className="hero-vision">
            A unique path only you can walk — where work feels like play,
            income meets purpose, and you finally stop trading your best hours
            for someone else's dream.
          </p>

          <p className="hero-bridge">
            Ancient wisdom knew this. Modern systems forgot it.
          </p>

          <p className="hero-promise">
            We help you rediscover yours.
          </p>

          <div className="hero-cta-group">
            <button
              className="hero-cta-primary"
              onClick={() => navigate('/get-started')}
            >
              Start Your Journey
            </button>
            <button
              className="hero-cta-secondary"
              onClick={() => navigate('/career-clarity')}
            >
              Take the Free Quiz
            </button>
          </div>

          <p className="hero-note">Free to start. No credit card required.</p>
        </div>
      </section>

      {/* Different Cultures Section */}
      <section className="landing-cultures">
        <div className="landing-container">
          <h2 className="cultures-heading">Different cultures. Same discovery.</h2>
          <p className="cultures-subheading">
            Across millennia, wisdom traditions converged on a single insight.
          </p>

          <div className="cultures-cards">
            <div className="culture-card">
              <p className="culture-tradition">Sanskrit</p>
              <h3 className="culture-term">Svadharma</h3>
              <p className="culture-translation">"One's own duty"</p>
              <p className="culture-description">
                Better to imperfectly follow your own path than to perfectly follow someone else's.
                The cosmos operates through differentiation — everything has its essential nature.
              </p>
            </div>

            <div className="culture-card">
              <p className="culture-tradition">Taoist</p>
              <h3 className="culture-term">Te</h3>
              <p className="culture-translation">"Inherent power"</p>
              <p className="culture-description">
                Your individual expression of the Tao. You don't create it through effort — you uncover it
                by removing obstructions. Water doesn't struggle to flow downhill.
              </p>
            </div>

            <div className="culture-card">
              <p className="culture-tradition">Japanese</p>
              <h3 className="culture-term">Ikigai</h3>
              <p className="culture-translation">"Reason for being"</p>
              <p className="culture-description">
                Emerges at the intersection of what you love and what others need. Not found through
                navel-gazing, but through engagement with community needs.
              </p>
            </div>
          </div>

          <p className="cultures-question">
            So how do you find yours?
          </p>
        </div>
      </section>

      {/* Is This You? Section */}
      <section className="landing-is-this-you">
        <div className="landing-container">
          <h2 className="is-this-you-heading">Is This You?</h2>

          <div className="is-this-you-vision">
            <p className="vision-intro">Someone who feels like life is supposed to be...</p>
            <ul className="vision-list">
              <li>An <strong>adventure</strong>, not about climbing a ladder</li>
              <li>About <strong>creating impact</strong>, not living for the weekend</li>
              <li>About <strong>working for purpose</strong>, not a salary</li>
            </ul>
          </div>

          <p className="stuck-feeling">
            Someone who feels stuck, like your essence knows you're capable of more
            but taking action seems hard or heavy?
          </p>

          <div className="symptoms-section">
            <p className="symptoms-intro">You might recognise these symptoms:</p>
            <div className="symptoms-grid">
              <div className="symptom-card">
                <div className="symptom-icon">🧠</div>
                <h3>Head Full of Ambitions</h3>
                <p>Big dreams, endless ideas — but no clear path to make them real.</p>
              </div>
              <div className="symptom-card">
                <div className="symptom-icon">😰</div>
                <h3>Visibility Paralysis</h3>
                <p>Fear of judgement keeps you invisible — even when you're ready to share.</p>
              </div>
              <div className="symptom-card">
                <div className="symptom-icon">🚫</div>
                <h3>Can't Monetise Gifts</h3>
                <p>You have skills and passion, but no system to turn them into income.</p>
              </div>
              <div className="symptom-card">
                <div className="symptom-icon">😶</div>
                <h3>Hiding Your Real Self</h3>
                <p>Fear of being truly seen keeps you playing small and staying quiet.</p>
              </div>
            </div>
          </div>

          <div className="validation-block">
            <p className="validation-text">
              You're not broken. You're not lazy. You're just caught between
              the fear of uncertainty and the exhaustion of not making progress.
            </p>
            <p className="validation-reframe">
              What if we could make pursuing these ambitions <span className="gold-text">fun</span>?
            </p>
          </div>
        </div>
      </section>

      {/* How You Got Here - Single Flowing Narrative */}
      <section className="landing-how-you-got-here">
        <div className="landing-container">
          <h2 className="narrative-heading">Why You Feel This Way</h2>

          <div className="narrative-flow">
            {/* Chapter 1: School */}
            <div className="narrative-chapter">
              <div className="chapter-marker">1</div>
              <div className="chapter-content">
                <h3 className="chapter-title">Our Curiosities Are Our Compass</h3>
                <p className="chapter-subtitle">School failed to nurture them.</p>
                <p className="chapter-body">
                  Instead of following what lights us up, we were given a standardised curriculum.
                  Sit down. Shut up. Memorise this. Get graded. Repeat for 15+ years.
                </p>
                <p className="chapter-body">
                  They trained the curiosity out of us — and made learning feel like a chore.
                </p>
              </div>
            </div>

            {/* Chapter 2: The Matrix */}
            <div className="narrative-chapter">
              <div className="chapter-marker">2</div>
              <div className="chapter-content">
                <h3 className="chapter-title">Then We Entered The Matrix</h3>
                <p className="chapter-subtitle">A system optimised for safety, not fulfillment.</p>
                <p className="chapter-body">
                  A salary ensures we can cover our basic needs. That's the deal.
                  Trade your time, energy, and most productive hours for security.
                </p>
                <p className="chapter-body">
                  It's not a conspiracy — it's just an optimisation that forgot about you.
                </p>
              </div>
            </div>

            {/* Chapter 3: Achievement vs Fulfillment */}
            <div className="narrative-chapter">
              <div className="chapter-marker">3</div>
              <div className="chapter-content">
                <h3 className="chapter-title">Achievement vs Fulfillment</h3>
                <p className="chapter-subtitle">We were taught it's one or the other.</p>
                <p className="chapter-body">
                  <strong>Western trap:</strong> Climb the ladder, hit the numbers, feel empty at the top.
                </p>
                <p className="chapter-body">
                  <strong>Eastern trap:</strong> Find inner peace, reject success, struggle to pay rent.
                </p>
                <p className="chapter-body chapter-highlight">
                  Finding your flow is designed to give you both.
                </p>
              </div>
            </div>

            {/* Chapter 4: The Safe Path */}
            <div className="narrative-chapter">
              <div className="chapter-marker">4</div>
              <div className="chapter-content">
                <h3 className="chapter-title">There's Many Ways to Build a Life</h3>
                <p className="chapter-subtitle">The ladder became the default when there were no other options.</p>
                <p className="chapter-body">
                  Good grades → Degree → Job → Promotion → Corner Office → "Is this it?"
                </p>
                <p className="chapter-body chapter-bridge">
                  But now there is another way...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The World Changed Section */}
      <section className="landing-world-changed">
        <div className="landing-container">
          <h2 className="section-heading">The world changed. The rules are different now.</h2>

          <div className="world-changed-content">
            <p className="world-changed-old">
              For decades, you needed capital, credentials, or years of grinding to compete.
              The game favored big players with massive reach.
            </p>

            <p className="world-changed-shift">Not anymore.</p>

            <p className="world-changed-new">
              AI collapsed the build-cost barrier. Distribution is free. The new economy rewards
              people who deeply understand specific problems — not generalists serving everyone poorly.
            </p>
          </div>

          <div className="portfolio-vision">
            <h3 className="portfolio-heading">The future isn't "job vs. entrepreneur."</h3>
            <p className="portfolio-description">
              It's assembling your unique configuration of income streams that create safety while honoring your flow.
            </p>

            <div className="portfolio-pills">
              <span className="portfolio-pill">Consulting</span>
              <span className="portfolio-pill">Digital Products</span>
              <span className="portfolio-pill">Content</span>
              <span className="portfolio-pill">Micro-SaaS</span>
              <span className="portfolio-pill">Part-time Role</span>
            </div>
          </div>

          <p className="world-changed-timing">
            You're catching this at exactly the right moment.
          </p>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="landing-founder">
        <div className="landing-container">
          <div className="founder-content">
            <div className="founder-image">
              <img
                src="/images/huzz-profile.jpg"
                alt="Huzz - Founder of Find My Flow"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
              <div className="founder-image-fallback" style={{ display: 'none' }}>
                <span>🌞</span>
              </div>
            </div>

            <div className="founder-text">
              <h2 className="founder-greeting">Hey, I'm Huzz</h2>

              <p className="founder-thesis">
                Ever since I quit my job, I've developed an unwavering belief in <strong>'Flow'</strong> —
                the idea that there's a unique path only you can walk, based on your combination of
                skills, experiences, and circumstances.
              </p>

              <div className="founder-transformation">
                <div className="transformation-label">My transformation in 12 months:</div>
                <div className="transformation-journey">
                  <div className="journey-point journey-from">
                    <span className="journey-emoji">🏖️</span>
                    <span className="journey-stat">13 headsets</span>
                    <span className="journey-place">Dancing on beaches in Thailand</span>
                  </div>
                  <div className="journey-arrow">→</div>
                  <div className="journey-point journey-to">
                    <span className="journey-emoji">🎉</span>
                    <span className="journey-stat">350 headsets</span>
                    <span className="journey-place">Hosting Bali beach club events</span>
                  </div>
                </div>
              </div>

              <div className="founder-why">
                <h3 className="founder-why-label">Why I built this</h3>

                <p className="founder-why-critique">
                  Most business accelerator programs and life path education institutions focus on
                  <strong> what action to take</strong> — without any consideration about what may be
                  <strong> stopping the action</strong>.
                </p>

                <p>
                  In 2020, I learned a corporate job wasn't for me. Three years later?
                  I was still in the same job.
                </p>

                <p>
                  It wasn't from a lack of clarity.<br />
                  It wasn't from a lack of education — I'd spent <strong>$30,000</strong> on 52 learning
                  experiences post-university.<br />
                  It wasn't from a lack of will.
                </p>

                <p className="founder-why-emphasis">
                  It was because I didn't feel safe.
                </p>

                <p>
                  I was scared of judgement. Scared of failing. Scared I wasn't good enough.
                </p>

                <div className="founder-challenge">
                  <p className="challenge-intro">
                    So at the beginning of 2023, fed up, I challenged myself to do
                    <strong> one thing a week that terrified me</strong>.
                  </p>
                  <div className="challenge-timeline">
                    <div className="timeline-item">
                      <span className="timeline-marker">5 weeks</span>
                      <span className="timeline-text">Working from Bali</span>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-marker">3 months</span>
                      <span className="timeline-text">Quit my job</span>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-marker">5 months</span>
                      <span className="timeline-text">Funding my life hosting silent discos on beaches across Thailand and Bali</span>
                    </div>
                  </div>
                </div>

                <p className="founder-why-insight">
                  This challenge changed my life. Why?
                </p>

                <p className="founder-why-quote">
                  Because we don't rise to the level of our ambitions —
                  <strong> we fall to the level of what feels safe</strong>.
                </p>

                <p>
                  And this challenge changed what felt safe.
                </p>
              </div>

              <div className="founder-solution">
                <p>
                  <strong>Find My Flow</strong> is designed to change what feels safe to you.
                </p>
                <div className="solution-methods">
                  <div className="method-item">
                    <span className="method-name">Groans</span>
                    <span className="method-desc">Actions you know you're capable of, but your body holds fear</span>
                  </div>
                  <div className="method-item">
                    <span className="method-name">Healing</span>
                    <span className="method-desc">Going to the root of what's causing the fear and removing it</span>
                  </div>
                </div>
                <p className="solution-unique">
                  It's the only alternate life path education system that merges
                  <strong> business teaching</strong> with <strong>healing</strong>.
                </p>
              </div>

              <div className="founder-credentials">
                <div className="credentials-header">
                  <span className="credentials-years">8+ Years</span>
                  <span className="credentials-title">Building Transformational Programs</span>
                </div>

                <p className="credentials-claim">
                  I don't believe there are many humans on the planet with more domain expertise
                  in the realm of program building.
                </p>

                <div className="credentials-experience">
                  <div className="experience-item">
                    <span className="experience-icon">🚀</span>
                    <span className="experience-text">
                      <strong>5 years at Investible (VC)</strong> — building and delivering entrepreneurial programs
                      from 12-week accelerators to 2-day hackathons and everything in between
                    </span>
                  </div>
                  <div className="experience-item">
                    <span className="experience-icon">🎯</span>
                    <span className="experience-text">
                      <strong>3 years</strong> creating and delivering my own programs
                    </span>
                  </div>
                </div>

                <div className="credentials-training">
                  <div className="training-label">Completed the world's best programs:</div>
                  <div className="training-courses">
                    <div className="course-badge">
                      <span className="course-name">altMBA</span>
                      <span className="course-price">$5,000</span>
                      <span className="course-creator">Seth Godin — the 'Godfather of Marketing'</span>
                      <span className="course-desc">Learn more in 4 weeks than an MBA teaches in 2 years</span>
                    </div>
                    <div className="course-badge">
                      <span className="course-name">Write of Passage</span>
                      <span className="course-price">$5,000</span>
                      <span className="course-creator">David Perell</span>
                      <span className="course-desc">One of the first 'virtual schools' with a cult following</span>
                    </div>
                    <div className="course-badge course-badge-degree">
                      <span className="course-name">Bachelor of Creative Intelligence</span>
                      <span className="course-award">🏆 Winner of the 'Oscars of Education'</span>
                      <span className="course-creator">UTS — World's first transdisciplinary degree</span>
                      <span className="course-desc">Multi-award winning for its innovative approach to learning</span>
                    </div>
                  </div>
                </div>

                <div className="credentials-formula">
                  <span className="formula-intro">My secret?</span>
                  <span className="formula-name">The Three Pillars</span>
                  <span className="formula-pillars">Frameworks + Implementation + Community</span>
                  <span className="formula-desc">
                    — my unique formula for creating "magic programs" that cause participants
                    to walk away feeling like they've had one of the most transformational experiences of their life
                  </span>
                </div>

                <p className="credentials-kicker">
                  This is the level of design thinking behind every flow you'll experience.
                </p>
              </div>

              <p className="founder-mission">
                <strong>My north star:</strong> Help you go from idea to monetising your mission —
                as fast as possible.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning Matrix Section */}
      <section className="landing-positioning">
        <div className="landing-container">
          <h2 className="section-heading">Where We Fit</h2>
          <p className="section-subheading">
            The only platform combining therapeutic depth with business building
          </p>

          <div className="positioning-matrix">
            {/* Y-axis labels */}
            <div className="matrix-y-axis">
              <span className="axis-label axis-top">THERAPEUTIC DEPTH</span>
              <span className="axis-label axis-bottom">SURFACE LEVEL</span>
            </div>

            {/* Matrix grid */}
            <div className="matrix-grid">
              {/* Vertical axis arrow */}
              <div className="matrix-axis-vertical">
                <span className="axis-arrow">&#8593;</span>
                <div className="axis-line"></div>
                <span className="axis-arrow">&#8595;</span>
              </div>

              {/* Horizontal axis arrow */}
              <div className="matrix-axis-horizontal">
                <span className="axis-arrow">&#8592;</span>
                <div className="axis-line"></div>
                <span className="axis-arrow">&#8594;</span>
              </div>

              {/* X-axis labels */}
              <span className="x-label x-left">INNER FOCUS</span>
              <span className="x-label x-right">OUTER FOCUS</span>

              {/* Quadrant: Top-Left (Therapy Apps) */}
              <div className="matrix-quadrant quadrant-top-left">
                <span className="quadrant-title">Therapy Apps</span>
                <span className="quadrant-subtitle">(BetterHelp)</span>
              </div>

              {/* Quadrant: Top-Right (FindMyFlow) - highlighted */}
              <div className="matrix-quadrant quadrant-top-right quadrant-highlight">
                <span className="quadrant-star">&#9733;</span>
                <span className="quadrant-title">FindMyFlow</span>
                <span className="quadrant-subtitle">(Healing + Flow + Business)</span>
              </div>

              {/* Quadrant: Bottom-Left (Wellness) */}
              <div className="matrix-quadrant quadrant-bottom-left">
                <span className="quadrant-title">Mindvalley</span>
                <span className="quadrant-title">Headspace/Calm</span>
              </div>

              {/* Quadrant: Bottom-Right (Performance) */}
              <div className="matrix-quadrant quadrant-bottom-right">
                <span className="quadrant-title">BetterUp/CoachHub</span>
                <span className="quadrant-subtitle">(Performance)</span>
                <div className="quadrant-spacer"></div>
                <span className="quadrant-title">Sparketype</span>
                <span className="quadrant-subtitle">(Assessment only)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Flow Finder Framework Section */}
      <section className="landing-nikigai">
        <div className="landing-container">
          <h2 className="section-heading">The Flow Finder Framework</h2>
          <p className="section-subheading">
            Inspired by Ikigai — redesigned for building a business around your passions
          </p>

          <div className="nikigai-content">
            {/* Level 1: The Core Insight */}
            <div className="framework-level framework-level-1">
              <div className="level-marker">1</div>
              <div className="level-content">
                <h3 className="level-title">The Core Insight</h3>
                <p className="level-statement">
                  A business is simply: <strong>solving a problem</strong>, for <strong>a person</strong>, using <strong>a set of skills</strong>.
                </p>
                <p className="level-implication">
                  The question becomes: which problems, which people, which skills?
                </p>
              </div>
            </div>

            {/* Level 2: The Four Questions */}
            <div className="framework-level framework-level-2">
              <div className="level-marker">2</div>
              <div className="level-content">
                <h3 className="level-title">The Four Questions</h3>
                <p className="level-intro">We believe the answer is: the ones you're passionate about.</p>

                <div className="four-passions">
                  <div className="passion-item">
                    <span className="passion-icon">🎯</span>
                    <span className="passion-label">Skills</span>
                    <span className="passion-question">you're passionate about <strong>using</strong></span>
                  </div>
                  <div className="passion-item">
                    <span className="passion-icon">💡</span>
                    <span className="passion-label">Problems</span>
                    <span className="passion-question">you're passionate about <strong>solving</strong></span>
                  </div>
                  <div className="passion-item">
                    <span className="passion-icon">👥</span>
                    <span className="passion-label">People</span>
                    <span className="passion-question">you're passionate about <strong>serving</strong></span>
                  </div>
                  <div className="passion-item passion-item-mission">
                    <span className="passion-icon">🔥</span>
                    <span className="passion-label">Mission</span>
                    <span className="passion-question">you're passionate about <strong>suffering for</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Level 3: What This Defines */}
            <div className="framework-level framework-level-3">
              <div className="level-marker">3</div>
              <div className="level-content">
                <h3 className="level-title">What This Defines</h3>
                <p className="level-intro">Each answer narrows your path:</p>

                <div className="defines-grid">
                  <div className="defines-item">
                    <span className="defines-from">Skills</span>
                    <span className="defines-arrow">→</span>
                    <span className="defines-to">Your <strong>Role</strong></span>
                  </div>
                  <div className="defines-item">
                    <span className="defines-from">Problems</span>
                    <span className="defines-arrow">→</span>
                    <span className="defines-to">Your <strong>Industry</strong></span>
                  </div>
                  <div className="defines-item">
                    <span className="defines-from">People</span>
                    <span className="defines-arrow">→</span>
                    <span className="defines-to">Your <strong>Niche</strong></span>
                  </div>
                  <div className="defines-item">
                    <span className="defines-from">Mission</span>
                    <span className="defines-arrow">→</span>
                    <span className="defines-to">Your <strong>Company</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Level 4: The Formula */}
            <div className="framework-level framework-level-4">
              <div className="level-marker">4</div>
              <div className="level-content">
                <h3 className="level-title">The Formula</h3>

                <div className="formula-chain">
                  <span className="formula-element">Skills</span>
                  <span className="formula-operator">×</span>
                  <span className="formula-element">Problems</span>
                  <span className="formula-operator">×</span>
                  <span className="formula-element">People</span>
                  <span className="formula-operator">×</span>
                  <span className="formula-element">Mission</span>
                </div>

                <div className="formula-result">
                  <span className="formula-equals">=</span>
                  <div className="result-box">
                    <span className="result-label">Specific Knowledge</span>
                    <span className="result-desc">The thing no one else can compete with</span>
                    <div className="result-wisdom">
                      <span className="wisdom-word">Your Svadharma</span>
                      <span className="wisdom-separator">·</span>
                      <span className="wisdom-word">Your Te</span>
                      <span className="wisdom-separator">·</span>
                      <span className="wisdom-word">Your Ikigai</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Archetypes - Moved here */}
            <div className="framework-archetypes">
              <h3 className="archetypes-intro">Along the way, you'll discover your inner voices</h3>

              <div className="archetypes-duo">
                <div className="archetype-mini archetype-essence">
                  <span className="archetype-icon">✨</span>
                  <div className="archetype-info">
                    <span className="archetype-name">Your Essence Voice</span>
                    <span className="archetype-desc">The original song you were born to share</span>
                  </div>
                </div>

                <div className="archetype-mini archetype-protective">
                  <span className="archetype-icon">🛡️</span>
                  <div className="archetype-info">
                    <span className="archetype-name">Your Protective Pattern</span>
                    <span className="archetype-desc">The armor that's now blocking your gifts</span>
                  </div>
                </div>
              </div>
            </div>

            <blockquote className="dots-quote">
              <p>"You can't connect the dots looking forward; you can only connect them looking backwards."</p>
              <cite>— Steve Jobs</cite>
              <p className="dots-explanation">We help you see the connections you've been missing.</p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* How It Works Section - Gamified */}
      <section className="landing-how-it-works">
        <div className="landing-container">
          <h2 className="section-heading">How It Works</h2>
          <p className="section-subheading">
            Live your ambitions faster
          </p>

          {/* The 4 Stages Visual */}
          <div className="stages-journey">
            <div className="stage-node">
              <span className="stage-icon">🎯</span>
              <span className="stage-name">Clarity</span>
            </div>
            <div className="stage-arrow">→</div>
            <div className="stage-node">
              <span className="stage-icon">🛠️</span>
              <span className="stage-name">Build</span>
            </div>
            <div className="stage-arrow">→</div>
            <div className="stage-node">
              <span className="stage-icon">💰</span>
              <span className="stage-name">Sell</span>
            </div>
            <div className="stage-arrow">→</div>
            <div className="stage-node">
              <span className="stage-icon">📈</span>
              <span className="stage-name">Scale</span>
            </div>
          </div>

          {/* The Process Steps */}
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Take the Stage Finder</h3>
                <p className="step-description">
                  Answer a few questions about where you are on your journey.
                </p>
                <p className="step-game">
                  <span className="game-tag">Discover which stage you're actually at</span>
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Unlock Your Quests</h3>
                <p className="step-description">
                  Get placed in Clarity, Build, Sell, or Scale — each with specific missions.
                </p>
                <p className="step-game">
                  <span className="game-tag">No overwhelm — just what you need now</span>
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Build Your Streak</h3>
                <p className="step-description">
                  Complete daily quests. Earn points. Watch momentum compound.
                </p>
                <p className="step-game">
                  <span className="game-tag">Points are yours to keep forever</span>
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Level Up</h3>
                <p className="step-description">
                  Graduate to the next stage. Track your progress visually.
                </p>
                <p className="step-game">
                  <span className="game-tag">Face courage challenges → unlock growth</span>
                </p>
              </div>
            </div>
          </div>

          {/* Game Elements */}
          <div className="game-elements">
            <div className="game-element">
              <span className="element-icon">🎯</span>
              <span className="element-name">Daily Quests</span>
              <span className="element-desc">Bite-sized actions</span>
            </div>
            <div className="game-element">
              <span className="element-icon">⭐</span>
              <span className="element-name">Points</span>
              <span className="element-desc">Track progress</span>
            </div>
            <div className="game-element">
              <span className="element-icon">🔥</span>
              <span className="element-name">Streaks</span>
              <span className="element-desc">Build consistency</span>
            </div>
            <div className="game-element">
              <span className="element-icon">🐉</span>
              <span className="element-name">Courage Challenges</span>
              <span className="element-desc">Face fears</span>
            </div>
          </div>
        </div>
      </section>

      {/* First Wins Section - Outcome Focused */}
      <section className="landing-first-wins">
        <div className="landing-container">
          <h2 className="section-heading">Your First Wins</h2>
          <p className="section-subheading">
            Wherever you start, you get unstuck
          </p>

          <div className="wins-grid">
            <div className="win-card">
              <div className="win-stage">
                <span className="win-stage-icon">🎯</span>
                <span className="win-stage-name">Clarity</span>
              </div>
              <p className="win-stuck">If you're stuck on direction...</p>
              <p className="win-outcome">Know exactly what to build and who to serve</p>
            </div>

            <div className="win-card">
              <div className="win-stage">
                <span className="win-stage-icon">🛠️</span>
                <span className="win-stage-name">Build</span>
              </div>
              <p className="win-stuck">If you're stuck on your offer...</p>
              <p className="win-outcome">An offer so good people feel stupid saying no</p>
            </div>

            <div className="win-card">
              <div className="win-stage">
                <span className="win-stage-icon">💰</span>
                <span className="win-stage-name">Sell</span>
              </div>
              <p className="win-stuck">If you're stuck on sales...</p>
              <p className="win-outcome">Your first paying customer</p>
            </div>

            <div className="win-card">
              <div className="win-stage">
                <span className="win-stage-icon">📈</span>
                <span className="win-stage-name">Scale</span>
              </div>
              <p className="win-stuck">If you're stuck on growth...</p>
              <p className="win-outcome">Systems that grow without burning you out</p>
            </div>
          </div>

          <p className="wins-promise">
            <strong>Live your ambitions faster.</strong>
          </p>
        </div>
      </section>

      {/* Two Paths Section */}
      <section className="landing-paths">
        <div className="landing-container">
          <h2 className="paths-heading">Where are you on your journey?</h2>

          <div className="paths-grid">
            {/* Path 1: Self-Employment */}
            <div className="path-card path-card-build">
              <div className="path-icon">🚀</div>
              <h3 className="path-title">I want to work for myself</h3>
              <p className="path-description">
                You know you want independence. Now discover what to build,
                who to serve, and how to make it real.
              </p>
              <ul className="path-features">
                <li>Uncover your unique genius</li>
                <li>Find problems you love solving</li>
                <li>Create your first $5k offer</li>
                <li>Launch with a guided system</li>
              </ul>
              <button
                className="path-cta path-cta-primary"
                onClick={() => navigate('/get-started')}
              >
                Start Discovering →
              </button>
            </div>

            {/* Path 2: Career Clarity */}
            <div className="path-card path-card-clarity">
              <div className="path-icon">🧭</div>
              <h3 className="path-title">I'm not sure what I want</h3>
              <p className="path-description">
                Burnt out but unclear on the solution? Take 4 minutes to discover
                whether you need a new job or your own thing.
              </p>
              <ul className="path-features">
                <li>Identify your 6 core needs</li>
                <li>Discover what's actually missing</li>
                <li>Get your personalised path</li>
                <li>Clarity in 4 minutes flat</li>
              </ul>
              <button
                className="path-cta path-cta-secondary"
                onClick={() => navigate('/career-clarity')}
              >
                Take the Free Quiz →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="landing-faq">
        <div className="landing-container">
          <h2 className="section-heading">Common Questions</h2>

          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}
              >
                <button
                  className="faq-question"
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                >
                  <span>{faq.q}</span>
                  <span className="faq-toggle">{expandedFaq === index ? '−' : '+'}</span>
                </button>
                {expandedFaq === index && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why This Matters - Bronnie Ware */}
      <section className="landing-why-matters">
        <div className="landing-container">
          <div className="why-matters-content">
            <p className="why-matters-intro">
              Bronnie Ware was a palliative care nurse who spent years caring for patients
              in the last weeks of their lives.
            </p>

            <p className="why-matters-study">
              She asked them about their regrets. The patterns were so consistent,
              she wrote a book about it.
            </p>

            <blockquote className="why-matters-quote">
              <p>The #1 regret of the dying:</p>
              <p className="regret-text">
                "I wish I'd had the courage to live a life true to myself,
                not the life others expected of me."
              </p>
              <cite>— Bronnie Ware, <em>The Top Five Regrets of the Dying</em></cite>
            </blockquote>

            <p className="why-matters-belief">
              I believe finding your flow is the answer to not having this regret.
            </p>

            <p className="why-matters-close">
              Your Svadharma. Your Te. Your Ikigai. It's waiting.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-final-cta">
        <div className="landing-container">
          <h2 className="final-cta-heading">
            Ready to find yours?
          </h2>
          <p className="final-cta-subheading">
            Live a life true to yourself.
          </p>
          <div className="final-cta-buttons">
            <button
              className="hero-cta-primary"
              onClick={() => navigate('/get-started')}
            >
              Start Your Journey
            </button>
            <button
              className="hero-cta-secondary"
              onClick={() => navigate('/career-clarity')}
            >
              Take the Free Quiz
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container footer-inner">
          <p>© {new Date().getFullYear()} Find My Flow. All rights reserved.</p>
          <button
            className="footer-login"
            onClick={() => navigate('/log-in')}
          >
            Already a member? Log in
          </button>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
