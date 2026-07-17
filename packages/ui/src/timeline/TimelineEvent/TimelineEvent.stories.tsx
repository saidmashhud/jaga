import type { Meta, StoryObj } from '@storybook/react';
import { TimelineEvent } from './TimelineEvent';

const meta: Meta<typeof TimelineEvent> = {
  title: 'Timeline/TimelineEvent',
  component: TimelineEvent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Точка события на треке Timeline. Размер задаёт intensity, цвет — тип события; будущие события — контурные. Название доступно по hover/focus (tooltip) и через aria-label.',
      },
    },
  },
  args: {
    position: 50,
    label: 'Nexus — релиз отложен на 3 дня',
    type: 'update',
    intensity: 2,
  },
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 320,
        height: 40,
        borderBottom: '1px solid var(--color-border-default)',
      }}
    >
      <TimelineEvent {...args} />
    </div>
  ),
};

export default meta;
type Story = StoryObj<typeof TimelineEvent>;

export const Update: Story = {};

export const Risk: Story = {
  args: { type: 'risk', intensity: 3, label: 'Didi — срыв сроков подрядчика' },
};

export const Decision: Story = {
  args: { type: 'decision', label: 'invent.sale — дедлайн решения' },
};

export const Deadline: Story = {
  args: { type: 'deadline', label: 'Фриланс — сдать оценку' },
};

export const Future: Story = {
  args: { future: true, type: 'decision' },
};

export const Selected: Story = {
  args: { selected: true },
};

export const Intensities: Story = {
  render: (args) => (
    <div
      style={{
        position: 'relative',
        width: 320,
        height: 40,
        borderBottom: '1px solid var(--color-border-default)',
      }}
    >
      <TimelineEvent {...args} position={20} intensity={1} label="intensity 1" />
      <TimelineEvent {...args} position={50} intensity={2} label="intensity 2" />
      <TimelineEvent {...args} position={80} intensity={3} label="intensity 3" />
    </div>
  ),
};
