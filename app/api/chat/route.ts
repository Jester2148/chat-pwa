const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  kimi: 'https://api.moonshot.cn/v1',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  minimax: 'https://api.minimax.chat/v1',
};

function buildOpenAIBody(messages: any[], model: string, systemPrompt: string, temperature: number, reasoning: boolean) {
  const msgs: any[] = [];
  if (systemPrompt) {
    msgs.push({ role: 'system', content: systemPrompt });
  }
  for (const m of messages) {
    if (m.role === 'system' && systemPrompt) continue;
    if (m.images && m.images.length > 0) {
      const content: any[] = [{ type: 'text', text: m.content }];
      for (const img of m.images) {
        content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${img}` } });
      }
      msgs.push({ role: m.role, content });
    } else {
      msgs.push({ role: m.role, content: m.content });
    }
  }
  const body: any = {
    model,
    messages: msgs,
    stream: true,
    temperature,
  };

  if (reasoning && (model.startsWith('o') || model.includes('deepseek-reasoner'))) {
    body.reasoning_effort = 'medium';
    body.max_completion_tokens = 16384;
  }

  return body;
}

function buildAnthropicBody(messages: any[], model: string, systemPrompt: string, temperature: number, reasoning: boolean) {
  const msgs = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => {
      if (m.images && m.images.length > 0) {
        const content: any[] = [{ type: 'text', text: m.content }];
        for (const img of m.images) {
          content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: img } });
        }
        return { role: m.role, content };
      }
      return { role: m.role, content: m.content };
    });

  const system: any[] = [];
  if (systemPrompt) {
    system.push({ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } });
  }
  for (const m of messages) {
    if (m.role === 'system' && m.content !== systemPrompt) {
      system.push({ type: 'text', text: m.content, cache_control: { type: 'ephemeral' } });
    }
  }

  const body: any = {
    model,
    max_tokens: 8192,
    system,
    messages: msgs,
    stream: true,
    temperature,
  };

  if (reasoning) {
    body.thinking = { type: 'enabled', budget_tokens: 16000 };
  }

  return body;
}

function buildGeminiBody(messages: any[], model: string, systemPrompt: string, temperature: number) {
  const contents: any[] = messages
    .filter((m: any) => m.role !== 'system')
    .map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: m.images && m.images.length > 0
        ? [{ text: m.content }, ...m.images.map((img: string) => ({ inline_data: { mime_type: 'image/jpeg', data: img } }))]
        : [{ text: m.content }],
    }));

  return {
    contents,
    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
    generationConfig: { temperature },
  };
}

interface StreamWriter {
  write(chunk: Uint8Array): void;
  close(): void;
}

async function streamOpenAI(url: string, apiKey: string, body: any, encoder: TextEncoder, writer: StreamWriter) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.slice(6);
      if (jsonStr === '[DONE]') continue;
      try {
        const data = JSON.parse(jsonStr);
        const delta = data.choices?.[0]?.delta;
        if (delta?.content) {
          writer.write(encoder.encode(`data: {"type":"text","content":${JSON.stringify(delta.content)}}\n\n`));
        }
        if (delta?.reasoning_content) {
          writer.write(encoder.encode(`data: {"type":"reasoning","content":${JSON.stringify(delta.reasoning_content)}}\n\n`));
        }
      } catch {}
    }
  }
}

async function streamAnthropic(url: string, apiKey: string, body: any, encoder: TextEncoder, writer: StreamWriter) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.slice(6);
      try {
        const data = JSON.parse(jsonStr);
        if (data.type === 'content_block_delta') {
          const delta = data.delta;
          if (delta.type === 'text_delta') {
            writer.write(encoder.encode(`data: {"type":"text","content":${JSON.stringify(delta.text)}}\n\n`));
          } else if (delta.type === 'thinking_delta') {
            writer.write(encoder.encode(`data: {"type":"reasoning","content":${JSON.stringify(delta.thinking)}}\n\n`));
          }
        }
      } catch {}
    }
  }
}

async function streamGemini(url: string, apiKey: string, body: any, encoder: TextEncoder, writer: StreamWriter) {
  const res = await fetch(`${url}:streamGenerateContent?alt=sse&key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const jsonStr = trimmed.slice(6);
      try {
        const data = JSON.parse(jsonStr);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          writer.write(encoder.encode(`data: {"type":"text","content":${JSON.stringify(text)}}\n\n`));
        }
      } catch {}
    }
  }
}

export async function POST(req: Request) {

  const { provider, model, apiKey, messages, systemPrompt, searchEnabled, searchApiKey, reasoning: enableReasoning, temperature = 0.7 } = await req.json();

  let finalSystemPrompt = systemPrompt || '';

  if (searchEnabled) {
    try {
      const searchRes = await fetch(`${new URL(req.url).origin}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: messages[messages.length - 1]?.content || '', apiKey: searchApiKey }),
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.context) {
          finalSystemPrompt = `Context from web search:\n${searchData.context}\n\nAnswer based on this context. If the context is insufficient, say so.`;
        }
      }
    } catch {}
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const writer = {
        write: (chunk: Uint8Array) => controller.enqueue(chunk),
        close: () => controller.close(),
      };

      try {
        const baseURL = PROVIDER_BASE_URLS[provider];

        if (provider === 'anthropic') {
          const body = buildAnthropicBody(messages, model, finalSystemPrompt, temperature, enableReasoning);
          await streamAnthropic('https://api.anthropic.com/v1/messages', apiKey, body, encoder, writer);
        } else if (provider === 'google') {
          const body = buildGeminiBody(messages, model, finalSystemPrompt, temperature);
          await streamGemini(`https://generativelanguage.googleapis.com/v1beta/models/${model}`, apiKey, body, encoder, writer);
        } else if (baseURL) {
          const body = buildOpenAIBody(messages, model, finalSystemPrompt, temperature, enableReasoning);
          await streamOpenAI(`${baseURL}/chat/completions`, apiKey, body, encoder, writer);
        } else {
          throw new Error(`Unknown provider: ${provider}`);
        }
      } catch (err: any) {
        writer.write(encoder.encode(`data: {"type":"error","content":${JSON.stringify(err.message)}}\n\n`));
      } finally {
        writer.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
