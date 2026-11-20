import type { GateOperation } from '../types/game'

/** Avaliador canônico das portas lógicas — usado no jogo e no validador de conteúdo. */
export function evaluateGate(operation: GateOperation, values: number[]): 0 | 1 {
  const a = values[0] ?? 0
  const b = values[1] ?? 0
  switch (operation) {
    case 'AND':
      return a && b ? 1 : 0
    case 'OR':
      return a || b ? 1 : 0
    case 'NOT':
      return a ? 0 : 1
    case 'XOR':
      return a === b ? 0 : 1
    case 'NAND':
      return a && b ? 0 : 1
    case 'NOR':
      return a || b ? 0 : 1
  }
}
