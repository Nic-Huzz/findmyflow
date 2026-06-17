# Brand Pulse Post Tagging — Spec

## What

Tap the Brand Pulse card to open a full post gallery showing all synced Instagram posts. Each post can be tagged as:
- **Experience promotion** — linked to a specific experience in `/create/experience/:id`
- **Brand building** — general brand content not tied to a specific experience

This connects Brand Pulse (growth metric) to the Experience Pipeline (Attract node) and provides a clear view of what content is serving what purpose.

## Current State

- `InstagramPostSelector.jsx` already exists as a bottom sheet for tagging posts to experiences (built this session)
- It's currently accessible from the Attract node in `PipelineNodeDetail.jsx`
- `instagram_posts.experience_id` is the only tag — null means untagged
- No "brand building" category exists in the schema
- Brand Pulse card is not tappable — it's display only

## What Needs Building

### 1. Schema Change
Add a `content_purpose` column to `instagram_posts`:
```sql
ALTER TABLE instagram_posts 
ADD COLUMN content_purpose TEXT DEFAULT NULL 
CHECK (content_purpose IN ('experience', 'brand', NULL));
```
- `experience` = promoting a specific experience (experience_id is set)
- `brand` = brand building content (experience_id is null)
- `NULL` = untagged

### 2. Post Gallery Page/Modal
A new page or full-screen modal accessible by tapping Brand Pulse card.

```
┌─────────────────────────────────────┐
│  Your Content              ✕ Close  │
│                                     │
│  Filter: [All] [Experience] [Brand] │
│          [Untagged]                 │
│                                     │
│  ┌──────┐ "40/100 Vibe Rise..."     │
│  │ 📷   │  Carousel · Jun 15        │
│  │      │  287 reach · 17 likes     │
│  └──────┘  [🏷 Brand building]      │
│                                     │
│  ┌──────┐ "Breathwork retreat..."   │
│  │ 🎬   │  Reel · Jun 12            │
│  │      │  664 reach · 38 likes     │
│  └──────┘  [🎪 Tuk Tuk Tournament]  │
│                                     │
│  ┌──────┐ "Day 37/100..."           │
│  │ 📷   │  Carousel · Jun 13        │
│  │      │  20,977 reach · 87 likes  │
│  └──────┘  [Untagged — tap to tag]  │
│                                     │
└─────────────────────────────────────┘
```

Tapping a tag opens a selector:
- List of active/upcoming experiences from `experiences` table
- "Brand building" option
- "Remove tag" option

### 3. Brand Pulse Card Tap Handler
Make the Brand Pulse card tappable → navigates to `/create/content` or opens the post gallery modal.

### 4. Attract Node Integration
The existing `InstagramPostSelector` already tags posts to experiences. The post gallery is a superset — it shows ALL posts and lets you tag from a central place. The Attract node's "Tag Posts" button can link to the same gallery, filtered to that experience.

### 5. Analytics View
Below the post list, show summary:
- X posts promoting experiences (total reach)
- X posts building brand (total reach)
- X posts untagged

## How It Feeds the System

| Tagged As | Feeds Into |
|-----------|-----------|
| Experience promotion | Attract node reach for that experience |
| Brand building | Brand Pulse score (consistent posting) |
| Untagged | Nothing — nudge to tag |

## Implementation Estimate
- Schema migration: 10 min
- Post gallery component: 2-3 hours
- Brand Pulse tap handler: 15 min
- Attract node filter link: 30 min
- Total: ~3-4 hours
