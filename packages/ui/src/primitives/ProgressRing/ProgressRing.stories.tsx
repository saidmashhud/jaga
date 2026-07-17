import type { Meta, StoryObj } from '@storybook/react';
import { ProgressRing } from './ProgressRing';

const meta: Meta<typeof ProgressRing> = {
  title: 'Primitives/ProgressRing',
  component: ProgressRing,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Кольцевой индикатор прогресса. Без value — indeterminate (вращение). Задавайте aria-label, когда рядом нет текстового описания.',
      },
    },
  },
  args: { value: 64, size: 32, 'aria-label': 'Прогресс задачи' },
};

export default meta;
type Story = StoryObj<typeof ProgressRing>;

export const Default: Story = {};

export const WithValue: Story = {
  args: { showValue: true, size: 44 },
};

export const Indeterminate: Story = {
  args: { value: undefined },
};

export const CustomColorAndThickness: Story = {
  args: { color: 'var(--color-state-risk)', thickness: 5, size: 48, value: 32 },
};

export const Small: Story = {
  args: { size: 16, thickness: 2 },
};
