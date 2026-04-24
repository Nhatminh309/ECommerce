import { useEffect, useRef, useState } from 'react';
import { chatWithAI } from '../services/aiService';

const INTENT_COLORS = {
  product: 'bg-green-100 text-green-700',
  order: 'bg-blue-100 text-blue-700',
  support: 'bg-yellow-100 text-yellow-700',
};

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 0, role: 'ai', text: 'Hi! How can I help you?', intent: null },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const sendMessage = async () => {
    const question = input.trim();
    if (!question || sending) return;

    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', text: question }]);
    setInput('');
    setSending(true);

    try {
      const res = await chatWithAI(question);
      const payload = res?.data ?? res;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'ai',
          text: payload?.answer ?? 'Sorry, I could not process your request.',
          intent: payload?.intent ?? null,
        },
      ]);
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div
          className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ width: 300, height: 400 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-blue-600 px-4 py-3">
            <span className="text-sm font-medium text-white">AI Assistant</span>
            <button
              type="button"
              className="text-white/70 transition hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-3">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] ${!isUser ? 'flex flex-col gap-1' : ''}`}>
                      {!isUser && msg.intent && (
                        <span
                          className={`inline-block self-start rounded-full px-2 py-0.5 text-xs font-medium ${
                            INTENT_COLORS[msg.intent] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {msg.intent}
                          {msg.intent === 'support' && (
                            <span className="ml-1 text-xs italic opacity-70">— support notified</span>
                          )}
                        </span>
                      )}
                      <div
                        className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
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
              })}
              {sending && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2">
                    <span className="flex gap-0.5">
                      {[0, 150, 300].map((delay) => (
                        <span
                          key={delay}
                          className="animate-bounce text-slate-400 text-xs"
                          style={{ animationDelay: `${delay}ms` }}
                        >
                          •
                        </span>
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex gap-1.5 border-t border-slate-100 p-2">
            <input
              type="text"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label={open ? 'Close AI chat' : 'Open AI chat'}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl shadow-lg transition hover:bg-blue-700 active:scale-95"
      >
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
