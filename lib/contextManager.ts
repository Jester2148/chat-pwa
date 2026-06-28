import type { Chat, Message } from './types';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function summarizeMessages(messages: Message[]): string {
  const text = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const words = text.split(/\s+/);
  if (words.length > 300) {
    return words.slice(0, 300).join(' ') + '...';
  }
  return text;
}

export interface TrimResult {
  messages: Message[];
  wasTrimmed: boolean;
}

export function trimContext(chat: Chat, maxTokens: number = 6000): TrimResult {
  let totalTokens = 0;
  for (const m of chat.messages) {
    totalTokens += estimateTokens(m.content + (m.reasoning || ''));
  }

  if (totalTokens <= maxTokens) {
    return { messages: chat.messages, wasTrimmed: false };
  }

  const systemMessages = chat.messages.filter((m) => m.role === 'system');
  const nonSystemMessages = chat.messages.filter((m) => m.role !== 'system');

  if (nonSystemMessages.length <= 2) {
    return { messages: chat.messages, wasTrimmed: false };
  }

  const keepEnd = Math.min(4, nonSystemMessages.length);
  const toSummarize = nonSystemMessages.slice(0, nonSystemMessages.length - keepEnd);
  const keepMessages = nonSystemMessages.slice(nonSystemMessages.length - keepEnd);

  const summaryText = summarizeMessages(toSummarize);

  const summaryMessage: Message = {
    id: 'summary-' + Date.now(),
    role: 'system',
    content: `Summary of previous conversation: ${summaryText}`,
    createdAt: Date.now(),
  };

  return {
    messages: [...systemMessages, summaryMessage, ...keepMessages],
    wasTrimmed: true,
  };
}
