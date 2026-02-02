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

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { JOURNEY_STAGES } from '../lib/wheelTaxonomy'
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
  const [currentScreen, setCurrentScreen] = useState(SCREENS.INTRO)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  // Form data - chapters with struggles
  const [chapters, setChapters] = useState([
    { name: '', struggle: '' },
    { name: '', struggle: '' },
    { name: '', struggle: '' }
  ])

  // AI-generated persona clusters
  const [clusters, setClusters] = useState([])
  // Journey stage ratings for each persona: { 'cluster_label': 'awakening' | 'struggling' | 'ready' }
  const [personaRatings, setPersonaRatings] = useState({})

  // Add chapter row
  const addChapterRow = () => {
    if (chapters.length < 7) {
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

  // Save clusters with journey stage ratings to database
  const saveWithRatings = async () => {
    try {
      // Add journey stage to each cluster
      const clustersWithRatings = clusters.map(cluster => ({
        ...cluster,
        journeyStage: personaRatings[cluster.label] || 'struggling'
      }))

      // Save to nikigai_responses
      await supabase.from('nikigai_responses').insert({
        user_id: user.id,
        flow_type: 'persona_identifier',
        response_type: 'personas',
        response_data: {
          chapters: chapters.filter(ch => ch.name.trim()),
          clusters: clustersWithRatings
        }
      })

      // Also save to nikigai_clusters for integration
      const clustersToSave = clustersWithRatings.map(cluster => ({
        user_id: user.id,
        cluster_type: 'persona',
        cluster_stage: 'final',
        cluster_label: cluster.label,
        insight: cluster.insight,
        proficiency: cluster.journeyStage,
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

      setClusters(clustersWithRatings)
      setCurrentScreen(SCREENS.COMPLETE)
    } catch (err) {
      console.error('Error saving with ratings:', err)
      setError('Error saving. Please try again.')
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

      <button
        className="primary-button"
        onClick={() => setCurrentScreen(SCREENS.CHAPTERS)}
      >
        Let's Begin
      </button>
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

      {chapters.length < 7 && (
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
          disabled={!allPersonasRated()}
        >
          Save & See Results
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
        <h2>Personas Identified!</h2>
        <p className="complete-text">
          Based on your journey, we've identified {clusters.length} personas—former versions of yourself who need what you've learned:
        </p>

        <div className="persona-results">
          {clusters.map((cluster, index) => {
            const stageInfo = getJourneyStageInfo(cluster.journeyStage || personaRatings[cluster.label])
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

        <div className="nav-buttons">
          <button
            className="primary-button"
            onClick={() => navigate('/7-day-challenge')}
          >
            Continue to Challenges
          </button>
        </div>
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
