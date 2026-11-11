#!/usr/bin/env node
/**
 * CSS Variable Replacement Codemod
 *
 * Replaces hardcoded CSS color values with CSS custom properties.
 * Usage: node scripts/css-var-replace.mjs <css-file-path>
 */

import { readFileSync, writeFileSync } from 'fs';
import { basename } from 'path';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/css-var-replace.mjs <css-file-path>');
  process.exit(1);
}

// ─── Mapping ────────────────────────────────────────────────────────────────

// Background replacements (used when the property is background/background-color)
const BG_MAP = [
  // bg-surface: white
  { patterns: ['#ffffff', '#FFFFFF', 'white'], token: '--bg-surface' },
  // bg-muted
  { patterns: ['#f8f9fa', '#F8F9FA', '#f5f5f5', '#F5F5F5', '#f1f3f5', '#F1F3F5', '#f0f0f0', '#F0F0F0'], token: '--bg-muted' },
  // bg-surface-hover
  { patterns: ['#faf8ff', '#FAF8FF', '#f5f3ff', '#F5F3FF', '#faf5ff', '#FAF5FF'], token: '--bg-surface-hover' },
  // bg-input
  { patterns: ['#f8f8fa', '#F8F8FA'], token: '--bg-input' },
];

// Color (text) replacements (used when the property is color)
const TEXT_COLOR_MAP = [
  // text-on-accent: white used as text color
  { patterns: ['#ffffff', '#FFFFFF', '#fff', '#FFF', 'white'], token: '--text-on-accent' },
  // text-primary
  { patterns: ['#1a1a2e', '#1A1A2E', '#212529', '#1a0b3d', '#1A0B3D'], token: '--text-primary' },
  // text-secondary
  { patterns: ['#495057', '#374151'], token: '--text-secondary' },
  // text-muted
  { patterns: ['#6c757d', '#6C757D', '#6b7280', '#6B7280'], token: '--text-muted' },
  // text-faint
  { patterns: ['#9ca3af', '#9CA3AF', '#adb5bd', '#ADB5BD'], token: '--text-faint' },
];

// Context-independent replacements (safe for any property)
const UNIVERSAL_MAP = [
  // accent
  { patterns: ['#5e17eb', '#5E17EB'], token: '--accent-primary' },
  // accent-light
  { patterns: ['#8b5cf6', '#8B5CF6'], token: '--accent-primary-light' },
  // accent-dark
  { patterns: ['#7c3aed', '#7C3AED'], token: '--accent-primary-dark' },
  // gold
  { patterns: ['#E9A23B', '#e9a23b'], token: '--accent-gold' },
  // gold-light
  { patterns: ['#f0b94e', '#F0B94E', '#f0b754', '#F0B754', '#f5c55a', '#F5C55A'], token: '--accent-gold-light' },
  // success
  { patterns: ['#10b981', '#10B981'], token: '--color-success' },
  // success-dark
  { patterns: ['#059669'], token: '--color-success-dark' },
  // danger
  { patterns: ['#ef4444', '#EF4444'], token: '--color-danger' },
  // danger-dark
  { patterns: ['#dc2626', '#DC2626'], token: '--color-danger-dark' },
  // warning
  { patterns: ['#f97316', '#F97316'], token: '--color-warning' },
  // border-default
  { patterns: ['#e9ecef', '#E9ECEF'], token: '--border-default' },
  // border-light
  { patterns: ['#dee2e6', '#DEE2E6', '#e5e7eb', '#E5E7EB', '#e0e0e0', '#E0E0E0'], token: '--border-light' },
  // border-input
  { patterns: ['#eef0f3', '#EEF0F3', '#d1d5db', '#D1D5DB'], token: '--border-input' },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function isInsideKeyframes(lines, lineIndex) {
  // Walk backwards from the line to see if we're inside @keyframes
  let braceDepth = 0;
  for (let i = lineIndex; i >= 0; i--) {
    const line = lines[i];
    // Count braces
    for (const ch of line) {
      if (ch === '}') braceDepth++;
      if (ch === '{') braceDepth--;
    }
    if (line.match(/@keyframes\s/)) {
      return braceDepth <= 0; // If we haven't exited the keyframes block
    }
  }
  return false;
}

function shouldSkipLine(line) {
  const trimmed = line.trim();
  // Skip comments
  if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) return true;
  // Skip lines already using var()
  if (trimmed.includes('var(--')) return true;
  // Skip url() values
  if (trimmed.includes('url(')) return true;
  return false;
}

function isBgProperty(line) {
  const trimmed = line.trim();
  return /^background\s*:/.test(trimmed) ||
         /^background-color\s*:/.test(trimmed);
}

function isColorProperty(line) {
  const trimmed = line.trim();
  return /^color\s*:/.test(trimmed);
}

function isBorderProperty(line) {
  const trimmed = line.trim();
  return /^border\s*:/.test(trimmed) ||
         /^border-\w+\s*:/.test(trimmed) ||
         /^outline\s*:/.test(trimmed);
}

function isGradientLine(line) {
  return /gradient\s*\(/.test(line);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceInLine(line, patterns, token) {
  let result = line;
  for (const pattern of patterns) {
    // Build a regex that matches the pattern as a whole word/value
    // Use word boundary for hex colors, or exact match for 'white'
    let regex;
    if (pattern === 'white') {
      // Match 'white' as a standalone value, not inside other words (e.g. 'whitespace')
      regex = new RegExp(`(?<=[:\\s,])${escapeRegex(pattern)}(?=[\\s;,!)])`, 'gi');
    } else {
      regex = new RegExp(escapeRegex(pattern), 'gi');
    }
    result = result.replace(regex, `var(${token})`);
  }
  return result;
}

// ─── Main ───────────────────────────────────────────────────────────────────

const content = readFileSync(filePath, 'utf-8');
const lines = content.split('\n');
const changes = [];
let totalReplacements = 0;

for (let i = 0; i < lines.length; i++) {
  const originalLine = lines[i];

  if (shouldSkipLine(originalLine)) continue;
  if (isInsideKeyframes(lines, i)) continue;

  let newLine = originalLine;

  // Decide which maps to apply based on context
  const isBg = isBgProperty(originalLine);
  const isColor = isColorProperty(originalLine);
  const isBorder = isBorderProperty(originalLine);
  const isGradient = isGradientLine(originalLine);

  // 1. Context-specific: background properties
  if (isBg && !isGradient) {
    for (const entry of BG_MAP) {
      newLine = replaceInLine(newLine, entry.patterns, entry.token);
    }
  }

  // 2. Context-specific: color properties
  if (isColor) {
    for (const entry of TEXT_COLOR_MAP) {
      newLine = replaceInLine(newLine, entry.patterns, entry.token);
    }
  }

  // 3. Universal replacements (accents, semantic, borders) — for any property
  //    But skip accent colors inside gradient() to avoid breaking gradient syntax
  for (const entry of UNIVERSAL_MAP) {
    if (isGradient) {
      // Don't replace color stops inside gradients — keep them as raw hex for consistency
      continue;
    }
    newLine = replaceInLine(newLine, entry.patterns, entry.token);
  }

  // 4. If line is not bg/color but has text-like colors, try text map too
  //    (for properties like fill, stroke, etc.)
  if (!isBg && !isColor && !isGradient) {
    // For non-bg, non-color properties that have white — likely fill/stroke on buttons
    // Skip this to be safe — only do text-primary/secondary/muted for non-color props
    const textNonWhiteMap = TEXT_COLOR_MAP.filter(e => e.token !== '--text-on-accent');
    for (const entry of textNonWhiteMap) {
      newLine = replaceInLine(newLine, entry.patterns, entry.token);
    }
  }

  // 5. For bg properties with colors that are also in universal map (like border colors used as bg),
  //    run universal on bg lines too (already done above)

  if (newLine !== originalLine) {
    // Check for double var(var(-- which would be a bug
    if (newLine.includes('var(var(')) {
      console.error(`  ERROR: Double var() at line ${i + 1}: ${newLine.trim()}`);
      continue; // Skip this replacement
    }
    changes.push({
      line: i + 1,
      before: originalLine.trim(),
      after: newLine.trim(),
    });
    lines[i] = newLine;
    totalReplacements++;
  }
}

// Write back
writeFileSync(filePath, lines.join('\n'), 'utf-8');

// Report
const name = basename(filePath);
console.log(`\n  ${name}: ${totalReplacements} replacements\n`);
if (changes.length > 0) {
  const showMax = Math.min(changes.length, 15);
  for (let i = 0; i < showMax; i++) {
    const c = changes[i];
    console.log(`  L${c.line}:`);
    console.log(`    - ${c.before}`);
    console.log(`    + ${c.after}`);
  }
  if (changes.length > showMax) {
    console.log(`  ... and ${changes.length - showMax} more`);
  }
}
console.log('');
