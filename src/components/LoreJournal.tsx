import { useState } from 'react'
import type { CataloguedFragment } from '../services/contentService'

interface LoreJournalProps {
  fragments: CataloguedFragment[]
  collected: Set<string>
  notes: Record<string, string>
  onNoteChange: (fragmentId: string, note: string) => void
  onClose: () => void
}

export function LoreJournal({
  fragments,
  collected,
  notes,
  onNoteChange,
  onClose,
}: LoreJournalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    fragments.find((fragment) => collected.has(fragment.id))?.id ?? fragments[0]?.id ?? null,
  )
  const selected = fragments.find((fragment) => fragment.id === selectedId) ?? null
  const isUnlocked = selected ? collected.has(selected.id) : false

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#02050b]/85 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Diário de Lore"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="citadel-glass citadel-enter flex h-[88dvh] max-h-[720px] w-full max-w-4xl overflow-hidden rounded-xl">
        <aside className="citadel-scroll w-40 shrink-0 overflow-y-auto border-r border-citadel-line/60 bg-[#060e1a]/70 p-2 sm:w-56 sm:p-3">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-citadel-cyan/70">
            Fragmentos · {collected.size}/{fragments.length}
          </p>
          {fragments.map((fragment) => {
            const unlocked = collected.has(fragment.id)
            return (
              <button
                key={fragment.id}
                type="button"
                onClick={() => setSelectedId(fragment.id)}
                className={`mb-1 w-full rounded-md border px-2 py-2 text-left text-xs transition ${
                  selectedId === fragment.id
                    ? 'border-citadel-cyan/60 bg-citadel-cyan/10 text-[#d9f7ff]'
                    : 'border-transparent text-[#8fa9bb] hover:bg-white/5'
                }`}
              >
                <span className="block truncate font-semibold">
                  {unlocked ? fragment.title : '??? · Registro selado'}
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-[#69849a]">
                  {fragment.disciplineName}
                </span>
              </button>
            )
          })}
          {fragments.length === 0 && (
            <p className="p-2 text-xs text-[#69849a]">Nenhum fragmento no conteúdo atual.</p>
          )}
        </aside>

        <section className="citadel-scroll min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-citadel-amber/80">
                Fragmento de Log · {selected?.id ?? '—'}
              </p>
              <h2 className="mt-1 font-[Georgia,serif] text-xl text-[#f0e0bd] sm:text-2xl">
                {isUnlocked ? (selected?.title ?? 'Nenhum registro') : 'Registro selado'}
              </h2>
            </div>
            <button className="citadel-button shrink-0 px-2.5" onClick={onClose} aria-label="Fechar diário">
              ✕
            </button>
          </div>

          {selected && isUnlocked ? (
            <>
              <p className="mt-4 border-l-2 border-citadel-amber/40 pl-4 text-sm leading-loose text-[#d7c9ab]">
                {selected.content}
              </p>
              <p className="mt-3 text-[11px] text-[#7f9bb1]">
                Origem: {selected.disciplineName} · {selected.levelTitle}
              </p>

              <div className="mt-6">
                <label
                  htmlFor="lore-note"
                  className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-citadel-cyan/70"
                >
                  Sua teoria (salva neste dispositivo)
                </label>
                <textarea
                  id="lore-note"
                  className="mt-2 h-28 w-full resize-none rounded-lg border border-citadel-line/70 bg-[#081321] p-3 text-sm text-[#d7e6f2] outline-none focus:border-citadel-cyan/70"
                  placeholder="O que você acha que o Ruído quer com o Receptáculo?"
                  value={notes[selected.id] ?? ''}
                  onChange={(event) => onNoteChange(selected.id, event.target.value)}
                />
              </div>
            </>
          ) : (
            <p className="mt-8 text-sm leading-relaxed text-[#7f9bb1]">
              Este log ainda não foi recuperado. Religue os terminais das disciplinas para que
              a memória da Cidadela volte a falar.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
