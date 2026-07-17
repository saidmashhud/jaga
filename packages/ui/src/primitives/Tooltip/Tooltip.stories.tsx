import type { Meta, StoryObj } from '@storybook/react';
import { BellIcon } from '@cortex/icons';
import { Tooltip } from './Tooltip';
import { IconButton } from '../IconButton/IconButton';
import { Button } from '../Button/Button';

const meta: Meta<typeof Tooltip> = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подсказка при hover/focus. Обязательна для всех иконок без текстовой подписи, но не может быть единственным источником информации — критичный текст дублируйте в интерфейсе.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="Уведомления">
      <IconButton aria-label="Уведомления">
        <BellIcon size={18} />
      </IconButton>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, padding: 60 }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((placement) => (
        <Tooltip key={placement} content={placement} placement={placement} delay={100}>
          <Button size="sm">{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Tooltip
      content="Didi — риск: срыв сроков поставки у ключевого подрядчика, новый партнёр может закрыть маршрут."
      delay={100}
    >
      <Button size="sm">Наведите: длинный текст</Button>
    </Tooltip>
  ),
};
