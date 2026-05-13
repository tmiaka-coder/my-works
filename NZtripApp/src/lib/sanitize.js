import DOMPurify from 'dompurify'

export function sanitizeText(input) {
  if (typeof input !== 'string') return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim()
}