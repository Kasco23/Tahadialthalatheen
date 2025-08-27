/**
 * Demo page for HexGridBackground component
 * Shows different team color palettes and configuration options
 */

import React, { useState } from 'react';
import { HexGridBackground } from '@/components/HexGridBackground';
import { AdvancedHexGrid } from '@/components/AdvancedHexGrid';

const TEAM_PALETTES = {
  'Real Madrid': ['#FEBE10', '#00529F'],
  'Barcelona': ['#A50044', '#004D98', '#EDBB00'],
  'Inter Milan': ['#0033A0', '#FFD700', '#111111'],
  'Manchester United': ['#FF0000', '#FFFF00', '#000000'],
  'Chelsea': ['#034694', '#FFFFFF'],
  'Liverpool': ['#C8102E', '#FFFFFF', '#00B2A9'],
  'Arsenal': ['#EF0107', '#023474', '#9C824A'],
};

export default function HexGridDemo() {
  const [selectedTeam, setSelectedTeam] = useState<string>('Real Madrid');
  const [backgroundColor, setBackgroundColor] = useState('#0A1E40');
  const [strokeWidth, setStrokeWidth] = useState(1.5);
  const [patternSize, setPatternSize] = useState(40);
  const [glow, setGlow] = useState(false);
  const [texture, setTexture] = useState(true);
  const [useAdvanced, setUseAdvanced] = useState(false);
  const [depth, setDepth] = useState(0.5);

  const currentColors = TEAM_PALETTES[selectedTeam as keyof typeof TEAM_PALETTES] || ['#22c55e'];

  return (
    <div className="min-h-screen relative">
      {/* HexGrid Background */}
      {useAdvanced ? (
        <AdvancedHexGrid
          colors={currentColors}
          backgroundColor={backgroundColor}
          patternSize={patternSize}
          depth={depth}
          glow={glow}
        />
      ) : (
        <HexGridBackground
          colors={currentColors}
          backgroundColor={backgroundColor}
          strokeWidth={strokeWidth}
          patternSize={patternSize}
          glow={glow}
          texture={texture}
        />
      )}
      
      {/* Controls Panel */}
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8 text-center">
            HexGrid Background Demo
          </h1>
          
          <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 space-y-6">
            {/* Team Selection */}
            <div>
              <label className="block text-white font-medium mb-2">
                Team Palette:
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              >
                {Object.keys(TEAM_PALETTES).map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              <div className="flex gap-2 mt-2">
                {currentColors.map((color, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded border border-white/20"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-white font-medium mb-2">
                Background Color:
              </label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="w-16 h-8 rounded"
              />
              <span className="ml-2 text-gray-300">{backgroundColor}</span>
            </div>

            {/* Rendering Mode Toggle */}
            <div>
              <label className="flex items-center text-white font-medium">
                <input
                  type="checkbox"
                  checked={useAdvanced}
                  onChange={(e) => setUseAdvanced(e.target.checked)}
                  className="mr-2"
                />
                Advanced Canvas/WebGL Rendering
              </label>
              <div className="text-gray-400 text-xs mt-1">
                {useAdvanced ? 
                  'Using advanced Canvas rendering with 3D effects and dynamic animations' : 
                  'Using simple SVG rendering with basic animations'
                }
              </div>
            </div>

            {/* Stroke Width - only for SVG mode */}
            {!useAdvanced && (
              <div>
                <label className="block text-white font-medium mb-2">
                  Stroke Width: {strokeWidth}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={strokeWidth}
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            )}

            {/* Depth - only for advanced mode */}
            {useAdvanced && (
              <div>
                <label className="block text-white font-medium mb-2">
                  3D Depth Effect: {depth.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={depth}
                  onChange={(e) => setDepth(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-gray-400 text-xs mt-1">
                  Controls the intensity of 3D lighting and shadow effects
                </div>
              </div>
            )}

            {/* Pattern Size */}
            <div>
              <label className="block text-white font-medium mb-2">
                Pattern Size: {patternSize}
              </label>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={patternSize}
                onChange={(e) => setPatternSize(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Glow Effect */}
            <div>
              <label className="flex items-center text-white font-medium">
                <input
                  type="checkbox"
                  checked={glow}
                  onChange={(e) => setGlow(e.target.checked)}
                  className="mr-2"
                />
                {useAdvanced ? 'Advanced Glow Animation' : 'Glow Animation'}
              </label>
              <div className="text-gray-400 text-xs mt-1">
                {useAdvanced ? 
                  'Animated pulsing glow with dynamic particle effects' : 
                  'Simple CSS-based glow animation'
                }
              </div>
            </div>

            {/* Texture Effect - only for SVG mode */}
            {!useAdvanced && (
              <div>
                <label className="flex items-center text-white font-medium">
                  <input
                    type="checkbox"
                    checked={texture}
                    onChange={(e) => setTexture(e.target.checked)}
                    className="mr-2"
                  />
                  Carbon Fiber Texture
                </label>
              </div>
            )}

            {/* Color Count Info */}
            <div className="text-gray-300 text-sm">
              <div>Current palette has {currentColors.length} color{currentColors.length !== 1 ? 's' : ''}.</div>
              <div>Rendering mode: {useAdvanced ? 'Advanced Canvas/WebGL' : 'Simple SVG'}</div>
              {useAdvanced ? (
                <div>
                  {glow ? 'Advanced glow with particles enabled.' : 'Static rendering mode.'}
                  {depth > 0 ? ` 3D depth: ${(depth * 100).toFixed(0)}%` : ' Flat 2D mode.'}
                </div>
              ) : (
                <div>
                  {currentColors.length === 1 ? ' Using as stroke only.' : ' Using gradient for stroke.'}
                  {texture ? ' Carbon fiber texture enabled.' : ' Flat background mode.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}