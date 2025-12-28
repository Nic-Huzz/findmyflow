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
  const essencePercentage = totalArchetype > 0 ? Math.round((stats.essenceCount / totalArchetype) * 100) : 50
  const protectivePercentage = totalArchetype > 0 ? 100 - essencePercentage : 50

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

        {/* Streak & Progress Row */}
        <div className="summary-section progress-row">
          {/* Streak */}
          <div className="streak-card">
            <div className="streak-flame">{currentStreak > 0 ? '🔥' : '💤'}</div>
            <div className="streak-info">
              <span className="streak-value">{currentStreak}</span>
              <span className="streak-label">day streak</span>
            </div>
          </div>

          {/* Days Progress */}
          <div className="days-progress compact">
            <div className="days-header">
              <span className="days-label">{daysCompleted}/{Math.min(totalDays, 7)} days</span>
              <span className="days-percentage">{daysPercentage}%</span>
            </div>
            <div className="days-bar-container">
              <div className="days-bar" style={{ width: `${daysPercentage}%` }} />
            </div>
          </div>
        </div>

        {/* Archetype Balance */}
        {totalArchetype > 0 && (
          <div className="summary-section">
            <h3>Archetype Balance</h3>
            <div className="archetype-balance">
              <div className="archetype-labels">
                <span className="essence-label">✨ Essence ({stats.essenceCount})</span>
                <span className="protective-label">🛡️ Protective ({stats.protectiveCount})</span>
              </div>
              <div className="archetype-bar-container">
                <div className="archetype-bar essence" style={{ width: `${essencePercentage}%` }} />
                <div className="archetype-bar protective" style={{ width: `${protectivePercentage}%` }} />
              </div>
              <div className="archetype-percentages">
                <span>{essencePercentage}%</span>
                <span>{protectivePercentage}%</span>
              </div>
            </div>
          </div>
        )}

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

        {/* By Type Distribution */}
        <div className="summary-section">
          <h3>By Type</h3>
          <div className="type-bars">
            <div className="type-bar">
              <div className="type-info">
                <span className="type-label">Recognise</span>
                <span className="type-count">{stats.byType.Recognise}</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar recognise"
                  style={{ width: `${getPercentage(stats.byType.Recognise, totalByType)}%` }}
                />
              </div>
            </div>
            <div className="type-bar">
              <div className="type-info">
                <span className="type-label">Rewire</span>
                <span className="type-count">{stats.byType.Rewire}</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar rewire"
                  style={{ width: `${getPercentage(stats.byType.Rewire, totalByType)}%` }}
                />
              </div>
            </div>
            <div className="type-bar">
              <div className="type-info">
                <span className="type-label">Reconnect</span>
                <span className="type-count">{stats.byType.Reconnect}</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar reconnect"
                  style={{ width: `${getPercentage(stats.byType.Reconnect, totalByType)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Protective Voices */}
        {Object.keys(stats.protectiveVoices).length > 0 && (
          <div className="summary-section">
            <h3>Most Triggered Protective Voices</h3>
            <div className="insight-list">
              {sortedEntries(stats.protectiveVoices).map(([voice, count]) => (
                <div key={voice} className="insight-item">
                  <span className="insight-icon">
                    {voice === 'People Pleaser' && '😊'}
                    {voice === 'Performer' && '🎭'}
                    {voice === 'Controller' && '🎯'}
                    {voice === 'Perfectionist' && '✨'}
                    {voice === 'Ghost' && '👻'}
                  </span>
                  <span className="insight-label">{voice}</span>
                  <span className="insight-count">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fears */}
        {Object.keys(stats.fears).length > 0 && (
          <div className="summary-section">
            <h3>Common Fears</h3>
            <div className="insight-list">
              {sortedEntries(stats.fears).map(([fear, count]) => (
                <div key={fear} className="insight-item">
                  <span className="insight-icon">
                    {fear === 'judgment' && '👁️'}
                    {fear === 'worthiness' && '🎭'}
                    {fear === 'failure' && '💥'}
                  </span>
                  <span className="insight-label">
                    {fear === 'judgment' && 'Fear of Judgment'}
                    {fear === 'worthiness' && 'Not Enough'}
                    {fear === 'failure' && 'Might Fail'}
                    {!['judgment', 'worthiness', 'failure'].includes(fear) && fear}
                  </span>
                  <span className="insight-count">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vulnerability Layers */}
        {Object.keys(stats.vulnerabilityLayers).length > 0 && (
          <div className="summary-section">
            <h3>Vulnerability Layers Explored</h3>
            <div className="layer-grid">
              {['Screen', 'Live', 'Tribe', 'Money', 'Heart'].map(layer => (
                <div
                  key={layer}
                  className={`layer-stat ${stats.vulnerabilityLayers[layer] ? 'active' : ''}`}
                >
                  <span className="layer-icon">
                    {layer === 'Screen' && '📱'}
                    {layer === 'Live' && '⚡'}
                    {layer === 'Tribe' && '👥'}
                    {layer === 'Money' && '💰'}
                    {layer === 'Heart' && '💗'}
                  </span>
                  <span className="layer-name">{layer}</span>
                  <span className="layer-count">{stats.vulnerabilityLayers[layer] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas of Life */}
        {Object.keys(stats.areasOfLife).length > 0 && (
          <div className="summary-section">
            <h3>Areas of Life</h3>
            <div className="area-grid">
              {[
                { id: 'work', label: 'Work', icon: '💼' },
                { id: 'relationship', label: 'Relationship', icon: '💕' },
                { id: 'self', label: 'Self', icon: '🪞' },
                { id: 'money', label: 'Money', icon: '💰' },
                { id: 'health', label: 'Health', icon: '🏥' },
                { id: 'family', label: 'Family', icon: '👨‍👩‍👧' }
              ].map(area => (
                <div
                  key={area.id}
                  className={`area-stat ${stats.areasOfLife[area.id] ? 'active' : ''}`}
                >
                  <span className="area-icon">{area.icon}</span>
                  <span className="area-name">{area.label}</span>
                  <span className="area-count">{stats.areasOfLife[area.id] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trigger Types */}
        {Object.keys(stats.triggerTypes).length > 0 && (
          <div className="summary-section">
            <h3>What Triggers You</h3>
            <div className="insight-list">
              {sortedEntries(stats.triggerTypes).map(([trigger, count]) => (
                <div key={trigger} className="insight-item">
                  <span className="insight-icon">
                    {trigger === 'person' && '👤'}
                    {trigger === 'situation' && '⚡'}
                    {trigger === 'thought' && '💭'}
                    {trigger === 'memory' && '📸'}
                    {trigger === 'environment' && '🏠'}
                    {trigger === 'body' && '🫀'}
                  </span>
                  <span className="insight-label" style={{ textTransform: 'capitalize' }}>{trigger}</span>
                  <span className="insight-count">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emotional Frequencies */}
        {(Object.keys(stats.positiveFrequencies).length > 0 || Object.keys(stats.negativeFrequencies).length > 0) && (
          <div className="summary-section">
            <h3>Emotional Frequencies</h3>
            <div className="frequency-comparison">
              {Object.keys(stats.positiveFrequencies).length > 0 && (
                <div className="frequency-column positive">
                  <span className="frequency-header">🌟 Positive</span>
                  {sortedEntries(stats.positiveFrequencies).map(([freq, count]) => (
                    <div key={freq} className="freq-item">
                      <span style={{ textTransform: 'capitalize' }}>{freq}</span>
                      <span className="freq-count">{count}</span>
                    </div>
                  ))}
                </div>
              )}
              {Object.keys(stats.negativeFrequencies).length > 0 && (
                <div className="frequency-column negative">
                  <span className="frequency-header">🌑 Negative</span>
                  {sortedEntries(stats.negativeFrequencies).map(([freq, count]) => (
                    <div key={freq} className="freq-item">
                      <span style={{ textTransform: 'capitalize' }}>{freq}</span>
                      <span className="freq-count">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Essence Expressions */}
        {Object.keys(stats.essenceExpressions).length > 0 && (
          <div className="summary-section">
            <h3>How Your Essence Shows Up</h3>
            <div className="insight-list">
              {sortedEntries(stats.essenceExpressions).map(([expr, count]) => (
                <div key={expr} className="insight-item">
                  <span className="insight-icon">
                    {expr === 'created' && '🎨'}
                    {expr === 'connected' && '🤝'}
                    {expr === 'led' && '🎯'}
                    {expr === 'taught' && '💡'}
                    {expr === 'inspired' && '🔥'}
                    {expr === 'grew' && '🌱'}
                  </span>
                  <span className="insight-label" style={{ textTransform: 'capitalize' }}>{expr}</span>
                  <span className="insight-count">{count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Outcomes */}
        {Object.keys(stats.outcomes).length > 0 && (
          <div className="summary-section">
            <h3>Outcome Trends</h3>
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

        {/* Average Intensity */}
        {stats.avgIntensity.count > 0 && (
          <div className="summary-section">
            <h3>Average Intensity</h3>
            <div className="intensity-display">
              <span className="intensity-value">
                {(stats.avgIntensity.total / stats.avgIntensity.count).toFixed(1)}
              </span>
              <span className="intensity-scale">/ 5</span>
              <div className="intensity-bar-visual">
                <div
                  className="intensity-fill"
                  style={{ width: `${(stats.avgIntensity.total / stats.avgIntensity.count / 5) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Next Action Suggestion */}
        {nextAction && (
          <div className="summary-section next-action-section">
            <h3>Suggested Next Step</h3>
            <div className="next-action-card" onClick={onBack}>
              <div className="next-action-icon">→</div>
              <div className="next-action-content">
                <span className="next-action-text">{nextAction.action}</span>
                <span className="next-action-reason">{nextAction.reason}</span>
              </div>
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
