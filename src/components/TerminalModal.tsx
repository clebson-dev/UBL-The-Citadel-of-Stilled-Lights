import { useState } from 'react'
import Markdown from 'react-markdown'
import { ChallengeView } from './ChallengeView'
import { getWing } from '../services/contentService'
import type { Discipline, Level } from '../types/game'

type Tab = 'summary' | 'video' | 'challenge'

interface TerminalModalProps {
  discipline: Discipline
  level: Level
  completed: boolean
  onClose: () => void
  onSolved: (loreFragmentId?: string) => void
}

function toEmbedUrl(url: string | null): string | null {
  if (!url) return null
  const match = /(?:watch\?v=|youtu\.be\/)([\w-]+)/.exec(url)
  return match?.[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null
}

export function TerminalModal({
  discipline,
  level,
  completed,
  onClose,
  onSolved,
}: TerminalModalProps) {
  const [tab, setTab] = useState<Tab>('summary')
  const [solvedNow, setSolvedNow] = useState(false)
  const wing = getWing(discipline, level)
  const embedUrl = toEmbedUrl(level.youtubeUrl)
  const unlockedFragment = solvedNow ? level.loreFragment : undefined

  const handleSolved = () => {
    setSolvedNow(true)
    onSolved(level.loreFragment?.id)
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#02050b]/85 p-2 backdrop-blur-sm sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Terminal ${level.order}: ${level.title}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="citadel-glass citadel-enter flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl">
        <div className="flex items-start justify-between gap-3 border-b border-citadel-line/60 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-citadel-mint">
              {discipline.name} · {wing?.name ?? 'Ala'}
            </p>
            <h2 className="mt-1 truncate font-[Georgia,serif] text-lg text-[#eaf8ff] sm:text-2xl">
              {level.order.toString().padStart(2, '0')} — {level.title}
            </h2>
          </div>
          <button className="citadel-button shrink-0 px-2.5" onClick={onClose} aria-label="Fechar terminal">
            ✕
          </button>
        </div>

        <div className="flex shrink-0 gap-4 border-b border-citadel-line/60 px-4 sm:px-6">
          {(
            [
              ['summary', 'Resumo'],
              ['video', 'Assistir Aula'],
              ['challenge', 'Desafio'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`citadel-tab ${tab === value ? 'citadel-tab--active' : ''}`}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
          {completed || solvedNow ? (
            <span className="ml-auto self-center text-[10px] font-semibold uppercase tracking-widest text-citadel-mint">
              ✦ Religado
            </span>
          ) : null}
        </div>

        <div className="citadel-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {tab === 'summary' && (
            <article className="citadel-markdown text-sm text-[#c3d8e6] sm:text-[15px]">
              <Markdown>{level.summaryText}</Markdown>
            </article>
          )}

          {tab === 'video' && (
            <div className="citadel-enter">
              {embedUrl ? (
                <div className="aspect-video w-full overflow-hidden rounded-lg border border-citadel-line/70 bg-black">
                  <iframe
                    className="h-full w-full"
                    src={embedUrl}
                    title={`Vídeo da aula: ${level.title}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-citadel-line/80 bg-[#081321]/60 p-8 text-center">
                  <p className="font-[Georgia,serif] text-lg text-[#cbe4f1]">
                    Esta aula ainda não tem vídeo registrado.
                  </p>
                  <p className="mt-2 text-sm text-[#8fa9bb]">
                    O resumo acima e o desafio já estão disponíveis — a luz não depende de rede.
                  </p>
                  <button className="citadel-button mt-4" onClick={() => setTab('summary')}>
                    ↩ Voltar ao Resumo
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'challenge' && (
            <ChallengeView
              challenge={level.challenge}
              hint={level.hint}
              onSolved={handleSolved}
              onBackToSummary={() => setTab('summary')}
              onWatchVideo={() => setTab('video')}
            />
          )}

          {unlockedFragment && (
            <div className="citadel-enter mt-5 rounded-lg border border-citadel-amber/45 bg-citadel-amber/8 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-citadel-amber">
                Novo Fragmento de Log · {unlockedFragment.id}
              </p>
              <h3 className="mt-1 font-[Georgia,serif] text-lg text-[#ffe9bd]">
                {unlockedFragment.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#e8d5ad]">
                {unlockedFragment.content}
              </p>
              <p className="mt-2 text-[11px] text-citadel-amber/70">
                Registrado no Diário de Lore. Pressione L para reler.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
