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

// ===== DRAFT EDITING =====

export async function updateDraft(draftId, { body_markdown, title }) {
  const updates = { updated_at: new Date().toISOString() }
  if (body_markdown !== undefined) updates.body_markdown = body_markdown
  if (title !== undefined) updates.title = title

  const { data, error } = await supabase
    .from('content_drafts')
    .update(updates)
    .eq('id', draftId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ===== VERSION HISTORY =====

const MAX_VERSIONS = 50

export async function createVersion(draftId, { body_markdown, title }) {
  const { data, error } = await supabase
    .from('content_draft_versions')
    .insert({ draft_id: draftId, body_markdown, title })
    .select('id')
    .single()

  if (error) throw error

  // Prune old versions beyond cap (fire and forget)
  pruneVersions(draftId).catch(err => console.error('Version prune failed:', err))

  return data
}

export async function fetchVersions(draftId) {
  const { data, error } = await supabase
    .from('content_draft_versions')
    .select('id, title, created_at')
    .eq('draft_id', draftId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchVersion(versionId) {
  const { data, error } = await supabase
    .from('content_draft_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (error) throw error
  return data
}

async function pruneVersions(draftId) {
  const { data } = await supabase
    .from('content_draft_versions')
    .select('id')
    .eq('draft_id', draftId)
    .order('created_at', { ascending: false })

  if (!data || data.length <= MAX_VERSIONS) return

  const idsToDelete = data.slice(MAX_VERSIONS).map(v => v.id)
  await supabase
    .from('content_draft_versions')
    .delete()
    .in('id', idsToDelete)
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

// ===== IMAGE UPLOAD =====

export async function uploadContentImage(file) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('content-images')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('content-images')
    .getPublicUrl(fileName)

  return publicUrl
}

// ===== VOICE PROFILE =====

export async function fetchVoiceProfileForDashboard() {
  // Phase 1: single-user — fetch the logged-in user's voice profile directly
  // (admin_users table has service_role-only RLS, so we use auth.uid() instead)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('voice_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) throw error
  return data
}
