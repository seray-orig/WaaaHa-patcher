import { useEffect, useMemo, useState } from 'react'
import { HotkeyApiError, hotkeySetsApi } from '../api/client'
import type { HotkeyEntry, HotkeySetDetails, ProfileInfo } from '../api/types'
import { ErrorBanner, LanguageSwitcher, LoadingScreen } from '../components/Common'
import { FactionBar } from '../components/FactionBar'
import { HotkeyIcon } from '../components/HotkeyIcon'
import { HotkeyTile } from '../components/HotkeyTile'
import { useKeyCapture } from '../hooks/useKeyCapture'
import {
  CATEGORY_ORDER,
  commandsForUnit,
  factionTotals,
  indexHotkeys,
  type CategoryKey,
  type IndexedHotkeys,
} from '../gameData/hotkeyIndex'
import type { FactionKey } from '../gameData/factions'
import { shortLabel } from '../hotkeys/keyboard'
import { builtInNameKey } from '../hotkeys/builtInSets'
import type { TranslationKey } from '../i18n/dictionaries'
import { useLocale } from '../i18n/localeContext'
import { parseSectionTitle } from '../i18n/sectionTitles'
import './editor.css'
import '../components/faction.css'

const CATEGORY_LABELS: Record<CategoryKey, TranslationKey> = {
  Infantry: 'tab.infantry',
  Vehicle: 'tab.vehicle',
  Building: 'tab.building',
  Ability: 'tab.ability',
  Research: 'tab.research',
  WeaponUpgrade: 'tab.weaponUpgrade',
  Addon: 'tab.addon',
  System: 'tab.command',
}

/** Куда игрок сейчас смотрит. Всё состояние навигации живёт здесь. */
type View =
  | { kind: 'factions' }
  | { kind: 'all' }
  | { kind: 'command' }
  | { kind: 'faction'; faction: FactionKey; category: CategoryKey }
  | { kind: 'unit'; faction: FactionKey; unitId: string }

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
  const [onlyChanged, setOnlyChanged] = useState(false)
  const [capturingId, setCapturingId] = useState<string | null>(null)
  const [view, setView] = useState<View>({ kind: 'factions' })
  const [draftName, setDraftName] = useState('')
  const [original, setOriginal] = useState<Record<string, string>>({})

  const readOnly = details?.isBuiltIn ?? true

  useEffect(() => {
    let cancelled = false

    hotkeySetsApi
      .get(profile.name, fileName)
      .then((loaded) => {
        if (cancelled) {
          return
        }

        setDetails(loaded)
        setDraftName(loaded.displayName)
        setOriginal(Object.fromEntries(entriesOf(loaded).map((entry) => [entry.id, entry.value])))
      })
      .catch((reason: unknown) => {
        if (!cancelled && reason instanceof HotkeyApiError) {
          setError(reason)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [profile.name, fileName])

  const indexed = useMemo(() => (details ? indexHotkeys(details) : null), [details])
  const entries = useMemo(() => (details ? entriesOf(details) : []), [details])
  const changed = useMemo(
    () => entries.filter((entry) => original[entry.id] !== entry.value),
    [entries, original],
  )
  const totals = useMemo(() => (indexed ? factionTotals(indexed) : new Map<FactionKey, number>()), [indexed])

  useKeyCapture(capturingId, {
    onChord: (value) => {
      if (capturingId) {
        applyValue(capturingId, value)
      }

      // Хоткей назначен — режим ожидания снимаем, иначе следующее нажатие перезаписало
      // бы только что поставленную комбинацию.
      setCapturingId(null)
    },
    onCancel: () => setCapturingId(null),
  })

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
      setOriginal(Object.fromEntries(entriesOf(saved).map((entry) => [entry.id, entry.value])))
      setNotice(t('editor.saved'))
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading || !indexed) {
    return <LoadingScreen />
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn btn--ghost" type="button" onClick={onBack}>
          ← {t('common.back')}
        </button>
        <div className="topbar__title">
          <h1>{setTitle(details?.displayName, fileName, t)}</h1>
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
                <span className="tag">{t('editor.changedCount', { count: changed.length })}</span>
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
                  <label className="small muted">
                    <input
                      type="checkbox"
                      checked={onlyChanged}
                      onChange={(event) => setOnlyChanged(event.target.checked)}
                    />{' '}
                    {t('editor.showOnlyChanged')}
                  </label>
                )}
              </div>

              <p className="small muted" style={{ margin: '10px 0 0' }}>
                {t('editor.captureHint')}
              </p>

              <Breadcrumbs view={view} onNavigate={setView} />

              {view.kind === 'factions' && (
                <FactionPicker
                  totals={totals}
                  commandCount={countAll(indexed.systemSections)}
                  allCount={indexed.all.length}
                  onFaction={(faction) => setView({ kind: 'faction', faction, category: 'Infantry' })}
                  onCommand={() => setView({ kind: 'command' })}
                  onAll={() => setView({ kind: 'all' })}
                />
              )}

              {view.kind === 'all' && (
                <EverythingPanel
                  indexed={indexed}
                  search={search}
                  onlyChanged={onlyChanged}
                  original={original}
                  capturingId={capturingId}
                  readOnly={readOnly}
                  onCapture={setCapturingId}
                />
              )}

              {view.kind === 'command' && (
                <CommandPanel
                  indexed={indexed}
                  search={search}
                  onlyChanged={onlyChanged}
                  original={original}
                  capturingId={capturingId}
                  readOnly={readOnly}
                  onCapture={setCapturingId}
                />
              )}

              {view.kind === 'faction' && (
                <FactionBrowser
                  faction={view.faction}
                  category={view.category}
                  indexed={indexed}
                  search={search}
                  onlyChanged={onlyChanged}
                  original={original}
                  capturingId={capturingId}
                  readOnly={readOnly}
                  onCategory={(category) => setView({ ...view, category })}
                  onOpenUnit={(unitId) => setView({ kind: 'unit', faction: view.faction, unitId })}
                  onCapture={setCapturingId}
                />
              )}

              {view.kind === 'unit' && (
                <UnitPanel
                  unitId={view.unitId}
                  faction={view.faction}
                  indexed={indexed}
                  original={original}
                  capturingId={capturingId}
                  readOnly={readOnly}
                  onCapture={setCapturingId}
                />
              )}
            </div>
          </section>

          <aside className="panel">
            <div className="panel__head">
              <h2>{t('editor.setName')}</h2>
            </div>

            <div className="panel__body">
              <input
                className="input"
                value={draftName}
                disabled={readOnly}
                maxLength={64}
                onChange={(event) => setDraftName(event.target.value)}
              />

              <div className="binding-list" style={{ marginTop: 14 }}>
                {entries
                  .filter((entry) => matchesSearch(entry, search))
                  .slice(0, 400)
                  .map((entry) => (
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
                  ))}
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

/** Стартовый экран: девять рас плюс панель команд и полный список. */
function FactionPicker({
  totals,
  commandCount,
  allCount,
  onFaction,
  onCommand,
  onAll,
}: {
  totals: Map<FactionKey, number>
  commandCount: number
  allCount: number
  onFaction: (faction: FactionKey) => void
  onCommand: () => void
  onAll: () => void
}) {
  const { t } = useLocale()

  return (
    <div style={{ marginTop: 14 }}>
      <FactionBar counts={totals} active={null} onSelect={onFaction} />

      <div className="editor__filters">
        <button type="button" className="filter-chip" onClick={onCommand}>
          {t('tab.command')} · {commandCount}
        </button>

        <button type="button" className="filter-chip" onClick={onAll}>
          {t('tab.all')} · {allCount}
        </button>
      </div>
    </div>
  )
}

/** Полный список набора без разбивки по фракциям. */
function EverythingPanel({
  indexed,
  search,
  onlyChanged,
  original,
  capturingId,
  readOnly,
  onCapture,
}: GridProps & { indexed: IndexedHotkeys }) {
  const { t } = useLocale()
  const list = filterEntries(indexed.all, search, onlyChanged, original)

  return (
    <EntryGrid
      entries={list}
      capturingId={capturingId}
      readOnly={readOnly}
      original={original}
      onCapture={onCapture}
      emptyText={t('editor.noResults')}
    />
  )
}

/** Панель команд с переведёнными названиями разделов файла. */
function CommandPanel({
  indexed,
  search,
  onlyChanged,
  original,
  capturingId,
  readOnly,
  onCapture,
}: {
  indexed: IndexedHotkeys
  search: string
  onlyChanged: boolean
  original: Record<string, string>
  capturingId: string | null
  readOnly: boolean
  onCapture: (id: string | null) => void
}) {
  const { t } = useLocale()
  const visible = indexed.systemSections
    .map((section) => ({
      title: section.title,
      entries: filterEntries(section.entries, search, onlyChanged, original),
    }))
    .filter((section) => section.entries.length > 0)

  if (visible.length === 0) {
    return <div className="empty-state">{t('editor.noResults')}</div>
  }

  return (
    <>
      {visible.map((section) => (
        <div className="section" key={section.title}>
          <div className="section__head">
            <span className="section__title">{translateSection(section.title, section.entries, t)}</span>
            <span className="section__count">{section.entries.length}</span>
          </div>

          <EntryGrid
            entries={section.entries}
            capturingId={capturingId}
            readOnly={readOnly}
            original={original}
            onCapture={onCapture}
            emptyText={t('common.empty')}
          />
        </div>
      ))}
    </>
  )
}

/** Внутри фракции: вкладки разделов и сетка войск. */
function FactionBrowser({
  faction,
  category,
  indexed,
  search,
  onlyChanged,
  original,
  capturingId,
  readOnly,
  onCategory,
  onOpenUnit,
  onCapture,
}: GridProps & {
  faction: FactionKey
  category: CategoryKey
  indexed: IndexedHotkeys
  onCategory: (category: CategoryKey) => void
  onOpenUnit: (unitId: string) => void
}) {
  const { t } = useLocale()
  const categories = indexed.byFaction.get(faction) ?? new Map<CategoryKey, HotkeyEntry[]>()
  const available = CATEGORY_ORDER.filter((category) => (categories.get(category)?.length ?? 0) > 0)
  const active = available.includes(category) ? category : available[0]
  const list = active ? (categories.get(active) ?? []) : []

  return (
    <>
      <div className="editor__filters">
        {available.map((item) => (
          <button
            key={item}
            type="button"
            className={`filter-chip ${item === active ? 'filter-chip--active' : ''}`}
            onClick={() => onCategory(item)}
          >
            {t(CATEGORY_LABELS[item])} · {categories.get(item)!.length}
          </button>
        ))}
      </div>

      <p className="small muted" style={{ marginTop: 12 }}>
        {t('unit.selectHint')}
      </p>

      <EntryGrid
        entries={filterEntries(list, search, onlyChanged, original)}
        capturingId={capturingId}
        readOnly={readOnly}
        original={original}
        onCapture={onCapture}
        onOpen={onOpenUnit}
        emptyText={t('editor.noResults')}
      />
    </>
  )
}

/** Клавиши выбранного юнита или строения. */
function UnitPanel({
  unitId,
  faction,
  indexed,
  original,
  capturingId,
  readOnly,
  onCapture,
}: {
  unitId: string
  faction: FactionKey
  indexed: IndexedHotkeys
  original: Record<string, string>
  capturingId: string | null
  readOnly: boolean
  onCapture: (id: string | null) => void
}) {
  const { t } = useLocale()
  const unit = indexed.byId.get(unitId)

  if (!unit) {
    return <div className="empty-state">{t('common.empty')}</div>
  }

  const { commands, buildings } = commandsForUnit(unit, faction, indexed)

  return (
    <>
      <div className="unit-summary">
        <HotkeyIcon
          baseUrl={unit.iconUrl}
          className="unit-summary__icon"
          fallback={<span className="unit-summary__icon" />}
        />
        <span className="unit-summary__text">
          <span className="unit-summary__title">{shortLabel(unit.id, 48)}</span>
          <code className="unit-summary__id">{unit.id}</code>
        </span>
      </div>

      <div className="dependency-group">
        <div className="dependency-group__title">{t('unit.dependencies')}</div>
        <EntryGrid
          entries={commands}
          capturingId={capturingId}
          readOnly={readOnly}
          original={original}
          onCapture={onCapture}
          emptyText={t('common.empty')}
        />
      </div>

      {buildings.length > 0 && (
        <div className="dependency-group">
          <div className="dependency-group__title">{t('unit.canBuild')}</div>
          <EntryGrid
            entries={buildings}
            capturingId={capturingId}
            readOnly={readOnly}
            original={original}
            onCapture={onCapture}
            emptyText={t('common.empty')}
          />
        </div>
      )}
    </>
  )
}

interface GridProps {
  search: string
  onlyChanged: boolean
  original: Record<string, string>
  capturingId: string | null
  readOnly: boolean
  onCapture: (id: string | null) => void
}

function EntryGrid({
  entries,
  capturingId,
  readOnly,
  original,
  onCapture,
  onOpen,
  emptyText,
}: {
  entries: HotkeyEntry[]
  capturingId: string | null
  readOnly: boolean
  original: Record<string, string>
  onCapture: (id: string | null) => void
  onOpen?: (id: string) => void
  emptyText: string
}) {
  if (entries.length === 0) {
    return <div className="empty-state">{emptyText}</div>
  }

  return (
    <div className="hotkey-grid" style={{ marginTop: 12 }}>
      {entries.map((entry) => (
        <HotkeyTile
          key={entry.id}
          entry={entry}
          isCapturing={capturingId === entry.id}
          isChanged={original[entry.id] !== entry.value}
          isReadOnly={readOnly}
          onOpen={onOpen ? () => onOpen(entry.id) : undefined}
          onCapture={() => onCapture(entry.id)}
        />
      ))}
    </div>
  )
}

function Breadcrumbs({
  view,
  onNavigate,
}: {
  view: View
  onNavigate: (view: View) => void
}) {
  const { t } = useLocale()

  const items: { label: string; target: View }[] = [
    { label: t('tab.factions'), target: { kind: 'factions' } },
  ]

  if (view.kind === 'faction' || view.kind === 'unit') {
    items.push({
      label: t(`group.${view.faction}`),
      target: { kind: 'faction', faction: view.faction, category: 'Infantry' },
    })
  }

  if (view.kind === 'unit') {
    items.push({ label: shortLabel(view.unitId, 32), target: view })
  }

  if (view.kind === 'command') {
    items.push({ label: t('tab.command'), target: view })
  }

  if (view.kind === 'all') {
    items.push({ label: t('tab.all'), target: view })
  }

  return (
    <nav className="breadcrumbs" style={{ marginTop: 12 }}>
      {items.map((item, index) => (
        <span className="breadcrumbs__item" key={index}>
          {index > 0 && <span className="breadcrumbs__separator">›</span>}
          <button
            type="button"
            className="breadcrumbs__button"
            onClick={() => onNavigate(item.target)}
          >
            {item.label}
          </button>
        </span>
      ))}
    </nav>
  )
}

/**
 * Заголовок раздела приходит из файла по-английски — показываем перевод.
 * Фракцию в названии добавляем, только если она действительно есть внутри: в файле
 * встречаются разделы, куда попала команда без фракционного префикса, и приписывать
 * ей чужую расу было бы враньём.
 */
function translateSection(
  title: string,
  entries: HotkeyEntry[],
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
): string {
  const parsed = parseSectionTitle(title)

  if (!parsed) {
    return title
  }

  const base = t(parsed.sectionKey)

  if (!parsed.faction) {
    return base
  }

  const belongs = entries.some((entry) => entry.group === parsed.faction)

  return belongs ? `${base} — ${t(`group.${parsed.faction}`)}` : base
}

/** У встроенных наборов имя хранится как $id локализации — показываем перевод. */
function setTitle(
  displayName: string | undefined,
  fileName: string,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
): string {
  const key = builtInNameKey(displayName ?? '')

  return (key && t(key)) || displayName || fileName
}

function entriesOf(details: HotkeySetDetails): HotkeyEntry[] {
  return details.sections.flatMap((section) => section.entries)
}

function countAll(sections: { entries: HotkeyEntry[] }[]): number {
  return sections.reduce((total, section) => total + section.entries.length, 0)
}

function filterEntries(
  list: HotkeyEntry[],
  search: string,
  onlyChanged: boolean,
  original: Record<string, string>,
): HotkeyEntry[] {
  return list.filter(
    (entry) => matchesSearch(entry, search) && (!onlyChanged || original[entry.id] !== entry.value),
  )
}

function matchesSearch(entry: HotkeyEntry, search: string): boolean {
  const needle = search.trim().toLowerCase()

  return needle === '' || entry.id.toLowerCase().includes(needle)
}