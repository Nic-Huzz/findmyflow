import { useNavigate } from 'react-router-dom'
import {
  VOICE_CONTENT, STAGES, STAGE_DESCRIPTIONS,
  BLOCK_CONTENT, DAM_COPY,
} from './earthquakeQuizConfig'

/**
 * EarthquakeResults — Results reveal + bridge CTA
 *
 * Props:
 *  - results: { primaryVoice, voiceScores, awakeningStage, primaryBlock, damSelections, courseCount, languageLevel }
 *  - answers: raw answer map
 *  - email: captured email
 *  - onRetake: callback to restart quiz
 */
export default function EarthquakeResults({ results, answers, email, onRetake }) {
  const navigate = useNavigate()
  const voice = VOICE_CONTENT[results.primaryVoice] || VOICE_CONTENT.ghost
  const block = BLOCK_CONTENT[results.primaryBlock] || BLOCK_CONTENT.action
  const stageDesc = STAGE_DESCRIPTIONS[results.awakeningStage] || STAGE_DESCRIPTIONS.earthquake

  // Build DAM copy from multi-select answers
  const damSelections = results.damSelections || []
  const damLines = damSelections
    .map(id => DAM_COPY[id])
    .filter(Boolean)

  const isExtremeCourseConsumer = results.courseCount === '10+'

  const handleSignup = () => {
    navigate('/get-started')
  }

  return (
    <div className="results-container">
      {/* Header */}
      <div className="results-header">
        <h1>YOUR EARTHQUAKE REPORT</h1>
      </div>

      {/* Card 1: Protective Voice */}
      <div className="result-card reveal-1">
        <div className="card-icon">{voice.icon}</div>
        <div className="card-label">YOUR LOUDEST PROTECTIVE VOICE</div>
        <div className="card-title">{voice.name}</div>

        <div className="card-section">
          <div className="section-label">The Lie</div>
          <p className="section-text">"{voice.theLie}"</p>
        </div>

        <div className="card-section">
          <div className="section-label">How It Protected You</div>
          <p className="section-text">{voice.howItProtected}</p>
        </div>

        <div className="card-section">
          <div className="section-label">How It Blocks You Now</div>
          <p className="section-text">{voice.howItBlocks}</p>
        </div>

        <div className="card-section">
          <div className="section-label">The Kryptonite</div>
          <p className="section-text">{voice.kryptonite}</p>
        </div>

        <div className="stat-line">{voice.stat}</div>
      </div>

      {/* Card 2: Awakening Stage */}
      <div className="result-card reveal-2">
        <div className="card-icon">{'\uD83D\uDCCD'}</div>
        <div className="card-label">YOUR AWAKENING STAGE</div>

        {/* Stage progress indicator */}
        <div className="stage-progress">
          {STAGES.map((s, i) => {
            const currentIdx = STAGES.findIndex(st => st.id === results.awakeningStage)
            const isReached = i <= currentIdx
            const isCurrent = i === currentIdx
            return (
              <span key={s.id} style={{ display: 'contents' }}>
                <div className="stage-node">
                  <div className={`stage-dot ${isReached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`} />
                  <div className={`stage-label ${isCurrent ? 'current' : ''}`}>{s.label}</div>
                </div>
                {i < STAGES.length - 1 && (
                  <div className={`stage-line ${i < currentIdx ? 'reached' : ''}`} />
                )}
              </span>
            )
          })}
        </div>

        <div className="you-are-here">You are here</div>

        <p className="section-text">{stageDesc}</p>
      </div>

      {/* Card 3: Primary Block */}
      <div className="result-card reveal-3">
        <div className="card-icon">{'\uD83D\uDEA7'}</div>
        <div className="card-label">YOUR PRIMARY BLOCK</div>
        <div className="card-title">{block.name}</div>

        <div className="card-section">
          <p className="section-text">{block.description}</p>
        </div>

        <div className="card-section">
          <p className="section-text">{block.reframe}</p>
        </div>
      </div>

      {/* DAM Section */}
      {damLines.length > 0 && (
        <div className="dam-section">
          {damLines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
          {isExtremeCourseConsumer && (
            <p className="course-warning">You don't need another course. You need integration.</p>
          )}
        </div>
      )}

      {/* Bridge Section */}
      <div className="bridge-section">
        <div className="bridge-wrong">
          <div className="bridge-heading">HERE'S WHAT MOST PEOPLE DO NEXT:</div>
          <div className="bridge-item"><span className="bridge-icon">&#10060;</span><span>Buy another course (you've done that)</span></div>
          <div className="bridge-item"><span className="bridge-icon">&#10060;</span><span>Try harder with willpower (you've done that too)</span></div>
          <div className="bridge-item"><span className="bridge-icon">&#10060;</span><span>Wait for clarity to arrive (it won't)</span></div>
        </div>

        <div className="bridge-right">
          <div className="bridge-heading">HERE'S WHAT ACTUALLY WORKS:</div>
          <div className="bridge-item"><span className="bridge-icon">&#10004;</span><span>Face {voice.name} in small, safe challenges</span></div>
          <div className="bridge-item"><span className="bridge-icon">&#10004;</span><span>Expand what feels safe to your nervous system</span></div>
          <div className="bridge-item"><span className="bridge-icon">&#10004;</span><span>Build your unique Flow: Skills &times; Problems &times; People</span></div>
          <div className="bridge-item"><span className="bridge-icon">&#10004;</span><span>Turn your gifts into service — through play, not force</span></div>
        </div>

        <p className="bridge-pitch">FindMyFlow is the training program for exactly this.</p>

        <div className="bridge-cta">
          <button className="primary-button glow-button" onClick={handleSignup}>
            Click Here to Find Your Flow
          </button>
          <div className="secondary-actions">
            <button onClick={onRetake}>Retake Quiz</button>
          </div>
        </div>
      </div>
    </div>
  )
}
