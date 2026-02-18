#!/usr/bin/env node

/**
 * generate-llms-full.js
 *
 * Reads question JSON, offer/scoring JSON, implementation checklists, and
 * hand-authored agent-context files, then assembles a comprehensive
 * public/llms-full.txt for AI agents.
 *
 * Usage:  node scripts/generate-llms-full.js
 * Or:     npm run generate:llms
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ── Flow configuration ─────────────────────────────────────────────────────

const FLOWS = [
  {
    id: 'attraction_offer',
    name: 'Attraction Offer',
    questionsPath: 'public/attraction-offer-questions.json',
    offersPath: 'public/Money Model/Attraction/offers.json',
    checklistsPath: 'public/Money Model/Attraction/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/attraction-offer.json',
  },
  {
    id: 'upsell_offer',
    name: 'Upsell Offer',
    questionsPath: 'public/upsell-questions.json',
    offersPath: 'public/Money Model/Upsell/offers.json',
    checklistsPath: 'public/Money Model/Upsell/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/upsell.json',
  },
  {
    id: 'downsell_offer',
    name: 'Downsell Offer',
    questionsPath: 'public/downsell-questions.json',
    offersPath: 'public/Money Model/Downsell/offers.json',
    checklistsPath: 'public/Money Model/Downsell/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/downsell.json',
  },
  {
    id: 'continuity_offer',
    name: 'Continuity Offer',
    questionsPath: 'public/continuity-questions.json',
    offersPath: 'public/Money Model/Continuity/offers.json',
    checklistsPath: 'public/Money Model/Continuity/implementation_checklists.json',
    contextPath: 'public/agent-context/flows/continuity.json',
  },
  {
    id: 'leads_strategy',
    name: 'Leads Strategy (Core Four)',
    questionsPath: 'public/leads-strategy-questions.json',
    offersPath: 'public/leads-strategy-offers.json',
    checklistsPath: null,
    contextPath: 'public/agent-context/flows/leads-strategy.json',
  },
  {
    id: 'lead_magnet_offer',
    name: 'Lead Magnet',
    questionsPath: 'public/lead-magnet-questions.json',
    offersPath: 'public/lead-magnet-offers.json',
    checklistsPath: null,
    contextPath: 'public/agent-context/flows/lead-magnet.json',
  },
];

// ── File helpers ────────────────────────────────────────────────────────────

function readJSON(relPath) {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) return null;
  return JSON.parse(readFileSync(abs, 'utf-8'));
}

function readMarkdown(relPath) {
  const abs = resolve(ROOT, relPath);
  if (!existsSync(abs)) return null;
  return readFileSync(abs, 'utf-8');
}

/**
 * Normalise different JSON shapes into a plain array.
 *   - Top-level array  → return as-is
 *   - { questions: [...] } or { offers: [...] } → unwrap
 */
function normaliseArray(data, wrapperKey) {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data[wrapperKey] && Array.isArray(data[wrapperKey])) return data[wrapperKey];
  // Try the first array-valued key as fallback
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key])) return data[key];
  }
  return [];
}

// ── Section generators ─────────────────────────────────────────────────────

function generateFlowHeader(flow, context) {
  const lines = [];
  lines.push(`## ${flow.name}`);
  lines.push('');

  if (context) {
    if (context.purpose) {
      lines.push(`**Purpose:** ${context.purpose}`);
      lines.push('');
    }
    if (context.when_to_use) {
      lines.push('**When to use this flow:**');
      for (const item of context.when_to_use) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
    if (context.when_not_to_use) {
      lines.push('**When NOT to use this flow:**');
      for (const item of context.when_not_to_use) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateQuestionsSection(questions, context) {
  if (!questions.length) return '';

  const lines = [];
  lines.push('### Questions');
  lines.push('');

  // Build a lookup from context.questions keyed by question id
  const contextMap = {};
  if (context && context.questions) {
    for (const qCtx of context.questions) {
      if (qCtx.id) contextMap[qCtx.id] = qCtx;
    }
  }

  for (const q of questions) {
    lines.push(`#### ${q.id}: ${q.question}`);
    if (q.subtext) {
      lines.push(`> ${q.subtext}`);
    }
    lines.push('');

    // Agent context for this question
    const qCtx = contextMap[q.id];
    if (qCtx) {
      if (qCtx.agent_context) {
        lines.push(`**Agent context:** ${qCtx.agent_context}`);
        lines.push('');
      }
      if (qCtx.if_unknown) {
        lines.push(`**If the user doesn't know:** ${qCtx.if_unknown}`);
        lines.push('');
      }
    }

    // Options table
    lines.push('| Option | Value | Description |');
    lines.push('|--------|-------|-------------|');
    for (const opt of q.options || []) {
      const desc = (opt.description || '').replace(/\|/g, '\\|');
      lines.push(`| ${opt.label} | \`${opt.value}\` | ${desc} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateScoringMatrix(questions, offers) {
  if (!offers.length || !questions.length) return '';

  // Collect all question_id -> option_value pairs from questions
  const questionOptions = [];
  for (const q of questions) {
    for (const opt of q.options || []) {
      questionOptions.push({
        questionId: q.id,
        optionValue: opt.value,
        optionLabel: opt.label,
      });
    }
  }

  // Build the table
  const lines = [];
  lines.push('### Scoring Matrix');
  lines.push('');
  lines.push('Each cell shows the scoring weight assigned to that option for that offer outcome.');
  lines.push('');

  // Header row
  const offerNames = offers.map(o => o.name);
  lines.push(`| Question | Option | ${offerNames.join(' | ')} |`);
  lines.push(`|----------|--------|${offerNames.map(() => '---').join('|')}|`);

  for (const qo of questionOptions) {
    // Normalise: q1_business_model -> Q1_business_model for lookup in scoring_weights
    const normKey = qo.questionId.replace(/^q(\d+)/, (_, n) => `Q${n}`);

    const scores = offers.map(offer => {
      const weights = offer.scoring_weights || {};
      const questionWeights = weights[normKey] || {};
      const score = questionWeights[qo.optionValue];
      if (score === undefined || score === null) return '-';
      if (score > 0) return `+${score}`;
      return `${score}`;
    });

    lines.push(
      `| ${qo.questionId} | ${qo.optionLabel} | ${scores.join(' | ')} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

function generateDisqualifiers(offers) {
  const offersWithRules = offers.filter(
    o => o.eligibility_rules && o.eligibility_rules.hard_disqualifiers?.length
  );
  if (!offersWithRules.length) return '';

  const lines = [];
  lines.push('### Disqualifier Rules');
  lines.push('');
  lines.push(
    'These rules automatically disqualify an offer regardless of score.'
  );
  lines.push('');

  for (const offer of offersWithRules) {
    lines.push(`**${offer.name}:**`);
    for (const dq of offer.eligibility_rules.hard_disqualifiers) {
      const disallowed = dq.disallowed.map(v => `\`${v}\``).join(', ');
      lines.push(`- If \`${dq.field}\` is ${disallowed} → disqualified`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function generateOutcomes(offers, checklists) {
  if (!offers.length) return '';

  const lines = [];
  lines.push('### Possible Outcomes');
  lines.push('');

  for (const offer of offers) {
    lines.push(`#### ${offer.name}`);
    lines.push('');

    if (offer.description) {
      lines.push(offer.description);
      lines.push('');
    }

    if (offer.best_for && offer.best_for.length) {
      lines.push('**Best for:**');
      for (const item of offer.best_for) {
        lines.push(`- ${item}`);
      }
      lines.push('');
    }

    // Funnel template details
    if (offer.funnel_template) {
      const ft = offer.funnel_template;

      if (ft.headline_patterns?.length) {
        lines.push('**Tell the user (headline patterns):**');
        for (const h of ft.headline_patterns) {
          lines.push(`- "${h}"`);
        }
        lines.push('');
      }

      if (ft.offer_structure?.length) {
        lines.push('**Offer structure:**');
        for (const s of ft.offer_structure) {
          lines.push(`- ${s}`);
        }
        lines.push('');
      }

      if (ft.metrics?.length) {
        lines.push('**Key metrics to track:**');
        for (const m of ft.metrics) {
          lines.push(`- ${m}`);
        }
        lines.push('');
      }
    }

    // Implementation checklist first actions
    if (checklists) {
      const checklist = checklists[offer.id];
      if (checklist && checklist.implementation_checklist?.length) {
        const firstPhase = checklist.implementation_checklist[0];
        if (firstPhase && firstPhase.tasks?.length) {
          lines.push(
            `**First actions (${firstPhase.phase}):**`
          );
          for (const task of firstPhase.tasks.slice(0, 3)) {
            lines.push(`1. **${task.task}** — ${task.description}`);
          }
          lines.push('');
        }
      }
    }

    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const sections = [];

  // 1. Framework overview (hand-authored header)
  const overview = readMarkdown('public/agent-context/framework-overview.md');
  if (overview) {
    sections.push(overview.trim());
  } else {
    console.warn(
      '  [WARN] public/agent-context/framework-overview.md not found — skipping header'
    );
  }

  // 2. Flow sections
  for (const flow of FLOWS) {
    console.log(`Processing: ${flow.name}`);

    // Load data files
    const questionsRaw = readJSON(flow.questionsPath);
    const offersRaw = readJSON(flow.offersPath);
    const checklistsRaw = flow.checklistsPath
      ? readJSON(flow.checklistsPath)
      : null;

    if (!questionsRaw) {
      console.warn(`  [WARN] Questions file not found: ${flow.questionsPath}`);
    }
    if (!offersRaw) {
      console.warn(`  [WARN] Offers file not found: ${flow.offersPath}`);
    }

    const questions = normaliseArray(questionsRaw, 'questions');
    const offers = normaliseArray(offersRaw, 'offers');

    // Load agent context (optional — may not exist yet)
    let context = null;
    const contextAbs = resolve(ROOT, flow.contextPath);
    if (existsSync(contextAbs)) {
      try {
        context = JSON.parse(readFileSync(contextAbs, 'utf-8'));
      } catch (err) {
        console.warn(
          `  [WARN] Failed to parse agent context: ${flow.contextPath} — ${err.message}`
        );
      }
    } else {
      console.warn(
        `  [WARN] Agent context not found: ${flow.contextPath} — skipping agent_context fields`
      );
    }

    // Assemble flow section
    const flowSections = [];
    flowSections.push(generateFlowHeader(flow, context));
    flowSections.push(generateQuestionsSection(questions, context));
    flowSections.push(generateScoringMatrix(questions, offers));
    flowSections.push(generateDisqualifiers(offers));
    flowSections.push(generateOutcomes(offers, checklistsRaw));

    sections.push(flowSections.filter(Boolean).join('\n'));
  }

  // 3. Guidance footer (hand-authored)
  const guidance = readMarkdown('public/agent-context/guidance.md');
  if (guidance) {
    sections.push(guidance.trim());
  } else {
    console.warn(
      '  [WARN] public/agent-context/guidance.md not found — skipping footer'
    );
  }

  // 4. Write output
  const output = sections.join('\n\n---\n\n') + '\n';
  const outputPath = resolve(ROOT, 'public/llms-full.txt');
  writeFileSync(outputPath, output, 'utf-8');

  const sizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(1);
  console.log(`\nDone! Written to public/llms-full.txt (${sizeKB} KB)`);
}

main();
