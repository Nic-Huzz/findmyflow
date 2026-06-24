# Content Draft Editing - Design

## Problem
OpenClaw sends markdown drafts to `/content-review`, but users can only read them. No way to refine content before hitting Send.

## Solution
Toggle edit mode in MarkdownViewer with autosave and version history.

## Changes

### 1. MarkdownViewer.jsx - Toggle Edit Mode
- Add `editing` state. When true, replace `ReactMarkdown` with a `<textarea>` showing raw markdown.
- Header gets Edit/Preview toggle button.
- Title becomes editable `<input>` in edit mode.
- Comment highlighting disabled while editing (offsets would be stale).

### 2. Autosave
- Debounced save 2 seconds after user stops typing.
- Small "Saving..." / "Saved" indicator in the viewer header.
- Only saves when content actually changed from last saved version.
- Each save creates a version history entry.

### 3. Version History
- New `content_draft_versions` table: `id`, `draft_id`, `title`, `body_markdown`, `created_at`.
- Created on each autosave where content differs from previous version.
- Capped at 50 versions per draft (auto-prune oldest on insert).
- "History" button in viewer header opens a side panel (replaces comments panel) showing version timestamps.
- Click a version to preview it. "Restore" button reverts the draft to that version.

### 4. contentReviewService.js
- `updateDraft(draftId, { body_markdown, title })` - saves changes to `content_drafts`.
- `createVersion(draftId, { body_markdown, title })` - inserts into `content_draft_versions`.
- `fetchVersions(draftId)` - fetches version list (id, title, created_at) ordered by created_at desc.
- `fetchVersion(versionId)` - fetches full version body.
- `pruneVersions(draftId, maxVersions)` - deletes oldest versions beyond cap.

### 5. ContentReview.css
- Textarea styling: match viewer area (same padding, font size, monospace font, full height).
- Edit/Preview toggle button styling.
- Save indicator styling.
- Version history panel styling.

## Files to Create/Modify
- `src/components/content-review/MarkdownViewer.jsx` (modify)
- `src/lib/contentReviewService.js` (modify)
- `src/pages/ContentReview.jsx` (modify)
- `src/pages/ContentReview.css` (modify)
- `supabase/migrations/XXXXXXXX_content_draft_versions.sql` (create)

## Not Included
- Markdown toolbar (bold, italic, etc.)
- Collaborative editing
- Diff view between versions
