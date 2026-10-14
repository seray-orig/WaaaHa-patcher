/**
 * Адрес страницы и то, что он значит.
 *
 * Всё состояние навигации живёт в адресной строке: перезагрузка страницы оставляет
 * игрока там же, где он был, а кнопка «назад» работает как в браузере.
 *
 *   /                                профили
 *   /profiles/Profile1               наборы хоткеев
 *   /profiles/Profile1?create=1      наборы хоткеев, открыто окно создания
 *   /profiles/Profile1/MY_HOTKEYS.LUA редактор набора
 */
export type Route =
  | { name: 'profiles' }
  | { name: 'sets'; profileName: string; creating: boolean }
  | { name: 'editor'; profileName: string; fileName: string }

const ROOT = 'profiles'

export function parseRoute(pathname: string, search: string): Route {
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .map(decodeSegment)

  if (segments[0] !== ROOT || !segments[1]) {
    return { name: 'profiles' }
  }

  const profileName = segments[1]

  if (!segments[2]) {
    return { name: 'sets', profileName, creating: new URLSearchParams(search).has('create') }
  }

  return { name: 'editor', profileName, fileName: segments[2] }
}

export function routeToUrl(route: Route): string {
  if (route.name === 'profiles') {
    return '/'
  }

  const profile = encodeURIComponent(route.profileName)

  if (route.name === 'sets') {
    return `/profiles/${profile}${route.creating ? '?create=1' : ''}`
  }

  return `/profiles/${profile}/${encodeURIComponent(route.fileName)}`
}

export function currentUrl(): string {
  return `${window.location.pathname}${window.location.search}`
}

/** Имя файла в адресе может оказаться битым — такие адреса просто ведут на главную. */
function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment)
  } catch {
    return ''
  }
}
