/**
 * CSVImportWizard.jsx
 * Multi-step wizard for importing CSV data into CRM tables
 *
 * Steps:
 * 1. File Upload - Drag-and-drop CSV file
 * 2. Table Selection - Choose target table
 * 3. Column Mapping - Map CSV columns to database fields
 * 4. Preview & Validate - Review data, set duplicate handling
 * 5. Import Progress - Show progress during import
 * 6. Results - Success/error summary
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useAuth } from '../../../auth/AuthProvider'
import { parseCSV, importData } from '../../../lib/crm/csvImportService'
import FileUploader from './FileUploader'
import TableSelector from './TableSelector'
import ColumnMapper from './ColumnMapper'
import ImportPreview from './ImportPreview'
import ImportResults from './ImportResults'
import './CSVImportWizard.css'

const STEPS = ['upload', 'table', 'mapping', 'preview', 'importing', 'results']

const STEP_TITLES = {
  upload: 'Upload CSV',
  table: 'Select Destination',
  mapping: 'Map Columns',
  preview: 'Preview & Validate',
  importing: 'Importing...',
  results: 'Import Complete',
}

export default function CSVImportWizard({ onComplete, onClose }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isEntering, setIsEntering] = useState(true)

  // Wizard data
  const [file, setFile] = useState(null)
  const [csvData, setCsvData] = useState({ headers: [], data: [], rowCount: 0 })
  const [selectedTable, setSelectedTable] = useState(null)
  const [columnMapping, setColumnMapping] = useState({})
  const [duplicateHandling, setDuplicateHandling] = useState('skip')

  // Import state
  const [importProgress, setImportProgress] = useState(0)
  const [importMessage, setImportMessage] = useState('')
  const [importResults, setImportResults] = useState(null)

  // Prevent double import
  const importTriggeredRef = useRef(false)

  // Clear entering state after animation
  useEffect(() => {
    if (isEntering) {
      const timer = setTimeout(() => setIsEntering(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isEntering, currentStep])

  const currentStepName = STEPS[currentStep]

  // Navigation with transitions
  const goToStep = useCallback((stepIndex) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentStep(stepIndex)
      setIsTransitioning(false)
      setIsEntering(true)
    }, 200)
  }, [isTransitioning])

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, goToStep])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  // Step handlers
  const handleFileSelect = useCallback(async (selectedFile) => {
    setFile(selectedFile)
    const parsed = await parseCSV(selectedFile)
    setCsvData(parsed)
    handleNext()
    // If parseCSV throws, the error propagates to FileUploader's catch block
  }, [handleNext])

  const handleTableSelect = useCallback((tableKey) => {
    setSelectedTable(tableKey)
    handleNext()
  }, [handleNext])

  const handleMappingComplete = useCallback((mapping) => {
    setColumnMapping(mapping)
    handleNext()
  }, [handleNext])

  const handleStartImport = useCallback(async (options) => {
    if (importTriggeredRef.current) return
    if (!user?.id) {
      console.error('No user ID available for import')
      setImportResults({
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [{ rowIndex: 0, error: 'Not authenticated. Please log in and try again.' }],
      })
      goToStep(5)
      return
    }

    importTriggeredRef.current = true

    setDuplicateHandling(options.duplicateHandling)
    goToStep(4) // Move to importing step

    // Use valid rows passed from preview step, or fall back to all data
    const dataToImport = options.validRowsData || csvData.data

    try {
      const results = await importData(
        dataToImport,
        columnMapping,
        selectedTable,
        user.id,
        {
          duplicateHandling: options.duplicateHandling,
          onProgress: (percent, message) => {
            setImportProgress(percent)
            setImportMessage(message)
          },
        }
      )

      setImportResults(results)
      goToStep(5) // Move to results step
    } catch (error) {
      console.error('Import error:', error)
      setImportResults({
        success: 0,
        failed: dataToImport.length,
        skipped: 0,
        errors: [{ rowIndex: 0, error: error.message }],
      })
      goToStep(5)
    }
  }, [csvData, columnMapping, selectedTable, user?.id, goToStep])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setFile(null)
    setCsvData({ headers: [], data: [], rowCount: 0 })
    setSelectedTable(null)
    setColumnMapping({})
    setDuplicateHandling('skip')
    setImportProgress(0)
    setImportMessage('')
    setImportResults(null)
    importTriggeredRef.current = false
    setIsEntering(true)
  }, [])

  const handleComplete = useCallback(() => {
    if (onComplete) {
      onComplete(importResults)
    }
  }, [onComplete, importResults])

  // Progress percentage
  const progressPercent = ((currentStep + 1) / STEPS.length) * 100

  // Render current step
  const renderStep = () => {
    switch (currentStepName) {
      case 'upload':
        return (
          <FileUploader
            onFileSelect={handleFileSelect}
            onBack={onClose}
          />
        )

      case 'table':
        return (
          <TableSelector
            onSelect={handleTableSelect}
            onBack={handleBack}
            selectedTable={selectedTable}
          />
        )

      case 'mapping':
        return (
          <ColumnMapper
            csvHeaders={csvData.headers}
            tableKey={selectedTable}
            initialMapping={columnMapping}
            sampleData={csvData.data.slice(0, 3)}
            onComplete={handleMappingComplete}
            onBack={handleBack}
          />
        )

      case 'preview':
        return (
          <ImportPreview
            csvData={csvData}
            tableKey={selectedTable}
            mapping={columnMapping}
            onStartImport={handleStartImport}
            onBack={handleBack}
          />
        )

      case 'importing':
        return (
          <div className="csv-import-progress">
            <div className="progress-circle">
              <svg viewBox="0 0 100 100">
                <circle
                  className="progress-bg"
                  cx="50"
                  cy="50"
                  r="45"
                />
                <circle
                  className="progress-fill"
                  cx="50"
                  cy="50"
                  r="45"
                  style={{
                    strokeDasharray: `${2 * Math.PI * 45}`,
                    strokeDashoffset: `${2 * Math.PI * 45 * (1 - importProgress / 100)}`,
                  }}
                />
              </svg>
              <span className="progress-percent">{importProgress}%</span>
            </div>
            <h3>Importing Your Data</h3>
            <p className="progress-message">{importMessage}</p>
          </div>
        )

      case 'results':
        return (
          <ImportResults
            results={importResults}
            csvHeaders={csvData.headers}
            onImportMore={handleReset}
            onComplete={handleComplete}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="csv-import-wizard">
      {/* Progress Header */}
      <div className="wizard-header">
        <div className="wizard-progress-bar">
          <div
            className="wizard-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="wizard-step-info">
          <span className="wizard-step-label">
            Step {currentStep + 1} of {STEPS.length}
          </span>
          <h2 className="wizard-step-title">{STEP_TITLES[currentStepName]}</h2>
        </div>
      </div>

      {/* Step Content */}
      <div className={`wizard-content ${isTransitioning ? 'transitioning' : ''} ${isEntering ? 'entering' : ''}`}>
        {renderStep()}
      </div>
    </div>
  )
}
