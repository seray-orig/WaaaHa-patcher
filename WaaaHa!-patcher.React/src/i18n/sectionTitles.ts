import type { TranslationKey } from './dictionaries'
import type { FactionKey } from '../gameData/factions'

/**
 * Заголовки секций приходят из комментариев файла биндингов и выглядят так:
 * «TROOPERS FOR MARINES», «WEAPON UPGRADES FOR DARK ELDAR». Разбираем их на раздел
 * и фракцию, чтобы показать перевод, а не английский текст файла.
 */
const PATTERNS: { prefix: string; sectionKey: TranslationKey }[] = [
  { prefix: 'BUILDINGS FOR', sectionKey: 'section.buildings' },
  { prefix: 'TROOPERS FOR', sectionKey: 'section.troopers' },
  { prefix: 'ABILITIES FOR', sectionKey: 'section.abilities' },
  { prefix: 'RESEARCH FOR', sectionKey: 'section.research' },
  { prefix: 'WEAPON UPGRADES FOR', sectionKey: 'section.weaponUpgrades' },
  { prefix: 'ADDONS FOR', sectionKey: 'section.addons' },
]

const SIMPLE: Record<string, TranslationKey> = {
  'SYSTEM COMMANDS': 'section.system',
  'TASKBAR COMMANDS': 'section.taskbar',
  'ADVANCED TASKBAR COMMANDS': 'section.taskbarAdvanced',
  'MULTIPLE SELECTION HOTKEYS': 'section.selection',
  'DATA CONTEXT HOTKEYS': 'section.dataContext',
  'CAMERA COMMANDS': 'section.camera',
  HQ: 'section.hq',
  BARRACKS: 'section.barracks',
  ARMORY: 'section.armory',
  VEHICLE: 'section.vehicle',
  COMMANDER: 'section.commander',
  OTHER: 'section.other',
  RESEARCH: 'section.research',
}

/** Названия рас в файле не совпадают с ключами интерфейса один в один. */
const FACTION_ALIASES: Record<string, FactionKey> = {
  MARINES: 'marine',
  CHAOS: 'chaos',
  ORKS: 'ork',
  ELDAR: 'eldar',
  TAU: 'tau',
  NECRONS: 'necron',
  'IMPERIAL GUARD': 'guard',
  GUARD: 'guard',
  'DARK ELDAR': 'dark_eldar',
  SISTERS: 'sisters',
}

export interface ParsedSection {
  /** Ключ перевода названия раздела. */
  sectionKey: TranslationKey
  /** Фракция, если заголовок её называет. */
  faction: FactionKey | null
}

/**
 * Разбирает заголовок секции. Возвращает null для неизвестных заголовков — их
 * интерфейс показывает дословно, чтобы ничего не потерять.
 */
export function parseSectionTitle(title: string): ParsedSection | null {
  const normalized = title.trim()

  for (const { prefix, sectionKey } of PATTERNS) {
    if (!normalized.toUpperCase().startsWith(prefix)) {
      continue
    }

    const rest = normalized.slice(prefix.length).trim().toUpperCase()

    return { sectionKey, faction: FACTION_ALIASES[rest] ?? null }
  }

  const simple = SIMPLE[normalized.toUpperCase()]

  return simple ? { sectionKey: simple, faction: null } : null
}