#!/bin/bash
# push-content-to-supabase.sh
# Reads markdown files from ClawdBot/content/ and pushes them directly
# to Supabase via the ingest-content-draft edge function.
#
# Usage:
#   ./scripts/push-content-to-supabase.sh                    # push all
#   ./scripts/push-content-to-supabase.sh specific-file.md   # push one file
#   ./scripts/push-content-to-supabase.sh --watch             # watch for changes
#
# Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
#           (or set them in .env.pipeline)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLAWDBOT_DIR="${CLAWDBOT_DIR:-$HOME/creations/ClawdBot/content}"

# Load env from .env.pipeline (check multiple locations)
for ENV_FILE in "$PROJECT_DIR/.env.pipeline" "$HOME/creations/Team/.env.pipeline" "$HOME/.env.pipeline"; do
  if [[ -f "$ENV_FILE" ]]; then
    set -a
    source "$ENV_FILE"
    set +a
    break
  fi
done

SUPABASE_URL="${SUPABASE_URL:-https://qlwfcfypnoptsocdpxuv.supabase.co}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set."
  echo "Set it in .env.pipeline or export it."
  exit 1
fi

ENDPOINT="${SUPABASE_URL}/functions/v1/ingest-content-draft"

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

# Extract title from first markdown heading
extract_title() {
  local file="$1"
  local basename="$2"
  local heading
  heading=$(grep -m1 '^# ' "$file" | sed 's/^# //' || true)
  if [[ -n "$heading" ]]; then
    echo "$heading"
  else
    echo "$basename" | sed 's/^[0-9]*-//; s/\.md$//' | tr '-' ' '
  fi
}

# Detect audience type
detect_audience() {
  local file="$1"
  case "$file" in
    *voice-analysis*|*storybank*|*comparison*|*reengagement*) echo "internal" ;;
    *) echo "external" ;;
  esac
}

push_file() {
  local src="$1"
  local basename=$(basename "$src")
  local project=$(infer_project "$basename")
  local title=$(extract_title "$src" "$basename")
  local audience=$(detect_audience "$basename")
  local source_file="${project}/${basename}"
  local body
  body=$(cat "$src")

  local payload
  payload=$(jq -n \
    --arg sf "$source_file" \
    --arg t "$title" \
    --arg b "$body" \
    --arg p "$project" \
    --arg a "$audience" \
    '{
      source_file: $sf,
      title: $t,
      body_markdown: $b,
      project: $p,
      audience: $a
    }')

  local result
  result=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "$payload")

  local http_code=$(echo "$result" | tail -n1)
  local response=$(echo "$result" | sed '$d')

  if [[ "$http_code" == "200" ]]; then
    local status=$(echo "$response" | jq -r '.results[0].status // "ok"' 2>/dev/null || echo "ok")
    echo "OK ($status): $basename -> $source_file"
  else
    echo "FAIL ($http_code): $basename"
    echo "  $response"
  fi
}

# --- Main ---

if [[ "${1:-}" == "--watch" ]]; then
  echo "Watching $CLAWDBOT_DIR for changes..."
  echo "(Press Ctrl+C to stop)"

  # Initial push
  for src in "$CLAWDBOT_DIR"/*.md; do
    [[ -f "$src" ]] && push_file "$src"
  done

  # Watch for changes using fswatch if available, otherwise poll
  if command -v fswatch &>/dev/null; then
    fswatch -0 "$CLAWDBOT_DIR" | while IFS= read -r -d '' file; do
      [[ "$file" == *.md ]] && push_file "$file"
    done
  else
    echo "(fswatch not found, polling every 30s)"
    while true; do
      sleep 30
      for src in "$CLAWDBOT_DIR"/*.md; do
        [[ -f "$src" ]] && push_file "$src"
      done
    done
  fi

elif [[ -n "${1:-}" ]]; then
  # Push specific file
  src="$CLAWDBOT_DIR/$1"
  if [[ ! -f "$src" ]]; then
    src="$1"  # Maybe full path was given
  fi
  if [[ ! -f "$src" ]]; then
    echo "File not found: $1"
    exit 1
  fi
  push_file "$src"

else
  # Push all
  count=0
  for src in "$CLAWDBOT_DIR"/*.md; do
    [[ -f "$src" ]] && push_file "$src" && ((count++))
  done
  echo ""
  echo "Done: $count files pushed"
fi
