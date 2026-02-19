import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import './AdvancedAnalytics.css'

/**
 * ResponseTimeline - Interactive chart showing responses over time
 */
export const ResponseTimeline = ({ data, period = '30days' }) => {
  const [hoveredBar, setHoveredBar] = useState(null)
  const [viewMode, setViewMode] = useState('daily') // daily | weekly

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // Group by date
    const grouped = {}
    data.forEach(session => {
      const date = session.completed_at || session.started_at
      if (!date) return
      const key = viewMode === 'weekly'
        ? getWeekKey(new Date(date))
        : new Date(date).toISOString().split('T')[0]

      if (!grouped[key]) {
        grouped[key] = { started: 0, completed: 0 }
      }
      grouped[key].started++
      if (session.is_completed) {
        grouped[key].completed++
      }
    })

    // Fill in missing dates
    const sortedKeys = Object.keys(grouped).sort()
    if (sortedKeys.length === 0) return []

    const result = []
    const endDate = new Date()
    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - (period === '7days' ? 7 : 30))

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0]
      result.push({
        date: key,
        label: formatDateLabel(d, viewMode),
        started: grouped[key]?.started || 0,
        completed: grouped[key]?.completed || 0
      })
    }

    return viewMode === 'weekly' ? aggregateToWeekly(result) : result
  }, [data, period, viewMode])

  const maxValue = Math.max(...chartData.map(d => d.started), 1)
  const barWidth = Math.max(8, Math.min(24, 600 / chartData.length - 4))

  if (chartData.length === 0) {
    return (
      <div className="timeline-chart empty">
        <p>No data available for this period</p>
      </div>
    )
  }

  return (
    <div className="timeline-chart">
      <div className="chart-header">
        <h4>Response Timeline</h4>
        <div className="view-toggle">
          <button
            className={viewMode === 'daily' ? 'active' : ''}
            onClick={() => setViewMode('daily')}
          >
            Daily
          </button>
          <button
            className={viewMode === 'weekly' ? 'active' : ''}
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="chart-container">
        <svg
          viewBox={`0 0 ${Math.max(chartData.length * (barWidth + 4), 300)} 160`}
          preserveAspectRatio="xMidYMid meet"
          className="bar-chart"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1="0"
              y1={120 - ratio * 100}
              x2={chartData.length * (barWidth + 4)}
              y2={120 - ratio * 100}
              className="grid-line"
            />
          ))}

          {/* Bars */}
          {chartData.map((d, i) => {
            const x = i * (barWidth + 4) + 2
            const startedHeight = (d.started / maxValue) * 100
            const completedHeight = (d.completed / maxValue) * 100

            return (
              <g
                key={d.date}
                className={`bar-group ${hoveredBar === i ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Started bar (background) */}
                <rect
                  x={x}
                  y={120 - startedHeight}
                  width={barWidth}
                  height={startedHeight}
                  className="bar-started"
                  rx="2"
                />
                {/* Completed bar (foreground) */}
                <rect
                  x={x}
                  y={120 - completedHeight}
                  width={barWidth}
                  height={completedHeight}
                  className="bar-completed"
                  rx="2"
                />
                {/* Date label */}
                {(chartData.length <= 14 || i % Math.ceil(chartData.length / 7) === 0) && (
                  <text
                    x={x + barWidth / 2}
                    y="140"
                    className="date-label"
                    textAnchor="middle"
                  >
                    {d.label}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {hoveredBar !== null && chartData[hoveredBar] && (
          <div
            className="chart-tooltip"
            style={{
              left: `${(hoveredBar / chartData.length) * 100}%`
            }}
          >
            <div className="tooltip-date">{chartData[hoveredBar].date}</div>
            <div className="tooltip-row">
              <span className="dot started"></span>
              Started: {chartData[hoveredBar].started}
            </div>
            <div className="tooltip-row">
              <span className="dot completed"></span>
              Completed: {chartData[hoveredBar].completed}
            </div>
          </div>
        )}
      </div>

      <div className="chart-legend">
        <span className="legend-item">
          <span className="dot started"></span> Started
        </span>
        <span className="legend-item">
          <span className="dot completed"></span> Completed
        </span>
      </div>
    </div>
  )
}

/**
 * FunnelVisualization - Visual funnel showing drop-off at each step
 */
export const FunnelVisualization = ({ analytics, questions = [] }) => {
  const [hoveredStep, setHoveredStep] = useState(null)

  const funnelData = useMemo(() => {
    if (!analytics) return []

    const totalStarted = analytics.totalStarted || 0
    const totalCompleted = analytics.totalCompleted || 0
    const dropOff = analytics.dropOffFunnel || {}

    // Calculate people at each step
    const steps = []
    let remaining = totalStarted

    // Get max question index from dropoff data
    const maxStep = Math.max(
      ...Object.keys(dropOff).map(k => parseInt(k)),
      questions.length - 1,
      0
    )

    for (let i = 0; i <= maxStep + 1; i++) {
      const droppedHere = dropOff[i] || 0
      const label = i === maxStep + 1
        ? 'Completed'
        : questions[i]?.substring(0, 40) || `Question ${i + 1}`

      steps.push({
        index: i,
        label,
        count: remaining,
        dropped: droppedHere,
        percentage: totalStarted > 0 ? Math.round((remaining / totalStarted) * 100) : 0
      })

      remaining -= droppedHere
    }

    // Add completed as final step if not already
    if (steps.length > 0 && steps[steps.length - 1].label !== 'Completed') {
      steps.push({
        index: steps.length,
        label: 'Completed',
        count: totalCompleted,
        dropped: 0,
        percentage: totalStarted > 0 ? Math.round((totalCompleted / totalStarted) * 100) : 0
      })
    }

    return steps
  }, [analytics, questions])

  if (funnelData.length === 0) {
    return <div className="funnel-viz empty">No funnel data available</div>
  }

  const maxCount = funnelData[0]?.count || 1

  return (
    <div className="funnel-viz">
      <h4>Conversion Funnel</h4>

      <div className="funnel-container">
        {funnelData.map((step, i) => {
          const widthPercent = (step.count / maxCount) * 100
          const isLast = i === funnelData.length - 1

          return (
            <div
              key={i}
              className={`funnel-step ${hoveredStep === i ? 'hovered' : ''} ${isLast ? 'completed' : ''}`}
              onMouseEnter={() => setHoveredStep(i)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              <div className="step-label">
                <span className="step-number">{isLast ? '✓' : i + 1}</span>
                <span className="step-text">{step.label}</span>
              </div>

              <div className="step-bar-container">
                <div
                  className="step-bar"
                  style={{ width: `${Math.max(widthPercent, 5)}%` }}
                />
                <span className="step-percentage">{step.percentage}%</span>
              </div>

              <div className="step-meta-row">
                <span className="step-count">{step.count} responses</span>
                {step.dropped > 0 && (
                  <span className="drop-indicator">
                    <span className="drop-arrow">↓</span>
                    <span className="drop-count">-{step.dropped} dropped</span>
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * GeographicBreakdown - Map showing responses by timezone/region
 */
export const GeographicBreakdown = ({ sessions }) => {
  const regionData = useMemo(() => {
    if (!sessions || sessions.length === 0) return []

    const regions = {}
    sessions.forEach(session => {
      const tz = session.metadata?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      const region = getRegionFromTimezone(tz)

      if (!regions[region]) {
        regions[region] = { name: region, count: 0, timezones: new Set() }
      }
      regions[region].count++
      regions[region].timezones.add(tz)
    })

    return Object.values(regions)
      .map(r => ({ ...r, timezones: Array.from(r.timezones) }))
      .sort((a, b) => b.count - a.count)
  }, [sessions])

  const totalResponses = regionData.reduce((sum, r) => sum + r.count, 0)

  if (regionData.length === 0) {
    return <div className="geo-breakdown empty">No geographic data available</div>
  }

  return (
    <div className="geo-breakdown">
      <h4>Response Locations</h4>

      <div className="region-list">
        {regionData.map((region, i) => (
          <div key={region.name} className="region-item">
            <div className="region-info">
              <span className="region-icon">{getRegionEmoji(region.name)}</span>
              <span className="region-name">{region.name}</span>
            </div>
            <div className="region-bar-container">
              <div
                className="region-bar"
                style={{ width: `${(region.count / totalResponses) * 100}%` }}
              />
            </div>
            <div className="region-stats">
              <span className="region-count">{region.count}</span>
              <span className="region-percent">
                {Math.round((region.count / totalResponses) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * QuestionBreakdown - Modal showing all answers for a specific question
 */
export const QuestionBreakdown = ({ responses, onClose }) => {
  const [selectedQuestion, setSelectedQuestion] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')

  const questions = useMemo(() => {
    if (!responses || responses.length === 0) return []

    const questionMap = {}
    responses.forEach(session => {
      session.responses?.forEach((r, idx) => {
        if (!questionMap[idx]) {
          questionMap[idx] = {
            index: idx,
            text: r.question_text,
            type: r.answer_type,
            answers: []
          }
        }
        questionMap[idx].answers.push({
          value: r.answer_value,
          email: session.respondent_email,
          date: session.completed_at
        })
      })
    })

    return Object.values(questionMap).sort((a, b) => a.index - b.index)
  }, [responses])

  const currentQuestion = questions[selectedQuestion]
  const filteredAnswers = currentQuestion?.answers.filter(a => {
    if (!searchTerm) return true
    const answerStr = Array.isArray(a.value) ? a.value.join(' ') : String(a.value)
    return answerStr.toLowerCase().includes(searchTerm.toLowerCase())
  }) || []

  if (questions.length === 0) {
    return (
      <div className="question-breakdown-modal">
        <div className="modal-header">
          <h3>Question Breakdown</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="empty-state">No question data available</div>
      </div>
    )
  }

  return (
    <div className="question-breakdown-modal">
      <div className="modal-header">
        <h3>Question Breakdown</h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="question-tabs">
        {questions.map((q, i) => (
          <button
            key={i}
            className={`question-tab ${selectedQuestion === i ? 'active' : ''}`}
            onClick={() => setSelectedQuestion(i)}
          >
            Q{i + 1}
          </button>
        ))}
      </div>

      <div className="question-content">
        <div className="question-header">
          <h4>Q{selectedQuestion + 1}: {currentQuestion?.text}</h4>
          <span className="answer-count">{currentQuestion?.answers.length} responses</span>
        </div>

        <div className="search-bar">
          <input
            type="text"
            placeholder="Search answers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="answers-list">
          {filteredAnswers.map((answer, i) => (
            <div key={i} className="answer-item">
              <div className="answer-value">
                {Array.isArray(answer.value)
                  ? answer.value.join(', ')
                  : String(answer.value)}
              </div>
              <div className="answer-meta">
                <span className="answer-email">{answer.email || 'Anonymous'}</span>
                <span className="answer-date">
                  {new Date(answer.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * AnswerClustering - AI-powered grouping of similar answers
 */
export const AnswerClustering = ({ responses, flowId }) => {
  const [clusters, setClusters] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedCluster, setSelectedCluster] = useState(null)

  const generateClusters = async () => {
    if (!responses || responses.length === 0) return

    setLoading(true)
    try {
      // Prepare answer data
      const answerData = []
      responses.forEach(session => {
        session.responses?.forEach(r => {
          if (r.answer_type === 'text' || r.answer_type === 'textarea') {
            const value = Array.isArray(r.answer_value)
              ? r.answer_value.join(' ')
              : String(r.answer_value || '')
            if (value.length > 10) {
              answerData.push({
                question: r.question_text,
                answer: value,
                email: session.respondent_email
              })
            }
          }
        })
      })

      if (answerData.length === 0) {
        setClusters({ error: 'No text responses to cluster' })
        return
      }

      // Call edge function for AI clustering
      const { data, error } = await supabase.functions.invoke('cluster-responses', {
        body: { answers: answerData, flowId }
      })

      if (error) throw error
      setClusters(data.clusters)
    } catch (err) {
      console.error('Error clustering:', err)
      // Fallback to simple keyword clustering
      setClusters(generateSimpleClusters(responses))
    } finally {
      setLoading(false)
    }
  }

  // Simple fallback clustering by keywords
  const generateSimpleClusters = (responses) => {
    const keywords = {}

    responses.forEach(session => {
      session.responses?.forEach(r => {
        const value = Array.isArray(r.answer_value)
          ? r.answer_value.join(' ')
          : String(r.answer_value || '')

        // Extract keywords (simple word extraction)
        const words = value.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(w => w.length > 4)

        words.forEach(word => {
          if (!keywords[word]) {
            keywords[word] = { keyword: word, count: 0, samples: [] }
          }
          keywords[word].count++
          if (keywords[word].samples.length < 3) {
            keywords[word].samples.push(value.substring(0, 100))
          }
        })
      })
    })

    return Object.values(keywords)
      .filter(k => k.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(k => ({
        theme: k.keyword.charAt(0).toUpperCase() + k.keyword.slice(1),
        count: k.count,
        samples: k.samples
      }))
  }

  return (
    <div className="answer-clustering">
      <div className="clustering-header">
        <h4>Answer Themes</h4>
        <button
          className="cluster-btn"
          onClick={generateClusters}
          disabled={loading}
        >
          {loading ? 'Analyzing...' : clusters ? 'Refresh' : 'Find Themes'}
        </button>
      </div>

      {loading && (
        <div className="clustering-loading">
          <div className="spinner"></div>
          <p>AI is analyzing response patterns...</p>
        </div>
      )}

      {clusters && !loading && (
        <div className="clusters-grid">
          {Array.isArray(clusters) ? (
            clusters.map((cluster, i) => (
              <div
                key={i}
                className={`cluster-card ${selectedCluster === i ? 'expanded' : ''}`}
                onClick={() => setSelectedCluster(selectedCluster === i ? null : i)}
              >
                <div className="cluster-header">
                  <span className="cluster-theme">{cluster.theme}</span>
                  <span className="cluster-count">{cluster.count} responses</span>
                </div>
                {selectedCluster === i && cluster.samples && (
                  <div className="cluster-samples">
                    {cluster.samples.map((sample, j) => (
                      <p key={j} className="sample-text">"{sample}"</p>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="cluster-error">{clusters.error || 'Unable to generate clusters'}</p>
          )}
        </div>
      )}

      {!clusters && !loading && (
        <p className="clustering-hint">
          Click "Find Themes" to discover common patterns in text responses.
        </p>
      )}
    </div>
  )
}

/**
 * SentimentIndicators - Show sentiment for each response
 */
export const SentimentIndicators = ({ responses }) => {
  const sentimentData = useMemo(() => {
    if (!responses || responses.length === 0) return null

    let positive = 0, negative = 0, neutral = 0
    const analyzed = []

    responses.forEach(session => {
      session.responses?.forEach(r => {
        const value = Array.isArray(r.answer_value)
          ? r.answer_value.join(' ')
          : String(r.answer_value || '')

        if (value.length < 5) return

        const sentiment = analyzeSentiment(value)
        if (sentiment === 'positive') positive++
        else if (sentiment === 'negative') negative++
        else neutral++

        analyzed.push({
          text: value.substring(0, 100),
          sentiment,
          question: r.question_text
        })
      })
    })

    const total = positive + negative + neutral
    return {
      positive,
      negative,
      neutral,
      total,
      positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
      negativePercent: total > 0 ? Math.round((negative / total) * 100) : 0,
      neutralPercent: total > 0 ? Math.round((neutral / total) * 100) : 0,
      samples: analyzed.slice(0, 6)
    }
  }, [responses])

  if (!sentimentData || sentimentData.total === 0) {
    return <div className="sentiment-indicators empty">No sentiment data available</div>
  }

  return (
    <div className="sentiment-indicators">
      <h4>Response Sentiment</h4>

      <div className="sentiment-summary">
        <div className="sentiment-bar">
          <div
            className="sentiment-segment positive"
            style={{ width: `${sentimentData.positivePercent}%` }}
          />
          <div
            className="sentiment-segment neutral"
            style={{ width: `${sentimentData.neutralPercent}%` }}
          />
          <div
            className="sentiment-segment negative"
            style={{ width: `${sentimentData.negativePercent}%` }}
          />
        </div>

        <div className="sentiment-legend">
          <span className="legend-item positive">
            <span className="emoji">😊</span>
            Positive {sentimentData.positivePercent}%
          </span>
          <span className="legend-item neutral">
            <span className="emoji">😐</span>
            Neutral {sentimentData.neutralPercent}%
          </span>
          <span className="legend-item negative">
            <span className="emoji">😟</span>
            Negative {sentimentData.negativePercent}%
          </span>
        </div>
      </div>

      <div className="sentiment-samples">
        {sentimentData.samples.map((s, i) => (
          <div key={i} className={`sentiment-sample ${s.sentiment}`}>
            <span className="sample-indicator">
              {s.sentiment === 'positive' ? '😊' : s.sentiment === 'negative' ? '😟' : '😐'}
            </span>
            <span className="sample-text">"{s.text}"</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * PDFReportGenerator - Generate downloadable PDF report
 */
export const PDFReportGenerator = ({ flow, analytics, responses }) => {
  const [generating, setGenerating] = useState(false)

  const generatePDF = async () => {
    setGenerating(true)

    try {
      // Create report HTML
      const reportHTML = generateReportHTML(flow, analytics, responses)

      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      printWindow.document.write(reportHTML)
      printWindow.document.close()

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
          setGenerating(false)
        }, 500)
      }
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to generate PDF. Please try again.')
      setGenerating(false)
    }
  }

  return (
    <button
      className="pdf-report-btn"
      onClick={generatePDF}
      disabled={generating}
    >
      {generating ? (
        <>
          <span className="spinner-small"></span>
          Generating...
        </>
      ) : (
        <>
          📄 Download Report
        </>
      )}
    </button>
  )
}

// Helper functions
function getWeekKey(date) {
  const startOfWeek = new Date(date)
  startOfWeek.setDate(date.getDate() - date.getDay())
  return startOfWeek.toISOString().split('T')[0]
}

function formatDateLabel(date, mode) {
  if (mode === 'weekly') {
    return `W${getWeekNumber(date)}`
  }
  return `${date.getMonth() + 1}/${date.getDate()}`
}

function getWeekNumber(date) {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date - firstDayOfYear) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

function aggregateToWeekly(dailyData) {
  const weeks = {}
  dailyData.forEach(d => {
    const weekKey = getWeekKey(new Date(d.date))
    if (!weeks[weekKey]) {
      weeks[weekKey] = { date: weekKey, label: '', started: 0, completed: 0 }
    }
    weeks[weekKey].started += d.started
    weeks[weekKey].completed += d.completed
  })

  return Object.values(weeks).map((w, i) => ({
    ...w,
    label: `W${i + 1}`
  }))
}

function getRegionFromTimezone(tz) {
  if (!tz) return 'Unknown'

  const regionMap = {
    'America': 'Americas',
    'US': 'Americas',
    'Canada': 'Americas',
    'Europe': 'Europe',
    'Africa': 'Africa',
    'Asia': 'Asia Pacific',
    'Australia': 'Asia Pacific',
    'Pacific': 'Asia Pacific',
    'Atlantic': 'Europe',
    'Indian': 'Asia Pacific'
  }

  for (const [key, region] of Object.entries(regionMap)) {
    if (tz.includes(key)) return region
  }
  return 'Other'
}

function getRegionEmoji(region) {
  const emojis = {
    'Americas': '🌎',
    'Europe': '🌍',
    'Africa': '🌍',
    'Asia Pacific': '🌏',
    'Other': '🌐',
    'Unknown': '❓'
  }
  return emojis[region] || '🌐'
}

function analyzeSentiment(text) {
  const positiveWords = ['great', 'love', 'amazing', 'excellent', 'awesome', 'fantastic', 'wonderful', 'helpful', 'easy', 'perfect', 'best', 'excited', 'happy', 'good', 'nice', 'thanks', 'thank', 'appreciate']
  const negativeWords = ['bad', 'hate', 'terrible', 'awful', 'horrible', 'difficult', 'hard', 'confusing', 'frustrated', 'annoying', 'worst', 'problem', 'issue', 'broken', 'fail', 'never', 'disappointed']

  const lowerText = text.toLowerCase()
  let positiveScore = 0
  let negativeScore = 0

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++
  })
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++
  })

  if (positiveScore > negativeScore) return 'positive'
  if (negativeScore > positiveScore) return 'negative'
  return 'neutral'
}

function generateReportHTML(flow, analytics, responses) {
  const completionRate = analytics?.completionRate || 0
  const totalStarted = analytics?.totalStarted || 0
  const totalCompleted = analytics?.totalCompleted || 0
  const avgTime = analytics?.averageTime || 0

  return `
<!DOCTYPE html>
<html>
<head>
  <title>Validation Report - ${flow?.flow_name || 'Report'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #5e17eb; }
    .header h1 { font-size: 28px; color: #5e17eb; margin-bottom: 8px; }
    .header p { color: #666; }
    .date { font-size: 12px; color: #999; margin-top: 8px; }
    .metrics { display: flex; justify-content: space-around; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 12px; }
    .metric { text-align: center; }
    .metric-value { font-size: 36px; font-weight: 700; color: #5e17eb; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .section { margin: 30px 0; }
    .section h2 { font-size: 18px; color: #1a1a1a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
    .response-list { }
    .response-item { padding: 16px; margin-bottom: 12px; background: #f8f9fa; border-radius: 8px; }
    .response-email { font-weight: 600; margin-bottom: 8px; }
    .response-answer { margin: 8px 0; padding-left: 12px; border-left: 3px solid #5e17eb; }
    .response-answer strong { color: #666; font-size: 12px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
    @media print { body { padding: 20px; } .metrics { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${flow?.flow_name || 'Validation Flow Report'}</h1>
    <p>${flow?.flow_description || ''}</p>
    <div class="date">Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>

  <div class="metrics">
    <div class="metric">
      <div class="metric-value">${totalStarted}</div>
      <div class="metric-label">Started</div>
    </div>
    <div class="metric">
      <div class="metric-value">${totalCompleted}</div>
      <div class="metric-label">Completed</div>
    </div>
    <div class="metric">
      <div class="metric-value">${completionRate}%</div>
      <div class="metric-label">Completion Rate</div>
    </div>
    <div class="metric">
      <div class="metric-value">${avgTime} min</div>
      <div class="metric-label">Avg. Time</div>
    </div>
  </div>

  <div class="section">
    <h2>Responses (${responses?.length || 0})</h2>
    <div class="response-list">
      ${(responses || []).slice(0, 20).map(session => `
        <div class="response-item">
          <div class="response-email">${session.respondent_email || 'Anonymous'} - ${new Date(session.completed_at).toLocaleDateString()}</div>
          ${(session.responses || []).map((r, i) => `
            <div class="response-answer">
              <strong>Q${i + 1}: ${r.question_text}</strong><br/>
              ${Array.isArray(r.answer_value) ? r.answer_value.join(', ') : r.answer_value}
            </div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  </div>

  <div class="footer">
    Generated by FindMyFlow | ${window.location.origin}
  </div>
</body>
</html>
`
}

export default {
  ResponseTimeline,
  FunnelVisualization,
  GeographicBreakdown,
  QuestionBreakdown,
  AnswerClustering,
  SentimentIndicators,
  PDFReportGenerator
}
