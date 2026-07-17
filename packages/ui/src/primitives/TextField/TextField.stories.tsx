import type { Meta, StoryObj } from '@storybook/react';
import { SearchIcon } from '@cortex/icons';
import { TextField } from './TextField';

const meta: Meta<typeof TextField> = {
  title: 'Primitives/TextField',
  component: TextField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Текстовое поле с label, hint и error. Ошибка объявляется screen reader через role="alert".',
      },
    },
  },
  args: {
    label: 'Название проекта',
    placeholder: 'Например, invent.sale',
  },
};

export default meta;
type Story = StoryObj<typeof TextField>;

export const Default: Story = {};

export const Filled: Story = {
  args: { defaultValue: 'Кофейня' },
};

export const WithHint: Story = {
  args: { hint: 'Короткое имя проекта, видно на орбите.' },
};

export const ErrorState: Story = {
  args: { error: 'Название обязательно', defaultValue: '' },
};

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Metan' },
};

export const WithIcon: Story = {
  args: { iconLeft: <SearchIcon size={16} />, label: undefined, placeholder: 'Поиск' },
};
