export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatReadingTime(minutes: number, locale: string): string {
  if (minutes === 0) return '';
  if (minutes === 1) return '1 min read';
  return `${formatNumber(minutes, locale)} min read`;
}

export function formatWordCount(count: number, locale: string): string {
  const formatted = formatNumber(count, locale);
  return count === 1 ? '1 word' : `${formatted} words`;
}
