import { useCallback, useEffect, useRef, useState } from 'react'

/** Форматы, в которых игрок может положить картинку. */
const EXTENSIONS = ['.png', '.jpg', '.webp'] as const

interface HotkeyIconProps {
  /** Базовый путь без расширения, его отдаёт сервер. */
  baseUrl: string
  className: string
  alt?: string
  /** Что показать, если картинки нет. Обычно это текстовая заглушка. */
  fallback: React.ReactNode
}

/**
 * Показывает картинку команды, перебирая расширения.
 *
 * Сервер отдаёт пут без расширения: игрок может положить иконку хоть в png, хоть в
 * jpg, и заставлять его переименовывать всё подряд не нужно.
 *
 * Отдельно проверяем уже загруженную картинку: ответ 404 может прийти из кэша раньше,
 * чем React навесит обработчик onError, и событие просто пропадёт — иконка останется
 * пустой на все три формата.
 */
export function HotkeyIcon({ baseUrl, className, alt = '', fallback }: HotkeyIconProps) {
  const [index, setIndex] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    setIndex(0)
  }, [baseUrl])

  const advance = useCallback(() => {
    setIndex((current) => (current < EXTENSIONS.length - 1 ? current + 1 : EXTENSIONS.length))
  }, [])

  const source = `${baseUrl}${EXTENSIONS[Math.min(index, EXTENSIONS.length - 1)]}`

  useEffect(() => {
    const image = imageRef.current

    if (image?.complete && image.naturalWidth === 0) {
      advance()
    }
  }, [source, advance])

  if (index >= EXTENSIONS.length) {
    return <>{fallback}</>
  }

  return (
    <img
      ref={imageRef}
      className={className}
      src={source}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={advance}
    />
  )
}