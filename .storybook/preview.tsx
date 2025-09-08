import type { Preview } from '@storybook/react-vite';
import React from 'react';
import '../src/index.css'; // Import Tailwind CSS and global styles

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
      ],
    },
    docs: {
      autodocs: 'tag',
    },
  },
  
  decorators: [
    (Story) => (
      <div className="font-sans antialiased">
        <Story />
      </div>
    ),
  ],

  tags: ['autodocs'],
};

export default preview;
