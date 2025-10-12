import { renderEssenceReveal } from "./templates/essenceRevealTemplate";
import { renderProtectiveMirror } from "./templates/protectiveMirrorTemplate";

/**
 * Replace {{var}} placeholders with values from answers.
 * Example: "Hello {{user_name}}" -> "Hello Nic"
 */
function interpolateVars(str, answers = {}) {
  if (typeof str !== "string") return "";
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = answers[key];
    return v == null ? "" : String(v);
  });
}

/**
 * Support macro placeholders that produce full text blocks:
 *  - {{ESSENCE_REVEAL(answerKey)}}
 *  - {{PROTECTIVE_MIRROR(answerKey)}}
 */
function resolveMacros(str, answers = {}) {
  if (typeof str !== "string") return "";

  // Essence: {{ESSENCE_REVEAL(answerKey)}}
  const essenceMatch = str.match(/\{\{\s*ESSENCE_REVEAL\s*\(\s*([^)]+?)\s*\)\s*\}\}/);
  if (essenceMatch) {
    const keyName = essenceMatch[1].trim();
    const archetypeKey = answers[keyName] || "";
    return renderEssenceReveal(archetypeKey);
  }

  // Protective: {{PROTECTIVE_MIRROR(answerKey)}}
  const protectiveMatch = str.match(/\{\{\s*PROTECTIVE_MIRROR\s*\(\s*([^)]+?)\s*\)\s*\}\}/);
  if (protectiveMatch) {
    const keyName = protectiveMatch[1].trim();
    const archetypeKey = answers[keyName] || "";
    return renderProtectiveMirror(archetypeKey);
  }

  return str;
}

/**
 * Public API: Turn a step's prompt into the final display string.
 * 1) Expand macros (if any)
 * 2) Interpolate simple {{var}} placeholders
 */
export function resolvePrompt(step, answers = {}) {
  const base = step?.prompt || "";
  const expanded = resolveMacros(base, answers);
  return interpolateVars(expanded, answers);
}
