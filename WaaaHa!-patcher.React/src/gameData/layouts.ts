import type { FactionKey } from './factions'

/**
 * Экран набора описывается здесь и больше нигде.
 *
 * Всё, что раньше приходилось угадывать, теперь перечислено руками: состав плиток
 * расы и содержимое панелей каждого юнита. Правил нет — в игре их тоже нет.
 * Строитель производит глайдер, значит хоткей глайдера задаёт игрок; машинерия
 * строится у строителя, значит и её хоткей тоже. Построить это правилом нельзя,
 * можно только перечислить.
 *
 * ── Как описать состав расы ────────────────────────────────────────────────
 *
 * В FACTION_ROSTERS ключ — фракция, значение — что стоит в плитках и в фильтрах.
 * Список читается сверху вниз, и это же порядок показывается на экране:
 *
 *   marine: {
 *     troops:    ['marine_servitor', 'marine_space_marine'],
 *     buildings: ['marine_hq'],
 *     sections: {
 *       Infantry:     ['marine_servitor', 'marine_space_marine'],
 *       Building:     ['marine_hq'],
 *       Ability:      ['marine_battlecry'],
 *       Research:     ['marine_hq_addon_1'],
 *       WeaponUpgrade: ['marine_flamer'],
 *     },
 *   },
 *
 * ── Как привязать кнопку к команде ────────────────────────────────────────
 *
 * Кнопка — это позиция в массиве, команда — её содержимое. Строка в кавычках
 * разделяет место и кнопку, поэтому пустое место занимает правильную позицию и не
 * сдвигает остальные:
 *
 *   marine_hq: {
 *     command: ['', '', '', 'build', 'repair'],
 *     second:  ['marine_armoury', 'marine_chapel'],
 *     improvements: ['military_cycle', 'builder_cycle'],
 *   },
 *
 * Идентификатор команды — это то, что в файле биндингов стоит слева от знака
 * `=`. Значение клавиши интерфейс берёт из файла сам; вручную его задавать не
 * нужно. Значок тоже ищется сам по этому идентификатору: кнопка `marine_hq`
 * покажет `/hotkey-images/marine_hq.png`, и если файла нет — текст заглушки.
 *
 * Что в панели не описано, не показывается: никаких правил по умолчанию больше нет.
 *
 * ── Проверка ───────────────────────────────────────────────────────────────
 *
 *   node tools/layout.mjs check
 *   node tools/layout.mjs export
 */

/** Разделы, которые есть у фильтров. Того же порядка, что и вкладки. */
export type RosterSection =
  | 'Infantry'
  | 'Vehicle'
  | 'Building'
  | 'Ability'
  | 'Research'
  | 'WeaponUpgrade'
  | 'Addon'

/** Четыре столба на три строки — столько мест в игровой панели команд. */
export const PANEL_SLOTS = 12

/** Мест в панели улучшений: два столбца на четыре строки. */
export const IMPROVEMENT_SLOTS = 8

export interface FactionRoster {
  /** Плитки «Войска»: отряды и техника, доступные прямо на поле. */
  troops?: readonly string[]
  /** Плитки «Строения»: постройки расы. */
  buildings?: readonly string[]
  /** Содержимое остальных фильтров. */
  sections?: Partial<Record<RosterSection, readonly string[]>>
}

/**
 * Панели одной единицы. Позиция — индекс в массиве, начиная с нуля.
 * Пустая строка — пустое место, и оно остаётся на своей позиции.
 */
export interface UnitLayout {
  /** Основная панель команд. Не более PANEL_SLOTS мест. */
  command?: readonly (string | null | '')[]
  /** Вторая панель команд. Не более PANEL_SLOTS мест. */
  second?: readonly (string | null | '')[]
  /** Улучшения. Не более IMPROVEMENT_SLOTS мест. */
  improvements?: readonly (string | null | '')[]
}

/** Состав рас. Пока пусто — всё заполняется руками. */
export const FACTION_ROSTERS: Readonly<Partial<Record<FactionKey, FactionRoster>>> = {
  // marine: {
  //   troops: ['marine_servitor', 'marine_space_marine'],
  //   buildings: ['marine_hq'],
  //   sections: {
  //     Infantry: ['marine_servitor', 'marine_space_marine'],
  //     Building: ['marine_hq'],
  //   },
  // },
}

/** Панели юнитов и строений. Пока пусто — всё заполняется руками. */
export const UNIT_LAYOUTS: Readonly<Record<string, UnitLayout>> = {
  // marine_hq: {
  //   command: ['', '', '', 'build', 'repair'],
  //   second: ['marine_armoury', 'marine_chapel'],
  //   improvements: ['military_cycle', 'builder_cycle'],
  // },
}

export function rosterOf(faction: FactionKey | null): FactionRoster {
  return (faction && FACTION_ROSTERS[faction]) || {}
}