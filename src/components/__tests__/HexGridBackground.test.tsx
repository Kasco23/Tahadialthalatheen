/**
 * Tests for HexGridBackground component
 */

import { render } from '@testing-library/react';
import { HexGridBackground } from '../HexGridBackground';

describe('HexGridBackground', () => {
  it('renders with single color (stroke only)', () => {
    const { container } = render(
      <HexGridBackground colors={['#ff0000']} />
    );
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Should have a pattern element
    const pattern = container.querySelector('pattern');
    expect(pattern).toBeInTheDocument();
  });

  it('renders with multiple colors (gradient)', () => {
    const { container } = render(
      <HexGridBackground colors={['#ff0000', '#00ff00', '#0000ff']} />
    );
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    // Should have a gradient element when multiple colors
    const gradient = container.querySelector('linearGradient');
    expect(gradient).toBeInTheDocument();
    
    // Should have correct number of gradient stops
    const stops = container.querySelectorAll('stop');
    expect(stops).toHaveLength(3);
  });

  it('applies custom properties correctly', () => {
    const { container } = render(
      <HexGridBackground 
        colors={['#ff0000']} 
        backgroundColor="#123456"
        strokeWidth={2.5}
        patternSize={60}
        glow={true}
        className="test-class"
      />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ backgroundColor: '#123456' });
    expect(wrapper).toHaveClass('test-class');
    
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('animate-[glow_2s_ease-in-out_infinite_alternate]');
    
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('stroke-width', '2.5');
  });

  it('handles empty colors array gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { container } = render(
      <HexGridBackground colors={[]} />
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'HexGridBackground: colors array is empty, using default'
    );
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('limits colors to maximum of 7', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const manyColors = Array.from({ length: 10 }, (_, i) => `#${i}${i}${i}${i}${i}${i}`);
    
    const { container } = render(
      <HexGridBackground colors={manyColors} />
    );
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'HexGridBackground: too many colors, limiting to 7'
    );
    
    const stops = container.querySelectorAll('stop');
    expect(stops.length).toBeLessThanOrEqual(7);
    
    consoleSpy.mockRestore();
  });

  it('uses default values when props not provided', () => {
    const { container } = render(
      <HexGridBackground colors={['#ff0000']} />
    );
    
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ backgroundColor: '#0A1E40' });
    
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveClass('animate-[glow_2s_ease-in-out_infinite_alternate]');
    
    const path = container.querySelector('path');
    expect(path).toHaveAttribute('stroke-width', '1.5');
  });
});