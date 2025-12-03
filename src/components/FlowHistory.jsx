import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import {
  getDirectionIcon,
  getDirectionLabel,
  getDirectionColor,
  getDirectionEmoji,
  formatFlowDate
} from '../lib/flowCompass'

/**
 * FlowHistory - Shows recent flow entries in a timeline
 *
 * Props:
 * - projectId: uuid (optional - filter by project)
 * - limit: number (default: 10)
 * - onEntryClick: (entry) => void (optional)
 */

const FlowHistory = ({ projectId = null, limit = 10, onEntryClick }) => {
  const { user } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id) {
      loadEntries()
    }
  }, [user, projectId, limit])

  const loadEntries = async () => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('flow_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false })
        .limit(limit)

      // Filter by project if provided
      if (projectId) {
        query = query.eq('project_id', projectId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setEntries(data || [])
    } catch (err) {
      console.error('Error loading flow entries:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flow-history">
        <h3>Flow History</h3>
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flow-history">
        <h3>Flow History</h3>
        <div className="error-message">{error}</div>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flow-history">
        <h3>Flow History</h3>
        <div className="empty-state">
          <p className="empty-icon">🧭</p>
          <p className="empty-text">No flow entries yet</p>
          <p className="empty-hint">Start tracking to see your patterns!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flow-history">
      <div className="history-header">
        <h3>Flow History</h3>
        <span className="entry-count">{entries.length} entries</span>
      </div>

      <div className="flow-timeline">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className={`flow-entry-card flow-entry-${entry.direction}`}
            onClick={() => onEntryClick && onEntryClick(entry)}
            style={{
              '--entry-color': getDirectionColor(entry.direction),
              '--entry-delay': `${index * 0.05}s`
            }}
          >
            {/* Direction badge */}
            <div className="entry-direction">
              <span
                className="direction-badge"
                style={{ backgroundColor: getDirectionColor(entry.direction) }}
              >
                <span className="direction-emoji">{getDirectionEmoji(entry.direction)}</span>
                <span className="direction-icon">{getDirectionIcon(entry.direction)}</span>
                <span className="direction-label">{getDirectionLabel(entry.direction)}</span>
              </span>
            </div>

            {/* Activity */}
            {entry.activity_description && (
              <p className="entry-activity">
                <strong>{entry.activity_description}</strong>
              </p>
            )}

            {/* Reasoning */}
            <p className="entry-reasoning">{entry.reasoning}</p>

            {/* Metadata */}
            <div className="entry-metadata">
              <span className="entry-date">{formatFlowDate(entry.logged_at)}</span>
              <span className="entry-states">
                {entry.internal_state === 'excited' ? '😊' : '😴'}{' '}
                {entry.external_state === 'ease' ? '✅' : '❌'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Load more button (future enhancement) */}
      {entries.length >= limit && (
        <button className="load-more-btn" onClick={loadEntries}>
          Load More
        </button>
      )}
    </div>
  )
}

export default FlowHistory
