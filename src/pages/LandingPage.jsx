import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

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
            The anti-university for your career reinvention
          </span>

          <h1 className="landing-headline">
            Turn What You Know Into{' '}
            <span className="gold-text">Work That Lights You Up</span>
          </h1>

          <p className="landing-tagline">
            A process to monetise your mission to obtain financial + location independence
          </p>

          <p className="landing-subheadline">
            For burnt-out professionals ready to escape the grind and do meaningful work.
            Whether you want to build your own thing or find an impactful career —
            we'll help you discover the path that's right for you.
          </p>

          <p className="rightful-heritage">
            You've already done the hard part — years of experience, skills you've built, problems you've solved.
            Now it's time to turn that into something that's yours.
          </p>

          <p className="landing-philosophy">
            Learning that feels like play, not homework.
          </p>

          <p className="hero-win-state">
            Your first milestone: Get paid for what you already know how to do.
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
          <p className="hero-protection">Your progress is always saved. Pick up exactly where you left off.</p>
        </div>
      </section>

      {/* Is This You? Section - North Star Person */}
      <section className="landing-is-this-you">
        <div className="landing-container">
          <h2 className="is-this-you-heading">Is This You?</h2>
          <p className="north-star-person">
            Someone who senses there's a more alive version of themselves —
            but the path there feels either <span className="gold-text">too scary</span> or <span className="gold-text">too boring</span>.
          </p>
          <p className="north-star-subtext">
            You're not broken. You're not lazy. You're just caught between
            the fear of being seen and the exhaustion of staying invisible.
          </p>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="landing-manifesto">
        <div className="landing-container">
          <h2 className="manifesto-heading">
            School taught you learning was a chore.
            <span className="gold-text"> We're here to undo that.</span>
          </h2>

          <div className="manifesto-content">
            <p>
              Sit down. Shut up. Memorise this. Get graded. Repeat for 15+ years.
            </p>
            <p>
              No wonder you associate growth with grinding. No wonder "career development"
              sounds like another item on your endless to-do list.
            </p>
            <p>
              But here's what they never told you: <strong>learning is supposed to feel good.</strong>
              Discovery is energising. Progress is addictive — when you're chasing something
              that actually matters to you.
            </p>
            <p>
              Find My Flow isn't another curriculum designed by someone who doesn't know you.
              It's a guided discovery process that helps you uncover what's already there —
              your skills, your purpose, your path.
            </p>
            <p className="manifesto-highlight">
              This is education the way it should have been all along.
            </p>
            <p className="manifesto-elitism">
              This isn't for people who want another course or another coach.
              It's for the ones who've realized the system wasn't built for them.
            </p>
          </div>
        </div>
      </section>

      {/* The Matrix Exchange Section */}
      <section className="landing-matrix-exchange">
        <div className="landing-container">
          <h2 className="matrix-exchange-heading">
            The "matrix" isn't a conspiracy.
            <br />
            It's just an optimization that forgot about you.
          </h2>

          <div className="exchange-card">
            <div className="exchange-section exchange-give">
              <h3 className="exchange-label">You give</h3>
              <p className="exchange-text">
                Time. Energy. Your most productive hours. Often doing work that drains rather than energizes.
              </p>
            </div>

            <div className="exchange-divider">
              <span className="exchange-arrow">&#8596;</span>
            </div>

            <div className="exchange-section exchange-receive">
              <h3 className="exchange-label">You receive</h3>
              <p className="exchange-text">
                A salary. Enough to cover basic needs. A sense of "safety" — as long as you don't stop.
              </p>
            </div>
          </div>

          <p className="matrix-exchange-tagline">
            The leverage point isn't quitting. It's building an alternate source of safety.
          </p>
        </div>
      </section>

      {/* Problems We Understand Section */}
      <section className="landing-problems-we-understand">
        <div className="landing-container">
          <h2 className="section-heading">Problems We Understand Because We Lived Them Too</h2>
          <p className="section-subheading">
            These aren't just challenges — they're the invisible weight you carry every day
          </p>

          <div className="problems-grid">
            <div className="problem-card">
              <div className="problem-icon">💔</div>
              <h3>Healing Feels Heavy</h3>
              <p>Growth work that feels like homework — serious, slow, and joyless.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">😶</div>
              <h3>Hiding Your Real Self</h3>
              <p>Fear of being truly seen keeps you playing small and staying quiet.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🔥</div>
              <h3>Chronic Burnout</h3>
              <p>Trapped in a "matrix" of joyless work that slowly drains your soul.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🤷</div>
              <h3>Lack of Self-Knowledge</h3>
              <p>No clarity on what you actually want — or how to get there.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">🚫</div>
              <h3>Can't Monetise Gifts</h3>
              <p>You have skills and passion, but no system to turn them into income.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">😰</div>
              <h3>Visibility Paralysis</h3>
              <p>Fear of judgement keeps you invisible — even when you're ready to share.</p>
            </div>
          </div>

          <p className="problems-north-star">
            The North Star Problem: <strong>Healing feels heavy. Self-discovery feels boring.</strong>
            <br />
            What if it could feel like play instead?
          </p>
        </div>
      </section>

      {/* Channel Explosion Section */}
      <section className="landing-channel-explosion">
        <div className="landing-container">
          <h2 className="channel-heading">We're living through a channel explosion</h2>
          <div className="channel-subheading">
            <p>30 years ago: 2 TV channels. Today: thousands.</p>
            <p>The same thing is about to happen to software — and the economy.</p>
          </div>

          <div className="economy-cards">
            <div className="economy-card economy-card-old">
              <h3 className="economy-title">The Old Economy</h3>
              <p className="economy-date">1995 — 2020</p>
              <p className="economy-number">2-5</p>
              <p className="economy-text">
                Providers of everything. Massive horizontal tools serving millions with 60% fit.
                High barriers to entry. You needed capital or years of skill-building to compete.
              </p>
            </div>

            <div className="economy-card economy-card-new">
              <h3 className="economy-title">The Emerging Economy</h3>
              <p className="economy-date">2024 →</p>
              <p className="economy-number">1000s</p>
              <p className="economy-text">
                Vertical, niche products. Built by people who deeply understand specific problems.
                Serving thousands with 95% fit. AI collapsed the build-cost barrier. Anyone with insight can ship.
              </p>
            </div>
          </div>

          <p className="beginners-luck">
            You're catching this at exactly the right moment — before everyone else realizes the game has changed.
          </p>
        </div>
      </section>

      {/* Portfolio Career Section */}
      <section className="landing-portfolio-career">
        <div className="landing-container">
          <div className="portfolio-top">
            <h2 className="portfolio-heading">The Portfolio Career</h2>
            <p className="portfolio-description">
              The future isn't "job vs. entrepreneur." It's assembling your unique configuration of
              income streams that create safety while honoring your flow.
            </p>

            <div className="portfolio-pills">
              <span className="portfolio-pill"><span className="pill-dot"></span>Consulting</span>
              <span className="portfolio-pill"><span className="pill-dot"></span>Micro-SaaS</span>
              <span className="portfolio-pill"><span className="pill-dot"></span>Digital Products</span>
              <span className="portfolio-pill"><span className="pill-dot"></span>Coaching</span>
              <span className="portfolio-pill"><span className="pill-dot"></span>Content</span>
              <span className="portfolio-pill"><span className="pill-dot"></span>Part-time Role</span>
            </div>
          </div>

          <div className="portfolio-formula">
            <div className="formula-equation">
              <span className="formula-term">Your natural interests</span>
              <span className="formula-operator">+</span>
              <span className="formula-term">energy patterns</span>
              <span className="formula-operator">+</span>
              <span className="formula-term">creative expression</span>
            </div>
            <span className="formula-equals">=</span>
            <p className="formula-result">A business model that feels like play</p>
          </div>
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
        </div>
      </section>

      {/* Six Pillars of Fulfillment Section */}
      <section className="landing-six-pillars">
        <div className="landing-container">
          <h2 className="section-heading">The Six Pillars of Fulfillment</h2>
          <p className="section-subheading">
            Every human is driven by six core needs. FindMyFlow is designed to meet all of them.
          </p>

          <div className="pillars-container">
            <div className="pillars-group pillars-personality">
              <h3 className="pillars-group-label">Needs of the Personality</h3>
              <div className="pillars-grid">
                <div className="pillar-card">
                  <div className="pillar-icon">🏠</div>
                  <h4 className="pillar-name">Certainty</h4>
                  <p className="pillar-need">Security, stability, predictability</p>
                  <div className="pillar-how">
                    <span className="pillar-how-label">How we deliver:</span>
                    <p>Progress always saved. Clear 6-stage system. Guided discovery — no blank page syndrome. Milestones you can see coming.</p>
                  </div>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon">🎲</div>
                  <h4 className="pillar-name">Variety</h4>
                  <p className="pillar-need">Change, stimulation, challenge</p>
                  <div className="pillar-how">
                    <span className="pillar-how-label">How we deliver:</span>
                    <p>Daily quests. Courage Challenges. Fantasy team battles. Different quest types. Unpredictable AI insights from Zarlo.</p>
                  </div>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon">👑</div>
                  <h4 className="pillar-name">Significance</h4>
                  <p className="pillar-need">Feel unique, important, special</p>
                  <div className="pillar-how">
                    <span className="pillar-how-label">How we deliver:</span>
                    <p>"An offer only YOU can make." Your unique combination. Personalized archetypes. Specific Knowledge no one can compete with.</p>
                  </div>
                </div>

                <div className="pillar-card">
                  <div className="pillar-icon">💜</div>
                  <h4 className="pillar-name">Connection</h4>
                  <p className="pillar-need">Closeness and belonging</p>
                  <div className="pillar-how">
                    <span className="pillar-how-label">How we deliver:</span>
                    <p>Community features. Team battles. Weekly live sessions. Zarlo as your AI co-founder. Mentorship from those ahead of you.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pillars-group pillars-spirit">
              <h3 className="pillars-group-label">Needs of the Spirit</h3>
              <p className="pillars-spirit-note">Where lasting fulfillment lives</p>
              <div className="pillars-grid pillars-grid-spirit">
                <div className="pillar-card pillar-card-spirit">
                  <div className="pillar-icon">🌱</div>
                  <h4 className="pillar-name">Growth</h4>
                  <p className="pillar-need">Expand, develop, improve</p>
                  <div className="pillar-how">
                    <span className="pillar-how-label">How we deliver:</span>
                    <p>Stage progression that unlocks new capabilities. Flow Finder discovery. Nervous System calibration. Courage challenges that expand who you are. Points and leveling that make growth visible.</p>
                  </div>
                </div>

                <div className="pillar-card pillar-card-spirit">
                  <div className="pillar-icon">🌍</div>
                  <h4 className="pillar-name">Contribution</h4>
                  <p className="pillar-need">Give beyond ourselves</p>
                  <div className="pillar-how">
                    <span className="pillar-how-label">How we deliver:</span>
                    <p>Monetise your mission — not just making money, but serving others. Every person who finds their flow is one less person stuck. You're building something that helps people escape the matrix.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="pillars-kicker">
            Most platforms optimize for one or two needs. We designed for all six.
          </p>
        </div>
      </section>

      {/* Moonshot Section */}
      <section className="landing-moonshot">
        <div className="landing-container">
          <div className="moonshot-label">The Moonshot</div>
          <h2 className="moonshot-heading">
            A recognised alternative to the traditional career path
          </h2>

          <div className="moonshot-content">
            <div className="moonshot-vision">
              <p className="moonshot-vision-text">
                What if there was a path as credible as university — but designed for people
                who learn by doing, not by sitting in lectures? A place that helps you discover
                your unique contribution to the world, not just credentials for someone else's checklist.
              </p>
            </div>

            <div className="moonshot-why">
              <h3 className="moonshot-why-label">Why this matters to me</h3>
              <blockquote className="moonshot-quote">
                <p>
                  I walked the traditional path. Did everything "right." Got the grades, the degree,
                  the job. And I felt completely lost and unfulfilled.
                </p>
                <p>
                  It took years to unlearn what I was told success looked like — and even longer
                  to discover what actually lights me up.
                </p>
                <p className="moonshot-quote-emphasis">
                  I don't want anyone else to waste those years feeling like something's wrong with them,
                  when the truth is: the system just wasn't built for how they think.
                </p>
              </blockquote>
            </div>

            <div className="moonshot-mission">
              <p>
                <strong>Find My Flow</strong> is my contribution to building that alternative.
                Not a shortcut — a different path entirely. One that honours who you actually are.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ladder vs River Section */}
      <section className="landing-ladder-river">
        <div className="landing-container">
          <h2 className="section-heading">Two Ways to Build a Life</h2>

          <div className="path-comparison">
            {/* The Ladder */}
            <div className="path-option path-ladder">
              <div className="path-visual">
                <div className="ladder">
                  <div className="ladder-rung rung-top">
                    <span className="rung-label">???</span>
                    <span className="rung-question">"Is this it?"</span>
                  </div>
                  <div className="ladder-rail"></div>
                  <div className="ladder-rung">
                    <span className="rung-label">Corner Office</span>
                  </div>
                  <div className="ladder-rail"></div>
                  <div className="ladder-rung">
                    <span className="rung-label">Promotion</span>
                  </div>
                  <div className="ladder-rail"></div>
                  <div className="ladder-rung">
                    <span className="rung-label">The "Right" Job</span>
                  </div>
                  <div className="ladder-rail"></div>
                  <div className="ladder-rung">
                    <span className="rung-label">Degree</span>
                  </div>
                  <div className="ladder-rail"></div>
                  <div className="ladder-rung rung-bottom">
                    <span className="rung-label">Good Grades</span>
                    <span className="rung-you">You start here</span>
                  </div>
                </div>
              </div>

              <div className="path-details">
                <h3 className="path-title">The Ladder</h3>
                <p className="path-orientation"><span className="path-label">Orientation:</span> Future</p>
                <p className="path-description">"I'll be happy when I reach the next rung."</p>
                <ul className="path-traits">
                  <li>Exterior motivations (status, approval, salary)</li>
                  <li>Someone else defined the rungs</li>
                  <li>Fulfillment is always <em>above</em> you</li>
                  <li>Reach the top → "Now what?"</li>
                </ul>
              </div>
            </div>

            {/* The River */}
            <div className="path-option path-river">
              <div className="path-visual">
                <div className="river">
                  <div className="river-source">
                    <span className="source-label">You</span>
                    <span className="source-sub">your essence</span>
                  </div>
                  <div className="river-flow">
                    <div className="tributary tributary-top">
                      <span>skills</span>
                    </div>
                    <div className="river-main">
                      <div className="flow-wave"></div>
                      <div className="flow-wave"></div>
                      <div className="flow-wave"></div>
                    </div>
                    <div className="tributary tributary-bottom">
                      <span>experiences</span>
                    </div>
                  </div>
                  <div className="river-ocean">
                    <span className="ocean-label">Impact</span>
                    <span className="ocean-sub">contribution</span>
                  </div>
                </div>
              </div>

              <div className="path-details">
                <h3 className="path-title">The River</h3>
                <p className="path-orientation"><span className="path-label">Orientation:</span> Present</p>
                <p className="path-description">"What's alive in me right now?"</p>
                <ul className="path-traits">
                  <li>Interior motivations (curiosity, meaning, energy)</li>
                  <li>Your unique path carves itself</li>
                  <li>Fulfillment is built into the flow</li>
                  <li>Impact ripples outward naturally</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="path-kicker">
            <p>The ladder asks: <em>"What will get me there?"</em></p>
            <p>The river asks: <em>"What's already here?"</em></p>
          </div>
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

              <div className="founder-ear">
                <p>
                  I believe the universe communicates with us every day about what this path is.
                  The problem? It can't talk directly — so it uses what I call <strong>'Ease and Resistance'</strong>.
                </p>
                <p className="ear-acronym">
                  As an acronym, that spells <span className="ear-highlight">E.A.R.</span> — coincidence? 🤔
                </p>
                <p className="destiny-child">
                  If you're here, it's not by accident. The universe has a funny way of pointing you toward what you need.
                </p>
              </div>

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

              <div className="founder-intersection">
                <p className="intersection-statement">
                  I help people who feel stuck escape the "matrix" of joyless work and heavy healing —
                  by building <strong>playful diagnostic tools</strong> and <strong>gamified transformation systems</strong> grounded in real therapeutic science.
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

      {/* Flow Finder Framework Section */}
      <section className="landing-nikigai">
        <div className="landing-container">
          <h2 className="section-heading">The Flow Finder Framework</h2>
          <p className="section-subheading">
            Inspired by Ikigai — redesigned for building a business around your strengths
          </p>

          <div className="nikigai-content">
            <div className="nikigai-diagram">
              <div className="nikigai-circle nikigai-skills">
                <span className="nikigai-label">Your Skills</span>
                <span className="nikigai-desc">What comes naturally</span>
              </div>
              <div className="nikigai-circle nikigai-problems">
                <span className="nikigai-label">Problems You Solve</span>
                <span className="nikigai-desc">What energises you</span>
              </div>
              <div className="nikigai-circle nikigai-people">
                <span className="nikigai-label">Your People</span>
                <span className="nikigai-desc">Who you're meant to serve</span>
              </div>
              <div className="nikigai-circle nikigai-payment">
                <span className="nikigai-label">Market Need</span>
                <span className="nikigai-desc">What people pay for</span>
              </div>
              <div className="nikigai-center">
                <span className="nikigai-flow">FLOW</span>
              </div>
            </div>

            <div className="nikigai-explanation">
              <p>
                Traditional Ikigai asks: <em>"What do you love? What are you good at? What can you be paid for? What does the world need?"</em>
              </p>
              <p>
                <strong>The Flow Finder goes deeper.</strong> It's not just about finding the intersection — it's about
                discovering the unique combination that only you can offer, based on your specific
                skills, experiences, and the problems that light you up.
              </p>
              <p>
                When these four elements align, work stops feeling like work. That's flow.
              </p>
            </div>

            <div className="chain-combo">
              <span className="combo-element">Your Skills</span>
              <span className="combo-operator">×</span>
              <span className="combo-element">Your Problems</span>
              <span className="combo-operator">×</span>
              <span className="combo-element">Your People</span>
              <span className="combo-equals">=</span>
              <span className="combo-result">An offer only you can make</span>
            </div>

            <div className="unique-combination">
              <h3 className="unique-combo-label">Your Unique Combination</h3>
              <div className="unique-combo-formula">
                <div className="combo-layer">
                  <span className="combo-layer-icon">🎯</span>
                  <span className="combo-layer-text">Skills you've spent years developing</span>
                </div>
                <span className="combo-connector">+</span>
                <div className="combo-layer">
                  <span className="combo-layer-icon">💡</span>
                  <span className="combo-layer-text">Problems that actually light you up</span>
                </div>
                <span className="combo-connector">+</span>
                <div className="combo-layer">
                  <span className="combo-layer-icon">👥</span>
                  <span className="combo-layer-text">People you genuinely want to help</span>
                </div>
                <span className="combo-equals">=</span>
                <div className="combo-result-box">
                  <span className="combo-result-label">Specific Knowledge</span>
                  <span className="combo-result-desc">The thing no one else can compete with</span>
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
        </div>
      </section>

      {/* Community Section */}
      <section className="landing-community">
        <div className="landing-container">
          <h2 className="section-heading">You're Not Doing This Alone</h2>
          <p className="section-subheading">
            Join a community of professionals on the same journey
          </p>

          <div className="community-features">
            <div className="community-feature">
              <div className="community-icon">⚔️</div>
              <h3>Fantasy Team Battles</h3>
              <p>Join a team and compete against others across categories. Your team's combined points battle for weekly glory.</p>
            </div>
            <div className="community-feature">
              <div className="community-icon">🧙</div>
              <h3>Learn From Launchers</h3>
              <p>Connect with members who've already shipped. Get advice from people just a few steps ahead of you.</p>
            </div>
            <div className="community-feature">
              <div className="community-icon">📣</div>
              <h3>Share Your Wins</h3>
              <p>Hit a milestone? Share it. Your wins inspire others — and celebrating publicly cements your progress.</p>
            </div>
            <div className="community-feature">
              <div className="community-icon">🎁</div>
              <h3>Bring Friends, Earn Together</h3>
              <p>Invite a friend and you both earn bonus points. Success is better shared.</p>
            </div>
            <div className="community-feature">
              <div className="community-icon">☕</div>
              <h3>Weekly Live Sessions</h3>
              <p>Drop in every week to share wins, ask questions, and get unstuck together. Real people, real support.</p>
            </div>
            <div className="community-feature">
              <div className="community-icon">🎉</div>
              <h3>Milestone Celebrations</h3>
              <p>Every stage completion, every first sale, every breakthrough — we celebrate with you.</p>
            </div>
          </div>

          <p className="credentials-callout">
            Complete stages to earn recognition. Your progress is tracked, celebrated, and shareable.
          </p>
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

      {/* Email Capture / Lead Magnet Section */}
      <section className="landing-lead-magnet">
        <div className="landing-container">
          <div className="lead-magnet-content">
            <div className="lead-magnet-icon">📬</div>
            <h2 className="lead-magnet-heading">Not ready to dive in yet?</h2>
            <p className="lead-magnet-description">
              Get the <strong>Flow Finder Starter Kit</strong> free — the same exercises our paying members start with.
              Three guided prompts to start discovering your unique path, plus weekly insights on building a business around your strengths.
            </p>

            {!leadSubmitted ? (
              <form
                className="lead-magnet-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!leadEmail || leadLoading) return;
                  setLeadLoading(true);
                  // Simple submission - in production, connect to your email service
                  try {
                    // Placeholder for email capture
                    await new Promise(resolve => setTimeout(resolve, 500));
                    setLeadSubmitted(true);
                  } catch (err) {
                    console.error('Email capture error:', err);
                  }
                  setLeadLoading(false);
                }}
              >
                <input
                  type="email"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="lead-magnet-input"
                  required
                />
                <button
                  type="submit"
                  className="lead-magnet-button"
                  disabled={leadLoading}
                >
                  {leadLoading ? 'Sending...' : 'Send Me the Kit'}
                </button>
              </form>
            ) : (
              <div className="lead-magnet-success">
                <span className="success-icon">✓</span>
                <p>Check your inbox! The Starter Kit is on its way.</p>
              </div>
            )}

            <p className="lead-magnet-note">No spam, ever. Unsubscribe anytime.</p>
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
