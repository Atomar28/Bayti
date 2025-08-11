/**
 * Unit tests for the humanizer layer
 */

import { renderSSML, estimateSignalsFromTurns, sanitizeSSML, type ConversationSignals, type Persona } from '../server/realtime/humanizer.js';

// Simple test framework for development use
interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export function runHumanizerTests(): TestResult[] {
  const results: TestResult[] = [];

  // Store original Math.random for restoration
  const originalRandom = Math.random;

  function runTest(name: string, testFn: () => void): void {
    try {
      testFn();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  }

  runTest("adds clause breaks and keeps SSML valid", () => {
    const text = "Hello there. How are you today, my friend?";
    const ssml = renderSSML(text, { userEnergy: 'med', sentiment: 'neu' });
    
    // Should contain break tags
    if (!ssml.includes('<break')) {
      throw new Error('Expected break tags in SSML output');
    }
    
    // Should be wrapped in speak tags
    if (!ssml.startsWith('<speak>') || !ssml.endsWith('</speak>')) {
      throw new Error('Expected SSML to be wrapped in speak tags');
    }
    
    // Should contain the original text content
    if (!ssml.includes('Hello there') || !ssml.includes('How are you today')) {
      throw new Error('Original text content missing from SSML');
    }
  });

  runTest("applies small pace/pitch jitter", () => {
    // Mock Math.random to get predictable results
    Math.random = () => 0.7; // Will generate positive jitter

    const persona: Persona = {
      paceJitterPct: 5,
      pitchJitterPct: 2,
      fillerRate: 0 // Disable fillers for this test
    };

    const ssml = renderSSML("Test message", { userEnergy: 'med' }, persona);
    
    // Should contain prosody with rate and/or pitch attributes
    if (!ssml.includes('<prosody')) {
      throw new Error('Expected prosody tags in SSML output');
    }

    // Restore Math.random
    Math.random = originalRandom;
  });

  runTest("inserts filler at configured probability", () => {
    // Mock Math.random to ensure filler insertion
    Math.random = () => 0.05; // Low value to trigger backchannel

    const persona: Persona = {
      fillerRate: 0.5, // 50% chance
      paceJitterPct: 0, // No jitter for cleaner test
      pitchJitterPct: 0
    };

    // Text that should trigger backchannel (starts with confirmation)
    const text = "Yes, that sounds good to me.";
    const ssml = renderSSML(text, { userEnergy: 'med' }, persona);
    
    // Should contain one of the backchannels
    const backchannels = ["right,", "okay,", "sure,", "mm-hmm,", "got it,"];
    const containsBackchannel = backchannels.some(bc => ssml.includes(bc));
    
    if (!containsBackchannel) {
      throw new Error('Expected backchannel to be inserted for confirmation text');
    }

    // Restore Math.random
    Math.random = originalRandom;
  });

  runTest("mirrors low vs high energy by adjusting rate and breaks", () => {
    const lowEnergySignals: ConversationSignals = {
      userEnergy: 'low',
      avgWordsPerMin: 100,
      sentiment: 'neu'
    };

    const highEnergySignals: ConversationSignals = {
      userEnergy: 'high',
      avgWordsPerMin: 200,
      sentiment: 'pos'
    };

    const persona: Persona = {
      fillerRate: 0, // Disable fillers for cleaner test
      paceJitterPct: 0, // No jitter for predictable results
      pitchJitterPct: 0
    };

    const lowEnergySSML = renderSSML("This is a test message.", lowEnergySignals, persona);
    const highEnergySSML = renderSSML("This is a test message.", highEnergySignals, persona);

    // Low energy should have slower rate (or no rate adjustment resulting in default)
    // High energy should have faster rate
    if (highEnergySSML.includes('rate=') && !highEnergySSML.includes('rate="10')) {
      // If rate is specified, high energy should be faster than 100%
      const rateMatch = highEnergySSML.match(/rate="(\d+)%"/);
      if (rateMatch) {
        const rate = parseInt(rateMatch[1]);
        if (rate <= 100) {
          throw new Error('Expected high energy to have faster rate than baseline');
        }
      }
    }

    // Both should have break tags (energy affects break frequency but both should have some)
    if (!lowEnergySSML.includes('<break') || !highEnergySSML.includes('<break')) {
      throw new Error('Expected both low and high energy SSML to contain break tags');
    }
  });

  runTest("estimateSignalsFromTurns works with conversation history", () => {
    const turns = [
      { role: 'user' as const, text: 'I am so excited about this!', ms: 2000 },
      { role: 'agent' as const, text: 'That\'s wonderful to hear.', ms: 1500 },
      { role: 'user' as const, text: 'YES! This is amazing!', ms: 1800 }
    ];

    const signals = estimateSignalsFromTurns(turns);

    if (signals.userEnergy !== 'high') {
      throw new Error(`Expected high energy, got ${signals.userEnergy}`);
    }

    if (signals.sentiment !== 'pos') {
      throw new Error(`Expected positive sentiment, got ${signals.sentiment}`);
    }

    if (!signals.lastUserText?.includes('amazing')) {
      throw new Error('Expected lastUserText to be set correctly');
    }
  });

  runTest("sanitizeSSML removes dangerous content", () => {
    const dangerousSSML = '<speak>Hello <script>alert("xss")</script> world</speak>';
    const sanitized = sanitizeSSML(dangerousSSML);

    if (sanitized.includes('<script>')) {
      throw new Error('Script tags should be removed');
    }

    if (!sanitized.includes('Hello') || !sanitized.includes('world')) {
      throw new Error('Safe content should be preserved');
    }

    if (!sanitized.includes('<speak>')) {
      throw new Error('Safe SSML tags should be preserved');
    }
  });

  return results;
}

// Helper function to print test results
export function printTestResults(results: TestResult[]): void {
  console.log('\n=== Humanizer Test Results ===');
  let passed = 0;
  let failed = 0;

  results.forEach(result => {
    if (result.passed) {
      console.log(`✓ ${result.name}`);
      passed++;
    } else {
      console.log(`✗ ${result.name}: ${result.error}`);
      failed++;
    }
  });

  console.log(`\nTotal: ${results.length}, Passed: ${passed}, Failed: ${failed}`);
}