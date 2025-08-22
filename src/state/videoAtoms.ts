import { atom } from 'jotai';

// Simple video error tracking atom
export const videoErrorAtom = atom<string | null>(null);

// Action atom for testing Daily.co connectivity
export const testDailyConnectionAtom = atom(null, async (_get, set) => {
  set(videoErrorAtom, null);

  try {
    // Test endpoint availability without creating test rooms
    const response = await fetch('/.netlify/functions/create-daily-room', {
      method: 'OPTIONS',
    });

    if (response.status === 404) {
      throw new Error('Daily.co endpoint not available');
    }

    console.log('Daily.co endpoint is available');
    return true;
  } catch (error) {
    console.error('Daily.co test failed:', error);
    set(
      videoErrorAtom,
      error instanceof Error ? error.message : 'Connection test failed',
    );
    return false;
  }
});
