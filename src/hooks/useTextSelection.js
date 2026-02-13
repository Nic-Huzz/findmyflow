import { useState, useEffect, useCallback, useRef } from 'react'

export function useTextSelection(containerRef) {
  const [selection, setSelection] = useState(null)
  const [popoverPosition, setPopoverPosition] = useState(null)
  const isSelectingRef = useRef(false)

  const handleSelectionChange = useCallback(() => {
    // Small delay to let selection settle
    setTimeout(() => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        // Don't clear if we're interacting with the popover
        if (!isSelectingRef.current) {
          setSelection(null)
          setPopoverPosition(null)
        }
        return
      }

      const range = sel.getRangeAt(0)
      const container = containerRef.current

      if (!container || !container.contains(range.commonAncestorContainer)) {
        return
      }

      const text = sel.toString().trim()
      if (!text) return

      // Calculate offsets relative to the rendered DOM content.
      const preRange = document.createRange()
      preRange.selectNodeContents(container)
      preRange.setEnd(range.startContainer, range.startOffset)
      const startOffset = preRange.toString().length
      const endOffset = startOffset + text.length

      // Position popover near selection
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()
      const isMobile = window.innerWidth <= 768

      if (isMobile) {
        // Mobile: popover is a fixed bottom sheet, no positioning needed
        setPopoverPosition({ mobile: true })
      } else {
        // Desktop: position below selection with edge clamping
        const popoverWidth = 320
        let left = rect.left - containerRect.left + rect.width / 2 - popoverWidth / 2
        left = Math.max(0, Math.min(left, containerRect.width - popoverWidth))

        // Vertical: prefer below selection, but flip above if near container bottom
        const spaceBelow = containerRect.bottom - rect.bottom
        const top = spaceBelow < 200
          ? rect.top - containerRect.top + container.scrollTop - 8
          : rect.bottom - containerRect.top + container.scrollTop + 8

        setPopoverPosition({ top, left, above: spaceBelow < 200 })
      }

      setSelection({ text, startOffset, endOffset })
    }, 10)
  }, [containerRef])

  const clearSelection = useCallback(() => {
    isSelectingRef.current = false // Bug fix: always reset lock on clear
    setSelection(null)
    setPopoverPosition(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  const lockSelection = useCallback(() => {
    isSelectingRef.current = true
  }, [])

  const unlockSelection = useCallback(() => {
    isSelectingRef.current = false
  }, [])

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange)
    return () => document.removeEventListener('selectionchange', handleSelectionChange)
  }, [handleSelectionChange])

  return { selection, popoverPosition, clearSelection, lockSelection, unlockSelection }
}
