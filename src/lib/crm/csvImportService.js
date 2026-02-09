/**
 * csvImportService.js
 * CSV Import functionality for CRM data (Contacts, Warm Leads, Deals)
 *
 * Handles:
 * - CSV parsing with PapaParse
 * - Field definitions and validation
 * - Auto-mapping CSV headers to database fields
 * - Batch insert with error handling
 */

import Papa from 'papaparse'
import { supabase } from '../supabaseClient'

// ============================================================================
// TABLE FIELD DEFINITIONS
// ============================================================================

export const TABLE_CONFIGS = {
  crm_contacts: {
    name: 'Contacts',
    description: 'Leads and customers in your pipeline',
    icon: '👥',
    fields: [
      { key: 'name', label: 'Name', required: true, type: 'text' },
      { key: 'email', label: 'Email', required: false, type: 'email' },
      { key: 'phone', label: 'Phone', required: false, type: 'text' },
      { key: 'company', label: 'Company', required: false, type: 'text' },
      {
        key: 'lifecycle_stage',
        label: 'Lifecycle Stage',
        required: false,
        type: 'enum',
        options: ['lead', 'qualified', 'opportunity', 'customer', 'evangelist'],
        default: 'lead'
      },
      { key: 'source', label: 'Source', required: false, type: 'text' },
      { key: 'tags', label: 'Tags', required: false, type: 'tags', help: 'Comma-separated' },
      { key: 'notes', label: 'Notes', required: false, type: 'text' },
    ],
    uniqueKey: 'email', // For duplicate detection
    duplicateLabel: 'email address',
  },
  crm_warm_leads: {
    name: 'Warm Leads',
    description: 'Engaged prospects to follow up with',
    icon: '🔥',
    fields: [
      { key: 'name', label: 'Name', required: true, type: 'text' },
      {
        key: 'platform',
        label: 'Platform',
        required: false,
        type: 'enum',
        options: ['Instagram', 'LinkedIn', 'Twitter/X', 'Facebook', 'Email', 'Other'],
        default: 'Other'
      },
      { key: 'handle', label: 'Handle/Username', required: false, type: 'text' },
      {
        key: 'engagement_type',
        label: 'Engagement Type',
        required: false,
        type: 'enum',
        options: ['liked_post', 'commented', 'dm', 'email_reply', 'webinar', 'lead_magnet', 'referral'],
        default: 'commented'
      },
      {
        key: 'status',
        label: 'Status',
        required: false,
        type: 'enum',
        options: ['to_contact', 'reached_out', 'in_conversation', 'meeting_booked', 'not_interested'],
        default: 'to_contact'
      },
      {
        key: 'priority',
        label: 'Priority (1-10)',
        required: false,
        type: 'number',
        min: 1,
        max: 10,
        default: 5
      },
      { key: 'notes', label: 'Notes', required: false, type: 'text' },
    ],
    uniqueKey: ['name', 'platform'], // Composite key
    duplicateLabel: 'name + platform',
  },
  sales_deals: {
    name: 'Deals',
    description: 'Sales opportunities and revenue',
    icon: '💰',
    fields: [
      { key: 'contact_name', label: 'Contact Name', required: true, type: 'text' },
      { key: 'contact_email', label: 'Contact Email', required: false, type: 'email' },
      {
        key: 'product_type',
        label: 'Product Type',
        required: true,
        type: 'enum',
        options: ['lead_magnet', 'core', 'upsell', 'downsell', 'continuity'],
      },
      { key: 'value', label: 'Deal Value', required: true, type: 'currency' },
      {
        key: 'status',
        label: 'Status',
        required: false,
        type: 'enum',
        options: ['lead', 'qualified', 'booked', 'showed', 'pitched', 'follow_up', 'won', 'delivering', 'completed', 'lost'],
        default: 'lead'
      },
      { key: 'source', label: 'Source', required: false, type: 'text', default: 'CSV Import' },
      { key: 'notes', label: 'Notes', required: false, type: 'text' },
    ],
    uniqueKey: null, // Deals can be duplicated
    duplicateLabel: null,
  },
}

// ============================================================================
// AUTO-MAPPING CONFIGURATION
// ============================================================================

// Maps common CSV header variations to our field keys
const HEADER_ALIASES = {
  // Name fields
  name: ['name', 'full name', 'fullname', 'contact name', 'contact', 'lead name', 'customer name', 'person'],
  contact_name: ['contact name', 'contact', 'name', 'customer', 'client', 'person'],
  contact_email: ['contact email', 'contact_email', 'email', 'email address', 'e-mail', 'client email'],

  // Contact info
  email: ['email', 'email address', 'e-mail', 'mail', 'email id'],
  phone: ['phone', 'phone number', 'telephone', 'tel', 'mobile', 'cell', 'contact number'],
  company: ['company', 'company name', 'organization', 'org', 'business', 'workplace'],

  // Lifecycle/Status
  lifecycle_stage: ['lifecycle stage', 'stage', 'lifecycle', 'status', 'lead status', 'customer status'],
  status: ['status', 'deal status', 'lead status', 'outreach status', 'state'],

  // Source/Platform
  source: ['source', 'lead source', 'acquisition', 'channel', 'how found', 'referral source'],
  platform: ['platform', 'social platform', 'network', 'channel', 'source'],

  // Social
  handle: ['handle', 'username', 'social handle', 'profile', 'account', 'ig handle', 'twitter handle'],

  // Engagement
  engagement_type: ['engagement type', 'engagement', 'action', 'interaction', 'how engaged'],

  // Priority
  priority: ['priority', 'importance', 'score', 'lead score', 'ranking'],

  // Value
  value: ['value', 'deal value', 'amount', 'price', 'revenue', 'sale amount', 'deal amount'],

  // Product
  product_type: ['product type', 'product', 'offer', 'tier', 'package', 'service'],

  // Meta
  tags: ['tags', 'labels', 'categories', 'keywords'],
  notes: ['notes', 'note', 'comments', 'description', 'details', 'memo'],
}

/**
 * Parse a CSV file and return headers + data
 * @param {File} file - The CSV file to parse
 * @returns {Promise<{headers: string[], data: object[], rowCount: number}>}
 */
export function parseCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          // Filter out minor warnings, only reject on critical errors
          const criticalErrors = results.errors.filter(e => e.type === 'Error')
          if (criticalErrors.length > 0) {
            reject(new Error(`CSV parsing error: ${criticalErrors[0].message}`))
            return
          }
        }

        resolve({
          headers: results.meta.fields || [],
          data: results.data,
          rowCount: results.data.length,
        })
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`))
      },
    })
  })
}

/**
 * Auto-map CSV headers to table fields
 * @param {string[]} csvHeaders - Headers from the CSV file
 * @param {string} tableKey - Target table key (e.g., 'crm_contacts')
 * @returns {Object<string, string>} - Map of csvHeader -> fieldKey
 */
export function autoMapHeaders(csvHeaders, tableKey) {
  const tableConfig = TABLE_CONFIGS[tableKey]
  if (!tableConfig) return {}

  const mapping = {}
  const normalizedHeaders = csvHeaders.map(h => h.toLowerCase().trim())

  tableConfig.fields.forEach((field) => {
    // Direct match first
    const directIndex = normalizedHeaders.indexOf(field.key.toLowerCase())
    if (directIndex !== -1) {
      mapping[csvHeaders[directIndex]] = field.key
      return
    }

    // Try label match
    const labelIndex = normalizedHeaders.indexOf(field.label.toLowerCase())
    if (labelIndex !== -1) {
      mapping[csvHeaders[labelIndex]] = field.key
      return
    }

    // Try aliases
    const aliases = HEADER_ALIASES[field.key] || []
    for (const alias of aliases) {
      const aliasIndex = normalizedHeaders.indexOf(alias.toLowerCase())
      if (aliasIndex !== -1 && !mapping[csvHeaders[aliasIndex]]) {
        mapping[csvHeaders[aliasIndex]] = field.key
        return
      }
    }
  })

  return mapping
}

/**
 * Validate a single row against table field definitions
 * @param {Object} row - The data row
 * @param {Object<string, string>} mapping - CSV header to field key mapping
 * @param {string} tableKey - Target table
 * @returns {{valid: boolean, errors: string[], warnings: string[]}}
 */
export function validateRow(row, mapping, tableKey) {
  const tableConfig = TABLE_CONFIGS[tableKey]
  const errors = []
  const warnings = []

  // Reverse the mapping for easier lookup
  const fieldToHeader = {}
  Object.entries(mapping).forEach(([header, field]) => {
    fieldToHeader[field] = header
  })

  tableConfig.fields.forEach((field) => {
    const header = fieldToHeader[field.key]
    const value = header ? row[header]?.toString().trim() : undefined

    // Required field check
    if (field.required && (!value || value === '')) {
      errors.push(`Missing required field: ${field.label}`)
      return
    }

    // Skip validation for empty optional fields
    if (!value || value === '') return

    // Type-specific validation
    switch (field.type) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          warnings.push(`Invalid email format: ${value}`)
        }
        break

      case 'enum':
        if (value) {
          const lowerValue = value.toLowerCase()
          const match = field.options.find(opt => opt.toLowerCase() === lowerValue)
          if (!match) {
            warnings.push(`Invalid ${field.label}: "${value}". Valid options: ${field.options.join(', ')}`)
          }
        }
        break

      case 'number':
        const num = parseFloat(value)
        if (isNaN(num)) {
          warnings.push(`Invalid number for ${field.label}: ${value}`)
        } else if (field.min !== undefined && num < field.min) {
          warnings.push(`${field.label} must be at least ${field.min}`)
        } else if (field.max !== undefined && num > field.max) {
          warnings.push(`${field.label} must be at most ${field.max}`)
        }
        break

      case 'currency':
        const cleanedValue = value.replace(/[$,]/g, '')
        if (isNaN(parseFloat(cleanedValue))) {
          errors.push(`Invalid currency value for ${field.label}: ${value}`)
        }
        break
    }
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate all rows and return validation summary
 * @param {Object[]} data - Array of row objects
 * @param {Object<string, string>} mapping - Column mapping
 * @param {string} tableKey - Target table
 * @returns {{validRows: Object[], invalidRows: {row: Object, rowIndex: number, errors: string[], warnings: string[]}[], summary: Object}}
 */
export function validateAllRows(data, mapping, tableKey) {
  const validRows = []
  const invalidRows = []
  let totalWarnings = 0

  data.forEach((row, index) => {
    const result = validateRow(row, mapping, tableKey)
    totalWarnings += result.warnings.length

    if (result.valid) {
      validRows.push({ ...row, _warnings: result.warnings, _rowIndex: index + 1 })
    } else {
      invalidRows.push({
        row,
        rowIndex: index + 1,
        errors: result.errors,
        warnings: result.warnings,
      })
    }
  })

  return {
    validRows,
    invalidRows,
    summary: {
      total: data.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      warnings: totalWarnings,
    },
  }
}

/**
 * Transform a CSV row to database format
 * @param {Object} row - CSV row data
 * @param {Object<string, string>} mapping - Column mapping
 * @param {string} tableKey - Target table
 * @param {string} userId - User ID
 * @returns {Object} - Database-ready object
 */
export function transformRow(row, mapping, tableKey, userId) {
  const tableConfig = TABLE_CONFIGS[tableKey]
  const dbRow = { user_id: userId }

  // Reverse the mapping
  const fieldToHeader = {}
  Object.entries(mapping).forEach(([header, field]) => {
    fieldToHeader[field] = header
  })

  tableConfig.fields.forEach((field) => {
    const header = fieldToHeader[field.key]
    let value = header ? row[header]?.toString().trim() : undefined

    // Apply defaults for empty values
    if ((!value || value === '') && field.default !== undefined) {
      value = field.default
    }

    // Skip truly empty optional fields
    if (!value && !field.required) {
      return
    }

    // Transform value based on type
    switch (field.type) {
      case 'number':
        dbRow[field.key] = value ? parseFloat(value) : field.default || null
        break

      case 'currency':
        dbRow[field.key] = value ? parseFloat(value.replace(/[$,]/g, '')) : null
        break

      case 'enum':
        // Try to match case-insensitively
        if (value) {
          const lowerValue = value.toLowerCase()
          const match = field.options?.find(opt => opt.toLowerCase() === lowerValue)
          // Use matched value, or default if no match (don't pass invalid values)
          dbRow[field.key] = match || field.default || null
        } else {
          dbRow[field.key] = field.default || null
        }
        break

      case 'tags':
        // Parse comma-separated tags
        dbRow[field.key] = value
          ? value.split(',').map(t => t.trim()).filter(Boolean)
          : []
        break

      default:
        dbRow[field.key] = value || null
    }
  })

  return dbRow
}

/**
 * Check for duplicates in the database
 * @param {Object[]} rows - Transformed rows to check
 * @param {string} tableKey - Target table
 * @param {string} userId - User ID
 * @returns {Promise<Set<string>>} - Set of duplicate identifiers
 */
async function checkDuplicates(rows, tableKey, userId) {
  const tableConfig = TABLE_CONFIGS[tableKey]
  if (!tableConfig.uniqueKey) return new Set()

  const duplicates = new Set()

  if (Array.isArray(tableConfig.uniqueKey)) {
    // Composite key (e.g., name + platform)
    const keys = tableConfig.uniqueKey

    // Fetch all existing records for this user and check in memory
    // (Supabase doesn't support OR conditions for composite key matching)
    const { data } = await supabase
      .from(tableKey)
      .select(keys.join(', '))
      .eq('user_id', userId)

    if (data) {
      const existingKeys = new Set(data.map(d => keys.map(k => d[k]).join('|')))
      rows.forEach(row => {
        const rowKey = keys.map(k => row[k]).join('|')
        if (existingKeys.has(rowKey)) {
          duplicates.add(rowKey)
        }
      })
    }
  } else {
    // Single key (e.g., email)
    const key = tableConfig.uniqueKey
    const values = rows.map(r => r[key]).filter(Boolean)

    if (values.length === 0) return duplicates

    const { data } = await supabase
      .from(tableKey)
      .select(key)
      .eq('user_id', userId)
      .in(key, values)

    if (data) {
      data.forEach(d => duplicates.add(d[key]))
    }
  }

  return duplicates
}

/**
 * Import data into the database
 * @param {Object[]} data - CSV data rows
 * @param {Object<string, string>} mapping - Column mapping
 * @param {string} tableKey - Target table
 * @param {string} userId - User ID
 * @param {Object} options - Import options
 * @param {string} options.duplicateHandling - 'skip' | 'update' | 'allow'
 * @param {Function} options.onProgress - Progress callback (percent, message)
 * @returns {Promise<{success: number, failed: number, skipped: number, errors: Object[]}>}
 */
export async function importData(data, mapping, tableKey, userId, options = {}) {
  const { duplicateHandling = 'skip', onProgress = () => {} } = options
  const tableConfig = TABLE_CONFIGS[tableKey]

  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  }

  // Transform all rows
  onProgress(5, 'Preparing data...')
  const transformedRows = data.map(row => transformRow(row, mapping, tableKey, userId))

  // Check for duplicates if needed
  let duplicates = new Set()
  if (duplicateHandling !== 'allow' && tableConfig.uniqueKey) {
    onProgress(10, 'Checking for duplicates...')
    duplicates = await checkDuplicates(transformedRows, tableKey, userId)
  }

  // Filter and prepare rows based on duplicate handling
  const rowsToInsert = []
  const rowsToUpdate = []

  transformedRows.forEach((row, index) => {
    const uniqueKey = tableConfig.uniqueKey
    let isDuplicate = false

    if (uniqueKey) {
      const keyValue = Array.isArray(uniqueKey)
        ? uniqueKey.map(k => row[k]).join('|')
        : row[uniqueKey]

      isDuplicate = duplicates.has(keyValue)
    }

    if (isDuplicate) {
      if (duplicateHandling === 'skip') {
        results.skipped++
      } else if (duplicateHandling === 'update') {
        rowsToUpdate.push({ row, originalIndex: index })
      }
    } else {
      rowsToInsert.push({ row, originalIndex: index })
    }
  })

  // Batch insert new rows
  const BATCH_SIZE = 50
  const totalOperations = rowsToInsert.length + rowsToUpdate.length
  let completedOperations = 0

  // Handle edge case where all rows are skipped (no operations to perform)
  if (totalOperations === 0) {
    onProgress(100, 'Import complete!')
    return results
  }

  for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
    const batch = rowsToInsert.slice(i, i + BATCH_SIZE)
    const batchRows = batch.map(b => b.row)

    onProgress(
      10 + Math.floor((completedOperations / totalOperations) * 80),
      `Importing rows ${i + 1} to ${Math.min(i + BATCH_SIZE, rowsToInsert.length)}...`
    )

    try {
      const { error } = await supabase
        .from(tableKey)
        .insert(batchRows)

      if (error) {
        // Batch failed, try individual inserts
        for (const item of batch) {
          try {
            const { error: singleError } = await supabase
              .from(tableKey)
              .insert(item.row)

            if (singleError) {
              results.failed++
              results.errors.push({
                rowIndex: item.originalIndex + 1,
                error: singleError.message,
                row: data[item.originalIndex],
              })
            } else {
              results.success++
            }
          } catch (e) {
            results.failed++
            results.errors.push({
              rowIndex: item.originalIndex + 1,
              error: e.message,
              row: data[item.originalIndex],
            })
          }
        }
      } else {
        results.success += batch.length
      }
    } catch (e) {
      // Handle batch failure
      results.failed += batch.length
      batch.forEach(item => {
        results.errors.push({
          rowIndex: item.originalIndex + 1,
          error: e.message,
          row: data[item.originalIndex],
        })
      })
    }

    completedOperations += batch.length
  }

  // Handle updates for duplicates
  for (const { row, originalIndex } of rowsToUpdate) {
    onProgress(
      10 + Math.floor((completedOperations / totalOperations) * 80),
      `Updating duplicate records...`
    )

    try {
      const uniqueKey = tableConfig.uniqueKey
      let query = supabase.from(tableKey).update(row).eq('user_id', userId)

      if (Array.isArray(uniqueKey)) {
        uniqueKey.forEach(k => {
          query = query.eq(k, row[k])
        })
      } else {
        query = query.eq(uniqueKey, row[uniqueKey])
      }

      const { error } = await query

      if (error) {
        results.failed++
        results.errors.push({
          rowIndex: originalIndex + 1,
          error: error.message,
          row: data[originalIndex],
        })
      } else {
        results.success++
      }
    } catch (e) {
      results.failed++
      results.errors.push({
        rowIndex: originalIndex + 1,
        error: e.message,
        row: data[originalIndex],
      })
    }

    completedOperations++
  }

  onProgress(100, 'Import complete!')

  return results
}

/**
 * Generate a CSV string from failed rows for download
 * @param {Object[]} errors - Array of error objects with row data
 * @param {string[]} originalHeaders - Original CSV headers
 * @returns {string} - CSV string
 */
export function generateFailedRowsCSV(errors, originalHeaders) {
  const rows = errors.map(e => e.row)
  return Papa.unparse(rows, {
    columns: originalHeaders,
    header: true,
  })
}

/**
 * Download a CSV file
 * @param {string} csvContent - CSV string content
 * @param {string} filename - Filename for download
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
