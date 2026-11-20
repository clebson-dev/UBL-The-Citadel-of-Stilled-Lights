"""Fallback de legenda quando o yt-dlp é bloqueado pelo YouTube (HTTP 429).

Uso: python scripts/fetch-transcript-api.py <video_id> <arquivo_de_saida.txt>

A biblioteca youtube-transcript-api usa outro caminho para o timedtext e
consegue recuperar legendas em português mesmo quando o yt-dlp recebe 429.
"""

import sys
from pathlib import Path

from youtube_transcript_api import YouTubeTranscriptApi


def main() -> int:
    if len(sys.argv) != 3:
        print(
            "Uso: python scripts/fetch-transcript-api.py <video_id> <saida.txt>",
            file=sys.stderr,
        )
        return 1

    video_id, raw_output = sys.argv[1], sys.argv[2]
    output = Path(raw_output)

    try:
        transcript = YouTubeTranscriptApi().fetch(
            video_id,
            languages=["pt", "pt-BR", "pt-PT", "pt-orig"],
        )
    except Exception as exc:  # a API tem várias exceções específicas
        print(f"API: falha ao obter legenda em português: {exc}", file=sys.stderr)
        return 2

    lines: list[str] = []
    for snippet in transcript.to_raw_data():
        text = " ".join(str(snippet.get("text", "")).split())
        if not text or (lines and lines[-1] == text):
            continue
        lines.append(text)

    if not lines:
        print("API: legenda em português vazia após a limpeza.", file=sys.stderr)
        return 3

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"API: {len(lines)} linhas salvas em {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
