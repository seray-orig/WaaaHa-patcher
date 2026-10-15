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
 * ── Одна команда, два значка ───────────────────────────────────────────────
 *
 * У части команд в игре по картинке на контекст: отмена постройки и выход из
 * меню рисуются по-разному, а хоткей один — `escape`. Переименовать значок, не
 * сломав команду, нельзя, поэтому пишется имя картинки, а команда берётся из
 * таблицы COMMAND_ALIASES в этом же файле.
 *
 *   command: ['', 'escape2'],
 *
 * Плитка покажет и покажет клавишу команды `escape`, но значок возьмёт из
 * `escape2.png`. Клик запишет клавишу в `escape` — так и надо, в файле игры одна
 * строка.
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

/** Состав рас. */
export const FACTION_ROSTERS: Readonly<Partial<Record<FactionKey, FactionRoster>>> = {
   marine: {
     troops: ['marine_servitor', 'marine_space_marine'],
     buildings: ['marine_hq'],
     sections: {
       Infantry: ['marine_servitor', 'marine_space_marine'],
       Building: ['marine_hq'],
     },
   },
}

/** Панели юнитов и строений.
 * 
 * marine_servitor: {
    command: ['move', 'stop', 'attackmove', 'attackmelee'],
    second: ['',],
    improvements: ['',],
  },
*/
export const UNIT_LAYOUTS: Readonly<Record<string, UnitLayout>> = {
  marine_servitor: {
    command: ['move', 'stop', '', '', 'build', 'repair'],
    second: ['marine_hq', 'marine_chapel', 'marine_listening_post', 'marine_generator',
             'marine_armoury', 'marine_machine_cult', 'marine_artefact', 'marine_thermo_generator',
             'marine_bolter_turret', 'marine_mine_field', 'marine_orbital_relay', 'escape'],
    improvements: ['',],
  },
  marine_hq: {
    command: ['marine_servitor', 'marine_scout', 'marine_chaplain', '',
              'marine_squad_cap_research', 'marine_vehicle_cap_research', '', '',
              'marine_hq_addon_1', 'marine_skull_probe_infiltration_research', 'marine_scout_infiltration_research', 'marine_sniper_rifle_research'],
    second: ['', '', '', '',
             '', '', '', '',
             'marine_hq_addon_2'],
    improvements: ['rally'],
  },
}

export function rosterOf(faction: FactionKey | null): FactionRoster {
  return (faction && FACTION_ROSTERS[faction]) || {}
}

/**
 * Значки, у которых команда одна, а картинок две.
 *
 * В игре отмена постройки и выход из меню рисуются по-разному, но хоткей у них
 * общий — `escape`. Переименовать значок, не сломав команду, иначе нельзя, и в
 * раскладке приходится писать имя значка.
 *
 * Ключ — имя значка в `hotkey-images`, значение — команда из файла биндингов.
 * Клавиша, которую покажет плитка и которую назначит клик, будет из значения.
 */
export const COMMAND_ALIASES: Readonly<Record<string, string>> = {
  escape2: 'escape',
}

/** Настоящая команда за именем из раскладки: само имя либо то, на что оно указывает. */
export function commandOf(id: string): string {
  return COMMAND_ALIASES[id] ?? id
}
