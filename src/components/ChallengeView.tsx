import { useState } from 'react'
import { evaluateGate } from '../services/logicService'
import type { Challenge, GateOperation } from '../types/game'

interface ChallengeViewProps {
  challenge: Challenge
  hint: string
  onSolved: () => void
  onBackToSummary: () => void
  onWatchVideo: () => void
}

type Feedback = 'idle' | 'wrong' | 'correct'

export function ChallengeView({
  challenge,
  hint,
  onSolved,
  onBackToSummary,
  onWatchVideo,
}: ChallengeViewProps) {
  if (challenge.type === 'quiz') {
    return (
      <QuizView
        challenge={challenge}
        hint={hint}
        onSolved={onSolved}
        onBackToSummary={onBackToSummary}
        onWatchVideo={onWatchVideo}
      />
    )
  }
  return (
    <LogicView
      challenge={challenge}
      hint={hint}
      onSolved={onSolved}
      onBackToSummary={onBackToSummary}
      onWatchVideo={onWatchVideo}
    />
  )
}

function FeedbackPanel({
  feedback,
  hint,
  onBackToSummary,
  onWatchVideo,
}: {
  feedback: Feedback
  hint: string
  onBackToSummary: () => void
  onWatchVideo: () => void
}) {
  if (feedback === 'idle') return null
  return (
    <div
      className={`citadel-enter mt-4 rounded-lg border p-3 text-sm ${
        feedback === 'correct'
          ? 'border-citadel-mint/50 bg-citadel-mint/10 text-[#c7ffee]'
          : 'border-citadel-amber/40 bg-citadel-amber/8 text-[#f7dfae]'
      }`}
      role="status"
    >
      <p className="font-semibold">
        {feedback === 'correct' ? '✦ Circuito religado!' : 'O fio ainda não esticou — tudo bem.'}
      </p>
      <p className="mt-1 leading-relaxed">
        {feedback === 'correct'
          ? 'A luz voltou a circular por este terminal.'
          : hint}
      </p>
      {feedback === 'wrong' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="citadel-button" onClick={onBackToSummary}>
            ↩ Voltar ao Resumo
          </button>
          <button className="citadel-button" onClick={onWatchVideo}>
            ▷ Ver a Aula
          </button>
        </div>
      )}
    </div>
  )
}

function QuizView({
  challenge,
  hint,
  onSolved,
  onBackToSummary,
  onWatchVideo,
}: {
  challenge: Extract<Challenge, { type: 'quiz' }>
  hint: string
  onSolved: () => void
  onBackToSummary: () => void
  onWatchVideo: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback>('idle')

  const answer = () => {
    if (selected === null || feedback === 'correct') return
    if (selected === challenge.correctIndex) {
      setFeedback('correct')
      onSolved()
    } else {
      setFeedback('wrong')
    }
  }

  return (
    <div>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-citadel-cyan/70">
        Desafio · Múltipla escolha
      </p>
      <p className="mb-4 font-[Georgia,serif] text-base leading-relaxed text-[#e4f4ff] sm:text-lg">
        {challenge.question}
      </p>
      <div className="space-y-2">
        {challenge.options.map((option, index) => {
          const isSelected = selected === index
          const isCorrect = feedback === 'correct' && isSelected
          return (
            <button
              key={`${index}-${option}`}
              type="button"
              onClick={() => {
                if (feedback !== 'correct') {
                  setSelected(index)
                  setFeedback('idle')
                }
              }}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                isCorrect
                  ? 'border-citadel-mint bg-citadel-mint/15 text-[#d6fff2]'
                  : isSelected
                    ? 'border-citadel-cyan bg-citadel-cyan/10 text-white'
                    : 'border-citadel-line/70 bg-[#0a1626]/70 text-[#bdd3e2] hover:border-citadel-cyan/50'
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  isSelected ? 'border-citadel-cyan text-citadel-cyan' : 'border-citadel-line'
                }`}
              >
                {String.fromCharCode(65 + index)}
              </span>
              {option}
            </button>
          )
        })}
      </div>
      <div className="mt-4 flex justify-end">
        <button
          className="citadel-button citadel-button--primary"
          onClick={answer}
          disabled={selected === null || feedback === 'correct'}
        >
          Confirmar resposta →
        </button>
      </div>
      <FeedbackPanel
        feedback={feedback}
        hint={hint}
        onBackToSummary={onBackToSummary}
        onWatchVideo={onWatchVideo}
      />
    </div>
  )
}

function LogicView({
  challenge,
  hint,
  onSolved,
  onBackToSummary,
  onWatchVideo,
}: {
  challenge: Extract<Challenge, { type: 'logic_toggle' }>
  hint: string
  onSolved: () => void
  onBackToSummary: () => void
  onWatchVideo: () => void
}) {
  const [values, setValues] = useState<number[]>(() =>
    challenge.inputs.map((input) => input.initialValue),
  )
  const [operation, setOperation] = useState<GateOperation>(
    challenge.allowedOperations[0] ?? 'AND',
  )
  const [feedback, setFeedback] = useState<Feedback>('idle')
  const output = evaluateGate(operation, values)

  const check = () => {
    if (feedback === 'correct') return
    if (output === challenge.expectedOutput) {
      setFeedback('correct')
      onSolved()
    } else {
      setFeedback('wrong')
    }
  }

  return (
    <div>
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-citadel-cyan/70">
        Desafio · Bancada lógica
      </p>
      <p className="mb-4 font-[Georgia,serif] text-base leading-relaxed text-[#e4f4ff] sm:text-lg">
        {challenge.question}
      </p>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div className="space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-[#7f9bb1]">Entradas</p>
          {challenge.inputs.map((input, index) => (
            <button
              key={input.id}
              type="button"
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                values[index] === 1
                  ? 'border-citadel-amber/70 bg-citadel-amber/10 text-[#ffe4a8]'
                  : 'border-citadel-line bg-[#091525] text-[#9db6c8]'
              }`}
              onClick={() => {
                if (feedback === 'correct') return
                setValues((current) =>
                  current.map((value, i) => (i === index ? (value === 1 ? 0 : 1) : value)),
                )
                setFeedback('idle')
              }}
            >
              <span>{input.label}</span>
              <span className="font-mono text-lg font-bold">{values[index]}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5 sm:flex-col">
          {challenge.allowedOperations.map((gate) => (
            <button
              key={gate}
              type="button"
              className={`rounded-md border px-2.5 py-1.5 font-mono text-xs ${
                operation === gate
                  ? 'border-citadel-cyan bg-citadel-cyan/15 text-[#bff6ff]'
                  : 'border-citadel-line bg-[#091525] text-[#8fa9bb]'
              }`}
              onClick={() => {
                if (feedback === 'correct') return
                setOperation(gate)
                setFeedback('idle')
              }}
            >
              {gate}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-citadel-line/70 bg-[#081321] p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#7f9bb1]">Saída atual</p>
          <p
            className={`my-1 font-mono text-4xl font-bold ${
              output === challenge.expectedOutput
                ? 'text-citadel-mint drop-shadow-[0_0_14px_#5ef2c8]'
                : 'text-[#6b8498]'
            }`}
          >
            {output}
          </p>
          <p className="text-xs text-[#9db6c8]">esperado: {challenge.expectedOutput}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <button
          className="citadel-button"
          onClick={() => {
            setValues(challenge.inputs.map((input) => input.initialValue))
            setOperation(challenge.allowedOperations[0] ?? 'AND')
            setFeedback('idle')
          }}
        >
          ↺ Reiniciar bancada
        </button>
        <button className="citadel-button citadel-button--primary" onClick={check} disabled={feedback === 'correct'}>
          Testar circuito →
        </button>
      </div>

      <FeedbackPanel
        feedback={feedback}
        hint={hint}
        onBackToSummary={onBackToSummary}
        onWatchVideo={onWatchVideo}
      />
      {feedback === 'correct' && (
        <p className="mt-3 rounded-lg border border-citadel-line/60 bg-[#081321] p-3 text-xs leading-relaxed text-[#b6d2e2]">
          {challenge.explanation}
        </p>
      )}
    </div>
  )
}
