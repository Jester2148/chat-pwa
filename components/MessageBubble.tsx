'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, Loader2, Volume2, Square, Brain } from 'lucide-react';
import type { Message } from '@/lib/types';
import { speakDevice, stopDeviceSpeech, isDeviceSpeaking } from '@/lib/tts';
import ArtifactsDrawer from './ArtifactsDrawer';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

export default function MessageBubble({ message, isStreaming }: Props) {
  const [isReasoningOpen, setIsReasoningOpen] = useState(true);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactCode, setArtifactCode] = useState('');

  const isUser = message.role === 'user';
  const hasReasoning = !!message.reasoning;
  const hasImages = !!message.images && message.images.length > 0;

  const handleSpeak = () => {
    if (isSpeakingNow || isDeviceSpeaking()) {
      stopDeviceSpeech();
      setIsSpeakingNow(false);
    } else {
      setIsSpeakingNow(true);
      speakDevice(message.content, () => setIsSpeakingNow(false));
    }
  };

  const handleArtifact = (code: string) => {
    setArtifactCode(code);
    setArtifactOpen(true);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'bg-slate-950 text-white rounded-br-md'
            : 'bg-slate-700 text-slate-100 rounded-bl-md'
        }`}
      >
        {hasImages && (
          <div className="flex flex-wrap gap-1 mb-2">
            {message.images!.map((img, i) => (
              <img
                key={i}
                src={`data:image/jpeg;base64,${img}`}
                alt="Uploaded"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {isStreaming && !message.content && !hasReasoning ? (
          <div className="flex items-center gap-1 py-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
            <span className="w-2 h-2 bg-slate-400 rounded-full typing-dot" />
          </div>
        ) : (
          <>
            {hasReasoning && (
              <div className="mb-2 border border-slate-700 rounded-lg bg-slate-800/50">
                <button
                  className="w-full flex items-center justify-between p-2 text-xs text-slate-400 hover:text-slate-200"
                  onClick={() => setIsReasoningOpen(!isReasoningOpen)}
                >
                  <span className="flex items-center gap-2">
                    {isStreaming && !message.content ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Brain size={12} />
                    )}
                    {isStreaming && !message.content ? 'Thinking...' : 'View Reasoning'}
                  </span>
                  <ChevronDown size={14} className={`transition-transform ${isReasoningOpen ? 'rotate-180' : ''}`} />
                </button>
                {isReasoningOpen && (
                  <div className="p-2 pt-0 text-xs text-slate-400 whitespace-pre-wrap border-t border-slate-700 mt-1">
                    {message.reasoning}
                  </div>
                )}
              </div>
            )}

            {message.content && (
              <div className="text-sm leading-relaxed break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
                    h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-3 mb-1" {...props} />,
                    a: ({ node, ...props }) => (
                      <a className="text-blue-400 hover:underline" target="_blank" rel="noreferrer" {...props} />
                    ),
                    blockquote: ({ node, ...props }) => (
                      <blockquote className="border-l-4 border-slate-500 pl-3 italic text-slate-300 my-2" {...props} />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-3">
                        <table className="min-w-full border-collapse border border-slate-600 text-sm" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-slate-700" {...props} />,
                    th: ({ node, ...props }) => (
                      <th className="border border-slate-600 px-3 py-1.5 text-left font-semibold" {...props} />
                    ),
                    td: ({ node, ...props }) => (
                      <td className="border border-slate-600 px-3 py-1.5 align-top" {...props} />
                    ),
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const text = String(children).replace(/\n$/, '');
                      if (match && ['html', 'react', 'python'].includes(match[1]) && text.length > 100) {
                        return (
                          <button
                            onClick={() => handleArtifact(text)}
                            className="text-blue-400 underline text-sm"
                          >
                            View Artifact ({match[1]})
                          </button>
                        );
                      }
                      return (
                        <code className="bg-slate-800 px-1 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      );
                    },
                    pre: ({ node, ...props }) => (
                      <pre
                        className="bg-[#0d0d0f] border border-slate-700 rounded-lg p-3 my-2 overflow-x-auto text-xs"
                        {...props}
                      />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}

            {!isUser && message.content && (
              <div className="flex justify-end mt-1">
                <button
                  onClick={handleSpeak}
                  className="text-slate-500 hover:text-white p-1"
                  title="Read aloud"
                >
                  {isSpeakingNow ? <Square size={14} /> : <Volume2 size={14} />}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <ArtifactsDrawer
        open={artifactOpen}
        code={artifactCode}
        onClose={() => setArtifactOpen(false)}
      />
    </div>
  );
}
