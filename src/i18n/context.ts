import { createContext, useContext } from 'react';
import type { TranslationStrings, TranslationKey, TranslationParams } from '@inkpilot/types';
import { defaultStrings } from './strings';

export interface I18nContextValue {
  locale: string;
  /** Translate `key`, filling `{name}` placeholders from `params`. */
  t: (key: TranslationKey, params?: TranslationParams) => string;
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
    t: (key: TranslationKey, params?: TranslationParams) => {
      const template = strings[key] ?? key;
      if (!params) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
    },
  };
}

export const I18nContext = createContext<I18nContextValue>(
  createI18nValue('en'),
);

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}

export { createI18nValue };
