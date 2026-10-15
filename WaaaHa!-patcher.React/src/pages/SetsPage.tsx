import { useCallback, useEffect, useState } from 'react'
import { HotkeyApiError, hotkeySetsApi } from '../api/client'
import type { HotkeySetSummary, ProfileInfo } from '../api/types'
import { ConfirmDialog, ErrorBanner, LanguageSwitcher, Modal } from '../components/Common'
import { useConfirm } from '../hooks/useConfirm'
import { builtInNameKey } from '../hotkeys/builtInSets'
import { useLocale } from '../i18n/localeContext'

interface SetsPageProps {
  profile: ProfileInfo
  /** Окно создания открыто? Признак живёт в адресе, а не в состоянии страницы. */
  creating: boolean
  onBack: () => void
  onCreate: () => void
  onCancelCreate: () => void
  onOpen: (fileName: string) => void
}

export function SetsPage({
  profile,
  creating,
  onBack,
  onCreate,
  onCancelCreate,
  onOpen,
}: SetsPageProps) {
  const { t } = useLocale()
  const [sets, setSets] = useState<HotkeySetSummary[]>([])
  const [error, setError] = useState<HotkeyApiError | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const confirm = useConfirm()

  const reload = useCallback(async () => {
    setError(null)

    try {
      setSets(await hotkeySetsApi.list(profile.name))
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    } finally {
      setLoading(false)
    }
  }, [profile.name])

  useEffect(() => {
    void reload()
  }, [reload])

  const custom = sets.filter((set) => !set.isBuiltIn)
  const builtIn = sets.filter((set) => set.isBuiltIn)

  async function remove(set: HotkeySetSummary) {
    const accepted = await confirm.ask(t('sets.deleteConfirm', { name: set.displayName || set.fileName }))

    if (!accepted) {
      return
    }

    try {
      await hotkeySetsApi.remove(profile.name, set.fileName)
      setNotice(t('sets.deleted'))
      await reload()
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    }
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn--ghost" type="button" onClick={onBack}>
          ← {t('common.back')}
        </button>
        <div className="topbar__title">
          <h1>{t('sets.title')}</h1>
          <span>
            {profile.displayName} · {profile.name}
          </span>
        </div>
        <div className="topbar__spacer" />
        <LanguageSwitcher />
        <button className="btn btn--primary" type="button" onClick={onCreate}>
          + {t('sets.new')}
        </button>
      </header>

      <main className="content">
        {error && <ErrorBanner code={error.code} title={error.message} detail={error.detail} />}
        {notice && <div className="banner banner--success">{notice}</div>}

        {loading && <div className="empty-state">{t('common.loading')}</div>}

        <SetGroup
          title={t('sets.custom')}
          sets={custom}
          emptyText={t('sets.empty')}
          onOpen={(set) => onOpen(set.fileName)}
          onRemove={remove}
          onCreate={onCreate}
        />

        <SetGroup
          title={t('sets.builtIn')}
          sets={builtIn}
          emptyText={t('common.empty')}
          onOpen={(set) => onOpen(set.fileName)}
        />
      </main>

      {creating && (
        <CreateSetModal
          profile={profile}
          customSets={custom}
          builtInSets={builtIn}
          onClose={onCancelCreate}
          onCreated={(fileName, displayName) => {
            setNotice(t('sets.created', { name: displayName }))
            void reload()
            onOpen(fileName)
          }}
        />
      )}

      {confirm.question && (
        <ConfirmDialog
          confirm={confirm}
          title={t('common.delete')}
          confirmLabel={t('common.delete')}
          cancelLabel={t('common.cancel')}
        />
      )}
    </div>
  )
}

function SetGroup({
  title,
  sets,
  emptyText,
  onOpen,
  onRemove,
  onCreate,
}: {
  title: string
  sets: HotkeySetSummary[]
  emptyText: string
  onOpen: (set: HotkeySetSummary) => void
  onRemove?: (set: HotkeySetSummary) => void
  onCreate?: () => void
}) {
  const { t } = useLocale()

  /** У встроенных наборов bindings_locstring хранит $id локализации, а не текст. */
  const titleOf = (set: HotkeySetSummary) => {
    const key = builtInNameKey(set.displayName)

    return (key && t(key)) || set.displayName || set.fileName
  }

  return (
    <section className="panel sets-group">
      <div className="panel__head">
        <h2>{title}</h2>
        <span className="tag">{sets.length}</span>
        {onCreate && (
          <>
            <div className="topbar__spacer" />
            <button className="btn btn--ghost" type="button" onClick={onCreate}>
              + {t('sets.new')}
            </button>
          </>
        )}
      </div>

      <div className="panel__body">
        {sets.length === 0 ? (
          <div className="empty-state">{emptyText}</div>
        ) : (
          <div className="grid-cards">
            {sets.map((set) => (
              <div key={set.fileName} className="set-card">
                <button
                  type="button"
                  className="card set-card__main"
                  onClick={() => onOpen(set)}
                >
                  <span className="card__title">{titleOf(set)}</span>
                  <span className="card__meta">
                    <span className="tag">{set.fileName}</span>
                    <span>
                      {set.bindingCount} {t('sets.bindings')}
                    </span>
                  </span>
                  {set.modifiedAtUtc && (
                    <span className="card__meta">
                      {t('sets.updated')}: {new Date(set.modifiedAtUtc).toLocaleString()}
                    </span>
                  )}
                </button>

                {onRemove && (
                  <button
                    type="button"
                    className="btn btn--ghost btn--danger set-card__remove"
                    onClick={() => onRemove(set)}
                  >
                    {t('common.delete')}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function CreateSetModal({
  profile,
  customSets,
  builtInSets,
  onClose,
  onCreated,
}: {
  profile: ProfileInfo
  customSets: HotkeySetSummary[]
  builtInSets: HotkeySetSummary[]
  onClose: () => void
  onCreated: (fileName: string, displayName: string) => void
}) {
  const { t } = useLocale()
  const [fileName, setFileName] = useState('')
  const [displayName, setDisplayName] = useState('')
  // Свой набор под рукой — самая частая основа: правки идут по кругу, и начинать
  // каждый раз заново с файла игры незачем.
  const [baseFileName, setBaseFileName] = useState(
    customSets[0]?.fileName ?? builtInSets[0]?.fileName ?? '',
  )
  const [error, setError] = useState<HotkeyApiError | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError(null)

    try {
      const created = await hotkeySetsApi.create(
        profile.name,
        fileName.trim(),
        displayName.trim(),
        baseFileName,
      )

      onCreated(created.fileName, created.displayName)
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={t('sets.newTitle')}
      onClose={onClose}
      footer={
        <>
          <button className="btn" type="button" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            className="btn btn--primary"
            type="button"
            disabled={busy || !fileName.trim() || !displayName.trim()}
            onClick={() => void submit()}
          >
            {t('common.create')}
          </button>
        </>
      }
    >
      {error && <ErrorBanner code={error.code} title={error.message} detail={error.detail} />}

      <div className="field">
        <label className="field__label" htmlFor="set-name">
          {t('sets.newDisplayName')}
        </label>
        <input
          id="set-name"
          className="input"
          value={displayName}
          maxLength={64}
          autoFocus
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <span className="field__hint">{t('sets.newDisplayNameHint')}</span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="set-file">
          {t('sets.newFileName')}
        </label>
        <input
          id="set-file"
          className="input"
          value={fileName}
          placeholder="MY_HOTKEYS"
          onChange={(event) => setFileName(event.target.value)}
        />
        <span className="field__hint">{t('sets.newFileNameHint')}</span>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="set-base">
          {t('sets.basedOn')}
        </label>
        <select
          id="set-base"
          className="input"
          value={baseFileName}
          onChange={(event) => setBaseFileName(event.target.value)}
        >
          {customSets.length > 0 && (
            <optgroup label={t('sets.custom')}>
              {customSets.map((option) => (
                <option key={option.fileName} value={option.fileName}>
                  {option.displayName || option.fileName} ({option.fileName})
                </option>
              ))}
            </optgroup>
          )}
          <optgroup label={t('sets.builtIn')}>
            {builtInSets.map((option) => {
              const key = builtInNameKey(option.displayName)

              return (
                <option key={option.fileName} value={option.fileName}>
                  {(key && t(key)) || option.displayName} ({option.fileName})
                </option>
              )
            })}
          </optgroup>
        </select>
        <span className="field__hint">{t('sets.newBaseHint')}</span>
      </div>
    </Modal>
  )
}