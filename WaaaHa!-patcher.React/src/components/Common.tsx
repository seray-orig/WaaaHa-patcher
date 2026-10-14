import type { ReactNode } from 'react'
import { locales, useLocale, type LocaleCode } from '../i18n/localeContext'
import { useConfirm } from '../hooks/useConfirm'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale()

  return (
    <select
      className="input language-switcher"
      value={locale}
      aria-label={t('common.language')}
      onChange={(event) => setLocale(event.target.value as LocaleCode)}
    >
      {locales.map((item) => (
        <option key={item.code} value={item.code}>
          {item.label}
        </option>
      ))}
    </select>
  )
}

/** Заглушка на время запроса к серверу. */
export function LoadingScreen() {
  const { t } = useLocale()

  return (
    <div className="page">
      <div className="empty-state">{t('common.loading')}</div>
    </div>
  )
}

export function Modal({
  title,
  children,
  footer,
  onClose,
}: {
  title: ReactNode
  children: ReactNode
  footer: ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="modal-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <header className="modal__head">
          <h2>{title}</h2>
        </header>
        <div className="modal__body">{children}</div>
        <footer className="modal__foot">{footer}</footer>
      </div>
    </div>
  )
}

/**
 * Показывает ошибку по коду из API. Если кода нет в словаре, остаётся текст сервера —
 * так новые ошибки не превращаются в пустые уведомления.
 */
export function ErrorBanner({
  code,
  title,
  detail,
}: {
  code: string
  title: string
  detail?: string | null
}) {
  const { tError } = useLocale()
  const message = tError(code, title)

  return (
    <div className="banner banner--error" role="alert">
      <span>
        {message}
        {detail ? <span className="banner__detail"> — {detail}</span> : null}
      </span>
    </div>
  )
}

/** Вопрос об удалении. Возвращает null, если окно закрыто. */
export function ConfirmDialog({
  confirm,
  title,
  confirmLabel,
  cancelLabel,
}: {
  confirm: ReturnType<typeof useConfirm>
  title: string
  confirmLabel: string
  cancelLabel: string
}) {
  if (!confirm.question) {
    return null
  }

  return (
    <Modal
      title={title}
      onClose={confirm.reject}
      footer={
        <>
          <button className="btn" type="button" onClick={confirm.reject}>
            {cancelLabel}
          </button>
          <button className="btn btn--danger" type="button" onClick={confirm.accept}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{confirm.question}</p>
    </Modal>
  )
}