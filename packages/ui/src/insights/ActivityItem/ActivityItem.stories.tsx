import type { Meta, StoryObj } from '@storybook/react';
import { CoffeeIcon, NetworkIcon } from '@cortex/icons';
import { ActivityItem } from './ActivityItem';

const meta: Meta<typeof ActivityItem> = {
  title: 'Insights/ActivityItem',
  component: ActivityItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Событие ленты «Что происходит». Клик выбирает проект; время показывается относительно текущего момента; длинный текст — максимум две строки.',
      },
    },
  },
  args: {
    projectName: 'Nexus',
    title: 'Релиз отложен на 3 дня',
    timeLabel: '2 ч назад',
    icon: <NetworkIcon />,
    projectColor: 'var(--color-state-stable)',
  },
  render: (args) => (
    <div style={{ width: 330 }}>
      <ActivityItem {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof ActivityItem>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const Fresh: Story = {
  args: {
    projectName: 'Кофейня',
    title: 'В кофейне нужно проверить нового поставщика стаканов',
    timeLabel: 'только что',
    icon: <CoffeeIcon />,
    projectColor: 'var(--color-state-attention)',
    fresh: true,
  },
};

export const WithoutIcon: Story = {
  args: { icon: undefined },
};

export const LongText: Story = {
  args: {
    title:
      'Очень длинное описание события, которое не помещается в две строки и обрезается: партнёр предложил два формата пилота и ждёт вашего решения до пятницы.',
  },
};
