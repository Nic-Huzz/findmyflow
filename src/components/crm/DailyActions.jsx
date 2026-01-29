/**
 * DailyActions - Dashboard widget showing today's Attract & Nurture tasks
 * Shows content to post and leads to follow up, with next day preview
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getPlanningWeekStart } from '../../lib/crm/weeklyPlanningService'
import './DailyActions.css'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// Time thresholds for stale leads (in days)
const STALE_THRESHOLDS = {
  hot: 1,    // Hot leads stale after 1 day
  warm: 3,   // Warm leads stale after 3 days
  cold: 7    // Cold leads stale after 7 days
}

export default function DailyActions({ userId }) {
  const navigate = useNavigate()
  const [dayOffset, setDayOffset] = useState(0) // 0 = today, 1 = tomorrow
  const [contentItems, setContentItems] = useState([])
  const [nurtureTasks, setNurtureTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const currentDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    return date
  }, [dayOffset])

  const dayName = DAYS[currentDate.getDay()]
  const isToday = dayOffset === 0
  const isTomorrow = dayOffset === 1

  useEffect(() => {
    if (userId) {
      loadDailyData()
    }
  }, [userId, dayOffset])

  async function loadDailyData() {
    setLoading(true)
    try {
      await Promise.all([
        loadContentForDay(),
        loadNurtureTasks()
      ])
    } catch (err) {
      console.error('Error loading daily actions:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadContentForDay() {
    const weekStart = getPlanningWeekStart()

    const { data, error } = await supabase
      .from('crm_content_items')
      .select('*')
      .eq('user_id', userId)
      .eq('post_day', dayName)
      .in('status', ['planned', 'draft'])
      .gte('created_at', weekStart)
      .order('sort_order')

    if (error) {
      console.error('Error loading content:', error)
      return
    }

    setContentItems(data || [])
  }

  async function loadNurtureTasks() {
    // Load warm leads that need follow-up
    const { data: warmLeads, error: warmError } = await supabase
      .from('crm_warm_leads')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['to_contact', 'reached_out', 'in_conversation'])
      .order('priority', { ascending: false })
      .order('status_entered_at', { ascending: true })
      .limit(10)

    if (warmError) {
      console.error('Error loading warm leads:', warmError)
      return
    }

    // Filter based on temperature and staleness
    const now = new Date()
    const tasks = (warmLeads || []).map(lead => {
      const enteredAt = new Date(lead.status_entered_at || lead.created_at)
      const daysInStatus = Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24))
      const temperature = lead.temperature || 'warm'
      const threshold = STALE_THRESHOLDS[temperature] || 3
      const isStale = daysInStatus >= threshold
      const isDueToday = daysInStatus >= threshold - 1

      return {
        ...lead,
        daysInStatus,
        isStale,
        isDueToday,
        dueDay: isDueToday ? 0 : Math.max(0, threshold - daysInStatus - 1)
      }
    })

    // Filter for the selected day
    const filtered = tasks.filter(task => {
      if (dayOffset === 0) {
        return task.isDueToday || task.isStale
      } else {
        return task.dueDay === dayOffset
      }
    })

    setNurtureTasks(filtered)
  }

  function handlePrevDay() {
    if (dayOffset > 0) {
      setDayOffset(dayOffset - 1)
    }
  }

  function handleNextDay() {
    if (dayOffset < 6) {
      setDayOffset(dayOffset + 1)
    }
  }

  const hasContent = contentItems.length > 0
  const hasNurture = nurtureTasks.length > 0
  const isEmpty = !hasContent && !hasNurture

  return (
    <div className="daily-actions">
      {/* Header with day navigation */}
      <div className="da-header">
        <h3 className="da-title">
          {isToday ? "Today's Actions" : isTomorrow ? "Tomorrow's Actions" : `${dayName}'s Actions`}
        </h3>
        <div className="da-day-nav">
          <button
            className="da-nav-btn"
            onClick={handlePrevDay}
            disabled={dayOffset === 0}
          >
            ←
          </button>
          <span className="da-day-label">
            {currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <button
            className="da-nav-btn"
            onClick={handleNextDay}
            disabled={dayOffset >= 6}
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="da-loading">
          <div className="da-spinner" />
        </div>
      ) : isEmpty ? (
        <div className="da-empty">
          <span className="da-empty-icon">✨</span>
          <p>No actions scheduled for {isToday ? 'today' : dayName}</p>
        </div>
      ) : (
        <div className="da-sections">
          {/* Attract Section - Content to Post */}
          {hasContent && (
            <div className="da-section da-attract">
              <div className="da-section-header">
                <span className="da-section-icon">📝</span>
                <span className="da-section-title">Content to Post</span>
                <span className="da-section-count">{contentItems.length}</span>
              </div>
              <div className="da-items">
                {contentItems.map(item => (
                  <div key={item.id} className="da-item da-content-item">
                    <div className="da-item-icon">{item.icon || '📄'}</div>
                    <div className="da-item-info">
                      <span className="da-item-label">{item.label}</span>
                      {item.context && (
                        <span className="da-item-context">{item.context.substring(0, 50)}...</span>
                      )}
                    </div>
                    <div className="da-item-status">
                      {item.status === 'draft' ? (
                        <span className="da-badge da-badge-draft">Draft</span>
                      ) : (
                        <span className="da-badge da-badge-todo">To Do</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="da-section-action"
                onClick={() => navigate('/crm/marketing')}
              >
                Go to Content →
              </button>
            </div>
          )}

          {/* Nurture Section - Leads to Follow Up */}
          {hasNurture && (
            <div className="da-section da-nurture">
              <div className="da-section-header">
                <span className="da-section-icon">💜</span>
                <span className="da-section-title">Leads to Follow Up</span>
                <span className="da-section-count">{nurtureTasks.length}</span>
              </div>
              <div className="da-items">
                {nurtureTasks.map(lead => (
                  <div key={lead.id} className={`da-item da-lead-item ${lead.isStale ? 'stale' : ''}`}>
                    <div className="da-item-icon">
                      {lead.temperature === 'hot' ? '🔥' : lead.temperature === 'cold' ? '❄️' : '☀️'}
                    </div>
                    <div className="da-item-info">
                      <span className="da-item-label">
                        {lead.name}
                        {lead.handle && <span className="da-handle">@{lead.handle}</span>}
                      </span>
                      <span className="da-item-context">
                        {lead.platform} • {lead.engagement_type?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="da-item-meta">
                      {lead.isStale ? (
                        <span className="da-badge da-badge-stale">
                          {lead.daysInStatus}d overdue
                        </span>
                      ) : (
                        <span className="da-badge da-badge-days">
                          {lead.daysInStatus}d
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="da-section-action"
                onClick={() => navigate('/crm/warm-outreach')}
              >
                Go to Warm Leads →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
