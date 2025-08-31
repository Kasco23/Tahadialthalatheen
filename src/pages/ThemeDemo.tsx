/**
 * ReactBits Theme Demo Page
 * Showcases ReactBits components with football team color palettes
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactBitsErrorBoundary from '@/components/ReactBitsErrorBoundary';
import Ribbons from '@/components/reactbits/Ribbons';
import MetaBalls from '@/components/reactbits/MetaBalls';
import Shimmer from '@/components/reactbits/Shimmer';
import MetallicPaint from '@/components/reactbits/MetallicPaint';
import GridMotion from '@/components/reactbits/GridMotion';
import BlobCursor from '@/components/reactbits/BlobCursor';
import ClickSpark from '@/components/reactbits/ClickSpark';
import StarBorder from '@/components/reactbits/StarBorder';

// Team color palettes
const TEAM_PALETTES = {
  'Real Madrid': {
    name: 'Real Madrid',
    colors: ['#FEBE10', '#FFFFFF', '#1E3A8A'], // Gold, White, Royal Blue
    description: 'Los Blancos - Golden elegance and royal blue accents',
  },
  Liverpool: {
    name: 'Liverpool FC',
    colors: ['#C8102E', '#FFFFFF', '#00B2A9'], // Red, White, Teal
    description: 'The Reds - Passionate red with modern teal highlights',
  },
  Chelsea: {
    name: 'Chelsea FC',
    colors: ['#034694', '#FFFFFF', '#ED1C24'], // Blue, White, Red
    description: 'The Blues - Classic blue with vibrant red accents',
  },
  Default: {
    name: 'Football Pitch',
    colors: ['#22c55e', '#FFFFFF', '#15803d'], // Green, White, Dark Green
    description: 'Classic football pitch - Fresh green with clean whites',
  },
};

const DEMO_COMPONENTS = [
  {
    name: 'Ribbons',
    component: Ribbons,
    description: 'Interactive flowing ribbons that follow mouse movement',
    props: { animated: true, speed: 1 },
  },
  {
    name: 'Meta Balls',
    component: MetaBalls,
    description: 'Fluid organic shapes with physics-based animation',
    props: { enableMouseInteraction: true, ballCount: 8, ballSize: 60 },
  },
  {
    name: 'Shimmer',
    component: Shimmer,
    description: 'Elegant shimmer effects with flowing particles',
    props: { speed: 1, intensity: 0.8, direction: 'diagonal' as const },
  },
  {
    name: 'Metallic Paint',
    component: MetallicPaint,
    description: 'WebGL2-powered metallic paint effect with liquid chrome animations',
    props: { params: { speed: 0.3, refraction: 0.015 } },
  },
  {
    name: 'Grid Motion',
    component: GridMotion,
    description: 'Interactive grid that responds to mouse movement with team-themed content',
    props: {},
  },
  {
    name: 'Blob Cursor',
    component: BlobCursor,
    description: 'Interactive blob cursor that follows mouse with smooth trails',
    props: { trailCount: 3, sizes: [40, 80, 60] },
  },
  {
    name: 'Click Spark',
    component: ClickSpark,
    description: 'Dynamic spark effects triggered by clicking with team colors',
    props: { sparkCount: 12, sparkRadius: 25 },
  },
  {
    name: 'Star Border',
    component: StarBorder,
    description: 'Animated star border effects with team color integration',
    props: { speed: '4s', children: 'Interactive Element' },
  },
];

export default function ThemeDemo() {
  const navigate = useNavigate();
  const [selectedPalette, setSelectedPalette] =
    useState<keyof typeof TEAM_PALETTES>('Real Madrid');
  const [selectedComponent, setSelectedComponent] = useState(0);

  const currentPalette = TEAM_PALETTES[selectedPalette];
  const currentComponentData = DEMO_COMPONENTS[selectedComponent];

  // Render the selected component with appropriate props and error boundary
  const renderCurrentComponent = () => {
    const currentComponent = DEMO_COMPONENTS[selectedComponent];
    
    const componentElement = (() => {
      switch (selectedComponent) {
        case 0: // Ribbons
          return <Ribbons 
            colors={currentPalette.colors} 
            animated={true} 
            speed={1} 
          />;
        case 1: // Meta Balls
          return <MetaBalls 
            colors={currentPalette.colors} 
            enableMouseInteraction={true}
            ballCount={8}
            ballSize={60}
          />;
        case 2: // Shimmer
          return <Shimmer 
            colors={currentPalette.colors} 
            speed={1}
            intensity={0.8}
            direction="diagonal"
          />;
        case 3: // Metallic Paint
          return <MetallicPaint 
            teamColor={currentPalette.colors[0]} 
            params={{ speed: 0.3, refraction: 0.015 }}
          />;
        case 4: // Grid Motion
          return <GridMotion teamColors={currentPalette.colors} />;
        case 5: // Blob Cursor
          return <BlobCursor 
            teamColors={currentPalette.colors} 
            trailCount={3}
            sizes={[40, 80, 60]}
          />;
        case 6: // Click Spark
          return <ClickSpark 
            teamColors={currentPalette.colors} 
            sparkCount={12}
            sparkRadius={25}
          />;
        case 7: // Star Border
          return <StarBorder 
            teamColors={currentPalette.colors} 
            speed="4s"
          >
            Interactive Element
          </StarBorder>;
        default:
          return <Ribbons colors={currentPalette.colors} animated={true} speed={1} />;
      }
    })();

    return (
      <ReactBitsErrorBoundary 
        componentName={currentComponent.name} 
        teamColors={currentPalette.colors}
      >
        {componentElement}
      </ReactBitsErrorBoundary>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <motion.header
        className="relative z-10 p-6 bg-black/20 backdrop-blur-sm"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ReactBits Theme Demo
            </h1>
            <p className="text-white/70">
              Football team color palettes with interactive ReactBits components
            </p>
          </div>

          <motion.button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Back to Home
          </motion.button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls Panel */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Team Palette Selector */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">
                Team Palette
              </h3>
              <div className="space-y-3">
                {Object.entries(TEAM_PALETTES).map(([key, palette]) => (
                  <motion.button
                    key={key}
                    onClick={() =>
                      setSelectedPalette(key as keyof typeof TEAM_PALETTES)
                    }
                    className={`w-full p-4 rounded-lg border transition-all duration-300 ${
                      selectedPalette === key
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex space-x-1">
                        {palette.colors.map((color, index) => (
                          <div
                            key={index}
                            className="w-4 h-4 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{palette.name}</div>
                        <div className="text-sm opacity-70">
                          {palette.description}
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Component Selector */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">
                Component
              </h3>
              <div className="space-y-2">
                {DEMO_COMPONENTS.map((component, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedComponent(index)}
                    className={`w-full p-3 rounded-lg border text-left transition-all duration-300 ${
                      selectedComponent === index
                        ? 'bg-white/20 border-white/40 text-white'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="font-medium">{component.name}</div>
                    <div className="text-sm opacity-70">
                      {component.description}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Current Selection Info */}
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">
                Current Selection
              </h3>
              <div className="space-y-2 text-sm text-white/70">
                <div>
                  <span className="text-white">Team:</span>{' '}
                  {currentPalette.name}
                </div>
                <div>
                  <span className="text-white">Component:</span>{' '}
                  {currentComponentData.name}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-white">Colors:</span>
                  {currentPalette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-3 h-3 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Demo Area */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-xl font-semibold text-white">
                  {currentComponentData.name} -{' '}
                  {currentPalette.name}
                </h3>
                <p className="text-white/70 text-sm">
                  {currentComponentData.description}
                </p>
              </div>

              <div className="relative h-96 bg-gradient-to-br from-gray-800 to-gray-900">
                {renderCurrentComponent()}

                {/* Interactive hint */}
                <div className="absolute bottom-4 left-4 text-white/50 text-xs">
                  💡 Move your mouse to interact with the component
                </div>
              </div>
            </div>

            {/* Component Details */}
            <motion.div
              className="mt-6 bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10"
              layout
            >
              <h4 className="text-lg font-semibold text-white mb-3">
                About This Component
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/70 mb-2">Features:</div>
                  <ul className="space-y-1 text-white/60">
                    <li>• Interactive mouse tracking</li>
                    <li>• Smooth animations</li>
                    <li>• Customizable colors</li>
                    <li>• Responsive design</li>
                    {selectedComponent === 3 && <li>• WebGL2 shader effects</li>}
                    {selectedComponent === 4 && <li>• GSAP animations</li>}
                    {selectedComponent === 5 && <li>• Trail physics</li>}
                    {selectedComponent === 6 && <li>• Click interactions</li>}
                    {selectedComponent === 7 && <li>• CSS keyframe animations</li>}
                  </ul>
                </div>
                <div>
                  <div className="text-white/70 mb-2">Technologies:</div>
                  <ul className="space-y-1 text-white/60">
                    {selectedComponent <= 2 ? (
                      <>
                        <li>• Framer Motion</li>
                        <li>• React Hooks</li>
                        <li>• Tailwind CSS</li>
                        <li>• TypeScript</li>
                      </>
                    ) : selectedComponent === 3 ? (
                      <>
                        <li>• WebGL2 Shaders</li>
                        <li>• Fragment Shaders</li>
                        <li>• Canvas API</li>
                        <li>• TypeScript</li>
                      </>
                    ) : selectedComponent === 4 ? (
                      <>
                        <li>• GSAP Animation</li>
                        <li>• React Hooks</li>
                        <li>• CSS Grid</li>
                        <li>• TypeScript</li>
                      </>
                    ) : (
                      <>
                        <li>• GSAP Animation</li>
                        <li>• Canvas 2D</li>
                        <li>• React Hooks</li>
                        <li>• TypeScript</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
