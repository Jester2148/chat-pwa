import { NextResponse } from 'next/server';
import { verifySecret } from '@/lib/auth';

export async function POST(req: Request) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { text, apiKey } = await req.json();

  if (!text || !apiKey) {
    return NextResponse.json({ error: 'Missing text or apiKey' }, { status: 400 });
  }

  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.slice(0, 4096),
        voice: 'alloy',
        response_format: 'mp3',
      }),
    });

    if (!res.ok) throw new Error(`TTS API error: ${res.status}`);

    const audioBuffer = await res.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
