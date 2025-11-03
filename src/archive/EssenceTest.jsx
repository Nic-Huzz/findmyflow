import React, { useState, useEffect, useRef } from 'react'
import './EssenceTest.css'

const EssenceTest = () => {
  const [archetypes, setArchetypes] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipedRight, setSwipedRight] = useState([])
  const [phase, setPhase] = useState('swipe') // 'swipe' or 'battle'
  const [battlePairs, setBattlePairs] = useState([])
  const [currentBattle, setCurrentBattle] = useState(0)
  const [finalResult, setFinalResult] = useState(null)
  const [loading, setLoading] = useState(true)
  
  const cardRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)

  // Load archetype data
  useEffect(() => {
    const loadArchetypes = async () => {
      try {
        const response = await fetch('/Essence-test.json')
        const data = await response.json()
        setArchetypes(data.archetypes || [])
        setLoading(false)
      } catch (error) {
        console.error('Error loading archetypes:', error)
        setLoading(false)
      }
    }
    
    loadArchetypes()
  }, [])

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

  // Handle mouse/touch events for swiping
  const handleStart = (e) => {
    isDragging.current = true
    startX.current = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX
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
        alert('Please select at least one archetype that resonates with you!')
      } else if (swipedRight.length === 1) {
        // Single selection - done!
        setFinalResult(swipedRight[0])
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
    
    while (remaining.length > 1) {
      if (remaining.length === 2) {
        pairs.push([remaining[0], remaining[1]])
        break
      } else {
        // Take first two for battle
        pairs.push([remaining[0], remaining[1]])
        remaining = remaining.slice(2)
      }
    }
    
    setBattlePairs(pairs)
    setCurrentBattle(0)
  }

  // Handle battle selection
  const handleBattleSelection = (selectedArchetype) => {
    const currentPair = battlePairs[currentBattle]
    const winner = selectedArchetype
    const loser = currentPair.find(archetype => archetype !== selectedArchetype)
    
    // Remove loser from remaining archetypes
    const updatedSwipedRight = swipedRight.filter(archetype => archetype !== loser)
    setSwipedRight(updatedSwipedRight)
    
    if (updatedSwipedRight.length === 1) {
      // Battle complete - we have a winner!
      setFinalResult(updatedSwipedRight[0])
    } else {
      // Continue to next battle
      setCurrentBattle(prev => prev + 1)
      if (currentBattle + 1 >= battlePairs.length) {
        // Need to create new battle pairs
        createBattlePairs()
      }
    }
  }

  // Reset the test
  const resetTest = () => {
    setCurrentIndex(0)
    setSwipedRight([])
    setPhase('swipe')
    setBattlePairs([])
    setCurrentBattle(0)
    setFinalResult(null)
  }

  if (loading) {
    return (
      <div className="essence-test">
        <div className="loading">
          <div className="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <p>Loading archetypes...</p>
        </div>
      </div>
    )
  }

  if (finalResult) {
    return (
      <div className="essence-test">
        <div className="result-container">
          <h1>🎉 Your Essence Archetype!</h1>
          <div className="result-card">
            <img 
              src={`/images/archetypes/lead-magnet-essence/${finalResult.image}`} 
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
      <div className="essence-test">
        <div className="battle-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${(currentBattle / battlePairs.length) * 100}%` }}></div>
          </div>
          <h2>Which resonates more with you?</h2>
          <div className="battle-options">
            <div 
              className="battle-card"
              onClick={() => handleBattleSelection(currentPair[0])}
            >
              <img 
                src={`/images/archetypes/lead-magnet-essence/${currentPair[0].image}`} 
                alt={currentPair[0].name}
              />
              <h3>{currentPair[0].name}</h3>
              <p>{currentPair[0].description}</p>
            </div>
            <div className="vs-divider">VS</div>
            <div 
              className="battle-card"
              onClick={() => handleBattleSelection(currentPair[1])}
            >
              <img 
                src={`/images/archetypes/lead-magnet-essence/${currentPair[1].image}`} 
                alt={currentPair[1].name}
              />
              <h3>{currentPair[1].name}</h3>
              <p>{currentPair[1].description}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Swipe phase
  const currentArchetype = archetypes[currentIndex]
  if (!currentArchetype) return null

  return (
    <div className="essence-test">
      <div className="swipe-container">
        <div className="progress-info">
          <span>{currentIndex + 1} of {archetypes.length}</span>
          <span>{swipedRight.length} selected</span>
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
              src={`/images/archetypes/lead-magnet-essence/${currentArchetype.image}`} 
              alt={currentArchetype.name}
              className="card-image"
            />
            <div className="card-content">
              <h2>{currentArchetype.name}</h2>
              <p>{currentArchetype.description}</p>
            </div>
          </div>
        </div>
        
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
            ✅ Sounds Like Me
          </button>
        </div>
      </div>
    </div>
  )
}

export default EssenceTest


