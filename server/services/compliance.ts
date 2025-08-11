import moment from 'moment-timezone';
import { db } from '../db';
import { suppressions } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Check if phone number is on suppression list
export async function isSuppressed(phoneE164: string): Promise<boolean> {
  try {
    const [suppression] = await db
      .select()
      .from(suppressions)
      .where(eq(suppressions.phoneE164, phoneE164))
      .limit(1);
    
    return !!suppression;
  } catch (error) {
    console.error('Error checking suppression status:', error);
    return false; // Default to not suppressed if there's an error
  }
}

// Add phone number to suppression list
export async function recordOptOut(phoneE164: string, reason: string = 'User opt-out'): Promise<void> {
  try {
    await db
      .insert(suppressions)
      .values({
        phoneE164,
        reason,
        addedAt: new Date(),
      })
      .onConflictDoNothing(); // Don't error if already exists
    
    console.log(`Added ${phoneE164} to suppression list: ${reason}`);
  } catch (error) {
    console.error('Error recording opt-out:', error);
    throw new Error('Failed to record opt-out');
  }
}

// Check if current time is within business hours
export async function isBusinessHours(
  timezone: string, 
  businessHours: { start: string; end: string; days: number[] }
): Promise<boolean> {
  try {
    const now = moment.tz(timezone);
    const currentDay = now.day(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.format('HH:mm');
    
    // Check if today is a business day
    if (!businessHours.days.includes(currentDay)) {
      return false;
    }
    
    // Check if current time is within business hours
    return currentTime >= businessHours.start && currentTime <= businessHours.end;
  } catch (error) {
    console.error('Error checking business hours:', error);
    return false; // Default to outside business hours if there's an error
  }
}

// Get the next available business window
export async function getNextBusinessWindow(
  timezone: string,
  businessHours: { start: string; end: string; days: number[] }
): Promise<Date> {
  try {
    let nextWindow = moment.tz(timezone);
    
    // Find next business day
    while (!businessHours.days.includes(nextWindow.day())) {
      nextWindow.add(1, 'day');
    }
    
    // Set to start of business hours
    const [startHour, startMinute] = businessHours.start.split(':').map(Number);
    nextWindow.hour(startHour).minute(startMinute).second(0).millisecond(0);
    
    // If we're already past business hours today, move to tomorrow
    const now = moment.tz(timezone);
    if (nextWindow.isSameOrBefore(now) && businessHours.days.includes(now.day())) {
      nextWindow.add(1, 'day');
      
      // Find next business day again
      while (!businessHours.days.includes(nextWindow.day())) {
        nextWindow.add(1, 'day');
      }
      
      nextWindow.hour(startHour).minute(startMinute).second(0).millisecond(0);
    }
    
    return nextWindow.toDate();
  } catch (error) {
    console.error('Error calculating next business window:', error);
    // Default to 1 hour from now
    return new Date(Date.now() + 3600000);
  }
}

// Validate business hours configuration
export function validateBusinessHours(businessHours: any): boolean {
  if (!businessHours || typeof businessHours !== 'object') {
    return false;
  }
  
  const { start, end, days } = businessHours;
  
  // Validate start and end times
  if (!start || !end || typeof start !== 'string' || typeof end !== 'string') {
    return false;
  }
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(start) || !timeRegex.test(end)) {
    return false;
  }
  
  // Validate days array
  if (!Array.isArray(days) || days.length === 0) {
    return false;
  }
  
  // Check that all days are valid (0-6)
  if (!days.every(day => Number.isInteger(day) && day >= 0 && day <= 6)) {
    return false;
  }
  
  return true;
}

// Get compliance-safe calling window for a timezone
export function getCallingWindow(timezone: string = 'Asia/Dubai'): {
  start: string;
  end: string;
  days: number[];
} {
  // UAE/Dubai compliance: 9:30 AM to 7:30 PM, Sunday to Friday
  // (Sunday = 0, Monday = 1, ..., Friday = 5)
  return {
    start: '09:30',
    end: '19:30',
    days: [0, 1, 2, 3, 4, 5], // Sunday to Friday in UAE
  };
}

// Check if a phone number is valid for calling
export function isValidCallingNumber(phoneE164: string): boolean {
  if (!phoneE164 || !phoneE164.startsWith('+')) {
    return false;
  }
  
  // Basic E.164 format validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneE164);
}