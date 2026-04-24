import { useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../services/api';
import { chatService } from '../services/chatService';

function StatusBadge({ status }) {
  const map = {
    OPEN: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CLOSED: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
}

function MessageBubble({ message }) {
  const { sender_type, content } = message;

  if (sender_type === 'CUSTOMER') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-2xl rounded-br-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
          {content}
        </div>
      </div>
    );
  }

  if (sender_type === 'ADMIN') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[70%]">
          <p className="mb-1 text-xs font-medium text-green-700">You (Admin)</p>
          <div className="rounded-2xl rounded-bl-sm bg-green-100 px-4 py-2.5 text-sm text-green-900">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-2">
      <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
        AI
      </div>
      <div className="max-w-[70%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800">
        {content}
      </div>
    </div>
  );
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [listError, setListError] = useState('');
  const [msgError, setMsgError] = useState('');
  const bottomRef = useRef(null);

  const loadConversations = () => {
    setLoadingList(true);
    setListError('');
    chatService
      .getAllConversations()
      .then((res) => setConversations(res?.data ?? []))
      .catch((err) => setListError(getApiErrorMessage(err)))
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (conv) => {
    setSelected(conv);
    setMessages([]);
    setMsgError('');
    setReplyText('');
    setLoadingMessages(true);
    chatService
      .getConversation(conv.id)
      .then((res) => {
        const d = res?.data ?? res;
        setMessages(d?.messages ?? []);
        if (d?.conversation) setSelected((prev) => ({ ...prev, ...d.conversation }));
      })
      .catch((err) => setMsgError(getApiErrorMessage(err)))
      .finally(() => setLoadingMessages(false));
  };

  const handleReply = async () => {
    const text = replyText.trim();
    if (!text || sending || !selected) return;
    setSending(true);
    setMsgError('');
    try {
      const res = await chatService.adminReply(selected.id, text);
      const d = res?.data ?? res;
      setMessages(d?.messages ?? []);
      if (d?.conversation) setSelected((prev) => ({ ...prev, ...d.conversation }));
      setReplyText('');
      loadConversations();
    } catch (err) {
      setMsgError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!selected || closing) return;
    setClosing(true);
    setMsgError('');
    try {
      const res = await chatService.closeConversation(selected.id);
      const d = res?.data ?? res;
      if (d?.conversation) setSelected((prev) => ({ ...prev, ...d.conversation }));
      loadConversations();
    } catch (err) {
      setMsgError(getApiErrorMessage(err));
    } finally {
      setClosing(false);
    }
  };

  const isClosed = selected?.status === 'CLOSED';

  return (
    <div className="flex h-[calc(100vh-160px)] gap-4">
      {/* Left panel — conversation list */}
      <aside className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Conversations</h2>
          {loadingList && <p className="mt-1 text-xs text-slate-400">Loading...</p>}
          {listError && <p className="mt-1 text-xs text-red-500">{listError}</p>}
        </div>

        <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto">
          {conversations.length === 0 && !loadingList && (
            <li className="px-4 py-6 text-center text-sm text-slate-400">No conversations yet.</li>
          )}
          {conversations.map((conv) => (
            <li
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`cursor-pointer px-4 py-3 transition hover:bg-slate-50 ${selected?.id === conv.id ? 'bg-blue-50' : ''}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-800">
                  {conv.username ?? `User #${conv.user_id}`}
                </span>
                <StatusBadge status={conv.status} />
              </div>
              {conv.last_message && (
                <p className="mt-1 truncate text-xs text-slate-500">{conv.last_message}</p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {conv.message_count ?? 0} msg{conv.message_count !== 1 ? 's' : ''}
              </p>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right panel — messages */}
      <div className="flex flex-1 flex-col rounded-xl border border-slate-200 bg-white">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <p className="text-4xl">💬</p>
            <p className="mt-3 text-sm">Select a conversation to view messages.</p>
          </div>
        ) : (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="font-medium text-slate-800">
                  {selected.username ?? `User #${selected.user_id}`}
                </span>
                <StatusBadge status={selected.status} />
              </div>
              {!isClosed && (
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={closing}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {closing ? 'Closing...' : 'Close Conversation'}
                </button>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="flex h-full items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <span className="text-sm text-slate-400">Loading messages...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg, i) => (
                    <MessageBubble key={msg.id ?? i} message={msg} />
                  ))}
                  <div ref={bottomRef} />
                </div>
              )}
            </div>

            {/* Error */}
            {msgError && (
              <div className="mx-4 mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {msgError}
              </div>
            )}

            {/* Reply area */}
            {!isClosed && (
              <div className="flex gap-2 border-t border-slate-100 p-3">
                <textarea
                  className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                  rows={2}
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleReply();
                    }
                  }}
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={handleReply}
                  disabled={sending || !replyText.trim()}
                  className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            )}

            {isClosed && (
              <div className="border-t border-slate-100 px-4 py-3 text-center text-xs text-slate-400">
                This conversation has been closed.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
