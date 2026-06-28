'use client';

import { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Provider } from '@/lib/types';

const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google Gemini' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'kimi', label: 'Kimi (Moonshot)' },
  { id: 'zhipu', label: 'ZhiPu' },
  { id: 'minimax', label: 'MiniMax' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const { settings, setSettings, setApiKey } = useStore();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">API Keys</h3>
            {PROVIDERS.map((p) => (
              <div key={p.id} className="mb-2">
                <label className="text-xs text-slate-400 block mb-1">{p.label}</label>
                <div className="relative">
                  <input
                    type={showKeys[p.id] ? 'text' : 'password'}
                    value={settings.apiKeys[p.id] || ''}
                    onChange={(e) => setApiKey(p.id, e.target.value)}
                    placeholder={`Enter ${p.label} API key`}
                    className="w-full bg-slate-800 text-white text-sm rounded-lg px-3 py-2 pr-9 border border-slate-700"
                  />
                  <button
                    onClick={() => setShowKeys((s) => ({ ...s, [p.id]: !s[p.id] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showKeys[p.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Summarization Model</h3>
            <input
              type="text"
              value={settings.summarizationModel}
              onChange={(e) => setSettings({ summarizationModel: e.target.value })}
              placeholder="e.g. openai/gpt-4o-mini"
              className="w-full bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700"
            />
            <p className="text-xs text-slate-500 mt-1">Format: provider/model-name</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">Web Search (Serper)</label>
            <button
              onClick={() => setSettings({ searchEnabled: !settings.searchEnabled })}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                settings.searchEnabled ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.searchEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
