/**
 * ContentTemplateModal — Shareable image template popup
 *
 * Renders brand-styled cards at 1080x1350 (Instagram carousel 4:5),
 * captures with html2canvas, and lets users download as PNG.
 *
 * Templates: leaderboard, hero, scorecard, intentions, courage
 */
import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import './ContentTemplateModal.css'

// Dynamic import html2canvas only when downloading
const loadHtml2Canvas = () => import('html2canvas')

export default function ContentTemplateModal({ templateType, onClose, data = {} }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await loadHtml2Canvas()
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      const link = document.createElement('a')
      link.download = `findmyflow-${templateType}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
      alert('Download failed. Try taking a screenshot instead.')
    } finally {
      setDownloading(false)
    }
  }, [templateType, downloading])

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return
    if (!navigator.share) {
      alert('Sharing not supported — use Download instead')
      return
    }
    setDownloading(true)
    try {
      const { default: html2canvas } = await loadHtml2Canvas()
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const file = new File([blob], `findmyflow-${templateType}.png`, { type: 'image/png' })
      await navigator.share({ files: [file], title: 'FindMyFlow' })
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    } finally {
      setDownloading(false)
    }
  }, [templateType])

  return createPortal(
    <div className="ctm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <button className="ctm-close" onClick={onClose}>×</button>

      <div className="ctm-preview">
        <div className="ctm-card-scaler">
          <div ref={cardRef} className="ctm-card">
            {templateType === 'leaderboard' && <LeaderboardCard data={data} />}
            {templateType === 'hero' && <HeroCard data={data} />}
            {templateType === 'scorecard' && <ScorecardCard data={data} />}
            {templateType === 'intentions' && <IntentionsCard data={data} />}
            {templateType === 'courage' && <CourageCard data={data} />}
          </div>
        </div>
      </div>

      <div className="ctm-actions">
        <button className="ctm-download" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Saving...' : 'Download Image ⬇️'}
        </button>
        <button className="ctm-share" onClick={handleShare} disabled={downloading}>🔗</button>
      </div>
      <p className="ctm-hint">Save to camera roll, then share to your story</p>
    </div>,
    document.body
  )
}


/* ── LEADERBOARD CARD ── */
function LeaderboardCard({ data }) {
  const { standings = [], userTeamId, weekNumber = 1 } = data
  const displayStandings = standings.length > 0
    ? standings.slice(0, 4)
    : [
        { id: '1', name: 'Team 1', wins: 0, draws: 0, losses: 0, points: 0 },
        { id: '2', name: 'Team 2', wins: 0, draws: 0, losses: 0, points: 0 },
      ]

  const rankEmoji = (i) => ['🥇', '🥈', '🥉'][i] || `#${i + 1}`

  return (
    <div className="tpl-leaderboard">
      <div className="tpl-lb-eyebrow">Fantasy League Standings</div>
      <div className="tpl-lb-title">FindMyFlow League S1</div>
      <div className="tpl-lb-week">After Week {weekNumber}</div>
      <div className="tpl-lb-teams">
        {displayStandings.map((team, i) => (
          <div key={team.id} className={`tpl-lb-team ${team.id === userTeamId ? 'mine' : ''}`}>
            <span className="tpl-lb-rank">{rankEmoji(i)}</span>
            <div className="tpl-lb-team-info">
              <div className="tpl-lb-name">{team.name}</div>
              <div className="tpl-lb-record">{team.wins}W {team.draws}D {team.losses}L</div>
            </div>
            <span className="tpl-lb-pts">{team.points}</span>
          </div>
        ))}
      </div>
      <div className="tpl-footer">
        <span className="tpl-brand">FINDMYFLOW</span>
        <span className="tpl-cta">findmyflow.nichuzz.com</span>
      </div>
    </div>
  )
}


/* ── HERO PROFILE CARD ── */
function HeroCard({ data }) {
  const {
    userName = 'Hero',
    archetype = 'The Explorer',
    imagePath = null,
    superpower = '',
    poeticLine = '',
    poeticVision = '',
    characters = [],
  } = data

  // Split poetic_vision into paragraphs (separated by \n\n)
  const visionParagraphs = poeticVision ? poeticVision.split('\n\n').filter(Boolean) : []

  return (
    <div className="tpl-hero">
      <div className="tpl-hero-eyebrow">My Hero Profile</div>
      {imagePath ? (
        <img src={imagePath} alt={archetype} className="tpl-hero-image" crossOrigin="anonymous" />
      ) : (
        <div className="tpl-hero-archetype">🦸</div>
      )}
      <div className="tpl-hero-name">{archetype}</div>
      <div className="tpl-hero-subtitle">{userName}</div>
      {poeticLine && (
        <div className="tpl-hero-poetic">{poeticLine}</div>
      )}
      {superpower && (
        <div className="tpl-hero-superpower">
          <span className="tpl-hero-strength-icon">⚡</span>
          <span className="tpl-hero-strength-text">{superpower}</span>
        </div>
      )}
      {visionParagraphs.length > 0 && (
        <div className="tpl-hero-vision">
          {visionParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}
      {characters.length > 0 && (
        <div className="tpl-hero-characters">
          <div className="tpl-hero-characters-label">Spirit Characters</div>
          <div className="tpl-hero-characters-list">
            {characters.slice(0, 3).map((c, i) => (
              <span key={i} className="tpl-hero-character">{c}</span>
            ))}
          </div>
        </div>
      )}
      <div className="tpl-footer">
        <span className="tpl-brand">FINDMYFLOW</span>
        <span className="tpl-cta">What's your archetype?</span>
      </div>
    </div>
  )
}


/* ── SCORECARD CARD ── */
function ScorecardCard({ data }) {
  const { teamName = 'My Team', opponentName = 'Opponent', weekNumber = 1, score = '0 – 0', categories = [] } = data
  const defaultCats = [
    { label: '💼 Business', value: 0, maxValue: 50, won: false },
    { label: '🎮 Play-List', value: 0, maxValue: 50, won: false },
    { label: '💚 Healing', value: 0, maxValue: 50, won: false },
    { label: '🎭 Voice', value: 0, maxValue: 50, won: false },
    { label: '⭐ Bonus', value: 0, maxValue: 50, won: false },
  ]
  const displayCats = categories.length > 0 ? categories : defaultCats

  return (
    <div className="tpl-scorecard">
      <div className="tpl-sc-eyebrow">Team Scorecard</div>
      <div className="tpl-sc-team">{teamName}</div>
      <div className="tpl-sc-week">Week {weekNumber} · vs {opponentName}</div>
      <div className="tpl-sc-result">
        <div className="tpl-sc-vs-row">
          <span className="tpl-sc-vs-team">{teamName}</span>
          <span className="tpl-sc-vs-label">VS</span>
          <span className="tpl-sc-vs-team">{opponentName}</span>
        </div>
        <div className="tpl-sc-score">{score}</div>
      </div>
      <div className="tpl-sc-bars">
        {displayCats.map((cat, i) => {
          const pct = cat.maxValue > 0 ? Math.round((cat.value / cat.maxValue) * 100) : 0
          return (
            <div key={i} className="tpl-sc-bar-row">
              <span className="tpl-sc-bar-label">{cat.label}</span>
              <div className="tpl-sc-bar-track">
                <div className="tpl-sc-bar-fill" style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
              <span className={`tpl-sc-bar-val ${cat.won ? 'won' : ''}`}>{cat.value}</span>
            </div>
          )
        })}
      </div>
      <div className="tpl-footer">
        <span className="tpl-brand">FINDMYFLOW</span>
        <span className="tpl-cta">Fantasy League S1</span>
      </div>
    </div>
  )
}


/* ── WEEKLY INTENTIONS CARD ── */
function IntentionsCard({ data }) {
  const { weekNumber = 1, weekType = 'Flow', weekDesc = 'Balanced productivity', goals = [], teamName = 'My Team' } = data
  const displayGoals = goals.length > 0
    ? goals.slice(0, 4)
    : [
        { text: 'Set your weekly intentions', stage: 'Challenge', done: false },
        { text: 'Complete a courage challenge', stage: 'Play-List', done: false },
        { text: 'Record a compass check-in', stage: 'Tracker', done: false },
      ]

  return (
    <div className="tpl-intentions">
      <div className="tpl-int-eyebrow">My Weekly Intentions</div>
      <div className="tpl-int-title">Week {weekNumber} Goals</div>
      <div className="tpl-int-week">{weekType} Week · {weekDesc}</div>
      <div className="tpl-int-goals">
        {displayGoals.map((goal, i) => (
          <div key={i} className="tpl-int-goal">
            <div className={`tpl-int-goal-check ${goal.done ? 'done' : ''}`}>
              {goal.done ? '✓' : ''}
            </div>
            <div>
              <div className="tpl-int-goal-text">{goal.text}</div>
              <div className="tpl-int-goal-stage">{goal.stage}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="tpl-footer">
        <span className="tpl-brand">FINDMYFLOW</span>
        <span className="tpl-cta">🏆 {teamName}</span>
      </div>
    </div>
  )
}


/* ── COURAGE CHALLENGE CARD ── */
function CourageCard({ data }) {
  const {
    challengeText = 'Share a courage challenge you completed',
    visibilityLayer = 'Screen',
    scaryScore = 0,
    wahooScore = 0,
  } = data

  return (
    <div className="tpl-courage">
      <div className="tpl-cg-eyebrow">Play-List · Courage Challenge</div>
      <div className="tpl-cg-emoji">😱✨</div>
      <div className="tpl-cg-title">"{challengeText}"</div>
      <div className="tpl-cg-layer">Visibility Layer: {visibilityLayer}</div>
      <div className="tpl-cg-scores">
        <div className="tpl-cg-score-box">
          <span className="tpl-cg-score-val">{scaryScore}</span>
          <span className="tpl-cg-score-label">Scary</span>
        </div>
        <div className="tpl-cg-score-box">
          <span className="tpl-cg-score-val">{wahooScore}</span>
          <span className="tpl-cg-score-label">Wahoo</span>
        </div>
      </div>
      <div className="tpl-cg-quote">"The things that scare you AND excite you are where growth lives"</div>
      <div className="tpl-footer">
        <span className="tpl-brand">FINDMYFLOW</span>
        <span className="tpl-cta">Play-List 🎭</span>
      </div>
    </div>
  )
}
