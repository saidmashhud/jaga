import type { Meta, StoryObj } from '@storybook/react';
import { ConnectionLabel } from './ConnectionLabel';

const meta: Meta<typeof ConnectionLabel> = {
  title: 'Orbit/ConnectionLabel',
  component: ConnectionLabel,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Короткая подпись связи, закреплённая в точке кривой. Приглушается вместе со связью; на компактных ширинах часть подписей скрывается.',
      },
    },
  },
  args: { x: 150, y: 70, children: 'используют одну команду' },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 320,
        height: 140,
        background: 'var(--color-bg-canvas)',
        borderRadius: 16,
      }}
    >
      <ConnectionLabel {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof ConnectionLabel>;

export const Default: Story = {};

export const Emphasized: Story = {
  args: { emphasized: true, children: 'клиент ждёт решение' },
};

export const Dimmed: Story = {
  args: { dimmed: true },
};

export const LongText: Story = {
  args: { children: 'очень длинная подпись связи, которая обрезается многоточием' },
};
