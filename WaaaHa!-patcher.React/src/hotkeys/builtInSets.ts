import type { TranslationKey } from '../i18n/dictionaries'

/**
 * Встроенные наборы игры хранят в bindings_locstring не текст, а идентификатор
 * локализации вида $11271750. Чтобы игрок не видел эти номера, сопоставляем их с названиями.
 */
const BUILT_IN_NAMES: Record<string, TranslationKey> = {
  $11271750: 'sets.preset.classic',
  $11271751: 'sets.preset.grid',
  $11271752: 'sets.preset.modern',
  $11271953: 'sets.preset.gridQwertz',
  $11271954: 'sets.preset.gridAzerty',
}

/** Возвращает ключ перевода для встроенного набора или null, если это пользовательский. */
export function builtInNameKey(displayName: string): TranslationKey | null {
  return BUILT_IN_NAMES[displayName] ?? null
}