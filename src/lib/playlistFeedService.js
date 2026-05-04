/**
 * playlistFeedService — public Play-List feed
 *
 * Powers the 100-day Play-List Challenge newsfeed:
 *  - Upload photos to the playlist-feed storage bucket
 *  - Create posts tied to a groan completion
 *  - Fetch paginated public feed (anon-readable via RPC)
 *  - Toggle reactions optimistically
 *  - Enrol users into the 100-day challenge on first share
 */
import { supabase } from './supabaseClient'

const BUCKET = 'playlist-feed'

/**
 * Upload an image file to the playlist-feed bucket.
 * Returns { publicUrl, path } or throws.
 */
export async function uploadFeedMedia(userId, file) {
  if (!userId) throw new Error('userId required')
  if (!file) throw new Error('file required')

  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const path = `${userId}/${filename}`

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { publicUrl: data.publicUrl, path }
}

/**
 * Get user's 100-day enrolment row, or null if not enrolled.
 */
export async function getEnrollment(userId) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('playlist_100_enrollments')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) {
    console.warn('getEnrollment error:', error)
    return null
  }
  return data
}

/**
 * Enrol the user in the 100-day challenge if they aren't already.
 * Returns the enrolment row.
 */
export async function ensureEnrolled(userId) {
  if (!userId) throw new Error('userId required')
  const existing = await getEnrollment(userId)
  if (existing) return existing

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
  const { data, error } = await supabase
    .from('playlist_100_enrollments')
    .insert({ user_id: userId, timezone: tz })
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Compute day_number (1-indexed) from started_at.
 */
export function computeDayNumber(startedAt) {
  if (!startedAt) return 1
  const start = new Date(startedAt).getTime()
  const now = Date.now()
  const days = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return Math.max(1, days + 1)
}

/**
 * Create a feed post. Auto-enrols the user on their first post.
 * `enrichment` carries denormalized profile fields so the feed query stays cheap.
 */
export async function createFeedPost({
  userId,
  groanChallengeId,
  challengeTitle,
  visibilityLayer,
  beforeState,
  afterState,
  mediaUrl,
  mediaWidth,
  mediaHeight,
  caption,
  enrichment = {},
}) {
  if (!userId) throw new Error('userId required')
  if (!mediaUrl) throw new Error('mediaUrl required')

  const enrollment = await ensureEnrolled(userId)
  const dayNumber = computeDayNumber(enrollment.started_at)

  const { data, error } = await supabase
    .from('playlist_feed_posts')
    .insert({
      user_id: userId,
      groan_challenge_id: groanChallengeId || null,
      challenge_title: challengeTitle || null,
      visibility_layer: visibilityLayer || null,
      scary_score: null,
      wahoo_score: null,
      media_url: mediaUrl,
      media_width: mediaWidth ?? null,
      media_height: mediaHeight ?? null,
      caption: caption?.slice(0, 280) || null,
      day_number: dayNumber,
      display_name: enrichment.displayName || null,
      essence_archetype: enrichment.essenceArchetype || null,
      hero_avatar_url: enrichment.heroAvatarUrl || null,
      visibility: 'public',
      moderation_status: 'approved',
    })
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Fetch a page of the public feed via SECURITY DEFINER RPC (works for anon).
 */
export async function fetchFeed({ limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase.rpc('get_playlist_feed', {
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw error
  return data || []
}

/**
 * Toggle a reaction on a post. Returns the new state ('added' | 'removed').
 * Caller is responsible for optimistic UI update; this only persists.
 */
export async function toggleReaction(postId, userId, reactionType) {
  if (!postId || !userId) throw new Error('postId and userId required')

  const { data: existing } = await supabase
    .from('playlist_feed_reactions')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('playlist_feed_reactions')
      .delete()
      .eq('id', existing.id)
    if (error) throw error
    return 'removed'
  }

  const { error } = await supabase
    .from('playlist_feed_reactions')
    .insert({ post_id: postId, user_id: userId, reaction_type: reactionType })
  if (error) throw error
  return 'added'
}

/**
 * Fetch the set of reaction types this user has placed on a list of posts.
 * Returns { [postId]: Set<'cheer'|...> }
 */
export async function getUserReactionsForPosts(userId, postIds) {
  if (!userId || !postIds?.length) return {}
  const { data, error } = await supabase
    .from('playlist_feed_reactions')
    .select('post_id, reaction_type')
    .eq('user_id', userId)
    .in('post_id', postIds)
  if (error) {
    console.warn('getUserReactionsForPosts error:', error)
    return {}
  }
  const map = {}
  data.forEach(r => {
    if (!map[r.post_id]) map[r.post_id] = new Set()
    map[r.post_id].add(r.reaction_type)
  })
  return map
}

/**
 * Report a post — flips moderation_status to 'pending' so it disappears
 * from the public feed until an admin reviews it.
 * Note: relies on the owner-update policy being permissive enough OR
 * a future admin RPC. For v1 we just call an edge function or skip.
 */
export async function reportPost(postId) {
  // v1: no-op until we add a report RPC. Wire UI now, finish backend in moderation pass.
  console.log('reportPost queued for', postId)
  return { ok: true }
}

/**
 * Fetch denormalization fields for a user (display name, essence, avatar).
 * Best-effort — returns {} if anything fails.
 */
export async function fetchPostEnrichment(userId) {
  if (!userId) return {}
  try {
    const [{ data: lfp }, { data: usp }] = await Promise.all([
      supabase
        .from('lead_flow_profiles')
        .select('user_name')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_stage_progress')
        .select('hero_avatar_url')
        .eq('user_id', userId)
        .maybeSingle(),
    ])
    // essence_archetype is not yet on any base table — left null until we
    // pick a canonical source. founder_dna_results.archetype could work too.
    return {
      displayName: lfp?.user_name || null,
      heroAvatarUrl: usp?.hero_avatar_url || null,
      essenceArchetype: null,
    }
  } catch (e) {
    console.warn('fetchPostEnrichment error:', e)
    return {}
  }
}
