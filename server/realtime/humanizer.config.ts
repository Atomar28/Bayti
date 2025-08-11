/**
 * Configuration settings for the humanizer layer
 */

export const HUMANIZE_ENABLED = (process.env.HUMANIZE_ENABLED ?? 'true').toLowerCase() === 'true';
export const FILLER_RATE = Number(process.env.FILLER_RATE ?? 0.12); // 12%
export const BREAK_SHORT_MS = Number(process.env.BREAK_SHORT_MS ?? 150);
export const BREAK_CLAUSE_MS = Number(process.env.BREAK_CLAUSE_MS ?? 220);
export const PACE_JITTER_PCT = Number(process.env.PACE_JITTER_PCT ?? 5);
export const PITCH_JITTER_PCT = Number(process.env.PITCH_JITTER_PCT ?? 2);