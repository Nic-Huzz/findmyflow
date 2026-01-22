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

          <p className="landing-philosophy">
            Learning that feels like play, not homework.
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
          </div>
        </div>
      </section>

      {/* Ancient Wisdom Section */}
      <section className="landing-wisdom">
        <div className="landing-container">
          <h2 className="section-heading">The Ancient Names for This Truth</h2>
          <p className="section-subheading">
            Every wisdom tradition has a word for the path only you can walk
          </p>

          <div className="wisdom-table">
            <div className="wisdom-row wisdom-header">
              <span className="wisdom-tradition">Tradition</span>
              <span className="wisdom-concept">Concept</span>
              <span className="wisdom-meaning">Core Meaning</span>
            </div>
            <div className="wisdom-row">
              <span className="wisdom-tradition">Hindu</span>
              <span className="wisdom-concept">Svadharma</span>
              <span className="wisdom-meaning">"One's own duty" — the path only you can walk</span>
            </div>
            <div className="wisdom-row">
              <span className="wisdom-tradition">Taoist</span>
              <span className="wisdom-concept">Te</span>
              <span className="wisdom-meaning">Your natural virtue expressing through action</span>
            </div>
            <div className="wisdom-row">
              <span className="wisdom-tradition">Japanese</span>
              <span className="wisdom-concept">Ikigai</span>
              <span className="wisdom-meaning">Where love, skill, need, and payment intersect</span>
            </div>
            <div className="wisdom-row">
              <span className="wisdom-tradition">Jewish</span>
              <span className="wisdom-concept">Tikkun</span>
              <span className="wisdom-meaning">The fragment of reality only your soul can repair</span>
            </div>
            <div className="wisdom-row">
              <span className="wisdom-tradition">Christian</span>
              <span className="wisdom-concept">Vocation</span>
              <span className="wisdom-meaning">The work God designed you for</span>
            </div>
            <div className="wisdom-row">
              <span className="wisdom-tradition">Buddhist</span>
              <span className="wisdom-concept">Right Livelihood</span>
              <span className="wisdom-meaning">Work that serves awakening</span>
            </div>
          </div>

          <div className="wisdom-why">
            <h3 className="wisdom-why-heading">Why This Matters</h3>
            <div className="wisdom-points">
              <div className="wisdom-point">
                <span className="wisdom-point-title">The universe made exactly one of you</span>
                <span className="wisdom-point-text">If you don't walk your path, it goes unwalked</span>
              </div>
              <div className="wisdom-point">
                <span className="wisdom-point-title">Misalignment IS suffering</span>
                <span className="wisdom-point-text">The Sunday dread, the depletion, the fraudulent feeling</span>
              </div>
              <div className="wisdom-point">
                <span className="wisdom-point-title">Alignment IS abundance</span>
                <span className="wisdom-point-text">Energy that renews, motivation that's intrinsic</span>
              </div>
              <div className="wisdom-point">
                <span className="wisdom-point-title">Your flow serves the whole</span>
                <span className="wisdom-point-text">You're not self-indulging — you're filling a you-shaped hole in reality</span>
              </div>
            </div>
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

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Discover Your Value</h3>
              <p className="step-description">
                Uncover the skills you've been taking for granted. The things that come
                naturally to you but feel like magic to others.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Find Your Problems</h3>
              <p className="step-description">
                Identify the problems you actually enjoy solving — the ones where helping
                feels like play, not work.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Meet Your People</h3>
              <p className="step-description">
                Discover who you're meant to serve. The people whose problems light you up
                and who value what you bring.
              </p>
            </div>

            <div className="step-card">
              <div className="step-number">4</div>
              <h3 className="step-title">Build Your Path</h3>
              <p className="step-description">
                Create offers, launch with confidence, and build something meaningful —
                guided every step of the way.
              </p>
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
                <p>Bite-sized actions that move you forward. Complete quests to earn points and build momentum.</p>
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
                All your discoveries organized in one place. Your skills, problems,
                personas, and insights — always accessible.
              </p>
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
              <div className="community-icon">🏆</div>
              <h3>Weekly Leaderboards</h3>
              <p>See how you're progressing compared to others. Celebrate wins together and stay motivated.</p>
            </div>
            <div className="community-feature">
              <div className="community-icon">👥</div>
              <h3>Challenge Groups</h3>
              <p>Join a small group tackling the same challenges. Accountability partners who get it.</p>
            </div>
            <div className="community-feature">
              <div className="community-icon">🎉</div>
              <h3>Milestone Celebrations</h3>
              <p>Every stage completion, every first sale, every breakthrough — we celebrate with you.</p>
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
              Get the <strong>Flow Finder Starter Kit</strong> — a free guide with the first 3 exercises
              to start discovering your unique path. Plus weekly insights on building a business around your strengths.
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
