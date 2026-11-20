# Fábrica de Aulas — Template

> Use este documento sempre que transformar uma aula em terminal da Cidadela. Ele é o molde: copie, preencha, valide. Não escreva texto narrativo novo sem antes passar pela regra de cânone do final.
>
> **Fonte da verdade:** `src/schemas/discipline.schema.ts`. Se este arquivo e o schema divergirem, o schema vence — corrija este template.

---

## (a) Prompt reutilizável — transcrição do YouTube → JSON

Copie o bloco abaixo, substitua os colchetes pelo título e pela transcrição e envie ao modelo. O resultado deve ser **apenas** o JSON, sem comentários nesta etapa de geração.

```text
Você é o autor de aulas da Cidadela do Conhecimento. Recebo o título e a transcrição
de uma aula do YouTube e devo devolver UM objeto JSON válido, seguindo estritamente
o contrato de src/schemas/discipline.schema.ts e o formato de docs/TEMPLATE_AULA.md.

TÍTULO: [cole aqui o título do vídeo]
TRANSCRIÇÃO: [cole aqui a transcrição]

Regras inegociáveis:
1. Escreva em português brasileiro, com tom didático e atmosférico, sem jargão vazio.
2. summaryText é um resumo didático em Markdown, de 2 a 4 parágrafos, com **negritos**
   nos conceitos-chave; explica o "por quê", não só o "o quê".
3. wings[].order vai de 1 a N. levels[].order é GLOBAL e vai de 1 até o total de
   níveis da disciplina — nunca reinicia dentro de cada ala.
4. Cada desafio usa "type": "quiz" (com "options" como array de strings e
   "correctIndex") ou "type": "logic_toggle" (com inputs, allowedOperations e
   expectedOutput) — nunca outro valor.
5. Cada desafio tem uma única resposta correta e um "hint" construtivo, que aponta
   o caminho sem dar a resposta. Nunca puna o erro; nunca mencione perda de pontos.
6. Use as paletas canônicas registradas em docs/lore/locais.md, inclusive as das
   nove Alas de Circuitos Digitais.
7. loreFragment: use SOMENTE um ID já registrado em docs/lore/misterios.md. Se não
   houver ID canônico adequado, OMITA o campo inteiro (ele é opcional — "null" é
   rejeitado pelo schema) e avise que é preciso registrar a pista no cânone antes
   de publicar. O campo de texto chama-se "content".
8. Não invente IDs de fragmento, nomes de personagens, locais ou disciplinas.
9. Devolva apenas o JSON final, sem texto ao redor, sem Markdown, sem comentários.
```

Depois de gerado: rode `npm run validate`. Se falhar, corrija o dado — nunca enfraquecer o schema.

---

## (b) Estrutura JSON comentada (jsonc)

Abaixo, o contrato completo. Comentários `//` existem apenas para ensinar; o JSON real em `src/data/disciplines/` **não os contém**.

```jsonc
{
  // Slug da disciplina em kebab-case; também é a chave usada no lore.
  "id": "circuitos-digitais",

  // Nome exibido no portal do Pátio Central.
  "name": "Circuitos Digitais",

  // Resumo didático: 2 a 4 frases sobre o que o aluno aprenderá.
  "description": "Do interruptor à memória: como um sinal binário vira decisão. Aprenda a reconhecer estados e a seguir trilhas lógicas sem medo de errar.",

  // Portal bloqueado? No início, apenas a primeira disciplina nasce desbloqueada.
  "locked": false,

  // Paleta canônica do local (ver docs/lore/locais.md).
  "themeColors": {
    "background": "#070d18",
    "light": "#57e0ff",
    "cableActive": "#5ef2c8",
    "cableInactive": "#1b3446",
    "accent": "#f2c14e"
  },

  // O que muda no hub quando a disciplina é concluída — objeto com três campos.
  "hubReward": {
    "title": "A Tocha dos Circuitos",
    "description": "As luminárias do Pátio se acendem em cascata.",
    "effect": "Restaura a iluminação do Setor e desbloqueia o Dash do Andarilho."
  },

  "wings": [
    {
      "id": "cd-wing-1",
      "order": 1,
      "name": "Ala 1: O Alfabeto dos Sinais",
      "description": "Números, códigos e as primeiras decisões elementares.",
      "themeColors": {
        "background": "#0a1422",
        "light": "#6ee7d8",
        "cableActive": "#5ef2c8",
        "cableInactive": "#1b3446",
        "accent": "#57e0ff"
      }
    }
  ],

  "levels": [
    {
      // ORDEM GLOBAL: 1, 2, 3... sem buracos nem repetição em toda a disciplina.
      "order": 1,
      "id": "cd-1-1",
      "wingId": "cd-wing-1",
      "title": "Sistemas Numéricos e Binário",

      // Texto da aula resumido para o terminal, em Markdown.
      "summaryText": "Computadores funcionam com **sinais elétricos** de dois estados. Por isso usamos a **base 2**: cada posição vale uma potência de 2.\n\nEm `1011₂` temos `8 + 0 + 2 + 1 = 11₁₀`.",

      // URL real da aula da playlist; null quando não houver vídeo associado.
      "youtubeUrl": "https://www.youtube.com/watch?v=1lsU6RoU9Ko",

      // DISCRIMINATED UNION — o campo "type" escolhe o renderizador do modal.
      "challenge": {
        "type": "quiz", // ou "logic_toggle" — nunca outro valor
        "question": "Qual é o valor decimal do número binário 1011₂?",
        "options": ["9", "10", "11", "13"],
        "correctIndex": 2
      },

      // Dica construtiva: aponta o caminho, nunca entrega a resposta.
      "hint": "Leia as casas da direita para a esquerda: 1, 2, 4 e 8. Some só as que estão em 1.",

      // Fragmento canônico: o ID precisa existir em docs/lore/misterios.md.
      "loreFragment": {
        "id": "log-cd-01-architects",
        "title": "O Primeiro Desenho",
        "content": "[Texto do fragmento: escreva só depois de ler e atualizar os cinco documentos de docs/lore/.]"
      }
    },
    {
      "order": 2,
      "id": "cd-1-2",
      "wingId": "cd-wing-1",
      "title": "Portas Lógicas",
      "summaryText": "Uma **porta lógica** é uma decisão mínima feita com elétrons.\n\nA **OR** devolve 1 se pelo menos uma entrada estiver em 1; a **AND** exige as duas.",
      "youtubeUrl": null,
      "challenge": {
        "type": "logic_toggle",
        "question": "Ajuste A e B e escolha a porta que faz a saída ser 1.",
        "inputs": [
          { "id": "A", "label": "Chave A", "initialValue": 0 },
          { "id": "B", "label": "Chave B", "initialValue": 0 }
        ],
        "allowedOperations": ["AND", "OR", "NOT"],
        "expectedOutput": 1,
        "explanation": "Com OR, basta uma entrada em 1: A = 1 e B = 0 já resolve."
      },
      "hint": "Comece observando a OR: ela só precisa de uma chave ligada."
    }
  ]
}
```

O campo `loreFragment` foi **omitido** no segundo nível — nunca escreva `"loreFragment": null`.

Se outro tipo de desafio for necessário, ele precisa existir **primeiro** em `src/types/game.ts` e em `src/schemas/discipline.schema.ts`, e ganhar um `case` no modal — veja `AGENTS.md`.

---

## (c) Checklist de qualidade pedagógica

- [ ] **Resumo que ensina.** `summaryText` é Markdown, tem 2 a 4 parágrafos e **negritos** nos conceitos-chave; explica o "por quê".
- [ ] **Fidelidade à transcrição.** O resumo reflete o que a aula realmente ensina — leu os `.txt` de `docs/transcripts/` antes de escrever.
- [ ] **Uma única resposta correta.** No `quiz`, `correctIndex` aponta uma só opção; as distratores são plausíveis, mas inequívocas. No `logic_toggle`, existe combinação que atinge `expectedOutput`.
- [ ] **Dica construtiva.** `hint` reduz a dificuldade sem revelar a resposta; funciona como um fio que se tensiona, não como um gabarito.
- [ ] **Ritmo alternado.** Dentro da Ala, `quiz` e `logic_toggle` se alternam — nunca três quizzes seguidos sem mudança de ritmo.
- [ ] **Sem punição de erro.** Nenhum texto menciona perda de pontos, vidas, tempo ou reputação. Errar devolve ao jogador o mesmo terminal, com a dica acesa.
- [ ] **Progressão sequencial.** `wings[].order` e `levels[].order` são estritamente sequenciais (o de níveis é global); IDs únicos; `wingId` existe.
- [ ] **Idioma e tom.** Português brasileiro, didático e atmosférico; sem termos estrangeiros desnecessários.
- [ ] **Validação.** `npm run validate` passa limpo.

---

## (d) ⚠️ Aviso de sincronização de lore

Antes de escrever **qualquer** `summaryText`, `question`, `hint`, título ou `content` de fragmento, leia nesta ordem:

1. `docs/lore/README.md`
2. `docs/lore/glossario.md`
3. `docs/lore/personagens.md`
4. `docs/lore/locais.md`
5. `docs/lore/misterios.md`

Depois de escrever, **atualize os mesmos arquivos**: nova pista entra em `misterios.md`, novo termo no glossário, nova voz em `personagens.md`, novo espaço em `locais.md`, mudança de premissa no README. Todo `loreFragment.id` do JSON precisa existir na tabela de mistérios e a associação `disciplina / id do nível` precisa bater exatamente. Os IDs canônicos originais são `log-cd-01-architects`, `log-cd-02-noise` e `log-cd-03-receptacle`; nenhum outro deve ser inventado sem registro prévio. O `npm run validate` verifica essa sincronização e reprova fragmentos órfãos.

Escrever sem o cânone é acender um terminal errado no escuro: a luz até vem, mas ilumina coisa que não existe.
