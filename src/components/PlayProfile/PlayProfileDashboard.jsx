import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import './PlayProfile.css'

const TYPE_META = {
  DO_IT:    { label: 'DO IT',    className: 'do-it' },
  CUT_IT:   { label: 'CUT IT',   className: 'cut-it' },
  THINK_IT: { label: 'THINK IT', className: 'think-it' },
  MAKE_IT:  { label: 'MAKE IT',  className: 'make-it' },
}

export default function PlayProfileDashboard({ userId }) {
  const [loading, setLoading] = useState(true)
  const [dnaResult, setDnaResult] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [completedSessions, setCompletedSessions] = useState([])

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function load() {
      try {
        const [resultRes, activeRes, historyRes] = await Promise.all([
          supabase
            .from('founder_dna_results')
            .select('matched_founder, matched_founder_company, archetype, dna_code')
            .eq('user_id', userId)
            .limit(1)
            .maybeSingle(),
          supabase
            .from('founder_dna_sessions')
            .select('id, stuck_point_name, challenge_type, challenge_action, created_at')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('founder_dna_sessions')
            .select('id, stuck_point_name, challenge_type, resistance_rating, engagement_rating, shift_rating, rated_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('rated_at', { ascending: false })
            .limit(5),
        ])

        setDnaResult(resultRes.data || null)
        setActiveSession(activeRes.data || null)
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
      {/* Active challenge card */}
      {activeSession && (
        <div className="pp-active-challenge pp-fade-in-up">
          <div className="pp-active-label">Active Challenge</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span className="pp-session-stuck">{activeSession.stuck_point_name}</span>
            {activeSession.challenge_type && (
              <span className={`pp-type-badge ${(TYPE_META[activeSession.challenge_type] || TYPE_META.DO_IT).className}`}>
                {(TYPE_META[activeSession.challenge_type] || TYPE_META.DO_IT).label}
              </span>
            )}
          </div>
          {activeSession.challenge_action && (
            <div className="pp-active-text">{activeSession.challenge_action}</div>
          )}
          <a
            href={`/play-profile?mode=rate&sessionId=${activeSession.id}`}
            className="pp-btn-gold"
            style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '10px 20px', fontSize: 14 }}
          >
            Rate This Challenge
          </a>
        </div>
      )}

      {/* DNA Card */}
      <div className="pp-dashboard-card pp-fade-in-up pp-stagger-2">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="pp-founder-mini">{dnaResult.matched_founder}</div>
            <div className="pp-archetype-mini">{dnaResult.archetype}</div>
            {dnaResult.matched_founder_company && (
              <div style={{ fontSize: 12, color: '#adb5bd', marginTop: 2 }}>{dnaResult.matched_founder_company}</div>
            )}
          </div>
          <div className="pp-dna-mini">{dnaResult.dna_code}</div>
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
        <div className="pp-fade-in-up pp-stagger-4">
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6c757d', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Past Challenges
          </div>
          {completedSessions.map(session => {
            const meta = TYPE_META[session.challenge_type] || TYPE_META.DO_IT
            return (
              <div key={session.id} className="pp-session-row">
                <div className="pp-session-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="pp-session-stuck">{session.stuck_point_name}</span>
                    <span className={`pp-type-badge ${meta.className}`}>{meta.label}</span>
                  </div>
                  <div className="pp-session-date">
                    {session.rated_at ? new Date(session.rated_at).toLocaleDateString() : ''}
                  </div>
                </div>
                <div className="pp-mini-bars">
                  <div className="pp-mini-bar resistance" style={{ height: (session.resistance_rating || 1) * 5 }} />
                  <div className="pp-mini-bar engagement" style={{ height: (session.engagement_rating || 1) * 5 }} />
                  <div className="pp-mini-bar shift" style={{ height: (session.shift_rating || 1) * 5 }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
