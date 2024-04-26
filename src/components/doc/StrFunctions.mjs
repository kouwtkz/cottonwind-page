/** @param {string} str */
export function toUpperFirstCase(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/** @param {any} value */
export function CompactCode(value) {
  return String(value).replace(/\s+/g, " ")
}