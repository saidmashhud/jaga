import type { Meta, StoryObj } from '@storybook/react';
import { typography, type TextVariant } from '@cortex/tokens';
import { Text } from '../primitives/Text/Text';

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Типографическая шкала Cortex на базе Inter. Значения: размер/интерлиньяж, насыщенность.',
      },
    },
  },
};

export default meta;

const sample = 'Какие проекты требуют внимания сейчас';

export const Scale: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 760 }}>
      {(Object.keys(typography) as TextVariant[]).map((variant) => (
        <div key={variant} style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <Text
            variant="caption"
            color="tertiary"
            style={{ width: 120, flexShrink: 0, fontFamily: 'monospace' }}
          >
            {variant} · {typography[variant].size}/{typography[variant].line}
          </Text>
          <Text variant={variant}>{sample}</Text>
        </div>
      ))}
    </div>
  ),
};
