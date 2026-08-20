import { describe, expect, it } from 'vitest';
import type { ConnectionKind } from '../../services/cortex-api';
import type { ProjectConnection } from '../../mocks/types';
import { attentionGap, findExisting, missing, orderedEnds, phraseOf } from './link-phrase';

const деньги: ConnectionKind = {
  id: 'finance', name: 'Деньги', hint: 'один кормит другой', directed: true, phrase: 'даёт деньги',
};
const команда: ConnectionKind = {
  id: 'team', name: 'Общая команда', hint: 'делают одни и те же люди', directed: false, phrase: 'общая команда',
};

function связь(sourceId: string, targetId: string): ProjectConnection {
  return { id: `${sourceId}-${targetId}`, sourceId, targetId, type: 'finance', strength: 1 };
}

describe('фраза связи', () => {
  it('читается подставленными именами', () => {
    const p = phraseOf(деньги, 'Кофейня', 'Фриланс');
    expect([p.left, p.middle, p.right]).toEqual(['Кофейня', 'даёт деньги', 'Фриланс']);
    expect(p.directed).toBe(true);
  });

  it('незаполненное называет себя, а не остаётся пустотой', () => {
    // Пустое место в фразе должно читаться как приглашение, иначе человек
    // видит обрывок утверждения и не понимает, чего от него хотят.
    const p = phraseOf(null, 'Кофейня', null);
    expect(p.middle).toMatch(/выберите вид/);
    expect(p.right).toMatch(/выберите второй проект/);
  });

  it('у взаимного вида порядок не заявляется как важный', () => {
    expect(phraseOf(команда, 'Кофейня', 'Фриланс').directed).toBe(false);
  });
});

describe('порядок концов', () => {
  it('направленный вид сохраняет то, что выбрал человек', () => {
    expect(orderedEnds(деньги, 'kofeynya', 'didi')).toEqual(['kofeynya', 'didi']);
    expect(orderedEnds(деньги, 'didi', 'kofeynya')).toEqual(['didi', 'kofeynya']);
  });

  it('взаимный вид приводится к одному порядку — как это делает служба', () => {
    // Если страница покажет один порядок, а служба запишет другой, нажатие
    // «Наоборот» ничего не изменит, и кнопка будет выглядеть сломанной.
    expect(orderedEnds(команда, 'kofeynya', 'didi')).toEqual(orderedEnds(команда, 'didi', 'kofeynya'));
  });

  it('без выбранного вида порядок не трогается', () => {
    expect(orderedEnds(null, 'я', 'а')).toEqual(['я', 'а']);
  });
});

describe('поиск существующей связи', () => {
  const список = [связь('kofeynya', 'didi'), связь('nexus', 'metan')];

  it('находит в ту же сторону', () => {
    expect(findExisting(список, 'kofeynya', 'didi')?.reversed).toBe(false);
  });

  it('находит в обратную и говорит, что она обратная', () => {
    expect(findExisting(список, 'didi', 'kofeynya')?.reversed).toBe(true);
  });

  it('не находит несвязанную пару', () => {
    expect(findExisting(список, 'kofeynya', 'nexus')).toBeNull();
  });

  it('дефис внутри имени не даёт ложного совпадения', () => {
    // Имя связи склеивается через дефис, и «invent-sale» + «didi» дало бы
    // «invent-sale-didi» — ту же строку, что «invent» + «sale-didi».
    const хитрый = [связь('invent', 'sale-didi')];
    expect(findExisting(хитрый, 'invent-sale', 'didi')).toBeNull();
  });
});

describe('ось внимания', () => {
  it('соседние состояния — это не разные этажи', () => {
    expect(attentionGap('risk', 'attention')).toBe(1);
  });

  it('края шкалы далеки друг от друга', () => {
    expect(attentionGap('decision', 'paused')).toBe(5);
  });

  it('незнакомое состояние не выдумывает расстояния', () => {
    // Лучше промолчать, чем предупредить о том, чего не знаешь.
    expect(attentionGap('decision', 'сомнительное')).toBe(0);
  });
});

describe('чего не хватает', () => {
  it('сначала спрашивает проект, потом вид', () => {
    expect(missing(null, деньги)).toMatch(/второй проект/);
    expect(missing('didi', null)).toMatch(/что между ними/);
  });

  it('когда всё выбрано — молчит', () => {
    expect(missing('didi', деньги)).toBeNull();
  });
});
