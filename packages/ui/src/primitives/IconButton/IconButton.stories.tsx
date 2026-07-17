import type { Meta, StoryObj } from '@storybook/react';
import { BellIcon, MicIcon, SettingsIcon } from '@cortex/icons';
import { IconButton } from './IconButton';

const meta: Meta<typeof IconButton> = {
  title: 'Primitives/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Кнопка-иконка для навигации, поиска, уведомлений и Composer. aria-label обязателен: у контрола нет видимого текста. Всегда сопровождайте Tooltip.',
      },
    },
  },
  args: {
    'aria-label': 'Уведомления',
    children: <BellIcon size={18} />,
  },
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Default: Story = {};

export const Variants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <IconButton aria-label="Ghost">
        <BellIcon size={18} />
      </IconButton>
      <IconButton aria-label="Surface" variant="surface">
        <SettingsIcon size={18} />
      </IconButton>
      <IconButton aria-label="AI" variant="ai">
        <MicIcon size={18} />
      </IconButton>
    </div>
  ),
};

export const Active: Story = {
  args: { active: true, 'aria-label': 'Голосовой ввод активен', children: <MicIcon size={18} /> },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <IconButton key={size} aria-label={size} size={size}>
          <BellIcon size={size === 'sm' ? 14 : size === 'md' ? 18 : 22} />
        </IconButton>
      ))}
    </div>
  ),
};
