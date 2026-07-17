import type { Meta, StoryObj } from '@storybook/react';
import { OrbitIcon } from '@cortex/icons';
import { NavigationRailItem } from './NavigationRailItem';

const meta: Meta<typeof NavigationRailItem> = {
  title: 'Navigation/NavigationRailItem',
  component: NavigationRailItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Пункт NavigationRail: иконка + подпись, active-состояние, badge-счётчик, tooltip.',
      },
    },
  },
  args: {
    icon: <OrbitIcon size={20} />,
    label: 'Orbit',
  },
  render: (args) => (
    <div style={{ width: 72 }}>
      <NavigationRailItem {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof NavigationRailItem>;

export const Default: Story = {};

export const Active: Story = {
  args: { active: true },
};

export const WithBadge: Story = {
  args: { badge: '3' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const LongLabel: Story = {
  args: { label: 'Очень длинный режим' },
};
