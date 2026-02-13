import { supabase } from './supabaseClient'

// ===== DRAFTS =====

export async function fetchDrafts() {
  const { data, error } = await supabase
    .from('content_drafts')
    .select('id, title, status, project, created_by, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchDraftWithComments(draftId) {
  const [draftResult, commentsResult] = await Promise.all([
    supabase
      .from('content_drafts')
      .select('*')
      .eq('id', draftId)
      .single(),
    supabase
      .from('content_comments')
      .select('*')
      .eq('draft_id', draftId)
      .order('start_offset', { ascending: true })
  ])

  if (draftResult.error) throw draftResult.error
  if (commentsResult.error) throw commentsResult.error

  return {
    draft: draftResult.data,
    comments: commentsResult.data
  }
}

export async function fetchCommentCounts() {
  // Get comment counts per draft for sidebar badges.
  // Only selects the two columns needed to minimize data transfer.
  const { data, error } = await supabase
    .from('content_comments')
    .select('draft_id, status')

  if (error) throw error

  const counts = {}
  for (const c of data) {
    if (!counts[c.draft_id]) counts[c.draft_id] = { total: 0, pending: 0 }
    counts[c.draft_id].total++
    if (c.status === 'pending') counts[c.draft_id].pending++
  }
  return counts
}

// ===== COMMENTS =====

export async function createComment({ draftId, highlightedText, startOffset, endOffset, comment, quickReaction, category }) {
  const { data, error } = await supabase
    .from('content_comments')
    .insert({
      draft_id: draftId,
      highlighted_text: highlightedText,
      start_offset: startOffset,
      end_offset: endOffset,
      comment,
      quick_reaction: quickReaction,
      category,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCommentStatus(commentId, status, resolvedText = null) {
  const updates = { status }
  if (status === 'resolved') {
    updates.resolved_at = new Date().toISOString()
    if (resolvedText) updates.resolved_text = resolvedText
  }

  const { data, error } = await supabase
    .from('content_comments')
    .update(updates)
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ===== VOICE CONFIG =====

export async function fetchVoiceConfig() {
  const { data, error } = await supabase
    .from('voice_taste_config')
    .select('*')
    .is('owner_id', null)  // Phase 1: Huzz only
    .maybeSingle()

  if (error) throw error
  return data // null if no row exists
}

export async function updateVoiceConfig(id, updates) {
  const { data, error } = await supabase
    .from('voice_taste_config')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}
