/**
 * install-tools.cjs — One-click tool installation for AI Build Engine
 * Ported from claude-portal, adapted for Vibe Rise.
 * Installs: Claude Code, Vercel CLI
 */

const { spawn } = require('child_process')
const { getExpandedPath } = require('./detect-tools.cjs')

const INSTALL_COMMANDS = {
  claude: {
    mac: { type: 'npm', package: '@anthropic-ai/claude-code' },
    win32: { type: 'npm', package: '@anthropic-ai/claude-code' },
    linux: { type: 'npm', package: '@anthropic-ai/claude-code' },
  },
  vercel: {
    mac: { type: 'npm', package: 'vercel' },
    win32: { type: 'npm', package: 'vercel' },
    linux: { type: 'npm', package: 'vercel' },
  },
}

// Map platform names
function getOS() {
  const p = process.platform
  if (p === 'darwin') return 'mac'
  if (p === 'win32') return 'win32'
  return 'linux'
}

async function installTool(toolId, onProgress) {
  const os = getOS()
  const config = INSTALL_COMMANDS[toolId]

  if (!config) {
    return { success: false, error: `Unknown tool: ${toolId}` }
  }

  const osConfig = config[os]
  if (!osConfig) {
    return { success: false, error: `No install method for ${toolId} on ${os}` }
  }

  try {
    switch (osConfig.type) {
      case 'npm':
        return await installViaNpm(osConfig.package, onProgress)
      default:
        return { success: false, error: `Unknown install type: ${osConfig.type}` }
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function installViaNpm(packageName, onProgress) {
  const os = require('os')
  const path = require('path')
  const fs = require('fs')

  // Check if npm prefix needs fixing (avoid /usr/local which requires sudo)
  let npmArgs = ['install', '-g', packageName]
  try {
    const { execSync } = require('child_process')
    const currentPrefix = execSync('npm config get prefix', {
      encoding: 'utf8',
      timeout: 5000,
      env: { ...process.env, PATH: getExpandedPath() },
    }).trim()

    if (currentPrefix === '/usr/local') {
      const userPrefix = path.join(os.homedir(), '.npm-global')
      fs.mkdirSync(path.join(userPrefix, 'bin'), { recursive: true })
      fs.mkdirSync(path.join(userPrefix, 'lib'), { recursive: true })
      npmArgs = ['install', '-g', '--prefix', userPrefix, packageName]
      onProgress(`Using ${userPrefix} to avoid permission issues...`)

      try {
        execSync(`npm config set prefix "${userPrefix}"`, {
          timeout: 5000,
          env: { ...process.env, PATH: getExpandedPath() },
        })
      } catch {}

      const binDir = path.join(userPrefix, 'bin')
      if (!process.env.PATH.includes(binDir)) {
        process.env.PATH = `${binDir}:${process.env.PATH}`
      }
    }
  } catch {}

  onProgress(`Installing ${packageName} via npm...`)

  return new Promise((resolve) => {
    const child = spawn('npm', npmArgs, {
      env: { ...process.env, PATH: getExpandedPath() },
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000,
    })

    let stderr = ''

    child.stdout.on('data', () => {})

    child.stderr.on('data', (data) => {
      stderr += data.toString()
      const line = data.toString().trim()
      if (line) onProgress(line)
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
      } else {
        resolve({
          success: false,
          error: stderr || `npm install exited with code ${code}`,
        })
      }
    })

    child.on('error', (err) => {
      resolve({ success: false, error: err.message })
    })
  })
}

module.exports = { installTool, INSTALL_COMMANDS }
