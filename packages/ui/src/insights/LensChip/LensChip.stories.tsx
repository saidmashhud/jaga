import type { Meta, StoryObj } from '@storybook/react';
import { RiskIcon } from '@cortex/icons';
import { LensChip } from './LensChip';

const meta: Meta<typeof LensChip> = {
  title: 'Insights/LensChip',
  component: LensChip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Быстрый вопрос-фильтр («линза»). Активная линза приглушает нерелевантные узлы сцены и меняет рекомендацию.',
      },
    },
  },
  args: { children: 'Покажи риски' },
};

export default meta;
type Story = StoryObj<typeof LensChip>;

export const Default: Story = {};

export const Active: Story = {
  args: { active: true },
};

export const WithIcon: Story = {
  args: { icon: <RiskIcon size={14} /> },
};

export const Loading: Story = {
  args: { loading: true },
};

export const AllLenses: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: 340 }}>
      <LensChip>Где нужны мои решения?</LensChip>
      <LensChip active>Покажи риски</LensChip>
      <LensChip>Что влияет на деньги?</LensChip>
      <LensChip>Проекты без обновлений</LensChip>
    </div>
  ),
};
