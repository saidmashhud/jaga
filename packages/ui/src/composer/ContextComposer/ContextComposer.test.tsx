import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContextComposer } from './ContextComposer';

function Harness({ onSubmit }: { onSubmit: (value: string) => void }) {
  const [value, setValue] = useState('');
  return <ContextComposer value={value} onChange={setValue} onSubmit={onSubmit} />;
}

describe('ContextComposer', () => {
  it('отправляет черновик по Enter', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText('Контекст'), 'Проверить поставщика');
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('Проверить поставщика');
  });

  it('кнопка отправки заблокирована при пустом вводе', () => {
    render(<Harness onSubmit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  it('processing блокирует ввод и отправку', () => {
    render(
      <ContextComposer
        value="Текст"
        onChange={() => {}}
        processing
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText('Контекст')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled();
  });

  it('в listening меняется placeholder и состояние кнопки микрофона', () => {
    render(
      <ContextComposer value="" onChange={() => {}} listening onSubmit={vi.fn()} />,
    );
    expect(screen.getByPlaceholderText('Слушаю…')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Остановить голосовой ввод' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
