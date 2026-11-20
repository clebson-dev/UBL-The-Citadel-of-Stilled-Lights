# UBL — The Citadel of Stilled Lights

> _"Toda luz que se apaga deixa, atrás de si, a geometria do que ainda podia ser lido."_

Jogo educacional 2D atmosférico e **data-driven** inspirado no imaginário da Universidade Brasileira Livre (UBL). A Cidadela do Conhecimento apagou; o Ruído corrói os circuitos do saber; o Andarilho — um autômato de capa — religa terminais, uma aula por vez, até que a luz volte a circular.

O projeto roda em **Windows, Linux, Android e iOS** através do Tauri v2, com um motor Canvas 2D escrito em TypeScript puro e todo o conteúdo pedagógico em JSON validado por Zod. Erro nunca é punição: o jogador recebe uma dica e tenta de novo.

---

## Começo rápido

```bash
npm install
npm run dev          # http://localhost:1420
npm run validate     # validaschemas, ordens e sincronização com o lore
npm run build        # typecheck + build de produção
npm run tauri dev    # requer Rust/toolchain Tauri instalada
```

Requisitos para o frontend: **Node 20+**. Para builds nativos: **Rust 1.77+** e as dependências de sistema do [Tauri v2](https://v2.tauri.app/start/prerequisites/). O repositório já contém `src-tauri/` configurado, ícones e permissões de filesystem para o save.

---

## Controles

| Ação | Desktop | Mobile |
| --- | --- | --- |
| Mover | `A`/`D` ou `←`/`→` | D-Pad inferior esquerdo |
| Pular | `W`, `Espaço` ou `↑` | Botão `↑` |
| Interagir | `E` | Botão `E` (destaque quando há terminal/portal por perto) |
| Diário de Lore | `L` | Botão `Diário` no HUD |
| Dash\* | `Shift` | Toque duplo em `↑` |

\* O Dash é a recompensa permanente por concluir 100% de uma disciplina.

---

## Arquitetura

```text
src/
├── types/game.ts                 # Tipos canônicos do domínio
├── schemas/discipline.schema.ts  # Espelhos Zod (runtime + CLI)
├── data/disciplines/             # Um JSON por disciplina (conteúdo puro)
├── engine/                       # Loop 60 FPS, física, câmera, luz, partículas
│   ├── assetManager.ts           # PNGs opcionais com fallback procedural
│   ├── physics.ts                # Hitboxes e colisão (sem Canvas)
│   ├── input.ts                  # Teclado + D-Pad virtual
│   ├── scene.ts                  # Hub e mapa de terminais
│   ├── renderer.ts               # Desenho atmosférico
│   └── gameEngine.ts             # Orquestração do loop
├── services/                     # Conteúdo, progresso, lógica e persistência
├── game/progression.ts           # Regras de progressão (ponto único de verdade)
├── components/                   # React + Tailwind (HUD, modais, touch)
└── App.tsx                       # Diretor da cena
docs/lore/                        # Cânone narrativo (leia antes de escrever logs)
docs/TEMPLATE_AULA.md             # Fábrica de aulas
scripts/validate-content.ts       # npm run validate
src-tauri/                        # Casca nativa Tauri v2
public/assets/                    # Sprites opcionais (substituem o fallback)
```

**Regra de ouro:** se descreve *o que o jogo é*, vai em `data/` ou `docs/`; se descreve *como ele se move*, vai em `engine/`; se descreve *como ele se apresenta*, vai em `components/`.

---

## Adicionando conteúdo

1. Leia `AGENTS.md` e os cinco arquivos de `docs/lore/` — obrigatório antes de qualquer texto narrativo.
2. Crie `src/data/disciplines/<slug>.json` seguindo `docs/TEMPLATE_AULA.md`. `order` dos níveis começa em `1` e é estritamente sequencial.
3. Registre novos termos, locais, personagens e **todo** `loreFragment.id` em `docs/lore/`.
4. Rode `npm run validate`. O script checa Zod, sequência, IDs duplicados, desafios solucionáveis e sincronização fragmento ↔ `misterios.md`.
5. Novos JSONs são descobertos automaticamente pelo `import.meta.glob` — nenhum import manual.

Tipos de desafio disponíveis: `quiz` e `logic_toggle`. Para criar outro, siga a receita em `AGENTS.md` (tipo + schema + renderizador exaustivo).

---

## Assets desacoplados

A física nunca depende de imagem. O `AssetManager` procura os arquivos abaixo em `public/assets/`; se não existirem, o `Renderer` desenha silhuetas, capas, terminais e luzes proceduralmente. Para trocar a arte, basta adicionar os PNGs:

```
player-idle.png          player-run.png          player-jump.png
terminal-off.png         terminal-on.png         platform.png
background-hub.png       background-<id-da-disciplina>.png
```

---

## Save offline-first

- `localStorage` no browser; arquivo no `AppData` quando rodando sob Tauri (com fallback).
- Formato versionado (`saveVersion: 1`) com pipeline de migração preparado.
- Exportar/Importar JSON em **Configurações** permite transferir progresso entre PC e celular.
- Diário de Lore guarda também as teorias escritas pelo jogador.

---

## Documentação

- [AGENTS.md](AGENTS.md) — governança e regras para IAs/contribuidores
- [docs/lore/README.md](docs/lore/README.md) — premissa, regras e cronologia
- [docs/lore/glossario.md](docs/lore/glossario.md) — termos canônicos
- [docs/lore/personagens.md](docs/lore/personagens.md) — entidades e autores dos logs
- [docs/lore/locais.md](docs/lore/locais.md) — paletas e arquitetura
- [docs/lore/misterios.md](docs/lore/misterios.md) — pistas plantadas
- [docs/TEMPLATE_AULA.md](docs/TEMPLATE_AULA.md) — fábrica de aulas

A Cidadela não se acende de uma vez. Ela volta, fio por fio, pergunta por pergunta.
