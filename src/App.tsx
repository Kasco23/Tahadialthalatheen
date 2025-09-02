import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppLayout } from '@/components/Layout/AppLayout';
import { AuthProvider } from '@/context/AuthContext';
import {
  ConditionalBackground,
  ThemeProvider,
} from '@/theme';
import { Provider as JotaiProvider } from 'jotai';

/**
 * Root application component with lazy-loaded routes for optimal bundle splitting.
 * This ensures fast initial page load while keeping individual page chunks small.
 * Now includes the theme system with dynamic backgrounds and team-based theming.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <JotaiProvider>
        <ThemeProvider>
          <AuthProvider>
            <div className="min-h-screen relative">
              {/* Dynamic theme-based background (conditional) */}
              <ConditionalBackground />

              {/* Application content with sidebar */}
              <div className="relative z-20 min-h-screen">
                <AppLayout />
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </JotaiProvider>
    </ErrorBoundary>
  );
}
