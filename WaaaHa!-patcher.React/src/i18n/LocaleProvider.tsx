import { useCallback, useMemo, useState, type ReactNode } from 'react'
import {
  LocaleContext,
  dictionaries,
  type LocaleCode,
  type LocaleContextValue,
} from './localeContext'
import type { TranslationKey } from './dictionaries'

const STORAGE_KEY = 'waaaha.locale'

/** Язык, если системный не переводится: английский. */
const FALLBACK: LocaleCode = 'en'

/**
 * Системный язык по языкам браузера.
 *
 * Браузер наследует язык системы, а navigator.languages перечисляет не только
 * первый: если основной не переводится, но в списке есть переводимый — берётся
 * он. Например, при немецком и втором английском приложение откроется на
 * английском, а не на запасном.
 */
function fromSystem(): LocaleCode {
  const preferred = navigator.languages?.length > 0 ? navigator.languages : [navigator.language]

  for (const tag of preferred) {
    const base = tag.slice(0, 2).toLowerCase()

    if (base in dictionaries) {
      return base as LocaleCode
    }
  }

  return FALLBACK
}

function detectLocale(): LocaleCode {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored && stored in dictionaries) {
    return stored as LocaleCode
  }

  return fromSystem()
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