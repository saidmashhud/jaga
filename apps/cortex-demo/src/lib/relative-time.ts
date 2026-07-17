/** Compact Russian relative-time label: «только что», «5 мин назад», «2 ч назад»… */
export function relativeTimeLabel(iso: string, now: number = Date.now()): string {
  const diffMs = now - new Date(iso).getTime();
  if (diffMs < 0) return 'скоро';
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч назад`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'вчера';
  return `${days} дн назад`;
}
