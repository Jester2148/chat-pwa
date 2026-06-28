import { NextResponse } from 'next/server';

const PROVIDER_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com',
  deepseek: 'https://api.deepseek.com',
  kimi: 'https://api.moonshot.cn',
  zhipu: 'https://open.bigmodel.cn/api/paas/v4',
  minimax: 'https://api.minimax.chat/v1',
};

export async function POST(req: Request) {

  const { provider, apiKey } = await req.json();

  try {
    if (provider === 'anthropic') {
      const models = [
        'claude-3-5-sonnet-20241022',
        'claude-3-5-haiku-20241022',
        'claude-3-opus-20240229',
        'claude-3-haiku-20240307',
      ];
      return NextResponse.json(models.map((id) => ({ id, name: id })));
    }

    if (provider === 'google') {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
      const data = await res.json();
      const models = data.models
        .filter((m: any) => m.name.includes('gemini'))
        .map((m: any) => ({ id: m.name.replace('models/', ''), name: m.displayName || m.name }));
      return NextResponse.json(models);
    }

    const baseURL = PROVIDER_BASE_URLS[provider];
    if (!baseURL) {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    const res = await fetch(`${baseURL}/v1/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`Provider API error: ${res.status}`);

    const data = await res.json();
    const models = (data.data || []).map((m: any) => ({ id: m.id, name: m.id }));
    return NextResponse.json(models);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
