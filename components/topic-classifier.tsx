"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ResponseHistory } from "@/components/response-history"
import {
  extractTopPrediction,
  formatScore,
  getCategoryMeta,
  makeId,
  type HistoryEntry,
  type PredictResponse,
} from "@/lib/prediction"

const DEFAULT_ENDPOINT = "http://localhost:8080/v1/models/albert-sst2:predict"

export function TopicClassifier() {
  const [text, setText] = useState("This movie was absolutely wonderful")
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const latest = history[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setLoading(true)
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, endpoint: endpoint.trim() || DEFAULT_ENDPOINT }),
      })
      const payload = (await res.json()) as PredictResponse

      const top = payload.error ? {} : extractTopPrediction(payload.data)

      const entry: HistoryEntry = {
        id: makeId(),
        text: trimmed,
        createdAt: Date.now(),
        durationMs: payload.durationMs,
        error: payload.error,
        data: payload.data,
        topLabel: top.label,
        topScore: top.score,
      }
      setHistory((prev) => [entry, ...prev])
    } catch (err) {
      setHistory((prev) => [
        {
          id: makeId(),
          text: trimmed,
          createdAt: Date.now(),
          error: err instanceof Error ? err.message : "Request failed.",
        },
        ...prev,
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="text" className="text-sm font-medium">
            Text to classify
          </label>
          <textarea
            id="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder="Type a sentence, e.g. This movie was absolutely wonderful"
            className="w-full resize-y rounded-lg border border-input bg-card px-3 py-2 text-sm leading-relaxed text-card-foreground outline-none ring-ring/50 transition focus-visible:ring-2"
          />
          <p className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
              ⌘/Ctrl + Enter
            </kbd>{" "}
            to submit.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="endpoint" className="text-sm font-medium">
            Model endpoint
          </label>
          <input
            id="endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            spellCheck={false}
            className="w-full rounded-lg border border-input bg-card px-3 py-2 font-mono text-xs text-card-foreground outline-none ring-ring/50 transition focus-visible:ring-2"
          />
          <p className="text-xs text-muted-foreground">
            The request is proxied through this app, then POSTed as{" "}
            <code className="font-mono">{'{ "instances": [text] }'}</code>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={loading || !text.trim()}>
            {loading ? "Predicting..." : "Predict"}
          </Button>
          {history.length > 0 && (
            <Button type="button" variant="ghost" onClick={() => setHistory([])}>
              Clear history
            </Button>
          )}
        </div>
      </form>

      {loading && (
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
          <p className="text-sm text-muted-foreground">Sending request to the model server…</p>
        </div>
      )}

      {!loading && latest && (
        <div className="rounded-lg border border-border bg-card p-6 text-card-foreground">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Latest response</p>

          {latest.error ? (
            <p className="mt-2 text-sm font-medium text-destructive">{latest.error}</p>
          ) : latest.topLabel ? (
            (() => {
              const meta = getCategoryMeta(latest.topLabel)
              return (
                <div className="mt-2 flex items-center gap-4">
                  {meta.emoji && (
                    <span className="text-5xl leading-none" role="img" aria-label={meta.name}>
                      {meta.emoji}
                    </span>
                  )}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-semibold capitalize text-balance">{meta.name}</span>
                    {formatScore(latest.topScore) && (
                      <span className="text-lg text-muted-foreground">{formatScore(latest.topScore)}</span>
                    )}
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">
                The server responded, but no category label was recognized. Raw output:
              </p>
              <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed text-foreground">
                {typeof latest.data === "string" ? latest.data : JSON.stringify(latest.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Response history</h2>
          <span className="text-xs text-muted-foreground">
            {history.length} {history.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <ResponseHistory entries={history} />
      </section>
    </div>
  )
}