/**
 * Development-only debug logging utility
 * Conditionally compiled - only included in development builds
 */

// Type definitions for better developer experience
interface DebugContext {
  component: string;
  action: string;
  data?: unknown;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
}

export const debugLog = (component: string, action: string, data?: unknown) => {
  if (import.meta.env.DEV) {
    const context: DebugContext = {
      component,
      action,
      data,
      timestamp: new Date().toISOString(),
    };

    console.group(`🐛 ${component} - ${action}`);
    console.log('Context:', context);
    if (data) {
      console.log('Data:', data);
    }
    console.trace('Call stack');
    console.groupEnd();
  }
};

export const debugError = (
  component: string,
  error: Error | string,
  context?: unknown,
) => {
  if (import.meta.env.DEV) {
    console.group(`❌ ${component} - ERROR`);
    console.error('Error:', error);
    console.log('Timestamp:', new Date().toISOString());
    if (context) {
      console.log('Context:', context);
    }
    console.trace('Error stack');
    console.groupEnd();
  }
};

export const debugWarn = (
  component: string,
  message: string,
  data?: unknown,
) => {
  if (import.meta.env.DEV) {
    console.group(`⚠️ ${component} - WARNING`);
    console.warn('Message:', message);
    console.log('Timestamp:', new Date().toISOString());
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();
  }
};

export const debugPerformance = (
  component: string,
  operation: string,
  startTime: number,
) => {
  if (import.meta.env.DEV) {
    const duration = performance.now() - startTime;
    console.log(`⏱️ ${component} - ${operation}: ${duration.toFixed(2)}ms`);
  }
};

// Performance measurement helper
export const measurePerformance = (component: string, operation: string) => {
  if (import.meta.env.DEV) {
    const startTime = performance.now();
    return () => debugPerformance(component, operation, startTime);
  }
  return () => {}; // No-op in production
};
