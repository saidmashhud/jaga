import type { Meta, StoryObj } from '@storybook/react';
import { iconRegistry } from '@cortex/icons';
import { Text } from '../primitives/Text/Text';

const meta: Meta = {
  title: 'Foundations/Icons',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Единый набор SVG-иконок @cortex/icons: currentColor, размер через props, без жёстко заданных цветов.',
      },
    },
  },
};

export default meta;

export const Gallery: StoryObj = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
        gap: 16,
        maxWidth: 760,
      }}
    >
      {Object.entries(iconRegistry).map(([name, Icon]) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 14,
            borderRadius: 12,
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-surface)',
          }}
        >
          <Icon size={22} style={{ color: 'var(--color-text-secondary)' }} />
          <Text variant="caption" color="tertiary">
            {name}
          </Text>
        </div>
      ))}
    </div>
  ),
};

export const Sizes: StoryObj = {
  render: () => {
    const Icon = iconRegistry.orbit;
    return (
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20 }}>
        {[14, 18, 24, 32, 48].map((size) => (
          <div
            key={size}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Icon size={size} style={{ color: 'var(--color-accent-cyan)' }} />
            <Text variant="caption" color="tertiary">
              {size}
            </Text>
          </div>
        ))}
      </div>
    );
  },
};
