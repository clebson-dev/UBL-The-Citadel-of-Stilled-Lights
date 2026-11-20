import type { InputState } from '../types/game'

export type TouchButton = keyof InputState

/** Detecta telas sensíveis ao toque (iOS incluído). */
export function deviceHasTouch(): boolean {
  if (typeof window === 'undefined') return false
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

const MOVEMENT_KEYS = new Set([
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyE',
  'KeyL',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'Space',
  'ShiftLeft',
  'ShiftRight',
])

function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  return (
    !!element &&
    (element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.isContentEditable)
  )
}

export class InputController {
  readonly state: InputState = {
    left: false,
    right: false,
    jump: false,
    interact: false,
  }

  forceTouch = false
  private keys = new Set<string>()
  private touchButtons = new Set<TouchButton>()
  private jumpQueued = false
  private interactQueued = false
  private dashQueued = false
  private journalQueued = false
  private lastJumpAt = 0

  constructor(forceTouch = false) {
    this.forceTouch = forceTouch
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  get touchMode(): boolean {
    return this.forceTouch || deviceHasTouch()
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (isTyping(event.target)) return
    if (MOVEMENT_KEYS.has(event.code)) event.preventDefault()
    if (this.keys.has(event.code)) return
    this.keys.add(event.code)

    if (event.code === 'KeyW' || event.code === 'Space' || event.code === 'ArrowUp') {
      this.state.jump = true
      this.jumpQueued = true
    }
    if (event.code === 'KeyE') {
      this.state.interact = true
      this.interactQueued = true
    }
    if (event.code === 'KeyL') this.journalQueued = true
    if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      this.dashQueued = true
    }
  }

  private onKeyUp = (event: KeyboardEvent): void => {
    this.keys.delete(event.code)
    if (event.code === 'KeyW' || event.code === 'Space' || event.code === 'ArrowUp') {
      this.state.jump = false
    }
    if (event.code === 'KeyE') this.state.interact = false
  }

  private onBlur = (): void => {
    this.keys.clear()
    this.touchButtons.clear()
    this.state.left = false
    this.state.right = false
    this.state.jump = false
    this.state.interact = false
  }

  /** Chamado pelos botões virtuais. `jump`/`interact` são ações de borda. */
  setTouchButton(button: TouchButton, pressed: boolean): void {
    if (pressed) {
      this.touchButtons.add(button)
      if (button === 'jump') {
        const now = performance.now()
        if (now - this.lastJumpAt < 300) this.dashQueued = true
        this.lastJumpAt = now
        this.state.jump = true
        this.jumpQueued = true
      }
      if (button === 'interact') {
        this.state.interact = true
        this.interactQueued = true
      }
      return
    }
    this.touchButtons.delete(button)
    if (button === 'jump') this.state.jump = false
    if (button === 'interact') this.state.interact = false
  }

  /** Reconciliza o estado contínuo a cada frame (teclado + toque). */
  sync(): void {
    this.state.left =
      this.keys.has('KeyA') ||
      this.keys.has('ArrowLeft') ||
      this.touchButtons.has('left')
    this.state.right =
      this.keys.has('KeyD') ||
      this.keys.has('ArrowRight') ||
      this.touchButtons.has('right')
  }

  consumeJump(): boolean {
    const value = this.jumpQueued
    this.jumpQueued = false
    return value
  }

  consumeInteract(): boolean {
    const value = this.interactQueued
    this.interactQueued = false
    return value
  }

  consumeDash(): boolean {
    const value = this.dashQueued
    this.dashQueued = false
    return value
  }

  consumeJournal(): boolean {
    const value = this.journalQueued
    this.journalQueued = false
    return value
  }

  clearQueues(): void {
    this.jumpQueued = false
    this.interactQueued = false
    this.dashQueued = false
    this.journalQueued = false
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
  }
}
