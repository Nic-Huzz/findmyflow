# Vibe Rise Plugin for Claude Code

Run business assessments and sync session progress to your Vibe Rise self-knowledge graph. Every Claude session becomes a data collection point for your skills, patterns, and personal monopoly.

## Setup

### 1. Get an API Key

1. Log into [FindMyFlow](https://findmyflow.nichuzz.com)
2. Go to your Profile page
3. Under "Agent Access", click **Generate API Key**
4. Copy the key (starts with `fmf_k1_`) — it's only shown once

### 2. Set the Environment Variable

Add your API key to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.):

```bash
export FINDMYFLOW_API_KEY="fmf_k1_your_key_here"
```

Then reload your shell or run `source ~/.zshrc`.

### 3. Install the Plugin

```bash
claude plugins add findmyflow
```

Or add it manually to your Claude Code settings.

## Usage

### Session Sync (new)

At the end of any work session, type `/sync` or say "sync my progress." Claude will:

1. Load your interior scoreboard (scores, skills, quests, patterns)
2. Identify what you accomplished this session
3. Match accomplishments to your quests (auto-detected from directory)
4. Ask how each task felt while doing it (Vibe Rise / Fun / Stress / Boring)
5. Commit everything: tasks created, RP awarded, skill XP tracked, patterns captured

Your state response is the most important data point. It feeds your Action Score and helps detect your personal monopoly.

### Business Assessments

Ask Claude Code to help with your business strategy:

- "Help me figure out my attraction offer"
- "What lead generation strategy should I use?"
- "Run the upsell assessment for my coaching business"

## Available Tools

| Tool | What It Does |
|------|-------------|
| `get_interior_scoreboard` | Load your full self-knowledge state (scores, skills, quests, patterns) |
| `commit_progress` | Sync task progress from a session (RP, XP, identity statements, voice evidence) |
| `list_flows` | List available business assessments |
| `get_flow_questions` | Get questions for a specific assessment |
| `submit_assessment` | Submit and score an assessment |
| `get_user_context` | Get user project and completion data |
| `list_quests` | List available business quests |
| `complete_quest` | Complete a business quest |

## Troubleshooting

**"Invalid API key"** — Check that `FINDMYFLOW_API_KEY` is set in your environment and starts with `fmf_k1_`.

**"API key has been revoked"** — Generate a new key from your FindMyFlow profile.

**No MCP tools showing** — Restart Claude Code after installing the plugin. Verify the env var is set with `echo $FINDMYFLOW_API_KEY`.

## Links

- [FindMyFlow](https://findmyflow.nichuzz.com)
- [Full Agent Guide](https://findmyflow.nichuzz.com/llms-full.txt) — Complete methodology with scoring matrices (no API key needed)
