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

function startServer(port) {
  return new Promise((resolve, reject) => {
    const app = express()

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
