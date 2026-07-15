import { supabase } from './supabaseClient'

/**
 * Post an auto event to the community feed.
 * Uses ON CONFLICT DO NOTHING for deduplication — safe to call multiple times.
 */
export async function postFeedEvent(userId, eventType, title, subtitle = null, metadata = null) {
  await supabase
    .from('community_feed')
    .insert({
      user_id: userId,
      event_type: eventType,
      title,
      subtitle,
      metadata,
    })
    .then(() => {}) // Silent success
    .catch(() => {}) // Silent fail (dedup constraint or any error — feed events are best-effort)
}

/**
 * Post a shared wahoo (opt-in, from ShareWinStep).
 */
export async function postSharedWahoo(userId, title, caption, imageUrl = null) {
  return supabase
    .from('community_feed')
    .insert({
      user_id: userId,
      event_type: 'shared_wahoo',
      title,
      subtitle: caption,
      image_url: imageUrl,
    })
}

/**
 * Fetch the community feed (paginated).
 */
export async function fetchFeed(offset = 0, limit = 20) {
  return supabase
    .from('community_feed')
    .select('*, reactions:community_feed_reactions(reaction_type, user_id)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
}

/**
 * Toggle a reaction on a feed item.
 */
export async function toggleFeedReaction(feedItemId, userId, reactionType) {
  // Check if exists
  const { data: existing } = await supabase
    .from('community_feed_reactions')
    .select('id')
    .eq('feed_item_id', feedItemId)
    .eq('user_id', userId)
    .eq('reaction_type', reactionType)
    .maybeSingle()

  if (existing) {
    await supabase.from('community_feed_reactions').delete().eq('id', existing.id)
    return false // removed
  } else {
    await supabase.from('community_feed_reactions').insert({
      feed_item_id: feedItemId,
      user_id: userId,
      reaction_type: reactionType,
    })
    return true // added
  }
}
