import type { Meta, StoryObj } from '@storybook/react';
import { Surface } from './Surface';
import { Text } from '../Text/Text';

const meta: Meta<typeof Surface> = {
  title: 'Primitives/Surface',
  component: Surface,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Полупрозрачный стеклянный контейнер — базовый строительный блок панелей. Уровни: base (панель), raised (карточка над панелью), overlay (модальный слой). Не вкладывайте более двух уровней друг в друга.',
      },
    },
  },
  args: {
    level: 'base',
    padding: 4,
    radius: 'lg',
    children: (
      <Text variant="body" color="secondary">
        Содержимое поверхности
      </Text>
    ),
  },
};

export default meta;
type Story = StoryObj<typeof Surface>;

export const Default: Story = {};

export const Levels: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 16 }}>
      {(['base', 'raised', 'overlay'] as const).map((level) => (
        <Surface key={level} {...args} level={level} style={{ width: 180 }}>
          <Text variant="body-md">{level}</Text>
        </Surface>
      ))}
    </div>
  ),
};

export const Interactive: Story = {
  args: { interactive: true, tabIndex: 0, role: 'button' },
};

export const Selected: Story = {
  args: { selected: true },
};
