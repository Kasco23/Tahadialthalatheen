// Test frontend development mode detection
// Save this as test-dev-mode.html and open in browser

console.log('=== Frontend Environment Analysis ===');
console.log('import.meta.env.DEV:', import.meta.env?.DEV);
console.log('import.meta.env.PROD:', import.meta.env?.PROD);
console.log('import.meta.env.MODE:', import.meta.env?.MODE);
console.log(
  'process.env.NODE_ENV:',
  typeof process !== 'undefined' ? process.env?.NODE_ENV : 'undefined',
);

console.log('\n=== Supabase Environment Variables ===');
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
console.log(
  'VITE_SUPABASE_ANON_KEY preview:',
  import.meta.env.VITE_SUPABASE_ANON_KEY
    ? import.meta.env.VITE_SUPABASE_ANON_KEY.slice(0, 10) + '...'
    : 'MISSING',
);

console.log('\n=== Development Mode Check ===');
const isDevelopmentMode = () => import.meta.env?.DEV === true;
console.log('isDevelopmentMode():', isDevelopmentMode());

console.log('\n=== Supabase Configuration Check ===');
// This should match the logic in supabaseLazy.ts
const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  return (
    url &&
    key &&
    url !== 'https://example.supabase.co' &&
    key !== 'example-key-placeholder' &&
    !key.includes('PLACEHOLDER')
  );
};

console.log('isSupabaseConfigured():', isSupabaseConfigured());

console.log('\n=== GameDatabase will use ===');
console.log('Will use in-memory storage:', isDevelopmentMode());
console.log(
  'Will use Supabase:',
  isSupabaseConfigured() && !isDevelopmentMode(),
);
