import type { Meta, StoryObj } from '@storybook/react';
import { spacing } from '@cortex/tokens';
import { Text } from '../primitives/Text/Text';

const meta: Meta = {
  title: 'Foundations/Spacing',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Шкала отступов с базой 4px: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.',
      },
    },
  },
};

export default meta;

export const Scale: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Object.entries(spacing).map(([key, value]) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Text
            variant="caption"
            color="tertiary"
            style={{ width: 110, fontFamily: 'monospace' }}
          >
            --space-{key} · {value}px
          </Text>
          <span
            style={{
              width: value,
              height: 14,
              borderRadius: 3,
              background: 'var(--color-accent-violet)',
              opacity: 0.8,
            }}
          />
        </div>
      ))}
    </div>
  ),
};
