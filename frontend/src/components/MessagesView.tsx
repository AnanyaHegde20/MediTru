import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SendHorizonal, ShieldCheck } from 'lucide-react';
import { mockMessageThreads, MessageThread } from '../data/mockData';
import { UserProfile } from '../types';

interface MessagesViewProps {
  currentUser: UserProfile;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ currentUser }) => {
  const [threads, setThreads] = useState<MessageThread[]>(mockMessageThreads);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Each role only sees the conversations addressed to them
  const visibleThreads = useMemo(
    () => threads.filter((t) => t.forRole === currentUser.role),
    [threads, currentUser.role]
  );

  const activeThread =
    visibleThreads.find((t) => t.id === activeThreadId) ?? visibleThreads[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeThread?.id, activeThread?.messages.length]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !activeThread) return;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThread.id
          ? {
              ...t,
              lastTime: 'Just now',
              unread: 0,
              messages: [
                ...t.messages,
                { id: `msg_${Date.now()}`, sender: 'self' as const, text, time: 'Just now' },
              ],
            }
          : t
      )
    );
    setDraft('');
  };

  if (!activeThread) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900">Secure Care Team Messages</h2>
          <p className="text-xs text-slate-400">
            Encrypted clinical communications between patients &amp; providers
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>256-bit Encrypted</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Conversation List */}
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
          {visibleThreads.map((thread) => {
            const isActive = thread.id === activeThread.id;
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
                <img
                  src={thread.participantAvatar}
                  alt={thread.participantName}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {thread.participantName}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{thread.lastTime}</span>
                  </div>
                  <div className="text-[11px] text-blue-600 truncate">
                    {thread.participantRoleLabel}
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
        <div className="md:col-span-2 bg-slate-50/50 rounded-xl border border-slate-200/80 p-4 flex flex-col min-h-[420px]">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
            <img
              src={activeThread.participantAvatar}
              alt={activeThread.participantName}
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="text-xs font-bold text-slate-900">{activeThread.participantName}</div>
              <div className="text-[11px] text-blue-600">{activeThread.participantRoleLabel}</div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 py-4 overflow-y-auto">
            {activeThread.messages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 text-xs max-w-md ${
                  msg.sender === 'self'
                    ? 'bg-blue-600 text-white ml-auto rounded-xl rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 mr-auto rounded-xl rounded-tl-sm'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] text-right mt-1 ${
                    msg.sender === 'self' ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {msg.time}
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
              placeholder={`Message ${activeThread.participantName}...`}
              className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <SendHorizonal className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
