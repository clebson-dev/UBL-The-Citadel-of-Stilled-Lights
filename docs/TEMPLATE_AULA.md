# Fábrica de Aulas — Template

> Use este documento sempre que transformar uma aula em terminal da Cidadela. Ele é o molde: copie, preencha, valide. Não escreva texto narrativo novo sem antes passar pela regra de cânone do final.

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
2. `description` é um resumo didático de 2 a 4 frases: o que o aluno saberá ao final.
3. `wings[].levels[].order` começa em 1 e é estritamente sequencial, sem buracos.
4. Cada desafio usa "type": "quiz" ou "type": "logic_toggle" — nunca outro valor.
5. Cada desafio tem uma única resposta correta e um `hint` construtivo, que aponta
   o caminho sem dar a resposta. Nunca puna o erro; nunca mencione perda de pontos.
6. Use as paletas canônicas: #070d18/#57e0ff (Pátio),
   #070d18/#5ef2c8/#f2c14e (Circuitos Digitais), #0a1422/#6ee7d8 (Ala 1).
7. `loreFragment`: se quiser plantar uma pista, use SOMENTE um ID já registrado em
   docs/lore/misterios.md. Se não houver ID canônico adequado, use null e avise
   que é necessário registrar o fragmento no cânone antes de publicar.
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

  // Paletas canônicas do local (ver docs/lore/locais.md).
  "themeColors": {
    "background": "#070d18",
    "accent": "#5ef2c8",
    "warm": "#f2c14e"
  },

  // O que muda no hub quando a disciplina é concluída.
  "hubReward": "Acende o segundo anel de luz do Pátio Central",

  "wings": [
    {
      // Identificador da ala; "cd-1" corresponde à Ala 1.
      "id": "cd-1",
      "name": "Ala 1: Fundamentos da Lógica",

      "levels": [
        {
          // ORDEM ESTRITAMENTE SEQUENCIAL: 1, 2, 3... sem buracos e sem repetição.
          "order": 1,
          "id": "cd-1-1",
          "name": "O primeiro desenho",

          // Texto da aula resumido para o terminal.
          "description": "Toda decisão começa com uma distinção: ligado ou desligado, sim ou não.",

          // DISCRIMINATED UNION — o campo "type" escolhe o renderizador do modal.
          "challenge": {
            "type": "quiz", // ou "logic_toggle" — nunca outro valor
            "prompt": "Qual destas afirmações descreve um bit?",
            "options": [
              { "id": "a", "text": "Uma unidade que só pode ter dois estados" },
              { "id": "b", "text": "Um fio que sempre conduz luz" },
              { "id": "c", "text": "Um desenho feito pelos Arquitetos" }
            ],
            // Uma única resposta correta.
            "correctOptionId": "a"
          },

          // Dica construtiva: aponta o caminho, nunca entrega a resposta.
          "hint": "Pense no menor pedaço de informação que ainda permite distinguir duas situações.",

          // Fragmento canônico: o ID precisa existir em docs/lore/misterios.md.
          "loreFragment": {
            "id": "log-cd-01-architects",
            "title": "O primeiro desenho",
            "text": "[Texto do fragmento: escreva só depois de ler e atualizar os cinco documentos de docs/lore/.]"
          }
        },
        {
          "order": 2,
          "id": "cd-1-2",
          "name": "O tremor nos barramentos",
          "description": "Nem toda mudança de estado é uma decisão: às vezes é interferência.",
          "challenge": {
            "type": "logic_toggle",
            "prompt": "Toque a chave até que o circuito atinja o estado estável.",
            "initialState": false,
            "expectedState": true
          },
          "hint": "Observe o brilho do barramento antes de tocar outra vez.",
          "loreFragment": {
            "id": "log-cd-02-noise",
            "title": "Interferência",
            "text": "[Texto do fragmento: escreva só depois de ler e atualizar os cinco documentos de docs/lore/.]"
          }
        },
        {
          "order": 3,
          "id": "cd-1-3",
          "name": "Sob o Pátio",
          "description": "Guardar não é o mesmo que esconder: algo espera para voltar a circular.",
          "challenge": {
            "type": "quiz",
            "prompt": "O que o Receptáculo faz com a luz das disciplinas?",
            "options": [
              { "id": "a", "text": "Acumula e devolve quando todas estiverem ligadas" },
              { "id": "b", "text": "Apaga qualquer sinal que recebe" },
              { "id": "c", "text": "Desenha plantas para os Arquitetos" }
            ],
            "correctOptionId": "a"
          },
          "hint": "Pense no anel central do Pátio e no que ele ainda não consegue acender.",
          "loreFragment": {
            "id": "log-cd-03-receptacle",
            "title": "O adormecido",
            "text": "[Texto do fragmento: escreva só depois de ler e atualizar os cinco documentos de docs/lore/.]"
          }
        }
      ]
    }
  ]
}
```

Se outro tipo de desafio for necessário, ele precisa existir **primeiro** em `src/types/game.ts` e em `src/schemas/discipline.schema.ts`, e ganhar um `case` no modal — veja `AGENTS.md`, seção 7.

---

## (c) Checklist de qualidade pedagógica

- [ ] **Resumo didático.** `description` diz claramente o que o aluno saberá ao final, em 2 a 4 frases, sem depender da transcrição original.
- [ ] **Uma única resposta correta.** No `quiz`, exatamente uma opção satisfaz a pergunta; as distratores são plausíveis, mas inequívocas. No `logic_toggle`, há um único `expectedState` estável.
- [ ] **Dica construtiva.** `hint` reduz a dificuldade sem revelar a resposta; funciona como um fio que se tensiona, não como um gabarito.
- [ ] **Sem punição de erro.** Nenhum texto menciona perda de pontos, vidas, tempo ou reputação. Errar devolve ao jogador o mesmo terminal, com a dica acesa.
- [ ] **Progressão sequencial.** `order` começa em `1` e não pula nenhum número dentro da `wing`.
- [ ] **Idioma e tom.** Português brasileiro, didático e atmosférico; sem termos estrangeiros desnecessários.
- [ ] **Validação.** `npm run validate` passa limpo.

---

## (d) ⚠️ Aviso de sincronização de lore

Antes de escrever **qualquer** `description`, `prompt`, `hint`, título ou `text` de fragmento, leia nesta ordem:

1. `docs/lore/README.md`
2. `docs/lore/glossario.md`
3. `docs/lore/personagens.md`
4. `docs/lore/locais.md`
5. `docs/lore/misterios.md`

Depois de escrever, **atualize os mesmos arquivos**: nova pista entra em `misterios.md`, novo termo no glossário, nova voz em `personagens.md`, novo espaço em `locais.md`, mudança de premissa no README. Todo `loreFragment.id` do JSON precisa existir na tabela de mistérios — os IDs canônicos até aqui são `log-cd-01-architects`, `log-cd-02-noise` e `log-cd-03-receptacle`, e nenhum outro deve ser inventado sem registro prévio. O `npm run validate` verifica essa sincronização e reprova fragmentos órfãos.

Escrever sem o cânone é acender um terminal errado no escuro: a luz até vem, mas ilumina coisa que não existe.
