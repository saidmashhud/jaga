import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, within } from '@storybook/test';
import { App } from '../../app/App';

const meta: Meta<typeof App> = {
  title: 'Pages/CortexOrbitPage',
  component: App,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Полная моковая страница Cortex Orbit, собранная из компонентов дизайн-системы: сцена с узлами и связями, правая панель, линзы, timeline, composer.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof App>;

export const Default: Story = {};

export const SelectedInventSale: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const node = await canvas.findByRole('button', {
      name: 'invent.sale. Требует решения',
    });
    await userEvent.click(node);
    await expect(
      await canvas.findByLabelText('Выбранный проект: invent.sale'),
    ).toBeInTheDocument();
  },
};

export const RiskLensActive: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lens = await canvas.findByRole('button', { name: 'Покажи риски' });
    await userEvent.click(lens);
    await expect(lens).toHaveAttribute('aria-pressed', 'true');
    await expect(
      await canvas.findByText('Подсвечены проекты с риском или требующие внимания.'),
    ).toBeInTheDocument();
  },
};

export const ComposerAddsEvent: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByLabelText('Контекст');
    await userEvent.type(
      input,
      'В кофейне нужно проверить нового поставщика стаканов до вторника',
    );
    await userEvent.keyboard('{Enter}');
    await waitFor(
      async () => {
        await expect(
          canvas.getByText(/Добавлено в проект «Кофейня»/),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

export const FutureTimelineState: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const point = await canvas.findByRole('button', { name: 'Через неделю' });
    await userEvent.click(point);
    await expect(
      await canvas.findByRole('button', { name: 'invent.sale. В работе' }),
    ).toBeInTheDocument();
  },
};

export const CompactDesktop: Story = {
  globals: { viewport: { value: 'compactDesktop' } },
  parameters: {
    viewport: { defaultViewport: 'compactDesktop' },
  },
};
