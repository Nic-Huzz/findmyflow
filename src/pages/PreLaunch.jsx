/**
 * PreLaunch.jsx — /pre-launch
 * Minimal Vibe Rise landing page. Hero + CTA → /try/essence-mirror
 */
import { useNavigate } from 'react-router-dom'
import './PreLaunch.css'

export default function PreLaunch() {
  const navigate = useNavigate()

  return (
    <div className="pl-page">
      <div className="pl-container">
        <h1 className="pl-headline">
          <span className="pl-gradient">Vibe Rise</span>
        </h1>

        <div className="pl-story">
          <p>For anyone who loved that "Vibe Rise" feeling, I believe it's a state we can train. One we can design our experiences and life around.</p>

          <p>I've been building an app that gamifies the journey.</p>

          <p>It helps you identify what lights you up, what drains you, and how to build more of the good stuff into your daily life.</p>

          <p>The first thing you do is discover your Essence Voice, the version of you that existed before the world told you who to be. Think of it like a personality test, but for the part of you that comes alive when you feel safe.</p>

          <p>From there the app tracks your Vibe Rise score, a daily measure of how much safety and expression you're building into your life.</p>
        </div>

        <button className="pl-cta" onClick={() => navigate('/try/essence-mirror')}>
          Discover Your Essence Voice →
        </button>

        <p className="pl-hint">Free. 3 minutes. No sign-up required.</p>
      </div>
    </div>
  )
}
