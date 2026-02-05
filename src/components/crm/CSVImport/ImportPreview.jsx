/**
 * ImportPreview.jsx
 * Preview data, show validation errors, choose duplicate handling
 */

import { useState, useMemo } from 'react'
import { TABLE_CONFIGS, validateAllRows } from '../../../lib/crm/csvImportService'

const DUPLICATE_OPTIONS = [
  {
    id: 'skip',
    label: 'Skip duplicates',
    description: 'Existing records will be kept unchanged',
  },
  {
    id: 'update',
    label: 'Update existing',
    description: 'Matching records will be updated with new data',
  },
  {
    id: 'allow',
    label: 'Import all',
    description: 'Create new records even if duplicates exist',
  },
]

export default function ImportPreview({
  csvData,
  tableKey,
  mapping,
  onStartImport,
  onBack,
}) {
  const [duplicateHandling, setDuplicateHandling] = useState('skip')
  const tableConfig = TABLE_CONFIGS[tableKey]

  // Validate all rows
  const validation = useMemo(() => {
    return validateAllRows(csvData.data, mapping, tableKey)
  }, [csvData.data, mapping, tableKey])

  // Get mapped field labels for preview table
  const mappedFields = useMemo(() => {
    const fields = []
    Object.entries(mapping).forEach(([csvHeader, fieldKey]) => {
      const field = tableConfig.fields.find((f) => f.key === fieldKey)
      if (field) {
        fields.push({
          csvHeader,
          fieldKey,
          label: field.label,
        })
      }
    })
    return fields
  }, [mapping, tableConfig.fields])

  // Get preview rows (first 10)
  const previewRows = csvData.data.slice(0, 10)

  const handleStartImport = () => {
    // Only pass valid rows to import (strip internal properties)
    const validRowsData = validation.validRows.map(({ _warnings, _rowIndex, ...row }) => row)
    onStartImport({ duplicateHandling, validRowsData })
  }

  // Handle empty CSV
  if (csvData.rowCount === 0) {
    return (
      <div className="step-container import-preview">
        <div className="step-header">
          <h3>No Data Found</h3>
          <p>The CSV file appears to be empty or contains only headers.</p>
        </div>
        <div className="step-actions">
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="step-container import-preview">
      <div className="step-header">
        <h3>Review Your Import</h3>
        <p>
          {validation.summary.valid === csvData.rowCount
            ? `${csvData.rowCount} rows ready to import into ${tableConfig.name}`
            : `${validation.summary.valid} of ${csvData.rowCount} rows ready to import into ${tableConfig.name}`
          }
        </p>
      </div>

      {/* Stats */}
      <div className="preview-stats">
        <div className="preview-stat">
          <div className="stat-value">{csvData.rowCount}</div>
          <div className="stat-label">Total Rows</div>
        </div>
        <div className={`preview-stat ${validation.summary.valid > 0 ? 'valid' : ''}`}>
          <div className="stat-value">{validation.summary.valid}</div>
          <div className="stat-label">Valid</div>
        </div>
        <div className={`preview-stat ${validation.summary.invalid > 0 ? 'invalid' : ''}`}>
          <div className="stat-value">{validation.summary.invalid}</div>
          <div className="stat-label">Invalid</div>
        </div>
        {validation.summary.warnings > 0 && (
          <div className="preview-stat warnings">
            <div className="stat-value">{validation.summary.warnings}</div>
            <div className="stat-label">Warnings</div>
          </div>
        )}
      </div>

      {/* Validation Errors */}
      {validation.invalidRows.length > 0 && (
        <div className="validation-errors">
          <h4>
            Rows with errors ({validation.invalidRows.length})
          </h4>
          <ul>
            {validation.invalidRows.slice(0, 5).map((item) => (
              <li key={item.rowIndex}>
                <strong>Row {item.rowIndex}:</strong>{' '}
                {item.errors.join(', ')}
              </li>
            ))}
            {validation.invalidRows.length > 5 && (
              <li>...and {validation.invalidRows.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Preview Table */}
      <div className="preview-table-container">
        <table className="preview-table">
          <thead>
            <tr>
              <th>#</th>
              {mappedFields.map((field) => (
                <th key={field.fieldKey}>{field.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                {mappedFields.map((field) => (
                  <td key={field.fieldKey} title={row[field.csvHeader] || ''}>
                    {row[field.csvHeader] || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {csvData.rowCount > 10 && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: '8px 0 0' }}>
          Showing first 10 of {csvData.rowCount} rows
        </p>
      )}

      {/* Duplicate Handling - only show if table has unique key */}
      {tableConfig.uniqueKey && (
        <div className="duplicate-options">
          <h4>How should we handle duplicates (by {tableConfig.duplicateLabel})?</h4>
          {DUPLICATE_OPTIONS.map((option) => (
            <div
              key={option.id}
              className={`duplicate-option ${duplicateHandling === option.id ? 'selected' : ''}`}
              onClick={() => setDuplicateHandling(option.id)}
            >
              <input
                type="radio"
                name="duplicateHandling"
                checked={duplicateHandling === option.id}
                onChange={() => setDuplicateHandling(option.id)}
              />
              <div className="option-content">
                <p className="option-label">{option.label}</p>
                <p className="option-desc">{option.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="step-actions">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <button
          className="primary-btn"
          onClick={handleStartImport}
          disabled={validation.summary.valid === 0}
        >
          Import {validation.summary.valid} Row{validation.summary.valid !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}
