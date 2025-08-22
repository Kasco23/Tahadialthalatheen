/**
 * Development-only network request monitoring utility
 * Conditionally compiled - only active in development builds
 */

interface NetworkRequestInfo {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown;
  timestamp: string;
  duration?: number;
}

interface NetworkResponseInfo {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  size?: number;
  duration: number;
}

let requestCounter = 0;
const activeRequests = new Map<
  number,
  { info: NetworkRequestInfo; startTime: number }
>();

// Monitor all network requests in development
export const enableNetworkDebugging = () => {
  if (!import.meta.env.DEV) {
    return; // No-op in production
  }

  // Only enable if not already enabled
  if (window.fetch.toString().includes('Network Debug')) {
    return;
  }

  const originalFetch = window.fetch;

  // Override fetch with debugging wrapper
  window.fetch = async function debugFetch(input, init) {
    const requestId = ++requestCounter;
    let url: string;
    let method = 'GET';

    // Extract URL and method
    if (typeof input === 'string') {
      url = input;
    } else if (input instanceof Request) {
      url = input.url;
      method = input.method;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = String(input);
    }

    if (init?.method) {
      method = init.method;
    }

    const requestInfo: NetworkRequestInfo = {
      url,
      method,
      headers: init?.headers as Record<string, string>,
      body: init?.body,
      timestamp: new Date().toISOString(),
    };

    const startTime = performance.now();
    activeRequests.set(requestId, { info: requestInfo, startTime });

    console.group(`🌐 Network Request #${requestId} - ${method} ${url}`);
    console.log('Request Info:', requestInfo);

    try {
      const response = await originalFetch(input, init);
      const endTime = performance.now();
      const duration = endTime - startTime;

      const responseInfo: NetworkResponseInfo = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        duration,
      };

      // Log response info
      console.log('Response Info:', responseInfo);

      // Color-code based on status
      const statusColor = response.ok ? 'color: green' : 'color: red';
      console.log(
        `%cStatus: ${response.status} ${response.statusText}`,
        statusColor,
      );
      console.log(`Duration: ${duration.toFixed(2)}ms`);

      // Clean up tracking
      activeRequests.delete(requestId);
      console.groupEnd();

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.error('Network Error:', error);
      console.log(`Duration: ${duration.toFixed(2)}ms`);

      // Clean up tracking
      activeRequests.delete(requestId);
      console.groupEnd();

      throw error;
    }
  };

  // Mark the function to prevent double-wrapping
  Object.defineProperty(window.fetch, 'toString', {
    value: () => 'function fetch() { [Network Debug Enabled] }',
  });

  console.log('🌐 Network debugging enabled');
};

// Get statistics about network requests
export const getNetworkStats = () => {
  if (!import.meta.env.DEV) {
    return null;
  }

  return {
    activeRequests: activeRequests.size,
    totalRequests: requestCounter,
    activeRequestsList: Array.from(activeRequests.values()).map((req) => ({
      url: req.info.url,
      method: req.info.method,
      duration: performance.now() - req.startTime,
    })),
  };
};

// Clear all network debugging data
export const clearNetworkDebugData = () => {
  if (import.meta.env.DEV) {
    activeRequests.clear();
    requestCounter = 0;
    console.log('🌐 Network debug data cleared');
  }
};

// Auto-enable in development if needed
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_AUTO_ENABLE_NETWORK_DEBUG === 'true'
) {
  enableNetworkDebugging();
}
