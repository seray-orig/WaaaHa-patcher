import type { FactionKey } from '../gameData/factions'
import { useLocale } from '../i18n/localeContext'
import { HotkeyIcon } from './HotkeyIcon'
import './faction.css'

interface FactionBarProps {
  /** Сколько хоткеев в наборе у фракции — для приглушения пустых вкладок. */
  counts: Map<FactionKey, number>
  active: FactionKey | null
  onSelect: (faction: FactionKey) => void
}

/** Порядок кнопок совпадает с порядком рас в игре. */
const FACTION_ORDER: FactionKey[] = [
  'marine',
  'chaos',
  'ork',
  'eldar',
  'tau',
  'necron',
  'guard',
  'dark_eldar',
  'sisters',
]

/**
 * Девять кнопок рас. Клик открывает фракцию; «Все» живёт отдельно в конце списка
 * фильтров — он огромный и в начало ему не место.
 */
export function FactionBar({ counts, active, onSelect }: FactionBarProps) {
  return (
    <div className="faction-bar">
      {FACTION_ORDER.map((faction) => (
        <FactionButton
          key={faction}
          faction={faction}
          count={counts.get(faction) ?? 0}
          isActive={active === faction}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function FactionButton({
  faction,
  count,
  isActive,
  onSelect,
}: {
  faction: FactionKey
  count: number
  isActive: boolean
  onSelect: (faction: FactionKey) => void
}) {
  const { t } = useLocale()
  const name = t(`group.${faction}`)

  return (
    <button
      type="button"
      className={`faction-button ${isActive ? 'faction-button--active' : ''}`}
      disabled={count === 0 && !isActive}
      onClick={() => onSelect(faction)}
      title={name}
    >
      <HotkeyIcon
        baseUrl={`/hotkey-images/faction_${faction}`}
        className="faction-button__icon"
        fallback={<span className="faction-button__fallback">{name}</span>}
      />

      <span className="faction-button__name">{name}</span>
    </button>
  )
}