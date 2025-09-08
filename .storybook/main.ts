import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    '@storybook/addon-docs',         // autodocs is now opt-in (see below)
    '@storybook/addon-a11y',
    '@storybook/addon-onboarding',
    '@storybook/addon-vitest',       // replaces “interactions” in SB 9 :contentReference[oaicite:2]{index=2}
    '@storybook/addon-themes',       // new dark/light switcher
    '@chromatic-com/storybook',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    autodocs: 'tag',                 // auto-generate docs when a story/tag says so
  },
};

export default config;
