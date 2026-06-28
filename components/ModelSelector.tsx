'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Provider } from '@/lib/types';

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Gemini' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'kimi', label: 'Kimi' },
  { id: 'zhipu', label: 'ZhiPu' },
  { id: 'minimax', label: 'MiniMax' },
];

interface Props {
  chatId: string;
  provider: Provider;
  model: string;
}

export default function ModelSelector({ chatId, provider, model }: Props) {
  const { settings, updateChat, setSettings } = useStore();
  const [models, setModels] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchModels = useCallback(async () => {
    const apiKey = settings.apiKeys[provider];
    if (!apiKey) {
      setModels([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setModels(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      setModels([]);
    } finally {
      setLoading(false);
    }
  }, [provider, settings.apiKeys]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const handleProviderChange = (newProvider: string) => {
    const p = newProvider as Provider;
    updateChat(chatId, { provider: p, model: '' });
    setSettings({ lastProvider: p });
  };

  const handleModelChange = (newModel: string) => {
    updateChat(chatId, { model: newModel });
    setSettings({ lastModel: newModel });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <select
        value={provider}
        onChange={(e) => handleProviderChange(e.target.value)}
        className="bg-slate-800 text-white rounded-md px-2 py-1 border border-slate-700 flex-shrink-0 max-w-[110px]"
      >
        {PROVIDERS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      <div className="flex items-center gap-1 flex-1 min-w-0">
        <select
          value={model}
          onChange={(e) => handleModelChange(e.target.value)}
          className="bg-slate-800 text-white rounded-md px-2 py-1 border border-slate-700 w-full min-w-0 truncate"
        >
          {!model && <option value="">Select model...</option>}
          {models.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>

        <button
          onClick={fetchModels}
          disabled={loading}
          className="text-slate-400 hover:text-white p-1 flex-shrink-0 disabled:opacity-50"
          title="Refresh models"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <span className="text-red-400 truncate max-w-[100px]" title={error}>
          {error}
        </span>
      )}
    </div>
  );
}
