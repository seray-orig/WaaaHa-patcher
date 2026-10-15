import { useEffect, useRef } from 'react'
import { composeChord, keyFromCode, keyFromMouseButton, readKey } from '../hotkeys/keyboard'
import type { KeyCatalog } from '../api/types'

export interface KeyCaptureOptions {
  /** Вызывается, когда игрок назначил комбинацию или очистил хоткей. */
  onChord: (value: string) => void
  /** Вызывается, когда игрок отменил захват. */
  onCancel: () => void
  /**
   * Вызывается по цифре 0: вернуть хоткей к значению из файла-основы.
   *
   * Три клавиши у сброса набиралось по одной: Escape — отмена, Delete — снять
   * хоткей, 0 — вернуть как было. Верхний ряд цифр для хоткеев и так не занят,
   * см. keyboard.ts, так что цифра ничего не отнимает.
   */
  onReset: () => void
  /** Клавиши из списка «Valid keys»: всё, чего в нём нет, игре некуда записать. */
  keys: KeyCatalog
}

/**
 * Включает режим ожидания нажатия, пока активен хоткей.
 *
 * Обработчики намеренно висят на window и слушают в фазе захвата: пока идёт назначение,
 * обычный ввод в приложение подавляется, иначе Ctrl+C копировал бы текст, а не
 * ставил хоткей.
 *
 * Захват снимается после первого же решения: иначе следующее нажатие перезаписало бы
 * только что назначенную комбинацию.
 *
 * Модификатор отдельно не считается нажатием. Игрок держит Ctrl и жмёт A — это одно
 * назначение, «Control+A». А нажатый и отпущенный в одиночку Ctrl становится хоткеем
 * сам: игра такие значения принимает, например camera_rotate = "Alt".
 */
export function useKeyCapture(activeId: string | null, options: KeyCaptureOptions): void {
  const optionsRef = useRef(options)
  const keysRef = useRef(options.keys)

  // Слушатели переживают перерисовки, поэтому читают колбэки через ref.
  // Писать ref во время рендера нельзя, поэтому обновляем в отдельном эффекте.
  useEffect(() => {
    optionsRef.current = options
    keysRef.current = options.keys
  })

  useEffect(() => {
    if (activeId === null) {
      return
    }

    // Состояние захвата живёт внутри эффекта: следующее назначение начинается чистым.
    let settled = false
    let heldModifier: string | null = null

    // Каталог читается на лету: он приезжает отдельным запросом и может прийти уже
    // после того, как игрок кликнул по плитке. Если его ещё нет, назначение просто
    // не состоится — зато не запишется клавиша, которой игре неизвестно.
    const allowed = () => new Set(keysRef.current.keys.map((key) => key.name))
    const modifiers = () =>
      new Set(keysRef.current.keys.filter((key) => key.isModifier).map((key) => key.name))

    function handleKeyDown(event: KeyboardEvent) {
      event.preventDefault()
      event.stopPropagation()

      if (settled) {
        return
      }

      if (event.code === 'Escape') {
        settled = true
        optionsRef.current.onCancel()
        return
      }

      // Сброс к стандартному. Цифры и так не назначаются хоткеями, поэтому ловим
      // прямо здесь, до разбора: со модификаторами сброс не нужен.
      if (event.code === 'Digit0') {
        settled = true
        optionsRef.current.onReset()
        return
      }

      const key = readKey(event, allowed())

      if (key === null) {
        return
      }

      // Пустая строка означает Delete: хоткей убирается.
      if (key === '') {
        settled = true
        optionsRef.current.onChord('')
        return
      }

      // Модификатор ждём: возможно, следом пойдёт обычная клавиша.
      if (modifiers().has(key)) {
        heldModifier = key
        return
      }

      settled = true
      heldModifier = null

      optionsRef.current.onChord(
        composeChord({ key, ctrl: event.ctrlKey, shift: event.shiftKey, alt: event.altKey }),
      )
    }

    /** Отпустили модификатор, а других клавиш так и не нажали: он и был задуман. */
    function handleKeyUp(event: KeyboardEvent) {
      if (settled || heldModifier === null) {
        return
      }

      const key = keyFromCode(event.code)

      if (key !== heldModifier) {
        return
      }

      settled = true
      heldModifier = null

      optionsRef.current.onChord(key)
    }

    function handleMouseDown(event: globalThis.MouseEvent) {
      const key = keyFromMouseButton(event.button)

      if (key === '') {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (settled || !allowed().has(key)) {
        return
      }

      settled = true
      heldModifier = null

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
    window.addEventListener('keyup', handleKeyUp, { capture: true })
    window.addEventListener('mousedown', handleMouseDown, { capture: true })
    window.addEventListener('contextmenu', swallow, { capture: true })
    window.addEventListener('wheel', swallow, { capture: true, passive: false })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      window.removeEventListener('keyup', handleKeyUp, { capture: true })
      window.removeEventListener('mousedown', handleMouseDown, { capture: true })
      window.removeEventListener('contextmenu', swallow, { capture: true })
      window.removeEventListener('wheel', swallow, { capture: true })
    }
  }, [activeId])
}
