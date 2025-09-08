import type { Preview } from '@storybook/react-vite';  // 👈  use the framework package
import themes from '@storybook/addon-themes';           // still fine


const preview: Preview = {
  parameters: {
    themes: {
      default: 'light',
      list: [
        { name: 'light', class: 'light', color: '#ffffff' },
        { name: 'dark',  class: 'dark',  color: '#000000' },
      ],
    },
    docs: { page: null }, // let autodocs render by default
  },
};

export default preview;
