import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Mic, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GlobalAIModal: React.FC = () => {
  const { isGlobalAIModalOpen, setIsGlobalAIModalOpen, triggerAIPromptFromAnywhere } = useApp();
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);

  if (!isGlobalAIModalOpen) return null;

  const quickChips = [
    'Plan a 4-day Goa trip under ₹40,000',
    'Find me a romantic dinner in Paris',
    'Optimize my remaining trip budget',
    'What are the best boutique stays in Kyoto?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    triggerAIPromptFromAnywhere(inputValue);
    setInputValue('');
  };

  const handleChipClick = (chip: string) => {
    triggerAIPromptFromAnywhere(chip);
  };

  const toggleMic = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setInputValue('Book a quiet sea-facing table in Assagao for tonight');
        setIsListening(false);
      }, 1800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-voyage-dark/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-luxury border border-voyage-border overflow-hidden p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-voyage-dark text-voyage-gold shadow-soft-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif-luxury text-xl font-bold text-voyage-dark">Voyage Autonomous AI</h3>
              <p className="text-xs text-voyage-muted">Autonomous travel curation with Razorpay-powered spend guardrails</p>
            </div>
          </div>
          <button
            onClick={() => setIsGlobalAIModalOpen(false)}
            className="p-2 rounded-full hover:bg-voyage-bg text-voyage-muted hover:text-voyage-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative mb-6">
          <div className="relative flex items-center rounded-2xl border-2 border-voyage-border focus-within:border-voyage-dark bg-voyage-bg/50 transition-all p-2 pl-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask Voyage anything... (e.g. Plan my Goa trip or optimize budget)"
              className="w-full bg-transparent text-voyage-dark placeholder-voyage-lightMuted text-sm md:text-base outline-none pr-24"
              autoFocus
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleMic}
                title="Voice Dictation"
                className={`p-2 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-rose-500 text-white animate-pulse' 
                    : 'text-voyage-muted hover:text-voyage-dark hover:bg-white'
                }`}
              >
                <Mic className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-3.5 py-2 rounded-xl bg-voyage-dark text-white hover:bg-voyage-slate disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 text-xs font-semibold shadow-soft-xs"
              >
                <span>Send</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          {isListening && (
            <p className="text-[11px] text-rose-600 font-medium mt-1.5 ml-2 animate-pulse">
              Listening to your request...
            </p>
          )}
        </form>

        {/* Quick prompt chips */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-voyage-muted">
            Suggested Prompts
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleChipClick(chip)}
                className="text-left p-3 rounded-xl border border-voyage-border/80 hover:border-voyage-gold/60 hover:bg-amber-50/30 text-xs font-medium text-voyage-slate hover:text-voyage-dark transition-all flex items-center justify-between group"
              >
                <span>{chip}</span>
                <Sparkles className="w-3 h-3 text-voyage-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>

        {/* Bottom guarantee */}
        <div className="mt-6 pt-4 border-t border-voyage-border/60 flex items-center justify-between text-[11px] text-voyage-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Always asks for approval before booking or executing spends</span>
          </div>
          <span className="font-semibold text-voyage-dark">Razorpay Guardrail Active</span>
        </div>
      </div>
    </div>
  );
};
