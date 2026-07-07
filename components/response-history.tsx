"use client"

import type { HistoryEntry } from "@/lib/prediction"
import { formatScore, getCategoryMeta } from "@/lib/prediction"

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

export function ResponseHistory({ entries }: { entries: HistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No responses yet. Submit some text above to see predictions appear here.
        </p>
      </div>
    )
  }

  return (
    <ol className="flex flex-col gap-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-lg border border-border bg-card p-4 text-card-foreground"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm leading-relaxed text-pretty">
              <span className="text-muted-foreground">{'"'}</span>
              {entry.text}
              <span className="text-muted-foreground">{'"'}</span>
            </p>
            <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              {timeAgo(entry.createdAt)}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {entry.error ? (
              <span className="inline-flex items-center rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
                {entry.error}
              </span>
            ) : (
              <>
                {entry.topLabel &&
                  (() => {
                    const meta = getCategoryMeta(entry.topLabel)
                    return (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                        {meta.emoji && (
                          <span role="img" aria-label={meta.name}>
                            {meta.emoji}
                          </span>
                        )}
                        {meta.name}
                        {formatScore(entry.topScore) ? ` · ${formatScore(entry.topScore)}` : ""}
                      </span>
                    )
                  })()}
                {typeof entry.durationMs === "number" && (
                  <span className="text-xs text-muted-foreground">{entry.durationMs} ms</span>
                )}
              </>
            )}
          </div>

          {!entry.error && entry.data !== undefined && (
            <details className="mt-3 group">
              <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
                Raw response
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            </details>
          )}
        </li>
      ))}
    </ol>
  )
}
