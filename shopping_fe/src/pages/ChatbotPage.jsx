import { useEffect, useRef, useState } from 'react';
import { chatWithAI } from '../services/aiService';

const INTENT_BADGE = {
  product: { label: 'Product', className: 'bg-green-100 text-green-700' },
  order: { label: 'Order', className: 'bg-blue-100 text-blue-700' },
  support: { label: 'Support', className: 'bg-yellow-100 text-yellow-700' },
};

function IntentBadge({ intent }) {
  if (!intent) return null;
  const config = INTENT_BADGE[intent] ?? { label: intent, className: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isUser ? '' : 'flex flex-col gap-1'}`}>
        {!isUser && msg.intent && (
          <div className="flex items-center gap-2">
            <IntentBadge intent={msg.intent} />
            {msg.intent === 'support' && (
              <span className="text-xs italic text-slate-400">Connecting you to support...</span>
            )}
          </div>
        )}
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white'
              : 'rounded-tl-sm bg-slate-100 text-slate-800'
          }`}
        >
          {msg.text}
        </div>
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { id: 0, role: 'ai', text: 'Hello! I\'m your shopping assistant. Ask me about products, orders, or anything else I can help with.', intent: null },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || sending) return;

    const userMsg = { id: Date.now(), role: 'user', text: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    try {
      const res = await chatWithAI(question);
      const payload = res?.data ?? res;
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: payload?.answer ?? 'Sorry, I could not process your request.',
        intent: payload?.intent ?? null,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: 'ai', text: 'Something went wrong. Please try again.', intent: null },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col" style={{ height: 'calc(100vh - 140px)' }}>
      <h1 className="mb-4 text-2xl font-semibold">Chat AI Assistant</h1>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5">
                <span className="flex gap-1">
                  <span className="animate-bounce text-slate-400" style={{ animationDelay: '0ms' }}>•</span>
                  <span className="animate-bounce text-slate-400" style={{ animationDelay: '150ms' }}>•</span>
                  <span className="animate-bounce text-slate-400" style={{ animationDelay: '300ms' }}>•</span>
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="mt-3 flex gap-2">
        <textarea
          className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          rows={2}
          placeholder="Type a message... (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={sending || !input.trim()}
          className="self-end rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
