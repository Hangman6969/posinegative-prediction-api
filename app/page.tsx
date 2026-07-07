import { TopicClassifier } from "@/components/topic-classifier"

export default function Page() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:py-16">
      <header className="flex flex-col gap-2">
        <span className="w-fit rounded-md bg-secondary px-2 py-1 font-mono text-xs text-secondary-foreground">
          albert-sst2
        </span>
        <h1 className="text-2xl font-semibold text-balance sm:text-3xl">Sentiment Classifier</h1>
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          Send a sentence or review to your model server{"'"}s predict endpoint and see the sentiment
          it returns — Positive or Negative. Every request is logged below so you can
          compare results.
        </p>
      </header>

      <TopicClassifier />
    </main>
  )
}