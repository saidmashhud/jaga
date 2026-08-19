import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../app/App';

describe('OrbitPage — интерактивные сценарии', () => {
  it('выбор узла показывает contextual summary, Escape снимает выбор', async () => {
    render(<App />);
    const node = screen.getByRole('button', { name: 'invent.sale. Требует решения' });

    await userEvent.click(node);
    expect(node).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByLabelText('Выбранный проект: invent.sale'),
    ).toBeInTheDocument();

    await userEvent.keyboard('{Escape}');
    expect(node).toHaveAttribute('aria-pressed', 'false');
    expect(
      screen.queryByLabelText('Выбранный проект: invent.sale'),
    ).not.toBeInTheDocument();
  });

  it('повторный клик по узлу снимает выбор', async () => {
    render(<App />);
    const node = screen.getByRole('button', { name: 'Didi. Риск' });
    await userEvent.click(node);
    expect(node).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(node);
    expect(node).toHaveAttribute('aria-pressed', 'false');
  });

  it('линза применяется, показывает пояснение и сбрасывается', async () => {
    render(<App />);
    const lens = screen.getByRole('button', { name: 'Покажи риски' });

    await userEvent.click(lens);
    expect(lens).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByText('Подсвечены проекты с риском или требующие внимания.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Сбросить' }));
    expect(lens).toHaveAttribute('aria-pressed', 'false');
  });

  it('карточка фокуса выбирает проект, checkbox обновляет счётчик', async () => {
    render(<App />);

    await userEvent.click(
      screen.getByRole('button', { name: /Утвердить формат пилота/ }),
    );
    expect(
      screen.getByLabelText('Выбранный проект: invent.sale'),
    ).toBeInTheDocument();

    expect(screen.getByText('Осталось: 3')).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Завершить: Утвердить формат пилота' }),
    );
    expect(screen.getByText('Осталось: 2')).toBeInTheDocument();
  });

  it('AI-рекомендация раскрывает причины по «Почему?»', async () => {
    render(<App />);
    const why = screen.getByRole('button', { name: /Почему\?/ });
    expect(why).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(why);
    expect(why).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByText('Партнёр ждёт вашего решения по формату пилота.'),
    ).toBeInTheDocument();
  });

  it('клик по событию ленты выбирает проект', async () => {
    render(<App />);
    await userEvent.click(
      screen.getByRole('button', { name: /Релиз отложен на 3 дня/ }),
    );
    expect(screen.getByLabelText('Выбранный проект: Nexus')).toBeInTheDocument();
  });

  it('timeline переключает моковое состояние сцены', async () => {
    render(<App />);
    expect(
      screen.getByRole('button', { name: 'Кофейня. Требует внимания' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Через неделю' }));
    expect(
      screen.getByRole('button', { name: 'Кофейня. Стабильно' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'invent.sale. В работе' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Сейчас' }));
    expect(
      screen.getByRole('button', { name: 'Кофейня. Требует внимания' }),
    ).toBeInTheDocument();
  });

  it('переключение периода на «Месяц» добавляет точки диапазона', async () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: 'Месяц назад' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Месяц' }));
    expect(screen.getByRole('button', { name: 'Месяц назад' })).toBeInTheDocument();
  });

  it('composer добавляет моковое событие и показывает подтверждение', async () => {
    render(<App />);
    const input = screen.getByLabelText('Контекст');

    await userEvent.type(
      input,
      'В кофейне нужно проверить нового поставщика стаканов до вторника',
    );
    await userEvent.keyboard('{Enter}');

    await waitFor(
      () => {
        expect(
          screen.getByText(/Добавлено в проект «Кофейня»: задача, срок — вторника/),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(input).toHaveValue('');
    expect(
      screen.getByText('В кофейне нужно проверить нового поставщика стаканов до вторника'),
    ).toBeInTheDocument();
  });

  it('навигация по узлам работает с клавиатуры (Tab + Enter)', async () => {
    render(<App />);
    const node = screen.getByRole('button', { name: 'Nexus. Стабильно' });
    node.focus();
    expect(node).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(node).toHaveAttribute('aria-pressed', 'true');
  });

  it('раздел Focus открывает список задач, а не заглушку', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /Focus/i }));

    // Раньше здесь ждали тост «появится на следующем этапе». Кнопка, которая
    // всегда говорит «позже», обучает не нажимать — и тест, закрепляющий это
    // обещание, защищал заглушку.
    expect(await screen.findByRole('dialog', { name: 'Раздел' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Фокус' })).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0);
  });

  it('раздел закрывается и возвращает к сцене', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /Focus/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));
    expect(screen.queryByRole('dialog', { name: 'Раздел' })).not.toBeInTheDocument();
  });

  it('Inside убран из rail: вход в проект есть по щелчку на сфере', () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: /Inside/i })).not.toBeInTheDocument();
  });
});
