import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient.js'
import { extractTags } from './lib/tagExtraction.js'
import { generateClusters, generateClusterLabel, calculateClusterQualityMetrics } from './lib/clustering.js'
import { processTagWeights, extractBulletPoints } from './lib/weighting.js'

/**
 * Nikigai Test Page
 * Simple interface to test the complete Nikigai flow
 */
export default function NikigaiTest() {
  const [sessionId, setSessionId] = useState(null)
  const [currentStep, setCurrentStep] = useState('2.0')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [clusters, setClusters] = useState(null)
  const [allResponses, setAllResponses] = useState([])
  const [error, setError] = useState(null)

  // Sample questions (from v2.2 flow)
  const questions = {
    '2.0': {
      prompt: "Let's start with Childhood (Pre-school + Primary).\n\nWhat did you *love doing most*? These can be games, hobbies, or activities that made you lose track of time.\n\nPlease share 3–5 short bullets (the more the better!).",
      store_as: 'life_map.hobbies.childhood',
      shouldCluster: false
    },
    '2.1': {
      prompt: "Now think of High School.\n\nWhat did you enjoy doing most for fun or self-expression?\n\nShare 3–5 bullets.",
      store_as: 'life_map.hobbies.highschool',
      shouldCluster: false
    },
    '2.2': {
      prompt: "Finally, from 18 to Now — what activities, hobbies, or creative outlets light you up today?\n\n3–5 bullets please.",
      store_as: 'life_map.hobbies.current',
      shouldCluster: true, // First clustering checkpoint
      clusterType: 'skills',
      clusterStage: 'preview'
    }
  }

  // Initialize session
  useEffect(() => {
    initSession()
  }, [])

  async function initSession() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please log in first')
        return
      }

      // Create new session
      const { data, error } = await supabase
        .from('nikigai_sessions')
        .insert({
          user_id: user.id,
          flow_version: 'v2.2',
          status: 'in_progress',
          last_step_id: '2.0'
        })
        .select()
        .single()

      if (error) throw error

      setSessionId(data.id)
      console.log('✅ Session created:', data.id)
    } catch (err) {
      console.error('Error creating session:', err)
      setError(err.message)
    }
  }

  async function handleSubmit() {
    if (!response.trim()) {
      alert('Please enter a response')
      return
    }

    if (!sessionId) {
      alert('Session not initialized. Please refresh.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Step 1: Extract tags
      console.log('🔍 Extracting tags...')
      const tags = await extractTags(response, {
        step_id: currentStep,
        store_as: questions[currentStep].store_as
      })
      console.log('✅ Tags extracted:', tags)

      // Step 2: Count bullets
      const bullets = extractBulletPoints(response)
      console.log('📝 Bullets found:', bullets.length)

      // Step 3: Save response to Supabase
      const { data: savedResponse, error: saveError } = await supabase
        .from('nikigai_responses')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          step_id: currentStep,
          step_order_index: parseInt(currentStep.replace('.', '')),
          question_text: questions[currentStep].prompt,
          response_raw: response,
          bullet_count: bullets.length,
          tags_extracted: tags
        })
        .select()
        .single()

      if (saveError) throw saveError
      console.log('✅ Response saved:', savedResponse.id)

      // Step 4: Add to responses array
      const newResponses = [...allResponses, savedResponse]
      setAllResponses(newResponses)

      // Step 5: If this is a clustering checkpoint, generate clusters
      if (questions[currentStep].shouldCluster) {
        console.log('🎯 Generating clusters...')

        // Prepare items for clustering
        const items = newResponses.flatMap(resp =>
          extractBulletPoints(resp.response_raw).map(bullet => ({
            text: bullet,
            tags: resp.tags_extracted,
            source_step: resp.step_id,
            bullet_score: 0 // Will be calculated
          }))
        )

        // Generate clusters
        const generatedClusters = generateClusters(items, {
          target_clusters_min: 3,
          target_clusters_max: 6,
          source_tags: ['skill_verb', 'domain_topic', 'value']
        })

        // Add labels
        const labeledClusters = generatedClusters.map(cluster => ({
          ...cluster,
          label: generateClusterLabel(cluster)
        }))

        // Calculate quality metrics
        const qualityMetrics = calculateClusterQualityMetrics(labeledClusters)
        console.log('📊 Quality metrics:', qualityMetrics)

        setClusters({
          clusters: labeledClusters,
          quality: qualityMetrics
        })

        console.log('✅ Clusters generated:', labeledClusters.length)
      }

      // Step 6: Clear response and move to next step
      setResponse('')
      const nextStep = getNextStep(currentStep)
      if (nextStep) {
        setCurrentStep(nextStep)
      } else {
        alert('Flow complete! 🎉')
      }

    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function getNextStep(current) {
    const steps = Object.keys(questions)
    const currentIndex = steps.indexOf(current)
    return steps[currentIndex + 1] || null
  }

  if (!sessionId && !error) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Initializing Nikigai Test...</h2>
        <p>Creating session...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nikigai AI Test</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Session ID: {sessionId}
      </p>

      {error && (
        <div style={{ background: '#fee', padding: '15px', marginBottom: '20px', borderRadius: '8px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Question */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>
          Step {currentStep}
        </h2>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '20px' }}>
          {questions[currentStep]?.prompt || 'No more questions'}
        </div>
      </div>

      {/* Response Input */}
      {questions[currentStep] && (
        <>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Enter your response here (use bullet points with • or - or numbers)"
            rows={8}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '15px',
              fontFamily: 'inherit'
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={loading || !response.trim()}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              background: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </>
      )}

      {/* Clusters Display */}
      {clusters && (
        <div style={{ marginTop: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
          <h3>✨ Skill Clusters Emerging:</h3>

          <div style={{ marginBottom: '15px', fontSize: '14px', color: '#666' }}>
            Quality: {clusters.quality.grade} ({Math.round(clusters.quality.overall_score * 100)}%)
            <br />
            Coherence: {Math.round(clusters.quality.coherence * 100)}%
            | Distinctness: {Math.round(clusters.quality.distinctness * 100)}%
            | Balance: {Math.round(clusters.quality.balance * 100)}%
          </div>

          {clusters.clusters.map((cluster, index) => (
            <div key={index} style={{ marginBottom: '20px', padding: '15px', background: 'white', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0' }}>
                📦 {cluster.label} ({cluster.items.length} items)
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {cluster.items.slice(0, 5).map((item, i) => (
                  <li key={i} style={{ marginBottom: '5px' }}>{item.text}</li>
                ))}
                {cluster.items.length > 5 && (
                  <li style={{ color: '#999' }}>+ {cluster.items.length - 5} more...</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Progress */}
      <div style={{ marginTop: '40px', padding: '15px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Progress:</h4>
        <div>Responses: {allResponses.length}</div>
        <div>Current Step: {currentStep}</div>
        <div>Steps Remaining: {Object.keys(questions).length - Object.keys(questions).indexOf(currentStep) - 1}</div>
      </div>
    </div>
  )
}
