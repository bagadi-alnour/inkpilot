/** Read `process.env[key]` without non-null assertions (browser-safe when `process` is undefined). */
export function readProcessEnv(key: string): string | undefined {
  if (typeof process === 'undefined') return undefined;
  const value = process.env[key];
  return typeof value === 'string' ? value : undefined;
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  ms: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export class InkpilotError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'InkpilotError';
  }
}
