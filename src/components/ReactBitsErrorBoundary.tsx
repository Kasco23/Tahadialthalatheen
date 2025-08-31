/**
 * Error Boundary specifically for ReactBits components
 * Provides graceful fallbacks when advanced components fail
 */
import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  componentName?: string;
  teamColors?: string[];
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ReactBitsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn(`ReactBits component "${this.props.componentName}" failed:`, error);
    console.warn('Error Info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { componentName = 'Component', teamColors = ['#FEBE10'] } = this.props;
      const primaryColor = teamColors[0];

      return (
        <div className="relative w-full h-full overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(45deg, ${primaryColor}20, transparent, ${primaryColor}10)`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-white/80">
            <div className="text-center p-6">
              <div className="text-lg font-semibold mb-2">
                {componentName} Unavailable
              </div>
              <div className="text-sm opacity-70 mb-4">
                Using simplified display for compatibility
              </div>
              <div 
                className="w-12 h-12 mx-auto rounded-full border-2 animate-pulse"
                style={{ borderColor: primaryColor }}
              />
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ReactBitsErrorBoundary;