'use client';

import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

const SITE_PASSWORD = process.env.NEXT_PUBLIC_APP_SECRET_PASSWORD || 'pyro2148';

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('omnichat_auth') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input === SITE_PASSWORD) {
      sessionStorage.setItem('omnichat_auth', 'true');
      setAuthenticated(true);
    } else {
      setError(true);
      setInput('');
    }
  };

  if (authenticated) return <>{children}</>;

  return (
    <div className="h-dvh w-full flex items-center justify-center bg-[#171717]">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-5 px-8 w-full max-w-sm">
        <Brain size={48} className="text-emerald-500" />
        <h1 className="text-xl font-semibold text-white">OmniChat</h1>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          placeholder="Enter password"
          autoFocus
          className="w-full bg-slate-800 text-white rounded-xl px-4 py-3 text-center text-sm border border-slate-700 focus:border-emerald-500"
        />
        {error && <p className="text-red-400 text-xs">Incorrect password</p>}
        <button
          type="submit"
          disabled={!input}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white rounded-xl py-3 text-sm font-medium transition-colors"
        >
          Enter
        </button>
      </form>
    </div>
  );
}
