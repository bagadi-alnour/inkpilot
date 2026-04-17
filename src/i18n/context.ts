import { createContext, useContext } from 'react';
import type { TranslationStrings, TranslationKey } from '@writeflow/types';
import { defaultStrings } from './strings';

export interface I18nContextValue {
  locale: string;
  t: (key: TranslationKey) => string;
  strings: TranslationStrings;
}

function createI18nValue(
  locale: string,
  overrides?: Partial<TranslationStrings>,
): I18nContextValue {
  const strings: TranslationStrings = { ...defaultStrings, ...overrides };

  return {
    locale,
    strings,
    t: (key: TranslationKey) => strings[key] ?? key,
  };
}

export const I18nContext = createContext<I18nContextValue>(
  createI18nValue('en'),
);

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}

export { createI18nValue };
