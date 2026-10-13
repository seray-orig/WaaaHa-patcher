import { useCallback, useEffect, useState } from 'react'
import { HotkeyApiError, gameApi, profileApi } from '../api/client'
import type { GamePathsInfo, ProfileInfo } from '../api/types'
import { ErrorBanner, LanguageSwitcher, Modal } from '../components/Common'
import { useLocale } from '../i18n/localeContext'

interface ProfilesPageProps {
  onSelect: (profile: ProfileInfo) => void
}

export function ProfilesPage({ onSelect }: ProfilesPageProps) {
  const { t } = useLocale()
  const [paths, setPaths] = useState<GamePathsInfo | null>(null)
  const [profiles, setProfiles] = useState<ProfileInfo[]>([])
  const [error, setError] = useState<HotkeyApiError | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPath, setEditingPath] = useState(false)
  const [pathDraft, setPathDraft] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const loadedPaths = await gameApi.getPaths()
      setPaths(loadedPaths)

      if (loadedPaths.exists) {
        setProfiles(await profileApi.getProfiles())
      }
    } catch (reason) {
      setError(reason instanceof HotkeyApiError ? reason : null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  async function applyPath() {
    setError(null)

    try {
      setPaths(await gameApi.setPaths(pathDraft.trim()))
      setEditingPath(false)
      await reload()
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    }
  }

  async function resetPath() {
    setError(null)

    try {
      const defaults = await gameApi.getDefaultPaths()
      setPathDraft(defaults)
    } catch {
      setError(new HotkeyApiError('GameFolderNotFound', t('profiles.folderNotFound'), null, 404))
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__title">
          <h1>{t('app.title')}</h1>
          <span>{t('app.subtitle')}</span>
        </div>
        <div className="topbar__spacer" />
        <LanguageSwitcher />
      </header>

      <main className="content">
        {error && <ErrorBanner code={error.code} title={error.message} detail={error.detail} />}

        <div className="panel">
          <div className="panel__head">
            <h2>{t('profiles.title')}</h2>
            <div className="topbar__spacer" />
            <button className="btn btn--ghost" type="button" onClick={() => void reload()}>
              {t('common.retry')}
            </button>
          </div>

          <div className="panel__body">
            <p className="muted">{t('profiles.subtitle')}</p>

            {paths && (
              <div className="path-row">
                <span className="path-row__label">{t('profiles.folder')}</span>
                <code className={`path-row__value ${paths.exists ? '' : 'path-row__value--missing'}`}>
                  {paths.profilesRoot}
                </code>
                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={() => {
                    setPathDraft(paths.profilesRoot)
                    setEditingPath(true)
                  }}
                >
                  {t('profiles.changeFolder')}
                </button>
              </div>
            )}

            {loading && <div className="empty-state">{t('common.loading')}</div>}

            {!loading && profiles.length === 0 && (
              <div className="empty-state">{t('profiles.empty')}</div>
            )}

            <div className="grid-cards">
              {profiles.map((profile) => (
                <button
                  key={profile.name}
                  type="button"
                  className="card"
                  onClick={() => onSelect(profile)}
                >
                  <span className="card__title">{profile.displayName}</span>
                  <span className="card__meta">
                    <span className="tag">{profile.name}</span>
                    {profile.steamId && <span className="tag tag--gold">{t('profiles.steam')}</span>}
                  </span>
                  <span className="card__meta card__path">{profile.directory}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {editingPath && (
        <Modal
          title={t('profiles.changeFolder')}
          onClose={() => setEditingPath(false)}
          footer={
            <>
              <button className="btn" type="button" onClick={() => void resetPath()}>
                {t('common.retry')}
              </button>
              <button className="btn btn--primary" type="button" onClick={() => void applyPath()}>
                {t('common.confirm')}
              </button>
            </>
          }
        >
          <div className="field">
            <label className="field__label" htmlFor="profiles-path">
              {t('profiles.folderPrompt')}
            </label>
            <input
              id="profiles-path"
              className="input"
              value={pathDraft}
              autoFocus
              onChange={(event) => setPathDraft(event.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  )
}