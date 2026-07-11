/**
 * CuriosityMapFlow.jsx — /curiosity-map
 * "What are you drawn to?"
 *
 * Flow: Welcome → Add Content (gamified milestones) → Episodes (optional) → AI Clustering → Results
 * Saves to curiosity_inputs + curiosity_clusters tables.
 * Results show plain-language clusters with icons. CTA: return to quests or career alignment.
 */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { supabase } from '../lib/supabaseClient'
import { hapticLight, hapticSuccess, hapticMedium } from '../lib/haptics'
import { compressImage } from '../lib/screenshotAnalysis'
import './CuriosityMapFlow.css'

const STEPS = {
  WELCOME: 'welcome',
  ADD_CONTENT: 'add_content',
  EPISODES: 'episodes',
  PROCESSING: 'processing',
  RESULTS: 'results',
}

const CONTENT_TYPES = [
  { value: 'book', label: 'Book', icon: '\u{1F4D6}' },
  { value: 'podcast', label: 'Podcast', icon: '\u{1F3A7}' },
  { value: 'documentary', label: 'Documentary', icon: '\u{1F3AC}' },
  { value: 'youtube', label: 'YouTube', icon: '\u{1F4F1}' },
  { value: 'course', label: 'Course', icon: '\u{1F393}' },
]

const TYPE_ICONS = Object.fromEntries(CONTENT_TYPES.map(t => [t.value, t.icon]))

const MILESTONES = [
  { count: 3, label: '3 added', reward: 'Unlock your map' },
  { count: 5, label: '5 added', reward: 'Sharper clusters' },
  { count: 10, label: '10+ added', reward: 'Full portrait' },
]

// Map branches to plain-language icons (user never sees branch names)
const CLUSTER_ICONS = {
  movement: '\u{1F3C3}',
  nourishment: '\u{1F33F}',
  tools: '\u{1F9E0}',
  status: '\u2728',
  bonds: '\u{1F91D}',
  shelter: '\u{1F3E1}',
  story: '\u{1F4D6}',
  fire: '\u{1F525}',
  healing: '\u{1F49C}',
  threat: '\u26A1',
  default: '\u2728',
}

export default function CuriosityMapFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(STEPS.WELCOME)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  // Hide bottom toolbar
  useEffect(() => {
    document.body.classList.add('hide-toolbar')
    return () => document.body.classList.remove('hide-toolbar')
  }, [])

  // Content items
  const [items, setItems] = useState([])
  const [currentTitle, setCurrentTitle] = useState('')
  const [currentType, setCurrentType] = useState('book')

  // Image upload
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  // Episodes (optional drill-down)
  const [episodes, setEpisodes] = useState({}) // { itemIndex: ['ep1', 'ep2'] }

  // Results
  const [clusters, setClusters] = useState([])
  const [processingText, setProcessingText] = useState('Reading your curiosities...')

  // Existing data
  const [existingInputs, setExistingInputs] = useState([])
  const [loading, setLoading] = useState(true)

  // Load existing data
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const [{ data: inputs }, { data: clusterData }] = await Promise.all([
          supabase.from('curiosity_inputs').select('*').eq('user_id', user.id).order('created_at'),
          supabase.from('curiosity_clusters').select('*').eq('user_id', user.id),
        ])
        if (inputs?.length) {
          setExistingInputs(inputs)
          setItems(inputs.map(i => ({ title: i.title, type: i.type, id: i.id })))
        }
        if (clusterData?.length) {
          setClusters(clusterData)
          // If they already have results, show them
          if (inputs?.length >= 3) setStep(STEPS.RESULTS)
        }
      } catch (err) {
        console.warn('Curiosity data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const addItem = () => {
    if (!currentTitle.trim()) return
    const newItem = { title: currentTitle.trim(), type: currentType }
    setItems(prev => [...prev, newItem])
    setCurrentTitle('')
    hapticLight()
    // Focus input for rapid entry
    setTimeout(() => inputRef.current?.focus(), 50)

    // Celebrate milestones
    const newCount = items.length + 1
    if (newCount === 3 || newCount === 5 || newCount === 10) {
      hapticSuccess()
    }
  }

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index))
    hapticLight()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && currentTitle.trim()) {
      e.preventDefault()
      addItem()
    }
  }

  // Image upload → AI extraction (supports multiple images)
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    setUploadError(null)

    let totalExtracted = 0

    for (const file of files) {
      try {
        const blob = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.75 })
        const reader = new FileReader()
        const base64 = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result.split(',')[1])
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })

        const { data, error } = await supabase.functions.invoke('extract-curiosities-from-image', {
          body: { imageBase64: base64, mimeType: 'image/jpeg' },
        })

        if (error) throw error
        if (data?.items?.length) {
          const newItems = data.items.map(item => ({
            title: item.title,
            type: item.type || 'book',
          }))
          setItems(prev => {
            const existingTitles = new Set(prev.map(i => i.title.toLowerCase()))
            const unique = newItems.filter(i => !existingTitles.has(i.title.toLowerCase()))
            return [...prev, ...unique]
          })
          totalExtracted += data.items.length
        }
      } catch (err) {
        console.error('Image extraction error:', err)
      }
    }

    if (totalExtracted > 0) {
      hapticSuccess()
    } else {
      setUploadError('Could not find any titles in those images. Try clearer screenshots.')
    }

    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Items that could have episodes (podcasts, youtube, courses)
  const episodeable = items.filter(item =>
    item.type === 'podcast' || item.type === 'youtube' || item.type === 'course'
  )

  const addEpisode = (itemIndex, text) => {
    if (!text.trim()) return
    setEpisodes(prev => ({
      ...prev,
      [itemIndex]: [...(prev[itemIndex] || []), text.trim()],
    }))
  }

  const removeEpisode = (itemIndex, epIndex) => {
    setEpisodes(prev => ({
      ...prev,
      [itemIndex]: (prev[itemIndex] || []).filter((_, i) => i !== epIndex),
    }))
  }

  // Process with AI
  const processWithAI = async () => {
    setStep(STEPS.PROCESSING)
    setProcessingText('Reading your curiosities...')

    const t1 = setTimeout(() => setProcessingText('Researching each title...'), 2000)
    const t2 = setTimeout(() => setProcessingText('Finding the deeper patterns...'), 5000)
    const t3 = setTimeout(() => setProcessingText('Naming what draws you...'), 8000)

    try {
      const { data, error } = await supabase.functions.invoke('classify-curiosities', {
        body: { items, episodes },
      })

      if (error) throw error
      if (data?.error) throw new Error(data.error)

      const newClusters = data.clusters || []
      setClusters(newClusters)

      // Save to database
      if (user) {
        // Save inputs
        const inputRows = items.map(item => ({
          user_id: user.id,
          title: item.title,
          type: item.type,
        }))

        // Delete old inputs and clusters, insert fresh
        await Promise.all([
          supabase.from('curiosity_inputs').delete().eq('user_id', user.id),
          supabase.from('curiosity_clusters').delete().eq('user_id', user.id),
        ])

        await supabase.from('curiosity_inputs').insert(inputRows)

        if (newClusters.length) {
          const clusterRows = newClusters.map(c => ({
            user_id: user.id,
            cluster_name: c.name,
            branch: c.branch,
            description: c.description || '',
            input_count: c.input_count || 0,
            capacity_level: 0,
            why: c.why || null,
            titles: c.titles || null,
          }))
          await supabase.from('curiosity_clusters').insert(clusterRows)
        }
      }

      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      hapticSuccess()
      setStep(STEPS.RESULTS)
    } catch (err) {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      console.error('AI clustering failed:', err)
      setProcessingText('Something went wrong. Trying again...')
      setTimeout(() => setStep(STEPS.ADD_CONTENT), 2000)
    }
  }

  if (loading) {
    return (
      <div className="cmf">
        <div className="cmf-processing">
          <div className="cmf-spinner" />
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 1: WELCOME
  // ═══════════════════════════════════════════════
  if (step === STEPS.WELCOME) {
    return (
      <div className="cmf">
        <div className="cmf-container">
          <div className="cmf-welcome">
            <div className="cmf-welcome-content">
              <div className="cmf-greeting">Your Curiosities</div>
              <p><strong>What can't you stop reading, watching, and listening to?</strong></p>
              <p>Your favourite books, podcasts, and documentaries reveal what you're genuinely drawn to. Not what you think you should be interested in. What you actually are.</p>
              <p>Add at least 5 and we'll map your curiosity landscape. The patterns might surprise you.</p>
            </div>
            <button className="cmf-primary-btn" onClick={() => { hapticLight(); setStep(STEPS.ADD_CONTENT) }}>
              Map my curiosities
            </button>
            <button className="cmf-back-btn" style={{ width: '100%', textAlign: 'center', marginTop: 8 }} onClick={() => navigate(-1)}>
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 2: ADD CONTENT
  // ═══════════════════════════════════════════════
  if (step === STEPS.ADD_CONTENT) {
    return (
      <div className="cmf">
        <div className="cmf-progress">
          <div className="cmf-dot active" />
          <div className="cmf-dot" />
          <div className="cmf-dot" />
        </div>
        <div className="cmf-container">
          <div className="cmf-step-label">Step 1 of 3</div>
          <div className="cmf-heading">Add your <span className="cmf-gold">favourites</span></div>
          <div className="cmf-subtext">Books, podcasts, YouTube channels, documentaries, courses. The things you return to.</div>

          {/* Input row */}
          <div className="cmf-input-row">
            <input
              ref={inputRef}
              className="cmf-input"
              value={currentTitle}
              onChange={e => setCurrentTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g., "Breath" by James Nestor'
              autoFocus
            />
            <select className="cmf-type-select" value={currentType} onChange={e => setCurrentType(e.target.value)}>
              {CONTENT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
              ))}
            </select>
          </div>

          <button className="cmf-add-btn" onClick={addItem} disabled={!currentTitle.trim()}>
            + Add
          </button>

          {/* Image upload */}
          <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
          <button
            className="cmf-add-btn"
            style={{ borderStyle: 'solid', opacity: uploading ? 0.5 : 1 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Reading image...' : '\u{1F4F7} Upload a screenshot (bookshelf, Goodreads, saved podcasts)'}
          </button>
          {uploadError && <div style={{ fontSize: 13, color: '#fca5a5', marginTop: 6 }}>{uploadError}</div>}

          {/* Milestones */}
          <div className="cmf-milestones">
            {MILESTONES.map(m => (
              <div key={m.count} className={`cmf-milestone ${items.length >= m.count ? 'reached' : 'locked'}`}>
                <div className="cmf-milestone-check">
                  {items.length >= m.count ? '\u2713' : ''}
                </div>
                <span>{m.label}</span>
              </div>
            ))}
          </div>

          {/* Items list */}
          {items.length > 0 && (
            <div className="cmf-items">
              {items.map((item, i) => (
                <div key={i} className="cmf-item">
                  <span className="cmf-item-icon">{TYPE_ICONS[item.type] || '\u{1F4D6}'}</span>
                  <span className="cmf-item-title">{item.title}</span>
                  <span className="cmf-item-type">{item.type}</span>
                  <button className="cmf-item-remove" onClick={() => removeItem(i)}>{'\u00D7'}</button>
                </div>
              ))}
            </div>
          )}

          <div className="cmf-nav">
            <button className="cmf-back-btn" onClick={() => setStep(STEPS.WELCOME)}>Back</button>
            <button
              className="cmf-primary-btn"
              disabled={items.length < 3}
              onClick={() => {
                hapticMedium()
                if (episodeable.length > 0) setStep(STEPS.EPISODES)
                else processWithAI()
              }}
            >
              {items.length < 3
                ? `Add ${3 - items.length} more to continue`
                : episodeable.length > 0
                  ? 'Next: favourite episodes'
                  : 'Map my curiosities'
              }
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 3: EPISODES (optional drill-down)
  // ═══════════════════════════════════════════════
  if (step === STEPS.EPISODES) {
    return (
      <div className="cmf">
        <div className="cmf-progress">
          <div className="cmf-dot completed" />
          <div className="cmf-dot active" />
          <div className="cmf-dot" />
        </div>
        <div className="cmf-container">
          <div className="cmf-step-label">Step 2 of 3 (optional)</div>
          <div className="cmf-heading">Favourite <span className="cmf-gold">episodes</span></div>
          <div className="cmf-subtext">A podcast might cover 100 topics. Your favourite episodes reveal the specific thread. Add 1-3 per source.</div>

          {episodeable.map((item, realIndex) => {
            const itemIndex = items.indexOf(item)
            const eps = episodes[itemIndex] || []
            return (
              <div key={itemIndex} className="cmf-episode-group">
                <div className="cmf-episode-source">{TYPE_ICONS[item.type]} {item.title}</div>
                {eps.map((ep, epI) => (
                  <div key={epI} style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <div style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                      {ep}
                    </div>
                    <button className="cmf-item-remove" onClick={() => removeEpisode(itemIndex, epI)}>{'\u00D7'}</button>
                  </div>
                ))}
                <EpisodeInput onAdd={(text) => addEpisode(itemIndex, text)} placeholder={`Favourite episode from ${item.title}`} />
              </div>
            )
          })}

          <div className="cmf-nav">
            <button className="cmf-back-btn" onClick={() => setStep(STEPS.ADD_CONTENT)}>Back</button>
            <button className="cmf-primary-btn" onClick={() => { hapticMedium(); processWithAI() }}>
              Map my curiosities
            </button>
          </div>

          <div className="cmf-skip">
            <button onClick={() => { hapticLight(); processWithAI() }}>Skip, just use the titles</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 4: PROCESSING
  // ═══════════════════════════════════════════════
  if (step === STEPS.PROCESSING) {
    return (
      <div className="cmf">
        <div className="cmf-container">
          <div className="cmf-processing">
            <div className="cmf-spinner" />
            <div className="cmf-processing-text">{processingText}</div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 5: RESULTS
  // ═══════════════════════════════════════════════
  if (step === STEPS.RESULTS) {
    return (
      <div className="cmf">
        <div className="cmf-progress">
          <div className="cmf-dot completed" />
          <div className="cmf-dot completed" />
          <div className="cmf-dot active" />
        </div>
        <div className="cmf-container">
          <div className="cmf-greeting">Your Curiosity Map</div>
          <div className="cmf-subtext" style={{ marginBottom: 8 }}>
            Based on {items.length} pieces of content you love. These are the themes you keep returning to.
          </div>

          <div className="cmf-clusters">
            {clusters.map((cluster, i) => (
              <ClusterCard key={i} cluster={cluster} />
            ))}
          </div>

          {clusters.length > 0 && (
            <div style={{ padding: '14px 16px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>What this means</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                These clusters are what you're genuinely drawn to. Not what you think you should be interested in. What you actually are. The question is: how many of these are you actively pursuing?
              </div>
            </div>
          )}

          <div className="cmf-results-actions">
            <button className="cmf-primary-btn" onClick={() => navigate('/career-alignment')}>
              See how aligned your career is
            </button>
            <button className="cmf-secondary-btn" onClick={() => navigate('/7-day-challenge')}>
              Return to quests
            </button>
            <button className="cmf-secondary-btn" onClick={() => { setStep(STEPS.ADD_CONTENT) }}>
              Feel like some curiosities are missing? Add more content
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ── Collapsible cluster card ──
function ClusterCard({ cluster }) {
  const [expanded, setExpanded] = useState(false)
  const name = cluster.name || cluster.cluster_name
  // Take first sentence of description as summary
  const summary = (cluster.description || '').split('.')[0] + '.'
  const icon = CLUSTER_ICONS[cluster.branch] || CLUSTER_ICONS.default

  return (
    <div className="cmf-cluster" onClick={() => setExpanded(!expanded)} style={{ cursor: 'pointer' }}>
      <div className="cmf-cluster-icon">{icon}</div>
      <div className="cmf-cluster-info">
        <div className="cmf-cluster-name">{name}</div>
        {!expanded && <div className="cmf-cluster-desc">{cluster.why ? cluster.why.split('.')[0] + '.' : summary}</div>}
        {expanded && (
          <>
            {cluster.why && <div className="cmf-cluster-desc" style={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.85)' }}>{cluster.why}</div>}
            {cluster.titles?.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {cluster.titles.map((t, ti) => (
                  <div key={ti} style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, paddingLeft: 8, borderLeft: '2px solid rgba(251,191,36,0.2)' }}>{t}</div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <div className="cmf-cluster-count">{cluster.input_count}</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{expanded ? '\u25B2' : '\u25BC'}</div>
      </div>
    </div>
  )
}

// ── Episode input mini-component ──
function EpisodeInput({ onAdd, placeholder }) {
  const [text, setText] = useState('')
  const handleAdd = () => {
    if (!text.trim()) return
    onAdd(text)
    setText('')
  }
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      <input
        className="cmf-episode-input"
        style={{ flex: 1, marginBottom: 0 }}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && text.trim()) {
            e.preventDefault()
            handleAdd()
          }
        }}
        placeholder={placeholder}
      />
      <button
        onClick={handleAdd}
        disabled={!text.trim()}
        style={{
          padding: '0 14px', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
          borderRadius: 10, color: '#fbbf24', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', opacity: text.trim() ? 1 : 0.4, transition: 'opacity 0.2s', flexShrink: 0,
        }}
      >
        +
      </button>
    </div>
  )
}
