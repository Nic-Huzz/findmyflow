import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './PlayProfile.css'

function renderParagraphs(text) {
  if (!text) return null
  const cleaned = text
    .replace(/\*\*/g, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^#+\s*/gm, '')
  const paras = cleaned.split(/\n\n+/).filter(Boolean)
  if (paras.length <= 1) return cleaned
  return paras.map((p, i) => <p key={i} style={{ margin: '0 0 10px' }}>{p}</p>)
}

const TYPE_META = {
  DO_IT:    { label: 'DO IT',    className: 'do-it' },
  CUT_IT:   { label: 'CUT IT',   className: 'cut-it' },
  THINK_IT: { label: 'THINK IT', className: 'think-it' },
  MAKE_IT:  { label: 'MAKE IT',  className: 'make-it' },
}

const COMPASS_META = {
  north: { emoji: '🌊', label: 'Flow' },
  east:  { emoji: '🔄', label: 'Redirect' },
  south: { emoji: '🛏️', label: 'Rest' },
  west:  { emoji: '🙏', label: 'Honour' },
}

export default function PlayProfileDashboard({ userId }) {
  const [loading, setLoading] = useState(true)
  const [dnaResult, setDnaResult] = useState(null)
  const [activeSessions, setActiveSessions] = useState([])
  const [activeIdx, setActiveIdx] = useState(0)
  const [completedSessions, setCompletedSessions] = useState([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      try {
        const [resultRes, activeRes, historyRes] = await Promise.all([
          supabase
            .from('founder_dna_results')
            .select('matched_founder, matched_founder_company, archetype')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle(),
          supabase
            .from('founder_dna_sessions')
            .select('id, stuck_point_name, challenge_name, challenge_type, challenge_action, created_at')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false }),
          supabase
            .from('founder_dna_sessions')
            .select('id, stuck_point_name, challenge_name, challenge_type, resistance_rating, engagement_rating, shift_rating, voice_type, compass_direction, rated_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('rated_at', { ascending: false })
            .limit(5),
        ])

        setDnaResult(resultRes.data || null)
        setActiveSessions(activeRes.data || [])
        setCompletedSessions(historyRes.data || [])
      } catch (err) {
        console.error('PlayProfileDashboard load error:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [userId])

  if (loading) {
    return (
      <div className="play-profile-quiz" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div className="pp-spinner" />
        <p className="pp-subtitle">Loading...</p>
      </div>
    )
  }

  // No DNA result — empty state
  if (!dnaResult) {
    return (
      <div className="play-profile-quiz">
        <div className="pp-empty-state pp-fade-in-up">
          <div className="pp-empty-icon">🧬</div>
          <h2>Discover Your Founder DNA</h2>
          <p className="pp-subtitle" style={{ marginBottom: 24 }}>
            Find out which famous founder thinks like you — and get personalized challenges based on their playbook.
          </p>
          <a href="/play-profile" className="pp-btn-gold" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
            Take the Quiz
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="play-profile-quiz">
      {/* Active challenge card(s) */}
      {activeSessions.length > 0 && (() => {
        const safeIdx = Math.min(activeIdx, activeSessions.length - 1)
        const activeSession = activeSessions[safeIdx]
        return (
          <div className="pp-active-challenge pp-fade-in-up">
            <div className="pp-points-pill">+10 RP</div>
            <div className="pp-active-label">Active Challenge</div>
            {activeSession.challenge_name && (
              <div className="pp-challenge-name">{activeSession.challenge_name}</div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="pp-session-stuck">{activeSession.stuck_point_name}</span>
              {activeSession.challenge_type && (
                <span className={`pp-type-badge ${(TYPE_META[activeSession.challenge_type] || TYPE_META.DO_IT).className}`}>
                  {(TYPE_META[activeSession.challenge_type] || TYPE_META.DO_IT).label}
                </span>
              )}
            </div>
            {activeSession.challenge_action && (
              <>
                {expanded ? (
                  <div className="pp-active-text">
                    {renderParagraphs(activeSession.challenge_action)}
                  </div>
                ) : (
                  <div className="pp-active-text pp-clamped">
                    {activeSession.challenge_action.replace(/\*\*/g, '').replace(/\*([^*]+)\*/g, '$1')}
                  </div>
                )}
                {activeSession.challenge_action.length > 150 && (
                  <button
                    className="pp-read-more"
                    onClick={() => setExpanded(prev => !prev)}
                  >
                    {expanded ? 'Show less' : 'Read more'}
                  </button>
                )}
              </>
            )}
            <a
              href={`/play-profile?mode=rate&sessionId=${activeSession.id}`}
              className="pp-btn-gold"
              style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '10px 20px', fontSize: 14 }}
            >
              Complete This Challenge
            </a>
            {activeSessions.length > 1 && (
              <div className="pp-carousel-nav">
                <button
                  className="pp-carousel-arrow"
                  onClick={() => { setActiveIdx(i => i - 1); setExpanded(false) }}
                  disabled={safeIdx === 0}
                >
                  ‹
                </button>
                <span className="pp-carousel-dots">
                  {activeSessions.map((_, i) => (
                    <span
                      key={i}
                      className={`pp-carousel-dot${i === safeIdx ? ' active' : ''}`}
                      onClick={() => { setActiveIdx(i); setExpanded(false) }}
                    />
                  ))}
                </span>
                <button
                  className="pp-carousel-arrow"
                  onClick={() => { setActiveIdx(i => i + 1); setExpanded(false) }}
                  disabled={safeIdx === activeSessions.length - 1}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* DNA Card */}
      <div className="pp-dashboard-card pp-fade-in-up pp-stagger-2">
        <div>
          <div className="pp-founder-mini">{dnaResult.matched_founder}</div>
          <div className="pp-archetype-mini">{dnaResult.archetype}</div>
          {dnaResult.matched_founder_company && (
            <div style={{ fontSize: 12, color: '#adb5bd', marginTop: 2 }}>{dnaResult.matched_founder_company}</div>
          )}
        </div>
      </div>

      {/* CTAs */}
      <div className="pp-fade-in-up pp-stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
        <a
          href="/play-profile?mode=unstuck"
          className="pp-btn-gold"
          style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          Get Unstuck
        </a>
        <a
          href="/play-profile?mode=retake"
          className="pp-btn-ghost"
          style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}
        >
          Retake Quiz
        </a>
      </div>

      {/* Session History */}
      {completedSessions.length > 0 && (
        <div className="pp-history-card pp-fade-in-up pp-stagger-4">
          <div className="pp-history-header">
            <div className="pp-history-header-left">
              <span className="pp-history-icon">🏆</span>
              <span className="pp-history-title">Past Challenges</span>
            </div>
            <span className="pp-history-count">{completedSessions.length}</span>
          </div>
          <div className="pp-history-items">
            {completedSessions.map(session => {
              const meta = TYPE_META[session.challenge_type] || TYPE_META.DO_IT
              const compass = COMPASS_META[session.compass_direction]
              const hasNewFormat = !!session.compass_direction
              return (
                <div key={session.id} className="pp-history-row">
                  <div className="pp-history-check">✓</div>
                  <div className="pp-history-body">
                    {session.challenge_name && (
                      <div className="pp-history-name">{session.challenge_name}</div>
                    )}
                    <div className="pp-history-meta">
                      <span className="pp-history-stuck">{session.stuck_point_name}</span>
                      <span className={`pp-type-badge ${meta.className}`}>{meta.label}</span>
                    </div>
                    <div className="pp-history-date">
                      {session.rated_at ? new Date(session.rated_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                  {hasNewFormat ? (
                    <div className="pp-history-badges">
                      {session.voice_type && (
                        <span>{session.voice_type === 'essence' ? '🌟' : '🛡️'}</span>
                      )}
                      {compass && (
                        <span title={compass.label}>{compass.emoji}</span>
                      )}
                    </div>
                  ) : (
                    <div className="pp-mini-bars">
                      <div className="pp-mini-bar resistance" style={{ height: (session.resistance_rating || 1) * 5 }} />
                      <div className="pp-mini-bar engagement" style={{ height: (session.engagement_rating || 1) * 5 }} />
                      <div className="pp-mini-bar shift" style={{ height: (session.shift_rating || 1) * 5 }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
