/** Профиль игрока: папка Profile1, Profile2 и так далее. */
export interface ProfileInfo {
  name: string
  directory: string
  displayName: string
  steamId: string | null
}

/** Карточка набора хоткеев в папке профиля. */
export interface HotkeySetSummary {
  fileName: string
  displayName: string
  version: string
  isBuiltIn: boolean
  bindingCount: number
  modifiedAtUtc: string | null
}

/** Набор, который приложение везёт с собой и предлагает основой. */
export interface HotkeySetPresetSummary {
  fileName: string
  displayName: string
  version: string
  bindingCount: number
}

/** Один редактируемый хоткей. */
export interface HotkeyEntry {
  id: string
  value: string
  /** Фракция по префиксу идентификатора: marine, dark_eldar и так далее. */
  group: string
  /** Раздел внутри фракции: Infantry, Vehicle, Building и прочие. */
  category: string
  iconUrl: string
}

/** Секция набора, восстановленная по комментариям исходного файла. */
export interface HotkeySection {
  title: string
  entries: HotkeyEntry[]
}

/** Содержимое набора, готовое к редактированию. */
export interface HotkeySetDetails {
  fileName: string
  displayName: string
  version: string
  isBuiltIn: boolean
  sections: HotkeySection[]
}

/** Клавиша, доступная для назначения. */
export interface KeyInfo {
  name: string
  category: string
  isModifier: boolean
}

export interface KeyCatalog {
  keys: KeyInfo[]
}

export interface GamePathsInfo {
  profilesRoot: string
  exists: boolean
  isCustom: boolean
  defaultProfilesRoot: string
}

/** Единый формат ошибки: по code интерфейс выбирает локализованный текст. */
export interface ApiError {
  code: string
  title: string
  detail: string | null
}