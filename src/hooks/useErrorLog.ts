import { useEffect, useState } from 'react';

/**
 * Hooks into console.error and keeps a rolling log of the most recent errors.
 * Useful for debugging API calls on the live site.
 */
export function useErrorLog(limit = 20): string[] {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const original = console.error;
    const handler = (...args: unknown[]) => {
      setLogs((prev) => [...prev, args.map(String).join(' ')].slice(-limit));
      original(...args);
    };
    console.error = handler;
    return () => {
      console.error = original;
    };
  }, [limit]);

  return logs;
}
