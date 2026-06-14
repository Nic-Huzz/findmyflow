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
        <div className="pl-badge">Coming Soon</div>

        <h1 className="pl-headline">
          <span className="pl-gradient">Vibe Rise</span>
        </h1>

        <p className="pl-tagline">The app that gamifies courage.</p>

        <p className="pl-sub">
          Safety × Expression = experiences you love.<br />
          Stack enough and you have a life you love.
        </p>

        <button className="pl-cta" onClick={() => navigate('/try/essence-mirror')}>
          Discover Your Essence →
        </button>

        <p className="pl-hint">Free. 3 minutes. No sign-up required.</p>
      </div>
    </div>
  )
}
