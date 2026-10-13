/**
 * Справочник рас Dawn of War.
 *
 * Идентификаторы хоткеев приходят из файла биндингов, а вот деление войск на пехоту и
 * технику в файле отсутствует: в нём все войска лежат одной секцией. Список техники
 * собран со страниц фракций на вики и служит единственным источником этого знания.
 */

export type FactionKey =
  | 'marine'
  | 'chaos'
  | 'ork'
  | 'eldar'
  | 'tau'
  | 'necron'
  | 'guard'
  | 'dark_eldar'
  | 'sisters'

/** Порядок вкладок совпадает с порядком рас в игре. */
export const FACTIONS: readonly FactionKey[] = [
  'marine',
  'chaos',
  'ork',
  'eldar',
  'tau',
  'necron',
  'guard',
  'dark_eldar',
  'sisters',
]

/**
 * Техника и монстры по фракциям. Всё остальное из секции «TROOPERS FOR …» считается пехотой.
 */
export const VEHICLE_IDS: Record<FactionKey, readonly string[]> = {
  marine: [
    'marine_rhino',
    'marine_land_speeder',
    'marine_tempest',
    'marine_dreadnought',
    'marine_dreadnought_hellfire',
    'marine_predator',
    'marine_assault_cannon',
    'marine_whirlwind',
    'marine_land_raider',
  ],
  chaos: ['chaos_rhino', 'chaos_defiler', 'chaos_predator', 'chaos_hell_talon'],
  eldar: [
    'eldar_falcon_grav_tank',
    'eldar_vyper',
    'eldar_wraithlord',
    'eldar_nightwing',
    'eldar_grav_platform_laser',
    'eldar_grav_platform_brightlance',
    'eldar_bright_lance',
    'eldar_fire_prism',
  ],
  ork: [
    'ork_trukk',
    'ork_wartrak',
    'ork_killa_kan',
    'ork_fighta_bomma',
    'ork_looted_tank',
    'ork_squiggoth',
  ],
  guard: [
    'guard_chimera',
    'guard_sentinel',
    'guard_hellhound',
    'guard_basilisk',
    'guard_marauder',
    'guard_leman_russ',
    'guard_baneblade',
  ],
  tau: [
    'tau_devilfish_carrier',
    'tau_skyray',
    'tau_drone_squad',
    'tau_drone_harbinger',
    'tau_barracuda',
    'tau_hammerhead',
    'tau_krootox',
    'tau_greater_knarloc',
    'tau_broadside_battlesuit',
    'tau_vespid_auxiliary',
    'tau_attack_drone',
    'tau_centaur_auxiliary',
    'tau_energy_auxiliary',
    'tau_glob_auxiliary',
    'tau_crisis_suit',
  ],
  necron: [
    'necron_tomb_spyder',
    'necron_attack_scarab',
    'necron_destroyer',
    'necron_heavy_destroyer',
    'necron_lord_destroyer',
    'necron_restored_monolith',
  ],
  dark_eldar: [
    'dark_eldar_reaver',
    'dark_eldar_raider',
    'dark_eldar_talos',
    'dark_eldar_ravager',
    'dark_eldar_dais',
    'dark_eldar_raven',
  ],
  sisters: [
    'sisters_rhino',
    'sisters_immolator_tank',
    'sisters_lightning',
    'sisters_exorcist_tank',
    'sisters_penitent_engine',
  ],
}

/**
 * Постройки, которые производят войска. Именно у них в игре появляется команда
 * «Построить», и именно они открывают список построек расы.
 */
export const BUILDER_IDS: Record<FactionKey, readonly string[]> = {
  marine: ['marine_armoury', 'marine_chapel', 'marine_machine_cult'],
  chaos: ['chaos_armoury', 'chaos_temple', 'chaos_machine_pit'],
  ork: ['ork_boy_hut', 'ork_mek_shop', 'ork_pile_o_guns'],
  eldar: ['eldar_aspect_portal', 'eldar_soul_shrine', 'eldar_webway_gate'],
  tau: ['tau_barracks', 'tau_kroot_nest', 'tau_research_building', 'tau_vehicle_building'],
  necron: ['necron_summoning_core', 'necron_forbidden_archive', 'necron_greater_summoning_core'],
  guard: ['guard_infantry', 'guard_mechanized_command', 'guard_mars_command', 'guard_tactica'],
  dark_eldar: [
    'dark_eldar_hall_of_blood',
    'dark_eldar_dark_foundry',
    'dark_eldar_haemonculus_laboratory',
  ],
  sisters: ['sisters_infantry', 'sisters_vehicle_building', 'sisters_sanctuary'],
}

/** Команды, доступные любой выделенной на поле единице. */
export const SELECT_COMMANDS = ['move', 'stop', 'attackmove', 'attackmelee'] as const

/** Допечитывание пехоты: у отрядов можно вызвать подкрепление. */
export const INFANTRY_COMMANDS = ['reinforce'] as const

/** Команды строителя: построить и починить, плюс список построек расы. */
export const BUILDER_COMMANDS = ['build', 'repair'] as const

export function isVehicle(faction: FactionKey, id: string): boolean {
  return VEHICLE_IDS[faction].includes(id)
}

export function isBuilder(faction: FactionKey, id: string): boolean {
  return BUILDER_IDS[faction].includes(id)
}