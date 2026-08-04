import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WaitlistModal from '../components/WaitlistModal';
import './OldLandingPage.css';

const PillarDiagram = ({ title, xLabel, yLabel, lineName, topZone, topSub, bottomZone, bottomSub, gradientId }) => (
  <div className="pillar-diagram-card">
    <h4 className="pillar-diagram-title">{title}</h4>
    <svg viewBox="0 0 300 280" className="pillar-diagram-svg">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5e17eb" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#E9A23B" stopOpacity="1" />
        </linearGradient>
      </defs>
      {/* Axes */}
      <line x1="50" y1="30" x2="50" y2="240" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      <line x1="50" y1="240" x2="270" y2="240" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
      {/* Arrow heads */}
      <polygon points="46,36 50,26 54,36" fill="rgba(255,255,255,0.4)" />
      <polygon points="264,236 274,240 264,244" fill="rgba(255,255,255,0.4)" />
      {/* Diagonal gold line */}
      <line x1="55" y1="235" x2="265" y2="35" stroke={`url(#${gradientId})`} strokeWidth="3.5" strokeLinecap="round" />
      {/* Zone labels - top left */}
      <text x="60" y="70" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="600">{topZone}</text>
      <text x="60" y="86" fill="rgba(255,255,255,0.45)" fontSize="9" fontStyle="italic">{topSub}</text>
      {/* Zone labels - bottom right */}
      <text x="155" y="220" fill="rgba(255,255,255,0.7)" fontSize="11" fontWeight="600">{bottomZone}</text>
      <text x="155" y="236" fill="rgba(255,255,255,0.45)" fontSize="9" fontStyle="italic">{bottomSub}</text>
      {/* Diagonal label */}
      <text
        x="160" y="135"
        fill="white" fontSize="12" fontWeight="700"
        transform="rotate(-42, 160, 135)"
        style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
      >{lineName}</text>
      {/* Axis labels */}
      <text x="160" y="268" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="600" textAnchor="middle">{xLabel}</text>
      <text x="18" y="140" fill="rgba(255,255,255,0.8)" fontSize="11" fontWeight="600" textAnchor="middle" transform="rotate(-90, 18, 140)">{yLabel}</text>
    </svg>
  </div>
);

const OldLandingPage = () => {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [currentLoreSlide, setCurrentLoreSlide] = useState(0);
  const totalLoreSlides = 6;

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
    },
    {
      q: "What if I've tried other programs and they didn't work?",
      a: "Most programs focus on what action to take, without addressing what's stopping you from taking action. We combine business strategy with healing work — so you actually do the things you know you should do. That's the difference."
    },
    {
      q: "Is there a community or am I doing this alone?",
      a: "You're not alone. You'll be part of a community of people on the same journey — sharing wins, supporting each other through challenges, and building accountability together."
    },
    {
      q: "What's included in the free version?",
      a: "The Career Clarity Quiz is completely free. You'll get a personalised assessment of where you are, what's missing, and which path is right for you. No credit card required, no strings attached."
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
          <span className="landing-badge landing-badge-gold">
            A game to monetise your mission
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
              onClick={() => setShowWaitlist(true)}
            >
              Join Waiting List
            </button>
            <button
              className="hero-cta-secondary"
              onClick={() => navigate('/try/flow-audit')}
            >
              <span className="btn-subtext">Free Quiz</span>Find Your Journey Stage
            </button>
          </div>

          <p className="hero-note">Free to start. No credit card required.</p>

          <div className="scroll-indicator" onClick={() => document.querySelector('.landing-cultures').scrollIntoView({ behavior: 'smooth' })}>
            <span className="scroll-arrow">↓</span>
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
              <div className="culture-header">
                <p className="culture-tradition">Sanskrit</p>
                <h3 className="culture-term">Svadharma</h3>
              </div>
              <p className="culture-translation">"One's own duty"</p>
              <p className="culture-description">
                Better to imperfectly follow your own path than to perfectly follow someone else's.
              </p>
            </div>

            <div className="culture-card">
              <div className="culture-header">
                <p className="culture-tradition">Taoist</p>
                <h3 className="culture-term">Te</h3>
              </div>
              <p className="culture-translation">"Inherent power"</p>
              <p className="culture-description">
                Your individual expression of the Tao. You don't create it through effort — you uncover it by removing obstructions.
              </p>
            </div>

            <div className="culture-card">
              <div className="culture-header">
                <p className="culture-tradition">Japanese</p>
                <h3 className="culture-term">Ikigai</h3>
              </div>
              <p className="culture-translation">"Reason for being"</p>
              <p className="culture-description">
                Emerges at the intersection of what you love and what others need.
              </p>
            </div>
          </div>

          <p className="cultures-question">
            So how do you find yours?
          </p>

          <button
            className="cultures-cta"
            onClick={() => document.getElementById('flow-finder-framework').scrollIntoView({ behavior: 'smooth' })}
          >
            Discover the Framework ↓
          </button>
        </div>
      </section>

      {/* Is This You? Section */}
      <section className="landing-is-this-you">
        <div className="landing-container">
          <h2 className="is-this-you-heading">Is This You?</h2>

          <div className="earthquake-moment">
            <p className="earthquake-context">
              You followed the traditional path: School, university, the job. You did everything "right".
              But you didn't find happiness, joy, fulfilment like you thought you would.
            </p>
            <p className="earthquake-context">
              You've started to wonder:
            </p>
            <ul className="earthquake-questions">
              <li>"Why does everyone walk this path if it doesn't make you happy?"</li>
              <li>"Is there another way?"</li>
              <li>"Am I crazy to think there's more to life than this?"</li>
            </ul>
          </div>

          <div className="is-this-you-vision">
            <p className="vision-intro">Now you sense life is supposed to be...</p>
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
                <div className="symptom-icon">😔</div>
                <h3>Talents Going to Waste</h3>
                <p>You finish each day feeling unfulfilled — like your best gifts are gathering dust.</p>
              </div>
              <div className="symptom-card">
                <div className="symptom-icon">🚫</div>
                <h3>Can't Monetise Gifts</h3>
                <p>You have skills and passion, but no system to turn them into income.</p>
              </div>
              <div className="symptom-card">
                <div className="symptom-icon">😰</div>
                <h3>Visibility Paralysis</h3>
                <p>Fear of judgement keeps you invisible — even when you're ready to share.</p>
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
                    <span className="journey-place">Dancing on beaches in Thailand</span>
                    <span className="journey-stat">13 headsets</span>
                  </div>
                  <div className="journey-arrow">→</div>
                  <div className="journey-point journey-to">
                    <span className="journey-emoji">🎉</span>
                    <span className="journey-place">Hosting Bali beach club events</span>
                    <span className="journey-stat">350 headsets</span>
                  </div>
                </div>
              </div>

              <div className="founder-why">
                <h3 className="founder-why-label">Why I built this</h3>

                <div className="story-chapter">
                  <p className="chapter-heading">The Realisation</p>
                  <p>In 2020, I realised a corporate job wasn't for me.</p>
                  <p>Three years later? I was still in the same job.</p>
                </div>

                <div className="story-chapter">
                  <p className="chapter-heading">The Confusion</p>
                  <p>It wasn't from a lack of clarity.</p>
                  <p>It wasn't from a lack of education — I'd spent <strong>$30,000</strong> on 52 courses.</p>
                  <p>It wasn't from a lack of will.</p>
                </div>

                <div className="story-chapter story-chapter-emphasis">
                  <p className="chapter-heading">The Truth</p>
                  <p className="chapter-reveal">It was because I didn't feel safe.</p>
                  <p>Scared of judgement. Scared of failing. Scared I wasn't good enough.</p>
                </div>

                <div className="story-chapter">
                  <p className="chapter-heading">The Experiment</p>
                  <p>In 2023, fed up, I challenged myself to do <strong>one thing a week that terrified me</strong>.</p>
                  <div className="challenge-timeline">
                    <div className="timeline-item">
                      <span className="timeline-marker">5 weeks</span>
                      <span className="timeline-text">Working from Bali</span>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-marker single-line">3 months</span>
                      <span className="timeline-text">Quit my job</span>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-marker single-line">5 months</span>
                      <span className="timeline-text">Funding my life through hosting silent discos on beaches across South-East Asia</span>
                    </div>
                  </div>
                </div>

                <div className="story-chapter story-chapter-insight">
                  <p className="chapter-heading">The Insight</p>
                  <p className="chapter-quote">"We don't rise to the level of our ambitions — we fall to the level of what feels safe."</p>
                  <p>This challenge changed what felt safe. And that changed everything.</p>
                </div>
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


                <div className="credentials-formula">
                  <span className="formula-intro">My secret?</span>
                  <span className="formula-name">The Three Pillars</span>
                </div>

                <div className="three-pillars-diagrams">
                  <PillarDiagram
                    title="Frameworks"
                    xLabel="Self-Knowledge"
                    yLabel="Action"
                    lineName="Self-Actualisation"
                    topZone="Misguided Zone"
                    topSub="Lack of Fulfilment"
                    bottomZone="Paralysis Zone"
                    bottomSub="Head Full of Dreams"
                    gradientId="pillarGrad1"
                  />
                  <PillarDiagram
                    title="Implementation"
                    xLabel="Ability"
                    yLabel="Challenge"
                    lineName="Groan Zone"
                    topZone="Failure Zone"
                    topSub="Lose Confidence"
                    bottomZone="Safe Zone"
                    bottomSub="Growth Stagnates"
                    gradientId="pillarGrad2"
                  />
                  <PillarDiagram
                    title="Community"
                    xLabel="Readiness"
                    yLabel="Shared"
                    lineName="Vulnerability Sweet Spot"
                    topZone="Burden Zone"
                    topSub="Push Away"
                    bottomZone="Shallow Zone"
                    bottomSub="Fail to Connect"
                    gradientId="pillarGrad3"
                  />
                </div>

                <p className="formula-desc">
                  — my unique formula for creating "magic programs" that cause participants
                  to walk away feeling like they've had one of the most transformational experiences of their life
                </p>

                <p className="credentials-kicker">
                  This is the level of design thinking behind every flow you'll experience.
                </p>

                <p className="founder-mission">
                  <strong>My north star:</strong> Help you go from idea to monetising your mission —
                  as fast as possible.
                </p>
              </div>
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

              {/* Quadrant: Top-Right (Vibe Rise) - highlighted */}
              <div className="matrix-quadrant quadrant-top-right quadrant-highlight">
                <span className="quadrant-star">&#9733;</span>
                <span className="quadrant-title">Vibe Rise</span>
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
      <section className="landing-nikigai" id="flow-finder-framework">
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
                    <span className="passion-question">you're passionate about <strong>standing for</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Level 3: The Formula */}
            <div className="framework-level framework-level-3">
              <div className="level-marker">3</div>
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
                    <div className="result-wisdom">
                      <span className="wisdom-word">Your Svadharma</span>
                      <span className="wisdom-separator">·</span>
                      <span className="wisdom-word">Your Te</span>
                      <span className="wisdom-separator">·</span>
                      <span className="wisdom-word">Your Ikigai</span>
                    </div>
                    <span className="result-desc">The thing no one else can compete with</span>
                  </div>
                </div>

                <div className="flow-states-comparison">
                  <div className="flow-state flow-state-in">
                    <h4 className="flow-state-title">When you're in Flow:</h4>
                    <ul className="flow-state-list">
                      <li>Work feels like play</li>
                      <li>Time distorts (hours feel like minutes)</li>
                      <li>Output quality increases effortlessly</li>
                      <li>Energy is generated, not depleted</li>
                      <li>Impact happens naturally</li>
                    </ul>
                  </div>
                  <div className="flow-state flow-state-out">
                    <h4 className="flow-state-title">When you're out of Flow:</h4>
                    <ul className="flow-state-list">
                      <li>Everything feels heavy</li>
                      <li>Resistance is constant</li>
                      <li>Energy drains rapidly</li>
                      <li>Quality suffers despite effort</li>
                      <li>Impact requires force</li>
                    </ul>
                  </div>
                </div>

                {/* Flow Equation Diagram */}
                <div className="flow-equation-diagram">
                  <h4 className="flow-equation-title">The Flow Equation</h4>
                  <svg viewBox="0 0 400 520" className="flow-equation-svg">
                    <defs>
                      <linearGradient id="flowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#5e17eb" />
                        <stop offset="100%" stopColor="#E9A23B" />
                      </linearGradient>
                    </defs>

                    {/* THE FLOW - Power Source */}
                    <rect x="125" y="10" width="150" height="50" rx="8" fill="rgba(94, 23, 235, 0.3)" stroke="#5e17eb" strokeWidth="2" />
                    <text x="200" y="32" textAnchor="middle" fill="white" fontSize="14" fontWeight="700">THE FLOW</text>
                    <text x="200" y="48" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">(Power Source)</text>

                    {/* Connector line down */}
                    <line x1="200" y1="60" x2="200" y2="90" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <text x="200" y="105" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Activates through alignment of:</text>

                    {/* Branch lines to three boxes */}
                    <line x1="200" y1="115" x2="200" y2="130" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="70" y1="130" x2="330" y2="130" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="70" y1="130" x2="70" y2="145" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="200" y1="130" x2="200" y2="145" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="330" y1="130" x2="330" y2="145" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />

                    {/* Arrows */}
                    <polygon points="70,145 65,138 75,138" fill="rgba(255,255,255,0.4)" />
                    <polygon points="200,145 195,138 205,138" fill="rgba(255,255,255,0.4)" />
                    <polygon points="330,145 325,138 335,138" fill="rgba(255,255,255,0.4)" />

                    {/* SKILLS Box */}
                    <rect x="20" y="150" width="100" height="90" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <text x="70" y="172" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">SKILLS</text>
                    <text x="70" y="192" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">What</text>
                    <text x="70" y="205" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">comes</text>
                    <text x="70" y="218" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">naturally</text>
                    <text x="70" y="231" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">to you</text>

                    {/* PROBLEMS Box */}
                    <rect x="150" y="150" width="100" height="90" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <text x="200" y="172" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">PROBLEMS</text>
                    <text x="200" y="192" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">What</text>
                    <text x="200" y="205" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">lights</text>
                    <text x="200" y="218" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">you up</text>
                    <text x="200" y="231" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">to solve</text>

                    {/* PEOPLE Box */}
                    <rect x="280" y="150" width="100" height="90" rx="8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <text x="330" y="172" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">PEOPLE</text>
                    <text x="330" y="192" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">Who</text>
                    <text x="330" y="205" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">you're</text>
                    <text x="330" y="218" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">meant</text>
                    <text x="330" y="231" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">to serve</text>

                    {/* Converging lines from three boxes */}
                    <line x1="70" y1="240" x2="70" y2="260" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="200" y1="240" x2="200" y2="260" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="330" y1="240" x2="330" y2="260" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="70" y1="260" x2="330" y2="260" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <line x1="200" y1="260" x2="200" y2="280" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <polygon points="200,285 195,278 205,278" fill="rgba(255,255,255,0.4)" />

                    {/* YOUR UNIQUE GIFT Box */}
                    <rect x="100" y="290" width="200" height="80" rx="8" fill="url(#flowGradient)" fillOpacity="0.3" stroke="#E9A23B" strokeWidth="2" />
                    <text x="200" y="315" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">YOUR UNIQUE GIFT</text>
                    <text x="200" y="340" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontStyle="italic">"An offer only</text>
                    <text x="200" y="355" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="10" fontStyle="italic">YOU can make"</text>

                    {/* Arrow to service */}
                    <line x1="200" y1="370" x2="200" y2="395" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                    <polygon points="200,400 195,393 205,393" fill="rgba(255,255,255,0.4)" />

                    {/* YOUR UNIQUE SERVICE Box */}
                    <rect x="100" y="405" width="200" height="100" rx="8" fill="rgba(233, 162, 59, 0.2)" stroke="#E9A23B" strokeWidth="2" />
                    <text x="200" y="430" textAnchor="middle" fill="#E9A23B" fontSize="13" fontWeight="700">YOUR UNIQUE SERVICE</text>
                    <text x="200" y="455" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">The specific</text>
                    <text x="200" y="470" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">change you create</text>
                    <text x="200" y="485" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">in the world</text>
                  </svg>
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

              <button
                className="archetypes-cta"
                onClick={() => setShowWaitlist(true)}
              >
                Join Waiting List →
              </button>
            </div>

                      </div>
        </div>
      </section>

      {/* How It Works Section - Gamified */}
      <section className="landing-how-it-works">
        <div className="landing-container">
          <h2 className="section-heading">How To Play</h2>
          <p className="section-subheading">
            A real life game to live your ambitions faster
          </p>

          {/* The Process Steps */}
          <div className="process-steps process-steps-3">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Create Your Essence Profile</h3>
                <p className="step-description">
                  Discover your unique character — your skills, the problems you solve, and who you're meant to serve.
                </p>
                <p className="step-game">
                  <span className="game-tag">Build your hero identity</span>
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Take the Stage Finder</h3>
                <p className="step-description">
                  Answer a few questions about where you are on your journey.
                </p>
                <div className="step-stages">
                  <span className="mini-stage">🎯 Clarity</span>
                  <span className="mini-stage">🛠️ Build</span>
                  <span className="mini-stage">💰 Sell</span>
                  <span className="mini-stage">📈 Scale</span>
                </div>
                <p className="step-game">
                  <span className="game-tag">Discover which level you're at</span>
                </p>
              </div>
            </div>

            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Unlock Your Quests</h3>
                <p className="step-description">
                  Get stage-specific quests that give you clarity on action + accountability to take action.
                </p>
                <p className="step-game">
                  <span className="game-tag">No overwhelm — just what you need now</span>
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
              <span className="element-icon">🧭</span>
              <span className="element-name">Flow Tracker</span>
              <span className="element-desc">Find your path</span>
            </div>
          </div>

          {/* Method Loop */}
          <div className="method-loop-section">
            <h3 className="method-loop-title">The Core Loop</h3>
            <p className="method-loop-subtitle">Each cycle compounds into progress</p>

            <div className="method-loop-diagram">
              <svg className="loop-arrows" viewBox="0 0 500 400">
                <path className="arrow-path" d="M 100 240 Q 120 320 200 340" />
                <path className="arrow-path" d="M 300 340 Q 380 320 400 240" />
                <path className="arrow-path" d="M 420 160 Q 400 80 300 60" />
                <path className="arrow-path" d="M 200 60 Q 100 80 80 160" />
              </svg>

              <div className="loop-step step-improve">
                <span className="step-label">3% BETTER</span>
                <span className="step-question">How improve?</span>
              </div>

              <div className="loop-step step-do">
                <span className="start-here">Start here ↓</span>
                <span className="step-label">DO</span>
                <span className="step-question">What action?</span>
              </div>

              <div className="loop-step step-groan">
                <span className="step-label">GROAN</span>
                <span className="step-question">Do it anyway</span>
              </div>

              <div className="loop-step step-block">
                <span className="step-label">BLOCK</span>
                <span className="step-question">What voice?</span>
              </div>
            </div>

            {/* Compounding Graph */}
            <div className="compound-graph-section">
              <h3 className="compound-title">Each Loop Compounds Into Progress</h3>
              <div className="compound-graph">
                <div className="graph-axis-y">
                  <span className="axis-label">PROGRESS</span>
                </div>
                <div className="graph-axis-x">
                  <span className="axis-label">TIME</span>
                </div>
                <svg className="compound-svg" viewBox="0 -40 400 280" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <marker id="arrow1" markerWidth="10" markerHeight="8" refX="5" refY="4" orient="auto">
                      <polygon points="0 0, 10 4, 0 8" fill="#7c3aed" />
                    </marker>
                    <marker id="arrow2" markerWidth="10" markerHeight="8" refX="5" refY="4" orient="auto">
                      <polygon points="0 0, 10 4, 0 8" fill="#a855f7" />
                    </marker>
                    <marker id="arrow3" markerWidth="10" markerHeight="8" refX="5" refY="4" orient="auto">
                      <polygon points="0 0, 10 4, 0 8" fill="#ffdd27" />
                    </marker>
                  </defs>

                  {/* Loop 1 - Spiral curl with arrow */}
                  <path
                    d="M 20 220
                       C 20 200, 30 180, 50 170
                       C 70 160, 75 180, 60 190
                       C 45 200, 35 185, 50 175
                       C 65 165, 90 145, 120 120"
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#arrow1)"
                  />
                  <text x="55" y="155" fill="#7c3aed" fontSize="12" fontWeight="600">Loop 1</text>

                  {/* Loop 2 - Spiral curl with arrow */}
                  <path
                    d="M 130 110
                       C 130 90, 140 70, 160 60
                       C 180 50, 185 70, 170 80
                       C 155 90, 145 75, 160 65
                       C 175 55, 200 40, 240 25"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#arrow2)"
                  />
                  <text x="165" y="45" fill="#a855f7" fontSize="12" fontWeight="600">Loop 2</text>

                  {/* Loop 3 - Spiral curl with arrow (gold) */}
                  <path
                    d="M 250 20
                       C 250 5, 260 -10, 280 -15
                       C 300 -20, 305 0, 290 10
                       C 275 20, 265 5, 280 -5
                       C 295 -15, 330 -35, 380 -50"
                    fill="none"
                    stroke="#ffdd27"
                    strokeWidth="3"
                    strokeLinecap="round"
                    markerEnd="url(#arrow3)"
                  />
                  <text x="280" y="-25" fill="#ffdd27" fontSize="12" fontWeight="600">Loop 3</text>
                </svg>
              </div>
            </div>
          </div>

          {/* First Wins - Moved here */}
          <div className="first-wins-inline">
            <h3 className="section-heading">Your First Wins</h3>
            <p className="section-subheading">Wherever you start, you get unstuck</p>

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
                <p className="win-outcome">Systems that grow your income</p>
              </div>
            </div>

            <p className="wins-promise"><strong>Live your ambitions faster.</strong></p>
          </div>

          {/* Track Synergies */}
          <div className="track-synergies-section">
            <h3 className="synergies-title">How does healing impact business?</h3>

            <div className="synergies-diagram">
              <svg viewBox="0 0 260 480" className="synergies-svg">
                <defs>
                  <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffdd27" />
                    <stop offset="100%" stopColor="#ffc107" />
                  </linearGradient>
                  <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feFlood floodColor="#ffdd27" floodOpacity="0.3" />
                    <feComposite in2="blur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* HEALING Box - Top */}
                <rect x="30" y="10" width="200" height="65" rx="16" fill="rgba(255, 221, 39, 0.1)" stroke="#ffdd27" strokeWidth="1.5" />
                <text x="130" y="35" textAnchor="middle" fill="#ffdd27" fontSize="14" fontWeight="700">HEALING</text>
                <text x="130" y="55" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11">Feel safe to take action</text>

                {/* Arrow down */}
                <line x1="130" y1="75" x2="130" y2="100" stroke="url(#goldGradient)" strokeWidth="2" />
                <polygon points="130,105 124,96 136,96" fill="#ffdd27" />

                {/* PLAYGROUND Box */}
                <rect x="30" y="110" width="200" height="65" rx="16" fill="rgba(255, 221, 39, 0.1)" stroke="#ffdd27" strokeWidth="1.5" />
                <text x="130" y="135" textAnchor="middle" fill="#ffdd27" fontSize="14" fontWeight="700">PLAY-LIST</text>
                <text x="130" y="155" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11">Do things you love</text>

                {/* Arrow down */}
                <line x1="130" y1="175" x2="130" y2="200" stroke="url(#goldGradient)" strokeWidth="2" />
                <polygon points="130,205 124,196 136,196" fill="#ffdd27" />

                {/* BUSINESS Box */}
                <rect x="30" y="210" width="200" height="65" rx="16" fill="rgba(255, 221, 39, 0.1)" stroke="#ffdd27" strokeWidth="1.5" />
                <text x="130" y="235" textAnchor="middle" fill="#ffdd27" fontSize="14" fontWeight="700">BUSINESS</text>
                <text x="130" y="255" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11">Earn money from it</text>

                {/* Arrow down */}
                <line x1="130" y1="275" x2="130" y2="300" stroke="url(#goldGradient)" strokeWidth="2" />
                <polygon points="130,305 124,296 136,296" fill="#ffdd27" />

                {/* SERVICE Box */}
                <rect x="30" y="310" width="200" height="65" rx="16" fill="rgba(255, 221, 39, 0.1)" stroke="#ffdd27" strokeWidth="1.5" />
                <text x="130" y="335" textAnchor="middle" fill="#ffdd27" fontSize="14" fontWeight="700">SERVICE</text>
                <text x="130" y="355" textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="11">Create positive impact</text>

                {/* Arrow down */}
                <line x1="130" y1="375" x2="130" y2="400" stroke="url(#goldGradient)" strokeWidth="2" />
                <polygon points="130,405 124,396 136,396" fill="#ffdd27" />

                {/* YOUR FLOW Box - Bottom (Final - highlighted) */}
                <rect x="30" y="410" width="200" height="65" rx="16" fill="rgba(255, 221, 39, 0.2)" stroke="url(#goldGradient)" strokeWidth="2" filter="url(#goldGlow)" />
                <text x="130" y="437" textAnchor="middle" fill="#ffdd27" fontSize="15" fontWeight="700">YOUR FLOW</text>
                <text x="130" y="457" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="11">Your unique life adventure</text>
              </svg>
            </div>

            <ul className="synergies-list">
              <li><strong>Healing</strong> enables <strong>Play-List</strong> — you can approach play when you understand why it scared you</li>
              <li><strong>Play-List</strong> enables <strong>Business</strong> — you can own your identity publicly when play feels safe again</li>
              <li><strong>Business</strong> creates <strong>Service</strong> — your gift reaches people</li>
              <li><strong>Service</strong> unlocks <strong>Your Flow</strong> — your unique life adventure</li>
            </ul>
          </div>

          {/* What's Included Checklist */}
          <div className="included-section">
            <h3 className="section-heading">Everything That's Included</h3>
            <p className="section-subheading">
              One platform. Every tool you need to go from stuck to monetising your mission.
            </p>

            <div className="included-grid">
              <div className="included-category">
                <h4 className="included-category-title">Discovery</h4>
                <ul className="included-list">
                  <li><span className="included-check">&#10003;</span>Flow Finder — discover your skills, problems & ideal persona</li>
                  <li><span className="included-check">&#10003;</span>Essence Archetype Profile — your unique character strengths</li>
                  <li><span className="included-check">&#10003;</span>Protective Pattern Profile — the armour blocking your gifts</li>
                  <li><span className="included-check">&#10003;</span>Career Clarity Quiz — job vs. your own thing</li>
                  <li><span className="included-check">&#10003;</span>Library of Answers — visual map of everything you've uncovered</li>
                </ul>
              </div>

              <div className="included-category">
                <h4 className="included-category-title">Building</h4>
                <ul className="included-list">
                  <li><span className="included-check">&#10003;</span>$100M Offer Builder — create an offer people can't refuse</li>
                  <li><span className="included-check">&#10003;</span>Grand Slam Matrix — evaluate and stack your offers</li>
                  <li><span className="included-check">&#10003;</span>Lead Magnet & Product Selection flows</li>
                  <li><span className="included-check">&#10003;</span>Funnel Builder & Calculator — plan and track your pipeline</li>
                  <li><span className="included-check">&#10003;</span>Income Calculator — model your revenue streams</li>
                </ul>
              </div>

              <div className="included-category">
                <h4 className="included-category-title">Healing & Growth</h4>
                <ul className="included-list">
                  <li><span className="included-check">&#10003;</span>Groan Matrix — courage challenges across 5 visibility layers</li>
                  <li><span className="included-check">&#10003;</span>Healing Compass — go to the root of what's holding you back</li>
                  <li><span className="included-check">&#10003;</span>Nervous System Flow — regulate before you take action</li>
                  <li><span className="included-check">&#10003;</span>Flow Compass — daily energy tracking (N/E/S/W directions)</li>
                  <li><span className="included-check">&#10003;</span>Journey Mapping — see how far you've come</li>
                </ul>
              </div>

              <div className="included-category">
                <h4 className="included-category-title">Gamified System</h4>
                <ul className="included-list">
                  <li><span className="included-check">&#10003;</span>7-Day Challenge — daily quests tailored to your stage</li>
                  <li><span className="included-check">&#10003;</span>Weekly Planning — 4-phase cycle (Push, Flow, Rest, Launch)</li>
                  <li><span className="included-check">&#10003;</span>Points, Streaks & Leaderboard — stay motivated</li>
                  <li><span className="included-check">&#10003;</span>Hero Profile & Level System — track your transformation</li>
                  <li><span className="included-check">&#10003;</span>Stage Progression — 10 stages from discovery to scaling</li>
                </ul>
              </div>

              <div className="included-category">
                <h4 className="included-category-title">CRM Command Center</h4>
                <ul className="included-list">
                  <li><span className="included-check">&#10003;</span>AI Content Generator — create posts, emails & pages</li>
                  <li><span className="included-check">&#10003;</span>Contact Management — track leads, deals & outreach</li>
                  <li><span className="included-check">&#10003;</span>Email Sequences — nurture campaigns with copy-to-clipboard</li>
                  <li><span className="included-check">&#10003;</span>Sales Scripts — 15 proven Hormozi-style scripts</li>
                  <li><span className="included-check">&#10003;</span>Business Systems — flywheel checklist to systemise growth</li>
                </ul>
              </div>

              <div className="included-category">
                <h4 className="included-category-title">AI Co-Founder</h4>
                <ul className="included-list">
                  <li><span className="included-check">&#10003;</span>Zarlo — AI assistant on every page, knows your context</li>
                  <li><span className="included-check">&#10003;</span>Guided Flows — AI-powered conversations that extract your answers</li>
                  <li><span className="included-check">&#10003;</span>Smart Prompts — 7 templates for content, outreach & strategy</li>
                  <li><span className="included-check">&#10003;</span>Personalised Recommendations — based on your stage & data</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Game Story - The Lore */}
          <div className="game-story-section">
            <h3 className="game-story-title">The Story</h3>
            <div className="lore-slides-container">
              <div className="lore-slides" style={{ transform: `translateX(-${currentLoreSlide * 100}%)` }}>
                <div className="lore-slide">
                  <p className="lore-text">In the beginning, humans lived in Flow.</p>
                  <p className="lore-subtext">They knew their gifts instinctively. They served their communities naturally. Work and play were indistinguishable.</p>
                </div>
                <div className="lore-slide">
                  <p className="lore-text">Then came the Matrix.</p>
                  <p className="lore-subtext">Not a conspiracy. An optimization. Society needed predictability, so it created systems: schools that trained compliance, careers that rewarded conformity.</p>
                </div>
                <div className="lore-slide">
                  <p className="lore-text">The Protective Voices were born.</p>
                  <p className="lore-subtext">The Perfectionist, The People Pleaser, The Controller, The Performer, The Ghost. They were protectors. But protectors can become prisons.</p>
                </div>
                <div className="lore-slide">
                  <p className="lore-text">The ancient Flow Masters left breadcrumbs.</p>
                  <p className="lore-subtext">Teachings about finding your true path, encoded in philosophy and wisdom traditions. They knew some would awaken.</p>
                </div>
                <div className="lore-slide">
                  <p className="lore-text">You are one of the Awakening.</p>
                  <p className="lore-subtext">The glitch you felt was real. The restlessness isn't a flaw—it's your Flow trying to activate after years of suppression.</p>
                </div>
                <div className="lore-slide">
                  <p className="lore-text">Welcome to the game, hero.</p>
                  <p className="lore-subtext">Find My Flow is the training program the Flow Masters would have built. The game is real. And you've already begun.</p>
                </div>
              </div>
            </div>
            <div className="lore-nav">
              <button
                className="lore-nav-btn lore-prev"
                onClick={() => setCurrentLoreSlide(prev => Math.max(0, prev - 1))}
                disabled={currentLoreSlide === 0}
                aria-label="Previous slide"
              >←</button>
              <div className="lore-dots">
                {[...Array(totalLoreSlides)].map((_, i) => (
                  <button
                    key={i}
                    className={`lore-dot ${currentLoreSlide === i ? 'active' : ''}`}
                    onClick={() => setCurrentLoreSlide(i)}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                className="lore-nav-btn lore-next"
                onClick={() => setCurrentLoreSlide(prev => Math.min(totalLoreSlides - 1, prev + 1))}
                disabled={currentLoreSlide === totalLoreSlides - 1}
                aria-label="Next slide"
              >→</button>
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
                onClick={() => setShowWaitlist(true)}
              >
                Join Waiting List →
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
                onClick={() => navigate('/try/flow-audit')}
              >
                <span className="btn-subtext">Free Quiz</span>Find Your Journey Stage
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
            <div className="why-matters-story">
              <h3 className="why-matters-heading">The #1 Regret of the Dying</h3>
              <p className="why-matters-context">
                Bronnie Ware spent years as a palliative care nurse. She asked patients about their regrets.
                The answer was so consistent, she wrote a book about it.
              </p>
            </div>

            <blockquote className="why-matters-quote">
              <p className="regret-text">
                "I wish I'd had the courage to live a life true to myself, not the life others expected of me."
              </p>
              <cite>— Bronnie Ware, <em>The Top Five Regrets of the Dying</em></cite>
            </blockquote>

            <div className="why-matters-answer">
              <p className="why-matters-belief">
                Finding your flow is the answer to not having this regret.
              </p>
              <p className="why-matters-close">
                Your Svadharma. Your Te. Your Ikigai. <strong>It's waiting.</strong>
              </p>
            </div>
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
              onClick={() => setShowWaitlist(true)}
            >
              Join Waiting List
            </button>
            <button
              className="hero-cta-secondary"
              onClick={() => navigate('/try/flow-audit')}
            >
              <span className="btn-subtext">Free Quiz</span>Find Your Journey Stage
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

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={showWaitlist}
        onClose={() => setShowWaitlist(false)}
      />
    </div>
  );
};

export default OldLandingPage;
