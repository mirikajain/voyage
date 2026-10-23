import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Mic, Clock, ShieldCheck, AlertCircle, Bot } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { RecommendationView } from './RecommendationView';

export const AgentChatStream: React.FC = () => {
  const { chatMessages, sendUserMessage, isAgentRunning, userProfile, activeRecommendationResult, currentAIMode } = useApp();
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isAgentRunning, activeRecommendationResult]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isAgentRunning) return;
    sendUserMessage(inputText);
    setInputText('');
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isAgentRunning) return;
    sendUserMessage(prompt);
  };

  const toggleMic = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setInputText('Plan a 4-day Goa trip under ₹40,000');
        setIsListening(false);
      }, 1500);
    }
  };

  const getModeBadge = () => {
    if (currentAIMode === 'llm') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-900 border border-amber-300/60 text-[11px] font-bold shadow-soft-xs">
          <Sparkles className="w-3.5 h-3.5 text-voyage-gold" />
          <span>Voyage AI</span>
        </div>
      );
    } else if (currentAIMode === 'fallback') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-bold shadow-soft-xs">
          <Bot className="w-3.5 h-3.5 text-slate-500" />
          <span>Voyage AI · Fallback</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-voyage-bg border border-voyage-border text-[11px] text-voyage-slate font-medium shadow-soft-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Voyage Demo Mode</span>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-voyage-border/80 shadow-soft-sm overflow-hidden">
      {/* Top Brand Header: VOYAGE ✦ */}
      <div className="px-6 py-4 border-b border-voyage-border/80 flex items-center justify-between bg-white/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-voyage-dark text-voyage-gold flex items-center justify-center shadow-soft-xs font-serif-luxury font-bold text-base">
            V
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif-luxury text-xl font-bold tracking-wider text-voyage-dark">VOYAGE</span>
              <span className="text-voyage-gold font-bold text-sm">✦</span>
            </div>
            <p className="text-[11px] text-voyage-muted">Autonomous Travel Concierge & Financial Layer</p>
          </div>
        </div>

        {/* Subtle AI Mode Badge */}
        <div>
          {getModeBadge()}
        </div>
      </div>

      {/* Messages & Recommendations Stream */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {chatMessages.map((msg) => {
          const isAgent = msg.sender === 'agent';

          return (
            <div 
              key={msg.id}
              className={`flex gap-3.5 ${isAgent ? 'items-start' : 'items-start flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-soft-xs ${
                isAgent 
                  ? 'bg-voyage-dark text-voyage-gold' 
                  : 'bg-voyage-bg border border-voyage-border text-voyage-dark overflow-hidden'
              }`}>
                {isAgent ? (
                  <Sparkles className="w-4 h-4" />
                ) : (
                  <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
                )}
              </div>

              {/* Message Content */}
              <div className={`space-y-2 max-w-[90%] sm:max-w-[85%] ${isAgent ? '' : 'text-right'}`}>
                <div className={`inline-block p-4 rounded-2xl text-xs sm:text-sm leading-relaxed text-left ${
                  isAgent
                    ? msg.isBudgetWarning 
                      ? 'bg-amber-50 text-amber-950 border border-amber-300 shadow-soft-xs'
                      : 'bg-voyage-bg text-voyage-dark border border-voyage-border/80 shadow-soft-xs'
                    : 'bg-voyage-dark text-white shadow-soft-sm'
                }`}>
                  {msg.isBudgetWarning && (
                    <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-1">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Budget Analysis Notice</span>
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>

                <div className={`flex items-center gap-1.5 text-[10px] text-voyage-muted ${isAgent ? '' : 'justify-end'}`}>
                  <Clock className="w-3 h-3" />
                  <span>{msg.timestamp}</span>
                </div>

                {/* Quick Prompts under agent responses */}
                {isAgent && msg.quickPrompts && msg.quickPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50/60 border border-voyage-border hover:border-voyage-gold/50 text-voyage-slate hover:text-voyage-dark transition-all flex items-center gap-1 shadow-soft-xs"
                      >
                        <span className="text-voyage-gold font-bold">✦</span>
                        <span>{prompt}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Agent Processing Indicator */}
        {isAgentRunning && (
          <div className="flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-full bg-voyage-dark text-voyage-gold flex items-center justify-center flex-shrink-0 shadow-soft-xs">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-voyage-bg border border-voyage-border/80 space-y-2 max-w-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-voyage-dark">Voyage is executing agent workflow</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-voyage-gold animate-bounce delay-200" />
                </div>
              </div>
              <p className="text-[11px] text-voyage-muted">
                Searching partner hotels, flights, dining and activities...
              </p>
            </div>
          </div>
        )}

        {/* Render Eventual Recommendation Card in stream */}
        {activeRecommendationResult && (
          <div className="pt-2">
            <RecommendationView />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSend} className="p-4 bg-voyage-bg/70 border-t border-voyage-border/80">
        <div className="relative flex items-center rounded-2xl border-2 border-voyage-border focus-within:border-voyage-dark bg-white transition-all p-2 pl-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Instruct Voyage (e.g. Plan a 4-day Goa trip under ₹40,000)..."
            disabled={isAgentRunning}
            className="w-full bg-transparent text-voyage-dark placeholder-voyage-lightMuted text-xs sm:text-sm outline-none pr-20"
          />
          <div className="absolute right-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleMic}
              title="Voice Dictation"
              className={`p-1.5 rounded-xl transition-all ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'text-voyage-muted hover:text-voyage-dark hover:bg-voyage-bg'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              type="submit"
              disabled={!inputText.trim() || isAgentRunning}
              className="p-2 rounded-xl bg-voyage-dark text-white hover:bg-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-soft-xs"
            >
              <Send className="w-3.5 h-3.5 text-voyage-gold" />
            </button>
          </div>
        </div>
        {isListening && (
          <p className="text-[11px] text-rose-600 font-medium mt-1 ml-2 animate-pulse">
            Listening for travel instructions...
          </p>
        )}
      </form>
    </div>
  );
};
