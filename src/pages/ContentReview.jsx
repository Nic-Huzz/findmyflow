import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import {
  fetchDrafts,
  fetchDraftWithComments,
  fetchCommentCounts,
  createComment,
  updateCommentStatus,
} from '../lib/contentReviewService'
import DraftList from '../components/content-review/DraftList'
import MarkdownViewer from '../components/content-review/MarkdownViewer'
import CommentsPanel from '../components/content-review/CommentsPanel'
import VoiceDashboard from '../components/content-review/VoiceDashboard'
import './ContentReview.css'

export default function ContentReview() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [authorized, setAuthorized] = useState(null) // null = checking
  const [tab, setTab] = useState('drafts') // 'drafts' | 'voice'
  const [drafts, setDrafts] = useState([])
  const [commentCounts, setCommentCounts] = useState({})
  const [selectedDraftId, setSelectedDraftId] = useState(null)
  const [currentDraft, setCurrentDraft] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showComments, setShowComments] = useState(false) // mobile sheet
  const initialLoadDone = useRef(false)

  const loadDrafts = useCallback(async () => {
    try {
      // Fetch drafts first — this is the auth gate (RLS blocks non-admins)
      const draftsData = await fetchDrafts()
      setDrafts(draftsData)
      setAuthorized(true)
      if (!initialLoadDone.current && draftsData.length > 0) {
        setSelectedDraftId(draftsData[0].id)
        initialLoadDone.current = true
      }
      // Comment counts are non-critical — don't let failures block the page
      try {
        const countsData = await fetchCommentCounts()
        setCommentCounts(countsData)
      } catch (countErr) {
        console.error('Failed to load comment counts:', countErr)
      }
    } catch (err) {
      // RLS will block non-admins — treat permission errors as unauthorized
      console.error('Failed to load drafts:', err)
      setAuthorized(false)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDraft = useCallback(async (draftId) => {
    try {
      const { draft, comments: draftComments } = await fetchDraftWithComments(draftId)
      setCurrentDraft(draft)
      setComments(draftComments)
    } catch (err) {
      console.error('Failed to load draft:', err)
    }
  }, [])

  useEffect(() => {
    if (user?.id) loadDrafts()
  }, [user?.id, loadDrafts])

  useEffect(() => {
    if (selectedDraftId) loadDraft(selectedDraftId)
  }, [selectedDraftId, loadDraft])

  const handleStatusChange = async (commentId, status, resolvedText) => {
    try {
      const updated = await updateCommentStatus(commentId, status, resolvedText)
      setComments(prev => prev.map(c => c.id === commentId ? updated : c))
      // Update counts
      setCommentCounts(prev => {
        const draftCounts = { ...(prev[selectedDraftId] || { total: 0, pending: 0 }) }
        if (status === 'resolved' || status === 'rejected') {
          draftCounts.pending = Math.max(0, draftCounts.pending - 1)
        }
        return { ...prev, [selectedDraftId]: draftCounts }
      })
    } catch (err) {
      console.error('Failed to update comment:', err)
    }
  }

  const handleAddComment = async (commentData) => {
    try {
      const newComment = await createComment({
        draftId: selectedDraftId,
        ...commentData,
      })
      setComments(prev => [...prev, newComment].sort((a, b) => a.start_offset - b.start_offset))
      // Update counts
      setCommentCounts(prev => ({
        ...prev,
        [selectedDraftId]: {
          total: (prev[selectedDraftId]?.total || 0) + 1,
          pending: (prev[selectedDraftId]?.pending || 0) + 1,
        }
      }))
    } catch (err) {
      console.error('Failed to add comment:', err)
    }
  }

  if (loading) {
    return (
      <div className="cr-page">
        <div className="cr-loading">
          <div className="cr-spinner" />
          <span>Verifying access...</span>
        </div>
      </div>
    )
  }

  if (authorized === false) {
    return (
      <div className="cr-page">
        <div className="cr-loading">
          <span className="cr-loading-lock">&#128274;</span>
          <span className="cr-loading-title">Not authorized</span>
          <button
            className="cr-btn cr-btn--save"
            onClick={() => navigate('/me')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cr-page">
      {/* Toolbar */}
      <div className="cr-toolbar">
        <button className="cr-toolbar-back" onClick={() => navigate(-1)}>
          &larr;
        </button>
        <div className="cr-toolbar-tabs">
          <button
            className={`cr-tab ${tab === 'drafts' ? 'cr-tab--active' : ''}`}
            onClick={() => setTab('drafts')}
          >
            Drafts
          </button>
          <button
            className={`cr-tab ${tab === 'voice' ? 'cr-tab--active' : ''}`}
            onClick={() => setTab('voice')}
          >
            Voice
          </button>
        </div>
      </div>

      {tab === 'voice' ? (
        <VoiceDashboard />
      ) : (
        <div className="cr-layout">
          {/* Sidebar - desktop only, dropdown on mobile */}
          <DraftList
            drafts={drafts}
            commentCounts={commentCounts}
            selectedId={selectedDraftId}
            onSelect={setSelectedDraftId}
          />

          {/* Main content */}
          {currentDraft ? (
            <MarkdownViewer
              draft={currentDraft}
              comments={comments}
              onAddComment={handleAddComment}
            />
          ) : (
            <div className="cr-viewer-empty">Select a draft to review</div>
          )}

          {/* Comments - sidebar on desktop, bottom sheet on mobile */}
          <CommentsPanel
            comments={comments}
            onStatusChange={handleStatusChange}
            isSheet={false}
          />

          {/* Mobile comments toggle */}
          <button
            className="cr-mobile-comments-btn"
            onClick={() => setShowComments(!showComments)}
          >
            Comments ({comments.filter(c => c.status === 'pending').length})
          </button>

          {showComments && (
            <CommentsPanel
              comments={comments}
              onStatusChange={handleStatusChange}
              isSheet={true}
              onClose={() => setShowComments(false)}
            />
          )}
        </div>
      )}
    </div>
  )
}
