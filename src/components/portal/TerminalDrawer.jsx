/**
 * TerminalDrawer.jsx — Slide-up terminal panel (desktop-only)
 *
 * Connects via WebSocket to the Express terminal server at /terminal.
 * Slides up from bottom when opened, dismissible.
 * Can receive prompts to inject into the terminal.
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function TerminalDrawer({ isOpen, onClose, pendingPrompt, onPromptSent }) {
  const terminalRef = useRef(null)
  const containerRef = useRef(null)
  const wsRef = useRef(null)
  const fitAddonRef = useRef(null)
  const [connected, setConnected] = useState(false)

  // Initialize terminal + WebSocket
  useEffect(() => {
    if (!isOpen || terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#0d0d0d',
        foreground: '#e0e0e0',
        cursor: '#5e17eb',
        selectionBackground: 'rgba(94, 23, 235, 0.3)',
      },
      scrollback: 5000,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    terminalRef.current = term
    fitAddonRef.current = fitAddon

    if (containerRef.current) {
      term.open(containerRef.current)
      fitAddon.fit()
    }

    // Connect WebSocket to same origin
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/terminal`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      // Send initial size
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }))
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        switch (msg.type) {
          case 'output':
            term.write(msg.data)
            break
          case 'exit':
            term.write('\r\n[Process exited]\r\n')
            break
          case 'error':
            term.write(`\r\n[Error: ${msg.message}]\r\n`)
            break
        }
      } catch {}
    }

    ws.onclose = () => setConnected(false)
    ws.onerror = () => setConnected(false)

    // Terminal input → WebSocket
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'input', data }))
      }
    })

    // Handle resize
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }))
      }
    })

    return () => {
      ws.close()
      term.dispose()
      terminalRef.current = null
      wsRef.current = null
      fitAddonRef.current = null
      setConnected(false)
    }
  }, [isOpen])

  // Refit on open/resize
  useEffect(() => {
    if (!isOpen || !fitAddonRef.current) return

    const handleResize = () => {
      try { fitAddonRef.current.fit() } catch {}
    }

    // Fit after the slide animation completes
    const timer = setTimeout(handleResize, 350)
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  // Send pending prompt when terminal is ready
  useEffect(() => {
    if (!pendingPrompt || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return

    // Small delay to ensure terminal is ready
    const timer = setTimeout(() => {
      wsRef.current.send(JSON.stringify({ type: 'input', data: pendingPrompt + '\n' }))
      if (onPromptSent) onPromptSent()
    }, 100)

    return () => clearTimeout(timer)
  }, [pendingPrompt, connected, onPromptSent])

  if (!isOpen) return null

  return (
    <div className="terminal-drawer">
      <div className="terminal-drawer-header">
        <span className="terminal-drawer-title">
          Terminal {connected ? '●' : '○'}
        </span>
        <button className="terminal-drawer-close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="terminal-drawer-body" ref={containerRef} />
    </div>
  )
}
