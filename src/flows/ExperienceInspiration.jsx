import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess } from '../lib/haptics'
import './ExperienceInspiration.css'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}

export default function ExperienceInspiration() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [allCreators, setAllCreators] = useState([])
  const [selected, setSelected] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // AI results
  const [blend, setBlend] = useState(null)
  const [ideas, setIdeas] = useState([])
  const [selectedIdea, setSelectedIdea] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Step 4 form
  const [expName, setExpName] = useState('')
  const [expDate, setExpDate] = useState('')
  const [expType, setExpType] = useState('workshop')
  const [creating, setCreating] = useState(false)

  // User data
  const [userPlaySkills, setUserPlaySkills] = useState([])
  const blendAbortRef = useRef(null)

  // ── Load creator data ────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [careerRes, dnaRes] = await Promise.all([
          fetch('/data/careerModels.json'),
          fetch('/data/experienceCreatorDNA.json'),
        ])
        const careerData = await careerRes.json()
        const dnaData = await dnaRes.json()

        if (!careerData?.profiles || !dnaData?.profiles) {
          console.error('Creator data missing profiles key')
          return
        }

        const dnaMap = {}
        for (const p of dnaData.profiles) {
          dnaMap[p.name] = p
        }

        const merged = careerData.profiles
          .filter(p => dnaMap[p.name])
          .map(p => ({
            name: p.name,
            domain: p.domain || '',
            primarySkills: p.primarySkills || [],
            experienceType: dnaMap[p.name]?.experienceType || 'workshop',
            oneLiner: p.oneLiner || '',
            scaleModel: p.careerModel?.scaleModel || '',
            keyDecision: p.careerModel?.keyDecision || '',
            lessonsForUser: p.careerModel?.lessonsForUser || '',
          }))
          .sort((a, b) => a.name.localeCompare(b.name))

        setAllCreators(merged)
      } catch (err) {
        console.error('Failed to load creator data:', err)
      }
    }
    loadData()
  }, [])

  // ── Load user play-skills ────────────────────────────────────
  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('nikigai_clusters')
        .select('cluster_label')
        .eq('user_id', user.id)
        .eq('flow_type', 'skills')
      if (data?.length) {
        setUserPlaySkills(data.map(d => d.cluster_label))
      }
    }
    load()
  }, [user])

  // ── Pre-load previous matching selections ────────────────────
  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('experience_creator_selections')
        .select('selected_creators')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data?.selected_creators?.length) {
        setSelected(data.selected_creators)
      }
    }
    load()
  }, [user])

  // ── Derived data ─────────────────────────────────────────────
  const experienceTypes = useMemo(() => {
    const types = new Set(allCreators.map(c => c.experienceType))
    return ['all', ...Array.from(types).sort()]
  }, [allCreators])

  const filteredCreators = useMemo(() => {
    let list = allCreators
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q) ||
        c.primarySkills.some(s => s.toLowerCase().includes(q))
      )
    }
    if (typeFilter !== 'all') {
      list = list.filter(c => c.experienceType === typeFilter)
    }
    return list
  }, [allCreators, search, typeFilter])

  // ── Handlers ─────────────────────────────────────────────────
  function toggleCreator(name) {
    hapticLight()
    setSelected(prev => {
      if (prev.includes(name)) return prev.filter(n => n !== name)
      if (prev.length >= 5) return prev
      return [...prev, name]
    })
  }

  async function generateBlend() {
    setError(null)
    setLoading(true)
    setBlend(null)
    setIdeas([])
    setStep(2)
    window.scrollTo(0, 0)

    const controller = new AbortController()
    blendAbortRef.current = controller

    try {
      const creatorData = selected
        .map(name => allCreators.find(c => c.name === name))
        .filter(Boolean)

      const session = await supabase.auth.getSession()
      const token = session.data.session?.access_token

      const res = await fetch(`${SUPABASE_URL}/functions/v1/experience-blueprint-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'generate_experience_ideas',
          creators: creatorData,
          userPlaySkills,
        }),
        signal: controller.signal,
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setBlend(data.blend)
      setIdeas(data.ideas || [])
      if (data.ideas?.length) {
        setSelectedIdea(0)
        setExpName(data.ideas[0].name)
        setExpType(data.ideas[0].format || 'workshop')
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      console.error('Blend generation failed:', err)
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function selectIdea(index) {
    hapticLight()
    setSelectedIdea(index)
    if (ideas[index]) {
      setExpName(ideas[index].name)
      setExpType(ideas[index].format || 'workshop')
    }
  }

  function goToStep(n) {
    if (n < 2 && blendAbortRef.current) {
      blendAbortRef.current.abort()
      blendAbortRef.current = null
      setLoading(false)
    }
    setStep(n)
    window.scrollTo(0, 0)
  }

  async function createExperience() {
    const name = expName.trim()
    if (!name || name.length < 3) return
    setCreating(true)
    setError(null)

    try {
      const inspiration = {
        selectedCreators: selected,
        blend,
        chosenConcept: selectedIdea >= 0 && ideas[selectedIdea] ? ideas[selectedIdea] : null,
      }

      const payload = {
        user_id: user.id,
        name,
        experience_date: expDate || null,
        experience_type: expType,
        status: 'upcoming',
      }

      payload.inspiration = inspiration

      const { data: exp, error: insertErr } = await supabase
        .from('experiences')
        .insert(payload)
        .select('id')
        .single()

      if (insertErr) {
        // Retry without inspiration if column doesn't exist (42703 = undefined_column)
        if (insertErr.code === '42703' || insertErr.code === 'PGRST204') {
          delete payload.inspiration
          const { data: exp2, error: err2 } = await supabase
            .from('experiences')
            .insert(payload)
            .select('id')
            .single()
          if (err2) throw err2
          hapticSuccess()
          navigate(`/create/experience/${exp2.id}`)
          return
        }
        throw insertErr
      }

      // Seed checklist
      try {
        const { buildChecklistRows } = await import('../lib/experienceChecklistTemplate')
        const rows = buildChecklistRows(exp.id, user.id, expType)
        if (rows.length) {
          await supabase.from('experience_checklist_items').insert(rows)
        }
      } catch (err) {
        console.error('Checklist seeding failed:', err)
      }

      hapticSuccess()
      navigate(`/create/experience/${exp.id}`)
    } catch (err) {
      console.error('Failed to create experience:', err)
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="ei-container">
      <div className="ei-toolbar">
        <button
          className="ei-back"
          onClick={() => {
            if (step > 1) goToStep(step - 1)
            else navigate(-1)
          }}
        >
          ←
        </button>
        <div className="ei-toolbar-title">Find Inspiration</div>
      </div>

      <div className="ei-content">
        {/* Progress dots */}
        <div className="ei-progress">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`ei-dot${s === step ? ' active' : s < step ? ' done' : ''}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div>
            <div className="ei-label">Step 1</div>
            <div className="ei-title">Who inspires you?</div>
            <div className="ei-sub">
              Pick 2-5 creators whose experiences inspire the kind of work you want to do.
            </div>

            <input
              type="text"
              className="ei-search"
              placeholder="Search creators..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="ei-type-filters">
              {experienceTypes.map(t => (
                <button
                  key={t}
                  className={`ei-type-pill${typeFilter === t ? ' active' : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t === 'all' ? 'All' : t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div className="ei-selected-count">
              <strong>{selected.length}</strong> of 5 selected
            </div>

            {filteredCreators.length === 0 ? (
              <div className="ei-empty">No creators match your search.</div>
            ) : (
              <div className="ei-creator-grid">
                {filteredCreators.map(c => (
                  <div
                    key={c.name}
                    className={`ei-creator-card${selected.includes(c.name) ? ' selected' : ''}`}
                    onClick={() => toggleCreator(c.name)}
                  >
                    <div className="ei-avatar">{getInitials(c.name)}</div>
                    <div className="ei-creator-name">{c.name}</div>
                    <div className="ei-creator-type">{c.experienceType.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            )}

            <button
              className="ei-btn-primary"
              disabled={selected.length < 2}
              onClick={generateBlend}
            >
              Find My Blend →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="ei-label">Your blend</div>
            <div className="ei-title">Here's what makes your combination unique.</div>

            {loading ? (
              <div className="ei-loading">
                <div className="ei-spinner" />
                <div className="ei-loading-text">
                  Finding the intersection between your creators...
                </div>
              </div>
            ) : error ? (
              <div className="ei-error">
                {error}
                <br />
                <button className="ei-retry-btn" onClick={generateBlend}>
                  Try Again
                </button>
              </div>
            ) : blend ? (
              <>
                <div className="ei-blend-card">
                  <div className="ei-blend-label">Your north stars</div>
                  <div className="ei-blend-creators">
                    {selected.map(name => (
                      <span key={name} className="ei-blend-chip">{name}</span>
                    ))}
                  </div>

                  {blend.shared?.length > 0 && (
                    <div className="ei-blend-shared">
                      <div className="ei-blend-shared-label">What they share</div>
                      <div className="ei-blend-tags">
                        {blend.shared.map((tag, i) => (
                          <span key={i} className="ei-blend-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {blend.unique && (
                    <div className="ei-blend-unique">{blend.unique}</div>
                  )}
                </div>

                <button className="ei-btn-primary" onClick={() => goToStep(3)}>
                  Show Me Experience Ideas →
                </button>
              </>
            ) : null}
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="ei-label">Inspired by your blend</div>
            <div className="ei-title">3 experiences you could create.</div>
            <div className="ei-sub">Tap the one that excites you most.</div>

            {ideas.map((idea, i) => (
              <div
                key={i}
                className={`ei-idea-card${selectedIdea === i ? ' selected' : ''}`}
                onClick={() => selectIdea(i)}
              >
                <div className="ei-idea-header">
                  <div className="ei-idea-number">{i + 1}</div>
                  <div className="ei-idea-name">{idea.name}</div>
                </div>
                <div className="ei-idea-meta">
                  <span className="ei-idea-tag">{idea.format}</span>
                  <span className="ei-idea-tag">{idea.duration}</span>
                </div>
                <div className="ei-idea-desc">{idea.description}</div>
                <div className="ei-idea-inspired">{idea.inspiredBy}</div>
              </div>
            ))}

            <div className="ei-or-divider">or</div>

            <button
              className="ei-own-idea-btn"
              onClick={() => {
                setExpName('')
                setExpType('workshop')
                setSelectedIdea(-1)
                goToStep(4)
              }}
            >
              I have my own idea →
            </button>

            <button
              className="ei-btn-primary"
              disabled={selectedIdea < 0}
              onClick={() => goToStep(4)}
            >
              Use This Idea →
            </button>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="ei-label">Create your experience</div>
            <div className="ei-title">Let's make it real.</div>

            {selectedIdea >= 0 && ideas[selectedIdea] && (
              <div className="ei-inspired-by">
                <strong>Inspired by:</strong> {ideas[selectedIdea].name} (
                {selected.join(' + ')} blend)
              </div>
            )}

            <div className="ei-field">
              <label>Experience name</label>
              <input
                type="text"
                value={expName}
                onChange={e => setExpName(e.target.value)}
                placeholder="e.g. Shaking Breathwork"
                maxLength={80}
              />
            </div>

            <div className="ei-field">
              <label>Date</label>
              <input
                type="date"
                value={expDate}
                onChange={e => setExpDate(e.target.value)}
              />
            </div>

            <div className="ei-field">
              <label>Type</label>
              <select value={expType} onChange={e => setExpType(e.target.value)}>
                <option value="workshop">Workshop</option>
                <option value="retreat">Retreat</option>
                <option value="circle">Circle</option>
                <option value="online">Online Session</option>
                <option value="one_on_one">1:1 Session</option>
                <option value="popup">Pop-up Event</option>
                <option value="course">Course</option>
              </select>
            </div>

            {error && <div className="ei-error">{error}</div>}

            <button
              className="ei-btn-primary"
              disabled={creating || !expName.trim() || expName.trim().length < 3}
              onClick={createExperience}
            >
              {creating ? 'Creating...' : 'Create Experience →'}
            </button>

            <button className="ei-btn-secondary" onClick={() => goToStep(3)}>
              ← Back to ideas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
