import { useState, type MouseEvent } from 'react'
import type { HotkeyEntry } from '../api/types'
import { useLocale } from '../i18n/localeContext'
import { formatChord, shortLabel } from '../hotkeys/keyboard'
import './HotkeyTile.css'

interface HotkeyTileProps {
  entry: HotkeyEntry
  isCapturing: boolean
  isChanged: boolean
  isReadOnly: boolean
  onCapture: () => void
}

/**
 * Плитка с картинкой команды и текущим хоткеем.
 * Картинка берётся из public/hotkey-images по имени команды; если её нет, показывается
 * заглушка с первыми буквами, чтобы сетка не «дырявилась».
 */
export function HotkeyTile({
  entry,
  isCapturing,
  isChanged,
  isReadOnly,
  onCapture,
}: HotkeyTileProps) {
  const { t } = useLocale()
  const [iconFailed, setIconFailed] = useState(false)

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
    if (isReadOnly) {
      return
    }

    event.preventDefault()
    onCapture()
  }

  const showImage = !cleared && !iconFailed

  return (
    <button
      type="button"
      className={classes}
      onClick={handleClick}
      disabled={isReadOnly}
      title={`${caption} (${entry.id})\n${label || t('common.notAssigned')}`}
    >
      {showImage ? (
        <img
          className="hotkey-tile__icon"
          src={entry.iconUrl}
          alt=""
          loading="lazy"
          draggable={false}
          onError={() => setIconFailed(true)}
        />
      ) : (
        <span className="hotkey-tile__fallback">{caption}</span>
      )}

      <span
        className={
          cleared
            ? 'hotkey-tile__key hotkey-tile__key--cleared'
            : 'hotkey-tile__key'
        }
      >
        {cleared ? '—' : label}
      </span>

      {isCapturing && <span className="hotkey-tile__capturing">{t('editor.capturing')}</span>}
    </button>
  )
}