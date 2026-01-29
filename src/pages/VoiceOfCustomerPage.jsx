/**
 * VoiceOfCustomerPage - Searchable database of customer quotes and language
 *
 * Features:
 * - Full-text search across all quotes
 * - Filter by category, emotion, intensity
 * - Click to copy quotes
 * - Track usage of quotes
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { Link } from 'react-router-dom'
import './VoiceOfCustomerPage.css'

const CATEGORY_CONFIG = {
  pain_point: { label: 'Pain Point', emoji: '😣', color: '#ef4444' },
  dream_outcome: { label: 'Dream Outcome', emoji: '🌟', color: '#22c55e' },
  objection: { label: 'Objection', emoji: '🤔', color: '#f59e0b' },
  language: { label: 'Language', emoji: '💬', color: '#3b82f6' },
  competitor: { label: 'Competitor', emoji: '🏢', color: '#8b5cf6' },
  pricing: { label: 'Pricing', emoji: '💰', color: '#06b6d4' }
}

const EMOTION_CONFIG = {
  frustrated: { label: 'Frustrated', emoji: '😤', color: '#ef4444' },
  hopeful: { label: 'Hopeful', emoji: '🌈', color: '#22c55e' },
  confused: { label: 'Confused', emoji: '😕', color: '#f59e0b' },
  excited: { label: 'Excited', emoji: '🎉', color: '#8b5cf6' },
  skeptical: { label: 'Skeptical', emoji: '🧐', color: '#6b7280' }
}

function VoiceOfCustomerPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [emotionFilter, setEmotionFilter] = useState('')
  const [minIntensity, setMinIntensity] = useState(0)
  const [copiedId, setCopiedId] = useState(null)
  const [stats, setStats] = useState({ total: 0, byCategory: {} })

  useEffect(() => {
    if (user) {
      loadEntries()
    }
  }, [user, searchQuery, categoryFilter, emotionFilter, minIntensity])

  const loadEntries = async () => {
    setLoading(true)

    try {
      let query = supabase
        .from('voice_of_customer')
        .select('*')
        .eq('user_id', user.id)
        .order('intensity', { ascending: false })
        .order('created_at', { ascending: false })

      if (categoryFilter) {
        query = query.eq('category', categoryFilter)
      }

      if (emotionFilter) {
        query = query.eq('emotion', emotionFilter)
      }

      if (minIntensity > 0) {
        query = query.gte('intensity', minIntensity)
      }

      const { data, error } = await query.limit(100)

      if (error) throw error

      // Filter by search query client-side for better UX
      let filteredData = data || []
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase()
        filteredData = filteredData.filter(entry =>
          entry.quote.toLowerCase().includes(lowerQuery) ||
          entry.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
        )
      }

      setEntries(filteredData)

      // Calculate stats from all entries (not filtered)
      const { data: allData } = await supabase
        .from('voice_of_customer')
        .select('category')
        .eq('user_id', user.id)

      if (allData) {
        const byCategory = {}
        allData.forEach(e => {
          byCategory[e.category] = (byCategory[e.category] || 0) + 1
        })
        setStats({ total: allData.length, byCategory })
      }

    } catch (err) {
      console.error('Error loading VoC entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (quote, id) => {
    try {
      await navigator.clipboard.writeText(quote)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)

      // Track usage - fetch current value then increment
      const { data: current } = await supabase
        .from('voice_of_customer')
        .select('times_used')
        .eq('id', id)
        .single()

      await supabase
        .from('voice_of_customer')
        .update({
          times_used: (current?.times_used || 0) + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', id)

    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('')
    setEmotionFilter('')
    setMinIntensity(0)
  }

  const hasFilters = searchQuery || categoryFilter || emotionFilter || minIntensity > 0

  if (!user) {
    return (
      <div className="voc-page">
        <div className="voc-container">
          <p>Please log in to view your Voice of Customer database.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="voc-page">
      <div className="voc-container">
        {/* Header */}
        <div className="voc-header">
          <div className="voc-title-row">
            <Link to="/7-day-challenge" className="voc-back-btn">
              ← Back
            </Link>
            <h1>Voice of Customer</h1>
          </div>
          <p className="voc-subtitle">
            Your searchable database of customer language. Click any quote to copy.
          </p>
        </div>

        {/* Stats */}
        <div className="voc-stats">
          <div className="voc-stat-total">
            <span className="voc-stat-number">{stats.total}</span>
            <span className="voc-stat-label">Total Quotes</span>
          </div>
          <div className="voc-stat-categories">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div
                key={cat}
                className="voc-stat-category"
                style={{ borderColor: CATEGORY_CONFIG[cat]?.color }}
                onClick={() => setCategoryFilter(categoryFilter === cat ? '' : cat)}
              >
                <span className="voc-stat-cat-emoji">{CATEGORY_CONFIG[cat]?.emoji}</span>
                <span className="voc-stat-cat-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="voc-filters">
          <div className="voc-search">
            <input
              type="text"
              placeholder="Search quotes, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="voc-search-input"
            />
            {searchQuery && (
              <button
                className="voc-search-clear"
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="voc-filter-row">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="voc-filter-select"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
              ))}
            </select>

            <select
              value={emotionFilter}
              onChange={(e) => setEmotionFilter(e.target.value)}
              className="voc-filter-select"
            >
              <option value="">All Emotions</option>
              {Object.entries(EMOTION_CONFIG).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.emoji} {cfg.label}</option>
              ))}
            </select>

            <div className="voc-intensity-filter">
              <label>Min Intensity: {minIntensity}</label>
              <input
                type="range"
                min="0"
                max="10"
                value={minIntensity}
                onChange={(e) => setMinIntensity(parseInt(e.target.value))}
                className="voc-intensity-slider"
              />
            </div>

            {hasFilters && (
              <button className="voc-clear-filters" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="voc-loading">
            <div className="voc-spinner" />
            <span>Loading quotes...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="voc-empty">
            {hasFilters ? (
              <>
                <p>No quotes match your filters.</p>
                <button className="voc-clear-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </>
            ) : (
              <>
                <p>No Voice of Customer data yet.</p>
                <p className="voc-empty-hint">
                  Run an AI analysis on your validation responses to populate this database.
                </p>
                <Link to="/7-day-challenge" className="voc-cta-btn">
                  Go to Challenge →
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="voc-entries">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`voc-entry ${copiedId === entry.id ? 'copied' : ''}`}
                onClick={() => copyToClipboard(entry.quote, entry.id)}
                style={{ borderLeftColor: CATEGORY_CONFIG[entry.category]?.color }}
              >
                <div className="voc-entry-header">
                  <span
                    className="voc-entry-category"
                    style={{ background: `${CATEGORY_CONFIG[entry.category]?.color}20`, color: CATEGORY_CONFIG[entry.category]?.color }}
                  >
                    {CATEGORY_CONFIG[entry.category]?.emoji} {CATEGORY_CONFIG[entry.category]?.label}
                  </span>
                  {entry.emotion && (
                    <span className="voc-entry-emotion">
                      {EMOTION_CONFIG[entry.emotion]?.emoji} {entry.emotion}
                    </span>
                  )}
                  {entry.intensity && (
                    <span className="voc-entry-intensity">
                      Intensity: {entry.intensity}/10
                    </span>
                  )}
                </div>

                <blockquote className="voc-entry-quote">
                  "{entry.quote}"
                </blockquote>

                {entry.keywords?.length > 0 && (
                  <div className="voc-entry-keywords">
                    {entry.keywords.map((kw, i) => (
                      <span key={i} className="voc-keyword">{kw}</span>
                    ))}
                  </div>
                )}

                <div className="voc-entry-footer">
                  <span className="voc-copy-hint">
                    {copiedId === entry.id ? '✓ Copied!' : 'Click to copy'}
                  </span>
                  {entry.times_used > 0 && (
                    <span className="voc-times-used">
                      Used {entry.times_used}x
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results count */}
        {!loading && entries.length > 0 && (
          <div className="voc-results-count">
            Showing {entries.length} of {stats.total} quotes
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceOfCustomerPage
