import type { Meta, StoryObj } from '@storybook/react';
import { FocusTaskCard } from './FocusTaskCard';

const meta: Meta<typeof FocusTaskCard> = {
  title: 'Insights/FocusTaskCard',
  component: FocusTaskCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Задача, требующая внимания сегодня. Клик по телу карточки выбирает проект на сцене; checkbox завершает действие. Акцентная линия слева — цвет проекта.',
      },
    },
  },
  args: {
    projectName: 'invent.sale',
    title: 'Утвердить формат пилота',
    description: 'Партнёр ждёт ответ до пятницы. Решение открывает следующий этап.',
    impact: 'high',
    projectColor: 'var(--color-state-decision)',
  },
  render: (args) => (
    <div style={{ width: 330 }}>
      <FocusTaskCard {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof FocusTaskCard>;

export const HighImpact: Story = {};

export const MediumImpact: Story = {
  args: {
    projectName: 'Кофейня',
    title: 'Расходы выросли на 14%',
    impact: 'medium',
    projectColor: 'var(--color-state-attention)',
    progress: 30,
  },
};

export const LowImpact: Story = {
  args: {
    projectName: 'Nexus',
    title: 'Просмотреть отчёт спринта',
    description: undefined,
    impact: 'low',
    projectColor: 'var(--color-state-stable)',
  },
};

export const Completed: Story = {
  args: { completed: true },
};

export const Selected: Story = {
  args: { selected: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const WithProgress: Story = {
  args: { progress: 64 },
};

export const LongText: Story = {
  args: {
    title: 'Очень длинное основное действие, которое занимает несколько строк текста подряд',
    description:
      'Очень длинное пояснение, которое обрезается после двух строк, потому что правая панель ограничена по ширине и вертикали.',
  },
};
