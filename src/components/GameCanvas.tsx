import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { GameEngine, type EngineCallbacks } from '../engine/gameEngine'
import type { Discipline, GameArea } from '../types/game'

export interface GameCanvasHandle {
  setArea: (area: GameArea, disciplineId?: string) => void
  updateProgress: (completedIds: Set<string>, dashUnlocked: boolean) => void
  pause: () => void
  resume: () => void
  getArea: () => GameArea
}

interface GameCanvasProps {
  disciplines: Discipline[]
  callbacks: EngineCallbacks
  forceTouch: boolean
  reducedMotion: boolean
  onInputReady: (input: GameEngine['input'] | null) => void
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function GameCanvas(
  { disciplines, callbacks, forceTouch, reducedMotion, onInputReady },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const callbacksRef = useRef(callbacks)
  callbacksRef.current = callbacks

  useImperativeHandle(ref, () => ({
    setArea: (area, disciplineId) => engineRef.current?.setArea(area, disciplineId),
    updateProgress: (completedIds, dashUnlocked) =>
      engineRef.current?.updateProgress(completedIds, dashUnlocked),
    pause: () => engineRef.current?.pause(),
    resume: () => engineRef.current?.resume(),
    getArea: () => engineRef.current?.getArea() ?? 'hub',
  }))

  useEffect(() => {
    if (!canvasRef.current) return
    const engine = new GameEngine(canvasRef.current, disciplines, {
      onTerminalInteract: (id) => callbacksRef.current.onTerminalInteract(id),
      onPortalInteract: (id) => callbacksRef.current.onPortalInteract(id),
      onNearbyChange: (target) => callbacksRef.current.onNearbyChange(target),
      onAreaChange: (area) => callbacksRef.current.onAreaChange(area),
      onJournalToggle: () => callbacksRef.current.onJournalToggle(),
    }, forceTouch)
    engineRef.current = engine
    onInputReady(engine.input)
    engine.start()

    return () => {
      onInputReady(null)
      engine.destroy()
      engineRef.current = null
    }
    // A engine é criada uma única vez; mudanças de settings são propagadas abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disciplines])

  useEffect(() => {
    engineRef.current?.setTouchForced(forceTouch)
  }, [forceTouch])

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion)
  }, [reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full touch-none"
      aria-label="Mundo da Cidadela"
    />
  )
})
