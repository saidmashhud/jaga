import type { Meta, StoryObj } from '@storybook/react';
import { Panel } from './Panel';
import { Badge } from '../../primitives/Badge/Badge';
import { Button } from '../../primitives/Button/Button';
import { Text } from '../../primitives/Text/Text';

const meta: Meta<typeof Panel> = {
  title: 'Layout/Panel',
  component: Panel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Стандартная секция правой панели: заголовок-overline, дополнительное действие, контент, футер.',
      },
    },
  },
  args: {
    title: 'Фокус сегодня',
    children: (
      <Text variant="body" color="secondary">
        Содержимое панели
      </Text>
    ),
  },
  render: (args) => (
    <div style={{ width: 320 }}>
      <Panel {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Default: Story = {};

export const WithAction: Story = {
  args: { action: <Badge variant="warning">Осталось: 3</Badge> },
};

export const WithFooter: Story = {
  args: {
    footer: (
      <Button size="sm" variant="ghost">
        Показать все
      </Button>
    ),
  },
};
