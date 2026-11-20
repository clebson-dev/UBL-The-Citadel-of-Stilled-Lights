/**
 * npm run validate — guardião da integridade do conteúdo.
 *
 * Checa, nesta ordem:
 *  1. todos os JSONs de src/data/disciplines/ passam no schema Zod;
 *  2. orders de wings/levels são estritamente sequenciais (1..N);
 *  3. IDs de nível/disciplina/ala são únicos e referências são válidas;
 *  4. desafios são solucionáveis (quiz e logic_toggle);
 *  5. todo loreFragment.id está registrado em docs/lore/misterios.md.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { disciplineSchema } from '../src/schemas/discipline.schema'
import type { Discipline, Level } from '../src/types/game'
import { evaluateGate } from '../src/services/logicService'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const disciplinesDir = join(root, 'src', 'data', 'disciplines')
const mysteriesPath = join(root, 'docs', 'lore', 'misterios.md')

const errors: string[] = []
const warnings: string[] = []

function fail(message: string): void {
  errors.push(message)
}

function warn(message: string): void {
  warnings.push(message)
}

function assertSequential(values: number[], label: string): void {
  values.forEach((value, index) => {
    if (value !== index + 1) {
      fail(`${label}: order ${value} na posição ${index + 1}; esperado ${index + 1}.`)
    }
  })
}

function validateChallenge(level: Level, disciplineId: string): void {
  const challenge = level.challenge
  if (challenge.type === 'quiz') {
    if (challenge.correctIndex >= challenge.options.length) {
      fail(
        `${disciplineId}/${level.id}: correctIndex ${challenge.correctIndex} fora do intervalo de ${challenge.options.length} opções.`,
      )
    }
    if (new Set(challenge.options).size !== challenge.options.length) {
      warn(`${disciplineId}/${level.id}: opções de quiz repetidas.`)
    }
    return
  }

  const ids = challenge.inputs.map((input) => input.id)
  if (new Set(ids).size !== ids.length) {
    fail(`${disciplineId}/${level.id}: IDs de entrada duplicados no logic_toggle.`)
  }
  const solutions: number[][] = []
  const combinations = 2 ** ids.length
  for (let mask = 0; mask < combinations; mask += 1) {
    solutions.push(ids.map((_, index) => ((mask >> index) & 1) as 0 | 1))
  }
  const solvable = challenge.allowedOperations.some((operation) =>
    solutions.some(
      (values) => evaluateGate(operation, values) === challenge.expectedOutput,
    ),
  )
  if (!solvable) {
    fail(
      `${disciplineId}/${level.id}: logic_toggle sem solução para as operações permitidas.`,
    )
  }
}

interface MysteryEntry {
  reference: string
  status: string
}

/** Lê a tabela canônica de mistérios: ID → (disciplina/nível, status). */
function readMysteries(): Map<string, MysteryEntry> {
  const entries = new Map<string, MysteryEntry>()
  let text: string
  try {
    text = readFileSync(mysteriesPath, 'utf8')
  } catch {
    fail(`Não foi possível ler docs/lore/misterios.md.`)
    return entries
  }

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) continue
    const cells = line.split('|').map((cell) => cell.trim())
    const id = /^`?(log-[a-z0-9-]+)`?$/.exec(cells[1] ?? '')?.[1]
    if (!id) continue
    const status = cells[4] ?? ''
    if (!['Em Aberto', 'Resolvido'].includes(status)) {
      fail(`misterios.md/${id}: status inválido "${status}".`)
    }
    if (entries.has(id)) fail(`misterios.md: ID duplicado ${id}.`)
    entries.set(id, { reference: cells[2] ?? '', status })
  }
  return entries
}

function loadDisciplines(): Discipline[] {
  let files: string[]
  try {
    files = readdirSync(disciplinesDir).filter((name) => name.endsWith('.json')).sort()
  } catch {
    fail(`Pasta não encontrada: src/data/disciplines/`)
    return []
  }

  if (files.length === 0) fail('Nenhum JSON de disciplina encontrado.')

  const result: Discipline[] = []
  for (const file of files) {
    let raw: unknown
    try {
      raw = JSON.parse(readFileSync(join(disciplinesDir, file), 'utf8')) as unknown
    } catch (error) {
      fail(`${file}: JSON inválido — ${(error as Error).message}`)
      continue
    }
    const parsed = disciplineSchema.safeParse(raw)
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fail(`${file}: ${issue.path.join('.') || '(raiz)'} — ${issue.message}`)
      }
      continue
    }
    // Atribuição tipada garante que schema e types não divergence silenciosamente.
    const discipline: Discipline = parsed.data
    result.push(discipline)
  }
  return result
}

function main(): void {
  const disciplines = loadDisciplines()
  const mysteries = readMysteries()
  const allDisciplineIds = new Set<string>()
  const allLevelIds = new Set<string>()
  const allFragmentIds = new Set<string>()

  for (const discipline of disciplines) {
    if (allDisciplineIds.has(discipline.id)) {
      fail(`ID de disciplina duplicado: ${discipline.id}`)
    }
    allDisciplineIds.add(discipline.id)

    assertSequential(
      discipline.wings.map((wing) => wing.order),
      `${discipline.id}: wings`,
    )
    const wingIds = new Set<string>()
    for (const wing of discipline.wings) {
      if (wingIds.has(wing.id)) fail(`${discipline.id}: wing duplicado ${wing.id}`)
      wingIds.add(wing.id)
    }

    assertSequential(
      discipline.levels.map((level) => level.order),
      `${discipline.id}: levels`,
    )
    for (const level of discipline.levels) {
      if (allLevelIds.has(level.id)) fail(`ID de nível duplicado: ${level.id}`)
      allLevelIds.add(level.id)
      if (!wingIds.has(level.wingId)) {
        fail(`${discipline.id}/${level.id}: wingId "${level.wingId}" não existe.`)
      }
      validateChallenge(level, discipline.id)

      const fragment = level.loreFragment
      if (fragment) {
        if (allFragmentIds.has(fragment.id)) {
          fail(`ID de fragmento duplicado: ${fragment.id}`)
        }
        allFragmentIds.add(fragment.id)
        const mystery = mysteries.get(fragment.id)
        if (!mystery) {
          fail(
            `${discipline.id}/${level.id}: fragmento ${fragment.id} NÃO está registrado em docs/lore/misterios.md.`,
          )
        } else {
          const expected = `${discipline.id} / ${level.id}`
          if (mystery.reference !== expected) {
            fail(
              `misterios.md/${fragment.id}: associação "${mystery.reference}" divergente do JSON (${expected}).`,
            )
          }
        }
      }
    }
  }

  // Aviso útil: pistas registradas no cânone que ainda não têm JSON correspondente
  // são legítimas (mistérios em aberto), mas merecem visibilidade.
  for (const id of mysteries.keys()) {
    if (!allFragmentIds.has(id)) {
      warn(`Fragmento ${id} registrado no lore ainda não existe em nenhuma disciplina.`)
    }
  }

  if (warnings.length > 0) {
    for (const warning of warnings) console.warn(`⚠ ${warning}`)
  }
  if (errors.length > 0) {
    for (const error of errors) console.error(`✖ ${error}`)
    console.error(`\nValidação falhou: ${errors.length} erro(s).`)
    process.exit(1)
  }

  const levelCount = disciplines.reduce((sum, item) => sum + item.levels.length, 0)
  const fragmentCount = allFragmentIds.size
  console.log(
    `✔ Conteúdo válido: ${disciplines.length} disciplina(s), ${levelCount} nível(is), ` +
      `${fragmentCount} fragmento(s) sincronizado(s) com o lore.`,
  )
}

main()
