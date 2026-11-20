import { getWing } from '../services/contentService'
import { isLevelCompleted } from '../services/saveService'
import type { Discipline, Level, SaveData, Wing } from '../types/game'

/** Direção de progresso: o motor nunca calcula regras pedagógicas, apenas consome o resultado. */

export function completedLevelIds(save: SaveData, discipline: Discipline | undefined): Set<string> {
  return new Set(
    (discipline?.levels ?? [])
      .filter((level) => isLevelCompleted(save, discipline?.id ?? '', level.id))
      .map((level) => level.id),
  )
}

export function isDisciplineComplete(save: SaveData, discipline: Discipline): boolean {
  return discipline.levels.length > 0 && discipline.levels.every((level) =>
    isLevelCompleted(save, discipline.id, level.id),
  )
}

/** Recompensa de 100% de qualquer disciplina concede o Dash no Hub. */
export function isDashUnlocked(save: SaveData, disciplines: Discipline[]): boolean {
  return disciplines.some((discipline) => isDisciplineComplete(save, discipline))
}

export function wingForLevel(discipline: Discipline | undefined, level?: Level): Wing | undefined {
  if (!discipline) return undefined
  return level ? getWing(discipline, level) : discipline.wings[0]
}
