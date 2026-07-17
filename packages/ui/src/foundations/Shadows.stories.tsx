import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../primitives/Text/Text';

const meta: Meta = {
  title: 'Foundations/Shadows',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Elevation-тени отделены от semantic glow: тень задаёт глубину, glow — смысловое свечение состояния.',
      },
    },
  },
};

export default meta;

const shadows = ['--shadow-surface', '--shadow-raised', '--shadow-overlay'];
const glows = [
  '--glow-violet',
  '--glow-blue',
  '--glow-cyan',
  '--glow-green',
  '--glow-warning',
  '--glow-risk',
  '--glow-ai',
];

function Tile({ token }: { token: string }) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
    >
      <span
        style={{
          width: 108,
          height: 72,
          borderRadius: 12,
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border-default)',
          boxShadow: `var(${token})`,
        }}
      />
      <Text variant="caption" color="secondary" style={{ fontFamily: 'monospace' }}>
        {token}
      </Text>
    </div>
  );
}

export const ElevationAndGlow: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <section>
        <Text variant="overline" color="tertiary">
          Elevation
        </Text>
        <div style={{ display: 'flex', gap: 28, marginTop: 14 }}>
          {shadows.map((token) => (
            <Tile key={token} token={token} />
          ))}
        </div>
      </section>
      <section>
        <Text variant="overline" color="tertiary">
          Semantic glow
        </Text>
        <div style={{ display: 'flex', gap: 28, marginTop: 14, flexWrap: 'wrap' }}>
          {glows.map((token) => (
            <Tile key={token} token={token} />
          ))}
        </div>
      </section>
    </div>
  ),
};
