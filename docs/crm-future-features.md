# CRM Future Features

## Priority 1: AI Screenshot Deal Capture

### Overview
Upload screenshots of DM conversations, emails, or messages and let AI automatically extract deal details to create or update deals.

### User Flow
1. User clicks "Add Deal" or "Update from Screenshot" button
2. Camera/file picker opens (mobile: camera option, desktop: file upload)
3. User uploads screenshot of conversation
4. AI (Claude Vision) analyzes the image and extracts:
   - Contact name
   - Contact email (if visible)
   - Product interest / deal type
   - Estimated value
   - Key conversation points for notes
   - Suggested deal stage based on conversation tone
5. User reviews extracted data, makes edits if needed
6. Deal is created/updated with AI-extracted info

### Technical Requirements
- **Frontend**: File input with camera capture support (`accept="image/*" capture="environment"`)
- **Backend**: Supabase Edge Function with Claude Vision API
- **Storage**: Supabase Storage bucket for screenshots
- **Database**: `conversation_screenshot_url` column already exists in `sales_deals`

### AI Prompt Strategy
```
Analyze this screenshot of a sales conversation. Extract:
1. Contact name (look for names, signatures, profile pics)
2. Email/contact info (if visible)
3. What product/service they're interested in
4. Their level of interest (cold/warm/hot)
5. Key pain points mentioned
6. Any pricing discussed
7. Urgency indicators

Return as JSON for easy parsing.
```

### Edge Cases to Handle
- Multiple people in conversation
- Partial screenshots
- Non-English text
- Blurry/low quality images
- Screenshots with sensitive info (credit cards, etc.) - reject these

### MVP Scope
- Single image upload
- Create new deal only (update later)
- Basic field extraction (name, notes, suggested stage)

### Future Enhancements
- Multi-image upload for conversation threads
- "Match to existing deal" suggestions
- Auto-detect platform (Instagram, WhatsApp, Email, etc.)
- Sentiment analysis for lead scoring

---

## Priority 2: Quick Improvements (20% Better)

### 2.1 Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Esc` | Close any open modal |
| `N` | New deal (when no modal open) |
| `1-4` | Filter by stage (Lead/Discovery/Proposal/Won) |
| `/` | Focus search |

**Effort**: Low | **Impact**: Medium

### 2.2 Error Toast Notifications
- Show success/error toasts for all API operations
- Use existing toast system or add lightweight solution
- Include retry button for failed operations

**Effort**: Low | **Impact**: High

### 2.3 Lazy Load Scripts Modal
- Code-split ScriptsModal component
- Only load when user clicks "Scripts" button
- Reduces initial bundle size

**Effort**: Medium | **Impact**: Medium

### 2.4 Optimistic UI Updates
- Update UI immediately before API confirms
- Rollback on error
- Makes app feel instant

**Effort**: Medium | **Impact**: High

### 2.5 Script Favorites
- Let users star frequently used scripts
- Show favorites at top of Scripts modal
- Store in localStorage or database

**Effort**: Medium | **Impact**: Medium

### 2.6 Mobile Swipe Actions
- Swipe right on deal card to advance stage
- Swipe left to move back or mark lost
- Haptic feedback on actions

**Effort**: High | **Impact**: High

---

## Priority 3: CRM Enhancements

### 3.1 Deal Search & Filter
- Search by contact name, email, notes
- Filter by date range
- Filter by value range
- Filter by source

### 3.2 Bulk Actions
- Select multiple deals
- Bulk move to stage
- Bulk delete
- Bulk export to CSV

### 3.3 Deal Activity Timeline
- Log all interactions with a deal
- Notes, emails, calls, meetings
- Automatic stage change logging

### 3.4 Email Integration
- Connect email account
- Auto-log email conversations
- Send emails from within CRM

### 3.5 Reminders & Follow-ups
- Set follow-up reminders on deals
- Push notifications for due follow-ups
- "Stale deal" alerts (no activity in X days)

### 3.6 Pipeline Analytics
- Conversion rates by stage
- Average time in each stage
- Revenue forecasting
- Win/loss analysis by source

### 3.7 Contact Database
- Separate contacts from deals
- Multiple deals per contact
- Contact history across deals

---

## Priority 4: Integrations

### 4.1 Calendar Sync
- Sync with Google Calendar
- Auto-create events for expected close dates
- Meeting scheduling links

### 4.2 Social Media
- LinkedIn profile lookup
- Instagram DM integration
- Twitter/X conversation import

### 4.3 Payment Processing
- Stripe integration
- Auto-mark as "Won" when paid
- Payment link generation

### 4.4 Zapier/Make
- Webhook triggers for deal events
- Connect to 1000+ apps
- Automated workflows

---

## Implementation Notes

### Database Schema Ready
The `sales_deals` table already has:
- `conversation_screenshot_url` - Ready for screenshot feature
- PTUF scoring columns - Already implemented
- All core deal fields

### API Keys Needed
- Anthropic API key (already have for Zarlo)
- Need to enable Claude Vision in edge functions

### Storage Setup
```sql
-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('deal-screenshots', 'deal-screenshots', false);

-- RLS policy for user access
CREATE POLICY "Users can upload own screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'deal-screenshots' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Prioritization Matrix

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| AI Screenshot Capture | High | Very High | P1 |
| Keyboard Shortcuts | Low | Medium | P2 |
| Error Toasts | Low | High | P2 |
| Optimistic Updates | Medium | High | P2 |
| Script Favorites | Medium | Medium | P3 |
| Mobile Swipe | High | High | P3 |
| Deal Search | Medium | High | P3 |
| Pipeline Analytics | High | High | P4 |
| Email Integration | Very High | Very High | P4 |
