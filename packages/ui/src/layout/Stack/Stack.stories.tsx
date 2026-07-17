import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from './Stack';
import { Surface } from '../../primitives/Surface/Surface';
import { Text } from '../../primitives/Text/Text';

const meta: Meta<typeof Stack> = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Флекс-контейнер с гэпом из шкалы токенов.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stack>;

const Box = ({ label }: { label: string }) => (
  <Surface padding={3} radius="md">
    <Text variant="caption" color="secondary">
      {label}
    </Text>
  </Surface>
);

export const Vertical: Story = {
  render: () => (
    <Stack gap={3} style={{ width: 220 }}>
      <Box label="Один" />
      <Box label="Два" />
      <Box label="Три" />
    </Stack>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Stack direction="horizontal" gap={3}>
      <Box label="Один" />
      <Box label="Два" />
      <Box label="Три" />
    </Stack>
  ),
};
