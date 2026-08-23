import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Bot,
  User,
  Sparkles,
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  Plus,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { ChatMessage, UserProfile } from '../../types';

interface AIAssistantViewProps {
  currentUser: UserProfile;
  onNavigateTab: (tab: any) => void;
  initialQuery?: string;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  currentUser,
  onNavigateTab,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'assistant',
      text: `Hello ${currentUser.name.split(' ')[0]}! I am your MediCare AI Health Assistant.\n\nI can help you understand lab reports, learn about medications, review symptoms, and suggest lifestyle adjustments. How can I support your health today?`,
      timestamp: 'Just now',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState(initialQuery || '');
  const [isTyping, setIsTyping] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; content?: string } | null>(null);

  const [chatHistory, setChatHistory] = useState([
    { id: 'h1', title: 'Lipid Panel Review & HDL Tips', date: 'Yesterday' },
    { id: 'h2', title: 'Lisinopril Dosage & Hydration', date: '3 days ago' },
    { id: 'h3', title: 'Microcytic Anemia & Iron Foods', date: 'Last week' },
    { id: 'h4', title: 'Seasonal Rhinitis & Antihistamines', date: '2 weeks ago' },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, []);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputPrompt;
    if (!textToSend.trim() && !attachedFile) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: attachedFile ? [{ name: attachedFile.name, size: attachedFile.size, type: 'PDF' }] : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    const currentAttachment = attachedFile;
    setAttachedFile(null);
    setIsTyping(true);

    try {
      const response = await fetch('/api/gemini/health-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          reportContext: currentAttachment ? `Attached document: ${currentAttachment.name}` : undefined,
          history: messages.slice(-4).map((m) => ({ role: m.sender, text: m.text })),
        }),
      });

      const data = await response.json();
      const replyText = data.reply || data.message || 'I have reviewed your inquiry. Please consult a doctor for a definitive diagnostic exam.';

      // Check if critical symptoms mentioned to show inline action
      const isUrgent = textToSend.toLowerCase().includes('chest pain') ||
        textToSend.toLowerCase().includes('palpitation') ||
        textToSend.toLowerCase().includes('shortness of breath') ||
        textToSend.toLowerCase().includes('dizzy');

      const assistantMessage: ChatMessage = {
        id: `asst_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isUrgent,
        actionCta: {
          label: 'Book Consultation with Dr. Alan Stone',
          action: 'book_appointment',
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      // Offline fallback
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `asst_fallback_${Date.now()}`,
            sender: 'assistant',
            text: `Based on standard clinical guidelines for "${textToSend}":\n\n• **Clinical Context**: Keep hydration and balanced electrolyte intake high.\n• **Safety Alert**: If symptoms escalate, seek prompt medical care.\n• **Recommendation**: We advise scheduling a quick follow-up with our Cardiology or General Medicine team.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionCta: {
              label: 'Book an Appointment Now',
              action: 'book_appointment',
            },
          },
        ]);
      }, 700);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAttachReport = () => {
    // Simulated upload of PDF
    setAttachedFile({
      name: 'Lipid_Panel_Report_Oct2024.pdf',
      size: '1.4 MB',
      content: 'Total Cholesterol: 184 mg/dL, HDL: 58, LDL: 102, Triglycerides: 120.',
    });
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: `msg_new_${Date.now()}`,
        sender: 'assistant',
        text: `New consultation session started. What medical topic or test results would you like to review?`,
        timestamp: 'Just now',
      },
    ]);
  };

  return (
    <div id="ai-assistant-screen" className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[700px] h-[calc(100vh-140px)] animate-in fade-in">
      {/* Left Chat History Panel */}
      <div className="w-full md:w-64 border-r border-slate-200/80 bg-slate-50/70 p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* New Chat CTA */}
          <button
            id="btn-new-ai-chat"
            onClick={handleNewChat}
            className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Health Inquiry</span>
          </button>

          <div className="mt-5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Previous Consultations
            </div>
            <div className="space-y-1.5 overflow-y-auto max-h-[420px]">
              {chatHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMessages([
                      {
                        id: `msg_h_${Date.now()}`,
                        sender: 'assistant',
                        text: `Loaded archived session for **${item.title}** (${item.date}). What specific questions do you have regarding this topic?`,
                        timestamp: item.date,
                      },
                    ]);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-white hover:border-slate-200 border border-transparent text-xs transition-all group"
                >
                  <div className="font-medium text-slate-800 group-hover:text-blue-600 truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.date}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Clinical Disclaimer Box in History Sidebar */}
        <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-slate-600">
          <div className="font-semibold text-blue-900 flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            <span>Medical AI Assistant</span>
          </div>
          Powered by Gemini 3.7 Flash with verified clinical guardrails.
        </div>
      </div>

      {/* Main Chat Interface Area */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top Disclaimer Header */}
        <div className="p-3.5 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-2xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900">MediCare AI Health Assistant</h2>
              <p className="text-[10px] text-slate-400">Available 24/7 • Clinical Insights Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>Not a substitute for emergency care</span>
            </span>
          </div>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* Top System Welcome Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-slate-700 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>System Notice:</strong> I am your automated AI health companion. I can summarize lab reports, explain prescriptions, and provide evidence-based lifestyle tips. For diagnosis or prescriptions, always consult your physician.
            </p>
          </div>

          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-xl rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-2xs ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  {/* Attached file badge if present */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2.5 p-2 rounded-lg bg-blue-700/60 border border-white/20 flex items-center gap-2 text-xs">
                      <FileText className="w-3.5 h-3.5" />
                      <span className="truncate">{msg.attachments[0].name}</span>
                      <span className="text-[10px] opacity-75">({msg.attachments[0].size})</span>
                    </div>
                  )}

                  {/* Message Body with clean paragraphs and bold formatting */}
                  <div className="whitespace-pre-line space-y-1">
                    {msg.text}
                  </div>

                  {/* Inline Warning Badge if urgent symptoms */}
                  {msg.isUrgent && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-semibold">Doctor Attention Recommended:</strong>
                        <p className="text-[11px] mt-0.5">
                          Symptoms such as chest tightness or sudden dizziness warrant immediate evaluation by a cardiologist.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Inline "Book a Doctor" Action CTA */}
                  {msg.actionCta && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-medium">Recommended Next Step:</span>
                      <button
                        onClick={() => onNavigateTab('appointments')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book a Doctor</span>
                      </button>
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2 text-right ${
                      isUser ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-1"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            );
          })}

          {/* Typing Indicator (3 Dots) */}
          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-100 rounded-2xl py-3 px-4 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attached file preview chip above input */}
        {attachedFile && (
          <div className="px-5 py-2 bg-slate-50 border-t border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Attached: <strong>{attachedFile.name}</strong> ({attachedFile.size})</span>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="text-slate-400 hover:text-rose-600 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Input Form Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={handleAttachReport}
              title="Attach Lab Report PDF for RAG interpretation"
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              id="ai-chat-input-bar"
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Describe your symptoms, ask about medication, or paste lab values..."
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-2xs transition-all"
            />

            <button
              id="btn-ai-send"
              type="submit"
              disabled={!inputPrompt.trim() && !attachedFile}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[11px] text-slate-500">
            <span>Try asking:</span>
            {[
              'What do low Hemoglobin levels mean?',
              'How to lower triglycerides naturally?',
              'Is my fasting blood glucose normal?',
            ].map((suggest, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(suggest)}
                className="bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 px-2 py-0.5 rounded-md border border-slate-200 transition-colors shadow-2xs"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
