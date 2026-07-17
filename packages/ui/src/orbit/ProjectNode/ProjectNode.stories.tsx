import type { Meta, StoryObj } from '@storybook/react';
import { CoffeeIcon, TagIcon } from '@cortex/icons';
import { ProjectNode } from './ProjectNode';

const meta: Meta<typeof ProjectNode> = {
  title: 'Orbit/ProjectNode',
  component: ProjectNode,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Узел проекта на орбитальной сцене. Статус передаётся цветом, точкой и текстовой подписью. Управление: мышь, Tab/Enter, Escape снимает выбор (на уровне сцены). Позиционируется в координатах сцены (x, y — центр узла).',
      },
    },
  },
  args: {
    id: 'demo',
    title: 'Кофейня',
    subtitle: 'Офлайн-точка',
    status: 'attention',
    icon: <CoffeeIcon />,
    x: 140,
    y: 120,
    size: 'md',
  },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 280,
        height: 260,
        background: 'var(--color-bg-canvas)',
        borderRadius: 16,
      }}
    >
      <ProjectNode {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof ProjectNode>;

export const Stable: Story = {
  args: { title: 'Nexus', subtitle: 'B2B-платформа', status: 'stable', icon: undefined },
};

export const Working: Story = {
  args: { title: 'Фриланс', subtitle: 'Клиентские проекты', status: 'working', icon: undefined },
};

export const Attention: Story = {};

export const Risk: Story = {
  args: { title: 'Didi', subtitle: 'Логистика', status: 'risk', icon: undefined },
};

export const Paused: Story = {
  args: { title: 'Metan', subtitle: 'Газовое оборудование', status: 'paused', icon: undefined },
};

export const Decision: Story = {
  args: {
    title: 'invent.sale',
    subtitle: 'Пилот маркетплейса',
    status: 'decision',
    icon: <TagIcon />,
    size: 'lg',
  },
};

export const Selected: Story = {
  args: { selected: true, status: 'decision', title: 'invent.sale', icon: <TagIcon /> },
};

export const Dimmed: Story = {
  args: { dimmed: true },
};

export const RecentlyUpdated: Story = {
  args: { updated: true },
};

export const WithTooltipSummary: Story = {
  args: {
    hoverSummary:
      'Расходы выросли на 14% за месяц. Основной драйвер — закупка расходников.',
  },
};

export const LongTitle: Story = {
  args: {
    title: 'Очень длинное название проекта',
    subtitle: 'и длинный подзаголовок, который обрезается',
  },
};
