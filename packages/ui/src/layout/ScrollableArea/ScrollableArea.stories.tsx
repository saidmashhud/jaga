import type { Meta, StoryObj } from '@storybook/react';
import { ScrollableArea } from './ScrollableArea';
import { Text } from '../../primitives/Text/Text';

const meta: Meta<typeof ScrollableArea> = {
  title: 'Layout/ScrollableArea',
  component: ScrollableArea,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Контейнер с нативной прокруткой и кастомным тонким скроллбаром.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ScrollableArea>;

export const Vertical: Story = {
  render: () => (
    <ScrollableArea
      maxHeight={180}
      style={{
        width: 280,
        border: '1px solid var(--color-border-default)',
        borderRadius: 12,
        padding: 12,
      }}
    >
      {Array.from({ length: 16 }, (_, i) => (
        <Text key={i} variant="body" color="secondary" as="p" style={{ margin: '6px 0' }}>
          Строка контента {i + 1}
        </Text>
      ))}
    </ScrollableArea>
  ),
};
