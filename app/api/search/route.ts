import { NextResponse } from 'next/server';
import { verifySecret } from '@/lib/auth';

export async function POST(req: Request) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { query } = await req.json();

  if (!query || typeof query !== 'string') {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });

    if (!res.ok) throw new Error(`Serper API error: ${res.status}`);

    const data = await res.json();
    const results = (data.organic || []).slice(0, 5);

    let context = results
      .map((r: any, i: number) => {
        const snippet = (r.snippet || '').slice(0, 500);
        return `[${i + 1}] ${r.title}\n${snippet}\nSource: ${r.link}`;
      })
      .join('\n\n');

    const words = context.split(/\s+/);
    if (words.length > 500) {
      context = words.slice(0, 500).join(' ') + '...';
    }

    return NextResponse.json({ context });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
