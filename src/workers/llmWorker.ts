import { pipeline, TextGenerationPipeline } from '@huggingface/transformers'

// Loaded once and reused for the lifetime of the worker
let generator: TextGenerationPipeline | null = null

const MODEL_ID = 'onnx-community/Qwen2.5-0.5B-Instruct'

self.onmessage = async (event: MessageEvent<{ prompt: string }>) => {
  try {
    if (!generator) {
      generator = (await pipeline('text-generation', MODEL_ID, {
        dtype: 'q4',
        device: 'auto',
      })) as TextGenerationPipeline
    }

    const messages = [
      {
        role: 'system' as const,
        content:
          'You are writing for "Lagos Governor Sim," a detailed governance simulation set in Lagos State, Nigeria. The game models 20 LGAs, fiscal policy, faction politics, and public opinion. Authenticity to Lagos \u2014 its places, institutions, and political texture \u2014 is critical. You will receive structured game data and a specific writing task. Produce only what you are asked for. No extra commentary.',
      },
      { role: 'user' as const, content: event.data.prompt },
    ]

    const result = await generator(messages as Parameters<TextGenerationPipeline>[0], {
      max_new_tokens: 350,
      temperature: 0.75,
      do_sample: true,
      repetition_penalty: 1.1,
    })

    const output = Array.isArray(result) ? result[0] : result
    const generated =
      typeof output === 'object' && output !== null && 'generated_text' in output
        ? (output as { generated_text: string | Array<{ role: string; content: string }> })
            .generated_text
        : ''

    let text: string
    if (Array.isArray(generated)) {
      const assistantTurn = generated.findLast(
        (m: { role: string; content: string }) => m.role === 'assistant',
      )
      text = assistantTurn?.content ?? ''
    } else {
      text = generated as string
    }

    self.postMessage({ type: 'result', text: text.trim() })
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err) })
  }
}
