# Thought Notes Sync Workflow

*Pull new #thoughts entries from Apple Notes → categorize → add to Obsidian vault → add to book deck*

## The Pipeline

```
Apple Notes → Hook scans → /tmp/thought-sync-latest.txt → Agent notifies → Claude categorizes → Huzz confirms → Write to Obsidian + book deck
```

### Step 1: Hook scans Apple Notes
- Automatic scan finds new `#thoughts` tagged entries
- Writes raw entries with dates to `/tmp/thought-sync-latest.txt`
- Agent sends notification: "X new #thoughts found"

### Step 2: Claude reads staging file
Read `/tmp/thought-sync-latest.txt` and compare against existing entries in all 7 Obsidian theme files to identify genuinely new entries. Skip any entries already in the vault (deduplication — the staging file gets overwritten each scan, so previously synced entries may reappear).

### Step 3: Claude categorizes (human-in-the-loop)
For each new entry, present a table with:

| Column | What |
|--------|------|
| # | Entry number |
| Entry | Abbreviated text |
| Category | One of the 7 themes |
| Confidence | Percentage (flag anything below 80%) |
| Proto-IP? | Yes/No — does this seed a framework? |
| Book chapter | Which chapter(s) it feeds as raw material |
| Notes | Why this category, what it connects to. Note secondary category if entry spans multiple. |

### Step 4: Huzz confirms
- Reviews categorizations
- Redirects any misplaced entries
- Approves for writing

### Step 5: Write to Obsidian vault
Add entries to the correct theme files at `/Users/nichuzz/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian/Huzz/Thought Notes/`:

**Format:**
```
**YYYY-MM-DD** — Entry text here.
```

**Rules:**
- Use the ACTUAL date from Apple Notes (staging file), not today's date
- Insert in chronological order within each file
- Add Proto-IP annotation in italics if flagged: `*(Proto-IP: Name — explanation)*`
- Entries within the same year section, sorted by date

### Step 6: Write to book deck
Add the strongest entries as rawEntries to relevant chapters in `public/book-deck-data.js`:

**Format:**
```javascript
{ date: 'YYYY-MM-DD', text: 'Entry text', protoIp: 'Name' }  // protoIp only if flagged
```

**Rules:**
- Only add to chapters where the entry genuinely feeds the theme
- Proto-IP entries should be added to their most relevant chapter
- Use the actual Apple Notes date
- Typically 1-3 chapter placements per entry (don't over-distribute)

### Step 7: Update Thought Notes Index
Update `_Thought Notes Index.md` if new entries contain proto-IP discoveries (add to the Proto-IP Discoveries table).

---

## The 7 Categories

| Category | File | What belongs here |
|----------|------|-----------------|
| Self-Realisations and Identity | `Self-Realisations and Identity.md` | Ego, stories, purpose, self-worth, enoughness, conditioning |
| Nervous System Safety and Healing | `Nervous System Safety and Healing.md` | Trauma, triggers, safety, somatic work, breathwork, body's communication |
| Relationships and Love | `Relationships and Love.md` | Attachment styles, boundaries, vulnerability, connection, intimacy |
| Consciousness and Frequency | `Consciousness and Frequency.md` | 5D, Hawkins scale, frequencies, meditation, spirituality, quantum |
| Business Purpose and Mission | `Business Purpose and Mission.md` | Thesis evolution, career clarity, building, mission statements |
| Education and School | `Education and School.md` | School micro-traumas, why education fails, conditioning |
| Culture and Society | `Culture and Society.md` | Western culture, capitalism, social media, indigenous cultures |

## Proto-IP Criteria

Flag as Proto-IP if the entry:
- Seeds or refines an existing framework (Water Model, Safety x Expression, Protective Archetypes, etc.)
- Contains a clean reframe that could become a book chapter's Turn or Land beat
- Introduces a new concept or metaphor that extends the worldview
- Connects two previously separate ideas in a novel way

---

*Workflow established 2026-06-27. See also: `docs/book-golden-thread-mapping.md` for the full Golden Thread context.*
