import { useCallback, useEffect, useMemo, useState } from 'react'
import { HotkeyApiError, hotkeySetsApi } from '../api/client'
import type { HotkeyEntry, HotkeySetDetails, ProfileInfo } from '../api/types'
import { ErrorBanner, LanguageSwitcher } from '../components/Common'
import { HotkeyTile } from '../components/HotkeyTile'
import { useKeyCapture } from '../hooks/useKeyCapture'
import { shortLabel } from '../hotkeys/keyboard'
import { useLocale } from '../i18n/localeContext'
import type { TranslationKey } from '../i18n/dictionaries'
import './editor.css'

type FilterKey = 'all' | 'faction' | 'taskbar' | 'buildings' | 'research' | 'upgrades' | 'camera'

const FILTERS: { key: FilterKey; labelKey: TranslationKey; matches: (entry: HotkeyEntry) => boolean }[] =
  [
    { key: 'all', labelKey: 'editor.filterAll', matches: () => true },
    {
      key: 'faction',
      labelKey: 'editor.filterFaction',
      matches: (entry) => entry.group !== 'common' && entry.group !== 'camera',
    },
    { key: 'taskbar', labelKey: 'editor.filterTaskbar', matches: (entry) => entry.group === 'common' },
    {
      key: 'buildings',
      labelKey: 'editor.filterBuildings',
      matches: (entry) => /(hq|armoury|armory|barracks|temple|chapel|shrine|generator|foundry|core|factory|workshop|platform|gate)$/i.test(
        entry.id,
      ),
    },
    {
      key: 'research',
      labelKey: 'editor.filterResearch',
      matches: (entry) => /research|upgrade|study/i.test(entry.id),
    },
    { key: 'camera', labelKey: 'editor.filterCamera', matches: (entry) => entry.group === 'camera' },
  ]

interface EditorPageProps {
  profile: ProfileInfo
  fileName: string
  onBack: () => void
  onDuplicate: () => void
}

export function EditorPage({ profile, fileName, onBack, onDuplicate }: EditorPageProps) {
  const { t } = useLocale()
  const [details, setDetails] = useState<HotkeySetDetails | null>(null)
  const [error, setError] = useState<HotkeyApiError | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')
  const [onlyChanged, setOnlyChanged] = useState(false)
  const [capturingId, setCapturingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [original, setOriginal] = useState<Record<string, string>>({})

  const readOnly = details?.isBuiltIn ?? true

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const loaded = await hotkeySetsApi.get(profile.name, fileName)
      setDetails(loaded)
      setDraftName(loaded.displayName)
      setOriginal(Object.fromEntries(flatten(loaded).map((entry) => [entry.id, entry.value])))
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    } finally {
      setLoading(false)
    }
  }, [profile.name, fileName])

  useEffect(() => {
    void load()
  }, [load])

  const entries = useMemo(() => (details ? flatten(details) : []), [details])

  const changed = useMemo(
    () => entries.filter((entry) => original[entry.id] !== entry.value),
    [entries, original],
  )

  function applyValue(id: string, value: string) {
    setDetails((current) =>
      current === null
        ? current
        : {
            ...current,
            sections: current.sections.map((section) => ({
              ...section,
              entries: section.entries.map((entry) => (entry.id === id ? { ...entry, value } : entry)),
            })),
          },
    )
  }

  useKeyCapture(capturingId, {
    onChord: (value) => {
      if (capturingId) {
        applyValue(capturingId, value)
      }
    },
    onCancel: () => setCapturingId(null),
  })

  const visibleSections = useMemo(() => {
    if (!details) {
      return []
    }

    const matcher = FILTERS.find((item) => item.key === filter)?.matches ?? (() => true)
    const needle = search.trim().toLowerCase()

    return details.sections
      .map((section) => ({
        ...section,
        entries: section.entries.filter(
          (entry) =>
            matcher(entry) &&
            (!needle ||
              entry.id.toLowerCase().includes(needle) ||
              section.title.toLowerCase().includes(needle)) &&
            (!onlyChanged || original[entry.id] !== entry.value),
        ),
      }))
      .filter((section) => section.entries.length > 0)
  }, [details, filter, search, onlyChanged, original])

  const isDirty = changed.length > 0 || draftName !== (details?.displayName ?? '')

  async function save() {
    if (!details) {
      return
    }

    setSaving(true)
    setError(null)
    setNotice(null)

    try {
      const bindings = Object.fromEntries(changed.map((entry) => [entry.id, entry.value]))
      const saved = await hotkeySetsApi.save(profile.name, fileName, draftName, bindings)

      setDetails(saved)
      setDraftName(saved.displayName)
      setOriginal(Object.fromEntries(flatten(saved).map((entry) => [entry.id, entry.value])))
      setNotice(t('editor.saved'))
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="empty-state">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn--ghost" type="button" onClick={onBack}>
          ← {t('common.back')}
        </button>
        <div className="topbar__title">
          <h1>{details?.displayName || fileName}</h1>
          <span>
            {profile.displayName} · {fileName}
          </span>
        </div>
        <div className="topbar__spacer" />
        <LanguageSwitcher />
        {readOnly ? (
          <button className="btn btn--primary" type="button" onClick={onDuplicate}>
            {t('editor.duplicate')}
          </button>
        ) : (
          <button
            className="btn btn--primary"
            type="button"
            disabled={saving || !isDirty}
            onClick={() => void save()}
          >
            {t('common.save')}
          </button>
        )}
      </header>

      <main className="content">
        {error && <ErrorBanner code={error.code} title={error.message} detail={error.detail} />}
        {notice && <div className="banner banner--success">{notice}</div>}

        {readOnly && <div className="banner banner--info">{t('editor.readOnly')}</div>}

        <div className="editor">
          <section className="panel">
            <div className="panel__head">
              <h2>{t('editor.title')}</h2>
              <span className="tag">{entries.length}</span>
              <div className="topbar__spacer" />
              {!readOnly && (
                <span className="tag">
                  {t('editor.changedCount', { count: changed.length })}
                </span>
              )}
            </div>

            <div className="panel__body">
              <div className="editor__toolbar">
                <input
                  className="input editor__search"
                  value={search}
                  placeholder={t('editor.searchPlaceholder')}
                  onChange={(event) => setSearch(event.target.value)}
                />

                {!readOnly && (
                  <label className="small muted editor__changed-toggle">
                    <input
                      type="checkbox"
                      checked={onlyChanged}
                      onChange={(event) => setOnlyChanged(event.target.checked)}
                    />{' '}
                    {t('editor.showOnlyChanged')}
                  </label>
                )}
              </div>

              <div className="editor__filters" style={{ marginTop: 12 }}>
                {FILTERS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`filter-chip ${filter === item.key ? 'filter-chip--active' : ''}`}
                    onClick={() => setFilter(item.key)}
                  >
                    {t(item.labelKey)}
                  </button>
                ))}
              </div>

              <p className="small muted" style={{ marginTop: 12 }}>
                {t('editor.captureHint')}
              </p>

              {visibleSections.length === 0 && (
                <div className="empty-state">{t('editor.noResults')}</div>
              )}

              {visibleSections.map((section) => (
                <div className="section" key={section.title + section.entries[0].id}>
                  <div className="section__head">
                    <span className="section__title">{section.title || t('editor.sectionUntitled')}</span>
                    <span className="section__count">{section.entries.length}</span>
                  </div>

                  <div className="hotkey-grid">
                    {section.entries.map((entry) => (
                      <HotkeyTile
                        key={entry.id}
                        entry={entry}
                        isCapturing={capturingId === entry.id}
                        isChanged={original[entry.id] !== entry.value}
                        isReadOnly={readOnly}
                        onCapture={() => setCapturingId(entry.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="panel">
            <div className="panel__head">
              <h2>{t('editor.setName')}</h2>
            </div>

            <div className="panel__body">
              <div className="field">
                <input
                  className="input"
                  value={draftName}
                  disabled={readOnly}
                  maxLength={64}
                  onChange={(event) => setDraftName(event.target.value)}
                />
              </div>

              <div className="binding-list" style={{ marginTop: 14 }}>
                {visibleSections.flatMap((section) =>
                  section.entries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`binding-row ${capturingId === entry.id ? 'binding-row--capturing' : ''}`}
                      onClick={() => !readOnly && setCapturingId(entry.id)}
                    >
                      <span className="binding-row__id">
                        <span className="binding-row__title">{shortLabel(entry.id, 40)}</span>
                        <code>{entry.id}</code>
                      </span>
                      <span
                        className={[
                          'binding-row__key',
                          entry.value === '' ? 'binding-row__key--empty' : '',
                          original[entry.id] !== entry.value ? 'binding-row__key--changed' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {entry.value === '' ? '—' : entry.value}
                      </span>
                    </button>
                  )),
                )}
              </div>

              {isDirty && !readOnly && (
                <p className="small muted" style={{ marginTop: 12 }}>
                  {t('editor.unsaved')}
                </p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function flatten(details: HotkeySetDetails): HotkeyEntry[] {
  return details.sections.flatMap((section) => section.entries)
}