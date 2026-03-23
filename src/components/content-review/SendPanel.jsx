import { useState, useEffect, useCallback } from 'react'
import {
  countSegmentRecipients,
  fetchAvailableTags,
  sendNewsletter,
  sendTestNewsletter,
  fetchSendProgress,
  retryFailedSends,
} from '../../lib/newsletterService'
import './SendPanel.css'

const SOURCE_OPTIONS = [
  { id: 'all', label: 'All Contacts' },
  { id: 'external', label: 'External' },
  { id: 'crm', label: 'CRM' },
  { id: 'leads', label: 'Quiz Leads' },
]

const PROJECT_TAGS = [
  { id: 'findmyflow', label: 'Find My Flow' },
  { id: 'buildwithai', label: 'BuildwithAI' },
  { id: 'beyourbest', label: 'BeYourBest' },
  { id: 'headset-rental', label: 'Headset Rental' },
  { id: 'headset-sales', label: 'Headset Sales' },
]

const PROJECT_TAG_IDS = PROJECT_TAGS.map((p) => p.id)

export default function SendPanel({ draft, onStatusChange }) {
  const [sources, setSources] = useState(['all'])
  const [availableTags, setAvailableTags] = useState([])
  const [selectedTags, setSelectedTags] = useState([])
  const [recipientCount, setRecipientCount] = useState(null)
  const [countLoading, setCountLoading] = useState(false)
  const [scheduleMode, setScheduleMode] = useState('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('09:00')
  const [showConfirm, setShowConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  const [sendError, setSendError] = useState(null)
  const [progress, setProgress] = useState(null)
  const [retrying, setRetrying] = useState(false)

  // Load available tags on mount
  useEffect(() => {
    fetchAvailableTags()
      .then(setAvailableTags)
      .catch((err) => console.error('Failed to load tags:', err))
  }, [])

  // When draft is sending or sent, fetch progress instead of showing controls
  useEffect(() => {
    if (!draft) return
    if (draft.status === 'sending' || draft.status === 'sent') {
      fetchSendProgress(draft.id)
        .then(setProgress)
        .catch((err) => console.error('Failed to load progress:', err))
    }
  }, [draft])

  // Recount recipients when sources or tags change
  const updateCount = useCallback(async () => {
    setCountLoading(true)
    try {
      const count = await countSegmentRecipients({
        sources,
        tags: selectedTags,
      })
      setRecipientCount(count)
    } catch (err) {
      console.error('Failed to count recipients:', err)
      setRecipientCount(null)
    } finally {
      setCountLoading(false)
    }
  }, [sources, selectedTags])

  useEffect(() => {
    updateCount()
  }, [updateCount])

  const toggleSource = (id) => {
    if (id === 'all') {
      setSources(['all'])
      // Keep project tags, only clear non-project tags
      setSelectedTags((prev) => prev.filter((t) => PROJECT_TAG_IDS.includes(t)))
      return
    }
    setSources((prev) => {
      const filtered = prev.filter((s) => s !== 'all')
      const next = filtered.includes(id)
        ? filtered.filter((s) => s !== id)
        : [...filtered, id]
      return next.length === 0 ? ['all'] : next
    })
  }

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const buildScheduledFor = () => {
    if (scheduleMode === 'now') return null
    if (!scheduledDate) return null
    // Include browser timezone offset so server interprets correctly
    const offset = new Date().getTimezoneOffset()
    const sign = offset <= 0 ? '+' : '-'
    const hh = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')
    const mm = String(Math.abs(offset) % 60).padStart(2, '0')
    return `${scheduledDate}T${scheduledTime}:00${sign}${hh}:${mm}`
  }

  const [testEmail, setTestEmail] = useState('')
  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleTestSend = async () => {
    const email = testEmail.trim()
    if (!email) return
    setTestSending(true)
    setTestResult(null)
    setSendError(null)
    try {
      await sendTestNewsletter(draft.id, email)
      setTestResult(`Test sent to ${email}`)
    } catch (err) {
      setSendError(err.message || 'Test send failed')
    } finally {
      setTestSending(false)
    }
  }

  const handleSend = async () => {
    setShowConfirm(false)
    setSending(true)
    setSendError(null)
    setSendResult(null)
    try {
      const segment = { sources, tags: selectedTags }
      const scheduledFor = buildScheduledFor()
      const result = await sendNewsletter(draft.id, segment, scheduledFor)
      setSendResult(result)
      onStatusChange()
    } catch (err) {
      setSendError(err.message || 'Failed to send newsletter')
    } finally {
      setSending(false)
    }
  }

  const canSend =
    draft &&
    recipientCount > 0 &&
    !countLoading &&
    !sending &&
    (scheduleMode === 'now' || scheduledDate)

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await retryFailedSends(draft.id)
      // Refresh progress after retry
      const updated = await fetchSendProgress(draft.id)
      setProgress(updated)
      onStatusChange()
    } catch (err) {
      console.error('Retry failed:', err)
    } finally {
      setRetrying(false)
    }
  }

  // --- Progress view (sending / sent) ---
  if (progress) {
    const pct = progress.total > 0
      ? Math.round((progress.sent / progress.total) * 100)
      : 0

    return (
      <div className="sp-panel">
        <h4 className="sp-heading">Send Progress</h4>
        <div className="sp-progress-track">
          <div className="sp-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="sp-progress-stats">
          <span className="sp-sent-badge">
            {progress.sent} / {progress.total} sent
          </span>
          {progress.failed > 0 && (
            <span className="sp-failed-count">
              {progress.failed} failed
            </span>
          )}
        </div>
        {progress.failed > 0 && (
          <button
            className="sp-retry-btn"
            onClick={handleRetry}
            disabled={retrying}
          >
            {retrying ? 'Retrying...' : `Retry ${progress.failed} Failed`}
          </button>
        )}
      </div>
    )
  }

  // --- Result view ---
  if (sendResult) {
    return (
      <div className="sp-panel">
        <h4 className="sp-heading">Newsletter Sent</h4>
        <p className="sp-result-msg">
          <span className="sp-sent-badge">
            {sendResult.sent_now} sent
          </span>
        </p>
      </div>
    )
  }

  // --- Error view ---
  if (sendError) {
    return (
      <div className="sp-panel">
        <h4 className="sp-heading">Send Failed</h4>
        <p className="sp-error">{sendError}</p>
        <button
          className="sp-send-btn"
          onClick={() => setSendError(null)}
        >
          Try Again
        </button>
      </div>
    )
  }

  // --- Main send controls ---
  return (
    <div className="sp-panel">
      <h4 className="sp-heading">Send Newsletter</h4>

      {/* Project filter — primary way to target newsletters */}
      <label className="sp-label">Project</label>
      <div className="sp-chips">
        {PROJECT_TAGS.map((proj) => (
          <button
            key={proj.id}
            className={`sp-chip ${
              selectedTags.includes(proj.id) ? 'sp-chip--active' : ''
            }`}
            onClick={() => toggleTag(proj.id)}
          >
            {proj.label}
          </button>
        ))}
      </div>

      {/* Source selection */}
      <label className="sp-label">Source</label>
      <div className="sp-chips">
        {SOURCE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`sp-chip ${
              (opt.id === 'all' && sources.includes('all')) ||
              (opt.id !== 'all' && sources.includes(opt.id))
                ? 'sp-chip--active'
                : ''
            }`}
            onClick={() => toggleSource(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Additional tags (only when specific sources selected) */}
      {!sources.includes('all') && availableTags.length > 0 && (() => {
        const extraTags = availableTags.filter((t) => !PROJECT_TAG_IDS.includes(t))
        if (extraTags.length === 0) return null
        return (
          <>
            <label className="sp-label">Additional Tags</label>
            <div className="sp-chips">
              {extraTags.map((tag) => (
                <button
                  key={tag}
                  className={`sp-chip sp-chip--tag ${
                    selectedTags.includes(tag) ? 'sp-chip--active' : ''
                  }`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </>
        )
      })()}

      {/* Recipient count */}
      <div className="sp-count">
        {countLoading ? (
          <span className="sp-count-loading">Counting...</span>
        ) : recipientCount !== null ? (
          <span className="sp-count-number">
            {recipientCount} recipient{recipientCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="sp-count-loading">--</span>
        )}
      </div>

      {/* Schedule toggle */}
      <div className="sp-schedule-toggle">
        <button
          className={`sp-toggle-btn ${
            scheduleMode === 'now' ? 'sp-toggle-btn--active' : ''
          }`}
          onClick={() => setScheduleMode('now')}
        >
          Send Now
        </button>
        <button
          className={`sp-toggle-btn ${
            scheduleMode === 'scheduled' ? 'sp-toggle-btn--active' : ''
          }`}
          onClick={() => setScheduleMode('scheduled')}
        >
          Schedule
        </button>
      </div>

      {/* Date/time inputs */}
      {scheduleMode === 'scheduled' && (
        <div className="sp-datetime">
          <input
            type="date"
            className="sp-input"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
          <input
            type="time"
            className="sp-input"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
          />
        </div>
      )}

      {/* Test send */}
      <div className="sp-test-row">
        <input
          type="email"
          className="sp-input sp-test-input"
          placeholder="Test email address"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTestSend()}
        />
        <button
          className="sp-test-btn"
          disabled={!draft || sending || testSending || !testEmail.trim()}
          onClick={handleTestSend}
        >
          {testSending ? 'Sending...' : 'Send Test'}
        </button>
      </div>
      {testResult && (
        <p className="sp-test-result">{testResult}</p>
      )}

      {/* Send button */}
      <button
        className="sp-send-btn"
        disabled={!canSend}
        onClick={() => setShowConfirm(true)}
      >
        {sending
          ? 'Sending...'
          : scheduleMode === 'scheduled'
          ? 'Schedule Send'
          : 'Send Newsletter'}
      </button>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="sp-confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="sp-confirm" onClick={(e) => e.stopPropagation()}>
            <h4 className="sp-confirm-title">Confirm Send</h4>
            <div className="sp-confirm-details">
              <p className="sp-confirm-row">
                <span className="sp-confirm-label">Subject</span>
                <span className="sp-confirm-value">
                  {draft?.subject_line || draft?.title || 'Untitled'}
                </span>
              </p>
              {selectedTags.filter((t) => PROJECT_TAG_IDS.includes(t)).length > 0 && (
                <p className="sp-confirm-row">
                  <span className="sp-confirm-label">Project</span>
                  <span className="sp-confirm-value">
                    {selectedTags
                      .filter((t) => PROJECT_TAG_IDS.includes(t))
                      .map((t) => PROJECT_TAGS.find((p) => p.id === t)?.label || t)
                      .join(', ')}
                  </span>
                </p>
              )}
              <p className="sp-confirm-row">
                <span className="sp-confirm-label">Recipients</span>
                <span className="sp-confirm-value">{recipientCount}</span>
              </p>
              {scheduleMode === 'scheduled' && scheduledDate && (
                <p className="sp-confirm-row">
                  <span className="sp-confirm-label">Scheduled</span>
                  <span className="sp-confirm-value">
                    {scheduledDate} at {scheduledTime}
                  </span>
                </p>
              )}
            </div>
            <div className="sp-confirm-actions">
              <button
                className="sp-confirm-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="sp-confirm-send"
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
