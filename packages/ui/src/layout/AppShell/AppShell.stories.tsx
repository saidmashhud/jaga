import type { Meta, StoryObj } from '@storybook/react';
import { AppShell } from './AppShell';
import { Text } from '../../primitives/Text/Text';

const meta: Meta<typeof AppShell> = {
  title: 'Layout/AppShell',
  component: AppShell,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Каркас приложения: Header / NavigationRail / MainWorkspace / InsightsPanel / Composer. Ниже 1280px правая панель становится overlay (asideOpen + onAsideClose).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AppShell>;

const Slot = ({ label }: { label: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      minHeight: 48,
      border: '1px dashed var(--color-border-strong)',
      borderRadius: 8,
      margin: 4,
    }}
  >
    <Text variant="caption" color="tertiary">
      {label}
    </Text>
  </div>
);

export const Skeleton: Story = {
  render: () => (
    <div style={{ height: 480 }}>
      <AppShell
        header={<Slot label="Header" />}
        navigation={<Slot label="Rail" />}
        aside={<Slot label="Insights" />}
        composer={<Slot label="Composer" />}
        style={{ height: '100%' }}
      >
        <Slot label="Orbit Workspace" />
      </AppShell>
    </div>
  ),
};
