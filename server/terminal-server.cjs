/**
 * Minimal Express server for Electron desktop app.
 * Serves the Vite build (dist/) and provides a terminal WebSocket.
 * Nothing else — all other features use Supabase directly.
 */

const express = require('express')
const path = require('path')
const http = require('http')
const { WebSocketServer } = require('ws')

// ─── node-pty (optional) ─────────────────────────────────────────────────

let pty = null
try {
  pty = require('node-pty')
} catch {
  console.log('  ⚠ node-pty not available — embedded terminal disabled')
}

function isPtyAvailable() {
  return pty !== null
}

function createTerminal(cwd) {
  if (!pty) throw new Error('node-pty is not available')

  const shell = process.platform === 'win32'
    ? 'powershell.exe'
    : (process.env.SHELL || (process.platform === 'darwin' ? 'zsh' : 'bash'))

  const env = {
    ...process.env,
    TERM: 'xterm-256color',
  }

  return pty.spawn(shell, [], {
    name: 'xterm-256color',
    cols: 80,
    rows: 24,
    cwd: cwd || process.env.HOME,
    env,
  })
}

function attachToWebSocket(ws, ptyProcess) {
  let detached = false

  const dataHandler = ptyProcess.onData((data) => {
    try { ws.send(JSON.stringify({ type: 'output', data })) } catch {}
  })

  const exitHandler = ptyProcess.onExit(({ exitCode }) => {
    try { ws.send(JSON.stringify({ type: 'exit', exitCode })) } catch {}
  })

  ws.on('message', (msg) => {
    if (detached) return
    try {
      const parsed = JSON.parse(msg.toString())
      switch (parsed.type) {
        case 'input':
          ptyProcess.write(parsed.data)
          break
        case 'resize':
          ptyProcess.resize(parsed.cols, parsed.rows)
          break
      }
    } catch {}
  })

  ws.on('close', () => {
    detached = true
    dataHandler.dispose()
    exitHandler.dispose()
    try { ptyProcess.kill() } catch {}
  })

  return { detach() { detached = true; dataHandler.dispose(); exitHandler.dispose() } }
}

// ─── Server ──────────────────────────────────────────────────────────────

// ─── Folder scanning ─────────────────────────────────────────────────────

const fs = require('fs')
const SCANNABLE_EXTENSIONS = new Set([
  '.md', '.txt', '.csv', '.json', '.html', '.pdf',
  '.doc', '.docx', '.xls', '.xlsx', '.pptx',
  '.js', '.jsx', '.ts', '.tsx', '.py', '.rb',
])
const MAX_SCAN_FILES = 200

function scanFolder(folderPath) {
  const files = []
  const byType = {}

  function walk(dir, depth) {
    if (depth > 4 || files.length >= MAX_SCAN_FILES) return
    let entries
    try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full, depth + 1)
      } else {
        const ext = path.extname(entry.name).toLowerCase()
        if (SCANNABLE_EXTENSIONS.has(ext) || ext === '') {
          files.push({ name: entry.name, path: full, ext: ext || '.txt' })
          byType[ext || '.txt'] = (byType[ext || '.txt'] || 0) + 1
        }
      }
      if (files.length >= MAX_SCAN_FILES) return
    }
  }

  walk(folderPath, 0)
  return { files, summary: { total: files.length, byType } }
}

// ─── Server ──────────────────────────────────────────────────────────────

function startServer(port) {
  return new Promise((resolve, reject) => {
    const app = express()
    app.use(express.json())

    // ── API routes (before static/SPA fallback) ──

    // Folder scan
    app.get('/api/folder-scan', (req, res) => {
      const folderPath = req.query.folderPath
      if (!folderPath || !folderPath.startsWith(process.env.HOME)) {
        return res.status(400).json({ error: 'Invalid folder path' })
      }
      try {
        const result = scanFolder(folderPath)
        res.json(result)
      } catch (err) {
        res.status(500).json({ error: err.message })
      }
    })

    // Folder picker (macOS AppleScript)
    app.get('/api/pick-folder', (req, res) => {
      if (process.platform !== 'darwin') {
        return res.json({ path: null, error: 'Folder picker only supported on macOS' })
      }
      const { execSync } = require('child_process')
      try {
        const result = execSync(
          'osascript -e \'tell application "System Events" to return POSIX path of (choose folder with prompt "Pick a folder")\'',
          { encoding: 'utf-8', timeout: 30000 }
        ).trim()
        res.json({ path: result || null })
      } catch {
        res.json({ path: null })
      }
    })

    // Read file
    app.get('/api/read-file', (req, res) => {
      const filePath = req.query.path
      if (!filePath || !filePath.startsWith(process.env.HOME)) {
        return res.status(400).json({ error: 'Invalid file path' })
      }
      try {
        const stat = fs.statSync(filePath)
        const content = fs.readFileSync(filePath, 'utf-8')
        res.json({
          content,
          path: filePath,
          name: path.basename(filePath),
          size: stat.size,
          modified: stat.mtime.toISOString(),
        })
      } catch (err) {
        res.status(404).json({ error: err.message })
      }
    })

    // List files in output directory
    app.get('/api/list-output', (req, res) => {
      const folderPath = req.query.folderPath
      if (!folderPath || !folderPath.startsWith(process.env.HOME)) {
        return res.status(400).json({ error: 'Invalid folder path' })
      }
      const outputDir = path.join(folderPath, 'output')
      try {
        if (!fs.existsSync(outputDir)) return res.json({ files: [] })
        const files = fs.readdirSync(outputDir)
          .filter(f => !f.startsWith('.'))
          .map(f => {
            const full = path.join(outputDir, f)
            const stat = fs.statSync(full)
            return { name: f, path: full, size: stat.size, modified: stat.mtime.toISOString() }
          })
          .sort((a, b) => new Date(b.modified) - new Date(a.modified))
        res.json({ files })
      } catch (err) {
        res.status(500).json({ error: err.message })
      }
    })

    // Serve the Vite build
    const distPath = path.join(__dirname, '..', 'dist')
    app.use(express.static(distPath))

    // SPA fallback — all non-file routes serve index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })

    const server = http.createServer(app)

    // Terminal WebSocket
    const wss = new WebSocketServer({ server, path: '/terminal' })
    let currentPty = null
    let currentAttachment = null

    wss.on('connection', (ws) => {
      if (!isPtyAvailable()) {
        ws.send(JSON.stringify({ type: 'error', message: 'Terminal not available' }))
        ws.close()
        return
      }

      // Clean up previous PTY if a new connection replaces it
      if (currentAttachment) currentAttachment.detach()
      if (currentPty) try { currentPty.kill() } catch {}

      currentPty = createTerminal(process.env.HOME)
      currentAttachment = attachToWebSocket(ws, currentPty)
    })

    server.on('error', reject)

    server.listen(port, () => {
      console.log(`  Desktop server on http://localhost:${port}`)
      if (isPtyAvailable()) console.log('  ✓ Terminal available')
      else console.log('  ⚠ Terminal unavailable (node-pty missing)')
      resolve(server)
    })
  })
}

module.exports = { startServer }
