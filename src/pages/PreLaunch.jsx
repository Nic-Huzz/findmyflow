/**
 * PreLaunch.jsx — /pre-launch
 * Vibe Rise pre-launch landing page. Cinematic personal letter → Essence Mirror CTA.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PreLaunch.css'

export default function PreLaunch() {
  const navigate = useNavigate()
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setRevealed(true))
  }, [])

  return (
    <div className={`pl-page ${revealed ? 'pl-revealed' : ''}`}>
      {/* Ambient background layers */}
      <div className="pl-bg-orb pl-bg-orb-1" />
      <div className="pl-bg-orb pl-bg-orb-2" />
      <div className="pl-bg-orb pl-bg-orb-3" />
      <div className="pl-bg-grain" />

      <div className="pl-scroll">
        {/* Hero */}
        <header className="pl-hero">
          <div className="pl-hero-inner">
            <h1 className="pl-title">
              <span className="pl-title-word pl-title-vibe">Vibe</span>
              <span className="pl-title-word pl-title-rise">Rise</span>
            </h1>
            <div className="pl-title-line" />
          </div>
        </header>

        {/* Letter */}
        <main className="pl-letter">
          <div className="pl-letter-inner">
            <p className="pl-p pl-p-1">
              For anyone who loved that "Vibe Rise" feeling, I believe it's a state we can train. One we can design our experiences and life around.
            </p>

            <p className="pl-p pl-p-2">
              I've been building an app that gamifies the journey.
            </p>

            <p className="pl-p pl-p-3">
              It helps you identify what lights you up, what drains you, and how to build more of the good stuff into your daily life.
            </p>

            <p className="pl-p pl-p-4">
              The first thing you do is discover your Essence Voice, the version of you that existed before the world told you who to be. Think of it like a personality test, but for the part of you that comes alive when you feel safe.
            </p>

            <p className="pl-p pl-p-5">
              From there the app tracks your Vibe Rise score, a daily measure of how much safety and expression you're building into your life.
            </p>
          </div>
        </main>

        {/* CTA */}
        <footer className="pl-footer">
          <button className="pl-cta" onClick={() => navigate('/try/essence-mirror')}>
            <span className="pl-cta-text">Discover Your Essence Voice</span>
            <span className="pl-cta-arrow">→</span>
          </button>
          <p className="pl-hint">Free. 3 minutes. No sign-up required.</p>
        </footer>
      </div>
    </div>
  )
}
