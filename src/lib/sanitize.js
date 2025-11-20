import DOMPurify from 'dompurify'

/**
 * Sanitize user input to prevent XSS attacks
 * Strips all HTML tags and dangerous content
 *
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized text (no HTML)
 */
export function sanitizeText(input) {
  if (!input) return input

  // Strip all HTML tags - only allow plain text
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],      // No HTML tags allowed
    ALLOWED_ATTR: []       // No attributes allowed
  })
}

/**
 * Sanitize multiple fields in an object
 *
 * @param {Object} obj - Object with fields to sanitize
 * @param {Array<string>} fields - Array of field names to sanitize
 * @returns {Object} New object with sanitized fields
 */
export function sanitizeObject(obj, fields) {
  const sanitized = { ...obj }

  fields.forEach(field => {
    if (sanitized[field] && typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeText(sanitized[field])
    }
  })

  return sanitized
}

/**
 * Sanitize an array of strings
 *
 * @param {Array<string>} arr - Array of strings to sanitize
 * @returns {Array<string>} Array with sanitized strings
 */
export function sanitizeArray(arr) {
  if (!Array.isArray(arr)) return arr
  return arr.map(item => typeof item === 'string' ? sanitizeText(item) : item)
}
