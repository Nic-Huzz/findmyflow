/**
 * DebFlow.jsx — /try/deb
 *
 * Streamlined experience discovery for Deb's 50+ audience.
 * Flow: Landing → Experience Game → AI Path Results → CTA
 * No auth required. All state in-memory.
 */
import { useState } from 'react'
import ExperienceGameLive from '../components/ExperienceGameLive'
import { EXPERIENCE_ACTIVITIES } from '../data/voiceStems'
import { supabase } from '../lib/supabaseClient'
import './VoiceStemFlow.css'

// IDs to exclude — confirmed cuts for 50+ women audience
const EXCLUDED_IDS = new Set([
  'sub-martial-1900',      // Martial arts / combat sports
  'exp-rapping',           // Rapping / freestyle
  'exp-thrill',            // Adrenaline / thrill ride
  'car-1952',              // Backpacking / gap years / exploring
])

// Label overrides — same activity, better framing for this audience
const LABEL_OVERRIDES = {
  'sub-alt-2011': 'Caravan life',
}

const DEB_ACTIVITIES = EXPERIENCE_ACTIVITIES
  .filter(a => !EXCLUDED_IDS.has(a.id))
  .map(a => LABEL_OVERRIDES[a.id] ? { ...a, label: LABEL_OVERRIDES[a.id] } : a)

const DEB_CONTEXT = 'This person is a woman over 50 exploring what experiences bring her joy and purpose in this stage of life. Suggest life path directions that feel achievable, exciting, and meaningful for someone with decades of life experience. Avoid suggesting paths that assume youth, extreme fitness, or starting from scratch. Celebrate wisdom, depth, and the freedom that comes with this life stage.'

// Group fun activities by branch for display
function groupByBranch(activities) {
  const groups = {}
  activities.forEach(a => {
    const branch = a.branch || 'other'
    if (!groups[branch]) groups[branch] = []
    groups[branch].push(a)
  })
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([branch, items]) => ({
      branch,
      label: branch.charAt(0).toUpperCase() + branch.slice(1),
      items,
    }))
}

export default function DebFlow() {
  const [screen, setScreen] = useState('landing')
  const [gameResults, setGameResults] = useState(null)
  const [aiPaths, setAiPaths] = useState(null)
  const [aiPattern, setAiPattern] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  // ── AI call ──
  const fetchPaths = async (funActivities, fullResults) => {
    setAiLoading(true)
    setAiError(null)
    try {
      const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
        body: {
          mode: 'mini_analysis',
          domeProfile: {
            selected: funActivities.map(a => a.label),
            context: DEB_CONTEXT,
          },
        },
      })
      if (error) throw error
      if (data?.paths) {
        setAiPaths(data.paths)
        setAiPattern(data.pattern || null)
        // Save lead as soon as paths arrive (users may close before CTA)
        saveToLeads(fullResults, data.paths)
      } else {
        throw new Error('No paths returned')
      }
    } catch (err) {
      console.error('Path suggestion failed:', err)
      setAiError('Something went wrong generating your paths. Try refreshing.')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Save to public_leads (fire and forget) ──
  const saveToLeads = (results, paths) => {
    try {
      const sessionId = crypto.randomUUID()
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      fetch(`${url}/rest/v1/public_leads?on_conflict=email`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates',
        },
        body: JSON.stringify({
          id: sessionId,
          email: `anon-${sessionId}@deb-flow.local`,
          source_flow: 'deb_experience_discovery',
          flow_results: {
            fun: results.fun,
            notFun: results.notFun,
            uncertain: results.uncertain,
            aiPaths: paths,
          },
        }),
      })
    } catch {
      // Non-fatal
    }
  }

  // ── Handle game completion ──
  const handleGameComplete = (results) => {
    setGameResults(results)
    setScreen('results')
    // Fire AI call immediately
    if (results.fun?.length > 0) {
      fetchPaths(results.fun, results)
    }
  }

  // ── Render ──
  return (
    <div className="vs">
      <div className="vs-container">

        {/* ── LANDING ── */}
        {screen === 'landing' && (
          <div className="vs-landing">
            <div className="vs-landing-label">With Deb</div>
            <h1>Discover What Lights You Up</h1>
            <p className="vs-landing-desc">
              Deb sent you here because she believes every woman deserves to know what makes her come alive. This quick game maps the experiences that light you up and shows you where they could take you.
            </p>
            <p className="vs-landing-desc" style={{ marginTop: 12 }}>
              You'll see activities one at a time. For each one, tap <strong>"fun"</strong> or <strong>"not fun."</strong> Go fast. Trust your gut. No wrong answers.
            </p>
            <p className="vs-landing-desc" style={{ marginTop: 12, opacity: 0.7 }}>
              {DEB_ACTIVITIES.length} activities. About 3 minutes.
            </p>
            <div className="vs-bottom-action">
              <button
                className="vs-btn-primary"
                onClick={() => setScreen('game')}
              >
                Let's go
              </button>
            </div>
          </div>
        )}

        {/* ── EXPERIENCE GAME ── */}
        {screen === 'game' && (
          <ExperienceGameLive
            activities={DEB_ACTIVITIES}
            onComplete={handleGameComplete}
          />
        )}

        {/* ── RESULTS + AI PATHS ── */}
        {screen === 'results' && gameResults && (
          <div className="vs-results">
            <div className="vs-results-header">
              <h2>Your Experiences</h2>
              <p style={{ color: 'var(--vs-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                {(gameResults.fun || []).length} things that light you up
              </p>
            </div>

            {/* Fun activities grouped by branch */}
            {groupByBranch(gameResults.fun || []).map(group => (
              <div className="vs-results-card" key={group.branch}>
                <h4>{group.label}</h4>
                <div className="vs-exp-result-list">
                  {group.items.map(a => (
                    <span key={a.id} className="vs-exp-tag vs-exp-tag-fun">{a.label}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* AI-generated paths */}
            {aiLoading && (
              <div className="vs-results-card" style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--vs-muted)' }}>
                  Finding your paths...
                </p>
              </div>
            )}

            {aiError && (
              <div className="vs-results-card">
                <p style={{ color: '#ef4444' }}>{aiError}</p>
                <button
                  className="vs-btn-primary"
                  style={{ marginTop: 12 }}
                  onClick={() => fetchPaths(gameResults.fun, gameResults)}
                >
                  Try again
                </button>
              </div>
            )}

            {aiPaths && !aiLoading && (
              <>
                <div className="vs-results-header" style={{ marginTop: 24 }}>
                  <h2>Your Path Directions</h2>
                </div>

                {aiPaths.map((path, i) => (
                  <div className="vs-results-card" key={i}>
                    <h4>{path.name}</h4>
                    <p style={{ color: 'var(--vs-muted)', fontSize: '0.9rem', margin: '6px 0 10px' }}>
                      {path.description}
                    </p>
                    {path.experiences?.length > 0 && (
                      <div className="vs-exp-result-list">
                        {path.experiences.map((exp, j) => (
                          <span key={j} className="vs-exp-tag vs-exp-tag-fun">{exp}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {aiPattern && (
                  <div className="vs-results-card" style={{ borderLeft: '3px solid var(--vs-gold)' }}>
                    <h4>The Thread</h4>
                    <p style={{ color: 'var(--vs-muted)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                      {aiPattern}
                    </p>
                  </div>
                )}

                <div className="vs-bottom-action">
                  <button
                    className="vs-btn-primary"
                    onClick={() => setScreen('cta')}
                  >
                    See what's next
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── CTA ── */}
        {screen === 'cta' && (
          <div className="vs-landing">
            <h1>Ready to Build Your Paths?</h1>
            <p className="vs-landing-desc">
              Vibe Rise helps you turn these directions into real life paths, with courage challenges, progress tracking, and an AI guide.
            </p>
            <div className="vs-bottom-action" style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <a
                href="https://viberise.nichuzz.com/get-started"
                className="vs-btn-primary"
                style={{ textDecoration: 'none', textAlign: 'center' }}
              >
                Get started free
              </a>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--vs-muted)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => {
                  setScreen('landing')
                  setGameResults(null)
                  setAiPaths(null)
                  setAiPattern(null)
                  setAiError(null)
                }}
              >
                Start over
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
