import { useRef } from 'react'
import type { SaveData, Settings } from '../types/game'
import { isTauri } from '../services/saveService'

interface SettingsPanelProps {
  settings: Settings
  save: SaveData
  touchAvailable: boolean
  onChange: (patch: Partial<Settings>) => void
  onClose: () => void
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-citadel-line/60 bg-[#081321]/70 p-3">
      <span>
        <span className="block text-sm font-semibold text-[#d8ecf7]">{label}</span>
        <span className="mt-0.5 block text-xs text-[#819caf]">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-[#5ef2c8]"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  )
}

export function SettingsPanel({
  settings,
  save,
  touchAvailable,
  onChange,
  onClose,
  onExport,
  onImport,
  onReset,
}: SettingsPanelProps) {
  const fileInput = useRef<HTMLInputElement>(null)

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#02050b]/85 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Configurações"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="citadel-glass citadel-enter max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-xl p-4 citadel-scroll sm:p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-citadel-cyan/70">
              Sistema
            </p>
            <h2 className="mt-1 font-[Georgia,serif] text-xl text-[#eaf8ff] sm:text-2xl">
              Configurações
            </h2>
          </div>
          <button className="citadel-button shrink-0 px-2.5" onClick={onClose} aria-label="Fechar configurações">
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-2">
          <Toggle
            label="Controles touch no PC"
            description={
              touchAvailable
                ? 'Controles virtuais já aparecem automaticamente neste dispositivo.'
                : 'Exibe o D-Pad virtual para testar os controles mobile no computador.'
            }
            checked={settings.forceTouchControls}
            onChange={(value) => onChange({ forceTouchControls: value })}
          />
          <Toggle
            label="Reduzir movimento"
            description="Diminui partículas e brilhos — útil em dispositivos mais fracos."
            checked={settings.reducedMotion}
            onChange={(value) => onChange({ reducedMotion: value })}
          />
          <label className="block rounded-lg border border-citadel-line/60 bg-[#081321]/70 p-3">
            <span className="block text-sm font-semibold text-[#d8ecf7]">Volume geral</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.masterVolume}
              onChange={(event) => onChange({ masterVolume: Number(event.target.value) })}
              className="mt-3 w-full accent-[#57e0ff]"
            />
          </label>
        </div>

        <div className="mt-6 border-t border-citadel-line/60 pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-citadel-amber/80">
            Progresso offline
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#8fa9bb]">
            Save v{save.saveVersion} · atualizado em{' '}
            {new Date(save.updatedAt).toLocaleString('pt-BR')} ·{' '}
            {isTauri() ? 'arquivo nativo (Tauri)' : 'armazenamento local do navegador'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="citadel-button" onClick={onExport}>
              ⇩ Exportar Save (JSON)
            </button>
            <button className="citadel-button" onClick={() => fileInput.current?.click()}>
              ⇧ Importar Save (JSON)
            </button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) onImport(file)
                event.target.value = ''
              }}
            />
            <button className="citadel-button citadel-button--danger" onClick={onReset}>
              ↺ Recomeçar
            </button>
          </div>
        </div>

        <p className="mt-5 text-[11px] leading-relaxed text-[#69849a]">
          Desktop: A/D ou setas para mover · W/Espaço para pular · E para interagir · L para o
          Diário · Shift para Dash (após 100% de uma disciplina). Mobile: toque duplo em ↑ para
          Dash.
        </p>
      </div>
    </div>
  )
}
