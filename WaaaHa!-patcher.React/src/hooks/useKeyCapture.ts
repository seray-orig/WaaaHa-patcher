import { useEffect, useRef } from 'react'
import { composeChord, keyFromMouseButton, readChord } from '../hotkeys/keyboard'

export interface KeyCaptureOptions {
  /** Вызывается, когда игрок назначил комбинацию или очистил хоткей. */
  onChord: (value: string) => void
  /** Вызывается, когда игрок отменил захват. */
  onCancel: () => void
}

/**
 * Включает режим ожидания нажатия, пока активен хоткей.
 *
 * Обработчики намеренно висят на window и слушают в фазе захвата: пока идёт назначение,
 * обычный ввод в приложение подавляется, иначе Ctrl+C копировал бы текст, а не
 * ставил хоткей. Клавиши-модификаторы отдельно не назначаются — игрок должен отпустить
 * их и нажать обычную клавишу.
 */
export function useKeyCapture(activeId: string | null, options: KeyCaptureOptions): void {
  const optionsRef = useRef(options)

  // Слушатели переживают перерисовки, поэтому читают колбэки через ref.
  // Писать ref во время рендера нельзя, поэтому обновляем в отдельном эффекте.
  useEffect(() => {
    optionsRef.current = options
  })

  useEffect(() => {
    if (activeId === null) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      event.preventDefault()
      event.stopPropagation()

      const outcome = readChord(event)

      if (!outcome) {
        return
      }

      if (outcome.type === 'cancel') {
        optionsRef.current.onCancel()
        return
      }

      if (outcome.type === 'clear') {
        optionsRef.current.onChord('')
        return
      }

      optionsRef.current.onChord(composeChord(outcome.chord))
    }

    function handleMouseDown(event: globalThis.MouseEvent) {
      const key = keyFromMouseButton(event.button)

      if (key === '') {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      optionsRef.current.onChord(
        composeChord({
          key,
          ctrl: event.ctrlKey,
          shift: event.shiftKey,
          alt: event.altKey,
        }),
      )
    }

    function swallow(event: Event) {
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    window.addEventListener('mousedown', handleMouseDown, { capture: true })
    window.addEventListener('contextmenu', swallow, { capture: true })
    window.addEventListener('wheel', swallow, { capture: true, passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('mousedown', handleMouseDown, { capture: true })
      window.removeEventListener('contextmenu', swallow, { capture: true })
      window.removeEventListener('wheel', swallow, { capture: true })
    }
  }, [activeId])
}