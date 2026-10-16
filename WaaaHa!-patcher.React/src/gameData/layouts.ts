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
 * В FACTION_ROSTERS ключ — фракция, значение — разделы. Раздел читается сверху
 * вниз, и это же порядок показывается на экране:
 *
 *   marine: {
 *     sections: {
 *       Infantry:     ['marine_servitor', 'marine_space_marine'],
 *       Vehicle:      ['marine_rhino'],
 *       Building:     ['marine_hq'],
 *       Ability:      ['marine_battlecry'],
 *       Research:     ['marine_hq_addon_1'],
 *       WeaponUpgrade: ['marine_flamer'],
 *     },
 *   },
 *
 * Отдельных списков «Войска» и «Строения» нет, и писать их не нужно: левая
 * колонка сетки берёт «Войска» из Infantry с Vehicle, а «Строения» из Building.
 * Перечислять юнита дважды незачем — списки разъезжаются, и юнит пропадает с
 * одной из сторон молча.
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
 * Покажется приглушённая плитка со значком stance_hold и подписью «Панель
 * команд» — она ничего не назначает и
 * в файл не попадает. Новых внутренних кнопок добавляется строкой в
 * INTERNAL_BUTTONS: имя, картинка и ключ подписи.
 *
 * ── Фильтр «Панель команд» ───────────────────────────────────────────────
 *
 * Команды самой игровой панели — движение, атака, постройка, режимы. В
 * FACTION_ROSTERS им не место: там всё, что принадлежит конкретной расе, а у
 * этих команд префикс не фракционный. Список свой, в PANEL_COMMANDS, и
 * добавляется руками — по одному идентификатору в строке:
 *
 *   export const PANEL_COMMANDS: readonly string[] = [
 *     'move',
 *     'stop',
 *   ]
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

/** Разделы в том порядке, в каком они идут на экране. */
export const ROSTER_SECTIONS: readonly RosterSection[] = [
  'Infantry',
  'Vehicle',
  'Building',
  'Ability',
  'Research',
  'WeaponUpgrade',
  'Addon',
]

/** Четыре столба на три строки — столько мест в игровой панели команд. */
export const PANEL_SLOTS = 12

/** Мест в панели улучшений: два столбца на четыре строки. */
export const IMPROVEMENT_SLOTS = 8

/**
 * Состав расы — только разделы.
 *
 * Отдельных списков «Войска» и «Строения» нет и быть не должно: они выводятся
 * из Infantry с Vehicle и из Building. Списка два — значит юнит пришлось бы
 * переписывать дважды, и рано или поздно в одном из них он осел бы один.
 */
export interface FactionRoster {
  /** Содержимое фильтров. Из них же собираются «Войска» и «Строения» в сетке. */
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

/**
 * Содержимое фильтра «Панель команд».
 *
 * Это те команды, которые в игре висят на самой панели, а не внутри панели
 * конкретного юнита: движение, атака, постройка, режимы. Их нельзя положить в
 * FACTION_ROSTERS — там всё, что принадлежит конкретной расе, и префиксы у
 * таких команд не фракционные.
 *
 * Добавляется руками, по одному идентификатору в строке, в любом порядке:
 *
 *   export const PANEL_COMMANDS: readonly string[] = [
 *     'move',
 *     'stop',
 *   ]
 *
 * Проверить, что команда есть в файле игры:
 *
 *   node tools/layout.mjs check
 *
 * Порядок ни на что не влияет — в фильтре плитки идут в порядке файла, как и
 * везде. Перечисленное здесь считается описанным и потому уходит из
 * «Остального» и появляется во «Все».
 *
 * Чтобы развести кнопки по рядам вручную, поставь между ними PANEL_ROW_BREAK:
 *
 *   export const PANEL_COMMANDS: readonly string[] = [
 *     'stance_attack', 'stance_hold', 'stance_stand_ground', PANEL_ROW_BREAK,
 *     'move', 'stop', 'attackmove',
 *   ]
 *
 * Сам разделитель в файле игры не окажется и в «Остальном» не посчитается
 * командой: это только разрыв ряда на экране.
 */
export const PANEL_ROW_BREAK = '|'

export const PANEL_COMMANDS: readonly string[] = [
  'stance_hold', 'stance_stand_ground', 'stance_burn', 'stance_cease_fire', 'stance_attack', PANEL_ROW_BREAK,
  'melee_stance_assault', 'melee_stance_ranged', 'meleestance', 'combatstance', 'attack', 'attackground', PANEL_ROW_BREAK,
  'move', 'stop', 'attackmove', 'attackmelee', 'build', 'repair', 'rally', 'escape', 'cancelconstruction', 'scuttle', PANEL_ROW_BREAK,
  'attach', 'detach',
  'builder_cycle',
  'hq_cycle',
  'military_cycle',
  'research_cycle',
  
  'jump', 'teleport',
  'reinforce',
  'unload',
  
  'cancel_overwatch',
  'toggle_overwatch',
]

/** Состав рас. */
export const FACTION_ROSTERS: Readonly<Partial<Record<FactionKey, FactionRoster>>> = {
   marine: {
     sections: {
      Infantry: [
        'marine_servitor', 'marine_scout', 'marine_skull_probe', 'marine_space_marine', 'marine_assault_marine', 'marine_force_commander',
        'marine_chaplain', 'marine_librarian', 'marine_grey_knights', 'marine_terminator', 'marine_assault_terminator'
      ],
      Vehicle: [
        'marine_rhino', 'marine_land_speeder', 'marine_dreadnought', 'marine_dreadnought_hellfire', 'marine_tempest',
        'marine_predator', 'marine_whirlwind', 'marine_land_raider'
      ],
      Building: [
        'marine_hq', 'marine_chapel', 'marine_listening_post', 'marine_generator',
        'marine_armoury', 'marine_machine_cult', 'marine_artefact', 'marine_thermo_generator',
        'marine_bolter_turret', 'marine_mine_field', 'marine_orbital_relay'
      ],
      Ability: [
        'marine_sabotage', 'marine_frag_grenades', 'jump', 'teleport', 'marine_rally', 'marine_melta_bombs', 'marine_demoralize',
        'marine_smite', 'marine_weaken_resolve', 'marine_inquisition', 'marine_smoke_launchers', 'marine_word_of_emperer',
        'marine_battlecry', 'marine_orbital_bombardment', 'marine_machine_spirit'
      ],
      Research: [
        'marine_squad_cap_research', 'marine_vehicle_cap_research', 'marine_sniper_rifle_research', 'marine_health_research_1', 'marine_health_research_2',
        'marine_accuracy_research_1', 'marine_accuracy_research_2', 'marine_power_swords_research', 'marine_sergeant_melee_research_2',
        'marine_scout_infiltration_research', 'marine_smoke_launcher_research', 'marine_skull_probe_infiltration_research', 'marine_melta_bomb_research',
        'marine_furious_charge_research', 'marine_frag_grenade_research', 
      ],
      WeaponUpgrade: [

      ],
      Addon: [

      ],
     },
   },
}

/** Панели юнитов и строений.
 * 
 * marine_servitor: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee'
    ],
    second: [''],
    improvements: ['']
  },
*/
export const UNIT_LAYOUTS: Readonly<Record<string, UnitLayout>> = {
  marine_servitor: {
    command: ['move', 'stop', '', '', 'build', 'repair'],
    second: [
      'marine_hq', 'marine_chapel', 'marine_listening_post', 'marine_generator',
      'marine_armoury', 'marine_machine_cult', 'marine_artefact', 'marine_thermo_generator',
      'marine_bolter_turret', 'marine_mine_field', 'marine_orbital_relay', 'escape'
    ],
    improvements: ['']
  },

  marine_scout: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun'
    ],
    second: ['',],
    improvements: [
      'reinforce', '',
      'marine_flamer', 'marine_sniper_rifle',
      'marine_plasma_gun'
    ]
  },

  marine_skull_probe: {
    command: [
      'move', 'stop', '', '',
      '', '', '', '',
      'marine_sabotage'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  marine_space_marine: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'marine_frag_grenades', 'marine_rally', '@panel_yellow', '@panel_gun'
    ],
    second: [''],
    improvements: [
      'reinforce', 'marine_sergeant',
      'marine_flamer', 'marine_heavy_bolter',
      'marine_plasma_gun', 'marine_missile_launcher'
    ]
  },

  marine_assault_marine: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', 'marine_rally', '@panel_yellow', '@panel_melee',
      'marine_melta_bombs', '', '', 'jump'
    ],
    second: [''],
    improvements: ['reinforce', 'marine_sergeant']
  },

  marine_force_commander: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee',
      'marine_battlecry', 'marine_orbital_bombardment'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  marine_chaplain: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee',
      'marine_demoralize'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  marine_librarian: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee',
      'marine_smite', 'marine_weaken_resolve', 'marine_word_of_emperer'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  marine_grey_knights: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'marine_inquisition', '', '@panel_yellow', '@panel_melee'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  marine_terminator: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun'
    ],
    second: [''],
    improvements: [
      'reinforce', '',
      'marine_heavy_flamer', 'marine_assault_cannon'
    ]
  },

  marine_assault_terminator: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  marine_rhino: {
    command: [
      'move', 'stop', '', '',
      '', 'unload', '', '',
      'marine_smoke_launchers'
    ],
    second: [''],
    improvements: ['']
  },

  marine_land_speeder: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', '', '@panel_yellow', '',
      '', '', '', 'jump'
    ],
    second: [''],
    improvements: ['']
  },

  marine_dreadnought: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee'
    ],
    second: [''],
    improvements: [
      '', '',
      'marine_dreadnought_assault_cannon', 'marine_dreadnought_lascannon_twin'
    ]
  },

  marine_dreadnought_hellfire: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', '', '@panel_yellow'
    ],
    second: [''],
    improvements: ['']
  },

  marine_tempest: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', 'attackground', '@panel_yellow'
    ],
    second: [''],
    improvements: [
      '', '',
      'marine_missile_frag', 'marine_missile_krak'
    ]
  },

  marine_predator: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', '', '@panel_yellow'
    ],
    second: [''],
    improvements: [
      '', '',
      'marine_lascannon_twin', 'marine_lascannon_1',
      'marine_lascannon_2'
    ]
  },

  marine_whirlwind: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', 'attackground', '@panel_yellow'
    ],
    second: [''],
    improvements: ['']
  },

  marine_land_raider: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', 'unload', '@panel_yellow', '',
      'marine_machine_spirit'
    ],
    second: [''],
    improvements: ['']
  },

  marine_hq: {
    command: [
      'marine_servitor', 'marine_scout', 'marine_chaplain', '',
      'marine_squad_cap_research', 'marine_vehicle_cap_research', '', '',
      'marine_hq_addon_1', 'marine_skull_probe_infiltration_research', 'marine_scout_infiltration_research', 'marine_sniper_rifle_research'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'marine_hq_addon_2'
    ],
    improvements: ['rally', '@panel_yellow']
  },

  marine_chapel: {
    command: [
      'marine_space_marine', 'marine_assault_marine', 'marine_terminator', 'marine_assault_terminator',
      'marine_force_commander', 'marine_grey_knights', '', '',
      'marine_frag_grenade_research', 'marine_melta_bomb_research'
    ],
    second: [''],
    improvements: [
      'rally', '@panel_yellow',
      'deepstrike'
    ]
  },

  marine_listening_post: {
    command: [
      'marine_listening_post_1', '', '', '',
      'marine_requisition_research_1', '', '', '',
      'marine_skull_probe'
    ],
    second: [
      '', 'marine_listening_post_2', '', '',
      'marine_requisition_research_2'
    ],
    improvements: [
      'rally', '@panel_yellow',
      '', 'attack'
    ]
  },

  marine_generator: {
    command: ['marine_power_research_1'],
    second: ['marine_power_research_2'],
    improvements: ['']
  },

  marine_armoury: {
    command: [
      'marine_max_weapons_research', 'marine_furious_charge_research', '', '',
      'marine_health_research_1', 'marine_accuracy_research_1', '', '',
      'marine_power_swords_research', 'marine_sergeant_ranged_research'
    ],
    second: [
      '', '', '', '',
      'marine_health_research_2', 'marine_accuracy_research_2', '', '',
      'marine_sergeant_melee_research_2'
    ],
    improvements: ['']
  },

  marine_machine_cult: {
    command: [
      'marine_rhino', 'marine_land_speeder', 'marine_dreadnought', 'marine_dreadnought_hellfire',
      'marine_tempest', 'marine_whirlwind', 'marine_predator', 'marine_land_raider',
      'marine_heavy_armor_deployment', 'marine_smoke_launcher_research'
    ],
    second: [''],
    improvements: ['rally', '@panel_yellow']
  },

  marine_artefact: {
    command: [
      'marine_apothecary', 'marine_librarian', '', '',
      'marine_commander_health_research_1', 'marine_librarian_research_2', '', '',
      'marine_force_commander_research_1', 'marine_librarian_research_1'
    ],
    second: [
      '', '', '', '',
      'marine_commander_health_research_2', '', '', '',
      'marine_force_commander_research_2'
    ],
    improvements: ['rally', '@panel_yellow']
  },

  marine_thermo_generator: {
    command: [
      '', '', '', '',
      '', '', '', '',
      '', '', '', 'scuttle'
    ],
    second: [''],
    improvements: ['']
  },

  marine_bolter_turret: {
    command: ['marine_missile_launcher_turret'],
    second: [''],
    improvements: [
      '', '',
      '', 'attack'
    ]
  },

  marine_mine_field: {
    command: [
      '', '', '', '',
      '', '', '', '',
      '', '', '', 'scuttle'
    ],
    second: [''],
    improvements: ['']
  },

  marine_orbital_relay: {
    command: [
      'marine_space_marine', '', 'marine_dreadnought', 'marine_dreadnought_hellfire',
      '', '', '', '',
      'marine_personalteleporter_research'
    ],
    second: [''],
    improvements: [
      '', '@panel_yellow',
      'deepstrike'
    ]
  },

}

export function rosterOf(faction: FactionKey | null): FactionRoster {
  return (faction && FACTION_ROSTERS[faction]) || {}
}

/**
 * Плитки «Войска» в сетке: всё, что выбирается на поле, — пехота и техника.
 *
 * Порядок разделов повторяет игровую панель: сперва пехота, потом техника.
 */
export function troopsOf(roster: FactionRoster): readonly string[] {
  return [
    ...(roster.sections?.Infantry ?? []),
    ...(roster.sections?.Vehicle ?? []),
  ]
}

/** Плитки «Строения» в сетке: постройки расы. */
export function buildingsOf(roster: FactionRoster): readonly string[] {
  return roster.sections?.Building ?? []
}

/** Всё, чем набрана раса, в порядке разделов — так наполняется фильтр «Фракция». */
export function rosterEntries(roster: FactionRoster): readonly string[] {
  return ROSTER_SECTIONS.flatMap((section) => roster.sections?.[section] ?? [])
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
  teleport: 'jump',
  detach: 'attach',
  marine_dreadnought_assault_cannon: 'marine_assault_cannon',
  marine_lascannon_2: 'marine_lascannon_1',
  marine_dreadnought_lascannon_twin: 'marine_lascannon_twin'
}

/** Настоящая команда за именем из раскладки: само имя либо то, на что оно указывает. */
export function commandOf(id: string): string {
  return COMMAND_ALIASES[id] ?? id
}

/** Команда ли это имя, а не разрыв ряда и не внутренняя кнопка. */
export function isCommandName(id: string): boolean {
  return id !== PANEL_ROW_BREAK && !isInternalButton(id)
}

/** Разбивает список панели команд на ряды: разделитель начинает новый ряд. */
export function panelCommandRows(): readonly (readonly string[])[] {
  const rows: string[][] = [[]]

  for (const id of PANEL_COMMANDS) {
    if (id === PANEL_ROW_BREAK) {
      if (rows[rows.length - 1].length > 0) {
        rows.push([])
      }

      continue
    }

    rows[rows.length - 1].push(id)
  }

  return rows.filter((row) => row.length > 0)
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
  /** Имя картинки в hotkey-images: рисуется приглушённой, она ничего не назначает. */
  icon: string
  /** Ключ локализации с подписью по центру плитки. */
  hint: TranslationKey
}

export const INTERNAL_BUTTONS: Readonly<Record<string, InternalButton>> = {
  '@panel_red': { icon: 'stance_attack', hint: 'editor.internalPanel' },
  '@panel_yellow': { icon: 'stance_hold', hint: 'editor.internalPanel' },
  '@panel_gun': { icon: 'melee_stance_ranged', hint: 'editor.internalPanel' },
  '@panel_melee': { icon: 'melee_stance_assault', hint: 'editor.internalPanel' },
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
      if (id && isCommandName(id)) {
        ids.add(id)
      }
    })
  }

  PANEL_COMMANDS.forEach((id) => {
    if (isCommandName(id)) {
      ids.add(id)
    }
  })

  Object.values(FACTION_ROSTERS).forEach((roster) => {
    Object.values(roster?.sections ?? {}).forEach(take)
  })

  Object.entries(UNIT_LAYOUTS).forEach(([unit, layout]) => {
    if (isCommandName(unit)) {
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
