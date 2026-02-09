import { useState, useEffect, useRef } from 'react'
import { useVibeColor } from '../hooks/useVibeColor'
import { hapticLight } from '../lib/haptics'
import './VibeColorPicker.css'

function VibeColorPicker() {
  const { themeKey, setThemeKey, themes, currentTheme } = useVibeColor()
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleSelect = (key) => {
    setThemeKey(key)
    hapticLight()
    setIsOpen(false)
  }

  return (
    <div className="vibe-picker" ref={pickerRef}>
      <button
        className="vibe-picker-toggle"
        onClick={() => { setIsOpen(!isOpen); hapticLight() }}
        style={{ background: currentTheme?.color }}
        title="Choose your vibe"
        aria-label="Choose your vibe color"
      />

      {isOpen && (
        <div className="vibe-picker-menu">
          <span className="vibe-picker-label">Your vibe</span>
          <div className="vibe-picker-options">
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                className={`vibe-picker-option ${key === themeKey ? 'active' : ''}`}
                style={{ background: theme.color }}
                onClick={() => handleSelect(key)}
                title={theme.name}
                aria-label={theme.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default VibeColorPicker
