import React, { useEffect, useRef, useState } from 'react';
import { SendHorizonal, ShieldCheck, Plus, MessageSquare, X } from 'lucide-react';
import { UserProfile } from '../types';
import { useDataStore } from '../store/useDataStore';
import { useToast } from './Toast';

interface MessagesViewProps {
  currentUser: UserProfile;
}

function formatTime(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  );
}

function PartnerAvatar({ name, avatar, size }: { name: string; avatar: string; size: string }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${size} rounded-full object-cover border border-slate-200 shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  }
  return (
    <div
      className={`${size} rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center justify-center font-bold shrink-0`}
    >
      <span className="text-[11px]">{initials(name)}</span>
    </div>
  );
}

export const MessagesView: React.FC<MessagesViewProps> = ({ currentUser }) => {
  const {
    messageThreads,
    fetchMessageThreads,
    fetchMessageThread,
    sendMessage,
    createThread,
  } = useDataStore();
  const { showToast } = useToast();

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchMessageThreads();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeThreadId && messageThreads.length > 0) {
      setActiveThreadId(messageThreads[0].id);
    }
  }, [messageThreads, activeThreadId]);

  useEffect(() => {
    if (activeThreadId) fetchMessageThread(activeThreadId);
  }, [activeThreadId]);

  const activeThread =
    messageThreads.find((t) => t.id === activeThreadId) ?? messageThreads[0] ?? null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.id, activeThread?.messages.length]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeThread || sending) return;
    setSending(true);
    try {
      await sendMessage(activeThread.id, text, currentUser.id);
      setDraft('');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleCreate = async () => {
    const name = partnerName.trim();
    if (!name) return;
    try {
      const thread = await createThread(name);
      setActiveThreadId(thread.id);
      setPartnerName('');
      setComposing(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to start conversation', 'error');
    }
  };

  const header = (
    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
      <div>
        <h2 className="text-base font-bold text-slate-900">Secure Care Team Messages</h2>
        <p className="text-xs text-slate-400">
          Encrypted clinical communications between patients &amp; providers
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          id="btn-new-message"
          onClick={() => setComposing((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New message</span>
        </button>
        <span className="hidden sm:flex text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-bit Encrypted</span>
        </span>
      </div>
    </div>
  );

  const composeForm = composing && (
    <div className="flex gap-2">
      <input
        id="input-new-thread-partner"
        type="text"
        value={partnerName}
        onChange={(e) => setPartnerName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        placeholder="Recipient name (e.g. Dr. Rajesh Kumar)"
        className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        id="btn-start-thread"
        onClick={handleCreate}
        disabled={!partnerName.trim()}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
      >
        <span>Start</span>
      </button>
      <button
        onClick={() => {
          setComposing(false);
          setPartnerName('');
        }}
        className="inline-flex items-center px-2.5 py-2 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors"
        aria-label="Cancel"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {header}
        <div className="min-h-[420px] flex items-center justify-center text-slate-500 text-sm">
          <span className="inline-block w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mr-2" />
          Loading messages…
        </div>
      </div>
    );
  }

  if (messageThreads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {header}
        {composeForm}
        <div className="min-h-[420px] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <MessageSquare className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No conversations yet</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Start a secure conversation with your care team — messages are stored on the server
            and persist across sessions.
          </p>
          {!composing && (
            <button
              id="btn-start-first-thread"
              onClick={() => setComposing(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Start a conversation</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!activeThread) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      {header}
      {composeForm}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversation List */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
          {messageThreads.map((thread) => {
            const isActive = activeThread && thread.id === activeThread.id;
            const lastMsg = thread.messages[thread.messages.length - 1];
            return (
              <button
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id);
                  setDraft('');
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                  isActive
                    ? 'border-blue-300 bg-blue-50/70'
                    : 'border-slate-200/80 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <PartnerAvatar
                  name={thread.partnerName}
                  avatar={thread.partnerAvatar}
                  size="w-9 h-9"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {thread.partnerName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatTime(thread.updatedAt)}
                    </span>
                  </div>
                  <div className="text-[11px] text-blue-600 truncate">
                    {thread.partnerRoleLabel}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-slate-500 line-clamp-1 min-w-0">
                      {lastMsg?.text}
                    </p>
                    {thread.unread > 0 && !isActive && (
                      <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white">
                        {thread.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Conversation */}
        <div className="md:col-span-2 bg-slate-50/50 rounded-xl border border-slate-200 p-4 flex flex-col min-h-[420px]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
            <PartnerAvatar
              name={activeThread.partnerName}
              avatar={activeThread.partnerAvatar}
              size="w-8 h-8"
            />
            <div>
              <div className="text-xs font-bold text-slate-900">
                {activeThread.partnerName}
              </div>
              <div className="text-[11px] text-blue-600">
                {activeThread.partnerRoleLabel}
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 py-4 overflow-y-auto">
            {activeThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 text-xs max-w-md ${
                  msg.senderId === currentUser.id
                    ? 'bg-blue-600 text-white ml-auto rounded-xl rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 mr-auto rounded-xl rounded-tl-sm'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] text-right mt-1 ${
                    msg.senderId === currentUser.id ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`Message ${activeThread.partnerName}...`}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <SendHorizonal className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending…' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
