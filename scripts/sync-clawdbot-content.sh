#!/bin/bash
# sync-clawdbot-content.sh
# Copies content from ClawdBot repo into FindMyFlow content-drafts/
# with YAML frontmatter so the GitHub Action can ingest into Supabase.
#
# Usage: ./scripts/sync-clawdbot-content.sh [--dry-run]

set -euo pipefail

CLAWDBOT_DIR="${CLAWDBOT_DIR:-$HOME/creations/ClawdBot/content}"
DEST_DIR="$(cd "$(dirname "$0")/.." && pwd)/content-drafts"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# Map filename patterns to project slugs
infer_project() {
  local file="$1"
  case "$file" in
    *buildwithai*|*build-with-ai*) echo "buildwithai" ;;
    *beyourbest*|*byb*)           echo "beyourbest" ;;
    *headset-rental*)             echo "headset-rental" ;;
    *headset-sales*|*headset*)    echo "headset-sales" ;;
    *)                            echo "findmyflow" ;;
  esac
}

# Extract title from first markdown heading or filename
extract_title() {
  local file="$1"
  local basename="$2"
  # Try first # heading
  local heading
  heading=$(grep -m1 '^# ' "$file" | sed 's/^# //' || true)
  if [[ -n "$heading" ]]; then
    echo "$heading"
    return
  fi
  # Fallback: clean up filename
  echo "$basename" | sed 's/^[0-9]*-//; s/\.md$//; s/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1))tolower(substr($i,2))}1'
}

# Extract subject line from "Subject line:" pattern if present
extract_subject() {
  local file="$1"
  grep -m1 -i '^\*\*subject.line' "$file" | sed 's/.*: *//; s/\*\*//g' | head -c 200 || true
}

# Detect audience type
detect_audience() {
  local file="$1"
  case "$file" in
    *voice-analysis*|*storybank*) echo "internal" ;;
    *)                            echo "external" ;;
  esac
}

synced=0
skipped=0

for src in "$CLAWDBOT_DIR"/*.md; do
  [[ ! -f "$src" ]] && continue

  basename=$(basename "$src")
  project=$(infer_project "$basename")
  title=$(extract_title "$src" "$basename")
  subject=$(extract_subject "$src")
  audience=$(detect_audience "$basename")

  dest_dir="$DEST_DIR/$project"
  dest_file="$dest_dir/$basename"

  # Skip if destination already exists and is newer
  if [[ -f "$dest_file" ]] && [[ "$dest_file" -nt "$src" ]]; then
    echo "SKIP (up to date): $basename"
    ((skipped++))
    continue
  fi

  # Read body content
  body=$(cat "$src")

  # Build file with frontmatter
  content="---
title: \"${title//\"/\\\"}\"
project: \"$project\"
audience: \"$audience\""

  if [[ -n "$subject" ]]; then
    content="$content
subject_line: \"${subject//\"/\\\"}\""
  fi

  content="$content
---

$body"

  if $DRY_RUN; then
    echo "WOULD SYNC: $basename -> content-drafts/$project/$basename"
    echo "  title: $title | project: $project | audience: $audience"
  else
    mkdir -p "$dest_dir"
    echo "$content" > "$dest_file"
    echo "SYNCED: $basename -> content-drafts/$project/$basename"
  fi
  ((synced++))
done

echo ""
echo "Done: $synced synced, $skipped skipped"
if $DRY_RUN; then
  echo "(dry run — no files written)"
fi
