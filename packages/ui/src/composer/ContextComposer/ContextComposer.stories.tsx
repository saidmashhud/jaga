import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ContextComposer } from './ContextComposer';

const meta: Meta<typeof ContextComposer> = {
  title: 'Composer/ContextComposer',
  component: ContextComposer,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Нижняя строка ввода контекста: добавление, текст, голос, отправка. Enter или кнопка отправляют черновик; на первом этапе отправка создаёт моковое событие с processing 600–1000 мс.',
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value ?? '');
    const [listening, setListening] = useState(args.listening ?? false);
    return (
      <div style={{ width: 640 }}>
        <ContextComposer
          {...args}
          value={value}
          onChange={setValue}
          listening={listening}
          onVoiceToggle={() => setListening((v) => !v)}
          onSubmit={() => setValue('')}
        />
      </div>
    );
  },
  args: { value: '' },
};

export default meta;
type Story = StoryObj<typeof ContextComposer>;

export const Default: Story = {};

export const WithDraft: Story = {
  args: { value: 'В кофейне нужно проверить нового поставщика стаканов до вторника' },
};

export const Processing: Story = {
  args: {
    processing: true,
    value: 'В кофейне нужно проверить нового поставщика стаканов до вторника',
  },
};

export const Listening: Story = {
  args: { listening: true },
};
