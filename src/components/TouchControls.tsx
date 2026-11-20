import { useEffect, useState } from 'react'
import type { InputController, TouchButton } from '../engine/input'

interface TouchControlsProps {
  input: InputController | null
  visible: boolean
  interactHighlight: boolean
  onInteract: () => void
}

export function TouchControls({
  input,
  visible,
  interactHighlight,
  onInteract,
}: TouchControlsProps) {
  const [pressed, setPressed] = useState<Partial<Record<TouchButton, boolean>>>({})

  useEffect(() => {
    if (!visible) setPressed({})
  }, [visible])

  if (!visible) return null

  const bind = (button: TouchButton) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture(event.pointerId)
      input?.setTouchButton(button, true)
      setPressed((state) => ({ ...state, [button]: true }))
      if (button === 'interact') onInteract()
    },
    onPointerUp: () => {
      input?.setTouchButton(button, false)
      setPressed((state) => ({ ...state, [button]: false }))
    },
    onPointerCancel: () => {
      input?.setTouchButton(button, false)
      setPressed((state) => ({ ...state, [button]: false }))
    },
  })

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5">
      <div className="pointer-events-auto flex gap-2">
        <button
          type="button"
          aria-label="Mover para a esquerda"
          className="touch-button"
          data-pressed={pressed.left === true}
          {...bind('left')}
        >
          ◀
        </button>
        <button
          type="button"
          aria-label="Mover para a direita"
          className="touch-button"
          data-pressed={pressed.right === true}
          {...bind('right')}
        >
          ▶
        </button>
      </div>

      <div className="pointer-events-auto flex items-end gap-2">
        <button
          type="button"
          aria-label="Interagir"
          className="touch-button touch-button--interact"
          data-pressed={pressed.interact === true}
          data-highlight={interactHighlight}
          {...bind('interact')}
        >
          E
        </button>
        <button
          type="button"
          aria-label="Pular (toque duplo: dash)"
          className="touch-button"
          data-pressed={pressed.jump === true}
          {...bind('jump')}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
