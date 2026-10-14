import { useEffect, useMemo, useState } from 'react'
import { HotkeyApiError, hotkeySetsApi } from '../api/client'
import type { HotkeyEntry, HotkeySetDetails, ProfileInfo } from '../api/types'
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
import { isBuilder, isVehicle, type FactionKey } from '../gameData/factions'
import {
  COMMAND_PANEL,
  FACTION_COMMANDS,
  SECOND_COMMAND_PANEL,
  abilitiesOf,
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

/** Что открыто в редакторе. Фильтр выбирает раздел, юнит — наполнение панелей. */
type FilterKey = 'standard' | CategoryKey | 'command' | 'all'

/** Порядок фильтров: «Стандарт» и общие разделы, между ними — разделы выбранной расы. */
const TRAILING_FILTERS: FilterKey[] = ['command', 'all']

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
  const totals = useMemo(
    () => (indexed ? factionTotals(indexed) : new Map<FactionKey, number>()),
    [indexed],
  )

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
                  original={original}
                  capturingId={capturingId}
                  readOnly={readOnly}
                  onSelectUnit={setSelectedUnitId}
                  onCapture={setCapturingId}
                />
              )}

              {filter !== 'standard' && (
                <CategoryLayout
                  filter={filter}
                  faction={faction}
                  indexed={indexed}
                  search={search}
                  onlyChanged={onlyChanged}
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

/**
 * Раздел «Стандарт»: повторяет игровой экран.
 *
 * Слева войска и строения расы, справа панели команд выбранного юнита. Общие команды
 * — движение, остановка, атака — живут в панели и не дублируются внутри юнита: они
 * одинаковы для всех, и стрелки к ним только мешали.
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
  const troops = [
    ...(categories.get('Infantry') ?? []),
    ...(categories.get('Vehicle') ?? []),
  ].filter((entry) => matchesSearch(entry, search) && visible(entry, onlyChanged, original))
  const structures = (categories.get('Building') ?? []).filter(
    (entry) => matchesSearch(entry, search) && visible(entry, onlyChanged, original),
  )

  const selected = selectedUnitId ? indexed.byId.get(selectedUnitId) : undefined

  const gridProps = { capturingId, readOnly, original, onCapture }

  return (
    <div className="standard">
      <div className="standard__left">
        <div className="dependency-group">
          <div className="dependency-group__title">{t('editor.troops')}</div>
          <TileGrid entries={troops} {...gridProps} activeId={selectedUnitId} onPick={onSelectUnit} />
        </div>

        {/* Постройки стоят отдельной строкой, а не внутри строителя: в игре их видно
            сразу, и строитель — лишь один из них. */}
        <div className="dependency-group">
          <div className="dependency-group__title">{t('editor.structures')}</div>
          <TileGrid entries={structures} {...gridProps} activeId={selectedUnitId} onPick={onSelectUnit} />
        </div>
      </div>

      <div className="standard__right">
        <SlotPanel
          title={t('editor.commandPanel')}
          slots={panelSlots(COMMAND_PANEL, indexed, faction, selected)}
          columns={4}
          {...gridProps}
        />

        <SlotPanel
          title={t('editor.commandPanel2')}
          slots={panelSlots(SECOND_COMMAND_PANEL, indexed, faction, selected)}
          columns={4}
          {...gridProps}
        />

        <SlotPanel
          title={t('editor.improvements')}
          slots={improvementSlots(indexed, faction, selected)}
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

  if (filter === 'command') {
    const ids = faction
      ? [...COMMAND_PANEL, ...SECOND_COMMAND_PANEL, ...FACTION_COMMANDS]
      : [...COMMAND_PANEL, ...SECOND_COMMAND_PANEL, ...FACTION_COMMANDS]

    const entries = ids
      .map((id) => indexed.byId.get(id))
      .filter((entry): entry is HotkeyEntry => entry !== undefined)

    return (
      <EntryGrid
        entries={entries}
        capturingId={capturingId}
        readOnly={readOnly}
        original={original}
        onCapture={onCapture}
        emptyText={t('common.empty')}
      />
    )
  }

  if (filter === 'all') {
    const entries = indexed.all.filter(
      (entry) => matchesSearch(entry, search) && visible(entry, onlyChanged, original),
    )

    return (
      <EntryGrid
        entries={entries}
        capturingId={capturingId}
        readOnly={readOnly}
        original={original}
        onCapture={onCapture}
        emptyText={t('editor.noResults')}
      />
    )
  }

  // «Стандарт» сюда не доходит: его рисует соседняя ветка, а здесь только разделы.
  if (filter === 'standard') {
    return null
  }

  const categories = faction ? indexed.byFaction.get(faction) : null
  const entries = (categories?.get(filter) ?? []).filter(
    (entry) => matchesSearch(entry, search) && visible(entry, onlyChanged, original),
  )

  if (entries.length === 0) {
    return <div className="empty-state">{t('editor.noResults')}</div>
  }

  return (
    <EntryGrid
      entries={entries}
      capturingId={capturingId}
      readOnly={readOnly}
      original={original}
      onCapture={onCapture}
      emptyText={t('editor.noResults')}
    />
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
  /** Ровно столько же мест, сколько в игре, — вместе с пустыми. */
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

/** Команды, общие для всего, что можно выделить на поле. */
const SHARED_COMMANDS = ['stop', 'move', 'attackmove', 'attackmelee']

/** Отряды умеют вызывать подкрепление, здания — строить и чинить. */
const INFANTRY_COMMANDS = ['reinforce']

const BUILDING_COMMANDS = ['build', 'repair']

/**
 * Места панели для выбранного юнита.
 *
 * Пустые места остаются пустыми, а не прячутся: в игре панель не меняет форму от
 * выбранного юнита, и прыгающая сетка сбивала бы глаз с той раскладки, ради которой
 * её и настраивают.
 */
function panelSlots(
  panel: readonly string[],
  indexed: IndexedHotkeys,
  faction: FactionKey,
  selected: HotkeyEntry | undefined,
): (HotkeyEntry | null)[] {
  return panel.map((id) =>
    hasCommand(faction, selected, id) ? (indexed.byId.get(id) ?? null) : null,
  )
}

function hasCommand(faction: FactionKey, selected: HotkeyEntry | undefined, id: string): boolean {
  if (SHARED_COMMANDS.includes(id)) {
    return true
  }

  // Пока юнит не выбран, видно только то, что есть у всего: остальное панель ещё
  // не знает и показывает пустыми местами.
  if (!selected) {
    return false
  }

  // Строитель — не только здание: сервитор пехота, а строит и чинит наравне с оружейней.
  if (selected.category === 'Building' || isBuilder(faction, selected.id)) {
    return BUILDING_COMMANDS.includes(id)
  }

  // В файле вся техника лежит в одной секции с пехотой, поэтому делимся по справочнику:
  // подкрепление вызывает только отряд, танк его не вызовет.
  if (!isVehicle(faction, selected.id)) {
    return INFANTRY_COMMANDS.includes(id)
  }

  return factionCommandFor(id, faction) !== null
}

/** Улучшения юнита: его умения плюс те, что игра прячет у самой расы. Два на четыре. */
function improvementSlots(
  indexed: IndexedHotkeys,
  faction: FactionKey,
  selected: HotkeyEntry | undefined,
): (HotkeyEntry | null)[] {
  const ids = selected
    ? [
        ...abilitiesOf(selected.id),
        ...FACTION_COMMANDS.filter((id) => factionCommandFor(id, faction) !== null),
      ]
    : []

  const slots: (HotkeyEntry | null)[] = ids
    .map((id) => indexed.byId.get(id) ?? null)
    .filter((entry): entry is HotkeyEntry => entry !== null)

  return [...slots, ...Array<null>(Math.max(0, IMPROVEMENT_SLOTS - slots.length))].slice(
    0,
    IMPROVEMENT_SLOTS,
  )
}

const IMPROVEMENT_SLOTS = 8

/** Редкие команды умеют быть у нескольких рас, поэтому сверяемся с набором. */
function factionCommandFor(id: string, faction: FactionKey): string | null {
  const known: Partial<Record<string, FactionKey[]>> = {
    fear: ['chaos', 'guard', 'sisters', 'dark_eldar'],
    entrench: ['guard', 'tau', 'necron'],
    burrow: ['ork'],
    possess: ['chaos'],
    possess_enemy: ['chaos', 'necron'],
    relocate: ['eldar', 'dark_eldar'],
    cannibalism: ['ork'],
    harvest: ['necron'],
    melee_dance: ['eldar'],
    lightning_field: ['necron'],
    necron_stasis_field: ['necron'],
    necron_nightmare_shroud: ['necron'],
    direct_spawn: ['necron'],
    direct_spawn_rally: ['necron'],
    tau_snare_trap: ['tau'],
    tau_holographic_projection: ['tau'],
  }

  return known[id]?.includes(faction) ? id : null
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
  capturingId,
  readOnly,
  original,
  onCapture,
  emptyText,
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

  return ['standard', ...own, ...TRAILING_FILTERS]
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

  if (filter === 'all') {
    return `${t('tab.all')} · ${indexed.all.length}`
  }

  if (filter === 'command') {
    return t('tab.command')
  }

  const categories = faction ? indexed.byFaction.get(faction) : null
  const count = categories?.get(filter)?.length ?? 0

  return `${t(CATEGORY_LABELS[filter])} · ${count}`
}

/**
 * Заголовок раздела приходит из файла по-английски — показываем перевод.
 * Фракцию в названии добавляем, только если она действительно есть внутри: в файле
 * встречаются разделы, куда попала команда без фракционного префикса, и приписывать
 * ей чужую расу было бы враньём.
 */
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

function visible(entry: HotkeyEntry, onlyChanged: boolean, original: Record<string, string>): boolean {
  return !onlyChanged || original[entry.id] !== entry.value
}

function matchesSearch(entry: HotkeyEntry, search: string): boolean {
  const needle = search.trim().toLowerCase()

  return needle === '' || entry.id.toLowerCase().includes(needle)
}
