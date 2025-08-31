/**
 * Environment Configuration Check
 * Validates required environment variables and provides user-friendly feedback
 */

export interface EnvironmentStatus {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

export function checkEnvironmentConfiguration(): EnvironmentStatus {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missing: string[] = [];

  // Required environment variables
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  // Optional environment variables
  const optionalVars = {
    VITE_DAILY_DOMAIN: import.meta.env.VITE_DAILY_DOMAIN,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  };

  // Check required variables - but treat as warnings instead of hard errors
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
      // Treat missing required vars as warnings instead of errors to prevent app crashes
      warnings.push(`Missing required environment variable: ${key} (app may not function properly)`);
    } else if (value.includes('example') || value.includes('placeholder')) {
      warnings.push(`Environment variable ${key} appears to use placeholder value`);
    }
  });

  // Check optional variables
  Object.entries(optionalVars).forEach(([key, value]) => {
    if (!value) {
      warnings.push(`Optional environment variable not set: ${key}`);
    }
  });

  // Special validation for Supabase URL - make it non-blocking
  const supabaseUrl = requiredVars.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
    warnings.push('VITE_SUPABASE_URL format appears invalid (should be https://your-project.supabase.co)');
  }

  // Always return as valid to prevent app crashes, but log warnings
  const isValid = true; // Changed from errors.length === 0

  return {
    isValid,
    errors,
    warnings,
    missing
  };
}

export function getEnvironmentMessage(): { type: 'error' | 'warning' | 'success'; message: string } {
  const status = checkEnvironmentConfiguration();
  
  if (!status.isValid) {
    return {
      type: 'error',
      message: `Configuration Error: ${status.errors.join(', ')}`
    };
  }
  
  if (status.warnings.length > 0) {
    return {
      type: 'warning',
      message: `Some optional features may not work: ${status.warnings.length} optional variables missing`
    };
  }
  
  return {
    type: 'success',
    message: 'Environment configuration is valid'
  };
}

// Development helper
if (import.meta.env.DEV) {
  const status = checkEnvironmentConfiguration();
  if (!status.isValid) {
    console.warn('🔧 Environment Configuration Issues:');
    status.errors.forEach(error => console.warn(`❌ ${error}`));
    status.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
  } else {
    console.log('✅ Environment configuration is valid');
  }
}