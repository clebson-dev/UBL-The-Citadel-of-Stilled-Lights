# Assets opcionais

Esta pasta começa vazia — e isso é intencional. O jogo é totalmente jogável com desenho procedural no Canvas.

Para substituir a arte genérica por sprites, adicione arquivos PNG com exatamente estes nomes:

| Arquivo | Uso |
| --- | --- |
| `player-idle.png` | Andarilho parado |
| `player-run.png` | Andarilho correndo |
| `player-jump.png` | Andarilho no ar |
| `terminal-off.png` | Terminal apagado/bloqueado |
| `terminal-on.png` | Terminal disponível ou religado |
| `platform.png` | Plataformas e chão |
| `background-hub.png` | Pátio Central |
| `background-<id-da-disciplina>.png` | Fundo de uma disciplina (ex.: `background-circuitos-digitais.png`) |

O `AssetManager` (`src/engine/assetManager.ts`) sonda esses caminhos na inicialização. Se um arquivo não existir ou falhar ao carregar, o renderizador aplica automaticamente o fallback procedural correspondente — nenhuma linha de física ou de lógica de jogo precisa mudar.

Dica: spritesheets ainda não são automaticamente fatiadas; use uma imagem por estado. O dimensionamento é feito pelo renderer.
