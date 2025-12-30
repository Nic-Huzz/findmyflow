/**
 * GroansSummary - Summary page for Groans tab data and insights
 *
 * Displays:
 * - Days completed progress
 * - Essence vs Protective archetype breakdown
 * - Total groans completed by type (Recognise/Rewire/Reconnect)
 * - Most triggered protective voices
 * - Most common fears
 * - Vulnerability layer patterns
 * - Outcome trends
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import './GroansSummary.css'

function GroansSummary({ onBack, progress, completions: passedCompletions }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCompleted: 0,
    byType: { Recognise: 0, Rewire: 0, Reconnect: 0 },
    protectiveVoices: {},
    fears: {},
    vulnerabilityLayers: {},
    outcomes: {},
    totalPoints: 0,
    // Enhanced stats
    areasOfLife: {},
    triggerTypes: {},
    positiveFrequencies: {},
    negativeFrequencies: {},
    joySources: {},
    breathworkTypes: {},
    essenceExpressions: {},
    avgIntensity: { total: 0, count: 0 },
    weeklyProgress: [],
    // Archetype breakdown
    essenceCount: 0,
    protectiveCount: 0,
    daysWithCompletions: new Set()
  })

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return

      try {
        // Fetch all groan-related quest completions
        const { data: completions, error } = await supabase
          .from('quest_completions')
          .select('quest_id, quest_category, response_data, points_earned, created_at')
          .eq('user_id', user.id)
          .in('quest_category', ['Recognise', 'Rewire', 'Reconnect'])

        if (error) throw error

        // Process the data
        const processed = {
          totalCompleted: completions?.length || 0,
          byType: { Recognise: 0, Rewire: 0, Reconnect: 0 },
          protectiveVoices: {},
          fears: {},
          vulnerabilityLayers: {},
          outcomes: {},
          totalPoints: 0,
          areasOfLife: {},
          triggerTypes: {},
          positiveFrequencies: {},
          negativeFrequencies: {},
          joySources: {},
          breathworkTypes: {},
          essenceExpressions: {},
          avgIntensity: { total: 0, count: 0 },
          weeklyProgress: [],
          essenceCount: 0,
          protectiveCount: 0,
          daysWithCompletions: new Set()
        }

        // Track weekly completions
        const weekMap = {}

        // Track essence vs protective quests
        const essenceQuestIds = ['recognise_essence_observe', 'recognise_positive_frequency']
        const protectiveQuestIds = ['recognise_protective_observe', 'recognise_negative_frequency', 'recognise_trigger_pattern']

        completions?.forEach(completion => {
          // Count by type
          if (processed.byType[completion.quest_category] !== undefined) {
            processed.byType[completion.quest_category]++
          }

          // Add points
          processed.totalPoints += completion.points_earned || 0

          // Track weekly progress
          const date = new Date(completion.created_at)
          const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`
          weekMap[weekKey] = (weekMap[weekKey] || 0) + 1

          // Track days with completions
          const dayKey = date.toISOString().split('T')[0]
          processed.daysWithCompletions.add(dayKey)

          // Track essence vs protective
          if (essenceQuestIds.includes(completion.quest_id)) {
            processed.essenceCount++
          } else if (protectiveQuestIds.includes(completion.quest_id)) {
            processed.protectiveCount++
          }

          // Parse response data for deeper insights
          if (completion.response_data) {
            try {
              const data = typeof completion.response_data === 'string'
                ? JSON.parse(completion.response_data)
                : completion.response_data

              // Track protective voices
              if (data.protective_voice) {
                processed.protectiveVoices[data.protective_voice] =
                  (processed.protectiveVoices[data.protective_voice] || 0) + 1
              }

              // Track fears
              if (data.fears_triggered) {
                data.fears_triggered.forEach(fear => {
                  processed.fears[fear] = (processed.fears[fear] || 0) + 1
                })
              }
              if (data.fears) {
                data.fears.forEach(fear => {
                  processed.fears[fear] = (processed.fears[fear] || 0) + 1
                })
              }

              // Track vulnerability layers
              if (data.vulnerability_layer) {
                const layerNames = ['', 'Screen', 'Live', 'Tribe', 'Money', 'Heart']
                const layerName = layerNames[data.vulnerability_layer] || `Layer ${data.vulnerability_layer}`
                processed.vulnerabilityLayers[layerName] =
                  (processed.vulnerabilityLayers[layerName] || 0) + 1
              }

              // Track outcomes
              if (data.outcome) {
                processed.outcomes[data.outcome] =
                  (processed.outcomes[data.outcome] || 0) + 1
              }

              // Track areas of life
              if (data.area_of_life) {
                processed.areasOfLife[data.area_of_life] =
                  (processed.areasOfLife[data.area_of_life] || 0) + 1
              }

              // Track trigger types
              if (data.trigger_type) {
                processed.triggerTypes[data.trigger_type] =
                  (processed.triggerTypes[data.trigger_type] || 0) + 1
              }

              // Track frequencies (positive vs negative based on quest_id)
              if (data.frequency) {
                if (completion.quest_id === 'recognise_positive_frequency') {
                  processed.positiveFrequencies[data.frequency] =
                    (processed.positiveFrequencies[data.frequency] || 0) + 1
                } else if (completion.quest_id === 'recognise_negative_frequency') {
                  processed.negativeFrequencies[data.frequency] =
                    (processed.negativeFrequencies[data.frequency] || 0) + 1
                }
              }

              // Track joy sources (from Rewire)
              if (data.joy_type) {
                processed.joySources[data.joy_type] =
                  (processed.joySources[data.joy_type] || 0) + 1
              }

              // Track breathwork types (from Reconnect)
              if (data.breathwork_type) {
                processed.breathworkTypes[data.breathwork_type] =
                  (processed.breathworkTypes[data.breathwork_type] || 0) + 1
              }

              // Track essence expressions
              if (data.expression_type) {
                processed.essenceExpressions[data.expression_type] =
                  (processed.essenceExpressions[data.expression_type] || 0) + 1
              }

              // Track intensity average
              if (data.intensity && typeof data.intensity === 'number') {
                processed.avgIntensity.total += data.intensity
                processed.avgIntensity.count++
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        })

        // Convert week map to sorted array
        processed.weeklyProgress = Object.entries(weekMap)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .slice(-4) // Last 4 weeks

        setStats(processed)
      } catch (error) {
        console.error('Error fetching groan stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  // Get sorted array from object for display
  const sortedEntries = (obj) => {
    return Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }

  // Calculate percentage
  const getPercentage = (value, total) => {
    if (total === 0) return 0
    return Math.round((value / total) * 100)
  }

  // Calculate days completed percentage (out of 7-day challenge)
  const daysCompleted = stats.daysWithCompletions?.size || 0
  const totalDays = progress?.current_day || 7
  const daysPercentage = Math.round((daysCompleted / Math.min(totalDays, 7)) * 100)

  // Calculate archetype balance
  const totalArchetype = stats.essenceCount + stats.protectiveCount
  const essencePercentage = totalArchetype > 0 ? Math.round((stats.essenceCount / totalArchetype) * 100) : 0
  const protectivePercentage = totalArchetype > 0 ? 100 - essencePercentage : 0

  // Calculate fear percentages
  const totalFears = Object.values(stats.fears).reduce((a, b) => a + b, 0)
  const fearPercentages = {
    judged: totalFears > 0 ? Math.round(((stats.fears['judgment'] || stats.fears['judged'] || 0) / totalFears) * 100) : 0,
    notEnough: totalFears > 0 ? Math.round(((stats.fears['worthiness'] || stats.fears['not_enough'] || 0) / totalFears) * 100) : 0,
    mightFail: totalFears > 0 ? Math.round(((stats.fears['failure'] || stats.fears['might_fail'] || 0) / totalFears) * 100) : 0
  }

  // Calculate layer percentages
  const totalLayers = Object.values(stats.vulnerabilityLayers).reduce((a, b) => a + b, 0)
  const layerPercentages = {
    screen: totalLayers > 0 ? Math.round(((stats.vulnerabilityLayers['Screen'] || 0) / totalLayers) * 100) : 0,
    live: totalLayers > 0 ? Math.round(((stats.vulnerabilityLayers['Live'] || 0) / totalLayers) * 100) : 0,
    tribe: totalLayers > 0 ? Math.round(((stats.vulnerabilityLayers['Tribe'] || 0) / totalLayers) * 100) : 0,
    money: totalLayers > 0 ? Math.round(((stats.vulnerabilityLayers['Money'] || 0) / totalLayers) * 100) : 0,
    heart: totalLayers > 0 ? Math.round(((stats.vulnerabilityLayers['Heart'] || 0) / totalLayers) * 100) : 0
  }

  // Calculate area of life percentages
  const totalAreas = Object.values(stats.areasOfLife).reduce((a, b) => a + b, 0)
  const areaPercentages = {
    work: totalAreas > 0 ? Math.round(((stats.areasOfLife['work'] || 0) / totalAreas) * 100) : 0,
    relationship: totalAreas > 0 ? Math.round(((stats.areasOfLife['relationship'] || 0) / totalAreas) * 100) : 0,
    self: totalAreas > 0 ? Math.round(((stats.areasOfLife['self'] || 0) / totalAreas) * 100) : 0,
    money: totalAreas > 0 ? Math.round(((stats.areasOfLife['money'] || 0) / totalAreas) * 100) : 0,
    health: totalAreas > 0 ? Math.round(((stats.areasOfLife['health'] || 0) / totalAreas) * 100) : 0,
    family: totalAreas > 0 ? Math.round(((stats.areasOfLife['family'] || 0) / totalAreas) * 100) : 0
  }

  // Calculate streak (consecutive days)
  const calculateStreak = () => {
    if (!stats.daysWithCompletions || stats.daysWithCompletions.size === 0) return 0
    const sortedDays = Array.from(stats.daysWithCompletions).sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    // Check if today or yesterday has completions
    if (!sortedDays.includes(today) && !sortedDays.includes(yesterday)) return 0

    let streak = 0
    let checkDate = new Date(sortedDays[0])

    for (const dayStr of sortedDays) {
      const expected = checkDate.toISOString().split('T')[0]
      if (dayStr === expected) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }
    return streak
  }
  const currentStreak = calculateStreak()

  // Generate personalized insight headline
  const getPersonalizedInsight = () => {
    if (stats.totalCompleted === 0) return null

    // Check for patterns
    if (currentStreak >= 5) return { emoji: '🔥', text: "You're on fire!", subtext: `${currentStreak} day streak!` }
    if (daysPercentage >= 100) return { emoji: '🏆', text: 'Challenge Champion!', subtext: 'You showed up every day' }
    if (essencePercentage >= 70) return { emoji: '✨', text: 'Essence Explorer', subtext: 'You lead with your light' }
    if (protectivePercentage >= 70) return { emoji: '🛡️', text: 'Pattern Breaker', subtext: 'Confronting your shadows' }
    if (stats.byType.Reconnect > stats.byType.Recognise) return { emoji: '🧘', text: 'Reconnection Master', subtext: 'Finding your center' }
    if (stats.byType.Rewire > 3) return { emoji: '🧠', text: 'Rewiring Expert', subtext: 'Transforming old patterns' }
    if (currentStreak >= 3) return { emoji: '⚡', text: 'Building Momentum!', subtext: `${currentStreak} days strong` }
    return { emoji: '🌱', text: 'Growing Awareness', subtext: 'Every step counts' }
  }
  const insight = getPersonalizedInsight()

  // Suggest next action based on gaps
  const getNextAction = () => {
    if (stats.totalCompleted === 0) return null

    const { Recognise, Rewire, Reconnect } = stats.byType
    const total = Recognise + Rewire + Reconnect

    if (Recognise === 0) return { action: 'Try a Recognise quest', reason: 'Start noticing your patterns' }
    if (Rewire === 0 && Recognise >= 2) return { action: 'Try a Rewire quest', reason: 'Transform what you noticed' }
    if (Reconnect === 0 && Rewire >= 1) return { action: 'Try a Reconnect quest', reason: 'Ground yourself in your body' }

    const recogniseRatio = Recognise / total
    const rewireRatio = Rewire / total
    const reconnectRatio = Reconnect / total

    if (recogniseRatio < 0.2) return { action: 'Do more Recognise quests', reason: 'Balance your practice' }
    if (rewireRatio < 0.2) return { action: 'Do more Rewire quests', reason: 'Transform more patterns' }
    if (reconnectRatio < 0.2) return { action: 'Do more Reconnect quests', reason: 'Connect body & mind' }

    return null
  }
  const nextAction = getNextAction()

  if (loading) {
    return (
      <div className="groans-summary full-page">
        <div className="summary-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2>Groans Summary</h2>
        </div>
        <div className="summary-loading">Loading insights...</div>
      </div>
    )
  }

  const totalByType = stats.byType.Recognise + stats.byType.Rewire + stats.byType.Reconnect

  return (
    <div className="groans-summary full-page">
      <div className="summary-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Groans Summary</h2>
      </div>

      <div className="summary-content">
        {/* Personalized Insight Hero */}
        {insight && (
          <div className={`insight-hero ${daysPercentage >= 100 ? 'celebration' : ''}`}>
            <span className="insight-hero-emoji">{insight.emoji}</span>
            <h2 className="insight-hero-title">{insight.text}</h2>
            <p className="insight-hero-subtext">{insight.subtext}</p>
          </div>
        )}

        {/* Voice Balance - Essence vs Protective */}
        <div className="summary-section">
          <h3>Voice Balance</h3>
          {totalArchetype > 0 ? (
            <div className="voice-balance">
              <div className="voice-row">
                <div className="voice-item essence">
                  <span className="voice-icon">✨</span>
                  <span className="voice-label">Essence</span>
                  <span className="voice-percent">{essencePercentage}%</span>
                </div>
                <div className="voice-item protective">
                  <span className="voice-icon">🛡️</span>
                  <span className="voice-label">Protective</span>
                  <span className="voice-percent">{protectivePercentage}%</span>
                </div>
              </div>
              <div className="voice-bar-container">
                <div className="voice-bar essence" style={{ width: `${essencePercentage}%` }} />
                <div className="voice-bar protective" style={{ width: `${protectivePercentage}%` }} />
              </div>
            </div>
          ) : (
            <p className="empty-hint">Complete challenges to see your voice balance</p>
          )}
        </div>

        {/* Fears Breakdown */}
        <div className="summary-section">
          <h3>Fear Triggers</h3>
          {totalFears > 0 ? (
            <div className="percent-grid three-col">
              <div className="percent-item">
                <span className="percent-icon">👁️</span>
                <span className="percent-value">{fearPercentages.judged}%</span>
                <span className="percent-label">Judged</span>
              </div>
              <div className="percent-item">
                <span className="percent-icon">🤦</span>
                <span className="percent-value">{fearPercentages.notEnough}%</span>
                <span className="percent-label">Not Enough</span>
              </div>
              <div className="percent-item">
                <span className="percent-icon">💥</span>
                <span className="percent-value">{fearPercentages.mightFail}%</span>
                <span className="percent-label">Might Fail</span>
              </div>
            </div>
          ) : (
            <p className="empty-hint">Complete challenges to see fear patterns</p>
          )}
        </div>

        {/* Visibility Layers Breakdown */}
        <div className="summary-section">
          <h3>Visibility Layers</h3>
          {totalLayers > 0 ? (
            <div className="percent-grid five-col">
              <div className={`percent-item ${layerPercentages.screen > 0 ? 'active' : ''}`}>
                <span className="percent-icon">📱</span>
                <span className="percent-value">{layerPercentages.screen}%</span>
                <span className="percent-label">Screen</span>
              </div>
              <div className={`percent-item ${layerPercentages.live > 0 ? 'active' : ''}`}>
                <span className="percent-icon">⚡</span>
                <span className="percent-value">{layerPercentages.live}%</span>
                <span className="percent-label">Live</span>
              </div>
              <div className={`percent-item ${layerPercentages.tribe > 0 ? 'active' : ''}`}>
                <span className="percent-icon">👥</span>
                <span className="percent-value">{layerPercentages.tribe}%</span>
                <span className="percent-label">Tribe</span>
              </div>
              <div className={`percent-item ${layerPercentages.money > 0 ? 'active' : ''}`}>
                <span className="percent-icon">💰</span>
                <span className="percent-value">{layerPercentages.money}%</span>
                <span className="percent-label">Money</span>
              </div>
              <div className={`percent-item ${layerPercentages.heart > 0 ? 'active' : ''}`}>
                <span className="percent-icon">💗</span>
                <span className="percent-value">{layerPercentages.heart}%</span>
                <span className="percent-label">Heart</span>
              </div>
            </div>
          ) : (
            <p className="empty-hint">Complete challenges to see layer breakdown</p>
          )}
        </div>

        {/* Areas of Life */}
        <div className="summary-section">
          <h3>Areas of Life</h3>
          {totalAreas > 0 ? (
            <div className="percent-grid three-col">
              {[
                { id: 'work', label: 'Work', icon: '💼' },
                { id: 'relationship', label: 'Relationship', icon: '💕' },
                { id: 'self', label: 'Self', icon: '🪞' },
                { id: 'money', label: 'Money', icon: '💰' },
                { id: 'health', label: 'Health', icon: '🏥' },
                { id: 'family', label: 'Family', icon: '👨‍👩‍👧' }
              ].map(area => (
                <div key={area.id} className={`percent-item ${areaPercentages[area.id] > 0 ? 'active' : ''}`}>
                  <span className="percent-icon">{area.icon}</span>
                  <span className="percent-value">{areaPercentages[area.id]}%</span>
                  <span className="percent-label">{area.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-hint">Complete Recognise challenges to see area patterns</p>
          )}
        </div>

        {/* Overview Stats */}
        <div className="summary-section overview">
          <div className="stat-card total">
            <span className="stat-value">{stats.totalCompleted}</span>
            <span className="stat-label">Total Groans</span>
          </div>
          <div className="stat-card points">
            <span className="stat-value">{stats.totalPoints}</span>
            <span className="stat-label">Points Earned</span>
          </div>
        </div>


        {/* Outcomes */}
        {Object.keys(stats.outcomes).length > 0 && (
          <div className="summary-section">
            <h3>Groan Outcomes</h3>
            <div className="outcome-bars">
              {[
                { id: 'better', label: 'Better Than Expected', icon: '🌟', color: '#22c55e' },
                { id: 'expected', label: 'As Expected', icon: '✅', color: '#6b7280' },
                { id: 'harder', label: 'Harder Than Expected', icon: '😤', color: '#ef4444' }
              ].map(outcome => {
                const count = stats.outcomes[outcome.id] || 0
                const total = Object.values(stats.outcomes).reduce((a, b) => a + b, 0)
                return (
                  <div key={outcome.id} className="outcome-bar">
                    <div className="outcome-info">
                      <span className="outcome-icon">{outcome.icon}</span>
                      <span className="outcome-label">{outcome.label}</span>
                      <span className="outcome-count">{count}</span>
                    </div>
                    <div className="bar-container">
                      <div
                        className="bar"
                        style={{
                          width: `${getPercentage(count, total)}%`,
                          backgroundColor: outcome.color
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {stats.totalCompleted === 0 && (
          <div className="empty-state">
            <p>Complete some Groan challenges to see your insights here!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroansSummary
