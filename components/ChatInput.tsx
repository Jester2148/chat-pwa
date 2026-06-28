'use client';

import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { compressImage } from '@/lib/imageUtils';
import { useStore } from '@/lib/store';

interface Props {
  onSend: (text: string, images: string[]) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed && images.length === 0) return;
    onSend(trimmed, images);
    setText('');
    setImages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setCompressing(true);
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        const compressed = await compressImage(file);
        setImages((prev) => [...prev, compressed]);
      }
    }
    setCompressing(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="border-t border-slate-700 bg-slate-900 p-3">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {images.map((img, i) => (
            <div key={i} className="relative">
              <img
                src={`data:image/jpeg;base64,${img}`}
                alt=""
                className="w-12 h-12 object-cover rounded-lg"
              />
              <button
                onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled || compressing}
          className="text-slate-400 hover:text-white p-2 disabled:opacity-50"
        >
          <Paperclip size={20} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFile}
        />

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={compressing ? 'Compressing images...' : 'Type a message...'}
          rows={1}
          disabled={disabled || compressing}
          className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm border border-slate-700 resize-none max-h-32"
        />

        <button
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && images.length === 0) || compressing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white rounded-xl p-2.5 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
