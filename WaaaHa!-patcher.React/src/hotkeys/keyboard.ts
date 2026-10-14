/**
 * Преобразование событий клавиатуры и мыши в формат, который понимает игра.
 * Имена клавиш взяты из списка «Valid keys» в заголовке KEYDEFAULTS*.LUA.
 */

/** Имя клавиши по её физическому коду. Пустая строка — игра такой клавиши не знает. */
export function keyFromCode(code: string): string {
  if (/^Key[A-Z]$/.test(code)) {
    return code.slice(3)
  }

  if (/^Digit[0-9]$/.test(code)) {
    return code.slice(5)
  }

  if (/^Numpad[0-9]$/.test(code)) {
    return code
  }

  if (/^F([1-9]|1[0-2])$/.test(code)) {
    return code
  }

  const byCode: Record<string, string> = {
    Backquote: 'Grave',
    Backslash: 'Backslash',
    BracketLeft: 'LBracket',
    BracketRight: 'RBracket',
    Comma: 'Comma',
    Equal: 'Equal',
    IntlBackslash: 'Backslash',
    IntlRo: 'Backslash',
    IntlYen: 'Backslash',
    Minus: 'Minus',
    Period: 'Period',
    Quote: 'Apostrophe',
    Semicolon: 'Semicolon',
    Slash: 'Slash',
    Space: 'Space',
    Tab: 'Tab',
    Enter: 'Enter',
    NumpadEnter: 'NumpadPlus',
    NumpadAdd: 'NumpadPlus',
    NumpadSubtract: 'NumpadMinus',
    NumpadMultiply: 'NumpadMultiply',
    NumpadDivide: 'NumpadSlash',
    NumpadDecimal: 'NumpadPeriod',
    Escape: 'Escape',
    Backspace: 'Backspace',
    Delete: 'Delete',
    Insert: 'Insert',
    Home: 'Home',
    End: 'End',
    PageUp: 'PageUp',
    PageDown: 'PageDown',
    ArrowUp: 'Up',
    ArrowDown: 'Down',
    ArrowLeft: 'Left',
    ArrowRight: 'Right',
    CapsLock: 'CapsLock',
    NumLock: 'NumLock',
    ScrollLock: 'ScrollLock',
    PrintScreen: 'PrintScreen',
    Pause: 'Pause',
    MetaLeft: '',
    MetaRight: '',
    OSLeft: '',
    OSRight: '',
    ControlLeft: 'Control',
    ControlRight: 'Control',
    ShiftLeft: 'Shift',
    ShiftRight: 'Shift',
    AltLeft: 'Alt',
    AltRight: 'Alt',
  }

  return byCode[code] ?? ''
}

export function keyFromMouseButton(button: number): string {
  switch (button) {
    case 0:
      return 'MouseLeft'
    case 1:
      return 'MouseMiddle'
    case 2:
      return 'MouseRight'
    case 3:
      return 'MouseTop'
    case 4:
      return 'MouseBottom'
    default:
      return ''
  }
}

/** Раскладка не важна: игра видит физическую клавишу, а не символ. */
export interface CapturedChord {
  key: string
  ctrl: boolean
  shift: boolean
  alt: boolean
}

export type CaptureOutcome =
  | { type: 'assign'; chord: CapturedChord }
  | { type: 'clear' }
  | { type: 'cancel' }

/**
 * Разбирает событие нажатия в комбинацию.
 *
 * Клавиша принимается только если она есть в списке «Valid keys» из заголовка
 * KEYDEFAULTS*.LUA: игре некуда записать то, чего она не знает, и такой набор
 * просто перестал бы грузиться.
 *
 * Модификатор возвращается отдельно и без сочетания — игрок держит Ctrl и жа��ет A,
 * это всё ещё одно нажатие. Нажатый в одиночку модификатор станет хоткеем сам,
 * когда его отпустят.
 */
export function readKey(event: KeyboardEvent, allowed: ReadonlySet<string>): string | null {
  if (event.code === 'Delete') {
    return ''
  }

  const key = keyFromCode(event.code)

  return key === '' || !allowed.has(key) ? null : key
}

/** Собирает комбинацию в строку файла: Control+Shift+A. */
export function composeChord(chord: CapturedChord): string {
  const parts: string[] = []

  if (chord.ctrl) parts.push('Control')
  if (chord.shift) parts.push('Shift')
  if (chord.alt) parts.push('Alt')

  parts.push(chord.key)

  return parts.join('+')
}

/** Разбирает строку файла обратно в комбинацию для отображения и сравнения. */
export function parseChord(value: string): CapturedChord | null {
  if (!value) {
    return null
  }

  const parts = value.split('+')
  const chord: CapturedChord = { key: '', ctrl: false, shift: false, alt: false }

  for (const part of parts) {
    switch (part) {
      case 'Control':
        chord.ctrl = true
        break
      case 'Shift':
        chord.shift = true
        break
      case 'Alt':
        chord.alt = true
        break
      default:
        chord.key = part
    }
  }

  // Игра принимает «голый» модификатор как хоткей: camera_rotate = "Alt".
  if (!chord.key) {
    const only = [
      chord.ctrl ? 'Control' : null,
      chord.shift ? 'Shift' : null,
      chord.alt ? 'Alt' : null,
    ].filter((name): name is string => name !== null)

    return only.length === 1 ? { key: only[0], ctrl: false, shift: false, alt: false } : null
  }

  return chord
}

/**
 * Человекочитаемая подпись: «Ctrl + Shift + A».
 * Управление камерой хранит несколько комбинаций через запятую — такие значения
 * показываются списком, иначе подпись вводила бы в заблуждение.
 */
export function formatChord(value: string): string {
  if (!value) {
    return ''
  }

  const sequence = value.split(',').map((part) => formatSingleChord(part.trim()))

  return sequence.filter(Boolean).join(' или ')
}

function formatSingleChord(value: string): string {
  const chord = parseChord(value)

  if (!chord) {
    return ''
  }

  const parts: string[] = []

  if (chord.ctrl) parts.push('Ctrl')
  if (chord.shift) parts.push('Shift')
  if (chord.alt) parts.push('Alt')

  parts.push(shortKeyLabel(chord.key))

  return parts.join(' + ')
}

const SHORT_LABELS: Record<string, string> = {
  Control: 'Ctrl',
  Shift: 'Shift',
  Alt: 'Alt',
  Space: 'Space',
  Escape: 'Esc',
  Enter: 'Enter',
  Backspace: 'Bksp',
  Delete: 'Del',
  Insert: 'Ins',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  PrintScreen: 'PrtSc',
  CapsLock: 'Caps',
  NumLock: 'Num',
  ScrollLock: 'Scrl',
  Apostrophe: "'",
  Period: '.',
  Comma: ',',
  Slash: '/',
  Backslash: '\\',
  Semicolon: ';',
  Equal: '=',
  Minus: '-',
  Grave: '`',
  LBracket: '[',
  RBracket: ']',
}

export function shortKeyLabel(key: string): string {
  if (SHORT_LABELS[key]) {
    return SHORT_LABELS[key]
  }

  if (key.startsWith('Mouse')) {
    return key.replace('Mouse', 'M').replace('Left', '1').replace('Right', '2').replace('Middle', '3')
  }

  if (key.startsWith('Numpad')) {
    return key.replace('Numpad', 'Num')
  }

  return key
}

/**
 * Понятная подпись команды без префикса фракции: marine_servitor → «Servitor».
 * Префикс и так виден по разделу, а сокращения вроде «MS» ни о чём не говорят.
 */
export function shortLabel(id: string, maxLength = 18): string {
  const words = id.split('_').filter(Boolean)

  if (words.length === 0) {
    return '?'
  }

  const meaningful = words.length > 1 ? words.slice(1) : words

  return titleCase(meaningful.join(' ')).slice(0, maxLength)
}

function titleCase(text: string): string {
  return text.replace(/(^|\s)\p{L}/gu, (match) => match.toUpperCase())
}