/**
 * Extrai uma transcrição limpa de um vídeo do YouTube.
 *
 * Uso: npm run transcript -- "https://www.youtube.com/watch?v=..." "aula-02"
 *
 * O arquivo gerado em docs/transcripts/ é temporário (ignorado pelo Git) e serve
 * apenas para o content-factory redigir resumo/desafio com fidelidade à aula.
 * Sem legendas em português, o script termina sem erro e pede o fallback.
 * Em caso de falha do yt-dlp (inclusive 429), o stderr real é mostrado no terminal.
 */

import { spawnSync, type SpawnSyncReturns } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(projectRoot, 'docs', 'transcripts')
const apiFallback = join(projectRoot, 'scripts', 'fetch-transcript-api.py')

/** Falha esperada: não é erro de código, é ausência de legenda/ferramenta. */
class TranscriptUnavailable extends Error {}

interface YtDlpRunner {
  command: string
  prefixArgs: string[]
}

const YOUTUBE_URL = /^https:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/
const TIMESTAMP = /^\d{1,2}:\d{2}(?::\d{2})?[.,]\d{1,3}\s*-->/
const OUTPUT_ID = /^[A-Za-z0-9_-]+$/
const RATE_LIMIT = /429|too many requests|rate.?limit/i
const MAX_ATTEMPTS = 3

/** Espera síncrona (o script é sequencial) entre tentativas de download. */
function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/** Mostra o erro original do yt-dlp, sem tentar adivinhar a causa. */
function showYtDlpError(result: SpawnSyncReturns<string>, attempt: number, id: string): string {
  const stderr = (result.stderr ?? '').trim()
  const detail = stderr
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^ERROR\b/i.test(line))
    .slice(-1)
    .join(' ')
    .replace(/^ERROR:\s*/i, '')

  console.error(`yt-dlp falhou para ${id} (tentativa ${attempt}/${MAX_ATTEMPTS}):`)
  if (stderr) {
    console.error(stderr)
  } else if (result.error) {
    console.error(result.error.message)
  } else {
    console.error(`processo terminou com status ${String(result.status)} e sem stderr.`)
  }

  return detail
}

/** Último recurso: usa youtube-transcript-api quando o yt-dlp recebe 429. */
function fallbackWithApi(url: string, outputPath: string, id: string): boolean {
  if (!existsSync(apiFallback)) return false
  const videoId = new URL(url).searchParams.get('v') ?? ''
  if (!videoId) return false

  const result = spawnSync('python', [apiFallback, videoId, outputPath], {
    cwd: projectRoot,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 120_000,
  })

  if (result.status === 0 && existsSync(outputPath)) {
    const lines = readFileSync(outputPath, 'utf8').trim().split('\n').length
    console.log(`✔ Transcrição salva via API: docs/transcripts/${id}.txt (${lines} linhas)`)
    return true
  }

  const detail = (result.stderr ?? '').trim() || result.error?.message || `status ${String(result.status)}`
  console.error(`Fallback por API falhou para ${id}: ${detail}`)
  return false
}

function probe(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    windowsHide: true,
    timeout: 20_000,
  })
  return !result.error && result.status === 0
}

/** Encontra yt-dlp no PATH, via módulo Python ou na instalação por usuário do Windows. */
function resolveRunner(): YtDlpRunner {
  if (probe('yt-dlp', ['--version'])) {
    return { command: 'yt-dlp', prefixArgs: [] }
  }

  for (const python of ['python', 'python3']) {
    if (probe(python, ['-m', 'yt_dlp', '--version'])) {
      return { command: python, prefixArgs: ['-m', 'yt_dlp'] }
    }
  }

  const appData = process.env.APPDATA
  if (appData) {
    const pythonRoot = join(appData, 'Python')
    if (existsSync(pythonRoot)) {
      for (const entry of readdirSync(pythonRoot)) {
        const executable = join(pythonRoot, entry, 'Scripts', 'yt-dlp.exe')
        if (existsSync(executable)) {
          return { command: executable, prefixArgs: [] }
        }
      }
    }
  }

  throw new TranscriptUnavailable('yt-dlp não está disponível neste ambiente.')
}

/** Remove cabeçalho, marcas de tempo, tags e linhas repetidas em sequência. */
export function parseVtt(raw: string): string {
  const lines = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n')
  const cleanLines: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const line = (lines[index] ?? '').trim()
    if (!line) continue
    if (/^WEBVTT\b/i.test(line)) continue
    if (/^(?:NOTE|STYLE|REGION)\b/i.test(line)) continue
    if (/^(?:Kind|Language|X-TIMESTAMP-MAP)\s*:/i.test(line)) continue

    const nextLine = (lines[index + 1] ?? '').trim()
    if (TIMESTAMP.test(line)) continue
    if (TIMESTAMP.test(nextLine)) continue // identificador de cue

    const text = line
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim()

    if (!text) continue
    if (cleanLines[cleanLines.length - 1] === text) continue
    cleanLines.push(text)
  }

  return cleanLines.join('\n')
}

function warnFallback(reason: string): void {
  console.warn(`AVISO: ${reason}`)
  console.warn(
    'FALLBACK: sem transcrição em português. Registre o aviso no relatório e redija o lote a partir do título da aula e da teoria consolidada da disciplina.',
  )
}

function main(): void {
  const [url, id] = process.argv.slice(2)

  if (!url || !id || !YOUTUBE_URL.test(url) || !OUTPUT_ID.test(id)) {
    console.error(
      'Uso: npm run transcript -- "https://www.youtube.com/watch?v=..." "aula-02"',
    )
    console.error('O identificador de saída aceita apenas letras, números, hífen e underscore.')
    process.exitCode = 1
    return
  }

  const outputPath = join(outputDir, `${id}.txt`)
  if (existsSync(outputPath)) rmSync(outputPath)

  let tempDir: string | undefined
  try {
    const runner = resolveRunner()
    tempDir = mkdtempSync(join(tmpdir(), 'ubl-transcript-'))

    const args = [
      '--write-sub',
      '--write-auto-sub',
      '--sub-lang',
      'pt.*',
      '--sleep-subtitles',
      '3',
      '--sleep-requests',
      '2',
      '--skip-download',
      '--sub-format',
      'vtt',
      '--no-playlist',
      '--output',
      join(tempDir, '%(id)s.%(ext)s'),
    ]

    // YouTube tem exigido um runtime JS para alguns formatos; use o Node quando existir.
    if (probe('node', ['--version'])) {
      args.push('--js-runtimes', 'node', '--remote-components', 'ejs:github')
    }
    args.push(url)

    let result: SpawnSyncReturns<string> | undefined
    let failureDetail = ''
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      result = spawnSync(runner.command, [...runner.prefixArgs, ...args], {
        cwd: tempDir,
        encoding: 'utf8',
        windowsHide: true,
        timeout: 180_000,
      })

      if (!result.error && result.status === 0) {
        failureDetail = ''
        break
      }

      const detail = showYtDlpError(result, attempt, id)
      failureDetail = detail ? `: ${detail}` : '.'
      const rateLimited =
        RATE_LIMIT.test(result.stderr ?? '') || RATE_LIMIT.test(result.error?.message ?? '')

      if (rateLimited && attempt < MAX_ATTEMPTS) {
        const waitMs = 5000 + (attempt - 1) * 3000
        console.warn(`Rate limit do YouTube: aguardando ${waitMs / 1000}s antes de tentar de novo...`)
        sleep(waitMs)
        continue
      }
      break
    }

    if (!result || result.error || result.status !== 0) {
      if (fallbackWithApi(url, outputPath, id)) return
      warnFallback(`yt-dlp não conseguiu obter legendas para ${id}${failureDetail || '.'}`)
      return
    }

    const vttFiles = readdirSync(tempDir)
      .filter((file) => file.toLowerCase().endsWith('.vtt'))
      .sort()

    const vttFile =
      vttFiles.find((file) => /\.pt-br\.vtt$/i.test(file)) ??
      vttFiles.find((file) => /\.pt\.vtt$/i.test(file)) ??
      vttFiles.find((file) => /\.pt[-_.][a-z0-9]+\.vtt$/i.test(file)) ??
      vttFiles[0]

    if (!vttFile) {
      if (fallbackWithApi(url, outputPath, id)) return
      warnFallback(`o vídeo ${id} não possui legendas em português.`)
      return
    }

    const transcript = parseVtt(readFileSync(join(tempDir, vttFile), 'utf8'))
    if (!transcript) {
      if (fallbackWithApi(url, outputPath, id)) return
      warnFallback(`a legenda em português de ${id} estava vazia após a limpeza.`)
      return
    }

    mkdirSync(outputDir, { recursive: true })
    writeFileSync(outputPath, `${transcript}\n`, 'utf8')
    console.log(`✔ Transcrição salva: docs/transcripts/${id}.txt (${transcript.split('\n').length} linhas)`)
  } catch (error) {
    if (error instanceof TranscriptUnavailable) {
      warnFallback(error.message)
      return
    }
    console.error('Erro inesperado ao extrair a transcrição:', error)
    process.exitCode = 1
  } finally {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true })
  }
}

main()
