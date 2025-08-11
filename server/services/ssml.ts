// Convert text to SSML for better voice synthesis
export interface SSMLOptions {
  rate?: 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';
  pitch?: 'x-low' | 'low' | 'medium' | 'high' | 'x-high';
  addAcknowledgements?: boolean;
  addPauses?: boolean;
  emphasizeValues?: boolean;
}

export function toSSML(text: string, options: SSMLOptions = {}): string {
  const {
    rate = 'medium',
    pitch = 'medium',
    addAcknowledgements = true,
    addPauses = true,
    emphasizeValues = true,
  } = options;

  let ssml = text;

  // Add natural acknowledgements and fillers
  if (addAcknowledgements) {
    ssml = ssml.replace(/\b(yes|okay|right|sure|well|now|so)\b/gi, '<emphasis level="moderate">$1</emphasis>');
  }

  // Add pauses for better flow
  if (addPauses) {
    ssml = ssml.replace(/[,]/g, ',<break time="200ms"/>');
    ssml = ssml.replace(/[.!]/g, '$&<break time="300ms"/>');
    ssml = ssml.replace(/[?]/g, '$&<break time="400ms"/>');
  }

  // Emphasize important values (numbers, names, etc.)
  if (emphasizeValues) {
    // Emphasize proper nouns and names
    ssml = ssml.replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g, '<emphasis level="moderate">$&</emphasis>');
    
    // Emphasize numbers and prices
    ssml = ssml.replace(/\b\d+(?:,\d{3})*(?:\.\d+)?(?:\s*(?:AED|USD|dollars?|dirhams?))?/gi, '<emphasis level="strong">$&</emphasis>');
    
    // Emphasize percentages
    ssml = ssml.replace(/\b\d+(?:\.\d+)?\s*%/g, '<emphasis level="strong">$&</emphasis>');
  }

  // Add prosody for overall speech characteristics
  ssml = `<prosody rate="${rate}" pitch="${pitch}">${ssml}</prosody>`;

  // Wrap in speak tags for valid SSML
  return `<speak>${ssml}</speak>`;
}

// Generate SSML for real estate specific content
export function toRealEstateSSML(text: string): string {
  let ssml = text;

  // Emphasize property types
  ssml = ssml.replace(/\b(villa|apartment|studio|penthouse|townhouse|duplex)\b/gi, '<emphasis level="moderate">$&</emphasis>');

  // Emphasize locations
  ssml = ssml.replace(/\b(Dubai|Marina|Downtown|JBR|Palm|Emirates Hills|Jumeirah)\b/gi, '<emphasis level="strong">$&</emphasis>');

  // Emphasize key selling points
  ssml = ssml.replace(/\b(waterfront|beachfront|luxury|premium|exclusive|investment|ROI)\b/gi, '<emphasis level="moderate">$&</emphasis>');

  // Add appropriate pauses around property features
  ssml = ssml.replace(/(\d+)\s+(bedroom|bathroom|parking)/gi, '$1 <break time="100ms"/> $2');

  return toSSML(ssml, {
    rate: 'medium',
    pitch: 'medium',
    addAcknowledgements: true,
    addPauses: true,
    emphasizeValues: true,
  });
}

// Clean text for TTS (remove SSML tags if needed for fallback)
export function cleanForTTS(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove all XML/HTML tags
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}