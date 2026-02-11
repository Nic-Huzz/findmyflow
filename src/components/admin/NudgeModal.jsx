import { useState } from 'react'
import { sendNudge } from '../../lib/adminService'

export default function NudgeModal({ user, onClose, onSent }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  async function handleSend() {
    if (!title.trim() || !body.trim()) return
    setSending(true)
    setError(null)

    try {
      const result = await sendNudge(user.id, title, body, url || undefined)
      onSent(result)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const displayName = user.display_name || 'there'
  const previewTitle = title.replace(/\{name\}/g, displayName)
  const previewBody = body.replace(/\{name\}/g, displayName)

  return (
    <div className="ad-modal-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={e => e.stopPropagation()}>
        <div className="ad-modal-header">
          <h3>Send Nudge</h3>
          <button className="ad-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="ad-modal-body">
          <p className="ad-nudge-target">
            To: <strong>{user.display_name || user.email}</strong>
          </p>

          <div className="ad-field">
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Hey {name}, time to level up!"
              maxLength={100}
            />
          </div>

          <div className="ad-field">
            <label>Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="e.g. You're 1 quest away from your next level. Let's go!"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="ad-field">
            <label>URL (optional)</label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="/7-day-challenge"
            />
          </div>

          <p className="ad-hint">Use <code>{'{name}'}</code> to insert the user's name.</p>

          {(title || body) && (
            <div className="ad-preview">
              <span className="ad-preview-label">Preview</span>
              <div className="ad-preview-card">
                <strong>{previewTitle || 'Notification Title'}</strong>
                <p>{previewBody || 'Notification body text...'}</p>
              </div>
            </div>
          )}

          {error && <p className="ad-error">{error}</p>}
        </div>

        <div className="ad-modal-actions">
          <button className="ad-cancel" onClick={onClose}>Cancel</button>
          <button
            className="ad-send"
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
          >
            {sending ? 'Sending...' : 'Send Nudge'}
          </button>
        </div>
      </div>
    </div>
  )
}
