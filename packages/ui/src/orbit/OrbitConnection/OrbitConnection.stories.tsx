import type { Meta, StoryObj } from '@storybook/react';
import { OrbitConnection, connectionMidpoint } from './OrbitConnection';
import { ConnectionLabel } from '../ConnectionLabel/ConnectionLabel';

const meta: Meta<typeof OrbitConnection> = {
  title: 'Orbit/OrbitConnection',
  component: OrbitConnection,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'SVG-связь между узлами сцены (квадратичная кривая). Не перехватывает pointer events; подпись — отдельный компонент ConnectionLabel в точке connectionMidpoint.',
      },
    },
  },
  args: {
    source: { x: 60, y: 160 },
    target: { x: 360, y: 60 },
    color: 'rgba(55, 217, 255, 0.6)',
    strength: 2,
  },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 420,
        height: 220,
        background: 'var(--color-bg-canvas)',
        borderRadius: 16,
      }}
    >
      <svg width="420" height="220" style={{ position: 'absolute', inset: 0 }}>
        <OrbitConnection {...args} />
      </svg>
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof OrbitConnection>;

export const Default: Story = {};

export const Strengths: Story = {
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 420,
        height: 260,
        background: 'var(--color-bg-canvas)',
        borderRadius: 16,
      }}
    >
      <svg width="420" height="260" style={{ position: 'absolute', inset: 0 }}>
        {( [1, 2, 3] as const ).map((strength, index) => (
          <OrbitConnection
            key={strength}
            {...args}
            strength={strength}
            source={{ x: 50, y: 60 + index * 70 }}
            target={{ x: 370, y: 60 + index * 70 }}
          />
        ))}
      </svg>
    </div>
  ),
};

export const Animated: Story = {
  args: { animated: true },
};

export const Dashed: Story = {
  args: { dashed: true },
};

export const Selected: Story = {
  args: { selected: true },
};

export const Dimmed: Story = {
  args: { dimmed: true },
};

export const WithLabel: Story = {
  render: (args) => {
    const mid = connectionMidpoint(args.source, args.target);
    return (
      <div
        style={{
          position: 'relative',
          width: 420,
          height: 220,
          background: 'var(--color-bg-canvas)',
          borderRadius: 16,
        }}
      >
        <svg width="420" height="220" style={{ position: 'absolute', inset: 0 }}>
          <OrbitConnection {...args} />
        </svg>
        <ConnectionLabel x={mid.x} y={mid.y}>
          клиент ждёт решение
        </ConnectionLabel>
      </div>
    );
  },
};
