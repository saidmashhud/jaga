import type { Meta, StoryObj } from '@storybook/react';
import { statusLabels, type SemanticStatus } from '@cortex/tokens';
import { StatusDot } from './StatusDot';
import { Text } from '../Text/Text';

const meta: Meta<typeof StatusDot> = {
  title: 'Primitives/StatusDot',
  component: StatusDot,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Точка семантического состояния. Пульсация — только для 1–2 объектов на экране одновременно; при prefers-reduced-motion отключается.',
      },
    },
  },
  args: { status: 'risk', size: 'md' },
};

export default meta;
type Story = StoryObj<typeof StatusDot>;

const statuses: Array<SemanticStatus | 'ai'> = [
  'stable',
  'working',
  'attention',
  'risk',
  'paused',
  'decision',
  'ai',
];

export const Default: Story = {};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {statuses.map((status) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <StatusDot status={status} />
          <Text variant="caption" color="secondary">
            {status === 'ai' ? 'AI' : statusLabels[status]}
          </Text>
        </div>
      ))}
    </div>
  ),
};

export const Pulse: Story = {
  args: { pulse: true, status: 'risk', size: 'lg' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <StatusDot status="working" size="sm" />
      <StatusDot status="working" size="md" />
      <StatusDot status="working" size="lg" />
    </div>
  ),
};
