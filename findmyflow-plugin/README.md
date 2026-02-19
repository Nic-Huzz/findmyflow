# FindMyFlow Plugin for Claude Code

Run FindMyFlow's business strategy assessments directly from Claude Code. Your AI assistant guides you through a natural conversation and saves scored results to your FindMyFlow account.

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

Once installed, just ask Claude Code to help with your business strategy:

- "Help me figure out my attraction offer"
- "What lead generation strategy should I use?"
- "Run the upsell assessment for my coaching business"
- "I need help with my offer ecosystem"

Claude will guide you through a conversational assessment and save the results to your FindMyFlow dashboard.

## Available Assessments

| Assessment | What It Determines |
|------------|-------------------|
| Leads Strategy | Best lead generation method for your resources |
| Lead Magnet | What type of free value to offer prospects |
| Attraction Offer | Your front-end customer acquisition offer |
| Upsell | How to increase revenue per customer |
| Downsell | How to capture otherwise-lost sales |
| Continuity | Your recurring revenue model |

## Troubleshooting

**"Invalid API key"** — Check that `FINDMYFLOW_API_KEY` is set in your environment and starts with `fmf_k1_`.

**"API key has been revoked"** — Generate a new key from your FindMyFlow profile.

**No MCP tools showing** — Restart Claude Code after installing the plugin. Verify the env var is set with `echo $FINDMYFLOW_API_KEY`.

## Links

- [FindMyFlow](https://findmyflow.nichuzz.com)
- [Full Agent Guide](https://findmyflow.nichuzz.com/llms-full.txt) — Complete methodology with scoring matrices (no API key needed)
