import { type MouseEvent } from 'react'
import type { HotkeyEntry } from '../api/types'
import { useLocale } from '../i18n/localeContext'
import { formatChord, shortLabel } from '../hotkeys/keyboard'
import { HotkeyIcon } from './HotkeyIcon'
import './HotkeyTile.css'

interface HotkeyTileProps {
  entry: HotkeyEntry
  isCapturing: boolean
  isChanged: boolean
  /**
   * Плитку нажать нельзя: так у файлов игры, которые редактор не пишет.
   *
   * Отдельно от того, что плитка умеет: выбрать юнита можно и у файла игры —
   * посмотреть его панели игрок вправе, а вот назначать клавиши в чужом файле
   * нельзя. Поэтому решение, что делает нажатие, остаётся за тем, кто плитку
   * показал, а запрет — за этим флагом.
   */
  isDisabled: boolean
  /** Подсветка выбранного юнита — по ней панели справа знают, кого показывать. */
  isActive?: boolean
  onActivate: () => void
  /** Имя для отображения (подпись на плитке). Если не задано — берётся из entry.id. */
  displayName?: string
  /** Имя целевой команды для tooltip (для COMMAND_LINKS — реальный хоткей). */
  linkedTo?: string
}

/**
 * Плитка с картинкой команды и текущей комбинацией.
 *
 * Стрелки в углу больше нет: она открывала зависимые клавиши юнита, но движение,
 * остановка и атака одинаковы для всех, и открывать их пришлось бы у каждого.
 * Теперь панели справа от выбранного юнита и так показывают всё, что у него есть.
 */
export function HotkeyTile({
  entry,
  isCapturing,
  isChanged,
  isDisabled,
  isActive = false,
  onActivate,
  displayName,
  linkedTo,
}: HotkeyTileProps) {
  const { t } = useLocale()

  const label = formatChord(entry.value)
  const cleared = entry.value === ''
  const caption = shortLabel(displayName ?? entry.id)

  const classes = [
    'hotkey-tile',
    cleared && 'hotkey-tile--empty',
    isCapturing && 'hotkey-tile--capturing',
    isChanged && 'hotkey-tile--changed',
    isActive && 'hotkey-tile--active',
  ]
    .filter(Boolean)
    .join(' ')

  function handleClick(event: MouseEvent) {
    event.preventDefault()
    onActivate()
  }

  // Для tooltip: если есть linkedTo — показываем реальную цель хоткея
  const tooltipTarget = linkedTo ?? displayName ?? entry.id

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      disabled={isDisabled}
      title={`${caption} (${tooltipTarget})\n${label || t('common.notAssigned')}`}
    >
      {/* Иконка не зависит от наличия хоткея: сняли клавишу — команда никуда не
          делась, и картинка должна остаться на месте. */}
      <HotkeyIcon
        baseUrl={entry.iconUrl}
        className="hotkey-tile__icon"
        fallback={<span className="hotkey-tile__fallback">{caption}</span>}
      />

      <span className={cleared ? 'hotkey-tile__key hotkey-tile__key--cleared' : 'hotkey-tile__key'}>
        {cleared ? '—' : label}
      </span>

      {isCapturing && <span className="hotkey-tile__capturing">{t('editor.capturing')}</span>}
    </button>
  )
}
