import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './auth/AuthProvider'
import './HybridEssenceFlow.css' // Use the same CSS as hybrid essence flow

const HybridCombinedFlow = () => {
  const { user } = useAuth()
  const [phase, setPhase] = useState('intro') // 'intro', 'protective-swipe', 'protective-battle', 'protective-result', 'essence-swipe', 'essence-battle', 'essence-result', 'final-result'
  const [messages, setMessages] = useState([])
  const [essenceArchetypes, setEssenceArchetypes] = useState([])
  const [protectiveArchetypes, setProtectiveArchetypes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipedRight, setSwipedRight] = useState([])
  const [originalArchetypeCount, setOriginalArchetypeCount] = useState(0)
  const [totalBattlesCompleted, setTotalBattlesCompleted] = useState(0)
  const [battleHistory, setBattleHistory] = useState([]) // Store previous states for undo
  const [essenceResult, setEssenceResult] = useState(null)
  const [protectiveResult, setProtectiveResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  const messagesEndRef = useRef(null)
  const cardRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load archetype data
  useEffect(() => {
    const loadArchetypes = async () => {
      try {
        const [essenceResponse, protectiveResponse] = await Promise.all([
          fetch('/Essence-test.json'),
          fetch('/Protective-test.json')
        ])
        
        const essenceData = await essenceResponse.json()
        const protectiveData = await protectiveResponse.json()
        
        setEssenceArchetypes(essenceData.archetypes || [])
        setProtectiveArchetypes(protectiveData.archetypes || [])
        setLoading(false)
      } catch (error) {
        console.error('Error loading archetypes:', error)
        setLoading(false)
      }
    }
    
    loadArchetypes()
  }, [])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Start with intro messages
  useEffect(() => {
    if (!loading && phase === 'intro') {
      const introMessages = [
        {
          id: 'ai-intro-1',
          isAI: true,
          text: "Hi! I'm here to help you discover both your Protective and Essence Archetypes.\n\nWe'll start with your Protective patterns - the ways you've learned to protect yourself, then discover your Essence - who you are at your core.\n\nWhat's your name?",
          timestamp: new Date().toLocaleTimeString()
        }
      ]
      
      setMessages(introMessages)
    }
  }, [loading, phase, user])

  // Handle input submission
  const handleSubmit = () => {
    if (!inputText.trim() || isLoading) return

    const trimmedInput = inputText.trim()
    setIsLoading(true)

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      isAI: false,
      text: trimmedInput,
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')

    // Add AI response
    setTimeout(() => {
      const aiMessage = {
        id: `ai-${Date.now()}`,
        isAI: true,
        text: `Nice to meet you, ${trimmedInput}! 🛡️\n\nLet's start with your Protective Archetype - the patterns that developed to protect you from pain. I'll show you 5 different protective patterns. Swipe right on the ones that sound familiar, left on the ones that don't.\n\nReady to discover your protective patterns? Let's go!`,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
      setPhase('protective-swipe')
    }, 1000)
  }

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle swipe right
  const handleSwipeRight = () => {
    if (phase === 'protective-swipe' && currentIndex < protectiveArchetypes.length) {
      const currentArchetype = protectiveArchetypes[currentIndex]
      setSwipedRight(prev => [...prev, currentArchetype])
      setCurrentIndex(prev => prev + 1)
    } else if (phase === 'essence-swipe' && currentIndex < essenceArchetypes.length) {
      const currentArchetype = essenceArchetypes[currentIndex]
      setSwipedRight(prev => [...prev, currentArchetype])
      setCurrentIndex(prev => prev + 1)
    }
  }

  // Handle swipe left
  const handleSwipeLeft = () => {
    setCurrentIndex(prev => prev + 1)
  }

  // Touch/Mouse handlers
  const handleStart = (e) => {
    isDragging.current = true
    startX.current = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
    currentX.current = startX.current
  }

  const handleMove = (e) => {
    if (!isDragging.current) return
    
    currentX.current = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
    const deltaX = currentX.current - startX.current
    
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${deltaX}px) rotate(${deltaX * 0.1}deg)`
      cardRef.current.style.opacity = Math.max(0.3, 1 - Math.abs(deltaX) / 200)
    }
  }

  const handleEnd = () => {
    if (!isDragging.current) return
    
    isDragging.current = false
    const deltaX = currentX.current - startX.current
    const threshold = 100
    
    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        handleSwipeRight()
      } else {
        handleSwipeLeft()
      }
    }
    
    if (cardRef.current) {
      cardRef.current.style.transform = ''
      cardRef.current.style.opacity = ''
    }
  }

  // Check if swipe phase is complete
  useEffect(() => {
    if (phase === 'protective-swipe' && currentIndex >= protectiveArchetypes.length) {
      if (swipedRight.length === 0) {
        // Restart if no selections
        setCurrentIndex(0)
        setSwipedRight([])
        setMessages(prev => [...prev, {
          id: 'ai-restart',
          isAI: true,
          text: "Please select at least one protective pattern that resonates with you! Let's try again.",
          timestamp: new Date().toLocaleTimeString()
        }])
      } else if (swipedRight.length === 1) {
        // Single selection - show result
        setProtectiveResult(swipedRight[0])
        setPhase('protective-result')
      } else {
        // Multiple selections - start battle phase
        setOriginalArchetypeCount(swipedRight.length)
        setTotalBattlesCompleted(0)
        setPhase('protective-battle')
      }
    } else if (phase === 'essence-swipe' && currentIndex >= essenceArchetypes.length) {
      if (swipedRight.length === 0) {
        // Restart if no selections
        setCurrentIndex(0)
        setSwipedRight([])
        setMessages(prev => [...prev, {
          id: 'ai-restart',
          isAI: true,
          text: "Please select at least one essence archetype that resonates with you! Let's try again.",
          timestamp: new Date().toLocaleTimeString()
        }])
      } else if (swipedRight.length === 1) {
        // Single selection - show result
        setEssenceResult(swipedRight[0])
        setPhase('essence-result')
      } else {
        // Multiple selections - start battle phase
        setOriginalArchetypeCount(swipedRight.length)
        setTotalBattlesCompleted(0)
        setPhase('essence-battle')
      }
    }
  }, [currentIndex, essenceArchetypes.length, protectiveArchetypes.length, swipedRight.length, phase])

  // Get next battle pair for sequential elimination
  const getNextBattlePair = () => {
    if (swipedRight.length <= 1) return null
    return [swipedRight[0], swipedRight[1]]
  }

  // Handle battle selection
  const handleBattleSelection = (selectedArchetype) => {
    console.log('Battle selection clicked:', selectedArchetype.name)
    
    const currentPair = getNextBattlePair()
    if (!currentPair) return
    
    // Save current state to history before making changes
    const currentState = {
      swipedRight: [...swipedRight],
      totalBattlesCompleted: totalBattlesCompleted,
      timestamp: Date.now()
    }
    setBattleHistory(prev => [...prev, currentState])
    
    const winner = selectedArchetype
    const loser = currentPair.find(archetype => archetype !== selectedArchetype)
    
    console.log('Winner:', winner.name, 'Loser:', loser.name)
    
    // Remove loser from remaining archetypes
    const updatedSwipedRight = swipedRight.filter(archetype => archetype !== loser)
    console.log('Updated swiped right:', updatedSwipedRight.map(a => a.name))
    
    // Update state
    setSwipedRight(updatedSwipedRight)
    setTotalBattlesCompleted(prev => {
      const newTotal = prev + 1
      console.log('Battle completed:', newTotal, 'Remaining archetypes:', updatedSwipedRight.length)
      return newTotal
    })
    
    if (updatedSwipedRight.length === 1) {
      // Battle complete - show result
      console.log('Battle phase complete, showing result')
      if (phase === 'protective-battle') {
        setProtectiveResult(updatedSwipedRight[0])
        setPhase('protective-result')
      } else if (phase === 'essence-battle') {
        setEssenceResult(updatedSwipedRight[0])
        setPhase('essence-result')
      }
    }
    // No need to continue to next battle - the next pair will be automatically shown
  }

  // Handle undo
  const handleUndo = () => {
    if (battleHistory.length === 0) return
    
    const previousState = battleHistory[battleHistory.length - 1]
    console.log('Undoing to state:', previousState)
    
    setSwipedRight(previousState.swipedRight)
    setTotalBattlesCompleted(previousState.totalBattlesCompleted)
    setBattleHistory(prev => prev.slice(0, -1)) // Remove the last state from history
  }

  // Reset the test
  const resetTest = () => {
    setPhase('intro')
    setMessages([])
    setCurrentIndex(0)
    setSwipedRight([])
    setOriginalArchetypeCount(0)
    setTotalBattlesCompleted(0)
    setBattleHistory([])
    setEssenceResult(null)
    setProtectiveResult(null)
    setInputText('')
  }

  if (loading) {
    return (
      <div className="hybrid-flow">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>Loading archetypes...</p>
        </div>
      </div>
    )
  }

  // Final result phase
  if (phase === 'final-result' && essenceResult && protectiveResult) {
    return (
      <div className="hybrid-flow">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                <div className="text">{message.text}</div>
                <div className="timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
          
          <div className="message ai">
            <div className="bubble">
              <div className="text">🎉 Amazing! Here are your complete archetype results:</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        <div className="result-container">
          <div className="result-card">
            <h2>Your Essence Archetype</h2>
            <img 
              src={`/images/archetypes/lead-magnet-essence/${essenceResult.image}`} 
              alt={essenceResult.name}
              className="result-image"
            />
            <h3>{essenceResult.name}</h3>
            <p className="result-description">{essenceResult.description}</p>
          </div>
          
          <div className="result-card">
            <h2>Your Protective Archetype</h2>
            <img 
              src={`/images/archetypes/lead-magnet-protective/${protectiveResult.image}`} 
              alt={protectiveResult.name}
              className="result-image"
            />
            <h3>{protectiveResult.name}</h3>
            <p className="result-description">{protectiveResult.description}</p>
          </div>
          
          <button onClick={resetTest} className="reset-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Essence result phase
  if (phase === 'essence-result' && essenceResult) {
    return (
      <div className="hybrid-flow">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                <div className="text">{message.text}</div>
                <div className="timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
          
          <div className="message ai">
            <div className="bubble">
              <div className="text">✨ Beautiful! Your Essence Archetype is:</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        <div className="result-container">
          <div className="result-card">
            <img 
              src={`/images/archetypes/lead-magnet-essence/${essenceResult.image}`} 
              alt={essenceResult.name}
              className="result-image"
            />
            <h2>{essenceResult.name}</h2>
            <p className="result-description">{essenceResult.description}</p>
          </div>
          
          <button 
            onClick={() => {
              setPhase('final-result')
            }} 
            className="reset-button"
          >
            View Complete Results
          </button>
        </div>
      </div>
    )
  }

  // Protective result phase
  if (phase === 'protective-result' && protectiveResult) {
    return (
      <div className="hybrid-flow">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                <div className="text">{message.text}</div>
                <div className="timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
          
          <div className="message ai">
            <div className="bubble">
              <div className="text">🛡️ Amazing! Your Protective Archetype is:</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        <div className="result-container">
          <div className="result-card">
            <img 
              src={`/images/archetypes/lead-magnet-protective/${protectiveResult.image}`} 
              alt={protectiveResult.name}
              className="result-image"
            />
            <h2>{protectiveResult.name}</h2>
            <p className="result-description">{protectiveResult.description}</p>
          </div>
          
          <div className="message ai">
            <div className="bubble">
              <div className="text">Now let's discover your Essence Archetype - who you are at your core. I'll show you 8 different essence patterns. Swipe right on the ones that sound like you, left on the ones that don't.\n\nReady to discover your essence? Let's go! ✨</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setPhase('essence-swipe')
              setCurrentIndex(0)
              setSwipedRight([])
              setTotalBattlesCompleted(0)
            }} 
            className="reset-button"
          >
            Continue to Essence Archetypes
          </button>
        </div>
      </div>
    )
  }

  // Battle phases
  if (phase === 'essence-battle' || phase === 'protective-battle') {
    const currentPair = getNextBattlePair()
    if (!currentPair) return null
    
    const archetypeType = phase === 'essence-battle' ? 'essence' : 'protective'
    const imagePath = phase === 'essence-battle' ? 'lead-magnet-essence' : 'lead-magnet-protective'
    
    // Calculate progress: battles completed / total battles needed
    const totalBattlesNeeded = originalArchetypeCount - 1
    const progressPercentage = totalBattlesNeeded > 0 ? (totalBattlesCompleted / totalBattlesNeeded) * 100 : 0
    
    return (
      <div className="hybrid-flow">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                <div className="text">{message.text}</div>
                <div className="timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
          
          <div className="message ai">
            <div className="bubble">
              <div className="text">Now let's narrow it down! Which {archetypeType} pattern resonates more with you?</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        <div className="battle-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, progressPercentage)}%` }}></div>
          </div>
          <div className="battle-instruction">
            Select which one sounds more like you
            {battleHistory.length > 0 && (
              <button 
                onClick={handleUndo}
                className="undo-button"
                title="Undo last selection"
              >
                ↶ Undo
              </button>
            )}
          </div>
          <div className="battle-options">
            <div 
              className="battle-card"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleBattleSelection(currentPair[0])
              }}
            >
              <img 
                src={`/images/archetypes/${imagePath}/${currentPair[0].image}`} 
                alt={currentPair[0].name}
              />
              <p><strong>{currentPair[0].description}</strong></p>
            </div>
            <div className="vs-divider">VS</div>
            <div 
              className="battle-card"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleBattleSelection(currentPair[1])
              }}
            >
              <img 
                src={`/images/archetypes/${imagePath}/${currentPair[1].image}`} 
                alt={currentPair[1].name}
              />
              <p><strong>{currentPair[1].description}</strong></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Swipe phases
  if (phase === 'essence-swipe' || phase === 'protective-swipe') {
    const archetypes = phase === 'essence-swipe' ? essenceArchetypes : protectiveArchetypes
    const currentArchetype = archetypes[currentIndex]
    if (!currentArchetype) return null

    const archetypeType = phase === 'essence-swipe' ? 'essence' : 'protective'
    const imagePath = phase === 'essence-swipe' ? 'lead-magnet-essence' : 'lead-magnet-protective'
    const buttonText = phase === 'essence-swipe' ? 'Sounds Like Me' : 'Sounds Familiar'

    return (
      <div className="hybrid-flow">
        <div className="messages">
          {messages.map(message => (
            <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
              <div className="bubble">
                <div className="text">{message.text}</div>
                <div className="timestamp">{message.timestamp}</div>
              </div>
            </div>
          ))}
          
          <div className="message ai">
            <div className="bubble">
              <div className="text">Swipe right if this {archetypeType} pattern sounds like you, left if it doesn't:</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>

        <div className="swipe-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentIndex + 1) / archetypes.length) * 100}%` }}></div>
          </div>
          
          <div className="swipe-progress-info">
            <span>{swipedRight.length} selected</span>
          </div>
          
          <div className="swipe-instruction">
            {isMobile 
              ? `Swipe right if this sounds like you, left if it doesn't`
              : `Click the buttons below or swipe right if this sounds like you, left if it doesn't`
            }
          </div>
          
          <div className="card-stack">
            <div 
              ref={cardRef}
              className="swipe-card"
              onMouseDown={handleStart}
              onMouseMove={handleMove}
              onMouseUp={handleEnd}
              onMouseLeave={handleEnd}
              onTouchStart={handleStart}
              onTouchMove={handleMove}
              onTouchEnd={handleEnd}
            >
              <img 
                src={`/images/archetypes/${imagePath}/${currentArchetype.image}`} 
                alt={currentArchetype.name}
                className="card-image"
              />
              <div className="card-content">
                <p><strong>{currentArchetype.description}</strong></p>
              </div>
            </div>
          </div>
          
          {!isMobile && (
            <div className="swipe-actions">
              <button 
                className="swipe-left-btn"
                onClick={handleSwipeLeft}
              >
                ❌ Not Me
              </button>
              <button 
                className="swipe-right-btn"
                onClick={handleSwipeRight}
              >
                ✅ {buttonText}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Intro phase - show messages
  return (
    <div className="hybrid-flow">
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.isAI ? 'ai' : 'user'}`}>
            <div className="bubble">
              <div className="text">{message.text}</div>
              <div className="timestamp">{message.timestamp}</div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-bar">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your name here..."
          className="message-input"
          disabled={isLoading}
        />
        <button 
          onClick={handleSubmit} 
          disabled={!inputText.trim() || isLoading}
          className="send-button"
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  )
}

export default HybridCombinedFlow
