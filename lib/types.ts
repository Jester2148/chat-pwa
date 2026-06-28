export type Role = 'user' | 'assistant' | 'system';

export type Provider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'kimi' | 'zhipu' | 'minimax';

export interface Message {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;
  images?: string[];
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  agentId?: string;
  provider: Provider;
  model: string;
  createdAt: number;
}

export interface Agent {
  id: string;
  name: string;
  emoji: string;
  provider: Provider;
  model: string;
  systemPrompt: string;
}

export interface Settings {
  apiKeys: Record<Provider, string>;
  serperApiKey: string;
  firecrawlApiKey: string;
  summarizationModel: string;
  searchEnabled: boolean;
  reasoningEnabled: boolean;
  ttsMode: 'off' | 'device' | 'api';
  lastProvider: Provider;
  lastModel: string;
}

export interface StreamChunk {
  type: 'text' | 'reasoning';
  content: string;
}
