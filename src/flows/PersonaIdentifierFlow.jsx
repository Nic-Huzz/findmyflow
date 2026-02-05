/**
 * PersonaIdentifierFlow.jsx
 *
 * Quick discovery flow to identify ideal personas through life chapters.
 * Based on FlowFinderPersona's clustering approach.
 *
 * Questions:
 * 1. Life Chapters - What are the major phases of your story?
 * 2. Chapter Struggles - What did you overcome in each phase?
 *
 * Then AI clusters into personas, user rates journey stages.
 *
 * Created: Feb 2026
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { PERSONA_SEGMENTS, JOURNEY_STAGES } from '../lib/wheelTaxonomy'
import { syncFlowFinderWithChallenge } from '../lib/questCompletionHelpers'
import GoDeeper from '../components/GoDeeper'
import { GradientWheel } from '../components/CompetenceWheels'
import '../styles/flow-base.css'
import './PersonaIdentifierFlow.css'

const SCREENS = {
  INTRO: 'intro',
  CHAPTERS: 'chapters',
  STRUGGLES: 'struggles',
  ANALYZING: 'analyzing',
  RATING: 'rating',
  COMPLETE: 'complete'
}

export default function PersonaIdentifierFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentScreen, setCurrentScreen] = useState(SCREENS.INTRO)
  const [viewingResults, setViewingResults] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  // Create flow session on mount (skip if viewing results)
  useEffect(() => {
    if (searchParams.get('results') === 'true') return

    const createSession = async () => {
      if (!user) return
      try {
        const { data, error } = await supabase
          .from('flow_sessions')
          .insert({
            user_id: user.id,
            flow_type: 'persona_identifier',
            status: 'in_progress'
          })
          .select()
          .single()

        if (error) throw error
        setSessionId(data.id)
      } catch (err) {
        console.error('Error creating session:', err)
      }
    }
    createSession()
  }, [user, searchParams])

  // Check for ?results=true to show saved results directly
  useEffect(() => {
    const loadSavedResults = async () => {
      if (searchParams.get('results') !== 'true' || !user) return

      try {
        const { data: savedClusters, error } = await supabase
          .from('nikigai_clusters')
          .select('*')
          .eq('user_id', user.id)
          .eq('cluster_type', 'persona')
          .eq('cluster_stage', 'final')
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) throw error

        if (savedClusters && savedClusters.length > 0) {
          const formattedClusters = savedClusters.map(c => ({
            label: c.cluster_label,
            insight: c.insight,
            journeyStage: c.proficiency,
            taxonomy_keys: c.taxonomy_keys || [], // Load saved taxonomy keys
            items: c.items || []
          }))

          const ratings = {}
          formattedClusters.forEach(c => {
            if (c.journeyStage) ratings[c.label] = c.journeyStage
          })

          setClusters(formattedClusters)
          setPersonaRatings(ratings)
          setViewingResults(true)
          setCurrentScreen(SCREENS.COMPLETE)
        }
      } catch (err) {
        console.error('Error loading saved results:', err)
      }
    }

    loadSavedResults()
  }, [searchParams, user])

  // Form data - chapters with struggles
  const [chapters, setChapters] = useState([
    { name: '', struggle: '' },
    { name: '', struggle: '' },
    { name: '', struggle: '' },
    { name: '', struggle: '' },
    { name: '', struggle: '' }
  ])

  // AI-generated persona clusters
  const [clusters, setClusters] = useState([])
  // Journey stage ratings for each persona: { 'cluster_label': 'awakening' | 'struggling' | 'ready' }
  const [personaRatings, setPersonaRatings] = useState({})
  // Wheel visualization state
  const [litCells, setLitCells] = useState(new Set())

  // Add hue values to segments for wheel rendering
  const personaWithHue = useMemo(() =>
    PERSONA_SEGMENTS.map((s, i) => ({ ...s, hue: i * 30 })),
    []
  )

  // Map cluster labels to taxonomy keys (segment IDs like 'seekers', 'achievers')
  // This is used for NEW clusters - saved for persistence
  const mapClusterToTaxonomyKeys = (clusterLabel) => {
    const labelLower = clusterLabel.toLowerCase()

    // Map keywords to segment IDs (not indices)
    const keywordToKeys = {
      // Seekers
      seekers: ['seekers'], lost: ['seekers'], direction: ['seekers'], purpose: ['seekers'],
      meaning: ['seekers'], clarity: ['seekers'], confused: ['seekers'],
      // Builders
      builders: ['builders'], creating: ['builders'], making: ['builders'],
      entrepreneurship: ['builders'], starting: ['builders'], launching: ['builders'], project: ['builders'],
      // Healers
      healers: ['healers'], hurting: ['healers'], recovering: ['healers'], healing: ['healers'],
      trauma: ['healers'], pain: ['healers'], wounded: ['healers'], broken: ['healers'],
      // Teachers
      teachers: ['teachers'], learning: ['teachers'], growing: ['teachers'], developing: ['teachers'],
      knowledge: ['teachers'], education: ['teachers'], improve: ['teachers'],
      // Connectors
      connectors: ['connectors'], lonely: ['connectors'], isolated: ['connectors'],
      community: ['connectors'], belonging: ['connectors'], connection: ['connectors'], tribe: ['connectors'],
      // Achievers
      achievers: ['achievers'], success: ['achievers'], winning: ['achievers'], status: ['achievers'],
      recognition: ['achievers'], ambitious: ['achievers'], goals: ['achievers'],
      // Explorers
      explorers: ['explorers'], freedom: ['explorers'], adventure: ['explorers'], autonomy: ['explorers'],
      escape: ['explorers'], travel: ['explorers'], independent: ['explorers'],
      // Visionaries
      visionaries: ['visionaries'], future: ['visionaries'], change: ['visionaries'],
      innovation: ['visionaries'], transformation: ['visionaries'], vision: ['visionaries'], disrupt: ['visionaries'],
      // Protectors
      protectors: ['protectors'], security: ['protectors'], safety: ['protectors'], stability: ['protectors'],
      risk: ['protectors'], protection: ['protectors'], secure: ['protectors'],
      // Creators
      creators: ['creators'], expression: ['creators'], art: ['creators'], originality: ['creators'],
      creativity: ['creators'], voice: ['creators'], artistic: ['creators'],
      // Nurturers
      nurturers: ['nurturers'], family: ['nurturers'], caring: ['nurturers'], devoted: ['nurturers'],
      'loved ones': ['nurturers'], support: ['nurturers'], children: ['nurturers'],
      // Challengers
      challengers: ['challengers'], injustice: ['challengers'], truth: ['challengers'],
      advocacy: ['challengers'], rebel: ['challengers'], fight: ['challengers'],
      // Compound terms
      'burnt out': ['healers', 'achievers'], burnout: ['healers', 'achievers'],
      'career change': ['seekers', 'explorers'],
      'new mom': ['nurturers'], 'new parent': ['nurturers'], professional: ['teachers', 'achievers'],
      entrepreneur: ['builders', 'visionaries'], 'small business': ['builders', 'protectors'],
    }

    // Find matching segment keys
    const matchedKeys = new Set()
    Object.entries(keywordToKeys).forEach(([keyword, keys]) => {
      if (labelLower.includes(keyword)) {
        keys.forEach(k => matchedKeys.add(k))
      }
    })

    // Default to 'seekers' if no match
    return matchedKeys.size > 0 ? Array.from(matchedKeys) : ['seekers']
  }

  // Convert taxonomy keys to segment indices for wheel rendering
  const getSegmentIndicesFromKeys = (taxonomyKeys) => {
    if (!taxonomyKeys || taxonomyKeys.length === 0) return [0]

    return taxonomyKeys.map(key => {
      const idx = PERSONA_SEGMENTS.findIndex(s => s.id === key)
      return idx >= 0 ? idx : 0
    }).filter((v, i, a) => a.indexOf(v) === i) // dedupe
  }

  // Get segment indices - prefer saved taxonomy_keys, fallback to label matching
  const getSegmentIndices = (cluster) => {
    if (cluster.taxonomy_keys && cluster.taxonomy_keys.length > 0) {
      // Use saved taxonomy keys - check they still exist in current taxonomy
      const validKeys = cluster.taxonomy_keys.filter(key =>
        PERSONA_SEGMENTS.some(s => s.id === key)
      )
      if (validKeys.length > 0) {
        return getSegmentIndicesFromKeys(validKeys)
      }
    }
    // Fallback: regenerate from label
    const keys = mapClusterToTaxonomyKeys(cluster.label)
    return getSegmentIndicesFromKeys(keys)
  }

  // Map journey stage to ring index (0-2) for 3-ring wheel
  const getRingForJourneyStage = (stage) => {
    switch (stage) {
      case 'awakening': return 0
      case 'struggling': return 1
      case 'ready': return 2
      default: return 1 // Default to struggling
    }
  }

  // Get taxonomy tags for a cluster - prefer saved keys, fallback to label matching
  const getTaxonomyTags = (cluster) => {
    const indices = getSegmentIndices(cluster)
    return indices.map(idx => PERSONA_SEGMENTS[idx]).filter(Boolean)
  }

  // Update lit cells when clusters or ratings change
  useEffect(() => {
    if (clusters.length > 0) {
      const newLitCells = new Set()

      clusters.forEach(cluster => {
        // Use saved taxonomy_keys if available, else fallback to label matching
        const segmentIndices = getSegmentIndices(cluster)
        const journeyStage = cluster.journeyStage || personaRatings[cluster.label] || 'struggling'
        const ringIdx = getRingForJourneyStage(journeyStage)

        segmentIndices.forEach(segIdx => {
          newLitCells.add(`${segIdx}-${ringIdx}`)
        })
      })

      setLitCells(newLitCells)
    }
  }, [clusters, personaRatings])

  // Add chapter row
  const addChapterRow = () => {
    if (chapters.length < 10) {
      setChapters([...chapters, { name: '', struggle: '' }])
    }
  }

  // Update chapter
  const updateChapter = (index, field, value) => {
    const updated = [...chapters]
    updated[index][field] = value
    setChapters(updated)
  }

  // Remove chapter row
  const removeChapterRow = (index) => {
    if (chapters.length > 1) {
      const updated = chapters.filter((_, i) => i !== index)
      setChapters(updated)
    }
  }

  // Check if chapters step is valid (at least 2)
  const hasValidChapters = chapters.filter(ch => ch.name.trim()).length >= 2

  // Check if struggles step is valid (at least 2 with both fields)
  const hasValidStruggles = chapters.filter(ch => ch.name.trim() && ch.struggle.trim()).length >= 2

  // Update rating for a persona
  const setPersonaRating = (personaLabel, rating) => {
    setPersonaRatings(prev => ({
      ...prev,
      [personaLabel]: rating
    }))
  }

  // Check if all personas have been rated
  const allPersonasRated = () => {
    return clusters.every(cluster => personaRatings[cluster.label])
  }

  // Analyze with AI using FlowFinderPersona's approach
  const analyzeWithAI = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)
    setCurrentScreen(SCREENS.ANALYZING)

    try {
      // Build context from chapters and struggles
      const filledChapters = chapters.filter(ch => ch.name.trim())
      const chaptersContext = filledChapters.map(ch =>
        `${ch.name}: ${ch.struggle || 'Journey of growth'}`
      ).join('\n')

      // Create allResponses array in the format the edge function expects
      const allResponses = [{
        user_id: user.id,
        response_raw: chaptersContext,
        store_as: 'persona_analysis'
      }]

      // Call Claude API to generate persona clusters (same as FlowFinderPersona)
      const { data, error: fnError } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'persona_final', assistant_prompt: 'Persona clustering from life chapters' },
          userResponse: 'Ready to discover who I serve',
          shouldCluster: true,
          clusterType: 'persona',
          clusterSources: ['persona_analysis'],
          allResponses: allResponses,
          conversationHistory: []
        }
      })

      if (fnError) throw fnError

      console.log('✅ API Response:', data)

      const returnedClusters = data.clusters || []
      setClusters(returnedClusters)

      // Go to rating screen
      setCurrentScreen(SCREENS.RATING)
    } catch (err) {
      console.error('Error analyzing journey:', err)
      setError('Error generating insights. Please try again.')
      setCurrentScreen(SCREENS.STRUGGLES)
    } finally {
      setIsAnalyzing(false)
    }
  }, [chapters, user?.id])

  // Track saving state to prevent double-clicks
  const [isSaving, setIsSaving] = useState(false)

  // Save clusters with journey stage ratings to database
  const saveWithRatings = async () => {
    if (isSaving) return // Prevent double-clicks
    setIsSaving(true)
    setError(null) // Clear any previous errors

    try {
      // Add journey stage and taxonomy keys to each cluster
      const clustersWithRatings = clusters.map(cluster => ({
        ...cluster,
        journeyStage: personaRatings[cluster.label] || 'struggling',
        // Generate and save taxonomy keys for persistence
        taxonomy_keys: cluster.taxonomy_keys || mapClusterToTaxonomyKeys(cluster.label)
      }))

      // Save to nikigai_responses
      const { error: responseError } = await supabase.from('nikigai_responses').insert({
        user_id: user.id,
        session_id: sessionId,
        flow_type: 'persona_identifier',
        response_type: 'personas',
        response_data: {
          chapters: chapters.filter(ch => ch.name.trim()),
          clusters: clustersWithRatings
        }
      })

      if (responseError) {
        console.error('❌ Response save error:', responseError)
      }

      // Also save to nikigai_clusters for integration
      // taxonomy_keys persists wheel segment mappings (requires migration 20260203000000)
      const clustersToSave = clustersWithRatings.map(cluster => ({
        user_id: user.id,
        session_id: sessionId,
        cluster_type: 'persona',
        cluster_stage: 'final',
        cluster_label: cluster.label,
        insight: cluster.insight,
        proficiency: cluster.journeyStage,
        taxonomy_keys: cluster.taxonomy_keys, // Persist wheel segment mappings
        items: (cluster.items || []).map(item => ({
          text: typeof item === 'string' ? item : item.text || item
        }))
      }))

      const { error: insertError } = await supabase
        .from('nikigai_clusters')
        .insert(clustersToSave)

      if (insertError) {
        console.error('❌ Database insert error:', insertError)
        // Don't throw - responses already saved
      }

      // Mark session as completed
      if (sessionId) {
        await supabase
          .from('flow_sessions')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', sessionId)
      }

      // Sync with 7-day challenge
      await syncFlowFinderWithChallenge(user.id, 'persona_identifier')

      console.log('✅ Persona Identifier saved successfully')
      setClusters(clustersWithRatings)
      setCurrentScreen(SCREENS.COMPLETE)
    } catch (err) {
      console.error('Error saving with ratings:', err)
      setError('Error saving. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Render functions
  const renderIntro = () => (
    <div className="flow-screen intro-screen">
      <div className="flow-icon">👥</div>
      <h1>Persona Identifier</h1>
      <p className="flow-subtitle">
        Discover who you're meant to serve by exploring your own journey.
      </p>

      <div className="intro-points">
        <div className="intro-point">
          <span className="point-icon">📖</span>
          <span>Your life chapters reveal who you understand</span>
        </div>
        <div className="intro-point">
          <span className="point-icon">💪</span>
          <span>Your struggles show who you can help</span>
        </div>
        <div className="intro-point">
          <span className="point-icon">🎯</span>
          <span>AI identifies your ideal personas</span>
        </div>
      </div>

      <div className="nav-buttons" style={{ flexDirection: 'column' }}>
        <button
          className="primary-button"
          onClick={() => setCurrentScreen(SCREENS.CHAPTERS)}
          style={{ width: '100%' }}
        >
          Let's Begin
        </button>
        <button
          className="secondary-button"
          onClick={() => navigate('/7-day-challenge')}
          style={{ width: '100%' }}
        >
          Back
        </button>
      </div>
    </div>
  )

  const renderChapters = () => (
    <div className="flow-screen question-screen">
      <div className="question-header">
        <div className="question-number">Question 1 of 2</div>
        <h2>If your life was a book, what are the chapters?</h2>
        <p className="question-subtitle">
          Think of major phases or turning points in your journey
        </p>
      </div>

      <div className="chapters-form">
        {chapters.map((chapter, index) => (
          <div key={index} className="chapter-row">
            <div className="input-number">{index + 1}</div>
            <input
              type="text"
              className="chapter-input"
              placeholder={
                index === 0 ? "The Explorer Years" :
                index === 1 ? "The Rebuild" :
                index === 2 ? "Finding My Voice" :
                index === 3 ? "The Awakening" :
                index === 4 ? "Finding Purpose" :
                `Chapter ${index + 1}`
              }
              value={chapter.name}
              onChange={(e) => updateChapter(index, 'name', e.target.value)}
            />
            {chapters.length > 1 && (
              <button
                className="remove-row-btn"
                onClick={() => removeChapterRow(index)}
                aria-label="Remove"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {chapters.length < 10 && (
        <button className="add-row-btn" onClick={addChapterRow}>
          + Add Chapter
        </button>
      )}

      <div className="example-hint">
        <strong>Examples:</strong> "The Corporate Years", "Starting Over", "Finding Purpose", "The Awakening"
      </div>

      <div className="nav-buttons">
        <button
          className="secondary-button"
          onClick={() => setCurrentScreen(SCREENS.INTRO)}
        >
          Back
        </button>
        <button
          className="primary-button"
          onClick={() => setCurrentScreen(SCREENS.STRUGGLES)}
          disabled={!hasValidChapters}
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderStruggles = () => (
    <div className="flow-screen question-screen">
      <div className="question-header">
        <div className="question-number">Question 2 of 2</div>
        <h2>What struggle defined each chapter?</h2>
        <p className="question-subtitle">
          The challenges you overcame reveal who you can help
        </p>
      </div>

      <div className="struggles-form">
        {chapters.filter(ch => ch.name.trim()).map((chapter, index) => (
          <div key={index} className="struggle-row">
            <div className="chapter-label">{chapter.name}</div>
            <input
              type="text"
              className="struggle-input"
              placeholder="What challenge or struggle defined this phase?"
              value={chapter.struggle}
              onChange={(e) => {
                const realIndex = chapters.findIndex(c => c.name === chapter.name)
                updateChapter(realIndex, 'struggle', e.target.value)
              }}
            />
          </div>
        ))}
      </div>

      <div className="example-hint">
        <strong>Examples:</strong> "Burnout from overwork", "Loss of identity", "Fear of visibility", "Financial uncertainty"
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="nav-buttons">
        <button
          className="secondary-button"
          onClick={() => setCurrentScreen(SCREENS.CHAPTERS)}
        >
          Back
        </button>
        <button
          className="primary-button"
          onClick={analyzeWithAI}
          disabled={!hasValidStruggles || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Discover My Personas'}
        </button>
      </div>
    </div>
  )

  const renderAnalyzing = () => (
    <div className="flow-screen analyzing-screen">
      <div className="analyzing-animation">
        <div className="spinner"></div>
      </div>
      <h2>Analyzing Your Journey...</h2>
      <p className="analyzing-text">
        Identifying personas based on your life chapters and struggles
      </p>
    </div>
  )

  const renderRating = () => {
    const ratedCount = Object.keys(personaRatings).length
    const totalCount = clusters.length

    return (
      <div className="flow-screen rating-screen">
        <div className="question-header">
          <div className="question-number">Final Step</div>
          <h2>Where are they on their journey?</h2>
          <p className="question-subtitle">
            For each persona, where are they in becoming aware of their problem?
          </p>
        </div>

        <div className="rating-legend">
          <div className="legend-items">
            {JOURNEY_STAGES.map(stage => (
              <div key={stage.id} className="legend-item">
                <div className="legend-dot" style={{ background: stage.color }} />
                <span>{stage.label}</span>
              </div>
            ))}
          </div>
          <p className="rating-progress">{ratedCount} of {totalCount} rated</p>
        </div>

        <div className="persona-rating-list">
          {clusters.map((cluster, index) => (
            <div key={index} className="persona-rating-card">
              <div className="persona-info">
                <div className="persona-label">{cluster.label}</div>
                <div className="persona-insight">{cluster.insight}</div>
              </div>
              <div className="rating-buttons">
                <button
                  onClick={() => setPersonaRating(cluster.label, 'awakening')}
                  className={`rating-btn awakening ${personaRatings[cluster.label] === 'awakening' ? 'active' : ''}`}
                >
                  Awakening
                </button>
                <button
                  onClick={() => setPersonaRating(cluster.label, 'struggling')}
                  className={`rating-btn struggling ${personaRatings[cluster.label] === 'struggling' ? 'active' : ''}`}
                >
                  Struggling
                </button>
                <button
                  onClick={() => setPersonaRating(cluster.label, 'ready')}
                  className={`rating-btn ready ${personaRatings[cluster.label] === 'ready' ? 'active' : ''}`}
                >
                  Ready
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="primary-button save-btn"
          onClick={saveWithRatings}
          disabled={!allPersonasRated() || isSaving}
        >
          {isSaving ? 'Saving...' : 'Save & See Results'}
        </button>
      </div>
    )
  }

  const renderComplete = () => {
    const getJourneyStageInfo = (stage) => {
      return JOURNEY_STAGES.find(s => s.id === stage) || JOURNEY_STAGES[1]
    }

    return (
      <div className="flow-screen complete-screen">
        <div className="complete-icon">🎉</div>
        <h2>{viewingResults ? 'Your Personas' : 'Personas Identified!'}</h2>
        <p className="complete-text">
          {viewingResults
            ? `Here are the ${clusters.length} personas we identified from your journey:`
            : `Based on your journey, we've identified ${clusters.length} personas—former versions of yourself who need what you've learned:`}
        </p>

        {/* Persona Wheel Visualization */}
        <div className="wheel-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
          <GradientWheel
            segments={personaWithHue}
            rings={JOURNEY_STAGES}
            litCells={litCells}
            size={280}
            centerLabel="PERSONA"
            interactive={false}
            celebrate={!viewingResults}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '12px', fontSize: '11px' }}>
            {JOURNEY_STAGES.map((r, i) => (
              <span key={r.id} style={{
                padding: '4px 10px',
                background: `${r.color}20`,
                borderRadius: '12px',
                color: r.color,
                fontWeight: '500'
              }}>
                {i === 0 ? '← Inner ' : ''}{r.label}{i === JOURNEY_STAGES.length - 1 ? ' Outer →' : ''}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '13px', color: '#E9A23B', marginTop: '12px', fontWeight: '500' }}>
            {litCells.size} persona × journey combinations identified
          </div>
        </div>

        <div className="persona-results">
          {clusters.map((cluster, index) => {
            const stageInfo = getJourneyStageInfo(cluster.journeyStage || personaRatings[cluster.label])
            const taxonomyTags = getTaxonomyTags(cluster)
            return (
              <div key={index} className="persona-result-card">
                {stageInfo && (
                  <div className="stage-badge" style={{ background: `${stageInfo.color}20`, color: stageInfo.color }}>
                    <div className="stage-dot" style={{ background: stageInfo.color }} />
                    {stageInfo.label}
                  </div>
                )}
                <h3>{cluster.label}</h3>
                <p>{cluster.insight}</p>
                {/* Wheel Taxonomy Tags */}
                {taxonomyTags.length > 0 && (
                  <div className="taxonomy-tags" style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '12px',
                    marginBottom: '8px'
                  }}>
                    {taxonomyTags.map((tag, i) => (
                      <span key={i} className="taxonomy-tag" style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        background: `${tag.color}20`,
                        color: tag.color,
                        borderRadius: '12px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>{tag.icon}</span>
                        {tag.displayName}
                      </span>
                    ))}
                  </div>
                )}
                {cluster.items && cluster.items.length > 0 && (
                  <div className="cluster-evidence">
                    <div className="evidence-label">Why you're qualified:</div>
                    <ul>
                      {cluster.items.map((item, i) => (
                        <li key={i}>"{typeof item === 'string' ? item : item.text || item}"</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <GoDeeper
          title="Want to go deeper?"
          description="The full Flow Finder starts with Problems Discovery—understanding the problems you solve helps identify who you're meant to serve."
          buttonText="Start Problems Discovery →"
          route="/nikigai/problems"
        />

        {viewingResults ? (
          <div className="nav-buttons">
            <button
              className="secondary-button"
              onClick={() => navigate('/7-day-challenge')}
            >
              Back
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setViewingResults(false)
                setCurrentScreen(SCREENS.INTRO)
                setClusters([])
                setPersonaRatings({})
                navigate('/persona-identifier', { replace: true })
              }}
            >
              Retake Flow
            </button>
          </div>
        ) : (
          <div className="nav-buttons">
            <button
              className="secondary-button"
              onClick={() => navigate('/me')}
            >
              Back to Profile
            </button>
            <button
              className="primary-button"
              onClick={() => navigate('/7-day-challenge')}
            >
              Continue to Challenges
            </button>
          </div>
        )}
      </div>
    )
  }

  // Main render
  return (
    <div className="persona-identifier-flow">
      <div className="flow-container">
        {currentScreen === SCREENS.INTRO && renderIntro()}
        {currentScreen === SCREENS.CHAPTERS && renderChapters()}
        {currentScreen === SCREENS.STRUGGLES && renderStruggles()}
        {currentScreen === SCREENS.ANALYZING && renderAnalyzing()}
        {currentScreen === SCREENS.RATING && renderRating()}
        {currentScreen === SCREENS.COMPLETE && renderComplete()}
      </div>
    </div>
  )
}
