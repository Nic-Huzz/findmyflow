/**
 * PlayListFinderFlow.jsx
 *
 * A 4-question discovery flow to identify skills through play and role models.
 * Uses the same clustering approach as FlowFinderPersona for reliability.
 *
 * Questions:
 * 1. Role Models - Who inspires you? What do they do?
 * 2. No Fear Fantasy - What would you do with zero fear?
 * 3. Secret Wishes - What do you wish you could get paid to do?
 * 4. Groan Zone - What sounds fun but makes you nervous?
 *
 * Then AI clusters into skills, user rates proficiency.
 *
 * Created: Feb 2026
 */

import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
// Proficiency levels for skill rating
const PROFICIENCY_LEVELS = [
  { id: 'learning', label: 'Learning', color: '#fbbf24' },
  { id: 'practicing', label: 'Practicing', color: '#60a5fa' },
  { id: 'mastering', label: 'Mastering', color: '#6BCB77' }
]
import '../styles/flow-base.css'
import './PlayListFinderFlow.css'

const SCREENS = {
  INTRO: 'intro',
  ROLE_MODELS: 'role_models',
  NO_FEAR: 'no_fear',
  SECRET_WISHES: 'secret_wishes',
  GROAN_ZONE: 'groan_zone',
  ANALYZING: 'analyzing',
  RATING: 'rating',
  COMPLETE: 'complete'
}

export default function PlayListFinderFlow() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentScreen, setCurrentScreen] = useState(SCREENS.INTRO)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState(null)

  // Form data
  const [roleModels, setRoleModels] = useState([
    { person: '', activity: '' },
    { person: '', activity: '' },
    { person: '', activity: '' }
  ])
  const [noFearAnswers, setNoFearAnswers] = useState(['', '', ''])
  const [secretWishAnswers, setSecretWishAnswers] = useState(['', '', ''])
  const [groanZoneAnswers, setGroanZoneAnswers] = useState(['', '', ''])

  // AI-generated skill clusters
  const [clusters, setClusters] = useState([])
  // Proficiency ratings for each skill: { 'cluster_label': 'learning' | 'practicing' | 'mastering' }
  const [skillRatings, setSkillRatings] = useState({})

  // Add role model row
  const addRoleModelRow = () => {
    if (roleModels.length < 5) {
      setRoleModels([...roleModels, { person: '', activity: '' }])
    }
  }

  // Update role model
  const updateRoleModel = (index, field, value) => {
    const updated = [...roleModels]
    updated[index][field] = value
    setRoleModels(updated)
  }

  // Remove role model row
  const removeRoleModelRow = (index) => {
    if (roleModels.length > 1) {
      const updated = roleModels.filter((_, i) => i !== index)
      setRoleModels(updated)
    }
  }

  // Check if role models step is valid (at least 1)
  const hasValidRoleModels = roleModels.some(rm => rm.person.trim() && rm.activity.trim())

  // Check if no fear step is valid (at least 1)
  const hasValidNoFear = noFearAnswers.some(a => a.trim())

  // Check if secret wishes step is valid (at least 1)
  const hasValidSecretWishes = secretWishAnswers.some(a => a.trim())

  // Check if groan zone step is valid (at least 1)
  const hasValidGroanZone = groanZoneAnswers.some(a => a.trim())

  // Update a multi-answer field
  const updateMultiAnswer = (setter, index, value) => {
    setter(prev => {
      const updated = [...prev]
      updated[index] = value
      return updated
    })
  }

  // Update rating for a skill
  const setSkillRating = (skillLabel, rating) => {
    setSkillRatings(prev => ({
      ...prev,
      [skillLabel]: rating
    }))
  }

  // Check if all skills have been rated
  const allSkillsRated = () => {
    return clusters.every(cluster => skillRatings[cluster.label])
  }

  // Analyze answers with AI using FlowFinderPersona's clustering approach
  const analyzeWithAI = useCallback(async () => {
    setIsAnalyzing(true)
    setError(null)
    setCurrentScreen(SCREENS.ANALYZING)

    try {
      // Build context from all answers
      const filledRoleModels = roleModels.filter(rm => rm.person.trim() && rm.activity.trim())
      const filledNoFear = noFearAnswers.filter(a => a.trim())
      const filledSecretWishes = secretWishAnswers.filter(a => a.trim())
      const filledGroanZone = groanZoneAnswers.filter(a => a.trim())

      // Format answers as context string
      const answersContext = `
Role Models (people whose work they admire):
${filledRoleModels.map(rm => `- ${rm.person}: ${rm.activity}`).join('\n') || 'None provided'}

If they had zero fear, they would:
${filledNoFear.map((a, i) => `${i + 1}. ${a}`).join('\n') || 'Not answered'}

What they secretly wish they could get paid to do:
${filledSecretWishes.map((a, i) => `${i + 1}. ${a}`).join('\n') || 'Not answered'}

Activities that sound fun but make them nervous:
${filledGroanZone.map((a, i) => `${i + 1}. ${a}`).join('\n') || 'Not answered'}
`.trim()

      // Create allResponses array in the format the edge function expects
      const allResponses = [{
        user_id: user.id,
        response_raw: answersContext,
        store_as: 'skills_analysis'
      }]

      // Call Claude API to generate skill clusters (same pattern as FlowFinderPersona)
      const { data, error: fnError } = await supabase.functions.invoke('nikigai-conversation', {
        body: {
          currentStep: { id: 'skills_final', assistant_prompt: 'Skills clustering from play-list answers' },
          userResponse: 'Ready to discover my skills',
          shouldCluster: true,
          clusterType: 'skills',
          clusterSources: ['skills_analysis'],
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
      console.error('Error analyzing:', err)
      setError('Error generating insights. Please try again.')
      setCurrentScreen(SCREENS.GROAN_ZONE)
    } finally {
      setIsAnalyzing(false)
    }
  }, [roleModels, noFearAnswers, secretWishAnswers, groanZoneAnswers, user?.id])

  // Save clusters with proficiency ratings to database
  const saveWithRatings = async () => {
    try {
      // Add proficiency to each cluster
      const clustersWithRatings = clusters.map(cluster => ({
        ...cluster,
        proficiency: skillRatings[cluster.label] || 'practicing'
      }))

      // Save to nikigai_responses
      await supabase.from('nikigai_responses').insert({
        user_id: user.id,
        flow_type: 'play_list_finder',
        response_type: 'skills',
        response_data: {
          answers: {
            roleModels: roleModels.filter(rm => rm.person.trim()),
            noFear: noFearAnswers.filter(a => a.trim()),
            secretWishes: secretWishAnswers.filter(a => a.trim()),
            groanZone: groanZoneAnswers.filter(a => a.trim())
          },
          clusters: clustersWithRatings
        }
      })

      // Also save to nikigai_clusters for integration
      const clustersToSave = clustersWithRatings.map(cluster => ({
        user_id: user.id,
        cluster_type: 'skills',
        cluster_stage: 'final',
        cluster_label: cluster.label,
        insight: cluster.insight,
        proficiency: cluster.proficiency,
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

  // Navigation
  const goToNext = () => {
    const screenOrder = [
      SCREENS.INTRO,
      SCREENS.ROLE_MODELS,
      SCREENS.NO_FEAR,
      SCREENS.SECRET_WISHES,
      SCREENS.GROAN_ZONE
    ]
    const currentIndex = screenOrder.indexOf(currentScreen)
    if (currentIndex < screenOrder.length - 1) {
      setCurrentScreen(screenOrder[currentIndex + 1])
    } else {
      // Last question - analyze
      analyzeWithAI()
    }
  }

  const goToPrev = () => {
    const screenOrder = [
      SCREENS.INTRO,
      SCREENS.ROLE_MODELS,
      SCREENS.NO_FEAR,
      SCREENS.SECRET_WISHES,
      SCREENS.GROAN_ZONE
    ]
    const currentIndex = screenOrder.indexOf(currentScreen)
    if (currentIndex > 0) {
      setCurrentScreen(screenOrder[currentIndex - 1])
    }
  }

  // Render screens
  const renderIntro = () => (
    <div className="flow-screen intro-screen">
      <div className="flow-icon">🎯</div>
      <h1>Discover Your Play-List</h1>
      <p className="flow-subtitle">
        The things that feel like play reveal your authentic gifts.
        Let's find them through 4 simple questions.
      </p>

      <div className="intro-points">
        <div className="intro-point">
          <span className="point-icon">👤</span>
          <span>Who inspires you? (up to 5)</span>
        </div>
        <div className="intro-point">
          <span className="point-icon">🦸</span>
          <span>What would you do fearlessly? (up to 3)</span>
        </div>
        <div className="intro-point">
          <span className="point-icon">💰</span>
          <span>What do you wish you could get paid to do? (up to 3)</span>
        </div>
        <div className="intro-point">
          <span className="point-icon">😬</span>
          <span>What's fun but scary? (up to 3)</span>
        </div>
      </div>

      <button className="primary-button" onClick={goToNext}>
        Let's Go
      </button>
    </div>
  )

  const renderRoleModels = () => (
    <div className="flow-screen">
      <div className="question-header">
        <span className="question-number">1 of 4</span>
        <h2>Who inspires you?</h2>
        <p className="question-subtitle">
          Think of people whose work or life makes you think "I'd love to do that."
          What specifically appeals to you about what they do?
        </p>
      </div>

      <div className="role-models-form">
        {roleModels.map((rm, index) => (
          <div key={index} className="role-model-row">
            <input
              type="text"
              placeholder="Person or brand..."
              value={rm.person}
              onChange={(e) => updateRoleModel(index, 'person', e.target.value)}
              className="role-model-input person-input"
            />
            <input
              type="text"
              placeholder="What they do that appeals to you..."
              value={rm.activity}
              onChange={(e) => updateRoleModel(index, 'activity', e.target.value)}
              className="role-model-input activity-input"
            />
            {roleModels.length > 1 && (
              <button
                className="remove-row-btn"
                onClick={() => removeRoleModelRow(index)}
                aria-label="Remove"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {roleModels.length < 5 && (
          <button className="add-row-btn" onClick={addRoleModelRow}>
            + Add another
          </button>
        )}
      </div>

      <div className="example-hint">
        <strong>Examples:</strong> Tony Robbins - Group seminars,
        Day Breaker - Sunrise silent discos,
        A friend - Their coaching style
      </div>

      <div className="nav-buttons">
        <button className="secondary-button" onClick={goToPrev}>
          Back
        </button>
        <button
          className="primary-button"
          onClick={goToNext}
          disabled={!hasValidRoleModels}
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderNoFear = () => (
    <div className="flow-screen">
      <div className="question-header">
        <span className="question-number">2 of 4</span>
        <h2>If you had zero fear...</h2>
        <p className="question-subtitle">
          If you had zero fear of failure, judgment, or rejection -
          what would you spend your days doing? (up to 3)
        </p>
      </div>

      <div className="multi-input-list">
        {noFearAnswers.map((answer, index) => (
          <div key={index} className="multi-input-row">
            <span className="input-number">{index + 1}</span>
            <input
              type="text"
              className="multi-input"
              placeholder={index === 0 ? "I would..." : "Another thing I would do..."}
              value={answer}
              onChange={(e) => updateMultiAnswer(setNoFearAnswers, index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="example-hint">
        <strong>Think big.</strong> This isn't about what's practical -
        it's about what lights you up.
      </div>

      <div className="nav-buttons">
        <button className="secondary-button" onClick={goToPrev}>
          Back
        </button>
        <button
          className="primary-button"
          onClick={goToNext}
          disabled={!hasValidNoFear}
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderSecretWishes = () => (
    <div className="flow-screen">
      <div className="question-header">
        <span className="question-number">3 of 4</span>
        <h2>Secret Wishes</h2>
        <p className="question-subtitle">
          What do you secretly wish you could get paid to do or talk about? (up to 3)
        </p>
      </div>

      <div className="multi-input-list">
        {secretWishAnswers.map((answer, index) => (
          <div key={index} className="multi-input-row">
            <span className="input-number">{index + 1}</span>
            <input
              type="text"
              className="multi-input"
              placeholder={index === 0 ? "I wish I could get paid to..." : "Another secret wish..."}
              value={answer}
              onChange={(e) => updateMultiAnswer(setSecretWishAnswers, index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="example-hint">
        <strong>No judgment.</strong> These are the things you might dismiss as
        "just hobbies" but secretly dream about.
      </div>

      <div className="nav-buttons">
        <button className="secondary-button" onClick={goToPrev}>
          Back
        </button>
        <button
          className="primary-button"
          onClick={goToNext}
          disabled={!hasValidSecretWishes}
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderGroanZone = () => (
    <div className="flow-screen">
      <div className="question-header">
        <span className="question-number">4 of 4</span>
        <h2>The Groan Zone</h2>
        <p className="question-subtitle">
          What activities sound fun but make you nervous just thinking about doing them? (up to 3)
        </p>
      </div>

      <div className="multi-input-list">
        {groanZoneAnswers.map((answer, index) => (
          <div key={index} className="multi-input-row">
            <span className="input-number">{index + 1}</span>
            <input
              type="text"
              className="multi-input"
              placeholder={index === 0 ? "Something that sounds fun but scary..." : "Another fun but scary thing..."}
              value={answer}
              onChange={(e) => updateMultiAnswer(setGroanZoneAnswers, index, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="example-hint">
        <strong>This is gold.</strong> The intersection of "this would be fun"
        and "this terrifies me" often reveals your most authentic gifts.
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="nav-buttons">
        <button className="secondary-button" onClick={goToPrev}>
          Back
        </button>
        <button
          className="primary-button"
          onClick={analyzeWithAI}
          disabled={!hasValidGroanZone || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing...' : 'Discover My Skills'}
        </button>
      </div>
    </div>
  )

  const renderAnalyzing = () => (
    <div className="flow-screen analyzing-screen">
      <div className="analyzing-animation">
        <div className="spinner"></div>
      </div>
      <h2>Discovering your skills...</h2>
      <p className="analyzing-text">
        Analyzing your answers to find patterns and identify your natural gifts.
      </p>
    </div>
  )

  const renderRating = () => {
    const ratedCount = Object.keys(skillRatings).length
    const totalCount = clusters.length

    // Fallback proficiency levels if not imported
    const levels = PROFICIENCY_LEVELS || [
      { id: 'learning', label: 'Learning', color: '#fbbf24' },
      { id: 'practicing', label: 'Practicing', color: '#60a5fa' },
      { id: 'mastering', label: 'Mastering', color: '#6BCB77' }
    ]

    return (
      <div className="flow-screen rating-screen">
        <div className="question-header">
          <div className="question-number">Final Step</div>
          <h2>Rate your proficiency</h2>
          <p className="question-subtitle">
            For each skill we discovered, how would you rate your current level?
          </p>
        </div>

        <div className="rating-legend">
          <div className="legend-items">
            {levels.map(level => (
              <div key={level.id} className="legend-item">
                <div className="legend-dot" style={{ background: level.color }} />
                <span>{level.label}</span>
              </div>
            ))}
          </div>
          <p className="rating-progress">{ratedCount} of {totalCount} rated</p>
        </div>

        <div className="skill-rating-list">
          {clusters.map((cluster, index) => (
            <div key={index} className="skill-rating-card">
              <div className="skill-info">
                <div className="skill-label">{cluster.label}</div>
                <div className="skill-insight">{cluster.insight}</div>
              </div>
              <div className="rating-buttons">
                <button
                  onClick={() => setSkillRating(cluster.label, 'learning')}
                  className={`rating-btn learning ${skillRatings[cluster.label] === 'learning' ? 'active' : ''}`}
                >
                  Learning
                </button>
                <button
                  onClick={() => setSkillRating(cluster.label, 'practicing')}
                  className={`rating-btn practicing ${skillRatings[cluster.label] === 'practicing' ? 'active' : ''}`}
                >
                  Practicing
                </button>
                <button
                  onClick={() => setSkillRating(cluster.label, 'mastering')}
                  className={`rating-btn mastering ${skillRatings[cluster.label] === 'mastering' ? 'active' : ''}`}
                >
                  Mastering
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          className="primary-button save-btn"
          onClick={saveWithRatings}
          disabled={!allSkillsRated()}
        >
          Save & See Results
        </button>
      </div>
    )
  }

  const renderComplete = () => {
    const getLevelInfo = (level) => {
      const levels = PROFICIENCY_LEVELS || [
        { id: 'learning', label: 'Learning', color: '#fbbf24' },
        { id: 'practicing', label: 'Practicing', color: '#60a5fa' },
        { id: 'mastering', label: 'Mastering', color: '#6BCB77' }
      ]
      return levels.find(l => l.id === level) || levels[1]
    }

    return (
      <div className="flow-screen complete-screen">
        <div className="complete-icon">🎉</div>
        <h2>Skills Discovered!</h2>
        <p className="complete-text">
          Based on what feels like play to you, we've identified {clusters.length} skill areas:
        </p>

        <div className="skill-results">
          {clusters.map((cluster, index) => {
            const levelInfo = getLevelInfo(cluster.proficiency || skillRatings[cluster.label])
            return (
              <div key={index} className="skill-result-card">
                {levelInfo && (
                  <div className="level-badge" style={{ background: `${levelInfo.color}20`, color: levelInfo.color }}>
                    <div className="level-dot" style={{ background: levelInfo.color }} />
                    {levelInfo.label}
                  </div>
                )}
                <h3>{cluster.label}</h3>
                <p>{cluster.insight}</p>
                {cluster.items && cluster.items.length > 0 && (
                  <div className="cluster-evidence">
                    <div className="evidence-label">Based on your answers:</div>
                    <ul>
                      {cluster.items.slice(0, 3).map((item, i) => (
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
    <div className="play-list-finder-flow">
      <div className="flow-container">
        {currentScreen === SCREENS.INTRO && renderIntro()}
        {currentScreen === SCREENS.ROLE_MODELS && renderRoleModels()}
        {currentScreen === SCREENS.NO_FEAR && renderNoFear()}
        {currentScreen === SCREENS.SECRET_WISHES && renderSecretWishes()}
        {currentScreen === SCREENS.GROAN_ZONE && renderGroanZone()}
        {currentScreen === SCREENS.ANALYZING && renderAnalyzing()}
        {currentScreen === SCREENS.RATING && renderRating()}
        {currentScreen === SCREENS.COMPLETE && renderComplete()}
      </div>
    </div>
  )
}
