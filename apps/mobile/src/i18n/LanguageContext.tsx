import { createContext, useContext, useEffect, useState, useCallback, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './en.json';
import ur from './ur.json';

export type Locale = 'en' | 'ur';

const translations: Record<Locale, typeof en> = { en, ur };

interface LanguageContextValue {
  locale: Locale;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => Promise<void>;
}

const STORAGE_KEY = 'ustaz_language';

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'ur') setLocaleState('ur');
    });
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const value = getNestedValue(translations[locale], key);
      if (value == null) return key;
      if (!params) return value;
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v)),
        value,
      );
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, isRTL: locale === 'ur', t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

const DEFAULT_VALUE: LanguageContextValue = {
  locale: 'en',
  isRTL: false,
  t: (key) => key,
  setLocale: async () => {},
};

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext) ?? DEFAULT_VALUE;
}
