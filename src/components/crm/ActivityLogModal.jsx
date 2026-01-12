/**
 * ActivityLogModal - Quick activity logging for deals
 * Supports: Call (voice/text), Text (screenshot), Email (screenshot)
 */
import { useState, useRef, useEffect } from 'react'
import { logContact, scheduleFollowUp } from '../../lib/crm'
import { analyzeActivityScreenshot, transcribeVoiceNote } from '../../lib/activityAnalysis'
import './ActivityLogModal.css'

const ACTIVITY_TYPES = [
  { id: 'call', icon: '📞', label: 'Call', description: 'Log a phone call' },
  { id: 'text', icon: '💬', label: 'Text/DM', description: 'Screenshot of conversation' },
  { id: 'email', icon: '📧', label: 'Email', description: 'Screenshot of email' },
]

export default function ActivityLogModal({ deal, userId, onClose, onActivityLogged }) {
  const [activityType, setActivityType] = useState(null)
  const [step, setStep] = useState('type') // type, input, analyzing, review
  const [inputMode, setInputMode] = useState(null) // voice, text, screenshot

  // Call logging state
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [callNotes, setCallNotes] = useState('')
  const [transcription, setTranscription] = useState('')

  // Screenshot state
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Extracted data
  const [extracted, setExtracted] = useState(null)
  const [editedNotes, setEditedNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [keyPoints, setKeyPoints] = useState([])

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const fileInputRef = useRef(null)

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [audioUrl, previewUrl])

  // Voice recording functions
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone access denied:', err)
      setError('Could not access microphone. Please allow microphone access or type your notes instead.')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  function clearRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscription('')
  }

  // Screenshot functions
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, GIF, or WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setError(null)
  }

  function clearScreenshot() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  // Analysis functions
  async function analyzeInput() {
    setLoading(true)
    setError(null)
    setStep('analyzing')

    try {
      let result

      if (activityType === 'call') {
        if (audioBlob) {
          // Transcribe voice note
          result = await transcribeVoiceNote(audioBlob, deal)
          setTranscription(result.transcription || '')
          setKeyPoints(result.keyPoints || [])
          setEditedNotes(result.summary || callNotes)
          if (result.suggestedFollowUp) {
            setFollowUpDate(result.suggestedFollowUp)
          }
        } else {
          // Just use typed notes
          setEditedNotes(callNotes)
          setKeyPoints([])
        }
      } else {
        // Analyze screenshot
        if (!selectedFile) {
          throw new Error('Please upload a screenshot')
        }
        result = await analyzeActivityScreenshot(selectedFile, activityType, deal)
        setExtracted(result)
        setKeyPoints(result.keyPoints || [])
        setEditedNotes(result.summary || '')
        if (result.suggestedFollowUp) {
          setFollowUpDate(result.suggestedFollowUp)
        }
      }

      setStep('review')
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err.message || 'Failed to analyze. Please try again.')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  // Save activity
  async function saveActivity() {
    setLoading(true)
    setError(null)

    try {
      // Build activity note
      const activityNote = buildActivityNote()

      // Log the contact
      await logContact(deal.id, userId, new Date().toISOString().split('T')[0], {
        type: activityType,
        notes: activityNote,
        keyPoints,
      })

      // Schedule follow-up if set
      if (followUpDate) {
        await scheduleFollowUp(deal.id, userId, followUpDate)
      }

      // Notify parent
      onActivityLogged?.({
        dealId: deal.id,
        type: activityType,
        notes: activityNote,
        followUpDate,
      })

      onClose()
    } catch (err) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to save activity')
    } finally {
      setLoading(false)
    }
  }

  function buildActivityNote() {
    const typeEmoji = ACTIVITY_TYPES.find(t => t.id === activityType)?.icon || '📝'
    const timestamp = new Date().toLocaleString()

    let note = `${typeEmoji} ${activityType.toUpperCase()} - ${timestamp}\n\n`

    if (editedNotes) {
      note += editedNotes + '\n\n'
    }

    if (keyPoints.length > 0) {
      note += 'Key Points:\n'
      keyPoints.forEach(point => {
        note += `• ${point}\n`
      })
    }

    return note.trim()
  }

  function selectActivityType(type) {
    setActivityType(type)
    if (type === 'call') {
      setStep('input')
      setInputMode('voice')
    } else {
      setStep('input')
      setInputMode('screenshot')
    }
  }

  function goBack() {
    if (step === 'input') {
      setActivityType(null)
      setStep('type')
      clearRecording()
      clearScreenshot()
      setCallNotes('')
      setError(null)
    } else if (step === 'review') {
      setStep('input')
    }
  }

  return (
    <div className="activity-log-overlay" onClick={onClose}>
      <div className="activity-log-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="activity-log-header">
          <div className="header-content">
            <span className="header-icon">📝</span>
            <div className="header-text">
              <h3>Log Activity</h3>
              <span className="header-deal">{deal.contact_name} • ${deal.value?.toLocaleString()}</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* Type Selection */}
        {step === 'type' && (
          <div className="activity-log-content">
            <p className="step-instruction">What type of activity?</p>
            <div className="activity-type-grid">
              {ACTIVITY_TYPES.map(type => (
                <button
                  key={type.id}
                  className="activity-type-btn"
                  onClick={() => selectActivityType(type.id)}
                >
                  <span className="type-icon">{type.icon}</span>
                  <span className="type-label">{type.label}</span>
                  <span className="type-desc">{type.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Call Input */}
        {step === 'input' && activityType === 'call' && (
          <div className="activity-log-content">
            <div className="input-tabs">
              <button
                className={`tab-btn ${inputMode === 'voice' ? 'active' : ''}`}
                onClick={() => setInputMode('voice')}
              >
                🎤 Voice Note
              </button>
              <button
                className={`tab-btn ${inputMode === 'text' ? 'active' : ''}`}
                onClick={() => setInputMode('text')}
              >
                ⌨️ Type Notes
              </button>
            </div>

            {inputMode === 'voice' && (
              <div className="voice-input">
                {!audioUrl ? (
                  <div className="voice-recorder">
                    <button
                      className={`record-btn ${isRecording ? 'recording' : ''}`}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? (
                        <>
                          <span className="record-pulse"></span>
                          <span className="record-icon">⏹️</span>
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <span className="record-icon">🎙️</span>
                          <span>Start Recording</span>
                        </>
                      )}
                    </button>
                    {isRecording && (
                      <p className="recording-hint">Recording... Speak naturally about the call</p>
                    )}
                  </div>
                ) : (
                  <div className="voice-preview">
                    <audio src={audioUrl} controls className="audio-player" />
                    <button className="clear-audio-btn" onClick={clearRecording}>
                      🗑️ Re-record
                    </button>
                  </div>
                )}
                <p className="input-tip">
                  💡 Just talk about what happened - AI will extract key points
                </p>
              </div>
            )}

            {inputMode === 'text' && (
              <div className="text-input">
                <textarea
                  value={callNotes}
                  onChange={e => setCallNotes(e.target.value)}
                  placeholder="What happened on the call? Key discussion points, next steps, concerns raised..."
                  rows={6}
                  autoFocus
                />
              </div>
            )}

            {error && <div className="input-error">{error}</div>}

            <div className="input-actions">
              <button className="back-btn" onClick={goBack}>← Back</button>
              <button
                className="continue-btn"
                onClick={analyzeInput}
                disabled={inputMode === 'voice' ? !audioUrl : !callNotes.trim()}
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Screenshot Input */}
        {step === 'input' && (activityType === 'text' || activityType === 'email') && (
          <div className="activity-log-content">
            <p className="step-instruction">
              Upload a screenshot of the {activityType === 'text' ? 'conversation' : 'email'}
            </p>

            <div
              className={`upload-zone ${selectedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="preview-container">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  <button
                    className="clear-preview"
                    onClick={(e) => { e.stopPropagation(); clearScreenshot() }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <span className="upload-icon">📷</span>
                  <p className="upload-text">Tap to upload screenshot</p>
                  <p className="upload-hint">JPEG, PNG, GIF, WebP (max 5MB)</p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {error && <div className="input-error">{error}</div>}

            <div className="input-actions">
              <button className="back-btn" onClick={goBack}>← Back</button>
              <button
                className="continue-btn"
                onClick={analyzeInput}
                disabled={!selectedFile}
              >
                Analyze →
              </button>
            </div>
          </div>
        )}

        {/* Analyzing */}
        {step === 'analyzing' && (
          <div className="activity-log-content analyzing">
            <div className="analyzing-animation">
              <div className="analyzing-spinner"></div>
              <span className="analyzing-icon">🤖</span>
            </div>
            <h4>Analyzing...</h4>
            <p>Extracting key information</p>
          </div>
        )}

        {/* Review */}
        {step === 'review' && (
          <div className="activity-log-content review">
            {/* Key Points */}
            {keyPoints.length > 0 && (
              <div className="review-section">
                <label>Key Points Extracted</label>
                <ul className="key-points-list">
                  {keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transcription (for voice) */}
            {transcription && (
              <div className="review-section">
                <label>Transcription</label>
                <div className="transcription-box">{transcription}</div>
              </div>
            )}

            {/* Editable Notes */}
            <div className="review-section">
              <label>Activity Notes</label>
              <textarea
                value={editedNotes}
                onChange={e => setEditedNotes(e.target.value)}
                rows={4}
                placeholder="Add or edit notes..."
              />
            </div>

            {/* Follow-up Date */}
            <div className="review-section">
              <label>Schedule Follow-up (optional)</label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
              {extracted?.suggestedFollowUp && !followUpDate && (
                <button
                  className="suggest-btn"
                  onClick={() => setFollowUpDate(extracted.suggestedFollowUp)}
                >
                  💡 AI suggests: {new Date(extracted.suggestedFollowUp).toLocaleDateString()}
                </button>
              )}
            </div>

            {error && <div className="input-error">{error}</div>}

            <div className="review-actions">
              <button className="back-btn" onClick={goBack}>← Back</button>
              <button
                className="save-btn"
                onClick={saveActivity}
                disabled={loading}
              >
                {loading ? 'Saving...' : '✓ Log Activity'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
