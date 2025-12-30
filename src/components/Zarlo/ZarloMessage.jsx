/**
 * ZarloMessage - Individual message bubble component
 * Supports basic markdown: **bold**, *italic*, bullet points
 */

/**
 * Parse basic markdown into React elements
 */
function parseMarkdown(text) {
  if (!text) return null

  // Split by newlines first to handle paragraphs and bullets
  const lines = text.split('\n')

  return lines.map((line, lineIndex) => {
    // Check if it's a bullet point
    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-')
    const bulletMatch = line.match(/^(\s*)(•|-)\s*(.*)$/)

    let content = bulletMatch ? bulletMatch[3] : line

    // Parse inline formatting: **bold** and *italic*
    const parts = []
    let lastIndex = 0
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g
    let match

    while ((match = regex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }

      // Add formatted text
      if (match[2]) {
        // **bold**
        parts.push(<strong key={`${lineIndex}-${match.index}`}>{match[2]}</strong>)
      } else if (match[3]) {
        // *italic*
        parts.push(<em key={`${lineIndex}-${match.index}`}>{match[3]}</em>)
      }

      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }

    // If no formatting found, use original content
    const finalContent = parts.length > 0 ? parts : content

    // Return appropriate element
    if (bulletMatch) {
      return (
        <span key={lineIndex} className="zarlo-bullet-line">
          <span className="zarlo-bullet">•</span>
          <span>{finalContent}</span>
        </span>
      )
    }

    // Empty line = paragraph break
    if (line.trim() === '') {
      return <br key={lineIndex} />
    }

    return (
      <span key={lineIndex}>
        {finalContent}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })
}

function ZarloMessage({ message }) {
  const { sender, text } = message

  const isZarlo = sender === 'zarlo'

  return (
    <div className={`zarlo-message ${isZarlo ? 'zarlo' : 'user'}`}>
      {isZarlo && <span className="zarlo-message-avatar">Z</span>}
      <div className="zarlo-message-content">
        <div className="zarlo-message-text">{parseMarkdown(text)}</div>
      </div>
    </div>
  )
}

export default ZarloMessage
