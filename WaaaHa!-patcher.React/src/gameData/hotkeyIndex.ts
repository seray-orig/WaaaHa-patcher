import type { HotkeyEntry, HotkeySetDetails } from '../api/types'
import {
  BUILDER_COMMANDS,
  FACTIONS,
  INFANTRY_COMMANDS,
  SELECT_COMMANDS,
  isBuilder,
  isVehicle,
  type FactionKey,
} from './factions'

export type CategoryKey =
  | 'Infantry'
  | 'Vehicle'
  | 'Building'
  | 'Ability'
  | 'Research'
  | 'WeaponUpgrade'
  | 'Addon'
  | 'System'

/** Разделы, доступные внутри фракции. Порядок совпадает с порядком вкладок. */
export const CATEGORY_ORDER: CategoryKey[] = [
  'Infantry',
  'Vehicle',
  'Building',
  'Ability',
  'Research',
  'WeaponUpgrade',
  'Addon',
]

/** Куда попадают хоткеи панели команд и прочие системные. */
export const SYSTEM_CATEGORY: CategoryKey = 'System'

export interface IndexedSection {
  /** Заголовок секции из файла — по нему интерфейс показывает перевод. */
  title: string
  entries: HotkeyEntry[]
}

export interface IndexedHotkeys {
  byId: Map<string, HotkeyEntry>
  /** Войска фракции по разделам. */
  byFaction: Map<FactionKey, Map<CategoryKey, HotkeyEntry[]>>
  /** Панель команд и прочие системные команды, с разбивкой по секциям файла. */
  systemSections: IndexedSection[]
  /** Строения фракции — их показываем строителям. */
  buildings: Map<FactionKey, HotkeyEntry[]>
  /** Все хоткеи набора. */
  all: HotkeyEntry[]
}

/**
 * Раскладывает полученные от сервера хоткеи по фракциям и разделам.
 * Техника отделена от пехоты по справочнику, в самом файле этого разделения нет.
 */
export function indexHotkeys(details: HotkeySetDetails): IndexedHotkeys {
  const byId = new Map<string, HotkeyEntry>()
  const byFaction = new Map<FactionKey, Map<CategoryKey, HotkeyEntry[]>>()
  const buildings = new Map<FactionKey, HotkeyEntry[]>()
  const systemSections: IndexedSection[] = []
  const all: HotkeyEntry[] = []

  for (const section of details.sections) {
    const systemEntries: HotkeyEntry[] = []

    for (const entry of section.entries) {
      // Один и тот же хоткей файла встречается в двух разделах сразу: например,
      // tau_missile_barrage значится и исследованием, и умением. Показывать его
      // дважды нельзя, иначе в списке появятся две одинаковые плитки — а ещё это
      // ломает ключи React, и при переключении фильтров старые плитки застревают.
      if (byId.has(entry.id)) {
        continue
      }

      byId.set(entry.id, entry)
      all.push(entry)

      if (!isFactionKey(entry.group)) {
        systemEntries.push(entry)
        continue
      }

      const category = resolveCategory(entry, entry.group)
      const categories = byFaction.get(entry.group) ?? new Map<CategoryKey, HotkeyEntry[]>()
      const bucket = categories.get(category)

      if (bucket) {
        bucket.push(entry)
      } else {
        categories.set(category, [entry])
      }

      byFaction.set(entry.group, categories)

      if (category === 'Building') {
        const list = buildings.get(entry.group)

        if (list) {
          list.push(entry)
        } else {
          buildings.set(entry.group, [entry])
        }
      }
    }

    if (systemEntries.length > 0) {
      systemSections.push({ title: section.title, entries: systemEntries })
    }
  }

  return { byId, byFaction, systemSections, buildings, all }
}

function isFactionKey(value: string): value is FactionKey {
  return (FACTIONS as readonly string[]).includes(value)
}

/** Пехота и техника лежат в одной секции файла, поэтому разводим их по справочнику. */
function resolveCategory(entry: HotkeyEntry, faction: FactionKey): CategoryKey {
  if (entry.category === SYSTEM_CATEGORY) {
    return SYSTEM_CATEGORY
  }

  if (entry.category === 'Infantry' && isVehicle(faction, entry.id)) {
    return 'Vehicle'
  }

  return entry.category as CategoryKey
}

export interface UnitCommands {
  /** Команды, доступные этой единице. */
  commands: HotkeyEntry[]
  /** Постройки, доступные строителю. */
  buildings: HotkeyEntry[]
}

/**
 * Собирает список клавиш, привязанных к юниту или строению.
 * Общие команды есть у всего, что можно выделить на поле, а строители дополнительно
 * видят постройки своей расы — ровно как в игровой панели.
 */
export function commandsForUnit(
  entry: HotkeyEntry,
  faction: FactionKey,
  indexed: IndexedHotkeys,
): UnitCommands {
  const ids = new Set<string>(SELECT_COMMANDS)

  if (entry.category === 'Infantry') {
    INFANTRY_COMMANDS.forEach((id) => ids.add(id))
  }

  const buildings: HotkeyEntry[] = []

  if (entry.category === 'Building') {
    ids.add('repair')

    if (isBuilder(faction, entry.id)) {
      BUILDER_COMMANDS.forEach((id) => ids.add(id))
      buildings.push(...(indexed.buildings.get(faction) ?? []))
    }
  }

  const commands = [...ids]
    .map((id) => indexed.byId.get(id))
    .filter((command): command is HotkeyEntry => command !== undefined)

  return { commands, buildings }
}

/** Сколько всего хоткеев у фракции — для приглушения пустых кнопок. */
export function factionTotals(indexed: IndexedHotkeys): Map<FactionKey, number> {
  const totals = new Map<FactionKey, number>()

  for (const [faction, categories] of indexed.byFaction) {
    let sum = 0

    for (const list of categories.values()) {
      sum += list.length
    }

    totals.set(faction, sum)
  }

  return totals
}