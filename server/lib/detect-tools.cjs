/**
 * detect-tools.cjs — Detect CLI tools required for AI Build Engine
 * Ported from claude-portal, adapted for Vibe Rise creator portal.
 * Detects: Node.js, Claude Code, Vercel CLI
 */

const { execSync } = require('child_process')

const TOOLS = [
  {
    id: 'node',
    name: 'Node.js',
    command: 'node --version',
    parse: (out) => out.trim(),
    required: true,
  },
  {
    id: 'claude',
    name: 'Claude Code',
    command: 'claude --version',
    parse: (out) => {
      const match = out.match(/(\d+\.\d+\.\d+)/)
      return match ? `v${match[1]}` : out.trim()
    },
    required: true,
  },
  {
    id: 'vercel',
    name: 'Vercel CLI',
    command: 'vercel --version',
    parse: (out) => {
      const match = out.match(/(\d+\.\d+\.\d+)/)
      return match ? `v${match[1]}` : out.trim()
    },
    required: false,
  },
]

function detectTool(tool) {
  // In Electron, Node is embedded — report as installed
  if (tool.id === 'node' && process.versions.electron) {
    return {
      id: tool.id,
      name: tool.name,
      installed: true,
      version: process.version,
      required: tool.required,
    }
  }

  try {
    const output = execSync(tool.command, {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: getExpandedPath(),
        DISABLE_AUTOUPDATER: '1',
      },
    })
    const version = tool.parse(output)
    return {
      id: tool.id,
      name: tool.name,
      installed: !!version,
      version: version || null,
      required: tool.required,
    }
  } catch {
    return {
      id: tool.id,
      name: tool.name,
      installed: false,
      version: null,
      required: tool.required,
    }
  }
}

function detectAll() {
  const results = TOOLS.map(detectTool)
  return {
    platform: process.platform,
    tools: results,
    allReady: results.filter(t => t.required).every(t => t.installed),
  }
}

// Expand PATH to include common install locations (NVM, homebrew, npm-global)
function getExpandedPath() {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')
  const home = os.homedir()
  const existing = process.env.PATH || ''

  const extraPaths = [
    path.join(home, '.npm-global', 'bin'),
    '/usr/local/bin',
    '/opt/homebrew/bin',
    path.join(home, '.local', 'bin'),
    path.join(home, '.claude', 'local'),
  ]

  // Expand NVM paths
  const nvmVersionsDir = path.join(home, '.nvm', 'versions', 'node')
  try {
    if (fs.existsSync(nvmVersionsDir)) {
      const versions = fs.readdirSync(nvmVersionsDir)
      versions.forEach((v) => extraPaths.push(path.join(nvmVersionsDir, v, 'bin')))
    }
  } catch {}

  return [...extraPaths, existing].join(path.delimiter)
}

module.exports = { detectAll, detectTool, TOOLS, getExpandedPath }
