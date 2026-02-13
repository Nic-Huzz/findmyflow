const STATUS_COLORS = {
  pending: '#ffdd27',
  resolved: '#22c55e',
  rejected: '#6b7280',
}

const CATEGORY_LABELS = {
  tone: 'Tone',
  word_choice: 'Word Choice',
  structure: 'Structure',
  content: 'Content',
  brand: 'Brand',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function CommentsPanel({ comments, onStatusChange, isSheet, onClose }) {
  const pendingCount = comments.filter(c => c.status === 'pending').length

  return (
    <div className={`cr-comments ${isSheet ? 'cr-comments--sheet' : ''}`}>
      <div className="cr-comments-header">
        <h3>Comments ({comments.length})</h3>
        {pendingCount > 0 && (
          <span className="cr-comments-badge">{pendingCount} pending</span>
        )}
        {isSheet && (
          <button className="cr-comments-close" onClick={onClose}>x</button>
        )}
      </div>

      {comments.length === 0 ? (
        <div className="cr-comments-empty">
          <p>No comments yet.</p>
          <p className="cr-comments-hint">Highlight text to leave feedback.</p>
        </div>
      ) : (
        <div className="cr-comments-list">
          {comments.map(c => (
            <div key={c.id} className={`cr-comment cr-comment--${c.status}`}>
              <div className="cr-comment-quote">"{c.highlighted_text.length > 80 ? c.highlighted_text.slice(0, 80) + '...' : c.highlighted_text}"</div>

              <div className="cr-comment-meta">
                {c.quick_reaction && (
                  <span className="cr-chip cr-chip--sm">{c.quick_reaction.replace('_', ' ')}</span>
                )}
                <span className="cr-chip cr-chip--cat cr-chip--sm">{CATEGORY_LABELS[c.category]}</span>
                <span className="cr-comment-time">{timeAgo(c.created_at)}</span>
              </div>

              {c.comment && <p className="cr-comment-text">{c.comment}</p>}

              {c.status === 'resolved' && c.resolved_text && (
                <div className="cr-comment-resolved">
                  <span className="cr-comment-arrow">&rarr;</span> {c.resolved_text}
                </div>
              )}

              <div className="cr-comment-status">
                <span
                  className="cr-status-dot"
                  style={{ background: STATUS_COLORS[c.status] }}
                />
                <span>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
