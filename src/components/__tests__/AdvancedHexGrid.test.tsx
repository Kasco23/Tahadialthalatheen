/**
 * Test for AdvancedHexGrid component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AdvancedHexGrid } from '../AdvancedHexGrid';

// Mock requestAnimationFrame and performance.now for testing
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = jest.fn();

Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now())
  }
});

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = jest.fn((contextType) => {
  if (contextType === '2d') {
    return {
      scale: jest.fn(),
      clearRect: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      arc: jest.fn(),
      createRadialGradient: jest.fn(() => ({
        addColorStop: jest.fn()
      })),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      shadowColor: '',
      shadowBlur: 0,
      globalAlpha: 1
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as any;

describe('AdvancedHexGrid', () => {
  const defaultProps = {
    colors: ['#FF0000', '#00FF00', '#0000FF'],
    backgroundColor: '#000000',
    patternSize: 40,
    depth: 0.5,
    glow: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<AdvancedHexGrid {...defaultProps} />);
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('accepts all required props', () => {
    const { rerender } = render(<AdvancedHexGrid {...defaultProps} />);
    
    // Test with different props
    rerender(
      <AdvancedHexGrid
        colors={['#FEBE10', '#00529F']}
        backgroundColor="#0A1E40"
        patternSize={60}
        depth={0.8}
        glow={false}
        className="test-class"
      />
    );
    
    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<AdvancedHexGrid {...defaultProps} className="custom-class" />);
    
    const container = document.querySelector('.custom-class');
    expect(container).toBeInTheDocument();
  });

  it('handles empty colors array gracefully', () => {
    expect(() => {
      render(<AdvancedHexGrid {...defaultProps} colors={[]} />);
    }).not.toThrow();
  });

  it('starts animation loop on mount', () => {
    render(<AdvancedHexGrid {...defaultProps} />);
    
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  it('cleans up animation on unmount', () => {
    const { unmount } = render(<AdvancedHexGrid {...defaultProps} />);
    
    unmount();
    
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('handles window resize events', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    const { unmount } = render(<AdvancedHexGrid {...defaultProps} />);
    
    expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    
    addEventListenerSpy.mockRestore();
    removeEventListenerSpy.mockRestore();
  });
});