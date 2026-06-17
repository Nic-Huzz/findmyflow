/**
 * fix-npm-prefix.cjs — Fix npm global prefix on Mac to avoid sudo
 * Ported from claude-portal.
 *
 * When Node is installed via .pkg from nodejs.org, global packages
 * go to /usr/local/lib/node_modules (owned by root) which requires sudo.
 * This redirects to ~/.npm-global (user-owned).
 */

const os = require('os')
const path = require('path')
const fs = require('fs')
const { execSync, execFileSync } = require('child_process')

function fixNpmPrefix() {
  if (process.platform !== 'darwin') {
    return { fixed: false, reason: 'not-mac', prefix: null }
  }

  try {
    const currentPrefix = execSync('npm config get prefix', {
      encoding: 'utf8',
    }).trim()

    if (currentPrefix !== '/usr/local') {
      return { fixed: false, reason: 'already-ok', prefix: currentPrefix }
    }

    const newPrefix = path.join(os.homedir(), '.npm-global')

    fs.mkdirSync(newPrefix, { recursive: true })
    fs.mkdirSync(path.join(newPrefix, 'bin'), { recursive: true })
    fs.mkdirSync(path.join(newPrefix, 'lib'), { recursive: true })

    execFileSync('npm', ['config', 'set', 'prefix', newPrefix])

    // Add to PATH in .zshrc (macOS default shell)
    const zshrc = path.join(os.homedir(), '.zshrc')
    const pathLine = `export PATH="$HOME/.npm-global/bin:$PATH"`

    const existing = fs.existsSync(zshrc)
      ? fs.readFileSync(zshrc, 'utf8')
      : ''

    if (!existing.includes('.npm-global')) {
      fs.appendFileSync(
        zshrc,
        `\n# Added by Vibe Rise Setup\n${pathLine}\n`
      )
    }

    process.env.PATH = `${path.join(newPrefix, 'bin')}:${process.env.PATH}`

    return { fixed: true, reason: 'prefix-updated', prefix: newPrefix }
  } catch (err) {
    return { fixed: false, reason: 'error', error: err.message, prefix: null }
  }
}

module.exports = { fixNpmPrefix }
