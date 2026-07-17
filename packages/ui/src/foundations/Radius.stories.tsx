import type { Meta, StoryObj } from '@storybook/react';
import { radius } from '@cortex/tokens';
import { Text } from '../primitives/Text/Text';

const meta: Meta = {
  title: 'Foundations/Radius',
  parameters: {
    layout: 'padded',
    docs: {
      description: { component: 'Токены радиусов скругления.' },
    },
  },
};

export default meta;

export const Scale: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {Object.entries(radius).map(([key, value]) => (
        <div
          key={key}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              width: 72,
              height: 72,
              borderRadius: value,
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-strong)',
            }}
          />
          <Text variant="caption" color="secondary" style={{ fontFamily: 'monospace' }}>
            {key} · {value === 999 ? 'round' : `${value}px`}
          </Text>
        </div>
      ))}
    </div>
  ),
};
