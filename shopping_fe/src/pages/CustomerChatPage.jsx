import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { chatService } from '../services/chatService';
import { formatDate } from '../utils/format';

function ConversationStatusBadge({ status }) {
  if (!status) return null;
  const map = {
    OPEN: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-slate-100 text-slate-500',
  };
  const label = {
    OPEN: 'Open',
    PENDING: 'Waiting for agent',
    CLOSED: 'Closed',
  };
  return (
    <span
      className={`inline-flex rounded-full px-3 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-500'}`}
    >
      {label[status] ?? status}
    </span>
  );
}

function MessageBubble({ message }) {
  const { sender_type, content, intent } = message;

  if (sender_type === 'CUSTOMER') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-3 text-sm text-white shadow-sm">
          {content}
        </div>
      </div>
    );
  }

  if (sender_type === 'ADMIN') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[70%]">
          <p className="mb-1 text-xs font-medium text-green-700">Support Agent</p>
          <div className="rounded-2xl rounded-bl-sm bg-green-100 px-4 py-3 text-sm text-green-900 shadow-sm">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // AI sender
  return (
    <div className="flex justify-start gap-2">
      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
        AI
      </div>
      <div className="max-w-[70%]">
        <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm text-slate-800 shadow-sm">
          {content}
          {intent && (
            <p className="mt-1 text-xs text-slate-400 italic">Intent: {intent}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CustomerChatPage() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setLoading(true);
    chatService
      .getMyConversation()
      .then((res) => {
        const d = res?.data ?? res;
        setConversation(d?.conversation ?? null);
        setMessages(d?.messages ?? []);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setError('');
    try {
      const res = await chatService.sendMessage(text);
      const d = res?.data ?? res;
      setConversation(d?.conversation ?? conversation);
      setMessages(d?.messages ?? []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = conversation?.status === 'CLOSED';
  const isPending = conversation?.status === 'PENDING';

  return (
    <section className="mx-auto flex max-w-2xl flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Chat Support</h1>
          <p className="mt-1 text-sm text-slate-500">Chat with our AI or connect with an agent.</p>
        </div>
        <ConversationStatusBadge status={conversation?.status} />
      </div>

      {/* Pending banner */}
      {isPending && (
        <div className="mb-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          You have been connected to our support team. An agent will reply shortly.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
            <span className="text-slate-500">Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
            <p className="text-4xl">💬</p>
            <p className="mt-3 text-base font-medium text-slate-600">Start a conversation</p>
            <p className="mt-1 text-sm">Send a message to get help from our AI or support team.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={msg.id ?? i} message={msg} />
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {!isClosed && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending || loading}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !input.trim() || loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      )}

      {isClosed && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
          This conversation has been closed.
        </div>
      )}
    </section>
  );
}
