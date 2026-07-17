import type { Meta, StoryObj } from '@storybook/react';
import { AiIcon, PlusIcon } from '@cortex/icons';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Кнопка действия. primary — одно главное действие на экран; secondary — обычные действия; ghost — второстепенные; danger — разрушающие; ai — действия AI-режиссёра. Для icon-only управлений используйте IconButton.',
      },
    },
  },
  args: {
    children: 'Утвердить формат',
    variant: 'secondary',
    size: 'md',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button {...args} variant="primary">
        Primary
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="danger">
        Danger
      </Button>
      <Button {...args} variant="ai" iconLeft={<AiIcon size={16} />}>
        AI Режиссёр
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="md">
        Medium
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: { iconLeft: <PlusIcon size={16} />, children: 'Добавить проект' },
};

export const Loading: Story = {
  args: { loading: true, variant: 'primary' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const LongLabel: Story = {
  args: {
    children: 'Очень длинная подпись действия, которая не должна ломать раскладку кнопки',
  },
  render: (args) => (
    <div style={{ width: 220 }}>
      <Button {...args} style={{ maxWidth: '100%', overflow: 'hidden' }} />
    </div>
  ),
};
