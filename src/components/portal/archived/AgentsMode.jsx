/**
 * AgentsMode.jsx — AI agent chat (Zarlo + Perry)
 *
 * Full-page chat experience with agent selector sidebar and task list.
 * Zarlo: Strategy & Research. Perry: Offer Specialist.
 * Streams responses via Supabase Edge Function → Claude API.
 */

import { useState, useRef, useEffect } from 'react'
import { AgentsProvider, useAgents, AGENTS } from '../../context/AgentsContext'
import { hapticLight, hapticSuccess } from '../../lib/haptics'

export default function AgentsMode() {
  return (
    <AgentsProvider>
      <AgentsModeInner />
    </AgentsProvider>
  )
}

function AgentsModeInner() {
  const {
    activeAgent, activeAgentId, setActiveAgentId,
    messages, agentTasks, isStreaming, loading,
    sendMessage, stopStreaming, clearConversation,
    addTask, toggleTask, deleteTask,
  } = useAgents()

  const [input, setInput] = useState('')
  const [newTask, setNewTask] = useState('')
  const [showTasks, setShowTasks] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
    hapticLight()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) {
    return <div className="portal-empty"><div className="portal-empty-desc">Loading agents...</div></div>
  }

  return (
    <div className="agents-layout">
      {/* Agent selector + tasks sidebar */}
      <div className="agents-sidebar">
        <div className="agents-selector">
          {Object.values(AGENTS).map(agent => (
            <button
              key={agent.id}
              className={`agents-agent-btn${activeAgentId === agent.id ? ' active' : ''}`}
              onClick={() => { setActiveAgentId(agent.id); hapticLight() }}
              style={{ '--agent-color': agent.color }}
            >
              <span className="agents-agent-avatar">{agent.avatar}</span>
              <div className="agents-agent-info">
                <div className="agents-agent-name">{agent.name}</div>
                <div className="agents-agent-role">{agent.role}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Tasks section */}
        <div className="agents-tasks-section">
          <button
            className="agents-tasks-toggle"
            onClick={() => setShowTasks(!showTasks)}
          >
            Tasks ({agentTasks.length})
            <span style={{ fontSize: 10 }}>{showTasks ? '▼' : '▶'}</span>
          </button>

          {showTasks && (
            <div className="agents-tasks-list">
              {agentTasks.map(task => (
                <div key={task.id} className="agents-task-item">
                  <div
                    className={`agents-task-check${task.status === 'done' ? ' done' : ''}`}
                    onClick={() => { toggleTask(task.id); hapticSuccess() }}
                  >
                    {task.status === 'done' ? '✓' : ''}
                  </div>
                  <span className={`agents-task-text${task.status === 'done' ? ' done' : ''}`}>
                    {task.title}
                  </span>
                  <button className="agents-task-delete" onClick={() => deleteTask(task.id)}>×</button>
                </div>
              ))}

              <form onSubmit={(e) => {
                e.preventDefault()
                if (newTask.trim()) { addTask(newTask); setNewTask(''); hapticSuccess() }
              }} className="agents-task-add">
                <input
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  placeholder="Add task..."
                  className="agents-task-input"
                />
              </form>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="agents-sidebar-actions">
          <button className="agents-clear-btn" onClick={clearConversation}>
            Clear chat
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="agents-chat">
        <div className="agents-messages">
          {messages.length === 0 && (
            <div className="agents-welcome">
              <span className="agents-welcome-avatar">{activeAgent.avatar}</span>
              <div className="agents-welcome-name">{activeAgent.name}</div>
              <div className="agents-welcome-role">{activeAgent.role}</div>
              <div className="agents-welcome-hint">
                {activeAgentId === 'zarlo'
                  ? 'Ask me about strategy, positioning, pricing, or growth for your experience business.'
                  : 'Ask me to help design your offer — pricing, bonuses, guarantees, value stacking.'}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`agents-msg ${msg.role}`}>
              {msg.role === 'assistant' && (
                <span className="agents-msg-avatar" style={{ background: activeAgent.color }}>
                  {activeAgent.avatar}
                </span>
              )}
              <div className="agents-msg-bubble">
                <div className="agents-msg-content">{msg.content || (isStreaming && i === messages.length - 1 ? '...' : '')}</div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="agents-input-bar">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${activeAgent.name}...`}
            className="agents-input"
            rows={1}
            disabled={isStreaming}
          />
          {isStreaming ? (
            <button className="agents-send-btn stop" onClick={stopStreaming}>■</button>
          ) : (
            <button
              className="agents-send-btn"
              onClick={handleSend}
              disabled={!input.trim()}
            >
              ↑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
