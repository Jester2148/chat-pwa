'use client';

import { useState } from 'react';
import { X, Copy, Check, Monitor } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  open: boolean;
  code: string;
  onClose: () => void;
}

export default function ArtifactsDrawer({ open, code, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'code' | 'preview'>('code');

  const isHtml = code.trim().startsWith('<');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open || !code) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-slate-900 w-full rounded-t-2xl h-[70vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            {isHtml && (
              <div className="flex bg-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setTab('code')}
                  className={`px-3 py-1 text-xs rounded-md ${
                    tab === 'code' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  Code
                </button>
                <button
                  onClick={() => setTab('preview')}
                  className={`px-3 py-1 text-xs rounded-md ${
                    tab === 'preview' ? 'bg-slate-700 text-white' : 'text-slate-400'
                  }`}
                >
                  <Monitor size={14} className="inline mr-1" />
                  Preview
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-white p-1"
              title="Copy code"
            >
              {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {tab === 'preview' && isHtml ? (
            <iframe
              srcDoc={code}
              className="w-full h-full bg-white"
              title="Preview"
              sandbox="allow-scripts"
            />
          ) : (
            <SyntaxHighlighter
              language="html"
              style={oneDark}
              customStyle={{ margin: 0, borderRadius: 0, height: '100%', background: '#0f172a' }}
              showLineNumbers
            >
              {code}
            </SyntaxHighlighter>
          )}
        </div>
      </div>
    </div>
  );
}
