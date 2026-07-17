import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './Grid';
import { Surface } from '../../primitives/Surface/Surface';
import { Text } from '../../primitives/Text/Text';

const meta: Meta<typeof Grid> = {
  title: 'Layout/Grid',
  component: Grid,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Грид-контейнер для правой панели и документационных примеров.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

export const TwoColumns: Story = {
  render: () => (
    <Grid columns={2} gap={3} style={{ width: 360 }}>
      {['A', 'B', 'C', 'D'].map((label) => (
        <Surface key={label} padding={3} radius="md">
          <Text variant="caption" color="secondary">
            {label}
          </Text>
        </Surface>
      ))}
    </Grid>
  ),
};

export const CustomTemplate: Story = {
  render: () => (
    <Grid columns="2fr 1fr" gap={3} style={{ width: 360 }}>
      <Surface padding={3} radius="md">
        <Text variant="caption" color="secondary">
          Основная колонка
        </Text>
      </Surface>
      <Surface padding={3} radius="md">
        <Text variant="caption" color="secondary">
          Сайд
        </Text>
      </Surface>
    </Grid>
  ),
};
