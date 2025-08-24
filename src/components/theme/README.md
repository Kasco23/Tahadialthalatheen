# Theme System Production Components

## Overview

This directory contains production-ready theme components for the main application, replacing the previous demo components.

## Components

### ThemeSelector

A production theme selector component that provides:

- **Compact Mode**: Dropdown-style theme selector suitable for navigation bars
- **Panel Mode**: Full panel layout for settings pages
- **Team Theme Support**: Integration with the team data system
- **Internationalization**: Supports multiple languages via the translation system
- **Loading States**: Visual feedback during theme switching
- **Popular Teams**: Quick access to commonly used teams

#### Usage

```tsx
import { ThemeSelector } from '@/components/theme';

// Compact mode for navigation
<ThemeSelector variant="compact" />

// Panel mode for settings pages
<ThemeSelector
  variant="panel"
  onThemeChange={(teamId, mode) => console.log('Theme changed')}
/>
```

#### Props

- `variant`: 'compact' | 'panel' - Display style
- `className`: Additional CSS classes
- `onThemeChange`: Callback when theme changes

## Migration from Demo Components

The previous demo components have been moved to `/deprecated/theme/demo/` and should no longer be used in production code.

### Changes Made

1. **Production-Ready**: Removed demo-specific code and styling
2. **Better UX**: Improved user interface with loading states and feedback
3. **Internationalization**: Full i18n support
4. **Accessibility**: Better keyboard navigation and screen reader support
5. **Performance**: Optimized rendering and state management

## Integration

The ThemeSelector integrates with:

- **Theme State**: Uses Jotai atoms for state management
- **Team Data**: Accesses team logos and information
- **Translation System**: Supports multiple languages
- **Background System**: Works with ThemedHexBackground component

## Future Enhancements

- Custom team color picker
- Theme preview functionality
- Saved theme presets
- Advanced accessibility features
