import { NextResponse } from "next/server"

const DEFAULT_ENDPOINT = "http://localhost:8080/v1/models/albert-sst2:predict"

export async function POST(request: Request) {
  let body: { text?: string; endpoint?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const text = (body.text ?? "").trim()
  const endpoint = (body.endpoint ?? "").trim() || DEFAULT_ENDPOINT

  if (!text) {
    return NextResponse.json({ error: "Please enter some text to classify." }, { status: 400 })
  }

  const startedAt = Date.now()

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instances: [text] }),
      // Model servers can be slow to warm up.
      signal: AbortSignal.timeout(30_000),
    })

    const durationMs = Date.now() - startedAt
    const rawText = await upstream.text()

    let data: unknown = rawText
    try {
      data = JSON.parse(rawText)
    } catch {
      // Keep the raw string if the server did not return JSON.
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: `Model server responded with ${upstream.status} ${upstream.statusText}`,
          data,
          durationMs,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({ data, durationMs, endpoint })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? "The request to the model server timed out."
          : error.message
        : "Unknown error"

    return NextResponse.json(
      {
        error: `Could not reach the model server at ${endpoint}. ${message}`,
      },
      { status: 502 },
    )
  }
}