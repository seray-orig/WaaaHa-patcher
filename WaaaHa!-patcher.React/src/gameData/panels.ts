/**
 * Состав игровых панелей.
 *
 * В файле биндингов раздел TASKBAR COMMANDS идёт ровно в том порядке, в каком команды
 * стоят на панели в игре, поэтому порядок панели берём оттуда, а не выдумываем.
 *
 * Умения взяты со страниц юнитов на вики: там у каждого юнита свой раздел Abilities
 * с иконкой. Пассивные умения без хоткея (смертельный взрыв летающей машины, аура
 * лечения) в файле не имеют строки и сюда не попадают — назначать им нечего.
 */

/** Панель команды: четыре столба на три строки, как в игре. */
export const COMMAND_PANEL: readonly string[] = [
  'stop',
  'move',
  'attackmove',
  'attackmelee',
  'build',
  'buildadv',
  'attach',
  'attackground',
  'rally',
  'combatstance',
  'meleestance',
  'scuttle',
]

/**
 * Вторая панель. Основные команды кончились, дальше в таскбаре идут редкие:
 * высадка, усиление, прыжок, ремонт и прочие умения, у которых своя раса.
 */
export const SECOND_COMMAND_PANEL: readonly string[] = [
  'unload',
  'deepstrike',
  'reinforce',
  'leader',
  'jump',
  'infiltrate',
  'rampage',
  'repair',
  'possess',
  'relocate',
  'cannibalism',
  'possess_enemy',
]

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
]

/** Умение юнита: идентификаторы хоткеев, которые у него появляются в панели. */
export const UNIT_ABILITIES: Readonly<Record<string, readonly string[]>> = {
  // Постройка и ремонт у сервитора стоят не в улучшениях, а в самой панели команд —
  // так они и расположены в игре.
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
  marine_sergeant: ['marine_rally'],
  marine_rhino: ['marine_smoke_launchers'],
  marine_land_speeder: [],
  marine_tempest: [],
  marine_dreadnought: [],
  marine_dreadnought_hellfire: [],
  marine_predator: [],
  marine_whirlwind: [],
  marine_land_raider: ['marine_machine_spirit'],
}

export function abilitiesOf(unitId: string): readonly string[] {
  return UNIT_ABILITIES[unitId] ?? []
}
