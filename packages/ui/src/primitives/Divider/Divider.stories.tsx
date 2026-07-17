import type { Meta, StoryObj } from '@storybook/react';
import { Divider } from './Divider';
import { Text } from '../Text/Text';

const meta: Meta<typeof Divider> = {
  title: 'Primitives/Divider',
  component: Divider,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: { component: 'Разделитель контента, горизонтальный и вертикальный.' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Horizontal: Story = {
  render: () => (
    <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Text color="secondary">Секция выше</Text>
      <Divider />
      <Text color="secondary">Секция ниже</Text>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 28 }}>
      <Text color="secondary">Слева</Text>
      <Divider orientation="vertical" />
      <Text color="secondary">Справа</Text>
    </div>
  ),
};
