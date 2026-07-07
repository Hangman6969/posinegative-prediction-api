export type PredictResponse = {
  data?: unknown
  durationMs?: number
  endpoint?: string
  error?: string
}

export type HistoryEntry = {
  id: string
  text: string
  createdAt: number
  durationMs?: number
  error?: string
  data?: unknown
  topLabel?: string
  topScore?: number
}

/**
 * Model servers return predictions in a few shapes. This normalizes the most
 * common KServe/TorchServe outputs into a single "top label + score" pair so
 * we can show a friendly summary. Falls back gracefully when the shape is
 * unexpected.
 */
export function extractTopPrediction(data: unknown): { label?: string; score?: number } {
  const predictions = getPredictionsArray(data)
  if (!predictions.length) return {}

  const first = predictions[0]

  // Case: [1] — a bare class index (albert-sst2 default output)
  if (typeof first === "number") {
    return { label: String(first) }
  }

  // Case: ["joy"] or "joy"
  if (typeof first === "string") {
    return { label: first }
  }

  if (first && typeof first === "object") {
    const obj = first as Record<string, unknown>

    // Case: { label: "joy", score: 0.98 }
    if (typeof obj.label === "string") {
      return {
        label: obj.label,
        score: typeof obj.score === "number" ? obj.score : undefined,
      }
    }

    // Case: [{ joy: 0.98, sadness: 0.01, ... }]  -> pick the max
    const entries = Object.entries(obj).filter(([, v]) => typeof v === "number") as [string, number][]
    if (entries.length) {
      entries.sort((a, b) => b[1] - a[1])
      return { label: entries[0][0], score: entries[0][1] }
    }
  }

  // Case: [[0.01, 0.98, ...]] raw logits/probabilities — no labels available.
  if (Array.isArray(first) && first.every((v) => typeof v === "number")) {
    const arr = first as number[]
    let maxIdx = 0
    for (let i = 1; i < arr.length; i++) if (arr[i] > arr[maxIdx]) maxIdx = i
    return { label: `class ${maxIdx}`, score: arr[maxIdx] }
  }

  return {}
}

function getPredictionsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>
    if (Array.isArray(obj.predictions)) return obj.predictions
    if (Array.isArray(obj.outputs)) return obj.outputs
  }
  return []
}

/**
 * albert-sst2 label mapping (Stanford Sentiment Treebank, binary):
 * 0 = Negative, 1 = Positive
 */
const CATEGORY_BY_INDEX: { name: string; emoji: string }[] = [
  { name: "Negative", emoji: "😞" },
  { name: "Positive", emoji: "😊" },
]

const CATEGORY_BY_NAME: Record<string, { name: string; emoji: string }> = CATEGORY_BY_INDEX.reduce(
  (acc, c) => {
    acc[c.name.toLowerCase()] = c
    return acc
  },
  {} as Record<string, { name: string; emoji: string }>,
)

/**
 * Resolves a model label (e.g. "Positive", "LABEL_1", "class 1", or "1") into a
 * friendly category name + emoji. Returns undefined emoji when unknown.
 */
export function getCategoryMeta(label?: string): { name: string; emoji?: string } {
  if (!label) return { name: "" }

  const lower = label.toLowerCase().trim()

  // Direct name match: "positive", "negative", ...
  if (CATEGORY_BY_NAME[lower]) return CATEGORY_BY_NAME[lower]

  // Index match: "1", "class 1", "label_1", "LABEL_1"
  const idxMatch = lower.match(/(\d+)/)
  if (idxMatch) {
    const idx = Number(idxMatch[1])
    if (CATEGORY_BY_INDEX[idx]) return CATEGORY_BY_INDEX[idx]
  }

  return { name: label }
}

/**
 * Generates a unique-enough id without the Web Crypto API.
 */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function formatScore(score?: number): string | undefined {
  if (typeof score !== "number") return undefined
  // Some servers already return 0-1, treat >1 as a raw value and skip %.
  if (score >= 0 && score <= 1) return `${(score * 100).toFixed(1)}%`
  return score.toFixed(3)
}