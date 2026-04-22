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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useExperienceList, daysUntil, formatExperienceDate } from '../hooks/useExperienceData'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import ScopeMapFlow from '../flows/ScopeMapFlow'
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
  const { user } = useAuth()
  const { experiences, loading, error } = useExperienceList()
  const [scopeMapResult, setScopeMapResult] = useState(undefined) // undefined = loading, null = none, object = has result
  const [scopeMapLoading, setScopeMapLoading] = useState(true)
  const [retaking, setRetaking] = useState(false)

  // Check if user has a scope map result
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      const { data } = await supabase
        .from('scope_map_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!cancelled) {
        setScopeMapResult(data || null)
        setScopeMapLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [user])

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
        {/* Hero — hidden during diagnostic (first-time or retake) */}
        {!(!loading && !error && !scopeMapLoading && !scopeMapResult && (experiences.length === 0 || retaking)) && (
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
              onClick={() => navigate('/create/experience/new')}
            >
              + New Experience
            </button>
          </header>
        )}

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

        {/* Returning user: Scope Map summary card */}
        {!scopeMapLoading && scopeMapResult && experiences.length > 0 && (
          <ScopeMapCard result={scopeMapResult} onRetake={() => { setScopeMapResult(null); setRetaking(true) }} />
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

        {/* Show Scope Map diagnostic: first-time (no experiences, no result) OR retaking */}
        {!loading && !error && !scopeMapLoading && !scopeMapResult && (experiences.length === 0 || retaking) && (
          <ScopeMapFlow onComplete={() => {
            setRetaking(false)
            if (user) {
              supabase
                .from('scope_map_results')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()
                .then(({ data }) => setScopeMapResult(data || null))
            }
          }} />
        )}

        {/* Empty state after scope map done but no experiences yet */}
        {!loading && !error && experiences.length === 0 && scopeMapResult && (
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
                  onClick={() => navigate(`/create/experience/${exp.id}`)}
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
                  onClick={() => navigate(`/create/experience/${exp.id}`)}
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

const STAGE_LABELS = {
  stream: { label: 'The Stream', emoji: '🏞️', short: "You're exploring what's yours" },
  lake: { label: 'The Lake', emoji: '🌊', short: "Finding your edge" },
  waterfall: { label: 'The Waterfall', emoji: '💧', short: "Building from your source" },
  river: { label: 'The River', emoji: '🌅', short: "Growing from specificity" },
}

function ScopeMapCard({ result, onRetake }) {
  const info = STAGE_LABELS[result.stage] || STAGE_LABELS.lake
  return (
    <div className="exp-reflection-card" style={{ marginBottom: 32 }}>
      <div className="exp-reflection-header">
        <span className="exp-reflection-icon">{info.emoji}</span>
        <div>
          <div className="exp-reflection-eyebrow">Your flow stage</div>
          <div className="exp-reflection-name">{info.label}</div>
        </div>
      </div>
      <p className="exp-reflection-body" style={{ fontStyle: 'normal' }}>{info.short}</p>
      <button
        onClick={onRetake}
        style={{
          marginTop: 12,
          padding: '6px 16px',
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8,
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Retake
      </button>
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
