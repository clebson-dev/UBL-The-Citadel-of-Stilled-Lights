# AGENTS.md — Roteador da Cidadela

> _"Toda luz que se apaga deixa, atrás de si, a geometria do que ainda podia ser lido."_

Este arquivo é a **porta de entrada**. Ele não substitui os agentes: ele diz **qual deles seguir** para cada tipo de tarefa. Em caso de conflito entre um texto solto e este roteador, o roteador prevalece.

---

## 1. Roteamento rápido — qual agente seguir?

| Tarefa solicitada | Agente obrigatório | O que ele entrega |
| --- | --- | --- |
| Criar mistérios, logs, diálogos, história, nomes ou descrições narrativas | [Guardião da Lore](docs/agents/lorekeeper.md) | Texto canônico + `misterios.md` sincronizado |
| Adicionar aulas, alas ou disciplinas (conteúdo em JSON) | [Fábrica de Aulas](docs/agents/content-factory.md) | JSON válido com `order` sequencial e desafios variados |
| Projetar mapas, salas, layout, visual, paleta ou atmosfera | [Arquiteto de Mapas & Atmosfera](docs/agents/level-architect.md) | **Proposta em texto com ASCII + aprovação do usuário antes de qualquer código** |
| Mexer em física, Canvas, UI, controles touch, save ou Tauri | [Engenheiro de Motor & Multiplataforma](docs/agents/engine-dev.md) | Código com save versionado, fallback procedural e build verde |
| Verificar furos de roteiro, cronologia ou uso de termos | [Auditor de Cânone & Continuidade](docs/agents/canon-auditor.md) | Relatório **somente leitura** com arquivo, ID do log/nível e conflito → devolve ao `lorekeeper` |
| Testar se os mistérios geram boas teorias sem dar spoiler | [Simulador de Teorias & Mistério](docs/agents/theory-tester.md) | Teorias da comunidade + riscos SPOILER / BECO SEM SAÍDA / TOM → devolve ao `lorekeeper` |
| Revisar e fechar uma atualização | [Auditor de Qualidade & Continuidade](docs/agents/qa-auditor.md) | Parecer **APROVADO** / **REPROVADO** com agente responsável, **após** os dois pareceres acima |

**Tarefas que atravessam vários domínios:** siga a ordem da tabela. Exemplo — nova disciplina completa:

```
lorekeeper → content-factory → level-architect (proposta + aval) → engine-dev
   lore          JSON validado        mapa aprovado                  código
                                                                       ↓
   canon-auditor → theory-tester → qa-auditor
     cânone limpo   mistério testado   parecer final
```

> **Gate especial:** o `level-architect` nunca escreve código ou JSON de mapa sem uma proposta visual em texto e a aprovação explícita do usuário.

> **Gate de revisão narrativa:** toda Ala concluída **e toda atualização de lore** passam por `canon-auditor` e `theory-tester`, nessa ordem, antes do `qa-auditor`. Os dois emitem parecer **APROVADO** ou **REPROVADO**; reprovação devolve ao `lorekeeper` (ou ao `content-factory`, se o problema for texto didático colado ao fragmento). Ambos são **somente leitura**: apontam, nunca reescrevem. O `qa-auditor` **não fecha** sem os dois pareceres verdes.

---

## 2. Regra global inegociável

> **NENHUMA alteração está concluída sem `npm run validate`.**

Mesmo uma mudança que pareça puramente visual, de documentação ou de configuração termina com o validador. Ele checa schema Zod, sequência de `order`, IDs duplicados, desafios solucionáveis e sincronização fragmento ↔ `docs/lore/misterios.md`.

Comandos de fechamento:

```bash
npm run validate   # obrigatório para TODA alteração
npm run build      # obrigatório quando houver TypeScript/UI/motor
npm run tauri build   # quando houver mudança nativa (Rust/capabilities)
```

Regra complementar: **antes de escrever qualquer novo log, diálogo ou texto narrativo**, leia os cinco arquivos de `docs/lore/`; **depois**, atualize-os. O `lorekeeper` é o dono dessa regra.

Toda alteração de lore também está sujeita ao **gate de revisão narrativa** da seção 1 — o validador verde é condição necessária, mas não substitui os pareceres do `canon-auditor` e do `theory-tester`.

---

## 3. Estrutura real de pastas

```text
.
├── AGENTS.md                       # Roteador (este arquivo)
├── README.md                       # Visão geral, instalação e controles
├── package.json / package-lock.json
├── vite.config.ts / tsconfig.json / index.html
├── .gitattributes / .gitignore
│
├── docs/
│   ├── agents/                     # ⭐ Os 7 agentes especializados
│   │   ├── lorekeeper.md           # escreve o cânone
│   │   ├── content-factory.md
│   │   ├── level-architect.md
│   │   ├── engine-dev.md
│   │   ├── canon-auditor.md        # só leitura: contradições e termos
│   │   ├── theory-tester.md        # só leitura: teorias e spoilers
│   │   └── qa-auditor.md           # fecha depois dos dois pareceres
│   ├── lore/                       # Cânone obrigatório
│   │   ├── README.md               # Premissa, regras e cronologia
│   │   ├── glossario.md
│   │   ├── personagens.md
│   │   ├── locais.md               # Paletas e arquitetura canônica
│   │   └── misterios.md            # Tabela viva de pistas plantadas
│   └── TEMPLATE_AULA.md            # Fábrica de aulas: transcrição → JSON
│
├── src/
│   ├── types/game.ts               # Tipos canônicos do domínio
│   ├── schemas/discipline.schema.ts# Espelhos Zod (runtime + CLI)
│   ├── data/disciplines/           # Um JSON por disciplina (conteúdo puro)
│   ├── engine/                     # Loop 60 FPS, física, câmera, luz, partículas
│   │   ├── assetManager.ts         # PNGs opcionais + fallback procedural
│   │   ├── physics.ts              # Hitboxes/colisão (sem Canvas)
│   │   ├── input.ts                # Teclado + D-Pad virtual
│   │   ├── scene.ts                # Hub e mapa de terminais
│   │   ├── renderer.ts             # Desenho atmosférico
│   │   └── gameEngine.ts           # Orquestração do loop
│   ├── services/                   # Conteúdo, progresso, lógica e persistência
│   │   ├── contentService.ts
│   │   ├── logicService.ts
│   │   └── saveService.ts          # Save versionado + migrações
│   ├── game/progression.ts         # Regras de progressão (ponto único de verdade)
│   ├── components/                 # React + Tailwind (HUD, modais, touch)
│   ├── App.tsx                     # Diretor da cena
│   ├── main.tsx / index.css
│
├── scripts/validate-content.ts     # npm run validate
├── public/assets/                  # Sprites opcionais (substituem o fallback)
│
└── src-tauri/                      # Casca nativa Tauri v2
    ├── Cargo.toml / build.rs
    ├── capabilities/default.json   # Permissões (inclui escopo do save)
    ├── icons/                      # PNG/ICO/ICNS gerados
    ├── src/main.rs / lib.rs
    └── tauri.conf.json
```

**Regra de ouro da árvore:** se descreve *o que o jogo é* → `data/` ou `docs/`; se descreve *como ele se move* → `engine/`; se descreve *como ele se apresenta* → `components/`.

---

## 4. Princípios que não negociamos

- **Dados sobre código.** Aula nova entra como JSON, nunca como `if`.
- **Luz com significado.** Iluminação é progresso didático disfarçado de estética.
- **Sem punição.** Nenhum erro tira vida, ponto ou tela do jogador.
- **Cânone primeiro.** Narrativa é patrimônio; escrever sem consultar o lore é vandalismo de arquivo.
- **Aparência é opcional, atmosfera não.** Todo asset tem fallback procedural.
- **Save é contrato.** Mudou o formato? Incrementou `saveVersion` e escreveu a migração.
- **Validador é lei.** `npm run validate` fecha qualquer entrega.

---

## 5. Convenções rápidas

- TypeScript estrito, sem `any`; 2 espaços, aspas simples, ponto e vírgula, LF.
- `camelCase` para código, `PascalCase` para componentes/types, `kebab-case` para slugs.
- IDs de fragmento: `log-<slug>-<nivel>-<palavra>` (ex.: `log-cd-01-architects`).
- Commits: `feat:`, `data:`, `lore:` (`lore!:` para mudança de cânone), `fix:`, `docs:`, `refactor:`, `chore:`, `qa:`.
- Antes de abrir PR, `canon-auditor` e `theory-tester` aprovam a narrativa e só então o `qa-auditor` emite o parecer final.

> A Cidadela não se acende de uma vez. Ela volta, fio por fio, pergunta por pergunta — e todos os fios passam pelo validador.
