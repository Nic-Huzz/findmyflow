/**
 * FlowFinderExplainer.jsx
 *
 * Educational quest that explains the Flow Finder framework:
 * - The Ikigai-inspired intersection of Skills × Problems × Persona
 * - What the wheels represent and how they light up
 * - The proficiency/journey stage rings
 * - Recommended order for completing flows
 *
 * Created: Feb 2026
 */

import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import { GradientWheel } from '../components/CompetenceWheels'
import { SKILLS_SEGMENTS, PROBLEM_SEGMENTS, PERSONA_SEGMENTS, PROFICIENCY_RINGS } from '../lib/wheelTaxonomy'
import '../styles/flow-base.css'
import './FlowFinderExplainer.css'

export default function FlowFinderExplainer() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/7-day-challenge'
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false)
  const [viewingResults, setViewingResults] = useState(false)

  // Check for ?results=true to jump to last slide
  useEffect(() => {
    if (searchParams.get('results') === 'true') {
      setViewingResults(true)
      // Jump to the last slide (slide 7 = index 7, which shows "Ready to Find Your Flow?")
      setCurrentSlide(7)
    }
  }, [searchParams])

  // Demo lit cells for each wheel
  const [demoLitCells, setDemoLitCells] = useState(new Set())

  // Add hue values to segments for wheel rendering
  const skillsWithHue = useMemo(() =>
    SKILLS_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )
  const problemsWithHue = useMemo(() =>
    PROBLEM_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )
  const personaWithHue = useMemo(() =>
    PERSONA_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  // Animate demo cells based on current slide
  // Slides: 0=Core Insight, 1=Opportunity, 2=Three Pillars, 3=Skills, 4=Problems, 5=Persona, 6=Discovery, 7=Ready
  useEffect(() => {
    if (currentSlide === 3) {
      // Skills slide - light up a few cells progressively
      const timer1 = setTimeout(() => setDemoLitCells(new Set(['2-2', '5-1', '8-0'])), 500)
      const timer2 = setTimeout(() => setDemoLitCells(new Set(['2-2', '5-1', '8-0', '4-2', '11-1'])), 1200)
      return () => { clearTimeout(timer1); clearTimeout(timer2) }
    } else if (currentSlide === 4) {
      // Problems slide
      const timer1 = setTimeout(() => setDemoLitCells(new Set(['1-1', '8-2'])), 500)
      const timer2 = setTimeout(() => setDemoLitCells(new Set(['1-1', '8-2', '2-0', '5-1'])), 1200)
      return () => { clearTimeout(timer1); clearTimeout(timer2) }
    } else if (currentSlide === 5) {
      // Persona slide
      const timer1 = setTimeout(() => setDemoLitCells(new Set(['0-1', '3-2'])), 500)
      const timer2 = setTimeout(() => setDemoLitCells(new Set(['0-1', '3-2', '5-0', '7-1'])), 1200)
      return () => { clearTimeout(timer1); clearTimeout(timer2) }
    } else {
      setDemoLitCells(new Set())
    }
  }, [currentSlide])

  const handleComplete = async () => {
    setIsCompleting(true)
    try {
      // Sync with challenge system
      await syncFlowFinderWithChallenge(user.id, 'flow_finder_explainer')

      // Create a flow session to track completion
      const { error } = await supabase.from('flow_sessions').insert({
        user_id: user.id,
        flow_type: 'flow_finder_explainer',
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      if (error) {
        console.error('Error saving flow session:', error)
        // Non-fatal - continue to challenge page
      }

      navigate(returnTo)
    } catch (err) {
      console.error('Error completing explainer:', err)
      navigate(returnTo)
    }
  }

  const slides = [
    // Slide 1: The Core Insight
    {
      title: "The Core Insight",
      icon: "💡",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            A business is simply:
          </p>
          <p className="highlight-box">
            <strong>Solving a problem</strong>, for <strong>a person</strong>, using <strong>a set of skills</strong>.
          </p>
          <p className="slide-question">
            The question becomes: which problems, which people, which skills?
          </p>
          <p>
            Flow Finder helps you discover the answers.
          </p>
        </div>
      )
    },
    // Slide 2: The Opportunity
    {
      title: "The Opportunity",
      icon: "✨",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            Inspired by Ikigai — redesigned for building a business around your passions.
          </p>
          <p>
            When you find the intersection of skills you love, problems you care about, and people you want to serve...
          </p>
          <p className="highlight-box">
            Work feels like <strong>play</strong>.
          </p>
          <p>
            Flow Finder maps your unique combination to reveal your <span className="highlight">Unique Flow</span>.
          </p>
        </div>
      )
    },
    // Slide 2: The Three Pillars
    {
      title: "The Three Pillars",
      icon: "🔺",
      content: (
        <div className="slide-content">
          <div className="pillars-grid">
            <div className="pillar-card skills">
              <div className="pillar-icon">⚡</div>
              <h3>Skills</h3>
              <p>What you're naturally good at and love doing</p>
            </div>
            <div className="pillar-card problems">
              <div className="pillar-icon">🎯</div>
              <h3>Problems</h3>
              <p>Issues you're passionate about solving</p>
            </div>
            <div className="pillar-card persona">
              <div className="pillar-icon">👥</div>
              <h3>Persona</h3>
              <p>The people you're meant to serve</p>
            </div>
          </div>
          <p className="pillar-formula">
            <span className="formula-item">Skills</span>
            <span className="formula-operator">×</span>
            <span className="formula-item">Problems</span>
            <span className="formula-operator">×</span>
            <span className="formula-item">Persona</span>
            <span className="formula-operator">=</span>
            <span className="formula-result">Your Unique Flow</span>
          </p>
        </div>
      )
    },
    // Slide 3: Skills Wheel
    {
      title: "Skills Wheel",
      icon: "⚡",
      content: (
        <div className="slide-content wheel-slide">
          <div className="wheel-demo">
            <GradientWheel
              segments={skillsWithHue}
              rings={PROFICIENCY_RINGS}
              litCells={demoLitCells}
              size={240}
              centerLabel="SKILLS"
              interactive={false}
              celebrate={false}
            />
          </div>
          <div className="wheel-explanation">
            <p><strong>12 Segments</strong> based on how humans create value:</p>
            <div className="segment-examples">
              <span>Clarifying</span><span>Analyzing</span><span>Strategizing</span><span>Organizing</span>
              <span>Building</span><span>Designing</span><span>Creating</span><span>Expressing</span>
              <span>Connecting</span><span>Influencing</span><span>Nurturing</span><span>Synthesizing</span>
            </div>
            <p className="segment-why">Every business skill maps to one of these. Your unique combination reveals your <em>superpower</em>.</p>
            <p><strong>3 Rings</strong> = proficiency: Emerging → Establishing → Mastering</p>
          </div>
        </div>
      )
    },
    // Slide 4: Problems Wheel
    {
      title: "Problems Wheel",
      icon: "🎯",
      content: (
        <div className="slide-content wheel-slide">
          <div className="wheel-demo">
            <GradientWheel
              segments={problemsWithHue}
              rings={PROFICIENCY_RINGS}
              litCells={demoLitCells}
              size={240}
              centerLabel="PROBLEMS"
              interactive={false}
              celebrate={false}
            />
          </div>
          <div className="wheel-explanation">
            <p><strong>12 Segments</strong> organized by spheres of impact:</p>
            <div className="sphere-legend">
              <span className="sphere-item">Self</span>
              <span className="sphere-arrow">→</span>
              <span className="sphere-item">Relational</span>
              <span className="sphere-arrow">→</span>
              <span className="sphere-item">Community</span>
              <span className="sphere-arrow">→</span>
              <span className="sphere-item">World</span>
            </div>
            <div className="segment-examples small">
              <span>Physical Vitality</span><span>Mental Wellbeing</span><span>Personal Mastery</span>
              <span>Intimate Bonds</span><span>Creative Expression</span><span>Economic Freedom</span>
            </div>
            <p className="segment-why">Every problem worth solving fits somewhere. Your passion reveals where you're meant to make impact.</p>
            <p><strong>3 Rings</strong> = experience: Exploring → Pursuing → Proven</p>
          </div>
        </div>
      )
    },
    // Slide 5: Persona Wheel
    {
      title: "Persona Wheel",
      icon: "👥",
      content: (
        <div className="slide-content wheel-slide">
          <div className="wheel-demo">
            <GradientWheel
              segments={personaWithHue}
              rings={PROFICIENCY_RINGS}
              litCells={demoLitCells}
              size={240}
              centerLabel="PERSONA"
              interactive={false}
              celebrate={false}
            />
          </div>
          <div className="wheel-explanation">
            <p><strong>12 Segments</strong> based on core human drives:</p>
            <div className="segment-examples">
              <span>Seekers</span><span>Builders</span><span>Healers</span><span>Teachers</span>
              <span>Connectors</span><span>Achievers</span><span>Explorers</span><span>Visionaries</span>
              <span>Protectors</span><span>Creators</span><span>Nurturers</span><span>Challengers</span>
            </div>
            <p className="segment-why">Not demographics — <em>motivations</em>. Understanding drives creates deeper connection than age or location ever could.</p>
            <p><strong>3 Rings</strong> = journey stage: Awakening → Struggling → Ready</p>
          </div>
        </div>
      )
    },
    // Slide 6: The Flows
    {
      title: "Your Discovery Paths",
      icon: "🗺️",
      content: (
        <div className="slide-content">
          <p className="slide-intro">There are multiple ways to discover each pillar:</p>
          <div className="flows-grid">
            <div className="flow-option">
              <div className="flow-badge quick">Quick</div>
              <h4>Play-List Finder</h4>
              <p>4 questions about play and role models → Skills</p>
            </div>
            <div className="flow-option">
              <div className="flow-badge quick">Quick</div>
              <h4>Persona Identifier</h4>
              <p>2 questions about life chapters → Personas</p>
            </div>
            <div className="flow-option">
              <div className="flow-badge quick">Quick</div>
              <h4>Mind Space</h4>
              <p>Extract patterns from AI conversations</p>
            </div>
            <div className="flow-option">
              <div className="flow-badge deep">Deep</div>
              <h4>Full Flow Finder</h4>
              <p>Skills → Problems → Persona → Integration</p>
            </div>
          </div>
          <p className="flow-tip">Start with a quick flow to get your wheels lighting up, then go deeper when ready.</p>
        </div>
      )
    },
    // Slide 7: Ready to Begin
    {
      title: "Ready to Find Your Flow?",
      icon: "🚀",
      content: (
        <div className="slide-content">
          <p className="slide-intro">
            You now understand the Flow Finder framework!
          </p>
          <div className="ready-checklist">
            <div className="check-item">✓ Skills × Problems × Persona = Flow Zone</div>
            <div className="check-item">✓ Each wheel has 12 segments and 3 proficiency rings</div>
            <div className="check-item">✓ Quick flows for fast discovery, deep flows for thorough exploration</div>
            <div className="check-item">✓ Your wheels light up as you complete flows</div>
          </div>
          <p className="ready-cta">
            Head back to the challenge portal and pick your first Flow Finder quest!
          </p>
        </div>
      )
    }
  ]

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    } else {
      // On first slide, go back to challenge portal
      navigate(returnTo)
    }
  }

  const isLastSlide = currentSlide === slides.length - 1

  return (
    <div className="flow-finder-explainer">
      <div className="explainer-container">
        {/* Progress dots */}
        <div className="explainer-progress">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`progress-dot ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Slide content */}
        <div className="explainer-slide">
          {slides[currentSlide].icon && (
            <div className="slide-icon">{slides[currentSlide].icon}</div>
          )}
          <h1 className="slide-title">{slides[currentSlide].title}</h1>
          {slides[currentSlide].subtitle && (
            <p className="slide-subtitle">{slides[currentSlide].subtitle}</p>
          )}
          {slides[currentSlide].content}
        </div>

        {/* Navigation */}
        <div className="explainer-nav">
          {isLastSlide && viewingResults ? (
            <>
              <button
                className="nav-btn primary"
                onClick={() => navigate(-1)}
              >
                ← Back
              </button>
              <button
                className="nav-btn secondary"
                onClick={() => {
                  setViewingResults(false)
                  setCurrentSlide(0)
                  navigate('/flow-finder-explainer', { replace: true })
                }}
              >
                Review Again
              </button>
            </>
          ) : isLastSlide ? (
            <>
              <button
                className="nav-btn primary"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : "Complete & Return →"}
              </button>
              <button
                className="nav-btn secondary"
                onClick={handlePrev}
              >
                ← Back
              </button>
            </>
          ) : (
            <>
              <button
                className="nav-btn primary"
                onClick={handleNext}
              >
                Next →
              </button>
              <button
                className="nav-btn secondary"
                onClick={handlePrev}
              >
                ← Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
