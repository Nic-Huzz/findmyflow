/**
 * HealingSummary - Summary page for Healing tab data and insights
 *
 * Displays:
 * - Nervous System Flow data (visibility/money limits, safety contracts, archetype)
 * - Healing Compass Flow data (safety contract being healed, past event)
 * - Recognise vs Release balance
 * - Total completions and points
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import './HealingSummary.css'

function HealingSummary({ onBack, progress }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCompleted: 0,
    byType: { Recognise: 0, Release: 0, Rewire: 0, Reconnect: 0 },
    emotions: {},
    triggerPatterns: {},
    releaseMethods: {},
    frequencies: { positive: {}, negative: {} },
    totalPoints: 0,
    daysWithCompletions: new Set()
  })

  // Flow data from NS and Healing Compass
  const [nervousSystemData, setNervousSystemData] = useState(null)
  const [healingCompassData, setHealingCompassData] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return

      try {
        // Fetch Nervous System flow data
        const { data: nsData } = await supabase
          .from('nervous_system_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (nsData && nsData.length > 0) {
          setNervousSystemData(nsData[0])
        }

        // Fetch Healing Compass flow data
        const { data: hcData } = await supabase
          .from('healing_compass_responses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)

        if (hcData && hcData.length > 0) {
          setHealingCompassData(hcData[0])
        }

        // Fetch all healing-related quest completions
        const { data: completions, error } = await supabase
          .from('quest_completions')
          .select('quest_id, quest_type, reflection_text, points_earned, created_at')
          .eq('user_id', user.id)
          .eq('quest_category', 'Healing')

        if (error) throw error

        const uniqueCompletions = completions || []

        // Process the data
        const processed = {
          totalCompleted: uniqueCompletions?.length || 0,
          byType: { Recognise: 0, Release: 0, Rewire: 0, Reconnect: 0 },
          emotions: {},
          triggerPatterns: {},
          releaseMethods: {},
          frequencies: { positive: {}, negative: {} },
          totalPoints: 0,
          daysWithCompletions: new Set()
        }

        uniqueCompletions?.forEach(completion => {
          // Count by type (quest_type is Recognise, Release, Rewire, or Reconnect)
          const questType = completion.quest_type
          if (questType === 'Recognise' || completion.quest_id?.startsWith('recognise_')) {
            processed.byType.Recognise++
          } else if (questType === 'Release' || completion.quest_id?.startsWith('release_')) {
            processed.byType.Release++
          } else if (questType === 'Rewire' || completion.quest_id?.startsWith('rewire_')) {
            processed.byType.Rewire++
          } else if (questType === 'Reconnect' || completion.quest_id?.startsWith('reconnect_')) {
            processed.byType.Reconnect++
          }

          // Add points
          processed.totalPoints += completion.points_earned || 0

          // Track days with completions
          const date = new Date(completion.created_at)
          const dayKey = date.toISOString().split('T')[0]
          processed.daysWithCompletions.add(dayKey)

          // Parse reflection text for insights
          if (completion.reflection_text) {
            try {
              const data = typeof completion.reflection_text === 'string'
                ? JSON.parse(completion.reflection_text)
                : completion.reflection_text

              // Track emotions
              if (data.emotion) {
                processed.emotions[data.emotion] = (processed.emotions[data.emotion] || 0) + 1
              }
              if (data.emotions) {
                const emotionList = Array.isArray(data.emotions) ? data.emotions : [data.emotions]
                emotionList.forEach(emotion => {
                  processed.emotions[emotion] = (processed.emotions[emotion] || 0) + 1
                })
              }

              // Track trigger patterns
              if (data.trigger_type || data.trigger) {
                const trigger = data.trigger_type || data.trigger
                processed.triggerPatterns[trigger] = (processed.triggerPatterns[trigger] || 0) + 1
              }

              // Track release methods
              if (data.release_method || data.method) {
                const method = data.release_method || data.method
                processed.releaseMethods[method] = (processed.releaseMethods[method] || 0) + 1
              }

              // Track frequencies
              if (data.frequency) {
                if (completion.quest_id === 'recognise_positive_frequency') {
                  processed.frequencies.positive[data.frequency] =
                    (processed.frequencies.positive[data.frequency] || 0) + 1
                } else if (completion.quest_id === 'recognise_negative_frequency') {
                  processed.frequencies.negative[data.frequency] =
                    (processed.frequencies.negative[data.frequency] || 0) + 1
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        })

        setStats(processed)
      } catch (error) {
        console.error('Error fetching healing stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  // Calculate percentages for all 4 types
  const totalByType = stats.byType.Recognise + stats.byType.Release + stats.byType.Rewire + stats.byType.Reconnect
  const typePercentages = {
    Recognise: totalByType > 0 ? Math.round((stats.byType.Recognise / totalByType) * 100) : 0,
    Release: totalByType > 0 ? Math.round((stats.byType.Release / totalByType) * 100) : 0,
    Rewire: totalByType > 0 ? Math.round((stats.byType.Rewire / totalByType) * 100) : 0,
    Reconnect: totalByType > 0 ? Math.round((stats.byType.Reconnect / totalByType) * 100) : 0
  }
  // Legacy aliases for insight logic
  const recognisePercentage = typePercentages.Recognise
  const releasePercentage = typePercentages.Release

  // Get top emotions
  const topEmotions = Object.entries(stats.emotions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Get top triggers
  const topTriggers = Object.entries(stats.triggerPatterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Get top release methods
  const topMethods = Object.entries(stats.releaseMethods)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Calculate streak
  const calculateStreak = () => {
    if (!stats.daysWithCompletions || stats.daysWithCompletions.size === 0) return 0
    const sortedDays = Array.from(stats.daysWithCompletions).sort().reverse()
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

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

  // Personalized insight
  const getPersonalizedInsight = () => {
    if (stats.totalCompleted === 0 && !nervousSystemData && !healingCompassData) return null

    if (currentStreak >= 5) return { emoji: '🔥', text: 'Healing Streak!', subtext: `${currentStreak} days of healing work` }
    if (nervousSystemData && healingCompassData) return { emoji: '🧭', text: 'Deep Explorer', subtext: 'Both healing maps complete' }
    if (nervousSystemData && !healingCompassData) return { emoji: '🗺️', text: 'Map Complete', subtext: 'Ready to find your wound' }
    if (releasePercentage >= 60) return { emoji: '🌊', text: 'Release Master', subtext: 'Letting go with grace' }
    if (recognisePercentage >= 60) return { emoji: '👁️', text: 'Pattern Spotter', subtext: 'Building self-awareness' }
    if (stats.byType.Release > 5) return { emoji: '🦋', text: 'Transforming', subtext: 'Processing the old, making room for new' }
    if (currentStreak >= 3) return { emoji: '💫', text: 'Building Momentum', subtext: `${currentStreak} days strong` }
    return { emoji: '🌱', text: 'Beginning to Heal', subtext: 'Every step counts' }
  }
  const insight = getPersonalizedInsight()

  if (loading) {
    return (
      <div className="healing-summary full-page">
        <div className="summary-header">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h2>Healing Summary</h2>
        </div>
        <div className="summary-loading">Loading insights...</div>
      </div>
    )
  }

  return (
    <div className="healing-summary full-page">
      <div className="summary-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Healing Summary</h2>
      </div>

      <div className="summary-content">
        {/* Personalized Insight Hero */}
        {insight && (
          <div className="insight-hero">
            <span className="insight-hero-emoji">{insight.emoji}</span>
            <h2 className="insight-hero-title">{insight.text}</h2>
            <p className="insight-hero-subtext">{insight.subtext}</p>
          </div>
        )}

        {/* Type Balance - All 4 R-Types */}
        <div className="summary-section">
          <h3>Healing Balance</h3>
          {totalByType > 0 ? (
            <div className="voice-balance">
              <div className="voice-row">
                <div className="voice-item recognise">
                  <span className="voice-icon">👁️</span>
                  <span className="voice-label">Recognise</span>
                  <span className="voice-percent">{typePercentages.Recognise}%</span>
                </div>
                <div className="voice-item release">
                  <span className="voice-icon">🌊</span>
                  <span className="voice-label">Release</span>
                  <span className="voice-percent">{typePercentages.Release}%</span>
                </div>
                <div className="voice-item rewire">
                  <span className="voice-icon">🔄</span>
                  <span className="voice-label">Rewire</span>
                  <span className="voice-percent">{typePercentages.Rewire}%</span>
                </div>
                <div className="voice-item reconnect">
                  <span className="voice-icon">🤝</span>
                  <span className="voice-label">Reconnect</span>
                  <span className="voice-percent">{typePercentages.Reconnect}%</span>
                </div>
              </div>
              <div className="voice-bar-container">
                <div className="voice-bar recognise" style={{ width: `${typePercentages.Recognise}%` }} />
                <div className="voice-bar release" style={{ width: `${typePercentages.Release}%` }} />
                <div className="voice-bar rewire" style={{ width: `${typePercentages.Rewire}%` }} />
                <div className="voice-bar reconnect" style={{ width: `${typePercentages.Reconnect}%` }} />
              </div>
            </div>
          ) : (
            <p className="empty-hint">Complete challenges to see your healing balance</p>
          )}
        </div>

        {/* Nervous System Map Results */}
        <div className="summary-section">
          <h3>Nervous System Map</h3>
          {nervousSystemData ? (
            <div className="flow-data">
              <div className="flow-data-row">
                <span className="flow-data-icon">👁️</span>
                <div className="flow-data-content">
                  <span className="flow-data-label">Visibility Limit</span>
                  <span className="flow-data-value">{nervousSystemData.nervous_system_impact_limit || 'Not set'}</span>
                </div>
              </div>
              <div className="flow-data-row">
                <span className="flow-data-icon">💰</span>
                <div className="flow-data-content">
                  <span className="flow-data-label">Earning Limit</span>
                  <span className="flow-data-value">{nervousSystemData.nervous_system_income_limit || 'Not set'}</span>
                </div>
              </div>
              {nervousSystemData.safety_contracts && nervousSystemData.safety_contracts.length > 0 && (
                <div className="flow-data-row full-width">
                  <span className="flow-data-icon">📜</span>
                  <div className="flow-data-content">
                    <span className="flow-data-label">Safety Contracts</span>
                    <div className="safety-contracts-list">
                      {nervousSystemData.safety_contracts.map((contract, idx) => (
                        <span key={idx} className="safety-contract-chip">{contract}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {nervousSystemData.archetype && (
                <div className="flow-data-row">
                  <span className="flow-data-icon">🎭</span>
                  <div className="flow-data-content">
                    <span className="flow-data-label">Archetype</span>
                    <span className="flow-data-value">{nervousSystemData.archetype}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="empty-hint">Complete the Nervous System Map to see your limits and safety contracts</p>
          )}
        </div>

        {/* Healing Compass Results */}
        <div className="summary-section">
          <h3>Healing Compass</h3>
          {healingCompassData ? (
            <div className="flow-data">
              <div className="flow-data-row full-width">
                <span className="flow-data-icon">🎯</span>
                <div className="flow-data-content">
                  <span className="flow-data-label">Safety Contract Being Healed</span>
                  <span className="flow-data-value highlight">{healingCompassData.selected_safety_contract}</span>
                </div>
              </div>
              {healingCompassData.past_event_emotions && (
                <div className="flow-data-row">
                  <span className="flow-data-icon">💔</span>
                  <div className="flow-data-content">
                    <span className="flow-data-label">Emotions From Past</span>
                    <span className="flow-data-value">{healingCompassData.past_event_emotions}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="empty-hint">Complete the Healing Compass to identify the wound you're healing</p>
          )}
        </div>

        {/* Emotions Processed */}
        <div className="summary-section">
          <h3>Emotions Processed</h3>
          {topEmotions.length > 0 ? (
            <div className="insight-list">
              {topEmotions.map(([emotion, count]) => (
                <div key={emotion} className="insight-item">
                  <span className="insight-label">{emotion}</span>
                  <span className="insight-count">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-hint">Complete Release challenges to track emotions processed</p>
          )}
        </div>

        {/* Trigger Patterns */}
        <div className="summary-section">
          <h3>Trigger Patterns</h3>
          {topTriggers.length > 0 ? (
            <div className="insight-list">
              {topTriggers.map(([trigger, count]) => (
                <div key={trigger} className="insight-item">
                  <span className="insight-label">{trigger}</span>
                  <span className="insight-count">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-hint">Complete Trigger Pattern challenges to see patterns</p>
          )}
        </div>

        {/* Release Methods */}
        <div className="summary-section">
          <h3>Release Methods Used</h3>
          {topMethods.length > 0 ? (
            <div className="insight-list">
              {topMethods.map(([method, count]) => (
                <div key={method} className="insight-item">
                  <span className="insight-label">{method}</span>
                  <span className="insight-count">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-hint">Complete Release challenges to track methods used</p>
          )}
        </div>

        {/* Overview Stats */}
        <div className="summary-section overview">
          <div className="stat-card total">
            <span className="stat-value">{stats.totalCompleted}</span>
            <span className="stat-label">Completions</span>
          </div>
          <div className="stat-card points">
            <span className="stat-value">{stats.totalPoints}</span>
            <span className="stat-label">Points Earned</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HealingSummary
