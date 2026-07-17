import type { Meta, StoryObj } from '@storybook/react';
import { Text } from './Text';

const meta: Meta<typeof Text> = {
  title: 'Primitives/Text',
  component: Text,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Типографический примитив. Используйте для любого текста вместо сырых тегов: variant задаёт шаг шкалы, color — семантический цвет. Не используйте для кнопок и полей — у них своя типографика.',
      },
    },
  },
  args: {
    children: 'Какие проекты требуют внимания',
    variant: 'body',
    color: 'primary',
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Default: Story = {};

export const Colors: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(['primary', 'secondary', 'tertiary', 'disabled', 'ai'] as const).map((color) => (
        <Text key={color} {...args} color={color}>
          {color} — {args.children}
        </Text>
      ))}
    </div>
  ),
};

export const TruncateSingleLine: Story = {
  args: {
    truncate: true,
    children:
      'Очень длинный заголовок проекта, который не помещается в отведённую ширину и обрезается многоточием',
  },
  render: (args) => (
    <div style={{ width: 240 }}>
      <Text {...args} />
    </div>
  ),
};

export const ClampTwoLines: Story = {
  args: {
    truncate: 2,
    color: 'secondary',
    children:
      'Длинное описание события, которое занимает больше двух строк: партнёр предложил два формата пилота, решение о формате открывает следующий этап и влияет на выручку квартала.',
  },
  render: (args) => (
    <div style={{ width: 280 }}>
      <Text {...args} />
    </div>
  ),
};

export const EmptyValue: Story = {
  args: { children: undefined },
};
