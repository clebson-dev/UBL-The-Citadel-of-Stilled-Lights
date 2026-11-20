import type { PortalNode, Scene, TerminalNode } from './scene'
import type { PlayerBody } from './physics'
import { assetManager, type AssetManager, type AssetKey } from './assetManager'

export interface RenderState {
  scene: Scene
  player: PlayerBody
  cameraX: number
  time: number
  viewWidth: number
  viewHeight: number
  nearby: TerminalNode | PortalNode | null
  reducedMotion: boolean
}

/** Converte "#RRGGBB" em rgba()para usar em gradientes e brilhos. */
function rgba(hex: string, alpha: number): string {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function quadPoint(
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
  t: number,
): { x: number; y: number } {
  const u = 1 - t
  return {
    x: u * u * x0 + 2 * u * t * cx + t * t * x1,
    y: u * u * y0 + 2 * u * t * cy + t * t * y1,
  }
}

export class Renderer {
  private assets: AssetManager

  constructor(private ctx: CanvasRenderingContext2D, assets: AssetManager = assetManager) {
    this.assets = assets
  }

  render(state: RenderState): void {
    const { ctx } = this
    const { scene, viewWidth, viewHeight, cameraX, time } = state

    ctx.save()
    ctx.clearRect(0, 0, viewWidth, viewHeight)
    this.drawSky(state)
    ctx.translate(-cameraX, 0)
    this.drawParallax(state)
    this.drawPlatforms(state)
    if (scene.area === 'discipline') this.drawCables(state)
    this.drawTerminals(state)
    this.drawPortals(state)
    this.drawPlayer(state)
    ctx.restore()

    this.drawDust(state)
    this.drawVignette(viewWidth, viewHeight, scene.theme.background)
    void time
  }

  private drawSky(state: RenderState): void {
    const { ctx } = this
    const { viewWidth, viewHeight, scene } = state
    const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight)
    gradient.addColorStop(0, '#03060d')
    gradient.addColorStop(0.55, scene.theme.background)
    gradient.addColorStop(1, '#0d1626')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, viewWidth, viewHeight)

    // Halo difuso no topo, como se fosse a lua encoberta da Cidadela.
    const halo = ctx.createRadialGradient(
      viewWidth * 0.7,
      viewHeight * 0.12,
      8,
      viewWidth * 0.7,
      viewHeight * 0.12,
      viewHeight * 0.7,
    )
    halo.addColorStop(0, rgba(scene.theme.light, 0.1))
    halo.addColorStop(1, rgba(scene.theme.light, 0))
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, viewWidth, viewHeight)
  }

  private drawParallax(state: RenderState): void {
    const { ctx } = this
    const { scene, cameraX, viewWidth, viewHeight, time } = state
    const layers = [
      { factor: 0.18, alpha: 0.16, color: '#101d32', base: 300 },
      { factor: 0.36, alpha: 0.24, color: '#0b1729', base: 370 },
      { factor: 0.58, alpha: 0.32, color: '#081220', base: 430 },
    ]

    for (const layer of layers) {
      const offset = cameraX * layer.factor
      ctx.save()
      ctx.globalAlpha = layer.alpha
      ctx.fillStyle = layer.color
      const start = Math.floor(offset / 220) - 1
      const end = start + Math.ceil(viewWidth / 220) + 3
      for (let i = start; i <= end; i += 1) {
        const x = i * 220 - offset
        const height = 120 + ((i * 67) % 90)
        const y = layer.base - height + Math.sin(time * 0.1 + i) * 2
        // Torre + arco ogival.
        ctx.fillRect(x + 30, y, 120, height)
        ctx.beginPath()
        ctx.moveTo(x + 20, y + 20)
        ctx.quadraticCurveTo(x + 90, y - 70, x + 160, y + 20)
        ctx.closePath()
        ctx.fill()
        if (i % 3 === 0) {
          ctx.fillRect(x + 76, y - 40, 8, 40)
          ctx.fillStyle = rgba(scene.theme.light, 0.5)
          ctx.fillRect(x + 78, y - 44, 4, 5)
          ctx.fillStyle = layer.color
        }
      }
      ctx.restore()
    }

    // Fios pendurados no teto reforçam a verticalidade.
    ctx.save()
    ctx.strokeStyle = rgba('#1b3446', 0.65)
    ctx.lineWidth = 2
    for (let i = 0; i < 14; i += 1) {
      const x = i * 190 - (cameraX * 0.4) % 190
      const length = 60 + (i % 4) * 38
      ctx.beginPath()
      ctx.moveTo(x, -10)
      ctx.quadraticCurveTo(x + 12, length * 0.6, x - 4, length)
      ctx.stroke()
    }
    ctx.restore()
    void viewHeight
  }

  private drawPlatforms(state: RenderState): void {
    const { ctx } = this
    const { scene, cameraX, viewWidth } = state
    for (const platform of scene.platforms) {
      if (platform.x + platform.w < cameraX - 50 || platform.x > cameraX + viewWidth + 50) {
        continue
      }
      const top = platform.y
      const gradient = ctx.createLinearGradient(0, top, 0, top + Math.max(20, platform.h))
      gradient.addColorStop(0, '#1c3047')
      gradient.addColorStop(0.12, '#101d30')
      gradient.addColorStop(1, '#060c16')
      ctx.fillStyle = gradient
      ctx.fillRect(platform.x, top, platform.w, platform.h)

      ctx.fillStyle = rgba(scene.theme.light, 0.35)
      ctx.fillRect(platform.x, top, platform.w, 2)

      if (platform.kind === 'ledge') {
        // Pingos de energia pendentes na borda.
        ctx.fillStyle = rgba(scene.theme.cableInactive, 0.9)
        for (let x = platform.x + 12; x < platform.x + platform.w - 8; x += 28) {
          ctx.fillRect(x, top + platform.h, 2, 5 + ((x | 0) % 7))
        }
      } else {
        ctx.strokeStyle = rgba('#2b4a63', 0.25)
        ctx.lineWidth = 1
        // O chão agora cobre o mundo inteiro; desenhar os detalhes apenas na
        // janela visível preserva o padrão e mantém o custo constante.
        const firstDetail =
          platform.x + 40 + Math.max(0, Math.ceil((cameraX - 50 - platform.x - 40) / 130)) * 130
        for (
          let x = firstDetail;
          x < platform.x + platform.w && x < cameraX + viewWidth + 50;
          x += 130
        ) {
          ctx.beginPath()
          ctx.moveTo(x, top + 14)
          ctx.lineTo(x + 18, top + 32)
          ctx.lineTo(x + 10, top + platform.h)
          ctx.stroke()
        }
      }
    }
  }

  private drawCables(state: RenderState): void {
    const { ctx } = this
    const { scene, time, reducedMotion, cameraX, viewWidth } = state
    const terminals = scene.terminals
    for (let i = 0; i < terminals.length - 1; i += 1) {
      const from = terminals[i]
      const to = terminals[i + 1]
      if (!from || !to) continue
      // A curva fica entre os dois terminais; se ambos estão fora, nada a desenhar.
      if (
        (from.x < cameraX - 140 && to.x < cameraX - 140) ||
        (from.x > cameraX + viewWidth + 140 && to.x > cameraX + viewWidth + 140)
      ) {
        continue
      }
      const active = from.state === 'completed'
      const color = active ? scene.theme.cableActive : scene.theme.cableInactive
      const y0 = from.y - 66
      const y1 = to.y - 66
      const cx = (from.x + to.x) / 2
      const cy = Math.max(y0, y1) + 44

      ctx.save()
      ctx.lineCap = 'round'
      ctx.strokeStyle = rgba('#02060c', 0.9)
      ctx.lineWidth = 9
      ctx.beginPath()
      ctx.moveTo(from.x, y0)
      ctx.quadraticCurveTo(cx, cy, to.x, y1)
      ctx.stroke()

      ctx.strokeStyle = rgba(active ? color : '#294357', active ? 0.9 : 0.55)
      ctx.lineWidth = active ? 3 : 2
      if (active) {
        ctx.shadowColor = color
        ctx.shadowBlur = reducedMotion ? 0 : 16 + Math.sin(time * 3 + i) * 4
      }
      ctx.beginPath()
      ctx.moveTo(from.x, y0)
      ctx.quadraticCurveTo(cx, cy, to.x, y1)
      ctx.stroke()
      ctx.shadowBlur = 0

      if (active && !reducedMotion) {
        for (let pulse = 0; pulse < 3; pulse += 1) {
          const t = ((time * 0.38 + pulse / 3 + i * 0.17) % 1)
          const point = quadPoint(from.x, y0, cx, cy, to.x, y1, t)
          ctx.fillStyle = rgba(scene.theme.light, 0.9 - t * 0.35)
          ctx.shadowColor = scene.theme.light
          ctx.shadowBlur = 12
          ctx.beginPath()
          ctx.arc(point.x, point.y, 2.6, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }
      }
      ctx.restore()
    }
  }

  private drawTerminals(state: RenderState): void {
    const { ctx } = this
    const { scene, time, nearby, reducedMotion, cameraX, viewWidth } = state
    for (const terminal of scene.terminals) {
      // Halo, sprite e rótulo cabem em ~140px; o resto fica fora da tela.
      if (terminal.x < cameraX - 140 || terminal.x > cameraX + viewWidth + 140) continue
      const color =
        terminal.state === 'completed'
          ? scene.theme.cableActive
          : terminal.state === 'available'
            ? scene.theme.light
            : scene.theme.cableInactive
      const pulse = reducedMotion ? 0.5 : 0.5 + Math.sin(time * 2.4 + terminal.level.order) * 0.5
      const isNear = nearby === terminal

      ctx.save()
      // Halo de luz volumétrica.
      const halo = ctx.createRadialGradient(
        terminal.x,
        terminal.y - 52,
        4,
        terminal.x,
        terminal.y - 52,
        terminal.state === 'locked' ? 45 : 110,
      )
      halo.addColorStop(0, rgba(color, terminal.state === 'locked' ? 0.08 : 0.24 + pulse * 0.12))
      halo.addColorStop(1, rgba(color, 0))
      ctx.fillStyle = halo
      ctx.fillRect(terminal.x - 120, terminal.y - 170, 240, 220)

      const sprite = this.assets.get(
        terminal.state === 'completed' || terminal.state === 'available'
          ? 'terminal-on'
          : 'terminal-off',
      )
      if (sprite) {
        ctx.drawImage(sprite, terminal.x - 32, terminal.y - 96, 64, 96)
      } else {
        // Pedestal + coluna + núcleo hexagonal (fallback procedural).
        ctx.fillStyle = '#0d1828'
        ctx.fillRect(terminal.x - 22, terminal.y - 12, 44, 12)
        ctx.fillStyle = '#172a40'
        ctx.beginPath()
        ctx.moveTo(terminal.x - 15, terminal.y - 12)
        ctx.lineTo(terminal.x - 11, terminal.y - 70)
        ctx.lineTo(terminal.x + 11, terminal.y - 70)
        ctx.lineTo(terminal.x + 15, terminal.y - 12)
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = rgba(color, terminal.state === 'locked' ? 0.35 : 0.85)
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let side = 0; side < 6; side += 1) {
          const angle = (Math.PI / 3) * side - Math.PI / 6
          const px = terminal.x + Math.cos(angle) * 16
          const py = terminal.y - 62 + Math.sin(angle) * 16
          if (side === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()

        ctx.fillStyle = rgba(color, terminal.state === 'locked' ? 0.12 : 0.5 + pulse * 0.5)
        if (terminal.state !== 'locked') {
          ctx.shadowColor = color
          ctx.shadowBlur = 14
        }
        ctx.beginPath()
        ctx.arc(terminal.x, terminal.y - 62, 6 + pulse * 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0

        // Antena.
        ctx.strokeStyle = rgba(color, 0.5)
        ctx.beginPath()
        ctx.moveTo(terminal.x, terminal.y - 78)
        ctx.lineTo(terminal.x, terminal.y - 92)
        ctx.stroke()
      }

      if (isNear) {
        ctx.strokeStyle = rgba(scene.theme.accent, 0.7)
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 5])
        ctx.beginPath()
        ctx.ellipse(terminal.x, terminal.y - 4, 34, 8, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.font = '600 11px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = rgba(color, terminal.state === 'locked' ? 0.4 : 0.9)
      ctx.fillText(
        `${terminal.level.order.toString().padStart(2, '0')} · ${terminal.level.title}`,
        terminal.x,
        terminal.y + 24,
      )
      ctx.restore()
    }
  }

  private drawPortals(state: RenderState): void {
    const { ctx } = this
    const { scene, time, nearby, reducedMotion } = state
    for (const portal of scene.portals) {
      const color = portal.locked ? '#1b3446' : scene.theme.light
      const isNear = nearby === portal
      const pulse = reducedMotion ? 0.4 : 0.4 + Math.sin(time * 2 + portal.x) * 0.2

      ctx.save()
      const halo = ctx.createRadialGradient(portal.x, portal.y - 66, 6, portal.x, portal.y - 66, 110)
      halo.addColorStop(0, rgba(color, portal.locked ? 0.05 : 0.22 * pulse))
      halo.addColorStop(1, rgba(color, 0))
      ctx.fillStyle = halo
      ctx.fillRect(portal.x - 120, portal.y - 190, 240, 240)

      // Arco de pedra.
      ctx.fillStyle = '#0b1524'
      ctx.beginPath()
      ctx.moveTo(portal.x - 46, portal.y)
      ctx.lineTo(portal.x - 46, portal.y - 80)
      ctx.quadraticCurveTo(portal.x, portal.y - 160, portal.x + 46, portal.y - 80)
      ctx.lineTo(portal.x + 46, portal.y)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = rgba(color, portal.locked ? 0.35 : 0.8)
      ctx.lineWidth = 3
      ctx.stroke()

      // Interior do portal.
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(portal.x - 34, portal.y)
      ctx.lineTo(portal.x - 34, portal.y - 78)
      ctx.quadraticCurveTo(portal.x, portal.y - 140, portal.x + 34, portal.y - 78)
      ctx.lineTo(portal.x + 34, portal.y)
      ctx.closePath()
      ctx.clip()
      const inner = ctx.createLinearGradient(0, portal.y - 140, 0, portal.y)
      inner.addColorStop(0, rgba(color, portal.locked ? 0.04 : 0.16))
      inner.addColorStop(1, rgba('#02050b', 0.9))
      ctx.fillStyle = inner
      ctx.fillRect(portal.x - 40, portal.y - 150, 80, 150)
      if (!portal.locked && !reducedMotion) {
        for (let i = 0; i < 5; i += 1) {
          const y = portal.y - 10 - ((time * 22 + i * 27) % 115)
          ctx.fillStyle = rgba(scene.theme.light, 0.16)
          ctx.fillRect(portal.x - 30, y, 60, 1.5)
        }
      }
      ctx.restore()

      if (isNear) {
        ctx.strokeStyle = rgba(scene.theme.accent, 0.8)
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 5])
        ctx.beginPath()
        ctx.ellipse(portal.x, portal.y - 2, 52, 10, 0, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])
      }

      ctx.font = '600 12px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillStyle = rgba(portal.locked ? '#5d7085' : color, 0.95)
      ctx.fillText(portal.locked ? portal.lockedLabel : portal.label, portal.x, portal.y + 26)
      ctx.restore()
    }
  }

  private drawPlayer(state: RenderState): void {
    const { ctx } = this
    const { player, scene, time, reducedMotion } = state
    const moving = Math.abs(player.vx) > 40
    const airborne = !player.onGround
    const key: AssetKey = airborne ? 'player-jump' : moving ? 'player-run' : 'player-idle'
    const sprite = this.assets.get(key)
    const centerX = player.x + player.w / 2
    const bottom = player.y + player.h

    ctx.save()
    if (player.dashTimer > 0 && !reducedMotion) {
      for (let i = 1; i <= 4; i += 1) {
        ctx.save()
        ctx.globalAlpha = 0.12 / i
        ctx.fillStyle = scene.theme.light
        ctx.fillRect(player.x - player.facing * i * 9, player.y, player.w, player.h)
        ctx.restore()
      }
    }

    if (sprite) {
      ctx.drawImage(sprite, player.x - 9, player.y - 14, player.w + 18, player.h + 18)
    } else {
      const flap = Math.sin(time * (moving ? 12 : 3)) * (moving ? 9 : 3)
      // Capa: silhueta que se arrasta atrás do autômato.
      ctx.fillStyle = '#0a1a2b'
      ctx.beginPath()
      ctx.moveTo(centerX - player.facing * 4, player.y + 7)
      ctx.quadraticCurveTo(
        centerX - player.facing * (24 + flap),
        player.y + 22 + flap * 0.3,
        centerX - player.facing * (18 + flap * 0.6),
        bottom + 8,
      )
      ctx.quadraticCurveTo(centerX + player.facing * 4, bottom - 2, centerX + player.facing * 5, player.y + 10)
      ctx.closePath()
      ctx.fill()

      // Corpo.
      ctx.fillStyle = '#12253b'
      ctx.beginPath()
      ctx.roundRect(player.x + 2, player.y + 8, player.w - 4, player.h - 8, 5)
      ctx.fill()
      ctx.strokeStyle = rgba(scene.theme.light, 0.45)
      ctx.lineWidth = 1
      ctx.stroke()

      // Cabeça e olho luminoso.
      ctx.fillStyle = '#162c45'
      ctx.beginPath()
      ctx.arc(centerX, player.y + 8, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = scene.theme.light
      ctx.shadowColor = scene.theme.light
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(centerX + player.facing * 3, player.y + 7, 2.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Lanterna pendente.
      const lanternX = centerX + player.facing * 13
      const lanternY = bottom - 8 + Math.sin(time * 5) * 1.5
      const glow = ctx.createRadialGradient(lanternX, lanternY, 1, lanternX, lanternY, 28)
      glow.addColorStop(0, rgba(scene.theme.accent, 0.55))
      glow.addColorStop(1, rgba(scene.theme.accent, 0))
      ctx.fillStyle = glow
      ctx.fillRect(lanternX - 30, lanternY - 30, 60, 60)
      ctx.fillStyle = scene.theme.accent
      ctx.beginPath()
      ctx.arc(lanternX, lanternY, 2.4, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawDust(state: RenderState): void {
    if (state.reducedMotion) return
    const { ctx } = this
    const { time, viewWidth, viewHeight, cameraX, scene } = state
    ctx.save()
    for (let i = 0; i < 54; i += 1) {
      const baseX = (i * 137.31) % (viewWidth + 80)
      const drift = Math.sin(time * 0.35 + i * 1.7) * 18
      const x = ((baseX + drift - cameraX * 0.12) % (viewWidth + 80) + viewWidth + 80) % (viewWidth + 80) - 40
      const y =
        ((i * 83.77 + time * (6 + (i % 5) * 3)) % (viewHeight + 60)) - 30
      const alpha = 0.08 + ((i % 7) / 7) * 0.18
      ctx.fillStyle = rgba(i % 9 === 0 ? scene.theme.accent : scene.theme.light, alpha)
      ctx.beginPath()
      ctx.arc(x, y, i % 11 === 0 ? 1.8 : 1, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  private drawVignette(width: number, height: number, background: string): void {
    const { ctx } = this
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      height * 0.28,
      width / 2,
      height / 2,
      height * 0.95,
    )
    gradient.addColorStop(0, 'rgba(0,0,0,0)')
    gradient.addColorStop(1, background)
    ctx.save()
    ctx.globalAlpha = 0.85
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    ctx.restore()
  }
}
