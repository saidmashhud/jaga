import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchCommandField } from './SearchCommandField';

const meta: Meta<typeof SearchCommandField> = {
  title: 'Primitives/SearchCommandField',
  component: SearchCommandField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Поле верхней панели «Что важно сейчас?»: текстовый ввод, голосовой ввод, AI-режим, состояния loading и listening.',
      },
    },
  },
  render: function Render(args) {
    const [value, setValue] = useState('');
    const [listening, setListening] = useState(args.listening ?? false);
    const [ai, setAi] = useState(args.aiActive ?? false);
    return (
      <div style={{ width: 520 }}>
        <SearchCommandField
          {...args}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          listening={listening}
          aiActive={ai}
          onVoiceToggle={() => setListening((v) => !v)}
          onAiToggle={() => setAi((v) => !v)}
        />
      </div>
    );
  },
};

export default meta;
type Story = StoryObj<typeof SearchCommandField>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const Listening: Story = {
  args: { listening: true },
};

export const AiActive: Story = {
  args: { aiActive: true },
};
