/**
 * AssetManager — troca de arte sem tocar na física.
 *
 * O renderizador pergunta por uma chave (`player-idle`, `terminal-on`, ...).
 * Se o PNG correspondente existir em `public/assets/`, ele é usado. Caso
 * contrário, a função devolve `null` e o renderer aplica o desenho procedural.
 */

export type AssetKey =
  | 'player-idle'
  | 'player-run'
  | 'player-jump'
  | 'terminal-off'
  | 'terminal-on'
  | 'platform'
  | 'background-hub'
  | 'background-circuitos-digitais'
  | 'background-calculo-1'

const PATHS: Record<AssetKey, string> = {
  'player-idle': '/assets/player-idle.png',
  'player-run': '/assets/player-run.png',
  'player-jump': '/assets/player-jump.png',
  'terminal-off': '/assets/terminal-off.png',
  'terminal-on': '/assets/terminal-on.png',
  platform: '/assets/platform.png',
  'background-hub': '/assets/background-hub.png',
  'background-circuitos-digitais': '/assets/background-circuitos-digitais.png',
  'background-calculo-1': '/assets/background-calculo-1.png',
}

type AssetEntry =
  | { status: 'loading'; image: HTMLImageElement }
  | { status: 'ready'; image: HTMLImageElement }
  | { status: 'missing' }

export class AssetManager {
  private entries = new Map<AssetKey, AssetEntry>()

  /** Dispara a sondagem de todos os assets conhecidos. Seguro chamar várias vezes. */
  prepare(): void {
    for (const key of Object.keys(PATHS) as AssetKey[]) this.probe(key)
  }

  private probe(key: AssetKey): void {
    if (this.entries.has(key)) return
    const path = PATHS[key]
    const image = new Image()
    image.decoding = 'async'
    this.entries.set(key, { status: 'loading', image })

    image.onload = () => {
      if (this.entries.get(key)?.status === 'loading') {
        this.entries.set(key, { status: 'ready', image })
      }
    }
    image.onerror = () => {
      // Silencioso por design: o fallback procedural é o caminho padrão.
      this.entries.set(key, { status: 'missing' })
    }
    image.src = path
  }

  /** Devolve a imagem pronta, ou null enquanto carrega / se o arquivo não existe. */
  get(key: AssetKey): HTMLImageElement | null {
    this.probe(key)
    const entry = this.entries.get(key)
    return entry?.status === 'ready' ? entry.image : null
  }

  has(key: AssetKey): boolean {
    return this.get(key) !== null
  }
}

export const assetManager = new AssetManager()
