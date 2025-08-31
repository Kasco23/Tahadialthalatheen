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
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    VITE_DAILY_DOMAIN: import.meta.env.VITE_DAILY_DOMAIN,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION,
  };

  // Check required variables
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
      errors.push(`Missing required environment variable: ${key}`);
    } else if (value.includes('example') || value.includes('placeholder')) {
      errors.push(`Environment variable ${key} appears to use placeholder value`);
    }
  });

  // Check optional variables
  Object.entries(optionalVars).forEach(([key, value]) => {
    if (!value) {
      warnings.push(`Optional environment variable not set: ${key}`);
    }
  });

  // Special validation for Supabase URL
  const supabaseUrl = requiredVars.VITE_SUPABASE_URL;
  if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9-]+\.supabase\.co$/)) {
    errors.push('VITE_SUPABASE_URL format appears invalid (should be https://your-project.supabase.co)');
  }

  const isValid = errors.length === 0;

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