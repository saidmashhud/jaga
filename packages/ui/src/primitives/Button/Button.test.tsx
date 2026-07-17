import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('рендерит подпись и вызывает onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Утвердить</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Утвердить' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('не кликается в disabled', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Утвердить
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('в loading блокируется и получает aria-busy', () => {
    render(<Button loading>Утвердить</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('по умолчанию type=button', () => {
    render(<Button>Ок</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
