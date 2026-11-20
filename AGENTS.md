# AGENTS.md — A Constituição da Cidadela

> _"Toda luz que se apaga deixa, atrás de si, a geometria do que ainda podia ser lido."_

Este documento governa IAs, agentes e contribuidores de **UBL The Citadel of Stilled Lights**. Se um texto solto contradizer esta constituição, esta constituição prevalece. Ao entrar no repositório, leia-a como quem atravessa um portão: em silêncio, com atenção.

---

## 1. Visão geral

Somos um **jogo educacional 2D atmosférico e data-driven** inspirado no imaginário da **Universidade Brasileira Livre (UBL)**. A Cidadela do Conhecimento apagou; o Ruído corrói os circuitos do saber; o Andarilho — um autômato de capa — religa terminais, uma pergunta de cada vez, até que o conhecimento volte a circular.

Cada disciplina é um mapa. Cada aula é um terminal. Cada erro é um fio que não esticou ainda, nunca uma falha do viajante. O conteúdo pedagógico **não vive no código**: vive em JSON validado, lido por um motor que o transforma em luz, partículas e silhueta.

Princípios que não negociamos:

- **Dados sobre código.** Novas aulas, disciplinas e fragmentos entram como dados, não como `if`.
- **Luz com significado.** Iluminação é progresso didático disfarçado de estética.
- **Sem punição.** A Cidadela nunca subtrai pontos, nunca fecha a tela, nunca ri do erro.
- **Cânone primeiro.** Narrativa é patrimônio; escrever sem consultar o lore é vandalismo de arquivo.

---

## 2. Árvore de pastas

```text
.
├── src/
│   ├── types/            # Definições TypeScript puras: Discipline, Wing, Level, Challenge, LoreFragment.
│   │                     # Aqui nasce a discriminated union de desafios (`type: 'quiz' | 'logic_toggle' | ...`).
│   ├── schemas/          # Espelhos Zod dos types. Fonte da validação em runtime e do `npm run validate`.
│   │                     # Toda variante nova de Challenge precisa de variante equivalente aqui.
│   ├── data/
│   │   └── disciplines/  # JSONs data-driven das disciplinas (ex.: circuitos-digitais.json).
│   │                     # Um arquivo por disciplina; sem lógica, sem imports, sem comentários.
│   ├── engine/           # Loop de jogo, Canvas 2D, câmera, partículas, luz volumétrica, colisão.
│   │                     # Não conhece regras de negócio pedagógicas — apenas desenha e move.
│   ├── services/         # Carregamento/validação de JSON, progresso, persistência, telemetria local.
│   │                     # Camada de acesso aos dados; a UI nunca lê `fetch` diretamente.
│   ├── components/       # React + Tailwind: HUD, modal de desafio, mapa, menus, barrel de partículas.
│   │                     # Componentes recebem dados tipados; não inventam texto narrativo.
│   └── game/             # Orquestração: instancia o engine, liga serviços aos componentes, estados da partida.
│                         # O "diretor" da cena — decide quando a luz acende.
├── src-tauri/            # Casca desktop Tauri v2: config, ícones, comandos nativos, janelas e permissões.
│                         # Nada de lore aqui; apenas o invólucro que sustenta o mundo.
├── docs/
│   ├── lore/             # Cânone: README.md, glossario.md, personagens.md, locais.md, misterios.md.
│   └── TEMPLATE_AULA.md  # Fábrica de aulas: prompt de transcrição → JSON + checklist pedagógico.
├── scripts/              # Validadores, geradores e checagens de integridade (inclui o `npm run validate`).
└── public/assets/        # Opcional. Fontes/texturas locais; todo asset é substituível por fallback procedural.
```

Regra de ouro da árvore: **se o arquivo descreve o que o jogo é, vai em `data/` ou `docs/`; se descreve como o jogo se move, vai em `engine/`; se descreve como o jogo se apresenta, vai em `components/`.**

---

## 3. Stack obrigatória

| Camada | Tecnologia | Por quê |
| --- | --- | --- |
| Desktop | **Tauri v2** | Casca leve, nativa, sem navegador pesado. |
| Build/UI | **Vite + React + TypeScript** | HMR rápido, tipagem estrita, componentes previsíveis. |
| Estilo | **Tailwind CSS** | Tokens de tema coerentes com as paletas do lore. |
| Mundo | **Canvas 2D puro** | Sem WebGL, sem engine proprietária: luz e partículas desenhadas à mão. |
| Dados | **Zod + JSON** | Contrato único entre autoria e runtime; validação antes de renderizar. |

Não introduza outra engine de renderização, outro gerenciador de estado global ou ORM sem discussão prévia em PR. O Canvas é desenhado por nós; a simplicidade é parte da atmosfera.

---

## 4. Padrão estético obrigatório

O jogo é **dark e atmosférico**. Paletas frias — azul-noite, verde-água, ciano — pontuadas por **neon ciano e âmbar** como sinais de terminal ativo e de memória restaurada.

Elementos obrigatórios de linguagem visual:

- **Silhuetas** em primeiro e segundo plano; o Andarilho é quase contorno, com a capa rasgada pelo vento.
- **Partículas** suspensas como poeira de luz; os circuitos voltam a respirar quando um terminal é religado.
- **Luz volumétrica** vazando de terminais e fendas, nunca uma mancha plana de cor.
- **Fallback procedural para tudo.** Nenhum sprite, fonte, áudio ou textura externa é obrigatório: se `public/assets/` estiver vazio, o jogo continua bonito e jogável. Gradientes, ruído e formas geométricas fazem o serviço.

Paletas canônicas por local vivem em `docs/lore/locais.md`. Ao criar um tema novo, registre-o no lore **antes** de usá-lo no JSON.

---

## 5. ⚠️ REGRA OBRIGATÓRIA — CÂNONE ANTES DE TEXTO

> **ANTES de escrever QUALQUER novo log, diálogo, fragmento ou texto narrativo — mesmo uma frase de dica, mesmo um nome de terminal — leia, nesta ordem:**
>
> 1. `docs/lore/README.md`
> 2. `docs/lore/glossario.md`
> 3. `docs/lore/personagens.md`
> 4. `docs/lore/locais.md`
> 5. `docs/lore/misterios.md`
>
> **DEPOIS de escrever, atualize esses mesmos arquivos.** Toda pista plantada entra em `misterios.md`. Todo termo novo entra no glossário. Toda entidade que fala entra em `personagens.md`. Todo lugar visitado entra em `locais.md`. Se a premissa mudou, `README.md` muda primeiro.

Descumprir esta regra não é "esquecer um docs": é criar um fragmento órfão, e o `npm run validate` vai encontrá-lo. A Cidadela não perdoa fio solto.

---

## 6. Como adicionar uma nova disciplina

1. **Crie o JSON** em `src/data/disciplines/<slug>.json` (slug em kebab-case, ex.: `sistemas-operacionais.json`). Use apenas campos do schema; `order` de `levels` começa em `1` e é **estritamente sequencial**, sem buracos.
2. **Registre no lore** (`docs/lore/`): descreva a ala/portal em `locais.md`, complete o glossário se a disciplina trouxer termos próprios, inclua entidades em `personagens.md` se alguém falar nela, e — obrigatório — adicione **todos** os `loreFragment.id` do JSON à tabela de `misterios.md`. Se a cronologia da premissa mudar, atualize `README.md`.
3. **Rode `npm run validate`.** O script checa schema Zod, sequência de `order`, temas, recompensas e a sincronização fragmento ↔ `misterios.md`. Corrija até passar limpo.
4. Abra `npm run dev` e atravesse o portal. Se a luz não acender, o problema está nos dados — não no motor.

---

## 7. Como adicionar um novo tipo de desafio

1. **Tipo:** em `src/types/game.ts`, acrescente a variante à `discriminated union` de `Challenge` com um campo `type` literal novo (ex.: `type: 'sequence_order'`), mantendo `quiz` e `logic_toggle` intactos.
2. **Schema:** em `src/schemas/discipline.schema.ts`, espelhe a variante dentro de `z.discriminatedUnion('type', [...])`. Campo com mesmo nome, mesmo literal, mesmos opcionais (`hint`, `loreFragment`).
3. **Discriminated union:** garanta que type e schema usam **exatamente o mesmo discriminador**. Um `type` divergente aqui quebra o parse em runtime e o autocompletar no JSX.
4. **Renderizador:** no modal de desafio (`src/components/`), adicione o `case` novo ao `switch` exaustivo. Nenhum `default` silencioso: se o tipo não é conhecido, o build deve reclamar.
5. **Validação e pedagogical check:** rode `npm run validate`, depois jogue o desafio. Uma resposta correta, dica construtiva no `hint`, erro sem punição. Se o novo tipo precisar de texto narrativo, volte à **Regra Obrigatória** da seção 5.

---

## 8. Convenções

### Código

- TypeScript em modo estrito; **sem `any`**. Prefira `unknown` + Zod.
- 2 espaços de indentação, aspas simples, ponto e vírgula, finais de linha LF.
- Nomes: `camelCase` para variáveis/funções, `PascalCase` para componentes e types, `kebab-case` para slugs e arquivos de dados.
- IDs de fragmento seguem `log-<slug>-<nivel>-<palavra>` — ex.: `log-cd-01-architects`. Nunca reutilize um ID, nunca renomeie um ID canônico.
- Componentes não escrevem texto de lore literal; recebem strings dos JSONs.
- `engine/` não importa `services/`; a direção de dependência é sempre `game → services → schemas/data`.

### Commits

Conventional Commits, sempre no imperativo:

- `feat:` nova disciplina, desafio ou sistema de luz.
- `data:` conteúdo novo em `src/data/disciplines/`.
- `lore:` alteração em `docs/lore/` (use `lore!:` para mudança de cânone).
- `fix:` correção de render, validação ou progresso.
- `docs:` template, READMEs e apoio.
- `refactor:` / `chore:` / `test:` conforme o caso.

Exemplo: `data: adiciona aula cd-1-3 e registra fragmento do Receptáculo`.

### Checklist de PR

- [ ] Li os cinco arquivos de `docs/lore/` antes de escrever qualquer texto novo.
- [ ] Atualizei o lore depois de escrever — incluindo `misterios.md` para **todo** `loreFragment.id`.
- [ ] `npm run validate` passa sem erros nem avisos de fragmento órfão.
- [ ] `order` dos níveis é sequencial e começa em `1`.
- [ ] `type` do desafio existe em `src/types/game.ts` **e** em `src/schemas/discipline.schema.ts`.
- [ ] Modal renderiza o desafio novo; dica é construtiva; erro não puniu ninguém.
- [ ] Paleta usada está documentada em `locais.md` (ou foi registrada neste PR).
- [ ] Sem asset externo obrigatório: o fallback procedural foi testado com `public/assets/` vazio.
- [ ] Diff revisado: nada fora de `src/`, `docs/` e `AGENTS.md` sem justificativa explícita.

---

A Cidadela não se acende de uma vez. Ela volta, fio por fio, pergunta por pergunta. Cuidado com o que você escreve — alguém vai ler isso no escuro.
