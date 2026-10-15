import { useEffect, useMemo, useState } from 'react'
import { HotkeyApiError, gameApi, hotkeySetsApi } from '../api/client'
import type { HotkeyEntry, HotkeySetDetails, KeyCatalog, ProfileInfo } from '../api/types'
import { ErrorBanner, LanguageSwitcher, LoadingScreen } from '../components/Common'
import { FactionBar } from '../components/FactionBar'
import { HotkeyTile } from '../components/HotkeyTile'
import { useKeyCapture } from '../hooks/useKeyCapture'
import {
  CATEGORY_ORDER,
  factionTotals,
  indexHotkeys,
  type CategoryKey,
  type IndexedHotkeys,
} from '../gameData/hotkeyIndex'
import type { FactionKey } from '../gameData/factions'
import {
  IMPROVEMENT_SLOTS,
  PANEL_SLOTS,
  UNIT_LAYOUTS,
  commandOf,
  rosterOf,
  splitByDescribed,
  type RosterSection,
} from '../gameData/layouts'
import { shortLabel } from '../hotkeys/keyboard'
import { builtInNameKey } from '../hotkeys/builtInSets'
import type { TranslationKey } from '../i18n/dictionaries'
import { useLocale } from '../i18n/localeContext'
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

type FilterKey = 'standard' | 'faction' | CategoryKey | 'command' | 'other' | 'all'

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
  const [faction, setFaction] = useState<FactionKey | null>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterKey>('standard')
  const [drawerOpen, setDrawerOpen] = useState(true)
  const [keys, setKeys] = useState<KeyCatalog | null>(null)
  const [draftName, setDraftName] = useState('')
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [revealing, setRevealing] = useState<'file' | 'folder' | null>(null)

  const readOnly = details?.isBuiltIn ?? true

  // Список разрешённых клавиш берём у сервера: он собран ровно по строке
  // «Valid keys» из KEYDEFAULTS*.LUA, и дублировать его вручную — значит однажды
  // разойтись с игрой.
  useEffect(() => {
    let cancelled = false

    gameApi
      .getKeys()
      .then((catalog) => {
        if (!cancelled) {
          setKeys(catalog)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

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
  const totals = useMemo(
    () => (indexed ? factionTotals(indexed) : new Map<FactionKey, number>()),
    [indexed],
  )

  useKeyCapture(capturingId, {
    keys: keys ?? { keys: [] },
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

  function chooseFaction(next: FactionKey) {
    setFaction((current) => {
      if (current === next) {
        return null
      }

      setSelectedUnitId(null)
      setFilter('standard')

      return next
    })
  }

  const isDirty = changed.length > 0 || draftName !== (details?.displayName ?? '')

  /**
   * Показать файл средствами системы. Кнопка гаснет на время запроса: открытие
   * папки недолгое, но если система не отвечает, без этого можно было бы
   * нащёлкать десяток окон подряд.
   */
  async function reveal(target: 'file' | 'folder') {
    setRevealing(target)
    setError(null)
    setNotice(null)

    try {
      await hotkeySetsApi.reveal(profile.name, fileName, target)
    } catch (reason) {
      if (reason instanceof HotkeyApiError) {
        setError(reason)
      }
    } finally {
      setRevealing(null)
    }
  }

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

  const filters = buildFilters()
  const gridProps = { capturingId, readOnly, original, onCapture: setCapturingId }

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

        <FactionBar counts={totals} active={faction} onSelect={chooseFaction} />

        <div className={`editor ${drawerOpen ? '' : 'editor--drawer-closed'}`}>
          <section className="panel">
            <div className="panel__head">
              <h2>{t('editor.title')}</h2>
              <span className="tag">{entries.length}</span>
              <div className="topbar__spacer" />
              {!readOnly && (
                <span className="tag">{t('editor.changedCount', { count: changed.length })}</span>
              )}
              <button
                className="btn btn--ghost drawer-toggle"
                type="button"
                onClick={() => setDrawerOpen((open) => !open)}
              >
                {drawerOpen ? '›' : '‹'}
              </button>
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

              <div className="editor__filters">
                {filters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`filter-chip ${filter === item ? 'filter-chip--active' : ''}`}
                    onClick={() => setFilter(item)}
                  >
                    {filterLabel(item, faction, indexed, t)}
                  </button>
                ))}
              </div>

              {filter === 'standard' && faction && (
                <StandardLayout
                  faction={faction}
                  indexed={indexed}
                  selectedUnitId={selectedUnitId}
                  search={search}
                  onlyChanged={onlyChanged}
                  onSelectUnit={setSelectedUnitId}
                  {...gridProps}
                />
              )}

              {filter !== 'standard' && (
                <CategoryLayout
                  filter={filter}
                  faction={faction}
                  indexed={indexed}
                  search={search}
                  onlyChanged={onlyChanged}
                  {...gridProps}
                />
              )}
            </div>
          </section>

          <aside className="panel editor__drawer">
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

              {/* Набор — обычный файл в папке профиля, и игрок заглядывает туда
                  сам: подправить руками, переименовать, показать другу. Кнопки
                  доступны и для файлов игры — открыть их тоже нужно. */}
              <div className="set-files">
                <button
                  className="btn"
                  type="button"
                  disabled={revealing !== null}
                  onClick={() => void reveal('file')}
                >
                  {t('editor.openFile')}
                </button>
                <button
                  className="btn"
                  type="button"
                  disabled={revealing !== null}
                  onClick={() => void reveal('folder')}
                >
                  {t('editor.revealFolder')}
                </button>
              </div>

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

/**
 * Раздел «Стандарт»: повторяет игровой экран.
 *
 * Слева войска и постройки расы, справа панели выбранного юнита. Всё перечислено
 * руками в gameData/layouts.ts: правил по умолчанию не осталось, потому что в игре
 * их тоже нет.
 */
function StandardLayout({
  faction,
  indexed,
  selectedUnitId,
  search,
  onlyChanged,
  original,
  capturingId,
  readOnly,
  onSelectUnit,
  onCapture,
}: {
  faction: FactionKey
  indexed: IndexedHotkeys
  selectedUnitId: string | null
  search: string
  onlyChanged: boolean
  original: Record<string, string>
  capturingId: string | null
  readOnly: boolean
  onSelectUnit: (id: string | null) => void
  onCapture: (id: string | null) => void
}) {
  const { t } = useLocale()
  const roster = rosterOf(faction)
  const selected = selectedUnitId ? indexed.byId.get(selectedUnitId) : undefined
  const layout = selectedUnitId ? UNIT_LAYOUTS[selectedUnitId] : undefined
  const gridProps = { capturingId, readOnly, original, onCapture }

  // Поиск и «только изменённые» прячут плитки, но не места: панель в игре от
  // выбранного юнита форму не меняет, и ради этой формы её и настраивают.
  const keep = (entry: HotkeyEntry) =>
    matchesSearch(entry, search) && (!onlyChanged || original[entry.id] !== entry.value)

  const shown = (cells: (HotkeyEntry | null)[]) =>
    cells.map((entry) => (entry && keep(entry) ? entry : null))

  return (
    <div className="standard">
      <div className="standard__left">
        <div className="dependency-group">
          <div className="dependency-group__title">{t('editor.troops')}</div>
          <TileGrid
            entries={pick(roster.troops, indexed).filter(keep)}
            activeId={selectedUnitId}
            onPick={onSelectUnit}
            {...gridProps}
          />
        </div>

        {/* Постройки стоят отдельной строкой, а не внутри строителя: в игре их видно
            сразу, и строитель — лишь один из них. */}
        <div className="dependency-group">
          <div className="dependency-group__title">{t('editor.structures')}</div>
          <TileGrid
            entries={pick(roster.buildings, indexed).filter(keep)}
            activeId={selectedUnitId}
            onPick={onSelectUnit}
            {...gridProps}
          />
        </div>
      </div>

      <div className="standard__middle">
        <SlotPanel
          title={t('editor.commandPanel')}
          slots={shown(slots(layout?.command, PANEL_SLOTS, indexed))}
          columns={4}
          {...gridProps}
        />

        <SlotPanel
          title={t('editor.commandPanel2')}
          slots={shown(slots(layout?.second, PANEL_SLOTS, indexed))}
          columns={4}
          {...gridProps}
        />

        {selected && <p className="slot-hint">{t('editor.manualHint')}</p>}
      </div>

      {/* Улучшения стоят третьим столбцом справа от панелей команд, а не под ними:
          в игре это отдельная полоса у правого края, и так панели не разъезжаются.
          Панель видна всегда, как и остальные: пока юнит не выбран, места просто
          пустые — иначе колонка появлялась бы и прыгала, а игрок её ищет глазами. */}
      <div className="standard__right">
        <SlotPanel
          title={t('editor.improvements')}
          slots={shown(slots(layout?.improvements, IMPROVEMENT_SLOTS, indexed))}
          columns={2}
          {...gridProps}
        />
      </div>
    </div>
  )
}

/** Остальные фильтры показывают то, что перечислено руками для разделов расы. */
function CategoryLayout({
  filter,
  faction,
  indexed,
  search,
  onlyChanged,
  original,
  capturingId,
  readOnly,
  onCapture,
}: {
  filter: FilterKey
  faction: FactionKey | null
  indexed: IndexedHotkeys
  search: string
  onlyChanged: boolean
  original: Record<string, string>
  capturingId: string | null
  readOnly: boolean
  onCapture: (id: string | null) => void
}) {
  const { t } = useLocale()
  const gridProps = { capturingId, readOnly, original, onCapture }
  const roster = rosterOf(faction)

  let entries: HotkeyEntry[]

  if (filter === 'standard') {
    return null
  }

  if (filter === 'other') {
    // Не описанные нигде: команды из кампаний, внутренние хоткеи, забытые расы.
    // Фильтр общий для всего файла, а не только выбранной расы: хоткей, о котором
    // автор ещё не подумал, не должен прятаться за чужими фракциями.
    entries = splitByDescribed(indexed.all).other
  } else if (filter === 'command') {
    entries = []
  } else if (filter === 'all') {
    // Каскад: описал хоть что-то в раскладке — хоткей оказался здесь. Отдельных
    // правил по умолчанию нет, «Все» и «Остальное» просто делят файл надвое.
    entries = splitByDescribed(indexed.all).described
  } else if (filter === 'faction') {
    entries = unique(
      [
        ...(roster.troops ?? []),
        ...(roster.buildings ?? []),
        ...Object.values(roster.sections ?? {}).flat(),
      ],
      indexed,
    )
  } else {
    entries = isRosterSection(filter) ? pick(roster.sections?.[filter], indexed) : []
  }

  const visible = entries.filter(
    (entry) => matchesSearch(entry, search) && (!onlyChanged || original[entry.id] !== entry.value),
  )

  return (
    <EntryGrid entries={visible} emptyText={t('editor.noResults')} {...gridProps} />
  )
}

/** Переводит перечисленные вручную идентификаторы в хоткеи файла: нужен и значок. */
function pick(
  ids: readonly (string | null | undefined)[] | undefined,
  indexed: IndexedHotkeys,
): HotkeyEntry[] {
  return (ids ?? [])
    .map((id) => (id ? entryFor(id, indexed) : undefined))
    .filter((entry): entry is HotkeyEntry => entry !== undefined)
}

function unique(ids: readonly string[], indexed: IndexedHotkeys): HotkeyEntry[] {
  const seen = new Set<string>()

  return ids
    .filter((id) => {
      const command = commandOf(id)

      if (seen.has(command)) {
        return false
      }

      seen.add(command)

      return true
    })
    .map((id) => entryFor(id, indexed))
    .filter((entry): entry is HotkeyEntry => entry !== undefined)
}

/**
 * Хоткей, стоящий за именем из раскладки.
 *
 * У псевдонима из COMMAND_ALIASES команда общая с оригиналом, а значок свой:
 * возвращаем копию, у которой путь к картинке ведёт на имя из раскладки. Сама
 * команда остаётся — по ней показывается клавиша и по ней же клик её запишет.
 */
function entryFor(id: string, indexed: IndexedHotkeys): HotkeyEntry | undefined {
  const command = commandOf(id)
  const entry = indexed.byId.get(command)

  if (entry === undefined) {
    return undefined
  }

  return command === id ? entry : { ...entry, iconUrl: withIconOf(entry.iconUrl, id) }
}

/** Тот же путь к картинке, но с именем из раскладки вместо имени команды. */
function withIconOf(iconUrl: string, name: string): string {
  const slash = iconUrl.lastIndexOf('/')

  return slash < 0 ? iconUrl : `${iconUrl.slice(0, slash + 1)}${name}`
}

/**
 * Панель с фиксированным числом мест.
 *
 * Пустые места остаются на своих местах: в игре панель не меняет форму от выбранного
 * юнита, и прыгающая сетка сбивала бы глаз с той раскладки, которую игрок и настраивает.
 */
function SlotPanel({
  title,
  slots,
  columns = 4,
  capturingId,
  readOnly,
  original,
  onCapture,
}: {
  title: string
  slots: (HotkeyEntry | null)[]
  columns?: number
  capturingId: string | null
  readOnly: boolean
  original: Record<string, string>
  onCapture: (id: string | null) => void
}) {
  return (
    <div className="dependency-group">
      <div className="dependency-group__title">{title}</div>

      <div className="slot-grid" style={{ gridTemplateColumns: `repeat(${columns}, auto)` }}>
        {slots.map((entry, index) =>
          entry ? (
            <HotkeyTile
              key={entry.id}
              entry={entry}
              isCapturing={capturingId === entry.id}
              isChanged={original[entry.id] !== entry.value}
              isReadOnly={readOnly}
              onCapture={() => onCapture(entry.id)}
            />
          ) : (
            <span key={`empty-${index}`} className="slot-grid__empty" />
          ),
        )}
      </div>
    </div>
  )
}

/** Места панели по ручной раскладке, дополненные пустыми до размера игровой. */
function slots(
  manual: readonly (string | null | '')[] | undefined,
  size: number,
  indexed: IndexedHotkeys,
): (HotkeyEntry | null)[] {
  const cells = (manual ?? [])
    .slice(0, size)
    .map((id) => (id ? entryFor(id, indexed) ?? null : null))

  while (cells.length < size) {
    cells.push(null)
  }

  return cells
}

interface GridProps {
  capturingId: string | null
  readOnly: boolean
  original: Record<string, string>
  onCapture: (id: string | null) => void
}

/** Сетка плиток с выбором: нажатая подсвечивается и наполняет панели справа. */
function TileGrid({
  entries,
  activeId,
  onPick,
  ...rest
}: GridProps & { entries: HotkeyEntry[]; activeId: string | null; onPick: (id: string) => void }) {
  const { t } = useLocale()

  if (entries.length === 0) {
    return <div className="empty-state">{t('common.empty')}</div>
  }

  return (
    <div className="hotkey-grid">
      {entries.map((entry) => (
        <HotkeyTile
          key={entry.id}
          entry={entry}
          isCapturing={rest.capturingId === entry.id}
          isChanged={rest.original[entry.id] !== entry.value}
          isReadOnly={rest.readOnly}
          isActive={activeId === entry.id}
          onCapture={() => onPick(entry.id)}
        />
      ))}
    </div>
  )
}

function EntryGrid({
  entries,
  emptyText,
  capturingId,
  readOnly,
  original,
  onCapture,
}: GridProps & { entries: HotkeyEntry[]; emptyText: string }) {
  if (entries.length === 0) {
    return <div className="empty-state">{emptyText}</div>
  }

  return (
    <div className="hotkey-grid">
      {entries.map((entry) => (
        <HotkeyTile
          key={entry.id}
          entry={entry}
          isCapturing={capturingId === entry.id}
          isChanged={original[entry.id] !== entry.value}
          isReadOnly={readOnly}
          onCapture={() => onCapture(entry.id)}
        />
      ))}
    </div>
  )
}

/**
 * Фильтры перечислены целиком и не зависят от наполненности: пустые вкладки
 * нужны, чтобы видеть, куда что-то класть, пока таблица раскладки ещё пуста.
 */
function buildFilters(): FilterKey[] {
  return ['standard', 'faction', ...CATEGORY_ORDER, 'command', 'other', 'all']
}

function isRosterSection(filter: FilterKey): filter is RosterSection {
  return CATEGORY_ORDER.includes(filter as CategoryKey)
}

function filterLabel(
  filter: FilterKey,
  faction: FactionKey | null,
  indexed: IndexedHotkeys,
  t: (key: TranslationKey, values?: Record<string, string | number>) => string,
): string {
  if (filter === 'standard') {
    return t('tab.standard')
  }

  if (filter === 'command') {
    return t('tab.command')
  }

  const roster = rosterOf(faction)
  const listed = [
    ...(roster.troops ?? []),
    ...(roster.buildings ?? []),
    ...Object.values(roster.sections ?? {}).flat(),
  ]

  const { described, other } = splitByDescribed(indexed.all)

  const count =
    filter === 'all'
      ? described.length
      : filter === 'other'
        ? other.length
        : filter === 'faction'
          ? unique(listed, indexed).length
          : isRosterSection(filter)
            ? pick(roster.sections?.[filter], indexed).length
            : 0

  const label =
    filter === 'all'
      ? t('tab.all')
      : filter === 'other'
        ? t('tab.other')
        : filter === 'faction'
          ? t('tab.faction')
          : t(CATEGORY_LABELS[filter])

  return `${label} · ${count}`
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

function matchesSearch(entry: HotkeyEntry, search: string): boolean {
  const needle = search.trim().toLowerCase()

  return needle === '' || entry.id.toLowerCase().includes(needle)
}
