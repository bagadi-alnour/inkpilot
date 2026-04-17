export function detectColorScheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const html = document.documentElement;
  const body = document.body;

  if (
    html.getAttribute('data-theme') === 'dark' ||
    body.getAttribute('data-theme') === 'dark' ||
    html.classList.contains('dark') ||
    body.classList.contains('dark')
  ) {
    return 'dark';
  }

  if (
    html.getAttribute('data-theme') === 'light' ||
    body.getAttribute('data-theme') === 'light' ||
    html.classList.contains('light') ||
    body.classList.contains('light')
  ) {
    return 'light';
  }

  if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  return 'light';
}

export function detectHostCSSVariables(): Record<string, string> {
  if (typeof window === 'undefined') return {};

  const computed = getComputedStyle(document.documentElement);
  const knownVars = [
    '--color-primary',
    '--color-secondary',
    '--color-accent',
    '--color-background',
    '--background',
    '--foreground',
    '--border',
    '--muted',
    '--primary',
    '--secondary',
    '--accent',
  ];

  const detected: Record<string, string> = {};
  for (const v of knownVars) {
    const value = computed.getPropertyValue(v).trim();
    if (value) {
      detected[v] = value;
    }
  }

  return detected;
}
