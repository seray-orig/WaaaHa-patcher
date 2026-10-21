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
 * Ключ	Фракция
*   marine	Космодесант
*   chaos	Хаос
*   ork	Орки
*   eldar	Эльдары
*   tau	Тау
*   necron	Некроны
*   guard	Имперская гвардия
*   dark_eldar	Тёмные эльдары
*   sisters	Сестры битвы
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
  'move', 'stop', 'attackmove', 'attackmelee', 'build', 'repair', 'rally', 'escape', 'escape2', 'cancelconstruction', 'scuttle', PANEL_ROW_BREAK,
  'attach', 'detach',
  'builder_cycle',
  'hq_cycle',
  'military_cycle',
  'research_cycle',
  
  'jump', 'teleport',
  'reinforce',
  'unload',
  
  'cancel_overwatch',
  'toggle_overwatch', PANEL_ROW_BREAK,
  'camera_panleft', 'camera_panright', 'camera_panup', 'camera_pandown', 'camera_rotate', 'camera_defaultcam',
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
        'marine_requisition_research_1', 'marine_requisition_research_2', 'marine_power_research_1', 'marine_power_research_2',
        'marine_squad_cap_research', 'marine_vehicle_cap_research', 'marine_sniper_rifle_research', 'marine_health_research_1', 'marine_health_research_2',
        'marine_accuracy_research_1', 'marine_accuracy_research_2', 'marine_power_swords_research', 'marine_sergeant_melee_research_2',
        'marine_scout_infiltration_research', 'marine_smoke_launcher_research', 'marine_skull_probe_infiltration_research', 'marine_melta_bomb_research',
        'marine_furious_charge_research', 'marine_frag_grenade_research', 'marine_sergeant_ranged_research',
        'marine_commander_health_research_1', 'marine_commander_health_research_2', 'marine_librarian_research_1', 'marine_librarian_research_2',
        'marine_librarian_research_2_w40k', 'marine_force_commander_research_1', 'marine_force_commander_research_2', 'marine_personalteleporter_research'
      ],
      WeaponUpgrade: [
        'marine_flamer', 'marine_heavy_bolter', 'marine_sniper_rifle', 'marine_plasma_gun', 'marine_missile_launcher',
        'marine_heavy_flamer', 'marine_assault_cannon', 'marine_dreadnought_assault_cannon', 'marine_dreadnought_lascannon_twin',
        'marine_missile_frag', 'marine_missile_krak', 'marine_lascannon_1', 'marine_lascannon_2', 'marine_lascannon_twin'
      ],
      Addon: [
        'marine_hq_addon_1', 'marine_hq_addon_2', 'marine_missile_launcher_turret', 'marine_listening_post_1', 'marine_listening_post_2',
        'marine_heavy_armor_deployment'
      ]
     },
   },

   sisters: {
    sections: {
      Infantry: [
        'sisters_servitor', 'sisters_missionary', 'sisters_battle_sister', 'sisters_canoness', 'sisters_seraphim', 'sisters_celestian', 'sisters_confessor',
        'sisters_assassin', 'sisters_repentia', 'sisters_ascension_angel', 'sisters_living_saint'
      ],
      Vehicle: [
        'sisters_rhino', 'sisters_immolator_tank', 'sisters_lightning', 'sisters_exorcist_tank', 'sisters_penitent_engine'
      ],
      Building: [
        'sisters_hq', 'sisters_infantry', 'sisters_listening_post', 'sisters_generator', 'sisters_sanctuary', 'sisters_holy_reliquary', 'sisters_thermo_generator',
        'sisters_vehicle_building', 'sisters_turret_flamer', 'sisters_mines', 'sisters_shrine'
      ],
      Ability: [
        'sisters_laud_hailer', 'sisters_lay_hands', 'sisters_emperors_touch', 'sisters_divine_retribution', 'sisters_divine_light',
        'sisters_ascension', 'sisters_phosphor_grenades', 'sisters_krak_grenades', 'jump', 'sisters_angelic_visage', 'sisters_witch_hammer',
        'sisters_divine_pronouncement', 'sisters_righteous_fervor', 'sisters_ardent_flame'
      ],
      Research: [
        'sisters_upgrade_requisition_1', 'sisters_upgrade_requisition_2', 'sisters_upgrade_power_1', 'sisters_upgrade_power_2',
        'sisters_squad_cap', 'sisters_vehicle_cap', 'sisters_research_emperors_touch', 'sisters_research_divine_retribution', 'sisters_research_phosphor_grenades',
        'sisters_research_krak_grenades', 'sisters_research_max_weapons', 'sisters_research_zealot_charge', 'sisters_research_blessed_ammunition',
        'sisters_research_health', 'sisters_research_health_2', 'sisters_research_ranged_damage', 'sisters_research_ranged_damage_2',
        'sisters_research_leader_melee_1', 'sisters_research_leader_melee_2', 'sisters_research_leader_range', 'sisters_research_laud_hailer',
        'sisters_research_vehicle_armor', 'sisters_research_conflagration', 'sisters_research_holy_promethium',
        'sisters_research_commander_health_1', 'sisters_research_commander_health_2', 'sisters_research_divine_pronouncement', 'sisters_research_ascension',
        'sisters_research_martyrs_gift', 'sisters_research_faithful_morale', 'sisters_upgrade_heart_of_worship',
      ],
      WeaponUpgrade: [
        'sisters_flamer', 'sisters_heavy_bolter', 'sisters_meltagun', 'sisters_multi_melta'
      ],
      Addon: [
        'addon_sisters_hq_1', 'addon_sisters_hq_2', 'addon_sisters_turret', 'addon_sisters_list_post_1', 'addon_sisters_list_post_2', 'addon_sisters_holy_icon'
      ]
    }
   },

   chaos: {
     sections: {
       Infantry: [
         'chaos_heretic', 'chaos_cultist', 'chaos_marines', 'chaos_raptors',
         'chaos_khorne_berserker', 'chaos_horrors', 'chaos_possessed',
         'chaos_obliterator', 'chaos_lord', 'chaos_sorcerer',
         'chaos_daemon_prince', 'chaos_bloodthirster'
       ],
       Vehicle: [
         'chaos_rhino', 'chaos_defiler', 'chaos_predator', 'chaos_hell_talon'
       ],
       Building: [
         'chaos_hq', 'chaos_listening_post', 'chaos_generator',
         'chaos_thermo_generator', 'chaos_temple', 'chaos_armoury',
         'chaos_sacrificial_circle', 'chaos_machine_pit', 'chaos_greater_circle',
         'chaos_bolter_turret', 'chaos_mine_field'
       ],
       Ability: [
         'chaos_force_labor', 'chaos_corruption', 'chaos_chains', 'chaos_doom_bolt',
         'chaos_frag_grenades', 'chaos_speed_fiends', 'chaos_tainted_auspex',
         'chaos_daemon_strength', 'chaos_daemon_roar', 'chaos_biotoxin'
       ],
       Research: [
         'chaos_squad_cap_research', 'chaos_vehicle_cap_research',
         'chaos_frag_grenade_research', 'chaos_raptor_speed_research',
         'chaos_cultist_sight_research', 'chaos_furious_charge_research',
         'chaos_purge_the_weak', 'chaos_infiltration_research',
         'chaos_marine_infiltration_research', 'chaos_smoke_launcher_research',
         'chaos_possessed_daemon_fire_research', 'chaos_commander_health_research_1',
         'chaos_commander_health_research_2', 'chaos_bloodthirster_research',
         'chaos_daemon_prince_research', 'chaos_personalteleporters'
       ],
       WeaponUpgrade: [
         'chaos_heavy_bolter', 'chaos_plasma_gun', 'chaos_lascannon_1',
         'chaos_lascannon_twin'
       ],
       Addon: [
         'addon_chaos_hq_upgrade', 'addon_chaos_listening_post_1',
         'addon_chaos_listening_post_2', 'addon_chaos_listening_post_dark_lance'
       ]
     }
   },

   necron: {
     sections: {
       Infantry: [
         'necron_builder_scarab', 'necron_warrior', 'necron_wraith',
         'necron_flayed_one', 'necron_immortal', 'necron_pariah', 'necron_lord',
         'necron_nightbringer', 'necron_deceiver'
       ],
       Vehicle: [
         'necron_tomb_spyder', 'necron_attack_scarab', 'necron_destroyer',
         'necron_heavy_destroyer', 'necron_lord_destroyer',
         'necron_restored_monolith'
       ],
       Building: [
         'necron_monolith', 'necron_listening_post', 'necron_turret', 'necron_plasma_generator',
         'necron_thermo_generator', 'necron_summoning_core',
         'necron_forbidden_archive', 'necron_greater_summoning_core',
         'necron_energy_core'
       ],
       Ability: [
         'necron_wraith_flight_research', 'necron_phase_shifter_research',
         'necron_lightning_field_research', 'necron_solar_pulse_research',
         'necron_veil_of_darkness_research', 'necron_nightmare_shroud_research',
         'necron_chronometron_research', 'necron_phase_shifter',
         'necron_mass_resurrection', 'necron_solar_pulse', 'necron_chronometron',
         'necron_wraith_defense', 'necron_flayed_fear'
       ],
       Research: [
         'necron_disruption_field_research', 'necron_superior_disruption_field_research',
         'necron_enhanced_disruption_field_research', 'necron_wraith_flight_research',
         'necron_chronometron_research', 'necron_phase_shifter_research',
         'necron_lightning_field_research', 'necron_solar_pulse_research',
         'necron_phalactery_research', 'necron_resurrection_orb_research',
         'necron_veil_of_darkness_research', 'necron_nightmare_shroud_research',
         'necron_research_essence_of_c_tan_gods'
       ],
       WeaponUpgrade: [
         'necron_gauss_cannon', 'necron_tomb_spyder_particle_projector'
       ],
       Addon: [
         'addon_necron_hq_1', 'addon_necron_hq_2', 'addon_necron_list_post_1',
         'addon_necron_list_post_2', 'addon_necron_turret'
       ]
     }
   },

   eldar: {
     sections: {
       Infantry: [
         'eldar_bonesinger', 'eldar_guardians', 'eldar_rangers',
         'eldar_banshee', 'eldar_dark_reapers', 'eldar_fire_dragon',
         'eldar_warp_spiders', 'eldar_harlequin', 'eldar_farseer',
         'eldar_warlock_seer', 'eldar_avatar'
       ],
       Vehicle: [
         'eldar_falcon_grav_tank', 'eldar_vyper', 'eldar_wraithlord',
         'eldar_nightwing', 'eldar_grav_platform_laser',
         'eldar_grav_platform_brightlance', 'eldar_fire_prism'
       ],
       Building: [
         'eldar_hq', 'eldar_listening_post', 'eldar_generator',
         'eldar_advanced_generator', 'eldar_webway_gate', 'eldar_aspect_portal',
         'eldar_soul_shrine', 'eldar_support_portal', 'eldar_support_platform',
         'eldar_mine_field'
       ],
       Ability: [
         'eldar_soulstone', 'eldar_wraithtomb', 'teleport', 'eldar_harlequin_kiss',
         'eldar_entanglement', 'eldar_fleetoffoot', 'eldar_plasma_grenades',
         'eldar_haywire_bombs', 'eldar_eldritch_storm', 'eldar_guide',
         'eldar_mind_war', 'eldar_psychic_storm', 'jump', 'eldar_shroud_ability'
       ],
       Research: [
         'eldar_mysticism', 'eldar_fleet_of_foot_research',
         'eldar_mobilize_for_war_research', 'eldar_imbue_wraithtomb',
         'eldar_plasma_grenade_research', 'eldar_ranger_infiltration_research',
         'eldar_warp_spider_equipment', 'eldar_research_infantryaccuracy_1',
         'eldar_research_infantryaccuracy_2', 'eldar_health_research',
         'eldar_researchinfantryhealth_1', 'eldar_researchinfantryhealth_2',
         'eldar_shroud_ability_research', 'eldar_webway_gate_healing_research',
         'eldar_webway_gate_relocation_research', 'eldar_tier2_research',
         'eldar_nightwing_regen_research', 'eldar_annihilate_the_enemy',
         'eldar_call_of_war_research', 'eldar_vehicle_holo_field_research'
       ],
       WeaponUpgrade: [
         'eldar_shuriken_cannon', 'eldar_scatter_laser', 'eldar_bright_lance',
         'eldar_starcannon'
       ],
       Addon: [
         'eldar_support_platform_addon', 'eldar_banshee_aspect_stone',
         'eldar_fire_dragon_aspect_stone', 'eldar_dark_reaper_aspect_stone',
         'eldar_warp_spider_aspect_stone', 'eldar_fire_prism_aspect_stone',
         'eldar_vyper_aspect_stone', 'eldar_wraithlord_aspect_stone',
         'eldar_dcannon'
       ]
     }
   },

   ork: {
     sections: {
       Infantry: [
         'ork_grots', 'ork_slugga_boyz', 'ork_shoota_boyz', 'ork_stormboyz',
         'ork_tankbustas', 'ork_nobs', 'ork_flash_gitz', 'ork_armored_nob',
         'ork_bad_dok', 'ork_mek_boy', 'ork_warboss'
       ],
       Vehicle: [
         'ork_trukk', 'ork_wartrak', 'ork_killa_kan', 'ork_fighta_bomma',
         'ork_looted_tank', 'ork_squiggoth'
       ],
       Building: [
         'ork_hq', 'ork_listening_post', 'ork_generator', 'ork_big_generator',
         'ork_waagh_banner', 'ork_boy_hut', 'ork_pile_o_guns', 'ork_mek_shop',
         'ork_mine_field'
       ],
       Ability: [
         'ork_teleport', 'ork_power_of_waagh', 'ork_power_surge',
         'ork_stikk_bombs', 'ork_turbo_boost', 'ork_tankbusta_bombs',
         'ork_super_stikk_bomb', 'ork_tank_zzzaaapppa', 'ork_fightin_juice',
         'ork_burna_bomb'
       ],
       Research: [
         'ork_gretchin_infiltration_research', 'ork_tankbusta_infiltration_research',
         'ork_kustim_gadjitz_research', 'ork_escalate_engagement_research',
         'ork_full_scale_war_research', 'ork_plasma_battery_storage_research',
         'ork_strengthen_power_grid_research', 'ork_more_dakka_research',
         'ork_even_more_dakka_research', 'ork_blastier_research',
         'ork_more_burny_research', 'ork_even_more_burny_research',
         'ork_big_shooty_boss_weapons_research', 'ork_even_more_choppy_research',
         'ork_more_choppy_research', 'ork_eavy_boy_armor_research',
         'ork_super_eavy_boy_armor_research', 'ork_tougher_bosses_research',
         'ork_even_tougher_bosses_research', 'ork_more_sluggas',
         'ork_stormboy_speed_boost_research', 'ork_extra_vehicle_armor',
         'ork_vehicle_speed_boost_research'
       ],
       WeaponUpgrade: [
         'ork_big_shoota', 'ork_rokkit_launcha', 'ork_rokkit_launcha_twin',
         'ork_mega_blasta', 'ork_pile_o_guns', 'ork_power_klaw',
         'ork_bomb_chucka', 'ork_gun_wagon', 'ork_zzzap_gun'
       ],
       Addon: [
         'addon_ork_hq_upgrade', 'addon_ork_listening_post_1',
         'addon_ork_listening_post_2', 'addon_ork_waagh_banner_addon'
       ]
     }
   },

   guard: {
     sections: {
       Infantry: [
         'guard_enginseer', 'guard_guardsmen', 'guard_heavy_weapon',
         'guard_kasrkin', 'guard_ogryn', 'guard_command_squad',
         'guard_commissar', 'guard_psyker', 'guard_priest', 'guard_assassin'
       ],
       Vehicle: [
         'guard_chimera', 'guard_sentinel', 'guard_hellhound', 'guard_basilisk',
         'guard_marauder', 'guard_leman_russ', 'guard_baneblade'
       ],
       Building: [
         'guard_hq', 'guard_listening_post', 'guard_generator',
         'guard_thermo_generator', 'guard_infantry', 'guard_tactica',
         'guard_mechanized_command', 'guard_mars_command',
         'guard_bolter_turret', 'guard_mine_field'
       ],
       Ability: [
         'guard_execute', 'guard_curse_of_the_machine_spirits',
         'guard_strip_soul', 'guard_lightning_arc', 'guard_fanaticism',
         'guard_assassination_scope', 'guard_fragmentation_grenade',
         'guard_strafing_run', 'guard_let_it_burn', 'guard_earthshaker_round',
         'guard_bombing_run_smoke_canisters', 'guard_bombing_run_krak_bombs',
         'guard_bombing_run_incendiary_bombs'
       ],
       Research: [
         'guard_ordo_exterminatus_research', 'guard_escalate_engagement_research',
         'guard_plasma_battery_storage_research',
         'guard_improved_power_grid_research', 'guard_death_before_dishonor',
         'guard_battle_armor', 'guard_dauntless_valor', 'guard_uncommon_valor',
         'guard_satellite_targeting_resolution', 'guard_will_of_the_emperor',
         'guard_weapon_specialization', 'guard_genetic_enhancement',
         'guard_kasrkin_armor', 'guard_powered_bayonets', 'guard_infiltration',
         'guard_full_scale_war'
       ],
       WeaponUpgrade: [
         'guard_autocannon', 'guard_lasgun', 'guard_multi_laser',
         'guard_heavy_bolter', 'guard_missile_launcher', 'guard_multi_melta',
         'guard_plasma_gun', 'guard_grenade_launcher', 'guard_melta_bombs'
       ],
       Addon: [
         'addon_guard_hq_1', 'addon_guard_hq_2',
         'addon_guard_listening_post_1', 'addon_guard_listening_post_2',
         'addon_guard_basilisk_depot', 'addon_guard_hellhound_depot',
         'addon_guard_leman_russ_depot', 'addon_guard_marauder_depot',
         'addon_guard_sentinel_depot', 'addon_guard_missile_turret_upgrade'
       ]
     }
   },

   tau: {
     sections: {
       Infantry: [
         'tau_builder', 'tau_stealth_warrior', 'tau_vespid_auxiliary',
         'tau_fire_warrior', 'tau_kroot_warrior', 'tau_kroot_shaper',
         'tau_pathfinder', 'tau_broadside_battlesuit', 'tau_crisis_suit',
         'tau_kroot_hound', 'tau_commander', 'tau_ethereal',
         'tau_fire_warrior_shasui'
       ],
       Vehicle: [
         'tau_devilfish_carrier', 'tau_skyray', 'tau_drone_squad',
         'tau_drone_harbinger', 'tau_barracuda', 'tau_hammerhead',
         'tau_krootox', 'tau_greater_knarloc'
       ],
       Building: [
         'tau_hq', 'tau_listening_post', 'tau_plasma_generator',
         'tau_thermo_generator', 'tau_barracks', 'tau_shrine_of_purpose',
         'tau_kroot_nest', 'tau_shrine_of_kauyon', 'tau_shrine_of_montka',
         'tau_research_building'
       ],
       Ability: [
         'tau_target_lock', 'tau_air_caste_strike', 'tau_destabilization',
         'tau_sonic_pulse', 'tau_jump', 'tau_missile_barrage', 'tau_mark_squad',
         'tau_snare_trap', 'tau_target_acquired'
       ],
       Research: [
         'tau_jetpacks', 'tau_stealth_burst_cannon_enhancements',
         'tau_target_lock_research', 'tau_advanced_pulse_rifle',
         'tau_improved_metallurgy', 'tau_targeting_optics',
         'tau_missile_barrage_research', 'tau_feral_leap',
         'tau_teachings_of_montka', 'tau_teachings_of_kauyon',
         'tau_plasma_battery_storage_research',
         'tau_strengthen_power_grid_research'
       ],
       WeaponUpgrade: [
         'tau_pulse_rifle', 'tau_burst_cannon', 'tau_fusion_blaster',
         'tau_missile_pod', 'tau_ion_cannon', 'tau_railgun',
         'tau_smart_missile_system'
       ],
       Addon: [
         'addon_tau_hq_1', 'addon_tau_hq_2',
         'addon_tau_listening_post_1', 'addon_tau_listening_post_2'
       ]
     }
   },

   dark_eldar: {
     sections: {
       Infantry: [
         'dark_eldar_slave', 'dark_eldar_mandrake', 'dark_eldar_warrior',
         'dark_eldar_hellion', 'dark_eldar_scourge', 'dark_eldar_wych',
         'dark_eldar_warp_beast', 'dark_eldar_archon', 'dark_eldar_haemonculus'
       ],
       Vehicle: [
         'dark_eldar_reaver', 'dark_eldar_raider', 'dark_eldar_talos',
         'dark_eldar_raven', 'dark_eldar_ravager', 'dark_eldar_dais'
       ],
       Building: [
         'dark_eldar_hq', 'dark_eldar_crucible', 'dark_eldar_generator',
         'dark_eldar_thermo_generator', 'dark_eldar_hall_of_blood',
         'dark_eldar_haemonculus_laboratory', 'dark_eldar_dark_foundry',
         'dark_eldar_wych_cult_arena', 'dark_eldar_soul_cage'
       ],
       Ability: [
         'dark_eldar_corrosion', 'dark_eldar_piercing_vision',
         'dark_eldar_rekindle_rage', 'dark_eldar_rend_soul',
         'dark_eldar_screams_of_the_damned', 'dark_eldar_soulstorm',
         'dark_eldar_crucible', 'dark_eldar_animus_vitae', 'dark_eldar_soul_shock',
         'dark_eldar_stinger', 'dark_eldar_torture_amp', 'dark_eldar_combat_drugs',
         'dark_eldar_short_circuit', 'dark_eldar_wildfire', 'dark_eldar_horrorfex',
         'dark_eldar_dais'
       ],
       Research: [
         'dark_eldar_research_infiltration_mandrake',
         'dark_eldar_research_reaver_targeting',
         'dark_eldar_research_wildfire', 'dark_eldar_research_poisoned_blades',
         'dark_eldar_research_stinger', 'dark_eldar_research_soul_destruction',
         'dark_eldar_research_crucible', 'dark_eldar_research_daemonic_touch'
       ],
       WeaponUpgrade: [
         'dark_eldar_splinter_rifle', 'dark_eldar_dark_lance',
         'dark_eldar_shredder', 'dark_eldar_heat_lance'
       ],
       Addon: [
         'addon_dark_eldar_hq_upgrade', 'addon_dark_eldar_list_post_1',
         'addon_dark_eldar_list_post_2', 'addon_dark_eldar_list_post_dark_lance',
         'addon_dark_eldar_slave_graveyard'
       ]
     }
   }
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

  sisters_servitor: {
    command: [
      'move', 'stop', '', '',
      'build', 'repair', '', '',
      'sisters_dismantle'
    ],
    second: [
      'sisters_hq', 'sisters_infantry', 'sisters_listening_post', 'sisters_generator',
      'sisters_sanctuary', 'sisters_vehicle_building', 'sisters_holy_reliquary', 'sisters_thermo_generator',
      'sisters_shrine', 'sisters_mines', 'sisters_turret_flamer', 'escape'
    ],
    improvements: ['']
  },

  sisters_missionary: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee',
      'sisters_lay_hands', 'sisters_emperors_touch', 'sisters_divine_retribution'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  sisters_battle_sister: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', 'sisters_phosphor_grenades', '@panel_yellow', '@panel_gun',
    ],
    second: [''],
    improvements: [
      'reinforce', 'sisters_veteran_superior',
      'sisters_flamer', 'sisters_heavy_bolter',
    ]
  },

  sisters_canoness: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'sisters_ascension', '', '@panel_yellow', '@panel_melee',
      'sisters_divine_light'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  sisters_seraphim: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', 'sisters_krak_grenades', '@panel_yellow', '@panel_gun',
      'sisters_angelic_visage', '', '', 'jump'
    ],
    second: [''],
    improvements: ['reinforce', 'sisters_veteran_superior_seraphim']
  },

  sisters_celestian: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', 'sisters_krak_grenades', '@panel_yellow', '@panel_gun',
    ],
    second: [''],
    improvements: [
      'reinforce', '',
      'sisters_veteran_superior_celestian', 'sisters_celestian_imagifer',
      'sisters_meltagun', 'sisters_multi_melta'
    ]
  },

  sisters_confessor: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee',
      'sisters_witch_hammer'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'sisters_divine_pronouncement', 'sisters_witch_hammer'
    ],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  sisters_assassin: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow'
    ],
    second: [''],
    improvements: ['']
  },

  sisters_repentia: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', 'sisters_righteous_fervor', '@panel_yellow'
    ],
    second: [''],
    improvements: ['reinforce', 'sisters_repentia_mistress']
  },

  sisters_living_saint: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '',
      'sisters_ardent_flame', '', '', 'jump'
    ],
    second: [''],
    improvements: ['']
  },

  sisters_rhino: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', 'unload', '@panel_yellow', '',
      '', '', '', 'sisters_laud_hailer'
    ],
    second: [''],
    improvements: ['']
  },

  sisters_immolator_tank: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', '', '@panel_yellow', '',
      'sisters_conflagration'
    ],
    second: [''],
    improvements: [
      '', '',
      'sisters_multi_melta_immolator'
    ]
  },

  sisters_lightning: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', '', '@panel_yellow'
    ],
    second: [''],
    improvements: ['']
  },

  sisters_exorcist_tank: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', 'attackground', '@panel_yellow', '',
      'sisters_hk_missiles'
    ],
    second: [''],
    improvements: ['']
  },

  sisters_penitent_engine: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee',
    ],
    second: [''],
    improvements: ['']
  },

  sisters_hq: {
    command: [
      'sisters_servitor', 'sisters_missionary', '', 'sisters_confessor',
      'sisters_research_emperors_touch', 'sisters_research_divine_retribution', '', '',
      'addon_sisters_hq_1', '', '', 'sisters_laud_hailer'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'addon_sisters_hq_2'
    ],
    improvements: ['rally', '@panel_yellow']
  },

  sisters_infantry: {
    command: [
      'sisters_canoness', 'sisters_battle_sister', 'sisters_seraphim', 'sisters_celestian',
      'sisters_assassin', 'sisters_repentia', '', '',
      'sisters_squad_cap', 'sisters_research_phosphor_grenades', 'sisters_research_krak_grenades', 'sisters_laud_hailer'
    ],
    second: [''],
    improvements: ['rally', '@panel_yellow']
  },

  sisters_listening_post: {
    command: [
      'addon_sisters_list_post_1', '', '', '',
      'sisters_upgrade_requisition_1', '', '', '',
      'addon_sisters_holy_icon'
    ],
    second: [
      '', 'addon_sisters_list_post_2', '', '',
      'sisters_upgrade_requisition_2'
    ],
    improvements: [
      '', '',
      '', 'attack'
    ]
  },

  sisters_generator: {
    command: ['sisters_upgrade_power_1'],
    second: ['sisters_upgrade_power_2'],
    improvements: ['']
  },

  sisters_sanctuary: {
    command: [
      'sisters_research_max_weapons', 'sisters_research_zealot_charge', '', 'sisters_research_blessed_ammunition',
      'sisters_research_health', 'sisters_research_ranged_damage', '', '',
      'sisters_research_leader_melee_1', 'sisters_research_leader_range', 'sisters_research_laud_hailer', 'sisters_laud_hailer'
    ],
    second: [
      '', '', '', '',
      'sisters_research_health_2', 'sisters_research_ranged_damage_2', '', '',
      'sisters_research_leader_melee_2'
    ],
    improvements: ['']
  },

  sisters_vehicle_building: {
    command: [
      'sisters_rhino', 'sisters_immolator_tank', 'sisters_lightning', 'sisters_exorcist_tank',
      'sisters_penitent_engine', '', '', 'sisters_research_vehicle_armor',
      'sisters_vehicle_cap', 'sisters_conflagration', 'sisters_research_holy_promethium', 'sisters_laud_hailer'
    ],
    second: [''],
    improvements: ['rally', '@panel_yellow']
  },

  sisters_holy_reliquary: {
    command: [
      'sisters_research_commander_health_1', 'sisters_research_divine_pronouncement', 'sisters_research_ascension', '',
      'sisters_research_martyrs_gift', 'sisters_research_faithful_morale', '', '',
      '', '', '', 'sisters_laud_hailer'
    ],
    second: [
      'sisters_research_commander_health_2', '', '', '',
      '', 'sisters_upgrade_heart_of_worship'
    ],
    improvements: ['']
  },

  sisters_thermo_generator: {
    command: [
      '', '', '', '',
      '', '', '', '',
      '', '', '', 'scuttle'
    ],
    second: [''],
    improvements: ['']
  },

  sisters_shrine: {
    command: ['sisters_living_saint'],
    second: [''],
    improvements: ['rally', '@panel_yellow']
  },

  sisters_mines: {
    command: [
      '', '', '', '',
      '', '', '', '',
      '', '', '', 'scuttle'
    ],
    second: [''],
    improvements: ['']
  },

  sisters_turret_flamer: {
    command: ['addon_sisters_turret'],
    second: [''],
    improvements: [
      '', '',
      '', 'attack'
    ]
  },

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
      '', '', '@panel_yellow', '@panel_gun',
      '', '', '', 'teleport'
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
      '', '', '@panel_yellow', '',
      '', '', '', 'teleport'
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

  chaos_heretic: {
    command: [
      'move', 'stop', '', '',
      'build', 'repair', '', '',
      'chaos_force_labor'
    ],
    second: [
      'chaos_hq', 'chaos_temple', 'chaos_listening_post', 'chaos_generator',
      'chaos_armoury', 'chaos_machine_pit', 'chaos_sacrificial_circle', 'chaos_thermo_generator',
      'chaos_bolter_turret', 'chaos_mine_field', 'chaos_greater_circle', 'escape'
    ],
    improvements: ['']
  },

  chaos_cultist: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'possess', 'attackground', '@panel_yellow', '@panel_melee',
      '', '', 'chaos_furious_rage'
    ],
    second: [''],
    improvements: [
      'reinforce', 'chaos_aspiring_champion',
      'chaos_grenade_launcher', 'chaos_plasma_gun'
    ]
  },

  chaos_marines: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'possess', '', '@panel_yellow', '@panel_gun',
      '', '', 'chaos_furious_rage', 'chaos_frag_grenades'
    ],
    second: [''],
    improvements: [
      'reinforce', 'chaos_aspiring_champion',
      'chaos_heavy_bolter', 'chaos_plasma_gun'
    ]
  },

  chaos_raptors: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'possess', '', '@panel_yellow', '@panel_melee',
      'chaos_speed_fiends', '', 'chaos_furious_rage', 'jump'
    ],
    second: [''],
    improvements: [
      'reinforce', 'chaos_aspiring_champion_raptors',
      'chaos_flamer'
    ]
  },

  chaos_lord: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'chaos_daemon_prince', '', '@panel_yellow', '@panel_melee',
      'chaos_daemon_strength', 'chaos_tainted_auspex'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  chaos_sorcerer: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'possess', '', '@panel_yellow', '@panel_melee',
      'chaos_doom_bolt', 'chaos_chains', 'chaos_corruption', 'teleport'
    ],
    second: [''],
    improvements: [
      '', '',
      '', '',
      '', '',
      'attach'
    ]
  },

  chaos_khorne_berserker: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee',
      'fear'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  chaos_horrors: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  chaos_possessed: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  chaos_obliterator: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun',
      '', '', '', 'teleport'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  chaos_daemon_prince: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_red', '',
      'chaos_daemon_roar', 'chaos_tainted_auspex'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      '', 'chaos_daemon_strength', 'chaos_tainted_auspex'
    ],
    improvements: ['']
  },

  chaos_bloodthirster: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '',
      '', '', '', 'jump'
    ],
    second: [''],
    improvements: ['']
  },

  chaos_rhino: {
    command: [
      'move', 'stop', '', '',
      '', 'unload', '', '',
      'chaos_smoke_launchers'
    ],
    second: [''],
    improvements: ['']
  },

  chaos_defiler: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', 'attackground', '@panel_yellow', '@panel_melee'
    ],
    second: [''],
    improvements: ['']
  },

  chaos_hell_talon: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', 'attackground', '@panel_yellow', '',
      'chaos_biotoxin'
    ],
    second: [''],
    improvements: ['']
  },

  chaos_predator: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', '', '@panel_yellow',
    ],
    second: [''],
    improvements: [
      '', '',
      'chaos_lascannon_twin', 'chaos_lascannon_1',
      'chaos_lascannon_2'
    ]
  },

  chaos_hq: {
    command: [
      'chaos_heretic', 'chaos_cultist', '', 'chaos_sorcerer',
      'chaos_squad_cap_research', 'chaos_vehicle_cap_research', '', '',
      'chaos_hq_addon_1'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'chaos_hq_addon_2'
    ],
    improvements: [
      'rally', '@panel_yellow'
    ]
  },

  chaos_temple: {
    command: [
      'chaos_marines', 'chaos_raptors', '', 'chaos_khorne_berserker',
      'chaos_lord', '', '', '',
      'chaos_frag_grenade_research', 'chaos_raptor_speed_research', '', 'chaos_cultist_sight_research'
    ],
    second: [''],
    improvements: [
      'rally', '@panel_yellow'
    ]
  },

  chaos_armoury: {
    command: [
      'chaos_furious_charge_research', '', '', 'chaos_purge_the_weak',
      'chaos_max_weapons_research', '', '', 'chaos_rage_research',
      'chaos_champion_melee_research_1', 'chaos_champion_ranged_research', 'chaos_infiltration_research', 'chaos_marine_infiltration_research'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'chaos_champion_melee_research_2'
    ],
    improvements: ['']
  },

  chaos_listening_post: {
    command: [
      'chaos_listening_post_1', '', '', '',
      'chaos_requisition_research_1'
    ],
    second: [
      '', 'chaos_listening_post_2', '', '',
      'chaos_requisition_research_2'
    ],
    improvements: [
      '', '',
      '', 'attack'
    ]
  },

  chaos_generator: {
    command: ['chaos_power_research_1'],
    second: ['chaos_power_research_2'],
    improvements: ['']
  },

  chaos_machine_pit: {
    command: [
      'chaos_rhino', 'chaos_defiler', 'chaos_predator', 'chaos_hell_talon',
      '', '', '', '',
      'chaos_projectiles', 'chaos_smoke_launcher_research'
    ],
    second: [''],
    improvements: ['rally', '@panel_yellow']
  },

  chaos_sacrificial_circle: {
    command: [
      'chaos_horrors', 'chaos_possessed', '', '',
      'chaos_possessed_daemon_fire_research', '', '', '',
      'chaos_commander_health_research_1', 'chaos_lord_research_1', 'chaos_sorcerer_research_1'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'chaos_commander_health_research_2', 'chaos_lord_research_2', 'chaos_sorcerer_research_2'
    ],
    improvements: [
      'rally', '@panel_yellow',
      'deepstrike'
    ]
  },

  chaos_greater_circle: {
    command: [
      'chaos_obliterator', 'chaos_bloodthirster_research', 'chaos_daemon_prince_research', '',
      'chaos_personalteleporters'
    ],
    second: [''],
    improvements: [
      '', '@panel_yellow',
      'deepstrike'
    ]
  },

  chaos_mine_field: {
    command: [
      '', '', '', '',
      '', '', '', '',
      '', '', '', 'scuttle'
    ],
    second: [''],
    improvements: ['']
  },

  chaos_bolter_turret: {
    command: ['chaos_missile_launcher_turret'],
    second: [''],
    improvements: [
      '', '',
      '', 'attack'
    ]
  },

  necron_builder_scarab: {
    command: [
      'move', 'stop', '', '',
      'build', 'repair'
    ],
    second: [
      'necron_monolith', 'necron_listening_post', 'necron_plasma_generator', 'necron_thermo_generator',
      'necron_summoning_core', 'necron_forbidden_archive', 'necron_greater_summoning_core', 'necron_energy_core',
      'necron_turret', '', '', 'escape'
    ],
    improvements: ['reinforce']
  },

  necron_warrior: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun',
      '', '', '', 'necron_summon'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  necron_wraith: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '',
      'necron_phase_shifter'
    ],
    second: [''],
    improvements: ['']
  },

  necron_flayed_one: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '',
      '', '', '', 'necron_summon'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  necron_immortal: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun',
      '', '', '', 'necron_summon'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  necron_pariah: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  necron_lord: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'necron_possess_nightbringer', 'necron_possess_deceiver', '@panel_yellow', '@panel_melee',
      'necron_phase_shifter', 'necron_solar_pulse', 'necron_lightning_field', 'teleport'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'necron_chronometron', 'necron_mass_resurrection', 'necron_nightmare_shroud'
    ],
    improvements: ['']
  },

  necron_nightbringer: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_melee'
    ],
    second: [''],
    improvements: ['']
  },

  necron_deceiver: {
    command: [
      'move', 'stop', 'attackmove', '',
      '', '', '@panel_yellow', '',
      'necron_grand_illusion', 'necron_deceive', '', 'teleport'
    ],
    second: [''],
    improvements: ['']
  },

  necron_monolith: {
    command: [
      'necron_builder_scarab', 'necron_warrior', 'necron_wraith', 'necron_lord',
      'necron_immortal', 'necron_flayed_one', 'necron_pariah', 'necron_tomb_spyder',
      'addon_necron_hq_1', 'necron_destroyer', 'necron_heavy_destroyer', 'necron_lord_destroyer'
    ],
    second: [
      '', '', '', '',
      '', '', '', '',
      'addon_necron_hq_2', 'necron_restored_monolith'
    ],
    improvements: [
      'rally', '@panel_yellow',
      'deepstrike'
    ]
  },

  necron_listening_post: {
    command: ['addon_necron_list_post_1'],
    second: [
      '', 'addon_necron_list_post_2', '', '',
      'necron_doom'
    ],
    improvements: [
      '', '',
      '', 'attack'
    ]
  },

  necron_plasma_generator: {
    command: ['necron_power_research_1'],
    second: ['necron_power_research_2'],
    improvements: ['']
  },

  necron_thermo_generator: {
    command: [
      '', '', '', '',
      '', '', '', '',
      '', '', '', 'scuttle'
    ],
    second: [''],
    improvements: ['']
  },

  necron_summoning_core: {
    command: [
      'necron_warrior_disruption_field_research', 'necron_wraith_flight_research', '', '',
      'necron_warrior_disruption_field_research_2', '', '', '',
      'necron_warrior_disruption_field_research_3'
    ],
    second: [''],
    improvements: ['']
  },

  necron_forbidden_archive: {
    command: [
      'necron_chronometron_research', 'necron_phase_shifter_research', 'necron_lightning_field_research', 'necron_solar_pulse_research',
      'necron_phalactery_research', 'necron_resurrection_orb_research', 'necron_veil_of_darkness_research', 'necron_nightmare_shroud_research'
    ],
    second: [''],
    improvements: ['']
  },

  necron_greater_summoning_core: {
    command: [
      '', '', '', '',
      '', '', '', '',
      '', '', '', 'scuttle'
    ],
    second: [''],
    improvements: ['']
  },

  necron_energy_core: {
    command: ['necron_ctan_research'],
    second: [''],
    improvements: ['']
  },

  necron_turret: {
    command: ['addon_necron_turret'],
    second: [''],
    improvements: [
      '', '',
      '', 'attack'
    ]
  },

  necron_tomb_spyder: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'necron_attack_scarab', 'necron_harvest_1', '@panel_yellow', '@panel_melee',
      'spyder_warrior', 'spyder_flayed', 'spyder_immortal'
    ],
    second: [''],
    improvements: [
      '', '',
      'necron_tomb_spyder_particle_projector'
    ]
  },

  necron_attack_scarab: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow'
    ],
    second: [''],
    improvements: ['reinforce']
  },

  necron_destroyer: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun'
    ],
    second: [''],
    improvements: ['']
  },

  necron_heavy_destroyer: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      '', '', '@panel_yellow', '@panel_gun'
    ],
    second: [''],
    improvements: ['']
  },

  necron_lord_destroyer: {
    command: [
      'move', 'stop', 'attackmove', 'attackmelee',
      'necron_possess_enemy', '', '@panel_yellow', '@panel_gun',
      'necron_stasis_field'
    ],
    second: [''],
    improvements: ['']
  },

  necron_restored_monolith: {
    command: [
      'move', 'stop', 'attackmove', '',
      'fakebuild', '', '@panel_yellow', '',
      '', '', '', 'teleport'
    ],
    second: [
      'necron_builder_scarab', 'necron_warrior', 'necron_wraith', 'necron_lord',
      'necron_immortal', 'necron_flayed_one', 'necron_pariah', 'necron_tomb_spyder',
      'escape', 'necron_destroyer', 'necron_heavy_destroyer', 'necron_lord_destroyer'
    ],
    improvements: [
      '', '',
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
  necron_possess_enemy: 'possess_enemy',
  chaos_force_labor_2: 'chaos_force_labor',
  chaos_aspiring_champion_raptors: 'chaos_aspiring_champion',
  marine_dreadnought_assault_cannon: 'marine_assault_cannon',
  marine_lascannon_2: 'marine_lascannon_1',
  marine_dreadnought_lascannon_twin: 'marine_lascannon_twin',
  sisters_research_health_2: 'sisters_research_health',
  sisters_research_ranged_damage_2: 'sisters_research_ranged_damage',
  sisters_repentia_mistress: 'leader',
  sisters_multi_melta_immolator: 'sisters_multi_melta',
  fear: 'necron_nightmare_shroud',
  chaos_lascannon_2: 'chaos_lascannon_1',
  necron_summon: 'jump',
  necron_lightning_field: 'lightning_field',
  necron_warrior_disruption_field_research_2: 'necron_warrior_disruption_field_research',
  necron_warrior_disruption_field_research_3: 'necron_warrior_disruption_field_research',
  necron_harvest_1: 'harvest',
  necron_harvest_2: 'harvest',
}

/**
 * Связанные кнопки: отдельные позиции в раскладке, но общий хоткей.
 *
 * В игре у разных кнопок может быть общая клавиша (например, `possess` у
 * различныхюнитов). Каждая кнопка занимает свою позицию в панели и показывает
 * свою картинку, но при нажатии используется клавиша родительской команды.
 *
 * Ключ — имя кнопки в раскладке, значение — команда, чей хоткей используется.
 * Такие кнопки не добавляются как вторые картинки в фильтре «Все» — они и так
 * есть как отдельные записи, раз попали в раскладку.
 */
export const COMMAND_LINKS: Readonly<Record<string, string>> = {
  chaos_daemon_prince: 'possess',
  chaos_bloodthirster: 'possess',
  necron_nightbringer: 'necron_possess_nightbringer',
  necron_attack_scarab: 'direct_spawn',
}

/** Связанная кнопка ли это: отдельная позиция с чужой клавишей. */
export function isCommandLink(id: string): boolean {
  return id in COMMAND_LINKS
}

/**
 * Значки, ведущие на ту же команду, что и их оригинал, — по команде.
 *
 * Нужно фильтру «Все»: там показывается всё описанное, а без этого из списка
 * выпадали бы вторые картинки одной команды. Рядом со своей командой они и
 * встают — иначе в списке из восьмисот команд найти их невозможно.
 */
export function aliasNamesOf(command: string): readonly string[] {
  return Object.entries(COMMAND_ALIASES)
    .filter(([, target]) => target === command)
    .map(([name]) => name)
}

/** Настоящая команда за именем из раскладки: само имя либо то, на что оно указывает. */
export function commandOf(id: string): string {
  return COMMAND_LINKS[id] ?? COMMAND_ALIASES[id] ?? id
}

/** Команда ли это имя, а не разрыв ряда, не внутренняя кнопка и не связанная кнопка. */
export function isCommandName(id: string): boolean {
  return id !== PANEL_ROW_BREAK && !isInternalButton(id) && !isManualButton(id) && !isCommandLink(id)
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
 * Кнопки без команды и без хоткея: просто картинка и надпись по центру.
 *
 * В игре на такие кнопки нужно нажимать мышкой — настоящей клавиши за ними нет,
 * и в файл они не попадают. Редактор показывает приглушённую плитку со значком и
 * подписью, как у внутренних кнопок, а надпись объясняет, что это ручное нажатие.
 *
 * Ключ — имя, под которым кнопка пишется в раскладке.
 * Значение — картинка из hotkey-images и ключ локализации с надписью.
 *
 *   MANUAL_BUTTONS: Readonly<Record<string, ManualButton>> = {
 *     'marine_serve': { icon: 'stance_hold', label: 'editor.manualClick' },
 *   }
 */
export interface ManualButton {
  icon: string
  label: TranslationKey
}

export const MANUAL_BUTTONS: Readonly<Record<string, ManualButton>> = {
  fakebuild: { icon: 'build', label: 'editor.manualClick' },
  spyder_warrior: { icon: 'necron_warrior', label: 'editor.manualClick' },
  spyder_flayed: { icon: 'necron_flayed_one', label: 'editor.manualClick' },
  spyder_immortal: { icon: 'necron_immortal', label: 'editor.manualClick' },
}

export function isManualButton(id: string): boolean {
  return id in MANUAL_BUTTONS
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
