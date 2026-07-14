/**
 * FeedCard — single Play-List feed post.
 *
 * Shows: avatar/archetype, day badge, photo, caption, scary/wahoo pills,
 * reaction row. Click reaction toggles via parent hook.
 */
import './FeedCard.css'

const REACTIONS = [
  { type: 'cheer', icon: '🎉' },
  { type: 'fire', icon: '🔥' },
  { type: 'clap', icon: '👏' },
  { type: 'heart', icon: '💜' },
]

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString()
}

export default function FeedCard({ post, userReactions = new Set(), onReact, isAnon }) {
  const initials = (post.display_name || 'P').slice(0, 1).toUpperCase()

  return (
    <article className="pfc-card">
      <header className="pfc-header">
        <div className="pfc-avatar">
          {post.hero_avatar_url ? (
            <img src={post.hero_avatar_url} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="pfc-meta">
          <div className="pfc-name">
            {post.display_name || 'A Play-List player'}
          </div>
          <div className="pfc-sub">
            {post.essence_archetype && <span>{post.essence_archetype}</span>}
            {post.essence_archetype && ' · '}
            <span>{timeAgo(post.created_at)}</span>
          </div>
        </div>
        {post.day_number != null && (
          <div className="pfc-day-badge">Day {post.day_number}</div>
        )}
      </header>

      <div className="pfc-media-wrap">
        <img
          src={post.media_url}
          alt={post.caption || post.challenge_title || 'Play-List win'}
          className="pfc-media"
          loading="lazy"
        />
      </div>

      <div className="pfc-body">
        {post.challenge_title && (
          <div className="pfc-challenge">
            {post.visibility_layer && (
              <span className="pfc-layer-pill">{post.visibility_layer}</span>
            )}
            <span className="pfc-challenge-title">{post.challenge_title}</span>
          </div>
        )}

        {post.caption && <p className="pfc-caption">{post.caption}</p>}

        <div className="pfc-reactions">
          {REACTIONS.map(({ type, icon }) => {
            const count = post.reaction_counts?.[type] || 0
            const active = userReactions.has?.(type)
            return (
              <button
                key={type}
                type="button"
                className={`pfc-reaction ${active ? 'active' : ''}`}
                onClick={() => onReact?.(post.id, type)}
                disabled={isAnon}
                aria-label={type}
              >
                <span className="pfc-reaction-icon">{icon}</span>
                {count > 0 && <span className="pfc-reaction-count">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </article>
  )
}
