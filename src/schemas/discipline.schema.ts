import { z } from 'zod'

/** Helper: somente cores hexadecimais de 6 dígitos, como exigido no lore/locais.md. */
const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar no formato #RRGGBB')

/** Helper: aceita null ou uma URL pública do YouTube. */
const youtubeUrl = z
  .string()
  .refine(
    (value) =>
      /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(value),
    'URL deve apontar para um vídeo do YouTube',
  )
  .nullable()

export const themeColorsSchema = z.object({
  background: hexColor,
  light: hexColor,
  cableActive: hexColor,
  cableInactive: hexColor,
  accent: hexColor,
})

export const hubRewardSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  effect: z.string().min(1),
})

export const wingSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  name: z.string().min(1),
  description: z.string().min(1),
  themeColors: themeColorsSchema,
})

export const quizChallengeSchema = z.object({
  type: z.literal('quiz'),
  question: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().nonnegative(),
})

export const logicToggleChallengeSchema = z.object({
  type: z.literal('logic_toggle'),
  question: z.string().min(1),
  inputs: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        initialValue: z.union([z.literal(0), z.literal(1)]),
      }),
    )
    .min(1),
  allowedOperations: z
    .array(
      z.enum(['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR']),
    )
    .min(1),
  expectedOutput: z.union([z.literal(0), z.literal(1)]),
  explanation: z.string().min(1),
})

/** União discriminada espelhando `Challenge` em src/types/game.ts. */
export const challengeSchema = z.discriminatedUnion('type', [
  quizChallengeSchema,
  logicToggleChallengeSchema,
])

export const loreFragmentSchema = z.object({
  id: z.string().regex(/^log-[a-z0-9-]+$/, 'ID de log inválido'),
  title: z.string().min(1),
  content: z.string().min(1),
})

export const levelSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  wingId: z.string().min(1),
  title: z.string().min(1),
  summaryText: z.string().min(1),
  youtubeUrl,
  challenge: challengeSchema,
  hint: z.string().min(1),
  loreFragment: loreFragmentSchema.optional(),
})

export const disciplineSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido'),
  name: z.string().min(1),
  description: z.string().min(1),
  locked: z.boolean(),
  themeColors: themeColorsSchema,
  hubReward: hubRewardSchema,
  wings: z.array(wingSchema).min(1),
  levels: z.array(levelSchema).min(1),
})

export const disciplinesSchema = z.array(disciplineSchema)
