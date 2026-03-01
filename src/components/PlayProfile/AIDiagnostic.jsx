import { useState, useRef, useEffect } from 'react'
import { runDiagnosticExchange } from '../../lib/founderDnaAI'

function renderParagraphs(text) {
  if (!text) return null
  const cleaned = text
    .replace(/\*\*/g, '')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^#+\s*/gm, '')
  const paras = cleaned.split(/\n\n+/).filter(Boolean)
  if (paras.length <= 1) return cleaned
  return paras.map((p, i) => <p key={i} style={{ margin: '0 0 12px' }}>{p}</p>)
}

export default function AIDiagnostic({
  dnaCode, archetype,
  founder, stuckPoint,
  followUpQA, openText,
  onDiagnosisComplete, onBack,
}) {
  const [messages, setMessages] = useState([])
  const [responseOptions, setResponseOptions] = useState([])
  const [isThinking, setIsThinking] = useState(true)
  const [diagnosis, setDiagnosis] = useState(null)
  const [freeText, setFreeText] = useState('')
  const exchangeRef = useRef(0)
  const scrollRef = useRef(null)
  const hasStarted = useRef(false)

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isThinking, diagnosis])

  // Start first exchange on mount
  useEffect(() => {
    if (hasStarted.current) return
    hasStarted.current = true
    runExchange(0, [])
  }, [])

  async function runExchange(exchNum, history) {
    setIsThinking(true)
    setResponseOptions([])

    const result = await runDiagnosticExchange({
      dnaCode, archetype,
      founderName: founder.name,
      founderBio: founder.bio,
      founderOneLiner: founder.oneLiner,
      stuckPointName: stuckPoint.name,
      stuckPointDescription: stuckPoint.description,
      followUpQA, openText,
      conversationHistory: history,
      exchangeNumber: exchNum,
    })

    setIsThinking(false)
    setMessages(prev => [...prev, { role: 'ai', content: result.message }])
    exchangeRef.current = exchNum + 1

    if (result.isDiagnosisReady && result.diagnosis) {
      setDiagnosis(result.diagnosis)
    } else {
      setResponseOptions(result.responseOptions || [])
    }
  }

  function handleSelectOption(optionText) {
    const newMessages = [...messages, { role: 'user', content: optionText }]
    setMessages(newMessages)
    setResponseOptions([])
    runExchange(exchangeRef.current, newMessages)
  }

  function handleSendFreeText() {
    if (!freeText.trim()) return
    const text = freeText.trim()
    setFreeText('')
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setResponseOptions([])
    runExchange(exchangeRef.current, newMessages)
  }

  function handleShowChallenge() {
    onDiagnosisComplete(diagnosis, messages)
  }

  return (
    <div style={{ paddingTop: 8, paddingBottom: 40 }}>
      <button
        className="pp-btn-ghost"
        onClick={onBack}
        disabled={isThinking}
        style={{ fontSize: 13, padding: '4px 0', marginBottom: 12, width: 'auto', border: 'none', opacity: isThinking ? 0.4 : 1 }}
      >
        Back
      </button>

      <div className="pp-fade-in-up" style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2>{founder.name} is thinking about your situation...</h2>
      </div>

      <div className="pp-chat-messages">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={msg.role === 'ai' ? 'pp-chat-ai pp-fade-in-up' : 'pp-chat-user pp-fade-in-up'}
          >
            {renderParagraphs(msg.content)}
          </div>
        ))}

        {isThinking && (
          <div className="pp-chat-ai pp-thinking">
            <div className="pp-thinking-dot" />
            <div className="pp-thinking-dot" />
            <div className="pp-thinking-dot" />
          </div>
        )}
      </div>

      {/* Response options */}
      {responseOptions.length > 0 && !isThinking && (
        <div className="pp-fade-in-up">
          <div className="pp-response-prompt">Pick a response:</div>
          <div className="pp-response-options">
            {responseOptions.map((option, i) => (
              <div
                key={i}
                className="pp-response-card"
                onClick={() => handleSelectOption(option)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), handleSelectOption(option))}
              >
                {option}
              </div>
            ))}
          </div>

          <div className="pp-text-input-row">
            <input
              className="pp-text-input"
              type="text"
              placeholder="Or type something else..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendFreeText()}
            />
            <button
              className="pp-send-btn"
              onClick={handleSendFreeText}
              disabled={!freeText.trim()}
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Diagnosis landed */}
      {diagnosis && !isThinking && (
        <div className="pp-fade-in-up" style={{ marginTop: 8 }}>
          <div className="pp-diagnosis-card">
            <div className="pp-diagnosis-label">Diagnosis</div>
            <div className="pp-diagnosis-text">{renderParagraphs(diagnosis)}</div>
          </div>

          <div style={{ marginTop: 20 }}>
            <button className="pp-btn-gold" onClick={handleShowChallenge}>
              Show me what {founder.name} would do
            </button>
          </div>
        </div>
      )}

      <div ref={scrollRef} />
    </div>
  )
}
