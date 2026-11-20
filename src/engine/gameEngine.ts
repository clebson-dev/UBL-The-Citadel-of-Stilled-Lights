import type { Discipline, GameArea } from '../types/game'
import { InputController } from './input'
import { createPlayer, stepPlayer, type PlayerBody } from './physics'
import { Renderer } from './renderer'
import {
  buildDisciplineScene,
  buildHubScene,
  nearestInteractable,
  type PortalNode,
  type Scene,
  type TerminalNode,
} from './scene'

const VIEW_WIDTH = 960
const VIEW_HEIGHT = 540
const FIXED_STEP = 1 / 60
const MAX_FRAME = 0.1

function isTerminal(node: TerminalNode | PortalNode): node is TerminalNode {
  return 'level' in node
}

function isPortal(node: TerminalNode | PortalNode): node is PortalNode {
  return 'disciplineId' in node
}

export interface NearbyTarget {
  kind: 'terminal' | 'portal'
  id: string
  label: string
}

export interface EngineCallbacks {
  onTerminalInteract: (levelId: string) => void
  onPortalInteract: (disciplineId: string) => void
  onNearbyChange: (target: NearbyTarget | null) => void
  onAreaChange: (area: GameArea) => void
  onJournalToggle: () => void
}

export class GameEngine {
  readonly input: InputController
  private ctx: CanvasRenderingContext2D
  private renderer: Renderer
  private raf = 0
  private lastTime = 0
  private accumulator = 0
  private time = 0
  private paused = false
  private destroyed = false
  private scene: Scene
  private player: PlayerBody
  private cameraX = 0
  private nearbyKey = ''
  private nearby: TerminalNode | PortalNode | null = null
  private area: GameArea = 'hub'
  private activeDisciplineId: string | null = null
  private completedIds = new Set<string>()
  private dashUnlocked = false
  private reducedMotion = false
  private scale = 1
  private offsetX = 0
  private offsetY = 0
  private resizeObserver: ResizeObserver | null = null

  constructor(
    private canvas: HTMLCanvasElement,
    private disciplines: Discipline[],
    private callbacks: EngineCallbacks,
    forceTouch = false,
  ) {
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('Canvas 2D indisponível neste navegador.')
    this.ctx = context
    this.renderer = new Renderer(context)
    this.input = new InputController(forceTouch)
    this.scene = buildHubScene(disciplines)
    this.player = createPlayer(this.scene.playerStart.x, this.scene.playerStart.y)
    this.resize()
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
  }

  start(): void {
    if (this.raf) return
    this.lastTime = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  pause(): void {
    this.paused = true
    this.input.clearQueues()
  }

  resume(): void {
    this.paused = false
    this.lastTime = performance.now()
    this.accumulator = 0
  }

  get isPaused(): boolean {
    return this.paused
  }

  setTouchForced(forced: boolean): void {
    this.input.forceTouch = forced
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
  }

  /** Reconstroi a cena sem teleportar o jogador (usado após concluir um nível). */
  updateProgress(completedIds: Set<string>, dashUnlocked: boolean): void {
    this.completedIds = new Set(completedIds)
    this.dashUnlocked = dashUnlocked
    this.scene =
      this.area === 'discipline' && this.activeDisciplineId
        ? buildDisciplineScene(
            this.disciplines.find((item) => item.id === this.activeDisciplineId) ??
              this.disciplines[0]!,
            this.completedIds,
          )
        : buildHubScene(this.disciplines)
    this.nearbyKey = ''
  }

  setArea(area: GameArea, disciplineId?: string): void {
    const targetDiscipline =
      disciplineId ?? this.activeDisciplineId ?? this.disciplines[0]?.id ?? null
    this.area = area
    this.activeDisciplineId = targetDiscipline
    if (area === 'hub') {
      this.scene = buildHubScene(this.disciplines)
    } else {
      const discipline = this.disciplines.find((item) => item.id === targetDiscipline)
      if (!discipline) return
      this.scene = buildDisciplineScene(discipline, this.completedIds)
    }
    this.player = createPlayer(this.scene.playerStart.x, this.scene.playerStart.y)
    this.cameraX = 0
    this.nearbyKey = ''
    this.nearby = null
    this.callbacks.onNearbyChange(null)
    this.callbacks.onAreaChange(area)
  }

  getArea(): GameArea {
    return this.area
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = this.canvas.getBoundingClientRect()
    const cssWidth = Math.max(1, rect.width)
    const cssHeight = Math.max(1, rect.height)
    this.canvas.width = Math.round(cssWidth * dpr)
    this.canvas.height = Math.round(cssHeight * dpr)

    this.scale = Math.min(cssWidth / VIEW_WIDTH, cssHeight / VIEW_HEIGHT)
    this.offsetX = (cssWidth - VIEW_WIDTH * this.scale) / 2
    this.offsetY = (cssHeight - VIEW_HEIGHT * this.scale) / 2
    this.ctx.setTransform(
      this.scale * dpr,
      0,
      0,
      this.scale * dpr,
      this.offsetX * dpr,
      this.offsetY * dpr,
    )
  }

  private frame = (now: number): void => {
    if (this.destroyed) return
    const elapsed = Math.min(MAX_FRAME, (now - this.lastTime) / 1000)
    this.lastTime = now

    if (!this.paused) {
      this.accumulator += elapsed
      while (this.accumulator >= FIXED_STEP) {
        this.tick(FIXED_STEP)
        this.accumulator -= FIXED_STEP
      }
      this.time += elapsed
    }

    this.cameraX +=
      (Math.max(0, Math.min(this.scene.width - VIEW_WIDTH, this.player.x - VIEW_WIDTH / 2)) -
        this.cameraX) *
      Math.min(1, elapsed * 7)

    this.renderer.render({
      scene: this.scene,
      player: this.player,
      cameraX: this.cameraX,
      time: this.time,
      viewWidth: VIEW_WIDTH,
      viewHeight: VIEW_HEIGHT,
      nearby: this.nearby,
      reducedMotion: this.reducedMotion,
    })
    this.raf = requestAnimationFrame(this.frame)
  }

  private tick(dt: number): void {
    this.input.sync()
    if (this.input.consumeJournal()) this.callbacks.onJournalToggle()

    stepPlayer(this.player, this.scene.platforms, dt, {
      left: this.input.state.left,
      right: this.input.state.right,
      jumpPressed: this.input.consumeJump(),
      dashPressed: this.input.consumeDash(),
      dashUnlocked: this.dashUnlocked,
      worldWidth: this.scene.width,
    })

    const target = nearestInteractable(
      this.scene,
      this.player.x + this.player.w / 2,
      this.player.y + this.player.h / 2,
    )
    const key = target
      ? isTerminal(target)
        ? `terminal:${target.level.id}`
        : `portal:${target.disciplineId}`
      : ''
    if (key !== this.nearbyKey) {
      this.nearbyKey = key
      this.nearby = target
      this.callbacks.onNearbyChange(
        target
          ? isTerminal(target)
            ? {
                kind: 'terminal',
                id: target.level.id,
                label: `${target.level.order.toString().padStart(2, '0')} · ${target.level.title}`,
              }
            : {
                kind: 'portal',
                id: target.disciplineId,
                label: target.locked ? target.lockedLabel : target.label,
              }
          : null,
      )
    }

    if (target && this.input.consumeInteract()) {
      this.input.clearQueues()
      if (isTerminal(target)) {
        this.callbacks.onTerminalInteract(target.level.id)
      } else if (isPortal(target) && target.disciplineId === 'hub') {
        this.callbacks.onPortalInteract('hub')
      } else {
        this.callbacks.onPortalInteract(target.disciplineId)
      }
    } else {
      this.input.consumeInteract()
    }
  }

  destroy(): void {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.resizeObserver?.disconnect()
    this.input.destroy()
  }
}
