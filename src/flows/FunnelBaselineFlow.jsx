/**
 * FunnelBaselineFlow.jsx - Establish Funnel Baseline (+15 pts)
 *
 * Weekly tracking flow that guides users through entering their funnel metrics.
 * Creates a baseline record for week-over-week comparison.
 *
 * Stages:
 * 1. Traffic Source - Where are your leads coming from?
 * 2. Top of Funnel - Awareness & Attraction numbers
 * 3. Middle of Funnel - Lead Magnet & Nurture numbers
 * 4. Bottom of Funnel - Core, Upsell, Downsell, Continuity
 * 5. Results - Visual funnel with conversion rates
 *
 * Integrates with:
 * - funnel_metrics table (saves data)
 * - CRM Analytics (bidirectional sync)
 * - Funnel Calculator (can view detailed breakdown)
 *
 * Created: January 2026
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { completeFlowQuest } from '../lib/questCompletion'
import { syncCRMToFunnel } from '../lib/crm'
import { ProgressDots } from '../components/MoneyModelShared'
import './FunnelBaselineFlow.css'

const STAGES = {
  LOADING: 'loading',
  WELCOME: 'welcome',
  TRAFFIC_SOURCE: 'traffic_source',
  TOP_FUNNEL: 'top_funnel',
  MIDDLE_FUNNEL: 'middle_funnel',
  BOTTOM_FUNNEL: 'bottom_funnel',
  RESULTS: 'results',
  SUCCESS: 'success'
}

const STAGE_GROUPS = [
  { id: 'welcome', label: 'Start', stages: [STAGES.LOADING, STAGES.WELCOME] },
  { id: 'traffic', label: 'Traffic', stages: [STAGES.TRAFFIC_SOURCE] },
  { id: 'top', label: 'Top', stages: [STAGES.TOP_FUNNEL] },
  { id: 'middle', label: 'Middle', stages: [STAGES.MIDDLE_FUNNEL] },
  { id: 'bottom', label: 'Bottom', stages: [STAGES.BOTTOM_FUNNEL] },
  { id: 'results', label: 'Results', stages: [STAGES.RESULTS, STAGES.SUCCESS] }
]

const TRAFFIC_SOURCES = [
  { id: 'social_organic', label: 'Social Media (Organic)', icon: '📱', description: 'Instagram, LinkedIn, TikTok, etc.', awarenessHelp: 'People who saw your posts', attractionHelp: 'Engaged with your content (likes, comments, shares)' },
  { id: 'social_paid', label: 'Paid Ads', icon: '💰', description: 'Facebook Ads, Google Ads, etc.', awarenessHelp: 'People who saw your ads', attractionHelp: 'Clicked on your ads' },
  { id: 'seo', label: 'Search (SEO)', icon: '🔍', description: 'Google, YouTube search', awarenessHelp: 'Impressions in search results', attractionHelp: 'Clicked through to your site' },
  { id: 'email', label: 'Email List', icon: '📧', description: 'Existing subscribers', awarenessHelp: 'People who received your emails', attractionHelp: 'Opened or clicked your emails' },
  { id: 'referrals', label: 'Referrals', icon: '🤝', description: 'Word of mouth, affiliates', awarenessHelp: 'People referred to you', attractionHelp: 'Showed interest (replied, visited)' },
  { id: 'other', label: 'Other', icon: '🌐', description: 'Podcasts, events, etc.', awarenessHelp: 'People you reached', attractionHelp: 'Showed interest in your offer' }
]

function FunnelBaselineFlow() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [stage, setStage] = useState(STAGES.LOADING)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Previous week's data for comparison
  const [previousData, setPreviousData] = useState(null)
  const [isFirstBaseline, setIsFirstBaseline] = useState(true)

  // User inputs
  const [trafficSource, setTrafficSource] = useState('')
  const [funnelData, setFunnelData] = useState({
    awareness: '',
    attraction: '',
    leadmagnet: '',
    nurture: '',
    core: '',
    upsell: '',
    downsell: '',
    continuity: ''
  })
  const [notes, setNotes] = useState('')
  const [focusNextWeek, setFocusNextWeek] = useState('')

  // Load existing data on mount
  useEffect(() => {
    if (user) {
      loadExistingData()
    }
  }, [user])

  // Auto-register quest on mount
  useEffect(() => {
    if (user) {
      const checkPriorCompletion = async () => {
        try {
          // Check if completed this week already
          const weekStart = getWeekStart()
          const { data: existingThisWeek } = await supabase
            .from('funnel_metrics')
            .select('id')
            .eq('user_id', user.id)
            .gte('created_at', weekStart.toISOString())
            .eq('source', 'quest')
            .limit(1)
            .maybeSingle()

          if (existingThisWeek) {
            await completeFlowQuest({
              userId: user.id,
              flowId: 'funnel_baseline',
              pointsEarned: 15
            })
          }
        } catch (err) {
          // Silent fail
        }
      }
      checkPriorCompletion()
    }
  }, [user])

  function getWeekStart() {
    const now = new Date()
    const dayOfWeek = now.getDay()
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    const monday = new Date(now.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  async function loadExistingData() {
    try {
      // Get most recent funnel metrics for comparison
      const { data: previousMetrics } = await supabase
        .from('funnel_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('mode', 'actual')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (previousMetrics) {
        setPreviousData(previousMetrics)
        setIsFirstBaseline(false)

        // Pre-fill with previous data
        setFunnelData({
          awareness: previousMetrics.awareness?.toString() || '',
          attraction: previousMetrics.attraction?.toString() || '',
          leadmagnet: previousMetrics.leadmagnet?.toString() || '',
          nurture: previousMetrics.nurture?.toString() || '',
          core: previousMetrics.core?.toString() || '',
          upsell: previousMetrics.upsell?.toString() || '',
          downsell: previousMetrics.downsell?.toString() || '',
          continuity: previousMetrics.continuity?.toString() || ''
        })
      }

      setStage(STAGES.WELCOME)
    } catch (err) {
      console.error('Error loading existing data:', err)
      setStage(STAGES.WELCOME)
    }
  }

  function handleInputChange(field, value) {
    // Only allow numbers
    const numValue = value.replace(/[^0-9]/g, '')
    setFunnelData(prev => ({ ...prev, [field]: numValue }))
  }

  function calculateConversionRate(from, to) {
    const fromNum = parseInt(from) || 0
    const toNum = parseInt(to) || 0
    if (fromNum === 0) return 0
    return ((toNum / fromNum) * 100).toFixed(1)
  }

  function getChangeFromPrevious(field) {
    if (!previousData) return null
    const current = parseInt(funnelData[field]) || 0
    const previous = previousData[field] || 0
    if (previous === 0) return null
    return ((current - previous) / previous * 100).toFixed(0)
  }

  async function handleSave() {
    if (!user) return

    setSaving(true)
    setError(null)

    try {
      const weekStart = getWeekStart()

      // Save to funnel_metrics
      const { error: saveError } = await supabase
        .from('funnel_metrics')
        .insert({
          user_id: user.id,
          mode: 'actual',
          source: 'quest',
          week_start: weekStart.toISOString().split('T')[0],
          is_baseline: isFirstBaseline,
          awareness: parseInt(funnelData.awareness) || 0,
          attraction: parseInt(funnelData.attraction) || 0,
          leadmagnet: parseInt(funnelData.leadmagnet) || 0,
          nurture: parseInt(funnelData.nurture) || 0,
          core: parseInt(funnelData.core) || 0,
          upsell: parseInt(funnelData.upsell) || 0,
          downsell: parseInt(funnelData.downsell) || 0,
          continuity: parseInt(funnelData.continuity) || 0,
          notes: `Traffic: ${trafficSource}\nFocus: ${focusNextWeek}\n${notes}`,
          custom_rates: {
            traffic_source: trafficSource,
            focus_next_week: focusNextWeek
          }
        })

      if (saveError) throw saveError

      // Complete the quest
      await completeFlowQuest({
        userId: user.id,
        flowId: 'funnel_baseline',
        pointsEarned: 15
      })

      // Sync CRM data to keep everything in sync
      syncCRMToFunnel(user.id).catch(err => {
        console.error('Error syncing CRM to funnel:', err)
      })

      setStage(STAGES.SUCCESS)
    } catch (err) {
      console.error('Error saving funnel baseline:', err)
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Calculate totals for results
  const totals = {
    awareness: parseInt(funnelData.awareness) || 0,
    attraction: parseInt(funnelData.attraction) || 0,
    leadmagnet: parseInt(funnelData.leadmagnet) || 0,
    nurture: parseInt(funnelData.nurture) || 0,
    core: parseInt(funnelData.core) || 0,
    upsell: parseInt(funnelData.upsell) || 0,
    downsell: parseInt(funnelData.downsell) || 0,
    continuity: parseInt(funnelData.continuity) || 0
  }

  // Loading state
  if (stage === STAGES.LOADING) {
    return (
      <div className="funnel-baseline-flow">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your funnel data...</p>
        </div>
      </div>
    )
  }

  // Welcome
  if (stage === STAGES.WELCOME) {
    return (
      <div className="funnel-baseline-flow">
        <div className="welcome-container">
          <h1>{isFirstBaseline ? 'Establish Your Baseline' : 'Weekly Funnel Update'}</h1>
          <p className="welcome-subtitle">
            {isFirstBaseline
              ? "Let's capture where you're starting from"
              : "Track your progress from last week"
            }
          </p>

          {previousData && (
            <div className="fb-previous-summary">
              <span className="fb-sync-badge">Last updated: {new Date(previousData.created_at).toLocaleDateString()}</span>
              <div className="fb-previous-stats">
                <span>{previousData.awareness || 0} reached</span>
                <span>{previousData.core || 0} sales</span>
              </div>
            </div>
          )}

          <div className="fb-checklist-preview">
            <div className="fb-check-item">
              <span className="fb-check-icon">📊</span>
              <span>Traffic source</span>
            </div>
            <div className="fb-check-item">
              <span className="fb-check-icon">👀</span>
              <span>Top of funnel (awareness, attraction)</span>
            </div>
            <div className="fb-check-item">
              <span className="fb-check-icon">🎯</span>
              <span>Middle of funnel (leads, nurture)</span>
            </div>
            <div className="fb-check-item">
              <span className="fb-check-icon">💰</span>
              <span>Bottom of funnel (sales, upsells)</span>
            </div>
          </div>

          <p className="fb-time-estimate">Takes about 2 minutes</p>

          <div className="nav-buttons">
            <button className="primary-button glow-button" onClick={() => setStage(STAGES.TRAFFIC_SOURCE)}>
              {isFirstBaseline ? 'Set My Baseline' : 'Update My Numbers'}
            </button>
            <button className="secondary-button" onClick={() => navigate('/7-day-challenge')}>
              Back to Challenge
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Traffic Source
  if (stage === STAGES.TRAFFIC_SOURCE) {
    return (
      <div className="funnel-baseline-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Where's your traffic coming from?</h2>
          <p className="fb-subtitle">Select your primary traffic source this week</p>

          <div className="fb-traffic-options">
            {TRAFFIC_SOURCES.map(source => (
              <button
                key={source.id}
                className={`fb-traffic-option ${trafficSource === source.id ? 'selected' : ''}`}
                onClick={() => setTrafficSource(source.id)}
              >
                <span className="fb-traffic-icon">{source.icon}</span>
                <div className="fb-traffic-content">
                  <span className="fb-traffic-label">{source.label}</span>
                  <span className="fb-traffic-desc">{source.description}</span>
                </div>
                {trafficSource === source.id && <span className="fb-check">✓</span>}
              </button>
            ))}
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.WELCOME)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.TOP_FUNNEL)}
              disabled={!trafficSource}
            >
              Next: Top of Funnel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Top of Funnel
  if (stage === STAGES.TOP_FUNNEL) {
    // Get dynamic help text based on selected traffic source
    const selectedSource = TRAFFIC_SOURCES.find(s => s.id === trafficSource)
    const awarenessHelp = selectedSource?.awarenessHelp || 'People you reached'
    const attractionHelp = selectedSource?.attractionHelp || 'Showed interest in your offer'

    return (
      <div className="funnel-baseline-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Top of Funnel</h2>
          <p className="fb-subtitle">How many people did you reach this week?</p>

          <div className="fb-input-stack">
            <div className="fb-input-card">
              <div className="fb-input-header">
                <span className="fb-input-icon">👀</span>
                <div>
                  <label>Awareness</label>
                  <span className="fb-input-help">{awarenessHelp}</span>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.awareness}
                onChange={(e) => handleInputChange('awareness', e.target.value)}
                placeholder="e.g., 1000"
                className="fb-number-input"
              />
              {previousData && (
                <div className="fb-previous-value">
                  Last week: {previousData.awareness || 0}
                  {getChangeFromPrevious('awareness') && (
                    <span className={`fb-change ${parseInt(getChangeFromPrevious('awareness')) >= 0 ? 'positive' : 'negative'}`}>
                      {parseInt(getChangeFromPrevious('awareness')) >= 0 ? '+' : ''}{getChangeFromPrevious('awareness')}%
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="fb-conversion-arrow">
              <span className="fb-arrow">↓</span>
              {funnelData.awareness && funnelData.attraction && (
                <span className="fb-rate">{calculateConversionRate(funnelData.awareness, funnelData.attraction)}%</span>
              )}
            </div>

            <div className="fb-input-card">
              <div className="fb-input-header">
                <span className="fb-input-icon">🎣</span>
                <div>
                  <label>Attraction</label>
                  <span className="fb-input-help">{attractionHelp}</span>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.attraction}
                onChange={(e) => handleInputChange('attraction', e.target.value)}
                placeholder="e.g., 50"
                className="fb-number-input"
              />
              {previousData && (
                <div className="fb-previous-value">
                  Last week: {previousData.attraction || 0}
                </div>
              )}
            </div>
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.TRAFFIC_SOURCE)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.MIDDLE_FUNNEL)}
            >
              Next: Middle of Funnel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Middle of Funnel
  if (stage === STAGES.MIDDLE_FUNNEL) {
    return (
      <div className="funnel-baseline-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Middle of Funnel</h2>
          <p className="fb-subtitle">How many leads did you capture?</p>

          <div className="fb-input-stack">
            <div className="fb-input-card">
              <div className="fb-input-header">
                <span className="fb-input-icon">🎁</span>
                <div>
                  <label>Lead Magnet</label>
                  <span className="fb-input-help">Opted in for your free offer</span>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.leadmagnet}
                onChange={(e) => handleInputChange('leadmagnet', e.target.value)}
                placeholder="e.g., 25"
                className="fb-number-input"
              />
              {previousData && (
                <div className="fb-previous-value">
                  Last week: {previousData.leadmagnet || 0}
                </div>
              )}
            </div>

            <div className="fb-conversion-arrow">
              <span className="fb-arrow">↓</span>
              {funnelData.leadmagnet && funnelData.nurture && (
                <span className="fb-rate">{calculateConversionRate(funnelData.leadmagnet, funnelData.nurture)}%</span>
              )}
            </div>

            <div className="fb-input-card">
              <div className="fb-input-header">
                <span className="fb-input-icon">💌</span>
                <div>
                  <label>Nurture</label>
                  <span className="fb-input-help">Engaged with your nurture sequence</span>
                </div>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.nurture}
                onChange={(e) => handleInputChange('nurture', e.target.value)}
                placeholder="e.g., 15"
                className="fb-number-input"
              />
              {previousData && (
                <div className="fb-previous-value">
                  Last week: {previousData.nurture || 0}
                </div>
              )}
            </div>
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.TOP_FUNNEL)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.BOTTOM_FUNNEL)}
            >
              Next: Bottom of Funnel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Bottom of Funnel
  if (stage === STAGES.BOTTOM_FUNNEL) {
    return (
      <div className="funnel-baseline-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Bottom of Funnel</h2>
          <p className="fb-subtitle">How many sales did you make?</p>

          <div className="fb-input-grid">
            <div className="fb-input-card compact">
              <div className="fb-input-header">
                <span className="fb-input-icon">💎</span>
                <label>Core Offer</label>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.core}
                onChange={(e) => handleInputChange('core', e.target.value)}
                placeholder="0"
                className="fb-number-input"
              />
            </div>

            <div className="fb-input-card compact">
              <div className="fb-input-header">
                <span className="fb-input-icon">📈</span>
                <label>Upsell</label>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.upsell}
                onChange={(e) => handleInputChange('upsell', e.target.value)}
                placeholder="0"
                className="fb-number-input"
              />
            </div>

            <div className="fb-input-card compact">
              <div className="fb-input-header">
                <span className="fb-input-icon">🎯</span>
                <label>Downsell</label>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.downsell}
                onChange={(e) => handleInputChange('downsell', e.target.value)}
                placeholder="0"
                className="fb-number-input"
              />
            </div>

            <div className="fb-input-card compact">
              <div className="fb-input-header">
                <span className="fb-input-icon">🔄</span>
                <label>Continuity</label>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={funnelData.continuity}
                onChange={(e) => handleInputChange('continuity', e.target.value)}
                placeholder="0"
                className="fb-number-input"
              />
            </div>
          </div>

          <div className="fb-notes-section">
            <label>What's your focus for next week?</label>
            <input
              type="text"
              value={focusNextWeek}
              onChange={(e) => setFocusNextWeek(e.target.value)}
              placeholder="e.g., Increase lead magnet conversions"
              className="fb-text-input"
            />
          </div>

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.MIDDLE_FUNNEL)}>Back</button>
            <button
              className="primary-button"
              onClick={() => setStage(STAGES.RESULTS)}
            >
              See My Funnel
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Results
  if (stage === STAGES.RESULTS) {
    const funnelStages = [
      { key: 'awareness', label: 'Awareness', icon: '👀', value: totals.awareness },
      { key: 'attraction', label: 'Attraction', icon: '🎣', value: totals.attraction },
      { key: 'leadmagnet', label: 'Lead Magnet', icon: '🎁', value: totals.leadmagnet },
      { key: 'nurture', label: 'Nurture', icon: '💌', value: totals.nurture },
      { key: 'core', label: 'Core Sales', icon: '💎', value: totals.core },
    ]

    // Calculate overall conversion rate
    const overallConversion = totals.awareness > 0
      ? ((totals.core / totals.awareness) * 100).toFixed(2)
      : 0

    return (
      <div className="funnel-baseline-flow">
        <ProgressDots stageGroups={STAGE_GROUPS} currentStage={stage} />

        <div className="fb-section">
          <h2>Your Funnel This Week</h2>

          <div className="fb-funnel-visual">
            {funnelStages.map((funnelStage, index) => {
              const widthPercent = totals.awareness > 0
                ? Math.max(20, (funnelStage.value / totals.awareness) * 100)
                : 100 - (index * 15)

              const nextStage = funnelStages[index + 1]
              const conversionRate = nextStage && funnelStage.value > 0
                ? ((nextStage.value / funnelStage.value) * 100).toFixed(1)
                : null

              return (
                <div key={funnelStage.key} className="fb-funnel-stage">
                  <div
                    className="fb-funnel-bar"
                    style={{ width: `${widthPercent}%` }}
                  >
                    <span className="fb-funnel-icon">{funnelStage.icon}</span>
                    <span className="fb-funnel-label">{funnelStage.label}</span>
                    <span className="fb-funnel-value">{funnelStage.value.toLocaleString()}</span>
                  </div>
                  {conversionRate && (
                    <div className="fb-funnel-conversion">
                      <span className="fb-conversion-line"></span>
                      <span className="fb-conversion-rate">{conversionRate}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="fb-summary-stats">
            <div className="fb-stat">
              <span className="fb-stat-value">{overallConversion}%</span>
              <span className="fb-stat-label">Overall Conversion</span>
            </div>
            <div className="fb-stat">
              <span className="fb-stat-value">{totals.core + totals.upsell + totals.downsell}</span>
              <span className="fb-stat-label">Total Sales</span>
            </div>
            <div className="fb-stat">
              <span className="fb-stat-value">{totals.continuity}</span>
              <span className="fb-stat-label">On Continuity</span>
            </div>
          </div>

          {previousData && (
            <div className="fb-comparison-note">
              <span className="fb-comparison-icon">📊</span>
              <span>Compared to last week's {previousData.core || 0} sales</span>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="nav-buttons">
            <button className="secondary-button" onClick={() => setStage(STAGES.BOTTOM_FUNNEL)}>Back</button>
            <button
              className="primary-button"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Baseline'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Success
  if (stage === STAGES.SUCCESS) {
    return (
      <div className="funnel-baseline-flow">
        <div className="fb-success">
          <div className="fb-success-icon">📊</div>
          <h1>{isFirstBaseline ? 'Baseline Established!' : 'Funnel Updated!'}</h1>
          <p className="fb-success-points">+15 points earned</p>

          <div className="fb-success-summary">
            <p>
              {isFirstBaseline
                ? "You now have a baseline to track your progress against."
                : "Your funnel metrics have been updated for this week."
              }
            </p>
          </div>

          <div className="fb-success-next">
            <h3>What's Next?</h3>
            <ul>
              <li>View detailed breakdown in Funnel Calculator</li>
              <li>Update again next week to track progress</li>
              <li>Focus on improving your weakest conversion rate</li>
            </ul>
          </div>

          <button className="primary-button" onClick={() => navigate('/7-day-challenge')}>
            Back to Challenge
          </button>
          <button className="secondary-button" onClick={() => navigate('/funnel-calculator')}>
            View Funnel Calculator
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default FunnelBaselineFlow
