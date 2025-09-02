import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ConnectionBanner from '@/components/ConnectionBanner';
import LanguageToggle from '@/components/LanguageToggle';
import { SideNav } from '@/components/Navigation/SideNav';
import { SidebarToggle } from '@/components/Navigation/SidebarToggle';
import { useSidebar } from '@/hooks/useSidebar';
import { SimpleThemeControls } from '@/theme';

// Lazy load page components to reduce initial bundle size
const Landing = lazy(() => import('@/pages/Landing'));
const CreateSession = lazy(() => import('@/pages/CreateSession'));
const Join = lazy(() => import('@/pages/Join'));
const Lobby = lazy(() => import('@/pages/Lobby'));
const QuizRoom = lazy(() => import('@/pages/QuizRoom'));
const ControlRoom = lazy(() => import('@/pages/ControlRoom'));
const FinalScores = lazy(() => import('@/pages/FinalScores'));
const ApiStatus = lazy(() => import('@/pages/ApiStatus'));
const AuthPage = lazy(() => import('@/pages/Auth'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Development-only components
const HexGridDemo = lazy(() => import('@/pages/HexGridDemo'));

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
 * Main app layout with sidebar navigation
 */
export const AppLayout: React.FC = () => {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="min-h-screen relative flex">
      {/* Sidebar */}
      <SideNav isOpen={isOpen} onToggle={toggle} />
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Mobile sidebar toggle */}
        <SidebarToggle onClick={toggle} />
        
        {/* App content */}
        <div className="flex-1 relative">
          <ConnectionBanner />
          <LanguageToggle />
          <SimpleThemeControls />
          
          <main className="p-4 lg:p-6">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/create-session" element={<CreateSession />} />
                <Route path="/control-room" element={<ControlRoom />} />
                <Route path="/join" element={<Join />} />
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/lobby/:sessionId" element={<Lobby />} />
                <Route path="/quiz" element={<QuizRoom />} />
                <Route path="/scores" element={<FinalScores />} />
                <Route path="/api-status" element={<ApiStatus />} />
                <Route path="/auth" element={<AuthPage />} />
                {/* Development-only routes */}
                {import.meta.env.DEV && (
                  <Route path="/hex-demo" element={<HexGridDemo />} />
                )}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};
