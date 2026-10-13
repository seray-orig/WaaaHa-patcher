import { useState } from 'react'

/**
 * Подтверждение действия. Возвращает true, если игрок согласился, и всегда сбрасывает
 * состояние, чтобы вопрос не «залипал» после отмены.
 */
export function useConfirm() {
  const [pending, setPending] = useState<{ text: string; settle: (ok: boolean) => void } | null>(
    null,
  )

  function ask(text: string): Promise<boolean> {
    return new Promise((resolve) => setPending({ text, settle: resolve }))
  }

  function close(answer: boolean) {
    pending?.settle(answer)
    setPending(null)
  }

  return {
    question: pending?.text ?? null,
    ask,
    accept: () => close(true),
    reject: () => close(false),
  }
}

export type Confirm = ReturnType<typeof useConfirm>