import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from './auth/AuthProvider'
// Use global styles from index.css (same as lead magnet flow)

const HybridProtectiveFlow = () => {
  const { user } = useAuth()
  const [phase, setPhase] = useState('intro') // 'intro', 'swipe', 'battle', 'result'
  const [messages, setMessages] = useState([])
  const [archetypes, setArchetypes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipedRight, setSwipedRight] = useState([])
  const [battlePairs, setBattlePairs] = useState([])
  const [currentBattle, setCurrentBattle] = useState(0)
  const [totalBattlesCompleted, setTotalBattlesCompleted] = useState(0)
  const [finalResult, setFinalResult] = useState(null)
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
        const response = await fetch('/Protective-test.json')
        const data = await response.json()
        setArchetypes(data.archetypes || [])
        setLoading(false)
      } catch (error) {
        console.error('Error loading protective archetypes:', error)
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
          text: "Hi! I'm here to help you discover your Protective Archetype - the patterns that developed to protect you from pain.\n\nWhat's your name?",
          timestamp: new Date().toLocaleTimeString()
        }
      ]
      
      setMessages(introMessages)
    }
  }, [loading, phase, user])

  // Handle swipe right
  const handleSwipeRight = () => {
    if (currentIndex < archetypes.length) {
      const currentArchetype = archetypes[currentIndex]
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
    if (currentIndex >= archetypes.length && phase === 'swipe') {
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
        setFinalResult(swipedRight[0])
        setPhase('result')
      } else {
        // Multiple selections - start battle phase
        setPhase('battle')
        createBattlePairs()
      }
    }
  }, [currentIndex, archetypes.length, swipedRight.length, phase])

  // Create battle pairs for A/B selection
  const createBattlePairs = () => {
    const pairs = []
    let remaining = [...swipedRight]
    
    // Handle odd numbers by creating pairs that include the "odd one out"
    while (remaining.length > 1) {
      if (remaining.length === 2) {
        // Final pair
        pairs.push([remaining[0], remaining[1]])
        break
      } else if (remaining.length === 3) {
        // Handle 3 remaining: create 1 pair, leave the odd one for next round
        pairs.push([remaining[0], remaining[1]])
        break
      } else {
        // Normal case: take first two
        pairs.push([remaining[0], remaining[1]])
        remaining = remaining.slice(2)
      }
    }
    
    setBattlePairs(pairs)
    setCurrentBattle(0)
  }

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
        text: `Nice to meet you, ${trimmedInput}! 🛡️\n\nNow let's discover your Protective Archetype - the patterns that developed to protect you from pain.\n\nI'm going to show you 5 different protective patterns. Swipe right on the ones that sound familiar, and left on the ones that don't.\n\nReady to discover your protective patterns? Let's go!`,
        timestamp: new Date().toLocaleTimeString()
      }

      setMessages(prev => [...prev, aiMessage])
      setIsLoading(false)
      setPhase('swipe')
    }, 1000)
  }

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Handle battle selection
  const handleBattleSelection = (selectedArchetype) => {
    const currentPair = battlePairs[currentBattle]
    const winner = selectedArchetype
    const loser = currentPair.find(archetype => archetype !== selectedArchetype)
    
    // Remove loser from remaining archetypes
    const updatedSwipedRight = swipedRight.filter(archetype => archetype !== loser)
    setSwipedRight(updatedSwipedRight)
    
    // Increment total battles completed
    setTotalBattlesCompleted(prev => {
      const newTotal = prev + 1
      console.log('Protective battle completed:', newTotal, 'Remaining archetypes:', updatedSwipedRight.length)
      return newTotal
    })
    
    if (updatedSwipedRight.length === 1) {
      // Battle complete - show result
      setFinalResult(updatedSwipedRight[0])
      setPhase('result')
    } else {
      // Continue to next battle
      const nextBattle = currentBattle + 1
      if (nextBattle >= battlePairs.length) {
        // Need to create new battle pairs
        createBattlePairs()
      } else {
        setCurrentBattle(nextBattle)
      }
    }
  }

  // Reset the test
  const resetTest = () => {
    setPhase('intro')
    setMessages([])
    setCurrentIndex(0)
    setSwipedRight([])
    setBattlePairs([])
    setCurrentBattle(0)
    setTotalBattlesCompleted(0)
    setFinalResult(null)
    setInputText('')
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>Loading protective archetypes...</p>
        </div>
      </div>
    )
  }

  if (phase === 'result' && finalResult) {
    return (
      <div className="app">
        <div className="chat-container">
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

        </div>
        <div className="result-container">
          <div className="result-card">
            <img 
              src={`/images/archetypes/lead-magnet-protective/${finalResult.image}`} 
              alt={finalResult.name}
              className="result-image"
            />
            <h2>{finalResult.name}</h2>
            <p className="result-description">{finalResult.description}</p>
          </div>
          <button onClick={resetTest} className="reset-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'battle') {
    const currentPair = battlePairs[currentBattle]
    if (!currentPair) return null
    
    return (
      <div className="app">
        <div className="chat-container">
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
              <div className="text">Now let's narrow it down! Which protective pattern resonates more with you?</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>
        </div>

        <div className="battle-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(100, (totalBattlesCompleted / Math.max(1, swipedRight.length - 1)) * 100)}%` }}></div>
          </div>
          <div className="battle-instruction">
            Select which one sounds more like you
          </div>
          <div className="battle-options">
            <div 
              className="battle-card"
              onClick={() => handleBattleSelection(currentPair[0])}
            >
              <img 
                src={`/images/archetypes/lead-magnet-protective/${currentPair[0].image}`} 
                alt={currentPair[0].name}
              />
              <p><strong>{currentPair[0].description}</strong></p>
            </div>
            <div className="vs-divider">VS</div>
            <div 
              className="battle-card"
              onClick={() => handleBattleSelection(currentPair[1])}
            >
              <img 
                src={`/images/archetypes/lead-magnet-protective/${currentPair[1].image}`} 
                alt={currentPair[1].name}
              />
              <p><strong>{currentPair[1].description}</strong></p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'swipe') {
    const currentArchetype = archetypes[currentIndex]
    if (!currentArchetype) return null

    return (
      <div className="app">
        <div className="chat-container">
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
              <div className="text">Swipe right if this protective pattern sounds familiar, left if it doesn't:</div>
              <div className="timestamp">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>
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
              ? "Swipe right if this sounds familiar, left if it doesn't"
              : "Click the buttons below or swipe right if this sounds familiar, left if it doesn't"
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
                src={`/images/archetypes/lead-magnet-protective/${currentArchetype.image}`} 
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
                ✅ Sounds Familiar
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Intro phase - show messages
  return (
    <div className="app">
      <div className="chat-container">
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

export default HybridProtectiveFlow
