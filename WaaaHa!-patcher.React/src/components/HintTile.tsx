import { HotkeyIcon } from './HotkeyIcon'
import { INTERNAL_BUTTONS } from '../gameData/layouts'
import { useLocale } from '../i18n/localeContext'
import './HintTile.css'

/**
 * Серая плитка-подсказка на месте кнопки, которой нет.
 *
 * За такими кнопками в игре нет настоящей клавиши — например, режимы войск
 * всегда стоят на одной позиции и переключаются нажатием на ту же кнопку.
 * Настраивать их в панели юнита бессмысленно, и без подсказки автор тратит
 * время, прописывая их в раскладку руками.
 *
 * Значок берётся из INTERNAL_BUTTONS и гасится: плитка ничего не назначает и
 * в файл не попадает, поэтому выглядеть как кнопка она не должна.
 */
export function HintTile({ name }: { name: string }) {
  const { t } = useLocale()
  const button = INTERNAL_BUTTONS[name]

  if (!button) {
    return null
  }

  return (
    <div className="hint-tile" title={t(button.hint)}>
      <HotkeyIcon
        baseUrl={`/hotkey-images/${button.icon}`}
        className="hint-tile__icon"
        fallback={<span className="hint-tile__fallback" />}
      />

      <span className="hint-tile__label">{t(button.hint)}</span>
    </div>
  )
}