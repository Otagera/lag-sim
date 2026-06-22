import type { NewsArticle } from '../state/types'

let worker: Worker | null = null
let currentResolve: ((text: string | null) => void) | null = null
let timeoutId: ReturnType<typeof setTimeout> | null = null

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/llmWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (e) => {
      const r = currentResolve
      currentResolve = null
      if (timeoutId) clearTimeout(timeoutId)
      r?.(e.data.type === 'result' ? (e.data.text ?? null) : null)
    }
    worker.onerror = () => {
      const r = currentResolve
      currentResolve = null
      if (timeoutId) clearTimeout(timeoutId)
      r?.(null)
    }
  }
  return worker
}

const TIMEOUT_MS = 45_000

export async function generateNewsText(prompt: string): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    currentResolve = resolve
    getWorker().postMessage({ prompt })
    timeoutId = setTimeout(() => {
      if (currentResolve === resolve) {
        currentResolve = null
        resolve(null)
      }
    }, TIMEOUT_MS)
  })
}

export function buildNewsPrompt(
  article: NewsArticle,
  week: number,
  inCampaignMode: boolean,
  currentTerm: number,
): string {
  const dataLines = article.dataPoints
    .map((d) => `  ${d.label}: ${d.value}${d.delta ? ` (${d.delta})` : ''}`)
    .join('\n')

  return `You are writing for the Lagos Herald, a newspaper in the game. Write a concise quote about this week's developments.

Category: ${article.category}
Template headline: ${article.headline}
Template analysis: ${article.deck}
Data:
${dataLines}
Week ${week} of term ${currentTerm}${inCampaignMode ? ', campaign mode' : ''}

Your task: write one sentence under 200 characters that captures the essence of the story. It can be a direct quote from a fictional source ("A finance ministry source described the week as..."), a dry observation, or a pointed question. Be factual — do not invent data. Do not repeat the headline verbatim. Write only the sentence, nothing else.`
}
