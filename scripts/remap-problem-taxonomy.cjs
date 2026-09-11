#!/usr/bin/env node
/**
 * Remap problem taxonomy data files from v2 → v3 categories.
 * Uses Claude Haiku to classify records with removed/ambiguous IDs.
 *
 * Usage: node scripts/remap-problem-taxonomy.js [--dry-run] [--file <filename>]
 *
 * --dry-run    Print what would change without writing files
 * --file       Only process a specific file (e.g. problemTagsReassigned)
 */

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const fileFilter = args.includes('--file') ? args[args.indexOf('--file') + 1] : null

const API_KEY = process.env.ANTHROPIC_API_KEY
if (!API_KEY) {
  console.error('Missing ANTHROPIC_API_KEY in .env.local')
  process.exit(1)
}

// ── Category definitions ──────────────────────────────────────────────
const CATEGORIES = [
  { id: 'kids_deserved_better', name: 'Helping kids thrive', desc: 'Parenting, education, youth programs, giving kids what they need to grow' },
  { id: 'pain_not_believed', name: 'Healing the body', desc: 'Chronic pain, burnout, illness, disability, sleep, health problems the system ignores' },
  { id: 'minds_hurting', name: 'Minds that are hurting', desc: 'Anxiety, depression, trauma, addiction, grief, helping people find themselves again' },
  { id: 'money_stress', name: 'Money that stresses you out', desc: 'Debt, financial stress, not understanding money, the gap between rich and stuck' },
  { id: 'lonely_disconnected', name: 'Lonely and disconnected', desc: 'Relationships, dating, friendship, isolation, finding where you belong' },
  { id: 'feeling_stupid', name: 'Making hard things simple', desc: 'Taking confusing stuff and explaining it so anyone can get it' },
  { id: 'work_treated_nothing', name: 'Getting your work seen', desc: 'Helping creators, artists, builders get credit, get paid, stop being ignored' },
  { id: 'work_hollows', name: 'Making work worth it', desc: 'Career change, toxic workplaces, burnout, finding work that builds you up' },
  { id: 'teams_leaders_broken', name: 'Teams underperforming', desc: 'Leadership, management, team culture, fixing organizations from the inside' },
  { id: 'world_losing', name: 'Protecting the planet', desc: 'Climate, conservation, sustainability, building businesses that help nature' },
  { id: 'people_treated_unfairly', name: 'People treated unfairly', desc: 'Rights, justice, discrimination, access, fighting systems that keep people down' },
  { id: 'feeling_lost', name: 'Feeling lost', desc: 'Purpose, meaning, direction, what to do with your life when nothing makes sense' },
]

const REMOVED_IDS = ['voice_taken', 'life_not_yours', 'locked_out', 'left_behind', 'forgot_what_for', 'stopped_wondering']
const KEPT_IDS = CATEGORIES.map(c => c.id)

const CATEGORY_LIST = CATEGORIES.map(c => `- ${c.id}: ${c.name} — ${c.desc}`).join('\n')

// ── Haiku API call ────────────────────────────────────────────────────
async function classifyBatch(records, contextField) {
  const recordLines = records.map((r, i) => {
    const text = contextField === 'tag'
      ? `[${i}] "${r.problem}" (evidence: "${r.evidence}")`
      : `[${i}] ${r.name} — domain: "${r.domain || ''}", problem context: "${r.primaryProblem || ''}"${r.careerModel?.trajectory ? `, trajectory: "${r.careerModel.trajectory}"` : ''}`
    return text
  }).join('\n')

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Classify each record into exactly ONE of these 12 problem categories. Return ONLY a JSON array of objects with "index" and "category" fields. No explanation.

Categories:
${CATEGORY_LIST}

Records:
${recordLines}

Return format: [{"index": 0, "category": "category_id"}, ...]`
    }]
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const text = data.content[0].text.trim()

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`No JSON array in response: ${text.substring(0, 200)}`)

  return JSON.parse(jsonMatch[0])
}

// ── Process a file ────────────────────────────────────────────────────
async function processFile(filePath, arrayKey, categoryField, contextType) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const records = raw[arrayKey]
  if (!records || !Array.isArray(records)) {
    console.log(`  Skipping ${filePath}: no "${arrayKey}" array found`)
    return { changed: 0, total: 0 }
  }

  // Find records needing reclassification
  const needsRemap = []
  records.forEach((r, i) => {
    const cat = r[categoryField]
    if (REMOVED_IDS.includes(cat) || !KEPT_IDS.includes(cat)) {
      needsRemap.push({ record: r, index: i })
    }
  })

  // Also flag kept-category records for review (batch separately)
  const reviewKept = []
  records.forEach((r, i) => {
    const cat = r[categoryField]
    if (KEPT_IDS.includes(cat)) {
      reviewKept.push({ record: r, index: i })
    }
  })

  console.log(`  ${records.length} total, ${needsRemap.length} must-remap, ${reviewKept.length} to review`)

  const BATCH_SIZE = 25
  let changed = 0

  // Phase 1: Remap removed IDs
  for (let i = 0; i < needsRemap.length; i += BATCH_SIZE) {
    const batch = needsRemap.slice(i, i + BATCH_SIZE)
    const batchRecords = batch.map(b => b.record)

    process.stdout.write(`  Classifying must-remap batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsRemap.length / BATCH_SIZE)}...`)
    const results = await classifyBatch(batchRecords, contextType)

    for (const result of results) {
      const { record, index } = batch[result.index]
      const oldCat = record[categoryField]
      const newCat = result.category

      if (!KEPT_IDS.includes(newCat)) {
        console.warn(`\n  ⚠️  Haiku returned invalid ID "${newCat}" for "${record.person || record.name}" — skipping`)
        continue
      }
      if (oldCat !== newCat) {
        record[categoryField] = newCat
        changed++
      }
    }
    console.log(` done (${results.length} classified)`)

    // Rate limit: 100ms between batches
    await new Promise(r => setTimeout(r, 100))
  }

  // Phase 2: Review kept IDs — only change if Haiku disagrees
  for (let i = 0; i < reviewKept.length; i += BATCH_SIZE) {
    const batch = reviewKept.slice(i, i + BATCH_SIZE)
    const batchRecords = batch.map(b => b.record)

    process.stdout.write(`  Reviewing kept batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(reviewKept.length / BATCH_SIZE)}...`)
    const results = await classifyBatch(batchRecords, contextType)

    let reviewChanges = 0
    for (const result of results) {
      const { record, index } = batch[result.index]
      const oldCat = record[categoryField]
      const newCat = result.category

      if (KEPT_IDS.includes(newCat) && oldCat !== newCat) {
        // Only reclassify into NEW categories (the 6 that have zero data)
        const newCats = ['minds_hurting', 'money_stress', 'lonely_disconnected', 'teams_leaders_broken', 'people_treated_unfairly', 'feeling_lost']
        if (newCats.includes(newCat)) {
          record[categoryField] = newCat
          changed++
          reviewChanges++
        }
      }
    }
    console.log(` done (${reviewChanges} reclassified to new categories)`)

    await new Promise(r => setTimeout(r, 100))
  }

  // Fix secondaryCategoryIntents arrays (gapFillingProfiles)
  const LEGACY_MAP = {
    voice_taken: 'minds_hurting',
    life_not_yours: 'people_treated_unfairly',
    locked_out: 'people_treated_unfairly',
    left_behind: 'lonely_disconnected',
    forgot_what_for: 'feeling_lost',
    stopped_wondering: 'feeling_lost',
  }
  for (const r of records) {
    if (Array.isArray(r.secondaryCategoryIntents)) {
      r.secondaryCategoryIntents = r.secondaryCategoryIntents.map(id =>
        LEGACY_MAP[id] || id
      )
    }
  }

  // Write back
  if (changed > 0 && !DRY_RUN) {
    raw[arrayKey] = records
    if (raw.meta?.totalTags) raw.meta.totalTags = records.length
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n')
  }

  return { changed, total: records.length }
}

// ── Distribution report ───────────────────────────────────────────────
function printDistribution(filePath, arrayKey, categoryField) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  const records = raw[arrayKey]
  if (!records) return

  const dist = {}
  CATEGORIES.forEach(c => dist[c.id] = 0)
  records.forEach(r => {
    const cat = r[categoryField]
    dist[cat] = (dist[cat] || 0) + 1
  })

  const basename = path.basename(filePath)
  console.log(`\n  ${basename} distribution:`)
  for (const [id, count] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    const warning = count < 5 ? ' ⚠️ LOW' : count < 10 ? ' ⚡ thin' : ''
    console.log(`    ${id.padEnd(28)} ${String(count).padStart(4)}${warning}`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, '..', 'public', 'data')

const FILES = [
  { file: 'problemTagsReassigned.json', key: 'tags', field: 'category', type: 'tag' },
  { file: 'careerModels.json', key: 'profiles', field: 'primaryProblem', type: 'career' },
  { file: 'gapFillingProblemTags.json', key: 'tags', field: 'category', type: 'tag' },
  { file: 'gapFillingCareerModels.json', key: 'profiles', field: 'primaryProblem', type: 'career' },
  { file: 'gapFillingProfiles.json', key: 'profiles', field: 'primaryCategoryIntent', type: 'career' },
  // gapFillingPlaySkills.json has no problem category field — skip
]

async function main() {
  console.log(`\n🔄 Problem Taxonomy v2 → v3 Remapper${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log('═'.repeat(50))

  const summary = []

  for (const { file, key, field, type } of FILES) {
    if (fileFilter && !file.includes(fileFilter)) continue

    const filePath = path.join(DATA_DIR, file)
    if (!fs.existsSync(filePath)) {
      console.log(`\n⏭️  ${file} — not found, skipping`)
      continue
    }

    console.log(`\n📄 ${file}`)
    const result = await processFile(filePath, key, field, type)
    summary.push({ file, ...result })
  }

  // Distribution report
  console.log('\n\n📊 FINAL DISTRIBUTIONS')
  console.log('═'.repeat(50))

  for (const { file, key, field } of FILES) {
    if (fileFilter && !file.includes(fileFilter)) continue
    const filePath = path.join(DATA_DIR, file)
    if (fs.existsSync(filePath)) {
      printDistribution(filePath, key, field)
    }
  }

  // Summary
  console.log('\n\n📋 SUMMARY')
  console.log('═'.repeat(50))
  for (const s of summary) {
    console.log(`  ${s.file}: ${s.changed}/${s.total} records changed`)
  }

  // Post-run assertion: no removed IDs should survive
  if (!DRY_RUN) {
    let stale = 0
    for (const { file, key, field } of FILES) {
      if (fileFilter && !file.includes(fileFilter)) continue
      const filePath = path.join(DATA_DIR, file)
      if (!fs.existsSync(filePath)) continue
      const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      const records = raw[key]
      if (!records) continue
      for (const r of records) {
        if (REMOVED_IDS.includes(r[field])) {
          console.error(`  ❌ STALE ID "${r[field]}" in ${file} (${r.person || r.name})`)
          stale++
        }
        if (r[field] && !KEPT_IDS.includes(r[field])) {
          console.error(`  ❌ INVALID ID "${r[field]}" in ${file} (${r.person || r.name})`)
          stale++
        }
      }
    }
    if (stale > 0) {
      console.error(`\n❌ ${stale} stale/invalid IDs found — remap incomplete!`)
      process.exit(1)
    } else {
      console.log('\n✅ Post-run assertion: zero stale or invalid IDs')
    }
  }

  // Check for dead file
  const deadFile = path.join(DATA_DIR, 'problemTaxonomyV2.json')
  if (fs.existsSync(deadFile)) {
    if (DRY_RUN) {
      console.log(`\n🗑️  Would delete: problemTaxonomyV2.json (dead code)`)
    } else {
      fs.unlinkSync(deadFile)
      console.log(`\n🗑️  Deleted: problemTaxonomyV2.json (dead code)`)
    }
  }

  console.log(`\n✅ Done${DRY_RUN ? ' (dry run — no files changed)' : ''}`)
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})
