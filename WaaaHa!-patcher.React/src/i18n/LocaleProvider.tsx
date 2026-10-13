import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  LocaleContext,
  dictionaries,
  type LocaleCode,
  type LocaleContextValue,
} from './localeContext'
import type { TranslationKey } from './dictionaries'

const STORAGE_KEY = 'waaaha.locale'

function detectLocale(): LocaleCode {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored && stored in dictionaries) {
    return stored as LocaleCode
  }

  const browser = navigator.language.slice(0, 2).toLowerCase()

  return browser in dictionaries ? (browser as LocaleCode) : 'ru'
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(detectLocale)

  const setLocale = useCallback((next: LocaleCode) => {
    localStorage.setItem(STORAGE_KEY, next)
    setLocaleState(next)
  }, [])

  const t = useCallback<LocaleContextValue['t']>(
    (key, values) => {
      let text: string = dictionaries[locale][key] ?? dictionaries.ru[key] ?? key

      if (values) {
        for (const [name, value] of Object.entries(values)) {
          text = text.replaceAll(`{${name}}`, String(value))
        }
      }

      return text
    },
    [locale],
  )

  const tError = useCallback(
    (code: string, fallback: string) => {
      const key = `error.${code}` as TranslationKey

      return dictionaries[locale][key] ?? dictionaries.ru[key] ?? fallback
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t, tError }), [locale, setLocale, t, tError])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}