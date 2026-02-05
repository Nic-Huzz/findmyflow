/**
 * FileUploader.jsx
 * Drag-and-drop CSV file upload step
 */

import { useState, useRef, useCallback } from 'react'

export default function FileUploader({ onFileSelect, onBack }) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    // Check file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain']
    const isCSV = validTypes.includes(file.type) || file.name.endsWith('.csv')

    if (!isCSV) {
      return 'Please select a CSV file'
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return 'File size must be less than 10MB'
    }

    return null
  }

  const handleFile = useCallback(async (file) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setSelectedFile(file)
    setIsProcessing(true)

    try {
      await onFileSelect(file)
    } catch (err) {
      setError(err.message || 'Failed to process file')
      setIsProcessing(false)
    }
  }, [onFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleInputChange = (e) => {
    const files = e.target.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setError(null)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="step-container file-uploader">
      <div className="step-header">
        <h3>Upload Your CSV File</h3>
        <p>Drag and drop a CSV file or click to browse</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv,application/vnd.ms-excel"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />

      <div
        className={`dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <span className="dropzone-icon">
          {isProcessing ? '...' : '📄'}
        </span>
        <h4>
          {isProcessing ? 'Processing...' : 'Drop CSV file here'}
        </h4>
        <p>or click to browse your files</p>
      </div>

      {selectedFile && !error && (
        <div className="file-selected">
          <span className="file-icon">📊</span>
          <div className="file-info">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-meta">{formatFileSize(selectedFile.size)}</div>
          </div>
          <button
            className="file-remove"
            onClick={(e) => {
              e.stopPropagation()
              handleRemoveFile()
            }}
            aria-label="Remove file"
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="step-actions">
        <button className="back-btn" onClick={onBack}>
          Cancel
        </button>
      </div>
    </div>
  )
}
