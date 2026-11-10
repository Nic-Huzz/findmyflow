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
  CONNECT_QUEST: 'connect_quest',
  FLOW_DRAFT: 'flow_draft',
  SHARPEN_1: 'sharpen_1',
  SHARPEN_2: 'sharpen_2',
  SHARPEN_3: 'sharpen_3',
  SHARPEN_4: 'sharpen_4',
  FLOW_SAVED: 'flow_saved',
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

  // Flow statement screens
  const [quests, setQuests] = useState([])
  const [selectedQuest, setSelectedQuest] = useState(null)
  const [selectedClusterNames, setSelectedClusterNames] = useState([])
  const [flowStatement, setFlowStatement] = useState('')
  const [isEditingFlow, setIsEditingFlow] = useState(false)
  const [editedFlow, setEditedFlow] = useState('')
  const [flowProcessing, setFlowProcessing] = useState(false)
  const [flowProcessingText, setFlowProcessingText] = useState('Finding your flow...')
  const [sharpen1, setSharpen1] = useState('')
  const [sharpen2, setSharpen2] = useState('')
  const [sharpen3, setSharpen3] = useState('')
  const [sharpen4, setSharpen4] = useState('')

  // Load existing data
  useEffect(() => {
    if (!user) { setLoading(false); return }
    ;(async () => {
      try {
        const [{ data: inputs }, { data: clusterData }, { data: questData }] = await Promise.all([
          supabase.from('curiosity_inputs').select('*').eq('user_id', user.id).order('created_at'),
          supabase.from('curiosity_clusters').select('*').eq('user_id', user.id),
          supabase.from('quests').select('*').eq('user_id', user.id).eq('status', 'active'),
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
        if (questData?.length) {
          setQuests(questData)
        }
      } catch (err) {
        console.warn('Curiosity data load failed:', err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  // Generate flow statement when entering FLOW_DRAFT step
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (step !== STEPS.FLOW_DRAFT || flowStatement || flowProcessing || !selectedQuest) return
    let cancelled = false

    // Snapshot state values to avoid stale closures
    const quest = selectedQuest
    const clusterNames = selectedClusterNames
    const allClusters = clusters

    ;(async () => {
      setFlowProcessing(true)
      setFlowProcessingText('Finding your flow...')

      const t1 = setTimeout(() => { if (!cancelled) setFlowProcessingText('Connecting the dots...') }, 2500)
      const t2 = setTimeout(() => { if (!cancelled) setFlowProcessingText('Crafting your statement...') }, 5000)

      try {
        const [{ data: remarkableData }, { data: essenceData }] = await Promise.all([
          supabase.from('remarkable_angles').select('wound_problem, assumption, combination_insight, different').eq('user_id', user.id),
          supabase.from('lead_flow_profiles').select('custom_essence_fields').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        ])

        const themes = clusterNames.map(name => {
          const c = allClusters.find(cl => (cl.name || cl.cluster_name) === name)
          return c ? { name: c.name || c.cluster_name, why: c.why, description: c.description } : { name }
        })

        const remarkableAngles = (remarkableData || []).map(r =>
          `Problem: ${r.wound_problem || ''}. Assumption: ${r.assumption || ''}. Insight: ${r.combination_insight || ''}. Different: ${r.different || ''}.`
        )

        const { data, error } = await supabase.functions.invoke('generate-flow-statement', {
          body: {
            quest_name: quest.label,
            quest_branch: Array.isArray(quest.branch) ? quest.branch.join(', ') : (quest.branch || ''),
            format_picks: quest.format_picks || [],
            themes,
            remarkable_angles: remarkableAngles,
            essence: essenceData?.custom_essence_fields?.superpower || '',
          },
        })

        clearTimeout(t1); clearTimeout(t2)
        if (cancelled) return
        if (error) throw error

        const statement = data?.statement || data?.flow_statement || ''
        setFlowStatement(statement)
        setEditedFlow(statement)
        hapticSuccess()
      } catch (err) {
        clearTimeout(t1); clearTimeout(t2)
        if (cancelled) return
        console.error('Flow statement generation failed:', err)
        setFlowProcessingText('Something went wrong. Try again.')
        setTimeout(() => { if (!cancelled) setFlowProcessing(false) }, 2000)
        return
      }
      setFlowProcessing(false)
    })()

    return () => { cancelled = true }
  }, [step])

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
            skills: c.skills || null,
            problems: c.problems || null,
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
              <p><strong>Your curiosity is a compass.</strong></p>
              <p>The books you can't put down, the podcasts you binge, the rabbit holes you fall into at 2am. They're not random. They're your essence guiding you towards a life you love.</p>
              <p>Most people ignore these signals. You're about to map them.</p>

              {/* Collect → Connect → Emerge */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, margin: '20px auto 16px', maxWidth: 320 }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>🔍</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginTop: 4 }}>Collect dots</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Add what you love</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, marginTop: 8 }}>→</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>🧩</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Connect dots</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Find the patterns</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 16, marginTop: 8 }}>→</div>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: 22 }}>🚀</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>Emerge</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>See what's forming</div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', opacity: 0.55 }}>Add at least 5 and we'll map your curiosity landscape.</p>
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

          {/* Spotify hint when struggling to reach 10 */}
          {items.length >= 3 && items.length < 10 && (
            <div className="cmf-spotify-hint">
              <span className="cmf-spotify-hint-icon">💡</span>
              <span>Struggling to get to 10? Scroll through <a href="https://open.spotify.com/show/0XrOqvxlqQI6bmdYHuIVnr?si=071ec749a14e4933" target="_blank" rel="noopener noreferrer" className="cmf-spotify-link">Modern Wisdom podcast</a> and screenshot any episode topics that spark your interest, then upload it above.</span>
            </div>
          )}

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
          <div className="cmf-subtext" style={{ marginBottom: 16 }}>
            Based on {items.length} pieces of content you love. These are the themes you keep returning to.
          </div>

          {/* Diverge → Converge → Emerge visual */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, margin: '0 auto 20px', maxWidth: 340 }}>
            {/* Diverge */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>🔍</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>Collect dots</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>You did this</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>→</div>
            {/* Converge */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>🧩</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', marginTop: 4 }}>Connect dots</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>You are here</div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>→</div>
            {/* Emerge */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>🚀</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Emerge</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>What comes next</div>
            </div>
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
            {quests.length > 0 ? (
              <>
                <button className="cmf-primary-btn" onClick={() => { hapticMedium(); setStep(STEPS.CONNECT_QUEST) }}>
                  Connect to a path &rarr;
                </button>
                <button className="cmf-secondary-btn" onClick={() => { setStep(STEPS.ADD_CONTENT) }}>
                  Feel like some curiosities are missing? Add more content
                </button>
              </>
            ) : (
              <>
                <button className="cmf-primary-btn" onClick={() => navigate('/life-map')}>
                  Next step: Your Life Map
                </button>
                <button className="cmf-secondary-btn" onClick={() => { setStep(STEPS.ADD_CONTENT) }}>
                  Feel like some curiosities are missing? Add more content
                </button>
                <button className="cmf-secondary-btn" onClick={() => navigate('/7-day-challenge')}>
                  Return to quests
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 6: CONNECT QUEST
  // ═══════════════════════════════════════════════
  if (step === STEPS.CONNECT_QUEST) {
    const toggleCluster = (name) => {
      setSelectedClusterNames(prev => {
        if (prev.includes(name)) return prev.filter(n => n !== name)
        if (prev.length >= 3) return prev
        return [...prev, name]
      })
    }

    return (
      <div className="cmf">
        <FlowProgressIndicator step="connect" />
        <div className="cmf-container">
          <div className="cmf-heading">Which path do these <span className="cmf-gold">connect</span> to?</div>
          <div className="cmf-subtext">Pick a path, then select the themes that feel connected to it.</div>

          <div className="cmf-quest-list">
            {quests.map(q => (
              <button
                key={q.id}
                className={`cmf-quest-card${selectedQuest?.id === q.id ? ' selected' : ''}`}
                onClick={() => { hapticLight(); setSelectedQuest(q); setSelectedClusterNames([]) }}
              >
                <div className="cmf-quest-card-color" style={{ background: q.color || '#6b7280' }} />
                <div className="cmf-quest-card-label">{q.label}</div>
                <div className="cmf-quest-card-check">
                  {selectedQuest?.id === q.id ? '\u2713' : ''}
                </div>
              </button>
            ))}
          </div>

          {selectedQuest && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                Select 1-3 themes connected to {selectedQuest.label}
              </div>
              <div className="cmf-theme-chips">
                {clusters.map((c, i) => {
                  const name = c.name || c.cluster_name
                  const isSelected = selectedClusterNames.includes(name)
                  return (
                    <button
                      key={i}
                      className={`cmf-theme-chip${isSelected ? ' selected' : ''}`}
                      onClick={() => { hapticLight(); toggleCluster(name) }}
                    >
                      <div className="cmf-theme-chip-check">
                        {isSelected ? '\u2713' : ''}
                      </div>
                      {name}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="cmf-nav">
            <button className="cmf-back-btn" onClick={() => setStep(STEPS.RESULTS)}>Back</button>
            <button
              className="cmf-primary-btn"
              disabled={selectedClusterNames.length < 1}
              onClick={() => { hapticMedium(); setStep(STEPS.FLOW_DRAFT) }}
            >
              Find your flow &rarr;
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (step === STEPS.FLOW_DRAFT) {
    if (flowProcessing) {
      return (
        <div className="cmf">
          <div className="cmf-container">
            <div className="cmf-processing">
              <div className="cmf-spinner" />
              <div className="cmf-processing-text">{flowProcessingText}</div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className="cmf">
        <FlowProgressIndicator step="find" />
        <div className="cmf-container">
          <div className="cmf-heading">Your <span className="cmf-gold">flow</span></div>
          <div className="cmf-subtext">This is what {selectedQuest?.label} is really about for you.</div>

          {!isEditingFlow ? (
            <div className="cmf-flow-quote">
              <div className="cmf-flow-quote-text">{flowStatement}</div>
            </div>
          ) : (
            <textarea
              className="cmf-flow-edit"
              value={editedFlow}
              onChange={e => setEditedFlow(e.target.value)}
              autoFocus
            />
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            {!isEditingFlow ? (
              <button
                className="cmf-secondary-btn"
                style={{ flex: 0 }}
                onClick={() => { hapticLight(); setIsEditingFlow(true) }}
              >
                Edit
              </button>
            ) : (
              <button
                className="cmf-secondary-btn"
                style={{ flex: 0 }}
                onClick={() => {
                  hapticLight()
                  setFlowStatement(editedFlow)
                  setIsEditingFlow(false)
                }}
              >
                Save edit
              </button>
            )}
            <button
              className="cmf-primary-btn"
              style={{ flex: 1, marginTop: 0 }}
              disabled={isEditingFlow}
              onClick={() => { hapticSuccess(); setStep(STEPS.SHARPEN_1) }}
            >
              That's my flow
            </button>
          </div>

          <button className="cmf-back-btn" style={{ width: '100%', textAlign: 'center', marginTop: 12 }} onClick={() => {
            setFlowStatement('')
            setEditedFlow('')
            setFlowProcessing(false)
            setStep(STEPS.CONNECT_QUEST)
          }}>
            Back
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREENS 8-11: SHARPEN 1-4
  // ═══════════════════════════════════════════════
  const SHARPEN_CONFIG = [
    {
      step: STEPS.SHARPEN_1,
      question: (name) => `What problem does ${name} solve that nobody else is solving right?`,
      placeholder: 'e.g. Real transformation is paywalled. People spend thousands and are still stuck.',
      value: sharpen1,
      setter: setSharpen1,
      prev: STEPS.FLOW_DRAFT,
      next: STEPS.SHARPEN_2,
      num: 1,
    },
    {
      step: STEPS.SHARPEN_2,
      question: () => 'What does everyone assume is required to solve it, that you think is wrong?',
      placeholder: 'e.g. Everyone assumes healing must be serious, clinical, and expensive',
      value: sharpen2,
      setter: setSharpen2,
      prev: STEPS.SHARPEN_1,
      next: STEPS.SHARPEN_3,
      num: 2,
    },
    {
      step: STEPS.SHARPEN_3,
      question: () => 'What experience or background showed you that assumption is wrong?',
      placeholder: 'e.g. I did a year-long fear challenge that changed my life more in 3 months than 3 years of online courses',
      value: sharpen3,
      setter: setSharpen3,
      prev: STEPS.SHARPEN_2,
      next: STEPS.SHARPEN_4,
      num: 3,
    },
    {
      step: STEPS.SHARPEN_4,
      question: () => 'Remove that assumption. How does your approach solve it differently?',
      placeholder: 'e.g. Instead of talking about fear, we do the scary thing together, safely, and track what changes',
      value: sharpen4,
      setter: setSharpen4,
      prev: STEPS.SHARPEN_3,
      next: STEPS.FLOW_SAVED,
      num: 4,
    },
  ]

  const sharpenConfig = SHARPEN_CONFIG.find(s => s.step === step)
  if (sharpenConfig) {
    const { question, placeholder, value, setter, prev, next, num } = sharpenConfig
    const canProceed = value.trim().length >= 10

    const handleSave = async () => {
      hapticMedium()
      // If this is the last sharpen screen, save everything
      if (next === STEPS.FLOW_SAVED) {
        try {
          await supabase.from('quests').update({
            flow_statement: flowStatement,
            flow_themes: selectedClusterNames,
            flow_sharpening: { q1: sharpen1, q2: sharpen2, q3: sharpen3, q4: sharpen4 },
          }).eq('id', selectedQuest.id)
        } catch (err) {
          console.error('Failed to save flow data:', err)
        }
      }
      setStep(next)
    }

    const handleSkip = async () => {
      hapticLight()
      setter('')
      // If this is the last sharpen screen, save everything
      if (next === STEPS.FLOW_SAVED) {
        try {
          await supabase.from('quests').update({
            flow_statement: flowStatement,
            flow_themes: selectedClusterNames,
            flow_sharpening: {
              q1: num >= 2 ? sharpen1 : '',
              q2: num >= 3 ? sharpen2 : '',
              q3: num >= 4 ? sharpen3 : '',
              q4: '',
            },
          }).eq('id', selectedQuest.id)
        } catch (err) {
          console.error('Failed to save flow data:', err)
        }
      }
      setStep(next)
    }

    return (
      <div className="cmf">
        <FlowProgressIndicator step="sharpen" />
        <div className="cmf-container">
          <div className="cmf-step-label">Sharpen {num} of 4</div>

          <div className="cmf-sharpen-context">
            <div className="cmf-sharpen-context-label">Your flow</div>
            <div className="cmf-sharpen-context-text">{flowStatement}</div>
          </div>

          <div className="cmf-heading" style={{ fontSize: 20 }}>{question(selectedQuest?.label)}</div>

          <textarea
            className="cmf-sharpen-textarea"
            value={value}
            onChange={e => setter(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />

          <div className="cmf-nav">
            <button className="cmf-back-btn" onClick={() => setStep(prev)}>Back</button>
            <button
              className="cmf-primary-btn"
              disabled={!canProceed}
              onClick={handleSave}
            >
              Next
            </button>
          </div>

          <div className="cmf-skip">
            <button onClick={handleSkip}>Skip this one</button>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════
  // SCREEN 12: FLOW SAVED (Celebration)
  // ═══════════════════════════════════════════════
  if (step === STEPS.FLOW_SAVED) {
    return (
      <div className="cmf">
        <div className="cmf-container">
          <div className="cmf-celebration">
            <div className="cmf-celebration-emoji">{'\u2728'}</div>
            <div className="cmf-celebration-title">Flow found</div>
            <div className="cmf-flow-quote" style={{ marginTop: 0 }}>
              <div className="cmf-flow-quote-text">{flowStatement}</div>
            </div>
            <button className="cmf-primary-btn" onClick={() => { hapticSuccess(); navigate('/7-day-challenge') }}>
              Back to your paths
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ── Flow progress indicator for post-results screens ──
function FlowProgressIndicator({ step }) {
  const steps = [
    { key: 'connect', label: 'Connect' },
    { key: 'find', label: 'Find' },
    { key: 'sharpen', label: 'Sharpen' },
  ]
  const currentIndex = steps.findIndex(s => s.key === step)

  return (
    <div className="cmf-flow-progress">
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className={`cmf-flow-progress-step${i === currentIndex ? ' active' : i < currentIndex ? ' completed' : ''}`}>
            <div className="cmf-flow-progress-dot" />
            <span>{s.label}</span>
          </div>
          {i < steps.length - 1 && <span className="cmf-flow-progress-arrow">&rarr;</span>}
        </div>
      ))}
    </div>
  )
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
