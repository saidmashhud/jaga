import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../primitives/Text/Text';

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Цветовые токены Cortex. Цвет несёт семантику состояния, но никогда не является единственным способом её распознавания.',
      },
    },
  },
};

export default meta;

const groups: Record<string, string[]> = {
  Background: [
    '--color-bg-root',
    '--color-bg-canvas',
    '--color-bg-surface',
    '--color-bg-surface-hover',
    '--color-bg-elevated',
  ],
  Border: ['--color-border-subtle', '--color-border-default', '--color-border-strong'],
  Text: [
    '--color-text-primary',
    '--color-text-secondary',
    '--color-text-tertiary',
    '--color-text-disabled',
  ],
  Accent: [
    '--color-accent-violet',
    '--color-accent-blue',
    '--color-accent-cyan',
    '--color-accent-green',
    '--color-accent-yellow',
    '--color-accent-orange',
    '--color-accent-red',
  ],
  State: [
    '--color-state-stable',
    '--color-state-working',
    '--color-state-attention',
    '--color-state-risk',
    '--color-state-paused',
    '--color-state-decision',
    '--color-state-ai',
  ],
};

function Swatch({ token }: { token: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span
        style={{
          width: 44,
          height: 28,
          borderRadius: 6,
          background: `var(${token})`,
          border: '1px solid var(--color-border-default)',
          flexShrink: 0,
        }}
      />
      <Text variant="caption" color="secondary" style={{ fontFamily: 'monospace' }}>
        {token}
      </Text>
    </div>
  );
}

export const Palette: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 720 }}>
      {Object.entries(groups).map(([name, tokens]) => (
        <section key={name} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Text variant="overline" color="tertiary">
            {name}
          </Text>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0,1fr))',
              gap: 10,
            }}
          >
            {tokens.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
