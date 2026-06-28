'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Menu,
  Plus,
  Trash2,
  Settings,
  Bot,
  Volume2,
  VolumeX,
  Globe,
  GlobeOff,
  Eye,
  EyeOff,
  Brain,
  ChevronLeft,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Message, StreamChunk } from '@/lib/types';
import { trimContext } from '@/lib/contextManager';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import SettingsModal from './SettingsModal';
import AgentsLibrary from './AgentsLibrary';
import ModelSelector from './ModelSelector';

function generateId(): string {
  return crypto.randomUUID();
}

export default function MobileLayout() {
  const {
    chats,
    activeChatId,
    settings,
    incognitoMode,
    createChat,
    deleteChat,
    renameChat,
    addMessage,
    updateMessage,
    setActiveChat,
    toggleIncognito,
    setSettings,
  } = useStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, scrollToBottom]);

  const handleNewChat = () => {
    createChat();
    setDrawerOpen(false);
  };

  const handleDeleteChat = (id: string) => {
    deleteChat(id);
  };

  const handleRenameStart = (id: string, current: string) => {
    setEditingTitle(id);
    setEditValue(current);
  };

  const handleRenameConfirm = (id: string) => {
    if (editValue.trim()) {
      renameChat(id, editValue.trim());
    }
    setEditingTitle(null);
  };

  const handleSend = async (text: string, images: string[]) => {
    let chat = activeChat;
    if (!chat) {
      const id = createChat();
      const { chats: updatedChats } = useStore.getState();
      chat = updatedChats.find((c) => c.id === id) || null;
    }

    if (!chat) return;
    const chatId = chat.id;

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text,
      images: images.length > 0 ? images : undefined,
      createdAt: Date.now(),
    };
    addMessage(chatId, userMsg);
    scrollToBottom();

    if (!incognitoMode) {
      trimContext(
        { ...chat, messages: [...chat.messages, userMsg] },
        6000
      );
    }

    setStreaming(true);
    abortRef.current = new AbortController();

    const assistantMsg: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      reasoning: '',
      createdAt: Date.now(),
    };
    addMessage(chatId, assistantMsg);

    try {
      const messages = [...chat.messages, userMsg];
      const apiKey = settings.apiKeys[chat.provider];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: chat!.provider,
          model: chat!.model,
          apiKey,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            images: m.images,
          })),
          systemPrompt: chat.messages.find((m) => m.role === 'system')?.content || '',
          searchEnabled: settings.searchEnabled,
          searchApiKey: settings.searchEnabled ? settings.serperApiKey || '' : '',
          reasoning: settings.reasoningEnabled,
          temperature: 0.7,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        updateMessage(chatId, assistantMsg.id, {
          content: `Error: ${res.status} - ${errText}`,
        });
        setStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accContent = '';
      let accReasoning = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const chunk: StreamChunk = JSON.parse(jsonStr);
            if (chunk.type === 'text') {
              accContent += chunk.content;
              updateMessage(chatId, assistantMsg.id, { content: accContent });
            } else if (chunk.type === 'reasoning') {
              accReasoning += chunk.content;
              updateMessage(chatId, assistantMsg.id, { reasoning: accReasoning });
            }
          } catch {}
        }
      }

      if (chat.title === 'New Chat' && userMsg.content) {
        const title = userMsg.content.slice(0, 40) + (userMsg.content.length > 40 ? '...' : '');
        renameChat(chatId, title);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        updateMessage(chatId, assistantMsg.id, { content: `Error: ${err.message}` });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
    setStreaming(false);
  };

  const activeMsgs = activeChat?.messages || [];

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white relative overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button onClick={() => setDrawerOpen(true)} className="text-slate-400 hover:text-white p-1">
            <Menu size={20} />
          </button>
          {activeChat && (
            <div className="text-sm font-medium truncate max-w-[160px]">
              {editingTitle === activeChat.id ? (
                <div className="flex items-center gap-1">
                  <input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="bg-slate-800 text-white text-sm rounded px-2 py-0.5 w-32 border border-slate-600"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameConfirm(activeChat.id);
                      if (e.key === 'Escape') setEditingTitle(null);
                    }}
                  />
                  <button onClick={() => handleRenameConfirm(activeChat.id)} className="text-green-400">
                    <Check size={14} />
                  </button>
                  <button onClick={() => setEditingTitle(null)} className="text-slate-400">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <span>{activeChat.title}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSettings({ ttsMode: settings.ttsMode === 'off' ? 'device' : settings.ttsMode === 'device' ? 'api' : 'off' })}
            className={`p-1.5 rounded-lg ${settings.ttsMode !== 'off' ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white'}`}
            title={`TTS: ${settings.ttsMode}`}
          >
            {settings.ttsMode === 'off' ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={() => setSettings({ searchEnabled: !settings.searchEnabled })}
            className={`p-1.5 rounded-lg ${settings.searchEnabled ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white'}`}
            title="Web Search"
          >
            {settings.searchEnabled ? <Globe size={16} /> : <GlobeOff size={16} />}
          </button>
          <button
            onClick={() => setSettings({ reasoningEnabled: !settings.reasoningEnabled })}
            className={`p-1.5 rounded-lg ${settings.reasoningEnabled ? 'text-purple-400 bg-purple-500/10' : 'text-slate-400 hover:text-white'}`}
            title={settings.reasoningEnabled ? 'Reasoning On' : 'Reasoning Off'}
          >
            <Brain size={16} />
          </button>
          <button
            onClick={toggleIncognito}
            className={`p-1.5 rounded-lg ${incognitoMode ? 'text-orange-400 bg-orange-500/10' : 'text-slate-400 hover:text-white'}`}
            title={incognitoMode ? 'Incognito On' : 'Incognito Off'}
          >
            {incognitoMode ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button onClick={() => setAgentsOpen(true)} className="text-slate-400 hover:text-white p-1.5">
            <Bot size={16} />
          </button>
          <button onClick={() => setSettingsOpen(true)} className="text-slate-400 hover:text-white p-1.5">
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0">
        {activeMsgs.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Start a conversation</p>
            <p className="text-xs text-slate-600 mt-1">
              {settings.searchEnabled ? 'Web search is enabled' : 'Press + for new chat'}
            </p>
          </div>
        )}

        {activeMsgs
          .filter((m: Message) => m.role !== 'system')
          .map((msg: Message, i: number) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isStreaming={streaming && i === activeMsgs.filter((m: Message) => m.role !== 'system').length - 1 && msg.role === 'assistant'}
            />
          ))}

        <div ref={chatEndRef} />
      </div>

      {/* Stop Button */}
      {streaming && (
        <div className="flex justify-center pb-1">
          <button
            onClick={handleStop}
            className="bg-red-600/20 text-red-400 text-xs px-4 py-1.5 rounded-full hover:bg-red-600/30 transition-colors flex items-center gap-1"
          >
            <X size={12} /> Stop generating
          </button>
        </div>
      )}

      {/* Model Selector Toolbar */}
      {activeChat && (
        <div className="flex-shrink-0 px-4 py-1.5 border-t border-slate-800 bg-slate-900/60">
          <ModelSelector chatId={activeChat.id} provider={activeChat.provider} model={activeChat.model} />
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={streaming} />

      {/* Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="relative bg-slate-900 w-72 h-full p-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Chats</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <ChevronLeft size={18} />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-slate-800 rounded-lg px-3 py-2 mb-3"
            >
              <Plus size={16} /> New Chat
            </button>

            <div className="flex-1 overflow-y-auto space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChat(chat.id);
                    setDrawerOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer group ${
                    chat.id === activeChatId
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="flex-1 truncate">{chat.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRenameStart(chat.id, chat.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AgentsLibrary open={agentsOpen} onClose={() => setAgentsOpen(false)} />
    </div>
  );
}
