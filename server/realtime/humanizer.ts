/**
 * Adaptive humanizer layer for converting LLM text into natural, SSML-enhanced speech
 * with micro-pauses, prosody variation, backchannels, and caller energy mirroring.
 */

import { escapeTextForSSML, stripDangerousTags } from './ssmlSafe.js';

export interface Persona {
  name?: string;
  warmth?: number; // 0-1, affects empathy insertions
  formality?: number; // 0-1, affects backchannel selection
  fillerRate?: number; // 0-1, probability of inserting backchannels
  paceJitterPct?: number; // percentage variation in speech rate
  pitchJitterPct?: number; // percentage variation in pitch
  breakMs?: {
    short: number; // break after commas
    clause: number; // break after sentence endings
  };
}

export interface ConversationSignals {
  avgWordsPerMin?: number;
  userEnergy?: 'low' | 'med' | 'high';
  sentiment?: 'neg' | 'neu' | 'pos';
  lastUserText?: string;
}

const DEFAULT_PERSONA: Required<Persona> = {
  name: 'default',
  warmth: 0.6,
  formality: 0.4,
  fillerRate: 0.12,
  paceJitterPct: 5,
  pitchJitterPct: 2,
  breakMs: {
    short: 150,
    clause: 220
  }
};

const BACKCHANNELS = [
  "right,", "okay,", "sure,", "mm-hmm,", "got it,"
];

const EMPATHY_PHRASES = [
  "I understand.", "I see.", "That makes sense.", "I hear you."
];

/**
 * Renders natural SSML from plain text using conversation signals and persona settings
 */
export function renderSSML(
  text: string, 
  signals: ConversationSignals = {}, 
  persona: Persona = {}
): string {
  if (!text || text.trim().length === 0) {
    return '';
  }

  const config = { ...DEFAULT_PERSONA, ...persona };
  let processedText = text.trim();

  // Add empathy phrase for negative sentiment (once per reply)
  if (signals.sentiment === 'neg' && config.warmth > 0.5 && Math.random() < 0.3) {
    const empathy = EMPATHY_PHRASES[Math.floor(Math.random() * EMPATHY_PHRASES.length)];
    processedText = `${empathy} <break time="${config.breakMs.short}ms"/> ${processedText}`;
  }

  // Add backchannel at the beginning for direct answers/confirmations
  if (shouldAddBackchannel(processedText, config.fillerRate)) {
    const backchannel = BACKCHANNELS[Math.floor(Math.random() * BACKCHANNELS.length)];
    processedText = `${backchannel} <break time="${config.breakMs.short}ms"/> ${processedText}`;
  }

  // Split into clauses and add breaks
  processedText = addClauseBreaks(processedText, config.breakMs);

  // Apply prosody variations based on signals and persona
  const prosodyAttrs = buildProsodyAttributes(signals, config);
  if (prosodyAttrs) {
    processedText = `<prosody ${prosodyAttrs}>${processedText}</prosody>`;
  }

  // Wrap in speak tag
  const ssml = `<speak>${processedText}</speak>`;

  return sanitizeSSML(ssml);
}

/**
 * Estimates conversation signals from recent conversation turns
 */
export function estimateSignalsFromTurns(
  turns: Array<{ role: 'user' | 'agent'; text: string; ms: number }>
): ConversationSignals {
  if (turns.length === 0) {
    return { userEnergy: 'med', sentiment: 'neu' };
  }

  // Get recent user turns (last 3)
  const recentUserTurns = turns
    .filter(turn => turn.role === 'user')
    .slice(-3);

  if (recentUserTurns.length === 0) {
    return { userEnergy: 'med', sentiment: 'neu' };
  }

  const lastUserTurn = recentUserTurns[recentUserTurns.length - 1];
  const lastUserText = lastUserTurn.text;

  // Estimate words per minute from recent user turns
  let avgWordsPerMin = 150; // default
  if (recentUserTurns.length >= 2) {
    const totalWords = recentUserTurns.reduce((sum, turn) => 
      sum + turn.text.split(/\s+/).length, 0
    );
    const totalTimeMin = recentUserTurns.reduce((sum, turn) => 
      sum + turn.ms, 0
    ) / 60000; // convert ms to minutes
    
    if (totalTimeMin > 0) {
      avgWordsPerMin = Math.max(80, Math.min(250, totalWords / totalTimeMin));
    }
  }

  // Estimate energy from text characteristics
  const userEnergy = estimateEnergyFromText(lastUserText, avgWordsPerMin);
  
  // Estimate sentiment from text
  const sentiment = estimateSentimentFromText(lastUserText);

  return {
    avgWordsPerMin,
    userEnergy,
    sentiment,
    lastUserText
  };
}

/**
 * Sanitizes SSML to prevent injection and ensure validity
 */
export function sanitizeSSML(ssml: string): string {
  // First escape any unescaped text content
  let sanitized = escapeTextForSSML(ssml);
  
  // Then strip dangerous tags, keeping only safe SSML
  sanitized = stripDangerousTags(sanitized);
  
  // Validate basic SSML structure
  if (!sanitized.includes('<speak>')) {
    sanitized = `<speak>${sanitized}</speak>`;
  }

  return sanitized;
}

// Private helper functions

function shouldAddBackchannel(text: string, fillerRate: number): boolean {
  // Only add backchannels for direct answers/confirmations
  const startsWithAnswer = /^(yes|yeah|no|sure|okay|right|exactly|absolutely|definitely|of course)/i.test(text.trim());
  
  return startsWithAnswer && Math.random() < fillerRate;
}

function addClauseBreaks(text: string, breakMs: { short: number; clause: number }): string {
  // Add breaks after punctuation
  let processed = text
    // Sentence endings get longer breaks
    .replace(/([.!?])\s+/g, `$1 <break time="${breakMs.clause}ms"/> `)
    // Commas and other punctuation get shorter breaks
    .replace(/([,;:])\s+/g, `$1 <break time="${breakMs.short}ms"/> `);

  return processed;
}

function buildProsodyAttributes(signals: ConversationSignals, config: Required<Persona>): string | null {
  const attrs: string[] = [];

  // Base rate adjustment based on user energy
  let rateAdjustment = 0;
  if (signals.userEnergy === 'low') {
    rateAdjustment = -3; // slower for low energy
  } else if (signals.userEnergy === 'high') {
    rateAdjustment = 3; // faster for high energy
  }

  // Add random jitter
  const paceJitter = (Math.random() - 0.5) * 2 * config.paceJitterPct;
  const finalRate = Math.max(92, Math.min(107, 100 + rateAdjustment + paceJitter));

  if (Math.abs(finalRate - 100) > 0.5) {
    attrs.push(`rate="${finalRate}%"`);
  }

  // Pitch variation
  const pitchJitter = (Math.random() - 0.5) * 2 * config.pitchJitterPct;
  const finalPitch = Math.max(-3, Math.min(3, pitchJitter));

  if (Math.abs(finalPitch) > 0.5) {
    attrs.push(`pitch="${finalPitch > 0 ? '+' : ''}${finalPitch.toFixed(1)}%"`);
  }

  return attrs.length > 0 ? attrs.join(' ') : null;
}

function estimateEnergyFromText(text: string, avgWordsPerMin: number): 'low' | 'med' | 'high' {
  const words = text.split(/\s+/);
  const wordCount = words.length;
  
  // High energy indicators
  const exclamationCount = (text.match(/[!]/g) || []).length;
  const capsWords = words.filter(word => word.length > 1 && word === word.toUpperCase()).length;
  const energeticWords = words.filter(word => 
    /^(awesome|amazing|great|fantastic|wonderful|excited|love|perfect|excellent)$/i.test(word)
  ).length;

  // Low energy indicators
  const lowEnergyWords = words.filter(word =>
    /^(tired|exhausted|okay|fine|whatever|maybe|guess|suppose|not sure)$/i.test(word)
  ).length;

  // Calculate energy score
  let energyScore = 0;
  energyScore += exclamationCount * 2;
  energyScore += capsWords * 1.5;
  energyScore += energeticWords * 1;
  energyScore -= lowEnergyWords * 1.5;
  
  // Factor in speech rate if available
  if (avgWordsPerMin > 180) energyScore += 1;
  if (avgWordsPerMin < 120) energyScore -= 1;

  if (energyScore > 1.5) return 'high';
  if (energyScore < -1) return 'low';
  return 'med';
}

function estimateSentimentFromText(text: string): 'neg' | 'neu' | 'pos' {
  const words = text.toLowerCase().split(/\s+/);
  
  const positiveWords = words.filter(word =>
    /^(good|great|excellent|amazing|wonderful|happy|pleased|satisfied|perfect|love|like|awesome|fantastic)$/.test(word)
  ).length;

  const negativeWords = words.filter(word =>
    /^(bad|terrible|awful|horrible|hate|dislike|disappointed|frustrated|annoyed|angry|upset|sad|worried|concerned|problem|issue|wrong)$/.test(word)
  ).length;

  const sentimentScore = positiveWords - negativeWords;
  
  if (sentimentScore > 0) return 'pos';
  if (sentimentScore < 0) return 'neg';
  return 'neu';
}