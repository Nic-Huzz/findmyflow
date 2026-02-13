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

      // Calculate offsets relative to the markdown content
      const preRange = document.createRange()
      preRange.selectNodeContents(container)
      preRange.setEnd(range.startContainer, range.startOffset)
      const startOffset = preRange.toString().length

      const endOffset = startOffset + text.length

      // Position popover near selection
      const rect = range.getBoundingClientRect()
      const containerRect = container.getBoundingClientRect()

      setSelection({
        text,
        startOffset,
        endOffset,
      })

      setPopoverPosition({
        top: rect.bottom - containerRect.top + 8,
        left: Math.max(0, rect.left - containerRect.left + rect.width / 2 - 150),
      })
    }, 10)
  }, [containerRef])

  const clearSelection = useCallback(() => {
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
