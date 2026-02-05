/**
 * ColumnMapper.jsx
 * Map CSV columns to database fields with auto-mapping
 */

import { useState, useMemo, useEffect } from 'react'
import { TABLE_CONFIGS, autoMapHeaders } from '../../../lib/crm/csvImportService'

export default function ColumnMapper({
  csvHeaders,
  tableKey,
  initialMapping,
  sampleData,
  onComplete,
  onBack,
}) {
  const tableConfig = TABLE_CONFIGS[tableKey]
  const [mapping, setMapping] = useState({})

  // Auto-map on mount
  useEffect(() => {
    if (Object.keys(initialMapping).length > 0) {
      setMapping(initialMapping)
    } else {
      const autoMapped = autoMapHeaders(csvHeaders, tableKey)
      setMapping(autoMapped)
    }
  }, [csvHeaders, tableKey, initialMapping])

  // Get sample value for a CSV header
  const getSampleValue = (header) => {
    for (const row of sampleData) {
      const value = row[header]
      if (value && value.toString().trim()) {
        return value.toString().trim()
      }
    }
    return ''
  }

  // Handle mapping change
  const handleMappingChange = (csvHeader, fieldKey) => {
    setMapping((prev) => {
      const newMapping = { ...prev }

      // If "Don't import" selected, remove the mapping
      if (!fieldKey) {
        delete newMapping[csvHeader]
        return newMapping
      }

      // Remove any existing mapping to this field (prevent duplicates)
      Object.keys(newMapping).forEach((header) => {
        if (newMapping[header] === fieldKey && header !== csvHeader) {
          delete newMapping[header]
        }
      })

      newMapping[csvHeader] = fieldKey
      return newMapping
    })
  }

  // Validation
  const validation = useMemo(() => {
    const mappedFields = new Set(Object.values(mapping))
    const missingRequired = tableConfig.fields
      .filter((f) => f.required && !mappedFields.has(f.key))
      .map((f) => f.label)

    const unmappedHeaders = csvHeaders.filter((h) => !mapping[h])

    return {
      isValid: missingRequired.length === 0,
      missingRequired,
      unmappedHeaders,
    }
  }, [mapping, tableConfig.fields, csvHeaders])

  // Get available fields for dropdown (exclude already mapped)
  const getAvailableFields = (currentHeader) => {
    const mappedFields = new Set(
      Object.entries(mapping)
        .filter(([h]) => h !== currentHeader)
        .map(([, f]) => f)
    )

    return tableConfig.fields.filter((f) => !mappedFields.has(f.key))
  }

  return (
    <div className="step-container column-mapper">
      <div className="step-header">
        <h3>Map Your Columns</h3>
        <p>Match CSV columns to {tableConfig.name} fields</p>
      </div>

      <div className="mapping-list">
        {csvHeaders.map((header) => {
          const currentMapping = mapping[header]
          const sampleValue = getSampleValue(header)
          const availableFields = getAvailableFields(header)
          const currentField = tableConfig.fields.find((f) => f.key === currentMapping)

          return (
            <div key={header} className="mapping-row">
              <div className="mapping-csv-col">
                <span className="label">CSV Column</span>
                <span className="value">{header}</span>
                {sampleValue && (
                  <span className="sample" title={sampleValue}>
                    e.g. "{sampleValue}"
                  </span>
                )}
              </div>

              <span className="mapping-arrow">→</span>

              <div className="mapping-select">
                <select
                  value={currentMapping || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                >
                  <option value="">Don't import</option>
                  {currentField && (
                    <option value={currentField.key}>
                      {currentField.label}
                      {currentField.required ? ' *' : ''}
                    </option>
                  )}
                  {availableFields
                    .filter((f) => f.key !== currentMapping)
                    .map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label}
                        {field.required ? ' *' : ''}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )
        })}
      </div>

      {/* Validation Messages */}
      {!validation.isValid && (
        <div className="mapping-validation error">
          Missing required fields: {validation.missingRequired.join(', ')}
        </div>
      )}

      {validation.isValid && validation.unmappedHeaders.length > 0 && (
        <div className="mapping-validation warning">
          {validation.unmappedHeaders.length} column(s) will not be imported:{' '}
          {validation.unmappedHeaders.slice(0, 3).join(', ')}
          {validation.unmappedHeaders.length > 3 && '...'}
        </div>
      )}

      {validation.isValid && validation.unmappedHeaders.length === 0 && (
        <div className="mapping-validation success">
          All columns mapped successfully
        </div>
      )}

      <div className="step-actions">
        <button className="back-btn" onClick={onBack}>
          Back
        </button>
        <button
          className="primary-btn"
          onClick={() => onComplete(mapping)}
          disabled={!validation.isValid}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
