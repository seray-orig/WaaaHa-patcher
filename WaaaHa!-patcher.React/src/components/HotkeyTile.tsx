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
  isReadOnly: boolean
  /** Основное действие — назначить клавишу. */
  onCapture: () => void
  /** Раскрыть клавиши юнита. Если не задано, плитка только назначает. */
  onOpen?: () => void
}

/**
 * Плитка с картинкой команды и текущей комбинацией.
 *
 * Действия разделены: основная кнопка ставит клавишу, а стрелка в углу открывает
 * зависимые команды юнита. Иначе назначить клавишу юниту и раскрыть его было бы нельзя
 * одним кликом, а это две разные задачи.
 */
export function HotkeyTile({
  entry,
  isCapturing,
  isChanged,
  isReadOnly,
  onCapture,
  onOpen,
}: HotkeyTileProps) {
  const { t } = useLocale()

  const label = formatChord(entry.value)
  const cleared = entry.value === ''
  const caption = shortLabel(entry.id)

  const classes = [
    'hotkey-tile',
    cleared && 'hotkey-tile--empty',
    isCapturing && 'hotkey-tile--capturing',
    isChanged && 'hotkey-tile--changed',
  ]
    .filter(Boolean)
    .join(' ')

  function handleClick(event: MouseEvent) {
    event.preventDefault()

    if (!isReadOnly) {
      onCapture()
    }
  }

  return (
    <span className="hotkey-tile-wrap">
      <button
        type="button"
        className={classes}
        onClick={handleClick}
        disabled={isReadOnly}
        title={`${caption} (${entry.id})\n${label || t('common.notAssigned')}`}
      >
        {cleared ? (
          <span className="hotkey-tile__fallback">{caption}</span>
        ) : (
          <HotkeyIcon
            baseUrl={entry.iconUrl}
            className="hotkey-tile__icon"
            fallback={<span className="hotkey-tile__fallback">{caption}</span>}
          />
        )}

        <span
          className={cleared ? 'hotkey-tile__key hotkey-tile__key--cleared' : 'hotkey-tile__key'}
        >
          {cleared ? '—' : label}
        </span>

        {isCapturing && <span className="hotkey-tile__capturing">{t('editor.capturing')}</span>}
      </button>

      {onOpen && (
        <button
          type="button"
          className="hotkey-tile__open"
          onClick={onOpen}
          title={t('unit.dependencies')}
        >
          ▸
        </button>
      )}
    </span>
  )
}