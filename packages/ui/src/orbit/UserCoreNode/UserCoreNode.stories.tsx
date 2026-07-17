import type { Meta, StoryObj } from '@storybook/react';
import { UserCoreNode } from './UserCoreNode';

const meta: Meta<typeof UserCoreNode> = {
  title: 'Orbit/UserCoreNode',
  component: UserCoreNode,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Центральный узел «Вы / Сейчас» с многослойным свечением. pulse включается при активной AI-рекомендации.',
      },
    },
  },
  args: { x: 200, y: 170 },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 400,
        height: 340,
        background: 'var(--color-bg-canvas)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      <UserCoreNode {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof UserCoreNode>;

export const Default: Story = {};

export const Pulsing: Story = {
  args: { pulse: true },
};

export const CustomText: Story = {
  args: { title: 'Портфель', subtitle: 'Q3 2026' },
};
