import type { Discipline, GameArea, Wing } from '../types/game'

interface HUDProps {
  area: GameArea
  discipline: Discipline | undefined
  wing: Wing | undefined
  completed: number
  total: number
  loreCount: number
  onHub: () => void
  onLore: () => void
  onSettings: () => void
}

export function HUD({
  area,
  discipline,
  wing,
  completed,
  total,
  loreCount,
  onHub,
  onLore,
  onSettings,
}: HUDProps) {
  const title = area === 'hub' ? 'Pátio Central' : (discipline?.name ?? 'Setor desconhecido')
  const subtitle = area === 'hub' ? 'Cidadela do Conhecimento' : (wing?.name ?? '')

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-2 sm:p-4">
      <div className="citadel-glass pointer-events-auto max-w-[58vw] rounded-lg px-3 py-2 sm:px-4 sm:py-3">
        <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-citadel-cyan/80 sm:text-[10px]">
          {subtitle}
        </p>
        <h1 className="mt-0.5 truncate font-[Georgia,serif] text-sm text-[#e6f6ff] sm:text-lg">
          {title}
        </h1>
        {area === 'discipline' && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1 w-20 overflow-hidden rounded-full bg-citadel-line/70 sm:w-32">
              <div
                className="h-full rounded-full bg-citadel-mint shadow-[0_0_10px_#5ef2c8] transition-all duration-500"
                style={{ width: `${total === 0 ? 0 : (completed / total) * 100}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[10px] text-[#9ab7c9] sm:text-xs">
              {completed}/{total} Terminais Religados
            </span>
          </div>
        )}
      </div>

      <nav className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        <button className="citadel-button" onClick={onHub} disabled={area === 'hub'} title="Voltar ao Pátio">
          <span aria-hidden>⌂</span> <span className="hidden sm:inline">Hub</span>
        </button>
        <button className="citadel-button" onClick={onLore} title="Diário de Lore (L)">
          <span aria-hidden>✧</span> <span className="hidden sm:inline">Diário</span>
          {loreCount > 0 && (
            <span className="rounded-full bg-citadel-amber/20 px-1.5 text-[10px] text-citadel-amber">
              {loreCount}
            </span>
          )}
        </button>
        <button className="citadel-button" onClick={onSettings} title="Configurações">
          <span aria-hidden>⚙</span> <span className="hidden sm:inline">Ajustes</span>
        </button>
      </nav>
    </header>
  )
}
