import { useCallback, useEffect, useState } from 'react'
import { HotkeyApiError, gameApi, profileApi } from '../api/client'
import type { GamePathsInfo, ProfileInfo } from '../api/types'

export interface GameData {
  paths: GamePathsInfo | null
  profiles: ProfileInfo[]
  loading: boolean
  error: HotkeyApiError | null
  reload: () => Promise<void>
}

/**
 * Папка профилей и список профилей.
 *
 * Живёт в одном месте, потому что страницы нуждаются в этих данных по-разному:
 * главной нужны оба значения, а редактору — только профиль по имени из адреса.
 */
export function useGameData(): GameData {
  const [paths, setPaths] = useState<GamePathsInfo | null>(null)
  const [profiles, setProfiles] = useState<ProfileInfo[]>([])
  const [error, setError] = useState<HotkeyApiError | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const loadedPaths = await gameApi.getPaths()
      setPaths(loadedPaths)

      setProfiles(loadedPaths.exists ? await profileApi.getProfiles() : [])
    } catch (reason) {
      setError(reason instanceof HotkeyApiError ? reason : null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { paths, profiles, loading, error, reload }
}
