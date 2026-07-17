import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LensChip } from './LensChip';

describe('LensChip', () => {
  it('вызывает onClick', async () => {
    const onClick = vi.fn();
    render(<LensChip onClick={onClick}>Покажи риски</LensChip>);
    await userEvent.click(screen.getByRole('button', { name: 'Покажи риски' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('активная линза помечается aria-pressed', () => {
    render(<LensChip active>Покажи риски</LensChip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('в loading блокируется', () => {
    render(<LensChip loading>Покажи риски</LensChip>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
