# Session Handoff: Creator Data Cleanup (2026-07-09)

## What was done

### fuelType slider inversion fix
- **Canonical JSON** (`content-drafts/vibe-rise-videos/public/experienceCreatorCanonical.json`): 21 of 32 DNA profiles had fuelType inverted. Applied `6 - old_value`, then manually tuned 3 edge cases (Wim Hof→2, Sadhguru→2, Gabby Bernstein→3). Jesse Israel changed from 2→4.
- **App DNA file** (`public/data/experienceCreatorDNA.json`): Synced all 21 corrected fuelType values from canonical. This affects the live app's Play Profile matcher if fuelType is used in matching.

### LOW_CONFIDENCE values resolved
- 9 fields across 6 creators replaced with web-researched values: David Elliott, Dawnbreak Australia (4 fields), DJ Taz Rashid, Meghan Currie, Preston Smiles (SuperSoul 100 claim removed as unverifiable), Vinn Marti.

### Missing bios and oneLiners filled
- 10 bios written: Brene Brown, Dan Hughes, Dawnbreak Australia, Harville Hendrix, John Gottman, Sanctum, Stan Tatkin, Sue Johnson, Terry Real, Vinn Marti.
- 11 oneLiners written: same as above + Meghan Currie.

### remarkableResult spot-check (final)
- Jay Shetty: follower count corrected (~60M, not 65M), "64M podcast downloads" flagged as unverifiable self-reported stat, plagiarism investigation noted.
- John Gottman: "90% prediction accuracy" rewritten as misleading (was post-hoc model, not prospective prediction).

### Em dash purge
- 112 em dashes replaced with commas across all text fields in canonical JSON.

### Video branding guide updated
- `docs/dev-guides/video-branding-guide.md`: "THE 4 INGREDIENTS" → "THE 5 INGREDIENTS", progress dots updated for 4 or 5, all file paths updated to `content-drafts/vibe-rise-videos/`.

### Blog post verified
- `docs/content-drafts/content/blog-5-ingredients-remarkable.md`: Already had 5 ingredients including Time in Game. No changes needed.

## Decisions made

- **fuelType scale is 1=Fire → 5=Purpose.** The original 32 DNA profiles were scored inverted. Now corrected in both canonical and app DNA files. Edge cases: Wim Hof=2 (charismatic+intense), Sadhguru=2 (entertainer with mission), Gabby Bernstein=3 (mix).
- **Preston Smiles SuperSoul 100 claim removed.** Could not verify via any web source. Multiple searches of official list came up empty.
- **John Gottman "90% prediction" reframed.** The claim was based on a post-hoc model, not prospective prediction. Rewritten to reference the behavioral patterns and frameworks instead.

## In progress / next steps

- **10 profiles still missing all 5 sliders:** Dan Hughes, Dawnbreak Australia, Do LaB, Envision Festival, Harville Hendrix, Sanctum, Stan Tatkin, Sue Johnson, Terry Real, Vinn Marti. These are orgs or niche creators where confident scoring wasn't possible. Not blocking content or app features.

## Gotchas discovered

- **fuelType change affects the live app.** The Play Profile matcher at `/play-profile` uses `experienceCreatorDNA.json` for DNA matching. The fuelType correction changes match results for users. The matching uses 5D Euclidean distance, so changing one dimension shifts who matches whom. Worth testing with a known user profile to verify matches still make sense.
- **Canonical JSON lives in `content-drafts/`, not `public/`.** The app does NOT read the canonical file. It only reads `public/data/experienceCreatorDNA.json` (32 profiles). If you want the app to access all 91 profiles or the 4 ingredients, the canonical file needs to be moved and code updated.

## Recommendations

1. **Test the Play Profile matcher** with a known user to verify fuelType correction didn't break match quality. The Euclidean distance calculation in `src/lib/dnaMatching.js` should still work, but the match rankings will shift.
2. **Draft video #3: "The Rule They Broke"** — single-creator deep-dives. All data is ready in the canonical JSON. These are the most shareable format.
3. **Publish newsletter #3 (Steps) or #7 (Mistakes)** — outlines ready at `docs/content-drafts/docs/newsletter-10-outlines.md`.

## Key files

| File | What changed |
|------|-------------|
| `content-drafts/vibe-rise-videos/public/experienceCreatorCanonical.json` | v4.6: fuelType fix, LOW_CONFIDENCE resolved, bios/oneLiners filled, em dashes purged |
| `public/data/experienceCreatorDNA.json` | fuelType synced from canonical (21 values changed) |
| `docs/dev-guides/video-branding-guide.md` | 5 ingredients, file paths updated |
