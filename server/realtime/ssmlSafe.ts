/**
 * SSML sanitization utilities to prevent injection and ensure validity
 */

/**
 * Escapes text content for safe inclusion in SSML
 */
export function escapeTextForSSML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Strips dangerous SSML tags, keeping only safe ones
 */
export function stripDangerousTags(ssml: string): string {
  // Allowlist of safe SSML tags
  const allowedTags = [
    'speak',
    'prosody',
    'break',
    'emphasis',
    'say-as'
  ];

  // Create regex pattern for allowed tags
  const allowedPattern = allowedTags.join('|');
  const tagRegex = new RegExp(`<(?:\/?)(?:${allowedPattern})(?:\s[^>]*)?>`, 'gi');

  // Extract all allowed tags
  const allowedTagsFound = ssml.match(tagRegex) || [];
  
  // Remove all tags first
  let cleaned = ssml.replace(/<[^>]*>/g, ' ');
  
  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Re-insert allowed tags in order
  // This is a simplified approach - in production you might want more sophisticated parsing
  let result = cleaned;
  
  // Handle speak tags
  if (allowedTagsFound.some(tag => tag.toLowerCase().includes('speak'))) {
    if (!result.startsWith('<speak>')) {
      result = `<speak>${result}</speak>`;
    }
  }

  // Handle prosody tags
  const prosodyTags = allowedTagsFound.filter(tag => tag.toLowerCase().includes('prosody'));
  if (prosodyTags.length >= 2) {
    const openTag = prosodyTags.find(tag => !tag.includes('/'));
    const closeTag = prosodyTags.find(tag => tag.includes('/'));
    if (openTag && closeTag) {
      result = result.replace('<speak>', `<speak>${openTag}`);
      result = result.replace('</speak>', `${closeTag}</speak>`);
    }
  }

  // Handle break tags (self-closing)
  const breakTags = allowedTagsFound.filter(tag => tag.toLowerCase().includes('break'));
  breakTags.forEach(breakTag => {
    // Insert breaks at logical positions (after punctuation)
    result = result.replace(/([.!?,:;])\s+/g, `$1 ${breakTag} `);
  });

  // Clean up any malformed structures
  result = result
    .replace(/\s+/g, ' ')
    .replace(/\s*<\s*/g, '<')
    .replace(/\s*>\s*/g, '>')
    .trim();

  return result;
}

/**
 * Validates basic SSML structure
 */
export function validateSSMLStructure(ssml: string): boolean {
  // Check for balanced tags
  const openTags = (ssml.match(/<[^\/][^>]*>/g) || []).length;
  const closeTags = (ssml.match(/<\/[^>]*>/g) || []).length;
  const selfClosingTags = (ssml.match(/<[^>]*\/>/g) || []).length;
  
  // Should have equal opening and closing tags (excluding self-closing)
  return openTags === closeTags + selfClosingTags;
}