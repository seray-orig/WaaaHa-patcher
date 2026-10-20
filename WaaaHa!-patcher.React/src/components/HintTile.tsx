import { HotkeyIcon } from './HotkeyIcon'
import { INTERNAL_BUTTONS, MANUAL_BUTTONS } from '../gameData/layouts'
import { useLocale } from '../i18n/localeContext'
import './HintTile.css'

/**
 * Плитка-подсказка на месте кнопки, которой нет.
 *
 * За такими кнопками в игре нет настоящей клавиши — например, режимы войск
 * всегда стоят на одной позиции и переключаются нажатием на ту же кнопку, а
 * некоторые кнопки автора — просто ручное нажатие мышкой. Настраивать их в
 * панели юнита бессмысленно, и без подсказки автор тратит время, прописывая
 * их в раскладку руками.
 *
 * Значок берётся из INTERNAL_BUTTONS или MANUAL_BUTTONS и слегка приглушается:
 * плитка ничего не назначает и в файл не попадает, поэтому выглядеть как кнопка
 * она не должна — но по цветному значку её и узнать можно сразу.
 */
export function HintTile({ name }: { name: string }) {
  const { t } = useLocale()
  const button = INTERNAL_BUTTONS[name]
  const manual = MANUAL_BUTTONS[name]

  if (!button && !manual) {
    return null
  }

  const icon = button?.icon ?? manual!.icon
  const label = t(button?.hint ?? manual!.label)

  return (
    <div className="hint-tile" title={label}>
      <HotkeyIcon
        baseUrl={`/hotkey-images/${icon}`}
        className="hint-tile__icon"
        fallback={<span className="hint-tile__fallback" />}
      />

      {/* Плашка по центру значка: зачем идти в фильтр — видно сразу, а не по
          подсказке в заголовке, до которого ещё надо дотянуться. */}
      <span className="hint-tile__label">
        <span className="hint-tile__plate">{label}</span>
      </span>
    </div>
  )
}