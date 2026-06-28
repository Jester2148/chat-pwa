'use client';

import { useState } from 'react';
import { X, Plus, Bot } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Agent, Provider } from '@/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS: Provider[] = ['openai', 'anthropic', 'google', 'deepseek', 'kimi', 'zhipu', 'minimax'];

export default function AgentsLibrary({ open, onClose }: Props) {
  const { agents, addAgent, removeAgent, createChat } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [provider, setProvider] = useState<Provider>('openai');
  const [model, setModel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');

  const handleCreate = () => {
    if (!name.trim()) return;
    const agent: Agent = {
      id: crypto.randomUUID(),
      name: name.trim(),
      emoji: emoji || '🤖',
      provider,
      model: model || 'gpt-4o',
      systemPrompt: systemPrompt.trim(),
    };
    addAgent(agent);
    setName('');
    setEmoji('');
    setSystemPrompt('');
    setShowForm(false);
  };

  const handleSelect = (agent: Agent) => {
    createChat(agent);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-slate-900 w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Agents</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => handleSelect(agent)}
              className="bg-slate-800 rounded-xl p-3 text-left hover:bg-slate-700 transition-colors border border-slate-700"
            >
              <div className="text-2xl mb-1">{agent.emoji}</div>
              <div className="text-sm font-medium text-white truncate">{agent.name}</div>
              <div className="text-xs text-slate-400 truncate">{agent.provider}/{agent.model}</div>
            </button>
          ))}
          <button
            onClick={() => setShowForm(true)}
            className="bg-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1 border border-dashed border-slate-600 hover:border-slate-500 transition-colors"
          >
            <Plus size={24} className="text-slate-400" />
            <span className="text-xs text-slate-400">New Agent</span>
          </button>
        </div>

        {showForm && (
          <div className="space-y-3 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="flex gap-2">
              <input
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="🤖"
                maxLength={2}
                className="w-12 bg-slate-800 text-white text-center rounded-lg border border-slate-700 text-lg"
              />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Agent name"
                className="flex-1 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="flex-1 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700"
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model (e.g. gpt-4o)"
                className="flex-1 bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700"
              />
            </div>

            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="System prompt..."
              rows={3}
              className="w-full bg-slate-800 text-white text-sm rounded-lg px-3 py-2 border border-slate-700 resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-700 text-white text-sm rounded-lg py-2 hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="flex-1 bg-blue-600 text-white text-sm rounded-lg py-2 hover:bg-blue-700 disabled:bg-slate-700"
              >
                Create Agent
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
