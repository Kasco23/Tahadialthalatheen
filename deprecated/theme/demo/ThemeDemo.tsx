/**
 * Demo component showcasing the theme system
 */

import React, { useState } from 'react';
import { HexBackground } from '../background';
import { SimpleThemeControls } from '../components/SimpleThemeControls';
import { ThemeProvider } from '../components/ThemeProvider';

export const ThemeDemo: React.FC = () => {
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="relative min-h-screen overflow-hidden">
        {/* Hexagonal Background */}
        <HexBackground
          palette={{
            colors: ['#22c55e', '#38bdf8', '#6a5acd'],
            weights: [0.5, 0.3, 0.2],
          }}
          textureType="carbon"
          animated={true}
          performance="medium"
        />

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white/90 backdrop-blur-sm border-b border-theme-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <h1 className="text-2xl font-bold text-theme-text">
                  Theme System Demo
                </h1>

                <button
                  onClick={() => setIsControlsOpen(!isControlsOpen)}
                  className="inline-flex items-center px-4 py-2 border border-theme-border rounded-md shadow-sm text-sm font-medium text-theme-text bg-white/80 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-focus-ring"
                >
                  🎨 Theme Settings
                </button>
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col lg:flex-row">
            {/* Content */}
            <div className="flex-1 p-6 lg:p-8">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Welcome Section */}
                <section className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-theme-border">
                  <h2 className="text-3xl font-bold text-theme-text mb-4">
                    Welcome to the Theme System
                  </h2>
                  <p className="text-lg text-theme-text-muted mb-6">
                    This comprehensive theming system provides dynamic color
                    extraction, hexagonal backgrounds, and WCAG-compliant
                    theming for React applications.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-4 bg-theme-bg-secondary rounded-lg">
                      <h3 className="font-semibold text-theme-text mb-2">
                        🎨 Dynamic Themes
                      </h3>
                      <p className="text-sm text-theme-text-muted">
                        Extract colors from team logos and apply them globally
                      </p>
                    </div>

                    <div className="p-4 bg-theme-bg-secondary rounded-lg">
                      <h3 className="font-semibold text-theme-text mb-2">
                        🔷 Hex Backgrounds
                      </h3>
                      <p className="text-sm text-theme-text-muted">
                        Animated hexagonal grids with color distribution
                      </p>
                    </div>

                    <div className="p-4 bg-theme-bg-secondary rounded-lg">
                      <h3 className="font-semibold text-theme-text mb-2">
                        ♿ WCAG Compliant
                      </h3>
                      <p className="text-sm text-theme-text-muted">
                        Automatic contrast calculations for accessibility
                      </p>
                    </div>
                  </div>
                </section>

                {/* Color Demo */}
                <section className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-theme-border">
                  <h2 className="text-2xl font-bold text-theme-text mb-6">
                    Theme Colors
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-lg bg-theme-primary mb-2"></div>
                      <p className="text-sm font-medium text-theme-text">
                        Primary
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-lg bg-theme-secondary mb-2"></div>
                      <p className="text-sm font-medium text-theme-text">
                        Secondary
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-lg bg-theme-accent mb-2"></div>
                      <p className="text-sm font-medium text-theme-text">
                        Accent
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto rounded-lg bg-theme-success mb-2"></div>
                      <p className="text-sm font-medium text-theme-text">
                        Success
                      </p>
                    </div>
                  </div>
                </section>

                {/* Interactive Elements */}
                <section className="bg-white/95 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-theme-border">
                  <h2 className="text-2xl font-bold text-theme-text mb-6">
                    Interactive Elements
                  </h2>

                  <div className="space-y-4">
                    <button className="w-full sm:w-auto inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-theme-primary hover:bg-theme-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-focus-ring">
                      Primary Button
                    </button>

                    <button className="w-full sm:w-auto ml-0 sm:ml-4 inline-flex items-center px-6 py-3 border border-theme-border text-base font-medium rounded-md text-theme-text bg-white hover:bg-theme-bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-theme-focus-ring">
                      Secondary Button
                    </button>

                    <div className="pt-4">
                      <input
                        type="text"
                        placeholder="Themed input field"
                        className="block w-full px-3 py-2 border border-theme-border rounded-md shadow-sm focus:outline-none focus:ring-theme-focus-ring focus:border-theme-focus-ring text-theme-text"
                      />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Theme Controls Panel */}
            {isControlsOpen && (
              <div className="lg:w-96 p-6 bg-white/90 backdrop-blur-sm border-l border-theme-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-theme-text">
                    Theme Settings
                  </h3>
                  <button
                    onClick={() => setIsControlsOpen(false)}
                    className="text-theme-text-muted hover:text-theme-text"
                  >
                    ✕
                  </button>
                </div>

                <SimpleThemeControls />
              </div>
            )}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
};
