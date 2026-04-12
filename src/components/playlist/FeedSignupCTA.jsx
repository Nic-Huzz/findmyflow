/**
 * FeedSignupCTA — inline conversion card injected into the public feed.
 *
 * Shown to anonymous viewers every N posts. Purpose: turn passive feed
 * scrolling into the first step of discovering their own Play-List.
 */
import './FeedSignupCTA.css'

export default function FeedSignupCTA() {
  return (
    <div className="pfsc-card">
      <div className="pfsc-eyebrow">100-Day Play-List Challenge</div>
      <h3 className="pfsc-title">Find out what you're built for.</h3>
      <p className="pfsc-body">
        Every post here is from someone discovering their Play-List, the courage
        challenges that turn who they really are into action. Your turn.
      </p>
      <a href="/log-in" className="pfsc-btn">Start your 100 days</a>
    </div>
  )
}
