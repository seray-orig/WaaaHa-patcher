/**
 * Загрузка иконок команд с вики warhammer-guide.ru.
 *
 * Иконка берётся со страницы самого юнита: там в блоке «Build Info» лежит квадратная
 * картинка 64×64. Картинки со страницы фракции не годятся — это большие фотографии
 * отрядов, а нужны иконки отдельных юнитов.
 *
 * Названия на вике произвольные (`Ss_force_commander_icon.jpg`), поэтому каждая страница
 * сопоставлена со своим идентификатором хоткея в FACTION_UNITS.
 *
 * Запуск:
 *   node tools/fetch-wiki-icons.mjs --faction=marine
 *
 * Подклассы вроде сержанта лежат на отдельных страницах и сопоставлены так же: в игре
 * это самостоятельные хоткеи, выбираемые в оружейне. Новые страницы скрипт печатает
 * списком в конце.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WIKI_ROOT = 'https://warhammer-guide.ru'
const OUTPUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'WaaaHa!-patcher.React',
  'public',
  'hotkey-images',
)

/** Страница фракции нужна только для отчёта, иконки берутся со страниц юнитов. */
const FACTION_PAGES = {
  marine: 'Space_Marines',
  chaos: 'Chaos',
  eldar: 'Eldar',
  ork: 'Orks',
  guard: 'Imperial_Guard',
  tau: 'Tau',
  necron: 'Necrons',
  dark_eldar: 'Dark_Eldar',
  sisters: 'Sisters_of_Battle',
}

/**
 * Идентификатор хоткея → страница юнита на вики.
 * Порядок внутри группы повторяет порядок юнитов в игре.
 */
const FACTION_UNITS = {
  marine: {
    // Пехота
    Servitor: 'marine_servitor',
    Scout_Marine_Squad: 'marine_scout',
    Space_Marine_Squad: 'marine_space_marine',
    Assault_Marine_Squad: 'marine_assault_marine',
    Grey_Knights: 'marine_grey_knights',
    Terminator_Squad: 'marine_terminator',
    Assault_Terminator_Squad: 'marine_assault_terminator',
    Skull_Probe: 'marine_skull_probe',
    Apothecary: 'marine_apothecary',
    Force_Commander: 'marine_force_commander',
    Librarian: 'marine_librarian',
    Chaplain: 'marine_chaplain',

    // Подклассы: в игре это отдельные юниты, покупаемые в оружейне
    Marine_Sergeant: 'marine_sergeant',

    // Техника
    Rhino: 'marine_rhino',
    Land_Speeder: 'marine_land_speeder',
    Land_Speeder_Tempest: 'marine_tempest',
    Dreadnought: 'marine_dreadnought',
    Hellfire_Dreadnought: 'marine_dreadnought_hellfire',
    Predator: 'marine_predator',
    Whirlwind: 'marine_whirlwind',
    Land_Raider: 'marine_land_raider',

    // Строения
    Stronghold: 'marine_hq',
    Listening_Post_Space_Marines: 'marine_listening_post',
    Plasma_Generator_Space_Marines: 'marine_generator',
    Thermo_Plasma_Generator_Space_Marines: 'marine_thermo_generator',
    'Chapel-Barracks': 'marine_chapel',
    Armoury: 'marine_armoury',
    Machine_Cult: 'marine_machine_cult',
    Sacred_Artifact: 'marine_artefact',
    Orbital_Relay: 'marine_orbital_relay',
    Heavy_Bolter_Turret_Space_Marines: 'marine_bolter_turret',
    Mine_Field_Space_Marines: 'marine_mine_field',
  },
}

/**
 * Командир расы: его иконкой открывается вкладка фракции. Это тот же человек, которым
 * игрок командует всё войско, поэтому представитель выбран осмысленно, а не наугад.
 */
const FACTION_LEADER = {
  marine: 'Force_Commander',
  chaos: 'Daemon_Prince',
  eldar: 'Farseer',
  ork: 'Warboss',
  guard: 'Command_Squad',
  tau: 'Ethereal',
  necron: 'Necron_Lord',
  dark_eldar: 'Archon',
  sisters: 'Canoness',
}

/** Иконка юнита — первая картинка 64×64 на его странице. */
const UNIT_ICON = /<img[^>]*src="images\/([^"]+)"[^>]*width="64"/g

/** Служебные картинки вики, которые к юнитам отношения не имеют. */
const IGNORED = /^(180px-|80px-|magnify-|brand\/|Dark_crusade_appicon)|^(Dawn_of_War_logo|favicon|Resource_)/i

async function fetchPage(page) {
  const response = await fetch(`${WIKI_ROOT}/wiki/${page}.html`)

  if (!response.ok) {
    throw new Error(`${page}: HTTP ${response.status}`)
  }

  return response.text()
}

/** Имя иконки юнита на его странице. */
async function findUnitIcon(page) {
  const html = await fetchPage(page)
  const icons = [...new Set([...html.matchAll(UNIT_ICON)].map((match) => match[1]))]

  return icons.find((name) => !IGNORED.test(name)) ?? null
}

async function download(wikiName, bindingId) {
  const response = await fetch(`${WIKI_ROOT}/wiki/images/${wikiName}`)

  if (!response.ok) {
    return { ok: false, reason: `HTTP ${response.status}` }
  }

  const type = response.headers.get('content-type') ?? ''

  // Без проверки сайт отдаёт HTML-заглушку, и «картинка» не откроется.
  if (!type.startsWith('image/')) {
    return { ok: false, reason: `не изображение, а ${type}` }
  }

  const extension = type.includes('png') ? 'png' : 'jpg'
  const bytes = Buffer.from(await response.arrayBuffer())

  if (bytes.length === 0) {
    return { ok: false, reason: 'пустой ответ' }
  }

  await writeFile(join(OUTPUT_DIR, `${bindingId}.${extension}`), bytes)

  return { ok: true }
}

async function main() {
  const requested = process.argv
    .slice(2)
    .filter((argument) => argument.startsWith('--faction='))
    .map((argument) => argument.slice('--faction='.length))

  const factions = requested.length > 0 ? requested : ['marine']

  await mkdir(OUTPUT_DIR, { recursive: true })

  for (const faction of factions) {
    const units = FACTION_UNITS[faction] ?? {}

    console.log(`\n=== ${faction} (${FACTION_PAGES[faction] ?? '—'}) ===`)

    let downloaded = 0
    const failed = []
    const seen = new Map()

    for (const [page, bindingId] of Object.entries(units)) {
      let icon

      try {
        icon = await findUnitIcon(page)
      } catch (reason) {
        failed.push(`${page} → ${bindingId}: ${reason.message}`)
        continue
      }

      if (!icon) {
        failed.push(`${page} → ${bindingId}: иконка 64×64 не найдена`)
        continue
      }

      seen.set(icon, bindingId)

      const result = await download(icon, bindingId)

      if (result.ok) {
        downloaded += 1
      } else {
        failed.push(`${icon} → ${bindingId}: ${result.reason}`)
      }
    }

    const leader = FACTION_LEADER[faction]

    if (leader) {
      const icon = await findUnitIcon(leader)
      const result = icon ? await download(icon, `faction_${faction}`) : null

      if (result?.ok) {
        downloaded += 1
      } else if (icon) {
        failed.push(`${leader} → faction_${faction}: ${result.reason}`)
      } else {
        failed.push(`${leader}: иконка командира не найдена`)
      }
    }

    console.log(`Скачано: ${downloaded}`)

    if (failed.length > 0) {
      console.log(`Не удалось (${failed.length}):`)
      failed.forEach((line) => console.log(`  ${line}`))
    }

    // Несколько юнитов часто делят одну иконку на вики — это нормально, но
    // полезно знать при проверке результата.
    const counts = new Map()

    for (const [icon, bindingId] of seen) {
      counts.set(icon, [...(counts.get(icon) ?? []), bindingId])
    }

    const shared = [...counts].filter(([, ids]) => ids.length > 1)

    if (shared.length > 0) {
      console.log(
        `Общие иконки: ${shared.map(([icon, ids]) => `${icon} → ${ids.join(', ')}`).join('; ')}`,
      )
    }
  }
}

await main()