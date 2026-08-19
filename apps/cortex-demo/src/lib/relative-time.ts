/** Отметка времени словами: «5 мин назад», «через 2 дня», «вчера».
 *
 * Будущее раньше сворачивалось в одно слово «скоро» — и все события впереди
 * выглядели одинаково срочными, хотя между «через час» и «через неделю»
 * вся разница и есть. Продукт про внимание не может так отвечать на вопрос
 * «когда».
 */
export function relativeTimeLabel(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
  const ahead = diffMs < 0;
  const abs = Math.abs(diffMs);

  const minutes = Math.floor(abs / 60_000);
  if (minutes < 1) return ahead ? 'вот-вот' : 'только что';
  if (minutes < 60) return ahead ? `через ${minutes} мин` : `${minutes} мин назад`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return ahead ? `через ${hours} ч` : `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days === 1) return ahead ? 'завтра' : 'вчера';
  // «дня» до пяти, дальше «дней» — иначе «через 3 дней» режет глаз сильнее,
  // чем стоит экономия на одной строке кода.
  if (ahead) return `через ${days} ${days < 5 ? 'дня' : 'дней'}`;
  return `${days} дн назад`;
}
