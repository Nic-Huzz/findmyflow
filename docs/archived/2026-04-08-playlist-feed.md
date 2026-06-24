# Play-List Feed — 100-Day Challenge Newsfeed

**Status:** Built, unverified in browser. Migration not yet applied.
**Date:** 2026-04-08
**Purpose:** Drive virality for the 100-Day Play-List Challenge by letting users share photo wins from groan completions to a public newsfeed.

---

## Why this exists

Nic is launching a 100-Day Play-List Challenge to drive new signups. The hook: every time a user completes a groan challenge they can attach a photo, which posts to a public feed (`/play-list-feed`) anyone — including anonymous viewers — can scroll. Anon viewers see periodic conversion CTAs to start their own 100 days. The "Day N of 100" badge on every post is the key social-proof framing.

## Architectural decisions (locked)

1. **Public, anon-readable feed** — not gated to logged-in users. The whole point is virality.
2. **App-wide enrollment, not a forked Fantasy League.** A new tiny `playlist_100_enrollments` table tracks per-user start date so the feed can show "Day 47/100" badges. Did NOT extend Fantasy League — leagues are private and scoped, this is public and global.
3. **New tables, not extending `league_content_submissions`.** That table is hard-gated to league members via RLS + RPC. Loosening it would risk the existing private league system. Cleaner to clone the reaction pattern into `playlist_feed_*` tables.
4. **Photos only for v1.** No video. Reduces complexity (no transcoding, thumbnails, file size battles).
5. **Capture step lives at the END of `GroanCompletionModal`** — after compass check-in, before close. Celebration framing, not mid-flow friction. User can always skip.
6. **First share auto-enrolls** the user in the 100-day challenge silently. No separate enrollment screen yet.

## Files added

### Migration
- `supabase/migrations/20260408010000_playlist_feed.sql`
  - `playlist_100_enrollments` (user_id PK, started_at, goal_days, timezone)
  - `playlist_feed_posts` (the post itself, denormalizes display_name, hero_avatar, day_number)
  - `playlist_feed_reactions` (cheer/fire/clap/heart)
  - Trigger `update_playlist_feed_reaction_counts` keeps `posts.reaction_counts` JSONB in sync
  - RPC `get_playlist_feed(limit, offset)` — `SECURITY DEFINER`, anon-callable, returns approved public posts only
  - Storage bucket `playlist-feed` (5MB, image MIME types incl HEIC), public read, owner write
  - RLS: public can SELECT approved+public posts; owners SELECT/INSERT/UPDATE/DELETE own; admins SELECT/UPDATE all (via existing `admin_users` table)

### Service layer
- `src/lib/playlistFeedService.js`
  - `uploadFeedMedia(userId, file)` → `{ publicUrl, path }`
  - `createFeedPost({ userId, groanChallengeId, ... })` — auto-enrolls, computes `day_number`
  - `fetchFeed({ limit, offset })` — calls `get_playlist_feed` RPC
  - `toggleReaction(postId, userId, reactionType)` — returns `'added' | 'removed'`
  - `getUserReactionsForPosts(userId, postIds)` → `{ [postId]: Set<reactionType> }`
  - `getEnrollment(userId)`, `ensureEnrolled(userId)`, `computeDayNumber(startedAt)`
  - `fetchPostEnrichment(userId)` → `{ displayName, heroAvatarUrl, essenceArchetype }`
  - `reportPost(postId)` — **STUB** — needs backend implementation

### React hook
- `src/hooks/usePlaylistFeed.js`
  - Mirror of `useNewsfeed.js` shape
  - `{ items, loading, loadingMore, hasMore, error, refresh, loadMore, userReactions, toggleReaction }`
  - Optimistic reactions with rollback on persist failure
  - `currentUserId` argument — pass `null` for anon viewers; `toggleReaction` no-ops for anon

### Components
- `src/components/playlist/ShareWinStep.jsx` + `.css`
  - New step inserted at the end of `GroanCompletionModal`
  - Photo picker (`<input type="file" accept="image/*" capture="environment">`), 140-char caption, share/skip
  - Skipping returns control to existing `onComplete` flow unchanged
  - Cleans up blob URLs on unmount/replace
- `src/components/playlist/FeedCard.jsx` + `.css`
  - Single post card: avatar, name, archetype, time-ago, Day N badge, photo, challenge title + layer pill, caption, scary/wahoo pills, 4 reaction buttons
  - `disabled={isAnon}` on reactions for anon viewers
- `src/components/playlist/FeedSignupCTA.jsx` + `.css`
  - Inline conversion card injected into the feed every 5 posts for anon viewers only
  - Links to `/log-in`

### Pages
- `src/pages/PlaylistFeed.jsx` + `.css`
  - The public feed at `/play-list-feed`
  - Infinite scroll via `IntersectionObserver` on a sentinel ref
  - Hero header with anon-only CTA
  - Empty/loading/error states
- `src/pages/PlaylistFeedAdmin.jsx` + `.css`
  - Moderation queue at `/admin/play-list-feed` (also `/admin/playlist-feed`)
  - Tabs: Pending / Flagged / Approved / Removed
  - Approve / Remove actions write directly to `playlist_feed_posts.moderation_status` (admin RLS policy permits)
  - Client-side admin check via `admin_users` lookup before rendering

## Files modified

- `src/components/GroanCompletionModal.jsx`
  - Imports `ShareWinStep`
  - Adds `'share'` to the step state machine
  - `handleCompassComplete` now `setStep('share')` instead of closing
  - `CompassCheckin onSkip` advances to `'share'`
  - New `handleShareDone({ shared })` — fires confetti if shared, then `onComplete()` + `onClose()`

- `src/AppRouter.jsx`
  - New lazy imports: `PlaylistFeed`, `PlaylistFeedAdmin`
  - Routes added: `/play-list-feed`, `/play-list-feed/:postId` (public, no AuthGate); `/admin/play-list-feed`, `/admin/playlist-feed` (AuthGate)
  - CSS imports: `pages/PlaylistFeed.css`, `pages/PlaylistFeedAdmin.css`
  - `ConditionalBottomToolbar` hides toolbar on `/play-list-feed*` so anon page stays clean

## How to deploy

```bash
# 1. Apply the migration
npm run db:push

# 2. Confirm storage bucket created
# Supabase dashboard → Storage → playlist-feed should exist

# 3. Build (already verified clean)
npm run build

# 4. Add yourself to admin_users if not already, then visit /admin/play-list-feed
```

## How to test the full flow

1. Log in.
2. Go to `/7-day-challenge`, accept a groan challenge from the Play-List tab.
3. Click "I Did It!" → fill reflection (scary/wahoo + 3% better) → Continue.
4. Voice check-in → Continue or Skip.
5. Compass check-in → pick direction or Skip.
6. **New step:** "Share your win?" — pick a photo, optionally caption, click "Share Win".
7. Confetti fires. Modal closes.
8. Visit `/play-list-feed` (works in incognito too) — your post should be there with "Day 1" badge.
9. React on the post — count should update optimistically.
10. As admin, visit `/admin/play-list-feed` — switch tabs to Approved to see the post; try Remove.

## Known issues / limitations / TODOs

### Won't ship without (do these before public launch)
- **No NSFW pre-screen on uploads.** Anyone can upload anything to a public feed. Add a client-side classifier or an edge function NSFW check that flips bad uploads to `pending` automatically. Free options: NSFW.js client-side, or Cloudflare/Replicate API server-side.
- **No Report button on FeedCard.** `reportPost` in the service is a stub. Wire a UI button + a small RPC or edge function that flips moderation_status to `pending`. RLS as written would let any authenticated user UPDATE another user's post if we add a permissive policy — better to use SECURITY DEFINER RPC: `report_playlist_post(post_id)` that only sets status to `pending`.

### Should fix soon
- **`fetchPostEnrichment.essenceArchetype` is hardcoded `null`.** Reason: `lead_flow_profiles.essence_archetype` only exists in `Sql commands/` (unapplied). Pick a canonical source (`founder_dna_results.archetype`? a new column on `user_stage_progress`? the latest essence mirror result?) and wire it. The post column already exists and is rendered by `FeedCard`.
- **Day counter timezone.** `computeDayNumber` uses UTC ms diff. The `enrollments.timezone` column is captured but unused. For users in non-UTC zones, "Day 2" might tick a few hours early or late. Fix: compute using the stored timezone via Intl.DateTimeFormat parts.
- **No discoverability for logged-in users.** The bottom toolbar already has 4 items (Home, Let's Play, Profile, Business) and is full. The feed is reachable by URL only. Options:
  1. Add a "View Feed" button to the Play-List tab header inside `Challenge.jsx`
  2. Replace one toolbar item (UX call — needs Nic's input)
  3. Add a banner on `/me` during the 100-day promo period
- **`/play-list-feed/:postId` route exists but renders the same feed.** No single-post detail view yet. Needed for shareable post links + OG meta tags. Implement as either:
  - A modal on the same page when `postId` param present
  - A separate `PlaylistFeedPost.jsx` page that fetches one post + renders OG meta tags
- **OG meta tags for shared post URLs.** Without these, sharing a post on social gives no preview. Either SSR via Vercel edge function or static `og:image` fallback per post.

### Minor / nice-to-have
- **Image resize/compression on upload.** Currently 5MB hard limit but no client-side resize. A 12MP iPhone photo is ~3-5MB. Adding client-side resize to ~1920px max would shave bandwidth and storage cost ~70%.
- **HEIC handling.** Bucket allows `image/heic` and `image/heif` MIMEs but most browsers can't render them in `<img>`. Either reject HEIC client-side and ask for JPEG, or convert client-side via `heic2any` lib.
- **Real-time feed updates.** Could use Supabase realtime subscription on `playlist_feed_posts` to pop new posts in live. Skipped for v1.
- **Top-of-feed live counter.** "X people on Day N, Y wins shared this week" — would help social proof. Needs an RPC + cached count.
- **Anonymous posting.** Currently every post is tied to `auth.users.id`. No anonymous mode. Privacy-conscious users may want to post without their name shown.
- **Caption length mismatch.** `ShareWinStep` enforces 140 chars; the DB CHECK is 280. Either change one. Frontend is the safer place to enforce since DB is the floor.

### Schema notes for the next migration if needed
```sql
-- If essence_archetype source picked, denormalize on insert via service:
-- (no schema change needed, column already exists on playlist_feed_posts)

-- If anonymous mode wanted:
ALTER TABLE playlist_feed_posts ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;
-- Then in feed rendering, hide display_name/avatar when is_anonymous

-- For report system (recommended approach):
CREATE OR REPLACE FUNCTION report_playlist_post(p_post_id UUID)
RETURNS VOID AS $$
  UPDATE playlist_feed_posts
  SET moderation_status = 'pending'
  WHERE id = p_post_id AND moderation_status = 'approved';
$$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION report_playlist_post(UUID) TO authenticated;
```

## Bugs found and fixed during implementation

1. **RLS public select policy included `'pending'` status** — would have leaked unmoderated posts to all viewers. Fixed to `'approved'` only.
2. **`URL.createObjectURL` blob URLs not revoked** in `ShareWinStep` — minor memory leak. Added cleanup useEffect + revoke on replace.
3. **`fetchPostEnrichment` queried `lead_flow_profiles.essence_archetype`** which doesn't exist in any applied migration. Removed the column from the query and hardcoded `essenceArchetype: null` until a canonical source is picked.

## Files at a glance

```
supabase/migrations/
  20260408010000_playlist_feed.sql              [NEW]

src/lib/
  playlistFeedService.js                        [NEW]

src/hooks/
  usePlaylistFeed.js                            [NEW]

src/components/playlist/                        [NEW DIR]
  ShareWinStep.jsx + .css
  FeedCard.jsx + .css
  FeedSignupCTA.jsx + .css

src/components/
  GroanCompletionModal.jsx                      [MODIFIED — added share step]

src/pages/
  PlaylistFeed.jsx + .css                       [NEW]
  PlaylistFeedAdmin.jsx + .css                  [NEW]

src/AppRouter.jsx                               [MODIFIED — routes + imports + toolbar hide]
```

## Confidence

**85%** that the build is correct as written. **0%** that it's been tested in a real browser end-to-end. Migration has not been applied. First test should be a local `npm run db:push` against a branch DB, then a manual run-through of the test flow above.
