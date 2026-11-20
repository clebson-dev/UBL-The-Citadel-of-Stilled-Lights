/**
 * Tipos canônicos do domínio do jogo.
 *
 * Este arquivo é a fonte da verdade para o TypeScript. `src/schemas/discipline.schema.ts`
 * espelha estas estruturas com Zod para validação em runtime e para o `npm run validate`.
 * Nenhuma regra de negócio pedagógica vive aqui — apenas a forma dos dados.
 */

/** Paleta completa de um local ou disciplina (valores em `#RRGGBB`). */
export interface ThemeColors {
  background: string
  light: string
  cableActive: string
  cableInactive: string
  accent: string
}

/** Recompensa permanente concedida ao Hub ao concluir 100% da disciplina. */
export interface HubReward {
  title: string
  description: string
  /** Efeito visual/habilidade desbloqueado no Pátio Central. */
  effect: string
}

/** Ala/módulo: agrupa de 8 a 12 aulas (o conteúdo inicial é uma amostra de 3). */
export interface Wing {
  id: string
  /** Sequencial a partir de 1, sem buracos. */
  order: number
  name: string
  description: string
  /** Variação sutil da paleta da disciplina para evitar fadiga visual. */
  themeColors: ThemeColors
}

/** Operações binárias suportadas pelo desafio de alavancas. */
export type GateOperation = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR'

export interface LogicInput {
  id: string
  label: string
  initialValue: 0 | 1
}

/** Desafio de múltipla escolha. */
export interface QuizChallenge {
  type: 'quiz'
  question: string
  options: string[]
  /** Índice (base 0) da opção correta em `options`. */
  correctIndex: number
}

/** Mini-puzzle: alternar entradas e escolher a porta para atingir a saída esperada. */
export interface LogicToggleChallenge {
  type: 'logic_toggle'
  question: string
  inputs: LogicInput[]
  allowedOperations: GateOperation[]
  expectedOutput: 0 | 1
  explanation: string
}

/** União discriminada — adicionar um novo tipo aqui exige nova variante no schema e no modal. */
export type Challenge = QuizChallenge | LogicToggleChallenge

/** Log corrompido desbloqueado ao concluir um nível. ID deve estar em docs/lore/misterios.md. */
export interface LoreFragment {
  id: string
  title: string
  content: string
}

/** Um terminal/totem na Ala. `order` é estritamente sequencial por disciplina. */
export interface Level {
  id: string
  order: number
  /** ID da Ala à qual este terminal pertence. */
  wingId: string
  title: string
  /** Markdown didático. */
  summaryText: string
  /** URL do YouTube; null quando a aula não tem vídeo. */
  youtubeUrl: string | null
  challenge: Challenge
  /** Dica construtiva exibida após um erro. Nunca punitiva. */
  hint: string
  loreFragment?: LoreFragment
}

/** Disciplina completa — um JSON por arquivo em src/data/disciplines/. */
export interface Discipline {
  id: string
  name: string
  description: string
  locked: boolean
  themeColors: ThemeColors
  hubReward: HubReward
  wings: Wing[]
  levels: Level[]
}

/** Área atual do mundo. */
export type GameArea = 'hub' | 'discipline'

/** Estado persistido de um terminal. */
export interface LevelProgress {
  completed: boolean
  completedAt: string
}

/** Progresso persistido de uma disciplina. */
export interface DisciplineProgress {
  levels: Record<string, LevelProgress>
  /** Fragmentos de log coletados (IDs canônicos). */
  loreFragments: string[]
}

/** Configurações do jogador, também persistidas. */
export interface Settings {
  /** Força o D-Pad virtual em desktop (para testes). */
  forceTouchControls: boolean
  /** Reduz partículas e luz volumétrica em dispositivos fracos. */
  reducedMotion: boolean
  masterVolume: number
}

/** Formato versionado salvo no localStorage / filesystem do Tauri. */
export interface SaveData {
  saveVersion: 1
  createdAt: string
  updatedAt: string
  currentDisciplineId: string | null
  disciplines: Record<string, DisciplineProgress>
  /** Teorias pessoais do jogador, indexadas por ID de fragmento. */
  notes: Record<string, string>
  settings: Settings
}

/** Eventos enviados do Canvas para o React (desacoplamento total). */
export type GameEvent =
  | { type: 'level-unlocked'; levelId: string }
  | { type: 'terminal-nearby'; levelId: string | null }
  | { type: 'area-changed'; area: GameArea }
  | { type: 'hub-reward-granted'; disciplineId: string }

/** Entrada de controle compartilhada entre teclado, toque e motores de teste. */
export interface InputState {
  left: boolean
  right: boolean
  jump: boolean
  interact: boolean
}
