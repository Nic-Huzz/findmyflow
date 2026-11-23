/**
 * DebFlow.jsx — /try/deb
 *
 * Streamlined experience discovery for Deb's 50+ audience.
 * Flow: Landing → Experience Game → Select → Deep Dive → AI Paths → CTA
 * No auth required. All state in-memory.
 */
import { useState, useCallback } from 'react'
import ExperienceGameLive from '../components/ExperienceGameLive'
import { EXPERIENCE_ACTIVITIES } from '../data/voiceStems'
import { getSubNodes, CAREER_VECTORS } from '../data/experienceDomeSubNodes'
import { supabase } from '../lib/supabaseClient'
import './VoiceStemFlow.css'
import './ChooseQuestsFlow.css'

// Curated 22 activities — highest hit-rate for women 50+
const DEB_IDS = new Set([
  'exp-baking',            // Cooking / baking
  'exp-gardening',         // Gardening / growing food
  'sub-strength-2010',     // Day hikes / nature walks
  'sub-flexibility-1893',  // Yoga / stretching
  'exp-travel',            // Travel / exploring a new place
  'sub-written-1719',      // Reading novels
  'exp-drinks-friends',    // Drinks with friends / hanging out
  'exp-volunteering',      // Volunteering / giving back
  'sub-craft-1880',        // Painting / pottery / art workshops
  'exp-pets',              // Pet ownership / caring for animals
  'media-1826',            // Photography / visual storytelling
  'car-1886',              // Road trips / scenic drives
  'exp-swimming',          // Swimming / ocean
  'exp-hosting-home',      // Hosting people in your home
  'exp-coaching',          // Coaching / mentoring someone
  'exp-caring-kids',       // Caring for kids
  'sub-written-1999',      // Journaling / personal writing
  'exp-choosing-style',    // Dressing in a style you love
  'exp-nature-stillness',  // Being in nature without an activity
  'sub-oral-2015',         // Live music / concerts / festivals
  'exp-club-dancing',      // Dancing
  'exp-interior-design',   // Interior / spatial design
])

const DEB_ACTIVITIES = EXPERIENCE_ACTIVITIES.filter(a => DEB_IDS.has(a.id))

const DEB_CONTEXT = 'This person is a woman over 50 exploring what experiences bring her joy and purpose in this stage of life. Suggest life path directions that feel achievable, exciting, and meaningful for someone with decades of life experience. Avoid suggesting paths that assume youth, extreme fitness, or starting from scratch. Celebrate wisdom, depth, and the freedom that comes with this life stage.'

// Group activities by branch for display
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

  // Select step
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Deep dive step — { [nodeId]: { formats: Set, vectors: Set } }
  const [deepDive, setDeepDive] = useState({})
  const [ddIndex, setDdIndex] = useState(0)

  // AI results
  const [aiProjects, setAiProjects] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  // ── Toggle experience selection ──
  const toggleExp = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // ── Build enriched payload for suggest mode ──
  const buildDomeProfile = () => {
    const funActivities = gameResults?.fun || []
    const selected = funActivities
      .filter(a => selectedIds.has(a.id))
      .map(a => {
        const dd = deepDive[a.id]
        if (!dd) return { label: a.label }

        const vectors = dd.vectors?.size ? [...dd.vectors] : null
        const nonHobbyVectors = vectors?.filter(v => v !== 'hobby')

        // Hobby-only: exclude from AI payload
        if (!nonHobbyVectors?.length) return null

        const subNodes = getSubNodes(a.id)
        const formatLabels = dd.formats?.size
          ? subNodes.filter(s => dd.formats.has(s.id)).map(s => s.label)
          : null

        return {
          label: a.label,
          formats: formatLabels?.length ? formatLabels : null,
          vectors: nonHobbyVectors,
        }
      })
      .filter(Boolean)

    return { selected, context: DEB_CONTEXT }
  }

  // ── AI call (suggest mode — enriched with formats + vectors) ──
  const fetchPaths = async () => {
    setAiLoading(true)
    setAiError(null)
    setScreen('processing')
    try {
      const domeProfile = buildDomeProfile()
      const { data, error } = await supabase.functions.invoke('suggest-life-paths', {
        body: { domeProfile },
      })
      if (error) throw error
      if (data?.projects?.length) {
        setAiProjects(data.projects)
        // Save lead
        saveToLeads(gameResults, data.projects)
        setScreen('paths')
      } else {
        throw new Error('No projects returned')
      }
    } catch (err) {
      console.error('Path suggestion failed:', err)
      setAiError('Something went wrong generating your paths. Try refreshing.')
      setScreen('paths')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Save to deb_leads (fire and forget) ──
  const saveToLeads = (results, projects) => {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      fetch(`${url}/rest/v1/deb_leads`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_results: {
            fun: results.fun,
            notFun: results.notFun,
            uncertain: results.uncertain,
            selected: [...selectedIds],
            deepDive: Object.fromEntries(
              Object.entries(deepDive).map(([k, v]) => [k, { formats: [...(v.formats || [])], vectors: [...(v.vectors || [])] }])
            ),
            aiProjects: projects,
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
    if ((results.fun || []).length > 0) {
      setScreen('select')
    } else {
      setScreen('cta')
    }
  }

  // ── Render: dark theme screens (.vs) ──

  if (screen === 'landing' || screen === 'game') {
    return (
      <div className="vs">
        <div className="vs-container">
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
                {DEB_ACTIVITIES.length} activities. About 1 minute.
              </p>
              <div className="vs-bottom-action">
                <button className="vs-btn-primary" onClick={() => setScreen('game')}>
                  Let's go
                </button>
              </div>
            </div>
          )}

          {screen === 'game' && (
            <ExperienceGameLive
              activities={DEB_ACTIVITIES}
              onComplete={handleGameComplete}
            />
          )}
        </div>
      </div>
    )
  }

  // ── Render: light theme screens (.cqf) ──

  const funActivities = gameResults?.fun || []
  const funGroups = groupByBranch(funActivities)

  // ── SELECT ──
  if (screen === 'select') {
    const n = selectedIds.size
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-select-header">
            <h2>Which of these do you want<br/>more of in your life?</h2>
            <p>Pick the ones that made you feel most alive.</p>
          </div>
          <div className="cqf-count">{n === 0 ? '0 selected' : `${n} selected`}</div>

          {funGroups.map(group => (
            <div key={group.branch}>
              <div className="cqf-primal">{group.label}</div>
              {group.items.map(exp => (
                <div
                  key={exp.id}
                  className={`cqf-exp ${selectedIds.has(exp.id) ? 'selected' : ''}`}
                  onClick={() => toggleExp(exp.id)}
                >
                  <div className="cqf-exp-check">✓</div>
                  <span className="cqf-exp-name">{exp.label}</span>
                </div>
              ))}
            </div>
          ))}

          <div className="cqf-fixed">
            <button
              className="cqf-cta cqf-cta-gold"
              disabled={n === 0}
              onClick={() => { setDdIndex(0); setScreen('deep_dive') }}
            >
              {n === 0 ? 'Select at least 1 →' : 'Tell me more →'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── DEEP DIVE ──
  if (screen === 'deep_dive') {
    const selectedExps = funActivities.filter(a => selectedIds.has(a.id))
    const currentExp = selectedExps[ddIndex]

    if (!currentExp) {
      // Safety fallback — goNext should have already triggered fetchPaths
      return (
        <div className="cqf">
          <div className="cqf-container">
            <div className="cqf-processing"><div className="cqf-spinner" /></div>
          </div>
        </div>
      )
    }

    const subNodes = getSubNodes(currentExp.id)
    const hasFormats = subNodes.length > 0
    const dd = deepDive[currentExp.id] || { formats: new Set(), vectors: new Set() }

    const toggleFormat = (fmtId) => {
      setDeepDive(prev => {
        const existing = prev[currentExp.id] || { formats: new Set(), vectors: new Set() }
        const next = new Set(existing.formats)
        if (next.has(fmtId)) next.delete(fmtId)
        else next.add(fmtId)
        return { ...prev, [currentExp.id]: { ...existing, formats: next } }
      })
    }

    const toggleVector = (vecId) => {
      setDeepDive(prev => {
        const existing = prev[currentExp.id] || { formats: new Set(), vectors: new Set() }
        const next = new Set(existing.vectors)
        if (next.has(vecId)) next.delete(vecId)
        else next.add(vecId)
        return { ...prev, [currentExp.id]: { ...existing, vectors: next } }
      })
    }

    const canProceed = dd.vectors.size > 0 && (!hasFormats || dd.formats.size > 0)
    const isLast = ddIndex === selectedExps.length - 1

    const goNext = () => {
      if (isLast) {
        fetchPaths()
      } else {
        setDdIndex(ddIndex + 1)
        window.scrollTo(0, 0)
      }
    }

    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-dd-progress">
            {ddIndex + 1} of {selectedExps.length}
          </div>

          <div className="cqf-dd-header">
            <h2>{currentExp.label}</h2>
          </div>

          {hasFormats && (
            <div className="cqf-dd-section">
              <div className="cqf-dd-q">Which formats specifically?</div>
              <div className="cqf-dd-options">
                {subNodes.map(sub => (
                  <div
                    key={sub.id}
                    className={`cqf-dd-chip ${dd.formats.has(sub.id) ? 'selected' : ''}`}
                    onClick={() => toggleFormat(sub.id)}
                  >
                    <div className="cqf-dd-chip-check">✓</div>
                    <span>{sub.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="cqf-dd-section">
            <div className="cqf-dd-q">When you imagine doing more of this, what excites you?</div>
            <div className="cqf-dd-vectors">
              {CAREER_VECTORS.map(vec => (
                <div
                  key={vec.id}
                  className={`cqf-dd-vector ${dd.vectors.has(vec.id) ? 'selected' : ''}`}
                  onClick={() => toggleVector(vec.id)}
                >
                  <div className="cqf-dd-vector-check">✓</div>
                  <div>
                    <div className="cqf-dd-vector-label">{vec.label}</div>
                    <div className="cqf-dd-vector-sub">{vec.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cqf-fixed">
            <button className="cqf-cta cqf-cta-gold" disabled={!canProceed} onClick={goNext}>
              {hasFormats && dd.formats.size === 0 ? 'Pick at least one format' : dd.vectors.size === 0 ? 'Pick at least one option' : isLast ? 'Show me my paths →' : 'Next →'}
            </button>
            <button
              className="cqf-cta cqf-cta-secondary"
              onClick={() => {
                if (ddIndex > 0) { setDdIndex(ddIndex - 1); window.scrollTo(0, 0) }
                else setScreen('select')
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PROCESSING ──
  if (screen === 'processing') {
    const selectedLabels = funActivities.filter(a => selectedIds.has(a.id)).map(a => a.label)
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-processing">
            <div className="cqf-spinner" />
            <h2>Finding your life paths...</h2>
            <p>Based on what makes you feel alive, here's what you could pursue.</p>
            <div className="cqf-tags">
              {selectedLabels.map(l => <span key={l} className="cqf-tag">{l}</span>)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── PATHS (AI project suggestions) ──
  if (screen === 'paths') {
    return (
      <div className="cqf">
        <div className="cqf-container">
          {aiError && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p style={{ color: '#ef4444', marginBottom: 16 }}>{aiError}</p>
              <button className="cqf-cta cqf-cta-gold" onClick={fetchPaths}>
                Try again
              </button>
            </div>
          )}

          {aiProjects && (
            <>
              <div className="cqf-select-header" style={{ marginTop: 20 }}>
                <h2>Your Life Path Ideas</h2>
                <p>Based on what lights you up, here are directions you could explore.</p>
              </div>

              {aiProjects.map((project, i) => (
                <div key={i} className="cqf-exp selected" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6, cursor: 'default' }}>
                  <span className="cqf-exp-name" style={{ fontWeight: 700 }}>{project.name}</span>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(0,0,0,0.5)', lineHeight: 1.4 }}>
                    {project.description}
                  </span>
                  {project.draws_from && (
                    <span style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.3)', marginTop: 2 }}>
                      Draws from: {project.draws_from}
                    </span>
                  )}
                </div>
              ))}

              <div className="cqf-fixed">
                <button className="cqf-cta cqf-cta-gold" onClick={() => setScreen('cta')}>
                  See what's next →
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // ── CTA ──
  if (screen === 'cta') {
    return (
      <div className="cqf">
        <div className="cqf-container">
          <div className="cqf-processing" style={{ textAlign: 'center' }}>
            <h2>Ready to Build Your Paths?</h2>
            <p style={{ maxWidth: 320, margin: '0 auto', lineHeight: 1.6 }}>
              Vibe Rise helps you turn these directions into real life paths, with courage challenges, progress tracking, and an AI guide.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginTop: 24 }}>
              <a
                href="https://viberise.nichuzz.com/get-started"
                className="cqf-cta cqf-cta-gold"
                style={{ textDecoration: 'none', textAlign: 'center', width: '100%', maxWidth: 320 }}
              >
                Get started free
              </a>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(0,0,0,0.3)',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                onClick={() => {
                  setScreen('landing')
                  setGameResults(null)
                  setSelectedIds(new Set())
                  setDeepDive({})
                  setDdIndex(0)
                  setAiProjects(null)
                  setAiError(null)
                }}
              >
                Start over
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
