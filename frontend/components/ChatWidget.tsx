'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, Send, MessageCircle, ChevronRight, Globe } from 'lucide-react';
import { getUser, isLoggedIn } from '../lib/auth';

// ── Constants ─────────────────────────────────────────────────────────────────

const MODULE_ROUTES: Record<string, string> = {
  PAYE_CALCULATOR: '/calculator/employment',
  PRESUMPTIVE_TAX: '/calculator/presumptive',
  BUSINESS_INCOME: '/calculator/business',
  VAT_CALCULATOR: '/calculator/vat',
  VAT_EXEMPT_CHECKER: '/calculator/vat-exempt-checker',
  WHT_CALCULATOR: '/calculator/withholding',
  TERMINAL_BENEFITS: '/calculator/terminal',
  DEPRECIATION_CALCULATOR: '/calculator/business',
  INVESTMENT_INCOME: '/calculator/investment',
  PARTNERSHIP_TAX: '/calculator/partnership',
  REAL_ESTATE_VAT: '/calculator/vat',
  TAX_PROFILE: '/onboarding',
  FILING_DEADLINES: '/dashboard',
  PENALTIES_CALCULATOR: '/calculator/penalty',
};

const MODULE_LABELS: Record<string, string> = {
  PAYE_CALCULATOR: 'PAYE Calculator',
  PRESUMPTIVE_TAX: 'Presumptive Tax',
  BUSINESS_INCOME: 'Business Income',
  VAT_CALCULATOR: 'VAT Calculator',
  VAT_EXEMPT_CHECKER: 'VAT Exempt Checker',
  WHT_CALCULATOR: 'WHT Calculator',
  TERMINAL_BENEFITS: 'Terminal Benefits',
  DEPRECIATION_CALCULATOR: 'Depreciation Calculator',
  INVESTMENT_INCOME: 'Investment Income',
  PARTNERSHIP_TAX: 'Partnership Tax',
  REAL_ESTATE_VAT: 'Real Estate VAT',
  TAX_PROFILE: 'Tax Profile',
  FILING_DEADLINES: 'Filing Deadlines',
  PENALTIES_CALCULATOR: 'Penalties Calculator',
};

const QUICK_REPLIES = [
  'Do I need VAT registration?',
  'Calculate my PAYE',
  'What taxes apply to my business?',
  'Filing deadlines',
];

const WELCOME_MESSAGE = `Habari! I am your KodiComply Tax Assistant. I know everything about Tanzania tax law including the Income Tax Act and VAT Act.

Ask me anything like:
- Do I need to register for VAT?
- How much PAYE should my employee pay?
- What is presumptive tax?
- When is my VAT return due?
- How do I calculate WHT on a consultant?

What would you like to know?`;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Session {
  id: number;
  preview: string;
  messageCount: number;
  updatedAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });
}

type MessagePart =
  | { type: 'module'; key: string; index: number }
  | { type: 'text'; content: string; index: number };

function parseMessageContent(text: string): MessagePart[] {
  const parts = text.split(/(\[Go to: [A-Z_]+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\[Go to: ([A-Z_]+)\]/);
    if (match) {
      return { type: 'module' as const, key: match[1], index: i };
    }
    return { type: 'text' as const, content: part, index: i };
  });
}

// ── Message bubble ─────────────────────────────────────────────────────────────

function MessageBubble({ msg, onNavigate }: { msg: ChatMessage; onNavigate: (path: string) => void }) {
  const isUser = msg.role === 'user';
  const parts = parseMessageContent(msg.content);

  return (
    <div className={`flex flex-col mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-[#1a5c38] text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm'
        }`}
      >
        {parts.map((part) => {
          if (part.type === 'module') {
            const route = MODULE_ROUTES[part.key];
            const label = MODULE_LABELS[part.key] || part.key;
            if (!route) return null;
            return (
              <button
                key={part.index}
                onClick={() => onNavigate(route)}
                className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 bg-[#1a5c38] text-white text-xs font-medium rounded-full hover:bg-[#154d2f] transition-colors"
              >
                <ChevronRight size={12} />
                Open {label}
              </button>
            );
          }
          return (
            <span key={part.index} className="whitespace-pre-wrap">
              {part.content}
            </span>
          );
        })}
      </div>
      <span className="text-[10px] text-gray-400 mt-1 px-1">{formatTime(msg.timestamp)}</span>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start mb-3">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Widget ───────────────────────────────────────────────────────────────

export default function ChatWidget() {
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'EN' | 'SW'>('EN');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(20);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Check login state — re-run on route change so widget appears after login/logout
  useEffect(() => {
    setLoggedIn(isLoggedIn());
    const handleStorage = () => setLoggedIn(isLoggedIn());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [pathname]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Keyboard shortcut Ctrl+/
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        if (loggedIn) setOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [loggedIn]);

  // Fetch usage on open
  const fetchUsage = useCallback(async () => {
    const token = localStorage.getItem('kodicomply_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/usage`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsageCount(data.count);
        setUsageLimit(data.limit);
      }
    } catch { /* silent */ }
  }, []);

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem('kodicomply_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecentSessions(data);
      }
    } catch { /* silent */ }
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    fetchUsage();
    fetchSessions();

    if (!hasOpenedBefore) {
      setHasOpenedBefore(true);
      setShowIntro(true);
      setTimeout(() => {
        setShowIntro(false);
        if (messages.length === 0) {
          setMessages([{
            role: 'assistant',
            content: WELCOME_MESSAGE,
            timestamp: new Date(),
          }]);
        }
      }, 3000);
    } else if (messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: WELCOME_MESSAGE,
        timestamp: new Date(),
      }]);
    }
  }, [hasOpenedBefore, messages.length, fetchUsage, fetchSessions]);

  const loadSession = useCallback(async (id: number) => {
    const token = localStorage.getItem('kodicomply_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/chat/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages.map((m: { role: string; content: string }) => ({
          ...m,
          timestamp: new Date(),
        })));
        setSessionId(id);
        setLanguage(data.language || 'EN');
        setShowSessions(false);
      }
    } catch { /* silent */ }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming || usageCount >= usageLimit) return;

    const token = localStorage.getItem('kodicomply_token');
    if (!token) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsStreaming(true);

    // Get user profile for context
    let userProfile: Record<string, unknown> | undefined;
    try {
      const raw = localStorage.getItem('kodicomply_user');
      if (raw) {
        const user = JSON.parse(raw);
        userProfile = user.taxProfile || undefined;
      }
    } catch { /* silent */ }

    // Map current pathname to module name
    const pageMap: Record<string, string> = {
      '/calculator/employment': 'PAYE Calculator',
      '/calculator/vat': 'VAT Calculator',
      '/calculator/withholding': 'WHT Calculator',
      '/calculator/business': 'Business Income',
      '/calculator/corporate': 'Corporate Tax',
      '/calculator/terminal': 'Terminal Benefits',
      '/calculator/penalty': 'Penalties Calculator',
      '/calculator/presumptive': 'Presumptive Tax',
      '/calculator/investment': 'Investment Income',
      '/calculator/partnership': 'Partnership Tax',
    };
    const currentPage = pageMap[pathname] || undefined;

    const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    let aiText = '';
    const aiMsg: ChatMessage = { role: 'assistant', content: '', timestamp: new Date() };
    setMessages(prev => [...prev, aiMsg]);

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ messages: apiMessages, language, userProfile, sessionId, currentPage }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const errMsg = err.message || 'Sorry, I am having trouble connecting. Please try again in a moment.';
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', content: errMsg, timestamp: new Date() }]);
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value);
        const lines = raw.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'chunk') {
              aiText += event.text;
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: aiText, timestamp: aiMsg.timestamp },
              ]);
            } else if (event.type === 'done') {
              if (event.sessionId) setSessionId(event.sessionId);
              setUsageCount(event.count || 0);
              setUsageLimit(event.limit || 20);
            } else if (event.type === 'error') {
              setMessages(prev => [
                ...prev.slice(0, -1),
                { role: 'assistant', content: event.message, timestamp: aiMsg.timestamp },
              ]);
            }
          } catch { /* malformed line */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: 'assistant', content: 'Sorry, I am having trouble connecting. Please try again in a moment.', timestamp: aiMsg.timestamp },
        ]);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, usageCount, usageLimit, language, sessionId, pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startNewChat = () => {
    abortRef.current?.abort();
    setMessages([{ role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date() }]);
    setSessionId(null);
    setInput('');
    setShowSessions(false);
  };

  if (!loggedIn) return null;

  const atLimit = usageCount >= usageLimit;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2">
          <div className="relative group">
            <button
              onClick={handleOpen}
              title="Ask me anything about Tanzania tax"
              className={`w-[60px] h-[60px] rounded-full bg-[#1a5c38] text-white shadow-lg hover:bg-[#154d2f] transition-all flex items-center justify-center ${!hasOpenedBefore ? 'animate-pulse' : ''}`}
            >
              <MessageCircle size={26} />
            </button>
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-tight whitespace-nowrap pointer-events-none">
              Ask Tax AI
            </span>
            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask me anything about Tanzania tax
            </div>
          </div>
        </div>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-0 right-0 z-50 flex flex-col bg-gray-50 shadow-2xl border border-gray-200 overflow-hidden"
          style={{
            width: 'min(380px, 100vw)',
            height: 'min(520px, 85vh)',
            borderRadius: '16px 16px 0 0',
          }}
        >
          {/* Intro overlay */}
          {showIntro && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#1a5c38] text-white text-center px-6 rounded-t-2xl">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <MessageCircle size={28} />
              </div>
              <p className="font-semibold text-lg leading-snug">Powered by AI</p>
              <p className="text-green-200 text-sm mt-1">Your Tanzania Tax Expert</p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a5c38] text-white shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <MessageCircle size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight">Tax Assistant</p>
              <p className="text-green-200 text-[10px] leading-tight">Powered by AI — Tanzania Tax Expert</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(l => l === 'EN' ? 'SW' : 'EN')}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium"
                title="Toggle language"
              >
                <Globe size={11} />
                {language}
              </button>
              <button
                onClick={() => setShowSessions(s => !s)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors text-xs"
                title="Recent conversations"
              >
                History
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Sessions panel */}
          {showSessions && (
            <div className="absolute inset-0 top-[57px] z-10 bg-white flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <p className="font-semibold text-sm text-gray-700">Recent Conversations</p>
                <button onClick={startNewChat} className="text-xs text-[#1a5c38] font-medium hover:underline">
                  + New Chat
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {recentSessions.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center mt-8">No conversations yet</p>
                ) : (
                  recentSessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => loadSession(s.id)}
                      className="w-full text-left px-4 py-3 border-b hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm text-gray-800 truncate">{s.preview}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{s.messageCount} messages · {new Date(s.updatedAt).toLocaleDateString()}</p>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => setShowSessions(false)}
                className="px-4 py-3 text-sm text-gray-500 border-t hover:bg-gray-50 transition-colors text-center"
              >
                Back to chat
              </button>
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                msg={msg}
                onNavigate={path => { router.push(path); setOpen(false); }}
              />
            ))}

            {/* Quick replies after welcome */}
            {messages.length === 1 && messages[0].role === 'assistant' && !isStreaming && (
              <div className="flex flex-wrap gap-2 mt-2 pb-1">
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-1.5 bg-white border border-[#1a5c38] text-[#1a5c38] text-xs rounded-full hover:bg-[#1a5c38] hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {isStreaming && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Usage bar */}
          <div className="px-4 pb-1 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-gray-400">{usageCount} of {usageLimit} daily questions used</span>
              {atLimit && <span className="text-[10px] text-red-500 font-medium">Daily limit reached</span>}
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a5c38] rounded-full transition-all"
                style={{ width: `${Math.min((usageCount / usageLimit) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Input area */}
          <div className="px-3 pb-3 pt-2 bg-white border-t shrink-0">
            {atLimit ? (
              <div className="text-center py-2 text-xs text-gray-500">
                Daily limit reached. Questions reset at midnight.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Tanzania tax..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1a5c38] transition-colors max-h-24 overflow-y-auto"
                  disabled={isStreaming}
                  style={{ minHeight: '38px' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="w-9 h-9 rounded-xl bg-[#1a5c38] text-white flex items-center justify-center hover:bg-[#154d2f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            )}
            <p className="text-[9px] text-gray-400 text-center mt-1">Not professional tax advice</p>
          </div>
        </div>
      )}
    </>
  );
}
