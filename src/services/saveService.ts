import type { SaveData, Settings } from '../types/game'

/**
 * Camada de persistência desacoplada e versionada.
 *
 * A UI nunca toca localStorage diretamente: trocar o adapter (localStorage ↔
 * filesystem do Tauri ↔ backend remoto) não exige alterar uma linha dos componentes.
 */

export const SAVE_VERSION = 1 as const
export const SAVE_STORAGE_KEY = 'ubl-citadel-save'
const TAURI_SAVE_PATH = 'ubl-citadel-save.json'

type StorageAdapter = {
  read: () => Promise<string | null>
  write: (value: string) => Promise<void>
}

export const defaultSettings: Settings = {
  forceTouchControls: false,
  reducedMotion: false,
  masterVolume: 0.7,
}

export function createDefaultSave(): SaveData {
  const now = new Date().toISOString()
  return {
    saveVersion: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    currentDisciplineId: null,
    disciplines: {},
    notes: {},
    settings: { ...defaultSettings },
  }
}

/** Detecta a casca Tauri sem importar APIs nativas no browser. */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

const localStorageAdapter: StorageAdapter = {
  async read() {
    try {
      return window.localStorage.getItem(SAVE_STORAGE_KEY)
    } catch {
      return null
    }
  },
  async write(value) {
    window.localStorage.setItem(SAVE_STORAGE_KEY, value)
  },
}

let tauriAdapter: StorageAdapter | null = null

/** Adapter do Tauri carregado sob demanda; falha silenciosamente volta ao localStorage. */
async function getTauriAdapter(): Promise<StorageAdapter | null> {
  if (!isTauri()) return null
  if (tauriAdapter) return tauriAdapter

  try {
    const [{ BaseDirectory, readTextFile, writeTextFile }] = await Promise.all([
      import('@tauri-apps/plugin-fs'),
    ])
    tauriAdapter = {
      async read() {
        try {
          return await readTextFile(TAURI_SAVE_PATH, { baseDir: BaseDirectory.AppData })
        } catch {
          return null
        }
      },
      async write(value) {
        await writeTextFile(TAURI_SAVE_PATH, value, {
          baseDir: BaseDirectory.AppData,
        })
      },
    }
    return tauriAdapter
  } catch {
    return null
  }
}

async function getAdapter(): Promise<StorageAdapter> {
  return (await getTauriAdapter()) ?? localStorageAdapter
}

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Pipeline de migração. Hoje só existe a versão 1, mas o ponto de extensão
 * já está aqui: basta adicionar um `case` por versão antiga.
 */
export function migrateSave(raw: unknown): SaveData {
  if (!isRecord(raw)) return createDefaultSave()

  let source: UnknownRecord = raw
  let version = typeof source.saveVersion === 'number' ? source.saveVersion : 0

  if (version === 0) {
    // Saves pré-versionamento (protótipos): preserva o que der para aproveitar.
    source = {
      ...source,
      saveVersion: SAVE_VERSION,
      disciplines: isRecord(source.disciplines) ? source.disciplines : {},
      notes: isRecord(source.notes) ? source.notes : {},
      settings: isRecord(source.settings) ? source.settings : {},
    }
    version = SAVE_VERSION
  }

  if (version !== SAVE_VERSION) {
    // Versão mais nova que a deste build: não destruir o progresso do jogador.
    source = { ...source, saveVersion: SAVE_VERSION }
  }

  const now = new Date().toISOString()
  const disciplines: SaveData['disciplines'] = {}
  if (isRecord(source.disciplines)) {
    for (const [disciplineId, value] of Object.entries(source.disciplines)) {
      if (!isRecord(value)) continue
      const levels: SaveData['disciplines'][string]['levels'] = {}
      if (isRecord(value.levels)) {
        for (const [levelId, levelValue] of Object.entries(value.levels)) {
          if (!isRecord(levelValue) || levelValue.completed !== true) continue
          levels[levelId] = {
            completed: true,
            completedAt:
              typeof levelValue.completedAt === 'string' ? levelValue.completedAt : now,
          }
        }
      }
      const loreFragments = Array.isArray(value.loreFragments)
        ? value.loreFragments.filter((id): id is string => typeof id === 'string')
        : []
      disciplines[disciplineId] = { levels, loreFragments: [...new Set(loreFragments)] }
    }
  }

  const notes: Record<string, string> = {}
  if (isRecord(source.notes)) {
    for (const [id, value] of Object.entries(source.notes)) {
      if (typeof value === 'string') notes[id] = value
    }
  }

  const storedSettings = isRecord(source.settings) ? source.settings : {}
  const settings: Settings = {
    forceTouchControls:
      typeof storedSettings.forceTouchControls === 'boolean'
        ? storedSettings.forceTouchControls
        : defaultSettings.forceTouchControls,
    reducedMotion:
      typeof storedSettings.reducedMotion === 'boolean'
        ? storedSettings.reducedMotion
        : defaultSettings.reducedMotion,
    masterVolume:
      typeof storedSettings.masterVolume === 'number' &&
      Number.isFinite(storedSettings.masterVolume)
        ? Math.min(1, Math.max(0, storedSettings.masterVolume))
        : defaultSettings.masterVolume,
  }

  return {
    saveVersion: SAVE_VERSION,
    createdAt: typeof source.createdAt === 'string' ? source.createdAt : now,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : now,
    currentDisciplineId:
      typeof source.currentDisciplineId === 'string' ? source.currentDisciplineId : null,
    disciplines,
    notes,
    settings,
  }
}

/** Lê, migra e devolve o save. Nunca lança: um save corrompido recomeça limpo. */
export async function loadSave(): Promise<SaveData> {
  try {
    const raw = await (await getAdapter()).read()
    if (!raw) return createDefaultSave()
    return migrateSave(JSON.parse(raw) as unknown)
  } catch {
    return createDefaultSave()
  }
}

export async function writeSave(data: SaveData): Promise<SaveData> {
  const next: SaveData = { ...data, saveVersion: SAVE_VERSION, updatedAt: new Date().toISOString() }
  try {
    await (await getAdapter()).write(JSON.stringify(next, null, 2))
  } catch {
    // Tauri sem permissão de fs: mantém o espelho no localStorage.
    try {
      localStorageAdapter.write(JSON.stringify(next))
    } catch {
      /* armazenamento indisponível — o jogo segue em memória */
    }
  }
  return next
}

export async function mutateSave(
  current: SaveData,
  mutate: (draft: SaveData) => void,
): Promise<SaveData> {
  const draft: SaveData = structuredClone(current)
  mutate(draft)
  return writeSave(draft)
}

export function markLevelCompleted(
  save: SaveData,
  disciplineId: string,
  levelId: string,
  loreFragmentId?: string,
): SaveData {
  const discipline = save.disciplines[disciplineId] ?? { levels: {}, loreFragments: [] }
  return {
    ...save,
    disciplines: {
      ...save.disciplines,
      [disciplineId]: {
        levels: {
          ...discipline.levels,
          [levelId]: { completed: true, completedAt: new Date().toISOString() },
        },
        loreFragments: loreFragmentId
          ? [...new Set([...discipline.loreFragments, loreFragmentId])]
          : discipline.loreFragments,
      },
    },
  }
}

export function isLevelCompleted(
  save: SaveData,
  disciplineId: string,
  levelId: string,
): boolean {
  return save.disciplines[disciplineId]?.levels[levelId]?.completed === true
}

export function completedLevelCount(save: SaveData, disciplineId: string): number {
  return Object.values(save.disciplines[disciplineId]?.levels ?? {}).filter(
    (entry) => entry.completed,
  ).length
}

/** Exporta o save como arquivo JSON (browser ou Tauri). */
export function exportSave(data: SaveData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `ubl-citadel-save-v${data.saveVersion}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

/** Importa um JSON validando-o antes de substituir o save atual. */
export async function importSave(file: File): Promise<SaveData> {
  const text = await file.text()
  const parsed = JSON.parse(text) as unknown
  if (!isRecord(parsed) || parsed.saveVersion === undefined) {
    throw new Error('Arquivo inválido: não parece ser um save da Cidadela.')
  }
  const migrated = migrateSave(parsed)
  return writeSave(migrated)
}

export async function resetSave(): Promise<SaveData> {
  return writeSave(createDefaultSave())
}
