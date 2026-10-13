import { useEffect, useState } from 'react'

/** Форматы, в которых игрок может положить картинку. */
const EXTENSIONS = ['.png', '.jpg', '.webp'] as const

interface HotkeyIconProps {
  /** Базовый путь без расширения, его отдаёт сервер. */
  baseUrl: string
  className: string
  alt?: string
  /** Что показать, если картинки нет. Обычно это текстовая заглушка. */
  fallback: React.ReactNode
  /** Заглушка нужна только пока картинка не нашлась. */
  eager?: boolean
}

/**
 * Показывает картинку команды, перебирая расширения.
 *
 * Сервер отдаёт путь без расширения: игрок может положить иконку хоть в png, хоть в
 * jpg, и заставлять его переименовывать всё подряд не нужно.
 */
export function HotkeyIcon({ baseUrl, className, alt = '', fallback }: HotkeyIconProps) {
  const [extension, setExtension] = useState<string>(EXTENSIONS[0])
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    setExtension(EXTENSIONS[0])
    setMissing(false)
  }, [baseUrl])

  if (missing) {
    return <>{fallback}</>
  }

  return (
    <img
      className={className}
      src={baseUrl + extension}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => {
        const index = EXTENSIONS.indexOf(extension as (typeof EXTENSIONS)[number])

        if (index < 0 || index === EXTENSIONS.length - 1) {
          setMissing(true)
        } else {
          setExtension(EXTENSIONS[index + 1])
        }
      }}
    />
  )
}