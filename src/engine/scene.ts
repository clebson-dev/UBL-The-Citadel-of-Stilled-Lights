import type { Discipline, GameArea, Level, ThemeColors } from '../types/game'
import type { Platform } from './physics'

export type TerminalState = 'locked' | 'available' | 'completed'

export interface TerminalNode {
  level: Level
  x: number
  /** Y do "pé" do terminal, em coordenadas do mundo. */
  y: number
  state: TerminalState
}

export interface PortalNode {
  disciplineId: string
  label: string
  x: number
  y: number
  locked: boolean
  lockedLabel: string
}

export interface Scene {
  area: GameArea
  width: number
  height: number
  platforms: Platform[]
  terminals: TerminalNode[]
  portals: PortalNode[]
  playerStart: { x: number; y: number }
  theme: ThemeColors
  title: string
}

const GROUND_Y = 470
const WORLD_HEIGHT = 540

const hubTheme: ThemeColors = {
  background: '#070d18',
  light: '#57e0ff',
  cableActive: '#5ef2c8',
  cableInactive: '#1b3446',
  accent: '#f2c14e',
}

/** Constrói o Pátio Central com os portais de todas as disciplinas carregadas. */
export function buildHubScene(disciplines: Discipline[]): Scene {
  // Portais vivos primeiro: o jogador encontra o conteúdo jogável antes das placas "Em Breve".
  const ordered = [
    ...disciplines.filter((item) => !item.locked),
    ...disciplines.filter((item) => item.locked),
  ]
  const portals: PortalNode[] = []
  const count = Math.max(ordered.length, 2)
  const spacing = 460
  const startX = 520

  ordered.forEach((discipline, index) => {
    portals.push({
      disciplineId: discipline.id,
      label: discipline.name,
      x: startX + index * spacing,
      y: GROUND_Y,
      locked: discipline.locked,
      lockedLabel: 'Em Breve',
    })
  })

  const width = startX + count * spacing + 320
  const platforms: Platform[] = [
    { x: 0, y: GROUND_Y, w: width, h: WORLD_HEIGHT - GROUND_Y, kind: 'ground' },
    { x: 250, y: 396, w: 170, h: 16, kind: 'ledge' },
    { x: 1080, y: 384, w: 190, h: 16, kind: 'ledge' },
    { x: 1860, y: 392, w: 210, h: 16, kind: 'ledge' },
  ]
  return {
    area: 'hub',
    width,
    height: WORLD_HEIGHT,
    platforms,
    terminals: [],
    portals,
    playerStart: { x: 140, y: GROUND_Y - 60 },
    theme: hubTheme,
    title: 'Pátio Central',
  }
}

/** Constrói o mapa linear de terminais de uma disciplina. */
export function buildDisciplineScene(
  discipline: Discipline,
  completedIds: Set<string>,
): Scene {
  const theme = discipline.wings[0]?.themeColors ?? discipline.themeColors
  const width = 260 + discipline.levels.length * 330 + 240
  const platforms: Platform[] = [
    { x: 0, y: GROUND_Y, w: width, h: WORLD_HEIGHT - GROUND_Y, kind: 'ground' },
  ]
  const terminals: TerminalNode[] = []
  const completedCount = discipline.levels.filter((level) =>
    completedIds.has(level.id),
  ).length

  discipline.levels.forEach((level, index) => {
    const x = 260 + index * 330
    const elevated = index % 2 === 1
    // Altura sempre <= 90px acima do chão: o pulo do Andarilho alcança (~94px).
    const ledgeY = 398 - (index % 3) * 8
    if (elevated) {
      platforms.push({ x: x - 76, y: ledgeY, w: 172, h: 14, kind: 'ledge' })
    }
    const baseY = elevated ? ledgeY : GROUND_Y
    const completed = completedIds.has(level.id)
    const state: TerminalState = completed
      ? 'completed'
      : level.order === completedCount + 1
        ? 'available'
        : 'locked'
    terminals.push({ level, x, y: baseY, state })
  })

  return {
    area: 'discipline',
    width,
    height: WORLD_HEIGHT,
    platforms,
    terminals,
    portals: [
      {
        disciplineId: 'hub',
        label: 'Pátio Central',
        x: 80,
        y: GROUND_Y,
        locked: false,
        lockedLabel: '',
      },
    ],
    playerStart: { x: 150, y: GROUND_Y - 60 },
    theme,
    title: discipline.name,
  }
}

/** Terminal mais próximo e acessível dentro do raio de interação. */
export function nearestInteractable(
  scene: Scene,
  x: number,
  y: number,
): TerminalNode | PortalNode | null {
  const radius = 92
  let best: TerminalNode | PortalNode | null = null
  let bestDistance = radius

  for (const terminal of scene.terminals) {
    if (terminal.state !== 'available') continue
    // Filtro barato antes da raiz: fora do raio em x, a distância já é maior.
    if (Math.abs(terminal.x - x) > radius) continue
    const distance = Math.hypot(terminal.x - x, terminal.y - 44 - y)
    if (distance < bestDistance) {
      best = terminal
      bestDistance = distance
    }
  }
  for (const portal of scene.portals) {
    const distance = Math.hypot(portal.x - x, portal.y - 60 - y)
    if (distance < bestDistance) {
      best = portal
      bestDistance = distance
    }
  }
  return best
}
