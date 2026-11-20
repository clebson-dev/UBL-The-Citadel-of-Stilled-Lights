/**
 * Física 2D pura — nenhuma chamada de Canvas vive aqui.
 * A separação hitbox ↔ renderização permite trocar todos os sprites sem
 * alterar uma única regra de colisão.
 */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Platform extends Rect {
  /** Usado pelo renderer para escolher o desenho procedural. */
  kind?: 'ground' | 'ledge' | 'pillar'
}

export interface PlayerBody {
  x: number
  y: number
  w: number
  h: number
  vx: number
  vy: number
  facing: 1 | -1
  onGround: boolean
  coyoteTime: number
  dashTimer: number
  dashCooldown: number
}

export const PLAYER_WIDTH = 20
export const PLAYER_HEIGHT = 34
const GRAVITY = 1750
const MOVE_SPEED = 235
const JUMP_SPEED = -575
const MAX_FALL = 900
const COYOTE = 0.1
const DASH_SPEED = 660
const DASH_TIME = 0.13
const DASH_COOLDOWN = 0.55

export function createPlayer(x: number, y: number): PlayerBody {
  return {
    x,
    y,
    w: PLAYER_WIDTH,
    h: PLAYER_HEIGHT,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    coyoteTime: 0,
    dashTimer: 0,
    dashCooldown: 0,
  }
}

export function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  )
}

function resolveAxis(player: PlayerBody, platforms: Platform[], axis: 'x' | 'y'): void {
  for (const platform of platforms) {
    if (!overlaps(player, platform)) continue
    if (axis === 'x') {
      if (player.vx > 0) player.x = platform.x - player.w
      else if (player.vx < 0) player.x = platform.x + platform.w
      player.vx = 0
    } else {
      if (player.vy > 0) {
        player.y = platform.y - player.h
        player.onGround = true
      } else if (player.vy < 0) {
        player.y = platform.y + platform.h
      }
      player.vy = 0
    }
  }
}

export interface StepOptions {
  left: boolean
  right: boolean
  jumpPressed: boolean
  dashPressed: boolean
  dashUnlocked: boolean
  worldWidth: number
}

export function stepPlayer(
  player: PlayerBody,
  platforms: Platform[],
  dt: number,
  options: StepOptions,
): void {
  const wasOnGround = player.onGround
  player.onGround = false
  player.dashCooldown = Math.max(0, player.dashCooldown - dt)
  player.dashTimer = Math.max(0, player.dashTimer - dt)

  const direction = (options.right ? 1 : 0) - (options.left ? 1 : 0)
  if (direction !== 0 && player.dashTimer <= 0) {
    player.facing = direction > 0 ? 1 : -1
    player.vx = direction * MOVE_SPEED
  } else if (player.dashTimer <= 0) {
    player.vx *= Math.max(0, 1 - dt * 14)
  }

  if (wasOnGround) player.coyoteTime = COYOTE
  else player.coyoteTime = Math.max(0, player.coyoteTime - dt)

  if (options.jumpPressed && player.coyoteTime > 0 && player.dashTimer <= 0) {
    player.vy = JUMP_SPEED
    player.coyoteTime = 0
    player.onGround = false
  }

  if (
    options.dashUnlocked &&
    options.dashPressed &&
    player.dashCooldown <= 0 &&
    player.dashTimer <= 0
  ) {
    player.dashTimer = DASH_TIME
    player.dashCooldown = DASH_COOLDOWN
    player.vx = player.facing * DASH_SPEED
    player.vy = 0
  }

  if (player.dashTimer <= 0) {
    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt)
  }

  player.x += player.vx * dt
  resolveAxis(player, platforms, 'x')
  player.y += player.vy * dt
  resolveAxis(player, platforms, 'y')

  player.x = Math.max(0, Math.min(options.worldWidth - player.w, player.x))
  if (player.y > 900) {
    player.y = 120
    player.vy = 0
  }
}
