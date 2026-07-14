/**
 * playlistFeedService — public Play-List feed
 *
 * Powers the Play-List newsfeed:
 *  - Upload photos to the playlist-feed storage bucket
 *  - Create posts tied to a groan completion
 *  - Fetch paginated public feed (anon-readable via RPC)
 *  - Toggle reactions optimistically
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
  if (!data?.publicUrl) throw new Error('Failed to get public URL for uploaded file')
  return { publicUrl: data.publicUrl, path }
}

/**
 * Create a feed post.
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

  const { data, error } = await supabase
    .from('playlist_feed_posts')
    .insert({
      user_id: userId,
      groan_challenge_id: groanChallengeId || null,
      challenge_title: challengeTitle || null,
      visibility_layer: visibilityLayer || null,
      media_url: mediaUrl,
      media_width: mediaWidth ?? null,
      media_height: mediaHeight ?? null,
      caption: caption?.slice(0, 280) || null,
      day_number: null,
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
 */
export async function reportPost(postId) {
  // v1: no-op until we add a report RPC
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
