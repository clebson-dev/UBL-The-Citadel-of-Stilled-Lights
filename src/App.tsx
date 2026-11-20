import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GameCanvas, type GameCanvasHandle } from './components/GameCanvas'
import { HUD } from './components/HUD'
import { LoreJournal } from './components/LoreJournal'
import { SettingsPanel } from './components/SettingsPanel'
import { TerminalModal } from './components/TerminalModal'
import { TouchControls } from './components/TouchControls'
import type { EngineCallbacks, NearbyTarget } from './engine/gameEngine'
import { deviceHasTouch, type InputController } from './engine/input'
import { assetManager } from './engine/assetManager'
import {
  completedLevelIds,
  isDashUnlocked,
  isDisciplineComplete,
  wingForLevel,
} from './game/progression'
import {
  catalogFragments,
  getDiscipline,
  getLevel,
  loadDisciplines,
} from './services/contentService'
import {
  exportSave,
  importSave,
  isLevelCompleted,
  loadSave,
  markLevelCompleted,
  mutateSave,
  resetSave,
  writeSave,
} from './services/saveService'
import type { GameArea, SaveData, Settings } from './types/game'

export default function App() {
  const disciplines = useMemo(() => loadDisciplines(), [])
  const fragments = useMemo(() => catalogFragments(), [])
  const gameRef = useRef<GameCanvasHandle>(null)
  const [save, setSave] = useState<SaveData | null>(null)
  const [input, setInput] = useState<InputController | null>(null)
  const [area, setArea] = useState<GameArea>('hub')
  const [activeDisciplineId, setActiveDisciplineId] = useState<string | null>(null)
  const [nearby, setNearby] = useState<NearbyTarget | null>(null)
  const [openLevelId, setOpenLevelId] = useState<string | null>(null)
  const [showLore, setShowLore] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const activeDiscipline = getDiscipline(activeDisciplineId)
  const openLevel = activeDiscipline && openLevelId
    ? getLevel(activeDiscipline, openLevelId)
    : undefined
  const collected = useMemo(() => {
    const ids = new Set<string>()
    if (save) {
      for (const progress of Object.values(save.disciplines)) {
        for (const id of progress.loreFragments) ids.add(id)
      }
    }
    return ids
  }, [save])

  useEffect(() => {
    assetManager.prepare()
    void loadSave().then((loaded) => {
      setSave(loaded)
      if (loaded.currentDisciplineId) {
        setActiveDisciplineId(loaded.currentDisciplineId)
        gameRef.current?.setArea('discipline', loaded.currentDisciplineId)
      }
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const overlayOpen = !!openLevelId || showLore || showSettings
  useEffect(() => {
    if (overlayOpen) gameRef.current?.pause()
    else gameRef.current?.resume()
  }, [overlayOpen])

  // Propaga progresso e habilidades para o motor sempre que o save muda.
  useEffect(() => {
    if (!save) return
    const discipline = getDiscipline(activeDisciplineId)
    gameRef.current?.updateProgress(
      completedLevelIds(save, discipline),
      isDashUnlocked(save, disciplines),
    )
  }, [save, activeDisciplineId, disciplines])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      if (openLevelId) setOpenLevelId(null)
      else if (showLore) setShowLore(false)
      else if (showSettings) setShowSettings(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openLevelId, showLore, showSettings])

  const enterDiscipline = useCallback((disciplineId: string) => {
    const discipline = getDiscipline(disciplineId)
    if (!discipline) return
    if (discipline.locked) {
      setToast(`${discipline.name}: Em Construção — este portal ainda está apagado.`)
      return
    }
    setActiveDisciplineId(disciplineId)
    gameRef.current?.setArea('discipline', disciplineId)
    void loadSave().then((current) =>
      setSave({ ...current, currentDisciplineId: disciplineId, updatedAt: new Date().toISOString() }),
    )
  }, [])

  const enterHub = useCallback(() => {
    gameRef.current?.setArea('hub')
    setActiveDisciplineId(null)
    void loadSave().then((current) =>
      setSave({ ...current, currentDisciplineId: null, updatedAt: new Date().toISOString() }),
    )
  }, [])

  const callbacks = useMemo<EngineCallbacks>(
    () => ({
      onTerminalInteract: (levelId) => setOpenLevelId(levelId),
      onPortalInteract: (disciplineId) => {
        if (disciplineId === 'hub') enterHub()
        else enterDiscipline(disciplineId)
      },
      onNearbyChange: (target: NearbyTarget | null) => setNearby(target),
      onAreaChange: (nextArea) => setArea(nextArea),
      onJournalToggle: () => setShowLore((value) => !value),
    }),
    [enterDiscipline, enterHub],
  )

  const handleSolved = useCallback(
    (loreFragmentId?: string) => {
      if (!activeDiscipline || !openLevelId || !save) return
      const level = getLevel(activeDiscipline, openLevelId)
      if (!level) return
      const wasCompleted = isLevelCompleted(save, activeDiscipline.id, level.id)
      const hadFragment = loreFragmentId ? collected.has(loreFragmentId) : true

      const next = markLevelCompleted(save, activeDiscipline.id, level.id, loreFragmentId)
      void writeSave(next).then(setSave)

      if (!wasCompleted && loreFragmentId && !hadFragment) {
        setToast(`Fragmento de log desbloqueado: ${level.loreFragment?.title ?? loreFragmentId}`)
      }
      if (!wasCompleted) {
        if (isDisciplineComplete(save, activeDiscipline)) {
          setToast(`Recompensa do Hub desbloqueada: ${activeDiscipline.hubReward.title}!`)
        }
      }
    },
    [activeDiscipline, openLevelId, save, collected],
  )

  const handleSettingsChange = useCallback(
    (patch: Partial<Settings>) => {
      if (!save) return
      void writeSave({ ...save, settings: { ...save.settings, ...patch } }).then(setSave)
    },
    [save],
  )

  const handleImport = useCallback(async (file: File) => {
    try {
      const imported = await importSave(file)
      setSave(imported)
      if (imported.currentDisciplineId) {
        setActiveDisciplineId(imported.currentDisciplineId)
        gameRef.current?.setArea('discipline', imported.currentDisciplineId)
      } else {
        setActiveDisciplineId(null)
        gameRef.current?.setArea('hub')
      }
      setToast('Save importado. A Cidadela reconheceu seu progresso.')
    } catch (error) {
      setToast(`Não foi possível importar: ${(error as Error).message}`)
    }
  }, [])

  const completedCount = useMemo(() => {
    if (!save || !activeDiscipline) return 0
    return activeDiscipline.levels.filter((level) =>
      isLevelCompleted(save, activeDiscipline.id, level.id),
    ).length
  }, [save, activeDiscipline])

  const settings = save?.settings
  const touchVisible = (settings?.forceTouchControls ?? false) || deviceHasTouch()
  const activeWing = wingForLevel(activeDiscipline, openLevel)

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-citadel-void">
      <GameCanvas
        ref={gameRef}
        disciplines={disciplines}
        callbacks={callbacks}
        forceTouch={settings?.forceTouchControls ?? false}
        reducedMotion={settings?.reducedMotion ?? false}
        onInputReady={setInput}
      />

      <HUD
        area={area}
        discipline={activeDiscipline}
        wing={activeWing}
        completed={completedCount}
        total={activeDiscipline?.levels.length ?? 0}
        loreCount={collected.size}
        onHub={enterHub}
        onLore={() => setShowLore(true)}
        onSettings={() => setShowSettings(true)}
      />

      {nearby && !overlayOpen && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full border border-citadel-amber/40 bg-[#0a1422]/90 px-4 py-2 text-center text-xs text-[#f6dfb0] shadow-[0_0_24px_rgba(242,193,78,0.18)] sm:bottom-16 sm:text-sm">
          <span className="font-mono text-citadel-amber">[E]</span>{' '}
          {nearby.kind === 'terminal' ? 'Acessar Terminal' : 'Atravessar Portal'}
          <span className="ml-2 hidden text-[#9db6c8] sm:inline">{nearby.label}</span>
        </div>
      )}

      <TouchControls
        input={input}
        visible={touchVisible && !overlayOpen}
        interactHighlight={!!nearby}
        onInteract={() => navigator.vibrate?.(12)}
      />

      {openLevel && activeDiscipline && (
        <TerminalModal
          discipline={activeDiscipline}
          level={openLevel}
          completed={save ? isLevelCompleted(save, activeDiscipline.id, openLevel.id) : false}
          onClose={() => setOpenLevelId(null)}
          onSolved={handleSolved}
        />
      )}

      {showLore && (
        <LoreJournal
          fragments={fragments}
          collected={collected}
          notes={save?.notes ?? {}}
          onNoteChange={(fragmentId, note) => {
            if (!save) return
            void mutateSave(save, (draft) => {
              draft.notes[fragmentId] = note
            }).then(setSave)
          }}
          onClose={() => setShowLore(false)}
        />
      )}

      {showSettings && save && (
        <SettingsPanel
          settings={save.settings}
          save={save}
          touchAvailable={deviceHasTouch()}
          onChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
          onExport={() => exportSave(save)}
          onImport={(file) => void handleImport(file)}
          onReset={() => {
            void resetSave().then((fresh) => {
              setSave(fresh)
              setActiveDisciplineId(null)
              gameRef.current?.setArea('hub')
              setToast('A Cidadela recomeçou do primeiro fio.')
            })
          }}
        />
      )}

      {toast && (
        <div className="citadel-enter pointer-events-none absolute right-3 top-20 z-50 max-w-[70vw] rounded-lg border border-citadel-mint/40 bg-[#081c22]/95 px-3 py-2 text-xs text-[#ccfff0] shadow-[0_0_28px_rgba(94,242,200,0.2)] sm:right-5 sm:top-24 sm:text-sm">
          ✦ {toast}
        </div>
      )}

      <div className="citadel-rotate-hint pointer-events-none fixed inset-0 z-50 hidden items-center justify-center bg-citadel-void p-8 text-center text-sm text-citadel-cyan">
        Gire o dispositivo para o modo paisagem para atravessar a Cidadela.
      </div>
    </main>
  )
}
