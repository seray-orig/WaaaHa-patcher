/**
 * Загрузка иконок команд с вики warhammer-guide.ru.
 *
 * На странице фракции лежат картинки всех её юнитов, техники и построек, но
 * названия произвольные: SMServitor.jpg, SMRhino.jpg. Скрипт сопоставляет их с
 * идентификаторами хоткеев и кладёт в public/hotkey-images под именем
 * идентификатора, которое ищет интерфейс.
 *
 * Запуск:
 *   node tools/fetch-wiki-icons.mjs --faction=marine
 *
 * Сопоставления живут в FACTION_ICONS. Новые картинки вики скрипт выводит
 * списком в конце, чтобы их можно было добавить руками.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const WIKI_ROOT = 'https://warhammer-guide.ru'
const OUTPUT_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'WaaaHa!-patcher.React',
  'public',
  'hotkey-images',
)

/** Страницы фракций на вики. */
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
 * Сопоставление «файл на вики» → «идентификатор хоткея».
 * Заполнено для космодесанта, остальные фракции добавляются по мере надобности.
 */
const FACTION_ICONS = {
  marine: {
    SMServitor: 'marine_servitor',
    SMScouts: 'marine_scout',
    SMSpaceMarines: 'marine_space_marine',
    SMAssualt: 'marine_assault_marine',
    SMGreyKnight: 'marine_grey_knights',
    SMTermi: 'marine_terminator',
    SMAssaultTermi: 'marine_assault_terminator',
    SMSkullprobes: 'marine_skull_probe',
    SMApoth: 'marine_apothecary',
    SMLib: 'marine_librarian',
    'SS_Force_Commander': 'marine_force_commander',
    SMChaplian: 'marine_chaplain',

    SMRhino: 'marine_rhino',
    SMLandspeeder: 'marine_land_speeder',
    Land_Speeder_Tempest: 'marine_tempest',
    SMDread: 'marine_dreadnought',
    SMHellfire: 'marine_dreadnought_hellfire',
    SMWhirlwind: 'marine_whirlwind',
    SMPread: 'marine_predator',
    SMLandRaider: 'marine_land_raider',

    SMHQ: 'marine_hq',
    SMLP: 'marine_listening_post',
    SMGenerator: 'marine_generator',
    SMThermo: 'marine_thermo_generator',
    SMBarracks: 'marine_chapel',
    SMArmoury: 'marine_armoury',
    SMMachineCult: 'marine_machine_cult',
    SMScaredAtifact: 'marine_artefact',
    SMObritalRelay: 'marine_orbital_relay',
    SMTurrets: 'marine_bolter_turret',
    SMMines: 'marine_mine_field',
  },
}

/**
 * Картинка, которой открывается вкладка фракции. Для всех фракций взята
 * штаб-квартира: она есть у каждой расы и узнаваема.
 */
const FACTION_BANNER = {
  marine: 'SMHQ',
  chaos: 'Chaos_stronghold',
  eldar: 'Eldarhq',
  ork: 'OrkHQ',
  guard: 'IGhq',
  tau: 'Cadre_Headquarters',
  necron: 'Monolith_dormant',
  dark_eldar: 'Kabal_Fortress',
  sisters: 'Ecclesiarchal_Chapel',
}

/** Служебные картинки вики, которые не имеют отношения к юнитам. */
const IGNORED = /^(180px-|80px-|magnify-|brand\/)|^(Dawn_of_War_logo|favicon|Resource_)/i

async function fetchPage(page) {
  const response = await fetch(`${WIKI_ROOT}/wiki/${page}.html`)

  if (!response.ok) {
    throw new Error(`Страница ${page} вернула ${response.status}`)
  }

  return response.text()
}

/** Имена файлов картинок страницы без префикса images/ и без мусора. */
function listImages(html) {
  const found = html.matchAll(/<img[^>]*src="([^"]+)"/g)

  return new Set(
    [...found]
      .map((match) => match[1].replace(/^.*images\//, ''))
      .filter((name) => !IGNORED.test(name) && /\.(jpg|jpeg|png|gif)$/i.test(name)),
  )
}

/**
 * Скачивает картинку и сохраняет её под идентификатором хоткея.
 * Расширение берём из ответа, а не из имени: вики отдаёт то, чему сам файл является.
 */
async function download(wikiName, bindingId) {
  const response = await fetch(`${WIKI_ROOT}/wiki/images/${wikiName}`)

  if (!response.ok) {
    return { ok: false, status: response.status }
  }

  const type = response.headers.get('content-type') ?? ''

  // Без проверки Content-Type сайт отдаёт HTML-заглушку, и «картинка» не откроется.
  if (!type.startsWith('image/')) {
    return { ok: false, status: response.status, reason: `не изображение, а ${type}` }
  }

  const extension = type.includes('png') ? 'png' : 'jpg'
  const bytes = Buffer.from(await response.arrayBuffer())

  if (bytes.length === 0) {
    return { ok: false, status: response.status }
  }

  await writeFile(join(OUTPUT_DIR, `${bindingId}.${extension}`), bytes)

  return { ok: true, extension, bytes: bytes.length }
}

async function main() {
  const requested = process.argv
    .slice(2)
    .filter((argument) => argument.startsWith('--faction='))
    .map((argument) => argument.slice('--faction='.length))

  const factions = requested.length > 0 ? requested : ['marine']

  await mkdir(OUTPUT_DIR, { recursive: true })

  for (const faction of factions) {
    const page = FACTION_PAGES[faction]

    if (!page) {
      console.error(`Неизвестная фракция: ${faction}`)
      continue
    }

    const available = listImages(await fetchPage(page))
    const mapping = FACTION_ICONS[faction] ?? {}

    console.log(`\n=== ${faction} (${page}) ===`)
    console.log(`Картинок на странице: ${available.size}`)

    const claimed = new Set()
    let downloaded = 0

    for (const [wikiName, bindingId] of Object.entries(mapping)) {
      const match = [...available].find(
        (name) => name.slice(0, name.length - extname(name).length).toLowerCase() === wikiName.toLowerCase(),
      )

      if (!match) {
        console.error(`  НЕТ НА САЙТЕ: ${wikiName} → ${bindingId}`)
        continue
      }

      claimed.add(match)

      const result = await download(match, bindingId)

      if (result.ok) {
        downloaded += 1
      } else {
        console.error(`  ОШИБКА ${match} → ${bindingId}: ${result.reason ?? `HTTP ${result.status}`}`)
      }
    }

    const banner = FACTION_BANNER[faction]
    const bannerName = banner && `${banner.toLowerCase()}.jpg`
    const bannerMatch = bannerName && [...available].find((name) => name.toLowerCase() === bannerName)

    if (bannerMatch) {
      const result = await download(bannerMatch, `faction_${faction}`)

      if (result.ok) {
        downloaded += 1
        claimed.add(bannerMatch)
      } else {
        console.error(`  ОШИБКА ${bannerMatch} → faction_${faction}: ${result.reason ?? `HTTP ${result.status}`}`)
      }
    }

    const unused = [...available].filter((name) => !claimed.has(name))

    console.log(`Скачано: ${downloaded}`)

    if (unused.length > 0) {
      console.log(`Не сопоставлено (${unused.length}): ${unused.join(', ')}`)
    }
  }
}

await main()