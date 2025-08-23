# Theme System

A comprehensive theming system for React + Vite + Tailwind applications featuring dynamic color extraction, hexagonal backgrounds, and WCAG-compliant theming.

## Features

- 🎨 **Dynamic Theme Modes**: Default and Team-based themes
- 🔷 **Hexagonal Backgrounds**: Animated hex grids with color distribution
- 🖼️ **Color Extraction**: Extract colors from team logos (SVG/Image)
- ♿ **WCAG Compliance**: Automatic contrast calculations for accessibility
- 🎭 **Texture Layers**: Carbon fiber, metallic, paper, and halftone patterns
- 💾 **Persistence**: Local storage for theme preferences
- ⚡ **Performance**: Optimized Canvas rendering with adaptive density
- 🔄 **State Management**: Jotai-based reactive state

## Installation

The theme system is already integrated into this project. To use it in other projects:

1. Copy the entire `src/theme` directory
2. Install dependencies:
   ```bash
   npm install jotai tailwindcss
   ```
3. Update your `tailwind.config.js` with the theme tokens (see configuration below)

## Quick Start

```tsx
import React from 'react';
import {
  ThemeProvider,
  ThemeControls,
  HexBackground,
  ThemeDemo,
} from './theme';

function App() {
  return (
    <ThemeProvider>
      <div className="relative min-h-screen">
        {/* Hexagonal background */}
        <HexBackground
          palette={{ colors: ['#22c55e', '#38bdf8'], weights: [0.6, 0.4] }}
          textureType="carbon"
          animated={true}
        />

        {/* Your app content */}
        <main className="relative z-10">
          <h1 className="text-theme-text">Hello World!</h1>

          {/* Theme controls */}
          <ThemeControls teams={yourTeamsData} />
        </main>
      </div>
    </ThemeProvider>
  );
}
```

## Core Components

### ThemeProvider

Wraps your app to enable theme functionality:

```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

### HexBackground

Renders animated hexagonal background:

```tsx
<HexBackground
  palette={{ colors: ['#ff0000', '#00ff00'], weights: [0.7, 0.3] }}
  textureType="metallic"
  animated={true}
  performance="medium"
/>
```

### ThemeControls

Interactive theme control panel:

```tsx
<ThemeControls
  teams={[
    {
      name: 'arsenal',
      displayName: 'Arsenal FC',
      logoPath: '/logos/arsenal.svg',
      searchTerms: ['arsenal', 'gunners'],
    },
  ]}
  showTexture={true}
  compact={false}
/>
```

## Tailwind Configuration

Add this to your `tailwind.config.js`:

```js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Theme color tokens
        'theme-primary': 'var(--theme-primary)',
        'theme-secondary': 'var(--theme-secondary)',
        'theme-accent': 'var(--theme-accent)',
        'theme-bg-primary': 'var(--theme-bg-primary)',
        'theme-bg-secondary': 'var(--theme-bg-secondary)',
        'theme-surface': 'var(--theme-surface)',
        'theme-text': 'var(--theme-text)',
        'theme-text-muted': 'var(--theme-text-muted)',
        'theme-text-inverse': 'var(--theme-text-inverse)',
        'theme-border': 'var(--theme-border)',
        'theme-focus-ring': 'var(--theme-focus-ring)',
        'theme-success': 'var(--theme-success)',
        'theme-warning': 'var(--theme-warning)',
        'theme-error': 'var(--theme-error)',

        // Color scales
        'theme-primary-50': 'var(--theme-primary-50)',
        'theme-primary-100': 'var(--theme-primary-100)',
        'theme-primary-200': 'var(--theme-primary-200)',
        'theme-primary-300': 'var(--theme-primary-300)',
        'theme-primary-400': 'var(--theme-primary-400)',
        'theme-primary-500': 'var(--theme-primary-500)',
        'theme-primary-600': 'var(--theme-primary-600)',
        'theme-primary-700': 'var(--theme-primary-700)',
        'theme-primary-800': 'var(--theme-primary-800)',
        'theme-primary-900': 'var(--theme-primary-900)',
        // ... similar for secondary and accent
      },
    },
  },
  plugins: [],
};
```

## Team Data Format

Teams should follow this structure:

```tsx
interface Team {
  name: string; // Unique identifier
  displayName: string; // Human-readable name
  logoPath: string; // Path to SVG/image logo
  searchTerms: string[]; // Keywords for search
}

const teams: Team[] = [
  {
    name: 'barcelona',
    displayName: 'FC Barcelona',
    logoPath: '/assets/logos/barcelona.svg',
    searchTerms: ['barcelona', 'barca', 'fcb'],
  },
  // ... more teams
];
```

## API Reference

### Color Extraction

```tsx
import { extractTeamPalette } from './theme';

// Extract colors from logo
const palette = await extractTeamPalette('/path/to/logo.svg');
// Returns: { colors: ['#ff0000', '#00ff00'], weights: [0.6, 0.4] }
```

### Contrast Utilities

```tsx
import { getContrastRatio, checkContrast } from './theme';

// Check contrast ratio
const ratio = getContrastRatio('#ffffff', '#000000'); // 21

// WCAG compliance check
const result = checkContrast('#ffffff', '#000000');
// Returns: { ratio: 21, passes: true, level: 'AAA' }
```

### State Management

```tsx
import { useAtom } from 'jotai';
import { themeModeAtom, selectedTeamAtom } from './theme';

function MyComponent() {
  const [themeMode, setThemeMode] = useAtom(themeModeAtom);
  const [selectedTeam, setSelectedTeam] = useAtom(selectedTeamAtom);

  return (
    <div>
      <p>Current mode: {themeMode}</p>
      <p>Selected team: {selectedTeam?.displayName}</p>
    </div>
  );
}
```

## Architecture

```
src/theme/
├── types.ts                 # Core type definitions
├── index.ts                 # Main exports
├── core/                    # Core utilities
│   ├── tokens.ts           # CSS token management
│   ├── contrast.ts         # WCAG contrast calculations
│   └── storage.ts          # localStorage persistence
├── state/                   # State management
│   └── themeAtoms.ts       # Jotai atoms
├── palette/                 # Color extraction
│   ├── index.ts            # Main palette API
│   ├── extractor.ts        # SVG color extraction
│   └── quantizer.ts        # Canvas color quantization
├── background/              # Hexagonal background system
│   ├── index.ts            # Background exports
│   ├── HexBackground.tsx   # Main background component
│   ├── hexGrid.ts          # Hex coordinate system
│   ├── colorDistribution.ts # Color distribution logic
│   └── texture.ts          # Texture generation
├── components/              # UI components
│   ├── index.ts            # Component exports
│   ├── ThemeProvider.tsx   # Theme initialization
│   └── ThemeControls.tsx   # Theme control panel
└── demo/                    # Demo component
    └── ThemeDemo.tsx       # Complete demo
```

## Performance Considerations

- **Canvas Optimization**: Adaptive hex density based on viewport and performance mode
- **Color Caching**: Extracted palettes are cached in memory and localStorage
- **Lazy Loading**: Team logos are loaded on-demand with lazy loading
- **Animation Control**: Background animation can be disabled for better performance
- **Viewport Culling**: Only visible hexagons are rendered

## Browser Support

- Modern browsers with Canvas 2D support
- SVG support for logo parsing
- CSS custom properties (variables)
- localStorage for persistence

## Contributing

1. Follow the existing TypeScript patterns
2. Add JSDoc comments for public APIs
3. Update this README for new features
4. Test with both Default and Team modes
5. Verify WCAG contrast compliance

## License

Part of the Tahadialthalatheen project.
