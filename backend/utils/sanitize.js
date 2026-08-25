/**
 * Sanitizes user input to prevent Regular Expression Denial of Service (ReDoS)
 * and unintended regex pattern injection in MongoDB queries.
 */
const escapeRegex = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = { escapeRegex };
