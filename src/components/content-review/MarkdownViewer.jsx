import { useRef, useState, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTextSelection } from '../../hooks/useTextSelection'
import CommentPopover from './CommentPopover'
import {
  updateDraft,
  createVersion,
  fetchVersions,
  fetchVersion,
  uploadContentImage,
} from '../../lib/contentReviewService'

export default function MarkdownViewer({ draft, comments, onAddComment, onDraftUpdate }) {
  const contentRef = useRef(null)
  const { selection, popoverPosition, clearSelection, lockSelection, unlockSelection } = useTextSelection(contentRef)

  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [saveStatus, setSaveStatus] = useState(null) // null | 'saving' | 'saved'
  const [showHistory, setShowHistory] = useState(false)
  const [versions, setVersions] = useState([])
  const [previewVersion, setPreviewVersion] = useState(null)
  const [loadingVersions, setLoadingVersions] = useState(false)

  const textareaRef = useRef(null)
  const saveTimerRef = useRef(null)
  const lastSavedRef = useRef({ title: '', body: '' })
  // Refs to avoid stale closures in debounced save
  const editTitleRef = useRef('')
  const editBodyRef = useRef('')
  const draftIdRef = useRef(null)
  const onDraftUpdateRef = useRef(onDraftUpdate)
  onDraftUpdateRef.current = onDraftUpdate

  // Sync edit fields when draft changes
  useEffect(() => {
    if (draft) {
      setEditTitle(draft.title || '')
      setEditBody(draft.body_markdown || '')
      editTitleRef.current = draft.title || ''
      editBodyRef.current = draft.body_markdown || ''
      draftIdRef.current = draft.id
      lastSavedRef.current = { title: draft.title || '', body: draft.body_markdown || '' }
    }
  }, [draft?.id])

  // Autosave: debounce 2s after typing (reads from refs to avoid stale closures)
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const currentTitle = editTitleRef.current
      const currentBody = editBodyRef.current
      const currentDraftId = draftIdRef.current
      const titleChanged = currentTitle !== lastSavedRef.current.title
      const bodyChanged = currentBody !== lastSavedRef.current.body
      if (!titleChanged && !bodyChanged) return

      setSaveStatus('saving')
      try {
        const updates = {}
        if (bodyChanged) updates.body_markdown = currentBody
        if (titleChanged) updates.title = currentTitle

        const updated = await updateDraft(currentDraftId, updates)
        await createVersion(currentDraftId, {
          body_markdown: currentBody,
          title: currentTitle,
        })
        lastSavedRef.current = { title: currentTitle, body: currentBody }
        setSaveStatus('saved')
        if (onDraftUpdateRef.current) onDraftUpdateRef.current(updated)
        setTimeout(() => setSaveStatus(null), 2000)
      } catch (err) {
        console.error('Autosave failed:', err)
        setSaveStatus(null)
      }
    }, 2000)
  }, []) // No deps needed — reads from refs

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleTitleChange = (e) => {
    const val = e.target.value
    setEditTitle(val)
    editTitleRef.current = val
    scheduleSave()
  }

  const handleBodyChange = (e) => {
    const val = e.target.value
    setEditBody(val)
    editBodyRef.current = val
    scheduleSave()
  }

  const applyFormat = (prefix, suffix = prefix) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = editBody
    const selected = text.slice(start, end)
    const newText = text.slice(0, start) + prefix + selected + suffix + text.slice(end)
    setEditBody(newText)
    editBodyRef.current = newText
    scheduleSave()
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      ta.focus()
      ta.selectionStart = start + prefix.length
      ta.selectionEnd = end + prefix.length
    })
  }

  const imageInputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset for re-upload
    setUploading(true)
    try {
      const url = await uploadContentImage(file)
      const ta = textareaRef.current
      const cursor = ta ? ta.selectionStart : editBody.length
      const imgMarkdown = `\n![${file.name}](${url})\n`
      const newText = editBody.slice(0, cursor) + imgMarkdown + editBody.slice(cursor)
      setEditBody(newText)
      editBodyRef.current = newText
      scheduleSave()
    } catch (err) {
      console.error('Image upload failed:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleToggleEdit = () => {
    if (editing) {
      // Switching to preview: flush any pending save
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const currentTitle = editTitleRef.current
      const currentBody = editBodyRef.current
      const titleChanged = currentTitle !== lastSavedRef.current.title
      const bodyChanged = currentBody !== lastSavedRef.current.body
      if (titleChanged || bodyChanged) {
        setSaveStatus('saving')
        updateDraft(draft.id, {
          body_markdown: currentBody,
          title: currentTitle,
        }).then(updated => {
          createVersion(draft.id, { body_markdown: currentBody, title: currentTitle })
          lastSavedRef.current = { title: currentTitle, body: currentBody }
          setSaveStatus('saved')
          if (onDraftUpdateRef.current) onDraftUpdateRef.current(updated)
          setTimeout(() => setSaveStatus(null), 2000)
        }).catch(err => {
          console.error('Save on toggle failed:', err)
          setSaveStatus(null)
        })
      }
    }
    setEditing(!editing)
    setShowHistory(false)
    setPreviewVersion(null)
  }

  const handleOpenHistory = async () => {
    setShowHistory(true)
    setLoadingVersions(true)
    try {
      const v = await fetchVersions(draft.id)
      setVersions(v)
    } catch (err) {
      console.error('Failed to load versions:', err)
    } finally {
      setLoadingVersions(false)
    }
  }

  const handlePreviewVersion = async (versionId) => {
    try {
      const v = await fetchVersion(versionId)
      setPreviewVersion(v)
    } catch (err) {
      console.error('Failed to load version:', err)
    }
  }

  const handleRestoreVersion = () => {
    if (!previewVersion) return
    const restoredTitle = previewVersion.title || editTitle
    const restoredBody = previewVersion.body_markdown || editBody
    setEditTitle(restoredTitle)
    setEditBody(restoredBody)
    editTitleRef.current = restoredTitle
    editBodyRef.current = restoredBody
    setPreviewVersion(null)
    setShowHistory(false)
    setEditing(true)
    scheduleSave()
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
    setPreviewVersion(null)
  }

  const handleSave = (commentData) => {
    onAddComment({
      ...commentData,
      startOffset: selection.startOffset,
      endOffset: selection.endOffset,
    })
    clearSelection()
  }

  const popoverStyle = popoverPosition?.mobile
    ? {}
    : popoverPosition
      ? { top: popoverPosition.top, left: popoverPosition.left }
      : {}

  // Determine what body/title to show
  const displayTitle = previewVersion ? previewVersion.title : (editing ? editTitle : draft.title)
  const displayBody = previewVersion ? previewVersion.body_markdown : (editing ? editBody : draft.body_markdown)

  return (
    <div className="cr-viewer">
      <div className="cr-viewer-header">
        <div className="cr-viewer-header-row">
          {editing && !previewVersion ? (
            <input
              className="cr-edit-title"
              value={editTitle}
              onChange={handleTitleChange}
              placeholder="Draft title..."
            />
          ) : (
            <h1 className="cr-viewer-title">{displayTitle}</h1>
          )}
          <div className="cr-viewer-actions">
            {saveStatus && (
              <span className={`cr-save-status cr-save-status--${saveStatus}`}>
                {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
              </span>
            )}
            {!previewVersion && (
              <>
                <button
                  className="cr-btn cr-btn--cancel cr-btn--sm"
                  onClick={handleOpenHistory}
                  title="Version history"
                >
                  History
                </button>
                <button
                  className={`cr-btn cr-btn--sm ${editing ? 'cr-btn--save' : 'cr-btn--gold'}`}
                  onClick={handleToggleEdit}
                >
                  {editing ? 'Preview' : 'Edit'}
                </button>
              </>
            )}
            {previewVersion && (
              <>
                <button
                  className="cr-btn cr-btn--cancel cr-btn--sm"
                  onClick={handleCloseHistory}
                >
                  Back
                </button>
                <button
                  className="cr-btn cr-btn--gold cr-btn--sm"
                  onClick={handleRestoreVersion}
                >
                  Restore
                </button>
              </>
            )}
          </div>
        </div>
        <div className="cr-viewer-meta">
          <span className="cr-viewer-by">{draft.created_by}</span>
          <span className="cr-viewer-date">
            {new Date(draft.created_at).toLocaleDateString()}
          </span>
          <span className={`cr-viewer-status cr-viewer-status--${draft.status}`}>
            {draft.status}
          </span>
          {previewVersion && (
            <span className="cr-viewer-status cr-viewer-status--draft">
              Version from {new Date(previewVersion.created_at).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {editing && !previewVersion ? (
        <>
          <div className="cr-format-toolbar">
            <button className="cr-format-btn" onClick={() => applyFormat('**')} title="Bold (Ctrl+B)">B</button>
            <button className="cr-format-btn cr-format-btn--italic" onClick={() => applyFormat('*')} title="Italic (Ctrl+I)">I</button>
            <button className="cr-format-btn" onClick={() => applyFormat('\n## ', '\n')} title="Heading">H</button>
            <button className="cr-format-btn" onClick={() => applyFormat('[', '](url)')} title="Link">Link</button>
            <button className="cr-format-btn" onClick={() => applyFormat('\n- ')} title="List">List</button>
            <button className="cr-format-btn" onClick={() => applyFormat('\n> ')} title="Quote">Quote</button>
            <span className="cr-format-divider" />
            <button
              className="cr-format-btn"
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              title="Insert image"
            >
              {uploading ? 'Uploading...' : 'Image'}
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>
          <textarea
            ref={textareaRef}
            className="cr-edit-textarea"
            value={editBody}
            onChange={handleBodyChange}
            onKeyDown={(e) => {
              if (e.metaKey || e.ctrlKey) {
                if (e.key === 'b') { e.preventDefault(); applyFormat('**') }
                if (e.key === 'i') { e.preventDefault(); applyFormat('*') }
              }
            }}
            placeholder="Write your content in markdown..."
            autoFocus
          />
        </>
      ) : (
        <div className="cr-viewer-content" ref={contentRef}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayBody}
          </ReactMarkdown>
        </div>
      )}

      {!editing && !previewVersion && selection && popoverPosition && (
        <CommentPopover
          key={`${selection.startOffset}-${selection.endOffset}`}
          style={popoverStyle}
          selectedText={selection.text}
          onSave={handleSave}
          onCancel={clearSelection}
          onMouseEnter={lockSelection}
          onMouseLeave={unlockSelection}
        />
      )}

      {/* Version History Panel */}
      {showHistory && (
        <div className="cr-history-panel">
          <div className="cr-history-header">
            <h3>Version History</h3>
            <button className="cr-comments-close" onClick={handleCloseHistory}>&times;</button>
          </div>
          {loadingVersions ? (
            <div className="cr-history-loading">Loading...</div>
          ) : versions.length === 0 ? (
            <div className="cr-history-empty">No versions yet. Start editing to create versions.</div>
          ) : (
            <div className="cr-history-list">
              {versions.map(v => (
                <button
                  key={v.id}
                  className={`cr-history-item ${previewVersion?.id === v.id ? 'cr-history-item--active' : ''}`}
                  onClick={() => handlePreviewVersion(v.id)}
                >
                  <span className="cr-history-time">
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                  <span className="cr-history-title">{v.title || 'Untitled'}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
