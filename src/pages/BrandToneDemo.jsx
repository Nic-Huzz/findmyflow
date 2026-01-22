import React, { useState } from 'react'
import './BrandToneDemo.css'

const BrandToneDemo = () => {
  const [activeTone, setActiveTone] = useState('playful-warmth')

  return (
    <div className={`brand-demo-page tone-${activeTone}`}>
      <div className="brand-demo-header">
        <h1>Brand Tone Explorer</h1>
        <p>Click each tab to see how FindMyFlow could feel</p>

        <div className="tone-tabs">
          <button
            className={`tone-tab ${activeTone === 'playful-warmth' ? 'active' : ''}`}
            onClick={() => setActiveTone('playful-warmth')}
          >
            🌟 Playful Warmth
          </button>
          <button
            className={`tone-tab ${activeTone === 'playful' ? 'active' : ''}`}
            onClick={() => setActiveTone('playful')}
          >
            🎈 Energetic & Playful
          </button>
          <button
            className={`tone-tab ${activeTone === 'premium' ? 'active' : ''}`}
            onClick={() => setActiveTone('premium')}
          >
            ✨ Premium & Refined
          </button>
          <button
            className={`tone-tab ${activeTone === 'warm' ? 'active' : ''}`}
            onClick={() => setActiveTone('warm')}
          >
            🤗 Warm & Supportive
          </button>
        </div>
      </div>

      <div className="brand-demo-content">
        {/* Welcome Section */}
        <div className="demo-section">
          <h2 className="demo-welcome">Welcome Back, Nic</h2>
          <p className="demo-subtitle">
            {activeTone === 'playful-warmth' && "Ready to make some magic happen? 💫"}
            {activeTone === 'playful' && "Let's crush some goals today! 🚀"}
            {activeTone === 'premium' && "Your journey continues."}
            {activeTone === 'warm' && "We're glad you're here. How are you feeling today?"}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="demo-section">
          <h3 className="demo-section-title">Your Voices</h3>
          <div className="demo-stats-grid">
            <div className="demo-stat-card purple">
              <div className="demo-stat-icon">✨</div>
              <div className="demo-stat-label">Essence</div>
              <div className="demo-stat-value">The Luminary</div>
            </div>
            <div className="demo-stat-card gold">
              <div className="demo-stat-icon">🛡️</div>
              <div className="demo-stat-label">Protective</div>
              <div className="demo-stat-value">The Perfectionist</div>
            </div>
          </div>
        </div>

        {/* Streak Display */}
        <div className="demo-section">
          <h3 className="demo-section-title">Your Streaks</h3>
          <div className="demo-streak-row">
            <div className="demo-streak-item">
              <span className="demo-streak-emoji">🔥</span>
              <div className="demo-streak-info">
                <span className="demo-streak-value">7</span>
                <span className="demo-streak-label">Day Streak</span>
              </div>
            </div>
            <div className="demo-streak-item">
              <span className="demo-streak-emoji">💪</span>
              <div className="demo-streak-info">
                <span className="demo-streak-value">3</span>
                <span className="demo-streak-label">Week Groan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="demo-section">
          <h3 className="demo-section-title">Call to Action</h3>
          <button className="demo-cta-button">
            {activeTone === 'playful-warmth' && "Let's Do This 💪"}
            {activeTone === 'playful' && "🎯 Let's Go!"}
            {activeTone === 'premium' && "Continue Challenge"}
            {activeTone === 'warm' && "Ready When You Are"}
          </button>
          <button className="demo-secondary-button">
            {activeTone === 'playful-warmth' && "Explore Your Wins"}
            {activeTone === 'playful' && "📚 Check Library"}
            {activeTone === 'premium' && "View Library"}
            {activeTone === 'warm' && "Explore at your pace"}
          </button>
        </div>

        {/* Progress Strip */}
        <div className="demo-section">
          <h3 className="demo-section-title">Progress Strip</h3>
          <div className="demo-progress-strip">
            <div className="demo-progress-header">
              <span className="demo-project-name">My Side Hustle</span>
            </div>
            <div className="demo-progress-stats">
              <div className="demo-progress-stat">
                <span className="demo-progress-icon">☀️</span>
                <span className="demo-progress-value">3/5</span>
                <span className="demo-progress-label">Daily</span>
              </div>
              <div className="demo-progress-stat">
                <span className="demo-progress-icon">📅</span>
                <span className="demo-progress-value">2/4</span>
                <span className="demo-progress-label">Weekly</span>
              </div>
              <div className="demo-progress-stat">
                <span className="demo-progress-icon">🎯</span>
                <span className="demo-progress-value">2/6</span>
                <span className="demo-progress-label">Stage</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification/Feedback Toast */}
        <div className="demo-section">
          <h3 className="demo-section-title">Success Feedback</h3>
          <div className="demo-toast">
            {activeTone === 'playful-warmth' && "You did it! That took courage 💪"}
            {activeTone === 'playful' && "🎉 Quest completed! +50 points!"}
            {activeTone === 'premium' && "Quest completed successfully."}
            {activeTone === 'warm' && "Well done! You're making great progress."}
          </div>
        </div>

        {/* Characteristics */}
        <div className="demo-characteristics">
          <h3>Characteristics of this tone:</h3>
          {activeTone === 'playful-warmth' && (
            <ul>
              <li><strong>Motion:</strong> Spring bounce for wins, gentle breathing for rest — energy when celebrating, calm when reflecting</li>
              <li><strong>Colors:</strong> Warm purple/gold palette with vibrant accents for achievements</li>
              <li><strong>Copy:</strong> Encouraging with personality — uses emojis for celebration, acknowledges feelings during challenges</li>
              <li><strong>Feedback:</strong> Celebrates effort AND results — "That took courage" alongside "You did it!"</li>
              <li><strong>Hovers:</strong> Satisfying spring bounce, warm glows, icons float playfully</li>
              <li><strong>Vibe:</strong> A supportive friend who celebrates your wins enthusiastically</li>
            </ul>
          )}
          {activeTone === 'playful' && (
            <ul>
              <li><strong>Motion:</strong> Bouncy, springy animations with overshoot</li>
              <li><strong>Colors:</strong> Vibrant, slightly saturated, playful accents</li>
              <li><strong>Copy:</strong> Enthusiastic, uses emojis freely, exclamation marks</li>
              <li><strong>Feedback:</strong> Celebratory, points pop, confetti moments</li>
              <li><strong>Hovers:</strong> Elements wiggle, scale up eagerly</li>
              <li><strong>Vibe:</strong> Like Duolingo meets a friendly coach</li>
            </ul>
          )}
          {activeTone === 'premium' && (
            <ul>
              <li><strong>Motion:</strong> Smooth, elegant, no overshoot, graceful</li>
              <li><strong>Colors:</strong> Deep purples, refined golds, sophisticated palette</li>
              <li><strong>Copy:</strong> Concise, confident, minimal punctuation</li>
              <li><strong>Feedback:</strong> Subtle, understated confirmations</li>
              <li><strong>Hovers:</strong> Gentle lifts, soft glows, restrained</li>
              <li><strong>Vibe:</strong> Like Stripe meets a luxury wellness brand</li>
            </ul>
          )}
          {activeTone === 'warm' && (
            <ul>
              <li><strong>Motion:</strong> Gentle, breathing animations, soft ease-in-out</li>
              <li><strong>Colors:</strong> Warm undertones, soft shadows, comforting</li>
              <li><strong>Copy:</strong> Encouraging, supportive, acknowledges feelings</li>
              <li><strong>Feedback:</strong> Affirming, celebrates effort not just results</li>
              <li><strong>Hovers:</strong> Welcoming glow, feels like an invitation</li>
              <li><strong>Vibe:</strong> Like Headspace meets a supportive mentor</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default BrandToneDemo
