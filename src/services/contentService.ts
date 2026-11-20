import { disciplineSchema } from '../schemas/discipline.schema'
import type { Discipline, Level, LoreFragment, Wing } from '../types/game'

/**
 * Carregador único de conteúdo. Novos JSONs em src/data/disciplines/ entram
 * automaticamente no jogo — nenhuma lista manual de imports precisa mudar.
 */
const modules = import.meta.glob('../data/disciplines/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, unknown>

let cache: Discipline[] | null = null

export function loadDisciplines(): Discipline[] {
  if (cache) return cache

  const loaded: Discipline[] = []
  for (const [path, raw] of Object.entries(modules)) {
    const parsed = disciplineSchema.safeParse(raw)
    if (!parsed.success) {
      console.error(`[conteúdo inválido] ${path}`, parsed.error.issues)
      continue
    }
    loaded.push(parsed.data)
  }

  cache = loaded.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  return cache
}

export function getDiscipline(id: string | null | undefined): Discipline | undefined {
  if (!id) return undefined
  return loadDisciplines().find((discipline) => discipline.id === id)
}

export function getWing(discipline: Discipline, level: Level): Wing | undefined {
  return discipline.wings.find((wing) => wing.id === level.wingId)
}

export function getLevel(
  discipline: Discipline,
  levelId: string,
): Level | undefined {
  return discipline.levels.find((level) => level.id === levelId)
}

export interface CataloguedFragment extends LoreFragment {
  disciplineId: string
  disciplineName: string
  levelId: string
  levelTitle: string
}

/** Fragmentos já desbloqueáveis no conteúdo atual, com procedência para o Diário. */
export function catalogFragments(): CataloguedFragment[] {
  const result: CataloguedFragment[] = []
  for (const discipline of loadDisciplines()) {
    for (const level of discipline.levels) {
      if (!level.loreFragment) continue
      result.push({
        ...level.loreFragment,
        disciplineId: discipline.id,
        disciplineName: discipline.name,
        levelId: level.id,
        levelTitle: level.title,
      })
    }
  }
  return result
}
