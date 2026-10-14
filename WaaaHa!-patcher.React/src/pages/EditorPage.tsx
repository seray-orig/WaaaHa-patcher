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
import { isBuilder, type FactionKey } from '../gameData/factions'
import { UNIT_LAYOUTS, type UnitLayout } from '../gameData/layouts'
import {
  BUILDING_COMMANDS,
  BUILDING_EXIT_MODES,
  FACTION_COMMANDS,
  FACTION_SERGEANT,
  IMPROVEMENT_SLOTS,
  PANEL_SLOTS,
  SERGEANT_HOSTS,
  SHARED_COMMANDS,
  abilitiesOf,
  isFactionCommand,
  weaponsOf,
} from '../gameData/panels'
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

type FilterKey = 'standard' | 'faction' | CategoryKey | 'command' | 'all'

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

  const filters = buildFilters(faction, indexed)
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
 * Слева войска и постройки расы, справа панели выбранного юнита. Общие команды не
 * дублируются внутри юнита: у здания их вообще нет, а у отряда они одинаковы с любым
 * другим, и стрелки к ним только мешали.
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
  const categories = indexed.byFaction.get(faction) ?? new Map<CategoryKey, HotkeyEntry[]>()
  const sergeant = FACTION_SERGEANT[faction]
  const keep = (entry: HotkeyEntry) =>
    matchesSearch(entry, search) && (!onlyChanged || original[entry.id] !== entry.value)

  // Сержант не покупается, а выдаётся на месте, поэтому в списке войск его нет.
  const troops = [...(categories.get('Infantry') ?? []), ...(categories.get('Vehicle') ?? [])]
    .filter((entry) => entry.id !== sergeant)
    .filter(keep)

  const structures = (categories.get('Building') ?? []).filter(keep)
  const selected = selectedUnitId ? indexed.byId.get(selectedUnitId) : undefined
  const gridProps = { capturingId, readOnly, original, onCapture }

  return (
    <div className="standard">
      <div className="standard__left">
        <div className="dependency-group">
          <div className="dependency-group__title">{t('editor.troops')}</div>
          <TileGrid
            entries={troops}
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
            entries={structures}
            activeId={selectedUnitId}
            onPick={onSelectUnit}
            {...gridProps}
          />
        </div>
      </div>

      <div className="standard__middle">
        <SlotPanel
          title={t('editor.commandPanel')}
          slots={pad(commandSlots(faction, selected, indexed), PANEL_SLOTS)}
          columns={4}
          {...gridProps}
        />

        <SlotPanel
          title={t('editor.commandPanel2')}
          slots={pad(secondSlots(faction, selected, indexed), PANEL_SLOTS)}
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
          slots={pad(
            selected ? improvementSlots(indexed, faction, selected) : [],
            IMPROVEMENT_SLOTS,
          )}
          columns={2}
          {...gridProps}
        />
      </div>
    </div>
  )
}

/** Остальные фильтры работают по описанию раздела: просто сортируют по категориям. */
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
  const keep = (entry: HotkeyEntry) =>
    matchesSearch(entry, search) && (!onlyChanged || original[entry.id] !== entry.value)

  let entries: HotkeyEntry[]

  if (filter === 'standard') {
    return null
  }

  if (filter === 'command') {
    entries = [...SHARED_COMMANDS, ...BUILDING_COMMANDS, ...FACTION_COMMANDS]
      .map((id) => indexed.byId.get(id))
      .filter((entry): entry is HotkeyEntry => entry !== undefined)
  } else if (filter === 'all') {
    entries = indexed.all.filter(keep)
  } else if (filter === 'faction') {
    const categories = faction ? indexed.byFaction.get(faction) : null

    entries = categories
      ? [...categories.values()].flat().filter(keep)
      : indexed.all.filter((entry) => entry.group !== 'common')
  } else {
    entries = (faction ? indexed.byFaction.get(faction)?.get(filter) : undefined) ?? []
  }

  return (
    <EntryGrid entries={entries} emptyText={t('editor.noResults')} {...gridProps} />
  )
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

/**
 * Панели выбранного юнита.
 *
 * Что игрок расписал руками в layouts.ts, берётся как есть, вместе с позициями:
 * универсального правила нет, глайдер настраивается у той машинерии, которую игрок
 * выбрал, а угадать это из файла биндингов нельзя. Чего в layouts.ts нет, собирается
 * здесь по общим правилам.
 */
function panelFor(
  selected: HotkeyEntry | undefined,
  indexed: IndexedHotkeys,
  section: keyof UnitLayout,
  fallback: () => (HotkeyEntry | null)[],
): (HotkeyEntry | null)[] {
  const manual = selected ? UNIT_LAYOUTS[selected.id]?.[section] : undefined

  return manual ? resolve(manual, indexed) : fallback()
}

/**
 * Основная панель выбранного юнита.
 *
 * У здания общих команд нет: на стоящей постройке нельзя ни двинуться, ни ударить.
 * У остального общие команды одни и те же, а дальше идут умения самого юнита — даже
 * те, что требуют грейда: в бою кнопка всё равно есть, просто затемняется.
 */
function commandSlots(
  faction: FactionKey,
  selected: HotkeyEntry | undefined,
  indexed: IndexedHotkeys,
): (HotkeyEntry | null)[] {
  return panelFor(selected, indexed, 'command', () => {
    if (!selected) {
      return resolve(SHARED_COMMANDS, indexed)
    }

    const building = selected.category === 'Building' || isBuilder(faction, selected.id)

    return building
      ? resolve([...BUILDING_COMMANDS, ...abilitiesOf(selected.id)], indexed)
      : resolve([...SHARED_COMMANDS, ...abilitiesOf(selected.id)], indexed)
  })
}

/**
 * Вторая панель.
 *
 * Строителю сюда кладутся все здания расы — ровно те, что в игре выходят в его
 * меню постройки. Остальным сюда попадают редкие команды расы.
 */
function secondSlots(
  faction: FactionKey,
  selected: HotkeyEntry | undefined,
  indexed: IndexedHotkeys,
): (HotkeyEntry | null)[] {
  return panelFor(selected, indexed, 'second', () => {
    if (!selected) {
      return []
    }

    const building = selected.category === 'Building' || isBuilder(faction, selected.id)

    if (building) {
      return indexed.byFaction.get(faction)?.get('Building') ?? []
    }

    return resolve(
      FACTION_COMMANDS.filter((id) => isFactionCommand(id, faction)),
      indexed,
    )
  })
}

/**
 * Улучшения: то, что выдаётся на месте, а не покупается в оружейне.
 *
 * У отряда это выдаваемое оружие, кнопка добавления сержанта и вызов подкрепления.
 * У здания — режимы выхода войск, в классической раскладке F1–F4.
 */
function improvementSlots(
  indexed: IndexedHotkeys,
  faction: FactionKey,
  selected: HotkeyEntry,
): (HotkeyEntry | null)[] {
  return panelFor(selected, indexed, 'improvements', () => {
    const building = selected.category === 'Building' || isBuilder(faction, selected.id)

    if (building) {
      return resolve(BUILDING_EXIT_MODES, indexed)
    }

    const sergeant = FACTION_SERGEANT[faction]
    const ids = [
      ...weaponsOf(selected.id),
      ...(sergeant && SERGEANT_HOSTS[selected.id] ? [sergeant] : []),
      'reinforce',
    ]

    return resolve(ids, indexed)
  })
}

function resolve(
  ids: readonly (string | null | undefined)[],
  indexed: IndexedHotkeys,
): (HotkeyEntry | null)[] {
  return ids.map((id) => (id ? (indexed.byId.get(id) ?? null) : null))
}

function pad(slots: (HotkeyEntry | null)[], size: number): (HotkeyEntry | null)[] {
  return [...slots, ...Array<null>(Math.max(0, size - slots.length))].slice(0, size)
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
 * Фильтры собираются под выбранную расу: у неё свои разделы, и пустые вкладки
 * только занимают место. «Панель команд» и «Все» не зависят от расы и идут в конце.
 */
function buildFilters(faction: FactionKey | null, indexed: IndexedHotkeys): FilterKey[] {
  const categories = faction ? indexed.byFaction.get(faction) : null
  const own: FilterKey[] = categories
    ? CATEGORY_ORDER.filter((category) => (categories.get(category)?.length ?? 0) > 0)
    : []

  return ['standard', 'faction', ...own, 'command', 'all']
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

  const categories = faction ? indexed.byFaction.get(faction) : null

  const count =
    filter === 'all'
      ? indexed.all.length
      : filter === 'faction'
        ? [...(categories?.values() ?? [])].flat().length
        : (categories?.get(filter)?.length ?? 0)

  const label =
    filter === 'all' ? t('tab.all') : filter === 'faction' ? t('tab.faction') : t(CATEGORY_LABELS[filter])

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
