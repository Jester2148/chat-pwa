'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Chat, Message, Agent, Provider, Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  apiKeys: {} as Record<Provider, string>,
  serperApiKey: '',
  firecrawlApiKey: '',
  summarizationModel: 'openai/gpt-4o-mini',
  searchEnabled: false,
  reasoningEnabled: false,
  ttsMode: 'device',
  lastProvider: 'openai',
  lastModel: 'gpt-4o',
};

function generateId(): string {
  return crypto.randomUUID();
}

interface AppState {
  chats: Chat[];
  activeChatId: string | null;
  settings: Settings;
  agents: Agent[];
  incognitoMode: boolean;

  createChat: (agent?: Agent) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  updateMessage: (chatId: string, messageId: string, partial: Partial<Message>) => void;
  clearHistory: () => void;
  setApiKey: (provider: Provider, key: string) => void;
  setSettings: (partial: Partial<Settings>) => void;
  toggleIncognito: () => void;
  setActiveChat: (id: string | null) => void;
  updateChat: (id: string, partial: Partial<Chat>) => void;
  addAgent: (agent: Agent) => void;
  removeAgent: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      settings: DEFAULT_SETTINGS,
      agents: [],
      incognitoMode: false,

      createChat: (agent?) => {
        const id = generateId();
        const { settings } = get();
        const newChat: Chat = {
          id,
          title: 'New Chat',
          messages: [],
          provider: agent?.provider || settings.lastProvider,
          model: agent?.model || settings.lastModel,
          agentId: agent?.id,
          createdAt: Date.now(),
        };
        if (agent) {
          newChat.messages.push({
            id: generateId(),
            role: 'system',
            content: agent.systemPrompt,
            createdAt: Date.now(),
          });
        }
        set((state) => ({
          chats: [newChat, ...state.chats],
          activeChatId: id,
        }));
        return id;
      },

      deleteChat: (id) => {
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== id),
          activeChatId: state.activeChatId === id ? null : state.activeChatId,
        }));
      },

      renameChat: (id, title) => {
        set((state) => ({
          chats: state.chats.map((c) => (c.id === id ? { ...c, title } : c)),
        }));
      },

      addMessage: (chatId, message) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId ? { ...c, messages: [...c.messages, message] } : c
          ),
        }));
      },

      updateMessage: (chatId, messageId, partial) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...partial } : m
                  ),
                }
              : c
          ),
        }));
      },

      clearHistory: () => {
        set({ chats: [], activeChatId: null });
      },

      setApiKey: (provider, key) => {
        set((state) => ({
          settings: {
            ...state.settings,
            apiKeys: { ...state.settings.apiKeys, [provider]: key },
          },
        }));
      },

      setSettings: (partial) => {
        set((state) => ({
          settings: { ...state.settings, ...partial },
        }));
      },

      toggleIncognito: () => {
        set((state) => ({ incognitoMode: !state.incognitoMode }));
      },

      setActiveChat: (id) => {
        set({ activeChatId: id });
      },

      updateChat: (id, partial) => {
        set((state) => ({
          chats: state.chats.map((c) =>
            c.id === id ? { ...c, ...partial } : c
          ),
        }));
      },

      addAgent: (agent) => {
        set((state) => ({ agents: [...state.agents, agent] }));
      },

      removeAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
        }));
      },
    }),
    {
      name: 'omnichat-storage',
      partialize: (state) => ({
        chats: state.incognitoMode ? [] : state.chats,
        activeChatId: state.incognitoMode ? null : state.activeChatId,
        settings: state.settings,
        agents: state.agents,
        incognitoMode: state.incognitoMode,
      }),
    }
  )
);

export function getActiveChat(state: AppState) {
  if (!state.activeChatId) return null;
  return state.chats.find((c) => c.id === state.activeChatId) || null;
}
