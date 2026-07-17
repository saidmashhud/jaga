import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Аватар пользователя: изображение → инициалы → плейсхолдер. Индикатор online — дополнительный слой.',
      },
    },
  },
  args: { name: 'Саид Машхуд', size: 'md' },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Initials: Story = {};

export const Image: Story = {
  args: {
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="%237657FF"/><circle cx="32" cy="24" r="10" fill="%23F4F7FF"/><ellipse cx="32" cy="50" rx="17" ry="11" fill="%23F4F7FF"/></svg>',
  },
};

export const Placeholder: Story = {
  args: { name: undefined },
};

export const Online: Story = {
  args: { online: true },
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
    </div>
  ),
};
