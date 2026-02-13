import { useState } from 'react'

const STATUS_DOT = {
  draft: '#6b7280',
  review: '#ffdd27',
  approved: '#22c55e',
  sent: '#3b82f6',
  archived: '#9ca3af',
}

export default function DraftList({ drafts, commentCounts, selectedId, onSelect, isDropdown }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? drafts
    : filter === 'has_comments'
    ? drafts.filter(d => commentCounts[d.id]?.pending > 0)
    : drafts.filter(d => d.status === filter)

  const content = (
    <>
      <div className="cr-sidebar-filters">
        <select
          className="cr-filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All drafts</option>
          <option value="review">Needs review</option>
          <option value="has_comments">Has comments</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      <div className="cr-draft-list">
        {filtered.map(d => {
          const counts = commentCounts[d.id] || { total: 0, pending: 0 }
          return (
            <button
              key={d.id}
              className={`cr-draft-item ${selectedId === d.id ? 'cr-draft-item--active' : ''}`}
              onClick={() => onSelect(d.id)}
            >
              <div className="cr-draft-item-row">
                <span
                  className="cr-status-dot"
                  style={{ background: STATUS_DOT[d.status] || '#6b7280' }}
                />
                <span className="cr-draft-title">{d.title}</span>
              </div>
              {counts.pending > 0 && (
                <span className="cr-draft-badge">{counts.pending}</span>
              )}
            </button>
          )
        })}
      </div>
    </>
  )

  if (isDropdown) {
    return <div className="cr-sidebar cr-sidebar--dropdown">{content}</div>
  }

  return <div className="cr-sidebar">{content}</div>
}
