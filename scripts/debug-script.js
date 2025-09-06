// Debug script for Daily room creation
// Copy and paste this into the browser console to enable enhanced debugging

// Override fetch to log all requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const [url, options] = args;
  console.log('🌐 FETCH REQUEST:', {
    url,
    method: options?.method || 'GET',
    headers: options?.headers,
    body: options?.body
  });
  
  return originalFetch.apply(this, args).then(response => {
    console.log('📨 FETCH RESPONSE:', {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    // Clone the response so we can read it without consuming the original
    const clonedResponse = response.clone();
    clonedResponse.text().then(text => {
      console.log('📝 RESPONSE BODY:', text);
    }).catch(err => {
      console.log('❌ Could not read response body:', err);
    });
    
    return response;
  }).catch(error => {
    console.error('🚨 FETCH ERROR:', {
      url,
      error: error.message,
      stack: error.stack
    });
    throw error;
  });
};

// Enhanced console logging for errors
const originalError = console.error;
console.error = function(...args) {
  originalError.apply(console, ['🔥 ERROR:', ...args]);
};

// Enhanced console logging for warnings
const originalWarn = console.warn;
console.warn = function(...args) {
  originalWarn.apply(console, ['⚠️  WARNING:', ...args]);
};

console.log('🔧 Debug mode enabled! All network requests and errors will be logged.');
console.log('📍 Navigate to the GameSetup page and try creating a Daily room.');
