/**
 * ExperienceCatalog — /business
 *
 * The home of the experience creator OS. Shows:
 *   - Hero header
 *   - "+ New Experience" button
 *   - Previous 3% note surfaced from last completed experience (if any)
 *   - List of upcoming experiences (sorted by date)
 *   - List of past experiences
 */

import { useNavigate } from 'react-router-dom'
import { useExperienceList, daysUntil, formatExperienceDate } from '../hooks/useExperienceData'
import './ExperienceCatalog.css'

const formatDate = (d) => formatExperienceDate(d)

function countdownLabel(dateStr) {
  const d = daysUntil(dateStr)
  if (d === null) return null
  if (d > 1) return `${d} days to go`
  if (d === 1) return 'Tomorrow'
  if (d === 0) return 'Today'
  if (d === -1) return 'Yesterday'
  return `${Math.abs(d)} days ago`
}

export default function ExperienceCatalog() {
  const navigate = useNavigate()
  const { experiences, loading, error } = useExperienceList()

  const upcoming = experiences.filter(e => e.status === 'upcoming')
  // Past sorted newest first for display + to pick the most recent reflection
  const past = experiences
    .filter(e => e.status === 'completed' || e.status === 'archived')
    .slice()
    .sort((a, b) => {
      const da = a.experience_date || a.updated_at || a.created_at
      const db = b.experience_date || b.updated_at || b.created_at
      return (db || '').localeCompare(da || '')
    })

  // Most recent past experience with a 3% note
  const lastReflection = past.find(e => e.three_percent_note)

  return (
    <div className="exp-catalog">
      <div className="exp-orb exp-orb-1" />
      <div className="exp-orb exp-orb-2" />

      <div className="exp-container">
        {/* Hero */}
        <header className="exp-hero">
          <div className="exp-badge">Experience OS</div>
          <h1 className="exp-title">
            Your <span className="exp-gradient-text">experiences</span>
          </h1>
          <p className="exp-sub">
            Every experience, set up to win. Pre-event checklists to fill the
            room and get ready. Post-event rituals so every event compounds on
            the last.
          </p>
          <button
            className="exp-cta"
            onClick={() => navigate('/business/experience/new')}
          >
            + New Experience
          </button>
        </header>

        {/* Previous 3% note card */}
        {lastReflection && (
          <div className="exp-reflection-card">
            <div className="exp-reflection-header">
              <span className="exp-reflection-icon">🪞</span>
              <div>
                <div className="exp-reflection-eyebrow">Your 3% note from</div>
                <div className="exp-reflection-name">{lastReflection.name}</div>
              </div>
            </div>
            <p className="exp-reflection-body">{lastReflection.three_percent_note}</p>
          </div>
        )}

        {loading && (
          <div className="exp-state">
            <div className="exp-spinner" />
            <p>Loading your experiences...</p>
          </div>
        )}

        {error && !loading && (
          <div className="exp-state exp-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && experiences.length === 0 && (
          <div className="exp-empty">
            <div className="exp-empty-icon">✨</div>
            <h2>No experiences yet</h2>
            <p>
              Tap <strong>+ New Experience</strong> to set up your first one.
              We'll give you a checklist to fill the room and another to run
              it smoothly.
            </p>
          </div>
        )}

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <section className="exp-section">
            <h2 className="exp-section-title">Upcoming</h2>
            <div className="exp-grid">
              {upcoming.map(exp => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  onClick={() => navigate(`/business/experience/${exp.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 && (
          <section className="exp-section">
            <h2 className="exp-section-title">Past</h2>
            <div className="exp-grid">
              {past.map(exp => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  onClick={() => navigate(`/business/experience/${exp.id}`)}
                  past
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function ExperienceCard({ experience, onClick, past = false }) {
  const countdown = countdownLabel(experience.experience_date)
  return (
    <button className={`exp-card ${past ? 'exp-card-past' : ''}`} onClick={onClick}>
      <div className="exp-card-accent" />
      <div className="exp-card-body">
        <div className="exp-card-name">{experience.name}</div>
        <div className="exp-card-date">{formatDate(experience.experience_date)}</div>
        {countdown && (
          <div className="exp-card-countdown">{countdown}</div>
        )}
      </div>
      <div className="exp-card-arrow">→</div>
    </button>
  )
}
