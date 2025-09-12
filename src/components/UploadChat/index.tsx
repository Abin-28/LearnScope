"use client";

import { useState } from 'react';
import { TopicUploader } from '../TopicUploader';

interface ChatTurn { role: 'user' | 'assistant'; content: string }

export default function UploadChat() {
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [lastAnswer, setLastAnswer] = useState<string>("");

  const onAnswered = (answer: string) => {
    setLastAnswer(answer);
    setChat(prev => [...prev, { role: 'assistant', content: answer }]);
  };

  return (
    <div className="flex h-full">
      <aside className="w-72 border-r dark:border-gray-700 p-4 space-y-2">
        <h3 className="text-sm font-semibold">Conversation</h3>
        <div className="mt-2 space-y-2 max-h-[40vh] overflow-auto">
          {chat.map((t, i) => (
            <div key={i} className={`text-sm ${t.role==='user'?'text-blue-600':'text-green-600'}`}>{t.role}: {t.content}</div>
          ))}
          {chat.length===0 && <p className="text-xs text-gray-500">Upload a document and ask a question to start.</p>}
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <TopicUploader />
      </main>
    </div>
  );
}


