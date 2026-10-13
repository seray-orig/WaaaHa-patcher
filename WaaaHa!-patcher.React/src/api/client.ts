import type {
  ApiError,
  GamePathsInfo,
  HotkeySetDetails,
  HotkeySetSummary,
  KeyCatalog,
  ProfileInfo,
} from './types'

/**
 * Ошибка запроса к локальному API. Код используется для выбора локализованного
 * сообщения, title остаётся запасным вариантом на случай неизвестного кода.
 */
export class HotkeyApiError extends Error {
  constructor(
    readonly code: string,
    title: string,
    readonly detail: string | null,
    readonly status: number,
  ) {
    super(title)
    this.name = 'HotkeyApiError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response

  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new HotkeyApiError('NetworkUnreachable', 'Сервер приложения недоступен', null, 0)
  }

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ApiError | null

    throw new HotkeyApiError(
      error?.code ?? 'Unknown',
      error?.title ?? response.statusText,
      error?.detail ?? null,
      response.status,
    )
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

const encode = encodeURIComponent

export const gameApi = {
  getPaths: () => request<GamePathsInfo>('/api/game/paths'),
  getDefaultPaths: () => request<string>('/api/game/paths/default'),
  setPaths: (profilesRoot: string) =>
    request<GamePathsInfo>('/api/game/paths', {
      method: 'POST',
      body: JSON.stringify({ profilesRoot }),
    }),
  getKeys: () => request<KeyCatalog>('/api/game/keys'),
}

export const profileApi = {
  getProfiles: () => request<ProfileInfo[]>('/api/profiles'),
}

export const hotkeySetsApi = {
  list: (profile: string) => request<HotkeySetSummary[]>(`/api/profiles/${encode(profile)}/sets`),
  get: (profile: string, fileName: string) =>
    request<HotkeySetDetails>(`/api/profiles/${encode(profile)}/sets/${encode(fileName)}`),
  create: (profile: string, fileName: string, displayName: string, baseFileName: string) =>
    request<HotkeySetDetails>(`/api/profiles/${encode(profile)}/sets`, {
      method: 'POST',
      body: JSON.stringify({ fileName, displayName, baseFileName }),
    }),
  save: (
    profile: string,
    fileName: string,
    displayName: string,
    bindings: Record<string, string>,
  ) =>
    request<HotkeySetDetails>(`/api/profiles/${encode(profile)}/sets/${encode(fileName)}`, {
      method: 'PUT',
      body: JSON.stringify({ displayName, bindings }),
    }),
  remove: (profile: string, fileName: string) =>
    request<void>(`/api/profiles/${encode(profile)}/sets/${encode(fileName)}`, { method: 'DELETE' }),
}