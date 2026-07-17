import type { Preview } from '@storybook/react';
import '@fontsource-variable/inter';
import '@cortex/tokens/tokens.css';
import './preview.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Cortex color theme (light is experimental — product ships dark-first)',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark (default)' },
          { value: 'light', title: 'Light (experimental)' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  decorators: [
    (Story, context) => {
      document.documentElement.dataset.theme = context.globals.theme ?? 'dark';
      return <Story />;
    },
  ],
  parameters: {
    layout: 'centered',
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    viewport: {
      viewports: {
        compactDesktop: {
          name: 'Compact desktop (1280)',
          styles: { width: '1280px', height: '900px' },
          type: 'desktop',
        },
        laptop: {
          name: 'Laptop (1366)',
          styles: { width: '1366px', height: '860px' },
          type: 'desktop',
        },
        baseline: {
          name: 'Baseline (1536)',
          styles: { width: '1536px', height: '1024px' },
          type: 'desktop',
        },
        wide: {
          name: 'Wide (1920)',
          styles: { width: '1920px', height: '1080px' },
          type: 'desktop',
        },
      },
    },
    a11y: {
      config: {
        rules: [
          // Semi-transparent glass surfaces confuse the automated contrast checker;
          // contrast is verified manually against the composited background.
          { id: 'color-contrast', reviewOnFail: true },
        ],
      },
    },
  },
};

export default preview;
