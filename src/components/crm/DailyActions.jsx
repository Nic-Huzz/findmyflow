/**
 * DailyActions - Dashboard widget showing today's Attract & Nurture tasks
 * Shows content to post and leads to follow up, with next day preview
 */
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { getPlanningWeekStart } from '../../lib/crm/weeklyPlanningService'
import { getStaleDeals } from '../../lib/crm/dealService'
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
  const [rawLeads, setRawLeads] = useState(null)
  const [salesNudges, setSalesNudges] = useState([])
  const [contentLoading, setContentLoading] = useState(true)
  const [leadsLoading, setLeadsLoading] = useState(true)
  const loading = contentLoading || leadsLoading

  const currentDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + dayOffset)
    return date
  }, [dayOffset])

  const dayName = DAYS[currentDate.getDay()]
  const isToday = dayOffset === 0
  const isTomorrow = dayOffset === 1

  // Fetch content when day changes (query uses dayName)
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setContentLoading(true)
    const targetDate = new Date()
    targetDate.setDate(targetDate.getDate() + dayOffset)
    const targetDayName = DAYS[targetDate.getDay()]
    async function fetchContent() {
      try {
        const weekStart = getPlanningWeekStart()
        const { data, error } = await supabase
          .from('crm_content_items')
          .select('*')
          .eq('user_id', userId)
          .eq('post_day', targetDayName)
          .in('status', ['planned', 'draft'])
          .gte('created_at', weekStart)
          .order('sort_order')

        if (cancelled) return
        if (error) {
          if (error.code === 'PGRST205' || error.code === '42P01') return
          console.error('Error loading content:', error)
          return
        }
        setContentItems(data || [])
      } catch {
        // Silently handle if table doesn't exist
      } finally {
        if (!cancelled) setContentLoading(false)
      }
    }
    fetchContent()
    return () => { cancelled = true }
  }, [userId, dayOffset])

  // Fetch leads once (query doesn't depend on dayOffset)
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLeadsLoading(true)
    async function fetchLeads() {
      try {
        const { data, error } = await supabase
          .from('crm_contacts')
          .select('*')
          .eq('user_id', userId)
          .in('outreach_status', ['to_contact', 'reached_out', 'in_conversation'])
          .order('priority', { ascending: false, nullsFirst: false })
          .order('updated_at', { ascending: true })

        if (cancelled) return
        if (error) {
          console.error('Error loading warm leads:', error)
          return
        }
        setRawLeads(data || [])
      } finally {
        if (!cancelled) setLeadsLoading(false)
      }
    }
    fetchLeads()
    return () => { cancelled = true }
  }, [userId])

  // Fetch sales nudges (Kill Zombies + Ask Again) - only when today
  useEffect(() => {
    if (!userId || dayOffset !== 0) {
      setSalesNudges([])
      return
    }
    async function fetchNudges() {
      const nudges = []
      try {
        // Kill Zombies: deals stale > 14 days
        const { data: staleDeals } = await getStaleDeals(userId, 14)
        if (staleDeals?.length > 0) {
          staleDeals.slice(0, 3).forEach(deal => {
            const days = Math.floor((Date.now() - new Date(deal.updated_at)) / (1000 * 60 * 60 * 24))
            nudges.push({
              id: `zombie-${deal.id}`,
              type: 'zombie',
              icon: '💀',
              label: `Kill the zombie: ${deal.contact_name}`,
              detail: `${days}d with no activity — close or move on`,
            })
          })
        }

        // Ask Again: follow_up deals that haven't been touched recently
        const { data: followUpDeals } = await supabase
          .from('sales_deals')
          .select('id, contact_name, status, updated_at')
          .eq('user_id', userId)
          .eq('status', 'follow_up')
          .order('updated_at', { ascending: true })
          .limit(3)

        if (followUpDeals?.length > 0) {
          followUpDeals.forEach(deal => {
            const daysSince = Math.floor((Date.now() - new Date(deal.updated_at)) / (1000 * 60 * 60 * 24))
            if (daysSince >= 2) {
              nudges.push({
                id: `ask-${deal.id}`,
                type: 'ask_again',
                icon: '🔄',
                label: `Ask again: ${deal.contact_name}`,
                detail: `Most sales happen after the 3rd-5th ask. Last contact ${daysSince}d ago.`,
              })
            }
          })
        }
      } catch {
        // Silently handle if tables don't exist yet
      }
      setSalesNudges(nudges)
    }
    fetchNudges()
  }, [userId, dayOffset])

  // Derive filtered nurture tasks from cached leads + current dayOffset
  const nurtureTasks = useMemo(() => {
    if (!rawLeads) return []
    const now = new Date()
    const tasks = rawLeads.map(lead => {
      const enteredAt = new Date(lead.outreach_status_entered_at || lead.updated_at || lead.created_at)
      const daysInStatus = Math.floor((now - enteredAt) / (1000 * 60 * 60 * 24))
      const temperature = lead.temperature || 'warm'
      const threshold = STALE_THRESHOLDS[temperature] || 3
      const isStale = daysInStatus >= threshold
      const isDueToday = daysInStatus >= Math.max(1, threshold - 1)
      return {
        ...lead,
        daysInStatus,
        isStale,
        isDueToday,
        dueDay: isDueToday ? 0 : Math.max(0, threshold - daysInStatus - 1)
      }
    })
    return tasks.filter(task => {
      if (dayOffset === 0) return task.isDueToday || task.isStale
      return task.dueDay === dayOffset
    })
  }, [rawLeads, dayOffset])

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
  const hasNudges = salesNudges.length > 0
  const isEmpty = !hasContent && !hasNurture && !hasNudges

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
                        <span className="da-item-context">{item.context.length > 50 ? item.context.substring(0, 50) + '...' : item.context}</span>
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
                        {lead.social_handle && <span className="da-handle">@{lead.social_handle}</span>}
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

          {/* Sales Nudges Section */}
          {hasNudges && (
            <div className="da-section da-nudges">
              <div className="da-section-header">
                <span className="da-section-icon">💪</span>
                <span className="da-section-title">Sales Coaching</span>
                <span className="da-section-count">{salesNudges.length}</span>
              </div>
              <div className="da-items">
                {salesNudges.map(nudge => (
                  <div key={nudge.id} className={`da-item da-nudge-item da-nudge-${nudge.type}`}>
                    <div className="da-item-icon">{nudge.icon}</div>
                    <div className="da-item-info">
                      <span className="da-item-label">{nudge.label}</span>
                      <span className="da-item-context">{nudge.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="da-section-action"
                onClick={() => navigate('/crm/sales')}
              >
                Go to Pipeline →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
