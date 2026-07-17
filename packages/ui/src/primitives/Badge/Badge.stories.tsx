import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Компактная метка состояния или категории. Статус передаётся и цветом, и текстом — цвет не единственный носитель смысла.',
      },
    },
  },
  args: { children: 'Стабильно', variant: 'positive' },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <Badge variant="neutral">На паузе</Badge>
      <Badge variant="positive">Стабильно</Badge>
      <Badge variant="info">В работе</Badge>
      <Badge variant="warning">Требует внимания</Badge>
      <Badge variant="danger">Риск</Badge>
      <Badge variant="ai">AI</Badge>
    </div>
  ),
};

export const WithDot: Story = {
  args: { dot: true, variant: 'danger', children: 'Риск' },
};

export const LongText: Story = {
  args: { variant: 'warning', children: 'Очень длинная подпись статуса без переноса' },
};
