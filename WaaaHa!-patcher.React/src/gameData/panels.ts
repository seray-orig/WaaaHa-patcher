import type { FactionKey } from './factions'

/**
 * Состав игровых панелей.
 *
 * В файле биндингов раздел TASKBAR COMMANDS идёт ровно в том порядке, в каком команды
 * стоят на панели в игре, поэтому порядок панели берём оттуда, а не выдумываем.
 *
 * Умения и выдаваемое оружие сняты со страниц юнитов на вики: там у каждого юнита
 * свой раздел Abilities с иконкой. Пассивные умения без хоткея (смертельный взрыв
 * летающей машины, аура лечения) в файле не имеют строки и сюда не попадают —
 * назначать им нечего.
 */

/** Четыре столба на три строки — столько мест в игровой панели. */
export const PANEL_SLOTS = 12

/** Мест в панели улучшений: два столбца на четыре строки. */
export const IMPROVEMENT_SLOTS = 8

/** Общие команды есть у всего, что можно выделить на поле. */
export const SHARED_COMMANDS = ['stop', 'move', 'attackmove', 'attackmelee'] as const

/** Ремонт нужен строящему, и стоит он в основной панели, а не во второй. */
export const BUILDER_COMMANDS = ['build', 'repair'] as const

/** Панель здания: построить, починить, поставить точку сбора и задать режим выхода. */
export const BUILDING_COMMANDS = ['build', 'repair', 'rally'] as const

/** Режимы выхода войск из здания. В классической раскладке стоят на F1, F2, F3. */
export const BUILDING_EXIT_MODES = [
  'military_cycle',
  'builder_cycle',
  'hq_cycle',
  'research_cycle',
] as const

/** Умения, которые игра прячет у расы, а не у юнита. */
export const FACTION_COMMANDS: readonly string[] = [
  'fear',
  'tau_snare_trap',
  'tau_holographic_projection',
  'direct_spawn',
  'necron_stasis_field',
  'necron_nightmare_shroud',
  'entrench',
  'burrow',
  'lightning_field',
  'direct_spawn_rally',
  'melee_dance',
  'harvest',
  'jump',
  'infiltrate',
  'unload',
  'possess',
]

/**
 * Редкие команды умеют быть у нескольких рас, поэтому сверяемся с набором.
 * Например, «зарыться» есть только у орков, а «укрепиться» — у гвардии, тау и некронов.
 */
const RARE_COMMANDS: Readonly<Record<string, readonly FactionKey[]>> = {
  fear: ['chaos', 'guard', 'sisters', 'dark_eldar'],
  entrench: ['guard', 'tau', 'necron'],
  burrow: ['ork'],
  possess: ['chaos'],
  possess_enemy: ['chaos', 'necron'],
  relocate: ['eldar', 'dark_eldar'],
  cannibalism: ['ork'],
  harvest: ['necron'],
  melee_dance: ['eldar'],
  lightning_field: ['necron'],
  necron_stasis_field: ['necron'],
  necron_nightmare_shroud: ['necron'],
  direct_spawn: ['necron'],
  direct_spawn_rally: ['necron'],
  tau_snare_trap: ['tau'],
  tau_holographic_projection: ['tau'],
  jump: ['tau', 'eldar', 'dark_eldar', 'ork', 'guard', 'necron', 'sisters'],
  infiltrate: ['marine'],
  unload: ['marine', 'chaos', 'guard', 'tau', 'eldar', 'dark_eldar'],
}

export function isFactionCommand(id: string, faction: FactionKey): boolean {
  return RARE_COMMANDS[id]?.includes(faction) ?? false
}

/**
 * Умения юнита — они стоят в самой панели команд, как в игре.
 * Даже те, что требуют грейда: в бою кнопка всё равно есть, просто затемняется.
 */
export const UNIT_ABILITIES: Readonly<Record<string, readonly string[]>> = {
  // Постройка и ремонт у сервитора стоят не здесь, а в самой панели команд.
  marine_servitor: [],
  marine_scout: [],
  marine_space_marine: ['marine_frag_grenades'],
  marine_assault_marine: ['marine_melta_bombs'],
  marine_grey_knights: ['marine_furious_charge_research', 'marine_inquisition'],
  marine_terminator: [],
  marine_assault_terminator: [],
  marine_skull_probe: ['marine_sabotage'],
  marine_apothecary: [],
  marine_force_commander: ['marine_battlecry', 'marine_orbital_bombardment'],
  marine_librarian: ['marine_smite', 'marine_weaken_resolve', 'marine_word_of_emperer'],
  marine_chaplain: ['marine_demoralize'],
  marine_rhino: ['marine_smoke_launchers'],
  marine_land_speeder: [],
  marine_tempest: [],
  marine_dreadnought: [],
  marine_dreadnought_hellfire: [],
  marine_predator: [],
  marine_whirlwind: [],
  marine_land_raider: ['marine_machine_spirit'],
}

/**
 * Оружие, которое выдаётся отряду на месте, — огнемёт, тяжёлый болтер и прочее.
 * Это не грейды: их берут в оружейне, а эти выдаёт сама армия, и в панели улучшений
 * они стоят отдельными кнопками.
 */
export const UNIT_WEAPONS: Readonly<Record<string, readonly string[]>> = {
  marine_servitor: ['marine_power_fist', 'marine_power_halberd', 'marine_plasma_pistol'],
  marine_scout: ['marine_flamer', 'marine_plasma_gun', 'marine_sniper_rifle'],
  marine_space_marine: [
    'marine_flamer',
    'marine_plasma_gun',
    'marine_heavy_bolter',
    'marine_missile_launcher',
  ],
  marine_assault_marine: [
    'marine_flamer',
    'marine_power_halberd',
    'marine_heavy_bolter',
    'marine_plasma_pistol',
    'marine_missile_launcher',
  ],
  marine_grey_knights: ['marine_flamer', 'marine_power_halberd', 'marine_missile_launcher'],
  marine_terminator: ['marine_heavy_flamer', 'marine_assault_cannon', 'marine_power_fist'],
  marine_assault_terminator: [
    'marine_heavy_flamer',
    'marine_assault_cannon',
    'marine_power_fist',
  ],
  marine_dreadnought: ['marine_assault_cannon', 'marine_lascannon_twin'],
  marine_dreadnought_hellfire: ['marine_lascannon_twin'],
  marine_predator: ['marine_lascannon_twin', 'marine_lascannon_2'],
  marine_tempest: ['marine_missile_frag', 'marine_missile_krak'],
  marine_land_raider: [],
}

/**
 * Сержант, которого можно добавить в отряд. В списке войск его нет: он не покупается,
 * а выдаётся на месте, и кнопка его добавления живёт в панели улучшений.
 */
export const FACTION_SERGEANT: Partial<Record<FactionKey, string>> = {
  marine: 'marine_sergeant',
}

/**
 * Отряды, в которые сержанта добавить можно. Не всякая пехота — отряд: сервитор и
 * черепная мина в отряд не собираются, а библиотекарь обходится без сержанта.
 */
export const SERGEANT_HOSTS: Readonly<Record<string, true>> = {
  marine_scout: true,
  marine_space_marine: true,
  marine_assault_marine: true,
  marine_grey_knights: true,
  marine_terminator: true,
  marine_assault_terminator: true,
  marine_force_commander: true,
}

export function abilitiesOf(unitId: string): readonly string[] {
  return UNIT_ABILITIES[unitId] ?? []
}

export function weaponsOf(unitId: string): readonly string[] {
  return UNIT_WEAPONS[unitId] ?? []
}
