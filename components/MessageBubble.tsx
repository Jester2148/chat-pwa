'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronRight, Loader2, Volume2, Square } from 'lucide-react';
import type { Message } from '@/lib/types';
import { speakDevice, stopDeviceSpeech, isDeviceSpeaking } from '@/lib/tts';
import ArtifactsDrawer from './ArtifactsDrawer';

interface Props {
  message: Message;
  isStreaming?: boolean;
  onSpeak?: (text: string) => void;
}

export default function MessageBubble({ message, isStreaming, onSpeak }: Props) {
  const [showReasoning, setShowReasoning] = useState(false);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [artifactCode, setArtifactCode] = useState('');

  const isUser = message.role === 'user';
  const hasReasoning = !!message.reasoning && message.reasoning.length > 0;
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
              <div className="mb-2">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  {isStreaming ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : showReasoning ? (
                    <ChevronDown size={12} />
                  ) : (
                    <ChevronRight size={12} />
                  )}
                  {isStreaming ? 'Thinking...' : 'View Reasoning'}
                </button>
                {showReasoning && (
                  <div className="mt-1 p-2 bg-slate-900/50 rounded-lg text-xs text-slate-400 italic whitespace-pre-wrap">
                    {message.reasoning}
                  </div>
                )}
              </div>
            )}

            {message.content && (
              <div className="text-sm leading-relaxed break-words [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-1 [&_code]:bg-slate-800 [&_code]:px-1 [&_code]:rounded [&_pre]:bg-slate-800 [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-blue-400 [&_a]:underline [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-sm [&_h1]:font-semibold [&_h2]:font-semibold [&_h3]:font-semibold [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-2 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-500 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-300">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeStr = String(children).replace(/\n$/, '');
                      const isArtifact = match && ['html', 'react', 'python'].includes(match[1]);

                      if (isArtifact) {
                        return (
                          <button
                            onClick={() => handleArtifact(codeStr)}
                            className="text-blue-400 underline text-sm"
                          >
                            View Artifact ({match![1]})
                          </button>
                        );
                      }
                      return <code className={className} {...props}>{children}</code>;
                    },
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
