import { createContext, useContext, useMemo } from 'react';
import type { LabelRegistry } from './LabelTraffic';

/**
 * Список подписей сцены.
 *
 * Общий на сцену, потому что решение «чью подпись показать» принимается для
 * всех разом: подпись, знающая только себя, не может уступить соседке.
 */
const LabelRegistryContext = createContext<LabelRegistry | null>(null);

export const LabelRegistryProvider = LabelRegistryContext.Provider;

export function useLabelRegistry(): LabelRegistry {
  const registry = useContext(LabelRegistryContext);
  if (!registry) {
    throw new Error('useLabelRegistry вызван вне сцены');
  }
  return registry;
}

export function useCreateLabelRegistry(): LabelRegistry {
  return useMemo(() => new Map(), []);
}
