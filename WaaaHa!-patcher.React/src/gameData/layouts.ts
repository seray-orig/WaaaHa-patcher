import type { TranslationKey } from '../i18n/dictionaries'
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
 * ── Внутренние кнопки ─────────────────────────────────────────────────────
 *
 * Режимы войск в игре всегда стоят на одной позиции и переключаются нажатием
 * на ту же кнопку, то есть настоящей клавиши за ними нет. Прописывать их в
 * панели бессмысленно — настраивать их нужно в фильтре «Панель команд», где они
 * и живут по умолчанию.
 *
 * Чтобы это было видно прямо в раскладке, вместо команды пишется имя внутренней
 * кнопки:
 *
 *   command: ['move', 'stop', '@panel'],
 *
 * Покажется серая плитка с подписью «Панель команд» — она ничего не назначает и
 * в файл не попадает. Новых внутренних кнопок добавляется строкой в
 * INTERNAL_BUTTONS: имя, картинка и ключ подписи.
 *
 * ── Фильтры «Все» и «Остальное» ───────────────────────────────────────────
 *
 * Эти два фильтра делят файл надвое, и пересчитываются сами при каждой сборке:
 * описал команду в раскладке — ушла из «Остального» и появилась во «Все»;
 * убрал — вернулась. Никаких правил по умолчанию, только сам факт упоминания.
 *
 * «Все» показывает описанное, «Остальное» — неописанное. Второй и есть рабочий
 * инструмент: там кампании, внутренние хоткеи игры и то, что автор забыл.
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

/**
 * Внутренние кнопки: команды за настоящими хоткеями нет.
 *
 * Режимы войск в игре всегда стоят на одном месте и переключаются нажатием, то
 * есть клавиша у них не настоящая: в панели юнита такую кнопку настраивать
 * бессмысленно. Но игрок об этом не знает и тратит время, прописывая `stance_*`.
 *
 * Поэтому в раскладке вместо команды пишется имя такой кнопки — и редактор
 * показывает серую плитку с подписью, в какой фильтр идти за её настройкой.
 * В файл такие кнопки не попадают: это подсказка, а не привязка.
 */
export interface InternalButton {
  /** Имя картинки в hotkey-images: рисуется серая, она ничего не назначает. */
  icon: string
  /** Ключ локализации с подписью по центру плитки. */
  hint: TranslationKey
}

export const INTERNAL_BUTTONS: Readonly<Record<string, InternalButton>> = {
  '@panel': { icon: 'stance_hold', hint: 'editor.internalPanel' },
}

/** Внутренняя кнопка, а не команда: её нельзя ни показать, ни записать в файл. */
export function isInternalButton(id: string): boolean {
  return id in INTERNAL_BUTTONS
}

/**
 * Команды, которым зависимости уже прописаны где-то в раскладке.
 *
 * Собирается один раз при загрузке: раскладка описана руками и до перезагрузки
 * страницы не меняется.
 */
const DESCRIBED: ReadonlySet<string> = collectDescribed()

function collectDescribed(): Set<string> {
  const ids = new Set<string>()

  const take = (list: readonly (string | null | '')[] | undefined) => {
    list?.forEach((id) => {
      // Внутренние кнопки командами не являются: за ними в файле ничего нет,
      // и в «Все» они попадать не должны.
      if (id && !isInternalButton(id)) {
        ids.add(id)
      }
    })
  }

  Object.values(FACTION_ROSTERS).forEach((roster) => {
    take(roster?.troops)
    take(roster?.buildings)
    Object.values(roster?.sections ?? {}).forEach(take)
  })

  Object.entries(UNIT_LAYOUTS).forEach(([unit, layout]) => {
    if (!isInternalButton(unit)) {
      ids.add(unit)
    }

    take(layout.command)
    take(layout.second)
    take(layout.improvements)
  })

  return ids
}

/** Упомянута ли команда где-нибудь в раскладке — от этого зависит её фильтр. */
export function isDescribed(id: string): boolean {
  return DESCRIBED.has(id)
}

/**
 * Разделяет файл надвое: описанное раскладкой и неописанное.
 *
 * «Все» и «Остальное» — это ровно эти две половины, и перехода между ними не
 * надо делать руками: прописал команду хоть в одном юните хоть в чужой расе, и
 * она ушла из «Остального» сама. Обратно тоже: убрал из раскладки — вернулась.
 *
 * Порядок файла сохраняется, чтобы плитки не прыгали при переключении фильтра.
 */
export function splitByDescribed<T extends { id: string }>(all: readonly T[]): {
  described: T[]
  other: T[]
} {
  const described: T[] = []
  const other: T[] = []

  for (const entry of all) {
    if (isDescribed(entry.id)) {
      described.push(entry)
    } else {
      other.push(entry)
    }
  }

  return { described, other }
}
