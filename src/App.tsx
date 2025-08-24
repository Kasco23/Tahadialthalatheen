import ConnectionBanner from '@/components/ConnectionBanner';
import LanguageToggle from '@/components/LanguageToggle';
import {
  SimpleThemeControls,
  ThemedHexBackground,
  ThemeProvider,
} from '@/theme';
import { Provider as JotaiProvider } from 'jotai';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

// Lazy load page components to reduce initial bundle size
const Landing = lazy(() => import('@/pages/Landing'));
const CreateSession = lazy(() => import('@/pages/CreateSession'));
const Join = lazy(() => import('@/pages/Join'));
const Lobby = lazy(() => import('@/pages/Lobby'));

const QuizRoom = lazy(() => import('@/pages/QuizRoom'));
const ControlRoom = lazy(() => import('@/pages/ControlRoom'));
const FinalScores = lazy(() => import('@/pages/FinalScores'));
const ApiStatus = lazy(() => import('@/pages/ApiStatus'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading component for suspense fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <div className="text-theme-text opacity-70">Loading...</div>
      </div>
    </div>
  );
}

/**
 * Root application component with lazy-loaded routes for optimal bundle splitting.
 * This ensures fast initial page load while keeping individual page chunks small.
 * Now includes the theme system with dynamic backgrounds and team-based theming.
 */
export default function App() {
  return (
    <JotaiProvider>
      <ThemeProvider>
        <div className="dark min-h-screen relative">
          {/* Dynamic theme-based hexagonal background */}
          <ThemedHexBackground />

          {/* Application content */}
          <div className="relative z-20 min-h-screen">
            <ConnectionBanner />
            <LanguageToggle />
            <SimpleThemeControls />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/create-session" element={<CreateSession />} />
                <Route path="/control-room" element={<ControlRoom />} />
                <Route path="/join" element={<Join />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/lobby/:gameId" element={<Lobby />} />
                <Route path="/quiz" element={<QuizRoom />} />
                <Route path="/scores" element={<FinalScores />} />
                <Route path="/api-status" element={<ApiStatus />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </ThemeProvider>
    </JotaiProvider>
  );
}
