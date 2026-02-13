import { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTextSelection } from '../../hooks/useTextSelection'
import CommentPopover from './CommentPopover'

export default function MarkdownViewer({ draft, comments, onAddComment }) {
  const contentRef = useRef(null)
  const { selection, popoverPosition, clearSelection, lockSelection, unlockSelection } = useTextSelection(contentRef)

  const handleSave = (commentData) => {
    onAddComment({
      ...commentData,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    })
    clearSelection()
  }

  return (
    <div className="cr-viewer">
      <div className="cr-viewer-header">
        <h1 className="cr-viewer-title">{draft.title}</h1>
        <div className="cr-viewer-meta">
          <span className="cr-viewer-by">{draft.created_by}</span>
          <span className="cr-viewer-date">
            {new Date(draft.created_at).toLocaleDateString()}
          </span>
          <span className={`cr-viewer-status cr-viewer-status--${draft.status}`}>
            {draft.status}
          </span>
        </div>
      </div>

      <div className="cr-viewer-content" ref={contentRef}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {draft.body_markdown}
        </ReactMarkdown>
      </div>

      {selection && popoverPosition && (
        <CommentPopover
          position={popoverPosition}
          selectedText={selection.text}
          onSave={handleSave}
          onCancel={clearSelection}
          onMouseEnter={lockSelection}
          onMouseLeave={unlockSelection}
        />
      )}
    </div>
  )
}
