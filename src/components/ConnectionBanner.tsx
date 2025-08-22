import { useState, useEffect } from 'react';
import {
  isSupabaseConfigured,
  getConfigurationError,
} from '@/lib/supabaseLazy';
import { testDailyIntegration } from '@/lib/dailyConfig';

/**
 * Simplified connection status banner with real-time Daily.co testing
 */
export default function ConnectionBanner() {
  const [dailyConnected, setDailyConnected] = useState<boolean | null>(null);
  const [isTestingDaily, setIsTestingDaily] = useState(false);

  const supabaseConnected = isSupabaseConfigured();
  const supabaseError = getConfigurationError();

  // Test Daily.co on component mount
  useEffect(() => {
    const testDaily = async () => {
      setIsTestingDaily(true);
      try {
        const result = await testDailyIntegration();
        setDailyConnected(result);
      } catch (error) {
        console.error('Daily.co test error:', error);
        setDailyConnected(false);
      } finally {
        setIsTestingDaily(false);
      }
    };

    testDaily();
  }, []);

  // Show loading state while testing Daily.co
  if (dailyConnected === null && isTestingDaily) {
    return (
      <div className="w-full bg-blue-800 text-center text-xs text-white py-1">
        🔄 Testing Daily.co connection...
      </div>
    );
  }

  // All services connected - production ready
  if (supabaseConnected && dailyConnected) {
    return (
      <div className="w-full bg-green-800 text-center text-xs text-white py-1">
        ✅ Production Environment: Supabase & Daily.co connected
      </div>
    );
  }

  // No services connected - offline mode
  if (!supabaseConnected && !dailyConnected) {
    return (
      <div className="w-full bg-red-800 text-center text-xs text-white py-1">
        ⚠️ Offline Mode: Missing Supabase & Daily.co configuration
        {supabaseError && (
          <div className="text-red-200 text-xs mt-1">{supabaseError}</div>
        )}
      </div>
    );
  }

  // Partial configuration - development mode
  const services = [
    supabaseConnected ? 'Supabase ✅' : 'Supabase ❌',
    dailyConnected ? 'Daily.co ✅' : 'Daily.co ❌',
  ].join(' • ');

  const errors = [];
  if (supabaseError) errors.push(supabaseError);
  if (!dailyConnected) errors.push('Daily.co API not responding');

  return (
    <div className="w-full bg-yellow-800 text-center text-xs text-white py-1">
      ⚠️ Partial Configuration: {services}
      {errors.length > 0 && (
        <div className="text-yellow-200 text-xs mt-1">{errors.join(' • ')}</div>
      )}
    </div>
  );
}
