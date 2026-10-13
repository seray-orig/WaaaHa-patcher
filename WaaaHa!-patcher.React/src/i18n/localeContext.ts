import { createContext, useContext } from 'react'
import { en, ko, ru, type Dictionary, type TranslationKey } from './dictionaries'

export type LocaleCode = 'ru' | 'en' | 'ko'

export const locales: { code: LocaleCode; label: string }[] = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
]

export const dictionaries: Record<LocaleCode, Dictionary> = { ru, en, ko }

export interface LocaleContextValue {
  locale: LocaleCode
  setLocale: (locale: LocaleCode) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
  /** Текст ошибки по коду из API; fallback используется, если кода нет в словаре. */
  tError: (code: string, fallback: string) => string
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext)

  if (context === null) {
    throw new Error('useLocale must be called inside LocaleProvider')
  }

  return context
}