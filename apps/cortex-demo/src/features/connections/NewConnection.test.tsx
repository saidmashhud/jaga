import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../app/App';
import { hydrate, markSource } from '../../services/mock-cortex-service';
import { projects } from '../../mocks/projects';
import { connections } from '../../mocks/connections';

/**
 * Форма связи целиком, от карточки проекта до тела запроса.
 *
 * Проверяется не разметка, а обещания, которые форма даёт человеку: что вход
 * появляется тогда, когда связывать есть с чем; что нажатие называет
 * недостающее, а не молчит; что фраза читается так, как ляжет на сцену; и что
 * до службы уходит ровно то, что человек видел.
 */

const KINDS = [
  { id: 'finance', name: 'Деньги', hint: 'один кормит другой', directed: true, phrase: 'даёт деньги' },
  { id: 'team', name: 'Общая команда', hint: 'делают одни и те же люди', directed: false, phrase: 'общая команда' },
];

function живоеПространство(): void {
  markSource('live');
  hydrate({ projects, connections, kinds: KINDS });
}

afterEach(() => {
  markSource('sample');
  vi.restoreAllMocks();
});

async function открытьФорму(имя: string) {
  живоеПространство();
  render(<App />);
  await userEvent.click(screen.getByRole('button', { name: new RegExp(`^${имя}\\.`) }));
  await userEvent.click(screen.getByRole('button', { name: 'Связать с другим' }));
  return screen.getByRole('dialog', { name: 'Новая связь' });
}

describe('форма связи', () => {
  it('вход появляется в карточке выбранного проекта', async () => {
    живоеПространство();
    render(<App />);
    expect(screen.queryByRole('button', { name: 'Связать с другим' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Didi\./ }));
    expect(screen.getByRole('button', { name: 'Связать с другим' })).toBeInTheDocument();
  });

  it('на встроенном образце связь не заводится', async () => {
    // Образец — чужие дела. Форма, заводящая в них связи, обещала бы
    // сохранение того, что никуда не сохранится.
    markSource('sample');
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /^Didi\./ }));
    expect(screen.queryByRole('button', { name: 'Связать с другим' })).not.toBeInTheDocument();
  });

  it('фраза читается подставленными именами и меняется вместе с видом', async () => {
    const форма = await открытьФорму('Didi');
    expect(within(форма).getByText('— выберите вид —')).toBeInTheDocument();

    await userEvent.click(within(форма).getByRole('radio', { name: /Деньги/ }));
    expect(within(форма).getByText('даёт деньги')).toBeInTheDocument();
  });

  it('у взаимного вида порядок объявляется неважным, и «Наоборот» исчезает', async () => {
    const форма = await открытьФорму('Didi');
    await userEvent.click(within(форма).getByRole('radio', { name: /Деньги/ }));
    expect(within(форма).getByRole('button', { name: 'Наоборот' })).toBeInTheDocument();

    await userEvent.click(within(форма).getByRole('radio', { name: /Общая команда/ }));
    expect(within(форма).queryByRole('button', { name: 'Наоборот' })).not.toBeInTheDocument();
    expect(within(форма).getByText(/Порядок не важен/)).toBeInTheDocument();
  });

  it('нажатие называет недостающее, а не запирается молча', async () => {
    // Запертая кнопка не объясняет, чего от человека хотят: он видит серое
    // пятно и уходит гадать. Так уже устроена форма проекта.
    const форма = await открытьФорму('Didi');
    await userEvent.click(within(форма).getByRole('button', { name: 'Связать' }));
    expect(within(форма).getByRole('alert')).toHaveTextContent(/второй проект/i);
  });

  it('уже связанную пару заводить не даёт и говорит почему', async () => {
    // В образце Кофейня и Фриланс уже связаны.
    const форма = await открытьФорму('Кофейня');
    const пара = connections.find((c) => c.sourceId === 'kofeynya' || c.targetId === 'kofeynya');
    const другой = пара!.sourceId === 'kofeynya' ? пара!.targetId : пара!.sourceId;

    await userEvent.selectOptions(within(форма).getByRole('combobox'), другой);
    expect(within(форма).getByText(/уже связаны/)).toBeInTheDocument();
    expect(within(форма).getByRole('button', { name: 'Связать' })).toBeDisabled();
  });

  it('фокус входит в форму, а не остаётся на открывшей кнопке', async () => {
    // Панель объявлена aria-modal: для читалки экрана всё за её пределами
    // перестало существовать. Оставить фокус снаружи — оставить человека в
    // тишине, на кнопке, которой для него уже нет.
    const форма = await открытьФорму('Didi');
    expect(форма.contains(document.activeElement)).toBe(true);
  });

  it('обход по Tab не выходит из формы', async () => {
    // aria-modal объявляет, что за пределами панели ничего нет. Если фокус
    // туда уходит, читалка молчит, а человек не понимает, где он.
    const форма = await открытьФорму('Didi');
    for (let i = 0; i < 40; i++) {
      await userEvent.tab();
      expect(форма.contains(document.activeElement)).toBe(true);
    }
  });

  it('после закрытия фокус возвращается на открывшую кнопку', async () => {
    await открытьФорму('Didi');
    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Связать с другим' }));
  });

  it('«Снять выбор» при открытой форме снимает выбор, а не только гасит форму', async () => {
    // Кнопка стоит в другой панели и видна одновременно с формой. Нажатие,
    // после которого выбор остаётся, читается как «кнопка не работает».
    await открытьФорму('Didi');
    await userEvent.click(screen.getByRole('button', { name: 'Снять выбор' }));
    expect(screen.queryByRole('dialog', { name: 'Новая связь' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Снять выбор' })).not.toBeInTheDocument();
  });

  it('уход в раздел закрывает форму', async () => {
    // Панель раздела занимает тот же прямоугольник: две легли бы друг на друга.
    await открытьФорму('Didi');
    await userEvent.click(screen.getByRole('button', { name: 'Focus' }));
    expect(screen.queryByRole('dialog', { name: 'Новая связь' })).not.toBeInTheDocument();
  });

  it('без списка видов от службы форма не требует невыполнимого', async () => {
    // Кнопка, зовущая выбрать вид, когда выбирать не из чего, — издевательство.
    markSource('live');
    hydrate({ projects, connections, kinds: [] });
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /^Didi\./ }));
    await userEvent.click(screen.getByRole('button', { name: 'Связать с другим' }));
    const форма = screen.getByRole('dialog', { name: 'Новая связь' });
    expect(within(форма).getByText(/не отдала список видов/)).toBeInTheDocument();
    expect(within(форма).getByRole('button', { name: 'Связать' })).toBeDisabled();
  });

  it('до службы уходит ровно то, что человек видел', async () => {
    const отправлено: Array<{ url: string; body: unknown }> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      const u = String(url);
      if (u.endsWith('/config.json')) {
        return new Response(JSON.stringify({ apiUrl: '/', tenantId: 'said' }), { status: 200 });
      }
      отправлено.push({ url: u, body: JSON.parse(String(init?.body ?? 'null')) });
      return new Response(JSON.stringify({ id: 'didi-nexus' }), { status: 201 });
    });
    // Перезагрузку страницы в проверке не делаем — важно тело запроса.
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { reload }, writable: true });

    const форма = await открытьФорму('Didi');
    await userEvent.selectOptions(within(форма).getByRole('combobox'), 'nexus');
    await userEvent.click(within(форма).getByRole('radio', { name: /Деньги/ }));
    await userEvent.click(within(форма).getByRole('radio', { name: /Крепко/ }));
    await userEvent.click(within(форма).getByRole('button', { name: 'Связать' }));

    const запрос = отправлено.find((r) => r.url.includes('/v1/connections'));
    expect(запрос?.body).toEqual({
      sourceId: 'didi',
      targetId: 'nexus',
      type: 'finance',
      strength: 3,
      // Пустая подпись заменяется именем вида — форма прямо это обещает.
      label: 'Деньги',
    });
  });
});
