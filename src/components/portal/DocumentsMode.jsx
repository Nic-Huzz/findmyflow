/**
 * DocumentsMode.jsx — Document processing for experience creators
 *
 * Pick a folder → choose an outcome → add context → Go (sends to terminal).
 * Output panel shows results from Claude's output files.
 * Desktop-only (requires Express server for folder scan + file read).
 */

import { useState, useEffect, useCallback } from 'react'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

const OUTCOMES = [
  { key: 'summarize_feedback', name: 'Summarize Feedback', icon: '📋', description: 'Consolidate attendee feedback into key themes and action items' },
  { key: 'draft_email', name: 'Draft Email Copy', icon: '✉️', description: 'Create email sequences, newsletters, or follow-up messages from notes' },
  { key: 'create_deck', name: 'Create Pitch Deck', icon: '🎯', description: 'Turn talking points into a structured presentation outline' },
  { key: 'extract_insights', name: 'Extract Insights', icon: '💡', description: 'Pull out key quotes, data points, and patterns from documents' },
  { key: 'compare', name: 'Compare Documents', icon: '⚖️', description: 'Analyze differences and similarities across multiple files' },
  { key: 'transform', name: 'Transform Format', icon: '🔄', description: 'Convert between formats — notes to runsheet, transcript to blog post, etc.' },
]

function assemblePrompt({ folderPath, outcome, freeform, context, fileCount }) {
  const parts = []

  parts.push(`Work with the documents in: ${folderPath}`)
  parts.push(`There are ${fileCount} files in this folder.`)
  parts.push('')

  if (outcome) {
    parts.push(`## Task: ${outcome.name}`)
    parts.push(outcome.description)
    parts.push('')
  }

  if (freeform) {
    parts.push(`## Specific Instructions`)
    parts.push(freeform)
    parts.push('')
  }

  if (context) {
    parts.push(`## Additional Context`)
    parts.push(context)
    parts.push('')
  }

  parts.push(`## Output`)
  parts.push(`Save the result to: ${folderPath}/output/${outcome?.key || 'result'}-${new Date().toISOString().split('T')[0]}.md`)
  parts.push(`Use markdown formatting. Be thorough and actionable.`)

  return parts.join('\n')
}

export default function DocumentsMode({ runInTerminal }) {
  const [folderPath, setFolderPath] = useState('')
  const [folderScan, setFolderScan] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState(null)
  const [freeform, setFreeform] = useState('')
  const [context, setContext] = useState('')
  const [outputFiles, setOutputFiles] = useState([])
  const [outputContent, setOutputContent] = useState(null)
  const [loadingOutput, setLoadingOutput] = useState(false)

  const isDesktop = typeof window !== 'undefined' && !!window.electronAPI?.isElectron

  const pickFolder = useCallback(async () => {
    try {
      const res = await fetch('/api/pick-folder')
      const data = await res.json()
      if (data.path) {
        setFolderPath(data.path)
        hapticLight()
      }
    } catch (err) {
      console.warn('Folder picker failed:', err.message)
    }
  }, [])

  const scanFolder = useCallback(async () => {
    if (!folderPath) return
    setScanning(true)
    try {
      const res = await fetch(`/api/folder-scan?folderPath=${encodeURIComponent(folderPath)}`)
      const data = await res.json()
      setFolderScan(data)
    } catch (err) {
      console.warn('Folder scan failed:', err.message)
    }
    setScanning(false)
  }, [folderPath])

  useEffect(() => {
    if (folderPath) scanFolder()
  }, [folderPath, scanFolder])

  const handleGo = useCallback(() => {
    if (!folderPath || !folderScan || (!selectedOutcome && !freeform)) return

    const prompt = assemblePrompt({
      folderPath,
      outcome: selectedOutcome,
      freeform,
      context,
      fileCount: folderScan.summary.total,
    })

    if (runInTerminal) {
      runInTerminal(prompt)
      hapticSuccess()
    } else {
      navigator.clipboard.writeText(prompt)
      hapticSuccess()
    }
  }, [folderPath, folderScan, selectedOutcome, freeform, context, runInTerminal])

  const checkOutput = useCallback(async () => {
    if (!folderPath) return
    setLoadingOutput(true)
    try {
      const res = await fetch(`/api/list-output?folderPath=${encodeURIComponent(folderPath)}`)
      const data = await res.json()
      setOutputFiles(data.files || [])

      // Auto-load the most recent file
      if (data.files?.length > 0) {
        const latest = data.files[0]
        const fileRes = await fetch(`/api/read-file?path=${encodeURIComponent(latest.path)}`)
        const fileData = await fileRes.json()
        setOutputContent(fileData)
      }
    } catch (err) {
      console.warn('Output check failed:', err.message)
    }
    setLoadingOutput(false)
  }, [folderPath])

  const loadOutputFile = useCallback(async (filePath) => {
    try {
      const res = await fetch(`/api/read-file?path=${encodeURIComponent(filePath)}`)
      const data = await res.json()
      setOutputContent(data)
    } catch (err) {
      console.warn('File read failed:', err.message)
    }
  }, [])

  if (!isDesktop) {
    return (
      <div className="portal-empty">
        <div className="portal-empty-title">Desktop Required</div>
        <div className="portal-empty-desc">
          Documents mode processes your files locally using AI. Download the desktop app to use it.
        </div>
      </div>
    )
  }

  return (
    <div className="docs-layout">
      {/* Left: controls */}
      <div className="docs-sidebar">
        {/* Step 1: Folder */}
        <div className="docs-section">
          <div className="docs-section-header">
            <span className="docs-step">1</span> Pick a folder
          </div>
          <div className="docs-folder-controls">
            <button className="portal-mode-btn" onClick={pickFolder}>Browse...</button>
            <input
              type="text"
              value={folderPath}
              onChange={e => setFolderPath(e.target.value)}
              placeholder="/path/to/documents"
              className="docs-path-input"
            />
          </div>
          {folderScan && (
            <div className="docs-folder-info">
              {scanning ? 'Scanning...' : `${folderScan.summary.total} files`}
              {folderScan.summary.byType && (
                <span className="docs-folder-types">
                  {Object.entries(folderScan.summary.byType).map(([ext, count]) =>
                    `${count}${ext}`
                  ).join(' · ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Outcome */}
        <div className="docs-section">
          <div className="docs-section-header">
            <span className="docs-step">2</span> Choose an outcome
          </div>
          <div className="docs-outcomes">
            {OUTCOMES.map(outcome => (
              <button
                key={outcome.key}
                className={`docs-outcome-btn${selectedOutcome?.key === outcome.key ? ' active' : ''}`}
                onClick={() => {
                  setSelectedOutcome(prev => prev?.key === outcome.key ? null : outcome)
                  hapticLight()
                }}
              >
                <span>{outcome.icon}</span>
                <span>{outcome.name}</span>
              </button>
            ))}
          </div>
          <textarea
            value={freeform}
            onChange={e => setFreeform(e.target.value)}
            placeholder="Or describe what you want..."
            className="docs-textarea"
            rows={2}
          />
        </div>

        {/* Step 3: Context + Go */}
        <div className="docs-section">
          <div className="docs-section-header">
            <span className="docs-step">3</span> Add context & go
          </div>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Any extra context (audience, tone, format preferences)..."
            className="docs-textarea"
            rows={2}
          />
          <button
            className="docs-go-btn"
            onClick={handleGo}
            disabled={!folderPath || (!selectedOutcome && !freeform)}
          >
            {runInTerminal ? '▶ Go' : '📋 Copy Prompt'}
            {folderScan && ` · ${folderScan.summary.total} files`}
            {selectedOutcome && ` · ${selectedOutcome.name}`}
          </button>
        </div>
      </div>

      {/* Right: output */}
      <div className="docs-output">
        {!outputContent && outputFiles.length === 0 && (
          <div className="portal-empty" style={{ minHeight: 200 }}>
            <div className="portal-empty-title">Output</div>
            <div className="portal-empty-desc">
              Pick a folder, choose an outcome, and click Go. Results will appear here.
            </div>
            {folderPath && (
              <button className="task-action-btn" onClick={checkOutput} disabled={loadingOutput}>
                {loadingOutput ? 'Checking...' : 'Check for output'}
              </button>
            )}
          </div>
        )}

        {outputFiles.length > 0 && !outputContent && (
          <div>
            <div className="docs-output-header">
              <span>Output files</span>
              <button className="task-action-btn" onClick={checkOutput}>Refresh</button>
            </div>
            {outputFiles.map(file => (
              <div
                key={file.path}
                className="docs-output-file"
                onClick={() => loadOutputFile(file.path)}
              >
                <span>{file.name}</span>
                <span className="docs-output-file-date">
                  {new Date(file.modified).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        {outputContent && (
          <div>
            <div className="docs-output-header">
              <span>{outputContent.name}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="task-action-btn" onClick={() => {
                  navigator.clipboard.writeText(outputContent.content)
                  hapticSuccess()
                }}>Copy</button>
                <button className="task-action-btn" onClick={() => setOutputContent(null)}>Back</button>
                <button className="task-action-btn" onClick={checkOutput}>Refresh</button>
              </div>
            </div>
            <div className="docs-output-body">
              <pre>{outputContent.content}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
