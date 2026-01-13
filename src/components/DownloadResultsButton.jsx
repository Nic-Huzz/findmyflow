import { useState } from 'react'
import './DownloadResultsButton.css'

/**
 * DownloadResultsButton - Button to download flow results as PDF
 *
 * @param {function} onDownload - Function to call when download is clicked
 * @param {string} label - Button label (default: "Download Results")
 */
export default function DownloadResultsButton({ onDownload, label = "Download Results" }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleClick = async () => {
    setIsDownloading(true)
    try {
      await onDownload()
    } catch (err) {
      console.error('Download error:', err)
    }
    // Short delay for UX
    setTimeout(() => setIsDownloading(false), 1000)
  }

  return (
    <button
      className={`download-results-btn ${isDownloading ? 'downloading' : ''}`}
      onClick={handleClick}
      disabled={isDownloading}
    >
      <span className="download-icon">{isDownloading ? '⏳' : '📥'}</span>
      <span className="download-label">{isDownloading ? 'Preparing...' : label}</span>
    </button>
  )
}
