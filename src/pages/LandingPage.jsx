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

      {/* How It Works Section */}
      <section className="landing-how-it-works">
        <div className="landing-container">
          <h2 className="section-heading">How It Works</h2>
          <p className="section-subheading">
            A guided journey of discovery — not another course to complete
          </p>

          <div className="creativity-callouts">
            <div className="creativity-callout blank-fills">
              <span className="creativity-icon">✍️</span>
              <p>No blank page syndrome. We ask the questions — you discover the answers.</p>
            </div>
            <div className="creativity-callout voluntary-autonomy">
              <span className="creativity-icon">🧭</span>
              <p>No rigid curriculum. Start where it makes sense for you. Your journey, your pace.</p>
            </div>
          </div>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Discover Your Value</h3>
              <p className="step-description">
                Uncover the skills you've been taking for granted. The things that come
                naturally to you but feel like magic to others.
              </p>
              <p className="step-outcome">You'll unlock: Your Skills Profile</p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Find Your Problems</h3>
              <p className="step-description">
                Identify the problems you actually enjoy solving — the ones where helping
                feels like play, not work.
              </p>
              <p className="step-outcome">You'll unlock: Your Problem Map</p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Meet Your People</h3>
              <p className="step-description">
                Discover who you're meant to serve. The people whose problems light you up
                and who value what you bring.
              </p>
              <p className="step-outcome">You'll unlock: Your Ideal Customer Profile</p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h3 className="step-title">Build Your Path</h3>
              <p className="step-description">
                Create offers, launch with confidence, and build something meaningful —
                guided every step of the way.
              </p>
              <p className="step-outcome">You'll unlock: The $100M Offer Builder</p>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones Section */}
      <section className="landing-milestones">
        <div className="landing-container">
          <h2 className="section-heading">Your First Wins</h2>
          <p className="section-subheading">
            Clear victories you'll hit along the way — not vague promises
          </p>

          <div className="milestones-timeline">
            <div className="milestone-item">
              <div className="milestone-marker">
                <span className="milestone-week">Week 1</span>
              </div>
              <div className="milestone-content">
                <h3 className="milestone-title">Clarity on your unique skills</h3>
                <p className="milestone-desc">Finally see what makes you valuable</p>
              </div>
            </div>

            <div className="milestone-item">
              <div className="milestone-marker">
                <span className="milestone-week">Week 2</span>
              </div>
              <div className="milestone-content">
                <h3 className="milestone-title">Your first validation conversation</h3>
                <p className="milestone-desc">Real feedback from real people</p>
              </div>
            </div>

            <div className="milestone-item">
              <div className="milestone-marker">
                <span className="milestone-week">Week 4</span>
              </div>
              <div className="milestone-content">
                <h3 className="milestone-title">Your $100M Offer drafted</h3>
                <p className="milestone-desc">An offer so good people feel stupid saying no</p>
              </div>
            </div>

            <div className="milestone-item milestone-featured">
              <div className="milestone-marker">
                <span className="milestone-week">Week 6+</span>
              </div>
              <div className="milestone-content">
                <h3 className="milestone-title">Your first paying customer</h3>
                <p className="milestone-desc">Proof that your skills have market value</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Archetypes Preview Section */}
      <section className="landing-archetypes">
        <div className="landing-container">
          <h2 className="section-heading">Discover Your Inner Voices</h2>
          <p className="section-subheading">
            Uncover the forces that drive you — and the patterns that hold you back
          </p>

          <div className="archetypes-grid">
            <div className="archetype-card archetype-essence">
              <div className="archetype-icon">✨</div>
              <h3 className="archetype-title">Your Essence Voice</h3>
              <p className="archetype-description">
                The original song you were born to share. The version of you that feels most alive,
                most authentic, most magnetic. When you show up from this place, impact feels effortless.
              </p>
              <div className="archetype-examples">
                <span className="archetype-tag">The Visionary</span>
                <span className="archetype-tag">The Healer</span>
                <span className="archetype-tag">The Creator</span>
                <span className="archetype-tag">The Guide</span>
                <span className="archetype-tag">+4 more</span>
              </div>
            </div>

            <div className="archetype-card archetype-protective">
              <div className="archetype-icon">🛡️</div>
              <h3 className="archetype-title">Your Protective Pattern</h3>
              <p className="archetype-description">
                The armor you developed to stay safe from failure, rejection, or judgement.
                It served you once — but now it's blocking your gifts from reaching the world.
              </p>
              <div className="archetype-examples">
                <span className="archetype-tag">The Perfectionist</span>
                <span className="archetype-tag">The People Pleaser</span>
                <span className="archetype-tag">The Controller</span>
                <span className="archetype-tag">The Ghost</span>
                <span className="archetype-tag">+1 more</span>
              </div>
            </div>
          </div>

          <p className="archetypes-note">
            Understanding these patterns is the first step to moving past them.
          </p>
        </div>
      </section>

      {/* Zarlo AI Section */}
      <section className="landing-zarlo">
        <div className="landing-container">
          <div className="zarlo-content">
            <div className="zarlo-text">
              <div className="zarlo-badge">AI-Powered</div>
              <h2 className="zarlo-heading">Meet Zarlo, Your AI Co-Founder</h2>
              <p className="zarlo-description">
                Stuck on a decision? Need help refining your offer? Want feedback on your pitch?
                Zarlo is available on every page — a context-aware AI assistant that knows your
                journey and can help you move forward.
              </p>
              <ul className="zarlo-features">
                <li>
                  <span className="zarlo-feature-icon">💬</span>
                  <span>Real-time guidance tailored to your stage</span>
                </li>
                <li>
                  <span className="zarlo-feature-icon">🧠</span>
                  <span>Remembers your skills, problems, and persona</span>
                </li>
                <li>
                  <span className="zarlo-feature-icon">⚡</span>
                  <span>Instant feedback on offers, copy, and strategy</span>
                </li>
                <li>
                  <span className="zarlo-feature-icon">🎯</span>
                  <span>Helps you stay focused when you feel lost</span>
                </li>
              </ul>
              <p className="instant-feedback-callout">
                Every answer you give, Zarlo responds in real-time. Watch your offers take shape as you think out loud.
              </p>
              <p className="alfred-effect-callout">
                The more you use it, the smarter it gets. Zarlo learns your voice, your goals, and your patterns.
              </p>
              <p className="oracle-effect-callout">
                Zarlo doesn't just answer questions — it spots patterns you haven't noticed yet.
              </p>
            </div>
            <div className="zarlo-preview">
              <div className="zarlo-chat-mockup">
                <div className="zarlo-chat-header">
                  <span className="zarlo-avatar">🤖</span>
                  <span className="zarlo-name">Zarlo</span>
                </div>
                <div className="zarlo-chat-messages">
                  <div className="zarlo-message zarlo-message-ai">
                    Hey! I see you're working on your attraction offer. Want me to help you
                    refine the value proposition?
                  </div>
                  <div className="zarlo-message zarlo-message-user">
                    Yes! I'm struggling to articulate why someone should choose me.
                  </div>
                  <div className="zarlo-message zarlo-message-ai">
                    Based on your skills in [strategic thinking] and the problems you love solving
                    around [clarity], here's a angle that might resonate...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Day Challenge Section */}
      <section className="landing-challenge">
        <div className="landing-container">
          <h2 className="section-heading">Gamified Progress</h2>
          <p className="section-subheading">
            The 7-Day Challenge turns building your business into an adventure
          </p>

          <div className="challenge-content">
            <div className="challenge-features">
              <div className="challenge-feature">
                <span className="challenge-feature-icon">🎯</span>
                <h3>Daily Quests</h3>
                <p>Bite-sized actions that move you forward. Earn points that are yours to keep — watch your total grow.</p>
              </div>
              <div className="challenge-feature">
                <span className="challenge-feature-icon">🔥</span>
                <h3>Streak Tracking</h3>
                <p>Build consistency with daily streaks. The longer your streak, the more you unlock.</p>
              </div>
              <div className="challenge-feature">
                <span className="challenge-feature-icon">🏆</span>
                <h3>Leaderboards</h3>
                <p>See how you stack up against others on the same journey. Friendly competition drives action.</p>
              </div>
              <div className="challenge-feature">
                <span className="challenge-feature-icon">🎖️</span>
                <h3>Stage Progression</h3>
                <p>Move through 6 stages from validation to launch. Each stage unlocks new quests and tools.</p>
              </div>
            </div>

            <div className="boss-fights-callout">
              <span className="boss-fights-icon">🐉</span>
              <div className="boss-fights-content">
                <h3>Courage Challenges</h3>
                <p>
                  Along the way, you'll face visibility fears that once held you back.
                  Each one you conquer unlocks more of who you really are.
                </p>
              </div>
            </div>

            <div className="monitoring-callout">
              <span className="monitoring-icon">📊</span>
              <div className="monitoring-content">
                <h3>Your Command Center</h3>
                <p>
                  Everything at a glance: points earned, stages completed, offers built, revenue tracked.
                  Your progress, visualized.
                </p>
              </div>
            </div>

            <div className="challenge-preview">
              <div className="challenge-quest-card">
                <div className="quest-header">
                  <span className="quest-category">Flow Finder</span>
                  <span className="quest-points">+50 pts</span>
                </div>
                <h4 className="quest-title">Complete the Skills Discovery</h4>
                <p className="quest-description">Identify 3 skills that come naturally to you</p>
                <div className="quest-progress">
                  <div className="quest-progress-bar" style={{ width: '66%' }}></div>
                </div>
                <span className="quest-status">2 of 3 complete</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Preview Section */}
      <section className="landing-tools">
        <div className="landing-container">
          <h2 className="section-heading">Powerful Tools at Your Fingertips</h2>
          <p className="section-subheading">
            From idea to revenue — everything you need in one place
          </p>

          <div className="unlock-roadmap">
            <div className="unlock-item">
              <span className="unlock-stage">Stage 1</span>
              <span className="unlock-name">Flow Finder</span>
            </div>
            <span className="unlock-arrow">→</span>
            <div className="unlock-item">
              <span className="unlock-stage">Stage 2</span>
              <span className="unlock-name">Offer Builder</span>
            </div>
            <span className="unlock-arrow">→</span>
            <div className="unlock-item">
              <span className="unlock-stage">Stage 4</span>
              <span className="unlock-name">Funnel Calculator</span>
            </div>
            <span className="unlock-arrow">→</span>
            <div className="unlock-item unlock-item-featured">
              <span className="unlock-stage">Stage 6</span>
              <span className="unlock-name">CRM Command Center</span>
            </div>
          </div>

          <p className="build-from-scratch">
            Build <strong>your</strong> offer. Create <strong>your</strong> funnel. Launch <strong>your</strong> business.
          </p>

          <div className="tools-grid">
            <div className="tool-card">
              <div className="tool-icon">💰</div>
              <h3 className="tool-title">$100M Offer Builder</h3>
              <p className="tool-description">
                Create irresistible offers using Alex Hormozi's proven framework.
                Define your value equation, stack bonuses, and price with confidence.
              </p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">📊</div>
              <h3 className="tool-title">Funnel Calculator</h3>
              <p className="tool-description">
                Track your entire funnel from awareness to revenue. See exactly where
                to focus to hit your income goals.
              </p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🧲</div>
              <h3 className="tool-title">Lead Magnet Builder</h3>
              <p className="tool-description">
                Create lead magnets that attract your ideal customers. Choose from
                proven formats and customize for your niche.
              </p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">✅</div>
              <h3 className="tool-title">Validation Surveys</h3>
              <p className="tool-description">
                Test your ideas with real people before you build. Create shareable
                surveys and gather actionable feedback.
              </p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">🧭</div>
              <h3 className="tool-title">Flow Compass</h3>
              <p className="tool-description">
                Track your energy daily using the N/E/S/W system. Understand when
                you're in flow and when you need to pivot.
              </p>
            </div>
            <div className="tool-card">
              <div className="tool-icon">📚</div>
              <h3 className="tool-title">Library of Answers</h3>
              <p className="tool-description">
                A growing collection that's uniquely yours. Every skill discovered, every problem
                identified, every insight captured — organized and always accessible.
              </p>
            </div>
          </div>

          <div className="tools-footer-callouts">
            <div className="tools-callout evergreen-callout">
              <span className="tools-callout-icon">♾️</span>
              <p>These aren't one-time exercises. Refine your offers, track new funnels, revisit your flow — the tools grow with you.</p>
            </div>
            <div className="tools-callout realtime-callout">
              <span className="tools-callout-icon">⚡</span>
              <p>Drag, adjust, iterate. See your business model shift in real-time as you make changes.</p>
            </div>
          </div>
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

      {/* Social Proof */}
      <section className="landing-social-proof">
        <div className="landing-container">
          <div className="proof-stats">
            <div className="proof-stat">
              <span className="proof-number">2,400+</span>
              <span className="proof-label">Professionals finding their flow</span>
            </div>
            <div className="proof-stat">
              <span className="proof-number">4 min</span>
              <span className="proof-label">To career clarity</span>
            </div>
            <div className="proof-stat">
              <span className="proof-number">6</span>
              <span className="proof-label">Core needs we help you meet</span>
            </div>
          </div>

          <p className="conformity-anchor">
            This week, 847 professionals completed their first Flow Finder quest. Most start with Skills Discovery.
          </p>

          <p className="humanity-hero">
            Every person who finds their flow is one less person stuck in work that drains them.
            You're not just changing your life — you're part of a quiet revolution.
          </p>

          <p className="last-mile-drive">
            You're closer than you think. Most members see clarity within their first week.
          </p>

          <p className="community-callout">
            You're not alone — connect with others on the same journey.
          </p>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="landing-comparison">
        <div className="landing-container">
          <h2 className="section-heading">How We're Different</h2>
          <p className="section-subheading">
            Find My Flow vs other approaches to career change
          </p>

          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-cell comparison-label"></div>
              <div className="comparison-cell comparison-us">Find My Flow</div>
              <div className="comparison-cell">Career Coach</div>
              <div className="comparison-cell">Online Course</div>
              <div className="comparison-cell">Figure It Out</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell comparison-label">Personalised to you</div>
              <div className="comparison-cell comparison-us">✓</div>
              <div className="comparison-cell">✓</div>
              <div className="comparison-cell">✗</div>
              <div className="comparison-cell">✓</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell comparison-label">Guided discovery process</div>
              <div className="comparison-cell comparison-us">✓</div>
              <div className="comparison-cell">~</div>
              <div className="comparison-cell">✗</div>
              <div className="comparison-cell">✗</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell comparison-label">AI support 24/7</div>
              <div className="comparison-cell comparison-us">✓</div>
              <div className="comparison-cell">✗</div>
              <div className="comparison-cell">✗</div>
              <div className="comparison-cell">✗</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell comparison-label">Gamified progress</div>
              <div className="comparison-cell comparison-us">✓</div>
              <div className="comparison-cell">✗</div>
              <div className="comparison-cell">~</div>
              <div className="comparison-cell">✗</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell comparison-label">Business tools included</div>
              <div className="comparison-cell comparison-us">✓</div>
              <div className="comparison-cell">✗</div>
              <div className="comparison-cell">~</div>
              <div className="comparison-cell">✗</div>
            </div>

            <div className="comparison-row">
              <div className="comparison-cell comparison-label">Community support</div>
              <div className="comparison-cell comparison-us">✓</div>
              <div className="comparison-cell">~</div>
              <div className="comparison-cell">~</div>
              <div className="comparison-cell">✗</div>
            </div>

            <div className="comparison-row comparison-price">
              <div className="comparison-cell comparison-label">Typical cost</div>
              <div className="comparison-cell comparison-us">Free to start</div>
              <div className="comparison-cell">$2-10k</div>
              <div className="comparison-cell">$500-2k</div>
              <div className="comparison-cell">Free*</div>
            </div>
          </div>

          <p className="comparison-note">
            * "Free" to figure it out yourself — but months or years of confusion has its own cost.
          </p>
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

      {/* Final CTA */}
      <section className="landing-final-cta">
        <div className="landing-container">
          <h2 className="final-cta-heading">
            Ready to discover what you're capable of?
          </h2>
          <p className="final-cta-subheading">
            Stop grinding. Start discovering. Find your flow.
          </p>
          <p className="co-creator">
            We're still early. Join now and help shape what career development should look like.
          </p>
          <p className="founding-member">
            Early access pricing while we're in beta. Join the founding members before rates increase.
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
