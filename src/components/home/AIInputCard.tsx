import React, { useState } from 'react';
import { Sparkles, Mic, ArrowRight, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AIInputCard: React.FC = () => {
  const { triggerAIPromptFromAnywhere } = useApp();
  const [prompt, setPrompt] = useState('');
  const [isListening, setIsListening] = useState(false);

  const samplePrompts = [
    'Plan a 4-day Goa trip under ₹40,000',
    'Find me a romantic dinner in Paris',
    'Optimize my remaining trip budget',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    triggerAIPromptFromAnywhere(prompt);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setPrompt('Find me a romantic dinner in Paris near Eiffel Tower');
        setIsListening(false);
      }, 1500);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-voyage-border/80 shadow-soft-md hover:border-voyage-gold/40 transition-all duration-300 relative overflow-hidden group">
      {/* Subtle ambient luxury gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-100/30 via-rose-50/20 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-voyage-dark text-voyage-gold shadow-soft-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-voyage-slate">
            Autonomous Travel Concierge
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-voyage-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Razorpay Financial Guardrails Active</span>
        </div>
      </div>

      {/* Input Box Form */}
      <form onSubmit={handleSubmit} className="relative mb-5">
        <div className="relative flex items-center rounded-2xl border-2 border-voyage-border focus-within:border-voyage-dark bg-voyage-bg/60 transition-all p-2.5 sm:p-3 pl-4 sm:pl-5">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask Voyage anything..."
            className="w-full bg-transparent text-voyage-dark placeholder-voyage-lightMuted text-base sm:text-lg outline-none pr-28 sm:pr-32 font-normal"
          />
          <div className="absolute right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoice}
              title="Voice Dictation"
              className={`p-2 sm:p-2.5 rounded-xl transition-all ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse' 
                  : 'text-voyage-muted hover:text-voyage-dark hover:bg-white'
              }`}
            >
              <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="px-4 py-2 sm:py-2.5 rounded-xl bg-voyage-dark text-white hover:bg-voyage-slate disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold shadow-soft-sm"
            >
              <span>Ask</span>
              <ArrowRight className="w-4 h-4 text-voyage-gold" />
            </button>
          </div>
        </div>
        {isListening && (
          <p className="text-xs text-rose-600 font-medium mt-2 ml-3 animate-pulse">
            Listening for your destination or budget instruction...
          </p>
        )}
      </form>

      {/* Placeholder Example Chips */}
      <div>
        <p className="text-xs font-semibold text-voyage-muted uppercase tracking-wider mb-2.5">
          Quick Inquiries
        </p>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((example, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => triggerAIPromptFromAnywhere(example)}
              className="px-3.5 py-2 rounded-xl bg-voyage-bg hover:bg-amber-50 hover:border-voyage-gold/50 border border-voyage-border text-xs sm:text-sm font-medium text-voyage-slate hover:text-voyage-dark transition-all duration-200 flex items-center gap-1.5"
            >
              <span className="text-voyage-gold font-bold">✦</span>
              <span>"{example}"</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
