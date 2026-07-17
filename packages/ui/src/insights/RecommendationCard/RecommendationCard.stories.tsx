import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { RecommendationCard } from './RecommendationCard';
import { Button } from '../../primitives/Button/Button';

const meta: Meta<typeof RecommendationCard> = {
  title: 'Insights/RecommendationCard',
  component: RecommendationCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'AI-рекомендация с раскрываемым объяснением «Почему?». На первом этапе рекомендация моковая и не вычисляется реальной моделью.',
      },
    },
  },
  args: {
    title: 'Сфокусируйтесь на invent.sale',
    description:
      'Сейчас лучше сосредоточиться на invent.sale. Это принесёт наибольший эффект в ближайшие 7 дней.',
    reasons: [
      'Прямое влияние на выручку следующего квартала.',
      'Партнёр ждёт вашего решения по формату пилота.',
      'От решения зависят задачи логистики Didi.',
      'Временное окно закрывается в пятницу.',
    ],
  },
  render: function Render(args) {
    const [expanded, setExpanded] = useState(args.expanded ?? false);
    return (
      <div style={{ width: 330 }}>
        <RecommendationCard
          {...args}
          expanded={expanded}
          onToggleExpand={() => setExpanded((v) => !v)}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof RecommendationCard>;

export const Default: Story = {};

export const Expanded: Story = {
  args: { expanded: true },
};

export const WithActions: Story = {
  args: {
    actions: (
      <Button size="sm" variant="secondary">
        Показать на сцене
      </Button>
    ),
  },
};

export const WithoutReasons: Story = {
  args: { reasons: [] },
};
